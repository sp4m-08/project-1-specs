/**
 * MQTT Topic Hierarchy & Quality of Service (QoS) Catalog
 * Established according to section III.A, E, F of the paper.
 */

export const MQTT_TOPICS = {
  // Device Publishing Topics (Encrypted AES-GCM Telemetry)
  SPECS_TELEMETRY: 'aiot/v1/specs/telemetry',
  SPECS_VISION: 'aiot/v1/specs/vision',
  CANE_TELEMETRY: 'aiot/v1/cane/telemetry',
  BAND_TELEMETRY: 'aiot/v1/band/telemetry',
  BAND_SOS: 'aiot/v1/band/sos',

  // Server Broadcast / Alert Topics
  ALERTS_FALL: 'aiot/v1/alerts/fall',
  ALERTS_HEALTH: 'aiot/v1/alerts/health',
  SYSTEM_STATUS: 'aiot/v1/system/status',
  SPATIAL_MAP: 'aiot/v1/spatial/map',
} as const;

export const TOPIC_QOS = {
  [MQTT_TOPICS.SPECS_TELEMETRY]: 0,
  [MQTT_TOPICS.SPECS_VISION]: 1,
  [MQTT_TOPICS.CANE_TELEMETRY]: 0,
  [MQTT_TOPICS.BAND_TELEMETRY]: 0,
  [MQTT_TOPICS.BAND_SOS]: 1,
  [MQTT_TOPICS.ALERTS_FALL]: 1,
  [MQTT_TOPICS.ALERTS_HEALTH]: 1,
  [MQTT_TOPICS.SYSTEM_STATUS]: 1,
  [MQTT_TOPICS.SPATIAL_MAP]: 0,
};
