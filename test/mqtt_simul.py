import json
import time
import random
import os
import paho.mqtt.client as mqtt
from Crypto.Cipher import AES

# ==============================================================================
# CONFIGURATION
# ==============================================================================
BROKER_HOST = "localhost"  # Change to your laptop's IP if running on phone/another PC
BROKER_PORT = 1883

# 256-bit AES Symmetric Secret Key (Matches server/src/crypto/aesGcmEngine.ts)
AES_KEY = bytes([
    0x01,0x23,0x45,0x67,0x89,0xab,0xcd,0xef,
    0xfe,0xdc,0xba,0x98,0x76,0x54,0x32,0x10,
    0x00,0x11,0x22,0x33,0x44,0x55,0x66,0x77,
    0x88,0x99,0xaa,0xbb,0xcc,0xdd,0xee,0xff
])

# Counters for Monotonic Replay Protection
msg_counters = {
    "specs_01": 1,
    "cane_01": 1,
    "band_01": 1
}

# MQTT Topics
TOPICS = {
    "SPECS_TELEMETRY": "aiot/v1/specs/telemetry",
    "SPECS_VISION":    "aiot/v1/specs/vision",
    "CANE_TELEMETRY":  "aiot/v1/cane/telemetry",
    "BAND_TELEMETRY":  "aiot/v1/band/telemetry",
    "BAND_SOS":        "aiot/v1/band/sos",
}

