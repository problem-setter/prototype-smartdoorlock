package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/personalism/smart-door-lock/backend/internal/database"
	"github.com/personalism/smart-door-lock/backend/internal/models"
)

type RoomRepository struct {
	db *database.DB
}

func NewRoomRepository(db *database.DB) *RoomRepository {
	return &RoomRepository{db: db}
}

func (r *RoomRepository) ListAll(ctx context.Context) ([]models.Room, error) {
	query := `
		SELECT id, name, description, device_id, used_fingerprints, created_at, updated_at
		FROM rooms
		ORDER BY id ASC
	`
	rows, err := r.db.Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list rooms failed: %w", err)
	}
	defer rows.Close()

	rooms := []models.Room{}
	for rows.Next() {
		var rm models.Room
		err := rows.Scan(
			&rm.ID, &rm.Name, &rm.Description, &rm.DeviceID,
			&rm.UsedFingerprints, &rm.CreatedAt, &rm.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		rooms = append(rooms, rm)
	}

	return rooms, nil
}

func (r *RoomRepository) FindByID(ctx context.Context, id string) (*models.Room, error) {
	query := `
		SELECT id, name, description, device_id, used_fingerprints, created_at, updated_at
		FROM rooms
		WHERE id = $1
		LIMIT 1
	`
	var rm models.Room
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&rm.ID, &rm.Name, &rm.Description, &rm.DeviceID,
		&rm.UsedFingerprints, &rm.CreatedAt, &rm.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &rm, nil
}

func (r *RoomRepository) FindByDeviceID(ctx context.Context, deviceID string) (*models.Room, error) {
	query := `
		SELECT id, name, description, device_id, used_fingerprints, created_at, updated_at
		FROM rooms
		WHERE device_id = $1
		LIMIT 1
	`
	var rm models.Room
	err := r.db.Pool.QueryRow(ctx, query, deviceID).Scan(
		&rm.ID, &rm.Name, &rm.Description, &rm.DeviceID,
		&rm.UsedFingerprints, &rm.CreatedAt, &rm.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &rm, nil
}

func (r *RoomRepository) UpdateLockState(ctx context.Context, id string, lockStatus models.LockStatus, relayStatus models.RelayStatus) error {
	// Transient hardware lock state is managed via MQTT/WebSocket, not persisted in rooms table
	return nil
}

func (r *RoomRepository) UpdateDoorState(ctx context.Context, id string, doorStatus models.DoorStatus, openDuration int) error {
	// Transient hardware door state is managed via MQTT/WebSocket, not persisted in rooms table
	return nil
}

func (r *RoomRepository) UpdateAlarmState(ctx context.Context, id string, isAlarmActive bool) error {
	// Transient hardware alarm state is managed via MQTT/WebSocket, not persisted in rooms table
	return nil
}

func (r *RoomRepository) RecordAccess(ctx context.Context, id string, userName string) error {
	// Access audit logs are persisted in access_logs table
	return nil
}

func (r *RoomRepository) UpdateTelemetry(ctx context.Context, deviceID string, ip string, deviceStatus models.DeviceStatus, usedFingerprints int) error {
	query := `
		UPDATE rooms
		SET used_fingerprints = CASE WHEN $2 > 0 THEN $2 ELSE used_fingerprints END,
		    updated_at = NOW()
		WHERE device_id = $1
	`
	_, err := r.db.Pool.Exec(ctx, query, deviceID, usedFingerprints)
	return err
}

func (r *RoomRepository) UpdateSettings(ctx context.Context, id string, req *models.UpdateRoomSettingsRequest) error {
	query := `
		UPDATE rooms
		SET name = COALESCE($2, name),
		    description = COALESCE($3, description),
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.Pool.Exec(ctx, query, id, req.Name, req.Description)
	return err
}
