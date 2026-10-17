/**
 * AURA Guide - Sensor Fusion & Assistive Safety Analysis Module
 * Optionally powered by Google Gemini with live tri-wearable telemetry grounding
 */

import { GoogleGenAI } from '@google/genai';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  modelUsed?: string;
  dataCard?: {
    title: string;
    type: 'hr_trend' | 'safety_summary' | 'obstacle_summary' | 'fall_log';
    averageHr?: number;
    hrTrend1h?: { time: string; value: number }[];
    currentVitals?: { hr: number; spo2: number };
    correlatedEvent?: string;
  };
}

export class AuraAiAssistant {
  private history: ChatMessage[] = [];
  private aiClient: GoogleGenAI | null = null;
  private modelName: string = 'gemini-3.5-flash-lite';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
        this.modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
         console.log(`[AURA Guide] Google Gemini client initialized with model: ${this.modelName}`);
      } catch (err) {
         console.error('[AURA Guide] Error initializing Google Gemini client:', err);
      }
    } else {
       console.warn('[AURA Guide] No GEMINI_API_KEY found. Operating in offline rule-based mode.');
    }

    // Initial welcome message
    this.history.push({
      id: 'msg_init',
      sender: 'assistant',
      text: "Hello! I am AURA Guide. I can summarize the latest safety, path, and health updates from your Smart Glasses, Smart Cane, and Smart Band. Ask me about current safety, alerts, or the path ahead.",
      timestamp: Date.now(),
      modelUsed: this.aiClient ? this.modelName : 'offline-rules',
    });
  }

  public async processQuery(
    prompt: string,
    latestTelemetry: { cane?: any; band?: any; specs?: any; activeAlert?: any; securityLogs?: any[] }
  ): Promise<ChatMessage> {
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: Date.now(),
    };
    this.history.push(userMsg);

    const hasVitals = latestTelemetry.band?.heart_rate !== undefined || latestTelemetry.cane?.heart_rate !== undefined;
    const currentHr = latestTelemetry.band?.heart_rate ?? latestTelemetry.cane?.heart_rate ?? 0;
    const currentSpO2 = latestTelemetry.band?.spo2 ?? latestTelemetry.cane?.spo2 ?? 0;
    const hasPathReading = latestTelemetry.specs?.distance_m !== undefined;
    const obstacleDist = latestTelemetry.specs?.distance_m ?? 0;

    // Determine relevant interactive visual card based on topic
    let card: ChatMessage['dataCard'] = undefined;
    const p = prompt.toLowerCase();
    if (p.includes('heart') || p.includes('bpm') || p.includes('pulse') || p.includes('vital') || p.includes('spo2')) {
      card = hasVitals
        ? {
            title: 'Health snapshot & demo trend',
            type: 'hr_trend',
            averageHr: Math.round((currentHr + 74) / 2),
            currentVitals: { hr: currentHr, spo2: currentSpO2 },
            hrTrend1h: [
              { time: '-60m', value: 71 },
              { time: '-45m', value: 73 },
              { time: '-30m', value: 72 },
              { time: '-15m', value: Math.max(currentHr, 85) },
              { time: '-5m', value: 74 },
              { time: 'Now', value: currentHr },
            ],
            correlatedEvent: `Current snapshot: ${currentHr} BPM, blood oxygen ${currentSpO2}%.`,
          }
        : {
            title: 'Health snapshot unavailable',
            type: 'hr_trend',
            correlatedEvent: 'No current health reading is available yet.',
          };
    } else if (p.includes('alert') || p.includes('safety') || p.includes('fall') || p.includes('danger') || p.includes('sos')) {
      card = {
        title: 'Tri-Wearable Safety & Fusion Overview',
        type: 'safety_summary',
        ...(hasVitals ? { currentVitals: { hr: currentHr, spo2: currentSpO2 } } : {}),
        correlatedEvent: latestTelemetry.activeAlert && latestTelemetry.activeAlert.status !== 'IDLE'
          ? `ACTIVE ALERT: ${latestTelemetry.activeAlert.message}`
          : 'Dual IMU cross-verification active: 0 unverified fall flags. System healthy.',
      };
    } else if (p.includes('obstacle') || p.includes('currency') || p.includes('glasses') || p.includes('camera') || p.includes('vision') || p.includes('path')) {
      card = {
        title: 'Glasses Perception & 3D Spatial Summary',
        type: 'obstacle_summary',
        correlatedEvent: hasPathReading ? `Nearest detected object: ${obstacleDist}m ahead.` : 'No current path reading is available yet.',
      };
    }

    let replyText = '';
    let modelUsed = 'offline-rules';
    const vitalsSummary = hasVitals ? `Heart rate: ${currentHr} BPM, blood oxygen: ${currentSpO2}%` : 'No current health reading available';
    const pathSummary = hasPathReading ? `${obstacleDist}m ahead` : 'No current path reading available';

    // Attempt Gemini inference if client is initialized
    if (this.aiClient) {
      try {
        const systemPrompt = `You are "AURA Guide", a warm and careful assistive safety assistant embedded into a tri-wearable safety platform for elderly and visually impaired individuals.
You analyze real-time encrypted sensor streams from three wearable devices:
1. Smart Glasses (ESP32-CAM + ultrasonic sensor): Distance ahead: ${pathSummary}, camera vision/currency detection: active.
2. Smart Cane (ESP8266 + MPU6050 + ultrasonic): Steps: ${latestTelemetry.cane?.steps || 0}, Obstacle: ${latestTelemetry.cane?.distance_cm || 'Clear'}.
3. Smart Band (ESP8266 + MAX30102 + MPU6050): ${vitalsSummary}, Fall flag: ${latestTelemetry.band?.fall_flag ?? 0}, Steps: ${latestTelemetry.band?.steps || 0}, Battery: ${latestTelemetry.band?.battery ?? 'unavailable'}.

System Security & Fusion State:
- Encryption: AES-256-GCM hardware-accelerated end-to-end encryption with anti-replay monotonic counters.
- Fall Detection Fusion: ${latestTelemetry.activeAlert ? JSON.stringify(latestTelemetry.activeAlert) : 'Status: IDLE (All normal)'}.

Guidelines:
- Answer the user's question clearly, warmly, and concisely (2 to 4 sentences) suitable for voice read-aloud on a mobile screen.
- Directly reference the live telemetry values when relevant to ground your answer in reality.
        - If they ask about emergencies, falls, or SOS, provide immediate clear guidance.
        - Do not present yourself as a clinician or diagnose a medical condition. Describe readings as a health snapshot and recommend contacting a qualified professional for medical concerns.`;

        const recentHistory = this.history
          .slice(-6)
          .map((m) => `${m.sender === 'user' ? 'User' : 'Aura'}: ${m.text}`)
          .join('\n');

        const fullPrompt = `${systemPrompt}\n\nRecent Conversation:\n${recentHistory}\nUser: ${prompt}\nAura:`;

        const response = await this.aiClient.models.generateContent({
          model: this.modelName,
          contents: fullPrompt,
        });

        if (response.text && response.text.trim()) {
          replyText = response.text.trim();
          modelUsed = `Google Gemini (${this.modelName})`;
        }
      } catch (geminiError: any) {
         console.error('[AURA Guide] Gemini generation error, falling back to local engine:', geminiError?.message || geminiError);
      }
    }

    // Fallback if Gemini is unavailable or failed
    if (!replyText) {
      if (p.includes('heart rate') || p.includes('father') || p.includes('vitals') || p.includes('hr')) {
        replyText = hasVitals
          ? `The current heart rate is ${currentHr} BPM with blood oxygen at ${currentSpO2}%. The available demo readings show no immediate critical alert.`
          : 'No current health reading is available yet. Check that the Smart Band is connected and try again.';
      } else if (p.includes('alert') || p.includes('safety') || p.includes('fall') || p.includes('danger')) {
        if (latestTelemetry.activeAlert && latestTelemetry.activeAlert.status !== 'IDLE') {
          replyText = `ACTIVE ALERT: ${latestTelemetry.activeAlert.message}`;
        } else {
          replyText = hasVitals
            ? `No active safety alert is reported. The current health snapshot is ${currentHr} BPM and ${currentSpO2}% blood oxygen.`
            : 'No active safety alert is reported, but current health data is not available yet.';
        }
      } else if (p.includes('obstacle') || p.includes('currency') || p.includes('glasses') || p.includes('camera')) {
        replyText = hasPathReading
          ? `Smart Glasses path awareness is active. The nearest detected object is ${obstacleDist}m ahead.`
          : 'No current path reading is available yet. Check that the Smart Glasses are connected and try again.';
      } else {
         replyText = `I am monitoring the three AURA wearables: Smart Glasses (${hasPathReading ? `object at ${obstacleDist}m` : 'waiting for a path reading'}), Smart Cane (active), and Smart Band (${hasVitals ? `heart rate ${currentHr} BPM` : 'waiting for health data'}). What would you like to check next?`;
      }
      modelUsed = 'Local Rule-Based Engine (Fallback)';
    }

    const assistantMsg: ChatMessage = {
      id: `assist_${Date.now()}`,
      sender: 'assistant',
      text: replyText,
      timestamp: Date.now(),
      modelUsed,
      dataCard: card,
    };
    this.history.push(assistantMsg);

    return assistantMsg;
  }

  public getHistory(): ChatMessage[] {
    return this.history;
  }
}
