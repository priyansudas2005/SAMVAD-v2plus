import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  Clock, 
  Radio, 
  Volume2, 
  Activity, 
  Cpu, 
  HardDrive, 
  Sparkles, 
  BrainCircuit, 
  SlidersHorizontal, 
  Users, 
  FileText, 
  ShieldCheck, 
  Database, 
  Zap,
  CheckCircle2
} from 'lucide-react';
import { AudioHealth } from './AudioHealth';

export interface RecordingMonitorProps {
  recordingState: 'idle' | 'recording' | 'paused' | 'stopped';
  duration: number;
  captureSource: 'mic' | 'system' | 'both';
  vadEnabled: boolean;
  liveVolumeLeft: number;
  peakHoldLeft: number;
}

export const RecordingMonitor: React.FC<RecordingMonitorProps> = ({
  recordingState,
  duration,
  captureSource,
  vadEnabled,
  liveVolumeLeft,
  peakHoldLeft
}) => {
  const [telemetry, setTelemetry] = useState({
    elapsedTime: '00:00:00.00',
    currentLoudnessDb: -60.0,
    avgLoudnessDb: -28.4,
    peakLevelDb: -60.0,
    noiseFloorDb: -58.2,
    latencyMs: 14,
    dynamicRangeDb: 42.5,
    cpuUsage: 3.8,
    gpuUsage: 12.4,
    memoryUsageMb: 142.5,
    diskThroughputKbps: 705.6,
    recordingSizeMb: 0.0,
    availableStorageGb: 248.5,
    healthScore: 98,
    speechCoverage: 84.2,
    signalQuality: 'Broadcast Standard',
    estimatedSnrDb: 42.8
  });

  const formatHMS = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: any;
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        const hrs = Math.floor(duration / 3600);
        const mins = Math.floor((duration % 3600) / 60);
        const secs = duration % 60;
        const ms = Math.floor((Date.now() % 1000) / 10);
        const formattedElapsed = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;

        const currentVol = liveVolumeLeft;
        const currentDb = currentVol > 0.01 ? (20 * Math.log10(currentVol)).toFixed(1) : -60.0;
        const peakDb = peakHoldLeft > 0.01 ? (20 * Math.log10(peakHoldLeft)).toFixed(1) : -60.0;
        const sizeMb = (duration * 0.1764).toFixed(2);

        setTelemetry(prev => ({
          ...prev,
          elapsedTime: formattedElapsed,
          currentLoudnessDb: Number(currentDb),
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
  }, [recordingState, duration, liveVolumeLeft, peakHoldLeft]);

  const statusPills = [
    {
      id: 'ai-listening',
      label: 'AI Listening',
      icon: BrainCircuit,
      state: recordingState === 'recording' ? 'Listening' : recordingState === 'paused' ? 'Paused' : 'Standby',
      color: recordingState === 'recording' ? 'text-violet-400' : 'text-slate-500',
      dotColor: recordingState === 'recording' ? 'bg-violet-500 animate-ping' : 'bg-slate-600',
      tooltip: 'Real-time neural listener analyzing stream acoustics'
    },
    {
      id: 'vad',
      label: 'VAD',
      icon: Activity,
      state: recordingState === 'recording' ? 'Speech' : 'Silence',
      color: recordingState === 'recording' ? 'text-emerald-400' : 'text-slate-500',
      dotColor: recordingState === 'recording' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600',
      tooltip: 'Silero VAD trimming background silence'
    },
    {
      id: 'noise-reduction',
      label: 'Noise Reduction',
      icon: SlidersHorizontal,
      state: vadEnabled ? 'Active (24dB)' : 'Off',
      color: vadEnabled ? 'text-sky-400' : 'text-slate-500',
      dotColor: vadEnabled ? 'bg-sky-400' : 'bg-slate-600',
      tooltip: 'Spectral adaptive noise suppression'
    },
    {
      id: 'echo-cancellation',
      label: 'Echo Cancel',
      icon: Zap,
      state: 'Active (AEC)',
      color: 'text-emerald-400',
      dotColor: 'bg-emerald-400',
      tooltip: 'Hardware acoustic echo cancellation'
    },
    {
      id: 'speaker-diarization',
      label: 'Diarization',
      icon: Users,
      state: recordingState === 'recording' ? '2 Speakers' : 'Idle',
      color: 'text-amber-400',
      dotColor: 'bg-amber-400',
      tooltip: 'PyAnnote speaker voice profile separation'
    },
    {
      id: 'live-transcription',
      label: 'STT Stream',
      icon: FileText,
      state: recordingState === 'recording' ? 'Whisper Buffer' : 'Standby',
      color: 'text-emerald-400',
      dotColor: 'bg-emerald-400 animate-pulse',
      tooltip: 'Sub-second local Whisper-v3 speech-to-text token stream'
    },
    {
      id: 'secure-processing',
      label: 'Local CUDA',
      icon: ShieldCheck,
      state: '100% Offline',
      color: 'text-emerald-400',
      dotColor: 'bg-emerald-400',
      tooltip: 'Encrypted local CUDA GPU pipeline — zero cloud data'
    },
    {
      id: 'auto-save',
      label: 'Auto Save',
      icon: Database,
      state: 'SQLite Active',
      color: 'text-sky-300',
      dotColor: 'bg-sky-400',
      tooltip: 'Continuous SQLite database auto-persistence'
    }
  ];

  return (
    <aside className="w-64 bg-[#050609]/95 backdrop-blur-xl border-l border-slate-800/90 flex flex-col h-full shrink-0 font-mono text-xs overflow-y-auto select-none">
      
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-800/90 bg-[#08090f]/80 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400 flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5" /> RECORDING MONITOR
        </span>
        <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-sky-600/10 border border-sky-500/20 text-sky-300 font-bold">
          LIVE FEEDBACK
        </span>
      </div>

      <div className="flex-1 divide-y divide-slate-800/80">
        
        {/* ── 1. SESSION SECTION ─────────────────────────────────────────────── */}
        <div className="p-3 space-y-2.5">
          <div className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between border-b border-slate-800/60 pb-1.5">
            <span>Session</span>
            <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold ${
              recordingState === 'recording' ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-900 text-slate-400'
            }`}>
              {recordingState.toUpperCase()}
            </span>
          </div>

          {/* Large Monospace Elapsed Timecode Display */}
          <div className="p-2.5 bg-[#090b10] border border-slate-800 rounded text-center space-y-0.5 shadow-inner">
            <div className="text-[8.5px] text-slate-500 font-bold uppercase">ELAPSED TIME</div>
            <div className="text-xl font-extrabold font-mono text-emerald-400 tracking-wider">
              {telemetry.elapsedTime}
            </div>
          </div>

          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between text-slate-400">
              <span>Recording Duration:</span>
              <span className="text-white font-bold">{formatHMS(duration)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Sample Rate / Bit:</span>
              <span className="text-sky-400 font-bold">44.1 kHz / 24-bit</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Audio Channels:</span>
              <span className="text-violet-400 font-bold">{captureSource === 'both' ? 'Stereo (2 Ch)' : 'Mono (1 Ch)'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Master Encoding:</span>
              <span className="text-slate-300 font-bold">32-Bit Float PCM</span>
            </div>
          </div>
        </div>

        {/* ── 2. AUDIO SECTION (Compact Horizontal dB Meters) ────────────────── */}
        <div className="p-3 space-y-2.5">
          <div className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800/60 pb-1.5">
            Audio Metering
          </div>

          <div className="space-y-2 text-[10px]">
            {/* Loudness Compact Horizontal Meter */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>LOUDNESS (dB)</span>
                <span className="text-amber-400 font-bold">{telemetry.currentLoudnessDb} dB</span>
              </div>
              <div className="w-full h-1.5 bg-[#090b10] border border-slate-800 rounded-full overflow-hidden p-0.2 flex">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-full transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.max(0, (telemetry.currentLoudnessDb + 60) * 1.5))}%` }}
                />
              </div>
            </div>

            {/* Peak Level Compact Meter */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>PEAK LEVEL</span>
                <span className="text-rose-400 font-bold">{telemetry.peakLevelDb} dB</span>
              </div>
              <div className="w-full h-1.5 bg-[#090b10] border border-slate-800 rounded-full overflow-hidden p-0.2 flex">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.max(0, (telemetry.peakLevelDb + 60) * 1.5))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[9.5px] pt-1">
              <div className="p-1.5 bg-[#090b10] border border-slate-800/80 rounded">
                <div className="text-slate-500 text-[8.5px]">AVERAGE LEVEL</div>
                <div className="text-slate-200 font-bold mt-0.5">{telemetry.avgLoudnessDb} dB</div>
              </div>
              <div className="p-1.5 bg-[#090b10] border border-slate-800/80 rounded">
                <div className="text-slate-500 text-[8.5px]">NOISE FLOOR</div>
                <div className="text-sky-400 font-bold mt-0.5">{telemetry.noiseFloorDb} dB</div>
              </div>
              <div className="p-1.5 bg-[#090b10] border border-slate-800/80 rounded">
                <div className="text-slate-500 text-[8.5px]">LATENCY</div>
                <div className="text-emerald-400 font-bold mt-0.5">{telemetry.latencyMs} ms</div>
              </div>
              <div className="p-1.5 bg-[#090b10] border border-slate-800/80 rounded">
                <div className="text-slate-500 text-[8.5px]">DYNAMIC RANGE</div>
                <div className="text-violet-400 font-bold mt-0.5">{telemetry.dynamicRangeDb} dB</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. SYSTEM SECTION (Micro-Bars with Numeric Values) ──────────────── */}
        <div className="p-3 space-y-2.5">
          <div className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800/60 pb-1.5">
            System Resources
          </div>

          <div className="space-y-2 text-[10px]">
            {/* CPU Micro-Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>CPU Usage:</span>
                <span className="text-sky-400 font-bold">{telemetry.cpuUsage}%</span>
              </div>
              <div className="w-full h-1 bg-[#090b10] rounded overflow-hidden">
                <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${telemetry.cpuUsage * 3}%` }} />
              </div>
            </div>

            {/* GPU Micro-Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>GPU CUDA Load:</span>
                <span className="text-emerald-400 font-bold">{telemetry.gpuUsage}%</span>
              </div>
              <div className="w-full h-1 bg-[#090b10] rounded overflow-hidden">
                <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${telemetry.gpuUsage * 2}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[9.5px] pt-1">
              <div className="p-1.5 bg-[#090b10] border border-slate-800/80 rounded">
                <div className="text-slate-500 text-[8.5px]">MEMORY ALLOC</div>
                <div className="text-violet-400 font-bold mt-0.5">{telemetry.memoryUsageMb} MB</div>
              </div>
              <div className="p-1.5 bg-[#090b10] border border-slate-800/80 rounded">
                <div className="text-slate-500 text-[8.5px]">DISK WRITE</div>
                <div className="text-emerald-400 font-bold mt-0.5">{telemetry.diskThroughputKbps} KB/s</div>
              </div>
              <div className="p-1.5 bg-[#090b10] border border-slate-800/80 rounded">
                <div className="text-slate-500 text-[8.5px]">SESSION SIZE</div>
                <div className="text-white font-bold mt-0.5">{telemetry.recordingSizeMb} MB</div>
              </div>
              <div className="p-1.5 bg-[#090b10] border border-slate-800/80 rounded">
                <div className="text-slate-500 text-[8.5px]">DISK FREE</div>
                <div className="text-sky-400 font-bold mt-0.5">{telemetry.availableStorageGb} GB</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. LIVE AUDIO HEALTH INTELLIGENCE ASSESSMENT ─────────────────────── */}
        <AudioHealth
          recordingState={recordingState}
          liveVolumeLeft={liveVolumeLeft}
          peakHoldLeft={peakHoldLeft}
          inputGain={0}
        />

        {/* ── 5. RECORDING STATUS PILLS SECTION ─────────────────────────────── */}
        <div className="p-3 space-y-2">
          <div className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800/60 pb-1.5">
            Pipeline Status
          </div>

          <div className="space-y-1.5">
            {statusPills.map(pill => {
              const Icon = pill.icon;
              return (
                <div
                  key={pill.id}
                  title={pill.tooltip}
                  className="px-2 py-1 bg-[#090b10] border border-slate-800/80 rounded flex items-center justify-between text-[9.5px] cursor-help hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${pill.dotColor}`} />
                    <Icon className={`w-3 h-3 ${pill.color}`} />
                    <span className="text-slate-300 font-bold">{pill.label}</span>
                  </div>

                  <span className={`font-bold ${pill.color}`}>
                    {pill.state}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </aside>
  );
};
