"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
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
  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-[var(--bg)]">
      {isMobile ? <HeroAmbientMobile /> : <HeroSphere />}
      <HeroText name="Keaton Jones" title="Software Engineer" />
      <HeroChrome />
      <HeroBanner />
    </section>
  );
}
