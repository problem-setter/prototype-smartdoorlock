package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/personalism/smart-door-lock/backend/internal/models"
	"github.com/personalism/smart-door-lock/backend/internal/repository"
	"github.com/personalism/smart-door-lock/backend/internal/websocket"
)

type MQTTPublisher interface {
	PublishCommand(topic string, cmd models.CommandPayload) error
}

type RoomService struct {
	roomRepo    *repository.RoomRepository
	logRepo     *repository.LogRepository
	userRepo    *repository.UserRepository
	wsHub       *websocket.Hub
	mqttPub     MQTTPublisher
	relockTimer map[string]*time.Timer
	timerMu     sync.Mutex
}

func NewRoomService(
	roomRepo *repository.RoomRepository,
	logRepo *repository.LogRepository,
	userRepo *repository.UserRepository,
	wsHub *websocket.Hub,
	mqttPub MQTTPublisher,
) *RoomService {
	return &RoomService{
		roomRepo:    roomRepo,
		logRepo:     logRepo,
		userRepo:    userRepo,
		wsHub:       wsHub,
		mqttPub:     mqttPub,
		relockTimer: make(map[string]*time.Timer),
	}
}

func (s *RoomService) SetMQTTPublisher(mqttPub MQTTPublisher) {
	s.mqttPub = mqttPub
}

func (s *RoomService) ListRooms(ctx context.Context) ([]models.Room, error) {
	return s.roomRepo.ListAll(ctx)
}

func (s *RoomService) GetRoom(ctx context.Context, id string) (*models.Room, error) {
	room, err := s.roomRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if room == nil {
		return nil, errors.New("room not found")
	}
	return room, nil
}

// RemoteUnlock (Scenario 8 & Scenario 1: Solenoid opens, relay ON, auto-relock 5s)
func (s *RoomService) RemoteUnlock(ctx context.Context, roomID string, operator *models.User, reason string) (*models.Room, error) {
	room, err := s.roomRepo.FindByID(ctx, roomID)
	if err != nil {
		return nil, err
	}
	if room == nil {
		return nil, errors.New("ruangan tidak ditemukan")
	}

	// Update room state in database
	if err := s.roomRepo.UpdateLockState(ctx, room.ID, models.LockUnlocked, models.RelayOn); err != nil {
		return nil, fmt.Errorf("failed to update room lock state: %w", err)
	}

	userName := "Superadmin"
	userRole := models.RoleSuperadmin
	userID := "system"
	if operator != nil {
		userName = operator.Name
		userRole = operator.Role
		userID = operator.ID
	}

	_ = s.roomRepo.RecordAccess(ctx, room.ID, userName)

	// Create audit log
	eventID := fmt.Sprintf("EVT-REMOTE-%s-%s", time.Now().Format("20060102150405"), uuid.New().String()[:4])
	auditLog := &models.AccessLog{
		ID:                "log-" + uuid.New().String()[:8],
		EventID:           eventID,
		DeviceID:          room.DeviceID,
		RoomID:            &room.ID,
		RoomName:          room.Name,
		UserID:            &userID,
		UserName:          &userName,
		UserRole:          &userRole,
		ActivityType:      models.ActivityRemoteUnlock,
		AuthResult:        models.AuthResultSuccess,
		DoorStatusAtEvent: nil,
		Details:           fmt.Sprintf("Buka kunci jarak jauh via Dashboard oleh %s (%s). Alasan: %s", userName, userRole, reason),
		Timestamp:         time.Now().UTC(),
	}
	_ = s.logRepo.Create(ctx, auditLog)

	// Send MQTT Command to hardware ESP32 if publisher is configured
	if s.mqttPub != nil {
		cmdTopic := fmt.Sprintf("doorlock/%s/cmd/unlock", room.DeviceID)
		cmdPayload := models.CommandPayload{
			Command:   models.CmdUnlock,
			DeviceID:  room.DeviceID,
			Nonce:     uuid.New().String()[:8],
			Duration:  5,
			Triggered: userName,
			Timestamp: time.Now().UTC().Unix(),
		}
		if err := s.mqttPub.PublishCommand(cmdTopic, cmdPayload); err != nil {
			log.Printf("⚠️ [MQTT] Failed to publish unlock command: %v", err)
		}
	}

	// Fetch updated room
	updatedRoom, _ := s.roomRepo.FindByID(ctx, roomID)
	if updatedRoom != nil && s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventRoomUpdated, updatedRoom)
		s.wsHub.BroadcastEvent(models.WSEventLogCreated, auditLog)
	}

	// Schedule 5-second automatic relock
	s.timerMu.Lock()
	if timer, exists := s.relockTimer[roomID]; exists {
		timer.Stop()
	}
	s.relockTimer[roomID] = time.AfterFunc(5*time.Second, func() {
		s.AutoRelock(roomID)
	})
	s.timerMu.Unlock()

	return updatedRoom, nil
}

