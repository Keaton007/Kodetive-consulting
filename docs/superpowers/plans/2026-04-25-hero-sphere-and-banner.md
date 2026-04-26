# Hero Sphere + Sticky Skills Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ambient threads hero with a GPU-instanced chrome particle sphere that scroll-locks an explode/reform gesture into a horizontal particle spray, plus a sticky-pinned single-row skills ticker, on a dark icy-blue palette.

**Architecture:** One InstancedBufferGeometry holds ~4,000 (desktop) / ~800 (mobile) reflective droplet meshes with per-instance `aRestPos`, `aExplodePos`, and `aSeed` attributes. A patched `MeshStandardMaterial` reads a single `uExplode` uniform driven by Framer Motion's `useScroll` and lerps positions on the GPU each frame. A second sparser instanced mesh provides ambient floating droplets. Banner is `position: sticky; bottom: 0` inside the hero `<section>`, so it glues to the viewport bottom while the hero is in view and releases naturally as the hero exits — no JS scroll listeners.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript (strict), Tailwind 4, Framer Motion, `@react-three/fiber`, `@react-three/drei`, `three`, vitest + @testing-library/react.

**Spec:** [`docs/superpowers/specs/2026-04-25-hero-sphere-and-banner-design.md`](../specs/2026-04-25-hero-sphere-and-banner-design.md)

---

## File Structure

**New**
- `src/components/hero/HeroSphere.tsx` — desktop R3F scene (instanced particle sphere + ambient field + env lighting + scroll-driven uniform).
- `src/components/hero/HeroSphereMobile.tsx` — mobile variant (same scene, lower density).
- `src/components/hero/HeroBanner.tsx` — sticky single-row ticker.
- `src/components/hero/HeroBanner.test.tsx` — unit tests for banner.
- `public/env/hero.hdr` — locally bundled environment HDR (≤200KB).

**Modified**
- `src/app/globals.css` — palette tokens flipped to dark + icy-blue.
- `src/components/hero/Hero.tsx` — picks desktop vs mobile sphere, mounts `<HeroBanner />`, exposes scroll progress as a `MotionValue`.
- `src/app/page.tsx` — removes the standalone `<SkillsMarquee />` render.

**Deleted**
- `src/components/hero/HeroAmbient.tsx`
- `src/components/hero/HeroAmbientMobile.tsx`
- `src/components/skills/SkillsMarquee.tsx`
- `src/components/skills/SkillsMarquee.test.tsx`

**Untouched**
- `src/components/hero/HeroText.tsx`, `HeroChrome.tsx`
- `src/components/skills/skills.ts` (data file, reused by `HeroBanner`)

---

## Task 1: Palette flip — dark + icy-blue tokens

**Files:**
- Modify: `src/app/globals.css:3-24`

- [ ] **Step 1: Replace `:root` token block**

Open `src/app/globals.css` and replace the active palette block (lines 3-24) with:

```css
/* === Palette — dark + icy-blue (active) ================================ */
:root {
  --bg: #07090C;              /* deep cool near-black */
  --bg-elev: #0F141B;         /* elevated surface */
  --fg: #E6EDF5;              /* pale cool */
  --fg-muted: #8A95A4;        /* cool mid-gray */
  --accent: #6FB6FF;          /* icy blue — primary */
  --accent-hot: #B8DEFF;      /* lighter icy blue — hover/active */
  --rule: rgba(230, 237, 245, 0.10);

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
```

Leave the alternate palette comment block below it untouched (keeps history of past palettes).

- [ ] **Step 2: Sweep for hard-coded colors**

Run:

```bash
grep -rn "#[0-9A-Fa-f]\{6\}\|#[0-9A-Fa-f]\{3\}\|rgba(" src/components src/app | grep -v ".test." | grep -v globals.css
```

Expected: a small set of hits — most should already use tokens. For any hit that hard-codes a previous palette color (e.g., `#2F4A3A`, `#E8E4DB`, `#1A1A17`, `#C9A96A`), replace with the corresponding `var(--…)` token. The shaders in `HeroAmbient.tsx`/`HeroAmbientMobile.tsx` are deleted in a later task — leave them alone here.

- [ ] **Step 3: Manual verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000` and scroll every section. Look for: any block of color that reads as "left over from cream palette" — pale backgrounds inside cards, warm gold borders, etc. Fix in place by replacing with tokens. The hero will look broken (threads shader is now invisible against the dark bg) — that's expected; it's being replaced.

- [ ] **Step 4: Lint + commit**

```bash
npm run lint
```

Expected: no new errors.

```bash
git add src/app/globals.css src/components src/app
git commit -m "$(cat <<'EOF'
style(palette): flip to dark + icy-blue

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: HeroBanner — data + reduced-motion fallback (TDD)

