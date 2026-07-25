import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Bookmark, 
  MapPin, 
  Undo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Lock, 
  Unlock,
  Mic, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Settings, 
  Maximize, 
  Minimize2, 
  ExternalLink,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DAWTransportSystemProps {
  recordingState: 'idle' | 'recording' | 'paused' | 'stopped';
  duration: number;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  
  // Navigation & Marker Callbacks
  onJumpToBeginning?: () => void;
  onJumpToEnd?: () => void;
  onPrevMarker?: () => void;
  onNextMarker?: () => void;
  onAddMarker?: () => void;
  onBookmarkTime?: () => void;
  onUndoMarker?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitRecording?: () => void;
  
  // State Values
  markersCount?: number;
  sampleRate?: string;
  bitDepth?: string;
  channels?: string;
  format?: string;
  
  // Hardware / Input Routing
  selectedMicDevice?: string;
  onSelectMicDevice?: (mic: string) => void;
  inputGain?: number;
  onChangeInputGain?: (gain: number) => void;
  
  // Workspace Toggles
  isMuteMonitoring?: boolean;
  onToggleMonitoring?: () => void;
  followRecording?: boolean;
  onToggleFollowRecording?: () => void;
  scrollLock?: boolean;
  onToggleScrollLock?: () => void;
  metronomeActive?: boolean;
  onToggleMetronome?: () => void;
  
  onOpenSettings?: () => void;
  onToggleFullscreen?: () => void;
  onToggleFloating?: () => void;
  onDetachTimeline?: () => void;
}

