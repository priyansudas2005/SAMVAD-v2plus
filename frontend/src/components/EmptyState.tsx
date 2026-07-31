import React from 'react';
import { 
  Mic, 
  FileText, 
  Sparkles, 
  BrainCircuit,
  Search, 
  CheckCircle2, 
  GitCommit, 
  BarChart4, 
  Download, 
  Radio, 
  MessageSquare, 
  Cpu, 
  ShieldAlert, 
  HardDrive, 
  AlertTriangle, 
  Upload, 
  RefreshCw, 
  Plus, 
  HelpCircle, 
  ArrowRight, 
  FolderPlus, 
  Terminal,
  Zap,
  Sliders
} from 'lucide-react';

export type EmptyStateScenario =
  | 'first-time-use'
  | 'no-meetings'
  | 'no-transcript'
  | 'ai-processing-pending'
  | 'no-search-results'
  | 'no-action-items'
  | 'no-decisions'
  | 'no-analytics'
  | 'no-exports'
  | 'no-recordings'
  | 'no-ai-conversations'
  | 'offline-model-unavailable'
  | 'permission-denied'
  | 'storage-unavailable'
  | 'failed-processing';

export interface EmptyStateProps {
  scenario?: EmptyStateScenario;
  title?: string;
  description?: string;
  primaryCtaText?: string;
  onPrimaryCta?: () => void;
  secondaryCtaText?: string;
  onSecondaryCta?: () => void;
  tips?: string[];
  layout?: 'full' | 'card' | 'compact' | 'inline';
  className?: string;
  customIcon?: React.ElementType;
}

interface ScenarioConfig {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  glowColor: string;
  primaryCtaText: string;
  secondaryCtaText?: string;
  tips: string[];
}