**Files:**
- Create: `src/components/hero/HeroBanner.tsx`
- Create: `src/components/hero/HeroBanner.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/hero/HeroBanner.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { HeroBanner } from './HeroBanner';
import { CORE, PLATFORM } from '@/components/skills/skills';
import { mockMatchMedia } from '@/test/matchMedia';

describe('HeroBanner', () => {
  describe('reduced-motion mode', () => {
    beforeEach(() => mockMatchMedia(true));

    it('renders every declared skill', () => {
      render(<HeroBanner />);
      for (const s of [...CORE, ...PLATFORM]) {
        expect(screen.getAllByText(s.label).length).toBeGreaterThan(0);
      }
    });

    it('renders skills as a static list (no marquee duplication)', () => {
      render(<HeroBanner />);
      const total = [...CORE, ...PLATFORM];
      // In reduced-motion mode, each label appears exactly once.
      for (const s of total) {
        expect(screen.getAllByText(s.label).length).toBe(1);
      }
    });
  });

  describe('full-motion mode', () => {
    beforeEach(() => mockMatchMedia(false));

    it('renders skills tripled (for marquee seamlessness)', () => {
      render(<HeroBanner />);
      // The marquee triples its content so the wrap-around is invisible.
      // Every label should appear exactly 3 times.
      for (const s of [...CORE, ...PLATFORM]) {
        expect(screen.getAllByText(s.label).length).toBe(3);
      }
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- HeroBanner
```

Expected: FAIL with "Cannot find module './HeroBanner'".

- [ ] **Step 3: Write minimal implementation**

Create `src/components/hero/HeroBanner.tsx`:

```tsx
"use client";
import { useAnimationControls, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';
import { CORE, PLATFORM, type Skill } from '@/components/skills/skills';

const ALL: Skill[] = [...CORE, ...PLATFORM];

function Chip({ skill }: { skill: Skill }) {
  const Icon = skill.icon;
  return (
    <span
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.15em] text-[var(--fg)]"
      style={{ background: 'color-mix(in oklab, var(--accent) 6%, var(--bg-elev))' }}
    >
      <Icon size={16} aria-hidden="true" />
      {skill.label}
    </span>
  );
}

export function HeroBanner() {
  const reduced = useSiteReducedMotion();
  const controls = useAnimationControls();

  useEffect(() => {
    if (reduced) return;
    controls.start({
      x: '-33.333%',
      transition: { duration: 40, ease: 'linear', repeat: Infinity },
    });
  }, [reduced, controls]);

  if (reduced) {
    return (
      <div
        aria-label="Skills and tools"
        className="sticky bottom-0 left-0 right-0 z-10 border-y border-[var(--rule)] bg-[color-mix(in_oklab,var(--bg)_80%,transparent)] backdrop-blur-md"
        style={{ height: 'var(--banner-h, 60px)' }}
      >
        <ul className="flex h-full items-center gap-3 overflow-hidden px-6">
          {ALL.map(s => (
            <li key={s.label}><Chip skill={s} /></li>
          ))}
        </ul>
      </div>
    );
  }

  const tripled = [...ALL, ...ALL, ...ALL];

  return (
    <div
      aria-label="Skills and tools"
      className="sticky bottom-0 left-0 right-0 z-10 overflow-hidden border-y border-[var(--rule)] bg-[color-mix(in_oklab,var(--bg)_80%,transparent)] backdrop-blur-md"
      style={{
        height: 'var(--banner-h, 60px)',
        maskImage:
          'linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)',
      }}
      onMouseEnter={() => controls.stop()}
      onMouseLeave={() =>
        controls.start({
          x: '-33.333%',
          transition: { duration: 40, ease: 'linear', repeat: Infinity },
        })
      }
    >
      <motion.div
        className="flex h-full items-center gap-6 whitespace-nowrap will-change-transform"
        animate={controls}
        initial={{ x: '0%' }}
      >
        {tripled.map((s, i) => (
          <Chip key={`${s.label}-${i}`} skill={s} />
        ))}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test -- HeroBanner
```

Expected: all three tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/hero/HeroBanner.tsx src/components/hero/HeroBanner.test.tsx
git commit -m "$(cat <<'EOF'
feat(hero): add HeroBanner — sticky single-row skills ticker

Right-to-left scrolling chip ticker with Framer-controlled hover-pause,
backdrop blur, and edge mask. Reduced-motion mode renders a static row.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Wire HeroBanner into Hero, remove standalone SkillsMarquee section

**Files:**
- Modify: `src/components/hero/Hero.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add HeroBanner to Hero.tsx**

Replace `src/components/hero/Hero.tsx` with:

```tsx
"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { HeroText } from './HeroText';
import { HeroChrome } from './HeroChrome';
import { HeroBanner } from './HeroBanner';

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
      <HeroText name="Keaton Jones" title="Software Engineer" />
      <HeroChrome />
      <HeroBanner />
    </section>
  );
}
```

(`HeroAmbient` is still referenced — it'll be replaced by `HeroSphere` in Task 9. Keep it for now so the site doesn't break between tasks.)

- [ ] **Step 2: Remove standalone SkillsMarquee from page.tsx**

Replace `src/app/page.tsx` with:

```tsx
import { Hero } from '@/components/hero/Hero';
import { WorkSection } from '@/components/work/WorkSection';
import { About } from '@/components/about/About';
import { Contact } from '@/components/contact/Contact';
import { Footer } from '@/components/contact/Footer';

