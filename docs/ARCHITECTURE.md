# Architecture — ViewGrid

Firefox-first WebExtension (Manifest V3), portable to Chromium. This document defines
the technical architecture, the browser abstraction, the sync engine, the capture
pipeline, the API capability matrix, and the evaluated tech stack.
Implementation follows this doc; deviations require updating it (living document).

---

## 1. Design Principles

1. **Browser-agnostic core.** Business logic never calls `browser.*` / `chrome.*` directly; it depends on `PlatformAdapter`.
2. **Capability detection, not UA sniffing.** Runtime probes decide which capture/header path runs.
3. **Local-first.** All state in `storage.local` + IndexedDB. No remote code, no CDN assets in the extension bundle, no telemetry.
4. **Honest fidelity.** If the platform cannot emulate something (DPR, media features, throttling), the product reports or documents it — never fakes it.
5. **Event-sourced interactions.** Everything the sync engine does is a tagged, replay-safe event (epoch + sequence).
6. **Progressive cost.** Features cost resources only when enabled (simulation, frames, overlays, recording).

## 2. High-Level Diagram

```text
┌──────────────────────────── Browser ─────────────────────────────┐
│                                                                   │
│  ┌──────────── UI layer (React, extension pages) ─────────────┐  │
│  │ workspace tab · popup · options · sidebar (FF) / sidePanel  │  │
│  └───────────────┬─────────────────────────────────────────────┘  │
│                  │ typed messages (runtime ports)                  │
│  ┌───────────────▼──────────── core/ ───────────────────────────┐ │
│  │ workspaceStore · deviceDb · viewportEngine · syncHub          │ │
│  │ captureOrchestrator · annotationEngine · overlayEngine        │ │
│  │ issueEngine · diffEngine · reportComposer · aiFacade          │ │
│  └───────────────┬──────────────────────────────────────────────┘ │
│                  │ PlatformAdapter interface                       │
│  ┌───────────────▼──────────────┐  ┌───────────────────────────┐  │
│  │ platform/firefox             │  │ platform/chromium         │  │
│  │ captureTab + rect, webRequest│  │ captureVisibleTab+crop,   │  │
│  │ blocking, sidebar_action     │  │ DNR modifyHeaders, panel  │  │
│  └───────────────┬──────────────┘  └────────────┬──────────────┘  │
│                  └──────────────┬───────────────┘                  │
│                          WebExtension APIs                          │
│                                                                   │
│  background (event page FF / service worker Chromium)             │
│      · framing rules · permissions · menus · commands · capture    │
│                                                                   │
│  content agents (per frame, all_frames)                           │
│      · sync listeners/actuators · measurement · issue scanners    │
│      · MAIN-world injection (UA/navigator overrides)              │
└───────────────────────────────────────────────────────────────────┘
```

## 3. Module Layout (planned)

```text
src/
├── core/                      # pure TS, zero browser globals
│   ├── types/                 # shared models (Workspace, DeviceProfile, SyncEvent…)
│   ├── workspace/             # state reducers, layout math, serialization+migrations
│   ├── devices/               # schema validation, preset merge, custom device ops
│   ├── sync/                  # protocol, loop-guard, normalization, channel logic
│   ├── capture/               # crop math, stitch planner, composite (frames/labels)
│   ├── annotation/            # tool model, export flatten
│   ├── measurement/           # rect/margin extraction models, distance calc
│   ├── issues/                # detector framework + detectors
│   ├── diff/                  # pixel diff + views model
│   ├── report/                # HTML/JSON composers
│   ├── ai/                    # provider interface, prompt templates (offline)
│   └── util/                  # throttle, id, result types, schema-version helpers
├── platform/
│   ├── adapter.ts             # PlatformAdapter interface + capability flags (port milestone)
│   ├── browser.ts             # typed WebExtension `browser.*` facade (v0.1)
│   ├── firefox/               # FF implementations (captureTab, webRequest, sidebar…)
│   └── chromium/              # CH implementations (captureVisibleTab, DNR, sidePanel…)
├── background/                # entry: wiring adapters, framing rules, menus, commands
├── content/                   # per-frame agent + MAIN-world injectees (built separately)
├── ui/
│   ├── workspace/             # main surface (React)
│   ├── popup/
│   ├── options/
│   └── sidebar/
├── devices/                   # device database (data only, JSON/TS)
└── manifest/                  # manifest.base + per-browser overlays → build script
```

