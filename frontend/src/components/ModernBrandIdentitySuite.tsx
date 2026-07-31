import React, { useState } from 'react';
import { Download, Copy, Check, Sparkles, Layers, ShieldCheck } from 'lucide-react';

export type SVGAssetType = 
  | 'full-horizontal'
  | 'full-vertical'
  | 'icon-only'
  | 'monochrome'
  | 'dark-mode'
  | 'favicon'
  | 'app-icon';

// --- Production SVG Generator ---

// 1. Core Abstract Geometric Icon SVG
export const SamvadModernIconSVG: React.FC<{
  size?: number;
  mode?: 'gradient' | 'monochrome' | 'dark' | 'light';
  className?: string;
}> = ({ size = 48, mode = 'gradient', className = '' }) => {
  const getColors = () => {
    switch (mode) {
      case 'monochrome':
        return { stroke: '#111827', fill: '#111827', gradStart: '#111827', gradEnd: '#374151' };
      case 'light':
        return { stroke: '#111827', fill: '#111827', gradStart: '#7C3AED', gradEnd: '#2563EB' };
      default: // dark & gradient
        return { stroke: '#FFFFFF', fill: '#FFFFFF', gradStart: '#7C3AED', gradEnd: '#2563EB' };
    }
  };

  const c = getColors();

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
        <linearGradient id={`modernSamvadGrad-${mode}`} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Abstract Outer Rounded Squircle / Speech Bubble Envelope */}
      <path
        d="M 28 16 H 72 C 81 16 88 23 88 32 V 64 C 88 73 81 80 72 80 H 42 L 26 92 V 80 C 18 80 12 73 12 64 V 32 C 12 23 18 16 28 16 Z"
        fill={`url(#modernSamvadGrad-${mode})`}
      />

      {/* Clean Abstract AI Document & Waveform Cutout (Negative Space) */}
      {/* 3 Symmetrical Vertical Waveform Columns cut out of center */}
      <rect x="32" y="36" width="6" height="24" rx="3" fill={mode === 'light' ? '#FFFFFF' : '#111827'} />
      <rect x="47" y="28" width="6" height="40" rx="3" fill={mode === 'light' ? '#FFFFFF' : '#111827'} />
      <rect x="62" y="36" width="6" height="24" rx="3" fill={mode === 'light' ? '#FFFFFF' : '#111827'} />

      {/* Abstract Minimal Document Fold Marker in Top Right */}
      <path
        d="M 72 16 L 88 32 H 72 V 16 Z"
        fill="#FFFFFF"
        opacity="0.25"
      />
    </svg>
  );
};

