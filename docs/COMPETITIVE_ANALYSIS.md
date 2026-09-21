# Competitive Analysis — ViewGrid vs Responsive Testing Tools

- **Date:** 2026-09-21
- **Method:** Public store listings, vendor sites/documented feature lists, published reviews, official Mozilla DevTools docs. No installation/reverse engineering was performed.
- **Honesty rule applied:** where a capability could not be confirmed from sources, the cell is `?`. Nothing is invented. `~` = partial / limited per sources. `n/a` = category does not apply (e.g. AI columns for DevTools).

---

## 1. Feature Matrix

| Feature | Responsive Viewer | Mobile View¹ | Hoverify | Toolkit² | MultiView³ | Firefox RDM (DevTools) | **Our Extension** |
| ------------------------------ | :---------------: | :----------: | :------: | :------: | :--------: | :--------------------: | :---------------: |
| Multi viewport (live, one screen) | ✓ | ✓ (≤4) | ✓ (34 presets) | ✓ | ? | ✗ (single) | ✓ |
| Device presets | ✓ | ✓ | ✓ (+foldables) | ✓ | ? | ✓ | ✓ |
| Custom viewports (w×h×DPR) | ✓ | ✓ | ✓ | ✓ | ? | ✓ | ✓ |
| Orientation switch | ? | ✓ | ✓ | ? | ? | ✓ | ✓ |
| Per-viewport zoom | ? | ✓ | ✓ | ? | ? | ~ (fit/zoom UI) | ✓ |
| Layouts: grid / row / column | ~ (side-by-side) | ~ (panels) | ~ | ✓ | ? | n/a | ✓ (+free-form V2) |
| Minimize / hide / duplicate / reorder | ✗ (complaints: no reorder) | ? | ? | ? | ? | n/a | ✓ |
| Focus / presentation mode | ? | ✓ (focus) | ? | ? | ? | n/a | ✓ (V2) |
| Sync scroll | ✓ | ✓ | ✓ | ✓ | ? | n/a | ✓ |
| Sync click | ✓ | ✓ | ✓ | ✓ | ? | n/a | ✓ |
| Sync navigation | ? | ✓ | ✓ | ? | ? | n/a | ✓ |
| Sync input / form / keyboard | ~ (input limited) | ? | ✓ (typing, v4.8+) | ✗ | ? | n/a | ✓ (V2) |
| User-Agent emulation | ? | ? | ✓ | ✗ (user complaints) | ? | ✓ (real) | ✓ (V2, JS+header) |
| Touch simulation | ? | ✗ (want-list) | ~ (Chromium only) | ✗ | ? | ✓ (real) | ~ (assist only) |
| Network throttling | ✗ | ✗ | ✗ | ✗ (want-list) | ? | ✓ (real) | ~ (offline + synthetic, honest) |
| Device frames (notch, bars…) | ? | ✓ (status/browser chrome) | ✓ (frames + OS bars) | ✓ (mockups) | ? | ✗ | ✓ (V2) |
| Grid / ruler / measurement | ? | ? | ~ (inspector suite) | ? | ? | ~ (rulers in RDM) | ✓ (V2) |
| Breakpoint inspector | ? | ? | ✓ (media queries) | ? | ? | ~ | ✓ (V2) |
| Design overlay (image compare) | ? | ? | ? | ? | ? | ✗ | ✓ (V2) |
| Screenshot single/all | ✓ | ✓ | ✓ | ✓ | ? | ✓ | ✓ |
| Full-page screenshot | ? | ? | ✓ | ? | ? | ~ (RDM capture) | ✓ (V2) |
| Screenshot annotation | ? | ✓ (pen/box/arrow/text/crop) | ✓ (editor) | ? | ? | ✗ | ✓ (V2) |
| Video recording | ? | ? | ✗ (not listed) | ✗ | ? | ✗ | ✓ (V2, WebM) |
| GIF / transparent PNG output | ? | ? | ? | ? | ? | ~ (transparent PNG RDM) | 🟡 planned⁴ |
| Workspaces (save sets) | ✗ | ✓ (sets, favorites, recents) | ✓ (profiles) | ✓ | ? | ✓ (device list) | ✓ |
| Export / import workspace | ? | ? | ? | ✓ | ? | ✗ | ✓ (V2) |
| Named test presets | ? | ✓ (comparison sets) | ? | ✓ | ? | ~ | ✓ (V2) |
| Localhost support | ✓ | ? | ? | ? | ? | ✓ | ✓ |
| Responsive issue auto-detect | ? | ? | ~ (content/SEO checks) | ? | ? | ✗ | ✓ |
| Regression baseline diff | ? | ? | ? | ? | ? | ✗ | ✓ (V2/V3) |
| AI analysis | ? | ? | ✓ (own API key) | ✗ | ? | n/a | ✓ (V3, opt-in) |
| Accessibility checks | ? | ? | ✓ (axe-core audit) | ✗ | ? | ~ (a11y panel) | ~ (V3 framework) |
| Reports (HTML/JSON/PDF) | ? | ? | ✓ (audit reports) | ? | ? | ✗ | ✓ (V2/V3) |
| Firefox support | ? | ? | ✓ (FF listing exists) | ? | ? | built-in | **✓ first-class** |
| Privacy-first (no telemetry) | ~ (listing claims privacy) | ? | n/a (paid) | ? | ? | n/a | ✓ (guaranteed) |

