# PRODUCT: Smart Door Lock IoT & Security Dashboard

## Positioning
Smart Door Lock is an enterprise IoT access control and security monitoring command platform built for high-security academic laboratories (Ruang Server Utama & Lab Kelompok Keahlian Jaringan dan Keamanan) at Faculty of Engineering, Universitas Tanjungpura (FT UNTAN).

## Operating Context
- **Physical Environment**: Server racks and laboratory spaces with continuous operation, low/variable ambient lighting.
- **Hardware Layer**: ESP32 microcontrollers, AS608 optical biometrics, 12V Solenoid locks, MC-38 magnetic door reed sensors, Active 5V Buzzers, and SSD1306 OLED displays.
- **Network & Protocol**: Eclipse Mosquitto MQTT Broker over campus intranet with QoS 1 message delivery and unique event ID deduplication.
- **Platform**: Web (`web`), responsive across desktop workstation dashboards, tablets, and mobile smartphones.

## Target Audience & Personas
1. **Superadmin (Head of Lab / IT Director)**: Dr. Ir. Fajar Purnama, M.T. Needs comprehensive access control, user enrollment via AS608 hardware commands, device heartbeat telemetry, broker packet inspection, and user management.
2. **Room Admin (Lab Technician / Asisten)**: Arya Putra Sastrawan, S.Kom. Needs real-time room telemetry, emergency remote solenoid override with 5s auto-relock, buzzer alarm silencing, and tamper/timeout alert management.
3. **Regular User (Lecturer / Student Researcher)**: Muhammad Rizki Ramadhan, Sarah Amanda Putri. Needs immediate feedback on physical fingerprint authorization status, personal audit logs, and clear authorization notices without administrative clutter.

## Core Capabilities
- Real-time room door state monitoring (MC-38 sensor: OPEN / CLOSED).
- Solenoid lock state control (LOCKED / UNLOCKED) with automatic timeout safety.
- Door Open Timeout Alarm (active buzzer triggered when door exceeds timeout limit).
- Biometric AS608 Fingerprint enrollment workflow with 2-step finger verification, multi-fingerprint support (Superadmin can add up to 3 different fingerprints per user), and offline template ID assignment (#1 - #120).
- Telemetry stream and live MQTT packet inspector (QoS 1, deduplication with unique `event_id`).
- Immutable, append-only security audit log with role-aware privacy boundaries.
- Instant role simulation switching for multi-persona verification.

## Product Principles
- Dark-mode primary command center interface optimized for server room lighting environments.
- Mobile-first responsive layout with native-like bottom floating navigation and safe-area insets.
- Crisp typography using Inter and JetBrains Mono with balanced tabular figures.
- Micro-interactions that convey physical hardware state transitions (solenoid engagement, sensor heartbeat, alarm beacons).
- Accessible contrast ratios (WCAG AA standard) and keyboard navigable interactive elements.

## Evidence on Hand
- PRD.md: Product Requirements Document for Smart Door Lock IoT FT UNTAN.
- React 19 + TypeScript + Tailwind CSS v4 + Framer Motion production codebase.

