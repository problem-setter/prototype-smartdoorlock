package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	pahomqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/google/uuid"
	"github.com/personalism/smart-door-lock/backend/internal/models"
)

var (
	brokerURL = "tcp://localhost:1883"
	deviceID  = "ESP32-KK-NETSEC-02"
	client    pahomqtt.Client
)

func main() {
	fmt.Println("==========================================================")
	fmt.Println("  ESP32 Edge Node Simulator - Smart Door Lock (FT UNTAN)  ")
	fmt.Println("==========================================================")

	if envBroker := os.Getenv("MQTT_BROKER_URL"); envBroker != "" {
		brokerURL = envBroker
	}
	if envDevice := os.Getenv("DEVICE_ID"); envDevice != "" {
		deviceID = envDevice
	}

	opts := pahomqtt.NewClientOptions()
	opts.AddBroker(brokerURL)
	opts.SetClientID(fmt.Sprintf("esp32-sim-%s-%d", deviceID, time.Now().UnixNano()%1000))
	opts.SetAutoReconnect(true)

	opts.SetOnConnectHandler(func(c pahomqtt.Client) {
		fmt.Printf("🔌 [Simulator] Terhubung ke MQTT broker: %s (DeviceID: %s)\n", brokerURL, deviceID)
		// Subscribe to commands
		cmdTopic := fmt.Sprintf("doorlock/%s/cmd", deviceID)
		c.Subscribe(cmdTopic, 1, handleCommand)
		fmt.Printf("📥 [Simulator] Mendengarkan perintah pada: %s\n", cmdTopic)

		// Send initial online status
		sendStatus("ONLINE", "192.168.1.101", 12)
	})

	client = pahomqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		log.Fatalf("❌ Gagal terhubung ke MQTT Broker: %v\nPastikan Mosquitto aktif di port 1883.", token.Error())
	}

	scanner := bufio.NewScanner(os.Stdin)
	for {
		printMenu()
		fmt.Print("Pilih opsi (1-10, 0 untuk keluar): ")
		if !scanner.Scan() {
			break
		}
		choice := strings.TrimSpace(scanner.Text())

		switch choice {
		case "1":
			// Skenario 1: Sidik Jari Terdaftar (Slot #1)
			fmt.Print("Masukkan Template ID (default 1): ")
			scanner.Scan()
			tIDStr := strings.TrimSpace(scanner.Text())
			tID := 1
			if val, err := strconv.Atoi(tIDStr); err == nil && val > 0 {
				tID = val
			}
			simulateAccess(tID, true, "AUTH_SUCCESS")

		case "2":
			// Skenario 2: Sidik Jari Tidak Terdaftar (Slot #99)
			simulateAccess(99, false, "AUTH_FAILED")

		case "3":
			// Skenario 3: Pintu Dibuka lalu Ditutup Normal (< 15 detik)
			simulateDoorOpenClose(3)

		case "4":
			// Skenario 4: Pintu Terbuka Melebihi Batas Waktu (Alarm Buzzer Aktif)
			simulateDoorTimeoutAlarm(20)

		case "5":
			// Skenario 5: Pintu Ditutup saat Alarm Aktif (Alarm Berhenti)
			simulateClearAlarmByDoorClose()

		case "6":
			// Skenario 6: Simulasi Offline Sync (Kirim batch event setelah koneksi pulih)
			simulateOfflineReplay()

		case "7":
			// Skenario 9: Simulasi Proses 4-Tahap Enrollment DY50
			fmt.Print("Masukkan Template ID untuk didaftarkan (1-120): ")
			scanner.Scan()
			tIDStr := strings.TrimSpace(scanner.Text())
			tID := 5
			if val, err := strconv.Atoi(tIDStr); err == nil && val > 0 {
				tID = val
			}
			simulateEnrollmentProgression(tID, "usr-003")

		case "8":
			// Skenario 12: Kirim Status Telemetri ESP32 (Online/Offline)
			fmt.Print("Kirim status (1: ONLINE, 2: OFFLINE): ")
			scanner.Scan()
			st := "ONLINE"
			if strings.TrimSpace(scanner.Text()) == "2" {
				st = "OFFLINE"
			}
			sendStatus(st, "192.168.1.101", 14)

		case "9":
			// Skenario 13: Uji Deduplikasi (Kirim 2x paket dengan event_id identik)
			simulateDuplicateEvents()

		case "10":
			fmt.Print("Ganti Device ID aktif (saat ini: " + deviceID + "): ")
			scanner.Scan()
			newDev := strings.TrimSpace(scanner.Text())
			if newDev != "" {
				deviceID = newDev
				fmt.Println("Device ID berhasil diubah menjadi:", deviceID)
			}

		case "0":
			fmt.Println("Keluar dari simulator.")
			return

		default:
			fmt.Println("Pilihan tidak valid.")
		}
		time.Sleep(500 * time.Millisecond)
	}
}

