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
import { effectiveSize } from '../../core/workspace/layout';
import { b } from '../../platform/browser';
import type { LayoutMode } from '../../core/types';
import { ZOOM_PRESETS } from '../../core/types';
import { getTranslation, type Language } from './i18n';
import { Toast } from './Toast';
import { SettingsModal } from './SettingsModal';
import { BenchmarkModal } from './BenchmarkModal';
import { workspaceHello } from './bridge';

function matchesShortcut(e: KeyboardEvent, comboStr?: string): boolean {
  if (!comboStr) return false;
  const parts = comboStr.split('+').map((p) => p.trim().toLowerCase());
  const needsCtrl = parts.includes('ctrl');
  const needsAlt = parts.includes('alt');
  const needsShift = parts.includes('shift');
  const needsMeta = parts.includes('cmd') || parts.includes('command') || parts.includes('⌘');

  if (e.ctrlKey !== needsCtrl) return false;
  if (e.altKey !== needsAlt) return false;
  if (e.shiftKey !== needsShift) return false;
  if (e.metaKey !== needsMeta) return false;

  const mainKey = parts.find((p) => !['ctrl', 'alt', 'shift', 'cmd', 'command', '⌘'].includes(p));
  if (!mainKey) return false;
  return e.key.toLowerCase() === mainKey;
}
import { CompareModal } from './CompareModal';

