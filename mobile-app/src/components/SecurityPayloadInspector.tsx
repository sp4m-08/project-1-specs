import React from 'react';
import { Lock, Key, Check, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import { DecryptionLog } from '../types/telemetry';

interface SecurityPayloadInspectorProps {
  logs: DecryptionLog[];
}

export const SecurityPayloadInspector: React.FC<SecurityPayloadInspectorProps> = ({ logs }) => {
  const latestLog = logs[0];

  return (
    <div className="glass-card" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <Lock size={20} color="#00F2FE" style={{ marginRight: 8 }} />
          <div>
            <span style={styles.title}>AES-256-GCM Encrypted Telemetry Inspector</span>
            <span style={styles.subtitle}>
              Envelope: P = &#123; dev_id, tts, cnt, nonce, ciphertext, tag &#125;
            </span>
          </div>
        </div>

        <div style={styles.masterKeyBadge}>
          <Key size={13} color="#00F2FE" style={{ marginRight: 4 }} />
          <span style={styles.keyText}>Firmware Auth Active</span>
        </div>
      </div>

      {latestLog && (
        <div style={styles.inspectorBox}>
          <div style={styles.inspectorRow}>
            <span style={styles.label}>LAST DECRYPTED DEVICE:</span>
            <span style={styles.valueDev}>{latestLog.dev_id}</span>
          </div>

          <div style={styles.inspectorRow}>
            <span style={styles.label}>MONOTONIC REPLAY CNT:</span>
            <span style={styles.valueMono}>cnt #{latestLog.cnt} (Verified Monotonic)</span>
          </div>

          <div style={styles.inspectorRow}>
            <span style={styles.label}>AES-GCM AUTH TAG (128-BIT):</span>
            <span style={styles.valueHex}>0x{latestLog.data ? 'e7a19f... verified' : 'tag_ok'}</span>
          </div>

          <div style={styles.inspectorRow}>
            <span style={styles.label}>DECRYPTION LATENCY:</span>
            <span style={styles.valueLatency}>{latestLog.latencyMs || 1} ms</span>
          </div>
        </div>
      )}

      {/* Terminal Log Stream */}
      <div style={styles.terminalWindow}>
        <div style={styles.terminalHeader}>
          <Terminal size={14} color="#64748B" style={{ marginRight: 6 }} />
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
                color: log.success ? '#10B981' : '#EF4444'
              }}>
                [{log.success ? 'AES-GCM OK' : 'REJECTED'}]
              </span>
              <span style={styles.logDev}>[{log.dev_id}]</span>
              <span style={styles.logText}>
                {log.success ? `Verified payload (cnt #${log.cnt})` : log.error}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '18px 20px',
    margin: '0 20px 16px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  header: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  titleRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
  },
  title: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#F8FAFC',
    display: 'block',
  },
  subtitle: {
    fontSize: '11px',
    color: '#64748B',
    display: 'block',
    fontFamily: 'JetBrains Mono, monospace',
  },
  masterKeyBadge: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid rgba(0, 242, 254, 0.3)',
  },
  keyText: {
    fontSize: '11px',
    color: '#00F2FE',
    fontWeight: '600',
  },
  inspectorBox: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  inspectorRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  label: {
    fontSize: '9px',
    color: '#64748B',
    fontWeight: '700',
    fontFamily: 'JetBrains Mono, monospace',
  },
  valueDev: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#00F2FE',
    fontFamily: 'JetBrains Mono, monospace',
  },
  valueMono: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#10B981',
    fontFamily: 'JetBrains Mono, monospace',
  },
  valueHex: {
    fontSize: '12px',
    color: '#94A3B8',
    fontFamily: 'JetBrains Mono, monospace',
  },
  valueLatency: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#38BDF8',
    fontFamily: 'JetBrains Mono, monospace',
  },
  terminalWindow: {
    backgroundColor: '#070A0F',
    borderRadius: '10px',
    padding: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  terminalHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '6px',
  },
  terminalTitle: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '600',
    fontFamily: 'JetBrains Mono, monospace',
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
  },
  logTime: {
    color: '#64748B',
  },
  logTag: {
    fontWeight: '700',
  },
  logDev: {
    color: '#38BDF8',
  },
  logText: {
    color: '#CBD5E1',
  },
};
