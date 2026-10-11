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
              <Bot size={18} color="#3DDC91" />
            </div>
            <div>
              <span className="eyebrow-label">INTELLIGENCE CONSOLE</span>
              <h3 style={styles.modalTitle}>Aura Health AI Assistant</h3>
            </div>
          </div>

          <button onClick={onClose} style={styles.closeBtn} title="Close Assistant">
            <X size={18} color="#828786" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div style={styles.quickPillRow}>
          <button
            onClick={() => onSendMessage("How was my father's heart rate over the last hour?")}
            style={styles.suggestionPill}
          >
            <Heart size={12} color="#3DDC91" style={{ marginRight: 6 }} />
            <span>Father's HR history</span>
          </button>

          <button
            onClick={() => onSendMessage("Any safety alerts I should know about?")}
            style={styles.suggestionPill}
          >
            <ShieldCheck size={12} color="#3DDC91" style={{ marginRight: 6 }} />
            <span>Safety alerts summary</span>
          </button>

          <button
            onClick={() => onSendMessage("Show obstacle map summary")}
            style={styles.suggestionPill}
          >
            <Eye size={12} color="#3DDC91" style={{ marginRight: 6 }} />
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
                  backgroundColor: isUser ? '#132322' : '#0E1A19',
                  borderColor: isUser ? 'rgba(255, 255, 255, 0.12)' : 'rgba(61, 220, 145, 0.25)',
                }}
              >
                <div style={styles.bubbleHeader}>
                  <span style={{
                    ...styles.senderLabel,
                    color: isUser ? '#828786' : '#3DDC91',
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
                      <Sparkles size={14} color="#3DDC91" style={{ marginRight: 6 }} />
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
                                backgroundColor: pt.value > 85 ? '#FFCD48' : '#3DDC91',
                              }} />
                              <span style={styles.barTime}>{pt.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.dataCard.correlatedEvent && (
                      <div style={styles.correlationRow}>
                        <span style={styles.correlationText}>
                          <strong>Correlation:</strong> {msg.dataCard.correlatedEvent}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Input Area */}
        <div style={styles.inputArea}>
          <button
            onClick={handleVoiceTrigger}
            style={{
              ...styles.voiceBtn,
              backgroundColor: isRecording ? '#FFCD48' : '#132322',
              color: isRecording ? '#132322' : '#3DDC91',
            }}
            title="Voice Query"
          >
            <Mic size={16} />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isRecording ? "Listening to voice input..." : "Ask Aura AI about vitals, falls, or obstacles..."}
            style={styles.textInput}
          />

          <button onClick={handleSend} className="pill-btn-primary" style={styles.sendPill}>
            <Send size={15} color="#132322" />
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
    backgroundColor: 'rgba(7, 15, 15, 0.85)',
    backdropFilter: 'blur(10px)',
    zIndex: 300,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
  },
  modalCard: {
    width: '100%',
    maxWidth: '560px',
    height: '640px',
    backgroundColor: '#070F0F',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '24px',
    gap: '16px',
    boxShadow: 'rgba(0, 0, 0, 0.5) 0 20px 50px',
  },
  modalHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '14px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  botIconBadge: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    backgroundColor: '#132322',
    border: '1px solid rgba(61, 220, 145, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: '17px',
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: '-0.08px',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  quickPillRow: {
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
    transition: 'border-color 0.15s ease',
  },
  chatStream: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    overflowY: 'auto' as const,
    paddingRight: '4px',
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
    flexDirection: 'row' as const,
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
    fontSize: '10px',
    color: '#828786',
  },
  bubbleText: {
    fontSize: '14px',
    color: '#FFFFFF',
    lineHeight: '1.45',
    margin: 0,
  },
  dataCard: {
    backgroundColor: '#070F0F',
    border: '1px solid rgba(61, 220, 145, 0.2)',
    borderRadius: '14px',
    padding: '12px',
    marginTop: '6px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  cardHeaderRow: {
    display: 'flex',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#3DDC91',
  },
  trendCluster: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  trendLabel: {
    fontSize: '10px',
    color: '#828786',
    fontFamily: 'JetBrains Mono, monospace',
  },
  barTrace: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'flex-end',
    gap: '10px',
    height: '50px',
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
  barTime: {
    fontSize: '8px',
    color: '#828786',
  },
  correlationRow: {
    backgroundColor: '#132322',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  correlationText: {
    fontSize: '11px',
    color: '#D0D3D3',
  },
  inputArea: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '14px',
  },
  voiceBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '56px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#132322',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '56px',
    padding: '10px 18px',
    color: '#FFFFFF',
    fontSize: '13px',
    outline: 'none',
  },
  sendPill: {
    width: '40px',
    height: '40px',
    borderRadius: '56px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
