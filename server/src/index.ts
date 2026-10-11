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
import { HiveMqService } from './mqtt/hiveMqClient';

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Core Engine Instances
const fallVerifier = new CrossDeviceFallVerifier();
const spatialMapper = new Spatial3DObstacleMapper();
const aiAssistant = new AuraAiAssistant();
const hiveMq = new HiveMqService();

// Latest Telemetry Cache
const latestState: {
  cane?: any;
  band?: any;
  specs?: any;
  specsVision?: any;
  activeAlert?: FallAlertState | null;
  securityLogs: DecryptionResult[];
  hiveMqConnected: boolean;
} = {
  activeAlert: null,
  securityLogs: [],
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

  // Publish Alert to HiveMQ / MQTT Broker if connected
  if (hiveMq.getIsConnected()) {
    hiveMq.publish(MQTT_TOPICS.ALERTS_FALL, alertState as any, 1);
  }
});

/**
 * Handle Encrypted MQTT Payload Ingestion & Pipeline Validation
 */
function processIncomingEncryptedTopic(topic: string, envelope: EncryptedEnvelope) {
  // 1. Firmware AES-256-GCM Decryption + Replay + Freshness Check
  const result = decryptPayload(envelope);

  // Maintain security inspection log buffer
  latestState.securityLogs.unshift(result);
  if (latestState.securityLogs.length > 50) latestState.securityLogs.pop();
  broadcastWss('SECURITY_INSPECTION_LOG', result);

  if (!result.success || !result.data) {
    return; // Skip corrupted, replayed, or duplicate packets
  }

  const data = result.data;

  // 2. Route by Topic Pattern
  if (topic === MQTT_TOPICS.SPECS_TELEMETRY) {
    latestState.specs = data;
    const point = spatialMapper.addReading(data.distance_m || 0.85, data.pitch_deg || 0, data.yaw_deg || 0);
    broadcastWss('SPECS_TELEMETRY_UPDATE', data);
    broadcastWss('SPATIAL_POINT_UPDATE', point);
  } else if (topic === MQTT_TOPICS.SPECS_VISION) {
    latestState.specsVision = data;
    broadcastWss('SPECS_VISION_UPDATE', data);
  } else if (topic === MQTT_TOPICS.CANE_TELEMETRY) {
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
        message: `CRITICAL VITALS ANOMALY: HR ${hr} BPM, SpO2 ${spo2}%. Immediate caregiver attention required!`,
        timestamp: Date.now(),
      });
    } else if (hr < 60 || hr > 100 || (spo2 >= 90 && spo2 <= 94)) {
      broadcastWss('HEALTH_ALERT', {
        level: 'WARNING',
        message: `VITALS WARNING: HR ${hr} BPM, SpO2 ${spo2}%. Pushed notification to caregiver.`,
        timestamp: Date.now(),
      });
    }
  } else if (topic === MQTT_TOPICS.BAND_SOS) {
    if (latestState.activeAlert && latestState.activeAlert.status === 'LOW_CONFIDENCE_WARNING') {
      fallVerifier.cancelFallWarning('BAND_SOS_BUTTON');
    } else {
      broadcastWss('HEALTH_ALERT', {
        level: 'CRITICAL',
        message: 'EMERGENCY: User pressed manual SOS button on Smart Band!',
        timestamp: Date.now(),
      });
    }
  }
}

// Connect to MQTT Broker
hiveMq.connect((topic, envelope) => {
  processIncomingEncryptedTopic(topic, envelope);
});

// Instantiate Hardware Simulator
const simulator = new HardwareSimulator({
  publishEncrypted: (topic, envelope) => {
    if (hiveMq.getIsConnected()) {
      hiveMq.publish(topic, envelope);
    } else {
      processIncomingEncryptedTopic(topic, envelope);
    }
  },
});
simulator.start();

// Express REST Endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    mqttBroker: hiveMq.getIsConnected() ? 'MQTT_BROKER_ACTIVE' : 'LOCAL_SIMULATOR_ACTIVE',
    hiveMqConnected: hiveMq.getIsConnected(),
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

app.post('/api/chatbot/query', (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  const response = aiAssistant.processQuery(prompt, latestState);
  res.json(response);
});

app.get('/api/chatbot/history', (req, res) => {
  res.json(aiAssistant.getHistory());
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
      fallVerifier.cancelFallWarning('SIMULATOR_DASHBOARD');
      break;
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
      spatialMap: spatialMapper.getPointCloud(),
      chatHistory: aiAssistant.getHistory(),
    },
    timestamp: Date.now(),
  }));
});

server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(` AIoT Assistive Pipeline Server Running on Port ${PORT}`);
  console.log(` Encrypted MQTT Topics & Algorithm 2 Fall Fusion ACTIVE`);
  console.log(` WebSocket Telemetry Streamer Ready at ws://localhost:${PORT}`);
  console.log(` Target MQTT Broker Host: ${process.env.HIVEMQ_HOST || 'broker.hivemq.com'}:${process.env.HIVEMQ_PORT || 1883}`);
  console.log(`========================================================`);
});