# ==============================================================================
# AES-256-GCM ENCRYPTION HELPER
# ==============================================================================
def encrypt_payload(dev_id: str, raw_payload_dict: dict) -> str:
    """Encrypts raw JSON payload using AES-256-GCM and wraps in envelope"""
    global msg_counters
    
    # Convert raw payload dict to JSON string
    raw_json = json.dumps(raw_payload_dict).encode('utf-8')
    
    # Generate random 96-bit (12-byte) IV / Nonce
    nonce = os.urandom(12)
    
    # Perform AES-256-GCM Encryption
    cipher = AES.new(AES_KEY, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(raw_json)
    
    # Increment counter for device
    cnt = msg_counters[dev_id]
    msg_counters[dev_id] += 1
    
    # Format Envelope JSON
    envelope = {
        "dev_id": dev_id,
        "tts": int(time.time() * 1000),
        "cnt": cnt,
        "nonce": nonce.hex(),
        "ciphertext": ciphertext.hex(),
        "tag": tag.hex()
    }
    
    return json.dumps(envelope)

# ==============================================================================
# MQTT PUBLISHER FUNCTIONS
# ==============================================================================
def publish_specs_telemetry(client, distance=0.85, pitch=4.2, yaw=-12.5):
    payload = {
        "distance_m": distance,
        "pitch_deg": pitch,
        "yaw_deg": yaw,
        "battery_pct": 88
    }
    encrypted_envelope = encrypt_payload("specs_01", payload)
    client.publish(TOPICS["SPECS_TELEMETRY"], encrypted_envelope, qos=0)
    print(f" Glasses -> Published Telemetry (Sonar: {distance}m, Pitch: {pitch}°, Yaw: {yaw}°)")

def publish_specs_vision(client, label="500-rupee note", category="currency", confidence=0.96):
    payload = {
        "dev_id": "specs_01",
        "timestamp": int(time.time() * 1000),
        "detections": [
            {
                "label": label,
                "category": category,
                "confidence": confidence,
                "bbox": [120, 80, 240, 150]
            }
        ],
        "audio_announcement": f"{label} detected ahead"
    }
    encrypted_envelope = encrypt_payload("specs_01", payload)
    client.publish(TOPICS["SPECS_VISION"], encrypted_envelope, qos=1)
    print(f" Glasses -> Published YOLO Detection ({label}, {confidence*100:.0f}% conf)")

def publish_cane_telemetry(client, distance=0.75, amag=9.81, fall_flag=0, hr=74, spo2=98):
    payload = {
        "dev_id": "cane_01",
        "timestamp": int(time.time() * 1000),
        "distance_m": distance,
        "buzzer_active": distance < 0.80,
        "accel": {"x": 0.12, "y": 0.05, "z": amag},
        "amag": amag,
        "fall_flag": fall_flag,
        "heart_rate": hr,
        "spo2": spo2
    }
    encrypted_envelope = encrypt_payload("cane_01", payload)
    client.publish(TOPICS["CANE_TELEMETRY"], encrypted_envelope, qos=0)
    print(f" Cane -> Published Telemetry (Sonar: {distance}m, amag: {amag}m/s², FallFlag: {fall_flag})")

def publish_band_telemetry(client, amag=9.79, fall_flag=0, hr=72, spo2=98):
    payload = {
        "dev_id": "band_01",
        "timestamp": int(time.time() * 1000),
        "accel": {"x": 0.08, "y": 0.15, "z": amag},
        "amag": amag,
        "fall_flag": fall_flag,
        "heart_rate": hr,
        "spo2": spo2,
        "pressure_hpa": 1013.25,
        "altitude_m": 120.5,
        "step_count": 1420,
        "sos_flag": 0
    }
    encrypted_envelope = encrypt_payload("band_01", payload)
    client.publish(TOPICS["BAND_TELEMETRY"], encrypted_envelope, qos=0)
    print(f" Band -> Published Telemetry (HR: {hr} BPM, SpO2: {spo2}%, amag: {amag}m/s², FallFlag: {fall_flag})")

def publish_band_sos(client):
    payload = {
        "sos_event": True,
        "timestamp": int(time.time() * 1000)
    }
    encrypted_envelope = encrypt_payload("band_01", payload)
    client.publish(TOPICS["BAND_SOS"], encrypted_envelope, qos=1)
    print(" BAND -> EMERGENCY SOS BUTTON PRESSED! Published to aiot/v1/band/sos")

# ==============================================================================
# MAIN INTERACTIVE CLI
# ==============================================================================
def main():
    print("================================================================")
    print(" AIoT Wearables Hardware Test Publisher (Python AES-256-GCM)")
    print("================================================================")
    
    # Connect to Mosquitto MQTT Broker
    client = mqtt.Client(client_id="python_hardware_tester")
    try:
        client.connect(BROKER_HOST, BROKER_PORT, 60)
        client.loop_start()
        print(f" Connected to Mosquitto Broker at {BROKER_HOST}:{BROKER_PORT}\n")
    except Exception as e:
        print(f" Connection Failed: {e}")
        print(" Make sure Mosquitto Docker container is running on localhost:1883!")
        return

    while True:
        print("\n--- SELECT TEST SCENARIO TO EMIT ---")
        print("1. [Continuous Stream] Normal Gait & Ambient Telemetry (All 3 Devices)")
        print("2. [Near Obstacle] Emit Obstacle Proximity (< 0.5m)")
        print("3. [Candidate Fall] Cane Impact Only (Single-Device Fall Flag)")
        print("4. [Candidate Fall] Band Impact Only (Single-Device Fall Flag)")
        print("5. [Algorithm 2 Dual Fall] Simultaneous Cane & Band Fall Impact!")
        print("6. [Emergency SOS] Manual SOS Button Press on Smart Band")
        print("7. [YOLO Detection] Currency Scan (500-Rupee Note)")
        print("8. [Vitals Spike] Anomaly Alert (HR 128 BPM, SpO2 88%)")
        print("Q. Quit")
        
        choice = input("Enter option (1-8 or Q): ").strip().upper()
        
        if choice == "1":
            print("\nStreaming continuous telemetry (Press Ctrl+C to stop)...\n")
            try:
                while True:
                    publish_specs_telemetry(client, distance=round(random.uniform(0.7, 1.5), 2))
                    time.sleep(0.3)
                    publish_cane_telemetry(client, distance=round(random.uniform(0.6, 1.2), 2), hr=random.randint(70, 78))
                    time.sleep(0.3)
                    publish_band_telemetry(client, hr=random.randint(68, 76), spo2=random.randint(97, 99))
                    time.sleep(0.8)
            except KeyboardInterrupt:
                print("\nStopped continuous stream.")

        elif choice == "2":
            publish_specs_telemetry(client, distance=0.35, pitch=2.1, yaw=5.0)
            publish_cane_telemetry(client, distance=0.30, amag=10.2)

        elif choice == "3":
            print("\nSimulating Smart Cane Candidate Fall ($F_cane = 1)...")
            publish_cane_telemetry(client, amag=25.8, fall_flag=1)

        elif choice == "4":
            print("\nSimulating Smart Band Candidate Fall ($F_band = 1)...")
            publish_band_telemetry(client, amag=26.4, fall_flag=1)

        elif choice == "5":
            print("\nSimulating Algorithm 2 DUAL FALL AGREEMENT ($F_cane=1 AND $F_band=1)...")
            publish_cane_telemetry(client, amag=28.1, fall_flag=1)
            time.sleep(0.2)
            publish_band_telemetry(client, amag=27.5, fall_flag=1)

        elif choice == "6":
            publish_band_sos(client)

        elif choice == "7":
            publish_specs_vision(client, label="500-rupee note", category="currency", confidence=0.98)

        elif choice == "8":
            print("\nSimulating Critical Vitals Anomaly...")
            publish_band_telemetry(client, hr=128, spo2=88)

        elif choice == "Q":
            print("Exiting test script.")
            break
        else:
            print("Invalid option. Please try again.")

    client.loop_stop()
    client.disconnect()

if __name__ == "__main__":
    main()