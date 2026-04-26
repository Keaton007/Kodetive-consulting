# Hero sphere + sticky skills banner — design

**Date:** 2026-04-25
**Branch:** site-redesign
**Status:** Draft → ready for user review

## Goal

Replace the current ambient threads hero with a 3D metallic, icy-blue chrome sphere that:

1. Slowly rotates at rest, reading like a continuous chrome skin built from many small reflective droplets.
2. Explodes apart into a horizontal particle spray as the user scrolls down the hero, and reforms into the sphere as they scroll back up — scroll-locked, 1:1, fully reversible.

Concurrently, the existing two-row skills marquee is replaced by a single-row right-to-left ticker that is sticky-pinned to the bottom of the hero, acting as the seam between the dark hero and the rest of the site. The whole site palette flips to dark + icy-blue to match the references.

Reference images: a chrome liquid sphere with floating droplets (rest state) and a horizontal exploded particle field (scroll-end state). The two states are the same particles in two configurations — not two systems crossfading.

## Decisions (locked during brainstorming)

- **Palette:** flip the whole site to dark + icy-blue. (Option B in brainstorm.)
- **Scroll mapping:** scroll-locked 1:1, reversible, no thresholds, no easing in JS. (Option A.)
- **Banner:** single-row right-to-left ticker, sticky-pinned to the bottom of the hero. (Option B.)
- **Mobile:** reduced-fidelity sphere (same approach, lower particle count). No static fallback ladder. (Option A.)
- **Sphere implementation:** GPU-instanced particle sphere — one set of particles holds both rest and explode positions; a single uniform lerps between them. (Approach 1.)

## Architecture

### File layout

**New**
- `src/components/hero/HeroSphere.tsx` — desktop R3F scene.
- `src/components/hero/HeroSphereMobile.tsx` — mobile variant of the same scene.
- `src/components/hero/HeroBanner.tsx` — sticky-pinned single-row ticker.

**Modified**
- `src/components/hero/Hero.tsx` — picks desktop vs mobile sphere, mounts `HeroBanner` inside the section so the sticky pin is scoped to the hero, exposes a scroll progress ref to the sphere.
- `src/app/page.tsx` — removes the standalone `<SkillsMarquee />` render.
- `src/app/globals.css` — palette tokens flipped to dark + icy-blue.

**Deleted**
- `src/components/hero/HeroAmbient.tsx`
- `src/components/hero/HeroAmbientMobile.tsx`
- `src/components/skills/SkillsMarquee.tsx`
- `src/components/skills/SkillsMarquee.test.tsx`

**Untouched**
- `src/components/hero/HeroText.tsx`, `HeroChrome.tsx`
- `src/components/skills/skills.ts` (data file — reused by `HeroBanner`)
- All non-hero sections (`work/`, `about/`, `contact/`) — re-skin via tokens; any hard-coded colors caught by sweep.

## Components

### `HeroSphere` (desktop)

**Geometry & instancing.** `THREE.InstancedMesh` with a low-poly icosphere (detail=1, ~42 verts) as per-instance geometry. ~4,000 instances. Per-instance attributes:

- `aRestPos` — Fibonacci-sphere distribution on radius 1.
- `aExplodePos` — gaussian-distributed in an anisotropic field, scaled ~6× on X, ~2.5× on Y, ~3× on Z. Matches the horizontal spray in the explode reference.
- `aSeed` — per-particle phase, used for jitter and per-particle rotation.

**Shader.** `MeshStandardMaterial` patched via `onBeforeCompile`, or a custom `ShaderMaterial` extending physical lighting. Uniforms:

- `uExplode` (float, 0..1) — scroll-driven.
- `uTime` (float).

Vertex shader logic:

```
float t = easeOutQuart(uExplode);
vec3 pos = mix(aRestPos, aExplodePos, t) + jitter(aSeed, uTime) * t;
```

The easing lives in the vertex shader so the curve applies uniformly without a JS hop. Each instance also rotates around its own seed-derived axis, kept tiny (~5° max) so particles read as droplets, not spinning shapes.

**Chrome look.**
- `metalness = 1.0`, `roughness = 0.12`.
- Drei `<Environment>` with a packaged HDR (e.g., `night` preset or a custom dark-studio map ≤200KB).
- Directional rim light at +45° azimuth, tinted icy-blue (`var(--accent)`) — produces the cool edge visible on the rest sphere.
- Fresnel term added in the patched shader, brightening silhouette edges with the same icy-blue tone — reads as a glowing rim at both rest and explode peak.

