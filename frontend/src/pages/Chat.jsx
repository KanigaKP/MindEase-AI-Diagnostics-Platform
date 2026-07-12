import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMoodStore } from '../hooks/useMoodStore';
import { useSSEStream } from '../hooks/useSSEStream';

import { ChatBubble } from '../components/ChatBubble';
import { ThinkingOrb } from '../components/ThinkingOrb';
import { MoodSlider } from '../components/MoodSlider';
import { CrisisCard } from '../components/CrisisCard';
import { GrowthTree } from '../components/GrowthTree';
import { SoundController } from '../components/SoundController';
import { JournalMode } from '../components/JournalMode';

import { 
  Send, 
  BookOpen, 
  BarChart2, 
  LogOut, 
  Shield, 
  RotateCcw,
  Sparkles,
  Activity,
  Heart,
  Cpu
} from 'lucide-react';

export const Chat = ({ onNavigate }) => {
  const {
    history,
    localPrivacyMode,
    togglePrivacyMode,
    clearSession,
    fetchHistory,
    sessionId
  } = useMoodStore();

  const {
    isStreaming,
    streamedText,
    currentEmotion,
    crisisTriggered,
    sentimentScore,
    stressSeverity,
    traumaRisk,
    sendMessage,
    setCrisisTriggered
  } = useSSEStream();

  const [inputMsg, setInputMsg] = useState('');
  const [showMoodSlider, setShowMoodSlider] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [cursorParticles, setCursorParticles] = useState([]);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // 1. Fetch History on Mount
  useEffect(() => {
    fetchHistory();
    // Trigger mood slider at startup
    setShowMoodSlider(true);
  }, [sessionId]);

  // 2. Scroll to Bottom on message updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [history, streamedText]);

  // 3. Count User Messages for every 10 turn check-in triggers
  const prevHistoryLength = useRef(0);
  useEffect(() => {
    const userMsgs = history.filter(m => m.role === 'user').length;
    if (userMsgs > 0 && userMsgs % 10 === 0 && history.length !== prevHistoryLength.current) {
      setShowMoodSlider(true);
    }
    prevHistoryLength.current = history.length;
  }, [history]);

  // 4. Trigger safety card if severe metrics are detected in real-time
  useEffect(() => {
    if (stressSeverity === 'Severe' || traumaRisk === 'Crisis') {
      setCrisisTriggered(true);
    }
  }, [stressSeverity, traumaRisk]);

  // 5. Mouse Trail logic
  const handleMouseMove = (e) => {
    if (!chatContainerRef.current) return;
    const rect = chatContainerRef.current.getBoundingClientRect();
    
    const newDot = {
      id: Math.random() + Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    setCursorParticles(prev => [...prev.slice(-12), newDot]);
  };

  const handleSend = async (textToSend) => {
    if (!textToSend.trim() || isStreaming) return;
    await sendMessage(textToSend);
  };

  const handleJournalSubmit = async (journalPrompt) => {
    setIsJournalOpen(false);
    await handleSend(journalPrompt);
  };

  // Helper count for Growth Tree stage mapping
  const totalUserMessages = history.filter(m => m.role === 'user').length;

  return (
    <div 
      ref={chatContainerRef}
      onMouseMove={handleMouseMove}
      className="relative flex h-screen w-full bg-void text-primary bg-cosmic-grid overflow-hidden select-none"
    >
      {/* Particle Cursor Trail */}
      {cursorParticles.map((dot, idx) => (
        <div
          key={dot.id}
          className="absolute cursor-trail-dot pointer-events-none rounded-full bg-aurora/45 blur-[1px] shadow-[0_0_8px_var(--accent-aurora)]"
          style={{
            left: dot.x,
            top: dot.y,
            opacity: idx / cursorParticles.length,
            transform: `translate(-50%, -50%) scale(${idx / cursorParticles.length})`,
            transition: 'opacity 0.2s, transform 0.2s',
          }}
        />
      ))}

      {/* SIDEBAR - Sleek glass HUD */}
      <aside className="w-80 flex-shrink-0 bg-surface/35 border-r border-pulse/25 p-5 flex flex-col justify-between backdrop-blur-xl z-10">
        <div className="flex flex-col gap-6 overflow-y-auto pr-1">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-pulse/20">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pulse via-void to-aurora flex items-center justify-center border border-pulse/50 shadow-[0_0_15px_rgba(181,95,230,0.3)]">
              <Cpu className="w-5 h-5 text-aurora animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wider font-mono text-shadow-pulse bg-gradient-to-r from-primary to-pulse bg-clip-text text-transparent uppercase">MindEase</h1>
              <span className="text-[9px] text-aurora font-mono uppercase tracking-widest block -mt-0.5">Neural Diagnostics</span>
            </div>
          </div>

          {/* Telemetry Dashboard Readout */}
          <div className="p-3 bg-void/50 border border-pulse/15 rounded-2xl font-mono text-[10px] space-y-1.5 text-muted">
            <div className="flex justify-between">
              <span>SYSTEM STATE:</span>
              <span className="text-aurora">ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span>ACTIVE SESSION:</span>
              <span className="text-primary">{sessionId ? `${sessionId.slice(0, 10)}...` : 'OFFLINE'}</span>
            </div>
            <div className="flex justify-between">
              <span>DIAGNOSTIC ENVELOPE:</span>
              <span className="text-pulse font-bold">MOCK_MODE_HEURISTICS</span>
            </div>
          </div>

          {/* Growth SVG Tree Widget */}
          <GrowthTree messageCount={totalUserMessages} />

          {/* Audio Web Synth Soundscape */}
          <SoundController />

          {/* Privacy Toggle Widget */}
          <div className="flex items-center justify-between p-3 bg-surface/40 border border-pulse/15 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${localPrivacyMode ? 'text-aurora' : 'text-muted'}`} />
              <div className="flex flex-col font-mono">
                <span className="text-xs font-semibold">Privacy Core</span>
                <span className="text-[8px] text-muted">{localPrivacyMode ? 'Local Cache only' : 'Cloud Synchronized'}</span>
              </div>
            </div>
            
            <button
              onClick={togglePrivacyMode}
              className={`w-9 h-5 rounded-full relative transition-colors border border-pulse/20 ${
                localPrivacyMode ? 'bg-aurora' : 'bg-void'
              }`}
            >
              <motion.div
                layout
                className="w-4 h-4 rounded-full bg-[#100622] absolute top-[1px]"
                animate={{ left: localPrivacyMode ? '18px' : '2px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>

        {/* Sidebar Footer Buttons */}
        <div className="flex flex-col gap-2 pt-4 border-t border-pulse/20 font-mono">
          <button
            onClick={() => onNavigate('insights')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-surface border border-pulse/30 hover:border-aurora/40 text-primary hover:text-aurora transition-all flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(181,95,230,0.1)]"
          >
            <BarChart2 className="w-4 h-4 text-pulse" /> Diagnostics Hub
          </button>
          
          <button
            onClick={() => {
              if (window.confirm("Do you want to reset your secure workspace? This clears all local caches.")) {
                clearSession();
                onNavigate('landing');
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-void hover:bg-warm/10 border border-pulse/10 hover:border-warm/30 text-muted hover:text-warm transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Wipe Workspace
          </button>
        </div>
      </aside>

      {/* MAIN CONSOLE AREA */}
      <main className="flex-1 flex flex-col justify-between relative z-10 overflow-hidden">
        {/* Main App Bar Header */}
        <header className="h-16 border-b border-pulse/20 px-6 flex items-center justify-between bg-[#0b0416]/55 backdrop-blur-md">
          <div className="flex items-center gap-2 font-mono">
            <div className="w-2.5 h-2.5 rounded-full bg-aurora animate-pulse shadow-[0_0_8px_var(--accent-aurora)]" />
            <span className="text-[10px] uppercase tracking-wider text-aurora font-semibold">Diagnostic Terminal Connected</span>
          </div>

          <div className="flex items-center gap-4 font-mono">
            {localPrivacyMode && (
              <div className="flex items-center gap-1.5 text-[9px] text-aurora bg-aurora/10 border border-aurora/35 py-1 px-3 rounded-full font-mono shadow-[0_0_8px_rgba(0,229,255,0.15)]">
                <Shield className="w-3 h-3" /> SECURE BASE ACTIVE
              </div>
            )}
            <button
              onClick={() => onNavigate('landing')}
              className="text-xs font-semibold text-muted hover:text-warm transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Disconnect
            </button>
          </div>
        </header>

        {/* Dynamic Journaling Notebook View Overlay */}
        <AnimatePresence mode="wait">
          {isJournalOpen ? (
            <div className="flex-1 p-6">
              <JournalMode 
                onSubmit={handleJournalSubmit} 
                onCancel={() => setIsJournalOpen(false)} 
              />
            </div>
          ) : (
            <>
              {/* Message Transcript Stream */}
              <div className="flex-1 overflow-y-auto p-6 scroll-smooth select-text">
                <div className="max-w-3xl mx-auto">
                  {/* Empty welcome placeholder */}
                  {history.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <ThinkingOrb isThinking={isStreaming} />
                      <h2 className="text-2xl font-light text-primary mt-6 mb-2">Workspace Calibrated</h2>
                      <p className="text-muted text-sm max-w-sm leading-relaxed">
                        Diagnostics baselines loaded. Describe your current cognitive state, or click the Journal log icon below to write down your thoughts.
                      </p>
                    </motion.div>
                  )}

                  {/* Message Blocks */}
                  {history.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                  ))}

                  {/* SSE Typing Stream Block */}
                  {isStreaming && streamedText && (
                    <ChatBubble 
                      message={{
                        id: 'streaming-assistant',
                        role: 'assistant',
                        content: streamedText,
                        emotion_tag: currentEmotion,
                        sentiment_score: sentimentScore,
                        stress_severity: stressSeverity,
                        trauma_risk: traumaRisk,
                        timestamp: new Date().toISOString()
                      }}
                      isStreaming={true}
                    />
                  )}
                  
                  {/* Quick Spacer */}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Console Input Bar */}
              <footer className="p-6 border-t border-pulse/20 bg-[#0b0416]/55 backdrop-blur-md">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                  {/* Journal open button */}
                  <button
                    onClick={() => setIsJournalOpen(true)}
                    className="p-3.5 bg-surface hover:bg-void border border-pulse/25 hover:border-aurora/45 text-pulse hover:text-aurora rounded-2xl transition-all shadow-[0_0_10px_rgba(181,95,230,0.15)] flex-shrink-0"
                    title="Toggle Diary Journal"
                  >
                    <BookOpen className="w-5 h-5" />
                  </button>

                  {/* Input container */}
                  <div className="flex-1 bg-[#05010d]/80 border border-pulse/25 focus-within:border-aurora/45 flex items-center gap-3 px-4 py-2 rounded-2xl transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
                    <input
                      type="text"
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSend(inputMsg);
                          setInputMsg('');
                        }
                      }}
                      placeholder="Input mental health queries or venting notes... (e.g. 'Feeling highly anxious and burnt out')"
                      className="flex-1 bg-transparent border-none outline-none text-sm py-1.5 text-primary placeholder-muted/60"
                      disabled={isStreaming}
                    />

                    {/* Floating Orb reflecting AI thought patterns */}
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 flex items-center justify-center">
                        <div className={`w-3.5 h-3.5 rounded-full blur-[2px] transition-all duration-500 ${
                          isStreaming 
                            ? 'bg-gradient-to-tr from-aurora to-pulse scale-125 animate-pulse shadow-[0_0_8px_var(--accent-aurora)]' 
                            : 'bg-pulse/35 scale-100'
                        }`} />
                      </div>
                    </div>
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={() => {
                      handleSend(inputMsg);
                      setInputMsg('');
                    }}
                    disabled={!inputMsg.trim() || isStreaming}
                    className="p-3.5 bg-gradient-to-r from-pulse via-surface to-aurora hover:from-[#c275f0] hover:to-[#5cffea] text-primary hover:text-void border border-pulse/35 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-all shadow-[0_0_15px_rgba(181,95,230,0.25)] flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </footer>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* POPUP OVERLAYS */}

      {/* Mood check-in widget */}
      {showMoodSlider && (
        <MoodSlider onClose={() => setShowMoodSlider(false)} />
      )}

      {/* Emergency Crisis Override Overlay */}
      {crisisTriggered && (
        <CrisisCard onClose={() => setCrisisTriggered(false)} />
      )}
    </div>
  );
};
export default Chat;
