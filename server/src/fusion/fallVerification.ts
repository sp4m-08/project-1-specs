/**
 * Cross-Device Fall Verification Engine (Algorithm 2 from Paper)
 * Fuses independent candidate fall flags from Smart Cane (F_cane) and Smart Band (F_band)
 */

export interface FallCandidateEvent {
  sourceDevice: 'cane' | 'band';
  timestamp: number;
  accelMag: number;
}

export interface FallAlertState {
  id: string;
  status: 'IDLE' | 'HIGH_CONFIDENCE_ALERT' | 'LOW_CONFIDENCE_WARNING' | 'CANCELLED_BY_USER' | 'ESCALATED_TO_CAREGIVER';
  confidence: 'HIGH' | 'LOW' | 'NONE';
  caneEvent?: FallCandidateEvent;
  bandEvent?: FallCandidateEvent;
  timeDiffMs?: number;
  sosWindowRemainingSec?: number;
  message: string;
  timestamp: number;
}

export type FallAlertCallback = (alertState: FallAlertState) => void;

export class CrossDeviceFallVerifier {
  private lastCaneEvent: FallCandidateEvent | null = null;
  private lastBandEvent: FallCandidateEvent | null = null;
  private activeAlert: FallAlertState | null = null;
  private sosCountdownTimer: NodeJS.Timeout | null = null;
  private sosIntervalTimer: NodeJS.Timeout | null = null;
  private alertListeners: FallAlertCallback[] = [];

  private readonly FUSION_WINDOW_MS = 3000; // Delta t = 3 s
  private readonly SOS_RESPONSE_SEC = 30;   // T_resp = 30 s

  public onAlert(callback: FallAlertCallback) {
    this.alertListeners.push(callback);
  }

  private notifyListeners(alertState: FallAlertState) {
    this.activeAlert = alertState;
    for (const listener of this.alertListeners) {
      listener(alertState);
    }
  }

  /**
   * Evaluates candidate fall events from Cane or Band according to Algorithm 2
   */
  public registerCandidateFall(event: FallCandidateEvent): FallAlertState {
    if (event.sourceDevice === 'cane') {
      this.lastCaneEvent = event;
    } else {
      this.lastBandEvent = event;
    }

    const tc = this.lastCaneEvent ? this.lastCaneEvent.timestamp : 0;
    const tb = this.lastBandEvent ? this.lastBandEvent.timestamp : 0;

    const hasCane = !!this.lastCaneEvent && (Date.now() - tc <= this.FUSION_WINDOW_MS);
    const hasBand = !!this.lastBandEvent && (Date.now() - tb <= this.FUSION_WINDOW_MS);

    // Rule 1: High-Confidence Fall (Both devices assert fall within 3 seconds)
    if (hasCane && hasBand) {
      const timeDiffMs = Math.abs(tc - tb);
      if (timeDiffMs <= this.FUSION_WINDOW_MS) {
        this.clearSosTimers();
        const highConfidenceAlert: FallAlertState = {
          id: `fall_high_${Date.now()}`,
          status: 'HIGH_CONFIDENCE_ALERT',
          confidence: 'HIGH',
          caneEvent: this.lastCaneEvent!,
          bandEvent: this.lastBandEvent!,
          timeDiffMs,
          message: `CRITICAL: High-Confidence Fall Verified! Concurrent impact detected on Cane & Band (dt = ${timeDiffMs}ms). Emergency response dispatched!`,
          timestamp: Date.now(),
        };
        this.notifyListeners(highConfidenceAlert);
        return highConfidenceAlert;
      }
    }

    // Rule 2: Single-Device Candidate Fall -> Issue Low-Confidence Warning & Start 30s SOS Window
    this.clearSosTimers();
    let remainingSec = this.SOS_RESPONSE_SEC;
    const alertId = `fall_low_${Date.now()}`;

    const initialWarning: FallAlertState = {
      id: alertId,
      status: 'LOW_CONFIDENCE_WARNING',
      confidence: 'LOW',
      caneEvent: event.sourceDevice === 'cane' ? event : undefined,
      bandEvent: event.sourceDevice === 'band' ? event : undefined,
      sosWindowRemainingSec: remainingSec,
      message: `WARNING: Single-device fall detected by ${event.sourceDevice.toUpperCase()}. Press SOS button on band within 30s to cancel.`,
      timestamp: Date.now(),
    };

    this.notifyListeners(initialWarning);

    // Start 30s countdown ticks
    this.sosIntervalTimer = setInterval(() => {
      remainingSec -= 1;
      if (remainingSec > 0 && this.activeAlert?.id === alertId && this.activeAlert.status === 'LOW_CONFIDENCE_WARNING') {
        this.notifyListeners({
          ...initialWarning,
          sosWindowRemainingSec: remainingSec,
        });
      }
    }, 1000);

    // Countdown expiration -> Escalate to Caregiver
    this.sosCountdownTimer = setTimeout(() => {
      if (this.activeAlert?.id === alertId && this.activeAlert.status === 'LOW_CONFIDENCE_WARNING') {
        this.clearSosTimers();
        const escalatedAlert: FallAlertState = {
          ...initialWarning,
          status: 'ESCALATED_TO_CAREGIVER',
          sosWindowRemainingSec: 0,
          message: `ESCALATED: Single-device fall warning unconfirmed after 30s. Escalating alert to Caregiver & Emergency Contacts!`,
        };
        this.notifyListeners(escalatedAlert);
      }
    }, this.SOS_RESPONSE_SEC * 1000);

    return initialWarning;
  }

  /**
   * User cancels false-alarm via SOS button press
   */
  public cancelFallWarning(source: string = 'SOS_BUTTON'): FallAlertState | null {
    if (this.activeAlert && this.activeAlert.status === 'LOW_CONFIDENCE_WARNING') {
      this.clearSosTimers();
      const cancelledState: FallAlertState = {
        ...this.activeAlert,
        status: 'CANCELLED_BY_USER',
        sosWindowRemainingSec: 0,
        message: `SUPPRESSED: Fall alert cancelled by user via ${source}. Alarm standing down.`,
      };
      this.notifyListeners(cancelledState);
      return cancelledState;
    }
    return null;
  }

  private clearSosTimers() {
    if (this.sosCountdownTimer) clearTimeout(this.sosCountdownTimer);
    if (this.sosIntervalTimer) clearInterval(this.sosIntervalTimer);
    this.sosCountdownTimer = null;
    this.sosIntervalTimer = null;
  }

  public getActiveAlert(): FallAlertState | null {
    return this.activeAlert;
  }
}
