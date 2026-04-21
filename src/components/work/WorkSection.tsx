import { PROJECTS } from './projects';
import { WorkCard } from './WorkCard';

export function WorkSection() {
  return (
    <section id="work" aria-labelledby="work-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-[var(--content-max)] px-6">
        <div className="flex items-baseline justify-between border-b border-[var(--rule)] pb-6">
          <h2
            id="work-title"
            className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,56px)] leading-tight tracking-tight"
          >
            Selected work
          </h2>
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {PROJECTS.length} projects
          </span>
        </div>
      </div>
      <div className="mt-4">
        {PROJECTS.map((p, i) => (
          <WorkCard key={p.slug} project={p} reverse={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
