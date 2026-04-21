# Kodetive Site Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild kodetive-consulting as a hybrid cinematic-but-restrained hire-me portfolio — shader-driven hero, work-first structure with dedicated case studies, shared-element page transitions, editorial dark palette, strict a11y + perf budget.

**Architecture:** Next.js 15 App Router RSC by default. Client islands for interaction layer (Cursor/Scroll/PageTransition providers) and any component using Framer Motion / R3F. All colors as CSS custom properties for single-file palette swap. Interaction primitives share a single scroll `MotionValue` — no duplicate scroll listeners. Every animation respects `useReducedMotion`.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, Tailwind 4, Framer Motion, `@react-three/fiber` + `@react-three/drei`, `next/font` (Fraunces, Inter, JetBrains Mono). Vitest + React Testing Library + `@testing-library/jest-dom` + `jsdom` for primitive tests. Lighthouse (CI-local via `npx lighthouse`) for the pre-ship gate.

**Spec:** [`docs/superpowers/specs/2026-04-21-site-redesign-design.md`](../specs/2026-04-21-site-redesign-design.md)

---

## Pre-flight

Before Task 1, the implementer runs this once:

```bash
cd /Users/keatonjones/Projects/personal/kodetive-consulting
git checkout -b site-redesign
npm run build   # confirm current baseline builds
```

Expected: build succeeds. If it fails on `main`, stop and fix first — do not start the redesign on a broken baseline.

---

## File structure (target)

```
src/
  app/
    globals.css                              # palette tokens + resets (rewritten)
    layout.tsx                               # font wiring, provider tree (modified)
    page.tsx                                 # new home composition (rewritten)
    resume/page.tsx                          # restyle only (modified)
    work/
      [slug]/
        page.tsx                             # dynamic case study route
  components/
    interactions/
      CursorProvider.tsx                     # RAF-lerped cursor dot
      ScrollProvider.tsx                     # shared viewport-progress MotionValue
      PageTransition.tsx                     # route-boundary AnimatePresence
      RevealOnView.tsx                       # opacity/y reveal wrapper
      useSiteReducedMotion.ts                # single reduced-motion hook
    nav/
      Nav.tsx                                # new nav (replaces current Nav.tsx)
    hero/
      Hero.tsx                               # composition
      HeroAmbient.tsx                        # R3F ambient layer (dynamic import)
      HeroShaderText.tsx                     # WebGL typography
      HeroChrome.tsx                         # counter + scroll hint
      shaders/
        ambient.frag.glsl                    # inlined as a string in the .tsx
        shaderText.frag.glsl                 # inlined as a string in the .tsx
    work/
      WorkSection.tsx                        # home work section
      WorkCard.tsx                           # single project card (shared-element source)
      CaseStudy.tsx                          # case study template
      projects.ts                            # project data array
      content/
        shredder.tsx                         # MDX-style TSX content
        stat-ai.tsx
        unit-converter.tsx
    about/
      About.tsx
    skills/
      SkillsMarquee.tsx
      skills.ts                              # two-row data
    contact/
      Contact.tsx
      Footer.tsx
  test/
    setup.ts                                 # Vitest DOM + reduced-motion mock
    matchMedia.ts                            # matchMedia polyfill
tests/                                       # colocated *.test.tsx under components/ instead
```

**Files to delete** after their replacements land:
- `src/components/Hero.tsx` (replaced by `hero/Hero.tsx`)
- `src/components/About.tsx` (replaced by `about/About.tsx`)
- `src/components/Contact.tsx` (replaced by `contact/Contact.tsx`)
- `src/components/Nav.tsx` (replaced by `nav/Nav.tsx`)
- `src/components/PersonalShowcase.tsx` (replaced by `work/WorkSection.tsx`)
- `src/components/ThemeToggle.tsx` (theme is dark-only now)
- `src/components/Calendar.tsx` (kept only if still imported; spec §12 removes from home)

---

## Task 0: Install tooling & remove legacy theme

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `vitest.config.ts`, `src/test/setup.ts`, `src/test/matchMedia.ts`

- [ ] **Step 0.1: Install runtime deps**

```bash
npm install --save-exact fraunces@latest
```

Actually — fonts are loaded via `next/font/google`, no npm install needed for Fraunces / Inter / JetBrains Mono. Skip this.

- [ ] **Step 0.2: Install dev deps (test infra)**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

Expected: installs succeed.

- [ ] **Step 0.3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 0.4: Create `src/test/matchMedia.ts`**

```ts
export function mockMatchMedia(prefersReducedMotion = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? prefersReducedMotion : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
```

- [ ] **Step 0.5: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { mockMatchMedia } from './matchMedia';

mockMatchMedia(false);
afterEach(() => cleanup());
```

- [ ] **Step 0.6: Add scripts to `package.json`**

Merge into the `scripts` block:

```json
"test": "vitest run",
"test:watch": "vitest",
"lighthouse": "lighthouse http://localhost:3000 --only-categories=performance,accessibility,best-practices --output=json --output-path=./lighthouse.json --chrome-flags=\"--headless\" --quiet"
```

- [ ] **Step 0.7: Sanity-check the test runner**

Create `src/test/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
describe('sanity', () => {
  it('runs', () => expect(1 + 1).toBe(2));
});
```

Run: `npm test`
Expected: 1 passed.

Delete the file after it passes.

- [ ] **Step 0.8: Remove the legacy theme toggle from layout**

In `src/app/layout.tsx`, remove the `ThemeToggle` import and its `<ThemeToggle />` usage. Dark-only from here on. Leave `Nav` import alone — it'll be replaced in Task 5.

- [ ] **Step 0.9: Commit**

```bash
git add -A
git commit -m "chore: add vitest test infra, remove legacy theme toggle"
```

---

## Task 1: Theme tokens + base layout

**Files:**
- Rewrite: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Skill invocations before starting:** `web-design-principles`, `immersive-aesthetic` (spec §3).

- [ ] **Step 1.1: Invoke `web-design-principles` and `immersive-aesthetic` skills**

Use the Skill tool. Capture any constraints that should influence the token choices. Record them inline if they change the spec.

- [ ] **Step 1.2: Rewrite `src/app/globals.css`**

```css
@import "tailwindcss";

