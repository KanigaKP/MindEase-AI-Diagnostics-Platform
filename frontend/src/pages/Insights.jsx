import React, { useEffect } from 'react';
import { useMoodStore } from '../hooks/useMoodStore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  HelpCircle, 
  Activity, 
  Heart, 
  ShieldCheck, 
  Brain,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

export const Insights = ({ onNavigate }) => {
  const { insights, fetchInsights, sessionId } = useMoodStore();

  useEffect(() => {
    try {
      fetchInsights();
    } catch (e) {
      console.warn("Failed to fetch insights from store:", e);
    }
  }, [sessionId]);

  const hasMoodLogs = insights && insights.scores && insights.scores.length > 0;
  const hasDiagnostics = insights && insights.recent_diagnostics && insights.recent_diagnostics.length > 0;

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#100622] border border-pulse/30 p-3 rounded-xl text-xs shadow-xl backdrop-blur-md font-mono">
          <p className="text-muted mb-1">{payload[0].payload.day}</p>
          <p className="font-semibold text-aurora">Mood Rating: {payload[0].value}/10</p>
        </div>
      );
    }
    return null;
  };

  // Helper colors for diagnostic badges
  const getBadgeClass = (val, type) => {
    if (type === 'sentiment') {
      if (val > 0.2) return 'bg-aurora/10 text-aurora border-aurora/30';
      if (val < -0.2) return 'bg-warm/10 text-warm border-warm/30';
      return 'bg-muted/10 text-muted border-muted/20';
    }
    if (type === 'stress') {
      if (val === 'Severe') return 'bg-warm/20 text-warm border-warm/40 font-semibold animate-pulse';
      if (val === 'High') return 'bg-warm/15 text-warm border-warm/25';
      if (val === 'Moderate') return 'bg-pulse/10 text-pulse border-pulse/25';
      return 'bg-aurora/10 text-aurora border-aurora/25';
    }
    if (type === 'trauma') {
      if (val === 'Crisis') return 'bg-warm/20 text-warm border-warm/40 font-semibold animate-pulse';
      if (val === 'High') return 'bg-warm/15 text-warm border-warm/25';
      if (val === 'Elevated') return 'bg-pulse/10 text-pulse border-pulse/25';
      return 'bg-aurora/10 text-aurora border-aurora/25';
    }
    return 'bg-white/5 text-muted border-white/10';
  };

  // Dynamic clinical suggestions based on average sentiment/stress
  const getWellnessRecommendations = () => {
    const stressCounts = insights?.stress_distribution || [];
    const severeCount = stressCounts.find(s => s.level === 'Severe')?.count || 0;
    const highCount = stressCounts.find(s => s.level === 'High')?.count || 0;
    const avgSentiment = insights?.avg_sentiment || 0.0;

    if (severeCount > 0 || avgSentiment < -0.5) {
      return [
        { title: "Crisis Safety Triggered", text: "Severe distress levels identified. Focus on the 5-4-3-2-1 sensory grounding method and consult the crisis hotline card if needed." },
        { title: "Box Breathing Cycle", text: "Slow your breathing down: Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, hold for 4 seconds. Repeat for 5 cycles." },
        { title: "Cognitive Load Rest", text: "Disconnect from all screen stimuli for 15 minutes. Sip cold water and feel the physical sensations in your body." }
      ];
    } else if (highCount > 0 || avgSentiment < -0.1) {
      return [
        { title: "Cognitive Reframing (CBT)", text: "Identify racing thoughts and ask: 'Is this thought a factual truth, or a feeling induced by stress?' Challenge the bias." },
        { title: "Bilateral Stimulation", text: "Try progressive muscle relaxation or tap your shoulders left-and-right rhythmically to release somatic tension." },
        { title: "Active Ventilation", text: "Utilize the Journal Log on the workspace to vent your stress thoughts. Putting them in text reduces neural amygdala responses." }
      ];
    } else {
      return [
        { title: "Daily Mindful Baseline", text: "Your metrics show stable baseline activity. Practice a 5-minute breathing exercise today to maintain this grounding." },
        { title: "Expressive Gratitude", text: "Take 1 minute to reflect on one specific interaction or detail today that brought you peace." },
        { title: "System check-in", text: "Maintain consistency by logging your mood score daily. Daily records generate more precise diagnostic reflections." }
      ];
    }
  };

  const wellnessTips = getWellnessRecommendations();

  return (
    <div className="min-h-screen w-full bg-void text-primary bg-cosmic-grid overflow-y-auto pb-12 p-6 md:p-10 select-none">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Header */}
        <header className="flex items-center justify-between mb-10 pb-4 border-b border-pulse/20 font-mono">
          <button
            onClick={() => onNavigate('chat')}
            className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-aurora transition-colors py-1.5 px-3 bg-surface/50 border border-pulse/25 rounded-xl shadow-[0_0_10px_rgba(181,95,230,0.1)]"
          >
            <ArrowLeft className="w-4 h-4 text-aurora" /> Workspace Console
          </button>
          
          <div className="text-right">
            <h1 className="text-xl font-light uppercase tracking-wider text-shadow-pulse bg-gradient-to-r from-primary to-pulse bg-clip-text text-transparent">MindEase // Insights</h1>
            <span className="text-[9px] text-aurora font-mono uppercase tracking-widest block -mt-0.5">Clinical Analytics Dashboard</span>
          </div>
        </header>

        {/* Dashboard Grid - Row 1 (Stats Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 font-mono">
          
          {/* STREAK WIDGET */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface/40 border border-pulse/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.2)]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-warm/5 rounded-full blur-2xl pointer-events-none" />
            <Flame className="w-10 h-10 text-warm fill-warm animate-bounce mb-2" style={{ animationDuration: '3s' }} />
            
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted">CHECK-IN STREAK</span>
            <div className="text-4xl font-bold tracking-tight text-primary my-1 text-shadow-warm">
              {insights?.streak || 0}
            </div>
            <span className="text-[10px] text-warm font-semibold uppercase">consecutive days</span>
          </motion.div>

          {/* SENTIMENT TELEMETRY CARD */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-surface/40 border border-pulse/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.2)]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-aurora/5 rounded-full blur-2xl pointer-events-none" />
            <Activity className="w-10 h-10 text-aurora animate-pulse mb-2" />
            
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted">AVERAGE SENTIMENT</span>
            <div className={`text-4xl font-bold tracking-tight my-1 text-shadow-aurora ${
              (insights?.avg_sentiment || 0.0) >= 0 ? "text-aurora" : "text-warm"
            }`}>
              {insights?.avg_sentiment !== undefined ? (
                insights.avg_sentiment > 0 ? `+${insights.avg_sentiment.toFixed(2)}` : insights.avg_sentiment.toFixed(2)
              ) : "0.00"}
            </div>
            <span className="text-[10px] text-muted font-mono uppercase">telemetry index</span>
          </motion.div>

          {/* MOOD AVERAGE CARD */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface/40 border border-pulse/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.2)]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-pulse/5 rounded-full blur-2xl pointer-events-none" />
            <Heart className="w-10 h-10 text-pulse fill-pulse/20 mb-2" />
            
            <span className="text-[9px] uppercase font-bold tracking-widest text-muted">WEEKLY MOOD AVERAGE</span>
            <div className="text-4xl font-bold tracking-tight text-pulse my-1 text-shadow-pulse">
              {hasMoodLogs ? (
                (insights.scores.reduce((a, b) => a + b.score, 0) / insights.scores.length).toFixed(1)
              ) : "0.0"}/10
            </div>
            <span className="text-[10px] text-muted font-mono uppercase">daily baseline score</span>
          </motion.div>
        </div>

        {/* Row 2 - Reflection Text (Empathetic Diagnostics Prompt Output) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface/40 border border-pulse/20 rounded-3xl p-6 mb-8 relative overflow-hidden backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.2)]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-pulse/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2 text-pulse mb-3 font-mono">
            <Brain className="w-4 h-4 text-pulse" />
            <span className="text-xs uppercase font-bold tracking-widest">Cognitive Reflector Response</span>
          </div>
          
          <p className="text-sm leading-relaxed text-[#d1dbe5] whitespace-pre-wrap font-sans">
            {insights?.insight_text || "To view weekly diagnostic insights, please log your mood score and chat in the safe vault workspace. Once your session aggregates telemetry data, clinical suggestions will render here."}
          </p>
        </motion.div>

        {/* Row 3 - Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* MOOD TREND LINE CHART */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface/40 border border-pulse/20 rounded-3xl p-6 backdrop-blur-md flex flex-col h-80 shadow-[0_0_20px_rgba(0,0,0,0.2)]"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono mb-4">Mood Tracking Chronology</h3>
            
            <div className="flex-1 w-full text-[10px] font-mono">
              {hasMoodLogs ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={insights.scores} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(181, 95, 230, 0.05)" strokeDasharray="3 3" />
                    <XAxis dataKey="day" stroke="#5d527a" />
                    <YAxis domain={[1, 10]} stroke="#5d527a" tickCount={10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="var(--accent-aurora)" 
                      strokeWidth={3} 
                      activeDot={{ r: 6 }} 
                      dot={{ r: 4, stroke: 'var(--bg-void)', strokeWidth: 1.5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center text-muted">
                  <HelpCircle className="w-8 h-8 mb-2 opacity-50 text-pulse" />
                  <span>No log records compiled for this workspace.</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* STRESS SEVERITY DISTRIBUTION */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-surface/40 border border-pulse/20 rounded-3xl p-6 backdrop-blur-md flex flex-col h-80 shadow-[0_0_20px_rgba(0,0,0,0.2)]"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono mb-4">Stress Intensity Distribution</h3>
            
            <div className="flex-1 w-full text-[10px] font-mono">
              {insights?.stress_distribution && insights.stress_distribution.some(s => s.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insights.stress_distribution} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid stroke="rgba(181, 95, 230, 0.05)" strokeDasharray="3 3" />
                    <XAxis dataKey="level" stroke="#5d527a" />
                    <YAxis stroke="#5d527a" allowDecimals={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(181, 95, 230, 0.03)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#100622] border border-pulse/35 p-2 rounded-lg text-xs shadow-md font-mono">
                              <p className="font-semibold text-aurora">{payload[0].name}: {payload[0].value} inputs</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="var(--accent-pulse)" radius={[6, 6, 0, 0]}>
                      {insights.stress_distribution.map((entry, index) => {
                        const colors = {
                          'Low': 'var(--accent-aurora)',
                          'Moderate': 'var(--accent-pulse)',
                          'High': 'var(--accent-pulse)',
                          'Severe': 'var(--accent-warm)'
                        };
                        const barColor = colors[entry.level] || 'var(--accent-pulse)';
                        return <Cell key={`cell-${index}`} fill={barColor} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center text-muted">
                  <Activity className="w-8 h-8 mb-2 opacity-50 text-aurora" />
                  <span>Calibrate workspace conversations to gather stress telemetry.</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Row 4 - Diagnostics Log Table & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* CLINICAL SUGGESTIONS */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface/40 border border-pulse/20 rounded-3xl p-6 backdrop-blur-md flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.2)] md:col-span-1"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono mb-4 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-aurora" /> Wellness Guidelines
            </h3>
            
            <div className="space-y-4 flex-1">
              {wellnessTips.map((tip, idx) => (
                <div key={idx} className="bg-void/50 border border-pulse/10 p-3 rounded-2xl">
                  <div className="text-[10px] font-mono font-bold text-aurora uppercase tracking-wider mb-1">{tip.title}</div>
                  <div className="text-[11px] text-muted leading-relaxed font-sans">{tip.text}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* TELEMETRY LOG TABLE */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-surface/40 border border-pulse/20 rounded-3xl p-6 backdrop-blur-md flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.2)] md:col-span-2 overflow-hidden"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-mono mb-4">Diagnostics Feed (Last 10 Inputs)</h3>
            
            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-72 pr-1 scroll-smooth">
              {hasDiagnostics ? (
                <table className="w-full text-left font-mono text-[9px] border-collapse">
                  <thead>
                    <tr className="border-b border-pulse/20 text-muted uppercase">
                      <th className="pb-2">Input snippet</th>
                      <th className="pb-2">Sentiment</th>
                      <th className="pb-2">Stress</th>
                      <th className="pb-2">Trauma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pulse/10 text-primary">
                    {insights.recent_diagnostics.map((diag, index) => (
                      <tr key={index} className="hover:bg-pulse/5 transition-colors">
                        <td className="py-2.5 max-w-[200px] truncate pr-2 font-sans" title={diag.message}>
                          {diag.message}
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded border ${getBadgeClass(diag.sentiment, 'sentiment')}`}>
                            {diag.sentiment > 0 ? `+${diag.sentiment.toFixed(2)}` : diag.sentiment.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded border ${getBadgeClass(diag.stress, 'stress')}`}>
                            {diag.stress}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded border ${getBadgeClass(diag.trauma, 'trauma')}`}>
                            {diag.trauma}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center text-muted py-12">
                  <ShieldCheck className="w-8 h-8 mb-2 opacity-50 text-aurora" />
                  <span>No message logs stored. System baselines healthy.</span>
                </div>
              )}
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
};
export default Insights;
