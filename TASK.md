# Project Tasks

> **Living master implementation checklist.** Rules:
> - `- [ ]` → `- [x]` **only** when the task is truly done (implementation + tests + docs + error handling + DoD — see `docs/TESTING.md` §7).
> - Tasks are **atomic**. New tasks are added here as they are discovered; completed-but-wrongly tasks are unchecked again.
> - Order respects dependencies: Foundation → Architecture → Core workspace → Viewport engine → Device system → Synchronization → Developer tools → Screenshot → Persistence → Testing → Performance → Advanced → AI → Release.
> - One PR ≈ one sub-section; the PR updates these checkboxes.
> - App name: **ViewGrid** (decided 2026-09-21).

---

## 0. Planning (M0) — DONE

- [x] Inspect existing project state (empty repo confirmed)
- [x] Research competitor products (Responsive Viewer, Mobile View, Hoverify, Toolkit, related tools, Firefox RDM)
- [x] Research Firefox/Chromium WebExtension API capabilities & limits
- [x] Write README.md
- [x] Write docs/PRD.md
- [x] Write docs/ARCHITECTURE.md
- [x] Write docs/SECURITY.md
- [x] Write docs/PRIVACY.md
- [x] Write docs/COMPETITIVE_ANALYSIS.md
- [x] Write docs/DEVICE_SPEC.md
- [x] Write docs/UX.md
- [x] Write docs/TESTING.md
- [x] Write docs/ROADMAP.md
- [x] Write TASK.md (this file)

### Post-planning updates (2026-09-21)

- [x] Decide app name → **ViewGrid** (docs + manifest + README updated)

---

## 1. Foundation

- [ ] Git repository initialized + skeleton commit (`chore: initialize project skeleton`)
- [x] Scaffold package.json (scripts: dev:firefox, build:firefox, dev:chromium, build:chromium, test, lint, typecheck)
- [x] Configure TypeScript (strict, multi-entry build)
- [x] Configure Vite UI build (workspace, popup, options) + esbuild IIFE bundles (background, content agent)
- [x] Configure React + CSS Modules + design tokens (light/dark variables)
- [x] Typed `browser.*` facade (`src/platform/browser.ts`; webextension-polyfill deferred to Chromium port)
- [x] Configure ESLint (typescript-eslint + no-eval/no-new-func security rules)
- [x] Configure Prettier + editorconfig
- [ ] Configure commitlint + Husky + lint-staged
- [x] Configure Vitest (unit suite green: 31 tests)
- [ ] Coverage thresholds (from v0.2)
- [x] Manifest generation per browser (firefox MV3 / chromium MV3)
- [x] Firefox `browser_specific_settings.gecko.id`
- [x] Scaffold `src/` module layout per docs/ARCHITECTURE.md §3
- [x] Build pipeline verified (build:firefox + build:chromium; `web-ext lint` 0 errors, 2 React-internal warnings documented in SECURITY.md)
- [ ] CI pipeline (typecheck, lint, unit tests, web-ext lint)
- [ ] Verify dev loop in real Firefox (`web-ext run` + temporary add-on + manual smoke)
- [x] Document dev workflow in README

## 2. Platform / Browser Abstraction Layer

- [x] Typed `browser.*` facade (platform/browser.ts)
- [x] Messaging module (typed message kinds `VgMessage`, background router, direct content→workspace delivery)
- [x] Storage adapter (storage.local get/set + debounced persistence)
- [x] Capture adapter: firefox `tabs.captureTab` path (in background `vg/capture`)
- [ ] Capture adapter: chromium `captureVisibleTab` + tab-switch fallback (fallback exists; activation dance not)
- [ ] Capability detection module (runtime feature probes)
- [x] Permissions service (query/request flow: popup + workspace menu)
- [x] Header-rewrite service: firefox `webRequest` blocking adapter (workspace-tab scoped)
- [ ] Header-rewrite service: chromium `declarativeNetRequest` adapter
- [x] Context-menu service (open page / open link in ViewGrid)
- [x] Commands service (open workspace: Alt+Shift+V)
- [ ] Sidebar integration (firefox sidebar_action; chromium sidePanel)
- [ ] Platform adapter contract tests (shared suite per adapter)

## 3. Storage & State Management

