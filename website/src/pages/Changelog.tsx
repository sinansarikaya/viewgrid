import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { siteConfig } from '../data/site.config';
export function Changelog() {
  return <div className="site-root"><Header currentPath="/changelog/" /><main className="container" style={{ maxWidth: 900, padding: '72px 20px', lineHeight: 1.8 }}>
    <h1>Changelog</h1><p>Current extension version: <strong>{siteConfig.product.version}</strong>. Corrections below keep the same version; the build ID inside the workspace identifies each package.</p>
    <article><h2>1.0.3 — Scan and reporting improvements</h2><time dateTime="2026-10-08">8 October 2026</time><ul>
      <li>Controls in overflow containers remain eligible for small touch-target checks. Deliberately scrollable containers are handled separately from accidentally clipped text.</li>
      <li>Detect vertically clipped text in fixed-height containers, while excluding explicit ellipsis and line clamping.</li>
      <li>Show DOM scan coverage and distinguish failed or limited scans from a completed scan with no findings.</li>
      <li>Download a standalone HTML report, printable to PDF. JSON and report copying also work for zero-finding scans.</li>
      <li>Website version updated to 1.0.3. Added this changelog and English/Turkish walkthrough videos; Norwegian selection uses the English video.</li>
    </ul></article>
    <article><h2>1.0.3 — CastPost and scroll corrections</h2><time dateTime="2026-10-08">8 October 2026</time><ul>
      <li>Prepare preview rules and remove the selected site's existing service worker registration before loading previews. This can affect that site's normal tabs; cookies and login storage are retained.</li>
      <li>Verified CastPost in worker-warmed Chromium and Firefox profiles, including reopening the workspace and restarting Chromium.</li>
      <li>Direct scroll relay reduces delay; receiving previews override CSS smooth scrolling. Exact simultaneous painting is not guaranteed.</li>
      <li>Display extension version and source build ID in the workspace.</li>
    </ul></article>
    <article><h2>1.0.3 — Browser compatibility</h2><p>Firefox background compatibility and preview worker registration protection.</p></article>
    <article><h2>1.0.2 — Maintenance</h2><p>Preview isolation, reload synchronization, screenshot completeness and grouped findings with measurements, filters and copy/export tools.</p></article>
    <article><h2>1.0.1 — Initial published version</h2><p>Multi-viewport workspace, device presets, synchronized interactions, comparison tools and local responsive checks.</p></article>
    <p><a href={`${siteConfig.product.releasesUrl}/tag/v1.0.3`}>Download current tested build packages on GitHub ↗</a></p><p><a href={`${siteConfig.product.repositoryUrl}/blob/main/CHANGELOG.md`}>Full repository changelog ↗</a></p>
  </main><Footer /></div>;
}
