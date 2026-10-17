# Project Lifecycle & Change Log (`flow.md`)
**AIoT-Based Tri-Wearable Assistive System with Cross-Device Fall Detection and Encrypted Telemetry**

---

## Project Metadata
- **Project Name**: AIoT Assistive Suite (Smart Glasses, Smart Cane, Smart Band)
- **Repository Location**: [`c:\Users\Saunok Roy\Documents\projects\final-year`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year)
- **Primary Stack**: Node.js, Express, TypeScript, WebSocket (WSS), MQTT, AES-256-GCM Crypto, React Native Web, Capacitor Android, Recharts, Vite.
- **Backend Port**: `4000`
- **Frontend Port**: `3000`

---

## Lifecycle Log

### [Prompt 1] - 2026-10-10 18:10 IST
**User Request**: Establish MQTT topics for specs, cane, and band; build the pipeline with required encryption; build production-ready React Native app and dashboard.

#### Actions & Changes Made:
1. **Directory Structure Setup**:
   - Created [`docs/`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/docs), [`server/`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server), and [`mobile-app/`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app).

2. **MQTT Specification Documentation**:
   - Created [`docs/MQTT_SPECIFICATION.md`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/docs/MQTT_SPECIFICATION.md):
     - Defined MQTT topic hierarchy (`aiot/v1/specs/telemetry`, `aiot/v1/specs/vision`, `aiot/v1/cane/telemetry`, `aiot/v1/band/telemetry`, `aiot/v1/band/sos`, `aiot/v1/alerts/fall`, `aiot/v1/alerts/health`).
     - Standardized AES-256-GCM envelope format: $P = \{ \text{dev\_id}, t_{\text{ts}}, cnt, \text{nonce}, \text{ciphertext}, \text{tag} \}$.
     - Specified QoS rules (QoS 1 for fall/SOS/vision alerts, QoS 0 for high-frequency telemetry).

