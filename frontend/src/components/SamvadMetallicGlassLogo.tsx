import React from 'react';

// --- Metallic Glassy Modern Logo Mark (No Outer Box Container) ---
export const SamvadMetallicGlassLogo: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 52, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={{ filter: 'drop-shadow(0 6px 16px rgba(139, 92, 246, 0.4)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }}
    >
      <defs>
        {/* Metallic Titanium Silver Chrome Gradient */}
        <linearGradient id="metallicChrome" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#CBD5E1" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="75%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>

        {/* Glassy Neon Violet to Electric Cyan Gradient */}
        <linearGradient id="glassyNeonGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#6366F1" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.95" />
        </linearGradient>

        {/* Specular Light Reflection Highlights */}
        <linearGradient id="metallicHighlight" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Metallic Shimmer Glow */}
        <filter id="glassGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* --- STANDALONE METALLIC GLASS LOGO MARK (NO BOX) --- */}

      {/* Outer Metallic Chrome Fluid Ribbon Arch */}
      <path
        d="M 24 76 C 14 54, 22 22, 48 16 C 74 10, 90 28, 84 54 C 78 80, 54 88, 32 82"
        stroke="url(#metallicChrome)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Inner Translucent Glassy Neon Prism Arc */}
      <path
        d="M 38 64 C 30 50, 36 32, 50 28 C 64 24, 74 34, 70 50 C 66 66, 50 70, 38 64 Z"
        fill="url(#glassyNeonGrad)"
        stroke="url(#metallicHighlight)"
        strokeWidth="1.5"
        filter="url(#glassGlow)"
      />

      {/* Central Metallic Chrome Core Node */}
      <circle cx="50" cy="48" r="5" fill="url(#metallicChrome)" />
      <circle cx="50" cy="48" r="2" fill="#FFFFFF" />

      {/* Dynamic Soundwave Bars Over Glass Arc */}
      <rect x="36" y="42" width="3" height="12" rx="1.5" fill="#FFFFFF" opacity="0.9" />
      <rect x="43" y="36" width="3" height="24" rx="1.5" fill="#FFFFFF" />
      <rect x="57" y="38" width="3" height="20" rx="1.5" fill="#FFFFFF" />
      <rect x="64" y="44" width="3" height="8" rx="1.5" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
};
