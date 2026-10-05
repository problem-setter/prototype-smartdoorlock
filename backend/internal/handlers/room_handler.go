package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/personalism/smart-door-lock/backend/internal/middleware"
	"github.com/personalism/smart-door-lock/backend/internal/models"
	"github.com/personalism/smart-door-lock/backend/internal/service"
)

type RoomHandler struct {
	roomService *service.RoomService
	authService *service.AuthService
}

func NewRoomHandler(roomService *service.RoomService, authService *service.AuthService) *RoomHandler {
	return &RoomHandler{
		roomService: roomService,
		authService: authService,
	}
}

func (h *RoomHandler) ListRooms(w http.ResponseWriter, r *http.Request) {
	rooms, err := h.roomService.ListRooms(r.Context())
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, rooms)
}

func (h *RoomHandler) GetRoom(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	room, err := h.roomService.GetRoom(r.Context(), id)
	if err != nil {
		respondJSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, room)
}

// Scenario 8: Remote Unlock
func (h *RoomHandler) RemoteUnlock(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req models.RemoteUnlockRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	claims, ok := middleware.GetUserFromContext(r.Context())
	var operator *models.User
	if ok && claims != nil {
		operator, _ = h.authService.GetUserByID(r.Context(), claims.UserID)
	}

	reason := req.Reason
	if reason == "" {
		reason = "Buka Kunci Jarak Jauh dari Dashboard"
	}

	room, err := h.roomService.RemoteUnlock(r.Context(), id, operator, reason)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"message": "Perintah buka kunci berhasil dikirim. Solenoid aktif selama 5 detik.",
		"room":    room,
	})
}

func (h *RoomHandler) ForceLock(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	room, err := h.roomService.ForceLock(r.Context(), id)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{
		"message": "Pintu berhasil dikunci kembali.",
		"room":    room,
	})
}

// Scenario 5: Clear Alarm
func (h *RoomHandler) ClearAlarm(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims, _ := middleware.GetUserFromContext(r.Context())
	clearedBy := "Admin"
	if claims != nil {
		clearedBy = claims.Name
	}

	room, err := h.roomService.ClearAlarm(r.Context(), id, clearedBy)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{
		"message": "Alarm berhasil dimatikan.",
		"room":    room,
	})
}

func (h *RoomHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req models.UpdateRoomSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid JSON format"})
		return
	}

	room, err := h.roomService.UpdateSettings(r.Context(), id, &req)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, room)
}

func (h *RoomHandler) RequestAccess(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok || claims == nil {
		respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	if err := h.roomService.RequestAccess(r.Context(), claims.UserID, id, req.Reason); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Permohonan akses ruangan berhasil diajukan"})
}