**Ambient droplet field.** Second sparser `InstancedMesh`, ~250 droplets on desktop. Slow noise-driven drift, always present, unaffected by `uExplode`. These are the small floaters around the sphere in image 1 and the wider haze in image 2.

**Rotation.** Whole `<group>` slowly rotates on Y at ~0.05 rad/s when `uExplode < 0.15`; rotation speed dampens to 0 as `uExplode` rises so the explode reads as a frozen blast, not a swirl.

**Scene setup.**
- `<Canvas dpr={[1, 1.75]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} camera={{ position: [0, 0, 3.2], fov: 45 }} frameloop="always" />`
- Transparent background; the hero `<section>` bg shows through.

### `HeroSphereMobile`

Same scene, same component shape. Differences:

- ~800 instances (vs 4,000).
- ~80 ambient droplets (vs 250).
- Per-instance icosphere detail=0 (~12 verts).
- `MeshStandardMaterial` with `roughness = 0.2`, no fresnel patch — env reflections alone carry the chrome look.
- Smaller HDR (≤80KB) or procedural cube-camera fallback if size matters more than fidelity.
- `dpr={[1, 1.25]}`.
- `frameloop="always"` retained — scroll-locked needs continuous frames.

Estimated mobile bundle addition: ~120KB gzipped.

### `HeroBanner` (sticky ticker)

**Structure.** `<div>` inside the hero `<section>`. The hero is `position: relative; height: 100svh; overflow: hidden`. Banner is `position: sticky; bottom: 0; left: 0; right: 0; z-index: 10`. Sticky-bottom keeps the banner glued to the viewport bottom while the hero is in view, then releases naturally as the hero exits. No JS scroll listeners.

**Layout.**
- Height: `--banner-h: 60px` desktop, `52px` mobile.
- Top + bottom hairline: `border-top/bottom: 1px solid var(--rule)`.
- Background: `color-mix(in oklab, var(--bg) 80%, transparent)` with `backdrop-filter: blur(8px)`. Lets the sphere's particles read faintly through it as they explode "into" the banner.
- `overflow: hidden`.

**Content.** Concatenate `CORE` + `PLATFORM` from `skills.ts` into one ordered array. Render with the existing chip pattern (icon + label, 12px mono, uppercase, `0.15em` tracking, height 40px). Tripled inline (`[...items, ...items, ...items]`) inside a `motion.div` animating `x: ['0%', '-33.333%']` linearly over 40s, infinite. Single direction: right-to-left only. Gap 24px between chips.

**Edge fades.** ~80px gradient masks on left and right via `mask-image: linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)`. Chips fade in/out at the edges instead of clipping hard.

**Hover.** Pause the marquee while pointer is over the strip. Implemented by toggling the `animate` prop on the `motion.div` (or by keeping `animate` constant and stopping the value via a Framer controls pattern — pick whichever produces no jump on resume).

**Reduced motion.** Static wrapped grid of chips inside the banner strip when `useSiteReducedMotion()` returns true. Existing pattern from `SkillsMarquee.tsx` ports over.

## Scroll wiring

- `Hero.tsx` attaches a `ref` to the hero `<section>` and calls `useScroll({ target: heroRef, offset: ["start start", "end start"] })`. Result: a `MotionValue<number>` going 0 → 1 across the full hero height.
- The `MotionValue` (or a plain `useRef<number>` updated from a subscriber) is passed down to the sphere component.
- Inside the R3F scene, a `useFrame` callback reads the current value and writes it to `material.uniforms.uExplode.value` directly. No React state in the loop.
- `easeOutQuart` is applied inside the vertex shader, not in JS. Reverse is free — same lerp, run backward.
- Reduced motion: `uExplode` is locked at 0, rotation frozen, ambient droplets static. Scene still renders, GPU loop is short-circuited.

## Palette flip

New `globals.css` `:root` block:

```css
:root {
  --bg: #07090C;              /* deep cool near-black */
  --bg-elev: #0F141B;         /* elevated surface */
  --fg: #E6EDF5;              /* pale cool */
  --fg-muted: #8A95A4;        /* cool mid-gray */
  --accent: #6FB6FF;          /* icy blue — primary */
  --accent-hot: #B8DEFF;      /* lighter icy blue — hover/active */
  --rule: rgba(230, 237, 245, 0.10);
}
```

