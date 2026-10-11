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
      <div className="glass-card" style={styles.modal}>
        {/* Modal Header */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <div style={styles.botAvatar}>
              <Bot size={22} color="#00F2FE" />
            </div>
            <div>
              <span style={styles.title}>Aura Health AI Assistant</span>
              <span style={styles.subtitle}>Analyzing real-time tri-wearable sensor fusion</span>
            </div>
          </div>

          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} color="#94A3B8" />
          </button>
        </div>

        {/* Suggested Quick Prompts */}
        <div style={styles.chipScroll}>
          <button
            onClick={() => onSendMessage("How was my father's heart rate over the last hour?")}
            style={styles.chipBtn}
          >
            <Heart size={12} color="#EF4444" style={{ marginRight: 4 }} />
            Father's HR over last hour?
          </button>
          <button
            onClick={() => onSendMessage("Any safety alerts I should know about?")}
            style={styles.chipBtn}
          >
            <ShieldCheck size={12} color="#10B981" style={{ marginRight: 4 }} />
            Any safety alerts?
          </button>
          <button
            onClick={() => onSendMessage("Show obstacle map summary")}
            style={styles.chipBtn}
          >
            <Eye size={12} color="#00F2FE" style={{ marginRight: 4 }} />
            Show obstacle summary
          </button>
        </div>

        {/* Chat Thread */}
        <div style={styles.chatThread}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...styles.messageBubble,
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.sender === 'user' ? '#1E293B' : 'rgba(15, 23, 42, 0.9)',
                borderColor: msg.sender === 'user' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 242, 254, 0.3)',
              }}
            >
              <div style={styles.bubbleHeader}>
                <span style={{
                  ...styles.senderName,
                  color: msg.sender === 'user' ? '#94A3B8' : '#00F2FE'
                }}>
                  {msg.sender === 'user' ? 'You (Voice / Text)' : 'Aura AI'}
                </span>
                <span style={styles.timeText}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <span style={styles.bubbleText}>{msg.text}</span>

              {/* Render Multi-Modal Telemetry Data Card (Figure 13 in Paper) */}
              {msg.dataCard && (
                <div style={styles.dataCardContainer}>
                  <div style={styles.dataCardTitle}>
                    <Sparkles size={14} color="#00F2FE" style={{ marginRight: 4 }} />
                    <span>{msg.dataCard.title}</span>
                  </div>

                  {msg.dataCard.hrTrend1h && (
                    <div style={styles.trendRow}>
                      <span style={styles.cardSublabel}>HR TREND (1H): Avg {msg.dataCard.averageHr} BPM</span>
                      <div style={styles.barChartRow}>
                        {msg.dataCard.hrTrend1h.map((pt, idx) => (
                          <div key={idx} style={styles.barGroup}>
                            <div style={{
                              ...styles.bar,
                              height: `${(pt.value / 130) * 45}px`,
                              backgroundColor: pt.value > 85 ? '#F59E0B' : '#00F2FE'
                            }} />
                            <span style={styles.barLabel}>{pt.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.dataCard.correlatedEvent && (
                    <div style={styles.eventBox}>
                      <span style={styles.eventText}>
                        🔗 <strong>Cross-Device Correlation:</strong> {msg.dataCard.correlatedEvent}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div style={styles.inputContainer}>
          <button
            onClick={handleVoiceTrigger}
            style={{
              ...styles.micBtn,
              backgroundColor: isRecording ? '#EF4444' : 'rgba(0, 242, 254, 0.15)',
              borderColor: isRecording ? '#EF4444' : 'rgba(0, 242, 254, 0.4)'
            }}
            title="Voice query input"
          >
            <Mic size={18} color={isRecording ? '#FFFFFF' : '#00F2FE'} />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isRecording ? "Listening to voice input..." : "Type a message or ask about vitals..."}
            style={styles.textInput}
          />

          <button onClick={handleSend} style={styles.sendBtn}>
            <Send size={18} color="#FFFFFF" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
  },
  modal: {
    width: '100%',
    maxWidth: '560px',
    height: '620px',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '20px',
    gap: '12px',
  },
  header: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '12px',
  },
  titleRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '10px',
  },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(0, 242, 254, 0.3)',
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#F8FAFC',
    display: 'block',
  },
  subtitle: {
    fontSize: '11px',
    color: '#64748B',
    display: 'block',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  chipScroll: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '8px',
    overflowX: 'auto' as const,
    paddingBottom: '4px',
  },
  chipBtn: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '4px 10px',
    fontSize: '11px',
    color: '#CBD5E1',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  chatThread: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    overflowY: 'auto' as const,
    paddingRight: '4px',
  },
  messageBubble: {
    maxWidth: '88%',
    padding: '12px 14px',
    borderRadius: '14px',
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
  senderName: {
    fontSize: '11px',
    fontWeight: '700',
  },
  timeText: {
    fontSize: '10px',
    color: '#64748B',
  },
  bubbleText: {
    fontSize: '13px',
    color: '#F8FAFC',
    lineHeight: '1.4',
  },
  dataCardContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(0, 242, 254, 0.2)',
    borderRadius: '10px',
    padding: '10px',
    marginTop: '6px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  dataCardTitle: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: '700',
    color: '#00F2FE',
  },
  trendRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  cardSublabel: {
    fontSize: '10px',
    color: '#94A3B8',
    fontFamily: 'JetBrains Mono, monospace',
  },
  barChartRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'flex-end',
    gap: '12px',
    height: '55px',
    paddingTop: '6px',
  },
  barGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '2px',
    flex: 1,
  },
  bar: {
    width: '100%',
    maxWidth: '18px',
    borderRadius: '4px 4px 0 0',
  },
  barLabel: {
    fontSize: '8px',
    color: '#64748B',
  },
  eventBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '6px',
    padding: '6px 8px',
  },
  eventText: {
    fontSize: '11px',
    color: '#FEF3C7',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '8px',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    paddingTop: '12px',
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    border: '1px solid',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '20px',
    padding: '8px 16px',
    color: '#F8FAFC',
    fontSize: '13px',
    outline: 'none',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#00F2FE',
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
};
