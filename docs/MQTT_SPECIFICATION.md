# MQTT Topic Specifications & Firmware-Level Authenticated Encryption Pipeline
**AIoT-Based Tri-Wearable Assistive System with Cross-Device Fall Detection and Encrypted Telemetry**

---

## 1. Executive Summary & Architectural Overview

The AIoT Assistive Platform coordinates three wearable nodes:
1. **Smart Glasses (`specs`)**: Powered by ESP32 + ESP32-CAM. Captures image frames for YOLO object/obstacle/currency recognition and tracks ultrasonic proximity ($d < 1.0\text{ m}$) with MPU6050 head orientation ($\theta$ yaw, $\phi$ pitch).
2. **Smart Cane (`cane`)**: Powered by ESP8266. Features HC-SR04 ultrasonic ranging ($d < 0.8\text{ m}$ buzzer alert), handle-mounted MAX30100 oximeter (HR & $\text{SpO}_2$), and MPU6050 6-axis IMU for candidate fall detection ($F_{\text{cane}}$).
3. **Smart Band (`band`)**: Powered by ESP8266. Features continuous wrist MAX30100 oximeter (HR & $\text{SpO}_2$), BMP180 barometric pressure & altitude sensor, step counter, MPU6050 IMU candidate fall detector ($F_{\text{band}}$), and an interrupt-driven manual SOS button.

Telemetry payloads are authenticated and encrypted at the **firmware level** using **AES-256-GCM** prior to publication over **TLS-secured MQTT**. Payload protection functions independently of TLS, ensuring data remains secure even if the MQTT broker is untrusted or compromised.

---

## 2. Free Cloud & Public MQTT Broker Services

The pipeline defaults to **Mosquitto Public Test Broker** on secure MQTTS TLS port **8883** and supports multiple cloud options:

### 2.1 Supported Broker Options

| Broker Provider | Host URL | Port | Features & Setup |
| :--- | :--- | :--- | :--- |
| **Mosquitto Public Test Broker (Default Secure)** | `test.mosquitto.org` | `8883` (MQTTS TLS) | **Encrypted TLS Transport**. Zero Credentials Required. Instant live testing. |
| **HiveMQ Public Free Broker** | `broker.hivemq.com` | `1883` / `8000` (WS) | Zero Credentials Required. Dev testing. |
| **EMQX Cloud Serverless (Free Tier)** | `emqx.cloud` | `8883` (MQTTS) | Perpetual free tier (up to 1MB/s data & 1M messages). Requires free account at `emqx.com/en/cloud`. |

### 2.2 Backend `.env` Configuration (`server/.env`)
```env
PORT=4000
MOSQUITTO_HOST=test.mosquitto.org
MOSQUITTO_PORT=8883
MOSQUITTO_USERNAME=
MOSQUITTO_PASSWORD=
```

### 2.3 ESP32 / ESP8266 C++ Firmware Snippet for Mosquitto Secure Broker (Port 8883 TLS)
```cpp
#include <WiFi.h>              // Or <ESP8266WiFi.h> for Cane & Band
#include <WiFiClientSecure.h>  // For MQTTS TLS Encryption
#include <PubSubClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Mosquitto Secure Test Broker (TLS Encrypted MQTTS Port)
const char* mqtt_broker = "test.mosquitto.org";
const int mqtt_port = 8883;

WiFiClientSecure espClient;
PubSubClient client(espClient);

void setupMQTT() {
  // Allow insecure/unverified CA certificates for public test broker while enforcing TLS transport encryption
  espClient.setInsecure();
  client.setServer(mqtt_broker, mqtt_port);
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to Mosquitto Secure TLS Broker...");
    if (client.connect("cane_01_node")) {
      Serial.println("Connected to Mosquitto Secure Broker (Port 8883)!");
    } else {
      delay(3000);
    }
  }
}
```

---

## 3. Firmware AES-256-GCM Authenticated Encryption Pipeline

### 3.1 Encryption Envelope (Formula 5 from Paper)
Every MQTT message published by any wearable device wraps its payload in the following structured JSON string:

$$P = \{ \text{dev\_id}, t_{ts}, cnt, \text{nonce}, \text{ciphertext}, \text{tag} \}$$

| Key | Type | Size / Format | Description |
| :--- | :--- | :--- | :--- |
| `dev_id` | `string` | UTF-8 String | Unique device identifier (`specs_01`, `cane_01`, `band_01`) |
| `tts` | `number` | 64-bit Unix Epoch ms | Hardware timestamp at payload assembly |
| `cnt` | `number` | 32-bit Unsigned Int | Monotonic per-device counter for replay protection |
| `nonce` | `string` | 96-bit (12 bytes) Hex | Cryptographically secure random Initialization Vector (IV) |
| `ciphertext` | `string` | Base64 / Hex | AES-256-GCM encrypted payload containing raw sensor JSON |
| `tag` | `string` | 128-bit (16 bytes) Hex | AES-GCM Authentication Tag verifying authenticity & integrity |

### 3.2 Replay Protection & Freshness Validation Rules
Upon receiving a message $P$, the **Bridge Server** executes the following verification sequence before decryption:
1. **Authentication Tag Verification**: Computes AES-256-GCM authentication using key $K$, `nonce`, `ciphertext`, and `tag`. Discard immediately if invalid.
2. **Monotonic Counter Check**: Verifies $cnt > cnt_{\text{last\_seen\_for\_device}}$. Rejects non-monotonic or duplicated counters.
3. **Timestamp Freshness Window**: Checks $|t_{\text{server}} - t_{ts}| \le 10000\text{ ms}$. Rejects stale messages.

