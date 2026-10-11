import crypto from 'crypto';

export interface EncryptedEnvelope {
  dev_id: string;
  tts: number;
  cnt: number;
  nonce: string;       // 96-bit (12 bytes) Hex
  ciphertext: string;  // Base64
  tag: string;        // 128-bit (16 bytes) Hex
}

export interface DecryptionResult<T = any> {
  success: boolean;
  dev_id: string;
  cnt: number;
  tts: number;
  data?: T;
  error?: string;
  latencyMs?: number;
}

// Master 256-bit key for firmware AES-GCM
const MASTER_KEY_HEX = 'a1b2c3d4e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdef';
const SECRET_KEY = Buffer.from(MASTER_KEY_HEX, 'hex');

// Separate counter stores for device side (firmware emitter) and server side (bridge receiver)
const deviceSideCounters: Map<string, number> = new Map();
const serverSideLastSeenCounters: Map<string, number> = new Map();

/**
 * Firmware-level AES-256-GCM Encryptor (Runs on ESP32 / ESP8266 hardware nodes)
 */
export function encryptPayload(payloadData: object, dev_id: string, customCnt?: number): EncryptedEnvelope {
  const tts = Date.now();
  const nextCnt = customCnt !== undefined ? customCnt : (deviceSideCounters.get(dev_id) || 0) + 1;
  deviceSideCounters.set(dev_id, nextCnt);

  // 96-bit cryptographic nonce
  const nonceBuf = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, nonceBuf);

  const payloadString = JSON.stringify(payloadData);
  let encrypted = cipher.update(payloadString, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const tagBuf = cipher.getAuthTag();

  return {
    dev_id,
    tts,
    cnt: nextCnt,
    nonce: nonceBuf.toString('hex'),
    ciphertext: encrypted,
    tag: tagBuf.toString('hex'),
  };
}

/**
 * Firmware-level AES-256-GCM Decryptor (Runs on Bridge Server)
 * Enforces Replay Protection & Timestamp Freshness Check
 */
export function decryptPayload<T = any>(envelope: EncryptedEnvelope): DecryptionResult<T> {
  const startTime = Date.now();
  const { dev_id, tts, cnt, nonce, ciphertext, tag } = envelope;

  // 1. Replay Protection Verification: Ensure incoming counter > last verified counter
  const lastVerifiedCnt = serverSideLastSeenCounters.get(dev_id) || 0;
  if (cnt <= lastVerifiedCnt && lastVerifiedCnt > 0) {
    return {
      success: false,
      dev_id,
      cnt,
      tts,
      error: `REPLAY_ATTACK_REJECTED: Monotonic counter ${cnt} <= last verified ${lastVerifiedCnt} for device ${dev_id}`,
    };
  }

  // 2. Timestamp Freshness Verification (10s window)
  const freshnessWindowMs = 10000;
  if (Math.abs(startTime - tts) > freshnessWindowMs) {
    return {
      success: false,
      dev_id,
      cnt,
      tts,
      error: `STALE_TIMESTAMP: Message timestamp ${tts} outside freshness window of ${freshnessWindowMs}ms`,
    };
  }

  try {
    const nonceBuf = Buffer.from(nonce, 'hex');
    const tagBuf = Buffer.from(tag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, nonceBuf);
    decipher.setAuthTag(tagBuf);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    const data = JSON.parse(decrypted) as T;

    // Update verified server-side counter
    serverSideLastSeenCounters.set(dev_id, cnt);

    return {
      success: true,
      dev_id,
      cnt,
      tts,
      data,
      latencyMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      dev_id,
      cnt,
      tts,
      error: `AUTHENTICATION_FAILURE: AES-GCM tag verification failed or corrupted payload (${err.message})`,
    };
  }
}

export function resetCounters(dev_id?: string) {
  if (dev_id) {
    deviceSideCounters.delete(dev_id);
    serverSideLastSeenCounters.delete(dev_id);
  } else {
    deviceSideCounters.clear();
    serverSideLastSeenCounters.clear();
  }
}
