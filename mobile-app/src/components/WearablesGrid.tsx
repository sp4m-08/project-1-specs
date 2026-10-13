import React from 'react';
import { Eye, Navigation, Activity } from 'lucide-react';
import { SpecsTelemetry, SpecsVision, CaneTelemetry, BandTelemetry } from '../types/telemetry';

interface WearablesGridProps {
  specs?: SpecsTelemetry;
  specsVision?: SpecsVision;
  cane?: CaneTelemetry;
  band?: BandTelemetry;
}

export const WearablesGrid: React.FC<WearablesGridProps> = ({
  specs,
  specsVision,
  cane,
  band,
}) => {
  const specsDist = specs?.distance_m ?? 0.85;
  const caneDist = cane?.distance_m ?? 0.85;

  const latestDetection = specsVision?.detections?.[0];
  const visionLabel = latestDetection?.label || 'Continuous Perception';
  const visionCategory = latestDetection?.category || 'perception';

  const bandHr = band?.heart_rate || cane?.heart_rate || 72;
  const bandSpO2 = band?.spo2 || cane?.spo2 || 98;

  const isVitalsCritical = bandHr < 50 || bandHr > 120 || bandSpO2 < 90;
  const isVitalsWarning = !isVitalsCritical && (bandHr < 60 || bandHr > 100 || bandSpO2 < 95);

  return (
    <div style={styles.gridContainer}>
      {/* 1. Smart Glasses Module Card */}
      <div className="deep-abyss-card" style={styles.card}>
        <div style={styles.cardTop}>
          <div style={styles.iconBox}>
            <Eye size={18} color="#38BDF8" />
          </div>
          <div style={styles.headerText}>
            <span className="eyebrow-label">NODE 01 • ESP32-CAM</span>
            <h3 style={styles.deviceHeading}>Smart Glasses</h3>
          </div>
          <div style={styles.liveBadge}>
            <div style={styles.liveDot} className="live-pulse-blue" />
            <span style={styles.liveText}>{specs ? 'Active' : 'Offline'}</span>
          </div>
        </div>

        <div style={styles.metricsBox}>
          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#8CA2C2' }}>YOLO VISION INFERENCE</span>
            <div style={styles.valueRow}>
              <span style={{
                ...styles.primaryValue,
                color: visionCategory === 'currency' ? '#FFCD48' : '#38BDF8',
              }}>
                {visionLabel}
              </span>
            </div>
          </div>

          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#8CA2C2' }}>OBSTACLE DETECTED DISTANCE</span>
            <div style={styles.valueRow}>
              <span style={{
                ...styles.primaryValue,
                color: specsDist < 0.8 ? '#FF4D4D' : specsDist < 1.2 ? '#FFCD48' : '#FFFFFF',
              }}>
                {specsDist.toFixed(2)} m
              </span>
              <span style={styles.unitSubtext}>Clearance</span>
            </div>
          </div>

          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#8CA2C2' }}>HEAD POSE VECTOR</span>
            <span style={styles.subtleMono}>
              Yaw: {specs?.yaw_deg !== undefined ? specs.yaw_deg.toFixed(1) : '-12.5'}° • Pitch: {specs?.pitch_deg !== undefined ? specs.pitch_deg.toFixed(1) : '4.2'}°
            </span>
          </div>
        </div>
      </div>

      {/* 2. Smart Cane Module Card */}
      <div className="deep-abyss-card" style={styles.card}>
        <div style={styles.cardTop}>
          <div style={styles.iconBox}>
            <Navigation size={18} color="#38BDF8" />
          </div>
          <div style={styles.headerText}>
            <span className="eyebrow-label">WEARABLE NODE 02</span>
            <h3 style={styles.deviceHeading}>Smart Cane</h3>
          </div>
          <div style={styles.liveBadge}>
            <div style={styles.liveDot} className="live-pulse-blue" />
            <span style={styles.liveText}>Active</span>
          </div>
        </div>

        <div style={styles.metricsBox}>
          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#8CA2C2' }}>ULTRASONIC GROUND RANGE</span>
            <div style={styles.valueRow}>
              <span style={{
                ...styles.primaryValue,
                color: caneDist < 0.8 ? '#FFCD48' : '#FFFFFF',
              }}>
                {caneDist.toFixed(2)} m
              </span>
              <span style={styles.unitSubtext}>
                {cane?.buzzer_active ? 'Buzzer Triggered' : 'Scanning'}
              </span>
            </div>
          </div>

          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#8CA2C2' }}>CANE IMU & IMPACT</span>
            <div style={styles.valueRow}>
              <span style={styles.primaryValue}>
                {cane?.amag?.toFixed(2) || '9.81'} m/s²
              </span>
              <span style={{
                ...styles.unitSubtext,
                color: cane?.fall_flag ? '#FFCD48' : '#8CA2C2',
              }}>
                Flag: {cane?.fall_flag ? 'Candidate Fall (1)' : 'Nominal (0)'}
              </span>
            </div>
          </div>

          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#8CA2C2' }}>HANDLE TELEMETRY</span>
            <span style={styles.subtleMono}>
              HR: {cane?.heart_rate || 72} BPM • SpO2: {cane?.spo2 || 98}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Smart Band Module Card */}
      <div className="deep-abyss-card" style={styles.card}>
        <div style={styles.cardTop}>
          <div style={styles.iconBox}>
            <Activity size={18} color="#38BDF8" />
          </div>
          <div style={styles.headerText}>
            <span className="eyebrow-label">WEARABLE NODE 03</span>
            <h3 style={styles.deviceHeading}>Smart Band</h3>
          </div>
          <div style={{
            ...styles.liveBadge,
            borderColor: isVitalsCritical || isVitalsWarning ? '#FFCD48' : 'rgba(56, 189, 248, 0.3)',
          }}>
            <div style={{
              ...styles.liveDot,
              backgroundColor: isVitalsCritical || isVitalsWarning ? '#FFCD48' : '#38BDF8',
            }} className="live-pulse-blue" />
            <span style={{
              ...styles.liveText,
              color: isVitalsCritical || isVitalsWarning ? '#FFCD48' : '#38BDF8',
            }}>
              {isVitalsCritical ? 'Critical' : isVitalsWarning ? 'Warning' : 'Normal'}
            </span>
          </div>
        </div>

        <div style={styles.metricsBox}>
          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#8CA2C2' }}>PATIENT VITALS</span>
            <div style={styles.valueRow}>
              <span style={{
                ...styles.primaryValue,
                color: isVitalsCritical || isVitalsWarning ? '#FFCD48' : '#38BDF8',
              }}>
                {bandHr} BPM
              </span>
              <span style={styles.unitSubtext}>• {bandSpO2}% SpO2</span>
            </div>
          </div>

          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#8CA2C2' }}>BAROMETRIC SENSOR</span>
            <div style={styles.valueRow}>
              <span style={styles.primaryValue}>
                {band?.altitude_m?.toFixed(1) || '120.5'} m
              </span>
              <span style={styles.unitSubtext}>
                {band?.pressure_hpa?.toFixed(0) || '1013'} hPa
              </span>
            </div>
          </div>

          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#8CA2C2' }}>PEDOMETER & STEPS</span>
            <span style={styles.subtleMono}>
              {band?.step_count || 1420} Steps • Accel: {band?.amag?.toFixed(2) || '9.81'} m/s²
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    padding: '0 20px 24px 20px',
  },
  card: {
    backgroundColor: '#0F1D38',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid rgba(56, 189, 248, 0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.08)',
  },
  cardTop: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '12px',
  },
  iconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  deviceHeading: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#FFFFFF',
    margin: 0,
    letterSpacing: '-0.08px',
  },
  liveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '56px',
    padding: '4px 12px',
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#38BDF8',
  },
  liveText: {
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
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid rgba(56, 189, 248, 0.1)',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  valueRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'baseline',
    gap: '8px',
  },
  primaryValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
  },
  unitSubtext: {
    fontSize: '12px',
    color: '#8CA2C2',
  },
  subtleMono: {
    fontSize: '11px',
    color: '#8CA2C2',
    fontFamily: 'JetBrains Mono, monospace',
  },
};