// 2. Custom Geometric Wordmark Component (Custom Letter A)
export const SamvadModernWordmarkSVG: React.FC<{
  mode?: 'dark' | 'light' | 'monochrome';
  className?: string;
}> = ({ mode = 'dark', className = '' }) => {
  const textColor = mode === 'light' ? '#111827' : '#FFFFFF';

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <svg width="180" height="34" viewBox="0 0 180 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="wordmarkGrad" x1="0" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        
        {/* Letter S */}
        <path d="M 18 10 C 13 10 9 13 9 17 C 9 21 13 22 18 23 C 23 24 27 25 27 29 C 27 33 23 36 17 36 C 11 36 8 32 8 32" stroke={textColor} strokeWidth="4" strokeLinecap="round" fill="none" />
        
        {/* Customized Geometric Letter A (Triangle Delta Variant) */}
        <path d="M 36 36 L 47 8 L 58 36" stroke="url(#wordmarkGrad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="47" cy="24" r="2.5" fill="#6366F1" />

        {/* Letter M */}
        <path d="M 68 36 V 8 L 78 24 L 88 8 V 36" stroke={textColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Letter V */}
        <path d="M 98 8 L 108 36 L 118 8" stroke={textColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Customized Geometric Letter A #2 */}
        <path d="M 128 36 L 139 8 L 150 36" stroke="url(#wordmarkGrad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="139" cy="24" r="2.5" fill="#2563EB" />

        {/* Letter D */}
        <path d="M 160 8 H 168 C 176 8 180 14 180 22 C 180 30 176 36 168 36 H 160 V 8 Z" stroke={textColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span className="text-[10px] font-mono tracking-[0.25em] text-slate-400 uppercase font-semibold mt-1">
        AI MEETING ASSISTANT
      </span>
    </div>
  );
};

// --- Complete 10 Deliverable SVGs Container ---
export const ModernBrandIdentityViewer: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 bg-[#0b0c10] min-h-screen text-slate-200 font-sans space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            SAMVAD Modern Vector Logo Suite
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Linear / Apple / Notion Inspired Minimal Abstract AI Meeting Brand System.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> 100% Scalable Vector SVG
          </span>
        </div>
      </div>

      {/* Grid of Deliverables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Horizontal Logo */}
        <div className="bg-[#12141d] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">1. Horizontal Logo</span>
            <p className="text-[11px] text-slate-400 mt-1">Primary header lockup with custom geometric letterforms.</p>
          </div>
          <div className="p-8 rounded-xl bg-[#08090d] border border-slate-800/80 flex items-center gap-4 justify-center">
            <SamvadModernIconSVG size={48} mode="gradient" />
            <SamvadModernWordmarkSVG mode="dark" />
          </div>
        </div>

        {/* 2. Vertical Logo */}
        <div className="bg-[#12141d] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">2. Vertical Logo</span>
            <p className="text-[11px] text-slate-400 mt-1">Stacked brand asset for splash screens & covers.</p>
          </div>
          <div className="p-8 rounded-xl bg-[#08090d] border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-3">
            <SamvadModernIconSVG size={56} mode="gradient" />
            <SamvadModernWordmarkSVG mode="dark" />
          </div>
        </div>

        {/* 3. Icon-Only SVG */}
        <div className="bg-[#12141d] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">3. Icon-Only SVG</span>
            <p className="text-[11px] text-slate-400 mt-1">Abstract mark merging speech, waveform, document & AI.</p>
          </div>
          <div className="p-8 rounded-xl bg-[#08090d] border border-slate-800/80 flex items-center justify-center">
            <SamvadModernIconSVG size={56} mode="gradient" />
          </div>
        </div>

        {/* 4. Monochrome Version */}
        <div className="bg-[#12141d] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">4. Monochrome Version</span>
            <p className="text-[11px] text-slate-400 mt-1">Single-color black fill for print & embossing.</p>
          </div>
          <div className="p-8 rounded-xl bg-slate-200 border border-slate-300 flex items-center gap-4 justify-center">
            <SamvadModernIconSVG size={44} mode="monochrome" />
            <SamvadModernWordmarkSVG mode="light" />
          </div>
        </div>

        {/* 5. Dark Mode Version */}
        <div className="bg-[#12141d] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">5. Dark Mode Version</span>
            <p className="text-[11px] text-slate-400 mt-1">Tailored for SAMVAD deep OLED matte black UI.</p>
          </div>
          <div className="p-8 rounded-xl bg-[#040404] border border-slate-800 flex items-center gap-4 justify-center">
            <SamvadModernIconSVG size={44} mode="gradient" />
            <SamvadModernWordmarkSVG mode="dark" />
          </div>
        </div>

        {/* 6. Favicon (32x32) */}
        <div className="bg-[#12141d] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">6. Favicon (32×32)</span>
            <p className="text-[11px] text-slate-400 mt-1">Optimized high-contrast micro mark for tab bar.</p>
          </div>
          <div className="p-8 rounded-xl bg-[#08090d] border border-slate-800 flex items-center justify-center">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-1 shadow-md">
              <SamvadModernIconSVG size={28} mode="dark" />
            </div>
          </div>
        </div>

        {/* 7. App Icon (512x512) */}
        <div className="bg-[#12141d] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">7. App Icon (512×512)</span>
            <p className="text-[11px] text-slate-400 mt-1">Apple macOS / iOS squircle app launcher asset.</p>
          </div>
          <div className="p-8 rounded-xl bg-[#08090d] border border-slate-800 flex items-center justify-center">
            <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#2563EB] flex items-center justify-center shadow-2xl p-3">
              <div className="w-full h-full flex items-center justify-center">
                <rect x="0" y="0" width="100%" height="100%" fill="none" />
                <SamvadModernIconSVG size={44} mode="dark" />
              </div>
            </div>
          </div>
        </div>

        {/* 8. Transparent Background */}
        <div className="bg-[#12141d] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">8. Transparent Overlay</span>
            <p className="text-[11px] text-slate-400 mt-1">Zero background fill for versatile overlay placement.</p>
          </div>
          <div className="p-8 rounded-xl bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-[#090b10] border border-slate-800 flex items-center gap-4 justify-center">
            <SamvadModernIconSVG size={44} mode="gradient" />
            <SamvadModernWordmarkSVG mode="dark" />
          </div>
        </div>

        {/* 9. Editable Clean Code */}
        <div className="bg-[#12141d] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">9. Editable SVG Source</span>
            <p className="text-[11px] text-slate-400 mt-1">100% pure vector paths with no raster elements.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#08090d] border border-slate-800 font-mono text-[10px] text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
            <code>&lt;svg viewBox="0 0 100 100" fill="url(#grad)"&gt;...&lt;/svg&gt;</code>
          </div>
        </div>

      </div>
    </div>
  );
};
