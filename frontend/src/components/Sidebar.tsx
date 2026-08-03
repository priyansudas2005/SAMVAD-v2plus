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
  Bell,
  HelpCircle,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Meeting } from '../types';
import { SamvadSignatureHelixLogo } from './SamvadSignatureHelixLogo';
import { SamvadBrandWordmarkCorrected } from './SamvadAlternativeLogos';

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

  onOpenNotifications?: () => void;
  onStartTour?: () => void;

  // Local User Profile Props
  userProfile?: { name: string; initials: string } | null;
  onOpenLogout?: () => void;
  onToggleTheme?: () => void;
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
  onStartTour,
  userProfile,
  onOpenLogout,
  onToggleTheme,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'recorder', label: 'Studio Recorder', icon: Mic },
    { id: 'history', label: 'Meeting History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart4 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help Center', icon: HelpCircle },
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
    <aside className="w-80 sidebar-glass flex flex-col h-screen select-none z-10 relative overflow-hidden bg-[#040508]/80 backdrop-blur-3xl border-r border-white/[0.08] shadow-[10px_0_40px_rgba(0,0,0,0.6)]">
      {/* Apple VisionOS Progressive Blur Layering */}
      <div className="sidebar-progressive-blur">
        <div className="sidebar-blur-layer sidebar-blur-layer--8" />
        <div className="sidebar-blur-layer sidebar-blur-layer--16" />
        <div className="sidebar-blur-layer sidebar-blur-layer--32" />
      </div>
      
      {/* Specular highlight border overlay */}
      <div className="sidebar-specular-highlight" />

      {/* Ambient Radial Mesh Backdrop Light */}
      <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-violet-600/10 blur-[90px] pointer-events-none" />

      {/* Brand Section */}
      <div className="px-5 py-4 border-b border-white/[0.06] bg-[#07080f]/50 backdrop-blur-md flex items-center justify-between gap-2.5 relative z-10">
        <div
          className="relative flex items-center gap-3 cursor-pointer shrink-0 min-w-0"
          onClick={() => {}}
        >
          {/* Quantum Sonic Helix Signature Logo Mark (Standalone, No Box) */}
          <SamvadSignatureHelixLogo size={38} />

          <div className="flex items-center gap-1.5 min-w-0">
            <SamvadBrandWordmarkCorrected mode="dark" />
            <div className="badge-v2 shrink-0">
              v2.0
              <span />
            </div>
          </div>

          {/* Recording live indicator */}
          {recordingState === 'recording' && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border border-slate-950 rounded-full z-20 animate-ping" />
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Replay Product Tour Trigger */}
          {onStartTour && (
            <button
              onClick={onStartTour}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-sky-600/20 border border-slate-800 hover:border-sky-500/40 text-slate-400 hover:text-sky-300 transition-all group"
              title="Replay Product Tour"
            >
              <Sparkles className="w-3.5 h-3.5 transition-transform group-hover:rotate-12" />
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 relative z-10 scrollbar-none">
        
        {/* Live Audio Capture Module in Sidebar */}
        <div className="p-4 rounded-2xl flex flex-col gap-3 transition-all duration-300 bg-gradient-to-b from-white/[0.03] to-white/[0.005] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
              {/* Capture Source Tabs (SAMVAD Style Glider) */}
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
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(139,92,246,0.7))',
                    boxShadow: '0 0 14px rgba(139,92,246,0.5), inset 0 0 8px rgba(139,92,246,0.3)'
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
                      ? 'text-slate-500/70 cursor-not-allowed border-white/[0.03] bg-black/40 opacity-50'
                      : isActive
                      ? 'btn-nav-liquid-active text-white'
                      : 'btn-nav-liquid-inactive text-slate-300 hover:text-white'
                  }`}
                  style={{
                    borderColor: item.disabled ? 'rgba(255, 255, 255, 0.03)' : undefined
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
                    <Icon className={`w-4 h-4 transition-colors ${isActive && !item.disabled ? 'text-[#8B5CF6]' : item.disabled ? 'text-slate-600' : 'text-slate-400'}`} />
                  </motion.div>
                  <span className={item.disabled ? 'text-slate-500/80 font-medium' : ''} style={isActive && !item.disabled ? { textShadow: '0 0 10px rgba(139, 92, 246, 0.6)' } : undefined}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Model parameters selectors inside sidebar */}
        <div className="p-4 rounded-2xl space-y-3.5 bg-white/[0.02] border border-white/[0.06] shadow-lg backdrop-blur-md">
          <h2 className="text-[9px] font-semibold text-slate-400/90 uppercase tracking-[0.14em]">AI Parameters</h2>
          
          <div className="space-y-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Whisper Model</label>
              <select 
                value={modelSize}
                onChange={e => setModelSize(e.target.value)}
                className="w-full bg-[#080a0f] border border-white/[0.08] hover:border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6] font-mono font-semibold"
              >
                <option value="tiny">Tiny (39M params)</option>
                <option value="base">Base (74M params)</option>
                <option value="small">Small (244M params)</option>
                <option value="medium">Medium (769M params)</option>
                <option value="large-v3">Large V3 (1.5B params)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Language</label>
              <select 
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-[#080a0f] border border-white/[0.08] hover:border-white/20 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6] font-mono font-semibold"
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

      {/* Footer User Profile & Actions */}
      <div className="p-3.5 border-t border-white/[0.08] bg-[#06070d]/80 backdrop-blur-md flex flex-col gap-2 relative z-10">
        <div className="p-2.5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] flex items-center justify-between shadow-inner">
          {/* Avatar & Display Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 border border-violet-400/30 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-violet-600/30 shrink-0 font-mono">
              {userProfile?.initials || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{userProfile?.name || 'Local User'}</div>
              <div className="text-[9.5px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Local Profile
              </div>
            </div>
          </div>

          {/* Actions: Theme Toggle, Logout */}
          <div className="flex items-center gap-1 shrink-0">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-1.5 rounded-lg bg-black/40 hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-amber-300 transition-all cursor-pointer"
                title="Toggle Theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            )}
            {onOpenLogout && (
              <button
                onClick={onOpenLogout}
                className="p-1.5 rounded-lg bg-black/40 hover:bg-rose-500/20 border border-white/[0.06] hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
                title="Logout Session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
