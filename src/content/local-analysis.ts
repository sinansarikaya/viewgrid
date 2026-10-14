import axe from 'axe-core';
import { buildLocalResult, localAudit, LOCAL_LIMITS, type LocalElement, type LocalSnapshot } from '../core/analysis/local-engine';
import type { AnalysisResult, NormalizedAudit } from '../core/analysis/schema';
import { localAnalysisUrlSchema } from '../lib/validation/local-analysis';

export interface LocalAnalysisOptions { requestedUrl: string; profile: 'mobile' | 'desktop'; locale: string; signal?: AbortSignal }
const attributes = ['name', 'content', 'href', 'rel', 'hreflang', 'type', 'role', 'alt', 'aria-label', 'aria-labelledby', 'id'] as const;
let axeRunning = false;
function abort(signal?: AbortSignal): void { if (signal?.aborted) throw new Error('ANALYSIS_CANCELLED'); }
async function yieldChunk(signal?: AbortSignal): Promise<void> { abort(signal); await new Promise<void>(resolve => setTimeout(resolve, 0)); abort(signal); }

/** Walk nodes incrementally instead of allocating an unbounded querySelectorAll result. */
async function collectSnapshot(doc: Document, signal?: AbortSignal): Promise<LocalSnapshot> {
  const snapshot: LocalSnapshot = { elements: [], truncated: false };
  const rows = new WeakMap<Node, LocalElement>();
  const walker = doc.createTreeWalker(doc.documentElement, 0xffffffff);
  let node: Node | null = doc.documentElement, visited = 0, characters = 0;
  while (node) {
    abort(signal);
    if (++visited > LOCAL_LIMITS.nodes || snapshot.elements.length >= LOCAL_LIMITS.elements) { snapshot.truncated = true; break; }
    if (node.nodeType === 1) {
      const element = node as Element, row: LocalElement = { tag: element.localName.toLowerCase().slice(0, 40), attrs: {}, text: '', clipped: false };
      for (const attribute of attributes) {
        const value = element.getAttribute(attribute);
        if (value !== null) {
          const remaining = Math.max(0, LOCAL_LIMITS.characters - characters);
          row.attrs[attribute] = value.slice(0, Math.min(LOCAL_LIMITS.attribute, remaining));
          characters += row.attrs[attribute]!.length;
          if (value.length > row.attrs[attribute]!.length) { row.clipped = true; snapshot.truncated = true; }
        }
      }
      rows.set(node, row); snapshot.elements.push(row);
      // Images can supply a link's accessible name without retaining the alt value in output.
      if (row.tag === 'img' && row.attrs.alt) {
        let ancestor = node.parentNode;
        for (let depth = 0; ancestor && depth < 32; depth++, ancestor = ancestor.parentNode) {
          const parent = rows.get(ancestor);
          if (parent?.tag === 'a') { parent.text = (parent.text + row.attrs.alt).slice(0, 512); break; }
        }
      }
    } else if (node.nodeType === 3) {
      const parent = node.parentNode as Element | null;
      if (parent?.nodeType === 1 && (['style', 'textarea'].includes(parent.localName) || (parent.localName === 'script' && parent.getAttribute('type')?.toLowerCase() !== 'application/ld+json'))) { node = walker.nextNode(); continue; }
      const raw = node.nodeValue ?? '', remaining = LOCAL_LIMITS.characters - characters;
      const value = raw.slice(0, Math.max(0, remaining)); characters += value.length;
      if (raw.length > value.length) snapshot.truncated = true;
      let ancestor = node.parentNode;
      for (let depth = 0; ancestor && depth < 32; depth++, ancestor = ancestor.parentNode) {
        const row = rows.get(ancestor);
        if (!row || (!['title', 'a', 'script'].includes(row.tag) && !row.attrs.id)) continue;
        const cap = row.tag === 'script' ? LOCAL_LIMITS.json : 512;
        if (row.tag === 'script' && row.attrs.type?.toLowerCase() !== 'application/ld+json') break;
        const available = Math.max(0, cap - row.text.length);
        row.text += value.slice(0, available);
        if (value.length > available || raw.length > value.length) row.clipped = true;
      }
      if (characters >= LOCAL_LIMITS.characters) { snapshot.truncated = true; break; }
    }
    if (visited % LOCAL_LIMITS.chunk === 0) await yieldChunk(signal);
    node = walker.nextNode();
  }
  return snapshot;
}

