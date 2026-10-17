# AURA Assist — Repository Context

> Last verified: 2026-10-17
> Scope: compact operational context for future agents. This file records the current implementation and stable decisions; it does not replace the protocol specification or the chronological `flow.md` logs.

## 1. Canonical identity

- **User-facing app:** AURA Assist
- **Ecosystem descriptor:** Secure tri-wearable assistive platform
- **Technical project name:** AIoT Assistive Suite
- **Voice assistant:** AURA Guide
- **Backend service:** AURA Bridge
- **Repository slug:** `project-1-specs`
- **Android application ID:** `com.aiot.assistivesuite` (keep stable unless a deliberate migration is planned)
- **Design direction:** Accessible dark distressed Ray Gun / grunge safety interface with aged paper text, brick-red alerts, caution amber, photocopy grain, and hard ink shadows.

Use **Smart Glasses**, **Smart Cane**, and **Smart Band** in user-facing copy. The internal abbreviation `specs` and device IDs such as `specs_01` are implementation details only.

## 2. Product purpose and users

AURA Assist is a simulation-first assistive safety app for visually impaired and elderly users and the people who support them. It combines:

- head-worn obstacle and vision awareness;
- cane proximity and impact sensing;
- band vitals, motion, and SOS sensing;
- cross-device fall verification;
- caregiver-facing alerts;
- voice, haptic, and spoken feedback.

The client offers two local demo roles:

- **Wearer:** simplified personal safety view with path awareness, spoken assistance, alerts, and large actions.
- **Caregiver:** monitoring view with wearer status, vitals, alert history, and device freshness.

Role selection is a local UI preference, not authentication or authorization. The backend currently maintains one global telemetry snapshot and one global fall state; multi-wearer isolation is not implemented.

## 3. Actual architecture

The active client is a React DOM/Vite app packaged for Android with Capacitor. It is not a React Native CLI app.

```text
Wearable firmware or simulator
  -> AES-256-GCM envelope
  -> MQTT broker
  -> Node/TypeScript AURA Bridge
  -> decryption, replay checks, fall fusion, spatial mapping, AI
  -> REST + WebSocket
  -> React/Vite dashboard + Capacitor Android APK
```

### Active entry points

- Client HTML: `mobile-app/index.html`
- Client bootstrap: `mobile-app/src/main.tsx`
- Client shell and transport state: `mobile-app/src/App.tsx`
- Main dashboard: `mobile-app/src/components/DashboardScreen.tsx`
- Backend entry point: `server/src/index.ts`
- Android wrapper: `mobile-app/android/app/src/main/java/com/aiot/assistivesuite/MainActivity.java`
- Native emergency bridge: `mobile-app/android/app/src/main/java/com/aiot/assistivesuite/EmergencyActionsPlugin.java`

### Stack

- Client: React 19, TypeScript, Vite, React DOM, Recharts, Lucide, Capacitor 7.
- Backend: Node.js, TypeScript, Express, `ws`, MQTT, `@google/genai`.
- Android: Gradle wrapper 8.11.1, JDK 21 expected, SDK 35.
- Ports: backend `4000`; dashboard `3000`.

## 4. Source-of-truth precedence

1. Current executable source and manifests determine actual behavior.
2. `server/src/mqtt/topicCatalog.ts`, telemetry types, crypto code, fusion code, and simulator define current runtime contracts.
3. `docs/MQTT_SPECIFICATION.md` defines intended protocol behavior, subject to reconciliation with code.
4. `README.md` defines the intended setup flow.
5. `docs/PROJECT_SUMMARY.md` is a summary, not a runtime authority.
6. `flow.md` and `docs/flow.md` are historical logs. Do not use them to infer current component imports.

When source and documentation disagree, record the discrepancy here and preserve the executable behavior until it is intentionally changed.

## 5. Runtime commands

From the repository root:

```powershell
npm run install:all
npm run server
npm run dashboard
```

Equivalent working directories:

```powershell
# backend
Set-Location server
npm run dev

# dashboard
Set-Location mobile-app
npm run dev
```

Build checks:

```powershell
Set-Location server
npm run build

Set-Location ..\mobile-app
npm run build
```

Android packaging requires the built web assets to be synchronized:

```powershell
Set-Location mobile-app
npm run build
npm run cap:sync
Set-Location android
./gradlew.bat test
./gradlew.bat assembleDebug
```

Use JDK 21 explicitly when it is not already on `PATH`. Do not record a check as passed unless it was actually run.

## 6. Data and protocol invariants

Device topics currently implemented in `server/src/mqtt/topicCatalog.ts`:

- `aiot/v1/specs/telemetry`
- `aiot/v1/specs/vision`
- `aiot/v1/cane/telemetry`
- `aiot/v1/band/telemetry`
- `aiot/v1/band/sos`

