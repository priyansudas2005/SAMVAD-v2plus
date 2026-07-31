import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity, Clock, Users, FileText, MessageSquare, Mic, BarChart3, BrainCircuit,
  CheckCircle2, XCircle, AlertTriangle, TrendingUp, TrendingDown, Target, Zap,
  Shield, Volume2, UserCheck, Wifi, Download, Copy, ChevronDown, ChevronUp,
  Search, Filter, ArrowUpDown, ExternalLink, Play, Square, RefreshCw,
  Award, Lightbulb, ShieldAlert, ListChecks, GitBranch, Layers, Loader2,
  Eye, EyeOff, Speaker, BookOpen, PieChart, Hash, ArrowUp, ArrowDown,
  Minimize2, Maximize2, Star, ThumbsUp, ThumbsDown, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Meeting, MeetingStats, SpeakerStat } from '../types';
import { api } from '../services/api';

interface StatsPageProps {
  currentMeeting: Meeting;
  onUpdateMeeting?: (meeting: Meeting) => void;
}

export const StatsPage: React.FC<StatsPageProps> = ({ currentMeeting, onUpdateMeeting }) => {
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    snapshot: true,
    speakers: false,
    contributions: false,
    statements: false,
    highlights: true,
    actions: false,
    decisions: false,
    topics: false,
    audio: false,
    transcription: false,
    pipeline: true,
    health: true,
    insights: true
  });
  const [expandedSpeaker, setExpandedSpeaker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const fetchStats = useCallback(async () => {
    if (!currentMeeting?.meeting_id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMeetingStats(currentMeeting.meeting_id);
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [currentMeeting?.meeting_id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh polling when meeting has no intelligence yet
  useEffect(() => {
    if (!stats || stats.meeting_health.overall_score < 50) {
      const interval = setInterval(fetchStats, 15000);
      return () => clearInterval(interval);
    }
  }, [stats, fetchStats]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSpeaker = (spk: string) => {
    setExpandedSpeaker(prev => prev === spk ? null : spk);
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {}
  };

  const handleExport = async (fmt: string) => {
    try {
      await api.downloadStatsExport(currentMeeting.meeting_id, fmt);
    } catch {}
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const scoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const scoreBg = (score: number): string => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  const CircularProgress = ({ value, size = 80, strokeWidth = 6, label = '' }: { value: number; size?: number; strokeWidth?: number; label?: string }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;
    const color = value >= 80 ? '#34d399' : value >= 60 ? '#fbbf24' : '#f87171';
    return (
      <div className="flex flex-col items-center gap-1">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        </svg>
        <span className="text-lg font-bold" style={{ color }}>{value.toFixed(0)}</span>
        {label && <span className="text-[10px] text-slate-400 text-center">{label}</span>}
      </div>
    );
  };

  const KpiCard = ({ icon: Icon, label, value, sub, color = 'text-sky-400', trend }: any) => (
    <div className="glass-panel p-4 rounded-xl border border-slate-800/60 flex items-start gap-3 hover:border-sky-500/30 transition-all">
      <div className={`p-2 rounded-lg bg-${color.split('-')[0]}-500/10 shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-lg font-bold text-white truncate">{value}</div>
        {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-semibold mt-0.5 ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );

  const SectionHeader = ({ id, title, icon: Icon, defaultExpanded = false }: { id: string; title: string; icon: any; defaultExpanded?: boolean }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-3 glass-panel rounded-xl border border-slate-800/60 hover:border-sky-500/30 transition-all group"
    >
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-sky-400" />
        <span className="text-sm font-bold text-white">{title}</span>
      </div>
      {expandedSections[id] ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
    </button>
  );

  const StatBadge = ({ label, value, color = 'text-slate-300' }: { label: string; value: any; color?: string }) => (
    <div className="flex items-center justify-between py-1.5 px-3 bg-slate-900/50 rounded-lg">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{value ?? 'N/A'}</span>
    </div>
  );

  const ProgressBar = ({ value, max = 100, label = '', color = 'bg-sky-500' }: { value: number; max?: number; label?: string; color?: string }) => {
    const pct = Math.min(100, (value / max) * 100);
    return (
      <div className="flex items-center gap-2">
        {label && <span className="text-[10px] text-slate-500 w-20 shrink-0">{label}</span>}
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] text-slate-400 w-8 text-right">{value.toFixed(0)}%</span>
      </div>
    );
  };

  const ConfidenceBadge = ({ value }: { value: number }) => {
    const color = value >= 0.8 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
      value >= 0.6 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
        'bg-rose-500/10 text-rose-400 border-rose-500/20';
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
        {(value * 100).toFixed(0)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading meeting diagnostics...</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <AlertTriangle className="w-12 h-12 text-amber-400" />
          <p className="text-slate-400 text-sm">{error}</p>
          <button onClick={fetchStats} className="px-4 py-2 bg-sky-500 text-white rounded-lg text-xs font-bold hover:bg-sky-400 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const sp = stats.speaker_statistics;
  const health = stats.meeting_health;
  const insights = stats.smart_insights;
  const audio = stats.audio_diagnostics;
  const transDiag = stats.transcription_diagnostics;
  const topicsEnt = stats.topics_entities;
  const highlights = stats.meeting_highlights;
  const aiBreakdown = stats.action_item_breakdown;
  const decSummary = stats.decision_summary;
  const pipeline = stats.processing_pipeline;
  const contribs = stats.speaker_contributions;
  const statements = stats.important_statements;

  return (
    <div ref={statsRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            Meeting Diagnostics
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {stats.meeting_title} &middot; {formatDate(stats.recording_date)} &middot; {formatDuration(stats.meeting_duration_s)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search stats..."
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 w-48"
            />
          </div>
          <div className="flex gap-1">
            {['json', 'txt'].map(fmt => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-sky-500/30 transition-colors text-slate-400 hover:text-sky-400"
                title={`Export as ${fmt.toUpperCase()}`}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== SECTION 1: Meeting Snapshot ===== */}
      <div className="rounded-xl border border-slate-800/60 overflow-hidden">
        <SectionHeader id="snapshot" title="Meeting Snapshot" icon={Layers} defaultExpanded />
        <AnimatePresence>
          {expandedSections.snapshot && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  <KpiCard icon={FileText} label="Title" value={stats.meeting_title} color="text-sky-400" />
                  <KpiCard icon={Clock} label="Duration" value={formatDuration(stats.meeting_duration_s)} color="text-indigo-400" />
                  <KpiCard icon={Users} label="Speakers" value={stats.total_speakers} color="text-purple-400" />
                  <KpiCard icon={MessageSquare} label="Segments" value={stats.total_transcript_segments} color="text-emerald-400" />
                  <KpiCard icon={Hash} label="Words" value={stats.total_words.toLocaleString()} color="text-amber-400" />
                  <KpiCard icon={BookOpen} label="Sentences" value={stats.total_sentences} color="text-rose-400" />
                  <KpiCard icon={Activity} label="Speed" value={`${stats.speaking_rate_wpm} WPM`} color="text-cyan-400" />
                  <KpiCard icon={Mic} label="Audio Quality" value={`${stats.audio_quality_score.toFixed(0)}%`} color={scoreColor(stats.audio_quality_score)} />
                  <KpiCard icon={BrainCircuit} label="Confidence" value={`${(stats.transcript_confidence * 100).toFixed(0)}%`} color={scoreColor(stats.transcript_confidence * 100)} />
                  <KpiCard icon={Zap} label="Processing" value={stats.processing_time_s ? `${stats.processing_time_s.toFixed(1)}s` : 'N/A'} color="text-orange-400" />
                  <KpiCard icon={Award} label="Overall" value={`${health.overall_score.toFixed(0)}/100`} color={scoreColor(health.overall_score)} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== SECTION 2: Speaker Statistics ===== */}
      <div className="rounded-xl border border-slate-800/60 overflow-hidden">
        <SectionHeader id="speakers" title="Speaker Statistics" icon={Users} />
        <AnimatePresence>
          {expandedSections.speakers && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 pt-2 space-y-2">
                {sp.length === 0 && <div className="text-sm text-slate-500 text-center py-4">No speaker data available</div>}
                {sp.map((s: SpeakerStat) => (
                  <div key={s.speaker} className="glass-panel rounded-xl border border-slate-800/60 overflow-hidden">
                    <button
                      onClick={() => toggleSpeaker(s.speaker)}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: s.color }}>
                          {s.speaker.replace('SPEAKER_', '').replace('Speaker ', '').padStart(2, '0')}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-white">{s.speaker}</div>
                          <div className="text-[10px] text-slate-400">{s.participation_percentage}% participation &middot; {s.total_words} words</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ConfidenceBadge value={s.avg_confidence} />
                        <span className="text-xs text-slate-400">{s.turns} turns</span>
                        {expandedSpeaker === s.speaker ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedSpeaker === s.speaker && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="p-3 pt-0 border-t border-slate-800/40 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            <StatBadge label="Speaking Time" value={formatDuration(s.total_speaking_time)} />
                            <StatBadge label="Participation" value={`${s.participation_percentage}%`} />
                            <StatBadge label="Turns" value={s.turns} />
                            <StatBadge label="Words" value={s.total_words} />
                            <StatBadge label="Avg WPM" value={s.avg_speaking_speed_wpm} />
                            <StatBadge label="Longest Turn" value={formatDuration(s.longest_speaking_segment)} />
                            <StatBadge label="Interruptions Made" value={s.interruptions_made} color={s.interruptions_made > 3 ? 'text-rose-400' : 'text-slate-300'} />
                            <StatBadge label="Times Interrupted" value={s.times_interrupted} />
                            <StatBadge label="Silence" value={formatDuration(s.silence_duration)} />
                            <StatBadge label="Avg Confidence" value={<ConfidenceBadge value={s.avg_confidence} />} />
                            {s.first_appearance && <StatBadge label="First Seen" value={s.first_appearance} />}
                            {s.last_appearance && <StatBadge label="Last Seen" value={s.last_appearance} />}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== SECTION 3: Speaker Contributions ===== */}
      {contribs.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 overflow-hidden">
          <SectionHeader id="contributions" title="Speaker Contributions" icon={Star} />
          <AnimatePresence>
            {expandedSections.contributions && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {contribs.map((c: any) => (
                    <div key={c.speaker} className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-sm font-bold text-white">{c.speaker}</span>
                      </div>
                      <ul className="space-y-1">
                        {c.contributions.map((ct: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="text-sky-400 mt-0.5">&#x2022;</span>
                            {ct}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ===== SECTION 4: Important Statements ===== */}
      {statements.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 overflow-hidden">
          <SectionHeader id="statements" title="Important Statements" icon={MessageSquare} />
          <AnimatePresence>
            {expandedSections.statements && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="p-4 pt-2 space-y-1.5">
                  {statements.map((st: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 bg-slate-900/50 rounded-lg border border-slate-800/40 hover:border-sky-500/20 transition-colors group">
                      <div className="w-1.5 h-full rounded-full shrink-0 mt-0.5" style={{ backgroundColor: st.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white">{st.speaker}</span>
                          <span className="text-[10px] text-slate-500">{st.timestamp}</span>
                          <ConfidenceBadge value={st.confidence} />
                          {st.topic && <span className="text-[10px] px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded-full">{st.topic}</span>}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{st.statement}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ===== SECTION 5: Meeting Highlights ===== */}
      <div className="rounded-xl border border-slate-800/60 overflow-hidden">
        <SectionHeader id="highlights" title="Meeting Highlights" icon={Target} />
        <AnimatePresence>
          {expandedSections.highlights && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {highlights.biggest_decision && (
                  <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Biggest Decision</span>
                    </div>
                    <p className="text-xs text-slate-300">{highlights.biggest_decision}</p>
                  </div>
                )}
                {highlights.most_important_action_item && (
                  <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-2 mb-1">
                      <ListChecks className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Top Action</span>
                    </div>
                    <p className="text-xs text-slate-300">{highlights.most_important_action_item}</p>
                  </div>
                )}
                {highlights.biggest_risk && (
                  <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Biggest Risk</span>
                    </div>
                    <p className="text-xs text-slate-300">{highlights.biggest_risk}</p>
                  </div>
                )}
                {highlights.biggest_blocker && (
                  <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Biggest Blocker</span>
                    </div>
                    <p className="text-xs text-slate-300">{highlights.biggest_blocker}</p>
                  </div>
                )}
                {highlights.key_deadline && (
                  <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Key Deadline</span>
                    </div>
                    <p className="text-xs text-slate-300">{highlights.key_deadline}</p>
                  </div>
                )}
                {highlights.critical_discussion && (
                  <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Critical Discussion</span>
                    </div>
                    <p className="text-xs text-slate-300">{highlights.critical_discussion}</p>
                  </div>
                )}
                {highlights.meeting_outcome && (
                  <div className="glass-panel p-3 rounded-xl border border-slate-800/60 sm:col-span-2 lg:col-span-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Meeting Outcome</span>
                    </div>
                    <p className="text-xs text-slate-300">{highlights.meeting_outcome}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== SECTION 6: Action Item Breakdown ===== */}
      <div className="rounded-xl border border-slate-800/60 overflow-hidden">
        <SectionHeader id="actions" title="Action Item Breakdown" icon={ListChecks} />
        <AnimatePresence>
          {expandedSections.actions && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-3">
                  <KpiCard icon={ListChecks} label="Total" value={aiBreakdown.total} color="text-sky-400" />
                  <KpiCard icon={ArrowUp} label="High" value={aiBreakdown.high_priority} color="text-rose-400" />
                  <KpiCard icon={Minimize2} label="Medium" value={aiBreakdown.medium_priority} color="text-amber-400" />
                  <KpiCard icon={ArrowDown} label="Low" value={aiBreakdown.low_priority} color="text-emerald-400" />
                  <KpiCard icon={CheckCircle2} label="Completed" value={aiBreakdown.completed} color="text-emerald-400" />
                  <KpiCard icon={Clock} label="Pending" value={aiBreakdown.pending} color="text-amber-400" />
                  <KpiCard icon={AlertTriangle} label="Overdue" value={aiBreakdown.overdue} color="text-rose-400" />
                </div>
                {aiBreakdown.items.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {aiBreakdown.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-900/30 rounded-lg text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.priority === 'HIGH' || item.priority === 'CRITICAL' ? 'bg-rose-500' :
                          item.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="text-slate-300 flex-1">{item.task || item.text || String(item)}</span>
                        {item.owner && <span className="text-slate-500">{item.owner}</span>}
                        {item.deadline && <span className="text-slate-500 text-[10px]">{item.deadline}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== SECTION 7: Decision Summary ===== */}
      <div className="rounded-xl border border-slate-800/60 overflow-hidden">
        <SectionHeader id="decisions" title="Decision Summary" icon={GitBranch} />
        <AnimatePresence>
          {expandedSections.decisions && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 pt-2">
                {[decSummary.major_decisions, decSummary.technical_decisions, decSummary.business_decisions].some(l => l.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {decSummary.major_decisions.length > 0 && (
                      <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Major</h3>
                        <ul className="space-y-1">
                          {decSummary.major_decisions.map((d: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {decSummary.technical_decisions.length > 0 && (
                      <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Technical</h3>
                        <ul className="space-y-1">
                          {decSummary.technical_decisions.map((d: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                              <Zap className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {decSummary.business_decisions.length > 0 && (
                      <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Business</h3>
                        <ul className="space-y-1">
                          {decSummary.business_decisions.map((d: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                              <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-3">No decisions documented</div>
                )}
                {(decSummary.pending_decisions.length > 0 || decSummary.open_decisions.length > 0) && (
                  <div className="mt-2 flex gap-2">
                    {decSummary.pending_decisions.length > 0 && (
                      <span className="text-[10px] px-2 py-1 bg-amber-500/10 text-amber-400 rounded-full">
                        {decSummary.pending_decisions.length} pending
                      </span>
                    )}
                    {decSummary.open_decisions.length > 0 && (
                      <span className="text-[10px] px-2 py-1 bg-sky-500/10 text-sky-400 rounded-full">
                        {decSummary.open_decisions.length} open
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== SECTION 8: Topics & Entities ===== */}
      <div className="rounded-xl border border-slate-800/60 overflow-hidden">
        <SectionHeader id="topics" title="Topics & Entities" icon={Layers} />
        <AnimatePresence>
          {expandedSections.topics && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {topicsEnt.topics.length > 0 && (
                    <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Topics</h3>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {topicsEnt.topics.map((t: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300">{t.name}</span>
                            <div className="flex items-center gap-1">
                              <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.min(100, t.frequency * 2)}%` }} />
                              </div>
                              <span className="text-[10px] text-slate-500 w-6 text-right">{t.frequency}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {topicsEnt.technologies.length > 0 && (
                    <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Technologies</h3>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {topicsEnt.technologies.map((t: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-sky-300">{t.name}</span>
                            <span className="text-[10px] text-slate-500">{t.frequency}x</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {topicsEnt.people.length > 0 && (
                    <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">People</h3>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {topicsEnt.people.map((p: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-purple-300">{p.name}</span>
                            <span className="text-[10px] text-slate-500">{p.frequency}x</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {topicsEnt.keywords.length > 0 && (
                    <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Keywords</h3>
                      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                        {topicsEnt.keywords.slice(0, 20).map((kw: string, i: number) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-800/50 text-slate-300 rounded-full">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== SECTION 9: Audio Diagnostics ===== */}
      <div className="rounded-xl border border-slate-800/60 overflow-hidden">
        <SectionHeader id="audio" title="Audio Diagnostics" icon={Volume2} />
        <AnimatePresence>
          {expandedSections.audio && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  <StatBadge label="Avg Loudness" value={audio.average_loudness_db != null ? `${audio.average_loudness_db} dB` : 'N/A'} />
                  <StatBadge label="Peak Level" value={audio.peak_level_db != null ? `${audio.peak_level_db} dB` : 'N/A'} />
                  <StatBadge label="RMS" value={audio.rms_db != null ? `${audio.rms_db} dB` : 'N/A'} />
                  <StatBadge label="Noise Level" value={audio.noise_level_db != null ? `${audio.noise_level_db} dB` : 'N/A'} />
                  <StatBadge label="Speech Coverage" value={audio.speech_coverage_percent != null ? `${audio.speech_coverage_percent}%` : 'N/A'} color={audio.speech_coverage_percent != null && audio.speech_coverage_percent >= 60 ? 'text-emerald-400' : 'text-amber-400'} />
                  <StatBadge label="Silence" value={audio.silence_percent != null ? `${audio.silence_percent}%` : 'N/A'} />
                  <StatBadge label="Echo" value={audio.echo_detected ? 'Yes' : 'No'} color={audio.echo_detected ? 'text-rose-400' : 'text-emerald-400'} />
                  <StatBadge label="Clipping" value={audio.clipping_count} color={audio.clipping_count > 0 ? 'text-rose-400' : 'text-emerald-400'} />
                  <StatBadge label="Enhancement" value={audio.audio_enhancement_applied ? 'Applied' : 'None'} color={audio.audio_enhancement_applied ? 'text-emerald-400' : 'text-slate-400'} />
                  <StatBadge label="Est. SNR" value={audio.estimated_snr_db != null ? `${audio.estimated_snr_db} dB` : 'N/A'} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== SECTION 10: Transcription Diagnostics ===== */}
      <div className="rounded-xl border border-slate-800/60 overflow-hidden">
        <SectionHeader id="transcription" title="Transcription Diagnostics" icon={BrainCircuit} />
        <AnimatePresence>
          {expandedSections.transcription && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                  <CircularProgress value={transDiag.average_confidence * 100} size={70} label="Avg Confidence" />
                  <CircularProgress value={transDiag.speaker_detection_accuracy * 100} size={70} label="Speaker Detection" />
                  <div className="glass-panel p-3 rounded-xl border border-slate-800/60 flex flex-col justify-center">
                    <StatBadge label="Highest Conf" value={`${(transDiag.highest_confidence * 100).toFixed(0)}%`} color="text-emerald-400" />
                    <StatBadge label="Lowest Conf" value={`${(transDiag.lowest_confidence * 100).toFixed(0)}%`} color={transDiag.lowest_confidence < 0.5 ? 'text-rose-400' : 'text-amber-400'} />
                  </div>
                  <div className="glass-panel p-3 rounded-xl border border-slate-800/60 flex flex-col justify-center">
                    <StatBadge label="Speaker Changes" value={transDiag.total_speaker_changes} />
                    <StatBadge label="Unknown Words" value={transDiag.unknown_words} color={transDiag.unknown_words > 0 ? 'text-amber-400' : 'text-emerald-400'} />
                    <StatBadge label="Corrected Words" value={transDiag.corrected_words} />
                  </div>
                </div>
                {transDiag.low_confidence_regions.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Low Confidence Regions</h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {transDiag.low_confidence_regions.map((r: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-1.5 bg-rose-500/5 rounded-lg text-xs">
                          <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="text-slate-400 text-[10px]">{r.timestamp}</span>
                          <span className="text-slate-300 flex-1 truncate">{r.text}</span>
                          <ConfidenceBadge value={r.confidence} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== SECTION 11: Processing Pipeline ===== */}
      <div className="rounded-xl border border-slate-800/60 overflow-hidden">
        <SectionHeader id="pipeline" title="Processing Pipeline" icon={Layers} />
        <AnimatePresence>
          {expandedSections.pipeline && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 pt-2">
                <div className="space-y-2">
                  {pipeline.stages.map((stage: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-900/30 rounded-lg">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        stage.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        stage.status === 'running' ? 'bg-sky-500/10 text-sky-400' :
                        'bg-slate-800/50 text-slate-500'
                      }`}>
                        {stage.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                         stage.status === 'running' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                         <Square className="w-3 h-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${stage.status === 'completed' ? 'text-white' : 'text-slate-500'}`}>
                            {stage.name}
                          </span>
                          {stage.duration_ms != null && (
                            <span className="text-[10px] text-slate-500">{(stage.duration_ms / 1000).toFixed(1)}s</span>
                          )}
                        </div>
                      </div>
                      {stage.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== SECTION 12: AI Meeting Health ===== */}
      <div className="rounded-xl border border-slate-800/60 overflow-hidden">
        <SectionHeader id="health" title="AI Meeting Health" icon={Shield} />
        <AnimatePresence>
          {expandedSections.health && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 pt-2">
                <div className="flex flex-wrap gap-4 mb-4 justify-center">
                  <CircularProgress value={health.overall_score} size={90} label="Overall" />
                  <CircularProgress value={health.transcript_quality} size={70} label="Transcript" />
                  <CircularProgress value={health.audio_quality} size={70} label="Audio" />
                  <CircularProgress value={health.speaker_detection_quality} size={70} label="Speaker Detection" />
                  <CircularProgress value={health.productivity_score} size={70} label="Productivity" />
                  <CircularProgress value={health.meeting_effectiveness} size={70} label="Effectiveness" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                  <StatBadge label="Meeting Completeness" value={`${health.meeting_completeness.toFixed(0)}%`} color={scoreColor(health.meeting_completeness)} />
                  <StatBadge label="Confidence Score" value={`${health.confidence_score.toFixed(0)}%`} color={scoreColor(health.confidence_score)} />
                  <StatBadge label="AI Reliability" value={`${health.ai_reliability.toFixed(0)}%`} color={scoreColor(health.ai_reliability)} />
                </div>

                {health.recommendations.length > 0 && (
                  <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Recommendations</h3>
                    <div className="space-y-1">
                      {health.recommendations.map((r: string, i: number) => {
                        const isGood = r.startsWith('✓') || r.toLowerCase().includes('excellent') || r.toLowerCase().includes('successfully') || r.toLowerCase().includes('reliable');
                        const isWarn = r.startsWith('⚠');
                        return (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className={`shrink-0 mt-0.5 ${isGood ? 'text-emerald-400' : isWarn ? 'text-amber-400' : 'text-sky-400'}`}>
                              {isGood ? '✓' : isWarn ? '⚠' : '•'}
                            </span>
                            <span className="text-slate-300">{r}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== SECTION 13: Smart Insights ===== */}
      <div className="rounded-xl border border-slate-800/60 overflow-hidden">
        <SectionHeader id="insights" title="Smart Insights" icon={Lightbulb} />
        <AnimatePresence>
          {expandedSections.insights && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="p-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {insights.most_active_speaker && (
                    <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Most Active</span>
                      </div>
                      <span className="text-sm font-bold text-white">{insights.most_active_speaker}</span>
                    </div>
                  )}
                  {insights.least_active_speaker && (
                    <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Least Active</span>
                      </div>
                      <span className="text-sm font-bold text-white">{insights.least_active_speaker}</span>
                    </div>
                  )}
                  {insights.most_technical_speaker && (
                    <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Most Technical</span>
                      </div>
                      <span className="text-sm font-bold text-white">{insights.most_technical_speaker}</span>
                    </div>
                  )}
                  {insights.most_mentioned_topic && (
                    <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Top Topic</span>
                      </div>
                      <span className="text-sm font-bold text-white">{insights.most_mentioned_topic}</span>
                    </div>
                  )}
                  {insights.most_mentioned_technology && (
                    <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-2 mb-1">
                        <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Top Technology</span>
                      </div>
                      <span className="text-sm font-bold text-white">{insights.most_mentioned_technology}</span>
                    </div>
                  )}
                  {insights.most_questions_asked && (
                    <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-2 mb-1">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Most Questions</span>
                      </div>
                      <span className="text-sm font-bold text-white">{insights.most_questions_asked}</span>
                    </div>
                  )}
                  {insights.most_decisions_made && (
                    <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-2 mb-1">
                        <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Most Decisions</span>
                      </div>
                      <span className="text-sm font-bold text-white">{insights.most_decisions_made}</span>
                    </div>
                  )}
                  {insights.most_tasks_assigned && (
                    <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-2 mb-1">
                        <ListChecks className="w-3.5 h-3.5 text-sky-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Most Tasks</span>
                      </div>
                      <span className="text-sm font-bold text-white">{insights.most_tasks_assigned}</span>
                    </div>
                  )}
                  {insights.estimated_meeting_productivity && (
                    <div className="glass-panel p-3 rounded-xl border border-slate-800/60">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Productivity</span>
                      </div>
                      <span className="text-sm font-bold text-white">{insights.estimated_meeting_productivity}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== SECTION 14: Export ===== */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-bold text-white">Export Statistics</span>
          <span className="text-[10px] text-slate-500">JSON, TXT</span>
        </div>
        <div className="flex gap-2">
          {['json', 'txt'].map(fmt => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" />
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Last updated */}
      <div className="text-center text-[10px] text-slate-600 pb-4">
        Last updated: {new Date().toLocaleTimeString()} &middot;
        <button onClick={fetchStats} className="ml-1 text-sky-400 hover:text-sky-300 underline">Refresh</button>
      </div>
    </div>
  );
};
