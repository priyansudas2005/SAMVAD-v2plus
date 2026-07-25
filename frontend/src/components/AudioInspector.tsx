import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  Tag, 
  Mic, 
  ShieldCheck, 
  Activity, 
  SlidersHorizontal, 
  Cpu, 
  Users, 
  Sparkles, 
  HardDrive, 
  RotateCcw, 
  Download, 
  Upload, 
  Sliders, 
  Zap,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Radio
} from 'lucide-react';

export interface AudioInspectorProps {
  title: string;
  setTitle: (t: string) => void;
  recordingState: 'idle' | 'recording' | 'paused' | 'stopped';
  inputGain: number;
  setInputGain: (g: number) => void;
  captureSource: 'mic' | 'system' | 'both';
  setCaptureSource: (s: 'mic' | 'system' | 'both') => void;
  modelSize: string;
  setModelSize: (s: string) => void;
  vadEnabled: boolean;
  setVadEnabled: (v: boolean) => void;
  selectedMicDevice: string;
  setSelectedMicDevice: (m: string) => void;
  duration: number;
}

export const AudioInspector: React.FC<AudioInspectorProps> = ({
  title,
  setTitle,
  recordingState,
  inputGain,
  setInputGain,
  captureSource,
  setCaptureSource,
  modelSize,
  setModelSize,
  vadEnabled,
  setVadEnabled,
  selectedMicDevice,
  setSelectedMicDevice,
  duration
}) => {
  // Collapsible section open/close state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    session: true,
    audioInput: true,
    monitoring: true,
    processing: false,
    speakerIntelligence: false,
    quality: true,
    storage: false,
    quickActions: false
  });

  // Category & Tag States
  const [category, setCategory] = useState<string>('Executive Briefing');
  const [project, setProject] = useState<string>('SAMVAD v2.0 AI');
  const [tags, setTags] = useState<string>('roadmap, architecture');
  const [monitoringVol, setMonitoringVol] = useState<number>(85);
  const [micSensitivity, setMicSensitivity] = useState<number>(-42);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  // Animated live meter levels
  const [liveMeterLevel, setLiveMeterLevel] = useState<number>(0);
  const [peakLevelDb, setPeakLevelDb] = useState<number>(-60.0);

  useEffect(() => {
    let interval: any;
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        const randomLevel = Math.random() * 0.65 + 0.15;
        setLiveMeterLevel(randomLevel);
        setPeakLevelDb(Number((20 * Math.log10(randomLevel)).toFixed(1)));
      }, 100);
    } else {
      setLiveMeterLevel(0);
      setPeakLevelDb(-60.0);
    }
    return () => clearInterval(interval);
  }, [recordingState]);

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateSizeMb = (secs: number) => (secs * 0.1764).toFixed(2);
  const calculateRemainingMins = (secs: number) => Math.max(0, 1420 - Math.floor(secs / 60));

  return (
    <aside className="w-64 bg-[#050609]/95 backdrop-blur-xl border-r border-slate-800/90 flex flex-col h-full shrink-0 font-mono text-xs overflow-y-auto select-none">
      
      {/* Inspector Panel Title */}
      <div className="p-3 border-b border-slate-800/90 bg-[#08090f]/80 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" /> AUDIO INSPECTOR
        </span>
        <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-violet-600/10 border border-violet-500/20 text-violet-300 font-bold">
          LIVE CONTROL
        </span>
      </div>

      <div className="flex-1 divide-y divide-slate-800/80">
        
        {/* ── 1. RECORDING SESSION SECTION ─────────────────────────────────── */}
        <div>
          <button
            onClick={() => toggleSection('session')}
            className="w-full p-2.5 bg-[#07080e]/60 hover:bg-[#0a0c14] flex items-center justify-between text-[10px] font-bold text-slate-300 transition-all"
          >
            <span className="flex items-center gap-1.5 text-violet-400">
              <Folder className="w-3 h-3" /> RECORDING SESSION
            </span>
            {openSections.session ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {openSections.session && (
            <div className="p-3 space-y-2.5 bg-[#030407]/60">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-bold">Meeting Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#090b10] border border-slate-800 rounded px-2 py-1 text-[10.5px] text-white font-sans focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#090b10] border border-slate-800 rounded p-1 text-[10px] text-slate-200"
                  >
                    <option value="Executive Briefing">Executive</option>
                    <option value="Sprint Review">Sprint Review</option>
                    <option value="Client Demo">Client Demo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Project</label>
                  <input
                    type="text"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="w-full bg-[#090b10] border border-slate-800 rounded p-1 text-[10px] text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-bold">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-[#090b10] border border-slate-800 rounded p-1 text-[10px] text-slate-300"
                />
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-800/60 text-[9.5px]">
                <span className="text-slate-400">Status:</span>
                <span className={`font-bold uppercase ${recordingState === 'recording' ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  {recordingState}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── 2. AUDIO INPUT SECTION ────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => toggleSection('audioInput')}
            className="w-full p-2.5 bg-[#07080e]/60 hover:bg-[#0a0c14] flex items-center justify-between text-[10px] font-bold text-slate-300 transition-all"
          >
            <span className="flex items-center gap-1.5 text-sky-400">
              <Mic className="w-3 h-3" /> AUDIO INPUT
            </span>
            {openSections.audioInput ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {openSections.audioInput && (
            <div className="p-3 space-y-2 bg-[#030407]/60 text-[10px]">
              {/* Audio Capture Mode Selector */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-bold">Capture Source</label>
                <div className="grid grid-cols-3 gap-1 bg-[#090b10] border border-slate-800 p-1 rounded-lg text-center">
                  {[
                    { id: 'mic', label: 'Mic', icon: Mic, activeClass: 'bg-[#8B5CF6] text-white font-bold shadow' },
                    { id: 'system', label: 'System', icon: Radio, activeClass: 'bg-[#06B6D4] text-white font-bold shadow' },
                    { id: 'both', label: 'Mix', icon: Activity, activeClass: 'bg-[#10B981] text-white font-bold shadow' }
                  ].map(item => {
                    const Icon = item.icon;
                    const isActive = captureSource === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCaptureSource(item.id as any)}
                        className={`py-1 rounded text-[9.5px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          isActive ? item.activeClass : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-2.5 h-2.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 uppercase font-bold">Selected Microphone</label>
                <select
                  value={selectedMicDevice}
                  onChange={(e) => setSelectedMicDevice(e.target.value)}
                  className="w-full bg-[#090b10] border border-slate-800 rounded p-1 text-slate-200 font-semibold"
                >
                  <option value="Default Microphone">Default USB Microphone</option>
                  <option value="Realtek High Definition">Realtek Audio HD</option>
                  <option value="Virtual Audio Cable">Virtual Audio Cable</option>
                </select>
              </div>

              <div className="p-2 bg-[#090b10] border border-slate-800/80 rounded space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Device Health:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Optimal
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sample Rate:</span>
                  <span className="text-sky-400 font-bold">44.1 kHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bit Depth:</span>
                  <span className="text-slate-200 font-bold">24-bit PCM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Channels:</span>
                  <span className="text-violet-400 font-bold">{captureSource === 'both' ? 'Stereo (2 Ch)' : 'Mono (1 Ch)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hardware Latency:</span>
                  <span className="text-emerald-400 font-bold">14 ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Audio Driver:</span>
                  <span className="text-slate-300 font-bold">WASAPI Exclusive</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. LIVE INPUT MONITORING SECTION ──────────────────────────────── */}
        <div>
          <button
            onClick={() => toggleSection('monitoring')}
            className="w-full p-2.5 bg-[#07080e]/60 hover:bg-[#0a0c14] flex items-center justify-between text-[10px] font-bold text-slate-300 transition-all"
          >
            <span className="flex items-center gap-1.5 text-amber-400">
              <Activity className="w-3 h-3" /> LIVE MONITORING
            </span>
            {openSections.monitoring ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {openSections.monitoring && (
            <div className="p-3 space-y-2.5 bg-[#030407]/60 text-[10px]">
              {/* Gain Control */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold">
                  <span className="text-slate-400">INPUT GAIN</span>
                  <span className="text-sky-400">{inputGain > 0 ? `+${inputGain}` : inputGain} dB</span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={inputGain}
                  onChange={(e) => setInputGain(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer h-1 bg-[#090b10] rounded"
                />
              </div>

              {/* Animated Mini Level Meter Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>LIVE INPUT LEVEL</span>
                  <span className="text-emerald-400 font-bold">{peakLevelDb} dB</span>
                </div>
                <div className="w-full h-2.5 bg-[#090b10] border border-slate-800 rounded p-0.5 overflow-hidden flex items-center gap-0.5">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-full flex-1 rounded-xs transition-all ${
                        i < liveMeterLevel * 20 
                          ? i > 16 ? 'bg-rose-500' : i > 12 ? 'bg-amber-400' : 'bg-emerald-400' 
                          : 'bg-slate-900'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Monitoring Vol & Sensitivity */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>MONITOR VOLUME</span>
                  <span className="text-slate-300 font-bold">{monitoringVol}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={monitoringVol}
                  onChange={(e) => setMonitoringVol(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer h-1 bg-[#090b10] rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 4. AUDIO PROCESSING SECTION ───────────────────────────────────── */}
        <div>
          <button
            onClick={() => toggleSection('processing')}
            className="w-full p-2.5 bg-[#07080e]/60 hover:bg-[#0a0c14] flex items-center justify-between text-[10px] font-bold text-slate-300 transition-all"
          >
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Cpu className="w-3 h-3" /> AUDIO PROCESSING
            </span>
            {openSections.processing ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {openSections.processing && (
            <div className="p-3 space-y-2 bg-[#030407]/60 text-[9.5px]">
              {[
                { name: 'Noise Suppression', state: vadEnabled ? 'Active (24dB)' : 'Disabled', latency: '4ms', cpu: '1.2%' },
                { name: 'Echo Cancellation', state: 'Active (AEC)', latency: '6ms', cpu: '1.8%' },
                { name: 'Auto Gain Control', state: 'Active (AGC)', latency: '2ms', cpu: '0.6%' },
                { name: 'Voice Activity Detection', state: 'Silero VAD', latency: '8ms', cpu: '2.4%' },
                { name: 'High-pass Filter', state: 'Active (80Hz)', latency: '1ms', cpu: '0.3%' },
                { name: 'Normalize Audio', state: 'EBU R128 (-23 LUFS)', latency: '3ms', cpu: '0.9%' }
              ].map(proc => (
                <div key={proc.name} className="p-2 bg-[#090b10] border border-slate-800/80 rounded space-y-0.5">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>{proc.name}</span>
                    <span className="text-emerald-400">{proc.state}</span>
                  </div>
                  <div className="flex justify-between text-[8.5px] text-slate-400">
                    <span>Latency Impact: <strong className="text-slate-300">{proc.latency}</strong></span>
                    <span>CPU Cost: <strong className="text-sky-400">{proc.cpu}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 5. SPEAKER INTELLIGENCE SECTION ───────────────────────────────── */}
        <div>
          <button
            onClick={() => toggleSection('speakerIntelligence')}
            className="w-full p-2.5 bg-[#07080e]/60 hover:bg-[#0a0c14] flex items-center justify-between text-[10px] font-bold text-slate-300 transition-all"
          >
            <span className="flex items-center gap-1.5 text-violet-300">
              <Users className="w-3 h-3" /> SPEAKER INTELLIGENCE
            </span>
            {openSections.speakerIntelligence ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {openSections.speakerIntelligence && (
            <div className="p-3 space-y-2 bg-[#030407]/60 text-[10px]">
              <div className="p-2 bg-[#090b10] border border-slate-800/80 rounded space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Speaker Diarization:</span>
                  <span className="text-emerald-400 font-bold">PyAnnote 3.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Detected Speakers:</span>
                  <span className="text-amber-400 font-bold">2 Identified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Speaker:</span>
                  <span className="text-violet-400 font-bold">Speaker 1 (Host)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Speaker Confidence:</span>
                  <span className="text-sky-400 font-bold">98.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Profile Status:</span>
                  <span className="text-emerald-400 font-bold">Embedding Synced</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 6. RECORDING QUALITY SECTION ──────────────────────────────────── */}
        <div>
          <button
            onClick={() => toggleSection('quality')}
            className="w-full p-2.5 bg-[#07080e]/60 hover:bg-[#0a0c14] flex items-center justify-between text-[10px] font-bold text-slate-300 transition-all"
          >
            <span className="flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-3 h-3" /> RECORDING QUALITY
            </span>
            {openSections.quality ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {openSections.quality && (
            <div className="p-3 space-y-2 bg-[#030407]/60 text-[10px]">
              <div className="p-2 bg-[#090b10] border border-slate-800/80 rounded space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Signal Quality Score:</span>
                  <span className="text-emerald-400 font-bold">98 / 100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Speech Coverage:</span>
                  <span className="text-sky-400 font-bold">84.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Clipping Status:</span>
                  <span className="text-emerald-400 font-bold">0 Distortion</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated SNR:</span>
                  <span className="text-amber-400 font-bold">+42.8 dB</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 7. STORAGE SECTION ────────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => toggleSection('storage')}
            className="w-full p-2.5 bg-[#07080e]/60 hover:bg-[#0a0c14] flex items-center justify-between text-[10px] font-bold text-slate-300 transition-all"
          >
            <span className="flex items-center gap-1.5 text-sky-400">
              <HardDrive className="w-3 h-3" /> STORAGE &amp; DISK
            </span>
            {openSections.storage ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {openSections.storage && (
            <div className="p-3 space-y-2 bg-[#030407]/60 text-[10px]">
              <div className="p-2 bg-[#090b10] border border-slate-800/80 rounded space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current File Size:</span>
                  <span className="text-white font-bold">{calculateSizeMb(duration)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Space:</span>
                  <span className="text-emerald-400 font-bold">248.5 GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Auto Save Status:</span>
                  <span className="text-emerald-400 font-bold">Active (SQLite)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Remaining Time:</span>
                  <span className="text-sky-400 font-bold">{calculateRemainingMins(duration)} mins</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 8. QUICK ACTIONS SECTION ──────────────────────────────────────── */}
        <div>
          <button
            onClick={() => toggleSection('quickActions')}
            className="w-full p-2.5 bg-[#07080e]/60 hover:bg-[#0a0c14] flex items-center justify-between text-[10px] font-bold text-slate-300 transition-all"
          >
            <span className="flex items-center gap-1.5 text-rose-400">
              <Zap className="w-3 h-3" /> QUICK ACTIONS
            </span>
            {openSections.quickActions ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {openSections.quickActions && (
            <div className="p-3 space-y-2 bg-[#030407]/60 text-[10px]">
              <button 
                onClick={() => {
                  setIsCalibrating(true);
                  setTimeout(() => setIsCalibrating(false), 2000);
                }}
                className="w-full py-1.5 bg-[#090b10] hover:bg-violet-600/20 border border-slate-800 hover:border-violet-500/40 text-slate-300 hover:text-violet-300 rounded font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className={`w-3 h-3 ${isCalibrating ? 'animate-spin' : ''}`} />
                {isCalibrating ? 'Calibrating Mic...' : 'Test & Calibrate Microphone'}
              </button>

              <button 
                onClick={() => setInputGain(0)}
                className="w-full py-1.5 bg-[#090b10] hover:bg-slate-800 border border-slate-800 text-slate-300 rounded font-bold transition-all"
              >
                Reset Gain Levels (0 dB)
              </button>
            </div>
          )}
        </div>

      </div>

    </aside>
  );
};
