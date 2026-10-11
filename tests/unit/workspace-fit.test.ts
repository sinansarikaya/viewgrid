import { describe, expect, it } from 'vitest';
import { fitWorkspaceZoom } from '../../src/core/workspace/fit';

describe('workspace display fit', () => {
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
