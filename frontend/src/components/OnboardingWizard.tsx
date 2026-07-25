import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Folder, 
  Mic, 
  Volume2, 
  Cpu, 
  HardDrive, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  Play, 
  Square,
  Sliders,
  Globe,
  Palette,
  FileCheck,
  Zap,
  Activity,
  Layers,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SamvadSignatureHelixLogo } from './SamvadSignatureHelixLogo';

export interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: (action: 'record' | 'dashboard') => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState<number>(1);

  // Step 2: System Check States
  const [checkingSystem, setCheckingSystem] = useState(true);
  const [sysStatus, setSysStatus] = useState({
    models: false,
    gpu: false,
    cpu: false,
    ram: false,
    storage: false
  });

  // Step 3: Audio States
  const [microphones, setMicrophones] = useState<string[]>([
    'Default Microphone (Realtek High Definition Audio)',
    'USB Condenser Mic (SAMVAD Audio Layer)',
    'Virtual Cable Output'
  ]);
  const [selectedMic, setSelectedMic] = useState<string>('Default Microphone (Realtek High Definition Audio)');
  const [isTestingMic, setIsTestingMic] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [recordingQuality, setRecordingQuality] = useState<string>('high');

  // Step 4: Workspace States
  const [workspacePath, setWorkspacePath] = useState<string>('C:\\Users\\priya\\Documents\\SAMVAD_Workspace');
  const [exportPath, setExportPath] = useState<string>('C:\\Users\\priya\\Documents\\SAMVAD_Exports');
  const [selectedTheme, setSelectedTheme] = useState<string>('samvad-dark');
  const [selectedLang, setSelectedLang] = useState<string>('auto');

  // Simulate System Readiness Check on Step 2
  useEffect(() => {
    if (step === 2) {
      setCheckingSystem(true);
      const timer1 = setTimeout(() => setSysStatus(s => ({ ...s, models: true })), 400);
      const timer2 = setTimeout(() => setSysStatus(s => ({ ...s, gpu: true })), 800);
      const timer3 = setTimeout(() => setSysStatus(s => ({ ...s, cpu: true })), 1200);
      const timer4 = setTimeout(() => setSysStatus(s => ({ ...s, ram: true })), 1600);
      const timer5 = setTimeout(() => {
        setSysStatus(s => ({ ...s, storage: true }));
        setCheckingSystem(false);
      }, 2000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        clearTimeout(timer5);
      };
    }
  }, [step]);

  // Simulate Audio Level Meters on Step 3
  useEffect(() => {
    let interval: any;
    if (isTestingMic) {
      interval = setInterval(() => {
        setAudioLevel(Math.floor(Math.random() * 65) + 20);
      }, 100);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [isTestingMic]);

  if (!isOpen) return null;

  const stepsHeader = [
    { num: 1, title: 'Welcome' },
    { num: 2, title: 'AI Engine' },
    { num: 3, title: 'Audio Setup' },
    { num: 4, title: 'Workspace' },
    { num: 5, title: 'Ready' }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 font-sans select-none">
        
        {/* Main Onboarding Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-3xl bg-[#0d0f17] border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[580px] transform-gpu"
        >
          
          {/* Header Bar with Progress Indicator */}
          <div className="px-8 py-5 border-b border-slate-800/80 bg-[#10131c]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SamvadSignatureHelixLogo size={28} />
              <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
                SAMVAD Studio Setup
              </span>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center gap-6">
              {stepsHeader.map((s) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                      step === s.num 
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30 ring-2 ring-violet-400/40' 
                        : step > s.num 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className={`text-[11px] font-medium hidden sm:inline ${step === s.num ? 'text-white font-bold' : 'text-slate-500'}`}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Step Content Body */}
          <div className="flex-1 p-8 flex flex-col justify-center">
            
            {/* STEP 1: WELCOME */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center max-w-xl mx-auto">
                <div className="inline-flex p-4 rounded-3xl bg-violet-600/10 border border-violet-500/20 shadow-2xl">
                  <SamvadSignatureHelixLogo size={64} />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    Welcome to SAMVAD Studio
                  </h1>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    An offline, privacy-first AI meeting intelligence platform powered by local Whisper speech extraction, speaker diarization, and semantic pipeline processing.
                  </p>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-left space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> LOCAL DATA PRIVACY DIRECTIVE</span>
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">100% OFFLINE</span>
                  </div>
                  <p className="text-slate-400 text-[10.5px] font-sans">
                    All audio recordings, transcripts, speaker profiles, and executive summaries remain stored locally on your device hardware. Zero telemetry sent to remote cloud servers.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-violet-600/25 flex items-center gap-2 group"
                  >
                    Get Started <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    onClick={() => {
                      setStep(4);
                    }}
                    className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition-all flex items-center gap-2"
                  >
                    <Folder className="w-4 h-4 text-slate-400" /> Import Existing Workspace
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: AI ENGINE CHECK */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-xl mx-auto w-full">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                    <Cpu className="w-5 h-5 text-indigo-400" /> AI Engine System Readiness
                  </h2>
                  <p className="text-xs text-slate-400">Verifying local hardware acceleration layers & speech models.</p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
                  
                  {/* Item 1: Whisper Models */}
                  <div className="flex items-center justify-between p-3 bg-[#0a0c12] border border-slate-800/80 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-violet-400" />
                      <div>
                        <div className="text-white font-bold text-[11px]">Local AI Whisper Speech Models</div>
                        <div className="text-[9.5px] text-slate-400">Whisper-v3 (Base / Small / Medium)</div>
                      </div>
                    </div>
                    {sysStatus.models ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> READY
                      </span>
                    ) : (
                      <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {/* Item 2: GPU */}
                  <div className="flex items-center justify-between p-3 bg-[#0a0c12] border border-slate-800/80 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-sky-400" />
                      <div>
                        <div className="text-white font-bold text-[11px]">GPU Acceleration Layer</div>
                        <div className="text-[9.5px] text-slate-400">NVIDIA CUDA / ONNX Runtime (DirectML)</div>
                      </div>
                    </div>
                    {sysStatus.gpu ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE (CUDA)
                      </span>
                    ) : (
                      <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {/* Item 3: CPU */}
                  <div className="flex items-center justify-between p-3 bg-[#0a0c12] border border-slate-800/80 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-white font-bold text-[11px]">CPU Vector Pipeline</div>
                        <div className="text-[9.5px] text-slate-400">Multi-threaded PyAnnote Diarization</div>
                      </div>
                    </div>
                    {sysStatus.cpu ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> OPTIMIZED
                      </span>
                    ) : (
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {/* Item 4: RAM */}
                  <div className="flex items-center justify-between p-3 bg-[#0a0c12] border border-slate-800/80 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-white font-bold text-[11px]">RAM Allocation</div>
                        <div className="text-[9.5px] text-slate-400">16 GB System Memory Available</div>
                      </div>
                    </div>
                    {sysStatus.ram ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> SUFFICIENT
                      </span>
                    ) : (
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {/* Item 5: Storage */}
                  <div className="flex items-center justify-between p-3 bg-[#0a0c12] border border-slate-800/80 rounded-xl">
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="text-white font-bold text-[11px]">Storage Allocation</div>
                        <div className="text-[9.5px] text-slate-400">124.5 GB Free Disk Space</div>
                      </div>
                    </div>
                    {sysStatus.storage ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </span>
                    ) : (
                      <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                </div>

                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setStep(1)} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={checkingSystem}
                    className={`px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                      checkingSystem 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25'
                    }`}
                  >
                    Continue to Audio Setup <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: AUDIO SETUP */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-xl mx-auto w-full">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                    <Mic className="w-5 h-5 text-violet-400" /> Audio Device & Quality Setup
                  </h2>
                  <p className="text-xs text-slate-400">Configure default microphone input and verify live sound levels.</p>
                </div>

                <div className="space-y-4">
                  
                  {/* Select Microphone */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-300 uppercase">Input Microphone</label>
                    <select
                      value={selectedMic}
                      onChange={(e) => setSelectedMic(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      {microphones.map((m, i) => (
                        <option key={i} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Live Meter & Test Button */}
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-sky-400" /> Live Microphone Level Test
                      </span>
                      <button
                        onClick={() => setIsTestingMic(!isTestingMic)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isTestingMic 
                            ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' 
                            : 'bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30'
                        }`}
                      >
                        {isTestingMic ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        {isTestingMic ? 'Stop Test' : 'Test Mic'}
                      </button>
                    </div>

                    {/* Progress Bar Audio Meter */}
                    <div className="space-y-1">
                      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 flex items-center">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 via-sky-400 to-violet-500 rounded-full transition-all duration-75"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-500">
                        <span>-60 dB</span>
                        <span>-24 dB</span>
                        <span>0 dB</span>
                      </div>
                    </div>
                  </div>

                  {/* Default Quality */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-300 uppercase">Default Recording Quality</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'standard', label: 'Standard (16kHz)', desc: 'Fastest Whisper processing' },
                        { id: 'high', label: 'High (44.1kHz)', desc: 'Recommended for meeting studio' },
                        { id: 'lossless', label: 'Studio (48kHz FLAC)', desc: 'Maximum audio fidelity' }
                      ].map(q => (
                        <button
                          key={q.id}
                          onClick={() => setRecordingQuality(q.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            recordingQuality === q.id 
                              ? 'bg-violet-600/20 border-violet-500/60 text-white' 
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="text-xs font-bold">{q.label}</div>
                          <div className="text-[9.5px] text-slate-500 mt-0.5">{q.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setStep(2)} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-violet-600/25 flex items-center gap-2"
                  >
                    Continue to Workspace Setup <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: WORKSPACE SETUP */}
            {step === 4 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-xl mx-auto w-full">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                    <Folder className="w-5 h-5 text-sky-400" /> Workspace & Folder Paths
                  </h2>
                  <p className="text-xs text-slate-400">Choose storage locations, default export format, and visual theme.</p>
                </div>

                <div className="space-y-4 text-xs">
                  
                  {/* Workspace Folder */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-300 uppercase">Primary Workspace Directory</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={workspacePath}
                        onChange={(e) => setWorkspacePath(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                      />
                      <button className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs border border-slate-700">
                        Browse
                      </button>
                    </div>
                  </div>

                  {/* Export Directory */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-300 uppercase">Default Export Directory</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={exportPath}
                        onChange={(e) => setExportPath(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                      />
                      <button className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs border border-slate-700">
                        Browse
                      </button>
                    </div>
                  </div>

                  {/* Theme & Language Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-violet-400" /> Visual Theme
                      </label>
                      <select
                        value={selectedTheme}
                        onChange={(e) => setSelectedTheme(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="samvad-dark">SAMVAD Matte Dark</option>
                        <option value="professional-oled">OLED Midnight</option>
                        <option value="executive-slate">Executive Slate</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" /> Transcription Language
                      </label>
                      <select
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="auto">Auto-Detect Language</option>
                        <option value="en">English (US/UK)</option>
                        <option value="hi">Hindi (हिंदी)</option>
                        <option value="es">Spanish (Español)</option>
                        <option value="de">German (Deutsch)</option>
                      </select>
                    </div>
                  </div>

                </div>

                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setStep(3)} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                    Back
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-violet-600/25 flex items-center gap-2"
                  >
                    Finish Setup <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: READY */}
            {step === 5 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center max-w-xl mx-auto">
                <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-2xl animate-pulse">
                  <CheckCircle2 className="w-12 h-12" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    You're ready to begin.
                  </h1>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    SAMVAD Studio is fully configured and ready to capture, transcribe, and analyze your meetings offline.
                  </p>
                </div>

                {/* Summary Configuration Card */}
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl grid grid-cols-3 gap-3 text-left font-mono text-[10px]">
                  <div className="p-2.5 bg-[#0a0c12] rounded-xl border border-slate-800/80">
                    <div className="text-slate-500">AI ENGINE</div>
                    <div className="text-emerald-400 font-bold mt-0.5">Whisper-v3 CUDA</div>
                  </div>
                  <div className="p-2.5 bg-[#0a0c12] rounded-xl border border-slate-800/80">
                    <div className="text-slate-500">AUDIO MIC</div>
                    <div className="text-sky-400 font-bold mt-0.5 truncate">{selectedMic.split(' ')[0]}</div>
                  </div>
                  <div className="p-2.5 bg-[#0a0c12] rounded-xl border border-slate-800/80">
                    <div className="text-slate-500">PRIVACY</div>
                    <div className="text-violet-400 font-bold mt-0.5">100% Offline</div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-center gap-4">
                  <button
                    onClick={() => onComplete('record')}
                    className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-xl shadow-violet-600/30 flex items-center gap-2 group"
                  >
                    Start First Recording <Play className="w-4 h-4 fill-white transition-transform group-hover:scale-110" />
                  </button>

                  <button
                    onClick={() => onComplete('dashboard')}
                    className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition-all flex items-center gap-2"
                  >
                    Open Dashboard <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </motion.div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