Server topics:

- `aiot/v1/alerts/fall`
- `aiot/v1/alerts/health`
- `aiot/v1/system/status`
- `aiot/v1/spatial/map`

The encrypted envelope is `{ dev_id, tts, cnt, nonce, ciphertext, tag }`. The current Node simulator and bridge use AES-256-GCM with a demo key in `server/src/crypto/aesGcmEngine.ts`. This is demonstration behavior; the key must not be treated as production secret management.

Fall fusion in current code:

- dual-device match window: 3 seconds;
- single-device response countdown: 30 seconds;
- post-cancellation suppression cooldown: 15 seconds.

The README's 15-second response wording conflicts with the current 30-second implementation. Keep the code and this context accurate until the product decision changes.

## 7. Active UI structure

- `RoleSelectionScreen.tsx`: first-run wearer/caregiver choice.
- `EmergencyContactSetup.tsx`: required first-run emergency contact and native permission setup.
- `DashboardScreen.tsx`: role-aware home/overview.
- `DeviceStatusGrid.tsx`: shared wearable freshness and device cards.
- `VitalsCard.tsx`: canonical current-vitals card; no-data is distinct from normal.
- `FallAlertModal.tsx`: explicit false-alarm and caregiver actions.
- `AlertsScreen.tsx`: persistent in-memory health/fall alert list.
- `Spatial3dRadar.tsx`: canvas radar with a text summary for accessibility.
- `AIChatDrawer.tsx`: AURA Guide voice/text assistant.
- `BottomNavBar.tsx`: role-aware Home/Path/Alerts/More navigation.
- `SecurityPayloadInspector.tsx`: advanced technical diagnostics only.
- `SimulatorControlBar.tsx`: development/demo controls only; never a production safety control.

The app should default to human-readable safety language. Keep MQTT, AES, YOLO, counter, and fusion details in advanced/diagnostic surfaces.

The selected role is stored in `localStorage` under `AURA_USER_ROLE`. It is a demo preference only. The caregiver view currently monitors one global demo wearer because backend multi-wearer isolation is not implemented.

## 8. Known implementation caveats

- This is simulation-first. There is no ESP32/ESP8266 firmware in this repository. The backend simulator runs only when `ENABLE_SIMULATOR=true`.
- Role selection is local demo state and does not provide access control. REST and WebSocket endpoints are currently unauthenticated.
- The server has one global telemetry snapshot and one global fall verifier. Multiple wearer isolation is not implemented.
- The current simulator emits on a roughly 1200 ms cycle; UI claims such as `50 Hz` or `< 2.1ms` must not be presented as measured facts unless runtime instrumentation proves them.
- Health alerts are transient server broadcasts unless the client stores them in its in-memory alert list. There is no database or historical telemetry store.
- AURA Guide may use Google Gemini when configured, but the local fallback and one-hour trend examples are deterministic demo behavior, not clinical history.
- Emergency contact data is stored locally under `AURA_EMERGENCY_CONTACT`; it is not sent to AURA Bridge. On Android, the native `EmergencyActions` plugin requests `CALL_PHONE` and `SEND_SMS`, sends the escalation SMS, and starts the phone call when the 30-second fall response expires. This requires a phone-capable device, granted runtime permissions, and an available carrier; delivery/connection is not guaranteed. GPS dispatch and caregiver notification remain simulated workflows.
- The demo AES key is hard-coded in source and is not production key management.
- The protocol docs describe a 10-second timestamp window while the current decryptor uses 15 seconds. Preserve this discrepancy until intentionally resolved.
- The active client is React DOM/Vite plus Capacitor; native-style `.native.tsx` files are not the active entry path.
- Legacy duplicate dashboard/chat/header/chart components were removed during the AURA Assist redesign; the active component list above is authoritative.
- Do not read or copy `server/.env` into this file. Never commit credentials, local IP addresses, tokens, or private payloads.

## 9. Naming and content rules

Use this brand hierarchy in new UI and documentation:

- **AURA Assist:** user-facing app.
- **AURA Wearables:** ecosystem descriptor.
- **AURA Guide:** voice/text assistant.
- **AURA Bridge:** backend telemetry service.
- **Smart Glasses**, **Smart Cane**, **Smart Band:** user-facing device names.
- **AIoT Assistive Suite:** technical/research project name.

Avoid presenting `AIoT`, `MQTT`, `AES-256-GCM`, `YOLO`, `F_cane`, `F_band`, or ESP chip names as primary user-facing language. They belong in advanced diagnostics.

