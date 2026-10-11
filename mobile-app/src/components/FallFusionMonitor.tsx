import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, XCircle, PhoneCall } from 'lucide-react';
import { FallAlertState } from '../types/telemetry';

interface FallFusionMonitorProps {
  activeAlert: FallAlertState | null;
  onCancelAlert: () => void;
}

export const FallFusionMonitor: React.FC<FallFusionMonitorProps> = ({
  activeAlert,
  onCancelAlert,
}) => {
  const status = activeAlert?.status || 'IDLE';
  const confidence = activeAlert?.confidence || 'NONE';

  const isHighAlert = status === 'HIGH_CONFIDENCE_ALERT';
  const isLowWarning = status === 'LOW_CONFIDENCE_WARNING';
  const isEscalated = status === 'ESCALATED_TO_CAREGIVER';

  return (
    <div
      className={`glass-card ${isHighAlert || isEscalated ? 'critical-alert-card' : ''}`}
      style={{
        ...styles.container,
        borderColor: isHighAlert || isEscalated ? '#EF4444' : isLowWarning ? '#F59E0B' : 'rgba(255,255,255,0.12)'
      }}
    >
      <div style={styles.header}>
        <div style={styles.titleRow}>
          {isHighAlert || isEscalated ? (
            <ShieldAlert size={22} color="#EF4444" style={{ marginRight: 8 }} />
          ) : isLowWarning ? (
            <AlertTriangle size={22} color="#F59E0B" style={{ marginRight: 8 }} />
          ) : (
            <CheckCircle size={22} color="#10B981" style={{ marginRight: 8 }} />
          )}

          <div>
            <span style={styles.title}>Algorithm 2: Cross-Device Fall Verification</span>
            <span style={styles.subtitle}>
              Fuses candidate flags F_cane & F_band within Δt = 3.0s window
            </span>
          </div>
        </div>

        <div style={{
          ...styles.confidenceBadge,
          backgroundColor: isHighAlert ? 'rgba(239, 68, 68, 0.25)' : isLowWarning ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.15)',
          color: isHighAlert ? '#EF4444' : isLowWarning ? '#F59E0B' : '#10B981',
          borderColor: isHighAlert ? '#EF4444' : isLowWarning ? '#F59E0B' : '#10B981',
        }}>
          Status: {status.replace(/_/g, ' ')}
        </div>
      </div>

      {/* Main Alert Message Banner */}
      <div style={{
        ...styles.messageBox,
        backgroundColor: isHighAlert || isEscalated ? 'rgba(239, 68, 68, 0.15)' : isLowWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0,0,0,0.25)',
      }}>
        <span style={{
          ...styles.messageText,
          color: isHighAlert || isEscalated ? '#F8FAFC' : isLowWarning ? '#FEF3C7' : '#94A3B8'
        }}>
          {activeAlert?.message || 'Both Smart Cane & Smart Band IMUs report normal posture and motion. Fall fusion monitoring active.'}
        </span>
      </div>

      {/* SOS 30-Second Countdown Modal for Single-Device Warning */}
      {isLowWarning && (
        <div style={styles.sosCountdownContainer}>
          <div style={styles.sosHeader}>
            <Clock size={18} color="#F59E0B" style={{ marginRight: 6 }} />
            <span style={styles.sosTitle}>SOS Response Window Active (T_resp = 30s)</span>
          </div>

          <div style={styles.counterCircle}>
            <span style={styles.counterNumber}>{activeAlert?.sosWindowRemainingSec ?? 30}s</span>
            <span style={styles.counterLabel}>REMAINING TO CANCEL</span>
          </div>

          <div style={styles.actionButtonsRow}>
            <button onClick={onCancelAlert} style={styles.cancelBtn}>
              <XCircle size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              CANCEL FALSE ALARM (SOS BUTTON)
            </button>
          </div>
        </div>
      )}

      {/* High-Confidence Escalation Banner */}
      {(isHighAlert || isEscalated) && (
        <div style={styles.escalationBox}>
          <PhoneCall size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <span style={styles.escalationText}>
            EMERGENCY CALL DISPATCHED: Caregiver & Emergency Contacts Notified!
          </span>
        </div>
      )}
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
    border: '1px solid',
  },
  header: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  titleRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
  },
  title: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#F8FAFC',
    display: 'block',
  },
  subtitle: {
    fontSize: '11px',
    color: '#64748B',
    display: 'block',
  },
  confidenceBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid',
  },
  messageBox: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  messageText: {
    fontSize: '13px',
    fontWeight: '600',
    lineHeight: '1.4',
  },
  sosCountdownContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: '16px',
    borderRadius: '12px',
    border: '1px dashed rgba(245, 158, 11, 0.4)',
  },
  sosHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
  },
  sosTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#F59E0B',
  },
  counterCircle: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    borderRadius: '40px',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    border: '2px solid #F59E0B',
  },
  counterNumber: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#F59E0B',
  },
  counterLabel: {
    fontSize: '7px',
    fontWeight: '700',
    color: '#FEF3C7',
    letterSpacing: '0.5px',
  },
  actionButtonsRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '10px',
  },
  cancelBtn: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: '#10B981',
    border: 'none',
    color: '#FFFFFF',
    padding: '8px 16px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
  },
  escalationBox: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: '#EF4444',
    padding: '12px 16px',
    borderRadius: '10px',
  },
  escalationText: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#FFFFFF',
  },
};
