package websocket

import (
	"testing"
	"time"

	"github.com/personalism/smart-door-lock/backend/internal/models"
)

func TestHub_CreationAndBroadcast(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	if hub == nil {
		t.Fatal("expected non-nil hub")
	}

	// Broadcast an event without panic
	testPayload := map[string]string{
		"message": "test event",
	}

	// Should safely broadcast even when no clients are connected
	hub.BroadcastEvent(models.WSEventRoomUpdated, testPayload)
	hub.BroadcastEvent(models.WSEventLogCreated, testPayload)

	// Wait briefly for goroutine to process
	time.Sleep(20 * time.Millisecond)
}
