# Product Requirements Document — ViewGrid

- **Working name:** **ViewGrid** (decided 2026-09-21 — store-safe, no “Firefox” trademark)
- **Status:** Implementation in progress — v0.1 MVP core (see `../TASK.md` live state)
- **Target platform (first):** Firefox (AMO), Manifest V3 WebExtension
- **Portability target:** Chrome / Chromium / Edge with minimal changes
- **Date:** 2026-09-21
- **Related docs:** ARCHITECTURE, COMPETITIVE_ANALYSIS, DEVICE_SPEC, UX, SECURITY, PRIVACY, TESTING, ROADMAP, TASK.md

---

## 1. Product Vision

> A web developer must be able to test a website simultaneously across many devices and
> viewport sizes — quickly, cleanly, professionally. The extension is not a device-frame
> simulator; it is a **responsive development workspace**.

Canonical flow:

```text
Developer opens website
        ↓
Extension opens Responsive Workspace
        ↓
Multiple devices appear
        ↓
Developer interacts with one viewport
        ↓
Other viewports optionally synchronize
        ↓
Developer identifies responsive issues
        ↓
Screenshot / report / annotation
        ↓
Optional AI analysis
```

Principles: **local-first**, **privacy by default**, **developer-dense but calm UI**,
**honest about platform limits**, **portable architecture**.

## 2. Problem

Responsive testing today forces context-switching between DevTools presets (one size at
a time), external web tools (upload/remote rendering, privacy concerns), and paid desktop
apps (heavy, not browser-integrated). Rapid comparison across breakpoints, synchronized
interaction, and issue evidence gathering are fragmented across tools. Firefox in
particular lacks a first-class multi-viewport extension.

## 3. Target Users

| Persona | Need | Priority |
| --- | --- | --- |
| Frontend developer (localhost workflows) | See all breakpoints live while coding; sync scroll/click; fast screenshots | P0 |
| UI/UX designer | Compare implementation to design at multiple sizes; overlay reference images | P1 |
| QA engineer | Repeatable device sets, baselines, diff reports, issue lists | P1 |
| Agency / freelancer | Client-facing presentation of responsive behavior | P2 |
| A11y-conscious team | Tap target / contrast / focus checks at each viewport | P2 (V3) |

## 4. User Stories

- **US-01** As a developer, I open the current tab’s URL in a workspace with iPhone, Pixel, iPad and 1440px desktop viewports so I see all breakpoints at once.
- **US-02** As a developer, I scroll/click/type in one viewport and (optionally) the others follow, so I can compare behavior under identical interaction.
- **US-03** As a developer, I add a custom 390×844 viewport and save it as a favorite for my app’s key breakpoint.
- **US-04** As a developer, I test my Vite app on `http://localhost:5173` including HMR pages.
- **US-05** As a designer, I overlay `design.png` on the 390px viewport and compare opacity/position against the live page.
- **US-06** As a QA, I run “Standard Responsive” preset (375/768/1024/1280/1440/1920), capture all viewports, and export an HTML report with the issue list.
- **US-07** As a QA, I save today’s captures as baseline and next week run a diff (overlay / side-by-side / difference).
- **US-08** As an agency dev, I switch to presentation mode, hide the UI, and demo the site in device frames to a client fullscreen.
- **US-09** As a developer, I record a short WebM of the mobile viewport with my voice note to file a bug ticket.
- **US-10** As a privacy-conscious user, nothing leaves my machine unless I explicitly opt in (AI analysis with my own API key).

## 5. Functional Requirements

Full inventory in §7 (Feature List). Requirement blocks map 1:1 to TASK.md sections:

1. Multi-viewport workspace with grid/vertical/horizontal/free-form layouts and full viewport lifecycle management.
2. Device preset system with rich metadata + custom devices.
3. Orientation + dual zoom model (workspace zoom vs viewport zoom).
4. Synchronization engine with seven independently toggleable channels and loop prevention.
5. Device/environment simulation within documented API limits (UA, navigator, touch flags, env reporting, approximate network).
6. Cosmetic device frames strictly separated from real viewport geometry.
7. Developer tools: grid, rulers, element outline, breakpoint inspector, mouse coordinates.
8. Element measurement (+ advanced distance measurement in V3).
9. Design reference overlays.
10. Screenshot pipeline (single/selected/all/workspace/full-page; frame & browser-UI toggles; PNG/JPG).
11. Screenshot annotation editor with export.
12. Video recording (multi-scope, cursor/mic options, FPS/resolution) within MediaRecorder limits.
13. Presentation mode.
14. Workspace management (create/rename/duplicate/delete/export/import) + named presets.
15. URL & navigation control (apply-all, back/forward, reload-all, state tracking).
16. Local development support (localhost/LAN/https-localhost, HMR/WebSocket-friendly).
17. Accessibility/environment simulation reporting + future checks framework.
18. Network simulation within documented limits (offline toggle + synthetic delays).
19. Responsive regression testing (baselines + diff views).
20. AI responsive analysis + Fix Prompt generation (opt-in, provider-agnostic).
21. Heuristic responsive issue detection (works without AI).
22. Reports (HTML/JSON/PDF-print).
23. Keyboard shortcuts (global + in-app, remappable) and context menu integration.

## 6. Non-functional Requirements

| Area | Requirement |
| --- | --- |
| Performance | 8 viewports default smooth (60fps interaction on mid hardware); governor to 16 max; no browser lockup at 10+ viewports |
| Privacy | No analytics, no tracking, no external requests by default; AI strictly opt-in |
| Security | Minimum permissions; optional host permissions feature-gated; no remote code; local-only storage |
| Reliability | Sync never infinite-loops; capture failures are recoverable and user-visible; schema migrations never silently lose data |
| Portability | Core logic free of browser.* calls; platform differences behind `PlatformAdapter` |
| UX | Dense but readable; progressive disclosure; keyboard-first; dark/light; < 100ms UI response for local actions |
| Compatibility | Firefox latest ESR + latest release; Chromium port with documented deltas |
| Testability | Every feature ships with tests per TESTING.md; DoD enforced |

## 7. Feature List

Legend: **Tier** = MVP / V2 / V3 / Future · **Feas.** = ✅ full · 🟡 partial (noted) · ⛔ not possible in WebExtension (alternative noted).
Nothing requested is omitted; ⛔ items always carry an alternative.

### 7.1 Multi-Viewport Workspace (F-001…F-010) — Tier: MVP (free-form → V2)

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-001 | Multiple simultaneous viewports (mobile/tablet/laptop/desktop/custom) | MVP | ✅ | Live iframes at true logical sizes |
| F-002 | Many viewports — default cap 8, configurable to 16 (performance governor) | MVP | 🟡 | “Unlimited” rejected as dishonest; engine supports N, UI warns >8 (see F-146) |
| F-003 | Grid layout | MVP | ✅ | |
| F-004 | Vertical layout | MVP | ✅ | |
| F-005 | Horizontal layout | MVP | ✅ | |
| F-006 | Free-form layout (absolute positioning) | V2 | ✅ | Needs resize + snap engine |
| F-007 | Drag & drop (reorder in auto layouts; move in free-form) | MVP/V2 | ✅ | Reorder MVP; free-form move V2 |
| F-008 | Resize viewports | V2 | ✅ | Logical size edit MVP via inputs; drag-resize V2 |
| F-009 | Viewport lifecycle: minimize / maximize / hide-show / duplicate / remove | MVP | ✅ | |
| F-010 | Focus mode + fullscreen workspace | MVP | ✅ | |

### 7.2 Device Presets & Custom Devices (F-019…F-027) — MVP

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-019 | Phone presets (iPhone family, Pixel, Samsung Galaxy, popular Android) | MVP | ✅ | Catalog plan in DEVICE_SPEC |
| F-020 | Tablet presets (iPad, iPad Pro, Android tablets) | MVP | ✅ | |
| F-021 | Laptop widths 1024/1280/1366/1440/1536 | MVP | ✅ | |
| F-022 | Desktop 1080p / 1440p / 4K / custom | MVP | ✅ | |
| F-023 | Profile metadata: name, w, h, DPR, UA, touch, mobile, orientation, safeArea, deviceFrame | MVP | ✅ | DPR is metadata + display; true DPR emulation ⛔ (F-038) |
| F-024 | Updatable device database (data-only JSON) | MVP | ✅ | |
| F-025 | Custom device create (Width × Height × DPR) | MVP | ✅ | |
| F-026 | Custom device rename / duplicate / edit / delete | MVP | ✅ | |
| F-027 | Custom device favorite | MVP | ✅ | |