Avoid unverified medical or operational claims such as “medical-grade,” “clinical diagnosis,” or “emergency dispatch initiated.” Prefer “assistive safety monitoring,” “health snapshot,” “caregiver workflow,” and “simulation” when appropriate.

## 10. Maintenance rules for future agents

- Update this file whenever app identity, active entry points, protocol behavior, UI role behavior, runtime commands, or known caveats change.
- Update the “Last verified” date after rechecking runtime facts.
- Keep chronological requests and detailed change history in `flow.md`; keep this file compact and operational.
- Record unresolved discrepancies instead of silently choosing a documentation claim over executable behavior.
- Update the active UI structure when components are added, removed, or replaced.
- Do not edit generated `mobile-app/dist` files or generated Capacitor assets directly. Rebuild and synchronize them from source.
- Record exact checks that were actually run. Missing, skipped, or failed checks are not passes.
- Preserve unrelated user work and inspect `git status` before edits.

## 11. Verification ledger

| Date | Check | Result |
| --- | --- | --- |
| 2026-10-17 | `server/npm run build` | Passed before the AURA Assist redesign |
| 2026-10-17 | `mobile-app/npm run build` | Passed before the AURA Assist redesign; Vite reported a non-blocking large-chunk warning |
| 2026-10-17 | `git diff --check` | Passed before the AURA Assist redesign |
| 2026-10-17 | `mobile-app/npm run build` | Passed after AURA Assist role-aware redesign; Vite reported the existing large-chunk warning |
| 2026-10-17 | `server/npm run build` | Passed after AURA Assist naming and assistant copy updates |
| 2026-10-17 | `mobile-app/npm run cap:sync` | Passed; Android assets synchronized from the current web build |
| 2026-10-17 | Android `gradlew.bat test` with JDK 21 | Passed; existing template tests only |
| 2026-10-17 | Android `gradlew.bat assembleDebug` with JDK 21 | Passed; generated debug APK |
| 2026-10-17 | Local simulator smoke check | Passed `/api/status`, `DUAL_FALL`, and `SOS_CANCEL` with `ENABLE_SIMULATOR=true` |
| 2026-10-17 | `git diff --check` | Passed after redesign changes |
| 2026-10-17 | `server/npm run build` | Passed after fall dismissal and safety-copy follow-up |
| 2026-10-17 | `mobile-app/npm run build` | Passed after fall dismissal and safety-copy follow-up; Vite reported the existing large-chunk warning |
| 2026-10-17 | `mobile-app/npm run cap:sync` | Passed; Android web assets synchronized after the follow-up |
| 2026-10-17 | Android `gradlew.bat test` with JDK 21 | Passed; existing template tests only |
| 2026-10-17 | Android `gradlew.bat assembleDebug` with JDK 21 | Passed; debug APK rebuilt from the synchronized web assets |
| 2026-10-17 | Local simulator smoke check on port 4400 | Passed `/api/status`, `DUAL_FALL`, and `/api/fall/dismiss`; final alert state returned to `IDLE` |
| 2026-10-17 | `git diff --check` | Passed after the follow-up changes |
| 2026-10-17 | `mobile-app/npm run build` | Passed after emergency contact onboarding and native escalation wiring; Vite reported the existing large-chunk warning |
| 2026-10-17 | `server/npm run build` | Passed after escalation message update |
| 2026-10-17 | `mobile-app/npm run cap:sync` | Passed; Android assets synchronized from the emergency-contact web build |
| 2026-10-17 | Android `gradlew.bat test` with Android Studio JBR | Passed; custom EmergencyActions plugin compiled |
| 2026-10-17 | Android `gradlew.bat assembleDebug` with Android Studio JBR | Passed; debug APK rebuilt with native call/SMS permissions and plugin |

The latest continuation checks are recorded above; the existing Vite large-chunk and Gradle `flatDir` warnings remain non-blocking.

## 12. Change notes

- 2026-10-17: Created the root context file so future agents can start from the canonical product, architecture, runtime, protocol, naming, caveats, and verification rules.
- 2026-10-17: Product direction set to AURA Assist with local Caregiver and Wearer demo roles. The role choice is a UX preference, not authorization.
- 2026-10-17: Implemented role selection, role-aware navigation and dashboard copy, persistent in-memory alert history, accessible safety language, advanced-only developer tools, and AURA Assist/AURA Guide naming across the active client and backend assistant.
- 2026-10-17: Continued from the redesign checkpoint by wiring the false-alarm action to the bridge dismissal endpoint, removing claims of real external dispatch from runtime alerts, and replacing the native default host with a portable `localhost` default. Web assets were rebuilt and synchronized.
- 2026-10-17: Added required first-run emergency contact setup, local contact storage, Android runtime permissions, and native SMS/call escalation when the single-device fall response window expires. Web and Android builds were rechecked.