export default function Home() {
  return (
    <>
      <Hero />
      <WorkSection />
      <About />
      <Contact />
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected:
- Banner is glued to the bottom of the hero.
- Banner releases as you scroll past the hero (it scrolls up and out of view with the rest of the hero).
- Marquee runs right-to-left.
- Hovering the banner pauses it; un-hover resumes.
- No second skills section after the hero — `<WorkSection />` follows immediately.

- [ ] **Step 4: Lint + commit**

```bash
npm run lint
```

Expected: no errors.

```bash
git add src/components/hero/Hero.tsx src/app/page.tsx
git commit -m "$(cat <<'EOF'
feat(hero): mount HeroBanner inside hero, remove standalone marquee section

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Delete the old SkillsMarquee files

**Files:**
- Delete: `src/components/skills/SkillsMarquee.tsx`
- Delete: `src/components/skills/SkillsMarquee.test.tsx`

- [ ] **Step 1: Delete the files**

```bash
rm src/components/skills/SkillsMarquee.tsx src/components/skills/SkillsMarquee.test.tsx
```

- [ ] **Step 2: Verify nothing else imports them**

```bash
grep -rn "SkillsMarquee" src
```

Expected: no output (the only references were `page.tsx` removed in Task 3 and the test file just deleted).

- [ ] **Step 3: Lint + build**

```bash
npm run lint && npm run build
```

Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/components/skills/
git commit -m "$(cat <<'EOF'
refactor(skills): drop SkillsMarquee — superseded by HeroBanner

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add HDR environment asset

**Files:**
- Create: `public/env/hero.hdr`

- [ ] **Step 1: Place the HDR file**

Source a small dark-studio HDR (≤200KB). Free options:

- Polyhaven dark-studio variants (https://polyhaven.com/hdris) — download a 1k or 2k EXR/HDR, then resize to 512px wide and re-export as `.hdr` with low compression. Tools: HDR Shop, Affinity Photo, or `cmft` CLI.
- `studio_small_03_1k.hdr` from Polyhaven (~180KB raw, easy fit) — works as a neutral-cool studio.

Place the file at `public/env/hero.hdr`.

- [ ] **Step 2: Verify size**

```bash
ls -lh public/env/hero.hdr
```

Expected: file size ≤ 200KB. If larger, downscale or pick a different HDR.

- [ ] **Step 3: Commit**

```bash
git add public/env/hero.hdr
git commit -m "$(cat <<'EOF'
chore(assets): add hero scene HDR environment

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: HeroSphere scaffold — Canvas + environment + placeholder mesh

**Files:**
- Create: `src/components/hero/HeroSphere.tsx`

- [ ] **Step 1: Create the scaffold**

Create `src/components/hero/HeroSphere.tsx`:

```tsx
"use client";
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense } from 'react';

export default function HeroSphere() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <Environment files="/env/hero.hdr" />
          <ambientLight intensity={0.15} />
          <directionalLight position={[2, 2, 2]} intensity={0.6} color="#6FB6FF" />
          <mesh>
            <icosahedronGeometry args={[1, 4]} />
            <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.12} />
          </mesh>
        </Suspense>
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 2: Temporarily mount it instead of HeroAmbient**

In `src/components/hero/Hero.tsx`, replace the `dynamic(() => import('./HeroAmbient'), …)` line with:

```tsx
const HeroSphere = dynamic(() => import('./HeroSphere'), { ssr: false });
```

And replace `<HeroAmbient />` with `<HeroSphere />`. Leave the mobile branch on `HeroAmbientMobile` for now.

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected: a single chrome icosphere visible in the hero, lit by the HDR. If the sphere is matte or black, the HDR isn't loading — check the network tab and the `public/env/hero.hdr` path.

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/HeroSphere.tsx src/components/hero/Hero.tsx
git commit -m "$(cat <<'EOF'
feat(hero): scaffold HeroSphere — Canvas, HDR env, placeholder chrome mesh

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: HeroSphere — instanced particle geometry (rest state only)

**Files:**
- Modify: `src/components/hero/HeroSphere.tsx`

- [ ] **Step 1: Replace the placeholder with an instanced particle field**

Replace `src/components/hero/HeroSphere.tsx` with:

```tsx
"use client";
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';

const INSTANCE_COUNT = 4000;
const SPHERE_RADIUS = 1.0;
const PARTICLE_RADIUS = 0.022;

function makeFibonacciSphere(count: number, radius: number): Float32Array {
  const out = new Float32Array(count * 3);
  const phi = Math.PI * (Math.sqrt(5) - 1);
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    out[i * 3 + 0] = Math.cos(theta) * r * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return out;
}

function gaussian(): number {
  // Box-Muller
  const u = Math.max(Math.random(), 1e-7);
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeExplodeField(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    out[i * 3 + 0] = gaussian() * 6.0; // wide on X
    out[i * 3 + 1] = gaussian() * 2.5; // narrow on Y
    out[i * 3 + 2] = gaussian() * 3.0; // medium on Z
  }
  return out;
}

function makeSeeds(count: number): Float32Array {
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) out[i] = Math.random() * 1000;
  return out;
}

function ParticleSphere() {
  const geometry = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(PARTICLE_RADIUS, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = ico.index;
    geo.attributes.position = ico.attributes.position;
    geo.attributes.normal = ico.attributes.normal;
    geo.attributes.uv = ico.attributes.uv;
    geo.setAttribute(
      'aRestPos',
      new THREE.InstancedBufferAttribute(makeFibonacciSphere(INSTANCE_COUNT, SPHERE_RADIUS), 3),
    );
    geo.setAttribute(
      'aExplodePos',
      new THREE.InstancedBufferAttribute(makeExplodeField(INSTANCE_COUNT), 3),
    );
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(makeSeeds(INSTANCE_COUNT), 1));
    geo.instanceCount = INSTANCE_COUNT;
    return geo;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      metalness: 1.0,
      roughness: 0.12,
    });
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `
          #include <common>
          attribute vec3 aRestPos;
          attribute vec3 aExplodePos;
          attribute float aSeed;
          `,
        )
        .replace(
          '#include <begin_vertex>',
          `
          vec3 transformed = position + aRestPos;
          `,
        );
    };
    return mat;
  }, []);

  return <mesh geometry={geometry} material={material} />;
}

