import React, { useEffect, useRef, useState } from 'react';
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
  AudioLines
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
  // HTML5 Canvas reference for high-fidelity live waveform
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Local state for UI controls, indicators, and system metrics
  const [timeStr, setTimeStr] = useState("");
  const [inputGain, setInputGain] = useState(80);
  const [monitoring, setMonitoring] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [speechEnhancement, setSpeechEnhancement] = useState(true);
  const [sampleRateSelect, setSampleRateSelect] = useState("16000 Hz");
  const [bitDepthSelect, setBitDepthSelect] = useState("16-bit");
  const [formatSelect, setFormatSelect] = useState("FLAC");
  const [bookmarked, setBookmarked] = useState(false);
  const [showMarkerNotification, setShowMarkerNotification] = useState(false);

  // Performance Metric States
  const [cpuUsage, setCpuUsage] = useState(9);
  const [ramUsage, setRamUsage] = useState(38);
  const [gpuUsage, setGpuUsage] = useState(4);
  const [diskSpeed, setDiskSpeed] = useState(1.8);
  const [latency, setLatency] = useState(12);
  const [markers, setMarkers] = useState<number[]>([]);

  // Real-time Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate subtle system metric oscillations during recording
  useEffect(() => {
    if (recordingState !== 'recording') {
      setCpuUsage(4);
      setGpuUsage(2);
      setDiskSpeed(0.1);
      setLatency(8);
      return;
    }
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(8 + Math.random() * 6));
      setRamUsage(Math.floor(38 + Math.random() * 3));
      setGpuUsage(Math.floor(3 + Math.random() * 4));
      setDiskSpeed(Number((1.5 + Math.random() * 1.2).toFixed(1)));
      setLatency(Math.floor(10 + Math.random() * 5));
    }, 2000);
    return () => clearInterval(interval);
  }, [recordingState]);

  // Hook to start visualizer when stream changes or starts
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    // Track active particles floating up from voice wave crests
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      alpha: number;
      color: string;
    }
    let particles: Particle[] = [];

    if (stream && recordingState === 'recording') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256; 

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const frequencyDataArray = new Uint8Array(bufferLength);

      const drawCanvas = () => {
        animationFrameId = requestAnimationFrame(drawCanvas);
        analyser.getByteTimeDomainData(dataArray);
        analyser.getByteFrequencyData(frequencyDataArray);

        // Clear canvas with trail opacity
        canvasCtx.fillStyle = 'rgba(5, 5, 8, 0.25)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Compute average volume for reactive aura glow intensity
        let sumVolume = 0;
        for (let i = 0; i < bufferLength; i++) {
          sumVolume += Math.abs(dataArray[i] - 128);
        }
        const avgVolume = sumVolume / bufferLength;
        const volumeFactor = Math.min(avgVolume / 32, 1.0); 

        // ── 1. Draw Radial Freq-Burst Aura Background Glow ──
        if (volumeFactor > 0.05) {
          const auraRadius = 35 + volumeFactor * 90;
          const auraGlow = canvasCtx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 5,
            canvas.width / 2, canvas.height / 2, auraRadius
          );
          const alphaGlow = volumeFactor * 0.12;
          const glowColor = volumeFactor > 0.5 ? 'rgba(56, 189, 248,' : 'rgba(139, 92, 246,';
          auraGlow.addColorStop(0, `${glowColor}${alphaGlow})`);
          auraGlow.addColorStop(1, 'rgba(5, 5, 8, 0)');
          canvasCtx.fillStyle = auraGlow;
          canvasCtx.beginPath();
          canvasCtx.arc(canvas.width / 2, canvas.height / 2, auraRadius, 0, Math.PI * 2);
          canvasCtx.fill();
        }

        // Draw horizontal grid lines
        canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        canvasCtx.lineWidth = 1;
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, canvas.height / 2);
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();

        // ── 2. Draw Soft Blurred Frequency Bars (Silhouette Background) ──
        const barWidth = (canvas.width / 32);
        canvasCtx.fillStyle = 'rgba(99, 102, 241, 0.045)';
        for (let i = 0; i < 32; i++) {
          const freqVal = frequencyDataArray[i * 2] || 0;
          const barHeight = (freqVal / 255) * (canvas.height * 0.7);
          const bx = i * barWidth + (barWidth / 2) - 1.5;
          const by = (canvas.height / 2) - (barHeight / 2);
          
          canvasCtx.beginPath();
          canvasCtx.roundRect(bx, by, 3, barHeight, 1.5);
          canvasCtx.fill();
        }

        // Setup gradients for waves
        const gradientPrimary = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
        gradientPrimary.addColorStop(0, '#a78bfa'); 
        gradientPrimary.addColorStop(0.5, '#6366f1'); 
        gradientPrimary.addColorStop(1, '#38bdf8'); 

        const gradientSecondary = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
        gradientSecondary.addColorStop(0, 'rgba(167, 139, 250, 0.12)');
        gradientSecondary.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
        gradientSecondary.addColorStop(1, 'rgba(56, 189, 248, 0.12)');

        const sliceWidth = (canvas.width * 1.0) / bufferLength;

        // ── Render Secondary Background Wave ──
        canvasCtx.lineWidth = 1.5;
        canvasCtx.strokeStyle = gradientSecondary;
        canvasCtx.beginPath();
        let sx = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = (dataArray[i] / 128.0);
          const y = (canvas.height / 2) + ((v - 1.0) * (canvas.height / 2) * 0.75);
          if (i === 0) {
            canvasCtx.moveTo(sx, y);
          } else {
            const prevX = sx - sliceWidth;
            const prevV = dataArray[i - 1] / 128.0;
            const prevY = (canvas.height / 2) + ((prevV - 1.0) * (canvas.height / 2) * 0.75);
            canvasCtx.bezierCurveTo(prevX + sliceWidth / 2, prevY, prevX + sliceWidth / 2, y, sx, y);
          }
          sx += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();

        // ── Render Primary Glow Wave ──
        canvasCtx.lineWidth = 3.0;
        canvasCtx.strokeStyle = gradientPrimary;
        canvasCtx.shadowBlur = 10;
        canvasCtx.shadowColor = 'rgba(56, 189, 248, 0.4)';
        canvasCtx.beginPath();
        let px = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            canvasCtx.moveTo(px, y);
          } else {
            const prevX = px - sliceWidth;
            const prevV = dataArray[i - 1] / 128.0;
            const prevY = (prevV * canvas.height) / 2;
            canvasCtx.bezierCurveTo(prevX + sliceWidth / 2, prevY, prevX + sliceWidth / 2, y, px, y);
          }

          // Emit particles from peaks
          if (Math.abs(v - 1.0) > 0.12 && Math.random() < 0.10 && px > 20 && px < canvas.width - 20) {
            particles.push({
              x: px,
              y: y,
              size: 1 + Math.random() * 2.0,
              speedY: -0.4 - Math.random() * 1.0,
              alpha: 0.8,
              color: i % 2 === 0 ? '#38bdf8' : '#a78bfa'
            });
          }

          px += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
        canvasCtx.shadowBlur = 0; 

        // ── Update and Render Particles ──
        for (let idx = particles.length - 1; idx >= 0; idx--) {
          const p = particles[idx];
          p.y += p.speedY;
          p.alpha -= 0.025;
          if (p.alpha <= 0) {
            particles.splice(idx, 1);
            continue;
          }
          canvasCtx.fillStyle = p.color;
          canvasCtx.globalAlpha = p.alpha;
          canvasCtx.beginPath();
          canvasCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          canvasCtx.fill();
        }
        canvasCtx.globalAlpha = 1.0; 
      };

      drawCanvas();

      return () => {
        cancelAnimationFrame(animationFrameId);
        audioContext.close();
      };
    } else {
      // Gentle sine wave generator (sleeping mode when idle or paused)
      let phase = 0;
      const drawIdleWave = () => {
        animationFrameId = requestAnimationFrame(drawIdleWave);
        phase += 0.04; 

        // Clear canvas
        canvasCtx.fillStyle = 'rgb(5, 5, 8)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw horizontal grid lines
        canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.01)';
        canvasCtx.lineWidth = 1;
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, canvas.height / 2);
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();

        const amplitude1 = recordingState === 'paused' ? 3.0 : 5.0;
        const amplitude2 = recordingState === 'paused' ? 1.0 : 2.5;

        // Draw sleeping/resting backwave
        canvasCtx.strokeStyle = 'rgba(99, 102, 241, 0.06)';
        canvasCtx.lineWidth = 1.5;
        canvasCtx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
          const y = (canvas.height / 2) + Math.sin(x * 0.012 - phase * 0.7) * amplitude2;
          if (x === 0) canvasCtx.moveTo(x, y);
          else canvasCtx.lineTo(x, y);
        }
        canvasCtx.stroke();

        // Draw primary resting wave
        const gradientIdle = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
        gradientIdle.addColorStop(0, 'rgba(139, 92, 246, 0.20)');
        gradientIdle.addColorStop(0.5, 'rgba(56, 189, 248, 0.30)');
        gradientIdle.addColorStop(1, 'rgba(139, 92, 246, 0.20)');

        canvasCtx.strokeStyle = gradientIdle;
        canvasCtx.lineWidth = 2.0;
        canvasCtx.shadowBlur = 6;
        canvasCtx.shadowColor = 'rgba(56, 189, 248, 0.15)';
        canvasCtx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
          const y = (canvas.height / 2) + Math.sin(x * 0.015 + phase) * amplitude1;
          if (x === 0) canvasCtx.moveTo(x, y);
          else canvasCtx.lineTo(x, y);
        }
        canvasCtx.stroke();
        canvasCtx.shadowBlur = 0;
      };

      drawIdleWave();

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [stream, recordingState]);

  // Handle local mouse move reflection
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  const handleAddMarker = () => {
    setMarkers(prev => [...prev, duration]);
    setShowMarkerNotification(true);
    setTimeout(() => setShowMarkerNotification(false), 2000);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  // Convert duration to approx file size
  const calculatedSize = ((duration * 16000 * 2) / (1024 * 1024)).toFixed(2);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent relative p-6">
      
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
            </div>
            <div className="flex items-center gap-2 mt-1">
              {recordingState === 'stopped' ? (
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter meeting title..."
                  className="bg-transparent border-none p-0 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-0 font-medium w-48"
                />
              ) : (
                <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
                  {title || "Untitled Local Meeting"}
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
            <span className="text-slate-600 font-bold">TIME:</span>
            <span className="text-slate-300">{timeStr || "--:--:--"}</span>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
        
        {/* ── 3. LEFT AUDIO CONTROL PANEL ── */}
        <aside 
          onMouseMove={handleMouseMove}
          className="col-span-12 lg:col-span-3 bg-slate-950/45 border border-white/[0.03] premium-card-interaction rounded-3xl p-5 flex flex-col gap-4 overflow-y-auto backdrop-blur-md shadow-xl scrollbar-none select-none"
        >
          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-1">Capture Options</h3>
            <p className="text-[10px] text-slate-500">Configure hardware routing parameters.</p>
          </div>

          {/* Audio Source Selectors */}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Input Source</label>
              <div className="grid grid-cols-3 bg-slate-900/60 border border-slate-850 p-0.5 rounded-xl">
                <button 
                  onClick={() => setCaptureSource('mic')}
                  className={`py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all ${
                    captureSource === 'mic' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Radio className="w-3 h-3" /> Mic
                </button>
                <button 
                  onClick={() => setCaptureSource('system')}
                  className={`py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all ${
                    captureSource === 'system' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Monitor className="w-3 h-3" /> Sys
                </button>
                <button 
                  onClick={() => setCaptureSource('both')}
                  className={`py-1.5 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all ${
                    captureSource === 'both' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Disc3 className="w-3 h-3" /> Mix
                </button>
              </div>
            </div>

            {/* Input Gain Slider */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px]">
                <label className="text-slate-500 font-bold uppercase">Input Gain</label>
                <span className="font-mono text-slate-400 font-semibold">{inputGain}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={inputGain}
                onChange={(e) => setInputGain(Number(e.target.value))}
                className="w-full accent-purple-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

            {/* Monitoring Toggle */}
            <div className="flex items-center justify-between bg-slate-900/30 border border-slate-900 p-2.5 rounded-xl">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-300 font-bold uppercase">Monitor Audio</span>
                <span className="text-[8px] text-slate-500">Output local mic feed</span>
              </div>
              <button 
                onClick={() => setMonitoring(!monitoring)}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  monitoring ? 'bg-purple-600' : 'bg-slate-800'
                }`}
              >
                <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 transform ${
                  monitoring ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          <div className="h-px bg-white/[0.02]" />

          {/* AI Preprocessing Toggles */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">DSP & AI Pre-Processing</h4>
            
            <div className="flex items-center justify-between bg-slate-900/20 border border-slate-900/60 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-300 font-semibold">Noise Suppression</span>
              <button 
                onClick={() => setNoiseSuppression(!noiseSuppression)}
                className={`w-7 h-4 rounded-full p-0.5 transition-colors ${noiseSuppression ? 'bg-purple-600' : 'bg-slate-800'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white transition-transform transform ${noiseSuppression ? 'translate-x-3' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-900/20 border border-slate-900/60 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-300 font-semibold">Echo Cancellation</span>
              <button 
                onClick={() => setEchoCancellation(!echoCancellation)}
                className={`w-7 h-4 rounded-full p-0.5 transition-colors ${echoCancellation ? 'bg-purple-600' : 'bg-slate-800'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white transition-transform transform ${echoCancellation ? 'translate-x-3' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-900/20 border border-slate-900/60 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-300 font-semibold">Speech Enhancement</span>
              <button 
                onClick={() => setSpeechEnhancement(!speechEnhancement)}
                className={`w-7 h-4 rounded-full p-0.5 transition-colors ${speechEnhancement ? 'bg-purple-600' : 'bg-slate-800'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white transition-transform transform ${speechEnhancement ? 'translate-x-3' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div className="h-px bg-white/[0.02] mt-auto" />

          {/* Format Settings Details */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Storage & Target format</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900 p-2 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 font-bold uppercase">Sample Rate</span>
                <select 
                  value={sampleRateSelect} 
                  onChange={(e) => setSampleRateSelect(e.target.value)}
                  className="bg-transparent border-none p-0 text-[10px] text-slate-200 font-semibold focus:ring-0 text-center cursor-pointer outline-none"
                >
                  <option value="16000 Hz" className="bg-slate-950 text-white">16000 Hz</option>
                  <option value="44100 Hz" className="bg-slate-950 text-white">44100 Hz</option>
                  <option value="48000 Hz" className="bg-slate-950 text-white">48000 Hz</option>
                </select>
              </div>

              <div className="flex flex-col gap-0.5 bg-slate-900/40 border border-slate-900 p-2 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 font-bold uppercase">Bit Depth</span>
                <select 
                  value={bitDepthSelect} 
                  onChange={(e) => setBitDepthSelect(e.target.value)}
                  className="bg-transparent border-none p-0 text-[10px] text-slate-200 font-semibold focus:ring-0 text-center cursor-pointer outline-none"
                >
                  <option value="16-bit" className="bg-slate-950 text-white">16-bit</option>
                  <option value="24-bit" className="bg-slate-950 text-white">24-bit</option>
                  <option value="32-bit Float" className="bg-slate-950 text-white">32-bit Float</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-900/40 border border-slate-900 p-2 rounded-xl">
              <span className="text-[8px] text-slate-500 font-bold uppercase pl-1">Codec Container</span>
              <select 
                value={formatSelect} 
                onChange={(e) => setFormatSelect(e.target.value)}
                className="bg-transparent border-none p-0 text-[10px] text-slate-200 font-semibold focus:ring-0 text-right cursor-pointer outline-none pr-1"
              >
                <option value="FLAC" className="bg-slate-950 text-white">FLAC (Lossless)</option>
                <option value="WAV" className="bg-slate-950 text-white">WAV (PCM)</option>
                <option value="MP3" className="bg-slate-950 text-white">MP3 (Compressed)</option>
              </select>
            </div>
          </div>
        </aside>

        {/* ── 2. CENTER RECORDING STUDIO ── */}
        <main 
          onMouseMove={handleMouseMove}
          className="col-span-12 lg:col-span-6 flex flex-col justify-between h-full bg-slate-950/45 border border-white/[0.03] premium-card-interaction rounded-3xl p-6 relative overflow-hidden backdrop-blur-md shadow-xl"
        >
          {/* Subtle live sound background mesh grids */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:100%_12px] pointer-events-none z-10" />

          {/* Top Info Header of the Center Studio */}
          <div className="flex items-center justify-between border-b border-white/[0.02] pb-4 z-20">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${recordingState === 'recording' ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {recordingState === 'idle' && 'Studio Standby'}
                {recordingState === 'recording' && 'Live Capturing'}
                {recordingState === 'paused' && 'Capture Paused'}
                {recordingState === 'stopped' && 'Capture Complete'}
              </span>
            </div>
            {recordingState !== 'idle' && (
              <span className="text-[9px] text-purple-400 font-mono font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                ACTIVE MONITOR
              </span>
            )}
          </div>

          {/* Hero Waveform Canvas Area */}
          <div className="flex-1 flex flex-col justify-center items-center py-6 z-20 w-full">
            <div className="w-[90%] bg-[#050508]/90 rounded-2xl border border-white/5 shadow-[inset_0_2px_12px_rgba(0,0,0,0.9)] overflow-hidden relative flex items-center justify-center p-px" style={{ height: '240px' }}>
              <canvas 
                ref={canvasRef} 
                width={720} 
                height={240} 
                className="w-full h-full rounded-2xl z-0" 
              />
            </div>

            {/* Waveform Metadata footer */}
            <div className="grid grid-cols-4 gap-6 w-[90%] mt-6 border-t border-white/[0.02] pt-4 text-center">
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Record Timer</span>
                <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">
                  {recordingState === 'idle' ? '00:00:00' : formatTime(duration)}
                </span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Estimated Size</span>
                <span className="text-lg font-extrabold text-slate-300 font-mono mt-0.5 block">
                  {recordingState === 'idle' ? '0.00 MB' : `${calculatedSize} MB`}
                </span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Total Duration</span>
                <span className="text-lg font-extrabold text-slate-300 font-mono mt-0.5 block">
                  {formatTime(duration)}
                </span>
              </div>
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Bit Depth / Codec</span>
                <span className="text-lg font-extrabold text-slate-300 font-mono mt-0.5 block">
                  {bitDepthSelect.split(" ")[0]} / {formatSelect}
                </span>
              </div>
            </div>
          </div>

          {/* Save/Rename Form if stopped */}
          {recordingState === 'stopped' && (
            <div className="z-20 w-[90%] mx-auto bg-slate-900/30 p-5 rounded-2xl border border-white/[0.03] space-y-4 mb-4">
              <div className="text-left">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Meeting Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter meeting name..."
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 font-semibold"
                />
              </div>

              {recordingError && (
                <div className="flex items-center gap-2 text-rose-500 text-xs font-semibold justify-center">
                  <AlertCircle className="w-4 h-4" />
                  <span>{recordingError}</span>
                </div>
              )}

              <div className="flex gap-4 items-center">
                <button 
                  onClick={discardRecording}
                  disabled={uploading}
                  className="p-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all cursor-pointer"
                  title="Discard Recording"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={saveRecording}
                  disabled={uploading}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-600/10 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{uploading ? 'Saving & Transcribing...' : 'Save & Transcribe'}</span>
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ── 4. RIGHT LIVE STATUS PANEL ── */}
        <aside 
          onMouseMove={handleMouseMove}
          className="col-span-12 lg:col-span-3 bg-slate-950/45 border border-white/[0.03] premium-card-interaction rounded-3xl p-5 flex flex-col gap-4 overflow-y-auto backdrop-blur-md shadow-xl scrollbar-none select-none"
        >
          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-1">Signal Health</h3>
            <p className="text-[10px] text-slate-500">Live hardware & stream diagnostics.</p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Audio Quality Card */}
            <div className="bg-[#0d0e12]/60 border border-slate-900 p-3 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <AudioLines className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Audio Quality</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase font-mono">EXCELLENT</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5">
                <span>Signal Strength</span>
                <span className="font-mono">98%</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98%' }} />
              </div>
            </div>

            {/* Noise Level Card */}
            <div className="bg-[#0d0e12]/60 border border-slate-900 p-3 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Noise Floor</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold uppercase font-mono">-72 dB</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5">
                <span>Interference Ratio</span>
                <span className="font-mono">Low</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>

            {/* Speech Detection Card */}
            <div className="bg-[#0d0e12]/60 border border-slate-900 p-3 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">VAD State</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold uppercase font-mono">
                  {recordingState === 'recording' ? 'SPEECH' : 'SILENCE'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5">
                <span>Confidence Rating</span>
                <span className="font-mono">{recordingState === 'recording' ? '96%' : '0%'}</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all duration-300" style={{ width: recordingState === 'recording' ? '96%' : '5%' }} />
              </div>
            </div>

            {/* Clipping Indicator */}
            <div className="bg-[#0d0e12]/60 border border-slate-900 p-3 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Gauge className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Clipping</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase font-mono">NOMINAL</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5">
                <span>Peak Headroom</span>
                <span className="font-mono">-6.2 dB</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>

            {/* System Performance Card */}
            <div className="bg-[#0d0e12]/60 border border-slate-900 p-3 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-slate-400 border-b border-white/[0.02] pb-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Resource Allocation</span>
              </div>

              <div className="space-y-1.5 text-[9px]">
                <div className="flex justify-between text-slate-300">
                  <span>CPU Threads</span>
                  <span className="font-mono">{cpuUsage}%</span>
                </div>
                <div className="w-full h-0.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 transition-all duration-1000" style={{ width: `${cpuUsage}%` }} />
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>RAM footprint</span>
                  <span className="font-mono">{ramUsage}%</span>
                </div>
                <div className="w-full h-0.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 transition-all duration-1000" style={{ width: `${ramUsage}%` }} />
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>GPU Compute</span>
                  <span className="font-mono">{gpuUsage}%</span>
                </div>
                <div className="w-full h-0.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 transition-all duration-1000" style={{ width: `${gpuUsage}%` }} />
                </div>

                <div className="flex justify-between text-slate-300 pt-1">
                  <div className="flex items-center gap-1">
                    <HardDrive className="w-2.5 h-2.5 text-slate-500" />
                    <span>Disk IO</span>
                  </div>
                  <span className="font-mono">{diskSpeed} MB/s</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <div className="flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 text-slate-500" />
                    <span>AI Latency</span>
                  </div>
                  <span className="font-mono">{latency} ms</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── 5. BOTTOM RECORDING DOCK ── */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex items-center gap-4 bg-slate-950/80 border border-white/[0.04] px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden select-none">
          {/* Subtle glow border line on the top */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />

          {/* Bookmark Button */}
          <button 
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-2 rounded-xl border transition-all ${
              bookmarked 
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Bookmark"
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Add Marker Button */}
          <button 
            onClick={handleAddMarker}
            className="p-2 rounded-xl border bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 transition-all"
            title="Insert Timeline Marker"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-6 bg-white/[0.03]" />

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {recordingState === 'idle' && (
              <button 
                onClick={startRecording}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-lg shadow-purple-500/10 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Record</span>
              </button>
            )}

            {recordingState === 'recording' && (
              <>
                <button 
                  onClick={pauseRecording}
                  className="px-4 py-2.5 rounded-xl bg-amber-600/10 border border-amber-500/20 hover:bg-amber-600/20 text-amber-400 font-bold text-[11px] flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>

                <button 
                  onClick={stopRecording}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-lg shadow-rose-600/15 active:scale-95 transition-all cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              </>
            )}

            {recordingState === 'paused' && (
              <>
                <button 
                  onClick={resumeRecording}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-lg shadow-purple-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </button>

                <button 
                  onClick={stopRecording}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-lg shadow-rose-600/15 active:scale-95 transition-all cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              </>
            )}

            {recordingState === 'stopped' && (
              <button 
                onClick={saveRecording}
                disabled={uploading}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-lg shadow-purple-600/10 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{uploading ? 'Saving...' : 'Save & Transcribe'}</span>
              </button>
            )}
          </div>

          <div className="w-px h-6 bg-white/[0.03]" />

          {/* Keyboard shortcut hint */}
          <div className="flex items-center gap-1 text-[9px] text-slate-600 font-medium">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Space to Toggle</span>
          </div>

          {/* Marker Notification popup inside the dock */}
          <AnimatePresence>
            {showMarkerNotification && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
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
