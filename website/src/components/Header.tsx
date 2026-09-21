import React, { useState } from 'react';
import { siteConfig } from '../data/site.config';

interface HeaderProps {
  currentPath?: string;
}

export function Header({ currentPath = '/' }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        {/* Brand */}
        <a href="/" className="brand" aria-label="ViewGrid Home">
          <svg className="brand-icon" viewBox="0 0 36 36" fill="none" width="32" height="32" aria-hidden="true">
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
          <span className="brand-text">
            ViewGrid<span className="brand-dot">.</span>
          </span>
          <span className="brand-badge">v{siteConfig.product.version}</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="nav-desktop" aria-label="Main Navigation">
          {siteConfig.navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`nav-link ${currentPath === item.href ? 'nav-link-active' : ''}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Action CTAs */}
        <div className="header-actions">
          <a
            href={siteConfig.product.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-github"
            aria-label="View on GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </a>

          <a href="/#get-viewgrid" className="btn btn-primary btn-sm">
            Get ViewGrid
          </a>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="nav-mobile-dropdown">
          <div className="container mobile-links">
            {siteConfig.navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="mobile-actions">
              <a
                href={siteConfig.product.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ width: '100%' }}
              >
                GitHub Repository
              </a>
              <a
                href="/#get-viewgrid"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Get ViewGrid Extension
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(2, 6, 23, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-dim);
          transition: border-color 0.2s;
        }
        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 68px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }
        .brand-text {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #ffffff;
        }
        .brand-dot {
          color: var(--accent-cyan);
        }
        .brand-badge {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: var(--accent-cyan);
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .nav-desktop {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .nav-link {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          transition: color 0.15s;
        }
        .nav-link:hover {
          color: #ffffff;
        }
        .nav-link-active {
          color: var(--accent-cyan);
          font-weight: 600;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .btn-github {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-dim);
          background: rgba(15, 23, 42, 0.4);
          transition: all 0.15s;
        }
        .btn-github:hover {
          color: #ffffff;
          border-color: var(--border-bright);
          background: rgba(30, 41, 59, 0.5);
        }
        .btn-sm {
          padding: 8px 16px;
          font-size: 13px;
        }
        .mobile-toggle {
          display: none;
          background: none;
          border: 1px solid var(--border-bright);
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #ffffff;
        }
        .hamburger-bar {
          display: block;
          width: 18px;
          height: 2px;
          background: currentColor;
          position: relative;
          transition: background 0.2s;
        }
        .hamburger-bar::before, .hamburger-bar::after {
          content: "";
          position: absolute;
          width: 18px;
          height: 2px;
          background: currentColor;
          left: 0;
          transition: transform 0.2s;
        }
        .hamburger-bar::before { top: -6px; }
        .hamburger-bar::after { bottom: -6px; }
        .hamburger-bar.open { background: transparent; }
        .hamburger-bar.open::before { transform: rotate(45deg); top: 0; }
        .hamburger-bar.open::after { transform: rotate(-45deg); bottom: 0; }
        .nav-mobile-dropdown {
          display: none;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-dim);
          padding: 20px 0 24px;
        }
        .mobile-links {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .mobile-link {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-secondary);
          padding: 6px 0;
        }
        .mobile-link:hover {
          color: var(--accent-cyan);
        }
        .mobile-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-dim);
        }

        @media (max-width: 900px) {
          .nav-desktop { display: none; }
          .mobile-toggle { display: inline-flex; }
          .nav-mobile-dropdown { display: block; }
          .btn-github { display: none; }
        }

        @media (max-width: 520px) {
          .brand-badge { display: none; }
          .header-actions .btn-sm { display: none; }
          .header-inner { height: 58px; }
        }
      `}</style>
    </header>
  );
}
