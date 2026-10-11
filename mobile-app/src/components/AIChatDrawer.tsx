import React, { useState } from 'react';
import { Bot, Mic, Send, X, Heart, ShieldCheck, Eye, Sparkles, Link2 } from 'lucide-react';
import { ChatMessage } from '../types/telemetry';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => void;
}

/**
 * AIChatDrawer — Voice-Enabled AI Chatbot & Sensor Fusion Drawer
 * Natural-language conversational interface answering clinical queries:
 * - "How was my father's heart rate over the last hour?"
 * - "Any safety alerts or falls detected?"
 * - "Summarize current obstacle detections from Smart Glasses"
 * Renders multi-modal response cards with 1h HR trends and cross-device event correlations.
 */
export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleVoiceTrigger = () => {
    setIsListening(true);
    const cannedVoiceQueries = [
      "How was my father's heart rate over the last hour?",
      "Any safety alerts or falls detected?",
      "Summarize current obstacle detections from Smart Glasses",
    ];
    const pick = cannedVoiceQueries[Math.floor(Math.random() * cannedVoiceQueries.length)];

    setTimeout(() => {
      setIsListening(false);
      onSendMessage(pick);
    }, 1200);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.drawerCard}>
        {/* Top Header */}
        <div style={styles.drawerHeader}>
          <div style={styles.headerTitleGroup}>
            <div style={styles.botIconCircle}>
              <Bot size={20} color="#3DDC91" />
            </div>
            <div>
              <span className="eyebrow-label">AURA COGNITIVE AGENT • SENSOR FUSION AI</span>
              <h3 style={styles.drawerTitle}>Patient Intelligence Assistant</h3>
            </div>
          </div>

          <button onClick={onClose} style={styles.closeBtn} title="Dismiss Drawer">
            <X size={20} color="#828786" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div style={styles.pillsRow}>
          <button
            onClick={() => onSendMessage("How was my father's heart rate over the last hour?")}
            style={styles.suggestionPill}
          >
            <Heart size={12} color="#3DDC91" style={{ marginRight: 6 }} />
            <span>Father's HR over last hour</span>
          </button>

          <button
            onClick={() => onSendMessage("Any safety alerts I should know about?")}
            style={styles.suggestionPill}
          >
            <ShieldCheck size={12} color="#3DDC91" style={{ marginRight: 6 }} />
            <span>Safety alerts check</span>
          </button>

          <button
            onClick={() => onSendMessage("Summarize current obstacle detections from Smart Glasses")}
            style={styles.suggestionPill}
          >
            <Eye size={12} color="#3DDC91" style={{ marginRight: 6 }} />
            <span>Obstacle detections summary</span>
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div style={styles.messageList}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  ...styles.bubbleContainer,
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  backgroundColor: isUser ? '#132322' : '#0E1A19',
                  borderColor: isUser ? 'rgba(255, 255, 255, 0.12)' : 'rgba(61, 220, 145, 0.25)',
                }}
              >
                <div style={styles.bubbleHeader}>
                  <span style={{
                    ...styles.senderTag,
                    color: isUser ? '#828786' : '#3DDC91',
                  }}>
                    {isUser ? 'USER VOICE/TEXT PROMPT' : 'AURA CLINICAL ENGINE'}
                  </span>
                  <span style={styles.timestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p style={styles.messageText}>{msg.text}</p>

                {/* Multi-Modal Telemetry Data Card (Figure 13 in Paper) */}
                {msg.dataCard && (
                  <div style={styles.dataCardContainer}>
                    <div style={styles.dataCardTitleRow}>
                      <Sparkles size={14} color="#3DDC91" style={{ marginRight: 6 }} />
                      <span style={styles.dataCardTitle}>{msg.dataCard.title}</span>
                    </div>

                    {msg.dataCard.hrTrend1h && (
                      <div style={styles.trendBlock}>
                        <span style={styles.trendCaption}>
                          1-HOUR HR TREND (AVG: {msg.dataCard.averageHr} BPM)
                        </span>
                        <div style={styles.barTrace}>
                          {msg.dataCard.hrTrend1h.map((pt, idx) => (
                            <div key={idx} style={styles.barUnit}>
                              <div style={{
                                ...styles.barFill,
                                height: `${(pt.value / 130) * 44}px`,
                                backgroundColor: pt.value > 85 ? '#FFCD48' : '#3DDC91',
                              }} />
                              <span style={styles.barLabel}>{pt.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.dataCard.correlatedEvent && (
                      <div style={styles.eventCorrelationBox}>
                        <Link2 size={14} color="#FFCD48" style={{ marginRight: 6, flexShrink: 0 }} />
                        <span style={styles.eventCorrelationText}>
                          <strong>Contextual Event Correlation:</strong> {msg.dataCard.correlatedEvent}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <div style={styles.inputArea}>
          <button
            onClick={handleVoiceTrigger}
            style={{
              ...styles.micCircleBtn,
              backgroundColor: isListening ? '#FFCD48' : '#132322',
              borderColor: isListening ? '#FFCD48' : 'rgba(255, 255, 255, 0.12)',
              color: isListening ? '#132322' : '#3DDC91',
            }}
            title="Voice Query Input"
          >
            <Mic size={18} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening to voice query..." : "Ask Aura AI about vitals, falls, or obstacles..."}
            style={styles.chatInputField}
          />

          <button onClick={handleSend} className="pill-btn-primary" style={styles.sendActionBtn}>
            <Send size={16} color="#132322" />
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 15, 15, 0.88)',
    backdropFilter: 'blur(12px)',
    zIndex: 350,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  drawerCard: {
    width: '100%',
    maxWidth: '580px',
    height: '660px',
    backgroundColor: '#070F0F', // Charcoal darkest surface
    borderRadius: '28px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '24px',
    gap: '16px',
    boxShadow: '0 30px 70px rgba(0, 0, 0, 0.8)',
  },
  drawerHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '14px',
  },
  headerTitleGroup: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '12px',
  },
  botIconCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    backgroundColor: '#132322',
    border: '1px solid rgba(61, 220, 145, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerTitle: {
    fontSize: '17px',
    fontWeight: '500',
    color: '#FFFFFF',
    margin: '2px 0 0 0',
    letterSpacing: '-0.08px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  pillsRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '8px',
    overflowX: 'auto' as const,
    paddingBottom: '4px',
  },
  suggestionPill: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#132322',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '56px',
    padding: '6px 14px',
    fontSize: '12px',
    color: '#FFFFFF',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    letterSpacing: '-0.08px',
  },
  messageList: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    overflowY: 'auto' as const,
    paddingRight: '6px',
  },
  bubbleContainer: {
    maxWidth: '88%',
    padding: '14px 18px',
    borderRadius: '20px',
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  bubbleHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderTag: {
    fontSize: '9px',
    fontWeight: '600',
    letterSpacing: '0.45px',
    textTransform: 'uppercase' as const,
  },
  timestamp: {
    fontSize: '10px',
    color: '#828786',
  },
  messageText: {
    fontSize: '14px',
    color: '#FFFFFF',
    lineHeight: '1.45',
    margin: 0,
  },
  dataCardContainer: {
    backgroundColor: '#070F0F',
    border: '1px solid rgba(61, 220, 145, 0.25)',
    borderRadius: '16px',
    padding: '14px',
    marginTop: '6px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  dataCardTitleRow: {
    display: 'flex',
    alignItems: 'center',
  },
  dataCardTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#3DDC91',
  },
  trendBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  trendCaption: {
    fontSize: '9px',
    color: '#828786',
    fontFamily: 'JetBrains Mono, monospace',
    letterSpacing: '0.45px',
  },
  barTrace: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'flex-end',
    gap: '10px',
    height: '52px',
    paddingTop: '6px',
  },
  barUnit: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '3px',
    flex: 1,
  },
  barFill: {
    width: '100%',
    maxWidth: '16px',
    borderRadius: '4px 4px 0 0',
  },
  barLabel: {
    fontSize: '8px',
    color: '#828786',
  },
  eventCorrelationBox: {
    backgroundColor: '#132322',
    border: '1px solid rgba(255, 205, 72, 0.3)',
    borderRadius: '10px',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
  },
  eventCorrelationText: {
    fontSize: '11px',
    color: '#EDF7F5',
    lineHeight: '1.35',
  },
  inputArea: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '14px',
  },
  micCircleBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '56px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  chatInputField: {
    flex: 1,
    backgroundColor: '#132322',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '56px',
    padding: '12px 20px',
    color: '#FFFFFF',
    fontSize: '13px',
    outline: 'none',
  },
  sendActionBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '56px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
