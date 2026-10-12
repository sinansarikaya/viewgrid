import React, { useEffect, useRef } from 'react';
import { Icon } from '../common/Icon';
import { Tooltip } from '../common/Tooltip';
import s from './styles.module.css';
import { useStore } from './store';
import type { ViewportState } from '../../core/types';
import { ZOOM_PRESETS } from '../../core/types';
import { clampZoom, displayedSize, effectiveSize } from '../../core/workspace/layout';
import { DeviceFrame } from './DeviceFrame';
import { getTranslation } from './i18n';

import { getDeviceCategoryIconName } from './utils';
import { preparePreview, sendAgentCmd } from './bridge';
import { Button } from '../common/Button';
import { useGeometryClass } from '../common/useGeometryClass';
import cardStyles from './ViewportCard.module.css';

interface Props {
  vp: ViewportState;
  index: number;
  isDragging?: boolean;
  isDropTarget?: boolean;
  isFreeLayout?: boolean;
  onRegister: (id: string, el: HTMLElement | null) => void;
  onShot: () => void;
  onInjected: () => void;
  onDragStartCard?: (id: string) => void;
  onDragEndCard?: () => void;
  onDragOverCard?: (idx: number, pos?: 'before' | 'after') => void;
  onDropCard?: (idx: number, pos?: 'before' | 'after') => void;
  onFreeDrag?: (id: string, e: React.MouseEvent<HTMLDivElement>) => void;
}

