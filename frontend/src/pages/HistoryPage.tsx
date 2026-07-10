import React, { useState, useRef, useEffect } from "react";
import {
  History, Search, Trash2, Eye, Clock, Edit3, Check, X,
  Play, Pause, Volume2, VolumeX, XCircle, Database, Activity,
  LayoutGrid, List, ArrowUpDown, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Meeting } from "../types";
import { api } from "../services/api";

interface HistoryPageProps {
  meetings: Meeting[];
  onSelectMeeting: (meeting: Meeting) => void;
  setActivePage: (page: string) => void;
  refreshMeetings: () => Promise<void>;
}

type FilterTag = "all" | "short" | "long" | "today";
type SortKey   = "date_desc" | "date_asc" | "duration_desc" | "duration_asc" | "name_asc";
type ViewMode  = "grid" | "list";

/* ─── Animated Waveform ─────────────────────────────── */
const WaveformBars: React.FC<{ playing: boolean; color: string }> = ({ playing, color }) => (
  <div className="waveform-bars" style={{ "--wave-color": color } as React.CSSProperties}>
    {Array.from({ length: 18 }).map((_, i) => (
      <div key={i}
        className={`waveform-bar ${playing ? "waveform-bar--active" : ""}`}
        style={{ animationDelay: `${(i * 0.08) % 1}s` }} />
    ))}
  </div>
);

/* ─── Duration color meta ───────────────────────────── */
const getDurationMeta = (seconds?: number) => {
  const m = seconds ? seconds / 60 : 0;
  if (m === 0)  return { label: "0m",            color: "#64748b", glow: "rgba(100,116,139,0.3)", wave: "#64748b" };
  if (m < 5)    return { label: `${m.toFixed(1)}m`, color: "#34d399", glow: "rgba(52,211,153,0.35)", wave: "#34d399" };
  if (m < 15)   return { label: `${m.toFixed(1)}m`, color: "#38bdf8", glow: "rgba(56,189,248,0.35)", wave: "#38bdf8" };
  return               { label: `${m.toFixed(1)}m`, color: "#fbbf24", glow: "rgba(251,191,36,0.35)",  wave: "#fbbf24" };
};

/* ─── Skeleton card ─────────────────────────────────── */
const SkeletonCard: React.FC<{ index: number }> = ({ index }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    transition={{ delay: index * 0.04 }}
    className="skeleton-card">
    <div className="skeleton-img" />
    <div className="skeleton-line w-3/4 mt-3" />
    <div className="skeleton-line w-1/2 mt-2" />
    <div className="skeleton-footer" />
  </motion.div>
);

/* ─── Sort options ───────────────────────────────────── */
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc",     label: "Newest first"   },
  { value: "date_asc",      label: "Oldest first"   },
  { value: "duration_desc", label: "Longest first"  },
  { value: "duration_asc",  label: "Shortest first" },
  { value: "name_asc",      label: "Name A → Z"     },
];

