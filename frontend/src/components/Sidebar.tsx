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
  Activity, 
  Bell, 
  HelpCircle,
  ChevronRight,
  FileAudio,
  LogOut,
  Radio,
  Sun
} from 'lucide-react';
import { Meeting } from '../types';
import { SamvadSignatureHelixLogo } from './SamvadSignatureHelixLogo';
import { SamvadBrandWordmarkCorrected } from './SamvadAlternativeLogos';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  currentMeeting: Meeting | null;
  meetings: Meeting[];
  onSelectMeeting: (meeting: Meeting) => void;

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

  modelSize: string;
  setModelSize: (s: string) => void;
  language: string;
  setLanguage: (l: string) => void;
  vadEnabled: boolean;
  setVadEnabled: (v: boolean) => void;

  captureSource: 'mic' | 'system' | 'both';
  setCaptureSource: (s: 'mic' | 'system' | 'both') => void;

  onOpenNotifications?: () => void;
  onStartTour?: () => void;
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
    { id: 'transcript', label: 'Transcript', icon: FileText, disabled: !currentMeeting, dotColor: 'bg-emerald-400' },
    { id: 'summary', label: 'Meeting Memo', icon: Sparkles, disabled: !currentMeeting, dotColor: 'bg-sky-400' },
    { id: 'stats', label: 'Meeting Stats', icon: Activity, disabled: !currentMeeting, dotColor: 'bg-violet-400' },
    { id: 'qa', label: 'AI Assistant', icon: BrainCircuit, disabled: !currentMeeting, dotColor: 'bg-amber-400' },
  ];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <aside className="w-80 sidebar-glass flex flex-col h-screen select-none z-10 relative overflow-hidden bg-[#070913]/90 backdrop-blur-3xl border-r border-white/10 shadow-[20px_0_60px_rgba(0,0,0,0.8)]">
      {/* Apple VisionOS Progressive Blur Layering */}
      <div className="sidebar-progressive-blur">
        <div className="sidebar-blur-layer sidebar-blur-layer--8" />
        <div className="sidebar-blur-layer sidebar-blur-layer--16" />
        <div className="sidebar-blur-layer sidebar-blur-layer--32" />
      </div>
      
      {/* Ambient Mesh Glow Backdrop */}
      <div className="absolute -top-30 -left-30 w-72 h-72 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -left-30 w-72 h-72 rounded-full bg-sky-600/15 blur-[120px] pointer-events-none" />

      {/* ── BRAND HEADER ──────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-white/[0.08] bg-[#090b16]/70 backdrop-blur-md flex items-center justify-between gap-2.5 relative z-10">
        <div className="relative flex items-center gap-3 cursor-pointer shrink-0 min-w-0">
          <SamvadSignatureHelixLogo size={36} />

          <div className="flex items-center gap-1.5 min-w-0">
            <SamvadBrandWordmarkCorrected mode="dark" />
            <div className="badge-v2 shrink-0">
              v2.0
              <span />
            </div>
          </div>

          {recordingState === 'recording' && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border border-slate-950 rounded-full z-20 animate-ping" />
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-white/[0.04] hover:bg-violet-600/20 border border-white/[0.08] hover:border-violet-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Open Notification Center"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
            </button>
          )}
        </div>
      </div>

      {/* ── SCROLLABLE NAVIGATION CONTENT ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative z-10 font-sans scrollbar-none">
        
        {/* 1. AUDIO CAPTURE CARD */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/10 shadow-lg backdrop-blur-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-1.5 text-violet-400">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              AUDIO CAPTURE
            </div>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Open
            </span>
          </div>

          {/* Source Selector Pills */}
          <div className="grid grid-cols-3 gap-1 bg-[#05060c] border border-white/[0.08] p-1 rounded-xl text-center font-mono text-[10px]">
            {[
              { id: 'mic', label: 'Mic', icon: Mic },
              { id: 'system', label: 'System', icon: Radio },
              { id: 'both', label: 'Mix', icon: Activity }
            ].map(item => {
              const Icon = item.icon;
              const isActive = captureSource === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCaptureSource(item.id as any)}
                  className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] border border-violet-400/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Master Record Button */}
          {recordingState === 'idle' ? (
            <button
              onClick={startRecording}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 border border-rose-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              RECORD
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={pauseRecording}
                className="flex-1 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs"
              >
                Pause
              </button>
              <button
                onClick={stopRecording}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md"
              >
                Stop
              </button>
            </div>
          )}
        </div>

        {/* 2. WORKSPACE LIST */}
        <div>
          <h2 className="px-2 text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span className="w-1 h-2 rounded-full bg-violet-400" /> WORKSPACE
          </h2>
          <nav className="space-y-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-1.5 backdrop-blur-xl">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={`workspace-nav-${item.id}`}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                    isActive
                      ? 'bg-violet-600/25 border border-violet-500/40 text-white font-bold shadow-[0_0_15px_rgba(139,92,246,0.25)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-violet-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-violet-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* 3. ACTIVE ANALYSIS PILL GRID */}
        <div>
          <h2 className="px-2 text-[9px] font-mono font-bold text-sky-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span className="w-1 h-2 rounded-full bg-sky-400" /> ACTIVE ANALYSIS
          </h2>
          <nav className="grid grid-cols-2 gap-1.5">
            {meetingItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={`meeting-nav-${item.id}`}
                  disabled={item.disabled}
                  onClick={() => setActivePage(item.id)}
                  className={`px-2.5 py-2 rounded-xl text-[11px] font-medium transition-all border flex items-center justify-between ${
                    item.disabled
                      ? 'text-slate-500/60 cursor-not-allowed border-white/[0.03] bg-black/40 opacity-40'
                      : isActive
                      ? 'bg-sky-500/20 border-sky-500/40 text-white font-bold shadow-md'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive && !item.disabled ? 'text-sky-400' : item.disabled ? 'text-slate-600' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.disabled ? 'bg-slate-700' : item.dotColor}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* 4. CURRENT MEETING CARD */}
        {currentMeeting && (
          <div>
            <h2 className="px-2 text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="w-1 h-2 rounded-full bg-emerald-400" /> CURRENT MEETING
            </h2>
            <div className="p-3 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-xl shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                    <FileAudio className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{currentMeeting.title}</div>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        {recordingState === 'recording' ? 'Recording' : 'Processed'}
                      </span>
                      <span>&bull;</span>
                      <span>{formatTime(currentMeeting.duration || duration)}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </div>

              {/* Waveform Micro Bars */}
              <div className="h-5 w-full flex items-center justify-between gap-0.5 px-1 py-0.5 bg-black/40 rounded-lg border border-white/[0.04]">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-gradient-to-t from-violet-600 to-sky-400"
                    style={{ height: `${Math.max(20, Math.sin(i * 0.5) * 80 + 30)}%` }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-white/[0.06] text-center font-mono text-[9px]">
                <div>
                  <div className="text-slate-500">SPEAKERS</div>
                  <div className="text-white font-bold text-xs">6</div>
                </div>
                <div>
                  <div className="text-slate-500">TRANSCRIPT</div>
                  <div className="text-sky-400 font-bold text-xs">72%</div>
                </div>
                <div>
                  <div className="text-slate-500">CONFIDENCE</div>
                  <div className="text-emerald-400 font-bold text-xs">89%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. ENGINE STATUS CARD */}
        <div>
          <h2 className="px-2 text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span className="w-1 h-2 rounded-full bg-amber-400" /> ENGINE STATUS
          </h2>
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Activity className="w-3 h-3 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-400">Active</div>
                  <div className="text-[8.5px] text-slate-400">All systems operational</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>

            <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-white/[0.06] text-center font-mono text-[8.5px]">
              <div>
                <div className="text-slate-300 font-bold truncate">Whisper</div>
                <div className="text-slate-500 text-[7.5px]">Model</div>
              </div>
              <div>
                <div className="text-sky-400 font-bold">CUDA</div>
                <div className="text-slate-500 text-[7.5px]">GPU</div>
              </div>
              <div>
                <div className="text-violet-300 font-bold">12.4GB</div>
                <div className="text-slate-500 text-[7.5px]">Storage</div>
              </div>
              <div>
                <div className="text-emerald-400 font-bold">78%</div>
                <div className="text-slate-500 text-[7.5px]">Memory</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── USER ADMINISTRATOR PROFILE FOOTER ─────────────────────────────────── */}
      <div className="p-3 border-t border-white/[0.06] bg-[#06070d]/80 backdrop-blur-md relative z-10">
        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 border border-white/20 flex items-center justify-center font-bold text-white text-[11px] shadow-md">
              PD
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Priyansu Das</div>
              <div className="text-[8.5px] text-slate-400 font-mono">Administrator</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg bg-black/40 hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-white transition-all cursor-pointer">
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-lg bg-black/40 hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-rose-400 transition-all cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
