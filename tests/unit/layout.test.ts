import { describe, expect, it } from 'vitest';
import {
  autoAlignPositions,
  calculateSnapGuides,
  canAddViewports,
  clampZoom,
  displayedSize,
  effectiveSize,
  gridColumns,
  moveViewport,
  swapOrientation,
} from '../../src/core/workspace/layout';
import { MAX_VIEWPORTS, VIEWPORT_WARN, type DeviceProfile } from '../../src/core/types';

const dev = (w: number, h: number): DeviceProfile => ({
  id: 'x',
  name: 'X',
  category: 'phone',
  width: w,
  height: h,
  devicePixelRatio: 2,
  userAgent: 'ua',
  touchSupport: true,
  mobile: true,
  defaultOrientation: 'portrait',
  safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
  deviceFrame: { type: 'none', notch: 'none', statusBar: 'none' },
});

describe('viewport math', () => {
  it('swaps logical size on orientation', () => {
    const p = dev(390, 844);
    expect(effectiveSize(p, 'portrait')).toEqual({ width: 390, height: 844 });
    expect(effectiveSize(p, 'landscape')).toEqual({ width: 844, height: 390 });
    const laptop = dev(1280, 800);
    expect(effectiveSize(laptop, 'landscape')).toEqual({ width: 1280, height: 800 });
    expect(effectiveSize(laptop, 'portrait')).toEqual({ width: 800, height: 1280 });
    expect(swapOrientation('portrait')).toBe('landscape');
    expect(swapOrientation('landscape')).toBe('portrait');
  });

  it('clamps zoom and scales display size (logical unchanged)', () => {
    expect(clampZoom(0)).toBe(0.1);
    expect(clampZoom(99)).toBe(3);
    expect(clampZoom(Number.NaN)).toBe(1);
    expect(displayedSize({ width: 390, height: 844 }, 0.5)).toEqual({ width: 195, height: 422 });
    expect(displayedSize({ width: 390, height: 844 }, 1)).toEqual({ width: 390, height: 844 });
  });

  it('enforces the viewport governor', () => {
    expect(canAddViewports(0, 4).ok).toBe(true);
    expect(canAddViewports(VIEWPORT_WARN - 1, 1).warn).toBe(false);
    expect(canAddViewports(VIEWPORT_WARN, 1).warn).toBe(true);
    expect(canAddViewports(MAX_VIEWPORTS - 1, 2).ok).toBe(false);
    expect(canAddViewports(MAX_VIEWPORTS - 1, 1).ok).toBe(true);
  });

  it('reorders without mutation', () => {
    const list = ['a', 'b', 'c'];
    const next = moveViewport(list, 0, 2);
    expect(next).toEqual(['b', 'c', 'a']);
    expect(list).toEqual(['a', 'b', 'c']);
  });

  it('computes grid columns', () => {
    expect(gridColumns(4, 'grid')).toBe(2);
    expect(gridColumns(4, 'row')).toBe(4);
    expect(gridColumns(4, 'col')).toBe(1);
  });

  it('calculates auto-aligned matrix grid positions with aligned column edges', () => {
    const items = [
      { id: 'v1', width: 400, height: 800 },
      { id: 'v2', width: 1920, height: 1080 },
      { id: 'v3', width: 800, height: 1100 },
      { id: 'v4', width: 1280, height: 800 },
    ];
    const posMap = autoAlignPositions(items, 2, 40, 40, 24, 24);

    // Row 0: v1 (col 0), v2 (col 1)
    // Row 1: v3 (col 0), v4 (col 1)
    // Row 0 max height = max(800, 1080) = 1080.
    // Row 1 starts at 24 + 1080 + 40 = 1144.
    expect(posMap.get('v1')).toEqual({ x: 24, y: 24 });
    expect(posMap.get('v3')).toEqual({ x: 24, y: 1144 }); // left edge aligned at x=24
    expect(posMap.get('v2')).toEqual({ x: 864, y: 24 });
    expect(posMap.get('v4')).toEqual({ x: 864, y: 1144 }); // left edge aligned at x=864
  });

  it('snaps dragging target magnetically to neighboring viewport edges', () => {
    const others = [{ id: 'other', x: 100, y: 100, width: 400, height: 600 }];

    // Near left edge (candidate x=105 -> snap to 100)
    const target = { x: 105, y: 200, width: 300, height: 500 };
    const res = calculateSnapGuides(target, others, 10);
    expect(res.x).toBe(100);
    expect(res.guides.some((g) => g.type === 'v' && g.pos === 100)).toBe(true);
  });
});
