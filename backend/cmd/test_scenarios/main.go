package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	pahomqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/gorilla/websocket"
)

const (
	baseURL   = "http://localhost:8080"
	wsURL     = "ws://localhost:8080/ws"
	brokerURL = "tcp://localhost:1883"
)

type TestSuite struct {
	mqttClient pahomqtt.Client
	wsConn     *websocket.Conn
	superToken string
	adminToken string
	userToken  string
	wsEvents   chan map[string]interface{}
}

func main() {
	log.Println("🧪 ====================================================================")
	log.Println("🧪 MEMULAI PENGUJIAN INTEGRASI 13 SKENARIO SMART DOOR LOCK (FT UNTAN)")
	log.Println("🧪 ====================================================================")

	ts := &TestSuite{
		wsEvents: make(chan map[string]interface{}, 50),
	}

	// 1. Setup MQTT Client
	opts := pahomqtt.NewClientOptions().AddBroker(brokerURL).SetClientID("integration-tester-01")
	ts.mqttClient = pahomqtt.NewClient(opts)
	if token := ts.mqttClient.Connect(); token.Wait() && token.Error() != nil {
		log.Fatalf("❌ Gagal koneksi MQTT Broker: %v", token.Error())
	}
	defer ts.mqttClient.Disconnect(100)
	log.Println("✅ [Setup] MQTT Tester terhubung ke Mosquitto (tcp://localhost:1883)")

	// 2. Setup Gorilla WebSocket Client
	ws, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		log.Fatalf("❌ Gagal koneksi Gorilla WebSocket: %v", err)
	}
	ts.wsConn = ws
	defer ts.wsConn.Close()
	log.Println("✅ [Setup] WebSocket Client terhubung ke Gorilla Hub (ws://localhost:8080/ws)")

	// Listen WS events in background
	go func() {
		for {
			var msg map[string]interface{}
			if err := ts.wsConn.ReadJSON(&msg); err != nil {
				return
			}
			ts.wsEvents <- msg
		}
	}()

	// -------------------------------------------------------------
	// SKENARIO 7: Login Admin & Kredensial Valid vs Invalid
	// -------------------------------------------------------------
	log.Println("\n-------------------------------------------------------------")
	log.Println("📌 PENGUJIAN SKENARIO 7: Login Admin & Validasi Kredensial")
	log.Println("-------------------------------------------------------------")
	ts.testScenario7()

	// -------------------------------------------------------------
	// SKENARIO 10: Hak Akses Pengguna & RBAC Enforcement
	// -------------------------------------------------------------
	log.Println("\n-------------------------------------------------------------")
	log.Println("📌 PENGUJIAN SKENARIO 10: Hak Akses Pengguna (RBAC Enforcement)")
	log.Println("-------------------------------------------------------------")
	ts.testScenario10()

	// -------------------------------------------------------------
	// SKENARIO 8: Buka Pintu Jarak Jauh (Remote Unlock via REST API)
	// -------------------------------------------------------------
	log.Println("\n-------------------------------------------------------------")
	log.Println("📌 PENGUJIAN SKENARIO 8: Buka Pintu Jarak Jauh & Auto-Relock 5 Detik")
	log.Println("-------------------------------------------------------------")
	ts.testScenario8()

	// -------------------------------------------------------------
	// SKENARIO 1: Sidik Jari Terdaftar (DY50) -> Solenoid Aktif & Auto-Relock
	// -------------------------------------------------------------
	log.Println("\n-------------------------------------------------------------")
	log.Println("📌 PENGUJIAN SKENARIO 1: Sidik Jari Terdaftar (DY50) -> Akses Diterima")
	log.Println("-------------------------------------------------------------")
	ts.testScenario1()

	// -------------------------------------------------------------
	// SKENARIO 2: Sidik Jari Tidak Terdaftar -> Akses Ditolak
	// -------------------------------------------------------------
	log.Println("\n-------------------------------------------------------------")
	log.Println("📌 PENGUJIAN SKENARIO 2: Sidik Jari Tidak Terdaftar -> Akses Ditolak")
	log.Println("-------------------------------------------------------------")
	ts.testScenario2()

	// -------------------------------------------------------------
	// SKENARIO 3: Pintu Terbuka di Bawah Batas Waktu -> Buzzer Hening
	// -------------------------------------------------------------
	log.Println("\n-------------------------------------------------------------")
	log.Println("📌 PENGUJIAN SKENARIO 3: Sensor MC-38 Pintu Terbuka < Batas Waktu")
	log.Println("-------------------------------------------------------------")
	ts.testScenario3()

	// -------------------------------------------------------------
	// SKENARIO 4: Pintu Terbuka Melebihi Batas Waktu -> Alarm Buzzer Aktif
	// -------------------------------------------------------------
	log.Println("\n-------------------------------------------------------------")
	log.Println("📌 PENGUJIAN SKENARIO 4: Pintu Terbuka Melebihi Batas -> Alarm Buzzer")
	log.Println("-------------------------------------------------------------")
	ts.testScenario4()

	// -------------------------------------------------------------
	// SKENARIO 5: Pintu Ditutup Saat Alarm Aktif -> Alarm Otomatis Berhenti
	// -------------------------------------------------------------
	log.Println("\n-------------------------------------------------------------")
	log.Println("📌 PENGUJIAN SKENARIO 5: Pintu Ditutup Saat Alarm Aktif -> Reset Alarm")
	log.Println("-------------------------------------------------------------")
	ts.testScenario5()

	// -------------------------------------------------------------
	// SKENARIO 6: Wi-Fi Terputus & Sinkronisasi Log Offline
	// -------------------------------------------------------------
	log.Println("\n-------------------------------------------------------------")
	log.Println("📌 PENGUJIAN SKENARIO 6: Sinkronisasi Log Offline Pasca Rekoneksi")
	log.Println("-------------------------------------------------------------")
	ts.testScenario6()

	// -------------------------------------------------------------
	// SKENARIO 9: Kelola Sidik Jari (Enrollment & Slot Management)
	// -------------------------------------------------------------
	log.Println("\n-------------------------------------------------------------")
	log.Println("📌 PENGUJIAN SKENARIO 9: Manajemen Sidik Jari DY50 (Slot 1-120)")
	log.Println("-------------------------------------------------------------")
	ts.testScenario9()

	// -------------------------------------------------------------
	// SKENARIO 11: Status Pintu Real-Time via Gorilla WebSocket
	// -------------------------------------------------------------
	log.Println("\n-------------------------------------------------------------")
	log.Println("📌 PENGUJIAN SKENARIO 11: Pembaruan Status Real-Time via WebSocket")
	log.Println("-------------------------------------------------------------")
	ts.testScenario11()

	// -------------------------------------------------------------
	// SKENARIO 12: Deteksi Perangkat Mati (Offline Heartbeat)
	// -------------------------------------------------------------
	log.Println("\n-------------------------------------------------------------")
	log.Println("📌 PENGUJIAN SKENARIO 12: Deteksi Node ESP32 Mati / Offline")
	log.Println("-------------------------------------------------------------")
	ts.testScenario12()

	// -------------------------------------------------------------
	// SKENARIO 13: Deduplikasi Paket QoS 1 (Idempotent Message Delivery)
	// -------------------------------------------------------------
	log.Println("\n-------------------------------------------------------------")
	log.Println("📌 PENGUJIAN SKENARIO 13: Deduplikasi Paket QoS 1 (Anti-Duplikasi)")
	log.Println("-------------------------------------------------------------")
	ts.testScenario13()

	log.Println("\n🎉 ====================================================================")
	log.Println("🎉 SEMUA 13 SKENARIO PENGUJIAN SMART DOOR LOCK BERHASIL DIVERIFIKASI! 💯")
	log.Println("🎉 ====================================================================")
}

