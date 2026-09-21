# ViewGrid

> **Status: v0.1 MVP core implemented and tested** — `dist/` is a loadable Firefox MV3
> extension (31 unit tests green, `web-ext lint` 0 errors). Living checklist: [`TASK.md`](TASK.md).

**ViewGrid** is a professional **responsive web testing / multi-device preview
WebExtension** — Firefox-first (AMO), architected to port to Chrome / Chromium with
minimal changes.

Open a site once, see it live in many device viewports (phone / tablet / laptop /
desktop / custom), interact in one viewport and optionally synchronize the rest, find
responsive issues, and capture screenshots. Not a device-frame simulator — a
**responsive development workspace**.

---

## Build & Run

```bash
npm install
npm test                # unit tests (core: sync, layout, devices, capture, issues)
npm run typecheck       # tsc --noEmit
npm run build:firefox   # → dist/ (MV3, web-ext lint clean: 0 errors)
npm run dev:firefox     # build + web-ext run (opens Firefox with the add-on)
npm run build:chromium  # port-target build (adapters still Firefox-first)
```

Load manually: `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on…* →
select `dist/manifest.json`.

**First run:** open the toolbar popup → *Enable site access* (optional host permission;
required for framing XFO/CSP-protected sites, sync and screenshots) → *Open workspace*.
Keyboard: `A` add · `C` screenshot · `Shift+C` all · `S` sync · `G` layout · `F` focus ·
`I` issues · `O` rotate · `Shift+R` reload all · `Alt+Shift+V` open workspace.

---

## Documentation Map

| Document | Purpose |
| --- | --- |
| [`TASK.md`](TASK.md) | **Master implementation checklist** (living, atomic, dependency-ordered) |
| [`docs/PRD.md`](docs/PRD.md) | Product Requirements Document (vision → roadmap → risks) |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Architecture, browser abstraction, sync engine, tech stack |
| [`docs/COMPETITIVE_ANALYSIS.md`](docs/COMPETITIVE_ANALYSIS.md) | Competitive feature matrix + gap analysis |
| [`docs/DEVICE_SPEC.md`](docs/DEVICE_SPEC.md) | Device profile schema + preset catalog plan |
| [`docs/UX.md`](docs/UX.md) | UX architecture, IA, interaction model |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Permissions model, framing policy, threat model |
| [`docs/PRIVACY.md`](docs/PRIVACY.md) | Privacy defaults, data inventory, AI opt-in policy |
| [`docs/TESTING.md`](docs/TESTING.md) | Test strategy + Definition of Done |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | MVP / V2 / V3 milestones, git & release strategy |

---

## Vision

Web developers need to verify a site across many viewport sizes continuously. ViewGrid
gives Firefox a **fast, clean, local-first, developer-focused workspace** where a site is
rendered simultaneously in many viewport sizes — with synchronized interaction,
developer overlays, measurement, screenshots, annotation, video, regression baselines
and reports (see PRD for the full tiered scope).

## Target Users

1. **Frontend developers** — continuous responsive QA (Vite/Next.js/React/Vue on localhost)
2. **UI/UX designers** — pixel comparison against design references
3. **QA engineers** — repeatable multi-device checks, baselines, diff reports
4. **Agencies / freelancers** — client demos in presentation mode

## Architecture Snapshot

```text
ui/ (React: workspace, popup, options)  →  core/ (pure TS: sync protocol, devices,
layout, capture math, issue detectors)  →  platform/browser.ts (typed WebExtension
facade)  →  background (framing policy, router, capture) + content agents (per frame)
```

- **Managed framing:** XFO/CSP `frame-ancestors` relaxation scoped to `sub_frame`s of
  workspace tabs only (SECURITY.md §4)
- **Sync:** epoch/seq/apply-guard loop-proof event protocol (`core/sync/protocol.ts`)
- **Capture:** Firefox `tabs.captureTab` + DPR-correct client crop
- **Privacy:** no analytics, no tracking, no external requests — local-only storage

Key decisions and the full API capability matrix (what Firefox/Chromium can and cannot
emulate — DPR, media features, throttling…): [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Repository Layout

```text
viewgrid/
├── README.md · TASK.md · package.json · vite.ui.config.ts · vitest.config.ts
├── docs/            # PRD, ARCHITECTURE, SECURITY, PRIVACY, UX, TESTING, …
├── scripts/         # build.mjs (vite+esbuild+manifest), gen-icons.mjs, manifest.mjs
├── src/
│   ├── core/        # browser-agnostic logic (devices, workspace, sync, capture, issues)
│   ├── platform/    # typed WebExtension facade
│   ├── background/  # framing policy, message router, capture, menus, commands
│   ├── content/     # per-frame sync/scan agent
│   └── ui/          # workspace / popup / options (React + CSS Modules)
└── tests/unit/      # core test suite (Vitest)
```

## Naming & License

Store name **ViewGrid** (decided). Logo/icon set: generated placeholder icons ship now;
branding polish tracked in TASK.md → Release. License: TBD (MIT vs MPL-2.0).

## Status Summary (2026-09-21)

**Done (v0.1 MVP core):** workspace shell (popup + tab), multi-viewport cards
(21 presets + custom devices, orientation, zoom, minimize/hide/duplicate/remove/reorder,
focus mode), grid/row/column layouts, URL bar + back/forward/reload-all, managed framing
(workspace-tab-scoped XFO/CSP policy + permission onboarding), sync scroll/click/nav
with loop-proof protocol, screenshots (single/batch/workspace, HiDPI crop), issue
scanning (overflow, text clip, out-of-viewport, tap targets) + panel, workspace
save/load/autosave, dark/light, keyboard map, 31 unit tests, `web-ext lint` 0 errors.

**Next (live list in TASK.md):** real-Firefox smoke, remaining sync channels, simulation
(UA/env/network), device frames, dev tools + measurement, annotation, design overlay,
full-page capture, video, presentation mode, regression diffs, reports, a11y framework,
AI (opt-in), Chromium adapter parity.
