import type { MeasuredElement, PageMetrics } from '../core/types';
import { selectorPath } from '../core/sync/protocol';

/** One record per visible element. Deliberate clipping/scroll containers are not layout defects. */
export function collectMetrics(doc: Document, win: Window, checkTapTargets = true): PageMetrics {
  const elements: MeasuredElement[] = [];
  const all = Array.from(doc.body?.querySelectorAll('*') ?? []);
  const limit = 5000;
  const hidden = new WeakMap<Element, boolean>();
  const clip = new WeakMap<Element, boolean>();
  function isHidden(el: Element): boolean {
    const cached = hidden.get(el); if (cached !== undefined) return cached;
    const style = win.getComputedStyle(el);
    const result = el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true' || style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || style.opacity === '0' || (!!el.parentElement && isHidden(el.parentElement));
    hidden.set(el, result); return result;
  }
  function clippedAncestor(el: Element): boolean {
    const cached = clip.get(el); if (cached !== undefined) return cached;
    const parent = el.parentElement;
    if (!parent || parent === doc.body || parent === doc.documentElement) return false;
    const cs = win.getComputedStyle(parent);
    const result = ['hidden', 'clip', 'auto', 'scroll'].includes(cs.overflowX) || clippedAncestor(parent);
    clip.set(el, result); return result;
  }
  for (const el of all.slice(0, limit)) {
    if (el.closest('[data-viewgrid-overlay]') || isHidden(el)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    const cs = win.getComputedStyle(el);
    // Ignore off-canvas UI, clipped map tiles and intentional ellipsis.
    const intentional = clippedAncestor(el) || cs.textOverflow === 'ellipsis' || Number(cs.getPropertyValue('-webkit-line-clamp')) > 0;
    const interactive = el.matches('a[href],button,input:not([type="hidden"]),select,textarea,summary,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"])') && !el.matches(':disabled');
    const directText = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent ?? '').join(' ').trim();
    if (!interactive && !directText && rect.right <= win.innerWidth + 1) continue;
    elements.push({
      selector: selectorPath(el), tag: el.tagName.toLowerCase(),
      // Document coordinates prevent horizontal scroll position changing diagnoses.
      rect: { x: rect.x + win.scrollX, y: rect.y + win.scrollY, width: rect.width, height: rect.height },
      text: directText.slice(0, 120), overflowX: cs.overflowX,
      scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
      isInteractive: interactive, intentionallyClipped: intentional,
      inlineTextLink: el.matches('a[href]') && cs.display === 'inline' && !!el.closest('p,li,blockquote'),
    });
  }
  return {
    innerWidth: win.innerWidth, innerHeight: win.innerHeight,
    scrollWidth: doc.documentElement.scrollWidth, scrollHeight: doc.documentElement.scrollHeight,
    elements, checkTapTargets, scannedElements: Math.min(limit, all.length), truncated: all.length > limit,
  };
}
