# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Superadmin (Head of Lab / IT Director)**: Dr. Ir. Fajar Purnama, M.T. Manages system-wide access permissions, user roles, DY50 hardware biometric enrollments, device heartbeat telemetry, MQTT broker packet streams, and administrative audit logging.
2. **Room Admin (Lab Technician / Asisten)**: Arya Putra Sastrawan, S.Kom. Monitors room-level telemetry, performs emergency solenoid unlocks with 5-second auto-relock safety, silences active buzzer alarms, and manages door open timeout thresholds.
3. **Regular User (Lecturer / Student Researcher)**: Muhammad Rizki Ramadhan, Sarah Amanda Putri. Accesses authorized laboratory spaces using enrolled DY50 fingerprints, views personal access history, and checks current room occupancy status.

## Product Purpose

Smart Door Lock is an enterprise IoT access control and laboratory security command platform engineered for Faculty of Engineering, Universitas Tanjungpura (FT UNTAN). It safeguards critical infrastructure (Ruang KK Jaringan & Keamanan) by unifying physical biometric access, edge sensor telemetry, and centralized web management to eliminate unauthorized entry, track all physical ingress/egress, and sound active alarms during door open timeout violations.

## Positioning

A dual-layer hardware-integrated laboratory access platform bridging edge ESP32 microcontrollers and DY50 optical biometrics with a desktop-and-mobile web command dashboard over campus intranet MQTT broker infrastructure with QoS 1 packet deduplication.

## Operating Context

- **Physical Environment**: 24/7 operational server rooms and engineering laboratories with variable lighting conditions.
- **Hardware Layer**: ESP32-WROOM-32 microcontrollers, DY50 optical fingerprint sensors (57600 baud, 127 template capacity, <0.2s match speed), 12V Solenoid door locks with 5V relay actuators, MC-38 magnetic door reed sensors, Active 5V buzzers, and SSD1306 0.96" OLED displays.
- **Network & Messaging**: Campus intranet MQTT broker (Eclipse Mosquitto) using QoS 1 with client-side deduplication via UUID `event_id`.
- **Operating Surfaces**: Responsive web application utilized on desktop workstation monitors, wall-mounted tablets, and mobile smartphones.

## Capabilities and Constraints

- **Real-Time Door & Lock Telemetry**: Instant display of MC-38 reed sensor state (OPEN / CLOSED) and 12V solenoid relay state (LOCKED / UNLOCKED).
- **Automated Relock Safety**: Unlocked solenoid automatically re-engages after 5 seconds to prevent accidental prolonged access.
- **Door Open Timeout Alarm**: Active 5V buzzer on hardware node sounds continuously when MC-38 detects door open beyond configured threshold (`maxOpenThresholdSeconds`); controllable via remote buzzer silence action by privileged admins.
- **Multi-Fingerprint Enrollment Workflow**: DY50 2-step fingerprint enrollment with up to 3 slots per user (e.g. Jempol Kanan, Telunjuk Kanan, Jempol Kiri) stored directly in DY50 onboard flash memory (#1-#127).
- **Live MQTT Packet Inspector**: Real-time message streaming with topic filtering, QoS 1 status, and raw JSON payload inspection.
- **Audit Logging**: Append-only security audit trail recording every access attempt, tamper event, and remote actuator command with role-based access filtering.

## Brand Commitments

- **Visual Design System**: Notion-grade sober editorial craft defined in `DESIGN.md`.
- **Palette**: Primary Notion purple (`#5645d4`), neutral canvas (`#ffffff`), surface (`#f6f5f4`), subtle hairlines (`#e6e6e6`), and pastel feature card tints (mint `#eefbf1`, lavender `#e6e0f5`, plum `#f7f0fd`, peach `#fdf3eb`, rose `#fdf2f2`).
- **Geometry**: Strict 8px (`rounded-md`) rectangular geometry for buttons, inputs, tooltips, and interactive controls; 12px (`rounded-lg` / `rounded-xl`) for cards and modals; 9999px (`rounded-full`) strictly for status badges and pills.
- **Hyperlink Rule**: `#0075de` is exclusively reserved for underlined inline hypertext links (`button-link`) and never leaked to buttons, badges, or icons.

## Evidence on Hand

- `PRD.md`: Formal Product Requirements Document for Smart Door Lock IoT FT UNTAN.
- `DESIGN.md`: Comprehensive Notion design tokens and component specifications.
- Production React 19 + TypeScript + Vite + Tailwind CSS v4 codebase with 0 build errors.

## Product Principles

1. **Hardware State Integrity**: Actuator commands and sensor telemetry reflect true physical state with zero false confirmations or ambiguous loading states.
2. **Safety by Default**: All remote unlock events enforce a 5-second auto-relock; active alarms require explicit privileged clearance.
3. **Editorial Calm**: High-density engineering information presented with Notion-style typography, clean hairlines, and pastel semantic markers rather than flashy glowing dials.
4. **Resilient Offline-First Messaging**: Handlers gracefully accommodate network drops and broker reconnections without dropping audit events.

## Accessibility & Inclusion

- WCAG AA contrast compliance across all text, inputs, and interactive surfaces.
- Minimum 44x44px touch targets on mobile and touchscreens.
- Accessible ARIA status regions (`aria-live="polite"`) for real-time sensor updates and alarm notifications.
- Complete motion reduction honoring `prefers-reduced-motion`.
