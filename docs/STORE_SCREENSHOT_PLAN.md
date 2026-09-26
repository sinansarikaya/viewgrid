# ViewGrid — Store Screenshot Strategy & Plan

> **Target Stores:** Chrome Web Store & Firefox Add-ons (AMO)  
> **Standard Dimensions:** `1280 × 800` px (16:10 aspect ratio, PNG, RGB, 72-150 DPI)  
> **Existing Asset Location:** `release/chrome-screenshots/` and `release/chrome-promos/`  

---

## 🎯 Screenshot Philosophy

Store screenshots should function like mini product advertisements rather than raw, unannotated UI dumps. Each screenshot should communicate one clear outcome within 3 seconds of viewing.

---

## 📸 The 5 Core Store Screenshots

### Screenshot 1 — Main Workspace
- **File:** `release/chrome-screenshots/workspace.png`
- **Headline / Caption:** **"See every breakpoint at once."**
- **Supporting Tagline:** Phone, tablet, and desktop layouts side-by-side in one browser tab.
- **Visual Content:** The ViewGrid multi-viewport canvas displaying iPhone 15 Pro, iPad Air, and MacBook Pro viewports side-by-side rendering a live responsive website.
- **Primary Outcome:** The user immediately understands the multi-screen testing concept without reading text.

---

### Screenshot 2 — Synchronized Interaction
- **File:** `release/chrome-screenshots/light-mode.png` (or a dedicated sync interaction capture)
- **Headline / Caption:** **"Scroll once. Test everywhere."**
- **Supporting Tagline:** 60 FPS zero-echo synchronization for scroll, clicks, and navigation.
- **Visual Content:** Synchronized scroll indicator across three distinct viewports, demonstrating identical page depth and active navigation sync.
- **Primary Outcome:** Proves that viewports are not static mockups, but live interactive frames.

---

### Screenshot 3 — Visual Comparison & Figma Diff
- **File:** `release/chrome-screenshots/compare.png`
- **Headline / Caption:** **"Compare implementation with design."**
- **Supporting Tagline:** Dual-split slider, proportional optical curtain, and Figma mockup overlay.
- **Visual Content:** The Compare Modal showing a live breakpoint split with an optical divider and translucent Figma design overlay.
- **Primary Outcome:** Highlights design QA capability and pixel-level precision.

---

### Screenshot 4 — Responsive Issue Scanner
- **File:** `release/chrome-screenshots/audit.png`
- **Headline / Caption:** **"Find layout issues before they ship."**
- **Supporting Tagline:** Automatic DOM inspection for horizontal overflow and small tap targets.
- **Visual Content:** The Responsive Issues Drawer active on the right, listing severity-tagged layout anomalies (🔴 Horizontal overflow, 🟡 Tap target <44px) with DOM element hints.
- **Primary Outcome:** Positions ViewGrid as an automated debugging workstation rather than just a viewer.

---

### Screenshot 5 — Custom Device Presets & Workflow
- **File:** `release/chrome-screenshots/benchmark.png` (or `website/public/screenshots/device-frames.png`)
- **Headline / Caption:** **"Build the responsive workspace you need."**
- **Supporting Tagline:** 21+ presets, custom pixel viewports, localhost support, and <15 MB RAM footprint.
- **Visual Content:** Device picker modal showing categorized presets (Phones, Tablets, Desktops, Custom) and the lightweight memory architecture badge.
- **Primary Outcome:** Reassures developers of customizable workflows, localhost compatibility, and lightweight performance.

---

## 🎨 Promotional Graphic Tiles (Chrome Web Store)

Chrome Web Store requires special promotional tile assets for featured placements:

### Small Promo Tile
- **Dimensions:** `440 × 280` px
- **File:** `release/chrome-promos/small-tile-440x280.png`
- **Specification:** ViewGrid brand icon + concise title: *"ViewGrid — Multi-Viewport Responsive Workspace"*.

### Marquee Promo Tile
- **Dimensions:** `1400 × 560` px
- **File:** `release/chrome-promos/marquee-tile-1400x560.png`
- **Specification:** Dark theme background, multi-viewport device mockup, and headline: *"Test every breakpoint at once."*

---

## 🚀 Store Upload Checklist (Manual Phase 5 Guide)

When updating the listings in the Google Chrome Developer Console and Mozilla Developer Hub:

1. [ ] Log in to [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole).
2. [ ] Select **ViewGrid** item.
3. [ ] Under **Store listing → Screenshots**:
   - Upload the 5 screenshots in order (1: workspace, 2: sync, 3: compare, 4: audit, 5: presets).
4. [ ] Under **Store listing → Promotional tiles**:
   - Upload `small-tile-440x280.png` (440×280) and `marquee-tile-1400x560.png` (1400×560).
5. [ ] Log in to [Mozilla Add-on Developer Hub](https://addons.mozilla.org/developers/).
6. [ ] Select **ViewGrid** → **Edit Listing** → **Images**.
7. [ ] Upload the screenshots with captions matching the plan above.
8. [ ] Save and submit.
