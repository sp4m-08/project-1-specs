import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Vibrate,
  Sparkles,
  Bell,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { DashboardScreen } from './components/DashboardScreen';
import { Spatial3dRadar } from './components/Spatial3dRadar';
import { SecurityPayloadInspector } from './components/SecurityPayloadInspector';
import { AIChatDrawer } from './components/AIChatDrawer';
import { BottomNavBar, ActiveTab } from './components/BottomNavBar';
import { SplashScreen } from './components/SplashScreen';
import { RoleSelectionScreen } from './components/RoleSelectionScreen';
import { EmergencyContactSetup } from './components/EmergencyContactSetup';
import { AlertsScreen } from './components/AlertsScreen';
import { SimulatorControlBar } from './components/SimulatorControlBar';
import { ToastNotification, ToastData } from './components/ToastNotification';
import { mobileUx } from './utils/haptics';
import { Capacitor } from '@capacitor/core';
import { emergencyActions } from './native/emergencyActions';
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
  UserRole,
  SafetyAlert,
} from './types/telemetry';
import {
  EMERGENCY_CONTACT_STORAGE_KEY,
  EmergencyContact,
  loadEmergencyContact,
} from './types/emergency';

/**
 * App — AURA Assist shell for the wearer and caregiver demo experiences.
 * Features:
 * - Native Mobile Boot Splash Screen & Handshake Simulation
 * - In-App Native Toast Notifications
 * - Device Vibration Haptics & Synthetic Touch Audio Cues
 * - Text-to-speech safety assistance
 */
