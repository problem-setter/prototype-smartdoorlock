package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/personalism/smart-door-lock/backend/internal/middleware"
	"github.com/personalism/smart-door-lock/backend/internal/models"
	"github.com/personalism/smart-door-lock/backend/internal/service"
)

type UserHandler struct {
	userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userService.ListUsers(r.Context())
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, users)
}

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	user, err := h.userService.GetUser(r.Context(), id)
	if err != nil {
		respondJSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req models.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Format JSON tidak valid"})
		return
	}

	user, err := h.userService.CreateUser(r.Context(), &req)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusCreated, user)
}

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req models.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Format JSON tidak valid"})
		return
	}

	user, err := h.userService.UpdateUser(r.Context(), id, &req)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.userService.DeleteUser(r.Context(), id); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "User berhasil dihapus"})
}

// Scenario 10: Approve User Registration
func (h *UserHandler) ApproveUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims, _ := middleware.GetUserFromContext(r.Context())
	adminName := "Admin"
	if claims != nil {
		adminName = claims.Name
	}

	var req models.ApproveUserRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	user, err := h.userService.ApproveRegistration(r.Context(), id, adminName, &req)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) RejectUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req models.RejectUserRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	user, err := h.userService.RejectRegistration(r.Context(), id, req.RejectionReason)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) SuspendUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	user, err := h.userService.SuspendUser(r.Context(), id, req.Reason)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) ActivateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	user, err := h.userService.ActivateUser(r.Context(), id)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, user)
}

// Scenario 9: Add / Delete Fingerprint Slots
func (h *UserHandler) AddFingerprint(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		TemplateID int     `json:"templateId"`
		Label      string  `json:"label"`
		RoomID     *string `json:"roomId,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Format JSON tidak valid"})
		return
	}

	if err := h.userService.AddFingerprint(r.Context(), id, req.TemplateID, req.Label, req.RoomID); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Data sidik jari berhasil disimpan"})
}

func (h *UserHandler) DeleteFingerprint(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	templateIDStr := chi.URLParam(r, "templateId")
	templateID, err := strconv.Atoi(templateIDStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Nomor template tidak valid"})
		return
	}

	if err := h.userService.DeleteFingerprint(r.Context(), id, templateID); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Data sidik jari berhasil dihapus"})
}