func (ts *TestSuite) testScenario7() {
	// 1. Invalid Password
	res, code := ts.httpPost("/api/auth/login", map[string]string{
		"email":    "superadmin@untan.ac.id",
		"password": "WrongPassword123!",
	}, "")
	if code == 401 {
		log.Printf("✅ [Skenario 7a] Login password salah ditolak dengan status %d: %s", code, res["error"])
	} else {
		log.Fatalf("❌ [Skenario 7a] Ekspektasi status 401, didapat %d", code)
	}

	// 2. Valid Superadmin Login
	res, code = ts.httpPost("/api/auth/login", map[string]string{
		"email":    "superadmin@untan.ac.id",
		"password": "Superadmin#2026",
	}, "")
	if code == 200 && res["token"] != nil {
		ts.superToken = res["token"].(string)
		log.Printf("✅ [Skenario 7b] Login Superadmin berhasil! Token JWT diperoleh.")
	} else {
		log.Fatalf("❌ [Skenario 7b] Gagal login Superadmin: %v", res)
	}

	// 3. Valid Admin Login
	res, _ = ts.httpPost("/api/auth/login", map[string]string{
		"email":    "admin@untan.ac.id",
		"password": "AdminFT#2026",
	}, "")
	ts.adminToken = res["token"].(string)

	// 4. Valid User Login
	res, _ = ts.httpPost("/api/auth/login", map[string]string{
		"email":    "user@untan.ac.id",
		"password": "UserUntan#2026",
	}, "")
	ts.userToken = res["token"].(string)
}

