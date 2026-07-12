import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User, Brain, AlertTriangle } from 'lucide-react';

export const ChatBubble = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';
  const tag = message.emotion_tag;
  const sentiment = message.sentiment_score;
  const stress = message.stress_severity;
  const trauma = message.trauma_risk;

  // CSS mappings for emotion tags using neon vars
  const tagStyles = {
    '🌿 Grounding': 'bg-aurora/10 text-aurora border-aurora/30 shadow-[0_0_8px_rgba(0,229,255,0.15)]',
    '💙 Empathy': 'bg-primary/10 text-primary border-primary/20',
    '🧠 CBT Tip': 'bg-pulse/10 text-pulse border-pulse/30 shadow-[0_0_8px_rgba(181,95,230,0.15)]',
    'default': 'bg-white/5 text-muted border-white/10'
  };

  const currentTagStyle = tagStyles[tag] || tagStyles['default'];

  // Stress severity color helpers
  const getStressColor = (level) => {
    if (level === 'Severe') return 'text-warm font-bold animate-pulse';
    if (level === 'High') return 'text-warm font-semibold';
    if (level === 'Moderate') return 'text-pulse';
    return 'text-aurora';
  };

  // Trauma risk color helpers
  const getTraumaColor = (risk) => {
    if (risk === 'Crisis') return 'text-warm font-bold animate-pulse';
    if (risk === 'High') return 'text-warm';
    if (risk === 'Elevated') return 'text-pulse';
    return 'text-aurora';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`flex w-full mb-6 gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-pulse via-surface to-aurora flex items-center justify-center text-primary border border-pulse/45 shadow-[0_0_10px_rgba(181,95,230,0.25)]">
          <Brain className="w-4 h-4" />
        </div>
      )}

      {/* Bubble Body */}
      <div className={`max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Emotion Tag (only for Bot messages) */}
        {!isUser && tag && (
          <span className={`text-[9px] uppercase font-mono font-semibold tracking-wider px-2.5 py-0.5 rounded-full border mb-1.5 backdrop-blur-md ${currentTagStyle}`}>
            {tag}
          </span>
        )}

        <div
          className={`px-4 py-3.5 rounded-2xl text-sm leading-relaxed glass-panel ${
            isUser
              ? 'rounded-tr-none bg-gradient-to-br from-[#1b0836] to-surface/90 border-pulse/35 text-primary shadow-[0_4px_16px_rgba(181,95,230,0.05)]'
              : 'rounded-tl-none bg-[#100622]/80 border-pulse/15 text-primary shadow-[0_4px_16px_rgba(0,0,0,0.2)]'
          }`}
        >
          <div className="whitespace-pre-wrap select-text font-sans">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-aurora animate-pulse align-middle" />
            )}
          </div>

          {/* Telemetric Diagnostics Panel inside Bubble */}
          {!isUser && sentiment !== undefined && sentiment !== null && (
            <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono mt-3 pt-2.5 border-t border-pulse/10 text-muted/80">
              <div className="flex items-center gap-1.5 bg-void/50 px-2 py-0.5 rounded-md border border-pulse/10">
                <span>SENTIMENT:</span>
                <span className={sentiment >= 0 ? "text-aurora" : "text-warm"}>
                  {sentiment > 0 ? `+${sentiment.toFixed(2)}` : sentiment.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-void/50 px-2 py-0.5 rounded-md border border-pulse/10">
                <span>STRESS:</span>
                <span className={getStressColor(stress)}>{stress}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-void/50 px-2 py-0.5 rounded-md border border-pulse/10">
                <span>TRAUMA:</span>
                <span className={getTraumaColor(trauma)}>{trauma}</span>
              </div>

              {(stress === 'Severe' || trauma === 'Crisis') && (
                <div className="flex items-center gap-1 text-warm font-bold animate-pulse ml-auto">
                  <AlertTriangle className="w-3 h-3 text-warm" /> OVERRIDE
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[9px] text-muted/60 mt-1.5 px-1 font-mono">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-void border border-pulse/30 flex items-center justify-center text-pulse shadow-[0_0_10px_rgba(181,95,230,0.15)]">
          <User className="w-4 h-4" />
        </div>
      )}
    </motion.div>
  );
};

export default ChatBubble;