export const App: React.FC = () => {
  // Mobile Bootloader Splash Screen State
  const [showSplash, setShowSplash] = useState(true);
  const finishSplash = useCallback(() => setShowSplash(false), []);
  const [role, setRole] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem('AURA_USER_ROLE');
    return saved === 'wearer' || saved === 'caregiver' ? saved : null;
  });
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact | null>(loadEmergencyContact);
  const [isContactEditorOpen, setIsContactEditorOpen] = useState(false);
  const lastDispatchedAlertIdRef = useRef<string | null>(
    localStorage.getItem('AURA_LAST_EMERGENCY_DISPATCH_ID')
  );

  // Connection & Navigation
  const [wsConnected, setWsConnected] = useState(false);
  const [httpConnected, setHttpConnected] = useState(false);
  const isConnected = wsConnected || httpConnected;

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showDeveloperTools, setShowDeveloperTools] = useState(
    () => import.meta.env.DEV && localStorage.getItem('AURA_DEVELOPER_TOOLS') === 'true'
  );

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
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [pointCloud, setPointCloud] = useState<ObstacleCell3D[]>([]);
  const [securityLogs, setSecurityLogs] = useState<DecryptionLog[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Server Host Configurator
  const [serverHost, setServerHost] = useState<string>(() => {
    const saved = localStorage.getItem('AIOT_SERVER_HOST');
    if (saved) return saved;
    if (Capacitor.isNativePlatform()) {
      return 'localhost';
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

  const selectRole = useCallback((nextRole: UserRole) => {
    localStorage.setItem('AURA_USER_ROLE', nextRole);
    setRole(nextRole);
    setActiveTab('dashboard');
    setIsChatOpen(false);
    addToast(
      nextRole === 'caregiver' ? 'Caregiver view ready' : 'Wearer view ready',
      nextRole === 'caregiver'
        ? 'Safety, health, and wearable updates are ready to review.'
        : 'Large safety actions and spoken assistance are ready.',
      'success'
    );
  }, [addToast]);

  const handleChangeRole = useCallback(() => {
    localStorage.removeItem('AURA_USER_ROLE');
    setRole(null);
    setActiveTab('dashboard');
    setIsChatOpen(false);
  }, []);

  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((previous) => previous.map((alert) => (
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    )));
  }, []);

  const addSafetyAlert = useCallback((alert: SafetyAlert) => {
    setAlerts((previous) => [alert, ...previous.filter((item) => item.id !== alert.id)].slice(0, 40));
  }, []);

  const handleSaveEmergencyContact = useCallback(async (contact: EmergencyContact) => {
    if (Capacitor.isNativePlatform()) {
      await emergencyActions.requestPermissions();
    }

    localStorage.setItem(EMERGENCY_CONTACT_STORAGE_KEY, JSON.stringify(contact));
    setEmergencyContact(contact);
    setIsContactEditorOpen(false);
    addToast(
      'Emergency contact saved',
      Capacitor.isNativePlatform()
        ? `${contact.name} can receive the native fall SMS and call.`
        : 'The contact is saved for the Android build.',
      'success'
    );
  }, [addToast]);

  const dispatchEmergencyAlert = useCallback(async (alert: FallAlertState) => {
    if (alert.status !== 'ESCALATED_TO_CAREGIVER') return;

    if (!emergencyContact) {
      addToast(
        'Emergency contact missing',
        'Open More and add a contact before relying on automatic fall actions.',
        'alert'
      );
      return;
    }

    if (lastDispatchedAlertIdRef.current === alert.id) return;
    lastDispatchedAlertIdRef.current = alert.id;

    const message = [
      'AURA Assist emergency alert:',
      'The wearer did not silence a possible fall alert within the response window.',
      `Please check on ${emergencyContact.name} now.`,
    ].join(' ');

    try {
      await emergencyActions.sendEmergencyAlert({
        phone: emergencyContact.phone,
        message,
      });
      localStorage.setItem('AURA_LAST_EMERGENCY_DISPATCH_ID', alert.id);
      addToast(
        'Emergency actions started',
        `Native SMS sent and call started for ${emergencyContact.name}.`,
        'alert'
      );
    } catch (error) {
      addToast(
        'Emergency actions failed',
        error instanceof Error ? error.message : 'Android could not start the native SMS and call.',
        'alert'
      );
    }
  }, [addToast, emergencyContact]);

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
       mobileUx.speak('Spoken safety alerts activated.');
       addToast('Spoken safety alerts active', 'AURA Assist will read important updates aloud.', 'success');
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
                   if (data.latestState.activeAlert?.status === 'ESCALATED_TO_CAREGIVER') {
                     void dispatchEmergencyAlert(data.latestState.activeAlert);
                   }
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
                if (data.status === 'ESCALATED_TO_CAREGIVER') {
                  void dispatchEmergencyAlert(data);
                }
                if (data.status !== 'IDLE') {
                  addSafetyAlert({
                    id: data.id,
                    level: data.confidence === 'HIGH' ? 'critical' : 'warning',
                    title: data.confidence === 'HIGH' ? 'Fall likely confirmed' : 'Possible fall detected',
                    message: data.message,
                    timestamp: data.timestamp || Date.now(),
                    source: 'fall',
                  });
                }
                if (data.status === 'HIGH_CONFIDENCE_ALERT') {
                  mobileUx.triggerHaptic('sos');
                  mobileUx.playTone('sos');
                   mobileUx.speak('High confidence fall alert confirmed. Review the alert now.');
                  addToast('Dual Fall Impact', 'Algorithm 2 Dual-Device Confirmation Active!', 'alert');
                } else if (data.status === 'LOW_CONFIDENCE_WARNING' || data.status === 'WARNING_PENDING') {
                  mobileUx.triggerHaptic('warning');
                  mobileUx.playTone('alert');
                  addToast('Impact Warning', 'Single device impact detected (awaiting fusion window)', 'warning');
                }
                break;

              case 'HEALTH_ALERT':
                addSafetyAlert({
                  id: `health_${data.timestamp || Date.now()}_${data.level}`,
                  level: data.level === 'CRITICAL' ? 'critical' : 'warning',
                  title: data.level === 'CRITICAL' ? 'Health needs attention' : 'Health update',
                  message: data.message,
                  timestamp: data.timestamp || Date.now(),
                  source: 'health',
                });
                addToast(
                  data.level === 'CRITICAL' ? 'Health alert' : 'Health update',
                  data.message,
                  data.level === 'CRITICAL' ? 'alert' : 'warning'
                );
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
  }, [wsUrl, addToast, addSafetyAlert, dispatchEmergencyAlert]);

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
           if (data.latestState.activeAlert !== undefined) {
             setActiveAlert(data.latestState.activeAlert);
             if (data.latestState.activeAlert?.status === 'ESCALATED_TO_CAREGIVER') {
               void dispatchEmergencyAlert(data.latestState.activeAlert);
             }
           }
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
  }, [apiBase, dispatchEmergencyAlert]);

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
           addToast('SOS demo signal sent', 'The local bridge received the SOS action. No call or message was placed.', 'alert');
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
           addToast('Smart Glasses update', 'A currency note was detected ahead.', 'info');
          break;
        case 'PEDESTRIAN_CROSSING':
           addToast('Smart Glasses update', 'A person or crossing was detected ahead.', 'info');
          break;
        default:
          addToast('Hardware Command', `Dispatched ${action} to simulator`, 'info');
          break;
      }

      const response = await fetch(`${apiBase}/api/simulator/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ action, value }),
      });
      if (!response.ok) {
        throw new Error(`Simulator request failed with ${response.status}`);
      }
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
      addToast('AURA Guide offline', 'Could not query the assistant service. You can try again.', 'alert');
    }
  };

  // Re-sync hardware trigger from top bar
  const handleResync = () => {
    addToast('Connection refreshed', 'AURA Assist is checking the latest wearable updates.', 'success');
  };

  return (
    <div style={styles.appShell} className="dadaist-shell grunge-theme">
      {/* 1. Authentic Mobile App Splash Screen / Bootloader */}
      {showSplash && (
        <SplashScreen
          onFinish={finishSplash}
          serverHost={serverHost}
        />
      )}

      {/* In-app notification center */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />

      {!role ? (
        <RoleSelectionScreen onSelectRole={selectRole} />
      ) : !emergencyContact ? (
        <EmergencyContactSetup required onSave={handleSaveEmergencyContact} />
      ) : isContactEditorOpen ? (
        <EmergencyContactSetup
          initialContact={emergencyContact}
          onSave={handleSaveEmergencyContact}
          onCancel={() => setIsContactEditorOpen(false)}
        />
      ) : (
        <>
          {/* Scrollable main viewport */}
          <main style={styles.contentViewport}>
            <div className="responsive-app-container">
              {activeTab === 'dashboard' && (
                <DashboardScreen
                  role={role}
                  wearerName="Demo wearer"
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

              {activeTab === 'spatial' && (
                <div style={styles.subviewPadding} className="tab-transition-view dadaist-shell">
                  <div style={styles.subviewHeader} className="dadaist-subview-header">
                    <span className="eyebrow-label">PATH AWARENESS</span>
                    <h1 style={styles.subviewTitle}>{role === 'caregiver' ? 'Wearer path awareness' : 'What is ahead?'}</h1>
                    <p className="page-description">Nearby objects detected by the Smart Glasses are shown here. This is a simulation view when demo data is active.</p>
                  </div>
                  <Spatial3dRadar
                    pointCloud={pointCloud}
                    pitchDeg={specs?.pitch_deg}
                    yawDeg={specs?.yaw_deg}
                  />
                </div>
              )}

              {activeTab === 'alerts' && (
                <AlertsScreen alerts={alerts} role={role} onAcknowledge={handleAcknowledgeAlert} />
              )}

              {activeTab === 'settings' && (
                <div style={styles.subviewPadding} className="tab-transition-view dadaist-shell">
                  <div style={styles.subviewHeader} className="dadaist-subview-header">
                    <span className="eyebrow-label">PERSONAL SETTINGS</span>
                    <h1 style={styles.subviewTitle}>More</h1>
                    <p className="page-description">Adjust how AURA Assist speaks, feels, and connects on this device.</p>
                  </div>

                  <div style={styles.settingsCard} className="dadaist-settings-card">
                <div className="profile-card">
                  <div className="profile-card__icon" aria-hidden="true"><ShieldCheck size={20} /></div>
                  <div>
                    <strong>{role === 'caregiver' ? 'Caregiver view' : 'Wearer view'}</strong>
                    <span>{role === 'caregiver' ? 'Monitoring Demo wearer' : 'Your personal safety view'}</span>
                  </div>
                  <button className="button button--secondary" type="button" onClick={handleChangeRole}>Change role</button>
                </div>
                {/* Replay Splash Screen Action */}
                <div style={styles.settingsRow}>
                  <div>
                    <span style={styles.settingLabel}>App Launch Animation</span>
                    <span style={styles.settingSub}>Replay the AURA Assist introduction</span>
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
                    <span style={styles.settingSub}>Direct install package for the Android demo build</span>
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
                    <span style={styles.settingLabel}>Touch sounds</span>
                    <span style={styles.settingSub}>Short sounds for navigation and important actions</span>
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
                    <span style={styles.settingLabel}>Vibration feedback</span>
                    <span style={styles.settingSub}>Tactile feedback for taps, SOS, and safety alerts</span>
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
                    <span style={styles.settingLabel}>Spoken safety alerts</span>
                    <span style={styles.settingSub}>Read important safety updates aloud when enabled</span>
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
                    <span style={styles.settingLabel}>Connection target</span>
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
                    <span style={styles.settingLabel}>AURA Bridge status</span>
                    <span style={styles.settingSub}>{isConnected ? 'The dashboard can reach the local bridge.' : 'The dashboard is waiting for the local bridge.'}</span>
                  </div>
                  <span style={styles.statusPill}>{isConnected ? 'Connected' : 'Offline'}</span>
                </div>

                {/* Native emergency contact */}
                <div style={styles.settingsRow}>
                  <div>
                    <span style={styles.settingLabel}>Emergency contact</span>
                    <span style={styles.settingSub}>
                      {emergencyContact
                        ? `${emergencyContact.name} • ${emergencyContact.phone}`
                        : 'Required for automatic native SMS and call actions.'}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsContactEditorOpen(true)}
                    className="pill-btn-ghost"
                    style={styles.settingActionPill}
                  >
                    {emergencyContact ? 'Edit contact' : 'Set contact'}
                  </button>
                </div>

                {import.meta.env.DEV && (
                  <>
                    <div className="settings-divider" />
                    <div style={styles.settingsRow}>
                      <div>
                        <span style={styles.settingLabel}>Developer tools</span>
                        <span style={styles.settingSub}>Show simulator controls and encrypted transport diagnostics for local testing only.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !showDeveloperTools;
                          setShowDeveloperTools(next);
                          localStorage.setItem('AURA_DEVELOPER_TOOLS', String(next));
                        }}
                        className={showDeveloperTools ? 'pill-btn-primary' : 'pill-btn-ghost'}
                        style={styles.settingActionPill}
                      >
                        {showDeveloperTools ? 'Shown' : 'Hidden'}
                      </button>
                    </div>
                    {showDeveloperTools && (
                      <>
                        <SecurityPayloadInspector logs={securityLogs} />
                        <div className="settings-divider" />
                        <div className="developer-tools">
                          <span className="eyebrow-label">LOCAL DEMO ONLY</span>
                          <h2>Simulation tools</h2>
                          <p>These controls create synthetic device events. They are not available in production builds.</p>
                          <SimulatorControlBar onTriggerAction={handleTriggerAction} />
                        </div>
                      </>
                    )}
                  </>
                 )}
               </div>
             </div>
             )}
             </div>
           </main>

          <button
            onClick={() => {
              mobileUx.triggerHaptic('medium');
              mobileUx.playTone('tap');
              setIsChatOpen(true);
            }}
             style={styles.floatingMicButton}
             className="live-pulse-blue dadaist-float-mic"
            title="Ask AURA Guide"
            aria-label="Open AURA Guide voice assistant"
            type="button"
          >
            <Mic size={24} color="#07131A" />
          </button>

          <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} role={role} />

          <AIChatDrawer
            isOpen={isChatOpen}
            onClose={() => {
              mobileUx.triggerHaptic('light');
              setIsChatOpen(false);
            }}
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
            role={role}
            wearerName="Demo wearer"
          />
        </>
      )}
    </div>
  );
};

const styles = {
  appShell: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    backgroundColor: '#08131A',
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
    backgroundColor: '#10232A',
    borderRadius: '24px',
    padding: '20px 16px',
    border: '1px solid rgba(91, 200, 232, 0.18)',
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