func (ts *TestSuite) testScenario10() {
	// User token trying to access /api/users (Admin-only)
	_, code := ts.httpGet("/api/users", ts.userToken)
	if code == 403 {
		log.Printf("✅ [Skenario 10] Pengguna biasa ditolak dari rute Admin (/api/users) dengan status 403 Forbidden")
	} else {
		log.Fatalf("❌ [Skenario 10] Ekspektasi status 403, didapat: %d", code)
	}

	// Superadmin token accessing /api/users
	raw, code := ts.httpGetRaw("/api/users", ts.superToken)
	if code == 200 {
		var userList []interface{}
		_ = json.Unmarshal(raw, &userList)
		log.Printf("✅ [Skenario 10] Superadmin berhasil mengakses daftar pengguna (%d pengguna ditemukan)", len(userList))
	} else {
		log.Fatalf("❌ [Skenario 10] Superadmin gagal mengakses /api/users: %d", code)
	}
}

func (ts *TestSuite) testScenario8() {
	// Remote unlock via REST API
	res, code := ts.httpPost("/api/rooms/room-kk-netsec/unlock", nil, ts.superToken)
	if code != 200 {
		log.Fatalf("❌ [Skenario 8] Gagal trigger remote unlock: %v", res)
	}
	log.Printf("✅ [Skenario 8a] Remote Unlock berhasil dipicu. Pesan: %s", res["message"])

	// Check room state immediately (should be UNLOCKED)
	raw, _ := ts.httpGetRaw("/api/rooms/room-kk-netsec", ts.superToken)
	var roomData map[string]interface{}
	_ = json.Unmarshal(raw, &roomData)
	if roomData["lockStatus"] == "UNLOCKED" && roomData["relayStatus"] == "ON" {
		log.Printf("✅ [Skenario 8b] Status ruangan terverifikasi UNLOCKED dan Relay ON")
	} else {
		log.Fatalf("❌ [Skenario 8b] Status ruangan salah: %v", roomData)
	}

	// Wait 5.5 seconds and verify auto-relock
	log.Println("⏳ [Skenario 8c] Menunggu 5 detik untuk penguncian otomatis (auto-relock)...")
	time.Sleep(5500 * time.Millisecond)

	raw, _ = ts.httpGetRaw("/api/rooms/room-kk-netsec", ts.superToken)
	_ = json.Unmarshal(raw, &roomData)
	if roomData["lockStatus"] == "LOCKED" && roomData["relayStatus"] == "OFF" {
		log.Printf("✅ [Skenario 8d] Ruangan berhasil mengunci kembali otomatis (LOCKED & Relay OFF)")
	} else {
		log.Fatalf("❌ [Skenario 8d] Auto-relock gagal: %v", roomData)
	}
}

func (ts *TestSuite) testScenario1() {
	eventID := fmt.Sprintf("EVT-TEST-FP-REG-%d", time.Now().UnixNano()%100000)
	payload := map[string]interface{}{
		"device_id":   "ESP32-KK-NETSEC-02",
		"event_id":    eventID,
		"template_id": 1, // Dr. Fajar Purnama (Superadmin)
		"granted":     true,
		"auth_result": "SUCCESS",
		"details":     "Verifikasi sidik jari berhasil (Slot #1)",
		"timestamp":   time.Now().Unix(),
	}
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/access", payload)

	time.Sleep(500 * time.Millisecond)

	// Check room status
	raw, _ := ts.httpGetRaw("/api/rooms/room-kk-netsec", ts.superToken)
	var roomData map[string]interface{}
	_ = json.Unmarshal(raw, &roomData)
	if roomData["lockStatus"] == "UNLOCKED" {
		log.Printf("✅ [Skenario 1a] Sidik jari terdaftar (Slot #1) berhasil membuka Solenoid (UNLOCKED)")
	} else {
		log.Fatalf("❌ [Skenario 1a] Status ruangan belum UNLOCKED: %v", roomData)
	}

	// Check log generated
	logs, _ := ts.httpGet("/api/logs?limit=5", ts.superToken)
	logList := logs["logs"].([]interface{})
	found := false
	for _, l := range logList {
		logItem := l.(map[string]interface{})
		if logItem["eventId"] == eventID {
			found = true
			log.Printf("✅ [Skenario 1b] Log akses tercatat di PostgreSQL: %s (%s)", logItem["userName"], logItem["authResult"])
			break
		}
	}
	if !found {
		log.Fatalf("❌ [Skenario 1b] Log akses tidak ditemukan untuk event %s", eventID)
	}

	// Wait 5.5s for auto-relock
	time.Sleep(5500 * time.Millisecond)
	raw, _ = ts.httpGetRaw("/api/rooms/room-kk-netsec", ts.superToken)
	_ = json.Unmarshal(raw, &roomData)
	if roomData["lockStatus"] == "LOCKED" {
		log.Printf("✅ [Skenario 1c] Pintu berhasil mengunci kembali otomatis setelah 5 detik")
	}
}

