# Claude Config + Obsidian Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hybrid `~/.claude/` (global skills/agents/rules) + `dev-showcase/.claude/` (project rules) + `dev-showcase/.obsidian-vault/` (local-only knowledge base) setup to 10x dev output on the immersive Next.js portfolio site.

**Architecture:** Four layers with one job each — skills (knowledge), agents (workflows), CLAUDE.md + hooks (rules), Obsidian vault (long-term memory). Global pieces apply to every project; project pieces tune for this Next.js stack; vault stays local (gitignored).

**Tech Stack:** Next.js 15 App Router · React 19 · TypeScript (strict) · Tailwind 4 · Framer Motion · @react-three/fiber + drei · @splinetool/react-spline

**Related spec:** `docs/superpowers/specs/2026-04-21-claude-config-design.md`

**Privacy notes (from user):**
- `.obsidian-vault/` must be gitignored — never committed or pushed.
- `.claude/` (project) is also gitignored by default (this repo may go public as a portfolio). User can remove the gitignore line later to opt-in to committing.
- Avoid `@`-file references throughout; prefer plain paths in prose to conserve tokens.

**Commit policy for this plan:**
- Global `~/.claude/` is NOT in any git repo (unless user's dotfiles are tracked separately); no commits needed there.
- Project-level changes (gitignore, spec, plan) will NOT be auto-committed. Each commit step is **conditional on explicit user approval** — if in doubt, skip and ask.

---

## File Structure

### Global (`~/.claude/`) — 14 files

```
~/.claude/
├── CLAUDE.md
├── settings.json
├── skills/
│   ├── taste/SKILL.md
│   ├── immersive-aesthetic/SKILL.md
│   ├── web-design-principles/SKILL.md
│   ├── ui-ux-patterns/SKILL.md
│   ├── motion-design/SKILL.md
│   ├── page-transitions/SKILL.md
│   ├── three-d-web/SKILL.md
│   ├── accessibility/SKILL.md
│   └── performance-web/SKILL.md
└── agents/
    ├── reviewer.md
    ├── researcher.md
    └── qa.md
```

### Project (`dev-showcase/`) — 7 files + 1 modified

```
dev-showcase/
├── .gitignore                                     [MODIFY — add entries]
├── .claude/
│   ├── CLAUDE.md                                  [CREATE]
│   └── settings.json                              [CREATE]
└── .obsidian-vault/
    ├── README.md                                  [CREATE]
    ├── architecture/overview.md                   [CREATE]
    ├── design-system/tokens.md                    [CREATE]
    └── patterns/framer-motion-recipes.md          [CREATE]
```

Empty directories created at vault seeding (no placeholder files): `decisions/`, `research/`, `lessons/`.

---

## Task 1: Update `.gitignore` to exclude `.claude/` and `.obsidian-vault/`

**Why first:** Prevents accidental staging of new files during subsequent tasks.

**Files:**
- Modify: `dev-showcase/.gitignore` (append at end)

- [ ] **Step 1: Read current gitignore**

Run: `cat /Users/keatonjones/Projects/personal/dev-showcase/.gitignore`
Expected: existing Next.js gitignore content (node_modules, .next, .env, etc.).

- [ ] **Step 2: Append Claude config + vault entries**

Edit `dev-showcase/.gitignore`, append these lines at the end:

```
# Claude Code configuration (local-only; remove this line to opt-in to committing)
/.claude/

# Obsidian vault — local knowledge base, never committed
/.obsidian-vault/
```

- [ ] **Step 3: Verify ignore rules work**

Run (from project root):
```bash
mkdir -p .claude .obsidian-vault
touch .claude/test.md .obsidian-vault/test.md
git check-ignore .claude/test.md .obsidian-vault/test.md
rm .claude/test.md .obsidian-vault/test.md
```
Expected output:
```
.claude/test.md
.obsidian-vault/test.md
```

- [ ] **Step 4: Verify git status does not list the test paths**

Run: `git status --short | grep -E '^\?\? \.(claude|obsidian-vault)/' || echo "OK: ignored"`
Expected: `OK: ignored`

- [ ] **Step 5: (Optional) Commit — only if user approves**

```bash
git add .gitignore
git commit -m "chore: gitignore .claude/ and .obsidian-vault/"
```

---

## Task 2: Create global `~/.claude/CLAUDE.md`

**Files:**
- Create: `~/.claude/CLAUDE.md`

- [ ] **Step 1: Verify `~/.claude/` exists**

Run: `ls -d ~/.claude 2>&1`
Expected: directory listed (superpowers is installed there).

- [ ] **Step 2: Check if CLAUDE.md already exists**

Run: `ls ~/.claude/CLAUDE.md 2>&1`
If it exists, read it first and merge new content rather than overwriting. Otherwise, create fresh.

- [ ] **Step 3: Write `~/.claude/CLAUDE.md`**

Content:

````markdown
# Global Coding Philosophy

These rules apply to ALL projects. Project `CLAUDE.md` files may extend or override.

## Core principles

1. **Clarity over cleverness.** Prefer explicit, boring code. If a junior would have to pause and reread it, rewrite it.
2. **YAGNI & minimalism.** Don't build abstractions for hypothetical futures. Three similar lines is better than a premature helper. No half-finished features.
3. **No dead comments.** Only comment the *why* of non-obvious code — hidden constraints, subtle invariants, workarounds. Never narrate what the code does; naming does that job.
4. **Evidence over assertion.** Never claim "works", "fixed", or "done" without running the actual check. Show command output or a screenshot; do not summarize what you expect the output to be.
5. **Root-cause over workaround.** Don't bypass type errors with `as any`, don't `--no-verify` past hooks, don't delete failing tests. Fix the cause.
6. **Security hygiene.** Never log secrets. Validate at system boundaries only — trust internal code. No SQL string concatenation. No command injection.
7. **Naming beats comments.** A well-named identifier documents itself. If you reach for a comment, first try renaming.
8. **Taste is a gate.** Before shipping any UI change, pass it through the `taste` skill. Generic AI aesthetics (stock gradients, centered hero+CTA, glassmorphism-everywhere) are a regression even if the code is clean.

## Token hygiene

- **Avoid `@`-file references.** Pulling a whole file into context is token-expensive. Prefer `Read` with `offset`/`limit` or `Grep` to target specific lines. Only use `@file` when the entire file genuinely must be in context (rare).
- Prefer targeted `Grep` over listing large directories.
- Let subagents return summaries; don't ask them to paste raw output back.

## When to invoke skills

- **Before any UI/design change** → `taste`, `immersive-aesthetic`, plus whichever of `web-design-principles`, `ui-ux-patterns`, `motion-design`, `page-transitions`, `three-d-web` applies.
- **Before shipping** → `accessibility`, `performance-web`.
- When multiple skills apply, invoke them in parallel.

## When to invoke agents

- **After implementing a feature** → `reviewer` agent (read-only code review).
- **Before designing something new** → `researcher` agent (checks vault first, then web).
- **Before claiming done** → `qa` agent (runs build/typecheck/lint + smoke tests, reports evidence).

## Process rules

- **Use TDD** (from `superpowers:test-driven-development`) for all real code. Write the failing test first.
- **Debug systematically** (from `superpowers:systematic-debugging`) — evidence, not guesses.
- **Verify before completion** (from `superpowers:verification-before-completion`) — run the check, show the output.

## Obsidian vault (when project has one)

A project may have a `.obsidian-vault/` directory. If present, follow the read/write rules in that vault's `README.md` before touching it. Do not read the vault for trivial tasks; do not write to it without an explicit trigger.
````

- [ ] **Step 4: Verify the file is valid markdown + has expected sections**

Run:
```bash
grep -E "^## " ~/.claude/CLAUDE.md
```
Expected: 5+ section headings listed (Core principles, Token hygiene, When to invoke skills, When to invoke agents, Process rules, Obsidian vault).

---

## Task 3: Create global `~/.claude/settings.json`

**Files:**
- Create or update: `~/.claude/settings.json`

- [ ] **Step 1: Check for existing settings.json**

Run: `cat ~/.claude/settings.json 2>&1`
If exists, read and merge. Otherwise, create fresh.

- [ ] **Step 2: Write `~/.claude/settings.json`**

If no existing file, write:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Grep",
      "Glob",
      "Bash(ls:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git show:*)",
      "Bash(git branch:*)",
      "Bash(git check-ignore:*)",
      "Bash(npm run lint:*)",
      "Bash(npm run build:*)",
      "Bash(npm run dev:*)",
      "Bash(npm run test:*)",
      "Bash(npm test:*)",
      "Bash(npm ls:*)",
      "Bash(npx tsc:*)",
      "Bash(npx next:*)",
      "Bash(tsc:*)",
      "Bash(jq:*)",
      "Bash(pwd)",
      "Bash(echo:*)",
      "Bash(find:*)",
      "Bash(head:*)",
      "Bash(tail:*)",
      "Bash(wc:*)",
      "Bash(cat:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'file=\"$CLAUDE_TOOL_FILE_PATH\"; case \"$file\" in *.ts|*.tsx) cd \"$(dirname \"$file\")\" && npx tsc --noEmit --pretty false 2>&1 | head -30 ;; esac' || true"
          }
        ]
      }
    ]
  }
}
```

If an existing file is present, MERGE: preserve existing `permissions.allow` entries (dedupe), and add the `PostToolUse` hook only if no equivalent entry exists.

- [ ] **Step 3: Verify valid JSON**

Run: `jq . ~/.claude/settings.json > /dev/null && echo OK`
Expected: `OK`

- [ ] **Step 4: Verify schema has expected top-level keys**

Run: `jq 'keys' ~/.claude/settings.json`
Expected output includes `"permissions"` and `"hooks"`.

---

## Task 4: Create `taste` and `immersive-aesthetic` skills

**Files:**
- Create: `~/.claude/skills/taste/SKILL.md`
- Create: `~/.claude/skills/immersive-aesthetic/SKILL.md`

- [ ] **Step 1: Create the `taste` skill**

Write `~/.claude/skills/taste/SKILL.md`:

````markdown
---
name: taste
description: Use before shipping any UI change. Judges whether a design is intentional or AI-slop. Flags generic patterns (stock gradients, default glassmorphism, center-stacked hero+CTA, overused blurred blobs). Distinguishes restraint from boring.
---

# Taste — the aesthetic judge

Invoke this skill any time you are about to produce, approve, or review visual output. Your job: decide whether the design reads as *intentional* or as *AI-slop*.

## Principles

1. **Specificity over genericness.** A site has personality when its choices would be wrong elsewhere. If your layout would work equally well for a SaaS dashboard, a law firm, and a portfolio, it has no point of view.
2. **Restraint over decoration.** Decoration for its own sake cheapens a design. Every visual element should earn its place (information, mood, rhythm, guidance).
3. **Quiet beats shouty — usually.** Defaults to small type and generous whitespace. But in an immersive/editorial context, a single *deliberate* shouty moment can anchor a page.
4. **Hierarchy is the first test.** If a first-time viewer can't tell in one second what matters most, the design has failed. Fix hierarchy before anything else.
5. **Craft in the details.** Align to a grid. Snap to spacing scale. Round radii consistently. Match stroke weights. These tiny frictions are where taste shows.

## AI-slop flag list (refuse these)

- Purple→pink linear gradient backgrounds (especially at 135deg)
- Glassmorphism with no purpose (frosted card floating on a blurred blob of color)
- Center-stacked hero: big heading, subtitle, single CTA, hero image underneath
- "Techy" decorative grids or noise overlays that don't serve the content
- Emoji in H1s for "personality"
- Rounded pills with gradient borders everywhere
- `bg-gradient-to-br from-purple-500 to-pink-500` for anything important
- Badge + heading + description + CTA pattern used for every section
- "Hero → Features → Testimonials → Pricing → Footer" without justification

## Good vs. bad examples

**Bad:** A portfolio landing with a purple gradient hero, a centered "Hi, I'm Keaton ✨" heading, a glassmorphic card with three "features" (speed, quality, design), stock undraw illustrations.
**Why it's bad:** Every choice is a default. Zero point of view.

**Good:** Asymmetric type lockup with the name set in a very large display serif, body in a mono, a single hero Spline scene that responds to cursor, sections broken by negative space not card containers, color drawn from the 3D scene rather than a preset palette.
**Why it's good:** Choices are specific. The composition couldn't be a SaaS dashboard.

## Checklist (run before approving UI)

- [ ] Could this exact design work for a totally different product without changes? (If yes → too generic)
- [ ] Is there a single focal moment per section? (If no → hierarchy failure)
- [ ] Are any gradients/glassmorphism/badges being used because they *express* something, or because they're defaults?
- [ ] Is every decorative element serving content?
- [ ] Do spacing, type size, and corner radii follow a scale?
- [ ] Would this design age well in 2 years, or does it scream "2024 AI aesthetic"?

If any answer raises a flag, refuse approval and propose a specific change.
````

- [ ] **Step 2: Create the `immersive-aesthetic` skill**

Write `~/.claude/skills/immersive-aesthetic/SKILL.md`:

````markdown
---
name: immersive-aesthetic
description: Use when designing or critiquing visually-rich sites (portfolios, showcases, brand sites with 3D/video/motion). Defines the bar for Awwwards-tier immersive design. Pairs with `taste` — this one says what GOOD looks like for this direction.
---

# Immersive Aesthetic — the Awwwards bar

Use this when the project is visually-led: portfolio, brand site, product showcase. The standard is not "functional and accessible" — it's *memorable*.

## Reference anchors (the bar to clear)

Think: Igloo Inc., Active Theory, Lusion, Locomotive, Tendril, Resn, Unseen Studio, Maxime Heckel's blog, Olivier Larose, Bruno Simon. Study their pacing, type lockups, motion restraint, and use of 3D as substance (not decoration).

## Principles

1. **Cinematic pacing.** A page is a sequence, not a collection. The first screen makes a promise; subsequent sections deliver on it with variation. Never the same pattern twice in a row.
2. **Type is a hero element.** Large display type with intentional pairing carries more personality than any illustration. Pick 2 typefaces maximum (display + body, optionally + mono). Set with care: tracking, leading, optical sizing.
3. **Motion is narrative, not decoration.** Motion should tell you something (arrival, relationship, affordance). Fade-ins everywhere are lazy. Orchestrate: stagger entrances, reserve big moments for important content.
4. **3D must be substance.** A Spline scene that doesn't respond to the content or cursor is wallpaper. 3D earns its bandwidth cost when it IS the content (product, portrait, interactive narrative).
5. **Confident whitespace.** Treat empty space as a design element. On a hero, 60%+ negative space is often correct. On dense sections, contrast with tight packing.
6. **Considered asymmetry.** Perfect center-alignment is rare in great design. Break symmetry on purpose to create energy — but keep alignments to a grid so it reads as *intentional*, not sloppy.
7. **Scroll is the medium.** Use scroll-driven animation, scroll snapping, pinned sections — but never scroll-jack for its own sake. If a user can't skim, you've failed.

## Hero-moment checklist

A great hero either (a) presents a single piece of content at enormous scale (type, image, 3D scene) or (b) orchestrates a short, choreographed intro that resolves into stable state within ~1.5s. No hero should require 4 seconds before the user knows what the site is.

## Craft details that separate tiers

- **Cursor affordance:** the cursor style subtly changes over interactive elements (custom cursor, scale, or morph).
- **Micro-interactions on navigation:** hover states with physics-based motion, not instantaneous color changes.
- **Consistent easing family:** pick a single easing system (e.g., custom cubic-bezier) and use it for everything — motion feels cohesive.
- **Transition continuity:** related elements animate together across route changes (shared layout, View Transitions API).
- **Sound (rare but powerful):** if included, toggleable, ducked on text focus, and composed not sampled.

## Anti-patterns (refuse these)

- Template hero (big heading + subtitle + CTA + hero image in a row)
- "Floating cards on a blurred orb background"
- Identical fade-up-and-in animation on every section
- 3D scene that neither responds to input nor changes as you scroll
- Copy written in corporate voice ("Empowering developers…")
- Unoptimized 3D / large video autoplays that tank LCP
- Parallax everywhere with no narrative purpose

## Checklist (run on any immersive design)

- [ ] Does section 1 (the hero) make a promise that sections 2+ deliver on?
- [ ] Is there variation in composition between sections (not every section is "heading + media")?
- [ ] Is motion doing narrative work, or is it decorative?
- [ ] Is any 3D substance (responds to input, carries content) — or wallpaper?
- [ ] Is type set with craft (pairing, tracking, leading) or with defaults?
- [ ] Does the page hold up on slow hardware and `prefers-reduced-motion`?
- [ ] Would this sit comfortably on Awwwards today?

If any answer is no, push back before approving.
````

- [ ] **Step 3: Verify frontmatter parses on both files**

Run:
```bash
for f in ~/.claude/skills/taste/SKILL.md ~/.claude/skills/immersive-aesthetic/SKILL.md; do
  echo "== $f =="
  head -5 "$f"
