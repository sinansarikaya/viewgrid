# Device Specification — Presets & Profile Schema (ViewGrid)

Defines the device profile model, preset catalog plan, and custom-device behavior.
The database is **data-only** (`src/devices/`) so it can be updated without code changes
(F-024). Values in this doc are the *plan*; every dimension/DPR/UA string is **verified
against public sources during implementation** (TASK §7) — sources recorded in §5.

---

## 1. Device Profile Schema (v1)

```jsonc
{
  "id": "iphone-15",                 // stable slug, unique
  "name": "iPhone 15",
  "category": "phone",               // phone | tablet | laptop | desktop | custom
  "platform": "ios",                 // ios | android | windows | macos | linux | chromeos | other
  "browser": "safari",               // safari | chrome | samsung-internet | firefox | edge | other
  "width": 393,                      // logical CSS px (viewport width, portrait)
  "height": 852,                     // logical CSS px (viewport height, portrait)
  "devicePixelRatio": 3,             // metadata (display/screenshot scale hints only — see §4)
  "userAgent": "…",                  // canonical portrait UA string (landscape variant derived)
  "touchSupport": true,
  "mobile": true,
  "defaultOrientation": "portrait",  // portrait | landscape
  "safeArea": { "top": 59, "bottom": 34, "left": 0, "right": 0 },  // px, portrait; visual guides
  "deviceFrame": {
    "type": "iphone-15",             // frame art key: none | iphone-15 | iphone-notch | android | ipad | laptop | desktop
    "notch": "dynamic-island",       // none | notch | dynamic-island | punch-hole
    "statusBar": "ios"
  },
  "released": 2023,                  // optional, for catalog browsing
  "popular": true,                   // ranks in picker
  "source": "vendor-specs-2026-xx"   // provenance tag (§5)
}
```

Custom devices are the same schema with `"category": "custom"` plus user fields:
`favorite: boolean`, `createdAt/updatedAt`, `userEditable: true`.

Derived data (computed, not stored): landscape profile (w/h swapped + orientation meta),
zoomed display size, frame art orientation set.

## 2. Preset Catalog Plan (initial)

All widths are logical CSS px. Final pixel values verified at implementation (§5).

### 2.1 Phones (examples — exact list finalized at implementation)
- **Apple iPhone:** SE (3rd gen) 375×667 · 13 / 14 390×844 · 14/15/16 Pro 393×852 · 14/15/16 Plus / Pro Max class 430×932 · 16e/17-class entries as verified (2025–26 releases included once specs confirmed)
- **Google Pixel:** 7 / 8 / 9 family (412×915 class and verified per model) · Pixel Fold (unfolded class) V2
- **Samsung Galaxy:** S22 / S23 / S24 / S25 family (360×800–412×915 class per model) · A-series popular (A54/A55 class)
- **Other Android:** OnePlus (393/412 class), Xiaomi popular models (393/360 class)

### 2.2 Tablets
- **iPad:** 10th gen 820×1180 · Air 820×1180 (verify per gen) · mini 744×1133
- **iPad Pro:** 11″ 834×1194 · 12.9″/13″ 1024×1366 class (verify M-series)
- **Android tablets:** Galaxy Tab S9 class 800×1280 · Pixel Tablet class 1280×800

### 2.3 Laptop widths (fixed, per product requirement)
1024 × 768-class · 1280 × 800 · 1366 × 768 · 1440 × 900 · 1536 × 864
(heights = common native aspect; user-editable as custom)

### 2.4 Desktop
1920 × 1080 (1080p) · 2560 × 1440 (1440p) · 3840 × 2160 (4K) · **Custom…**
DPR defaults: 1 (1080p/1440p), 1–2 (4K configurable).

### 2.5 Built-in named presets (F-088) — one-click device sets
| Name | Devices |
| --- | --- |
| Mobile Test | 390×844, 375×812, 412×915 |
| Standard Responsive | 375, 768, 1024, 1280, 1440, 1920 (widths) |
| iOS + Android | iPhone 15, Pixel 9 |
| Tablet Check | iPad Air, Galaxy Tab S9 |
| Full House | phone, tablet, laptop 1280, desktop 1920 |

## 3. Custom Devices (F-025…F-027) — required operations

Create (Width × Height × DPR + name) · Rename · Duplicate · Edit · Delete · Favorite.
Picker behavior: favorites first, then recents, then categories; search by name/size
(“390” matches width). Deleting a device referenced by a workspace leaves a tombstone
placeholder with the stored numbers (workspace never breaks).

## 4. Metadata Usage Semantics (important)

| Field | Used for | NOT used for |
| --- | --- | --- |
| `width/height` | iframe logical size, breakpoint math, rulers | — |
| `devicePixelRatio` | screenshot scale hints (2× export), DPR badge, frame art density | Layout DPR emulation (**impossible** in WebExtensions — PRD F-038) |
| `userAgent` | HTTP header rewrite + `navigator` override (V2 F-035/36) | Kernel/engine emulation |
| `touchSupport` | tap-target audit thresholds, touch assist defaults | True modality switching (media queries unaffected) |
| `safeArea` | visual guides, frame art | `env(safe-area-inset-*)` (not injectable) |
| `deviceFrame` | cosmetic composite (screenshots/video/presentation) | Viewport geometry (strictly separate layers) |

## 5. Data Sources & Verification Plan (TASK §7)

| Source | Use |
| --- | --- |
| `mozilla/simulated-devices` (GitHub) | Schema shape inspiration + Firefox RDM device set parity |
| Apple “Screen sizes” / Human Interface Guidelines | iPhone/iPad logical pt values + safe areas |
| Google Pixel tech specs / developer docs | Pixel viewport classes |
| Samsung product specs | Galaxy widths/heights/DPR |
| MDN UA guidelines + public UA registries | UA string templates (platform tokens) |
| Our own fixtures | Regression snapshots of the DB (schema + value sanity) |

Rules: every preset carries a `source` provenance tag; PR updates to the DB are
data-only PRs with a values table; disputed/unknown values → do not ship the preset
(honesty rule extends to data).

**Current state (v0.1):** shipped presets carry tag `approx-public-specs` (common,
widely-published CSS viewport sizes — e.g. iPhone 13/14 390×844, iPad Air 820×1180,
laptop widths per product spec). Per-model source verification table lands in v0.2
(TASK §7); values are data-only and updatable without code changes.

## 6. Import / Export & Versioning

- Device DB ships with the bundle (`schemaVersion` field).
- User custom devices live in `storage.local` under their own `schemaVersion`;
  merged at runtime: `picker = BUILTINS ⊕ USER(custom)`.
- Workspace export stores `refId` for builtins (compact) or inlined custom profile
  (portable). Import validates against schema and migrates (TASK §3/§18).
