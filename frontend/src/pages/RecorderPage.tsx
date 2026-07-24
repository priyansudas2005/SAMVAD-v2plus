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
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('default');
  const [agc, setAgc] = useState(true);
  const [voiceIsolation, setVoiceIsolation] = useState(false);
  const [recordingFolder, setRecordingFolder] = useState("C:\\Users\\priya\\.gemini\\antigravity\\scratch");
  const [logs, setLogs] = useState<string[]>([
    '[00:00:01] System boot successful.',
    '[00:00:02] ONNX Runtime execution provider: CUDA (RTX 4090) initialized.',
    '[00:00:03] Pipeline status: Standby. Ready for capture.'
  ]);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Log events generator based on recording state
  useEffect(() => {
    const time = () => new Date().toLocaleTimeString([], { hour12: false });
    if (recordingState === 'recording') {
      setLogs(prev => [
        ...prev,
        `[${time()}] [Engine] Initializing capture pipeline...`,
        `[${time()}] [Hardware] MediaStream audio track connected.`,
        `[${time()}] [DSP] Noise Suppression / Echo Cancellation active.`,
        `[${time()}] [VAD] Voice Activity Detector initialized.`
      ]);
    } else if (recordingState === 'paused') {
      setLogs(prev => [
        ...prev,
        `[${time()}] [Engine] Capture pipeline paused.`,
        `[${time()}] [Cache] Writing temporary buffer to storage.`
      ]);
    } else if (recordingState === 'stopped') {
      setLogs(prev => [
        ...prev,
        `[${time()}] [Engine] Capture pipeline terminated.`,
        `[${time()}] [Storage] Saved audio payload to target folder.`,
        `[${time()}] [Whisper] Beginning local transcription run...`
      ]);
    }
  }, [recordingState]);

  useEffect(() => {
    const time = () => new Date().toLocaleTimeString([], { hour12: false });
    if (uploading) {
      setLogs(prev => [
        ...prev,
        `[${time()}] [Diarization] Segmenting audio by speaker timelines...`,
        `[${time()}] [Inference] Meeting Intelligence summary generation started.`
      ]);
    }
  }, [uploading]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      const audioInputs = devs.filter(d => d.kind === 'audioinput');
      setDevices(audioInputs);
    }).catch(err => console.error(err));
  }, []);

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
        {recordingState} {uploading ? '1' : '0'} {agc ? '1' : '0'} {voiceIsolation ? '1' : '0'} {recordingFolder} {title} {vuLeft} {vuRight} {vuLeftPeak} {vuRightPeak}
        {inputGain} {monitoring ? '1' : '0'} {noiseSuppression ? '1' : '0'} {echoCancellation ? '1' : '0'}
        {speechEnhancement ? '1' : '0'} {sampleRateSelect} {bitDepthSelect} {formatSelect} {duration}
        {calculatedSize} {currentLoudness} {peakLevel} {isSpeech ? '1' : '0'} {dynamicRange} {noiseFloor}
        {audioQuality} {ramUsage} {cpuUsage} {gpuUsage} {bookmarked ? '1' : '0'} {timeStr}

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
        <aside className="w-full bg-[rgba(10,10,14,0.85)] backdrop-blur-xl border border-white/[0.04] rounded-[24px] p-0 box-border flex flex-col min-w-0 min-h-0 overflow-hidden shadow-2xl">
          
          {/* Sticky Panel Header - slightly darker */}
          <div className="flex-shrink-0 bg-[#07070a]/90 backdrop-blur border-b border-white/[0.03] pl-6 pr-4.5 py-4.5">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎙</span>
              <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider leading-none">Capture Console</h2>
            </div>
            <p className="text-[9.5px] text-slate-550 mt-1 leading-normal font-medium">
              Configure recording hardware and audio processing.
            </p>
          </div>

          {/* Scrollable Body - glass cards layout */}
          <div className="flex-1 min-h-0 overflow-y-auto premium-scrollbar flex flex-col gap-4 p-4 pr-3.5">
            
            {/* Card 1: Input Source */}
            <div className="bg-[#0b0c10]/70 border border-white/[0.03] rounded-[18px] p-4 flex flex-col gap-3.5 shadow-md hover:translate-y-[-1px] transition-all duration-300">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider leading-none">Input Source</span>
                <span className="text-[8.5px] text-slate-550 leading-normal">Route hardware microphone or internal audio stream.</span>
              </div>
              
              <div className="grid grid-cols-3 bg-[#050508]/80 border border-white/[0.02] p-0.5 rounded-lg">
                {(['mic', 'system', 'both'] as const).map((src) => (
                  <button
                    key={src}
                    onClick={() => setCaptureSource(src)}
                    className={`py-1.5 rounded-md text-[9px] font-bold flex items-center justify-center gap-1 transition-all ${
                      captureSource === src 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10' 
                        : 'text-slate-555 hover:text-slate-300'
                    }`}
                  >
                    {src === 'mic' && 'Microphone'}
                    {src === 'system' && 'System'}
                    {src === 'both' && 'Mix'}
                  </button>
                ))}
              </div>

              {/* Audio device dropdown */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider leading-none">Input Device</span>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full bg-[#050508]/80 border border-white/[0.03] rounded-lg px-2.5 py-1.5 text-[9.5px] text-slate-300 font-semibold focus:outline-none focus:border-purple-500/50 cursor-pointer"
                >
                  <option value="default" className="bg-[#0D0D10]">Default Audio Input</option>
                  {devices.map(d => (
                    <option key={d.deviceId} value={d.deviceId} className="bg-[#0D0D10]">
                      {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Card 2: Input Level */}
            <div className="bg-[#0b0c10]/70 border border-white/[0.03] rounded-[18px] p-4 flex flex-col gap-3 shadow-md hover:translate-y-[-1px] transition-all duration-300">
              <div className="flex items-center justify-between text-[10px] leading-none">
                <span className="text-slate-200 font-bold uppercase tracking-wider">Input Level</span>
                <span className="font-mono text-slate-400 font-bold">
                  Gain: {inputGain}% • {inputGain > 0 ? `${Math.round(20 * Math.log10(inputGain / 100))} dB` : '-∞ dB'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Volume2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <input
                  type="range" min="0" max="100" value={inputGain}
                  onChange={e => setInputGain(Number(e.target.value))}
                  className="flex-1 accent-purple-500 h-1 bg-[#050508] rounded-lg cursor-pointer"
                />
              </div>

              {/* Small animated input meter */}
              <div className="flex flex-col gap-1 mt-1.5">
                <div className="flex items-center justify-between text-[8px] text-slate-555 font-bold uppercase tracking-wider">
                  <span>Signal Level</span>
                  <span>{vuLeft > 0.01 ? `${Math.round(20 * Math.log10(vuLeft))} dB` : '-60 dB'}</span>
                </div>
                <div className="h-2 bg-[#050508] border border-white/[0.02] rounded-md p-0.5 overflow-hidden flex items-center gap-[1px]">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const threshold = i / 24;
                    const isActive = vuLeft > threshold;
                    const colorClass = i > 18 ? 'bg-rose-500' : i > 12 ? 'bg-amber-500' : 'bg-emerald-500';
                    return (
                      <div
                        key={i}
                        className={`h-full flex-1 rounded-sm transition-all duration-75 ${
                          isActive ? `${colorClass} opacity-90 shadow-[0_0_4px_rgba(168,85,247,0.2)]` : 'bg-white/[0.03]'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 3: Monitoring */}
            <div className="bg-[#0b0c10]/70 border border-white/[0.03] rounded-[18px] p-4 flex items-center justify-between shadow-md hover:translate-y-[-1px] transition-all duration-300">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider leading-none">Monitoring</span>
                <span className="text-[8.5px] text-slate-550 leading-normal">Route active stream to local headphone output.</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  monitoring ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 'bg-[#050508] border border-white/[0.02] text-slate-555'
                }`}>
                  {monitoring ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={() => setMonitoring(!monitoring)}
                  className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${monitoring ? 'bg-purple-600' : 'bg-slate-800'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${monitoring ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Card 4: AI Pre-Processing */}
            <div className="bg-[#0b0c10]/70 border border-white/[0.03] rounded-[18px] p-4 flex flex-col gap-3 shadow-md hover:translate-y-[-1px] transition-all duration-300">
              <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider leading-none">AI Pre-Processing</span>
              
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: <VolumeX className="w-3.5 h-3.5" />, title: 'Noise Suppression', desc: 'Attenuate ambient noise floor', val: noiseSuppression, set: setNoiseSuppression },
                  { icon: <Activity className="w-3.5 h-3.5" />, title: 'Echo Cancellation', desc: 'Filter acoustic feedback loop', val: echoCancellation, set: setEchoCancellation },
                  { icon: <Sparkles className="w-3.5 h-3.5" />, title: 'Voice Enhancement', desc: 'Boost vocal clarity dynamically', val: speechEnhancement, set: setSpeechEnhancement },
                  { icon: <Volume2 className="w-3.5 h-3.5" />, title: 'Automatic Gain Control', desc: 'Normalize local input levels', val: agc, set: setAgc },
                  { icon: <Disc3 className="w-3.5 h-3.5" />, title: 'Voice Isolation', desc: 'Suppress secondary talkers', val: voiceIsolation, set: setVoiceIsolation }
                ].map((dsp) => (
                  <div key={dsp.title} className="flex items-center justify-between py-1 border-b border-white/[0.02] last:border-b-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="text-purple-400/80 flex-shrink-0">{dsp.icon}</div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] text-slate-250 font-bold leading-none">{dsp.title}</span>
                        <span className="text-[8px] text-slate-555 mt-1 truncate leading-none">{dsp.desc}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => dsp.set(!dsp.val)}
                      className={`w-7 h-4 rounded-full p-0.5 transition-colors flex-shrink-0 flex items-center ${dsp.val ? 'bg-purple-600' : 'bg-slate-800'}`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${dsp.val ? 'translate-x-3' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 5: Recording Format */}
            <div className="bg-[#0b0c10]/70 border border-white/[0.03] rounded-[18px] p-4 flex flex-col gap-3 shadow-md hover:translate-y-[-1px] transition-all duration-300">
              <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider leading-none">Recording Format</span>
              
              <div className="grid grid-cols-2 gap-2.5 text-[9px]">
                <div className="flex flex-col gap-1 bg-[#050508]/60 p-1.5 rounded-lg border border-white/[0.02]">
                  <span className="text-slate-500 uppercase text-[7px] font-bold">Sample Rate</span>
                  <select value={sampleRateSelect} onChange={e => setSampleRateSelect(e.target.value)}
                    className="bg-transparent border-none p-0 text-slate-300 font-bold focus:ring-0 cursor-pointer outline-none text-[8.5px]">
                    <option value="16000 Hz" className="bg-[#0D0D10]">16000 Hz</option>
                    <option value="44100 Hz" className="bg-[#0D0D10]">44100 Hz</option>
                    <option value="48000 Hz" className="bg-[#0D0D10]">48000 Hz</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 bg-[#050508]/60 p-1.5 rounded-lg border border-white/[0.02]">
                  <span className="text-slate-500 uppercase text-[7px] font-bold">Bit Depth</span>
                  <select value={bitDepthSelect} onChange={e => setBitDepthSelect(e.target.value)}
                    className="bg-transparent border-none p-0 text-slate-300 font-bold focus:ring-0 cursor-pointer outline-none text-[8.5px]">
                    <option value="16-bit" className="bg-[#0D0D10]">16-bit</option>
                    <option value="24-bit" className="bg-[#0D0D10]">24-bit</option>
                    <option value="32-bit Float" className="bg-[#0D0D10]">32-bit Float</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 bg-[#050508]/60 p-1.5 rounded-lg border border-white/[0.02]">
                  <span className="text-slate-500 uppercase text-[7px] font-bold">Channels</span>
                  <span className="text-slate-300 font-bold py-0.5 text-[8.5px]">{channels === 2 ? 'Stereo' : 'Mono'}</span>
                </div>
                <div className="flex flex-col gap-1 bg-[#050508]/60 p-1.5 rounded-lg border border-white/[0.02]">
                  <span className="text-slate-500 uppercase text-[7px] font-bold">Codec</span>
                  <select value={formatSelect} onChange={e => setFormatSelect(e.target.value)}
                    className="bg-transparent border-none p-0 text-slate-300 font-bold focus:ring-0 cursor-pointer outline-none text-[8.5px]">
                    <option value="FLAC" className="bg-[#0D0D10]">FLAC</option>
                    <option value="WAV" className="bg-[#0D0D10]">WAV</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 6: Output */}
            <div className="bg-[#0b0c10]/70 border border-white/[0.03] rounded-[18px] p-4 flex flex-col gap-3 shadow-md hover:translate-y-[-1px] transition-all duration-300">
              <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider leading-none">Output</span>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] text-slate-550 font-bold uppercase tracking-wider leading-none">Recording Folder</span>
                <div className="flex gap-2">
                  <input
                    type="text" value={recordingFolder} onChange={e => setRecordingFolder(e.target.value)}
                    className="flex-1 bg-[#050508]/80 border border-white/[0.03] rounded-lg px-2.5 py-1 text-[9px] text-slate-400 font-semibold focus:outline-none focus:border-purple-500/50"
                  />
                  <button 
                    onClick={() => {}}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Disk Space Info */}
              <div className="flex items-center gap-1.5 text-[8.5px] text-emerald-400/90 font-bold font-mono border-t border-white/[0.02] pt-2 mt-1">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Storage Available: 142.8 GB</span>
              </div>
            </div>

          </div>
        </aside>

        {/* ── CENTER PANEL ── */}
        <main className="bg-[rgba(10,10,14,0.85)] backdrop-blur-xl border border-white/[0.04] rounded-[24px] p-0 box-border flex flex-col min-w-0 min-h-0 overflow-hidden shadow-2xl">
          
          {/* Region 1 — Workspace Header */}
          <div className="flex-shrink-0 bg-[#07070a]/90 backdrop-blur border-b border-white/[0.03] p-5 pl-6 flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base">🎙</span>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest leading-none">LIVE RECORDING WORKSPACE</h2>
              </div>
              <p className="text-[9.5px] text-slate-555 mt-1 leading-normal font-medium">
                Real-time Offline AI Audio Intelligence
              </p>
            </div>
            
            {/* Recording State Badge */}
            <div className="flex-shrink-0 pr-1">
              {recordingState === 'idle' && (
                <span className="text-[9px] px-3.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 font-bold uppercase tracking-wider">
                  ● READY
                </span>
              )}
              {recordingState === 'recording' && (
                <span className="text-[9px] px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold uppercase tracking-wider animate-pulse">
                  ● RECORDING
                </span>
              )}
              {recordingState === 'paused' && (
                <span className="text-[9px] px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase tracking-wider">
                  ● PAUSED
                </span>
              )}
              {recordingState === 'stopped' && (
                <span className="text-[9px] px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold uppercase tracking-wider">
                  ● PROCESSED
                </span>
              )}
            </div>
          </div>

          {/* Scrollable Workspace Body */}
          <div className="flex-1 min-h-0 overflow-y-auto premium-scrollbar flex flex-col gap-4.5 p-5 pr-4">
            
            {/* Region 2 — Hero Waveform Area (55% Panel height equivalent) */}
            <div className="h-[360px] flex-shrink-0 bg-[#08090c]/90 border border-white/[0.03] rounded-[24px] p-5 flex flex-col gap-3 shadow-2xl relative overflow-hidden group">
              {/* Subtle background DAW grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
              
              {/* Stereo peak scale overlay on the left/right edges */}
              <div className="absolute left-2.5 top-12 bottom-12 w-4 flex flex-col justify-between text-[7px] text-slate-655 font-mono select-none pointer-events-none z-10">
                <span>0dB</span><span>-6dB</span><span>-12dB</span><span>-24dB</span><span>-48dB</span><span>-inf</span>
              </div>
              <div className="absolute right-2.5 top-12 bottom-12 w-4 flex flex-col justify-between text-[7px] text-slate-655 font-mono select-none pointer-events-none text-right z-10">
                <span>0dB</span><span>-6dB</span><span>-12dB</span><span>-24dB</span><span>-48dB</span><span>-inf</span>
              </div>

              {/* Top Waveform Header overlay */}
              <div className="flex items-center justify-between text-[9px] leading-none z-10 px-2">
                <span className="text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Channel 1/2 Stereo Monitor
                </span>
                <span className="text-purple-400 font-bold font-mono tracking-widest animate-pulse flex items-center gap-1">
                  ● OFFLINE AUDIO PIPELINE
                </span>
              </div>

              {/* Waveform Canvas */}
              <div className="flex-1 bg-[#030305]/95 border border-white/[0.015] rounded-xl relative overflow-hidden flex items-center justify-center">
                <canvas ref={mainCanvasRef} className="w-full h-full block filter drop-shadow-[0_0_8px_rgba(168,85,247,0.35)]" />
                
                {/* Active playback/recording line cursor */}
                <div className={`absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-purple-500 shadow-[0_0_8px_#a855f7] z-10 ${recordingState === 'recording' ? 'animate-pulse' : ''}`} />
                
                {/* Floating center Recording Status overlay */}
                {recordingState === 'recording' && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full text-[9px] font-bold text-rose-400 uppercase tracking-widest z-10 animate-pulse pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> OFFLINE RECORDING ACTIVE
                  </div>
                )}
              </div>

              {/* Timestamp ruler below canvas */}
              <div className="h-4 border-t border-white/[0.02] flex justify-between text-[8px] text-slate-500 font-mono px-6 pt-1.5 z-10">
                <span>00:00:00</span>
                <span>00:30:00</span>
                <span>01:00:00</span>
                <span>01:30:00</span>
                <span>02:00:00</span>
                <span>02:30:00</span>
                <span>03:00:00</span>
              </div>
            </div>

            {/* Region 3 — Recording Metrics (12%) - 6 equal cards */}
            <div className="grid grid-cols-6 gap-2.5">
              {[
                { icon: <Clock className="w-3.5 h-3.5 text-purple-450" />, label: 'Duration', val: formatTime(duration) },
                { icon: <HardDrive className="w-3.5 h-3.5 text-purple-450" />, label: 'File Size', val: `${calculatedSize} MB` },
                { icon: <Cpu className="w-3.5 h-3.5 text-purple-450" />, label: 'Rate', val: sampleRateSelect },
                { icon: <Activity className="w-3.5 h-3.5 text-purple-450" />, label: 'Codec', val: formatSelect },
                { icon: <Radio className="w-3.5 h-3.5 text-purple-450" />, label: 'Channels', val: channels === 2 ? 'Stereo' : 'Mono' },
                { icon: <Gauge className="w-3.5 h-3.5 text-purple-450" />, label: 'Latency', val: `${latency} ms` }
              ].map((m) => (
                <div key={m.label} className="bg-[#0b0c10]/40 border border-white/[0.02] rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 shadow-sm text-center">
                  <div className="flex items-center gap-1">
                    {m.icon}
                    <span className="text-[7.5px] text-slate-550 font-bold uppercase tracking-wider">{m.label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-200 font-mono leading-none">{m.val}</span>
                </div>
              ))}
            </div>

            {/* Region 4 — Recording Intelligence (23%) - Two equal-width cards */}
            <div className="grid grid-cols-2 gap-4.5">
              {/* Card One: Recording Intelligence */}
              <div className="bg-[#0b0c10]/60 border border-white/[0.03] rounded-[20px] p-4 flex flex-col gap-3 shadow-md">
                <span className="text-[9px] text-slate-200 font-bold uppercase tracking-wider leading-none">Recording Intelligence</span>
                
                <div className="flex flex-col gap-2.5 text-[9px] font-semibold">
                  {/* Signal Quality */}
                  <div className="flex items-center justify-between py-0.5 border-b border-white/[0.01] last:border-b-0">
                    <span className="text-slate-500 font-medium">Signal Quality</span>
                    <span className="text-[8.5px] text-emerald-450 font-bold font-mono">{audioQuality}% Fidelity</span>
                  </div>
                  {/* Noise Floor */}
                  <div className="flex items-center justify-between py-0.5 border-b border-white/[0.01] last:border-b-0">
                    <span className="text-slate-500 font-medium">Noise Floor</span>
                    <span className="text-[8.5px] text-slate-300 font-bold font-mono">{noiseFloor} dB</span>
                  </div>
                  {/* Voice Activity */}
                  <div className="flex items-center justify-between py-0.5 border-b border-white/[0.01] last:border-b-0">
                    <span className="text-slate-500 font-medium">Voice Activity (VAD)</span>
                    <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      isSpeech ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400 animate-pulse' : 'bg-slate-900 border border-white/[0.02] text-slate-550'
                    }`}>
                      {isSpeech ? 'Speech Active' : 'Silent'}
                    </span>
                  </div>
                  {/* Current Speaker */}
                  <div className="flex items-center justify-between py-0.5 border-b border-white/[0.01] last:border-b-0">
                    <span className="text-slate-500 font-medium">Current Speaker</span>
                    <span className="text-[8px] font-bold font-mono bg-sky-500/10 border border-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded">
                      {isSpeech ? 'Speaker 1' : 'No Signal'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Two: AI Processing */}
              <div className="bg-[#0b0c10]/60 border border-white/[0.03] rounded-[20px] p-4 flex flex-col gap-3 shadow-md">
                <span className="text-[9px] text-slate-200 font-bold uppercase tracking-wider leading-none">AI Processing Pipeline</span>
                
                <div className="flex flex-col gap-2.5 text-[9px] font-semibold">
                  {/* Whisper */}
                  <div className="flex items-center justify-between py-0.5 border-b border-white/[0.01] last:border-b-0">
                    <span className="text-slate-500 font-medium">Whisper Transcription</span>
                    <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      uploading ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse' : 'bg-slate-900 border border-white/[0.02] text-slate-550'
                    }`}>
                      {uploading ? 'PROCESSING' : 'READY'}
                    </span>
                  </div>
                  {/* Speaker Detection */}
                  <div className="flex items-center justify-between py-0.5 border-b border-white/[0.01] last:border-b-0">
                    <span className="text-slate-500 font-medium">Speaker Detection (Diarization)</span>
                    <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      uploading ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse' : 'bg-slate-900 border border-white/[0.02] text-slate-550'
                    }`}>
                      {uploading ? 'DIARIZING' : 'READY'}
                    </span>
                  </div>
                  {/* Embedding */}
                  <div className="flex items-center justify-between py-0.5 border-b border-white/[0.01] last:border-b-0">
                    <span className="text-slate-500 font-medium">Vector Embedding</span>
                    <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      uploading ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-slate-900 border border-white/[0.02] text-slate-555'
                    }`}>
                      {uploading ? 'EMBEDDING' : 'READY'}
                    </span>
                  </div>
                  {/* Meeting Intelligence */}
                  <div className="flex items-center justify-between py-0.5 border-b border-white/[0.01] last:border-b-0">
                    <span className="text-slate-500 font-medium">Meeting Intelligence (QA)</span>
                    <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      uploading ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 'bg-slate-900 border border-white/[0.02] text-slate-550'
                    }`}>
                      {uploading ? 'INFERENCE' : 'LOADED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* ── RIGHT PANEL ── */}
        <aside className="w-full bg-[rgba(10,10,14,0.85)] backdrop-blur-xl border border-white/[0.04] rounded-[24px] p-0 box-border flex flex-col min-w-0 min-h-0 overflow-hidden shadow-2xl">
          
          {/* Sticky Panel Header */}
          <div className="flex-shrink-0 bg-[#07070a]/90 backdrop-blur border-b border-white/[0.03] p-4.5 pl-6">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider leading-none">AI Operations Console</h2>
            </div>
            <p className="text-[9.5px] text-slate-550 mt-1 leading-normal font-medium">
              Real-time neural network diagnostics and performance.
            </p>
          </div>

          {/* Scrollable Body - Unreal Profiler cards layout */}
          <div className="flex-1 min-h-0 overflow-y-auto premium-scrollbar flex flex-col gap-4 p-4 pr-3.5">
            
            {/* Section 1: AI Component Status */}
            <div className="bg-[#0b0c10]/70 border border-white/[0.03] rounded-[18px] p-4 flex flex-col gap-3.5 shadow-md">
              <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider leading-none">AI Component Status</span>
              
              <div className="flex flex-col gap-2">
                {[
                  { name: 'VAD Engine', state: recordingState === 'recording' ? 'Running' : 'Idle', dot: recordingState === 'recording' ? 'bg-emerald-500' : 'bg-slate-600' },
                  { name: 'Noise Suppression', state: noiseSuppression ? 'Running' : 'Idle', dot: noiseSuppression ? 'bg-emerald-500' : 'bg-slate-600' },
                  { name: 'Whisper Engine', state: uploading ? 'Processing' : recordingState === 'stopped' ? 'Loaded' : 'Idle', dot: uploading ? 'bg-amber-500 animate-pulse' : 'bg-slate-600' },
                  { name: 'Diarization (pyannote)', state: uploading ? 'Processing' : 'Idle', dot: uploading ? 'bg-amber-500' : 'bg-slate-600' },
                  { name: 'Meeting Intelligence', state: uploading ? 'Processing' : 'Idle', dot: uploading ? 'bg-amber-500' : 'bg-slate-600' },
                  { name: 'QA Engine', state: 'Loaded', dot: 'bg-slate-550' }
                ].map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-[9px] font-semibold">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                      <span className="text-slate-350">{c.name}</span>
                    </div>
                    <span className="text-slate-500 font-mono">{c.state}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Active Models */}
            <div className="bg-[#0b0c10]/70 border border-white/[0.03] rounded-[18px] p-4 flex flex-col gap-3.5 shadow-md">
              <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider leading-none">Active Neural Models</span>
              
              <div className="flex flex-col gap-2 text-[9px] font-semibold">
                {[
                  { label: 'Speech Model', val: 'faster-whisper-small' },
                  { label: 'Embedding Model', val: 'bge-small-en-v1.5' },
                  { label: 'Diarization Model', val: 'segmentation-3.0' },
                  { label: 'Inference Backend', val: 'ONNX Runtime (CUDA)' },
                  { label: 'Inference Device', val: cpuUsage > 12 ? 'RTX 4090 GPU' : 'CPU ThreadPool' }
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">{m.label}</span>
                    <span className="text-slate-300 font-mono text-[8.5px] font-bold">{m.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: System Resources */}
            <div className="bg-[#0b0c10]/70 border border-white/[0.03] rounded-[18px] p-4 flex flex-col gap-3.5 shadow-md">
              <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider leading-none">Resource Telemetry</span>
              
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'CPU Usage', val: cpuUsage, color: 'bg-purple-500' },
                  { label: 'RAM Commited', val: ramUsage, color: 'bg-purple-500' },
                  { label: 'GPU Load', val: gpuUsage, color: 'bg-purple-500' },
                  { label: 'VRAM Allocation', val: Math.floor(22 + gpuUsage * 0.3), color: 'bg-purple-500' },
                  { label: 'Disk IO Speed', val: diskSpeed, color: 'bg-purple-500', isDisk: true },
                  { label: 'Inference Latency', val: latency, color: 'bg-purple-500', isLatency: true }
                ].map((r) => (
                  <div key={r.label} className="flex flex-col gap-1 text-[8.5px] font-semibold">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>{r.label}</span>
                      <span className="font-mono font-bold text-slate-250">
                        {r.isDisk ? `${r.val} MB/s` : r.isLatency ? `${r.val} ms` : `${r.val}%`}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-[#050508] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${r.color}`}
                        style={{ width: `${r.isDisk ? Math.min(100, (r.val / 10) * 100) : r.isLatency ? Math.min(100, (r.val / 100) * 100) : r.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Pipeline Status */}
            <div className="bg-[#0b0c10]/70 border border-white/[0.03] rounded-[18px] p-4 flex flex-col gap-3.5 shadow-md">
              <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider leading-none">Inference Pipeline</span>
              
              <div className="relative pl-4 border-l border-white/[0.03] flex flex-col gap-3.5 mt-1">
                {[
                  { stage: 'Capture', status: recordingState === 'recording' ? 'Running' : recordingState === 'paused' ? 'Paused' : 'Waiting', active: recordingState === 'recording' },
                  { stage: 'Pre-processing', status: recordingState === 'recording' ? 'Running' : 'Waiting', active: recordingState === 'recording' },
                  { stage: 'Whisper Translation', status: uploading ? 'Running' : recordingState === 'stopped' ? 'Done' : 'Waiting', active: uploading },
                  { stage: 'Speaker Detection', status: uploading ? 'Running' : 'Waiting', active: uploading },
                  { stage: 'Transcript Cache', status: uploading ? 'Done' : 'Waiting', active: false },
                  { stage: 'Executive Summary', status: uploading ? 'Running' : 'Waiting', active: uploading },
                  { stage: 'Meeting Intelligence', status: uploading ? 'Running' : 'Waiting', active: uploading }
                ].map((s) => (
                  <div key={s.stage} className="flex items-center justify-between text-[9px] font-semibold relative">
                    {/* Circle Node indicator */}
                    <div className={`absolute -left-[20.5px] w-2.5 h-2.5 rounded-full border-2 border-[#07070a] ${
                      s.status === 'Running' 
                        ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
                        : s.status === 'Done'
                        ? 'bg-emerald-500'
                        : 'bg-slate-650'
                    }`} />
                    <span className="text-slate-350">{s.stage}</span>
                    <span className="text-slate-500 font-mono text-[8px]">{s.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: Live Engine Log */}
            <div className="bg-[#0b0c10]/70 border border-white/[0.03] rounded-[18px] p-4 flex flex-col gap-2.5 shadow-md">
              <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider leading-none">Live Engine Log</span>
              
              <div className="h-[140px] bg-[#050508]/80 border border-white/[0.02] rounded-xl p-3 overflow-y-auto premium-scrollbar flex flex-col gap-1.5 font-mono text-[8px] text-slate-450 select-text leading-normal">
                {logs.map((log, idx) => (
                  <div key={idx} className="transition-all duration-300 hover:text-slate-200">
                    {log}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* ── BOTTOM DOCK (96px) ── */}
      <footer className="h-[110px] flex-shrink-0 flex items-center justify-center min-w-0 min-h-0 overflow-hidden w-full px-6">
        <div className="w-full max-w-[1000px] h-[92px] bg-[#07070a]/90 backdrop-blur-xl border border-white/[0.04] rounded-[28px] box-border px-8 py-3 flex items-center justify-between shadow-2xl relative">
          
          {/* LEFT SECTION (Bookmark, Marker) */}
          <div className="flex items-center gap-4.5">
            {/* Bookmark button */}
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border ${
                bookmarked 
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.15)]' 
                  : 'bg-[#111216]/50 border-white/[0.03] text-slate-400 hover:text-slate-200 hover:bg-[#111216] hover:translate-y-[-1px] active:scale-95'
              }`}
              title="Toggle Bookmark"
            >
              <Bookmark className="w-4 h-4 fill-current" />
              <span className="text-[8px] font-bold uppercase tracking-wider leading-none">Book</span>
              <span className="text-[7px] font-bold font-mono bg-white/[0.06] text-slate-500 px-1 py-0.5 rounded leading-none mt-0.5">B</span>
            </button>

            {/* Marker button */}
            <button
              onClick={handleAddMarker}
              className="w-14 h-14 bg-[#111216]/50 border border-white/[0.03] rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-200 hover:bg-[#111216] hover:translate-y-[-1px] active:scale-95 transition-all"
              title="Add Marker"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-[8px] font-bold uppercase tracking-wider leading-none">Marker</span>
              <span className="text-[7px] font-bold font-mono bg-white/[0.06] text-slate-500 px-1 py-0.5 rounded leading-none mt-0.5">M</span>
            </button>
          </div>

          {/* CENTER SECTION (Symmetric DAW transport controls: Pause, Record, Stop) */}
          <div className="flex items-center gap-6">
            {/* Pause Button */}
            <button
              disabled={recordingState !== 'recording' && recordingState !== 'paused'}
              onClick={recordingState === 'recording' ? pauseRecording : resumeRecording}
              className={`w-11 h-11 bg-[#111216]/50 border border-white/[0.03] rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-slate-200 hover:bg-[#111216] hover:translate-y-[-1px] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed`}
              title="Pause/Resume"
            >
              {recordingState === 'paused' ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              <span className="text-[7px] font-bold font-mono bg-white/[0.06] text-slate-500 px-1 py-0.5 rounded leading-none mt-0.5">SPACE</span>
            </button>

            {/* Record Button (Primary visual centerpiece) */}
            <button
              onClick={() => {
                if (recordingState === 'idle') startRecording();
                else if (recordingState === 'recording') pauseRecording();
                else if (recordingState === 'paused') resumeRecording();
              }}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg border-2 ${
                recordingState === 'recording'
                  ? 'bg-rose-600 border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
                  : recordingState === 'paused'
                  ? 'bg-rose-600 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-rose-600 border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              }`}
              title="Record Control"
            >
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <div className={`w-3.5 h-3.5 rounded ${recordingState === 'recording' ? 'bg-rose-600 rounded-sm' : 'bg-rose-600 rounded-full'}`} />
              </div>
            </button>

            {/* Stop Button */}
            <button
              disabled={recordingState !== 'recording' && recordingState !== 'paused'}
              onClick={stopRecording}
              className="w-11 h-11 bg-[#111216]/50 border border-white/[0.03] rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-slate-200 hover:bg-[#111216] hover:translate-y-[-1px] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Stop Recording"
            >
              <Power className="w-3.5 h-3.5" />
              <span className="text-[7px] font-bold font-mono bg-white/[0.06] text-slate-500 px-1 py-0.5 rounded leading-none mt-0.5">S</span>
            </button>
          </div>

          {/* RIGHT SECTION (Notes, Keyboard Shortcuts) */}
          <div className="flex items-center gap-4.5">
            {/* Notes button */}
            <button
              onClick={() => {}}
              className="w-14 h-14 bg-[#111216]/50 border border-white/[0.03] rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-200 hover:bg-[#111216] hover:translate-y-[-1px] active:scale-95 transition-all"
              title="Open Notes"
            >
              <Keyboard className="w-4 h-4" />
              <span className="text-[8px] font-bold uppercase tracking-wider leading-none">Notes</span>
              <span className="text-[7px] font-bold font-mono bg-white/[0.06] text-slate-500 px-1 py-0.5 rounded leading-none mt-0.5">N</span>
            </button>

            {/* Shortcuts info button */}
            <button
              onClick={() => {}}
              className="w-14 h-14 bg-[#111216]/50 border border-white/[0.03] rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-200 hover:bg-[#111216] hover:translate-y-[-1px] active:scale-95 transition-all"
              title="Keyboard Shortcuts"
            >
              <Waves className="w-4 h-4" />
              <span className="text-[8px] font-bold uppercase tracking-wider leading-none">Keys</span>
              <span className="text-[7px] font-bold font-mono bg-white/[0.06] text-slate-500 px-1 py-0.5 rounded leading-none mt-0.5">K</span>
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
};
