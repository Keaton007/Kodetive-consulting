"use client";
import { createContext, useContext, useRef, type ReactNode } from 'react';
import { useScroll, type MotionValue } from 'framer-motion';

const ScrollCtx = createContext<MotionValue<number> | null>(null);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  return (
    <ScrollCtx.Provider value={scrollYProgress}>
      <div ref={ref}>{children}</div>
    </ScrollCtx.Provider>
  );
}

export function useScrollProgress(): MotionValue<number> {
  const v = useContext(ScrollCtx);
  if (!v) throw new Error('useScrollProgress must be used inside ScrollProvider');
  return v;
}
