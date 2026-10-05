# Product Requirements Document (PRD)

## Sistem Smart Door Lock Berbasis IoT dan Website

### 1. Gambaran Produk

Smart Door Lock merupakan sistem keamanan ruangan berbasis Internet of Things (IoT) yang digunakan untuk mengontrol dan memantau akses masuk ke Ruang Kelompok Keahlian Jaringan dan Keamanan Program Studi Informatika Universitas Tanjungpura.

Sistem terdiri dari perangkat smart door lock yang dipasang pada setiap pintu dan sistem backend berbasis server yang terhubung dengan dashboard website. Perangkat menggunakan ESP32 sebagai pengendali utama, sensor fingerprint DY50 sebagai mekanisme autentikasi pengguna, solenoid door lock sebagai aktuator pengunci, serta sensor status pintu dan buzzer sebagai sistem peringatan.

Sistem dirancang agar akses fisik terhadap ruangan hanya dapat dilakukan oleh pengguna yang memiliki hak akses. Selain itu, administrator dapat memantau status perangkat, melihat riwayat akses, mengelola pengguna, serta melakukan pengendalian pintu dari jarak jauh melalui dashboard website.

Implementasi awal sistem mencakup dua ruangan, dengan satu unit perangkat Smart Door Lock pada setiap pintu. Arsitektur sistem menggunakan identitas perangkat (`device_id`) agar dapat dikembangkan untuk mendukung lebih banyak ruangan di masa mendatang.

---

### 2. Tujuan Produk

Produk ini bertujuan untuk:

* Meningkatkan keamanan akses Ruang Kelompok Keahlian Jaringan dan Keamanan.
* Menggantikan atau melengkapi mekanisme akses berbasis kunci fisik dengan autentikasi biometrik fingerprint.
* Membatasi akses ruangan berdasarkan pengguna yang telah terdaftar.
* Menyediakan pencatatan aktivitas akses secara otomatis.
* Memungkinkan pemantauan status pintu dan perangkat secara real-time.
* Memberikan peringatan apabila pintu terbuka melebihi batas waktu yang ditentukan.
* Menyediakan pengelolaan pengguna dan hak akses melalui dashboard website.
* Memungkinkan pengendalian kunci pintu dari jarak jauh oleh administrator yang berwenang.

---

### 3. Pengguna dan Hak Akses

Sistem menggunakan tiga tingkat pengguna.

#### 3.1 User

User adalah pengguna yang memiliki hak akses fisik untuk membuka pintu menggunakan fingerprint.

Hak akses User meliputi:

* Membuka pintu menggunakan fingerprint yang telah terdaftar.
* Melihat informasi hasil autentikasi melalui layar OLED.
* Tidak dapat mengubah konfigurasi sistem.
* Tidak dapat mengelola pengguna lain.
* Tidak memiliki akses untuk membuka pintu melalui dashboard.

Hak akses fisik diberikan kepada pihak yang telah ditetapkan oleh pengelola sistem, seperti dosen, tim pengembang, atau pihak lain yang memperoleh persetujuan administrator.

#### 3.2 Operator atau Monitoring User

Operator merupakan pengguna yang memiliki akses terbatas terhadap dashboard.

Hak akses Operator meliputi:

* Melihat status pintu secara real-time.
* Melihat status perangkat.
* Melihat riwayat akses.
* Melihat notifikasi alarm.
* Tidak dapat menambah atau menghapus pengguna.
* Tidak dapat mengubah hak akses.
* Tidak dapat melakukan remote unlock.

#### 3.3 Administrator

Administrator memiliki hak akses tertinggi terhadap sistem.

Hak akses Administrator meliputi:

* Menambahkan pengguna.
* Mengubah informasi pengguna.
* Menghapus atau menonaktifkan pengguna.
* Mengatur hak akses pengguna.
* Memulai proses pendaftaran fingerprint.
* Mengelola perangkat dan ruangan.
* Melihat seluruh riwayat akses.
* Melihat status perangkat secara real-time.
* Melakukan remote unlock.
* Mengatur konfigurasi sistem yang diperlukan.

Riwayat akses yang telah tercatat tidak dapat diubah atau dihapus melalui dashboard.

---

### 4. Fitur Utama

#### 4.1 Autentikasi Fingerprint

Sistem menggunakan sensor fingerprint DY50 sebagai metode utama autentikasi akses.

Alur autentikasi:

1. User menempelkan jari pada sensor fingerprint.
2. ESP32 melakukan komunikasi dengan sensor DY50 untuk melakukan pencocokan fingerprint.
3. Apabila fingerprint valid dan pengguna memiliki hak akses, sistem membuka kunci pintu.
4. Apabila fingerprint tidak valid atau tidak terdaftar, pintu tetap terkunci.
5. Hasil akses dicatat sebagai riwayat akses.
6. Informasi hasil autentikasi ditampilkan pada layar OLED.

