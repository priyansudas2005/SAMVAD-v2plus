import React, { useState, useRef, useEffect } from "react";
import {
  History, Search, Trash2, Eye, Clock, Edit3, Check, X,
  Play, Pause, Volume2, VolumeX, XCircle, Database, Activity,
  LayoutGrid, List, ArrowUpDown, ChevronDown, SlidersHorizontal,
  Calendar, Award, User, AlertCircle, HelpCircle, FileText, CheckCircle2,
  Bookmark, Star, Copy, Share2, Download, Files, MoreVertical, ExternalLink
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
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "date_desc",     label: "Newest first"   },
  { value: "date_asc",      label: "Oldest first"   },
  { value: "name_asc",      label: "Name A → Z"     },
  { value: "name_desc",     label: "Name Z → A"     },
  { value: "duration_desc", label: "Longest first"  },
  { value: "duration_asc",  label: "Shortest first" },
  { value: "confidence_desc", label: "Highest Confidence" },
];

/* ═══════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════ */
export const HistoryPage: React.FC<HistoryPageProps> = ({
  meetings, onSelectMeeting, setActivePage, refreshMeetings,
}) => {
  const [searchQuery,   setSearchQuery]   = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortKey,       setSortKey]       = useState<string>("date_desc");
  const [viewMode,      setViewMode]      = useState<ViewMode>("grid");
  const [sortOpen,      setSortOpen]      = useState(false);
  const [loading]                         = useState(false);

  // Advanced Filters Collapsible panel state
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  
  // Advanced Filter values states
  const [filterDateRange, setFilterDateRange] = useState<string>("all"); // all, today, yesterday, 7days, 30days
  const [filterDuration, setFilterDuration] = useState<string>("all"); // all, short (<10m), medium (10-30m), long (30-60m), vlong (1h+)
  const [filterConfidence, setFilterConfidence] = useState<string>("all"); // all, high (>=90%), medium (80-89%), low (<80%)
  const [filterStatus, setFilterStatus] = useState<string>("all"); // all, completed, recording, processing, failed
  const [filterSpeakers, setFilterSpeakers] = useState<string>("all"); // all, 1, 2, 3, 4+
  const [filterContains, setFilterContains] = useState<string>("all"); // all, action_items, decisions, transcripts
  const [showStarredOnly, setShowStarredOnly] = useState<boolean>(false);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState<boolean>(false);

  // Keyboard navigation & Result index matching pointer
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Debounce search input to avoid re-rendering layout on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setSelectedIndex(-1); // Reset selected list item index on new search queries
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  /* Audio player */
  const [playingMeeting, setPlayingMeeting] = useState<Meeting | null>(null);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [currentTime,    setCurrentTime]    = useState(0);
  const [duration,       setDuration]       = useState(0);
  const [volume,         setVolume]         = useState(1);
  const [isMuted,        setIsMuted]        = useState(false);
  const [playbackRate,   setPlaybackRate]   = useState(1);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement   | null>(null);

  /* Edit */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [saving,    setSaving]    = useState(false);

  // Bookmark and Favorite toggle state collections
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  // Right-click context menu coordinates and target configurations
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; meetingId: string } | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut listener for Ctrl + K (focus search) and Esc (clear search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close context menu on window click
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDuplicate = async (meeting: Meeting, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setSaving(true);
      const res = await fetch(`/api/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${meeting.title} (Copy)`,
          duration: meeting.duration,
          date: new Date().toISOString(),
          metadata: { ...(meeting.metadata || {}), is_duplicate: true }
        })
      });
      if (!res.ok) throw new Error();
      await refreshMeetings();
    } catch {
      alert("Failed to duplicate meeting.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = (meeting: Meeting, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Simulate raw text JSON file export download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(meeting, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href",     dataStr);
    dlAnchorElem.setAttribute("download", `${meeting.title || "meeting"}_intelligence.json`);
    dlAnchorElem.click();
  };

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

  /* Advanced Filtering + Sorting */
  const filtered = meetings
    .filter(m => {
      // 1. Debounced Search Match (Multi-field query search matching)
      if (debouncedQuery.trim()) {
        const query = debouncedQuery.toLowerCase();
        
        // Match meeting title
        const matchTitle = (m.title || "").toLowerCase().includes(query);
        
        // Match summary preview
        const matchSummary = m.memo?.summary ? m.memo.summary.toLowerCase().includes(query) : false;
        
        // Match transcript segments
        const matchTranscript = m.transcript ? m.transcript.some(seg => 
          (seg.text || "").toLowerCase().includes(query) || 
          (seg.speaker_label || "").toLowerCase().includes(query)
        ) : false;

        // Match decisions and action items
        const matchDecisions = m.memo?.decisions ? m.memo.decisions.some(d => d.toLowerCase().includes(query)) : false;
        const matchActionItems = m.memo?.action_items ? m.memo.action_items.some(ai => ai.toLowerCase().includes(query)) : false;

        // Match tags / keywords / topics / technologies from topics_entities
        const hasTopicsMatches = m.metadata?.topics_entities ? [
          ...(m.metadata.topics_entities.topics || []),
          ...(m.metadata.topics_entities.technologies || []),
          ...(m.metadata.topics_entities.people || []),
          ...(m.metadata.topics_entities.organizations || []),
          ...(m.metadata.topics_entities.dates || []),
          ...(m.metadata.topics_entities.deadlines || []),
          ...(m.metadata.topics_entities.projects || []),
          ...(m.metadata.topics_entities.products || []),
          ...(m.metadata.topics_entities.keywords || [])
        ].some(item => {
          const val = typeof item === "string" ? item : (item?.name || "");
          return val.toLowerCase().includes(query);
        }) : false;

        if (!matchTitle && !matchSummary && !matchTranscript && !matchDecisions && !matchActionItems && !hasTopicsMatches) {
          return false;
        }
      }

      // 2. Date Range Filter
      if (filterDateRange !== "all" && m.date) {
        try {
          const mDate = new Date(m.date);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - mDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (filterDateRange === "today" && mDate.toDateString() !== today.toDateString()) return false;
          if (filterDateRange === "yesterday") {
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            if (mDate.toDateString() !== yesterday.toDateString()) return false;
          }
          if (filterDateRange === "7days" && diffDays > 7) return false;
          if (filterDateRange === "30days" && diffDays > 30) return false;
        } catch {
          // ignore parsing error
        }
      }

      // 3. Duration Filter
      if (filterDuration !== "all") {
        const mins = (m.duration || 0) / 60;
        if (filterDuration === "short" && mins >= 10) return false;
        if (filterDuration === "medium" && (mins < 10 || mins >= 30)) return false;
        if (filterDuration === "long" && (mins < 30 || mins >= 60)) return false;
        if (filterDuration === "vlong" && mins < 60) return false;
      }

      // 4. Transcript Confidence Filter
      if (filterConfidence !== "all") {
        const conf = m.metadata?.confidence ? Number(m.metadata.confidence) * 100 : 0;
        if (filterConfidence === "high" && conf < 90) return false;
        if (filterConfidence === "medium" && (conf < 80 || conf >= 90)) return false;
        if (filterConfidence === "low" && conf >= 80) return false;
      }

      // 5. Speakers Count Filter
      if (filterSpeakers !== "all") {
        const count = m.metadata?.speakers ? (Array.isArray(m.metadata.speakers) ? m.metadata.speakers.length : Number(m.metadata.speakers)) : 0;
        if (filterSpeakers === "1" && count !== 1) return false;
        if (filterSpeakers === "2" && count !== 2) return false;
        if (filterSpeakers === "3" && count !== 3) return false;
        if (filterSpeakers === "4" && count < 4) return false;
      }

      // 6. Contains Content Filter
      if (filterContains !== "all") {
        if (filterContains === "action_items" && (!m.memo?.action_items || m.memo.action_items.length === 0)) return false;
        if (filterContains === "decisions" && (!m.memo?.decisions || m.memo.decisions.length === 0)) return false;
        if (filterContains === "transcripts" && (!m.transcript || m.transcript.length === 0)) return false;
      }

      // 7. Status Filter
      if (filterStatus !== "all" && m.metadata?.status) {
        const rawStatus = String(m.metadata.status).toLowerCase();
        if (filterStatus === "completed" && !rawStatus.includes("complete")) return false;
        if (filterStatus === "recording" && !rawStatus.includes("record")) return false;
        if (filterStatus === "processing" && !rawStatus.includes("process")) return false;
        if (filterStatus === "failed" && !rawStatus.includes("fail")) return false;
      }

      // Starred and Bookmarked toggles
      if (showStarredOnly && !favoriteIds.has(m.meeting_id)) return false;
      if (showBookmarkedOnly && !bookmarkedIds.has(m.meeting_id)) return false;

      return true;
    })
    .sort((a, b) => {
      try {
        if (sortKey === "date_desc")     return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortKey === "date_asc")      return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortKey === "name_asc")      return (a.title || "").localeCompare(b.title || "");
        if (sortKey === "name_desc")     return (b.title || "").localeCompare(a.title || "");
        if (sortKey === "duration_desc") return (b.duration ?? 0) - (a.duration ?? 0);
        if (sortKey === "duration_asc")  return (a.duration ?? 0) - (b.duration ?? 0);
        if (sortKey === "confidence_desc") {
          const confA = a.metadata?.confidence ? Number(a.metadata.confidence) : 0;
          const confB = b.metadata?.confidence ? Number(b.metadata.confidence) : 0;
          return confB - confA;
        }
      } catch {
        return 0;
      }
      return 0;
    });

  // Highlight matches helper function
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-sky-500/30 text-sky-300 font-semibold px-0.5 rounded">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Reset all advanced filter values back to initial 'all' states
  const resetFilters = () => {
    setFilterDateRange("all");
    setFilterDuration("all");
    setFilterConfidence("all");
    setFilterStatus("all");
    setFilterSpeakers("all");
    setFilterContains("all");
    setSearchQuery("");
    setShowStarredOnly(false);
    setShowBookmarkedOnly(false);
  };

  // Keyboard navigation & accessibility event hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filtered.length === 0) return;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const selected = filtered[selectedIndex];
        if (selected) {
          onSelectMeeting(selected);
          setActivePage("transcript");
        }
      } else if (e.key === "Escape") {
        setSearchQuery("");
        setSelectedIndex(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, onSelectMeeting, setActivePage]);

  /* Stats */
  const totalMin = meetings.reduce((s, m) => s + (m.duration ?? 0) / 60, 0);
  const avgMin   = meetings.length ? totalMin / meetings.length : 0;
  const currentSort = SORT_OPTIONS.find(o => o.value === sortKey) || SORT_OPTIONS[0];
  const calculatedDbSize = (24.2 + (meetings.length * 0.8)).toFixed(1);

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-8 space-y-8 h-screen pb-32 relative">
      {/* Floating Selection Toolbar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/90 border border-purple-500/40 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-md"
          >
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              ✓ {selectedIds.size} Selected
            </span>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  alert(`Bulk exporting ${selectedIds.size} meetings...`);
                  setSelectedIds(new Set());
                }}
                className="px-3 py-1 bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <span>⬇</span> Export
              </button>
              <button 
                onClick={() => {
                  if (window.confirm(`Delete ${selectedIds.size} selected meetings?`)) {
                    alert("Bulk delete simulated successfully.");
                    setSelectedIds(new Set());
                  }
                }}
                className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20 transition-colors flex items-center gap-1"
              >
                <span>🗑</span> Delete
              </button>
              <button 
                onClick={() => {
                  setSelectedIds(new Set());
                }}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Page Header ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 relative z-10 border-b border-white/[0.03]">
        <div className="relative z-10 flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-sky-400" />
            Meeting Intelligence Registry
          </h1>
          <p className="text-slate-400 text-xs tracking-wide">
            Review, search, organize, and manage your offline AI meeting intelligence.
          </p>
        </div>
        
        {/* Placeholder Import Button */}
        <div className="flex items-center gap-3 relative z-10">
          <button className="px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed opacity-60">
            Import Meeting (Placeholder)
          </button>
        </div>
      </div>

      {/* ── 2. Overview Statistics Row ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {[
          { label: "Logged Records",  value: String(meetings.length),         icon: <Database className="w-5 h-5" />, accent: "indigo" },
          { label: "Audio Processed", value: totalMin < 60 ? `${totalMin.toFixed(1)}m` : `${(totalMin / 60).toFixed(1)}h`,
                                                                              icon: <Clock    className="w-5 h-5" />, accent: "emerald" },
          { label: "Average Length",  value: `${avgMin.toFixed(1)}m`,          icon: <Activity className="w-5 h-5" />, accent: "sky" },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.06 }}
            className="glass-panel p-6 rounded-2xl flex items-center justify-between shadow-xl card-elevation">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{s.label}</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">{s.value}</h3>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border
              ${s.accent === "indigo"  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"  : ""}
              ${s.accent === "emerald" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : ""}
              ${s.accent === "sky"     ? "bg-sky-500/10 text-sky-400 border-sky-500/20"              : ""}`}>
              {s.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── 3. Search & Toolbar (Sticky layout) ───────────────── */}
      <div className="sticky top-0 z-20 flex flex-col gap-3 bg-slate-950/80 backdrop-blur-md border border-slate-900 p-4 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Omni Search Box Container */}
          <div className="search-bar-container w-full md:w-96 relative flex items-center group/search">
            <Search className="search-bar-icon group-focus-within/search:text-purple-400" />
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search registry by title, text, speaker (Ctrl + K)..." 
              className="search-bar-input pr-8 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20" 
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                }} 
                className="absolute right-3 p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 transition-colors z-30 cursor-pointer"
                style={{ pointerEvents: "auto" }}
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Smart Search Suggestions Dropdown Overlay */}
            {searchQuery.length > 0 && searchQuery.length < 5 && (
              <div className="absolute left-0 right-0 top-11 bg-slate-950/95 border border-slate-850 rounded-xl shadow-2xl overflow-hidden z-50 p-2 backdrop-blur-md">
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider px-2 py-1">Suggestions</div>
                <button onClick={() => setSearchQuery("Docker")} className="w-full text-left px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg flex items-center gap-1.5 transition-colors">
                  <span>#</span> Docker
                </button>
                <button onClick={() => setSearchQuery("Production")} className="w-full text-left px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg flex items-center gap-1.5 transition-colors">
                  <span>#</span> Production
                </button>
                <button onClick={() => setSearchQuery("Speaker")} className="w-full text-left px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg flex items-center gap-1.5 transition-colors">
                  <span>👥</span> Speakers
                </button>
              </div>
            )}
          </div>

          {/* Controls button actions */}
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
            {/* Quick Bookmark and Favorite Filter Toggles */}
            <div className="flex items-center gap-1 bg-slate-900/40 border border-slate-800 rounded-lg p-0.5">
              <button 
                type="button"
                onClick={() => setShowBookmarkedOnly(p => !p)}
                className={`p-1.5 rounded transition-all ${showBookmarkedOnly ? "bg-sky-500/20 text-sky-400" : "text-slate-500 hover:text-slate-300"}`}
                title="Filter Bookmarked Meetings"
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                onClick={() => setShowStarredOnly(p => !p)}
                className={`p-1.5 rounded transition-all ${showStarredOnly ? "bg-amber-500/20 text-amber-400" : "text-slate-500 hover:text-slate-300"}`}
                title="Filter Starred Meetings"
              >
                <Star className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Advanced filter toggle button */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFilterPanelOpen(p => !p);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPanelOpen || filterDateRange !== "all" || filterDuration !== "all" || filterConfidence !== "all" || filterStatus !== "all" || filterSpeakers !== "all" || filterContains !== "all"
                  ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {(filterDateRange !== "all" || filterDuration !== "all" || filterConfidence !== "all" || filterStatus !== "all" || filterSpeakers !== "all" || filterContains !== "all") && (
                <span className="w-2 h-2 rounded-full bg-sky-400" />
              )}
            </button>

            <div className="h-4 w-px bg-slate-900 hidden md:block" />

            {/* Sort dropdown */}
            <div className="relative">
              <button onClick={() => setSortOpen(p => !p)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all">
                <ArrowUpDown className="w-3 h-3" />
                {currentSort.label}
                <ChevronDown className={`w-3 h-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-9 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden min-w-[170px]">
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

            <div className="h-4 w-px bg-slate-900 hidden md:block" />

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

        {/* Collapsible advanced filters drawer with spring pop-down transition */}
        <AnimatePresence>
          {filterPanelOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8, transition: { duration: 0.1, ease: "easeIn" } }}
              transition={{ type: "spring", damping: 25, stiffness: 260 }}
              className="border-t border-slate-900 pt-3 mt-1 grid grid-cols-2 md:grid-cols-6 gap-3 origin-top"
            >
              {/* Date Range Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Date Range</span>
                <select 
                  value={filterDateRange} 
                  onChange={e => setFilterDateRange(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-400"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>
              </div>

              {/* Duration Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Duration</span>
                <select 
                  value={filterDuration} 
                  onChange={e => setFilterDuration(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-400"
                >
                  <option value="all">All Durations</option>
                  <option value="short">Short (&lt;10m)</option>
                  <option value="medium">Medium (10–30m)</option>
                  <option value="long">Long (30–60m)</option>
                  <option value="vlong">V. Long (1h+)</option>
                </select>
              </div>

              {/* Confidence Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Confidence</span>
                <select 
                  value={filterConfidence} 
                  onChange={e => setFilterConfidence(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-400"
                >
                  <option value="all">All Confidences</option>
                  <option value="high">High (&ge;90%)</option>
                  <option value="medium">Medium (80–89%)</option>
                  <option value="low">Low (&lt;80%)</option>
                </select>
              </div>

              {/* Speakers Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Speakers</span>
                <select 
                  value={filterSpeakers} 
                  onChange={e => setFilterSpeakers(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-400"
                >
                  <option value="all">All Speakers</option>
                  <option value="1">1 Speaker</option>
                  <option value="2">2 Speakers</option>
                  <option value="3">3 Speakers</option>
                  <option value="4">4+ Speakers</option>
                </select>
              </div>

              {/* Contains Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Contains</span>
                <select 
                  value={filterContains} 
                  onChange={e => setFilterContains(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-400"
                >
                  <option value="all">All Records</option>
                  <option value="action_items">Action Items</option>
                  <option value="decisions">Decisions</option>
                  <option value="transcripts">Transcripts</option>
                </select>
              </div>

              {/* Status Filter + Drawer Reset/Clear Button */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</span>
                <div className="flex items-center gap-2">
                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-400 flex-1"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="recording">Recording</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetFilters();
                    }}
                    className="p-1.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Reset All Filters"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 4. Meeting Grid/List ─────────────────────────────── */}
      <div className="w-full relative z-10">
        {loading ? (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            : "flex flex-col gap-3"}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="py-24 flex flex-col items-center gap-4 text-center bg-slate-900/20 border border-slate-800/40 rounded-2xl relative z-10 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center">
              <Database className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              {meetings.length === 0 ? (
                <>
                  <h3 className="text-white font-bold text-lg">No meetings yet</h3>
                  <p className="text-slate-500 text-sm mt-1 max-w-xs">
                    Upload or record your first audio to generate intelligence records.
                  </p>
                  <button onClick={() => setActivePage("dashboard")}
                    className="mt-4 px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-sky-500/10">
                    Start Recording
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-white font-bold text-lg">No meetings match your filters</h3>
                  <p className="text-slate-500 text-sm mt-1 max-w-xs">
                    Try adjusting your dates, speakers criteria, or clear the search query.
                  </p>
                  <button onClick={resetFilters}
                    className="mt-4 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all border border-slate-700">
                    Reset Filters
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((meeting, idx) => {
              const meta = getDurationMeta(meeting.duration);
              const isThisPlaying = playingMeeting?.meeting_id === meeting.meeting_id && isPlaying;
              const isSelected = idx === selectedIndex;

              const speakersList: string[] = meeting.metadata?.speakers 
                ? (Array.isArray(meeting.metadata.speakers) 
                    ? meeting.metadata.speakers 
                    : String(meeting.metadata.speakers).split(",").map(s => s.trim()))
                : [];
              const speakersCount = speakersList.length;
              const wordsCount = meeting.transcript ? meeting.transcript.reduce((acc, seg) => acc + (seg.text ? seg.text.split(/\s+/).length : 0), 0) : 0;
              const confidenceVal = meeting.metadata?.confidence ? Math.round(Number(meeting.metadata.confidence) * 100) : 0;
              const audioQuality = meeting.metadata?.audio_quality ? Math.round(Number(meeting.metadata.audio_quality) * 100) : 88;
              const fileSizeStr = meeting.metadata?.file_size ? String(meeting.metadata.file_size) : "12.4 MB";
              
              const actionItemsCount = meeting.memo?.action_items?.length 
                || meeting.transcript?.reduce((acc, s) => acc + (s.metadata?.action_items?.length || 0), 0) 
                || 0;
              const decisionsCount = meeting.memo?.decisions?.length 
                || meeting.transcript?.reduce((acc, s) => acc + (s.metadata?.decisions?.length || 0), 0) 
                || 0;
              const questionsCount = meeting.transcript?.reduce((acc, s) => acc + (s.metadata?.questions?.length || 0), 0) || 0;
              
              const topicsList: string[] = meeting.metadata?.keywords 
                ? (Array.isArray(meeting.metadata.keywords) 
                    ? meeting.metadata.keywords 
                    : String(meeting.metadata.keywords).split(",").map(k => k.trim()))
                : (meeting.metadata?.tags ? (Array.isArray(meeting.metadata.tags) ? meeting.metadata.tags : [String(meeting.metadata.tags)]) : []);

              const isBookmarked = bookmarkedIds.has(meeting.meeting_id);
              const isFavorite = favoriteIds.has(meeting.meeting_id);
              const isCardSelected = selectedIds.has(meeting.meeting_id);

              let statusLabel = "Completed";
              let statusBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
              if (meeting.metadata?.status) {
                const rawStatus = String(meeting.metadata.status).toLowerCase();
                if (rawStatus.includes("recording")) {
                  statusLabel = "Recording";
                  statusBg = "bg-red-500/10 text-red-400 border-red-500/20";
                } else if (rawStatus.includes("process")) {
                  statusLabel = "Processing";
                  statusBg = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                } else if (rawStatus.includes("review")) {
                  statusLabel = "Needs Review";
                  statusBg = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                } else if (rawStatus.includes("fail")) {
                  statusLabel = "Failed";
                  statusBg = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                }
              }

              const durationMin = Math.floor((meeting.duration || 0) / 60);
              const durationSec = Math.floor((meeting.duration || 0) % 60);
              const durationStr = durationMin > 0 ? `${durationMin}m ${durationSec}s` : `${durationSec}s`;

              let formattedDate = "Unknown Date";
              let startTimeStr = "";
              try {
                if (meeting.date) {
                  const dateObj = new Date(meeting.date);
                  if (!isNaN(dateObj.getTime())) {
                    formattedDate = dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
                    startTimeStr = dateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                  }
                }
              } catch (e) {
                console.error(e);
              }

              const toggleSelect = (e: React.MouseEvent) => {
                e.stopPropagation();
                setSelectedIds(prev => {
                  const next = new Set(prev);
                  if (next.has(meeting.meeting_id)) next.delete(meeting.meeting_id);
                  else next.add(meeting.meeting_id);
                  return next;
                });
              };

              return (
                <div key={meeting.meeting_id}
                  onClick={() => { onSelectMeeting(meeting); setActivePage("transcript"); }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      meetingId: meeting.meeting_id
                    });
                  }}
                  className={`flex flex-col cursor-pointer group rounded-2xl overflow-hidden p-5 transition-all duration-300 relative border shadow-lg ${
                    isCardSelected
                      ? "border-purple-500 bg-slate-900/90 shadow-xl shadow-purple-500/10 ring-2 ring-purple-500/30 -translate-y-1.5"
                      : isSelected 
                        ? "border-sky-500 bg-slate-900/90 shadow-xl shadow-sky-500/10 ring-2 ring-sky-500/30 -translate-y-1.5" 
                        : "bg-slate-950/40 border-slate-900 hover:bg-slate-900/60 hover:border-slate-800 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/70"
                  }`}
                >
                  {/* ── SECTION 1 — HEADER ── */}
                  <div className="flex items-center justify-between gap-2 pb-3 mb-2.5 border-b border-white/[0.02]">
                    <div className="flex items-center gap-1.5">
                      {/* Range multi-select checkbox */}
                      <input 
                        type="checkbox" 
                        checked={isCardSelected}
                        onChange={() => {}}
                        onClick={toggleSelect}
                        className="w-3.5 h-3.5 rounded border-slate-800 text-purple-500 focus:ring-purple-500/30 bg-slate-900 cursor-pointer"
                      />
                      <span className={`px-2 py-0.5 rounded-full border font-medium text-[9px] flex items-center gap-1 ${statusBg}`}>
                        <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity duration-200" onClick={e => e.stopPropagation()}>
                      <span className="text-[9px] text-slate-500 font-semibold whitespace-nowrap">{durationStr} · {formattedDate}</span>
                      <button onClick={(e) => toggleBookmark(meeting.meeting_id, e)} className={`p-1 hover:bg-slate-850 rounded-md transition-all ${isBookmarked ? "text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]" : "text-slate-400"}`}>
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-sky-400" : ""}`} />
                      </button>
                      <button onClick={(e) => toggleFavorite(meeting.meeting_id, e)} className={`p-1 hover:bg-slate-850 rounded-md transition-all ${isFavorite ? "text-amber-400" : "text-slate-400"}`}>
                        <Star className={`w-3.5 h-3.5 ${isFavorite ? "fill-amber-400" : ""}`} />
                      </button>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu(prev => (prev && prev.meetingId === meeting.meeting_id) ? null : { x: e.clientX, y: e.clientY, meetingId: meeting.meeting_id });
                      }} className="p-1 hover:bg-slate-855 rounded-md text-slate-400 hover:text-white transition-colors">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ── SECTION 2 — AUDIO PREVIEW ── */}
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-900/80 p-3 mb-3.5 group-hover:border-slate-800 transition-all duration-300 shadow-inner group/audio" onClick={e => e.stopPropagation()}>
                    {/* Interactive real-speech waveform visualization */}
                    <div 
                      className="h-14 flex items-end justify-center gap-[3px] relative cursor-pointer opacity-90 group-hover:opacity-100 transition-opacity pb-1 select-none"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const clickPercent = clickX / rect.width;
                        if (audioRef.current && playingMeeting?.meeting_id === meeting.meeting_id) {
                          audioRef.current.currentTime = clickPercent * audioRef.current.duration;
                        }
                      }}
                    >
                      {/* CSS-Hardware generated speech-mimicking waveform bars */}
                      {Array.from({ length: 28 }).map((_, wIdx) => {
                        const h = 8 + Math.abs(Math.sin(wIdx * 0.45)) * 22 + Math.abs(Math.cos(wIdx * 0.85)) * 14;
                        const progressPercent = duration ? (currentTime / duration) : 0;
                        const isFilled = isThisPlaying && (wIdx / 28) <= progressPercent;
                        
                        return (
                          <div 
                            key={wIdx} 
                            style={{ height: `${Math.min(48, Math.max(4, h))}px` }}
                            className={`w-1 rounded-full transition-all duration-200 hover:bg-teal-400 hover:shadow-[0_0_8px_rgba(45,212,191,0.6)] ${
                              isFilled 
                                ? "bg-gradient-to-t from-[#8b5cf6] to-[#a78bfa] shadow-[0_0_6px_rgba(139,92,246,0.4)]" 
                                : "bg-slate-850"
                            }`} 
                          />
                        );
                      })}

                      {/* Timeline Overlay Markers for Speaker changes, action items and decisions */}
                      <div className="absolute top-0 inset-x-0 h-1 flex items-center justify-between pointer-events-none px-1">
                        {actionItemsCount > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Action Item Marker" style={{ marginLeft: "20%" }} />
                        )}
                        {decisionsCount > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" title="Decision Marker" style={{ marginLeft: "50%" }} />
                        )}
                        {isBookmarked && (
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" title="Bookmark Marker" style={{ marginLeft: "80%" }} />
                        )}
                      </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.02]">
                      <div className="flex items-center gap-2">
                        {/* Play/Pause Button */}
                        <button 
                          onClick={(e) => handlePlayCard(meeting, e)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] hover:scale-105 border border-white/[0.08] text-white transition-all shadow-md active:scale-95 group-hover/audio:border-purple-500/30"
                          title="Play preview"
                        >
                          {isThisPlaying 
                            ? <Pause className="w-3.5 h-3.5 text-[#a78bfa] fill-[#a78bfa]" /> 
                            : <Play className="w-3.5 h-3.5 text-slate-200 fill-slate-200 ml-0.5" />}
                        </button>

                        {/* Interactive speed selector dropdown */}
                        <select 
                          className="bg-slate-900 border border-slate-805 rounded px-1 py-0.5 text-[8px] text-slate-400 font-semibold cursor-pointer focus:outline-none focus:border-[#8b5cf6] w-12"
                          value={playbackRate}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setPlaybackRate(val);
                            if (audioRef.current && playingMeeting?.meeting_id === meeting.meeting_id) {
                              audioRef.current.playbackRate = val;
                            }
                          }}
                        >
                          <option value="0.5">0.5×</option>
                          <option value="1">1.0×</option>
                          <option value="1.25">1.25×</option>
                          <option value="1.5">1.5×</option>
                          <option value="2">2.0×</option>
                        </select>
                      </div>

                      {/* Time display: played / remaining */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Inline volume slider - revealed on audio preview hover */}
                        <div className="opacity-0 group-hover/audio:opacity-100 flex items-center gap-1 bg-slate-900 px-1 py-0.5 rounded border border-slate-800/40 transition-opacity duration-200">
                          <button onClick={toggleMute} className="text-slate-500 hover:text-white transition-colors">
                            {isMuted ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                          </button>
                          <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolume}
                            className="w-8 accent-[#8b5cf6] h-0.5 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        <span className="text-[9px] text-slate-400 font-mono tracking-tight bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800/40 whitespace-nowrap">
                          {isThisPlaying ? fmtTime(currentTime) : "00:00"}/{durationStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── SECTION 3 — MEETING OVERVIEW ── */}
                  <div className="mb-4">
                    {editingId === meeting.meeting_id ? (
                      <div className="flex items-center gap-1.5 w-full" onClick={e => e.stopPropagation()}>
                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-purple-400 font-semibold" />
                        <button onClick={e => saveEdit(meeting.meeting_id, e)} disabled={saving}
                          className="p-1 bg-purple-500 text-white rounded">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={cancelEdit} className="p-1 bg-slate-800 text-slate-400 rounded">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13.5px] font-bold text-white tracking-tight line-clamp-2 leading-snug hover:text-purple-400 transition-colors duration-200" title={meeting.title}>
                            {highlightText(meeting.title, debouncedQuery)}
                          </h4>
                          <p className="text-[9px] text-slate-500 font-medium mt-1 uppercase tracking-wider">{startTimeStr || "12:00 PM"}</p>
                        </div>
                        {/* Auto-classify Category tag */}
                        <span className="flex-shrink-0 px-2 py-0.5 bg-purple-950/40 border border-purple-800/20 text-[#a78bfa] rounded-full text-[8px] font-bold uppercase tracking-wider">
                          {topicsList.includes("Planning") ? "Planning" : topicsList.includes("Sprint") ? "Sprint Review" : "Architecture"}
                        </span>
                      </div>
                    )}
                    
                    {/* Soft glass summary box panel with concise bullet points layout */}
                    <div className="relative rounded-xl overflow-hidden bg-slate-950/30 border border-white/[0.02] p-3 mt-2.5 group-hover:bg-slate-950/50 transition-colors duration-250">
                      <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                        {meeting.memo?.summary ? (
                          meeting.memo.summary.split(/[.!?]+/).slice(0, 3).map((sentence, sIdx) => {
                            const trimmed = sentence.trim();
                            if (!trimmed) return null;
                            return (
                              <span key={sIdx} className="block mb-1 last:mb-0">
                                • {trimmed}.
                              </span>
                            );
                          })
                        ) : (
                          "• No summary available."
                        )}
                      </p>
                    </div>

                    {/* Most Important Quote Extract */}
                    {meeting.transcript && meeting.transcript.length > 0 && (
                      <div className="mt-2.5 px-3 py-2 bg-slate-900/30 border-l-2 border-purple-500/50 rounded-r-xl">
                        <p className="text-[10px] italic text-slate-400 line-clamp-1">
                          "{meeting.transcript[0].text || "Let's align on production rollout."}"
                        </p>
                        <span className="text-[8px] text-slate-500 font-mono mt-0.5 block">
                          Speaker {meeting.transcript[0].speaker_label || "A"} · {fmtTime(meeting.transcript[0].start_seconds || 0)}
                        </span>
                      </div>
                    )}

                    {/* Top 3 Topics pills */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {topicsList.slice(0, 3).map((topic, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 bg-slate-900 border border-slate-805 text-slate-400 rounded-full text-[8.5px] font-semibold hover:border-purple-500/30 hover:text-white transition-all cursor-pointer" title="Topic tag">
                          #{topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ── SECTION 4 — QUICK INSIGHTS ── */}
                  <div className="flex flex-wrap gap-1.5 mb-4 pt-1">
                    <span className={`px-2 py-1.5 rounded-lg text-[9px] font-bold border transition-all duration-200 hover:scale-102 flex items-center gap-1 ${
                      actionItemsCount > 0 ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10" : "bg-slate-950/20 text-slate-650 border-transparent"
                    }`} title="Action Items count">
                      ✓ {actionItemsCount} Actions
                    </span>
                    <span className={`px-2 py-1.5 rounded-lg text-[9px] font-bold border transition-all duration-200 hover:scale-102 flex items-center gap-1 ${
                      decisionsCount > 0 ? "bg-purple-500/5 text-purple-400 border-purple-500/10" : "bg-slate-950/20 text-slate-650 border-transparent"
                    }`} title="Decisions count">
                      ⚖ {decisionsCount} Decisions
                    </span>
                    <span className={`px-2 py-1.5 rounded-lg text-[9px] font-bold border transition-all duration-200 hover:scale-102 flex items-center gap-1 ${
                      questionsCount > 0 ? "bg-[#3b82f6]/5 text-[#60a5fa] border-[#3b82f6]/10" : "bg-slate-950/20 text-slate-655 border-transparent"
                    }`} title="Questions count">
                      ❓ {questionsCount} Questions
                    </span>
                    <span className={`px-2 py-1.5 rounded-lg text-[9px] font-bold border transition-all duration-200 hover:scale-102 flex items-center gap-1 ${
                      topicsList.length > 0 ? "bg-amber-500/5 text-amber-400 border-amber-500/10" : "bg-slate-950/20 text-slate-655 border-transparent"
                    }`} title="Topics tag count">
                      💡 {topicsList.length} Topics
                    </span>
                  </div>

                  {/* BOTTOM ACTION BAR - Always visible premium layout buttons */}
                  <div className="mt-auto pt-3 border-t border-slate-900/60 flex items-center justify-between gap-1 group-hover:translate-y-[-2px] transition-transform duration-200" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { onSelectMeeting(meeting); setActivePage("transcript"); }}
                      className="flex-1 py-1.5 bg-slate-900/60 hover:bg-indigo-500/10 border border-slate-800 hover:border-indigo-500/20 text-slate-400 hover:text-indigo-400 rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center" title="View Transcript (Ctrl + T)">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                    <button onClick={() => { onSelectMeeting(meeting); setActivePage("qa"); }}
                      className="flex-1 py-1.5 bg-slate-900/60 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center" title="Meeting Memo">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-450" />
                    </button>
                    <button onClick={() => { onSelectMeeting(meeting); setActivePage("stats"); }}
                      className="flex-1 py-1.5 bg-slate-900/60 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/20 text-slate-400 hover:text-amber-400 rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center" title="Meeting Stats">
                      <Award className="w-3.5 h-3.5 text-amber-450" />
                    </button>
                    <button onClick={() => { onSelectMeeting(meeting); setActivePage("qa"); }}
                      className="flex-1 py-1.5 bg-slate-900/60 hover:bg-purple-500/10 border border-slate-800 hover:border-purple-500/20 text-slate-400 hover:text-[#c084fc] rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center" title="AI Assistant">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="flex flex-col gap-2">
            {filtered.map((meeting, idx) => {
              const meta = getDurationMeta(meeting.duration);
              const isThisPlaying = playingMeeting?.meeting_id === meeting.meeting_id && isPlaying;
              const isSelected = idx === selectedIndex;
              return (
                <motion.div key={meeting.meeting_id}
                  onClick={() => { onSelectMeeting(meeting); setActivePage("transcript"); }}
                  className={`group flex items-center gap-4 px-5 py-3 bg-slate-900/40 hover:bg-slate-900/60 border hover:border-slate-700 rounded-xl cursor-pointer transition-all ${
                    isSelected ? "border-sky-500 shadow-lg shadow-sky-500/5 ring-1 ring-sky-500/20" : "border-slate-800/60"
                  }`}>

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
                    <h4 className="text-sm font-bold text-white truncate">
                      {highlightText(meeting.title, debouncedQuery)}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(meeting.date).toLocaleDateString()} · {new Date(meeting.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                    {meta.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 5. Page Footer ───────────────────────────────────── */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-900 pt-6 text-xs text-slate-500 font-medium">
        <div>
          Total Registry Records: <span className="text-slate-300 font-semibold">{meetings.length}</span>
        </div>
        <div className="flex items-center gap-4">
          <div>
            Filtered View: <span className="text-slate-300 font-semibold">{filtered.length}</span>
          </div>
          <div className="h-3 w-px bg-slate-900" />
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            Registry Size: <span className="text-slate-300 font-semibold">{calculatedDbSize} MB</span>
          </div>
        </div>
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

      {/* Right-click Context Menu Portal */}
      <AnimatePresence>
        {contextMenu && (() => {
          const targetMeeting = meetings.find(m => m.meeting_id === contextMenu.meetingId);
          if (!targetMeeting) return null;
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{ top: contextMenu.y, left: contextMenu.x }}
              className="fixed z-50 min-w-[180px] bg-slate-950/95 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl p-1 flex flex-col gap-0.5"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  onSelectMeeting(targetMeeting);
                  setActivePage("transcript");
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                Open Meeting
              </button>
              <button
                onClick={(e) => {
                  startEdit(targetMeeting, e);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                Rename
              </button>
              <button
                onClick={(e) => {
                  handleDuplicate(targetMeeting, e);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Files className="w-3.5 h-3.5 text-purple-400" />
                Duplicate
              </button>
              <button
                onClick={(e) => {
                  handleExport(targetMeeting, e);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                Export Intelligence
              </button>
              <button
                disabled
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 rounded-lg flex items-center gap-2 cursor-not-allowed opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                Move to Folder
              </button>
              <div className="h-px bg-slate-900 my-1" />
              <button
                onClick={(e) => {
                  handleDelete(targetMeeting.meeting_id, e);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Registry
              </button>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
