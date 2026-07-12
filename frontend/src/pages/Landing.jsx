import React, { useState } from 'react';
import { BreathingGate } from '../components/BreathingGate';
import { useMoodStore } from '../hooks/useMoodStore';

export const Landing = ({ onNavigate }) => {
  const startSession = useMoodStore((state) => state.startSession);
  const [loading, setLoading] = useState(false);

  const handleEnter = async () => {
    setLoading(true);
    try {
      await startSession();
      onNavigate('chat');
    } catch (e) {
      console.error("Session initialize failed, routing anyway with offline mode:", e);
      onNavigate('chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen relative bg-void overflow-hidden">
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-void z-50 font-mono">
          <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-aurora animate-spin shadow-[0_0_15px_rgba(0,229,255,0.3)] mb-4" />
          <span className="text-xs text-aurora uppercase tracking-widest animate-pulse">Initializing Neural Workspace...</span>
        </div>
      ) : (
        <BreathingGate onEnter={handleEnter} />
      )}
    </div>
  );
};

export default Landing;
