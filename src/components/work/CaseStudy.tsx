"use client";
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Project } from './projects';
import { PROJECTS } from './projects';

type Props = {
  project: Project;
  children: React.ReactNode;
  externalLinks?: { label: string; href: string }[];
};

export function CaseStudy({ project, children, externalLinks }: Props) {
  const idx = PROJECTS.findIndex(p => p.slug === project.slug);
  const prev = PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(idx + 1) % PROJECTS.length];

  return (
    <article className="pb-24">
      <motion.div
        layoutId={`work-cover-${project.slug}`}
        className="relative aspect-[16/9] w-full overflow-hidden"
      >
        <Image src={project.cover} alt="" fill priority sizes="100vw" className="object-cover" />
      </motion.div>

      <header className="mx-auto mt-12 max-w-[var(--content-max)] px-6">
        <div className="flex items-center gap-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          <span>{project.index}</span>
          <span>{project.status} · {project.year}</span>
        </div>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(44px,7vw,112px)] leading-[0.95] tracking-tight">
          {project.title}
        </h1>
        <p className="mt-6 max-w-[60ch] text-[clamp(18px,1.4vw,22px)] text-[var(--fg-muted)]">
          {project.summary}
        </p>
        <dl className="mt-10 grid gap-6 border-y border-[var(--rule)] py-6 md:grid-cols-4">
          <div>
            <dt className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">Year</dt>
            <dd className="mt-2">{project.year}</dd>
          </div>
          <div>
            <dt className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">Status</dt>
            <dd className="mt-2">{project.status}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">Stack</dt>
            <dd className="mt-2 text-[var(--fg-muted)]">{project.stack.join(' · ')}</dd>
          </div>
        </dl>
        {externalLinks?.length ? (
          <div className="mt-6 flex flex-wrap gap-6 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.15em]">
            {externalLinks.map(l => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 decoration-[var(--rule)] transition-colors hover:text-[var(--accent-hot)] hover:decoration-[var(--accent)]"
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        ) : null}
      </header>

      <div className="mx-auto mt-16 max-w-[72ch] px-6 [&>section]:mt-16 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[clamp(28px,3vw,44px)] [&_h2]:leading-tight [&_h2]:tracking-tight [&_p]:mt-6 [&_p]:text-[17px] [&_p]:leading-[1.7]">
        {children}
      </div>

      <nav
        aria-label="Project navigation"
        className="mx-auto mt-24 flex max-w-[var(--content-max)] items-center justify-between border-t border-[var(--rule)] px-6 pt-8 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.15em]"
      >
        <Link href={`/work/${prev.slug}`} className="hover:text-[var(--accent)]">← {prev.title}</Link>
        <Link href="/#work" className="text-[var(--fg-muted)] hover:text-[var(--fg)]">All work</Link>
        <Link href={`/work/${next.slug}`} className="hover:text-[var(--accent)]">{next.title} →</Link>
      </nav>
    </article>
  );
}
