import React from 'react';
import { Cpu, AlertTriangle, ShieldAlert, Radio, DollarSign, Eye, Heart, AlertOctagon } from 'lucide-react';

interface SimulatorControlBarProps {
  onTriggerAction: (action: string, value?: any) => void;
}

export const SimulatorControlBar: React.FC<SimulatorControlBarProps> = ({ onTriggerAction }) => {
  return (
    <div style={styles.outerWrapper}>
      <div className="deep-abyss-card dadaist-sim-panel" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconBox}>
            <Cpu size={16} color="#38BDF8" />
          </div>
          <div>
            <span className="eyebrow-label">EMBEDDED HARDWARE SIMULATION RIG</span>
            <h3 style={styles.title}>Event Injector & Test Console</h3>
          </div>
        </div>

        <div style={styles.buttonCluster}>
          {/* Fall Verification Injection */}
          <button
            onClick={() => onTriggerAction('CANE_FALL')}
            style={styles.pillYellow}
          >
            <AlertTriangle size={13} style={{ marginRight: 5 }} />
            <span>Cane Fall (F_cane=1)</span>
          </button>

          <button
            onClick={() => onTriggerAction('BAND_FALL')}
            style={styles.pillYellow}
          >
            <AlertTriangle size={13} style={{ marginRight: 5 }} />
            <span>Band Fall (F_band=1)</span>
          </button>

          <button
            onClick={() => onTriggerAction('DUAL_FALL')}
            style={styles.pillAlert}
          >
            <ShieldAlert size={13} style={{ marginRight: 5 }} />
            <span>Dual Impact (High Conf)</span>
          </button>

          <button
            onClick={() => onTriggerAction('SOS_PRESS')}
            style={styles.pillWhiteGhost}
          >
            <AlertOctagon size={13} style={{ marginRight: 5 }} />
            <span>Press SOS Button</span>
          </button>

          {/* YOLO Object Detections */}
          <button
            onClick={() => onTriggerAction('CURRENCY_500')}
            style={styles.pillDark}
          >
            <DollarSign size={13} color="#38BDF8" style={{ marginRight: 5 }} />
            <span>YOLO: 500 INR</span>
          </button>

          <button
            onClick={() => onTriggerAction('CURRENCY_200')}
            style={styles.pillDark}
          >
            <DollarSign size={13} color="#38BDF8" style={{ marginRight: 5 }} />
            <span>YOLO: 200 INR</span>
          </button>

          <button
            onClick={() => onTriggerAction('PERSON_SCAN')}
            style={styles.pillDark}
          >
            <Eye size={13} color="#38BDF8" style={{ marginRight: 5 }} />
            <span>YOLO: Person Ahead</span>
          </button>

          {/* Ultrasonic & Biometrics */}
          <button
            onClick={() => onTriggerAction('OBSTACLE_APPROACH', 0.6)}
            style={styles.pillDark}
          >
            <Radio size={13} color="#8CA2C2" style={{ marginRight: 5 }} />
            <span>Obstacle (0.6m)</span>
          </button>

          <button
            onClick={() => onTriggerAction('VITALS_SPIKE', { hr: 128, spo2: 88 })}
            style={styles.pillYellow}
          >
            <Heart size={13} style={{ marginRight: 5 }} />
            <span>Vitals Spike (128 BPM)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  outerWrapper: {
    padding: '0 clamp(14px, 4vw, 20px) 24px clamp(14px, 4vw, 20px)',
  },
  card: {
    backgroundColor: '#0F1D38',
    borderRadius: '20px',
    padding: 'clamp(16px, 4vw, 24px)',
    border: '1px solid rgba(56, 189, 248, 0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.08)',
  },
  header: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '10px',
  },
  iconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#0B132B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(56, 189, 248, 0.3)',
  },
  title: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#FFFFFF',
    margin: 0,
    letterSpacing: '-0.08px',
  },
  buttonCluster: {
    display: 'flex',
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  pillYellow: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 205, 72, 0.12)',
    border: '1px solid #FFCD48',
    color: '#FFCD48',
    borderRadius: '56px',
    padding: '7px 16px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '-0.08px',
  },
  pillAlert: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 205, 72, 0.25)',
    border: '1.5px solid #FFCD48',
    color: '#FFFFFF',
    borderRadius: '56px',
    padding: '7px 16px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '-0.08px',
  },
  pillWhiteGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: '1px solid #FFFFFF',
    color: '#FFFFFF',
    borderRadius: '56px',
    padding: '7px 16px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '-0.08px',
  },
  pillDark: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    color: '#FFFFFF',
    borderRadius: '56px',
    padding: '7px 16px',
    fontSize: '12px',
    fontWeight: '400',
    cursor: 'pointer',
    letterSpacing: '-0.08px',
    transition: 'border-color 0.15s ease',
  },
};
