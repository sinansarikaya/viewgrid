Latest scan/report improvements (same 1.0.3 version):
- Correct overly broad overflow exclusions and detect vertical text clipping.
- Display DOM scan coverage. Export printable HTML reports and zero-finding JSON reports, with incomplete-scan and filter information.
- Update website version, add /changelog/ and English/Turkish promo videos. Norwegian uses English.

The extension version remains **1.0.3**. Use the build-ID ZIP links below for these corrections. The original tag and original ZIP assets are retained unchanged.

- Fix CastPost on first open with an existing site service worker, not only after a manual hard refresh. Preview loading now waits for scoped rules and selected-site worker cleanup before making the iframe request.
- The selected site's worker registrations can also be removed from normal-tab use. Cookies and login storage are not requested for removal; other sites' workers and the browser-wide cache are not cleared.
- Show version and source build ID inside ViewGrid, making the installed package identifiable.
- Reduce scroll relay delay by sending directly through the workspace and overriding smooth-scroll animation on receiving previews. Exact simultaneous painting across browser processes cannot be guaranteed.

Validation uses the real castpost.app site with its real /sw.js, then closes/reopens ViewGrid in the same profile and restarts Chromium. It checks normal-tab framing protections, preserved site data and scroll relay timing.

Extract the Chromium ZIP and load its manifest folder at chrome://extensions. Extract the Firefox ZIP and select manifest.json at about:debugging. Firefox 128+; temporary installs disappear after browser restart. Open a new workspace after reloading the updated extension.
