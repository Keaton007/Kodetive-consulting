"use client";
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Project } from './projects';

export function WorkCard({ project, reverse }: { project: Project; reverse?: boolean }) {
  return (
    <Link
      href={`/work/${project.slug}`}
      className="group block border-t border-[var(--rule)] py-10 md:py-16"
      aria-label={`View case study — ${project.title}`}
    >
      <div
        className={`mx-auto grid max-w-[var(--content-max)] gap-8 px-6 md:grid-cols-12 md:gap-12 ${
          reverse
            ? 'md:[&>*:first-child]:col-start-7 md:[&>*:first-child]:col-end-13 md:[&>*:last-child]:col-start-1 md:[&>*:last-child]:col-end-6 md:[&>*:last-child]:row-start-1'
            : ''
        }`}
      >
        <motion.div
          layoutId={`work-cover-${project.slug}`}
          className="relative aspect-[16/10] overflow-hidden md:col-span-7"
        >
          <Image
            src={project.cover}
            alt=""
            fill
            sizes="(min-width: 768px) 60vw, 100vw"
            className="object-cover transition-transform duration-[var(--dur-3)] ease-[var(--ease-out-quart)] group-hover:scale-[1.02]"
          />
        </motion.div>
        <div className="flex flex-col justify-center md:col-span-5">
          <div className="flex items-center gap-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            <span>{project.index}</span>
            <span>{project.status} · {project.year}</span>
          </div>
          <h3 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(40px,6vw,88px)] leading-[0.95] tracking-tight">
            {project.title}
          </h3>
          <p className="mt-4 max-w-[38ch] text-[var(--fg-muted)]">{project.summary}</p>
          <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[var(--fg-muted)]">
            {project.stack.map(s => <li key={s}>{s}</li>)}
          </ul>
          <span className="mt-8 inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.2em] text-[var(--fg)] opacity-70 group-hover:opacity-100 group-hover:text-[var(--accent)] transition-[opacity,color]">
            View case study
            <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
