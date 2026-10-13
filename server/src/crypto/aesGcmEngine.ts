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
export function decryptPayload<T = any>(envelope: EncryptedEnvelope, topic?: string): DecryptionResult<T> {
  const startTime = Date.now();

  // Validate envelope structure
  if (!envelope || typeof envelope !== 'object') {
    return {
      success: false,
      dev_id: 'unknown',
      cnt: 0,
      tts: Date.now(),
      error: 'INVALID_PAYLOAD: Payload is not an object',
    };
  }

  const { dev_id, tts, cnt, nonce, ciphertext, tag } = envelope;

  if (!dev_id || !nonce || !tag || !ciphertext) {
    return {
      success: false,
      dev_id: dev_id || 'unknown',
      cnt: cnt || 0,
      tts: tts || Date.now(),
      error: `MALFORMED_ENVELOPE: Missing required encryption fields (nonce, tag, or ciphertext)`,
    };
  }

  // 1. Replay Protection Verification:
  // Key by dev_id + topic when topic is available so independent topic streams
  // (e.g. telemetry vs emergency SOS) from the same device do not cause false replay rejections
  const trackingKey = topic ? `${dev_id}:${topic}` : dev_id;
  const lastVerifiedCnt = serverSideLastSeenCounters.get(trackingKey) || 0;

  // Detect device restart (e.g., ESP8266 rebooted and restarted monotonic counter from 1)
  if (cnt < lastVerifiedCnt && cnt < 10 && lastVerifiedCnt > 20) {
    console.log(`[Device Reboot Detected] Resetting monotonic counter for ${trackingKey} (was ${lastVerifiedCnt}, now ${cnt})`);
    serverSideLastSeenCounters.delete(trackingKey);
  } else if (cnt <= lastVerifiedCnt && lastVerifiedCnt > 0) {
    return {
      success: false,
      dev_id,
      cnt,
      tts,
      error: `REPLAY_ATTACK_REJECTED: Monotonic counter ${cnt} <= last verified ${lastVerifiedCnt} for device ${trackingKey}`,
    };
  }

  // 2. Timestamp Freshness Verification (10s window for Unix epoch timestamps)
  const freshnessWindowMs = 15000;
  const isEpochTimestamp = tts > 100000000000; // Valid Epoch ms (> Year 1973)
  if (isEpochTimestamp && Math.abs(startTime - tts) > freshnessWindowMs) {
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

    // Auto-detect Hex vs Base64 ciphertext encoding
    const isHex = /^[0-9a-fA-F]+$/.test(ciphertext) && ciphertext.length % 2 === 0;
    const encoding: BufferEncoding = isHex ? 'hex' : 'base64';

    let decrypted = decipher.update(ciphertext, encoding, 'utf8');
    decrypted += decipher.final('utf8');

    const data = JSON.parse(decrypted) as T;

    // Update verified server-side counter for this device/topic stream
    serverSideLastSeenCounters.set(trackingKey, cnt);

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
