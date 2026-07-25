import React, { useState } from 'react';
import { 
  Mic, 
  Radio, 
  Square, 
  Play, 
  Pause, 
  Sliders, 
  Cpu, 
  BrainCircuit, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  Download, 
  Volume2, 
  Layers, 
  Activity, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Clock, 
  Settings, 
  Zap, 
  HardDrive,
  FileText,
  SlidersHorizontal,
  FolderSync
} from 'lucide-react';

export interface FlagshipDAWRecorderProps {
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
}

export const DAWRecorderPage: React.FC<FlagshipDAWRecorderProps> = ({
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
  setCaptureSource
}) => {
  const [inputGain, setInputGain] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'multitrack' | 'mixer' | 'spectrogram'>('multitrack');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const formatHMS = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-screen w-full bg-[#020305] text-slate-100 font-sans select-none overflow-hidden border-t border-slate-900/60">
      
      {/* ── 1. COMPACT TOP TOOLBAR (DAW Header) ───────────────────────────────── */}
      <header className="h-10 bg-[#07080d] border-b border-slate-800/90 px-4 flex items-center justify-between shrink-0 font-mono text-[11px]">
        
        {/* Left Project Metadata & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-violet-600/15 border border-violet-500/30 text-violet-300 font-bold text-[10px] tracking-wider">
            <Radio className="w-3 h-3 text-violet-400" /> FLAGSHIP STUDIO DAW
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Session Recording..."
            className="bg-[#0b0d14] border border-slate-800 rounded px-2.5 py-0.5 text-xs text-white font-sans w-60 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Center Hardware Telemetry Pills */}
        <div className="hidden lg:flex items-center gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-[#0b0d14] border border-slate-800 text-slate-400">
            ENGINE: <strong className="text-emerald-400">LOCAL CUDA OMNI</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-[#0b0d14] border border-slate-800 text-slate-400">
            ENCODING: <strong className="text-slate-200">32-BIT FLOAT WAV</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-[#0b0d14] border border-slate-800 text-slate-400">
            CHANNELS: <strong className="text-sky-400">{captureSource === 'both' ? 'STEREO MIX' : 'MONO MIC'}</strong>
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={discardRecording}
            disabled={recordingState === 'idle'}
            className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-[10.5px] font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Discard
          </button>

          <button 
            onClick={saveRecording}
            disabled={recordingState === 'idle' || uploading}
            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold shadow-md shadow-emerald-600/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            <Download className="w-3 h-3" /> {uploading ? 'Processing...' : 'Save & Analyze'}
          </button>
        </div>
      </header>

      {/* ── MAIN INTEGRATED WORKSPACE LAYOUT (NO FLOATING CARDS) ─────────────── */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        
        {/* ── 2. RECORDING INSPECTOR (LEFT PANEL - 12% WIDTH) ────────────────── */}
        <aside className="w-52 bg-[#050609] border-r border-slate-800/90 p-3 flex flex-col justify-between shrink-0 space-y-4 font-mono text-xs overflow-y-auto">
          <div className="space-y-4">
            <div className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" /> Audio Inspector
            </div>

            {/* Input Capture Source */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] text-slate-400 uppercase font-bold">Capture Source</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#0b0d14] border border-slate-800 rounded">
                {[
                  { id: 'mic', label: 'Mic' },
                  { id: 'system', label: 'Sys' },
                  { id: 'both', label: 'Mix' }
                ].map(src => (
                  <button
                    key={src.id}
                    onClick={() => setCaptureSource(src.id as any)}
                    className={`py-1 rounded text-[10px] font-bold transition-all ${
                      captureSource === src.id ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gain Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9.5px] font-bold">
                <span className="text-slate-400">GAIN</span>
                <span className="text-sky-400">{inputGain > 0 ? `+${inputGain}` : inputGain} dB</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                value={inputGain}
                onChange={(e) => setInputGain(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer h-1 bg-[#0b0d14] rounded"
              />
            </div>

            {/* AI STT Model Choice */}
            <div className="space-y-1">
              <label className="text-[9.5px] text-slate-400 uppercase font-bold">Whisper AI STT</label>
              <select
                value={modelSize}
                onChange={(e) => setModelSize(e.target.value)}
                className="w-full bg-[#0b0d14] border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-violet-500 font-semibold"
              >
                <option value="tiny">Tiny (39M)</option>
                <option value="base">Base (74M)</option>
                <option value="small">Small (244M)</option>
                <option value="medium">Medium (769M)</option>
                <option value="large-v3">Large-v3 (1.5B)</option>
              </select>
            </div>

            {/* VAD Toggle */}
            <div className="flex items-center justify-between p-2 bg-[#0b0d14] border border-slate-800/80 rounded">
              <div>
                <div className="text-[10px] font-bold text-white">VAD Trimming</div>
                <div className="text-[8.5px] text-slate-400">Silence suppression</div>
              </div>
              <input
                type="checkbox"
                checked={vadEnabled}
                onChange={(e) => setVadEnabled(e.target.checked)}
                className="w-3.5 h-3.5 accent-violet-600 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="p-2.5 bg-[#0b0d14] border border-slate-800/80 rounded space-y-1 text-[9.5px] text-slate-400">
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> HARDWARE LOCK
            </div>
            <div>CUDA Memory: 3.4 GB</div>
          </div>
        </aside>

        {/* ── 3. MASSIVE RECORDING WORKSPACE (DOMINANT 75–80% WIDTH) ─────────── */}
        <main className="flex-1 bg-[#010204] flex flex-col justify-between shrink-0 min-w-0 border-r border-slate-800/90 relative overflow-hidden">
          
          {/* Timeline View Header & Track Tabs */}
          <div className="h-8 bg-[#06070a] border-b border-slate-800/90 px-4 flex items-center justify-between font-mono text-xs shrink-0">
            <div className="flex items-center gap-2">
              {['multitrack', 'mixer', 'spectrogram'].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t as any)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                    activeTab === t 
                      ? 'bg-violet-600/20 border border-violet-500/40 text-violet-300' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Timeline Zoom Controls */}
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] text-slate-500 font-bold uppercase">ZOOM:</span>
              <button onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))} className="px-1.5 py-0.5 bg-[#0b0d14] border border-slate-800 rounded text-slate-400 hover:text-white text-[10px]">
                -
              </button>
              <span className="text-[9.5px] text-slate-300 font-bold">{zoomLevel}%</span>
              <button onClick={() => setZoomLevel(prev => Math.min(200, prev + 25))} className="px-1.5 py-0.5 bg-[#0b0d14] border border-slate-800 rounded text-slate-400 hover:text-white text-[10px]">
                +
              </button>
            </div>
          </div>

          {/* Timeline Ruler Header Bar (Top of Multitrack Grid) */}
          <div className="h-6 bg-[#08090f] border-b border-slate-800/80 px-4 flex items-center justify-between font-mono text-[9px] text-slate-500 shrink-0">
            <span>00:00:00</span>
            <span>00:15:00</span>
            <span>00:30:00</span>
            <span>00:45:00</span>
            <span>01:00:00</span>
            <span>01:15:00</span>
            <span>01:30:00</span>
            <span className="text-emerald-400 font-bold">PLAYHEAD: {formatHMS(duration)}</span>
          </div>

          {/* DUAL DAW TRACK ARCHITECTURE (MULTITRACK TRACK LAYOUT) */}
          <div className="flex-1 flex flex-col justify-stretch overflow-hidden relative bg-[#020305] divide-y divide-slate-800/80">
            
            {/* Track 1: Physical Microphone Channel */}
            <div className="flex-1 flex min-h-0 relative">
              {/* Track Left Control Header */}
              <div className="w-36 bg-[#07080e] border-r border-slate-800/80 p-2.5 flex flex-col justify-between shrink-0 font-mono text-[10px]">
                <div className="flex items-center justify-between font-bold text-violet-300">
                  <span>TRACK 1</span>
                  <span className="text-[8px] bg-violet-600/20 border border-violet-500/30 px-1 rounded">MIC</span>
                </div>
                <div className="text-slate-400 text-[9px] font-sans truncate">Physical Mic Input</div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[8.5px] text-emerald-400 font-bold rounded">MUTE</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[8.5px] text-sky-400 font-bold rounded">SOLO</span>
                </div>
              </div>

              {/* Track 1 Canvas Region */}
              <div className="flex-1 bg-[#030407] relative flex items-center justify-center">
                {recordingState === 'recording' && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[9px] font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> TRACK 1 ARM &amp; RECORDING
                  </div>
                )}
                <div className="text-slate-700 font-mono text-xs tracking-widest uppercase">
                  [ TRACK 1 DIGITAL WAVEFORM GRID ARCHITECTURE ]
                </div>
              </div>

              {/* Side Peak Meter Channel 1 */}
              <div className="w-2.5 h-full border-l border-slate-800/80 bg-slate-950 p-0.5 flex flex-col justify-end shrink-0">
                <div 
                  className="w-full bg-gradient-to-t from-emerald-500 via-sky-400 to-violet-500 rounded-xs"
                  style={{ height: recordingState === 'recording' ? `${(duration % 60) + 20}%` : '0%' }}
                />
              </div>
            </div>

            {/* Track 2: System Audio Loopback Channel */}
            <div className="flex-1 flex min-h-0 relative">
              {/* Track Left Control Header */}
              <div className="w-36 bg-[#07080e] border-r border-slate-800/80 p-2.5 flex flex-col justify-between shrink-0 font-mono text-[10px]">
                <div className="flex items-center justify-between font-bold text-sky-300">
                  <span>TRACK 2</span>
                  <span className="text-[8px] bg-sky-600/20 border border-sky-500/30 px-1 rounded">SYS</span>
                </div>
                <div className="text-slate-400 text-[9px] font-sans truncate">System Loopback Mix</div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[8.5px] text-emerald-400 font-bold rounded">MUTE</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[8.5px] text-sky-400 font-bold rounded">SOLO</span>
                </div>
              </div>

              {/* Track 2 Canvas Region */}
              <div className="flex-1 bg-[#030407] relative flex items-center justify-center">
                {recordingState === 'recording' && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-sky-600/10 border border-sky-500/30 text-sky-400 font-mono text-[9px] font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" /> TRACK 2 LOOPBACK ACTIVE
                  </div>
                )}
                <div className="text-slate-700 font-mono text-xs tracking-widest uppercase">
                  [ TRACK 2 DIGITAL WAVEFORM GRID ARCHITECTURE ]
                </div>
              </div>

              {/* Side Peak Meter Channel 2 */}
              <div className="w-2.5 h-full border-l border-slate-800/80 bg-slate-950 p-0.5 flex flex-col justify-end shrink-0">
                <div 
                  className="w-full bg-gradient-to-t from-emerald-500 via-sky-400 to-rose-500 rounded-xs"
                  style={{ height: recordingState === 'recording' ? `${(duration % 50) + 15}%` : '0%' }}
                />
              </div>
            </div>

          </div>

          {/* Workspace Status Bar */}
          <div className="h-7 bg-[#07080d] border-t border-slate-800/80 px-4 flex items-center justify-between font-mono text-[9.5px] text-slate-400 shrink-0">
            <div className="flex items-center gap-3">
              <span>STATE: <strong className="text-white">{recordingState.toUpperCase()}</strong></span>
              <span>PLAYHEAD: <strong className="text-emerald-400">{formatHMS(duration)}</strong></span>
            </div>
            <span>MASTER STEREO BUS OUT</span>
          </div>

        </main>

        {/* ── 4. LIVE AI INTELLIGENCE (RIGHT PANEL - 12-15% WIDTH) ────────────── */}
        <aside className="w-56 bg-[#050609] p-3 flex flex-col justify-between shrink-0 space-y-4 font-mono text-xs overflow-y-auto">
          <div className="space-y-3">
            <div className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2 flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-sky-400" /> AI Stream Inspector
            </div>

            {/* Speaker Diarization Stream */}
            <div className="space-y-2">
              <div className="text-[9.5px] text-slate-400 font-bold uppercase">Speaker Diarization</div>
              <div className="p-2.5 bg-[#0b0d14] border border-slate-800/80 rounded space-y-1">
                <div className="flex justify-between text-[9px]">
                  <span className="text-violet-400 font-bold">Speaker 1</span>
                  <span className="text-slate-500">00:04</span>
                </div>
                <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
                  Local SAMVAD pipeline active.
                </p>
              </div>
            </div>
          </div>

          {/* AI Pipeline Telemetry */}
          <div className="p-2.5 bg-[#0b0d14] border border-slate-800/80 rounded space-y-1 text-[9.5px] text-slate-400 font-mono">
            <div className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Pipeline Stats
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Speakers:</span>
              <span className="text-sky-400 font-bold">2 Identified</span>
            </div>
          </div>
        </aside>

      </div>

      {/* ── 5. PROFESSIONAL TRANSPORT BAR (BOTTOM PANEL) ──────────────────────── */}
      <footer className="h-14 bg-[#06070b] border-t border-slate-800/90 px-6 flex items-center justify-between shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${
            recordingState === 'recording' ? 'bg-rose-500 animate-ping' : recordingState === 'paused' ? 'bg-amber-400' : 'bg-slate-600'
          }`} />
          <span className="text-xs text-slate-300 font-bold uppercase">
            TRANSPORT: {recordingState.toUpperCase()}
          </span>
        </div>

        {/* Master DAW Transport Buttons */}
        <div className="flex items-center gap-3">
          {recordingState === 'idle' && (
            <button
              onClick={startRecording}
              className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 group"
            >
              <Mic className="w-4 h-4 fill-white transition-transform group-hover:scale-110" />
              START RECORDING
            </button>
          )}

          {recordingState === 'recording' && (
            <>
              <button
                onClick={pauseRecording}
                className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Pause className="w-4 h-4" /> PAUSE
              </button>
              
              <button
                onClick={stopRecording}
                className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Square className="w-4 h-4 fill-slate-200" /> STOP
              </button>
            </>
          )}

          {recordingState === 'paused' && (
            <>
              <button
                onClick={resumeRecording}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-white" /> RESUME
              </button>

              <button
                onClick={stopRecording}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Square className="w-4 h-4 fill-slate-200" /> STOP
              </button>
            </>
          )}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          SAMVAD FLAGSHIP DAW ENGINE v2.0
        </div>
      </footer>

    </div>
  );
};
