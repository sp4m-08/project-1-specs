import React from 'react';
import { Zap, ShieldCheck, Activity, Bell, Settings, Radio } from 'lucide-react';
import { DeviceStatusGrid } from './DeviceStatusGrid';
import { VitalsCard } from './VitalsCard';
import { FallAlertModal } from './FallAlertModal';
import { SimulatorControlBar } from './SimulatorControlBar';
import {
  SpecsTelemetry,
  SpecsVision,
  CaneTelemetry,
  BandTelemetry,
  FallAlertState,
} from '../types/telemetry';

interface DashboardScreenProps {
  isConnected: boolean;
  serverHost: string;
  onConfigureServer: () => void;
  specs?: SpecsTelemetry;
  specsVision?: SpecsVision;
  cane?: CaneTelemetry;
  band?: BandTelemetry;
  activeAlert: FallAlertState | null;
  onCancelAlert: () => void;
  onTriggerAction: (action: string, value?: any) => void;
  onOpenChat: () => void;
}

/**
 * DashboardScreen — Main Telemetry Dashboard & Device Status Bar
 * - Header: App title "AURA AIoT ASSISTANT" with live connection badge ("Bridge: Connected" in Neon Pulse #3ddc91).
 * - Connected Devices Row: 3 Tiles on #0e1a19 background with 60px radius.
 * - Live Vitals Panel: Light Content Card #edf7f5 with 60px radius.
 * - Algorithm 2 Fall Status Banner & Alert Modal triggers.
 * - Embedded hardware telemetry simulator test bar.
 */
export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  isConnected,
  serverHost,
  onConfigureServer,
  specs,
  specsVision,
  cane,
  band,
  activeAlert,
  onCancelAlert,
  onTriggerAction,
  onOpenChat,
}) => {
  const currentHr = band?.heart_rate || cane?.heart_rate || 72;
  const currentSpO2 = band?.spo2 || cane?.spo2 || 98;
  const altitude = band?.altitude_m ?? 120.5;
  const pressure = band?.pressure_hpa ?? 1013.25;

  const isFallActive = activeAlert && activeAlert.status !== 'IDLE';

  return (
    <div style={styles.dashboardContainer}>
      {/* 1. Main Header Bar */}
      <header style={styles.headerBar}>
        <div style={styles.headerLeft}>
          <div style={styles.logoBadge}>
            <Zap size={20} color="#3DDC91" />
          </div>
          <div>
            <span className="eyebrow-label">SECURE WEARABLE PLATFORM</span>
            <h1 style={styles.appTitle}>AURA AIoT ASSISTANT</h1>
          </div>
        </div>

        <div style={styles.headerRight}>
          {/* Bridge Connection Status Badge */}
          <div
            onClick={onConfigureServer}
            style={{
              ...styles.bridgeStatusPill,
              cursor: 'pointer',
            }}
            title={`Tap to configure Server Host (Current: ${serverHost}:4000)`}
          >
            <div
              style={{
                ...styles.pulseIndicator,
                backgroundColor: isConnected ? '#3DDC91' : '#828786',
              }}
              className={isConnected ? 'live-pulse-green' : ''}
            />
            <span style={styles.bridgeStatusText}>
              Bridge: {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Quick SOS Trigger */}
          <button
            onClick={() => onTriggerAction('SOS_PRESS')}
            className="pill-btn-ghost"
            style={styles.sosPill}
          >
            <span>SOS</span>
          </button>
        </div>
      </header>

      {/* 2. Floating Telemetry Stats Bar */}
      <section style={styles.statBar}>
        <div style={styles.statCol}>
          <span style={styles.statValue}>50 Hz</span>
          <span style={styles.statLabel}>TELEMETRY STREAM RATE</span>
        </div>
        <div style={styles.statCol}>
          <span style={styles.statValue}>256-BIT</span>
          <span style={styles.statLabel}>AES-GCM HARDWARE ENCRYPT</span>
        </div>
        <div style={styles.statCol}>
          <span style={styles.statValue}>3.0s</span>
          <span style={styles.statLabel}>ALGORITHM 2 FUSION WINDOW</span>
        </div>
        <div style={styles.statCol}>
          <span style={styles.statValue}>&lt; 2.1ms</span>
          <span style={styles.statLabel}>SECURE BROKER LATENCY</span>
        </div>
      </section>

      {/* 3. Fall Detection Notice Banner (When Active) */}
      {isFallActive && (
        <section style={styles.alertBannerSection}>
          <div style={styles.alertBanner}>
            <div style={styles.alertBannerLeft}>
              <Bell size={20} color="#132322" />
              <div>
                <span style={styles.alertBannerTitle}>
                  {activeAlert?.status === 'HIGH_CONFIDENCE_ALERT'
                    ? 'DUAL-DEVICE FALL CONFIRMED'
                    : 'SINGLE-DEVICE IMPACT WARNING (SOS RESPONSE ACTIVE)'}
                </span>
                <span style={styles.alertBannerSubtitle}>{activeAlert?.message}</span>
              </div>
            </div>

            <button onClick={onCancelAlert} style={styles.bannerDismissBtn}>
              Dismiss
            </button>
          </div>
        </section>
      )}

      {/* 4. Connected Devices Row (3 Tiles on #0e1a19, 60px radius) */}
      <DeviceStatusGrid
        specs={specs}
        specsVision={specsVision}
        cane={cane}
        band={band}
      />

      {/* 5. Live Vitals Panel (Light Content Card #edf7f5, 60px radius) */}
      <VitalsCard
        heartRate={currentHr}
        spo2={currentSpO2}
        altitudeM={altitude}
        pressureHpa={pressure}
      />

      {/* 6. Embedded Hardware Simulator Control Bar */}
      <SimulatorControlBar onTriggerAction={onTriggerAction} />

      {/* 7. Two-Tier Fall Alert Modal */}
      <FallAlertModal
        alertState={activeAlert}
        isOpen={Boolean(isFallActive)}
        onCancelAlert={onCancelAlert}
      />
    </div>
  );
};

const styles = {
  dashboardContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#132322',
    color: '#FFFFFF',
    minHeight: '100%',
  },
  headerBar: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    backgroundColor: '#132322',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
    backgroundColor: '#0E1A19',
    border: '1px solid rgba(61, 220, 145, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  bridgeStatusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    backgroundColor: '#0E1A19',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '56px',
    padding: '6px 14px',
    transition: 'border-color 0.2s ease',
  },
  pulseIndicator: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#3DDC91',
  },
  bridgeStatusText: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#3DDC91', // Neon Pulse
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
    padding: '24px 24px 20px 24px',
  },
  statCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '500',
    color: '#3DDC91', // Neon Pulse
    letterSpacing: '-0.08px',
    lineHeight: '1.1',
  },
  statLabel: {
    fontSize: '9px',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: '0.45px',
    textTransform: 'uppercase' as const,
  },
  alertBannerSection: {
    padding: '0 20px 20px 20px',
  },
  alertBanner: {
    backgroundColor: '#FFCD48',
    borderRadius: '24px',
    padding: '14px 20px',
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#132322',
  },
  alertBannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
    backgroundColor: '#132322',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '56px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
