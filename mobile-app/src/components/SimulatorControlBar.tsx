import React from 'react';
import { Cpu, AlertTriangle, ShieldAlert, Radio, DollarSign, Eye, Heart, AlertOctagon } from 'lucide-react';

interface SimulatorControlBarProps {
  onTriggerAction: (action: string, value?: any) => void;
}

export const SimulatorControlBar: React.FC<SimulatorControlBarProps> = ({ onTriggerAction }) => {
  return (
    <div className="glass-card" style={styles.container}>
      <div style={styles.header}>
        <Cpu size={18} color="#00F2FE" style={{ marginRight: 6 }} />
        <span style={styles.title}>Hardware Telemetry & Event Simulator Control Bar</span>
      </div>

      <div style={styles.buttonGrid}>
        {/* Fall Triggers */}
        <button onClick={() => onTriggerAction('CANE_FALL')} style={styles.triggerBtnAmber}>
          <AlertTriangle size={14} style={{ marginRight: 4 }} />
          Cane Fall (F_cane=1)
        </button>

        <button onClick={() => onTriggerAction('BAND_FALL')} style={styles.triggerBtnAmber}>
          <AlertTriangle size={14} style={{ marginRight: 4 }} />
          Band Fall (F_band=1)
        </button>

        <button onClick={() => onTriggerAction('DUAL_FALL')} style={styles.triggerBtnRed}>
          <ShieldAlert size={14} style={{ marginRight: 4 }} />
          Dual Fall (High Confidence)
        </button>

        {/* SOS Button */}
        <button onClick={() => onTriggerAction('SOS_PRESS')} style={styles.triggerBtnSos}>
          <AlertOctagon size={14} style={{ marginRight: 4 }} />
          Press Band SOS Button
        </button>

        {/* YOLO Vision Triggers */}
        <button onClick={() => onTriggerAction('CURRENCY_500')} style={styles.triggerBtnCyan}>
          <DollarSign size={14} style={{ marginRight: 4 }} />
          YOLO: 500 INR Note
        </button>

        <button onClick={() => onTriggerAction('CURRENCY_200')} style={styles.triggerBtnCyan}>
          <DollarSign size={14} style={{ marginRight: 4 }} />
          YOLO: 200 INR Note
        </button>

        <button onClick={() => onTriggerAction('PERSON_SCAN')} style={styles.triggerBtnCyan}>
          <Eye size={14} style={{ marginRight: 4 }} />
          YOLO: Person Ahead
        </button>

        {/* Ultrasonic & Vitals */}
        <button onClick={() => onTriggerAction('OBSTACLE_APPROACH', 0.6)} style={styles.triggerBtnBlue}>
          <Radio size={14} style={{ marginRight: 4 }} />
          Obstacle Ahead (0.6m)
        </button>

        <button onClick={() => onTriggerAction('VITALS_SPIKE', { hr: 128, spo2: 88 })} style={styles.triggerBtnRose}>
          <Heart size={14} style={{ marginRight: 4 }} />
          Vitals Spike (128 BPM)
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '14px 20px',
    margin: '0 20px 20px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  header: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: '700',
    color: '#F8FAFC',
  },
  title: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#F8FAFC',
  },
  buttonGrid: {
    display: 'flex',
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  triggerBtnAmber: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    color: '#F59E0B',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  triggerBtnRed: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    border: '1px solid #EF4444',
    color: '#EF4444',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  triggerBtnSos: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: '#EF4444',
    border: 'none',
    color: '#FFFFFF',
    padding: '6px 14px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  triggerBtnCyan: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    border: '1px solid rgba(0, 242, 254, 0.3)',
    color: '#00F2FE',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  triggerBtnBlue: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: '#38BDF8',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  triggerBtnRose: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    border: '1px solid rgba(244, 63, 94, 0.4)',
    color: '#F43F5E',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
