import React from 'react';
import { AlertTriangle, ShieldAlert, PhoneCall, Clock, X, CheckCircle, Bell } from 'lucide-react';
import { FallAlertState } from '../types/telemetry';

interface FallAlertModalProps {
  alertState: FallAlertState | null;
  isOpen: boolean;
  onCancelAlert: () => void;
  onCloseModal?: () => void;
}

/**
 * FallAlertModal — Two-Tier Cross-Device Fall Verification & Emergency Alert System
 * Implements Algorithm 2 from the IEEE paper:
 * - Tier 1: Single Device Trigger (F_cane=1 XOR F_band=1):
 *   Low-confidence warning initiating a 30-second SOS confirm/cancel response window.
 * - Tier 2: Dual Device Agreement (|t_c - t_b| <= \Delta t = 3.0s):
 *   Critical high-confidence fall event immediately dispatched to emergency caregivers.
 */
export const FallAlertModal: React.FC<FallAlertModalProps> = ({
  alertState,
  isOpen,
  onCancelAlert,
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
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={styles.modalContainer}
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
                ALGORITHM 2 • CROSS-DEVICE SENSOR FUSION
              </span>
              <h2 style={styles.alertHeadline}>
                {isHighAlert || isEscalated ? 'Critical Fall Event Escalation' : 'Single-Device Fall Warning'}
              </h2>
            </div>
          </div>

          <div style={styles.headerRightActions}>
            <div style={styles.confidencePill}>
              <span>{isHighAlert ? 'High Confidence (Dual)' : 'Low Confidence (Single)'}</span>
            </div>
            <button
              onClick={handleClose}
              style={styles.closeIconButton}
              title="Close and return to dashboard"
              aria-label="Close"
            >
              <X size={18} color="#FFFFFF" />
            </button>
          </div>
        </div>

        {/* Dynamic Detail Card */}
        <div style={styles.detailCard}>
          <p style={styles.alertMessageText}>
            {alertState.message ||
              (isHighAlert
                ? 'Simultaneous impact detected on Smart Cane & Smart Band within Δt = 3.0s. High confidence fall verified.'
                : 'Isolated impact detected on a single wearable device. Awaiting user SOS verification.')}
          </p>

          <div style={styles.fusionMetricsGrid}>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>TEMPORAL WINDOW</span>
              <span style={styles.metricVal}>Δt = 3.00s</span>
            </div>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>CANE FLAG (F_CANE)</span>
              <span style={{ ...styles.metricVal, color: isHighAlert ? '#FFCD48' : '#38BDF8' }}>
                {isHighAlert ? '1 (Active)' : 'Checked'}
              </span>
            </div>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>BAND FLAG (F_BAND)</span>
              <span style={{ ...styles.metricVal, color: isHighAlert ? '#FFCD48' : '#38BDF8' }}>
                {isHighAlert ? '1 (Active)' : 'Checked'}
              </span>
            </div>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>AES-256 INTEGRITY</span>
              <span style={{ ...styles.metricVal, color: '#38BDF8' }}>Verified Tag</span>
            </div>
          </div>
        </div>

        {/* Tier 1: 30-Second Countdown Window with Cancel Action */}
        {isLowWarning && (
          <div style={styles.countdownSection}>
            <div style={styles.timerCircle}>
              <span style={styles.secondsDisplay}>{remainingSeconds}s</span>
              <span style={styles.timerSublabel}>RESPONSE TIME</span>
            </div>

            <div style={styles.countdownExplainer}>
              <span style={styles.explainerBold}>30-Second SOS Response Active (T_resp = 30s)</span>
              <span style={styles.explainerMuted}>
                If false alarm (e.g. dropped cane), press the button below or tap the physical Band SOS button to dismiss.
              </span>
            </div>

            <div style={styles.buttonCluster}>
              <button
                onClick={onCancelAlert}
                className="pill-btn-primary"
                style={styles.cancelPillButton}
              >
                <CheckCircle size={18} color="#0B132B" style={{ marginRight: 8 }} />
                <span>Cancel False Alarm (SOS Dismiss)</span>
              </button>

              <button
                onClick={handleClose}
                className="pill-btn-dark"
                style={styles.backToDashboardButton}
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
            <div style={styles.emergencyCallBanner}>
              <div style={styles.phoneIconBox}>
                <PhoneCall size={22} color="#FFFFFF" />
              </div>
              <div>
                <span style={styles.emergencyCallTitle}>EMERGENCY DISPATCH INITIATED</span>
                <span style={styles.emergencyCallDesc}>
                  Automated SMS & Caregiver Call Sent: +91-98765-43210 (Lat: 12.9716° N, Lon: 77.5946° E)
                </span>
              </div>
            </div>

            <div style={styles.actionButtonsCluster}>
              <button
                onClick={onCancelAlert}
                className="pill-btn-ghost"
                style={styles.overridePill}
              >
                <span>Caregiver Arrived (Acknowledge Alert)</span>
              </button>

              <button
                onClick={handleClose}
                className="pill-btn-dark"
                style={styles.dismissPill}
              >
                <X size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <span>Close Window</span>
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
