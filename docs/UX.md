# UX Architecture — ViewGrid

Developer-tool UX: **professional, minimal, dense but readable, keyboard-friendly,
dark/light, responsive, progressive disclosure. No decorative animation. No settings
wall.** (Product requirement §33.)

---

## 1. Surfaces

| Surface | Role | Notes |
| --- | --- | --- |
| **Workspace tab** | Primary. Full-page extension page (`moz-extension://…/workspace.html`) | The product |
| **Popup** | Launcher: open workspace (current URL / blank / recent workspaces), quick preset | < 360 px wide, 1–2 actions deep max |
| **Options** | Global settings, shortcut remapping, storage/data controls, AI config (V3) | |
| **Sidebar (FF) / SidePanel (CH)** — V2 candidate | Persistent sync toggles + issue summary while workspace is open | Validate value in v0.2 (Open Question #6) |
| **Context menu** | Open page/link in workspace, capture | |

## 2. Workspace Anatomy

```text
┌ Toolbar ──────────────────────────────────────────────────────────────┐
│ [← → ⟳] [ URL bar ........................ ] [＋ Add] [☰ Presets]      │
│ Layout: [grid|col|row|free]  Sync: [⟳• 🖱• 🔗• ▾more]  [▦ grid] [📏] │
│ [🔍 issues 4] [📷] [⏺ video] [▷ present] [⛶ fullscreen] [⚙] [◐ ☀]   │
├ Canvas ───────────────────────────────────────────────────────────────┤
│ ┌ iPhone 15 ─ 390×844 ─┐  ┌ Pixel 9 ─ 412×915 ─┐  ┌ iPad Air ─────┐ │
│ │ ▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜   │  │                     │  │               │ │
│ │ │   live iframe   │   │  │    live iframe      │  │  live iframe  │ │
│ │ ▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟   │  │  [sync indicator]   │  │               │ │
│ └ ⤢ 🔍 📷 ⋮ ─────────┘  └─────────────────────┘  └───────────────┘ │
├ Status bar ───────────────────────────────────────────────────────────┤
│ 3 viewports · 1280 px workspace zoom 75% · issues: 4 · local-only ●  │
└───────────────────────────────────────────────────────────────────────┘
```

Viewport card header: device name, live W×H, orientation, zoom, per-viewport actions
(focus, duplicate, hide, remove, menu ⋮). Frame art wraps the iframe **outside** the
logical viewport box.

## 3. Progressive Disclosure (3 levels)

1. **Always:** toolbar essentials (nav, add, layout, sync master, capture, issues badge).
2. **On demand (inspector drawer, right):** grid/ruler settings, element measurement,
   breakpoint inspector, per-channel sync toggles, design overlay controls, issue list.
3. **Settings (rarely):** simulation, network presets, shortcut map, storage, AI.

New users see a 20-second first-run micro-guide overlay (dismissible, re-openable from ⚙).
Advanced features never block the core loop.

## 4. Interaction Model

- **Add viewport:** picker sheet (search + categories + favorites + recents + custom form).
- **Reorder:** drag card headers in auto layouts; drop targets show insertion lines.
- **Free-form (V2):** drag to move, corner handles to resize (logical px shown live), snap
  to 8 px grid with Alt to disable; layers z-order via ⌘/Ctrl+scroll on card.
- **Minimize:** card collapses to a title chip row. **Maximize/focus:** F or double-click
  header; Esc restores.
- **Zoom:** workspace zoom in status bar (fit / %), per-viewport zoom in card header menu.
- **Toasts** (bottom-right, 4 s): sync skips, capture done, permission hints. Errors use
  inline **error cards** in the viewport with one primary action (“Grant access”, “Retry”,
  “Open in tab instead”).
- **Every action keyboard-reachable** (§6). Focus rings mandatory (tool itself is
  WCAG-minded).

## 5. Visual Design Rules

- **Tokens:** spacing 4-based, radii 4–6 px, 13 px base font (SF/Segoe/Roboto system
  stack), monospace for measurements. Dark default for dev-tool feel (system-aware + manual).
- **Density:** card paddings 8 px; table rows 28 px; toolbar height 40 px.
- **Color:** neutral surfaces + one accent; severity palette 🔴 critical / 🟠 major /
  🟡 minor / 🟢 pass used consistently (issues, diffs, baselines).
- **Motion:** none decorative; only functional transitions ≤ 120 ms (drawer, toast).
  Respect `prefers-reduced-motion` in our own UI (we can for ourselves).
- **Empty states:** illustration-free, one sentence + one action.
- **i18n-ready:** all strings via message tables (EN first; TR next — Open Question).

## 6. Keyboard Map (defaults; in-app remappable V2 — F-137)

| Action | Default | Scope |
| --- | --- | --- |
| Open workspace | browser command (user binds in about:addons) | global |
| Add viewport | `A` | workspace |
| Remove focused viewport | `Shift+Delete` | workspace |
| Focus next / prev viewport | `Tab` / `Shift+Tab` (cards) · `1…9` jump | workspace |
| Toggle focused viewport maximize | `F` | workspace |
| Toggle grid / ruler | `G` / `R` | workspace |
| Toggle sync master | `S` | workspace |
| Screenshot focused viewport | `C` | workspace |
| Screenshot all | `Shift+C` | workspace |
| Fullscreen workspace | `F11`-like `Shift+F` | workspace |
| Presentation mode | `P` | workspace |
| Rotate orientation | `O` | focused viewport |
| Reload all | `Shift+R` | workspace |
| Close drawer / cancel | `Esc` | workspace |

Conflict handling: remap UI captures keys, flags collisions, restores defaults.

## 7. Mode Switches

- **Workspace (default)** → **Focus mode** (one viewport, thin exit bar) → **Presentation
  mode** (V2: fullscreen, dark backdrop, UI hidden, labels toggle, device carousel,
  Esc exits) → **Annotation editor** (V2: modal studio over a capture) → **Recorder tray**
  (V2: docked bottom strip while recording).

## 8. Capability Honesty in UI (differentiator)

Simulation limits are surfaced inline, never silently:

- DPR chip: “DPR 3 (metadata — layout DPR not emulated)”
- Color scheme control: “Media-feature emulation unavailable to extensions → report mode” + “Open Firefox RDM” link
- Network presets labeled “approximate (synthetic delay)” / “offline (blocking)”
- Video format chip shows negotiated codec (“WebM · VP9 · Opus”)

## 9. Accessibility of the Tool Itself

Keyboard-only operable, visible focus, ARIA roles on cards/dialogs, contrast ≥ AA for
all text, no color-only status (icons + text), reduced-motion respected. The tool that
tests accessibility must not ship inaccessible (fits F-124 narrative).

## 10. Wire Notes for Key Flows

**Blocked-frame error card:** headline “This site refuses to be framed” → bullets
(site policy / service worker / permission) → actions: *Grant site access*,
*Open site in tab + capture grid (soon)*, *Read why* (link to SECURITY §4 in options help).

**Issue panel:** grouped by severity, row = [icon] [rule] [device] [selector] [note];
click → scrolls/outline in that viewport; footer: “Export report”, “Re-scan”.

**Consent dialog (AI, V3):** payload preview (JSON diff view), per-item checkboxes,
“Send once”, provider indicator, key never displayed in full.
