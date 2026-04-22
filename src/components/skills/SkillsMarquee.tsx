"use client";
import { motion } from 'framer-motion';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';
import { CORE, PLATFORM, type Skill } from './skills';

function Chip({ skill }: { skill: Skill }) {
  const Icon = skill.icon;
  return (
    <span
      className="group/chip inline-flex h-10 items-center gap-2 rounded-full px-4 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.15em] text-[var(--fg)] transition-[transform,background,color] duration-[var(--dur-1)] hover:-translate-y-[2px] hover:text-[var(--accent-hot)]"
      style={{
        background: 'color-mix(in oklab, var(--accent) 6%, var(--bg-elev))',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background =
          'color-mix(in oklab, var(--accent) 18%, var(--bg-elev))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          'color-mix(in oklab, var(--accent) 6%, var(--bg-elev))';
      }}
    >
      <Icon size={16} aria-hidden="true" />
      {skill.label}
    </span>
  );
}

function Row({ items, reverse }: { items: Skill[]; reverse?: boolean }) {
  const reduced = useSiteReducedMotion();
  const tripled = [...items, ...items, ...items];
  if (reduced) {
    return (
      <ul className="flex flex-wrap gap-3">
        {items.map(s => <li key={s.label}><Chip skill={s} /></li>)}
      </ul>
    );
  }
  return (
    <div className="group relative overflow-hidden">
      <motion.div
        className="flex gap-3 whitespace-nowrap will-change-transform"
        animate={{ x: reverse ? ['-33.333%', '0%'] : ['0%', '-33.333%'] }}
        transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
        style={{ paddingInlineEnd: 12 }}
      >
        {tripled.map((s, i) => <Chip key={`${s.label}-${i}`} skill={s} />)}
      </motion.div>
    </div>
  );
}

export function SkillsMarquee() {
  return (
    <section aria-label="Skills and tools" className="border-t border-[var(--rule)] py-20 md:py-24">
      <div className="mx-auto mb-10 max-w-[var(--content-max)] px-6">
        <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.25em] text-[var(--fg-muted)]">
          Tools &amp; platforms
        </h2>
      </div>
      {/*
        Reduced-motion note: prefers-reduced-motion=reduce shows a static
        wrapped grid of chips instead of the scrolling rows. If the marquee
        isn't moving, check OS motion settings first.
      */}
      <div className="space-y-4">
        {/* Top row (CORE) flows right -> left. */}
        <Row items={CORE} />
        {/* Bottom row (PLATFORM) flows left -> right. */}
        <Row items={PLATFORM} reverse />
      </div>
    </section>
  );
}
