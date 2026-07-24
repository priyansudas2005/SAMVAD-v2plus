import React, { useState } from 'react';
import { Sparkles, Layers, ShieldCheck, Download, Copy, Check } from 'lucide-react';

export type MasterBrandStyle = 'Linear' | 'Vercel' | 'Arc' | 'OpenAI' | 'Perplexity' | 'Figma' | 'Notion' | 'Stripe';

// --- Master Vector Brand Logo Engine ---
export const MasterBrandLogoSVG: React.FC<{
  style?: MasterBrandStyle;
  size?: number;
  mode?: 'dark' | 'light' | 'monochrome';
  className?: string;
}> = ({ style = 'Linear', size = 52, mode = 'dark', className = '' }) => {
  const isLight = mode === 'light';
  const isMono = mode === 'monochrome';

  const renderIconPath = () => {
    switch (style) {
      case 'Linear': // Precise minimal geometric squircle with diagonal wave cutouts
        return (
          <g>
            <rect x="10" y="10" width="80" height="80" rx="26" fill={isMono ? '#111827' : 'url(#gradLinear)'} />
            <path d="M 30 50 L 50 30 L 70 50 L 50 70 Z" fill="none" stroke={isLight ? '#111827' : '#FFFFFF'} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="38" y1="50" x2="62" y2="50" stroke={isLight ? '#111827' : '#FFFFFF'} strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="3" fill="#FFFFFF" />
          </g>
        );

      case 'Vercel': // Ultra-sharp precision geometry, mono triangle cutout + waveform
        return (
          <g>
            <path d="M 50 12 L 88 84 H 12 Z" fill={isMono ? '#111827' : 'url(#gradVercel)'} />
            <path d="M 50 34 L 70 70 H 30 Z" fill="#040404" />
            <rect x="47" y="44" width="6" height="18" rx="3" fill="url(#gradVercel)" />
          </g>
        );

      case 'Arc': // Fluid dual-gradient capsule loop with glassmorphism blur
        return (
          <g>
            <path d="M 25 25 C 25 15, 75 15, 75 25 V 75 C 75 85, 25 85, 25 75 Z" fill="none" stroke="url(#gradArc)" strokeWidth="8" strokeLinecap="round" />
            <path d="M 35 40 Q 50 25 65 40 Q 50 55 35 40" fill="url(#gradArc)" />
            <circle cx="50" cy="62" r="5" fill="#38BDF8" />
          </g>
        );

      case 'OpenAI': // Symmetric infinite knot loop combining voice, document & intelligence
        return (
          <g>
            <path
              d="M 50 16 C 30 16 16 30 16 50 C 16 70 30 84 50 84 C 70 84 84 70 84 50 C 84 30 70 16 50 16 Z"
              fill="none"
              stroke={isMono ? '#111827' : 'url(#gradOpenAI)'}
              strokeWidth="5"
            />
            <path d="M 35 35 L 65 65 M 65 35 L 35 65" stroke={isMono ? '#111827' : 'url(#gradOpenAI)'} strokeWidth="5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="8" fill="#10B981" />
          </g>
        );

      case 'Perplexity': // Dimensional intelligence starburst with waveform core
        return (
          <g>
            <path d="M 50 10 L 62 38 L 90 50 L 62 62 L 50 90 L 38 62 L 10 50 L 38 38 Z" fill={isMono ? '#111827' : 'url(#gradPerplexity)'} />
            <circle cx="50" cy="50" r="10" fill="#040404" />
            <rect x="48" y="44" width="4" height="12" rx="2" fill="#38BDF8" />
          </g>
        );

      case 'Figma': // Playful modular stacked component pills
        return (
          <g>
            <rect x="18" y="16" width="30" height="30" rx="15" fill="#F24E1E" />
            <rect x="52" y="16" width="30" height="30" rx="15" fill="#FF7262" />
            <rect x="18" y="50" width="30" height="30" rx="15" fill="#A259FF" />
            <circle cx="67" cy="65" r="15" fill="#1ABCFE" />
            <path d="M 18 84 C 18 75, 33 75, 33 84 C 33 93, 18 93, 18 84 Z" fill="#0ACF83" />
          </g>
        );

      case 'Notion': // Clean outline container with stark typography & negative space
        return (
          <g>
            <rect x="12" y="12" width="76" height="76" rx="18" fill="none" stroke={isLight ? '#111827' : '#FFFFFF'} strokeWidth="5" />
            <path d="M 32 30 V 70 L 52 42 V 70" stroke={isLight ? '#111827' : '#FFFFFF'} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <line x1="64" y1="30" x2="64" y2="70" stroke={isLight ? '#111827' : '#FFFFFF'} strokeWidth="5" strokeLinecap="round" />
          </g>
        );

      case 'Stripe': // Fluid angled gradient stripe bar with glow physics
        return (
          <g>
            <path d="M 15 25 L 85 15 L 70 75 L 0 85 Z" fill="url(#gradStripe)" />
            <path d="M 30 35 L 70 27 L 60 65 L 20 73 Z" fill="#FFFFFF" opacity="0.2" />
          </g>
        );

      default:
        return null;
    }
  };

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
        <linearGradient id="gradLinear" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#5E6AD2" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="gradVercel" x1="50" y1="0" x2="50" y2="100">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="gradArc" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#FF2A85" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="gradOpenAI" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="gradPerplexity" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="gradStripe" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#635BFF" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
      {renderIconPath()}
    </svg>
  );
};

