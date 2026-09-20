"use client";
import { useScroll } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';

type Point = { x: number; y: number };
type Path = {
  waypoints: Point[];
  cumLengths: number[];
  pathLength: number;
};
type Particle = {
  id: string;
  path: Path;
  baseOffset: number;
  size: number;
  speed: number;
  opacity: number;
};

const PARTICLE_COUNT = 11;
const SCROLL_FACTOR = 0.05;
const TAIL_SAMPLES = 36;
const TAIL_LENGTH = 16;

// Generate a grid-style path with cardinal turns. Paths run from above the
// viewport to below, biased toward downward motion with occasional left/right
// jogs.
function generateGridPath(): Path {
  const waypoints: Point[] = [];
  let x = 5 + Math.random() * 90;
  let y = -30 - Math.random() * 30;
  waypoints.push({ x, y });

  let lastDir: 'down' | 'left' | 'right' = 'down';
  let safety = 100;
  while (y < 160 && safety-- > 0) {
    const r = Math.random();
    let dir: 'down' | 'left' | 'right';
    if (lastDir === 'down') {
      if (r < 0.72) dir = 'down';
      else if (r < 0.86) dir = 'left';
      else dir = 'right';
    } else {
      // After a sideways jog, snap back to down most of the time.
      if (r < 0.82) dir = 'down';
      else dir = lastDir;
    }

    const len = dir === 'down' ? 7 + Math.random() * 11 : 5 + Math.random() * 10;
    if (dir === 'down') y += len;
    else if (dir === 'left') x = Math.max(2, x - len);
    else x = Math.min(98, x + len);

    waypoints.push({ x, y });
    lastDir = dir;
  }
  if (y < 160) {
    waypoints.push({ x, y: 170 });
  }

  const cumLengths: number[] = [0];
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const dx = waypoints[i].x - waypoints[i - 1].x;
    const dy = waypoints[i].y - waypoints[i - 1].y;
    total += Math.sqrt(dx * dx + dy * dy);
    cumLengths.push(total);
  }

  return { waypoints, cumLengths, pathLength: total };
}

function pointAtProgress(path: Path, progress: number): Point {
  const t = ((progress % path.pathLength) + path.pathLength) % path.pathLength;
  let i = 1;
  while (i < path.cumLengths.length && path.cumLengths[i] < t) i++;
  if (i >= path.waypoints.length) i = path.waypoints.length - 1;
  const segStart = path.cumLengths[i - 1];
  const segLen = path.cumLengths[i] - segStart;
  const localT = segLen > 0 ? (t - segStart) / segLen : 0;
  const a = path.waypoints[i - 1];
  const b = path.waypoints[i];
  return {
    x: a.x + (b.x - a.x) * localT,
    y: a.y + (b.y - a.y) * localT,
  };
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    // depth in [0, 1] — drives size, brightness, and speed together so smaller
    // particles read as "farther": smaller, dimmer, slower-moving.
    const depth = Math.random();
    return {
      id: `p-${i}`,
      path: generateGridPath(),
      baseOffset: Math.random(),
      size: 1.5 + depth * 5.0,
      speed: 0.55 + depth * 0.85,
      opacity: 0.4 + depth * 0.55,
    };
  });
}

export function CircuitBackground() {
  const reduced = useSiteReducedMotion();
  const { scrollY } = useScroll();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    particlesRef.current = generateParticles();
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    const draw = (scrollVal: number) => {
      resize();
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      if (reduced) {
        // Render a static dot per particle at its base offset, no tails.
        for (const p of particlesRef.current) {
          const point = pointAtProgress(p.path, p.baseOffset * p.path.pathLength);
          const px = (point.x / 100) * w;
          const py = (point.y / 100) * h;
          ctx.fillStyle = `rgba(184, 222, 255, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }

      ctx.globalCompositeOperation = 'lighter';
      for (const p of particlesRef.current) {
        const progress =
          p.baseOffset * p.path.pathLength + scrollVal * SCROLL_FACTOR * p.speed;
        for (let i = 0; i < TAIL_SAMPLES; i++) {
          const t = i / (TAIL_SAMPLES - 1);
          const sampleProgress = progress - t * TAIL_LENGTH;
          const point = pointAtProgress(p.path, sampleProgress);
          const px = (point.x / 100) * w;
          const py = (point.y / 100) * h;
          const fade = Math.pow(1 - t, 2);
          const radius = p.size * (1 - t * 0.55);
          // Soft outer halo.
          ctx.fillStyle = `rgba(111, 182, 255, ${0.28 * fade})`;
          ctx.beginPath();
          ctx.arc(px, py, radius * 2.6, 0, Math.PI * 2);
          ctx.fill();
          // Bright core.
          ctx.fillStyle = `rgba(220, 235, 255, ${p.opacity * fade})`;
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    draw(scrollY.get());
    const handleResize = () => draw(scrollY.get());
    window.addEventListener('resize', handleResize);
    const unsub = scrollY.on('change', draw);
    return () => {
      window.removeEventListener('resize', handleResize);
      unsub();
    };
  }, [ready, reduced, scrollY]);

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 18% 28%, rgba(111, 182, 255, 0.10), transparent 60%),
            radial-gradient(ellipse 55% 55% at 82% 62%, rgba(139, 92, 246, 0.06), transparent 60%),
            radial-gradient(ellipse 75% 30% at 50% 92%, rgba(0, 242, 254, 0.05), transparent 70%)
          `,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(111,182,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(111,182,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
