import React, { useState } from 'react';
import { Bot, ShieldCheck, Zap, X, AlertTriangle } from 'lucide-react';

interface HeaderBarProps {
  isConnected: boolean;
  activeAlertCount: number;
  serverHost?: string;
  onConfigureServer?: () => void;
  onOpenChat: () => void;
  onTriggerSos: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  isConnected,
  activeAlertCount,
  serverHost = 'localhost',
  onConfigureServer,
  onOpenChat,
  onTriggerSos,
}) => {
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  return (
    <header style={styles.headerWrapper}>
      {/* Announcement Banner */}
      {showAnnouncement && (
        <div style={styles.announcementBanner}>
          <div style={styles.announcementContent}>
            <span style={styles.announcementText}>
              <strong>COMMAND CENTER READY</strong> — AES-256-GCM Telemetry Active • Live Signal at 50 Hz
            </span>
          </div>
          <button
            onClick={() => setShowAnnouncement(false)}
            style={styles.closeBannerBtn}
            title="Dismiss Announcement"
          >
            <X size={14} color="#070D1E" />
          </button>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div style={styles.navBar}>
        <div style={styles.leftCluster}>
          <div style={styles.brandRow}>
            <div style={styles.brandIconBox}>
              <Zap size={18} color="#38BDF8" />
            </div>
            <div>
              <span className="eyebrow-label">COMMAND CONSOLE</span>
              <h1 style={styles.appTitle}>AIoT Assistive Suite</h1>
            </div>
          </div>

          <div
            onClick={onConfigureServer}
            style={{
              ...styles.statusPill,
              cursor: onConfigureServer ? 'pointer' : 'default',
            }}
            title={`Tap to switch host (Current: ${serverHost}:4000)`}
          >
            <div
              style={{
                ...styles.pulseDot,
                backgroundColor: isConnected ? '#38BDF8' : '#8CA2C2',
              }}
              className={isConnected ? 'live-pulse-blue' : ''}
            />
            <span style={styles.statusText}>
              {isConnected ? `Online • ${serverHost}` : `Offline • ${serverHost}`}
            </span>
          </div>
        </div>

        <div style={styles.rightCluster}>
          <button onClick={onOpenChat} className="pill-btn-primary" style={styles.ctaPill}>
            <Bot size={16} color="#070D1E" style={{ marginRight: 6 }} />
            <span>Aura AI</span>
          </button>

          <button
            onClick={onTriggerSos}
            className="pill-btn-ghost"
            style={{
              ...styles.sosPill,
              borderColor: activeAlertCount > 0 ? '#FFCD48' : '#FFFFFF',
              color: activeAlertCount > 0 ? '#FFCD48' : '#FFFFFF',
            }}
          >
            <AlertTriangle size={15} style={{ marginRight: 4 }} />
            <span>SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};

const styles = {
  headerWrapper: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 200,
    backgroundColor: '#0B132B',
    /* SAFE AREA FIX: Clear system status bar / notch (min 28px + 8px clearance) */
    paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 28px) + 8px)',
  },
  announcementBanner: {
    backgroundColor: '#38BDF8',
    color: '#070D1E',
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '-0.08px',
  },
  announcementContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  announcementText: {
    color: '#070D1E',
  },
  closeBannerBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px',
  },
  navBar: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#0B132B',
    borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
  },
  leftCluster: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap' as const,
  },
  brandRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '10px',
  },
  brandIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#0F1D38',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(56, 189, 248, 0.2)',
  },
  appTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#FFFFFF',
    margin: 0,
    letterSpacing: '-0.08px',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0F1D38',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '56px',
    padding: '5px 12px',
    transition: 'border-color 0.2s ease',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#38BDF8',
  },
  statusText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#38BDF8',
    letterSpacing: '-0.08px',
  },
  rightCluster: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '8px',
  },
  ctaPill: {
    padding: '8px 18px',
    fontSize: '13px',
    borderRadius: '56px',
    backgroundColor: '#38BDF8',
    color: '#070D1E',
  },
  sosPill: {
    padding: '7px 16px',
    fontSize: '12px',
    borderRadius: '56px',
  },
};
