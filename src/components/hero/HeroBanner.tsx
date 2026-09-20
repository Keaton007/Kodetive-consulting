"use client";
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
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
      className="glass glass--dark glass-chip shrink-0 font-[family-name:var(--font-mono)] uppercase tracking-[0.15em]"
      style={{ fontSize: '12px' }}
    >
      <span className="glass-chip__icon">
        <Icon size={14} aria-hidden="true" />
      </span>
      <span className="glass-chip__label">{skill.label}</span>
    </span>
  );
}

export function HeroBanner() {
  const reduced = useSiteReducedMotion();
  const x = useMotionValue('0%');
  const [paused, setPaused] = useState(false);
  // SSR + first paint render the static variant so reduced-motion users
  // never see a marquee flash before hydration swaps it out.
  const [mounted, setMounted] = useState(false);
  const elapsedRef = useRef(0);

  useEffect(() => setMounted(true), []);

  useAnimationFrame((_, delta) => {
    if (reduced || paused || !mounted) return;
    elapsedRef.current = (elapsedRef.current + delta) % CYCLE_MS;
    const progress = elapsedRef.current / CYCLE_MS;
    x.set(`${-RANGE_PCT * progress}%`);
  });

  if (!mounted || reduced) {
    return (
      <div
        aria-label="Skills and tools"
        className="glass glass--dark"
        style={{ height: 'var(--banner-h, 60px)', borderRadius: 0 }}
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
      className="glass glass--dark"
      style={{
        height: 'var(--banner-h, 60px)',
        borderRadius: 0,
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
