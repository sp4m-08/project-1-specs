export interface EncryptedEnvelope {
  dev_id: string;
  tts: number;
  cnt: number;
  nonce: string;
  ciphertext: string;
  tag: string;
}

export interface DecryptionLog {
  success: boolean;
  dev_id: string;
  cnt: number;
  tts: number;
  data?: any;
  error?: string;
  latencyMs?: number;
}

export interface DeviceLastSeen {
  specs: number | null;
  cane: number | null;
  band: number | null;
}

export type UserRole = 'wearer' | 'caregiver';

export interface SafetyAlert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  source: 'fall' | 'health' | 'system';
  acknowledged?: boolean;
}

export interface SpecsTelemetry {
  dev_id: string;
  timestamp: number;
  distance_m: number;
  pitch_deg: number;
  yaw_deg: number;
  battery_pct: number;
  lastPublished?: number;
  receivedAt?: number;
}

export interface SpecsVision {
  dev_id: string;
  timestamp: number;
  detections: Array<{
    label: string;
    category: string;
    confidence: number;
    bbox: number[];
    position?: string;
  }>;
  audio_announcement: string;
  lastPublished?: number;
  receivedAt?: number;
}

export interface CaneTelemetry {
  dev_id: string;
  timestamp: number;
  distance_m: number;
  buzzer_active: boolean;
  accel: { x: number; y: number; z: number };
  amag: number;
  fall_flag: number;
  heart_rate: number;
  spo2: number;
  lastPublished?: number;
  receivedAt?: number;
}

export interface BandTelemetry {
  dev_id: string;
  timestamp: number;
  accel: { x: number; y: number; z: number };
  amag: number;
  fall_flag: number;
  heart_rate: number;
  spo2: number;
  pressure_hpa: number;
  altitude_m: number;
  step_count: number;
  sos_flag: number;
  lastPublished?: number;
  receivedAt?: number;
}

export interface FallAlertState {
  id: string;
  status: 'IDLE' | 'HIGH_CONFIDENCE_ALERT' | 'LOW_CONFIDENCE_WARNING' | 'CANCELLED_BY_USER' | 'ESCALATED_TO_CAREGIVER';
  confidence: 'HIGH' | 'LOW' | 'NONE';
  caneEvent?: any;
  bandEvent?: any;
  timeDiffMs?: number;
  sosWindowRemainingSec?: number;
  message: string;
  timestamp: number;
}

export interface ObstacleCell3D {
  id: string;
  x: number;
  y: number;
  z: number;
  distanceMm: number;
  pitchDeg: number;
  yawDeg: number;
  isAlertRange: boolean;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  modelUsed?: string;
  dataCard?: {
    title: string;
    type: 'hr_trend' | 'safety_summary' | 'obstacle_summary' | 'fall_log';
    averageHr?: number;
    hrTrend1h?: { time: string; value: number }[];
    currentVitals?: { hr: number; spo2: number };
    correlatedEvent?: string;
  };
}