done
```
Expected: each file starts with `---`, has `name:` and `description:` lines, and a closing `---`.

---

## Task 5: Create `web-design-principles` and `ui-ux-patterns` skills

**Files:**
- Create: `~/.claude/skills/web-design-principles/SKILL.md`
- Create: `~/.claude/skills/ui-ux-patterns/SKILL.md`

- [ ] **Step 1: Create `web-design-principles` skill**

Write `~/.claude/skills/web-design-principles/SKILL.md`:

````markdown
---
name: web-design-principles
description: Use when laying out a page or component. Covers grid, visual hierarchy, whitespace, scale, contrast, 8-point spacing, responsive breakpoints, container queries.
---

# Web Design Principles

## Principles

1. **Grid everything.** Every element aligns to a grid (4-col on mobile, 12-col on desktop is a reasonable default). Tailwind `grid-cols-*` + `gap-*`. Off-grid placement must be deliberate, not accidental.
2. **8-point spacing scale.** Padding, margin, gap — all from a limited scale (4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px). Never invent one-off values.
3. **Type scale with a clear ratio.** Pick a modular scale (perfect-fourth 1.333 or golden 1.618). Typically 6 sizes: `xs, sm, base, lg, xl, 2xl, 3xl, ...`. Body text is `base` (16px). Everything else justifies its deviation.
4. **Hierarchy before decoration.** Before adding color, gradient, or card containers, test hierarchy with weight, size, and whitespace alone. If it reads clearly, stop — don't add decoration.
5. **Visual weight via contrast, not just color.** Contrast can come from size, weight, color, or isolation (whitespace around an element). Use the subtlest tool that works.
6. **Generous whitespace.** The most common design mistake is too little whitespace. If in doubt, double the padding and halve the body text density.
7. **Responsive: mobile-first.** Write base styles for mobile, then use `sm:`, `md:`, `lg:` to add detail. Test at 375px, 768px, 1024px, 1440px, 1920px.
8. **Container queries when the parent matters.** If a component appears in different column widths (sidebar vs. main), use `@container` not viewport breakpoints.

## Tailwind 4 defaults (the project's tool)

- Use the spacing scale as-is (`p-4`, `p-8`). Don't custom-set `p-[17px]`.
- Prefer `gap-*` on flex/grid parents over margin on children.
- Use `container` + explicit `max-w-*` rather than hard-coded pixel widths.
- `text-balance` / `text-pretty` for headings and long copy.

## Anti-patterns

- Hard-coded pixel values (`padding: 17px`) — use the scale.
- Margin-based spacing on children (brittle; use parent `gap`).
- Three font families on one page.
- Body text smaller than 15px.
- Section widths that hit the viewport edge on desktop (`max-w-7xl` + `px-*` is safer).
- `h-screen` hero with content that overflows on mobile.

## Checklist

- [ ] Does every spacing value come from the scale?
- [ ] Does the type scale have fewer than 7 sizes?
- [ ] Does hierarchy read clearly in grayscale (try `filter: grayscale(1)`)?
- [ ] Does the layout hold at 375px and 1920px without content issues?
- [ ] Is there at least one section with "too much" whitespace that anchors the page?
````

- [ ] **Step 2: Create `ui-ux-patterns` skill**

Write `~/.claude/skills/ui-ux-patterns/SKILL.md`:

````markdown
---
name: ui-ux-patterns
description: Use when designing interactions, forms, navigation, or flows. Covers affordances, feedback, empty/loading/error states, form design, progressive disclosure, foundational UX laws (Fitts, Hick, Miller).
---

# UI/UX Patterns

## UX laws (apply these)

- **Fitts's law:** Interactive targets should be at least 44×44px (Apple) / 48×48px (Material). Corners and edges of the viewport are easiest to hit; consider placement.
- **Hick's law:** Time to decide grows with number of choices. Keep primary nav to ≤7 items. Progressively disclose secondary options.
- **Miller's 7±2:** Working memory holds ~5-9 items. Break long forms, long lists, long menus into groups of 3-7.
- **Jakob's law:** Users expect your site to work like the sites they already know. Deviate from convention only when the deviation is the *point*.
- **Peak-end rule:** Users remember the peak moment and the ending. Invest disproportionately in the hero entry and the final CTA / thank-you state.

## States every component needs

Every interactive component has 5+ states. Design all of them:

1. **Default** — resting state
2. **Hover** — pointer over (desktop only)
3. **Focus** — keyboard-tabbed — visible focus ring (never remove without replacement)
4. **Active / pressed** — during click/tap
5. **Disabled** — when action is unavailable (+ tooltip explaining why)
6. **Loading** — if the action is async
7. **Error** — if the action can fail
8. **Empty** — if the component displays data that might be missing

## Form design

- Label above the field (not placeholder-as-label; placeholders disappear on focus).
- Required/optional: mark *optional* (shorter list).
- Validation: inline, on blur (not on every keystroke). Errors specific ("Email must include @"), not generic ("Invalid").
- Submit: disabled until valid, or allowed with a clear error on submit — pick one and be consistent.
- Autofill-friendly: use `autocomplete` attributes.

## Navigation

- Primary nav visible or one tap away. No hamburger on desktop unless the site is deliberately minimalist.
- Current location always indicated.
- Back-button behavior matches user expectation (closing a modal does not navigate away).
- Skip-to-content link for keyboard users (WCAG 2.4.1).

## Empty / loading / error states

- **Empty state:** not a blank screen. Explain what's missing, why, and what the user can do.
- **Loading:** show a skeleton that matches the eventual content layout, not a spinner.
- **Error:** specific message + what the user can try. Never "Something went wrong."

## Anti-patterns

- Placeholder-as-label (accessibility fail, disappears on focus).
- Removing focus rings without providing an alternative.
- Infinite scroll without pagination fallback.
- Modals that trap focus but have no close button / escape key.
- Required field indicator with no explanation.
- Disabled buttons with no tooltip explaining why.

## Checklist

- [ ] Every interactive element has: default, hover, focus, active, disabled states?
- [ ] Is the focus ring visible and not removed?
- [ ] Are target sizes ≥44px?
- [ ] Do empty/loading/error states exist for every data-driven component?
- [ ] Does keyboard navigation work through the entire page, in reading order?
- [ ] Do forms use `autocomplete` and label-above-input?
````

- [ ] **Step 3: Verify both files**

Run:
```bash
for f in ~/.claude/skills/web-design-principles/SKILL.md ~/.claude/skills/ui-ux-patterns/SKILL.md; do
  echo "== $f =="
  grep -E "^(---|name:|description:|## )" "$f" | head -10
