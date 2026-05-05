"use client";
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useScroll } from 'framer-motion';
import { HeroText } from './HeroText';
import { HeroChrome } from './HeroChrome';
import { HeroBanner } from './HeroBanner';

const HeroSphere = dynamic(() => import('./HeroSphere'), { ssr: false });
const HeroAmbientMobile = dynamic(() => import('./HeroAmbientMobile'), { ssr: false });

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return isMobile;
}

export function Hero() {
  const isMobile = useIsMobile();
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  return (
    <section
      ref={ref}
      className="relative h-[100svh] w-full overflow-hidden bg-[var(--bg)]"
    >
      {isMobile ? <HeroAmbientMobile /> : <HeroSphere progress={scrollYProgress} />}
      <HeroText name="Keaton Jones" title="Software Engineer" />
      <HeroChrome />
      <HeroBanner />
    </section>
  );
}
