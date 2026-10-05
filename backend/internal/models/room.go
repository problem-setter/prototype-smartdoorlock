package models

import "time"

type DoorStatus string

const (
	DoorOpen   DoorStatus = "OPEN"
	DoorClosed DoorStatus = "CLOSED"
)

type LockStatus string

const (
	LockLocked   LockStatus = "LOCKED"
	LockUnlocked LockStatus = "UNLOCKED"
)

type RelayStatus string

const (
	RelayOn  RelayStatus = "ON"
	RelayOff RelayStatus = "OFF"
)

type DeviceStatus string

const (
	DeviceOnline  DeviceStatus = "ONLINE"
	DeviceOffline DeviceStatus = "OFFLINE"
)

type Room struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	Description      string    `json:"description"`
	DeviceID         string    `json:"deviceId"`
	UsedFingerprints int       `json:"usedFingerprints"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

type RemoteUnlockRequest struct {
	DurationSeconds int    `json:"durationSeconds,omitempty"` // default 5s
	Reason          string `json:"reason,omitempty"`
}

type RequestAccessRequest struct {
	Reason string `json:"reason"`
}

type UpdateRoomSettingsRequest struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
}