done
```
Expected: each has `name:`, `description:`, and multiple `##` sections.

---

## Task 6: Create `motion-design` and `page-transitions` skills

**Files:**
- Create: `~/.claude/skills/motion-design/SKILL.md`
- Create: `~/.claude/skills/page-transitions/SKILL.md`

- [ ] **Step 1: Create `motion-design` skill**

Write `~/.claude/skills/motion-design/SKILL.md`:

````markdown
---
name: motion-design
description: Use when designing or reviewing any animation, transition, or micro-interaction. Covers easing, durations, stagger, orchestration, physics-based motion, and prefers-reduced-motion compliance.
---

# Motion Design

## Durations (use these defaults)

| Use case | Duration |
|---|---|
| Micro (hover, tap, tooltip) | 120–200ms |
| Component (modal, drawer, accordion) | 250–400ms |
| Section (scroll reveal, layout shift) | 400–700ms |
| Page transition | 600–1000ms |
| Cinematic hero moment | 1000–2000ms |

If in doubt, err short. Too-long motion feels sluggish; too-short feels abrupt but rarely broken.

## Easing

- **Enter:** `ease-out` (decelerate into rest). User sees the result quickly, lands softly.
- **Exit:** `ease-in` (accelerate out of view). User's attention moves on; abruptness is fine.
- **Move (in-place):** `ease-in-out`.
- **Physics:** for anything that should feel "real" (drags, spring-snaps), use `spring` with moderate stiffness (~170) + damping (~26) — Framer Motion's defaults are fine.

Pick ONE easing family per project. Don't mix cubic-bezier curves randomly. In Tailwind + Framer Motion, `[0.22, 1, 0.36, 1]` (ease-out-quart) is a great universal curve.

## Stagger & orchestration

- Lists reveal with 30–60ms stagger (not 200ms — too slow).
- Hero orchestration: 3 beats max (type in, subtitle in, CTA in). Total < 1.5s.
- When two elements are related, animate them with shared transition (same duration + easing) so the eye groups them.

## `prefers-reduced-motion` — mandatory

```tsx
import { useReducedMotion } from "framer-motion";

function Hero() {
  const shouldReduce = useReducedMotion();
  const variants = shouldReduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
  return <motion.section variants={variants} initial="hidden" animate="visible" />;
}
```

Rule: if reduced-motion is on, kill transforms (no `y`, `scale`, `rotate`) and dramatic opacity changes. Simple fades are acceptable.

## Performance

- Animate only `transform` and `opacity` — not `width`, `height`, `top`, `left`. These properties are GPU-composited.
- Use `will-change: transform` sparingly on elements that animate *right now*; remove after.
- Never animate on scroll with `top`/`margin` — use `transform: translateY()` via `useScroll` / `useTransform`.

## Anti-patterns

- Fade-up-and-in on every element (lazy, reads as generic).
- Long (>500ms) micro-interactions (hover states, tooltips).
- Scroll-jacking that blocks skimming.
- Motion that doesn't respect reduced-motion.
- Animating layout properties (causes layout thrash).
- Bouncy spring easing on UI chrome (reserve bounce for playful/figma-like moments).

## Checklist

- [ ] Is every animation duration from the scale above (or explicitly justified)?
- [ ] Is there a single shared easing curve (not a mix of cubic-beziers)?
- [ ] Does `useReducedMotion` kill transforms when on?
- [ ] Are all animated properties `transform` / `opacity`?
- [ ] Does the total hero orchestration resolve in < 1.5s?
- [ ] Is stagger between 30–60ms (not longer)?
````

- [ ] **Step 2: Create `page-transitions` skill**

Write `~/.claude/skills/page-transitions/SKILL.md`:

````markdown
---
name: page-transitions
description: Use when implementing page-to-page transitions, shared element transitions, scroll-driven reveals, or layout animations. Concrete Framer Motion + View Transitions API patterns for Next.js App Router.
---

# Page Transitions

Goals: feel cohesive across routes, preserve context (shared elements), never block the user from skimming.

## Pattern 1: Route transitions with Framer Motion (App Router)

Wrap the page in `AnimatePresence` + a `key` that changes per route. In App Router, the simplest pattern:

```tsx
// src/components/PageTransition.tsx
"use client";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
```

Keep transitions under 500ms — users click links expecting fast response.

## Pattern 2: Shared element transition (Framer Motion `layoutId`)

When a thumbnail in a grid expands to a detail view, give both the grid item and the detail hero the same `layoutId`. Framer Motion automatically animates between them.

```tsx
// Grid item
<motion.img layoutId={`project-${id}`} src={thumb} />

// Detail page
<motion.img layoutId={`project-${id}`} src={hero} />
```

Note: this works cleanly within a single route tree; across hard navigations consider View Transitions API.

