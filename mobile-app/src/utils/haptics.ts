import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// User preferences with LocalStorage persistence
class MobileUxManager {
  private soundEnabled: boolean;
  private hapticsEnabled: boolean;
  private voiceAssistEnabled: boolean;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.soundEnabled = localStorage.getItem('AURA_SOUND_ENABLED') !== 'false';
    this.hapticsEnabled = localStorage.getItem('AURA_HAPTICS_ENABLED') !== 'false';
    this.voiceAssistEnabled = localStorage.getItem('AURA_VOICE_ENABLED') !== 'false';
  }

  public getPreferences() {
    return {
      soundEnabled: this.soundEnabled,
      hapticsEnabled: this.hapticsEnabled,
      voiceAssistEnabled: this.voiceAssistEnabled,
    };
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('AURA_SOUND_ENABLED', String(enabled));
  }

  public setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
    localStorage.setItem('AURA_HAPTICS_ENABLED', String(enabled));
  }

  public setVoiceAssistEnabled(enabled: boolean) {
    this.voiceAssistEnabled = enabled;
    localStorage.setItem('AURA_VOICE_ENABLED', String(enabled));
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Native device vibration using Web Vibration API
   */
  public triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'sos' = 'light') {
    if (!this.hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;

    try {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(35);
          break;
        case 'heavy':
          navigator.vibrate(60);
          break;
        case 'success':
          navigator.vibrate([20, 50, 30]);
          break;
        case 'warning':
          navigator.vibrate([60, 40, 60]);
          break;
        case 'sos':
          navigator.vibrate([120, 60, 120, 60, 240]);
          break;
      }
    } catch {
      // Ignored if browser policy blocks
    }
  }

  /**
   * Synthetic futuristic acoustic tones for mobile touch feedback
   */
  public playTone(tone: 'tap' | 'switch' | 'boot_ready' | 'alert' | 'sos') {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (tone === 'tap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (tone === 'switch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.06);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (tone === 'boot_ready') {
        // High-tech chord (dual tone)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (tone === 'alert') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(660, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (tone === 'sos') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(739.99, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Spoken safety assistance for visually impaired users and important alerts
   * Uses native Android TextToSpeech service in APK, and Web Speech API in browser
   */
  public async speak(text: string) {
    if (!this.voiceAssistEnabled || !text) return;

    // 1. Native Android TTS (Capacitor plugin)
    if (Capacitor.isNativePlatform()) {
      try {
        await TextToSpeech.stop();
        await TextToSpeech.speak({
          text,
          lang: 'en-US',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        });
        return;
      } catch (nativeErr) {
        console.warn('[Native TextToSpeech Error, falling back to Web Speech]:', nativeErr);
      }
    }

    // 2. Browser Web Speech API fallback
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synthesis blocked
      }
    }
  }

  public async stopSpeaking() {
    if (Capacitor.isNativePlatform()) {
      try {
        await TextToSpeech.stop();
      } catch {}
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }
}

export const mobileUx = new MobileUxManager();