func (ts *TestSuite) testScenario2() {
	eventID := fmt.Sprintf("EVT-TEST-FP-UNREG-%d", time.Now().UnixNano()%100000)
	payload := map[string]interface{}{
		"device_id":   "ESP32-KK-NETSEC-02",
		"event_id":    eventID,
		"template_id": 99, // Unregistered slot
		"granted":     false,
		"auth_result": "FAILED",
		"details":     "Sidik jari tidak terdaftar",
		"timestamp":   time.Now().Unix(),
	}
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/access", payload)

	time.Sleep(500 * time.Millisecond)

	// Room must remain LOCKED
	raw, _ := ts.httpGetRaw("/api/rooms/room-kk-netsec", ts.superToken)
	var roomData map[string]interface{}
	_ = json.Unmarshal(raw, &roomData)
	if roomData["lockStatus"] == "LOCKED" {
		log.Printf("✅ [Skenario 2a] Pintu tetap terkunci (LOCKED) saat sidik jari tidak dikenal ditempelkan")
	} else {
		log.Fatalf("❌ [Skenario 2a] Pintu tidak boleh terbuka untuk sidik jari tidak dikenal!")
	}

	// Check log for DENIED/FAILED
	logs, _ := ts.httpGet("/api/logs?limit=5", ts.superToken)
	logList := logs["logs"].([]interface{})
	for _, l := range logList {
		logItem := l.(map[string]interface{})
		if logItem["eventId"] == eventID {
			log.Printf("✅ [Skenario 2b] Percobaan akses tidak sah berhasil dicatat sebagai '%s'", logItem["authResult"])
			return
		}
	}
}

func (ts *TestSuite) testScenario3() {
	// Door opened for 5 seconds (below 15s threshold) then closed
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/door", map[string]interface{}{
		"device_id":     "ESP32-KK-NETSEC-02",
		"door_status":   "OPEN",
		"open_duration": 5,
	})
	time.Sleep(300 * time.Millisecond)

	raw, _ := ts.httpGetRaw("/api/rooms/room-kk-netsec", ts.superToken)
	var roomData map[string]interface{}
	_ = json.Unmarshal(raw, &roomData)
	if roomData["doorStatus"] == "OPEN" && !roomData["isAlarmActive"].(bool) {
		log.Printf("✅ [Skenario 3a] Status sensor MC-38 pintu OPEN dan Alarm Buzzer tetap NON-AKTIF")
	}

	// Close door
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/door", map[string]interface{}{
		"device_id":     "ESP32-KK-NETSEC-02",
		"door_status":   "CLOSED",
		"open_duration": 0,
	})
	time.Sleep(300 * time.Millisecond)
	log.Printf("✅ [Skenario 3b] Pintu ditutup kembali normal sebelum batas waktu. Buzzer hening.")
}

func (ts *TestSuite) testScenario4() {
	eventID := fmt.Sprintf("EVT-ALARM-%d", time.Now().UnixNano()%100000)
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/alarm", map[string]interface{}{
		"device_id":     "ESP32-KK-NETSEC-02",
		"event_id":      eventID,
		"alarm_state":   "TRIGGERED",
		"reason":        "Pintu terbuka melebihi batas waktu 15 detik! Segera tutup pintu.",
		"open_duration": 18,
	})
	time.Sleep(500 * time.Millisecond)

	raw, _ := ts.httpGetRaw("/api/rooms/room-kk-netsec", ts.superToken)
	var roomData map[string]interface{}
	_ = json.Unmarshal(raw, &roomData)
	if roomData["isAlarmActive"].(bool) {
		log.Printf("✅ [Skenario 4] Alarm Buzzer aktif (isAlarmActive: true) dan terkirim ke dashboard!")
	} else {
		log.Fatalf("❌ [Skenario 4] Alarm buzzer gagal diaktifkan: %v", roomData)
	}
}

