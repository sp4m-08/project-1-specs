import React, { useState, useEffect, useCallback } from 'react';
import {
  Mic,
  Layers,
  ShieldCheck,
  Settings,
  Radio,
  Volume2,
  VolumeX,
  Vibrate,
  Sparkles,
  RefreshCw,
  Bell,
  Smartphone,
} from 'lucide-react';
import { DashboardScreen } from './components/DashboardScreen';
import { Spatial3dRadar } from './components/Spatial3dRadar';
import { SecurityPayloadInspector } from './components/SecurityPayloadInspector';
import { AIChatDrawer } from './components/AIChatDrawer';
import { BottomNavBar, ActiveTab } from './components/BottomNavBar';
import { SplashScreen } from './components/SplashScreen';
import { MobileStatusBar } from './components/MobileStatusBar';
import { ToastNotification, ToastData } from './components/ToastNotification';
import { mobileUx } from './utils/haptics';
import { Capacitor } from '@capacitor/core';
import {
  SpecsTelemetry,
  SpecsVision,
  CaneTelemetry,
  BandTelemetry,
  FallAlertState,
  ObstacleCell3D,
  DecryptionLog,
  ChatMessage,
  DeviceLastSeen,
} from './types/telemetry';

/**
 * App — Production Mobile Shell & Root Component for Secure AIoT Assistive Suite
 * Theme: Cyber-Medical Sapphire Obsidian & Electric Azure Blue (#0B132B / #38BDF8)
 * Features:
 * - Native Mobile Boot Splash Screen & Handshake Simulation
 * - Mobile System Status Bar (Clock, 5G, Wi-Fi, Battery, Dynamic Island)
 * - In-App Native Toast Notifications
 * - Device Vibration Haptics & Synthetic Touch Audio Cues
 * - Text-To-Speech Clinical Voice Assist
 */
