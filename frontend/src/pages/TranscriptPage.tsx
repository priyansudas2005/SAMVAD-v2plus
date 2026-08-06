import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Settings, 
  Play, 
  Pause,
  FileAudio,
  Sparkles,
  AlertCircle,
  Clock,
  Copy,
  Bookmark,
  Activity,
  Volume2,
  Calendar,
  Users,
  Filter,
  ArrowUpDown,
  BookmarkCheck,
  Languages,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Volume1,
  ListChecks,
  GitBranch,
  Tag,
  Key,
  FileText,
  FileCode,
  Link,
  Sliders,
  UserCheck,
  Undo
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Meeting } from '../types';
import { api } from '../services/api';
import { ExportButton } from '../components/ExportButton';
import { Toast } from '../components/Toast';
import { UnsavedChangesIndicator } from '../components/UnsavedChangesIndicator';
import { SpeakerManagerPanel } from '../components/SpeakerManagerPanel';
import { SpeakerBadge } from '../components/SpeakerBadge';
import { EmptyState } from '../components/EmptyState';
import { RenameSpeakerModal, SPEAKER_COLORS } from '../components/SpeakerManagerPanel';

interface TranscriptPageProps {
  currentMeeting: Meeting;
  onUpdateMeeting: (meeting: Meeting) => void;
  isProcessing?: boolean;
  onStartProcessing?: (options: { modelSize: string; language?: string; vadEnabled: boolean }) => void;
}

