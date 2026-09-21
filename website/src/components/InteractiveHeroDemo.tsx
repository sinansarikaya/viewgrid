import React, { useState, useEffect, useRef } from 'react';

export function InteractiveHeroDemo() {
  const [activeTab, setActiveTab] = useState<'all' | 'compare'>('all');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [scrollProgress, setScrollProgress] = useState(25);
  const [compareSplit, setCompareSplit] = useState(50);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const [urlInput, setUrlInput] = useState('https://app.example.dev');
  const [syncFlash, setSyncFlash] = useState(false);
  const dividerContainerRef = useRef<HTMLDivElement>(null);

  // Trigger brief sync flash whenever interaction changes
  const triggerSync = () => {
    setSyncFlash(true);
    setTimeout(() => setSyncFlash(false), 400);
  };

  // Handle divider drag in compare mode
  useEffect(() => {
    if (!isDraggingDivider) return;
    const onMove = (e: MouseEvent) => {
      if (!dividerContainerRef.current) return;
      const rect = dividerContainerRef.current.getBoundingClientRect();
      const pct = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
      setCompareSplit(pct);
    };
    const onUp = () => setIsDraggingDivider(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDraggingDivider]);

  return (
    <div className="demo-wrapper">
      {/* Extension Browser Chrome Toolbar */}
      <div className="demo-chrome">
        <div className="demo-traffic-lights">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>

        {/* URL Bar */}
        <div className="demo-url-box">
          <span className="url-lock">🔒</span>
          <input
            type="text"
            className="demo-url-input"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              triggerSync();
            }}
            aria-label="Simulated URL"
          />
          <span className="url-badge">sub_frame unblocked</span>
        </div>

        {/* Toolbar Controls */}
        <div className="demo-controls">
          <button
            type="button"
            className={`demo-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('all');
              triggerSync();
            }}
          >
            ▦ Grid (3 Viewports)
          </button>
          <button
            type="button"
            className={`demo-btn ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('compare');
              triggerSync();
            }}
          >
            ⚖ Compare Diff
          </button>
          <button
            type="button"
            className="demo-btn demo-btn-icon"
            onClick={() => {
              setOrientation((o) => (o === 'portrait' ? 'landscape' : 'portrait'));
              triggerSync();
            }}
            title="Rotate Device Orientation"
          >
            🔄 {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
          </button>
        </div>

        {/* Sync Status Badge */}
        <div className={`sync-status ${syncFlash ? 'sync-active' : ''}`}>
          <span className="sync-dot" />
          <span>Sync Active</span>
        </div>
      </div>

      {/* Simulated Viewport Stage */}
      <div className="demo-stage">
        {activeTab === 'all' ? (
          /* Multi-viewport Grid Mode */
          <div className="viewports-row">
            {/* 1. Mobile Viewport (iPhone 15 Pro) */}
            <div
              className={`vp-card vp-mobile ${orientation === 'landscape' ? 'vp-landscape' : ''}`}
              style={{ flex: orientation === 'landscape' ? '1.4' : '1' }}
            >
              <div className="vp-header">
                <span className="vp-name">📱 iPhone 15 Pro</span>
                <span className="vp-dims">
                  {orientation === 'portrait' ? '375 × 812' : '812 × 375'} · 3x
                </span>
              </div>
              <div className="vp-bezel">
                <div className="mock-site mobile-mock">
                  <div className="mock-nav">
                    <span className="mock-logo">BRAND</span>
                    <span className="mock-menu-icon">☰</span>
                  </div>
                  <div className="mock-hero-text">
                    <h4>Next-Gen Platform</h4>
                    <p>Designed for every screen</p>
                  </div>
                  <div className="mock-card-list">
                    <div className="mock-block" />
                    <div className="mock-block" />
                  </div>
                  {/* Sync Touch Indicator */}
                  <div className="touch-cursor-sim" style={{ top: `${scrollProgress + 20}%` }} />
                </div>
              </div>
            </div>

            {/* 2. Tablet Viewport (iPad Air) */}
            <div
              className={`vp-card vp-tablet ${orientation === 'landscape' ? 'vp-landscape' : ''}`}
              style={{ flex: orientation === 'landscape' ? '1.8' : '1.5' }}
            >
              <div className="vp-header">
                <span className="vp-name">📟 iPad Air</span>
                <span className="vp-dims">
                  {orientation === 'portrait' ? '768 × 1024' : '1024 × 768'} · 2x
                </span>
              </div>
              <div className="vp-bezel">
                <div className="mock-site tablet-mock">
                  <div className="mock-nav">
                    <span className="mock-logo">BRAND</span>
                    <div className="mock-nav-links">
                      <span>Products</span>
                      <span>Pricing</span>
                      <span>Docs</span>
                    </div>
                  </div>
                  <div className="mock-grid-2">
                    <div className="mock-card-hero">
                      <h3>Next-Gen Responsive Engine</h3>
                      <p>Unified layout validation across devices.</p>
                      <span className="mock-btn">Try ViewGrid</span>
                    </div>
                    <div className="mock-preview-box" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Desktop Viewport (MacBook 14") */}
            <div className="vp-card vp-desktop" style={{ flex: '2.2' }}>
              <div className="vp-header">
                <span className="vp-name">💻 Desktop HD</span>
                <span className="vp-dims">1280 × 800 · 1x</span>
              </div>
              <div className="vp-bezel">
                <div className="mock-site desktop-mock">
                  <div className="mock-nav">
                    <span className="mock-logo">BRAND.IO</span>
                    <div className="mock-nav-links">
                      <span>Solutions</span>
                      <span>Features</span>
                      <span>Pricing</span>
                      <span>API</span>
                    </div>
                    <span className="mock-pill">Sign In</span>
                  </div>
                  <div className="mock-desktop-content">
                    <div className="mock-header-row">
                      <h2>Responsive Layout Inspector</h2>
                      <div className="mock-tags">
                        <span className="tag">DNR Enabled</span>
                        <span className="tag">Sync Loop-Guarded</span>
                      </div>
                    </div>
                    <div className="mock-grid-3">
                      <div className="mock-box" />
                      <div className="mock-box" />
                      <div className="mock-box" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Compare Split Slider Mode */
          <div className="compare-stage" ref={dividerContainerRef}>
            {/* Left Device: Mobile */}
            <div className="compare-pane compare-left" style={{ width: `${compareSplit}%` }}>
              <div className="compare-tag-bar">
                <span>📱 Mobile View (375px)</span>
              </div>
              <div className="mock-site mobile-mock-split">
                <div className="mock-nav">
                  <span className="mock-logo">BRAND</span>
                  <span className="mock-menu-icon">☰</span>
                </div>
                <div className="mock-content-split">
                  <h4>Mobile Stacked Layout</h4>
                  <p>Single column breakpoint with hamburger menu.</p>
                  <div className="mock-block" />
                </div>
              </div>
            </div>

            {/* Right Device: Desktop */}
            <div className="compare-pane compare-right" style={{ width: `${100 - compareSplit}%` }}>
              <div className="compare-tag-bar compare-tag-right">
                <span>💻 Desktop View (1280px)</span>
              </div>
              <div className="mock-site desktop-mock-split">
                <div className="mock-nav">
                  <span className="mock-logo">BRAND.IO</span>
                  <div className="mock-nav-links">
                    <span>Solutions</span>
                    <span>Docs</span>
                    <span>Status</span>
                  </div>
                </div>
                <div className="mock-content-split">
                  <h4>Desktop Multi-Column Layout</h4>
                  <p>Wide expanded navigation bar and responsive grid system.</p>
                  <div className="mock-grid-2">
                    <div className="mock-box" />
                    <div className="mock-box" />
                  </div>
                </div>
              </div>
            </div>

            {/* Draggable Divider Handle */}
            <div
              className="compare-divider"
              style={{ left: `${compareSplit}%` }}
              onMouseDown={() => setIsDraggingDivider(true)}
              onTouchStart={() => setIsDraggingDivider(true)}
            >
              <div className="compare-handle" title="Drag to inspect breakpoint differences">
                <span>↔</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Interactive Scrub Bar */}
        <div className="demo-scrubber">
          <label className="scrub-label" htmlFor="scroll-scrub">
            <span>Synchronized Scroll Simulation:</span>
            <span className="scrub-val">{scrollProgress}%</span>
          </label>
          <input
            id="scroll-scrub"
            type="range"
            min="0"
            max="100"
            value={scrollProgress}
            onChange={(e) => {
              setScrollProgress(Number(e.target.value));
              triggerSync();
            }}
            className="scrub-slider"
          />
          <div className="scrub-hints">
            <span>Scroll once in ViewGrid</span>
            <span>Mirrored live across all viewports without loops</span>
          </div>
        </div>
      </div>

      <style>{`
        .demo-wrapper {
          background: #030712;
          border: 1px solid var(--border-bright);
          border-radius: var(--radius-lg);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(56, 189, 248, 0.08);
          overflow: hidden;
          margin-top: 40px;
        }
        .demo-chrome {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 18px;
          background: #0b1120;
          border-bottom: 1px solid var(--border-dim);
          flex-wrap: wrap;
        }
        .demo-traffic-lights {
          display: flex;
          gap: 6px;
        }
        .dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
        }
        .dot-red { background: #ef4444; }
        .dot-yellow { background: #eab308; }
        .dot-green { background: #22c55e; }
        .demo-url-box {
          flex: 1;
          min-width: 220px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #030712;
          border: 1px solid var(--border-dim);
          border-radius: 6px;
          padding: 6px 12px;
        }
        .url-lock { font-size: 11px; }
        .demo-url-input {
          flex: 1;
          background: none;
          border: none;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-primary);
          outline: none;
        }
        .url-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent-cyan);
          background: rgba(56, 189, 248, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .demo-controls {
          display: flex;
          gap: 6px;
        }
        .demo-btn {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
          padding: 6px 10px;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid var(--border-dim);
          color: var(--text-secondary);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .demo-btn:hover {
          color: #ffffff;
          border-color: var(--border-bright);
        }
        .demo-btn.active {
          background: rgba(56, 189, 248, 0.15);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          font-weight: 600;
        }
        .sync-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-emerald);
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          transition: all 0.2s;
        }
        .sync-active {
          background: rgba(56, 189, 248, 0.25);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
        }
        .sync-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }
        .demo-stage {
          padding: 24px;
          background: #030712;
          min-height: 380px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .viewports-row {
          display: flex;
          gap: 16px;
          align-items: stretch;
        }
        .vp-card {
          background: #0f172a;
          border: 1px solid var(--border-dim);
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: flex 0.25s ease;
        }
        .vp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #1e293b;
          font-family: var(--font-mono);
          font-size: 11px;
          border-bottom: 1px solid var(--border-dim);
        }
        .vp-name { font-weight: 600; color: var(--text-primary); }
        .vp-dims { color: var(--accent-cyan); }
        .vp-bezel {
          padding: 12px;
          flex: 1;
          display: flex;
        }
        .mock-site {
          flex: 1;
          background: #020617;
          border: 1px solid #1e293b;
          border-radius: 6px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          min-height: 220px;
        }
        .mock-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid #1e293b;
          font-family: var(--font-mono);
          font-size: 11px;
        }
        .mock-logo { font-weight: 800; color: var(--accent-cyan); }
        .mock-nav-links { display: flex; gap: 10px; color: var(--text-secondary); font-size: 10px; }
        .mock-pill { background: #1e293b; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
        .mock-hero-text h4 { font-size: 13px; color: #ffffff; }
        .mock-hero-text p { font-size: 11px; color: var(--text-secondary); }
        .mock-card-list { display: flex; flex-direction: column; gap: 6px; }
        .mock-block { height: 28px; background: #0f172a; border-radius: 4px; border: 1px dashed #1e293b; }
        .touch-cursor-sim {
          position: absolute;
          left: 50%;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(56, 189, 248, 0.4);
          border: 2px solid #38bdf8;
          transform: translate(-50%, -50%);
          pointer-events: none;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
          transition: top 0.2s ease;
        }
        .mock-grid-2 { display: grid; grid-template-columns: 1.2fr 1fr; gap: 10px; }
        .mock-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .mock-card-hero h3 { font-size: 13px; margin-bottom: 4px; }
        .mock-card-hero p { font-size: 10px; color: var(--text-secondary); margin-bottom: 8px; }
        .mock-btn { display: inline-block; font-size: 9px; font-weight: 600; padding: 3px 8px; background: var(--accent-cyan); color: #020617; border-radius: 3px; }
        .mock-preview-box { background: #0f172a; border-radius: 4px; border: 1px solid #1e293b; min-height: 80px; }
        .mock-desktop-content { display: flex; flex-direction: column; gap: 12px; }
        .mock-header-row { display: flex; justify-content: space-between; align-items: center; }
        .mock-header-row h2 { font-size: 14px; font-weight: 700; }
        .mock-tags { display: flex; gap: 6px; }
        .tag { font-family: var(--font-mono); font-size: 9px; padding: 2px 6px; background: #1e293b; border-radius: 3px; color: var(--text-secondary); }
        .mock-box { height: 60px; background: #0f172a; border-radius: 4px; border: 1px solid #1e293b; }

        /* Compare Split Mode */
        .compare-stage {
          display: flex;
          position: relative;
          background: #020617;
          border: 1px solid var(--border-dim);
          border-radius: 8px;
          min-height: 280px;
          overflow: hidden;
          user-select: none;
        }
        .compare-pane {
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .compare-left { background: #030712; }
        .compare-right { background: #0b1329; border-left: 1px solid #1e293b; }
        .compare-tag-bar {
          padding: 6px 12px;
          background: #111827;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--accent-cyan);
          border-bottom: 1px solid var(--border-dim);
        }
        .compare-tag-right { color: #818cf8; }
        .compare-divider {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 4px;
          background: var(--accent-cyan);
          transform: translateX(-50%);
          cursor: ew-resize;
          z-index: 10;
        }
        .compare-handle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #020617;
          border: 2px solid var(--accent-cyan);
          color: var(--accent-cyan);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.5);
        }
        .mock-content-split { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
        .mock-content-split h4 { font-size: 14px; color: #ffffff; }
        .mock-content-split p { font-size: 12px; color: var(--text-secondary); }

        /* Scrubber */
        .demo-scrubber {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px 16px;
          background: #0b1120;
          border: 1px solid var(--border-dim);
          border-radius: 6px;
        }
        .scrub-label {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-secondary);
        }
        .scrub-val { color: var(--accent-cyan); font-weight: 600; }
        .scrub-slider {
          width: 100%;
          accent-color: var(--accent-cyan);
          cursor: pointer;
        }
        .scrub-hints {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-dim);
        }

        @media (max-width: 900px) {
          .viewports-row { flex-direction: column; }
          .vp-desktop { display: none; }
        }

        @media (max-width: 640px) {
          .demo-chrome {
            gap: 10px;
            padding: 10px 12px;
          }
          .demo-url-box {
            min-width: 0;
            width: 100%;
            padding: 5px 8px;
          }
          .url-badge {
            display: none;
          }
          .demo-controls {
            flex-wrap: wrap;
            width: 100%;
          }
          .demo-btn {
            flex: 1;
            min-width: 75px;
            text-align: center;
            justify-content: center;
            font-size: 10px;
            padding: 5px 6px;
          }
          .sync-status {
            width: 100%;
            justify-content: center;
          }
          .scrub-hints {
            flex-direction: column;
            gap: 4px;
            text-align: center;
          }
          .demo-stage {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}
