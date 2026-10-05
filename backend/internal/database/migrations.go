package database

import (
	"context"
	_ "embed"
	"fmt"
	"log"
)

//go:embed init.sql
var initSQL string

func (db *DB) RunMigrations(ctx context.Context) error {
	log.Println("🔄 Running database migrations...")
	_, err := db.Pool.Exec(ctx, initSQL)
	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}
	log.Println("✅ Database schema migrated successfully")
	return nil
}