export default function HeroSphere() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <Environment files="/env/hero.hdr" />
          <ambientLight intensity={0.15} />
          <directionalLight position={[2, 2, 2]} intensity={0.6} color="#6FB6FF" />
          <ParticleSphere />
        </Suspense>
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Expected: ~4,000 small chrome droplets densely packed into a sphere shape, lit by the HDR + the icy directional light. The sphere should look continuous from a distance and break into individual droplets up close. If the droplets look too sparse, raise `INSTANCE_COUNT` or `PARTICLE_RADIUS`. If the sphere is dim, brighten the directional light intensity.

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/HeroSphere.tsx
git commit -m "$(cat <<'EOF'
feat(hero): build instanced particle sphere — rest state only

Fibonacci-distributed icosphere particles, chrome material, anisotropic
explode field generated but not yet wired to scroll.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: HeroSphere — uExplode uniform + GPU-side lerp

**Files:**
- Modify: `src/components/hero/HeroSphere.tsx`

- [ ] **Step 1: Patch the material to read uExplode**

In `src/components/hero/HeroSphere.tsx`, replace the `material = useMemo(...)` block inside `ParticleSphere` with:

```tsx
const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
const shaderRef = useRef<{ uniforms: { uExplode: { value: number }; uTime: { value: number } } } | null>(null);

const material = useMemo(() => {
  const mat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    metalness: 1.0,
    roughness: 0.12,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uExplode = { value: 0 };
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `
        #include <common>
        uniform float uExplode;
        uniform float uTime;
        attribute vec3 aRestPos;
        attribute vec3 aExplodePos;
        attribute float aSeed;

        float easeOutQuart(float x) {
          return 1.0 - pow(1.0 - x, 4.0);
        }

        vec3 hashJitter(float seed, float t) {
          return vec3(
            sin(seed * 12.9898 + t * 0.6),
            sin(seed * 78.233  + t * 0.4),
            sin(seed * 37.719  + t * 0.5)
          ) * 0.05;
        }
        `,
      )
      .replace(
        '#include <begin_vertex>',
        `
        float t = easeOutQuart(uExplode);
        vec3 instanceCenter = mix(aRestPos, aExplodePos, t) + hashJitter(aSeed, uTime) * uExplode;
        vec3 transformed = position + instanceCenter;
        `,
      );
    shaderRef.current = shader as unknown as typeof shaderRef.current extends infer T ? T : never;
  };
  materialRef.current = mat;
  return mat;
}, []);
```

You'll need to add `useRef` to the imports:

```tsx
import { Suspense, useMemo, useRef } from 'react';
```

- [ ] **Step 2: Add a temporary slider to verify the lerp**

Inside `ParticleSphere`, just before `return <mesh … />`, add a `useFrame` import and a debug oscillator:

```tsx
import { useFrame } from '@react-three/fiber';
```

Inside the component:

