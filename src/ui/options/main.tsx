import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../global.css';
import { b } from '../../platform/browser';

function Options() {
  const [msg, setMsg] = useState('');

  const section: React.CSSProperties = {
    maxWidth: 640,
    margin: '24px auto',
    padding: 16,
    background: 'var(--panel)',
    border: '1px solid var(--border)',
    borderRadius: 8,
  };

  return (
    <div>
      <div style={section}>
        <h1 style={{ fontSize: 16 }}>ViewGrid — Settings</h1>
        <p style={{ color: 'var(--text-dim)' }}>
          Local-first: no analytics, no tracking, no external requests. Data lives in
          extension storage + IndexedDB on this machine only. See docs/PRIVACY.md.
        </p>
      </div>
      <div style={section}>
        <h2 style={{ fontSize: 14 }}>Keyboard shortcuts (workspace)</h2>
        <ul style={{ lineHeight: 1.9, fontFamily: 'var(--mono)', fontSize: 12 }}>
          <li>A — add viewport · C — screenshot focused · Shift+C — all</li>
          <li>S — toggle sync · G — cycle layout · F — focus mode · O — rotate</li>
          <li>I — issue scan · Shift+R — reload all · 1–9 — focus viewport · Esc — close</li>
          <li>Global: Alt+Shift+V — open workspace (rebind in about:addons)</li>
        </ul>
      </div>
      <div style={section}>
        <h2 style={{ fontSize: 14 }}>Data</h2>
        <button
          onClick={async () => {
            try {
              await b.storage?.local.remove(['viewgrid.store.v1']);
              setMsg('Local data cleared (reload workspace to reseed).');
            } catch {
              setMsg('Clear failed.');
            }
          }}
        >
          Clear all local data
        </button>
        <div style={{ color: 'var(--text-dim)', marginTop: 8 }}>{msg}</div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Options />);
