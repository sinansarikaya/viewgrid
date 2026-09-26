# ViewGrid — Official Store Listings Copy & Strategy

> **Target Version:** `1.0.1`  
> **Channels:** Chrome Web Store (Google) & Firefox Add-ons (AMO — Mozilla)  
> **Repository:** https://github.com/sinansarikaya/viewgrid  
> **Website:** https://viewgrid.sinansarikaya.dev  

---

## 🎯 Positioning & Messaging Rules

1. **Both stores are version 1.0.1.**
2. Lead with the core developer outcome, not a feature dump:
   - Primary: *"Test mobile, tablet, and desktop layouts simultaneously."*
   - Supporting: *"ViewGrid is a responsive testing workspace that puts multiple viewports side-by-side and keeps scrolling and interaction synchronized."*
   - Slogan: *"Stop resizing your browser."*
3. **No unsupported claims:** Do not claim universal guarantees or invent numbers. Benchmark claim (~14 MB RAM) is qualified.
4. **Transparent permission justification:** Clearly explain why host permissions (`<all_urls>`) and header relaxation are needed for workspace sub-frames.

---

## 1. Chrome Web Store Listing

*Note: The Chrome Web Store Developer Console accepts plain text with line breaks and unicode symbols, but does not support markdown tags (`#`, `**`, etc.).*

### Summary (Short Description — Max 132 chars)
```text
Test mobile, tablet, and desktop layouts side-by-side in one tab with synchronized scrolling, Figma diffing, and zero telemetry.
```

### Detailed Description (Formatted for Chrome Web Store Console)
```text
Stop resizing your browser window.

ViewGrid opens a multi-viewport responsive testing workspace directly inside Google Chrome. View phone, tablet, and desktop layouts side-by-side in a single browser tab, with synchronized scrolling, click mirroring, and layout comparison tools.

Whether you are debugging responsive CSS, verifying breakpoints during development, or doing design QA against Figma, ViewGrid gives you the complete viewport picture in real time.


★ TEST EVERY BREAKPOINT AT ONCE
• Multi-Viewport Workspace: View up to 16 viewports simultaneously with auto-fit grid, column, or row layouts.
• 21+ Curated Presets: Instant testing across iPhone, iPad, Galaxy, MacBook, 4K desktop, and foldable screens.
• Custom Dimensions: Configure custom pixel widths, heights, and device pixel ratios (DPR).
• Instant Orientation: Flip between portrait and landscape with a single click.


★ ZERO-ECHO SYNCHRONIZATION
• Synchronized Scrolling: Scroll on any device; all other viewports follow smoothly at 60 FPS.
• Mirrored Interactions: Mouse clicks, form typing, and navigation stay synchronized across all active viewports.
• Loop-Proof Protocol: Epoch-fenced message routing prevents infinite feedback loops and lag.


★ VISUAL COMPARISON & DESIGN QA
• Dual Split Diff: Slide between any two viewports to catch layout shifts between breakpoints.
• Proportional Optical Curtain: Compare transitions with a full-height divider that respects natural device widths.
• Figma Design Overlay: Overlay PNG or SVG Figma mockups directly over live code with opacity controls (0–100%) to catch sub-pixel alignment and typography discrepancies.
• HiDPI PNG Screenshots: Capture individual devices or full-canvas workspace screenshots with one click.


★ BUILT FOR DEVELOPER WORKFLOWS
• Localhost & Staging: Works seamlessly with localhost:3000, 127.0.0.1, internal VPNs, and live production URLs.
• Smart Header Relaxation: Automatically strips X-Frame-Options and relaxes CSP frame-ancestors strictly for preview frames inside your active ViewGrid tab. Normal browser tabs remain 100% untouched.
• Responsive Issue Scanner: Integrated DOM scanner detects horizontal page overflow, text clipping, and touch targets smaller than 44x44px.
• Keyboard-First: Quick access with Alt+Shift+V (or Alt+V / Option+Shift+V), D for diff, S for sync, C for capture, I for inspector.


★ 100% LOCAL & PRIVACY-FIRST
• Zero Telemetry: No analytics trackers, no tracking pixels, and no remote servers.
• Local Browser Execution: All DOM inspection, interaction synchronization, and image diffing run entirely within your local browser sandbox.
• Transparent Permissions: ViewGrid requires host permissions strictly to render and synchronize your target preview sites inside workspace frames. Page content is never collected, transmitted, or stored.


★ LIGHTWEIGHT PERFORMANCE
Native browser execution runs with near-zero overhead (~14 MB RAM in our benchmark testing scenario of 3 concurrent viewports). Your machine stays fast and cool.


★ LINKS & SUPPORT
• Official Website: https://viewgrid.sinansarikaya.dev
• Documentation: https://viewgrid.sinansarikaya.dev/docs/
• GitHub & Source: https://github.com/sinansarikaya/viewgrid
• Issue Tracker: https://github.com/sinansarikaya/viewgrid/issues
```

---

## 2. Firefox Add-ons (AMO) Listing

