# Testing Strategy & Definition of Done — ViewGrid

Goal: every feature is **verifiably** done — not “UI works”. This doc is the contract for
TASK.md checkbox honesty.

---

## 1. Test Pyramid

| Layer | Tooling | Runs | Scope |
| --- | --- | --- | --- |
| Unit | Vitest (node + jsdom) | every commit (CI) | core/ pure logic: viewport math, device schema, sync protocol, state reducers, storage migrations, crop/stitch math, diff engine, report composer |
| Integration | Vitest + WebExtension API mocks (shared adapter contract suite) | every commit (CI) | PlatformAdapter (both impls), messaging bridge, framing rule builder, capture orchestration with fake capture, permission flows |
| E2E | Real **Firefox** via `web-ext` + WebDriver BiDi (geckodriver); Playwright/Chromium as port cross-check | main merges + nightly | Full user flows on real pages |
| Performance harness | scripted scenarios (10–12 viewports) | nightly | budgets: memory ceiling, sync latency, no leak after close |
| Static gates | tsc, ESLint (security rules), Prettier check, `web-ext lint` | every commit | policy + style + manifest validity |

## 2. Unit Test Focus Areas (from requirements §40)

- **Viewport calculations:** orientation swap, zoom transform math (logical vs display),
  resize clamps, governor limits (8 warn / 16 max).
- **Device profiles:** schema validation, builtin⊕user merge, landscape derivation,
  tombstone behavior, preset sets (“Mobile Test”, “Standard Responsive”).
- **Sync engine:** loop prevention (epoch/seq/guards — the critical suite: double-apply
  never re-emits, stale epoch dropped), ratio normalization edge cases (maxScroll 0),
  coalescing/queue caps, selector-path builder stability.
- **State management:** reducers, undoable ops (remove/restore viewport), workspace
  serialization round-trip.
- **Storage:** schema migrations vN→vN+1 (data preserved), quota-error paths, export
  sanitizer (API keys never in output).

## 3. Integration Focus Areas (requirements §40)

- extension ↔ page: content agent lifecycle, port teardown on navigation, MAIN-world
  injection apply/undo.
- multi viewport: N agents reporting; hub routing; toggles per channel.
- navigation: apply-all, back/forward state aggregation, reload channel.
- synchronization: cross-frame scroll/click replay with divergent fixture DOMs (selector
  miss → coordinate fallback → skip+toast).
- framing rule builder: FF webRequest handler + CH DNR rule sets (golden tests — scope
  `sub_frame` + initiator asserted).
- capture pipeline: overlay hiding barrier, crop math DPR cases, stitch planner seams
  (with fake capture source), frame composite on/off parity of logical crop.

## 4. E2E Scenarios (real Firefox)

Fixture test site (self-hosted, deterministic — built in TASK §29):
pages with known breakpoints, horizontal overflow at 390, clipped text, tiny tap
targets, fixed header covering content, forms, nested iframes, hash/history nav,
slow-loading images, `X-Frame-Options` and CSP `frame-ancestors` variants.

| # | Flow | Assert |
| --- | --- | --- |
| E1 | Open workspace from popup on localhost fixture (Vite-style) | 5 frames live, sizes correct |
| E2 | Sync scroll + click | peers aligned (ratio ±2px), no loop storm (event counter) |
| E3 | Navigate URL bar → all viewports | same path; per-viewport state tracked |
| E4 | Custom device CRUD + favorite + preset apply | persistence across restart |
| E5 | Screenshots: single/all + frame ON/OFF | PNG/JPG valid; crop bounds exact |
| E6 | Issue scan on fixture | ≥ expected detections, no false flood |
| E7 | Framing grant flow (blocked site fixture) | error card → grant → frame loads |
| E8 | Save/load workspace | byte-stable round-trip |
| E9 | HMR page (WebSocket) under sync | WS stays alive, no agent teardown leaks |
| E10 | Public https smoke (e.g. example.com / wikipedia) | frames load (grant path), no crashes |

Also: https-localhost (mkcert) case, 192.168.x.x LAN case, mixed-content spike result
folded in (TASK §4).

## 5. Performance Tests

Scenario: 12 viewports, mixed phone/desktop, sync scroll for 60 s.

Budgets (CI machine-relative baselines recorded on first green run):
- No main-thread task > 200 ms during sync (long-task observer).
- Scroll coalescing ≤ 1 apply/frame per viewport.
- Memory returns to baseline ±10% after workspace close (leak gate).
- Full-page stitch of 5-viewport page completes without OOM with governor on.

## 6. Compatibility Matrix Testing

| Axis | Coverage |
| --- | --- |
| Firefox latest + ESR | E2E required |
| Chromium (port) | adapter contract + smoke (required only from port milestone) |
| OS | Linux CI + manual macOS/Windows smoke before release |
| Pages | static, SPA (history API), localhost dev servers, XFO/CSP-hostile, SW-served |

## 7. Definition of Done (every feature / task)

A task may be checked `[x]` in TASK.md only when **all** hold:

1. **Implementation** merged behind the agreed interface (PlatformAdapter where relevant).
2. **Tests** at the right layer(s) added and green in CI.
3. **Documentation** updated (PRD feature row, ARCHITECTURE if mechanism changed, UX if interaction changed).
4. **Error handling** covered: failure paths visible in UI (toasts/error cards), never silent.
5. **Performance consideration** stated for anything touching per-frame hot paths (sync, capture).
6. **Security consideration** stated for anything touching permissions, headers, content scripts, storage, network.
7. `web-ext lint` + typecheck + lint clean.

“UI renders” is explicitly **not** DoD. Shortcut culture is a checklist violation.

## 8. CI Pipeline (target)

```text
PR:  typecheck → lint → unit+integration → web-ext lint → build artifacts
main: + Firefox E2E smoke (E1,E2,E3,E5,E8) → coverage upload
nightly: + full E2E matrix + performance harness
release: + signed build pipeline (web-ext sign) + manual OS smoke
```

## 9. Test Data Policy

Fixtures and baselines are synthetic or public pages; **no user data in the repo**.
E2E artifacts (screenshots/videos of failures) stay in CI storage, auto-expire.
