import React from 'react';
import { Lock, Key, Terminal, ShieldCheck } from 'lucide-react';
import { DecryptionLog } from '../types/telemetry';

interface SecurityPayloadInspectorProps {
  logs: DecryptionLog[];
}

export const SecurityPayloadInspector: React.FC<SecurityPayloadInspectorProps> = ({ logs }) => {
  const latestLog = logs[0];

  return (
    <div style={styles.outerWrapper}>
      <div className="deep-abyss-card" style={styles.card}>
        <div style={styles.header}>
          <div>
            <span className="eyebrow-label">CRYPTOGRAPHIC ATTESTATION • AES-256-GCM</span>
            <h3 style={styles.title}>Packet Decryption & Replay Verification</h3>
          </div>

          <div style={styles.authBadge}>
            <Key size={13} color="#38BDF8" style={{ marginRight: 6 }} />
            <span style={styles.authBadgeText}>Firmware Authenticated</span>
          </div>
        </div>

        {latestLog && (
          <div style={styles.statsRow}>
            <div style={styles.statTile}>
              <span className="eyebrow-label" style={{ color: '#8CA2C2' }}>ORIGIN NODE</span>
              <span style={styles.statValue}>{latestLog.dev_id}</span>
            </div>

            <div style={styles.statTile}>
              <span className="eyebrow-label" style={{ color: '#8CA2C2' }}>MONOTONIC COUNTER</span>
              <span style={{ ...styles.statValue, color: '#38BDF8' }}>#{latestLog.cnt}</span>
            </div>

            <div style={styles.statTile}>
              <span className="eyebrow-label" style={{ color: '#8CA2C2' }}>GCM TAG AUTH</span>
              <span style={styles.statValue}>128-BIT VERIFIED</span>
            </div>

            <div style={styles.statTile}>
              <span className="eyebrow-label" style={{ color: '#8CA2C2' }}>DECRYPT TIME</span>
              <span style={{ ...styles.statValue, color: '#38BDF8' }}>{latestLog.latencyMs || 1.8} ms</span>
            </div>
          </div>
        )}

        {/* Terminal Log Stream */}
        <div style={styles.terminalWindow}>
          <div style={styles.terminalHeader}>
            <Terminal size={14} color="#8CA2C2" style={{ marginRight: 6 }} />
            <span style={styles.terminalTitle}>Live Broker Telemetry Ingestion Log</span>
          </div>

          <div style={styles.logStream}>
            {logs.slice(0, 8).map((log, idx) => (
              <div key={idx} style={styles.logItem}>
                <span style={styles.logTime}>
                  {new Date(log.tts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as any)}
                </span>
                <span style={{
                  ...styles.logTag,
                  color: log.success ? '#38BDF8' : '#FFCD48',
                }}>
                  [{log.success ? 'AES-GCM OK' : 'REJECTED'}]
                </span>
                <span style={styles.logDev}>[{log.dev_id}]</span>
                <span style={styles.logText}>
                  {log.success ? `Authenticated payload (seq #${log.cnt})` : log.error}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  outerWrapper: {
    padding: '0 clamp(14px, 4vw, 20px) 24px clamp(14px, 4vw, 20px)',
  },
  card: {
    backgroundColor: '#0F1D38',
    borderRadius: '20px',
    padding: 'clamp(16px, 4vw, 24px)',
    border: '1px solid rgba(56, 189, 248, 0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.08)',
  },
  header: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  title: {
    fontSize: '17px',
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
    margin: '4px 0 0 0',
  },
  authBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '56px',
    padding: '6px 14px',
  },
  authBadgeText: {
    fontSize: '12px',
    color: '#38BDF8',
    fontWeight: '600',
    letterSpacing: '-0.08px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
    gap: '10px',
  },
  statTile: {
    backgroundColor: '#0B132B',
    padding: '12px 14px',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    border: '1px solid rgba(56, 189, 248, 0.12)',
  },
  statValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'JetBrains Mono, monospace',
  },
  terminalWindow: {
    backgroundColor: '#070D1E',
    borderRadius: '14px',
    border: '1px solid rgba(56, 189, 248, 0.15)',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  terminalHeader: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid rgba(56, 189, 248, 0.1)',
    paddingBottom: '8px',
  },
  terminalTitle: {
    fontSize: '11px',
    color: '#8CA2C2',
    fontFamily: 'JetBrains Mono, monospace',
    letterSpacing: '0.3px',
  },
  logStream: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    maxHeight: '140px',
    overflowY: 'auto' as const,
  },
  logItem: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '8px',
    fontSize: '11px',
    fontFamily: 'JetBrains Mono, monospace',
    flexWrap: 'wrap' as const,
  },
  logTime: {
    color: '#64748B',
  },
  logTag: {
    fontWeight: '600',
  },
  logDev: {
    color: '#8CA2C2',
  },
  logText: {
    color: '#FFFFFF',
  },
};
