import React, { useState } from 'react';
import { Download, Sparkles, Copy, Check, ShieldCheck, Layers, RefreshCw, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export type BrandVariant = 
  | 'primary'
  | 'secondary'
  | 'icon'
  | 'app-icon'
  | 'favicon'
  | 'loading-icon'
  | 'wordmark'
  | 'symbol-only'
  | 'outline'
  | 'filled'
  | 'dark'
  | 'light'
  | 'monochrome'
  | 'glassmorphism'
  | 'gradient';

// Core Vector SVG Mark Generator
export const SamvadSymbol: React.FC<{ 
  variant?: 'gradient' | 'outline' | 'filled' | 'monochrome' | 'dark' | 'light' | 'glass';
  size?: number;
  className?: string;
  animate?: boolean;
}> = ({ variant = 'gradient', size = 48, className = '', animate = false }) => {
  const getGradientDefs = () => {
    switch (variant) {
      case 'monochrome':
        return (
          <linearGradient id={`symGrad-${variant}`} x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        );
      case 'light':
        return (
          <linearGradient id={`symGrad-${variant}`} x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        );
      default:
        return (
          <linearGradient id={`symGrad-${variant}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        );
    }
  };

  const isOutline = variant === 'outline';
  const isFilled = variant === 'filled';
  const isGlass = variant === 'glass';

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {getGradientDefs()}
        <filter id="glassBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Glassmorphism Background Base */}
      {isGlass && (
        <rect x="2" y="2" width="96" height="96" rx="24" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />
      )}

      {/* Speech Bubble Base (Left) */}
      <path
        d="M 22 18 C 12 18, 6 24, 6 34 L 6 52 C 6 62, 12 68, 22 68 L 30 68 L 22 80 L 36 68 L 52 68 C 55 68, 58 67, 60 65 L 60 48 C 60 30, 48 18, 22 18 Z"
        stroke={isFilled ? 'none' : `url(#symGrad-${variant})`}
        strokeWidth={isOutline ? "5" : "4.5"}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isFilled ? `url(#symGrad-${variant})` : "none"}
      />

      {/* Equalizer Soundwave Bars */}
      <rect x="15" y="38" width="3.5" height="10" rx="1.75" fill={isFilled ? '#ffffff' : '#8b5cf6'}>
        {animate && <animate attributeName="height" values="10;18;10" dur="1.2s" repeatCount="indefinite" />}
      </rect>
      <rect x="22" y="33" width="3.5" height="20" rx="1.75" fill={isFilled ? '#ffffff' : '#a78bfa'}>
        {animate && <animate attributeName="height" values="20;30;20" dur="1.2s" begin="0.2s" repeatCount="indefinite" />}
      </rect>
      <rect x="29" y="25" width="4" height="36" rx="2" fill={isFilled ? '#ffffff' : '#38bdf8'}>
        {animate && <animate attributeName="height" values="36;22;36" dur="1.2s" begin="0.4s" repeatCount="indefinite" />}
      </rect>
      <rect x="36" y="31" width="3.5" height="24" rx="1.75" fill={isFilled ? '#ffffff' : '#38bdf8'}>
        {animate && <animate attributeName="height" values="24;34;24" dur="1.2s" begin="0.1s" repeatCount="indefinite" />}
      </rect>
      <rect x="43" y="38" width="3.5" height="10" rx="1.75" fill={isFilled ? '#ffffff' : '#60a5fa'}>
        {animate && <animate attributeName="height" values="10;22;10" dur="1.2s" begin="0.3s" repeatCount="indefinite" />}
      </rect>

      {/* Document Sheet (Right Overlap) */}
      <path
        d="M 54 22 L 72 22 L 82 32 L 82 72 C 82 77, 78 81, 72 81 L 54 81 C 48 81, 44 77, 44 72 L 44 31 C 44 26, 48 22, 54 22 Z"
        fill={`url(#symGrad-${variant})`}
        opacity={isOutline ? 0.2 : 0.95}
      />

      {/* Folded Corner */}
      <path d="M 72 22 L 72 32 L 82 32 Z" fill={variant === 'monochrome' ? '#94a3b8' : '#38bdf8'} opacity="0.9" />

      {/* Document Lines */}
      <line x1="52" y1="42" x2="74" y2="42" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <line x1="52" y1="50" x2="74" y2="50" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <line x1="52" y1="58" x2="68" y2="58" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <circle cx="53" cy="66" r="2" fill="#ffffff" opacity="0.9" />
      <line x1="58" y1="66" x2="74" y2="66" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
};

// --- Wordmark Primitive ---
export const SamvadWordmark: React.FC<{ 
  variant?: 'dark' | 'light' | 'monochrome' | 'gradient'; 
  subtext?: boolean;
  className?: string; 
}> = ({ variant = 'dark', subtext = true, className = '' }) => {
  const isLight = variant === 'light';
  const isMono = variant === 'monochrome';

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <div className="flex items-center gap-1.5 font-sans font-extrabold tracking-tight">
        <span className={`text-xl ${isLight ? 'text-slate-900' : isMono ? 'text-white' : 'text-white'}`}>
          S<span className={isMono ? 'text-slate-300' : 'text-violet-400'}>Λ</span>MV<span className={isMono ? 'text-slate-300' : 'text-sky-400'}>Λ</span>D
        </span>
      </div>
      {subtext && (
        <span className={`text-[10px] font-mono tracking-widest uppercase font-semibold mt-0.5 ${
          isLight ? 'text-slate-500' : 'text-slate-400'
        }`}>
          AI Meeting Assistant
        </span>
      )}
    </div>
  );
};

// --- Brand System Viewer Component ---
export const BrandIdentitySystem: React.FC = () => {
  const [copiedVariant, setCopiedVariant] = useState<string | null>(null);

  const brandVariants: { id: BrandVariant; title: string; desc: string; bg: string; component: React.ReactNode }[] = [
    {
      id: 'primary',
      title: 'Primary Logo',
      desc: 'Standard horizontal lockup for headers, navigation bars, and website hero banners.',
      bg: 'bg-[#141722] border-slate-800',
      component: (
        <div className="flex items-center gap-3.5">
          <SamvadSymbol variant="gradient" size={44} />
          <SamvadWordmark variant="dark" subtext={true} />
        </div>
      )
    },
    {
      id: 'secondary',
      title: 'Secondary Vertical Logo',
      desc: 'Stacked vertical layout for splash screens, mobile cards, and documentation covers.',
      bg: 'bg-[#141722] border-slate-800',
      component: (
        <div className="flex flex-col items-center text-center space-y-2">
          <SamvadSymbol variant="gradient" size={56} />
          <SamvadWordmark variant="dark" subtext={true} />
        </div>
      )
    },
    {
      id: 'icon',
      title: 'Icon Mark',
      desc: 'Standalone symbol mark for toolbars, avatars, and inline system UI.',
      bg: 'bg-[#141722] border-slate-800',
      component: <SamvadSymbol variant="gradient" size={48} />
    },
    {
      id: 'app-icon',
      title: 'App Icon (Squircle)',
      desc: 'Desktop launcher & taskbar squircle icon with glassmorphic depth.',
      bg: 'bg-[#141722] border-slate-800',
      component: (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 via-slate-900 to-sky-600/20 border border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-xs" />
          <SamvadSymbol variant="gradient" size={40} />
        </div>
      )
    },
    {
      id: 'favicon',
      title: 'Favicon (16x16 / 32x32)',
      desc: 'High-contrast micro icon optimized for browser tabs.',
      bg: 'bg-[#141722] border-slate-800',
      component: (
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-md">
          <SamvadSymbol variant="filled" size={22} />
        </div>
      )
    },
    {
      id: 'loading-icon',
      title: 'Loading Animated Icon',
      desc: 'Live dynamic equalizer bars for processing & STT transcription states.',
      bg: 'bg-[#141722] border-slate-800',
      component: <SamvadSymbol variant="gradient" size={48} animate={true} />
    },
    {
      id: 'wordmark',
      title: 'Standalone Wordmark',
      desc: 'Pure typographic wordmark for minimalist footers and legal credits.',
      bg: 'bg-[#141722] border-slate-800',
      component: <SamvadWordmark variant="dark" subtext={true} />
    },
    {
      id: 'symbol-only',
      title: 'Symbol Only',
      desc: 'Unbounded raw vector geometry for watermark overlays.',
      bg: 'bg-[#141722] border-slate-800',
      component: <SamvadSymbol variant="gradient" size={48} />
    },
    {
      id: 'outline',
      title: 'Outline Version',
      desc: 'Clean line-art stroke configuration for technical blueprints and CAD.',
      bg: 'bg-[#141722] border-slate-800',
      component: (
        <div className="flex items-center gap-3">
          <SamvadSymbol variant="outline" size={44} />
          <SamvadWordmark variant="dark" subtext={false} />
        </div>
      )
    },
    {
      id: 'filled',
      title: 'Filled Version',
      desc: 'Solid silhouette fill for high-impact stamp printing and badges.',
      bg: 'bg-[#141722] border-slate-800',
      component: (
        <div className="flex items-center gap-3">
          <SamvadSymbol variant="filled" size={44} />
          <SamvadWordmark variant="dark" subtext={false} />
        </div>
      )
    },
    {
      id: 'dark',
      title: 'Dark Theme Version',
      desc: 'Optimized for SAMVAD matte black (#040404) workstation environment.',
      bg: 'bg-[#040404] border-slate-800/90',
      component: (
        <div className="flex items-center gap-3">
          <SamvadSymbol variant="gradient" size={44} />
          <SamvadWordmark variant="dark" subtext={true} />
        </div>
      )
    },
    {
      id: 'light',
      title: 'Light Theme Version',
      desc: 'High-contrast variant tailored for light mode documents and PDF exports.',
      bg: 'bg-slate-100 border-slate-300',
      component: (
        <div className="flex items-center gap-3">
          <SamvadSymbol variant="light" size={44} />
          <SamvadWordmark variant="light" subtext={true} />
        </div>
      )
    },
    {
      id: 'monochrome',
      title: 'Monochrome Version',
      desc: 'Pure grayscale lockup for single-color thermal printing.',
      bg: 'bg-[#141722] border-slate-800',
      component: (
        <div className="flex items-center gap-3">
          <SamvadSymbol variant="monochrome" size={44} />
          <SamvadWordmark variant="monochrome" subtext={true} />
        </div>
      )
    },
    {
      id: 'glassmorphism',
      title: 'Glassmorphism Version',
      desc: 'Frosted glass container with ambient backlight optics.',
      bg: 'bg-[#0e1016]',
      component: (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 shadow-2xl">
          <SamvadSymbol variant="glass" size={44} />
          <SamvadWordmark variant="dark" subtext={true} />
        </div>
      )
    },
    {
      id: 'gradient',
      title: 'Full Gradient Version',
      desc: 'Vibrant electric violet & sky blue gradient configuration.',
      bg: 'bg-[#141722] border-slate-800',
      component: (
        <div className="flex items-center gap-3">
          <SamvadSymbol variant="gradient" size={48} />
          <SamvadWordmark variant="dark" subtext={true} />
        </div>
      )
    }
  ];

  const handleCopySvg = (id: string) => {
    setCopiedVariant(id);
    setTimeout(() => setCopiedVariant(null), 2000);
  };

  return (
    <div className="p-6 bg-[#0e1016] min-h-screen text-slate-300 font-sans space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            SAMVAD Visual Identity & Brand System
          </h2>
          <p className="text-xs text-slate-400 mt-1">15 Unified Brand Assets, Logotypes, Icons & Theme Variants.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-mono font-bold rounded-lg flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Brand System v2.0
          </span>
        </div>
      </div>

      {/* Grid of 15 Brand Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {brandVariants.map((item) => (
          <div 
            key={item.id}
            className="bg-[#10131c] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">{item.title}</span>
                <button
                  onClick={() => handleCopySvg(item.id)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1 font-mono"
                  title="Copy asset specs"
                >
                  {copiedVariant === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
            </div>

            {/* Render Preview Box */}
            <div className={`p-6 rounded-xl border flex items-center justify-center min-h-[120px] ${item.bg}`}>
              {item.component}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
