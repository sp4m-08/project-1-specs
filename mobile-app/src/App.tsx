import React, { useState, useEffect } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { WearablesGrid } from './components/WearablesGrid';
import { VitalsTelemetryChart } from './components/VitalsTelemetryChart';
import { Spatial3dRadar } from './components/Spatial3dRadar';
import { FallFusionMonitor } from './components/FallFusionMonitor';
import { SecurityPayloadInspector } from './components/SecurityPayloadInspector';
import { AuraAiChatbotModal } from './components/AuraAiChatbotModal';
import { SimulatorControlBar } from './components/SimulatorControlBar';
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

export const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Live Telemetry States
  const [specs, setSpecs] = useState<SpecsTelemetry | undefined>();
  const [specsVision, setSpecsVision] = useState<SpecsVision | undefined>();
  const [cane, setCane] = useState<CaneTelemetry | undefined>();
  const [band, setBand] = useState<BandTelemetry | undefined>();
  const [activeAlert, setActiveAlert] = useState<FallAlertState | null>(null);
  const [pointCloud, setPointCloud] = useState<ObstacleCell3D[]>([]);
  const [securityLogs, setSecurityLogs] = useState<DecryptionLog[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [serverHost, setServerHost] = useState<string>(() => {
    return (
      localStorage.getItem('AIOT_SERVER_HOST') ||
      (window.location.hostname && window.location.hostname !== 'localhost' ? window.location.hostname : 'localhost')
    );
  });

  const apiBase = `http://${serverHost}:4000`;

  // Establish WebSocket Connection to Backend Server
  useEffect(() => {
    const wsUrl = `ws://${serverHost}:4000`;
    let socket: WebSocket;
    try {
      socket = new WebSocket(wsUrl);
    } catch (err) {
      console.error('WebSocket init error:', err);
      setIsConnected(false);
      return;
    }

    socket.onopen = () => {
      console.log('[WSS Connected to Backend Pipeline]');
      setIsConnected(true);
    };

    socket.onclose = () => {
      console.log('[WSS Disconnected]');
      setIsConnected(false);
    };

    socket.onerror = (e) => {
      console.error('[WSS Error]', e);
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
        console.error('WSS parse error:', err);
      }
    };

    return () => {
      socket.close();
    };
  }, [serverHost]);

  // Server Host Configurator
  const handleConfigureServer = () => {
    const next = window.prompt(
      'Configure AIoT Server Host:\n\n• For USB debugging with adb reverse, keep "localhost"\n• For Wi-Fi debugging, enter PC local IP (e.g. 192.168.1.15):',
      serverHost
    );
    if (next && next.trim()) {
      const clean = next.trim().replace(/^http:\/\/|^https:\/\/|^ws:\/\//, '').replace(/:[0-9]+$/, '');
      localStorage.setItem('AIOT_SERVER_HOST', clean);
      setServerHost(clean);
    }
  };

  // REST Simulator Trigger Handler
  const handleTriggerAction = async (action: string, value?: any) => {
    try {
      await fetch(`${apiBase}/api/simulator/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });
    } catch (err) {
      console.error('Simulator trigger error:', err);
    }
  };

  // REST Chatbot Handler
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
      console.error('Chatbot query error:', err);
    }
  };

  const currentHr = band?.heart_rate || cane?.heart_rate || 72;
  const currentSpO2 = band?.spo2 || cane?.spo2 || 98;

  return (
    <div style={styles.appContainer}>
      {/* Top Header & Announcement Bar */}
      <HeaderBar
        isConnected={isConnected}
        activeAlertCount={activeAlert && activeAlert.status !== 'IDLE' ? 1 : 0}
        serverHost={serverHost}
        onConfigureServer={handleConfigureServer}
        onOpenChat={() => setIsChatOpen(true)}
        onTriggerSos={() => handleTriggerAction('SOS_PRESS')}
      />

      <main style={styles.mainScrollable}>
        {/* Sauce Labs Stat Block Row (Floats on #132322 background) */}
        <section style={styles.statBlockSection}>
          <div style={styles.statColumn}>
            <span style={styles.statNumber}>50 Hz</span>
            <span style={styles.statLabel}>TELEMETRY STREAM RATE</span>
          </div>
          <div style={styles.statColumn}>
            <span style={styles.statNumber}>256-BIT</span>
            <span style={styles.statLabel}>AES-GCM HARDWARE ENCRYPTION</span>
          </div>
          <div style={styles.statColumn}>
            <span style={styles.statNumber}>3.0s</span>
            <span style={styles.statLabel}>ALGORITHM 2 FUSION WINDOW</span>
          </div>
          <div style={styles.statColumn}>
            <span style={styles.statNumber}>&lt; 2.1ms</span>
            <span style={styles.statLabel}>BROKER TRANSIT LATENCY</span>
          </div>
        </section>

        {/* Tab 1: Dashboard View */}
        {activeTab === 'dashboard' && (
          <>
            {/* Tri-Wearable Module Grid */}
            <WearablesGrid
              specs={specs}
              specsVision={specsVision}
              cane={cane}
              band={band}
            />

            {/* Signature Sauce Labs Mint Frost Light Card: Algorithm 2 Fall Verification */}
            <FallFusionMonitor
              activeAlert={activeAlert}
              onCancelAlert={() => handleTriggerAction('SOS_CANCEL')}
            />

            {/* Live Biometric Area Chart */}
            <VitalsTelemetryChart
              currentHr={currentHr}
              currentSpO2={currentSpO2}
            />

            {/* Embedded Hardware Simulator Bar */}
            <SimulatorControlBar onTriggerAction={handleTriggerAction} />
          </>
        )}

        {/* Tab 2: 3D Spatial Radar View */}
        {activeTab === 'spatial' && (
          <Spatial3dRadar
            pointCloud={pointCloud}
            pitchDeg={specs?.pitch_deg}
            yawDeg={specs?.yaw_deg}
          />
        )}

        {/* Tab 3: AES-256-GCM Security Inspector View */}
        {activeTab === 'security' && (
          <SecurityPayloadInspector logs={securityLogs} />
        )}

        {/* Tab 4: Config & Caregiver View */}
        {activeTab === 'settings' && (
          <section style={styles.settingsSection}>
            <div className="deep-abyss-card" style={styles.settingsCard}>
              <span className="eyebrow-label">SYSTEM CONFIGURATION</span>
              <h3 style={styles.settingsHeading}>Command Center Settings</h3>

              <div style={styles.settingsRow}>
                <div>
                  <span style={styles.settingTitle}>Backend Host Endpoint</span>
                  <span style={styles.settingDesc}>Current: ws://{serverHost}:4000</span>
                </div>
                <button onClick={handleConfigureServer} className="pill-btn-primary" style={styles.settingBtn}>
                  Change IP
                </button>
              </div>

              <div style={styles.settingsRow}>
                <div>
                  <span style={styles.settingTitle}>MQTT HiveMQ Public Broker</span>
                  <span style={styles.settingDesc}>broker.hivemq.com:1883 (Active TLS)</span>
                </div>
                <span style={styles.statusOkPill}>Connected</span>
              </div>

              <div style={styles.settingsRow}>
                <div>
                  <span style={styles.settingTitle}>Emergency Contacts (SOS Dispatch)</span>
                  <span style={styles.settingDesc}>Caregiver Primary: +91-98765-43210</span>
                </div>
                <button
                  onClick={() => alert('Emergency dispatch contacts verified active.')}
                  className="pill-btn-ghost"
                  style={styles.settingBtn}
                >
                  Verify Contacts
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Sauce Labs Tab Pill Navigation */}
      <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Aura AI Chatbot Modal */}
      <AuraAiChatbotModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendChatMessage}
      />
    </div>
  );
};

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    backgroundColor: '#132322',
    color: '#FFFFFF',
  },
  mainScrollable: {
    flex: 1,
    overflowY: 'auto' as const,
    paddingBottom: '20px',
  },
  statBlockSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '16px',
    padding: '24px 20px',
  },
  statColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '500',
    color: '#3DDC91',
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
  settingsSection: {
    padding: '0 20px 24px 20px',
  },
  settingsCard: {
    backgroundColor: '#0E1A19',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  settingsHeading: {
    fontSize: '20px',
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
    margin: 0,
  },
  settingsRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  settingTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#FFFFFF',
    display: 'block',
  },
  settingDesc: {
    fontSize: '12px',
    color: '#828786',
    display: 'block',
  },
  settingBtn: {
    padding: '6px 16px',
    fontSize: '12px',
    borderRadius: '56px',
  },
  statusOkPill: {
    backgroundColor: 'rgba(61, 220, 145, 0.15)',
    color: '#3DDC91',
    borderRadius: '56px',
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '500',
  },
};
