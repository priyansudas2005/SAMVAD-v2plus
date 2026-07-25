import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Command, 
  Mic, 
  BarChart4, 
  Bell, 
  HelpCircle, 
  Check, 
  RotateCcw,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ProductTourStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  targetId: string;
  page: string;
  shortcut?: string[];
}

export interface InteractiveProductTourProps {
  isOpen: boolean;
  onClose: () => void;
  setActivePage: (page: string) => void;
}

const TOUR_STEPS: ProductTourStep[] = [
  {
    id: 1,
    title: 'Command Palette Launcher',
    subtitle: 'Universal Productivity Control',
    description: 'Trigger the command palette from anywhere using Ctrl+K to navigate pages, execute instant AI meeting summaries, and search across sessions.',
    icon: Command,
    targetId: 'tour-target-palette',
    page: 'dashboard',
    shortcut: ['Ctrl', 'K']
  },
  {
    id: 2,
    title: 'Offline Audio Capture Studio',
    subtitle: 'Multi-channel Recording Engine',
    description: 'Capture microphone and system audio streams offline. Supports live VAD silence detection and automated noise suppression.',
    icon: Mic,
    targetId: 'tour-target-[#tour-target-audio-capture]',
    page: 'recorder',
    shortcut: ['Ctrl', 'R']
  },
  {
    id: 3,
    title: 'Executive Analytics Studio',
    subtitle: 'Meeting Intelligence Trends',
    description: 'Deep workspace metrics analyzing meeting volume, action items, speaker performance, decision density, and system telemetry.',
    icon: BarChart4,
    targetId: 'tour-target-analytics',
    page: 'analytics',
    shortcut: ['Ctrl', '5']
  },
  {
    id: 4,
    title: 'Desktop Notification Center',
    subtitle: 'Real-time Event Drawer',
    description: 'Desktop-grade event log tracking recording states, Whisper AI completion alerts, model status warnings, and export triggers.',
    icon: Bell,
    targetId: 'tour-target-notifications',
    page: 'dashboard',
    shortcut: ['Ctrl', 'B']
  },
  {
    id: 5,
    title: 'Control Center & Customization',
    subtitle: 'Preferences, Hotkeys & Brand',
    description: 'Configure hardware models, customize global keyboard hotkeys, adjust PDF document styles, and view the brand identity system.',
    icon: Sliders,
    targetId: 'tour-target-settings',
    page: 'settings'
  }
];

export const InteractiveProductTour: React.FC<InteractiveProductTourProps> = ({
  isOpen,
  onClose,
  setActivePage
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Sync active page with tour step
  useEffect(() => {
    if (!isOpen) return;
    const currentStep = TOUR_STEPS[currentStepIndex];
    if (currentStep && currentStep.page) {
      setActivePage(currentStep.page);
    }
  }, [currentStepIndex, isOpen, setActivePage]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIndex];
  const IconComp = step.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4 font-sans select-none">
        
        {/* Semi-transparent Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs pointer-events-auto"
          onClick={onClose}
        />

        {/* Floating Product Tour Card Window */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-lg bg-[#0e1017]/95 border border-slate-800 shadow-2xl rounded-2xl p-6 pointer-events-auto backdrop-blur-md transform-gpu"
        >
          {/* Header Action Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400">
                <IconComp className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Product Feature Tour
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  Step {step.id} of {TOUR_STEPS.length}
                </span>
              </div>
            </div>

            {/* Skip Tour Button */}
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1 font-mono hover:border-slate-700"
            >
              Skip Tour <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step Content */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                {step.title}
                {step.shortcut && (
                  <div className="flex items-center gap-1 ml-1">
                    {step.shortcut.map((sc, i) => (
                      <kbd key={i} className="px-1.5 py-0.5 text-[9px] font-mono text-slate-300 bg-slate-900 border border-slate-800 rounded">
                        {sc}
                      </kbd>
                    ))}
                  </div>
                )}
              </h3>
              <p className="text-xs font-semibold text-violet-400 mt-0.5">{step.subtitle}</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-normal bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              {step.description}
            </p>
          </div>

          {/* Stepper Dots & Navigation Footer */}
          <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-800/80">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    currentStepIndex === idx 
                      ? 'w-6 bg-violet-500 shadow-md shadow-violet-500/40' 
                      : 'w-1.5 bg-slate-800 hover:bg-slate-700'
                  }`}
                  title={`Go to step ${s.id}`}
                />
              ))}
            </div>

            {/* Prev / Next Buttons */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-lg shadow-violet-600/25 flex items-center gap-1.5"
              >
                {isLast ? 'Complete Tour' : 'Next Feature'}
                {isLast ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
