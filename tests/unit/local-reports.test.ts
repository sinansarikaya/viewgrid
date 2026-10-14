import { exportAnalysisMarkdown } from '../../src/core/reports/markdown';
import { describe, expect, it } from 'vitest';
import { buildLocalResult } from '../../src/core/analysis/local-engine';
import { exportAnalysisHtml, exportAnalysisJson } from '../../src/core/reports/html';
import { normalizePsiResponse } from '../../src/core/analysis/normalize';
import type { AnalysisBatch } from '../../src/core/analysis/schema';
import fixture from '../fixtures/psi-response.json';
const local = buildLocalResult({
  requestedUrl: 'http://localhost:3000/?token=private',
  finalUrl: 'http://localhost:3000/?token=private',
  profile: 'mobile',
  locale: 'tr',
  snapshot: { elements: [], truncated: false },
  axeAudits: [],
  width: 393,
  height: 852,
  durationMs: 42,
  fcpMs: null,
});
const batch: AnalysisBatch = {
  schemaVersion: 1,
  requestId: 'local-report',
  requestedUrl: local.requestedUrl,
  profileSelection: 'mobile',
  startedAt: local.retrievedAt,
  completedAt: local.retrievedAt,
  results: [{ profile: 'mobile', status: 'success', data: local, error: null }],
};
describe('local report boundaries', () => {
  it.each(['tr', 'en', 'no'] as const)(
    'keeps local source, actual dimensions and privacy in %s HTML/JSON',
    (language) => {
      const html = exportAnalysisHtml(batch, '1.0.4', language),
        json = exportAnalysisJson(batch, '1.0.4');
      expect(html).toContain('ViewGrid');
      expect(html).toContain('393');
      expect(html).toContain('852');
      expect(html).not.toContain('Google PageSpeed Insights');
      expect(html).not.toContain('CrUX API');
      expect(html).not.toContain('/100');
      expect(html).not.toContain('private');
      expect(json).not.toContain('private');
      expect(JSON.parse(json).analysis.results[0].data.source).toBe('viewgrid-local');
      expect(html).not.toContain('<script');
      expect(html).toContain(`lang="${language}"`);
    },
  );
  it('retains the external engine/source label in historical reports', () => {
    const legacy = normalizePsiResponse(fixture, 'https://example.com/', 'mobile');
    const html = exportAnalysisHtml(
      {
        ...batch,
        requestedUrl: legacy.requestedUrl,
        results: [{ profile: 'mobile', status: 'success', data: legacy, error: null }],
      },
      '1.0.4',
      'en',
    );
    expect(html).toContain('Google PageSpeed Insights');
    expect(html).toContain('Remote measurement; independent of the preview iframe');
  });
});

describe('Markdown report export', () => {
  it.each(['tr', 'en', 'no'] as const)(
    'exports actual local timing and redactions in %s',
    (language) => {
      const markdown = exportAnalysisMarkdown(batch, '1.0.3', language);
      expect(markdown).toContain('ViewGrid 1.0.3');
      expect(markdown).toContain('42');
      expect(markdown).toContain('393');
      expect(markdown).not.toContain('private');
      expect(markdown).not.toContain('/100');
      expect(markdown).not.toContain('Google PageSpeed Insights');
    },
  );
  it('keeps pass/fail/manual/unknown separate and neutralizes page Markdown and HTML', () => {
    const input = structuredClone(batch);
    const outcome = input.results[0];
    if (!outcome || outcome.status !== 'success') throw new Error('fixture');
    const template = outcome.data.lab.audits[0];
    if (!template) throw new Error('fixture audit');
    outcome.data.lab.audits = ['fail', 'pass', 'manual', 'unknown'].map((status) => ({
      ...template,
      id: 'custom-rule',
      status: status as typeof template.status,
      title: '<script>bad</script> [click](https://example.com/?token=private)',
      affectedItems: [
        {
          selector: '#secret',
          snippet: 'private snippet',
          text: 'private text',
          url: 'https://example.com/?token=private',
        },
      ],
    }));
    const markdown = exportAnalysisMarkdown(input, '1.0.3', 'en');
    expect(markdown).toContain('### Failed (1)');
    expect(markdown).toContain('### Passed (1)');
    expect(markdown).toContain('### Manual review required (1)');
    expect(markdown).toContain('### Unknown / insufficient evidence (1)');
    expect(markdown).not.toContain('<script>');
    expect(markdown).not.toContain('[click](');
    expect(markdown).not.toContain('private');
    expect(markdown).not.toContain('#secret');
    const html = exportAnalysisHtml(input, '1.0.3', 'en');
    expect(html).toContain('class="status-fail"');
    expect(html).toContain('class="status-pass"');
    expect(html).toContain('Passed:');
    expect(html).toContain('Failed:');
  });
  it('reports failed profiles without presenting them as passed checks', () => {
    const input: AnalysisBatch = {
      ...batch,
      results: [
        {
          profile: 'mobile',
          status: 'error',
          data: null,
          error: {
            code: 'PREVIEW_NOT_READY',
            messageCode: 'secret detail',
            retryable: true,
            httpStatus: null,
          },
        },
      ],
    };
    const markdown = exportAnalysisMarkdown(input, undefined, 'en');
    expect(markdown).toContain('ANALYSIS\\_PREVIEW\\_NOT\\_READY');
    expect(markdown).not.toContain('secret detail');
    expect(markdown).not.toContain('### Passed');
  });
  it('rejects invalid input through the shared sanitizer', () => {
    expect(() => exportAnalysisMarkdown({ ...batch, requestedUrl: 'javascript:bad' })).toThrow(
      'ANALYSIS_INVALID_REPORT',
    );
  });
});

