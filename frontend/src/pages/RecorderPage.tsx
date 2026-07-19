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

// ─── VU Meter Component ────────────────────────────────────────────────────────
interface VUMeterProps {
  level: number;       // 0–1 RMS level
  peak: number;        // 0–1 peak hold
  label: string;
  side: 'L' | 'R';
  recordingState: 'idle' | 'recording' | 'paused' | 'stopped';
}

const VUMeter: React.FC<VUMeterProps> = ({ level, peak, label, side, recordingState }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const segmentCount = 32;
    const segH = Math.floor(H / segmentCount) - 1;
    const gap = 1;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#080a0e';
    ctx.fillRect(0, 0, W, H);

    const activeSegs = Math.round(level * segmentCount);
    const peakSeg = Math.round(peak * segmentCount);

    for (let i = 0; i < segmentCount; i++) {
      const segIdx = segmentCount - 1 - i; // bottom = 0
      const y = i * (segH + gap);

      let baseColor: string;
      if (segIdx < segmentCount * 0.65) {
        baseColor = 'rgba(16,185,129,'; // green
      } else if (segIdx < segmentCount * 0.85) {
        baseColor = 'rgba(245,158,11,'; // yellow
      } else {
        baseColor = 'rgba(239,68,68,'; // red
      }

      const isActive = segIdx < activeSegs;
      const isPeak = segIdx === peakSeg && recordingState === 'recording';

      if (isPeak) {
        ctx.fillStyle = segIdx >= segmentCount * 0.85
          ? 'rgba(239,68,68,1)'
          : segIdx >= segmentCount * 0.65
          ? 'rgba(245,158,11,1)'
          : 'rgba(16,185,129,1)';
      } else if (isActive) {
        ctx.fillStyle = `${baseColor}${recordingState === 'paused' ? '0.3)' : '0.9)'}`;
      } else {
        ctx.fillStyle = `${baseColor}0.07)`;
      }

      const radius = 1.5;
      ctx.beginPath();
      ctx.roundRect(0, y, W, segH, radius);
      ctx.fill();
    }

    // Channel label
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font = `bold 8px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(side, W / 2, H + 11);

    // dB value
    const db = level > 0.001 ? Math.round(20 * Math.log10(level)) : -60;
    ctx.fillStyle = 'rgba(203,213,225,0.7)';
    ctx.font = `bold 7px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`${db > 0 ? '+' : ''}${db}`, W / 2, H + 21);
  }, [level, peak, recordingState, side]);

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: '18px' }}>
      <canvas
        ref={canvasRef}
        width={18}
        height={140}
        style={{ borderRadius: '3px', display: 'block' }}
      />
      <div style={{ height: '22px' }} />
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
  const [sampleRateSelect, setSampleRateSelect] = useState('16000 Hz');
  const [bitDepthSelect, setBitDepthSelect] = useState('16-bit');
  const [formatSelect, setFormatSelect] = useState('FLAC');
  const [bookmarked, setBookmarked] = useState(false);
  const [showMarkerNotification, setShowMarkerNotification] = useState(false);
  const [markers, setMarkers] = useState<number[]>([]);
  const [audioQuality, setAudioQuality] = useState(98);

  // ── System metrics ──
  const [cpuUsage, setCpuUsage] = useState(9);
  const [ramUsage, setRamUsage] = useState(38);
  const [gpuUsage, setGpuUsage] = useState(4);
  const [diskSpeed, setDiskSpeed] = useState(1.8);
  const [latency, setLatency] = useState(12);

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
      setCpuUsage(4); setGpuUsage(2); setDiskSpeed(0.1); setLatency(8);
      return;
    }
    const id = setInterval(() => {
      setCpuUsage(Math.floor(8 + Math.random() * 6));
      setRamUsage(Math.floor(38 + Math.random() * 3));
      setGpuUsage(Math.floor(3 + Math.random() * 4));
      setDiskSpeed(Number((1.5 + Math.random() * 1.2).toFixed(1)));
      setLatency(Math.floor(10 + Math.random() * 5));
      setAudioQuality(Math.floor(94 + Math.random() * 5));
    }, 2000);
    return () => clearInterval(id);
  }, [recordingState]);

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
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.stroke();

        // Subtle horizontal grid
        [0.25, 0.75].forEach(frac => {
          ctx.strokeStyle = 'rgba(255,255,255,0.015)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 8]);
          ctx.beginPath();
          ctx.moveTo(0, H * frac);
          ctx.lineTo(W, H * frac);
          ctx.stroke();
          ctx.setLineDash([]);
        });

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
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 1; ctx.setLineDash([4, 8]);
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      ctx.setLineDash([]);

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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent relative p-5 pb-24">

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
          className="col-span-12 lg:col-span-3 bg-slate-950/45 border border-white/[0.03] premium-card-interaction rounded-3xl p-5 flex flex-col gap-4 overflow-y-auto backdrop-blur-md shadow-xl scrollbar-none select-none"
        >
          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-1">Capture Options</h3>
            <p className="text-[10px] text-slate-500">Configure hardware routing parameters.</p>
          </div>

          {/* Source selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase">Input Source</label>
            <div className="grid grid-cols-3 bg-slate-900/60 border border-slate-850 p-0.5 rounded-xl">
              {(['mic', 'system', 'both'] as const).map((src, i) => (
                <button
                  key={src}
                  onClick={() => setCaptureSource(src)}
                  className={`py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all ${
                    captureSource === src ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {src === 'mic' && <><Radio className="w-3 h-3" /> Mic</>}
                  {src === 'system' && <><Monitor className="w-3 h-3" /> Sys</>}
                  {src === 'both' && <><Disc3 className="w-3 h-3" /> Mix</>}
                </button>
              ))}
            </div>
          </div>

          {/* Input Gain */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px]">
              <label className="text-slate-500 font-bold uppercase">Input Gain</label>
              <span className="font-mono text-slate-400 font-semibold">{inputGain}%</span>
            </div>
            <input
              type="range" min="0" max="100" value={inputGain}
              onChange={e => setInputGain(Number(e.target.value))}
              className="w-full accent-purple-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
            />
          </div>

          {/* Monitor toggle */}
          <div className="flex items-center justify-between bg-slate-900/30 border border-slate-900 p-2.5 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-300 font-bold uppercase">Monitor Audio</span>
              <span className="text-[8px] text-slate-500">Output local mic feed</span>
            </div>
            <button
              onClick={() => setMonitoring(!monitoring)}
              className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${monitoring ? 'bg-purple-600' : 'bg-slate-800'}`}
            >
              <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${monitoring ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="h-px bg-white/[0.02]" />

          {/* DSP Toggles */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">DSP & AI Pre-Processing</h4>
            {[
              { label: 'Noise Suppression', value: noiseSuppression, set: setNoiseSuppression },
              { label: 'Echo Cancellation', value: echoCancellation, set: setEchoCancellation },
              { label: 'Speech Enhancement', value: speechEnhancement, set: setSpeechEnhancement },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex items-center justify-between bg-slate-900/20 border border-slate-900/60 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-300 font-semibold">{label}</span>
                <button
                  onClick={() => set(!value)}
                  className={`w-7 h-4 rounded-full p-0.5 transition-colors ${value ? 'bg-purple-600' : 'bg-slate-800'}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${value ? 'translate-x-3' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/[0.02] mt-auto" />

          {/* Format settings */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Storage & Target Format</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900 p-2 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 font-bold uppercase">Sample Rate</span>
                <select value={sampleRateSelect} onChange={e => setSampleRateSelect(e.target.value)}
                  className="bg-transparent border-none p-0 text-[10px] text-slate-200 font-semibold focus:ring-0 text-center cursor-pointer outline-none">
                  <option value="16000 Hz" className="bg-slate-950 text-white">16000 Hz</option>
                  <option value="44100 Hz" className="bg-slate-950 text-white">44100 Hz</option>
                  <option value="48000 Hz" className="bg-slate-950 text-white">48000 Hz</option>
                </select>
              </div>
              <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900 p-2 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 font-bold uppercase">Bit Depth</span>
                <select value={bitDepthSelect} onChange={e => setBitDepthSelect(e.target.value)}
                  className="bg-transparent border-none p-0 text-[10px] text-slate-200 font-semibold focus:ring-0 text-center cursor-pointer outline-none">
                  <option value="16-bit" className="bg-slate-950 text-white">16-bit</option>
                  <option value="24-bit" className="bg-slate-950 text-white">24-bit</option>
                  <option value="32-bit Float" className="bg-slate-950 text-white">32-bit Float</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-900/40 border border-slate-900 p-2 rounded-xl">
              <span className="text-[8px] text-slate-500 font-bold uppercase pl-1">Codec Container</span>
              <select value={formatSelect} onChange={e => setFormatSelect(e.target.value)}
                className="bg-transparent border-none p-0 text-[10px] text-slate-200 font-semibold focus:ring-0 text-right cursor-pointer outline-none pr-1">
                <option value="FLAC" className="bg-slate-950 text-white">FLAC (Lossless)</option>
                <option value="WAV" className="bg-slate-950 text-white">WAV (PCM)</option>
                <option value="MP3" className="bg-slate-950 text-white">MP3 (Compressed)</option>
              </select>
            </div>
          </div>
        </aside>

        {/* ── CENTER STUDIO ── */}
        <main
          onMouseMove={handleMouseMove}
          className="col-span-12 lg:col-span-6 flex flex-col h-full bg-slate-950/45 border border-white/[0.03] premium-card-interaction rounded-3xl p-6 relative overflow-y-auto backdrop-blur-md shadow-xl gap-5 scrollbar-none"
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

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* HERO WAVEFORM + VU METERS ROW                              */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 z-20 flex items-stretch gap-3 w-full">

            {/* Left VU Meter */}
            <div className="flex flex-col items-center pt-1 pb-0 gap-1" style={{ width: '22px' }}>
              <span className="text-[7px] text-slate-600 font-bold uppercase mb-0.5">L</span>
              <VUMeter level={vuLeft} peak={vuLeftPeak} label="L" side="L" recordingState={recordingState} />
            </div>

            {/* Main Waveform Canvas */}
            <div
              className="flex-1 bg-[#050508]/95 rounded-2xl border border-white/[0.04] shadow-[inset_0_2px_16px_rgba(0,0,0,0.95)] overflow-hidden relative"
              style={{ height: '160px' }}
            >
              {/* Corner dB scale labels */}
              <div className="absolute top-2 left-3 text-[7px] text-slate-700 font-mono pointer-events-none">0 dB</div>
              <div className="absolute top-2 right-3 text-[7px] text-slate-700 font-mono pointer-events-none select-none">
                {sampleRateSelect} · {channels}ch · {bitDepthSelect}
              </div>
              <div className="absolute bottom-2 left-3 text-[7px] text-slate-700 font-mono pointer-events-none">-∞</div>

              <canvas
                ref={mainCanvasRef}
                width={800}
                height={160}
                className="w-full h-full block"
                style={{
                  opacity: recordingState === 'paused' ? 0.4 : 1,
                  transition: 'opacity 0.4s ease',
                }}
              />

              {/* Idle overlay hint */}
              {recordingState === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">
                    Press Record to Begin
                  </span>
                </div>
              )}

              {/* Paused overlay */}
              {recordingState === 'paused' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-amber-600/60 font-bold uppercase tracking-widest">
                    ⏸ Paused
                  </span>
                </div>
              )}
            </div>

            {/* Right VU Meter */}
            <div className="flex flex-col items-center pt-1 pb-0 gap-1" style={{ width: '22px' }}>
              <span className="text-[7px] text-slate-600 font-bold uppercase mb-0.5">R</span>
              <VUMeter level={vuRight} peak={vuRightPeak} label="R" side="R" recordingState={recordingState} />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* COMPACT RECORDING METADATA / STATUS CHIPS                  */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 z-20 grid grid-cols-4 gap-3 bg-slate-900/15 border border-white/[0.02] p-2.5 rounded-2xl">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Duration</span>
                <span className="text-xs font-extrabold text-white font-mono leading-none">
                  {recordingState === 'idle' ? '00:00' : formatTime(duration)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-1">
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">File Size</span>
                <span className="text-xs font-extrabold text-slate-300 font-mono leading-none">
                  {recordingState === 'idle' ? '0.00 MB' : `${calculatedSize} MB`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Sample Rate</span>
                <span className="text-xs font-extrabold text-slate-300 font-mono leading-none">
                  {sampleRateSelect.replace(' Hz', '')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Format</span>
                <span className="text-xs font-extrabold text-slate-300 font-mono leading-none">
                  {formatSelect} · {bitDepthSelect.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* COMPRESSED SINGLE-ROW AUDIO LEVEL MONITOR                  */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 z-20 bg-slate-900/25 border border-white/[0.025] rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-purple-400" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Level Monitor</span>
              </div>
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase font-mono ${
                isSpeech && recordingState === 'recording'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800/60 text-slate-600 border border-slate-800'
              }`}>
                {isSpeech && recordingState === 'recording' ? '🎙 Speech' : 'Silence'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Gain / Sens</span>
                <span className="text-xs font-bold text-white font-mono">{inputGain}% / {Math.round(inputGain * 0.95)}%</span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Loudness / Peak</span>
                <span className="text-xs font-bold text-slate-300 font-mono">
                  {recordingState === 'recording' ? `${currentLoudness}%` : '—'} / {recordingState === 'recording' ? `${peakLevel}%` : '—'}
                </span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Noise / Dynamic</span>
                <span className="text-xs font-bold text-slate-300 font-mono">
                  {noiseFloor}dB / {recordingState === 'recording' ? `${dynamicRange}dB` : '—'}
                </span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Avg / Quality</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {recordingState === 'recording' ? `${avgLevel}%` : '—'} / {audioQuality}%
                </span>
              </div>
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

        {/* ── RIGHT LIVE STATUS PANEL ── */}
        <aside
          onMouseMove={handleMouseMove}
          className="col-span-12 lg:col-span-3 bg-slate-950/45 border border-white/[0.03] premium-card-interaction rounded-3xl p-5 flex flex-col gap-3 overflow-y-auto backdrop-blur-md shadow-xl scrollbar-none select-none pb-6"
        >
          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-1">Signal Health</h3>
            <p className="text-[10px] text-slate-500">Live hardware & stream diagnostics.</p>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Audio Quality */}
            <div className="relative bg-[#0d0e12]/60 border border-slate-900/80 p-3 rounded-2xl flex flex-col gap-1.5 overflow-hidden">
              {/* Top glow accent */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <AudioLines className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Audio Quality</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase font-mono">EXCELLENT</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5">
                <span>Signal Strength</span><span className="font-mono">{audioQuality}%</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${audioQuality}%` }} />
              </div>
            </div>

            {/* Noise Floor */}
            <div className="relative bg-[#0d0e12]/60 border border-slate-900/80 p-3 rounded-2xl flex flex-col gap-1.5 overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Noise Floor</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold uppercase font-mono">{noiseFloor} dB</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5">
                <span>Interference Ratio</span><span className="font-mono">Low</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>

            {/* VAD State */}
            <div className="relative bg-[#0d0e12]/60 border border-slate-900/80 p-3 rounded-2xl flex flex-col gap-1.5 overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">VAD State</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold uppercase font-mono">
                  {recordingState === 'recording' && isSpeech ? 'SPEECH' : 'SILENCE'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5">
                <span>Confidence Rating</span>
                <span className="font-mono">{recordingState === 'recording' && isSpeech ? '96%' : '0%'}</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: recordingState === 'recording' && isSpeech ? '96%' : '5%' }} />
              </div>
            </div>

            {/* Clipping */}
            <div className="relative bg-[#0d0e12]/60 border border-slate-900/80 p-3 rounded-2xl flex flex-col gap-1.5 overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-500/35 to-transparent" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Gauge className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Clipping</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase font-mono">NOMINAL</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5">
                <span>Peak Headroom</span><span className="font-mono">-6.2 dB</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>

            {/* System Resources */}
            <div className="relative bg-[#0d0e12]/60 border border-slate-900/80 p-3 rounded-2xl flex flex-col gap-2 overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-500/35 to-transparent" />
              <div className="flex items-center gap-1.5 text-slate-400 border-b border-white/[0.02] pb-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Resource Allocation</span>
              </div>
              <div className="space-y-1.5 text-[9px]">
                {[
                  { label: 'CPU Threads', value: `${cpuUsage}%`, pct: cpuUsage },
                  { label: 'RAM Footprint', value: `${ramUsage}%`, pct: ramUsage },
                  { label: 'GPU Compute', value: `${gpuUsage}%`, pct: gpuUsage },
                ].map(({ label, value, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span>{label}</span><span className="font-mono">{value}</span>
                    </div>
                    <div className="w-full h-0.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-400 transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-slate-300 pt-1 border-t border-white/[0.02] mt-1">
                  <div className="flex items-center gap-1"><HardDrive className="w-2.5 h-2.5 text-slate-500" /><span>Disk IO</span></div>
                  <span className="font-mono">{diskSpeed} MB/s</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <div className="flex items-center gap-1"><Activity className="w-2.5 h-2.5 text-slate-500" /><span>AI Latency</span></div>
                  <span className="font-mono">{latency} ms</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── BOTTOM DOCK ── */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex items-center gap-4 bg-slate-950/80 border border-white/[0.04] px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden select-none">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />

          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-2 rounded-xl border transition-all ${
              bookmarked ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Bookmark"
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>

          <button
            onClick={handleAddMarker}
            className="p-2 rounded-xl border bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 transition-all"
            title="Insert Timeline Marker"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-6 bg-white/[0.03]" />

          <div className="flex items-center gap-3">
            {recordingState === 'idle' && (
              <button onClick={startRecording}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-lg shadow-purple-500/10 active:scale-95 transition-all cursor-pointer">
                <Play className="w-3.5 h-3.5 fill-current" /><span>Record</span>
              </button>
            )}
            {recordingState === 'recording' && (
              <>
                <button onClick={pauseRecording}
                  className="px-4 py-2.5 rounded-xl bg-amber-600/10 border border-amber-500/20 hover:bg-amber-600/20 text-amber-400 font-bold text-[11px] flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                  <Pause className="w-3.5 h-3.5 fill-current" /><span>Pause</span>
                </button>
                <button onClick={stopRecording}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-lg shadow-rose-600/15 active:scale-95 transition-all cursor-pointer">
                  <Power className="w-3.5 h-3.5" /><span>Stop</span>
                </button>
              </>
            )}
            {recordingState === 'paused' && (
              <>
                <button onClick={resumeRecording}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-lg shadow-purple-500/10 active:scale-95 transition-all cursor-pointer">
                  <Play className="w-3.5 h-3.5 fill-current" /><span>Resume</span>
                </button>
                <button onClick={stopRecording}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-lg shadow-rose-600/15 active:scale-95 transition-all cursor-pointer">
                  <Power className="w-3.5 h-3.5" /><span>Stop</span>
                </button>
              </>
            )}
            {recordingState === 'stopped' && (
              <button onClick={saveRecording} disabled={uploading}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-lg shadow-purple-600/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{uploading ? 'Saving...' : 'Save & Transcribe'}</span>
              </button>
            )}
          </div>

          <div className="w-px h-6 bg-white/[0.03]" />

          <div className="flex items-center gap-1 text-[9px] text-slate-600 font-medium">
            <Keyboard className="w-3.5 h-3.5" /><span>Space to Toggle</span>
          </div>

          <AnimatePresence>
            {showMarkerNotification && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 whitespace-nowrap"
              >
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                Marker added at {formatTime(duration)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