### 7.3 Orientation & Zoom (F-011…F-018) — MVP

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-011 | Portrait / Landscape per viewport (auto swap w/h) | MVP | ✅ | |
| F-012 | Viewport zoom presets 25/50/75/100/125/150% | MVP | ✅ | Visual scale; logical viewport unchanged (media queries stay true) |
| F-013 | Custom zoom | V2 | ✅ | 10–300% |
| F-014 | Workspace zoom independent of viewport zoom | MVP | ✅ | fit / 50–200% |

### 7.4 Synchronization Engine (F-028…F-034) — MVP scroll/click/nav; V2 rest

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-028 | Sync Scroll | MVP | ✅ | Ratio-normalized; rAF-coalesced |
| F-029 | Sync Click | MVP | ✅ | Selector-path + coordinate fallback |
| F-030 | Sync Navigation | MVP | ✅ | |
| F-031 | Sync Reload | V2 | ✅ | |
| F-032 | Sync Keyboard | V2 | 🟡 | Focus mapping heuristic; some apps manage focus aggressively |
| F-033 | Sync Input | V2 | 🟡 | Value+caret; complex editors (contenteditable, code editors) best-effort |
| F-034 | Sync Form | V2 | 🟡 | Field-level sync + submit broadcast; validation diverges by design |

Loop prevention (epoch/seq/apply-guards) is mandatory across all channels — see ARCHITECTURE §6.

### 7.5 Browser / Device Simulation (F-035…F-043)

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-035 | User-Agent (HTTP header + `navigator.userAgent`) | V2 (header MVP-lite: workspace-wide) | ✅/🟡 | Per-viewport header mapping via frameId registry = V2 |
| F-036 | navigator properties (platform, maxTouchPoints, vendor…) | V2 | 🟡 | JS-visible via MAIN-world injection; not all consumers read JS (e.g. Workers get real UA) |
| F-037 | Touch / pointer behavior | V2 | 🟡 | Synthetic event assist only. True modality emulation (hover/pointer media queries) ⛔ — use Firefox RDM for that |
| F-038 | devicePixelRatio | — | ⛔ | No extension API can change layout DPR. Alternative: DPR badge + screenshot scale hints; RDM for true DPR |
| F-039 | Orientation API values (`screen.orientation`) | V3 | 🟡 | JS override best-effort |
| F-040 | `prefers-color-scheme` emulation | — | ⛔ | Media-feature emulation requires privileged tools. Alternative: environment **reporting** (F-041) + link to Firefox RDM “Emulate prefers-color-scheme” |
| F-041 | Environment reporting: color-scheme / reduced-motion / forced-colors / color-gamut per viewport | V2 | ✅ | Read actual computed state, show in dev panel |
| F-042 | Network conditions (Online / Offline / Slow / 4G / custom latency) | V3 | 🟡 | Offline = request blocking scoped to workspace tab (approx.); bandwidth/latency throttling ⛔ at network layer → synthetic fetch/XHR delay injection (experimental, labeled “approximate”). True throttling = Firefox RDM |
| F-043 | HTTP cache isolation per viewport | — | ⛔ | Shared profile. Alternative: “Reload bypassing cache” action + docs note |

### 7.6 Device Frames (F-044…F-048) — V2

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-044 | Realistic frames: iPhone / Android / iPad / laptop / desktop | V2 | ✅ | Cosmetic layer only — never affects logical viewport |
| F-045 | Frame toggle on/off, light/dark | V2 | ✅ | |
| F-046 | Portrait/landscape frame art | V2 | ✅ | |
| F-047 | Status bar, notch, Dynamic Island visuals | V2 | ✅ | Visual mock |
| F-048 | Safe-area guides (from profile metadata) | V2 | 🟡 | Visual guides only. True `env(safe-area-inset-*)` injection ⛔ (depends on real browser chrome) |

