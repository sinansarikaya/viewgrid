import React from 'react';
import { siteConfig } from '../data/site.config';

export function Footer() {
  const { product, storeLinks } = siteConfig;

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          {/* Brand info */}
          <div className="footer-col footer-col-brand">
            <a href="/" className="footer-brand">
              <svg className="footer-brand-icon" viewBox="0 0 36 36" fill="none" width="28" height="28" aria-hidden="true">
                <rect width="36" height="36" rx="8" fill="#021224" stroke="#1e293b" strokeWidth="1.5" />
                <rect x="6" y="6" width="6" height="6" rx="1.5" fill="#334155" />
                <rect x="15" y="6" width="6" height="6" rx="1.5" fill="#334155" />
                <rect x="24" y="6" width="6" height="6" rx="1.5" fill="#334155" />
                <rect x="6" y="15" width="6" height="6" rx="1.5" fill="#334155" />
                <rect x="15" y="15" width="6" height="6" rx="1.5" fill="#38bdf8" />
                <rect x="24" y="15" width="6" height="6" rx="1.5" fill="#334155" />
                <rect x="6" y="24" width="6" height="6" rx="1.5" fill="#334155" />
                <rect x="15" y="24" width="6" height="6" rx="1.5" fill="#334155" />
                <rect x="24" y="24" width="6" height="6" rx="1.5" fill="#334155" />
              </svg>
              <span className="brand-text">ViewGrid</span>
            </a>
            <p className="footer-desc">
              {product.description}
            </p>
            <div className="footer-badges">
              <span className="badge badge-cyan">Chromium MV3</span>
              <span className="badge badge-cyan">Firefox MV3</span>
              <span className="badge badge-emerald">Local Only</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Product</h4>
            <ul className="footer-links">
              <li><a href="/#features">Features</a></li>
              <li><a href="/#how-it-works">How It Works</a></li>
              <li><a href="/#compare">Compare Engine</a></li>
              <li><a href="/#screenshots">Screenshots</a></li>
              <li><a href="/#faq">FAQ</a></li>
            </ul>
          </div>

          {/* Docs & Legal */}
          <div className="footer-col">
            <h4 className="footer-col-title">Resources & Legal</h4>
            <ul className="footer-links">
              <li><a href="/docs/">Documentation</a></li>
              <li><a href="/support/">Support & Bug Reports</a></li>
              <li><a href="/privacy/">Privacy Policy</a></li>
              <li>
                <a href={product.repositoryUrl} target="_blank" rel="noopener noreferrer">
                  GitHub Repository ↗
                </a>
              </li>
              <li>
                <a href={product.releasesUrl} target="_blank" rel="noopener noreferrer">
                  Releases & Downloads ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Browser Stores */}
          <div className="footer-col">
            <h4 className="footer-col-title">Get ViewGrid</h4>
            <ul className="footer-links">
              <li>
                {storeLinks.chrome ? (
                  <a href={storeLinks.chrome} target="_blank" rel="noopener noreferrer">
                    Chrome Web Store ↗
                  </a>
                ) : (
                  <span className="footer-link-disabled">Chrome Web Store (Coming Soon)</span>
                )}
              </li>
              <li>
                {storeLinks.firefox ? (
                  <a href={storeLinks.firefox} target="_blank" rel="noopener noreferrer">
                    Firefox Add-ons ↗
                  </a>
                ) : (
                  <span className="footer-link-disabled">Firefox Add-ons (Coming Soon)</span>
                )}
              </li>
              <li><a href="/docs/#install">Manual Unpacked Installation</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p className="copyright">
            © {product.copyrightYear} {product.name}. Created by{' '}
            <a href="https://sinansarikaya.dev" target="_blank" rel="noopener noreferrer" className="author-link">
              {product.author}
            </a>
            . Released under the {product.license} License.
          </p>
          <div className="footer-status">
            <span className="status-indicator" />
            <span>Operational · Sub-Frame Scoped Only</span>
          </div>
        </div>
      </div>

      <style>{`
        .site-footer {
          border-top: 1px solid var(--border-dim);
          background: #020617;
          padding: 64px 0 32px;
          margin-top: auto;
        }
        .footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.2fr;
          gap: 40px;
          margin-bottom: 48px;
        }
        .footer-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .footer-desc {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 420px;
          margin-bottom: 16px;
        }
        .footer-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .footer-col-title {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 16px;
        }
        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .footer-links a {
          font-size: 13.5px;
          color: var(--text-secondary);
          transition: color 0.15s;
        }
        .footer-links a:hover {
          color: var(--accent-cyan);
        }
        .footer-link-disabled {
          font-size: 13.5px;
          color: var(--text-dim);
        }
        .footer-bottom {
          padding-top: 24px;
          border-top: 1px solid var(--border-dim);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: var(--text-dim);
          flex-wrap: wrap;
          gap: 16px;
        }
        .author-link {
          color: var(--text-secondary);
          text-decoration: underline;
        }
        .author-link:hover {
          color: var(--accent-cyan);
        }
        .footer-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-secondary);
        }
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        @media (max-width: 900px) {
          .footer-top { grid-template-columns: 1fr 1fr; }
          .footer-col-brand { grid-column: span 2; }
        }
        @media (max-width: 600px) {
          .footer-top { grid-template-columns: 1fr; }
          .footer-col-brand { grid-column: span 1; }
          .footer-bottom { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </footer>
  );
}