- [x] Persisted schemas v1: workspace model (schemaVersion + validation), custom devices
- [x] Zustand stores: workspace/UI state (settings/devices/capture stores partial)
- [x] Storage persistence middleware (debounced 400 ms write)
- [ ] IndexedDB layer for binary artifacts (screenshots currently stream straight to download)
- [ ] Schema migration runner (v1→v2 template)
- [ ] Export sanitizer (exclude API keys / secrets from exports)
- [x] Storage unit tests (round-trip + hostile-input normalization)
- [ ] Storage failure-path tests (quota errors)

## 4. Embedding & Permissions (Framing)

- [x] Framing policy: scoped XFO strip + CSP `frame-ancestors` rewrite (`sub_frame` of workspace tabs only) — Firefox webRequest
- [ ] Framing policy: Chromium DNR rules
- [x] Optional-host-permission onboarding flow (popup “Enable site access” + workspace ☰ action)
- [x] Limited-mode guidance card (explains what the grant enables)
- [ ] Blocked-frame detection + fallback error card (auto-detect XFO/SW/framebust failures)
- [x] localhost / 127.0.0.1 / LAN patterns in optional_host_permissions + URL normalizer
- [ ] Spike: verify http://localhost iframe embedding from moz-extension origin; record result + fallback
- [ ] Service-worker-served response caveat: detect + document
- [ ] Framing integration tests (fixture server sending XFO / CSP frame-ancestors variants)

## 5. Core Workspace UI (F-001…F-010)

- [x] Workspace tab page shell (toolbar, canvas, status bar)
- [x] Popup launcher (current tab URL → workspace)
- [x] URL bar: navigate all viewports (normalizeUrl: https/localhost/search)
- [x] Back / Forward / Reload-all controls (agent commands)
- [x] Layout engine: grid (auto columns)
- [x] Layout engine: vertical (column) layout
- [x] Layout engine: horizontal (row) layout
- [x] Viewport card chrome: header (device name, size, actions), content slot
- [x] Viewport add flow (picker: presets/categories/search + custom form)
- [x] Viewport remove, duplicate, hide/show, minimize/restore
- [x] Focus mode (single viewport)
- [x] Viewport reorder via drag & drop
- [ ] Workspace fullscreen (browser Fullscreen API)
- [x] Empty state + first-run guidance
- [x] Dark / light theme toggle (persisted)
- [ ] Responsive shell (workspace usable at 1024px-wide windows) — untested
- [ ] Workspace UI unit tests (store reducers)

## 6. Viewport Engine (F-011…F-018)

- [x] Viewport sizing model (logical size vs displayed zoom scale; frame separated)
- [x] Orientation toggle per viewport (swap w/h)
- [ ] Workspace zoom (fit-to-window, 50–200%) independent of viewport zoom
- [x] Viewport zoom presets (25/50/75/100/125/150%)
- [ ] Viewport custom zoom input (10–300%)
- [x] Zoom transform pipeline (scale container; iframe keeps logical device size)
- [ ] Drag-resize handle per viewport
- [x] Minimize (collapse) + restore
- [x] Viewport engine tests (orientation swap, zoom clamp/scale, governor)

## 7. Device System (F-019…F-027)

- [x] Device profile schema v1 per docs/DEVICE_SPEC.md (validation + makeCustomDevice)
- [x] Phone preset catalog MVP (iPhone SE/13/14/15 Pro/15 Pro Max, Pixel 8, Galaxy S23/A54)
- [x] Tablet preset catalog MVP (iPad mini/10/Air/Pro 11/Pro 12.9, Galaxy Tab S9)
- [x] Laptop width catalog (1024, 1280, 1366, 1440, 1536)
- [x] Desktop catalog (1080p, 1440p, 4K)
- [x] Builtin named presets (Mobile Test, Standard Responsive, iOS+Android, Tablet Check, Full House) + one-click apply
- [ ] Expand catalog per DEVICE_SPEC §2 (iPhone 16/17, Pixel 9/10, Galaxy S24/S25 classes) after source verification
- [ ] Verify every preset dimension/DPR/UA against public sources; record sources in DEVICE_SPEC
- [x] Custom device create (width, height, DPR, name)
- [ ] Custom device rename / edit / delete
- [ ] Custom device favorite + recents list
- [x] Device picker UI (search, category tabs, custom form)
- [x] Device database is data module (updatable without code changes)
- [x] Device schema validation tests