Build: Vite multi-entry (each UI page + background + each content script as separate
bundle; content scripts IIFE, no code-splitting; UI pages ESM with hashing).

## 4. Platform Abstraction (`PlatformAdapter`)

| Capability | Interface surface | Firefox impl | Chromium impl |
| --- | --- | --- | --- |
| Messaging | `runtime` typed ports | native `browser.runtime` | webextension-polyfill |
| Storage | `storage.local.get/set` | native | polyfill |
| Capture | `captureTab(tabId, opts{rect,format,quality})` | `tabs.captureTab` (+ `ImageDetails.rect`) | `tabs.captureVisibleTab` + activation dance fallback; rect = client-side crop |
| Header rewrite | `framePolicy.enable(originSet)` | `webRequest.onHeadersReceived` blocking | `declarativeNetRequest` dynamic `modifyHeaders` rules |
| Request block (offline) | `netGuard.setOffline(tabId, bool)` | webRequest blocking cancel | DNR block rules w/ `tabIds` |
| Permissions | `request/contains/query` | `browser.permissions` (FF MV3: host perms are optional — always runtime-request) | same API, different defaults |
| Menus | create/remove handlers | `browser.menus` | `contextMenus` |
| Commands | global shortcuts | `browser.commands` | same |
| Sidebar | `openSidebar()` | `sidebar_action` | `sidePanel` (optional; documented no-op if absent) |
| UA header | `setUaForFrame(frameKey, ua)` | `onBeforeSendHeaders` + frameId map | DNR rules (tab-scoped; per-frame best-effort) |

Contract tests run the **same suite** against both adapters with mocked WebExtension APIs
(TASK §2) so the port does not rot.

Background split: `background/index.ts` is shared; manifest generation maps it to
`background.scripts` (FF event page) or `background.service_worker` (Chromium).

## 5. Rendering & Embedding

### 5.1 Mode A — Managed Framing (primary)

Workspace page hosts one **sandboxed-per-card `<iframe>` per viewport** at true logical
size (CSS px), scaled visually by transform for zoom.

Problem (confirmed in research): sites block framing via `X-Frame-Options` /
CSP `frame-ancestors`. The community-standard, platform-supported solution is response
header modification — we implement it as `FramePolicy`:

- Scope: resource type **`sub_frame` only**, request initiator is our extension
  (or `documentUrl` is our workspace page), destination ∈ user-consented origin set.
- Preference order of edits:
  1. CSP: rewrite `frame-ancestors` to include our extension origin (keep other directives!).
  2. `X-Frame-Options`: remove only if rewrite impossible (`ALLOWALL` semantics needed).
  3. Never strip CSP wholesale on `main_frame` — never touch non-frame traffic.
- Enablement: **opt-in per origin / per site grant** via `optional_host_permissions` +
  `permissions.request` UX (“Enable framing for example.com”).
- Known caveats (documented in UI on failure):
  - Service-worker-served responses bypass webRequest/DNR → original headers persist;
    we do **not** use destructive `browsingData` workarounds by default (SECURITY.md).
  - JS framebusting (`if (top !== self) …`) still defeats embedding — detected, honest
    error card shown.
  - `sandbox` attribute on our iframe is deliberately NOT used (it would break the page).

### 5.2 Mode B — Page-Injected Overlay (experimental, later)

Hoverify-style: inject the viewer chrome into the live page and put the *other* devices
in iframes. Pros: one device is always 100% real. Cons: page CSS collisions, CSP
injection limits, user-data-plane mixing. Parked as research task (TASK §4 notes),
not in MVP.

### 5.3 Mode C — Capture Grid (future fallback)

Periodic `captureTab` snapshots of real tabs composited into a grid when framing is
impossible. Live interaction sync still works via content scripts in real tabs, but
per-device **logical viewport sizes cannot be forced on real tabs** (window size is the
limit) → labeled “approximate sizes” mode. Future tier only.

### 5.4 Frame vs viewport separation

`deviceFrame` art is rendered in the card wrapper **outside** the iframe box; the iframe
element is always exactly `width×height` of the logical viewport. Capture composite can
re-attach frame art as a pure image layer. Safe-area strips are visual guides only.

