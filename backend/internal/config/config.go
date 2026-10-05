package config

import (
	"os"
	"strings"
)

type Config struct {
	Port               string
	DatabaseURL        string
	MQTTBrokerURL      string
	JWTSecret          string
	CORSAllowedOrigins []string
	Environment        string
	AdminPassword      string
}

func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://smartlock_user:smartlock_password@localhost:5432/smart_door_lock?sslmode=disable"
	}

	mqttBroker := os.Getenv("MQTT_BROKER_URL")
	if mqttBroker == "" {
		mqttBroker = "tcp://localhost:1883"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "untan_smart_door_lock_super_secret_jwt_key_2026"
	}

	corsStr := os.Getenv("CORS_ALLOWED_ORIGINS")
	var origins []string
	if corsStr != "" {
		for _, o := range strings.Split(corsStr, ",") {
			if trimmed := strings.TrimSpace(o); trimmed != "" {
				origins = append(origins, trimmed)
			}
		}
	}
	if len(origins) == 0 {
		origins = []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"}
	}

	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		adminPassword = "Superadmin#2026"
	}

	return &Config{
		Port:               port,
		DatabaseURL:        dbURL,
		MQTTBrokerURL:      mqttBroker,
		JWTSecret:          jwtSecret,
		CORSAllowedOrigins: origins,
		Environment:        os.Getenv("ENV"),
		AdminPassword:      adminPassword,
	}
}