### 7.7 Screenshot (F-049…F-056) — MVP core; V2 complete

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-049 | Current viewport screenshot | MVP | ✅ | Capture adapter + crop (FF `captureTab`+`rect`; Chrome `captureVisibleTab`+crop) |
| F-050 | Selected (multi) viewport screenshots | MVP | ✅ | |
| F-051 | All viewport screenshots | MVP | ✅ | |
| F-052 | Full-page screenshot | V2 | ✅ | Scroll-stitch pipeline |
| F-053 | Workspace screenshot | V2 | ✅ | |
| F-054 | Device frame ON/OFF; browser-UI ON/OFF | V2 | ✅ | Composite stage |
| F-055 | PNG / JPG | MVP | ✅ | |
| F-056 | Copy to clipboard + download | MVP | ✅ | |

### 7.8 Screenshot Annotation (F-057…F-063) — V2

| ID | Feature | Tier | Feas. |
| --- | --- | --- | --- |
| F-057 | Arrow | V2 | ✅ |
| F-058 | Rectangle | V2 | ✅ |
| F-059 | Circle / ellipse | V2 | ✅ |
| F-060 | Text | V2 | ✅ |
| F-061 | Highlight | V2 | ✅ |
| F-062 | Blur / pixelate region | V2 | ✅ |
| F-063 | Pixel measurement in editor + export | V2 | ✅ |

### 7.9 Design Overlay (F-064…F-067) — V2

| ID | Feature | Tier | Feas. |
| --- | --- | --- | --- |
| F-064 | Load PNG/JPG/SVG reference per viewport | V2 | ✅ |
| F-065 | Opacity / scale / position controls | V2 | ✅ |
| F-066 | Lock / hide-show / alignment helpers | V2 | ✅ |
| F-067 | Persist overlay state in workspace | V2 | ✅ |

### 7.10 Developer Tools (F-068…F-075) — V2

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-068 | Grid overlay: columns/rows/custom + opacity | V2 | ✅ | |
| F-069 | Horizontal + vertical rulers | V2 | ✅ | |
| F-070 | Mouse coordinates | V2 | ✅ | |
| F-071 | Element outline on hover (w/h/x/y) | V2 | ✅ | |
| F-072 | Breakpoint inspector (w/h + current breakpoint) | V2 | 🟡 | Matched MQ listing readable only for non-CORS-blocked stylesheets; core w/h + custom breakpoint set always works |
| F-073 | CSS breakpoint change visibility | V2 | 🟡 | Same CSSOM limitation |
| F-074 | Global/per-viewport tool toggles | V2 | ✅ | |
| F-075 | Element measurement (w/h/margin/padding/position) | V2 | ✅ | |
| F-076 | Element-to-element distance | V3 | 🟡 | Careful picking UX required |
| F-077 | Multi-element alignment guides | V3 | ✅ | |

### 7.11 Video Recording (F-116…F-123) — V2

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-116 | Record single viewport | V2 | ✅ | Canvas-composite mode |
| F-117 | Record multiple / whole workspace | V2 | ✅ | |
| F-118 | Cursor visibility | V2 | 🟡 | Composite mode: synthetic cursor overlay. Display-capture mode: real OS cursor |
| F-119 | Microphone optional | V2 | ✅ | getUserMedia + WebAudio mix |
| F-120 | FPS selection | V2 | 🟡 | Composite mode caps realistically (~5–15 fps captured; target fps honored up to capability, honest UI) |
| F-121 | Resolution selection | V2 | ✅ | |
| F-122 | Output format | V2 | 🟡 | Firefox `MediaRecorder`: **WebM (VP8/VP9 + Opus)** only. MP4 ⛔ on Firefox (Chromium may do MP4 H.264 where system codecs exist). GIF: not native — Future via WebM→GIF tooling note |
| F-123 | Display-capture recording mode (`getDisplayMedia`) | V2 | ✅ | Includes real cursor + system audio where permitted |

### 7.12 Presentation Mode (F-093…F-097) — V2

