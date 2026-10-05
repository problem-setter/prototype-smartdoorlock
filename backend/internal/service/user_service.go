package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/personalism/smart-door-lock/backend/internal/models"
	"github.com/personalism/smart-door-lock/backend/internal/repository"
	"github.com/personalism/smart-door-lock/backend/internal/websocket"
)

type UserService struct {
	userRepo *repository.UserRepository
	roomRepo *repository.RoomRepository
	wsHub    *websocket.Hub
	mqttPub  MQTTPublisher
}

func NewUserService(
	userRepo *repository.UserRepository,
	roomRepo *repository.RoomRepository,
	wsHub *websocket.Hub,
	mqttPub MQTTPublisher,
) *UserService {
	return &UserService{
		userRepo: userRepo,
		roomRepo: roomRepo,
		wsHub:    wsHub,
		mqttPub:  mqttPub,
	}
}

func (s *UserService) ListUsers(ctx context.Context) ([]models.User, error) {
	return s.userRepo.ListAll(ctx)
}

func (s *UserService) GetUser(ctx context.Context, id string) (*models.User, error) {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *UserService) CreateUser(ctx context.Context, req *models.CreateUserRequest) (*models.User, error) {
	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.Email) == "" {
		return nil, errors.New("name and email are required")
	}

	existingEmail, _ := s.userRepo.FindByIdentifier(ctx, req.Email)
	if existingEmail != nil {
		return nil, errors.New("email is already registered")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	now := time.Now().UTC()
	newUser := &models.User{
		ID:                "user-" + uuid.New().String()[:8],
		Name:              req.Name,
		Email:             req.Email,
		PasswordHash:      string(hashedPassword),
		Role:              req.Role,
		Status:            models.UserStatusActive,
		ValidFrom:         req.ValidFrom,
		ValidUntil:        req.ValidUntil,
		AccessibleRoomIDs: req.AccessibleRoomIDs,
		Fingerprints:      []models.FingerprintRecord{},
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	if err := s.userRepo.Create(ctx, newUser); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	if s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventUserUpdated, newUser)
	}

	return newUser, nil
}

func (s *UserService) UpdateUser(ctx context.Context, id string, req *models.UpdateUserRequest) (*models.User, error) {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.Status != nil {
		user.Status = *req.Status
	}
	if req.AccessibleRoomIDs != nil {
		user.AccessibleRoomIDs = *req.AccessibleRoomIDs
	}
	if req.ValidFrom != nil {
		user.ValidFrom = req.ValidFrom
	}
	if req.ValidUntil != nil {
		user.ValidUntil = req.ValidUntil
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	updated, err := s.userRepo.FindByID(ctx, id)
	if err == nil && updated != nil && s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventUserUpdated, updated)
	}

	return updated, nil
}

func (s *UserService) DeleteUser(ctx context.Context, id string) error {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil || user == nil {
		return errors.New("user not found")
	}

	// Delete from DB
	if err := s.userRepo.Delete(ctx, id); err != nil {
		return err
	}

	// If user had fingerprints, issue delete commands to relevant rooms
	if s.mqttPub != nil && len(user.Fingerprints) > 0 {
		for _, fp := range user.Fingerprints {
			cmdPayload := models.CommandPayload{
				Command:    models.CmdDeleteFingerprint,
				TemplateID: &fp.TemplateID,
				Timestamp:  time.Now().UTC().Unix(),
			}
			// Broadcast to all active rooms (both cmd/delete and cmd/enroll)
			rooms, _ := s.roomRepo.ListAll(ctx)
			for _, r := range rooms {
				cmdPayload.DeviceID = r.DeviceID
				_ = s.mqttPub.PublishCommand(fmt.Sprintf("doorlock/%s/cmd/delete", r.DeviceID), cmdPayload)
				_ = s.mqttPub.PublishCommand(fmt.Sprintf("doorlock/%s/cmd/enroll", r.DeviceID), cmdPayload)
			}
		}
	}

	if s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventUserUpdated, map[string]any{"action": "DELETE", "userId": id})
	}

	return nil
}

