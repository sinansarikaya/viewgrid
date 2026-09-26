import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { siteConfig } from '../data/site.config';

export function Docs() {
  const { product, storeLinks } = siteConfig;

  return (
    <div className="site-root">
      <Header currentPath="/docs/" />
      <main className="docs-main">
        <div className="container docs-container">
          {/* Docs Sidebar */}
          <aside className="docs-sidebar" aria-label="Documentation Sidebar">
            <div className="sidebar-group">
              <span className="sidebar-title">Getting Started</span>
              <ul className="sidebar-links">
                <li><a href="#overview">Overview</a></li>
                <li><a href="#install">Installation Guide</a></li>
                <li><a href="#quickstart">Quickstart (10s)</a></li>
              </ul>
            </div>

            <div className="sidebar-group">
              <span className="sidebar-title">Core Concepts</span>
              <ul className="sidebar-links">
                <li><a href="#viewports">Viewports & Devices</a></li>
                <li><a href="#sync">Interaction Synchronization</a></li>
                <li><a href="#compare">Visual Diff & Compare</a></li>
                <li><a href="#headers">XFO / CSP Header Relaxer</a></li>
                <li><a href="#ua">User-Agent Spoofing</a></li>
              </ul>
            </div>

            <div className="sidebar-group">
              <span className="sidebar-title">Reference</span>
              <ul className="sidebar-links">
                <li><a href="#shortcuts">Keyboard Shortcuts</a></li>
                <li><a href="#presets">Built-In Presets</a></li>
                <li><a href="#faq-link">FAQ & Security</a></li>
              </ul>
            </div>
          </aside>

          {/* Docs Body Content */}
          <article className="docs-article">
            {/* 1. Overview */}
            <section id="overview" className="docs-section">
              <span className="badge badge-cyan">DOCUMENTATION</span>
              <h1>ViewGrid Documentation</h1>
              <p className="lead-text">
                ViewGrid is an open-source browser developer extension providing a multi-viewport workspace for responsive web design and testing.
              </p>
              <p>
                Unlike single-viewport DevTools or cloud-proxy emulators, ViewGrid renders real, live browser frames simultaneously in your browser with synchronized scrolling, clicks, and drag comparison.
              </p>
            </section>

            {/* 2. Installation */}
            <section id="install" className="docs-section">
              <h2>Installation Guide</h2>
              <p>
                ViewGrid is officially available on both the Chrome Web Store and Firefox Add-ons (AMO). You can install with one click directly from the stores or load verified release packages manually:
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '16px 0 24px' }}>
                <a
                  href={storeLinks.chrome}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  Add to Chrome (Store)
                </a>
                <a
                  href={storeLinks.firefox}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  Add to Firefox (AMO)
                </a>
                <a
                  href={product.releasesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ textDecoration: 'none' }}
                >
                  GitHub Releases (v{product.version})
                </a>
              </div>

              <div className="install-tabs-box">
                <div className="install-block">
                  <h3>Google Chrome / Brave / Edge / Arc (Manual Sideload)</h3>
                  <ol>
                    <li>Download <code>viewgrid-{product.version}-chromium.zip</code> from <a href={product.releasesUrl} target="_blank" rel="noopener noreferrer">GitHub Releases</a>.</li>
                    <li>Unzip the archive to a local folder on your computer.</li>
                    <li>Navigate to <code>chrome://extensions</code> in your address bar.</li>
                    <li>Enable <strong>Developer mode</strong> in the top-right corner.</li>
                    <li>Click <strong>Load unpacked</strong> and select the unzipped directory.</li>
                  </ol>
                </div>

                <div className="install-block">
                  <h3>Mozilla Firefox / Zen Browser (Manual Sideload)</h3>
                  <ol>
                    <li>Download <code>viewgrid-{product.version}-firefox.zip</code> from <a href={product.releasesUrl} target="_blank" rel="noopener noreferrer">GitHub Releases</a>.</li>
                    <li>Navigate to <code>about:debugging#/runtime/this-firefox</code> in Firefox.</li>
                    <li>Click <strong>Load Temporary Add-on...</strong></li>
                    <li>Select the downloaded zip file (or manifest.json inside).</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* 3. Quickstart */}
            <section id="quickstart" className="docs-section">
              <h2>Quickstart</h2>
              <ol className="step-list">
                <li>
                  <strong>Open the workspace:</strong> Click the ViewGrid extension icon in your browser toolbar, or press <kbd>Alt+Shift+V</kbd> (<kbd>Cmd+Shift+V</kbd> on macOS).
                </li>
                <li>
                  <strong>Enter your target URL:</strong> Type any local URL (e.g. <code>http://localhost:5173</code>) or live web address in the top input box and press <kbd>Enter</kbd>.
                </li>
                <li>
                  <strong>Pick devices or presets:</strong> Choose from presets like <em>Standard Responsive</em> or click <em>＋ Add Device</em> to select individual devices.
                </li>
                <li>
                  <strong>Interact & Sync:</strong> Scroll, click buttons, or test forms in any viewport. All active viewports mirror your actions seamlessly.
                </li>
              </ol>
            </section>

            {/* 4. Viewports */}
            <section id="viewports" className="docs-section">
              <h2>Viewports & Device Profiles</h2>
              <p>
                Each viewport in ViewGrid represents an independent responsive canvas configured with:
              </p>
              <ul>
                <li><strong>Resolution:</strong> Physical pixel width and height.</li>
                <li><strong>Device Pixel Ratio (DPR):</strong> High-DPI screen emulation (e.g. 2x, 3x retina scaling).</li>
                <li><strong>Orientation:</strong> Instant toggle between portrait and landscape mode.</li>
                <li><strong>Hardware Bezels:</strong> Realistic phone and tablet shells (toggleable with <kbd>F</kbd>).</li>
                <li><strong>Scale Slider:</strong> Zoom in/out without distorting CSS media query breakpoints.</li>
              </ul>
            </section>

            {/* 5. Compare Engine */}
            <section id="compare" className="docs-section">
              <h2>Visual Diff & Compare Modes</h2>
              <p>
                Click <strong>⚖ Compare</strong> in the workspace toolbar to inspect two viewports simultaneously:
              </p>
              <div className="compare-mode-cards">
                <div className="mode-card">
                  <h4>⫴ Dual-Split Slider</h4>
                  <p>Displays both devices side-by-side with an interactive draggable divider handle. Easily test how flexible containers behave.</p>
                </div>
                <div className="mode-card">
                  <h4>▥ Overlay Curtain Diff</h4>
                  <p>Overlays Device B directly on top of Device A with a vertical reveal curtain. Spot subtle padding shifts and font size discrepancies immediately.</p>
                </div>
                <div className="mode-card">
                  <h4>⫿ Side-by-Side Dual View</h4>
                  <p>Comfortable dual view designed for deep comparative inspection across wide desktop monitors.</p>
                </div>
              </div>
            </section>

            {/* 6. Keyboard Shortcuts */}
            <section id="shortcuts" className="docs-section">
              <h2>Keyboard Shortcuts</h2>
              <div className="shortcuts-table">
                <div className="s-row s-head">
                  <span>Shortcut</span>
                  <span>Action</span>
                </div>
                <div className="s-row">
                  <code>Alt + Shift + V</code>
                  <span>Open ViewGrid workspace from any tab (<kbd>Cmd+Shift+V</kbd> on macOS)</span>
                </div>
                <div className="s-row">
                  <code>A</code>
                  <span>Open Add Device / Preset Picker dialog</span>
                </div>
                <div className="s-row">
                  <code>F</code>
                  <span>Toggle device hardware frames (borderless vs bezel mode)</span>
                </div>
                <div className="s-row">
                  <code>Shift + R</code>
                  <span>Reload all viewports simultaneously</span>
                </div>
                <div className="s-row">
                  <code>Esc</code>
                  <span>Close open modals (Compare, Device Picker, Issues Drawer)</span>
                </div>
              </div>
            </section>

            {/* 7. XFO & CSP Header Relaxer */}
            <section id="headers" className="docs-section">
              <h2>X-Frame-Options & CSP Handling</h2>
              <p>
                Many websites specify security response headers to prevent clickjacking:
              </p>
              <pre className="code-block">
<code>X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'</code>
              </pre>
              <p>
                When you navigate inside a ViewGrid workspace tab, the extension registers a temporary session rule via DeclarativeNetRequest (Chromium) or webRequest (Firefox) to strip these headers strictly for sub_frame requests originating inside your workspace tab.
              </p>
              <p>
                <strong>Security guarantee:</strong> Normal browser tabs in other windows are never affected. Once you close the workspace tab, the temporary rule is automatically removed.
              </p>
            </section>
          </article>
        </div>
      </main>
      <Footer />

      <style>{`
        .docs-main {
          padding: 64px 0 96px;
        }
        .docs-container {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 48px;
          align-items: start;
        }
        .docs-sidebar {
          position: sticky;
          top: 96px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sidebar-title {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 8px;
        }
        .sidebar-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sidebar-links a {
          font-size: 13.5px;
          color: var(--text-secondary);
          transition: color 0.15s;
        }
        .sidebar-links a:hover {
          color: var(--accent-cyan);
        }

        .docs-article {
          display: flex;
          flex-direction: column;
          gap: 56px;
          max-width: 820px;
        }
        .docs-section h1 {
          font-size: clamp(32px, 4vw, 44px);
          font-weight: 800;
          color: #ffffff;
          margin: 12px 0 16px;
          letter-spacing: -0.02em;
        }
        .lead-text {
          font-size: 18px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .docs-section h2 {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-dim);
          letter-spacing: -0.01em;
        }
        .docs-section p {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.65;
          margin-bottom: 16px;
        }
        .docs-section ul, .docs-section ol {
          padding-left: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: var(--text-secondary);
          font-size: 14.5px;
          margin-bottom: 16px;
        }
        .docs-section a {
          color: var(--accent-cyan);
          text-decoration: underline;
        }
        .step-list {
          gap: 16px;
        }
        .step-list li {
          line-height: 1.6;
        }
        kbd {
          font-family: var(--font-mono);
          font-size: 12px;
          background: #1e293b;
          border: 1px solid var(--border-bright);
          border-radius: 4px;
          padding: 2px 6px;
          color: var(--text-primary);
        }
        .code-block {
          background: #030712;
          border: 1px solid var(--border-dim);
          border-radius: var(--radius-sm);
          padding: 14px 18px;
          font-family: var(--font-mono);
          font-size: 13px;
          color: #38bdf8;
          margin-bottom: 16px;
          overflow-x: auto;
        }

        .install-tabs-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 16px;
        }
        .install-block {
          background: #090e1a;
          border: 1px solid var(--border-dim);
          border-radius: var(--radius-sm);
          padding: 20px;
        }
        .install-block h3 {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
        }
        .install-block ol {
          padding-left: 20px;
          font-size: 13.5px;
          gap: 8px;
        }

        .compare-mode-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 16px;
        }
        .mode-card {
          background: #090e1a;
          border: 1px solid var(--border-dim);
          border-radius: var(--radius-sm);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mode-card h4 {
          font-size: 14px;
          font-weight: 700;
          color: var(--accent-cyan);
        }
        .mode-card p {
          font-size: 12.5px;
          margin-bottom: 0;
        }

        .shortcuts-table {
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border-dim);
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: #090e1a;
        }
        .s-row {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 16px;
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-dim);
          font-size: 13.5px;
          align-items: center;
        }
        .s-row:last-child { border-bottom: none; }
        .s-head {
          background: #0f172a;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        @media (max-width: 900px) {
          .docs-container { grid-template-columns: 1fr; }
          .docs-sidebar { display: none; }
          .install-tabs-box { grid-template-columns: 1fr; }
          .compare-mode-cards { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