## 8. Synchronization Engine (F-028…F-034)

- [x] Content-script agent (per-frame, window.name viewport binding, idempotent install)
- [x] Sync event model + envelope (channel, sourceViewportId, epoch, seq, ts, payload)
- [x] SyncHub in workspace (channel policy + routing + apply fan-out via background)
- [x] Sync Scroll: ratio-normalized apply, rAF-coalesced emit
- [x] Sync Click: selector-path capture + normalized-coord fallback
- [x] Sync Navigation: link-click broadcast (source navigates naturally; peers follow)
- [ ] Sync Reload channel (reload-all command exists; per-channel emitter not wired)
- [ ] Sync Keyboard channel
- [ ] Sync Input channel
- [ ] Sync Form channel
- [x] Loop prevention: monotonic seq fencing + apply-suppression guards (+ unit tests)
- [ ] Divergent-DOM fallback UX (selector miss → coords → skip + toast)
- [x] Per-channel toggles UI (scroll/click/nav/reload/key/input/form)
- [ ] Sync stress tests (10 viewports, rapid scroll, no loops, bounded queue)

## 9. Device & Environment Simulation (F-035…F-043)

- [ ] MAIN-world injection pipeline (world: MAIN)
- [ ] navigator.userAgent override per viewport
- [ ] navigator.maxTouchPoints + touch flag override
- [ ] HTTP User-Agent header rewrite (webRequest)
- [ ] Per-viewport UA mapping via frameId registry
- [ ] Environment inspector (color-scheme / reduced-motion / forced-colors reporting)
- [ ] Media-feature limitation tooltips in UI
- [ ] Touch UX assist (long-press → tap conversion)
- [ ] Network simulation — synthetic fetch/XHR delay (experimental)
- [ ] Network simulation — workspace offline toggle
- [ ] Network presets UI (honest “approximate” labels)
- [ ] Simulation tests

## 10. Device Frames (F-044…F-048)

- [ ] Frame renderer (CSS/SVG, never affects real viewport size)
- [ ] iPhone frame (notch / Dynamic Island) light + dark
- [ ] Android frame light + dark
- [ ] iPad / tablet frame
- [ ] Laptop + desktop (browser chrome bar) frames
- [ ] Status bar mock toggle
- [ ] Safe-area visual guides overlay
- [ ] Frame on/off per viewport + default setting (workspace-level flag exists: `frames`)
- [ ] Frame + orientation auto-layout
- [ ] Verify frame ON/OFF crops produce identical logical viewport pixels

## 11. Screenshots (F-049…F-056)

- [x] Capture pipeline core (background captureTab → data URL → canvas crop)
- [x] DPR-correct region crop (HiDPI scale from image vs CSS viewport)
- [x] Current / single viewport screenshot (C)
- [x] Selected (multi-select visible) viewport batch (Shift+C, single capture + N crops)
- [ ] All viewports including off-screen (virtualization-aware)
- [x] Workspace screenshot (full visible tab capture)
- [ ] Full-page screenshot single viewport (scroll-stitch)
- [ ] Full-page for all viewports (sequential, cancellable, progress UI)
- [ ] Device frame ON/OFF composite; browser-UI mock ON/OFF
- [x] PNG output (JPG option plumbed in capture request, UI toggle pending)
- [x] Save via anchor download (no `downloads` permission needed)
- [ ] Capture metadata record in IndexedDB
- [x] Capture tests (crop math, clamps, filenames)

## 12. Screenshot Annotation (F-057…F-063) — V2

