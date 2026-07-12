import React from 'react';
import { motion } from 'framer-motion';

export const ThinkingOrb = ({ isThinking }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Outer Pulsing Glow */}
        <motion.div
          animate={
            isThinking
              ? {
                  scale: [1, 1.2, 0.95, 1.2, 1],
                  opacity: [0.5, 0.9, 0.4, 0.9, 0.5],
                  rotate: 360,
                }
              : {
                  scale: [1, 1.08, 1],
                  opacity: [0.3, 0.5, 0.3],
                }
          }
          transition={
            isThinking
              ? {
                  repeat: Infinity,
                  duration: 3,
                  ease: 'easeInOut',
                }
              : {
                  repeat: Infinity,
                  duration: 6,
                  ease: 'easeInOut',
                }
          }
          className={`absolute w-20 h-20 rounded-full blur-[16px] transition-colors duration-1000 ${
            isThinking
              ? 'bg-gradient-to-tr from-aurora via-pulse to-warm'
              : 'bg-gradient-to-tr from-pulse/40 to-aurora/30'
          }`}
        />

        {/* Core Sphere */}
        <motion.div
          animate={
            isThinking
              ? {
                  y: [0, -6, 0],
                  scale: [1, 1.1, 1],
                }
              : {
                  y: [0, -3, 0],
                  scale: [1, 1.02, 1],
                }
          }
          transition={{
            repeat: Infinity,
            duration: isThinking ? 2 : 4,
            ease: 'easeInOut',
          }}
          className={`w-14 h-14 rounded-full border border-white/10 shadow-[inset_0_4px_12px_rgba(255,255,255,0.15)] flex items-center justify-center overflow-hidden z-10 transition-all duration-1000 ${
            isThinking
              ? 'bg-surface shadow-[0_0_25px_rgba(79,255,176,0.4)] border-aurora/30'
              : 'bg-surface shadow-[0_0_15px_rgba(123,107,255,0.2)] border-pulse/20'
          }`}
        >
          {/* Inner Light Ripple */}
          <div
            className={`w-10 h-10 rounded-full blur-[4px] opacity-80 ${
              isThinking
                ? 'bg-gradient-to-br from-aurora/80 to-pulse/80 animate-spin'
                : 'bg-gradient-to-br from-pulse/40 to-transparent'
            }`}
            style={{ animationDuration: '4s' }}
          />
        </motion.div>

        {/* Orbiting Particle Dots */}
        {isThinking && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              className="absolute w-24 h-24 pointer-events-none"
            >
              <div className="w-1.5 h-1.5 bg-aurora rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-[0_0_8px_#4fffb0]" />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="absolute w-20 h-20 pointer-events-none"
            >
              <div className="w-1 h-1 bg-warm rounded-full absolute bottom-0 left-1/2 -translate-x-1/2 shadow-[0_0_8px_#ff8c69]" />
            </motion.div>
          </>
        )}
      </div>
      <span className="text-xs text-muted font-light tracking-widest uppercase">
        {isThinking ? 'Absorbing emotions...' : 'Your Safe Space'}
      </span>
    </div>
  );
};
