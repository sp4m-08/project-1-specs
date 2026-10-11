import React, { useState, useEffect } from 'react';
import { Heart, Activity, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface VitalsPoint {
  time: string;
  hr: number;
  spo2: number;
  alert: number;
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
    const isAlert = currentHr > 120 || currentSpO2 < 90 ? 100 : 0;

    setData((prev) => {
      const next = [...prev, { time: nowStr, hr: currentHr, spo2: currentSpO2, alert: isAlert }];
      if (next.length > 25) next.shift();
      return next;
    });
  }, [currentHr, currentSpO2]);

  const isHrAlert = currentHr < 50 || currentHr > 120;
  const isSpO2Alert = currentSpO2 < 90;

  return (
    <div className="glass-card" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <Heart size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <span style={styles.title}>Live Health Telemetry Trace (MAX30100)</span>
        </div>

        <div style={styles.vitalsPills}>
          <div style={{
            ...styles.pill,
            backgroundColor: isHrAlert ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: isHrAlert ? '#EF4444' : 'rgba(239, 68, 68, 0.3)'
          }}>
            <Heart size={14} color="#EF4444" style={{ marginRight: 4 }} />
            <span style={styles.pillLabel}>Heart Rate: </span>
            <span style={styles.pillVal}>{currentHr} BPM</span>
          </div>

          <div style={{
            ...styles.pill,
            backgroundColor: isSpO2Alert ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.1)',
            borderColor: isSpO2Alert ? '#EF4444' : 'rgba(56, 189, 248, 0.3)'
          }}>
            <Activity size={14} color="#38BDF8" style={{ marginRight: 4 }} />
            <span style={styles.pillLabel}>Blood Oxygen: </span>
            <span style={{ ...styles.pillVal, color: '#38BDF8' }}>{currentSpO2}% SpO2</span>
          </div>
        </div>
      </div>

      <div style={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
            <YAxis domain={[40, 140]} stroke="#64748B" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#131B2A',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '12px',
              }}
            />
            <ReferenceLine y={120} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Critical HR (120)', fill: '#EF4444', fontSize: 10 }} />
            <ReferenceLine y={90} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'Warning SpO2 (90%)', fill: '#F59E0B', fontSize: 10 }} />
            
            <Area type="monotone" dataKey="hr" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#hrGrad)" name="Heart Rate (BPM)" />
            <Area type="monotone" dataKey="spo2" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#spo2Grad)" name="SpO2 (%)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.footerInfo}>
        <span style={styles.footerText}>
          Table IV Thresholds: Normal (60-100 BPM / ≥95% SpO2) | Warning (50-60 or 100-120 BPM / 90-94% SpO2) | Critical (&lt;50 or &gt;120 BPM / &lt;90% SpO2)
        </span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '18px 20px',
    margin: '0 20px 16px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  header: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#F8FAFC',
  },
  vitalsPills: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '10px',
  },
  pill: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid',
  },
  pillLabel: {
    fontSize: '12px',
    color: '#94A3B8',
    marginRight: '4px',
  },
  pillVal: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#EF4444',
  },
  chartWrapper: {
    width: '100%',
    marginTop: '6px',
  },
  footerInfo: {
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '8px',
  },
  footerText: {
    fontSize: '11px',
    color: '#64748B',
  },
};
