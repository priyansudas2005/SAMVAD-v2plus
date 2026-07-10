import React from 'react';
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
  Activity
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
    { id: 'recorder', label: 'Recorder', icon: Mic },
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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
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
            <div className="flex gap-2">
              <motion.button 
                onClick={pauseRecording}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs btn-interactive flex items-center justify-center gap-1"
              >
                <Pause className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                Pause
              </motion.button>
              <motion.button 
                onClick={stopRecording}
                whileTap={{ scale: 0.97 }}
                animate={{ boxShadow: [
                  "0 0 0 0px rgba(239,68,68,0.4)",
                  "0 0 0 12px rgba(239,68,68,0)",
                ]}}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-455 text-white font-bold rounded-lg text-xs btn-interactive flex items-center justify-center gap-1 focus:outline-none"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Stop</span>
                </motion.div>
              </motion.button>
            </div>
          )}

          {recordingState === 'paused' && (
            <div className="flex gap-2">
              <motion.button 
                onClick={resumeRecording}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs btn-interactive flex items-center justify-center gap-1"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                Resume
              </motion.button>
              <motion.button 
                onClick={stopRecording}
                whileTap={{ scale: 0.97 }}
                animate={{ boxShadow: [
                  "0 0 0 0px rgba(239,68,68,0.4)",
                  "0 0 0 12px rgba(239,68,68,0)",
                ]}}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-455 text-white font-bold rounded-lg text-xs btn-interactive flex items-center justify-center gap-1 focus:outline-none"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Stop</span>
                </motion.div>
              </motion.button>
            </div>
          )}

          {recordingState === 'stopped' && (
            <div className="flex flex-col gap-2.5">
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meeting name..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold"
              />
              <div className="flex gap-2">
                <motion.button 
                  onClick={discardRecording}
                  whileTap={{ scale: 0.97 }}
                  disabled={uploading}
                  className="flex-1 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 text-[10.5px] font-bold rounded-lg btn-interactive"
                >
                  Discard
                </motion.button>
                <motion.button 
                  onClick={saveRecording}
                  whileTap={{ scale: 0.97 }}
                  disabled={uploading}
                  className="flex-1 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 btn-interactive"
                >
                  {uploading ? 'Saving...' : 'Save'}
                </motion.button>
              </div>
            </div>
          )}

          {/* Glowing Timebar Sweep */}
          {recordingState === 'recording' && (
            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-0 bg-rose-500 rounded-full w-full animate-pulse" style={{ width: `${(duration % 60) * 100 / 60}%` }} />
            </div>
          )}

          {recordingError && (
            <span className="text-[10px] text-rose-500 font-semibold text-center">{recordingError}</span>
          )}
        </div>

        {/* Core Navigation Links */}
        <div>
          <h2 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Workspace</h2>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium btn-interactive ${
                    isActive
                      ? 'hero-gradient-btn text-sky-400 pl-2.5 font-bold shadow-elevation-md'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  {item.label}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Active Loaded Meeting Routing */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Analysis</h2>
            {currentMeeting && (
              <span className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]">
                {currentMeeting.title}
              </span>
            )}
          </div>
          <nav className="space-y-1">
            {meetingItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <motion.button
                  key={item.id}
                  disabled={item.disabled}
                  onClick={() => setActivePage(item.id)}
                  whileTap={item.disabled ? undefined : { scale: 0.97 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium btn-interactive ${
                    item.disabled
                      ? 'text-slate-600 cursor-not-allowed opacity-50'
                      : isActive
                      ? 'hero-gradient-btn text-sky-400 pl-2.5 font-bold shadow-elevation-md'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive && !item.disabled ? 'text-sky-400' : 'text-slate-500'}`} />
                  {item.label}
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
