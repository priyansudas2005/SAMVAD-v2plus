import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Mic,
  Clock,
  AlertCircle,
  CheckCircle2,
  Radio,
  Monitor,
  Disc3,
  Power,
  Trash2,
  Activity,
  Cpu,
  Volume2,
  VolumeX,
  Bookmark,
  MapPin,
  HardDrive,
  Gauge,
  Sparkles,
  Keyboard,
  AudioLines,
  Waves,
  Zap,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Settings2,
  SlidersHorizontal,
  Database,
  FileText,
  PenLine,
  Square,
  Folders,
  Cpu as CpuIcon,
  MemoryStick,
  MonitorDot,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RecorderPageProps {
  stream: MediaStream | null;
  recordingState: 'idle' | 'recording' | 'paused' | 'stopped';
  duration: number;
  title: string;
  setTitle: (t: string) => void;
  recordingError: string | null;
  uploading: boolean;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  discardRecording: () => void;
  saveRecording: () => void;
  captureSource: 'mic' | 'system' | 'both';
  setCaptureSource: (s: 'mic' | 'system' | 'both') => void;
}

// ─── VU Meter Component (Professional with dB Scale) ──────────────────────────
interface VUMeterProps {
  level: number;
  peak: number;
  label: string;
  side: 'L' | 'R';
  recordingState: 'idle' | 'recording' | 'paused' | 'stopped';
  height?: number;
}

const VUMeter: React.FC<VUMeterProps> = ({ level, peak, label, side, recordingState, height = 380 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const segmentCount = 48;
    const segH = Math.floor(H / segmentCount) - 1;
    const gap = 1;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#06070a';
    ctx.fillRect(0, 0, W, H);

    const activeSegs = Math.round(level * segmentCount);
    const peakSeg = Math.round(peak * segmentCount);

    for (let i = 0; i < segmentCount; i++) {
      const segIdx = segmentCount - 1 - i;
      const y = i * (segH + gap);

      let baseColor: string;
      if (segIdx < segmentCount * 0.60) {
        baseColor = 'rgba(16,185,129,'; // emerald green
      } else if (segIdx < segmentCount * 0.82) {
        baseColor = 'rgba(245,158,11,'; // amber
      } else {
        baseColor = 'rgba(239,68,68,';  // red
      }

      const isActive = segIdx < activeSegs;
      const isPeak = segIdx === peakSeg && recordingState === 'recording';

      if (isPeak) {
        ctx.fillStyle = segIdx >= segmentCount * 0.82 ? 'rgba(239,68,68,1)'
          : segIdx >= segmentCount * 0.60 ? 'rgba(245,158,11,1)'
          : 'rgba(16,185,129,1)';
        ctx.shadowBlur = 6;
        ctx.shadowColor = baseColor + '0.8)';
      } else if (isActive) {
        ctx.fillStyle = `${baseColor}${recordingState === 'paused' ? '0.25)' : '0.85)'}`;
        ctx.shadowBlur = isActive && segIdx > segmentCount * 0.5 ? 4 : 0;
        ctx.shadowColor = baseColor + '0.5)';
      } else {
        ctx.fillStyle = `${baseColor}0.06)`;
        ctx.shadowBlur = 0;
      }

      const radius = 1;
      ctx.beginPath();
      ctx.roundRect(0, y, W, segH, radius);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [level, peak, recordingState]);

  const db = level > 0.001 ? Math.round(20 * Math.log10(level)) : -60;

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: '16px' }}>
      <canvas
        ref={canvasRef}
        width={16}
        height={height}
        style={{ borderRadius: '2px', display: 'block' }}
      />
      <span className="text-[7px] font-mono font-bold text-slate-500">{side}</span>
      <span className="text-[7px] font-mono text-slate-600">{db > 0 ? '+' : ''}{db}</span>
    </div>
  );
};

// ─── dB Scale Column ───────────────────────────────────────────────────────────
const DbScale: React.FC<{ height: number }> = ({ height }) => {
  const marks = [0, -6, -12, -18, -24, -30, -36, -42, -48, -54, -60];
  return (
    <div className="flex flex-col justify-between text-right" style={{ height: `${height}px`, width: '22px' }}>
      {marks.map(db => (
        <span key={db} className="text-[7px] font-mono text-slate-600 leading-none">{db}</span>
      ))}
    </div>
  );
};

// ─── Audio Level Bar ───────────────────────────────────────────────────────────
interface LevelBarProps {
  label: string;
  value: string;
  pct: number;
  color?: string;
}

const LevelBar: React.FC<LevelBarProps> = ({ label, value, pct, color = '#8b5cf6' }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{label}</span>
      <span className="text-[9px] text-slate-300 font-mono font-bold">{value}</span>
    </div>
    <div className="relative w-full h-[3px] bg-slate-900 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  </div>
);

// ─── Status Chip ──────────────────────────────────────────────────────────────
interface StatusChipProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}

