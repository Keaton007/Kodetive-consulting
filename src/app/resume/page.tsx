"use client";
import { useRouter } from 'next/navigation';

export default function ResumePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen pt-24">
      <div className="mx-auto max-w-[var(--content-max)] px-6">
        <div className="flex items-center justify-between border-b border-[var(--rule)] pb-6">
          <button
            onClick={() => router.back()}
            className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.15em] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
          >
            ← Back
          </button>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(28px,3vw,40px)] leading-tight tracking-tight">
            Resume
          </h1>
          <a
            href="/Keaton Jones Resume.pdf"
            download
            className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.15em] text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
          >
            Download PDF ↓
          </a>
        </div>
        <div className="mt-8 overflow-hidden border border-[var(--rule)]">
          <iframe
            src="/Keaton Jones Resume.pdf#toolbar=0"
            className="block h-[80vh] w-full"
            title="Keaton Jones Resume"
          />
        </div>
      </div>
    </div>
  );
}