// Custom Wordmark Component with Delta 'A'
export const MasterBrandWordmark: React.FC<{
  style?: MasterBrandStyle;
  mode?: 'dark' | 'light';
  className?: string;
}> = ({ style = 'Linear', mode = 'dark', className = '' }) => {
  const textColor = mode === 'light' ? '#111827' : '#FFFFFF';

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <div className="flex items-center gap-1.5 font-sans font-black tracking-tight text-xl">
        <span style={{ color: textColor }}>
          S<span className="text-indigo-400">Λ</span>MV<span className="text-sky-400">Λ</span>D
        </span>
      </div>
      <span className="text-[9px] font-mono tracking-[0.2em] text-slate-400 uppercase font-bold mt-0.5">
        {style} Inspired Edition
      </span>
    </div>
  );
};

// --- Full Master Showcase Component ---
export const MasterBrandSystemShowcase: React.FC = () => {
  const [activeStyle, setActiveStyle] = useState<MasterBrandStyle>('Linear');

  const brandStyles: { name: MasterBrandStyle; desc: string }[] = [
    { name: 'Linear', desc: 'Precision geometric squircle with subtle wave cutouts and high-contrast violet gradients.' },
    { name: 'Vercel', desc: 'Ultra-sharp monochromatic triangle geometry with embedded STT waveform cutouts.' },
    { name: 'Arc', desc: 'Fluid glassmorphism capsule loops with vibrant neon magenta-to-sky gradients.' },
    { name: 'OpenAI', desc: 'Symmetric infinite knot loop combining voice, document, and AI intelligence.' },
    { name: 'Perplexity', desc: 'Dimensional intelligence starburst with a central AI waveform core.' },
    { name: 'Figma', desc: 'Playful modular pill shapes representing meeting collaboration components.' },
    { name: 'Notion', desc: 'Minimal outline container with stark typography and generous negative space.' },
    { name: 'Stripe', desc: 'Fluid angled gradient stripe bar with optical glow physics.' }
  ];

  return (
    <div className="p-8 bg-[#0b0c10] min-h-screen text-slate-200 font-sans space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            SAMVAD World-Class Logo Collection
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Inspired by OpenAI, Linear, Notion, Arc, Vercel, Perplexity, Figma, and Stripe.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> 8 World-Class Aesthetics
          </span>
        </div>
      </div>

      {/* Grid of 8 Design Inspirations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {brandStyles.map((item) => (
          <div
            key={item.name}
            onClick={() => setActiveStyle(item.name)}
            className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 group ${
              activeStyle === item.name 
                ? 'bg-[#141722] border-indigo-500 shadow-xl' 
                : 'bg-[#10131c] border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">{item.name} Style</span>
                {activeStyle === item.name && <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold">Active</span>}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">{item.desc}</p>
            </div>

            {/* Logo Preview Box */}
            <div className="p-6 rounded-xl bg-[#08090d] border border-slate-800/80 flex items-center gap-3 justify-center min-h-[100px]">
              <MasterBrandLogoSVG style={item.name} size={44} mode="dark" />
              <MasterBrandWordmark style={item.name} mode="dark" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
