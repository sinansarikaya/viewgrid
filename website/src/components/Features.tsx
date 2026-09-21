import React from 'react';
import { siteConfig } from '../data/site.config';

export function Features() {
  return (
    <section className="features-section" id="features">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">ENGINEERED CAPABILITIES</span>
          <h2 className="section-title">Everything you need for responsive precision</h2>
          <p className="section-desc">
            No mockups or artificial constraints. ViewGrid runs actual browser rendering engines with developer-first controls.
          </p>
        </div>

        <div className="features-grid">
          {siteConfig.features.map((feat) => (
            <div key={feat.id} className="feature-card">
              <div className="feature-top">
                <span className="feature-icon" aria-hidden="true">{feat.icon}</span>
                {feat.highlight && (
                  <span className="feature-pill">{feat.highlight}</span>
                )}
              </div>

              <h3 className="feature-title">{feat.title}</h3>
              <span className="feature-tagline">{feat.tagline}</span>
              <p className="feature-desc">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .features-section {
          padding: 88px 0;
          border-top: 1px solid var(--border-dim);
          position: relative;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }
        .feature-card {
          background: #090e1a;
          border: 1px solid var(--border-dim);
          border-radius: var(--radius-md);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.2s, background-color 0.2s, transform 0.2s;
        }
        .feature-card:hover {
          border-color: var(--border-bright);
          background: #0d1527;
          transform: translateY(-2px);
        }
        .feature-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .feature-icon {
          font-size: 24px;
          color: var(--accent-cyan);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.2);
        }
        .feature-pill {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-dim);
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid var(--border-dim);
          padding: 3px 8px;
          border-radius: 4px;
        }
        .feature-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.01em;
        }
        .feature-tagline {
          font-size: 13px;
          font-weight: 500;
          color: var(--accent-cyan);
        }
        .feature-desc {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.55;
          margin-top: 4px;
        }

        @media (max-width: 640px) {
          .features-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