it('localizes saved English local audits and rounds displayed timing without mutating data', () => {
  const english = buildLocalResult({
    requestedUrl: 'https://example.com/',
    finalUrl: 'https://example.com/',
    profile: 'mobile',
    locale: 'en',
    snapshot: { elements: [], truncated: false },
    axeAudits: [],
    width: 393,
    height: 852,
    durationMs: 64.123456789,
    fcpMs: 464.123456789,
  });
  const input: AnalysisBatch = {
    ...batch,
    requestedUrl: english.requestedUrl,
    results: [{ profile: 'mobile', status: 'success', data: english, error: null }],
  };
  expect(english.lab.audits.find((audit) => audit.id === 'heading-order')?.title).toBe(
    'Heading order',
  );
  const html = exportAnalysisHtml(input, '1.0.3', 'tr');
  const markdown = exportAnalysisMarkdown(input, '1.0.3', 'tr');
  for (const report of [html, markdown]) {
    expect(report).toContain('Başlık sırası');
    expect(report).toContain('Başlık seviyelerini atlamadan sıralayın');
    expect(report).not.toContain('Heading order');
    expect(report).not.toContain('64.123456789');
    expect(report).not.toContain('464.123456789');
  }
  expect(html).toContain('64.1');
  expect(markdown).toContain('64.1');
  expect(english.lab.local?.durationMs).toBe(64.123456789);
  expect(english.lab.metrics.fcpMs).toBe(464.123456789);
});

describe('Markdown section boundaries', () => {
  it.each(['tr', 'en', 'no'] as const)(
    'exports separate sections with private URLs removed in %s',
    (language) => {
      const performance = exportAnalysisMarkdown(batch, '1.0.3', language, 'performance');
      const seo = exportAnalysisMarkdown(batch, '1.0.3', language, 'seo');
      const geo = exportAnalysisMarkdown(batch, '1.0.3', language, 'geo');
      for (const report of [performance, seo, geo]) expect(report).not.toContain('private');
      expect(performance).toContain('393');
      expect(performance).toContain('TTFB');
      expect(performance).toContain('INP');
      expect(performance).not.toContain('heading-order');
      expect(performance).not.toContain('crawl-access');
      expect(performance).not.toContain('🟢');
      expect(performance).not.toContain('/100');
      expect(seo).toContain('heading-order');
      expect(seo).not.toContain('crawl-access');
      expect(seo).not.toContain('TTFB');
      expect(seo).not.toContain('393');
      expect(geo).not.toContain('TTFB');
      expect(geo).not.toContain('393');
      expect(geo).not.toMatch(/- (Denetim kimliği|Audit ID|Kontroll-ID):/);
      expect(exportAnalysisMarkdown(batch, '1.0.3', language, 'reports')).toBe(
        exportAnalysisMarkdown(batch, '1.0.3', language),
      );
    },
  );
  it('counts scoped rules and separates legacy metric and audit sections', () => {
    const legacy = normalizePsiResponse(fixture, 'https://example.com/?token=private', 'mobile');
    const input: AnalysisBatch = {
      ...batch,
      requestedUrl: legacy.requestedUrl,
      results: [{ profile: 'mobile', status: 'success', data: legacy, error: null }],
    };
    const performance = exportAnalysisMarkdown(input, undefined, 'en', 'performance');
    const seo = exportAnalysisMarkdown(input, undefined, 'en', 'seo');
    const geo = exportAnalysisMarkdown(input, undefined, 'en', 'geo');
    expect(performance).toContain('Google PageSpeed Insights');
    expect(performance).toContain('LCP');
    expect(performance).not.toContain('####');
    expect(seo).not.toContain('LCP');
    expect(seo).not.toContain('/100');
    expect(geo).not.toContain('LCP');
    expect(geo).not.toMatch(/- (Denetim kimliği|Audit ID|Kontroll-ID):/);
    const audits = legacy.lab.audits.filter(
      (audit) => audit.category === 'seo' || audit.category === 'accessibility',
    );
    for (const status of ['fail', 'pass', 'manual', 'unknown'] as const) {
      const label = {
        fail: '🔴 Failed',
        pass: '🟢 Passed',
        manual: 'Manual review required',
        unknown: 'Unknown / insufficient evidence',
      }[status];
      expect(seo).toContain(
        `- ${label}: ${audits.filter((audit) => audit.status === status).length}`,
      );
    }
    for (const report of [performance, seo, geo]) expect(report).not.toContain('private');
  });
});

it('explains a passing check instead of prescribing a fix and reserves manual warnings for manual GEO checks', () => {
  const input=structuredClone(batch);
  const outcome=input.results[0]!;
  if(outcome.status!=='success')throw new Error('fixture');
  outcome.data.lab.audits=[{...outcome.data.lab.audits[0]!,id:'document-title',status:'pass'}];
  const seo=exportAnalysisMarkdown(input,'1.0.3','en','seo');
  expect(seo).toContain('Check result: The page has a non-empty title.');
  expect(seo).not.toContain('Add a concise');expect(seo).not.toContain('### Error (0)');
  const geo=exportAnalysisMarkdown(input,'1.0.3','en','geo');
  expect(geo.indexOf('These items have not been verified automatically')).toBeGreaterThan(geo.indexOf('#### Checks requiring manual review'));
});