## 6. Synchronization Engine

### 6.1 Topology

```text
[frame agent A]──┐   [frame agent B]──┐   [frame agent C]──┐
   (content)     │     (content)      │     (content)      │
                 └──────► ports ◄─────┴────────────────────┘
                              │
                       ┌──────▼──────┐
                       │   SyncHub   │  (workspace page; bus + policies)
                       └─────────────┘
```

Every frame (including nested iframes inside the tested page) runs a content agent
(`all_frames: true`). Agents **report** (listeners) and **apply** (actuators).

### 6.2 Event model

```ts
SyncEnvelope {
  channel: 'scroll'|'click'|'nav'|'reload'|'key'|'input'|'form';
  sourceViewportId: string;   // logical viewport, NOT frameId
  epoch: number;              // increments when a channel is toggled/reset
  seq: number;                // monotonic per (viewport, channel)
  ts: number;
  payload: ChannelPayload;    // e.g. scroll: {xRatio, yRatio, maxScroll…}
}
```

### 6.3 Loop prevention (mandatory)

1. **Origin tagging:** applied events carry `appliedFrom=SyncHub`; actuators mark the
   resulting DOM event with a suppression token so local listeners **do not re-emit**.
2. **Sequence fencing:** per-(source-viewport, channel) monotonic `seq`; out-of-order or
   duplicate events are dropped in **every** context (source, hub, actuator) — this is
   the hard guarantee against echo storms. `epoch` is bump-on-reset metadata kept in the
   envelope schema (implementation note: strict epoch equality was rejected because the
   guards live in different JS contexts that cannot share a clock; monotonic seq +
   apply-guards provide the same safety — see `core/sync/protocol.ts`).
3. **Single-writer rule:** only SyncHub writes to other viewports; agents never talk
   peer-to-peer.
4. **Bounded queues + coalescing:** scroll keeps only the latest state per viewport
   (rAF flush); input debounced; queue caps with drop-oldest for scroll, drop-newest
   for keys.

### 6.4 Channel semantics & normalization

| Channel | Capture | Apply | Notes |
| --- | --- | --- | --- |
| scroll | `xRatio=scrollX/maxX`, `yRatio=scrollY/maxY` (+ velocity) | `window.scrollTo(ratio*max)` | Different page heights stay aligned proportionally; option “absolute px mode” |
| click | target selector path (robust: id → data-attr → nth-child path) + normalized (x,y) within target/viewport | `elementFromPoint` → programmatic `click()`; fallback: position-based `elementFromPoint` at scaled coords | Divergent DOMs: selector miss → coords → skip + toast |
| nav | `location.href` + history state + kind (link/form/history) | `location.assign` / `history.back` | Same-URL dedupe; form submit guarded (Open Q: default OFF) |
| reload | — | `location.reload` | |
| key | target selector + key descriptor (no raw passwords: input type=password never synced) | focus target → `dispatchEvent(KeyboardEvent)` | Caret/selection included when trivially available |
| input | selector + value + selection | set value + `input`/`change` events | IME composition excluded; contenteditable best-effort |
| form | field map + validity-independent | batch apply | Submit broadcast optional |

### 6.5 Divergence policy

Sync is **best-effort consistency**, never transactional. When a page is fundamentally
different at a breakpoint (different DOM), the UI surfaces “1 viewport skipped” instead
of forcing garbage state.

## 7. Capture & Recording Pipeline

### 7.1 Stills

```text
prepare: hide overlays/frame-guides/annotations-UI (rAF barrier)
capture: adapter.captureTab({ rect: viewportRectInWindowPx, format, quality })
         · FF: native rect (device-pixel aware)
         · CH: full visible tab → canvas crop (DPR-correct)
composite (optional): device frame art, browser-chrome mock, labels
encode: canvas.toBlob('image/png' | 'image/jpeg', q)
store:  IndexedDB artifact + metadata record; download / clipboard
restore: overlays back
```

Full-page: content agent exposes `scrollHeight`; stitch planner scrolls in viewport
heights, captures each segment, de-duplicates seam rows (fixed/sticky elements flagged).

### 7.2 Video