*Note: Mozilla Add-ons (AMO) supports clean Markdown styling (headings, lists, bold text, links).*

### Summary (Max 250 chars)
```text
Test mobile, tablet, and desktop layouts side-by-side in one browser tab with synchronized scrolling, Figma design diffing, responsive issue scanning, and 100% local processing.
```

### Full Description (Markdown for AMO)
```markdown
# Test every breakpoint at once.

**ViewGrid** is a multi-viewport responsive testing workspace for Mozilla Firefox and Gecko-based browsers (including Zen Browser and Firefox Developer Edition). View phone, tablet, and desktop layouts side-by-side in a single browser tab, with synchronized scrolling, click mirroring, and pixel-level comparison tools.

Stop constantly opening DevTools and dragging window borders. ViewGrid lets you test the entire responsive spectrum simultaneously.

---

### 📱 Responsive Testing Workspace
* **Multi-Viewport Canvas:** Render up to 16 live viewports simultaneously with grid, vertical stack, or horizontal row alignment.
* **21+ Device Presets:** One-click presets for iPhone, iPad, Galaxy, MacBook, and desktop displays, plus freeform custom pixel dimensions.
* **Orientation Toggle:** Switch between portrait and landscape instantly with live aspect ratio recalculation.

### 🔄 Zero-Echo Interaction Sync
* **Synchronized Scrolling:** Scroll one viewport and watch all others mirror the position smoothly at 60 FPS.
* **Synchronized Interactions:** Clicks, form inputs, and navigation links replicate across viewports without feedback loops or echo lag.
* **Granular Toggles:** Turn sync on or off independently for scrolling, clicks, navigation, or reload.

### 🎨 Visual Comparison & Design QA
* **Dual Split Slider:** Compare any two breakpoints side-by-side with an interactive drag slider.
* **Proportional Optical Curtain:** Compare breakpoint transitions with a 100% height optical curtain that respects natural device widths.
* **Figma Mockup Overlay:** Load PNG or SVG mockups over live responsive pages with adjustable opacity (0–100%) to verify sub-pixel alignment, line heights, and padding.
* **HiDPI Screenshot Capture:** Export clean, high-resolution PNG captures of individual devices or the entire multi-device canvas.

### 🛠️ Developer Workflow & Header Handling
* **Localhost & Staging Support:** Test `localhost:3000`, `127.0.0.1`, internal VPNs, and production URLs without proxies or tunnels.
* **Protected Site Framing:** Utilizes Firefox's blocking `webRequest` API to safely strip `X-Frame-Options` and relax `CSP frame-ancestors` solely for workspace sub-frames. Your other browsing tabs remain 100% secure.
* **Responsive Issue Scanner:** Automatically scans DOM nodes for horizontal page overflow, clipped text, and touch targets smaller than 44×44px.
* **Keyboard-First:** Full keyboard navigation (`Alt+Shift+V` to open, `D` for diff, `S` for sync, `C` for screenshot, `I` for inspector, `?` for cheatsheet).

---

### 🔒 100% Local-First & Zero Telemetry
* **Zero Data Collection:** ViewGrid collects no personal data, contains no analytics beacons, and communicates with no external servers.
* **Permission Justification:** Host permissions (`<all_urls>`) and webRequest filters are used strictly to render and synchronize your target websites within the workspace.
* **Open Source:** Licensed under the MIT License on [GitHub](https://github.com/sinansarikaya/viewgrid).

---

### ⚡ Lightweight Memory Footprint
Runs natively as a Firefox WebExtension consuming approximately 14 MB RAM in benchmark testing scenarios.

*(Note: Memory usage measured with 3 concurrent viewports on standard web content; actual usage varies with page complexity and total viewport count).*

---

### 🔗 Resources
* [Official Website](https://viewgrid.sinansarikaya.dev)
* [Documentation & Guides](https://viewgrid.sinansarikaya.dev/docs/)
* [GitHub Repository](https://github.com/sinansarikaya/viewgrid)
* [Report an Issue](https://github.com/sinansarikaya/viewgrid/issues)
```

---

## 3. Reviewer Justification Notes (for Store Submission / AMO Review Q&A)

When submitting updates to Google Chrome Web Store or Mozilla AMO, reviewers frequently ask about permissions:

### Permission Justification: `<all_urls>` / Host Permissions
> **Why it is needed:** ViewGrid is a responsive testing workspace tool that enables frontend developers to load and test user-specified URLs (such as `http://localhost:*`, internal staging IPs, and arbitrary public URLs) inside viewport preview frames. To embed these frames and inject synchronization content scripts (scroll/click mirroring), host access across target origins is required. ViewGrid does not collect or transmit page content.

### Permission Justification: `declarativeNetRequest` (Chromium) / `webRequestBlocking` (Firefox)
> **Why it is needed:** Most modern production websites send `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'self'` headers to prevent framing in arbitrary web pages. ViewGrid strips these headers exclusively for HTTP requests whose tab ID matches an active ViewGrid workspace tab and whose request type is `sub_frame`. Normal browsing tabs and top-level navigation remain completely unaffected.