```tsx
useFrame((state) => {
  const s = shaderRef.current;
  if (!s) return;
  s.uniforms.uTime.value = state.clock.getElapsedTime();
  // DEBUG: oscillate uExplode 0..1..0 to verify the lerp.
  s.uniforms.uExplode.value =
    (Math.sin(state.clock.getElapsedTime() * 0.5) + 1) * 0.5;
});
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected: the sphere visibly explodes apart and reforms on a slow loop. Particles fly outward into a horizontal-spread cloud (image 2) and back. If the explode is too tight, tighten the gaussian multipliers; too dispersed, loosen them.

- [ ] **Step 4: Remove the debug oscillator**

Replace the `useFrame` body with:

```tsx
useFrame((state) => {
  const s = shaderRef.current;
  if (!s) return;
  s.uniforms.uTime.value = state.clock.getElapsedTime();
  // uExplode is wired to scroll in Task 10.
});
```

- [ ] **Step 5: Commit**

```bash
git add src/components/hero/HeroSphere.tsx
git commit -m "$(cat <<'EOF'
feat(hero): wire uExplode uniform with GPU-side ease-out-quart lerp

Vertex shader patched to mix rest/explode positions plus per-particle
jitter. uExplode pinned at 0 until scroll wiring lands.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: HeroSphere — fresnel rim + slow Y rotation

**Files:**
- Modify: `src/components/hero/HeroSphere.tsx`

- [ ] **Step 1: Add a fresnel term to the fragment shader**

Inside the `mat.onBeforeCompile` block in `ParticleSphere`, after the vertex shader replacements, add:

```tsx
shader.uniforms.uAccent = { value: new THREE.Color('#6FB6FF') };
shader.fragmentShader = shader.fragmentShader
  .replace(
    '#include <common>',
    `
    #include <common>
    uniform vec3 uAccent;
    `,
  )
  .replace(
    '#include <output_fragment>',
    `
    #include <output_fragment>
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0), 3.0);
    gl_FragColor.rgb += uAccent * fresnel * 0.55;
    `,
  );
```

(`vViewPosition` and `vNormal` are already declared by `MeshStandardMaterial` — no extra varying needed.)

- [ ] **Step 2: Add slow Y rotation with explode-damping**

Wrap the `<mesh>` in a `<group ref={groupRef}>` and add rotation logic:

```tsx
const groupRef = useRef<THREE.Group | null>(null);

useFrame((state, delta) => {
  const s = shaderRef.current;
  if (!s) return;
  s.uniforms.uTime.value = state.clock.getElapsedTime();
  const explode = s.uniforms.uExplode.value;
  if (groupRef.current) {
    const rotationSpeed = 0.05 * Math.max(0, 1 - explode / 0.15);
    groupRef.current.rotation.y += rotationSpeed * delta;
  }
});

// In return:
return (
  <group ref={groupRef}>
    <mesh geometry={geometry} material={material} />
  </group>
);
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected: the chrome sphere now glows with an icy-blue rim around its silhouette. The whole sphere rotates slowly on Y. (Rotation will dampen during explode once scroll wiring lands; right now `uExplode` is 0 so rotation is at full speed.)

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/HeroSphere.tsx
git commit -m "$(cat <<'EOF'
feat(hero): add fresnel rim + slow Y rotation to sphere

Fragment shader patch adds icy-blue silhouette glow. Group rotation
dampens as explode rises (frozen blast effect).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: HeroSphere — ambient floating droplet field

**Files:**
- Modify: `src/components/hero/HeroSphere.tsx`

- [ ] **Step 1: Add a second instanced mesh for ambient droplets**

In `src/components/hero/HeroSphere.tsx`, add a sibling component below `ParticleSphere`:

```tsx
const AMBIENT_COUNT = 250;
const AMBIENT_RADIUS = 0.014;
const AMBIENT_SPREAD = 3.5;

function AmbientDroplets() {
  const ref = useRef<THREE.InstancedMesh | null>(null);
  const seeds = useMemo(() => makeSeeds(AMBIENT_COUNT), []);
  const basePositions = useMemo(() => {
    const arr = new Float32Array(AMBIENT_COUNT * 3);
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 2 * AMBIENT_SPREAD;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 2 * AMBIENT_SPREAD;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2 * AMBIENT_SPREAD * 0.6;
    }
    return arr;
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const seed = seeds[i];
      const x = basePositions[i * 3 + 0] + Math.sin(t * 0.12 + seed) * 0.05;
      const y = basePositions[i * 3 + 1] + Math.cos(t * 0.10 + seed * 1.3) * 0.05;
      const z = basePositions[i * 3 + 2] + Math.sin(t * 0.08 + seed * 0.7) * 0.05;
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, AMBIENT_COUNT]}>
      <icosahedronGeometry args={[AMBIENT_RADIUS, 0]} />
      <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.2} />
    </instancedMesh>
  );
}
```

- [ ] **Step 2: Mount it in the scene**

In `HeroSphere`'s return, add `<AmbientDroplets />` next to `<ParticleSphere />`:

```tsx
<ParticleSphere />
<AmbientDroplets />
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected: the central sphere is now surrounded by a subtle field of slowly drifting chrome droplets (matches the floaters in image 1 and the surrounding haze in image 2).

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/HeroSphere.tsx
git commit -m "$(cat <<'EOF'
feat(hero): add ambient floating droplet field around sphere

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Scroll wiring — useScroll → uExplode

