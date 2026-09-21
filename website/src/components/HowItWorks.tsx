import React, { useState } from 'react';

interface Step {
  num: string;
  title: string;
  code: string;
  detail: string;
  badge: string;
  meta: string;
}

const steps: Step[] = [
  {
    num: '01',
    title: 'Launch the Workspace',
    code: 'Alt+Shift+V  // or click ViewGrid toolbar icon',
    detail: 'Opens a dedicated full-window ViewGrid workspace tab. The background script immediately prepares session-scoped DNR and webRequest framing rules.',
    badge: 'INSTANT LAUNCH',
    meta: 'Chromium Service Worker / Firefox Event Page',
  },
  {
    num: '02',
    title: 'Enter Any URL or Localhost',
    code: 'http://localhost:5173  // or staging, production',
    detail: 'Navigate directly from the unified address bar. Framing headers (XFO: DENY and CSP: frame-ancestors) are automatically bypassed for workspace iframes.',
    badge: 'ZERO-CONFIG UNBLOCK',
    meta: 'Scoped strictly to tab sub_frames',
  },
  {
    num: '03',
    title: 'Choose Device Presets',
    code: 'Standard Responsive · Mobile Test · iOS+Android',
    detail: 'Add multiple devices with one click or create custom resolutions. Toggle device frames, switch portrait/landscape, and set custom user-agents.',
    badge: 'DYNAMIC CANVAS',
    meta: 'Preset or custom pixel sizing',
  },
  {
    num: '04',
    title: 'Interact, Sync & Diff',
    code: '⚖ Compare Engine: Split · Curtain · Side-by-Side',
    detail: 'Scroll, click, or type once. Watch changes reflect across every screen in real time with loop-proof epoch fencing. Drag the split slider to verify pixel alignments.',
    badge: 'SYNCHRONIZED',
    meta: 'Loop-proof epoch synchronization',
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const currentStep = steps[activeStep] ?? steps[0]!;

  return (
    <section className="how-section" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">STREAMLINED WORKFLOW</span>
          <h2 className="section-title">From URL to multi-device validation in seconds</h2>
          <p className="section-desc">
            No complex configuration files or cloud build setups. ViewGrid integrates directly into your daily development environment.
          </p>
        </div>

        {/* Step Selector Pipeline */}
        <div className="steps-container">
          <div className="steps-rail">
            {steps.map((step, idx) => (
              <button
                key={step.num}
                type="button"
                className={`step-card ${activeStep === idx ? 'step-active' : ''}`}
                onClick={() => setActiveStep(idx)}
              >
                <div className="step-num-badge">
                  <span className="step-num">{step.num}</span>
                  <span className="step-badge">{step.badge}</span>
                </div>
                <h3 className="step-card-title">{step.title}</h3>
                <p className="step-card-desc">{step.detail}</p>
                <div className="step-card-code">
                  <code>{step.code}</code>
                </div>
              </button>
            ))}
          </div>

          {/* Active Step Visual Terminal Display */}
          <div className="step-preview-terminal">
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <span className="terminal-title">viewgrid-workflow // step-{currentStep.num}</span>
              <span className="terminal-meta">{currentStep.meta}</span>
            </div>

            <div className="terminal-body">
              <div className="terminal-line">
                <span className="t-prompt">$</span>
                <span className="t-cmd">viewgrid --action</span>
                <span className="t-arg">"{currentStep.title}"</span>
              </div>
              <div className="terminal-box">
                <div className="box-code-line">
                  <span className="comment">// Execution snippet:</span>
                </div>
                <div className="box-code-line code-highlight">
                  {currentStep.code}
                </div>
                <div className="box-code-line text-muted">
                  {currentStep.detail}
                </div>
              </div>

              <div className="terminal-workflow-viz">
                <div className="wf-node wf-active">
                  <span className="wf-icon">01</span>
                  <span>Launch</span>
                </div>
                <div className={`wf-conn ${activeStep >= 1 ? 'conn-active' : ''}`} />
                <div className={`wf-node ${activeStep >= 1 ? 'wf-active' : ''}`}>
                  <span className="wf-icon">02</span>
                  <span>Navigate</span>
                </div>
                <div className={`wf-conn ${activeStep >= 2 ? 'conn-active' : ''}`} />
                <div className={`wf-node ${activeStep >= 2 ? 'wf-active' : ''}`}>
                  <span className="wf-icon">03</span>
                  <span>Configure</span>
                </div>
                <div className={`wf-conn ${activeStep >= 3 ? 'conn-active' : ''}`} />
                <div className={`wf-node ${activeStep >= 3 ? 'wf-active' : ''}`}>
                  <span className="wf-icon">04</span>
                  <span>Sync & Diff</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .how-section {
          padding: 88px 0;
          border-top: 1px solid var(--border-dim);
          background: rgba(10, 15, 29, 0.3);
        }
        .steps-container {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 32px;
          align-items: start;
        }
        .steps-rail {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .step-card {
          text-align: left;
          background: #090e1a;
          border: 1px solid var(--border-dim);
          border-radius: var(--radius-md);
          padding: 20px 24px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .step-card:hover {
          border-color: var(--border-bright);
          background: #0c1324;
        }
        .step-card.step-active {
          border-color: var(--accent-cyan);
          background: #0f1a33;
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.1);
        }
        .step-num-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .step-num {
          font-family: var(--font-mono);
          font-size: 16px;
          font-weight: 800;
          color: var(--accent-cyan);
        }
        .step-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          color: var(--text-dim);
          background: #111827;
          border: 1px solid var(--border-dim);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .step-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }
        .step-card-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .step-card-code {
          background: #020617;
          border: 1px solid #1e293b;
          border-radius: 4px;
          padding: 6px 10px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #7dd3fc;
          overflow-x: auto;
        }

        /* Terminal Preview */
        .step-preview-terminal {
          background: #030712;
          border: 1px solid var(--border-bright);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }
        .terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          background: #0a0f1d;
          border-bottom: 1px solid var(--border-dim);
        }
        .terminal-dots { display: flex; gap: 6px; }
        .terminal-title {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-secondary);
        }
        .terminal-meta {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent-cyan);
        }
        .terminal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: var(--font-mono);
        }
        .terminal-line {
          display: flex;
          gap: 8px;
          font-size: 13px;
          flex-wrap: wrap;
        }
        .t-prompt { color: var(--accent-cyan); font-weight: 700; }
        .t-cmd { color: #f8fafc; font-weight: 600; }
        .t-arg { color: #34d399; }
        .terminal-box {
          background: #080d1a;
          border: 1px solid var(--border-dim);
          border-radius: 6px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 12.5px;
        }
        .comment { color: var(--text-dim); }
        .code-highlight { color: #38bdf8; font-weight: 600; }
        .text-muted { color: var(--text-secondary); line-height: 1.5; }

        .terminal-workflow-viz {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid var(--border-dim);
        }
        .wf-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-dim);
          transition: all 0.2s;
        }
        .wf-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0f172a;
          border: 1px solid #1e293b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .wf-active { color: #ffffff; font-weight: 600; }
        .wf-active .wf-icon {
          background: rgba(56, 189, 248, 0.15);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
        }
        .wf-conn {
          flex: 1;
          height: 2px;
          background: #1e293b;
          margin: 0 8px;
          transition: background 0.2s;
        }
        .conn-active { background: var(--accent-cyan); }

        @media (max-width: 900px) {
          .steps-container { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
