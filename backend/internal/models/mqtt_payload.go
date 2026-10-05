package models

import (
	"encoding/json"
	"fmt"
	"strings"
)

type EnrollStep string

const (
	EnrollStepWaitFinger1   EnrollStep = "WAIT_FINGER_1"
	EnrollStepImage1Ok      EnrollStep = "IMAGE_1_OK"
	EnrollStepLiftFinger    EnrollStep = "LIFT_FINGER"
	EnrollStepWaitFinger2   EnrollStep = "WAIT_FINGER_2"
	EnrollStepImage2Ok      EnrollStep = "IMAGE_2_OK"
	EnrollStepCreateModelOk EnrollStep = "CREATE_MODEL_OK"
	EnrollStepStoreOk       EnrollStep = "STORE_OK"
	EnrollStepTimeout       EnrollStep = "TIMEOUT"
	EnrollStepError         EnrollStep = "ERROR"
)

type CommandType string

const (
	CmdUnlock            CommandType = "UNLOCK"
	CmdLock              CommandType = "LOCK"
	CmdClearAlarm        CommandType = "CLEAR_ALARM"
	CmdStartEnroll       CommandType = "START_ENROLL"
	CmdCancelEnroll      CommandType = "CANCEL_ENROLL"
	CmdDeleteFingerprint CommandType = "DELETE_FINGERPRINT"
)

type AccessEventPayload struct {
	DeviceID   string  `json:"deviceId,omitempty"`
	EventID    string  `json:"eventId,omitempty"`
	TemplateID *int    `json:"templateId,omitempty"`
	UserID     *string `json:"userId,omitempty"`
	Granted    bool    `json:"granted"`
	AuthResult string  `json:"authResult,omitempty"`
	Details    string  `json:"details,omitempty"`
	Timestamp  int64   `json:"timestamp,omitempty"`
}

