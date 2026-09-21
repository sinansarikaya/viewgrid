import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { getTranslation } from './i18n';
import { effectiveSize } from '../../core/workspace/layout';
import type { Orientation } from '../../core/types';
import {
  captureFileName,
  cropToBlob,
  downloadBlob,
  rectOf,
  requestCapture,
} from './bridge';
import s from './CompareModal.module.css';

export function CompareModal() {
  const st = useStore();
  const t = getTranslation(st.language);
  const viewports = st.visibleViewports();

  const [idA, setIdA] = useState<string>(viewports[0]?.id || '');
  const [idB, setIdB] = useState<string>(viewports[1]?.id || viewports[0]?.id || '');
  const [mode, setMode] = useState<'split' | 'curtain' | 'side-by-side' | 'figma'>(st.compareMode || 'split');
  const [splitPercent, setSplitPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [figmaSrc, setFigmaSrc] = useState<string>('');
  const [figmaOpacity, setFigmaOpacity] = useState<number>(50);
  const [figmaBlend, setFigmaBlend] = useState<'normal' | 'difference' | 'overlay'>('normal');

  useEffect(() => {
    if (st.compareMode) setMode(st.compareMode);
  }, [st.compareMode]);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 1100,
    height: 650,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);

  const vpA = viewports.find((v) => v.id === idA) || viewports[0];
  const vpB = viewports.find((v) => v.id === idB) || viewports[1] || viewports[0];

  const [orientA, setOrientA] = useState<Orientation>(vpA?.orientation || 'portrait');
  const [orientB, setOrientB] = useState<Orientation>(vpB?.orientation || 'portrait');

  useEffect(() => {
    if (vpA?.orientation) setOrientA(vpA.orientation);
  }, [vpA?.id, vpA?.orientation]);

  useEffect(() => {
    if (vpB?.orientation) setOrientB(vpB.orientation);
  }, [vpB?.id, vpB?.orientation]);

  const profA = vpA ? st.profileOf(vpA) : null;
  const profB = vpB ? st.profileOf(vpB) : null;

  const sizeA = profA ? effectiveSize(profA, orientA) : { width: 375, height: 667 };
  const sizeB = profB ? effectiveSize(profB, orientB) : { width: 1024, height: 768 };

  // Observe viewer container dimensions dynamically without feedback loop
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 50 && height > 50) {
          setStageSize({ width: Math.round(width), height: Math.round(height) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') st.setCompareOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [st]);

  // —— Sizing Calculations ——
  // 1. Dual-Split Mode
  const availStageW = Math.max(300, stageSize.width);
  const availStageH = Math.max(200, stageSize.height);

  const paneWidthA = (availStageW * splitPercent) / 100;
  const paneWidthB = (availStageW * (100 - splitPercent)) / 100;

  const usableWA = Math.max(50, paneWidthA - 32);
  const usableWB = Math.max(50, paneWidthB - 32);
  const usableH = Math.max(50, availStageH - 74);

  const splitScaleA = Math.min(1, Math.max(0.1, usableWA / sizeA.width), Math.max(0.1, usableH / sizeA.height));
  const splitScaleB = Math.min(1, Math.max(0.1, usableWB / sizeB.width), Math.max(0.1, usableH / sizeB.height));

  // 2. Proportional Overlay Curtain Mode (Narrow phone on left, wide laptop on right, 100% full vertical height)
  const totalCurtainW = sizeA.width + sizeB.width;
  const maxCurtainStageH = Math.max(sizeA.height, sizeB.height, 800);
  const curtainFitScale = Math.min(
    1,
    Math.max(0.2, (availStageW - 32) / totalCurtainW),
    Math.max(0.2, (availStageH - 80) / maxCurtainStageH),
  );
  const curtainStageW = Math.round(totalCurtainW * curtainFitScale);
  const curtainStageH = Math.round(maxCurtainStageH * curtainFitScale);

  // Natural device width ratio (e.g. 24% for phone vs 76% for laptop)
  const naturalRatioA = Math.max(15, Math.min(85, Math.round((sizeA.width / totalCurtainW) * 100)));

  // Auto-snap curtain split to natural device ratio on device or mode change
  useEffect(() => {
    if (mode === 'curtain') {
      setSplitPercent(naturalRatioA);
    }
  }, [mode, idA, idB, orientA, orientB, naturalRatioA]);

  // —— Draggable Split / Curtain Divider Handlers ——
  const handleDividerPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const activeStage = mode === 'curtain' ? curtainRef.current : splitRef.current;
    if (!activeStage) return;

    const onMove = (moveEv: PointerEvent) => {
      const rect = activeStage.getBoundingClientRect();
      const x = moveEv.clientX - rect.left;
      const minPct = mode === 'curtain' ? 10 : 12;
      const maxPct = mode === 'curtain' ? 90 : 88;
      const pct = Math.max(minPct, Math.min(maxPct, (x / rect.width) * 100));
      setSplitPercent(pct);
    };

    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  // Snapping helpers
  const snapTo50 = () => setSplitPercent(50);
  const snapFocusA = () => setSplitPercent(75);
  const snapFocusB = () => setSplitPercent(25);
  const snapToNatural = () => setSplitPercent(naturalRatioA);

  const getDeviceIcon = (cat?: string) => {
    switch (cat) {
      case 'phone': return '📱';
      case 'tablet': return '📟';
      case 'laptop': return '💻';
      case 'desktop': return '🖥️';
      default: return '📐';
    }
  };

  // 3. Side-by-Side Mode (Two distinct device cards filling the stage comfortably)
  const sideUsableW = Math.max(100, (availStageW - 48) / 2 - 24);
  const sideUsableH = Math.max(100, availStageH - 64);
  const sideScaleA = Math.min(1, Math.max(0.15, sideUsableW / sizeA.width), Math.max(0.15, sideUsableH / sizeA.height));
  const sideScaleB = Math.min(1, Math.max(0.15, sideUsableW / sizeB.width), Math.max(0.15, sideUsableH / sizeB.height));

  // —— Screenshot Capture ——
  const handleTakeScreenshot = async () => {
    const targetEl = containerRef.current;
    if (!targetEl) return;
    try {
      const dataUrl = await requestCapture('png');
      const rect = rectOf(targetEl);
      const blob = await cropToBlob(dataUrl, rect, 'png');
      const nameA = (profA?.name || 'A').replace(/\s+/g, '-');
      const nameB = (profB?.name || 'B').replace(/\s+/g, '-');
      downloadBlob(
        blob,
        captureFileName({
          device: `compare-${mode}-${nameA}-vs-${nameB}`,
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          ext: 'png',
        }),
      );
      st.showToast(t.screenshotSaved);
    } catch (e) {
      st.showToast(`${t.screenshotFailed}: ${(e as Error).message}`);
    }
  };

  if (!vpA || !vpB) return null;

  return (
    <div
      className={s.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) st.setCompareOpen(false);
      }}
    >
      <div className={s.modal}>
        {/* Top Header */}
        <div className={s.header}>
          <div className={s.headerTitle}>
            <span>⚖</span>
            <span>{t.compareTitle}</span>
          </div>

          <div className={s.controls}>
            {/* View Mode Toggle: Dual Split, Curtain Overlay, Side by Side */}
            <div className={s.modeToggle}>
              <button
                type="button"
                className={`${s.modeBtn} ${mode === 'split' ? s.modeBtnActive : ''}`}
                onClick={() => setMode('split')}
                title={t.compareSplit}
              >
                ⫴ {t.compareSplit}
              </button>
              <button
                type="button"
                className={`${s.modeBtn} ${mode === 'curtain' ? s.modeBtnActive : ''}`}
                onClick={() => setMode('curtain')}
                title={t.compareCurtain}
              >
                ▥ {t.compareCurtain}
              </button>
              <button
                type="button"
                className={`${s.modeBtn} ${mode === 'side-by-side' ? s.modeBtnActive : ''}`}
                onClick={() => setMode('side-by-side')}
                title={t.compareSideBySide}
              >
                ⫿ {t.compareSideBySide}
              </button>
              <button
                type="button"
                className={`${s.modeBtn} ${mode === 'figma' ? s.modeBtnActive : ''}`}
                onClick={() => setMode('figma')}
                title="Figma Mockup Pixel-Diff"
              >
                🎨 Figma Diff
              </button>
            </div>

            {/* Select Device A */}
            <div className={s.selectGroup}>
              <span>A:</span>
              <select value={idA} onChange={(e) => setIdA(e.target.value)}>
                {viewports.map((v) => (
                  <option key={v.id} value={v.id}>
                    {st.profileOf(v).name}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Device B */}
            <div className={s.selectGroup}>
              <span>B:</span>
              <select value={idB} onChange={(e) => setIdB(e.target.value)}>
                {viewports.map((v) => (
                  <option key={v.id} value={v.id}>
                    {st.profileOf(v).name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset / Equalize Split Button (Split or Curtain Mode) */}
            {mode !== 'side-by-side' && mode !== 'figma' && (
              <button
                type="button"
                className={s.actionBtn}
                onClick={mode === 'curtain' ? snapToNatural : snapTo50}
                title={mode === 'curtain' ? 'Doğal Cihaz Oranına Eşitle' : t.resetSplit}
              >
                🎯 {mode === 'curtain' ? `Doğal Oran (%${naturalRatioA})` : t.resetSplit}
              </button>
            )}

            {/* Screenshot Button */}
            <button
              type="button"
              className={s.actionBtn}
              onClick={handleTakeScreenshot}
              title={t.shotOne}
            >
              📷 {t.shotOne.split(' ')[0]}
            </button>

            {/* Close Button */}
            <button
              type="button"
              className={s.closeBtn}
              onClick={() => st.setCompareOpen(false)}
              title="Kapat (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Comparison Stage Viewer */}
        <div ref={containerRef} className={s.viewerContainer}>
          {mode === 'figma' ? (
            <div className={s.figmaStage}>
              <div className={s.figmaControlsBar}>
                <div className={s.figmaControlItem}>
                  <strong style={{ color: 'var(--accent)' }}>Figma Mockup:</strong>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ fontSize: 11 }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const reader = new FileReader();
                        reader.onload = () => setFigmaSrc(reader.result as string);
                        reader.readAsDataURL(f);
                      }
                    }}
                  />
                </div>
                {figmaSrc && (
                  <>
                    <div className={s.figmaControlItem}>
                      <span>Opaklık: {figmaOpacity}%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={figmaOpacity}
                        onChange={(e) => setFigmaOpacity(Number(e.target.value))}
                        className={s.figmaSlider}
                      />
                    </div>
                    <div className={s.figmaControlItem}>
                      <span>Harmanlama:</span>
                      <select
                        value={figmaBlend}
                        onChange={(e) => setFigmaBlend(e.target.value as any)}
                        style={{ fontSize: 11, padding: '2px 6px', background: '#222', color: '#fff' }}
                      >
                        <option value="normal">Normal</option>
                        <option value="difference">Fark (Difference)</option>
                        <option value="overlay">Overlay</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      className={s.actionBtn}
                      onClick={() => setFigmaSrc('')}
                      style={{ fontSize: 11 }}
                    >
                      Mockup'ı Kaldır
                    </button>
                  </>
                )}
              </div>

              {figmaSrc ? (
                <div
                  className={s.figmaStageBox}
                  style={{
                    width: Math.round(sizeA.width * sideScaleA),
                    height: Math.round(sizeA.height * sideScaleA),
                  }}
                >
                  <iframe
                    key={`figma-a-${vpA.id}-${orientA}`}
                    src={vpA.url || 'about:blank'}
                    style={{
                      width: sizeA.width,
                      height: sizeA.height,
                      transformOrigin: 'top left',
                      transform: `scale(${sideScaleA})`,
                      border: 'none',
                      display: 'block',
                    }}
                    title="Live DOM Viewport"
                  />
                  <img
                    src={figmaSrc}
                    alt="Figma Spec Overlay"
                    className={s.figmaOverlayImg}
                    style={{
                      opacity: figmaOpacity / 100,
                      mixBlendMode: figmaBlend,
                    }}
                  />
                </div>
              ) : (
                <div className={s.figmaDropzone}>
                  <span style={{ fontSize: 40 }}>🎨</span>
                  <h4 style={{ margin: 0, fontSize: 16 }}>Figma Mockup Görseli Yükleyin</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    Tasarım mockup'ınızı (PNG veya SVG) yükleyerek canlı {profA?.name || 'cihaz'} üzerinde piksel piksel karşılaştırın.
                  </p>
                  <label
                    className={s.actionBtn}
                    style={{ cursor: 'pointer', padding: '8px 18px', fontSize: 13, background: 'var(--accent)', color: '#000', fontWeight: 600, marginTop: 8 }}
                  >
                    Dosya Seçin (PNG / SVG)
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const reader = new FileReader();
                          reader.onload = () => setFigmaSrc(reader.result as string);
                          reader.readAsDataURL(f);
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          ) : mode === 'split' ? (
            /* =========================================================
               1. DUAL-SPLIT RESIZABLE VIEW
               Both devices render 100% complete and scale smoothly!
               ========================================================= */
            <div ref={splitRef} className={s.splitDualStage}>
              {/* Left Pane (Device A - Completely Rendered) */}
              <div
                className={s.splitPane}
                style={{ width: `${splitPercent}%` }}
              >
                <div className={s.paneHeader}>
                  <div className={s.paneTitle}>
                    <span>{getDeviceIcon(profA?.category)}</span>
                    <span>A: {profA?.name}</span>
                  </div>
                  <div className={s.paneMeta}>
                    <span>
                      {sizeA.width}×{sizeA.height} ({Math.round(splitScaleA * 100)}%)
                    </span>
                    <button
                      type="button"
                      className={s.paneActionBtn}
                      onClick={() => setOrientA((o) => (o === 'portrait' ? 'landscape' : 'portrait'))}
                      title="Yön değiştir"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                <div className={s.paneBody}>
                  <div
                    className={s.deviceFrame}
                    style={{
                      width: sizeA.width * splitScaleA,
                      height: sizeA.height * splitScaleA,
                    }}
                  >
                    <iframe
                      key={`dual-split-a-${vpA.id}-${orientA}`}
                      src={vpA.url || 'about:blank'}
                      style={{
                        width: sizeA.width,
                        height: sizeA.height,
                        transformOrigin: 'top left',
                        transform: `scale(${splitScaleA})`,
                        pointerEvents: isDragging ? 'none' : 'auto',
                        border: 'none',
                        display: 'block',
                      }}
                      title="Compare Device A"
                    />
                  </div>
                </div>
              </div>

              {/* Right Pane (Device B - Completely Rendered) */}
              <div
                className={s.splitPane}
                style={{ width: `${100 - splitPercent}%` }}
              >
                <div className={s.paneHeader}>
                  <div className={s.paneTitle}>
                    <span>{getDeviceIcon(profB?.category)}</span>
                    <span>B: {profB?.name}</span>
                  </div>
                  <div className={s.paneMeta}>
                    <span>
                      {sizeB.width}×{sizeB.height} ({Math.round(splitScaleB * 100)}%)
                    </span>
                    <button
                      type="button"
                      className={s.paneActionBtn}
                      onClick={() => setOrientB((o) => (o === 'portrait' ? 'landscape' : 'portrait'))}
                      title="Yön değiştir"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                <div className={s.paneBody}>
                  <div
                    className={s.deviceFrame}
                    style={{
                      width: sizeB.width * splitScaleB,
                      height: sizeB.height * splitScaleB,
                    }}
                  >
                    <iframe
                      key={`dual-split-b-${vpB.id}-${orientB}`}
                      src={vpB.url || 'about:blank'}
                      style={{
                        width: sizeB.width,
                        height: sizeB.height,
                        transformOrigin: 'top left',
                        transform: `scale(${splitScaleB})`,
                        pointerEvents: isDragging ? 'none' : 'auto',
                        border: 'none',
                        display: 'block',
                      }}
                      title="Compare Device B"
                    />
                  </div>
                </div>
              </div>

              {/* Center Draggable Divider */}
              <div
                className={s.splitDividerBar}
                style={{ left: `${splitPercent}%` }}
                onPointerDown={handleDividerPointerDown}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  snapTo50();
                }}
                title="Sürükleyerek genişliği ayarlayın veya çift tıklayarak eşitleyin (%50)"
              >
                <div
                  className={s.splitDividerHandle}
                  onPointerDown={handleDividerPointerDown}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    snapTo50();
                  }}
                >
                  ↔
                </div>
              </div>

              {/* Bottom Quick-Snap Floating Pills */}
              <div className={s.bottomFloatingBar}>
                <button
                  type="button"
                  className={`${s.snapPill} ${splitPercent >= 65 ? s.snapPillActive : ''}`}
                  onClick={snapFocusA}
                  title="A Cihazına Odaklan (%75)"
                >
                  ◀ {profA?.name} (%{Math.round(splitPercent)})
                </button>
                <button
                  type="button"
                  className={`${s.snapPill} ${Math.abs(splitPercent - 50) < 3 ? s.snapPillActive : ''}`}
                  onClick={snapTo50}
                  title="Eşit Böl (%50 / %50)"
                >
                  🎯 50 / 50
                </button>
                <button
                  type="button"
                  className={`${s.snapPill} ${splitPercent <= 35 ? s.snapPillActive : ''}`}
                  onClick={snapFocusB}
                  title="B Cihazına Odaklan (%75)"
                >
                  (%{Math.round(100 - splitPercent)}) {profB?.name} ▶
                </button>
              </div>
            </div>
          ) : mode === 'curtain' ? (
            /* =========================================================
               2. PROPORTIONAL OVERLAY / CURTAIN VIEW
               Narrow phone on left, wide laptop on right, full 100% vertical height
               ========================================================= */
            <div
              ref={curtainRef}
              className={s.curtainProportionalStage}
              style={{
                width: curtainStageW,
                height: curtainStageH,
              }}
              onClick={(e) => {
                if (!curtainRef.current) return;
                const rect = curtainRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = Math.max(10, Math.min(90, (x / rect.width) * 100));
                setSplitPercent(pct);
              }}
            >
              {/* Left Pane: Device A (e.g. Phone - Narrow) */}
              <div
                className={s.curtainPaneA}
                style={{ width: `${splitPercent}%` }}
              >
                <div className={s.curtainHeaderA}>
                  <div className={s.curtainTitle}>
                    {getDeviceIcon(profA?.category)} A: {profA?.name}
                  </div>
                  <span className={s.curtainBadgeDims}>
                    {sizeA.width}×{sizeA.height}
                  </span>
                </div>
                <div className={s.curtainFrameBox}>
                  <iframe
                    key={`curtain-a-${vpA.id}-${orientA}`}
                    src={vpA.url || 'about:blank'}
                    style={{
                      width: sizeA.width,
                      height: Math.round(curtainStageH / curtainFitScale),
                      transformOrigin: 'top left',
                      transform: `scale(${curtainFitScale})`,
                      pointerEvents: isDragging ? 'none' : 'auto',
                      border: 'none',
                      display: 'block',
                    }}
                    title="Curtain Viewport A"
                  />
                </div>
              </div>

              {/* Right Pane: Device B (e.g. Laptop - Wide) */}
              <div
                className={s.curtainPaneB}
                style={{ width: `${100 - splitPercent}%` }}
              >
                <div className={s.curtainHeaderB}>
                  <div className={s.curtainTitle}>
                    {getDeviceIcon(profB?.category)} B: {profB?.name}
                  </div>
                  <span className={s.curtainBadgeDims}>
                    {sizeB.width}×{sizeB.height}
                  </span>
                </div>
                <div className={s.curtainFrameBox}>
                  <iframe
                    key={`curtain-b-${vpB.id}-${orientB}`}
                    src={vpB.url || 'about:blank'}
                    style={{
                      width: sizeB.width,
                      height: Math.round(curtainStageH / curtainFitScale),
                      transformOrigin: 'top left',
                      transform: `scale(${curtainFitScale})`,
                      pointerEvents: isDragging ? 'none' : 'auto',
                      border: 'none',
                      display: 'block',
                    }}
                    title="Curtain Viewport B"
                  />
                </div>
              </div>

              {/* Draggable Divider Handle */}
              <div
                className={s.curtainDivider}
                style={{ left: `${splitPercent}%` }}
                onPointerDown={handleDividerPointerDown}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  snapToNatural();
                }}
                title="Sürükleyin veya çift tıklayarak doğal cihaz oranına eşitleyin"
              >
                <div className={s.curtainDividerTag}>
                  ◀ {profA?.name} | {profB?.name} ▶
                </div>
                <div
                  className={s.curtainHandle}
                  onPointerDown={handleDividerPointerDown}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    snapToNatural();
                  }}
                >
                  ↔
                </div>
              </div>

              {/* Bottom Badges & Controls */}
              <div className={s.bottomFloatingBar}>
                <button
                  type="button"
                  className={s.paneActionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOrientA((o) => (o === 'portrait' ? 'landscape' : 'portrait'));
                  }}
                  title="A Cihazının Yönünü Değiştir"
                >
                  🔄 A
                </button>
                <button
                  type="button"
                  className={`${s.snapPill} ${Math.abs(splitPercent - naturalRatioA) < 2 ? s.snapPillActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    snapToNatural();
                  }}
                  title="Cihazların gerçek fiziksel boyut oranına eşitle"
                >
                  📱 Doğal Cihaz Oranı (%{naturalRatioA} / %{100 - naturalRatioA})
                </button>
                <button
                  type="button"
                  className={`${s.snapPill} ${Math.abs(splitPercent - 50) < 2 ? s.snapPillActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    snapTo50();
                  }}
                  title="Eşit Böl (%50 / %50)"
                >
                  🎯 %50 / %50
                </button>
                <button
                  type="button"
                  className={s.paneActionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOrientB((o) => (o === 'portrait' ? 'landscape' : 'portrait'));
                  }}
                  title="B Cihazının Yönünü Değiştir"
                >
                  🔄 B
                </button>
                <button
                  type="button"
                  className={s.snapPill}
                  style={{ background: 'rgba(56, 189, 248, 0.25)', borderColor: '#38bdf8', color: '#38bdf8', fontWeight: 700 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMode('split');
                  }}
                  title="İki cihazı bağımsız pencerede görmek için Dual Split moduna geçin"
                >
                  ⫴ Dual Split
                </button>
              </div>
            </div>
          ) : (
            /* =========================================================
               3. SIDE-BY-SIDE VIEW
               ========================================================= */
            <div ref={sideRef} className={s.sideBySideStage}>
              {/* Card A */}
              <div className={s.sideCard}>
                <div className={s.sideCardHeader}>
                  <span>
                    {getDeviceIcon(profA?.category)} A: {profA?.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>
                      {sizeA.width}×{sizeA.height} ({Math.round(sideScaleA * 100)}%)
                    </span>
                    <button
                      type="button"
                      className={s.paneActionBtn}
                      onClick={() => setOrientA((o) => (o === 'portrait' ? 'landscape' : 'portrait'))}
                      title="Yön değiştir"
                    >
                      🔄
                    </button>
                  </div>
                </div>
                <div
                  className={s.sideFrame}
                  style={{
                    width: Math.round(sizeA.width * sideScaleA),
                    height: Math.round(sizeA.height * sideScaleA),
                  }}
                >
                  <iframe
                    key={`side-a-${vpA.id}-${orientA}`}
                    src={vpA.url || 'about:blank'}
                    style={{
                      width: sizeA.width,
                      height: sizeA.height,
                      transformOrigin: 'top left',
                      transform: `scale(${sideScaleA})`,
                      border: 'none',
                      display: 'block',
                    }}
                    title="Side Viewport A"
                  />
                </div>
              </div>

              {/* Card B */}
              <div className={s.sideCard}>
                <div className={s.sideCardHeader}>
                  <span>
                    {getDeviceIcon(profB?.category)} B: {profB?.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>
                      {sizeB.width}×{sizeB.height} ({Math.round(sideScaleB * 100)}%)
                    </span>
                    <button
                      type="button"
                      className={s.paneActionBtn}
                      onClick={() => setOrientB((o) => (o === 'portrait' ? 'landscape' : 'portrait'))}
                      title="Yön değiştir"
                    >
                      🔄
                    </button>
                  </div>
                </div>
                <div
                  className={s.sideFrame}
                  style={{
                    width: Math.round(sizeB.width * sideScaleB),
                    height: Math.round(sizeB.height * sideScaleB),
                  }}
                >
                  <iframe
                    key={`side-b-${vpB.id}-${orientB}`}
                    src={vpB.url || 'about:blank'}
                    style={{
                      width: sizeB.width,
                      height: sizeB.height,
                      transformOrigin: 'top left',
                      transform: `scale(${sideScaleB})`,
                      border: 'none',
                      display: 'block',
                    }}
                    title="Side Viewport B"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
