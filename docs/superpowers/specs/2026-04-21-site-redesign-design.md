# Kodetive Consulting — Site Redesign

**Date:** 2026-04-21
**Owner:** Keaton Jones
**Status:** Approved design — ready for implementation plan

## 1. Goal & positioning

Redesign the personal site into a hire-me portfolio for **engineering leaders evaluating Keaton as a hiring candidate**. Hero optimized for job opportunities. Tone is **hybrid cinematic-but-restrained**: a bold hero moment that resolves quickly into a content-dense, editorial portfolio. The design itself must signal senior frontend craft without reading as marketing.

**Primary visitor:** engineering manager / director / staff engineer at a product company.
**Success:** visitor reaches the Contact section, clicks email/LinkedIn, and leaves with a clear impression of craft + shipped work.

## 2. Information architecture

```
/                         Home — Hero → Work → About → Skills marquee → Contact
/work/shredder            Case study (in progress, 2026)
/work/stat-ai             Case study
/work/unit-converter      Case study
/resume                   Existing route, light restyle to match new system
```

Nav: `Kodetive` (or `K`) mark left; `Work / About / Resume / Contact` right. Fixed, hairline bottom rule, color-inverts against bright hero shader.

Command palette (`Cmd+K`) is **deferred** to a post-launch add.

## 3. Visual system — theme-swappable

All colors live as CSS custom properties in `src/app/globals.css`. Palette swap is one-file.

### Starting palette — **B, warm editorial dark**

| Token | Value | Purpose |
|---|---|---|
| `--bg` | `#0B0A08` | base obsidian, ~1% warm |
| `--bg-elev` | `#14120F` | elevated surfaces |
| `--fg` | `#EDE6D6` | cream, not white |
| `--fg-muted` | `#8A8272` | secondary text |
| `--accent` | `#C9A96A` | muted champagne/bronze |
| `--accent-hot` | `#E8C98A` | hover/active only |
| `--rule` | `rgba(237,230,214,0.08)` | hairline dividers |

Fallback palettes A (dark + luminous single accent) and D (dark + dual accents) are defined in the same file but commented; swapping is done by renaming the active block.

### Typography

- **Display:** Fraunces (variable, editorial serif). Hero, section headings, case study titles. Weight 400, optical-size large, slight negative tracking.
- **Body:** Inter (variable). Base 16px, line-height 1.6.
- **Mono:** JetBrains Mono. Project metadata, tech lists, section counters (`01 / 04`).

All fonts loaded via `next/font` with `display: swap`, subset to used glyph ranges.

### Grid & rhythm

- 12-column max-width 1280px.
- 8pt spacing scale.
- Hairline `1px solid var(--rule)` as primary divider — no heavy boxes, no drop shadows.

### Motion defaults

- Easing: `[0.22, 1, 0.36, 1]` (ease-out-quart) unless justified otherwise.
- Duration tiers: 200 / 300 / 500 / 800 ms.
- Every animation queries `useReducedMotion`.

## 4. Hero (`src/components/Hero.tsx` — rebuild)

Full-viewport, single composition. Three stacked layers.

### 4.1 Ambient R3F layer (back)

- Slowly-rotating displaced plane or volumetric noise field.
- Rendered at `dpr={[1, 1.5]}`, `frameloop="demand"`, driven by a throttled RAF.
- Near-black with faint champagne light scattering.
- `aria-hidden="true"`.
- **Mobile:** swapped for a pre-rendered static PNG — zero R3F cost.
- Loaded via `next/dynamic({ ssr: false })` behind a `Suspense` boundary.

### 4.2 Shader typography (mid)

- "Keaton Jones" (display) and "Software Engineer" (smaller, below) rendered in a WebGL plane via fragment shader.
- Flow-field distortion responds to cursor position (max ~4px offset) and amplifies with scroll progress.
- As user scrolls past the hero, text dissolves into drifting particles and fades.
- An `<h1>` containing the same text stays in the DOM (visually hidden) for SEO + screen readers.
- Reduced-motion: static gradient text, no distortion, no dissolve.

### 4.3 Chrome layer (front)

- Fixed top nav.
- Bottom-right: small page counter in mono (`01 / 04`).
- Bottom-left: vertical scroll hint.

### 4.4 Cursor (global, mounted via CursorProvider)

- 6px cream dot, lerped to real cursor with ~0.15 smoothing.
- Scales to a 40px ghost ring over elements marked `data-cursor="link"`.
- Hidden on touch devices and when `prefers-reduced-motion: reduce`.

### 4.5 Perf targets for the hero

- Shader compile < 80ms.
- First interactive < 1.5s desktop.
- LCP < 2.0s desktop, < 2.5s mobile.

## 5. Work section + case studies

### 5.1 Home `/` work section

- Three project cards stacked vertically (**not** a grid).
- Each card ~60vh tall, full-width. Alternating L/R layout — cover visual on one side, metadata on the other.
- Hover: cover scales to 1.02, cream overlay lifts, "View case study →" underlines.

**Card metadata example (mono):**

```
01 / SHREDDER          In progress · 2026
   Mobile · React Native · Supabase · RevenueCat
```

- Click → shared-element transition. Cover image flies to case-study header using Framer Motion `layoutId`. URL becomes `/work/[slug]`.

### 5.2 Case study page `/work/[slug]`

Editorial long-form template, same structure for all three projects.

