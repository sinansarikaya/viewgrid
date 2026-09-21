import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../global.css';
import { b } from '../../platform/browser';

function Popup() {
  const [url, setUrl] = useState('');
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    void b.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const u = tabs[0]?.url ?? '';
      if (u && !u.startsWith('about:') && !u.startsWith('moz-extension:')) setUrl(u);
    });
    void b.permissions.contains({ origins: ['*://*/*'] }).then(setGranted).catch(() => {});
  }, []);

  const open = () => {
    const target = b.runtime.getURL('workspace.html') + (url ? `?url=${encodeURIComponent(url)}` : '');
    void b.tabs.create({ url: target, active: true });
    window.close();
  };

  return (
    <div>
      <h1>ViewGrid</h1>
      <div className="hint">Multi-viewport responsive testing workspace</div>
      <div className="row">
        <input
          value={url}
          placeholder="https://example.com or localhost:5173"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && open()}
        />
      </div>
      <div className="row">
        <button onClick={open}>Open workspace</button>
        <button
          className="ghost"
          onClick={async () => {
            const ok = await b.permissions.request({ origins: ['*://*/*'] });
            setGranted(ok);
          }}
        >
          {granted ? 'Access: granted ✓' : 'Enable site access'}
        </button>
      </div>
      <div className="status">
        {granted
          ? 'Framing, sync and screenshots enabled.'
          : 'Limited mode: grant site access for XFO/CSP framing + sync.'}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
