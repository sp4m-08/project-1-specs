import React from 'react';
import { Eye, Navigation, Activity, Heart, ShieldAlert, Zap, Compass, Thermometer, Footprints } from 'lucide-react';
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
  const isObstacleWarning = specsDist < 1.0 || caneDist < 0.8;

  const latestDetection = specsVision?.detections?.[0];
  const visionLabel = latestDetection?.label || 'Continuous Scanning';
  const visionCategory = latestDetection?.category || 'perception';

  const bandHr = band?.heart_rate || cane?.heart_rate || 72;
  const bandSpO2 = band?.spo2 || cane?.spo2 || 98;

  const isVitalsCritical = bandHr < 50 || bandHr > 120 || bandSpO2 < 90;
  const isVitalsWarning = !isVitalsCritical && (bandHr < 60 || bandHr > 100 || bandSpO2 < 95);

  return (
    <div style={styles.gridContainer}>
      {/* 1. Smart Glasses Card */}
      <div className="glass-card" style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.iconContainer}>
            <Eye size={20} color="#00F2FE" />
          </div>
          <div style={styles.cardTitleSection}>
            <span style={styles.deviceTitle}>Smart Glasses</span>
            <span style={styles.onlineBadge}>Online</span>
          </div>
        </div>

        <div style={styles.metricsContainer}>
          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>YOLO VISION</span>
            <span style={{
              ...styles.metricValueHighlight,
              color: visionCategory === 'currency' ? '#F59E0B' : '#00F2FE'
            }}>
              {visionLabel}
            </span>
          </div>

          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>ULTRASONIC RANGING</span>
            <span style={{
              ...styles.metricValue,
              color: specsDist < 1.0 ? '#EF4444' : '#F8FAFC'
            }}>
              Obstacle at {specsDist.toFixed(2)}m
            </span>
          </div>

          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>HEAD ORIENTATION</span>
            <span style={styles.metricSubtext}>
              Yaw: {specs?.yaw_deg || -12.5}° | Pitch: {specs?.pitch_deg || 4.2}°
            </span>
          </div>
        </div>
      </div>

      {/* 2. Smart Cane Card */}
      <div className="glass-card" style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.iconContainer}>
            <Navigation size={20} color="#38BDF8" />
          </div>
          <div style={styles.cardTitleSection}>
            <span style={styles.deviceTitle}>Smart Cane</span>
            <span style={styles.connectedBadge}>Connected</span>
          </div>
        </div>

        <div style={styles.metricsContainer}>
          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>ULTRASONIC PROXIMITY</span>
            <span style={styles.metricValueHighlight}>
              {cane?.buzzer_active ? 'Buzzer Warning (<0.8m)' : 'Active Scanning'}
            </span>
          </div>

          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>IMU IMPACT ACCEL</span>
            <span style={styles.metricValue}>
              {cane?.amag || 9.81} m/s² {cane?.fall_flag === 1 ? '⚠️ CANDIDATE FALL' : ''}
            </span>
          </div>

          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>HANDLE VITALS</span>
            <span style={styles.metricSubtext}>
              HR: {cane?.heart_rate || 74} BPM | SpO2: {cane?.spo2 || 98}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Smart Band Card */}
      <div className="glass-card" style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.iconContainer}>
            <Activity size={20} color="#10B981" />
          </div>
          <div style={styles.cardTitleSection}>
            <span style={styles.deviceTitle}>Smart Band</span>
            <span style={{
              ...styles.statusBadge,
              backgroundColor: isVitalsCritical ? 'rgba(239,68,68,0.2)' : isVitalsWarning ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
              color: isVitalsCritical ? '#EF4444' : isVitalsWarning ? '#F59E0B' : '#10B981',
              borderColor: isVitalsCritical ? '#EF4444' : isVitalsWarning ? '#F59E0B' : '#10B981'
            }}>
              {isVitalsCritical ? 'Critical' : isVitalsWarning ? 'Warning' : 'Stable / Normal'}
            </span>
          </div>
        </div>

        <div style={styles.metricsContainer}>
          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>WRIST VITALS</span>
            <span style={styles.metricValueHighlight}>
              {bandHr} BPM | {bandSpO2}% SpO2
            </span>
          </div>

          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>BMP180 ALTITUDE</span>
            <span style={styles.metricValue}>
              {band?.altitude_m || 120.5}m ({band?.pressure_hpa || 1013.25} hPa)
            </span>
          </div>

          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>FOOTSTEPS & MOTION</span>
            <span style={styles.metricSubtext}>
              {band?.step_count || 1420} steps | Accel: {band?.amag || 9.79} m/s²
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
    gap: '16px',
    padding: '16px 20px',
  },
  card: {
    padding: '18px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '12px',
  },
  iconContainer: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  cardTitleSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  deviceTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#F8FAFC',
  },
  onlineBadge: {
    fontSize: '11px',
    color: '#00F2FE',
    fontWeight: '600',
  },
  connectedBadge: {
    fontSize: '11px',
    color: '#38BDF8',
    fontWeight: '600',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '6px',
    border: '1px solid',
    width: 'fit-content',
  },
  metricsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '12px',
    borderRadius: '10px',
  },
  metricRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  metricLabel: {
    fontSize: '10px',
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  metricValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#F8FAFC',
  },
  metricValueHighlight: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#00F2FE',
  },
  metricSubtext: {
    fontSize: '12px',
    color: '#94A3B8',
  },
};