| ID | Feature | Tier | Feas. |
| --- | --- | --- | --- |
| F-093 | Fullscreen + UI hidden | V2 | ✅ |
| F-094 | Selected device focus | V2 | ✅ |
| F-095 | Dark clean background | V2 | ✅ |
| F-096 | Device labels on/off | V2 | ✅ |
| F-097 | Capture from presentation mode | V2 | ✅ |

### 7.13 Workspace Management & Presets (F-084…F-092) — MVP save/load; V2 complete

| ID | Feature | Tier | Feas. |
| --- | --- | --- | --- |
| F-084 | Workspace model (devices, settings, sync flags) | MVP | ✅ |
| F-085 | Create / rename / duplicate / delete workspace | V2 | ✅ |
| F-086 | Save / load workspace | MVP | ✅ |
| F-087 | Export / import workspace | V2 | ✅ |
| F-088 | Named test presets (e.g. “Mobile Test” 390×844 / 375×812 / 412×915; “Standard Responsive” 375/768/1024/1280/1440/1920) | V2 | ✅ |
| F-089 | One-click apply preset | V2 | ✅ |
| F-090 | Favorites / recents | V2 | ✅ |
| F-091 | Autosave + recovery | MVP | ✅ |
| F-092 | Import validation + migrations | V2 | ✅ |

### 7.14 URL / Navigation (F-078…F-081) — MVP

| ID | Feature | Tier | Feas. |
| --- | --- | --- | --- |
| F-078 | URL bar apply to all viewports | MVP | ✅ |
| F-079 | Per-viewport URL override | V2 | ✅ |
| F-080 | Navigation state tracking (url/title/loading/back/forward) | MVP | ✅ |
| F-081 | Back / Forward / Reload-all / Stop-all | MVP | ✅ |

### 7.15 Local Development (F-082…F-083) — MVP

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-082 | localhost / 127.0.0.1 / 192.168.x.x / custom local hosts / https-localhost | MVP | ✅ | Mixed-content spike tracked in TASK.md |
| F-083 | HMR / WebSocket compatibility (Vite, Next.js, React, Vue, Angular) | MVP | ✅ | Verification suite in TESTING.md |

### 7.16 Accessibility & Environment Simulation (F-040/F-041/F-124…F-127)

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-124 | A11y rule-pack framework | V3 | ✅ | Extensible architecture (per §28 requirement) |
| F-125 | Tap target size rule | V3 | ✅ | (Also in issue detection F-103) |
| F-126 | Contrast + text readability + focus visibility rules | V3 | 🟡 | Computed-style heuristics; full scanner not required |
| F-127 | Keyboard navigation probe + ARIA problems (basic) | Future | 🟡 | Optional axe-core chunk possible later |

Emulation of a11y media features (`prefers-reduced-motion`, `forced-colors`, contrast prefs) is ⛔ — reporting (F-041) + DevTools pointer is the supported path (stated per “workarounds that weaken security are not acceptable” rule).

### 7.17 Network Simulation (F-042) — V3

Covered in §7.5. Summary: offline toggle (blocking rules) ✅ approximate; synthetic request delay 🟡 experimental; real bandwidth/latency throttling ⛔ (DevTools RDM only).

### 7.18 Responsive Regression Testing (F-107…F-111) — V2/V3

| ID | Feature | Tier | Feas. |
| --- | --- | --- | --- |
| F-107 | Baseline capture set per workspace (baseline/<device>.png model) | V2 | ✅ |
| F-108 | Baseline management (set active, replace, delete) | V2 | ✅ |
| F-109 | Baseline vs current comparison | V2 | ✅ |
| F-110 | Difference views: overlay / side-by-side / difference | V2 | ✅ |
| F-111 | Diff threshold config + pass/fail summary | V2 | ✅ |

### 7.19 Responsive Issue Detection (F-098…F-106) — MVP core; V2 complete (works without AI)

| ID | Finding | Tier | Feas. |
| --- | --- | --- | --- |
| F-098 | Horizontal overflow | MVP | ✅ |
| F-099 | Vertical overflow anomalies | V2 | ✅ |
| F-100 | Clipped / ellipsized text | MVP | ✅ |
| F-101 | Elements outside viewport | MVP | ✅ |
| F-102 | Overlapping elements | V2 | ✅ |
| F-103 | Small / unusually large tap targets | MVP | ✅ |
| F-104 | Fixed elements covering content | V2 | ✅ |
| F-105 | Breakpoint anomalies | V2 | ✅ |
| F-106 | Issue panel (🔴 🟠 🟡 severities, evidence, jump-to) | MVP | ✅ |

