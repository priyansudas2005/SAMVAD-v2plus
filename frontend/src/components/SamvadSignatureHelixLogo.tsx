import React from 'react';

// --- SAMVAD Unique Signature Logo Mark: "The Quantum Sonic Helix" ---
// Concept: An ultra-sleek, metallic floating dual-helix wave loop.
// 1. The Silver Metallic Helix = Human Speech & Dialogue
// 2. The Translucent Cyan Glass Prism Ribbon = AI Intelligence & Transcription
// 3. The Central Glowing Core Node = Meeting Insights & Action Items
// 100% Standalone Vector (NO Outer Box Container)
export const SamvadSignatureHelixLogo: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 54, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={{
        filter: 'drop-shadow(0 8px 20px rgba(139, 92, 246, 0.45)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))'
      }}
    >
      <defs>
        {/* Specular Titanium Chrome Metallic Gradient */}
        <linearGradient id="titaniumChrome" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="75%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Liquid Prism Glass Gradient (Violet to Electric Cyan) */}
        <linearGradient id="liquidPrismGlass" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#6366F1" stopOpacity="0.9" />
          <stop offset="80%" stopColor="#38BDF8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.9" />
        </linearGradient>

        {/* Specular Glass Highlight */}
        <linearGradient id="glassEdgeHighlight" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Ambient Optics Glow */}
        <filter id="helixGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* --- STANDALONE SIGNATURE HELIX LOGO MARK (NO BOX) --- */}

      {/* 1. Liquid Glass Ribbon Loop (AI Intelligence Base) */}
      <path
        d="M 28 50 C 18 24, 42 12, 60 26 C 78 40, 84 66, 68 80 C 52 94, 26 82, 36 60"
        stroke="url(#liquidPrismGlass)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        filter="url(#helixGlow)"
      />

      {/* Glass Edge Specular Light Flare */}
      <path
        d="M 28 50 C 18 24, 42 12, 60 26"
        stroke="url(#glassEdgeHighlight)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* 2. Interlocking Metallic Titanium Chrome Ribbon (Human Dialogue) */}
      <path
        d="M 72 50 C 82 76, 58 88, 40 74 C 22 60, 16 34, 32 20 C 48 6, 74 18, 64 40"
        stroke="url(#titaniumChrome)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Chrome Top Light Reflection Arc */}
      <path
        d="M 72 50 C 82 76, 58 88, 40 74"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />

      {/* 3. Central Quantum Focal Core Node (Single Source of Truth) */}
      <circle cx="50" cy="50" r="5" fill="url(#titaniumChrome)" />
      <circle cx="50" cy="50" r="2.5" fill="#38BDF8" />

      {/* 4. Symmetrical Audio Wave Lines inside Glass Arc */}
      <line x1="42" y1="50" x2="42" y2="50" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <rect x="45" y="44" width="2.5" height="12" rx="1.25" fill="#FFFFFF" opacity="0.9" />
      <rect x="52.5" y="42" width="2.5" height="16" rx="1.25" fill="#FFFFFF" />
      <rect x="56" y="46" width="2.5" height="8" rx="1.25" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
};