**Files:**
- Modify: `src/components/hero/Hero.tsx`
- Modify: `src/components/hero/HeroSphere.tsx`

- [ ] **Step 1: Hand a MotionValue down from Hero.tsx**

Replace `src/components/hero/Hero.tsx` with:

```tsx
"use client";
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useScroll } from 'framer-motion';
import { HeroText } from './HeroText';
import { HeroChrome } from './HeroChrome';
import { HeroBanner } from './HeroBanner';

const HeroSphere = dynamic(() => import('./HeroSphere'), { ssr: false });
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
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  return (
    <section
      ref={ref}
      className="relative h-[100svh] w-full overflow-hidden bg-[var(--bg)]"
    >
      {isMobile ? <HeroAmbientMobile /> : <HeroSphere progress={scrollYProgress} />}
      <HeroText name="Keaton Jones" title="Software Engineer" />
      <HeroChrome />
      <HeroBanner />
    </section>
  );
}
```

- [ ] **Step 2: Read the MotionValue inside HeroSphere**

In `src/components/hero/HeroSphere.tsx`:

1. Update the imports:

```tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { MotionValue } from 'framer-motion';
```

2. Change the component signature:

```tsx
export default function HeroSphere({ progress }: { progress: MotionValue<number> }) {
```

3. Pass `progress` down to `ParticleSphere`:

```tsx
<ParticleSphere progress={progress} />
```

4. Update `ParticleSphere`'s signature and `useFrame`:

```tsx
function ParticleSphere({ progress }: { progress: MotionValue<number> }) {
  // … existing useMemo / refs …

  useFrame((state, delta) => {
    const s = shaderRef.current;
    if (!s) return;
    s.uniforms.uTime.value = state.clock.getElapsedTime();
    s.uniforms.uExplode.value = progress.get();
    if (groupRef.current) {
      const rotationSpeed = 0.05 * Math.max(0, 1 - progress.get() / 0.15);
      groupRef.current.rotation.y += rotationSpeed * delta;
    }
  });
```

- [ ] **Step 3: Honor reduced motion**

At the top of `ParticleSphere`, before any `useFrame` hooks, add:

```tsx
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';
// …
const reduced = useSiteReducedMotion();
```

Inside `useFrame`, short-circuit if `reduced` is true:

```tsx
useFrame((state, delta) => {
  const s = shaderRef.current;
  if (!s) return;
  s.uniforms.uTime.value = state.clock.getElapsedTime();
  if (reduced) {
    s.uniforms.uExplode.value = 0;
    return;
  }
  s.uniforms.uExplode.value = progress.get();
  if (groupRef.current) {
    const rotationSpeed = 0.05 * Math.max(0, 1 - progress.get() / 0.15);
    groupRef.current.rotation.y += rotationSpeed * delta;
  }
});
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Expected:
- At top of page: chrome sphere intact, slowly rotating.
- Scroll halfway down hero: sphere is mid-explode, particles spreading horizontally.
- Scroll to the bottom of the hero: full horizontal explode (matches image 2).
- Scroll back up: particles smoothly reform back into the sphere.
- Toggle "reduce motion" in DevTools rendering panel: rotation stops, sphere stays whole regardless of scroll.

- [ ] **Step 5: Commit**

```bash
git add src/components/hero/Hero.tsx src/components/hero/HeroSphere.tsx
git commit -m "$(cat <<'EOF'
feat(hero): wire scroll progress to uExplode (1:1, reversible)

useScroll on the hero section produces a MotionValue read directly
inside useFrame and written to the shader uniform. Reduced motion
freezes uExplode at 0.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: HeroSphereMobile — reduced-density variant

**Files:**
- Create: `src/components/hero/HeroSphereMobile.tsx`

- [ ] **Step 1: Create the mobile variant**

Create `src/components/hero/HeroSphereMobile.tsx` by copying the desktop file and lowering counts:

