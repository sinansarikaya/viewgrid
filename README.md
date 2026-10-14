# ViewGrid · 1.0.4

[English](README.md) · [Türkçe](README.tr.md) · [Norsk bokmål](README.no.md)

[Website](https://viewgrid.sinansarikaya.dev/) · [Chrome Web Store](https://chromewebstore.google.com/detail/viewgrid-%E2%80%94-responsive-vie/hmlhooeamfmhdeichnghcklahfgimgef) · [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/viewgrid-responsive-viewer/) · [Releases](https://github.com/sinansarikaya/viewgrid/releases)

![ViewGrid workspace — CastPost](website/public/screenshots/workspace.png)

**Local analysis**

![ViewGrid local analysis — CastPost](website/public/screenshots/local-analysis.png)

**Compare layouts**

![ViewGrid comparison — CastPost](website/public/screenshots/compare.png)

**Test phone, tablet and desktop layouts side by side in one tab.** ViewGrid is a free, open-source extension for Chromium and Firefox. The interface and reports support Turkish, English and Norwegian Bokmål.

- 21 device profiles, 5 preset sets, custom dimensions and up to 16 viewports; grid, row, column and free layouts, ordering, alignment, focus, rotation and centered zoom.
- Independently switchable scroll, click, navigation, reload, input/form and key synchronization; locally saved workspaces and preferences.
- Split, curtain and side-by-side comparison with exported PNG/SVG design overlays. No Figma API integration or automatic pixel-diff score.
- PNGs for one or all expanded viewports, tiled large captures, a 32-megapixel limit and Escape cancellation. Workspace capture covers its visible area, not a full page document.
- Grouped responsive findings with device/measurement/selector evidence, filters and element highlighting; Markdown copy, JSON and printable HTML reports. Unique findings and device occurrences are separate; optional ergonomic advice stays separate.
- **Bundled local analysis:** mobile, desktop or both by default; loading observations, DOM-based SEO, axe accessibility checks and experimental GEO signals. Each section offers scoped Markdown copy/download. Session results persist and become stale when the target changes; coverage and failed checks remain visible.
- Soft panel/menu transitions, reduced-motion support and menus that close on outside click or Escape.

**Install:** Download current browser ZIPs and `SHA256SUMS` from Releases. Chromium: unzip, open `chrome://extensions`, enable Developer mode and choose Load unpacked. Firefox: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → `manifest.json`; it disappears after restart. Use signed AMO packages for permanent Firefox installation. Source packages use `dist/chromium` or `dist/firefox`. GitHub packages and store reviews are separate; stores may retain the current 1.0.3 until 1.0.4 review/publication is complete.

**Limits and security:** Analysis needs no external API, Google/CrUX request, account or additional engine installation. Local observations are not Lighthouse scores or real-user Core Web Vitals data; there is no whole-site crawl, DAST or compliance certification. GEO signals do not guarantee ranking or AI visibility. Zero findings do not establish compliance; scan limits, shadow DOM and nested cross-origin frames can limit coverage.

Input/form/key synchronization is restricted to the same origin. Capture and replay are blocked for password, one-time-code and payment fields recognized by type, autocomplete and name/ID guards. Preview binding checks the actual parent workspace, direct iframe identity and verified frame/document registration; page-created messages are not accepted as binding evidence.

There is no extension telemetry or cloud proxy; selected sites make their usual network requests. Framing exceptions require verified workspace tabs: Firefox removes XFO and CSP `frame-ancestors` on direct previews; Chromium removes XFO and all CSP response headers on workspace subframes, including nested frames. Normal tabs retain their framing protections. Before loading previews, selected-site service-worker registrations are removed by origin (Chromium) or hostname (Firefox), which may also affect workers used by normal tabs of that site. Removal of cookies, localStorage, sessionStorage, IndexedDB and CacheStorage is not requested. Permissions, login, third-party cookies and sandbox policies can block previews. Profiles set CSS viewport dimensions, without real mobile hardware, DPR or browser-engine emulation. No fixed RAM/FPS/latency guarantee is made.

## Development

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run typecheck
pnpm run typecheck:website
pnpm test
pnpm run build:all
pnpm run lint:web-ext
pnpm exec playwright install --with-deps chromium
pnpm run test:e2e
pnpm run build:website
pnpm run package:release
```

[Release notes](docs/RELEASE_NOTES_1.0.4.md) · [Changelog](CHANGELOG.md) · [Privacy](docs/PRIVACY.md) · [Security](SECURITY.md) · [Testing](docs/TESTING.md) · [MIT License](LICENSE)

[Sinan Sarıkaya](https://github.com/sinansarikaya) · [Sponsor](https://github.com/sponsors/sinansarikaya)

[contact@sinansarikaya.dev](mailto:contact@sinansarikaya.dev) · [security@sinansarikaya.dev](mailto:security@sinansarikaya.dev)
