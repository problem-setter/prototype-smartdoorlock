package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/personalism/smart-door-lock/backend/internal/middleware"
	"github.com/personalism/smart-door-lock/backend/internal/models"
	"github.com/personalism/smart-door-lock/backend/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Scenario 7: Admin / User Login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Format JSON tidak valid"})
		return
	}

	res, err := h.authService.Login(r.Context(), &req)
	if err != nil {
		respondJSON(w, http.StatusUnauthorized, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, res)
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Format JSON tidak valid"})
		return
	}

	user, err := h.authService.Register(r.Context(), &req)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusCreated, models.RegisterResponse{
		Message: "Permohonan pendaftaran akun berhasil dikirim. Menunggu persetujuan admin.",
		User:    *user,
	})
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok || claims == nil {
		respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	user, err := h.authService.GetUserByID(r.Context(), claims.UserID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, map[string]string{"error": "User profile not found"})
		return
	}

	respondJSON(w, http.StatusOK, user)
}

func (h *AuthHandler) CheckTicket(w http.ResponseWriter, r *http.Request) {
	ticketID := chi.URLParam(r, "ticketId")
	if ticketID == "" {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Ticket ID required"})
		return
	}

	user, err := h.authService.CheckTicketStatus(r.Context(), ticketID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, user)
}

func respondJSON(w http.ResponseWriter, statusCode int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(data)
}
