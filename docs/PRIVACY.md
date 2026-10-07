# ViewGrid privacy — version 1.0.2

ViewGrid does not send analytics, crash reports, screenshots, issue results or workspace settings to a ViewGrid server. There is no cloud proxy, account service or AI provider integration in this release.

## Data on your device

- `storage.local`: workspace URLs, saved workspaces, custom devices, language, theme and shortcut preferences.
- `storage.session`: active frame routing needed when the extension background restarts.
- Workspace memory: scan results, element text snippets/selectors, page URLs and measured dimensions. Results are cleared when viewport configuration changes.
- Downloads/clipboard: screenshots and issue reports only when you request export/copy. A report can contain page URLs, visible text and selectors; review it before sharing.

Previews load your selected websites directly. Those sites make ordinary browsing requests and apply their own privacy policies. Zero extension telemetry does not mean the websites themselves make no network requests.

## Permissions and isolation

Host access allows the content agent to synchronize and inspect preview frames. Storage saves preferences; tabs identifies workspaces; downloads exports files; context menus opens a selected page/link. Framing permissions are used for direct previews in verified workspace tabs.

Firefox removes XFO and CSP frame-ancestors while retaining other response policy directives. Chromium cannot edit an individual CSP directive using DNR, so CSP response headers are removed only on direct preview documents. Normal tabs and nested third-party frames are outside the exception.

Cookies, localStorage, sessionStorage, service workers and CacheStorage belonging to tested sites are not automatically deleted or rewritten. Browser third-party cookie and authentication policies still apply.

Delete saved workspaces through the workspace menu; uninstalling the extension clears its browser-managed extension storage. Exported downloads and clipboard contents are under your control and are not removed by uninstalling.

Questions: [GitHub issues](https://github.com/sinansarikaya/viewgrid/issues).
