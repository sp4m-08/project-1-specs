# Secure AIoT Assistive Suite - Full Implementation Report

---

## 1. Project Overview & Deliverables Completed

This repository implements the end-to-end architecture described in the research paper *"Secure AIoT Wearables for Assistive Navigation, Health Monitoring, and Fall Detection"* and the Invention Disclosure Format (IDF).

### Delivered Architecture Components:
1. **MQTT Topics Architecture & QoS Hierarchy**: Detailed topic tree for `specs`, `cane`, `band`, fall alerts, health anomalies, spatial map points, and system status.
2. **Firmware AES-256-GCM Authenticated Encryption Pipeline**:
   - Firmware envelope format: $P = \{ \text{dev\_id}, t_{\text{ts}}, cnt, \text{nonce}, \text{ciphertext}, \text{tag} \}$.
   - 256-bit secret key + 96-bit random IV nonce + 128-bit authentication tag.
   - Monotonic per-device counter ($cnt$) replay protection + 10s timestamp freshness verification window.
3. **Cross-Device Fall Verification Engine (Algorithm 2)**:
   - Evaluates candidate fall flags $F_{\text{cane}}(t_c)$ and $F_{\text{band}}(t_b)$ within fusion window $\Delta t = 3\text{ s}$.
   - Dual agreement ($F_{\text{cane}} = 1 \land F_{\text{band}} = 1 \land |t_c - t_b| \le 3\text{s}$) $\rightarrow$ Escalates **High-Confidence Fall Alert** (Critical).
   - Single device flag $\rightarrow$ Issues **Low-Confidence Warning** and starts $T_{\text{resp}} = 30\text{ s}$ countdown for manual SOS button cancellation.
4. **3-D Spatial Obstacle Mapping Engine**:
   - Implements orientation transform: $\mathbf{p} = d \cdot [\cos\phi\cos\theta, \cos\phi\sin\theta, \sin\phi]^T$.
   - Reconstructs a 59-cell point cloud color-coded by distance (near-field $<0.8\text{m}$ red to far-field $2.0\text{m}$ blue).
5. **Voice-Enabled Aura AI Assistant**:
   - Natural-language query interface with multi-modal responses correlating vitals history (HR, $\text{SpO}_2$) with obstacle and fall events.
6. **Production-Ready React Native Web Dashboard**:
   - Cyber-medical dark mode aesthetic (`#0B0F17`, glowing cyan `#00F2FE`, alert red `#EF4444`, emerald `#10B981`).
   - Live telemetry status cards for Smart Glasses, Smart Cane, and Smart Band.
   - Real-time animated Vitals Telemetry sparkline chart (HR & $\text{SpO}_2$).
   - Interactive 3D Spatial Radar Visualizer rendering the 59-cell obstacle map.
   - Live AES-256-GCM Encryption Header & Replay Inspector.
   - Embedded Hardware Simulator Control Bar for live manual trigger testing.

---

## 2. MQTT Topic Specifications & QoS Rules

| Topic Path | Publisher | Subscriber | QoS | Payload Content |
| :--- | :--- | :--- | :--- | :--- |
| [`aiot/v1/specs/telemetry`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/docs/MQTT_SPECIFICATION.md#L39) | Smart Glasses | Bridge Server | 0 | AES-256-GCM encrypted ultrasonic distance ($d$), pitch ($\phi$), yaw ($\theta$), battery % |
| [`aiot/v1/specs/vision`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/docs/MQTT_SPECIFICATION.md#L40) | ESP32-CAM / Edge | Bridge Server | 1 | Encrypted YOLO detections (500 INR, 200 INR banknotes, person, vehicle) + TTS text |
| [`aiot/v1/cane/telemetry`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/docs/MQTT_SPECIFICATION.md#L41) | Smart Cane | Bridge Server | 0 | Encrypted ultrasonic range, buzzer status, IMU accel $a_{\text{mag}}$, candidate fall $F_{\text{cane}}$, handle HR/$\text{SpO}_2$ |
| [`aiot/v1/band/telemetry`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/docs/MQTT_SPECIFICATION.md#L42) | Smart Band | Bridge Server | 0 | Encrypted IMU accel $a_{\text{mag}}$, candidate fall $F_{\text{band}}$, wrist HR/$\text{SpO}_2$, pressure, altitude, steps |
| [`aiot/v1/band/sos`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/docs/MQTT_SPECIFICATION.md#L43) | Smart Band | Bridge Server | 1 | Encrypted manual SOS push button press or false-alarm cancel trigger |
| [`aiot/v1/alerts/fall`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/docs/MQTT_SPECIFICATION.md#L44) | Bridge Server | Dashboard / Apps | 1 | Algorithm 2 High-Confidence Fall Alert & Low-Confidence 30s SOS Warning state |
| [`aiot/v1/alerts/health`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/docs/MQTT_SPECIFICATION.md#L45) | Bridge Server | Dashboard / Apps | 1 | Health metric threshold warnings & critical vitals alerts |

---

## 3. System Source Files Location

- **Documentation**: [`MQTT_SPECIFICATION.md`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/docs/MQTT_SPECIFICATION.md)
- **Backend Pipeline & Encryption**:
  - Encryptor / Decryptor Engine: [`aesGcmEngine.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/crypto/aesGcmEngine.ts)
  - Topic Catalog: [`topicCatalog.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/mqtt/topicCatalog.ts)
  - Fall Verifier (Algorithm 2): [`fallVerification.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/fusion/fallVerification.ts)
  - 3D Spatial Mapper: [`spatial3dMapper.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/mapping/spatial3dMapper.ts)
  - AI Assistant: [`auraAiAssistant.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/chatbot/auraAiAssistant.ts)
  - Hardware Simulator: [`hardwareSimulator.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/simulator/hardwareSimulator.ts)
  - Server Entrypoint: [`index.ts`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/server/src/index.ts)
- **React Native Web Dashboard App**:
  - Main App Container: [`App.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/App.tsx)
  - Header Bar: [`HeaderBar.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/HeaderBar.tsx)
  - Wearables Status Grid: [`WearablesGrid.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/WearablesGrid.tsx)
  - Vitals Telemetry Chart: [`VitalsTelemetryChart.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/VitalsTelemetryChart.tsx)
  - 3D Spatial Radar: [`Spatial3dRadar.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/Spatial3dRadar.tsx)
  - Fall Fusion Monitor: [`FallFusionMonitor.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/FallFusionMonitor.tsx)
  - Security Payload Inspector: [`SecurityPayloadInspector.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/SecurityPayloadInspector.tsx)
  - Aura AI Chatbot Modal: [`AuraAiChatbotModal.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/AuraAiChatbotModal.tsx)
  - Simulator Control Bar: [`SimulatorControlBar.tsx`](file:///c:/Users/Saunok%20Roy/Documents/projects/final-year/mobile-app/src/components/SimulatorControlBar.tsx)

---

## 4. How to Run & Verify the System

### Running Backend Server (Port 4000)
```bash
cd "c:\Users\Saunok Roy\Documents\projects\final-year\server"
npm run dev
```

### Running Production React Native Web Dashboard App (Port 3000)
```bash
cd "c:\Users\Saunok Roy\Documents\projects\final-year\mobile-app"
npm run dev
```
Open **`http://localhost:3000/`** in any browser.
