import React from 'react';
import { AlertTriangle, ShieldAlert, PhoneCall, X, CheckCircle } from 'lucide-react';
import { FallAlertState } from '../types/telemetry';

interface FallAlertModalProps {
  alertState: FallAlertState | null;
  isOpen: boolean;
  onCancelAlert: () => void;
  onAcknowledgeAlert?: () => void;
  onCloseModal?: () => void;
}

/**
 * FallAlertModal — Two-tier cross-device fall verification and caregiver review.
 * Implements the repository's fall fusion rules:
 * - Tier 1: Single Device Trigger (F_cane=1 XOR F_band=1):
 *   Low-confidence warning initiating a 30-second SOS confirm/cancel response window.
 * - Tier 2: Dual Device Agreement (|t_c - t_b| <= \Delta t = 3.0s):
 *   High-confidence fall event is surfaced for caregiver review; external dispatch is not implemented.
 */
export const FallAlertModal: React.FC<FallAlertModalProps> = ({
  alertState,
  isOpen,
  onCancelAlert,
  onAcknowledgeAlert,
  onCloseModal,
}) => {
  if (!isOpen || !alertState || alertState.status === 'IDLE' || alertState.status === 'CANCELLED_BY_USER') return null;

  const status = alertState.status;
  const isHighAlert = status === 'HIGH_CONFIDENCE_ALERT';
  const isEscalated = status === 'ESCALATED_TO_CAREGIVER';
  const isLowWarning = status === 'LOW_CONFIDENCE_WARNING';
  const remainingSeconds = alertState.sosWindowRemainingSec ?? 30;

  const handleClose = () => {
    if (onCloseModal) {
      onCloseModal();
    } else {
      onCancelAlert();
    }
  };

  return (
    <div
      style={styles.modalOverlay}
      className="dadaist-fall-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fall-alert-title"
    >
      <div
        style={styles.modalContainer}
        className="dadaist-fall-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Badge */}
        <div style={styles.headerRow}>
          <div style={styles.titleWithIcon}>
            {isHighAlert || isEscalated ? (
              <ShieldAlert size={24} color="#FFCD48" />
            ) : (
              <AlertTriangle size={24} color="#FFCD48" />
            )}
            <div>
              <span className="eyebrow-label" style={{ color: '#FFCD48' }}>
                 SAFETY ALERT • TWO-DEVICE CHECK
              </span>
               <h2 id="fall-alert-title" style={styles.alertHeadline}>
                 {isHighAlert || isEscalated ? 'Fall likely confirmed' : 'Possible fall detected'}
              </h2>
            </div>
          </div>

          <div style={styles.headerRightActions}>
            <div style={styles.confidencePill} className="confidence-pill">
               <span>{isHighAlert || isEscalated ? 'Two-device confirmation' : 'Needs confirmation'}</span>
            </div>
            <button
              onClick={handleClose}
              style={styles.closeIconButton}
              className="close-icon-button"
              title="Close and return to dashboard"
              aria-label="Close"
            >
              <X size={18} color="#FFFFFF" />
            </button>
          </div>
        </div>

        {/* Dynamic Detail Card */}
        <div style={styles.detailCard} className="detail-card">
          <p style={styles.alertMessageText}>
            {alertState.message ||
              (isHighAlert
                 ? `The Smart Cane and Smart Band detected impacts within ${((alertState.timeDiffMs ?? 3000) / 1000).toFixed(1)} seconds.`
                 : 'One wearable detected an impact. Check that the wearer is okay before the response window ends.')}
          </p>

          <div style={styles.fusionMetricsGrid}>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>TEMPORAL WINDOW</span>
               <span style={styles.metricVal}>{alertState.timeDiffMs !== undefined ? `Δt = ${(alertState.timeDiffMs / 1000).toFixed(2)}s` : 'Waiting for match'}</span>
            </div>
            <div style={styles.metricItem}>
               <span style={styles.metricLabel}>SMART CANE SIGNAL</span>
              <span style={{ ...styles.metricVal, color: isHighAlert ? '#FFCD48' : '#38BDF8' }}>
                 {alertState.caneEvent ? 'Impact detected' : 'No matching event'}
              </span>
            </div>
            <div style={styles.metricItem}>
                <span style={styles.metricLabel}>SMART BAND SIGNAL</span>
              <span style={{ ...styles.metricVal, color: isHighAlert ? '#FFCD48' : '#38BDF8' }}>
                 {alertState.bandEvent ? 'Impact detected' : 'No matching event'}
              </span>
            </div>
            <div style={styles.metricItem}>
               <span style={styles.metricLabel}>STATUS</span>
               <span style={{ ...styles.metricVal, color: '#38BDF8' }}>{isHighAlert || isEscalated ? 'Review needed' : 'Response window'}</span>
            </div>
          </div>
        </div>

        {/* Tier 1: 30-Second Countdown Window with Cancel Action */}
        {isLowWarning && (
          <div style={styles.countdownSection} className="countdown-section">
            <div style={styles.timerCircle} className="timer-circle">
              <span style={styles.secondsDisplay} className="seconds-display">{remainingSeconds}s</span>
              <span style={styles.timerSublabel} className="timer-sublabel">RESPONSE TIME</span>
            </div>

            <div style={styles.countdownExplainer}>
                 <span style={styles.explainerBold}>Response window active</span>
              <span style={styles.explainerMuted}>
                 If this was not a fall, confirm that the wearer is okay to stop the alert.
              </span>
            </div>

            <div style={styles.buttonCluster}>
              <button
                onClick={onAcknowledgeAlert || handleClose}
                 style={styles.cancelPillButton}
                 className="pill-btn-primary cancel-pill-button"
              >
                <CheckCircle size={18} color="#0B132B" style={{ marginRight: 8 }} />
                 <span>I’m okay — cancel alert</span>
              </button>

              <button
                onClick={handleClose}
                 style={styles.backToDashboardButton}
                 className="pill-btn-dark back-dashboard-button"
              >
                <X size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        )}

        {/* Tier 2: High Confidence Escalation to Caregiver */}
        {(isHighAlert || isEscalated) && (
          <div style={styles.highAlertSection}>
            <div style={styles.emergencyCallBanner} className="emergency-call-banner">
              <div style={styles.phoneIconBox}>
                <PhoneCall size={22} color="#FFFFFF" />
              </div>
              <div>
                   <span style={styles.emergencyCallTitle}>{isEscalated ? 'EMERGENCY CONTACT ACTIONS' : 'CAREGIVER RESPONSE WORKFLOW'}</span>
                   <span style={styles.emergencyCallDesc}>
                   {isEscalated
                     ? 'The response window expired. AURA Assist is attempting the configured native SMS and phone call from this Android device.'
                     : 'High-confidence fall detected. Review the alert and follow your configured care plan.'}
                </span>
              </div>
            </div>

            <div style={styles.actionButtonsCluster}>
              <button
                onClick={onCancelAlert}
                 style={styles.overridePill}
                 className="pill-btn-ghost override-pill"
              >
                 <span>Acknowledge alert</span>
              </button>

              <button
                onClick={handleClose}
                 style={styles.dismissPill}
                 className="pill-btn-dark dismiss-pill"
              >
                <X size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                 <span>Close details</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 13, 30, 0.88)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    zIndex: 400,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 'clamp(10px, 3vw, 20px)',
  },
  modalContainer: {
    width: '100%',
    maxWidth: '560px',
    maxHeight: '92vh',
    overflowY: 'auto' as const,
    backgroundColor: '#0F1D38',
    borderRadius: 'clamp(20px, 4vw, 32px)',
    border: '1.5px solid #FFCD48',
    padding: 'clamp(18px, 4vw, 32px)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  titleWithIcon: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '12px',
    flex: '1 1 auto',
  },
  alertHeadline: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
    margin: '2px 0 0 0',
  },
  headerRightActions: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '10px',
  },
  closeIconButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#FFFFFF',
    transition: 'all 0.2s ease',
  },
  confidencePill: {
    backgroundColor: 'rgba(255, 205, 72, 0.15)',
    color: '#FFCD48',
    border: '1px solid #FFCD48',
    borderRadius: '56px',
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  buttonCluster: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '12px',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    width: '100%',
    marginTop: '6px',
  },
  backToDashboardButton: {
    padding: '12px 24px',
    borderRadius: '56px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  detailCard: {
    backgroundColor: '#0B132B',
    borderRadius: '20px',
    padding: '18px 20px',
    border: '1px solid rgba(56, 189, 248, 0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  alertMessageText: {
    fontSize: '14px',
    color: '#FFFFFF',
    lineHeight: '1.45',
    margin: 0,
  },
  fusionMetricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '10px',
    borderTop: '1px solid rgba(56, 189, 248, 0.15)',
    paddingTop: '12px',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  metricLabel: {
    fontSize: '8px',
    fontWeight: '600',
    color: '#8CA2C2',
    letterSpacing: '0.45px',
    textTransform: 'uppercase' as const,
  },
  metricVal: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'JetBrains Mono, monospace',
  },
  countdownSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
    backgroundColor: 'rgba(255, 205, 72, 0.08)',
    border: '1px dashed #FFCD48',
    borderRadius: '24px',
    padding: '24px 20px',
  },
  timerCircle: {
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    border: '3px solid #FFCD48',
    backgroundColor: '#0B132B',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondsDisplay: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#FFCD48',
    lineHeight: '1',
  },
  timerSublabel: {
    fontSize: '7px',
    fontWeight: '700',
    color: '#8CA2C2',
    letterSpacing: '0.5px',
  },
  countdownExplainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    gap: '4px',
  },
  explainerBold: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  explainerMuted: {
    fontSize: '12px',
    color: '#8CA2C2',
    maxWidth: '420px',
    lineHeight: '1.4',
  },
  cancelPillButton: {
    padding: '12px 28px',
    borderRadius: '56px',
    fontSize: '14px',
    fontWeight: '600',
  },
  highAlertSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  emergencyCallBanner: {
    backgroundColor: '#0B132B',
    border: '1.5px solid #FFCD48',
    borderRadius: '20px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '14px',
  },
  phoneIconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 205, 72, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyCallTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#FFCD48',
    letterSpacing: '0.45px',
    display: 'block',
  },
  emergencyCallDesc: {
    fontSize: '12px',
    color: '#FFFFFF',
    display: 'block',
    marginTop: '2px',
  },
  actionButtonsCluster: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '10px',
    justifyContent: 'flex-end',
    flexWrap: 'wrap' as const,
    width: '100%',
  },
  overridePill: {
    padding: '12px 22px',
    borderRadius: '56px',
    flex: '1 1 220px',
    textAlign: 'center' as const,
  },
  dismissPill: {
    padding: '12px 20px',
    borderRadius: '56px',
    flex: '1 1 120px',
    textAlign: 'center' as const,
  },
};
