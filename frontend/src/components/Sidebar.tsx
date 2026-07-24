import { 
  LayoutDashboard, 
  Mic, 
  FileText, 
  Sparkles, 
  BrainCircuit, 
  BarChart4, 
  History, 
  Settings, 
  ShieldCheck, 
  Play, 
  Pause, 
  Square,
  RefreshCw,
  FolderSync,
  Volume2,
  Activity,
  CheckCircle2,
  Power,
  Trash2,
  Bell
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Meeting } from '../types';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  currentMeeting: Meeting | null;
  meetings: Meeting[];
  onSelectMeeting: (meeting: Meeting) => void;

  // Recording State & Methods
  recordingState: 'idle' | 'recording' | 'paused' | 'stopped';
  duration: number;
  recordingError: string | null;
  uploading: boolean;
  title: string;
  setTitle: (t: string) => void;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  discardRecording: () => void;
  saveRecording: () => void;

  // Model parameters
  modelSize: string;
  setModelSize: (s: string) => void;
  language: string;
  setLanguage: (l: string) => void;
  vadEnabled: boolean;
  setVadEnabled: (v: boolean) => void;

  // Loopback Mixer Capture Source
  captureSource: 'mic' | 'system' | 'both';
  setCaptureSource: (s: 'mic' | 'system' | 'both') => void;

  // Notification Center Trigger
  onOpenNotifications?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  currentMeeting,
  meetings,
  onSelectMeeting,
  
  recordingState,
  duration,
  recordingError,
  uploading,
  title,
  setTitle,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  discardRecording,
  saveRecording,
  
  modelSize,
  setModelSize,
  language,
  setLanguage,
  vadEnabled,
  setVadEnabled,

  captureSource,
  setCaptureSource,
  onOpenNotifications,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Meeting History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart4 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const meetingItems = [
    { id: 'transcript', label: 'Transcript', icon: FileText, disabled: !currentMeeting },
    { id: 'summary', label: 'Meeting Memo', icon: Sparkles, disabled: !currentMeeting },
    { id: 'stats', label: 'Meeting Stats', icon: Activity, disabled: !currentMeeting },
    { id: 'qa', label: 'AI Assistant', icon: BrainCircuit, disabled: !currentMeeting },
  ];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <aside className="w-80 sidebar-glass flex flex-col h-screen select-none z-10 relative overflow-hidden">
      {/* Apple VisionOS Progressive Blur Layering */}
      <div className="sidebar-progressive-blur">
        <div className="sidebar-blur-layer sidebar-blur-layer--8" />
        <div className="sidebar-blur-layer sidebar-blur-layer--16" />
        <div className="sidebar-blur-layer sidebar-blur-layer--32" />
      </div>
      
      {/* Specular highlight border overlay */}
      <div className="sidebar-specular-highlight" />

      {/* Brand Section */}
      <div className="p-6 border-b border-slate-900/20 flex items-center gap-3.5 relative z-10">
        <div
          className="relative flex items-center justify-center cursor-pointer"
          onClick={() => {}}
        >
          {/* App icon box - Apple-style glass surface with soft inner highlights */}
          <div
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-500 hover:scale-102"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: `0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)`,
            }}
          >
            {/* Inner top shine */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Faint violet ambient glow behind the icon only */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 38, height: 38,
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                filter: 'blur(6px)',
              }}
            />

            {/* Modern Minimal SAMVAD Vector Icon (Apple / Linear / Notion Style) */}
            <svg
              width="36" height="36" viewBox="0 0 100 100" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative z-10"
              style={{ filter: 'drop-shadow(0 4px 14px rgba(124, 58, 237, 0.45))' }}
            >
              <defs>
                <linearGradient id="sidebarModernGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="50%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>

              {/* Abstract Outer Rounded Squircle / Speech Envelope */}
              <path
                d="M 28 16 H 72 C 81 16 88 23 88 32 V 64 C 88 73 81 80 72 80 H 42 L 26 92 V 80 C 18 80 12 73 12 64 V 32 C 12 23 18 16 28 16 Z"
                fill="url(#sidebarModernGrad)"
              />

              {/* 3 Symmetrical Vertical Waveform Columns cut out of center */}
              <rect x="32" y="36" width="6" height="24" rx="3" fill="#040404" />
              <rect x="47" y="28" width="6" height="40" rx="3" fill="#040404" />
              <rect x="62" y="36" width="6" height="24" rx="3" fill="#040404" />

              {/* Minimal Document Corner Fold */}
              <path d="M 72 16 L 88 32 H 72 V 16 Z" fill="#FFFFFF" opacity="0.25" />
            </svg>
          </div>

          {/* Recording live indicator */}
          {recordingState === 'recording' && (
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-rose-500 border border-slate-950 rounded-full z-20 animate-ping" />
          )}
        </div>
        <div className="flex flex-col gap-0.5 flex-1">
          <div className="flex items-center gap-2">
            <svg width="120" height="22" viewBox="0 0 180 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="wordmarkGradSidebar" x1="0" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="50%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
              <path d="M 18 10 C 13 10 9 13 9 17 C 9 21 13 22 18 23 C 23 24 27 25 27 29 C 27 33 23 36 17 36 C 11 36 8 32 8 32" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 36 36 L 47 8 L 58 36" stroke="url(#wordmarkGradSidebar)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="47" cy="24" r="2.5" fill="#6366F1" />
              <path d="M 68 36 V 8 L 78 24 L 88 8 V 36" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 98 8 L 108 36 L 118 8" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 128 36 L 139 8 L 150 36" stroke="url(#wordmarkGradSidebar)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="139" cy="24" r="2.5" fill="#2563EB" />
              <path d="M 160 8 H 168 C 176 8 180 14 180 22 C 180 30 176 36 168 36 H 160 V 8 Z" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-sans tracking-wide shrink-0"
            >
              v2.0
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium font-sans tracking-widest uppercase">AI MEETING ASSISTANT</p>
        </div>

        {/* Bell Notification Center Launcher Button */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-violet-600/20 border border-slate-800 hover:border-violet-500/40 text-slate-400 hover:text-violet-300 transition-all group shrink-0"
            title="Open Notification Center"
          >
            <Bell className="w-4 h-4 transition-transform group-hover:rotate-12" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 relative z-10">
        
        {/* Live Audio Capture Module in Sidebar */}
        <div className="p-4 rounded-2xl flex flex-col gap-3 transition-all duration-300" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}>
          <div
            className={`flex items-center justify-between ${activePage !== 'recorder' ? 'cursor-pointer group' : ''}`}
            onClick={() => activePage !== 'recorder' && setActivePage('recorder')}
            title={activePage !== 'recorder' ? 'Go to Recorder' : undefined}
          >
            <h2 className={`text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400/90 transition-colors duration-200 ${
              activePage !== 'recorder' ? 'group-hover:text-violet-400' : ''
            }`}>
              Audio Capture
              {activePage !== 'recorder' && (
                <span className="ml-1.5 text-[8.5px] text-slate-550 group-hover:text-violet-500 normal-case tracking-normal font-normal transition-colors duration-200">
                  ↗ open
                </span>
              )}
            </h2>
            {recordingState !== 'idle' && (
              <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md font-mono ${
                recordingState === 'recording' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {formatTime(duration)}
              </span>
            )}
          </div>

          {/* Recording Controls */}
          {recordingState === 'idle' && (
            <div className="space-y-3">
              {/* Capture Source Tabs (Speakr Style Glider) */}
              <div className="glass-radio-group">
                <input
                  type="radio"
                  id="glass-silver"
                  name="audioSource"
                  checked={captureSource === 'mic'}
                  onChange={() => setCaptureSource('mic')}
                />
                <label htmlFor="glass-silver" className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                  Mic
                </label>

                <input
                  type="radio"
                  id="glass-gold"
                  name="audioSource"
                  checked={captureSource === 'system'}
                  onChange={() => setCaptureSource('system')}
                />
                <label htmlFor="glass-gold" className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  System
                </label>

                <input
                  type="radio"
                  id="glass-platinum"
                  name="audioSource"
                  checked={captureSource === 'both'}
                  onChange={() => setCaptureSource('both')}
                />
                <label htmlFor="glass-platinum" className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4"/><path d="M17.7 6.3a8 8 0 0 1 0 11.4"/><path d="M3.5 3.5a14 14 0 0 0 0 17"/><path d="M20.5 3.5a14 14 0 0 1 0 17"/></svg>
                  Mix
                </label>

                <div
                  className="glass-glider"
                  style={{
                    transform: `translateX(${captureSource === 'mic' ? 0 : captureSource === 'system' ? 100 : 200}%)`,
                    background: captureSource === 'mic'
                      ? 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(139,92,246,0.6))'
                      : captureSource === 'system'
                      ? 'linear-gradient(135deg, rgba(56,189,248,0.35), rgba(56,189,248,0.6))'
                      : 'linear-gradient(135deg, rgba(52,211,153,0.35), rgba(52,211,153,0.6))',
                    boxShadow: captureSource === 'mic'
                      ? '0 0 14px rgba(139,92,246,0.5), inset 0 0 8px rgba(139,92,246,0.3)'
                      : captureSource === 'system'
                      ? '0 0 14px rgba(56,189,248,0.5), inset 0 0 8px rgba(56,189,248,0.3)'
                      : '0 0 14px rgba(52,211,153,0.5), inset 0 0 8px rgba(52,211,153,0.3)',
                  }}
                />
              </div>

              <div className="btn-wrapper w-full flex justify-center mt-1">
                <button onClick={startRecording} className="btn w-full flex items-center justify-center">
                  <Play className="btn-svg text-sky-400 fill-sky-400" style={{ width: '12px', height: '12px', marginRight: '0.35rem' }} />
                  <span className="txt-wrapper text-[10px] uppercase tracking-wider font-bold relative flex items-center">
                    <span className="flex gap-[1px]">
                      <span className="btn-letter">R</span>
                      <span className="btn-letter">E</span>
                      <span className="btn-letter">C</span>
                      <span className="btn-letter">O</span>
                      <span className="btn-letter">R</span>
                      <span className="btn-letter">D</span>
                    </span>
                  </span>
                </button>
              </div>
            </div>
          )}

          {recordingState === 'recording' && (
            <div className="flex gap-2.5">
              <button 
                onClick={pauseRecording}
                className="btn-premium-glass-neo-amber flex-1 focus:outline-none"
              >
                <motion.div
                  animate={{ scale: [1, 1.12, 0.95, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Pause className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </motion.div>
                <span>Pause</span>
              </button>
              <button 
                onClick={stopRecording}
                className="btn-premium-glass-neo-red flex-1 focus:outline-none"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Power className="w-3.5 h-3.5 text-rose-300" />
                </motion.div>
                <span>Stop</span>
              </button>
            </div>
          )}

          {recordingState === 'paused' && (
            <div className="flex gap-2.5">
              <button 
                onClick={resumeRecording}
                className="btn-premium-glass-neo flex-1 focus:outline-none"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 0.85, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2.5 }}
                >
                  <Play className="w-3.5 h-3.5 fill-current text-sky-400" />
                </motion.div>
                <span>Resume</span>
              </button>
              <button 
                onClick={stopRecording}
                className="btn-premium-glass-neo-red flex-1 focus:outline-none"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Power className="w-3.5 h-3.5 text-rose-300" />
                </motion.div>
                <span>Stop</span>
              </button>
            </div>
          )}

          {recordingState === 'stopped' && (
            <div className="flex flex-col gap-2.5">
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meeting name..."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6] font-semibold transition-all duration-300"
              />
              <div className="flex gap-2.5 items-center w-full">
                <button 
                  onClick={discardRecording}
                  disabled={uploading}
                  className="btn-discard-round focus:outline-none flex-shrink-0"
                >
                  <Trash2 className="svgIcon-discard text-slate-400 group-hover:text-rose-455" />
                </button>
                <button 
                  onClick={saveRecording}
                  disabled={uploading}
                  className="btn-premium-glass-neo flex-1 focus:outline-none disabled:opacity-50"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 0.9, 1.1, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  </motion.div>
                  <span>{uploading ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Glowing Timebar Sweep */}
          {recordingState === 'recording' && (
            <div className="w-full h-1 bg-slate-950/60 rounded-full overflow-hidden relative border border-slate-900/40">
              <div className="absolute top-0 bottom-0 left-0 bg-rose-500 rounded-full w-full animate-pulse" style={{ width: `${(duration % 60) * 100 / 60}%` }} />
            </div>
          )}

          {recordingError && (
            <span className="text-[10px] text-rose-500 font-semibold text-center">{recordingError}</span>
          )}
        </div>

        {/* Core Navigation Links */}
        <div>
          <h2 className="px-3 text-[9px] font-semibold text-slate-400/90 uppercase tracking-[0.14em] mb-2.5">Workspace</h2>
          <nav className="grid grid-cols-2 gap-2 px-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <motion.button
                  key={`workspace-nav-${item.id}-${isActive}`}
                  onClick={() => setActivePage(item.id)}
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl text-[11px] font-semibold transition-all duration-[200ms] ease-out border focus:outline-none ${
                    isActive
                      ? 'btn-nav-liquid-active text-white'
                      : 'btn-nav-liquid-inactive text-slate-350 hover:text-white'
                  }`}
                >
                  <motion.div
                    animate={isActive ? { 
                      scale: [1, 1.2, 1],
                      rotate: [0, 8, -8, 0],
                      filter: ['drop-shadow(0 0 0px var(--accent-glow))', 'drop-shadow(0 0 12px #8B5CF6)', 'drop-shadow(0 0 0px var(--accent-glow))']
                    } : {}}
                    transition={{ duration: 0.65, ease: "easeInOut" }}
                  >
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#8B5CF6]' : 'text-slate-400 hover:text-[#8B5CF6]'}`} />
                  </motion.div>
                  <span style={isActive ? { textShadow: '0 0 10px rgba(139, 92, 246, 0.6)' } : undefined}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Active Loaded Meeting Routing */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2.5">
            <h2 className="text-[9px] font-semibold text-slate-400/90 uppercase tracking-[0.14em]">Active Analysis</h2>
            {currentMeeting && (
              <span className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]">
                {currentMeeting.title}
              </span>
            )}
          </div>
          <nav className="grid grid-cols-2 gap-2 px-1">
            {meetingItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <motion.button
                  key={`meeting-nav-${item.id}-${isActive}`}
                  disabled={item.disabled}
                  onClick={() => setActivePage(item.id)}
                  whileHover={item.disabled ? {} : { y: -1.5 }}
                  whileTap={item.disabled ? undefined : { scale: 0.98 }}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl text-[11px] font-semibold transition-all duration-[200ms] ease-out border focus:outline-none ${
                    item.disabled
                      ? 'text-slate-700 cursor-not-allowed border-transparent opacity-20'
                      : isActive
                      ? 'btn-nav-liquid-active text-white'
                      : 'btn-nav-liquid-inactive text-slate-350 hover:text-white'
                  }`}
                  style={{
                    borderColor: item.disabled ? 'transparent' : 'rgba(255, 255, 255, 0.12)',
                    background: item.disabled ? 'rgba(20, 20, 20, 0.15)' : undefined
                  }}
                >
                  <motion.div
                    animate={isActive && !item.disabled ? { 
                      scale: [1, 1.2, 1],
                      rotate: [0, 8, -8, 0],
                      filter: ['drop-shadow(0 0 0px var(--accent-glow))', 'drop-shadow(0 0 12px #8B5CF6)', 'drop-shadow(0 0 0px var(--accent-glow))']
                    } : {}}
                    transition={{ duration: 0.65, ease: "easeInOut" }}
                  >
                    <Icon className={`w-4 h-4 transition-colors ${isActive && !item.disabled ? 'text-[#8B5CF6]' : item.disabled ? 'text-slate-750' : 'text-slate-400'}`} />
                  </motion.div>
                  <span style={isActive && !item.disabled ? { textShadow: '0 0 10px rgba(139, 92, 246, 0.6)' } : undefined}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Model parameters selectors inside sidebar */}
        <div className="p-4 rounded-2xl space-y-3.5" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}>
          <h2 className="text-[9px] font-semibold text-slate-400/90 uppercase tracking-[0.14em]">AI parameters</h2>
          
          <div className="space-y-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Whisper Model</label>
              <select 
                value={modelSize}
                onChange={e => setModelSize(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-900/60 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold"
              >
                <option value="tiny">Tiny (39M params)</option>
                <option value="base">Base (74M params)</option>
                <option value="small">Small (244M params)</option>
                <option value="medium">Medium (769M params)</option>
                <option value="large-v3">Large V3 (1.5B params)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Language</label>
              <select 
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-900/60 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold"
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
        </div>

      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-900/30 bg-transparent flex flex-col gap-2 relative z-10">
        {currentMeeting && (
          <div className="p-3 rounded-xl flex flex-col gap-1" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-semibold">Loaded Meeting</span>
            <span className="text-xs text-white font-medium truncate">{currentMeeting.title}</span>
            <span className="text-[10px] text-slate-400">
              Duration: {currentMeeting.duration ? `${(currentMeeting.duration / 60).toFixed(1)}m` : '0.0m'}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[10px] font-semibold text-slate-400/90 transition-all duration-300" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.03)', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
          <span className="tracking-wide">Engine Status</span>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[9.5px] font-bold">
            <span className="relative w-2 h-2 rounded-full bg-emerald-400 status-ring-ready flex-shrink-0" />
            <span className="tracking-wider">ACTIVE</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
