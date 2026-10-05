package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/personalism/smart-door-lock/backend/internal/middleware"
	"github.com/personalism/smart-door-lock/backend/internal/models"
	"github.com/personalism/smart-door-lock/backend/internal/repository"
	"github.com/personalism/smart-door-lock/backend/internal/websocket"
)

type AuthService struct {
	userRepo  *repository.UserRepository
	jwtSecret string
	wsHub     *websocket.Hub
}

func NewAuthService(userRepo *repository.UserRepository, jwtSecret string, wsHub *websocket.Hub) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
		wsHub:     wsHub,
	}
}

func (s *AuthService) Login(ctx context.Context, req *models.LoginRequest) (*models.LoginResponse, error) {
	identifier := strings.TrimSpace(req.Identifier)
	if identifier == "" {
		identifier = strings.TrimSpace(req.Email)
	}

	if identifier == "" || strings.TrimSpace(req.Password) == "" {
		return nil, errors.New("identifier/email and password are required")
	}

	user, err := s.userRepo.FindByIdentifier(ctx, identifier)
	if err != nil {
		return nil, fmt.Errorf("error finding user: %w", err)
	}
	if user == nil {
		return nil, errors.New("kredensial tidak valid: akun tidak ditemukan")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("kredensial tidak valid: kata sandi salah")
	}

	if user.Status == models.UserStatusPending {
		return nil, errors.New("akun Anda masih dalam status PENDING menunggu persetujuan Superadmin/Admin")
	}
	if user.Status == models.UserStatusRejected {
		return nil, errors.New("pengajuan akun Anda telah ditolak oleh Admin")
	}
	if user.Status == models.UserStatusSuspended {
		return nil, errors.New("akun Anda sedang dinonaktifkan (SUSPENDED)")
	}
	if user.Status == models.UserStatusExpired {
		return nil, errors.New("masa berlaku akses akun Anda telah berakhir (EXPIRED)")
	}

	// Check validity date
	if user.ValidUntil != nil && time.Now().After(*user.ValidUntil) {
		user.Status = models.UserStatusExpired
		_ = s.userRepo.Update(ctx, user)
		return nil, errors.New("masa berlaku akses akun Anda telah berakhir (EXPIRED)")
	}

	token, err := middleware.GenerateJWT(user, s.jwtSecret, 24*time.Hour)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &models.LoginResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *AuthService) Register(ctx context.Context, req *models.RegisterRequest) (*models.User, error) {
	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.Email) == "" {
		return nil, errors.New("nama dan email wajib diisi")
	}

	existingEmail, _ := s.userRepo.FindByIdentifier(ctx, req.Email)
	if existingEmail != nil {
		return nil, errors.New("email sudah terdaftar dalam sistem")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	role := req.Role
	if role == "" {
		role = models.RoleUser
	}

	now := time.Now().UTC()

	newUser := &models.User{
		ID:                "user-" + uuid.New().String()[:8],
		Name:              req.Name,
		Email:             req.Email,
		PasswordHash:      string(hashedPassword),
		Role:              role,
		Status:            models.UserStatusPending,
		ValidFrom:         req.ValidFrom,
		ValidUntil:        req.ValidUntil,
		RequestedRoomIDs:  req.RequestedRoomIDs,
		AccessibleRoomIDs: []string{},
		Fingerprints:      []models.FingerprintRecord{},
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	if err := s.userRepo.Create(ctx, newUser); err != nil {
		return nil, fmt.Errorf("failed to create registration: %w", err)
	}

	// Broadcast user registration to websocket
	if s.wsHub != nil {
		s.wsHub.BroadcastEvent(models.WSEventUserUpdated, newUser)
	}

	return newUser, nil
}

func (s *AuthService) GetUserByID(ctx context.Context, userID string) (*models.User, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *AuthService) CheckTicketStatus(ctx context.Context, ticketID string) (*models.User, error) {
	return nil, errors.New("tiket pendaftaran sudah tidak didukung")
}
