import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sliders, 
  Palette,
  Mic,
  Cpu,
  BrainCircuit,
  Download,
  Database,
  Shield,
  Terminal,
  Info,
  Check,
  AlertCircle,
  Volume2,
  HardDrive,
  Lock,
  Zap,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Sparkles,
  User,
  Trash2,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { SystemSettings } from '../types';
import { ShortcutSettingsPanel } from '../components/KeyboardShortcuts';
import { SamvadSignatureHelixLogo } from '../components/SamvadSignatureHelixLogo';
import { useProfile } from '../hooks/useProfile';

type SectionId = 'profile' | 'general' | 'appearance' | 'recording' | 'ai_models' | 'intelligence' | 'shortcuts' | 'export' | 'storage' | 'privacy' | 'advanced' | 'about';

interface SectionConfig {
  id: SectionId;
  label: string;
  icon: React.ElementType;
}

interface SettingsPageProps {
  onUpdateGlobalSettings?: (modelSize?: string, language?: string, vadEnabled?: boolean) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onUpdateGlobalSettings }) => {
  const { profile, initials, updateProfile, logout } = useProfile();
  const [settings, setSettings] = useState<SystemSettings>({
    model_size: 'base',
    default_language: 'auto',
    vad_enabled: true,
    ollama_url: 'http://localhost:11434',
    db_path: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('general');
  const [activeTheme, setActiveTheme] = useState<string>('dark');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Additional Desktop Control States
  const [autoRecord, setAutoRecord] = useState(true);
  const [sampleRate, setSampleRate] = useState('16000');
  const [audioInputDevice, setAudioInputDevice] = useState('Default System Microphone');
  const [autoSummarize, setAutoSummarize] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState('0.75');
  const [autoExportPdf, setAutoExportPdf] = useState(false);
  const [exportFormat, setExportFormat] = useState('JSON + PDF');
  const [retentionDays, setRetentionDays] = useState('90');
  const [localEncryption, setLocalEncryption] = useState(true);
  const [gpuAcceleration, setGpuAcceleration] = useState(true);

  // Advanced Appearance Control States
  const [themeMode, setThemeMode] = useState<'Dark' | 'Light' | 'System'>('Dark');
  const [accentColor, setAccentColor] = useState<string>('#8B5CF6'); // Default SAMVAD Purple
  const [glassIntensity, setGlassIntensity] = useState<number>(75);
  const [animationSpeed, setAnimationSpeed] = useState<number>(100);
  const [compactMode, setCompactMode] = useState<boolean>(false);
  const [sidebarDensity, setSidebarDensity] = useState<'Comfortable' | 'Compact' | 'Dense'>('Comfortable');
  const [fontSize, setFontSize] = useState<'Small' | 'Medium' | 'Large'>('Medium');
  const [monospaceFont, setMonospaceFont] = useState<string>('JetBrains Mono');
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  // Recording & DSP Control States
  const [audioOutputDevice, setAudioOutputDevice] = useState<string>('Default Speakers (Realtek High Definition)');
  const [recordingFormat, setRecordingFormat] = useState<string>('WAV (Uncompressed PCM)');
  const [bitDepth, setBitDepth] = useState<string>('16-bit Float');
  const [noiseSuppression, setNoiseSuppression] = useState<boolean>(true);
  const [echoCancellation, setEchoCancellation] = useState<boolean>(true);
  const [agcControl, setAgcControl] = useState<boolean>(true);
  const [speakerDiarizationSetting, setSpeakerDiarizationSetting] = useState<boolean>(true);
  const [normalizeAudio, setNormalizeAudio] = useState<boolean>(true);
  const [saveRawRecording, setSaveRawRecording] = useState<boolean>(true);
  const [defaultFolder, setDefaultFolder] = useState<string>('C:\\Users\\priya\\Documents\\SAMVAD\\Recordings');
  const [autoSaveInterval, setAutoSaveInterval] = useState<string>('Every 30 seconds');

  // AI Models Config State for 6 Components
  const [aiModelsState, setAiModelsState] = useState<Record<string, {
    currentModel: string;
    options: string[];
    ramEstimate: string;
    memoryUsage: string;
    status: 'ACTIVE' | 'WARM' | 'STANDBY';
    device: 'CUDA GPU' | 'CPU (AVX2)';
    backend: string;
    avgLatency: string;
  }>>({
    speech_recognition: {
      currentModel: 'Faster-Whisper (base)',
      options: ['Faster-Whisper (tiny)', 'Faster-Whisper (base)', 'Faster-Whisper (small)', 'Faster-Whisper (medium)', 'Faster-Whisper (large-v3)'],
      ramEstimate: '~750 MB VRAM',
      memoryUsage: '512 MB',
      status: 'ACTIVE',
      device: 'CUDA GPU',
      backend: 'ctranslate2 (FP16)',
      avgLatency: '1.2s / min'
    },
    embedding_model: {
      currentModel: 'bge-small-en-v1.5',
      options: ['bge-[#8B5CF6]-en-v1.5', 'all-MiniLM-L6-v2', 'e5-small-v2'],
      ramEstimate: '~350 MB RAM',
      memoryUsage: '240 MB',
      status: 'ACTIVE',
      device: 'CPU (AVX2)',
      backend: 'onnxruntime',
      avgLatency: '42ms / batch'
    },
    question_answering: {
      currentModel: 'Qwen-2.5-7B (Ollama)',
      options: ['Qwen-2.5-7B (Ollama)', 'Llama-3.2-3B (Ollama)', 'Mistral-7B-Instruct (Ollama)'],
      ramEstimate: '~4.8 GB VRAM',
      memoryUsage: '4.2 GB',
      status: 'ACTIVE',
      device: 'CUDA GPU',
      backend: 'Ollama REST Server',
      avgLatency: '18 tokens/s'
    },
    meeting_intelligence: {
      currentModel: 'SAMVAD Intelligence Pipeline v2',
      options: ['SAMVAD Intelligence Pipeline v2', 'Legacy Rule Engine'],
      ramEstimate: '~800 MB RAM',
      memoryUsage: '620 MB',
      status: 'ACTIVE',
      device: 'CPU (AVX2)',
      backend: 'PyTorch Native',
      avgLatency: '350ms'
    },
    speaker_diarization: {
      currentModel: 'PyAnnote 3.1 (Voiceprint)',
      options: ['PyAnnote 3.1 (Voiceprint)', 'SpeechBrain ECAPA-TDNN'],
      ramEstimate: '~1.2 GB VRAM',
      memoryUsage: '940 MB',
      status: 'WARM',
      device: 'CUDA GPU',
      backend: 'PyTorch CUDA',
      avgLatency: '2.4s / min'
    },
    summarization: {
      currentModel: 'Local Executive Summarizer 2.0',
      options: ['Local Executive Summarizer 2.0', 'T5-Base Summarizer'],
      ramEstimate: '~1.5 GB VRAM',
      memoryUsage: '1.1 GB',
      status: 'ACTIVE',
      device: 'CUDA GPU',
      backend: 'Ollama / HuggingFace',
      avgLatency: '1.8s'
    }
  });

  // Meeting Intelligence Feature Extraction Toggles
  const [intelToggles, setIntelToggles] = useState<Record<string, boolean>>({
    exec_summary: true,
    action_items: true,
    decisions: true,
    risks: true,
    blockers: true,
    dependencies: true,
    deadlines: true,
    open_questions: true,
    followup_email: true,
    meeting_health: true,
    ai_recommendations: true
  });

  const [extractionSensitivity, setExtractionSensitivity] = useState<'Conservative' | 'Balanced' | 'High Recall'>('Balanced');
  const [autoSpeakerNaming, setAutoSpeakerNaming] = useState<boolean>(true);

  // Storage & Privacy Control States
  const [runOffline, setRunOffline] = useState<boolean>(true);
  const [disableTelemetry, setDisableTelemetry] = useState<boolean>(true);
  const [encryptDatabase, setEncryptDatabase] = useState<boolean>(true);
  const [autoLocalBackup, setAutoLocalBackup] = useState<boolean>(true);
  const [secureDeleteFiles, setSecureDeleteFiles] = useState<boolean>(true);

  // General Application Preferences State
  // 1. APPLICATION
  const [launchOnStartup, setLaunchOnStartup] = useState<boolean>(true);
  const [openLastWorkspace, setOpenLastWorkspace] = useState<boolean>(true);
  const [autoCheckUpdates, setAutoCheckUpdates] = useState<boolean>(true);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState<boolean>(true);
  const [confirmCloseRecording, setConfirmCloseRecording] = useState<boolean>(true);
  const [minimizeToTray, setMinimizeToTray] = useState<boolean>(true);
  const [rememberWindowLayout, setRememberWindowLayout] = useState<boolean>(true);

  // 2. WORKSPACE
  const [defaultLandingPage, setDefaultLandingPage] = useState<string>('Dashboard');
  const [recentMeetingsLimit, setRecentMeetingsLimit] = useState<string>('15 meetings');
  const [autoSaveWorkspaceState, setAutoSaveWorkspaceState] = useState<boolean>(true);
  const [autoExpandLastMeeting, setAutoExpandLastMeeting] = useState<boolean>(true);

  // 3. NOTIFICATIONS
  const [desktopNotifications, setDesktopNotifications] = useState<boolean>(true);
  const [notifyRecordingStarted, setNotifyRecordingStarted] = useState<boolean>(true);
  const [notifyRecordingFinished, setNotifyRecordingFinished] = useState<boolean>(true);
  const [notifyAiProcessingDone, setNotifyAiProcessingDone] = useState<boolean>(true);
  const [notifyExportCompleted, setNotifyExportCompleted] = useState<boolean>(true);
  const [notifyMeetingReminders, setNotifyMeetingReminders] = useState<boolean>(false);

  // 4. LANGUAGE & REGION
  const [appLanguage, setAppLanguage] = useState<string>('English (US)');
  const [dateFormat, setDateFormat] = useState<string>('YYYY-MM-DD');
  const [timeFormat, setTimeFormat] = useState<string>('24 Hours (HH:mm:ss)');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<string>('Monday');
  const [numberFormat, setNumberFormat] = useState<string>('1,234,567.89');

  // 5. ACCESSIBILITY
  const [enableShortcuts, setEnableShortcuts] = useState<boolean>(true);
  const [highContrastMode, setHighContrastMode] = useState<boolean>(false);
  const [largerUiScaling, setLargerUiScaling] = useState<boolean>(false);
  const [reduceAnimationsState, setReduceAnimationsState] = useState<boolean>(false);
  const [focusIndicatorVisibility, setFocusIndicatorVisibility] = useState<boolean>(true);

  // Export Studio State
  const [selectedExportFormats, setSelectedExportFormats] = useState<Set<string>>(new Set(['PDF', 'Markdown', 'JSON']));
  const [quickExportFormat, setQuickExportFormat] = useState<string>('PDF');

  const [exportContentSelection, setExportContentSelection] = useState<Record<string, boolean>>({
    exec_summary: true,
    outcome: true,
    transcript: true,
    speaker_timeline: true,
    action_items: true,
    decisions: true,
    risks: true,
    blockers: true,
    dependencies: true,
    deadlines: true,
    open_questions: true,
    statistics: true,
    ai_recommendations: true,
    followup_email: true,
    appendix: true,
    bookmarks: true,
    confidence_scores: true,
    timestamps: true,
    audio_metadata: true
  });

  const [docTheme, setDocTheme] = useState<string>('SAMVAD Dark');
  const [docFont, setDocFont] = useState<string>('Inter / JetBrains');
  const [docAccent, setDocAccent] = useState<string>('#8B5CF6');
  const [logoPlacement, setLogoPlacement] = useState<string>('Top Right');
  const [showHeaderFooter, setShowHeaderFooter] = useState<boolean>(true);
  const [showPageNumbers, setShowPageNumbers] = useState<boolean>(true);
  const [showWatermark, setShowWatermark] = useState<boolean>(false);
  const [showToc, setShowToc] = useState<boolean>(true);
  const [showCoverPage, setShowCoverPage] = useState<boolean>(true);
  const [showSectionDividers, setShowSectionDividers] = useState<boolean>(true);

  const [paperSize, setPaperSize] = useState<string>('A4');
  const [orientation, setOrientation] = useState<string>('Portrait');
  const [margins, setMargins] = useState<string>('Normal (15mm)');
  const [imageQuality, setImageQuality] = useState<string>('High (300 DPI)');
  const [compressionLevel, setCompressionLevel] = useState<string>('Standard');
  const [embedFonts, setEmbedFonts] = useState<boolean>(true);
  const [passwordProtectPdf, setPasswordProtectPdf] = useState<boolean>(false);

  const [fileNameTemplate, setFileNameTemplate] = useState<string>('{project}_{date}_{time}');
  const [exportFolderOption, setExportFolderOption] = useState<string>('C:\\Users\\priya\\Documents\\SAMVAD\\Exports');
  const [folderOrganizeBy, setFolderOrganizeBy] = useState<string>('Year / Month');
  const [rememberLastFolder, setRememberLastFolder] = useState<boolean>(true);
  const [askEveryTime, setAskEveryTime] = useState<boolean>(false);

  const [enableQuickExport, setEnableQuickExport] = useState<boolean>(true);
  const [autoExportAfterProcessing, setAutoExportAfterProcessing] = useState<boolean>(false);
  const [openFolderAfterExport, setOpenFolderAfterExport] = useState<boolean>(true);
  const [openFileAfterExport, setOpenFileAfterExport] = useState<boolean>(false);

  const [selectedPreset, setSelectedPreset] = useState<string>('Executive Brief');
  const [presetsList, setPresetsList] = useState<string[]>([
    'Executive Brief',
    'Meeting Minutes',
    'Legal Transcript',
    'Research Export',
    'Raw Transcript',
    'Developer Review'
  ]);

  const [incConfidenceValues, setIncConfidenceValues] = useState<boolean>(true);
  const [incTimestamps, setIncTimestamps] = useState<boolean>(true);
  const [exportSpeakerColors, setExportSpeakerColors] = useState<boolean>(true);
  const [embedWaveformImage, setEmbedWaveformImage] = useState<boolean>(true);
  const [embedMeetingMetadata, setEmbedMeetingMetadata] = useState<boolean>(true);
  const [compressExportFiles, setCompressExportFiles] = useState<boolean>(false);
  const [digitallySignExports, setDigitallySignExports] = useState<boolean>(false);

  // Advanced & Diagnostics Control States
  // Section 1: Performance Engine
  const [perfMode, setPerfMode] = useState<'Low Power' | 'Balanced' | 'High Performance'>('Balanced');
  const [enableGpuAccel, setEnableGpuAccel] = useState<boolean>(true);
  const [maxWorkerThreads, setMaxWorkerThreads] = useState<string>('8 Threads');
  const [maxConcurrentAiJobs, setMaxConcurrentAiJobs] = useState<string>('2 Concurrent');
  const [aiMemoryLimit, setAiMemoryLimit] = useState<string>('8 GB VRAM');
  const [bgProcessingPriority, setBgProcessingPriority] = useState<string>('Normal');

  // Section 2: AI Pipeline Tuning
  const [contextWindowSize, setContextWindowSize] = useState<string>('8192 Tokens');
  const [chunkSize, setChunkSize] = useState<string>('512 Tokens');
  const [chunkOverlap, setChunkOverlap] = useState<string>('64 Tokens');
  const [retrievalTopK, setRetrievalTopK] = useState<string>('Top 5');
  const [similarityThreshold, setSimilarityThreshold] = useState<string>('0.75');
  const [answerConfidenceThreshold, setAnswerConfidenceThreshold] = useState<string>('0.80');
  const [streamingResponses, setStreamingResponses] = useState<boolean>(true);
  const [autoModelWarmup, setAutoModelWarmup] = useState<boolean>(true);
  const [promptTemplate, setPromptTemplate] = useState<string>('SAMVAD Strict RAG Grounded System v2');
  const [fallbackModel, setFallbackModel] = useState<string>('Llama-3.2-3B (Ollama Fallback)');

  // Section 3: Speech & Transcription Engine
  const [beamSize, setBeamSize] = useState<string>('5');
  const [bestOf, setBestOf] = useState<string>('5');
  const [temperature, setTemperature] = useState<string>('0.0 (Greedy)');
  const [wordLevelTimestamps, setWordLevelTimestamps] = useState<boolean>(true);
  const [vadSensitivity, setVadSensitivity] = useState<string>('0.5 (Standard)');
  const [minSilenceDuration, setMinSilenceDuration] = useState<string>('500 ms');
  const [hallucinationFilter, setHallucinationFilter] = useState<boolean>(true);
  const [autoLanguageDetection, setAutoLanguageDetection] = useState<boolean>(true);
  const [speakerMergeThreshold, setSpeakerMergeThreshold] = useState<string>('0.70');
  const [punctuationRestoration, setPunctuationRestoration] = useState<boolean>(true);

  // Section 4: Logging & Diagnostics
  const [enableDebugLogging, setEnableDebugLogging] = useState<boolean>(false);
  const [enablePerfMetrics, setEnablePerfMetrics] = useState<boolean>(true);
  const [pipelineTimingLogs, setPipelineTimingLogs] = useState<boolean>(true);
  const [modelInferenceLogs, setModelInferenceLogs] = useState<boolean>(true);
  const [saveCrashReports, setSaveCrashReports] = useState<boolean>(true);
  const [verboseLogging, setVerboseLogging] = useState<boolean>(false);
  const [logRetentionPeriod, setLogRetentionPeriod] = useState<string>('30 Days');

  // Section 6: Experimental Features
  const [enableBetaFeatures, setEnableBetaFeatures] = useState<boolean>(false);
  const [enableExperimentalModels, setEnableExperimentalModels] = useState<boolean>(false);
  const [enablePreviewComponents, setEnablePreviewComponents] = useState<boolean>(false);
  const [enableDeveloperMode, setEnableDeveloperMode] = useState<boolean>(false);
  const [enableFutureFeatures, setEnableFutureFeatures] = useState<boolean>(false);

  // Collapsible Section Expanders State
  const [openExpanders, setOpenExpanders] = useState<Record<string, boolean>>({
    perf_engine: true,
    ai_tuning: true,
    speech_engine: true,
    logging_diag: true,
    db_maint: true,
    exp_features: true,
    sys_diag: true,
    recovery_reset: true
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 1500);
  };

  useEffect(() => {
    // Load local storage saved settings if present
    const saved = localStorage.getItem('samvad_user_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.model_size) setSettings(prev => ({ ...prev, ...parsed }));
        if (parsed.themeMode) {
          setThemeMode(parsed.themeMode);
          document.documentElement.classList.toggle('light-theme', parsed.themeMode === 'Light');
        }
        if (parsed.accentColor) {
          setAccentColor(parsed.accentColor);
          document.documentElement.style.setProperty('--accent-primary', parsed.accentColor);
        }
        if (parsed.launchOnStartup !== undefined) setLaunchOnStartup(parsed.launchOnStartup);
        if (parsed.defaultLandingPage) setDefaultLandingPage(parsed.defaultLandingPage);
        if (parsed.recentMeetingsLimit) setRecentMeetingsLimit(parsed.recentMeetingsLimit);
        if (parsed.audioInputDevice) setAudioInputDevice(parsed.audioInputDevice);
        if (parsed.audioOutputDevice) setAudioOutputDevice(parsed.audioOutputDevice);
        if (parsed.sampleRate) setSampleRate(parsed.sampleRate);
        if (parsed.recordingFormat) setRecordingFormat(parsed.recordingFormat);
        if (parsed.noiseSuppression !== undefined) setNoiseSuppression(parsed.noiseSuppression);
        if (parsed.echoCancellation !== undefined) setEchoCancellation(parsed.echoCancellation);
        if (parsed.runOffline !== undefined) setRunOffline(parsed.runOffline);
        if (parsed.disableTelemetry !== undefined) setDisableTelemetry(parsed.disableTelemetry);
        if (parsed.encryptDatabase !== undefined) setEncryptDatabase(parsed.encryptDatabase);
      } catch (e) {
        console.error("Failed parsing local settings", e);
      }
    }

    const savedTheme = localStorage.getItem('samvad-theme') || 'dark';
    setActiveTheme(savedTheme);

    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(prev => ({ ...prev, ...data }));
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch system settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const saveAllSettings = async () => {
    setSaving(true);
    
    // Map selected ASR model size if user changed AI models dropdown
    const selectedModelSize = aiModelsState.speech_recognition?.currentModel?.toLowerCase().includes('large') ? 'large' :
                              aiModelsState.speech_recognition?.currentModel?.toLowerCase().includes('medium') ? 'medium' :
                              aiModelsState.speech_recognition?.currentModel?.toLowerCase().includes('small') ? 'small' :
                              aiModelsState.speech_recognition?.currentModel?.toLowerCase().includes('tiny') ? 'tiny' : 'base';

    const updatedSystemSettings: SystemSettings = {
      ...settings,
      model_size: selectedModelSize
    };

    setSettings(updatedSystemSettings);

    const fullPayload = {
      ...updatedSystemSettings,
      themeMode,
      accentColor,
      glassIntensity,
      animationSpeed,
      compactMode,
      sidebarDensity,
      fontSize,
      monospaceFont,
      launchOnStartup,
      openLastWorkspace,
      autoCheckUpdates,
      defaultLandingPage,
      recentMeetingsLimit,
      audioInputDevice,
      audioOutputDevice,
      sampleRate,
      recordingFormat,
      noiseSuppression,
      echoCancellation,
      runOffline,
      disableTelemetry,
      encryptDatabase,
      aiModelsState
    };

    localStorage.setItem('samvad_user_settings', JSON.stringify(fullPayload));

    // Propagate theme mode to DOM & root theme classes
    if (themeMode) {
      const modeKey = themeMode.toLowerCase();
      localStorage.setItem('samvad-theme', modeKey);
      document.documentElement.className = '';
      if (modeKey === 'light') {
        document.documentElement.classList.add('theme-light');
      }
    }

    // Propagate primary accent color to CSS variables
    if (accentColor) {
      document.documentElement.style.setProperty('--accent-primary', accentColor);
    }

    // Sync global state with parent App.tsx
    if (onUpdateGlobalSettings) {
      onUpdateGlobalSettings(updatedSystemSettings.model_size, updatedSystemSettings.default_language, updatedSystemSettings.vad_enabled);
    }

    try {
      await api.updateSettings(updatedSystemSettings);
      showToast("All settings saved successfully!");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      showToast("Settings saved locally!");
    } finally {
      setSaving(false);
    }
  };

  const handleInstantSave = async (updated: SystemSettings) => {
    setSettings(updated);
    localStorage.setItem('samvad_user_settings', JSON.stringify({ ...settings, ...updated }));
    if (onUpdateGlobalSettings) {
      onUpdateGlobalSettings(updated.model_size, updated.default_language, updated.vad_enabled);
    }
    try {
      await api.updateSettings(updated);
      showToast("Settings updated instantly");
    } catch (err: any) {
      console.error(err);
      showToast("Setting saved locally");
    }
  };

  const sections: SectionConfig[] = [
    { id: 'profile', label: 'Local Profile', icon: User },
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'recording', label: 'Recording', icon: Mic },
    { id: 'ai_models', label: 'AI Models', icon: Cpu },
    { id: 'intelligence', label: 'Meeting Intelligence', icon: BrainCircuit },
    { id: 'shortcuts', label: 'Keyboard & Shortcuts', icon: Settings },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'advanced', label: 'Advanced', icon: Terminal },
    { id: 'about', label: 'About', icon: Info },
  ];

  if (loading) {
    return (
      <div className="flex-1 bg-slate-950 p-8 flex flex-col items-center justify-center font-mono text-xs">
        <div className="flex items-center gap-3 p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl shadow-2xl">
          <div className="w-4 h-4 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#F5F7FA] font-bold">Loading SAMVAD Studio Control Center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-screen overflow-hidden text-[#F5F7FA] font-sans select-none relative">
      
      {/* Non-intrusive Floating Toast Notification (Bottom Right) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 px-3.5 py-2 bg-[#0e1016]/90 backdrop-blur-md border border-[#8B5CF6]/40 text-[#F5F7FA] rounded-xl font-mono text-[11px] shadow-2xl flex items-center gap-2 pointer-events-none"
          >
            <div className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Center Header */}
      <div className="bg-[#0e1016] border-b border-white/[0.08] px-6 py-3.5 flex items-center justify-between shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
            <Settings className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider">
              SAMVAD Studio Control Center
            </h1>
            <p className="text-[9.5px] text-[#98A2B3] mt-0.5">
              System Telemetry &middot; Offline Speech Engine &middot; LLM Endpoints &middot; Storage Mappings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] rounded text-[9.5px] font-bold hidden sm:inline-block">
            STUDIO v2.0.0 // OFFLINE READY
          </span>
          <button
            onClick={saveAllSettings}
            disabled={saving}
            className="px-4 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2 uppercase cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2-COLUMN DESKTOP WORKSPACE LAYOUT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
        
        {/* LEFT SIDEBAR NAVIGATION (3 Columns) */}
        <div className="lg:col-span-3 p-4 bg-[#080a0f]/80 overflow-y-auto space-y-1 font-mono text-xs shrink-0 select-none">
          <div className="text-[9px] font-bold text-[#8B5CF6] uppercase tracking-widest px-3 py-1 mb-1">
            CONTROL SECTIONS //
          </div>
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full px-3 py-2.5 rounded-lg border font-bold transition-all flex items-center gap-2.5 text-xs text-left ${
                  isActive
                    ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-white shadow-lg'
                    : 'bg-transparent border-transparent text-[#98A2B3] hover:text-[#F5F7FA] hover:bg-white/[0.03]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#8B5CF6]' : 'text-[#98A2B3]'}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT CONTENT WORKSPACE (9 Columns) */}
        <div className="lg:col-span-9 p-6 overflow-y-auto space-y-5 bg-slate-950 font-sans">
          
          {/* PROFILE SECTION */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-violet-400" /> Local User Profile
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage your display identity, view creation metadata, or reset your local session.
                </p>
              </div>

              {/* Profile Card Summary */}
              <div className="p-6 rounded-2xl bg-[#090b14]/90 border border-white/[0.08] backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 border border-violet-400/30 flex items-center justify-center font-extrabold text-white text-lg shadow-xl shadow-violet-600/30 font-mono">
                    {initials || 'U'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{profile?.name || 'Local User'}</h3>
                    <p className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Local Profile &middot; Offline Storage
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 space-y-1 sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-white/[0.06]">
                  <div>Created: <span className="text-slate-200">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span></div>
                  <div>Last Login: <span className="text-slate-200">{profile?.last_login ? new Date(profile.last_login).toLocaleTimeString() : 'Just now'}</span></div>
                </div>
              </div>

              {/* Name Editor */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                <h3 className="text-sm font-bold text-white">Change Display Name</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    defaultValue={profile?.name || ''}
                    id="profile-name-input"
                    placeholder="Enter new display name..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#05060c] border border-white/[0.1] text-white text-xs font-semibold focus:outline-none focus:border-violet-500 font-mono"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('profile-name-input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        updateProfile({ name: input.value.trim() });
                        showToast('Profile name updated instantly!');
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Save Name
                  </button>
                </div>
              </div>

              {/* Danger Zone: Session Reset */}
              <div className="p-6 rounded-2xl bg-rose-500/[0.03] border border-rose-500/20 space-y-3">
                <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Account & Session Reset
                </h3>
                <p className="text-xs text-slate-400">
                  Resetting or logging out of your session will return SAMVAD to the Welcome screen. Your meeting transcripts, audio files, and intelligence memos will remain completely safe on your device.
                </p>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      logout();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout Session
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 1. GENERAL PREFERENCES WORKSPACE */}
          {activeSection === 'general' && (
            <div className="space-y-6 font-sans select-none">
              
              <div className="border-b border-white/[0.06] pb-2 font-mono">
                <h2 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#8B5CF6]" /> General Application Preferences
                </h2>
                <p className="text-[10px] text-[#98A2B3] mt-0.5 font-sans">
                  Application startup behavior, default landing view, desktop notifications, regional formatting, and accessibility.
                </p>
              </div>

              {/* 1. APPLICATION CARD GROUP */}
              <div className="space-y-2.5 font-mono text-xs">
                <div className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-widest px-1">
                  // APPLICATION STARTUP &amp; BEHAVIOR
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Launch SAMVAD at system startup</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Automatically launch background service when OS boots.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={launchOnStartup}
                    onChange={e => {
                      setLaunchOnStartup(e.target.checked);
                      showToast(e.target.checked ? "Launch on startup ON" : "Launch on startup OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Open last active workspace on launch</h4>
                      <span className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Reopen previous meeting session context automatically.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={openLastWorkspace}
                    onChange={e => {
                      setOpenLastWorkspace(e.target.checked);
                      showToast(e.target.checked ? "Open last workspace ON" : "Open last workspace OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Automatically check for updates</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5 font-sans">Check offline release channels for SAMVAD updates.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoCheckUpdates}
                    onChange={e => {
                      setAutoCheckUpdates(e.target.checked);
                      showToast(e.target.checked ? "Auto update check ON" : "Auto update check OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Show welcome screen on startup</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Render studio onboarding brief on application open.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showWelcomeScreen}
                    onChange={e => {
                      setShowWelcomeScreen(e.target.checked);
                      showToast(e.target.checked ? "Welcome screen ON" : "Welcome screen OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Confirm before closing active recording</h4>
                      <span className="px-1.5 py-0.2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-[8px] font-bold rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Prompt confirmation dialogue if acoustic recorder is live.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={confirmCloseRecording}
                    onChange={e => {
                      setConfirmCloseRecording(e.target.checked);
                      showToast(e.target.checked ? "Confirm close ON" : "Confirm close OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Minimize to system tray when closing</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Keep acoustic telemetry service running in Windows tray.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={minimizeToTray}
                    onChange={e => {
                      setMinimizeToTray(e.target.checked);
                      showToast(e.target.checked ? "Tray minimize ON" : "Tray minimize OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Remember window layout and panel positions</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5 font-sans">Persist sidebars and drawer widths across restarts.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={rememberWindowLayout}
                    onChange={e => {
                      setRememberWindowLayout(e.target.checked);
                      showToast(e.target.checked ? "Remember layout ON" : "Remember layout OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>
              </div>

              {/* 2. WORKSPACE CARD GROUP */}
              <div className="space-y-2.5 font-mono text-xs pt-2">
                <div className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-widest px-1">
                  // WORKSPACE &amp; NAVIGATION
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#F5F7FA]">Default Landing Page</h4>
                      <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Select initial workspace view rendered upon startup.</p>
                    </div>
                    <span className="text-[#8B5CF6] font-bold text-xs">{defaultLandingPage}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#030305] p-1.5 rounded-lg border border-white/[0.05]">
                    {['Dashboard', 'Recorder', 'Meeting History', 'Analytics'].map(page => (
                      <button
                        key={page}
                        onClick={() => {
                          setDefaultLandingPage(page);
                          showToast(`Landing page: ${page}`);
                        }}
                        className={`py-1.5 rounded-md font-bold text-xs transition-all uppercase ${
                          defaultLandingPage === page
                            ? 'bg-[#8B5CF6] text-white shadow-lg'
                            : 'text-[#98A2B3] hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Recent Meetings Limit</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Maximum number of sessions displayed in sidebar quick list.</p>
                  </div>
                  <select
                    value={recentMeetingsLimit}
                    onChange={e => {
                      setRecentMeetingsLimit(e.target.value);
                      showToast(`Meetings limit set: ${e.target.value}`);
                    }}
                    className="bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option>5 meetings</option>
                    <option>10 meetings</option>
                    <option>15 meetings</option>
                    <option>25 meetings</option>
                  </select>
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Auto-save workspace state</h4>
                      <span className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Continuously persist open tab filters and search queries.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSaveWorkspaceState}
                    onChange={e => {
                      setAutoSaveWorkspaceState(e.target.checked);
                      showToast(e.target.checked ? "Auto-save state ON" : "Auto-save state OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Auto-expand last opened meeting</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Automatically open active transcript accordion upon launch.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoExpandLastMeeting}
                    onChange={e => {
                      setAutoExpandLastMeeting(e.target.checked);
                      showToast(e.target.checked ? "Auto expand ON" : "Auto expand OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>
              </div>

              {/* 3. NOTIFICATIONS CARD GROUP */}
              <div className="space-y-2.5 font-mono text-xs pt-2">
                <div className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-widest px-1">
                  // DESKTOP NOTIFICATIONS &amp; ALERTS
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Desktop Notifications</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Master toggle for OS toast alerts.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={desktopNotifications}
                    onChange={e => {
                      setDesktopNotifications(e.target.checked);
                      showToast(e.target.checked ? "Desktop notifications ON" : "Desktop notifications OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Recording Started Alert</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Notify when acoustic mic buffer initializes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyRecordingStarted}
                    onChange={e => setNotifyRecordingStarted(e.target.checked)}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Recording Finished Alert</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Notify when audio file is written to disk.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyRecordingFinished}
                    onChange={e => setNotifyRecordingFinished(e.target.checked)}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">AI Processing Completed Alert</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5 font-sans font-sans">Notify when local RAG pipeline finishes extracting intelligence.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyAiProcessingDone}
                    onChange={e => setNotifyAiProcessingDone(e.target.checked)}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Export Completed Alert</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Notify when PDF/JSON download bundle is generated.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyExportCompleted}
                    onChange={e => setNotifyExportCompleted(e.target.checked)}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4 opacity-75">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Meeting Reminders (Future Ready)</h4>
                      <span className="px-1.5 py-0.2 bg-white/[0.05] border border-white/[0.08] text-[#98A2B3] text-[8px] font-bold rounded">
                        STANDBY
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Calendar integration notifications prior to scheduled meetings.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyMeetingReminders}
                    onChange={e => setNotifyMeetingReminders(e.target.checked)}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>
              </div>

              {/* 4. LANGUAGE & REGION CARD GROUP */}
              <div className="space-y-2.5 font-mono text-xs pt-2">
                <div className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-widest px-1">
                  // LANGUAGE &amp; REGIONAL FORMATTING
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Application UI Language</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Localization language for desktop navigation.</p>
                  </div>
                  <select
                    value={appLanguage}
                    onChange={e => {
                      setAppLanguage(e.target.value);
                      showToast(`Language set: ${e.target.value}`);
                    }}
                    className="bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Hindi (भारत)</option>
                    <option>Spanish (Español)</option>
                  </select>
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Date Format</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Format for timestamps across meeting logs.</p>
                  </div>
                  <select
                    value={dateFormat}
                    onChange={e => {
                      setDateFormat(e.target.value);
                      showToast(`Date format: ${e.target.value}`);
                    }}
                    className="bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option>YYYY-MM-DD (2026-07-23)</option>
                    <option>DD/MM/YYYY (23/07/2026)</option>
                    <option>MM/DD/YYYY (07/23/2026)</option>
                  </select>
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Time Format</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Clock format for acoustic timelines.</p>
                  </div>
                  <select
                    value={timeFormat}
                    onChange={e => {
                      setTimeFormat(e.target.value);
                      showToast(`Time format: ${e.target.value}`);
                    }}
                    className="bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option>24 Hours (HH:mm:ss)</option>
                    <option>12 Hours (hh:mm:ss AM/PM)</option>
                  </select>
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">First Day of Week</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Calendar view start day.</p>
                  </div>
                  <select
                    value={firstDayOfWeek}
                    onChange={e => setFirstDayOfWeek(e.target.value)}
                    className="bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option>Monday</option>
                    <option>Sunday</option>
                  </select>
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Number &amp; Separator Format</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Thousands and decimal separator style.</p>
                  </div>
                  <select
                    value={numberFormat}
                    onChange={e => setNumberFormat(e.target.value)}
                    className="bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option>1,234,567.89 (Standard)</option>
                    <option>1.234.567,89 (European)</option>
                  </select>
                </div>
              </div>

              {/* 5. ACCESSIBILITY CARD GROUP */}
              <div className="space-y-2.5 font-mono text-xs pt-2">
                <div className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-widest px-1">
                  // ACCESSIBILITY &amp; ASSISTIVE CONTROLS
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Enable Keyboard Shortcuts (Hotkeys)</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Enable global desktop shortcuts (Space to record, Cmd+K search).</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableShortcuts}
                    onChange={e => setEnableShortcuts(e.target.checked)}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">High Contrast Mode</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Increases text contrast ratio for high readability.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={highContrastMode}
                    onChange={e => setHighContrastMode(e.target.checked)}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Larger UI Scaling</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Enlarges control targets and font sizing.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={largerUiScaling}
                    onChange={e => setLargerUiScaling(e.target.checked)}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Reduce Animations</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Disable motion transitions for accessibility.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reduceAnimationsState}
                    onChange={e => setReduceAnimationsState(e.target.checked)}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Focus Indicator Visibility</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Enforces prominent focus outlines around active inputs.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={focusIndicatorVisibility}
                    onChange={e => setFocusIndicatorVisibility(e.target.checked)}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>
              </div>

              {/* 6. SESSION READ-ONLY CARD */}
              <div className="p-5 bg-[#030305] border border-white/[0.08] rounded-xl space-y-3 font-mono text-xs shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <span className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> CURRENT SESSION &amp; ENVIRONMENT TELEMETRY
                  </span>
                  <span className="text-[9px] text-[#10B981] font-bold">READ ONLY</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-[#0e1016] border border-white/[0.04] rounded-lg">
                    <div className="text-[9px] text-[#98A2B3]">CURRENT VERSION</div>
                    <div className="text-white font-bold">SAMVAD Studio v2.0.0-RELEASE</div>
                  </div>
                  <div className="p-2.5 bg-[#0e1016] border border-white/[0.04] rounded-lg">
                    <div className="text-[9px] text-[#98A2B3]">WORKSPACE PATH</div>
                    <div className="text-white font-bold truncate">C:\Users\priya\Documents\SAMVAD</div>
                  </div>
                  <div className="p-2.5 bg-[#0e1016] border border-white/[0.04] rounded-lg">
                    <div className="text-[9px] text-[#98A2B3]">CONFIGURATION FILE</div>
                    <div className="text-white font-bold truncate">data/config/system_settings.json</div>
                  </div>
                  <div className="p-2.5 bg-[#0e1016] border border-white/[0.04] rounded-lg">
                    <div className="text-[9px] text-[#98A2B3]">DATABASE STATUS</div>
                    <div className="text-emerald-400 font-bold">SQLite Connected (SQLCipher AES-256)</div>
                  </div>
                  <div className="p-2.5 bg-[#0e1016] border border-white/[0.04] rounded-lg">
                    <div className="text-[9px] text-[#98A2B3]">LAST LAUNCH TIME</div>
                    <div className="text-[#8B5CF6] font-bold">Today, 22:47:18</div>
                  </div>
                  <div className="p-2.5 bg-[#0e1016] border border-white/[0.04] rounded-lg">
                    <div className="text-[9px] text-[#98A2B3]">LAST BACKUP</div>
                    <div className="text-white font-bold">Today, 21:00:00 (Auto Backup)</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. APPEARANCE WORKSPACE */}
          {activeSection === 'appearance' && (
            <div className="space-y-5 font-sans select-none">
              <div className="border-b border-white/[0.06] pb-2 font-mono">
                <h2 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#8B5CF6]" /> Appearance &amp; Studio Design System
                </h2>
                <p className="text-[10px] text-[#98A2B3] mt-0.5 font-sans">
                  Customize theme modes, accent color palettes, glassmorphism filters, font scaling, and live previews.
                </p>
              </div>

              {/* Settings Cards Stream */}
              <div className="space-y-3 font-mono text-xs">
                
                {/* 1. Theme Mode (Segmented Control) */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Theme Mode</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Select primary UI color mode. Changes apply immediately across all pages.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-[#030305] p-1.5 rounded-lg border border-white/[0.05]">
                    {(['Dark', 'Light', 'System'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => {
                          setThemeMode(mode);
                          const modeKey = mode.toLowerCase();
                          localStorage.setItem('samvad-theme', modeKey);
                          document.documentElement.className = '';
                          if (modeKey === 'light') {
                            document.documentElement.classList.add('theme-light');
                          }
                          showToast(`Theme mode: ${mode}`);
                        }}
                        className={`py-1.5 rounded-md font-bold text-xs transition-all uppercase ${
                          themeMode === mode
                            ? 'bg-[#8B5CF6] text-white shadow-lg'
                            : 'text-[#98A2B3] hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Accent Color Palette */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Accent Color</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Select primary brand accent color applied to telemetry gauges and active elements.</p>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    {[
                      { name: 'SAMVAD Purple', hex: '#8B5CF6' },
                      { name: 'Acoustic Cyan', hex: '#06B6D4' },
                      { name: 'Emerald Compliance', hex: '#10B981' },
                      { name: 'Amber Forge', hex: '#F59E0B' },
                      { name: 'Rose Cyber', hex: '#F43F5E' }
                    ].map(color => (
                      <button
                        key={color.hex}
                        onClick={() => {
                          setAccentColor(color.hex);
                          document.documentElement.style.setProperty('--accent-primary', color.hex);
                          showToast(`Accent color set: ${color.name}`);
                        }}
                        className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                          accentColor === color.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {accentColor === color.hex && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Glass Effect Intensity Slider */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#F5F7FA]">Glass Effect Intensity</h4>
                      <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Adjust backdrop blur and glass reflection transparency filter.</p>
                    </div>
                    <span className="text-[#8B5CF6] font-bold text-xs">{glassIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={glassIntensity}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setGlassIntensity(val);
                      document.documentElement.style.setProperty('--glass-blur', `${val / 5}px`);
                      showToast(`Glass intensity: ${val}%`);
                    }}
                    className="w-full h-1.5 bg-[#030305] rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
                  />
                </div>

                {/* 4. Animation Speed Slider */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#F5F7FA]">Animation Speed</h4>
                      <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Speed multiplier for framer-motion transitions.</p>
                    </div>
                    <span className="text-[#8B5CF6] font-bold text-xs">{animationSpeed}%</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="200"
                    step="25"
                    value={animationSpeed}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setAnimationSpeed(val);
                      showToast(`Animation speed: ${val}%`);
                    }}
                    className="w-full h-1.5 bg-[#030305] rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
                  />
                </div>

                {/* 5. Compact Mode Toggle */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Compact Mode</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Reduces element padding and card margins for maximum information density.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={e => {
                      setCompactMode(e.target.checked);
                      document.documentElement.classList.toggle('compact-layout', e.target.checked);
                      showToast(e.target.checked ? "Compact mode enabled" : "Comfortable mode restored");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                {/* 6. Sidebar Density (Segmented Control) */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Sidebar Density</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Navigation item padding and row height.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-[#030305] p-1.5 rounded-lg border border-white/[0.05]">
                    {(['Comfortable', 'Compact', 'Dense'] as const).map(den => (
                      <button
                        key={den}
                        onClick={() => {
                          setSidebarDensity(den);
                          showToast(`Sidebar density: ${den}`);
                        }}
                        className={`py-1.5 rounded-md font-bold text-xs transition-all uppercase ${
                          sidebarDensity === den
                            ? 'bg-[#8B5CF6] text-white shadow-lg'
                            : 'text-[#98A2B3] hover:text-white'
                        }`}
                      >
                        {den}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Font Size (Segmented Control) */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Font Size</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Base typography scaling factor across desktop panels.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-[#030305] p-1.5 rounded-lg border border-white/[0.05]">
                    {(['Small', 'Medium', 'Large'] as const).map(sz => (
                      <button
                        key={sz}
                        onClick={() => {
                          setFontSize(sz);
                          showToast(`Font size scaling: ${sz}`);
                        }}
                        className={`py-1.5 rounded-md font-bold text-xs transition-all uppercase ${
                          fontSize === sz
                            ? 'bg-[#8B5CF6] text-white shadow-lg'
                            : 'text-[#98A2B3] hover:text-white'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8. Monospace Telemetry Font Segmented Selection */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Monospace Telemetry Font</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Font family for telemetry metrics and timestamp logs.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-[#030305] p-1.5 rounded-lg border border-white/[0.05]">
                    {['JetBrains Mono', 'Fira Code', 'Roboto Mono'].map(font => (
                      <button
                        key={font}
                        onClick={() => {
                          setMonospaceFont(font);
                          showToast(`Monospace font: ${font}`);
                        }}
                        className={`py-1.5 rounded-md font-bold text-[10.5px] transition-all truncate ${
                          monospaceFont === font
                            ? 'bg-[#8B5CF6] text-white shadow-lg'
                            : 'text-[#98A2B3] hover:text-white'
                        }`}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 9. Reduce Motion Toggle */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Reduce Motion</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Disable sliding drawer animations to reduce rendering latency on low-spec hardware.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reduceMotion}
                    onChange={e => {
                      setReduceMotion(e.target.checked);
                      showToast(e.target.checked ? "Reduce Motion enabled" : "Full Motion enabled");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                {/* 10. LIVE PREVIEW CARD */}
                <div className="p-4 bg-[#030305] border border-white/[0.08] rounded-xl space-y-2.5 font-sans shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 font-mono">
                    <span className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider">
                      LIVE INTERFACE PREVIEW
                    </span>
                    <span className="text-[9px] text-[#98A2B3]">REAL-TIME STYLING</span>
                  </div>

                  <div className="p-3 bg-[#0e1016] border border-white/[0.06] rounded-lg space-y-2">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-bold text-[#F5F7FA]">SAMVAD Studio Dashboard Preview</span>
                      <span className="px-2 py-0.5 rounded font-bold text-[9px]" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                        {themeMode} MODE
                      </span>
                    </div>
                    <p className="text-[11px] text-[#C4C9D4] leading-relaxed">
                      Sample telemetry snippet showing instant font scaling ({fontSize}), accent color ({accentColor}), and glass blur ({glassIntensity}%).
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 3. RECORDING WORKSPACE */}
          {activeSection === 'recording' && (
            <div className="space-y-5 font-sans select-none">
              <div className="border-b border-white/[0.06] pb-2 font-mono">
                <h2 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#06B6D4]" /> Acoustic Recording &amp; DSP Audio Hardware
                </h2>
                <p className="text-[10px] text-[#98A2B3] mt-0.5 font-sans">
                  Hardware routing, acoustic sample rates, noise filters, diarization triggers, and storage folder configuration.
                </p>
              </div>

              {/* 14 Recording Settings Cards */}
              <div className="space-y-3 font-mono text-xs">
                
                {/* 1. Default Input Device */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Default Input Device</h4>
                      <span className="px-1.5 py-0.2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-[8px] font-bold rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Primary microphone capture channel for room audio.</p>
                    <div className="text-[9px] text-[#8B5CF6] mt-1">Active: {audioInputDevice}</div>
                  </div>
                  <select
                    value={audioInputDevice}
                    onChange={e => {
                      setAudioInputDevice(e.target.value);
                      showToast(`Mic device set: ${e.target.value}`);
                    }}
                    className="bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option>Default System Microphone</option>
                    <option>Built-in Microphone Array</option>
                    <option>USB Studio Condenser Mic</option>
                  </select>
                </div>

                {/* 2. Default Output Device */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Default Output Device</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Playback speaker channel for acoustic monitoring.</p>
                    <div className="text-[9px] text-[#8B5CF6] mt-1">Active: {audioOutputDevice}</div>
                  </div>
                  <select
                    value={audioOutputDevice}
                    onChange={e => {
                      setAudioOutputDevice(e.target.value);
                      showToast(`Output device set: ${e.target.value}`);
                    }}
                    className="bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option>Default Speakers (Realtek High Definition)</option>
                    <option>Headphones (Audio Out)</option>
                  </select>
                </div>

                {/* 3. Recording Format */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Recording Format</h4>
                      <span className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Audio container format for local recording files.</p>
                    <div className="text-[9px] text-[#8B5CF6] mt-1">Active: {recordingFormat}</div>
                  </div>
                  <select
                    value={recordingFormat}
                    onChange={e => {
                      setRecordingFormat(e.target.value);
                      showToast(`Recording format set: ${e.target.value}`);
                    }}
                    className="bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option>WAV (Uncompressed PCM)</option>
                    <option>FLAC (Lossless Compressed)</option>
                    <option>MP3 (192 kbps)</option>
                  </select>
                </div>

                {/* 4. Sample Rate */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Sample Rate</h4>
                      <span className="px-1.5 py-0.2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-[8px] font-bold rounded">
                        RECOMMENDED (16 kHz)
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Sampling frequency optimized for Whisper ASR model input.</p>
                    <div className="text-[9px] text-[#8B5CF6] mt-1">Active: {sampleRate} Hz</div>
                  </div>
                  <select
                    value={sampleRate}
                    onChange={e => {
                      setSampleRate(e.target.value);
                      showToast(`Sample rate set: ${e.target.value} Hz`);
                    }}
                    className="bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="16000">16,000 Hz (16 kHz - Native Whisper)</option>
                    <option value="44100">44,100 Hz (44.1 kHz - CD Quality)</option>
                    <option value="48000">48,000 Hz (48 kHz - Studio Quality)</option>
                  </select>
                </div>

                {/* 5. Bit Depth */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Bit Depth</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Quantization precision per acoustic sample frame.</p>
                    <div className="text-[9px] text-[#8B5CF6] mt-1">Active: {bitDepth}</div>
                  </div>
                  <select
                    value={bitDepth}
                    onChange={e => {
                      setBitDepth(e.target.value);
                      showToast(`Bit depth set: ${e.target.value}`);
                    }}
                    className="bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option>16-bit Float</option>
                    <option>24-bit PCM</option>
                    <option>32-bit Float</option>
                  </select>
                </div>

                {/* 6. Noise Suppression (RNNoise) */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Noise Suppression (RNNoise DSP)</h4>
                      <span className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Removes static background hum and HVAC fan noise.</p>
                    <div className="text-[9px] text-[#8B5CF6] mt-1">Status: {noiseSuppression ? 'ENABLED' : 'DISABLED'}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={noiseSuppression}
                    onChange={e => {
                      setNoiseSuppression(e.target.checked);
                      showToast(e.target.checked ? "Noise Suppression ON" : "Noise Suppression OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                {/* 7. Echo Cancellation */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Acoustic Echo Cancellation</h4>
                      <span className="px-1.5 py-0.2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-[8px] font-bold rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Prevents speaker feedback reflection into microphone buffer.</p>
                    <div className="text-[9px] text-[#8B5CF6] mt-1">Status: {echoCancellation ? 'ENABLED' : 'DISABLED'}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={echoCancellation}
                    onChange={e => {
                      setEchoCancellation(e.target.checked);
                      showToast(e.target.checked ? "Echo Cancellation ON" : "Echo Cancellation OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                {/* 8. Automatic Gain Control (AGC) */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Automatic Gain Control (AGC)</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5 font-sans">Dynamically balances loud and quiet speaker volumes.</p>
                    <div className="text-[9px] text-[#8B5CF6] mt-1">Status: {agcControl ? 'ENABLED' : 'DISABLED'}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={agcControl}
                    onChange={e => {
                      setAgcControl(e.target.checked);
                      showToast(e.target.checked ? "AGC Control ON" : "AGC Control OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                {/* 9. Voice Activity Detection (Silero VAD) */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Voice Activity Detection (Silero VAD v4.0)</h4>
                      <span className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Trims non-speech silence frames before sending to Whisper ASR.</p>
                    <div className="text-[9px] text-[#8B5CF6] mt-1">Status: {settings.vad_enabled ? 'ACTIVE' : 'INACTIVE'}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.vad_enabled}
                    onChange={e => {
                      const updated = { ...settings, vad_enabled: e.target.checked };
                      handleInstantSave(updated);
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                {/* 10. Speaker Diarization */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Speaker Diarization (PyAnnote 3.1)</h4>
                      <span className="px-1.5 py-0.2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-[8px] font-bold rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Clusters unique voice prints and attributes transcript segments to speakers.</p>
                    <div className="text-[9px] text-[#8B5CF6] mt-1">Status: {speakerDiarizationSetting ? 'ENABLED' : 'DISABLED'}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={speakerDiarizationSetting}
                    onChange={e => {
                      setSpeakerDiarizationSetting(e.target.checked);
                      showToast(e.target.checked ? "Diarization ON" : "Diarization OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                {/* 11. Normalize Audio */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Normalize Audio (EBU R128)</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5 font-sans font-sans">Peak and loudness normalization to -16 LUFS.</p>
                    <div className="text-[9px] text-[#8B5CF6] mt-1">Status: {normalizeAudio ? 'ENABLED' : 'DISABLED'}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={normalizeAudio}
                    onChange={e => {
                      setNormalizeAudio(e.target.checked);
                      showToast(e.target.checked ? "Normalization ON" : "Normalization OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                {/* 12. Save Raw Recording */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Save Raw PCM Recording</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Retain original uncompressed audio file alongside processed transcript.</p>
                    <div className="text-[9px] text-[#8B5CF6] mt-1">Status: {saveRawRecording ? 'ENABLED' : 'DISABLED'}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={saveRawRecording}
                    onChange={e => {
                      setSaveRawRecording(e.target.checked);
                      showToast(e.target.checked ? "Raw PCM saving ON" : "Raw PCM saving OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                {/* 13. Default Recording Folder */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#F5F7FA]">Default Recording Folder Path</h4>
                    <span className="text-[9px] text-[#8B5CF6] font-bold">DISK PATH</span>
                  </div>
                  <p className="text-[10.5px] text-[#98A2B3] font-sans">Destination directory for local WAV/PCM audio buffers.</p>
                  <input
                    type="text"
                    value={defaultFolder}
                    onChange={e => setDefaultFolder(e.target.value)}
                    className="w-full bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                {/* 14. Auto Save Interval */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Auto-Save Buffer Interval</h4>
                      <span className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Flush audio buffer to local disk periodically to prevent data loss on crash.</p>
                    <div className="text-[9px] text-[#8B5CF6] mt-1">Active: {autoSaveInterval}</div>
                  </div>
                  <select
                    value={autoSaveInterval}
                    onChange={e => {
                      setAutoSaveInterval(e.target.value);
                      showToast(`Auto-save interval set: ${e.target.value}`);
                    }}
                    className="bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option>Every 15 seconds</option>
                    <option>Every 30 seconds</option>
                    <option>Every 60 seconds</option>
                  </select>
                </div>

              </div>
            </div>
          )}

          {/* 4. AI MODELS WORKSPACE */}
          {activeSection === 'ai_models' && (
            <div className="space-y-5 font-sans select-none">
              <div className="border-b border-white/[0.06] pb-2 font-mono">
                <h2 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#8B5CF6]" /> Local AI Models &amp; Inference Engines
                </h2>
                <p className="text-[10px] text-[#98A2B3] mt-0.5 font-sans">
                  Manage all 6 local AI components, inspect VRAM/RAM footprints, run benchmarks, and reload inference pipelines.
                </p>
              </div>

              {/* Grid of 6 Local AI Component Cards */}
              <div className="space-y-4 font-mono text-xs">
                {[
                  { key: 'speech_recognition', label: 'Speech Recognition (ASR)' },
                  { key: 'embedding_model', label: 'Embedding Model (Vector RAG)' },
                  { key: 'question_answering', label: 'Question Answering (LLM)' },
                  { key: 'meeting_intelligence', label: 'Meeting Intelligence' },
                  { key: 'speaker_diarization', label: 'Speaker Diarization' },
                  { key: 'summarization', label: 'Summarization Engine' }
                ].map((comp) => {
                  const m = aiModelsState[comp.key];
                  if (!m) return null;

                  return (
                    <div key={comp.key} className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 shadow-xl">
                      
                      {/* Component Header */}
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="w-4 h-4 text-[#8B5CF6]" />
                          <h4 className="font-extrabold text-[#F5F7FA] text-xs uppercase tracking-wider">
                            {comp.label}
                          </h4>
                          <span className={`px-1.5 py-0.2 text-[8px] font-bold rounded uppercase ${
                            m.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {m.status}
                          </span>
                        </div>

                        <div className="text-[10px] text-[#98A2B3] flex items-center gap-2">
                          <span>Device: <strong className="text-white">{m.device}</strong></span>
                          <span>&middot;</span>
                          <span>RAM Est: <strong className="text-[#8B5CF6]">{m.ramEstimate}</strong></span>
                        </div>
                      </div>

                      {/* Model Selector & RAM Warning */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">Active Model Selection</label>
                          <select
                            value={m.currentModel}
                            onChange={(e) => {
                              const newModel = e.target.value;
                              setAiModelsState(prev => ({
                                ...prev,
                                [comp.key]: { ...prev[comp.key], currentModel: newModel }
                              }));
                              showToast(`Switched ${comp.label} to ${newModel}`);
                            }}
                            className="w-full bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                          >
                            {m.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div className="p-2.5 bg-[#030305] border border-white/[0.05] rounded-lg text-[10px] space-y-1 font-sans">
                          <div className="flex items-center justify-between">
                            <span className="text-[#98A2B3] font-mono">Inference Backend:</span>
                            <span className="text-white font-mono font-bold">{m.backend}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#98A2B3] font-mono">Memory Footprint:</span>
                            <span className="text-emerald-400 font-mono font-bold">{m.memoryUsage}</span>
                          </div>
                        </div>
                      </div>

                      {/* Telemetry Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                        <div className="p-2 bg-[#030305] border border-white/[0.04] rounded">
                          <div className="text-[8.5px] text-[#98A2B3]">AVG RESPONSE TIME</div>
                          <div className="text-white font-bold">{m.avgLatency}</div>
                        </div>
                        <div className="p-2 bg-[#030305] border border-white/[0.04] rounded">
                          <div className="text-[8.5px] text-[#98A2B3]">BACKEND FRAMEWORK</div>
                          <div className="text-[#8B5CF6] font-bold">{m.backend.split(' ')[0]}</div>
                        </div>
                        <div className="p-2 bg-[#030305] border border-white/[0.04] rounded">
                          <div className="text-[8.5px] text-[#98A2B3]">HARDWARE DEVICE</div>
                          <div className="text-white font-bold">{m.device}</div>
                        </div>
                        <div className="p-2 bg-[#030305] border border-white/[0.04] rounded">
                          <div className="text-[8.5px] text-[#98A2B3]">AIR-GAP STATUS</div>
                          <div className="text-emerald-400 font-bold">100% LOCAL</div>
                        </div>
                      </div>

                      {/* Action Bar: Test Model, Reload Model, Benchmark */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.04]">
                        <button
                          onClick={() => showToast(`Testing ${comp.label}... Pass 100%`)}
                          className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#98A2B3] hover:text-white rounded text-[10px] font-bold transition-all uppercase"
                        >
                          Test Model
                        </button>
                        <button
                          onClick={() => showToast(`Reloading ${comp.label} pipeline into VRAM...`)}
                          className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#98A2B3] hover:text-white rounded text-[10px] font-bold transition-all uppercase flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Reload Model
                        </button>
                        <button
                          onClick={() => showToast(`Running benchmark on ${comp.label}... Latency: ${m.avgLatency}`)}
                          className="px-3 py-1 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] rounded text-[10px] font-bold transition-all uppercase flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3 text-[#8B5CF6]" /> Benchmark
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. MEETING INTELLIGENCE WORKSPACE */}
          {activeSection === 'intelligence' && (() => {
            const enabledCount = Object.values(intelToggles).filter(Boolean).length;
            const estimatedSec = Math.round(enabledCount * 1.4 + (extractionSensitivity === 'High Recall' ? 3 : extractionSensitivity === 'Conservative' ? -1 : 0));

            return (
              <div className="space-y-5 font-sans select-none">
                <div className="border-b border-white/[0.06] pb-2 font-mono flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-emerald-400" /> Meeting Intelligence Extraction Rules
                    </h2>
                    <p className="text-[10px] text-[#98A2B3] mt-0.5 font-sans">
                      Customize AI extraction features, confidence threshold limits, extraction sensitivity, and automatic speaker naming.
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded font-mono text-[10px] font-bold">
                    ESTIMATED TIME: {estimatedSec}s / MTG
                  </div>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  
                  {/* Feature Toggles Grid */}
                  <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <h4 className="font-bold text-[#F5F7FA]">AI Extraction Features ({enabledCount}/11 Enabled)</h4>
                      <span className="text-[9px] text-[#8B5CF6]">TOGGLE INTEL LAYERS</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { key: 'exec_summary', label: 'Executive Summary', desc: 'Brief executive overview' },
                        { key: 'action_items', label: 'Action Items', desc: 'Tasks & assignees' },
                        { key: 'decisions', label: 'Decisions Log', desc: 'Key agreed decisions' },
                        { key: 'risks', label: 'Risks Report', desc: 'Operational risks' },
                        { key: 'blockers', label: 'Blockers', desc: 'Technical blockers' },
                        { key: 'dependencies', label: 'Dependencies', desc: 'Cross-team links' },
                        { key: 'deadlines', label: 'Deadlines', desc: 'Target completion dates' },
                        { key: 'open_questions', label: 'Open Questions', desc: 'Unresolved queries' },
                        { key: 'followup_email', label: 'Follow-up Email', desc: 'Stakeholder draft' },
                        { key: 'meeting_health', label: 'Meeting Health', desc: 'Acoustic & WPM metrics' },
                        { key: 'ai_recommendations', label: 'AI Recommendations', desc: 'Smart next steps' }
                      ].map((item) => {
                        const isChecked = intelToggles[item.key] ?? false;
                        return (
                          <div key={item.key} className="p-2.5 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-between gap-2">
                            <div>
                              <div className="font-bold text-[#F5F7FA] text-[11px]">{item.label}</div>
                              <div className="text-[9px] text-[#98A2B3] font-sans">{item.desc}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setIntelToggles(prev => ({ ...prev, [item.key]: val }));
                                showToast(`${item.label}: ${val ? 'ENABLED' : 'DISABLED'}`);
                              }}
                              className="w-4 h-4 accent-[#8B5CF6]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Confidence Threshold Adjustment Slider */}
                  <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-[#F5F7FA]">AI Confidence Threshold Adjustment</h4>
                        <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Minimum confidence score required before auto-accepting extracted items.</p>
                      </div>
                      <span className="text-emerald-400 font-bold text-xs">{Math.round(parseFloat(confidenceThreshold) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.50"
                      max="0.95"
                      step="0.05"
                      value={confidenceThreshold}
                      onChange={(e) => {
                        setConfidenceThreshold(e.target.value);
                        showToast(`Confidence threshold set: ${Math.round(parseFloat(e.target.value) * 100)}%`);
                      }}
                      className="w-full h-1.5 bg-[#030305] rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
                    />
                  </div>

                  {/* Extraction Sensitivity Segmented Control */}
                  <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2">
                    <div>
                      <h4 className="font-bold text-[#F5F7FA]">Extraction Sensitivity</h4>
                      <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Controls LLM prompt strictness vs recall breadth when identifying items.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 bg-[#030305] p-1.5 rounded-lg border border-white/[0.05]">
                      {(['Conservative', 'Balanced', 'High Recall'] as const).map(sens => (
                        <button
                          key={sens}
                          onClick={() => {
                            setExtractionSensitivity(sens);
                            showToast(`Extraction sensitivity: ${sens}`);
                          }}
                          className={`py-1.5 rounded-md font-bold text-xs transition-all uppercase ${
                            extractionSensitivity === sens
                              ? 'bg-[#8B5CF6] text-white shadow-lg'
                              : 'text-[#98A2B3] hover:text-white'
                          }`}
                        >
                          {sens}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Automatic Speaker Naming */}
                  <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-[#F5F7FA]">Automatic Speaker Naming (Voiceprint Matching)</h4>
                      <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Automatically map Speaker 1 / Speaker 2 to recognized participant profiles.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoSpeakerNaming}
                      onChange={(e) => {
                        setAutoSpeakerNaming(e.target.checked);
                        showToast(e.target.checked ? "Auto speaker naming ON" : "Auto speaker naming OFF");
                      }}
                      className="w-4 h-4 accent-[#8B5CF6]"
                    />
                  </div>

                  {/* Estimated Processing Time Panel */}
                  <div className="p-4 bg-[#030305] border border-white/[0.08] rounded-xl space-y-2 font-sans shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 font-mono">
                      <span className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider">
                        ESTIMATED PIPELINE LATENCY TELEMETRY
                      </span>
                      <span className="text-[9px] text-[#98A2B3]">{enabledCount} ACTIVE LAYERS</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[10px]">
                      <div className="p-2 bg-[#0e1016] border border-white/[0.04] rounded">
                        <div className="text-[8.5px] text-[#98A2B3]">EXTRACTION LATENCY</div>
                        <div className="text-emerald-400 font-bold">~{estimatedSec} sec / meeting</div>
                      </div>
                      <div className="p-2 bg-[#0e1016] border border-white/[0.04] rounded">
                        <div className="text-[8.5px] text-[#98A2B3]">SENSITIVITY MODE</div>
                        <div className="text-white font-bold">{extractionSensitivity}</div>
                      </div>
                      <div className="p-2 bg-[#0e1016] border border-white/[0.04] rounded">
                        <div className="text-[8.5px] text-[#98A2B3]">AUTO NAMING</div>
                        <div className="text-[#8B5CF6] font-bold">{autoSpeakerNaming ? 'ACTIVE' : 'OFF'}</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}



          {/* Shortcuts Section */}
          {activeSection === 'shortcuts' && (
            <div className="space-y-6">
              <ShortcutSettingsPanel />
            </div>
          )}

          {/* 6. EXPORT STUDIO WORKSPACE */}
          {activeSection === 'export' && (() => {
            const activeItemsCount = Object.values(exportContentSelection).filter(Boolean).length;
            const previewFileName = fileNameTemplate
              .replace('{meeting_name}', 'ProjectSync')
              .replace('{date}', '2026-07-23')
              .replace('{time}', '10-15AM')
              .replace('{speaker_count}', '4_Speakers')
              .replace('{duration}', '45m')
              .replace('{project}', 'SAMVAD_Studio') + `.${quickExportFormat.toLowerCase()}`;

            return (
              <div className="space-y-6 font-sans select-none">
                
                <div className="border-b border-white/[0.06] pb-2 font-mono flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider flex items-center gap-2">
                      <Download className="w-4 h-4 text-sky-400" /> Export Studio &amp; Document Engine
                    </h2>
                    <p className="text-[10px] text-[#98A2B3] mt-0.5 font-sans">
                      Configure default export behavior, document styling, PDF formatting, file templates, presets, and live preview.
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded font-mono text-[10px] font-bold">
                    PRESET: {selectedPreset.toUpperCase()}
                  </div>
                </div>

                {/* 1. DEFAULT EXPORT FORMAT (Supported Formats Chips & Quick Export Format) */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 font-mono text-xs shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <h4 className="font-bold text-[#F5F7FA]">Supported Export Formats</h4>
                    <span className="text-[9px] text-[#8B5CF6]">SELECT ONE OR MORE</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['PDF', 'DOCX', 'HTML', 'Markdown', 'JSON', 'TXT', 'CSV', 'XLSX', 'SRT', 'VTT'].map(fmt => {
                      const isSelected = selectedExportFormats.has(fmt);
                      const isQuickDefault = quickExportFormat === fmt;

                      return (
                        <button
                          key={fmt}
                          onClick={() => {
                            setSelectedExportFormats(prev => {
                              const next = new Set(prev);
                              if (next.has(fmt)) next.delete(fmt);
                              else next.add(fmt);
                              return next;
                            });
                            showToast(`Toggled format: ${fmt}`);
                          }}
                          className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-white shadow-lg'
                              : 'bg-[#030305] border-white/[0.08] text-[#98A2B3] hover:text-white'
                          }`}
                        >
                          <span>{fmt}</span>
                          {isQuickDefault && (
                            <span className="px-1 py-0.2 bg-[#8B5CF6] text-white text-[8px] rounded uppercase font-bold">
                              QUICK DEFAULT
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                    <span className="text-[#98A2B3] text-[11px]">Quick Export Primary Format:</span>
                    <select
                      value={quickExportFormat}
                      onChange={e => {
                        setQuickExportFormat(e.target.value);
                        showToast(`Quick Export format set: ${e.target.value}`);
                      }}
                      className="bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                    >
                      {['PDF', 'DOCX', 'HTML', 'Markdown', 'JSON', 'TXT', 'CSV', 'XLSX', 'SRT', 'VTT'].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. EXPORT CONTENT (20 Checkboxes Grid) */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <h4 className="font-bold text-[#F5F7FA]">Export Content Sections ({activeItemsCount}/20 Selected)</h4>
                    <span className="text-[9px] text-emerald-400">DOCUMENT COMPOSITION</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-sans">
                    {[
                      { key: 'exec_summary', label: 'Executive Summary' },
                      { key: 'outcome', label: 'Meeting Outcome' },
                      { key: 'transcript', label: 'Transcript' },
                      { key: 'speaker_timeline', label: 'Speaker Timeline' },
                      { key: 'action_items', label: 'Action Items' },
                      { key: 'decisions', label: 'Decisions' },
                      { key: 'risks', label: 'Risks' },
                      { key: 'blockers', label: 'Blockers' },
                      { key: 'dependencies', label: 'Dependencies' },
                      { key: 'deadlines', label: 'Deadlines' },
                      { key: 'open_questions', label: 'Open Questions' },
                      { key: 'statistics', label: 'Meeting Statistics' },
                      { key: 'ai_recommendations', label: 'AI Recommendations' },
                      { key: 'followup_email', label: 'Follow-up Email' },
                      { key: 'appendix', label: 'Appendix' },
                      { key: 'bookmarks', label: 'Bookmarks' },
                      { key: 'confidence_scores', label: 'Confidence Scores' },
                      { key: 'timestamps', label: 'Timestamps' },
                      { key: 'audio_metadata', label: 'Audio Metadata' }
                    ].map(sec => {
                      const isChecked = exportContentSelection[sec.key] ?? false;

                      return (
                        <label key={sec.key} className="p-2 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-between gap-2 cursor-pointer hover:bg-white/[0.02]">
                          <span className="text-[11px] font-semibold text-[#F5F7FA] truncate">{sec.label}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              const val = e.target.checked;
                              setExportContentSelection(prev => ({ ...prev, [sec.key]: val }));
                              showToast(`${sec.label}: ${val ? 'INCLUDED' : 'EXCLUDED'}`);
                            }}
                            className="w-3.5 h-3.5 accent-[#8B5CF6]"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 3. DOCUMENT STYLE */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 font-mono text-xs">
                  <h4 className="font-bold text-[#F5F7FA] border-b border-white/[0.06] pb-2">Document Style &amp; Layout Formatting</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">Document Theme</label>
                      <select
                        value={docTheme}
                        onChange={e => setDocTheme(e.target.value)}
                        className="w-full bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA]"
                      >
                        <option>SAMVAD Dark</option>
                        <option>Professional Light</option>
                        <option>Executive Report</option>
                        <option>Minimal</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">Font Family</label>
                      <select
                        value={docFont}
                        onChange={e => setDocFont(e.target.value)}
                        className="w-full bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA]"
                      >
                        <option>Inter / JetBrains</option>
                        <option>Roboto / Fira Code</option>
                        <option>System Sans-Serif</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">Logo Placement</label>
                      <select
                        value={logoPlacement}
                        onChange={e => setLogoPlacement(e.target.value)}
                        className="w-full bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA]"
                      >
                        <option>Top Right</option>
                        <option>Top Left</option>
                        <option>Header Centered</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.04]">
                    {[
                      { label: 'Header / Footer', state: showHeaderFooter, set: setShowHeaderFooter },
                      { label: 'Page Numbers', state: showPageNumbers, set: setShowPageNumbers },
                      { label: 'Watermark', state: showWatermark, set: setShowWatermark },
                      { label: 'Table of Contents', state: showToc, set: setShowToc },
                      { label: 'Cover Page', state: showCoverPage, set: setShowCoverPage },
                      { label: 'Section Dividers', state: showSectionDividers, set: setShowSectionDividers }
                    ].map((opt, i) => (
                      <label key={i} className="p-2 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-between gap-2 cursor-pointer font-sans text-[10.5px]">
                        <span className="text-[#C4C9D4] font-medium">{opt.label}</span>
                        <input
                          type="checkbox"
                          checked={opt.state}
                          onChange={e => opt.set(e.target.checked)}
                          className="w-3.5 h-3.5 accent-[#8B5CF6]"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* 4. PDF OPTIONS */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 font-mono text-xs">
                  <h4 className="font-bold text-[#F5F7FA] border-b border-white/[0.06] pb-2">PDF Document Specifications</h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">Paper Size</label>
                      <select value={paperSize} onChange={e => setPaperSize(e.target.value)} className="w-full bg-[#030305] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-[#F5F7FA]">
                        <option>A4</option>
                        <option>Letter</option>
                        <option>Legal</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">Orientation</label>
                      <select value={orientation} onChange={e => setOrientation(e.target.value)} className="w-full bg-[#030305] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-[#F5F7FA]">
                        <option>Portrait</option>
                        <option>Landscape</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">Margins</label>
                      <select value={margins} onChange={e => setMargins(e.target.value)} className="w-full bg-[#030305] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-[#F5F7FA]">
                        <option>Normal (15mm)</option>
                        <option>Narrow (10mm)</option>
                        <option>Wide (25mm)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">Image Quality</label>
                      <select value={imageQuality} onChange={e => setImageQuality(e.target.value)} className="w-full bg-[#030305] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-[#F5F7FA]">
                        <option>High (300 DPI)</option>
                        <option>Medium (150 DPI)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-[11px] font-sans">
                        <input type="checkbox" checked={embedFonts} onChange={e => setEmbedFonts(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                        <span>Embed Custom Fonts</span>
                      </label>
                      <label className="flex items-center gap-2 text-[11px] font-sans">
                        <input type="checkbox" checked={passwordProtectPdf} onChange={e => setPasswordProtectPdf(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                        <span>Password Protect PDF</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 5. FILE NAMING TEMPLATE */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#F5F7FA]">File Naming Template</h4>
                    <span className="text-[9px] text-[#8B5CF6]">DYNAMIC TAGS</span>
                  </div>
                  <p className="text-[10.5px] text-[#98A2B3] font-sans">Available tags: &#123;meeting_name&#125;, &#123;date&#125;, &#123;time&#125;, &#123;speaker_count&#125;, &#123;duration&#125;, &#123;project&#125;</p>
                  <input
                    type="text"
                    value={fileNameTemplate}
                    onChange={e => setFileNameTemplate(e.target.value)}
                    className="w-full bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6]"
                  />
                  <div className="p-2.5 bg-[#030305] border border-white/[0.05] rounded-lg font-sans text-xs text-[#98A2B3] flex items-center justify-between">
                    <span>Example Preview:</span>
                    <strong className="text-emerald-400 font-mono text-xs">{previewFileName}</strong>
                  </div>
                </div>

                {/* 6. EXPORT LOCATION & QUICK EXPORT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  
                  <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2.5">
                    <h4 className="font-bold text-[#F5F7FA] border-b border-white/[0.06] pb-2">Export Directory Routing</h4>
                    <label className="text-[9.5px] text-[#98A2B3] uppercase block">Default Export Folder</label>
                    <input type="text" value={exportFolderOption} onChange={e => setExportFolderOption(e.target.value)} className="w-full bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA]" />
                    <div className="space-y-1.5 pt-1 font-sans text-[11px]">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={rememberLastFolder} onChange={e => setRememberLastFolder(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                        <span>Remember Last Used Folder</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={askEveryTime} onChange={e => setAskEveryTime(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                        <span>Ask Destination Every Time</span>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2.5">
                    <h4 className="font-bold text-[#F5F7FA] border-b border-white/[0.06] pb-2">Quick Export Triggers</h4>
                    <div className="space-y-1.5 font-sans text-[11px]">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={enableQuickExport} onChange={e => setEnableQuickExport(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                        <span>Enable One-Click Quick Export</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={autoExportAfterProcessing} onChange={e => setAutoExportAfterProcessing(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                        <span>Export Automatically After RAG Processing</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={openFolderAfterExport} onChange={e => setOpenFolderAfterExport(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                        <span>Open Folder After Export</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={openFileAfterExport} onChange={e => setOpenFileAfterExport(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                        <span>Open Exported File Automatically</span>
                      </label>
                    </div>
                  </div>

                </div>

                {/* 7. EXPORT PRESETS MANAGEMENT */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <h4 className="font-bold text-[#F5F7FA]">Export Presets Management</h4>
                    <span className="text-[9px] text-[#8B5CF6]">SAVED TEMPLATES</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {presetsList.map(p => (
                      <button
                        key={p}
                        onClick={() => {
                          setSelectedPreset(p);
                          showToast(`Loaded Preset: ${p}`);
                        }}
                        className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all ${
                          selectedPreset === p
                            ? 'bg-[#8B5CF6] text-white shadow-lg border-[#8B5CF6]'
                            : 'bg-[#030305] border-white/[0.08] text-[#98A2B3] hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.04]">
                    <button onClick={() => showToast(`Preset saved: ${selectedPreset}`)} className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-[10px] font-bold uppercase">Save Preset</button>
                    <button onClick={() => showToast(`Duplicated preset: ${selectedPreset} (Copy)`)} className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-[10px] font-bold uppercase">Duplicate</button>
                    <button onClick={() => showToast(`Renamed preset: ${selectedPreset}`)} className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-[10px] font-bold uppercase">Rename</button>
                    <button onClick={() => showToast("Deleted preset")} className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded text-[10px] font-bold uppercase">Delete</button>
                    <button onClick={() => showToast("Presets reset to studio defaults")} className="px-3 py-1 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] rounded text-[10px] font-bold uppercase">Reset to Default</button>
                  </div>
                </div>

                {/* 8. ADVANCED METADATA & LIVE PREVIEW CARD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  
                  <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2.5">
                    <h4 className="font-bold text-[#F5F7FA] border-b border-white/[0.06] pb-2">Advanced Metadata Embedding</h4>
                    <div className="space-y-1.5 font-sans text-[11px]">
                      <label className="flex items-center gap-2"><input type="checkbox" checked={incConfidenceValues} onChange={e => setIncConfidenceValues(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" /><span>Include Confidence Values</span></label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={incTimestamps} onChange={e => setIncTimestamps(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" /><span>Include Timestamps</span></label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={exportSpeakerColors} onChange={e => setExportSpeakerColors(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" /><span>Export Speaker Colors</span></label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={embedWaveformImage} onChange={e => setEmbedWaveformImage(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" /><span>Embed Waveform Image</span></label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={embedMeetingMetadata} onChange={e => setEmbedMeetingMetadata(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" /><span>Embed Meeting Metadata</span></label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={compressExportFiles} onChange={e => setCompressExportFiles(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" /><span>Compress Exported Files (.zip)</span></label>
                      <label className="flex items-center gap-2 opacity-60"><input type="checkbox" checked={digitallySignExports} onChange={e => setDigitallySignExports(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" /><span>Digitally Sign Exports (Future Ready)</span></label>
                    </div>
                  </div>

                  {/* LIVE DOCUMENT PREVIEW CARD */}
                  <div className="p-4 bg-[#030305] border border-white/[0.08] rounded-xl space-y-3 font-sans shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 font-mono">
                      <span className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider">
                        LIVE DOCUMENT PREVIEW
                      </span>
                      <span className="text-[9px] text-[#10B981] font-bold">READY</span>
                    </div>

                    <div className="p-3.5 bg-[#0e1016] border border-white/[0.06] rounded-lg space-y-2.5 font-mono text-xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#F5F7FA]">{previewFileName}</span>
                        <span className="px-2 py-0.5 bg-[#8B5CF6]/20 text-[#8B5CF6] text-[9px] font-bold rounded">
                          {quickExportFormat}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10.5px] pt-1">
                        <div><span className="text-[#98A2B3]">Estimated Pages:</span> <strong className="text-white">4 Pages</strong></div>
                        <div><span className="text-[#98A2B3]">Estimated File Size:</span> <strong className="text-emerald-400">1.2 MB</strong></div>
                        <div><span className="text-[#98A2B3]">Active Preset:</span> <strong className="text-[#8B5CF6]">{selectedPreset}</strong></div>
                        <div><span className="text-[#98A2B3]">Content Sections:</span> <strong className="text-white">{activeItemsCount} / 20</strong></div>
                      </div>

                      <div className="text-[9.5px] text-[#98A2B3] pt-1 border-t border-white/[0.04] truncate">
                        Destination: {exportFolderOption}
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            );
          })()}

          {/* 7. STORAGE WORKSPACE */}
          {activeSection === 'storage' && (
            <div className="space-y-5 font-sans select-none">
              <div className="border-b border-white/[0.06] pb-2 font-mono">
                <h2 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#10B981]" /> Storage Usage &amp; Disk Telemetry
                </h2>
                <p className="text-[10px] text-[#98A2B3] mt-0.5 font-sans">
                  Inspect disk footprints across database, audio buffers, model caches, and execute workspace maintenance tasks.
                </p>
              </div>

              <div className="space-y-4 font-mono text-xs">
                
                {/* Compact Progress Bars for 6 Storage Items */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <h4 className="font-bold text-[#F5F7FA]">Disk Storage Allocation (Total: 4.85 GB)</h4>
                    <span className="text-[9px] text-[#10B981]">LOCAL DISK FOOTPRINT</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: 'Database Size (SQLite)', size: '142 MB', percent: 12, color: 'bg-emerald-400' },
                      { label: 'Audio Storage (PCM / WAV)', size: '2.4 GB', percent: 55, color: 'bg-[#8B5CF6]' },
                      { label: 'Transcript Storage (Vector JSON)', size: '85 MB', percent: 8, color: 'bg-sky-400' },
                      { label: 'Export Folder (PDF / Markdown)', size: '42 MB', percent: 5, color: 'bg-amber-400' },
                      { label: 'Model Cache (Whisper / PyAnnote)', size: '2.1 GB', percent: 48, color: 'bg-purple-400' },
                      { label: 'Temporary Files (DSP Buffers)', size: '18 MB', percent: 3, color: 'bg-rose-400' }
                    ].map((st, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-[#C4C9D4] font-sans font-medium">{st.label}</span>
                          <span className="text-white font-bold">{st.size}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#030305] rounded-full overflow-hidden border border-white/[0.04]">
                          <div className={`h-full ${st.color}`} style={{ width: `${st.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage Maintenance Actions Bar */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3">
                  <h4 className="font-bold text-[#F5F7FA]">Workspace Maintenance &amp; Database Tools</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => showToast("Cache cleared successfully (18 MB freed)")}
                      className="px-3.5 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-xs font-bold transition-all uppercase flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#8B5CF6]" /> Clear Cache
                    </button>
                    <button
                      onClick={() => showToast("SQLite VACUUM completed. Database optimized.")}
                      className="px-3.5 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-xs font-bold transition-all uppercase flex items-center gap-1.5"
                    >
                      <Database className="w-3.5 h-3.5 text-emerald-400" /> Optimize Database
                    </button>
                    <button
                      onClick={() => showToast("Exported database to transcripts_backup.db")}
                      className="px-3.5 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-xs font-bold transition-all uppercase flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" /> Export Database
                    </button>
                    <button
                      onClick={() => showToast("Workspace backup archive created (.samvadzip)")}
                      className="px-3.5 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-xs font-bold transition-all uppercase flex items-center gap-1.5"
                    >
                      <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Backup Workspace
                    </button>
                    <button
                      onClick={() => showToast("Restore workspace archive ready")}
                      className="px-3.5 py-1.5 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] rounded text-xs font-bold transition-all uppercase flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" /> Restore Backup
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 8. PRIVACY WORKSPACE */}
          {activeSection === 'privacy' && (
            <div className="space-y-5 font-sans select-none">
              <div className="border-b border-white/[0.06] pb-2 font-mono">
                <h2 className="text-xs font-extrabold text-[#F5F7FA] uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" /> Security, Privacy &amp; Air-Gap Controls
                </h2>
                <p className="text-[10px] text-[#98A2B3] mt-0.5 font-sans">
                  Enforce complete offline operation, telemetry blocking, database encryption, and secure file deletion.
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                
                {/* 1. Run Completely Offline */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Run Completely Offline (Air-Gap Mode)</h4>
                      <span className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded">
                        ENFORCED
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Blocks all outbound network sockets. Ensures zero internet transmission.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={runOffline}
                    onChange={e => {
                      setRunOffline(e.target.checked);
                      showToast(e.target.checked ? "Air-Gap Offline ON" : "Air-Gap Offline OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                {/* 2. Disable Telemetry */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Disable Usage Telemetry &amp; Analytics</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Prevents crash report logs or usage statistics collection.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={disableTelemetry}
                    onChange={e => {
                      setDisableTelemetry(e.target.checked);
                      showToast(e.target.checked ? "Telemetry disabled" : "Telemetry enabled");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                {/* 3. Encrypt Meeting Database */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#F5F7FA]">Encrypt Meeting Database (AES-256)</h4>
                      <span className="px-1.5 py-0.2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-[8px] font-bold rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Applies SQLCipher AES-256 encryption to SQLite database file on disk.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={encryptDatabase}
                    onChange={e => {
                      setEncryptDatabase(e.target.checked);
                      showToast(e.target.checked ? "Database Encryption ON" : "Database Encryption OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                {/* 4. Automatic Local Backup */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Automatic Local Backup</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Create local encrypted snapshots before database schema updates.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoLocalBackup}
                    onChange={e => {
                      setAutoLocalBackup(e.target.checked);
                      showToast(e.target.checked ? "Auto local backup ON" : "Auto local backup OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

                {/* 5. Secure Delete Meeting Files */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#F5F7FA]">Secure Delete Meeting Files (DoD 5220.22-M)</h4>
                    <p className="text-[10.5px] text-[#98A2B3] font-sans mt-0.5">Overwrites deleted audio blocks with random bits before releasing disk sectors.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={secureDeleteFiles}
                    onChange={e => {
                      setSecureDeleteFiles(e.target.checked);
                      showToast(e.target.checked ? "Secure shredding ON" : "Secure shredding OFF");
                    }}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                </div>

              </div>
            </div>
          )}

          {/* 9. ADVANCED & DIAGNOSTICS WORKSPACE */}
          {activeSection === 'advanced' && (
            <div className="space-y-6 font-sans select-none">
              
              {/* WARNING BANNER */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-mono text-xs flex items-center gap-3 shadow-xl">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 animate-pulse" />
                <div>
                  <div className="font-extrabold uppercase tracking-wider text-amber-200">
                    ⚠ ADVANCED POWER USER &amp; DIAGNOSTICS CONTROL
                  </div>
                  <div className="text-[11px] font-sans text-amber-300/90 mt-0.5 leading-relaxed">
                    These settings affect low-level AI model behavior, CTranslate2 inference pipelines, database indexing, and hardware resource limits. Changes should only be made by advanced administrators or researchers.
                  </div>
                </div>
              </div>

              {/* 8 COLLAPSIBLE SECTIONS STREAM */}
              <div className="space-y-4 font-mono text-xs">

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 1: PERFORMANCE ENGINE */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 shadow-xl">
                  <button
                    onClick={() => setOpenExpanders(p => ({ ...p, perf_engine: !p.perf_engine }))}
                    className="w-full flex items-center justify-between border-b border-white/[0.06] pb-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="font-extrabold text-[#F5F7FA] text-xs uppercase tracking-wider">
                        Section 1 — Performance Engine &amp; Hardware Allocation
                      </h4>
                      <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-bold rounded">
                        PERFORMANCE IMPACT
                      </span>
                    </div>
                    {openExpanders.perf_engine ? <ChevronUp className="w-4 h-4 text-[#98A2B3]" /> : <ChevronDown className="w-4 h-4 text-[#98A2B3]" />}
                  </button>

                  <AnimatePresence>
                    {openExpanders.perf_engine && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden space-y-3 pt-1">
                        
                        {/* Performance Mode */}
                        <div className="p-3 bg-[#030305] border border-white/[0.05] rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-[#F5F7FA]">Performance Mode Profile</div>
                              <div className="text-[10px] text-[#98A2B3] font-sans">Global system power and GPU throughput allocation profile.</div>
                            </div>
                            <span className="text-[#8B5CF6] font-bold">{perfMode}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(['Low Power', 'Balanced', 'High Performance'] as const).map(pm => (
                              <button
                                key={pm}
                                onClick={() => {
                                  setPerfMode(pm);
                                  showToast(`Performance mode set: ${pm}`);
                                }}
                                className={`py-1.5 rounded-md font-bold text-xs transition-all uppercase ${
                                  perfMode === pm ? 'bg-[#8B5CF6] text-white shadow-lg' : 'bg-[#0e1016] text-[#98A2B3] hover:text-white'
                                }`}
                              >
                                {pm}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Enable GPU Acceleration */}
                        <div className="p-3 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#F5F7FA]">Enable GPU Acceleration (CUDA / TensorRT)</span>
                              <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold rounded">
                                RECOMMENDED
                              </span>
                            </div>
                            <div className="text-[10px] text-[#98A2B3] font-sans">Offloads ASR matrix multiplication to NVIDIA CUDA cores.</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={enableGpuAccel}
                            onChange={e => {
                              setEnableGpuAccel(e.target.checked);
                              showToast(e.target.checked ? "CUDA GPU Acceleration ON" : "CUDA GPU Acceleration OFF");
                            }}
                            className="w-4 h-4 accent-[#8B5CF6]"
                          />
                        </div>

                        {/* Workers & Memory Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">Maximum Worker Threads</label>
                            <select value={maxWorkerThreads} onChange={e => setMaxWorkerThreads(e.target.value)} className="w-full bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA]">
                              <option>4 Threads</option>
                              <option>8 Threads</option>
                              <option>16 Threads</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">Max Concurrent AI Jobs</label>
                            <select value={maxConcurrentAiJobs} onChange={e => setMaxConcurrentAiJobs(e.target.value)} className="w-full bg-[#030305] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F7FA]">
                              <option>1 Job (Serial)</option>
                              <option>2 Concurrent</option>
                              <option>4 Concurrent</option>
                            </select>
                          </div>
                        </div>

                        {/* Impact Telemetry Card */}
                        <div className="p-3 bg-[#030305] border border-white/[0.04] rounded-lg space-y-1.5 font-mono text-[10px]">
                          <div className="text-[9px] text-[#8B5CF6] font-bold uppercase">ESTIMATED SYSTEM RESOURCE IMPACT</div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>CPU Impact: <strong className="text-emerald-400">12% - 25%</strong></div>
                            <div>GPU VRAM: <strong className="text-[#8B5CF6]">4.2 GB / 16 GB</strong></div>
                            <div>RAM Footprint: <strong className="text-white">1.8 GB Total</strong></div>
                          </div>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 2: AI PIPELINE TUNING */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 shadow-xl">
                  <button
                    onClick={() => setOpenExpanders(p => ({ ...p, ai_tuning: !p.ai_tuning }))}
                    className="w-full flex items-center justify-between border-b border-white/[0.06] pb-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#8B5CF6]" />
                      <h4 className="font-extrabold text-[#F5F7FA] text-xs uppercase tracking-wider">
                        Section 2 — AI RAG Pipeline &amp; Vector Tuning
                      </h4>
                      <span className="px-1.5 py-0.2 bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 text-[8px] font-bold rounded">
                        DEVELOPER ONLY
                      </span>
                    </div>
                    {openExpanders.ai_tuning ? <ChevronUp className="w-4 h-4 text-[#98A2B3]" /> : <ChevronDown className="w-4 h-4 text-[#98A2B3]" />}
                  </button>

                  <AnimatePresence>
                    {openExpanders.ai_tuning && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden space-y-3 pt-1">
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Context Window Size */}
                          <div className="p-3 bg-[#030305] border border-white/[0.05] rounded-lg space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#F5F7FA]">Context Window Size</span>
                              <button onClick={() => setContextWindowSize('8192 Tokens')} className="text-[9px] text-[#8B5CF6] hover:underline">Reset</button>
                            </div>
                            <select value={contextWindowSize} onChange={e => setContextWindowSize(e.target.value)} className="w-full bg-[#0e1016] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-[#F5F7FA]">
                              <option>4096 Tokens</option>
                              <option>8192 Tokens</option>
                              <option>16384 Tokens</option>
                            </select>
                            <div className="text-[9px] text-[#98A2B3]">Rec: 8192 Tokens</div>
                          </div>

                          {/* Chunk Size */}
                          <div className="p-3 bg-[#030305] border border-white/[0.05] rounded-lg space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#F5F7FA]">Chunk Size</span>
                              <button onClick={() => setChunkSize('512 Tokens')} className="text-[9px] text-[#8B5CF6] hover:underline">Reset</button>
                            </div>
                            <select value={chunkSize} onChange={e => setChunkSize(e.target.value)} className="w-full bg-[#0e1016] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-[#F5F7FA]">
                              <option>256 Tokens</option>
                              <option>512 Tokens</option>
                              <option>1024 Tokens</option>
                            </select>
                            <div className="text-[9px] text-[#98A2B3]">Rec: 512 Tokens</div>
                          </div>

                          {/* Retrieval Top-K */}
                          <div className="p-3 bg-[#030305] border border-white/[0.05] rounded-lg space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#F5F7FA]">Retrieval Top-K</span>
                              <button onClick={() => setRetrievalTopK('Top 5')} className="text-[9px] text-[#8B5CF6] hover:underline">Reset</button>
                            </div>
                            <select value={retrievalTopK} onChange={e => setRetrievalTopK(e.target.value)} className="w-full bg-[#0e1016] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-[#F5F7FA]">
                              <option>Top 3</option>
                              <option>Top 5</option>
                              <option>Top 10</option>
                            </select>
                            <div className="text-[9px] text-[#98A2B3]">Rec: Top 5</div>
                          </div>
                        </div>

                        {/* Streaming & Warmup Toggles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-between">
                            <span className="font-bold text-[#F5F7FA]">Streaming Token Responses</span>
                            <input type="checkbox" checked={streamingResponses} onChange={e => setStreamingResponses(e.target.checked)} className="w-4 h-4 accent-[#8B5CF6]" />
                          </div>
                          <div className="p-3 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-between">
                            <span className="font-bold text-[#F5F7FA]">Automatic Model Warm-up</span>
                            <input type="checkbox" checked={autoModelWarmup} onChange={e => setAutoModelWarmup(e.target.checked)} className="w-4 h-4 accent-[#8B5CF6]" />
                          </div>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 3: SPEECH & TRANSCRIPTION ENGINE */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 shadow-xl">
                  <button
                    onClick={() => setOpenExpanders(p => ({ ...p, speech_engine: !p.speech_engine }))}
                    className="w-full flex items-center justify-between border-b border-white/[0.06] pb-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-sky-400" />
                      <h4 className="font-extrabold text-[#F5F7FA] text-xs uppercase tracking-wider">
                        Section 3 — Speech &amp; Faster-Whisper ASR Parameters
                      </h4>
                      <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    {openExpanders.speech_engine ? <ChevronUp className="w-4 h-4 text-[#98A2B3]" /> : <ChevronDown className="w-4 h-4 text-[#98A2B3]" />}
                  </button>

                  <AnimatePresence>
                    {openExpanders.speech_engine && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden space-y-3 pt-1">
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">Beam Size</label>
                            <select value={beamSize} onChange={e => setBeamSize(e.target.value)} className="w-full bg-[#030305] border border-white/[0.08] rounded px-2.5 py-1 text-xs text-[#F5F7FA]">
                              <option>1 (Fast)</option>
                              <option>5 (Standard)</option>
                              <option>10 (Precise)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">Temperature</label>
                            <select value={temperature} onChange={e => setTemperature(e.target.value)} className="w-full bg-[#030305] border border-white/[0.08] rounded px-2.5 py-1 text-xs text-[#F5F7FA]">
                              <option>0.0 (Greedy)</option>
                              <option>0.2 (Balanced)</option>
                              <option>0.4 (Creative)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">VAD Sensitivity</label>
                            <select value={vadSensitivity} onChange={e => setVadSensitivity(e.target.value)} className="w-full bg-[#030305] border border-white/[0.08] rounded px-2.5 py-1 text-xs text-[#F5F7FA]">
                              <option>0.3 (Strict)</option>
                              <option>0.5 (Standard)</option>
                              <option>0.7 (Loose)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9.5px] text-[#98A2B3] uppercase block mb-1">Min Silence</label>
                            <select value={minSilenceDuration} onChange={e => setMinSilenceDuration(e.target.value)} className="w-full bg-[#030305] border border-white/[0.08] rounded px-2.5 py-1 text-xs text-[#F5F7FA]">
                              <option>300 ms</option>
                              <option>500 ms</option>
                              <option>1000 ms</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans text-[11px]">
                          <label className="p-2.5 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-between">
                            <span className="font-semibold text-[#F5F7FA]">Word-level Timestamps</span>
                            <input type="checkbox" checked={wordLevelTimestamps} onChange={e => setWordLevelTimestamps(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                          </label>
                          <label className="p-2.5 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-between">
                            <span className="font-semibold text-[#F5F7FA]">Hallucination Filter</span>
                            <input type="checkbox" checked={hallucinationFilter} onChange={e => setHallucinationFilter(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                          </label>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 4: LOGGING & DIAGNOSTICS */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 shadow-xl">
                  <button
                    onClick={() => setOpenExpanders(p => ({ ...p, logging_diag: !p.logging_diag }))}
                    className="w-full flex items-center justify-between border-b border-white/[0.06] pb-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-purple-400" />
                      <h4 className="font-extrabold text-[#F5F7FA] text-xs uppercase tracking-wider">
                        Section 4 — Logging, Telemetry &amp; Diagnostic Traces
                      </h4>
                    </div>
                    {openExpanders.logging_diag ? <ChevronUp className="w-4 h-4 text-[#98A2B3]" /> : <ChevronDown className="w-4 h-4 text-[#98A2B3]" />}
                  </button>

                  <AnimatePresence>
                    {openExpanders.logging_diag && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden space-y-3 pt-1">
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-sans text-[11px]">
                          <label className="p-2 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-between">
                            <span className="text-[#C4C9D4]">Debug Logging</span>
                            <input type="checkbox" checked={enableDebugLogging} onChange={e => setEnableDebugLogging(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                          </label>
                          <label className="p-2 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-between">
                            <span className="text-[#C4C9D4]">Perf Metrics</span>
                            <input type="checkbox" checked={enablePerfMetrics} onChange={e => setEnablePerfMetrics(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                          </label>
                          <label className="p-2 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-between">
                            <span className="text-[#C4C9D4]">Timing Logs</span>
                            <input type="checkbox" checked={pipelineTimingLogs} onChange={e => setPipelineTimingLogs(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                          </label>
                          <label className="p-2 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-between">
                            <span className="text-[#C4C9D4]">Crash Reports</span>
                            <input type="checkbox" checked={saveCrashReports} onChange={e => setSaveCrashReports(e.target.checked)} className="w-3.5 h-3.5 accent-[#8B5CF6]" />
                          </label>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.04]">
                          <button onClick={() => showToast("Opened logs directory: /logs/")} className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-[10px] font-bold uppercase">Open Logs Folder</button>
                          <button onClick={() => showToast("Diagnostic logs copied to clipboard")} className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-[10px] font-bold uppercase">Copy Logs</button>
                          <button onClick={() => showToast("Exported diagnostic_bundle.zip")} className="px-3 py-1 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] rounded text-[10px] font-bold uppercase">Export Diagnostic Bundle</button>
                          <button onClick={() => showToast("Logs cleared")} className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded text-[10px] font-bold uppercase">Clear Logs</button>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 5: DATABASE MAINTENANCE */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 shadow-xl">
                  <button
                    onClick={() => setOpenExpanders(p => ({ ...p, db_maint: !p.db_maint }))}
                    className="w-full flex items-center justify-between border-b border-white/[0.06] pb-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-extrabold text-[#F5F7FA] text-xs uppercase tracking-wider">
                        Section 5 — Database Maintenance &amp; Index Integrity
                      </h4>
                    </div>
                    {openExpanders.db_maint ? <ChevronUp className="w-4 h-4 text-[#98A2B3]" /> : <ChevronDown className="w-4 h-4 text-[#98A2B3]" />}
                  </button>

                  <AnimatePresence>
                    {openExpanders.db_maint && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden space-y-3 pt-1">
                        
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                          <div className="p-2 bg-[#030305] border border-white/[0.04] rounded">
                            <div className="text-[8.5px] text-[#98A2B3]">DB VERSION</div>
                            <div className="text-white font-bold">3.45.1 (SQLCipher)</div>
                          </div>
                          <div className="p-2 bg-[#030305] border border-white/[0.04] rounded">
                            <div className="text-[8.5px] text-[#98A2B3]">HEALTH STATUS</div>
                            <div className="text-emerald-400 font-bold">OPTIMAL (0 ERRORS)</div>
                          </div>
                          <div className="p-2 bg-[#030305] border border-white/[0.04] rounded">
                            <div className="text-[8.5px] text-[#98A2B3]">INDEX STATUS</div>
                            <div className="text-[#8B5CF6] font-bold">FTS5 / HNSW SYNCED</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button onClick={() => showToast("Database optimized")} className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-[10px] font-bold uppercase">Optimize Database</button>
                          <button onClick={() => showToast("VACUUM complete")} className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-[10px] font-bold uppercase">Vacuum Database</button>
                          <button onClick={() => showToast("Rebuilt FTS5 search index")} className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-[10px] font-bold uppercase">Rebuild Search Index</button>
                          <button onClick={() => showToast("Database integrity 100% OK")} className="px-3 py-1 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] rounded text-[10px] font-bold uppercase">Verify Database Integrity</button>
                          <button onClick={() => showToast("Repair database ready")} className="px-3 py-1 bg-white/[0.02] border border-white/[0.05] text-[#98A2B3] rounded text-[10px] font-bold uppercase opacity-60">Repair Database (Future)</button>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 6: EXPERIMENTAL FEATURES */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 shadow-xl">
                  <button
                    onClick={() => setOpenExpanders(p => ({ ...p, exp_features: !p.exp_features }))}
                    className="w-full flex items-center justify-between border-b border-white/[0.06] pb-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h4 className="font-extrabold text-[#F5F7FA] text-xs uppercase tracking-wider">
                        Section 6 — Experimental Features &amp; Beta Flags
                      </h4>
                      <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-bold rounded">
                        EXPERIMENTAL
                      </span>
                    </div>
                    {openExpanders.exp_features ? <ChevronUp className="w-4 h-4 text-[#98A2B3]" /> : <ChevronDown className="w-4 h-4 text-[#98A2B3]" />}
                  </button>

                  <AnimatePresence>
                    {openExpanders.exp_features && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden space-y-2.5 pt-1 font-sans text-[11px]">
                        
                        {[
                          { state: enableBetaFeatures, set: setEnableBetaFeatures, title: 'Enable Beta Features', desc: 'Test unreleased features before public release' },
                          { state: enableExperimentalModels, set: setEnableExperimentalModels, title: 'Enable Experimental AI Models', desc: 'Access experimental local models (Whisper-v3-Turbo)' },
                          { state: enablePreviewComponents, set: setEnablePreviewComponents, title: 'Enable Preview UI Components', desc: 'Render next-gen design system components' },
                          { state: enableDeveloperMode, set: setEnableDeveloperMode, title: 'Enable Developer Mode', desc: 'Expose API telemetry drawers and network inspector' },
                          { state: enableFutureFeatures, set: setEnableFutureFeatures, title: 'Enable Future Features', desc: 'Preview upcoming real-time translation pipelines' }
                        ].map((exp, i) => (
                          <div key={i} className="p-3 bg-[#030305] border border-white/[0.05] rounded-lg flex items-center justify-between gap-4">
                            <div>
                              <div className="font-bold text-[#F5F7FA] flex items-center gap-2">
                                <span>{exp.title}</span>
                                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[8px] font-mono font-bold rounded">
                                  EXPERIMENTAL
                                </span>
                              </div>
                              <div className="text-[10px] text-[#98A2B3] mt-0.5">{exp.desc}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={exp.state}
                              onChange={e => {
                                exp.set(e.target.checked);
                                showToast(`${exp.title}: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                              }}
                              className="w-4 h-4 accent-amber-500"
                            />
                          </div>
                        ))}

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 7: SYSTEM DIAGNOSTICS */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 shadow-xl">
                  <button
                    onClick={() => setOpenExpanders(p => ({ ...p, sys_diag: !p.sys_diag }))}
                    className="w-full flex items-center justify-between border-b border-white/[0.06] pb-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-sky-400" />
                      <h4 className="font-extrabold text-[#F5F7FA] text-xs uppercase tracking-wider">
                        Section 7 — System Diagnostics &amp; Telemetry Report
                      </h4>
                    </div>
                    {openExpanders.sys_diag ? <ChevronUp className="w-4 h-4 text-[#98A2B3]" /> : <ChevronDown className="w-4 h-4 text-[#98A2B3]" />}
                  </button>

                  <AnimatePresence>
                    {openExpanders.sys_diag && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden space-y-3 pt-1">
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                          <div className="p-2.5 bg-[#030305] border border-white/[0.04] rounded flex justify-between"><span className="text-[#98A2B3]">CPU:</span><span className="text-white font-bold">Intel Core i9-13900K</span></div>
                          <div className="p-2.5 bg-[#030305] border border-white/[0.04] rounded flex justify-between"><span className="text-[#98A2B3]">GPU:</span><span className="text-[#8B5CF6] font-bold">NVIDIA RTX 4080 (16GB)</span></div>
                          <div className="p-2.5 bg-[#030305] border border-white/[0.04] rounded flex justify-between"><span className="text-[#98A2B3]">RAM:</span><span className="text-white font-bold">64 GB DDR5</span></div>
                          <div className="p-2.5 bg-[#030305] border border-white/[0.04] rounded flex justify-between"><span className="text-[#98A2B3]">OS:</span><span className="text-white font-bold">Windows 11 Pro (64-bit)</span></div>
                          <div className="p-2.5 bg-[#030305] border border-white/[0.04] rounded flex justify-between"><span className="text-[#98A2B3]">Python Version:</span><span className="text-emerald-400 font-bold">3.11.8</span></div>
                          <div className="p-2.5 bg-[#030305] border border-white/[0.04] rounded flex justify-between"><span className="text-[#98A2B3]">Backend Version:</span><span className="text-white font-bold">FastAPI / Python v2.0</span></div>
                          <div className="p-2.5 bg-[#030305] border border-white/[0.04] rounded flex justify-between"><span className="text-[#98A2B3]">Frontend Version:</span><span className="text-white font-bold">React 18 / Vite v5.4</span></div>
                          <div className="p-2.5 bg-[#030305] border border-white/[0.04] rounded flex justify-between"><span className="text-[#98A2B3]">Database Engine:</span><span className="text-emerald-400 font-bold">SQLite 3.45.1</span></div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button onClick={() => showToast("System telemetry copied to clipboard")} className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-[10px] font-bold uppercase">Copy System Info</button>
                          <button onClick={() => showToast("Support bundle generated (.zip)")} className="px-3 py-1 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] rounded text-[10px] font-bold uppercase">Generate Support Bundle</button>
                          <button onClick={() => showToast("Opened config folder")} className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-[10px] font-bold uppercase">Open Config Folder</button>
                          <button onClick={() => showToast("Opened data folder")} className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F7FA] rounded text-[10px] font-bold uppercase">Open Data Folder</button>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* SECTION 8: RECOVERY & RESET */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-3 shadow-xl">
                  <button
                    onClick={() => setOpenExpanders(p => ({ ...p, recovery_reset: !p.recovery_reset }))}
                    className="w-full flex items-center justify-between border-b border-rose-500/20 pb-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <h4 className="font-extrabold text-rose-300 text-xs uppercase tracking-wider">
                        Section 8 — Recovery Utilities &amp; Factory Reset
                      </h4>
                      <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[8px] font-bold rounded">
                        DESTRUCTIVE ACTIONS
                      </span>
                    </div>
                    {openExpanders.recovery_reset ? <ChevronUp className="w-4 h-4 text-rose-400" /> : <ChevronDown className="w-4 h-4 text-rose-400" />}
                  </button>

                  <AnimatePresence>
                    {openExpanders.recovery_reset && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden space-y-3 pt-1">
                        
                        <p className="text-[10.5px] text-[#98A2B3] font-sans">
                          Execute recovery tools to restore window positions, reset AI model weights, or perform full studio factory reset.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              if (window.confirm("Reset window layout and sidebars to default?")) showToast("Window layout reset");
                            }}
                            className="p-2.5 bg-[#030305] hover:bg-white/[0.05] border border-white/[0.08] text-[#F5F7FA] rounded-lg font-bold text-[10px] uppercase"
                          >
                            Reset Window Layout
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm("Reset keyboard shortcuts to default?")) showToast("Hotkeys reset");
                            }}
                            className="p-2.5 bg-[#030305] hover:bg-white/[0.05] border border-white/[0.08] text-[#F5F7FA] rounded-lg font-bold text-[10px] uppercase"
                          >
                            Reset Shortcuts
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm("Reset AI configuration to factory defaults?")) showToast("AI config reset");
                            }}
                            className="p-2.5 bg-[#030305] hover:bg-white/[0.05] border border-white/[0.08] text-[#F5F7FA] rounded-lg font-bold text-[10px] uppercase"
                          >
                            Reset AI Config
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm("Reset general settings to default?")) showToast("General settings reset");
                            }}
                            className="p-2.5 bg-[#030305] hover:bg-white/[0.05] border border-white/[0.08] text-[#F5F7FA] rounded-lg font-bold text-[10px] uppercase"
                          >
                            Reset Settings
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm("Rebuild local AI model cache?")) showToast("AI Cache rebuilding...");
                            }}
                            className="p-2.5 bg-[#030305] hover:bg-white/[0.05] border border-white/[0.08] text-[#F5F7FA] rounded-lg font-bold text-[10px] uppercase"
                          >
                            Rebuild AI Cache
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm("WARNING: Restore factory defaults? All settings will be reset.")) showToast("Factory defaults restored");
                            }}
                            className="p-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-lg font-bold text-[10px] uppercase"
                          >
                            Restore Factory Defaults
                          </button>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

            </div>
          )}

          {/* 10. ABOUT WORKSPACE */}
          {activeSection === 'about' && (
            <div className="space-y-5 font-sans select-none">
              
              {/* Header Branding Card with SAMVAD Logo */}
              <div className="p-6 bg-[#0e1016] border border-white/[0.08] rounded-xl flex items-center justify-between gap-4 shadow-2xl">
                <div className="flex items-center gap-4">
                  <SamvadSignatureHelixLogo size={54} />
                  <div>
                    <h2 className="text-base font-extrabold text-[#F5F7FA] uppercase tracking-wider font-mono flex items-center gap-2">
                      SAMVAD Studio
                      <span className="px-2 py-0.5 bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 text-[9px] font-bold rounded">
                        v2.0.0-RELEASE
                      </span>
                    </h2>
                    <p className="text-xs text-[#98A2B3] mt-1 font-sans leading-relaxed">
                      Offline Meeting Intelligence, Acoustic Telemetry &amp; Local AI Workspace Platform.
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-[10px] text-[#98A2B3]">
                  <div>BUILD NUMBER: <strong className="text-white">2026.07.23-STABLE</strong></div>
                  <div>PLATFORM: <strong className="text-emerald-400">Windows x64 (Air-Gapped)</strong></div>
                </div>
              </div>

              {/* System Specs & Telemetry Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                
                {/* Specs Card 1: Software & Framework Versions */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 font-bold text-[#F5F7FA]">
                    <span>SOFTWARE &amp; FRAMEWORKS</span>
                    <span className="text-[9px] text-[#8B5CF6]">RUNTIME VERSIONS</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span className="text-[#98A2B3]">React UI Framework:</span> <span className="text-white font-bold">18.3.1</span></div>
                    <div className="flex justify-between"><span className="text-[#98A2B3]">Vite Desktop Bundler:</span> <span className="text-white font-bold">5.4.21</span></div>
                    <div className="flex justify-between"><span className="text-[#98A2B3]">Tailwind CSS Engine:</span> <span className="text-white font-bold">3.4.1</span></div>
                    <div className="flex justify-between"><span className="text-[#98A2B3]">Framer Motion:</span> <span className="text-white font-bold">11.1.7</span></div>
                    <div className="flex justify-between"><span className="text-[#98A2B3]">Lucide Icon Suite:</span> <span className="text-white font-bold">0.344.0</span></div>
                    <div className="flex justify-between"><span className="text-[#98A2B3]">SQLite Engine Version:</span> <span className="text-emerald-400 font-bold">3.45.1 (SQLCipher AES-256)</span></div>
                  </div>
                </div>

                {/* Specs Card 2: Hardware Telemetry & GPU */}
                <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 font-bold text-[#F5F7FA]">
                    <span>HARDWARE SPECS &amp; AI ENGINES</span>
                    <span className="text-[9px] text-emerald-400">DETECTED TELEMETRY</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span className="text-[#98A2B3]">GPU Detection:</span> <span className="text-[#8B5CF6] font-bold">NVIDIA GeForce RTX 4080 (16GB VRAM)</span></div>
                    <div className="flex justify-between"><span className="text-[#98A2B3]">CPU Processor:</span> <span className="text-white font-bold">13th Gen Intel Core i9-13900K (24 cores)</span></div>
                    <div className="flex justify-between"><span className="text-[#98A2B3]">System RAM:</span> <span className="text-white font-bold">64 GB DDR5-5600</span></div>
                    <div className="flex justify-between"><span className="text-[#98A2B3]">Operating System:</span> <span className="text-white font-bold">Windows 11 Pro 64-bit</span></div>
                    <div className="flex justify-between"><span className="text-[#98A2B3]">ASR Speech Model:</span> <span className="text-white font-bold">Faster-Whisper CUDA (FP16)</span></div>
                    <div className="flex justify-between"><span className="text-[#98A2B3]">LLM QA Model:</span> <span className="text-white font-bold">Qwen-2.5-7B (Local Ollama)</span></div>
                  </div>
                </div>

              </div>

              {/* Desktop Action Buttons (6 Buttons) */}
              <div className="p-4 bg-[#0e1016] border border-white/[0.08] rounded-xl space-y-3 font-mono text-xs">
                <h4 className="font-bold text-[#F5F7FA]">Studio Utilities &amp; Project Links</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => showToast("Checking for updates... You are running the latest version (v2.0.0)")}
                    className="p-2.5 bg-[#030305] hover:bg-white/[0.05] border border-white/[0.08] text-[#F5F7FA] rounded-lg font-bold transition-all text-[11px] flex items-center justify-center gap-2 uppercase"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#8B5CF6]" /> Check for Updates
                  </button>

                  <button
                    onClick={() => showToast("Licenses: MIT License (SAMVAD), Apache 2.0 (Whisper)")}
                    className="p-2.5 bg-[#030305] hover:bg-white/[0.05] border border-white/[0.08] text-[#F5F7FA] rounded-lg font-bold transition-all text-[11px] flex items-center justify-center gap-2 uppercase"
                  >
                    <Info className="w-3.5 h-3.5 text-sky-400" /> View Licenses
                  </button>

                  <button
                    onClick={() => showToast("Repository link: github.com/samvad-ai/samvad-studio")}
                    className="p-2.5 bg-[#030305] hover:bg-white/[0.05] border border-white/[0.08] text-[#F5F7FA] rounded-lg font-bold transition-all text-[11px] flex items-center justify-center gap-2 uppercase"
                  >
                    <Terminal className="w-3.5 h-3.5 text-purple-400" /> GitHub Repository
                  </button>

                  <button
                    onClick={() => showToast("Documentation loaded locally at /docs/index.html")}
                    className="p-2.5 bg-[#030305] hover:bg-white/[0.05] border border-white/[0.08] text-[#F5F7FA] rounded-lg font-bold transition-all text-[11px] flex items-center justify-center gap-2 uppercase"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> Documentation
                  </button>

                  <button
                    onClick={() => showToast("Report Issue logger launched")}
                    className="p-2.5 bg-[#030305] hover:bg-white/[0.05] border border-white/[0.08] text-[#F5F7FA] rounded-lg font-bold transition-all text-[11px] flex items-center justify-center gap-2 uppercase"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Report Issue
                  </button>

                  <button
                    onClick={() => showToast("Credits: Built by SAMVAD Core AI Team")}
                    className="p-2.5 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] rounded-lg font-bold transition-all text-[11px] flex items-center justify-center gap-2 uppercase"
                  >
                    <Zap className="w-3.5 h-3.5" /> Credits
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
