import React, { useEffect, useRef } from 'react';
import s from './styles.module.css';
import { useStore } from './store';
import type { ViewportState } from '../../core/types';
import { ZOOM_PRESETS } from '../../core/types';
import { clampZoom, displayedSize, effectiveSize } from '../../core/workspace/layout';

interface Props {
  vp: ViewportState;
  index: number;
  onRegister: (id: string, el: HTMLElement | null) => void;
  onShot: () => void;
  onInjected: () => void;
}

export function ViewportCard({ vp, index, onRegister, onShot, onInjected }: Props) {
  const st = useStore();
  const profile = st.profileOf(vp);
  const logical = effectiveSize(profile, vp.orientation);
  const display = displayedSize(logical, vp.zoom);
  const contentRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    onRegister(vp.id, contentRef.current);
    return () => onRegister(vp.id, null);
  }, [vp.id, onRegister]);

  // agents are injected per frame load; re-announce after navigation
  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    const onLoad = () => onInjected();
    el.addEventListener('load', onLoad);
    return () => el.removeEventListener('load', onLoad);
  }, [onInjected]);

  return (
    <div
      className={`${s.card} ${st.focusedId === vp.id ? s.cardFocused : ''}`}
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData('text/plain'));
        if (!Number.isNaN(from)) st.reorder(from, index);
      }}
      onMouseDown={() => st.focus(vp.id)}
    >
      <div className={s.cardHeader}>
        <strong>{profile.name}</strong>
        <span className={s.dim}>
          {logical.width}×{logical.height} · {vp.orientation[0]!.toUpperCase()}
        </span>
        <div className={s.cardActions}>
          <select
            className={s.iconBtn}
            value={vp.zoom}
            onChange={(e) => st.setZoom(vp.id, Number(e.target.value))}
            title="Viewport zoom"
          >
            {[...ZOOM_PRESETS, vp.zoom].filter((z, i, a) => a.indexOf(z) === i).sort((a, b) => a - b).map((z) => (
              <option key={z} value={z}>{Math.round(z * 100)}%</option>
            ))}
          </select>
          <button className={s.iconBtn} title="Orientation (O)" onClick={() => st.toggleOrientation(vp.id)}>⟳</button>
          <button className={s.iconBtn} title="Screenshot (C)" onClick={onShot}>📷</button>
          <button className={s.iconBtn} title="Duplicate" onClick={() => st.duplicate(vp.id)}>⧉</button>
          <button className={s.iconBtn} title={vp.minimized ? 'Restore' : 'Minimize'} onClick={() => st.toggleMinimized(vp.id)}>
            {vp.minimized ? '▢' : '—'}
          </button>
          <button className={s.iconBtn} title="Hide" onClick={() => st.toggleHidden(vp.id)}>👁</button>
          <button className={s.iconBtn} title="Remove" onClick={() => st.removeViewport(vp.id)}>✕</button>
        </div>
      </div>

      {vp.minimized ? (
        <div className={s.minimizedBody}>{profile.name} minimized</div>
      ) : (
        <div
          ref={contentRef}
          className={s.content}
          style={{ width: display.width, height: display.height }}
        >
          <iframe
            ref={iframeRef}
            key={vp.id}
            className={s.iframe}
            name={`viewgrid:${vp.id}`}
            src={vp.url || 'about:blank'}
            style={{ width: logical.width, height: logical.height, transform: `scale(${clampZoom(vp.zoom)})` }}
            title={`${profile.name} viewport`}
            onLoad={onInjected}
          />
          {!st.granted && (
            <div className={s.frameHint}>
              <div>Site access limited</div>
              <div style={{ fontSize: 11, maxWidth: 260 }}>
                XFO/CSP-protected sites need the framing grant (☰ → Enable site access).
              </div>
              <button className="primary" onClick={() => void st.showToast('Use ☰ → “Enable site access”')}>
                How to enable
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