- **Composite mode (default):** capture loop (fps budget 5–15 real) → shared canvas
  (optional frames/labels/synthetic cursor) → `canvas.captureStream()` →
  `MediaRecorder` (negotiated mime: `video/webm;codecs=vp9,opus` → vp8 fallback).
  FPS/resolution selectors reflect the honest capability of the mode.
- **Display-capture mode:** `navigator.mediaDevices.getDisplayMedia({video:{frameRate,
  cursor}})` + optional `getUserMedia({audio})` mixed via `AudioContext`. Real OS cursor,
  real-time capture; user picks the workspace tab/window.
- **Format reality (confirmed):** Firefox MediaRecorder → WebM only (VP8/VP9 + Opus,
  Ogg Theora legacy). **MP4 is not produced on Firefox.** Chromium may offer
  `video/mp4` H.264/AAC where system encoders exist — runtime `isTypeSupported()`.
  UI states output format honestly; conversion (WebM→MP4/GIF) is out of scope (Future).

## 8. State Management & Storage

### 8.1 Stores (Zustand)

`settingsStore`, `workspaceStore` (devices/layout/sync flags), `deviceStore` (db+custom),
`uiStore`, `captureStore` (tray/artifacts metadata), `issueStore`. One directional data
flow: UI events → store actions (core pure functions) → subscribers (UI + actuators).

### 8.2 Storage matrix

| Data | Medium | Why | Quota notes |
| --- | --- | --- | --- |
| Settings, shortcuts | `storage.local` | small JSON, sync-read at startup | ~KB |
| Workspaces, presets, custom devices | `storage.local` | small/medium JSON, versioned | KBs–low MB |
| API keys (AI) | `storage.local` | never `storage.sync`, never exported | tiny |
| Screenshots, baselines, videos | **IndexedDB** (blobs) | large binaries | GB-class quota; `unlimitedStorage` permission + `navigator.storage.persist()` request; `estimate()` monitored |
| Capture metadata (indexes) | IndexedDB (records) + pointer in storage.local | queryable | — |
| Draft autosave | `storage.local` (ring buffer, capped) | crash recovery | capped MB |

`schemaVersion` in every record; migration runner runs before stores hydrate.
Exports (workspace JSON, reports) pass an **export sanitizer** (strips keys/secrets).

## 9. Simulation Layer (semantics)

| Feature | Mechanism | Fidelity |
| --- | --- | --- |
| UA (HTTP) | FF: `onBeforeSendHeaders` rewrite mapped per frameId→viewport; CH: DNR `modifyHeaders` (tab-scoped) | Header-level real |
| UA/navigator (JS) | Registered content script in `world: MAIN` + `Object.defineProperty(navigator, …)` (userAgent, platform, maxTouchPoints, vendor) | Page-JS level; Workers may still see real values (documented) |
| Touch | Synthetic TouchEvent dispatch for taps (assist toggle); long-press→click assist | Not true modality; `pointer/hover` media queries unaffected |
| prefers-* / forced-colors | **Reporting only** (computed state per viewport) + link to Firefox RDM emulation | Emulation impossible via extension APIs |
| Network — offline | Request cancel/block scoped to workspace tab (FF webRequest / CH DNR) | Good for “how does the app fail offline” |
| Network — slow/latency | Synthetic delay wrapper around `fetch`/XHR injected per frame (experimental flag) | JS-initiated requests only; static subresources unaffected → labeled “approximate” |
| DPR | metadata + screenshot scale hints | Layout DPR not emulatable |
| Safe area | visual guides from profile metadata | `env(safe-area-inset-*)` not injectable |

## 10. Performance Architecture

- **Viewport governor:** default 8 (warn above), hard max 16 (setting).
- **Lazy frames:** create iframe on first paint; `loading=lazy` where supported.
- **Lifecycle manager:** off-screen/hidden viewports past a threshold get `src` parked
  (state checkpoint: scroll ratio + URL) and rehydrated on show — frees renderer memory.
- **Coalescing:** scroll sync rAF-throttled; resize observers debounced; message batches
  flushed per frame.
- **Capture hygiene:** object URLs revoked post-encode; IDB writes streamed; large
  composites downscaled option.
- **Cleanup:** workspace close tears down ports, frames, observers, injected overlays
  deterministically (leak tests in CI harness).

