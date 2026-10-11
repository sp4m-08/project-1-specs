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
  const specsDist = specs?.distance_m || 0.85;
  const caneDist = cane?.distance_m || 0.85;

  const latestDetection = specsVision?.detections?.[0];
  const visionLabel = latestDetection?.label || 'Continuous Scanning';
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
            <Eye size={18} color="#3DDC91" />
          </div>
          <div style={styles.headerText}>
            <span className="eyebrow-label">WEARABLE NODE 01</span>
            <h3 style={styles.deviceHeading}>Smart Glasses</h3>
          </div>
          <div style={styles.liveBadge}>
            <div style={styles.liveDot} className="live-pulse-green" />
            <span style={styles.liveText}>50 Hz</span>
          </div>
        </div>

        <div style={styles.metricsBox}>
          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#828786' }}>YOLO VISION INFERENCE</span>
            <div style={styles.valueRow}>
              <span style={{
                ...styles.primaryValue,
                color: visionCategory === 'currency' ? '#FFCD48' : '#3DDC91',
              }}>
                {visionLabel}
              </span>
            </div>
          </div>

          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#828786' }}>ULTRASONIC RANGING</span>
            <div style={styles.valueRow}>
              <span style={{
                ...styles.primaryValue,
                color: specsDist < 1.0 ? '#FFCD48' : '#FFFFFF',
              }}>
                {specsDist.toFixed(2)} m
              </span>
              <span style={styles.unitSubtext}>Clearance</span>
            </div>
          </div>

          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#828786' }}>SPATIAL ORIENTATION</span>
            <span style={styles.subtleMono}>
              Yaw: {specs?.yaw_deg || -12.5}° • Pitch: {specs?.pitch_deg || 4.2}°
            </span>
          </div>
        </div>
      </div>

      {/* 2. Smart Cane Module Card */}
      <div className="deep-abyss-card" style={styles.card}>
        <div style={styles.cardTop}>
          <div style={styles.iconBox}>
            <Navigation size={18} color="#3DDC91" />
          </div>
          <div style={styles.headerText}>
            <span className="eyebrow-label">WEARABLE NODE 02</span>
            <h3 style={styles.deviceHeading}>Smart Cane</h3>
          </div>
          <div style={styles.liveBadge}>
            <div style={styles.liveDot} className="live-pulse-green" />
            <span style={styles.liveText}>Active</span>
          </div>
        </div>

        <div style={styles.metricsBox}>
          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#828786' }}>GROUND PROXIMITY</span>
            <div style={styles.valueRow}>
              <span style={{
                ...styles.primaryValue,
                color: cane?.buzzer_active ? '#FFCD48' : '#FFFFFF',
              }}>
                {caneDist.toFixed(2)} m
              </span>
              <span style={styles.unitSubtext}>
                {cane?.buzzer_active ? 'Buzzer Active' : 'Normal'}
              </span>
            </div>
          </div>

          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#828786' }}>IMU ACCELERATION</span>
            <div style={styles.valueRow}>
              <span style={{
                ...styles.primaryValue,
                color: cane?.fall_flag === 1 ? '#FFCD48' : '#FFFFFF',
              }}>
                {cane?.amag || 9.81} m/s²
              </span>
              {cane?.fall_flag === 1 && (
                <span style={{ ...styles.unitSubtext, color: '#FFCD48' }}>Flag F_cane=1</span>
              )}
            </div>
          </div>

          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#828786' }}>HANDLE BIOMETRICS</span>
            <span style={styles.subtleMono}>
              HR: {cane?.heart_rate || 74} BPM • SpO2: {cane?.spo2 || 98}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Smart Band Module Card */}
      <div className="deep-abyss-card" style={styles.card}>
        <div style={styles.cardTop}>
          <div style={styles.iconBox}>
            <Activity size={18} color="#3DDC91" />
          </div>
          <div style={styles.headerText}>
            <span className="eyebrow-label">WEARABLE NODE 03</span>
            <h3 style={styles.deviceHeading}>Smart Band</h3>
          </div>
          <div style={styles.liveBadge}>
            <div style={{
              ...styles.liveDot,
              backgroundColor: isVitalsCritical ? '#FFCD48' : '#3DDC91',
            }} className="live-pulse-green" />
            <span style={{
              ...styles.liveText,
              color: isVitalsCritical ? '#FFCD48' : '#3DDC91',
            }}>
              {isVitalsCritical ? 'Critical' : isVitalsWarning ? 'Warning' : 'Nominal'}
            </span>
          </div>
        </div>

        <div style={styles.metricsBox}>
          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#828786' }}>MAX30100 BIOMETRICS</span>
            <div style={styles.valueRow}>
              <span style={{
                ...styles.primaryValue,
                color: isVitalsCritical || isVitalsWarning ? '#FFCD48' : '#3DDC91',
              }}>
                {bandHr} BPM
              </span>
              <span style={styles.unitSubtext}>• {bandSpO2}% SpO2</span>
            </div>
          </div>

          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#828786' }}>BAROMETRIC ALTITUDE</span>
            <div style={styles.valueRow}>
              <span style={styles.primaryValue}>
                {band?.altitude_m || 120.5} m
              </span>
              <span style={styles.unitSubtext}>{band?.pressure_hpa || 1013} hPa</span>
            </div>
          </div>

          <div style={styles.metricItem}>
            <span className="eyebrow-label" style={{ color: '#828786' }}>PEDOMETER & DYNAMICS</span>
            <span style={styles.subtleMono}>
              {band?.step_count || 1420} Steps • Accel: {band?.amag || 9.79} m/s²
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
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    borderRadius: '20px',
    backgroundColor: '#0E1A19',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  cardTop: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '12px',
  },
  iconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#132322',
    border: '1px solid rgba(61, 220, 145, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  deviceHeading: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#FFFFFF',
    margin: 0,
    letterSpacing: '-0.08px',
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#132322',
    padding: '4px 10px',
    borderRadius: '56px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#3DDC91',
  },
  liveText: {
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
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  valueRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'baseline',
    gap: '6px',
  },
  primaryValue: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
  },
  unitSubtext: {
    fontSize: '12px',
    color: '#828786',
    fontWeight: '400',
  },
  subtleMono: {
    fontSize: '12px',
    color: '#828786',
    fontFamily: 'JetBrains Mono, monospace',
  },
};
