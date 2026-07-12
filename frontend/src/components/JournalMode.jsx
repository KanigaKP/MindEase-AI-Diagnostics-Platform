import React, { useState } from 'react';
import { BookOpen, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const JournalMode = ({ onSubmit, onCancel }) => {
  const [entry, setEntry] = useState('');

  const wordCount = entry.trim() === '' ? 0 : entry.trim().split(/\s+/).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!entry.trim()) return;
    
    // Construct a specialized prompt for RAG and LLM to parse as a journal entry
    const formattedPrompt = `[JOURNAL ENTRY] Here are my thoughts: "${entry.trim()}". Please read this journal entry, summarize my core feelings, offer a warm reflection, and suggest a reflective CBT question to write about next.`;
    onSubmit(formattedPrompt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col h-full bg-[#0d1424]/90 border border-white/5 rounded-3xl p-6 relative overflow-hidden"
    >
      {/* Decorative lines to resemble a notebook */}
      <div className="absolute top-0 bottom-0 left-8 w-[1px] bg-pulse/15 pointer-events-none" />
      <div className="absolute top-0 bottom-0 left-[34px] w-[1px] bg-pulse/15 pointer-events-none" />

      <div className="flex items-center justify-between mb-4 pl-8">
        <div className="flex items-center gap-2 text-aurora">
          <BookOpen className="w-5 h-5" />
          <h2 className="text-xl font-light">MindEase Journal Space</h2>
        </div>
        <div className="text-[10px] text-muted font-mono">{wordCount} words</div>
      </div>

      <p className="text-muted text-xs mb-6 pl-8 leading-relaxed">
        This is a private space to write without judgment. Empty your mind of any worries, doubts, or reflections. When finished, submit it and I will read and reflect on your writing.
      </p>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col pl-8">
        <textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Start writing... 'Today, I'm feeling...'"
          className="flex-1 bg-transparent border-none outline-none resize-none text-primary placeholder-muted leading-8 text-sm focus:ring-0 w-full"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '100% 2rem',
          }}
        />

        <div className="flex items-center justify-end gap-3 mt-6 border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!entry.trim()}
            className="bg-gradient-to-r from-aurora to-pulse hover:from-[#66ffc2] hover:to-[#9185ff] text-void font-semibold py-2.5 px-6 rounded-xl text-xs shadow-[0_0_20px_rgba(79,255,176,0.15)] transition-all disabled:opacity-50"
          >
            Reflect & Analyze
          </button>
        </div>
      </form>
    </motion.div>
  );
};
