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
  Trash2
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
    <aside className="w-80 sidebar-glass flex flex-col h-screen select-none z-10">
      {/* Brand Section */}
      <div className="p-6 border-b border-slate-900/40 flex items-center gap-3">
        <div
          className="relative flex items-center justify-center cursor-pointer"
          onClick={() => {}}
        >
          {/* App icon box */}
          <div
            className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-500 hover:scale-105"
            style={{
              background: 'linear-gradient(145deg, #0f1a2e 0%, #070d1a 100%)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              boxShadow: `0 0 0 1px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.4)`,
            }}
          >
            {/* Inner top shine */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Active glow halo — pulses like a live mic */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 48, height: 48,
                background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
                opacity: recordingState === 'recording' ? 0.35 : 0.12,
                filter: 'blur(10px)',
                animation: 'logo-halo 2.5s ease-in-out infinite',
              }}
            />

            {/* Microphone + Sound Waves SVG — scaled down to fit box */}
            <svg
              width="36" height="36" viewBox="0 0 52 52" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative z-10"
              style={{ filter: 'drop-shadow(0 0 4px var(--accent-glow))' }}
            >
              <defs>
                <linearGradient id="micGrad" x1="26" y1="4" x2="26" y2="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="var(--accent-primary)" />
                  <stop offset="100%" stopColor="var(--accent-glow)" />
                </linearGradient>
                <radialGradient id="micBodyFill" cx="50%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.03" />
                </radialGradient>
              </defs>

              {/* Microphone capsule */}
              <rect x="19" y="5" width="14" height="21" rx="7"
                fill="url(#micBodyFill)" stroke="url(#micGrad)" strokeWidth="2"
              />
              <line x1="22" y1="12" x2="30" y2="12" stroke="url(#micGrad)" strokeWidth="0.8" strokeOpacity="0.4" strokeLinecap="round" />
              <line x1="22" y1="15.5" x2="30" y2="15.5" stroke="url(#micGrad)" strokeWidth="0.8" strokeOpacity="0.4" strokeLinecap="round" />
              <line x1="22" y1="19" x2="30" y2="19" stroke="url(#micGrad)" strokeWidth="0.8" strokeOpacity="0.4" strokeLinecap="round" />

              {/* Pickup arm + stand */}
              <path d="M13 24 Q13 36 26 36 Q39 36 39 24"
                stroke="url(#micGrad)" strokeWidth="2.2" fill="none" strokeLinecap="round"
              />
              <line x1="26" y1="36" x2="26" y2="44" stroke="url(#micGrad)" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="18" y1="44" x2="34" y2="44" stroke="url(#micGrad)" strokeWidth="2.8" strokeLinecap="round" />

              {/* Sound waves LEFT */}
              <path d="M9 21 Q7 26 9 31" stroke="var(--accent-primary)" strokeWidth="2" fill="none" strokeLinecap="round"
                style={{ animation: 'wave-in 1.8s ease-in-out infinite' }} />
              <path d="M5 17 Q2 26 5 35" stroke="var(--accent-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round"
                style={{ animation: 'wave-out 1.8s ease-in-out infinite 0.3s' }} />

              {/* Sound waves RIGHT */}
              <path d="M43 21 Q45 26 43 31" stroke="var(--accent-primary)" strokeWidth="2" fill="none" strokeLinecap="round"
                style={{ animation: 'wave-in 1.8s ease-in-out infinite 0.15s' }} />
              <path d="M47 17 Q50 26 47 35" stroke="var(--accent-primary)" strokeWidth="1.5" fill="none" strokeLinecap="round"
                style={{ animation: 'wave-out 1.8s ease-in-out infinite 0.45s' }} />
            </svg>
          </div>

          {/* Recording live indicator */}
          {recordingState === 'recording' && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 border border-slate-950 rounded-full z-20 animate-ping" />
          )}
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
            SAMVAD
            <span
              className="text-[10px] font-black tracking-widest self-end mb-0.5"
              style={{
                background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-glow))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '0.1em',
              }}
            >
              v2.0
            </span>
          </h1>
          <p className="text-[10.5px] text-slate-400 font-medium font-sans">Offline Meeting Intelligence</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        
        {/* Live Audio Capture Module in Sidebar */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/60 flex flex-col gap-3 shadow-inner">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audio Capture</h2>
            {recordingState !== 'idle' && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full premium-sidebar-timer ${
                recordingState === 'recording' ? 'text-rose-455 border-rose-500/25 bg-rose-500/5' : ''
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
                <label htmlFor="glass-silver">Mic</label>

                <input
                  type="radio"
                  id="glass-gold"
                  name="audioSource"
                  checked={captureSource === 'system'}
                  onChange={() => setCaptureSource('system')}
                />
                <label htmlFor="glass-gold">System</label>

                <input
                  type="radio"
                  id="glass-platinum"
                  name="audioSource"
                  checked={captureSource === 'both'}
                  onChange={() => setCaptureSource('both')}
                />
                <label htmlFor="glass-platinum">Mix</label>

                <div className="glass-glider" />
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
                className="btn-premium-glass-neo flex-1 focus:outline-none"
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
          <h2 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Workspace</h2>
          <nav className="grid grid-cols-2 gap-2 px-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <motion.button
                  key={`workspace-nav-${item.id}-${isActive}`}
                  onClick={() => setActivePage(item.id)}
                  whileHover={{ y: -3, borderColor: 'rgba(139, 92, 246, 0.45)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl text-xs font-semibold btn-interactive transition-all duration-300 relative overflow-hidden text-center border focus:outline-none ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  style={{
                    borderColor: isActive ? '#8B5CF6' : 'rgba(255, 255, 255, 0.12)',
                    background: isActive 
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(139, 92, 246, 0.03) 100%)' 
                      : 'rgba(20, 20, 20, 0.45)',
                    boxShadow: isActive 
                      ? '0 8px 22px rgba(139, 92, 246, 0.25), inset 0 0 10px rgba(139, 92, 246, 0.15)' 
                      : '0 4px 12px rgba(0, 0, 0, 0.2)',
                  }}
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
          <div className="flex items-center justify-between px-3 mb-3">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Analysis</h2>
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
                  whileHover={item.disabled ? {} : { y: -3, borderColor: 'rgba(139, 92, 246, 0.45)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)' }}
                  whileTap={item.disabled ? undefined : { scale: 0.97 }}
                  className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl text-xs font-semibold btn-interactive transition-all duration-300 relative overflow-hidden text-center border focus:outline-none ${
                    item.disabled
                      ? 'text-slate-700 cursor-not-allowed border-transparent opacity-25'
                      : isActive
                      ? 'text-white shadow-lg'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  style={{
                    borderColor: item.disabled ? 'transparent' : isActive ? '#8B5CF6' : 'rgba(255, 255, 255, 0.12)',
                    background: item.disabled 
                      ? 'rgba(20, 20, 20, 0.15)' 
                      : isActive 
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(139, 92, 246, 0.03) 100%)' 
                      : 'rgba(20, 20, 20, 0.45)',
                    boxShadow: isActive && !item.disabled
                      ? '0 8px 22px rgba(139, 92, 246, 0.25), inset 0 0 10px rgba(139, 92, 246, 0.15)' 
                      : item.disabled ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.2)',
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
        <div className="glass-panel p-4 rounded-xl border border-slate-900 space-y-3.5">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI parameters</h2>
          
          <div className="space-y-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Whisper Model</label>
              <select 
                value={modelSize}
                onChange={e => setModelSize(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold"
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
                className="w-full bg-slate-950 border border-slate-900 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold"
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
      <div className="p-4 border-t border-slate-900/40 bg-transparent flex flex-col gap-2">
        {currentMeeting && (
          <div className="p-3 bg-slate-950/40 backdrop-blur-md rounded-lg border border-slate-850/40 flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-semibold">Loaded Meeting</span>
            <span className="text-xs text-white font-medium truncate">{currentMeeting.title}</span>
            <span className="text-[10px] text-slate-400">
              Duration: {currentMeeting.duration ? `${(currentMeeting.duration / 60).toFixed(1)}m` : '0.0m'}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 px-2 text-[10.5px] text-slate-500 font-medium">
          <span className="relative w-2 h-2 rounded-full bg-emerald-500 status-ring-ready flex-shrink-0" />
          <span>Local Engine Active</span>
        </div>
      </div>
    </aside>
  );
};