### 7.20 AI Responsive Analysis (F-128…F-134) — V3 / Future (architecture-ready; not forced into MVP)

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-128 | Provider-agnostic AI adapter layer | V3 | ✅ | OpenAI-compatible, Anthropic, local/custom |
| F-129 | Per-viewport problem analysis (overflow, hero exceeds viewport, button wrap, …) | V3 | ✅ | Input = issue JSON + optional screenshots |
| F-130 | Generate Fix Prompt | V3 | ✅ | Offline template generator always available; AI polish optional |
| F-131 | Explicit consent + exact payload preview per request | V3 | ✅ | SECURITY/PRIVACY govern |
| F-132 | User-supplied API key storage (local, masked) | V3 | ✅ | Never synced/exported |
| F-133 | Result pinning into reports | Future | ✅ | |
| F-134 | Offline prompt templates pack | V3 | ✅ | |

### 7.21 Reports (F-112…F-115) — V2/V3

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-112 | HTML report | V2 | ✅ | Self-contained |
| F-113 | JSON report | V2 | ✅ | |
| F-114 | PDF | V3 | 🟡 | Via browser print-to-PDF of the HTML report (no jsPDF dependency); direct PDF encoding not required |
| F-115 | Report content: URL, date, devices, issues, screenshots, measurements | V2 | ✅ | |

### 7.22 Shortcuts & Context Menu (F-135…F-141) — MVP core

| ID | Feature | Tier | Feas. | Notes |
| --- | --- | --- | --- | --- |
| F-135 | Open workspace (global command) | MVP | ✅ | `browser.commands`; user rebinds in about:addons (platform rule) |
| F-136 | In-app shortcuts: add/remove/focus viewport, grid, ruler, sync, screenshot, fullscreen, presentation | MVP | ✅ | Workspace-scoped key layer |
| F-137 | User-remappable in-app shortcuts + conflict detection | V2 | ✅ | |
| F-138 | Context menu: open page in workspace | MVP | ✅ | |
| F-139 | Context menu: test selected link | V2 | ✅ | |
| F-140 | Context menu: capture with workspace | V2 | ✅ | |
| F-141 | Command palette (searchable actions) | Future | ✅ | |

### 7.23 Performance (F-142…F-148)

| ID | Requirement | Tier |
| --- | --- | --- |
| F-142 | Lazy viewport loading | MVP |
| F-143 | Virtualization where possible (suspend off-screen viewports) | V2 |
| F-144 | Iframe lifecycle + memory management | MVP |
| F-145 | Event throttling (scroll sync rAF coalescing, input debounce) | MVP |
| F-146 | Governor: default 8, warn >8, hard max 16 (setting) | MVP |
| F-147 | Screenshot/video memory optimization | V2 |
| F-148 | Deterministic cleanup (ports, frames, object URLs) | MVP |

### 7.24 Security & Privacy (F-149…F-154)

| ID | Requirement | Tier |
| --- | --- | --- |
| F-149 | Minimum permissions; optional host permissions feature-gated | MVP |
| F-150 | No remote code; strict extension CSP | MVP |
| F-151 | No user data leaves device by default | MVP |
| F-152 | Local-first secure storage; API keys excluded from export | V3 |
| F-153 | AI: explicit consent + payload transparency | V3 |
| F-154 | Clear-all-data action | V3 |

### 7.25 Testing & Port (F-155…F-165)

Testing requirements: see TESTING.md (F-155…F-160). Portability requirements (F-161…F-165): Chromium manifest target, adapter parity tests, store packaging — Tier V2-start / GA v1.0.

## 8. MVP (v0.1) — Definition

