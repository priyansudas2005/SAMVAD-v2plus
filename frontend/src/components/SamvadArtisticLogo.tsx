import React from 'react';

// --- Artistic Modern Minimalist Logo ---
export const SamvadArtisticLogo: React.FC<{
  size?: number;
  mode?: 'dark' | 'light' | 'monochrome';
  className?: string;
}> = ({ size = 52, mode = 'dark', className = '' }) => {
  const isLight = mode === 'light';
  const isMono = mode === 'monochrome';

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
        {/* Artistic Dual Fluid Gradient */}
        <linearGradient id="artisticGrad1" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        <linearGradient id="artisticGrad2" x1="90" y1="10" x2="10" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Abstract Modern Art Form: Interlocking Dual Arc Ribbon (Voice + Synthesis) */}
      {/* Outer Flowing Fluid Arc */}
      <path
        d="M 22 78 C 12 55, 20 25, 45 18 C 70 11, 88 30, 82 55 C 76 80, 52 88, 32 84"
        stroke={isMono ? (isLight ? '#111827' : '#FFFFFF') : "url(#artisticGrad1)"}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Inner Synchronized Wave Core */}
      <path
        d="M 38 64 C 32 50, 36 34, 50 30 C 64 26, 72 36, 68 50 C 64 64, 50 68, 40 65"
        stroke={isMono ? (isLight ? '#4B5563' : '#94A3B8') : "url(#artisticGrad2)"}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Central Focal Intelligence Point */}
      <circle
        cx="50"
        cy="48"
        r="4.5"
        fill={isMono ? (isLight ? '#111827' : '#FFFFFF') : '#06B6D4'}
      />
    </svg>
  );
};

// Stylish Modern Art Typography
export const SamvadArtisticWordmark: React.FC<{
  mode?: 'dark' | 'light';
  className?: string;
}> = ({ mode = 'dark', className = '' }) => {
  const textColor = mode === 'light' ? '#111827' : '#FFFFFF';

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <div className="flex items-center gap-1.5 font-sans font-black tracking-tight text-xl">
        <span style={{ color: textColor }}>
          S<span className="text-violet-400">Λ</span>MV<span className="text-cyan-400">Λ</span>D
        </span>
      </div>
      <span className="text-[9px] font-mono tracking-[0.25em] text-slate-400 uppercase font-semibold mt-0.5">
        ARTISTIC INTELLIGENCE STUDIO
      </span>
    </div>
  );
};
