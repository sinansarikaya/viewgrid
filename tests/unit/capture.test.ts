import { describe, expect, it } from 'vitest';
import { captureFileName, cropRectInImage, imageScale } from '../../src/core/capture/crop';

describe('capture crop math', () => {
  it('computes HiDPI image scale', () => {
    expect(imageScale(2560, 1280)).toBe(2);
    expect(imageScale(1280, 0)).toBe(1);
  });

  it('crops with DPR scale and clamps to image bounds', () => {
    // image 2000×1000 (scale 2 vs 1000×500 css viewport)
    const r = cropRectInImage(2000, 1000, { x: 10, y: 20, width: 200, height: 100 }, 2);
    expect(r).toEqual({ x: 20, y: 40, width: 400, height: 200 });
  });

  it('clamps partially-offscreen rects', () => {
    const r = cropRectInImage(1000, 500, { x: -50, y: -10, width: 300, height: 120 }, 1);
    expect(r).toEqual({ x: 0, y: 0, width: 250, height: 110 });
  });

  it('rejects fully-offscreen / degenerate rects', () => {
    expect(cropRectInImage(1000, 500, { x: 5000, y: 0, width: 100, height: 100 }, 1)).toBeNull();
    expect(cropRectInImage(1000, 500, { x: 10, y: 10, width: 0.5, height: 0.5 }, 1)).toBeNull();
  });

  it('builds safe filenames', () => {
    const name = captureFileName({ device: 'iPhone 15 Pro / Max', w: 393, h: 852, ext: 'png', ts: 0 });
    expect(name).toMatch(/^viewgrid_iPhone_15_Pro_Max_393x852_\d{8}-\d{6}\.png$/);
  });
});
