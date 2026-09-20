"use client";
import { motion, useInView } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { useSiteReducedMotion } from './useSiteReducedMotion';

type Props = { children: ReactNode; delay?: number; className?: string };

export function RevealOnView({ children, delay = 0, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useSiteReducedMotion();
  const inView = useInView(ref, { amount: 0.05, margin: '0px 0px -15% 0px' });

  if (reduced) {
    return <div ref={ref} data-reduced-motion="true" className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 1.0, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
