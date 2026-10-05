package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/personalism/smart-door-lock/backend/internal/models"
	"github.com/personalism/smart-door-lock/backend/internal/repository"
	"github.com/personalism/smart-door-lock/backend/internal/websocket"
)

type HardwareService struct {
	roomRepo *repository.RoomRepository
	userRepo *repository.UserRepository
	wsHub    *websocket.Hub
	mqttPub  MQTTPublisher
}

func NewHardwareService(
	roomRepo *repository.RoomRepository,
	userRepo *repository.UserRepository,
	wsHub *websocket.Hub,
	mqttPub MQTTPublisher,
) *HardwareService {
	return &HardwareService{
		roomRepo: roomRepo,
		userRepo: userRepo,
		wsHub:    wsHub,
		mqttPub:  mqttPub,
	}
}

func (s *HardwareService) StartEnrollment(ctx context.Context, deviceOrRoomID string, templateID int, userID string) error {
	room, err := s.roomRepo.FindByDeviceID(ctx, deviceOrRoomID)
	if err != nil || room == nil {
		room, err = s.roomRepo.FindByID(ctx, deviceOrRoomID)
		if err != nil || room == nil {
			return errors.New("ruangan atau perangkat tidak ditemukan")
		}
	}

	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil || user == nil {
		return errors.New("pengguna tidak ditemukan")
	}

	if templateID < 1 || templateID > 120 {
		return errors.New("slot template sidik jari harus antara 1-120")
	}

	if s.mqttPub != nil {
		cmdTopic := fmt.Sprintf("doorlock/%s/cmd/enroll", room.DeviceID)
		cmdPayload := models.CommandPayload{
			Command:    "START_ENROLL",
			TemplateID: &templateID,
			UserID:     &userID,
			UserName:   &user.Name,
			Timestamp:  time.Now().UTC().Unix(),
		}
		if err := s.mqttPub.PublishCommand(cmdTopic, cmdPayload); err != nil {
			return fmt.Errorf("gagal mengirim perintah enrollment ke MQTT: %w", err)
		}
	}

	if s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventEnrollStatus, models.EnrollStatusPayload{
			DeviceID:   room.DeviceID,
			TemplateID: templateID,
			UserID:     &userID,
			Step:       models.EnrollStepWaitFinger1,
			Progress:   10,
			Message:    "Tempelkan jari pertama kali pada sensor DY50...",
			Success:    false,
			Timestamp:  time.Now().UTC().Unix(),
		})
	}

	return nil
}

func (s *HardwareService) CancelEnrollment(ctx context.Context, deviceOrRoomID string) error {
	room, err := s.roomRepo.FindByDeviceID(ctx, deviceOrRoomID)
	if err != nil || room == nil {
		room, err = s.roomRepo.FindByID(ctx, deviceOrRoomID)
		if err != nil || room == nil {
			return errors.New("ruangan atau perangkat tidak ditemukan")
		}
	}

	if s.mqttPub != nil {
		cmdTopic := fmt.Sprintf("doorlock/%s/cmd/enroll", room.DeviceID)
		cmdPayload := models.CommandPayload{
			Command:   "CANCEL_ENROLL",
			Timestamp: time.Now().UTC().Unix(),
		}
		_ = s.mqttPub.PublishCommand(cmdTopic, cmdPayload)
	}

	if s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventEnrollStatus, map[string]any{
			"deviceId": room.DeviceID,
			"step":     "CANCELLED",
			"message":  "Proses pendaftaran sidik jari dibatalkan",
		})
	}

	return nil
}
