-- PostgreSQL Schema for Smart Door Lock System (Prodi Informatika FT UNTAN)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('user', 'admin', 'superadmin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status_enum AS ENUM ('ACTIVE', 'PENDING_APPROVAL', 'REJECTED', 'SUSPENDED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE door_status_enum AS ENUM ('OPEN', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_type_enum AS ENUM (
        'FINGERPRINT_AUTH',
        'REMOTE_UNLOCK',
        'DOOR_OPENED',
        'DOOR_CLOSED',
        'ALARM_TRIGGERED',
        'ALARM_CLEARED',
        'DEVICE_ONLINE',
        'DEVICE_OFFLINE',
        'ENROLLMENT_SUCCESS',
        'ENROLLMENT_FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE auth_result_enum AS ENUM ('SUCCESS', 'FAILED', 'SYSTEM', 'DENIED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'user',
    status user_status_enum NOT NULL DEFAULT 'ACTIVE',
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    device_id VARCHAR(64) NOT NULL UNIQUE,
    used_fingerprints INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Fingerprints Table (DY50 slots 1 to 120 per room/node)
-- Corresponds to Entity: fingerprint (id_fingerprint, label, registered_at, id_user, id_room)
CREATE TABLE IF NOT EXISTS user_fingerprints (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE SET NULL,
    template_id INT NOT NULL,
    label VARCHAR(64) NOT NULL DEFAULT 'Jempol Kanan',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_room_template UNIQUE (user_id, room_id, template_id)
);

-- 4. Access Logs Table (Audit Trail)
-- Corresponds to Entity: log (id_log, timestamp, description, status, access_type, id_user, id_room)
CREATE TABLE IF NOT EXISTS access_logs (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(128) NOT NULL UNIQUE,
    device_id VARCHAR(64) NOT NULL,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE SET NULL,
    room_name VARCHAR(255) NOT NULL,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    user_role user_role_enum,
    fingerprint_template_id INT,
    activity_type activity_type_enum NOT NULL,
    auth_result auth_result_enum NOT NULL,
    door_status_at_event door_status_enum,
    details TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_device_id ON access_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_event_id ON access_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_user_fingerprints_template_id ON user_fingerprints(template_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
