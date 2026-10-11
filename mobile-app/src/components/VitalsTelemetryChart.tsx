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
              borderColor: isHrAlert ? '#FFCD48' : 'rgba(255, 255, 255, 0.1)',
            }}>
              <Heart size={14} color="#3DDC91" style={{ marginRight: 6 }} />
              <span style={styles.pillLabel}>Heart Rate:</span>
              <span style={{
                ...styles.pillValue,
                color: isHrAlert ? '#FFCD48' : '#3DDC91',
              }}>
                {currentHr} BPM
              </span>
            </div>

            <div style={{
              ...styles.metricPill,
              borderColor: isSpO2Alert ? '#FFCD48' : 'rgba(255, 255, 255, 0.1)',
            }}>
              <Activity size={14} color="#97DDBC" style={{ marginRight: 6 }} />
              <span style={styles.pillLabel}>SpO2:</span>
              <span style={{
                ...styles.pillValue,
                color: isSpO2Alert ? '#FFCD48' : '#97DDBC',
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
                  <stop offset="5%" stopColor="#3DDC91" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3DDC91" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="mintWhisperGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#97DDBC" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#97DDBC" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#828786" fontSize={10} tickLine={false} />
              <YAxis domain={[40, 140]} stroke="#828786" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070F0F',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine y={120} stroke="#FFCD48" strokeDasharray="3 3" label={{ value: 'Threshold 120 BPM', fill: '#FFCD48', fontSize: 10 }} />
              <ReferenceLine y={90} stroke="#FFCD48" strokeDasharray="3 3" label={{ value: 'SpO2 Warning 90%', fill: '#FFCD48', fontSize: 10 }} />

              <Area type="monotone" dataKey="hr" stroke="#3DDC91" strokeWidth={2} fillOpacity={1} fill="url(#neonPulseGrad)" name="Heart Rate (BPM)" />
              <Area type="monotone" dataKey="spo2" stroke="#97DDBC" strokeWidth={1.5} fillOpacity={1} fill="url(#mintWhisperGrad)" name="SpO2 (%)" />
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
    backgroundColor: '#0E1A19',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
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
    backgroundColor: '#132322',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '56px',
    padding: '6px 14px',
  },
  pillLabel: {
    fontSize: '12px',
    color: '#828786',
    marginRight: '4px',
    letterSpacing: '-0.08px',
  },
  pillValue: {
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '-0.08px',
  },
  chartWrapper: {
    width: '100%',
    marginTop: '4px',
  },
  footerNote: {
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '10px',
  },
  footerText: {
    fontSize: '11px',
    color: '#828786',
    lineHeight: '1.4',
  },
};
