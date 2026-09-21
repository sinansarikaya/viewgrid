# Privacy Policy — ViewGrid

Plain-language summary of what this extension does with data. Short version:

> **No analytics. No tracking. No external requests — by default and forever at the core.
> Everything you create stays on your machine. The only feature that can send data over
> the network is the optional AI analysis, and only with your explicit per-request
> consent and your own API key.**

This document is the source for the store listing privacy policy (ROADMAP §5).

---

## 1. Defaults (product-wide invariants)

| Behavior | Default |
| --- | --- |
| Analytics / telemetry | **None** — not implemented, not planned |
| Crash reporting to us | **None** (local debug log only, you can copy it) |
| Tracking / advertising | **None** |
| External requests from the core product | **None** |
| Accounts / sign-in | **None** |
| Data sold/shared/sold-as-insight | **Never** |
| Cloud sync | **None** (out of scope) |

## 2. What is stored, and where

All storage is **local to your browser profile** (`storage.local` + IndexedDB):

| Data | Purpose | Where | Leaves device? |
| --- | --- | --- | --- |
| Settings, keyboard shortcuts | Your preferences | storage.local | No |
| Workspaces, presets, custom devices | Your test setups | storage.local | No |
| Screenshots, baselines, videos, annotations | Your artifacts | IndexedDB | No (only when **you** export/download) |
| Issue results, measurements, reports | Your test outputs | IndexedDB | No (only when **you** export) |
| Debug log (ring buffer) | Troubleshooting; shared only if you copy-paste it | memory | No |
| AI API keys | Calling your chosen AI provider | storage.local (never synced) | Only sent to **your** provider when you run AI |

Pages you test are loaded by frames into the workspace — that traffic is ordinary
browsing to those sites (their own privacy policies apply); the extension itself sends
nothing else.

## 3. Optional AI analysis (V3) — explicit opt-in

If and when you enable AI features:

1. You configure a provider and **your own API key** (e.g. OpenAI-compatible, Anthropic,
   or a local endpoint such as Ollama). We never operate a server or proxy.
2. Every analysis request shows a consent dialog with the **exact payload** — typically
  : URL under test, detected issue list, and optional screenshot thumbnails you can
   deselect.
3. Data goes directly from your machine to that provider under **their** privacy policy.
4. You can delete keys and history at any time (“Clear all local data”).
5. The core product works fully with AI disabled (offline fix-prompt templates included).

## 4. Permissions vs privacy

Optional host permissions (needed to render/test arbitrary sites with sync and scanning)
are requested at the moment of use, per feature (and per site where possible). Declining
them never blocks unrelated features. See `docs/SECURITY.md` §2 for the full list with
justifications.

## 5. Your controls

- **Export** your workspaces/reports/files any time (plain JSON/PNG/MP4/WebM/HTML).
- **Delete** anything: per-artifact delete, or **Clear all local data** (storage + IndexedDB).
- **Disable** framing/sync/simulation per site and globally.

## 6. Children

Not directed at children; no personal data is collected from anyone.

## 7. Changes to this policy

Any change that weakens these promises will be a **major version**, announced in the
changelog and in-store. Adding telemetry would require a separate, explicitly opt-in —
and is currently **not planned at all**.

## 8. Contact

Privacy questions: use the contact channel listed on the store page (set at first
release, see ROADMAP).
