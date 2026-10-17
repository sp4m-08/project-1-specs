import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { decryptPayload, EncryptedEnvelope, DecryptionResult } from './crypto/aesGcmEngine';
import { MQTT_TOPICS } from './mqtt/topicCatalog';
import { CrossDeviceFallVerifier, FallAlertState } from './fusion/fallVerification';
import { Spatial3DObstacleMapper } from './mapping/spatial3dMapper';
import { AuraAiAssistant } from './chatbot/auraAiAssistant';
import { HardwareSimulator } from './simulator/hardwareSimulator';
import { MosquittoService } from './mqtt/mosquittoClient';

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Core Engine Instances
const fallVerifier = new CrossDeviceFallVerifier();
const spatialMapper = new Spatial3DObstacleMapper();
const aiAssistant = new AuraAiAssistant();
const mosquitto = new MosquittoService();

// Per-device topic reception tracker
const deviceLastSeen: {
  specs: number | null;
  cane: number | null;
  band: number | null;
} = {
  specs: null,
  cane: null,
  band: null,
};

// Latest Telemetry Cache
const latestState: {
  cane?: any;
  band?: any;
  specs?: any;
  specsVision?: any;
  deviceLastSeen: {
    specs: number | null;
    cane: number | null;
    band: number | null;
  };
  activeAlert?: FallAlertState | null;
  securityLogs: DecryptionResult[];
  mosquittoConnected: boolean;
  hiveMqConnected: boolean;
} = {
  deviceLastSeen,
  activeAlert: null,
  securityLogs: [],
  mosquittoConnected: false,
  hiveMqConnected: false,
};