Contrast (WCAG):
- `fg` on `bg` ≈ 17:1 (AAA).
- `fg-muted` on `bg` ≈ 7.2:1 (AA+).
- `accent` on `bg` ≈ 9.5:1 (safe for both text and UI).

**Sweep checklist (during implementation).**
- `grep -rn "rgba\|#[0-9A-Fa-f]\{3,6\}" src/components` — migrate any remaining hex/rgba literals to tokens.
- Hero shaders read `--bg`/`--accent` via JS — being deleted.
- Resume page (`src/app/resume/`) and case study pages — token-driven per recent commits, but manual scroll-through after the flip.
- Selection (`::selection`), focus ring, skip link — already token-driven.

**Out of scope:** OG image tuning, favicon (binary `.ico`).

## Build sequence

1. **Palette flip** + sweep. Verify the live site reads correctly on dark.
2. **`HeroBanner`** + remove `<SkillsMarquee />` from `page.tsx`, delete old marquee files. Verify sticky-bottom behavior, ticker direction, hover pause, reduced-motion grid.
3. **`HeroSphere` (desktop)** + scroll wiring. Verify chrome at rest, smooth explode 1:1 with scroll, reverse, reduced-motion freeze.
4. **`HeroSphereMobile`** with reduced density. Verify on real phone or throttled DevTools.
5. **Delete `HeroAmbient.tsx` + `HeroAmbientMobile.tsx`.**
6. **Polish + QA.** `npm run lint && npm run build` clean. Spawn `qa` agent. Lighthouse on mobile profile (LCP < 2.5s, no CLS regression). Walk all sections for stray light-palette assumptions. `taste` skill check on the final hero.

## Performance budget

- Desktop sphere: ~4,000 instanced low-poly icospheres + ~250 ambient droplets, single shader patch, env HDR ≤200KB. Target 60fps during scroll-explode on a 2020-era integrated GPU.
- Mobile sphere: ~800 instances + ~80 droplets, simpler material, env HDR ≤80KB. Target 30fps+ during scroll on a mid-range Android.
- Initial bundle: HeroSphere modules behind `next/dynamic({ ssr: false })`, same pattern as today's `HeroAmbient`. No SSR cost, deferred from initial JS payload.
- LCP: hero text is HTML and renders before the canvas paints; sphere is decorative (`aria-hidden="true"`). LCP element should remain the hero heading.

## Accessibility

- All sphere meshes inside `<div aria-hidden="true">` — decorative, not announced.
- Hero text and banner content are real DOM, reachable by screen readers and keyboard. Ticker chips: render as `<ul>/<li>` (existing pattern).
- Focus styles use the existing `:focus-visible` rule, which now sits against a dark bg — the rule itself is unchanged but the contrast was verified above.
- `prefers-reduced-motion` is honored across sphere, ticker, and (via existing global rule) all CSS transitions.
- Keyboard nav: ticker pause-on-hover does not block keyboard users; chips are not interactive (no links), so focus traversal is unchanged.

## Testing & verification

- **Build/typecheck/lint:** `npm run lint && npm run build` must pass clean.
- **Unit tests:** `SkillsMarquee.test.tsx` is being deleted with the component. If `HeroBanner` warrants a test (mainly: data ordering, reduced-motion fallback render), add one alongside the new file.
- **`qa` agent:** run before claiming done. Reports build/typecheck/lint + UI smoke + accessibility checks.
- **Manual:** scroll the hero up and down on desktop and mobile; confirm explode tracks scroll smoothly, reform is clean, no jank, no flash of unstyled chrome. Test with reduced-motion ON.
- **Lighthouse:** mobile profile run; confirm LCP, CLS, INP are within budget.
- **`taste` skill:** final pass on the hero before merging.

## Out of scope (follow-ups, not blocking this spec)

- Custom-authored HDR environment tuned for this scene.
- Cursor/pointer-reactive parallax on the sphere.
- New OG image rendered against the dark palette.
- Backporting the icy-blue treatment to anywhere the previous forest-green palette was visually load-bearing (e.g., hover treatments that read as "warm gold" — they now read as "icy blue," which is intentional, but worth one editorial pass).
