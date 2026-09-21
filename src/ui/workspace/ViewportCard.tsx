import React, { useEffect, useRef } from 'react';
import s from './styles.module.css';
import { useStore } from './store';
import type { ViewportState } from '../../core/types';
import { ZOOM_PRESETS } from '../../core/types';
import { clampZoom, displayedSize, effectiveSize } from '../../core/workspace/layout';
import { DeviceFrame } from './DeviceFrame';
import { getTranslation } from './i18n';
import { b } from '../../platform/browser';

import { getDeviceCategoryIcon } from './utils';
import { sendAgentCmd } from './bridge';

interface Props {
  vp: ViewportState;
  index: number;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onRegister: (id: string, el: HTMLElement | null) => void;
  onShot: () => void;
  onInjected: () => void;
  onDragStartCard?: (id: string) => void;
  onDragEndCard?: () => void;
  onDragOverCard?: (idx: number, pos?: 'before' | 'after') => void;
  onDropCard?: (idx: number, pos?: 'before' | 'after') => void;
}

export function ViewportCard({
  vp,
  index,
  isDragging,
  isDropTarget,
  onRegister,
  onShot,
  onInjected,
  onDragStartCard,
  onDragEndCard,
  onDragOverCard,
  onDropCard,
}: Props) {
  const st = useStore();
  const t = getTranslation(st.language);
  const profile = st.profileOf(vp);
  const logical = effectiveSize(profile, vp.orientation);
  const display = displayedSize(logical, vp.zoom);
  const contentRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [touchPos, setTouchPos] = React.useState<{ x: number; y: number; active: boolean; visible: boolean }>({
    x: 0,
    y: 0,
    active: false,
    visible: false,
  });

  useEffect(() => {
    b.runtime?.sendMessage?.({
      type: 'vg/set-device-config',
      viewportId: vp.id,
      userAgent: profile.userAgent,
    }).catch(() => {});
  }, [vp.id, profile.userAgent]);

  useEffect(() => {
    onRegister(vp.id, contentRef.current);
    return () => onRegister(vp.id, null);
  }, [vp.id, onRegister]);

  // Sync colorScheme & touchCursor to iframe
  useEffect(() => {
    const el = iframeRef.current;
    if (!el?.contentWindow) return;
    const scheme = vp.colorScheme || 'auto';
    try {
      el.contentWindow.postMessage({ type: 'vg/agent-do', cmd: 'setColorScheme', scheme }, '*');
    } catch {}
    sendAgentCmd([vp.id], 'setColorScheme', undefined, { scheme });
  }, [vp.id, vp.colorScheme]);

  useEffect(() => {
    const el = iframeRef.current;
    if (!el?.contentWindow) return;
    const enabled = !!st.model.touchCursor && !!profile.touchSupport;
    try {
      el.contentWindow.postMessage({ type: 'vg/agent-do', cmd: 'setTouchCursor', enabled }, '*');
    } catch {}
    sendAgentCmd([vp.id], 'setTouchCursor', undefined, { enabled });
  }, [vp.id, st.model.touchCursor, profile.touchSupport]);

  // agents are injected per frame load; re-announce after navigation
  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    const onLoad = () => {
      onInjected();
      try {
        el.contentWindow?.postMessage({ type: 'vg/agent-do', cmd: 'setColorScheme', scheme: vp.colorScheme || 'auto' }, '*');
        el.contentWindow?.postMessage({
          type: 'vg/agent-do',
          cmd: 'setTouchCursor',
          enabled: !!st.model.touchCursor && !!profile.touchSupport,
        }, '*');
      } catch {}
    };
    el.addEventListener('load', onLoad);
    return () => el.removeEventListener('load', onLoad);
  }, [onInjected, vp.colorScheme, st.model.touchCursor, profile.touchSupport]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!st.model.touchCursor || !profile.touchSupport) return;
    const rect = contentRef.current?.getBoundingClientRect();
    if (rect) {
      setTouchPos((p) => ({
        ...p,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: true,
      }));
    }
  };

  return (
    <div
      data-viewport-id={vp.id}
      className={`${s.card} ${st.focusedId === vp.id ? s.cardFocused : ''} ${isDragging ? s.cardDragging : ''} ${isDropTarget ? s.cardDropTarget : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = e.currentTarget.getBoundingClientRect();
        const isAfter = e.clientX - rect.left > rect.width / 2;
        onDragOverCard?.(index, isAfter ? 'after' : 'before');
      }}
      onDrop={(e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const isAfter = e.clientX - rect.left > rect.width / 2;
        onDropCard?.(index, isAfter ? 'after' : 'before');
      }}
      onMouseDown={() => st.focus(vp.id)}
    >
      {isDropTarget && (
        <div className={s.dropTargetBadge}>
          <span>⇄</span>
          <span>Bunun Yerine Koy</span>
        </div>
      )}
      <div
        className={s.cardHeader}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/viewgrid-card-id', vp.id);
          e.dataTransfer.setData('text/plain', vp.id);
          e.dataTransfer.effectAllowed = 'move';
          onDragStartCard?.(vp.id);
        }}
        onDragEnd={() => {
          onDragEndCard?.();
        }}
      >
        <span className={s.deviceIcon} style={{ cursor: 'grab' }} title="Sürükleyip sıralayın">⠿ {getDeviceCategoryIcon(profile.category)}</span>
        <strong>{profile.name}</strong>
        <span className={s.dim}>
          {logical.width}×{logical.height}
        </span>
        <span className={s.dprChip}>{profile.devicePixelRatio}x</span>
        <div
          className={s.cardActions}
          onMouseDown={(e) => e.stopPropagation()}
          draggable={false}
        >
          <select
            className={s.iconBtn}
            value={vp.zoom}
            onChange={(e) => st.setZoom(vp.id, Number(e.target.value))}
            title={t.zoomPresets}
          >
            {[...ZOOM_PRESETS, vp.zoom].filter((z, i, a) => a.indexOf(z) === i).sort((a, b) => a - b).map((z) => (
              <option key={z} value={z}>{Math.round(z * 100)}%</option>
            ))}
          </select>

          {/* Color Scheme Override (Auto / Dark / Light) */}
          <button
            className={s.iconBtn}
            title={
              vp.colorScheme === 'dark'
                ? t.colorSchemeDark
                : vp.colorScheme === 'light'
                ? t.colorSchemeLight
                : t.colorSchemeAuto
            }
            onClick={() => {
              const next = vp.colorScheme === 'dark' ? 'light' : vp.colorScheme === 'light' ? 'auto' : 'dark';
              st.setColorScheme(vp.id, next);
              try {
                iframeRef.current?.contentWindow?.postMessage({ type: 'vg/agent-do', cmd: 'setColorScheme', scheme: next }, '*');
              } catch {}
              sendAgentCmd([vp.id], 'setColorScheme', undefined, { scheme: next });
            }}
            style={{ cursor: 'pointer' }}
          >
            {vp.colorScheme === 'dark' ? '🌙' : vp.colorScheme === 'light' ? '☀️' : '🌗'}
          </button>

          {/* Hardware Finish Selector for iPhone 15 & MacBook */}
          {(profile.id.includes('iphone-15') || profile.category === 'laptop') && (
            <select
              className={s.iconBtn}
              value={vp.frameFinish || 'default'}
              onChange={(e) => st.setFrameFinish(vp.id, e.target.value)}
              title={t.finish}
              style={{ fontSize: 10, padding: '2px 4px' }}
            >
              {profile.id.includes('iphone-15') ? (
                <>
                  <option value="natural">Titanium</option>
                  <option value="black">Black</option>
                  <option value="white">Silver</option>
                </>
              ) : (
                <>
                  <option value="space-gray">Space Gray</option>
                  <option value="silver">Silver</option>
                  <option value="midnight">Midnight</option>
                </>
              )}
            </select>
          )}

          <button className={s.iconBtn} title={t.orientation} onClick={() => st.toggleOrientation(vp.id)}>⟳</button>
          <button className={s.iconBtn} title={t.shotOne} onClick={onShot}>📷</button>
          <button className={s.iconBtn} title={t.duplicate} onClick={() => st.duplicate(vp.id)}>⧉</button>
          <button className={s.iconBtn} title={vp.minimized ? t.restore : t.minimize} onClick={() => st.toggleMinimized(vp.id)}>
            {vp.minimized ? '▢' : '—'}
          </button>
          <button className={s.iconBtn} title={t.hide} onClick={() => st.toggleHidden(vp.id)}>👁</button>
          <button className={s.iconBtn} title={t.remove} onClick={() => st.removeViewport(vp.id)}>✕</button>
        </div>
      </div>

      {vp.minimized ? (
        <div className={s.minimizedBody}>{profile.name} {t.minimized}</div>
      ) : (
        <div className={s.deviceFrameWrapper}>
          <DeviceFrame
            profile={profile}
            orientation={vp.orientation}
            zoom={vp.zoom}
            enabled={st.model.frames}
            finish={vp.frameFinish}
          >
            <div
              ref={contentRef}
              className={`${s.content} ${st.model.touchCursor && profile.touchSupport ? s.touchCursorArea : ''}`}
              style={{ width: display.width, height: display.height, position: 'relative' }}
              onPointerMove={handlePointerMove}
              onPointerDown={() => setTouchPos((p) => ({ ...p, active: true }))}
              onPointerUp={() => setTouchPos((p) => ({ ...p, active: false }))}
              onPointerLeave={() => setTouchPos((p) => ({ ...p, visible: false, active: false }))}
            >
              <iframe
                ref={iframeRef}
                key={vp.id}
                className={s.iframe}
                tabIndex={-1}
                name={`viewgrid:${vp.id}`}
                src={vp.url || 'about:blank'}
                style={{ width: logical.width, height: logical.height, transform: `scale(${clampZoom(vp.zoom)})` }}
                title={`${profile.name} viewport`}
                onLoad={onInjected}
              />
              {st.model.touchCursor && profile.touchSupport && touchPos.visible && (
                <div
                  className={`${s.touchDot} ${touchPos.active ? s.touchDotActive : ''}`}
                  style={{ left: touchPos.x, top: touchPos.y }}
                />
              )}
            </div>
          </DeviceFrame>
        </div>
      )}
    </div>
  );
}
