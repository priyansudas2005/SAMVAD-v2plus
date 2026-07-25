import React from 'react';

// --- SAMVAD Metallic 3D Precision Logo Mark (Enhanced) ---
// Physically-machined stainless steel / titanium badge aesthetic.
// 8-layer SVG depth system: ring, knurl, well, AO, platform, bars, groove, lighting.
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
          'drop-shadow(0 8px 24px rgba(0,0,0,0.85)) drop-shadow(0 2px 6px rgba(0,0,0,0.65)) drop-shadow(0 0 16px rgba(56,189,248,0.28)) drop-shadow(0 0 32px rgba(139,92,246,0.12))',
      }}
    >
      <defs>
        {/* ── Metallic surface gradients ── */}

        {/* Rich anisotropic brushed steel — multi-band highlights like rolled steel */}
        <linearGradient id="steelFace" x1="15" y1="10" x2="85" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="8%"   stopColor="#E8EEF4" />
          <stop offset="22%"  stopColor="#B0BEC9" />
          <stop offset="35%"  stopColor="#6E8090" />
          <stop offset="48%"  stopColor="#9BB0C0" />
          <stop offset="58%"  stopColor="#D0DCE6" />
          <stop offset="68%"  stopColor="#8FA4B5" />
          <stop offset="80%"  stopColor="#526070" />
          <stop offset="92%"  stopColor="#3A4A58" />
          <stop offset="100%" stopColor="#232D38" />
        </linearGradient>

        {/* Outer ring — premium titanium satin */}
        <linearGradient id="ringFace" x1="8" y1="8" x2="92" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F0F4F8" />
          <stop offset="15%"  stopColor="#C4D0DA" />
          <stop offset="35%"  stopColor="#8098AA" />
          <stop offset="55%"  stopColor="#506070" />
          <stop offset="75%"  stopColor="#3A4E5C" />
          <stop offset="100%" stopColor="#18222A" />
        </linearGradient>

        {/* Ring specular vertical stripe */}
        <linearGradient id="ringSpec" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.60" />
          <stop offset="30%"  stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Bevel highlight — key light top-left (softened) */}
        <linearGradient id="bevelHL" x1="0" y1="0" x2="70" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="35%"  stopColor="#E8F0F8" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Bevel shadow — bottom-right (softened to avoid harsh black arc) */}
        <linearGradient id="bevelSH" x1="100" y1="100" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#0A1525" stopOpacity="0.55" />
          <stop offset="45%"  stopColor="#152030" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0A1525" stopOpacity="0" />
        </linearGradient>

        {/* Iridescent oil-slick fringe for ring edge */}
        <linearGradient id="iridescent" x1="0" y1="50" x2="100" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#7DD3FC" stopOpacity="0.25" />
          <stop offset="25%"  stopColor="#A78BFA" stopOpacity="0.30" />
          <stop offset="50%"  stopColor="#F472B6" stopOpacity="0.18" />
          <stop offset="75%"  stopColor="#34D399" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.25" />
        </linearGradient>

        {/* Plasma fill for soundwave bars */}
        <linearGradient id="plasmaBar" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#67E8F9" stopOpacity="1.0" />
          <stop offset="40%"  stopColor="#818CF8" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#C084FC" stopOpacity="0.95" />
        </linearGradient>

        {/* Plasma bar LEFT wall (dark shadow face) */}
        <linearGradient id="barWallL" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#060810" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#060810" stopOpacity="0" />
        </linearGradient>

        {/* Plasma bar RIGHT wall (bright specular face) */}
        <linearGradient id="barWallR" x1="1" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Inner well — plasma bloom radial */}
        <radialGradient id="wellGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#6366F1" stopOpacity="0.28" />
          <stop offset="50%"  stopColor="#0EA5E9" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Platform ambient occlusion at base edge */}
        <radialGradient id="platformAO" cx="50%" cy="50%" r="50%">
          <stop offset="70%"  stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
        </radialGradient>

        {/* Fill light specular — bottom-right bounce */}
        <radialGradient id="fillLight" cx="72%" cy="75%" r="35%">
          <stop offset="0%"   stopColor="#38BDF8" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
        </radialGradient>

        {/* ── Filters ── */}
        <filter id="innerGlow" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="specBloom" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.0" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ══════════════════════════════════════════
          LAYER 1 — Outer machined ring
      ══════════════════════════════════════════ */}
      {/* Offset drop shadow for 3D lift */}
      <circle cx="52" cy="53" r="44" fill="#020408" opacity="0.90" />

      {/* Ring base metal */}
      <circle cx="50" cy="50" r="44" fill="url(#ringFace)" />

      {/* Ring vertical specular band */}
      <circle cx="50" cy="50" r="44" fill="url(#ringSpec)" />

      {/* Iridescent chromatic fringe over ring surface */}
      <circle cx="50" cy="50" r="44" fill="url(#iridescent)" />

      {/* Ring key-light bevel arc (top-left) — softened */}
      <path d="M 13 33 A 39 39 0 0 1 67 11"
        stroke="url(#bevelHL)" strokeWidth="2.5" strokeLinecap="round"
        fill="none" opacity="0.65" filter="url(#specBloom)" />

      {/* Ring shadow bevel arc (bottom-right) — subtle only */}
      <path d="M 87 67 A 39 39 0 0 1 33 89"
        stroke="url(#bevelSH)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />

      {/* ── LAYER 2: Knurl / radial score lines on ring bezel ── */}
      {/* 16 equidistant fine radial lines — precision-machined knurl texture */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const r1 = 38, r2 = 43;
        const x1 = 50 + r1 * Math.cos(angle), y1 = 50 + r1 * Math.sin(angle);
        const x2 = 50 + r2 * Math.cos(angle), y2 = 50 + r2 * Math.sin(angle);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#FFFFFF" strokeWidth="0.45" opacity="0.14"
            strokeLinecap="round" />
        );
      })}

      {/* ══════════════════════════════════════════
          LAYER 3 — Recessed inner well
      ══════════════════════════════════════════ */}
      <circle cx="50" cy="50" r="36" fill="#07080E" />
      <circle cx="50" cy="50" r="35.2" fill="#0B0D1A" />

      {/* Inner well plasma ambient bloom */}
      <circle cx="50" cy="50" r="35" fill="url(#wellGlow)" />

      {/* Well inner-edge ambient occlusion — feathered, not a hard line */}
      <circle cx="50" cy="50" r="34.5"
        fill="none" stroke="#000000" strokeWidth="2.5" opacity="0.30" />

      {/* ══════════════════════════════════════════
          LAYER 4 — Raised metallic platform
      ══════════════════════════════════════════ */}
      {/* Platform drop shadow (inset lift) */}
      <circle cx="51.5" cy="52.5" r="26.5" fill="#030507" opacity="0.95" />

      {/* Platform face — anisotropic brushed steel */}
      <circle cx="50" cy="50" r="26" fill="url(#steelFace)" />

      {/* Ambient occlusion ring at platform-well junction */}
      <circle cx="50" cy="50" r="26" fill="url(#platformAO)" />

      {/* Platform key-light bevel arc */}
      <path d="M 29 28 A 23 23 0 0 1 72 28"
        stroke="url(#bevelHL)" strokeWidth="2.2" strokeLinecap="round"
        fill="none" filter="url(#specBloom)" opacity="0.90" />

      {/* Platform shadow bevel arc — barely visible, no harsh line */}
      <path d="M 72 72 A 23 23 0 0 1 28 72"
        stroke="url(#bevelSH)" strokeWidth="1.5" strokeLinecap="round"
        fill="none" opacity="0.35" />

      {/* Fill light bounce on platform bottom-right */}
      <circle cx="50" cy="50" r="26" fill="url(#fillLight)" />

      {/* ══════════════════════════════════════════
          LAYER 5 — Engraved soundwave bars (3D pillars)
      ══════════════════════════════════════════ */}

      {/* Bar engraved shadow slots (1px down-right offset) */}
      <rect x="33"   y="44.5" width="5"   height="11" rx="2" fill="#020407" opacity="0.95" />
      <rect x="41.5" y="39.5" width="5"   height="21" rx="2" fill="#020407" opacity="0.95" />
      <rect x="50"   y="35.5" width="5"   height="29" rx="2" fill="#020407" opacity="0.95" />
      <rect x="58.5" y="39.5" width="5"   height="21" rx="2" fill="#020407" opacity="0.95" />
      <rect x="67"   y="44.5" width="5"   height="11" rx="2" fill="#020407" opacity="0.95" />

      {/* Bar plasma faces — glowing fill */}
      <rect x="32"   y="43.5" width="5"   height="11" rx="2" fill="url(#plasmaBar)" filter="url(#innerGlow)" />
      <rect x="40.5" y="38.5" width="5"   height="21" rx="2" fill="url(#plasmaBar)" filter="url(#innerGlow)" />
      <rect x="49"   y="34.5" width="5"   height="29" rx="2" fill="url(#plasmaBar)" filter="url(#innerGlow)" />
      <rect x="57.5" y="38.5" width="5"   height="21" rx="2" fill="url(#plasmaBar)" filter="url(#innerGlow)" />
      <rect x="66"   y="43.5" width="5"   height="11" rx="2" fill="url(#plasmaBar)" filter="url(#innerGlow)" />

      {/* Bar LEFT side-wall shadow (makes bars feel like raised pillars) */}
      <rect x="32"   y="43.5" width="1.8" height="11" rx="1" fill="#000000" opacity="0.60" />
      <rect x="40.5" y="38.5" width="1.8" height="21" rx="1" fill="#000000" opacity="0.60" />
      <rect x="49"   y="34.5" width="1.8" height="29" rx="1" fill="#000000" opacity="0.60" />
      <rect x="57.5" y="38.5" width="1.8" height="21" rx="1" fill="#000000" opacity="0.60" />
      <rect x="66"   y="43.5" width="1.8" height="11" rx="1" fill="#000000" opacity="0.60" />

      {/* Bar RIGHT side-wall highlight (specular face) */}
      <rect x="35.2" y="43.5" width="1.8" height="11" rx="1" fill="#FFFFFF" opacity="0.30" />
      <rect x="43.7" y="38.5" width="1.8" height="21" rx="1" fill="#FFFFFF" opacity="0.30" />
      <rect x="52.2" y="34.5" width="1.8" height="29" rx="1" fill="#FFFFFF" opacity="0.30" />
      <rect x="60.7" y="38.5" width="1.8" height="21" rx="1" fill="#FFFFFF" opacity="0.30" />
      <rect x="69.2" y="43.5" width="1.8" height="11" rx="1" fill="#FFFFFF" opacity="0.30" />

      {/* Bar top specular cap — polished top bevel */}
      <rect x="32"   y="43.5" width="5" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.72" />
      <rect x="40.5" y="38.5" width="5" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.72" />
      <rect x="49"   y="34.5" width="5" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.72" />
      <rect x="57.5" y="38.5" width="5" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.72" />
      <rect x="66"   y="43.5" width="5" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.72" />

      {/* ══════════════════════════════════════════
          LAYER 6 — Precision groove ring
      ══════════════════════════════════════════ */}
      {/* Outer fine knurl groove */}
      <circle cx="50" cy="50" r="41"
        fill="none" stroke="#0A1220" strokeWidth="1.2" opacity="0.85" />
      {/* Inner separator groove */}
      <circle cx="50" cy="50" r="37"
        fill="none" stroke="#1A2535" strokeWidth="0.6" opacity="0.70"
        strokeDasharray="1.8 4.2" />

      {/* ══════════════════════════════════════════
          LAYER 7 — Studio lighting
      ══════════════════════════════════════════ */}
      {/* Key light: soft ellipse hotspot (top-left, warm white) */}
      <ellipse cx="33" cy="26" rx="12" ry="6"
        fill="#FFFFFF" opacity="0.20"
        transform="rotate(-40 33 26)"
        filter="url(#softGlow)" />

      {/* Key light: sharp glint line streak — softened */}
      <path d="M 17 27 Q 28 16 44 14"
        stroke="#FFFFFF" strokeWidth="0.9" strokeLinecap="round"
        fill="none" opacity="0.35" filter="url(#specBloom)" />

      {/* Secondary specular micro-glint */}
      <path d="M 20 31 Q 24 25 31 23"
        stroke="#FFFFFF" strokeWidth="0.6" strokeLinecap="round"
        fill="none" opacity="0.22" />

      {/* Fill light: bottom-right soft bounce (cool cyan) */}
      <ellipse cx="70" cy="74" rx="10" ry="5"
        fill="#38BDF8" opacity="0.12"
        transform="rotate(40 70 74)"
        filter="url(#softGlow)" />

      {/* Rim light: thin bright arc on ring left edge (back light) */}
      <path d="M 9 62 A 43 43 0 0 0 10 38"
        stroke="#7DD3FC" strokeWidth="1.4" strokeLinecap="round"
        fill="none" opacity="0.40" filter="url(#specBloom)" />
    </svg>
  );
};

