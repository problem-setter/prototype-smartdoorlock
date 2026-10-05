package handlers

import (
	"net/http"

	"github.com/personalism/smart-door-lock/backend/internal/websocket"
)

type WSHandler struct {
	hub *websocket.Hub
}

func NewWSHandler(hub *websocket.Hub) *WSHandler {
	return &WSHandler{hub: hub}
}

func (h *WSHandler) ServeWS(w http.ResponseWriter, r *http.Request) {
	websocket.ServeWS(h.hub, w, r)
}