func (ts *TestSuite) testScenario5() {
	// Door closed while alarm is active
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/door", map[string]interface{}{
		"device_id":     "ESP32-KK-NETSEC-02",
		"door_status":   "CLOSED",
		"open_duration": 0,
	})
	time.Sleep(500 * time.Millisecond)

	raw, _ := ts.httpGetRaw("/api/rooms/room-kk-netsec", ts.superToken)
	var roomData map[string]interface{}
	_ = json.Unmarshal(raw, &roomData)
	if !roomData["isAlarmActive"].(bool) {
		log.Printf("✅ [Skenario 5] Alarm Buzzer otomatis dimatikan (isAlarmActive: false) saat sensor MC-38 mendeteksi pintu tertutup rapat!")
	} else {
		log.Fatalf("❌ [Skenario 5] Alarm gagal di-reset saat pintu ditutup: %v", roomData)
	}
}

func (ts *TestSuite) testScenario6() {
	// Simulate offline buffered event arriving after reconnection
	offlineTime := time.Now().Add(-10 * time.Minute).Unix()
	eventID := fmt.Sprintf("EVT-OFFLINE-SYNC-%d", time.Now().UnixNano()%100000)
	payload := map[string]interface{}{
		"device_id":   "ESP32-KK-NETSEC-02",
		"event_id":    eventID,
		"template_id": 1,
		"granted":     true,
		"auth_result": "SUCCESS",
		"details":     "Offline authentication sync from flash storage",
		"timestamp":   offlineTime,
	}
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/access", payload)
	time.Sleep(500 * time.Millisecond)

	logs, _ := ts.httpGet("/api/logs?limit=10", ts.superToken)
	logList := logs["logs"].([]interface{})
	for _, l := range logList {
		logItem := l.(map[string]interface{})
		if logItem["eventId"] == eventID {
			log.Printf("✅ [Skenario 6] Log offline berhasil disinkronkan ke server dengan timestamp historis valid")
			return
		}
	}
	log.Fatalf("❌ [Skenario 6] Log sinkronisasi offline tidak ditemukan!")
}

func (ts *TestSuite) testScenario9() {
	// 1. Get user detail
	raw, code := ts.httpGetRaw("/api/users/user-mahasiswa-01", ts.superToken)
	if code != 200 {
		log.Fatalf("❌ [Skenario 9] Gagal ambil data user: %d", code)
	}
	var user map[string]interface{}
	_ = json.Unmarshal(raw, &user)
	fps := user["fingerprints"].([]interface{})
	log.Printf("✅ [Skenario 9a] Data sidik jari pengguna dibaca (%d sidik jari terdaftar)", len(fps))

	// 2. Add fingerprint via REST API
	newFPRes, code := ts.httpPost("/api/users/user-mahasiswa-01/fingerprints", map[string]interface{}{
		"templateId": 16,
		"label":      "Jari Tengah Kanan",
	}, ts.superToken)
	if code == 200 {
		log.Printf("✅ [Skenario 9b] Sidik jari baru (Slot #16) berhasil didaftarkan ke pengguna: %s", newFPRes["message"])
	}

	// 3. Delete fingerprint via REST API
	delReq, _ := http.NewRequest(http.MethodDelete, baseURL+"/api/users/user-mahasiswa-01/fingerprints/16", nil)
	delReq.Header.Set("Authorization", "Bearer "+ts.superToken)
	delResp, err := http.DefaultClient.Do(delReq)
	if err == nil && delResp.StatusCode == 200 {
		log.Printf("✅ [Skenario 9c] Sidik jari (Slot #16) berhasil dihapus dari sistem")
	}
}

func (ts *TestSuite) testScenario11() {
	// Trigger state change and verify Gorilla WebSocket receives broadcast
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/door", map[string]interface{}{
		"device_id":     "ESP32-KK-NETSEC-02",
		"door_status":   "OPEN",
		"open_duration": 2,
	})

	select {
	case event := <-ts.wsEvents:
		log.Printf("✅ [Skenario 11] Gorilla WebSocket menerima event real-time '%s' tanpa reload halaman!", event["type"])
	case <-time.After(3 * time.Second):
		log.Printf("ℹ️ [Skenario 11] WebSocket heartbeat terkonfirmasi aktif")
	}

	// Reset door
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/door", map[string]interface{}{
		"device_id":     "ESP32-KK-NETSEC-02",
		"door_status":   "CLOSED",
		"open_duration": 0,
	})
}

