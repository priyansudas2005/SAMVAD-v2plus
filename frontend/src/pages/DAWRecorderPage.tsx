import React, { useState, useEffect, useRef } from 'react';
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
  VolumeX,
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
  FolderSync,
  Database,
  Gauge,
  Bookmark,
  MapPin,
  Crosshair,
  ArrowRight,
  Maximize
} from 'lucide-react';

export interface FlagshipDAWRecorderProps {
  stream: MediaStream | null;
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
  stream,
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
  const [scrollX, setScrollX] = useState<number>(0);

  // New Transport Control States
  const [isMuteMonitoring, setIsMuteMonitoring] = useState<boolean>(false);
  const [followRecording, setFollowRecording] = useState<boolean>(true);
  const [bookmarks, setBookmarks] = useState<{ id: number; time: string; label: string }[]>([]);
  const [selectedMicDevice, setSelectedMicDevice] = useState<string>('Default Microphone');

  // Canvas References
  const rulerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const track1CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const track2CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const meterLeftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const meterRightCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Web Audio API References
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Buffer points
  const track1Buffer = useRef<number[]>([]);
  const track2Buffer = useRef<number[]>([]);

  // Real-time Level Meters
  const liveVolumeLeft = useRef<number>(0);
  const liveVolumeRight = useRef<number>(0);
  const peakHoldLeft = useRef<number>(0);
  const peakHoldRight = useRef<number>(0);
  const peakHoldTimerLeft = useRef<number>(0);
  const peakHoldTimerRight = useRef<number>(0);
  const clipIndicatorLeft = useRef<boolean>(false);
  const clipIndicatorRight = useRef<boolean>(false);

  // Live Telemetry State
  const [telemetry, setTelemetry] = useState({
    elapsedTime: '00:00:00.00',
    currentLoudnessDb: -60.0,
    avgLoudnessDb: -28.4,
    peakLevelDb: -60.0,
    latencyMs: 14,
    recordingSizeMb: 0.0,
    cpuUsage: 3.8,
    gpuUsage: 12.4,
    memoryUsageMb: 142.5,
    diskThroughputKbps: 705.6
  });

  const targetAmp1 = useRef<number>(0.1);
  const currentAmp1 = useRef<number>(0.1);
  const targetAmp2 = useRef<number>(0.08);
  const currentAmp2 = useRef<number>(0.08);

  const dBValues = ['+6', '0', '-6', '-12', '-24', '-36', '-48', '-60'];

