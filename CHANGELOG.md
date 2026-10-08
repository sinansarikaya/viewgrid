# Changelog

All notable changes to ViewGrid will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## Scan/report and website corrections to 1.0.3 - 2026-10-08

The extension remains 1.0.3. Changes are limited to scan collection/detectors, report UI, associated tests and website/documentation.

- Stop treating every overflow ancestor as intentional clipping. Preserve small-target checks inside scroll/overflow containers; exclude fully hidden off-canvas content and explicitly truncated text.
- Allow one CSS pixel of rounding tolerance for the 44px touch-target recommendation to avoid reporting 43.99px as a meaningful shortfall.
- Add fixed-height vertical text clipping detection, with measured height evidence.
- Display inspected DOM counts per viewport; keep failed and 5,000-element-limited scans distinguishable from successful zero-finding scans.
- Export an escaped standalone HTML report with URL, version, scan time, devices, scope, failures and filter status. It can be printed to PDF. Enable JSON/copy exports even with zero findings.
- Changelog now reuses the main site shell, typography, theme and language controls. All entries are available in EN/TR/NO, and language/theme choices persist across pages.
- Repair the website topbar with a separate version badge, non-overlapping tracks and responsive navigation.
- Update the website to 1.0.3, add a changelog page and locally hosted English/Turkish videos. Norwegian uses the English video; language switching stops and reloads the selected video.

## Same-version corrections to 1.0.3 - 2026-10-08

No manifest/package version increment. Corrected packages receive a source build ID; the original tag and original release ZIPs remain unchanged.

- Reproduced CastPost failure in both browsers after registering its real /sw.js in a normal tab. Prior clean-profile tests did not cover this case.
- Gate preview navigation on framing-rule readiness and selected-site service-worker removal. The first blocked document cannot run a content-script recovery hook, so cleanup now happens before any iframe request.
- Selected-site worker removal uses Chromium origin filters or Firefox hostname filters. It can affect workers used by normal tabs for the same site; no cookies, localStorage, sessionStorage, IndexedDB or CacheStorage removal is requested. No global cache cleanup is invoked.
- Preview document requests bypass stale HTTP cache headers. Ordinary-tab framing protections remain unchanged.
- Route scroll directly through the verified workspace parent instead of a background runtime round trip; apply instant target scrolling and remove the 120ms scroll input lock.
- Show installed manifest version and source build ID in the workspace; same-URL retry/reload recreates previews and fences previous-document events.
- Test CastPost with a warmed worker, repeated workspace reopening, Chromium browser restart, data-preservation checks and measured scroll relay latency. Publish distinct build-ID assets under the existing 1.0.3 release.

---

## [1.0.3] - 2026-10-08

### Fixed

- Protected Chromium previews now continue loading after page-initiated navigation and reload. Removed the extension-only initiator filter while retaining verified workspace-tab scoping. Chromium exceptions include nested workspace frames; normal browsing tabs retain their protections.
- Firefox uses Manifest V2: Firefox MV3 does not allow webRequest or DNR to relax X-Frame-Options/CSP. The Firefox build removes XFO and only CSP frame-ancestors on direct workspace previews, preserving other directives and cookies.
- Chromium previews recover their viewport identity from the verified workspace parent when cross-site navigation clears window.name, keeping worker isolation and synchronization active.
- URL changes replace preview documents and fence delayed events from the previous page, preventing slow navigation from being canceled by stale reload synchronization.
- Build manifests read the version from package.json. Packaging rejects stale manifests instead of shipping a mismatched build.

### Distribution and regression coverage

- Committed both ready-to-load builds under dist/chromium and dist/firefox; source ZIPs now include them. dist/README.md identifies the correct installation folder for each browser.
- Added real Firefox extension tests, protected document navigation/reload, normal-tab isolation, click synchronization, preview worker isolation and live CastPost checks. Chromium also covers protected navigation and preview-scoped worker registration blocking.
- Updated README, privacy/store text and website browser architecture. GitHub ZIPs remain separate from browser store approval; the Firefox ZIP supports temporary testing, not signed permanent installation.

Service-worker cached or synthetic responses and iframe authentication policies remain browser limitations. Both browser builds defer worker registration until the preview agent verifies its workspace tab, then disables registration and unregisters workers visible in that preview storage partition. Existing controlled previews reload once after unregistering. Normal tabs are untouched; cookies, localStorage, sessionStorage and CacheStorage are retained.

---

## [1.0.2] - 2026-10-08

This maintenance release fixes preview isolation and reload synchronization, improves screenshot completeness, and turns raw responsive detections into reviewable findings.

### Fixed

- Removed the globally scoped framing rule from 1.0.1; direct preview exceptions now require a verified workspace tab. Normal tabs and nested third-party frames are excluded.
- Firefox preserves non-framing CSP directives and all cookie attributes. Chromium's full-CSP removal is confined to direct workspace previews and documented explicitly.
- Removed automatic service worker/cache cleanup, cookie rewriting and storage deletion during refresh. Hard refresh uses browser bypass-cache reload.
- New document epochs preserve synchronization after iframe reload; stale events are rejected. Navigation works independently from click sync; SPA URL changes are detected.
- Input replay uses native setters. Key events reach application listeners; reserved browser shortcuts remain outside synthetic event capabilities.
- Viewport screenshots are tiled at logical size instead of silently clipped or reduced by UI zoom; cancellation, size limits and restoration are included.
- Workspace parsing validates custom profiles, duplicate IDs, finite dimensions and URL schemes. Auto color scheme preserves the site's original theme.
- Removed unsupported fixed RAM/latency claims and corrected shortcut/export documentation.

