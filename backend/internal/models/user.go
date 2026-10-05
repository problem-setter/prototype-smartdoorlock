package models

import "time"

type UserRole string

const (
	RoleUser       UserRole = "user"
	RoleAdmin      UserRole = "admin"
	RoleSuperAdmin UserRole = "superadmin"
	RoleSuperadmin UserRole = "superadmin"
)

type UserStatus string

const (
	StatusActive          UserStatus = "ACTIVE"
	StatusPendingApproval UserStatus = "PENDING_APPROVAL"
	StatusRejected        UserStatus = "REJECTED"
	StatusSuspended       UserStatus = "SUSPENDED"
	StatusExpired         UserStatus = "EXPIRED"

	UserStatusActive          = StatusActive
	UserStatusPending         = StatusPendingApproval
	UserStatusPendingApproval = StatusPendingApproval
	UserStatusRejected        = StatusRejected
	UserStatusSuspended       = StatusSuspended
	UserStatusExpired         = StatusExpired
)

type FingerprintRecord struct {
	ID           int64     `json:"id,omitempty"`
	UserID       string    `json:"userId"`
	RoomID       *string   `json:"roomId,omitempty"`
	TemplateID   int       `json:"templateId"`
	Label        string    `json:"label"`
	RegisteredAt time.Time `json:"registeredAt"`
}

type User struct {
	ID                    string              `json:"id"`
	Name                  string              `json:"name"`
	Email                 string              `json:"email"`
	PasswordHash          string              `json:"-"`
	Role                  UserRole            `json:"role"`
	Status                UserStatus          `json:"status"`
	ValidFrom             *time.Time          `json:"validFrom,omitempty"`
	ValidUntil            *time.Time          `json:"validUntil,omitempty"`
	FingerprintTemplateID *int                `json:"fingerprintTemplateId,omitempty"`
	AccessibleRoomIDs     []string            `json:"accessibleRoomIds"`
	RequestedRoomIDs      []string            `json:"requestedRoomIds,omitempty"`
	Fingerprints          []FingerprintRecord `json:"fingerprints"`
	CreatedAt             time.Time           `json:"createdAt"`
	UpdatedAt             time.Time           `json:"updatedAt"`
}

// Request and Response Structs

type LoginRequest struct {
	Identifier string `json:"identifier,omitempty"` // Email
	Email      string `json:"email,omitempty"`
	Password   string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type RegisterRequest struct {
	Name             string     `json:"name"`
	Email            string     `json:"email"`
	Password         string     `json:"password"`
	Role             UserRole   `json:"role,omitempty"`
	RequestedRoomIDs []string   `json:"requestedRoomIds,omitempty"`
	ValidFrom        *time.Time `json:"validFrom,omitempty"`
	ValidUntil       *time.Time `json:"validUntil,omitempty"`
}

type RegisterResponse struct {
	Message string `json:"message"`
	User    User   `json:"user"`
}

type CreateUserRequest struct {
	Name              string     `json:"name"`
	Email             string     `json:"email"`
	Password          string     `json:"password"`
	Role              UserRole   `json:"role"`
	AccessibleRoomIDs []string   `json:"accessibleRoomIds"`
	ValidFrom         *time.Time `json:"validFrom,omitempty"`
	ValidUntil        *time.Time `json:"validUntil,omitempty"`
}

type UpdateUserRequest struct {
	Name              *string     `json:"name,omitempty"`
	Email             *string     `json:"email,omitempty"`
	Role              *UserRole   `json:"role,omitempty"`
	Status            *UserStatus `json:"status,omitempty"`
	AccessibleRoomIDs *[]string   `json:"accessibleRoomIds,omitempty"`
	ValidFrom         *time.Time  `json:"validFrom,omitempty"`
	ValidUntil        *time.Time  `json:"validUntil,omitempty"`
}

type ApproveUserRequest struct {
	ApprovedRoomIDs []string   `json:"approvedRoomIds"`
	ValidFrom       *time.Time `json:"validFrom,omitempty"`
	ValidUntil      *time.Time `json:"validUntil,omitempty"`
}

type RejectUserRequest struct {
	RejectionReason string `json:"rejectionReason"`
}

type AddFingerprintRequest struct {
	TemplateID int    `json:"templateId"`
	Label      string `json:"label"`
}

type UpdateFingerprintLabelRequest struct {
	Label string `json:"label"`
}
