import React, { useState, useEffect } from 'react';
import { 
  BarChart4, 
  Clock, 
  Layers, 
  FileText,
  AlertCircle,
  BrainCircuit,
  MessageSquare,
  Sparkles,
  Zap,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { AnalyticsSummary, Meeting } from '../types';

interface AnalyticsPageProps {
  currentMeeting?: Meeting | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ currentMeeting }) => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  // Calculate local speaker stats if a meeting is loaded
  const getSpeakerStats = () => {
    if (!currentMeeting || !currentMeeting.transcript) return [];
    
    const statsMap: Record<string, any> = {};
    let totalSecs = 0;
    
    currentMeeting.transcript.forEach((seg: any) => {
      const spk = seg.speaker_label || 'UNKNOWN';
      const duration = (seg.end_seconds || 0) - (seg.start_seconds || 0);
      const wordCount = seg.text ? seg.text.split(/\s+/).filter(Boolean).length : 0;
      
      if (!statsMap[spk]) {
        statsMap[spk] = {
          speaker: spk,
          speakingTime: 0,
          turns: 0,
          words: 0,
          confidences: [],
          maxSpeechSecs: 0,
          importantStatements: []
        };
      }
      
      statsMap[spk].speakingTime += duration;
      statsMap[spk].turns += 1;
      statsMap[spk].words += wordCount;
      if (seg.speaker_confidence) statsMap[spk].confidences.push(seg.speaker_confidence);
      if (duration > statsMap[spk].maxSpeechSecs) {
        statsMap[spk].maxSpeechSecs = duration;
      }
      
      // Save key discussing phrases (e.g. sentences > 12 words)
      if (wordCount > 12 && statsMap[spk].importantStatements.length < 3) {
        statsMap[spk].importantStatements.push(seg.text);
      }
      
      totalSecs += duration;
    });
    
    return Object.values(statsMap).map((s: any, idx: number) => {
      const avgConf = s.confidences.length > 0 ? s.confidences.reduce((a: number, b: number) => a + b, 0) / s.confidences.length : 1.0;
      const wpm = s.speakingTime > 0 ? Math.round(s.words / (s.speakingTime / 60)) : 0;
      return {
        ...s,
        color: COLORS[idx % COLORS.length],
        share: totalSecs > 0 ? (s.speakingTime / totalSecs) * 100 : 0,
        avgConfidence: avgConf,
        wpm: wpm
      };
    });
  };

  const speakerStats = getSpeakerStats();

  if (loading) {
    return (
      <div className="flex-1 bg-slate-950 p-8 space-y-8 animate-pulse w-full h-screen overflow-hidden">
        <div className="h-8 bg-slate-900 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-24 bg-slate-900 rounded-2xl"></div>
          <div className="h-24 bg-slate-900 rounded-2xl"></div>
          <div className="h-24 bg-slate-900 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-85 bg-slate-900 rounded-2xl"></div>
          <div className="h-85 bg-slate-900 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex-1 bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Analytics Unavailable</h3>
          <p className="text-xs text-slate-400 mt-1.5">{error || 'No meetings exist to process analytics.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-8 space-y-8 h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart4 className="w-6 h-6 text-sky-400" />
            Intelligence & Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Visualize meeting patterns, speaker turns, and resource benchmarks.</p>
        </div>
        {currentMeeting && (
          <div className="px-3.5 py-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold rounded-xl">
            Live Analysis: {currentMeeting.title}
          </div>
        )}
      </div>

      {/* Speaker Statistics Section (Milestone 4 & 5) */}
      {currentMeeting && speakerStats.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-md font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Speaker Performance Profiles
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Speakers List */}
            <div className="lg:col-span-2 space-y-4">
              {speakerStats.map((s: any) => (
                <div key={s.speaker} className="glass-panel p-5 rounded-2xl border border-slate-850 shadow-md flex items-start gap-4 hover:border-slate-700/60 transition-all duration-200">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-950 text-sm flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.speaker.slice(-2)}
                  </div>
                  
                  <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Speaker</span>
                      <h4 className="text-xs font-bold text-white truncate mt-0.5">{s.speaker}</h4>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Time / Share</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{Math.round(s.speakingTime)}s ({s.share.toFixed(1)}%)</h4>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Speaking Rate</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{s.wpm} WPM</h4>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Turns / Words</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{s.turns} turns ({s.words} words)</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Participation Donut Chart */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-850 flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Speaking Share</span>
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={speakerStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={55}
                      paddingAngle={4}
                      dataKey="speakingTime"
                      nameKey="speaker"
                    >
                      {speakerStats.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Important Things Said */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
              Important Things Said
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {speakerStats.map((s: any) => (
                <div key={s.speaker} className="glass-panel p-5 rounded-2xl border border-slate-850/60 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.speaker} key discussion points
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{s.wpm} words/min</span>
                  </div>
                  
                  {s.importantStatements.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No significant statement extracted.</span>
                  ) : (
                    <ul className="space-y-2">
                      {s.importantStatements.map((stmt: string, i: number) => (
                        <li key={i} className="text-xs text-slate-300 bg-slate-900/35 border border-slate-850 p-2.5 rounded-xl leading-relaxed">
                          "{stmt}"
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global Historical Analytics */}
      <div className="space-y-6">
        <h2 className="text-md font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-400" />
          Global Historical Metrics
        </h2>

        {/* Stats Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between shadow-xl card-elevation">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Meetings Transcribed</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">{analytics.meetings_count}</h3>
            </div>
            <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-400 border border-sky-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between shadow-xl card-elevation">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Average Meeting Duration</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">
                {analytics.meetings_count > 0 
                  ? `${((analytics.duration_total / analytics.meetings_count) / 60).toFixed(1)} min`
                  : '0.0 min'}
              </h3>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center justify-between shadow-xl card-elevation">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Vocabulary (Words)</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">{analytics.words_total}</h3>
            </div>
            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recharts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Timeline Chart */}
          <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-800 pb-3">
              Meeting Duration Trends
            </h3>
            <div className="h-64 w-full">
              {analytics.timeline.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs font-semibold">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.timeline}>
                    <defs>
                      <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: 11 }} />
                    <Area type="monotone" dataKey="duration" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDuration)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Word count per meeting */}
          <div className="glass-panel p-6 rounded-2xl shadow-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white tracking-tight border-b border-slate-800 pb-3">
              Word Density per Meeting
            </h3>
            <div className="h-64 w-full">
              {analytics.timeline.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs font-semibold">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: 11 }} />
                    <Bar dataKey="words" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
