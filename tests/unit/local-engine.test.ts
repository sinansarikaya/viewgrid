// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import fixture from '../fixtures/psi-response.json';
import type { AxeResults } from 'axe-core';
import { collectLocalAnalysis } from '../../src/content/local-analysis';
import { evaluateLocalDom, LOCAL_LIMITS, type LocalElement } from '../../src/core/analysis/local-engine';
import { analysisResultSchema, analysisErrorSchema, type AnalysisBatch } from '../../src/core/analysis/schema';
import { localAnalysisRequestSchema } from '../../src/lib/validation/local-analysis';
import { analysisRequestSchema } from '../../src/lib/validation/analysis';
import { redactAnalysisUrl, sanitizeAnalysisBatch } from '../../src/core/analysis/history';
import { normalizePsiResponse } from '../../src/core/analysis/normalize';
import { comparisonWarnings } from '../../src/core/analysis/comparison';

afterEach(() => { vi.restoreAllMocks(); document.head.innerHTML = ''; document.body.innerHTML = ''; });
function load(body = '<main><h1>Heading</h1><a href="/guide">Documentation guide</a><img alt=""></main>') {
  document.documentElement.lang = 'en';
  document.head.innerHTML = '<title>Page title</title><meta name="description" content="Description"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="canonical" href="/">';
  document.body.innerHTML = body;
  return { requestedUrl: window.location.href, profile: 'desktop' as const, locale: 'en' };
}
const finding = (result: Awaited<ReturnType<typeof collectLocalAnalysis>>, id: string) => result.lab.audits.find(audit => audit.id === id)!;
const element = (tag: string, attrs: Record<string, string> = {}, text = ''): LocalElement => ({ tag, attrs, text, clipped: false });

describe('local URL validation and compatibility', () => {
  it.each(['http://localhost:3000/path#hash', 'http://127.0.0.1/', 'https://[::1]/', 'http://192.168.1.20/', 'http://printer.lan/', 'https://example.com/'])('accepts safe loaded preview URLs: %s', url => {
    const result = localAnalysisRequestSchema.parse({ url });
    expect(result.url).not.toContain('#'); expect(result.profile).toBe('mobile');
  });
  it.each(['javascript:alert(1)', 'file:///tmp/a', 'ftp://localhost', 'https://user:pass@example.com', 'https://example.com\\@localhost', 'https://example.com/\nabc', ' https://example.com', 'https://example.com/%0aHeader'])('rejects protocol, credentials and control abuse: %s', url => {
    expect(localAnalysisRequestSchema.safeParse({ url }).success).toBe(false);
  });
  it('keeps legacy public validation unchanged and strips query/fragment from local history URLs', () => {
    expect(analysisRequestSchema.safeParse({ url: 'http://localhost:3000' }).success).toBe(false);
    expect(analysisRequestSchema.safeParse({ url: 'https://example.com' }).success).toBe(true);
    expect(redactAnalysisUrl('http://localhost:3000/path?token=secret#fragment')).toBe('http://localhost:3000/path');
  });
  it.each(['PREVIEW_NOT_READY', 'PROFILE_UNAVAILABLE', 'TARGET_MISMATCH', 'PERMISSION_REQUIRED'])('accepts local error code %s', code => {
    expect(analysisErrorSchema.safeParse({ code, messageCode: `ANALYSIS_${code}`, retryable: false, httpStatus: null }).success).toBe(true);
  });
});

