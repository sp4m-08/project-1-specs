import React, { useState } from 'react';
import { Bot, Mic, Send, X, Heart, ShieldCheck, Eye, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types/telemetry';

interface AuraAiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => void;
}

export const AuraAiChatbotModal: React.FC<AuraAiChatbotModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleVoiceTrigger = () => {
    setIsRecording(true);
    const sampleVoicePrompts = [
      "How was my father's heart rate over the last hour?",
      "Any safety alerts or falls detected?",
      "Summarize current obstacle detections from Smart Glasses",
    ];
    const randomPrompt = sampleVoicePrompts[Math.floor(Math.random() * sampleVoicePrompts.length)];

    setTimeout(() => {
      setIsRecording(false);
      onSendMessage(randomPrompt);
    }, 1200);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <div style={styles.headerLeft}>
            <div style={styles.botIconBadge}>
              <Bot size={18} color="#38BDF8" />
            </div>
            <div>
              <span className="eyebrow-label">INTELLIGENCE CONSOLE</span>
              <h3 style={styles.modalTitle}>Aura Health AI Assistant</h3>
            </div>
          </div>

          <button onClick={onClose} style={styles.closeBtn} title="Close Assistant">
            <X size={18} color="#8CA2C2" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div style={styles.quickPillRow}>
          <button
            onClick={() => onSendMessage("How was my father's heart rate over the last hour?")}
            style={styles.suggestionPill}
          >
            <Heart size={12} color="#38BDF8" style={{ marginRight: 6 }} />
            <span>Father's HR history</span>
          </button>

          <button
            onClick={() => onSendMessage("Any safety alerts I should know about?")}
            style={styles.suggestionPill}
          >
            <ShieldCheck size={12} color="#38BDF8" style={{ marginRight: 6 }} />
            <span>Safety alerts summary</span>
          </button>

          <button
            onClick={() => onSendMessage("Show obstacle map summary")}
            style={styles.suggestionPill}
          >
            <Eye size={12} color="#38BDF8" style={{ marginRight: 6 }} />
            <span>Obstacle map summary</span>
          </button>
        </div>

        {/* Chat Stream Thread */}
        <div style={styles.chatStream}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  ...styles.bubble,
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  backgroundColor: isUser ? '#0B132B' : '#070D1E',
                  borderColor: isUser ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.35)',
                }}
              >
                <div style={styles.bubbleHeader}>
                  <span style={{
                    ...styles.senderLabel,
                    color: isUser ? '#8CA2C2' : '#38BDF8',
                  }}>
                    {isUser ? 'USER PROMPT' : 'AURA COGNITIVE AGENT'}
                  </span>
                  <span style={styles.bubbleTime}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p style={styles.bubbleText}>{msg.text}</p>

                {msg.dataCard && (
                  <div style={styles.dataCard}>
                    <div style={styles.cardHeaderRow}>
                      <Sparkles size={14} color="#38BDF8" style={{ marginRight: 6 }} />
                      <span style={styles.cardHeaderTitle}>{msg.dataCard.title}</span>
                    </div>

                    {msg.dataCard.hrTrend1h && (
                      <div style={styles.trendCluster}>
                        <span style={styles.trendLabel}>HR 1-HOUR WINDOW: AVG {msg.dataCard.averageHr} BPM</span>
                        <div style={styles.barTrace}>
                          {msg.dataCard.hrTrend1h.map((pt, idx) => (
                            <div key={idx} style={styles.barUnit}>
                              <div style={{
                                ...styles.barFill,
                                height: `${(pt.value / 130) * 40}px`,
                                backgroundColor: pt.value > 85 ? '#FFCD48' : '#38BDF8',
                              }} />
                              <span style={styles.barTime}>{pt.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <div style={styles.inputBar}>
          <button
            onClick={handleVoiceTrigger}
            style={{
              ...styles.micBtn,
              backgroundColor: isRecording ? '#38BDF8' : '#0B132B',
              borderColor: '#38BDF8',
              color: isRecording ? '#070D1E' : '#38BDF8',
            }}
            className={isRecording ? 'live-pulse-blue' : ''}
          >
            <Mic size={18} />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isRecording ? 'Listening...' : 'Type clinical query or prompt...'}
            style={styles.textInput}
          />

          <button onClick={handleSend} className="pill-btn-primary" style={styles.sendBtn}>
            <Send size={15} color="#070D1E" />
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
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 300,
    padding: '20px',
  },
  modalCard: {
    backgroundColor: '#0F1D38',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '560px',
    height: '620px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as const,
    border: '1px solid rgba(56, 189, 248, 0.2)',
    boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)',
    padding: '24px',
  },
  modalHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '12px',
  },
  botIconBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: '17px',
    fontWeight: '500',
    color: '#FFFFFF',
    margin: 0,
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
  quickPillRow: {
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
    padding: '6px 14px',
    fontSize: '11px',
    color: '#8CA2C2',
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer',
    letterSpacing: '-0.08px',
  },
  chatStream: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  bubble: {
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
  },
  senderLabel: {
    fontSize: '9px',
    fontWeight: '600',
    letterSpacing: '0.45px',
    textTransform: 'uppercase' as const,
  },
  bubbleTime: {
    fontSize: '9px',
    color: '#64748B',
  },
  bubbleText: {
    fontSize: '13px',
    color: '#FFFFFF',
    lineHeight: '1.45',
    margin: 0,
  },
  dataCard: {
    backgroundColor: '#0B132B',
    borderRadius: '14px',
    padding: '12px',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginTop: '4px',
  },
  cardHeaderRow: {
    display: 'flex',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#38BDF8',
  },
  trendCluster: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  trendLabel: {
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
    height: '45px',
    paddingTop: '5px',
  },
  barUnit: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '2px',
    flex: 1,
  },
  barFill: {
    width: '100%',
    maxWidth: '14px',
    borderRadius: '4px 4px 0 0',
  },
  barTime: {
    fontSize: '8px',
    color: '#8CA2C2',
  },
  inputBar: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '10px',
    borderTop: '1px solid rgba(56, 189, 248, 0.15)',
    paddingTop: '14px',
  },
  micBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '56px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0B132B',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '56px',
    padding: '10px 18px',
    color: '#FFFFFF',
    fontSize: '13px',
    outline: 'none',
  },
  sendBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '56px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