- [ ] Annotation canvas editor shell
- [ ] Arrow tool
- [ ] Rectangle tool
- [ ] Circle / ellipse tool
- [ ] Text tool
- [ ] Highlight tool
- [ ] Blur / pixelate tool
- [ ] Pixel measurement tool
- [ ] Undo/redo stack
- [ ] Export annotated PNG/JPG
- [ ] Annotation persistence model (layers vs flattened — Open Question #4)

## 13. Design Overlay (F-064…F-067) — V2

- [ ] Image loader (PNG/JPG/SVG) per viewport
- [ ] Overlay controls: opacity, scale, x/y, lock, hide/show
- [ ] Alignment helpers
- [ ] Overlay persists in workspace definition

## 14. Developer Tools (F-068…F-075) — V2

- [ ] Grid overlay (columns/rows/custom + opacity)
- [ ] Ruler (horizontal + vertical)
- [ ] Mouse coordinate readout
- [ ] Element outline on hover (W/H/X/Y badge)
- [ ] Element measurement panel (width/height/margin/padding/position)
- [ ] Breakpoint inspector (innerWidth/Height + matched MQs where readable)
- [ ] CSSOM limitation fallback UI
- [ ] Per-viewport tools toggles + toolbar shortcuts

## 15. Element Measurement Advanced (F-076…F-077) — V3

- [ ] Element-to-element distance measurement
- [ ] Multi-element alignment guides

## 16. URL & Navigation (F-078…F-081)

- [x] Global URL apply (all viewports)
- [ ] Per-viewport URL override (store action exists; UI pending)
- [ ] Navigation state tracking (url/title/loading/canGoBack/Forward)
- [x] Back / Forward / Reload all (Stop-all pending)

## 17. Local Development Support (F-082…F-083)

- [x] localhost / 127.0.0.1 / 192.168.x.x / https-localhost URL handling + permissions patterns
- [ ] HMR/WebSocket compatibility verification suite (Vite, Next.js fixtures)
- [ ] https-localhost (mkcert) verification
- [ ] Document mixed-content edge cases + fallback

## 18. Workspace Management & Presets (F-084…F-092)

- [x] Workspace model: devices + layout + sync flags + settings + url binding
- [ ] Workspace rename / duplicate (save-as creates; rename/dedicated duplicate pending)
- [x] Save + load workspace (named, storage.local)
- [x] Autosave draft (debounced persist)
- [ ] Export workspace JSON (sanitized)
- [ ] Import workspace JSON (validation + migration — parser ready in core)
- [x] Built-in test presets + one-click apply
- [ ] User-defined presets (create/save custom device sets)
- [ ] Favorites + recents for presets

## 19. Presentation Mode (F-093…F-097) — V2

- [ ] Presentation mode shell (fullscreen, dark backdrop, UI hidden)
- [ ] Device labels on/off
- [ ] Selected device focus carousel
- [ ] Clean exit + state restore
- [ ] Presentation-safe capture

## 20. Responsive Issue Detection (F-098…F-106)

- [x] Scanner framework (agent metrics collection → pure core detectors)
- [x] Horizontal overflow detection + offender hints
- [ ] Vertical overflow anomalies
- [x] Clipped / ellipsized text detection
- [x] Elements outside viewport bounds
- [ ] Overlapping interactive elements detection
- [x] Tap target size audit (<24px)
- [ ] Fixed/sticky elements covering content
- [ ] Breakpoint anomaly compare (paired-width scans)
- [x] Issue panel UI with severities (🔴 🟠 🟡), filter by rule/device
- [ ] Jump-to-element from issue row
- [x] Detector unit tests (fixture metrics)

## 21. Regression Testing (F-107…F-111) — V2/V3

- [ ] Baseline capture set per workspace
- [ ] Baseline store + management UI
- [ ] Pixel diff engine (threshold config)
- [ ] Difference views: overlay / side-by-side / difference
- [ ] Pass/fail summary + export diff artifacts

## 22. Reports (F-112…F-115) — V2/V3

- [ ] Report composer (URL, date, devices, issues, screenshots, measurements)
- [ ] HTML export (self-contained)
- [ ] JSON export
- [ ] PDF via browser print pipeline
- [ ] Report templates localization-ready

## 23. Video Recording (F-116…F-123) — V2

- [ ] Canvas composite recorder
- [ ] Single / multi viewport / workspace capture scopes
- [ ] Display-capture mode (getDisplayMedia) + real cursor
- [ ] Mic audio mixing (mute toggle)
- [ ] Synthetic cursor overlay option
- [ ] FPS selection (honest caps per mode)
- [ ] Resolution selection
- [ ] WebM output + codec capability detection (MP4 only where platform supports)
- [ ] Recording tray (start/stop/pause, cancel)
- [ ] Recorder tests (chunk assembly, mime negotiation)

## 24. Accessibility Checks (F-124…F-127) — V3

- [ ] Rule-pack framework
- [ ] Contrast rule
- [ ] Focus visibility rule
- [ ] Text readability rule
- [ ] Keyboard navigation probe
- [ ] Optional axe-core lazy module

## 25. AI Responsive Analysis (F-128…F-134) — V3 / Future

- [ ] `AiProvider` interface + capability negotiation
- [ ] OpenAI-compatible REST adapter
- [ ] Anthropic adapter
- [ ] Local/custom endpoint adapter
- [ ] API key storage (masked UI, never synced/exported)
- [ ] Per-request consent dialog with exact payload preview
- [ ] Analysis result model
- [ ] Generate Fix Prompt — offline template generator
- [ ] AI-polished fix prompt (opt-in)
- [ ] Privacy UX + docs updates

## 26. Keyboard Shortcuts & Context Menu (F-135…F-141)

- [x] Global command: open workspace (Alt+Shift+V)
- [x] In-app shortcut layer: add(A) / screenshot(C, Shift+C) / sync(S) / layout(G) / focus(F) / rotate(O) / scan(I) / reload-all(Shift+R) / jump(1–9) / Esc
- [ ] Shortcut remapping UI (capture keys, conflict detection)
- [ ] Persist custom bindings
- [x] Context menu: “Open page in ViewGrid”
- [x] Context menu: “Open link in ViewGrid”
- [ ] Context menu: capture action
- [ ] Command palette

## 27. Performance (F-142…F-148)

- [x] Event throttling (scroll rAF coalescing in agent)
- [ ] Viewport virtualization (suspend far viewports)
- [ ] Iframe lifecycle manager (park/restore hidden-viewport state)
- [ ] Message batching on sync bus
- [x] Governor: default 8 warn, hard max 16 (toast + block)
- [ ] Capture pipeline memory hygiene (streaming writes to IDB)
- [ ] Deterministic cleanup tests (frames, listeners, object URLs)
- [ ] Performance test harness (10–12 viewport scenario)

## 28. Security & Privacy Hardening (F-149…F-154)

- [x] Permission minimization (no `downloads` — anchor save; host perms optional)
- [x] Optional permissions UX flow (feature-gated)
- [x] Extension-page CSP review (MV3 default `script-src 'self'`; no remote code; no eval — lint-enforced)
- [x] Message type validation + sender-derived tab/frame routing
- [ ] Export sanitizer verification (keys never exported — depends on §3)
- [ ] “Clear all local data” completeness (storage + future IDB) — options page clears store key only
- [ ] Pre-release security checklist run (docs/SECURITY.md §8)

## 29. Testing & CI Completion (F-155…F-160)

- [x] Unit suite: viewport math, device DB, sync loop prevention, serialize, crop, detectors (31 tests)
- [ ] Integration: extension ↔ content bridge with WebExtension API mocks
- [ ] E2E fixture test site (breakpoints, overflow, tap targets, forms, frames)
- [ ] E2E Firefox suite (web-ext + geckodriver/WebDriver BiDi)
- [ ] E2E public-site smoke (https) + localhost suite
- [ ] Cross-browser E2E (Chromium) — port milestone
- [ ] CI matrix + artifact upload

## 30. Browser Port — Chromium (F-161…F-165) — parallel from V2, GA v1.0

- [x] Chromium manifest generation (service_worker; build:chromium green)
- [ ] Adapter parity tests (capture fallback, DNR framing, sidePanel)
- [ ] Chrome Web Store packaging + policy review
- [ ] Edge Add-ons smoke
- [ ] Compatibility matrix update in docs/ARCHITECTURE.md

## 31. Documentation (living)

- [x] README updated with real commands + ViewGrid naming
- [x] SECURITY.md updated to shipped behavior (framing scope, no downloads perm, lint notes)
- [ ] CHANGELOG.md started at first release
- [ ] Inline API docs for platform adapter + sync protocol appendices
- [ ] AMO listing copy + screenshots (after v0.4)
- [ ] Privacy policy page (from docs/PRIVACY.md)

## 32. Release

- [x] Choose store name — **ViewGrid** (decided)
- [ ] Logo/icon brand polish (placeholder generated icons ship for now)
- [ ] License decision + LICENSE file
- [ ] v0.1.0 release candidate: web-ext lint clean, E2E smoke green
- [ ] AMO submission (listed) + review Q&A using SECURITY/PRIVACY docs
- [ ] v0.1.0 tagged + CHANGELOG published
- [ ] Post-release verification on clean Firefox profile
