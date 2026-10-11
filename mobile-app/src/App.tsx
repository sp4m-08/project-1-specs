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

  // Establish WebSocket Connection to Backend Server
  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname || 'localhost'}:4000`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('[WSS Connected to Backend Pipeline]');
      setIsConnected(true);
    };

    socket.onclose = () => {
      console.log('[WSS Disconnected]');
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
  }, []);

  // REST Simulator Trigger Handler
  const handleTriggerAction = async (action: string, value?: any) => {
    try {
      await fetch('/api/simulator/trigger', {
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
      const res = await fetch('/api/chatbot/query', {
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

  return (
    <div style={styles.appWrapper}>
      {/* Top Header Bar */}
      <HeaderBar
        isConnected={isConnected}
        activeAlertCount={activeAlert && activeAlert.status !== 'IDLE' ? 1 : 0}
        onOpenChat={() => setIsChatOpen(true)}
        onTriggerSos={() => handleTriggerAction('SOS_PRESS')}
      />

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {/* Hardware Simulator Control Bar */}
        <SimulatorControlBar onTriggerAction={handleTriggerAction} />

        {/* Algorithm 2 Fall Verification Monitor */}
        <FallFusionMonitor
          activeAlert={activeAlert}
          onCancelAlert={() => handleTriggerAction('SOS_CANCEL')}
        />

        {/* Tab 1: Telemetry & Grid Dashboard */}
        {activeTab === 'dashboard' && (
          <>
            <WearablesGrid
              specs={specs}
              specsVision={specsVision}
              cane={cane}
              band={band}
            />

            <VitalsTelemetryChart
              currentHr={band?.heart_rate || cane?.heart_rate || 72}
              currentSpO2={band?.spo2 || cane?.spo2 || 98}
            />

            <Spatial3dRadar
              pointCloud={pointCloud}
              pitchDeg={specs?.pitch_deg || 4.2}
              yawDeg={specs?.yaw_deg || -12.5}
            />
          </>
        )}

        {/* Tab 2: 3D Spatial Radar View */}
        {activeTab === 'spatial' && (
          <Spatial3dRadar
            pointCloud={pointCloud}
            pitchDeg={specs?.pitch_deg || 4.2}
            yawDeg={specs?.yaw_deg || -12.5}
          />
        )}

        {/* Tab 3: Security & AES-GCM Log Inspector */}
        {activeTab === 'security' && (
          <SecurityPayloadInspector logs={securityLogs} />
        )}

        {/* Tab 4: Caregiver Settings & Patient Overview */}
        {activeTab === 'settings' && (
          <div className="glass-card" style={{ padding: 20, margin: 20 }}>
            <h3 style={{ color: '#F8FAFC', marginBottom: 10 }}>Caregiver & Emergency Configuration</h3>
            <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.5 }}>
              Patient Profile: Active Monitoring for Visually Impaired / Elderly Wearer.<br />
              Emergency Caregiver Phone: +1 (555) 019-2831<br />
              SOS Escalation Window: 30 seconds (Algorithm 2 parameter T_resp).<br />
              Encryption Protocol: AES-256-GCM authenticated payload over TLS-secured MQTT (QoS 1).
            </p>
          </div>
        )}
      </main>

      {/* Interactive Aura AI Chatbot Modal */}
      <AuraAiChatbotModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendChatMessage}
      />

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
};

const styles = {
  appWrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#0B0F17',
  },
  mainContent: {
    flex: 1,
    paddingBottom: '20px',
  },
};
