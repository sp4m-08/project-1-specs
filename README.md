# AURA Assist

Secure tri-wearable assistive safety platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Android & Web](https://img.shields.io/badge/Platform-Android%20%7C%20Web-38BDF8.svg)](https://capacitorjs.com/)
[![Security: AES--256--GCM](https://img.shields.io/badge/Security-AES--256--GCM%20AEAD-3DDC91.svg)](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
[![AI: Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%203.5-FBBC04.svg)](https://ai.google.dev/)
[![MQTT: TLS 1.3](https://img.shields.io/badge/MQTT-Mosquitto%20%2F%20HiveMQ-FF6B6B.svg)](https://mqtt.org/)

AURA Assist is a simulation-first assistive safety platform for visually impaired and elderly users and the people who support them. It brings together three connected wearables — **Smart Glasses**, **Smart Cane**, and **Smart Band** — with path awareness, health snapshots, cross-device fall verification, caregiver workflows, and the **AURA Guide** voice assistant.

The technical project name is **AIoT Assistive Suite**. MQTT, AES-GCM, sensor-fusion, and simulator details are documented for engineering and research use; they are not the primary user-facing language.

---

## 🏛️ System Architecture

```
  +------------------+     +------------------+     +------------------+
  |  Smart Glasses   |     |    Smart Cane    |     |    Smart Band    |
  |  (ESP32-CAM +    |     |  (ESP8266 + IMU  |     | (ESP8266 + PPG   |
  |   Ultrasonic)    |     |   + Ultrasonic)  |     |  + IMU + SOS)    |
  +--------+---------+     +--------+---------+     +--------+---------+
           |                        |                        |
           +------------------------+------------------------+
                                    |
                    [AES-256-GCM Encrypted Payloads]
                    [12-byte Nonce + 16-byte Auth Tag]
                    [Strict Anti-Replay Counter Checks]
                                    |
                                    v
                     +-----------------------------+
                     |   Mosquitto MQTT Broker     |
                     |   (Port 1883 / 8883 MQTTS)  |
                     +--------------+--------------+
                                    |
                                    v
          +--------------------------------------------------+
          |      AIoT Fusion Server (Node.js / TypeScript)    |
          |  - AES-GCM Decryption & Counter Verification     |
          |  - Cross-Device Fall Verifier (Algorithm 2)      |
          |  - 3D Spatial Obstacle Mapping Pipeline          |
          |  - Google Gemini 3.5 Telemetry-Grounded Assistant|
          +--------------------+-----------------------------+
                               |
                   WebSocket / REST API (Port 4000)
                               |
                               v
          +--------------------------------------------------+
          |       Cross-Platform Cyber-Medical Client        |
          |  - Standalone Android APK (Capacitor 7 + JBR 21) |
          |  - Native Android Text-To-Speech & Mic Recog     |
          |  - Live 50 Hz Sensor Radar & Fall Alert Modal    |
          |  - Responsive Web Dashboard (Vite + React 19)    |
          +--------------------------------------------------+
```

---

## 🛡️ Tri-Wearable Node Specifications

| Device Node | Hardware Stack | Key Sensors & Actuators | Telemetry Topics |
| :--- | :--- | :--- | :--- |
| **Smart Glasses** | ESP32-CAM, HC-SR04 ultrasonic, LED flash | Head-level distance ($0.15\text{m} - 3.5\text{m}$), YOLOv8 object & currency vision | `aiot/v1/specs/telemetry`<br>`aiot/v1/specs/vision` |
| **Smart Cane** | ESP8266 NodeMCU, MPU-6050 6-DOF IMU, Ultrasonic, Buzzer | Ground obstacle detection, impact acceleration ($a_{\text{mag}}$), step count | `aiot/v1/cane/telemetry`<br>`aiot/v1/cane/fall` |
| **Smart Band** | ESP8266 NodeMCU, MAX30102 PPG sensor, MPU-6050 IMU, Tactile SOS | Heart rate (BPM), $\text{SpO}_2$ (%), wrist acceleration, hardware SOS switch | `aiot/v1/band/telemetry`<br>`aiot/v1/band/sos` |

---

## 🔐 Cryptographic Pipeline & Anti-Replay Defense

All wearable payloads adhere to NIST SP 800-38D AES-GCM authenticated encryption:
* **Cipher**: `AES-256-GCM` (256-bit pre-shared symmetric key).
* **Initialization Vector (IV)**: 96-bit (12-byte) cryptographically random nonce per packet.
* **Integrity Tag**: 128-bit (16-byte) authentication tag; packets with forged or corrupted payloads fail verification and are instantly dropped.
* **Anti-Replay Mechanism**: Strictly monotonic 32-bit counter (`cnt`). If `cnt <= last_seen_cnt`, the server flags and rejects a `REPLAY_ATTACK_REJECTED` attempt. Device reboot exceptions are cryptographically handled with verified reset handshakes.

### Envelope Structure
```json
{
  "dev_id": "band_01",
  "tts": 1791887096015,
  "cnt": 3482,
  "nonce": "a7a2bf602622b859defbfa97",
  "ciphertext": "4f8a...6b12",
  "tag": "e98c...d041"
}
```

---

## ⚡ Fall Detection Sensor Fusion (Algorithm 2)

Single-IMU fall detection suffers from high false-alarm rates (e.g., dropping a cane or gesturing vigorously with a band). The system employs multi-sensor cross-device verification:

1. **Candidate Fall Trigger**: If either the Smart Cane or Smart Band records an acceleration spike ($a_{\text{mag}} > 24\text{ m/s}^2$) followed by prolonged inactivity:
   - A **Low-Confidence Warning** is initiated.
   - A 15-second local SOS cancel countdown window begins on the wearable.
2. **Dual-Device Correlation ($\Delta t \le 3.0\text{s}$)**:
   - If *both* the Smart Cane and Smart Band assert fall flags within a 3-second window, the system escalates to a **High-Confidence Fall Alert**.
   - Immediate audio/visual siren and caregiver notification triggers.
3. **Single-Device Fall Cooldown**: A 15-second suppression cooldown prevents single-device hardware countdown loops from spamming the user interface.

---

## 🧠 AURA Guide Voice Assistant

The AURA Guide assistant ([`server/src/chatbot/auraAiAssistant.ts`](server/src/chatbot/auraAiAssistant.ts)) provides telemetry-grounded assistive guidance. When configured, it can use Google Gemini; otherwise it uses a local deterministic fallback:

- **Real-Time Telemetry Grounding**: Every prompt is automatically contextualized with the latest encrypted vitals (HR, $\text{SpO}_2$, battery), obstacle distances, and fall verification states.
- **Voice Input (Speech-to-Text)**: Users tap the microphone icon in the chat drawer to speak queries naturally via `webkitSpeechRecognition`.
- **Voice Output (Text-to-Speech)**: Responses are vocalized using Android's native `android.speech.tts.TextToSpeech` engine inside the APK (via `@capacitor-community/text-to-speech`) and Web Speech API in desktop browsers.
- **Offline Fallback Engine**: If internet or Gemini API access is interrupted, the assistant switches to a local deterministic rule-based engine for the demo.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (or newer)
- **Java Development Kit**: JDK 21 (e.g. `jbr-21.0.11` for Android builds)
- **Android Studio / Android SDK** (for APK compilation)
- **Docker** (optional, for local Mosquitto MQTT broker)

---

### 1. Setup Backend Server

```powershell
cd server
npm install
```

Create or configure `server/.env`:
```env
PORT=4000
MOSQUITTO_HOST=localhost
MOSQUITTO_PORT=1883
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

Start the server:
```powershell
npm run dev
```
* Backend starts at `http://localhost:4000` (WebSocket at `ws://localhost:4000`).

---

### 2. Setup Frontend Mobile Dashboard

```powershell
cd mobile-app
npm install
npm run dev
```
* Dashboard runs at `http://localhost:3000` (and `http://<your-lan-ip>:3000` for mobile devices on Wi-Fi).

---

### 3. (Optional) Run Local MQTT Broker with Docker

```powershell
docker run -d --name mosquitto -p 1883:1883 -p 9001:9001 eclipse-mosquitto
```

To monitor raw decrypted/encrypted MQTT topics:
```powershell
docker exec -it mosquitto mosquitto_sub -h localhost -p 1883 -t "#" -v
```

---

## 📱 Compiling & Deploying the Android APK

The mobile application is packaged using **Capacitor 7**:

```powershell
cd mobile-app
npm run build
npx cap sync android
```

Build the release/debug APK using Java 21:
```powershell
cmd.exe /c "set JAVA_HOME=C:\Users\rimpi\.jdks\jbr-21.0.11& cd android& gradlew.bat assembleDebug"
```

* **Compiled APK Location**:
  `mobile-app/android/app/build/outputs/apk/debug/app-debug.apk`
* **Direct Wi-Fi Phone Download**:
  Once the Vite dev server is running on your computer, any phone connected to the same Wi-Fi can directly download and install the app from:
  ```
  http://<your-computer-ip>:3000/AIoT-Assistive-Suite.apk
  ```

---

## 📡 MQTT Topic Catalog

| Topic | Description | QoS | Publisher |
| :--- | :--- | :--- | :--- |
| `aiot/v1/specs/telemetry` | Head obstacle range & sonar pitch/yaw | 0 | Smart Glasses |
| `aiot/v1/specs/vision` | YOLO currency / obstacle detections | 1 | Smart Glasses |
| `aiot/v1/cane/telemetry` | Ground range, step count & IMU values | 0 | Smart Cane |
| `aiot/v1/cane/fall` | Cane fall candidate interrupt flag | 1 | Smart Cane |
| `aiot/v1/band/telemetry` | Real-time Heart Rate, SpO2 & steps | 0 | Smart Band |
| `aiot/v1/band/sos` | Manual tactile SOS trigger & cancel | 1 | Smart Band |
| `aiot/v1/alerts/fall` | Cross-device verified fall notifications | 1 | Backend Server |

---

## 🛠️ Testing & Simulation

The dashboard includes an integrated **Hardware Simulator Control Bar**:
* **Cane Fall**: Simulates high-impact ground cane drop ($F_{\text{cane}} = 1$).
* **Band Fall**: Simulates wrist impact flag ($F_{\text{band}} = 1$).
* **Dual Fall**: Injects both flags simultaneously to trigger Algorithm 2 High-Confidence Fall Alert.
* **SOS Press / Cancel**: Injects hardware emergency button activations.
* **Currency & Obstacle Scans**: Injects 500/200 INR banknote detections and proximity warnings.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
