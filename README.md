# Smart Door Lock IoT & Dashboard Website (Untan)

Prototype website modern berbasis **React, TypeScript, Tailwind CSS, Lucide Icons, dan Framer Motion** yang dirancang berdasarkan spesifikasi lengkap dokumen **PRD.md** (*Product Requirements Document*) untuk sistem pengamanan pintu berbasis IoT di **Ruang Kelompok Keahlian (KK) Jaringan & Keamanan Prodi Informatika Universitas Tanjungpura**.

---

## 🌟 Fitur Utama & Kepatuhan PRD

### 1. Sistem Autentikasi & Multi-Role Access Control
- **Halaman Login Modern**: Autentikasi kredensial pengguna (NIP/NIM & Password) terproteksi dengan pemetaan role (Superadmin, Admin Ruangan, User Biasa).
- **Role User (Biasa / Dosen / Peneliti)**:
  - Hak akses minim dan terproteksi.
  - Hanya dapat melihat status ringkas ruangan yang dia miliki hak aksesnya.
  - **Log Riwayat Akses Pribadi**: Hanya melihat log autentikasi milik dirinya sendiri.
  - Tombol *Remote Unlock* dinonaktifkan demi alasan keselamatan fisik (sesuai PRD 3.1).
- **Role Admin (Operator / Koordinator Lab)**:
  - Monitoring status pintu fisik (MC-38), relay aktuator, dan solenoid 12V **hanya pada ruangan tertentu yang diotorisasikan kepadanya** (tidak memiliki akses ke seluruh ruangan secara otomatis).
  - **Audit Log Terbatas**: Riwayat akses seluruh pengguna khusus pada ruangan yang dikelola.
  - **Remote Unlock**: Fitur buka kunci darurat jarak jauh (relay 5 detik) pada ruangan yang memiliki hak akses.
  - Penanganan alarm jika pintu terbuka melebihi batas waktu (*Door Open Timeout Alarm*) pada ruangan yang dikelola.
- **Role Superadmin (Kepala Lab / Admin Utama)**:
  - Akses kontrol penuh atas seluruh ruangan dan perangkat ESP32 secara global.
  - **Manajemen Pengguna & Otorisasi Ruangan**: Tambah/edit profil user, atur hak akses spesifik per ruangan untuk user maupun admin, nonaktifkan akun, dan hapus akun.
  - **Alur Pendaftaran Sidik Jari (Enrollment Workflow)**: Stepper pendaftaran sensor DY50 via protokol perintah MQTT.

### 2. Alur Pengguna (*User Flow*)
Semua role setelah login akan masuk ke **Halaman Dashboard Ruangan** untuk **Ruang KK Jaringan & Keamanan (`ESP32-KK-NETSEC-02`)** yang terintegrasi langsung dengan modul perangkat keras IoT Smart Door Lock (ESP32, biometrik DY50, solenoid 12V, sensor MC-38, dan buzzer alarm). Antarmuka disesuaikan secara dinamis berdasarkan role masing-masing pengguna.

### 3. Protokol Komunikasi MQTT QoS 1
Lalu lintas paket JSON event-driven diproses secara real-time melalui topik MQTT standar PRD:
- `doorlock/{device_id}/access`
- `doorlock/{device_id}/door`
- `doorlock/{device_id}/alarm`
- `doorlock/{device_id}/cmd/unlock`
- `doorlock/{device_id}/cmd/enroll`

---

## 🚀 Cara Menjalankan Prototype

Pastikan Anda telah menginstal [Bun](https://bun.sh/).

### 1. Masuk ke direktori frontend
```bash
cd frontend
```

### 2. Instal dependensi (jika baru pertama kali)
```bash
bun install
```

### 3. Jalankan Development Server
```bash
bun dev
```

Buka browser di alamat:
- Lokal: **`http://localhost:5173`**
- Jaringan LAN / Perangkat lain: **`http://<IP_KOMPUTER>:5173`** (server berjalan di host `0.0.0.0`)

### 4. Build untuk Production
```bash
bun run build
```

---

## 📂 Struktur Direktori Proyek

```text
├── PRD.md                              # Dokumen Spesifikasi Kebutuhan Produk
├── README.md                           # Dokumentasi & Panduan Proyek
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   └── LoginPage.tsx       # Halaman Login & Quick Role Switcher
    │   │   ├── common/
    │   │   │   └── Header.tsx          # Top Navbar responsif (Desktop & Mobile)
    │   │   ├── hardware/
    │   │   │   ├── HardwarePanel.tsx   # Panel status ESP32, DY50, MC-38, Solenoid
    │   │   │   └── FingerprintEnrollModal.tsx # Multi-step modal pendaftaran sidik jari
    │   │   ├── logs/
    │   │   │   └── LogViewer.tsx       # Tabel riwayat log akses append-only dengan filter
    │   │   ├── rooms/
    │   │   │   ├── RoomCard.tsx        # Card status ruangan
    │   │   │   ├── RoomList.tsx        # Halaman awal daftar ruangan akses
    │   │   │   └── RoomDetailView.tsx  # Dashboard detail ruangan kontekstual
    │   │   └── users/
    │   │       └── UserManagementView.tsx # Manajemen akun & hak akses (Superadmin)
    │   ├── context/
    │   │   └── AppContext.tsx          # State management global & logika IoT
    │   ├── mock/
    │   │   └── initialData.ts          # Data simulasi ruangan, user, dan log awal
    │   ├── types/
    │   │   └── index.ts                # TypeScript Interfaces & Types
    │   ├── App.tsx                     # Layout utama
    │   ├── index.css                   # Custom theme & cyber-aesthetic styling
    │   └── main.tsx                    # Entry point React
    ├── package.json
    └── vite.config.ts
```

