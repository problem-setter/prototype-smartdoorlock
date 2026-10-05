package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/personalism/smart-door-lock/backend/internal/database"
	"github.com/personalism/smart-door-lock/backend/internal/models"
)

type UserRepository struct {
	db *database.DB
}

func NewUserRepository(db *database.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByIdentifier(ctx context.Context, identifier string) (*models.User, error) {
	query := `
		SELECT id, name, email, password_hash, role, status,
		       valid_from, valid_until, created_at, updated_at
		FROM users
		WHERE LOWER(email) = LOWER($1)
		LIMIT 1
	`
	var u models.User
	err := r.db.Pool.QueryRow(ctx, query, identifier).Scan(
		&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.Status,
		&u.ValidFrom, &u.ValidUntil, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("query user failed: %w", err)
	}

	// Fetch relations
	u.AccessibleRoomIDs, _ = r.GetAccessibleRoomIDs(ctx, u.ID)
	u.RequestedRoomIDs, _ = r.GetRequestedRoomIDs(ctx, u.ID)
	u.Fingerprints, _ = r.GetUserFingerprints(ctx, u.ID)
	if len(u.Fingerprints) > 0 {
		tplID := u.Fingerprints[0].TemplateID
		u.FingerprintTemplateID = &tplID
	}

	return &u, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*models.User, error) {
	query := `
		SELECT id, name, email, password_hash, role, status,
		       valid_from, valid_until, created_at, updated_at
		FROM users
		WHERE id = $1
		LIMIT 1
	`
	var u models.User
	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.Status,
		&u.ValidFrom, &u.ValidUntil, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("query user by id failed: %w", err)
	}

	u.AccessibleRoomIDs, _ = r.GetAccessibleRoomIDs(ctx, u.ID)
	u.RequestedRoomIDs, _ = r.GetRequestedRoomIDs(ctx, u.ID)
	u.Fingerprints, _ = r.GetUserFingerprints(ctx, u.ID)
	if len(u.Fingerprints) > 0 {
		tplID := u.Fingerprints[0].TemplateID
		u.FingerprintTemplateID = &tplID
	}

	return &u, nil
}

