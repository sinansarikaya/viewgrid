// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { collectMetrics } from '../../src/content/metrics';
(globalThis as any).CSS = { escape: (s: string) => s };
function measurable(el: Element, width = 30) {
  Object.defineProperty(el, 'getBoundingClientRect', { configurable: true, value: () => ({ x: 0, y: 0, width, height: 20, right: width }) });
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: width });
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: width });
}
describe('actual DOM collector', () => {
  it('does not count hidden controls and does not duplicate parent aggregate text', () => {
    document.body.innerHTML = '<div><button id="visible">Buy</button></div><div style="display:none"><button id="hidden">Hidden</button></div>';
    document.querySelectorAll('*').forEach(el => measurable(el));
    const metrics = collectMetrics(document, window);
    expect(metrics.elements.filter(e => e.isInteractive).map(e => e.selector)).toEqual(['#visible']);
    expect(metrics.elements.filter(e => e.text === 'Buy')).toHaveLength(1);
  });
  it('marks scroll container children as deliberately clipped', () => {
    document.body.innerHTML = '<div style="overflow-x:auto"><button id="tab">Tab</button></div>';
    document.querySelectorAll('*').forEach(el => measurable(el));
    expect(collectMetrics(document, window).elements.find(e => e.selector === '#tab')?.intentionallyClipped).toBe(true);
  });
});
