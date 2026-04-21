"use client";
import { motion } from 'framer-motion';

export function HeroChrome() {
  return (
    <>
      <div className="pointer-events-none absolute bottom-8 left-8 flex items-center gap-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
        <motion.span
          initial={{ y: 0 }}
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          ↓
        </motion.span>
        Scroll
      </div>
      <div className="pointer-events-none absolute bottom-8 right-8 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
        01 / 04
      </div>
    </>
  );
}