func printMenu() {
	fmt.Println("\n----------------------------------------------------------")
	fmt.Printf(" Device ID Aktif: [%s]\n", deviceID)
	fmt.Println("----------------------------------------------------------")
	fmt.Println(" 1. Skenario 1: Tempel Sidik Jari Terdaftar (Akses Diterima)")
	fmt.Println(" 2. Skenario 2: Tempel Sidik Jari Tidak Terdaftar (Akses Ditolak)")
	fmt.Println(" 3. Skenario 3: Pintu Terbuka Normal & Ditutup (< batas waktu)")
	fmt.Println(" 4. Skenario 4: Pintu Dibiarkan Terbuka (Memicu Alarm Timeout)")
	fmt.Println(" 5. Skenario 5: Pintu Ditutup Saat Alarm Aktif (Alarm Berhenti)")
	fmt.Println(" 6. Skenario 6: Sync Batch Event Setelah Koneksi Pulih (Offline Buffer)")
	fmt.Println(" 7. Skenario 9: Alur Enrollment Sidik Jari DY50 (4 Tahap)")
	fmt.Println(" 8. Skenario 12: Kirim Telemetri Status Perangkat (Online/Offline)")
	fmt.Println(" 9. Skenario 13: Uji Deduplikasi Event ID Ganda (QoS 1 Replay)")
	fmt.Println(" 10. Ganti Device ID")
	fmt.Println(" 0. Keluar")
	fmt.Println("----------------------------------------------------------")
}

func handleCommand(c pahomqtt.Client, msg pahomqtt.Message) {
	fmt.Printf("\n⚡ [ESP32 Command Received] Topic: %s | Payload: %s\n", msg.Topic(), string(msg.Payload()))
	var cmd models.CommandPayload
	if err := json.Unmarshal(msg.Payload(), &cmd); err != nil {
		return
	}

	switch cmd.Command {
	case models.CmdUnlock:
		fmt.Printf("🔓 [Hardware Solenoid] RELAY AKTIF selama %d detik! Solenoid terbuka.\n", cmd.Duration)
		go func(dur int) {
			time.Sleep(time.Duration(dur) * time.Second)
			fmt.Println("🔒 [Hardware Solenoid] RELAY MATI. Pintu terkunci kembali secara otomatis.")
		}(cmd.Duration)

	case models.CmdLock:
		fmt.Println("🔒 [Hardware Solenoid] RELAY MATI. Pintu dikunci paksa.")

	case models.CmdClearAlarm:
		fmt.Println("🔕 [Hardware Buzzer] ALARM DIMATIKAN oleh perintah dashboard.")

	case models.CmdStartEnroll:
		fmt.Printf("👆 [Hardware DY50] Memulai pendaftaran sidik jari untuk Slot #%v...\n", cmd.TemplateID)
		if cmd.TemplateID != nil {
			go simulateEnrollmentProgression(*cmd.TemplateID, "usr-003")
		}
	}
}

