package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/personalism/smart-door-lock/backend/internal/models"
)

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("🔌 [WebSocket] Client connected (%s). Total clients: %d", client.ID, len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				log.Printf("🔌 [WebSocket] Client disconnected (%s). Total clients: %d", client.ID, len(h.clients))
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()

		case <-ticker.C:
			// Periodic WebSocket Heartbeat
			hbEvent := models.NewWSEvent(models.WSEventHeartbeat, map[string]any{"time": time.Now().UTC()})
			data, err := json.Marshal(hbEvent)
			if err == nil {
				h.Broadcast(data)
			}
		}
	}
}

func (h *Hub) Broadcast(data []byte) {
	select {
	case h.broadcast <- data:
	default:
		log.Println("⚠️ [WebSocket] Broadcast channel full, dropping message")
	}
}

func (h *Hub) BroadcastEvent(eventType models.WSEventType, payload any) {
	event := models.NewWSEvent(eventType, payload)
	data, err := json.Marshal(event)
	if err != nil {
		log.Printf("❌ [WebSocket] Failed to marshal WS event: %v", err)
		return
	}
	h.Broadcast(data)
}

func (h *Hub) ConnectedClientsCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
