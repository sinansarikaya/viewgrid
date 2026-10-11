import { describe, expect, it } from 'vitest';
import { analysisRequestSchema } from '../../src/lib/validation/analysis';
import { normalizeCruxRecord, normalizePsiResponse } from '../../src/core/analysis/normalize';

function fixture() {
  return {
    analysisUTCTimestamp: '2026-10-11T10:00:00Z',
    lighthouseResult: {
      lighthouseVersion: '13.4.0', finalUrl: 'https://example.com/page', userAgent: 'Chrome test',
      configSettings: { formFactor: 'mobile', locale: 'tr', throttlingMethod: 'simulate', throttling: { rttMs: 150, throughputKbps: 1600 } },
      categories: {
        performance: { score: .8, auditRefs: [] },
        seo: { score: 0, auditRefs: [{ id: 'is-crawlable', weight: 1 }, { id: 'structured-data', weight: 0 }] },
        accessibility: { score: null, auditRefs: [{ id: 'color-contrast', weight: 7 }] },
      },
      audits: {
        'largest-contentful-paint': { numericValue: 2400 },
        'cumulative-layout-shift': { numericValue: .12 },
        'first-contentful-paint': { numericValue: 1100 },
        'speed-index': { numericValue: 1800 },
        'total-blocking-time': { numericValue: 345 },
        'is-crawlable': { score: 0, title: 'Page blocked', description: 'Check robots directives' },
        'structured-data': { score: null, scoreDisplayMode: 'manual' },
        'color-contrast': { score: .4, title: 'Contrast', description: 'Improve contrast', details: { items: [{ node: { selector: '.title', snippet: '<h1>Hello</h1>', nodeLabel: 'Hello' } }] } },
      },
    },
    loadingExperience: { id: 'https://example.com/page', metrics: {
      LARGEST_CONTENTFUL_PAINT_MS: { percentile: 3400 }, INTERACTION_TO_NEXT_PAINT: { percentile: 150 }, CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 12 },
    } },
    originLoadingExperience: { id: 'https://example.com', metrics: { LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2500 } } },
  };
}

describe('analysis target validation', () => {
  it.each([
    'http://localhost:3000', 'https://app.localhost', 'http://127.0.0.1', 'http://127.1', 'http://2130706433', 'http://0x7f000001',
    'http://10.2.3.4', 'http://172.16.0.1', 'https://192.168.1.2', 'http://169.254.169.254', 'http://100.64.0.1',
    'https://[::1]', 'https://[::ffff:7f00:1]', 'https://[fc00::1]', 'https://[fe80::1]', 'https://[2001:db8::1]',
    'http://198.18.1.2', 'http://198.51.100.2', 'http://203.0.113.1', 'http://224.1.1.1', 'http://192.0.2.1',
    'https://metadata.google.internal', 'https://printer.lan', 'http://intranet', 'https://a.onion',
    'https://user:password@example.com', 'https://example.com\\@127.0.0.1', 'ftp://example.com', 'javascript:alert(1)',
  ])('rejects non-public/credential targets: %s', url => {
    expect(analysisRequestSchema.safeParse({ url, profile: 'mobile' }).success).toBe(false);
  });
  it.each(['https://example.com/a?token=private#fragment', 'http://8.8.8.8', 'https://192.0.78.13', 'https://[2606:4700:4700::1111]', 'https://münchen.de'])('accepts public syntax: %s', url => {
    expect(analysisRequestSchema.safeParse({ url, profile: 'both' }).success).toBe(true);
  });
  it('normalizes URL/locale and rejects extra configuration such as API keys', () => {
    expect(analysisRequestSchema.parse({ url: ' https://EXAMPLE.com/page#hash ' })).toEqual({ url: 'https://example.com/page', profile: 'mobile', locale: 'tr' });
    expect(analysisRequestSchema.safeParse({ url: 'https://example.com', key: 'secret' }).success).toBe(false);
  });
});

