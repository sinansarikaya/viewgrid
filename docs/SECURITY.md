# Security Policy & Design — ViewGrid

Companion to `docs/PRIVACY.md` (data handling) and `docs/ARCHITECTURE.md` (mechanisms).
Written to double as the answer sheet for **AMO review** questions about permissions and
header manipulation.

---

## 1. Threat Model (summary)

| Asset | Threat | Control |
| --- | --- | --- |
| User browsing data | Leak to third parties | No remote endpoints by default; local-only storage |
| Tested websites’ integrity | Extension mutating page content maliciously or accidentally | Content scripts limited to measurement/sync/scan; no eval; no remote code; documented injection surface |
| Framing security (XFO/CSP) | Weakening a site’s clickjacking defenses globally | Strictly scoped, consent-based, `sub_frame`-only, initiator-scoped header edits (§4) |
| API keys (AI) | Theft/leak | `storage.local` only, masked UI, excluded from export, per-request consent |
| Extension messages | Spoofed/rogue messages | Message schema validation + sender checks (§6) |
| User files (screenshots) | Exfiltration | Never uploaded anywhere; export is explicit user action |

Out of scope: malicious user self-attack (users can already inspect their own browser),
supply-chain of npm deps (handled by lockfile + minimal dependency policy + audit in CI).

## 2. Permissions Model

### 2.1 Required (install time — kept minimal)

| Permission | Justification |
| --- | --- |
| `storage` | Settings, workspaces, custom devices |
| `unlimitedStorage` | Screenshot/baseline/video artifacts (quota + eviction exemption) |
| `activeTab` | Capture/context actions on the active tab without broad grants |
| `scripting` | Content agent injection into user-tested pages (feature-gated) |
| `tabs` | Workspace tab lifecycle + capture targets |
| `menus` (CH: `contextMenus`) | Context menu entries |
| `commands` | Global “Open workspace” shortcut |
| `webRequest` + `webRequestBlocking` (Firefox only) | Managed framing — scoped header rewrite (§4) |

> Implementation note: screenshot/reports are saved via anchor downloads from the
> workspace page — the `downloads` permission is intentionally **not** requested.

### 2.2 Optional (runtime `permissions.request` — feature-gated)

| Permission | Granted when | Enables |
| --- | --- | --- |
| Host access to tested origins (`http(s)://*/*` or per-origin) | User enables managed framing / sync / measurement / issue scan on that site | Content agents, header rewrite, full feature set |
| `webRequest` + `webRequestBlocking` (Firefox) | Managed framing enabled | Scoped header rewrite |
| `declarativeNetRequest` (Chromium) | Managed framing enabled | Scoped header rewrite / offline guard |
| `microphone` (via getUserMedia prompt, not manifest) | User starts recording with audio | Video narration |
| `sidebar_action` / `sidePanel` | n/a (manifest surface) | Secondary UI |

Note (researched): Firefox MV3 treats host permissions as **optional** by default; the
onboarding flow requests them explicitly at the moment of need (never at install).

## 3. Data Minimization

- No cookies / history / webRequest logging beyond what framing rules need in-memory.
- No remote hosts in CSP of extension pages; all assets bundled.
- No analytics, crash reporters, update pings beyond the store mechanism.

## 4. Framing Security Policy (the sensitive part)

Embedding third-party sites requires relaxing their `X-Frame-Options` / CSP
`frame-ancestors` protections. This is a **supported WebExtension pattern**
(`webRequest` blocking on Firefox, `declarativeNetRequest` on Chromium) used by tools in
this category — but it must be done with care (see w3c/webextensions #483 for the
platform discussion). Our rules:

1. **Consent:** header edits apply only while the user has granted host access
   (optional host permissions) **and** only for `sub_frame` requests belonging to a
   registered **workspace tab**. No blanket `<all_urls>` stripping — a random tab
   browsing the same sites is never affected.
2. **Scope:** resource type `sub_frame` **only**, and only when the initiator is our
   extension. `main_frame` and subresource traffic are never modified.
3. **Minimal edit:** rewrite CSP `frame-ancestors` to *include* our origin (preserving
   all other directives). Remove `X-Frame-Options` only when no rewrite path exists.
   Never delete a whole CSP header on real traffic.
4. **No clickjacking bait:** the embedded frame is the *user’s own test target* inside a
   developer tool; we never overlay invisible UI on it for phishing-style interactions
   (workspace chrome is outside the iframe box).
5. **Service-worker-served responses** are not interceptable (platform limitation). We
   detect the blocked state and explain it. We do **not** wipe site service workers via
   `browsingData` (destructive; a toggle-able “last resort” is discussed for V3 only
   with explicit warnings).
6. **JS framebusting** is respected as a site’s deliberate behavior: detected and
   reported (“this site refuses to be framed”), no counter-measures.
7. **Header rules are disabled the moment the user revokes the site grant** or the
   workspace closes.

## 5. Code & Content Security

- Extension pages CSP: `default-src 'self'`; no inline scripts (build injects hashes if
  needed); no `eval` / `new Function` (lint-enforced); no remote script loading ever
  (AMO hard rule).
- Content agents run in the isolated world; MAIN-world injectees are small, reviewed,
  dependency-free scripts (UA/navigator overrides only).
- No `chrome.debugger` usage (Chromium-only and overly powerful) — parity + least privilege.
- Release builds are reproducible from the tagged commit (AMO source submission = this repo).
- Known lint note: `web-ext lint` reports 2× `UNSAFE_VAR_ASSIGNMENT` warnings inside the
  minified React DOM bundle (its internal `setInnerHTML` helper). ViewGrid never uses
  `dangerouslySetInnerHTML` or dynamic HTML sinks; the pattern is React-internal and is
  explained to AMO reviewers verbatim if asked.

## 6. Messaging Hardening

- Every message validated against a schema (channel, payload shape) before handling.
- `sender.id` / port origin checks; content agents ignore non-extension senders.
- Sync payloads contain **no secrets**; `password` inputs and `autocomplete=cc-*` fields
  are hard-excluded from input/form sync (F-033/34).

## 7. Secrets & Export Sanitizer

- AI API keys: `storage.local` only (never `storage.sync`), masked in UI, excluded from
  every export format (workspace JSON, reports) by the export sanitizer (TASK §3/§28).
- “Clear all local data” wipes `storage.local` + IndexedDB (F-154).

## 8. Pre-Release Security Checklist (DoD input)

- [ ] `web-ext lint` clean
- [ ] Permissions diff vs §2 reviewed (nothing new without doc update)
- [ ] CSP of all extension pages verified (`self` only)
- [ ] grep-audit: no `eval`, `new Function`, remote `http(s)` asset URLs in bundle
- [ ] Framing rules verified scoped (unit tests on rule builder)
- [ ] Export sanitizer tests green (keys never exported)
- [ ] Sync password/CC exclusion tests green
- [ ] SECURITY.md / PRIVACY.md match shipped behavior

## 9. Vulnerability Reporting

Report security issues privately to the maintainers (contact channel set at first
release). We will acknowledge within 7 days. Do not file public AMO reviews for
security bugs.

## 10. AI Feature Security (V3 — F-128…F-134)

- Requests go **directly from the user’s machine to the provider they configure** — no
  proxy through any first-party server (we don’t operate one).
- Per-request consent dialog shows the **exact payload** (URL, issue JSON, optional
  screenshot thumbnails the user can deselect).
- Keys never leave storage except in the `Authorization` header to the configured provider.
- HTTPS endpoints only; custom endpoints require explicit confirmation (enterprise/local
  models like Ollama may be `http://localhost` with a warning).
