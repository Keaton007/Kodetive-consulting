const LINKS = [
  { label: 'Email', href: 'mailto:Keatonjonesy@gmail.com' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/keaton-jones-577640236/' },
  { label: 'GitHub', href: 'https://github.com/Keaton007' },
];

export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="border-t border-[var(--rule)] py-32 md:py-48"
    >
      <div className="mx-auto max-w-[var(--content-max)] px-6">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.25em] text-[var(--fg-muted)]">
          Currently open to senior frontend roles
        </p>
        <h2
          id="contact-title"
          className="mt-8 font-[family-name:var(--font-display)] text-[clamp(64px,10vw,180px)] leading-[0.9] tracking-tight"
        >
          Let&rsquo;s talk.
        </h2>
        <p className="mt-10 max-w-[60ch] text-[17px] leading-[1.7] text-[var(--fg-muted)]">
          I want to work with product teams that care about frontend craft — where
          interaction detail, performance, and taste are part of the work, not
          polish bolted on at the end. Send a note and I&rsquo;ll reply within a day.
        </p>
        <ul className="mt-16 flex flex-wrap gap-x-12 gap-y-5 font-[family-name:var(--font-mono)] text-[16px] uppercase tracking-[0.15em]">
          {LINKS.map(l => (
            <li key={l.href}>
              <a
                href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel={l.href.startsWith('http') ? 'noreferrer' : undefined}
                className="text-[var(--fg)] underline-offset-[6px] transition-colors hover:text-[var(--accent-hot)] hover:underline"
              >
                {l.label} →
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-12 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.25em] text-[var(--fg-muted)]">
          Based in Utah, USA · Open remote · Reply within 24h
        </p>
      </div>
    </section>
  );
}
