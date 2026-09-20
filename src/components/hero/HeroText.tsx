"use client";
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';

type Props = { name: string; title: string };

export function HeroText({ name, title }: Props) {
  const reduced = useSiteReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const scale = useTransform(scrollYProgress, [0, 0.7], [1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const Inner = (
    <div className="flex flex-col items-center text-center">
      <h1 className="font-[family-name:var(--font-display)] text-[clamp(56px,11vw,220px)] font-light uppercase leading-[0.95] tracking-[0.02em] text-[var(--fg)]">
        {name}
      </h1>
      <p className="mt-6 md:mt-8 font-[family-name:var(--font-mono)] text-[clamp(12px,1.6vw,18px)] uppercase tracking-[0.3em] text-[var(--fg-muted)]">
        {title}
      </p>
    </div>
  );

  if (reduced) {
    return (
      <div
        ref={ref}
        className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-[8%]"
      >
        {Inner}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-[8%]"
    >
      <motion.div style={{ scale, opacity }}>{Inner}</motion.div>
    </div>
  );
}
