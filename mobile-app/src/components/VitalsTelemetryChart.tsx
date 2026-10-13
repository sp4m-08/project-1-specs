import React, { useState, useEffect } from 'react';
import { Heart, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface VitalsPoint {
  time: string;
  hr: number;
  spo2: number;
}

interface VitalsTelemetryChartProps {
  currentHr: number;
  currentSpO2: number;
}

export const VitalsTelemetryChart: React.FC<VitalsTelemetryChartProps> = ({
  currentHr,
  currentSpO2,
}) => {
  const [data, setData] = useState<VitalsPoint[]>([]);

  useEffect(() => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setData((prev) => {
      const next = [...prev, { time: nowStr, hr: currentHr, spo2: currentSpO2 }];
      if (next.length > 25) next.shift();
      return next;
    });
  }, [currentHr, currentSpO2]);

  const isHrAlert = currentHr < 50 || currentHr > 120;
  const isSpO2Alert = currentSpO2 < 90;

  return (
    <div style={styles.outerWrapper}>
      <div className="deep-abyss-card" style={styles.card}>
        <div style={styles.header}>
          <div>
            <span className="eyebrow-label">MAX30100 OPTICAL SENSOR TRACE</span>
            <h3 style={styles.title}>Biometric Waveform & Telemetry</h3>
          </div>

          <div style={styles.pillsCluster}>
            <div style={{
              ...styles.metricPill,
              borderColor: isHrAlert ? '#FFCD48' : 'rgba(56, 189, 248, 0.25)',
            }}>
              <Heart size={14} color="#38BDF8" style={{ marginRight: 6 }} />
              <span style={styles.pillLabel}>Heart Rate:</span>
              <span style={{
                ...styles.pillValue,
                color: isHrAlert ? '#FFCD48' : '#38BDF8',
              }}>
                {currentHr} BPM
              </span>
            </div>

            <div style={{
              ...styles.metricPill,
              borderColor: isSpO2Alert ? '#FFCD48' : 'rgba(56, 189, 248, 0.25)',
            }}>
              <Activity size={14} color="#93C5FD" style={{ marginRight: 6 }} />
              <span style={styles.pillLabel}>SpO2:</span>
              <span style={{
                ...styles.pillValue,
                color: isSpO2Alert ? '#FFCD48' : '#93C5FD',
              }}>
                {currentSpO2}%
              </span>
            </div>
          </div>
        </div>

        <div style={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="neonPulseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="mintWhisperGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#93C5FD" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#93C5FD" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#8CA2C2" fontSize={10} tickLine={false} />
              <YAxis domain={[40, 140]} stroke="#8CA2C2" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070D1E',
                  borderColor: 'rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine y={120} stroke="#FFCD48" strokeDasharray="3 3" label={{ value: 'Threshold 120 BPM', fill: '#FFCD48', fontSize: 10 }} />
              <ReferenceLine y={90} stroke="#FFCD48" strokeDasharray="3 3" label={{ value: 'SpO2 Warning 90%', fill: '#FFCD48', fontSize: 10 }} />

              <Area type="monotone" dataKey="hr" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#neonPulseGrad)" name="Heart Rate (BPM)" />
              <Area type="monotone" dataKey="spo2" stroke="#93C5FD" strokeWidth={1.5} fillOpacity={1} fill="url(#mintWhisperGrad)" name="SpO2 (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.footerNote}>
          <span style={styles.footerText}>
            Medical Range Standards: Normal (60–100 BPM / ≥95% SpO2) • Warning (100–120 BPM / 90–94%) • Critical (&gt;120 BPM / &lt;90%)
          </span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  outerWrapper: {
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
  header: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: '14px',
  },
  title: {
    fontSize: '17px',
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
    margin: '4px 0 0 0',
  },
  pillsCluster: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  metricPill: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    borderRadius: '56px',
    padding: '6px 14px',
  },
  pillLabel: {
    fontSize: '11px',
    color: '#8CA2C2',
    marginRight: '6px',
  },
  pillValue: {
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: 'JetBrains Mono, monospace',
  },
  chartWrapper: {
    width: '100%',
    paddingTop: '6px',
  },
  footerNote: {
    borderTop: '1px solid rgba(56, 189, 248, 0.1)',
    paddingTop: '12px',
  },
  footerText: {
    fontSize: '10px',
    color: '#8CA2C2',
    lineHeight: '1.4',
  },
};
