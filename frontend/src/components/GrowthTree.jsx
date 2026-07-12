import React from 'react';
import { motion } from 'framer-motion';

export const GrowthTree = ({ messageCount = 0 }) => {
  // Determine growth stage based on message count
  // Stage 0: Seed/Sprout (0-2 messages)
  // Stage 1: Small plant (3-7 messages)
  // Stage 2: Budding tree (8-14 messages)
  // Stage 3: Blooming Tree (15+ messages)
  
  let stage = 0;
  if (messageCount >= 15) stage = 3;
  else if (messageCount >= 8) stage = 2;
  else if (messageCount >= 3) stage = 1;

  // Animation settings for drawing the SVG lines
  const drawAnimation = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { pathLength: { type: "spring", duration: 2, bounce: 0 }, opacity: { duration: 0.5 } }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-surface/50 border border-white/5 rounded-2xl backdrop-blur-md">
      <div className="text-center mb-3">
        <span className="text-[10px] uppercase font-bold tracking-widest text-aurora">Mental Growth Tree</span>
        <div className="text-[11px] text-muted font-mono mt-0.5">Stage {stage}: {messageCount} interactions</div>
      </div>

      <div className="w-24 h-28 relative">
        <svg viewBox="0 0 100 120" className="w-full h-full" fill="none" strokeLinecap="round">
          {/* Ground */}
          <path d="M 10 110 Q 50 105 90 110" stroke="#334155" strokeWidth="2" />
          
          {/* Seed/Sprout - Level 0 Core Trunk */}
          <motion.path
            d="M 50 110 Q 48 85 50 70"
            stroke="#64748b"
            strokeWidth="3.5"
            variants={drawAnimation}
            initial="hidden"
            animate="visible"
          />

          {/* Seed Leaf (Stage 0) */}
          <motion.path
            d="M 50 70 Q 40 60 50 55 Q 60 65 50 70"
            fill="var(--accent-aurora)"
            fillOpacity="0.2"
            stroke="var(--accent-aurora)"
            strokeWidth="1.5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            transition={{ delay: 0.5 }}
          />

          {/* Branches (Stage 1+) */}
          {stage >= 1 && (
            <>
              {/* Left Branch */}
              <motion.path
                d="M 50 85 Q 35 75 30 65"
                stroke="#64748b"
                strokeWidth="2.5"
                variants={drawAnimation}
                initial="hidden"
                animate="visible"
              />
              {/* Left Leaf */}
              <motion.path
                d="M 30 65 Q 20 62 25 52 Q 35 58 30 65"
                fill="var(--accent-aurora)"
                fillOpacity="0.4"
                stroke="var(--accent-aurora)"
                strokeWidth="1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              />
            </>
          )}

          {/* Left Sub-Branch & Flower (Stage 2+) */}
          {stage >= 2 && (
            <>
              {/* Right Branch */}
              <motion.path
                d="M 50 78 Q 65 70 72 58"
                stroke="#64748b"
                strokeWidth="2"
                variants={drawAnimation}
                initial="hidden"
                animate="visible"
              />
              {/* Right Leaf */}
              <motion.path
                d="M 72 58 Q 82 58 78 48 Q 68 50 72 58"
                fill="var(--accent-aurora)"
                fillOpacity="0.6"
                stroke="var(--accent-aurora)"
                strokeWidth="1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              />
              {/* Center extension */}
              <motion.path
                d="M 50 70 Q 52 50 48 35"
                stroke="#64748b"
                strokeWidth="2"
                variants={drawAnimation}
                initial="hidden"
                animate="visible"
              />
              {/* Top main leaf */}
              <motion.circle
                cx="48"
                cy="35"
                r="4"
                fill="var(--accent-pulse)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 }}
                className="shadow-glow-pulse"
              />
            </>
          )}

          {/* Blossoms & bioluminescent lights (Stage 3+) */}
          {stage >= 3 && (
            <>
              {/* Higher left branch */}
              <motion.path
                d="M 48 50 Q 32 40 38 25"
                stroke="#64748b"
                strokeWidth="1.5"
                variants={drawAnimation}
                initial="hidden"
                animate="visible"
              />
              <motion.circle
                cx="38"
                cy="25"
                r="3"
                fill="var(--accent-warm)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="shadow-glow-warm animate-pulse"
              />

              {/* Higher right branch */}
              <motion.path
                d="M 48 45 Q 68 38 65 20"
                stroke="#64748b"
                strokeWidth="1.5"
                variants={drawAnimation}
                initial="hidden"
                animate="visible"
              />
              <motion.circle
                cx="65"
                cy="20"
                r="3"
                fill="var(--accent-aurora)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="shadow-glow-aurora animate-pulse"
              />

              {/* Glowing bioluminescent dots */}
              <motion.circle cx="28" cy="80" r="1.5" fill="var(--accent-aurora)" animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} />
              <motion.circle cx="72" cy="75" r="1.5" fill="var(--accent-pulse)" animate={{ opacity: [0.1, 0.9, 0.1] }} transition={{ repeat: Infinity, duration: 3 }} />
              <motion.circle cx="48" cy="18" r="2" fill="var(--accent-aurora)" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2.5 }} />
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
