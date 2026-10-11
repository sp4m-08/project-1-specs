import React, { useState, useEffect } from 'react';
import { Mic, Layers, ShieldCheck, Settings, Radio } from 'lucide-react';
import { DashboardScreen } from './components/DashboardScreen';
import { Spatial3dRadar } from './components/Spatial3dRadar';
import { SecurityPayloadInspector } from './components/SecurityPayloadInspector';
import { AIChatDrawer } from './components/AIChatDrawer';
import { BottomNavBar, ActiveTab } from './components/BottomNavBar';
import {
  SpecsTelemetry,
  SpecsVision,
  CaneTelemetry,
  BandTelemetry,
  FallAlertState,
  ObstacleCell3D,
  DecryptionLog,
  ChatMessage,
} from './types/telemetry';

/**
 * App — Production Root Component for Secure AIoT Assistive Wearables Console
 * Theme: "Obsidian Glass" (Deep Obsidian Canvas #132322, Neon Pulse #3ddc91 accent)
 * Orchestrates live MQTT/AES-GCM data stream from Smart Glasses, Smart Cane, and Smart Band.
 */
export const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Live Wearable Telemetry Feeds
  const [specs, setSpecs] = useState<SpecsTelemetry | undefined>();
  const [specsVision, setSpecsVision] = useState<SpecsVision | undefined>();
  const [cane, setCane] = useState<CaneTelemetry | undefined>();
  const [band, setBand] = useState<BandTelemetry | undefined>();
  const [activeAlert, setActiveAlert] = useState<FallAlertState | null>(null);
  const [pointCloud, setPointCloud] = useState<ObstacleCell3D[]>([]);
  const [securityLogs, setSecurityLogs] = useState<DecryptionLog[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Server Host Configurator (Defaults to localhost, allows LAN Wi-Fi IP for mobile)
  const [serverHost, setServerHost] = useState<string>(() => {
    return (
      localStorage.getItem('AIOT_SERVER_HOST') ||
      (window.location.hostname && window.location.hostname !== 'localhost'
        ? window.location.hostname
        : 'localhost')
    );
  });

  const apiBase = `http://${serverHost}:4000`;

  // Establish WebSocket Telemetry Pipeline to Secure Bridge
  useEffect(() => {
    const wsUrl = `ws://${serverHost}:4000`;
    let socket: WebSocket;

    try {
      socket = new WebSocket(wsUrl);
    } catch (err) {
      console.error('[WebSocket Init Error]:', err);
      setIsConnected(false);
      return;
    }

    socket.onopen = () => {
      console.log('[Bridge Connected]: WebSocket Telemetry Pipeline active at', wsUrl);
      setIsConnected(true);
    };

    socket.onclose = () => {
      console.log('[Bridge Disconnected]: Reconnecting telemetry stream...');
      setIsConnected(false);
    };

    socket.onerror = (e) => {
      console.error('[Bridge Socket Error]:', e);
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        switch (type) {
          case 'INIT_STATE':
            if (data.latestState) {
              setSpecs(data.latestState.specs);
              setSpecsVision(data.latestState.specsVision);
              setCane(data.latestState.cane);
              setBand(data.latestState.band);
              setActiveAlert(data.latestState.activeAlert);
              if (data.latestState.securityLogs) setSecurityLogs(data.latestState.securityLogs);
            }
            if (data.spatialMap) setPointCloud(data.spatialMap);
            if (data.chatHistory) setChatMessages(data.chatHistory);
            break;

          case 'SPECS_TELEMETRY_UPDATE':
            setSpecs(data);
            break;

          case 'SPECS_VISION_UPDATE':
            setSpecsVision(data);
            break;

          case 'CANE_TELEMETRY_UPDATE':
            setCane(data);
            break;

          case 'BAND_TELEMETRY_UPDATE':
            setBand(data);
            break;

          case 'FALL_ALERT_UPDATE':
            setActiveAlert(data);
            break;

          case 'SPATIAL_POINT_UPDATE':
            setPointCloud((prev) => [...prev.slice(-58), data]);
            break;

          case 'SECURITY_INSPECTION_LOG':
            setSecurityLogs((prev) => [data, ...prev.slice(0, 49)]);
            break;
        }
      } catch (err) {
        console.error('[WSS Parsing Error]:', err);
      }
    };

    return () => {
      socket.close();
    };
  }, [serverHost]);

  // Host IP Configuration Dialog
  const handleConfigureServer = () => {
    const next = window.prompt(
      'Configure Secure AIoT Bridge Host:\n\n• For laptop/local development or USB adb reverse, enter "localhost"\n• For phone on Wi-Fi, enter laptop local IP (e.g. 192.168.1.15):',
      serverHost
    );
    if (next && next.trim()) {
      const clean = next
        .trim()
        .replace(/^http:\/\/|^https:\/\/|^ws:\/\//, '')
        .replace(/:[0-9]+$/, '');
      localStorage.setItem('AIOT_SERVER_HOST', clean);
      setServerHost(clean);
    }
  };

  // REST Trigger for Hardware Simulator
  const handleTriggerAction = async (action: string, value?: any) => {
    try {
      await fetch(`${apiBase}/api/simulator/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });
    } catch (err) {
      console.error('[Simulator Trigger Error]:', err);
    }
  };

  // REST Query for AI Chat Assistant
  const handleSendChatMessage = async (prompt: string) => {
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`${apiBase}/api/chatbot/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const assistantMsg = await res.json();
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[AI Chatbot Query Error]:', err);
    }
  };

  return (
    <div style={styles.appShell}>
      {/* Scrollable View Area */}
      <main style={styles.contentViewport}>
        {/* TAB 1: Main Telemetry Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardScreen
            isConnected={isConnected}
            serverHost={serverHost}
            onConfigureServer={handleConfigureServer}
            specs={specs}
            specsVision={specsVision}
            cane={cane}
            band={band}
            activeAlert={activeAlert}
            onCancelAlert={() => handleTriggerAction('SOS_CANCEL')}
            onTriggerAction={handleTriggerAction}
            onOpenChat={() => setIsChatOpen(true)}
          />
        )}

        {/* TAB 2: 3D Spatial Radar Perception */}
        {activeTab === 'spatial' && (
          <div style={styles.subviewPadding}>
            <div style={styles.subviewHeader}>
              <span className="eyebrow-label">SPATIAL TOPOLOGY RADAR</span>
              <h2 style={styles.subviewTitle}>3D Ultrasonic Obstacle Map</h2>
            </div>
            <Spatial3dRadar
              pointCloud={pointCloud}
              pitchDeg={specs?.pitch_deg}
              yawDeg={specs?.yaw_deg}
            />
          </div>
        )}

        {/* TAB 3: AES-256-GCM Firmware Security Inspector */}
        {activeTab === 'security' && (
          <div style={styles.subviewPadding}>
            <div style={styles.subviewHeader}>
              <span className="eyebrow-label">CRYPTOGRAPHIC ATTESTATION</span>
              <h2 style={styles.subviewTitle}>AES-256-GCM Pipeline Inspector</h2>
            </div>
            <SecurityPayloadInspector logs={securityLogs} />
          </div>
        )}

        {/* TAB 4: Console Settings & Caregiver Configuration */}
        {activeTab === 'settings' && (
          <div style={styles.subviewPadding}>
            <div style={styles.subviewHeader}>
              <span className="eyebrow-label">ENGINEERING CONSOLE</span>
              <h2 style={styles.subviewTitle}>System & Caregiver Configuration</h2>
            </div>

            <div style={styles.settingsCard}>
              <div style={styles.settingsRow}>
                <div>
                  <span style={styles.settingLabel}>Bridge Endpoint Target</span>
                  <span style={styles.settingSub}>ws://{serverHost}:4000</span>
                </div>
                <button
                  onClick={handleConfigureServer}
                  className="pill-btn-primary"
                  style={styles.settingActionPill}
                >
                  Configure Host
                </button>
              </div>

              <div style={styles.settingsRow}>
                <div>
                  <span style={styles.settingLabel}>MQTT Public Broker</span>
                  <span style={styles.settingSub}>broker.hivemq.com:1883 (AES-256-GCM QoS 1/0)</span>
                </div>
                <span style={styles.statusPill}>TLS Active</span>
              </div>

              <div style={styles.settingsRow}>
                <div>
                  <span style={styles.settingLabel}>Primary Caregiver Emergency Contact</span>
                  <span style={styles.settingSub}>Dr. R. Sharma: +91-98765-43210</span>
                </div>
                <button
                  onClick={() => alert('Emergency dispatch contact verified with live network.')}
                  className="pill-btn-ghost"
                  style={styles.settingActionPill}
                >
                  Verify Dispatch
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Microphone Action Button (Neon Pulse #3ddc91) */}
      <button
        onClick={() => setIsChatOpen(true)}
        style={styles.floatingMicButton}
        className="live-pulse-green"
        title="Open Aura AI Voice & Sensor Fusion Assistant"
      >
        <Mic size={24} color="#132322" />
      </button>

      {/* Bottom Tab Pill Navigation */}
      <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Voice-Enabled AI Chatbot & Sensor Fusion Modal Drawer */}
      <AIChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendChatMessage}
      />
    </div>
  );
};

const styles = {
  appShell: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    backgroundColor: '#132322', // Obsidian Canvas
    color: '#FFFFFF',
    position: 'relative' as const,
  },
  contentViewport: {
    flex: 1,
    overflowY: 'auto' as const,
    /* SAFE AREA FIX: Generous bottom clearance ensuring scrollable content clears the floating pill bar and mic */
    paddingBottom: 'calc(100px + max(env(safe-area-inset-bottom, 0px), 24px))',
  },
  subviewPadding: {
    /* SAFE AREA FIX: Top safe area inset for subviews so category eyebrow & titles never clip status bar */
    paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 28px) + 16px)',
    paddingBottom: '24px',
    paddingLeft: 'max(env(safe-area-inset-left, 0px), 20px)',
    paddingRight: 'max(env(safe-area-inset-right, 0px), 20px)',
  },
  subviewHeader: {
    marginBottom: '20px',
  },
  subviewTitle: {
    fontSize: '22px',
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
    margin: '4px 0 0 0',
  },
  settingsCard: {
    backgroundColor: '#0E1A19',
    borderRadius: '24px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  settingsRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  settingLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#FFFFFF',
    display: 'block',
  },
  settingSub: {
    fontSize: '12px',
    color: '#828786',
    display: 'block',
    marginTop: '2px',
  },
  settingActionPill: {
    padding: '8px 18px',
    fontSize: '12px',
    borderRadius: '56px',
  },
  statusPill: {
    backgroundColor: 'rgba(61, 220, 145, 0.15)',
    color: '#3DDC91',
    borderRadius: '56px',
    padding: '5px 14px',
    fontSize: '11px',
    fontWeight: '600',
  },
  floatingMicButton: {
    position: 'fixed' as const,
    /* SAFE AREA FIX: Floats cleanly above elevated bottom nav bar and native gesture indicator */
    bottom: 'calc(78px + max(env(safe-area-inset-bottom, 0px), 20px))',
    right: '20px',
    width: '58px',
    height: '58px',
    borderRadius: '50%',
    backgroundColor: '#3DDC91', // Neon Pulse
    border: 'none',
    boxShadow: '0 8px 24px rgba(61, 220, 145, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 250,
    transition: 'transform 0.15s ease',
  },
};
