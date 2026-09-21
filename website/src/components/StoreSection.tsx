import React from 'react';
import { siteConfig } from '../data/site.config';

export function StoreSection() {
  const { chrome, firefox } = siteConfig.storeLinks;

  return (
    <section className="store-section" id="get-viewgrid">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">INSTALLATION & DOWNLOADS</span>
          <h2 className="section-title">Get ViewGrid for your preferred browser</h2>
          <p className="section-desc">
            Native Manifest V3 packages compiled and optimized independently for Chromium and Mozilla Firefox.
          </p>
        </div>

        <div className="store-grid">
          {/* Chrome Web Store Card */}
          <div className="store-card">
            <div className="store-header">
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <circle cx="24" cy="24" r="22" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <circle cx="24" cy="24" r="9" fill="#38bdf8" />
                <path d="M24 15h18A22 22 0 006 15z" fill="#ef4444" opacity="0.8" />
                <path d="M24 33L15 15A22 22 0 0039 37z" fill="#22c55e" opacity="0.8" />
                <path d="M24 33l9-18A22 22 0 0115 45z" fill="#eab308" opacity="0.8" />
              </svg>
              <div>
                <h3 className="store-name">Chrome Web Store</h3>
                <span className="store-meta">Chromium · Edge · Brave · Opera</span>
              </div>
            </div>

            <p className="store-desc">
              Powers Chrome, Microsoft Edge, Brave, and Arc browsers using Manifest V3 Service Worker and DeclarativeNetRequest.
            </p>

            <div className="store-features">
              <span>✓ Chromium MV3 Service Worker</span>
              <span>✓ DeclarativeNetRequest Header Stripping</span>
              <span>✓ Zero remote code execution</span>
            </div>

            <div className="store-cta-box">
              {chrome ? (
                <a
                  href={chrome}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Add to Chrome (Free)
                </a>
              ) : (
                <div className="store-status-pill">
                  <span className="status-badge">PENDING STORE REVIEW</span>
                  <span className="status-text">Coming soon to Chrome Web Store</span>
                </div>
              )}
            </div>
          </div>

          {/* Firefox Add-ons Card */}
          <div className="store-card">
            <div className="store-header">
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <circle cx="24" cy="24" r="22" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <path d="M24 6c-9.941 0-18 8.059-18 18s8.059 18 18 18 18-8.059 18-18c0-3.5-.99-6.76-2.7-9.53a15.8 15.8 0 00-7.3 6.53c.6-3.8-1-7.8-4-10.4-1.2-1.04-2.6-1.87-4-2.6z" fill="#f97316" opacity="0.9" />
                <circle cx="24" cy="24" r="9" fill="#38bdf8" />
              </svg>
              <div>
                <h3 className="store-name">Firefox Add-ons (AMO)</h3>
                <span className="store-meta">Mozilla Firefox · Firefox Developer Edition</span>
              </div>
            </div>

            <p className="store-desc">
              Native Firefox WebExtension implementation utilizing persistent Event Pages and blocking webRequest framing filters.
            </p>

            <div className="store-features">
              <span>✓ Firefox MV3 Event Pages</span>
              <span>✓ Blocking webRequest Header Relaxer</span>
              <span>✓ Mozilla Gecko strict ID verified</span>
            </div>

            <div className="store-cta-box">
              {firefox ? (
                <a
                  href={firefox}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Add to Firefox (Free)
                </a>
              ) : (
                <div className="store-status-pill">
                  <span className="status-badge">PENDING STORE REVIEW</span>
                  <span className="status-text">Coming soon to Firefox Add-ons</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GitHub Releases Manual Install Callout */}
        <div className="release-candidate-box">
          <div className="rc-info">
            <span className="badge badge-emerald">RELEASE CANDIDATE AVAILABLE</span>
            <h4>Want to use ViewGrid right now?</h4>
            <p>
              Download the pre-packaged zip releases directly from our GitHub Releases page and load unpacked in 10 seconds.
            </p>
          </div>
          <div className="rc-actions">
            <a
              href={siteConfig.product.releasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              Download Release ZIP (v{siteConfig.product.version})
            </a>
            <a href="/docs/#install" className="btn btn-primary">
              Manual Install Guide
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .store-section {
          padding: 88px 0;
          border-top: 1px solid var(--border-dim);
          position: relative;
        }
        .store-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 28px;
          margin-bottom: 36px;
        }
        .store-card {
          background: #090e1a;
          border: 1px solid var(--border-bright);
          border-radius: var(--radius-lg);
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
        }
        .store-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .store-name {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
        }
        .store-meta {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-dim);
        }
        .store-desc {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .store-features {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: #cbd5e1;
          padding: 14px;
          background: #020617;
          border-radius: var(--radius-sm);
          border: 1px solid #1e293b;
        }
        .store-cta-box {
          margin-top: auto;
          padding-top: 12px;
        }
        .store-status-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px;
          background: rgba(30, 41, 59, 0.5);
          border: 1px dashed var(--border-bright);
          border-radius: var(--radius-sm);
          text-align: center;
        }
        .status-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: var(--accent-cyan);
          letter-spacing: 0.06em;
        }
        .status-text {
          font-size: 12px;
          color: var(--text-secondary);
        }

        /* RC Box */
        .release-candidate-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          background: #0d1527;
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: var(--radius-md);
          padding: 24px 32px;
          box-shadow: 0 0 30px rgba(56, 189, 248, 0.08);
          flex-wrap: wrap;
        }
        .rc-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .rc-info h4 {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
        }
        .rc-info p {
          font-size: 14px;
          color: var(--text-secondary);
        }
        .rc-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .release-candidate-box { flex-direction: column; align-items: flex-start; }
          .rc-actions { width: 100%; flex-direction: column; }
          .rc-actions .btn { width: 100%; }
        }
      `}</style>
    </section>
  );
}