// AutoRelock resets lock status to LOCKED and relay to OFF after 5 seconds
func (s *RoomService) AutoRelock(roomID string) {
	bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_ = s.roomRepo.UpdateLockState(bgCtx, roomID, models.LockLocked, models.RelayOff)
	updatedRoom, err := s.roomRepo.FindByID(bgCtx, roomID)
	if err == nil && updatedRoom != nil && s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventRoomUpdated, updatedRoom)
	}
}

// ForceLock immediately locks the room
func (s *RoomService) ForceLock(ctx context.Context, roomID string) (*models.Room, error) {
	s.timerMu.Lock()
	if timer, exists := s.relockTimer[roomID]; exists {
		timer.Stop()
		delete(s.relockTimer, roomID)
	}
	s.timerMu.Unlock()

	if err := s.roomRepo.UpdateLockState(ctx, roomID, models.LockLocked, models.RelayOff); err != nil {
		return nil, err
	}

	room, err := s.roomRepo.FindByID(ctx, roomID)
	if err != nil {
		return nil, err
	}

	if s.mqttPub != nil && room != nil {
		cmdTopic := fmt.Sprintf("doorlock/%s/cmd/lock", room.DeviceID)
		_ = s.mqttPub.PublishCommand(cmdTopic, models.CommandPayload{
			Command:   models.CmdLock,
			DeviceID:  room.DeviceID,
			Nonce:     uuid.New().String()[:8],
			Timestamp: time.Now().UTC().Unix(),
		})
	}

	if s.wsHub != nil && room != nil {
		s.wsHub.BroadcastEvent(models.WSEventRoomUpdated, room)
	}

	return room, nil
}

// ClearAlarm clears the active buzzer/alarm state (Scenario 5)
func (s *RoomService) ClearAlarm(ctx context.Context, roomID string, clearedBy string) (*models.Room, error) {
	if err := s.roomRepo.UpdateAlarmState(ctx, roomID, false); err != nil {
		return nil, err
	}

	room, err := s.roomRepo.FindByID(ctx, roomID)
	if err != nil {
		return nil, err
	}

	// Create audit log for alarm cleared
	eventID := fmt.Sprintf("EVT-ALARM-CLR-%s-%s", time.Now().Format("20060102150405"), uuid.New().String()[:4])
	auditLog := &models.AccessLog{
		ID:                "log-" + uuid.New().String()[:8],
		EventID:           eventID,
		DeviceID:          room.DeviceID,
		RoomID:            &room.ID,
		RoomName:          room.Name,
		ActivityType:      models.ActivityAlarmCleared,
		AuthResult:        models.AuthResultSystem,
		DoorStatusAtEvent: nil,
		Details:           fmt.Sprintf("Alarm disetel ulang / dinonaktifkan oleh %s", clearedBy),
		Timestamp:         time.Now().UTC(),
	}
	_ = s.logRepo.Create(ctx, auditLog)

	if s.mqttPub != nil && room != nil {
		cmdPayload := models.CommandPayload{
			Command:   models.CmdClearAlarm,
			DeviceID:  room.DeviceID,
			Nonce:     uuid.New().String()[:8],
			Timestamp: time.Now().UTC().Unix(),
		}
		// Dual publish: primary topic cmd/clear_alarm and backward-compatible alias cmd/alarm
		_ = s.mqttPub.PublishCommand(fmt.Sprintf("doorlock/%s/cmd/clear_alarm", room.DeviceID), cmdPayload)
		_ = s.mqttPub.PublishCommand(fmt.Sprintf("doorlock/%s/cmd/alarm", room.DeviceID), cmdPayload)
	}

	if s.wsHub != nil && room != nil {
		s.wsHub.BroadcastEvent(models.WSEventAlarmCleared, map[string]any{"roomId": roomID, "clearedBy": clearedBy})
		s.wsHub.BroadcastEvent(models.WSEventRoomUpdated, room)
		s.wsHub.BroadcastEvent(models.WSEventLogCreated, auditLog)
	}

	return room, nil
}

func (s *RoomService) UpdateSettings(ctx context.Context, roomID string, req *models.UpdateRoomSettingsRequest) (*models.Room, error) {
	if err := s.roomRepo.UpdateSettings(ctx, roomID, req); err != nil {
		return nil, err
	}

	room, err := s.roomRepo.FindByID(ctx, roomID)
	if err != nil {
		return nil, err
	}

	if s.wsHub != nil && room != nil {
		s.wsHub.BroadcastEvent(models.WSEventRoomUpdated, room)
	}

	return room, nil
}

func (s *RoomService) RequestAccess(ctx context.Context, userID string, roomID string, reason string) error {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil || user == nil {
		return errors.New("user not found")
	}

	room, err := s.roomRepo.FindByID(ctx, roomID)
	if err != nil || room == nil {
		return errors.New("room not found")
	}

	// Record requested room
	_, _ = s.userRepo.GetRequestedRoomIDs(ctx, userID)

	// Broadcast access request to admins
	if s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventUserUpdated, map[string]any{
			"type":      "ACCESS_REQUEST",
			"userId":    userID,
			"userName":  user.Name,
			"roomId":    roomID,
			"roomName":  room.Name,
			"reason":    reason,
			"timestamp": time.Now().UTC(),
		})
	}

	return nil
}