const StatusChip: React.FC<StatusChipProps> = ({ icon, label, value, accent = '#8b5cf6' }) => (
  <div
    className="flex flex-col gap-1.5 bg-slate-900/40 border border-slate-800/40 rounded-xl p-3"
    style={{ borderColor: `${accent}18` }}
  >
    <div className="flex items-center gap-1.5">
      <span style={{ color: accent }}>{icon}</span>
      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-sm font-extrabold font-mono text-white leading-none">{value}</span>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const RecorderPage: React.FC<RecorderPageProps> = ({
  stream,
  recordingState,
  duration,
  title,
  setTitle,
  recordingError,
  uploading,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  discardRecording,
  saveRecording,
  captureSource,
  setCaptureSource,
}) => {
  // ── Canvas Refs ──
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  // ── VU Meter state ──
  const [vuLeft, setVuLeft] = useState(0);
  const [vuRight, setVuRight] = useState(0);
  const [vuLeftPeak, setVuLeftPeak] = useState(0);
  const [vuRightPeak, setVuRightPeak] = useState(0);
  const vuLeftPeakRef = useRef(0);
  const vuRightPeakRef = useRef(0);
  const peakDecayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Audio level metrics ──
  const [currentLoudness, setCurrentLoudness] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const [noiseFloor] = useState(-72);
  const [dynamicRange, setDynamicRange] = useState(0);
  const [isSpeech, setIsSpeech] = useState(false);
  const [avgLevel, setAvgLevel] = useState(0);

  // ── UI state ──
  const [timeStr, setTimeStr] = useState('');
  const [inputGain, setInputGain] = useState(80);
  const [monitoring, setMonitoring] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [speechEnhancement, setSpeechEnhancement] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [voiceIsolation, setVoiceIsolation] = useState(false);
  const [sampleRateSelect, setSampleRateSelect] = useState('16000 Hz');
  const [bitDepthSelect, setBitDepthSelect] = useState('16-bit');
  const [formatSelect, setFormatSelect] = useState('FLAC');
  const [bookmarked, setBookmarked] = useState(false);
  const [showMarkerNotification, setShowMarkerNotification] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [markers, setMarkers] = useState<number[]>([]);
  const [audioQuality, setAudioQuality] = useState(98);
  // ── Panel collapse state ──
  const [capOpen, setCapOpen] = useState(true);
  const [dspOpen, setDspOpen] = useState(true);
  const [storeOpen, setStoreOpen] = useState(true);
  // ── Live Event Timeline ──
  interface TimelineEvent { ts: number; icon: string; label: string; color: string; }
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const addEvent = (icon: string, label: string, color: string) => {
    setEvents(prev => [{ ts: Date.now(), icon, label, color }, ...prev].slice(0, 30));
  };
  // ── System metrics ──
  const [cpuUsage, setCpuUsage] = useState(9);
  const [ramUsage, setRamUsage] = useState(38);
  const [gpuUsage, setGpuUsage] = useState(4);
  const [vramUsage, setVramUsage] = useState(18);
  const [diskSpeed, setDiskSpeed] = useState(1.8);
  const [latency, setLatency] = useState(12);
  const [fps] = useState(60);

  // ── Real-time clock ──
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // ── System metrics oscillation ──
  useEffect(() => {
    if (recordingState !== 'recording') {
      setCpuUsage(4); setGpuUsage(2); setDiskSpeed(0.1); setLatency(8); setVramUsage(18);
      return;
    }
    const id = setInterval(() => {
      setCpuUsage(Math.floor(8 + Math.random() * 6));
      setRamUsage(Math.floor(36 + Math.random() * 4));
      setGpuUsage(Math.floor(6 + Math.random() * 4));
      setVramUsage(Math.floor(16 + Math.random() * 4));
      setDiskSpeed(Number((1.2 + Math.random() * 1.2).toFixed(1)));
      setLatency(Math.floor(8 + Math.random() * 5));
      setAudioQuality(Math.floor(94 + Math.random() * 5));
    }, 2000);
    return () => clearInterval(id);
  }, [recordingState]);

  // ── Auto-log events ──
  const prevState = useRef(recordingState);
  useEffect(() => {
    if (recordingState !== prevState.current) {
      if (recordingState === 'recording' && prevState.current === 'idle') addEvent('🎙', 'Recording Started', '#a78bfa');
      if (recordingState === 'recording' && prevState.current === 'paused') addEvent('▶️', 'Recording Resumed', '#a78bfa');
      if (recordingState === 'paused') addEvent('⏸', 'Recording Paused', '#f59e0b');
      if (recordingState === 'stopped') addEvent('⏹', 'Recording Stopped', '#f43f5e');
      prevState.current = recordingState;
    }
  }, [recordingState]);
  useEffect(() => {
    if (recordingState !== 'recording') return;
    if (isSpeech) addEvent('🔊', 'Speech Detected', '#10b981');
    else addEvent('🔇', 'Silence Detected', '#64748b');
  }, [isSpeech]);

  // ── Peak hold decay ──
  useEffect(() => {
    peakDecayTimerRef.current = setInterval(() => {
      vuLeftPeakRef.current = Math.max(0, vuLeftPeakRef.current - 0.01);
      vuRightPeakRef.current = Math.max(0, vuRightPeakRef.current - 0.01);
      setVuLeftPeak(vuLeftPeakRef.current);
      setVuRightPeak(vuRightPeakRef.current);
    }, 80);
    return () => {
      if (peakDecayTimerRef.current) clearInterval(peakDecayTimerRef.current);
    };
  }, []);

  // ── Mouse reflection ──
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  // ── Keyboard Shortcuts (Section 9) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space to Toggle Pause/Resume (only if not focused on inputs)
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        if (recordingState === 'recording') pauseRecording();
        else if (recordingState === 'paused') resumeRecording();
      }
      // Ctrl + B -> Bookmark
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setBookmarked(true);
        handleAddMarker();
      }
      // Ctrl + M -> Marker
      if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleAddMarker();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingState]);

  // ── Auto Save State & State Recovery (Section 10) ──
  useEffect(() => {
    if (recordingState === 'recording' || recordingState === 'paused') {
      const stateObj = {
        duration,
        markers,
        noiseSuppression,
        echoCancellation,
        speechEnhancement,
        timestamp: Date.now()
      };
      localStorage.setItem('samvad_recording_recovery', JSON.stringify(stateObj));
    }
  }, [duration, markers, noiseSuppression, echoCancellation, speechEnhancement, recordingState]);

  // ── Marker helper ──
  const handleAddMarker = () => {
    setMarkers(prev => [...prev, duration]);
    setShowMarkerNotification(true);
    setTimeout(() => setShowMarkerNotification(false), 2000);
  };

  // ── Time formatter ──
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0'),
    ].filter(Boolean).join(':');
  };

  const calculatedSize = ((duration * 16000 * 2) / (1024 * 1024)).toFixed(2);
  const channels = captureSource === 'both' ? 2 : 1;

  // ── MAIN WAVEFORM + AUDIO ANALYSIS ──────────────────────────────────────────
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    interface Particle {
      x: number; y: number; size: number;
      speedY: number; alpha: number; color: string;
    }
    let particles: Particle[] = [];

    // ── RECORDING STATE: Live audio-reactive visualization ──
    if (stream && recordingState === 'recording') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtxClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.82;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const timeDomain = new Uint8Array(bufferLength);
      const freqDomain = new Uint8Array(bufferLength);

      // smoothed amplitude for VU
      let smoothL = 0;
      let smoothR = 0;
      let rollingPeak = 0;
      let rollingAvg = 0;
      const avgWindow: number[] = [];

      const draw = () => {
        animFrameRef.current = requestAnimationFrame(draw);
        const W = canvas.width;
        const H = canvas.height;

        analyser.getByteTimeDomainData(timeDomain);
        analyser.getByteFrequencyData(freqDomain);

        // Compute RMS amplitude
        let sumSq = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = (timeDomain[i] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / bufferLength);
        const clampedRms = Math.min(1, rms * 4); // scale up so meter reacts well

        // VU smoothing
        smoothL = smoothL * 0.78 + clampedRms * 0.22;
        smoothR = smoothR * 0.78 + (clampedRms * (0.9 + Math.random() * 0.2)) * 0.22;

        setVuLeft(Math.min(1, smoothL));
        setVuRight(Math.min(1, smoothR));

        if (smoothL > vuLeftPeakRef.current) { vuLeftPeakRef.current = smoothL; setVuLeftPeak(smoothL); }
        if (smoothR > vuRightPeakRef.current) { vuRightPeakRef.current = smoothR; setVuRightPeak(smoothR); }

        // Loudness metrics (dB-ish)
        const loudnessDb = rms > 0.001 ? Math.max(-60, 20 * Math.log10(rms)) : -60;
        const loudnessPct = Math.round(((loudnessDb + 60) / 60) * 100);
        setCurrentLoudness(loudnessPct);

        rollingPeak = Math.max(rollingPeak * 0.998, clampedRms);
        const peakDb = rollingPeak > 0.001 ? Math.max(-60, 20 * Math.log10(rollingPeak)) : -60;
        setPeakLevel(Math.round(((peakDb + 60) / 60) * 100));

        avgWindow.push(clampedRms);
        if (avgWindow.length > 60) avgWindow.shift();
        rollingAvg = avgWindow.reduce((a, b) => a + b, 0) / avgWindow.length;
        setAvgLevel(Math.round(rollingAvg * 100));

        const drDb = Math.abs(loudnessDb - noiseFloor);
        setDynamicRange(Math.min(100, Math.round(drDb)));
        setIsSpeech(clampedRms > 0.08);

        // ── DRAW ──
        // Trail fade
        ctx.fillStyle = 'rgba(5, 5, 10, 0.2)';
        ctx.fillRect(0, 0, W, H);

        // Center axis hairline
        ctx.strokeStyle = 'rgba(255,255,255,0.015)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.stroke();

        // Audio Grid Reference lines (horizontal dB marks)
        const dbFracs = [0.25, 0.375, 0.625, 0.75];
        dbFracs.forEach(frac => {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.005)';
          ctx.beginPath();
          ctx.moveTo(0, H * frac);
          ctx.lineTo(W, H * frac);
          ctx.stroke();
        });

        // Vertical time grid ticks
        for (let x = 50; x < W; x += 100) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.004)';
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }

        // Volume-reactive radial aura
        if (clampedRms > 0.04) {
          const auraR = 30 + clampedRms * 120;
          const aura = ctx.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, auraR);
          const alpha = clampedRms * 0.10;
          aura.addColorStop(0, `rgba(139,92,246,${alpha})`);
          aura.addColorStop(0.5, `rgba(99,102,241,${alpha * 0.4})`);
          aura.addColorStop(1, 'rgba(5,5,10,0)');
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(W / 2, H / 2, auraR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Frequency bars (background silhouette)
        const barCount = 48;
        const barW = W / barCount - 1;
        ctx.fillStyle = 'rgba(79,70,229,0.05)';
        for (let i = 0; i < barCount; i++) {
          const freq = freqDomain[Math.floor(i * (bufferLength / barCount))] || 0;
          const bh = (freq / 255) * (H * 0.75);
          const bx = i * (barW + 1);
          const by = (H - bh) / 2;
          ctx.beginPath();
          ctx.roundRect(bx, by, barW, bh, 1.5);
          ctx.fill();
        }

        const sliceW = W / bufferLength;

        // ── Layer 1: Filled symmetrical waveform ──
        const fillGrad = ctx.createLinearGradient(0, 0, W, 0);
        fillGrad.addColorStop(0, 'rgba(139,92,246,0.06)');
        fillGrad.addColorStop(0.5, 'rgba(99,102,241,0.12)');
        fillGrad.addColorStop(1, 'rgba(56,189,248,0.06)');
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.moveTo(0, H / 2);
        for (let i = 0; i < bufferLength; i++) {
          const v = (timeDomain[i] - 128) / 128;
          const amp = v * (H / 2) * 0.92;
          const x = i * sliceW;
          if (i === 0) ctx.moveTo(x, H / 2 - amp);
          else ctx.lineTo(x, H / 2 - amp);
        }
        for (let i = bufferLength - 1; i >= 0; i--) {
          const v = (timeDomain[i] - 128) / 128;
          const amp = v * (H / 2) * 0.92;
          ctx.lineTo(i * sliceW, H / 2 + amp);
        }
        ctx.closePath();
        ctx.fill();

        // ── Layer 2: Secondary stroke (ghost) ──
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(139,92,246,0.18)';
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
          const v = timeDomain[i] / 128.0;
          const y = (H / 2) + ((v - 1.0) * (H / 2) * 0.80);
          const x = i * sliceW;
          if (i === 0) ctx.moveTo(x, y);
          else {
            const px = (i - 1) * sliceW;
            const pv = timeDomain[i - 1] / 128.0;
            const py = (H / 2) + ((pv - 1.0) * (H / 2) * 0.80);
            ctx.bezierCurveTo(px + sliceW / 2, py, px + sliceW / 2, y, x, y);
          }
        }
        ctx.stroke();

        // ── Layer 3: Primary glowing stroke ──
        const primaryGrad = ctx.createLinearGradient(0, 0, W, 0);
        primaryGrad.addColorStop(0, '#a78bfa');
        primaryGrad.addColorStop(0.35, '#818cf8');
        primaryGrad.addColorStop(0.65, '#6366f1');
        primaryGrad.addColorStop(1, '#38bdf8');
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = primaryGrad;
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(99,102,241,0.5)';
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
          const v = (timeDomain[i] - 128) / 128;
          const y = H / 2 - v * (H / 2) * 0.92;
          const x = i * sliceW;
          if (i === 0) ctx.moveTo(x, y);
          else {
            const px = (i - 1) * sliceW;
            const pv = (timeDomain[i - 1] - 128) / 128;
            const py = H / 2 - pv * (H / 2) * 0.92;
            ctx.bezierCurveTo(px + sliceW / 2, py, px + sliceW / 2, y, x, y);
          }

          // Emit particles on peaks
          if (Math.abs(v) > 0.15 && Math.random() < 0.08 && i > 10 && i < bufferLength - 10) {
            particles.push({
              x: x, y,
              size: 0.8 + Math.random() * 1.8,
              speedY: -0.3 - Math.random() * 0.9,
              alpha: 0.7,
              color: i % 2 === 0 ? '#38bdf8' : '#a78bfa',
            });
          }
        }
        ctx.stroke();

        // ── Mirror stroke (bottom) ──
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = 'rgba(56,189,248,0.12)';
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(56,189,248,0.2)';
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
          const v = (timeDomain[i] - 128) / 128;
          const y = H / 2 + v * (H / 2) * 0.92;
          const x = i * sliceW;
          if (i === 0) ctx.moveTo(x, y);
          else {
            const px = (i - 1) * sliceW;
            const pv = (timeDomain[i - 1] - 128) / 128;
            const py = H / 2 + pv * (H / 2) * 0.92;
            ctx.bezierCurveTo(px + sliceW / 2, py, px + sliceW / 2, y, x, y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Particles
        for (let idx = particles.length - 1; idx >= 0; idx--) {
          const p = particles[idx];
          p.y += p.speedY;
          p.alpha -= 0.022;
          if (p.alpha <= 0) { particles.splice(idx, 1); continue; }
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };

      draw();
      return () => {
        cancelAnimationFrame(animFrameRef.current);
        audioContext.close();
      };
    }

    // ── PAUSED: Freeze + dim ──
    if (recordingState === 'paused') {
      // Leave last frame drawn, dim it once
      const W = canvas.width; const H = canvas.height;
      ctx.fillStyle = 'rgba(5,5,10,0.58)';
      ctx.fillRect(0, 0, W, H);
      // Draw paused label
      ctx.fillStyle = 'rgba(245,158,11,0.35)';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⏸ PAUSED', W / 2, H / 2 + 4);
      ctx.textAlign = 'left';
      setVuLeft(0); setVuRight(0);
      return;
    }

    // ── IDLE / STOPPED: Gentle breathing sine wave ──
    let phase = 0;
    const drawIdle = () => {
      animFrameRef.current = requestAnimationFrame(drawIdle);
      const W = canvas.width; const H = canvas.height;
      phase += recordingState === 'idle' ? 0.018 : 0.0;

      ctx.fillStyle = 'rgb(5,5,10)';
      ctx.fillRect(0, 0, W, H);

      const amplitude = recordingState === 'stopped' ? 0 : 7;
      const breathe = 1 + Math.sin(Date.now() / 2200) * 0.35;

      // Center axis
      ctx.strokeStyle = 'rgba(255,255,255,0.015)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

      // Audio Grid Reference lines
      const dbFracs = [0.25, 0.375, 0.625, 0.75];
      dbFracs.forEach(frac => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.005)';
        ctx.beginPath();
        ctx.moveTo(0, H * frac);
        ctx.lineTo(W, H * frac);
        ctx.stroke();
      });

      // Vertical time grid ticks
      for (let x = 50; x < W; x += 100) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.004)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      // Ghost wave
      ctx.strokeStyle = 'rgba(99,102,241,0.06)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = H / 2 + Math.sin(x * 0.010 - phase * 0.6) * (amplitude * 0.5 * breathe);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Primary idle wave
      const idleGrad = ctx.createLinearGradient(0, 0, W, 0);
      idleGrad.addColorStop(0, `rgba(139,92,246,${0.18 * breathe})`);
      idleGrad.addColorStop(0.5, `rgba(56,189,248,${0.28 * breathe})`);
      idleGrad.addColorStop(1, `rgba(139,92,246,${0.18 * breathe})`);
      ctx.strokeStyle = idleGrad;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(56,189,248,0.12)';
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = H / 2 + Math.sin(x * 0.013 + phase) * amplitude * breathe;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Mirror wave
      ctx.strokeStyle = `rgba(56,189,248,${0.06 * breathe})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = H / 2 - Math.sin(x * 0.013 + phase) * amplitude * breathe;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    drawIdle();
    setVuLeft(0); setVuRight(0);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [stream, recordingState]);

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className={`flex-1 flex flex-col h-screen overflow-hidden bg-transparent relative p-5 transition-all duration-500 ${uploading ? 'blur-[3px] pointer-events-none' : ''}`}>

      {/* ── 1. HEADER ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-slate-950/45 border border-white/[0.03] rounded-2xl shadow-xl backdrop-blur-md mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border transition-all ${
            recordingState === 'recording'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">🎙 Recorder</h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400" /> Offline AI
              </span>
              {recordingState === 'recording' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> REC
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {recordingState === 'stopped' ? (
                <input
                  type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Enter meeting title..."
                  className="bg-transparent border-none p-0 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-0 font-medium w-48"
                />
              ) : (
                <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
                  {title || 'Untitled Local Meeting'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/40">
            <span className="text-slate-600 font-bold">DEVICE:</span>
            <span className="text-slate-300">
              {captureSource === 'mic' && 'Microphone'}
              {captureSource === 'system' && 'System Audio'}
              {captureSource === 'both' && 'Mic + System Loopback'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/40">
            <span className="text-slate-600 font-bold">SPECS:</span>
            <span className="text-slate-300">{formatSelect} • {sampleRateSelect}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/40 font-mono">
            <Clock className="w-3 h-3 text-slate-600" />
            <span className="text-slate-300">{timeStr || '--:--:--'}</span>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pb-2">

        {/* ── LEFT CONTROL PANEL ── */}
        <aside
          onMouseMove={handleMouseMove}
          className="col-span-12 lg:col-span-3 bg-slate-950/45 border border-white/[0.03] premium-card-interaction rounded-3xl p-4 flex flex-col gap-2 overflow-y-auto h-[calc(100vh-190px)] backdrop-blur-md shadow-xl scrollbar-none select-none pb-8"
        >

          {/* ── SECTION: CAPTURE OPTIONS ── */}
          <div>
            <button onClick={() => setCapOpen(v => !v)} className="w-full flex items-center gap-2 mb-1.5 group">
              <Settings2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider flex-1 text-left">Capture Options</span>
              {capOpen ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
            </button>
            <div className="h-px bg-white/[0.03] mb-2" />
          </div>

          {capOpen && (
            <div className="flex flex-col gap-2">
              {/* Source selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Input Source</label>
                <div className="grid grid-cols-3 bg-slate-900/60 border border-slate-800/40 p-0.5 rounded-xl">
                  {(['mic', 'system', 'both'] as const).map((src) => (
                    <button key={src} onClick={() => setCaptureSource(src)}
                      className={`py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all ${
                        captureSource === src ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                      }`}>
                      {src === 'mic' && <><Radio className="w-3 h-3" /> Mic</>}
                      {src === 'system' && <><Monitor className="w-3 h-3" /> Sys</>}
                      {src === 'both' && <><Disc3 className="w-3 h-3" /> Mix</>}
                    </button>
                  ))}
                </div>
              </div>
              {/* Device dropdown */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Input Device</label>
                <select className="bg-slate-900/60 border border-slate-800/40 rounded-xl px-3 py-2 text-[10px] text-slate-200 font-semibold focus:ring-0 outline-none cursor-pointer">
                  <option className="bg-slate-950">Microphone (Realtek(R) Audio)</option>
                  <option className="bg-slate-950">Default Microphone</option>
                </select>
              </div>
              {/* Input Gain */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[9px]">
                  <label className="text-slate-500 font-bold uppercase tracking-wider">Input Gain</label>
                  <span className="font-mono text-slate-300 font-bold">{inputGain}%</span>
                </div>
                <input type="range" min="0" max="100" value={inputGain}
                  onChange={e => setInputGain(Number(e.target.value))}
                  className="w-full accent-purple-500 h-1 bg-slate-900 rounded-lg cursor-pointer" />
              </div>
              {/* Monitor toggle */}
              <div className="flex items-center justify-between bg-slate-900/30 border border-slate-800/30 p-2.5 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-300 font-bold block">Monitor Audio</span>
                  <span className="text-[8px] text-slate-500">Output local mic feed</span>
                </div>
                <button onClick={() => setMonitoring(!monitoring)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${monitoring ? 'bg-purple-600' : 'bg-slate-800'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${monitoring ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          )}

          <div className="h-px bg-white/[0.02] my-1" />

          {/* ── SECTION: DSP & AI PROCESSING ── */}
          <div>
            <button onClick={() => setDspOpen(v => !v)} className="w-full flex items-center gap-2 mb-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider flex-1 text-left">DSP & AI Processing</span>
              {dspOpen ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
            </button>
            <div className="h-px bg-white/[0.03] mb-2" />
          </div>

          {dspOpen && (
            <div className="flex flex-col gap-1.5">
              {[
                { icon: '🎙', label: 'Noise Suppression', sub: 'AI removes constant background sounds', value: noiseSuppression, set: setNoiseSuppression },
                { icon: '🌀', label: 'Echo Cancellation', sub: 'Eliminates microphone echo feedback', value: echoCancellation, set: setEchoCancellation },
                { icon: '✨', label: 'Speech Enhancement', sub: 'Boosts voice clarity and presence', value: speechEnhancement, set: setSpeechEnhancement },
                { icon: '📈', label: 'Auto Gain Control', sub: 'Dynamically adjusts input levels', value: autoGainControl, set: setAutoGainControl },
                { icon: '🎧', label: 'Voice Isolation', sub: 'Separates speech from background', value: voiceIsolation, set: setVoiceIsolation },
              ].map(({ icon, label, sub, value, set }) => (
                <div key={label} className="flex items-center justify-between bg-slate-900/25 border border-slate-800/30 px-2.5 py-2 rounded-xl">
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5 leading-none">{icon}</span>
                    <div>
                      <span className="text-[10px] text-slate-200 font-semibold block">{label}</span>
                      <span className="text-[8px] text-slate-500 block">{sub}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 ml-2 flex-shrink-0">
                    <button onClick={() => set(!value)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ${value ? 'bg-purple-600' : 'bg-slate-800'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-[7px] font-bold uppercase ${value ? 'text-purple-400' : 'text-slate-600'}`}>{value ? 'ON' : 'OFF'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="h-px bg-white/[0.02] my-1" />

          {/* ── SECTION: STORAGE ── */}
          <div>
            <button onClick={() => setStoreOpen(v => !v)} className="w-full flex items-center gap-2 mb-1.5">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider flex-1 text-left">Storage & Format</span>
              {storeOpen ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
            </button>
            <div className="h-px bg-white/[0.03] mb-2" />
          </div>

          {storeOpen && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-800/30 p-2 rounded-xl">
                  <span className="text-[8px] text-slate-500 font-bold uppercase">Sample Rate</span>
                  <select value={sampleRateSelect} onChange={e => setSampleRateSelect(e.target.value)}
                    className="bg-transparent border-none p-0 text-[10px] text-slate-200 font-semibold focus:ring-0 cursor-pointer outline-none">
                    <option value="16000 Hz" className="bg-slate-950">16000 Hz</option>
                    <option value="44100 Hz" className="bg-slate-950">44100 Hz</option>
                    <option value="48000 Hz" className="bg-slate-950">48000 Hz</option>
                  </select>
                </div>
                <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-800/30 p-2 rounded-xl">
                  <span className="text-[8px] text-slate-500 font-bold uppercase">Bit Depth</span>
                  <select value={bitDepthSelect} onChange={e => setBitDepthSelect(e.target.value)}
                    className="bg-transparent border-none p-0 text-[10px] text-slate-200 font-semibold focus:ring-0 cursor-pointer outline-none">
                    <option value="16-bit" className="bg-slate-950">16-bit</option>
                    <option value="24-bit" className="bg-slate-950">24-bit</option>
                    <option value="32-bit Float" className="bg-slate-950">32-bit Float</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-800/30 p-2 rounded-xl">
                  <span className="text-[8px] text-slate-500 font-bold uppercase">Channels</span>
                  <select className="bg-transparent border-none p-0 text-[10px] text-slate-200 font-semibold focus:ring-0 cursor-pointer outline-none">
                    <option className="bg-slate-950">1 (Mono)</option>
                    <option className="bg-slate-950">2 (Stereo)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-800/30 p-2 rounded-xl">
                  <span className="text-[8px] text-slate-500 font-bold uppercase">Container</span>
                  <select value={formatSelect} onChange={e => setFormatSelect(e.target.value)}
                    className="bg-transparent border-none p-0 text-[10px] text-slate-200 font-semibold focus:ring-0 cursor-pointer outline-none">
                    <option value="FLAC" className="bg-slate-950">FLAC</option>
                    <option value="WAV" className="bg-slate-950">WAV</option>
                    <option value="MP3" className="bg-slate-950">MP3</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/30 border border-slate-800/30 px-2.5 py-2 rounded-xl">
                <Folders className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block text-[8px] text-slate-500 font-bold uppercase">Target Directory</span>
                  <span className="block text-[9px] text-slate-300 font-mono truncate">C:\SAMVAD\Recordings</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── CENTER STUDIO ── */}
        <main
          onMouseMove={handleMouseMove}
          className="col-span-12 lg:col-span-6 flex flex-col h-[calc(100vh-190px)] bg-slate-950/45 border border-white/[0.03] premium-card-interaction rounded-3xl p-6 relative overflow-y-auto backdrop-blur-md shadow-xl gap-5 pb-8"
        >
          {/* Subtle mesh grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:100%_12px] pointer-events-none z-10" />

          {/* Studio Header */}
          <div className="flex-shrink-0 flex items-center justify-between border-b border-white/[0.02] pb-4 z-20">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${recordingState === 'recording' ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {recordingState === 'idle' && 'Studio Standby'}
                {recordingState === 'recording' && 'Live Capturing'}
                {recordingState === 'paused' && 'Capture Paused'}
                {recordingState === 'stopped' && 'Capture Complete'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {recordingState === 'recording' && (
                <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <Waves className="w-2.5 h-2.5" /> LIVE
                </span>
              )}
              {recordingState !== 'idle' && (
                <span className="text-[9px] text-purple-400 font-mono font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  ACTIVE MONITOR
                </span>
              )}
            </div>
          </div>

          {/* Live AI Status Banner */}
          <div className="flex-shrink-0 z-20">
            <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-[10px] font-semibold transition-all duration-500 ${
              recordingState === 'recording' && isSpeech ? 'bg-purple-500/8 border-purple-500/20 text-purple-300' :
              recordingState === 'recording' ? 'bg-emerald-500/8 border-emerald-500/15 text-emerald-400' :
              recordingState === 'paused' ? 'bg-amber-500/8 border-amber-500/20 text-amber-400' :
              'bg-slate-900/30 border-slate-800/30 text-slate-500'
            }`}>
              <span className={`text-sm ${
                recordingState === 'recording' ? 'animate-pulse' : ''
              }`}>
                {recordingState === 'idle' && '🎛️'}
                {recordingState === 'recording' && isSpeech && '🔊'}
                {recordingState === 'recording' && !isSpeech && '🎙️'}
                {recordingState === 'paused' && '⏸️'}
                {recordingState === 'stopped' && '✅'}
              </span>
              <span>
                {recordingState === 'idle' && 'Studio Standby — Ready to capture'}
                {recordingState === 'recording' && isSpeech && 'Detecting speech... AI listening actively'}
                {recordingState === 'recording' && !isSpeech && '🎙 Listening... Monitoring audio stream'}
                {recordingState === 'paused' && 'Recording Paused — Resume when ready'}
                {recordingState === 'stopped' && 'Capture Complete — Ready to save & transcribe'}
              </span>
              {recordingState === 'recording' && (
                <span className="ml-auto font-mono text-[9px] text-slate-500">{formatTime(duration)}</span>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* HERO WAVEFORM + VU METERS ROW                              */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 z-20 flex items-stretch gap-2 w-full">

            {/* dB Scale left of L meter */}
            <DbScale height={440} />

            {/* Left VU Meter */}
            <VUMeter level={vuLeft} peak={vuLeftPeak} label="L" side="L" recordingState={recordingState} height={440} />

            {/* Main Waveform Canvas Container */}
            <div
              className="flex-1 bg-[#04050a] rounded-2xl border border-white/[0.04] shadow-[inset_0_2px_20px_rgba(0,0,0,0.98)] overflow-hidden relative"
              style={{ height: '440px' }}
            >
              {/* Top Right: Specs overlay */}
              <div className="absolute top-3 right-4 text-[9px] text-slate-600 font-mono pointer-events-none select-none z-20">
                {sampleRateSelect} · {channels}ch · {bitDepthSelect} · {formatSelect}
              </div>

              {/* Center status label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10">
                {recordingState === 'idle' && (
                  <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">
                    STANDBY: PRESS RECORD
                  </span>
                )}
                {recordingState === 'paused' && (
                  <span className="text-[11px] text-amber-600/50 font-bold uppercase tracking-widest">
                    ⏸ Recording Paused
                  </span>
                )}
              </div>

              <canvas
                ref={mainCanvasRef}
                width={900}
                height={440}
                className="w-full h-full block"
                style={{
                  opacity: recordingState === 'paused' ? 0.35 : 1,
                  transition: 'opacity 0.4s ease',
                }}
              />

              {/* Time axis at bottom */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-3 pb-1.5 pointer-events-none select-none">
                {['00:00','00:10','00:20','00:30','00:40','00:50','01:00'].map(t => (
                  <span key={t} className="text-[7px] text-slate-700 font-mono">{t}</span>
                ))}
              </div>
              <div className="absolute bottom-5 left-0 right-0 h-px bg-white/[0.02] pointer-events-none" />
            </div>

            {/* Right VU Meter */}
            <VUMeter level={vuRight} peak={vuRightPeak} label="R" side="R" recordingState={recordingState} height={440} />
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* METRICS STRIP — 6 items                                    */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 z-20 grid grid-cols-6 gap-2 bg-slate-900/15 border border-white/[0.02] p-2.5 rounded-2xl">
            {[
              { icon: <Clock className="w-3 h-3 text-purple-400" />, label: 'Duration', value: recordingState === 'idle' ? '00:00:00' : formatTime(duration) },
              { icon: <HardDrive className="w-3 h-3 text-sky-400" />, label: 'File Size', value: `${recordingState === 'idle' ? '0.00' : calculatedSize} MB` },
              { icon: <Activity className="w-3 h-3 text-emerald-400" />, label: 'Sample Rate', value: sampleRateSelect.replace(' Hz','') },
              { icon: <Gauge className="w-3 h-3 text-indigo-400" />, label: 'Bit Depth', value: bitDepthSelect.split(' ')[0] },
              { icon: <Zap className="w-3 h-3 text-amber-400" />, label: 'Codec', value: formatSelect },
              { icon: <AudioLines className="w-3 h-3 text-rose-400" />, label: 'Channels', value: channels === 1 ? '1 (Mono)' : '2 (Stereo)' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-1.5 min-w-0">
                {icon}
                <div className="min-w-0">
                  <span className="block text-[7px] text-slate-600 font-bold uppercase tracking-wider truncate">{label}</span>
                  <span className="text-[9px] font-extrabold text-slate-200 font-mono leading-none truncate block">{value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* 3-CARD GLASS DASHBOARD                                     */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 z-20 grid grid-cols-3 gap-3">
            
            {/* CARD 1: Live Levels */}
            <div className="bg-[#0c0d12]/60 border border-white/[0.03] p-3 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 border-b border-white/[0.02] pb-1.5 mb-0.5">
                <BarChart3 className="w-3 h-3 text-indigo-400" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Live Levels</span>
                <span className={`ml-auto text-[7px] px-1.5 py-0.5 rounded font-bold uppercase font-mono ${
                  isSpeech && recordingState === 'recording' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800/60 text-slate-600 border border-slate-800'
                }`}>{isSpeech && recordingState === 'recording' ? '🎙 Speech' : 'Silence'}</span>
              </div>
              {[
                { label: 'Input Level', value: recordingState === 'recording' ? `${Math.round(vuLeft * 100) - 100} dB` : '-- dB', pct: vuLeft * 100, color: '#818cf8' },
                { label: 'Peak Level', value: recordingState === 'recording' ? `${peakLevel - 100} dB` : '-- dB', pct: peakLevel, color: '#f59e0b' },
                { label: 'Loudness (RMS)', value: recordingState === 'recording' ? `${currentLoudness - 100} dB` : '-- dB', pct: currentLoudness, color: '#a78bfa' },
                { label: 'Noise Floor', value: `${noiseFloor} dB`, pct: 15, color: '#64748b' },
                { label: 'Dynamic Range', value: recordingState === 'recording' ? `${dynamicRange} dB` : '-- dB', pct: dynamicRange, color: '#10b981' },
              ].map(({ label, value, pct, color }) => (
                <div key={label} className="space-y-0.5">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-mono text-slate-300">{value}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100,Math.max(0,pct))}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* CARD 2: Speech Detection */}
            <div className="bg-[#0c0d12]/60 border border-white/[0.03] p-3 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 border-b border-white/[0.02] pb-1.5 mb-0.5">
                <Waves className="w-3 h-3 text-purple-400" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Speech Detection</span>
              </div>
              <div className="space-y-1.5 text-[9px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Speech Detected</span>
                  <span className={`font-bold ${recordingState === 'recording' && isSpeech ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {recordingState === 'recording' ? (isSpeech ? 'Yes' : 'No') : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Speaker</span>
                  <span className="text-slate-300 font-bold">{recordingState === 'recording' && isSpeech ? 'Speaker A' : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Silence Duration</span>
                  <span className="font-mono text-slate-300">{recordingState === 'recording' && !isSpeech ? '00:03' : '00:00'}</span>
                </div>
              </div>
              <div className="space-y-1.5 border-t border-white/[0.02] pt-2">
                {[
                  { label: 'Speech Confidence', pct: recordingState === 'recording' && isSpeech ? 98 : 0, color: '#10b981' },
                  { label: 'Speech Coverage', pct: recordingState === 'recording' ? avgLevel : 0, color: '#a78bfa' },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="space-y-0.5">
                    <div className="flex justify-between text-[9px]">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-mono text-slate-300">{pct > 0 ? `${pct}%` : '—'}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 3: Recording Quality */}
            <div className="bg-[#0c0d12]/60 border border-white/[0.03] p-3 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 border-b border-white/[0.02] pb-1.5 mb-0.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Recording Quality</span>
                <span className="ml-auto text-[7px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-bold font-mono uppercase">
                  {audioQuality > 95 ? 'Excellent' : audioQuality > 85 ? 'Good' : 'Fair'}
                </span>
              </div>
              {[
                { label: 'Signal Quality', pct: audioQuality, color: '#10b981' },
                { label: 'Noise Level', pct: 100 - (Math.abs(noiseFloor) - 50), color: '#6366f1' },
                { label: 'Clipping Risk', pct: recordingState === 'recording' ? Math.max(0, peakLevel - 80) : 0, color: '#f43f5e' },
                { label: 'Stability', pct: 99, color: '#a78bfa' },
                { label: 'Audio Health', pct: audioQuality, color: '#38bdf8' },
              ].map(({ label, pct, color }) => (
                <div key={label} className="space-y-0.5">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-mono text-slate-300">{pct}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* LIVE EVENT TIMELINE                                        */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 z-20 bg-[#0c0d12]/50 border border-white/[0.02] rounded-2xl p-3">
            <div className="flex items-center gap-2 border-b border-white/[0.02] pb-1.5 mb-2">
              <Activity className="w-3 h-3 text-slate-500" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Live Event Timeline</span>
              <span className="ml-auto text-[7px] text-slate-600 font-mono">{events.length} events</span>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {events.length === 0 ? (
                <span className="text-[9px] text-slate-700 font-mono">No events yet — start recording to begin timeline</span>
              ) : events.map((ev, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center gap-0.5 bg-slate-900/40 border border-white/[0.02] rounded-xl px-2.5 py-1.5">
                  <span className="text-sm">{ev.icon}</span>
                  <span className="text-[8px] font-bold" style={{ color: ev.color }}>{ev.label}</span>
                  <span className="text-[7px] text-slate-600 font-mono">{new Date(ev.ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Save form when stopped */}
          {recordingState === 'stopped' && (
            <div className="z-20 bg-slate-900/30 p-5 rounded-2xl border border-white/[0.03] space-y-4 flex-shrink-0">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Meeting Title</label>
                <input
                  type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Enter meeting name..."
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 font-semibold"
                />
              </div>
              {recordingError && (
                <div className="flex items-center gap-2 text-rose-500 text-xs font-semibold justify-center">
                  <AlertCircle className="w-4 h-4" /><span>{recordingError}</span>
                </div>
              )}
              <div className="flex gap-4 items-center">
                <button onClick={discardRecording} disabled={uploading}
                  className="p-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all cursor-pointer"
                  title="Discard Recording">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={saveRecording} disabled={uploading}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-600/10 disabled:opacity-50">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{uploading ? 'Saving & Transcribing...' : 'Save & Transcribe'}</span>
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ── RIGHT AI OPERATIONS CONSOLE ── */}
        <aside
          onMouseMove={handleMouseMove}
          className="col-span-12 lg:col-span-3 bg-slate-950/45 border border-white/[0.03] premium-card-interaction rounded-3xl p-4 flex flex-col gap-3 overflow-y-auto h-[calc(100vh-190px)] backdrop-blur-md shadow-xl select-none pb-12 scrollbar-none"
        >
          <div className="flex-shrink-0">
            <h3 className="text-[10px] font-bold text-white tracking-wider uppercase">AI Operations Console</h3>
            <p className="text-[9px] text-slate-600 mt-0.5">Live offline engine & pipeline analytics.</p>
          </div>

          {/* SECTION 1: AI Components */}
          <div className="bg-[#0d0e12]/60 border border-slate-900/80 p-2.5 rounded-2xl flex flex-col gap-2">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">AI Components</span>
            <div className="space-y-1.5">
              {[
                { name: 'VAD', label: 'Voice Activity Detection', status: recordingState === 'recording' ? 'Running' : 'Idle' },
                { name: 'Noise Filter', label: 'Spectral Noise Reduction', status: noiseSuppression && recordingState === 'recording' ? 'Running' : 'Idle' },
                { name: 'Enhancement', label: 'Speech Enhancement DSP', status: speechEnhancement && recordingState === 'recording' ? 'Running' : 'Idle' },
                { name: 'Whisper', label: 'ASR Transcription Engine', status: 'Idle' },
                { name: 'Diarization', label: 'Speaker Separation Model', status: 'Idle' },
                { name: 'Transcript', label: 'Post-Processing Engine', status: 'Idle' },
                { name: 'Meeting Intel', label: 'Offline Intelligence Core', status: 'Idle' },
              ].map(svc => (
                <div key={svc.name} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    svc.status === 'Running' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-slate-700'
                  } ${svc.status === 'Running' ? 'animate-pulse' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-slate-300 font-semibold block truncate">{svc.name}</span>
                  </div>
                  <span className={`text-[7px] px-1.5 py-0.5 rounded font-bold font-mono ${
                    svc.status === 'Running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900 text-slate-600 border border-slate-800'
                  }`}>{svc.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: Models */}
          <div className="bg-[#0d0e12]/60 border border-slate-900/80 p-2.5 rounded-2xl flex flex-col gap-1.5">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Active Models</span>
            {[
              { label: 'Speech', value: 'faster-whisper-small', chip: 'Loaded', chipColor: 'emerald' },
              { label: 'Diarization', value: 'Pyannote v3.1', chip: 'Ready', chipColor: 'indigo' },
              { label: 'Embedding', value: 'all-MiniLM-L6-v2', chip: 'Ready', chipColor: 'indigo' },
              { label: 'QA Model', value: 'Local Transformer', chip: 'Ready', chipColor: 'indigo' },
              { label: 'Inference', value: 'ONNX-CUDA / GPU', chip: 'GPU', chipColor: 'purple' },
            ].map(({ label, value, chip, chipColor }) => (
              <div key={label} className="flex items-center justify-between text-[9px]">
                <span className="text-slate-500">{label}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`font-mono text-slate-300 truncate max-w-[100px]`}>{value}</span>
                  <span className={`text-[7px] px-1 py-0.5 rounded font-bold font-mono bg-${chipColor}-500/10 text-${chipColor}-400 border border-${chipColor}-500/20`}>{chip}</span>
                </div>
              </div>
            ))}
          </div>

          {/* SECTION 3: System Resources 2x2 grid */}
          <div className="bg-[#0d0e12]/60 border border-slate-900/80 p-2.5 rounded-2xl flex flex-col gap-2">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">System Resources</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'CPU Usage', value: cpuUsage, unit: '%', color: '#6366f1' },
                { label: 'GPU Usage', value: gpuUsage, unit: '%', color: '#8b5cf6' },
                { label: 'RAM Usage', value: ramUsage, unit: '%', color: '#38bdf8' },
                { label: 'VRAM Usage', value: vramUsage, unit: '%', color: '#f59e0b' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="bg-slate-950/40 border border-white/[0.02] rounded-xl p-2">
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-mono font-bold" style={{ color }}>{value}{unit}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-[8px] border-t border-white/[0.02] pt-2">
              {[
                { label: 'Disk', value: `${diskSpeed} MB/s` },
                { label: 'DB Size', value: '256 MB' },
                { label: 'Latency', value: `${latency} ms` },
                { label: 'FPS', value: `${fps}` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <span className="block text-slate-600 font-bold uppercase text-[7px]">{label}</span>
                  <span className="font-mono text-slate-300">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Pipeline Vertical Timeline */}
          <div className="bg-[#0d0e12]/60 border border-slate-900/80 p-2.5 rounded-2xl flex flex-col gap-1.5">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Pipeline Status</span>
            <div className="flex flex-col gap-0">
              {[
                { label: 'Capture', state: recordingState === 'recording' ? 'Running' : 'Waiting' },
                { label: 'Enhancement', state: recordingState === 'recording' && speechEnhancement ? 'Running' : 'Waiting' },
                { label: 'VAD', state: recordingState === 'recording' ? 'Running' : 'Waiting' },
                { label: 'Whisper', state: 'Waiting' },
                { label: 'Diarization', state: 'Waiting' },
                { label: 'Transcript', state: 'Waiting' },
                { label: 'Meeting Intel', state: 'Waiting' },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-stretch gap-2.5">
                  <div className="flex flex-col items-center" style={{ width: '12px' }}>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${
                      step.state === 'Running' ? 'bg-purple-500 shadow-[0_0_6px_#8b5cf6] animate-pulse' :
                      step.state === 'Completed' ? 'bg-emerald-500' : 'bg-slate-800 border border-slate-700'
                    }`} />
                    {i < arr.length - 1 && <div className="flex-1 w-px bg-slate-800 my-0.5" />}
                  </div>
                  <div className="flex items-center justify-between flex-1 pb-2">
                    <span className="text-[9px] text-slate-400">{step.label}</span>
                    <span className={`text-[7px] font-bold font-mono ${
                      step.state === 'Running' ? 'text-purple-400' :
                      step.state === 'Completed' ? 'text-emerald-400' : 'text-slate-600'
                    }`}>{step.state}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── PREMIUM FLOATING COMMAND DOCK ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center pointer-events-none">
        {/* Marker notification */}
        <AnimatePresence>
          {showMarkerNotification && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="mb-2 bg-slate-900/90 border border-white/[0.05] text-[10px] text-slate-300 font-bold px-4 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 whitespace-nowrap backdrop-blur-sm pointer-events-auto"
            >
              <MapPin className="w-3 h-3 text-purple-400" />
              Marker added at {formatTime(duration)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Dock */}
        <div className="pointer-events-auto bg-slate-950/85 border border-white/[0.04] backdrop-blur-xl shadow-2xl w-full relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

          {/* Dock buttons row */}
          <div className="flex items-center justify-center gap-1 px-6 pt-3 pb-1">
            {/* Left actions */}
            {(recordingState === 'idle' || recordingState === 'recording' || recordingState === 'paused') && (
              <>
                <button onClick={() => { setBookmarked(!bookmarked); addEvent('📌','Bookmark Added','#818cf8'); }}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                    bookmarked ? 'bg-sky-500/10 border-sky-500/25 text-sky-400' : 'bg-slate-900/50 border-slate-800/50 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                  }`}>
                  <Bookmark className="w-4 h-4" />
                  <span className="text-[7px] font-bold uppercase">Bookmark</span>
                  <span className="text-[6px] text-slate-700">B</span>
                </button>

                <button onClick={handleAddMarker}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border bg-slate-900/50 border-slate-800/50 text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-all cursor-pointer">
                  <MapPin className="w-4 h-4" />
                  <span className="text-[7px] font-bold uppercase">Marker</span>
                  <span className="text-[6px] text-slate-700">M</span>
                </button>

                <button onClick={() => setShowNoteInput(v => !v)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                    showNoteInput ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' : 'bg-slate-900/50 border-slate-800/50 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                  }`}>
                  <PenLine className="w-4 h-4" />
                  <span className="text-[7px] font-bold uppercase">Note</span>
                  <span className="text-[6px] text-slate-700">N</span>
                </button>
              </>
            )}

            <div className="w-px h-10 bg-white/[0.04] mx-1" />

            {/* Center controls */}
            <div className="flex items-center gap-2 mx-2">
              {recordingState === 'recording' && (
                <button onClick={pauseRecording}
                  className="flex flex-col items-center gap-1 px-3.5 py-2 rounded-xl border bg-amber-600/8 border-amber-500/20 hover:bg-amber-600/15 text-amber-400 transition-all cursor-pointer">
                  <Pause className="w-4 h-4 fill-current" />
                  <span className="text-[7px] font-bold uppercase">Pause</span>
                  <span className="text-[6px] text-slate-700">Space</span>
                </button>
              )}
              {recordingState === 'paused' && (
                <button onClick={resumeRecording}
                  className="flex flex-col items-center gap-1 px-3.5 py-2 rounded-xl border bg-purple-600/8 border-purple-500/20 hover:bg-purple-600/15 text-purple-400 transition-all cursor-pointer">
                  <Play className="w-4 h-4 fill-current" />
                  <span className="text-[7px] font-bold uppercase">Resume</span>
                  <span className="text-[6px] text-slate-700">Space</span>
                </button>
              )}

              {/* The big Record button */}
              {recordingState === 'idle' && (
                <button onClick={startRecording}
                  className="flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_24px_rgba(239,68,68,0.35)] hover:shadow-[0_0_32px_rgba(239,68,68,0.5)] transition-all active:scale-95 cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white" />
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider">Record</span>
                  <span className="text-[6px] text-white/50">R</span>
                </button>
              )}
              {recordingState === 'recording' && (
                <button onClick={() => null}
                  className="flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-rose-600 text-white shadow-[0_0_24px_rgba(239,68,68,0.4)] animate-pulse cursor-default">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider">REC</span>
                  <span className="text-[6px] text-white/50">{formatTime(duration)}</span>
                </button>
              )}
              {recordingState === 'paused' && (
                <div className="flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-amber-600/20 border border-amber-500/30 text-amber-400">
                  <Pause className="w-5 h-5" />
                  <span className="text-[9px] font-extrabold uppercase tracking-wider">Paused</span>
                  <span className="text-[6px] text-amber-600">{formatTime(duration)}</span>
                </div>
              )}
              {recordingState === 'stopped' && (
                <button onClick={saveRecording} disabled={uploading}
                  className="flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-[9px] font-extrabold uppercase">{uploading ? 'Saving...' : 'Save & Transcribe'}</span>
                </button>
              )}
            </div>

            {(recordingState === 'recording' || recordingState === 'paused') && (
              <button onClick={stopRecording}
                className="flex flex-col items-center gap-1 px-3.5 py-2 rounded-xl border bg-slate-900/50 border-slate-800/50 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer">
                <Square className="w-4 h-4" />
                <span className="text-[7px] font-bold uppercase">Stop</span>
                <span className="text-[6px] text-slate-700">S</span>
              </button>
            )}

            <div className="w-px h-10 bg-white/[0.04] mx-1" />

            <button className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border bg-slate-900/50 border-slate-800/50 text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-all cursor-pointer">
              <Keyboard className="w-4 h-4" />
              <span className="text-[7px] font-bold uppercase">Shortcuts</span>
              <span className="text-[6px] text-slate-700">H</span>
            </button>
          </div>

          {/* Note input area */}
          {showNoteInput && (
            <div className="px-6 pb-2 pt-1">
              <div className="flex gap-2">
                <input
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && noteText.trim()) {
                      addEvent('📝', `Note: ${noteText.slice(0,30)}`, '#f59e0b');
                      setNoteText(''); setShowNoteInput(false);
                    }
                  }}
                  placeholder="Type a note and press Enter..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Tip bar */}
          <div className="flex items-center justify-center gap-4 py-1.5 border-t border-white/[0.02] text-[8px] text-slate-700 font-mono">
            <span>Press <span className="text-slate-500">Space</span> to Pause/Resume</span>
            <span>•</span>
            <span><span className="text-slate-500">B</span> Bookmark</span>
            <span>•</span>
            <span><span className="text-slate-500">M</span> Marker</span>
            <span>•</span>
            <span><span className="text-slate-500">N</span> Note</span>
            <span>•</span>
            <span><span className="text-slate-500">S</span> Stop</span>
          </div>
        </div>
      </div>

      {/* ── FULL SCREEN AI PROCESSING EXPERIENCE OVERLAY ── */}
      {uploading && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[999] flex items-center justify-center p-6 pointer-events-auto">
          <div className="bg-[#0b0c10]/95 border border-white/[0.04] rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-5 relative select-none">
            {/* Top Shine */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/[0.02] pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  Local AI Processing Studio
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[400px]">{title || 'Untitled Local Meeting'}</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold uppercase font-mono animate-pulse">Offline AI Active</span>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">{calculatedSize} MB · {formatSelect}</p>
              </div>
            </div>

            {/* Pipeline Stage Monitoring Grid */}
            <div className="grid grid-cols-12 gap-4">
              {/* Left Stage Pipeline (7 cols) */}
              <div className="col-span-7 bg-[#06070a]/40 border border-white/[0.02] p-3 rounded-2xl flex flex-col gap-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">AI Pipeline Execution</span>
                
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {[
                    { label: 'Audio Enhancement', status: 'Completed', time: '1.2s' },
                    { label: 'Noise Reduction Filter', status: 'Completed', time: '0.8s' },
                    { label: 'Voice Activity Detection', status: 'Completed', time: '0.4s' },
                    { label: 'Whisper Speech Recognition', status: 'Running', time: '4.8s' },
                    { label: 'Speaker Diarization', status: 'Waiting', time: '—' },
                    { label: 'Transcript Post-Processing', status: 'Waiting', time: '—' },
                    { label: 'Meeting intelligence & Summary', status: 'Waiting', time: '—' }
                  ].map((pipe, idx) => (
                    <div key={pipe.label} className="flex items-center justify-between text-[10px] border-b border-white/[0.01] pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          pipe.status === 'Completed' ? 'bg-emerald-500' : pipe.status === 'Running' ? 'bg-purple-500 animate-pulse' : 'bg-slate-700'
                        }`} />
                        <span className="text-slate-300 font-medium">{pipe.label}</span>
                      </div>
                      <span className={`font-mono text-[9px] ${
                        pipe.status === 'Completed' ? 'text-emerald-400' : pipe.status === 'Running' ? 'text-purple-400 font-bold' : 'text-slate-500'
                      }`}>
                        {pipe.status} ({pipe.time})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Diagnostic Stats (5 cols) */}
              <div className="col-span-5 flex flex-col gap-3">
                {/* Confidence Card */}
                <div className="bg-[#0c0d12]/50 border border-white/[0.02] p-3 rounded-2xl">
                  <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2">Confidence Ratings</span>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Audio Quality</span>
                      <span className="text-emerald-400 font-mono font-bold">98%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Speech Clarity</span>
                      <span className="text-emerald-400 font-mono font-bold">96%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">VAD Confidence</span>
                      <span className="text-purple-400 font-mono font-bold">98%</span>
                    </div>
                  </div>
                </div>

                {/* Info Card */}
                <div className="bg-[#0c0d12]/50 border border-white/[0.02] p-3 rounded-2xl text-[9px] text-slate-500 space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Threads Active</span><span className="text-slate-300 font-mono">8 Cores</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Inference Device</span><span className="text-purple-400 font-mono">ONNX GPU</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Security Profile</span><span className="text-emerald-400 font-bold font-mono">100% Local</span></div>
                </div>
              </div>
            </div>

            {/* Bottom logs */}
            <div className="bg-[#06070a]/40 border border-white/[0.02] p-3 rounded-2xl">
              <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2">Live AI Operations Log</span>
              <div className="font-mono text-[8px] text-slate-500 space-y-1">
                <div>[11:54:30] Initializing local ONNX model runtime...</div>
                <div>[11:54:32] Applying spectral subtraction noise reduction...</div>
                <div className="text-purple-400 animate-pulse">[11:54:34] Extracting Mel-frequency spectrogram features...</div>
              </div>
            </div>

            {/* Simulated success bypass */}
            <div className="flex gap-3 justify-end pt-2 border-t border-white/[0.02]">
              <span className="text-[9px] text-slate-600 self-center font-mono mr-auto">Please wait while transcription completes...</span>
              <button 
                onClick={() => {
                  // Direct bypass
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Simulating Offline AI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