// WebSocket Broadcast Function
function broadcastWss(type: string, data: any) {
  const payload = JSON.stringify({ type, data, timestamp: Date.now() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Fall Alert Event Listener
fallVerifier.onAlert((alertState) => {
  latestState.activeAlert = alertState;
  broadcastWss('FALL_ALERT_UPDATE', alertState);
  broadcastWss('HEALTH_ALERT', {
    level: alertState.confidence === 'HIGH' ? 'CRITICAL' : 'WARNING',
    message: alertState.message,
    timestamp: alertState.timestamp,
  });

  // Publish Alert to Mosquitto MQTT Broker if connected
  if (mosquitto.getIsConnected()) {
    mosquitto.publish(MQTT_TOPICS.ALERTS_FALL, alertState as any, 1);
  }
});

/**
 * Handle Encrypted MQTT Payload Ingestion & Pipeline Validation
 */
function processIncomingEncryptedTopic(topic: string, envelope: EncryptedEnvelope) {
  // Ignore outbound alert topics if received via wildcard/echo
  if (topic === MQTT_TOPICS.ALERTS_FALL || topic === MQTT_TOPICS.ALERTS_HEALTH) {
    return;
  }

  // Validate that payload contains an encrypted envelope before decrypting
  if (!envelope || typeof envelope !== 'object' || !envelope.ciphertext) {
    return;
  }

  // 1. Firmware AES-256-GCM Decryption + Replay + Freshness Check
  const result = decryptPayload(envelope, topic);

  // Maintain security inspection log buffer
  latestState.securityLogs.unshift(result);
  if (latestState.securityLogs.length > 50) latestState.securityLogs.pop();
  broadcastWss('SECURITY_INSPECTION_LOG', result);

  if (!result.success || !result.data) {
    console.error(`[MQTT Decryption Failed] Topic: ${topic} - Error: ${result.error}`);
    return; // Skip corrupted, replayed, or duplicate packets
  }

  const data = result.data;
  const now = Date.now();
  data.lastPublished = envelope.tts || now;
  data.receivedAt = now;

  console.log(`[MQTT Decrypted] Topic: ${topic} | Dev: ${envelope.dev_id} (cnt #${envelope.cnt})`);

  // 2. Route by Topic Pattern
  if (topic === MQTT_TOPICS.SPECS_TELEMETRY) {
    deviceLastSeen.specs = now;
    latestState.specs = data;
    const point = spatialMapper.addReading(data.distance_m || 0.85, data.pitch_deg || 0, data.yaw_deg || 0);
    broadcastWss('SPECS_TELEMETRY_UPDATE', data);
    broadcastWss('SPATIAL_POINT_UPDATE', point);
  } else if (topic === MQTT_TOPICS.SPECS_VISION) {
    deviceLastSeen.specs = now;
    latestState.specsVision = data;
    broadcastWss('SPECS_VISION_UPDATE', data);
  } else if (topic === MQTT_TOPICS.CANE_TELEMETRY) {
    deviceLastSeen.cane = now;
    latestState.cane = data;
    broadcastWss('CANE_TELEMETRY_UPDATE', data);

    if (data.fall_flag === 1 || data.amag > 20) {
      fallVerifier.registerCandidateFall({
        sourceDevice: 'cane',
        timestamp: data.timestamp || Date.now(),
        accelMag: data.amag || 24.8,
      });
    }
  } else if (topic === MQTT_TOPICS.BAND_TELEMETRY) {
    deviceLastSeen.band = now;
    latestState.band = data;
    broadcastWss('BAND_TELEMETRY_UPDATE', data);

    if (data.fall_flag === 1 || data.amag > 20) {
      fallVerifier.registerCandidateFall({
        sourceDevice: 'band',
        timestamp: data.timestamp || Date.now(),
        accelMag: data.amag || 26.5,
      });
    }

    const hr = data.heart_rate;
    const spo2 = data.spo2;
    if (hr < 50 || hr > 120 || spo2 < 90) {
      broadcastWss('HEALTH_ALERT', {
        level: 'CRITICAL',
         message: `Health reading needs attention: heart rate ${hr} BPM and blood oxygen ${spo2}%. Review this snapshot with a caregiver or qualified professional.`,
        timestamp: Date.now(),
      });
    } else if (hr < 60 || hr > 100 || (spo2 >= 90 && spo2 <= 94)) {
      broadcastWss('HEALTH_ALERT', {
        level: 'WARNING',
         message: `Health reading is outside the usual demo range: heart rate ${hr} BPM and blood oxygen ${spo2}%. Review the latest snapshot with a caregiver.`,
        timestamp: Date.now(),
      });
    }
  } else if (topic === MQTT_TOPICS.BAND_SOS) {
    if (data.cancelled || data.cancel) {
      fallVerifier.cancelFallWarning('BAND_SOS_BUTTON');
    } else {
      // Emergency fall event or manual SOS button triggered on the Smart Band
      fallVerifier.registerCandidateFall({
        sourceDevice: 'band',
        timestamp: data.timestamp || Date.now(),
        accelMag: data.amag || 28.5,
      });

      broadcastWss('HEALTH_ALERT', {
        level: 'CRITICAL',
         message: 'SOS signal received from the Smart Band. Follow the configured care plan; no external call or message was placed by this demo.',
        timestamp: Date.now(),
      });
    }
  }
}

// Connect to Mosquitto MQTT Broker
mosquitto.connect((topic, envelope) => {
  processIncomingEncryptedTopic(topic, envelope);
});

// Instantiate Hardware Simulator
const simulator = new HardwareSimulator({
  publishEncrypted: (topic, envelope) => {
    if (mosquitto.getIsConnected()) {
      mosquitto.publish(topic, envelope);
    } else {
      processIncomingEncryptedTopic(topic, envelope);
    }
  },
});

// Only start background simulator loop if ENABLE_SIMULATOR=true in .env
if (process.env.ENABLE_SIMULATOR === 'true') {
  console.log('[Simulator Active] Background simulated telemetry loop ENABLED');
  simulator.start();
} else {
  console.log('[Hardware Telemetry Mode Active] Simulated data loop DISABLED. Waiting for real MQTT topic payloads.');
}

// Express REST Endpoints
app.get('/', (req, res) => {
  res.json({
      name: 'AURA Bridge',
    status: 'ONLINE',
    mqttBroker: mosquitto.getIsConnected() ? 'MQTT_BROKER_ACTIVE' : 'WAITING_FOR_MQTT_BROKER',
    statusEndpoint: '/api/status',
    timestamp: Date.now(),
  });
});

app.get('/api/status', (req, res) => {
  const isConn = mosquitto.getIsConnected();
  latestState.mosquittoConnected = isConn;
  latestState.hiveMqConnected = isConn;
  res.json({
    status: 'ONLINE',
    mqttBroker: isConn ? 'MQTT_BROKER_ACTIVE' : 'WAITING_FOR_MQTT_BROKER',
    simulatorActive: process.env.ENABLE_SIMULATOR === 'true',
    mosquittoConnected: isConn,
    hiveMqConnected: isConn,
    deviceLastSeen,
    activeAlert: latestState.activeAlert,
    latestState,
  });
});

app.get('/api/spatial/map', (req, res) => {
  res.json(spatialMapper.getPointCloud());
});

app.get('/api/security/logs', (req, res) => {
  res.json(latestState.securityLogs);
});

app.post('/api/chatbot/query', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  try {
    const response = await aiAssistant.processQuery(prompt, latestState);
    res.json(response);
  } catch (err: any) {
    console.error('[Chatbot Query Error]:', err);
    res.status(500).json({ error: 'Chatbot processing error', details: err?.message });
  }
});

app.get('/api/chatbot/history', (req, res) => {
  res.json(aiAssistant.getHistory());
});

// Explicit Fall Alert Dismiss Endpoint
app.post('/api/fall/dismiss', (req, res) => {
  const idle = fallVerifier.cancelFallWarning('USER_DASHBOARD');
  latestState.activeAlert = idle;
  broadcastWss('FALL_ALERT_UPDATE', idle);
  res.json({ success: true, activeAlert: idle, message: 'Fall alert dismissed and reset to IDLE' });
});

// Simulator Control API
app.post('/api/simulator/trigger', (req, res) => {
  const { action, value } = req.body;
  switch (action) {
    case 'CANE_FALL':
      simulator.triggerCaneFall();
      break;
    case 'BAND_FALL':
      simulator.triggerBandFall();
      break;
    case 'DUAL_FALL':
      simulator.triggerDualFall();
      break;
    case 'SOS_PRESS':
      simulator.triggerSosPress();
      break;
    case 'SOS_CANCEL':
    case 'CLEAR_FALL':
    case 'DISMISS_FALL': {
      const idle = fallVerifier.cancelFallWarning('USER_DASHBOARD');
      latestState.activeAlert = idle;
      broadcastWss('FALL_ALERT_UPDATE', idle);
      break;
    }
    case 'CURRENCY_500':
      simulator.triggerCurrencyScan('500');
      break;
    case 'CURRENCY_200':
      simulator.triggerCurrencyScan('200');
      break;
    case 'PERSON_SCAN':
      simulator.triggerPersonScan();
      break;
    case 'OBSTACLE_APPROACH':
      simulator.triggerObstacleApproach(value || 0.6);
      break;
    case 'VITALS_SPIKE':
      simulator.triggerVitalsSpike(value?.hr || 128, value?.spo2 || 88);
      break;
    default:
      return res.status(400).json({ error: 'Unknown trigger action' });
  }
  res.json({ success: true, action, message: `Triggered ${action}` });
});

// WebSocket Connection Handler
wss.on('connection', (ws) => {
  console.log('[WebSocket Client Connected]');
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    data: {
      latestState,
      deviceLastSeen,
      spatialMap: spatialMapper.getPointCloud(),
      chatHistory: aiAssistant.getHistory(),
    },
    timestamp: Date.now(),
  }));
});

server.listen(PORT, () => {
  const brokerHost = process.env.MOSQUITTO_HOST || process.env.HIVEMQ_HOST || 'test.mosquitto.org';
  const brokerPort = process.env.MOSQUITTO_PORT || process.env.HIVEMQ_PORT || 8883;
  console.log(`========================================================`);
  console.log(` AURA Bridge Running on Port ${PORT}`);
  console.log(` Wearable telemetry, fall fusion, and assistive safety pipeline ACTIVE`);
  console.log(` WebSocket Telemetry Streamer Ready at ws://localhost:${PORT}`);
  console.log(` Target MQTT Broker Host: ${brokerHost}:${brokerPort} (MQTTS TLS)`);
  console.log(`========================================================`);
});