- **Header:** full-bleed cover, title (display), one-line summary, metadata row (role · year · stack · external links).
- **The problem** — 2–3 paragraphs of prose.
- **Approach** — how it was thought about.
- **Selected screens** — 3–6 images, some full-bleed, some inset, captions in mono.
- **Tech decisions** — short annotated list ("RevenueCat over Stripe because…").
- **Outcome / what I learned** — short, honest.
- **Footer:** prev/next project, back-to-work link.

Content stubs are created for Shredder, Stat AI, Unit Converter. Real copy filled in iteratively post-implementation.

## 6. About, skills marquee, contact

### 6.1 About

- Two-column editorial section.
- Left: B&W portrait photo (or geometric placeholder until supplied).
- Right: three short paragraphs of prose. No bullets, no stats counters, no "I'm passionate about…".

### 6.2 Skills marquee

- Infinite horizontal ticker, two rows scrolling in opposite directions.
- Each chip: monochrome logo + label (mono), hairline border, ~40px tall. 2px lift on hover; entire row pauses on hover.
- **Row 1 — Core:** TypeScript, React, Next.js, React Native, Node, Tailwind, Framer Motion, Three.js/R3F.
- **Row 2 — Platform:** Supabase, RevenueCat, AppsFlyer, OneSignal, Linear, Vercel, OpenAI, Google APIs.
- Reduced-motion → static grid fallback.

### 6.3 Contact

- Display-size line — **"Let's talk."**
- Three quiet links side by side: email, LinkedIn, GitHub. Champagne accent on hover; subtle magnetic pull inside ~40px radius.
- Footer below: copyright, "built with" note, tiny `view source` link to the repo.

## 7. Interaction & motion layer

Single source of truth so interactions stay coherent.

| Primitive | Path | Purpose |
|---|---|---|
| `CursorProvider` | `src/components/interactions/CursorProvider.tsx` | RAF-lerped cursor dot. Context exposes `setCursorState('default'|'link'|'hidden')`. Links/buttons register via `data-cursor="link"`. |
| `ScrollProvider` | `src/components/interactions/ScrollProvider.tsx` | Wraps Framer Motion `useScroll`; exposes a shared viewport-progress `MotionValue` consumed by hero shader, nav color-shift, and section reveals — no duplicate scroll listeners. |
| `PageTransition` | `src/components/interactions/PageTransition.tsx` | `<AnimatePresence mode="wait">` at the route boundary. Default: fade + 8px upward translate, 300ms. Shared `layoutId` for work → case study covers. |
| `RevealOnView` | `src/components/interactions/RevealOnView.tsx` | `opacity 0→1`, `y: 16→0`, triggered once at 20% viewport. |

**Reduced motion behavior:** no cursor dot, static gradient hero text, no parallax, instant page transitions, static skills grid, instant reveals.

## 8. Performance & accessibility budget

- **Core Web Vitals:** LCP < 2.0s desktop / < 2.5s mobile · CLS < 0.05 · INP < 200ms.
- **Bundles:** hero R3F chunk < 120KB gz; below-fold R3F/shader loaded via `next/dynamic({ ssr: false })`.
- **Images:** `next/image` everywhere, AVIF preferred, explicit dimensions.
- **WCAG 2.2 AA:** cream 2px focus rings with 3px offset; skip-link; semantic landmarks; visually-hidden H1 behind shader; every interactive element keyboard-reachable; mobile touch targets ≥ 44px.
- **Lighthouse gate before ship:** ≥ 95 performance / 100 accessibility / 100 best-practices.

## 9. Skill invocation points

Per `~/.claude/CLAUDE.md`, skills gate specific steps. The implementation plan **must** invoke each at the indicated step.

| Step | Skills |
|---|---|
| Visual system design (§3) | `web-design-principles`, `immersive-aesthetic` |
| Hero build (§4) | `three-d-web`, `immersive-aesthetic`, `motion-design` |
| Work cards + case studies (§5) | `ui-ux-patterns`, `web-design-principles` |
| Interaction layer (§7) | `motion-design`, `page-transitions` |
| **Before shipping any visible section** | `taste` (gates generic AI aesthetics) |
| Pre-launch pass (§8) | `accessibility`, `performance-web` |

## 10. Build sequence (drives the implementation plan)

1. Theme tokens + base layout — `globals.css`, `layout.tsx`, `next/font` wiring.
2. Interaction primitives — `CursorProvider`, `ScrollProvider`, `RevealOnView`.
3. Nav + `PageTransition` shell.
4. Hero — R3F ambient layer → shader text → scroll hand-off.
5. Work section cards + shared-element transition plumbing.
6. Case study template + `/work/[slug]` dynamic route + three content stubs.
7. About section.
8. Skills marquee.
9. Contact + footer.
10. Resume page restyle.
11. A11y + perf pass, reduced-motion QA, Lighthouse.

## 11. Open items (filled iteratively post-implementation)

- Case study copy (problem/approach/outcome) for all three projects.
- Project cover images + screens.
- B&W portrait (or keep geometric placeholder).
- Final choice between palettes B / A / D — reviewed live after the hero lands.

## 12. Non-goals

- Blog or writing section.
- Client/testimonials section.
- Analytics beyond Vercel defaults.
- A CMS. Case study content lives as co-located MDX or TSX.
- Command palette (deferred post-launch).
- Calendar booking flow (existing `Calendar.tsx` is kept in the repo but not mounted on the new home; may be reintroduced later).