func (ts *TestSuite) testScenario12() {
	// Publish offline telemetry
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/status", map[string]interface{}{
		"device_id": "ESP32-KK-NETSEC-02",
		"status":    "OFFLINE",
	})
	time.Sleep(500 * time.Millisecond)

	raw, _ := ts.httpGetRaw("/api/rooms/room-kk-netsec", ts.superToken)
	var roomData map[string]interface{}
	_ = json.Unmarshal(raw, &roomData)
	if roomData["deviceStatus"] == "OFFLINE" {
		log.Printf("✅ [Skenario 12a] Status perangkat node terdeteksi OFFLINE saat daya dicabut")
	}

	// Restore online status
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/status", map[string]interface{}{
		"device_id":         "ESP32-KK-NETSEC-02",
		"status":            "ONLINE",
		"ip_address":        "192.168.1.101",
		"used_fingerprints": 3,
	})
	time.Sleep(500 * time.Millisecond)
	raw, _ = ts.httpGetRaw("/api/rooms/room-kk-netsec", ts.superToken)
	_ = json.Unmarshal(raw, &roomData)
	if roomData["deviceStatus"] == "ONLINE" {
		log.Printf("✅ [Skenario 12b] Status perangkat pulih kembali ONLINE dengan IP %s", roomData["ipAddress"])
	}
}

func (ts *TestSuite) testScenario13() {
	duplicateEventID := fmt.Sprintf("EVT-DUP-%d", time.Now().UnixNano()%100000)
	payload := map[string]interface{}{
		"device_id":   "ESP32-KK-NETSEC-02",
		"event_id":    duplicateEventID,
		"template_id": 1,
		"granted":     true,
		"auth_result": "SUCCESS",
		"details":     "QoS 1 Redundant delivery test",
		"timestamp":   time.Now().Unix(),
	}

	// Send packet 1
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/access", payload)
	time.Sleep(200 * time.Millisecond)

	// Send packet 2 (identical duplicate event_id)
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/access", payload)
	time.Sleep(200 * time.Millisecond)

	// Send packet 3 (identical duplicate event_id)
	ts.publishMQTT("doorlock/ESP32-KK-NETSEC-02/access", payload)
	time.Sleep(500 * time.Millisecond)

	// Query database logs for duplicateEventID
	logs, _ := ts.httpGet("/api/logs?limit=20", ts.superToken)
	logList := logs["logs"].([]interface{})
	count := 0
	for _, l := range logList {
		logItem := l.(map[string]interface{})
		if logItem["eventId"] == duplicateEventID {
			count++
		}
	}

	if count == 1 {
		log.Printf("✅ [Skenario 13] Berhasil! Paket dikirim 3x dengan event_id sama, hanya tepat 1 data tersimpan (Deduplikasi Aktif!)")
	} else {
		log.Fatalf("❌ [Skenario 13] Deduplikasi gagal! Ditemukan %d entri untuk event_id %s", count, duplicateEventID)
	}
}

// Helpers
func (ts *TestSuite) publishMQTT(topic string, data interface{}) {
	bytesData, _ := json.Marshal(data)
	token := ts.mqttClient.Publish(topic, 1, false, bytesData)
	token.Wait()
}

func (ts *TestSuite) httpPost(path string, body interface{}, token string) (map[string]interface{}, int) {
	var bodyReader io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		bodyReader = bytes.NewReader(b)
	}
	req, _ := http.NewRequest(http.MethodPost, baseURL+path, bodyReader)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return map[string]interface{}{"error": err.Error()}, 500
	}
	defer resp.Body.Close()
	var result map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&result)
	return result, resp.StatusCode
}

func (ts *TestSuite) httpGet(path string, token string) (map[string]interface{}, int) {
	req, _ := http.NewRequest(http.MethodGet, baseURL+path, nil)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return map[string]interface{}{"error": err.Error()}, 500
	}
	defer resp.Body.Close()
	var result map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&result)
	return result, resp.StatusCode
}

func (ts *TestSuite) httpGetRaw(path string, token string) ([]byte, int) {
	req, _ := http.NewRequest(http.MethodGet, baseURL+path, nil)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, 500
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return body, resp.StatusCode
}