/* ═══════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════ */
export const HistoryPage: React.FC<HistoryPageProps> = ({
  meetings, onSelectMeeting, setActivePage, refreshMeetings,
}) => {
  const [searchQuery,   setSearchQuery]   = useState("");
  const [activeFilter,  setActiveFilter]  = useState<FilterTag>("all");
  const [sortKey,       setSortKey]       = useState<SortKey>("date_desc");
  const [viewMode,      setViewMode]      = useState<ViewMode>("grid");
  const [sortOpen,      setSortOpen]      = useState(false);
  const [loading]                         = useState(false);

  /* Audio player */
  const [playingMeeting, setPlayingMeeting] = useState<Meeting | null>(null);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [currentTime,    setCurrentTime]    = useState(0);
  const [duration,       setDuration]       = useState(0);
  const [volume,         setVolume]         = useState(1);
  const [isMuted,        setIsMuted]        = useState(false);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement   | null>(null);

  /* Edit */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [saving,    setSaving]    = useState(false);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this meeting and all its data?")) return;
    try { await api.deleteMeeting(id); await refreshMeetings(); }
    catch { alert("Failed to delete."); }
  };

  const startEdit = (m: Meeting, e: React.MouseEvent) => {
    e.stopPropagation(); setEditingId(m.meeting_id); setEditTitle(m.title);
  };
  const saveEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (!res.ok) throw new Error();
      await refreshMeetings(); setEditingId(null);
    } catch { alert("Failed to rename."); }
    finally { setSaving(false); }
  };
  const cancelEdit = (e: React.MouseEvent) => { e.stopPropagation(); setEditingId(null); };

  const handlePlayCard = (m: Meeting, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingMeeting?.meeting_id === m.meeting_id) {
      if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
      else           { audioRef.current?.play().catch(console.error); setIsPlaying(true); }
      return;
    }
    setPlayingMeeting(m); setIsPlaying(true); setCurrentTime(0);
  };

  useEffect(() => {
    if (!playingMeeting) return;
    audioRef.current?.pause();
    const audio = new Audio(`/api/meetings/${playingMeeting.meeting_id}/audio`);
    audioRef.current = audio;
    audio.volume = isMuted ? 0 : volume;
    const onTime  = () => setCurrentTime(audio.currentTime);
    const onMeta  = () => setDuration(audio.duration);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onPlay  = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.play().catch(() => setIsPlaying(false));
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
    };
  }, [playingMeeting]);

  const toggleMute = () => { if (audioRef.current) { audioRef.current.muted = !isMuted; setIsMuted(p => !p); } };
  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value); setVolume(v);
    if (audioRef.current) { audioRef.current.volume = v; audioRef.current.muted = v === 0; setIsMuted(v === 0); }
  };
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const t = ((e.clientX - rect.left) / rect.width) * duration;
    audioRef.current.currentTime = t; setCurrentTime(t);
  };
  const fmtTime = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  /* Filtering + Sorting */
  const filtered = meetings
    .filter(m => {
      const q = m.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!q) return false;
      if (activeFilter === "all") return true;
      const mins = (m.duration ?? 0) / 60;
      if (activeFilter === "short") return mins < 5;
      if (activeFilter === "long")  return mins > 15;
      if (activeFilter === "today") return new Date(m.date).toDateString() === new Date().toDateString();
      return true;
    })
    .sort((a, b) => {
      if (sortKey === "date_desc")     return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortKey === "date_asc")      return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortKey === "duration_desc") return (b.duration ?? 0) - (a.duration ?? 0);
      if (sortKey === "duration_asc")  return (a.duration ?? 0) - (b.duration ?? 0);
      if (sortKey === "name_asc")      return a.title.localeCompare(b.title);
      return 0;
    });

  /* Stats */
  const totalMin = meetings.reduce((s, m) => s + (m.duration ?? 0) / 60, 0);
  const avgMin   = meetings.length ? totalMin / meetings.length : 0;
  const currentSort = SORT_OPTIONS.find(o => o.value === sortKey)!;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-8 space-y-7 h-screen pb-32 relative">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-sky-400" />
          Meeting Intelligence Registry
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review, rename, manage, and delete previous recordings and intelligence records.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "Logged Records",  value: String(meetings.length),         icon: <Database className="w-6 h-6" />, accent: "indigo" },
          { label: "Audio Processed", value: totalMin < 60 ? `${totalMin.toFixed(1)}m` : `${(totalMin / 60).toFixed(1)}h`,
                                                                              icon: <Clock    className="w-6 h-6" />, accent: "emerald" },
          { label: "Average Length",  value: `${avgMin.toFixed(1)}m`,          icon: <Activity className="w-6 h-6" />, accent: "sky" },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            className="glass-panel p-6 rounded-2xl flex items-center justify-between shadow-xl card-elevation">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{s.label}</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">{s.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border
              ${s.accent === "indigo"  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"  : ""}
              ${s.accent === "emerald" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : ""}
              ${s.accent === "sky"     ? "bg-sky-500/10 text-sky-400 border-sky-500/20"              : ""}`}>
              {s.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        {/* Search */}
        <div className="search-bar-container">
          <Search className="search-bar-icon" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search registry by title..." className="search-bar-input" />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {(["all", "short", "long", "today"] as FilterTag[]).map(tag => (
              <button key={tag} onClick={() => setActiveFilter(tag)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeFilter === tag
                    ? "bg-sky-500 text-slate-950 border-sky-400 shadow-lg shadow-sky-500/10"
                    : "bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-white hover:border-slate-700"
                }`}>
                {tag === "all" ? "All" : tag === "short" ? "Short (<5m)" : tag === "long" ? "Long (>15m)" : "Today"}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button onClick={() => setSortOpen(p => !p)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all">
              <ArrowUpDown className="w-3.5 h-3.5" />
              {currentSort.label}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-10 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden min-w-[160px]">
                  {SORT_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => { setSortKey(o.value); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors hover:bg-slate-800 ${
                        sortKey === o.value ? "text-sky-400" : "text-slate-400"
                      }`}>
                      {o.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Grid / List toggle */}
          <div className="flex bg-slate-900/60 border border-slate-800 rounded-xl p-1 gap-1">
            <button onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-sky-500 text-slate-950" : "text-slate-500 hover:text-white"}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-sky-500 text-slate-950" : "text-slate-500 hover:text-white"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Count label */}
      <p className="text-xs text-slate-600 font-semibold -mt-4">
        {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Cards */}
      <div className="w-full">
        {loading ? (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            : "flex flex-col gap-3"}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="py-24 flex flex-col items-center gap-4 text-center bg-slate-900/30 border border-slate-800/50 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Database className="w-8 h-8 text-slate-700" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">No records found</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-xs">
                {searchQuery ? `No meetings match "${searchQuery}"` : "Upload or record your first audio to get started."}
              </p>
            </div>
            <button onClick={() => setActivePage("dashboard")}
              className="mt-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-sm transition-all">
              Go to Dashboard
            </button>
          </motion.div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((meeting, index) => {
              const meta = getDurationMeta(meeting.duration);
              const isThisPlaying = playingMeeting?.meeting_id === meeting.meeting_id && isPlaying;
              return (
                <motion.div key={meeting.meeting_id}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.32, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => { onSelectMeeting(meeting); setActivePage("transcript"); }}
                  className="card flex flex-col cursor-pointer group">
                  <div className="card__shine" />
                  <div className="card__glow" />
                  <div className="card__content">

                    {/* Color-coded duration badge */}
                    <div className="card__badge"
                      style={{ background: meta.color, color: "#0f172a", boxShadow: `0 0 10px ${meta.glow}` }}>
                      {meta.label}
                    </div>

                    {/* Waveform thumbnail */}
                    <div onClick={e => handlePlayCard(meeting, e)}
                      className="card__image flex items-center justify-center cursor-pointer overflow-hidden relative"
                      style={{ background: `linear-gradient(135deg, ${meta.color}18, ${meta.color}06)`, border: `1px solid ${meta.color}22` }}>
                      <WaveformBars playing={isThisPlaying} color={meta.wave} />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/45 transition-all rounded-xl">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center"
                          style={{ background: meta.color, boxShadow: `0 0 22px ${meta.glow}` }}>
                          {isThisPlaying
                            ? <Pause className="w-5 h-5 fill-slate-950 text-slate-950" />
                            : <Play  className="w-5 h-5 fill-slate-950 text-slate-950 ml-0.5" />}
                        </div>
                      </div>
                    </div>

                    {/* Title + date */}
                    <div className="card__text">
                      {editingId === meeting.meeting_id ? (
                        <div className="flex items-center gap-1.5 w-full" onClick={e => e.stopPropagation()}>
                          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-sky-400 font-semibold" />
                          <button onClick={e => saveEdit(meeting.meeting_id, e)} disabled={saving}
                            className="p-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={cancelEdit} className="p-1 bg-slate-800 text-slate-400 rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <h4 className="card__title truncate text-sm" title={meeting.title}>{meeting.title}</h4>
                      )}
                      <p className="card__description mt-0.5 text-[10px]">
                        {new Date(meeting.date).toLocaleDateString()} · {new Date(meeting.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {meeting.transcript && meeting.transcript.length > 0 && (
                        <span className="inline-flex items-center mt-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-500 border border-slate-700/50">
                          {meeting.transcript.reduce((s, seg) => s + seg.text.split(" ").length, 0).toLocaleString()} words
                        </span>
                      )}
                    </div>

                    {/* Hover-reveal action bar */}
                    <div className="card__footer translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200"
                      onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {editingId !== meeting.meeting_id && (
                          <button onClick={e => startEdit(meeting, e)}
                            className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors" title="Rename">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={e => handleDelete(meeting.meeting_id, e)}
                          className="p-1.5 bg-slate-900 border border-slate-800 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button onClick={() => { onSelectMeeting(meeting); setActivePage("transcript"); }}
                        className="card__button" title="View Transcript">
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="flex flex-col gap-2">
            {filtered.map((meeting, index) => {
              const meta = getDurationMeta(meeting.duration);
              const isThisPlaying = playingMeeting?.meeting_id === meeting.meeting_id && isPlaying;
              return (
                <motion.div key={meeting.meeting_id}
                  initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.28, delay: index * 0.04 }}
                  onClick={() => { onSelectMeeting(meeting); setActivePage("transcript"); }}
                  className="group flex items-center gap-4 px-5 py-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/60 hover:border-slate-700 rounded-2xl cursor-pointer transition-all">

                  <button onClick={e => handlePlayCard(meeting, e)}
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                    style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}40` }}>
                    {isThisPlaying
                      ? <Pause className="w-4 h-4" style={{ color: meta.color }} />
                      : <Play  className="w-4 h-4 ml-0.5" style={{ color: meta.color }} />}
                  </button>

                  <div className="hidden sm:flex items-center w-24 h-8 overflow-hidden">
                    <WaveformBars playing={isThisPlaying} color={meta.wave} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{meeting.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(meeting.date).toLocaleDateString()} · {new Date(meeting.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                    {meta.label}
                  </span>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
                    <button onClick={e => startEdit(meeting, e)}
                      className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={e => handleDelete(meeting.meeting_id, e)}
                      className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { onSelectMeeting(meeting); setActivePage("transcript"); }}
                      className="p-1.5 hover:bg-sky-500/10 text-slate-500 hover:text-sky-400 rounded-lg transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Audio Dock */}
      <AnimatePresence>
        {playingMeeting && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl bg-slate-900/90 backdrop-blur-md border border-[#38bdf8]/20 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-2xl z-50"
          >
            <div className="flex items-center gap-3.5 w-full md:w-auto">
              <button
                onClick={() => {
                  if (isPlaying) {
                    audioRef.current?.pause();
                  } else {
                    audioRef.current?.play().catch(console.error);
                  }
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 hover:brightness-110 text-white flex items-center justify-center transition-all shadow-lg shadow-sky-500/20"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white text-white" /> : <Play className="w-4 h-4 fill-white text-white ml-0.5" />}
              </button>
              <div className="min-w-0 max-w-[200px]">
                <h4 className="text-xs font-bold text-white truncate">{playingMeeting.title}</h4>
                <p className="text-[10px] text-slate-500">Offline Playback</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 w-full">
              <span className="text-[10px] font-mono font-bold text-slate-400">{fmtTime(currentTime)}</span>
              <div
                ref={progressRef}
                onClick={handleSeek}
                className="flex-1 h-2 bg-slate-950 border border-slate-800 rounded-full cursor-pointer relative group overflow-hidden"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#38bdf8] to-[#8b5cf6] rounded-full relative transition-all"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">{fmtTime(duration || 0)}</span>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolume}
                  className="w-20 accent-sky-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>
              <button
                onClick={() => {
                  setPlayingMeeting(null);
                  setIsPlaying(false);
                }}
                className="text-slate-500 hover:text-rose-500 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