/* === Palette B — warm editorial dark (active) ============================ */
:root {
  --bg: #0B0A08;
  --bg-elev: #14120F;
  --fg: #EDE6D6;
  --fg-muted: #8A8272;
  --accent: #C9A96A;
  --accent-hot: #E8C98A;
  --rule: rgba(237, 230, 214, 0.08);

  --font-display: var(--font-fraunces);
  --font-sans: var(--font-inter);
  --font-mono: var(--font-jetbrains-mono);

  --ease-out-quart: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-1: 200ms;
  --dur-2: 300ms;
  --dur-3: 500ms;
  --dur-4: 800ms;

  --content-max: 1280px;
}

/* === Alternate palettes (uncomment one block to swap) ====================
:root {
  // Palette A — deep dark + single luminous accent
  --bg: #0A0A0B;
  --bg-elev: #111113;
  --fg: #F5F5F4;
  --fg-muted: #7A7A78;
  --accent: #7C5CFF;
  --accent-hot: #9D84FF;
  --rule: rgba(245, 245, 244, 0.08);
}

:root {
  // Palette D — dark with dual accents
  --bg: #08070E;
  --bg-elev: #110F1C;
  --fg: #EDEAF5;
  --fg-muted: #7B7890;
  --accent: #8B5CF6;
  --accent-hot: #EF4444;
  --rule: rgba(237, 234, 245, 0.08);
}
========================================================================= */

@theme inline {
  --color-bg: var(--bg);
  --color-bg-elev: var(--bg-elev);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-accent: var(--accent);
  --color-accent-hot: var(--accent-hot);
  --color-rule: var(--rule);
  --font-display: var(--font-display);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}

* { box-sizing: border-box; }

html, body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

body {
  min-height: 100vh;
  line-height: 1.6;
}

a { color: inherit; text-decoration: none; }

::selection { background: var(--accent); color: var(--bg); }