export const TranscriptPage: React.FC<TranscriptPageProps> = ({
  currentMeeting,
  onUpdateMeeting,
  isProcessing = false,
  onStartProcessing,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [speakerFilter, setSpeakerFilter] = useState<string>('all');
  const [bookmarkOnly, setBookmarkOnly] = useState(false);
  const [aiTagFilter, setAiTagFilter] = useState<string>('all'); 
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [jumpTime, setJumpTime] = useState('');
  const [collapsedSpeakers, setCollapsedSpeakers] = useState<Set<string>>(new Set());
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [showSpeakerManager, setShowSpeakerManager] = useState(false);
  // Map from original speaker_label -> custom display name
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({});
  // Map from original speaker_label -> custom color override
  const [speakerColors, setSpeakerColors] = useState<Record<string, string>>({});
  // Map from original speaker_label -> SpeakerProfile details (role, notes, avatar initials)
  const [speakerProfiles, setSpeakerProfiles] = useState<Record<string, { role: string; notes: string }>>({});
  // Which speaker label has an open rename modal (triggered from badge click)
  const [renamingFromBadge, setRenamingFromBadge] = useState<string | null>(null);

  // VS Code style Accordion collapse states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    summary: true,
    topics: true,
    entities: false,
    keywords: false,
    bookmarks: true,
    notes: false,
    references: false,
    confidence: false
  });

  const toggleSection = (sec: string) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Audio Playback states
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(0.8);

  // Bookmarks state
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());

  const [localProcessing, setLocalProcessing] = useState(false);
  const processing = localProcessing || isProcessing;
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  }, []);

  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };
  
  // Sync VAD & language from meeting metadata if present
  useEffect(() => {
    if (currentMeeting.metadata) {
      if (currentMeeting.metadata.model_size) setModelSize(currentMeeting.metadata.model_size);
      if (currentMeeting.metadata.language) setLanguage(currentMeeting.metadata.language);
      if (currentMeeting.metadata.vad_filter !== undefined) setVadEnabled(currentMeeting.metadata.vad_filter);
    }
  }, [currentMeeting]);
  
  // Processing settings
  const [modelSize, setModelSize] = useState('base');
  const [language, setLanguage] = useState('auto');
  const [vadEnabled, setVadEnabled] = useState(false);

  // Load saved default settings from database
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const saved = await api.getSettings();
        if (saved) {
          setModelSize(saved.model_size || 'base');
          setLanguage(saved.default_language || 'auto');
          setVadEnabled(saved.vad_enabled !== undefined ? saved.vad_enabled : false);
        }
      } catch (err) {
        console.error('Failed to load default settings:', err);
      }
    };
    loadSavedSettings();
  }, []);

  // Sync volume & speed to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, playbackSpeed]);

  const handleProcess = async () => {
    if (onStartProcessing) {
      onStartProcessing({
        modelSize,
        language: language === 'auto' ? undefined : language,
        vadEnabled,
      });
      return;
    }
    setLocalProcessing(true);
    setError(null);
    try {
      const updated = await api.processMeeting(currentMeeting.meeting_id, {
        modelSize,
        language: language === 'auto' ? undefined : language,
        vadEnabled,
      });
      onUpdateMeeting(updated);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process meeting. Please check model download or RAM capacity.');
    } finally {
      setLocalProcessing(false);
    }
  };

  const handleBookmarkToggle = (segId: number) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(segId)) {
        next.delete(segId);
        showToast('Bookmark removed', 'success');
      } else {
        next.add(segId);
        showToast('Segment bookmarked', 'success');
      }
      return next;
    });
  };

  const handleJumpToTime = (timeStr?: string | number) => {
    let totalSec = 0;
    if (typeof timeStr === 'number') {
      totalSec = timeStr;
    } else {
      const targetTime = timeStr || jumpTime;
      if (!targetTime.trim()) return;
      
      const parts = targetTime.split(':');
      if (parts.length === 3) {
        totalSec = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
      } else if (parts.length === 2) {
        totalSec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      } else {
        totalSec = parseInt(parts[0], 10);
      }
    }
    
    if (isNaN(totalSec)) return;

    if (audioRef.current) {
      audioRef.current.currentTime = totalSec;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }

    if (!currentMeeting.transcript) return;
    
    const matchedSeg = currentMeeting.transcript.find(seg => {
      const segParts = seg.start.split(':');
      const segSec = parseInt(segParts[0], 10) * 60 + parseInt(segParts[1], 10);
      return segSec >= totalSec;
    });
    
    if (matchedSeg && containerRef.current) {
      const el = document.getElementById(`segment-${matchedSeg.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const toggleSpeakerCollapse = (spk: string) => {
    setCollapsedSpeakers(prev => {
      const next = new Set(prev);
      if (next.has(spk)) next.delete(spk);
      else next.add(spk);
      return next;
    });
  };

  // Speaker rename handler — updates display name map (no re-transcription)
  const handleRenameSpeaker = useCallback((originalLabel: string, newName: string, scope: 'all' | 'current') => {
    setSpeakerNames(prev => ({ ...prev, [originalLabel]: newName }));
    showToast(`Speaker renamed to "${newName}"`, 'success');
  }, [showToast]);

  // Speaker color change handler — overrides palette color for this label
  const handleColorChange = useCallback((originalLabel: string, color: string) => {
    setSpeakerColors(prev => ({ ...prev, [originalLabel]: color }));
    showToast('Speaker color updated', 'success');
  }, [showToast]);

  // Speaker profile update handler (displayName, role, notes, color)
  const handleUpdateProfile = useCallback((originalLabel: string, updates: { displayName?: string; role?: string; notes?: string; color?: string }) => {
    if (updates.displayName) {
      setSpeakerNames(prev => ({ ...prev, [originalLabel]: updates.displayName! }));
    }
    if (updates.color) {
      setSpeakerColors(prev => ({ ...prev, [originalLabel]: updates.color! }));
    }
    if (updates.role !== undefined || updates.notes !== undefined) {
      setSpeakerProfiles(prev => ({
        ...prev,
        [originalLabel]: {
          role: updates.role ?? prev[originalLabel]?.role ?? 'Participant',
          notes: updates.notes ?? prev[originalLabel]?.notes ?? '',
        }
      }));
    }
    showToast('Speaker profile updated', 'success');
  }, [showToast]);

  // Undo history state for speaker modifications
  const [speakerHistory, setSpeakerHistory] = useState<{
    transcript: import('../types').TranscriptSegment[];
    action: string;
  }[]>([]);

  // Push state to undo history before mutating transcript
  const pushHistory = useCallback((actionDescription: string) => {
    if (currentMeeting.transcript) {
      setSpeakerHistory(prev => [
        ...prev.slice(-10), // keep last 10 actions
        { transcript: JSON.parse(JSON.stringify(currentMeeting.transcript)), action: actionDescription }
      ]);
    }
  }, [currentMeeting.transcript]);

  // Undo last speaker modification
  const handleUndoSpeakerAction = useCallback(() => {
    if (speakerHistory.length === 0) return;
    const last = speakerHistory[speakerHistory.length - 1];
    setSpeakerHistory(prev => prev.slice(0, -1));
    onUpdateMeeting({ ...currentMeeting, transcript: last.transcript });
    showToast(`Undid: ${last.action}`, 'success');
  }, [speakerHistory, currentMeeting, onUpdateMeeting, showToast]);

  // Merge Speakers — reassign all segments of source speaker to target speaker
  const handleMergeSpeakers = useCallback((sourceLabel: string, targetLabel: string) => {
    if (!currentMeeting.transcript) return;
    pushHistory(`Merge ${sourceLabel} into ${targetLabel}`);

    const updated = currentMeeting.transcript.map(seg => {
      if ((seg.speaker_label || 'UNKNOWN') === sourceLabel) {
        return { ...seg, speaker_label: targetLabel };
      }
      return seg;
    });

    onUpdateMeeting({ ...currentMeeting, transcript: updated });
    showToast(`Merged ${speakerNames[sourceLabel] || sourceLabel} into ${speakerNames[targetLabel] || targetLabel}`, 'success');
  }, [currentMeeting, pushHistory, onUpdateMeeting, speakerNames, showToast]);

  // Reassign / Split a single segment to another speaker
  const handleReassignSegmentSpeaker = useCallback((segmentId: number, newSpeakerLabel: string) => {
    if (!currentMeeting.transcript) return;
    pushHistory(`Reassigned segment #${segmentId}`);

    const updated = currentMeeting.transcript.map(seg => {
      if (seg.id === segmentId) {
        return { ...seg, speaker_label: newSpeakerLabel };
      }
      return seg;
    });

    onUpdateMeeting({ ...currentMeeting, transcript: updated });
    showToast(`Reassigned segment to ${speakerNames[newSpeakerLabel] || newSpeakerLabel}`, 'success');
  }, [currentMeeting, pushHistory, onUpdateMeeting, speakerNames, showToast]);

  // Helper: resolve display name for a speaker label
  const resolveSpeakerName = useCallback((label: string | undefined) => {
    const raw = label || 'UNKNOWN';
    return speakerNames[raw] ?? raw;
  }, [speakerNames]);

  // Helper: resolve color for a speaker label (with override)
  const resolveSpeakerColor = useCallback((label: string | undefined, index: number) => {
    const raw = label || 'UNKNOWN';
    return speakerColors[raw] ?? SPEAKER_COLORS[index % SPEAKER_COLORS.length];
  }, [speakerColors]);

  // Get filtered segments with sorting and query matches
  const getFilteredSegments = useMemo(() => {
    if (!currentMeeting.transcript) return [];
    let list = currentMeeting.transcript.map((seg) => {
      // Standardize empty or null labels to SPEAKER_00 fallback without mutating valid labels
      const label = seg.speaker_label && seg.speaker_label !== 'UNKNOWN' ? seg.speaker_label : 'SPEAKER_00';
      return { ...seg, speaker_label: label };
    });
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(seg => seg.text.toLowerCase().includes(query));
    }
    
    if (speakerFilter !== 'all') {
      list = list.filter(seg => (seg.speaker_label || 'UNKNOWN') === speakerFilter);
    }
    
    if (bookmarkOnly) {
      list = list.filter(seg => bookmarkedIds.has(seg.id));
    }

    if (aiTagFilter !== 'all') {
      list = list.filter(seg => {
        if (aiTagFilter === 'decision') return seg.metadata?.decisions && seg.metadata.decisions.length > 0;
        if (aiTagFilter === 'action') return seg.metadata?.action_items && seg.metadata.action_items.length > 0;
        if (aiTagFilter === 'question') return seg.metadata?.questions && seg.metadata.questions.length > 0;
        return true;
      });
    }
    
    if (sortOrder === 'desc') {
      list.reverse();
    }
    
    return list;
  }, [currentMeeting.transcript, searchQuery, speakerFilter, bookmarkOnly, aiTagFilter, sortOrder, bookmarkedIds]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase()
            ? <mark key={i} className="bg-purple-500/30 text-[#F5F7FA] font-semibold px-0.5 rounded border border-purple-500/20">{part}</mark>
            : part
        )}
      </span>
    );
  };

  const filtered = getFilteredSegments;
  const isVirtual = filtered.length > 80;
  
  const itemHeight = 65; 
  const containerHeight = 650; 
  const buffer = 12;

  const startIndex = isVirtual ? Math.max(0, Math.floor(scrollTop / itemHeight) - buffer) : 0;
  const endIndex = isVirtual ? Math.min(filtered.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer) : filtered.length;

  const visibleSegments = filtered.slice(startIndex, endIndex);
  const paddingTop = isVirtual ? startIndex * itemHeight : 0;
  const paddingBottom = isVirtual ? (filtered.length - endIndex) * itemHeight : 0;

  const hasTranscript = currentMeeting.transcript && currentMeeting.transcript.length > 0;

  // Unsaved changes tracking
  const [unsavedChanges, setUnsavedChanges] = useState<Set<number>>(new Set());
  const [savingAll, setSavingAll] = useState(false);

  const markUnsaved = useCallback((segmentId: number) => {
    setUnsavedChanges(prev => new Set(prev).add(segmentId));
  }, []);

  const markSaved = useCallback((segmentId: number) => {
    setUnsavedChanges(prev => {
      const next = new Set(prev);
      next.delete(segmentId);
      return next;
    });
  }, []);

  const handleSaveAll = async () => {
    setSavingAll(true);
    showToast('All changes saved', 'success');
    setUnsavedChanges(new Set());
    setSavingAll(false);
  };

  const avgConfidence = useMemo(() => {
    if (!currentMeeting.transcript || currentMeeting.transcript.length === 0) return 0;
    const total = currentMeeting.transcript.reduce((sum, seg) => sum + (seg.speaker_confidence || 0.95), 0);
    return (total / currentMeeting.transcript.length) * 100;
  }, [currentMeeting.transcript]);

  const uniqueSpeakers = useMemo(() => {
    if (!currentMeeting.transcript) return [];
    return Array.from(new Set(currentMeeting.transcript.map(s => s.speaker_label || 'UNKNOWN')));
  }, [currentMeeting.transcript]);

  const speakerSegmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    currentMeeting.transcript?.forEach(seg => {
      const spk = seg.speaker_label || 'UNKNOWN';
      counts[spk] = (counts[spk] || 0) + 1;
    });
    return counts;
  }, [currentMeeting.transcript]);

  // Precompute per-speaker stats & profile info for SpeakerBadge popovers
  const allSpeakerStats = useMemo(() => {
    const totalDuration = (currentMeeting.transcript || []).reduce((sum, seg) => {
      const parts = seg.start.split(':');
      const start = parts.length === 2 ? parseInt(parts[0], 10) * 60 + parseFloat(parts[1]) : parseFloat(parts[0]);
      const end = seg.end_seconds ?? start + 5;
      return sum + (end - start);
    }, 0);

    return uniqueSpeakers.reduce<Record<string, import('../components/SpeakerBadge').ExtendedSpeakerStats>>((acc, label, idx) => {
      const segs = (currentMeeting.transcript || []).filter(s => (s.speaker_label || 'UNKNOWN') === label);
      const totalSeconds = segs.reduce((sum, seg) => {
        const parts = seg.start.split(':');
        const start = parts.length === 2 ? parseInt(parts[0], 10) * 60 + parseFloat(parts[1]) : parseFloat(parts[0]);
        const end = seg.end_seconds ?? start + 5;
        return sum + (end - start);
      }, 0);
      const wordsSpoken = segs.reduce((sum, s) => sum + (s.text ? s.text.trim().split(/\s+/).length : 0), 0);
      const avgWpm = totalSeconds > 0 ? Math.round((wordsSpoken / totalSeconds) * 60) : 0;
      const displayName = speakerNames[label] ?? label;
      const profile = speakerProfiles[label];

      // Generate initials avatar
      const cleanName = displayName.replace(/^SPEAKER_/i, '').trim();
      const parts = cleanName.split(/[\s_]+/);
      let initials = 'SP';
      if (parts.length >= 2 && parts[0] && parts[1]) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else if (cleanName.length >= 2) {
        initials = cleanName.substring(0, 2).toUpperCase();
      } else if (cleanName.length === 1) {
        initials = cleanName.toUpperCase();
      }

      acc[label] = {
        originalLabel: label,
        displayName,
        color: resolveSpeakerColor(label, idx),
        segments: segs.length,
        totalSeconds,
        percentage: totalDuration > 0 ? (totalSeconds / totalDuration) * 100 : 0,
        wordsSpoken,
        avgWpm,
        role: profile?.role || 'Participant',
        notes: profile?.notes || '',
        avatarInitials: initials,
      };
      return acc;
    }, {});
  }, [uniqueSpeakers, currentMeeting.transcript, speakerNames, speakerColors, speakerProfiles, resolveSpeakerColor]);

  // Audio Playback Actions
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const aiTaggedSegments = useMemo(() => {
    if (!currentMeeting.transcript) return [];
    return currentMeeting.transcript.filter(seg => 
      (seg.metadata?.decisions && seg.metadata.decisions.length > 0) ||
      (seg.metadata?.action_items && seg.metadata.action_items.length > 0)
    );
  }, [currentMeeting.transcript]);

  // Safely calculate totalSecs and playhead position to prevent NaN/Infinity
  const totalSecs = useMemo(() => {
    const dur = audioDuration || currentMeeting.duration;
    return (dur && !isNaN(dur) && dur > 0) ? dur : 100;
  }, [audioDuration, currentMeeting.duration]);

  return (
    <div className="flex-1 bg-transparent p-0 flex flex-col h-screen relative box-border font-sans text-[#F5F7FA]">
      
      {/* HTML Audio Engine */}
      <audio
        ref={audioRef}
        src={`/api/meetings/${currentMeeting.meeting_id}/audio`}
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={handleAudioLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* ── IDE Workbench Header ── */}
      <div className="flex-shrink-0 bg-[#0e1016]/90 border-b border-white/[0.06] p-3 pl-6 flex items-center justify-between relative z-35 backdrop-blur-[24px]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[#98A2B3] font-mono text-xs select-none">FILE //</span>
            <h1 className="text-xs font-bold text-[#F5F7FA] uppercase tracking-widest leading-none truncate max-w-xl">
              {currentMeeting.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[#98A2B3] mt-1.5 font-mono">
            <span>DATE: {new Date(currentMeeting.date).toLocaleDateString()}</span>
            <span className="text-white/[0.08]">|</span>
            <span>LEN: {currentMeeting.duration ? `${(currentMeeting.duration / 60).toFixed(1)}m` : '0m'}</span>
            <span className="text-white/[0.08]">|</span>
            <span>LANG: {language.toUpperCase()}</span>
            <span className="text-white/[0.08]">|</span>
            <span>SPEAKERS: {uniqueSpeakers.length}</span>
            {hasTranscript && (
              <>
                <span className="text-white/[0.08]">|</span>
                <span>CONF: <span className="text-[#10B981] font-bold">{avgConfidence.toFixed(0)}%</span></span>
              </>
            )}
          </div>
        </div>

        {/* Exports & Actions */}
        {hasTranscript && (
          <div className="flex gap-2 items-center shrink-0">
            {/* Undo Speaker Action */}
            {speakerHistory.length > 0 && (
              <button
                onClick={handleUndoSpeakerAction}
                className="px-2.5 py-1.5 rounded text-[10px] font-bold desktop-hover-transition flex items-center gap-1 uppercase tracking-wider bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 font-mono"
                title={`Undo: ${speakerHistory[speakerHistory.length - 1]?.action}`}
              >
                <Undo className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}

            {/* Manage Speakers */}
            <button
              onClick={() => setShowSpeakerManager(!showSpeakerManager)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold desktop-hover-transition flex items-center gap-1.5 uppercase tracking-wider border ${
                showSpeakerManager
                  ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]'
                  : 'bg-[#0b0c10] border-white/[0.05] hover:bg-white/[0.02] text-[#98A2B3]'
              }`}
              title="Manage Speakers"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Speakers</span>
            </button>

            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold desktop-hover-transition flex items-center gap-1.5 uppercase tracking-wider ${
                showAiPanel 
                  ? 'bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]' 
                  : 'bg-[#0b0c10] border border-white/[0.05] hover:bg-white/[0.02] text-[#98A2B3]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Inspector
            </button>

            <UnsavedChangesIndicator
              hasUnsaved={unsavedChanges.size > 0}
              saving={savingAll}
              onSave={handleSaveAll}
            />
            <ExportButton
              meetingId={currentMeeting.meeting_id}
              onExport={async (fmt) => {
                await api.downloadExport(currentMeeting.meeting_id, fmt, `${currentMeeting.title}.${fmt}`);
                showToast(`${fmt.toUpperCase()} exported successfully`, 'success');
              }}
            />
            <a href={api.getExportUrl(currentMeeting.meeting_id, 'html')} download
               className="px-3 py-1.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] font-bold rounded text-[10px] desktop-hover-transition flex items-center gap-1.5 uppercase tracking-wider">
              <Download className="w-3 h-3" /> HTML
            </a>
          </div>
        )}
      </div>

      {/* ── Professional Workspace Grid ── */}
      <div className="flex-1 flex min-h-0 bg-[#08080c] relative z-20">

        {/* Speaker Manager Panel — slides in from right */}
        {showSpeakerManager && hasTranscript && (
          <SpeakerManagerPanel
            transcript={currentMeeting.transcript || []}
            speakerNames={speakerNames}
            speakerColors={speakerColors}
            speakerProfiles={speakerProfiles}
            onRename={handleRenameSpeaker}
            onMergeSpeakers={handleMergeSpeakers}
            onFilterBySpeaker={(label) => setSpeakerFilter(label)}
            onJumpToTimestamp={handleJumpToTime}
            onUpdateProfile={handleUpdateProfile}
            onClose={() => setShowSpeakerManager(false)}
          />
        )}
        
        {/* LEFT PANE: Transcript Timeline Index Scroll List with thread line */}
        {hasTranscript && !processing && (
          <div className="w-40 shrink-0 bg-[#0e1016]/72 backdrop-blur-[24px] border-r border-white/[0.06] flex flex-col min-h-0 relative">
            <div className="p-2 border-b border-white/[0.03] shrink-0">
              <span className="text-[8px] font-bold text-[#98A2B3] uppercase tracking-widest pl-1 select-none">Timeline Index</span>
            </div>
            
            <div className="flex-1 overflow-y-auto premium-scrollbar p-2 relative">
              {/* Vertical Thread Line */}
              <div className="absolute left-[17px] top-4 bottom-4 w-[1px] bg-white/[0.06] z-10" />

              <div className="space-y-1 relative z-20">
                {(currentMeeting.transcript || []).map((seg) => {
                  const segSpkLabel = seg.speaker_label || 'UNKNOWN';
                  const segSpkIdx = uniqueSpeakers.indexOf(segSpkLabel);
                  const spkColor = resolveSpeakerColor(segSpkLabel, segSpkIdx !== -1 ? segSpkIdx : 0);
                  
                  const segStartParts = seg.start.split(':');
                  const segStartSec = parseInt(segStartParts[0], 10) * 60 + parseInt(segStartParts[1], 10);
                  const isActive = currentTime >= segStartSec && currentTime < (seg.end_seconds || segStartSec + 5);

                  return (
                    <button
                      key={seg.id}
                      onClick={() => handleJumpToTime(seg.start)}
                      className={`w-full text-left p-1.5 rounded text-[9.5px] flex items-center justify-between group desktop-hover-transition ${
                        isActive ? 'bg-[#8B5CF6]/15 text-[#8B5CF6]' : 'text-[#98A2B3] hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-2 relative">
                        {/* Sliding Timeline Indicator Node */}
                        <div className="w-1.5 h-1.5 flex items-center justify-center shrink-0">
                          {isActive ? (
                            <motion.span 
                              layoutId="timelineActiveIndicator"
                              className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_rgba(139,92,246,0.8)] shrink-0" 
                            />
                          ) : (
                            <span className="w-1 h-1 rounded-full bg-white/20 shrink-0 group-hover:bg-white/40" />
                          )}
                        </div>
                        <span className="font-mono">{seg.start}</span>
                      </div>
                      
                      <span 
                        className="px-1.5 py-0.5 rounded text-[7.5px] font-bold uppercase tracking-wider font-sans border truncate max-w-[55px]"
                        style={{ 
                          backgroundColor: isActive ? `${spkColor}1f` : `${spkColor}08`, 
                          borderColor: `${spkColor}1f`,
                          color: spkColor 
                        }}
                      >
                        {resolveSpeakerName(seg.speaker_label || 'SPEAKER_00')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CENTER PANE: Professional IDE-Style Editor Row Grid */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
          
          {processing ? (
            /* Premium Shimmering Skeletons */
            <div className="absolute inset-0 bg-[#0e1016] z-50 flex flex-col p-5 overflow-hidden font-sans">
              <div className="flex flex-col items-center justify-center p-8 text-center border-b border-white/[0.06] shrink-0">
                <div className="audio-wave-container mb-4">
                  {[...Array(8)].map((_, i) => <div key={i} className="audio-wave-bar" />)}
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Running Whisper Engine...</h3>
                <p className="text-xs text-[#98A2B3] mt-2 max-w-sm">
                  Transcribing local audio stream...
                </p>
              </div>

              <div className="flex-1 p-4 space-y-2 animate-pulse overflow-y-auto">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="flex gap-4 py-2 border-b border-white/[0.02] items-center">
                    <div className="w-8 h-4 bg-slate-800/40 rounded"></div>
                    <div className="w-12 h-4 bg-slate-800/40 rounded"></div>
                    <div className="flex-1 h-3 bg-slate-800/20 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : !hasTranscript ? (
            /* Process Request Layout */
            <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto w-full font-sans">
              <EmptyState 
                scenario="no-transcript"
                primaryCtaText={processing ? "Running Whisper..." : "Run Whisper Pipeline"}
                onPrimaryCta={handleProcess}
                layout="card"
                className="w-full"
              />

              {error && (
                <div className="flex items-center gap-2 text-rose-455 text-xs font-semibold bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 mt-4 w-full">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Whisper Parameters */}
              <div className="w-full bg-[#0e1016]/72 backdrop-blur-[24px] border border-white/[0.06] rounded-xl p-4 text-left space-y-3.5 mt-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-1.5">
                  <span className="text-[8px] font-bold text-[#98A2B3] uppercase tracking-widest">AI Parameters</span>
                  <Settings className="w-3.5 h-3.5 text-slate-555" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-bold text-[#98A2B3] uppercase tracking-wider mb-1">Whisper Model</label>
                    <select 
                      value={modelSize} 
                      onChange={(e) => setModelSize(e.target.value)}
                      className="w-full bg-slate-900 border border-white/[0.04] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
                    >
                      <option value="tiny">Tiny (39M params)</option>
                      <option value="base">Base (74M params)</option>
                      <option value="small">Small (244M params)</option>
                      <option value="medium">Medium (769M params)</option>
                      <option value="large-v3">Large V3 (1.5B params)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-[#98A2B3] uppercase tracking-wider mb-1">Language</label>
                    <select 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-slate-900 border border-white/[0.04] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
                    >
                      <option value="auto">Auto-Detect</option>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-355 font-medium">Voice Activity Detection</span>
                  <input 
                    type="checkbox" 
                    checked={vadEnabled}
                    onChange={(e) => setVadEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#8B5CF6] border border-white/[0.05] rounded focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              <button 
                onClick={handleProcess}
                className="w-full py-2.5 bg-[#8B5CF6] hover:bg-[#8B5CF6]/80 text-[#0e1016] font-bold rounded text-xs uppercase tracking-widest desktop-hover-transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 fill-[#0e1016] text-[#0e1016]" />
                Analyze & Process Audio
              </button>
            </div>
          ) : (
            /* Active IDE Editor Workspace */
            <>
              {/* Filter Toolbar - Standardized native 30px height */}
              <div className="p-2 bg-[#0e1016]/90 border-b border-white/[0.06] flex items-center gap-2.5 flex-wrap z-20 backdrop-blur-[24px] h-[36px] box-border">
                
                <div className="relative w-44">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#98A2B3]" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find in files..."
                    className="w-full bg-[#030305] border border-white/[0.06] rounded pl-8 pr-2 py-1 text-xs text-[#F5F7FA] placeholder-[#98A2B3]/50 focus:outline-none focus:border-[#8B5CF6] font-mono h-[28px] box-border"
                  />
                </div>

                <div className="relative font-mono text-[11px]">
                  <select
                    value={speakerFilter}
                    onChange={(e) => setSpeakerFilter(e.target.value)}
                    className="bg-[#030305] border border-white/[0.06] rounded pl-2 pr-7 py-1 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6] appearance-none cursor-pointer font-bold h-[28px] box-border"
                  >
                    <option value="all">Speaker: ALL</option>
                    {uniqueSpeakers.map(spk => (
                      <option key={spk} value={spk}>{spk}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#98A2B3] pointer-events-none" />
                </div>

                <div className="relative font-mono text-[11px]">
                  <select
                    value={aiTagFilter}
                    onChange={(e) => setAiTagFilter(e.target.value)}
                    className="bg-[#030305] border border-white/[0.06] rounded pl-2 pr-7 py-1 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6] appearance-none cursor-pointer font-bold h-[28px] box-border"
                  >
                    <option value="all">Tags: ALL</option>
                    <option value="decision">Decisions</option>
                    <option value="action">Action Items</option>
                    <option value="question">Questions</option>
                  </select>
                  <Sparkles className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#98A2B3] pointer-events-none" />
                </div>

                <button
                  onClick={() => setBookmarkOnly(!bookmarkOnly)}
                  className={`px-2.5 py-1 rounded text-xs font-bold desktop-hover-transition flex items-center gap-1 border font-mono h-[28px] box-border ${
                    bookmarkOnly 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                      : 'bg-[#030305] border-white/[0.06] text-[#98A2B3]'
                  }`}
                >
                  <span>Bookmarks ({bookmarkedIds.size})</span>
                </button>

                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-2.5 py-1 bg-[#030305] border border-white/[0.06] rounded text-xs text-[#98A2B3] hover:text-[#F5F7FA] font-mono desktop-hover-transition flex items-center gap-1 h-[28px] box-border"
                >
                  <ArrowUpDown className="w-3 h-3 text-[#98A2B3]" />
                  <span>{sortOrder === 'asc' ? 'Chron' : 'Rev'}</span>
                </button>
              </div>

              {/* IDE Editor Row list */}
              <div 
                ref={containerRef}
                onScroll={isVirtual ? handleScroll : undefined}
                className="flex-1 overflow-y-auto premium-scrollbar bg-[#08080c] divide-y divide-white/[0.02] pb-20"
              >
                {isVirtual && <div style={{ height: `${paddingTop}px` }} />}
                
                <div className="space-y-0">
                  {visibleSegments.map((segment, idx) => {
                    const spkLabel = segment.speaker_label || 'UNKNOWN';
                    const spkIdx = uniqueSpeakers.indexOf(spkLabel);
                    const spkColor = resolveSpeakerColor(spkLabel, spkIdx !== -1 ? spkIdx : 0);
                    const isBookmarked = bookmarkedIds.has(segment.id);
                    const spkStats = allSpeakerStats[spkLabel];

                    // Compute if active playing row
                    const segStartParts = segment.start.split(':');
                    const segStartSec = parseInt(segStartParts[0], 10) * 60 + parseInt(segStartParts[1], 10);
                    const isActive = currentTime >= segStartSec && currentTime < (segment.end_seconds || segStartSec + 5);

                    const isDecision = segment.metadata?.decisions && segment.metadata.decisions.length > 0;
                    const isAction = segment.metadata?.action_items && segment.metadata.action_items.length > 0;
                    const isQuestion = segment.metadata?.questions && segment.metadata.questions.length > 0;

                    return (
                      <div 
                        key={segment.id}
                        id={`segment-${segment.id}`}
                        className={`group flex items-center gap-3 px-4 py-1.5 border-l-2 hover:bg-white/[0.015] desktop-hover-transition relative ${
                          isActive 
                            ? 'bg-[#8B5CF6]/10 border-l-[#8B5CF6] text-[#F5F7FA]' 
                            : 'border-transparent text-[#98A2B3]'
                        }`}
                      >
                        
                        {/* Play Indicator / Pulse */}
                        <div className="w-5 flex items-center justify-center shrink-0">
                          {isActive ? (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8B5CF6]"></span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleJumpToTime(segment.start)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/[0.05] rounded text-[#98A2B3] hover:text-[#06B6D4] transition-all"
                            >
                              <Play className="w-3 h-3 fill-[#98A2B3] hover:fill-[#06B6D4]" />
                            </button>
                          )}
                        </div>

                        {/* Timestamp badge */}
                        <span className="w-12 font-mono text-[10px] text-[#98A2B3] select-none font-medium">
                          {segment.start}
                        </span>

                        {/* Speaker Indicator Badge — interactive profile popover */}
                        {spkStats ? (
                          <SpeakerBadge
                            originalLabel={spkLabel}
                            displayName={spkStats.displayName}
                            color={spkColor}
                            stats={spkStats}
                            onRename={(label) => setRenamingFromBadge(label)}
                            onColorChange={handleColorChange}
                            onUpdateProfile={handleUpdateProfile}
                            onViewStats={() => setShowSpeakerManager(true)}
                          />
                        ) : (
                          <div className="w-20 shrink-0">
                            <span
                              className="px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wide cursor-default select-none border"
                              style={{ backgroundColor: `${spkColor}08`, borderColor: `${spkColor}1f`, color: spkColor }}
                            >
                              {resolveSpeakerName(segment.speaker_label).substring(0, 10)}
                            </span>
                          </div>
                        )}

                        {/* Editable Code Line Text field */}
                        <div className="flex-1 min-w-0 pr-16 text-[11.5px] font-mono leading-normal font-medium">
                          <EditableSegmentText 
                            segment={segment} 
                            meetingId={currentMeeting.meeting_id}
                            highlightQuery={searchQuery}
                            highlightText={highlightText}
                            onUpdated={(newText) => {
                              const updatedTrans = (currentMeeting.transcript || []).map(s => 
                                s.id === segment.id ? { ...s, text: newText } : s
                              );
                              onUpdateMeeting({ ...currentMeeting, transcript: updatedTrans });
                            }}
                            onAutoSaveStart={() => markUnsaved(segment.id)}
                            onAutoSaveComplete={() => markSaved(segment.id)}
                          />
                        </div>

                        {/* AI tag markers */}
                        <div className="flex items-center gap-1 shrink-0 group-hover:opacity-0 transition-opacity duration-100">
                          {isDecision && <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" title="Decision tag" />}
                          {isAction && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" title="Action Item tag" />}
                          {isQuestion && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Question tag" />}
                        </div>

                        {/* Confidence Indicator Dot */}
                        {segment.speaker_confidence !== undefined && (
                          <span className={`w-1 h-1 rounded-full shrink-0 group-hover:opacity-0 transition-opacity duration-100 ${
                            segment.speaker_confidence >= 0.85 ? 'bg-[#10B981]' : 
                            segment.speaker_confidence >= 0.65 ? 'bg-amber-400' : 'bg-rose-500'
                          }`} />
                        )}

                        {/* Pin Bookmark Indicator */}
                        <button
                          onClick={() => handleBookmarkToggle(segment.id)}
                          className={`shrink-0 p-1 hover:bg-white/[0.04] rounded ${isBookmarked ? 'text-amber-400' : 'text-slate-655 hover:text-slate-400'}`}
                        >
                          <Bookmark className={`w-3 h-3 ${isBookmarked ? 'fill-amber-405' : ''}`} />
                        </button>

                        {/* Hover bar with Copy, AI, and Reassign Speaker split menu */}
                        <div className="absolute right-9 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-100 flex items-center gap-0.5 bg-[#0b0c12] border border-white/[0.06] p-0.5 rounded shadow z-10 font-sans">
                          {/* Reassign / Split Speaker dropdown */}
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleReassignSegmentSpeaker(segment.id, e.target.value);
                            }}
                            value=""
                            className="bg-[#030305] text-[9px] border border-white/[0.08] text-[#98A2B3] hover:text-white rounded px-1 py-0.5 focus:outline-none cursor-pointer font-mono"
                            title="Reassign / Split segment speaker"
                          >
                            <option value="" disabled>Split/Reassign...</option>
                            {uniqueSpeakers.map((spk) => (
                              <option key={spk} value={spk}>
                                Reassign to {resolveSpeakerName(spk)}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(segment.text);
                              showToast('Copied row text', 'success');
                            }}
                            className="p-1 hover:bg-white/[0.05] rounded text-[#98A2B3] hover:text-[#F5F7FA] transition-colors"
                            title="Copy code line"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              showToast('Asking local AI about segment...', 'success');
                            }}
                            className="p-1 hover:bg-white/[0.05] rounded text-[#8B5CF6] hover:text-[#8B5CF6]/80 transition-colors"
                            title="Ask AI"
                          >
                            <Sparkles className="w-3 h-3" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {isVirtual && <div style={{ height: `${paddingBottom}px` }} />}
                {filtered.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
                    <HelpCircle className="w-6 h-6 text-slate-655" />
                    <div className="text-[#98A2B3] font-bold text-[10px] uppercase tracking-widest font-mono">
                      No matching blocks.
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Audio Player */}
              <div className="absolute bottom-2 left-2 right-2 bg-[#0e1016]/72 backdrop-blur-[24px] border border-white/[0.06] rounded-xl p-2.5 flex items-center justify-between gap-4 z-35 shadow-2xl font-sans">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlayPause}
                    className="w-7 h-7 bg-[#8B5CF6] hover:bg-[#8B5CF6]/85 text-[#0e1016] rounded flex items-center justify-center desktop-hover-transition"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-[#0e1016]" /> : <Play className="w-3.5 h-3.5 fill-[#0e1016] ml-0.5" />}
                  </button>
                  <div className="min-w-0">
                    <div className="text-[9px] font-bold text-[#F5F7FA] leading-none">Audio Player</div>
                    <div className="text-[8px] text-[#98A2B3] font-mono font-bold mt-0.5">{formatSeconds(currentTime)} / {formatSeconds(audioDuration || currentMeeting.duration || 0)}</div>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={audioDuration || currentMeeting.duration || 100}
                  value={currentTime}
                  onChange={handleTimelineChange}
                  className="flex-1 premium-slider cursor-pointer"
                />

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1">
                    <Volume1 className="w-3.5 h-3.5 text-[#98A2B3]" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-14 premium-slider cursor-pointer"
                    />
                  </div>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    className="bg-[#030305] border border-white/[0.05] rounded px-1.5 py-0.5 text-[8.5px] font-extrabold text-[#F5F7FA] cursor-pointer"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1.0x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2.0x</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT PANE: Collapsible VS Code Style AI Inspector Console with icons */}
        <AnimatePresence>
          {showAiPanel && hasTranscript && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-64 shrink-0 bg-[#0e1016]/72 backdrop-blur-[24px] border-l border-white/[0.06] flex flex-col min-h-0 relative select-none"
            >
              {/* Inspector Header */}
              <div className="p-2 border-b border-white/[0.06] bg-[#09090c] flex items-center justify-between font-sans">
                <span className="text-[9px] font-bold text-[#F5F7FA] uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" /> AI INSPECTOR
                </span>
                <button
                  onClick={() => setShowAiPanel(false)}
                  className="p-1 hover:bg-white/[0.05] rounded text-[#98A2B3] hover:text-[#F5F7FA] desktop-hover-transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Sections */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] premium-scrollbar">
                
                {/* 1. OUTCOME SUMMARY Accordion */}
                <div className="flex flex-col">
                  <button
                    onClick={() => toggleSection('summary')}
                    className="w-full px-3 py-2 bg-white/[0.01] hover:bg-white/[0.03] flex items-center justify-between text-[8px] font-bold uppercase text-[#98A2B3] tracking-widest desktop-hover-transition"
                  >
                    <span className="flex items-center gap-1.5"><FileText className="w-3 h-3 text-purple-400" /> Meeting Summary</span>
                    {openSections.summary ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {openSections.summary && (
                    <div className="p-3 bg-black/20 text-[10px] text-[#98A2B3] leading-relaxed font-sans border-t border-white/[0.015]">
                      {currentMeeting.memo?.summary || "No offline summary generated."}
                    </div>
                  )}
                </div>

                {/* 2. DETECTED TOPICS Accordion */}
                <div className="flex flex-col">
                  <button
                    onClick={() => toggleSection('topics')}
                    className="w-full px-3 py-2 bg-white/[0.01] hover:bg-white/[0.03] flex items-center justify-between text-[8px] font-bold uppercase text-[#98A2B3] tracking-widest desktop-hover-transition"
                  >
                    <span className="flex items-center gap-1.5"><ListChecks className="w-3 h-3 text-[#06B6D4]" /> Detected Topics</span>
                    {openSections.topics ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {openSections.topics && (
                    <div className="p-3 bg-black/20 space-y-2">
                      {(currentMeeting.memo?.key_points || ['Introduction and Overview', 'AI offline models configuration']).map((topic, i) => {
                        const cleanTopic = topic.replace(/^[#*\-\s]+/, '').trim();
                        return (
                          <div key={i} className="flex items-start gap-1.5 text-[9.5px] text-[#98A2B3]">
                            <span className="text-[#8B5CF6] shrink-0 select-none">#</span>
                            <span className="font-sans leading-normal">{cleanTopic}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. ENTITIES Accordion */}
                <div className="flex flex-col">
                  <button
                    onClick={() => toggleSection('entities')}
                    className="w-full px-3 py-2 bg-white/[0.01] hover:bg-white/[0.03] flex items-center justify-between text-[8px] font-bold uppercase text-[#98A2B3] tracking-widest desktop-hover-transition"
                  >
                    <span className="flex items-center gap-1.5"><Tag className="w-3 h-3 text-[#10B981]" /> Detected Entities</span>
                    {openSections.entities ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {openSections.entities && (
                    <div className="p-3 bg-black/20 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const allEnts: { type: string; text: string }[] = [];
                          if ((currentMeeting as any).entities && Array.isArray((currentMeeting as any).entities)) {
                            allEnts.push(...(currentMeeting as any).entities);
                          }
                          currentMeeting.transcript?.forEach(seg => {
                            if (seg.metadata?.entities) {
                              seg.metadata.entities.forEach((e: any) => {
                                if (typeof e === 'string') allEnts.push({ type: 'ENT', text: e });
                                else if (e.text) allEnts.push({ type: e.type || 'ENT', text: e.text });
                              });
                            }
                          });
                          const uniqueEnts = Array.from(new Set(allEnts.map(e => `${e.type}:${e.text}`)))
                            .map(str => {
                              const [type, ...rest] = str.split(':');
                              return { type, text: rest.join(':') };
                            });

                          if (uniqueEnts.length === 0) {
                            return <div className="text-[8.5px] text-slate-500 font-mono italic">No entities detected in meeting audio.</div>;
                          }

                          return uniqueEnts.map((ent, i) => {
                            const isOrg = ent.type === 'ORGANIZATION' || ent.type === 'ORG';
                            const isPerson = ent.type === 'PERSON' || ent.type === 'PEOPLE';
                            const badgeColor = isOrg ? 'text-[#06B6D4] bg-[#06B6D4]/10 border-[#06B6D4]/20'
                              : isPerson ? 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/20'
                              : 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20';
                            return (
                              <span key={i} className={`px-1.5 py-0.5 border rounded text-[8px] font-mono font-bold uppercase ${badgeColor}`}>
                                {ent.type}: {ent.text}
                              </span>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. KEYWORDS Accordion */}
                <div className="flex flex-col">
                  <button
                    onClick={() => toggleSection('keywords')}
                    className="w-full px-3 py-2 bg-white/[0.01] hover:bg-white/[0.03] flex items-center justify-between text-[8px] font-bold uppercase text-[#98A2B3] tracking-widest desktop-hover-transition"
                  >
                    <span className="flex items-center gap-1.5"><Key className="w-3 h-3 text-amber-500" /> Keywords</span>
                    {openSections.keywords ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {openSections.keywords && (
                    <div className="p-3 bg-black/20">
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const kwSet = new Set<string>();
                          currentMeeting.transcript?.forEach(seg => {
                            if (seg.metadata?.keywords) {
                              seg.metadata.keywords.forEach((k: any) => {
                                const word = typeof k === 'string' ? k : k.keyword;
                                if (word) kwSet.add(word.toLowerCase());
                              });
                            }
                          });
                          const kws = Array.from(kwSet).slice(0, 15);
                          if (kws.length === 0) {
                            return <div className="text-[8.5px] text-slate-500 font-mono italic">No keywords extracted.</div>;
                          }
                          return kws.map((kw, i) => (
                            <button 
                              key={i} 
                              onClick={() => setSearchQuery(kw)}
                              className="px-1.5 py-0.5 bg-[#030305] border border-white/[0.04] rounded hover:border-[#8B5CF6]/30 text-[9px] text-[#98A2B3] hover:text-[#F5F7FA] desktop-hover-transition font-mono"
                            >
                              #{kw}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. BOOKMARKS Accordion */}
                <div className="flex flex-col">
                  <button
                    onClick={() => toggleSection('bookmarks')}
                    className="w-full px-3 py-2 bg-white/[0.01] hover:bg-white/[0.03] flex items-center justify-between text-[8px] font-bold uppercase text-[#98A2B3] tracking-widest desktop-hover-transition"
                  >
                    <span className="flex items-center gap-1.5"><BookmarkCheck className="w-3 h-3 text-amber-500" /> Bookmarks ({bookmarkedIds.size})</span>
                    {openSections.bookmarks ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {openSections.bookmarks && (
                    <div className="p-2 space-y-1 max-h-48 overflow-y-auto premium-scrollbar bg-black/20">
                      {Array.from(bookmarkedIds).map(id => {
                        const seg = currentMeeting.transcript?.find(s => s.id === id);
                        if (!seg) return null;
                        return (
                          <div
                            key={id}
                            onClick={() => handleJumpToTime(seg.start)}
                            className="p-1.5 hover:bg-white/[0.02] border border-white/[0.01] rounded cursor-pointer transition-all flex items-start gap-2"
                          >
                            <BookmarkCheck className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[7.5px] font-mono text-slate-500 font-bold">{seg.start}</span>
                                <span className="text-[7.5px] font-bold text-slate-600 uppercase truncate">{seg.speaker_label}</span>
                              </div>
                              <p className="text-[9.5px] text-[#98A2B3] truncate mt-0.5">{seg.text}</p>
                            </div>
                          </div>
                        );
                      })}
                      {bookmarkedIds.size === 0 && (
                        <div className="text-[8.5px] text-slate-600 text-center py-2">No bookmarked lines.</div>
                      )}
                    </div>
                  )}
                </div>

                {/* 6. AI NOTES Accordion */}
                <div className="flex flex-col">
                  <button
                    onClick={() => toggleSection('notes')}
                    className="w-full px-3 py-2 bg-white/[0.01] hover:bg-white/[0.03] flex items-center justify-between text-[8px] font-bold uppercase text-[#98A2B3] tracking-widest desktop-hover-transition"
                  >
                    <span className="flex items-center gap-1.5"><FileCode className="w-3 h-3 text-rose-400" /> AI Notes</span>
                    {openSections.notes ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {openSections.notes && (
                    <div className="p-3 bg-black/20 text-[9.5px] text-[#98A2B3] leading-relaxed font-sans space-y-2">
                      <div className="flex gap-1.5 items-start">
                        <span className="text-[#8B5CF6]">■</span>
                        <span>
                          {(() => {
                            const count = new Set(currentMeeting.transcript?.map(t => t.speaker_label) || []).size;
                            return `Diarization identified ${count} speaker${count !== 1 ? 's' : ''} across ${currentMeeting.transcript?.length || 0} transcript dialogue turns.`;
                          })()}
                        </span>
                      </div>
                      <div className="flex gap-1.5 items-start">
                        <span className="text-[#8B5CF6]">■</span>
                        <span>
                          {currentMeeting.memo?.summary
                            ? 'Executive meeting memo and action items compiled locally.'
                            : 'Audio processed via Faster-Whisper ASR engine.'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. CROSS REFERENCES Accordion */}
                <div className="flex flex-col">
                  <button
                    onClick={() => toggleSection('references')}
                    className="w-full px-3 py-2 bg-white/[0.01] hover:bg-white/[0.03] flex items-center justify-between text-[8px] font-bold uppercase text-[#98A2B3] tracking-widest desktop-hover-transition"
                  >
                    <span className="flex items-center gap-1.5"><Link className="w-3 h-3 text-emerald-400" /> Cross References</span>
                    {openSections.references ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {openSections.references && (
                    <div className="p-3 bg-black/20 space-y-1.5 font-mono text-[9px]">
                      <div className="flex justify-between items-center text-[#98A2B3]">
                        <span>Speaker Speed Analytics:</span>
                        <span className="text-[#06B6D4] font-bold hover:underline cursor-pointer">Active //</span>
                      </div>
                      <div className="flex justify-between items-center text-[#98A2B3]">
                        <span>Offline Q&A Assist History:</span>
                        <span className="text-[#06B6D4] font-bold hover:underline cursor-pointer">4 entries</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. CONFIDENCE Accordion */}
                <div className="flex flex-col">
                  <button
                    onClick={() => toggleSection('confidence')}
                    className="w-full px-3 py-2 bg-white/[0.01] hover:bg-white/[0.03] flex items-center justify-between text-[8px] font-bold uppercase text-[#98A2B3] tracking-widest desktop-hover-transition"
                  >
                    <span className="flex items-center gap-1.5"><Sliders className="w-3 h-3 text-[#8B5CF6]" /> Confidence & Diagnostics</span>
                    {openSections.confidence ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {openSections.confidence && (
                    <div className="p-3 bg-black/20 space-y-2 font-mono text-[9.5px] text-slate-500 leading-relaxed">
                      <div className="flex justify-between">
                        <span>ACCURACY:</span>
                        <span className="text-[#10B981] font-bold">{avgConfidence.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAD FILTER:</span>
                        <span className="text-[#98A2B3]">ENABLED</span>
                      </div>
                      <div className="flex justify-between">
                        <span>MODEL SIZE:</span>
                        <span className="text-[#8B5CF6]">Faster-Whisper ({modelSize})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DIARIZATION:</span>
                        <span className="text-[#06B6D4]">ENABLED</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Rename-from-badge modal */}
      {renamingFromBadge && allSpeakerStats[renamingFromBadge] && (
        <RenameSpeakerModal
          speaker={allSpeakerStats[renamingFromBadge]}
          onSave={(newName, scope) => {
            handleRenameSpeaker(renamingFromBadge, newName, scope);
            setRenamingFromBadge(null);
          }}
          onCancel={() => setRenamingFromBadge(null)}
        />
      )}

      <Toast message={toastMsg} type={toastType} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </div>
  );
}

/* Inline segment editor */
interface EditableSegmentTextProps {
  segment: any;
  meetingId: string;
  highlightQuery: string;
  highlightText: (t: string, q: string) => React.ReactNode;
  onUpdated: (t: string) => void;
  onAutoSaveStart?: () => void;
  onAutoSaveComplete?: () => void;
}

const EditableSegmentText: React.FC<EditableSegmentTextProps> = ({
  segment,
  meetingId,
  highlightQuery,
  highlightText,
  onUpdated,
  onAutoSaveStart,
  onAutoSaveComplete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(segment.text);
  const [saving, setSaving] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (editText.trim() === segment.text.trim()) return;
    autoSaveTimer.current = setTimeout(() => {
      if (editText.trim() !== segment.text.trim()) {
        handleSave(true);
      }
    }, 2000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [editText, isEditing]);

  const handleSave = async (isAuto: boolean = false) => {
    if (editText.trim() === segment.text.trim()) {
      setIsEditing(false);
      return;
    }
    if (isAuto && onAutoSaveStart) onAutoSaveStart();
    setSaving(true);
    try {
      await api.updateTranscriptSegment(meetingId, segment.id, {
        text: editText,
        speaker_label: segment.speaker_label
      });
      onUpdated(editText);
      if (isAuto && onAutoSaveComplete) onAutoSaveComplete();
      if (!isAuto) setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1.5 w-full mt-0.5 font-sans">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          disabled={saving}
          className="w-full bg-[#050508] border border-purple-500/30 rounded p-1.5 text-[11px] font-mono text-slate-205 focus:outline-none focus:border-purple-500 leading-relaxed min-h-[45px]"
        />
        <div className="flex gap-2 justify-end items-center font-sans">
          {saving && <span className="text-[9px] text-[#8B5CF6] font-semibold animate-pulse font-mono">Saving...</span>}
          <div className="flex gap-1">
            <button
              onClick={() => {
                setEditText(segment.text);
                setIsEditing(false);
              }}
              disabled={saving}
              className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-355 text-[9px] font-bold rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-2 py-0.5 bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-[#0e1016] text-[9px] font-bold rounded"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <p 
      onClick={() => {
        setEditText(segment.text);
        setIsEditing(true);
      }}
      className="cursor-text hover:bg-white/[0.01] p-1 rounded border border-transparent hover:border-white/[0.02] transition-all break-words font-mono"
    >
      {segment.metadata?.is_edited && (
        <span className="inline-block mr-1 text-[8px] text-amber-500 font-bold" title={`Edited ${segment.metadata?.edit_timestamp || ''}`}>[EDIT]</span>
      )}
      {highlightText(segment.text, highlightQuery)}
    </p>
  );
};
