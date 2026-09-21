import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function Privacy() {
  return (
    <div className="site-root">
      <Header currentPath="/privacy/" />
      <main className="legal-main">
        <div className="container legal-container">
          <div className="legal-header">
            <span className="badge badge-emerald">100% LOCAL EXECUTION · ZERO TELEMETRY</span>
            <h1 className="legal-title">Privacy Policy for ViewGrid</h1>
            <p className="legal-date">Effective Date: September 21, 2026 · Version 1.0</p>
          </div>

          <div className="legal-content">
            <section className="legal-section">
              <h2>1. Summary & Core Principle</h2>
              <p>
                <strong>ViewGrid does not collect, store, transmit, or monetize any personal data, browsing history, or user telemetry.</strong>
              </p>
              <p>
                ViewGrid is an open-source browser developer extension designed for responsive web design testing. All execution occurs strictly inside your local browser instance. No external API endpoints, cloud databases, analytics beacons, or remote telemetry servers exist in ViewGrid's architecture.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Technical Manifest Permissions & Why They Are Used</h2>
              <p>
                ViewGrid requests only the browser extension permissions strictly required to perform responsive viewport testing. Each permission is audited and justified below:
              </p>

              <div className="perm-table">
                <div className="perm-row perm-head">
                  <span>Permission</span>
                  <span>Browser</span>
                  <span>Exact Purpose in ViewGrid</span>
                </div>
                <div className="perm-row">
                  <code>storage</code>
                  <span>Chrome & Firefox</span>
                  <span>Stores your custom viewport dimensions, user-created device profiles, and workspace settings locally on your machine via <code>chrome.storage.local</code> and <code>chrome.storage.session</code>. No data ever leaves your device.</span>
                </div>
                <div className="perm-row">
                  <code>tabs</code>
                  <span>Chrome & Firefox</span>
                  <span>Used to create the ViewGrid workspace tab, detect when a workspace tab is closed to automatically clean up header rules, and navigate workspace frames.</span>
                </div>
                <div className="perm-row">
                  <code>activeTab</code>
                  <span>Chrome & Firefox</span>
                  <span>Enables the "Open page in ViewGrid" context menu option and allows capturing screenshots of active viewports via <code>tabs.captureVisibleTab</code>.</span>
                </div>
                <div className="perm-row">
                  <code>contextMenus / menus</code>
                  <span>Chrome & Firefox</span>
                  <span>Adds right-click options ("Open link in ViewGrid") to open any URL in a responsive workspace.</span>
                </div>
                <div className="perm-row">
                  <code>declarativeNetRequestWithHostAccess</code>
                  <span>Chromium</span>
                  <span>Relaxes <code>X-Frame-Options</code> and <code>Content-Security-Policy: frame-ancestors</code> response headers solely for <code>sub_frame</code> requests inside active ViewGrid workspace tabs so you can test your sites. Normal browser tabs remain unaffected.</span>
                </div>
                <div className="perm-row">
                  <code>webRequest & webRequestBlocking</code>
                  <span>Firefox</span>
                  <span>The Firefox WebExtension equivalent for header relaxation, scoped strictly to workspace sub_frames.</span>
                </div>
                <div className="perm-row">
                  <code>&lt;all_urls&gt;</code> (host_permissions)
                  <span>Chrome & Firefox</span>
                  <span>Required because ViewGrid is a development tool that allows developers to test arbitrary URLs (e.g. <code>http://localhost:3000</code>, internal staging servers, or any production site). Without this permission, the extension cannot inspect or strip framing restriction headers on the websites you choose to test.</span>
                </div>
              </div>
            </section>

            <section className="legal-section">
              <h2>3. Data Collection, Analytics & Telemetry</h2>
              <ul>
                <li><strong>No User Data Collection:</strong> We do not collect names, email addresses, IP addresses, browsing histories, or usage analytics.</li>
                <li><strong>No Telemetry Beacons:</strong> ViewGrid does not integrate Google Analytics, Mixpanel, Sentry, PostHog, or any tracking SDKs.</li>
                <li><strong>No Remote Code or CDNs:</strong> In strict compliance with Chrome Web Store and Firefox Add-ons policies, ViewGrid loads zero remote JavaScript, CDN scripts, or external modules. All code is bundled inside the verified extension package.</li>
                <li><strong>No Third-Party Cookies:</strong> ViewGrid does not set tracking cookies or inject tracking beacons.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Interaction Synchronization & Frame Isolation</h2>
              <p>
                When you interact with a viewport (scrolling, clicking, typing), ViewGrid uses internal extension messaging (<code>runtime.sendMessage</code>) to synchronize interactions across viewports on your workspace canvas.
              </p>
              <p>
                Untrusted web pages loaded inside iframes cannot execute privileged extension commands (such as arbitrary navigation or reloading) via window <code>postMessage</code>. Privileged controls are restricted exclusively to the internal extension background hub.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Open Source Transparency & Source Code Verification</h2>
              <p>
                ViewGrid is completely open source under the MIT License. Anyone can inspect, verify, and compile the source code directly from our public GitHub repository at:{' '}
                <a href="https://github.com/sinansarikaya/viewgrid" target="_blank" rel="noopener noreferrer">
                  https://github.com/sinansarikaya/viewgrid
                </a>.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Contact Information</h2>
              <p>
                If you have any questions or security inquiries regarding ViewGrid's privacy practices, please open an issue on our GitHub repository or contact the maintainer directly:
              </p>
              <p>
                <strong>Maintainer:</strong> Sinan Sarıkaya<br />
                <strong>Website:</strong> <a href="https://sinansarikaya.dev" target="_blank" rel="noopener noreferrer">https://sinansarikaya.dev</a><br />
                <strong>GitHub Issues:</strong> <a href="https://github.com/sinansarikaya/viewgrid/issues" target="_blank" rel="noopener noreferrer">https://github.com/sinansarikaya/viewgrid/issues</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        .legal-main {
          padding: 64px 0 96px;
        }
        .legal-container {
          max-width: 860px;
        }
        .legal-header {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 40px;
          border-bottom: 1px solid var(--border-dim);
          padding-bottom: 28px;
        }
        .legal-title {
          font-size: clamp(30px, 4vw, 42px);
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .legal-date {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--text-dim);
        }
        .legal-content {
          display: flex;
          flex-direction: column;
          gap: 40px;
          color: var(--text-secondary);
          line-height: 1.7;
          font-size: 15px;
        }
        .legal-section h2 {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 14px;
          letter-spacing: -0.01em;
        }
        .legal-section p {
          margin-bottom: 14px;
        }
        .legal-section ul {
          padding-left: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 14px;
        }
        .legal-section a {
          color: var(--accent-cyan);
          text-decoration: underline;
        }
        .perm-table {
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border-dim);
          border-radius: var(--radius-sm);
          overflow: hidden;
          margin-top: 16px;
          background: #090e1a;
        }
        .perm-row {
          display: grid;
          grid-template-columns: 180px 140px 1fr;
          gap: 16px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-dim);
          font-size: 13px;
          align-items: start;
        }
        .perm-row:last-child {
          border-bottom: none;
        }
        .perm-head {
          background: #0f172a;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: var(--text-primary);
          text-transform: uppercase;
        }
        .perm-row code {
          font-family: var(--font-mono);
          color: var(--accent-cyan);
          background: rgba(56, 189, 248, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
          word-break: break-all;
        }

        @media (max-width: 768px) {
          .perm-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }
          .perm-head { display: none; }
        }
      `}</style>
    </div>
  );
}
