import React from 'react';
import { InteractiveHeroDemo } from './InteractiveHeroDemo';

export function Hero() {
  return (
    <section className="hero-section">
      <div className="container hero-container">
        {/* Technical Status Pill */}
        <div className="hero-badge-row">
          <span className="badge badge-cyan">
            <span className="status-pulse" />
            BROWSER EXTENSION · CHROMIUM & FIREFOX MV3
          </span>
          <span className="badge badge-emerald">
            100% LOCAL & PRIVATE · ZERO TELEMETRY
          </span>
          <a href="https://github.com/sinansarikaya/viewgrid" target="_blank" rel="noopener noreferrer" className="badge badge-purple" style={{ textDecoration: 'none' }}>
            💖 100% FREE & OPEN SOURCE · GITHUB
          </a>
        </div>

        {/* Direct, Honest Headline */}
        <h1 className="hero-title">
          Test responsive layouts without constantly resizing your browser.
        </h1>

        {/* Clear Subtitle */}
        <p className="hero-sub">
          ViewGrid opens a multi-viewport testing workspace directly inside your browser.
          Render phone, tablet, laptop, and desktop views side-by-side with synchronized scroll,
          drag diffing, and automated iframe header relaxation.
        </p>

        {/* Primary Action Buttons */}
        <div className="hero-ctas">
          <a href="#get-viewgrid" className="btn btn-primary">
            <span>Install ViewGrid</span>
            <span className="btn-arrow">↓</span>
          </a>
          <a href="#how-it-works" className="btn btn-outline">
            See How It Works
          </a>
          <a href="/docs/" className="btn btn-outline">
            Documentation
          </a>
        </div>

        {/* Quick Spec Bar */}
        <div className="spec-strip">
          <div className="spec-item">
            <span className="spec-dot" />
            <span className="spec-label">Engine:</span>
            <span className="spec-val">Chromium DNR + Firefox webRequest</span>
          </div>
          <div className="spec-item">
            <span className="spec-dot" />
            <span className="spec-label">Sync Protocol:</span>
            <span className="spec-val">Epoch-Fenced (Loop-Proof)</span>
          </div>
          <div className="spec-item">
            <span className="spec-dot" />
            <span className="spec-label">Protection:</span>
            <span className="spec-val">Sub-Frame Scoped Only</span>
          </div>
        </div>

        {/* Interactive Live Viewport Playground */}
        <InteractiveHeroDemo />
      </div>

      <style>{`
        .hero-section {
          padding: 64px 0 48px;
          position: relative;
        }
        .hero-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .hero-badge-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-bottom: 24px;
        }
        .status-pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent-cyan);
          box-shadow: 0 0 8px var(--accent-cyan);
          animation: pulse 2s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .hero-title {
          font-size: clamp(34px, 5.5vw, 62px);
          font-weight: 900;
          letter-spacing: -0.035em;
          line-height: 1.1;
          color: #ffffff;
          max-width: 960px;
          margin-bottom: 20px;
        }
        .hero-sub {
          font-size: clamp(16px, 2vw, 20px);
          color: var(--text-secondary);
          max-width: 760px;
          line-height: 1.55;
          margin-bottom: 32px;
        }
        .hero-ctas {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          margin-bottom: 32px;
        }
        .btn-arrow {
          font-family: var(--font-mono);
          transition: transform 0.15s;
        }
        .btn:hover .btn-arrow {
          transform: translateY(2px);
        }
        .spec-strip {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
          padding: 10px 18px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--border-dim);
          border-radius: 999px;
          margin-bottom: 16px;
          font-family: var(--font-mono);
          font-size: 11px;
        }
        .spec-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .spec-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--border-bright);
        }
        .spec-label {
          color: var(--text-dim);
        }
        .spec-val {
          color: var(--text-secondary);
          font-weight: 500;
        }
        @media (max-width: 768px) {
          .hero-section { padding: 40px 0 32px; }
          .spec-strip { border-radius: var(--radius-md); flex-direction: column; gap: 8px; }
        }

        @media (max-width: 520px) {
          .hero-badge-row .badge {
            font-size: 10px;
            white-space: normal;
            text-align: center;
          }
          .hero-ctas .btn {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
