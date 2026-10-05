package models

import (
	"encoding/json"
	"testing"
)

func TestEnrollStatusPayload_UnmarshalJSON(t *testing.T) {
	// Scenario 1: Numeric step from ESP32 firmware (step: 4, status: "STORE_OK")
	jsonDataNumeric := []byte(`{
		"deviceId": "ESP32-KK-NETSEC-02",
		"step": 4,
		"stepNumber": 4,
		"progress": 100,
		"status": "STORE_OK",
		"success": true,
		"message": "Template tersimpan di sensor DY50",
		"templateId": 12,
		"userId": "user-superadmin-01"
	}`)

	var payloadNumeric EnrollStatusPayload
	if err := json.Unmarshal(jsonDataNumeric, &payloadNumeric); err != nil {
		t.Fatalf("failed to unmarshal numeric step JSON: %v", err)
	}

	if payloadNumeric.DeviceID != "ESP32-KK-NETSEC-02" {
		t.Errorf("expected DeviceID 'ESP32-KK-NETSEC-02', got '%s'", payloadNumeric.DeviceID)
	}
	if payloadNumeric.Step != EnrollStepStoreOk {
		t.Errorf("expected Step '%s', got '%s'", EnrollStepStoreOk, payloadNumeric.Step)
	}
	if !payloadNumeric.Success {
		t.Errorf("expected Success to be true")
	}
	if payloadNumeric.TemplateID != 12 {
		t.Errorf("expected TemplateID 12, got %d", payloadNumeric.TemplateID)
	}

	// Scenario 2: String step (e.g. "WAIT_FINGER_1") and snake_case keys
	jsonDataString := []byte(`{
		"device_id": "ESP32-KK-NETSEC-02",
		"step": "WAIT_FINGER_1",
		"status": "WAIT_FINGER_1",
		"template_id": 5,
		"progress": 25,
		"success": true
	}`)

	var payloadString EnrollStatusPayload
	if err := json.Unmarshal(jsonDataString, &payloadString); err != nil {
		t.Fatalf("failed to unmarshal string step JSON: %v", err)
	}

	if payloadString.DeviceID != "ESP32-KK-NETSEC-02" {
		t.Errorf("expected DeviceID 'ESP32-KK-NETSEC-02', got '%s'", payloadString.DeviceID)
	}
	if payloadString.Step != EnrollStepWaitFinger1 {
		t.Errorf("expected Step '%s', got '%s'", EnrollStepWaitFinger1, payloadString.Step)
	}
	if payloadString.TemplateID != 5 {
		t.Errorf("expected TemplateID 5, got %d", payloadString.TemplateID)
	}

	// Scenario 3: Automatic success when status == "STORE_OK"
	jsonDataStoreOk := []byte(`{
		"deviceId": "ESP32-KK-NETSEC-02",
		"status": "STORE_OK",
		"templateId": 8
	}`)
	var payloadStoreOk EnrollStatusPayload
	if err := json.Unmarshal(jsonDataStoreOk, &payloadStoreOk); err != nil {
		t.Fatalf("failed to unmarshal STORE_OK JSON: %v", err)
	}
	if !payloadStoreOk.Success {
		t.Errorf("expected automatic Success=true on STORE_OK")
	}
	if payloadStoreOk.Step != EnrollStepStoreOk {
		t.Errorf("expected Step to resolve to STORE_OK, got %s", payloadStoreOk.Step)
	}
}

func TestAccessEventPayload_UnmarshalJSON(t *testing.T) {
	jsonData := []byte(`{
		"device_id": "ESP32-KK-NETSEC-02",
		"fingerprint_id": 1,
		"activity_type": "FINGERPRINT_AUTH",
		"auth_result": "SUCCESS"
	}`)

	var payload AccessEventPayload
	if err := json.Unmarshal(jsonData, &payload); err != nil {
		t.Fatalf("failed to unmarshal AccessEventPayload: %v", err)
	}

	if payload.DeviceID != "ESP32-KK-NETSEC-02" {
		t.Errorf("expected DeviceID 'ESP32-KK-NETSEC-02', got '%s'", payload.DeviceID)
	}
	if payload.TemplateID == nil || *payload.TemplateID != 1 {
		t.Errorf("expected TemplateID 1")
	}
	if payload.AuthResult != "SUCCESS" {
		t.Errorf("expected AuthResult 'SUCCESS', got '%s'", payload.AuthResult)
	}
}
