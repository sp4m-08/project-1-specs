import React, { useState } from 'react';
import { Zap, Bell, RefreshCw, ShieldCheck, HeartHandshake } from 'lucide-react';
import { DeviceStatusGrid } from './DeviceStatusGrid';
import { VitalsCard } from './VitalsCard';
import { FallAlertModal } from './FallAlertModal';
import { mobileUx } from '../utils/haptics';
import {
  SpecsTelemetry,
  SpecsVision,
  CaneTelemetry,
  BandTelemetry,
  FallAlertState,
  DeviceLastSeen,
  UserRole,
} from '../types/telemetry';

interface DashboardScreenProps {
  role: UserRole;
  wearerName?: string;
  isConnected: boolean;
  serverHost: string;
  onConfigureServer: () => void;
  onRefresh?: () => void;
  specs?: SpecsTelemetry;
  specsVision?: SpecsVision;
  cane?: CaneTelemetry;
  band?: BandTelemetry;
  deviceLastSeen?: DeviceLastSeen;
  activeAlert: FallAlertState | null;
  onCancelAlert: () => void;
  onTriggerAction: (action: string, value?: any) => void;
  onOpenChat: () => void;
  onOpenAlerts?: () => void;
}

/**
 * DashboardScreen — Main Telemetry Dashboard & Device Status Bar
 * - Header: AURA Assist role-aware safety overview with live bridge status.
 * - Connected Devices Row: 3 Tiles on #0e1a19 background with 60px radius.
 * - Live Vitals Panel: Light Content Card #edf7f5 with 60px radius.
 * - Algorithm 2 Fall Status Banner & Alert Modal triggers.
 * - Embedded hardware telemetry simulator test bar.
 */
