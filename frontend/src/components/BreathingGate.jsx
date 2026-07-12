import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, ShieldAlert } from 'lucide-react';

export const BreathingGate = ({ onEnter }) => {
  const [breathPhase, setBreathPhase] = useState('Inhale'); // Inhale, Exhale
  const [secondsLeft, setSecondsLeft] = useState(8);
  const [cycleCompleted, setCycleCompleted] = useState(false);

  useEffect(() => {
    // Phase cycling: 4s inhale, 4s exhale
    const phaseInterval = setInterval(() => {
      setBreathPhase((prev) => (prev === 'Inhale' ? 'Exhale' : 'Inhale'));
    }, 4000);

    // Timer to unlock entry after 8s
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setCycleCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-void text-primary p-6 bg-cosmic-grid overflow-hidden">
      {/* Background Neon Twinkling Particles */}
      <div className="absolute inset-0 z-0">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-pulse rounded-full opacity-40 animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              boxShadow: '0 0 8px var(--accent-pulse)',
              animationDuration: Math.random() * 3 + 2 + 's',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="z-10 text-center max-w-md"
      >
        <div className="flex justify-center items-center gap-2 mb-3 text-aurora">
          <Activity className="w-5 h-5 animate-pulse text-aurora" />
          <span className="uppercase tracking-widest text-xs font-mono font-semibold">MINDEASE // NEURAL DIAGNOSTICS</span>
        </div>
        <h1 className="text-4xl font-light tracking-tight mb-4 text-shadow-aurora">
          Pause. Calibrate your <span className="text-aurora font-medium font-mono">Core</span>.
        </h1>
        <p className="text-muted text-sm mb-12">
          Initiating diagnostic environment. Sync your breathing with the neural core below to align baseline signals before entering.
        </p>
      </motion.div>

      {/* Breathing Circle Container */}
      <div className="relative flex items-center justify-center w-72 h-72 z-10 mb-12">
        {/* Breathing Guided Circle */}
        <motion.div
          animate={{
            scale: breathPhase === 'Inhale' ? 1.3 : 0.95,
            opacity: breathPhase === 'Inhale' ? 0.8 : 0.4,
          }}
          transition={{
            duration: 4,
            ease: "easeInOut"
          }}
          className="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-pulse via-surface to-aurora blur-[1px] flex items-center justify-center shadow-[0_0_50px_rgba(0,229,255,0.25)] border border-pulse/20"
        />

        {/* Inner Core */}
        <div className="absolute w-36 h-36 rounded-full bg-void border border-pulse/35 flex flex-col items-center justify-center z-20 shadow-[0_0_20px_rgba(181,95,230,0.15)]">
          <AnimatePresence mode="wait">
            <motion.span
              key={breathPhase}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.5 }}
              className={`text-xl font-mono uppercase tracking-wider ${breathPhase === 'Inhale' ? 'text-aurora font-medium' : 'text-pulse'}`}
            >
              {breathPhase}
            </motion.span>
          </AnimatePresence>
          <span className="text-[10px] text-muted uppercase mt-1.5 font-mono">
            {breathPhase === 'Inhale' ? 'Expansion' : 'Contraction'}
          </span>
        </div>

        {/* Outermost Ring */}
        <div className="absolute w-64 h-64 rounded-full border border-pulse/10 border-dashed animate-spin" style={{ animationDuration: '60s' }} />
        <div className="absolute w-72 h-72 rounded-full border border-aurora/5 border-double animate-spin" style={{ animationDuration: '40s', animationDirection: 'reverse' }} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="z-10 text-center w-full max-w-xs"
      >
        {!cycleCompleted ? (
          <div className="text-muted text-xs bg-surface/80 border border-pulse/20 py-3 px-6 rounded-2xl inline-block backdrop-blur-md font-mono shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
            CALIBRATING BASES... <span className="text-aurora font-mono font-semibold">{secondsLeft}s</span>
          </div>
        ) : (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnter}
            className="w-full bg-gradient-to-r from-pulse via-surface to-aurora hover:from-[#c275f0] hover:to-[#5cffea] text-primary hover:text-void font-semibold py-3.5 px-8 rounded-2xl border border-pulse/40 hover:border-aurora/60 shadow-[0_0_25px_rgba(181,95,230,0.3)] transition-all flex items-center justify-center gap-2 font-mono uppercase tracking-wider text-xs"
          >
            Access Safe Vault
            <Sparkles className="w-4 h-4" />
          </motion.button>
        )}
      </motion.div>

      {/* Branding Tagline */}
      <div className="absolute bottom-6 text-[10px] text-muted/60 font-mono tracking-widest uppercase">
        KP // COGNITIVE RESEARCH LABS
      </div>
    </div>
  );
};

export default BreathingGate;