### Improved Issues panel

- Unique findings vs. per-device occurrences, with duplicate suppression.
- Device/rule/severity/search filters, affected-device highlighting and measured evidence.
- Copy finding, selector or filtered report; export filtered JSON.
- Hidden elements, intentional clipping, ellipsis and inline prose links receive fewer false positives.
- Touch target advice uses 44 CSS pixels on touch profiles and is identified as guidance, not a compliance verdict.
- Scan IDs, pending/failed frames, timestamps and bounded-scan warnings prevent stale or incomplete scans from masquerading as clean results.

### Validation and distribution

Unit/DOM integration tests, TypeScript, lint, Firefox manifest validation and real Chromium extension flows are required by CI. See the commit's Actions results for actual run status. Firefox/ESR and OS-specific manual smoke tests remain necessary; a Chromium result is not Firefox certification.

Browser stores have a separate submission/review process. These GitHub assets do not imply the Chrome Web Store or AMO versions have been updated. The Firefox ZIP is unsigned and can be loaded temporarily for testing.

Known limits: iframe authentication/third-party cookie restrictions and service-worker-served responses can still block a preview; profiles do not emulate hardware DPR or mobile browser engines; screenshots capture the current page viewport, not an arbitrarily long full document. See README for details.

---

## [1.0.1] - 2026-09-24

### Fixed
- **Service Worker & PWA Framing Isolation:** Fixed an issue where websites utilizing Service Workers (such as `castpost.app` with `sw.js`) blocked or failed iframe loading. In Firefox, Service Worker fetch interception caused runtime failures (`sw.js:78`) with unstripped `X-Frame-Options: DENY`. In Chromium, Service Worker `event.respondWith` responses bypassed declarativeNetRequest rules entirely. ViewGrid now automatically clears the target origin/hostname's Service Worker registrations and CacheStorage on URL launch/change via `browsingData`, and disables Service Worker re-registration within preview frames via `world-inject.js`.
- **Subframe Header Stripping on Redirect Chains:** Fixed an issue where `X-Frame-Options` and CSP `frame-ancestors` were not stripped on HTTP 307/302 redirects (such as `castpost.app` redirecting to `/en`).
- **Chromium DNR Dynamic Rules & Max Priority:** Elevated declarativeNetRequest rule priority to 9999 and synchronized persistent dynamic rules (`updateDynamicRules`) alongside session rules, ensuring framing header removal survives browser restarts and extension reload cycles.
- **Workspace Tab ID Auto-Learning:** Workspace tab IDs are now auto-discovered and registered during subframe requests, tab navigation, and initialization, ensuring framing rules apply reliably across all frames.
- **MV3 Storage Persistence:** Preserved active workspace tab state across service worker and event page sleep/wake cycles using `storage.session` and `storage.local` fallback.

### Added
- **Source Code Packaging for AMO:** Automated `viewgrid-<version>-source.zip` packaging for Mozilla Add-on store review and release verification.
- **Prominent Host Permission Banner:** Added a dedicated, non-intrusive banner on top of the workspace canvas when host permissions (`<all_urls>`) are not yet granted, allowing users to grant permission with a single click and automatically reloading all active device frames.
- **Consistent Host Access Detection:** Standardized `hasHostAccess` and `grantHostAccess` across both `<all_urls>` and `*://*/*` origin match patterns for Firefox and Chromium.
- **Cross-Browser BrowsingData Facade:** Added typed `browsingData` facade to `browser.ts` supporting targeted origin/hostname removal of Service Workers and cache across Firefox and Chromium.

---

## [1.0.0] - 2026-09-21

### Added
- **Multi-Viewport Workspace:** Render and test multiple responsive devices side-by-side in a single browser tab with custom widths, heights, and device pixel ratios (DPR).
- **21+ Built-in Device Profiles:** Quick-switch presets covering iPhones, iPads, Galaxy devices, MacBook, 4K desktops, and foldable screens.
- **Visual Comparison Engine:**
  - Dual Split Slider diffing between any two active viewports.
  - Proportional Overlay Curtain with full vertical scroll alignment.
  - Figma Mockup Overlay with opacity controls for sub-pixel design verification.
- **Zero-Echo Synchronization Hub:** Epoch-fenced protocol mirroring scroll, clicks, text typing, navigation, and reloads across viewports without feedback loops.
- **Managed Framing Engine:** Dynamically strips `X-Frame-Options`, `Content-Security-Policy: frame-ancestors`, and COOP/COEP/CORP embedding barriers strictly for workspace `sub_frame` requests.
- **Realistic Device Frames:** Hardware bezels with camera cutouts, speaker grills, and instant portrait/landscape rotation.
- **Per-Viewport User-Agent Spoofing:** Emulates client user-agents per viewport frame for responsive server-side rendering (SSR).
- **High-Resolution PNG Exports:** One-click pixel-perfect export of single viewport devices or the entire multi-device canvas.
- **Responsive Issue Scanner:** DOM inspector scanning viewports for horizontal page overflow, text clipping, and tap targets smaller than 44x44px.
- **Dual Manifest V3 Builds:**
  - Chromium build utilizing Service Workers and DeclarativeNetRequest.
  - Mozilla Firefox build utilizing persistent Event Pages and blocking webRequest filters.
- **Marketing Website:** Official landing page, documentation, and support pages deployed at [viewgrid.sinansarikaya.dev](https://viewgrid.sinansarikaya.dev).

### Security & Privacy
- 100% local browser execution—no telemetry, no external beacons, no remote servers.
- Scoped framing rules that leave all other regular browser tabs untouched.
