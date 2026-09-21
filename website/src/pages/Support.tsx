import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { siteConfig } from '../data/site.config';

export function Support() {
  const { product } = siteConfig;

  return (
    <div className="site-root">
      <Header currentPath="/support/" />
      <main className="support-main">
        <div className="container support-container">
          <div className="section-header">
            <span className="section-tag">COMMUNITY & ASSISTANCE</span>
            <h1 className="section-title">Support & Troubleshooting</h1>
            <p className="section-desc">
              Have an issue, bug report, or feature request? We're here to help make responsive testing seamless.
            </p>
          </div>

          <div className="support-channels-grid">
            {/* Channel 1: Bug Report */}
            <div className="support-card">
              <span className="support-icon">🐛</span>
              <h3>Bug Reports</h3>
              <p>
                Found unexpected behavior or a website framing issue? Open an issue with steps to reproduce on our official GitHub tracker.
              </p>
              <a
                href={product.issuesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Open Bug on GitHub ↗
              </a>
            </div>

            {/* Channel 2: Feature Request */}
            <div className="support-card">
              <span className="support-icon">💡</span>
              <h3>Feature Requests</h3>
              <p>
                Have ideas for custom device profiles, new compare modes, or developer workflow enhancements? Let us know in discussions.
              </p>
              <a
                href={product.issuesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Submit Feature Request ↗
              </a>
            </div>

            {/* Channel 3: Documentation */}
            <div className="support-card">
              <span className="support-icon">📖</span>
              <h3>Technical Docs</h3>
              <p>
                Explore detailed guides on manual installation, keyboard shortcuts, header relaxation troubleshooting, and synchronization.
              </p>
              <a href="/docs/" className="btn btn-primary">
                Read Documentation →
              </a>
            </div>
          </div>

          {/* Quick FAQ / Diagnostic Tips */}
          <div className="troubleshooting-box">
            <h2 className="ts-title">Common Troubleshooting Tips</h2>

            <div className="ts-item">
              <h4>1. Why is an iframe showing "Refused to connect" or a blank screen?</h4>
              <p>
                Certain high-security websites (e.g. banking portals or Google login pages) explicitly prohibit framing or require full cookie authentication. While ViewGrid automatically strips <code>X-Frame-Options</code> and <code>CSP: frame-ancestors</code> for sub_frames, sites requiring top-level navigation must be tested in a dedicated window.
              </p>
            </div>

            <div className="ts-item">
              <h4>2. How do I test local development servers like Vite, Next.js, or Webpack?</h4>
              <p>
                Simply type your local URL (e.g. <code>http://localhost:5173</code> or <code>http://127.0.0.1:3000</code>) into ViewGrid's top address bar. Because ViewGrid runs locally as a native browser extension, it has direct access to your local loopback interfaces with zero proxy lag.
              </p>
            </div>

            <div className="ts-item">
              <h4>3. How do I temporarily test without device frames?</h4>
              <p>
                Click the <strong>▣ Frames</strong> button in the workspace toolbar or press <strong>F</strong> on your keyboard to toggle between authentic hardware bezels and clean borderless cards for maximum screen density.
              </p>
            </div>

            <div className="ts-item">
              <h4>4. Need direct assistance?</h4>
              <p>
                You can reach the author directly at{' '}
                <a href="https://sinansarikaya.dev" target="_blank" rel="noopener noreferrer">
                  sinansarikaya.dev
                </a>{' '}
                or via the{' '}
                <a href={product.repositoryUrl} target="_blank" rel="noopener noreferrer">
                  ViewGrid GitHub repository
                </a>.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        .support-main {
          padding: 64px 0 96px;
        }
        .support-container {
          max-width: 980px;
        }
        .support-channels-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 56px;
        }
        .support-card {
          background: #090e1a;
          border: 1px solid var(--border-dim);
          border-radius: var(--radius-md);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .support-card:hover {
          border-color: var(--border-bright);
          transform: translateY(-2px);
        }
        .support-icon {
          font-size: 28px;
        }
        .support-card h3 {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
        }
        .support-card p {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.55;
          margin-bottom: 8px;
        }
        .support-card .btn {
          margin-top: auto;
          width: 100%;
        }

        /* Troubleshooting Box */
        .troubleshooting-box {
          background: #030712;
          border: 1px solid var(--border-bright);
          border-radius: var(--radius-lg);
          padding: 36px 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .ts-title {
          font-size: 22px;
          font-weight: 800;
          color: #ffffff;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-dim);
        }
        .ts-item h4 {
          font-size: 15px;
          font-weight: 700;
          color: var(--accent-cyan);
          margin-bottom: 6px;
        }
        .ts-item p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .ts-item a {
          color: var(--accent-cyan);
          text-decoration: underline;
        }
        .ts-item code {
          font-family: var(--font-mono);
          color: #7dd3fc;
          background: #0f172a;
          padding: 2px 6px;
          border-radius: 4px;
        }

        @media (max-width: 640px) {
          .troubleshooting-box { padding: 24px 20px; }
        }
      `}</style>
    </div>
  );
}
