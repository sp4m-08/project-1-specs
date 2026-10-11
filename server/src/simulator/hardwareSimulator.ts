import { encryptPayload, EncryptedEnvelope } from '../crypto/aesGcmEngine';
import { MQTT_TOPICS } from '../mqtt/topicCatalog';

export interface HardwareSimCallbacks {
  publishEncrypted: (topic: string, envelope: EncryptedEnvelope) => void;
}

export class HardwareSimulator {
  private callbacks: HardwareSimCallbacks;
  private timer: NodeJS.Timeout | null = null;
  private isSimulating = false;

  // Device States
  private state = {
    caneDist: 0.85,
    specsDist: 0.95,
    pitch: 4.2,
    yaw: -12.5,
    hr: 72,
    spo2: 98,
    pressure: 1013.25,
    altitude: 120.5,
    stepCount: 1420,
    caneFallFlag: 0,
    bandFallFlag: 0,
    sosFlag: 0,
    activeVision: {
      label: '500-rupee note',
      category: 'currency',
      confidence: 0.97,
      audio: 'Five hundred rupees banknote identified ahead',
    },
  };

  constructor(callbacks: HardwareSimCallbacks) {
    this.callbacks = callbacks;
  }

  public start() {
    if (this.isSimulating) return;
    this.isSimulating = true;

    // 1200ms telemetry cycle
    this.timer = setInterval(() => {
      this.stepTelemetry();
    }, 1200);
  }

  public stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.isSimulating = false;
  }

  private stepTelemetry() {
    const now = Date.now();

    // Small ambient jitter
    const hrJitter = Math.floor(Math.random() * 3) - 1;
    const currentHr = Math.max(55, Math.min(130, this.state.hr + hrJitter));
    const yawJitter = (Math.random() * 4 - 2);
    this.state.yaw = (this.state.yaw + yawJitter) % 360;

    // 1. Smart Glasses Telemetry
    const specsData = {
      dev_id: 'specs_01',
      timestamp: now,
      distance_m: Number(this.state.specsDist.toFixed(2)),
      pitch_deg: Number(this.state.pitch.toFixed(1)),
      yaw_deg: Number(this.state.yaw.toFixed(1)),
      battery_pct: 92,
    };
    const specsEnc = encryptPayload(specsData, 'specs_01');
    this.callbacks.publishEncrypted(MQTT_TOPICS.SPECS_TELEMETRY, specsEnc);

    // Smart Glasses Vision Payload
    const visionData = {
      dev_id: 'specs_01',
      timestamp: now + 5,
      detections: [
        {
          label: this.state.activeVision.label,
          category: this.state.activeVision.category,
          confidence: this.state.activeVision.confidence,
          bbox: [140, 90, 220, 160],
          position: 'ahead',
        },
      ],
      audio_announcement: this.state.activeVision.audio,
    };
    const visionEnc = encryptPayload(visionData, 'specs_01');
    this.callbacks.publishEncrypted(MQTT_TOPICS.SPECS_VISION, visionEnc);

    // 2. Smart Cane Telemetry
    const caneAccelMag = this.state.caneFallFlag === 1 ? 24.8 : 9.81 + (Math.random() * 0.4 - 0.2);
    const caneData = {
      dev_id: 'cane_01',
      timestamp: now + 10,
      distance_m: Number(this.state.caneDist.toFixed(2)),
      buzzer_active: this.state.caneDist < 0.8,
      accel: { x: 0.1, y: 0.2, z: Number(caneAccelMag.toFixed(2)) },
      amag: Number(caneAccelMag.toFixed(2)),
      fall_flag: this.state.caneFallFlag,
      heart_rate: currentHr,
      spo2: this.state.spo2,
    };
    const caneEnc = encryptPayload(caneData, 'cane_01');
    this.callbacks.publishEncrypted(MQTT_TOPICS.CANE_TELEMETRY, caneEnc);

    // 3. Smart Band Telemetry
    const bandAccelMag = this.state.bandFallFlag === 1 ? 26.5 : 9.79 + (Math.random() * 0.4 - 0.2);
    if (Math.random() > 0.7) this.state.stepCount += 1;

    const bandData = {
      dev_id: 'band_01',
      timestamp: now + 15,
      accel: { x: 0.12, y: 0.18, z: Number(bandAccelMag.toFixed(2)) },
      amag: Number(bandAccelMag.toFixed(2)),
      fall_flag: this.state.bandFallFlag,
      heart_rate: currentHr,
      spo2: this.state.spo2,
      pressure_hpa: 1013.25,
      altitude_m: 120.5,
      step_count: this.state.stepCount,
      sos_flag: this.state.sosFlag,
    };
    const bandEnc = encryptPayload(bandData, 'band_01');
    this.callbacks.publishEncrypted(MQTT_TOPICS.BAND_TELEMETRY, bandEnc);

    // Reset single-frame fall flags after emit
    this.state.caneFallFlag = 0;
    this.state.bandFallFlag = 0;
    this.state.sosFlag = 0;
  }

  // Simulator Trigger Actions
  public triggerCaneFall() {
    this.state.caneFallFlag = 1;
    this.stepTelemetry();
  }

  public triggerBandFall() {
    this.state.bandFallFlag = 1;
    this.stepTelemetry();
  }

  public triggerDualFall() {
    this.state.caneFallFlag = 1;
    this.state.bandFallFlag = 1;
    this.stepTelemetry();
  }

  public triggerSosPress() {
    this.state.sosFlag = 1;
    const sosPayload = {
      dev_id: 'band_01',
      timestamp: Date.now(),
      sos_event: 'PUSH_BUTTON_PRESSED',
    };
    const sosEnc = encryptPayload(sosPayload, 'band_01');
    this.callbacks.publishEncrypted(MQTT_TOPICS.BAND_SOS, sosEnc);
  }

  public triggerCurrencyScan(denomination: '500' | '200') {
    if (denomination === '500') {
      this.state.activeVision = {
        label: '500-rupee note',
        category: 'currency',
        confidence: 0.98,
        audio: 'Five hundred rupees banknote identified ahead',
      };
    } else {
      this.state.activeVision = {
        label: '200-rupee note',
        category: 'currency',
        confidence: 0.95,
        audio: 'Two hundred rupees banknote identified ahead',
      };
    }
    this.stepTelemetry();
  }

  public triggerPersonScan() {
    this.state.activeVision = {
      label: 'person',
      category: 'obstacle',
      confidence: 0.94,
      audio: 'Person identified in wearer path ahead, left',
    };
    this.stepTelemetry();
  }

  public triggerObstacleApproach(distMeters: number) {
    this.state.specsDist = distMeters;
    this.state.caneDist = distMeters;
    this.stepTelemetry();
  }

  public triggerVitalsSpike(hr: number, spo2: number) {
    this.state.hr = hr;
    this.state.spo2 = spo2;
    this.stepTelemetry();
  }
}
