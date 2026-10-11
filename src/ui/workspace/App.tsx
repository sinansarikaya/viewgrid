import React, { useCallback, useEffect, useRef, useState } from 'react';
import s from './styles.module.css';
import { useStore } from './store';
import { ViewportCard } from './ViewportCard';
import { DevicePicker } from './DevicePicker';
import { IssuesDrawer } from './IssuesDrawer';
import {
  captureFileName,
  downloadBlob,
  fullCaptureBlob,
  grantHostAccess,
  injectAgents,
  sendAgentCmd,
} from './bridge';
import { startScan } from './scan';
import { groupIssues, primaryIssues } from '../../core/issues/report';
import { captureViewport, isCapturing } from './capture';
import { LoopGuard } from '../../core/sync/protocol';
import { effectiveSize, gridColumns, calculateSnapGuides, type GuideLine, type Bounds } from '../../core/workspace/layout';
import type { AlignItemsMode, JustifyContentMode } from '../../core/types';
import { ZOOM_PRESETS } from '../../core/types';
import { getTranslation, type Language } from './i18n';
import { Toast } from './Toast';
import { SettingsModal } from './SettingsModal';
import { BenchmarkModal } from './BenchmarkModal';
import { workspaceHello, workspaceMessage } from './bridge';
import { CompareModal } from './CompareModal';
import { b } from '../../platform/browser';
import { Button } from '../common/Button';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceActions } from './WorkspaceActions';
import { AnalysisPanel } from './AnalysisPanel';
import { sanitizeReportScreenshot, MAX_REPORT_SCREENSHOT_BYTES, type ReportScreenshot } from '../../core/reports/screenshots';
import { loadBuildFingerprint } from '../../lib/api/build-info';

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

