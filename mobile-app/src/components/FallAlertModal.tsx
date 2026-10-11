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
  if (!isOpen || !alertState || alertState.status === 'IDLE') return null;

  const status = alertState.status;
  const isHighAlert = status === 'HIGH_CONFIDENCE_ALERT';
  const isEscalated = status === 'ESCALATED_TO_CAREGIVER';
  const isLowWarning = status === 'LOW_CONFIDENCE_WARNING';
  const remainingSeconds = alertState.sosWindowRemainingSec ?? 30;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContainer}>
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

          <div style={styles.confidencePill}>
            <span>{isHighAlert ? 'High Confidence (Dual)' : 'Low Confidence (Single)'}</span>
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
              <span style={{ ...styles.metricVal, color: isHighAlert ? '#FFCD48' : '#3DDC91' }}>
                {isHighAlert ? '1 (Active)' : 'Checked'}
              </span>
            </div>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>BAND FLAG (F_BAND)</span>
              <span style={{ ...styles.metricVal, color: isHighAlert ? '#FFCD48' : '#3DDC91' }}>
                {isHighAlert ? '1 (Active)' : 'Checked'}
              </span>
            </div>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>AES-256 INTEGRITY</span>
              <span style={{ ...styles.metricVal, color: '#3DDC91' }}>Verified Tag</span>
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

            <button
              onClick={onCancelAlert}
              className="pill-btn-primary"
              style={styles.cancelPillButton}
            >
              <X size={18} color="#132322" style={{ marginRight: 8 }} />
              <span>Cancel False Alarm (SOS Dismiss)</span>
            </button>
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

              {onCloseModal && (
                <button
                  onClick={onCloseModal}
                  className="pill-btn-dark"
                  style={styles.dismissPill}
                >
                  <span>Close Window</span>
                </button>
              )}
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
    backgroundColor: 'rgba(7, 15, 15, 0.88)',
    backdropFilter: 'blur(12px)',
    zIndex: 400,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  modalContainer: {
    width: '100%',
    maxWidth: '560px',
    backgroundColor: '#0E1A19',
    borderRadius: '32px',
    border: '1.5px solid #FFCD48',
    padding: '32px',
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
  },
  alertHeadline: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
    margin: '2px 0 0 0',
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
  detailCard: {
    backgroundColor: '#132322',
    borderRadius: '20px',
    padding: '18px 20px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
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
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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
    color: '#828786',
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
    backgroundColor: '#132322',
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
    color: '#828786',
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
    color: '#828786',
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
    backgroundColor: '#132322',
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
  },
  overridePill: {
    padding: '10px 22px',
    borderRadius: '56px',
  },
  dismissPill: {
    padding: '10px 20px',
    borderRadius: '56px',
  },
};
