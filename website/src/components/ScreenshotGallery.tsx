import React, { useState } from 'react';
import { siteConfig } from '../data/site.config';

export function ScreenshotGallery() {
  const [activeTab, setActiveTab] = useState(0);
  const items = siteConfig.screenshots;
  const current = items[activeTab] ?? items[0]!;

  return (
    <section className="gallery-section" id="screenshots">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">INTERFACE TOUR</span>
          <h2 className="section-title">Built for speed, clarity, and precision</h2>
          <p className="section-desc">
            Explore the ViewGrid workspace, comparison modes, device shells, and integrated diagnostics.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="gallery-tabs">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              className={`gallery-tab ${activeTab === idx ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(idx)}
            >
              <span className="tab-badge">{item.badge}</span>
              <span className="tab-title">{item.title}</span>
            </button>
          ))}
        </div>

        {/* Display Frame with CLS Prevention */}
        <div className="gallery-viewport-frame">
          <div className="frame-chrome-bar">
            <div className="frame-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>
            <div className="frame-address">
              <span>viewgrid://workspace — {current.title}</span>
            </div>
            <span className="badge badge-cyan">{current.badge}</span>
          </div>

          {/* Aspect Ratio Container to prevent CLS */}
          <div className="screenshot-aspect-box">
            {current.file ? (
              /* Real Screenshot Image */
              <img
                src={current.file}
                alt={current.title}
                loading="lazy"
                width="1280"
                height="800"
                className="screenshot-img"
              />
            ) : (
              /* Stylized Vector Mockup & Coming Soon Placeholder */
              <div className="screenshot-placeholder-stage">
                <div className="placeholder-ui-mockup">
                  {/* Mock toolbar */}
                  <div className="mock-toolbar-strip">
                    <span className="mock-btn-tool">＋ Add Device</span>
                    <span className="mock-btn-tool">Presets ▼</span>
                    <span className="mock-btn-tool">Grid Mode ▼</span>
                    <span className="mock-btn-tool">Sync: Scroll ● Click</span>
                    <span className="mock-btn-tool mock-accent">⚖ Compare</span>
                  </div>

                  {/* Mock Device Frames Grid */}
                  <div className="mock-device-canvas">
                    <div className="canvas-device-card device-phone">
                      <div className="dev-header">
                        <span>📱 Phone (375×812)</span>
                        <span className="dev-scale">scale: 85%</span>
                      </div>
                      <div className="dev-screen">
                        <div className="screen-line line-header" />
                        <div className="screen-line" />
                        <div className="screen-line line-short" />
                        <div className="screen-box" />
                      </div>
                    </div>

                    <div className="canvas-device-card device-tablet">
                      <div className="dev-header">
                        <span>📟 Tablet (768×1024)</span>
                        <span className="dev-scale">scale: 65%</span>
                      </div>
                      <div className="dev-screen">
                        <div className="screen-line line-header" />
                        <div className="screen-grid-2">
                          <div className="screen-box" />
                          <div className="screen-box" />
                        </div>
                      </div>
                    </div>

                    <div className="canvas-device-card device-laptop">
                      <div className="dev-header">
                        <span>💻 Desktop (1280×800)</span>
                        <span className="dev-scale">scale: 48%</span>
                      </div>
                      <div className="dev-screen">
                        <div className="screen-line line-header" />
                        <div className="screen-grid-3">
                          <div className="screen-box" />
                          <div className="screen-box" />
                          <div className="screen-box" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clear Placeholder Badge */}
                <div className="placeholder-overlay-badge">
                  <span className="placeholder-icon">📷</span>
                  <span className="placeholder-text">Official Screenshot Coming Soon</span>
                  <span className="placeholder-sub">
                    Drop your screenshot into <code>website/public/screenshots/{current.id}.png</code> to showcase here.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="gallery-caption">
            <h4>{current.title}</h4>
            <p>{current.description}</p>
          </div>
        </div>
      </div>

      <style>{`
        .gallery-section {
          padding: 88px 0;
          border-top: 1px solid var(--border-dim);
          background: rgba(15, 23, 42, 0.2);
        }
        .gallery-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          max-width: 100%;
          padding-bottom: 8px;
        }
        .gallery-tab {
          background: #090e1a;
          border: 1px solid var(--border-dim);
          border-radius: var(--radius-sm);
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .gallery-tab:hover {
          border-color: var(--border-bright);
        }
        .gallery-tab.tab-active {
          background: #0f1a33;
          border-color: var(--accent-cyan);
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.15);
        }
        .tab-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: var(--accent-cyan);
        }
        .tab-title {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
        }

        .gallery-viewport-frame {
          background: #030712;
          border: 1px solid var(--border-bright);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
        }
        .frame-chrome-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: #0a0f1d;
          border-bottom: 1px solid var(--border-dim);
        }
        .frame-dots { display: flex; gap: 6px; }
        .frame-address {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-secondary);
        }

        /* Aspect ratio 16:10 */
        .screenshot-aspect-box {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9.5;
          min-height: 240px;
          background: #020617;
          overflow: hidden;
        }
        .screenshot-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Vector Placeholder Mockup */
        .screenshot-placeholder-stage {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          background: #020617;
          background-image: radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 60%);
        }
        .placeholder-ui-mockup {
          padding: 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          opacity: 0.55;
          filter: blur(0.5px);
        }
        .mock-toolbar-strip {
          display: flex;
          gap: 8px;
          padding: 8px 12px;
          background: #0a0f1d;
          border: 1px solid #1e293b;
          border-radius: 6px;
          overflow-x: hidden;
        }
        .mock-btn-tool {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-dim);
          background: #0f172a;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .mock-accent { color: var(--accent-cyan); font-weight: 600; }

        .mock-device-canvas {
          flex: 1;
          display: flex;
          gap: 14px;
        }
        .canvas-device-card {
          flex: 1;
          background: #0a0f1d;
          border: 1px solid #1e293b;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .dev-header {
          display: flex;
          justify-content: space-between;
          padding: 6px 10px;
          background: #111827;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-secondary);
        }
        .dev-scale { color: var(--text-dim); }
        .dev-screen {
          flex: 1;
          background: #030712;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .screen-line { height: 8px; background: #1e293b; border-radius: 3px; }
        .line-header { height: 12px; background: #334155; width: 60%; }
        .line-short { width: 40%; }
        .screen-box { flex: 1; min-height: 40px; background: #0f172a; border-radius: 4px; border: 1px dashed #1e293b; }
        .screen-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; flex: 1; }
        .screen-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; flex: 1; }

        /* Floating Center Badge */
        .placeholder-overlay-badge {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 440px;
          box-sizing: border-box;
          background: rgba(2, 6, 23, 0.94);
          border: 1px solid var(--accent-cyan);
          box-shadow: 0 0 32px rgba(56, 189, 248, 0.25);
          border-radius: var(--radius-md);
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
        }
        .placeholder-icon { font-size: 24px; }
        .placeholder-text {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }
        .placeholder-sub {
          font-size: 11px;
          color: var(--text-secondary);
          max-width: 100%;
          word-break: break-word;
        }
        .placeholder-sub code {
          font-family: var(--font-mono);
          color: var(--accent-cyan);
          background: rgba(56, 189, 248, 0.1);
          padding: 2px 5px;
          border-radius: 3px;
          word-break: break-all;
        }

        .gallery-caption {
          padding: 16px 20px;
          background: #0a0f1d;
          border-top: 1px solid var(--border-dim);
        }
        .gallery-caption h4 {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }
        .gallery-caption p {
          font-size: 13px;
          color: var(--text-secondary);
        }

        @media (max-width: 640px) {
          .placeholder-ui-mockup {
            display: none;
          }
          .gallery-section {
            padding: 56px 0;
          }
          .gallery-caption {
            padding: 12px 14px;
          }
          .frame-address {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
