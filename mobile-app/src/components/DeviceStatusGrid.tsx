import React, { useState, useEffect } from 'react';
import { Eye, Navigation, Activity, Radio, Clock, AlertCircle } from 'lucide-react';
import { SpecsTelemetry, SpecsVision, CaneTelemetry, BandTelemetry, DeviceLastSeen } from '../types/telemetry';

interface DeviceStatusGridProps {
  specs?: SpecsTelemetry;
  specsVision?: SpecsVision;
  cane?: CaneTelemetry;
  band?: BandTelemetry;
  deviceLastSeen?: DeviceLastSeen;
}

/**
 * DeviceStatusGrid — Connected Devices Row (3 Tiles on #0e1a19 background, 60px radius)
 * Evaluates live presence per device topic stream:
 * - Online only if real MQTT decrypted topic packets arrived within the last 7 seconds
 * - Shows dynamic node count (e.g. "1 / 3 Nodes Online" when only band is sending data)
 * - Displays exact "Last Published" timestamp & elapsed time on every device card
 */
export const DeviceStatusGrid: React.FC<DeviceStatusGridProps> = ({
  specs,
  specsVision,
  cane,
  band,
  deviceLastSeen,
}) => {
  // 1-second interval ticker so relative times (e.g. "5s ago") and online transitions update in real time
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Online threshold window: 7 seconds without telemetry = OFFLINE
  const ONLINE_WINDOW_MS = 7000;

  // Resolve latest received timestamp for each device
  const specsTimestamp =
    deviceLastSeen?.specs ||
    specs?.lastPublished ||
    specsVision?.lastPublished ||
    (specs?.timestamp && specs.timestamp > 1000000000 ? specs.timestamp : null) ||
    null;

  const caneTimestamp =
    deviceLastSeen?.cane ||
    cane?.lastPublished ||
    (cane?.timestamp && cane.timestamp > 1000000000 ? cane.timestamp : null) ||
    null;

  const bandTimestamp =
    deviceLastSeen?.band ||
    band?.lastPublished ||
    (band?.timestamp && band.timestamp > 1000000000 ? band.timestamp : null) ||
    null;

  const isSpecsOnline = Boolean(specsTimestamp && (now - specsTimestamp < ONLINE_WINDOW_MS));
  const isCaneOnline = Boolean(caneTimestamp && (now - caneTimestamp < ONLINE_WINDOW_MS));
  const isBandOnline = Boolean(bandTimestamp && (now - bandTimestamp < ONLINE_WINDOW_MS));

  const onlineCount = [isSpecsOnline, isCaneOnline, isBandOnline].filter(Boolean).length;

  // Helper to format "Last Published" footer text
  const formatLastPublished = (timestamp: number | null, isOnline: boolean, topic: string) => {
    if (!timestamp) {
      return {
        label: `Last Published: Never (Awaiting ${topic})`,
        isOnline: false,
      };
    }
    const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
    const timeStr = new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (isOnline) {
      if (diffSec < 2) return { label: `Live • Just now (${timeStr})`, isOnline: true };
      return { label: `Live • ${diffSec}s ago (${timeStr})`, isOnline: true };
    } else {
      if (diffSec < 60) return { label: `Last Published: ${diffSec}s ago (${timeStr})`, isOnline: false };
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return { label: `Last Published: ${diffMin}m ago (${timeStr})`, isOnline: false };
      return { label: `Last Published: ${timeStr}`, isOnline: false };
    }
  };

  const specsFooter = formatLastPublished(specsTimestamp, isSpecsOnline, 'aiot/v1/specs/*');
  const caneFooter = formatLastPublished(caneTimestamp, isCaneOnline, 'aiot/v1/cane/*');
  const bandFooter = formatLastPublished(bandTimestamp, isBandOnline, 'aiot/v1/band/*');

  // Specs Metrics
  const specsDist = specs?.distance_m;
  const latestDetection = specsVision?.detections?.[0];
  const visionLabel = latestDetection?.label;
  const visionCategory = latestDetection?.category;

  // Cane Metrics
  const caneDist = cane?.distance_m;
  const isCaneBuzzer = cane?.buzzer_active;
  const caneFallFlag = cane?.fall_flag === 1;

  // Band Metrics
  const bandHr = band?.heart_rate;
  const bandSpO2 = band?.spo2;
  const isVitalsCritical = bandHr !== undefined && (bandHr < 50 || bandHr > 120 || (bandSpO2 !== undefined && bandSpO2 < 90));
  const isVitalsWarning = !isVitalsCritical && bandHr !== undefined && (bandHr < 60 || bandHr > 100 || (bandSpO2 !== undefined && bandSpO2 < 95));
  const patientStatus = isVitalsCritical
    ? 'Critical'
    : isVitalsWarning
    ? 'Warning'
    : 'Stable / Normal';

  return (
    <section style={styles.sectionWrapper}>
      <div style={styles.sectionHeaderRow}>
        <div>
          <span className="eyebrow-label">TRI-WEARABLE PLATFORM • AES-256-GCM TOPOLOGY</span>
          <h2 style={styles.sectionTitle}>Connected Hardware Nodes</h2>
        </div>
        <div style={{
          ...styles.nodeCountPill,
          borderColor: onlineCount > 0 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(140, 162, 194, 0.25)',
        }}>
          <div
            style={{
              ...styles.pulseDot,
              backgroundColor: onlineCount > 0 ? '#38BDF8' : '#8CA2C2',
            }}
            className={onlineCount > 0 ? 'live-pulse-blue' : ''}
          />
          <span style={{
            ...styles.nodeCountText,
            color: onlineCount > 0 ? '#38BDF8' : '#8CA2C2',
          }}>
            {onlineCount} / 3 Nodes Online
          </span>
        </div>
      </div>

      <div style={styles.grid}>
        {/* TILE 1: Smart Glasses (ESP32-CAM) */}
        <div style={{
          ...styles.tile,
          borderColor: isSpecsOnline ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)',
          boxShadow: isSpecsOnline ? '0 4px 20px rgba(56, 189, 248, 0.12)' : '0 4px 16px rgba(0, 0, 0, 0.25)',
          opacity: isSpecsOnline ? 1 : 0.88,
        }}>
          <div style={styles.tileTop}>
            <div style={{
              ...styles.iconBox,
              borderColor: isSpecsOnline ? 'rgba(56, 189, 248, 0.4)' : 'rgba(140, 162, 194, 0.2)',
            }}>
              <Eye size={20} color={isSpecsOnline ? '#38BDF8' : '#8CA2C2'} />
            </div>
            <div style={styles.titleStack}>
              <span className="eyebrow-label">NODE 01 • ESP32-CAM</span>
              <h3 style={styles.deviceHeading}>Smart Glasses</h3>
            </div>
            <div style={{
              ...styles.statusPill,
              borderColor: isSpecsOnline ? '#38BDF8' : 'rgba(140, 162, 194, 0.25)',
              backgroundColor: isSpecsOnline ? 'rgba(56, 189, 248, 0.12)' : '#0B132B',
            }}>
              <div
                style={{
                  ...styles.greenDot,
                  backgroundColor: isSpecsOnline ? '#38BDF8' : '#8CA2C2',
                }}
                className={isSpecsOnline ? 'live-pulse-blue' : ''}
              />
              <span style={{
                ...styles.statusPillText,
                color: isSpecsOnline ? '#38BDF8' : '#8CA2C2',
              }}>
                {isSpecsOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div style={styles.metricsBox}>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>YOLO VISION INFERENCE</span>
              <div style={styles.valueRow}>
                <span style={{
                  ...styles.metricValue,
                  color: !isSpecsOnline && !visionLabel ? '#8CA2C2' : visionCategory === 'currency' ? '#FFCD48' : '#38BDF8',
                }}>
                  {visionLabel || (isSpecsOnline ? 'Continuous Perception' : '-- (No Vision Stream)')}
                </span>
              </div>
            </div>

            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>OBSTACLE DETECTED DISTANCE</span>
              <div style={styles.valueRow}>
                <span style={{
                  ...styles.metricValueLarge,
                  color: specsDist !== undefined && specsDist < 1.0 ? '#FFCD48' : '#FFFFFF',
                }}>
                  {specsDist !== undefined ? `${specsDist.toFixed(2)} m` : '--'}
                </span>
                <span style={styles.unitSub}>
                  {specsDist !== undefined ? 'Clearance' : 'Awaiting Sonar'}
                </span>
              </div>
            </div>

            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>HEAD POSE VECTOR</span>
              <span style={styles.monoSub}>
                {specs?.yaw_deg !== undefined && specs?.pitch_deg !== undefined
                  ? `Yaw: ${specs.yaw_deg.toFixed(1)}° • Pitch: ${specs.pitch_deg.toFixed(1)}°`
                  : '-- (Awaiting IMU Vector)'}
              </span>
            </div>
          </div>

          {/* Last Published Timestamp Footer */}
          <div style={styles.cardFooter}>
            {isSpecsOnline ? (
              <Radio size={13} color="#38BDF8" />
            ) : (
              <Clock size={13} color="#8CA2C2" />
            )}
            <span style={isSpecsOnline ? styles.footerLiveText : styles.footerOfflineText}>
              {specsFooter.label}
            </span>
          </div>
        </div>

        {/* TILE 2: Smart Cane (ESP8266) */}
        <div style={{
          ...styles.tile,
          borderColor: isCaneOnline ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)',
          boxShadow: isCaneOnline ? '0 4px 20px rgba(56, 189, 248, 0.12)' : '0 4px 16px rgba(0, 0, 0, 0.25)',
          opacity: isCaneOnline ? 1 : 0.88,
        }}>
          <div style={styles.tileTop}>
            <div style={{
              ...styles.iconBox,
              borderColor: isCaneOnline ? 'rgba(56, 189, 248, 0.4)' : 'rgba(140, 162, 194, 0.2)',
            }}>
              <Navigation size={20} color={isCaneOnline ? '#38BDF8' : '#8CA2C2'} />
            </div>
            <div style={styles.titleStack}>
              <span className="eyebrow-label">NODE 02 • ESP8266</span>
              <h3 style={styles.deviceHeading}>Smart Cane</h3>
            </div>
            <div style={{
              ...styles.statusPill,
              borderColor: isCaneOnline ? '#38BDF8' : 'rgba(140, 162, 194, 0.25)',
              backgroundColor: isCaneOnline ? 'rgba(56, 189, 248, 0.12)' : '#0B132B',
            }}>
              <div
                style={{
                  ...styles.greenDot,
                  backgroundColor: isCaneOnline ? '#38BDF8' : '#8CA2C2',
                }}
                className={isCaneOnline ? 'live-pulse-blue' : ''}
              />
              <span style={{
                ...styles.statusPillText,
                color: isCaneOnline ? '#38BDF8' : '#8CA2C2',
              }}>
                {isCaneOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div style={styles.metricsBox}>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>ULTRASONIC RANGING</span>
              <div style={styles.valueRow}>
                <span style={{
                  ...styles.metricValueLarge,
                  color: isCaneBuzzer ? '#FFCD48' : '#FFFFFF',
                }}>
                  {caneDist !== undefined ? `${caneDist.toFixed(2)} m` : '--'}
                </span>
                <span style={{
                  ...styles.unitSub,
                  color: isCaneBuzzer ? '#FFCD48' : '#8CA2C2',
                }}>
                  {isCaneBuzzer
                    ? '⚠️ Buzzer Triggered'
                    : caneDist !== undefined
                    ? 'Active Scanning'
                    : 'Awaiting Ultrasonic'}
                </span>
              </div>
            </div>

            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>IMU IMPACT ACCEL</span>
              <div style={styles.valueRow}>
                <span style={{
                  ...styles.metricValue,
                  color: caneFallFlag ? '#FFCD48' : '#FFFFFF',
                }}>
                  {cane?.amag !== undefined ? `${cane.amag.toFixed(2)} m/s²` : '--'}
                </span>
                {caneFallFlag && (
                  <span style={{ ...styles.unitSub, color: '#FFCD48' }}>Flag F_cane=1</span>
                )}
              </div>
            </div>

            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>HANDLE VITALS CHECK</span>
              <span style={styles.monoSub}>
                {cane?.heart_rate !== undefined && cane?.spo2 !== undefined
                  ? `HR: ${cane.heart_rate} BPM • SpO2: ${cane.spo2}%`
                  : '-- (Awaiting Sensor)'}
              </span>
            </div>
          </div>

          {/* Last Published Timestamp Footer */}
          <div style={styles.cardFooter}>
            {isCaneOnline ? (
              <Radio size={13} color="#38BDF8" />
            ) : (
              <Clock size={13} color="#8CA2C2" />
            )}
            <span style={isCaneOnline ? styles.footerLiveText : styles.footerOfflineText}>
              {caneFooter.label}
            </span>
          </div>
        </div>

        {/* TILE 3: Smart Band (ESP8266) */}
        <div style={{
          ...styles.tile,
          borderColor: isBandOnline
            ? isVitalsCritical || isVitalsWarning
              ? '#FFCD48'
              : 'rgba(56, 189, 248, 0.45)'
            : 'rgba(255, 255, 255, 0.08)',
          boxShadow: isBandOnline
            ? '0 4px 20px rgba(56, 189, 248, 0.16)'
            : '0 4px 16px rgba(0, 0, 0, 0.25)',
          opacity: isBandOnline ? 1 : 0.88,
        }}>
          <div style={styles.tileTop}>
            <div style={{
              ...styles.iconBox,
              borderColor: isBandOnline ? 'rgba(56, 189, 248, 0.4)' : 'rgba(140, 162, 194, 0.2)',
            }}>
              <Activity size={20} color={isBandOnline ? '#38BDF8' : '#8CA2C2'} />
            </div>
            <div style={styles.titleStack}>
              <span className="eyebrow-label">NODE 03 • ESP8266</span>
              <h3 style={styles.deviceHeading}>Smart Band</h3>
            </div>
            <div style={{
              ...styles.statusPill,
              borderColor: isBandOnline
                ? isVitalsCritical || isVitalsWarning
                  ? '#FFCD48'
                  : '#38BDF8'
                : 'rgba(140, 162, 194, 0.25)',
              backgroundColor: isBandOnline ? 'rgba(56, 189, 248, 0.12)' : '#0B132B',
            }}>
              <div
                style={{
                  ...styles.greenDot,
                  backgroundColor: isBandOnline
                    ? isVitalsCritical || isVitalsWarning
                      ? '#FFCD48'
                      : '#38BDF8'
                    : '#8CA2C2',
                }}
                className={isBandOnline ? 'live-pulse-blue' : ''}
              />
              <span style={{
                ...styles.statusPillText,
                color: isBandOnline
                  ? isVitalsCritical || isVitalsWarning
                    ? '#FFCD48'
                    : '#38BDF8'
                  : '#8CA2C2',
              }}>
                {isBandOnline ? patientStatus : 'Offline'}
              </span>
            </div>
          </div>

          <div style={styles.metricsBox}>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>PATIENT BIOMETRICS</span>
              <div style={styles.valueRow}>
                <span style={{
                  ...styles.metricValueLarge,
                  color: isVitalsCritical || isVitalsWarning ? '#FFCD48' : '#38BDF8',
                }}>
                  {bandHr !== undefined ? `${bandHr} BPM` : '--'}
                </span>
                <span style={styles.unitSub}>
                  {bandSpO2 !== undefined ? `• ${bandSpO2}% SpO2` : 'Awaiting Optical Vitals'}
                </span>
              </div>
            </div>

            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>BAROMETRIC SENSING</span>
              <div style={styles.valueRow}>
                <span style={styles.metricValue}>
                  {band?.altitude_m !== undefined ? `${band.altitude_m} m` : '--'}
                </span>
                <span style={styles.unitSub}>
                  {band?.pressure_hpa !== undefined ? `${band.pressure_hpa} hPa` : 'Awaiting BMP280'}
                </span>
              </div>
            </div>

            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>MOTION & STEP TELEMETRY</span>
              <span style={styles.monoSub}>
                {band?.step_count !== undefined && band?.amag !== undefined
                  ? `${band.step_count} Steps • Accel: ${band.amag.toFixed(2)} m/s²`
                  : '-- (Awaiting Motion Accel)'}
              </span>
            </div>
          </div>

          {/* Last Published Timestamp Footer */}
          <div style={styles.cardFooter}>
            {isBandOnline ? (
              <Radio size={13} color="#38BDF8" />
            ) : (
              <Clock size={13} color="#8CA2C2" />
            )}
            <span style={isBandOnline ? styles.footerLiveText : styles.footerOfflineText}>
              {bandFooter.label}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

const styles = {
  sectionWrapper: {
    padding: '0 clamp(14px, 4vw, 20px) 28px clamp(14px, 4vw, 20px)',
  },
  sectionHeaderRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '16px',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
    margin: '4px 0 0 0',
  },
  nodeCountPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0F1D38',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '56px',
    padding: '5px 14px',
    transition: 'all 0.3s ease',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#38BDF8',
    transition: 'background-color 0.3s ease',
  },
  nodeCountText: {
    fontSize: '11px',
    color: '#38BDF8',
    fontWeight: '600',
    letterSpacing: '-0.08px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
    gap: '16px',
  },
  tile: {
    backgroundColor: '#0F1D38',
    borderRadius: 'var(--radius-largecards)',
    padding: 'clamp(20px, 4vw, 28px) clamp(16px, 4vw, 24px)',
    border: '1px solid rgba(56, 189, 248, 0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.08)',
  },
  tileTop: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '14px',
  },
  iconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '16px',
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'border-color 0.3s ease',
  },
  titleStack: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  deviceHeading: {
    fontSize: '17px',
    fontWeight: '500',
    color: '#FFFFFF',
    margin: 0,
    letterSpacing: '-0.08px',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '56px',
    padding: '4px 12px',
    transition: 'all 0.3s ease',
  },
  greenDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#38BDF8',
    transition: 'background-color 0.3s ease',
  },
  statusPillText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#38BDF8',
    letterSpacing: '-0.08px',
  },
  metricsBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    backgroundColor: '#0B132B',
    padding: '16px 20px',
    borderRadius: '24px',
    border: '1px solid rgba(56, 189, 248, 0.1)',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '3px',
  },
  metricLabel: {
    fontSize: '9px',
    fontWeight: '500',
    color: '#8CA2C2',
    letterSpacing: '0.45px',
    textTransform: 'uppercase' as const,
  },
  valueRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'baseline',
    gap: '6px',
  },
  metricValue: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
  },
  metricValueLarge: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
  },
  unitSub: {
    fontSize: '12px',
    color: '#8CA2C2',
  },
  monoSub: {
    fontSize: '11px',
    color: '#8CA2C2',
    fontFamily: 'JetBrains Mono, monospace',
  },
  cardFooter: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(11, 19, 43, 0.75)',
    borderRadius: '16px',
    padding: '9px 14px',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    marginTop: 'auto',
  },
  footerLiveText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#38BDF8',
    letterSpacing: '-0.08px',
  },
  footerOfflineText: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#8CA2C2',
    letterSpacing: '-0.08px',
  },
};
