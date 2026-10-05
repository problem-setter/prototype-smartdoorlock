package mqtt

import (
	"testing"
	"time"
)

func TestMQTTDispatcher_Deduplication(t *testing.T) {
	d := &MQTTDispatcher{
		seenEvents: make(map[string]time.Time),
	}

	eventID := "EVT-20261002-12345"

	// First time: should not be duplicate
	if d.isDuplicate(eventID) {
		t.Errorf("expected first occurrence of %s not to be duplicate", eventID)
	}

	// Second time: should be duplicate
	if !d.isDuplicate(eventID) {
		t.Errorf("expected second occurrence of %s to be recognized as duplicate", eventID)
	}

	// Third time: still duplicate
	if !d.isDuplicate(eventID) {
		t.Errorf("expected third occurrence of %s to be recognized as duplicate", eventID)
	}

	// Different event ID: should not be duplicate
	differentEventID := "EVT-20261002-99999"
	if d.isDuplicate(differentEventID) {
		t.Errorf("expected distinct event %s not to be duplicate", differentEventID)
	}

	// Empty event ID: should return false (not track empty IDs)
	if d.isDuplicate("") {
		t.Errorf("expected empty event ID to return false")
	}
}
