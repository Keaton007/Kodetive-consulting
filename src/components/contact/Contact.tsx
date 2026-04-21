const LINKS = [
  { label: 'Email', href: 'mailto:Keatonjonesy@gmail.com' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/keaton-jones-577640236/' },
  { label: 'GitHub', href: 'https://github.com/Keaton007' },
];

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="border-t border-[var(--rule)] py-28 md:py-40">
      <div className="mx-auto max-w-[var(--content-max)] px-6">
        <h2
          id="contact-title"
          className="font-[family-name:var(--font-display)] text-[clamp(64px,10vw,180px)] leading-[0.9] tracking-tight"
        >
          Let&rsquo;s talk.
        </h2>
        <ul className="mt-16 flex flex-wrap gap-x-10 gap-y-4 font-[family-name:var(--font-mono)] text-[14px] uppercase tracking-[0.15em]">
          {LINKS.map(l => (
            <li key={l.href}>
              <a
                href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel={l.href.startsWith('http') ? 'noreferrer' : undefined}
                className="text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
              >
                {l.label} →
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
