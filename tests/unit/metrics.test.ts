// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { collectMetrics } from '../../src/content/metrics';
(globalThis as any).CSS = { escape: (s: string) => s };
function measurable(el: Element, width = 30) {
  Object.defineProperty(el, 'getBoundingClientRect', { configurable: true, value: () => ({ x: 0, y: 0, left: 0, top: 0, bottom: 20, width, height: 20, right: width }) });
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
  it('keeps scroll container children measurable without suppressing tap targets', () => {
    document.body.innerHTML = '<div style="overflow-x:auto"><button id="tab">Tab</button></div>';
    document.querySelectorAll('*').forEach(el => measurable(el));
    Object.defineProperty(document.querySelector('div')!, 'scrollWidth', { configurable: true, value: 120 });
    const target = collectMetrics(document, window).elements.find(e => e.selector === '#tab');
    expect(target?.intentionallyClipped).toBe(false);
    expect(target?.insideHorizontalScroller).toBe(true);
  });
});

it('does not suppress small controls merely because a parent hides overflow', () => {
  document.body.innerHTML = '<div style="overflow-x:hidden"><button id="tiny">Buy</button><p id="clipped" style="overflow-x:hidden">Long text</p></div>';
  document.querySelectorAll('*').forEach(el => measurable(el));
  const metrics = collectMetrics(document, window);
  expect(metrics.elements.find(e => e.selector === '#tiny')?.intentionallyClipped).toBe(false);
  expect(metrics.elements.find(e => e.selector === '#clipped')?.intentionallyClipped).toBe(false);
});

it('excludes fully clipped off-canvas controls but detects clipped nested text', () => {
  document.body.innerHTML = '<div style="overflow-x:hidden"><button id="offscreen">Hidden</button></div><p id="nested" style="overflow-y:hidden"><span>Nested text</span></p>';
  document.querySelectorAll('*').forEach(el => measurable(el));
  const offscreen = document.querySelector('#offscreen')!;
  Object.defineProperty(offscreen, 'getBoundingClientRect', { value: () => ({ x: 100, y: 0, left: 100, right: 130, top: 0, bottom: 20, width: 30, height: 20 }) });
  const nested = document.querySelector('#nested')!;
  Object.defineProperty(nested, 'scrollHeight', { value: 60 });
  Object.defineProperty(nested, 'clientHeight', { value: 20 });
  const result = collectMetrics(document, window);
  expect(result.elements.some(e => e.selector === '#offscreen')).toBe(false);
  expect(result.elements.find(e => e.selector === '#nested')?.text).toBe('Nested text');
});

it('does not mistake decorative overflow on a section for text clipping', () => {
  document.body.innerHTML = '<section id="decorative" style="overflow-y:hidden"><div>Decorative card</div></section>';
  document.querySelectorAll('*').forEach(el => measurable(el));
  const section = document.querySelector('#decorative')!;
  Object.defineProperty(section, 'scrollHeight', { value: 200 });
  Object.defineProperty(section, 'clientHeight', { value: 20 });
  expect(collectMetrics(document, window).elements.find(e => e.selector === '#decorative')?.text).toBeUndefined();
});

it('collects nested labels, image names, native-label actions and component identity', () => {
  document.body.innerHTML = '<nav><button id="first" class="tab"><span>First tab</span></button><button id="second" class="tab" aria-label="Second tab"><svg></svg></button></nav><a id="logo" href="/"><img alt="CastPost home"></a><input id="check" type="checkbox"><label id="label" for="check">Allow notifications</label>';
  document.querySelectorAll('*').forEach(el => measurable(el));
  const m = collectMetrics(document, window);
  expect(m.elements.find(e => e.selector === '#first')?.label).toBe('First tab');
  expect(m.elements.find(e => e.selector === '#second')?.label).toBe('Second tab');
  expect(m.elements.find(e => e.selector === '#logo')?.label).toBe('CastPost home');
  expect(m.elements.find(e => e.selector === '#first')?.componentKey).toBe(m.elements.find(e => e.selector === '#second')?.componentKey);
  expect(m.elements.find(e => e.selector === '#check')?.actionKey).toBe(m.elements.find(e => e.selector === '#label')?.actionKey);
});
it('does not count nested interactive decorations and inert controls as targets', () => {
  document.body.innerHTML = '<button id="parent"><span role="button" id="nested">Icon</span></button><div inert><button id="inert">No</button></div>';
  document.querySelectorAll('*').forEach(el => measurable(el));
  expect(collectMetrics(document, window).elements.filter(e => e.isInteractive).map(e => e.selector)).toEqual(['#parent']);
});

it('retains a real nested control inside a custom interactive card', () => {
  document.body.innerHTML = '<div role="button" id="card"><button id="separate">Separate action</button></div>';
  document.querySelectorAll('*').forEach(el => measurable(el));
  expect(collectMetrics(document, window).elements.filter(e => e.isInteractive).map(e => e.selector)).toEqual(['#card', '#separate']);
});

it('recognizes inline prose in divs without exempting standalone or navigation links', () => {
  document.body.innerHTML = '<div>Need a custom plan? <a id="prose" href="/quote" style="display:inline">Request a quote</a></div><p><a id="alone" href="/buy" style="display:inline">Buy now</a></p><nav>Languages: <a id="nav" href="/tr" style="display:inline">TR</a></nav>';
  document.querySelectorAll('*').forEach(el => measurable(el));
  const m = collectMetrics(document, window);
  expect(m.elements.find(e => e.selector === '#prose')?.inlineTextLink).toBe(true);
  expect(m.elements.find(e => e.selector === '#alone')?.inlineTextLink).toBe(false);
  expect(m.elements.find(e => e.selector === '#nav')?.inlineTextLink).toBe(false);
});