const axeRules = ['button-name', 'input-button-name', 'label', 'select-name', 'aria-allowed-attr', 'aria-valid-attr', 'aria-valid-attr-value', 'aria-required-attr', 'aria-roles', 'html-has-lang', 'html-lang-valid', 'duplicate-id-aria'] as const;
async function collectAxe(doc: Document, snapshot: LocalSnapshot, locale: string, signal?: AbortSignal): Promise<NormalizedAudit[]> {
  abort(signal);
  if (snapshot.truncated || axeRunning) return [localAudit('axe', 'unknown', locale, 'accessibility')];
  axeRunning = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  try {
    // Fixed rules, no frames, no contrast/layout scan and no page-generated selectors.
    // The timeout bounds awaiting axe; its cooperative runner may finish after timeout.
    const work = axe.run(doc, { runOnly: { type: 'rule', values: [...axeRules] }, preload: false, iframes: false, selectors: false,
      elementRef: false, ancestry: false, xpath: false, absolutePaths: false, reporter: 'v2', resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable'] });
    void work.then(() => { axeRunning = false; }, () => { axeRunning = false; });
    const stop = new Promise<null>((resolve, reject) => {
      timer = setTimeout(() => resolve(null), LOCAL_LIMITS.axeMs);
      onAbort = () => reject(new Error('ANALYSIS_CANCELLED'));
      signal?.addEventListener('abort', onAbort, { once: true });
      if (signal?.aborted) onAbort();
    });
    const result = await Promise.race([work, stop]);
    abort(signal);
    if (!result) return [localAudit('axe', 'unknown', locale, 'accessibility')];
    const findings: NormalizedAudit[] = [];
    for (const [key, status] of [['violations', 'fail'], ['incomplete', 'unknown'], ['passes', 'pass'], ['inapplicable', 'not-applicable']] as const) {
      for (const rule of result[key].slice(0, axeRules.length)) {
        if (!axeRules.some(id => id === rule.id)) continue;
        const audit = localAudit(`axe-${rule.id}`, status, locale, 'accessibility');
        // Only fixed rule IDs and capped counts leave axe. No nodes/html/target/summary.
        audit.displayValue = String(Math.min(rule.nodes.length, LOCAL_LIMITS.elements));
        findings.push(audit);
      }
    }
    return findings;
  } catch (error) {
    abort(signal);
    // Synchronous axe setup failures do not expose page data or exception messages.
    if (error instanceof Error && error.message === 'ANALYSIS_CANCELLED') throw error;
    axeRunning = false;
    return [localAudit('axe', 'unknown', locale, 'accessibility')];
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (onAbort) signal?.removeEventListener('abort', onAbort);
  }
}

/** Analyze only this loaded preview; no fetch, background service or page script injection. */
export async function collectLocalAnalysis(doc: Document, win: Window, options: LocalAnalysisOptions): Promise<AnalysisResult> {
  abort(options.signal);
  const requested = localAnalysisUrlSchema.safeParse(options.requestedUrl);
  if (!requested.success) throw new Error('ANALYSIS_INVALID_TARGET');
  if (!['mobile', 'desktop'].includes(options.profile)) throw new Error('ANALYSIS_PROFILE_UNAVAILABLE');
  if (!doc.documentElement || !doc.body || doc.readyState === 'loading') throw new Error('ANALYSIS_PREVIEW_NOT_READY');
  let target: string;
  try {
    if (win.document !== doc) throw new Error();
    const parsed = localAnalysisUrlSchema.safeParse(win.location.href);
    if (!parsed.success) throw new Error();
    target = parsed.data;
  } catch { throw new Error('ANALYSIS_PERMISSION_REQUIRED'); }
  if (target !== requested.data) throw new Error('ANALYSIS_TARGET_MISMATCH');
  const started = Date.now(), snapshot = await collectSnapshot(doc, options.signal);
  await yieldChunk(options.signal);
  const axeAudits = await collectAxe(doc, snapshot, options.locale, options.signal);
  abort(options.signal);
  const finalTarget = localAnalysisUrlSchema.safeParse(win.location.href);
  if (!finalTarget.success || finalTarget.data !== target) throw new Error('ANALYSIS_TARGET_MISMATCH');
  let fcpMs: number | null = null;
  try {
    const entries = win.performance.getEntriesByName('first-contentful-paint', 'paint');
    const observed = entries[0]?.startTime;
    if (observed !== undefined && Number.isFinite(observed) && observed >= 0) fcpMs = observed;
  } catch { /* The browser may not expose paint timing in this context. */ }
  const result = buildLocalResult({ requestedUrl: requested.data, finalUrl: target, profile: options.profile, locale: options.locale,
    snapshot, axeAudits, width: Number.isFinite(win.innerWidth) ? Math.max(0, win.innerWidth) : 0,
    height: Number.isFinite(win.innerHeight) ? Math.max(0, win.innerHeight) : 0, durationMs: Math.max(0, Date.now() - started), fcpMs });
  try {
    const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const observed = (value: number | undefined) => value !== undefined && Number.isFinite(value) && value > 0 ? value : null;
    if (result.lab.local) result.lab.local.navigation = {
      ttfbMs: navigation && navigation.responseStart > 0 && navigation.requestStart > 0 && navigation.responseStart >= navigation.requestStart ? navigation.responseStart - navigation.requestStart : null,
      domContentLoadedMs: observed(navigation?.domContentLoadedEventEnd), loadMs: observed(navigation?.loadEventEnd),
      observedResources: Math.min(2000, win.performance.getEntriesByType('resource').length),
    };
  } catch { /* Unavailable navigation timing stays absent; it is never estimated. */ }
  return result;
}