export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  role,
  wearerName = 'Demo wearer',
  isConnected,
  serverHost,
  onConfigureServer,
  onRefresh,
  specs,
  specsVision,
  cane,
  band,
  deviceLastSeen,
  activeAlert,
  onCancelAlert,
  onTriggerAction,
  onOpenChat,
  onOpenAlerts,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissedAlertId, setDismissedAlertId] = useState<string | null>(null);
  const currentHr = band?.heart_rate ?? cane?.heart_rate;
  const currentSpO2 = band?.spo2 ?? cane?.spo2;
  const altitude = band?.altitude_m;
  const pressure = band?.pressure_hpa;

  const isFallActive = Boolean(
    activeAlert &&
    activeAlert.status !== 'IDLE' &&
    activeAlert.status !== 'CANCELLED_BY_USER'
  );

  const isModalOpen = Boolean(
    isFallActive &&
    (!activeAlert?.id || dismissedAlertId !== activeAlert.id)
  );

  const handleCloseModal = () => {
    mobileUx.triggerHaptic('light');
    mobileUx.playTone('tap');
    if (activeAlert?.id) {
      setDismissedAlertId(activeAlert.id);
    } else {
      setDismissedAlertId('dismissed');
    }
  };

  const handleCancelAlert = () => {
    onCancelAlert();
    setDismissedAlertId(activeAlert?.id ?? 'dismissed');
  };

  const handleRefreshClick = () => {
    mobileUx.triggerHaptic('medium');
    mobileUx.playTone('tap');
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
      mobileUx.triggerHaptic('light');
    }, 700);
  };

  const handleSosPress = () => {
    mobileUx.triggerHaptic('sos');
    mobileUx.playTone('sos');
    mobileUx.speak('Emergency S.O.S alert activated.');
    onTriggerAction('SOS_PRESS');
  };

  return (
    <div style={styles.dashboardContainer} className="tab-transition-view collage-dashboard">
      {/* 1. Main Header Bar */}
      <header style={styles.headerBar} className="collage-dashboard__header">
        <div style={styles.headerLeft} className="collage-dashboard__header-left">
          <div style={styles.logoBadge} className="collage-dashboard__logo">
            <Zap size={20} color="#38BDF8" />
          </div>
          <div>
            <span className="eyebrow-label">AURA ASSIST</span>
            <h1 style={styles.appTitle} className="collage-dashboard__title">{role === 'caregiver' ? 'Care overview' : 'Your safety'}</h1>
          </div>
        </div>

        <div style={styles.headerRight} className="collage-dashboard__header-right">
          {/* Re-sync / Refresh Button */}
          <button
            onClick={handleRefreshClick}
            type="button"
            style={styles.refreshBtn}
            className="collage-dashboard__refresh"
            title="Re-sync Wearable Telemetry"
          >
            <RefreshCw
              size={15}
              color="#38BDF8"
              style={{
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* Bridge Connection Status Badge */}
          <button
            onClick={onConfigureServer}
            type="button"
            className="collage-dashboard__bridge"
            style={{
              ...styles.bridgeStatusPill,
              cursor: 'pointer',
            }}
            title={`Tap to configure Server Host (Current: ${serverHost}:4000)`}
          >
            <div
              style={{
                ...styles.pulseIndicator,
                backgroundColor: isConnected ? '#38BDF8' : '#8CA2C2',
              }}
              className={isConnected ? 'live-pulse-blue' : ''}
            />
            <span style={styles.bridgeStatusText}>
              Monitoring {isConnected ? 'connected' : 'offline'}
            </span>
          </button>

          {/* Quick SOS Trigger */}
          <button
            onClick={handleSosPress}
            type="button"
            className="pill-btn-ghost collage-dashboard__sos"
            style={styles.sosPill}
          >
              <span>{role === 'wearer' ? 'SOS' : 'Quick SOS'}</span>
          </button>
        </div>
      </header>

      {/* 2. Floating Telemetry Stats Bar */}
      <section style={styles.statBar} className="collage-dashboard__stats" aria-label="Safety summary">
        <div style={styles.statCol} className="collage-dashboard__stat">
          <span style={styles.statValue} className="collage-dashboard__stat-value">{role === 'caregiver' ? wearerName : 'Protected'}</span>
          <span style={styles.statLabel} className="collage-dashboard__stat-label">{role === 'caregiver' ? 'WEARER PROFILE' : 'SAFETY MONITORING'}</span>
        </div>
        <div style={styles.statCol} className="collage-dashboard__stat">
          <span style={styles.statValue} className="collage-dashboard__stat-value">{[specs, cane, band].filter(Boolean).length} / 3</span>
          <span style={styles.statLabel} className="collage-dashboard__stat-label">WEARABLES REPORTING</span>
        </div>
        <div style={styles.statCol} className="collage-dashboard__stat">
          <span style={styles.statValue} className="collage-dashboard__stat-value">{activeAlert && isFallActive ? 'Attention' : 'Clear'}</span>
          <span style={styles.statLabel} className="collage-dashboard__stat-label">FALL PROTECTION</span>
        </div>
        <div style={styles.statCol} className="collage-dashboard__stat">
          <span style={styles.statValue} className="collage-dashboard__stat-value">{isConnected ? 'Live' : 'Offline'}</span>
          <span style={styles.statLabel} className="collage-dashboard__stat-label">LAST CONNECTION</span>
        </div>
      </section>

      <section className="welcome-strip" aria-label="Current profile">
        <div className="welcome-strip__icon" aria-hidden="true"><HeartHandshake size={18} /></div>
        <div>
          <strong>{role === 'caregiver' ? `Monitoring ${wearerName}` : 'You are in wearer mode'}</strong>
          <span>{role === 'caregiver' ? 'Review safety updates and device freshness at a glance.' : 'AURA will keep safety information simple and spoken when needed.'}</span>
        </div>
        <button className="button button--text" type="button" onClick={onOpenChat}>
          Ask AURA
        </button>
      </section>

      {/* 3. Fall Detection Notice Banner (When Active) */}
      {isFallActive && (
        <section style={styles.alertBannerSection} className="collage-dashboard__alert-section">
          <div className="collage-dashboard__alert" style={{
            ...styles.alertBanner,
            backgroundColor: activeAlert?.confidence === 'HIGH' ? '#F06B6B' : '#F3C969',
          }}>
            <div
              style={{ ...styles.alertBannerLeft, cursor: 'pointer' }}
              onClick={() => setDismissedAlertId(null)}
              title="Tap to view fall alert details"
            >
              <Bell size={20} color="#0B132B" />
              <div>
                <span style={styles.alertBannerTitle}>
                  {activeAlert?.status === 'HIGH_CONFIDENCE_ALERT'
                    ? 'FALL LIKELY CONFIRMED'
                    : 'POSSIBLE FALL DETECTED'}
                </span>
                <span style={styles.alertBannerSubtitle}>{activeAlert?.message}</span>
              </div>
            </div>

            <button onClick={handleCloseModal} style={styles.bannerDismissBtn}>
              Dismiss
            </button>
          </div>
        </section>
      )}

      {/* 4. Connected Devices Row (3 Tiles on #0e1a19, 60px radius) */}
        <DeviceStatusGrid
          role={role}
        specs={specs}
        specsVision={specsVision}
        cane={cane}
        band={band}
        deviceLastSeen={deviceLastSeen}
      />

      {/* 5. Live Vitals Panel (Light Content Card #edf7f5, 60px radius) */}
      <VitalsCard
        heartRate={currentHr}
        spo2={currentSpO2}
        altitudeM={altitude}
        pressureHpa={pressure}
        role={role}
      />

      <section className="dashboard-help">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>{role === 'caregiver' ? 'Technical security and simulation tools are available in More.' : 'Need help? Use Ask AURA or the SOS button.'}</span>
      </section>

      {/* 7. Two-Tier Fall Alert Modal */}
      <FallAlertModal
        alertState={activeAlert}
        isOpen={isModalOpen}
        onCancelAlert={handleCancelAlert}
        onAcknowledgeAlert={handleCancelAlert}
        onCloseModal={handleCloseModal}
      />
    </div>
  );
};

