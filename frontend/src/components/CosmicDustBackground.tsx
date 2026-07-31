import { useEffect, useRef } from "react";
import { useSettings } from "../context/SettingsContext";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  baseX: number;
  baseY: number;
}

const PARTICLE_COLORS = [
  "139, 92, 246",   // violet-500
  "99, 102, 241",   // indigo-500
  "20, 184, 166",   // teal-500
  "96, 165, 250",   // blue-400
  "167, 139, 250",  // violet-400
  "232, 121, 249",  // fuchsia-400
];

export function CosmicDustBackground() {
  const { settings } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!settings.showParticles) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Track mouse position
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    // Reset mouse when it leaves the window
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener("mouseleave", onMouseLeave);

    // Initialise particles according to settings.particleDensity
    const count = settings.particleDensity || 80;
    particlesRef.current = Array.from({ length: count }, () => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      return {
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.8 + 0.4,
        opacity: Math.random() * 0.5 + 0.15,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      };
    });

    const MOUSE_PULL_RADIUS = 140;
    const MOUSE_PULL_STRENGTH = 0.012;
    const RETURN_STRENGTH = 0.004;
    const FRICTION = 0.92;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particlesRef.current) {
        // Distance from mouse
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_PULL_RADIUS && dist > 0) {
          // Gentle pull toward cursor, falls off with distance
          const force = (1 - dist / MOUSE_PULL_RADIUS) * MOUSE_PULL_STRENGTH;
          p.vx += dx * force;
          p.vy += dy * force;
        }

        // Slowly drift back toward original spawn position
        p.vx += (p.baseX - p.x) * RETURN_STRENGTH;
        p.vy += (p.baseY - p.y) * RETURN_STRENGTH;

        // Natural slow drift
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02;

        // Apply friction & integrate
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap at edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle with soft glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.5);
        glow.addColorStop(0, `rgba(${p.color}, ${p.opacity})`);
        glow.addColorStop(1, `rgba(${p.color}, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Solid core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${Math.min(p.opacity * 2, 0.9)})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [settings.showParticles, settings.particleDensity]);

  if (!settings.showParticles) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.65 }}
      aria-hidden="true"
    />
  );
}

export default CosmicDustBackground;
