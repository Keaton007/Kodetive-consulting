# Claude Code Configuration Design — `.claude/` + Obsidian Vault

**Date:** 2026-04-21
**Author:** Keaton (with Claude brainstorming assistance)
**Status:** Approved, ready for implementation plan
**Goal:** Build a hybrid `.claude/` setup (global + project) plus an Obsidian vault to 10x development output on the `dev-showcase` Next.js site.

---

## Context

`dev-showcase` is a personal portfolio site built on Next.js 15.3.3 (App Router), React 19, TypeScript (strict), Tailwind 4, Framer Motion, @react-three/fiber + drei, @splinetool/react-spline, OpenAI SDK, and Google APIs. The site leans into an **immersive / Awwwards-style aesthetic** — 3D models, video, motion, page transitions, visual impact.

No `.claude/` currently exists in the repo. The user has the superpowers plugin installed globally.

## Goals

1. Provide reusable **skills** for design taste, web/UI/UX fundamentals, motion, 3D, accessibility, and performance.
2. Provide workflow **agents** for code review, research, and QA.
3. Enforce **rules** via CLAUDE.md (judgment) and hooks (mechanics).
4. Establish an **Obsidian vault** for long-term, human-browsable project memory with clear read/write triggers.
5. Keep everything aligned with an immersive/Awwwards-style design direction.

## Non-goals