export function App({ hub: _hub }: { hub: LoopGuard }) {
  const st = useStore();
  const t = getTranslation(st.language);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef(new Map<string, HTMLElement>());
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Enforce initial scroll to top on launch (prevents browser/iframe from yanking down)
  const userInteracted = useRef(false);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect actual user intent to scroll
    const onUserGesture = () => {
      userInteracted.current = true;
    };

    canvas.addEventListener('wheel', onUserGesture, { passive: true });
    canvas.addEventListener('pointerdown', onUserGesture, { passive: true });
    canvas.addEventListener('touchstart', onUserGesture, { passive: true });
    canvas.addEventListener('keydown', onUserGesture, { passive: true });

    // If an iframe hash navigation or focus tries to scroll the canvas before user touches it, clamp back to top
    const onScroll = () => {
      if (!userInteracted.current) {
        canvas.scrollTop = 0;
        canvas.scrollLeft = 0;
      }
    };

    canvas.addEventListener('scroll', onScroll, { passive: false });

    // Also enforce initial 0 at milestones while iframes load
    const timers = [0, 50, 150, 300, 600, 1000, 1500, 2500].map((ms) =>
      window.setTimeout(() => {
        if (!userInteracted.current && canvas) {
          canvas.scrollTop = 0;
          canvas.scrollLeft = 0;
        }
      }, ms)
    );

    return () => {
      canvas.removeEventListener('wheel', onUserGesture);
      canvas.removeEventListener('pointerdown', onUserGesture);
      canvas.removeEventListener('touchstart', onUserGesture);
      canvas.removeEventListener('keydown', onUserGesture);
      canvas.removeEventListener('scroll', onScroll);
      timers.forEach(window.clearTimeout);
    };
  }, []);

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
    const sState = useStore.getState();
    const tr = getTranslation(sState.language);
    const v = sState.model.viewports.find((x) => x.id === viewportId);
    const el = contentRefs.current.get(viewportId);
    if (!v || !el) return;
    try {
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' as any });
      await new Promise((r) => setTimeout(r, 60));

      const dataUrl = await requestCapture('png');
      const p = sState.profileOf(v);
      const { width, height } = effectiveSize(p, v.orientation);
      const blob = await cropToBlob(dataUrl, rectOf(el), 'png');
      downloadBlob(blob, captureFileName({ device: p.name, w: width, h: height, ext: 'png' }));
      sState.showToast(tr.screenshotSaved);
    } catch (e) {
      sState.showToast(`${tr.screenshotFailed}: ${(e as Error).message}`);
    }
  }, []);

  const shotAll = useCallback(async () => {
    const sState = useStore.getState();
    const tr = getTranslation(sState.language);
    const canvas = canvasRef.current;
    const origTop = canvas?.scrollTop ?? 0;
    const origLeft = canvas?.scrollLeft ?? 0;

    try {
      let n = 0;
      const vps = sState.visibleViewports();
      for (const v of vps) {
        const el = contentRefs.current.get(v.id);
        if (!el) continue;
        const p = sState.profileOf(v);
        const { width, height } = effectiveSize(p, v.orientation);
        try {
          el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' as any });
          await new Promise((r) => setTimeout(r, 80));

          const dataUrl = await requestCapture('png');
          const blob = await cropToBlob(dataUrl, rectOf(el), 'png');
          downloadBlob(blob, captureFileName({ device: p.name, w: width, h: height, ext: 'png', ts: Date.now() + n }));
          n++;
        } catch (err) {
          console.error(`Failed capturing ${p.name}:`, err);
        }
      }

      if (canvas) {
        canvas.scrollTop = origTop;
        canvas.scrollLeft = origLeft;
      }

      sState.showToast(`${n} ${tr.allScreenshotsSaved}`);
    } catch (e) {
      sState.showToast(`${tr.screenshotFailed}: ${(e as Error).message}`);
    }
  }, []);

  const shotWorkspace = useCallback(async () => {
    const sState = useStore.getState();
    const tr = getTranslation(sState.language);
    try {
      const blob = await fullCaptureBlob('png');
      downloadBlob(blob, captureFileName({ device: 'workspace', w: window.innerWidth, h: window.innerHeight, ext: 'png' }));
      sState.showToast(tr.workspaceScreenshotSaved);
    } catch (e) {
      sState.showToast(`${tr.screenshotFailed}: ${(e as Error).message}`);
    }
  }, []);

  const handleHardReload = useCallback(async () => {
    try {
      await b.runtime?.sendMessage?.({ type: 'vg/clear-browser-cache' });
    } catch {}
    sendAgentCmd('all', 'hardReload');
    sendAgentCmd('all', 'clearStorage');
    const sState = useStore.getState();
    const currentUrl = sState.model.url;
    if (currentUrl) {
      try {
        const u = new URL(currentUrl);
        u.searchParams.set('_vg_nocache', Date.now().toString());
        sState.applyUrl(u.href);
      } catch {
        sState.applyUrl(currentUrl);
      }
    }
    const tr = getTranslation(sState.language);
    sState.showToast(tr.cacheBypassedToast);
  }, []);

  // Ping background to register workspace tabId reliably
  useEffect(() => {
    void workspaceHello();
  }, [st.model.url]);

  // —— keyboard map (docs/UX.md §6 MVP subset) ——
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const sState = useStore.getState();
      const key = e.key.toLowerCase();
      if (e.key === 'Escape') {
        sState.setPickerOpen(false);
        sState.setDrawerOpen(false);
        sState.setCompareOpen(false);
        sState.setSettingsOpen(false);
        setMenuOpen(false);
        return;
      }

      const sc = sState.shortcuts;

      if (matchesShortcut(e, sc.compare || 'Shift+D') || key === 'd') {
        e.preventDefault();
        sState.setCompareOpen(!sState.compareOpen);
      } else if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        sState.showToast('Shortcuts: [A] Add device • [D] Compare • [S] Sync • [G] Grid • [F] Focus • [O] Rotate • [C] Capture • [1-9] Select');
      } else if (matchesShortcut(e, sc.addDevice || 'a')) {
        e.preventDefault();
        sState.setPickerOpen(true);
      } else if (matchesShortcut(e, sc.shotFocused || 'c')) {
        e.preventDefault();
        const targetId = sState.focusedId || sState.visibleViewports()[0]?.id;
        if (targetId) void shotOne(targetId);
      } else if (matchesShortcut(e, sc.shotAll || 'Shift+C')) {
        e.preventDefault();
        void shotAll();
      } else if (matchesShortcut(e, sc.reloadAll || 'Shift+R')) {
        e.preventDefault();
        sendAgentCmd('all', 'reload');
      } else if (matchesShortcut(e, sc.hardReload || 'Shift+B')) {
        e.preventDefault();
        void handleHardReload();
      } else if (matchesShortcut(e, sc.focusMode || 'f')) {
        e.preventDefault();
        sState.toggleFocusMode();
      } else if (matchesShortcut(e, sc.toggleFrames || 'Shift+F')) {
        e.preventDefault();
        sState.toggleFrames();
      } else if (key === 's') {
        e.preventDefault();
        sState.setAllSync(!sState.model.sync.scroll);
      } else if (key === 'g') {
        e.preventDefault();
        sState.setLayout(sState.model.layout === 'grid' ? 'row' : sState.model.layout === 'row' ? 'col' : 'grid');
      } else if (key === 'o' && sState.focusedId) {
        e.preventDefault();
        sState.toggleOrientation(sState.focusedId);
      } else if (key === 'i') {
        e.preventDefault();
        doScan();
      } else if (/^[1-9]$/.test(key)) {
        const v = sState.visibleViewports()[Number(key) - 1];
        if (v) sState.focus(v.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shotOne, shotAll, doScan, handleHardReload]);

  const visible = st.visibleViewports();
  const canvasClass =
    st.model.layout === 'grid' ? s.canvasGrid : st.model.layout === 'row' ? s.canvasRow : s.canvasCol;

  const [dragState, setDragState] = useState<{
    draggingId: string | null;
    targetIndex: number | null;
  }>({
    draggingId: null,
    targetIndex: null,
  });

  const handleDragStart = useCallback((id: string) => {
    setDragState({ draggingId: id, targetIndex: null });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({ draggingId: null, targetIndex: null });
  }, []);

  const handleDragOverCard = useCallback((idx: number) => {
    setDragState((s) => (s.targetIndex === idx ? s : { ...s, targetIndex: idx }));
  }, []);

  const handleDropCard = useCallback((idx: number) => {
    setDragState((curr) => {
      if (curr.draggingId) {
        const fromIndex = visible.findIndex((v) => v.id === curr.draggingId);
        if (fromIndex !== -1 && idx !== -1 && fromIndex !== idx) {
          st.reorder(fromIndex, idx);
        }
      }
      return { draggingId: null, targetIndex: null };
    });
  }, [visible, st]);

  const handleDropOnSkeleton = useCallback(() => {
    setDragState((curr) => {
      if (curr.draggingId && curr.targetIndex !== null) {
        const fromIndex = visible.findIndex((v) => v.id === curr.draggingId);
        const target = curr.targetIndex;
        if (fromIndex !== -1 && target !== -1 && fromIndex !== target) {
          st.reorder(fromIndex, target);
        }
      }
      return { draggingId: null, targetIndex: null };
    });
  }, [visible, st]);

  const draggedVp = visible.find((v) => v.id === dragState.draggingId);
  const draggedProf = draggedVp ? st.profileOf(draggedVp) : null;
  const draggedLogical = draggedProf && draggedVp ? effectiveSize(draggedProf, draggedVp.orientation) : null;
  const skeletonW = draggedLogical && draggedVp ? Math.round(draggedLogical.width * draggedVp.zoom) + 24 : 260;
  const skeletonH = draggedLogical && draggedVp ? Math.round(draggedLogical.height * draggedVp.zoom) + 60 : 340;
  const fromIdx = dragState.draggingId ? visible.findIndex((v) => v.id === dragState.draggingId) : -1;

  return (
    <div className={s.app}>
      <div className={s.toolbar}>
        <span className={s.brand}>ViewGrid</span>
        <button className={s.iconBtn} title={t.back} onClick={() => sendAgentCmd('all', 'back')}>←</button>
        <button className={s.iconBtn} title={t.forward} onClick={() => sendAgentCmd('all', 'forward')}>→</button>
        <button className={s.iconBtn} title={t.reloadAll} onClick={() => sendAgentCmd('all', 'reload')}>⟳</button>
        <button className={s.iconBtn} title={t.hardReloadAll} onClick={() => void handleHardReload()} style={{ fontSize: 13 }}>🧹</button>
        <div className={s.url}>
          <input
            placeholder={t.urlPlaceholder}
            value={st.urlDraft}
            onChange={(e) => st.setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                st.applyUrl(st.urlDraft);
                void injectAgents();
              }
            }}
          />
          <button className="primary" onClick={() => { st.applyUrl(st.urlDraft); void injectAgents(); }}>{t.go}</button>
        </div>
        <div className={s.sep} />
        <button onClick={() => st.setPickerOpen(true)} title={`${t.addDeviceBtn} (A)`}>{t.add}</button>
        <select
          value=""
          onChange={(e) => { if (e.target.value) st.addPreset(e.target.value); e.target.value = ''; }}
          title={t.presets}
        >
          <option value="">{t.presets}</option>
          {['Mobile Test', 'Standard Responsive', 'iOS + Android', 'Tablet Check', 'Full House'].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={st.model.layout} onChange={(e) => st.setLayout(e.target.value as LayoutMode)} title={t.layout}>
          <option value="grid">{t.layoutGrid}</option>
          <option value="row">{t.layoutRow}</option>
          <option value="col">{t.layoutCol}</option>
        </select>
        <div className={s.sep} />
        <details style={{ position: 'relative' }}>
          <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6 }}>
            {t.sync} {st.model.sync.scroll ? '●' : '○'}
          </summary>
          <div className={s.menu} style={{ top: 32 }}>
            {(Object.keys(st.model.sync) as (keyof typeof st.model.sync)[]).map((k) => (
              <label key={k} className={s.menuRow}>
                <span>{k === 'scroll' ? t.syncScroll : k === 'click' ? t.syncClick : k === 'nav' ? t.syncNav : k === 'reload' ? t.syncReload : k === 'key' ? t.syncKey : k === 'input' ? t.syncInput : t.syncForm}</span>
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
        <button onClick={doScan} title={t.issues}>
          🔍 {st.issues.length > 0 ? <span className={s.badge + ' ' + s.warn}>{st.issues.length}</span> : t.issues}
        </button>
        <button onClick={() => st.setDrawerOpen(!st.drawerOpen)}>{t.panel}</button>
        <button onClick={() => void shotAll()} title={t.shotAll}>📷</button>
        <button onClick={() => void shotWorkspace()} title={t.shotWorkspace}>▦</button>
        <button
          onClick={() => {
            if (canvasRef.current) {
              canvasRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
            }
            sendAgentCmd('all', 'scrollToTop');
          }}
          title={st.language === 'tr' ? 'En başa kaydır (Tüm cihazlar ve tuval)' : st.language === 'no' ? 'Rull til toppen' : 'Scroll to top (All devices & canvas)'}
        >
          ⤒
        </button>
        <button onClick={() => st.fitToScreen()} title={t.fitToScreen}>⤢</button>
        <button onClick={() => st.toggleFocusMode()} title={t.focusMode}>⛶</button>
        <button onClick={st.toggleFrames} title={t.toggleFrames}>{st.model.frames ? '▣' : '▢'}</button>
        <button
          onClick={st.toggleTouchCursor}
          title={t.touchCursor}
          style={{
            background: st.model.touchCursor ? 'var(--accent)' : undefined,
            color: st.model.touchCursor ? '#000' : undefined,
            fontWeight: st.model.touchCursor ? 700 : undefined,
          }}
        >
          👆
        </button>
        <button
          onClick={() => {
            if (st.visibleViewports().length < 2) {
              st.showToast(t.compareSelectHint);
              return;
            }
            st.setCompareOpen(!st.compareOpen);
          }}
          title={t.compareTitle}
        >
          ⚖ {t.compare}
        </button>
        <button
          onClick={() => {
            if (st.visibleViewports().length === 0) {
              st.showToast(t.compareSelectHint);
              return;
            }
            st.setCompareOpen(true, 'figma');
          }}
          title={st.language === 'tr' ? 'Figma Mockup Pixel-Diff Karşılaştırma' : 'Figma Mockup Pixel-Diff Comparison'}
          style={{
            background: 'rgba(214, 104, 83, 0.15)',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
            fontWeight: 700,
          }}
        >
          🎨 Figma Diff
        </button>
        <button
          onClick={() => st.setBenchmarkOpen(true)}
          title={st.language === 'tr' ? 'Mimari & Bellek Benchmark (<15 MB RAM)' : 'Architecture & Memory Benchmark (<15 MB RAM)'}
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#10b981',
            fontWeight: 700,
            fontSize: 11,
            padding: '2px 8px',
          }}
        >
          ⚡ &lt;15MB RAM
        </button>
        <button onClick={st.toggleTheme} title={t.theme}>{st.model.theme === 'dark' ? '☀' : '◐'}</button>

        {/* Language selector */}
        <select
          value={st.language}
          onChange={(e) => st.setLanguage(e.target.value as Language)}
          title={t.language}
          style={{ padding: '2px 6px', fontSize: 11, cursor: 'pointer' }}
        >
          <option value="tr">🇹🇷 TR</option>
          <option value="en">🇬🇧 EN</option>
          <option value="no">🇳🇴 NO</option>
        </select>

        <button onClick={() => st.setSettingsOpen(true)} title="Ayarlar (Settings)">⚙️</button>
        <button onClick={() => setMenuOpen(!menuOpen)} title={t.menu}>☰</button>

        {menuOpen && (
          <div className={s.menu}>
            <div className={s.menuRow}>
              <input
                className={s.url}
                style={{ flex: 1 }}
                placeholder={t.workspaceName}
                value={saveName || st.model.name}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <button onClick={() => { st.saveAs(saveName || st.model.name); setSaveName(''); setMenuOpen(false); }}>{t.save}</button>
            </div>
            {Object.keys(st.savedWorkspaces).map((n) => (
              <div key={n} className={s.menuRow}>
                <span>{n}</span>
                <span>
                  <button className={s.iconBtn} onClick={() => { st.loadSaved(n); setMenuOpen(false); }}>{t.load}</button>
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
                  if (ok) { st.showToast(t.accessGrantedMsg); void injectAgents(); }
                  else st.showToast(t.accessDeniedMsg);
                }}
              >
                {t.enableSiteAccess}
              </button>
            )}
          </div>
        )}
      </div>

      <div ref={canvasRef} className={s.canvas}>
        {visible.length === 0 ? (
          <div className={s.empty}>
            <div>{t.noViewports}</div>
            <button className="primary" onClick={() => st.setPickerOpen(true)}>{t.addDeviceBtn}</button>
            <div style={{ fontSize: 12 }}>{t.emptyHint}</div>
          </div>
        ) : (
          <div className={canvasClass}>
            {visible.map((v, idx) => {
              const showSkeletonBefore =
                Boolean(dragState.draggingId) &&
                dragState.targetIndex === idx &&
                idx < fromIdx;

              const showSkeletonAfter =
                Boolean(dragState.draggingId) &&
                dragState.targetIndex === idx &&
                idx > fromIdx;

              return (
                <React.Fragment key={v.id}>
                  {showSkeletonBefore && (
                    <div
                      className={s.dropSkeleton}
                      style={{ width: skeletonW, height: skeletonH }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropOnSkeleton();
                      }}
                    >
                      <div className={s.skeletonInner}>
                        <span className={s.skeletonIcon}>📥</span>
                        <span>{t.dropHere}</span>
                      </div>
                    </div>
                  )}
                  <ViewportCard
                    vp={v}
                    index={idx}
                    isDragging={dragState.draggingId === v.id}
                    isDropTarget={Boolean(dragState.draggingId) && dragState.targetIndex === idx && idx !== fromIdx}
                    onRegister={registerContent}
                    onShot={() => void shotOne(v.id)}
                    onInjected={() => void injectAgents()}
                    onDragStartCard={handleDragStart}
                    onDragEndCard={handleDragEnd}
                    onDragOverCard={handleDragOverCard}
                    onDropCard={handleDropCard}
                  />
                  {showSkeletonAfter && (
                    <div
                      className={s.dropSkeleton}
                      style={{ width: skeletonW, height: skeletonH }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropOnSkeleton();
                      }}
                    >
                      <div className={s.skeletonInner}>
                        <span className={s.skeletonIcon}>📥</span>
                        <span>{t.dropHere}</span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            {dragState.draggingId &&
              dragState.targetIndex === visible.length &&
              fromIdx !== visible.length - 1 && (
                <div
                  className={s.dropSkeleton}
                  style={{ width: skeletonW, height: skeletonH }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropOnSkeleton();
                  }}
                >
                  <div className={s.skeletonInner}>
                    <span className={s.skeletonIcon}>📥</span>
                    <span>{t.dropHere}</span>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      <div className={s.statusBar}>
        <span>{visible.length} {t.viewports}</span>
        <span>{t.layout}: {st.model.layout === 'grid' ? t.layoutGrid : st.model.layout === 'row' ? t.layoutRow : t.layoutCol}</span>
        <span>{t.zoomPresets}: {ZOOM_PRESETS.map((z) => `${z * 100}%`).join(' / ')}</span>
        <span>{t.issues}: {st.issues.length}</span>
        <span>{st.granted ? t.siteAccessGranted : t.siteAccessLimited}</span>
        <span>local-only ●</span>
      </div>

      {st.pickerOpen && <DevicePicker />}
      {st.drawerOpen && <IssuesDrawer />}
      {st.compareOpen && <CompareModal />}
      <SettingsModal />
      <BenchmarkModal />
      <Toast message={st.toast} onClose={() => st.showToast('')} />
    </div>
  );
}