**In:** F-001…F-005, F-007 (reorder), F-009, F-010, F-011, F-012, F-014, F-019…F-027,
F-028, F-029, F-030, F-049, F-050, F-051, F-055, F-056, F-078, F-080, F-081, F-082,
F-083, F-084, F-086, F-091, F-098, F-100, F-101, F-103, F-106, F-135, F-136, F-138,
F-142, F-144, F-145, F-146, F-148, F-149…F-151 + platform/embedding/storage/test baselines.

**Out (scheduled, not dropped):** free-form layout, drag-resize, sync input family, frames,
annotation, design overlay, video, presentation, regression, reports, AI, a11y rules,
network simulation, full-page/workspace capture, custom zoom, export/import.

**MVP success gate:** a developer tests a localhost React app in 5 viewports with sync
scroll+click, catches horizontal overflow and tap-target issues, saves 5 screenshots and
the workspace — with zero external network requests.

## 9. V2 (v0.2 – v0.4)

- v0.2: F-006, F-008, F-013, F-031…F-034, F-035…F-037, F-041, F-044…F-048, F-052, F-053, F-054, F-068…F-075, F-079, F-085, F-087…F-092, F-099, F-102, F-104, F-105, F-137, F-139, F-143, F-147.
- v0.3: F-057…F-067, F-093…F-097, F-140.
- v0.4: F-107…F-113, F-115, F-116…F-123.

## 10. V3 (v0.5 – v0.7)

- v0.5: F-039, F-042, simulation polish.
- v0.6: F-076, F-077, F-124…F-126, issue-detection completeness, F-114 (PDF), F-152…F-154.
- v0.7: F-128…F-134 (AI, opt-in).

## 11. Future / Experimental

