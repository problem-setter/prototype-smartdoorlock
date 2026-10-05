package mqtt

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/personalism/smart-door-lock/backend/internal/models"
	"github.com/personalism/smart-door-lock/backend/internal/repository"
	"github.com/personalism/smart-door-lock/backend/internal/service"
	"github.com/personalism/smart-door-lock/backend/internal/websocket"
)

type MQTTDispatcher struct {
	roomRepo    *repository.RoomRepository
	userRepo    *repository.UserRepository
	logRepo     *repository.LogRepository
	roomService *service.RoomService
	wsHub       *websocket.Hub
	seenEvents  map[string]time.Time
	eventMu     sync.Mutex
}

func NewMQTTDispatcher(
	roomRepo *repository.RoomRepository,
	userRepo *repository.UserRepository,
	logRepo *repository.LogRepository,
	roomService *service.RoomService,
	wsHub *websocket.Hub,
) *MQTTDispatcher {
	d := &MQTTDispatcher{
		roomRepo:    roomRepo,
		userRepo:    userRepo,
		logRepo:     logRepo,
		roomService: roomService,
		wsHub:       wsHub,
		seenEvents:  make(map[string]time.Time),
	}

	// Periodic cleanup of deduplication cache
	go d.cleanupSeenEvents()

	return d
}

func (d *MQTTDispatcher) cleanupSeenEvents() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		d.eventMu.Lock()
		now := time.Now()
		for id, t := range d.seenEvents {
			if now.Sub(t) > 10*time.Minute {
				delete(d.seenEvents, id)
			}
		}
		d.eventMu.Unlock()
	}
}

func (d *MQTTDispatcher) isDuplicate(eventID string) bool {
	if eventID == "" {
		return false
	}
	d.eventMu.Lock()
	defer d.eventMu.Unlock()

	if _, exists := d.seenEvents[eventID]; exists {
		return true
	}
	d.seenEvents[eventID] = time.Now()
	return false
}

