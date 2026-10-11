import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShieldCheck, Radio, AlertTriangle, Bot, Cpu } from 'lucide-react-react-native-web';

// Note: Using lucide-react icons directly with HTML fallback for React Native Web
import { ShieldCheck as ShieldIcon, Radio as RadioIcon, AlertOctagon, Bot as BotIcon, Zap } from 'lucide-react';

interface HeaderBarProps {
  isConnected: boolean;
  activeAlertCount: number;
  onOpenChat: () => void;
  onTriggerSos: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  isConnected,
  activeAlertCount,
  onOpenChat,
  onTriggerSos,
}) => {
  return (
    <div className="header-container" style={styles.container}>
      <div style={styles.leftSection}>
        <div style={styles.titleRow}>
          <Zap size={22} color="#00F2FE" />
          <Text style={styles.appTitle}>Secure AIoT Assistive Suite</Text>
        </div>
        <div style={styles.badgeRow}>
          <div style={styles.statusBadge}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isConnected ? '#10B981' : '#EF4444',
                marginRight: 6,
              }}
              className={isConnected ? 'pulse-emerald' : ''}
            />
            <Text style={styles.statusText}>
              Broker: {isConnected ? 'Connected (TLS)' : 'Disconnected'}
            </Text>
          </div>

          <div style={styles.securityBadge}>
            <ShieldIcon size={13} color="#00F2FE" style={{ marginRight: 4 }} />
            <Text style={styles.securityText}>AES-256-GCM Payload Active</Text>
          </div>
        </div>
      </div>

      <div style={styles.rightSection}>
        <button onClick={onOpenChat} style={styles.chatButton}>
          <BotIcon size={18} color="#00F2FE" style={{ marginRight: 6 }} />
          <span style={styles.chatButtonText}>Aura AI</span>
        </button>

        <button onClick={onTriggerSos} style={styles.sosButton}>
          <AlertOctagon size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
          <span style={styles.sosButtonText}>SOS</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: 'rgba(19, 27, 42, 0.9)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(16px)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  titleRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '8px',
  },
  appTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: '0.3px',
  },
  badgeRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '10px',
  },
  statusBadge: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: '3px 8px',
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  statusText: {
    fontSize: '11px',
    color: '#10B981',
    fontWeight: '600',
  },
  securityBadge: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    padding: '3px 8px',
    borderRadius: '12px',
    border: '1px solid rgba(0, 242, 254, 0.3)',
  },
  securityText: {
    fontSize: '11px',
    color: '#00F2FE',
    fontWeight: '600',
  },
  rightSection: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '10px',
  },
  chatButton: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: 'rgba(79, 172, 254, 0.15)',
    border: '1px solid rgba(79, 172, 254, 0.4)',
    color: '#00F2FE',
    padding: '8px 14px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.2s ease',
  },
  chatButtonText: {
    color: '#00F2FE',
    fontWeight: '600',
  },
  sosButton: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: '#EF4444',
    border: 'none',
    color: '#FFFFFF',
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '13px',
    boxShadow: '0 0 12px rgba(239, 68, 68, 0.5)',
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
};
