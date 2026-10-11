import mqtt, { MqttClient } from 'mqtt';
import { MQTT_TOPICS, TOPIC_QOS } from './topicCatalog';
import { EncryptedEnvelope } from '../crypto/aesGcmEngine';

export interface MqttBrokerConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  useTls?: boolean;
}

export class HiveMqService {
  private client: MqttClient | null = null;
  private onMessageCallback?: (topic: string, envelope: EncryptedEnvelope) => void;
  private isConnected = false;

  constructor(private config?: MqttBrokerConfig) {}

  public connect(onMessage: (topic: string, envelope: EncryptedEnvelope) => void) {
    this.onMessageCallback = onMessage;

    // Default to HiveMQ Public Broker if HIVEMQ_HOST is set to default or broker.hivemq.com
    let host = this.config?.host || process.env.HIVEMQ_HOST || process.env.MQTT_HOST || 'broker.hivemq.com';
    let port = Number(this.config?.port || process.env.HIVEMQ_PORT || process.env.MQTT_PORT || 1883);
    const username = this.config?.username || process.env.HIVEMQ_USERNAME || process.env.MQTT_USERNAME;
    const password = this.config?.password || process.env.HIVEMQ_PASSWORD || process.env.MQTT_PASSWORD;

    const isPublicBroker = host === 'broker.hivemq.com' || host === 'test.mosquitto.org';
    const isTls = port === 8883 || host.startsWith('mqtts://') || host.startsWith('ssl://');

    let protocol = isTls ? 'mqtts' : 'mqtt';
    let cleanHost = host.replace(/^mqtts?:\/\//, '').replace(/^ssl:\/\//, '');

    const brokerUrl = `${protocol}://${cleanHost}:${port}`;

    console.log(`[MQTT Broker Connecting] Connecting to ${isPublicBroker ? 'Public Free Broker' : 'Broker'}: ${brokerUrl}...`);

    const connectionOptions: mqtt.IClientOptions = {
      port,
      protocol: protocol as any,
      reconnectPeriod: 3000,
      connectTimeout: 10000,
    };

    if (isTls) {
      connectionOptions.rejectUnauthorized = !isPublicBroker; // allow self-signed for public test
    }

    if (username && password) {
      connectionOptions.username = username;
      connectionOptions.password = password;
    }

    this.client = mqtt.connect(brokerUrl, connectionOptions);

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log(`========================================================`);
      console.log(` [MQTT Broker Connected] Active Host: ${brokerUrl}`);
      console.log(` Payload Security: AES-256-GCM Firmware Encryption Active`);
      console.log(`========================================================`);

      // Subscribe to all Wearable Encrypted Telemetry & Alert Topics
      const subscribeTopics = [
        MQTT_TOPICS.SPECS_TELEMETRY,
        MQTT_TOPICS.SPECS_VISION,
        MQTT_TOPICS.CANE_TELEMETRY,
        MQTT_TOPICS.BAND_TELEMETRY,
        MQTT_TOPICS.BAND_SOS,
        MQTT_TOPICS.ALERTS_FALL,
        MQTT_TOPICS.ALERTS_HEALTH,
      ];

      subscribeTopics.forEach((topic) => {
        const qos = TOPIC_QOS[topic as keyof typeof TOPIC_QOS] || 0;
        this.client?.subscribe(topic, { qos }, (err) => {
          if (err) console.error(`[MQTT Subscribe Error] Topic: ${topic}`, err);
          else console.log(`[MQTT Subscribed] Topic: ${topic} (QoS ${qos})`);
        });
      });
    });

    this.client.on('message', (topic, payload) => {
      try {
        const envelope: EncryptedEnvelope = JSON.parse(payload.toString());
        if (this.onMessageCallback) {
          this.onMessageCallback(topic, envelope);
        }
      } catch (err) {
        // Silently skip non-JSON or other public test messages
      }
    });

    this.client.on('error', (err) => {
      console.error('[MQTT Connection Error]', err.message);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      console.log('[MQTT Broker Connection Closed]');
    });
  }

  public publish(topic: string, envelope: EncryptedEnvelope, qos: 0 | 1 = 0) {
    if (this.client && this.isConnected) {
      const payloadString = JSON.stringify(envelope);
      this.client.publish(topic, payloadString, { qos, retain: false }, (err) => {
        if (err) console.error(`[MQTT Publish Error] Topic ${topic}`, err);
      });
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}