export function ViewportCard({
  vp,
  index,
  isDragging,
  isDropTarget,
  isFreeLayout,
  onRegister,
  onShot,
  onInjected,
  onDragStartCard,
  onDragEndCard,
  onDragOverCard,
  onDropCard,
  onFreeDrag,
}: Props) {
  const st = useStore();
  const t = getTranslation(st.language);
  const cardText = {
    tr: { reorder: 'Sürükleyip sıralayın', settings: 'Cihaz ayarları' },
    en: { reorder: 'Drag to reorder', settings: 'Device settings' },
    no: { reorder: 'Dra for å endre rekkefølge', settings: 'Enhetsinnstillinger' },
  }[st.language];
  const profile = st.profileOf(vp);
  const logical = effectiveSize(profile, vp.orientation);
  const fitted = st.fitZooms[vp.id] !== undefined;
  const display = displayedSize(logical, vp.zoom, fitted);
  const contentRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [attempt, setAttempt] = React.useState(0);
  const [preview, setPreview] = React.useState<{ url: string; generation: number; ready: boolean; error?: string }>({ url: '', generation: -1, ready: false });
  const previewReady = preview.ready && preview.url === vp.url && preview.generation === st.previewGeneration;
  useEffect(() => {
    let canceled = false;
    const current = { url: vp.url, generation: st.previewGeneration };
    setPreview({ ...current, ready: false });
    if (!vp.url) { setPreview({ ...current, ready: true }); return; }
    void preparePreview(vp.url).then(() => {
      if (!canceled) setPreview({ ...current, ready: true });
    }).catch((error: Error) => {
      if (!canceled) setPreview({ ...current, ready: false, error: error.message });
    });
    return () => { canceled = true; };
  }, [vp.url, st.previewGeneration, attempt]);

  const [touchPos, setTouchPos] = React.useState<{ x: number; y: number; active: boolean; visible: boolean }>({
    x: 0,
    y: 0,
    active: false,
    visible: false,
  });

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
  }, [vp.id, vp.url, vp.colorScheme]);

  useEffect(() => {
    const el = iframeRef.current;
    if (!el?.contentWindow) return;
    const enabled = !!st.model.touchCursor && !!profile.touchSupport;
    try {
      el.contentWindow.postMessage({ type: 'vg/agent-do', cmd: 'setTouchCursor', enabled }, '*');
    } catch {}
    sendAgentCmd([vp.id], 'setTouchCursor', undefined, { enabled });
  }, [vp.id, vp.url, st.model.touchCursor, profile.touchSupport]);

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
  }, [onInjected, vp.url, previewReady, st.previewGeneration, vp.colorScheme, st.model.touchCursor, profile.touchSupport]);

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
  const geometryClass = useGeometryClass({
    '--vg-display-width': display.width, '--vg-display-height': display.height,
    '--vg-logical-width': logical.width, '--vg-logical-height': logical.height,
    '--vg-scale': fitted ? vp.zoom : clampZoom(vp.zoom), '--vg-touch-x': touchPos.x, '--vg-touch-y': touchPos.y,
  });

  return (
    <div
      data-viewport-id={vp.id}
      className={`${s.card} ${geometryClass} ${st.focusedId === vp.id ? s.cardFocused : ''} ${isDragging ? s.cardDragging : ''} ${isDropTarget ? s.cardDropTarget : ''}`}
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
        className={`${s.cardHeader} ${cardStyles.header}`}
        draggable={!isFreeLayout}
        onMouseDown={(e) => {
          if (isFreeLayout && onFreeDrag) {
            e.preventDefault();
            e.stopPropagation();
            onFreeDrag(vp.id, e);
          }
        }}
        onDragStart={(e) => {
          if (isFreeLayout) return;
          e.dataTransfer.setData('text/viewgrid-card-id', vp.id);
          e.dataTransfer.setData('text/plain', vp.id);
          e.dataTransfer.effectAllowed = 'move';
          onDragStartCard?.(vp.id);
        }}
        onDragEnd={() => {
          if (isFreeLayout) return;
          onDragEndCard?.();
        }}
      >
        <span className={`${s.deviceIcon} ${cardStyles.drag}`} title={cardText.reorder}><Icon name="grip" /> <Icon name={getDeviceCategoryIconName(profile.category)} /></span>
        <strong>{profile.name}</strong>
        <span className={s.dim}>
          {logical.width}×{logical.height}
        </span>
        <div
          className={s.cardActions}
          onMouseDown={(e) => e.stopPropagation()}
          draggable={false}
        >
          <Button className={s.iconBtn} title={t.shotOne} aria-label={t.shotOne} onClick={onShot}><Icon name="camera" /></Button>
          <details className={cardStyles.menu}>
            <Tooltip content={cardText.settings}><summary aria-label={profile.name + ' ' + cardText.settings} title={cardText.settings}><Icon name="moreHorizontal" /></summary></Tooltip>
            <div className={cardStyles.menuBody}>
          <span className={s.dprChip} title={st.language === 'tr' ? 'DPR: cihaz bilgisi, gerçek cihaz emülasyonu değildir' : st.language === 'no' ? 'DPR: enhetsmetadata, ikke ekte enhetsemulering' : 'DPR: device metadata, not real device emulation'}>DPR {profile.devicePixelRatio}x</span>
          <label>{st.language === 'tr' ? 'Gösterim zoom’u' : st.language === 'no' ? 'Visningszoom' : 'Display zoom'}{fitted ? ' (Fit)' : ''}
          <select
            className={s.iconBtn}
            value={vp.zoom}
            onChange={(e) => st.setZoom(vp.id, Number(e.target.value))}
            title={t.zoomPresets}
            aria-label={st.language === 'tr' ? 'Gösterim zoom’u (CSS ölçüsü değişmez)' : st.language === 'no' ? 'Visningszoom (CSS-størrelse uendret)' : 'Display zoom (CSS size unchanged)'}
          >
            {[...ZOOM_PRESETS, vp.zoom].filter((z, i, a) => a.indexOf(z) === i).sort((a, b) => a - b).map((z) => (
              <option key={z} value={z} disabled={fitted && !ZOOM_PRESETS.includes(z)}>{fitted && !ZOOM_PRESETS.includes(z) ? 'Fit ' : ''}{Math.round(z * 100)}%</option>
            ))}
          </select>
          </label>

          <Button title={t.orientation} aria-label={t.orientation} onClick={() => st.toggleOrientation(vp.id)}><Icon name="orientation" /> {t.orientation}</Button>
          <Button onClick={() => void sendAgentCmd([vp.id], 'reload')} title={st.language === 'tr' ? 'Bu görünümü yenile' : st.language === 'no' ? 'Last denne visningen på nytt' : 'Reload this viewport'}>{st.language === 'tr' ? 'Görünümü yenile' : st.language === 'no' ? 'Last visningen på nytt' : 'Reload viewport'}</Button>
          <Button
            className={s.iconBtn}
            aria-label={vp.colorScheme === 'dark' ? t.colorSchemeDark : vp.colorScheme === 'light' ? t.colorSchemeLight : t.colorSchemeAuto}
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
          >
            <Icon name={vp.colorScheme === "dark" ? "moon" : vp.colorScheme === "light" ? "sun" : "halfMoon"} />
          </Button>

          {/* Hardware Finish Selector for iPhone 15 & MacBook */}
          {(profile.id.includes('iphone-15') || profile.category === 'laptop') && (
            <select
              className={`${s.iconBtn} ${cardStyles.finish}`}
              value={vp.frameFinish || 'default'}
              onChange={(e) => st.setFrameFinish(vp.id, e.target.value)}
              title={t.finish}
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

          <Button className={s.iconBtn} title={t.duplicate} onClick={() => st.duplicate(vp.id)}><Icon name="copy" /> {t.duplicate}</Button>
          <Button className={s.iconBtn} title={vp.minimized ? t.restore : t.minimize} onClick={() => st.toggleMinimized(vp.id)}>
            <Icon name={vp.minimized ? "square" : "minus"} /> {vp.minimized ? t.restore : t.minimize}
          </Button>
          <Button className={s.iconBtn} title={t.hide} onClick={() => st.toggleHidden(vp.id)}><Icon name="eye" /> {t.hide}</Button>
          <Button className={s.iconBtn} title={t.remove} onClick={() => st.removeViewport(vp.id)}><Icon name="close" /> {t.remove}</Button>
            </div>
          </details>
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
              className={`${s.content} ${cardStyles.content} ${st.model.touchCursor && profile.touchSupport ? s.touchCursorArea : ''}`}
              onPointerMove={handlePointerMove}
              onPointerDown={() => setTouchPos((p) => ({ ...p, active: true }))}
              onPointerUp={() => setTouchPos((p) => ({ ...p, active: false }))}
              onPointerLeave={() => setTouchPos((p) => ({ ...p, visible: false, active: false }))}
            >
              <iframe
                ref={iframeRef}
                key={`${vp.id}:${vp.url}:${st.previewGeneration}:${attempt}:${previewReady}`}
                className={`${s.iframe} ${cardStyles.preview}`}
                tabIndex={-1}
                name={`viewgrid:${vp.id}`}
                src={previewReady ? vp.url || 'about:blank' : 'about:blank'}
                title={`${profile.name} viewport`}
                onLoad={onInjected}
              />
              {!previewReady && <div role={preview.error ? 'alert' : 'status'} className={cardStyles.loading}>
                <p>{preview.error || (st.language === 'tr' ? 'Önizleme hazırlanıyor…' : 'Preparing preview…')}</p>
                {preview.error && <Button onClick={() => setAttempt(value => value + 1)}>{st.language === 'tr' ? 'Tekrar dene' : 'Retry'}</Button>}
              </div>}
              {st.model.touchCursor && profile.touchSupport && touchPos.visible && (
                <div
                  className={`${s.touchDot} ${cardStyles.touch} ${touchPos.active ? s.touchDotActive : ''}`}
                />
              )}
            </div>
          </DeviceFrame>
        </div>
      )}
    </div>
  );
}