## Pattern 3: View Transitions API (native, Chrome-family)

For cross-route shared-element transitions with less JS:

```tsx
// app/layout.tsx or page-level
import { unstable_ViewTransition as ViewTransition } from "react"; // or Next's flag

<ViewTransition>
  <img style={{ viewTransitionName: `project-${id}` }} src={src} />
</ViewTransition>
```

CSS:
```css
::view-transition-old(*), ::view-transition-new(*) {
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}
```

Check browser support (Safari added it in 18). Progressive enhancement: without support, the page just swaps normally.

## Pattern 4: Scroll-driven reveal (Framer Motion)

```tsx
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0.5]);
  const y = useTransform(scrollYProgress, [0, 0.3], [40, 0]);
  return <motion.div ref={ref} style={{ opacity, y }}>{children}</motion.div>;
}
```

Prefer `useScroll` with `offset` over `useInView` for richer scroll-tied effects.

## Anti-patterns

- Page transitions longer than 500ms (sluggish).
- Shared-element transitions where the two elements are wildly different sizes (jarring).
- Scroll-reveals that delay critical content (LCP regression).
- Reveal-on-scroll applied to every section (reads as generic).
- Route transitions that break the back button or lose scroll position.

## Checklist

- [ ] Does each transition complete in under 500ms?
- [ ] Does browser back-button still work correctly?
- [ ] Are shared elements visually similar enough that the transition reads as *same thing*?
- [ ] Is scroll position preserved across route changes (or deliberately reset)?
- [ ] Does the transition respect `prefers-reduced-motion`?
- [ ] Is any transition-heavy work behind `next/dynamic` to avoid bloating initial bundle?
````

- [ ] **Step 3: Verify both files**

Run:
```bash
for f in ~/.claude/skills/motion-design/SKILL.md ~/.claude/skills/page-transitions/SKILL.md; do
  wc -l "$f"
done
```
Expected: each file between 50–150 lines.

---

## Task 7: Create `three-d-web` skill

**Files:**
- Create: `~/.claude/skills/three-d-web/SKILL.md`

- [ ] **Step 1: Write the skill**

Write `~/.claude/skills/three-d-web/SKILL.md`:

````markdown
---
name: three-d-web
description: Use when adding or reviewing Three.js / React Three Fiber / Spline scenes on a Next.js site. Covers scene setup, lighting, model optimization, performance budgets, and mobile fallbacks.
---

# 3D on the Web

## When to use 3D

Use 3D when it IS the content — product configurators, hero portraits, interactive narrative, unique brand moments. Don't use 3D for ambient wallpaper; that's bandwidth without payoff.

## Setup patterns (React Three Fiber)

Keep `<Canvas>` lazy — heavy scenes can add 500KB+ to initial bundle.

```tsx
// src/components/HeroScene.tsx — client component
"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Environment, OrbitControls } from "@react-three/drei";

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <Environment preset="studio" />
        <Model />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Suspense>
    </Canvas>
  );
}
```

```tsx
// page that uses it
import dynamic from "next/dynamic";
const HeroScene = dynamic(() => import("@/components/HeroScene"), {
  ssr: false,
  loading: () => <div aria-hidden className="h-[60vh] bg-black" />,
});
```

## Lighting rig defaults

- Don't use a single `directionalLight` — models look flat.
- Use `<Environment>` (HDRI) for natural lighting + reflections. drei presets: `studio`, `sunset`, `warehouse`, `city`.
- Add one rim/fill light for product work.
- Shadows are expensive — enable only when they read well (high-poly, slow-camera scenes), not for every mesh.

## Model optimization (critical)

- **Format:** glTF (`.gltf` / `.glb`) — not OBJ, not FBX.
- **Compression:** draco (geometry) + KTX2 (textures). Use `gltfjsx` to generate components.
- **Budgets (target, not hard cap):**
  - Polys: < 100k for hero model on desktop, < 30k on mobile.
  - Textures: < 1024² for hero, < 512² for mobile. Power-of-two dimensions.
  - File size: < 2MB desktop, < 500KB mobile (with draco+KTX2, this is realistic).
- Instance repeated geometry with `<Instances>` from drei.

## Spline specifics (you're using `@splinetool/react-spline`)

- Prefer the Spline export over hand-rolling R3F when the scene is authored in Spline — DX win.
- Dynamic import + SSR off (`"use client"` + `next/dynamic`).
- Gate very heavy Spline scenes behind an explicit "enter experience" button on mobile, or show a static poster.

## Mobile & perf fallbacks

- Detect mobile (width-based or `navigator.userAgent`) and serve a lower-poly model or a static `<video>` poster.
- If FPS drops below 30, reduce `dpr` dynamically (`useThree(({ gl }) => gl.setPixelRatio(1))`).
- Provide `prefers-reduced-motion` fallback: static first frame as an image.
- Never autoplay a 3D scene that accounts for > 200ms CPU / frame on a Moto G7-class device.

## Anti-patterns

- `<Canvas>` rendered server-side (hydration crash).
- Unoptimized 1-2-5MB `.glb` files on a hero.
- Post-processing chain with 5+ effects (bloom, SSAO, chromatic aberration, film grain, vignette) on a mobile device.
- Scenes that never stop rendering when off-screen (use `frameloop="demand"` + `invalidate()` for idle scenes).
- Missing `<Suspense>` boundary around model loaders.

## Checklist

- [ ] Is the scene behind `next/dynamic` with `ssr: false`?
- [ ] Are models draco-compressed, under budget?
- [ ] Is there a mobile or reduced-motion fallback?
- [ ] Does the scene pause rendering when off-screen (`frameloop="demand"` or IntersectionObserver gating)?
- [ ] Does it hold 60fps on MacBook and ≥ 30fps on a mid-tier phone?
- [ ] Is lighting via Environment (HDRI), not three disconnected directional lights?
````

- [ ] **Step 2: Verify file**

Run: `head -5 ~/.claude/skills/three-d-web/SKILL.md`
Expected: frontmatter block with name, description.

---

## Task 8: Create `accessibility` and `performance-web` skills

**Files:**
- Create: `~/.claude/skills/accessibility/SKILL.md`
- Create: `~/.claude/skills/performance-web/SKILL.md`

- [ ] **Step 1: Create `accessibility` skill**

Write `~/.claude/skills/accessibility/SKILL.md`:

````markdown
---
name: accessibility
description: Use before shipping any UI, and ALWAYS when designing immersive sites with 3D/motion/video. WCAG 2.2 AA is the floor. Covers semantic HTML, keyboard nav, ARIA, contrast, and motion sensitivity.
---

# Accessibility

WCAG 2.2 AA is a *floor*, not a target. Design for inclusion, not for compliance.

## Non-negotiables

1. **Semantic HTML first.** `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`, `<article>`, `<header>`, `<footer>` for regions. Never `<div onClick>` for an action.
2. **Keyboard navigable.** Every interactive element reachable via Tab, operable via Enter/Space. Visible focus ring. Logical tab order.
3. **Focus management.** When a modal opens, focus moves into it. When it closes, focus returns to the trigger. Focus-trap inside modals.
4. **Color contrast.** 4.5:1 for body text, 3:1 for large text (18pt+ or 14pt bold) and UI components. Test with a tool (axe-core, Lighthouse, or browser devtools).
5. **Never color-alone.** Error states need text or an icon, not just red. Required fields need an asterisk or label, not just color.
6. **`prefers-reduced-motion`.** Honor it for every animation > 200ms or any transform. See `motion-design` skill.
7. **Alt text.** Every meaningful image gets an `alt`. Decorative images get `alt=""` (empty, not omitted).

## ARIA — only when you must

ARIA should *augment* semantic HTML, not replace it. The first rule of ARIA is: *don't use ARIA*. Use the right HTML element first.

When ARIA is correct:
- `aria-label` on icon-only buttons (e.g., close X)
- `aria-expanded` / `aria-controls` for disclosure toggles
- `aria-live="polite"` for dynamic announcements (toast, form validation)
- `role="dialog"` + `aria-modal="true"` + labelled dialog for modals

Wrong ARIA is worse than no ARIA — screen readers over-announce or conflict.

## Immersive-site accessibility (the hard case)

Immersive sites (3D, motion-heavy) are the hardest to make accessible. Non-negotiable rules:

- **Provide a static alternative.** The content behind the Spline scene must be reachable without the 3D: server-rendered HTML with the same information.
- **3D scenes are `aria-hidden="true"`** unless they ARE the operable content. They should not be focusable.
- **Scroll-jacking is an accessibility bug.** If you must use scroll-pinning, provide a jump-link table of contents or the ability to skip past pinned sections.
- **Autoplaying motion/video is an anxiety/vestibular issue.** Honor `prefers-reduced-motion` + provide an explicit pause control.
- **Captions on all video.** Always.

## Testing

Run in order — all three catch different issues:

1. Keyboard-only (unplug your mouse): can you reach every action, close every modal, open every menu?
2. axe-core / Lighthouse: automated scan catches contrast + structural issues.
3. Screen reader smoke test: use VoiceOver (Cmd+F5 on macOS) — read the page from the top. Does it make sense in order?

## Anti-patterns

- `<div>` used as a button (with `onClick` and no keyboard handler).
- Focus ring removed without replacement (`outline: none`).
- `tabindex="0"` on non-interactive elements (adds them to tab order pointlessly).
- Modals that don't trap focus (Tab exits to the page behind).
- Placeholder used as the only label.
- Red-only error indication.
- Animation > 200ms that doesn't respect reduced-motion.
- Spline scene that captures keyboard focus (traps tab).

