# Roadmap, Versioning, Git & Release Strategy — ViewGrid

Roadmap horizon: Planning → MVP (v0.1.x) → V2 (v0.2–0.4) → V3 (v0.5–0.7) → Future (v1.0+).
Feature IDs (F-xxx) refer to `docs/PRD.md` §7. Feasibility notes refer to
`docs/ARCHITECTURE.md` → API Capability Matrix.

---

## 1. Milestones

### M0 — Planning (DONE)

- Research (competitors, Firefox/Chromium WebExtension API limits) — done.
- Documentation package (PRD, ARCHITECTURE, SECURITY, PRIVACY, UX, TESTING, DEVICE_SPEC, COMPETITIVE_ANALYSIS, ROADMAP) — done.
- Master task breakdown (`TASK.md`) — done.
- **No code written** — per project rule.

### M1 — MVP (v0.1.0) — “Useful daily driver” *(implementation started 2026-09-21)*

Goal: a developer can open a site, see it in 3–8 device viewports, interact with sync,
spot the most common responsive breakages, and export screenshots.

Scope (see TASK.md → milestones 1–11):

| Area | Included |
| --- | --- |
| Foundation | TS + Vite + React + manifest generation (FF MV3) + lint/format/test setup |
| Platform layer | `browser.*` abstraction (runtime, storage, tabs capture, permissions, menus, commands) |
| Workspace | Tab-based workspace, popup launcher, URL bar, layouts (grid/row/column), viewport CRUD, focus, fullscreen |
| Viewport engine | Per-viewport size/orientation/zoom, drag & reorder, minimize/maximize/hide/duplicate |
| Devices | Preset catalog (phone/tablet/laptop/desktop), custom devices (CRUD + favorite), orientation swap |
| Embedding | Managed framing adapter (scoped XFO/CSP frame-ancestors handling), localhost support, blocked-frame UX |
| Sync | Scroll, click, navigation + loop prevention, throttling |
| Screenshots | Single / all / workspace, frame on-off, PNG/JPG, full-page (single viewport) |
| Issue detection | Horizontal overflow, text clipping, out-of-viewport elements, small tap targets |
| Persistence | Workspace save/load (local), draft autosave |
| UX | Dark/light, keyboard map (defaults + in-app remap), progressive disclosure |
| Testing | Unit + integration baseline, `web-ext lint`, first E2E smoke on Firefox |

Explicitly **not** in MVP (planned, not dropped): video, annotation, design overlay,
regression, reports, AI, presentation mode, free-form layout, full simulation suite —
all scheduled below.

### M2 — V2 (v0.2.x – v0.4.x) — “Complete workbench”

- v0.2 — **Depth**: sync input/form/keyboard/reload; element measurement + outline; grid/ruler/mouse coords; breakpoint inspector; free-form layout + resize; custom zoom; workspace export/import; named presets; device frames (cosmetic) with status bar/notch/safe-area guides.
- v0.3 — **Capture studio**: screenshot annotation (arrow/rect/circle/text/highlight/blur/measure); workspace & multi full-page capture; design overlay (PNG/JPG/SVG); presentation mode.
- v0.4 — **Record & compare**: video recording (canvas-composite WebM + display-capture mode, mic opt-in, FPS/resolution); regression baselines with overlay / side-by-side / difference views; reports (HTML, JSON, PDF via print).

### M3 — V3 (v0.5.x – v0.7.x) — “Intelligence & fidelity”

- v0.5 — **Simulation suite**: UA (JS override + HTTP header rewrite, per-viewport mapping); environment inspection (color-scheme / reduced-motion / forced-colors *reporting* — emulation impossible, documented); synthetic network delays + workspace offline toggle (experimental).
- v0.6 — **Checks framework**: responsive issue detection full set (overlap, fixed-cover, clipped content, breakpoint anomalies); accessibility rule framework + core rules (tap target, contrast, focus visibility, text readability); issue → report integration.
- v0.7 — **AI analysis (opt-in)**: provider-agnostic adapters (OpenAI-compatible, Anthropic, local/ custom endpoint); per-request consent with exact payload preview; Fix-Prompt generator (offline templates + AI polish); privacy controls in SECURITY/PRIVACY UX.

### M4 — Future / Experimental (v1.0+)

- Chromium port hardening (Chrome Web Store + Edge Add-ons) — port work starts in parallel from v0.2 (abstraction layer), GA at v1.0.
- Element-to-element distance measuring, video GIF export, team share links (local files only unless privacy model changes), CI-mode baseline runner (web-ext + scripts), locale packs (TR/EN), Sizzy/PolyPane-class pane insights.

---

## 2. Versioning

- **SemVer** from v1.0.0 onwards: `MAJOR.MINOR.PATCH`.
- Store builds and GitHub releases always match an annotated git tag (e.g. `v1.0.0`).

## 3. Git Strategy

- **Trunk-based development**: short-lived branches off `main`, merged fast.
  - `feat/<scope>`, `fix/<scope>`, `docs/<scope>`, `chore/<scope>`, `perf/<scope>`, `test/<scope>`
- **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `perf:`, `chore:`, `refactor:`; scope = module: `sync`, `capture`, `devices`, `ui`, `platform`, …).
- **Release tags**: `v1.0.0`, `v1.0.1`, … annotated tags on `main`.
- **Release branches** for store submission stabilization: `release/v1.0` cut at RC.
- **CHANGELOG.md**: Keep-a-Changelog format, updated in every release PR.
- No commits before planning approval (this milestone satisfies the “no unnecessary commits” rule; the first commit will be `chore: initialize project skeleton` in Foundation).

## 4. Release Strategy

1. `npm run build:firefox` → `web-ext lint` clean (CI gate).
2. Test suite green (unit + integration + Firefox E2E smoke).
3. CHANGELOG finalized; version bumped in manifest source.
4. Tag `vX.Y.Z`; build artifact archived.
5. **AMO**: submit listed add-on via `web-ext sign` (API credentials in CI secrets) or manual upload; respond to review questions using `docs/SECURITY.md` + `docs/PRIVACY.md` (AMO reviewers will ask about header modification permissions — answers prepared there).
6. Post-release smoke on a clean Firefox profile.
7. Chromium track (from v1.0 plan): same tag, `build:chromium` artifact → Chrome Web Store manual upload first; automate later.

Rollback: AMO self-unpublish previous version is not possible for listed versions — ship hotfix `PATCH` immediately; keep store listing “version notes” current.

## 5. Store Listing Plan (AMO)

- Name: **ViewGrid** (decided — no “Firefox” trademark; branding polish tracked in TASK.md → Release).
- Listing copy + screenshots prepared during v0.4 (presentation-mode captures).
- Privacy policy link = `docs/PRIVACY.md` rendered content (local-first, no accounts).
- Categories: Web Development Tools; Tags: responsive, viewport, developer tools.
- Source code submission readiness: clean, documented repo (AMO source review).
