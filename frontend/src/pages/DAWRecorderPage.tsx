import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Radio, 
  Cpu, 
  Sparkles, 
  Layers, 
  Volume2, 
  Activity, 
  Sliders, 
  Settings, 
  FileText, 
  Download, 
  Trash2, 
  CheckCircle2, 
  BrainCircuit, 
  AlertCircle, 
  Zap, 
  HardDrive,
  Maximize2,
  RefreshCcw,
  Clock,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DAWRecorderPageProps {
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

  // Audio parameters & model choices
  modelSize: string;
  setModelSize: (s: string) => void;
  language: string;
  setLanguage: (l: string) => void;
  vadEnabled: boolean;
  setVadEnabled: (v: boolean) => void;
  captureSource: 'mic' | 'system' | 'both';
  setCaptureSource: (s: 'mic' | 'system' | 'both') => void;
}

export const DAWRecorderPage: React.FC<DAWRecorderPageProps> = ({
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
  const [gainDb, setGainDb] = useState<number>(0);
  const [sampleRate, setSampleRate] = useState<string>('44.1 kHz');
  const [activeTab, setActiveTab] = useState<'wave' | 'spectrogram' | 'channels'>('wave');
  
  // Real-time Waveform canvas simulation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live multi-speaker speech stream simulation
  const [liveTranscript, setLiveTranscript] = useState<{ speaker: string; text: string; time: string }[]>([
    { speaker: 'Speaker 1 (Host)', text: 'Welcome team. Initiating local SAMVAD audio capture pipeline...', time: '00:02' },
    { speaker: 'Speaker 2 (Lead)', text: 'Audio spectrum is clean. Whisper-v3 models loaded into CUDA VRAM.', time: '00:06' }
  ]);

  useEffect(() => {
    let interval: any;
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        const dummyPhrases = [
          { speaker: 'Speaker 1 (Host)', text: 'VAD noise suppression active. Trimming background static.' },
          { speaker: 'Speaker 2 (Lead)', text: 'PyAnnote diarization vector embeddings generated.' },
          { speaker: 'Speaker 3 (AI assistant)', text: 'Extracting key action items into executive summary buffer.' }
        ];
        const randomPhrase = dummyPhrases[Math.floor(Math.random() * dummyPhrases.length)];
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        setLiveTranscript(prev => [...prev.slice(-6), { ...randomPhrase, time: timeStr }]);
      }, 4500);
    }
    return () => clearInterval(interval);
  }, [recordingState, duration]);

  // Render Real-time Oscilloscope Waveform Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid Lines (DAW style)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Center Line
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      if (recordingState === 'recording') {
        // Multi-frequency Audio Wave Form
        ctx.strokeStyle = '#8B5CF6';
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        const sliceWidth = canvas.width / 120;
        let x = 0;

        for (let i = 0; i < 120; i++) {
          const amp = Math.sin(i * 0.1 + phase) * 35 + Math.cos(i * 0.25 - phase) * 20;
          const y = canvas.height / 2 + amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();

        // Secondary Cyan Harmonic Overlay
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        x = 0;
        for (let i = 0; i < 120; i++) {
          const amp = Math.cos(i * 0.15 + phase * 1.5) * 25;
          const y = canvas.height / 2 + amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();

        phase += 0.08;
      } else {
        // Flatline resting state
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [recordingState]);

  const formatHMS = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-screen w-full bg-[#040404] text-slate-100 font-sans select-none overflow-hidden border-t border-slate-900/60">
      
      {/* ── 1. TOP TOOLBAR (DAW Studio Bar) ─────────────────────────────────── */}
      <header className="h-12 bg-[#090b10] border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 font-mono text-xs">
        
        {/* Title Input & Metadata */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-violet-600/10 border border-violet-500/20 text-violet-300 font-bold text-[10.5px]">
            <Radio className="w-3.5 h-3.5 text-violet-400" /> DAW WORKSPACE
          </div>
          
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Session Recording..."
            className="bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-sans w-64 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Center Hardware Telemetry Pills */}
        <div className="hidden md:flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
            FORMAT: <strong className="text-slate-200">24-BIT PCM WAV</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
            CHANNELS: <strong className="text-sky-400">{captureSource === 'both' ? 'STEREO MIX' : 'MONO MIC'}</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
            RATE: <strong className="text-emerald-400">{sampleRate}</strong>
          </span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={discardRecording}
            disabled={recordingState === 'idle'}
            className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-[11px] font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Discard
          </button>
          
          <button 
            onClick={saveRecording}
            disabled={recordingState === 'idle' || uploading}
            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md shadow-emerald-600/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> {uploading ? 'Processing...' : 'Save & Analyze'}
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE GRID (Left Inspector, Center Oscilloscope 65%, Right Intelligence) ── */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        
        {/* ── 2. LEFT RECORDING INSPECTOR (20% Width) ────────────────────────── */}
        <aside className="w-64 bg-[#07080c] border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 space-y-4 font-mono text-xs overflow-y-auto">
          
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-violet-400" /> Audio Input Inspector
            </div>

            {/* Input Capture Source Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Audio Capture Source</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                {[
                  { id: 'mic', label: 'Mic' },
                  { id: 'system', label: 'System' },
                  { id: 'both', label: 'Mix' }
                ].map(src => (
                  <button
                    key={src.id}
                    onClick={() => setCaptureSource(src.id as any)}
                    className={`py-1 rounded text-[10.5px] font-bold transition-all ${
                      captureSource === src.id 
                        ? 'bg-violet-600 text-white shadow' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gain Slider Control */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400">INPUT GAIN</span>
                <span className="text-sky-400">{gainDb > 0 ? `+${gainDb}` : gainDb} dB</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                value={gainDb}
                onChange={(e) => setGainDb(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-900 rounded"
              />
            </div>

            {/* Whisper AI Model Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Whisper AI STT Model</label>
              <select
                value={modelSize}
                onChange={(e) => setModelSize(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-violet-500 font-semibold"
              >
                <option value="tiny">Tiny (Fastest)</option>
                <option value="base">Base (74M params)</option>
                <option value="small">Small (244M params)</option>
                <option value="medium">Medium (769M params)</option>
                <option value="large-v3">Large V3 (1.5B params)</option>
              </select>
            </div>

            {/* VAD Silence Suppression Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-lg">
              <div>
                <div className="text-[11px] font-bold text-white">VAD Noise Trimming</div>
                <div className="text-[9px] text-slate-400">Auto silence detection</div>
              </div>
              <input
                type="checkbox"
                checked={vadEnabled}
                onChange={(e) => setVadEnabled(e.target.checked)}
                className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Hardware Lock Status */}
          <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-lg space-y-1 text-[10px] text-slate-400">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> HARDWARE LOCK
            </div>
            <div>CUDA VRAM: 3.4 GB / 8.0 GB</div>
            <div>Latency: &lt; 240ms</div>
          </div>
        </aside>

        {/* ── 3. LARGE CENTRAL RECORDING WORKSPACE (60–65% Width) ─────────────── */}
        <main className="flex-1 bg-[#050609] flex flex-col justify-between p-6 relative overflow-hidden min-w-0 border-r border-slate-800/80">
          
          {/* Top Oscilloscope Tab Controls */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 z-10">
            <div className="flex items-center gap-2">
              {['wave', 'spectrogram', 'channels'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-all ${
                    activeTab === tab 
                      ? 'bg-violet-600/20 border border-violet-500/40 text-violet-300' 
                      : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Timecode Clock Display */}
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">TIMECODE:</span>
              <span className="text-xl font-extrabold tracking-widest text-emerald-400 bg-slate-950 px-3 py-1 rounded border border-emerald-500/30 font-mono shadow-inner">
                {formatHMS(duration)}
              </span>
            </div>
          </div>

          {/* Central Oscilloscope Waveform Display */}
          <div className="relative flex-1 my-4 bg-[#020305] border border-slate-800/90 rounded-xl overflow-hidden flex flex-col items-center justify-center">
            
            {/* Live Recording Pulsing Status Ring */}
            {recordingState === 'recording' && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                LIVE AUDIO RECORDING IN PROGRESS
              </div>
            )}

            {/* Oscilloscope Canvas */}
            <canvas
              ref={canvasRef}
              width={800}
              height={320}
              className="w-full h-full object-cover"
            />
          </div>

          {/* dB Peak Meter Gauge Bar (Bottom of Workspace) */}
          <div className="space-y-1 z-10 font-mono">
            <div className="flex justify-between text-[9.5px] text-slate-400 font-bold">
              <span>PEAK METER (L/R)</span>
              <span>{recordingState === 'recording' ? '-12.4 dB' : '-INF dB'}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 flex items-center gap-0.5">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className={`h-full flex-1 rounded-xs transition-all ${
                    recordingState === 'recording' && i < (duration % 25) + 5
                      ? i > 24 ? 'bg-rose-500' : i > 18 ? 'bg-amber-400' : 'bg-emerald-400'
                      : 'bg-slate-900'
                  }`}
                />
              ))}
            </div>
          </div>

        </main>

        {/* ── 4. RIGHT LIVE INTELLIGENCE PANEL (20% Width) ────────────────────── */}
        <aside className="w-72 bg-[#07080c] p-4 flex flex-col justify-between shrink-0 space-y-4 font-mono text-xs overflow-y-auto">
          
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2 flex items-center gap-2">
              <BrainCircuit className="w-3.5 h-3.5 text-sky-400" /> Live AI Stream Inspector
            </div>

            {/* Real-time Speaker Transcript Feed */}
            <div className="space-y-2.5">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Real-time Speaker Feed</div>
              
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {liveTranscript.map((t, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-[9.5px]">
                      <span className="text-violet-400 font-bold">{t.speaker}</span>
                      <span className="text-slate-500">{t.time}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-300 font-sans leading-relaxed">
                      {t.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Instant Decision Summary Counter */}
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-2 font-mono text-[10px]">
            <div className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Pipeline Stats
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Action Items:</span>
              <span className="text-amber-400 font-bold">4 Detected</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Speakers:</span>
              <span className="text-sky-400 font-bold">2 Identified</span>
            </div>
          </div>
        </aside>

      </div>

      {/* ── 5. BOTTOM PROFESSIONAL TRANSPORT BAR (DAW Controls) ──────────────── */}
      <footer className="h-16 bg-[#08090d] border-t border-slate-800/90 px-6 flex items-center justify-between shrink-0 font-mono">
        
        {/* Left Status Text */}
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${
            recordingState === 'recording' ? 'bg-rose-500 animate-ping' : recordingState === 'paused' ? 'bg-amber-400' : 'bg-slate-600'
          }`} />
          <span className="text-xs text-slate-300 font-bold uppercase">
            STATUS: {recordingState.toUpperCase()}
          </span>
        </div>

        {/* Center DAW Master Transport Controls */}
        <div className="flex items-center gap-3">
          {recordingState === 'idle' && (
            <button
              onClick={startRecording}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 group"
            >
              <Mic className="w-4 h-4 fill-white transition-transform group-hover:scale-110" />
              START RECORDING
            </button>
          )}

          {recordingState === 'recording' && (
            <>
              <button
                onClick={pauseRecording}
                className="px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Pause className="w-4 h-4" /> PAUSE
              </button>
              
              <button
                onClick={stopRecording}
                className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Square className="w-4 h-4 fill-slate-200" /> STOP
              </button>
            </>
          )}

          {recordingState === 'paused' && (
            <>
              <button
                onClick={resumeRecording}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-white" /> RESUME
              </button>

              <button
                onClick={stopRecording}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Square className="w-4 h-4 fill-slate-200" /> STOP
              </button>
            </>
          )}
        </div>

        {/* Right Timer Badge */}
        <div className="text-xs text-slate-400 font-mono">
          SAMVAD AUDIO ENGINE v2.0
        </div>
      </footer>

    </div>
  );
};
