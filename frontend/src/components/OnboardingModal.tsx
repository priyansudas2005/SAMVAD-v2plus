import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight, ShieldCheck, Sparkles, Lock, Cpu } from 'lucide-react';
import { SamvadSignatureHelixLogo } from './SamvadSignatureHelixLogo';
import { SamvadBrandWordmarkCorrected } from './SamvadAlternativeLogos';

interface OnboardingModalProps {
  onComplete: (name: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onComplete(name.trim());
    }, 400);
  };

  const isValid = name.trim().length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030408]/90 backdrop-blur-2xl select-none">
      {/* Ambient Mesh Lighting Backdrop */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-sky-600/15 blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Onboarding Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg p-8 md:p-10 rounded-3xl bg-[#090b14]/80 border border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl relative overflow-hidden"
      >
        {/* Specular Edge Highlight */}
        <div className="absolute inset-0 rounded-3xl border border-white/[0.08] pointer-events-none" />
        
        {/* Header Logo & Title */}
        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="p-4 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.01] border border-white/[0.1] shadow-2xl shadow-violet-600/20 relative group"
          >
            <SamvadSignatureHelixLogo size={64} />
          </motion.div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <SamvadBrandWordmarkCorrected mode="dark" />
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-mono font-bold">
                v2.0
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome to SAMVAD
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xs mx-auto font-medium leading-relaxed">
              Your private AI-powered meeting workspace.
            </p>
          </div>
        </div>

        {/* Form Input Section */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5 relative z-10">
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Display Name
            </label>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-violet-400 transition-colors">
                <User className="w-4 h-4" />
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                autoFocus
                maxLength={40}
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[#05060c] border border-white/[0.1] focus:border-violet-500 text-white placeholder-slate-600 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-violet-500/20 transition-all shadow-inner"
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-normal flex items-start gap-1.5 pt-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>This name is stored locally and is only used to personalize your workspace.</span>
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
              isValid && !isSubmitting
                ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 hover:from-violet-500 hover:to-sky-400 text-white border border-white/20 shadow-violet-600/30 active:scale-[0.99]'
                : 'bg-white/[0.04] text-slate-600 border border-white/[0.05] cursor-not-allowed'
            }`}
          >
            <span>{isSubmitting ? 'Initializing Workspace...' : 'Continue'}</span>
            <ArrowRight className={`w-4 h-4 transition-transform ${isValid ? 'group-hover:translate-x-1' : ''}`} />
          </button>
        </form>

        {/* Offline Security Footer Pills */}
        <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-4 text-[10.5px] font-mono text-slate-400 relative z-10">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Offline
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1 text-sky-400">
            <Cpu className="w-3.5 h-3.5 text-sky-400" /> Local CUDA
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1 text-violet-400">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Zero Telemetry
          </span>
        </div>
      </motion.div>
    </div>
  );
};
