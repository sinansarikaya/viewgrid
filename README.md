# ViewGrid

<div align="center">

![ViewGrid Logo Banner](website/public/screenshots/workspace.png)

### Ultra-Fast, Ultra-Light (<15MB RAM) Responsive Web Testing & Multi-Device Workspace Extension

[![CI / Build & Test](https://github.com/sinansarikaya/viewgrid/actions/workflows/ci.yml/badge.svg)](https://github.com/sinansarikaya/viewgrid/actions/workflows/ci.yml)
[![Tests Status](https://img.shields.io/badge/tests-52%20passed-brightgreen.svg)](tests/)
[![WebExtension Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](src/manifest.mjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Memory Footprint](https://img.shields.io/badge/Memory-%3C15MB%20RAM-success.svg)](#-key-features)

[**Live Demo / Website**](https://sinansarikaya.github.io/viewgrid/) • [**Quick Start**](#-quick-start) • [**Documentation Map**](#-documentation-map) • [**Contributing**](CONTRIBUTING.md)

</div>

---

## ⚡ Why ViewGrid?

**ViewGrid** is a professional WebExtension built for frontend engineers, UI/UX designers, and QA teams who need to test web applications continuously across multiple devices—without bogging down their machine. 

Unlike heavy Electron-based desktop simulators that consume 850 MB+ of memory, ViewGrid runs directly inside your browser as a native Manifest V3 WebExtension with an **ultra-low memory footprint (<15 MB RAM)**.

---

## ✨ Key Features

- **⚡ Ultra-Low Memory Footprint (<15 MB RAM):** Extremely lightweight architecture keeps your machine fast and cool.
- **📱 21+ Built-in Device Profiles:** Test on iPhone 15 Pro, iPad Air, Galaxy S24, MacBook Pro, 4K Desktop, Foldables, or define custom viewports.
- **⫴ Dual Split & Proportional Overlay Curtain:** Compare devices side-by-side or use the Proportional Curtain overlay (phone stays narrow, laptop stays wide, 100% full vertical scroll height).
- **🎨 Figma Pixel-Diff Mockup Overlay:** Drag & drop design mockups directly over your live site, toggle opacity, and compare pixel accuracy instantly.
- **🔄 Synchronized Scroll, Click & Input Engine:** Interact with one viewport and seamlessly sync scroll, clicks, and typing across all active device viewports with loop-proof protocol guards.
- **🛡️ Managed Framing Engine:** Bypasses `X-Frame-Options`, `CSP frame-ancestors`, `COOP`, `COEP`, and `CORP` headers safely for workspace tabs only.
- **🧹 Bypass Cache & Cookie Retention:** One-click hard reload, timestamp buster, and full session preservation across restarts.
- **📷 HiDPI Screenshot Export & Issue Scanner:** Capture single, batch, or full workspace screenshots; auto-detect responsive overflow and text clipping issues.
- **⌨️ Custom Keyboard Shortcuts:** Fully configurable shortcuts (e.g. `Alt+Shift+V` to launch, `A` to add device, `C` for screenshots, `S` for sync).

---

## 📸 Screenshots & Showcase

| Workspace Multi-Device View | Proportional Curtain & Figma Diff |
| :---: | :---: |
| ![Multi-Device Workspace](website/public/screenshots/workspace.png) | ![Compare & Diff View](website/public/screenshots/compare.png) |

| Built-in Device Picker | Responsive Issue Scanner |
| :---: | :---: |
| ![Device Picker](website/public/screenshots/device-frames.png) | ![Issue Inspector](website/public/screenshots/inspector.png) |

---

## 🚀 Quick Start

### 1. Load Pre-built Extension in Browser

#### Firefox / Zen Browser (MV3)
1. Download or build `dist/firefox/`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `dist/firefox/manifest.json`.
4. Click the ViewGrid toolbar icon → **Enable Site Access** → **Open Workspace** (or press `Alt+Shift+V`).

#### Chrome / Brave / Edge / Arc (MV3)
1. Download or build `dist/chromium/`.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top right toggle).
4. Click **Load unpacked** and select `dist/chromium/`.

---

### 2. Build from Source

```bash
# Clone repository
git clone https://github.com/sinansarikaya/viewgrid.git
cd viewgrid

# Install dependencies
pnpm install

# Run full test suite (52 unit tests)
pnpm test

# Run TypeScript check
pnpm run typecheck

# Build Firefox & Chromium extension packages
pnpm run build:all
# → dist/firefox (MV3 for Firefox)
# → dist/chromium (MV3 for Chromium)
```

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
| --- | --- |
| `Alt+Shift+V` / `Alt+V` | Open / Toggle ViewGrid Workspace |
| `A` | Open Device Picker Modal |
| `C` | Capture Focused Viewport Screenshot |
| `Shift+C` | Capture Full Workspace Screenshot |
| `S` | Toggle Interaction Sync (Scroll/Click) |
| `G` | Change Layout (Grid / Row / Column) |
| `F` | Toggle Focus Mode |
| `I` | Open Responsive Issue Scanner Drawer |
| `O` | Rotate Device Orientation (Portrait/Landscape) |
| `Shift+R` | Reload All Active Viewports |
| `Esc` | Close Open Modals / Drawers |

---

## 📐 Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ViewGrid Architecture                           │
└────────────────────────────────────────────────────────────────────────┘
  ui/ (React 18 + PostCSS + CSS Modules)
   ├── Workspace Shell & Toolbar
   ├── Viewport Card Grid & Devices
   ├── CompareModal (Dual Split / Proportional Curtain / Figma Diff)
   └── SettingsModal & IssuesDrawer
         │
         ▼
  core/ (Pure TypeScript Engine)
   ├── Devices Engine (21+ Presets + Custom)
   ├── Sync Protocol (Epoch/seq loop-proof guards)
   ├── Layout Engine (Grid / Row / Column / Auto-fit)
   └── Capture Math & Issue Detectors
         │
         ▼
  platform/ & background/ (Typed Facade & Service Worker)
   ├── Header Relaxation (XFO, CSP, COOP, COEP, CORP)
   ├── Message Router & DNR Rules
   └── Capture Engine (tabs.captureTab + DPR Crop)
```

---

## 🗺️ Documentation Map

| Document | Purpose |
| --- | --- |
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

## 💖 Support & Sponsorship

If ViewGrid saves you time and helps you build better responsive websites, consider supporting its open-source development!

[![Sponsor ViewGrid](https://img.shields.io/badge/Sponsor-%E2%9D%A4-pink?style=for-the-badge&logo=github)](https://github.com/sponsors/sinansarikaya)

- ☕ **Buy a coffee ($5/mo):** Support ongoing maintenance, bug fixes, and feature updates.
- ⚡ **Pro Developer ($10/mo):** Get priority response for feature requests and issue reports.
- 🏢 **Sponsor ($25/mo+):** Showcase your logo on the ViewGrid website and repository.

👉 [**Become a Sponsor on GitHub**](https://github.com/sponsors/sinansarikaya)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting Pull Requests or Issues.

Created with ❤️ by [Sinan Sarıkaya](https://github.com/sinansarikaya).
