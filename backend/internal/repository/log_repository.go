package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/personalism/smart-door-lock/backend/internal/database"
	"github.com/personalism/smart-door-lock/backend/internal/models"
)

type LogRepository struct {
	db *database.DB
}

func NewLogRepository(db *database.DB) *LogRepository {
	return &LogRepository{db: db}
}

func (r *LogRepository) Create(ctx context.Context, log *models.AccessLog) error {
	if log.ID == "" {
		log.ID = "log-" + uuid.New().String()[:8]
	}
	if log.EventID == "" {
		log.EventID = fmt.Sprintf("EVT-%s-%s", time.Now().Format("20060102"), uuid.New().String()[:6])
	}
	if log.Timestamp.IsZero() {
		log.Timestamp = time.Now().UTC()
	}

	query := `
		INSERT INTO access_logs (
			id, event_id, device_id, room_id, room_name, user_id, user_name, user_role,
			fingerprint_template_id, activity_type, auth_result, door_status_at_event,
			details, timestamp
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		ON CONFLICT (event_id) DO NOTHING
	`
	_, err := r.db.Pool.Exec(ctx, query,
		log.ID, log.EventID, log.DeviceID, log.RoomID, log.RoomName,
		log.UserID, log.UserName, log.UserRole, log.FingerprintTemplateID,
		log.ActivityType, log.AuthResult, log.DoorStatusAtEvent,
		log.Details, log.Timestamp,
	)
	return err
}

func (r *LogRepository) List(ctx context.Context, filter models.LogFilter) ([]models.AccessLog, int, error) {
	var conditions []string
	var args []any
	argIdx := 1

	if filter.RoomID != nil && *filter.RoomID != "" && *filter.RoomID != "ALL" {
		conditions = append(conditions, fmt.Sprintf("room_id = $%d", argIdx))
		args = append(args, *filter.RoomID)
		argIdx++
	}

	if filter.UserID != nil && *filter.UserID != "" {
		conditions = append(conditions, fmt.Sprintf("user_id = $%d", argIdx))
		args = append(args, *filter.UserID)
		argIdx++
	}

	if filter.ActivityType != nil && *filter.ActivityType != "" {
		conditions = append(conditions, fmt.Sprintf("activity_type = $%d", argIdx))
		args = append(args, *filter.ActivityType)
		argIdx++
	}

	if filter.AuthResult != nil && *filter.AuthResult != "" {
		conditions = append(conditions, fmt.Sprintf("auth_result = $%d", argIdx))
		args = append(args, *filter.AuthResult)
		argIdx++
	}

	if filter.Search != nil && *filter.Search != "" {
		conditions = append(conditions, fmt.Sprintf("(user_name ILIKE $%d OR room_name ILIKE $%d OR details ILIKE $%d OR event_id ILIKE $%d)", argIdx, argIdx, argIdx, argIdx))
		args = append(args, "%"+*filter.Search+"%")
		argIdx++
	}

	if filter.StartDate != nil {
		conditions = append(conditions, fmt.Sprintf("timestamp >= $%d", argIdx))
		args = append(args, *filter.StartDate)
		argIdx++
	}

	if filter.EndDate != nil {
		conditions = append(conditions, fmt.Sprintf("timestamp <= $%d", argIdx))
		args = append(args, *filter.EndDate)
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM access_logs %s", whereClause)
	var totalCount int
	err := r.db.Pool.QueryRow(ctx, countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	limit := filter.Limit
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	offset := filter.Offset
	if offset < 0 {
		offset = 0
	}

	dataQuery := fmt.Sprintf(`
		SELECT id, event_id, device_id, room_id, room_name, user_id, user_name, user_role,
		       fingerprint_template_id, activity_type, auth_result, door_status_at_event,
		       details, timestamp
		FROM access_logs
		%s
		ORDER BY timestamp DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.db.Pool.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []models.AccessLog
	for rows.Next() {
		var l models.AccessLog
		err := rows.Scan(
			&l.ID, &l.EventID, &l.DeviceID, &l.RoomID, &l.RoomName, &l.UserID, &l.UserName, &l.UserRole,
			&l.FingerprintTemplateID, &l.ActivityType, &l.AuthResult, &l.DoorStatusAtEvent,
			&l.Details, &l.Timestamp,
		)
		if err != nil {
			return nil, 0, err
		}
		logs = append(logs, l)
	}

	if logs == nil {
		logs = []models.AccessLog{}
	}

	return logs, totalCount, nil
}

func (r *LogRepository) GetStats(ctx context.Context) (*models.LogStats, error) {
	now := time.Now().UTC()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)

	query := `
		SELECT
			COUNT(*) as total_today,
			COUNT(*) FILTER (WHERE auth_result = 'SUCCESS') as successful,
			COUNT(*) FILTER (WHERE auth_result IN ('FAILED', 'DENIED')) as failed,
			COUNT(*) FILTER (WHERE activity_type = 'ALARM_TRIGGERED') as alarms
		FROM access_logs
		WHERE timestamp >= $1
	`
	var total, success, failed, alarms int
	err := r.db.Pool.QueryRow(ctx, query, startOfDay).Scan(&total, &success, &failed, &alarms)
	if err != nil {
		return nil, err
	}

	var rate float64 = 100.0
	if total > 0 {
		rate = float64(success) / float64(total) * 100.0
	}

	return &models.LogStats{
		TotalEventsToday:   total,
		SuccessfulAccesses: success,
		FailedAttempts:     failed,
		ActiveAlarmsCount:  alarms,
		SuccessRatePercent: rate,
	}, nil
}
