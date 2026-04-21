"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/#work', label: 'Work' },
  { href: '/#about', label: 'About' },
  { href: '/resume', label: 'Resume' },
  { href: '/#contact', label: 'Contact' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 border-b border-[var(--rule)] bg-[var(--bg)]/60 backdrop-blur-md"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-14 max-w-[var(--content-max)] items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-[16px] sm:text-[18px] tracking-tight"
          aria-label="Kodetive — home"
        >
          Kodetive
        </Link>
        <ul className="flex items-center gap-3 sm:gap-8 font-[family-name:var(--font-mono)] text-[10px] sm:text-[12px] uppercase tracking-[0.1em] sm:tracking-[0.12em]">
          {LINKS.map(l => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={pathname === l.href ? 'page' : undefined}
                className="hover:text-[var(--accent)] transition-colors"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