export function App({ hub: _hub }: { hub: LoopGuard }) {
  const st = useStore();
  const t = getTranslation(st.language);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef(new Map<string, HTMLElement>());
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [analysisSection, setAnalysisSection] = useState<'performance' | 'seo' | 'reports' | 'geo' | null>(null);
  const version = b.runtime.getManifest().version || 'unknown';
  const [build, setBuild] = useState('');

  useEffect(() => {
    let mounted = true;
    void loadBuildFingerprint().then(fingerprint => {
      if (mounted && fingerprint) setBuild(fingerprint);
    });
    return () => { mounted = false; };
  }, []);

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

  const doScan = useCallback(() => { void startScan(); }, []);
  const captureReportViewport = useCallback(async (): Promise<ReportScreenshot> => {
    const state = useStore.getState();
    const visible = state.visibleViewports().filter(viewport => !viewport.minimized);
    const viewport = visible.find(viewport => viewport.id === state.focusedId) ?? visible[0];
    const content = viewport && contentRefs.current.get(viewport.id);
    if (!viewport || !content || isCapturing()) throw new Error('REPORT_SCREENSHOT_UNAVAILABLE');
    const device = state.profileOf(viewport);
    const size = effectiveSize(device, viewport.orientation);
    const configuredUrl = viewport.url || state.model.url;
    const blob = await captureViewport(content);
    if (blob.size > MAX_REPORT_SCREENSHOT_BYTES) throw new Error('REPORT_SCREENSHOT_TOO_LARGE');
    const pngDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('REPORT_SCREENSHOT_ENCODING_FAILED'));
      reader.onerror = () => reject(new Error('REPORT_SCREENSHOT_ENCODING_FAILED'));
      reader.readAsDataURL(blob);
    });
    return sanitizeReportScreenshot({ viewportName: device.name, previewUrl: configuredUrl, cssWidth: size.width, cssHeight: size.height, capturedAt: new Date().toISOString(), pngDataUrl });
  }, []);
  const shotOne = useCallback(async (viewportId: string) => {
    const state = useStore.getState(), tr = getTranslation(state.language);
    const v = state.model.viewports.find(v => v.id === viewportId), el = contentRefs.current.get(viewportId);
    if (!v || !el || isCapturing()) return;
    try {
      const blob = await captureViewport(el), p = state.profileOf(v);
      const { width, height } = effectiveSize(p, v.orientation);
      downloadBlob(blob, captureFileName({ device: p.name, w: width, h: height, ext: 'png' }));
      state.showToast(tr.screenshotSaved);
    } catch (e) { state.showToast(`${tr.screenshotFailed}: ${(e as Error).message}`); }
  }, []);

  const shotAll = useCallback(async () => {
    if (isCapturing()) return;
    const state = useStore.getState(), tr = getTranslation(state.language);
    let completed = 0;
    try {
      for (const v of state.visibleViewports().filter(v => !v.minimized)) {
        const el = contentRefs.current.get(v.id); if (!el) continue;
        const blob = await captureViewport(el), p = state.profileOf(v);
        const { width, height } = effectiveSize(p, v.orientation);
        downloadBlob(blob, captureFileName({ device: p.name, w: width, h: height, ext: 'png', index: completed++ }));
      }
      state.showToast(`${completed} ${tr.allScreenshotsSaved}`);
    } catch (e) { state.showToast(`${tr.screenshotFailed} (${completed} saved): ${(e as Error).message}`); }
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
    await useStore.getState().persist();
    await workspaceMessage({ type: 'vg/hard-reload' });
  }, []);

  const handleScrollToTopAll = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
    sendAgentCmd('all', 'scrollToTop');
  }, []);

  // Ping background to register workspace tabId reliably
  useEffect(() => {
    void workspaceHello();
  }, [st.model.url]);

  // —— keyboard map (docs/UX.md §6 MVP subset) ——
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isCapturing()) return;
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
    st.model.layout === 'grid'
      ? s.canvasGrid
      : st.model.layout === 'row'
      ? s.canvasRow
      : st.model.layout === 'col'
      ? s.canvasCol
      : s.canvasFree;

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
    setDragState((curr) => (curr.targetIndex === idx ? curr : { ...curr, targetIndex: idx }));
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

  const [activeGuides, setActiveGuides] = useState<GuideLine[]>([]);

  const handleFreeDrag = useCallback(
    (id: string, startEvent: React.MouseEvent<HTMLDivElement>) => {
      const sState = useStore.getState();
      const targetVp = sState.model.viewports.find((v) => v.id === id);
      if (!targetVp) return;

      const cardEl = contentRefs.current.get(id)?.closest(`.${s.card}`) as HTMLElement;
      const canvasEl = canvasRef.current;
      if (!canvasEl || !cardEl) return;

      const canvasRect = canvasEl.getBoundingClientRect();
      const cardRect = cardEl.getBoundingClientRect();

      const initialX = targetVp.position?.x ?? Math.round(cardRect.left - canvasRect.left + canvasEl.scrollLeft);
      const initialY = targetVp.position?.y ?? Math.round(cardRect.top - canvasRect.top + canvasEl.scrollTop);

      const startMouseX = startEvent.clientX;
      const startMouseY = startEvent.clientY;

      const visibleVps = sState.visibleViewports();
      const otherBounds: Bounds[] = [];
      visibleVps.forEach((v) => {
        if (v.id === id) return;
        const el = contentRefs.current.get(v.id)?.closest(`.${s.card}`) as HTMLElement;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vx = v.position?.x ?? Math.round(r.left - canvasRect.left + canvasEl.scrollLeft);
        const vy = v.position?.y ?? Math.round(r.top - canvasRect.top + canvasEl.scrollTop);
        otherBounds.push({ id: v.id, x: vx, y: vy, width: r.width, height: r.height });
      });

      const onMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;
        const candX = Math.max(0, initialX + dx);
        const candY = Math.max(0, initialY + dy);

        const targetBounds = { x: candX, y: candY, width: cardRect.width, height: cardRect.height };
        const snapped = calculateSnapGuides(targetBounds, otherBounds, 12);

        sState.setPosition(id, { x: snapped.x, y: snapped.y });
        setActiveGuides(snapped.guides);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        setActiveGuides([]);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [],
  );

  const draggedVp = visible.find((v) => v.id === dragState.draggingId);
  const draggedProf = draggedVp ? st.profileOf(draggedVp) : null;
  const draggedLogical = draggedProf && draggedVp ? effectiveSize(draggedProf, draggedVp.orientation) : null;
  const skeletonW = draggedLogical && draggedVp ? Math.round(draggedLogical.width * draggedVp.zoom) + 24 : 260;
  const skeletonH = draggedLogical && draggedVp ? Math.round(draggedLogical.height * draggedVp.zoom) + 60 : 340;
  const fromIdx = dragState.draggingId ? visible.findIndex((v) => v.id === dragState.draggingId) : -1;

  // Dynamic CSSOM stylesheet manager (eliminates all inline style JSX)
  useEffect(() => {
    let styleEl = document.getElementById('viewgrid-dynamic-geometry') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'viewgrid-dynamic-geometry';
      document.head.appendChild(styleEl);
    }

    const rules: string[] = [];

    // 1. Drop skeleton dimensions
    rules.push(`[data-skeleton-drop] { width: ${skeletonW}px !important; height: ${skeletonH}px !important; }`);

    // 2. Free-form card positions & guides
    if (st.model.layout === 'free') {
      visible.forEach((v) => {
        const px = Number.isFinite(v.position?.x) ? v.position!.x : 24;
        const py = Number.isFinite(v.position?.y) ? v.position!.y : 24;
        rules.push(`[data-vp-pos="${CSS.escape(v.id)}"] { left: ${px}px !important; top: ${py}px !important; }`);
      });

      activeGuides.forEach((g, i) => {
        if (!Number.isFinite(g.pos)) return;
        if (g.type === 'v') {
          rules.push(`[data-guide-v="${i}"] { left: ${g.pos}px !important; }`);
        } else {
          rules.push(`[data-guide-h="${i}"] { top: ${g.pos}px !important; }`);
        }
      });
    }

    styleEl.textContent = rules.join('\n');

    return () => {
      styleEl?.remove();
    };
  }, [st.model.layout, visible, activeGuides, skeletonW, skeletonH]);

  return (
    <div className={s.app}>
      {/* —— Top Toolbar —— */}
      <header className={s.toolbar}>
        <span className={s.brand}>
          ViewGrid <small data-testid="extension-version" className={s.versionTag}>v{version}</small>
        </span>
        <Button variant="default" className={s.iconBtn} title={t.back} onClick={() => sendAgentCmd('all', 'back')}>←</Button>
        <Button variant="default" className={s.iconBtn} title={t.forward} onClick={() => sendAgentCmd('all', 'forward')}>→</Button>
        <Button variant="default" className={s.iconBtn} title={t.reloadAll} onClick={() => sendAgentCmd('all', 'reload')}>⟳</Button>
        <Button variant="default" className={s.iconBtn} title={t.hardReloadAll} onClick={() => void handleHardReload()}>🧹</Button>

        {/* URL Bar — Keep as the very first input on the page for E2E selector compliance */}
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
          <Button variant="primary" onClick={() => { st.applyUrl(st.urlDraft); void injectAgents(); }}>{t.go}</Button>
        </div>

        <div className={s.sep} />

        {/* Runtime info & Local mode */}
        <Button
          variant="default"
          className={s.localBenchmarkBtn}
          onClick={() => st.setBenchmarkOpen(true)}
          title={st.language === 'tr' ? 'Çalışma biçimi ve sınırlar' : 'Runtime and limitations'}
        >
          ⚡ Local
        </Button>
        <details className={s.captureMenu}>
          <summary>{st.language === 'tr' ? 'Yakalama' : st.language === 'no' ? 'Skjermbilde' : 'Capture'}</summary>
          <div className={s.menu}>
            <Button onClick={() => { if (st.focusedId) void shotOne(st.focusedId); else st.showToast(t.compareSelectHint); }}>{t.shotOne}</Button>
            <Button onClick={() => void shotAll()}>{t.shotAll}</Button>
            <Button onClick={() => void shotWorkspace()}>{t.shotWorkspace}</Button>
          </div>
        </details>

        {/* Theme Toggle */}
        <Button variant="default" onClick={st.toggleTheme} title={t.theme}>
          {st.model.theme === 'dark' ? '☀' : '◐'}
        </Button>

        {/* Language selector */}
        <select
          value={st.language}
          onChange={(e) => st.setLanguage(e.target.value as Language)}
          title={t.language}
          className={s.langSelect}
        >
          <option value="tr">🇹🇷 TR</option>
          <option value="en">🇬🇧 EN</option>
          <option value="no">🇳🇴 NO</option>
        </select>

        {/* Settings & Workspace Menu */}
        <Button variant="default" onClick={() => st.setSettingsOpen(true)} title="Ayarlar (Settings)">⚙️</Button>
        <Button variant="default" onClick={() => setMenuOpen(!menuOpen)} title={t.menu}>☰</Button>

        {menuOpen && (
          <div className={s.menu}>
            <div className={s.menuRow}>
              <input
                className={s.url}
                placeholder={t.workspaceName}
                value={saveName || st.model.name}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <Button
                variant="primary"
                onClick={() => {
                  st.saveAs(saveName || st.model.name);
                  setSaveName('');
                  setMenuOpen(false);
                }}
              >
                {t.save}
              </Button>
            </div>
            {Object.keys(st.savedWorkspaces).map((n) => (
              <div key={n} className={s.menuRow}>
                <span>{n}</span>
                <span>
                  <Button variant="default" className={s.iconBtn} onClick={() => { st.loadSaved(n); setMenuOpen(false); }}>{t.load}</Button>
                  <Button variant="danger" className={s.iconBtn} onClick={() => st.deleteSaved(n)}>✕</Button>
                </span>
              </div>
            ))}
            {!st.granted && (
              <Button
                variant="primary"
                onClick={async () => {
                  const ok = await grantHostAccess();
                  st.setGranted(ok);
                  if (ok) { st.showToast(t.accessGrantedMsg); void injectAgents(); st.reloadAllFrames(); }
                  else st.showToast(t.accessDeniedMsg);
                }}
              >
                {t.enableSiteAccess}
              </Button>
            )}
          </div>
        )}
      </header>

      {/* Host Permission Banner */}
      {!st.granted && (
        <div className={s.permissionBanner}>
          <div className={s.permissionBannerContent}>
            <span className={s.permissionBannerIcon}>🛡️</span>
            <div>
              <div className={s.permissionBannerTitle}>{t.siteAccessRequiredTitle}</div>
              <div className={s.permissionBannerDesc}>{t.siteAccessRequiredDesc}</div>
            </div>
          </div>
          <Button
            variant="primary"
            className={s.permissionBannerBtn}
            onClick={async () => {
              const ok = await grantHostAccess();
              st.setGranted(ok);
              if (ok) {
                st.showToast(t.accessGrantedMsg);
                void injectAgents();
                st.reloadAllFrames();
              } else {
                st.showToast(t.accessDeniedMsg);
              }
            }}
          >
            {t.enableSiteAccessBtn}
          </Button>
        </div>
      )}

      {/* —— Main Layout with Collapsible Sidebar & Canvas Container —— */}
      <div className={s.mainLayout}>
        <WorkspaceSidebar
          onScan={doScan}
          onScrollToTop={handleScrollToTopAll}
        ><WorkspaceActions onScan={doScan} onAnalysis={setAnalysisSection} /></WorkspaceSidebar>

        <div className={s.canvasContainer}>
          {/* Canvas Header: Layout Mode, Fit to Screen, Auto Align, Align/Justify */}
          <div className={s.canvasHeader}>
            <div className={s.canvasHeaderLeft}>
              <div className={s.modeGroup} role="group" aria-label="Layout modes">
                <Button
                  variant="default"
                  className={[s.modeBtn, st.model.layout === 'grid' ? s.modeBtnActive : ''].join(' ')}
                  onClick={() => st.setLayout('grid')}
                  title={t.layoutGrid}
                >
                  ⊞ {t.layoutGrid}
                </Button>
                <Button
                  variant="default"
                  className={[s.modeBtn, st.model.layout === 'row' ? s.modeBtnActive : ''].join(' ')}
                  onClick={() => st.setLayout('row')}
                  title={t.layoutRow}
                >
                  ⊟ {t.layoutRow}
                </Button>
                <Button
                  variant="default"
                  className={[s.modeBtn, st.model.layout === 'col' ? s.modeBtnActive : ''].join(' ')}
                  onClick={() => st.setLayout('col')}
                  title={t.layoutCol}
                >
                  ⫿ {t.layoutCol}
                </Button>
                <Button
                  variant="default"
                  className={[s.modeBtn, st.model.layout === 'free' ? s.modeBtnActive : ''].join(' ')}
                  onClick={() => {
                    st.setLayout('free');
                    const hasPos = st.model.viewports.some((v) => !!v.position);
                    if (!hasPos) st.autoAlignAll();
                  }}
                  title={t.layoutFree}
                >
                  ✥ {t.layoutFree}
                </Button>
              </div>

              <Button
                variant="default"
                onClick={() => st.autoAlignAll()}
                title={t.autoAlignGrid}
              >
                ⚡ {t.autoAlignGrid}
              </Button>

              <Button
                variant="default"
                onClick={() => st.fitToScreen()}
                title={t.fitToScreen}
              >
                ⤢ {t.fitToScreen}
              </Button>
            </div>

            <div className={s.canvasHeaderRight}>
              {st.model.layout !== 'free' && (
                <>
                  <select
                    value={st.model.alignItems || 'flex-start'}
                    onChange={(e) => st.setAlignItems(e.target.value as AlignItemsMode)}
                    title={t.alignItemsTitle}
                  >
                    <option value="flex-start">{t.alignTop}</option>
                    <option value="center">{t.alignCenterV}</option>
                    <option value="flex-end">{t.alignBottom}</option>
                  </select>
                  <select
                    value={st.model.justifyContent || 'flex-start'}
                    onChange={(e) => st.setJustifyContent(e.target.value as JustifyContentMode)}
                    title={t.justifyContentTitle}
                  >
                    <option value="flex-start">{t.alignLeft}</option>
                    <option value="center">{t.alignCenterH}</option>
                    <option value="flex-end">{t.alignRight}</option>
                    <option value="space-between">{t.alignSpaceBetween}</option>
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Canvas Area */}
          <main ref={canvasRef} className={s.canvas}>
            {visible.length === 0 ? (
              <div className={s.empty}>
                <div>{t.noViewports}</div>
                <Button variant="primary" onClick={() => st.setPickerOpen(true)}>{t.addDeviceBtn}</Button>
                <div>{t.emptyHint}</div>
              </div>
            ) : (
              <div
                className={canvasClass}
                data-layout={st.model.layout}
                data-cols={gridColumns(visible.length, st.model.layout)}
                data-align={st.model.alignItems || 'flex-start'}
                data-justify={st.model.justifyContent || 'flex-start'}
              >
                {st.model.layout === 'free' &&
                  activeGuides.map((g, i) => (
                    <div
                      key={i}
                      data-guide-v={g.type === 'v' ? i : undefined}
                      data-guide-h={g.type === 'h' ? i : undefined}
                      className={g.type === 'v' ? s.guideLineV : s.guideLineH}
                    />
                  ))}
                {visible.map((v, idx) => {
                  if (st.model.layout === 'free') {
                    return (
                      <div
                        key={v.id}
                        data-vp-pos={v.id}
                        className={s.cardFree}
                      >
                        <ViewportCard
                          vp={v}
                          index={idx}
                          isFreeLayout
                          onRegister={registerContent}
                          onShot={() => void shotOne(v.id)}
                          onInjected={() => void injectAgents()}
                          onFreeDrag={handleFreeDrag}
                        />
                      </div>
                    );
                  }

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
                          data-skeleton-drop="true"
                          className={s.dropSkeleton}
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
                          data-skeleton-drop="true"
                          className={s.dropSkeleton}
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
                      data-skeleton-drop="true"
                      className={s.dropSkeleton}
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
          </main>
        </div>
      </div>

      {/* —— Bottom Status Bar —— */}
      <footer className={s.statusBar}>
        <span data-testid="extension-build">ViewGrid v{version}{build && ` · ${build}`}</span>
        <span>{visible.length} {t.viewports}</span>
        <span>{t.layout}: {st.model.layout === 'grid' ? t.layoutGrid : st.model.layout === 'row' ? t.layoutRow : st.model.layout === 'col' ? t.layoutCol : t.layoutFree}</span>
        <span>{t.zoomPresets}: {ZOOM_PRESETS.map((z) => `${z * 100}%`).join(' / ')}</span>
        <span>{t.issues}: {groupIssues(primaryIssues(st.issues)).length}</span>
        <span>{st.granted ? t.siteAccessGranted : t.siteAccessLimited}</span>
        <span>{st.language === 'tr' ? 'Yerel önizleme · analiz isteğe bağlı' : st.language === 'no' ? 'Lokal forhåndsvisning · valgfri analyse' : 'Local previews · optional analysis'}</span>
      </footer>

      {st.pickerOpen && <DevicePicker />}
      {st.drawerOpen && <IssuesDrawer />}
      {st.compareOpen && <CompareModal />}
      {analysisSection && <AnalysisPanel section={analysisSection} onClose={() => setAnalysisSection(null)} onCaptureViewport={captureReportViewport} />}
      <SettingsModal />
      <BenchmarkModal />
      <Toast message={st.toast} onClose={() => st.showToast('')} />
    </div>
  );
}