describe('local DOM and bundled axe collector', () => {
  it('returns schema-valid passing DOM findings, real bundled axe and no scores or fabricated timings', async () => {
    const options = load(), fetchSpy = vi.fn(); vi.stubGlobal('fetch', fetchSpy);
    try {
      const result = await collectLocalAnalysis(document, window, options);
      expect(analysisResultSchema.safeParse(result).success).toBe(true);
      expect(result.source).toBe('viewgrid-local'); expect(result.lab.engine.name).toBe('ViewGrid');
      expect(result.lab.conditions.measurementContext).toBe('local-preview');
      for (const id of ['document-title', 'meta-description', 'canonical', 'heading-order', 'landmark-one-main', 'link-text', 'image-alt', 'viewport']) expect(finding(result, id).status).toBe('pass');
      expect(result.lab.audits.some(audit => audit.id.startsWith('axe-'))).toBe(true);
      expect(result.lab.scores).toEqual({ performance: null, seo: null, accessibility: null });
      expect(result.lab.metrics).toEqual({ lcpMs: null, cls: null, fcpMs: null, speedIndexMs: null, tbtMs: null });
      expect(result.lab.audits.every(audit => audit.score === null)).toBe(true);
      expect(result.field.url).toMatchObject({ source: 'local', status: 'unavailable', reason: 'local-only' });
      expect(finding(result, 'is-crawlable').status).toBe('unknown');
      expect(result.geo.criteria.find(criterion => criterion.id === 'crawl-access')?.status).toBe('unknown');
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
  it('finds observed failures without storing HTML, form values, IDs, personal text or axe targets', async () => {
    const options = load('<main><h1>Heading</h1><h3>Secret Person</h3><a id="private-person" href="/">click here</a><img><input id="personal" value="private@email.test"><button></button></main>');
    document.title = ''; document.head.querySelector('meta[name="description"]')?.remove();
    document.head.insertAdjacentHTML('beforeend', '<meta name="robots" content="noindex">');
    const result = await collectLocalAnalysis(document, window, options);
    for (const id of ['document-title', 'meta-description', 'heading-order', 'link-text', 'image-alt', 'is-crawlable']) expect(finding(result, id).status).toBe('fail');
    expect(finding(result, 'axe-button-name').status).toBe('fail');
    expect(finding(result, 'axe-label').status).toBe('fail');
    const output = JSON.stringify(result);
    for (const secret of ['Secret Person', 'private-person', 'private@email.test', '<input', '<button']) expect(output).not.toContain(secret);
    expect(result.lab.audits.every(audit => audit.affectedItems.every(item => item.snippet === null && item.text === null && item.url === null))).toBe(true);
  });
  it.each(['tr', 'en', 'no'])('localizes titles and recommendations in %s', async locale => {
    const result = await collectLocalAnalysis(document, window, { ...load(), locale });
    const titles: Record<string, string> = { tr: 'Belge başlığı', en: 'Document title', no: 'Dokumenttittel' };
    expect(finding(result, 'document-title').title).toBe(titles[locale]);
    expect(finding(result, 'canonical').recommendation.length).toBeGreaterThan(20);
  });
  it('reports navigation timing only when supplied by the browser', async () => {
    const options = load();
    Object.defineProperty(window.performance, 'getEntriesByType', { configurable: true, value: vi.fn((kind: string) => kind === 'navigation' ? [{ requestStart: 10, responseStart: 50, domContentLoadedEventEnd: 120, loadEventEnd: 200 }] : [{}, {}]) });
    try {
      const result = await collectLocalAnalysis(document, window, options);
      expect(result.lab.local?.navigation).toEqual({ ttfbMs: 40, domContentLoadedMs: 120, loadMs: 200, observedResources: 2 });
      expect(analysisResultSchema.safeParse(result).success).toBe(true);
    } finally { delete (window.performance as unknown as Record<string, unknown>).getEntriesByType; }
  });
  it('reports only observed FCP', async () => {
    const options = load();
    Object.defineProperty(window.performance, 'getEntriesByName', { configurable: true, value: vi.fn(() => [{ startTime: 123.5 }]) });
    try { const result = await collectLocalAnalysis(document, window, options); expect(result.lab.metrics.fcpMs).toBe(123.5); expect(result.lab.metrics.lcpMs).toBeNull(); }
    finally { delete (window.performance as unknown as Record<string, unknown>).getEntriesByName; }
  });
  it.each(['{broken', '42', '{}', '{"@type":42}', '{"@graph":[]}'])('rejects malformed JSON-LD syntax or shape: %s', json => {
    const audits = evaluateLocalDom({ elements: [element('script', { type: 'application/ld+json' }, json)], truncated: false }, 'https://example.com/', 'en');
    expect(audits.find(audit => audit.id === 'structured-data')?.status).toBe('fail');
  });
  it('distinguishes valid JSON-LD from absent or oversized data', async () => {
    const options = load();
    document.head.insertAdjacentHTML('beforeend', '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage"}]}</script>');
    expect(finding(await collectLocalAnalysis(document, window, options), 'structured-data').status).toBe('pass');
    document.head.querySelector('script')!.textContent = JSON.stringify({ '@type': 'WebPage', description: 'x'.repeat(LOCAL_LIMITS.json + 1) });
    expect(finding(await collectLocalAnalysis(document, window, options), 'structured-data').status).toBe('unknown');
  });
  it('keeps absent structured data and hreflang not applicable', async () => {
    const result = await collectLocalAnalysis(document, window, load());
    expect(finding(result, 'structured-data').status).toBe('not-applicable'); expect(finding(result, 'hreflang').status).toBe('not-applicable');
    expect(finding(result, 'crawler-policy').status).toBe('manual');
  });
  it('keeps unread ARIA references unknown in a truncated scan', () => {
    const audits = evaluateLocalDom({ elements: [element('a', { href: '/', 'aria-labelledby': 'after-budget' })], truncated: true }, 'https://example.com/', 'en');
    expect(audits.find(audit => audit.id === 'link-text')?.status).toBe('unknown');
  });
  it('checks canonical URL abuse, hreflang syntax and applicable self reference', () => {
    const snapshot = { elements: [element('link', { rel: 'canonical', href: 'javascript:foo' }), element('link', { rel: 'alternate', hreflang: 'bad_tag', href: 'https://example.com/' })], truncated: false };
    let audits = evaluateLocalDom(snapshot, 'https://example.com/', 'en');
    expect(audits.find(audit => audit.id === 'canonical')?.status).toBe('fail'); expect(audits.find(audit => audit.id === 'hreflang')?.status).toBe('fail');
    snapshot.elements[1]!.attrs.hreflang = 'en'; snapshot.elements[1]!.attrs.href = '/';
    audits = evaluateLocalDom(snapshot, 'https://example.com/', 'en'); expect(audits.find(audit => audit.id === 'hreflang')?.status).toBe('pass');
    snapshot.elements[1]!.attrs.href = '/other'; audits = evaluateLocalDom(snapshot, 'https://example.com/', 'en'); expect(audits.find(audit => audit.id === 'hreflang')?.status).toBe('fail');
  });
  it('does not spend the text budget on executable scripts or styles', async () => {
    const options = load();
    const script = document.createElement('script'); script.textContent = '/*' + 'x'.repeat(LOCAL_LIMITS.characters + 100) + '*/'; document.head.append(script);
    const result = await collectLocalAnalysis(document, window, options);
    expect(result.lab.local?.truncated).toBe(false);
    expect(finding(result, 'landmark-one-main').status).toBe('pass');
  });
  it('caps large DOM work, evidence and marks incomplete checks unknown while yielding', async () => {
    const options = load('<main>' + '<img>'.repeat(LOCAL_LIMITS.elements + 100) + '</main>');
    const axeSpy = vi.spyOn(axe, 'run'); let yielded = false; setTimeout(() => { yielded = true; }, 0);
    const result = await collectLocalAnalysis(document, window, options);
    expect(yielded).toBe(true); expect(result.lab.local?.truncated).toBe(true);
    expect(result.lab.local!.scannedElements).toBeLessThanOrEqual(LOCAL_LIMITS.elements);
    expect(finding(result, 'image-alt').affectedItems).toHaveLength(LOCAL_LIMITS.evidence);
    expect(finding(result, 'hreflang').status).toBe('unknown'); expect(finding(result, 'axe').status).toBe('unknown'); expect(axeSpy).not.toHaveBeenCalled();
  });
  it('cancels before work and during DOM chunks', async () => {
    const options = load('<main>' + '<span>x</span>'.repeat(500) + '</main>'), controller = new AbortController();
    setTimeout(() => controller.abort(), 0);
    await expect(collectLocalAnalysis(document, window, { ...options, signal: controller.signal })).rejects.toThrow('ANALYSIS_CANCELLED');
    await expect(collectLocalAnalysis(document, window, { ...options, signal: controller.signal })).rejects.toThrow('ANALYSIS_CANCELLED');
  });
  it('bounds awaiting axe and never treats a timeout as passing accessibility', async () => {
    const options = load(); let release!: (result: AxeResults) => void;
    const pending = new Promise<AxeResults>(resolve => { release = resolve; });
    vi.spyOn(axe, 'run').mockReturnValueOnce(pending as unknown as ReturnType<typeof axe.run>);
    vi.useFakeTimers();
    try {
      const work = collectLocalAnalysis(document, window, options);
      await vi.advanceTimersByTimeAsync(LOCAL_LIMITS.axeMs + 100);
      const result = await work;
      expect(finding(result, 'axe').status).toBe('unknown'); expect(result.lab.scores.accessibility).toBeNull();
    } finally {
      release({ violations: [], incomplete: [], passes: [], inapplicable: [] } as unknown as AxeResults);
      await pending; vi.useRealTimers();
    }
  });
  it('cancels while awaiting axe without exposing late results', async () => {
    const options = load(), controller = new AbortController(); let release!: (result: AxeResults) => void;
    const pending = new Promise<AxeResults>(resolve => { release = resolve; });
    const spy = vi.spyOn(axe, 'run').mockReturnValueOnce(pending as unknown as ReturnType<typeof axe.run>);
    vi.useFakeTimers();
    try {
      const work = collectLocalAnalysis(document, window, { ...options, signal: controller.signal });
      const rejection = expect(work).rejects.toThrow('ANALYSIS_CANCELLED');
      await vi.advanceTimersByTimeAsync(10); expect(spy).toHaveBeenCalled();
      controller.abort(); await rejection;
    } finally {
      release({ violations: [], incomplete: [], passes: [], inapplicable: [] } as unknown as AxeResults);
      await pending; vi.useRealTimers();
    }
  });
  it('rejects mismatched target and unavailable preview', async () => {
    const options = load(); await expect(collectLocalAnalysis(document, window, { ...options, requestedUrl: 'https://other.example/' })).rejects.toThrow('ANALYSIS_TARGET_MISMATCH');
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading'); await expect(collectLocalAnalysis(document, window, options)).rejects.toThrow('ANALYSIS_PREVIEW_NOT_READY');
  });
  it('redacts local history and preserves legacy Lighthouse results', async () => {
    const data = await collectLocalAnalysis(document, window, load());
    const local = { ...data, requestedUrl: 'http://localhost:3000/?token=private', finalUrl: 'http://localhost:3000/?token=private' };
    const batch: AnalysisBatch = { schemaVersion: 1, requestId: 'run', requestedUrl: local.requestedUrl, profileSelection: 'desktop', startedAt: data.retrievedAt, completedAt: data.retrievedAt, results: [{ profile: 'desktop', status: 'success', data: local, error: null }] };
    const safe = sanitizeAnalysisBatch(batch); expect(safe?.requestedUrl).toBe('http://localhost:3000/'); expect(JSON.stringify(safe)).not.toContain('private');
    const legacy = normalizePsiResponse(fixture, 'https://example.com/', 'desktop');
    expect(analysisResultSchema.safeParse(legacy).success).toBe(true);
    expect(legacy.source).toBe('google-psi'); expect(legacy.lab.engine.name).toBe('Lighthouse');
    expect(comparisonWarnings(data, legacy)).toContain('different-engine');
  });
});
