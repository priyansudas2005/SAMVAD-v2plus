import React, { useState, useRef, useEffect } from "react";
import {
  History, Search, Trash2, Eye, Clock, Edit3, Check, X,
  Play, Pause, Volume2, VolumeX, XCircle, Database, Activity,
  LayoutGrid, List, ArrowUpDown, ChevronDown, SlidersHorizontal,
  Calendar, Award, User, AlertCircle, HelpCircle, FileText, CheckCircle2,
  Bookmark, Star, Copy, Share2, Download, Files, MoreVertical, ExternalLink,
  Sparkles, BrainCircuit, Pin, ChevronLeft, ChevronRight,
  Archive, Layers, Clock3, TrendingUp
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
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.04 }}
    className="bg-slate-950/45 border border-slate-900 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden"
  >
    {/* Shimmer sweep overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full animate-[shimmer_1.8s_infinite] pointer-events-none" />

    {/* Card Header Shimmer */}
    <div className="flex items-center justify-between pb-2 border-b border-white/[0.02]">
      <div className="w-16 h-4 bg-slate-900/80 rounded-full" />
      <div className="w-12 h-3.5 bg-slate-900/80 rounded-md" />
    </div>

    {/* Waveform Shimmer */}
    <div className="rounded-xl bg-slate-950/60 border border-slate-900/80 p-2.5 h-16 flex flex-col justify-between">
      <div className="flex items-end justify-center gap-[2.5px] h-8 opacity-40">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="w-[3px] bg-slate-800 rounded-full" style={{ height: `${8 + Math.abs(Math.sin(i * 0.5)) * 18}px` }} />
        ))}
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="w-5 h-5 rounded-full bg-slate-900/80" />
        <div className="w-10 h-2 bg-slate-900/80 rounded" />
      </div>
    </div>

    {/* Content Overview Shimmer */}
    <div className="space-y-2">
      <div className="w-2/3 h-4 bg-slate-900/80 rounded" />
      <div className="w-1/3 h-2.5 bg-slate-900/80 rounded" />
      <div className="rounded-xl bg-slate-950/30 border border-white/[0.02] p-2 space-y-1.5 h-11">
        <div className="w-full h-2 bg-slate-900/80 rounded" />
        <div className="w-5/6 h-2 bg-slate-900/80 rounded" />
      </div>
    </div>

    {/* Speakers & Tech Shimmer */}
    <div className="space-y-1.5 pt-1">
      <div className="flex justify-between items-center">
        <div className="w-20 h-2.5 bg-slate-900/80 rounded" />
        <div className="w-12 h-3.5 bg-slate-900/80 rounded" />
      </div>
      <div className="w-24 h-2.5 bg-slate-900/80 rounded" />
    </div>

    {/* Telemetry Stats boxes Shimmer */}
    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/[0.02]">
      <div className="h-6 bg-slate-900/60 rounded-lg border border-slate-900/40" />
      <div className="h-6 bg-slate-900/60 rounded-lg border border-slate-900/40" />
      <div className="h-6 bg-slate-900/60 rounded-lg border border-slate-900/40" />
    </div>

    {/* Bottom Toolbar Shimmer */}
    <div className="pt-2 border-t border-slate-900/60 flex gap-1.5">
      <div className="h-7 bg-slate-900/60 rounded-lg flex-1" />
      <div className="h-7 bg-slate-900/60 rounded-lg flex-1" />
      <div className="h-7 bg-slate-900/60 rounded-lg flex-1" />
      <div className="h-7 bg-slate-900/60 rounded-lg flex-1" />
    </div>
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
  const [showPinnedOnly, setShowPinnedOnly] = useState<boolean>(false);
  const [filterTag, setFilterTag] = useState<string>("all");

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
  const [playbackRates,  setPlaybackRates]  = useState<Record<string, number>>({});
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement   | null>(null);

  /* Scrubbing preview and hover tracking */
  const [scrubMeetingId, setScrubMeetingId] = useState<string | null>(null);
  const [scrubPercent, setScrubPercent] = useState<number>(0);

  /* Edit */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [saving,    setSaving]    = useState(false);

  // Bookmark and Favorite toggle state collections
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  // ── Workspace Organization State ──────────────────────────────────────
  const [activeCollection, setActiveCollection] = useState<string>(() =>
    localStorage.getItem('samvad-collection') || 'all'
  );
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() =>
    new Set(JSON.parse(localStorage.getItem('samvad-pinned') || '[]'))
  );
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() =>
    new Set(JSON.parse(localStorage.getItem('samvad-archived') || '[]'))
  );
  const [recentlyOpened, setRecentlyOpened] = useState<{id: string; ts: number}[]>(() =>
    JSON.parse(localStorage.getItem('samvad-recent-opened') || '[]')
  );
  const [previewMeeting, setPreviewMeeting] = useState<Meeting | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() =>
    localStorage.getItem('samvad-sidebar-collapsed') === 'true'
  );

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

  // ── Workspace persistence effects ────────────────────────────────────
  useEffect(() => { localStorage.setItem('samvad-collection', activeCollection); }, [activeCollection]);
  useEffect(() => { localStorage.setItem('samvad-pinned', JSON.stringify([...pinnedIds])); }, [pinnedIds]);
  useEffect(() => { localStorage.setItem('samvad-archived', JSON.stringify([...archivedIds])); }, [archivedIds]);
  useEffect(() => { localStorage.setItem('samvad-recent-opened', JSON.stringify(recentlyOpened)); }, [recentlyOpened]);
  useEffect(() => { localStorage.setItem('samvad-sidebar-collapsed', String(sidebarCollapsed)); }, [sidebarCollapsed]);

  const togglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPinnedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleArchive = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setArchivedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const trackOpen = (meeting: Meeting) => {
    setRecentlyOpened(prev => {
      const f = prev.filter(r => r.id !== meeting.meeting_id);
      return [{ id: meeting.meeting_id, ts: Date.now() }, ...f].slice(0, 20);
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
      await api.updateMeetingTitle(id, editTitle.trim());
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
    const rate = playbackRates[playingMeeting.meeting_id] || 1;
    audio.playbackRate = rate;
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

  useEffect(() => {
    if (audioRef.current && playingMeeting) {
      const rate = playbackRates[playingMeeting.meeting_id] || 1;
      audioRef.current.playbackRate = rate;
    }
  }, [playbackRates, playingMeeting]);

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

      // 8. Tag/Topic Filter
      if (filterTag !== "all") {
        const topicsList: string[] = m.metadata?.topics_entities?.topics 
          ? m.metadata.topics_entities.topics.map((t: any) => typeof t === "string" ? t : String(t?.name || ""))
          : [];
        if (!topicsList.includes(filterTag)) return false;
      }

      // Starred, Bookmarked, and Pinned toggles
      if (showStarredOnly && !favoriteIds.has(m.meeting_id)) return false;
      if (showBookmarkedOnly && !bookmarkedIds.has(m.meeting_id)) return false;
      if (showPinnedOnly && !pinnedIds.has(m.meeting_id)) return false;

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
    setFilterTag("all");
    setSearchQuery("");
    setShowStarredOnly(false);
    setShowBookmarkedOnly(false);
    setShowPinnedOnly(false);
  };
  const nowMs = Date.now();
  const oneWeekMs = 7 * 24 * 3600 * 1000;

  const applyCollectionFilter = (list: Meeting[]): Meeting[] => {
    switch (activeCollection) {
      case 'recent':         return list.filter(m => {
        if (archivedIds.has(m.meeting_id)) return false;
        const d = m.date ? new Date(m.date).getTime() : 0;
        return d > 0 ? (nowMs - d) < oneWeekMs : true;
      });
      case 'favorites':      return list.filter(m => favoriteIds.has(m.meeting_id));
      case 'bookmarked':     return list.filter(m => bookmarkedIds.has(m.meeting_id));
      case 'pinned':         return list.filter(m => pinnedIds.has(m.meeting_id));
      case 'archived':       return list.filter(m => archivedIds.has(m.meeting_id));
      case 'with_actions':   return list.filter(m => (m.transcript?.reduce((a, s) => a + (s.metadata?.action_items?.length || 0), 0) || 0) > 0);
      case 'with_decisions': return list.filter(m => (m.transcript?.reduce((a, s) => a + (s.metadata?.decisions?.length || 0), 0) || 0) > 0);
      case 'long':           return list.filter(m => (m.duration || 0) > 3600);
      case 'this_week':      return list.filter(m => {
        const d = m.date ? new Date(m.date).getTime() : 0;
        return d > 0 ? (nowMs - d) < oneWeekMs : true;
      });
      default:               return list.filter(m => !archivedIds.has(m.meeting_id));
    }
  };
  const collectionFiltered = applyCollectionFilter(filtered);

  // Keyboard navigation & accessibility event hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus element check to prevent overriding native inputs (e.g. typing in search)
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "SELECT") {
        if (e.key === "Escape") {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      if (collectionFiltered.length === 0) return;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => {
          const nextIdx = prev < collectionFiltered.length - 1 ? prev + 1 : 0;
          setTimeout(() => {
            const el = document.getElementById(`meeting-card-${collectionFiltered[nextIdx]?.meeting_id}`);
            el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
            (el as HTMLElement)?.focus();
          }, 10);
          return nextIdx;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => {
          const nextIdx = prev > 0 ? prev - 1 : collectionFiltered.length - 1;
          setTimeout(() => {
            const el = document.getElementById(`meeting-card-${collectionFiltered[nextIdx]?.meeting_id}`);
            el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
            (el as HTMLElement)?.focus();
          }, 10);
          return nextIdx;
        });
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const selected = collectionFiltered[selectedIndex];
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
  }, [collectionFiltered, selectedIndex, onSelectMeeting, setActivePage]);

  /* Stats */
  const totalMin = meetings.reduce((s, m) => s + (m.duration ?? 0) / 60, 0);
  const avgMin   = meetings.length ? totalMin / meetings.length : 0;
  const currentSort = SORT_OPTIONS.find(o => o.value === sortKey) || SORT_OPTIONS[0];
  const calculatedDbSize = (24.2 + (meetings.length * 0.8)).toFixed(1);

  // Dynamically extract all unique topics/tags from the meeting list
  const uniqueTagsList = Array.from(
    new Set(
      meetings.flatMap(m => {
        const list = m.metadata?.topics_entities?.topics;
        if (!list) return [];
        return list.map((t: any) => typeof t === "string" ? t : String(t?.name || ""));
      })
    )
  ).filter(Boolean) as string[];

  const collectionCounts: Record<string, number> = {
    all:            meetings.filter(m => !archivedIds.has(m.meeting_id)).length,
    recent:         meetings.filter(m => !archivedIds.has(m.meeting_id) && (nowMs - new Date(m.date).getTime()) < oneWeekMs).length,
    favorites:      meetings.filter(m => favoriteIds.has(m.meeting_id)).length,
    bookmarked:     meetings.filter(m => bookmarkedIds.has(m.meeting_id)).length,
    pinned:         pinnedIds.size,
    archived:       archivedIds.size,
    with_actions:   meetings.filter(m => (m.transcript?.reduce((a, s) => a + (s.metadata?.action_items?.length || 0), 0) || 0) > 0).length,
    with_decisions: meetings.filter(m => (m.transcript?.reduce((a, s) => a + (s.metadata?.decisions?.length || 0), 0) || 0) > 0).length,
    long:           meetings.filter(m => (m.duration || 0) > 3600).length,
    this_week:      meetings.filter(m => (nowMs - new Date(m.date).getTime()) < oneWeekMs).length,
  };

  // ── Collections sidebar data ────────────────────────────────────────
  const BUILT_IN_COLLECTIONS = [
    { id: 'all',       label: 'All Meetings', icon: <Layers className="w-3.5 h-3.5" />,      color: 'text-slate-300' },
    { id: 'recent',    label: 'Recent',       icon: <Clock3 className="w-3.5 h-3.5" />,      color: 'text-sky-400' },
    { id: 'favorites', label: 'Favorites',    icon: <Star className="w-3.5 h-3.5" />,        color: 'text-amber-400' },
    { id: 'bookmarked',label: 'Bookmarked',   icon: <Bookmark className="w-3.5 h-3.5" />,    color: 'text-sky-400' },
    { id: 'pinned',    label: 'Pinned',       icon: <Pin className="w-3.5 h-3.5" />,         color: 'text-purple-400' },
    { id: 'archived',  label: 'Archived',     icon: <Archive className="w-3.5 h-3.5" />,     color: 'text-slate-500' },
  ];
  const SMART_COLLECTIONS = [
    { id: 'with_actions',   label: 'Has Action Items', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-emerald-400' },
    { id: 'with_decisions', label: 'Has Decisions',    icon: <Award className="w-3.5 h-3.5" />,        color: 'text-purple-400' },
    { id: 'this_week',      label: 'This Week',        icon: <Calendar className="w-3.5 h-3.5" />,     color: 'text-blue-400' },
    { id: 'long',           label: 'Long Meetings',    icon: <TrendingUp className="w-3.5 h-3.5" />,   color: 'text-rose-400' },
  ];
  const activeColLabel = [...BUILT_IN_COLLECTIONS, ...SMART_COLLECTIONS].find(c => c.id === activeCollection)?.label || 'All Meetings';

  // ── Preview Drawer Helper Variables ──────────────────────────────────
  const pm = previewMeeting;
  const pmMeta = pm ? getDurationMeta(pm.duration) : { label: '', color: '', glow: '', wave: '' };
  const pmActions = pm?.transcript?.reduce((a, s) => a + (s.metadata?.action_items?.length || 0), 0) || 0;
  const pmDecisions = pm?.transcript?.reduce((a, s) => a + (s.metadata?.decisions?.length || 0), 0) || 0;
  const pmTopicsRaw: string[] = [];
  pm?.transcript?.forEach(s => { if (s.metadata?.keywords) pmTopicsRaw.push(...(s.metadata.keywords as string[])); });
  const pmTopics = [...new Set(pmTopicsRaw)];
  const pmIsPinned = pm ? pinnedIds.has(pm.meeting_id) : false;
  const pmIsBookmarked = pm ? bookmarkedIds.has(pm.meeting_id) : false;
  const pmIsFavorite = pm ? favoriteIds.has(pm.meeting_id) : false;
  let pmDate = '';
  if (pm) {
    try { pmDate = new Date(pm.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); } catch {}
  }

  return (
    <div className="flex-1 flex flex-row h-screen overflow-hidden bg-transparent relative">

      {/* ══ COLLECTIONS SIDEBAR ═══════════════════════════════════════════ */}
      <div className={`flex-shrink-0 flex flex-col border-r border-white/[0.03] bg-[#0a0a0f]/70 backdrop-blur-md transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'w-11' : 'w-52'}`}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-2.5 py-3 border-b border-white/[0.03] flex-shrink-0 min-h-[44px]">
          {!sidebarCollapsed && (
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest pl-1">Workspace</span>
          )}
          <button
            onClick={() => setSidebarCollapsed(p => !p)}
            className="p-1.5 rounded-lg text-slate-700 hover:text-slate-400 hover:bg-white/[0.04] transition-all ml-auto"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Sidebar scroll body */}
        <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-1.5 scrollbar-thin">
          {/* Built-in collections */}
          {!sidebarCollapsed && (
            <div className="text-[8px] font-bold text-slate-700 uppercase tracking-widest px-2 pt-1 pb-1.5">Collections</div>
          )}
          {BUILT_IN_COLLECTIONS.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveCollection(col.id)}
              title={sidebarCollapsed ? col.label : undefined}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-150 group relative ${
                activeCollection === col.id
                  ? 'bg-white/[0.06] shadow-sm'
                  : 'hover:bg-white/[0.03]'
              }`}
            >
              {activeCollection === col.id && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-purple-400/70 rounded-full" />
              )}
              <span className={`flex-shrink-0 transition-colors ${
                activeCollection === col.id ? col.color : 'text-slate-700 group-hover:text-slate-500'
              }`}>{col.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className={`text-[11px] font-semibold flex-1 truncate transition-colors ${
                    activeCollection === col.id ? 'text-slate-200' : 'text-slate-500 group-hover:text-slate-400'
                  }`}>{col.label}</span>
                  {(collectionCounts[col.id] ?? 0) > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full tabular-nums flex-shrink-0 ${
                      activeCollection === col.id ? 'bg-white/10 text-slate-400' : 'bg-slate-900 text-slate-700'
                    }`}>{collectionCounts[col.id]}</span>
                  )}
                </>
              )}
            </button>
          ))}

          {/* Smart auto-collections */}
          <div className={`${sidebarCollapsed ? 'h-px bg-white/[0.04] mx-1 my-2' : ''}`} />
          {!sidebarCollapsed && (
            <div className="text-[8px] font-bold text-slate-700 uppercase tracking-widest px-2 pt-3 pb-1.5">Smart</div>
          )}
          {SMART_COLLECTIONS.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveCollection(col.id)}
              title={sidebarCollapsed ? col.label : undefined}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-150 group relative ${
                activeCollection === col.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
              }`}
            >
              {activeCollection === col.id && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-purple-400/70 rounded-full" />
              )}
              <span className={`flex-shrink-0 transition-colors ${
                activeCollection === col.id ? col.color : 'text-slate-700 group-hover:text-slate-500'
              }`}>{col.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className={`text-[11px] font-semibold flex-1 truncate transition-colors ${
                    activeCollection === col.id ? 'text-slate-200' : 'text-slate-500 group-hover:text-slate-400'
                  }`}>{col.label}</span>
                  {(collectionCounts[col.id] ?? 0) > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full tabular-nums flex-shrink-0 ${
                      activeCollection === col.id ? 'bg-white/10 text-slate-400' : 'bg-slate-900 text-slate-700'
                    }`}>{collectionCounts[col.id]}</span>
                  )}
                </>
              )}
            </button>
          ))}

          {/* Recently opened */}
          {!sidebarCollapsed && recentlyOpened.length > 0 && (
            <>
              <div className="text-[8px] font-bold text-slate-700 uppercase tracking-widest px-2 pt-4 pb-1.5">Recently Opened</div>
              {recentlyOpened.slice(0, 5).map(r => {
                const m = meetings.find(x => x.meeting_id === r.id);
                if (!m) return null;
                return (
                  <button
                    key={r.id}
                    onClick={() => setPreviewMeeting(pm => pm?.meeting_id === m.meeting_id ? null : m)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-slate-600 hover:text-slate-400 hover:bg-white/[0.03] transition-all group"
                  >
                    <Clock className="w-3 h-3 flex-shrink-0 text-slate-800 group-hover:text-slate-600" />
                    <span className="text-[10px] truncate">{m.title}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Sidebar footer */}
        {!sidebarCollapsed && (
          <div className="flex-shrink-0 px-3 py-2.5 border-t border-white/[0.03]">
            <div className="text-[9px] text-slate-700 font-semibold">{meetings.length} total recordings</div>
          </div>
        )}
      </div>

      {/* ══ MAIN WORKSPACE WRAPPER ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col relative h-full min-w-0">
        <div className="flex-1 overflow-y-auto bg-transparent p-6 space-y-6 pb-32 min-w-0">
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
      <div className="sticky top-0 z-20 flex flex-col gap-3 bg-slate-950/85 backdrop-blur-md border border-white/[0.04] p-4 rounded-2xl shadow-2xl relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Omni Search Box Container */}
          <div className="search-bar-container w-full md:w-96 relative flex items-center group/search">
            <Search className="search-bar-icon group-focus-within/search:text-purple-400" />
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search registry by title, text, speaker..." 
              className="search-bar-input pr-16 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20" 
            />
            {!searchQuery && (
              <kbd className="absolute right-3 px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/[0.05] text-[9px] text-slate-600 font-mono select-none pointer-events-none group-focus-within/search:opacity-0 transition-opacity">
                Ctrl + K
              </kbd>
            )}
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

            {/* Advanced filter toggle button */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFilterPanelOpen(p => !p);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPanelOpen || filterDateRange !== "all" || filterDuration !== "all" || filterConfidence !== "all" || filterStatus !== "all" || filterSpeakers !== "all" || filterContains !== "all" || filterTag !== "all" || showStarredOnly || showBookmarkedOnly || showPinnedOnly
                  ? "bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.1)]"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {(filterDateRange !== "all" || filterDuration !== "all" || filterConfidence !== "all" || filterStatus !== "all" || filterSpeakers !== "all" || filterContains !== "all" || filterTag !== "all" || showStarredOnly || showBookmarkedOnly || showPinnedOnly) && (
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
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
              className="border-t border-slate-900 pt-3 mt-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 origin-top"
            >
              {/* Status Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</span>
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-sky-400"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="recording">Recording</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Date Range</span>
                <select 
                  value={filterDateRange} 
                  onChange={e => setFilterDateRange(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-sky-400"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>
              </div>

              {/* Speakers Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Speaker</span>
                <select 
                  value={filterSpeakers} 
                  onChange={e => setFilterSpeakers(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-sky-400"
                >
                  <option value="all">All Speakers</option>
                  <option value="1">1 Speaker</option>
                  <option value="2">2 Speakers</option>
                  <option value="3">3 Speakers</option>
                  <option value="4">4+ Speakers</option>
                </select>
              </div>

              {/* Duration Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Duration</span>
                <select 
                  value={filterDuration} 
                  onChange={e => setFilterDuration(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-sky-400"
                >
                  <option value="all">All Durations</option>
                  <option value="short">Short (&lt;10m)</option>
                  <option value="medium">Medium (10–30m)</option>
                  <option value="long">Long (30–60m)</option>
                  <option value="vlong">V. Long (1h+)</option>
                </select>
              </div>

              {/* Tags Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tags</span>
                <select 
                  value={filterTag} 
                  onChange={e => setFilterTag(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-sky-400"
                >
                  <option value="all">All Tags</option>
                  {uniqueTagsList.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
              </div>

              {/* Confidence Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Confidence</span>
                <select 
                  value={filterConfidence} 
                  onChange={e => setFilterConfidence(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-sky-400"
                >
                  <option value="all">All Confidences</option>
                  <option value="high">High (&ge;90%)</option>
                  <option value="medium">Medium (80–89%)</option>
                  <option value="low">Low (&lt;80%)</option>
                </select>
              </div>

              {/* Contains Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Contains</span>
                <select 
                  value={filterContains} 
                  onChange={e => setFilterContains(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-sky-400"
                >
                  <option value="all">All Records</option>
                  <option value="action_items">Action Items</option>
                  <option value="decisions">Decisions</option>
                  <option value="transcripts">Transcripts</option>
                </select>
              </div>

              {/* Quick toggles row inside the drawer */}
              <div className="col-span-full border-t border-white/[0.02] pt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowStarredOnly(p => !p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    showStarredOnly ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${showStarredOnly ? "fill-amber-400" : ""}`} />
                  Favorites
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookmarkedOnly(p => !p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    showBookmarkedOnly ? "bg-sky-500/15 text-sky-400 border border-sky-500/30" : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${showBookmarkedOnly ? "fill-sky-400" : ""}`} />
                  Bookmarked
                </button>
                <button
                  type="button"
                  onClick={() => setShowPinnedOnly(p => !p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    showPinnedOnly ? "bg-purple-500/15 text-purple-400 border border-purple-500/30" : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${showPinnedOnly ? "fill-purple-400" : ""}`} />
                  Pinned Only
                </button>
                
                <button
                  type="button"
                  onClick={resetFilters}
                  className="ml-auto px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all"
                >
                  Reset Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Chips */}
        {(() => {
          const chips = [];
          if (searchQuery) chips.push({ id: 'query', label: `Search: "${searchQuery}"`, onRemove: () => setSearchQuery("") });
          if (filterDateRange !== "all") chips.push({ id: 'date', label: `Date: ${filterDateRange}`, onRemove: () => setFilterDateRange("all") });
          if (filterDuration !== "all") chips.push({ id: 'duration', label: `Duration: ${filterDuration}`, onRemove: () => setFilterDuration("all") });
          if (filterConfidence !== "all") chips.push({ id: 'confidence', label: `Confidence: ${filterConfidence}`, onRemove: () => setFilterConfidence("all") });
          if (filterSpeakers !== "all") chips.push({ id: 'speakers', label: `Speakers: ${filterSpeakers}`, onRemove: () => setFilterSpeakers("all") });
          if (filterContains !== "all") chips.push({ id: 'contains', label: `Contains: ${filterContains.replace('_', ' ')}`, onRemove: () => setFilterContains("all") });
          if (filterStatus !== "all") chips.push({ id: 'status', label: `Status: ${filterStatus}`, onRemove: () => setFilterStatus("all") });
          if (filterTag !== "all") chips.push({ id: 'tag', label: `Tag: #${filterTag}`, onRemove: () => setFilterTag("all") });
          if (showStarredOnly) chips.push({ id: 'starred', label: 'Favorites', onRemove: () => setShowStarredOnly(false) });
          if (showBookmarkedOnly) chips.push({ id: 'bookmarked', label: 'Bookmarked', onRemove: () => setShowBookmarkedOnly(false) });
          if (showPinnedOnly) chips.push({ id: 'pinned', label: 'Pinned Only', onRemove: () => setShowPinnedOnly(false) });

          if (chips.length === 0) return null;

          return (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.02]">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Active Filters:</span>
              <AnimatePresence>
                {chips.map(chip => (
                  <motion.div
                    key={chip.id}
                    layout
                    initial={{ opacity: 0, scale: 0.85, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.85, x: 10 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium"
                  >
                    <span>{chip.label}</span>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); chip.onRemove(); }}
                      className="p-0.5 hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-200 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <button 
                type="button"
                onClick={resetFilters}
                className="text-[9px] text-slate-500 hover:text-rose-400 font-bold ml-2 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            </div>
          );
        })()}
      </div>

      {/* ── Collection header bar ─────────────────────────────── */}
      {activeCollection !== 'all' && (
        <div className="flex items-center gap-2 px-1 relative z-10 -mt-2">
          <span className="text-xs font-bold text-slate-400">{activeColLabel}</span>
          <span className="text-[10px] text-slate-700 font-semibold">· {collectionCounts[activeCollection] ?? 0} meetings</span>
          <button
            onClick={() => setActiveCollection('all')}
            className="ml-auto flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        </div>
      )}

      {/* ── 4. Meeting Grid/List ─────────────────────────────── */}
      <div className="w-full relative z-10">
        {loading ? (
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
            : "flex flex-col gap-3"}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
          </div>
        ) : collectionFiltered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="py-16 flex flex-col items-center justify-center gap-5 text-center bg-slate-950/20 border border-white/[0.03] rounded-3xl relative z-10 backdrop-blur-md shadow-2xl p-8 max-w-sm mx-auto mt-12">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-slate-400 shadow-inner">
              {activeCollection === 'favorites' ? <Star className="w-6 h-6 text-amber-400" /> :
               activeCollection === 'bookmarked' ? <Bookmark className="w-6 h-6 text-sky-400" /> :
               activeCollection === 'pinned' ? <Pin className="w-6 h-6 text-purple-400" /> :
               activeCollection === 'archived' ? <Archive className="w-6 h-6 text-slate-500" /> :
               <Database className="w-6 h-6 text-sky-400" />}
            </div>
            <div>
              {meetings.length === 0 ? (
                <>
                  <h3 className="text-white font-bold text-sm tracking-tight">Begin Your Meeting Space</h3>
                  <p className="text-slate-500 text-[11px] mt-2 max-w-xs leading-relaxed">
                    Upload voice recordings or start local transcribing to construct your offline intelligence workspace.
                  </p>
                  <button onClick={() => setActivePage("dashboard")}
                    className="mt-5 px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:brightness-110 text-white font-bold rounded-xl text-[10px] transition-all shadow-lg shadow-sky-500/10">
                    Create record
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-white font-bold text-sm tracking-tight">
                    {activeCollection === 'favorites' ? 'No Favorites Saved' :
                     activeCollection === 'bookmarked' ? 'No Bookmarks Found' :
                     activeCollection === 'pinned' ? 'No Pinned Meetings' :
                     activeCollection === 'archived' ? 'No Archived Records' :
                     'No matches in registry'}
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-2 max-w-xs leading-relaxed">
                    {activeCollection === 'favorites' ? 'Mark recordings with a star to pin them to your favorites library.' :
                     activeCollection === 'bookmarked' ? 'Save important transcript lines or memo insights to access them rapidly.' :
                     activeCollection === 'pinned' ? 'Keep top-priority items at the top of your list for quick access.' :
                     activeCollection === 'archived' ? 'Archived meetings are stored safely here out of your workspace.' :
                     'Try broadening your date filter, removing speakers criteria, or clearing the search query.'}
                  </p>
                  <button onClick={() => { resetFilters(); setActiveCollection('all'); }}
                    className="mt-5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold rounded-xl text-[10px] transition-all border border-slate-800 hover:border-slate-700">
                    Clear filters & view all
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {collectionFiltered.map((meeting, idx) => {
              const meta = getDurationMeta(meeting.duration);
              const isThisPlaying = playingMeeting?.meeting_id === meeting.meeting_id && isPlaying;
              const isSelected = idx === selectedIndex;

              const speakersList: string[] = meeting.metadata?.speakers 
                ? (Array.isArray(meeting.metadata.speakers) 
                    ? meeting.metadata.speakers 
                    : String(meeting.metadata.speakers).split(",").map(s => s.trim()))
                : [];
              const technologiesList: string[] = meeting.metadata?.topics_entities?.technologies 
                ? (Array.isArray(meeting.metadata.topics_entities.technologies) 
                    ? meeting.metadata.topics_entities.technologies.map((t: any) => typeof t === "string" ? t : String(t?.name || ""))
                    : String(meeting.metadata.topics_entities.technologies).split(",").map(s => s.trim()))
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
                  id={`meeting-card-${meeting.meeting_id}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`Meeting: ${meeting.title}. Duration: ${durationStr}. Date: ${formattedDate}. Status: ${statusLabel}.`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectMeeting(meeting);
                      setActivePage("transcript");
                    }
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
                    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
                  }}
                  onClick={() => { onSelectMeeting(meeting); setActivePage("transcript"); }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      meetingId: meeting.meeting_id
                    });
                  }}
                  className={`flex flex-col cursor-pointer group rounded-2xl overflow-hidden p-4 premium-card-interaction relative border outline-none focus-visible:ring-2 focus-visible:ring-purple-500/80 ${
                    isCardSelected
                      ? "is-selected bg-slate-900/90 ring-2 ring-purple-500/30"
                      : isSelected 
                        ? "is-selected-active bg-slate-900/90 ring-2 ring-sky-500/30" 
                        : "bg-slate-950/45 border-slate-900 hover:bg-slate-900/60"
                  }`}
                >
                  {/* ── SECTION 1 — HEADER ── */}
                  <div className="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-white/[0.02] min-w-0">
                    {/* Left: checkbox + status badge */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <label className="samvad-checkbox-container flex-shrink-0" onClick={toggleSelect}>
                        <input 
                          type="checkbox" 
                          checked={isCardSelected}
                          onChange={() => {}}
                        />
                        <span className="samvad-checkmark" />
                      </label>
                      <span className={`px-1.5 py-0.5 rounded-full border font-semibold text-[8px] flex items-center gap-1 flex-shrink-0 ${statusBg}`}>
                        <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                        {statusLabel}
                      </span>
                    </div>

                    {/* Right: duration · date + action icons — all in one tight row */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-150" onClick={e => e.stopPropagation()}>
                      <span className="text-[8px] text-slate-500 font-semibold whitespace-nowrap">{formattedDate}</span>
                      <button onClick={(e) => toggleBookmark(meeting.meeting_id, e)} className={`p-0.5 rounded transition-all duration-150 active:scale-75 hover:scale-110 flex-shrink-0 ${isBookmarked ? "text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.6)] animate-icon-pop" : "text-slate-500 hover:text-slate-300"}`}>
                        <Bookmark className={`w-3 h-3 ${isBookmarked ? "fill-sky-400" : ""}`} />
                      </button>
                      <button onClick={(e) => toggleFavorite(meeting.meeting_id, e)} className={`p-0.5 rounded transition-all duration-150 active:scale-75 hover:scale-110 flex-shrink-0 ${isFavorite ? "text-amber-400 animate-icon-pop" : "text-slate-500 hover:text-slate-300"}`}>
                        <Star className={`w-3 h-3 ${isFavorite ? "fill-amber-400" : ""}`} />
                      </button>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu(prev => (prev && prev.meetingId === meeting.meeting_id) ? null : { x: e.clientX, y: e.clientY, meetingId: meeting.meeting_id });
                      }} className="p-0.5 rounded text-slate-500 hover:text-white transition-all duration-150 hover:scale-110 active:scale-90 flex-shrink-0">
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* ── SECTION 2 — AUDIO PREVIEW ── */}
                  <div 
                    className="relative rounded-xl overflow-hidden bg-slate-950/60 backdrop-blur-sm border border-slate-900/80 p-2.5 mb-2.5 group-hover:border-slate-800 transition-all duration-300 shadow-inner group/audio" 
                    onClick={e => e.stopPropagation()}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const moveX = e.clientX - rect.left;
                      setScrubMeetingId(meeting.meeting_id);
                      setScrubPercent(moveX / rect.width);
                    }}
                    onMouseLeave={() => {
                      setScrubMeetingId(null);
                    }}
                  >
                    {/* Waveform bars with glass background & hover scrubbing line */}
                    <div 
                      className="h-10 flex items-end justify-center gap-[2px] relative cursor-pointer opacity-90 group-hover:opacity-100 transition-opacity pb-0.5 select-none"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const clickPercent = clickX / rect.width;
                        if (audioRef.current && playingMeeting?.meeting_id === meeting.meeting_id) {
                          audioRef.current.currentTime = clickPercent * audioRef.current.duration;
                        }
                      }}
                    >
                      {/* Hover Scrubbing Line Marker */}
                      {scrubMeetingId === meeting.meeting_id && (
                        <div 
                          className="absolute top-0 bottom-0 w-[1px] bg-sky-400/80 shadow-[0_0_8px_rgba(56,189,248,0.8)] pointer-events-none z-10"
                          style={{ left: `${scrubPercent * 100}%` }}
                        />
                      )}

                      {/* Main Waveform Bars */}
                      {Array.from({ length: 32 }).map((_, wIdx) => {
                        const h = 4 + Math.abs(Math.sin(wIdx * 0.43)) * 18 + Math.abs(Math.cos(wIdx * 0.87)) * 12;
                        const progressPercent = duration ? (currentTime / duration) : 0;
                        const isFilled = isThisPlaying && (wIdx / 32) <= progressPercent;
                        const isNearPlayhead = isThisPlaying && Math.abs((wIdx / 32) - progressPercent) < 0.04;
                        
                        return (
                          <div 
                            key={wIdx} 
                            style={{ 
                              height: `${Math.min(34, Math.max(3, h))}px`,
                              animationDelay: `${wIdx * 35}ms`
                            }}
                            className={`w-[2.5px] rounded-full transition-all duration-150 ${
                              isThisPlaying ? "animate-waveform-bar" : ""
                            } ${
                              isNearPlayhead
                                ? "bg-white/95 shadow-[0_0_6px_rgba(255,255,255,0.7)] scale-y-110"
                                : isFilled 
                                  ? "bg-gradient-to-t from-[#7c3aed] to-[#a78bfa] shadow-[0_0_4px_rgba(139,92,246,0.5)]" 
                                  : "bg-slate-700/50 hover:bg-slate-600/70"
                            }`} 
                          />
                        );
                      })}

                      {/* Reflected Waveform Bars (Adobe Audition Style) */}
                      <div className="absolute top-[38px] inset-x-0 h-[10px] flex items-start justify-center gap-[2px] opacity-15 pointer-events-none scale-y-[-0.35] origin-top blur-[0.3px]">
                        {Array.from({ length: 32 }).map((_, wIdx) => {
                          const h = 4 + Math.abs(Math.sin(wIdx * 0.43)) * 18 + Math.abs(Math.cos(wIdx * 0.87)) * 12;
                          const progressPercent = duration ? (currentTime / duration) : 0;
                          const isFilled = isThisPlaying && (wIdx / 32) <= progressPercent;
                          return (
                            <div 
                              key={wIdx} 
                              style={{ 
                                height: `${Math.min(34, Math.max(3, h))}px`,
                                animationDelay: `${wIdx * 35}ms`
                              }}
                              className={`w-[2.5px] rounded-full ${
                                isThisPlaying ? "animate-waveform-bar-reflected" : ""
                              } ${
                                isFilled 
                                  ? "bg-gradient-to-b from-[#7c3aed] to-[#a78bfa]" 
                                  : "bg-slate-700/50"
                              }`} 
                            />
                          );
                        })}
                      </div>

                      {/* Timeline Overlay Markers */}
                      <div className="absolute top-0 inset-x-0 h-1 flex items-center justify-between pointer-events-none px-1">
                        {actionItemsCount > 0 && (
                          <div className="w-1 h-1 rounded-full bg-amber-400/80 animate-pulse" title="Action Item Marker" style={{ marginLeft: "20%" }} />
                        )}
                        {decisionsCount > 0 && (
                          <div className="w-1 h-1 rounded-full bg-indigo-400/80 animate-pulse" title="Decision Marker" style={{ marginLeft: "50%" }} />
                        )}
                        {isBookmarked && (
                          <div className="w-1 h-1 rounded-full bg-sky-400/80 animate-pulse" title="Bookmark Marker" style={{ marginLeft: "80%" }} />
                        )}
                      </div>
                    </div>

                    {/* Thin progress track */}
                    <div className="h-[2px] bg-slate-900 rounded-full mx-0.5 mb-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] rounded-full transition-all duration-300"
                        style={{ width: isThisPlaying && duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                      />
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Left: play button + speed cycle pill */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                          onClick={(e) => handlePlayCard(meeting, e)}
                          className={isThisPlaying 
                            ? "w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-tr from-purple-600 to-indigo-500 hover:brightness-110 text-white transition-all shadow-lg active:scale-90 flex-shrink-0 shadow-purple-500/20 ring-1 ring-purple-400/40 hover:scale-105"
                            : "w-7 h-7 rounded-full flex items-center justify-center bg-[#0d0e12]/60 hover:bg-[#161920]/80 border border-slate-800 text-slate-300 transition-all active:scale-90 flex-shrink-0 hover:scale-105 hover:border-purple-500/40 hover:text-white shadow-inner"
                          }
                          title={isThisPlaying ? "Pause preview" : "Play preview"}
                        >
                          {isThisPlaying 
                            ? <Pause className="w-3 h-3 text-white fill-white" /> 
                            : <Play className="w-3 h-3 text-white fill-white ml-0.5" />}
                        </button>

                        {/* Speed pill — cycles through rates on click, isolated to meeting ID */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rates = [0.5, 1, 1.25, 1.5, 2];
                            const cardRate = playbackRates[meeting.meeting_id] || 1;
                            const next = rates[(rates.indexOf(cardRate) + 1) % rates.length];
                            setPlaybackRates(prev => ({ ...prev, [meeting.meeting_id]: next }));
                          }}
                          className="px-1.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800/50 text-[8px] text-slate-400 font-bold hover:bg-slate-700/80 hover:text-slate-200 transition-all flex-shrink-0 tabular-nums"
                          title="Click to change speed"
                        >
                          {(playbackRates[meeting.meeting_id] || 1) === 1 ? '1×' : `${playbackRates[meeting.meeting_id] || 1}×`}
                        </button>
                      </div>

                      {/* Right: volume (hover) + time display */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="opacity-0 group-hover/audio:opacity-100 flex items-center gap-1 transition-opacity duration-200">
                          <button onClick={toggleMute} className="text-slate-500 hover:text-white transition-colors p-0.5">
                            {isMuted ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                          </button>
                          <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolume}
                            className="w-14 accent-[#8b5cf6] h-0.5 bg-slate-900 rounded-lg cursor-pointer transition-all hover:h-1"
                          />
                        </div>

                        <span className="text-[8px] text-slate-400 font-mono bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap tabular-nums">
                          {isThisPlaying ? fmtTime(currentTime) : "00:00"}/{durationStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── SECTION 3 — MEETING OVERVIEW ── */}
                  <div className="mb-3">
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
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white tracking-tight truncate hover:text-purple-400 transition-colors duration-200" title={meeting.title}>
                            {highlightText(meeting.title, debouncedQuery)}
                          </h4>
                          <p className="text-[8px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">{startTimeStr || "12:00 PM"}</p>
                        </div>
                        {/* Category tag */}
                        <span className="flex-shrink-0 px-2 py-0.5 bg-purple-950/40 border border-purple-800/20 text-[#a78bfa] rounded-full text-[8px] font-bold uppercase tracking-wider">
                          {topicsList.includes("Planning") ? "Planning" : topicsList.includes("Sprint") ? "Sprint" : "Architecture"}
                        </span>
                      </div>
                    )}
                    
                    {/* Meeting Summary Box Panel */}
                    <div className="relative h-[42px] overflow-hidden rounded-xl bg-slate-950/30 border border-white/[0.02] p-2 mt-2.5 group-hover:bg-slate-950/50 transition-colors duration-250">
                      <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                        {meeting.memo?.summary || "No summary available for this intelligence record."}
                      </p>
                    </div>

                    {/* Participants & Confidence Score */}
                    <div className="flex items-center justify-between gap-2 mt-2.5 text-[9px]">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <span className="text-slate-500 font-bold flex-shrink-0">Speakers:</span>
                        <span className="text-slate-300 truncate" title={speakersList.join(", ")}>
                          {speakersList.length > 0 ? speakersList.join(", ") : "A & B"}
                        </span>
                      </div>
                      <div className="flex-shrink-0 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-[8px] font-bold">
                        {confidenceVal || 92}% Transcribed
                      </div>
                    </div>

                    {/* Technologies Mentioned */}
                    <div className="flex items-center gap-1 mt-2.5 text-[9px] min-w-0">
                      <span className="text-slate-500 font-bold flex-shrink-0">Tech:</span>
                      <div className="flex gap-1 min-w-0 overflow-hidden">
                        {technologiesList.length > 0 ? (
                          technologiesList.slice(0, 3).map((tech, tIdx) => (
                            <span key={tIdx} className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded text-[8px] font-medium truncate">
                              {tech}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 italic">None detected</span>
                        )}
                      </div>
                    </div>

                    {/* Smart Topics/Tags (Max 3 Badges) */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {topicsList.slice(0, 3).map((topic, tIdx) => {
                        const tagColors = [
                          "bg-indigo-950/30 border-indigo-500/25 text-indigo-300",
                          "bg-purple-950/30 border-purple-500/25 text-purple-300",
                          "bg-sky-950/30 border-sky-500/25 text-sky-300"
                        ];
                        const colorClass = tagColors[tIdx % tagColors.length];
                        return (
                          <span key={tIdx} className={`px-2 py-0.5 border rounded-full text-[8px] font-bold tracking-tight hover:brightness-110 transition-all cursor-pointer ${colorClass}`}>
                            #{topic}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── SECTION 4 — TELEMETRY QUICK STATISTICS GRID */}
                  <div className="grid grid-cols-3 gap-1 mb-2.5 pt-2 border-t border-white/[0.02]" onClick={e => e.stopPropagation()}>
                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg py-1 px-1.5 flex items-center justify-between text-[8px] text-slate-500">
                      <span className="font-semibold">Action Items</span>
                      <span className="font-extrabold text-emerald-400">{actionItemsCount}</span>
                    </div>
                    <div className="bg-purple-500/5 border border-purple-500/15 rounded-lg py-1 px-1.5 flex items-center justify-between text-[8px] text-slate-500">
                      <span className="font-semibold">Decisions</span>
                      <span className="font-extrabold text-purple-400">{decisionsCount}</span>
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg py-1 px-1.5 flex items-center justify-between text-[8px] text-slate-500">
                      <span className="font-semibold">Questions</span>
                      <span className="font-extrabold text-blue-400">{questionsCount}</span>
                    </div>
                  </div>

                  {/* BOTTOM TOOLBAR — professional compact glass toolbar */}
                  <div className="mt-auto pt-2 border-t border-slate-800/50 flex items-center justify-between gap-1.5" onClick={e => e.stopPropagation()}>
                    {[
                      { icon: <ExternalLink className="w-3.5 h-3.5" />, tooltip: "Open Full", action: () => { onSelectMeeting(meeting); setActivePage("transcript"); trackOpen(meeting); }, disabled: false },
                      { icon: <FileText className="w-3.5 h-3.5" />, tooltip: "Transcript", action: () => { onSelectMeeting(meeting); setActivePage("transcript"); }, disabled: false },
                      { icon: <Sparkles className="w-3.5 h-3.5" />, tooltip: "Intelligence", action: () => { onSelectMeeting(meeting); setActivePage("summary"); }, disabled: false },
                      { icon: <Download className="w-3.5 h-3.5" />, tooltip: "Export", action: (e: any) => handleExport(meeting, e), disabled: false }
                    ].map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={btn.action}
                        disabled={btn.disabled}
                        title={btn.tooltip}
                        className="p-1.5 rounded-lg border border-white/[0.03] bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/[0.08] text-slate-400 hover:text-white transition-all duration-150 active:scale-75 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center flex-1"
                      >
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="flex flex-col gap-2">
            {collectionFiltered.map((meeting, idx) => {
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
                onClick={(e) => { togglePin(targetMeeting.meeting_id, e); setContextMenu(null); }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Pin className="w-3.5 h-3.5 text-purple-400" />
                {pinnedIds.has(targetMeeting.meeting_id) ? 'Unpin' : 'Pin to Top'}
              </button>
              <button
                onClick={(e) => { toggleArchive(targetMeeting.meeting_id, e); setContextMenu(null); }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Archive className="w-3.5 h-3.5 text-slate-400" />
                {archivedIds.has(targetMeeting.meeting_id) ? 'Unarchive' : 'Archive'}
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

        </div>{/* end scroll area */}

        {/* Floating Audio Dock */}
        <AnimatePresence>
          {playingMeeting && (
            <motion.div
              initial={{ y: 80, opacity: 0, x: "-50%" }}
              animate={{ y: 0, opacity: 1, x: "-50%" }}
              exit={{ y: 80, opacity: 0, x: "-50%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-6 left-1/2 w-[92%] max-w-3xl bg-slate-950/85 backdrop-blur-md border border-white/[0.06] p-3 rounded-2xl flex items-center justify-between gap-4 shadow-2xl z-40"
            >
              {/* Left: Play/Pause + Title */}
              <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
                <button
                  onClick={() => {
                    if (isPlaying) {
                      audioRef.current?.pause();
                    } else {
                      audioRef.current?.play().catch(console.error);
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all shadow-md"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white text-white" /> : <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />}
                </button>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-white truncate max-w-[120px]">{playingMeeting.title}</h4>
                  <p className="text-[9px] text-slate-500">Offline Playback</p>
                </div>
              </div>

              {/* Center: Seek Progress Bar */}
              <div className="flex-1 flex items-center gap-2.5 min-w-0">
                <span className="text-[9px] font-mono font-bold text-slate-400">{fmtTime(currentTime)}</span>
                <div
                  ref={progressRef}
                  onClick={handleSeek}
                  className="flex-1 h-1.5 bg-slate-900 border border-slate-800 rounded-full cursor-pointer relative group overflow-hidden"
                >
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-purple-500 rounded-full relative transition-all"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-400">{fmtTime(duration || 0)}</span>
              </div>

              {/* Right: Volume + Close */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={toggleMute} className="text-slate-500 hover:text-white transition-colors p-1">
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <div className="h-4 w-px bg-white/[0.06]" />
                <button
                  onClick={() => {
                    setPlayingMeeting(null);
                    setIsPlaying(false);
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/[0.04] transition-all"
                  title="Close player"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>{/* end main workspace wrapper */}

      {/* ══ PREVIEW DRAWER ═════════════════════════════════════ */}
      <AnimatePresence>
        {previewMeeting && pm && (
          <motion.div
            key="preview-drawer"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="flex-shrink-0 w-72 flex flex-col border-l border-white/[0.04] bg-[#0a0a0f]/80 backdrop-blur-md overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.03] flex-shrink-0">
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Preview</span>
              <button onClick={() => setPreviewMeeting(null)} className="p-1 rounded-md text-slate-700 hover:text-slate-400 hover:bg-white/[0.04] transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Title */}
              <div>
                <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 mb-1">{pm.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{pmDate}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-800" />
                  <span className="text-[10px] font-bold" style={{ color: pmMeta.color }}>{pmMeta.label}</span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: pmIsPinned ? 'Pinned' : 'Pin', icon: <Pin className="w-3 h-3" />, active: pmIsPinned, activeClass: 'bg-purple-950/40 border-purple-700/40 text-purple-400', action: (e: any) => togglePin(pm.meeting_id, e) },
                  { label: 'Save', icon: <Bookmark className="w-3 h-3" />, active: pmIsBookmarked, activeClass: 'bg-sky-950/40 border-sky-700/40 text-sky-400', action: (e: any) => toggleBookmark(pm.meeting_id, e) },
                  { label: pmIsFavorite ? 'Liked' : 'Like', icon: <Star className="w-3 h-3" />, active: pmIsFavorite, activeClass: 'bg-amber-950/40 border-amber-700/40 text-amber-400', action: (e: any) => toggleFavorite(pm.meeting_id, e) },
                  { label: 'Archive', icon: <Archive className="w-3 h-3" />, active: archivedIds.has(pm.meeting_id), activeClass: 'bg-slate-800 border-slate-700 text-slate-300', action: (e: any) => { toggleArchive(pm.meeting_id, e); setPreviewMeeting(null); } },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.action}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[8px] font-bold transition-all ${
                      btn.active ? btn.activeClass : 'bg-slate-900/60 border-slate-800/60 text-slate-600 hover:text-slate-400 hover:border-slate-700'
                    }`}>
                    {btn.icon}{btn.label}
                  </button>
                ))}
              </div>

              {/* Mini waveform */}
              <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/50">
                <div className="flex items-end gap-[2px] h-8 justify-center">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const h = 3 + Math.abs(Math.sin(i * 0.5)) * 22 + Math.abs(Math.cos(i * 0.9)) * 10;
                    return <div key={i} style={{ height: `${Math.min(28, Math.max(3, h))}px` }} className="w-[3px] rounded-full bg-slate-700/60" />;
                  })}
                </div>
                <div className="text-center mt-1.5">
                  <span className="text-[8px] text-slate-700 font-mono">{pmMeta.label} · {pm.title.slice(0, 20)}</span>
                </div>
              </div>

              {/* Summary */}
              {pm.memo?.summary && (
                <div>
                  <div className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mb-1.5">Summary</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-4">{pm.memo.summary}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Actions', value: pmActions, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/30' },
                  { label: 'Decisions', value: pmDecisions, color: 'text-purple-400', bg: 'bg-purple-950/20 border-purple-900/30' },
                  { label: 'Topics', value: pmTopics.length, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900/30' },
                ].map(s => (
                  <div key={s.label} className={`rounded-lg border p-2 text-center ${s.bg}`}>
                    <div className={`text-lg font-extrabold tabular-nums leading-none ${s.color}`}>{s.value}</div>
                    <div className="text-[8px] text-slate-700 font-semibold mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Topics */}
              {pmTopics.length > 0 && (
                <div>
                  <div className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mb-1.5">Topics</div>
                  <div className="flex flex-wrap gap-1">
                    {pmTopics.slice(0, 8).map(t => (
                      <span key={t} className="px-1.5 py-0.5 bg-amber-950/20 border border-amber-900/25 text-amber-500/80 text-[8px] font-bold rounded-md">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript snippet */}
              {pm.transcript && pm.transcript.length > 0 && (
                <div>
                  <div className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mb-1.5">Latest Segment</div>
                  <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-800/50 border-l-2 border-l-purple-600/30">
                    <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3 italic">“{pm.transcript[0].text}”</p>
                    <div className="text-[8px] font-bold text-slate-700 mt-1.5">Speaker {pm.transcript[0].speaker_label || 'A'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-white/[0.03] space-y-2">
              <button
                onClick={() => { onSelectMeeting(pm); setActivePage('transcript'); trackOpen(pm); setPreviewMeeting(null); }}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Meeting
              </button>
              <div className="flex gap-1.5">
                <button onClick={() => handleExport(pm)}
                  className="flex-1 py-1.5 bg-slate-900/50 hover:bg-slate-800/60 border border-slate-800/50 text-slate-500 hover:text-white text-[9px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all">
                  <Download className="w-3 h-3" /> Export
                </button>
                <button onClick={(e) => { handleDelete(pm.meeting_id, e); setPreviewMeeting(null); }}
                  className="flex-1 py-1.5 bg-slate-900/50 hover:bg-rose-950/30 border border-slate-800/50 hover:border-rose-800/30 text-slate-500 hover:text-rose-400 text-[9px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

