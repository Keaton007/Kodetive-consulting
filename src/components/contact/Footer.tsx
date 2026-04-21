export function Footer() {
  return (
    <footer className="border-t border-[var(--rule)] py-8">
      <div className="mx-auto flex max-w-[var(--content-max)] flex-wrap items-center justify-between gap-4 px-6 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
        <span>© {new Date().getFullYear()} Keaton Jones</span>
        <span>Built with Next.js · Framer Motion · R3F</span>
        <a
          href="https://github.com/Keaton007/kodetive-consulting"
          target="_blank"
          rel="noreferrer"
          className="hover:text-[var(--fg)]"
        >
          view source
        </a>
      </div>
    </footer>
  );
}