describe('PSI and CrUX normalization', () => {
  it('keeps lab TBT separate from field INP and uses null for absent scores', () => {
    const result = normalizePsiResponse(fixture(), 'https://example.com/page', 'mobile');
    expect(result.lab.metrics).toEqual({ lcpMs: 2400, cls: .12, fcpMs: 1100, speedIndexMs: 1800, tbtMs: 345 });
    expect(result.lab.metrics).not.toHaveProperty('inpMs');
    expect(result.lab.scores).toEqual({ performance: 80, seo: 0, accessibility: null });
    expect(result.field.url.metrics).toEqual({ p75LcpMs: 3400, p75InpMs: 150, p75Cls: .12 });
    expect(result.field.origin).toMatchObject({ scope: 'origin', identifier: 'https://example.com', status: 'partial', reason: 'partial-metrics', period: null, periodReason: 'not-provided' });
    expect(result.analyzedAt).toBe('2026-10-11T10:00:00.000Z');
    expect(result.lab.conditions.measurementContext).toBe('remote-independent-of-preview');
  });
  it('retains audit status, weight-based importance and affected nodes without a compliance guarantee', () => {
    const result = normalizePsiResponse(fixture(), 'https://example.com', 'mobile');
    expect(result.lab.audits.find(audit => audit.id === 'structured-data')?.status).toBe('manual');
    expect(result.lab.audits.find(audit => audit.id === 'color-contrast')).toMatchObject({ importance: 'high', affectedItems: [{ selector: '.title', snippet: '<h1>Hello</h1>', text: 'Hello', url: null }] });
    expect(result.geo.criteria.find(criterion => criterion.id === 'crawl-access')?.status).toBe('fail');
    for (const id of ['author-and-sources', 'publication-and-update-dates', 'structured-data-validity']) expect(result.geo.criteria.find(criterion => criterion.id === id)?.status).toBe('manual');
  });
  it('does not invent missing field metrics/dates or infer INP from FID', () => {
    const response: any = fixture();
    delete response.loadingExperience;
    response.originLoadingExperience.metrics = { FIRST_INPUT_DELAY_MS: { percentile: 15 } };
    const result = normalizePsiResponse(response, 'https://example.com', 'desktop');
    expect(result.field.url).toMatchObject({ status: 'unavailable', reason: 'missing-field-data', period: null });
    expect(result.field.origin.metrics).toEqual({ p75LcpMs: null, p75InpMs: null, p75Cls: null });
    expect(result.lab.warnings).toContain('REPORTED_PROFILE_DIFFERS_FROM_REQUEST');
  });
  it('keeps an origin fallback out of the URL dataset', () => {
    const response: any = fixture(); response.loadingExperience.origin_fallback = true;
    expect(normalizePsiResponse(response, 'https://example.com', 'mobile').field.url).toMatchObject({ status: 'unavailable', reason: 'missing-scope', metrics: { p75LcpMs: null } });
  });
  it('normalizes explicit CrUX scope, p75 decimal strings and actual collection period', () => {
    const result = normalizeCruxRecord({ record: { key: { origin: 'https://example.com', formFactor: 'DESKTOP' }, metrics: {
      largest_contentful_paint: { percentiles: { p75: 1200 } }, interaction_to_next_paint: { percentiles: { p75: 180 } }, cumulative_layout_shift: { percentiles: { p75: '0.08' } },
    }, collectionPeriod: { firstDate: { year: 2026, month: 9, day: 10 }, lastDate: { year: 2026, month: 10, day: 7 } } } }, 'origin');
    expect(result).toMatchObject({ status: 'available', source: 'crux', formFactor: 'DESKTOP', period: { firstDate: '2026-09-10', lastDate: '2026-10-07' }, metrics: { p75LcpMs: 1200, p75InpMs: 180, p75Cls: .08 } });
  });
  it('marks invalid dates unknown and does not silently substitute the requested scope', () => {
    const payload = { record: { key: { origin: 'https://example.com' }, metrics: { largest_contentful_paint: { percentiles: { p75: 1200 } } }, collectionPeriod: { firstDate: '2026-99-99', lastDate: '2026-10-07' } } };
    expect(normalizeCruxRecord(payload, 'url')).toMatchObject({ status: 'unavailable', reason: 'missing-scope', period: null, periodReason: 'invalid-period' });
  });
  it.each([{}, { lighthouseResult: {} }, { lighthouseResult: { lighthouseVersion: '13', runtimeError: { code: 'NO_FCP', message: 'internal error details' } } }])('rejects malformed/runtime-error results rather than zero scoring', value => {
    expect(() => normalizePsiResponse(value, 'https://example.com', 'mobile')).toThrow();
  });
  it('preserves unknown dates, failed metrics and missing audit scores as null', () => {
    const response: any = fixture(); delete response.analysisUTCTimestamp;
    response.lighthouseResult.audits['largest-contentful-paint'] = { numericValue: 3000, scoreDisplayMode: 'error' };
    response.lighthouseResult.audits['total-blocking-time'] = { numericValue: '500' };
    const result = normalizePsiResponse(response, 'https://example.com', 'mobile');
    expect(result.analyzedAt).toBeNull(); expect(result.lab.metrics.lcpMs).toBeNull(); expect(result.lab.metrics.tbtMs).toBeNull();
  });
});