Sistem harus tetap dapat melakukan autentikasi fingerprint ketika koneksi jaringan sedang tidak tersedia.

---

#### 4.2 Pengendalian Solenoid Door Lock

Solenoid Door Lock 12V digunakan sebagai aktuator pengunci pintu.

ESP32 mengontrol aktuator melalui modul relay.

Status sistem harus membedakan secara jelas antara:

* Status pintu: `OPEN` atau `CLOSED`.
* Status kunci: `LOCKED` atau `UNLOCKED`.
* Status relay: `ON` atau `OFF`.

Sistem tidak boleh menganggap status `OPEN` sama dengan `UNLOCKED`.

Setelah autentikasi berhasil atau perintah remote unlock diterima, pintu akan berada dalam kondisi `UNLOCKED` selama waktu yang telah ditentukan, kemudian sistem mengembalikan mekanisme pengunci sesuai konfigurasi sistem.

---

#### 4.3 Monitoring Status Pintu

Status fisik pintu dipantau menggunakan Magnetic Door Switch MC-38.

Sistem harus dapat mendeteksi:

* Pintu terbuka.
* Pintu tertutup.
* Perubahan status pintu.

Setiap perubahan status penting dikirimkan ke server dan dapat ditampilkan secara real-time pada dashboard.

Sensor ultrasonik HC-SR04, apabila tetap digunakan dalam implementasi, berfungsi sebagai sensor pendukung dan tidak menjadi sumber utama penentuan status pintu.

---

#### 4.4 Door Open Timeout Alarm

Sistem memiliki fitur peringatan apabila pintu berada dalam kondisi terbuka secara fisik melebihi batas waktu yang telah ditentukan.

Alur alarm:

1. Sensor mendeteksi status pintu `OPEN`.
2. Sistem mulai menghitung durasi pintu terbuka.
3. Apabila durasi melewati batas yang ditentukan, ESP32 mengaktifkan buzzer.
4. Sistem mencatat kejadian alarm.
5. ESP32 mengirimkan notifikasi alarm ke server.
6. Dashboard menampilkan peringatan secara real-time.
7. Alarm berhenti atau berubah status sesuai kondisi pintu dan konfigurasi sistem.

Alarm didasarkan pada status fisik pintu `OPEN`, bukan status `UNLOCKED`.

---

#### 4.5 Riwayat Akses

Sistem mencatat aktivitas keamanan yang terjadi pada setiap perangkat.

Data minimal yang dicatat meliputi:

* Event ID.
* Device ID.
* Identitas pengguna apabila tersedia.
* ID template fingerprint.
* Jenis aktivitas.
* Hasil autentikasi.
* Waktu kejadian.
* Status pintu apabila relevan.

Aktivitas yang dicatat meliputi:

* Autentikasi berhasil.
* Autentikasi gagal.
* Pintu dibuka.
* Pintu ditutup.
* Alarm aktif.
* Perintah remote unlock.
* Status perangkat online atau offline.

Riwayat akses bersifat append-only dan tidak dapat diubah atau dihapus oleh pengguna dashboard.

---

#### 4.6 Dashboard Website

Dashboard digunakan untuk pemantauan dan pengelolaan sistem.

Dashboard menyediakan fitur:

* Login dan autentikasi pengguna.
* Pemantauan status setiap pintu secara real-time.
* Pemantauan status perangkat.
* Riwayat akses.
* Notifikasi alarm.
* Manajemen pengguna.
* Manajemen hak akses.
* Pendaftaran fingerprint.
* Pengelolaan perangkat dan ruangan.
* Remote unlock untuk Administrator.

Dashboard dibangun menggunakan React dan TypeScript.

REST API digunakan untuk komunikasi permintaan data, sedangkan WebSocket digunakan untuk pembaruan status dan notifikasi secara real-time.

---

### 5. Pendaftaran Fingerprint

Pendaftaran fingerprint dilakukan melalui kombinasi dashboard dan perangkat fisik. Superadmin memiliki kewenangan untuk mendaftarkan **maksimal hingga 3 fingerprint yang berbeda** per pengguna (misal: ibu jari kanan, telunjuk kanan, dan ibu jari kiri).

Alurnya adalah:

1. Administrator/Superadmin membuat atau memilih data pengguna pada dashboard.
2. Superadmin memulai proses enrollment untuk slot fingerprint pengguna (maksimal 3 slot sidik jari per user).
3. Dashboard mengirim perintah enrollment ke perangkat melalui backend dan MQTT.
4. Perangkat memasuki mode pendaftaran fingerprint.
5. User melakukan pemindaian jari pada sensor DY50 sesuai proses enrollment.
6. Sensor menyimpan template fingerprint.
7. ESP32 mengirim informasi hasil pendaftaran dan template ID ke server.
8. Backend menghubungkan template ID dengan data pengguna.
9. Administrator menerima status keberhasilan atau kegagalan enrollment.

