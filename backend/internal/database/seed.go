package database

import (
	"context"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func (db *DB) SeedInitialData(ctx context.Context) error {
	now := time.Now().UTC()

	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Clean up legacy room-server if present
	cleanupQuery := `
		DELETE FROM user_fingerprints WHERE room_id = 'room-server';
		DELETE FROM access_logs WHERE room_id = 'room-server';
		DELETE FROM rooms WHERE id = 'room-server';
	`
	if _, err := tx.Exec(ctx, cleanupQuery); err != nil {
		log.Printf("⚠️ Warning cleaning up legacy room-server: %v", err)
	}

	// 1. Ensure PRD Room is seeded (Ruang KK Jaringan & Keamanan)
	roomsQuery := `
		INSERT INTO rooms (
			id, name, description, device_id, used_fingerprints, created_at, updated_at
		) VALUES
		(
			'room-kk-netsec',
			'Ruang KK Jaringan & Keamanan',
			'Laboratorium Kelompok Keahlian Jaringan dan Keamanan Prodi Informatika UNTAN. Terintegrasi langsung dengan modul IoT Smart Door Lock berbasis ESP32, biometrik DY50, Solenoid, dan sensor pintu MC-38.',
			'ESP32-KK-NETSEC-02',
			12,
			$1, $1
		)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			description = EXCLUDED.description,
			device_id = EXCLUDED.device_id,
			updated_at = EXCLUDED.updated_at;
	`
	if _, err := tx.Exec(ctx, roomsQuery, now); err != nil {
		log.Printf("⚠️ Warning seeding rooms: %v", err)
	}

	// 2. Check if users already exist
	var userCount int
	err = tx.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&userCount)
	if err != nil {
		return err
	}

	if userCount > 0 {
		log.Println("ℹ️  Database already contains users. Rooms ensured; skipping user re-seeding.")
		return tx.Commit(ctx)
	}

	log.Println("🌱 Seeding initial users and biometric credentials into PostgreSQL...")

	superadminHash, _ := bcrypt.GenerateFromPassword([]byte("Superadmin#2026"), bcrypt.DefaultCost)
	adminHash, _ := bcrypt.GenerateFromPassword([]byte("Admin#2026"), bcrypt.DefaultCost)
	userHash, _ := bcrypt.GenerateFromPassword([]byte("User#2026"), bcrypt.DefaultCost)

	usersQuery := `
		INSERT INTO users (
			id, name, email, password_hash, role, status,
			valid_from, valid_until, created_at, updated_at
		) VALUES
		(
			'user-superadmin-01', 'Dr. Fajar Purnama, S.T., M.Eng.', 'superadmin@untan.ac.id',
			$1, 'superadmin', 'ACTIVE', $4, NULL, $4, $4
		),
		(
			'user-admin-01', 'Arya Putra Sastrawan, S.Kom.', 'arya.admin@untan.ac.id',
			$2, 'admin', 'ACTIVE', $4, NULL, $4, $4
		),
		(
			'user-dosen-01', 'Muhammad Rizki Ramadhan', 'rizki.ramadhan@untan.ac.id',
			$3, 'user', 'ACTIVE', $4, NULL, $4, $4
		),
		(
			'user-mahasiswa-01', 'Sarah Amanda Putri', 'sarah.amanda@student.untan.ac.id',
			$3, 'user', 'ACTIVE', $4, NULL, $4, $4
		)
		ON CONFLICT (id) DO NOTHING;
	`
	if _, err = tx.Exec(ctx, usersQuery, string(superadminHash), string(adminHash), string(userHash), now); err != nil {
		return err
	}

	// 3. Seed DY50 Biometric Fingerprint Templates
	fpQuery := `
		INSERT INTO user_fingerprints (user_id, room_id, template_id, label, registered_at) VALUES
		('user-superadmin-01', 'room-kk-netsec', 1, 'Jempol Kanan', $1),
		('user-superadmin-01', 'room-kk-netsec', 2, 'Telunjuk Kanan', $1),
		('user-admin-01', 'room-kk-netsec', 5, 'Jempol Kanan', $1),
		('user-admin-01', 'room-kk-netsec', 6, 'Telunjuk Kanan', $1),
		('user-dosen-01', 'room-kk-netsec', 10, 'Jempol Kanan', $1),
		('user-mahasiswa-01', 'room-kk-netsec', 15, 'Telunjuk Kanan', $1)
		ON CONFLICT (user_id, room_id, template_id) DO NOTHING;
	`
	if _, err = tx.Exec(ctx, fpQuery, now); err != nil {
		log.Printf("⚠️ Warning seeding fingerprints: %v", err)
	}

	log.Println("✅ Initial rooms, users, and DY50 fingerprint credentials seeded successfully.")
	return tx.Commit(ctx)
}
