import React, { useState, useEffect } from 'react';
import { Zap, ShieldCheck, Eye, Navigation, Activity, ArrowRight, Cpu, Radio } from 'lucide-react';
import { mobileUx } from '../utils/haptics';

interface SplashScreenProps {
  onFinish: () => void;
  serverHost: string;
}

interface BootPhase {
  threshold: number;
  label: string;
  sub: string;
}

const BOOT_PHASES: BootPhase[] = [
  { threshold: 18, label: 'INITIALIZING CRYPTOGRAPHIC ENCLAVE', sub: 'Mounting AES-256-GCM authenticated cipher context...' },
  { threshold: 42, label: 'CONNECTING SMART GLASSES (ESP32-CAM)', sub: 'Establishing 20 FPS YOLO neural vision pipeline...' },
  { threshold: 68, label: 'LINKING SMART CANE & SMART BAND', sub: 'Synchronizing ultrasonic proximity & MAX30100 PPG stream...' },
  { threshold: 88, label: 'SECURING WEBSOCKET TELEMETRY BRIDGE', sub: 'Handshaking MQTT message broker on port 4000...' },
  { threshold: 100, label: 'SYSTEM VERIFIED & OPERATIONAL', sub: 'Algorithm 2 dual-device fall fusion engine online.' },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, serverHost }) => {
  const [progress, setProgress] = useState(0);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Initial gentle haptic
    mobileUx.triggerHaptic('light');

    const duration = 2800; // 2.8 seconds total boot sequence
    const intervalTime = 35;
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + increment + Math.random() * 0.4, 100);

        // Update phase label based on thresholds
        const phaseIdx = BOOT_PHASES.findIndex((p) => next <= p.threshold);
        if (phaseIdx !== -1) {
          setCurrentPhaseIndex(phaseIdx);
        } else {
          setCurrentPhaseIndex(BOOT_PHASES.length - 1);
        }

        if (next >= 100) {
          clearInterval(timer);
          // Play boot chime & haptic
          mobileUx.triggerHaptic('success');
          mobileUx.playTone('boot_ready');

          // Smooth fade-out before unmounting
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              onFinish();
            }, 450);
          }, 350);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onFinish]);

  const handleSkip = () => {
    mobileUx.triggerHaptic('medium');
    mobileUx.playTone('tap');
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 250);
  };

  const currentPhase = BOOT_PHASES[currentPhaseIndex] || BOOT_PHASES[0];

  return (
    <div
      style={{
        ...styles.splashOverlay,
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? 'scale(1.04)' : 'scale(1)',
        pointerEvents: isFadingOut ? 'none' : 'auto',
      }}
    >
      {/* Background Ambient Glow & Grid Accents */}
      <div style={styles.ambientGlow} />
      <div style={styles.gridOverlay} />

      <div style={styles.contentContainer}>
        {/* Top Eyebrow Tag */}
        <div style={styles.topBadge}>
          <div style={styles.topDot} className="live-pulse-blue" />
          <span style={styles.topBadgeText}>AURA MEDICAL-GRADE IOT MESH</span>
        </div>

        {/* Central Glowing Holographic Emblem */}
        <div style={styles.emblemContainer}>
          <div style={styles.radarRingOuter} />
          <div style={styles.radarRingMiddle} />
          <div style={styles.radarSweep} />

          <div style={styles.logoCard}>
            <div style={styles.logoIconInner}>
              <Zap size={38} color="#38BDF8" style={{ filter: 'drop-shadow(0 0 12px #38BDF8)' }} />
            </div>
          </div>
        </div>

        {/* App Title & Tagline */}
        <div style={styles.titleSection}>
          <h1 style={styles.appName}>AURA <span style={styles.accentText}>AIoT</span></h1>
          <p style={styles.appSubtitle}>Smart Assistive Wearables Ecosystem</p>
        </div>

        {/* Hardware Nodes Live Sync Status Indicators */}
        <div style={styles.nodePillsCluster}>
          <div style={{
            ...styles.nodePill,
            borderColor: progress >= 40 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 205, 72, 0.25)',
          }}>
            <Eye size={13} color={progress >= 40 ? '#38BDF8' : '#FFCD48'} />
            <span style={styles.nodePillLabel}>Glasses</span>
            <span style={{
              ...styles.nodePillState,
              color: progress >= 40 ? '#38BDF8' : '#FFCD48',
            }}>
              {progress >= 40 ? 'Synced' : 'Scanning'}
            </span>
          </div>

          <div style={{
            ...styles.nodePill,
            borderColor: progress >= 65 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 205, 72, 0.25)',
          }}>
            <Navigation size={13} color={progress >= 65 ? '#38BDF8' : '#FFCD48'} />
            <span style={styles.nodePillLabel}>Cane</span>
            <span style={{
              ...styles.nodePillState,
              color: progress >= 65 ? '#38BDF8' : '#FFCD48',
            }}>
              {progress >= 65 ? 'Synced' : 'Scanning'}
            </span>
          </div>

          <div style={{
            ...styles.nodePill,
            borderColor: progress >= 80 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 205, 72, 0.25)',
          }}>
            <Activity size={13} color={progress >= 80 ? '#38BDF8' : '#FFCD48'} />
            <span style={styles.nodePillLabel}>Band</span>
            <span style={{
              ...styles.nodePillState,
              color: progress >= 80 ? '#38BDF8' : '#FFCD48',
            }}>
              {progress >= 80 ? 'Synced' : 'Scanning'}
            </span>
          </div>
        </div>

        {/* Loading Progress Section */}
        <div style={styles.loaderSection}>
          <div style={styles.progressHeaderRow}>
            <span style={styles.phaseLabel}>{currentPhase.label}</span>
            <span style={styles.percentText}>{Math.round(progress)}%</span>
          </div>

          {/* Progress Bar Track */}
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressBar,
                width: `${progress}%`,
              }}
            >
              <div style={styles.progressBarGlow} />
            </div>
          </div>

          <p style={styles.phaseSub}>{currentPhase.sub}</p>
        </div>

        {/* Bottom Actions & Version Info */}
        <div style={styles.footerRow}>
          <button onClick={handleSkip} style={styles.skipBtn}>
            <span>Enter Dashboard</span>
            <ArrowRight size={13} style={{ marginLeft: 6 }} />
          </button>

          <span style={styles.versionNote}>
            Target: {serverHost}:4000 • BLE Mesh v2.4
          </span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  splashOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#070D1E',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
    transition: 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute' as const,
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '420px',
    height: '420px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(2, 132, 199, 0.05) 50%, transparent 75%)',
    pointerEvents: 'none' as const,
    filter: 'blur(30px)',
  },
  gridOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '32px 32px',
    pointerEvents: 'none' as const,
  },
  contentContainer: {
    position: 'relative' as const,
    zIndex: 2,
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '24px',
  },
  topBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(15, 29, 56, 0.85)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '56px',
    padding: '6px 14px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
  },
  topDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#38BDF8',
  },
  topBadgeText: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#38BDF8',
    letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
  },
  emblemContainer: {
    position: 'relative' as const,
    width: '130px',
    height: '130px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '6px',
  },
  radarRingOuter: {
    position: 'absolute' as const,
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    border: '1px dashed rgba(56, 189, 248, 0.3)',
    animation: 'spin-radar 14s linear infinite',
  },
  radarRingMiddle: {
    position: 'absolute' as const,
    width: '106px',
    height: '106px',
    borderRadius: '50%',
    border: '1px solid rgba(56, 189, 248, 0.2)',
  },
  radarSweep: {
    position: 'absolute' as const,
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    background: 'conic-gradient(from 0deg, rgba(56, 189, 248, 0.15) 0deg, transparent 60deg, transparent 360deg)',
    animation: 'spin-radar 3.5s linear infinite',
  },
  logoCard: {
    width: '74px',
    height: '74px',
    borderRadius: '24px',
    backgroundColor: '#0F1D38',
    border: '1.5px solid rgba(56, 189, 248, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 8px 30px rgba(2, 132, 199, 0.35), inset 0 0 20px rgba(56, 189, 248, 0.2)',
    position: 'relative' as const,
    zIndex: 3,
  },
  logoIconInner: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    textAlign: 'center' as const,
  },
  appName: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: '-0.5px',
    margin: 0,
    lineHeight: '1.1',
  },
  accentText: {
    color: '#38BDF8',
    textShadow: '0 0 16px rgba(56, 189, 248, 0.6)',
  },
  appSubtitle: {
    fontSize: '13px',
    color: '#8CA2C2',
    marginTop: '6px',
    letterSpacing: '-0.08px',
  },
  nodePillsCluster: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '8px',
    width: '100%',
    justifyContent: 'center',
  },
  nodePill: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(15, 29, 56, 0.7)',
    border: '1px solid',
    borderRadius: '16px',
    padding: '8px 4px',
    transition: 'all 0.3s ease',
  },
  nodePillLabel: {
    fontSize: '10px',
    color: '#FFFFFF',
    fontWeight: '500',
  },
  nodePillState: {
    fontSize: '9px',
    fontWeight: '600',
    letterSpacing: '0.3px',
    textTransform: 'uppercase' as const,
  },
  loaderSection: {
    width: '100%',
    backgroundColor: '#0F1D38',
    border: '1px solid rgba(56, 189, 248, 0.18)',
    borderRadius: '20px',
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  },
  progressHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseLabel: {
    fontSize: '9px',
    fontWeight: '600',
    color: '#38BDF8',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
  percentText: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'JetBrains Mono, monospace',
  },
  progressTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: '#070D1E',
    borderRadius: '6px',
    overflow: 'hidden',
    position: 'relative' as const,
    border: '1px solid rgba(56, 189, 248, 0.15)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: '6px',
    position: 'relative' as const,
    transition: 'width 0.1s linear',
  },
  progressBarGlow: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    width: '20px',
    background: 'linear-gradient(90deg, transparent, #FFFFFF)',
    filter: 'blur(2px)',
  },
  phaseSub: {
    fontSize: '11px',
    color: '#8CA2C2',
    lineHeight: '1.4',
    margin: 0,
    minHeight: '30px',
  },
  footerRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  skipBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    color: '#38BDF8',
    padding: '8px 20px',
    borderRadius: '56px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    touchAction: 'manipulation' as const,
    transition: 'all 0.15s ease',
  },
  versionNote: {
    fontSize: '10px',
    color: '#556987',
    fontFamily: 'JetBrains Mono, monospace',
  },
};
