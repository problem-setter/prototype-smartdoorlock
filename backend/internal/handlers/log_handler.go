package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/personalism/smart-door-lock/backend/internal/models"
	"github.com/personalism/smart-door-lock/backend/internal/service"
)

type LogHandler struct {
	logService *service.LogService
}

func NewLogHandler(logService *service.LogService) *LogHandler {
	return &LogHandler{logService: logService}
}

func (h *LogHandler) ListLogs(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	limit := 50
	if l := q.Get("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}

	offset := 0
	if o := q.Get("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil && val >= 0 {
			offset = val
		}
	}

	filter := models.LogFilter{
		Limit:  limit,
		Offset: offset,
	}

	if roomID := q.Get("roomId"); roomID != "" {
		filter.RoomID = &roomID
	}
	if userID := q.Get("userId"); userID != "" {
		filter.UserID = &userID
	}
	if actType := q.Get("activityType"); actType != "" {
		at := models.ActivityType(actType)
		filter.ActivityType = &at
	}
	if authRes := q.Get("authResult"); authRes != "" {
		ar := models.AuthResult(authRes)
		filter.AuthResult = &ar
	}
	if search := q.Get("search"); search != "" {
		filter.Search = &search
	}

	if sd := q.Get("startDate"); sd != "" {
		if t, err := time.Parse("2006-01-02", sd); err == nil {
			filter.StartDate = &t
		}
	}

	if ed := q.Get("endDate"); ed != "" {
		if t, err := time.Parse("2006-01-02", ed); err == nil {
			// end of day
			t = t.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			filter.EndDate = &t
		}
	}

	logs, total, err := h.logService.ListLogs(r.Context(), filter)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"logs":   logs,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *LogHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.logService.GetStats(r.Context())
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, stats)
}

func (h *LogHandler) ExportCSV(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filter := models.LogFilter{
		Limit: 1000,
	}
	if roomID := q.Get("roomId"); roomID != "" {
		filter.RoomID = &roomID
	}
	if userID := q.Get("userId"); userID != "" {
		filter.UserID = &userID
	}
	if actType := q.Get("activityType"); actType != "" {
		at := models.ActivityType(actType)
		filter.ActivityType = &at
	}
	if authRes := q.Get("authResult"); authRes != "" {
		ar := models.AuthResult(authRes)
		filter.AuthResult = &ar
	}

	csvData, err := h.logService.ExportCSV(r.Context(), filter)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	filename := fmt.Sprintf("access_logs_%s.csv", time.Now().Format("20060102_150405"))
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(csvData)
}

func (h *LogHandler) ExportJSON(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filter := models.LogFilter{
		Limit: 1000,
	}
	if roomID := q.Get("roomId"); roomID != "" {
		filter.RoomID = &roomID
	}
	if userID := q.Get("userId"); userID != "" {
		filter.UserID = &userID
	}
	if actType := q.Get("activityType"); actType != "" {
		at := models.ActivityType(actType)
		filter.ActivityType = &at
	}
	if authRes := q.Get("authResult"); authRes != "" {
		ar := models.AuthResult(authRes)
		filter.AuthResult = &ar
	}

	jsonData, err := h.logService.ExportJSON(r.Context(), filter)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	filename := fmt.Sprintf("access_logs_%s.json", time.Now().Format("20060102_150405"))
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(jsonData)
}
