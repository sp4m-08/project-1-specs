import React, { useState, useEffect } from 'react';
import { Wifi, BatteryCharging, Signal, Volume2, VolumeX, Vibrate } from 'lucide-react';
import { mobileUx } from '../utils/haptics';

interface MobileStatusBarProps {
  isConnected: boolean;
  onToggleSound?: () => void;
  isSoundEnabled?: boolean;
}

export const MobileStatusBar: React.FC<MobileStatusBarProps> = ({
  isConnected,
  onToggleSound,
  isSoundEnabled = true,
}) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.statusBarContainer}>
      {/* Left: Time & Network */}
      <div style={styles.leftGroup}>
        <span style={styles.timeText}>{currentTime || '09:41'}</span>
        <div style={styles.networkBadge} title={isConnected ? 'Mesh Network 5G Live' : 'Offline / Standalone'}>
          <Signal size={12} color={isConnected ? '#38BDF8' : '#8CA2C2'} />
          <span style={styles.netType}>5G</span>
        </div>
      </div>

      {/* Center: Dynamic Island / Notch Sensor Pill */}
      <div style={styles.centerPill} title="AURA AIoT Dynamic Telemetry Island">
        <div style={{
          ...styles.islandDot,
          backgroundColor: isConnected ? '#38BDF8' : '#FFCD48',
        }} className={isConnected ? 'live-pulse-blue' : ''} />
        <span style={styles.islandText}>
          {isConnected ? 'AURA 50Hz' : 'OFFLINE'}
        </span>
      </div>

      {/* Right: Quick Audio/Haptic control, Wi-Fi & Battery */}
      <div style={styles.rightGroup}>
        {onToggleSound && (
          <button
            onClick={onToggleSound}
            style={styles.iconBtn}
            title={isSoundEnabled ? 'Mute Touch Sounds & Voice Cues' : 'Enable Touch Sounds & Voice Cues'}
          >
            {isSoundEnabled ? (
              <Volume2 size={13} color="#38BDF8" />
            ) : (
              <VolumeX size={13} color="#8CA2C2" />
            )}
          </button>
        )}

        <Wifi size={13} color={isConnected ? '#38BDF8' : '#8CA2C2'} />

        <div style={styles.batteryContainer} title="Device Battery 98%">
          <span style={styles.batteryText}>98%</span>
          <BatteryCharging size={14} color="#38BDF8" />
        </div>
      </div>
    </div>
  );
};

const styles = {
  statusBarContainer: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 8px))',
    paddingBottom: '4px',
    paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
    paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
    backgroundColor: '#070D1E',
    borderBottom: '1px solid rgba(56, 189, 248, 0.08)',
    fontSize: '11px',
    color: '#8CA2C2',
    userSelect: 'none' as const,
    zIndex: 110,
    width: '100%',
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  timeText: {
    fontWeight: '600',
    color: '#FFFFFF',
    fontSize: '12px',
    letterSpacing: '-0.2px',
    fontFamily: 'Inter, sans-serif',
  },
  networkBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  },
  netType: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#38BDF8',
  },
  centerPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#0F1D38',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '16px',
    padding: '2px 8px',
  },
  islandDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
  },
  islandText: {
    fontSize: '9px',
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: '0.4px',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batteryContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  batteryText: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter, sans-serif',
  },
};
