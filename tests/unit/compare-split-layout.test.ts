import { describe, expect, it } from 'vitest';

describe('P2-10: Compare / Split Layout Calculation & Bounds Verification', () => {
  function computeDualSplit(
    stageSize: { width: number; height: number },
    splitPercent: number,
    sizeA: { width: number; height: number },
    sizeB: { width: number; height: number },
  ) {
    const availStageW = Math.max(300, stageSize.width);
    const availStageH = Math.max(200, stageSize.height);

    const paneWidthA = (availStageW * splitPercent) / 100;
    const paneWidthB = (availStageW * (100 - splitPercent)) / 100;

    const usableWA = Math.max(50, paneWidthA - 32);
    const usableWB = Math.max(50, paneWidthB - 32);
    const usableH = Math.max(50, availStageH - 74);

    const splitScaleA = Math.min(1, Math.max(0.1, usableWA / sizeA.width), Math.max(0.1, usableH / sizeA.height));
    const splitScaleB = Math.min(1, Math.max(0.1, usableWB / sizeB.width), Math.max(0.1, usableH / sizeB.height));

    const renderedWidthA = sizeA.width * splitScaleA;
    const renderedHeightA = sizeA.height * splitScaleA;

    const renderedWidthB = sizeB.width * splitScaleB;
    const renderedHeightB = sizeB.height * splitScaleB;

    return {
      paneWidthA,
      paneWidthB,
      usableWA,
      usableWB,
      usableH,
      splitScaleA,
      splitScaleB,
      renderedWidthA,
      renderedHeightA,
      renderedWidthB,
      renderedHeightB,
    };
  }

  const stage = { width: 1200, height: 700 };
  const iPhone15Pro = { width: 393, height: 852 };
  const desktop1080p = { width: 1920, height: 1080 };

  it('50/50 split: fits both iPhone and Desktop completely inside their respective panes with ZERO clipping', () => {
    const res = computeDualSplit(stage, 50, iPhone15Pro, desktop1080p);

    // Left pane (iPhone 15 Pro)
    expect(res.paneWidthA).toBe(600);
    expect(res.renderedWidthA).toBeLessThanOrEqual(res.usableWA);
    expect(res.renderedHeightA).toBeLessThanOrEqual(res.usableH);
    expect(res.splitScaleA).toBeGreaterThan(0.5);

    // Right pane (Desktop 1080p)
    expect(res.paneWidthB).toBe(600);
    expect(res.renderedWidthB).toBeLessThanOrEqual(res.usableWB);
    expect(res.renderedHeightB).toBeLessThanOrEqual(res.usableH);
    // Desktop scale maintains 16:9 aspect ratio completely
    expect(res.renderedWidthB / res.renderedHeightB).toBeCloseTo(1920 / 1080, 2);
  });

  it('75/25 split (Phone focus): expands iPhone while keeping Desktop intact in remaining space', () => {
    const res = computeDualSplit(stage, 75, iPhone15Pro, desktop1080p);

    expect(res.paneWidthA).toBe(900);
    expect(res.paneWidthB).toBe(300);

    // iPhone gets larger zoom
    expect(res.splitScaleA).toBeCloseTo(res.usableH / iPhone15Pro.height, 2);
    expect(res.renderedWidthA).toBeLessThanOrEqual(res.usableWA);
    expect(res.renderedHeightA).toBeLessThanOrEqual(res.usableH);

    // Desktop shrinks to fit into 300px without clipping
    expect(res.renderedWidthB).toBeLessThanOrEqual(res.usableWB);
    expect(res.renderedHeightB).toBeLessThanOrEqual(res.usableH);
  });

  it('25/75 split (Desktop focus): expands Desktop while keeping iPhone intact in remaining space', () => {
    const res = computeDualSplit(stage, 25, iPhone15Pro, desktop1080p);

    expect(res.paneWidthA).toBe(300);
    expect(res.paneWidthB).toBe(900);

    // Desktop gets significantly larger zoom
    expect(res.renderedWidthB).toBeCloseTo(res.usableWB, 1);
    expect(res.renderedWidthB).toBeLessThanOrEqual(res.usableWB);
    expect(res.renderedHeightB).toBeLessThanOrEqual(res.usableH);

    // iPhone fits in 300px
    expect(res.renderedWidthA).toBeLessThanOrEqual(res.usableWA);
    expect(res.renderedHeightA).toBeLessThanOrEqual(res.usableH);
  });

  it('Orientation flip: correctly recalculates dimensions when rotated to landscape', () => {
    const iPhoneLandscape = { width: 852, height: 393 };
    const res = computeDualSplit(stage, 50, iPhoneLandscape, desktop1080p);

    expect(res.renderedWidthA).toBeLessThanOrEqual(res.usableWA);
    expect(res.renderedHeightA).toBeLessThanOrEqual(res.usableH);
    expect(res.renderedWidthA / res.renderedHeightA).toBeCloseTo(852 / 393, 2);
  });

  it('Curtain overlay mode: scales to fit comfortably without shrinking to tiny box', () => {
    const iPadAir = { width: 820, height: 1180 };
    const curtainStageW = Math.max(iPhone15Pro.width, iPadAir.width); // 820
    const curtainStageH = Math.max(iPhone15Pro.height, iPadAir.height); // 1180
    const maxCurtainW = Math.max(100, stage.width - 32);
    const maxCurtainH = Math.max(100, stage.height - 80);
    const curtainScale = Math.min(1, Math.max(0.2, maxCurtainW / curtainStageW), Math.max(0.2, maxCurtainH / curtainStageH));

    // Must be ~52% (620 / 1180 = 0.525), not 10%!
    expect(curtainScale).toBeGreaterThan(0.45);
    expect(curtainScale).toBeLessThanOrEqual(1.0);
    const renderedH = curtainStageH * curtainScale;
    expect(renderedH).toBeLessThanOrEqual(maxCurtainH);
    expect(renderedH).toBeGreaterThan(500);
  });

  it('Side-by-side mode: fits two devices side-by-side with generous, comfortable scale', () => {
    const iPadAir = { width: 820, height: 1180 };
    const sideUsableW = Math.max(100, (stage.width - 48) / 2 - 24);
    const sideUsableH = Math.max(100, stage.height - 64);
    const sideScaleA = Math.min(1, Math.max(0.15, sideUsableW / iPhone15Pro.width), Math.max(0.15, sideUsableH / iPhone15Pro.height));
    const sideScaleB = Math.min(1, Math.max(0.15, sideUsableW / iPadAir.width), Math.max(0.15, sideUsableH / iPadAir.height));

    // iPhone fits height-wise with > 70% scale
    expect(sideScaleA).toBeGreaterThan(0.65);
    // iPad fits height-wise with > 45% scale (not 10%!)
    expect(sideScaleB).toBeGreaterThan(0.45);

    // Both fit within their usable bounds
    expect(Math.round(iPhone15Pro.width * sideScaleA)).toBeLessThanOrEqual(sideUsableW);
    expect(Math.round(iPhone15Pro.height * sideScaleA)).toBeLessThanOrEqual(sideUsableH);
    expect(Math.round(iPadAir.width * sideScaleB)).toBeLessThanOrEqual(sideUsableW);
    expect(Math.round(iPadAir.height * sideScaleB)).toBeLessThanOrEqual(sideUsableH);
  });
});