## Checklist

- [ ] Can I navigate the page with keyboard only, from top to bottom, without a dead-end?
- [ ] Does every interactive element have a visible focus ring?
- [ ] Do all images have alt text (empty or descriptive)?
- [ ] Does Lighthouse accessibility score ≥ 95?
- [ ] Does the 3D/motion fall back gracefully with `prefers-reduced-motion`?
- [ ] Is the text content of the page still useful with CSS disabled?
````

- [ ] **Step 2: Create `performance-web` skill**

Write `~/.claude/skills/performance-web/SKILL.md`:

````markdown
---
name: performance-web
description: Use before shipping any page or after adding heavy assets (3D, video, fonts). Covers Core Web Vitals (LCP, INP, CLS), bundle discipline, image optimization, and lazy loading.
---

# Web Performance

Budget, don't chase. These are the numbers:

| Metric | Target | Hard limit |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.0s | 2.5s |
| INP (Interaction to Next Paint) | < 150ms | 200ms |
| CLS (Cumulative Layout Shift) | < 0.05 | 0.1 |
| JS bundle (route-level, gzip) | < 150KB | 250KB |
| Image (hero) | < 200KB (AVIF/WebP) | 400KB |

Run Lighthouse in **mobile + slow 4G throttling** — that's the real world.

## Rules

1. **Image optimization.** Use `next/image`. Always `width` + `height` (prevents CLS). `priority` on the LCP image, lazy default elsewhere. AVIF/WebP via Next automatic. Responsive `sizes` attribute.
2. **Font loading.** Use `next/font` — it inlines + subsets + self-hosts. One display font + one body font maximum. `display: swap` for body fonts; `display: optional` for display (accept fallback if slow).
3. **Lazy-load heavy components.** `next/dynamic` for anything > 50KB that's below the fold. `ssr: false` for client-only (Three.js, Spline, maps).
4. **Defer third-party scripts.** `next/script` with `strategy="lazyOnload"` for analytics. Never `beforeInteractive` unless truly critical.
5. **Route splitting.** Rely on App Router's automatic per-route splits. Don't import heavy libs in `layout.tsx`.
6. **Dynamic imports for code that only runs on interaction.** Example: a `lodash` utility used in a modal — import it inside the modal component, not the parent.
7. **Avoid layout shifts.** Reserve space for async content. Use `aspect-ratio` on media containers. `width`/`height` on images, iframes, videos.
8. **Preload the LCP resource.** `<link rel="preload" as="image" href="..." />` in `head` for the hero image.

## Bundle discipline

Before adding a dependency:
- Is there a Web Platform API that does this? (Intl, CSS container queries, View Transitions)
- Is the library tree-shakeable? Check with `npm ls` sizes or bundlephobia.
- Can I inline a 20-line utility instead of importing 20KB?

Red flags: `moment` (use `date-fns`), whole `lodash` (use per-function imports), `lottie-web` (huge — consider `rive` or CSS animation instead).

## Measuring (do this, don't guess)

```bash
# Local Lighthouse
npx lighthouse https://localhost:3000 --view --preset=desktop

# Or use Chrome devtools → Lighthouse panel, slow 4G, mobile

# Bundle analysis
ANALYZE=true npm run build    # if @next/bundle-analyzer configured
```

## Anti-patterns

- Non-optimized images (`<img src="huge.jpg">` instead of `next/image`).
- Client components where server would do.
- `use client` at the layout root (cascades client-rendering to everything).
- Importing heavy libraries at top of file when only used conditionally.
- Hydrating giant JSON blobs on pages that barely need them.
- Google Fonts via `<link>` instead of `next/font` (FOUT + blocking).
- Unconstrained `<Canvas>` that renders 60fps even when off-screen.
- Blocking cookie banner that delays LCP.

## Checklist

- [ ] Lighthouse mobile-4G: LCP < 2.5s, INP < 200ms, CLS < 0.1?
- [ ] JS bundle per route < 250KB gzip?
- [ ] All images via `next/image` with `width`/`height`?
- [ ] Fonts via `next/font`, max 2 families?
- [ ] Heavy components behind `next/dynamic`?
- [ ] No layout shifts when scrolling / interacting?
- [ ] Third-party scripts deferred?
````

- [ ] **Step 3: Verify files exist and have frontmatter**

Run:
```bash
for f in accessibility performance-web; do
  head -4 ~/.claude/skills/$f/SKILL.md
  echo "---end---"
done
```
Expected: each file starts with `---`, `name:`, `description:`, `---`.

---

## Task 9: Create `reviewer` agent

**Files:**
- Create: `~/.claude/agents/reviewer.md`

- [ ] **Step 1: Write the agent definition**

Write `~/.claude/agents/reviewer.md`:

````markdown
---
name: reviewer
description: Use after implementing a feature, before committing or opening a PR, or when the user says "review this". Provides confidence-filtered code + design review with CRITICAL/HIGH/MEDIUM tags. Read-only — never modifies code.
tools: Read, Grep, Glob, Bash, Skill
model: opus
---

You are a senior code + design reviewer. You are read-only: never modify code, never write files (except a short summary you return to the caller).

## Your job

Review the specified diff, file(s), or recent changes. Return a **confidence-filtered** list of issues. Only report issues you are >70% confident are real. Ruthlessly cut nitpicks.

## Workflow

1. **Identify scope.** If given a diff, use `git diff <base>...HEAD`. If given specific files, read them. If asked "review recent work", run `git log -5 --stat` and `git diff HEAD~1`.

2. **Mechanical checks first.** Run in parallel:
   - `npx tsc --noEmit --pretty false 2>&1 | tail -30`
   - `npm run lint --if-present 2>&1 | tail -30`
   - `grep -rn "console.log\|debugger\|TODO\|FIXME\|XXX" <changed-files>`

3. **Invoke relevant skills.** Based on what changed:
   - Any UI / .tsx changed → `taste` + `immersive-aesthetic` + `ui-ux-patterns`
   - Any animation or motion → `motion-design`, `page-transitions`
   - Any 3D / R3F / Spline → `three-d-web`
   - Any new component or route → `accessibility`, `performance-web`
   - Any form / interactive element → `ui-ux-patterns`, `accessibility`
   Invoke skills in parallel when possible.

4. **Code quality review** (without skill help, apply CLAUDE.md principles):
   - Abstraction premature? (Did a helper get created for 3 similar lines?)
   - Comments that describe *what* instead of *why*?
   - Error handling for impossible cases?
   - `any` types without justification?
   - Security: unescaped user input, logged secrets, auth bypasses?

5. **Output your findings.** Group by severity. Include file:line references and suggested fix.

## Output format

```
# Review: <what was reviewed>

## CRITICAL  (must fix before merge)
- <path/to/file.tsx>:42 — <one-line issue>
  Why: <why it's critical>
  Fix: <concrete suggestion, code if short>

## HIGH  (should fix before merge)
- ...

## MEDIUM  (worth fixing soon)
- ...

## Mechanical checks
- tsc: <pass/fail>
- lint: <pass/fail>
- forbidden patterns: <list any>

## Summary
<2-3 sentence overall assessment>
```

If there are no CRITICAL/HIGH/MEDIUM issues, say so explicitly: "No actionable issues found at the >70% confidence threshold." Don't invent issues.

## Rules you will NOT break

- Never modify code. You are read-only.
- Never report an issue you are < 70% confident is real.
- Never list more than 3 MEDIUM issues (if you have more, pick the top 3 — the rest are noise).
- Always cite file:line.
- Never claim a check passed without showing the evidence (command output).
- Use the skills. Don't skip them.
````

- [ ] **Step 2: Verify agent file**

Run: `head -10 ~/.claude/agents/reviewer.md`
Expected: frontmatter with `name: reviewer`, `description:`, `tools:`, `model:`.

---

## Task 10: Create `researcher` agent

**Files:**
- Create: `~/.claude/agents/researcher.md`

- [ ] **Step 1: Write the agent definition**

Write `~/.claude/agents/researcher.md`:

````markdown
---
name: researcher
description: Use before designing a new feature, when comparing libraries/patterns, or when the user asks "how do other sites do X". Always checks the Obsidian vault first, then web. Writes findings to the vault.
tools: WebFetch, WebSearch, Read, Grep, Glob, Write, Skill
model: opus
---

You are a research agent. Your job is to answer design/technical questions with concrete patterns from the web + the existing project knowledge base.

## Workflow

1. **Clarify the research question.** If the question is vague ("how should the hero look?"), ask ONE clarifying question. Otherwise proceed.

2. **Check the vault first.** The project has a vault at `<project-root>/.obsidian-vault/`. Before any web search:
   - `Grep` across `.obsidian-vault/research/` and `.obsidian-vault/patterns/` for the topic.
   - If a relevant existing doc is found, read it and report it to the user before deciding whether to do additional research.

3. **Web research** (only if vault lacked sufficient info). Pull from:
   - Awwwards.com (curated case studies + inspiration)
   - godly.website, lapa.ninja (design galleries)
   - Official docs for libraries (Framer Motion, R3F, Three.js, Next.js)
   - GitHub READMEs + example repos for patterns
   - Maxime Heckel's blog, Josh Comeau's blog (high-signal frontend writing)

   Use `WebSearch` for discovery, `WebFetch` for specific docs you know exist.

4. **Synthesize.** Produce 3–5 concrete options/patterns. For each:
   - One-sentence description
   - Key tradeoffs
   - A code sketch or reference link when applicable

