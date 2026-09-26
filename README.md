# ViewGrid

<div align="center">

![ViewGrid Multi-Viewport Responsive Testing Workspace](website/public/screenshots/workspace.png)

# Test every breakpoint at once.

**View phone, tablet, and desktop layouts side-by-side in one browser tab, with synchronized scrolling and interaction.**

*Stop resizing your browser.*

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-v1.0.1-4285F4?style=flat&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/viewgrid-%E2%80%94-responsive-vie/hmlhooeamfmhdeichnghcklahfgimgef)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox_Add--ons-v1.0.1-FF7139?style=flat&logo=firefoxbrowser&logoColor=white)](https://addons.mozilla.org/en-US/firefox/addon/viewgrid-responsive-viewer/)
[![WebExtension Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](scripts/manifest.mjs)
[![CI / Build & Test](https://github.com/sinansarikaya/viewgrid/actions/workflows/ci.yml/badge.svg)](https://github.com/sinansarikaya/viewgrid/actions/workflows/ci.yml)
[![Tests Passing](https://img.shields.io/badge/tests-54%20passed-brightgreen.svg)](tests/)
[![Privacy: Local-First](https://img.shields.io/badge/Privacy-Zero%20Telemetry-emerald.svg)](docs/PRIVACY.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<br />

[**Official Website**](https://viewgrid.sinansarikaya.dev) • [**Chrome Web Store**](https://chromewebstore.google.com/detail/viewgrid-%E2%80%94-responsive-vie/hmlhooeamfmhdeichnghcklahfgimgef) • [**Firefox Add-ons**](https://addons.mozilla.org/en-US/firefox/addon/viewgrid-responsive-viewer/) • [**Quick Start**](#-quick-start--installation) • [**Documentation**](#-documentation-map) • [**Contributing**](CONTRIBUTING.md)

<p align="center">
  <a href="https://chromewebstore.google.com/detail/viewgrid-%E2%80%94-responsive-vie/hmlhooeamfmhdeichnghcklahfgimgef">
    <img src="https://img.shields.io/badge/Chrome_Web_Store-Add_to_Chrome-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Install on Chrome" />
  </a>
  &nbsp;&nbsp;
  <a href="https://addons.mozilla.org/en-US/firefox/addon/viewgrid-responsive-viewer/">
    <img src="https://img.shields.io/badge/Firefox_Add--ons-Get_Firefox_Add--on-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white" alt="Install on Firefox" />
  </a>
</p>

</div>

---

## ⚡ Why ViewGrid?

Testing responsive websites screen-by-screen in browser DevTools is tedious and error-prone. You open DevTools, switch to device emulation, drag the window border, and squint at 375 pixels. You fix a mobile layout bug, commit, and only discover later that your fix broke the navigation bar at 840 pixels or caused an overflow at 1024 pixels.

**ViewGrid** replaces repetitive window-dragging with a unified, multi-viewport workspace inside your browser:

- **See all screens at once:** Keep phone, tablet, laptop, and desktop viewports side-by-side in real time.
- **Scroll once, test everywhere:** Interact with one screen while all other viewports mirror your actions with zero echo loops.
- **Catch responsive bugs before production:** Spot layout shifts, hidden overflows, and small tap targets immediately.
- **Verify against designs:** Overlay Figma design mockups directly over live code with adjustable opacity.

---

## 🚀 Core Capabilities

### 📱 Responsive Testing
- **Simultaneous Multi-Viewport Grid:** Render up to 16 real-time viewports simultaneously with auto-fit matrix, vertical stack, or horizontal row layouts.
- **Zero-Echo Interaction Sync:** Mirror scroll positions, mouse clicks, text typing, and navigation across all active viewports without feedback loops.
- **21+ Curated Device Presets:** One-click presets for iPhone 15/14, iPad Pro/Air, Galaxy S24, MacBook, and 4K desktop screens, plus custom pixel width/height inputs.
- **Orientation Flipping:** Instant portrait/landscape rotation with real-time viewport aspect ratio recalculation.

### 🎨 Visual Comparison & Design QA
- **Dual Split Diffing:** Select any two viewports and compare them side-by-side or with an interactive split slider.
- **Proportional Optical Curtain:** Compare breakpoint transitions with a 100% height optical curtain that respects natural device widths.
- **Figma Design Mockup Overlay:** Load PNG or SVG mockups over live pages, toggle opacity (0–100%), and verify sub-pixel font weights, padding, and alignment.
- **HiDPI PNG Screenshot Export:** Capture individual viewports or the entire multi-device canvas in crystal-clear full-resolution PNG.

### 🛠️ Developer Workflow & Security
- **Localhost & Internal Staging:** Seamlessly inspect `localhost:3000`, `127.0.0.1`, internal VPNs, and live production URLs without tunnels or cloud middleman proxies.
- **Smart Framing Engine:** Automatically strips `X-Frame-Options` and relaxes CSP `frame-ancestors` solely for workspace `sub_frame` requests (Chromium DeclarativeNetRequest & Firefox webRequest). Your other browser tabs remain 100% secure.
- **Service Worker & PWA Isolation:** Automatic cleanup of stale Service Workers and cache storage on launch to guarantee fresh previews of protected sites.
- **Responsive Issue Scanner:** Automated DOM scanner identifying horizontal page overflow, truncated text, and touch targets smaller than 44×44px.
- **Keyboard-First Navigation:** Full shortcut layer (`Alt+Shift+V` to open workspace, `D` for diff, `S` for sync, `C` for screenshot, `I` for inspector, `?` for cheatsheet).

---

## 🔒 Privacy & Local-First Architecture

ViewGrid is built on a **strict local-first, zero-telemetry** security architecture:

- **100% Local Execution:** All DOM rendering, interaction synchronization, and image diffing happen locally inside your browser sandbox.
- **Zero Telemetry:** No analytics beacons, no tracking scripts, no third-party CDNs, and no external servers.
- **Transparent Permissions:**
  - ViewGrid requests host permissions (`<all_urls>`) strictly to embed target preview tabs inside workspace frames and synchronize interactions across them.
  - Header modifications (`X-Frame-Options` and `CSP frame-ancestors`) are isolated exclusively to workspace `sub_frame` requests. Normal tabs and browsing history are never modified or monitored.

---

## ⚡ Performance Architecture

Unlike heavy desktop applications or Electron wrappers that consume 850 MB+ of memory, ViewGrid runs directly inside the native browser runtime:

- **Ultra-lightweight memory footprint:** Consumes **~14 MB RAM** in benchmark testing environments.
  > *Note on benchmark context: Measured in our standard benchmark scenario (3 concurrent viewports rendering standard responsive web content on Chromium and Firefox). Actual memory consumption varies depending on page complexity, media assets, hardware, and total number of active viewports.*
- **60 FPS Synchronized Scrolling:** Scroll events are coalesced using `requestAnimationFrame` with sequence timestamp fencing to ensure buttery-smooth navigation across multiple viewports without CPU throttling.

---

## 📸 Visual Showcase

| Multi-Device Workspace Grid | Proportional Curtain & Figma Diff |
| :---: | :---: |
| ![Multi-Device Workspace](website/public/screenshots/workspace.png) | ![Compare & Diff View](website/public/screenshots/compare.png) |

| Built-in Device Preset Catalog | Responsive DOM Issue Scanner |
| :---: | :---: |
| ![Device Picker](website/public/screenshots/device-frames.png) | ![Issue Inspector](website/public/screenshots/inspector.png) |

---

## 📥 Quick Start & Installation

### 1. Official Extension Stores (Recommended)

Install ViewGrid directly from official browser directories with automatic updates:

| Browser / Platform | Channel | Status | Direct Link |
| :--- | :--- | :---: | :--- |
| **Google Chrome, Brave, Edge, Arc, Opera** | [Chrome Web Store](https://chromewebstore.google.com/detail/viewgrid-%E2%80%94-responsive-vie/hmlhooeamfmhdeichnghcklahfgimgef) | **Live (v1.0.1)** | [Add to Chrome](https://chromewebstore.google.com/detail/viewgrid-%E2%80%94-responsive-vie/hmlhooeamfmhdeichnghcklahfgimgef) |
| **Mozilla Firefox, Zen Browser, LibreWolf** | [Firefox Add-ons (AMO)](https://addons.mozilla.org/en-US/firefox/addon/viewgrid-responsive-viewer/) | **Live (v1.0.1)** | [Add to Firefox](https://addons.mozilla.org/en-US/firefox/addon/viewgrid-responsive-viewer/) |

---

### 2. Manual Sideload via GitHub Release ZIP

1. Download the latest release package (`viewgrid-1.0.1-chromium.zip` or `viewgrid-1.0.1-firefox.zip`) from [GitHub Releases](https://github.com/sinansarikaya/viewgrid/releases).
2. Verify package integrity against `SHA256SUMS`.
3. Unzip the downloaded archive.
4. **In Chrome/Edge/Brave:** Navigate to `chrome://extensions`, enable **Developer mode**, and click **Load unpacked**.
5. **In Firefox:** Navigate to `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…**, and select `manifest.json`.

---

### 3. Developer Setup (Build from Source)

```bash
# 1. Clone the repository
git clone https://github.com/sinansarikaya/viewgrid.git
cd viewgrid

# 2. Install dependencies (pnpm is the canonical package manager)
pnpm install

# 3. Run unit tests (54 passing tests)
pnpm test

# 4. Run typechecks & code linter
pnpm run lint
pnpm run typecheck
pnpm run typecheck:website

# 5. Build extension bundles for both Firefox and Chromium
pnpm run build:all
# → dist/firefox  (MV3 Event Pages + webRequest)
# → dist/chromium (MV3 Service Worker + DeclarativeNetRequest)

# 6. Package release archives
pnpm run package:release
# → release/viewgrid-1.0.1-chromium.zip
# → release/viewgrid-1.0.1-firefox.zip
# → release/SHA256SUMS
```

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| `Alt+Shift+V` / `Alt+V` / `⌘+Shift+V` | Open / Toggle ViewGrid Workspace |
| `D` | Toggle Split-Diff Comparison Mode |
| `S` | Toggle Interaction Synchronization (Scroll/Click/Input) |
| `A` | Add Custom Viewport / Open Device Preset Picker |
| `O` | Rotate Viewport Orientation (Portrait ↔ Landscape) |
| `G` | Cycle Grid, Column, and Row Layout Modes |
| `C` | Capture Full-Canvas Workspace Screenshot |
| `Shift+C` | Capture Active Viewport Screenshot |
| `F` | Zoom to Fit (Fit all viewports neatly on screen) |
| `I` | Open Responsive Issue Scanner / Breakpoint Inspector |
| `Shift+R` | Force Hard Reload & Bypass Cache across all viewports |
| `?` | Open In-App Keyboard Shortcuts Cheatsheet |
| `Esc` | Close Open Modals / Drawers |

---

## 📐 Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ViewGrid Architecture                           │
└────────────────────────────────────────────────────────────────────────┘
  ui/ (React 18 + PostCSS + CSS Modules)
   ├── Workspace Shell & Multi-Device Canvas
   ├── Viewport Card Grid & Device Framing
   ├── CompareModal (Dual Split / Proportional Curtain / Figma Diff)
   └── SettingsModal & IssuesDrawer
         │
         ▼
  core/ (Pure TypeScript Engine)
   ├── Devices Engine (21+ Presets + Custom Dimensions)
   ├── Sync Protocol (Epoch/seq loop-proof guards)
   ├── Layout Engine (Grid / Row / Column / Auto-fit)
   └── Capture Math & DOM Issue Detectors
         │
         ▼
  platform/ & background/ (Typed Facade & Service Worker)
   ├── Header Relaxation (Scoped XFO, CSP, COOP, COEP, CORP)
   ├── Message Router & DNR Rules
   ├── Service Worker & BrowsingData Cache Cleaner
   └── Capture Engine (tabs.captureTab / captureVisibleTab + DPR Crop)
```

---

## 🗺️ Documentation Map

| Document | Purpose |
| :--- | :--- |
| [`docs/STORE_LISTINGS.md`](docs/STORE_LISTINGS.md) | Official store listing copy for Chrome Web Store and Firefox AMO |
| [`docs/STORE_SCREENSHOT_PLAN.md`](docs/STORE_SCREENSHOT_PLAN.md) | Screenshot strategy, captions, and specifications for store assets |
| [`docs/GITHUB_METADATA.md`](docs/GITHUB_METADATA.md) | GitHub repository About description, website URL, and recommended topics |
| [`CHANGELOG.md`](CHANGELOG.md) | Release history, version changelogs, and notable changes |
| [`SECURITY.md`](SECURITY.md) | Security policy, vulnerability disclosure, and threat model overview |
| [`docs/PRIVACY.md`](docs/PRIVACY.md) | Privacy defaults, data inventory, and permission justifications |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Browser abstraction, sync protocol, and engine internals |
| [`docs/PRD.md`](docs/PRD.md) | Product Requirements Document (vision → roadmap → capabilities) |
| [`docs/COMPETITIVE_ANALYSIS.md`](docs/COMPETITIVE_ANALYSIS.md) | Competitive workflow comparison and architectural differentiation |
| [`docs/DEVICE_SPEC.md`](docs/DEVICE_SPEC.md) | Device profile schema, viewport dimensions, and DPR standards |
| [`docs/TESTING.md`](docs/TESTING.md) | Testing strategy and Definition of Done |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Version roadmap and release milestones |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Development workflow, guidelines, and PR checklist |

---

## 💖 Support & Sponsorship

If ViewGrid helps you build better responsive websites and saves you debugging time, consider supporting ongoing open-source development!

[![Sponsor ViewGrid](https://img.shields.io/badge/Sponsor-%E2%9D%A4-pink?style=for-the-badge&logo=github)](https://github.com/sponsors/sinansarikaya)

👉 [**Become a Sponsor on GitHub**](https://github.com/sponsors/sinansarikaya)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Created with ❤️ by [Sinan Sarıkaya](https://github.com/sinansarikaya).
