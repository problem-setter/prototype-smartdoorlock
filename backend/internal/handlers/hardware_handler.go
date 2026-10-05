package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/personalism/smart-door-lock/backend/internal/models"
	"github.com/personalism/smart-door-lock/backend/internal/service"
)

type HardwareHandler struct {
	hardwareService *service.HardwareService
	roomService     *service.RoomService
}

func NewHardwareHandler(hardwareService *service.HardwareService, roomService *service.RoomService) *HardwareHandler {
	return &HardwareHandler{
		hardwareService: hardwareService,
		roomService:     roomService,
	}
}

// Scenario 9: Start Biometric Enrollment Flow
func (h *HardwareHandler) StartEnrollment(w http.ResponseWriter, r *http.Request) {
	var req models.EnrollStartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Format JSON tidak valid"})
		return
	}

	if req.DeviceID == "" || req.TemplateID <= 0 || req.UserID == "" {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "deviceId, templateId, dan userId wajib diisi"})
		return
	}

	if err := h.hardwareService.StartEnrollment(r.Context(), req.DeviceID, req.TemplateID, req.UserID); err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"message":    "Instruksi pendaftaran sidik jari berhasil dikirim ke perangkat ESP32",
		"deviceId":   req.DeviceID,
		"templateId": req.TemplateID,
		"userId":     req.UserID,
	})
}

func (h *HardwareHandler) CancelEnrollment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		DeviceID string `json:"deviceId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.DeviceID == "" {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "deviceId wajib diisi"})
		return
	}

	if err := h.hardwareService.CancelEnrollment(r.Context(), req.DeviceID); err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Pendaftaran sidik jari dibatalkan"})
}

func (h *HardwareHandler) GetDevices(w http.ResponseWriter, r *http.Request) {
	rooms, err := h.roomService.ListRooms(r.Context())
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	type DeviceSummary struct {
		DeviceID         string `json:"deviceId"`
		RoomID           string `json:"roomId"`
		RoomName         string `json:"roomName"`
		UsedFingerprints int    `json:"usedFingerprints"`
	}

	var devices []DeviceSummary
	for _, room := range rooms {
		devices = append(devices, DeviceSummary{
			DeviceID:         room.DeviceID,
			RoomID:           room.ID,
			RoomName:         room.Name,
			UsedFingerprints: room.UsedFingerprints,
		})
	}

	respondJSON(w, http.StatusOK, devices)
}
