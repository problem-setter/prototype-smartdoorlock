package models

import "time"

type ActivityType string

const (
	ActivityFingerprintAuth  ActivityType = "FINGERPRINT_AUTH"
	ActivityRemoteUnlock     ActivityType = "REMOTE_UNLOCK"
	ActivityDoorOpened       ActivityType = "DOOR_OPENED"
	ActivityDoorClosed       ActivityType = "DOOR_CLOSED"
	ActivityAlarmTriggered   ActivityType = "ALARM_TRIGGERED"
	ActivityAlarmCleared     ActivityType = "ALARM_CLEARED"
	ActivityDeviceOnline     ActivityType = "DEVICE_ONLINE"
	ActivityDeviceOffline    ActivityType = "DEVICE_OFFLINE"
	ActivityEnrollmentSuccess ActivityType = "ENROLLMENT_SUCCESS"
	ActivityEnrollmentFailed  ActivityType = "ENROLLMENT_FAILED"
)

type AuthResult string

const (
	AuthResultSuccess AuthResult = "SUCCESS"
	AuthResultFailed  AuthResult = "FAILED"
	AuthResultSystem  AuthResult = "SYSTEM"
	AuthResultDenied  AuthResult = "DENIED"
)

type AccessLog struct {
	ID                    string       `json:"id"`
	EventID               string       `json:"eventId"`
	DeviceID              string       `json:"deviceId"`
	RoomID                *string      `json:"roomId,omitempty"`
	RoomName              string       `json:"roomName"`
	UserID                *string      `json:"userId,omitempty"`
	UserName              *string      `json:"userName,omitempty"`
	UserRole              *UserRole    `json:"userRole,omitempty"`
	FingerprintTemplateID *int         `json:"fingerprintTemplateId,omitempty"`
	ActivityType          ActivityType `json:"activityType"`
	AuthResult            AuthResult   `json:"authResult"`
	DoorStatusAtEvent     *DoorStatus  `json:"doorStatusAtEvent,omitempty"`
	Details               string       `json:"details"`
	Timestamp             time.Time    `json:"timestamp"`
}

type LogStats struct {
	TotalEventsToday    int     `json:"totalEventsToday"`
	SuccessfulAccesses  int     `json:"successfulAccesses"`
	FailedAttempts      int     `json:"failedAttempts"`
	ActiveAlarmsCount   int     `json:"activeAlarmsCount"`
	SuccessRatePercent  float64 `json:"successRatePercent"`
}

type LogFilter struct {
	RoomID       *string       `json:"roomId,omitempty"`
	UserID       *string       `json:"userId,omitempty"`
	ActivityType *ActivityType `json:"activityType,omitempty"`
	AuthResult   *AuthResult   `json:"authResult,omitempty"`
	Search       *string       `json:"search,omitempty"`
	StartDate    *time.Time    `json:"startDate,omitempty"`
	EndDate      *time.Time    `json:"endDate,omitempty"`
	Limit        int           `json:"limit"`
	Offset       int           `json:"offset"`
}
