import React from 'react';

interface ProblemSolution {
  friction: string;
  solution: string;
  badge: string;
}

const comparisons: ProblemSolution[] = [
  {
    badge: 'DEVTOOLS DRAG FRICTION',
    friction: 'Constantly dragging browser DevTools width back and forth between 375px and 1280px to check if a breakpoint broke.',
    solution: 'View phone, tablet, and desktop viewports side-by-side simultaneously. Every CSS change refreshes across all screens at once.',
  },
  {
    badge: 'X-FRAME-OPTIONS BLOCKING',
    friction: 'Generic iframe responsive testers fail completely on sites that send X-Frame-Options: DENY or CSP frame-ancestors.',
    solution: 'Automatic DeclarativeNetRequest & webRequest engine strips frame restrictions solely for workspace sub_frames, leaving normal browsing tabs safe.',
  },
  {
    badge: 'MANUAL INTERACTION REPETITION',
    friction: 'Clicking navigation, filling form inputs, and scrolling to test user journeys manually on 4 separate browser windows.',
    solution: 'Synchronized event fan-out with loop-proof epoch fencing. Scroll or click in one viewport; all others mirror instantly without echo loops.',
  },
  {
    badge: 'REGRESSION SPOT CHECKING',
    friction: 'Switching between tabs or taking screenshots to eyeball whether desktop layout elements misaligned compared to tablet.',
    solution: 'Dual-Split interactive slider, Overlay Curtain diff, and Side-by-Side comparison modes make breakpoint discrepancies immediately obvious.',
  },
  {
    badge: 'USER-AGENT & TOUCH BLINDNESS',
    friction: 'Desktop hover effects masking mobile touch bugs, and servers serving desktop HTML to mobile DevTools emulations.',
    solution: 'Real user-agent header injection per viewport frame, paired with authentic touch cursor simulation and drag-to-scroll physics.',
  },
  {
    badge: 'PRIVACY & LOCAL DEV CONCERNS',
    friction: 'Cloud testing SaaS tools charging monthly subscriptions, proxying your code through remote servers, and failing on localhost.',
    solution: '100% local extension running directly inside your browser. No cloud, no proxy, no accounts, zero telemetry, full localhost support.',
  },
];

export function WhyViewgrid() {
  return (
    <section className="why-section" id="why">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">BUILT FOR REAL DEVELOPER WORKFLOWS</span>
          <h2 className="section-title">Why traditional responsive testing slows you down</h2>
          <p className="section-desc">
            Browser DevTools were built for inspecting a single screen at a time. ViewGrid is purpose-built for multi-device reality.
          </p>
        </div>

        <div className="why-grid">
          {comparisons.map((item, i) => (
            <div key={i} className="why-card">
              <div className="why-badge-row">
                <span className="badge badge-cyan">{item.badge}</span>
              </div>

              {/* The Old Way */}
              <div className="comparison-block comparison-old">
                <span className="comparison-tag tag-old">✕ THE FRICTION</span>
                <p className="comparison-text text-old">{item.friction}</p>
              </div>

              {/* The ViewGrid Way */}
              <div className="comparison-block comparison-new">
                <span className="comparison-tag tag-new">✓ VIEWGRID</span>
                <p className="comparison-text text-new">{item.solution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .why-section {
          padding: 80px 0;
          border-top: 1px solid var(--border-dim);
          background: rgba(10, 15, 29, 0.4);
        }
        .why-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 24px;
        }
        .why-card {
          background: #0b1222;
          border: 1px solid var(--border-dim);
          border-radius: var(--radius-md);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .why-card:hover {
          border-color: var(--border-bright);
          transform: translateY(-2px);
        }
        .why-badge-row {
          display: flex;
        }
        .comparison-block {
          padding: 14px 16px;
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .comparison-old {
          background: rgba(239, 68, 68, 0.04);
          border-left: 3px solid #ef4444;
        }
        .comparison-new {
          background: rgba(56, 189, 248, 0.05);
          border-left: 3px solid var(--accent-cyan);
        }
        .comparison-tag {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
        }
        .tag-old { color: #f87171; }
        .tag-new { color: var(--accent-cyan); }
        .comparison-text {
          font-size: 13.5px;
          line-height: 1.5;
        }
        .text-old { color: #94a3b8; }
        .text-new { color: #f8fafc; font-weight: 500; }

        @media (max-width: 640px) {
          .why-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
