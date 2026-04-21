"use client";
import { motion } from 'framer-motion';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';
import { CORE, PLATFORM, type Skill } from './skills';

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex h-10 items-center rounded-full border border-[var(--rule)] px-4 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.15em] text-[var(--fg)] transition-transform duration-[var(--dur-1)] hover:-translate-y-[2px] hover:text-[var(--accent)]">
      {label}
    </span>
  );
}

function Row({ items, reverse }: { items: Skill[]; reverse?: boolean }) {
  const reduced = useSiteReducedMotion();
  const tripled = [...items, ...items, ...items];
  if (reduced) {
    return (
      <ul className="flex flex-wrap gap-3">
        {items.map(s => <li key={s.label}><Chip label={s.label} /></li>)}
      </ul>
    );
  }
  return (
    <div className="group relative overflow-hidden">
      <motion.div
        className="flex gap-3 whitespace-nowrap will-change-transform"
        animate={{ x: reverse ? ['-33.333%', '0%'] : ['0%', '-33.333%'] }}
        transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
        style={{ paddingInlineEnd: 12 }}
      >
        {tripled.map((s, i) => <Chip key={`${s.label}-${i}`} label={s.label} />)}
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
      <div className="space-y-4">
        <Row items={CORE} />
        <Row items={PLATFORM} reverse />
      </div>
    </section>
  );
}
