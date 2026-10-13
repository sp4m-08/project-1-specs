import React, { useState, useEffect } from 'react';
import { Heart, Activity, Thermometer, Compass, CloudRain } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface VitalsCardProps {
  heartRate: number;
  spo2: number;
  altitudeM?: number;
  pressureHpa?: number;
  temperatureC?: number;
}

interface SparklinePoint {
  time: string;
  hr: number;
}

/**
 * VitalsCard — Live Vitals Panel (Ice Blue Frost Content Card #eef6ff, 60px radius)
 * Alternates with dark tiles for signature Sapphire Glass luminance rhythm.
 * Real-time thresholds:
 * - Normal: 60-100 BPM / >= 95% SpO2
 * - Warning: 50-60 or 100-120 BPM / 90-94% SpO2
 * - Critical: < 50 or > 120 BPM / < 90% SpO2
 */
export const VitalsCard: React.FC<VitalsCardProps> = ({
  heartRate = 72,
  spo2 = 98,
  altitudeM = 120.5,
  pressureHpa = 1013.25,
  temperatureC = 36.6,
}) => {
  const [trendData, setTrendData] = useState<SparklinePoint[]>([]);

  useEffect(() => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTrendData((prev) => {
      const next = [...prev, { time: timeStr, hr: heartRate }];
      if (next.length > 20) next.shift();
      return next;
    });
  }, [heartRate]);

  // HR Threshold Evaluation
  const isHrCritical = heartRate < 50 || heartRate > 120;
  const isHrWarning = !isHrCritical && (heartRate < 60 || heartRate > 100);
  const hrStatusText = isHrCritical ? 'Critical' : isHrWarning ? 'Warning' : 'Normal';
  const hrBadgeColor = isHrCritical ? '#DC2626' : isHrWarning ? '#D97706' : '#059669';

  // SpO2 Threshold Evaluation
  const isSpO2Critical = spo2 < 90;
  const isSpO2Warning = !isSpO2Critical && spo2 < 95;
  const spO2StatusText = isSpO2Critical ? 'Critical' : isSpO2Warning ? 'Warning' : 'Normal';
  const spO2BadgeColor = isSpO2Critical ? '#DC2626' : isSpO2Warning ? '#D97706' : '#059669';

  return (
    <section style={styles.sectionWrapper}>
      <div className="mint-frost-card" style={styles.card}>
        {/* Header */}
        <div style={styles.cardHeader}>
          <div>
            <span className="eyebrow-label-dark">MAX30100 OPTICAL SENSOR • BMP280 TELEMETRY</span>
            <h2 style={styles.headline}>Live Patient Vitals & Biometrics</h2>
            <p style={styles.subhead}>
              Real-time physiological telemetry ingested from the Smart Band with automated clinical threshold classification.
            </p>
          </div>

          <div style={styles.statusPillDark}>
            <Activity size={15} color="#0B132B" />
            <span style={styles.statusPillText}>Telemetry Trace Active</span>
          </div>
        </div>

        {/* Primary Metrics Grid (HR & SpO2 & Environment) */}
        <div style={styles.metricsRow}>
          {/* Heart Rate Display */}
          <div style={styles.metricCard}>
            <div style={styles.metricTop}>
              <div style={styles.iconCircleRed}>
                <Heart size={18} color="#DC2626" />
              </div>
              <span style={styles.metricName}>HEART RATE (HR)</span>
            </div>

            <div style={styles.largeNumRow}>
              <span style={styles.largeNum}>{heartRate}</span>
              <span style={styles.largeUnit}>BPM</span>
            </div>

            <div style={{ ...styles.thresholdBadge, backgroundColor: `${hrBadgeColor}15`, color: hrBadgeColor, borderColor: `${hrBadgeColor}40` }}>
              <span style={{ ...styles.badgeDot, backgroundColor: hrBadgeColor }} />
              <span>Status: {hrStatusText} (60–100 Nom)</span>
            </div>
          </div>

          {/* Blood Oxygen SpO2 Display */}
          <div style={styles.metricCard}>
            <div style={styles.metricTop}>
              <div style={styles.iconCircleTeal}>
                <Activity size={18} color="#0284C7" />
              </div>
              <span style={styles.metricName}>BLOOD OXYGEN (SpO2)</span>
            </div>

            <div style={styles.largeNumRow}>
              <span style={styles.largeNum}>{spo2}</span>
              <span style={styles.largeUnit}>%</span>
            </div>

            <div style={{ ...styles.thresholdBadge, backgroundColor: `${spO2BadgeColor}15`, color: spO2BadgeColor, borderColor: `${spO2BadgeColor}40` }}>
              <span style={{ ...styles.badgeDot, backgroundColor: spO2BadgeColor }} />
              <span>Status: {spO2StatusText} (≥95% Nom)</span>
            </div>
          </div>

          {/* Environmental Sensing (BMP280) */}
          <div style={styles.metricCard}>
            <div style={styles.metricTop}>
              <div style={styles.iconCircleBlue}>
                <Compass size={18} color="#2563EB" />
              </div>
              <span style={styles.metricName}>BAROMETRIC & ALTITUDE</span>
            </div>

            <div style={styles.envGrid}>
              <div style={styles.envItem}>
                <span style={styles.envLabel}>ALTITUDE</span>
                <span style={styles.envValue}>{altitudeM} m</span>
              </div>
              <div style={styles.envItem}>
                <span style={styles.envLabel}>PRESSURE</span>
                <span style={styles.envValue}>{pressureHpa} hPa</span>
              </div>
              <div style={styles.envItem}>
                <span style={styles.envLabel}>TEMPERATURE</span>
                <span style={styles.envValue}>{temperatureC}°C</span>
              </div>
            </div>

            <div style={styles.normalEnvPill}>
              <span>BMP280 Calibrated</span>
            </div>
          </div>
        </div>

        {/* Real-Time Waveform Trace Sparkline */}
        <div style={styles.sparklineBox}>
          <div style={styles.sparklineHeader}>
            <span style={styles.sparklineTitle}>HEART RATE REAL-TIME WAVEFORM TRACE (BPM)</span>
            <span style={styles.sparklineLegend}>Sampling Rate: 50 Hz</span>
          </div>

          <ResponsiveContainer width="100%" height={90}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="mintGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis domain={[50, 130]} hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B132B',
                  borderColor: '#93C5FD',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '11px',
                }}
              />
              <Area type="monotone" dataKey="hr" stroke="#0284C7" strokeWidth={2.5} fillOpacity={1} fill="url(#mintGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