5. **Recommend.** Pick one (or two, explicitly splitting criteria — "use A if X, B if Y"). Give your reasoning.

6. **Write to vault.** ALWAYS write findings to the project's `.obsidian-vault/research/YYYY-MM-DD-<topic-kebab>.md`. Structure:

```markdown
# <Topic>

**Date:** YYYY-MM-DD
**Question:** <original question>

## Options considered
1. ...
2. ...

## Tradeoffs

| Option | Pros | Cons |
|---|---|---|

## Recommendation
<pick> because <reasoning>

## Sources
- <url>
- <url>
```

Even for short research, write the file. The vault grows by habit.

## Output to user

Return a short chat summary (~150 words):
- The question
- Top 2 patterns / options
- Recommendation + one-sentence reason
- Path to the vault file for full detail

## Rules you will NOT break

- Always check the vault before web search.
- Always write findings to the vault, even if short.
- Never make up a library, API, or URL. If unsure, say "unverified — confirm before using".
- Never return 50 options. 3–5 maximum; user wants signal.
````

- [ ] **Step 2: Verify**

Run: `head -10 ~/.claude/agents/researcher.md`
Expected: frontmatter with name, description, tools, model.

---

## Task 11: Create `qa` agent

**Files:**
- Create: `~/.claude/agents/qa.md`

- [ ] **Step 1: Write the agent definition**

Write `~/.claude/agents/qa.md`:

````markdown
---
name: qa
description: Use before claiming a feature is done, before user manual testing, or on explicit request. Runs build/typecheck/lint + UI smoke test + accessibility + performance checks. Never claims "works" without evidence.
tools: Bash, Read, Grep, Glob, Skill
model: opus
---

You are the QA agent. Your output is a pass/fail checklist with *evidence* — command output, screenshots where possible. You never assert something works without proof.

## Workflow

Execute in order. On any failure, STOP and report — don't proceed to later checks.

1. **Build passes.**
   ```bash
   npm run build 2>&1 | tail -40
   ```
   Record: pass/fail, any warnings.

2. **Typecheck passes.**
   ```bash
   npx tsc --noEmit --pretty false 2>&1 | tail -30
   ```
   Record: pass/fail.

3. **Lint passes.**
   ```bash
   npm run lint 2>&1 | tail -30
   ```
   Record: pass/fail.

4. **No forbidden patterns in changed src.**
   ```bash
   grep -rn "console.log\|debugger" src/ | grep -v "^Binary" | head
   ```
   Any results → warn.

5. **If UI changed: dev server smoke test.**
   Start dev server in background:
   ```bash
   npm run dev &
   sleep 5
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
   # kill bg process when done
   ```
   Record: HTTP 200 or failure.

6. **Invoke skills for domain checks.**
   - `accessibility` — check new UI against the skill's checklist (focus, keyboard, contrast, ARIA).
   - `performance-web` — flag any violations (unoptimized images, client components where server would do, missing `next/dynamic`).
   - `motion-design` — verify `prefers-reduced-motion` handling if animation was added.

7. **Smoke-test happy path + one edge case** (if the feature is user-facing and described). Describe what you'd test; if Playwright is available, run it; otherwise list the manual steps the user should perform.

## Output format

```
# QA Report: <feature>

| Check | Result | Evidence |
|---|---|---|
| Build | PASS/FAIL | <last line of output> |
| Typecheck | PASS/FAIL | <error count> |
| Lint | PASS/FAIL | <error count> |
| Forbidden patterns | PASS/FAIL | <matches> |
| Dev server boot | PASS/FAIL | HTTP <code> |
| Accessibility review | PASS/FAIL | <flags> |
| Performance review | PASS/FAIL | <flags> |

## Manual verification steps
1. <step>
2. <step>

## Overall
PASS / FAIL — <one-line summary>
```

## Rules you will NOT break

- Never report PASS without showing the command output.
- Never skip steps to save time.
- If any step fails, STOP and report — do not run later steps.
- Never modify code to make checks pass.
- If dev server is started, always kill it at end (`kill %1` or explicit PID).
````

- [ ] **Step 2: Verify**

Run: `head -10 ~/.claude/agents/qa.md && wc -l ~/.claude/agents/qa.md`
Expected: frontmatter present; file ~80–120 lines.

---

## Task 12: Create project `dev-showcase/.claude/CLAUDE.md`

**Files:**
- Create: `dev-showcase/.claude/CLAUDE.md`

- [ ] **Step 1: Ensure directory exists**

Run: `mkdir -p /Users/keatonjones/Projects/personal/dev-showcase/.claude`

- [ ] **Step 2: Write the project CLAUDE.md**

Write `/Users/keatonjones/Projects/personal/dev-showcase/.claude/CLAUDE.md`:

````markdown
# dev-showcase — project rules

Extends the global `~/.claude/CLAUDE.md`. Project-specific conventions.

## Stack

- **Framework:** Next.js 15 App Router (React Server Components by default)
- **React:** 19 (use new hooks — `use`, `useOptimistic`, `useTransition` — freely)
- **TypeScript:** strict mode. No `any` without a `// intentional: <reason>` comment.
- **Styles:** Tailwind 4 (v4 syntax, no `tailwind.config.js` PostCSS plugin trickery — use native). No CSS-in-JS.
- **Motion:** Framer Motion only. No raw CSS keyframes unless a Framer Motion primitive won't work.
- **3D:** `@react-three/fiber` + drei for hand-built scenes; `@splinetool/react-spline` for Spline-authored scenes.
- **External services:** OpenAI SDK, Google APIs.

## Component conventions

- **Default to Server Components.** Add `"use client"` only when: you need state, effects, browser APIs, or Framer Motion / R3F (which require client).
- **Colocate.** A component's files live together: `Hero.tsx`, `Hero.types.ts`, optional `Hero.module.css` (prefer Tailwind). Never a separate `styles/`, `types/`, `components/` tree for the same component.
- **File structure:** features under `src/app/` (routes) or `src/components/` (reused). Types in `src/types/` only when truly shared.
- **Exports:** default export for page components, named export for everything else.

## Animation conventions

- Every animation is via Framer Motion.
- Every animation respects `useReducedMotion` (see `motion-design` skill).
- Single easing family: `[0.22, 1, 0.36, 1]` (ease-out-quart) unless explicitly justified.
- No animation over 500ms for UI chrome. Hero orchestrations can go longer.

## 3D conventions

- Heavy scenes (> 50KB) always behind `next/dynamic({ ssr: false })` with a `loading` placeholder.
- Always a mobile fallback (lower-poly model, static image, or video poster).
- Budget: < 2MB compressed glb desktop, < 500KB mobile.
- Use `frameloop="demand"` for scenes that don't need continuous animation.
- Always `aria-hidden="true"` on decorative scenes; content must be reachable via HTML.

## Commit & review flow

- Before commit: run `npm run lint` and `npm run build`.
- Use the `reviewer` agent on any PR-sized change before merging.
- Use the `qa` agent before claiming a feature "done".

## Obsidian vault

This project has a local-only vault at `.obsidian-vault/`. Follow the rules in `.obsidian-vault/README.md` for when to read/write it. Do NOT read the vault for trivial edits; do NOT write without a trigger.

## Common project paths

- Routes: `src/app/*`
- Reusable components: `src/components/*`
- Styles (global): `src/styles/*`
- Types (shared): `src/types/*`
- Config (AI persona, etc.): `src/config/*`
- Public assets: `public/*`
````

- [ ] **Step 3: Verify**

Run: `ls -la /Users/keatonjones/Projects/personal/dev-showcase/.claude/CLAUDE.md && head -5 /Users/keatonjones/Projects/personal/dev-showcase/.claude/CLAUDE.md`
Expected: file exists, starts with `# dev-showcase — project rules`.

---

## Task 13: Create project `dev-showcase/.claude/settings.json`

**Files:**
- Create: `dev-showcase/.claude/settings.json`

- [ ] **Step 1: Write the settings file**

