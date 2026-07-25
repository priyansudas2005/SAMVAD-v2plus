import React from 'react';
import { 
  Mic, 
  Radio, 
  Cpu, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Play,
  Layers,
  Activity,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface FirstRecordingWizardProps {
  onStartRecording: () => void;
  activeStep?: 'record' | 'recording' | 'processing' | 'transcript' | 'summary' | 'done';
}

export const FirstRecordingWizard: React.FC<FirstRecordingWizardProps> = ({
  onStartRecording,
  activeStep = 'record'
}) => {
  const steps = [
    { id: 'record', label: 'Record Meeting', icon: Mic, desc: 'Capture audio' },
    { id: 'recording', label: 'Live Recording', icon: Radio, desc: 'Real-time VAD' },
    { id: 'processing', label: 'AI Processing', icon: Cpu, desc: 'Whisper & PyAnnote' },
    { id: 'transcript', label: 'Transcript', icon: FileText, desc: 'Speaker segments' },
    { id: 'summary', label: 'Summary', icon: Sparkles, desc: 'Action items & memo' },
    { id: 'done', label: 'Done', icon: CheckCircle2, desc: 'Complete' }
  ];

  const getStepStatus = (stepId: string, index: number) => {
    const currentIndex = steps.findIndex(s => s.id === activeStep);
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full bg-[#0d0f17]/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md font-sans select-none space-y-6">
      
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
            <Mic className="w-5 h-5 text-violet-400" /> First Meeting Onboarding Workflow
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Follow the 6-stage SAMVAD pipeline from live audio capture to AI meeting summary.
          </p>
        </div>

        <span className="px-2.5 py-1 bg-violet-600/10 border border-violet-500/20 text-violet-300 font-mono text-[10px] font-bold rounded-lg uppercase">
          Guided Workflow
        </span>
      </div>

      {/* Visual Pipeline Stepper (Horizontal Flow) */}
      <div className="grid grid-cols-6 gap-2 relative">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const status = getStepStatus(s.id, idx);
          const isCurrent = status === 'current';
          const isCompleted = status === 'completed';

          return (
            <div key={s.id} className="relative flex flex-col items-center text-center space-y-2 group">
              
              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div 
                  className={`absolute top-4 left-[55%] w-full h-[2px] z-0 transition-colors ${
                    isCompleted ? 'bg-emerald-500/60' : 'bg-slate-800'
                  }`} 
                />
              )}

              {/* Step Circle Icon */}
              <div 
                className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isCurrent 
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 ring-2 ring-violet-400/40 scale-105' 
                    : isCompleted 
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
                      : 'bg-slate-900 border border-slate-800 text-slate-500'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>

              {/* Step Text */}
              <div>
                <div className={`text-[11px] font-bold tracking-wide leading-tight ${
                  isCurrent ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  {s.label}
                </div>
                <div className="text-[9.5px] text-slate-500 mt-0.5 font-mono">{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Banner inside Empty State */}
      {activeStep === 'record' && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-violet-600/10 via-indigo-600/5 to-sky-600/10 border border-violet-500/20 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Ready to capture your first session
            </div>
            <p className="text-[11px] text-slate-400">
              Click below to initiate local microphone capture and experience SAMVAD's offline AI pipeline.
            </p>
          </div>

          <button
            onClick={onStartRecording}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-lg shadow-violet-600/25 flex items-center gap-2 shrink-0 group"
          >
            Record Your First Meeting <Play className="w-3.5 h-3.5 fill-white transition-transform group-hover:scale-110" />
          </button>
        </div>
      )}

    </div>
  );
};