const styles = {
  dashboardContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#0B132B',
    color: '#FFFFFF',
    minHeight: '100%',
  },
  headerBar: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    /* SAFE AREA FIX: Clear system status bar / notch dynamically (min 28px fallback + 12px breathing room) */
    paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 28px) + 12px)',
    paddingBottom: '16px',
    paddingLeft: 'max(env(safe-area-inset-left, 0px), 20px)',
    paddingRight: 'max(env(safe-area-inset-right, 0px), 20px)',
    backgroundColor: '#0B132B',
    borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '12px',
  },
  logoBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    backgroundColor: '#0F1D38',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(56, 189, 248, 0.2)',
  },
  appTitle: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
    margin: '2px 0 0 0',
    lineHeight: '1.2',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '10px',
  },
  refreshBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#0F1D38',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    touchAction: 'manipulation' as const,
  },
  bridgeStatusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    backgroundColor: '#0F1D38',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '56px',
    padding: '6px 14px',
    transition: 'border-color 0.2s ease',
  },
  pulseIndicator: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#38BDF8',
  },
  bridgeStatusText: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#38BDF8',
    letterSpacing: '-0.08px',
  },
  sosPill: {
    padding: '6px 16px',
    fontSize: '12px',
    borderRadius: '56px',
    borderColor: '#FFCD48',
    color: '#FFCD48',
  },
  statBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '16px',
    padding: 'clamp(14px, 4vw, 24px) clamp(14px, 4vw, 24px) 16px clamp(14px, 4vw, 24px)',
  },
  statCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  statValue: {
    fontSize: 'clamp(20px, 5.5vw, 30px)',
    fontWeight: '600',
    color: '#38BDF8',
    letterSpacing: '-0.08px',
    lineHeight: '1.1',
  },
  statLabel: {
    fontSize: '9px',
    fontWeight: '500',
    color: '#8CA2C2',
    letterSpacing: '0.45px',
    textTransform: 'uppercase' as const,
  },
  alertBannerSection: {
    padding: '0 clamp(14px, 4vw, 20px) 16px clamp(14px, 4vw, 20px)',
  },
  alertBanner: {
    backgroundColor: '#FFCD48',
    borderRadius: '20px',
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#0B132B',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  alertBannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: '1 1 200px',
  },
  alertBannerTitle: {
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.3px',
    display: 'block',
  },
  alertBannerSubtitle: {
    fontSize: '12px',
    display: 'block',
  },
  bannerDismissBtn: {
    backgroundColor: '#0B132B',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '56px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    minHeight: '36px',
  },
};