Write `/Users/keatonjones/Projects/personal/dev-showcase/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run dev:*)",
      "Bash(npm run build:*)",
      "Bash(npm run lint:*)",
      "Bash(npm run start:*)",
      "Bash(npx next:*)",
      "Bash(npx tsc:*)",
      "Bash(curl -s -o /dev/null:*)"
    ]
  },
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'dev-showcase loaded. Stack: Next 15 + React 19 + TS + Tailwind 4 + Framer Motion + R3F + Spline. Vault at .obsidian-vault/ (see README.md for rules). Agents: reviewer, researcher, qa.'"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'file=\"$CLAUDE_TOOL_FILE_PATH\"; case \"$file\" in *.tsx|*.ts) cd /Users/keatonjones/Projects/personal/dev-showcase && npx tsc --noEmit --pretty false 2>&1 | grep -v \"^$\" | head -20 ;; esac' || true"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Verify valid JSON**

Run:
```bash
jq . /Users/keatonjones/Projects/personal/dev-showcase/.claude/settings.json > /dev/null && echo OK
```
Expected: `OK`

- [ ] **Step 3: Verify keys**

Run: `jq 'keys' /Users/keatonjones/Projects/personal/dev-showcase/.claude/settings.json`
Expected: `["hooks", "permissions"]`.

---

## Task 14: Create Obsidian vault `README.md` (the rules file)

**Files:**
- Create: `dev-showcase/.obsidian-vault/README.md`

- [ ] **Step 1: Ensure vault directory structure exists**

Run:
```bash
cd /Users/keatonjones/Projects/personal/dev-showcase
mkdir -p .obsidian-vault/{architecture,patterns,design-system,decisions,research,lessons}
```

- [ ] **Step 2: Write the vault README (Claude reads this BEFORE touching the vault)**

Write `/Users/keatonjones/Projects/personal/dev-showcase/.obsidian-vault/README.md`:

````markdown
# Obsidian Vault — Usage Rules for Claude

**This file is the gate. Read it before ANY read or write to the vault.**

This vault is a *local-only*, human-browsable knowledge base for the dev-showcase project. It is gitignored and must never be committed or pushed. It complements Claude's auto-memory (`~/.claude/projects/<project>/memory/`), which handles short indexed facts; the vault handles richer, on-demand documents.

## Folder map

| Folder | Purpose |
|---|---|
| `architecture/` | Component trees, data flow, rendering pipeline (one file per major area) |
| `patterns/` | Reusable code recipes (Framer Motion, R3F, Spline, page transitions) |
| `design-system/` | Source of truth for tokens (color, type, spacing, motion), voice, inspiration |
| `decisions/` | ADRs — dated, one per decision (context / decision / consequences) |
| `research/` | Researcher agent output — one file per research question, dated |
| `lessons/` | Post-feature / post-bug notes — one file per event, dated |

## File naming

- Kebab-case: `framer-motion-recipes.md`, not `FramerMotionRecipes.md`.
- Dated files: ISO prefix → `2026-04-21-hero-redesign.md`.
- Every file starts with a **1-sentence purpose line** so Claude can skim before reading in full.
- Use `[[obsidian-links]]` between related files — the graph becomes the map.

## When to READ the vault

Read when:
- The user mentions a feature / system / pattern likely documented ("the hero scene", "our motion tokens", "the page transition system").
- Starting design or architecture work on an existing area → check `architecture/<area>.md` first.
- About to propose a reusable pattern → check `patterns/` first to avoid reinvention.
- The `researcher` agent starts a task → MUST check `research/` first.
- The `reviewer` agent needs context on *why* a past decision was made → check `decisions/`.
- The user explicitly says "the vault" / "our docs" / "what does the vault say".

**Optimization:** read the 1-sentence purpose line first via `head -3`; only read the full file if relevant.

## When to NOT read the vault

Don't read when:
- Doing a trivial edit (typo, rename, small refactor).
- Answering a question whose answer is obvious from the code.
- Running a tool/command that doesn't need conceptual context (build, test, lint).

Cost discipline: reading a 2KB vault file is small; reading 15 of them for an unrelated task wastes tokens. Match vault reads to actual need.

## When to WRITE to the vault

Write when:
- User explicitly says: "document this", "save this to the vault", "write this up", "add an ADR for this".
- A non-trivial feature ships → append `lessons/YYYY-MM-DD-<feature>.md` (what we built, what we'd do differently, any gotchas).
- An architectural/library/pattern decision gets made → `decisions/YYYY-MM-DD-<decision>.md` using the ADR format:
  ```markdown
  # <Decision title>
  **Date:** YYYY-MM-DD
  ## Context
  ## Decision
  ## Consequences
  ```
- The `researcher` agent finishes → writes to `research/YYYY-MM-DD-<topic>.md` (always — even if short, to build the habit).
- A new reusable pattern crystallizes from real use → `patterns/<pattern-name>.md` (include a code snippet).
- Design tokens change → update `design-system/tokens.md` (single source of truth — don't duplicate values in architecture docs).

## When to NOT write to the vault

Don't write when:
- The info fits in auto-memory (one-liner preferences → `MEMORY.md` instead).
- The info is ephemeral / session-scoped (current task status, what you're about to do).
- It would duplicate existing vault content → UPDATE the existing file instead.
- The user hasn't explicitly asked, AND the change isn't ship-worthy (don't create vault noise).

## Content structure rule (for every vault file)

```markdown
# <Title>

<One-sentence purpose — what this file is for and when to read it.>

