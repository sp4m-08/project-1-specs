import React, { useState } from 'react';
import { Bot, Mic, Send, X, Heart, ShieldCheck, Eye, Sparkles, Link2 } from 'lucide-react';
import { ChatMessage, UserRole } from '../types/telemetry';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => void;
  role: UserRole;
  wearerName?: string;
}

/**
 * AIChatDrawer — Voice-Enabled AI Chatbot & Sensor Fusion Drawer
 * Natural-language conversational interface answering assistive safety questions:
 * - "How was the wearer's heart rate over the last hour?"
 * - "Any safety alerts or falls detected?"
 * - "Summarize current obstacle detections from Smart Glasses"
 * Renders multi-modal response cards with 1h HR trends and cross-device event correlations.
 */
export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  role,
  wearerName = 'the wearer',
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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);

        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          setIsListening(false);
          if (transcript && transcript.trim()) {
            setInputText(transcript);
            onSendMessage(transcript.trim());
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('[SpeechRecognition Error]:', event.error);
          setIsListening(false);
           addToast('Voice input unavailable', 'You can type your question instead.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn('[SpeechRecognition init error]:', err);
      }
    }

    addToast('Voice input unavailable', 'You can type your question instead.');
  };

  const addToast = (title: string, message: string) => {
    // The drawer does not own the global toast queue; keep this visible in the field
    // and avoid silently submitting a random prompt when microphone input is unavailable.
    setInputText(`${title}: ${message}`);
  };

  return (
    <div style={styles.overlay} className="dadaist-chat-overlay" role="dialog" aria-modal="true" aria-labelledby="aura-guide-title">
      <div style={styles.drawerCard} className="dadaist-chat-drawer">
        {/* Top Header */}
        <div style={styles.drawerHeader} className="dadaist-chat-header">
          <div style={styles.headerTitleGroup}>
            <div style={styles.botIconCircle} className="dadaist-chat-bot-icon">
              <Bot size={20} color="#38BDF8" />
            </div>
            <div>
              <span className="eyebrow-label">AURA GUIDE • VOICE ASSISTANCE</span>
              <h3 id="aura-guide-title" style={styles.drawerTitle}>{role === 'caregiver' ? `Ask about ${wearerName}` : 'Ask AURA Guide'}</h3>
            </div>
          </div>

          <button onClick={onClose} style={styles.closeBtn} className="dadaist-chat-close" title="Close AURA Guide" aria-label="Close AURA Guide" type="button">
            <X size={20} color="#8CA2C2" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div style={styles.pillsRow} className="dadaist-chat-suggestions">
          <button
            onClick={() => onSendMessage(role === 'caregiver' ? `How was ${wearerName}'s heart rate over the last hour?` : 'How is my health right now?')}
            type="button"
            style={styles.suggestionPill}
          >
            <Heart size={12} color="#38BDF8" style={{ marginRight: 6 }} />
            <span>{role === 'caregiver' ? `${wearerName}'s health trend` : 'My health status'}</span>
          </button>

          <button
            onClick={() => onSendMessage('Any safety alerts I should know about?')}
            type="button"
            style={styles.suggestionPill}
          >
            <ShieldCheck size={12} color="#38BDF8" style={{ marginRight: 6 }} />
            <span>Safety alerts check</span>
          </button>

          <button
            onClick={() => onSendMessage('What is ahead of me right now?')}
            type="button"
            style={styles.suggestionPill}
          >
            <Eye size={12} color="#38BDF8" style={{ marginRight: 6 }} />
            <span>Path awareness summary</span>
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div style={styles.messageList} className="dadaist-chat-messages">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className="dadaist-chat-bubble"
                data-sender={isUser ? 'user' : 'guide'}
                style={{
                  ...styles.bubbleContainer,
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  backgroundColor: isUser ? '#0B132B' : '#070D1E',
                  borderColor: isUser ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.35)',
                }}
              >
                <div style={styles.bubbleHeader}>
                   <span className="sender-tag" style={{
                    ...styles.senderTag,
                    color: isUser ? '#8CA2C2' : '#38BDF8',
                  }}>
                    {isUser
                      ? 'USER VOICE/TEXT PROMPT'
                       : (msg.modelUsed ? `AURA GUIDE • ${msg.modelUsed.toUpperCase()}` : 'AURA GUIDE')}
                  </span>
                  <span style={styles.timestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p style={styles.messageText} className="message-text">{msg.text}</p>

                {/* Multi-Modal Telemetry Data Card (Figure 13 in Paper) */}
                {msg.dataCard && (
                  <div style={styles.dataCardContainer} className="dadaist-chat-data-card">
                    <div style={styles.dataCardTitleRow}>
                      <Sparkles size={14} color="#38BDF8" style={{ marginRight: 6 }} />
                      <span style={styles.dataCardTitle}>{msg.dataCard.title}</span>
                    </div>

                    {msg.dataCard.hrTrend1h && (
                      <div style={styles.trendBlock}>
                        <span style={styles.trendCaption}>
                          1-HOUR HR TREND (AVG: {msg.dataCard.averageHr} BPM)
                        </span>
                        <div style={styles.barTrace}>
                          {msg.dataCard.hrTrend1h.map((point, idx) => (
                            <div key={idx} style={styles.barUnit}>
                              <div
                                style={{
                                  ...styles.barFill,
                                  height: `${Math.min(point.value * 0.45, 45)}px`,
                                  backgroundColor: point.value > 85 ? '#FFCD48' : '#38BDF8',
                                }}
                              />
                              <span style={styles.barLabel}>{point.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.dataCard.correlatedEvent && (
                      <div style={styles.eventCorrelationBox} className="dadaist-chat-event">
                        <Link2 size={12} color="#38BDF8" style={{ marginRight: 6, flexShrink: 0 }} />
                        <span style={styles.eventCorrelationText}>
                          {msg.dataCard.correlatedEvent}
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
        <div style={styles.inputArea} className="dadaist-chat-input-area">
          <button
            onClick={handleVoiceTrigger}
             className={`dadaist-chat-mic ${isListening ? 'live-pulse-blue' : ''}`}
             style={{
              ...styles.micCircleBtn,
              backgroundColor: isListening ? '#38BDF8' : '#0B132B',
              borderColor: '#38BDF8',
            }}
             title="Ask AURA Guide by voice"
             aria-label={isListening ? 'Listening for your question' : 'Ask AURA Guide by voice'}
             type="button"
          >
            <Mic size={18} color={isListening ? '#070D1E' : '#38BDF8'} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             placeholder={isListening ? 'Listening…' : 'Ask about safety, health, or the path ahead…'}
             style={styles.chatInputField}
             className="dadaist-chat-input"
          />

          <button
            onClick={handleSend}
             className="pill-btn-primary dadaist-chat-send"
             style={styles.sendActionBtn}
             title="Send question"
             aria-label="Send question"
             type="button"
          >
            <Send size={16} color="#070D1E" />
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
    backgroundColor: 'rgba(7, 13, 30, 0.75)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 300,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawerCard: {
    width: '100%',
    maxWidth: '480px',
    height: '100%',
    backgroundColor: '#0F1D38',
    borderLeft: '1px solid rgba(56, 189, 248, 0.2)',
    boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column' as const,
    /* SAFE AREA FIX: Clearance for notch at top and gesture navigation at bottom */
    paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 28px) + 12px)',
    paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 20px) + 12px)',
    paddingLeft: 'max(env(safe-area-inset-left, 0px), 20px)',
    paddingRight: 'max(env(safe-area-inset-right, 0px), 20px)',
  },
  drawerHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
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
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(56, 189, 248, 0.2)',
  },
  drawerTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#FFFFFF',
    margin: '2px 0 0 0',
    letterSpacing: '-0.08px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '8px',
    padding: '12px 0',
    overflowX: 'auto' as const,
    borderBottom: '1px solid rgba(56, 189, 248, 0.1)',
  },
  suggestionPill: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    borderRadius: '56px',
    padding: '6px 12px',
    fontSize: '11px',
    color: '#8CA2C2',
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  bubbleContainer: {
    maxWidth: '85%',
    padding: '14px 16px',
    borderRadius: '20px',
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  bubbleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '9px',
    letterSpacing: '0.45px',
  },
  senderTag: {
    fontWeight: '600',
    textTransform: 'uppercase' as const,
  },
  timestamp: {
    color: '#64748B',
    fontSize: '9px',
  },
  messageText: {
    fontSize: '13px',
    lineHeight: '1.45',
    color: '#FFFFFF',
    margin: 0,
  },
  dataCardContainer: {
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.2)',
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
    color: '#38BDF8',
  },
  trendBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  trendCaption: {
    fontSize: '9px',
    color: '#8CA2C2',
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
    color: '#8CA2C2',
  },
  eventCorrelationBox: {
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '10px',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
  },
  eventCorrelationText: {
    fontSize: '11px',
    color: '#EEF6FF',
    lineHeight: '1.35',
  },
  inputArea: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '10px',
    borderTop: '1px solid rgba(56, 189, 248, 0.15)',
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
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.25)',
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
