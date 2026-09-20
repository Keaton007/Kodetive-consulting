"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { Project } from './projects';
import { WorkPreviewModal } from './WorkPreviewModal';
import { useParallaxTilt } from '@/components/interactions/useParallaxTilt';

export function WorkCard({ project, reverse }: { project: Project; reverse?: boolean }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewUrl = project.externalLinks?.[0]?.href;
  const tiltRef = useParallaxTilt<HTMLButtonElement>(5);

  return (
    <>
      <div
        className={`mx-auto grid max-w-[var(--content-max)] items-stretch gap-6 md:grid-cols-12 md:gap-10 ${
          reverse
            ? 'md:[&>*:first-child]:col-start-6 md:[&>*:first-child]:col-end-13 md:[&>*:last-child]:col-start-1 md:[&>*:last-child]:col-end-6 md:[&>*:last-child]:row-start-1'
            : ''
        }`}
      >
        <button
          ref={tiltRef}
          type="button"
          onClick={() => previewUrl && setPreviewOpen(true)}
          disabled={!previewUrl}
          aria-label={previewUrl ? `Open live preview, ${project.title}` : `${project.title} cover`}
          className="group relative aspect-[16/10] overflow-hidden rounded-[24px] md:col-span-7 disabled:cursor-default"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <Image
            src={project.cover}
            alt=""
            fill
            sizes="(min-width: 768px) 60vw, 100vw"
            className="object-cover transition-transform duration-[var(--dur-3)] ease-[var(--ease-out-quart)] group-hover:scale-[1.02]"
            style={project.coverFilter ? { filter: project.coverFilter } : undefined}
          />
          {previewUrl && (
            <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-4 opacity-0 transition-opacity duration-[var(--dur-2)] ease-[var(--ease-out-quart)] group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="rounded-full bg-[var(--bg)]/85 px-4 py-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--fg)] backdrop-blur-sm">
                Preview live ↗
              </span>
            </div>
          )}
        </button>
        <Link
          href={`/work/${project.slug}`}
          className="glass glass--dark glass-card group flex flex-col justify-center md:col-span-5"
          aria-label={`Read case study, ${project.title}`}
        >
          <div className="flex items-center gap-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            <span>{project.index}</span>
            <span>{project.status} · {project.year}</span>
          </div>
          <h3 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(32px,5vw,64px)] leading-[0.95] tracking-tight">
            {project.title}
          </h3>
          <p className="mt-4 text-[var(--fg-muted)]">{project.summary}</p>
          <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--fg-muted)]">
            {project.stack.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <span className="mt-8 inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.2em] text-[var(--fg)] opacity-70 transition-[opacity,color] group-hover:opacity-100 group-hover:text-[var(--accent)]">
            View case study
            <span aria-hidden>→</span>
          </span>
        </Link>
      </div>
      {previewUrl && (
        <WorkPreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          url={previewUrl}
          title={project.title}
        />
      )}
    </>
  );
}