const SCENARIO_CONFIGS: Record<EmptyStateScenario, ScenarioConfig> = {
  'first-time-use': {
    title: 'Welcome to SAMVAD Studio',
    description: 'Your local-first AI workspace for instant meeting transcription, executive summaries, and intelligence.',
    icon: Sparkles,
    iconColor: 'text-violet-400',
    glowColor: 'bg-violet-500/20 border-violet-500/30',
    primaryCtaText: 'Start First Recording',
    secondaryCtaText: 'Import Audio File',
    tips: [
      'SAMVAD runs 100% offline — no audio data ever leaves your computer.',
      'Supports Faster-Whisper, PyAnnote speaker diarization & Ollama LLMs.'
    ]
  },
  'no-meetings': {
    title: 'No meetings have been recorded yet',
    description: 'Start your first recording or import an audio file to generate transcripts, executive summaries, and AI insights.',
    icon: Mic,
    iconColor: 'text-violet-400',
    glowColor: 'bg-violet-500/20 border-violet-500/30',
    primaryCtaText: 'Start Recording',
    secondaryCtaText: 'Import Recording',
    tips: [
      'Use microphone or system audio capture to record online calls (Zoom, Teams, Meet).',
      'Supported import formats: MP3, WAV, M4A, FLAC, OGG, WebM.'
    ]
  },
  'no-transcript': {
    title: 'Transcript not generated yet',
    description: 'The Whisper STT pipeline has not processed this recording. Run transcription to unlock speaker-labeled text.',
    icon: FileText,
    iconColor: 'text-sky-400',
    glowColor: 'bg-sky-500/20 border-sky-500/30',
    primaryCtaText: 'Run Whisper Pipeline',
    secondaryCtaText: 'Configure Model Size',
    tips: [
      'Select Whisper Large-v3 in Settings for maximum English & multi-lingual accuracy.',
      'Silero VAD automatically strips silence and background noise.'
    ]
  },
  'ai-processing-pending': {
    title: 'AI Intelligence Memo Pending',
    description: 'The recording transcript is ready, but local LLM summary generation has not been triggered.',
    icon: BrainCircuit,
    iconColor: 'text-amber-400',
    glowColor: 'bg-amber-500/20 border-amber-500/30',
    primaryCtaText: 'Generate Executive Memo',
    secondaryCtaText: 'View Raw Transcript',
    tips: [
      'Ensures local Ollama instance is running (Mistral 7B / Qwen 2.5).',
      'Generates key decisions, action items, risks, and follow-up email drafts.'
    ]
  },
  'no-search-results': {
    title: 'No matching records found',
    description: 'We searched across meeting titles, speaker turns, decisions, action items, and transcripts without a match.',
    icon: Search,
    iconColor: 'text-slate-400',
    glowColor: 'bg-slate-800/40 border-slate-700/50',
    primaryCtaText: 'Clear Search Query',
    secondaryCtaText: 'Browse All Meetings',
    tips: [
      'Check for typos or try searching by speaker label (e.g. "Speaker 1").',
      'Use the Universal Command Palette (Ctrl+K) for global keyword search.'
    ]
  },
  'no-action-items': {
    title: 'No action items identified',
    description: 'No explicit task commitments or deliverables were flagged in this meeting session.',
    icon: CheckCircle2,
    iconColor: 'text-teal-400',
    glowColor: 'bg-teal-500/20 border-teal-500/30',
    primaryCtaText: 'Re-Analyze Session',
    secondaryCtaText: 'Add Action Item Manually',
    tips: [
      'Action items are detected when speakers commit to explicit tasks or deadlines.',
      'You can manually add tasks in the Meeting Summary tab.'
    ]
  },
  'no-decisions': {
    title: 'No formal decisions recorded',
    description: 'No binding consensus decisions or architectural choices were detected during this recording.',
    icon: GitCommit,
    iconColor: 'text-blue-400',
    glowColor: 'bg-blue-500/20 border-blue-500/30',
    primaryCtaText: 'Extract Decisions via LLM',
    secondaryCtaText: 'Log Decision Manually',
    tips: [
      'Decisions require consensus phrasing such as "We agreed to...", "Approved...", or "Decided to...".'
    ]
  },
  'no-analytics': {
    title: 'Executive Analytics Unavailable',
    description: 'Analytics require at least one processed meeting recording in your SAMVAD workspace.',
    icon: BarChart4,
    iconColor: 'text-indigo-400',
    glowColor: 'bg-indigo-500/20 border-indigo-500/30',
    primaryCtaText: 'Record First Session',
    secondaryCtaText: 'Load Demo Dataset',
    tips: [
      'Total Meeting Analytics aggregates productivity, speaker share, and system benchmarks over time.'
    ]
  },
  'no-exports': {
    title: 'No exported documents yet',
    description: 'You have not exported any meeting briefs, PDF reports, or DOCX memos from this workspace.',
    icon: Download,
    iconColor: 'text-rose-400',
    glowColor: 'bg-rose-500/20 border-rose-500/30',
    primaryCtaText: 'Export PDF Summary',
    secondaryCtaText: 'Export DOCX Word',
    tips: [
      'Export formats include PDF, DOCX, Markdown, JSON, and SRT subtitle timestamps.'
    ]
  },
  'no-recordings': {
    title: 'No audio recordings saved',
    description: 'Your studio workspace does not currently contain any raw or processed audio files.',
    icon: Radio,
    iconColor: 'text-violet-400',
    glowColor: 'bg-violet-500/20 border-violet-500/30',
    primaryCtaText: 'Launch Studio Recorder',
    secondaryCtaText: 'Upload Audio File',
    tips: [
      'Raw WAV recordings are compressed locally to optimize storage growth.'
    ]
  },
  'no-ai-conversations': {
    title: 'No RAG AI questions asked',
    description: 'Start a conversation with SAMVAD AI Assistant to query facts across all stored transcripts.',
    icon: MessageSquare,
    iconColor: 'text-cyan-400',
    glowColor: 'bg-cyan-500/20 border-cyan-500/30',
    primaryCtaText: 'Ask RAG Assistant',
    secondaryCtaText: 'View Sample Prompts',
    tips: [
      'Try asking: "What decisions were made about database storage last week?"'
    ]
  },
  'offline-model-unavailable': {
    title: 'Local AI Model Not Loaded',
    description: 'The local Faster-Whisper or Ollama model binary was not found or is currently initializing.',
    icon: Cpu,
    iconColor: 'text-amber-400',
    glowColor: 'bg-amber-500/20 border-amber-500/30',
    primaryCtaText: 'Check Model Status in Settings',
    secondaryCtaText: 'Re-initialize Pipeline',
    tips: [
      'Ensure Ollama server is running locally on port 11434 (`ollama serve`).',
      'Verify CUDA GPU drivers if hardware acceleration is enabled.'
    ]
  },
  'permission-denied': {
    title: 'Microphone / System Audio Access Denied',
    description: 'SAMVAD requires audio input permissions to capture meeting recordings from your microphone or system.',
    icon: ShieldAlert,
    iconColor: 'text-rose-400',
    glowColor: 'bg-rose-500/20 border-rose-500/30',
    primaryCtaText: 'Grant System Permissions',
    secondaryCtaText: 'Audio Settings Guide',
    tips: [
      'Check Windows Privacy & Security Settings -> Microphone permissions.',
      'For system audio capture, remember to check "Share Audio" in the browser dialog.'
    ]
  },
  'storage-unavailable': {
    title: 'Local Storage Path Unavailable',
    description: 'SAMVAD cannot access the configured SQLite database or recording storage directory on disk.',
    icon: HardDrive,
    iconColor: 'text-rose-400',
    glowColor: 'bg-rose-500/20 border-rose-500/30',
    primaryCtaText: 'Verify Disk Storage Path',
    secondaryCtaText: 'Reset Storage Directory',
    tips: [
      'Default storage directory: ~/.samvad/storage.db',
      'Ensure disk has write access and at least 500MB free space.'
    ]
  },
  'failed-processing': {
    title: 'Transcription Pipeline Interrupted',
    description: 'An unexpected error occurred during audio chunking or Whisper inference for this session.',
    icon: AlertTriangle,
    iconColor: 'text-rose-400',
    glowColor: 'bg-rose-500/20 border-rose-500/30',
    primaryCtaText: 'Retry Processing Pipeline',
    secondaryCtaText: 'View Processing Log',
    tips: [
      'If VRAM memory is low, try switching to a smaller Whisper model in Settings (e.g. Medium or Small).'
    ]
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  scenario = 'no-meetings',
  title,
  description,
  primaryCtaText,
  onPrimaryCta,
  secondaryCtaText,
  onSecondaryCta,
  tips,
  layout = 'full',
  className = '',
  customIcon
}) => {
  const config = SCENARIO_CONFIGS[scenario] || SCENARIO_CONFIGS['no-meetings'];

  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalPrimaryCtaText = primaryCtaText || config.primaryCtaText;
  const finalSecondaryCtaText = secondaryCtaText !== undefined ? secondaryCtaText : config.secondaryCtaText;
  const finalTips = tips || config.tips;
  const IconComponent = customIcon || config.icon;

  // Render variant layout styles
  if (layout === 'inline') {
    return (
      <div className={`py-4 px-4 bg-[#141722]/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`p-2 rounded-lg ${config.glowColor} shrink-0`}>
            <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{finalTitle}</h4>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{finalDescription}</p>
          </div>
        </div>
        {onPrimaryCta && (
          <button
            onClick={onPrimaryCta}
            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold shrink-0 transition-all shadow-sm flex items-center gap-1"
          >
            {finalPrimaryCtaText} <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  if (layout === 'compact' || layout === 'card') {
    return (
      <div className={`p-5 bg-[#141722] border border-slate-800/80 rounded-xl flex flex-col items-center text-center space-y-3 shadow-md ${className}`}>
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${config.glowColor}`}>
          <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
        </div>

        <div className="space-y-1 max-w-sm">
          <h4 className="text-xs font-bold text-white tracking-tight">{finalTitle}</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">{finalDescription}</p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {onPrimaryCta && (
            <button
              onClick={onPrimaryCta}
              className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
            >
              {finalPrimaryCtaText}
            </button>
          )}
          {onSecondaryCta && finalSecondaryCtaText && (
            <button
              onClick={onSecondaryCta}
              className="px-3.5 py-1.5 bg-[#0e1016] hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-all"
            >
              {finalSecondaryCtaText}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default 'full' page empty state layout
  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center my-auto min-h-[380px] ${className}`}>
      <div className="max-w-md w-full bg-[#141722]/80 border border-slate-800/90 rounded-2xl p-8 space-y-5 shadow-2xl backdrop-blur-sm relative overflow-hidden">
        
        {/* Ambient Top Glow Blob */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Premium Icon Badge */}
        <div className="relative mx-auto w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xl group transition-all duration-300 hover:scale-105" style={{ backgroundColor: 'rgba(16, 19, 28, 0.9)' }}>
          <div className={`absolute inset-0 rounded-2xl border ${config.glowColor} opacity-80`} />
          <IconComponent className={`w-7 h-7 relative z-10 ${config.iconColor} transition-transform group-hover:scale-110`} />
        </div>

        {/* Title & Context Explanation */}
        <div className="space-y-2 relative z-10">
          <h3 className="text-base font-extrabold text-white tracking-tight">{finalTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            {finalDescription}
          </p>
        </div>

        {/* Primary & Secondary Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2 relative z-10">
          {onPrimaryCta && (
            <button
              onClick={onPrimaryCta}
              className="w-full sm:w-auto px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 group"
            >
              <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" />
              {finalPrimaryCtaText}
            </button>
          )}
          {onSecondaryCta && finalSecondaryCtaText && (
            <button
              onClick={onSecondaryCta}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#0e1016] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              {finalSecondaryCtaText}
            </button>
          )}
        </div>

        {/* Helpful Tips Section */}
        {finalTips && finalTips.length > 0 && (
          <div className="pt-4 border-t border-slate-800/80 text-left space-y-2 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-violet-400" />
              SAMVAD Tip
            </span>
            <ul className="space-y-1.5">
              {finalTips.map((tip, idx) => (
                <li key={idx} className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-tight">
                  <span className="text-violet-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};