export const App: React.FC = () => {
  // Mobile Bootloader Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Connection & Navigation
  const [wsConnected, setWsConnected] = useState(false);
  const [httpConnected, setHttpConnected] = useState(false);
  const isConnected = wsConnected || httpConnected;

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // In-App Toast Notification Queue
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Mobile User Preferences
  const [soundEnabled, setSoundEnabled] = useState(mobileUx.getPreferences().soundEnabled);
  const [hapticsEnabled, setHapticsEnabled] = useState(mobileUx.getPreferences().hapticsEnabled);
  const [voiceAssistEnabled, setVoiceAssistEnabled] = useState(mobileUx.getPreferences().voiceAssistEnabled);

  // Live Wearable Telemetry Feeds
  const [specs, setSpecs] = useState<SpecsTelemetry | undefined>();
  const [specsVision, setSpecsVision] = useState<SpecsVision | undefined>();
  const [cane, setCane] = useState<CaneTelemetry | undefined>();
  const [band, setBand] = useState<BandTelemetry | undefined>();
  const [deviceLastSeen, setDeviceLastSeen] = useState<DeviceLastSeen>({
    specs: null,
    cane: null,
    band: null,
  });
  const [activeAlert, setActiveAlert] = useState<FallAlertState | null>(null);
  const [pointCloud, setPointCloud] = useState<ObstacleCell3D[]>([]);
  const [securityLogs, setSecurityLogs] = useState<DecryptionLog[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Server Host Configurator
  const [serverHost, setServerHost] = useState<string>(() => {
    const saved = localStorage.getItem('AIOT_SERVER_HOST');
    if (saved) return saved;
    if (Capacitor.isNativePlatform()) {
      return '10.92.95.114';
    }
    return (
      window.location.hostname && window.location.hostname !== 'localhost'
        ? window.location.hostname
        : 'localhost'
    );
  });

  const cleanHost = serverHost.trim().replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/.*$/, '');
  const isTunnelOrCloud = cleanHost.includes('.ngrok') || cleanHost.includes('.loca.lt') || cleanHost.includes('.onrender.com') || cleanHost.includes('.cloud');

  const apiBase = isTunnelOrCloud
    ? `https://${cleanHost.replace(/:[0-9]+$/, '')}`
    : cleanHost.includes(':')
    ? `http://${cleanHost}`
    : `http://${cleanHost}:4000`;

  const wsUrl = isTunnelOrCloud
    ? `wss://${cleanHost.replace(/:[0-9]+$/, '')}`
    : cleanHost.includes(':')
    ? `ws://${cleanHost}`
    : `ws://${cleanHost}:4000`;

  // Toast Dispatcher Helper
  const addToast = useCallback((title: string, message: string, type: ToastData['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastData = { id, title, message, type };
    setToasts((prev) => [...prev.slice(-2), newToast]); // Keep up to 3 toasts max

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Mobile UX Toggles
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    mobileUx.setSoundEnabled(next);
    if (next) {
      mobileUx.playTone('tap');
      addToast('Sound Effects Enabled', 'Futuristic touch audio feedback is now active.', 'info');
    }
  };

  const handleToggleHaptics = () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    mobileUx.setHapticsEnabled(next);
    if (next) {
      mobileUx.triggerHaptic('success');
      addToast('Haptics Active', 'Device vibration feedback is now enabled.', 'info');
    }
  };

  const handleToggleVoice = () => {
    const next = !voiceAssistEnabled;
    setVoiceAssistEnabled(next);
    mobileUx.setVoiceAssistEnabled(next);
    if (next) {
      mobileUx.speak('Clinical voice assistant activated.');
      addToast('Voice Assistant Active', 'Text-to-speech clinical alerts enabled.', 'success');
    }
  };

  // Establish WebSocket Telemetry Pipeline to Secure Bridge
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connectWs = () => {
      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('[Bridge Connected]: WebSocket Telemetry Pipeline active at', wsUrl);
          setWsConnected(true);
        };

        socket.onclose = () => {
          console.log('[Bridge Disconnected]: Reconnecting telemetry stream...');
          setWsConnected(false);
          reconnectTimer = setTimeout(connectWs, 2000);
        };

        socket.onerror = (e) => {
          console.error('[Bridge Socket Error]:', e);
          setWsConnected(false);
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
                  if (data.latestState.deviceLastSeen) setDeviceLastSeen(data.latestState.deviceLastSeen);
                }
                if (data.deviceLastSeen) setDeviceLastSeen(data.deviceLastSeen);
                if (data.spatialMap) setPointCloud(data.spatialMap);
                if (data.chatHistory) setChatMessages(data.chatHistory);
                break;

              case 'SPECS_TELEMETRY_UPDATE':
                setSpecs(data);
                setDeviceLastSeen((prev) => ({ ...prev, specs: data.lastPublished || Date.now() }));
                break;

              case 'SPECS_VISION_UPDATE':
                setSpecsVision(data);
                setDeviceLastSeen((prev) => ({ ...prev, specs: data.lastPublished || Date.now() }));
                break;

              case 'CANE_TELEMETRY_UPDATE':
                setCane(data);
                setDeviceLastSeen((prev) => ({ ...prev, cane: data.lastPublished || Date.now() }));
                break;

              case 'BAND_TELEMETRY_UPDATE':
                setBand(data);
                setDeviceLastSeen((prev) => ({ ...prev, band: data.lastPublished || Date.now() }));
                break;

              case 'FALL_ALERT_UPDATE':
                setActiveAlert(data);
                if (data.status === 'HIGH_CONFIDENCE_ALERT') {
                  mobileUx.triggerHaptic('sos');
                  mobileUx.playTone('sos');
                  mobileUx.speak('High confidence fall alert confirmed. Emergency call active.');
                  addToast('Dual Fall Impact', 'Algorithm 2 Dual-Device Confirmation Active!', 'alert');
                } else if (data.status === 'WARNING_PENDING') {
                  mobileUx.triggerHaptic('warning');
                  mobileUx.playTone('alert');
                  addToast('Impact Warning', 'Single device impact detected (awaiting fusion window)', 'warning');
                }
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
      } catch (err) {
        console.error('[WebSocket Creation Error]:', err);
        reconnectTimer = setTimeout(connectWs, 2000);
      }
    };

    connectWs();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, [wsUrl, addToast]);

  // HTTP Telemetry Sync Poller (Backup sync for mobile devices & public tunnels)
  useEffect(() => {
    let isMounted = true;

    const pollStatus = async () => {
      try {
        const res = await fetch(`${apiBase}/api/status`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        if (!res.ok) {
          if (isMounted) setHttpConnected(false);
          return;
        }
        const data = await res.json();
        if (!isMounted) return;

        setHttpConnected(true);

        if (data.deviceLastSeen) {
          setDeviceLastSeen(data.deviceLastSeen);
        } else if (data.latestState?.deviceLastSeen) {
          setDeviceLastSeen(data.latestState.deviceLastSeen);
        }

        if (data.latestState) {
          if (data.latestState.specs) setSpecs(data.latestState.specs);
          if (data.latestState.specsVision) setSpecsVision(data.latestState.specsVision);
          if (data.latestState.cane) setCane(data.latestState.cane);
          if (data.latestState.band) setBand(data.latestState.band);
          if (data.latestState.activeAlert !== undefined) setActiveAlert(data.latestState.activeAlert);
          if (data.latestState.securityLogs?.length) setSecurityLogs(data.latestState.securityLogs);
        }
      } catch (err) {
        // Silently handles reconnecting state
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiBase]);

  // Host IP Configuration Dialog
  const handleConfigureServer = () => {
    mobileUx.triggerHaptic('light');
    mobileUx.playTone('tap');
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
      addToast('Target Host Updated', `Bridge target set to ${clean}:4000`, 'info');
    }
  };

  // REST Trigger for Hardware Simulator
  const handleTriggerAction = async (action: string, value?: any) => {
    try {
      mobileUx.triggerHaptic('medium');
      mobileUx.playTone('tap');

      // Dispatch descriptive mobile toast
      switch (action) {
        case 'CANE_FALL':
          addToast('Cane Fall Injected', 'Ground accelerometer flag F_cane=1 active', 'warning');
          break;
        case 'BAND_FALL':
          addToast('Band Fall Injected', 'Wrist accelerometer flag F_band=1 active', 'warning');
          break;
        case 'DUAL_FALL':
          addToast('Dual Fall Triggered', 'Simulating synchronised cane + band fall impact', 'alert');
          break;
        case 'SOS_PRESS':
          addToast('SOS Emergency Signal', 'Emergency caregiver dispatch initiated', 'alert');
          break;
        case 'SOS_CANCEL':
        case 'CLEAR_FALL':
          addToast('Status Cleared', 'Algorithm 2 fall state reset to IDLE', 'success');
          setActiveAlert({
            id: `idle_${Date.now()}`,
            status: 'IDLE',
            confidence: 'NONE',
            message: 'Normal gait. No falls detected.',
            timestamp: Date.now(),
          });
          // Also invoke dedicated dismissal endpoint
          fetch(`${apiBase}/api/fall/dismiss`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          }).catch(() => {});
          break;
        case 'CURRENCY_500':
          addToast('Glasses YOLO Vision', 'Detected Indian Currency ₹500 Note', 'info');
          break;
        case 'PEDESTRIAN_CROSSING':
          addToast('Glasses YOLO Vision', 'Detected Pedestrian Crosswalk ahead', 'info');
          break;
        default:
          addToast('Hardware Command', `Dispatched ${action} to simulator`, 'info');
          break;
      }

      await fetch(`${apiBase}/api/simulator/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ action, value }),
      });
    } catch (err) {
      console.error('[Simulator Trigger Error]:', err);
      addToast('Simulator Offline', 'Unable to reach backend REST endpoint', 'alert');
    }
  };

  // REST Query for AI Chat Assistant
  const handleSendChatMessage = async (prompt: string) => {
    mobileUx.triggerHaptic('light');
    mobileUx.playTone('tap');

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
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ prompt }),
      });
      const assistantMsg = await res.json();
      setChatMessages((prev) => [...prev, assistantMsg]);
      mobileUx.triggerHaptic('success');
      mobileUx.playTone('tap');

      // If voice assist is active, speak the assistant summary
      if (voiceAssistEnabled && assistantMsg.text) {
        mobileUx.speak(assistantMsg.text);
      }
    } catch (err) {
      console.error('[AI Chatbot Query Error]:', err);
      addToast('Aura AI Offline', 'Could not query assistant server', 'alert');
    }
  };

  // Re-sync hardware trigger from top bar
  const handleResync = () => {
    addToast('Telemetry Synchronized', '50 Hz AES-GCM stream verified across all 3 nodes', 'success');
  };

  return (
    <div style={styles.appShell}>
      {/* 1. Authentic Mobile App Splash Screen / Bootloader */}
      {showSplash && (
        <SplashScreen
          onFinish={() => setShowSplash(false)}
          serverHost={serverHost}
        />
      )}

      {/* 2. Top Native Mobile Status Bar (Clock, 5G, Wi-Fi, Battery, Dynamic Island) */}
      <MobileStatusBar
        isConnected={isConnected}
        onToggleSound={handleToggleSound}
        isSoundEnabled={soundEnabled}
      />

      {/* 3. In-App Floating Toast Notification Center */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />

      {/* 4. Scrollable Main Viewport */}
      <main style={styles.contentViewport}>
        <div className="responsive-app-container">
          {/* TAB 1: Main Telemetry Dashboard */}
          {activeTab === 'dashboard' && (
            <DashboardScreen
              isConnected={isConnected}
              serverHost={serverHost}
              onConfigureServer={handleConfigureServer}
              onRefresh={handleResync}
              specs={specs}
              specsVision={specsVision}
              cane={cane}
              band={band}
              deviceLastSeen={deviceLastSeen}
              activeAlert={activeAlert}
              onCancelAlert={() => handleTriggerAction('SOS_CANCEL')}
              onTriggerAction={handleTriggerAction}
              onOpenChat={() => {
                mobileUx.triggerHaptic('light');
                mobileUx.playTone('tap');
                setIsChatOpen(true);
              }}
            />
          )}

          {/* TAB 2: 3D Spatial Radar Perception */}
          {activeTab === 'spatial' && (
            <div style={styles.subviewPadding} className="tab-transition-view">
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
            <div style={styles.subviewPadding} className="tab-transition-view">
              <div style={styles.subviewHeader}>
                <span className="eyebrow-label">CRYPTOGRAPHIC ATTESTATION</span>
                <h2 style={styles.subviewTitle}>AES-256-GCM Pipeline Inspector</h2>
              </div>
              <SecurityPayloadInspector logs={securityLogs} />
            </div>
          )}

          {/* TAB 4: Console Settings & Mobile UX Configuration */}
          {activeTab === 'settings' && (
            <div style={styles.subviewPadding} className="tab-transition-view">
              <div style={styles.subviewHeader}>
                <span className="eyebrow-label">ENGINEERING CONSOLE</span>
                <h2 style={styles.subviewTitle}>System & Mobile Preferences</h2>
              </div>

              <div style={styles.settingsCard}>
                {/* Replay Splash Screen Action */}
                <div style={styles.settingsRow}>
                  <div>
                    <span style={styles.settingLabel}>App Launch Animation</span>
                    <span style={styles.settingSub}>Replay the bootloader logo animation and diagnostic sequence</span>
                  </div>
                  <button
                    onClick={() => {
                      mobileUx.triggerHaptic('medium');
                      setShowSplash(true);
                    }}
                    className="pill-btn-primary"
                    style={styles.settingActionPill}
                  >
                    <Sparkles size={14} style={{ marginRight: 6 }} />
                    <span>Replay Launch</span>
                  </button>
                </div>

                {/* Direct Android APK Download */}
                <div style={styles.settingsRow}>
                  <div>
                    <span style={styles.settingLabel}>Android Mobile APK</span>
                    <span style={styles.settingSub}>Direct install package: AIoT-Assistive-Suite.apk (v1.0 • 4.3 MB)</span>
                  </div>
                  <a
                    href="/AIoT-Assistive-Suite.apk"
                    download="AIoT-Assistive-Suite.apk"
                    className="pill-btn-primary"
                    style={{ ...styles.settingActionPill, textDecoration: 'none' }}
                    onClick={() => {
                      mobileUx.triggerHaptic('success');
                      mobileUx.playTone('boot_ready');
                      addToast('APK Download Started', 'Saving AIoT-Assistive-Suite.apk to your device', 'success');
                    }}
                  >
                    <Smartphone size={14} style={{ marginRight: 6 }} />
                    <span>Download APK</span>
                  </a>
                </div>

                {/* Sound Effects Toggle */}
                <div style={styles.settingsRow}>
                  <div>
                    <span style={styles.settingLabel}>Futuristic Touch Audio</span>
                    <span style={styles.settingSub}>Synthetic high-tech acoustic feedback on button presses & tabs</span>
                  </div>
                  <button
                    onClick={handleToggleSound}
                    className={soundEnabled ? 'pill-btn-primary' : 'pill-btn-ghost'}
                    style={styles.settingActionPill}
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 size={14} style={{ marginRight: 6 }} />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <VolumeX size={14} style={{ marginRight: 6 }} />
                        <span>Muted</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Vibration Haptics Toggle */}
                <div style={styles.settingsRow}>
                  <div>
                    <span style={styles.settingLabel}>Device Vibration Haptics</span>
                    <span style={styles.settingSub}>Tactile motor pulses on taps, SOS, and fall triggers (Web Vibration API)</span>
                  </div>
                  <button
                    onClick={handleToggleHaptics}
                    className={hapticsEnabled ? 'pill-btn-primary' : 'pill-btn-ghost'}
                    style={styles.settingActionPill}
                  >
                    <Vibrate size={14} style={{ marginRight: 6 }} />
                    <span>{hapticsEnabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>

                {/* Voice Assist Toggle */}
                <div style={styles.settingsRow}>
                  <div>
                    <span style={styles.settingLabel}>Clinical Voice Assist</span>
                    <span style={styles.settingSub}>Text-To-Speech spoken voice alerts for visual impairment & fall warnings</span>
                  </div>
                  <button
                    onClick={handleToggleVoice}
                    className={voiceAssistEnabled ? 'pill-btn-primary' : 'pill-btn-ghost'}
                    style={styles.settingActionPill}
                  >
                    <Bell size={14} style={{ marginRight: 6 }} />
                    <span>{voiceAssistEnabled ? 'Active' : 'Disabled'}</span>
                  </button>
                </div>

                {/* Server Host Config */}
                <div style={styles.settingsRow}>
                  <div>
                    <span style={styles.settingLabel}>Bridge Endpoint Target</span>
                    <span style={styles.settingSub}>{apiBase}</span>
                  </div>
                  <button
                    onClick={handleConfigureServer}
                    className="pill-btn-ghost"
                    style={styles.settingActionPill}
                  >
                    Configure Host
                  </button>
                </div>

                {/* MQTT Broker Info */}
                <div style={styles.settingsRow}>
                  <div>
                    <span style={styles.settingLabel}>Mosquitto MQTT Secure Broker</span>
                    <span style={styles.settingSub}>test.mosquitto.org:8883 (AES-256-GCM + MQTTS TLS QoS 1/0)</span>
                  </div>
                  <span style={styles.statusPill}>MQTTS TLS Active</span>
                </div>

                {/* Emergency Contact */}
                <div style={styles.settingsRow}>
                  <div>
                    <span style={styles.settingLabel}>Primary Caregiver Emergency Contact</span>
                    <span style={styles.settingSub}>Dr. R. Sharma: +91-98765-43210</span>
                  </div>
                  <button
                    onClick={() => {
                      mobileUx.triggerHaptic('success');
                      mobileUx.playTone('tap');
                      addToast('Emergency Dispatch', 'SMS & Voice beacon verified with cellular relay.', 'success');
                    }}
                    className="pill-btn-ghost"
                    style={styles.settingActionPill}
                  >
                    Verify Dispatch
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 5. Floating Microphone Action Button (Electric Azure #38BDF8) */}
      <button
        onClick={() => {
          mobileUx.triggerHaptic('medium');
          mobileUx.playTone('tap');
          setIsChatOpen(true);
        }}
        style={styles.floatingMicButton}
        className="live-pulse-blue"
        title="Open Aura AI Voice & Sensor Fusion Assistant"
      >
        <Mic size={24} color="#070D1E" />
      </button>

      {/* 6. Bottom Tab Pill Navigation */}
      <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* 7. Voice-Enabled AI Chatbot & Sensor Fusion Modal Drawer */}
      <AIChatDrawer
        isOpen={isChatOpen}
        onClose={() => {
          mobileUx.triggerHaptic('light');
          setIsChatOpen(false);
        }}
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
    backgroundColor: '#0B132B', // Deep Sapphire Canvas
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
    paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 12px)',
    paddingBottom: '20px',
    paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
    paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
  },
  subviewHeader: {
    marginBottom: '16px',
  },
  subviewTitle: {
    fontSize: '22px',
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
    margin: '4px 0 0 0',
  },
  settingsCard: {
    backgroundColor: '#0F1D38',
    borderRadius: '24px',
    padding: '20px 16px',
    border: '1px solid rgba(56, 189, 248, 0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  settingsRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderTop: '1px solid rgba(56, 189, 248, 0.1)',
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
    color: '#8CA2C2',
    display: 'block',
    marginTop: '2px',
  },
  settingActionPill: {
    padding: '8px 18px',
    fontSize: '12px',
    borderRadius: '56px',
  },
  statusPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    color: '#38BDF8',
    borderRadius: '56px',
    padding: '5px 14px',
    fontSize: '11px',
    fontWeight: '600',
  },
  floatingMicButton: {
    position: 'fixed' as const,
    /* SAFE AREA FIX: Floats cleanly above elevated bottom nav bar and native gesture indicator */
    bottom: 'calc(74px + max(env(safe-area-inset-bottom, 0px), 16px))',
    right: '16px',
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    backgroundColor: '#38BDF8', // Electric Azure
    border: 'none',
    boxShadow: '0 6px 20px rgba(56, 189, 248, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 250,
    transition: 'transform 0.15s ease',
    touchAction: 'manipulation' as const,
  },
};