export const DAWTransportSystem: React.FC<DAWTransportSystemProps> = ({
  recordingState,
  duration,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  
  onJumpToBeginning,
  onJumpToEnd,
  onPrevMarker,
  onNextMarker,
  onAddMarker,
  onBookmarkTime,
  onUndoMarker,
  onZoomIn,
  onZoomOut,
  onFitRecording,
  
  markersCount = 0,
  sampleRate = '48 kHz',
  bitDepth = '24-bit',
  channels = 'Stereo',
  format = 'WAV',
  
  selectedMicDevice = 'Default Microphone',
  onSelectMicDevice,
  inputGain = 0,
  onChangeInputGain,
  
  isMuteMonitoring = false,
  onToggleMonitoring,
  followRecording = true,
  onToggleFollowRecording,
  scrollLock = false,
  onToggleScrollLock,
  metronomeActive = false,
  onToggleMetronome,
  
  onOpenSettings,
  onToggleFullscreen,
  onToggleFloating,
  onDetachTimeline
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showMicDropdown, setShowMicDropdown] = useState<boolean>(false);
  const [showGainSlider, setShowGainSlider] = useState<boolean>(false);
  const [activeContextMenu, setActiveContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Clock Formatting (00:18:42)
  const formatHMS = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const availableMics = [
    'Default Microphone',
    'Built-in Microphone Array',
    'USB Studio Condenser Mic',
    'Realtek High Definition Audio'
  ];

  return (
    <footer 
      className="h-20 bg-[#06080e]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-2 flex items-center justify-between shrink-0 font-mono select-none relative z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
      onContextMenu={(e) => {
        e.preventDefault();
        setActiveContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* REGION 1: LEFT — SESSION NAVIGATION */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center bg-[#0d1017] border border-white/[0.08] rounded-xl p-1 shadow-inner">
          <button
            onClick={onJumpToBeginning}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all relative group"
            title="Jump to Beginning (Home / Key [)"
          >
            <SkipBack className="w-4 h-4" />
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0e1016] border border-white/10 text-[9px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Jump Start (Home)
            </span>
          </button>

          <button
            onClick={onJumpToEnd}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all relative group"
            title="Jump to End (End / Key ])"
          >
            <SkipForward className="w-4 h-4" />
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0e1016] border border-white/10 text-[9px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Jump End (End)
            </span>
          </button>
        </div>

        <div className="w-[1px] h-8 bg-white/[0.08] mx-1" />
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* REGION 2: CENTER — PRIMARY TRANSPORT CONTROLS */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Play Button */}
        <button
          onClick={() => setIsPlaying(p => !p)}
          className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center relative group active:scale-95 ${
            isPlaying 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/20' 
              : 'bg-[#0d1017] border-white/[0.08] text-slate-300 hover:text-white hover:border-white/20'
          }`}
          title="Play (Key P)"
        >
          <Play className={`w-4 h-4 ${isPlaying ? 'fill-emerald-400' : 'fill-slate-300'}`} />
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0e1016] border border-white/10 text-[9px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Play (P)
          </span>
        </button>

        {/* Pause Button */}
        <button
          onClick={recordingState === 'recording' ? pauseRecording : resumeRecording}
          disabled={recordingState === 'idle'}
          className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center relative group active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
            recordingState === 'paused'
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/20'
              : 'bg-[#0d1017] border-white/[0.08] text-slate-300 hover:text-white hover:border-white/20'
          }`}
          title="Pause (Key Space)"
        >
          <Pause className="w-4 h-4" />
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0e1016] border border-white/10 text-[9px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Pause (Space)
          </span>
        </button>

        {/* 🔴 MASTER RECORD BUTTON — Largest Hardware Controller */}
        {recordingState === 'idle' ? (
          <button
            onClick={startRecording}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 border-2 border-rose-400/40 text-white shadow-[0_0_25px_rgba(225,29,72,0.45)] hover:shadow-[0_0_35px_rgba(225,29,72,0.65)] transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center relative group cursor-pointer"
            title="Start Recording (Space / Key R)"
          >
            <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
            <span className="text-[7.5px] font-black tracking-widest uppercase mt-0.5 opacity-90">REC</span>
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0e1016] border border-white/10 text-[9px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Record (Space)
            </span>
          </button>
        ) : (
          <button
            onClick={recordingState === 'paused' ? resumeRecording : pauseRecording}
            className="w-14 h-14 rounded-full bg-rose-600 border-2 border-rose-300 text-white shadow-[0_0_30px_rgba(225,29,72,0.8)] animate-pulse flex flex-col items-center justify-center relative group cursor-pointer"
            title="Recording Live — Click to Pause"
          >
            <div className="w-4 h-4 rounded-sm bg-white" />
            <span className="text-[7.5px] font-black tracking-widest uppercase mt-0.5">LIVE</span>
          </button>
        )}

        {/* Stop Button */}
        <button
          onClick={stopRecording}
          disabled={recordingState === 'idle'}
          className="w-10 h-10 rounded-full bg-[#0d1017] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white transition-all flex items-center justify-center relative group active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Stop Recording (Esc / Key S)"
        >
          <Square className="w-4 h-4 fill-slate-300 group-hover:fill-white" />
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#0e1016] border border-white/10 text-[9px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Stop (Esc)
          </span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* REGION 3: CENTER RIGHT — TIMELINE NAVIGATION */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-[1px] h-8 bg-white/[0.08] mx-1" />

        <div className="flex items-center bg-[#0d1017] border border-white/[0.08] rounded-xl p-1 gap-0.5">
          <button
            onClick={onPrevMarker}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all relative group"
            title="Previous Marker (Key Up)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onNextMarker}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all relative group"
            title="Next Marker (Key Down)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onAddMarker}
            disabled={recordingState === 'idle'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/[0.06] active:scale-95 transition-all relative group disabled:opacity-30"
            title="Add Marker (Key M)"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
          </button>

          <button
            onClick={onBookmarkTime}
            disabled={recordingState === 'idle'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-white/[0.06] active:scale-95 transition-all relative group disabled:opacity-30"
            title="Bookmark Current Time (Key B)"
          >
            <Bookmark className="w-3.5 h-3.5 text-violet-400" />
          </button>

          <button
            onClick={onUndoMarker}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] active:scale-95 transition-all relative group"
            title="Undo Marker (Cmd+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timeline Zoom Controls */}
        <div className="flex items-center bg-[#0d1017] border border-white/[0.08] rounded-xl p-1 gap-0.5">
          <button
            onClick={onZoomOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onZoomIn}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onFitRecording}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/[0.06] active:scale-95 transition-all"
            title="Fit Entire Recording"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          <button
            onClick={onToggleFollowRecording}
            className={`p-1.5 rounded-lg border transition-all ${
              followRecording 
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
            title="Follow Recording Cursor"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleScrollLock}
            className={`p-1.5 rounded-lg border transition-all ${
              scrollLock 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
            title="Horizontal Scroll Lock"
          >
            {scrollLock ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* REGION 4: RIGHT — RECORDING DISPLAY */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 shrink-0 bg-[#0a0d14] border border-white/[0.08] px-4 py-1.5 rounded-xl shadow-2xl">
        <div className="text-right">
          {/* Large Recording Clock */}
          <div className="text-lg font-black font-mono text-emerald-400 tracking-wider drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            {formatHMS(duration)}
          </div>

          {/* Telemetry Audio Metadata Sub-bar */}
          <div className="flex items-center justify-end gap-1.5 text-[9px] font-mono text-slate-400 font-bold uppercase tracking-tight">
            <span className="text-[#8B5CF6]">{sampleRate}</span>
            <span>&middot;</span>
            <span>{bitDepth}</span>
            <span>&middot;</span>
            <span>{channels}</span>
            <span>&middot;</span>
            <span className="text-amber-400">{format}</span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* REGION 5: FAR RIGHT — WORKSPACE TOOLS */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0 relative">
        <div className="w-[1px] h-8 bg-white/[0.08] mx-1" />

        {/* Microphone Selector */}
        <div className="relative">
          <button
            onClick={() => setShowMicDropdown(prev => !prev)}
            className="p-2 rounded-xl bg-[#0d1017] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Select Acoustic Mic Channel"
          >
            <Mic className="w-4 h-4 text-violet-400" />
            <span className="max-w-[80px] truncate text-[11px] hidden sm:inline-block">{selectedMicDevice}</span>
          </button>

          {showMicDropdown && (
            <div className="absolute bottom-12 right-0 w-56 bg-[#0e1016] border border-white/10 rounded-xl p-2 shadow-2xl z-50 font-mono text-xs space-y-1">
              <div className="text-[9px] font-bold text-[#8B5CF6] uppercase px-2 py-1">SELECT INPUT HARDWARE</div>
              {availableMics.map(mic => (
                <button
                  key={mic}
                  onClick={() => {
                    if (onSelectMicDevice) onSelectMicDevice(mic);
                    setShowMicDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] truncate transition-all ${
                    selectedMicDevice === mic ? 'bg-[#8B5CF6]/20 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {mic}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Monitoring Toggle */}
        <button
          onClick={onToggleMonitoring}
          className={`p-2 rounded-xl border transition-all ${
            isMuteMonitoring
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              : 'bg-[#0d1017] border-white/[0.08] text-slate-300 hover:text-white'
          }`}
          title="Toggle Monitor Audio (Key M)"
        >
          {isMuteMonitoring ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Input Gain Controls */}
        <div className="relative">
          <button
            onClick={() => setShowGainSlider(prev => !prev)}
            className="p-2 rounded-xl bg-[#0d1017] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white transition-all"
            title="Adjust Input Gain (dB)"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
          </button>

          {showGainSlider && (
            <div className="absolute bottom-12 right-0 w-44 bg-[#0e1016] border border-white/10 rounded-xl p-3 shadow-2xl z-50 font-mono text-xs space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">INPUT GAIN</span>
                <span className="text-amber-400 font-bold">{inputGain > 0 ? `+${inputGain}` : inputGain} dB</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                value={inputGain}
                onChange={e => onChangeInputGain && onChangeInputGain(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#030305] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          )}
        </div>

        {/* Metronome */}
        <button
          onClick={onToggleMetronome}
          className={`p-2 rounded-xl border transition-all ${
            metronomeActive
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-[#0d1017] border-white/[0.08] text-slate-300 hover:text-white'
          }`}
          title="Metronome (Future Ready)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-[#0d1017] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white transition-all"
          title="Studio Settings"
        >
          <Settings className="w-4 h-4 text-sky-400" />
        </button>

        {/* Fullscreen Workspace */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-xl bg-[#0d1017] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white transition-all hidden md:flex"
          title="Toggle Fullscreen Workspace"
        >
          <Maximize className="w-4 h-4" />
        </button>

        {/* Floating Workspace */}
        <button
          onClick={onToggleFloating}
          className="p-2 rounded-xl bg-[#0d1017] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white transition-all hidden md:flex"
          title="Toggle Floating Workspace"
        >
          <Minimize2 className="w-4 h-4" />
        </button>

        {/* Detach Timeline */}
        <button
          onClick={onDetachTimeline}
          className="p-2 rounded-xl bg-[#0d1017] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white transition-all hidden md:flex"
          title="Detach Timeline to Window"
        >
          <ExternalLink className="w-4 h-4 text-purple-400" />
        </button>
      </div>

      {/* Context Menu Popup */}
      {activeContextMenu && (
        <div 
          className="fixed bg-[#0e1016] border border-white/10 rounded-xl p-2 shadow-2xl z-50 font-mono text-xs space-y-1"
          style={{ top: activeContextMenu.y - 120, left: activeContextMenu.x }}
          onClick={() => setActiveContextMenu(null)}
        >
          <div className="text-[9px] font-bold text-[#8B5CF6] uppercase px-2 py-1">DAW TRANSPORT OPTIONS</div>
          <button onClick={onJumpToBeginning} className="w-full text-left px-2.5 py-1 rounded hover:bg-white/[0.04] text-slate-300">Jump to Beginning</button>
          <button onClick={onFitRecording} className="w-full text-left px-2.5 py-1 rounded hover:bg-white/[0.04] text-slate-300">Fit Recording View</button>
          <button onClick={onToggleFollowRecording} className="w-full text-left px-2.5 py-1 rounded hover:bg-white/[0.04] text-slate-300">Toggle Follow Cursor</button>
        </div>
      )}
    </footer>
  );
};
