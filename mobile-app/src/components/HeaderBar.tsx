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
      {/* Sauce Labs Announcement Banner */}
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
            <X size={14} color="#132322" />
          </button>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div style={styles.navBar}>
        <div style={styles.leftCluster}>
          <div style={styles.brandRow}>
            <div style={styles.brandIconBox}>
              <Zap size={18} color="#3DDC91" />
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
                backgroundColor: isConnected ? '#3DDC91' : '#828786',
              }}
              className={isConnected ? 'live-pulse-green' : ''}
            />
            <span style={styles.statusText}>
              {isConnected ? `Online • ${serverHost}` : `Offline • ${serverHost}`}
            </span>
          </div>
        </div>

        <div style={styles.rightCluster}>
          <button onClick={onOpenChat} className="pill-btn-primary" style={styles.ctaPill}>
            <Bot size={16} color="#132322" style={{ marginRight: 6 }} />
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
    backgroundColor: '#132322',
  },
  announcementBanner: {
    backgroundColor: '#3DDC91',
    color: '#132322',
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontWeight: '500',
    letterSpacing: '-0.08px',
  },
  announcementContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  announcementText: {
    color: '#132322',
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
    backgroundColor: '#132322',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    backgroundColor: '#0E1A19',
    border: '1px solid rgba(61, 220, 145, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: '17px',
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
    margin: 0,
    lineHeight: '1.2',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0E1A19',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '56px',
    padding: '5px 12px',
    transition: 'border-color 0.15s ease',
  },
  pulseDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '12px',
    color: '#828786',
    fontWeight: '400',
    letterSpacing: '-0.08px',
  },
  rightCluster: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '10px',
  },
  ctaPill: {
    padding: '8px 18px',
    fontSize: '13px',
    borderRadius: '56px',
  },
  sosPill: {
    padding: '7px 16px',
    fontSize: '13px',
    borderRadius: '56px',
  },
};
