import { describe, expect, it } from 'vitest';
import { captureTiles } from '../../src/core/capture/tiles';
describe('full viewport capture planner', () => {
  it('covers the part of a viewport below the browser without clipping', () => {
    expect(captureTiles(390, 844, 1280, 720)).toEqual([{ x: 0, y: 0, width: 390, height: 720 }, { x: 0, y: 720, width: 390, height: 124 }]);
  });
  it('covers a large desktop with no gaps or overlaps', () => {
    const tiles = captureTiles(1920, 1080, 1280, 720);
    expect(tiles).toHaveLength(4);
    expect(tiles.reduce((n, t) => n + t.width * t.height, 0)).toBe(1920 * 1080);
  });
  it('rejects invalid dimensions and excessive allocations', () => {
    expect(() => captureTiles(10000, 10000, 1280, 720)).toThrow();
    expect(() => captureTiles(NaN, 10, 10, 10)).toThrow();
  });
});