## 11. API Capability Matrix (research-confirmed)

| API / capability | Firefox | Chromium | Us? |
| --- | :---: | :---: | --- |
| `tabs.captureVisibleTab` | ✓ (needs host perm; MV3 host perms optional → runtime request) | ✓ (active tab) | ✓ |
| `tabs.captureTab` (inactive tab) | ✓ **FF-only** | ✗ | Adapter picks FF path |
| `ImageDetails.rect` (region capture) | ✓ **FF-only** | ✗ | FF native crop; CH canvas crop |
| Full-page capture API | ✗ (w3c/webext #52 open) | ✗ | Stitching (§7) |
| `webRequest` **blocking** header mod (MV3) | ✓ | ✗ (MV3) | FF path |
| `declarativeNetRequest` `modifyHeaders` | limited | ✓ | CH path |
| MediaRecorder | WebM VP8/VP9+Opus (no MP4) | WebM + possible MP4 H.264 | capability detect |
| `getDisplayMedia` in extension pages | ✓ (picker prompt) | ✓ | Video mode B |
| `getUserMedia` (mic) | ✓ (prompt) | ✓ | Video audio |
| `browser.debugger` (CDP) | ✗ **absent** | ✓ | **Deliberately unused** (portability + policy) |
| DPR / media-feature / touch-modality emulation | ✗ (privileged DevTools only) | ✗ (CDP only) | Reporting/assist only |
| Network throttling | ✗ (privileged) | ✗ | Approximate only |
| `sidebar_action` | ✓ rich | `sidePanel` (different) | Adapter |
| `commands` | ✓ (rebind in about:addons) | ✓ (chrome://extensions/shortcuts) | Global open only |
| `storage.local` | ✓ | ✓ (10 MB class) | JSON data |
| `storage.sync` | ✓ (quota-tight) | ✓ | **Not used** (privacy + quota) |
| IndexedDB in extension pages | ✓ | ✓ | Binaries |
| `unlimitedStorage` | ✓ | ✓ | Binaries exemption |
| `permissions.request` (optional origins) | ✓ | ✓ | Framing/sync grants |
| MAIN-world script registration (`world: "MAIN"`) | ✓ (recent FF) | ✓ | Simulation injectee |
| `menus`/`contextMenus` | `menus` | `contextMenus` | Adapter |

## 12. Tech Stack Evaluation

### 12.1 Chosen

| Dependency | Why | Advantages | Disadvantages | Bundle impact | Maintenance | Browser compat |
| --- | --- | --- | --- | --- | --- | --- |
| **TypeScript (strict)** | complex event/state model, cross-layer contracts | safety, refactors, typed messages | build step | 0 runtime | MS-backed, stable | n/a (build-time) |
| **React 18/19** | dense interactive workspace UI; ecosystem for lists/dnd | mature, fast dev, RTL testing | ~45 KB gzip runtime | 135→~45 KB gz | Meta + community | n/a (UI runs in ext pages) |
| **Vite 7+** | multi-entry extension builds, instant watch | fast, standards-based, CSS Modules native | config care for content-script IIFE | dev-time only | OSS, very active | n/a |
| **Zustand** | minimal global stores (workspace/sync state) | ~1 KB, no boilerplate, vanilla core usable in tests | less structure than Redux for huge teams | ~1 KB gz | OSS (pmndrs), steady | n/a |
| **webextension-polyfill** *(port milestone)* | promise API parity on Chromium | de-facto standard, small | tiny wrapper layer | ~6 KB gz | Mozilla-adjacent, stable | FF + CH |
| **CSS Modules + design tokens** | dense dev-tool skin, dark/light, zero runtime | zero dep (Vite), strict scoping, tokens fit theming | manual grid utilities | 0 JS | n/a | n/a |
| **Vitest + @testing-library/react** | unit/integration (same Vite pipeline) | fast, jsdom, unified config | — | dev-time | OSS active | n/a |
| **web-ext** (dev tooling) | run/lint/sign Firefox | Mozilla official | Node-based CLI | dev-time | Mozilla | FF |
| **WebDriver BiDi + geckodriver (E2E)** | real Firefox E2E incl. extensions | real browser truth | slower CI | dev-time | Mozilla/W3C | FF |
| **Playwright (secondary E2E)** | Chromium cross-check when porting | great DX | extension support FF limited | dev-time | Microsoft | CH first |

### 12.2 Evaluated and rejected (for now)

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Svelte / Solid | rejected | Great perf, but React’s testing + hiring + dnd ecosystem wins for this UI density; revisit only if bundle budget fails |
| Redux Toolkit | rejected | Boilerplate vs Zustand for our store count; RTK Query unneeded |
| Tailwind CSS | rejected | Useful speed, but adds build coupling + style lint surface; tokens+Modules keep the “professional dev-tool” look tight and dep-light |
| @crxjs/vite-plugin | rejected | Chromium-centric manifest assumptions; we generate manifests ourselves (2 files of code) for FF-first fidelity |
| jsPDF | rejected | Print-to-PDF covers report PDF need natively; jsPDF adds ~350 KB and layout pain |
| html2canvas / dom-to-image | rejected | Cannot rasterize cross-origin iframes anyway; capture adapters are the supported path |
| ffmpeg.wasm | rejected (Future revisit) | 25 MB+ wasm for WebM→MP4/GIF; violates lean bundle; direct downloads + external conversion guidance instead |
| pixelmatch (+pngjs) | deferred | Tiny and good; first try pure-canvas diff in `core/diff`; adopt pixelmatch only if AA-tolerance quality lags (~3 KB acceptable) |
| axe-core | deferred (V3 opt-in chunk) | ~500 KB min; own core rules first; axe as lazy optional module later |
| Comlink / Redux-Observable | rejected | Native port messaging is already typed; extra abstraction not justified |
| Tailwind-UI / component kits (MUI, Radix) | rejected | Heavyweight look/feel + bundle; hand-rolled dense components match UX.md |
| storage.sync | rejected | Quota + privacy (no account-flavored features) |

### 12.3 Tooling baseline (versions pinned at Foundation)

Node LTS, npm (lockfile committed), ESLint typescript preset, Prettier, commitlint +
Husky, GitHub Actions (typecheck/lint/test/web-ext-lint), `web-ext` run for dev loop.

## 13. Error Handling & Observability

- `Result<T, E>`-style returns across core; UI renders actionable error cards
  (blocked frame → “grant permission / open fallback”; capture fail → retry/diagnostic).
- Local-only debug log (ring buffer in memory, dump-to-clipboard on demand). No crash
  reporting phoning home (privacy invariant).

## 14. Extensibility Points

1. **`AiProvider`** — pluggable adapters (F-128) behind `aiFacade` (core knows nothing of vendors).
2. **`IssueRule` / `A11yRule` packs** — register detectors with metadata (id, severity, run(), evidence).
3. **Device DB** — pure data with schema validation; updated by JSON drops.
4. **Capture backends** — `CaptureAdapter` interface leaves room for Mode C capture-grid.
5. **Report templates** — composer emits model → renderers (HTML/JSON; print CSS for PDF).

## 15. Appendix A — Sync event examples

```jsonc
// scroll from iPhone viewport
{ "channel": "scroll", "sourceViewportId": "vp_1", "epoch": 3, "seq": 182,
  "ts": 1758441000123, "payload": { "xRatio": 0, "yRatio": 0.4285, "maxY": 3521 } }

// click on nav link
{ "channel": "click", "sourceViewportId": "vp_2", "epoch": 1, "seq": 44,
  "ts": 1758441000456,
  "payload": { "selector": "header>nav>ul>li:nth-child(2)>a", "nx": 0.5, "ny": 0.5,
               "href": "/pricing" } }
```

## 16. Appendix B — Workspace file format (v1 sketch)

```jsonc
{
  "schemaVersion": 1,
  "name": "My Website",
  "url": "https://example.com",
  "devices": [ { "refId": "iphone-15", "orientation": "portrait", "zoom": 0.75 },
               { "custom": { "name": "App 390", "width": 390, "height": 844, "dpr": 3 } } ],
  "layout": { "mode": "grid", "columns": 2 },
  "sync": { "scroll": true, "click": true, "nav": true, "reload": false,
             "key": false, "input": false, "form": false },
  "settings": { "theme": "dark", "frames": true, "labels": true }
}
```
