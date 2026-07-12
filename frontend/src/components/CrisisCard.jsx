import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, HeartHandshake, ShieldAlert, ArrowRight, ShieldCheck, AlertOctagon } from 'lucide-react';

export const CrisisCard = ({ onClose }) => {
  const [countdown, setCountdown] = useState(5);
  const [isLocked, setIsLocked] = useState(true);
  
  // Box breathing helper state
  const [boxStep, setBoxStep] = useState(0); // 0: Inhale, 1: Hold, 2: Exhale, 3: Hold
  const steps = [
    { text: 'Inhale...', duration: 4 },
    { text: 'Hold...', duration: 4 },
    { text: 'Exhale...', duration: 4 },
    { text: 'Hold...', duration: 4 }
  ];

  // Countdown effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsLocked(false);
    }
  }, [countdown]);

  // Box breathing cycle effect
  useEffect(() => {
    const boxTimer = setTimeout(() => {
      setBoxStep((prev) => (prev + 1) % 4);
    }, steps[boxStep].duration * 1000);
    return () => clearTimeout(boxTimer);
  }, [boxStep]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/90 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-surface border border-warm/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(255,42,133,0.15)] relative overflow-hidden my-8"
      >
        {/* Neon Glow Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-warm/5 rounded-full blur-3xl pointer-events-none" />

        {/* Warning Indicator Header */}
        <div className="flex items-center gap-3 text-warm mb-6 bg-warm/10 border border-warm/35 py-2 px-4 rounded-2xl w-fit font-mono shadow-[0_0_10px_rgba(255,42,133,0.1)]">
          <AlertOctagon className="w-5 h-5 animate-pulse text-warm" />
          <span className="text-xs uppercase font-bold tracking-widest">SYSTEM WARNING // CRITICAL COGNITIVE DISTRESS DETECTED</span>
        </div>

        <h1 className="text-3xl font-light text-primary mb-3 text-shadow-warm">You are not alone. Please check in with yourself.</h1>
        <p className="text-muted text-sm mb-8 leading-relaxed">
          My diagnostics systems have identified indicators of high distress or critical trauma risk in your messages. Your health and safety are the absolute highest priorities. Please consider utilizing the free resources below. There are real, empathetic professionals available to listen and help you through this moment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Hotline Numbers */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-warm/90 flex items-center gap-2 font-mono">
              <Phone className="w-4 h-4" /> Support Hotlines
            </h3>
            
            <div className="bg-[#05010c] border border-pulse/20 p-4 rounded-2xl space-y-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
              <div>
                <div className="text-[10px] font-mono text-muted uppercase">Tele-MANAS (Mental Health)</div>
                <div className="text-lg font-bold text-primary flex items-center gap-2 font-mono">
                  <span>14416 / 1800-891-4416</span>
                  <span className="text-[10px] font-normal text-muted">(Call - Free, 24/7)</span>
                </div>
              </div>

              <div className="border-t border-pulse/10 pt-3">
                <div className="text-[10px] font-mono text-muted uppercase">Kiran Mental Health Helpline</div>
                <div className="text-lg font-bold text-primary flex items-center gap-2 font-mono">
                  <span>1800-599-0019</span>
                  <span className="text-[10px] font-normal text-muted">(Free, 24/7 Support)</span>
                </div>
              </div>

              <div className="border-t border-pulse/10 pt-3">
                <div className="text-[10px] font-mono text-muted uppercase">National Emergency Helpline</div>
                <div className="text-lg font-bold text-primary flex items-center gap-2 font-mono">
                  <span>Call 112</span>
                  <span className="text-[10px] font-normal text-muted">(All-in-one Emergency Support)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grounding Exercise Box */}
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-aurora flex items-center gap-2 mb-3 font-mono">
              <HeartHandshake className="w-4 h-4" /> Grounding Telemetry
            </h3>
            
            <div className="flex-1 bg-[#05010c]/50 border border-pulse/15 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
              {/* Box Breathing Graphic */}
              <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                {/* Outward Ring */}
                <motion.div
                  animate={{
                    scale: boxStep === 0 ? 1.25 : boxStep === 2 ? 0.9 : 1.1,
                    borderColor: boxStep === 0 ? 'var(--accent-aurora)' : boxStep === 1 ? 'var(--accent-pulse)' : 'var(--accent-warm)',
                  }}
                  transition={{ duration: 4, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-2xl border-2 border-dashed border-pulse/30 shadow-[0_0_15px_rgba(181,95,230,0.1)]"
                />

                {/* Inner Text */}
                <div className="flex flex-col items-center justify-center">
                  <motion.span
                    key={boxStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg font-mono font-medium text-primary"
                  >
                    {steps[boxStep].text}
                  </motion.span>
                  <span className="text-[10px] text-muted font-mono mt-1">4 seconds</span>
                </div>
              </div>
              <p className="text-[10px] text-muted/80 leading-normal">Box breathing calms the autonomic nervous system. Synchronize your breathing with the grid border fluctuations.</p>
            </div>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-pulse/20 pt-6">
          <div className="flex items-center gap-2 text-[10px] text-muted font-mono">
            <ShieldCheck className="w-4 h-4 text-aurora" />
            <span>MINDEASE // SECURITY PROTOCOL ACTIVE. WE NEVER DIAGNOSE.</span>
          </div>

          {isLocked ? (
            <button
              disabled
              className="w-full sm:w-auto bg-void border border-pulse/15 text-muted font-mono text-xs py-3 px-8 rounded-2xl select-none"
            >
              LOCATING RESOURCES ({countdown}s)
            </button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="w-full sm:w-auto bg-gradient-to-r from-warm to-[#ff5d9e] hover:from-[#ff1a7d] hover:to-[#ff458f] text-white font-mono text-xs py-3 px-8 rounded-2xl shadow-[0_0_20px_rgba(255,42,133,0.35)] border border-warm/50 transition-all uppercase tracking-wider"
            >
              Resume Workspace Chat
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
export default CrisisCard;
