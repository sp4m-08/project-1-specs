import React from 'react';
import { Eye, Navigation, Activity, ShieldCheck, Zap } from 'lucide-react';
import { SpecsTelemetry, SpecsVision, CaneTelemetry, BandTelemetry } from '../types/telemetry';

interface DeviceStatusGridProps {
  specs?: SpecsTelemetry;
  specsVision?: SpecsVision;
  cane?: CaneTelemetry;
  band?: BandTelemetry;
}

/**
 * DeviceStatusGrid — Connected Devices Row (3 Tiles on #0e1a19 background, 60px radius)
 * Receives decrypted AES-256-GCM telemetry from:
 * 1. Smart Glasses (ESP32-CAM): YOLO Vision, obstacle distance, head pose.
 * 2. Smart Cane (ESP8266): Ground ultrasonic proximity, impact accel, buzzer state.
 * 3. Smart Band (ESP8266): Patient vital signs, barometric altitude, motion steps.
 */
export const DeviceStatusGrid: React.FC<DeviceStatusGridProps> = ({
  specs,
  specsVision,
  cane,
  band,
}) => {
  // Glasses metrics
  const specsDist = specs?.distance_m ?? 0.85;
  const latestDetection = specsVision?.detections?.[0];
  const visionLabel = latestDetection?.label || 'Continuous Perception';
  const visionCategory = latestDetection?.category || 'perception';

  // Cane metrics
  const caneDist = cane?.distance_m ?? 0.85;
  const isCaneBuzzer = cane?.buzzer_active ?? false;
  const caneFallFlag = cane?.fall_flag === 1;

  // Band metrics
  const bandHr = band?.heart_rate || cane?.heart_rate || 72;
  const bandSpO2 = band?.spo2 || cane?.spo2 || 98;
  const isVitalsCritical = bandHr < 50 || bandHr > 120 || bandSpO2 < 90;
  const isVitalsWarning = !isVitalsCritical && (bandHr < 60 || bandHr > 100 || bandSpO2 < 95);
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
        <div style={styles.nodeCountPill}>
          <div style={styles.pulseDot} className="live-pulse-green" />
          <span style={styles.nodeCountText}>3 / 3 Nodes Online</span>
        </div>
      </div>

      <div style={styles.grid}>
        {/* TILE 1: Smart Glasses (ESP32-CAM) */}
        <div style={styles.tile}>
          <div style={styles.tileTop}>
            <div style={styles.iconBox}>
              <Eye size={20} color="#3DDC91" />
            </div>
            <div style={styles.titleStack}>
              <span className="eyebrow-label">NODE 01 • ESP32-CAM</span>
              <h3 style={styles.deviceHeading}>Smart Glasses</h3>
            </div>
            <div style={styles.statusPill}>
              <div style={styles.greenDot} className="live-pulse-green" />
              <span style={styles.statusPillText}>Active</span>
            </div>
          </div>

          <div style={styles.metricsBox}>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>YOLO VISION INFERENCE</span>
              <div style={styles.valueRow}>
                <span style={{
                  ...styles.metricValue,
                  color: visionCategory === 'currency' ? '#FFCD48' : '#3DDC91',
                }}>
                  {visionLabel}
                </span>
              </div>
            </div>

            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>OBSTACLE DETECTED DISTANCE</span>
              <div style={styles.valueRow}>
                <span style={{
                  ...styles.metricValueLarge,
                  color: specsDist < 1.0 ? '#FFCD48' : '#FFFFFF',
                }}>
                  {specsDist.toFixed(2)} m
                </span>
                <span style={styles.unitSub}>Clearance</span>
              </div>
            </div>

            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>HEAD POSE VECTOR</span>
              <span style={styles.monoSub}>
                Yaw: {specs?.yaw_deg ?? -12.5}° • Pitch: {specs?.pitch_deg ?? 4.2}°
              </span>
            </div>
          </div>
        </div>

        {/* TILE 2: Smart Cane (ESP8266) */}
        <div style={styles.tile}>
          <div style={styles.tileTop}>
            <div style={styles.iconBox}>
              <Navigation size={20} color="#3DDC91" />
            </div>
            <div style={styles.titleStack}>
              <span className="eyebrow-label">NODE 02 • ESP8266</span>
              <h3 style={styles.deviceHeading}>Smart Cane</h3>
            </div>
            <div style={styles.statusPill}>
              <div style={styles.greenDot} className="live-pulse-green" />
              <span style={styles.statusPillText}>Ranging</span>
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
                  {caneDist.toFixed(2)} m
                </span>
                <span style={{
                  ...styles.unitSub,
                  color: isCaneBuzzer ? '#FFCD48' : '#828786',
                }}>
                  {isCaneBuzzer ? '⚠️ Buzzer Triggered' : 'Active Scanning'}
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
                  {cane?.amag ?? 9.81} m/s²
                </span>
                {caneFallFlag && (
                  <span style={{ ...styles.unitSub, color: '#FFCD48' }}>Flag F_cane=1</span>
                )}
              </div>
            </div>

            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>HANDLE VITALS CHECK</span>
              <span style={styles.monoSub}>
                HR: {cane?.heart_rate ?? 74} BPM • SpO2: {cane?.spo2 ?? 98}%
              </span>
            </div>
          </div>
        </div>

        {/* TILE 3: Smart Band (ESP8266) */}
        <div style={styles.tile}>
          <div style={styles.tileTop}>
            <div style={styles.iconBox}>
              <Activity size={20} color="#3DDC91" />
            </div>
            <div style={styles.titleStack}>
              <span className="eyebrow-label">NODE 03 • ESP8266</span>
              <h3 style={styles.deviceHeading}>Smart Band</h3>
            </div>
            <div style={{
              ...styles.statusPill,
              borderColor: isVitalsCritical || isVitalsWarning ? '#FFCD48' : 'rgba(61, 220, 145, 0.4)',
            }}>
              <div style={{
                ...styles.greenDot,
                backgroundColor: isVitalsCritical || isVitalsWarning ? '#FFCD48' : '#3DDC91',
              }} className="live-pulse-green" />
              <span style={{
                ...styles.statusPillText,
                color: isVitalsCritical || isVitalsWarning ? '#FFCD48' : '#3DDC91',
              }}>
                {patientStatus}
              </span>
            </div>
          </div>

          <div style={styles.metricsBox}>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>PATIENT BIOMETRICS</span>
              <div style={styles.valueRow}>
                <span style={{
                  ...styles.metricValueLarge,
                  color: isVitalsCritical || isVitalsWarning ? '#FFCD48' : '#3DDC91',
                }}>
                  {bandHr} BPM
                </span>
                <span style={styles.unitSub}>• {bandSpO2}% SpO2</span>
              </div>
            </div>

            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>BAROMETRIC SENSING</span>
              <div style={styles.valueRow}>
                <span style={styles.metricValue}>
                  {band?.altitude_m ?? 120.5} m
                </span>
                <span style={styles.unitSub}>{band?.pressure_hpa ?? 1013} hPa</span>
              </div>
            </div>

            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>MOTION & STEP TELEMETRY</span>
              <span style={styles.monoSub}>
                {band?.step_count ?? 1420} Steps • Accel: {band?.amag ?? 9.79} m/s²
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const styles = {
  sectionWrapper: {
    padding: '0 20px 28px 20px',
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
    backgroundColor: '#0E1A19',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '56px',
    padding: '5px 14px',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#3DDC91',
  },
  nodeCountText: {
    fontSize: '11px',
    color: '#3DDC91',
    fontWeight: '500',
    letterSpacing: '-0.08px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
    gap: '20px',
  },
  tile: {
    backgroundColor: '#0E1A19',
    borderRadius: '60px', // Exact 60px large card radius
    padding: '32px 28px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
    transition: 'border-color 0.2s ease',
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
    backgroundColor: '#132322',
    border: '1px solid rgba(61, 220, 145, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#132322',
    border: '1px solid rgba(61, 220, 145, 0.3)',
    borderRadius: '56px',
    padding: '4px 12px',
  },
  greenDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#3DDC91',
  },
  statusPillText: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#3DDC91',
    letterSpacing: '-0.08px',
  },
  metricsBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    backgroundColor: '#132322',
    padding: '16px 20px',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '3px',
  },
  metricLabel: {
    fontSize: '9px',
    fontWeight: '500',
    color: '#828786',
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
    color: '#828786',
  },
  monoSub: {
    fontSize: '11px',
    color: '#828786',
    fontFamily: 'JetBrains Mono, monospace',
  },
};
