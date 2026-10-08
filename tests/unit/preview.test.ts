import { describe, expect, it, vi } from 'vitest';
import { uncachedHeaders, workerRemovalOptions } from '../../src/core/security/preview';
import { applyScrollRatios } from '../../src/core/sync/protocol';

describe('cached preview preparation', () => {
  it('uses an exact Chromium origin, including scheme and port', () => {
    expect(workerRemovalOptions('https://castpost.app/en?x=1', false)).toEqual({ origins: ['https://castpost.app'] });
    expect(workerRemovalOptions('http://localhost:3000/', false)).toEqual({ origins: ['http://localhost:3000'] });
  });
  it('uses a filtered Firefox hostname instead of an ignored origins option', () => {
    expect(workerRemovalOptions('https://castpost.app/en', true)).toEqual({ hostnames: ['castpost.app'] });
  });
  it('never clears global browsing data for an invalid URL', () => {
    for (const url of ['', '*://*/*', 'file:///tmp/x', 'javascript:alert(1)', 'data:text/html,x']) expect(() => workerRemovalOptions(url, false)).toThrow();
  });
  it('bypasses cached headers without changing cookies or authentication', () => {
    const cookie = { name: 'Cookie', value: 'session=keep' }, authorization = { name: 'Authorization', value: 'Bearer keep' };
    const result = uncachedHeaders([cookie, authorization, { name: 'cache-control', value: 'max-age=3600' }]);
    expect(result).toContainEqual(cookie); expect(result).toContainEqual(authorization);
    expect(result).toContainEqual({ name: 'Cache-Control', value: 'no-cache' });
    expect(result.filter(header => header.name.toLowerCase() === 'cache-control')).toHaveLength(1);
    expect(uncachedHeaders([], true)).toEqual([{ name: 'Cache-Control', value: 'no-store' }]);
  });
});

describe('instant scroll replay', () => {
  it('overrides a site CSS smooth-scrolling animation', () => {
    const scrollTo = vi.fn();
    applyScrollRatios({ scrollTo, document: { documentElement: { scrollWidth: 1200, clientWidth: 200, scrollHeight: 2400, clientHeight: 400 } } as Document }, { xRatio: 0.25, yRatio: 0.5 });
    expect(scrollTo).toHaveBeenCalledWith({ left: 250, top: 1000, behavior: 'instant' });
  });
});
