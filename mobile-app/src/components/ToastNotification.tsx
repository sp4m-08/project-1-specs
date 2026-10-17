import React, { useEffect } from 'react';
import { Bell, AlertTriangle, ShieldCheck, CheckCircle2, X } from 'lucide-react';

export interface ToastData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  title: string;
  message: string;
}

interface ToastNotificationProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div style={styles.toastContainer} className="dadaist-toast-stack">
      {toasts.map((toast) => {
        const isAlert = toast.type === 'alert';
        const isWarning = toast.type === 'warning';
        const isSuccess = toast.type === 'success';

        const borderColor = isAlert
          ? '#EF4444'
          : isWarning
          ? '#FFCD48'
          : isSuccess
          ? '#38BDF8'
          : 'rgba(56, 189, 248, 0.3)';

        const accentColor = isAlert ? '#EF4444' : isWarning ? '#FFCD48' : '#38BDF8';

        return (
           <div
             key={toast.id}
            style={{
              ...styles.toastCard,
              borderColor,
            }}
             className="toast-slide-down dadaist-toast"
             role={isAlert ? 'alert' : 'status'}
             aria-live={isAlert ? 'assertive' : 'polite'}
            >
            <div style={{ ...styles.iconBadge, backgroundColor: `${accentColor}18`, borderColor }}>
              {isAlert || isWarning ? (
                <AlertTriangle size={16} color={accentColor} />
              ) : isSuccess ? (
                <CheckCircle2 size={16} color={accentColor} />
              ) : (
                <Bell size={16} color={accentColor} />
              )}
            </div>

            <div style={styles.textCluster}>
              <span style={{ ...styles.toastTitle, color: accentColor }}>{toast.title}</span>
              <span style={styles.toastMessage}>{toast.message}</span>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              style={styles.closeBtn}
              title="Dismiss notification"
            >
              <X size={14} color="#8CA2C2" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  toastContainer: {
    position: 'fixed' as const,
    top: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 38px)',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 350,
    width: 'calc(100% - 32px)',
    maxWidth: '440px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    pointerEvents: 'none' as const,
  },
  toastCard: {
    pointerEvents: 'auto' as const,
    backgroundColor: '#0F1D38',
    borderRadius: '18px',
    border: '1.5px solid',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.1)',
  },
  iconBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCluster: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    overflow: 'hidden',
  },
  toastTitle: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.3px',
    textTransform: 'uppercase' as const,
  },
  toastMessage: {
    fontSize: '12px',
    color: '#FFFFFF',
    lineHeight: '1.35',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