:focus-visible {
  outline: 2px solid var(--fg);
  outline-offset: 3px;
  border-radius: 2px;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 8px;
  background: var(--fg);
  color: var(--bg);
  padding: 8px 12px;
  z-index: 100;
  font-family: var(--font-mono);
  font-size: 12px;
}
.skip-link:focus { top: 8px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 1.3: Rewrite `src/app/layout.tsx` with font + skip-link wiring**

```tsx
import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Keaton Jones — Software Engineer",
  description: "Software engineer building production frontends with taste. Selected work, case studies, and contact.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 1.4: Verify build**

Run: `npm run build`
Expected: build succeeds. Page will render near-black with cream text once `page.tsx` is rewritten; for now existing page renders against the new tokens, which is fine — legacy will be ripped out in Task 9.

- [ ] **Step 1.5: Commit**

```bash
git add -A
git commit -m "feat(theme): palette tokens, fonts, base layout"
```

---

## Task 2: `useSiteReducedMotion` + `RevealOnView`

**Files:**
- Create: `src/components/interactions/useSiteReducedMotion.ts`
- Create: `src/components/interactions/RevealOnView.tsx`
- Create: `src/components/interactions/RevealOnView.test.tsx`

- [ ] **Step 2.1: Write failing test for `RevealOnView`**

`src/components/interactions/RevealOnView.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { mockMatchMedia } from '@/test/matchMedia';
import { RevealOnView } from './RevealOnView';

describe('RevealOnView', () => {
  beforeEach(() => mockMatchMedia(false));

  it('renders children', () => {
    render(<RevealOnView><p>hello</p></RevealOnView>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('adds data-reduced-motion="true" when user prefers reduced motion', () => {
    mockMatchMedia(true);
    render(<RevealOnView><p>hello</p></RevealOnView>);
    const wrapper = screen.getByText('hello').parentElement!;
    expect(wrapper.getAttribute('data-reduced-motion')).toBe('true');
  });
});
```

Run: `npm test -- RevealOnView`
Expected: FAIL (module not found).

- [ ] **Step 2.2: Implement `useSiteReducedMotion`**

```ts
"use client";
import { useEffect, useState } from 'react';

export function useSiteReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}
```

- [ ] **Step 2.3: Implement `RevealOnView`**

```tsx
"use client";
import { motion, useInView } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { useSiteReducedMotion } from './useSiteReducedMotion';

type Props = { children: ReactNode; delay?: number; className?: string };

export function RevealOnView({ children, delay = 0, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useSiteReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.2 });

  if (reduced) {
    return <div ref={ref} data-reduced-motion="true" className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2.4: Run test**

Run: `npm test -- RevealOnView`
Expected: 2 passed.

- [ ] **Step 2.5: Commit**

```bash
git add -A
git commit -m "feat(interactions): useSiteReducedMotion hook + RevealOnView primitive"
```

---

## Task 3: `CursorProvider`

**Files:**
- Create: `src/components/interactions/CursorProvider.tsx`
- Create: `src/components/interactions/CursorProvider.test.tsx`

- [ ] **Step 3.1: Write failing test**

```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { mockMatchMedia } from '@/test/matchMedia';
import { CursorProvider, useCursor } from './CursorProvider';

function Probe() {
  const { setCursorState } = useCursor();
  return <button onClick={() => setCursorState('link')}>toggle</button>;
}

describe('CursorProvider', () => {
  beforeEach(() => mockMatchMedia(false));

  it('mounts a cursor dot element in non-reduced-motion mode', () => {
    render(<CursorProvider><Probe /></CursorProvider>);
    expect(document.querySelector('[data-site-cursor]')).toBeInTheDocument();
  });

  it('does NOT mount the cursor dot when reduced motion is preferred', () => {
    mockMatchMedia(true);
    render(<CursorProvider><Probe /></CursorProvider>);
    expect(document.querySelector('[data-site-cursor]')).not.toBeInTheDocument();
  });

  it('exposes setCursorState via context', () => {
    render(<CursorProvider><Probe /></CursorProvider>);
    const btn = screen.getByText('toggle');
    act(() => btn.click());
    // state change doesn't throw; full visual validation is manual
    expect(btn).toBeInTheDocument();
  });
});
```

Run: FAIL.

- [ ] **Step 3.2: Implement `CursorProvider`**

```tsx
"use client";
import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
  type ReactNode,
} from 'react';
import { useSiteReducedMotion } from './useSiteReducedMotion';

type CursorState = 'default' | 'link' | 'hidden';

const CursorCtx = createContext<{ setCursorState: (s: CursorState) => void }>({
  setCursorState: () => {},
});

export const useCursor = () => useContext(CursorCtx);

export function CursorProvider({ children }: { children: ReactNode }) {
  const reduced = useSiteReducedMotion();
  const [isTouch, setIsTouch] = useState(false);
  const [state, setState] = useState<CursorState>('default');
  const dotRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none)').matches);
  }, []);

  useEffect(() => {
    if (reduced || isTouch) return;
    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const tick = () => {
      const k = 0.15;
      pos.current.x += (target.current.x - pos.current.x) * k;
      pos.current.y += (target.current.y - pos.current.y) * k;
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [reduced, isTouch]);

  const setCursorState = useCallback((s: CursorState) => setState(s), []);

  const showDot = !reduced && !isTouch && state !== 'hidden';
  const size = state === 'link' ? 40 : 6;
  const border = state === 'link' ? '1px solid var(--fg)' : 'none';
  const bg = state === 'link' ? 'transparent' : 'var(--fg)';

  return (
    <CursorCtx.Provider value={{ setCursorState }}>
      {children}
      {showDot && (
        <div
          ref={dotRef}
          data-site-cursor
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: '50%',
            background: bg,
            border,
            pointerEvents: 'none',
            zIndex: 9999,
            mixBlendMode: 'difference',
            transition: 'width 200ms var(--ease-out-quart), height 200ms var(--ease-out-quart), background 200ms',
          }}
        />
      )}
    </CursorCtx.Provider>
  );
}
```

- [ ] **Step 3.3: Run test**

Run: `npm test -- CursorProvider`
Expected: 3 passed.

- [ ] **Step 3.4: Commit**

```bash
git add -A
git commit -m "feat(interactions): CursorProvider with RAF-lerped dot and link state"
```

---

## Task 4: `ScrollProvider`

**Files:**
- Create: `src/components/interactions/ScrollProvider.tsx`
- Create: `src/components/interactions/ScrollProvider.test.tsx`

- [ ] **Step 4.1: Write failing test**

```tsx
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScrollProvider, useScrollProgress } from './ScrollProvider';

function Probe() {
  const progress = useScrollProgress();
  return <span data-testid="probe">{typeof progress.get}</span>;
}

describe('ScrollProvider', () => {
  it('exposes a MotionValue via useScrollProgress', () => {
    const { getByTestId } = render(<ScrollProvider><Probe /></ScrollProvider>);
    expect(getByTestId('probe').textContent).toBe('function');
  });
});
```

Run: FAIL.

- [ ] **Step 4.2: Implement `ScrollProvider`**

```tsx
"use client";
import { createContext, useContext, useRef, type ReactNode } from 'react';
import { useScroll, type MotionValue } from 'framer-motion';

const ScrollCtx = createContext<MotionValue<number> | null>(null);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  return (
    <ScrollCtx.Provider value={scrollYProgress}>
      <div ref={ref}>{children}</div>
    </ScrollCtx.Provider>
  );
}

export function useScrollProgress(): MotionValue<number> {
  const v = useContext(ScrollCtx);
  if (!v) throw new Error('useScrollProgress must be used inside ScrollProvider');
  return v;
}
```

- [ ] **Step 4.3: Run test**

Run: `npm test -- ScrollProvider`
Expected: 1 passed.

- [ ] **Step 4.4: Commit**

```bash
git add -A
git commit -m "feat(interactions): ScrollProvider with shared progress MotionValue"
```

---

## Task 5: `PageTransition` + provider tree + nav

**Files:**
- Create: `src/components/interactions/PageTransition.tsx`
- Create: `src/components/nav/Nav.tsx`
- Modify: `src/app/layout.tsx`

**Skill invocations:** `ui-ux-patterns`, `page-transitions`.

- [ ] **Step 5.1: Invoke `page-transitions` and `ui-ux-patterns` skills**

- [ ] **Step 5.2: Implement `PageTransition`**

```tsx
"use client";
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { useSiteReducedMotion } from './useSiteReducedMotion';

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useSiteReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 5.3: Implement `Nav`**

```tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCursor } from '@/components/interactions/CursorProvider';

const LINKS = [
  { href: '/#work', label: 'Work' },
  { href: '/#about', label: 'About' },
  { href: '/resume', label: 'Resume' },
  { href: '/#contact', label: 'Contact' },
];

export function Nav() {
  const pathname = usePathname();
  const { setCursorState } = useCursor();
  const hover = {
    onPointerEnter: () => setCursorState('link'),
    onPointerLeave: () => setCursorState('default'),
  };

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 border-b border-[var(--rule)] bg-[var(--bg)]/60 backdrop-blur-md"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-14 max-w-[var(--content-max)] items-center justify-between px-6">
        <Link
          href="/"
          data-cursor="link"
          {...hover}
          className="font-[family-name:var(--font-display)] text-[18px] tracking-tight"
          aria-label="Kodetive — home"
        >
          Kodetive
        </Link>
        <ul className="flex items-center gap-8 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.12em]">
          {LINKS.map(l => (
            <li key={l.href}>
              <Link
                href={l.href}
                data-cursor="link"
                {...hover}
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
```

- [ ] **Step 5.4: Wire providers into `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CursorProvider } from "@/components/interactions/CursorProvider";
import { ScrollProvider } from "@/components/interactions/ScrollProvider";
import { PageTransition } from "@/components/interactions/PageTransition";
import { Nav } from "@/components/nav/Nav";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz", "SOFT"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Keaton Jones — Software Engineer",
  description: "Software engineer building production frontends with taste. Selected work, case studies, and contact.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetBrainsMono.variable}`}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <CursorProvider>
          <ScrollProvider>
            <Nav />
            <main id="main">
              <PageTransition>{children}</PageTransition>
            </main>
          </ScrollProvider>
        </CursorProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5.5: Dev-server smoke test**

```bash
npm run dev
```

In a browser, load `http://localhost:3000`. Verify:
- No console errors.
- Nav appears fixed at top with the four links.
- Hovering a link scales the cursor dot into the ghost ring.
- Hard refresh — fonts swap cleanly.

- [ ] **Step 5.6: Commit**

```bash
git add -A
git commit -m "feat(interactions): PageTransition + provider tree + new Nav"
```

---

## Task 6: Hero — R3F ambient layer

**Files:**
- Create: `src/components/hero/HeroAmbient.tsx`
- Create: `src/components/hero/HeroAmbientMobile.tsx`
- Create: `public/images/hero-ambient-fallback.jpg` (placeholder — solid obsidian PNG is fine for now; replace with pre-rendered still later)

**Skill invocations:** `three-d-web`, `immersive-aesthetic`.

- [ ] **Step 6.1: Invoke `three-d-web` and `immersive-aesthetic` skills**

Capture any scene/perf constraints.

- [ ] **Step 6.2: Create a placeholder fallback image**

For now, a 1920×1080 solid `#0B0A08` JPEG is sufficient. Generate via:

```bash
cd /Users/keatonjones/Projects/personal/kodetive-consulting/public/images
# create a 1920x1080 solid fill — any tool works; using ImageMagick:
magick -size 1920x1080 xc:'#0B0A08' hero-ambient-fallback.jpg
```

If ImageMagick is unavailable, commit a 1×1 PNG at the same path and replace before ship.

- [ ] **Step 6.3: Implement the desktop ambient scene**

`src/components/hero/HeroAmbient.tsx`:

```tsx
"use client";
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';

const FRAG = /* glsl */`
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uAccent;

  // 3D simplex-ish noise (cheap, not canonical)
  float hash(vec3 p) { return fract(sin(dot(p, vec3(17.1,113.5,31.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    f = f*f*(3.0-2.0*f);
    float n000 = hash(i + vec3(0,0,0));
    float n100 = hash(i + vec3(1,0,0));
    float n010 = hash(i + vec3(0,1,0));
    float n110 = hash(i + vec3(1,1,0));
    float n001 = hash(i + vec3(0,0,1));
    float n101 = hash(i + vec3(1,0,1));
    float n011 = hash(i + vec3(0,1,1));
    float n111 = hash(i + vec3(1,1,1));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }

  void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= 1.6;
    float t = uTime * 0.08;
    float n = noise(vec3(uv * 1.4, t));
    n = pow(n, 1.6);
    vec3 base = vec3(0.043, 0.039, 0.031);
    vec3 glow = mix(base, uAccent, smoothstep(0.55, 0.95, n) * 0.35);
    gl_FragColor = vec4(glow, 1.0);
  }
`;

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function Plane() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt;
  });
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={{
          uTime: { value: 0 },
          uAccent: { value: new THREE.Color('#C9A96A') },
        }}
      />
    </mesh>
  );
}

export default function HeroAmbient() {
  const reduced = useSiteReducedMotion();
  if (reduced) return null;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 1], fov: 50 }}
      >
        <Plane />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 6.4: Implement the mobile fallback**

`src/components/hero/HeroAmbientMobile.tsx`:

```tsx
import Image from 'next/image';

export default function HeroAmbientMobile() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Image
        src="/images/hero-ambient-fallback.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover' }}
      />
    </div>
  );
}
```

- [ ] **Step 6.5: Dev-server visual check**

Run: `npm run dev` — open the site, temporarily mount `<HeroAmbient />` in `page.tsx` (full-bleed `div` with `h-screen relative`). Confirm:
- You see a slow-drifting organic glow against obsidian.
- No console warnings.
- FPS is smooth (DevTools Performance tab, 60fps on a modern laptop).
- Reduced-motion media query in DevTools → scene disappears (React removes it).

Revert the temp mount; the real assembly happens in Task 8.

- [ ] **Step 6.6: Commit**

```bash
git add -A
git commit -m "feat(hero): R3F ambient noise scene + mobile fallback"
```

---

## Task 7: Hero — shader typography

**Files:**
- Create: `src/components/hero/HeroShaderText.tsx`
- Create: `src/components/hero/HeroShaderText.test.tsx`

**Skill invocations:** `motion-design`, `immersive-aesthetic`.

- [ ] **Step 7.1: Invoke `motion-design` skill**

Confirm easing and duration stay inside spec defaults.

- [ ] **Step 7.2: Write failing accessibility test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeroShaderText } from './HeroShaderText';

describe('HeroShaderText', () => {
  it('renders the accessible H1 in the DOM for screen readers', () => {
    render(<HeroShaderText name="Keaton Jones" title="Software Engineer" />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Keaton Jones');
    expect(h1).toHaveTextContent('Software Engineer');
  });
});
```

Run: FAIL.

- [ ] **Step 7.3: Implement `HeroShaderText`**

Approach: render the H1 twice — once visually-hidden (SEO + screen readers) and once as a WebGL plane that samples a canvas-rendered text texture. Cursor position and scroll progress feed the distortion uniform.

```tsx
"use client";
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTransform } from 'framer-motion';
import { useScrollProgress } from '@/components/interactions/ScrollProvider';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';

type Props = { name: string; title: string };

const FRAG = /* glsl */`
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uMouse;
  uniform float uScroll;
  uniform float uTime;

  void main() {
    vec2 uv = vUv;
    float dist = distance(uv, uMouse);
    float pull = smoothstep(0.35, 0.0, dist) * 0.012;
    vec2 flow = vec2(
      sin(uv.y * 8.0 + uTime * 0.4),
      cos(uv.x * 8.0 + uTime * 0.3)
    ) * 0.002;
    uv += flow + pull * normalize(uMouse - uv + 1e-4);

    // Scroll dissolve
    float dissolve = smoothstep(0.0, 0.4, uScroll);
    uv.y += dissolve * 0.15 * (1.0 - vUv.y);
    float alphaCut = step(dissolve, fract(sin(dot(floor(vUv * 80.0), vec2(12.3, 78.1))) * 43758.5));

    vec4 tex = texture2D(uTex, uv);
    float a = tex.a * alphaCut * (1.0 - dissolve * 0.8);
    gl_FragColor = vec4(tex.rgb, a);
  }
`;

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function buildTextTexture(name: string, title: string): THREE.CanvasTexture {
  const scale = 2;
  const w = 2048, h = 1024;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#EDE6D6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '400 220px "Fraunces", serif';
  ctx.fillText(name, (w / scale) / 2, (h / scale) / 2 - 60);

  ctx.font = '400 56px "JetBrains Mono", monospace';
  ctx.fillStyle = '#8A8272';
  ctx.fillText(title, (w / scale) / 2, (h / scale) / 2 + 70);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  return tex;
}

function Plane({ tex, mouse, scroll }: { tex: THREE.CanvasTexture; mouse: React.MutableRefObject<{x:number;y:number}>; scroll: { get: () => number } }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame((_, dt) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value += dt;
    const m = mat.current.uniforms.uMouse.value as THREE.Vector2;
    m.x += (mouse.current.x - m.x) * 0.08;
    m.y += (mouse.current.y - m.y) * 0.08;
    mat.current.uniforms.uScroll.value = scroll.get();
  });
  return (
    <mesh>
      <planeGeometry args={[2, 1]} />
      <shaderMaterial
        ref={mat}
        transparent
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={{
          uTex: { value: tex },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uScroll: { value: 0 },
          uTime: { value: 0 },
        }}
      />
    </mesh>
  );
}

export function HeroShaderText({ name, title }: Props) {
  const reduced = useSiteReducedMotion();
  const progress = useScrollProgress();
  const scrollForShader = useTransform(progress, [0, 0.25], [0, 1]);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Wait a tick so Fraunces has a chance to load.
    document.fonts?.ready.then(() => setTex(buildTextTexture(name, title)));
  }, [name, title]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <>
      <h1 className="sr-only">{name} — {title}</h1>
      {reduced ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-[family-name:var(--font-display)] text-[clamp(48px,10vw,160px)] leading-none">{name}</span>
          <span className="mt-4 font-[family-name:var(--font-mono)] text-[14px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">{title}</span>
        </div>
      ) : (
        <div className="absolute inset-0">
          {tex && (
            <Canvas
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true }}
              camera={{ position: [0, 0, 1], fov: 50 }}
            >
              <Plane tex={tex} mouse={mouse} scroll={scrollForShader} />
            </Canvas>
          )}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 7.4: Run test**

Run: `npm test -- HeroShaderText`
Expected: 1 passed (H1 renders for both branches since `useSiteReducedMotion` defaults to `false` in the test env).

- [ ] **Step 7.5: Commit**

```bash
git add -A
git commit -m "feat(hero): shader typography with scroll dissolve and cursor distortion"
```

---

## Task 8: Hero — chrome + composition

**Files:**
- Create: `src/components/hero/HeroChrome.tsx`
- Create: `src/components/hero/Hero.tsx`
- Delete (after Task 15): `src/components/Hero.tsx`

- [ ] **Step 8.1: Implement `HeroChrome`**

```tsx
import { motion } from 'framer-motion';

export function HeroChrome() {
  return (
    <>
      <div className="pointer-events-none absolute bottom-8 left-8 flex items-center gap-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
        <motion.span
          initial={{ y: 0 }}
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          ↓
        </motion.span>
        Scroll
      </div>
      <div className="pointer-events-none absolute bottom-8 right-8 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
        01 / 04
      </div>
    </>
  );
}
```

- [ ] **Step 8.2: Compose `Hero`**

`src/components/hero/Hero.tsx`:

```tsx
"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { HeroShaderText } from './HeroShaderText';
import { HeroChrome } from './HeroChrome';

const HeroAmbient = dynamic(() => import('./HeroAmbient'), { ssr: false });
const HeroAmbientMobile = dynamic(() => import('./HeroAmbientMobile'), { ssr: false });

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return isMobile;
}

export function Hero() {
  const isMobile = useIsMobile();
  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-[var(--bg)]">
      {isMobile ? <HeroAmbientMobile /> : <HeroAmbient />}
      <HeroShaderText name="Keaton Jones" title="Software Engineer" />
      <HeroChrome />
    </section>
  );
}
```

- [ ] **Step 8.3: Temporarily mount in `page.tsx` for visual QA**

Replace the body of `src/app/page.tsx`:

```tsx
import { Hero } from '@/components/hero/Hero';
export default function Home() {
  return <Hero />;
}
```

- [ ] **Step 8.4: Dev-server visual check**

Run: `npm run dev`. Load `http://localhost:3000`. Confirm:
- Full-viewport hero, ambient scene drifts behind, shader text crisp.
- Cursor moves → subtle pull on the text.
- Scrolling (drag the page long enough — add a temp `<div style={{height:'200vh'}} />` after Hero if needed) dissolves the text as progress → 0.25.
- Chrome labels bottom-left and bottom-right.
- Throttle CPU 4×: still smooth (≥45fps).
- Toggle reduced-motion in DevTools → static text renders; R3F canvases gone.

- [ ] **Step 8.5: Invoke `taste` skill**

Before committing, run the `taste` skill against the hero. If it flags generic AI-slop patterns (stock gradient, centered-cliché, missing intentional detail), fix before committing.

- [ ] **Step 8.6: Commit**

```bash
git add -A
git commit -m "feat(hero): compose ambient + shader text + chrome with mobile fallback"
```

---

## Task 9: Work section + shared-element transition

**Files:**
- Create: `src/components/work/projects.ts`
- Create: `src/components/work/WorkCard.tsx`
- Create: `src/components/work/WorkSection.tsx`
- Create: `src/components/work/WorkSection.test.tsx`
- Add 3 placeholder covers to `public/images/work/`

**Skill invocations:** `ui-ux-patterns`, `web-design-principles`.

- [ ] **Step 9.1: Project data**

`src/components/work/projects.ts`:

```ts
export type Project = {
  slug: string;
  index: string;
  title: string;
  status: string;
  year: string;
  stack: string[];
  cover: string;
  summary: string;
};

export const PROJECTS: Project[] = [
  {
    slug: 'shredder',
    index: '01',
    title: 'Shredder',
    status: 'In progress',
    year: '2026',
    stack: ['React Native', 'Supabase', 'RevenueCat', 'OneSignal'],
    cover: '/images/work/shredder-cover.jpg',
    summary: 'A mobile product for [TODO — fill with real summary].',
  },
  {
    slug: 'stat-ai',
    index: '02',
    title: 'Stat AI',
    status: 'Shipped',
    year: '2024',
    stack: ['React Native', 'OpenAI', 'AppsFlyer', 'RevenueCat'],
    cover: '/images/work/stat-ai-cover.jpg',
    summary: 'An AI-powered [TODO — fill with real summary].',
  },
  {
    slug: 'unit-converter',
    index: '03',
    title: 'Unit Converter',
    status: 'Shipped',
    year: '2024',
    stack: ['Next.js', 'TypeScript', 'Tailwind'],
    cover: '/images/work/unit-converter-cover.jpg',
    summary: 'A focused utility for [TODO — fill with real summary].',
  },
];
```

Create three 1600×1000 solid-fill JPEGs at the listed paths (same ImageMagick pattern as Task 6, varying the hex). These are replaced with real screenshots later.

- [ ] **Step 9.2: `WorkCard`**

```tsx
"use client";
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCursor } from '@/components/interactions/CursorProvider';
import type { Project } from './projects';

export function WorkCard({ project, reverse }: { project: Project; reverse?: boolean }) {
  const { setCursorState } = useCursor();
  return (
    <Link
      href={`/work/${project.slug}`}
      data-cursor="link"
      onPointerEnter={() => setCursorState('link')}
      onPointerLeave={() => setCursorState('default')}
      className="group block border-t border-[var(--rule)] py-10 md:py-16"
      aria-label={`View case study — ${project.title}`}
    >
      <div className={`mx-auto grid max-w-[var(--content-max)] gap-8 px-6 md:grid-cols-12 md:gap-12 ${reverse ? 'md:[&>*:first-child]:col-start-7 md:[&>*:first-child]:col-end-13 md:[&>*:last-child]:col-start-1 md:[&>*:last-child]:col-end-6 md:[&>*:last-child]:row-start-1' : ''}`}>
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
```

- [ ] **Step 9.3: `WorkSection`**

```tsx
import { PROJECTS } from './projects';
import { WorkCard } from './WorkCard';

export function WorkSection() {
  return (
    <section id="work" aria-labelledby="work-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-[var(--content-max)] px-6">
        <div className="flex items-baseline justify-between border-b border-[var(--rule)] pb-6">
          <h2 id="work-title" className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,56px)] leading-tight tracking-tight">
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
```

- [ ] **Step 9.4: Test — project data and card render**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WorkSection } from './WorkSection';
import { CursorProvider } from '@/components/interactions/CursorProvider';
import { PROJECTS } from './projects';

describe('WorkSection', () => {
  it('renders all projects with a link to /work/[slug]', () => {
    render(<CursorProvider><WorkSection /></CursorProvider>);
    for (const p of PROJECTS) {
      const link = screen.getByRole('link', { name: new RegExp(p.title, 'i') });
      expect(link).toHaveAttribute('href', `/work/${p.slug}`);
    }
  });
});
```

Run: `npm test -- WorkSection`. Expected: 1 passed.

- [ ] **Step 9.5: Commit**

```bash
git add -A
git commit -m "feat(work): home work section with alternating cards and shared layoutId"
```

---

## Task 10: Case study template + dynamic route

**Files:**
- Create: `src/components/work/CaseStudy.tsx`
- Create: `src/components/work/content/shredder.tsx`
- Create: `src/components/work/content/stat-ai.tsx`
- Create: `src/components/work/content/unit-converter.tsx`
- Create: `src/app/work/[slug]/page.tsx`

- [ ] **Step 10.1: `CaseStudy` template**

```tsx
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
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">
                {l.label} →
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
```

- [ ] **Step 10.2: Content stubs (one file each)**

`src/components/work/content/shredder.tsx`:

```tsx
export default function Shredder() {
  return (
    <>
      <section>
        <h2>The problem</h2>
        <p>[TODO — 2–3 paragraphs describing the problem Shredder solves.]</p>
      </section>
      <section>
        <h2>Approach</h2>
        <p>[TODO — how you thought about it, key constraints, what you chose and why.]</p>
      </section>
      <section>
        <h2>Tech decisions</h2>
        <p>RevenueCat over Stripe because [TODO]. Supabase over Firebase because [TODO]. OneSignal because [TODO].</p>
      </section>
      <section>
        <h2>Outcome / what I learned</h2>
        <p>[TODO — honest outcome, shipped or in progress, what you would do differently.]</p>
      </section>
    </>
  );
}
```

Create `stat-ai.tsx` and `unit-converter.tsx` with the same structure but tailored TODO prompts (mention OpenAI for Stat AI, zero-dependency utility framing for Unit Converter).

- [ ] **Step 10.3: Dynamic route**

`src/app/work/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { PROJECTS } from '@/components/work/projects';
import { CaseStudy } from '@/components/work/CaseStudy';
import Shredder from '@/components/work/content/shredder';
import StatAI from '@/components/work/content/stat-ai';
import UnitConverter from '@/components/work/content/unit-converter';

const CONTENT: Record<string, () => React.ReactElement> = {
  shredder: Shredder,
  'stat-ai': StatAI,
  'unit-converter': UnitConverter,
};

export function generateStaticParams() {
  return PROJECTS.map(p => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = PROJECTS.find(p => p.slug === params.slug);
  return p ? { title: `${p.title} — Keaton Jones`, description: p.summary } : {};
}

export default function Page({ params }: { params: { slug: string } }) {
  const project = PROJECTS.find(p => p.slug === params.slug);
  const Body = CONTENT[params.slug];
  if (!project || !Body) notFound();
  return (
    <CaseStudy project={project!}>
      <Body />
    </CaseStudy>
  );
}
```

- [ ] **Step 10.4: Build + visual QA**

Run: `npm run build && npm run dev`. Browse `/work/shredder`, `/work/stat-ai`, `/work/unit-converter`. Confirm:
- Each page renders the header, metadata table, content sections, and prev/next nav.
- Navigating from `/` work cards → case study animates the cover as a shared element (visible tween on the image).
- Refresh on a case study loads cleanly (no layoutId warnings).
- Reduced-motion → no shared-element animation, straight navigation.

- [ ] **Step 10.5: Commit**

```bash
git add -A
git commit -m "feat(work): case study template, content stubs, dynamic /work/[slug] route"
```

---

## Task 11: About section

**Files:**
- Create: `src/components/about/About.tsx`

- [ ] **Step 11.1: Implement `About`**

```tsx
import Image from 'next/image';
import { RevealOnView } from '@/components/interactions/RevealOnView';

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-[var(--rule)] py-24 md:py-32">
      <div className="mx-auto grid max-w-[var(--content-max)] gap-12 px-6 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-5">
          <RevealOnView>
            <div className="relative aspect-[4/5] w-full max-w-[420px] overflow-hidden bg-[var(--bg-elev)]">
              {/* Portrait placeholder — replace with real B&W photo */}
              <Image
                src="/images/about-portrait-placeholder.jpg"
                alt="Keaton Jones"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover grayscale"
              />
            </div>
          </RevealOnView>
        </div>
        <div className="md:col-span-7">
          <RevealOnView>
            <h2 id="about-title" className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,56px)] leading-tight tracking-tight">
              About
            </h2>
          </RevealOnView>
          <div className="mt-8 space-y-6 text-[17px] leading-[1.7] text-[var(--fg)]">
            <RevealOnView delay={0.05}><p>[TODO — paragraph 1: who you are and the kind of work you gravitate to.]</p></RevealOnView>
            <RevealOnView delay={0.1}><p>[TODO — paragraph 2: how you work — process, craft, what "done" means to you.]</p></RevealOnView>
            <RevealOnView delay={0.15}><p>[TODO — paragraph 3: what you are looking for next. One sentence is fine.]</p></RevealOnView>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 11.2: Placeholder portrait**

Create `public/images/about-portrait-placeholder.jpg` (800×1000 solid `#14120F`). Replace with a real B&W photo later.

- [ ] **Step 11.3: Commit**

```bash
git add -A
git commit -m "feat(about): editorial about section with reveal-on-view"
```

---

## Task 12: Skills marquee

**Files:**
- Create: `src/components/skills/skills.ts`
- Create: `src/components/skills/SkillsMarquee.tsx`
- Create: `src/components/skills/SkillsMarquee.test.tsx`

- [ ] **Step 12.1: Skills data**

```ts
export type Skill = { label: string };

export const CORE: Skill[] = [
  { label: 'TypeScript' }, { label: 'React' }, { label: 'Next.js' },
  { label: 'React Native' }, { label: 'Node' }, { label: 'Tailwind' },
  { label: 'Framer Motion' }, { label: 'Three.js / R3F' },
];

export const PLATFORM: Skill[] = [
  { label: 'Supabase' }, { label: 'RevenueCat' }, { label: 'AppsFlyer' },
  { label: 'OneSignal' }, { label: 'Linear' }, { label: 'Vercel' },
  { label: 'OpenAI' }, { label: 'Google APIs' },
];
```

- [ ] **Step 12.2: Marquee component**

```tsx
"use client";
import { motion } from 'framer-motion';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';
import { CORE, PLATFORM, type Skill } from './skills';

function Row({ items, reverse }: { items: Skill[]; reverse?: boolean }) {
  const reduced = useSiteReducedMotion();
  const tripled = [...items, ...items, ...items];
  if (reduced) {
    return (
      <ul className="flex flex-wrap gap-3">
        {items.map(s => <Chip key={s.label} label={s.label} />)}
      </ul>
    );
  }
  return (
    <div className="group relative overflow-hidden">
      <motion.div
        className="flex gap-3 whitespace-nowrap will-change-transform"
        animate={{ x: reverse ? ['-33.333%', '0%'] : ['0%', '-33.333%'] }}
        transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
        style={{ paddingInlineEnd: 12 }}
      >
        {tripled.map((s, i) => <Chip key={`${s.label}-${i}`} label={s.label} />)}
      </motion.div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex h-10 items-center rounded-full border border-[var(--rule)] px-4 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.15em] text-[var(--fg)] transition-transform duration-[var(--dur-1)] hover:-translate-y-[2px] hover:text-[var(--accent)]">
      {label}
    </span>
  );
}

export function SkillsMarquee() {
  return (
    <section aria-label="Skills and tools" className="border-t border-[var(--rule)] py-20 md:py-24">
      <div className="mx-auto mb-10 max-w-[var(--content-max)] px-6">
        <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.25em] text-[var(--fg-muted)]">
          Tools &amp; platforms
        </h2>
      </div>
      <div className="space-y-4">
        <Row items={CORE} />
        <Row items={PLATFORM} reverse />
      </div>
    </section>
  );
}
```

- [ ] **Step 12.3: Test — covers all skills**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { SkillsMarquee } from './SkillsMarquee';
import { CORE, PLATFORM } from './skills';
import { mockMatchMedia } from '@/test/matchMedia';

describe('SkillsMarquee', () => {
  beforeEach(() => mockMatchMedia(true));
  it('renders every declared skill in reduced-motion mode', () => {
    render(<SkillsMarquee />);
    for (const s of [...CORE, ...PLATFORM]) {
      expect(screen.getAllByText(s.label).length).toBeGreaterThan(0);
    }
  });
});
```

Run: `npm test -- SkillsMarquee`. Expected: 1 passed.

- [ ] **Step 12.4: Commit**

```bash
git add -A
git commit -m "feat(skills): dual-row marquee with reduced-motion grid fallback"
```

---

## Task 13: Contact + Footer

**Files:**
- Create: `src/components/contact/Contact.tsx`
- Create: `src/components/contact/Footer.tsx`

- [ ] **Step 13.1: `Contact`**

```tsx
"use client";
import { useCursor } from '@/components/interactions/CursorProvider';

const LINKS = [
  { label: 'Email', href: 'mailto:Keatonjonesy@gmail.com' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/keaton-jones/' },
  { label: 'GitHub', href: 'https://github.com/keatonjones' },
];

export function Contact() {
  const { setCursorState } = useCursor();
  return (
    <section id="contact" aria-labelledby="contact-title" className="border-t border-[var(--rule)] py-28 md:py-40">
      <div className="mx-auto max-w-[var(--content-max)] px-6">
        <h2 id="contact-title" className="font-[family-name:var(--font-display)] text-[clamp(64px,10vw,180px)] leading-[0.9] tracking-tight">
          Let&rsquo;s talk.
        </h2>
        <ul className="mt-16 flex flex-wrap gap-x-10 gap-y-4 font-[family-name:var(--font-mono)] text-[14px] uppercase tracking-[0.15em]">
          {LINKS.map(l => (
            <li key={l.href}>
              <a
                href={l.href}
                data-cursor="link"
                onPointerEnter={() => setCursorState('link')}
                onPointerLeave={() => setCursorState('default')}
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
```

**IMPORTANT:** Confirm the email/LinkedIn/GitHub handles above with Keaton before committing. Replace if any differ.

- [ ] **Step 13.2: `Footer`**

```tsx
export function Footer() {
  return (
    <footer className="border-t border-[var(--rule)] py-8">
      <div className="mx-auto flex max-w-[var(--content-max)] flex-wrap items-center justify-between gap-4 px-6 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
        <span>© {new Date().getFullYear()} Keaton Jones</span>
        <span>Built with Next.js · Framer Motion · R3F</span>
        <a
          href="https://github.com/keatonjones/kodetive-consulting"
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
```

- [ ] **Step 13.3: Commit**

```bash
git add -A
git commit -m "feat(contact): contact section + footer"
```

---

## Task 14: Assemble home, delete legacy

**Files:**
- Rewrite: `src/app/page.tsx`
- Delete: legacy components per File structure section

- [ ] **Step 14.1: New `page.tsx`**

```tsx
import { Hero } from '@/components/hero/Hero';
import { WorkSection } from '@/components/work/WorkSection';
import { About } from '@/components/about/About';
import { SkillsMarquee } from '@/components/skills/SkillsMarquee';
import { Contact } from '@/components/contact/Contact';
import { Footer } from '@/components/contact/Footer';

export default function Home() {
  return (
    <>
      <Hero />
      <WorkSection />
      <About />
      <SkillsMarquee />
      <Contact />
      <Footer />
    </>
  );
}
```

- [ ] **Step 14.2: Delete legacy components**

```bash
git rm \
  src/components/Hero.tsx \
  src/components/About.tsx \
  src/components/Contact.tsx \
  src/components/Nav.tsx \
  src/components/PersonalShowcase.tsx \
  src/components/ThemeToggle.tsx
```

If `src/components/Calendar.tsx` is not imported anywhere after the above, delete it as well:

```bash
git grep -l "from '@/components/Calendar'" || git rm src/components/Calendar.tsx
```

- [ ] **Step 14.3: Verify build + lint**

```bash
npm run lint
npm run build
```

Both must succeed. Fix any unused imports surfaced.

- [ ] **Step 14.4: Full-site visual QA**

```bash
npm run dev
```

Walk the whole site: home scroll, work → case study navigation, prev/next, reduced-motion toggle, mobile (DevTools device emulation). Note any visual issues for Task 16.

- [ ] **Step 14.5: Commit**

```bash
git add -A
git commit -m "feat(home): assemble new home; delete legacy components"
```

---

## Task 15: Resume page restyle

**Files:**
- Modify: `src/app/resume/page.tsx`

- [ ] **Step 15.1: Read current resume page**

```bash
cat src/app/resume/page.tsx
```

- [ ] **Step 15.2: Restyle to the new token system**

Replace any hard-coded colors with `var(--fg)`, `var(--fg-muted)`, `var(--rule)`. Replace any heading font usage with `font-[family-name:var(--font-display)]`. Replace any body font usage with the default (Inter). Keep the resume content unchanged — this is a visual refresh only. Ensure the page opens the Keaton Jones Resume PDF via a mono-type "Download PDF" link at the top.

Exact code depends on what's there; no placeholders — once you've read the file, write the full replacement.

- [ ] **Step 15.3: Build + visual QA**

```bash
npm run build && npm run dev
```

Load `/resume`. Confirm it reads as part of the same site (fonts, palette, spacing), nav is consistent, PDF link works.

- [ ] **Step 15.4: Commit**

```bash
git add -A
git commit -m "refactor(resume): restyle to new token system"
```

---

## Task 16: A11y + perf pass

**Files:** (no new source — this is the pre-ship gate)

**Skill invocations:** `accessibility`, `performance-web`, `taste`.

- [ ] **Step 16.1: Invoke `accessibility` skill**

Walk the site with the skill's checklist. Verify: skip link, keyboard tab order, focus rings visible on every interactive element, H1 per page, alt text on non-decorative images, reduced-motion parity, contrast ≥ 4.5:1 on body text (check `--fg` on `--bg` and `--fg-muted` on `--bg` — `#8A8272` on `#0B0A08` may need to be lightened). Fix violations before continuing.

- [ ] **Step 16.2: Invoke `performance-web` skill**

- [ ] **Step 16.3: Local Lighthouse run**

```bash
# terminal A
npm run build && npm run start
# terminal B
npx lighthouse http://localhost:3000 \
  --only-categories=performance,accessibility,best-practices \
  --chrome-flags="--headless" --quiet \
  --output=json --output-path=./lighthouse.json
```

Expected (spec §8 gate):
- Performance ≥ 95
- Accessibility = 100
- Best practices = 100
- LCP < 2.0s · CLS < 0.05 · INP < 200ms

If any fail, fix and re-run. Commit the `lighthouse.json` to the repo (under `docs/superpowers/evidence/`) as evidence.

- [ ] **Step 16.4: Invoke `taste` skill on the full site**

Walk the whole experience end-to-end. Fix any generic AI-slop flags before declaring done.

- [ ] **Step 16.5: Commit evidence**

```bash
mkdir -p docs/superpowers/evidence
mv lighthouse.json docs/superpowers/evidence/lighthouse-$(date +%Y-%m-%d).json
git add -A
git commit -m "chore(qa): lighthouse evidence + a11y/perf fixes"
```

---

## Task 17: Review + merge

- [ ] **Step 17.1: Dispatch `reviewer` agent**

Per the global CLAUDE.md process rule. Fix anything flagged CRITICAL or HIGH before merging.

- [ ] **Step 17.2: Dispatch `qa` agent**

Final gate — run build + typecheck + lint + smoke test. Require evidence of passing.

- [ ] **Step 17.3: Merge to main**

```bash
git checkout main
git merge --no-ff site-redesign
git push origin main
```

Then visit Vercel deploy URL — confirm everything still works in production (fonts, shader, case studies).

---

## Open follow-ups (post-launch, not part of this plan)

- Replace placeholder covers with real screenshots.
- Replace `TODO` copy in case studies and About with real content.
- Add real B&W portrait for About.
- Palette swap review: decide between B, A, D after seeing B live. One-file change.
- Optional: command palette (Cmd+K).
- Optional: reintroduce Calendar booking if inquiries warrant it.

---

## Self-review notes

- Spec §1 (positioning) → drives Tasks 8–15 overall composition. ✓
- Spec §2 (IA) → Tasks 5, 10, 14, 15. ✓
- Spec §3 (visual system) → Task 1. ✓
- Spec §4 (hero) → Tasks 6, 7, 8. ✓
- Spec §5 (work + case studies) → Tasks 9, 10. ✓
- Spec §6 (about/skills/contact) → Tasks 11, 12, 13. ✓
- Spec §7 (interaction layer) → Tasks 2, 3, 4, 5. ✓
- Spec §8 (perf/a11y) → Task 16. ✓
- Spec §9 (skill invocation points) → called out inside each task. ✓
- Spec §10 (build sequence) → tasks are in the same order with one adjustment: interaction primitives land before nav so nav can consume them. ✓
- Spec §11 (open items) → captured under "Open follow-ups". ✓
- Spec §12 (non-goals) → no tasks created for them. ✓

Type consistency check: `CursorState` type, `useCursor`, `useScrollProgress`, `useSiteReducedMotion`, `Project` type, `PROJECTS` constant, `CaseStudy` props, `WorkCard` props — names used consistently across all tasks that reference them.
