---
target: all component inside Pengguna page
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/home/personalism/Documents/Smart Door Lock/frontend/src/components/users/UserManagementView.tsx"
target_fingerprint: "sha256:ed03be27a59f2252a021db9f0070e157438400384ea61e5bba30d8caf4a0b5a0"
target_path: /home/personalism/Documents/Smart Door Lock/frontend/src/components/users/UserManagementView.tsx
timestamp: 2026-09-30T04-07-15Z
slug: c-components-users-usermanagementview-tsx-427ac1e9
---
Method: dual-agent (A: a64ca18ad433a8ea0 · B: ae49cb04bab781cb4)

# Design Critique: Pengguna (Users) Module
**Target:** `frontend/src/components/users/` (15 Components)  
**System:** Smart Door Lock IoT System — Fakultas Teknik Universitas Tanjungpura (FT UNTAN)  
**Visual World:** Notion/Linear-Grade Sober Warm Editorial (`DESIGN.md`)

---

## Design Health Score

| # | Heuristic | Score (0–4) | Key Finding / Issue |
|---|---|:---:|---|
| 1 | **Visibility of System Status** | **3** | AS608 flash memory percentage bars and user status pills are clear; however, MQTT broker sync latency during hardware flash enrollment is not indicated with a live ping. |
| 2 | **Match System / Real World** | **4** | Excellent alignment with FT UNTAN academic structures (18-digit NIP, student NIM, PDDikti verification, Semester presets, and multi-lab clearance). |
| 3 | **User Control and Freedom** | **3** | Batch actions feature clean cancellation and selection controls; modals provide cancel actions and escape handlers, though destructive bulk deletion lacks a multi-step undo grace period. |
| 4 | **Consistency and Standards** | **3** | High adherence to Notion-grade editorial styling tokens (`#5645d4` purple, `#f6f5f4` surface, `#e5e3df` hairlines), but minor non-token color drift (`#eb5757` vs `#e03131`) exists in error states. |
| 5 | **Error Prevention** | **3** | Confirmation dialogs on deletion, regex validation on NIP/NIM, and date range validation on custom durations. Could warn when target room AS608 flash memory is nearly full (>90%). |
| 6 | **Recognition Rather than Recall** | **4** | Applicant details, requested room names, and preset semester durations are displayed directly inside dialogs and table rows. |
| 7 | **Flexibility and Efficiency** | **3** | Batch approve/reject bars and quick search filtering are fast, though global keyboard shortcuts (e.g., `/` for search focus) are not yet wired for power administrators. |
| 8 | **Aesthetic and Minimalist Design** | **4** | Disciplined visual hierarchy, restrained color accents, clean hairlines, and strict monospace styling on numbers and identifiers. |
| 9 | **Error Recovery** | **3** | Toast notifications and form error banners provide clear Indonesian recovery text and actionable error states. |
| 10 | **Help and Documentation** | **4** | Contextual helper texts, AS608 flash memory capacity guidelines, and duration preset explanations are well positioned. |
| **Total** | | **34/40** | **Grade A (85% Compliance — Production-Grade Craft)** |

---

## Design Specificity Verdict

### LLM Assessment
The User Management module demonstrates high domain grounding rather than falling into generic SaaS user table tropes:
- **Physical IoT Hardware Constraints:** Directly integrates AS608 optical fingerprint sensor limits (127 flash memory capacity per device, 3-slot template allocation per user, and solenoid relay actuation status).
- **Academic Domain Context:** Workflows map directly to university semester calendars (1 Semester, 1 Tahun, Skripsi/Tesis, Ujian), PDDikti NIP/NIM identification rules (18-digit NIP for lecturers/staff vs alphanumeric NIM for students), academic departments (Informatika, Teknik Elektro, etc.), and multi-room laboratory access matrices.
- **Identified Domain Opportunities:** Multi-node biometric synchronization is currently represented as a single aggregate flash capacity rather than allowing administrators to inspect and manage node-specific flash consumption across different physical laboratory rooms (e.g., Lab Komputer vs Ruang Server).

### Deterministic Scan & Token Compliance
- **CLI & Static AST Audit:** Scanned all 15 component units in `frontend/src/components/users/`.
- **Design Token Drift (Colors):** Found 34 occurrences of non-token error red (`#eb5757`, `#fadad9`, `#d94848`) in modals (`AddUserModal`, `EditUserModal`, `DeleteUserConfirmDialog`, `RejectRegistrationModal`, `BatchRejectModal`) where canonical tokens (`--color-semantic-error: #e03131`, `--color-semantic-error-soft: #fdf2f2`) should be used. Found `#eefbf1` instead of `#ebfbee` for success soft tint.
- **Micro-Typography Floor:** 28 occurrences of sub-11px font classes (`text-[9px]`, `text-[9.5px]`, `text-[10px]`, `text-[10.5px]`) in badge counts and metadata labels violating the strict 11px micro-typography floor.
- **Button Semantics:** 8 tab and filter `<button>` elements missing explicit `type="button"`.
- **WAI-ARIA Dialog Contract:** 7 custom modal containers missing explicit `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `aria-describedby` attributes.
- **False Positives:** Font loading advisory for Inter/JetBrains Mono is a false positive (locally bundled and configured via `@fontsource`).

### Visual Overlays & Browser Inspection
- Static AST and DOM telemetry confirmed strict adherence to Notion-grade geometry: 8px (`rounded-md`) for controls and inputs, 12px (`rounded-xl` / `rounded-lg`) for cards and dialogs, and 9999px (`rounded-full`) reserved strictly for status pill badges.

---

## Overall Impression
The Pengguna page is a mature, highly tailored cyber-physical access management workspace with disciplined Notion-grade aesthetics. Its primary strength lies in its academic and hardware integration. The biggest opportunities are **(1)** standardizing micro-typography to the 11px floor, **(2)** hardening WAI-ARIA modal dialog contracts, and **(3)** adding node-scoped AS608 flash memory visibility.

---

## What's Working
1. **Architectural Cohesion & Token Fidelity:** Flawless visual discipline matching the Notion editorial design system (`#5645d4` purple, `#f6f5f4` surface, `#e5e3df` hairlines, strict monospace styling on numbers/identifiers).
2. **Cyber-Physical IoT Integration:** Deep integration of physical hardware states (AS608 flash limits, ESP32 room nodes, 3-slot template allocations per user) directly into software workflows.
3. **Academic Workflow Optimization:** Rich batch processing capabilities with presets tailored to university operational cycles (Semester, Academic Year, Thesis Research, Examination).