¹ “Mobile View: Device Emulator & Responsive Tester” (open-source listing).
² “Responsive Website Testing Toolkit — Multi Viewport Simulator”.
³ “MultiView”: a product under exactly this name could not be identified with confidence in research; column kept for completeness and left `?` (honesty rule). “Mobile simulator — responsive testing tool” (4.9★, 54.7K ratings) is noted below instead.
⁴ Mobile simulator ships WEBM/GIF/MP4 + transparent PNG; our GIF export is Future (see PRD §11).

## 2. Product Profiles

### 2.1 Responsive Viewer (free, Chrome ecosystem; ~4.2★)
- **Strengths (confirmed):** clean multi-screen side-by-side comparison; device presets (iPhone/iPad/Galaxy/desktop); sync scrolling + clicks; screenshots; custom viewports; localhost support; praised for daily front-end debugging and privacy language.
- **Weaknesses (confirmed from reviews/coverage):** sites that block framing simply fail (“no fix from the extension’s side”); input syncing limited; **no reorder/reset controls** (views can get stuck); `file://` permission friction; occasional update regressions and device-detection bugs.
- **Takeaway for us:** core loop (multi viewport + sync scroll/click + screenshot + localhost) is the proven daily-driver minimum → our MVP. Fix its two loudest pains: **viewport lifecycle (reorder/remove/reset)** and **blocked-frame UX with honest fallbacks**.

### 2.2 Mobile View: Device Emulator & Responsive Tester (free, open-source, Chrome)
- **Strengths (confirmed):** ≤4 resizable panels over the current tab; realistic frames with **status and browser chrome**; independent orientation/zoom/reload per preview; sync scroll + supported interactions + navigation; custom sizes; **saved device sets, favorites, recents**; focus mode; capture workspace **+ annotation (pen, box, arrow, text, crop)**; one-click comparison sets (Phone+Tablet, iOS+Android…); context menu entry.
- **Weaknesses:** 4-viewport ceiling; no UA/network/touch claims; annotation toolset narrow (no highlight/blur/measure).
- **Takeaway:** annotation + sets + favorites are table stakes for a “workbench” feel → our V2. We go beyond: full-page, video, baselines, free layout.

### 2.3 Hoverify (paid $30/y or $89 lifetime; Chrome + Firefox; ~4.1★)
- **Strengths (confirmed):** Responsive Viewer with **34 device presets incl. foldables**, realistic frames + Safari/Chrome bars; mirrored **scroll, clicks and typing** (form sync since v4.8); custom profiles; viewports larger than the display; claims “injected directly into the page for full compatibility” (in-page injection path around iframe limitations); **touch emulation on Chromium** (uses Chromium-only debugging capability — we deliberately avoid `chrome.debugger` for Firefox parity); **AI content/analysis with user’s own API key**; capture suite (full-page/region/element → JPEG/PNG/WEBP/PDF) + annotation editor; axe-core a11y audit with PDF/JSON/MD/CSV export.
- **Weaknesses:** paid; video recording not offered; breadth (SEO/GEO/assets) dilutes focus.
- **Takeaways:** (1) device **frames quality + sync typing** define “premium” perception; (2) AI must be **user-key, opt-in** — matches our privacy model; (3) a11y export formats (PDF/JSON) are a proven expectation for reports; (4) “inject into the page” resilience idea worth an experimental mode; (5) cross-browser shipping (FF listing) is feasible for this category.

### 2.4 Responsive Website Testing Toolkit (Chrome)
- **Strengths (confirmed):** synced mouse clicks + scroll; customizable viewports; **workspaces for multiple projects; export/import**; screenshots with/without device mockups.
- **Weaknesses (confirmed from reviews):** **user agent not modified** (its most-dragged flaw); no touch gestures; no slow-network simulation; uncommon screen sizes underserved.
- **Takeaway:** workspaces + export/import matter (our F-085/F-087). UA emulation is a **make-or-break** credibility feature — prioritized in V2 (F-035) with real header + JS override.

