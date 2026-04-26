"use client";
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import { useRef, useState } from 'react';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';
import { CORE, PLATFORM, type Skill } from '@/components/skills/skills';

const ALL: Skill[] = [...CORE, ...PLATFORM];
const TRIPLED: Skill[] = [...ALL, ...ALL, ...ALL];
const CYCLE_MS = 40000;
const RANGE_PCT = 33.333;

function Chip({ skill }: { skill: Skill }) {
  const Icon = skill.icon;
  return (
    <span
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.15em] text-[var(--fg)]"
      style={{ background: 'color-mix(in oklab, var(--accent) 6%, var(--bg-elev))' }}
    >
      <Icon size={16} aria-hidden="true" />
      {skill.label}
    </span>
  );
}

export function HeroBanner() {
  const reduced = useSiteReducedMotion();
  const x = useMotionValue('0%');
  const [paused, setPaused] = useState(false);
  const elapsedRef = useRef(0);

  useAnimationFrame((_, delta) => {
    if (reduced || paused) return;
    elapsedRef.current = (elapsedRef.current + delta) % CYCLE_MS;
    const progress = elapsedRef.current / CYCLE_MS;
    x.set(`${-RANGE_PCT * progress}%`);
  });

  if (reduced) {
    return (
      <div
        aria-label="Skills and tools"
        className="sticky bottom-0 left-0 right-0 z-10 border-y border-[var(--rule)] bg-[color-mix(in_oklab,var(--bg)_80%,transparent)] backdrop-blur-md"
        style={{ height: 'var(--banner-h, 60px)' }}
      >
        <ul className="flex h-full items-center gap-3 overflow-hidden px-6">
          {ALL.map((s) => (
            <li key={s.label}>
              <Chip skill={s} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      aria-label="Skills and tools"
      className="sticky bottom-0 left-0 right-0 z-10 overflow-hidden border-y border-[var(--rule)] bg-[color-mix(in_oklab,var(--bg)_80%,transparent)] backdrop-blur-md"
      style={{
        height: 'var(--banner-h, 60px)',
        maskImage:
          'linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        className="flex h-full items-center gap-6 whitespace-nowrap will-change-transform"
        style={{ x }}
      >
        {TRIPLED.map((s, i) => (
          <Chip key={`${s.label}-${i}`} skill={s} />
        ))}
      </motion.div>
    </div>
  );
}
