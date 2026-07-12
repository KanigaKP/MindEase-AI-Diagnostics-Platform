import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMoodStore } from '../hooks/useMoodStore';
import { Check, X, Calendar } from 'lucide-react';

export const MoodSlider = ({ onClose }) => {
  const [score, setScore] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const logMood = useMoodStore((state) => state.logMood);

  // Dynamic emoji selection and color scheme
  const getMoodEmojiInfo = (val) => {
    if (val <= 2) return { emoji: '😢', text: 'Struggling', color: 'text-red-400', glow: 'shadow-red-500/20' };
    if (val <= 4) return { emoji: '😐', text: 'Low / Heavy', color: 'text-warm', glow: 'shadow-warm/20' };
    if (val <= 6) return { emoji: '🙂', text: 'Stable / Okay', color: 'text-[#5eb8ff]', glow: 'shadow-blue-500/20' };
    if (val <= 8) return { emoji: '🌸', text: 'Calm / Light', color: 'text-aurora', glow: 'shadow-aurora/20' };
    return { emoji: '☀️', text: 'Radiant / Peaceful', color: 'text-yellow-300', glow: 'shadow-yellow-500/20' };
  };

  const currentMood = getMoodEmojiInfo(score);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await logMood(score, notes.trim() || null);
      setSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pulse/10 rounded-full blur-2xl" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary transition-colors p-1 rounded-full hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-10 text-center"
          >
            <div className="w-16 h-16 bg-aurora/20 border border-aurora/30 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(79,255,176,0.2)]">
              <Check className="w-8 h-8 text-aurora" />
            </div>
            <h3 className="text-xl font-medium mb-1">Check-in Logged</h3>
            <p className="text-muted text-sm">Your state has been saved in your safe diary.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="flex items-center gap-2 text-pulse mb-3">
              <Calendar className="w-4 h-4" />
              <span className="text-xs uppercase font-semibold tracking-wider">Daily Mood Check-in</span>
            </div>

            <h2 className="text-2xl font-light mb-1">How is your heart feeling?</h2>
            <p className="text-muted text-xs mb-8">Take a moment to reflect on your current state.</p>

            {/* Dynamic Emoji Circle */}
            <div className="flex flex-col items-center justify-center mb-8">
              <motion.div
                key={score}
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1.1, rotate: 0 }}
                className={`text-7xl mb-3 filter drop-shadow-lg`}
              >
                {currentMood.emoji}
              </motion.div>
              <span className={`text-sm font-semibold tracking-wide ${currentMood.color}`}>
                {currentMood.text} (Score: {score}/10)
              </span>
            </div>

            {/* Input Slider */}
            <div className="mb-6 px-2">
              <input
                type="range"
                min="1"
                max="10"
                value={score}
                onChange={(e) => setScore(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg bg-[#141f36] border border-white/5 appearance-none cursor-pointer accent-pulse focus:outline-none focus:ring-0"
                style={{
                  background: `linear-gradient(to right, var(--accent-pulse) 0%, var(--accent-aurora) ${(score-1)*11.1}%, #141f36 ${(score-1)*11.1}%, #141f36 100%)`
                }}
              />
              <div className="flex justify-between text-[10px] text-muted font-mono mt-2">
                <span>1 (Heavy)</span>
                <span>5 (Okay)</span>
                <span>10 (Vibrant)</span>
              </div>
            </div>

            {/* Optional Diary Entry Notes */}
            <div className="mb-6">
              <label className="text-xs text-muted block mb-2 font-medium">What's contributing to this feeling? (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Venting helps. Write down a few thoughts or triggers..."
                rows="3"
                className="w-full bg-[#090e1a]/80 border border-white/5 hover:border-white/10 focus:border-pulse/30 outline-none rounded-2xl p-3 text-sm placeholder-muted text-primary resize-none transition-colors"
              />
            </div>

            {/* Log Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-pulse to-aurora hover:from-[#9185ff] hover:to-[#66ffc2] text-void font-semibold py-3 px-6 rounded-2xl shadow-[0_0_20px_rgba(123,107,255,0.2)] transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Logging...' : 'Confirm Check-in'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