func (r *UserRepository) FindByFingerprintTemplateID(ctx context.Context, templateID int) (*models.User, error) {
	query := `
		SELECT u.id, u.name, u.email, u.password_hash, u.role, u.status,
		       u.valid_from, u.valid_until, u.created_at, u.updated_at
		FROM users u
		JOIN user_fingerprints f ON u.id = f.user_id
		WHERE f.template_id = $1
		LIMIT 1
	`
	var u models.User
	err := r.db.Pool.QueryRow(ctx, query, templateID).Scan(
		&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.Status,
		&u.ValidFrom, &u.ValidUntil, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	u.AccessibleRoomIDs, _ = r.GetAccessibleRoomIDs(ctx, u.ID)
	u.RequestedRoomIDs, _ = r.GetRequestedRoomIDs(ctx, u.ID)
	u.Fingerprints, _ = r.GetUserFingerprints(ctx, u.ID)
	u.FingerprintTemplateID = &templateID

	return &u, nil
}

func (r *UserRepository) ListAll(ctx context.Context) ([]models.User, error) {
	query := `
		SELECT id, name, email, password_hash, role, status,
		       valid_from, valid_until, created_at, updated_at
		FROM users
		ORDER BY created_at DESC
	`
	rows, err := r.db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		err := rows.Scan(
			&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.Status,
			&u.ValidFrom, &u.ValidUntil, &u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	// Populate relations for each user
	for i := range users {
		users[i].AccessibleRoomIDs, _ = r.GetAccessibleRoomIDs(ctx, users[i].ID)
		users[i].RequestedRoomIDs, _ = r.GetRequestedRoomIDs(ctx, users[i].ID)
		users[i].Fingerprints, _ = r.GetUserFingerprints(ctx, users[i].ID)
		if len(users[i].Fingerprints) > 0 {
			tplID := users[i].Fingerprints[0].TemplateID
			users[i].FingerprintTemplateID = &tplID
		}
	}

	return users, nil
}

func (r *UserRepository) Create(ctx context.Context, u *models.User) error {
	query := `
		INSERT INTO users (
			id, name, email, password_hash, role, status,
			valid_from, valid_until, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	now := time.Now().UTC()
	u.CreatedAt = now
	u.UpdatedAt = now

	_, err := r.db.Pool.Exec(ctx, query,
		u.ID, u.Name, u.Email, u.PasswordHash, u.Role, u.Status,
		u.ValidFrom, u.ValidUntil, u.CreatedAt, u.UpdatedAt,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *UserRepository) Update(ctx context.Context, u *models.User) error {
	query := `
		UPDATE users SET
			name = $2, email = $3, role = $4, status = $5,
			valid_from = $6, valid_until = $7, updated_at = $8
		WHERE id = $1
	`
	u.UpdatedAt = time.Now().UTC()
	_, err := r.db.Pool.Exec(ctx, query,
		u.ID, u.Name, u.Email, u.Role, u.Status,
		u.ValidFrom, u.ValidUntil, u.UpdatedAt,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *UserRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Pool.Exec(ctx, "DELETE FROM users WHERE id = $1", id)
	return err
}

func (r *UserRepository) GetAccessibleRoomIDs(ctx context.Context, userID string) ([]string, error) {
	// If user is superadmin, grant access to all rooms
	var role string
	_ = r.db.Pool.QueryRow(ctx, "SELECT role FROM users WHERE id = $1", userID).Scan(&role)
	if role == string(models.RoleSuperadmin) {
		rows, err := r.db.Pool.Query(ctx, "SELECT id FROM rooms ORDER BY id")
		if err == nil {
			defer rows.Close()
			var allRoomIDs []string
			for rows.Next() {
				var rID string
				if err := rows.Scan(&rID); err == nil {
					allRoomIDs = append(allRoomIDs, rID)
				}
			}
			if len(allRoomIDs) > 0 {
				return allRoomIDs, nil
			}
		}
	}

	query := `SELECT DISTINCT room_id FROM user_fingerprints WHERE user_id = $1 AND room_id IS NOT NULL`
	rows, err := r.db.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roomIDs []string
	for rows.Next() {
		var roomID string
		if err := rows.Scan(&roomID); err == nil {
			roomIDs = append(roomIDs, roomID)
		}
	}
	if roomIDs == nil {
		roomIDs = []string{}
	}
	return roomIDs, nil
}

func (r *UserRepository) GetRequestedRoomIDs(ctx context.Context, userID string) ([]string, error) {
	return []string{}, nil
}

func (r *UserRepository) GetUserFingerprints(ctx context.Context, userID string) ([]models.FingerprintRecord, error) {
	query := `SELECT id, user_id, room_id, template_id, label, registered_at FROM user_fingerprints WHERE user_id = $1 ORDER BY template_id ASC`
	rows, err := r.db.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []models.FingerprintRecord
	for rows.Next() {
		var f models.FingerprintRecord
		if err := rows.Scan(&f.ID, &f.UserID, &f.RoomID, &f.TemplateID, &f.Label, &f.RegisteredAt); err == nil {
			records = append(records, f)
		}
	}
	if records == nil {
		records = []models.FingerprintRecord{}
	}
	return records, nil
}

func (r *UserRepository) AddFingerprint(ctx context.Context, userID string, templateID int, label string, roomID *string) error {
	query := `
		INSERT INTO user_fingerprints (user_id, room_id, template_id, label, registered_at)
		VALUES ($1, $2, $3, $4, NOW())
		ON CONFLICT (user_id, room_id, template_id) DO UPDATE SET label = EXCLUDED.label
	`
	_, err := r.db.Pool.Exec(ctx, query, userID, roomID, templateID, label)
	return err
}

func (r *UserRepository) UpdateFingerprintLabel(ctx context.Context, userID string, templateID int, label string) error {
	query := `UPDATE user_fingerprints SET label = $3 WHERE user_id = $1 AND template_id = $2`
	_, err := r.db.Pool.Exec(ctx, query, userID, templateID, label)
	return err
}

func (r *UserRepository) DeleteFingerprint(ctx context.Context, userID string, templateID int) error {
	query := `DELETE FROM user_fingerprints WHERE user_id = $1 AND template_id = $2`
	_, err := r.db.Pool.Exec(ctx, query, userID, templateID)
	return err
}