// ApproveRegistration sets status to ACTIVE and grants specified rooms
func (s *UserService) ApproveRegistration(ctx context.Context, id string, adminName string, req *models.ApproveUserRequest) (*models.User, error) {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	now := time.Now().UTC()
	user.Status = models.UserStatusActive
	user.AccessibleRoomIDs = req.ApprovedRoomIDs

	if req.ValidFrom != nil {
		user.ValidFrom = req.ValidFrom
	} else if user.ValidFrom == nil {
		user.ValidFrom = &now
	}
	if req.ValidUntil != nil {
		user.ValidUntil = req.ValidUntil
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to approve registration: %w", err)
	}

	updated, _ := s.userRepo.FindByID(ctx, id)
	if updated != nil && s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventUserUpdated, updated)
	}

	return updated, nil
}

func (s *UserService) RejectRegistration(ctx context.Context, id string, reason string) (*models.User, error) {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	user.Status = models.UserStatusRejected

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to reject user: %w", err)
	}

	updated, _ := s.userRepo.FindByID(ctx, id)
	if updated != nil && s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventUserUpdated, updated)
	}

	return updated, nil
}

func (s *UserService) SuspendUser(ctx context.Context, id string, reason string) (*models.User, error) {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	user.Status = models.UserStatusSuspended

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	updated, _ := s.userRepo.FindByID(ctx, id)
	if updated != nil && s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventUserUpdated, updated)
	}

	return updated, nil
}

func (s *UserService) ActivateUser(ctx context.Context, id string) (*models.User, error) {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	user.Status = models.UserStatusActive
	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	updated, _ := s.userRepo.FindByID(ctx, id)
	if updated != nil && s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventUserUpdated, updated)
	}

	return updated, nil
}

func (s *UserService) AddFingerprint(ctx context.Context, userID string, templateID int, label string, roomID *string) error {
	if templateID < 1 || templateID > 120 {
		return errors.New("nomor slot sidik jari DY50 harus berada di antara 1 dan 120")
	}

	if strings.TrimSpace(label) == "" {
		label = fmt.Sprintf("Sidik Jari DY50 Slot #%d", templateID)
	}

	if err := s.userRepo.AddFingerprint(ctx, userID, templateID, label, roomID); err != nil {
		return fmt.Errorf("gagal menambahkan data sidik jari: %w", err)
	}

	// Update room used fingerprints count if roomID is specified
	if roomID != nil {
		room, err := s.roomRepo.FindByID(ctx, *roomID)
		if err == nil && room != nil {
			_ = s.roomRepo.UpdateTelemetry(ctx, room.DeviceID, "", "", room.UsedFingerprints+1)
		}
	}

	updatedUser, _ := s.userRepo.FindByID(ctx, userID)
	if updatedUser != nil && s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventUserUpdated, updatedUser)
	}

	return nil
}

func (s *UserService) DeleteFingerprint(ctx context.Context, userID string, templateID int) error {
	if err := s.userRepo.DeleteFingerprint(ctx, userID, templateID); err != nil {
		return err
	}

	// Notify ESP32 hardware via MQTT to delete the template in optical sensor DY50
	if s.mqttPub != nil {
		cmdPayload := models.CommandPayload{
			Command:    models.CmdDeleteFingerprint,
			TemplateID: &templateID,
			Timestamp:  time.Now().UTC().Unix(),
		}
		rooms, _ := s.roomRepo.ListAll(ctx)
		for _, r := range rooms {
			cmdPayload.DeviceID = r.DeviceID
			_ = s.mqttPub.PublishCommand(fmt.Sprintf("doorlock/%s/cmd/delete", r.DeviceID), cmdPayload)
			_ = s.mqttPub.PublishCommand(fmt.Sprintf("doorlock/%s/cmd/enroll", r.DeviceID), cmdPayload)
		}
	}

	updatedUser, _ := s.userRepo.FindByID(ctx, userID)
	if updatedUser != nil && s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventUserUpdated, updatedUser)
	}

	return nil
}
