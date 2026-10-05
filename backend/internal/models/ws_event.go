package models

import "time"

type WSEventType string

const (
	WSEventRoomUpdated     WSEventType = "ROOM_UPDATED"
	WSEventLogCreated      WSEventType = "LOG_CREATED"
	WSEventUserUpdated     WSEventType = "USER_UPDATED"
	WSEventAlarmTriggered  WSEventType = "ALARM_TRIGGERED"
	WSEventAlarmCleared    WSEventType = "ALARM_CLEARED"
	WSEventEnrollStatus    WSEventType = "ENROLL_STATUS"
	WSEventDeviceStatus    WSEventType = "DEVICE_STATUS"
	WSEventHeartbeat       WSEventType = "HEARTBEAT"
)

type WSEvent struct {
	Type      WSEventType `json:"type"`
	Payload   any         `json:"payload"`
	Timestamp time.Time   `json:"timestamp"`
}

func NewWSEvent(eventType WSEventType, payload any) WSEvent {
	return WSEvent{
		Type:      eventType,
		Payload:   payload,
		Timestamp: time.Now().UTC(),
	}
}
