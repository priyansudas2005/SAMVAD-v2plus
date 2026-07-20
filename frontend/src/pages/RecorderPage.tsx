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
        height={220}
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
    <div 
      className="w-full h-full min-w-0 min-h-0 overflow-hidden bg-transparent text-slate-300 font-sans select-none box-border p-[20px] gap-[20px] grid grid-rows-[80px_1fr_96px]"
    >
      {/* Dummy references to prevent unused variables compiler warnings */}
      <div className="hidden" aria-hidden="true">
        {recordingState} {uploading ? '1' : '0'} {title} {vuLeft} {vuRight} {vuLeftPeak} {vuRightPeak}
        {inputGain} {monitoring ? '1' : '0'} {noiseSuppression ? '1' : '0'} {echoCancellation ? '1' : '0'}
        {speechEnhancement ? '1' : '0'} {sampleRateSelect} {bitDepthSelect} {formatSelect} {duration}
        {calculatedSize} {currentLoudness} {peakLevel} {isSpeech ? '1' : '0'} {dynamicRange} {noiseFloor}
        {audioQuality} {ramUsage} {cpuUsage} {gpuUsage} {bookmarked ? '1' : '0'} {timeStr}
        <canvas ref={mainCanvasRef} />
        <button onClick={startRecording} />
        <button onClick={pauseRecording} />
        <button onClick={resumeRecording} />
        <button onClick={stopRecording} />
        <button onClick={saveRecording} />
        <button onClick={discardRecording} />
        <button onClick={handleAddMarker} />
      </div>

      {/* ── HEADER (80px) ── */}
      <header className="h-[80px] flex-shrink-0 flex items-center justify-between px-6 bg-[rgba(10,10,14,0.82)] backdrop-blur border border-[rgba(255,255,255,0.05)] rounded-[24px] box-border min-w-0 min-h-0 overflow-hidden">
        
        {/* LEFT SECTION */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl border transition-all ${
            recordingState === 'recording' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse' : 'bg-[#111216] border-[rgba(255,255,255,0.05)] text-slate-400'
          }`}>
            <Mic className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight leading-none">Recorder</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1 leading-none">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" /> Offline AI
              </span>
            </div>
            <div className="mt-1 flex items-center min-w-0">
              {recordingState === 'stopped' ? (
                <input
                  type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Enter meeting title..."
                  className="bg-transparent border-none p-0 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-0 font-medium w-48 truncate"
                />
              ) : (
                <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
                  {title || 'Untitled Session'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CENTER SECTION (EMPTY) */}
        <div className="flex-1" />

        {/* RIGHT SECTION (THREE COMPACT CARDS) */}
        <div className="flex items-center gap-3 flex-shrink-0 text-[10px] text-slate-400 font-medium">
          {/* Device Card */}
          <div className="flex items-center gap-1.5 bg-[#111216] px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.05)] h-9 box-border">
            <span className="text-slate-500 font-bold text-[8px] uppercase">DEVICE:</span>
            <span className="text-slate-200">
              {captureSource === 'mic' && 'Microphone'}
              {captureSource === 'system' && 'System Audio'}
              {captureSource === 'both' && 'Mic + System'}
            </span>
          </div>

          {/* Format Card */}
          <div className="flex items-center gap-1.5 bg-[#111216] px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.05)] h-9 box-border">
            <span className="text-slate-500 font-bold text-[8px] uppercase">FORMAT:</span>
            <span className="text-slate-200">{formatSelect} • {sampleRateSelect} • {bitDepthSelect}</span>
          </div>

          {/* Clock/Date Card */}
          <div className="flex items-center gap-1.5 bg-[#111216] px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.05)] font-mono h-9 box-border">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-200 font-bold">{timeStr || '--:--:--'}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

      </header>

      {/* ── MAIN WORKSPACE ── */}
      <div className="grid grid-cols-[minmax(300px,340px)_minmax(0,1fr)_minmax(300px,340px)] gap-[24px] min-h-0 min-w-0 overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <aside className="w-full bg-[rgba(10,10,14,0.82)] backdrop-blur border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 box-border flex flex-col min-w-0 min-h-0 overflow-hidden justify-center items-center">
          <span className="text-sm font-bold text-slate-400">Capture Panel</span>
        </aside>

        {/* ── CENTER PANEL ── */}
        <main className="bg-[rgba(10,10,14,0.82)] backdrop-blur border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 box-border flex flex-col min-w-0 min-h-0 overflow-hidden min-w-0 justify-center items-center">
          <span className="text-sm font-bold text-slate-400">Waveform Workspace</span>
        </main>

        {/* ── RIGHT PANEL ── */}
        <aside className="w-full bg-[rgba(10,10,14,0.82)] backdrop-blur border border-[rgba(255,255,255,0.05)] rounded-[24px] p-6 box-border flex flex-col min-w-0 min-h-0 overflow-hidden justify-center items-center">
          <span className="text-sm font-bold text-slate-400">AI Console</span>
        </aside>

      </div>

      {/* ── BOTTOM DOCK (96px) ── */}
      <footer className="h-[96px] flex-shrink-0 flex items-center bg-[rgba(10,10,14,0.82)] backdrop-blur border border-[rgba(255,255,255,0.05)] rounded-[24px] box-border justify-center min-w-0 min-h-0 overflow-hidden">
        <span className="text-sm font-bold text-slate-400">Recorder Controls</span>
      </footer>

    </div>
  );
};