func simulateAccess(templateID int, granted bool, authResult string) {
	eventID := fmt.Sprintf("EVT-AUTH-%s-%d", time.Now().Format("20060102150405"), templateID)
	payload := models.AccessEventPayload{
		EventID:    eventID,
		TemplateID: &templateID,
		Granted:    granted,
		AuthResult: authResult,
		Timestamp:  time.Now().Unix(),
	}

	data, _ := json.Marshal(payload)
	topic := fmt.Sprintf("doorlock/%s/access", deviceID)
	client.Publish(topic, 1, false, data)
	fmt.Printf("📤 [MQTT Publish] %s -> %s\n", topic, string(data))
}

func simulateDoorOpenClose(seconds int) {
	topic := fmt.Sprintf("doorlock/%s/door", deviceID)

	// 1. Open
	openPayload := models.DoorEventPayload{
		DoorStatus:   "OPEN",
		OpenDuration: 0,
		Timestamp:    time.Now().Unix(),
	}
	data1, _ := json.Marshal(openPayload)
	client.Publish(topic, 1, false, data1)
	fmt.Printf("🚪 Pintu Terbuka (MC-38 Magnetic Switch terlepas)\n")

	time.Sleep(time.Duration(seconds) * time.Second)

	// 2. Closed
	closePayload := models.DoorEventPayload{
		DoorStatus:   "CLOSED",
		OpenDuration: seconds,
		Timestamp:    time.Now().Unix(),
	}
	data2, _ := json.Marshal(closePayload)
	client.Publish(topic, 1, false, data2)
	fmt.Printf("🚪 Pintu Tertutup kembali (MC-38 Magnetic Switch tersambung)\n")
}

func simulateDoorTimeoutAlarm(durationSec int) {
	topicDoor := fmt.Sprintf("doorlock/%s/door", deviceID)
	topicAlarm := fmt.Sprintf("doorlock/%s/alarm", deviceID)

	// 1. Door Open
	openPayload := models.DoorEventPayload{
		DoorStatus:   "OPEN",
		OpenDuration: 0,
		Timestamp:    time.Now().Unix(),
	}
	data1, _ := json.Marshal(openPayload)
	client.Publish(topicDoor, 1, false, data1)
	fmt.Printf("🚪 Pintu Terbuka... Dibiarkan terbuka selama %d detik\n", durationSec)

	// 2. Trigger Alarm
	alarmPayload := models.AlarmEventPayload{
		EventID:      fmt.Sprintf("EVT-ALARM-%s", time.Now().Format("20060102150405")),
		AlarmState:   "TRIGGERED",
		Reason:       fmt.Sprintf("Pintu terbuka melebihi batas waktu (%d detik)", durationSec),
		OpenDuration: durationSec,
		Timestamp:    time.Now().Unix(),
	}
	data2, _ := json.Marshal(alarmPayload)
	client.Publish(topicAlarm, 1, false, data2)
	fmt.Printf("🚨🚨🚨 [BUZZER AKTIF] Alarm berbunyi karena pintu terbuka terlalu lama! 🚨🚨🚨\n")
}

func simulateClearAlarmByDoorClose() {
	topicDoor := fmt.Sprintf("doorlock/%s/door", deviceID)
	closePayload := models.DoorEventPayload{
		DoorStatus:   "CLOSED",
		OpenDuration: 0,
		Timestamp:    time.Now().Unix(),
	}
	data, _ := json.Marshal(closePayload)
	client.Publish(topicDoor, 1, false, data)
	fmt.Println("🚪 Pintu ditutup -> Buzzer alarm otomatis dinonaktifkan.")
}