const styles = {
  sectionWrapper: {
    padding: '0 clamp(14px, 4vw, 20px) 28px clamp(14px, 4vw, 20px)',
  },
  card: {
    backgroundColor: '#EEF6FF', // Ice Blue Frost signature surface
    color: '#0B132B',
    borderRadius: 'var(--radius-largecards)',
    padding: 'clamp(20px, 4.5vw, 36px) clamp(16px, 4.5vw, 32px)',
    boxShadow: 'rgba(2, 132, 199, 0.08) 1px 0px 12px 2px',
    border: '1px solid #C8D7EB',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  headline: {
    fontSize: '22px',
    fontWeight: '500',
    color: '#0B132B',
    letterSpacing: '-0.08px',
    margin: '4px 0 0 0',
  },
  subhead: {
    fontSize: '14px',
    color: '#2C4263',
    margin: '4px 0 0 0',
    maxWidth: '600px',
    lineHeight: '1.45',
  },
  statusPillDark: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#38BDF8',
    color: '#0B132B',
    borderRadius: '56px',
    padding: '7px 16px',
    boxShadow: '0 2px 10px rgba(56, 189, 248, 0.25)',
  },
  statusPillText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0B132B',
    letterSpacing: '-0.08px',
  },
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '22px',
    border: '1px solid #C8D7EB',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  metricTop: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '10px',
  },
  iconCircleRed: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleTeal: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleBlue: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricName: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#2C4263',
    letterSpacing: '0.45px',
  },
  largeNumRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'baseline',
    gap: '6px',
  },
  largeNum: {
    fontSize: '40px',
    fontWeight: '600',
    color: '#0B132B',
    letterSpacing: '-0.08px',
    lineHeight: '1.05',
  },
  largeUnit: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#64748B',
  },
  thresholdBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '56px',
    fontSize: '11px',
    fontWeight: '600',
    border: '1px solid',
    width: 'fit-content',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  envGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  envItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  envLabel: {
    fontSize: '8px',
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: '0.3px',
  },
  envValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0B132B',
  },
  normalEnvPill: {
    backgroundColor: '#E0F2FE',
    padding: '4px 10px',
    borderRadius: '56px',
    fontSize: '10px',
    fontWeight: '600',
    color: '#1E3A8A',
    width: 'fit-content',
    marginTop: 'auto',
  },
  sparklineBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '16px 20px',
    border: '1px solid #C8D7EB',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  sparklineHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sparklineTitle: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#2C4263',
    letterSpacing: '0.45px',
  },
  sparklineLegend: {
    fontSize: '10px',
    color: '#64748B',
  },
};