3. **Backend Encryption & Pipeline Implementation (`server/`)**:
   - [`server/package.json`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/package.json): Installed `express`, `cors`, `ws`, `mqtt`, `dotenv`, `tsx`, `typescript`.
   - [`server/src/crypto/aesGcmEngine.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/crypto/aesGcmEngine.ts): Firmware AES-256-GCM encryptor/decryptor with monotonic replay counter check & 10s timestamp freshness verification.
   - [`server/src/mqtt/topicCatalog.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/mqtt/topicCatalog.ts): Topic paths & QoS mappings.
   - [`server/src/fusion/fallVerification.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/fusion/fallVerification.ts): Algorithm 2 cross-device fall fusion ($\Delta t = 3\text{s}$ dual agreement $\rightarrow$ High Confidence; single flag $\rightarrow$ 30s SOS countdown).
   - [`server/src/mapping/spatial3dMapper.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/mapping/spatial3dMapper.ts): 3D obstacle mapper implementing $p = d [\cos\phi\cos\theta, \cos\phi\sin\theta, \sin\phi]^T$ over 59 cells.
   - [`server/src/chatbot/auraAiAssistant.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/chatbot/auraAiAssistant.ts): Multi-modal natural-language AI assistant.
   - [`server/src/simulator/hardwareSimulator.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/simulator/hardwareSimulator.ts): Hardware simulator generating encrypted MQTT telemetry for Specs, Cane, and Band.
   - [`server/src/index.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/index.ts): Express REST + WebSocket pipeline server listening on Port 4000.

4. **Production React Native Web Dashboard App (`mobile-app/`)**:
   - [`mobile-app/vite.config.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/vite.config.ts): React Native Web alias configuration.
   - [`mobile-app/src/index.css`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/index.css): Dark mode cyber-medical design system.
   - [`mobile-app/src/types/telemetry.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/types/telemetry.ts): TypeScript telemetry models.
   - [`HeaderBar.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/HeaderBar.tsx): Top header with live TLS & AES-256-GCM badges.
   - [`WearablesGrid.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/WearablesGrid.tsx): Glasses, Cane, and Band status cards.
   - [`VitalsTelemetryChart.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/VitalsTelemetryChart.tsx): Animated Heart Rate & $\text{SpO}_2$ sparkline trace.
   - [`Spatial3dRadar.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/Spatial3dRadar.tsx): Interactive 59-cell 3D spatial radar visualizer.
   - [`FallFusionMonitor.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/FallFusionMonitor.tsx): Algorithm 2 fall verification banner & 30s SOS countdown modal.
   - [`SecurityPayloadInspector.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/SecurityPayloadInspector.tsx): AES-256-GCM header inspector & log terminal.
   - [`AuraAiChatbotModal.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/AuraAiChatbotModal.tsx): Interactive AI chatbot thread matching Figure 13.
   - [`SimulatorControlBar.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/SimulatorControlBar.tsx): Hardware simulator trigger buttons.
   - [`BottomNavBar.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/BottomNavBar.tsx): Bottom tab navigation bar.
   - [`App.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/App.tsx): Root container with WebSocket listener.

5. **Verification & Summary**:
   - Backend API status test confirmed live decrypted telemetry stream and 0ms AES-GCM verification latency.
   - REST trigger test confirmed Algorithm 2 High-Confidence Fall Alert escalation ($F_{\text{cane}} \land F_{\text{band}}$).
   - Created [`docs/PROJECT_SUMMARY.md`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/docs/PROJECT_SUMMARY.md).

---

### [Prompt 2] - 2026-10-10 18:28 IST
**User Request**: Maintain a `flow.md` file to track the project lifecycle and log every prompt/change.

---

### [Prompt 3] - 2026-10-10 18:29 IST
**User Request**: Clarification on which service/broker is being used for MQTT.

---

### [Prompt 4] - 2026-10-10 18:31 IST
**User Request**: "i want to run this on hive mqtt"

---

### [Prompt 5] - 2026-10-10 18:40 IST
**User Request**: "right now i do not have the hardware devices so this pipeline will be a simulation, later i will adjust the devices firmware code to this pipeline"

---

### [Prompt 6] - 2026-10-10 18:45 IST
**User Request**: "okay now tell me how to run and test it"

---

### [Prompt 7] - 2026-10-10 18:51 IST
**User Request**: "first tell me what credentials to fill where to get them, then tell me how to run it"

---

### [Prompt 8] - 2026-10-10 19:27 IST
**User Request**: Notification that HiveMQ Cloud Serverless Free plan is retired for new accounts, and listing free alternatives (HiveMQ Public `broker.hivemq.com`, EMQX Cloud, Mosquitto Public `test.mosquitto.org`).

---

### [Prompt 9] - 2026-10-10 19:43 IST
**User Request**: "okay now how to run the project? close it if its running already need to run it from scratch"

---

### [Prompt 10] - 2026-10-11 00:42 IST
**User Request**: "how do i run this on my phone"

---

### [Prompt 11] - 2026-10-11 00:43 IST
**User Request**: "i want to run it as an android app on my phone"

---

### [Prompt 12] - 2026-10-11 00:51 IST
**User Request**: Handling Gradle SDK build requirement for native Android compilation.

---

### [Prompt 13] - 2026-10-11 01:01 IST
**User Request**: User ran `.\gradlew.bat assembleDebug` and received `Directory does not exist` error for `sdk.dir`.

#### Actions & Changes Made:
1. **Identified Missing Android SDK**: Explained that `./gradlew.bat` requires Android Studio's SDK tools to be installed on Windows.
2. **Provided Solutions**:
   - **Solution 1 (PWA Installation - Instant)**: Open Chrome on Android $\rightarrow$ `http://192.168.1.214:3000/` $\rightarrow$ "Add to Home Screen" (Installs instant full-screen app icon).
   - **Solution 2 (Android Studio Setup)**: Download Android Studio to provide local Gradle SDK compilation.
3. Updated [`flow.md`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/flow.md) and [`docs/flow.md`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/docs/flow.md).

---

### [Prompt 14] - 2026-10-11 15:11 IST
**User Request**: Push project to GitHub (`https://github.com/sp4m-08/project-1-specs.git`).

#### Actions & Changes Made:
1. Created project-wide [`.gitignore`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/.gitignore) to protect credentials (`.env`), ignore build artifacts (`dist/`, `.gradle/`, `local.properties`), and exclude dependencies (`node_modules/`).
2. Initialized Git repository, renamed branch to `main`, committed initial code base, added remote `origin`, and pushed upstream.

---

### [Prompt 15] - 2026-10-11 15:15 IST
**User Request**: How to run this project as an Android app on physical phone using Android Studio.

#### Actions & Changes Made:
1. Added `android:usesCleartextTraffic="true"` to [`AndroidManifest.xml`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/android/app/src/main/AndroidManifest.xml) to permit local HTTP & WebSocket telemetry.
2. Added configurable host state to [`App.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/App.tsx) and [`HeaderBar.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/HeaderBar.tsx) for ADB reverse (`localhost`) and Wi-Fi (`192.168.x.x`).
3. Added [`tsconfig.json`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/tsconfig.json) to `mobile-app` and fixed TypeScript types.
4. Synced web assets with `npx cap sync`.

---

### [Prompt 16] - 2026-10-11 15:25 IST
**User Request**: "i want to open it as an apk not locally".

#### Actions & Changes Made:
1. Configured Gradle build to use Android Studio's bundled JDK 21+ (`C:\Program Files\Android\Android Studio\jbr`).
2. Executed `gradlew assembleDebug` to produce standalone APK.
3. Placed [`AIoT-Assistive-Suite-debug.apk`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/AIoT-Assistive-Suite-debug.apk) directly at the project root for 1-click install via ADB or direct transfer.

---

### [Prompt 17] - 2026-10-11 20:38 IST
**User Request**: Change UI/UX based on Sauce Labs "Obsidian Glass" command center style reference and rebuild APK.

#### Actions & Changes Made:
1. Applied Sauce Labs design tokens in [`index.css`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/index.css) (`#132322`, `#0E1A19`, `#EDF7F5`, `#3DDC91`, `#FFCD48`, 56px pills, 60px large cards, 20px nested cards).
2. Redesigned all components with luminance rhythm and pill language.
3. Rebuilt and updated APK at project root.

---

### [Prompt 18] - 2026-10-11 22:37 IST
**User Request**: How to run it locally on laptop.

#### Actions & Changes Made:
1. Verified `npm run dev` in `server` (Port 4000) and `mobile-app` (Port 3000).
2. Provided step-by-step local execution instructions.

---

### [Prompt 19] - 2026-10-11 22:44 IST
**User Request**: Scrap the complete current design of the app, build the UI/UX based off of the comprehensive React Native / Obsidian Glass engineering console specification, and log changes to `flow.md`.

#### Actions & Changes Made:
1. **Design System & Tokens ("Obsidian Glass")**:
   - Obsidian Canvas (`#132322`), Deep Abyss (`#0E1A19`), Mint Frost (`#EDF7F5`), Pure White (`#FFFFFF`), Neon Pulse (`#3DDC91`), Signal Yellow (`#FFCD48`), Slate Text (`#828786`).
   - 56px pill buttons & tab pills, 60px large cards, 20px nested cards, 9px tracked-out uppercase eyebrows (`0.05em`).
   - Luminance rhythm alternating between dark bands (`#132322`) and light content cards (`#EDF7F5`).
2. **Main Telemetry Dashboard & Header (`DashboardScreen.tsx`)**:
   - App title `"AURA AIoT ASSISTANT"` with live `"Bridge: Connected"` status badge in Neon Pulse (`#3DDC91`).
   - 4-column floating telemetry statistics bar (`50 Hz`, `256-BIT`, `3.0s`, `< 2.1ms`).
3. **Connected Devices Row (`DeviceStatusGrid.tsx`)**:
   - 3 modular hardware tiles with `60px` border-radius on `#0E1A19` Deep Abyss background:
     1. *Smart Glasses (ESP32-CAM)*: Status, YOLO Vision active, obstacle detected clearance distance.
     2. *Smart Cane (ESP8266)*: Ground ultrasonic proximity, active scanning, buzzer trigger indicator.
     3. *Smart Band (ESP8266)*: Patient status (Stable/Normal, Warning, Critical), BMP280 altitude, motion steps.
4. **Live Vitals Panel (`VitalsCard.tsx`)**:
   - Light Content Card in Mint Frost (`#EDF7F5`) with `60px` border-radius.
   - Large Heart Rate display (`BPM`) with clinical status thresholds (Normal: 60-100, Warning: 50-60 or 100-120, Critical: <50 or >120).
   - Blood Oxygen ($\text{SpO}_2$) display with clinical threshold badges.
   - Environmental BMP280 temperature, pressure, and altitude telemetry.
   - Real-time sparkline trace.
5. **Two-Tier Fall-Verification & Emergency Alert Modal (`FallAlertModal.tsx`)**:
   - *Tier 1 (Single Device Trigger, $F=1$)*: Low-confidence warning with a 30-second circular countdown ($T_{\text{resp}} = 30\text{s}$) and "Cancel False Alarm" pill action.
   - *Tier 2 (Dual Device Trigger, $|t_c - t_b| \le \Delta t = 3.0\text{s}$)*: Critical high-confidence alert escalated immediately to caregivers with emergency telephony dispatch banner and GPS coordinates.
6. **Voice-Enabled AI Chatbot & Sensor Fusion Drawer (`AIChatDrawer.tsx`)**:
   - Bottom floating microphone action button in Neon Pulse (`#3DDC91`).
   - Natural language conversational assistant answering clinical queries (*"How was my father's heart rate over the last hour?"*).
   - Multi-modal response cards containing 1-hour heart rate trend chart, live status, and contextual event correlation links (e.g. correlating HR spike with cane obstacle detection).
7. **Production Build & Native APK**:
   - Compiled web bundle via `npm run build`.
   - Synced native Capacitor assets via `npx cap sync`.
   - Reassembled updated Android APK via `gradlew assembleDebug` with Android Studio JDK 21.
   - Refreshed [`AIoT-Assistive-Suite-debug.apk`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/AIoT-Assistive-Suite-debug.apk) (4.50 MB) at the project root.

---

### Prompt 20: Mobile Viewport Optimization, Safe Area Compliance & Status Bar / Gesture Bar Clearance

#### User Goal / Requirement:
- Review React Native / Capacitor mobile screen implementation where the system status bar collided with the top category tracker (`"COMMAND CONSOLE"`) and screen title (`"AIoT Assistive Suite"`), and the bottom navigation tab bar crowded the native device gesture indicator bar / home indicator.
- Refactor layout to adhere to proper mobile standards and Obsidian Glass design tokens using `react-native-safe-area-context` dynamic insets (`insets.top`, `insets.bottom`), dynamic header padding, floating nav elevation, and generous scrollview clearance.

#### Actions & Changes Made:
1. **Viewport Meta Tag Optimization (`mobile-app/index.html`)**:
   - Added `viewport-fit=cover` to `<meta name="viewport">` allowing edge-to-edge rendering and CSS `env(safe-area-inset-*)` support.
   - Added `<meta name="theme-color" content="#132322">` and `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` for seamless dark status bar integration.
2. **Safe Area Tokens & Utilities (`mobile-app/src/index.css`)**:
   - Declared `--safe-area-top: max(env(safe-area-inset-top, 0px), 28px)` and `--safe-area-bottom: max(env(safe-area-inset-bottom, 0px), 20px)`.
3. **Top Status Bar & Notch Collision Resolution (`DashboardScreen.tsx`, `HeaderBar.tsx`)**:
   - Replaced fixed top padding with dynamic safe clearance: `paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 28px) + 12px)'`.
   - Guaranteed minimum 16px-24px clearance beneath the device status bar / camera punch hole.
   - Preserved `"COMMAND CONSOLE"` uppercase neon eyebrow and `"AIoT Assistive Suite"` title.
4. **Bottom Gesture Indicator Clearance (`BottomNavBar.tsx`)**:
   - Elevated fixed bottom tab bar container with `paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 18px) + 6px)'` on a frosted Obsidian glass surface (`rgba(19, 35, 34, 0.95)` with `backdrop-filter: blur(16px)`).
   - Elevated tab buttons cleanly above the Android gesture pill and iOS home indicator.
5. **ScrollView & Floating Action Button Ergonomics (`App.tsx`)**:
   - Adjusted `contentViewport` with `paddingBottom: 'calc(100px + max(env(safe-area-inset-bottom, 0px), 24px))'` ensuring all cards and simulator controls scroll completely into view.
   - Elevated `floatingMicButton` to `bottom: 'calc(78px + max(env(safe-area-inset-bottom, 0px), 20px))'`.
6. **Production React Native Component (`AuraDashboardScreen.native.tsx`)**:
   - Implemented a complete, self-contained React Native functional component utilizing `useSafeAreaInsets()` from `react-native-safe-area-context`.
   - Adheres strictly to the Obsidian Glass design system (`#132322`, `#0E1A19`, `#EDF7F5`, `#3DDC91`, 56px pill buttons, 60px card curvature).
7. **Native APK Reassembly & Verification**:
   - Recompiled production bundle with `npm run build`.
   - Synchronized native assets via `npx cap sync`.
   - Rebuilt debug APK via Gradle with JDK 21 (`BUILD SUCCESSFUL in 13s`).
    - Updated standalone APK [`AIoT-Assistive-Suite-debug.apk`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/AIoT-Assistive-Suite-debug.apk) (4.46 MB) in workspace root.

---

### [Prompt 21] - 2026-10-17
**User Request**: Implement the UI/UX and naming recommendations, add caregiver/wearer role selection, and maintain a compact root `context.md` for future agents.

#### Actions & Changes Made:
1. Added [`context.md`](context.md) with canonical AURA Assist identity, AURA Guide/AURA Bridge naming, actual React/Vite/Capacitor architecture, role behavior, runtime commands, protocol invariants, known caveats, maintenance rules, and verification ledger.
2. Added local demo role selection through `RoleSelectionScreen.tsx`; persisted `AURA_USER_ROLE` supports Wearer and Caregiver views. This is UX state, not authentication or authorization.
3. Reworked the active client toward a safety-first experience: role-aware dashboard copy, Home/Overview, Path, Alerts, and More navigation, persistent in-memory health/fall alerts, accessible path summaries, and developer-only simulator/security tools.
4. Replaced fabricated default vitals in the active health card with explicit no-data states and removed primary user-facing medical-grade, clinical, and dispatch claims.
5. Renamed the user-facing app to **AURA Assist**, the voice assistant to **AURA Guide**, and the backend display name to **AURA Bridge** while preserving the Android application ID `com.aiot.assistivesuite`.
6. Updated the active AI assistant fallback and prompt copy to avoid implying clinical diagnosis or real emergency dispatch.
7. Verification passed: mobile build, server build, Capacitor sync, Android unit tests, Android debug assembly, local simulator status/dual-fall/cancel smoke check, and `git diff --check`. The existing Vite large-chunk and Gradle `flatDir` warnings remain.

---

### [Prompt 22] - 2026-10-17
**Continuation**: Resume AURA Assist from the role-aware redesign checkpoint without discarding uncommitted work.

#### Actions & Changes Made:
1. Inspected the root `context.md`, latest `flow.md` entry, repository status, and complete uncommitted diff. The redesign remains uncommitted on `main`; no unrelated work was reset or discarded.
2. Fixed the fall false-alarm path so the modal's cancel/acknowledge action invokes the existing bridge dismissal endpoint instead of only hiding the modal locally.
3. Reworded runtime fall, health, SOS, and voice feedback so the simulation does not claim that an external call, message, caregiver notification, or emergency dispatch occurred.
4. Replaced the machine-specific native default server IP with a portable `localhost` default; the existing host configuration remains available for phone-over-Wi-Fi use.
5. Rebuilt and synchronized the dashboard web assets, then verified the bridge's simulated dual-fall and dismissal flow.

#### Verification:
- `server/npm run build` — passed.
- `mobile-app/npm run build` — passed; the existing Vite large-chunk warning remains.
- `mobile-app/npm run cap:sync` — passed.
- Android `gradlew.bat test` with JDK 21 — passed; existing template tests only.
- Android `gradlew.bat assembleDebug` with JDK 21 — passed; debug APK rebuilt from the synchronized web assets.
- Local simulator smoke check with `ENABLE_SIMULATOR=true` on port `4400` — `/api/status` ready, `DUAL_FALL` reached `HIGH_CONFIDENCE_ALERT`, `/api/fall/dismiss` and final status returned `IDLE`.
- `git diff --check` — passed.

---

### [Prompt 23] - 2026-10-17
**User Request**: Require first-run emergency contact setup for the wearer and automatically send a native Android SMS and phone call when the fall response countdown expires without being silenced.

#### Actions & Changes Made:
1. Added `EmergencyContactSetup.tsx`, local `AURA_EMERGENCY_CONTACT` storage, validation, and required onboarding after role selection when no contact exists.
2. Added the Capacitor `EmergencyActions` bridge with Android `CALL_PHONE` and `SEND_SMS` runtime permissions, direct native SMS dispatch, and native phone call initiation.
3. Wired `ESCALATED_TO_CAREGIVER` events from WebSocket/HTTP state into an idempotent native emergency action flow; the contact remains device-local and is not sent to AURA Bridge.
4. Updated the fall escalation copy and More settings contact editor. Updated `context.md` with native integration caveats and verification records.

#### Verification:
- `mobile-app/npm run build` — passed; the existing Vite large-chunk warning remains.
- `server/npm run build` — passed.
- `mobile-app/npm run cap:sync` — passed.
- Android `gradlew.bat test` with Android Studio JBR — passed; custom EmergencyActions plugin compiled.
- Android `gradlew.bat assembleDebug` with Android Studio JBR — passed; debug APK rebuilt with native call/SMS permissions.
- `git diff --check` — passed.