- F-127 (deep a11y/ARIA, optional axe chunk), F-133, F-141, GIF export (F-122 note), CI
  baseline runner, team sharing (stays local-file based unless privacy model changes),
  locale packs, F-043 alternative research (if platform adds APIs — track
  w3c/webextensions issues; e.g. embed-API proposal #483, capture full-page #52).

## 12. Architecture (summary — full: ARCHITECTURE.md)

Layered, browser-agnostic core + platform adapters:

```text
ui/ (React: workspace, popup, options, sidebar)
        ↓ typed messages
core/ (workspace state, viewport engine, sync hub, capture orchestration,
       device db, issue engine, diff engine, report composer, ai facade)
        ↓ PlatformAdapter interface
platform/firefox | platform/chromium (capture, headers, permissions, storage, menus…)
        ↓
WebExtension APIs · content-script agents (per frame)
```

Key decisions: managed-framing embedding adapter; sync event model with epoch/seq loop
guards; capture→crop→composite pipeline; storage split (storage.local ↔ IndexedDB);
capability detection over UA sniffing.

## 13. UX (summary — full: UX.md)

Professional, minimal, dense-but-readable, keyboard-friendly, responsive shell,
dark/light. Progressive disclosure: essentials in the toolbar; measurement/grid/ruler in
an inspector drawer; simulation and AI in settings. No decorative animation. Error states
(blocked frames, permission missing) always explain + offer the next action.

## 14. Security (summary — full: SECURITY.md)

Minimum + optional permissions; scoped header manipulation only for `sub_frame` responses
of consented origins (frame-ancestors rewrite preferred over blanket CSP removal); no
remote code/eval; messaging origin checks; secrets never exported; AI payload preview.

## 15. Privacy (summary — full: PRIVACY.md)

Default: **no analytics, no tracking, no external requests**. All artifacts local
(storage.local + IndexedDB). AI opt-in, direct-to-provider with user key, per-request
consent. Clear-all-data control.

## 16. Performance (summary — full: ARCHITECTURE.md §12)

8-viewport default budget (warn >8, max 16); lazy frames + suspend off-screen; rAF
coalescing on scroll sync; batched messaging; capture memory hygiene (stream to IDB,
revoke URLs); deterministic teardown.

## 17. Testing (summary — full: TESTING.md)

Unit (viewport math, devices, sync loop prevention, state, storage) → Integration
(extension↔page, multi-viewport, navigation, sync) → E2E on **real Firefox** (localhost
fixture apps, https smoke, responsive/dynamic pages) via web-ext + WebDriver BiDi;
CI gates: typecheck, lint, tests, `web-ext lint`. Definition of Done enforced per feature.

## 18. Browser Compatibility (summary — full: ARCHITECTURE.md §11)

- **WebExtension standard APIs** used for everything core.
- **Firefox-only advantages exploited (behind adapter):** `tabs.captureTab` (inactive tab
  capture), `ImageDetails.rect` region capture, `webRequest` blocking in MV3, rich
  `sidebar_action`.
- **Chromium equivalents:** `captureVisibleTab` (+ tab-switch fallback), client-side crop,
  `declarativeNetRequest` modifyHeaders, `sidePanel`.
- **Incompatible / absent everywhere:** DPR emulation, media-feature emulation, network
  throttling, `chrome.debugger` (Chromium-only — deliberately NOT used to keep parity).

## 19. Release Strategy (summary — full: ROADMAP.md)

Trunk-based git, Conventional Commits, SemVer, Keep-a-Changelog; Firefox-first AMO
listed release (web-ext sign); Chromium port GA at v1.0. Store name without “Firefox”.

## 20. Success Criteria

| Metric | Target |
| --- | --- |
| Time to open 5-viewport workspace on a URL | < 3 s to first paint of all frames (warm cache) |
| Sync scroll perceived latency | < 50 ms to peers |
| 10-viewport session | No browser freeze; memory governor documented |
| Issue detection precision on fixture set | ≥ 90% on the four MVP detectors |
| E2E smoke on Firefox | Green in CI on every main merge |
| Store privacy questionnaire | Zero “data leaves device” except opt-in AI |
| AMO review | Pass without permission reduction requests beyond optional hosts |
| Daily-use proxy | MVP usable as daily driver for localhost responsive work |

## 21. Risks

| # | Risk | Impact | Mitigation |
| --- | --- | --- | --- |
| R1 | Sites refuse framing (XFO/CSP/SW-served responses/JS framebusting) | High | Scoped managed framing; blocked-frame UX with clear fallbacks; optional per-origin enablement; honest docs (competitive tools share this) |
| R2 | AMO review friction on header-modification permissions | High | Optional permissions model, SECURITY.md justifications, per-origin consent, minimal required set |
| R3 | Sync loops / event storms with divergent DOMs | High | Epoch/seq/guard design + stress tests (task §8) |
| R4 | Capture performance (many viewports, full-page stitch) | Med | Sequential pipeline, caps, progress UI, Firefox `captureTab` advantage |
| R5 | Firefox MediaRecorder format limits (no MP4) | Med | WebM-first, capability detection, conversion guidance |
| R6 | Mixed-content blocking of http://localhost from extension origin | Med | Early spike (TASK §4), fallback flow, document |
| R7 | MAIN-world injection coverage (Workers read real UA; strict pages) | Med | Documented partial semantics (F-036 🟡) |
| R8 | Memory pressure at 8–16 iframes | Med | Lifecycle manager, governor, virtualization |
| R9 | User expects DevTools-grade emulation (DPR/throttle/color-scheme) | Med | Upfront honesty in UI tooltips + listing copy (capability matrix) |
| R10 | Diff/annotation scope creep delaying MVP | Low | Strict tiering in this PRD; TASK order |

## 22. Open Questions

1. **~~Final store name~~** — resolved: **ViewGrid** (2026-09-21). Branding polish still open.
2. **License** — MIT vs MPL-2.0 (MPL aligns with Mozilla ecosystem) — decide before first public push.
3. **http://localhost embedding from moz-extension origin** — confirm empirically (spike); fallback plan if blocked.
4. **Annotation persistence** — layers (re-editable) vs flattened export only; storage cost tradeoff.
5. **GIF export demand** — punt to Future unless user feedback demands.
6. **Sidebar as secondary surface** (persistent sync toggles) — cheap on Firefox (`sidebar_action`); validate UX value in v0.2.
7. **axe-core bundling** — lazy chunk size vs value; re-evaluate at v0.6.
8. **Sync Form submit semantics** — broadcasting submit may double-execute side effects on some apps; default ON or OFF? (Proposal: default OFF.)
9. **Workspace cloud sync** — explicitly out of scope; revisit only with a paid/private-sync design.
10. **4K capture memory** on 32-bit/mem-constrained systems — size caps in capture settings?
