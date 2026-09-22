# Changelog

All notable changes to ViewGrid will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
