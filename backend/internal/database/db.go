package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

func ConnectDB(ctx context.Context, databaseURL string) (*DB, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = 1 * time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	var pool *pgxpool.Pool
	var connErr error

	// Retry connection with exponential backoff up to 5 attempts (useful in docker startup)
	for i := 0; i < 5; i++ {
		pool, connErr = pgxpool.NewWithConfig(ctx, config)
		if connErr == nil {
			pingCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
			err = pool.Ping(pingCtx)
			cancel()
			if err == nil {
				log.Println("✅ Successfully connected to PostgreSQL database")
				return &DB{Pool: pool}, nil
			}
			pool.Close()
		}
		log.Printf("⏳ Waiting for database connection (attempt %d/5)...", i+1)
		time.Sleep(2 * time.Second)
	}

	return nil, fmt.Errorf("could not connect to database after 5 attempts: %w", connErr)
}

func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}
