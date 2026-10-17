/**
 * Cross-device fall verification engine.
 * Fuses independent candidate fall signals from Smart Cane and Smart Band.
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
  private lastCancelledTimestamp = 0;

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
           message: `CRITICAL: High-confidence fall signal confirmed. Concurrent impact detected on Smart Cane and Smart Band (within ${timeDiffMs}ms). Review the alert and follow the configured care plan.`,
          timestamp: Date.now(),
        };
        this.notifyListeners(highConfidenceAlert);
        return highConfidenceAlert;
      }
    }

    // If user recently cancelled/dismissed a fall warning, suppress new single-device triggers for 15s cooldown
    if (Date.now() - this.lastCancelledTimestamp < 15000 && !(hasCane && hasBand)) {
      return this.activeAlert || {
        id: `idle_${Date.now()}`,
        status: 'IDLE',
        confidence: 'NONE',
        message: 'System Armed. Fall alert standing down.',
        timestamp: Date.now(),
      };
    }

    // If already in HIGH_CONFIDENCE_ALERT, do not demote to single-device warning
    if (this.activeAlert?.status === 'HIGH_CONFIDENCE_ALERT') {
      return this.activeAlert;
    }

    // If already in LOW_CONFIDENCE_WARNING countdown, do not reset the 30s timer
    if (this.activeAlert?.status === 'LOW_CONFIDENCE_WARNING' && this.sosCountdownTimer) {
      return this.activeAlert;
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
      message: `WARNING: A possible fall was detected by the Smart ${event.sourceDevice === 'cane' ? 'Cane' : 'Band'}. Use the cancel action if this is a false alarm within 30 seconds.`,
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
            message: `ESCALATED: The possible fall was not silenced within 30 seconds. The Android client will attempt the configured native emergency SMS and phone call.`,
        };
        this.notifyListeners(escalatedAlert);
      }
    }, this.SOS_RESPONSE_SEC * 1000);

    return initialWarning;
  }

  /**
   * User cancels false-alarm via SOS button press or UI dismiss
   */
  public cancelFallWarning(source: string = 'SOS_BUTTON'): FallAlertState {
    this.clearSosTimers();
    this.lastCancelledTimestamp = Date.now();
    this.lastCaneEvent = null;
    this.lastBandEvent = null;
    const cancelledState: FallAlertState = {
      id: `cancel_${Date.now()}`,
      status: 'IDLE',
      confidence: 'NONE',
      message: `SUPPRESSED: Fall alert cancelled by user via ${source}. Alarm standing down.`,
      timestamp: Date.now(),
    };
    this.notifyListeners(cancelledState);
    return cancelledState;
  }

  /**
   * Resets active fall state to IDLE and arms system
   */
  public resetAlertToIdle(): FallAlertState {
    this.clearSosTimers();
    this.lastCancelledTimestamp = Date.now();
    this.lastCaneEvent = null;
    this.lastBandEvent = null;
    const idleState: FallAlertState = {
      id: `idle_${Date.now()}`,
      status: 'IDLE',
      confidence: 'NONE',
      message: 'System Armed. No active fall alerts.',
      timestamp: Date.now(),
    };
    this.notifyListeners(idleState);
    return idleState;
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