### 2.5 Mobile simulator — responsive testing tool (4.9★, 54.7K ratings — reference)
- Broad device library, demo-grade frames, **video capture WEBM/GIF/MP4**, transparent PNG screenshots.
- **Takeaway:** capture output variety drives agency/demo adoption. Firefox MediaRecorder cannot do MP4 (see ARCHITECTURE §11) — we ship WebM + capability detection and document conversion.

### 2.6 Firefox Responsive Design Mode (built-in, privileged)
- Device presets + custom devices (name/size/**DPR**/UA/touch — real emulation), orientation, **network throttling** (2G/3G/LTE/DSL/WiFi/Offline), touch simulation, UA override, screenshot, media-query oriented workflow. Device data: `mozilla/simulated-devices`.
- **Limitation:** one viewport at a time.
- **Takeaway:** it is the **fidelity ceiling** extensions cannot exceed (it runs privileged). Strategy: complement, never fake — our capability labels point users to RDM where emulation is impossible. Adopt its device schema + presets as our DB backbone (DEVICE_SPEC).

## 3. Gap Analysis — What Everyone Misses (our opportunity)

| Gap | Evidence | Our answer |
| --- | --- | --- |
| True **workspace** (many viewports + lifecycle + free layout + presentation) | Competitors cap at 4 or lack reorder/hide/dup | F-001…F-010, F-093 |
| **Honest simulation semantics** | Toolkit’s UA flaw; vague “emulator” marketing elsewhere | Capability matrix surfaced in UI; UA via header+JS; ⛔ features clearly labeled |
| **Regression baselines + diff** | Nobody in the set offers baseline/diff | F-107…F-111 |
| **Video of the workspace** | Only Mobile simulator (screen-level) | F-116…F-123 composite + display-capture |
| **Issue detection without AI** | Missing everywhere except indirect checks | F-098…F-106 (P0 detectors in MVP) |
| **Reports** (devices + issues + screenshots + measurements) | Only a11y-audit reports (Hoverify) | F-112…F-115 |
| **Design overlay** | Absent in this set | F-064…F-067 |
| **Firefox-first** | Category is Chrome-centric (Hoverify has FF; rest no) | Whole strategy |
| **Privacy-guaranteed local-first** | Claims vary | SECURITY/PRIVACY + no telemetry by design |
| **Blocked-frame resilience UX** | Responsive Viewer fails silently-ish | Detection + guidance + fallbacks (TASK §4) |

## 4. Technical Feasibility Notes (confirmed during research)

1. **Framing third-party sites** requires response-header manipulation (`X-Frame-Options`, CSP `frame-ancestors`) — the community-standard approach (`webRequest` blocking on Firefox; `declarativeNetRequest` on Chromium), carefully scoped to `sub_frame` + initiator. Known caveats: service-worker-served responses bypass interception; JS framebusting still works. (w3c/webextensions #483 documents this as the current state of the art.)
2. **Firefox-only capture advantages:** `tabs.captureTab` captures **inactive tabs**; `ImageDetails.rect` captures a **region** — both used behind our capture adapter (Chromium falls back to `captureVisibleTab` + client crop).
3. **MediaRecorder:** Firefox records WebM (VP8/VP9 + Opus) — **not MP4**; Chromium may record MP4 where system H.264 encoders exist. Runtime `isTypeSupported()` everywhere.
4. **Emulation ceiling:** DPR, media features (`prefers-color-scheme`, `prefers-reduced-motion`, `forced-colors`), network throttling and true touch modality are DevTools-privileged; **no WebExtension API** provides them (Chrome extensions using `chrome.debugger` get some — Firefox has no `debugger` API → we exclude it by design for parity).
5. **UA override** is feasible on two layers: HTTP header rewrite + MAIN-world `navigator` override (page CSP and Worker contexts impose known partials).

## 5. Conclusion

The category proves the core loop (multi viewport + sync + capture) and is full of
half-finished workbenches: missing reorder, missing UA, missing video/baselines/reports,
and weak framing-failure handling. Firefox — the ecosystem we target first — is
underserved. Our differentiator is an **honest, complete responsive workspace**:
MVP nails the daily loop with lifecycle + issue detection; V2 completes the workbench
(frames, annotation, overlay, video, baselines, reports); V3 adds simulation depth,
a11y framework and privacy-safe AI. Where platform APIs forbid true emulation we say so
and point to the supported path instead of faking fidelity.
