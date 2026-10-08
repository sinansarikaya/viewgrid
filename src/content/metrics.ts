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
    const result = (['auto', 'scroll'].includes(cs.overflowX) && parent.scrollWidth > parent.clientWidth + 1) || clippedAncestor(parent);
    clip.set(el, result); return result;
  }
  function fullyClipped(el: Element, rect: DOMRect): boolean {
    for (let parent = el.parentElement; parent && parent !== doc.body && parent !== doc.documentElement; parent = parent.parentElement) {
      const cs = win.getComputedStyle(parent), bounds = parent.getBoundingClientRect();
      if (['hidden', 'clip', 'auto', 'scroll'].includes(cs.overflowX) && (rect.right <= bounds.left || rect.left >= bounds.right)) return true;
      if (['hidden', 'clip', 'auto', 'scroll'].includes(cs.overflowY) && (rect.bottom <= bounds.top || rect.top >= bounds.bottom)) return true;
    }
    return false;
  }
  const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
  function elementLabel(el: Element): string {
    const referenced = normalize((el.getAttribute('aria-labelledby') || '').split(/\s+/).map(id => doc.getElementById(id)?.textContent || '').join(' '));
    const nativeLabels = 'labels' in el ? Array.from((el as HTMLInputElement).labels || []).map(label => label.textContent).join(' ') : '';
    return (referenced || normalize(el.getAttribute('aria-label')) || normalize(nativeLabels) || normalize(el.textContent) ||
      normalize(Array.from(el.querySelectorAll('img[alt]')).map(img => img.getAttribute('alt')).join(' ')) ||
      normalize(el.getAttribute('title')) || normalize(el.getAttribute('placeholder')) ||
      (el.matches('input[type="button"],input[type="submit"],input[type="reset"]') ? normalize((el as HTMLInputElement).value) : '') ||
      normalize(el.querySelector('svg[aria-label]')?.getAttribute('aria-label')) ||
      (el.matches('a[href]') ? `Link to ${(el as HTMLAnchorElement).href}` : el.tagName.toLowerCase())).slice(0, 160);
  }
  function inlineProseLink(el: Element, display: string): boolean {
    const parent = el.parentElement;
    if (!el.matches('a[href]') || display !== 'inline' || !parent || parent.closest('nav,[role="navigation"]')) return false;
    return Array.from(parent.childNodes).some(node => {
      if (node === el || !normalize(node.textContent)) return false;
      if (node.nodeType === 3) return true;
      if (node.nodeType !== 1) return false;
      const sibling = node as Element;
      return sibling.matches('span,strong,em,small,code') && !sibling.matches('a[href],button,[role="button"],[role="link"]') && !sibling.querySelector('a[href],button,input,select,textarea');
    });
  }
  for (const el of all.slice(0, limit)) {
    if (el.closest('[data-viewgrid-overlay]') || isHidden(el)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || fullyClipped(el, rect)) continue;
    const cs = win.getComputedStyle(el);
    // Ignore off-canvas UI, clipped map tiles and intentional ellipsis.
    const intentional = cs.textOverflow === 'ellipsis' || Number(cs.getPropertyValue('-webkit-line-clamp')) > 0;
    const nestedDecoration = !el.matches('a[href],button,input,select,textarea,summary,label') && !!el.parentElement?.closest('a[href],button,summary');
    const labelledControl = el.tagName === 'LABEL' ? (el as HTMLLabelElement).control : null;
    const interactive = (el.matches('a[href],button,input:not([type="hidden"]),select,textarea,summary,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"])') || !!labelledControl) && !el.matches(':disabled') && el.getAttribute('aria-disabled') !== 'true' && !labelledControl?.matches(':disabled') && !el.closest('[inert]') && !nestedDecoration;
    const directText = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent ?? '').join(' ').trim();
    const clipsText = (['hidden', 'clip'].includes(cs.overflowX) && el.scrollWidth > el.clientWidth + 2) || (['hidden', 'clip'].includes(cs.overflowY) && el.scrollHeight > el.clientHeight + 2);
    const measuredText = directText || (clipsText && el.matches('p,h1,h2,h3,h4,h5,h6,button,a,label,span,strong,em,small,code,pre') ? el.textContent?.trim() || '' : '');
    if (!interactive && !measuredText && rect.right <= win.innerWidth + 1) continue;
    elements.push({
      selector: selectorPath(el), tag: el.tagName.toLowerCase(),
      // Document coordinates prevent horizontal scroll position changing diagnoses.
      rect: { x: rect.x + win.scrollX, y: rect.y + win.scrollY, width: rect.width, height: rect.height },
      text: measuredText.slice(0, 120), overflowX: cs.overflowX, overflowY: cs.overflowY,
      scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, insideHorizontalScroller: clippedAncestor(el),
      scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
      isInteractive: interactive, intentionallyClipped: intentional,
      label: interactive ? elementLabel(el) : undefined,
      componentKey: interactive && el.parentElement ? `${selectorPath(el.parentElement)}>${el.tagName.toLowerCase()}:${el.getAttribute('role') || ''}:${[...el.classList].sort().join('.')}` : undefined,
      actionKey: el.matches('a[href]') ? `url:${(el as HTMLAnchorElement).href}` : labelledControl ? `control:${selectorPath(labelledControl)}` : el.matches('input,select,textarea') ? `control:${selectorPath(el)}` : undefined,

      inlineTextLink: inlineProseLink(el, cs.display),
    });
  }
  return {
    innerWidth: win.innerWidth, innerHeight: win.innerHeight,
    scrollWidth: doc.documentElement.scrollWidth, scrollHeight: doc.documentElement.scrollHeight,
    elements, checkTapTargets, scannedElements: Math.min(limit, all.length), truncated: all.length > limit,
  };
}
