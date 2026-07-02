import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Settings, 
  Play, 
  FileAudio,
  Sparkles,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Meeting } from '../types';
import { api } from '../services/api';

interface TranscriptPageProps {
  currentMeeting: Meeting;
  onUpdateMeeting: (meeting: Meeting) => void;
}

export const TranscriptPage: React.FC<TranscriptPageProps> = ({
  currentMeeting,
  onUpdateMeeting,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };
  
  // Processing settings state
  const [modelSize, setModelSize] = useState('base');
  const [language, setLanguage] = useState('auto');
  const [vadEnabled, setVadEnabled] = useState(true);

  // Load saved default settings from database on mount
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const saved = await api.getSettings();
        if (saved) {
          setModelSize(saved.model_size || 'base');
          setLanguage(saved.default_language || 'auto');
          setVadEnabled(saved.vad_enabled !== undefined ? saved.vad_enabled : true);
        }
      } catch (err) {
        console.error('Failed to load default settings:', err);
      }
    };
    loadSavedSettings();
  }, []);

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);
    try {
      const updated = await api.processMeeting(currentMeeting.meeting_id, {
        modelSize,
        language: language === 'auto' ? undefined : language,
        vadEnabled,
      });
      onUpdateMeeting(updated);
      if (updated.memo && updated.memo.summary.includes("Ollama service unavailable")) {
        setError("Ollama is not running. Summary generation unavailable.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process meeting. Please check model download or RAM capacity.');
    } finally {
      setProcessing(false);
    }
  };

  const getFilteredSegments = () => {
    if (!currentMeeting.transcript) return [];
    if (!searchQuery.trim()) return currentMeeting.transcript;
    const query = searchQuery.toLowerCase();
    return currentMeeting.transcript.filter(seg => 
      seg.text.toLowerCase().includes(query)
    );
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase()
            ? <mark key={i} className="bg-sky-400 text-slate-950 font-semibold px-0.5 rounded">{part}</mark>
            : part
        )}
      </span>
    );
  };

  const filtered = getFilteredSegments();
  const isVirtual = filtered.length > 50;
  
  const itemHeight = 88; 
  const containerHeight = 600; 
  const buffer = 5;

  const startIndex = isVirtual ? Math.max(0, Math.floor(scrollTop / itemHeight) - buffer) : 0;
  const endIndex = isVirtual ? Math.min(filtered.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer) : filtered.length;

  const visibleSegments = filtered.slice(startIndex, endIndex);
  const paddingTop = isVirtual ? startIndex * itemHeight : 0;
  const paddingBottom = isVirtual ? (filtered.length - endIndex) * itemHeight : 0;

  const hasTranscript = currentMeeting.transcript && currentMeeting.transcript.length > 0;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-8 flex flex-col h-screen">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{currentMeeting.title}</h1>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="font-medium">{new Date(currentMeeting.date).toLocaleDateString()}</span>
            <span className="w-1 h-1 bg-slate-800 rounded-full" />
            <span className="font-mono">{currentMeeting.duration ? `${(currentMeeting.duration / 60).toFixed(1)}m` : '0m'}</span>
            {hasTranscript && (
              <>
                <span className="w-1 h-1 bg-slate-800 rounded-full" />
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Processed</span>
              </>
            )}
          </div>
        </div>

        {/* Exports dropdown */}
        {hasTranscript && (
          <div className="flex gap-2">
            <a 
              href={api.getExportUrl(currentMeeting.meeting_id, 'pdf')} 
              download 
              className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </a>
            <a 
              href={api.getExportUrl(currentMeeting.meeting_id, 'docx')} 
              download 
              className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              DOCX
            </a>
            <a 
              href={api.getExportUrl(currentMeeting.meeting_id, 'txt')} 
              download 
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              TXT
            </a>
            <a 
              href={api.getExportUrl(currentMeeting.meeting_id, 'srt')} 
              download 
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              SRT
            </a>
          </div>
        )}
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl relative">
        {processing ? (
          /* Processing/Loading Layout */
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
            <div className="audio-wave-container mb-4">
              <div className="audio-wave-bar"></div>
              <div className="audio-wave-bar"></div>
              <div className="audio-wave-bar"></div>
              <div className="audio-wave-bar"></div>
              <div className="audio-wave-bar"></div>
              <div className="audio-wave-bar"></div>
              <div className="audio-wave-bar"></div>
              <div className="audio-wave-bar"></div>
            </div>
            <h3 className="text-xl font-bold text-white mt-4">Analyzing Audio & Transcribing</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm">
              Speech is being processed locally using Faster-Whisper. This may take a minute depending on hardware.
            </p>
            <div className="mt-6 flex gap-6 text-xs text-slate-500 font-mono">
              <div>MODEL: <span className="text-sky-400">{modelSize.toUpperCase()}</span></div>
              <div>LANGUAGE: <span className="text-sky-400">{language.toUpperCase()}</span></div>
              <div>VAD FILTER: <span className="text-sky-400">{vadEnabled ? 'ON' : 'OFF'}</span></div>
            </div>
            {/* Shimmering Skeleton Loader (Fix 1H) */}
            <div className="w-full max-w-md mx-auto space-y-4 animate-pulse mt-8 opacity-45">
              {[1, 2, 3].map(n => (
                <div key={n} className="flex gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="w-10 h-6 bg-slate-800 rounded-md flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-16 h-3 bg-slate-800 rounded-md"></div>
                    <div className="w-full h-3 bg-slate-800 rounded-md"></div>
                    <div className="w-3/4 h-3 bg-slate-800 rounded-md"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !hasTranscript ? (
          /* Process Request Layout */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto w-full space-y-6">
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner">
              <FileAudio className="w-8 h-8 text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Audio analysis required</h3>
              <p className="text-sm text-slate-400 mt-1">
                This meeting audio has been stored. You need to run local AI transcription and summarization to view the transcript.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-500 text-xs font-semibold bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Whisper Parameters */}
            <div className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-4 text-left space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Parameters</span>
                <Settings className="w-4 h-4 text-slate-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Whisper Model</label>
                  <select 
                    value={modelSize} 
                    onChange={(e) => setModelSize(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold"
                  >
                    <option value="tiny">Tiny (39M params)</option>
                    <option value="base">Base (74M params)</option>
                    <option value="small">Small (244M params)</option>
                    <option value="medium">Medium (769M params)</option>
                    <option value="large-v3">Large V3 (1.5B params)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Language</label>
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold"
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
                <span className="text-xs text-slate-300 font-medium">Voice Activity Detection</span>
                <input 
                  type="checkbox" 
                  checked={vadEnabled}
                  onChange={(e) => setVadEnabled(e.target.checked)}
                  className="w-4 h-4 accent-sky-400 border border-slate-800 rounded focus:ring-0"
                />
              </div>
            </div>

            <button 
              onClick={handleProcess}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-500/10 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
              Analyze & Process Audio
            </button>
          </div>
        ) : (
          /* Active Transcript Viewer Layout */
          <>
            {/* Speakers Drawer (Speakr Style) */}
            <div className="px-6 py-4 bg-slate-950/65 border-b border-slate-800/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  Diarized Speakers ({
                    Array.from(new Set((currentMeeting.transcript || []).map(s => s.speaker_label || 'UNKNOWN'))).length
                  })
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {Array.from(new Set((currentMeeting.transcript || []).map(s => s.speaker_label || 'UNKNOWN'))).map((spk, idx) => {
                  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
                  const spkColor = colors[idx % colors.length];
                  return (
                    <span 
                      key={spk} 
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-default"
                      style={{ 
                        backgroundColor: `${spkColor}0d`, 
                        borderColor: `${spkColor}2c`, 
                        color: spkColor 
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: spkColor }} />
                      {spk}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Search filter bar */}
            <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/20">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search keywords or sentences..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 font-medium"
                />
              </div>
              {searchQuery && (
                <span className="text-xs text-slate-400 font-semibold bg-slate-850 px-2 py-1 rounded-lg">
                  {getFilteredSegments().length} matches
                </span>
              )}
            </div>

            {/* Scrollable list of segments */}
            <div 
              ref={containerRef}
              onScroll={isVirtual ? handleScroll : undefined}
              className="flex-1 overflow-y-auto p-6"
            >
              {isVirtual && <div style={{ height: `${paddingTop}px` }} />}
              <div className="space-y-6">
                {visibleSegments.map((segment, idx) => {
                  const absoluteIndex = startIndex + idx;
                  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
                  
                  // Compute dynamic index based on all unique speaker tags
                  const allUniqueSpk = Array.from(new Set((currentMeeting.transcript || []).map(s => s.speaker_label || 'UNKNOWN')));
                  const spkIdx = allUniqueSpk.indexOf(segment.speaker_label || 'UNKNOWN');
                  const spkColor = colors[spkIdx !== -1 ? spkIdx % colors.length : 0];

                  return (
                    <motion.div 
                      key={segment.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(absoluteIndex * 0.03, 0.3) }}
                      whileHover={{ y: -1, transition: { duration: 0.1 } }}
                      className="flex gap-4 p-4 rounded-xl hover:bg-slate-900/20 border border-slate-900/10 hover:border-slate-800/35 transition-all duration-200"
                    >
                      {/* Timestamp indicator */}
                      <div className="flex-shrink-0 flex items-start mt-0.5">
                        <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-md text-[10px] text-sky-400 font-mono font-semibold">
                          {segment.start}
                        </span>
                      </div>
                      
                      {/* Text & Speaker bubble panel (Speakr Style) */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide"
                            style={{ 
                              backgroundColor: `${spkColor}12`, 
                              color: spkColor 
                            }}
                          >
                            {segment.speaker_label || 'UNKNOWN'}
                          </span>
                        </div>
                        
                        {/* Segment Text Input (Inline Editor Mode) */}
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
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {isVirtual && <div style={{ height: `${paddingBottom}px` }} />}
              {filtered.length === 0 && (
                <div className="py-12 text-center text-slate-500 font-medium">
                  No matching text found.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* Mini Component for Inline Segment Editing with Save & Exit triggers */
interface EditableSegmentTextProps {
  segment: any;
  meetingId: string;
  highlightQuery: string;
  highlightText: (t: string, q: string) => React.ReactNode;
  onUpdated: (t: string) => void;
}

const EditableSegmentText: React.FC<EditableSegmentTextProps> = ({
  segment,
  meetingId,
  highlightQuery,
  highlightText,
  onUpdated
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(segment.text);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (editText.trim() === segment.text.trim()) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await api.updateTranscriptSegment(meetingId, segment.id, {
        text: editText,
        speaker_label: segment.speaker_label
      });
      onUpdated(editText);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save transcript update.");
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 mt-1.5">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          disabled={saving}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 font-medium focus:outline-none focus:border-sky-400 leading-relaxed min-h-[70px]"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setIsEditing(false)}
            disabled={saving}
            className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-350 text-xs font-semibold rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <p 
      onClick={() => setIsEditing(true)}
      className="text-sm text-slate-200 leading-relaxed font-medium mt-1 cursor-text hover:bg-slate-900/40 p-1.5 rounded-lg border border-transparent hover:border-slate-850/50 transition-all"
    >
      {highlightText(segment.text, highlightQuery)}
    </p>
  );
};
