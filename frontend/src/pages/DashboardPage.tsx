import React, { useRef, useState, useEffect } from 'react';
import { 
  UploadCloud, 
  Mic, 
  Layers, 
  Clock, 
  FileText, 
  CheckSquare,
  Cpu,
  HardDrive,
  Zap,
  Radio,
  AlignLeft,
  Users,
  Sparkles
} from 'lucide-react';
import { Meeting } from '../types';
import { api } from '../services/api';

// Mouse-tracking spotlight bento card
const BentoItem: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      item.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };
    item.addEventListener('mousemove', handleMouseMove);
    return () => item.removeEventListener('mousemove', handleMouseMove);
  }, []);
  return (
    <div ref={itemRef} className={`bento-item ${className}`}>
      {children}
    </div>
  );
};

// Horizontal telemetry bar meter
const TelemetryBar: React.FC<{
  label: string; value: number; max: number; unit: string;
  color: string; glowColor: string; icon: React.ReactNode;
}> = ({ label, value, max, unit, color, glowColor, icon }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
        </div>
        <span className="text-xs font-mono font-bold" style={{ color }}>
          {value.toFixed(1)}<span className="text-slate-600 text-[10px] ml-0.5">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 8px ${glowColor}`,
          }}
        />
      </div>
    </div>
  );
};

// AI Pipeline step
const PIPELINE_STEPS = [
  { id: 'vad',  label: 'VAD',          icon: Radio,    color: 'text-sky-400',     glow: 'rgba(56,189,248,0.4)' },
  { id: 'stt',  label: 'STT',          icon: AlignLeft, color: 'text-indigo-400', glow: 'rgba(129,140,248,0.4)' },
  { id: 'dia',  label: 'Diarization',  icon: Users,     color: 'text-emerald-400', glow: 'rgba(52,211,153,0.4)' },
  { id: 'sum',  label: 'Summary Gen',  icon: Sparkles,  color: 'text-amber-400',  glow: 'rgba(251,191,36,0.4)' },
];

interface DashboardPageProps {
  meetings: Meeting[];
  onSelectMeeting: (meeting: Meeting) => void;
  setActivePage: (page: string) => void;
  refreshMeetings: () => Promise<void>;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  meetings,
  onSelectMeeting,
  setActivePage,
  refreshMeetings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute stats
  const totalMeetings = meetings.length;
  const totalDurationMin = meetings.reduce((acc, m) => acc + (m.duration || 0), 0) / 60;
  const totalWords = meetings.reduce((acc, m) => {
    const segmentWords = m.transcript?.reduce((sum, seg) => sum + seg.text.split(' ').length, 0) || 0;
    return acc + segmentWords;
  }, 0);
  const actionItemsCount = meetings.reduce((acc, m) => acc + (m.memo?.action_items?.length || 0), 0);

  // Telemetry
  const [telemetry, setTelemetry] = useState({
    cpu: 5.2,
    ram: 128,
    totalRam: 16384,
  });

  // Pipeline state: -1 = idle, 0-3 = running step N, 4 = all done
  const [activeStep, setActiveStep] = useState(-1);
  const [pipelineDone, setPipelineDone] = useState(false);

  useEffect(() => {
    const telInterval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        cpu: 4.5 + Math.random() * 4.5,
        ram: 128 + Math.random() * 12,
      }));
    }, 2500);

    // Sequentially activate each pipeline step using timeouts
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const STEP_DURATION = 1600;

    PIPELINE_STEPS.forEach((_, idx) => {
      timeouts.push(setTimeout(() => setActiveStep(idx), idx * STEP_DURATION));
    });

    // After last step finishes, mark pipeline as done
    timeouts.push(setTimeout(() => {
      setActiveStep(PIPELINE_STEPS.length); // past last index = none active
      setPipelineDone(true);
    }, PIPELINE_STEPS.length * STEP_DURATION));

    return () => {
      clearInterval(telInterval);
      timeouts.forEach(t => clearTimeout(t));
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) await uploadFile(e.target.files[0]);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const title = file.name.replace(/\.[^/.]+$/, '');
      const newMeeting = await api.uploadAudio(file, title);
      await refreshMeetings();
      onSelectMeeting(newMeeting);
      setActivePage('transcript');
    } catch (err: any) {
      setError(err.message || 'Failed to upload audio file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) await uploadFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-8 space-y-8 h-screen relative">

      {/* ── Ambient Mesh Orbs ─────────────────────────── */}
      <div className="ambient-orbs" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ── Header ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 relative z-10 border-b border-white/[0.03]">
        {/* Soft environmental lighting glow behind the title info */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-violet-500/5 rounded-full blur-[60px] pointer-events-none z-0" />
        
        <div className="relative z-10 flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-sans">
            Meeting Intelligence Studio
          </h1>
          <p className="text-slate-450 text-xs tracking-wide">
            Secure local speech extraction &amp; semantic pipeline workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 relative z-10">
          {[
            { label: 'Whisper: Ready', color: 'bg-emerald-400' },
            { label: 'VAD: Active',    color: 'bg-emerald-400' },
            { label: `CPU: ${telemetry.cpu.toFixed(1)}%`, color: 'bg-emerald-400' },
            { label: `RAM: ${(telemetry.ram / 1024).toFixed(2)} GB`, color: 'bg-sky-450' },
          ].map(b => (
            <div 
              key={b.label} 
              className="px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
              }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${b.color} status-ring-ready`} />
              <span className="text-[9px] font-mono font-bold text-slate-300 uppercase tracking-wider">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <BentoItem>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Meetings</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">{totalMeetings}</h3>
            </div>
            <div className="w-12 h-12 bg-[var(--accent-glow)]/10 rounded-xl flex items-center justify-center text-[var(--accent-primary)] border border-[var(--accent-glow)]/20">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </BentoItem>
        <BentoItem>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Duration Processed</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {totalDurationMin < 60 ? `${totalDurationMin.toFixed(1)}m` : `${(totalDurationMin / 60).toFixed(1)}h`}
              </h3>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </BentoItem>
        <BentoItem>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Words Transcribed</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {totalWords > 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}
              </h3>
            </div>
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </BentoItem>
        <BentoItem>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Action Items</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">{actionItemsCount}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/20">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>
        </BentoItem>
      </div>

      {/* ── Upload + Telemetry Row ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative z-10">

        {/* Upload dropzone — 3 cols */}
        <div className="lg:col-span-3">
          <BentoItem className={`bento-upload px-8 pb-8 flex flex-col items-center justify-center text-center min-h-[300px] ${dragActive ? 'drag-active' : ''}`}>
            <div className="w-full h-full flex flex-col items-center justify-center"
              onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}>
              <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileChange} disabled={uploading} />
              {uploading ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="audio-wave-container mb-2">
                    {[...Array(8)].map((_, i) => <div key={i} className="audio-wave-bar" />)}
                  </div>
                  <h4 className="text-lg font-bold text-white">Uploading audio...</h4>
                  <p className="text-sm text-slate-400">Storing recording file in local SQLite meeting database.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  {/* 3D Animated Folder */}
                  <div className="folder3d-container"
                    onDragEnter={handleDrag} onDragOver={handleDrag}
                    onDragLeave={handleDrag} onDrop={handleDrop}>
                    <div className="folder3d">
                      {/* back-side uses ::before and ::after for fanned pages */}
                      <div className="folder3d-back-side" />
                      <div className="folder3d-front-side">
                        <div className="folder3d-tip" />
                        <div className="folder3d-cover">
                          <UploadCloud className="folder3d-icon" />
                        </div>
                      </div>
                    </div>
                    <label className="folder3d-upload-btn" onClick={() => fileInputRef.current?.click()}>
                      Browse Files
                    </label>
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-white">Drop your audio file here</h4>
                    <p className="text-sm text-slate-400 mt-1 max-w-sm">Supports MP3, WAV, M4A, FLAC — drag &amp; drop or browse manually.</p>
                  </div>
                </div>
              )}
            </div>
          </BentoItem>
        </div>

        {/* Telemetry Monitor — 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* System Resources — horizontal bar meters */}
          <BentoItem className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> System Resources
              </p>
              <span className="text-[10px] font-mono text-emerald-500 font-bold tracking-wider">● LIVE</span>
            </div>
            <div className="flex flex-col gap-4">
              <TelemetryBar
                label="CPU Usage" value={telemetry.cpu} max={100} unit="%"
                color="#38bdf8" glowColor="rgba(56,189,248,0.5)"
                icon={<Cpu className="w-3.5 h-3.5 text-sky-400" />}
              />
              <TelemetryBar
                label="RAM" value={telemetry.ram} max={telemetry.totalRam} unit="MB"
                color="#34d399" glowColor="rgba(52,211,153,0.5)"
                icon={<HardDrive className="w-3.5 h-3.5 text-emerald-400" />}
              />
              <TelemetryBar
                label="DB Size" value={24.2} max={500} unit="MB"
                color="#818cf8" glowColor="rgba(129,140,248,0.5)"
                icon={<Zap className="w-3.5 h-3.5 text-indigo-400" />}
              />
            </div>
          </BentoItem>

          {/* AI Pipeline steps — overflow-visible so banner isn't clipped */}
          <div className="bento-item flex-1" style={{ overflow: 'visible' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-sky-400" /> AI Pipeline
              </p>
              {pipelineDone
                ? <span className="text-[10px] font-mono text-emerald-500 font-bold tracking-wider">● READY</span>
                : <span className="text-[10px] font-mono text-sky-400 font-bold tracking-wider pipeline-blink">● RUNNING</span>
              }
            </div>
            <div className="flex flex-col gap-1.5">
              {PIPELINE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx === activeStep && !pipelineDone;
                const isDone = pipelineDone || idx < activeStep;
                const isPending = !isDone && !isActive;
                return (
                  <div key={step.id}
                    className={`pipeline-step ${isActive ? 'pipeline-active' : ''} ${isDone ? 'pipeline-done' : ''}`}
                    style={{ '--step-glow': step.glow } as React.CSSProperties}>
                    <div className={`pipeline-dot ${isActive ? 'animate-pulse' : ''}`} />
                    <Icon className={`w-3.5 h-3.5 ${
                      isDone ? 'text-emerald-500' : isActive ? step.color : 'text-slate-700'
                    }`} />
                    <span className={`text-xs font-bold tracking-wide ${
                      isDone ? 'text-slate-400' : isActive ? 'text-white' : 'text-slate-700'
                    }`}>
                      {step.label}
                    </span>
                    {isDone && <span className="ml-auto text-[10px] text-emerald-500 font-bold">✓ Done</span>}
                    {isActive && <span className="ml-auto text-[10px] text-sky-400 font-bold pipeline-blink">● Running</span>}
                    {isPending && <span className="ml-auto text-[10px] text-slate-700 font-bold">Queued</span>}
                  </div>
                );
              })}
            </div>
            {pipelineDone && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center tracking-widest">
                ✦ Pipeline Ready
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
