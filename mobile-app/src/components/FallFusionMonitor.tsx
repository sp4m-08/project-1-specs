import React from 'react';
import { ShieldCheck, AlertTriangle, Clock, X, PhoneCall } from 'lucide-react';
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
  const isHighAlert = status === 'HIGH_CONFIDENCE_ALERT';
  const isLowWarning = status === 'LOW_CONFIDENCE_WARNING';
  const isEscalated = status === 'ESCALATED_TO_CAREGIVER';
  const isNormal = !isHighAlert && !isLowWarning && !isEscalated;

  if (!isNormal) {
    // High-alert or warning view
    return (
      <div style={styles.alertContainer}>
        <div style={styles.alertCard}>
          <div style={styles.alertHeader}>
            <div style={styles.alertTitleRow}>
              <AlertTriangle size={22} color={isHighAlert || isEscalated ? '#FFFFFF' : '#FFCD48'} />
              <div>
                <span className="eyebrow-label" style={{ color: isHighAlert || isEscalated ? '#FFFFFF' : '#FFCD48' }}>
                  ALGORITHM 2 CRITICAL SIGNAL
                </span>
                <h3 style={styles.alertHeading}>{status.replace(/_/g, ' ')}</h3>
              </div>
            </div>

            <span style={styles.alertWindowBadge}>Δt = 3.0s Matched</span>
          </div>

          <p style={styles.alertMessage}>
            {activeAlert?.message || 'Cross-device fall event detected across Smart Cane & Smart Band.'}
          </p>

          {isLowWarning && (
            <div style={styles.sosCountdownBox}>
              <div style={styles.sosTimerRow}>
                <Clock size={16} color="#FFCD48" />
                <span style={styles.sosTimerText}>
                  Cancel window active: <strong>{activeAlert?.sosWindowRemainingSec ?? 30}s remaining</strong>
                </span>
              </div>
              <button onClick={onCancelAlert} className="pill-btn-primary" style={styles.cancelAlarmPill}>
                <X size={16} color="#0B132B" style={{ marginRight: 6 }} />
                <span>Cancel False Alarm</span>
              </button>
            </div>
          )}

          {(isHighAlert || isEscalated) && (
            <div style={styles.escalationDispatch}>
              <PhoneCall size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <span style={styles.escalationText}>Emergency Telephony Dispatched to Primary Caregiver</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Signature Ice Blue Frost Content Card (#eef6ff, 60px radius)
  return (
    <div style={styles.wrapper}>
      <div className="mint-frost-card" style={styles.mintCard}>
        <div style={styles.mintHeader}>
          <div style={styles.titleStack}>
            <span className="eyebrow-label-dark">ALGORITHM 2 • SENSOR FUSION ENGINE</span>
            <h2 style={styles.mintHeadline}>Cross-Device Fall Verification</h2>
            <p style={styles.mintBody}>
              Continuous temporal correlation window (Δt = 3.0s). Eliminates isolated cane drops and wrist impacts through bi-directional verification.
            </p>
          </div>

          <div style={styles.statusPill}>
            <ShieldCheck size={16} color="#0B132B" />
            <span style={styles.statusPillText}>Nominal State</span>
          </div>
        </div>

        <div style={styles.mintSpecsGrid}>
          <div style={styles.specTile}>
            <span style={styles.specLabel}>CANE IMU (F_cane)</span>
            <span style={styles.specValue}>0 (Normal)</span>
          </div>
          <div style={styles.specTile}>
            <span style={styles.specLabel}>BAND IMU (F_band)</span>
            <span style={styles.specValue}>0 (Normal)</span>
          </div>
          <div style={styles.specTile}>
            <span style={styles.specLabel}>FUSION WINDOW</span>
            <span style={styles.specValue}>Δt ≤ 3.0s</span>
          </div>
          <div style={styles.specTile}>
            <span style={styles.specLabel}>SOS WINDOW</span>
            <span style={styles.specValue}>T_resp = 30s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    padding: '0 20px 24px 20px',
  },
  mintCard: {
    backgroundColor: '#EEF6FF', // Ice Blue Frost surface
    color: '#0B132B',
    borderRadius: '60px',
    padding: '36px 32px',
    boxShadow: 'rgba(2, 132, 199, 0.08) 1px 0px 12px 2px',
    border: '1px solid #C8D7EB',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  mintHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  titleStack: {
    flex: 1,
    minWidth: '240px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  mintHeadline: {
    fontSize: '22px',
    fontWeight: '500',
    color: '#0B132B',
    letterSpacing: '-0.08px',
    margin: 0,
    lineHeight: '1.2',
  },
  mintBody: {
    fontSize: '14px',
    color: '#2C4263',
    lineHeight: '1.45',
    margin: 0,
    maxWidth: '560px',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#38BDF8',
    color: '#0B132B',
    borderRadius: '56px',
    padding: '8px 16px',
    fontWeight: '600',
    fontSize: '13px',
    alignSelf: 'flex-start' as const,
    boxShadow: '0 2px 10px rgba(56, 189, 248, 0.25)',
  },
  statusPillText: {
    color: '#0B132B',
    fontWeight: '600',
  },
  mintSpecsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '12px',
    paddingTop: '16px',
    borderTop: '1px solid #C8D7EB',
  },
  specTile: {
    backgroundColor: '#FFFFFF',
    padding: '12px 14px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    border: '1px solid #C8D7EB',
  },
  specLabel: {
    fontSize: '9px',
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: '0.45px',
    textTransform: 'uppercase' as const,
  },
  specValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0B132B',
    letterSpacing: '-0.08px',
  },
  alertContainer: {
    padding: '0 20px 24px 20px',
  },
  alertCard: {
    backgroundColor: '#0F1D38',
    border: '2px solid #FFCD48',
    borderRadius: '24px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    boxShadow: '0 4px 20px rgba(255, 205, 72, 0.15)',
  },
  alertHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  alertTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  alertHeading: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#FFFFFF',
    margin: 0,
  },
  alertWindowBadge: {
    backgroundColor: 'rgba(255, 205, 72, 0.15)',
    color: '#FFCD48',
    padding: '4px 10px',
    borderRadius: '56px',
    fontSize: '11px',
    fontWeight: '500',
  },
  alertMessage: {
    fontSize: '14px',
    color: '#FFFFFF',
    margin: 0,
    lineHeight: '1.4',
  },
  sosCountdownBox: {
    backgroundColor: '#0B132B',
    border: '1px solid rgba(255, 205, 72, 0.4)',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
  },
  sosTimerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sosTimerText: {
    fontSize: '13px',
    color: '#FFCD48',
  },
  cancelAlarmPill: {
    padding: '10px 24px',
    borderRadius: '56px',
  },
  escalationDispatch: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#070D1E',
    border: '1px solid #FFCD48',
    padding: '12px 16px',
    borderRadius: '12px',
  },
  escalationText: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#FFFFFF',
  },
};
