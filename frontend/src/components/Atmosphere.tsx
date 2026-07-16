import React from 'react';

export default function Atmosphere() {
  return (
    <div className="atmosphere pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <div className="mesh-gradient"></div>

      <div className="glass-noise"></div>

      <div className="vignette"></div>
    </div>
  );
}
