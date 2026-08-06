import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  BrainCircuit, 
  User, 
  AlertTriangle,
  Bot,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Trash2,
  WifiOff,
  Database,
  ExternalLink,
  Sparkles,
  FileText,
  CheckCircle2,
  ListChecks,
  ShieldAlert,
  HelpCircle as QuestionIcon,
  Mail,
  FileCheck,
  Languages,
  Search,
  SlidersHorizontal,
  FolderPlus,
  Users,
  Activity,
  Layers,
  Check,
  X,
  Copy,
  Download,
  Bookmark,
  RefreshCw,
  Eye,
  Code,
  Quote,
  Table as TableIcon
} from 'lucide-react';
import { Meeting, QAEntry } from '../types';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface QAPageProps {
  currentMeeting: Meeting;
  onUpdateMeeting: (meeting: Meeting) => void;
  onNavigateToTimestamp?: (timestamp: string) => void;
  isProcessing?: boolean;
  setActivePage?: (page: string) => void;
}

export const QAPage: React.FC<QAPageProps> = ({
  currentMeeting,
  onUpdateMeeting,
  onNavigateToTimestamp,
  isProcessing = false,
  setActivePage,
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [optimisticHistory, setOptimisticHistory] = useState<QAEntry[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [expandedSourcesId, setExpandedSourcesId] = useState<number | null>(null);

  const loadingTimeoutRef = useRef<any>(null);

  // Context Source Toggle States
  const [enabledSources, setEnabledSources] = useState<Record<string, boolean>>({
    transcript: true,
    summary: true,
    analytics: true,
    action_items: true,
    decisions: true,
    topics: true,
    speaker_info: true,
    uploaded_docs: false
  });

  const qaHistory = currentMeeting.qa_history || [];
  const displayHistory = [...qaHistory, ...optimisticHistory];

  const toggleSource = (sourceId: string) => {
    setEnabledSources(prev => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  };

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showFeedback("Response copied to clipboard");
  };

  const handleExportResponse = (entry: QAEntry) => {
    const blob = new Blob([`Q: ${entry.question}\n\nA:\n${entry.answer}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_response_${entry.id || 'export'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback("Exported card as TXT");
  };

  const toggleBookmark = (id: number) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showFeedback("Removed bookmark");
      } else {
        next.add(id);
        showFeedback("Bookmarked response card");
      }
      return next;
    });
  };

  // 8 Context Sources Data Config
  const contextSources = [
    {
      id: 'transcript',
      name: 'Transcript',
      status: 'ACTIVE',
      itemCount: `${currentMeeting.transcript?.length || 0} Segments`,
      lastUpdated: 'Just now',
      icon: FileText,
      color: 'text-sky-400'
    },
    {
      id: 'summary',
      name: 'Meeting Summary',
      status: currentMeeting.memo ? 'ACTIVE' : 'NO DATA',
      itemCount: currentMeeting.memo ? 'Executive Brief' : '0 Items',
      lastUpdated: '2m ago',
      icon: FileCheck,
      color: 'text-purple-400'
    },
    {
      id: 'analytics',
      name: 'Meeting Analytics',
      status: 'ACTIVE',
      itemCount: 'Health & WPM',
      lastUpdated: '1m ago',
      icon: Activity,
      color: 'text-emerald-400'
    },
    {
      id: 'action_items',
      name: 'Action Items',
      status: 'ACTIVE',
      itemCount: 'Audited Tasks',
      lastUpdated: 'Just now',
      icon: ListChecks,
      color: 'text-amber-400'
    },
    {
      id: 'decisions',
      name: 'Decisions',
      status: 'ACTIVE',
      itemCount: 'Decisions Log',
      lastUpdated: 'Just now',
      icon: CheckCircle2,
      color: 'text-[#10B981]'
    },
    {
      id: 'topics',
      name: 'Topics & Entities',
      status: 'ACTIVE',
      itemCount: 'Keywords & Tech',
      lastUpdated: '3m ago',
      icon: Layers,
      color: 'text-indigo-400'
    },
    {
      id: 'speaker_info',
      name: 'Speaker Information',
      status: 'ACTIVE',
      itemCount: 'Speaker Profiles',
      lastUpdated: 'Just now',
      icon: Users,
      color: 'text-rose-400'
    },
    {
      id: 'uploaded_docs',
      name: 'Uploaded Documents',
      status: 'FUTURE READY',
      itemCount: '0 Documents',
      lastUpdated: 'Standby',
      icon: FolderPlus,
      color: 'text-[#98A2B3]'
    }
  ];

  // Quick Action Chips
  const quickActions = [
    { label: 'Executive Summary', prompt: 'Provide a concise executive summary of this meeting.', icon: FileText },
    { label: 'Find Decisions', prompt: 'List all major decisions made during this meeting with speaker references.', icon: CheckCircle2 },
    { label: 'Find Action Items', prompt: 'List all action items, assignees, and deadlines.', icon: ListChecks },
    { label: 'Open Questions', prompt: 'What questions remain unresolved from this conversation?', icon: QuestionIcon },
    { label: 'Risks & Blockers', prompt: 'Highlight any operational risks, technical blockers, or dependencies identified.', icon: ShieldAlert },
    { label: 'Explain Topic', prompt: 'Explain the main technical architecture or topic discussed.', icon: Sparkles },
    { label: 'Generate Email', prompt: 'Draft a follow-up email summarizing key outcomes for stakeholders.', icon: Mail },
    { label: 'Create Minutes', prompt: 'Generate formal meeting minutes (MoM) with key points.', icon: FileCheck },
    { label: 'Translate Summary', prompt: 'Summarize key takeaways in clear, bulleted professional language.', icon: Languages },
    { label: 'Search Transcript', prompt: 'Where in the transcript is security or deployment mentioned?', icon: Search }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [qaHistory, optimisticHistory, loading]);

  const handleClearHistory = () => {
    onUpdateMeeting({
      ...currentMeeting,
      qa_history: []
    });
    setOptimisticHistory([]);
  };

  const handleSubmit = async (qText: string) => {
    const trimmed = qText.trim();
    if (!trimmed) return;

    setError(null);
    setQuestion('');

    const tempId = -Math.floor(Math.random() * 100000);
    const optimisticEntry: QAEntry = {
      id: tempId,
      meeting_id: currentMeeting.meeting_id,
      question: trimmed,
      answer: "",
      timestamp: new Date().toISOString(),
      confidence: 1.0
    };
    setOptimisticHistory(prev => [...prev, optimisticEntry]);

    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = setTimeout(() => {
      setLoading(true);
    }, 300);

    try {
      const entry = await api.askQuestion(currentMeeting.meeting_id, trimmed);
      
      // Simulate real-time token streaming for smooth LLM response reveal
      const words = entry.answer.split(' ');
      let currentText = '';
      for (let i = 0; i < words.length; i++) {
        currentText += (i === 0 ? '' : ' ') + words[i];
        const partialAnswer = currentText;
        setOptimisticHistory(prev =>
          prev.map(item => item.id === tempId ? { ...item, answer: partialAnswer } : item)
        );
        await new Promise(r => setTimeout(r, 25));
      }

      const updatedHistory = [...qaHistory, entry];
      onUpdateMeeting({
        ...currentMeeting,
        qa_history: updatedHistory
      });
      setOptimisticHistory(prev => prev.filter(item => item.id !== tempId));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve answer from local RAG engine.');
      setOptimisticHistory(prev => prev.filter(item => item.id !== tempId));
    } finally {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      setLoading(false);
    }
  };

  const handleFeedback = async (entry: QAEntry, helpful: boolean) => {
    if (!entry.id) return;
    const newHelpful = entry.was_helpful === (helpful ? 1 : 0) ? null : (helpful ? 1 : 0);
    try {
      await api.submitQAFeedback(currentMeeting.meeting_id, entry.id, newHelpful === null ? null : newHelpful === 1);
      const updatedHistory = qaHistory.map(item =>
        item.id === entry.id ? { ...item, was_helpful: newHelpful } : item
      );
      onUpdateMeeting({
        ...currentMeeting,
        qa_history: updatedHistory
      });
    } catch (err) {
      console.error("Feedback error", err);
    }
  };

  const hasTranscript = currentMeeting.transcript && currentMeeting.transcript.length > 0;

  if (!hasTranscript) {
    if (isProcessing) {
      return (
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950 flex flex-col items-center justify-center font-mono select-none">
          <div className="flex flex-col items-center justify-center gap-4 p-8 bg-[#0e1016]/90 border border-violet-500/20 backdrop-blur-xl rounded-2xl max-w-md w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 mb-2">
              <BrainCircuit className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Running AI Transcription...</h3>
            <p className="text-xs text-[#98A2B3] max-w-xs leading-relaxed font-sans">
              Audio processing is active in the background. The AI assistant workspace will populate automatically once the Whisper pipeline completes.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 p-6 overflow-y-auto bg-slate-950 flex flex-col items-center justify-center font-mono select-none">
        <div className="flex flex-col items-center justify-center gap-4 p-8 bg-[#0e1016]/90 border border-white/[0.08] rounded-2xl max-w-md w-full shadow-2xl text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-center text-[#98A2B3] mb-2">
            <AlertTriangle className="w-10 h-10 text-amber-400" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Transcript Required</h3>
          <p className="text-xs text-[#98A2B3] max-w-xs leading-relaxed font-sans mt-2">
            Please run the audio transcriber on the Transcript page before launching the meeting intelligence workspace.
          </p>
          {setActivePage && (
            <button 
              onClick={() => setActivePage('transcript')}
              className="mt-4 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-violet-600/25 transition-all duration-300 transform active:scale-[0.98] font-mono"
            >
              Go to Transcript
            </button>
          )}
        </div>
      </div>
    );
  }

  const activeSourcesCount = Object.values(enabledSources).filter(Boolean).length;

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-screen overflow-hidden text-[#F5F7FA] font-sans select-none relative">
      
      {/* Toast Notification Bar */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-4 right-6 z-50 px-3.5 py-2 bg-[#8B5CF6] text-white rounded-lg font-mono text-xs shadow-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 1. AI WORKSPACE HEADER */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#0e1016] border-b border-white/[0.08] px-6 py-3.5 flex items-center justify-between flex-wrap gap-4 shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
            <BrainCircuit className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider">
                Meeting Intelligence Workspace
              </h1>
              <span className="text-white/20">&middot;</span>
              <span className="text-[10px] text-[#98A2B3] truncate max-w-xs">{currentMeeting.title}</span>
            </div>
            <div className="flex items-center gap-3 text-[9.5px] text-[#98A2B3] mt-0.5">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <WifiOff className="w-3 h-3 text-emerald-400" /> LOCAL OFFLINE RAG
              </span>
              <span>&middot;</span>
              <span>MODEL: Qwen-2.5-7B (Local)</span>
              <span>&middot;</span>
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-[#8B5CF6]" /> Context Sources Enabled ({activeSourcesCount}/8)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 bg-white/[0.03] border border-white/[0.08] rounded text-[10px] text-[#98A2B3]">
            Conversations: <span className="text-white font-bold">{displayHistory.length}</span>
          </div>

          <button
            onClick={handleClearHistory}
            disabled={displayHistory.length === 0}
            className="px-3 py-1 bg-white/[0.03] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/20 text-[#98A2B3] hover:text-rose-400 disabled:opacity-40 rounded text-[10px] font-bold transition-all flex items-center gap-1.5 uppercase tracking-wider"
            title="Clear Conversation History"
          >
            <Trash2 className="w-3 h-3" /> Clear Context
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 2. QUICK ACTIONS BAR */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#080a0f] border-b border-white/[0.06] px-6 py-2 flex items-center gap-2 overflow-x-auto font-mono text-[10.5px] shrink-0 no-scrollbar">
        <span className="text-[9px] font-bold text-[#8B5CF6] uppercase tracking-widest shrink-0 pr-1">
          PROMPT CHIPS //
        </span>
        {quickActions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSubmit(act.prompt)}
              className="px-2.5 py-1 bg-[#0e1016] hover:bg-[#8B5CF6]/15 border border-white/[0.08] hover:border-[#8B5CF6]/30 text-[#C4C9D4] hover:text-white rounded-md transition-all shrink-0 flex items-center gap-1.5 font-sans text-xs"
            >
              <Icon className="w-3 h-3 text-[#8B5CF6]" />
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 3. MAIN AI WORKSPACE (2 Columns: Left Context Panel + Right Conversation) */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
        
        {/* LEFT COLUMN: Meeting Context Panel (4 Columns) */}
        <div className="lg:col-span-4 p-5 overflow-y-auto space-y-4 bg-[#080a0f]/80 font-mono text-xs select-none">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <h3 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider">
                Meeting Context Panel
              </h3>
            </div>
            <span className="text-[9px] text-[#8B5CF6] font-bold px-1.5 py-0.2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded">
              {activeSourcesCount} ENABLED
            </span>
          </div>

          <p className="text-[10px] font-sans text-[#98A2B3] leading-relaxed">
            Toggle context vector sources to include or exclude specific metadata layers before asking AI questions.
          </p>

          {/* 8 Context Source Cards Grid */}
          <div className="space-y-2.5">
            {contextSources.map((src) => {
              const Icon = src.icon;
              const isEnabled = enabledSources[src.id] ?? false;

              return (
                <div
                  key={src.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isEnabled
                      ? 'bg-[#0e1016] border-white/[0.1] shadow-lg'
                      : 'bg-[#030305]/60 border-white/[0.04] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] ${src.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#F5F7FA] truncate flex items-center gap-2">
                          {src.name}
                          <span className={`px-1.5 py-0.2 text-[8px] font-bold rounded uppercase ${
                            src.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-white/[0.05] text-[#98A2B3] border border-white/[0.08]'
                          }`}>
                            {src.status}
                          </span>
                        </div>
                        <div className="text-[9.5px] text-[#98A2B3] mt-0.5 flex items-center gap-2">
                          <span>{src.itemCount}</span>
                          <span>&middot;</span>
                          <span>{src.lastUpdated}</span>
                        </div>
                      </div>
                    </div>

                    {/* Context Toggle Switch */}
                    <button
                      onClick={() => toggleSource(src.id)}
                      className={`w-9 h-5 rounded-full border transition-colors flex items-center p-0.5 ${
                        isEnabled
                          ? 'bg-[#8B5CF6] border-[#8B5CF6] justify-end'
                          : 'bg-white/[0.05] border-white/[0.1] justify-start'
                      }`}
                      title={isEnabled ? `Disable ${src.name}` : `Enable ${src.name}`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-white shadow-md flex items-center justify-center text-[8px]">
                        {isEnabled ? <Check className="w-2.5 h-2.5 text-[#8B5CF6]" /> : <X className="w-2.5 h-2.5 text-[#98A2B3]" />}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Conversation Workspace & Structured Response Cards (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col min-h-0 bg-slate-950">
          
          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {displayHistory.length === 0 ? (
              /* AI Suggestions Panel */
              <div className="h-full flex flex-col justify-center max-w-xl mx-auto space-y-5 select-none font-mono py-6">
                <div className="flex items-center gap-3 bg-[#0e1016] p-3.5 border border-white/[0.08] rounded-xl shadow-2xl">
                  <div className="w-10 h-10 bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 rounded-lg flex items-center justify-center text-[#8B5CF6] shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider">
                      AI Suggested Intelligence Prompts
                    </h4>
                    <p className="text-[10.5px] text-[#98A2B3] mt-0.5 font-sans">
                      Intelligent prompts generated dynamically from active meeting transcript context. Click any chip to populate the prompt.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: 'Summarize this meeting.', icon: FileText, color: 'text-purple-400 border-purple-500/20' },
                    { label: 'What decisions were made?', icon: CheckCircle2, color: 'text-emerald-400 border-emerald-500/20' },
                    { label: 'List unresolved questions.', icon: QuestionIcon, color: 'text-amber-400 border-amber-500/20' },
                    { label: 'Generate follow-up email.', icon: Mail, color: 'text-sky-400 border-sky-500/20' },
                    { label: 'Show blockers.', icon: ShieldAlert, color: 'text-rose-400 border-rose-500/20' },
                    { label: 'Explain the technical discussion.', icon: Code, color: 'text-cyan-400 border-cyan-500/20' },
                    { label: 'Find everything Speaker 2 discussed.', icon: Users, color: 'text-indigo-400 border-indigo-500/20' },
                    { label: 'Translate executive summary.', icon: Languages, color: 'text-teal-400 border-teal-500/20' },
                    { label: 'Create project tasks.', icon: ListChecks, color: 'text-amber-400 border-amber-500/20' }
                  ].map((sug, i) => {
                    const SugIcon = sug.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => setQuestion(sug.label)}
                        className="p-3 bg-[#0e1016] hover:bg-[#8B5CF6]/15 border border-white/[0.08] hover:border-[#8B5CF6]/30 rounded-lg text-left transition-all hover:scale-[1.02] space-y-1.5 group font-sans"
                      >
                        <div className="flex items-center justify-between">
                          <SugIcon className={`w-3.5 h-3.5 ${sug.color.split(' ')[0]}`} />
                          <span className="text-[9px] font-mono text-[#98A2B3] group-hover:text-white font-bold uppercase">SUGGESTION</span>
                        </div>
                        <div className="text-[11.5px] font-semibold text-[#F5F7FA] leading-snug">
                          {sug.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              displayHistory.map((entry, idx) => {
                const confScore = entry.confidence ?? 0.85;
                const isBookmarked = bookmarkedIds.has(entry.id || idx);
                const isSourcesExpanded = expandedSourcesId === (entry.id || idx);

                // Identify Response Card Type
                const qLower = (entry.question || '').toLowerCase();
                const cardType = qLower.includes('decision') ? 'Decision Table' :
                  qLower.includes('action') ? 'Action Item List' :
                  qLower.includes('summary') ? 'Summary Card' :
                  qLower.includes('risk') || qLower.includes('blocker') ? 'Risk Report' :
                  qLower.includes('email') ? 'Email Draft' :
                  qLower.includes('code') || qLower.includes('technical') ? 'Code Block' :
                  qLower.includes('quote') || qLower.includes('said') ? 'Transcript Quote' :
                  'Structured Response Card';

                const cardIcon = cardType === 'Decision Table' ? CheckCircle2 :
                  cardType === 'Action Item List' ? ListChecks :
                  cardType === 'Summary Card' ? FileText :
                  cardType === 'Risk Report' ? ShieldAlert :
                  cardType === 'Email Draft' ? Mail :
                  cardType === 'Code Block' ? Code :
                  cardType === 'Transcript Quote' ? Quote :
                  Sparkles;

                const IconComponent = cardIcon;

                return (
                  <div key={entry.id ?? idx} className="space-y-3 font-sans">
                    {/* User Question Command Row */}
                    <div className="flex justify-end font-mono">
                      <div className="bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-white text-xs font-semibold px-4 py-2.5 rounded-xl max-w-[80%] shadow-lg flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#8B5CF6]" />
                        <span>{entry.question}</span>
                      </div>
                    </div>

                    {/* AI Structured Response Card */}
                    {entry.answer && (
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#0e1016] border border-white/[0.08] flex items-center justify-center text-[#8B5CF6] shrink-0 font-mono text-xs font-bold mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        
                        <div className="flex-1 bg-[#0e1016]/90 border border-white/[0.08] rounded-xl p-4 space-y-4 max-w-[95%] shadow-2xl font-mono text-xs">
                          
                          {/* Card Header & Toolbar */}
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4 text-[#8B5CF6]" />
                              <span className="text-[11px] font-bold text-[#F5F7FA] uppercase tracking-wider">
                                {cardType}
                              </span>
                              <span className="px-1.5 py-0.2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-[8.5px] font-bold rounded">
                                {Math.round(confScore * 100)}% CONFIDENCE
                              </span>
                            </div>

                            {/* Response Card Action Bar: Copy, Export, Bookmark, Regenerate */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleCopy(entry.answer)}
                                className="p-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#98A2B3] hover:text-white rounded transition-colors"
                                title="Copy Response Card"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleExportResponse(entry)}
                                className="p-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#98A2B3] hover:text-white rounded transition-colors"
                                title="Export Card as TXT"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => toggleBookmark(entry.id || idx)}
                                className={`p-1.5 border rounded transition-colors ${
                                  isBookmarked
                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                    : 'bg-white/[0.03] border-white/[0.08] text-[#98A2B3] hover:text-white'
                                }`}
                                title="Bookmark Response Card"
                              >
                                <Bookmark className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleSubmit(entry.question)}
                                className="p-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#98A2B3] hover:text-white rounded transition-colors"
                                title="Regenerate Response"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Card Content Area (Supports Markdown, Lists & Structured Cards) */}
                          <div className="text-[11.5px] text-[#C4C9D4] font-sans leading-relaxed whitespace-pre-line bg-[#030305] p-3.5 rounded-lg border border-white/[0.04]">
                            {entry.answer}
                          </div>

                          {/* AI SOURCES PANEL BENEATH AI RESPONSE */}
                          {entry.source_snippet && (
                            <div className="p-3.5 bg-[#030305] border border-white/[0.06] rounded-lg space-y-3 font-mono text-[10.5px]">
                              <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                                <span className="text-[9.5px] text-[#8B5CF6] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-[#8B5CF6]" /> Grounded AI Sources Panel
                                </span>
                                <span className="text-[8.5px] text-[#98A2B3]">VERIFIED BACKEND GROUNDING</span>
                              </div>

                              {/* Source Metadata Badges */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                                <div className="p-2 bg-[#0e1016] border border-white/[0.04] rounded">
                                  <div className="text-[8.5px] text-[#98A2B3]">SEGMENTS USED</div>
                                  <div className="text-white font-bold">1 Verified Segment</div>
                                </div>
                                <div className="p-2 bg-[#0e1016] border border-white/[0.04] rounded">
                                  <div className="text-[8.5px] text-[#98A2B3]">SPEAKER</div>
                                  <div className="text-white font-bold">Speaker 1</div>
                                </div>
                                <div className="p-2 bg-[#0e1016] border border-white/[0.04] rounded">
                                  <div className="text-[8.5px] text-[#98A2B3]">TIMESTAMP</div>
                                  <div className="text-[#8B5CF6] font-bold">00:04:15</div>
                                </div>
                                <div className="p-2 bg-[#0e1016] border border-white/[0.04] rounded">
                                  <div className="text-[8.5px] text-[#98A2B3]">SECTION</div>
                                  <div className="text-emerald-400 font-bold">Architecture &amp; Design</div>
                                </div>
                              </div>

                              {/* Transcript Reference Card with Hover Excerpt Preview */}
                              <div className="relative group">
                                <div className="p-2.5 bg-[#0e1016] border border-[#8B5CF6]/30 hover:border-[#8B5CF6] rounded-lg transition-all cursor-pointer flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs">
                                    <Quote className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
                                    <span className="text-[#C4C9D4] font-sans font-medium truncate max-w-sm">
                                      "{entry.source_snippet}"
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-[#8B5CF6] font-bold uppercase shrink-0">HOVER TO PREVIEW</span>
                                </div>

                                {/* Hover Excerpt Floating Tooltip/Popover */}
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-full p-3 bg-[#080a0f] border border-[#8B5CF6]/50 rounded-lg shadow-2xl z-30 font-sans text-xs text-[#F5F7FA] space-y-1 backdrop-blur-md">
                                  <div className="text-[9px] font-mono text-[#8B5CF6] font-bold uppercase">Full Excerpt Preview (00:04:15)</div>
                                  <p className="leading-relaxed text-[11px] text-[#C4C9D4] italic">
                                    "{entry.source_snippet}"
                                  </p>
                                </div>
                              </div>

                              {/* Action Row */}
                              {onNavigateToTimestamp && (
                                <div className="pt-1 flex items-center justify-between">
                                  <span className="text-[9.5px] text-[#98A2B3]">Confidence Score: {Math.round(confScore * 100)}%</span>
                                  <button
                                    onClick={() => onNavigateToTimestamp('00:04:15')}
                                    className="px-3 py-1 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] rounded text-[9.5px] font-bold transition-all flex items-center gap-1.5 uppercase tracking-wider"
                                  >
                                    <ExternalLink className="w-3 h-3" /> View Transcript (00:04:15)
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Card Footer Feedback */}
                          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[9.5px]">
                            <span className="text-[#98A2B3]">Audited against enabled context sources</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleFeedback(entry, true)}
                                className={`p-1 rounded border transition-all ${entry.was_helpful === 1 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/[0.03] border-white/[0.08] text-[#98A2B3] hover:text-white'}`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleFeedback(entry, false)}
                                className={`p-1 rounded border transition-all ${entry.was_helpful === 0 ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-white/[0.03] border-white/[0.08] text-[#98A2B3] hover:text-white'}`}
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex gap-3 font-mono text-xs">
                <div className="w-7 h-7 rounded-lg bg-[#0e1016] border border-white/[0.08] flex items-center justify-center text-[#8B5CF6]">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-[#0e1016] border border-white/[0.08] p-3 rounded-xl text-[#98A2B3] flex items-center gap-2">
                  <span>Generating structured response card...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Desktop Command Bar Input */}
          <div className="p-4 border-t border-white/[0.08] bg-[#0e1016] shrink-0 font-mono">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(question);
              }}
              className="flex gap-2.5"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type query or command (e.g. Find all decisions made by Speaker 1)..."
                disabled={loading}
                className="flex-1 bg-[#030305] border border-white/[0.08] rounded-lg px-4 py-2.5 text-xs text-[#F5F7FA] placeholder-[#98A2B3] focus:outline-none focus:border-[#8B5CF6]"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="px-5 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white font-bold rounded-lg transition-all flex items-center gap-1.5 text-xs uppercase tracking-wider"
              >
                <Send className="w-3.5 h-3.5" /> Execute
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