---

## 4. Complete MQTT Topic Tree

| Topic Pattern | Direction | QoS | Description |
| :--- | :--- | :--- | :--- |
| `aiot/v1/specs/telemetry` | Device $\rightarrow$ Broker | 0 | Ranging ($d$), Orientation ($\theta$, $\phi$), battery, IMU |
| `aiot/v1/specs/vision` | Device/Edge $\rightarrow$ Broker | 1 | YOLO detections (Objects: person, vehicle, door, stair; Currency: 500 INR, 200 INR) |
| `aiot/v1/cane/telemetry` | Device $\rightarrow$ Broker | 0 | Ranging, IMU ($a_{\text{mag}}$), candidate fall flag ($F_{\text{cane}}$), handle vitals |
| `aiot/v1/band/telemetry` | Device $\rightarrow$ Broker | 0 | IMU ($a_{\text{mag}}$), candidate fall flag ($F_{\text{band}}$), wrist vitals, BMP180 pressure/altitude |
| `aiot/v1/band/sos` | Device $\rightarrow$ Broker | 1 | Manual SOS button trigger or false-alert cancellation |
| `aiot/v1/alerts/fall` | Bridge $\rightarrow$ Apps | 1 | Correlated Fall Alerts (High-Confidence vs Low-Confidence Warning) |
| `aiot/v1/alerts/health` | Bridge $\rightarrow$ Apps | 1 | Vitals anomaly warnings & critical threshold alerts ($\text{HR} > 120$ BPM, $\text{SpO}_2 < 90\%$) |
| `aiot/v1/system/status` | Bridge $\leftrightarrow$ Devices | 1 | Node heartbeat, broker connectivity, WSS connection state |

---

## 5. Decrypted Payload Schemas

### 5.1 Smart Glasses Telemetry (`aiot/v1/specs/telemetry`)
```json
{
  "dev_id": "specs_01",
  "timestamp": 1773132000000,
  "distance_m": 0.85,
  "pitch_deg": 12.4,
  "yaw_deg": -5.2,
  "battery_pct": 88
}
```

### 5.2 Smart Glasses Vision Detections (`aiot/v1/specs/vision`)
```json
{
  "dev_id": "specs_01",
  "timestamp": 1773132000000,
  "detections": [
    {
      "label": "500-rupee note",
      "category": "currency",
      "confidence": 0.96,
      "bbox": [120, 80, 240, 150]
    },
    {
      "label": "person",
      "category": "obstacle",
      "confidence": 0.92,
      "bbox": [300, 40, 150, 400],
      "position": "ahead, left"
    }
  ],
  "audio_announcement": "Five hundred rupees banknote detected ahead"
}
```

### 5.3 Smart Cane Telemetry (`aiot/v1/cane/telemetry`)
```json
{
  "dev_id": "cane_01",
  "timestamp": 1773132000000,
  "distance_m": 0.65,
  "buzzer_active": true,
  "accel": { "x": 0.12, "y": 0.05, "z": 9.81 },
  "amag": 9.81,
  "fall_flag": 0,
  "heart_rate": 74,
  "spo2": 98
}
```

### 5.4 Smart Band Telemetry (`aiot/v1/band/telemetry`)
```json
{
  "dev_id": "band_01",
  "timestamp": 1773132000000,
  "accel": { "x": 0.08, "y": 0.15, "z": 9.78 },
  "amag": 9.79,
  "fall_flag": 0,
  "heart_rate": 72,
  "spo2": 98,
  "pressure_hpa": 1013.25,
  "altitude_m": 120.5,
  "step_count": 1420,
  "sos_flag": 0
}
```

---

## 6. Cross-Device Sensor Fusion Algorithm for Fall Verification (Algorithm 2)

```
Algorithm 2: Cross-Device Fall Verification
--------------------------------------------------------------------------------
Require: Candidate flags F_cane(t_c), F_band(t_b)
1: if F_cane = 1 AND F_band = 1 AND |t_c - t_b| <= 3.0s then
2:     Escalate HIGH-CONFIDENCE FALL ALERT (Critical Audio + Caregiver Push)
3: else if exactly one of F_cane, F_band = 1 then
4:     Issue LOW-CONFIDENCE WARNING
5:     Wait up to T_resp = 30s for SOS confirm/cancel press
6:     if cancelled then
7:         Suppress warning
8:     else
9:         Escalate warning to caregiver
10:    end if
11: end if
```

---

## 7. 3D Spatial Obstacle Mapping Mathematics

Ultrasonic range $d$ from the glasses is combined with IMU pitch $\phi$ and yaw $\theta$ into a 3D coordinate vector $\mathbf{p}$:

$$\mathbf{p} = d \cdot \hat{\mathbf{n}}(\theta, \phi) = d \begin{bmatrix} \cos\phi \cos\theta \\ \cos\phi \sin\theta \\ \sin\phi \end{bmatrix}$$

- Accumulates up to 59 obstacle cells over head scanning sweeps.
- Color codes near-field ($d < 0.8\text{ m}$, red) to long-range ($d \approx 2.0\text{ m}$, blue).
