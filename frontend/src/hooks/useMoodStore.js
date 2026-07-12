import { create } from 'zustand';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useMoodStore = create((set, get) => ({
  sessionId: localStorage.getItem('mindease_session_id') || null,
  accessToken: localStorage.getItem('mindease_access_token') || null,
  history: [],
  moodLogs: [],
  insights: {
    insight_text: "Checking in regularly helps me understand your mood patterns and provide customized mindfulness suggestions.",
    streak: 0,
    common_words: [],
    scores: []
  },
  localPrivacyMode: localStorage.getItem('mindease_privacy_mode') === 'true',
  isLoading: false,
  error: null,

  setSession: (sessionId, token) => {
    localStorage.setItem('mindease_session_id', sessionId);
    localStorage.setItem('mindease_access_token', token);
    set({ sessionId, accessToken: token });
  },

  clearSession: () => {
    localStorage.removeItem('mindease_session_id');
    localStorage.removeItem('mindease_access_token');
    localStorage.removeItem('mindease_local_history');
    set({ sessionId: null, accessToken: null, history: [], moodLogs: [], insights: {
      insight_text: "", streak: 0, common_words: [], scores: []
    }});
  },

  togglePrivacyMode: () => {
    const newMode = !get().localPrivacyMode;
    localStorage.setItem('mindease_privacy_mode', String(newMode));
    set({ localPrivacyMode: newMode });
  },

  startSession: async (email = null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/api/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error('Failed to initialize session');
      const data = await response.json();
      get().setSession(data.session_id, data.access_token);
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      // Offline fallback session if server is down
      const fallbackId = 'local-' + Math.random().toString(36).substr(2, 9);
      get().setSession(fallbackId, 'local-token');
      return { session_id: fallbackId };
    }
  },

  fetchHistory: async () => {
    const { sessionId, accessToken, localPrivacyMode } = get();
    if (!sessionId) return;

    if (localPrivacyMode) {
      const localHist = JSON.parse(localStorage.getItem(`mindease_hist_${sessionId}`) || '[]');
      set({ history: localHist });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch chat logs');
      const history = await response.json();
      set({ history, isLoading: false });
    } catch (err) {
      // Fallback to local cache
      const localHist = JSON.parse(localStorage.getItem(`mindease_hist_${sessionId}`) || '[]');
      set({ history: localHist, error: err.message, isLoading: false });
    }
  },

  addLocalMessage: (role, content, emotion_tag = null, sentiment_score = null, stress_severity = null, trauma_risk = null) => {
    const { sessionId, history } = get();
    const newMsg = {
      id: Date.now(),
      role,
      content,
      emotion_tag,
      sentiment_score,
      stress_severity,
      trauma_risk,
      timestamp: new Date().toISOString()
    };
    const updated = [...history, newMsg];
    set({ history: updated });
    
    // Save to local cache in either mode
    localStorage.setItem(`mindease_hist_${sessionId}`, JSON.stringify(updated));
  },

  logMood: async (score, notes = null) => {
    const { sessionId, accessToken, localPrivacyMode, moodLogs } = get();
    if (!sessionId) return;

    const localLog = {
      id: Date.now(),
      score,
      notes,
      timestamp: new Date().toISOString()
    };

    // Keep locally first
    const updatedLogs = [...moodLogs, localLog];
    set({ moodLogs: updatedLogs });
    localStorage.setItem(`mindease_moods_${sessionId}`, JSON.stringify(updatedLogs));

    if (localPrivacyMode) {
      // Recalculate streak and avg scores locally
      const streak = get().calculateLocalStreak(updatedLogs);
      set(state => ({
        insights: {
          ...state.insights,
          streak,
          scores: updatedLogs.map(l => ({
            day: new Date(l.timestamp).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
            score: l.score
          }))
        }
      }));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ score, notes })
      });
      if (!response.ok) throw new Error('Failed to record mood');
      // Re-fetch insights to update streaks and graphs
      get().fetchInsights();
    } catch (err) {
      set({ error: err.message });
    }
  },

  fetchInsights: async () => {
    const { sessionId, accessToken, localPrivacyMode } = get();
    if (!sessionId) return;

    if (localPrivacyMode) {
      const cachedMoods = JSON.parse(localStorage.getItem(`mindease_moods_${sessionId}`) || '[]');
      const streak = get().calculateLocalStreak(cachedMoods);
      const scores = cachedMoods.map(l => ({
        day: new Date(l.timestamp).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        score: l.score
      })).slice(-7);
      
      set(state => ({
        insights: {
          insight_text: "You are running in Local Privacy Mode. To protect your data, insights are processed entirely in-browser. Connect to the server to unlock LLM-powered weekly mood reflections.",
          streak,
          common_words: [
            { text: "Privacy", value: 25 },
            { text: "Local", value: 20 },
            { text: "Calm", value: 15 }
          ],
          scores
        }
      }));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/insights`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!response.ok) throw new Error('Failed to load user analytics');
      const insights = await response.json();
      set({ insights });
    } catch (err) {
      set({ error: err.message });
    }
  },

  calculateLocalStreak: (logs) => {
    if (!logs || logs.length === 0) return 0;
    
    // Sort logs descending
    const sorted = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    let streak = 0;
    let current = new Date();
    current.setHours(0,0,0,0);
    
    // Convert all logs to unique dates in UTC/local day boundaries
    const dates = sorted.map(l => {
      const d = new Date(l.timestamp);
      d.setHours(0,0,0,0);
      return d.getTime();
    });
    
    const uniqueDates = Array.from(new Set(dates));
    if (uniqueDates.length === 0) return 0;
    
    // Check if the most recent log is today or yesterday
    const oneDay = 24 * 60 * 60 * 1000;
    const diff = current.getTime() - uniqueDates[0];
    
    if (diff > oneDay) return 0; // Broke streak (last checkin was > 1 day ago)
    
    streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const gap = uniqueDates[i - 1] - uniqueDates[i];
      if (gap === oneDay) {
        streak++;
      } else if (gap > oneDay) {
        break;
      }
    }
    return streak;
  }
}));
