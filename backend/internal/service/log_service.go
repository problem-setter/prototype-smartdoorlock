package service

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"time"

	"github.com/personalism/smart-door-lock/backend/internal/models"
	"github.com/personalism/smart-door-lock/backend/internal/repository"
)

type LogService struct {
	logRepo *repository.LogRepository
}

func NewLogService(logRepo *repository.LogRepository) *LogService {
	return &LogService{logRepo: logRepo}
}

func (s *LogService) ListLogs(ctx context.Context, filter models.LogFilter) ([]models.AccessLog, int, error) {
	return s.logRepo.List(ctx, filter)
}

func (s *LogService) GetStats(ctx context.Context) (*models.LogStats, error) {
	return s.logRepo.GetStats(ctx)
}

func (s *LogService) ExportCSV(ctx context.Context, filter models.LogFilter) ([]byte, error) {
	// Set large limit for export
	filter.Limit = 5000
	filter.Offset = 0
	logs, _, err := s.logRepo.List(ctx, filter)
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	// Header
	header := []string{
		"ID Event",
		"Waktu (WIB)",
		"Nama Pengguna",
		"Role",
		"Ruangan",
		"Aktivitas",
		"Hasil Autentikasi",
		"Status Pintu",
		"Slot Sidik Jari",
		"Keterangan",
	}
	if err := writer.Write(header); err != nil {
		return nil, err
	}

	wibLoc := time.FixedZone("WIB", 7*3600)

	for _, l := range logs {
		userName := "-"
		if l.UserName != nil {
			userName = *l.UserName
		}
		userRole := "-"
		if l.UserRole != nil {
			userRole = string(*l.UserRole)
		}
		doorStatus := "-"
		if l.DoorStatusAtEvent != nil {
			doorStatus = string(*l.DoorStatusAtEvent)
		}
		fpSlot := "-"
		if l.FingerprintTemplateID != nil {
			fpSlot = fmt.Sprintf("#%d", *l.FingerprintTemplateID)
		}

		row := []string{
			l.EventID,
			l.Timestamp.In(wibLoc).Format("2006-01-02 15:04:05"),
			userName,
			userRole,
			l.RoomName,
			string(l.ActivityType),
			string(l.AuthResult),
			doorStatus,
			fpSlot,
			l.Details,
		}
		if err := writer.Write(row); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	return buf.Bytes(), nil
}

func (s *LogService) ExportJSON(ctx context.Context, filter models.LogFilter) ([]byte, error) {
	filter.Limit = 5000
	filter.Offset = 0
	logs, _, err := s.logRepo.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	return json.MarshalIndent(logs, "", "  ")
}
