# Changelog

All notable changes to ViewGrid will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
