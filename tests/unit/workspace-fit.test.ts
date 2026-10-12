import { describe, expect, it } from 'vitest';
import { fitGridZooms, fitWorkspaceZoom } from '../../src/core/workspace/fit';

describe('workspace display fit', () => {
  it('balances mixed devices without distorting or mutating CSS viewports', () => {
    const devices = [{width:393,height:852},{width:820,height:1180},{width:1280,height:800},{width:1920,height:1080}];
    const original = JSON.stringify(devices);
    const zooms = fitGridZooms(devices, {width:1600,height:1000});
    const heights = devices.map((device,index) => device.height * zooms[index]!);
    expect(Math.max(...heights) / Math.min(...heights)).toBeLessThan(1.3);
    expect(zooms[0]).toBeGreaterThan(zooms[3]!);
    expect(JSON.stringify(devices)).toBe(original);
    expect(fitGridZooms([], {width:100,height:100})).toEqual([]);
    const boundarySizes = Array.from({ length: 4 }, () => ({ width: 400, height: 400 }));
    expect(fitGridZooms(boundarySizes, {width:724,height:1000})).toEqual([0.35,0.35,0.35,0.35]);
    expect(fitGridZooms(boundarySizes, {width:725,height:1000})).toEqual([0.7,0.7,0.7,0.7]);
  });
  const sizes = Array.from({ length: 4 }, () => ({ width: 400, height: 800 }));
  it('uses actual canvas dimensions and does not mutate CSS sizes', () => {
    const before = JSON.stringify(sizes);
    expect(fitWorkspaceZoom(sizes, { width: 1000, height: 700 }, 'grid')).toBe(0.3);
    expect(JSON.stringify(sizes)).toBe(before);
  });
  it('fits row and column geometry independently', () => {
    expect(fitWorkspaceZoom(sizes, { width: 2000, height: 1000 }, 'row')).toBe(1.05);
    expect(fitWorkspaceZoom(sizes, { width: 2000, height: 1000 }, 'col')).toBe(0.2);
  });
  it('honours supported display scale limits', () => {
    expect(fitWorkspaceZoom([{ width: 100, height: 100 }], { width: 9000, height: 9000 }, 'grid')).toBe(1.2);
    expect(fitWorkspaceZoom(sizes, { width: 100, height: 100 }, 'grid')).toBe(0.2);
  });
});
