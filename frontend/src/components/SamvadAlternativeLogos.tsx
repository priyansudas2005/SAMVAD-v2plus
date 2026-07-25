import React from 'react';

export type LogoConceptId = 'concept-1-wave' | 'concept-2-infinity' | 'concept-3-neural' | 'concept-4-prism';

// 1. Concept 1: "The Voice Mesh" (Intersecting Audio Waveforms forming an 'S')
export const Concept1VoiceMesh: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="meshGrad" x1="10" y1="10" x2="90" y2="90">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <path
      d="M 25 30 Q 50 10 75 30 Q 50 50 25 70 Q 50 90 75 70"
      stroke="url(#meshGrad)" strokeWidth="8" strokeLinecap="round" fill="none"
    />
    <circle cx="50" cy="30" r="4" fill="#38BDF8" />
    <circle cx="50" cy="70" r="4" fill="#8B5CF6" />
  </svg>
);

// 2. Concept 2: "The Infinite Dialogue Loop" (Abstract infinity loop merging speech + STT text)
export const Concept2InfinityLoop: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="infGrad" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="50%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
    </defs>
    <path
      d="M 30 50 C 30 35, 15 35, 15 50 C 15 65, 30 65, 50 50 C 70 35, 85 35, 85 50 C 85 65, 70 65, 50 50 Z"
      stroke="url(#infGrad)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"
    />
    <rect x="46" y="42" width="8" height="16" rx="4" fill="#38BDF8" />
  </svg>
);

// 3. Concept 3: "The Neural Node" (Meeting Audio & AI Intelligence Network)
export const Concept3NeuralNode: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="neuralGrad" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="34" stroke="url(#neuralGrad)" strokeWidth="6" strokeDasharray="14 6" />
    <circle cx="50" cy="20" r="6" fill="#8B5CF6" />
    <circle cx="76" cy="65" r="6" fill="#38BDF8" />
    <circle cx="24" cy="65" r="6" fill="#6366F1" />
    <path d="M 50 20 L 76 65 L 24 65 Z" stroke="url(#neuralGrad)" strokeWidth="2.5" fill="none" opacity="0.6" />
    <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
  </svg>
);

// 4. Concept 4: "The Prism Focus" (Ultra-sleek modern geometry)
export const Concept4PrismFocus: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="prismGrad" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <rect x="25" y="25" width="50" height="50" rx="16" transform="rotate(45 50 50)" stroke="url(#prismGrad)" strokeWidth="6" />
    <line x1="32" y1="50" x2="68" y2="50" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    <line x1="50" y1="32" x2="50" y2="68" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// Corrected Wordmark Subtext: "AI MEETING ASSISTANT" (Single-line whitespace-nowrap)
export const SamvadBrandWordmarkCorrected: React.FC<{ mode?: 'dark' | 'light' }> = ({ mode = 'dark' }) => (
  <div className="flex flex-col select-none justify-center">
    <div className="flex items-center gap-1 font-sans font-black tracking-wider text-base leading-none">
      <span className={mode === 'light' ? 'text-slate-900' : 'text-white'}>
        S<span className="text-violet-400">Λ</span>MV<span className="text-cyan-400">Λ</span>D
      </span>
    </div>
    <span className="text-[8px] font-mono tracking-[0.16em] text-slate-400 uppercase font-semibold mt-1 whitespace-nowrap">
      AI MEETING ASSISTANT
    </span>
  </div>
);
