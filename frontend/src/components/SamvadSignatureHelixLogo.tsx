import React from 'react';

// --- SAMVAD Metallic 3D Precision Logo Mark ---
// Rendered entirely in SVG using layered gradients, bevel shading, specular
// highlights and ambient occlusion shadows to simulate a physically-machined
// stainless steel / titanium badge logo — no cartoon aesthetics.
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
        filter:
          'drop-shadow(0 6px 18px rgba(0,0,0,0.80)) drop-shadow(0 2px 6px rgba(0,0,0,0.60)) drop-shadow(0 0 12px rgba(56,189,248,0.22))',
      }}
    >
      <defs>
        {/* Main body — brushed steel face */}
        <linearGradient id="steelFace" x1="18" y1="12" x2="82" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F1F5F9" />
          <stop offset="18%"  stopColor="#CBD5E1" />
          <stop offset="38%"  stopColor="#7A8FA6" />
          <stop offset="55%"  stopColor="#94A3B8" />
          <stop offset="72%"  stopColor="#B8C4D0" />
          <stop offset="88%"  stopColor="#64748B" />
          <stop offset="100%" stopColor="#3B4A58" />
        </linearGradient>

        {/* Bevel highlight — bright top-left edge */}
        <linearGradient id="bevelHighlight" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="40%"  stopColor="#E2E8F0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Bevel shadow — dark bottom-right edge */}
        <linearGradient id="bevelShadow" x1="100" y1="100" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#0A0F1A" stopOpacity="0.9" />
          <stop offset="50%"  stopColor="#1E293B" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0A0F1A" stopOpacity="0" />
        </linearGradient>

        {/* Cyan plasma accent */}
        <linearGradient id="plasmaAccent" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#38BDF8" stopOpacity="0.95" />
          <stop offset="50%"  stopColor="#6366F1" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0.9" />
        </linearGradient>

        {/* Outer ring face gradient */}
        <linearGradient id="ringFace" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#E2E8F0" />
          <stop offset="30%"  stopColor="#94A3B8" />
          <stop offset="65%"  stopColor="#475569" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Outer ring specular stripe */}
        <linearGradient id="ringSpec" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="40%"  stopColor="#FFFFFF" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Soft ambient glow for inner shape */}
        <filter id="innerGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Sharp specular bloom for highlight lines */}
        <filter id="specBloom" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ── LAYER 1: Outer machined ring (depth base) ── */}
      <circle cx="51.5" cy="52" r="44" fill="#050810" opacity="0.85" />
      <circle cx="50"   cy="50" r="44" fill="url(#ringFace)" />
      <circle cx="50"   cy="50" r="44" fill="url(#ringSpec)" />

      {/* Ring bevel highlight arc (top-left crescent) */}
      <path d="M 15 35 A 37 37 0 0 1 65 13"
        stroke="url(#bevelHighlight)" strokeWidth="3.5" strokeLinecap="round"
        fill="none" filter="url(#specBloom)" />

      {/* Ring bevel shadow arc (bottom-right crescent) */}
      <path d="M 85 65 A 37 37 0 0 1 35 87"
        stroke="url(#bevelShadow)" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* ── LAYER 2: Recessed inner well ── */}
      <circle cx="50" cy="50" r="36" fill="#08090F" />
      <circle cx="50" cy="50" r="35" fill="#0C0E19" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#000000" strokeWidth="3" opacity="0.6" />

      {/* ── LAYER 3: Central raised metallic platform ── */}
      <circle cx="51"  cy="51.5" r="26" fill="#050608" opacity="0.9" />
      <circle cx="50"  cy="50"   r="25.5" fill="url(#steelFace)" />

      {/* Platform bevel highlight */}
      <path d="M 31 30 A 22 22 0 0 1 70 30"
        stroke="url(#bevelHighlight)" strokeWidth="2" strokeLinecap="round"
        fill="none" filter="url(#specBloom)" opacity="0.85" />

      {/* Platform bevel shadow */}
      <path d="M 70 70 A 22 22 0 0 1 30 70"
        stroke="url(#bevelShadow)" strokeWidth="2" strokeLinecap="round"
        fill="none" opacity="0.75" />

      {/* ── LAYER 4: Engraved soundwave bars ── */}

      {/* Bar drop shadows (engraved depth illusion) */}
      <rect x="32.5" y="43.5" width="5.5" height="13" rx="2.2" fill="#050608" opacity="0.9" />
      <rect x="41"   y="38.5" width="5.5" height="23" rx="2.2" fill="#050608" opacity="0.9" />
      <rect x="49.5" y="34.5" width="5.5" height="31" rx="2.2" fill="#050608" opacity="0.9" />
      <rect x="58"   y="38.5" width="5.5" height="23" rx="2.2" fill="#050608" opacity="0.9" />
      <rect x="66.5" y="43.5" width="5.5" height="13" rx="2.2" fill="#050608" opacity="0.9" />

      {/* Plasma-filled bar faces */}
      <rect x="31.5" y="42.5" width="5.5" height="13" rx="2.2" fill="url(#plasmaAccent)" filter="url(#innerGlow)" />
      <rect x="40"   y="37.5" width="5.5" height="23" rx="2.2" fill="url(#plasmaAccent)" filter="url(#innerGlow)" />
      <rect x="48.5" y="33.5" width="5.5" height="31" rx="2.2" fill="url(#plasmaAccent)" filter="url(#innerGlow)" />
      <rect x="57"   y="37.5" width="5.5" height="23" rx="2.2" fill="url(#plasmaAccent)" filter="url(#innerGlow)" />
      <rect x="65.5" y="42.5" width="5.5" height="13" rx="2.2" fill="url(#plasmaAccent)" filter="url(#innerGlow)" />

      {/* Bar top specular reflection (beveled top edges) */}
      <rect x="31.5" y="42.5" width="5.5" height="2" rx="1" fill="#FFFFFF" opacity="0.55" />
      <rect x="40"   y="37.5" width="5.5" height="2" rx="1" fill="#FFFFFF" opacity="0.55" />
      <rect x="48.5" y="33.5" width="5.5" height="2" rx="1" fill="#FFFFFF" opacity="0.55" />
      <rect x="57"   y="37.5" width="5.5" height="2" rx="1" fill="#FFFFFF" opacity="0.55" />
      <rect x="65.5" y="42.5" width="5.5" height="2" rx="1" fill="#FFFFFF" opacity="0.55" />

      {/* ── LAYER 5: Outer ring precision groove ── */}
      <circle cx="50" cy="50" r="40"
        fill="none" stroke="#1E293B" strokeWidth="0.8"
        opacity="0.9" strokeDasharray="2.2 3.8" />

      {/* ── LAYER 6: Studio key-light specular hotspot ── */}
      <ellipse cx="35" cy="28" rx="10" ry="5"
        fill="#FFFFFF" opacity="0.18"
        transform="rotate(-35 35 28)"
        filter="url(#specBloom)" />
      <path d="M 20 28 Q 30 18 42 16"
        stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round"
        fill="none" opacity="0.55" filter="url(#specBloom)" />
    </svg>
  );
};

