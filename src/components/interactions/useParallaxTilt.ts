"use client";
import { useEffect, useRef } from 'react';
import { useSiteReducedMotion } from './useSiteReducedMotion';

// React port of the Liquid Glass kit's GlassParallax behavior.
// Returns a ref to attach to the element you want to tilt. No-ops on touch
// devices and when prefers-reduced-motion is set.
export function useParallaxTilt<T extends HTMLElement>(maxRotationDeg = 4) {
  const ref = useRef<T | null>(null);
  const reduced = useSiteReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(hover: none)').matches) return;

    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      el.style.transform =
        `perspective(800px) rotateX(${(-dy * maxRotationDeg).toFixed(2)}deg) ` +
        `rotateY(${(dx * maxRotationDeg).toFixed(2)}deg)`;
      el.style.transition = 'none';
    };
    const onLeave = () => {
      el.style.transform = '';
      el.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [reduced, maxRotationDeg]);

  return ref;
}
