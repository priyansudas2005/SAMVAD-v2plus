import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Radio, 
  Sliders, 
  Trash2, 
  Download, 
  BrainCircuit, 
  ShieldCheck, 
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Volume2,
  Layers,
  Activity
} from 'lucide-react';

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
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [scrollOffset, setScrollOffset] = useState<number>(0);

  // Canvas refs for Stereo Channels (Left & Right)
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic Audio Buffer points for left & right channels
  const audioHistoryLeft = useRef<number[]>([]);
  const audioHistoryRight = useRef<number[]>([]);

  // Live Transcript Stream
  const [liveTranscript, setLiveTranscript] = useState<{ speaker: string; text: string; time: string }[]>([
    { speaker: 'Speaker 1 (Host)', text: 'Initiating stereo DAW recording pipeline...', time: '00:01' }
  ]);

  useEffect(() => {
    let interval: any;
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        setLiveTranscript(prev => [
          ...prev.slice(-5),
          { speaker: 'Speaker 1 (Host)', text: `Captured stereo frame at ${timeStr} with CUDA acceleration.`, time: timeStr }
        ]);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [recordingState, duration]);

  // Append Live Waveform Buffer Points when recording
  useEffect(() => {
    let interval: any;
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        // Generate stereo amplitudes (0.1 to 0.95)
        const leftVal = Math.random() * 0.7 + 0.15;
        const rightVal = Math.random() * 0.65 + 0.1;

        audioHistoryLeft.current.push(leftVal);
        audioHistoryRight.current.push(rightVal);

        // Limit history to 600 points for smooth scrolling
        if (audioHistoryLeft.current.length > 600) {
          audioHistoryLeft.current.shift();
          audioHistoryRight.current.shift();
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [recordingState]);

  // Reset buffers if discarded
  useEffect(() => {
    if (recordingState === 'idle') {
      audioHistoryLeft.current = [];
      audioHistoryRight.current = [];
    }
  }, [recordingState]);

  // Render Dual Stereo Waveform (Left + Right Channels + Ruler + Vertical Playhead + dB Scale)
  useEffect(() => {
    const renderChannel = (
      canvas: HTMLCanvasElement | null, 
      buffer: number[], 
      colorHex: string, 
      label: string
    ) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background Grid Lines & dB Scale Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;

      // Vertical Time Grid Lines (Every 50px)
      for (let x = 0; x < width; x += 50 * zoomLevel) {
        ctx.beginPath();
        ctx.moveTo(x - scrollOffset, 0);
        ctx.lineTo(x - scrollOffset, height);
        ctx.stroke();
      }

      // Horizontal dB Reference Lines (+6dB, 0dB, -6dB, -12dB)
      const dbLevels = [0.15, 0.35, 0.5, 0.65, 0.85];
      dbLevels.forEach(lvl => {
        ctx.beginPath();
        ctx.moveTo(0, height * lvl);
        ctx.lineTo(width, height * lvl);
        ctx.stroke();
      });

      // Channel Baseline Center Line
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw Growing Stereo Waveform Bars
      const step = 4 * zoomLevel;
      const data = buffer;
      const totalPoints = data.length;

      ctx.fillStyle = colorHex;

      for (let i = 0; i < totalPoints; i++) {
        const x = i * step - scrollOffset;
        if (x < 0 || x > width) continue;

        const val = data[i];
        const barHeight = val * (height * 0.85);
        const yTop = (height - barHeight) / 2;

        ctx.fillRect(x, yTop, step - 1, barHeight);
      }

      // Draw Vertical Playhead / Recording Cursor at current end point
      const currentX = totalPoints * step - scrollOffset;
      if (currentX >= 0 && currentX <= width) {
        // Red Recording Playhead Line
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, height);
        ctx.stroke();

        // Cursor Top Diamond Marker
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.moveTo(currentX - 5, 0);
        ctx.lineTo(currentX + 5, 0);
        ctx.lineTo(currentX, 8);
        ctx.closePath();
        ctx.fill();
      }
    };

    let animId: number;
    const animate = () => {
      renderChannel(leftCanvasRef.current, audioHistoryLeft.current, '#8B5CF6', 'L');
      renderChannel(rightCanvasRef.current, audioHistoryRight.current, '#38BDF8', 'R');
      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, [zoomLevel, scrollOffset, recordingState]);

  const formatHMS = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-screen w-full bg-[#030407] text-slate-100 font-sans select-none overflow-hidden border-t border-slate-900/60">
      
      {/* ── 1. TOP TOOLBAR (Studio Bar) ─────────────────────────────────────── */}
      <header className="h-12 bg-[#08090d] border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 font-mono text-xs z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-violet-600/10 border border-violet-500/20 text-violet-300 font-bold text-[10.5px]">
            <Radio className="w-3.5 h-3.5 text-violet-400" /> DAW MASTER WORKSPACE
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Session Recording..."
            className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-sans w-64 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Zoom & Scroll Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Zoom Out Waveform"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] px-1 font-mono text-slate-300">{(zoomLevel * 100).toFixed(0)}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Zoom In Waveform"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

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
        </div>
      </header>

      {/* ── MAIN WORKSPACE GRID ─────────────────────────────────────────────── */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        
        {/* ── 2. LEFT RECORDING INSPECTOR (18% Width) ────────────────────────── */}
        <aside className="w-60 bg-[#06070a] border-r border-slate-800/80 p-3.5 flex flex-col justify-between shrink-0 space-y-4 font-mono text-xs overflow-y-auto">
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-violet-400" /> Audio Inspector
            </div>

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
                      captureSource === src.id ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
            </div>

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
          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-lg space-y-1 text-[10px] text-slate-400">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% OFFLINE CUDA
            </div>
            <div>Latency: &lt; 180ms</div>
          </div>
        </aside>

        {/* ── 3. LARGE CENTRAL RECORDING WORKSPACE (DOMINANT 65% WIDTH) ───────── */}
        <main className="flex-1 bg-[#020305] flex flex-col justify-between p-4 relative overflow-hidden min-w-0 border-r border-slate-800/80">
          
          {/* Timeline Ruler Bar (Top of Waveform) */}
          <div className="h-7 bg-[#08090e] border border-slate-800 rounded-t-xl px-4 flex items-center justify-between text-[9.5px] font-mono text-slate-400 shrink-0 select-none">
            <span>00:00</span>
            <span>00:15</span>
            <span>00:30</span>
            <span>00:45</span>
            <span>01:00</span>
            <span>01:15</span>
            <span>01:30</span>
            <span className="text-emerald-400 font-bold">TIMECODE: {formatHMS(duration)}</span>
          </div>

          {/* DUAL STEREO CHANNEL CANVAS WORKSPACE (LEFT & RIGHT CHANNELS) */}
          <div className="flex-1 bg-[#010204] border-x border-b border-slate-800 rounded-b-xl flex flex-col relative overflow-hidden my-1">
            
            {/* Left Audio Channel (Violet Wave) */}
            <div className="flex-1 border-b border-slate-800/80 relative flex items-center">
              <div className="absolute left-2 top-2 z-10 flex items-center gap-2 px-2 py-0.5 rounded bg-violet-600/20 border border-violet-500/30 text-violet-300 font-mono text-[9px] font-bold">
                LEFT CHANNEL (MIC 1)
              </div>
              
              {/* dB Scale Legend (Left Side) */}
              <div className="absolute left-1 inset-y-0 flex flex-col justify-between py-2 text-[8px] font-mono text-slate-500 z-10 pointer-events-none">
                <span>+6dB</span>
                <span>0dB</span>
                <span>-6dB</span>
                <span>-12dB</span>
              </div>

              {/* Left Channel Canvas */}
              <canvas
                ref={leftCanvasRef}
                width={1000}
                height={200}
                className="w-full h-full object-cover"
              />

              {/* Side Level Meter (Left Channel) */}
              <div className="w-3 h-full border-l border-slate-800/80 bg-slate-950 p-0.5 flex flex-col justify-end shrink-0">
                <div 
                  className="w-full bg-gradient-to-t from-emerald-500 via-sky-400 to-violet-500 rounded-xs transition-all duration-75"
                  style={{ height: recordingState === 'recording' ? `${Math.random() * 60 + 20}%` : '0%' }}
                />
              </div>
            </div>

            {/* Right Audio Channel (Cyan Wave) */}
            <div className="flex-1 relative flex items-center">
              <div className="absolute left-2 top-2 z-10 flex items-center gap-2 px-2 py-0.5 rounded bg-sky-600/20 border border-sky-500/30 text-sky-300 font-mono text-[9px] font-bold">
                RIGHT CHANNEL (SYSTEM MIX)
              </div>

              {/* dB Scale Legend (Right Side) */}
              <div className="absolute left-1 inset-y-0 flex flex-col justify-between py-2 text-[8px] font-mono text-slate-500 z-10 pointer-events-none">
                <span>+6dB</span>
                <span>0dB</span>
                <span>-6dB</span>
                <span>-12dB</span>
              </div>

              {/* Right Channel Canvas */}
              <canvas
                ref={rightCanvasRef}
                width={1000}
                height={200}
                className="w-full h-full object-cover"
              />

              {/* Side Level Meter (Right Channel) */}
              <div className="w-3 h-full border-l border-slate-800/80 bg-slate-950 p-0.5 flex flex-col justify-end shrink-0">
                <div 
                  className="w-full bg-gradient-to-t from-emerald-500 via-sky-400 to-rose-500 rounded-xs transition-all duration-75"
                  style={{ height: recordingState === 'recording' ? `${Math.random() * 55 + 15}%` : '0%' }}
                />
              </div>
            </div>

          </div>

          {/* Master Transport & Time Display */}
          <div className="h-10 bg-[#08090e] border border-slate-800 rounded-xl px-4 flex items-center justify-between font-mono text-xs shrink-0">
            <div className="flex items-center gap-2 text-[10.5px]">
              <span className="text-slate-400">STATUS:</span>
              <span className={`font-bold ${recordingState === 'recording' ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {recordingState.toUpperCase()}
              </span>
            </div>

            <div className="text-[11px] text-slate-300 font-bold">
              LIVE DURATION: <span className="text-emerald-400 font-extrabold">{formatHMS(duration)}</span>
            </div>
          </div>

        </main>

        {/* ── 4. RIGHT LIVE INTELLIGENCE PANEL (17% Width) ────────────────────── */}
        <aside className="w-64 bg-[#06070a] p-3.5 flex flex-col justify-between shrink-0 space-y-4 font-mono text-xs overflow-y-auto">
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2 flex items-center gap-2">
              <BrainCircuit className="w-3.5 h-3.5 text-sky-400" /> Live AI Stream Feed
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
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

          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-1.5 font-mono text-[10px]">
            <div className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Insights
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Speakers:</span>
              <span className="text-sky-400 font-bold">2 Diarized</span>
            </div>
          </div>
        </aside>

      </div>

      {/* ── 5. BOTTOM TRANSPORT BAR (DAW Master Transport Controls) ─────────────── */}
      <footer className="h-16 bg-[#06070a] border-t border-slate-800/90 px-6 flex items-center justify-between shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${
            recordingState === 'recording' ? 'bg-rose-500 animate-ping' : recordingState === 'paused' ? 'bg-amber-400' : 'bg-slate-600'
          }`} />
          <span className="text-xs text-slate-300 font-bold uppercase">
            MASTER PLAYHEAD: {formatHMS(duration)}
          </span>
        </div>

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

        <div className="text-xs text-slate-400 font-mono">
          SAMVAD DAW AUDIO ENGINE v2.0
        </div>
      </footer>

    </div>
  );
};
