import React, { useCallback, useEffect, useRef, useState } from 'react';
import s from './styles.module.css';
import { useStore } from './store';
import { ViewportCard } from './ViewportCard';
import { DevicePicker } from './DevicePicker';
import { IssuesDrawer } from './IssuesDrawer';
import {
  captureFileName,
  cropToBlob,
  downloadBlob,
  fullCaptureBlob,
  grantHostAccess,
  injectAgents,
  rectOf,
  requestScan,
  requestCapture,
  sendAgentCmd,
} from './bridge';
import { LoopGuard } from '../../core/sync/protocol';
import { effectiveSize, gridColumns } from '../../core/workspace/layout';
import type { LayoutMode } from '../../core/types';
import { ZOOM_PRESETS } from '../../core/types';

export function App({ hub }: { hub: LoopGuard }) {
  const st = useStore();
  const contentRefs = useRef(new Map<string, HTMLElement>());
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  const registerContent = useCallback((id: string, el: HTMLElement | null) => {
    if (el) contentRefs.current.set(id, el);
    else contentRefs.current.delete(id);
  }, []);

  const doScan = useCallback(() => {
    useStore.getState().clearIssues();
    useStore.getState().setScanning(true);
    useStore.getState().setDrawerOpen(true);
    void requestScan();
    window.setTimeout(() => useStore.getState().setScanning(false), 2500);
  }, []);

  const shotOne = useCallback(async (viewportId: string) => {
    const s = useStore.getState();
    const v = s.model.viewports.find((x) => x.id === viewportId);
    const el = contentRefs.current.get(viewportId);
    if (!v || !el) return;
    try {
      const dataUrl = await requestCapture('png');
      const p = s.profileOf(v);
      const { width, height } = effectiveSize(p, v.orientation);
      const blob = await cropToBlob(dataUrl, rectOf(el), 'png');
      downloadBlob(blob, captureFileName({ device: p.name, w: width, h: height, ext: 'png' }));
      s.showToast('Screenshot saved');
    } catch (e) {
      s.showToast(`Screenshot failed: ${(e as Error).message}`);
    }
  }, []);

  const shotAll = useCallback(async () => {
    const s = useStore.getState();
    try {
      const dataUrl = await requestCapture('png');
      let n = 0;
      for (const v of s.visibleViewports()) {
        const el = contentRefs.current.get(v.id);
        if (!el) continue;
        const p = s.profileOf(v);
        const { width, height } = effectiveSize(p, v.orientation);
        try {
          const blob = await cropToBlob(dataUrl, rectOf(el), 'png');
          downloadBlob(blob, captureFileName({ device: p.name, w: width, h: height, ext: 'png', ts: Date.now() + n }));
          n++;
        } catch {
          /* offscreen viewport skipped */
        }
      }
      s.showToast(`${n} screenshot(s) saved`);
    } catch (e) {
      s.showToast(`Capture failed: ${(e as Error).message}`);
    }
  }, []);

  const shotWorkspace = useCallback(async () => {
    try {
      const blob = await fullCaptureBlob('png');
      downloadBlob(blob, captureFileName({ device: 'workspace', w: window.innerWidth, h: window.innerHeight, ext: 'png' }));
      useStore.getState().showToast('Workspace screenshot saved');
    } catch (e) {
      useStore.getState().showToast(`Capture failed: ${(e as Error).message}`);
    }
  }, []);

  // —— keyboard map (docs/UX.md §6 MVP subset) ——
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const s = useStore.getState();
      const key = e.key.toLowerCase();
      if (e.key === 'Escape') {
        s.setPickerOpen(false);
        s.setDrawerOpen(false);
        setMenuOpen(false);
        return;
      }
      if (key === 'a') { e.preventDefault(); s.setPickerOpen(true); }
      else if (key === 'c' && !e.shiftKey) { e.preventDefault(); if (s.focusedId) void shotOne(s.focusedId); }
      else if (key === 'c' && e.shiftKey) { e.preventDefault(); void shotAll(); }
      else if (key === 's') { e.preventDefault(); s.setAllSync(!s.model.sync.scroll); }
      else if (key === 'g') { e.preventDefault(); s.setLayout(s.model.layout === 'grid' ? 'row' : s.model.layout === 'row' ? 'col' : 'grid'); }
      else if (key === 'f') { e.preventDefault(); s.toggleFocusMode(); }
      else if (key === 'o' && s.focusedId) { e.preventDefault(); s.toggleOrientation(s.focusedId); }
      else if (e.shiftKey && key === 'r') { e.preventDefault(); sendAgentCmd('all', 'reload'); }
      else if (key === 'i') { e.preventDefault(); doScan(); }
      else if (/^[1-9]$/.test(key)) {
        const v = s.visibleViewports()[Number(key) - 1];
        if (v) s.focus(v.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shotOne, shotAll, doScan]);

  const visible = st.visibleViewports();
  const cols = gridColumns(visible.length, st.model.layout);
  const canvasClass =
    st.model.layout === 'grid' ? s.canvasGrid : st.model.layout === 'row' ? s.canvasRow : s.canvasCol;
  const layoutStyle =
    st.model.layout === 'grid'
      ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
      : undefined;

  return (
    <div className={s.app}>
      <div className={s.toolbar}>
        <span className={s.brand}>ViewGrid</span>
        <button className={s.iconBtn} title="Back (all)" onClick={() => sendAgentCmd('all', 'back')}>←</button>
        <button className={s.iconBtn} title="Forward (all)" onClick={() => sendAgentCmd('all', 'forward')}>→</button>
        <button className={s.iconBtn} title="Reload all (Shift+R)" onClick={() => sendAgentCmd('all', 'reload')}>⟳</button>
        <div className={s.url}>
          <input
            placeholder="https://example.com  ·  localhost:5173"
            value={st.urlDraft}
            onChange={(e) => st.setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                st.applyUrl(st.urlDraft);
                void injectAgents();
              }
            }}
          />
          <button className="primary" onClick={() => { st.applyUrl(st.urlDraft); void injectAgents(); }}>Go</button>
        </div>
        <div className={s.sep} />
        <button onClick={() => st.setPickerOpen(true)} title="Add viewport (A)">＋ Add</button>
        <select
          value=""
          onChange={(e) => { if (e.target.value) st.addPreset(e.target.value); e.target.value = ''; }}
          title="Test presets"
        >
          <option value="">☰ Presets</option>
          {['Mobile Test', 'Standard Responsive', 'iOS + Android', 'Tablet Check', 'Full House'].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={st.model.layout} onChange={(e) => st.setLayout(e.target.value as LayoutMode)} title="Layout">
          <option value="grid">Grid</option>
          <option value="row">Row</option>
          <option value="col">Column</option>
        </select>
        <div className={s.sep} />
        <details style={{ position: 'relative' }}>
          <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6 }}>
            Sync {st.model.sync.scroll ? '●' : '○'}
          </summary>
          <div className={s.menu} style={{ top: 32 }}>
            {(Object.keys(st.model.sync) as (keyof typeof st.model.sync)[]).map((k) => (
              <label key={k} className={s.menuRow}>
                <span>Sync {k}</span>
                <input
                  type="checkbox"
                  checked={st.model.sync[k]}
                  onChange={(e) => st.setSync(k, e.target.checked)}
                />
              </label>
            ))}
          </div>
        </details>
        <div className={s.sep} />
        <button onClick={doScan} title="Scan responsive issues (I)">
          🔍 {st.issues.length > 0 ? <span className={s.badge + ' ' + s.warn}>{st.issues.length}</span> : 'Issues'}
        </button>
        <button onClick={() => st.setDrawerOpen(!st.drawerOpen)}>Panel</button>
        <button onClick={() => void shotAll()} title="Screenshot all (Shift+C)">📷</button>
        <button onClick={() => void shotWorkspace()} title="Workspace screenshot">▦</button>
        <button onClick={() => st.toggleFocusMode()} title="Focus mode (F)">⛶</button>
        <button onClick={st.toggleFrames} title="Toggle frame hint guides">{st.model.frames ? '▣' : '▢'}</button>
        <button onClick={st.toggleTheme} title="Theme">{st.model.theme === 'dark' ? '☀' : '◐'}</button>
        <button onClick={() => setMenuOpen(!menuOpen)} title="Workspace menu">☰</button>

        {menuOpen && (
          <div className={s.menu}>
            <div className={s.menuRow}>
              <input
                className={s.url}
                style={{ flex: 1 }}
                placeholder="Workspace name"
                value={saveName || st.model.name}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <button onClick={() => { st.saveAs(saveName || st.model.name); setSaveName(''); setMenuOpen(false); }}>Save</button>
            </div>
            {Object.keys(st.savedWorkspaces).map((n) => (
              <div key={n} className={s.menuRow}>
                <span>{n}</span>
                <span>
                  <button className={s.iconBtn} onClick={() => { st.loadSaved(n); setMenuOpen(false); }}>Load</button>
                  <button className={s.iconBtn} onClick={() => st.deleteSaved(n)}>✕</button>
                </span>
              </div>
            ))}
            {!st.granted && (
              <button
                className="primary"
                onClick={async () => {
                  const ok = await grantHostAccess();
                  st.setGranted(ok);
                  if (ok) { st.showToast('Site access granted — framing & sync enabled'); void injectAgents(); }
                  else st.showToast('Permission denied — framing & sync stay off');
                }}
              >
                Enable site access (framing + sync)
              </button>
            )}
          </div>
        )}
      </div>

      <div className={s.canvas}>
        {visible.length === 0 ? (
          <div className={s.empty}>
            <div>No viewports yet.</div>
            <button className="primary" onClick={() => st.setPickerOpen(true)}>＋ Add device (A)</button>
            <div style={{ fontSize: 12 }}>Tested pages are framed in place — grant site access from ☰ for XFO/CSP-protected sites.</div>
          </div>
        ) : (
          <div className={canvasClass} style={layoutStyle}>
            {visible.map((v, idx) => (
              <ViewportCard
                key={v.id}
                vp={v}
                index={idx}
                onRegister={registerContent}
                onShot={() => void shotOne(v.id)}
                onInjected={() => void injectAgents()}
              />
            ))}
          </div>
        )}
      </div>

      <div className={s.statusBar}>
        <span>{visible.length} viewports</span>
        <span>layout: {st.model.layout}</span>
        <span>zoom presets: {ZOOM_PRESETS.map((z) => `${z * 100}%`).join(' / ')}</span>
        <span>issues: {st.issues.length}</span>
        <span>{st.granted ? 'site access: granted' : 'site access: limited'}</span>
        <span>local-only ●</span>
      </div>

      {st.pickerOpen && <DevicePicker />}
      {st.drawerOpen && <IssuesDrawer />}
      {st.toast && <div className={s.toast}>{st.toast}</div>}
    </div>
  );
}
