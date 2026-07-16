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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="icon-container-premium !w-7 !h-7 !rounded-lg text-slate-400">
            {icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
        </div>
        <span className="text-xs font-mono font-bold" style={{ color }}>
          {value.toFixed(1)}<span className="text-slate-550 text-[10px] ml-0.5">{unit}</span>
        </span>
      </div>
      <div className="progress-track-premium">
        <div
          className="progress-fill-premium transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 6px ${glowColor}`,
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
        {/* Soft environmental indirect lighting glow (violet, indigo, sky blue layers) */}
        <div className="absolute -top-16 -left-16 w-80 h-32 bg-violet-600/5 rounded-full blur-[80px] pointer-events-none z-0" />
        <div className="absolute -top-8 left-8 w-60 h-24 bg-indigo-600/5 rounded-full blur-[70px] pointer-events-none z-0" />
        <div className="absolute top-0 -left-12 w-48 h-20 bg-sky-500/3 rounded-full blur-[60px] pointer-events-none z-0" />
        
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
            { label: `RAM: ${(telemetry.ram / 1024).toFixed(2)} GB`, color: 'bg-sky-400' },
          ].map(b => (
            <div 
              key={b.label} 
              className="telemetry-capsule"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${b.color} status-ring-ready`} />
              <span className="text-[9px] font-mono font-bold text-slate-350 uppercase tracking-wider">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <div className="stat-card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Meetings</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">{totalMeetings}</h3>
            </div>
            <div className="icon-container-premium text-[var(--accent-primary)]">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="stat-card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Duration Processed</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {totalDurationMin < 60 ? `${totalDurationMin.toFixed(1)}m` : `${(totalDurationMin / 60).toFixed(1)}h`}
              </h3>
            </div>
            <div className="icon-container-premium text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="stat-card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Words Transcribed</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                {totalWords > 1000 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}
              </h3>
            </div>
            <div className="icon-container-premium text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="stat-card-premium p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Action Items</span>
              <h3 className="text-3xl font-extrabold text-white mt-1">{actionItemsCount}</h3>
            </div>
            <div className="icon-container-premium text-amber-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
        </div>
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
          <div className="stat-card-premium flex-1 p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <div className="icon-container-premium !w-7 !h-7 !rounded-lg text-slate-400">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="tracking-wide">System Resources</span>
              </p>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[9px] font-bold">
                <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400 status-ring-ready flex-shrink-0" />
                <span className="tracking-wider">LIVE</span>
              </div>
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
          </div>

          {/* AI Pipeline steps — overflow-visible so banner isn't clipped */}
          <div className="stat-card-premium flex-1 p-6" style={{ overflow: 'visible' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <div className="icon-container-premium !w-7 !h-7 !rounded-lg text-slate-400">
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <span className="tracking-wide">AI Pipeline</span>
              </p>
              {pipelineDone ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[9px] font-bold">
                  <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400 status-ring-ready flex-shrink-0" />
                  <span className="tracking-wider">READY</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/15 text-sky-400 text-[9px] font-bold">
                  <span className="relative w-1.5 h-1.5 rounded-full bg-sky-400 status-ring-ready flex-shrink-0 pipeline-blink" />
                  <span className="tracking-wider">RUNNING</span>
                </div>
              )}
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
                    <div className="icon-container-premium !w-6 !h-6 !rounded-md text-slate-400 flex-shrink-0">
                      <Icon className={`w-3.5 h-3.5 ${
                        isDone ? 'text-emerald-400' : isActive ? step.color : 'text-slate-650'
                      }`} />
                    </div>
                    <span className={`text-xs font-bold tracking-wide ${
                      isDone ? 'text-slate-400' : isActive ? 'text-white' : 'text-slate-600'
                    }`}>
                      {step.label}
                    </span>
                    {isDone && (
                      <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/10">
                        <span className="relative w-1 h-1 rounded-full bg-emerald-400 status-ring-ready" />
                        <span>Done</span>
                      </div>
                    )}
                    {isActive && (
                      <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[9px] font-bold border border-sky-500/10">
                        <span className="relative w-1 h-1 rounded-full bg-sky-400 status-ring-ready pipeline-blink" />
                        <span>Running</span>
                      </div>
                    )}
                    {isPending && (
                      <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/60 text-slate-600 text-[9px] font-bold border border-slate-800">
                        <span>Queued</span>
                      </div>
                    )}
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
