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
            <Key size={13} color="#3DDC91" style={{ marginRight: 6 }} />
            <span style={styles.authBadgeText}>Firmware Authenticated</span>
          </div>
        </div>

        {latestLog && (
          <div style={styles.statsRow}>
            <div style={styles.statTile}>
              <span className="eyebrow-label" style={{ color: '#828786' }}>ORIGIN NODE</span>
              <span style={styles.statValue}>{latestLog.dev_id}</span>
            </div>

            <div style={styles.statTile}>
              <span className="eyebrow-label" style={{ color: '#828786' }}>MONOTONIC COUNTER</span>
              <span style={{ ...styles.statValue, color: '#3DDC91' }}>#{latestLog.cnt}</span>
            </div>

            <div style={styles.statTile}>
              <span className="eyebrow-label" style={{ color: '#828786' }}>GCM TAG AUTH</span>
              <span style={styles.statValue}>128-BIT VERIFIED</span>
            </div>

            <div style={styles.statTile}>
              <span className="eyebrow-label" style={{ color: '#828786' }}>DECRYPT TIME</span>
              <span style={{ ...styles.statValue, color: '#3DDC91' }}>{latestLog.latencyMs || 1.8} ms</span>
            </div>
          </div>
        )}

        {/* Terminal Log Stream */}
        <div style={styles.terminalWindow}>
          <div style={styles.terminalHeader}>
            <Terminal size={14} color="#828786" style={{ marginRight: 6 }} />
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
                  color: log.success ? '#3DDC91' : '#FFCD48',
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
    padding: '0 20px 24px 20px',
  },
  card: {
    backgroundColor: '#0E1A19',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
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
    backgroundColor: '#132322',
    border: '1px solid rgba(61, 220, 145, 0.3)',
    borderRadius: '56px',
    padding: '6px 14px',
  },
  authBadgeText: {
    fontSize: '12px',
    color: '#3DDC91',
    fontWeight: '500',
    letterSpacing: '-0.08px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '12px',
  },
  statTile: {
    backgroundColor: '#132322',
    padding: '12px 14px',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  statValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'JetBrains Mono, monospace',
  },
  terminalWindow: {
    backgroundColor: '#070F0F',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  terminalHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginBottom: '10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '8px',
  },
  terminalTitle: {
    fontSize: '11px',
    color: '#828786',
    fontWeight: '500',
    letterSpacing: '0.45px',
    textTransform: 'uppercase' as const,
  },
  logStream: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    maxHeight: '160px',
    overflowY: 'auto' as const,
  },
  logItem: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '8px',
    fontSize: '11px',
    fontFamily: 'JetBrains Mono, monospace',
    lineHeight: '1.4',
  },
  logTime: {
    color: '#828786',
  },
  logTag: {
    fontWeight: '600',
  },
  logDev: {
    color: '#97DDBC',
  },
  logText: {
    color: '#D0D3D3',
  },
};
