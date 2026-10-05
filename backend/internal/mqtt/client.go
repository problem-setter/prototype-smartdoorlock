package mqtt

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	pahomqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/personalism/smart-door-lock/backend/internal/models"
)

type MQTTClient struct {
	client     pahomqtt.Client
	brokerURL  string
	dispatcher *MQTTDispatcher
}

func NewMQTTClient(brokerURL string, dispatcher *MQTTDispatcher) *MQTTClient {
	return &MQTTClient{
		brokerURL:  brokerURL,
		dispatcher: dispatcher,
	}
}

func (m *MQTTClient) Connect() error {
	opts := pahomqtt.NewClientOptions()
	opts.AddBroker(m.brokerURL)
	opts.SetClientID(fmt.Sprintf("smartlock-backend-%d", time.Now().UnixNano()%100000))
	opts.SetAutoReconnect(true)
	opts.SetMaxReconnectInterval(5 * time.Second)
	opts.SetKeepAlive(30 * time.Second)
	opts.SetPingTimeout(10 * time.Second)

	opts.SetOnConnectHandler(func(c pahomqtt.Client) {
		log.Printf("🔌 [MQTT] Connected to broker: %s", m.brokerURL)
		m.subscribeAll(c)
	})

	opts.SetConnectionLostHandler(func(c pahomqtt.Client, err error) {
		log.Printf("⚠️ [MQTT] Connection lost: %v. Attempting auto-reconnect...", err)
	})

	client := pahomqtt.NewClient(opts)
	m.client = client

	token := client.Connect()
	if token.Wait() && token.Error() != nil {
		return fmt.Errorf("MQTT connection failed: %w", token.Error())
	}

	return nil
}

func (m *MQTTClient) subscribeAll(c pahomqtt.Client) {
	topic := "doorlock/#"
	token := c.Subscribe(topic, 1, func(cl pahomqtt.Client, msg pahomqtt.Message) {
		log.Printf("📥 [MQTT] Received message on topic %s (%d bytes)", msg.Topic(), len(msg.Payload()))
		m.dispatcher.HandleMessage(msg.Topic(), msg.Payload())
	})
	if token.Wait() && token.Error() != nil {
		log.Printf("❌ [MQTT] Failed to subscribe to %s: %v", topic, token.Error())
	} else {
		log.Printf("📥 [MQTT] Successfully subscribed to topic: %s", topic)
	}
}

func (m *MQTTClient) PublishCommand(topic string, cmd models.CommandPayload) error {
	if m.client == nil || !m.client.IsConnected() {
		return fmt.Errorf("MQTT client not connected")
	}

	data, err := json.Marshal(cmd)
	if err != nil {
		return fmt.Errorf("failed to marshal command: %w", err)
	}

	token := m.client.Publish(topic, 1, false, data)
	if token.WaitTimeout(3*time.Second) && token.Error() != nil {
		return fmt.Errorf("failed to publish to %s: %w", topic, token.Error())
	}

	log.Printf("📤 [MQTT] Published command to %s: %s", topic, string(data))
	return nil
}

func (m *MQTTClient) Disconnect() {
	if m.client != nil && m.client.IsConnected() {
		m.client.Disconnect(250)
		log.Println("🔌 [MQTT] Disconnected from broker")
	}
}