func simulateOfflineReplay() {
	fmt.Println("📡 Menyinkronkan 3 event yang tersimpan di memori offline ESP32...")
	now := time.Now().Add(-10 * time.Minute)

	for i := 1; i <= 3; i++ {
		tID := i
		payload := models.AccessEventPayload{
			EventID:    fmt.Sprintf("EVT-OFFLINE-%s-%d", now.Format("20060102150405"), i),
			TemplateID: &tID,
			Granted:    true,
			AuthResult: "AUTH_SUCCESS",
			Timestamp:  now.Add(time.Duration(i*30) * time.Second).Unix(),
			Details:    fmt.Sprintf("Event akses offline berhasil disinkronkan (Slot #%d)", tID),
		}
		data, _ := json.Marshal(payload)
		client.Publish(fmt.Sprintf("doorlock/%s/access", deviceID), 1, false, data)
		time.Sleep(200 * time.Millisecond)
	}
	fmt.Println("✅ Semua event offline berhasil dikirim ke broker.")
}

func simulateEnrollmentProgression(templateID int, userID string) {
	topic := fmt.Sprintf("doorlock/%s/enroll/status", deviceID)

	steps := []struct {
		step    models.EnrollStep
		message string
		delay   time.Duration
	}{
		{models.EnrollStepWaitFinger1, "Tempelkan jari pertama pada sensor...", 1 * time.Second},
		{models.EnrollStepImage1Ok, "Gambar 1 berhasil diambil! Angkat jari.", 1 * time.Second},
		{models.EnrollStepLiftFinger, "Angkat jari dari sensor...", 1 * time.Second},
		{models.EnrollStepWaitFinger2, "Tempelkan kembali jari yang sama...", 1 * time.Second},
		{models.EnrollStepImage2Ok, "Gambar 2 berhasil diambil!", 1 * time.Second},
		{models.EnrollStepCreateModelOk, "Model template sidik jari berhasil dibuat!", 1 * time.Second},
		{models.EnrollStepStoreOk, fmt.Sprintf("Sidik jari berhasil disimpan di slot #%d!", templateID), 500 * time.Millisecond},
	}

	for _, s := range steps {
		payload := models.EnrollStatusPayload{
			Step:       s.step,
			Success:    true,
			Message:    s.message,
			TemplateID: templateID,
			UserID:     &userID,
		}
		data, _ := json.Marshal(payload)
		client.Publish(topic, 1, false, data)
		fmt.Printf("   🔄 [Enrollment Step] %s: %s\n", s.step, s.message)
		time.Sleep(s.delay)
	}
	fmt.Printf("✅ Pendaftaran sidik jari slot #%d selesai!\n", templateID)
}

func sendStatus(status string, ip string, usedFingerprints int) {
	payload := models.StatusPayload{
		Status:           status,
		IPAddress:        ip,
		UsedFingerprints: usedFingerprints,
		Timestamp:        time.Now().Unix(),
	}
	data, _ := json.Marshal(payload)
	topic := fmt.Sprintf("doorlock/%s/status", deviceID)
	client.Publish(topic, 1, false, data)
	fmt.Printf("📡 [Status Telemetri] %s -> %s\n", topic, string(data))
}

func simulateDuplicateEvents() {
	eventID := fmt.Sprintf("EVT-DUP-TEST-%s", uuid.New().String()[:6])
	tID := 1
	payload := models.AccessEventPayload{
		EventID:    eventID,
		TemplateID: &tID,
		Granted:    true,
		AuthResult: "AUTH_SUCCESS",
		Timestamp:  time.Now().Unix(),
		Details:    "Uji coba paket duplikat QoS 1 replay",
	}
	data, _ := json.Marshal(payload)
	topic := fmt.Sprintf("doorlock/%s/access", deviceID)

	fmt.Println("📤 Mengirim paket PERTAMA dengan EventID:", eventID)
	client.Publish(topic, 1, false, data)

	time.Sleep(500 * time.Millisecond)

	fmt.Println("📤 Mengirim paket KEDUA dengan EventID YANG SAMA (Replay):", eventID)
	client.Publish(topic, 1, false, data)

	fmt.Println("✅ Verifikasi: Backend Go harus mengabaikan paket kedua dan tidak memicu unlock/log ganda.")
}