- Not installing Obsidian itself (user's local app install).
- Not setting up cloud sync for the vault (user's choice).
- Not wiring CI — hooks fire locally only.
- Not auto-generating full vault content — seed only; grows organically.

---

## Architecture: Four layers, one job each

| Layer | Lives in | Job |
|-------|----------|-----|
| Knowledge | `~/.claude/skills/` | Reusable domain expertise (taste, motion, 3D, a11y…) |
| Workflows | `~/.claude/agents/` | Orchestrate skills into specific jobs (review, research, QA) |
| Rules | `CLAUDE.md` (global + project) + `settings.json` hooks | Judgment rules (CLAUDE.md) + mechanical enforcement (hooks) |
| Long-term memory | `dev-showcase/.obsidian-vault/` | Human-browsable, read-on-demand knowledge base |

**Auto-memory (`~/.claude/projects/.../memory/`) is separate** — the existing Claude built-in system for short, auto-loaded indexed facts. The vault complements it; does not replace it.

---

## Folder layout

```
~/.claude/                           # GLOBAL
├── CLAUDE.md                        # Global coding philosophy + taste rules
├── settings.json                    # Global hooks + permission allowlist
├── skills/
│   ├── taste/
│   ├── immersive-aesthetic/
│   ├── web-design-principles/
│   ├── ui-ux-patterns/
│   ├── motion-design/
│   ├── page-transitions/
│   ├── three-d-web/
│   ├── accessibility/
│   └── performance-web/
└── agents/
    ├── reviewer.md
    ├── researcher.md
    └── qa.md

/Users/keatonjones/Projects/personal/dev-showcase/
├── .claude/                         # PROJECT
│   ├── CLAUDE.md                    # Project conventions
│   └── settings.json                # Project hooks
├── .obsidian-vault/                 # LOCAL-ONLY (gitignored)
│   ├── README.md                    # Read/write rules for Claude
│   ├── architecture/
│   │   └── overview.md              # Seeded
│   ├── patterns/
│   │   └── framer-motion-recipes.md # Seeded
│   ├── design-system/
│   │   └── tokens.md                # Seeded
│   ├── decisions/                   # ADRs (empty, grows over time)
│   ├── research/                    # Researcher agent output (empty)
│   └── lessons/                     # Post-feature/post-bug (empty)
└── .gitignore                       # Must include `.obsidian-vault/`
```

---

## Skills (9 total, global)

Each skill is a single markdown file with this structure:

```
---
name: <skill-name>
description: <when to invoke — specific triggers>
---
## Principles
## Examples
## Anti-patterns
## Checklist
```

### 1. `taste/`
The aesthetic judge. Given a design/screenshot/code producing UI, answers: "Is this intentional or AI-slop?" Flags generic patterns (stock purple→pink gradients, default glassmorphism, center-stacked hero+CTA, overused blurred blobs). Distinguishes restraint from boring.

### 2. `immersive-aesthetic/`
The taste anchor for Awwwards-tier sites. Principles: hero moments, cinematic pacing, typography as hero element, motion as narrative (not decoration), 3D as substance, considered asymmetry, confident whitespace. Defines what "10x quality" looks like for this direction.

### 3. `web-design-principles/`
Layout fundamentals: grid systems, visual hierarchy, whitespace, scale, contrast, 8-point system, responsive breakpoints, container queries.

### 4. `ui-ux-patterns/`
Interaction depth: affordances, feedback, empty/loading/error states, form design, navigation, progressive disclosure. Fitt's law, Hick's law, Miller's 7±2.

### 5. `motion-design/`
Easing curves (ease-out for enter, ease-in for exit), duration rules (150ms micro / 300–500ms component / 800ms+ page), stagger, orchestration, physics-based motion, `prefers-reduced-motion` compliance.

### 6. `page-transitions/`
Concrete Framer Motion + View Transitions API patterns: layout animations, shared element transitions, scroll-driven reveals, App Router route transitions.

### 7. `three-d-web/`
Three.js + R3F + Spline patterns: scene setup, lighting rigs, glTF/draco optimization, post-processing restraint, perf budgets (draw calls, polys, texture sizes), mobile fallbacks.

### 8. `accessibility/`
WCAG 2.2 AA floor: semantic HTML, keyboard nav, focus management, ARIA only-when-needed, color contrast, motion sensitivity. Specifically addresses the hardest case: keeping immersive sites accessible.

### 9. `performance-web/`
Core Web Vitals (LCP, INP, CLS), bundle discipline, image optimization, lazy loading, code splitting, `next/dynamic` for heavy 3D, font loading strategy.

---

## Agents (3 total, global)

Each agent is a markdown file with frontmatter (name, description, allowed tools, model) and a system prompt that defines workflow + output contract.

### 1. `reviewer.md` — Code & Design Reviewer

- **When invoked:** after a feature is implemented; before commit/PR; on "review this"
- **Tools allowed:** Read, Grep, Glob, Bash (read-only: git diff, lint, typecheck), Skill
- **Workflow:**
  1. Read the diff or specified files
  2. Invoke relevant skills: `taste`, `accessibility`, `performance-web`, `motion-design`, `immersive-aesthetic`
  3. Run mechanical checks: `tsc --noEmit`, `next lint`
  4. Scan for forbidden patterns (`console.log` in src, `any` without justification, inline styles when Tailwind would do)
  5. Confidence filter: only report issues with >70% confidence
- **Output contract:** `[CRITICAL] / [HIGH] / [MEDIUM]` tags, `file:line` references, suggested fix. No nitpicks.

### 2. `researcher.md` — Web & Codebase Researcher

- **When invoked:** before designing new features; "how do other sites do X"; library/pattern comparison
- **Tools allowed:** WebFetch, WebSearch, Read, Grep, Glob, Write (vault only)
- **Workflow:**
  1. Clarify the research question
  2. **First check `.obsidian-vault/research/` and `/patterns/`** — don't redo existing research
  3. Web research from Awwwards, Godly, Lapa Ninja, official docs, GitHub repos
  4. Synthesize: 3–5 concrete patterns, tradeoffs, recommendation
  5. **Always write findings to `.obsidian-vault/research/YYYY-MM-DD-<topic>.md`**
- **Output contract:** short summary in chat + vault file path.

### 3. `qa.md` — Quality Assurance

- **When invoked:** before user tests manually; before claiming "done"; on request
- **Tools allowed:** Bash (run dev server, lighthouse CLI, axe-core), Read, Grep, Skill
- **Workflow:**
  1. `next build` passes
  2. `tsc --noEmit` passes
  3. `next lint` passes
  4. If UI change: start dev server, load route, check console for errors/warnings
  5. Invoke skills: `accessibility` (axe-core check), `performance-web` (lighthouse budget), `motion-design` (reduced-motion compliance)
  6. Smoke-test happy path + one edge case
- **Output contract:** pass/fail checklist with evidence (command output, screenshots if possible). Never claim "works" without proof.

### Shared agent rules

- Always report evidence, never assertions.
- Reviewer & researcher are read-only for source code (researcher may only write to vault).
- QA may execute scripts but not modify code.
- Confidence filter: only surface findings at >70% confidence.

---

## Rules

### Global `~/.claude/CLAUDE.md` (judgment rules)

Topics:
- Clarity over cleverness
- YAGNI & minimalism (three similar lines beats a premature helper)
- No dead comments (only the *why* of non-obvious code)
- Taste as a gate before shipping UI
- Evidence over assertion (never "works/fixed/done" without running the check)
- Root-cause over workaround
- Security hygiene (never log secrets; validate at boundaries only)
- Naming beats comments
- **Avoid `@`-file references** — use `Read` / `Grep` instead to conserve tokens; only use `@` when the full file genuinely must be in context

### Project `dev-showcase/.claude/CLAUDE.md`

- Stack: Next.js 15 App Router, React 19, TS strict, Tailwind 4, Framer Motion, R3F, Spline
- Server Components by default; `"use client"` only when needed
- Animations via Framer Motion (not raw CSS keyframes); always respect `prefers-reduced-motion`
- 3D: heavy scenes via `next/dynamic` with SSR off; mobile fallbacks; track poly/texture budgets
- File conventions: feature folders under `src/app/` or `src/components/`; types in `src/types/`
- Vault pointer: "For architecture/patterns/design questions, follow rules in `.obsidian-vault/README.md`"

### Global `~/.claude/settings.json` (mechanical hooks)

- **PostToolUse** on Edit/Write of `*.ts|*.tsx` → run `tsc --noEmit` and surface errors
- **PreToolUse** on `git commit` → block if `npm run lint` or `npm run build` fails
- **Permission allowlist** — pre-approve safe commands: `npm run *`, `next *`, `tsc *`, `git status/diff/log/show`, `ls`, read-only Bash, standard `Read`/`Grep`/`Glob`

### Project `dev-showcase/.claude/settings.json`

- **PostToolUse** on `*.tsx` edit → `next lint --file <path>`
- **PreToolUse** on `git commit` → block if `next build` fails
- **SessionStart** → print stack reminder + vault rules pointer
- **Stop** → if uncommitted `.tsx` files exist, remind to run QA agent

---

## Obsidian Vault

### Structure

```
.obsidian-vault/
├── README.md                        # Read/write rules (the critical file)
├── architecture/
│   ├── overview.md                  # Seeded from src/ structure
│   └── <feature>.md                 # Grows per feature
├── patterns/
│   └── framer-motion-recipes.md     # Seeded with 2–3 starter recipes
├── design-system/
│   └── tokens.md                    # Seeded from tailwind.config.js
├── decisions/                       # ADRs (empty, grows organically)
├── research/                        # Researcher output (empty)
└── lessons/                         # Post-feature notes (empty)
```

### Read triggers (in `README.md`)

Claude **reads** the vault when:
- User mentions a feature/system/pattern likely documented (hero scene, page transitions, motion tokens)
- Starting design/architecture work on an existing area → check `architecture/<feature>.md`
- About to propose a pattern → check `patterns/`
- Researcher agent starts → check `research/`
- Reviewer agent needs context on a decision → check `decisions/`
- User explicitly says "the vault" / "our docs"

Claude **does NOT read** the vault when:
- Trivial edits (typo, rename, small refactor)
- Code-obvious answers
- Tool/command runs that don't need conceptual context

### Write triggers (in `README.md`)

Claude **writes** to the vault when:
- User says "document this" / "save to the vault" / "write this up"
- Non-trivial feature ships → `lessons/YYYY-MM-DD-<feature>.md`
- Architectural/library/pattern decision → `decisions/YYYY-MM-DD-<decision>.md` (ADR: context, decision, consequences)
- Researcher agent finishes → `research/YYYY-MM-DD-<topic>.md`
- Reusable pattern crystallizes → `patterns/<pattern>.md`
- Design tokens change → update `design-system/tokens.md`

Claude **does NOT write** to the vault when:
- Info fits in auto-memory (one-liners → `MEMORY.md`)
- Ephemeral/session-scoped info
- Duplicates existing file → update existing instead
- No explicit user ask and change isn't "ship-worthy" (avoid noise)

### File conventions

- Kebab-case filenames
- Dated files get ISO prefix: `2026-04-21-hero-redesign.md`
- Every file starts with a 1-sentence purpose line (enables skim-before-read)
- Use `[[obsidian-links]]` between related files — the graph becomes the map

### Git: gitignored, never committed

`.obsidian-vault/` is local-only. `dev-showcase/.gitignore` must include the entry. Vault stays on this machine; no backup, no sharing, no public exposure.

---

## Integration points

- **Skills ↔ Agents:** agents invoke skills via the `Skill` tool in their system prompts.
- **Project CLAUDE.md ↔ Vault:** points Claude to read `.obsidian-vault/README.md` before vault ops.
- **Auto-memory ↔ Vault:** `MEMORY.md` entries carry "see vault" pointers where relevant.
- **Hooks ↔ Agents:** `Stop` hook reminds about QA agent if UI files are uncommitted.
- **Researcher ↔ Vault:** researcher *always* writes output to `research/` (even short results) to build the habit.

---

## Build sequence

**Phase 1 — Global foundation**
1. `~/.claude/CLAUDE.md`
2. `~/.claude/settings.json` (hooks + permissions)
3. All 9 skills in `~/.claude/skills/`

**Phase 2 — Global agents**
4. `~/.claude/agents/reviewer.md`
5. `~/.claude/agents/researcher.md`
6. `~/.claude/agents/qa.md`

**Phase 3 — Project scope**
7. `dev-showcase/.claude/CLAUDE.md`
8. `dev-showcase/.claude/settings.json`
9. Ensure `.obsidian-vault/` is in `dev-showcase/.gitignore`

**Phase 4 — Obsidian vault**
10. `dev-showcase/.obsidian-vault/README.md` (rules)
11. Seed content: `architecture/overview.md`, `design-system/tokens.md`, `patterns/framer-motion-recipes.md`

**Phase 5 — Verification**
12. Restart Claude session; confirm CLAUDE.md loads, hooks fire, agents are listed.
13. Smoke test: ask reviewer agent to review a recent file; confirm output.
14. Confirm `git status` does not show `.obsidian-vault/` as a tracked path.

---

## Success criteria

- All files created in correct locations with working frontmatter.
- Running `tsc --noEmit` / `next lint` / `next build` from Claude triggers hooks correctly.
- Invoking the reviewer agent on a real file produces actionable, confidence-filtered output.
- Invoking the researcher agent produces a vault file under `research/`.
- Invoking the QA agent produces evidence-backed pass/fail.
- `.obsidian-vault/` present on disk, readable by Claude, *not* staged by git.
- Auto-memory `MEMORY.md` includes pointers to feedback and vault rules.

## Open questions / deferred decisions

- None at spec time. (Content depth of individual skill files will be decided during implementation; spec defines structure only.)
