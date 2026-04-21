"use client";
import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
  type ReactNode,
} from 'react';
import { useSiteReducedMotion } from './useSiteReducedMotion';

type CursorState = 'default' | 'link' | 'hidden';

const CursorCtx = createContext<{ setCursorState: (s: CursorState) => void }>({
  setCursorState: () => {},
});

export const useCursor = () => useContext(CursorCtx);

export function CursorProvider({ children }: { children: ReactNode }) {
  const reduced = useSiteReducedMotion();
  const [isTouch, setIsTouch] = useState(false);
  const [state, setState] = useState<CursorState>('default');
  const dotRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none)').matches);
  }, []);

  useEffect(() => {
    if (reduced || isTouch) return;
    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const tick = () => {
      const k = 0.15;
      pos.current.x += (target.current.x - pos.current.x) * k;
      pos.current.y += (target.current.y - pos.current.y) * k;
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [reduced, isTouch]);

  const setCursorState = useCallback((s: CursorState) => setState(s), []);

  const showDot = !reduced && !isTouch && state !== 'hidden';
  const size = state === 'link' ? 40 : 6;
  const border = state === 'link' ? '1px solid var(--fg)' : 'none';
  const bg = state === 'link' ? 'transparent' : 'var(--fg)';

  return (
    <CursorCtx.Provider value={{ setCursorState }}>
      {children}
      {showDot && (
        <div
          ref={dotRef}
          data-site-cursor
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: '50%',
            background: bg,
            border,
            pointerEvents: 'none',
            zIndex: 9999,
            mixBlendMode: 'difference',
            transition: 'width 200ms var(--ease-out-quart), height 200ms var(--ease-out-quart), background 200ms',
          }}
        />
      )}
    </CursorCtx.Provider>
  );
}
