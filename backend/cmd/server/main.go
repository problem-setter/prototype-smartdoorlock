package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chi_middleware "github.com/go-chi/chi/v5/middleware"
	"github.com/personalism/smart-door-lock/backend/internal/config"
	"github.com/personalism/smart-door-lock/backend/internal/database"
	"github.com/personalism/smart-door-lock/backend/internal/handlers"
	"github.com/personalism/smart-door-lock/backend/internal/middleware"
	"github.com/personalism/smart-door-lock/backend/internal/mqtt"
	"github.com/personalism/smart-door-lock/backend/internal/repository"
	"github.com/personalism/smart-door-lock/backend/internal/service"
	"github.com/personalism/smart-door-lock/backend/internal/websocket"
)

func main() {
	log.Println("🚀 Memulai Backend Service Smart Door Lock (FT UNTAN)...")

	cfg := config.LoadConfig()

	// 1. PostgreSQL Database Initialization
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	db, err := database.ConnectDB(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("❌ Gagal terhubung ke database PostgreSQL: %v", err)
	}
	defer db.Close()

	if err := db.RunMigrations(ctx); err != nil {
		log.Fatalf("❌ Gagal menjalankan migrasi database: %v", err)
	}

	if err := db.SeedInitialData(ctx); err != nil {
		log.Printf("⚠️ Gagal seeding data awal: %v", err)
	}

	// 2. Repositories
	userRepo := repository.NewUserRepository(db)
	roomRepo := repository.NewRoomRepository(db)
	logRepo := repository.NewLogRepository(db)

	// 3. WebSocket Hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// 4. MQTT & Services Initialization
	roomService := service.NewRoomService(roomRepo, logRepo, userRepo, wsHub, nil)
	dispatcher := mqtt.NewMQTTDispatcher(roomRepo, userRepo, logRepo, roomService, wsHub)
	mqttClient := mqtt.NewMQTTClient(cfg.MQTTBrokerURL, dispatcher)
	roomService.SetMQTTPublisher(mqttClient)

	authService := service.NewAuthService(userRepo, cfg.JWTSecret, wsHub)
	userService := service.NewUserService(userRepo, roomRepo, wsHub, mqttClient)
	logService := service.NewLogService(logRepo)
	hardwareService := service.NewHardwareService(roomRepo, userRepo, wsHub, mqttClient)

	// Attempt MQTT connect in goroutine with retry
	go func() {
		for {
			if err := mqttClient.Connect(); err != nil {
				log.Printf("⚠️ [MQTT] Menunggu broker Mosquitto di %s: %v (mencoba lagi dalam 5s)", cfg.MQTTBrokerURL, err)
				time.Sleep(5 * time.Second)
				continue
			}
			break
		}
	}()

	// 5. REST Handlers
	authHandler := handlers.NewAuthHandler(authService)
	roomHandler := handlers.NewRoomHandler(roomService, authService)
	userHandler := handlers.NewUserHandler(userService)
	logHandler := handlers.NewLogHandler(logService)
	hardwareHandler := handlers.NewHardwareHandler(hardwareService, roomService)
	wsHandler := handlers.NewWSHandler(wsHub)

	// 6. Router Setup
	r := chi.NewRouter()

	r.Use(middleware.CORSMiddleware(cfg.CORSAllowedOrigins))
	r.Use(middleware.LoggingMiddleware)
	r.Use(chi_middleware.Recoverer)

	// Health Check & Root
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok","service":"smart-door-lock-backend","timestamp":"` + time.Now().UTC().Format(time.RFC3339) + `"}`))
	})

	// Gorilla WebSocket Endpoint
	r.Get("/ws", wsHandler.ServeWS)

	// API Routes
	r.Route("/api", func(api chi.Router) {
		// Public Auth Endpoints
		api.Route("/auth", func(auth chi.Router) {
			auth.Post("/login", authHandler.Login)
			auth.Post("/register", authHandler.Register)
			auth.Get("/ticket/{ticketId}", authHandler.CheckTicket)

			// Authenticated user profile
			auth.Group(func(authed chi.Router) {
				authed.Use(middleware.AuthMiddleware(cfg.JWTSecret))
				authed.Get("/me", authHandler.GetMe)
			})
		})

		// Rooms Endpoints
		api.Route("/rooms", func(rooms chi.Router) {
			rooms.Get("/", roomHandler.ListRooms)
			rooms.Get("/{id}", roomHandler.GetRoom)

			// Authenticated room actions
			rooms.Group(func(authed chi.Router) {
				authed.Use(middleware.AuthMiddleware(cfg.JWTSecret))

				// User can request access
				authed.Post("/{id}/request-access", roomHandler.RequestAccess)

				// Admin & Superadmin controls
				authed.Group(func(admin chi.Router) {
					admin.Use(middleware.RequireRole("admin", "superadmin"))
					admin.Post("/{id}/unlock", roomHandler.RemoteUnlock)       // Scenario 8
					admin.Post("/{id}/lock", roomHandler.ForceLock)
					admin.Post("/{id}/clear-alarm", roomHandler.ClearAlarm)     // Scenario 5
					admin.Put("/{id}/settings", roomHandler.UpdateSettings)
				})
			})
		})

		// Users Endpoints (Admin & Superadmin only)
		api.Route("/users", func(users chi.Router) {
			users.Use(middleware.AuthMiddleware(cfg.JWTSecret))
			users.Use(middleware.RequireRole("admin", "superadmin"))

			users.Get("/", userHandler.ListUsers)
			users.Get("/{id}", userHandler.GetUser)
			users.Post("/", userHandler.CreateUser)
			users.Patch("/{id}", userHandler.UpdateUser)
			users.Delete("/{id}", userHandler.DeleteUser)

			users.Post("/{id}/approve", userHandler.ApproveUser)   // Scenario 10
			users.Post("/{id}/reject", userHandler.RejectUser)
			users.Post("/{id}/suspend", userHandler.SuspendUser)
			users.Post("/{id}/activate", userHandler.ActivateUser)

			// Biometric Fingerprint Slot Management
			users.Post("/{id}/fingerprints", userHandler.AddFingerprint)               // Scenario 9
			users.Delete("/{id}/fingerprints/{templateId}", userHandler.DeleteFingerprint) // Scenario 9
		})

		// Audit Logs Endpoints
		api.Route("/logs", func(logs chi.Router) {
			logs.Get("/", logHandler.ListLogs)
			logs.Get("/stats", logHandler.GetStats)
			logs.Get("/export/csv", logHandler.ExportCSV)
			logs.Get("/export/json", logHandler.ExportJSON)
		})

		// Hardware Control & Telemetry Endpoints
		api.Route("/hardware", func(hw chi.Router) {
			hw.Get("/devices", hardwareHandler.GetDevices)

			hw.Group(func(authed chi.Router) {
				authed.Use(middleware.AuthMiddleware(cfg.JWTSecret))
				authed.Use(middleware.RequireRole("admin", "superadmin"))

				hw.Post("/enroll/start", hardwareHandler.StartEnrollment)   // Scenario 9
				hw.Post("/enroll/cancel", hardwareHandler.CancelEnrollment)
			})
		})
	})

	// 7. Start HTTP Server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("🌐 Server HTTP & WebSocket mendengarkan pada http://0.0.0.0:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Kesalahan server HTTP: %v", err)
		}
	}()

	// 8. Graceful Shutdown Listener
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("🛑 Menerima sinyal berhenti, mematikan server secara anggun...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	mqttClient.Disconnect()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("❌ Gagal mematikan server HTTP secara anggun: %v", err)
	}

	log.Println("✅ Backend Service berhasil dimatikan dengan aman.")
}