## <Section 1>
...
```

The 1-sentence purpose line is non-negotiable. It lets Claude skim the vault without opening every file.

## Linking

Use Obsidian `[[wikilinks]]` freely — they turn the vault into a graph. Example:
- `See [[framer-motion-recipes]] for the stagger pattern used here.`
- `This extends the decision in [[2026-03-15-why-spline-over-r3f]].`

Broken links are OK (Obsidian shows them highlighted); they signal where docs are missing.

## Git status

This entire folder is gitignored. Never `git add .obsidian-vault/<anything>`. If a git command might stage vault files, run targeted `git add <specific-file>` only.
````

- [ ] **Step 3: Verify**

Run:
```bash
ls /Users/keatonjones/Projects/personal/dev-showcase/.obsidian-vault/
grep -c "^## " /Users/keatonjones/Projects/personal/dev-showcase/.obsidian-vault/README.md
```
Expected: listing shows folders `architecture`, `decisions`, `design-system`, `lessons`, `patterns`, `research` + `README.md`. Grep returns ≥ 7 (sections).

---

## Task 15: Seed `.obsidian-vault/architecture/overview.md`

**Files:**
- Create: `dev-showcase/.obsidian-vault/architecture/overview.md`

- [ ] **Step 1: Read current src/ structure to seed accurately**

Run:
```bash
cd /Users/keatonjones/Projects/personal/dev-showcase
ls src/app src/components src/config src/styles src/types 2>&1
```
Record: the actual directory contents.

- [ ] **Step 2: Write `architecture/overview.md`**

Write `/Users/keatonjones/Projects/personal/dev-showcase/.obsidian-vault/architecture/overview.md`. Use the actual directory structure from Step 1. If the structure is not exactly as shown below, adjust to match what you saw.

````markdown
# Architecture Overview

One-stop map of how the dev-showcase site is organized. Read this before designing a new feature or refactoring across files.

## Stack

- Next.js 15 App Router
- React 19 (Server Components by default)
- TypeScript strict
- Tailwind 4
- Framer Motion (animation)
- @react-three/fiber + drei (hand-built 3D)
- @splinetool/react-spline (Spline-authored scenes)
- OpenAI SDK, Google APIs

## Top-level layout (`src/`)

```
src/
├── app/             # Routes (App Router). Each folder is a route segment.
├── components/      # Reusable cross-route components.
├── config/          # Runtime config (AI persona, constants).
├── styles/          # Global styles (globals.css, tailwind directives).
└── types/           # Shared TypeScript types.
```

## Rendering model

- **Server Components** by default. Data fetching happens on the server.
- **Client Components** (`"use client"`) for:
  - Anything using Framer Motion (requires browser APIs).
  - Anything using @react-three/fiber or Spline (WebGL).
  - Anything using React hooks (`useState`, `useEffect`, etc.).
- **`next/dynamic` with `ssr: false`** wraps heavy client components (3D scenes) so they don't bloat the server bundle and don't attempt SSR (which crashes on WebGL).

## Data flow

- Pages fetch data in the server component.
- Client components receive data via props (or `useState` for user-interaction).
- External APIs (OpenAI, Google) called server-side in route handlers (`app/api/*/route.ts`) — never expose keys to the client.

## Key dependencies and their roles

| Dependency | Role |
|---|---|
| `framer-motion` | All UI animation + page transitions |
| `@react-three/fiber` | Declarative Three.js — most 3D scenes |
| `@react-three/drei` | Helpers (Environment, OrbitControls, etc.) |
| `@splinetool/react-spline` | Embed Spline-authored 3D scenes |
| `openai` | Server-side AI calls |
| `googleapis` | Server-side Google API calls |
| `date-fns` | Lightweight date handling (prefer over moment) |
| `react-icons` | Icon set |
| `tagcloud` | 3D tag cloud component |

## Related vault docs

- [[tokens]] — color, type, spacing, motion tokens
- [[framer-motion-recipes]] — reusable animation patterns
- `decisions/` — architecture decision records (grows over time)

## Open questions / TODO

- [ ] Document the API route structure (`app/api/*`) when the first handler is added.
- [ ] Document the AI persona config format (`src/config/ai-persona.ts`) once stable.
````

- [ ] **Step 3: Verify**

Run: `head -3 /Users/keatonjones/Projects/personal/dev-showcase/.obsidian-vault/architecture/overview.md`
Expected: `# Architecture Overview` + 1-sentence purpose line.

---

## Task 16: Seed `.obsidian-vault/design-system/tokens.md`

**Files:**
- Create: `dev-showcase/.obsidian-vault/design-system/tokens.md`

- [ ] **Step 1: Read tailwind.config.js for actual tokens**

Run: `cat /Users/keatonjones/Projects/personal/dev-showcase/tailwind.config.js`
Record: any custom colors, spacing, fonts defined. If nothing custom, note it.

- [ ] **Step 2: Write `design-system/tokens.md`**

Write `/Users/keatonjones/Projects/personal/dev-showcase/.obsidian-vault/design-system/tokens.md`. Fill in the actual values from `tailwind.config.js` where they deviate from defaults.

````markdown
# Design Tokens

Single source of truth for color, type, spacing, and motion values. Update this file when tokens change — do not duplicate values in other vault docs.

## Color

(Replace with actual custom colors from `tailwind.config.js`. If using only Tailwind defaults, note "using Tailwind defaults" and list the semantic assignments below.)

| Token | Value | Use |
|---|---|---|
| `fg/primary` | TBD — check config | Body text |
| `fg/muted` | TBD | Secondary text |
| `bg/base` | TBD | Page background |
| `bg/elevated` | TBD | Card / surface |
| `accent/brand` | TBD | Primary CTA, links |
| `accent/warn` | TBD | Warnings |
| `accent/error` | TBD | Errors |

**Rule:** never use a color not in this table. If a new color is needed, add it here first.

## Typography

| Token | Family | Size (rem) | Weight | Use |
|---|---|---|---|---|
| `display/xl` | TBD | 4.5 (72px) | 700 | Hero |
| `display/lg` | TBD | 3.0 (48px) | 600 | Section title |
| `heading/xl` | TBD | 1.875 (30px) | 600 | Page heading |
| `heading/lg` | TBD | 1.5 (24px) | 600 | Subsection |
| `body/base` | TBD | 1.0 (16px) | 400 | Body copy |
| `body/sm` | TBD | 0.875 (14px) | 400 | Captions, meta |
| `mono/base` | TBD (monospace) | 0.875 (14px) | 400 | Code, tags |

**Rule:** two typefaces max (display + body), optionally a mono. Configure via `next/font` in `src/app/layout.tsx`.

## Spacing (Tailwind 8-point scale)

Use Tailwind's default scale: `0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128` (× 4px). Never invent one-off values like `p-[17px]`.

| Token | Tailwind class | Typical use |
|---|---|---|
| `space/xs` | `p-2` / `gap-2` (8px) | Icon/text gap |
| `space/sm` | `p-4` / `gap-4` (16px) | Card interior |
| `space/md` | `p-6` / `gap-6` (24px) | Component padding |
| `space/lg` | `p-12` / `gap-12` (48px) | Section gap |
| `space/xl` | `p-24` / `gap-24` (96px) | Major section margin |

## Motion tokens

| Token | Duration | Easing | Use |
|---|---|---|---|
| `motion/micro` | 150ms | `[0.22, 1, 0.36, 1]` | Hover, tap |
| `motion/component` | 300ms | `[0.22, 1, 0.36, 1]` | Modal, drawer |
| `motion/section` | 500ms | `[0.22, 1, 0.36, 1]` | Scroll reveal |
| `motion/page` | 800ms | `[0.22, 1, 0.36, 1]` | Page transition |
| `motion/hero` | 1200ms | `[0.22, 1, 0.36, 1]` | Hero orchestration |

Single easing family across the entire site: `[0.22, 1, 0.36, 1]` (ease-out-quart). Do not mix cubic-beziers.

## Radius

| Token | Tailwind | Use |
|---|---|---|
| `radius/sm` | `rounded` (4px) | Tags, badges |
| `radius/md` | `rounded-lg` (8px) | Buttons, inputs |
| `radius/lg` | `rounded-2xl` (16px) | Cards |
| `radius/xl` | `rounded-[32px]` (32px) | Large media |
| `radius/full` | `rounded-full` | Pills, avatars |

## Breakpoints

| Name | Min width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

Mobile-first: write base styles for < 640px, add `sm:` / `md:` / `lg:` as needed.

## Related vault docs

- [[overview]] — architecture overview
- [[framer-motion-recipes]] — uses motion tokens above
````

- [ ] **Step 3: Verify**

Run: `head -3 /Users/keatonjones/Projects/personal/dev-showcase/.obsidian-vault/design-system/tokens.md`
Expected: title + 1-sentence purpose line.

---

## Task 17: Seed `.obsidian-vault/patterns/framer-motion-recipes.md`

**Files:**
- Create: `dev-showcase/.obsidian-vault/patterns/framer-motion-recipes.md`

- [ ] **Step 1: Write the patterns file**

Write `/Users/keatonjones/Projects/personal/dev-showcase/.obsidian-vault/patterns/framer-motion-recipes.md`:

````markdown
# Framer Motion Recipes

Reusable animation patterns for this project. Use these instead of inventing new ones. All recipes use the project's single easing curve `[0.22, 1, 0.36, 1]` (see [[tokens]]).

## Recipe 1: Staggered list reveal on scroll

Reveals a list's children with a 40ms stagger as the list enters the viewport. Works for any `.map()`-rendered list (projects, skills, logos).

```tsx
"use client";
import { motion, useReducedMotion } from "framer-motion";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const item = (reduce: boolean) => ({
  hidden: { opacity: 0, y: reduce ? 0 : 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
});

export function StaggeredList({ children }: { children: React.ReactNode[] }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.ul
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      className="space-y-4"
    >
      {children.map((c, i) => (
        <motion.li key={i} variants={item(reduce)}>{c}</motion.li>
      ))}
    </motion.ul>
  );
}
```

**Anti-pattern:** longer stagger (e.g., 200ms) makes a 10-item list take 2 seconds — sluggish.

## Recipe 2: Page transition (App Router)

Fade + 8px y-slide on route change. See the `page-transitions` skill for full context.

```tsx
"use client";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
```

Usage: wrap `{children}` in `src/app/layout.tsx` with this component (after `"use client"` is acceptable — the wrap costs little).

## Recipe 3: Scroll-linked parallax

Element moves at a different scroll rate than the page. Use SPARINGLY — too much parallax reads as generic.

```tsx
"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  return (
    <div ref={ref} className="overflow-hidden">
      <motion.img src={src} alt={alt} style={{ y }} className="w-full" />
    </div>
  );
}
```

**Rule:** parallax amount max ±10–15%. More and it starts to feel like the page is broken.

## Related vault docs

- [[tokens]] — motion tokens used above
- [[overview]] — where these patterns fit in the architecture
````

- [ ] **Step 2: Verify**

Run: `head -3 /Users/keatonjones/Projects/personal/dev-showcase/.obsidian-vault/patterns/framer-motion-recipes.md`
Expected: title + 1-sentence purpose line.

---

## Task 18: Verification — restart Claude session and smoke test

**This task must be done by the USER (not Claude) since it requires a session restart to pick up new global CLAUDE.md / skills / agents / hooks.**

- [ ] **Step 1: User restarts Claude session**

Close the current Claude Code session and open a new one in `/Users/keatonjones/Projects/personal/dev-showcase`.

- [ ] **Step 2: Confirm CLAUDE.md files loaded**

In the new session, ask: "What's in your global CLAUDE.md and this project's CLAUDE.md?"
Expected: Claude summarizes the content of both files.

- [ ] **Step 3: Confirm skills are listed**

Ask: "List the skills you have available."
Expected: the 9 new skills (taste, immersive-aesthetic, web-design-principles, ui-ux-patterns, motion-design, page-transitions, three-d-web, accessibility, performance-web) appear alongside the superpowers skills.

- [ ] **Step 4: Confirm agents are available**

Ask: "What agents do you have? Tell me about the reviewer, researcher, and qa agents."
Expected: Claude describes the three new agents and their roles.

- [ ] **Step 5: Smoke-test the reviewer agent**

Ask: "Use the reviewer agent to review the most recent commit."
Expected: the reviewer agent runs, reads `git diff`, invokes relevant skills, returns a confidence-filtered report with CRITICAL/HIGH/MEDIUM tags (or "No actionable issues found").

- [ ] **Step 6: Smoke-test the researcher agent**

Ask: "Use the researcher agent to research best practices for hero section animations on portfolio sites."
Expected: the agent checks the vault first, does web research if needed, writes a file to `.obsidian-vault/research/2026-04-21-hero-animations.md`, returns a short summary.

- [ ] **Step 7: Smoke-test the qa agent**

Ask: "Run the qa agent on the current state of the project."
Expected: the agent runs build + typecheck + lint + smoke test, returns a pass/fail table with evidence.

- [ ] **Step 8: Confirm hook fires**

Edit any `.ts` or `.tsx` file (trivial change — add a space and undo), observe that the PostToolUse hook runs `tsc --noEmit` and surfaces any errors.

- [ ] **Step 9: Confirm gitignore works**

Run: `git status --short`
Expected: `.claude/` and `.obsidian-vault/` are NOT listed as untracked. Only legitimate source changes (if any) appear.

- [ ] **Step 10: (Optional) Commit — only if user approves**

If the user wants the spec, plan, and gitignore committed:

```bash
cd /Users/keatonjones/Projects/personal/dev-showcase
git add .gitignore docs/superpowers/specs/2026-04-21-claude-config-design.md docs/superpowers/plans/2026-04-21-claude-config-implementation.md
git commit -m "chore: add Claude config spec + plan, gitignore .claude/ and .obsidian-vault/"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ 9 skills — Tasks 4–8
- ✅ 3 agents — Tasks 9–11
- ✅ Global CLAUDE.md + settings.json — Tasks 2–3
- ✅ Project CLAUDE.md + settings.json — Tasks 12–13
- ✅ Obsidian vault (README + 3 seed files, empty folders for ADR/research/lessons) — Tasks 14–17
- ✅ Gitignore both `.claude/` and `.obsidian-vault/` — Task 1
- ✅ Verification phase — Task 18
- ✅ `@`-reference avoidance rule — in global CLAUDE.md "Token hygiene" section
- ✅ Vault read/write triggers — in vault README.md

**Placeholder scan:** none of the forbidden patterns (TBD for things that need to exist, "fill in later", "similar to Task N"). The `tokens.md` has "TBD" placeholders for actual token values that must be read from `tailwind.config.js` at execution time — this is intentional and the step instructs how to fill them in.

**Type/name consistency:** skill names match between their files (`name:` frontmatter) and references in CLAUDE.md / agents. Agent names consistent. File paths use absolute paths throughout.

Plan complete.
