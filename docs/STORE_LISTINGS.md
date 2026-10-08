# Store submission copy — 1.0.3

These are prepared descriptions; updating this file does not submit a store release.

## Short description

Test responsive layouts side by side with synchronized interactions, design overlays, screenshots and reviewable issue reports.

## Full description

ViewGrid brings multiple CSS viewport sizes into one local browser workspace. Choose from 21 device profiles and 5 preset sets, add custom dimensions, rotate, zoom and arrange up to 16 previews.

Synchronize scrolling, clicks, navigation and optional input/form/key events. Compare two layouts side by side or overlay an exported PNG/SVG design. Export complete viewport PNGs at logical dimensions and the host browser capture scale; large viewports are tiled.

The responsive scanner flags potential overflow, text clipping, offscreen controls and small touch targets. Findings are grouped across devices and include selectors, measurements, filters, element highlighting, copy and JSON export. They are suggestions for human review, not a WCAG compliance verdict.

No extension telemetry or cloud proxy. Your preview sites make their normal network requests. Workspace settings stay in browser storage; screenshots and reports leave only when you export/share them.

Framing exceptions are limited to verified workspace tabs. Firefox handles direct previews and retains CSP directives other than frame-ancestors. Chromium handles workspace subframes (including nested frames and page-initiated navigation/reload) and removes CSP response headers because DNR cannot rewrite individual directives or select a parent frame ID. Normal tabs retain their protections. Both browser builds defer worker registration until the preview agent verifies its workspace tab, then disables registration and unregisters workers visible in that preview storage partition. Existing controlled previews reload once after unregistering. Normal tabs are untouched; cookies, localStorage, sessionStorage and CacheStorage are retained.

Device profiles simulate viewport sizes, not mobile hardware or browser engines. Third-party cookie, login, sandbox and service-worker restrictions can prevent some sites from working in an iframe. Memory and speed vary by page and device; no fixed RAM/FPS guarantee is made.

## Türkçe kısa açıklama

Duyarlı tasarımları yan yana test edin: senkron etkileşim, tasarım katmanı, ekran görüntüsü ve incelenebilir bulgu raporları.

## Submission checklist

- Upload the matching browser artifact and, for AMO review, the source ZIP.
- Confirm version 1.0.3 and compare SHA256SUMS.
- Link the updated privacy policy; retain a record of manual Firefox/ESR and OS smoke checks.
- Store publication/review is separate from the GitHub release.
