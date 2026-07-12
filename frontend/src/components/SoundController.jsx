import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Radio, CloudRain, Sun } from 'lucide-react';

export const SoundController = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundType, setSoundType] = useState('drone'); // drone, rain
  const [volume, setVolume] = useState(0.5);

  const audioCtxRef = useRef(null);
  
  // Drone refs
  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const lfoRef = useRef(null);
  const lfoGainRef = useRef(null);
  const droneGainRef = useRef(null);
  const filterRef = useRef(null);

  // Rain refs
  const noiseSourceRef = useRef(null);
  const noiseFilterRef = useRef(null);
  const rainGainRef = useRef(null);
  const rainLfoRef = useRef(null);

  const masterGainRef = useRef(null);

  // Initialize Audio Context on first play
  const initAudio = () => {
    if (audioCtxRef.current) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume * 0.15; // Cap maximum volume to be gentle
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // --- SETUP DRONE SYNTHESIS ---
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 160; // Deep cutoff
    filterRef.current = filter;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.frequency.value = 120; // 120Hz Base
    osc2.frequency.value = 124; // 4Hz delta = Theta wave
    osc1Ref.current = osc1;
    osc2Ref.current = osc2;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.2;
    droneGainRef.current = droneGain;

    // LFO for breathing drone volume swell
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.125; // 8 seconds per breath
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.12; // amplitude of gain volume changes
    
    lfoRef.current = lfo;
    lfoGainRef.current = lfoGain;

    // Connect LFO to modulate drone volume
    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);

    // Connect oscillators to lowpass -> gain -> master
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(masterGain);

    // Start Drone nodes
    osc1.start();
    osc2.start();
    lfo.start();

    // --- SETUP OCEAN RAIN SYNTHESIS ---
    // Generate white noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    noiseSourceRef.current = noiseSource;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 400; // wind/rain frequency
    noiseFilter.Q.value = 0.4;
    noiseFilterRef.current = noiseFilter;

    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.0; // Started at 0
    rainGainRef.current = rainGain;

    // Low LFO for moving ocean swells
    const rainLfo = ctx.createOscillator();
    rainLfo.frequency.value = 0.08; // very slow wave
    const rainLfoGain = ctx.createGain();
    rainLfoGain.gain.value = 250; // modulates filter frequency
    rainLfoRef.current = rainLfo;

    rainLfo.connect(rainLfoGain);
    rainLfoGain.connect(noiseFilter.frequency); // wave swells shift the sound frequency

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(rainGain);
    rainGain.connect(masterGain);

    noiseSource.start();
    rainLfo.start();
  };

  // Handle Play/Stop Toggle
  const togglePlay = () => {
    if (!audioCtxRef.current) {
      initAudio();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (isPlaying) {
      // Soft mute
      masterGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    } else {
      // Soft restore
      masterGainRef.current.gain.setTargetAtTime(volume * 0.15, ctx.currentTime, 0.2);
      // Ensure correct source gains are active
      updateSoundMix(soundType);
    }
    setIsPlaying(!isPlaying);
  };

  // Adjust Mix Balance based on Mode selection
  const updateSoundMix = (type) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    if (type === 'drone') {
      // Bring up drone, mute rain
      droneGainRef.current.gain.setTargetAtTime(0.2, ctx.currentTime, 0.3);
      rainGainRef.current.gain.setTargetAtTime(0.0, ctx.currentTime, 0.3);
    } else {
      // Bring up rain, mute drone
      droneGainRef.current.gain.setTargetAtTime(0.0, ctx.currentTime, 0.3);
      rainGainRef.current.gain.setTargetAtTime(0.6, ctx.currentTime, 0.3);
    }
  };

  // Handle Switch
  const selectSound = (type) => {
    setSoundType(type);
    if (isPlaying) {
      updateSoundMix(type);
    }
  };

  // Volume slider adjustment
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        isPlaying ? volume * 0.15 : 0, 
        audioCtxRef.current.currentTime, 
        0.1
      );
    }
  }, [volume, isPlaying]);

  // Clean up nodes on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 p-4 bg-surface/50 border border-white/5 rounded-2xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold tracking-widest text-pulse">Ambient Soundscape</span>
        
        <button
          onClick={togglePlay}
          className={`flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold border transition-all ${
            isPlaying 
              ? 'bg-aurora/10 text-aurora border-aurora/30 shadow-[0_0_10px_rgba(79,255,176,0.1)]' 
              : 'bg-white/5 text-muted border-white/5 hover:text-primary'
          }`}
        >
          {isPlaying ? (
            <>
              <Volume2 className="w-3.5 h-3.5" /> Playing
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" /> Muted
            </>
          )}
        </button>
      </div>

      {/* Select buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => selectSound('drone')}
          disabled={!isPlaying}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-medium border transition-all ${
            !isPlaying 
              ? 'opacity-40 cursor-not-allowed border-transparent' 
              : soundType === 'drone'
                ? 'bg-pulse/20 text-pulse border-pulse/30'
                : 'bg-white/5 border-transparent text-muted hover:text-primary'
          }`}
        >
          <Radio className="w-3.5 h-3.5" /> Theta Drone
        </button>
        <button
          onClick={() => selectSound('rain')}
          disabled={!isPlaying}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-medium border transition-all ${
            !isPlaying 
              ? 'opacity-40 cursor-not-allowed border-transparent' 
              : soundType === 'rain'
                ? 'bg-pulse/20 text-pulse border-pulse/30'
                : 'bg-white/5 border-transparent text-muted hover:text-primary'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" /> Wind Rain
        </button>
      </div>

      {/* Volume Slider */}
      {isPlaying && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 mt-1"
        >
          <span className="text-[10px] text-muted">Vol</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 rounded-lg bg-[#141f36] appearance-none cursor-pointer accent-pulse focus:outline-none"
          />
        </motion.div>
      )}
    </div>
  );
};