func (d *MQTTDispatcher) HandleMessage(topic string, payload []byte) {
	parts := strings.Split(topic, "/")
	if len(parts) < 3 || parts[0] != "doorlock" {
		return
	}

	deviceID := parts[1]
	subTopic := parts[2]
	if len(parts) > 3 {
		subTopic = strings.Join(parts[2:], "/")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	switch subTopic {
	case "access":
		d.handleAccessEvent(ctx, deviceID, payload)
	case "door":
		d.handleDoorEvent(ctx, deviceID, payload)
	case "alarm":
		d.handleAlarmEvent(ctx, deviceID, payload)
	case "status":
		d.handleStatusEvent(ctx, deviceID, payload)
	case "enroll/status":
		d.handleEnrollStatus(ctx, deviceID, payload)
	default:
		log.Printf("ℹ️ [MQTT] Received unhandled subtopic %s from device %s", subTopic, deviceID)
	}
}

// Scenario 1 & 2 & 13: Fingerprint Authentication & Deduplication
func (d *MQTTDispatcher) handleAccessEvent(ctx context.Context, deviceID string, payload []byte) {
	var evt models.AccessEventPayload
	if err := json.Unmarshal(payload, &evt); err != nil {
		log.Printf("❌ [MQTT] Invalid access event payload: %v", err)
		return
	}

	// Scenario 13: Deduplication check
	if d.isDuplicate(evt.EventID) {
		log.Printf("⚠️ [MQTT] Duplicate access event ignored: %s", evt.EventID)
		return
	}

	room, err := d.roomRepo.FindByDeviceID(ctx, deviceID)
	if err != nil || room == nil {
		log.Printf("⚠️ [MQTT] Room not found for device %s", deviceID)
		return
	}

	// Find user associated with fingerprint template ID if present
	var user *models.User
	var userName string
	var userRole *models.UserRole
	var userID *string

	if evt.TemplateID != nil && *evt.TemplateID > 0 {
		user, _ = d.userRepo.FindByFingerprintTemplateID(ctx, *evt.TemplateID)
		if user != nil {
			userName = user.Name
			userRole = &user.Role
			userID = &user.ID
		}
	} else if evt.UserID != nil && *evt.UserID != "" {
		user, _ = d.userRepo.FindByID(ctx, *evt.UserID)
		if user != nil {
			userName = user.Name
			userRole = &user.Role
			userID = &user.ID
		}
	}

	authResult := models.AuthResult(evt.AuthResult)
	if authResult == "" {
		if evt.Granted {
			authResult = models.AuthResultSuccess
		} else {
			authResult = models.AuthResultFailed
		}
	}

	// Double check user status and validity if authorized by edge node
	if user != nil && authResult == models.AuthResultSuccess {
		if user.Status != models.UserStatusActive {
			authResult = models.AuthResultDenied
		}
		if user.ValidUntil != nil && time.Now().After(*user.ValidUntil) {
			authResult = models.AuthResultDenied
		}
	}

	eventTime := time.Now().UTC()
	if evt.Timestamp > 0 {
		eventTime = time.Unix(evt.Timestamp, 0).UTC()
	}

	// Determine log details
	details := evt.Details
	if details == "" {
		if authResult == models.AuthResultSuccess {
			details = fmt.Sprintf("Akses diterima via Sidik Jari DY50 Slot #%d (%s - %s)",
				safeInt(evt.TemplateID), userName, safeStr(userRole))
		} else if authResult == models.AuthResultDenied {
			details = fmt.Sprintf("Akses ditolak: status akun %s (%s)", user.Status, userName)
		} else {
			details = fmt.Sprintf("Akses ditolak: Sidik jari DY50 slot #%d tidak terdaftar", safeInt(evt.TemplateID))
		}
	}

	// Create Access Log in PostgreSQL
	accessLog := &models.AccessLog{
		ID:                    "log-" + uuid.New().String()[:8],
		EventID:               evt.EventID,
		DeviceID:              deviceID,
		RoomID:                &room.ID,
		RoomName:              room.Name,
		UserID:                userID,
		UserName:              &userName,
		UserRole:              userRole,
		FingerprintTemplateID: evt.TemplateID,
		ActivityType:          models.ActivityFingerprintAuth,
		AuthResult:            authResult,
		DoorStatusAtEvent:     nil,
		Details:               details,
		Timestamp:             eventTime,
	}
	_ = d.logRepo.Create(ctx, accessLog)

	// Scenario 1: If access granted, unlock room & trigger 5-second auto-relock
	if authResult == models.AuthResultSuccess {
		_ = d.roomRepo.UpdateLockState(ctx, room.ID, models.LockUnlocked, models.RelayOn)
		_ = d.roomRepo.RecordAccess(ctx, room.ID, userName)

		updatedRoom, _ := d.roomRepo.FindByID(ctx, room.ID)
		if updatedRoom != nil && d.wsHub != nil {
			d.wsHub.BroadcastEvent(models.WSEventRoomUpdated, updatedRoom)
		}

		// Auto-relock after 5s
		go func(rID string) {
			time.Sleep(5 * time.Second)
			d.roomService.AutoRelock(rID)
		}(room.ID)
	}

	// Broadcast log to WebSocket
	if d.wsHub != nil {
		d.wsHub.BroadcastEvent(models.WSEventLogCreated, accessLog)
	}
}

// Scenario 3, 4, 5: MC-38 Reed switch door events
func (d *MQTTDispatcher) handleDoorEvent(ctx context.Context, deviceID string, payload []byte) {
	var evt models.DoorEventPayload
	if err := json.Unmarshal(payload, &evt); err != nil {
		log.Printf("❌ [MQTT] Invalid door event payload: %v", err)
		return
	}

	room, err := d.roomRepo.FindByDeviceID(ctx, deviceID)
	if err != nil || room == nil {
		return
	}

	doorStatus := models.DoorStatus(strings.ToUpper(evt.DoorStatus))
	if doorStatus != models.DoorOpen && doorStatus != models.DoorClosed {
		doorStatus = models.DoorClosed
	}

	_ = d.roomRepo.UpdateDoorState(ctx, room.ID, doorStatus, evt.OpenDuration)

	// Scenario 5: If door is closed, ensure alarm is cleared automatically
	if doorStatus == models.DoorClosed {
		_ = d.roomRepo.UpdateAlarmState(ctx, room.ID, false)
		if d.wsHub != nil {
			d.wsHub.BroadcastEvent(models.WSEventAlarmCleared, map[string]any{
				"roomId":   room.ID,
				"deviceId": deviceID,
				"reason":   "Door closed (reed switch engaged)",
			})
		}
	}

	// Broadcast updated room state
	updatedRoom, _ := d.roomRepo.FindByID(ctx, room.ID)
	if updatedRoom != nil && d.wsHub != nil {
		d.wsHub.BroadcastEvent(models.WSEventRoomUpdated, updatedRoom)
	}
}

// Scenario 4 & 5: Buzzer Alarm Events
func (d *MQTTDispatcher) handleAlarmEvent(ctx context.Context, deviceID string, payload []byte) {
	var evt models.AlarmEventPayload
	if err := json.Unmarshal(payload, &evt); err != nil {
		log.Printf("❌ [MQTT] Invalid alarm event payload: %v", err)
		return
	}

	room, err := d.roomRepo.FindByDeviceID(ctx, deviceID)
	if err != nil || room == nil {
		return
	}

	isTriggered := strings.EqualFold(evt.AlarmState, "TRIGGERED") || evt.AlarmState == "ACTIVE"
	_ = d.roomRepo.UpdateAlarmState(ctx, room.ID, isTriggered)

	// Log alarm event
	activityType := models.ActivityAlarmTriggered
	if !isTriggered {
		activityType = models.ActivityAlarmCleared
	}

	eventID := evt.EventID
	if eventID == "" {
		eventID = fmt.Sprintf("EVT-ALARM-%s-%s", time.Now().Format("20060102150405"), uuid.New().String()[:4])
	}

	auditLog := &models.AccessLog{
		ID:                "log-" + uuid.New().String()[:8],
		EventID:           eventID,
		DeviceID:          deviceID,
		RoomID:            &room.ID,
		RoomName:          room.Name,
		ActivityType:      activityType,
		AuthResult:        models.AuthResultSystem,
		DoorStatusAtEvent: nil,
		Details:           evt.Reason,
		Timestamp:         time.Now().UTC(),
	}
	_ = d.logRepo.Create(ctx, auditLog)

	updatedRoom, _ := d.roomRepo.FindByID(ctx, room.ID)
	if updatedRoom != nil && d.wsHub != nil {
		if isTriggered {
			d.wsHub.BroadcastEvent(models.WSEventAlarmTriggered, map[string]any{
				"roomId":       room.ID,
				"roomName":     room.Name,
				"reason":       evt.Reason,
				"openDuration": evt.OpenDuration,
				"timestamp":    time.Now().UTC(),
			})
		} else {
			d.wsHub.BroadcastEvent(models.WSEventAlarmCleared, map[string]any{
				"roomId":   room.ID,
				"roomName": room.Name,
			})
		}
		d.wsHub.BroadcastEvent(models.WSEventRoomUpdated, updatedRoom)
		d.wsHub.BroadcastEvent(models.WSEventLogCreated, auditLog)
	}
}

// Scenario 12: Device Status & Telemetry
func (d *MQTTDispatcher) handleStatusEvent(ctx context.Context, deviceID string, payload []byte) {
	var st models.StatusPayload
	if err := json.Unmarshal(payload, &st); err != nil {
		log.Printf("❌ [MQTT] Invalid status event payload: %v", err)
		return
	}

	devStatus := models.DeviceOnline
	if strings.EqualFold(st.Status, "OFFLINE") {
		devStatus = models.DeviceOffline
	}

	_ = d.roomRepo.UpdateTelemetry(ctx, deviceID, st.IPAddress, devStatus, st.UsedFingerprints)

	room, _ := d.roomRepo.FindByDeviceID(ctx, deviceID)
	if room != nil && d.wsHub != nil {
		d.wsHub.BroadcastEvent(models.WSEventRoomUpdated, room)
		d.wsHub.BroadcastEvent(models.WSEventDeviceStatus, map[string]any{
			"deviceId": deviceID,
			"roomId":   room.ID,
			"status":   devStatus,
			"ip":       st.IPAddress,
		})
	}
}

// Scenario 9: DY50 Biometric Enrollment Progression
func (d *MQTTDispatcher) handleEnrollStatus(ctx context.Context, deviceID string, payload []byte) {
	var enroll models.EnrollStatusPayload
	if err := json.Unmarshal(payload, &enroll); err != nil {
		log.Printf("❌ [MQTT] Invalid enroll status payload: %v", err)
		return
	}

	// If successfully stored in DY50 hardware, record into database
	isStoreSuccess := (enroll.Step == models.EnrollStepStoreOk || strings.EqualFold(enroll.Status, "STORE_OK") || enroll.StepNumber == 4) && enroll.Success
	if isStoreSuccess && enroll.UserID != nil && *enroll.UserID != "" {
		room, _ := d.roomRepo.FindByDeviceID(ctx, deviceID)
		var roomID *string
		if room != nil {
			roomID = &room.ID
		}

		label := fmt.Sprintf("Sidik Jari DY50 Slot #%d", enroll.TemplateID)
		_ = d.userRepo.AddFingerprint(ctx, *enroll.UserID, enroll.TemplateID, label, roomID)

		// Audit log for successful enrollment
		eventID := fmt.Sprintf("EVT-ENROLL-%s-%d", time.Now().Format("20060102150405"), enroll.TemplateID)
		auditLog := &models.AccessLog{
			ID:                    "log-" + uuid.New().String()[:8],
			EventID:               eventID,
			DeviceID:              deviceID,
			RoomID:                roomID,
			RoomName:              safeRoomName(room),
			UserID:                enroll.UserID,
			FingerprintTemplateID: &enroll.TemplateID,
			ActivityType:          models.ActivityEnrollmentSuccess,
			AuthResult:            models.AuthResultSuccess,
			Details:               fmt.Sprintf("Pendaftaran sidik jari slot #%d berhasil disimpan ke sensor DY50", enroll.TemplateID),
			Timestamp:             time.Now().UTC(),
		}
		_ = d.logRepo.Create(ctx, auditLog)

		if d.wsHub != nil {
			d.wsHub.BroadcastEvent(models.WSEventLogCreated, auditLog)
			updatedUser, _ := d.userRepo.FindByID(ctx, *enroll.UserID)
			if updatedUser != nil {
				d.wsHub.BroadcastEvent(models.WSEventUserUpdated, updatedUser)
			}
		}
	}

	// Broadcast step progress to UI modal
	if d.wsHub != nil {
		d.wsHub.BroadcastEvent(models.WSEventEnrollStatus, enroll)
	}
}

func safeInt(ptr *int) int {
	if ptr == nil {
		return 0
	}
	return *ptr
}

func safeStr(ptr *models.UserRole) string {
	if ptr == nil {
		return ""
	}
	return string(*ptr)
}

func safeRoomName(r *models.Room) string {
	if r == nil {
		return "Ruangan Node"
	}
	return r.Name
}
