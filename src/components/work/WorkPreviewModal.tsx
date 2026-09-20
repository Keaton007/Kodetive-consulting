"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
};

export function WorkPreviewModal({ isOpen, onClose, url, title }: Props) {
  const reduced = useSiteReducedMotion();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  const panelInitial = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 };
  const panelAnimate = reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 };
  const panelExit = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Live preview, ${title}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md md:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass glass--dark flex h-[90vh] w-full max-w-[1400px] flex-col rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--rule)] bg-[var(--bg)] px-4 py-3">
              <div className="flex gap-2" aria-hidden="true">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              </div>
              <div className="ml-2 flex flex-1 items-center justify-center">
                <span className="rounded-md bg-[var(--bg-elev)] px-3 py-1 font-[family-name:var(--font-mono)] text-[12px] text-[var(--fg-muted)]">
                  {url}
                </span>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
              >
                Open ↗
              </a>
              <button
                ref={closeBtnRef}
                onClick={onClose}
                className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
                aria-label="Close preview"
              >
                Close ✕
              </button>
            </div>
            <iframe
              src={url}
              title={title}
              className="w-full flex-1 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