```tsx
"use client";
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { MotionValue } from 'framer-motion';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';

const INSTANCE_COUNT = 800;
const SPHERE_RADIUS = 1.0;
const PARTICLE_RADIUS = 0.038;
const AMBIENT_COUNT = 80;
const AMBIENT_RADIUS = 0.022;
const AMBIENT_SPREAD = 3.0;

// makeFibonacciSphere, gaussian, makeExplodeField, makeSeeds:
// Identical to HeroSphere.tsx — copy the four helper functions verbatim.
// (Repeated here intentionally; do not extract a shared util in this task.)

function makeFibonacciSphere(count: number, radius: number): Float32Array {
  const out = new Float32Array(count * 3);
  const phi = Math.PI * (Math.sqrt(5) - 1);
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    out[i * 3 + 0] = Math.cos(theta) * r * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return out;
}

function gaussian(): number {
  const u = Math.max(Math.random(), 1e-7);
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeExplodeField(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    out[i * 3 + 0] = gaussian() * 6.0;
    out[i * 3 + 1] = gaussian() * 2.5;
    out[i * 3 + 2] = gaussian() * 3.0;
  }
  return out;
}

function makeSeeds(count: number): Float32Array {
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) out[i] = Math.random() * 1000;
  return out;
}

function ParticleSphere({ progress }: { progress: MotionValue<number> }) {
  const reduced = useSiteReducedMotion();
  const shaderRef = useRef<{ uniforms: { uExplode: { value: number }; uTime: { value: number } } } | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  const geometry = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(PARTICLE_RADIUS, 0);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = ico.index;
    geo.attributes.position = ico.attributes.position;
    geo.attributes.normal = ico.attributes.normal;
    geo.attributes.uv = ico.attributes.uv;
    geo.setAttribute(
      'aRestPos',
      new THREE.InstancedBufferAttribute(makeFibonacciSphere(INSTANCE_COUNT, SPHERE_RADIUS), 3),
    );
    geo.setAttribute(
      'aExplodePos',
      new THREE.InstancedBufferAttribute(makeExplodeField(INSTANCE_COUNT), 3),
    );
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(makeSeeds(INSTANCE_COUNT), 1));
    geo.instanceCount = INSTANCE_COUNT;
    return geo;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      metalness: 1.0,
      roughness: 0.2,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uExplode = { value: 0 };
      shader.uniforms.uTime = { value: 0 };
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `
          #include <common>
          uniform float uExplode;
          uniform float uTime;
          attribute vec3 aRestPos;
          attribute vec3 aExplodePos;
          attribute float aSeed;

          float easeOutQuart(float x) { return 1.0 - pow(1.0 - x, 4.0); }
          vec3 hashJitter(float seed, float t) {
            return vec3(
              sin(seed * 12.9898 + t * 0.6),
              sin(seed * 78.233  + t * 0.4),
              sin(seed * 37.719  + t * 0.5)
            ) * 0.05;
          }
          `,
        )
        .replace(
          '#include <begin_vertex>',
          `
          float t = easeOutQuart(uExplode);
          vec3 instanceCenter = mix(aRestPos, aExplodePos, t) + hashJitter(aSeed, uTime) * uExplode;
          vec3 transformed = position + instanceCenter;
          `,
        );
      // No fresnel patch on mobile — env reflections carry the chrome look.
      shaderRef.current = shader as unknown as typeof shaderRef.current extends infer T ? T : never;
    };
    return mat;
  }, []);

  useFrame((state, delta) => {
    const s = shaderRef.current;
    if (!s) return;
    s.uniforms.uTime.value = state.clock.getElapsedTime();
    if (reduced) {
      s.uniforms.uExplode.value = 0;
      return;
    }
    s.uniforms.uExplode.value = progress.get();
    if (groupRef.current) {
      const rotationSpeed = 0.05 * Math.max(0, 1 - progress.get() / 0.15);
      groupRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}

function AmbientDroplets() {
  const ref = useRef<THREE.InstancedMesh | null>(null);
  const seeds = useMemo(() => makeSeeds(AMBIENT_COUNT), []);
  const basePositions = useMemo(() => {
    const arr = new Float32Array(AMBIENT_COUNT * 3);
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 2 * AMBIENT_SPREAD;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 2 * AMBIENT_SPREAD;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2 * AMBIENT_SPREAD * 0.6;
    }
    return arr;
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const seed = seeds[i];
      const x = basePositions[i * 3 + 0] + Math.sin(t * 0.12 + seed) * 0.05;
      const y = basePositions[i * 3 + 1] + Math.cos(t * 0.10 + seed * 1.3) * 0.05;
      const z = basePositions[i * 3 + 2] + Math.sin(t * 0.08 + seed * 0.7) * 0.05;
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, AMBIENT_COUNT]}>
      <icosahedronGeometry args={[AMBIENT_RADIUS, 0]} />
      <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.25} />
    </instancedMesh>
  );
}

export default function HeroSphereMobile({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.25]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <Environment files="/env/hero.hdr" />
          <ambientLight intensity={0.15} />
          <directionalLight position={[2, 2, 2]} intensity={0.6} color="#6FB6FF" />
          <ParticleSphere progress={progress} />
          <AmbientDroplets />
        </Suspense>
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 2: Commit (without wiring yet)**

```bash
git add src/components/hero/HeroSphereMobile.tsx
git commit -m "$(cat <<'EOF'
feat(hero): add HeroSphereMobile — lower density, no fresnel patch

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Wire mobile selection in Hero.tsx

**Files:**
- Modify: `src/components/hero/Hero.tsx`

- [ ] **Step 1: Replace HeroAmbientMobile with HeroSphereMobile**

In `src/components/hero/Hero.tsx`, replace:

```tsx
const HeroAmbientMobile = dynamic(() => import('./HeroAmbientMobile'), { ssr: false });
```

with:

```tsx
const HeroSphereMobile = dynamic(() => import('./HeroSphereMobile'), { ssr: false });
```

