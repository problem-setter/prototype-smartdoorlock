---
name: Smart Door Lock IoT Command System
description: Industrial IoT biometric access control and monitoring interface for FT UNTAN
colors:
  bg-base: "#06090f"
  bg-surface: "#0c111d"
  bg-surface-elevated: "#111827"
  border-subtle: "rgba(255, 255, 255, 0.08)"
  border-hover: "rgba(56, 189, 248, 0.3)"
  primary: "#0ea5e9"
  primary-hover: "#38bdf8"
  success: "#10b981"
  success-bg: "rgba(16, 185, 129, 0.15)"
  warning: "#f59e0b"
  warning-bg: "rgba(245, 158, 11, 0.15)"
  danger: "#f43f5e"
  danger-bg: "rgba(244, 63, 94, 0.15)"
  purple: "#a855f7"
  purple-bg: "rgba(168, 85, 247, 0.15)"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    lineHeight: 1.5
    letterSpacing: "-0.012em"
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    letterSpacing: "0em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  card:
    backgroundColor: "{colors.bg-surface}"
    borderColor: "{colors.border-subtle}"
    rounded: "{rounded.lg}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
  button-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
---

# Visual Design System

## World & Atmosphere
Modern industrial IoT security command interface. High-contrast dark canvas (`#06090f`) engineered for lab and server room viewing conditions. Precise 1px micro-borders (`rgba(255, 255, 255, 0.08)`) and directional signal beacons provide clear status hierarchy without decorative bloat.

## Palette & Surface Roles
- **Base Canvas (`#06090f`)**: Deep obsidian backdrop with subtle radial ambient glow.
- **Surface Level 1 (`#0c111d`)**: Elevated card panels with 1px border.
- **Surface Level 2 (`#111827`)**: Interactive components and hover states with sky highlight (`rgba(56, 189, 248, 0.3)`).
- **Signal Colors**:
  - Sky (`#0ea5e9`): Telemetry streams, MQTT telemetry, primary controls.
  - Emerald (`#10b981`): Authenticated events, online devices, secure locked solenoid state.
  - Amber (`#f59e0b`): Open door sensor events, warnings, pending state.
  - Rose (`#f43f5e`): Offline devices, buzzer alarm active, failed fingerprint auth.
  - Purple (`#a855f7`): AS608 biometric enrollment and superadmin authority.

## Typography
- **Headings & Body**: Inter (`--font-sans`), weight 400-800, tracking `-0.012em` to `-0.02em`.
- **Telemetry & Logs**: JetBrains Mono (`--font-mono`), weight 400-600, tabular figures for timecodes, packet payloads, template numbers, and event IDs.

## Layout & Spatial System
- Mobile-first responsive fluid grid (1 to 3 columns).
- Primary mobile navigation resides in the bottom thumb zone with safe-area bottom inset.
- Touch target minimum: 44x44px for primary interactive triggers.

## Components
- **Buttons**: Variant styles (`default`, `secondary`, `destructive`, `outline`, `success`, `purple`) with loading spinners and active tactile scaling (`active:scale-[0.98]`).
- **Badges**: Monospace status tags with optional pulsing beacons.
- **Modals & Dialogs**: Accessible focus-trapped dialogs with backdrop blur (`backdrop-blur-sm bg-black/75`) and escape key dismissal.
- **Telemetry Cards**: Mouse-tracking spotlight borders with embedded hardware telemetry tables.

## Motion & Animation
- Exponential ease-out curves (`[0.16, 1, 0.3, 1]`) across entrance transitions.
- Reduced motion: strict media query fallback disabling heavy motion while maintaining state changes.