---

## Priority Issues (P0–P3)

### [P1] Accessibility & Modal Dialog ARIA Contract
- **What:** Modals (`AddUserModal`, `EditUserModal`, `DeleteUserConfirmDialog`, `ApproveRegistrationModal`, `RejectRegistrationModal`, `BatchApprovalModal`, `BatchRejectModal`) lack explicit `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` attributes. Additionally, several tab/filter buttons lack explicit `type="button"`.
- **Why it matters:** Screen readers and keyboard assistive tech fail to recognize modal boundaries and focus traps; buttons without `type="button"` risk accidental form submissions.
- **Fix:** Add standard ARIA dialog attributes, focus management, and explicit `type="button"` to all interactive buttons.
- **Suggested command:** `/impeccable audit frontend/src/components/users/`

### [P1] Micro-Typography Floor Violations (< 11px)
- **What:** 28 occurrences of sub-11px font sizes (`text-[9px]`, `text-[9.5px]`, `text-[10px]`, `text-[10.5px]`) across status badges, telemetry cards, and modal duration pills.
- **Why it matters:** Sub-11px typography renders at ~7–8pt, causing severe legibility fatigue on standard displays and mobile viewports.
- **Fix:** Elevate all sub-11px text classes to a strict `text-[11px]` (or `text-xs` / 12px) minimum with proper tabular figure alignment.
- **Suggested command:** `/impeccable typeset frontend/src/components/users/`

### [P2] Design Token Normalization (Semantic Error & Success Hexes)
- **What:** Non-token hexes (`#eb5757`, `#fadad9`, `#eefbf1`) used in form validation and modal alerts instead of canonical design tokens (`#e03131`, `#fdf2f2`, `#ebfbee`).
- **Why it matters:** Creates subtle visual inconsistency and breaks theme token maintenance across the application.
- **Fix:** Replace hardcoded hex colors with canonical `DESIGN.md` CSS variables and token utility classes.
- **Suggested command:** `/impeccable polish frontend/src/components/users/`

### [P2] Multi-Node Biometric Flash Telemetry Discrepancy
- **What:** `UserBiometricsSection.tsx` visualizes AS608 flash memory as a single aggregate (out of 127 slots), whereas each ESP32 door node holds independent flash memory.
- **Why it matters:** If Ruang Server is at 120/127 capacity while Lab Komputer is at 20/127, administrators cannot identify localized hardware memory exhaustion.
- **Fix:** Add a room node filter chip to inspect flash slot utilization per physical laboratory room.
- **Suggested command:** `/impeccable harden frontend/src/components/users/UserBiometricsSection.tsx`

---

## Persona Red Flags

- **Alex (Power Superadmin — Dr. Ir. Fajar Purnama):**
  - *Red Flag:* Quick search inputs in `UserDirectorySection` and `UserRequestsSection` lack global hotkey focus (e.g. `/` or `Ctrl+K`), requiring unnecessary pointer navigation during high-volume batch approvals.
- **Jordan (First-Timer Lab Admin — Arya Putra Sastrawan):**
  - *Red Flag:* In `DeleteUserConfirmDialog`, the distinction between temporary access suspension (preserving the AS608 slot index) and permanent user deletion could be made even clearer in helper copy.
- **Sam (Regular Student — Muhammad Rizki Ramadhan):**
  - *Red Flag:* In `UserLifecycleSection`, expiration notices clearly show remaining days (`14 Hari Tersisa`), but there is no direct link to request an extension before expiry occurs.

---

## Minor Observations
- `RoomBadgeList.tsx` popover provides clean overflow handling (`+X Ruangan`) without distorting table rows.
- `DeleteUserConfirmDialog.tsx` correctly alerts admins only when the user actually holds enrolled biometric templates (`fpCount > 0`).
- Self-deletion is safely intercepted (`currentUser?.id === userToDelete.id`), preventing accidental superadmin lockout.

---

## Questions to Consider
- *What if the search bar supported instant keyboard focus (`/`) and quick action filters (`status:pending`, `room:server`) for power administrators?*
- *What if biometric enrollment in `EditUserModal` displayed live per-room hardware sync status (ESP32 ACK via MQTT QoS 1)?*
- *Could students nearing access expiration be allowed to submit a 1-click renewal request directly from their smartphone interface?*