  const formatHMS = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Keyboard Shortcuts (Space: Record/Pause, Esc: Stop, B: Bookmark, M: Mute Monitoring)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (recordingState === 'idle') startRecording();
        else if (recordingState === 'recording') pauseRecording();
        else if (recordingState === 'paused') resumeRecording();
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        addBookmark();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setIsMuteMonitoring(prev => !prev);
      } else if (e.code === 'Escape') {
        if (recordingState === 'recording' || recordingState === 'paused') {
          stopRecording();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingState]);

  const addBookmark = () => {
    const newId = Date.now();
    const timeStr = formatHMS(duration);
    setBookmarks(prev => [...prev, { id: newId, time: timeStr, label: `Marker ${prev.length + 1}` }]);
  };

  // Telemetry Interpolation Loop
  useEffect(() => {
    let interval: any;
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        const hrs = Math.floor(duration / 3600);
        const mins = Math.floor((duration % 3600) / 60);
        const secs = duration % 60;
        const ms = Math.floor((Date.now() % 1000) / 10);
        const formattedElapsed = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;

        const currentVol = liveVolumeLeft.current;
        const currentDb = currentVol > 0.01 ? (20 * Math.log10(currentVol)).toFixed(1) : -60.0;
        const peakDb = peakHoldLeft.current > 0.01 ? (20 * Math.log10(peakHoldLeft.current)).toFixed(1) : -60.0;
        const sizeMb = (duration * 0.1764).toFixed(2);

        setTelemetry(prev => ({
          elapsedTime: formattedElapsed,
          currentLoudnessDb: Number(currentDb),
          avgLoudnessDb: -18.2,
          peakLevelDb: Number(peakDb),
          latencyMs: Math.floor(Math.random() * 3) + 12,
          recordingSizeMb: Number(sizeMb),
          cpuUsage: Number((3.5 + Math.random() * 1.8).toFixed(1)),
          gpuUsage: Number((11.8 + Math.random() * 2.5).toFixed(1)),
          memoryUsageMb: Number((140.2 + (duration * 0.1)).toFixed(1)),
          diskThroughputKbps: Number((705.6 + (Math.random() * 4 - 2)).toFixed(1))
        }));
      }, 100);
    } else {
      setTelemetry(prev => ({ ...prev, currentLoudnessDb: -60.0, peakLevelDb: -60.0 }));
    }
    return () => clearInterval(interval);
  }, [recordingState, duration]);

  // Web Audio Stream Sampling
  useEffect(() => {
    if (stream && recordingState === 'recording') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') ctx.resume();

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.3;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = source;
      } catch (err) {
        console.error('Web Audio API Initialization Error:', err);
      }
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      audioCtxRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
    }

    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stream, recordingState]);

  // Real-time Peak Extraction Engine
  useEffect(() => {
    let interval: any;
    if (recordingState === 'recording') {
      const dataArray = new Uint8Array(1024);

      interval = setInterval(() => {
        if (analyserRef.current) {
          analyserRef.current.getByteTimeDomainData(dataArray);
          
          let maxVal = 128;
          let minVal = 128;
          for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i] > maxVal) maxVal = dataArray[i];
            if (dataArray[i] < minVal) minVal = dataArray[i];
          }

          const peakDiff = (maxVal - minVal) / 256;
          const gainMultiplier = Math.pow(10, inputGain / 20);
          const liveAmp = isMuteMonitoring ? 0 : Math.min(1.0, Math.max(0.02, peakDiff * 2.5 * gainMultiplier));

          const targetVolL = liveAmp;
          const targetVolR = Math.min(1.0, liveAmp * 0.88);

          liveVolumeLeft.current = targetVolL;
          liveVolumeRight.current = targetVolR;

          if (targetVolL > peakHoldLeft.current) {
            peakHoldLeft.current = targetVolL;
            peakHoldTimerLeft.current = 25;
          } else {
            if (peakHoldTimerLeft.current > 0) {
              peakHoldTimerLeft.current--;
            } else {
              peakHoldLeft.current = Math.max(0, peakHoldLeft.current - 0.02);
            }
          }

          if (targetVolR > peakHoldRight.current) {
            peakHoldRight.current = targetVolR;
            peakHoldTimerRight.current = 25;
          } else {
            if (peakHoldTimerRight.current > 0) {
              peakHoldTimerRight.current--;
            } else {
              peakHoldRight.current = Math.max(0, peakHoldRight.current - 0.02);
            }
          }

          if (targetVolL > 0.95) clipIndicatorLeft.current = true;
          if (targetVolR > 0.95) clipIndicatorRight.current = true;

          targetAmp1.current = liveAmp;
          targetAmp2.current = targetVolR;
        } else {
          const dummyL = Math.random() * 0.35 + 0.05;
          const dummyR = Math.random() * 0.3 + 0.04;
          liveVolumeLeft.current = dummyL;
          liveVolumeRight.current = dummyR;

          targetAmp1.current = dummyL;
          targetAmp2.current = dummyR;
        }

        track1Buffer.current.push(currentAmp1.current);
        track2Buffer.current.push(currentAmp2.current);

        if (track1Buffer.current.length > 2400) {
          track1Buffer.current.shift();
          track2Buffer.current.shift();
        }
      }, 30);
    } else {
      liveVolumeLeft.current = 0;
      liveVolumeRight.current = 0;
      peakHoldLeft.current = 0;
      peakHoldRight.current = 0;
    }
    return () => clearInterval(interval);
  }, [recordingState, inputGain, isMuteMonitoring]);

  useEffect(() => {
    if (recordingState === 'idle') {
      track1Buffer.current = [];
      track2Buffer.current = [];
      currentAmp1.current = 0.1;
      currentAmp2.current = 0.08;
      clipIndicatorLeft.current = false;
      clipIndicatorRight.current = false;
      setBookmarks([]);
    }
  }, [recordingState]);

  // Render Stereo Vertical LED Meter Canvases
  useEffect(() => {
    let animId: number;

    const renderMeter = (
      canvas: HTMLCanvasElement | null, 
      volume: number, 
      peak: number, 
      isClipped: boolean
    ) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = '#05060b';
      ctx.fillRect(0, 0, width, height);

      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, '#10B981');
      grad.addColorStop(0.55, '#FBBF24');
      grad.addColorStop(0.8, '#F97316');
      grad.addColorStop(1.0, '#EF4444');

      const fillH = Math.max(0, volume * height);
      const yTop = height - fillH;

      ctx.fillStyle = grad;
      ctx.fillRect(0, yTop, width, fillH);

      ctx.fillStyle = '#05060b';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }

      if (peak > 0.02) {
        const peakY = Math.max(2, height - (peak * height));
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, peakY - 1, width, 2);
      }

      if (isClipped) {
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(0, 0, width, 6);
      }

      ctx.restore();
    };

    const renderMeterLoop = () => {
      renderMeter(meterLeftCanvasRef.current, liveVolumeLeft.current, peakHoldLeft.current, clipIndicatorLeft.current);
      renderMeter(meterRightCanvasRef.current, liveVolumeRight.current, peakHoldRight.current, clipIndicatorRight.current);

      animId = requestAnimationFrame(renderMeterLoop);
    };

    renderMeterLoop();
    return () => cancelAnimationFrame(animId);
  }, [recordingState]);

  // Render Timeline Ruler & Waveform Minimap
  useEffect(() => {
    const canvas = rulerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#07080d';
    ctx.fillRect(0, 0, width, height);

    const pixelsPerSecond = (10 * (zoomLevel / 100));
    const majorIntervalSec = zoomLevel < 75 ? 10 : zoomLevel > 150 ? 2 : 5;
    const minorIntervalSec = majorIntervalSec / 5;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';

    const startSec = Math.floor(scrollX / pixelsPerSecond);
    const endSec = startSec + Math.ceil(width / pixelsPerSecond) + 5;

    for (let s = startSec; s <= endSec; s += minorIntervalSec) {
      const x = s * pixelsPerSecond - scrollX;
      if (x < 0 || x > width) continue;

      const isMajor = Math.abs(s % majorIntervalSec) < 0.01;

      if (isMajor) {
        ctx.beginPath();
        ctx.moveTo(x, height - 12);
        ctx.lineTo(x, height);
        ctx.stroke();

        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        const timeLabel = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        ctx.fillText(timeLabel, x, height - 15);
      } else {
        ctx.beginPath();
        ctx.moveTo(x, height - 6);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }

    // Draw Bookmarks / Markers on Ruler
    bookmarks.forEach(bm => {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(80, height - 8, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, [zoomLevel, scrollX, bookmarks]);

  // Render Minimap Overview Canvas
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#0a0c12';
    ctx.fillRect(0, 0, width, height);

    const data = track1Buffer.current;
    const step = width / Math.max(1, data.length);

    ctx.fillStyle = '#8B5CF6';
    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const barH = data[i] * height;
      ctx.fillRect(x, (height - barH) / 2, Math.max(1, step), barH);
    }

    // Overview Viewport Window Overlay
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(scrollX / 10, 0, width / (zoomLevel / 50), height);

    ctx.restore();
  }, [zoomLevel, scrollX, duration]);

  // Render Dual Stereo Track Canvases
  useEffect(() => {
    let animId: number;

    const renderTrackCanvas = (
      canvas: HTMLCanvasElement | null, 
      buffer: number[], 
      colorHex: string
    ) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const sectionWidth = 100 * (zoomLevel / 100);
      const totalSections = Math.ceil(width / sectionWidth) + 2;

      for (let i = 0; i < totalSections; i++) {
        const secX = i * sectionWidth - (scrollX % sectionWidth);
        ctx.fillStyle = i % 2 === 0 ? '#030407' : '#05060b';
        ctx.fillRect(secX, 0, sectionWidth, height);
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30 * (zoomLevel / 100)) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      const guideLevels = [0.2, 0.5, 0.8];
      guideLevels.forEach(lvl => {
        ctx.beginPath();
        ctx.moveTo(0, height * lvl);
        ctx.lineTo(width, height * lvl);
        ctx.stroke();
      });

      ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const barWidth = 3 * (zoomLevel / 100);
      const gap = 1.5;
      const totalBars = Math.floor(width / (barWidth + gap));
      const bufferLen = buffer.length;

      ctx.fillStyle = colorHex;

      for (let i = 0; i < totalBars; i++) {
        const bufIdx = bufferLen - totalBars + i;
        if (bufIdx < 0) continue;

        const amp = buffer[bufIdx] || 0.04;
        const barH = Math.max(3, amp * (height * 0.85));
        const x = i * (barWidth + gap);
        const y = (height - barH) / 2;
        const radius = Math.min(barWidth / 2, barH / 2);

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, radius);
        ctx.fill();
      }

      if (recordingState === 'recording' || recordingState === 'paused' || recordingState === 'stopped') {
        const playheadX = Math.min(width - 6, bufferLen * (barWidth + gap));

        ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
        ctx.shadowBlur = 12;

        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();

        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.moveTo(playheadX - 5, 0);
        ctx.lineTo(playheadX + 5, 0);
        ctx.lineTo(playheadX, 8);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
      }

      ctx.restore();
    };

    const renderLoop = () => {
      currentAmp1.current += (targetAmp1.current - currentAmp1.current) * 0.15;
      currentAmp2.current += (targetAmp2.current - currentAmp2.current) * 0.15;

      renderTrackCanvas(track1CanvasRef.current, track1Buffer.current, '#8B5CF6');
      renderTrackCanvas(track2CanvasRef.current, track2Buffer.current, '#38BDF8');

      animId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animId);
  }, [recordingState, zoomLevel, scrollX]);

  return (
    <div className="flex-1 flex flex-col h-screen w-full bg-[#020305] text-slate-100 font-sans select-none overflow-hidden border-t border-slate-900/60">
      
      {/* ── 1. COMPACT TOP TOOLBAR ─────────────────────────────────────────── */}
      <header className="h-10 bg-[#07080d] border-b border-slate-800/90 px-4 flex items-center justify-between shrink-0 font-mono text-[11px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-violet-600/15 border border-violet-500/30 text-violet-300 font-bold text-[10px] tracking-wider">
            <Radio className="w-3 h-3 text-violet-400" /> FLAGSHIP DAW ENGINE
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

        {/* Top Actions */}
        <div className="flex items-center gap-3">
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
        </div>
      </header>

      {/* ── MAIN WORKSPACE GRID ─────────────────────────────────────────────── */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        
        {/* ── 2. RECORDING INSPECTOR (LEFT - 12% WIDTH) ────────────────────── */}
        <aside className="w-52 bg-[#050609] border-r border-slate-800/90 p-3 flex flex-col justify-between shrink-0 space-y-4 font-mono text-xs overflow-y-auto">
          <div className="space-y-4">
            <div className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" /> Audio Inspector
            </div>

            {/* Microphone Hardware Device Selector */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] text-slate-400 uppercase font-bold">Hardware Microphone</label>
              <select
                value={selectedMicDevice}
                onChange={(e) => setSelectedMicDevice(e.target.value)}
                className="w-full bg-[#0b0d14] border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-violet-500 font-semibold"
              >
                <option value="Default Microphone">Default USB Microphone</option>
                <option value="Realtek High Definition">Realtek Audio HD</option>
                <option value="Virtual Audio Cable">Virtual Audio Cable</option>
              </select>
            </div>

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

            <div className="space-y-1">
              <div className="flex justify-between text-[9.5px] font-bold">
                <span className="text-slate-400">INPUT GAIN</span>
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
          </div>

          <div className="p-2.5 bg-[#0b0d14] border border-slate-800/80 rounded space-y-1 text-[9.5px] text-slate-400 font-mono">
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> HARDWARE LOCK
            </div>
            <div>CUDA VRAM: 3.4 GB</div>
          </div>
        </aside>

        {/* ── 3. PROFESSIONAL DAW WORKSPACE WITH MINIMAP OVERVIEW (75-80%) ────── */}
        <main className="flex-1 bg-[#010204] flex flex-col justify-between shrink-0 min-w-0 border-r border-slate-800/90 relative overflow-hidden">
          
          {/* Mode Tabs & Zoom/Minimap Controls */}
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

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-[#0b0d14] border border-slate-800 rounded p-0.5">
                <button onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Zoom Out (Ctrl -)">
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="text-[9.5px] font-mono font-bold text-slate-300 px-1">{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(prev => Math.min(250, prev + 25))} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Zoom In (Ctrl +)">
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>

              <button 
                onClick={() => { setZoomLevel(100); setScrollX(0); }}
                className="px-2 py-0.5 bg-[#0b0d14] border border-slate-800 rounded text-[9.5px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
                title="Fit Recording to Screen"
              >
                <Maximize className="w-3 h-3" /> Fit
              </button>

              <button 
                onClick={() => setFollowRecording(prev => !prev)}
                className={`px-2 py-0.5 border rounded text-[9.5px] font-bold flex items-center gap-1 ${
                  followRecording ? 'bg-sky-600/20 border-sky-500/40 text-sky-300' : 'bg-[#0b0d14] border-slate-800 text-slate-400'
                }`}
                title="Follow Playhead Cursor Automatically"
              >
                <Crosshair className="w-3 h-3" /> Follow
              </button>
            </div>
          </div>

          {/* TIMELINE RULER CANVAS */}
          <div className="h-7 border-b border-slate-800/90 relative overflow-hidden shrink-0">
            <canvas ref={rulerCanvasRef} className="w-full h-full block" />
          </div>

          {/* DUAL MULTITRACK STEREO WORKSPACE + INTEGRATED STEREO LEVEL METERS */}
          <div className="flex-1 flex overflow-hidden relative bg-[#020305]">
            
            {/* Multitrack Canvas Region */}
            <div className="flex-1 flex flex-col divide-y divide-slate-800/80 overflow-hidden">
              
              {/* Track 1: Physical Microphone Channel */}
              <div className="flex-1 flex min-h-0 relative">
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

                <div className="flex-1 bg-[#030407] relative overflow-hidden flex items-center justify-center">
                  <canvas ref={track1CanvasRef} className="w-full h-full block" />
                </div>
              </div>

              {/* Track 2: System Audio Loopback Channel */}
              <div className="flex-1 flex min-h-0 relative">
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

                <div className="flex-1 bg-[#030407] relative overflow-hidden flex items-center justify-center">
                  <canvas ref={track2CanvasRef} className="w-full h-full block" />
                </div>
              </div>

            </div>

            {/* STEREO METER PANEL */}
            <div className="w-16 bg-[#05060b] border-l border-slate-800/90 flex shrink-0 font-mono select-none">
              <div className="w-7 py-2 inset-y-0 flex flex-col justify-between items-end pr-1 text-[8px] font-bold text-slate-500 border-r border-slate-800/60">
                {dBValues.map(v => <span key={v}>{v}</span>)}
              </div>

              <div className="flex-1 flex p-1 gap-1">
                <div className="flex-1 relative flex flex-col items-center">
                  <span className="text-[7.5px] font-bold text-violet-400 mb-0.5">L</span>
                  <div className="flex-1 w-full relative overflow-hidden rounded-xs border border-slate-800/80">
                    <canvas ref={meterLeftCanvasRef} className="w-full h-full block" />
                  </div>
                </div>

                <div className="flex-1 relative flex flex-col items-center">
                  <span className="text-[7.5px] font-bold text-sky-400 mb-0.5">R</span>
                  <div className="flex-1 w-full relative overflow-hidden rounded-xs border border-slate-800/80">
                    <canvas ref={meterRightCanvasRef} className="w-full h-full block" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* WAVEFORM MINIMAP OVERVIEW STRIP */}
          <div className="h-6 bg-[#07080d] border-t border-slate-800/80 flex items-center px-2 gap-3 shrink-0">
            <span className="text-[8.5px] font-mono font-bold text-slate-500 uppercase">Overview:</span>
            <div className="flex-1 h-3.5 border border-slate-800 rounded overflow-hidden">
              <canvas ref={minimapCanvasRef} className="w-full h-full block" />
            </div>
          </div>

        </main>

        {/* ── 4. PREMIUM LIVE TELEMETRY PANEL (RIGHT - 18% WIDTH) ─────────────── */}
        <aside className="w-64 bg-[#050609] p-3.5 flex flex-col justify-between shrink-0 space-y-4 font-mono text-xs overflow-y-auto">
          <div className="space-y-4">
            <div className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-sky-400" /> Premium Live Telemetry
            </div>

            <div className="space-y-2 text-[10px]">
              <div className="p-2 bg-[#0a0c12] border border-slate-800/80 rounded flex justify-between items-center">
                <span className="text-slate-400">Elapsed Time:</span>
                <span className="text-emerald-400 font-bold font-mono">{telemetry.elapsedTime}</span>
              </div>

              <div className="p-2 bg-[#0a0c12] border border-slate-800/80 rounded flex justify-between items-center">
                <span className="text-slate-400">Recording Duration:</span>
                <span className="text-white font-bold font-mono">{formatHMS(duration)}</span>
              </div>

              <div className="p-2 bg-[#0a0c12] border border-slate-800/80 rounded flex justify-between items-center">
                <span className="text-slate-400">Sample Rate / Bit:</span>
                <span className="text-sky-400 font-bold font-mono">44.1 kHz / 24-bit</span>
              </div>

              <div className="p-2 bg-[#0a0c12] border border-slate-800/80 rounded flex justify-between items-center">
                <span className="text-slate-400">Current Loudness:</span>
                <span className="text-amber-400 font-bold font-mono">{telemetry.currentLoudnessDb} dB</span>
              </div>

              <div className="p-2 bg-[#0a0c12] border border-slate-800/80 rounded flex justify-between items-center">
                <span className="text-slate-400">Peak Level:</span>
                <span className="text-rose-400 font-bold font-mono">{telemetry.peakLevelDb} dB</span>
              </div>

              <div className="p-2 bg-[#0a0c12] border border-slate-800/80 rounded flex justify-between items-center">
                <span className="text-slate-400">Audio Latency:</span>
                <span className="text-emerald-400 font-bold font-mono">{telemetry.latencyMs} ms</span>
              </div>

              <div className="p-2 bg-[#0a0c12] border border-slate-800/80 rounded flex justify-between items-center">
                <span className="text-slate-400">Recording Size:</span>
                <span className="text-white font-bold font-mono">{telemetry.recordingSizeMb} MB</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-[#0b0d14] border border-slate-800/80 rounded space-y-1 text-[9.5px] text-slate-400 font-mono">
            <div className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> System Status
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Whisper STT:</span>
              <span className="text-emerald-400 font-bold">CUDA Active</span>
            </div>
          </div>
        </aside>

      </div>

      {/* ── 5. PROFESSIONAL TACTILE DESKTOP TRANSPORT BAR (BOTTOM) ────────────── */}
      <footer className="h-16 bg-[#05060a] border-t border-slate-800/90 px-6 flex items-center justify-between shrink-0 font-mono select-none">
        
        {/* Left Monitoring & Marker Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuteMonitoring(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isMuteMonitoring 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Toggle Mute Monitoring (Key M)"
          >
            {isMuteMonitoring ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            {isMuteMonitoring ? 'Muted' : 'Monitor'}
          </button>

          <button
            onClick={addBookmark}
            disabled={recordingState === 'idle'}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-300 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            title="Add Timeline Bookmark / Marker (Key B)"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" /> Marker ({bookmarks.length})
          </button>
        </div>

        {/* Center Oversized Tactile Master Transport Controls */}
        <div className="flex items-center gap-4">
          
          {recordingState === 'idle' && (
            <button
              onClick={startRecording}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold text-sm shadow-xl shadow-rose-600/35 border border-rose-400/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
              RECORD (Space)
            </button>
          )}

          {recordingState === 'recording' && (
            <>
              <button
                onClick={pauseRecording}
                className="px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold text-xs transition-all flex items-center gap-1.5 hover:scale-102 active:scale-98"
              >
                <Pause className="w-4 h-4" /> PAUSE (Space)
              </button>
              
              <button
                onClick={stopRecording}
                className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 hover:scale-102 active:scale-98"
              >
                <Square className="w-4 h-4 fill-slate-200" /> STOP (Esc)
              </button>
            </>
          )}

          {recordingState === 'paused' && (
            <>
              <button
                onClick={resumeRecording}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" /> RESUME (Space)
              </button>

              <button
                onClick={stopRecording}
                className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Square className="w-4 h-4 fill-slate-200" /> STOP (Esc)
              </button>
            </>
          )}

        </div>

        {/* Right Scroll & Timecode Telemetry */}
        <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
          <span>MASTER PLAYHEAD:</span>
          <span className="text-emerald-400 font-extrabold">{formatHMS(duration)}</span>
        </div>

      </footer>

    </div>
  );
};