Data citra sidik jari mentah tidak dikirimkan melalui jaringan dan tidak disimpan pada database server.

---

### 6. Arsitektur Sistem

Setiap pintu memiliki satu unit perangkat Smart Door Lock yang memiliki `device_id` unik.

Arsitektur komunikasi sistem adalah:

**Smart Door Lock → Wi-Fi Kampus → MQTT Broker → Backend → PostgreSQL → Dashboard**

Untuk komunikasi arah sebaliknya:

**Dashboard → REST API → Backend → MQTT Broker → Smart Door Lock**

Komponen utama sistem terdiri dari:

* ESP32-WROOM-32.
* Sensor fingerprint DY50.
* Magnetic Door Switch MC-38.
* Solenoid Door Lock 12V.
* Relay 5V.
* Active Buzzer.
* Display OLED SSD1306.
* Buck Converter MP1584.
* Dioda flyback 1N4007.
* Power Adapter 12V.

Komunikasi perangkat dengan server menggunakan MQTT melalui Eclipse Mosquitto.

Backend menggunakan bahasa Go.

Database menggunakan PostgreSQL.

Dashboard menggunakan React dan TypeScript.

---

### 7. Komunikasi dan Penyimpanan Data

ESP32 mengirimkan data berdasarkan kejadian.

Contoh topik MQTT:

```text
doorlock/{device_id}/access
doorlock/{device_id}/door
doorlock/{device_id}/alarm
doorlock/{device_id}/status

doorlock/{device_id}/cmd/unlock
doorlock/{device_id}/cmd/enroll
```

Pengiriman data menggunakan MQTT Quality of Service (QoS) 1.

Karena QoS 1 memungkinkan kemungkinan pesan dikirim lebih dari satu kali, setiap event harus memiliki `event_id` yang unik.

Backend harus memeriksa `event_id` sebelum menyimpan data untuk mencegah pencatatan duplikat.

Apabila jaringan terputus, perangkat harus tetap menjalankan fungsi utama secara lokal.

Data kejadian yang belum berhasil dikirim disimpan sementara pada memori internal perangkat dan dikirim kembali setelah koneksi pulih.

---

### 8. Infrastruktur dan Batas Akses

Server, MQTT Broker, backend, database, dan web server ditempatkan pada infrastruktur server internal.

Implementasi sistem awal menggunakan jaringan internal kampus.

Dashboard dapat diakses oleh pengguna yang memiliki hak akses melalui jaringan yang diizinkan oleh pengelola sistem.

Akses jarak jauh dalam konteks sistem ini berarti pengendalian perangkat tanpa harus berada di depan pintu secara langsung, selama pengguna memiliki akses ke jaringan sistem.

Komunikasi antar perangkat dan broker dapat menggunakan TLS untuk melindungi pertukaran data. Tidak digunakannya domain publik tidak berarti komunikasi internal tidak dapat menggunakan mekanisme keamanan TLS.

---

### 9. Kebutuhan Non-Fungsional

Sistem harus memenuhi kebutuhan berikut:

* Waktu respons dari fingerprint valid hingga mekanisme membuka kunci maksimal 3 detik.
* Sistem tetap dapat melakukan autentikasi lokal ketika jaringan terputus.
* Perubahan status pintu dapat dikirimkan secara real-time ketika jaringan tersedia.
* Riwayat akses harus memiliki identitas event yang unik.
* Data riwayat akses tidak dapat dimodifikasi melalui dashboard.
* Sistem dapat menangani minimal dua perangkat Smart Door Lock secara bersamaan.
* Layanan backend harus dapat berjalan secara otomatis setelah server menyala.
* Layanan penting dapat dimulai ulang apabila proses mengalami kegagalan.
* Akses dashboard dibatasi berdasarkan role pengguna.
* Data biometrik mentah tidak dikirimkan melalui jaringan.

---

### 10. Kriteria Keberhasilan Produk

Produk dianggap memenuhi kebutuhan apabila:

1. Pengguna yang fingerprint-nya terdaftar dan memiliki hak akses dapat membuka pintu.
2. Pengguna yang tidak terdaftar atau tidak memiliki hak akses tidak dapat membuka pintu.
3. Setiap percobaan akses tercatat pada sistem.
4. Status pintu dapat dipantau melalui dashboard.
5. Alarm aktif ketika pintu terbuka melebihi batas waktu.
6. Administrator dapat melakukan enrollment pengguna melalui dashboard dan perangkat.
7. Administrator dapat melakukan remote unlock.
8. Sistem tetap dapat melakukan autentikasi dasar ketika jaringan terputus.
9. Data yang tertunda dapat dikirim kembali setelah koneksi pulih.
10. Riwayat akses tidak dapat dimodifikasi oleh pengguna dashboard.
11. Sistem dapat digunakan untuk minimal dua pintu dengan perangkat dan `device_id` yang berbeda.