func (p *AccessEventPayload) UnmarshalJSON(data []byte) error {
	type Alias AccessEventPayload
	aux := struct {
		*Alias
		SnakeDeviceID   string  `json:"device_id"`
		SnakeEventID    string  `json:"event_id"`
		SnakeTemplateID *int    `json:"template_id"`
		SnakeFingerID   *int    `json:"fingerprint_id"`
		SnakeUserID     *string `json:"user_id"`
		SnakeAuthResult string  `json:"auth_result"`
	}{
		Alias: (*Alias)(p),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if p.DeviceID == "" && aux.SnakeDeviceID != "" {
		p.DeviceID = aux.SnakeDeviceID
	}
	if p.EventID == "" && aux.SnakeEventID != "" {
		p.EventID = aux.SnakeEventID
	}
	if p.TemplateID == nil {
		if aux.SnakeTemplateID != nil {
			p.TemplateID = aux.SnakeTemplateID
		} else if aux.SnakeFingerID != nil {
			p.TemplateID = aux.SnakeFingerID
		}
	}
	if p.UserID == nil && aux.SnakeUserID != nil {
		p.UserID = aux.SnakeUserID
	}
	if p.AuthResult == "" && aux.SnakeAuthResult != "" {
		p.AuthResult = aux.SnakeAuthResult
	}
	return nil
}

type DoorEventPayload struct {
	DeviceID     string `json:"deviceId,omitempty"`
	DoorStatus   string `json:"doorStatus"`
	OpenDuration int    `json:"openDuration,omitempty"`
	Timestamp    int64  `json:"timestamp,omitempty"`
}

func (p *DoorEventPayload) UnmarshalJSON(data []byte) error {
	type Alias DoorEventPayload
	aux := struct {
		*Alias
		SnakeDeviceID   string `json:"device_id"`
		SnakeDoorStatus string `json:"door_status"`
		SnakeOpenDur    int    `json:"open_duration"`
	}{
		Alias: (*Alias)(p),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if p.DeviceID == "" && aux.SnakeDeviceID != "" {
		p.DeviceID = aux.SnakeDeviceID
	}
	if p.DoorStatus == "" && aux.SnakeDoorStatus != "" {
		p.DoorStatus = aux.SnakeDoorStatus
	}
	if p.OpenDuration == 0 && aux.SnakeOpenDur != 0 {
		p.OpenDuration = aux.SnakeOpenDur
	}
	return nil
}

type AlarmEventPayload struct {
	DeviceID     string `json:"deviceId,omitempty"`
	EventID      string `json:"eventId,omitempty"`
	AlarmState   string `json:"alarmState"`
	Reason       string `json:"reason,omitempty"`
	OpenDuration int    `json:"openDuration,omitempty"`
	Timestamp    int64  `json:"timestamp,omitempty"`
}

func (p *AlarmEventPayload) UnmarshalJSON(data []byte) error {
	type Alias AlarmEventPayload
	aux := struct {
		*Alias
		SnakeDeviceID   string `json:"device_id"`
		SnakeEventID    string `json:"event_id"`
		SnakeAlarmState string `json:"alarm_state"`
		SnakeOpenDur    int    `json:"open_duration"`
	}{
		Alias: (*Alias)(p),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if p.DeviceID == "" && aux.SnakeDeviceID != "" {
		p.DeviceID = aux.SnakeDeviceID
	}
	if p.EventID == "" && aux.SnakeEventID != "" {
		p.EventID = aux.SnakeEventID
	}
	if p.AlarmState == "" && aux.SnakeAlarmState != "" {
		p.AlarmState = aux.SnakeAlarmState
	}
	if p.OpenDuration == 0 && aux.SnakeOpenDur != 0 {
		p.OpenDuration = aux.SnakeOpenDur
	}
	return nil
}

type StatusPayload struct {
	DeviceID         string `json:"deviceId,omitempty"`
	Status           string `json:"status"`
	IPAddress        string `json:"ipAddress"`
	UsedFingerprints int    `json:"usedFingerprints"`
	Timestamp        int64  `json:"timestamp,omitempty"`
}

func (p *StatusPayload) UnmarshalJSON(data []byte) error {
	type Alias StatusPayload
	aux := struct {
		*Alias
		SnakeDeviceID string `json:"device_id"`
		SnakeIP       string `json:"ip_address"`
		SnakeUsedFP   int    `json:"used_fingerprints"`
	}{
		Alias: (*Alias)(p),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	if p.DeviceID == "" && aux.SnakeDeviceID != "" {
		p.DeviceID = aux.SnakeDeviceID
	}
	if p.IPAddress == "" && aux.SnakeIP != "" {
		p.IPAddress = aux.SnakeIP
	}
	if p.UsedFingerprints == 0 && aux.SnakeUsedFP != 0 {
		p.UsedFingerprints = aux.SnakeUsedFP
	}
	return nil
}

type EnrollStatusPayload struct {
	DeviceID   string     `json:"deviceId,omitempty"`
	Step       EnrollStep `json:"step"`
	Status     string     `json:"status,omitempty"`
	StepNumber int        `json:"stepNumber,omitempty"`
	Progress   int        `json:"progress,omitempty"`
	Success    bool       `json:"success"`
	Message    string     `json:"message"`
	TemplateID int        `json:"templateId"`
	UserID     *string    `json:"userId,omitempty"`
	Timestamp  int64      `json:"timestamp,omitempty"`
}

func (p *EnrollStatusPayload) UnmarshalJSON(data []byte) error {
	var raw map[string]interface{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	if v, ok := raw["deviceId"].(string); ok {
		p.DeviceID = v
	} else if v, ok := raw["device_id"].(string); ok {
		p.DeviceID = v
	}

	if v, ok := raw["status"].(string); ok {
		p.Status = v
	} else if v, ok := raw["state"].(string); ok {
		p.Status = v
	}

	if v, ok := raw["message"].(string); ok {
		p.Message = v
	}

	if v, ok := raw["progress"].(float64); ok {
		p.Progress = int(v)
	}

	if v, ok := raw["step"].(float64); ok {
		p.StepNumber = int(v)
		switch p.StepNumber {
		case 1:
			p.Step = EnrollStepWaitFinger1
		case 2:
			p.Step = EnrollStepWaitFinger2
		case 3:
			p.Step = EnrollStepCreateModelOk
		case 4:
			p.Step = EnrollStepStoreOk
		default:
			p.Step = EnrollStep(fmt.Sprintf("STEP_%d", p.StepNumber))
		}
	} else if v, ok := raw["step"].(string); ok {
		p.Step = EnrollStep(v)
	}

	if v, ok := raw["stepNumber"].(float64); ok {
		p.StepNumber = int(v)
	} else if v, ok := raw["step_number"].(float64); ok {
		p.StepNumber = int(v)
	}

	if p.Status != "" && (p.Step == "" || p.Step == EnrollStepWaitFinger1) {
		switch strings.ToUpper(p.Status) {
		case "WAIT_FINGER_1":
			p.Step = EnrollStepWaitFinger1
		case "IMAGE_1_OK":
			p.Step = EnrollStepImage1Ok
		case "LIFT_FINGER":
			p.Step = EnrollStepLiftFinger
		case "WAIT_FINGER_2":
			p.Step = EnrollStepWaitFinger2
		case "IMAGE_2_OK":
			p.Step = EnrollStepImage2Ok
		case "CREATE_MODEL_OK":
			p.Step = EnrollStepCreateModelOk
		case "STORE_OK":
			p.Step = EnrollStepStoreOk
		case "TIMEOUT":
			p.Step = EnrollStepTimeout
		case "ERROR":
			p.Step = EnrollStepError
		default:
			if p.Step == "" {
				p.Step = EnrollStep(p.Status)
			}
		}
	}

	if v, ok := raw["templateId"].(float64); ok {
		p.TemplateID = int(v)
	} else if v, ok := raw["template_id"].(float64); ok {
		p.TemplateID = int(v)
	}

	if v, ok := raw["userId"].(string); ok && v != "" {
		p.UserID = &v
	} else if v, ok := raw["user_id"].(string); ok && v != "" {
		p.UserID = &v
	}

	if v, ok := raw["timestamp"].(float64); ok {
		p.Timestamp = int64(v)
	}

	if v, ok := raw["success"].(bool); ok {
		p.Success = v
	} else if p.Step == EnrollStepStoreOk || strings.EqualFold(p.Status, "STORE_OK") || p.StepNumber == 4 {
		p.Success = true
	}

	return nil
}

type CommandPayload struct {
	Command    CommandType `json:"command"`
	DeviceID   string      `json:"deviceId,omitempty"`
	Nonce      string      `json:"nonce,omitempty"`
	Duration   int         `json:"duration,omitempty"`
	TemplateID *int        `json:"templateId,omitempty"`
	UserID     *string     `json:"userId,omitempty"`
	UserName   *string     `json:"userName,omitempty"`
	Triggered  string      `json:"triggered,omitempty"`
	Timestamp  int64       `json:"timestamp,omitempty"`
}

type EnrollStartRequest struct {
	DeviceID   string `json:"deviceId"`
	TemplateID int    `json:"templateId"`
	UserID     string `json:"userId"`
}