And replace the JSX:

```tsx
{isMobile ? <HeroAmbientMobile /> : <HeroSphere progress={scrollYProgress} />}
```

with:

```tsx
{isMobile ? (
  <HeroSphereMobile progress={scrollYProgress} />
) : (
  <HeroSphere progress={scrollYProgress} />
)}
```

- [ ] **Step 2: Verify on a mobile profile**

```bash
npm run dev
```

In Chrome DevTools, toggle the mobile device emulator (e.g., iPhone 12). Throttle CPU to 4× slowdown. Reload.

Expected:
- The mobile sphere renders at lower density than desktop.
- Scroll-explode/reform behavior is identical.
- Frame rate stays at 30fps+ during scroll.

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/Hero.tsx
git commit -m "$(cat <<'EOF'
feat(hero): wire HeroSphereMobile in place of HeroAmbientMobile

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Delete HeroAmbient + HeroAmbientMobile

**Files:**
- Delete: `src/components/hero/HeroAmbient.tsx`
- Delete: `src/components/hero/HeroAmbientMobile.tsx`

- [ ] **Step 1: Verify no remaining imports**

```bash
grep -rn "HeroAmbient" src
```

Expected: no output.

- [ ] **Step 2: Delete the files**

```bash
rm src/components/hero/HeroAmbient.tsx src/components/hero/HeroAmbientMobile.tsx
```

- [ ] **Step 3: Lint + build**

```bash
npm run lint && npm run build
```

Expected: both succeed with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/
git commit -m "$(cat <<'EOF'
refactor(hero): remove HeroAmbient/HeroAmbientMobile — replaced by sphere

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Polish + QA pass

**Files:** none (verification only).

- [ ] **Step 1: Run all tests**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 2: Lint + build**

```bash
npm run lint && npm run build
```

Expected: both succeed clean.

- [ ] **Step 3: Spawn the qa agent**

In Claude Code:

```
@agent-qa Run a full QA pass on the site-redesign branch: build, typecheck, lint, UI smoke test of the hero scroll-explode and banner sticky behavior, accessibility check on hero, and a Lighthouse perf check on a mobile profile. Report evidence — show command output and screenshots if you have them.
```

Expected: clean reports across the board. Address any HIGH/CRITICAL findings; defer MEDIUM/LOW.

- [ ] **Step 4: Manual sweep for stray light-palette assumptions**

```bash
npm run dev
```

Open the site, scroll every section, look for any block of color that reads as "leftover from the cream palette." Common suspects: card backgrounds, button hover states, image overlays. Fix in place by replacing hex literals with tokens (`var(--bg-elev)`, `var(--accent)`, etc.).

- [ ] **Step 5: Run the `taste` skill on the hero**

In Claude Code:

```
/skill taste
```

Submit the hero (sphere + banner) for a taste check. The reference is the user's two screenshots — chrome sphere with floating droplets at rest, horizontal exploded particle spray at scroll-end. Address any flagged issues.

- [ ] **Step 6: Final commit if any tweaks were needed**

```bash
git status
```

If clean: done. If there are tweaks from steps 4 or 5:

```bash
git add -A
git commit -m "$(cat <<'EOF'
polish(hero): final tuning from QA + taste pass

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review checklist (filled out before handoff)

**1. Spec coverage.** Walked the spec section-by-section:
- Architecture/file layout → Tasks 1–14.
- HeroSphere internals (instancing, attributes, shader, chrome look, ambient field, rotation, scene setup) → Tasks 6–10.
- HeroSphereMobile differences → Task 12.
- HeroBanner (sticky pinning, single-row right-to-left, hairlines, backdrop blur, edge mask, hover-pause, reduced-motion fallback) → Task 2.
- Scroll wiring (`useScroll` → `MotionValue.get()` → uniform, ease in shader, reverse free, reduced motion) → Task 11.
- Palette flip (tokens + sweep) → Task 1.
- Build sequence (palette → banner → sphere → mobile → cleanup → QA) → Task ordering matches spec.
- Performance budget → Task 15 step 3 (qa agent runs Lighthouse).
- Accessibility (`aria-hidden`, real DOM banner, focus styles, prefers-reduced-motion) → wired in Tasks 2, 6, 11; verified in Task 15.
- Testing & verification → Tasks 2, 3, 4, 14, 15.

No gaps.

**2. Placeholder scan.** No "TBD", "TODO", or "implement later" tokens. Every code step has complete code; helper functions in the mobile variant are repeated verbatim (intentional — see Task 12 note — to keep tasks self-contained).

**3. Type consistency.** `MotionValue<number>` prop is named `progress` in both `HeroSphere` and `HeroSphereMobile`. Shader uniform names (`uExplode`, `uTime`, `uAccent`) match across desktop and mobile. Helper function names (`makeFibonacciSphere`, `gaussian`, `makeExplodeField`, `makeSeeds`) match across both files. The shader-ref typing pattern is the same in both files.
