import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/psi-response.json';
import { normalizePsiResponse } from '../../src/core/analysis/normalize';
import type { AnalysisBatch } from '../../src/core/analysis/schema';
import { escapeReportText, exportAnalysisHtml, exportAnalysisJson } from '../../src/core/reports/html';

export const sampleBatch = (): AnalysisBatch => ({ schemaVersion: 1, requestId: 'controlled-report-fixture', requestedUrl: 'https://example.com/', profileSelection: 'both', startedAt: '2026-10-11T10:00:00.000Z', completedAt: '2026-10-11T10:00:30.000Z', results: [
  { profile: 'mobile', status: 'success', data: normalizePsiResponse(fixture, 'https://example.com/', 'mobile'), error: null },
  { profile: 'desktop', status: 'error', data: null, error: { code: 'RATE_LIMITED', messageCode: 'ANALYSIS_RATE_LIMITED', retryable: true, httpStatus: 429 } },
] });

describe('structured printable analysis reports', () => {
  it('escapes all untrusted markup and includes failures without inventing scores', () => {
    const batch = sampleBatch();
    const outcome = batch.results[0]!;
    if (outcome.status === 'success') outcome.data.lab.audits[0]!.title = '<img src=x onerror=alert(1)>';
    const html = exportAnalysisHtml(batch, '1.0.3', 'tr');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
    expect(html).toContain('RATE_LIMITED');
    expect(html).toContain('429');
    expect(html).toContain('INP değildir');
    expect(html).toContain('Veri yok / çalıştırılmadı');
    expect(html).toContain('12.8.2-fixture');
    expect(html).toContain('Controlled mock response');
  });
  it('exports the exact structured lab/field outcomes and extension version', () => {
    const report = JSON.parse(exportAnalysisJson(sampleBatch(), '1.0.3'));
    expect(report.extensionVersion).toBe('1.0.3');
    expect(report.analysis.results[0].data.lab.metrics.tbtMs).toBe(210);
    expect(report.analysis.results[0].data.field.url.metrics.p75InpMs).toBe(180);
    expect(report.analysis.results[1].data).toBeNull();
  });
  it('escapes quotes and localized report headings', () => {
    expect(escapeReportText('"<&\'')).toBe('&quot;&lt;&amp;&#39;');
    expect(exportAnalysisHtml(sampleBatch(), '1.0.3', 'no')).toContain('ViewGrid analyserapport');
  });
  it.each([
    { language: 'tr' as const, mock: 'Bu rapor canlı PageSpeed ölçümü değildir', automated: 'Laboratuvar denetimlerine dayalı otomatik kontroller', manual: 'Manuel inceleme gerektiren kontroller', recommendation: 'Yazar bilgisini', date: 'Ölçüm tarihi', finalUrl: 'Son URL', engine: 'Ölçüm motoru', rtt: 'Gidiş dönüş gecikmesi (ms)', tbt: 'INP değildir' },
    { language: 'en' as const, mock: 'This report is not a live PageSpeed measurement', automated: 'Automated checks based on laboratory audits', manual: 'Checks requiring manual review', recommendation: 'Manually verify author information', date: 'Measurement date', finalUrl: 'Final URL', engine: 'Measurement engine', rtt: 'Round-trip latency (ms)', tbt: 'not INP' },
    { language: 'no' as const, mock: 'Denne rapporten er ikke en direkte PageSpeed-måling', automated: 'Automatiske kontroller basert på laboratorietester', manual: 'Kontroller som krever manuell gjennomgang', recommendation: 'Verifiser forfatteropplysninger', date: 'Måledato', finalUrl: 'Endelig URL', engine: 'Målemotor', rtt: 'Rundturstid (ms)', tbt: 'ikke INP' },
  ])('uses readable GEO and metadata in $language with the mock warning in the first header', copy => {
    const html = exportAnalysisHtml(sampleBatch(), '1.0.3', copy.language);
    const header = html.slice(html.indexOf('<header>'), html.indexOf('</header>'));
    expect(header).toContain(copy.mock);
    expect(html.indexOf(copy.mock)).toBeLessThan(html.indexOf('<section>'));
    for (const text of [copy.automated, copy.manual, copy.recommendation, copy.date, copy.finalUrl, copy.engine, copy.rtt, copy.tbt]) expect(html).toContain(text);
    expect(html).toContain('p75 INP (ms)');
    expect(html).toContain('1.0.0-beta');
    expect(html).not.toContain('MANUALLY_REVIEW_');
    expect(html).not.toContain('REVIEW_CRAWL_ACCESS');
    expect(html).not.toContain('remote-independent-of-preview');
  });
  it('does not label a non-fixture result as controlled mock data', () => {
    const batch = sampleBatch(), outcome = batch.results[0]!;
    if (outcome.status === 'success') { outcome.data.lab.engine.version = '12.8.2'; outcome.data.lab.warnings = []; }
    expect(exportAnalysisHtml(batch, '1.0.3', 'en')).not.toContain('Controlled mock / sample data:');
  });
  it('retains actual dates, conditions, nulls and measured zero without fabricating a missing period', () => {
    const batch = sampleBatch(), outcome = batch.results[0]!;
    if (outcome.status === 'success') {
      outcome.data.analyzedAt = null;
      outcome.data.lab.scores.accessibility = null;
      outcome.data.lab.metrics.tbtMs = 0;
      outcome.data.field.url.metrics.p75InpMs = null;
    }
    const html = exportAnalysisHtml(batch, '1.0.3', 'en');
    expect(html).toContain('<th>Measurement date</th><td>Unavailable / not run</td>');
    expect(html).toContain('<th>Accessibility</th><td>Unavailable / not run</td>');
    expect(html).toContain('<th>TBT (ms) — not INP</th><td>0</td>');
    expect(html).toContain('<th>p75 INP (ms)</th><td>Unavailable / not run</td>');
    expect(html).toContain('Not provided; period unknown');
    expect(html).toContain('<th>CPU slowdown multiplier</th><td>4</td>');
    expect(html).toContain('<th>Width (CSS px)</th><td>412</td>');
    expect(html).toContain('<th>Start date</th><td>2026-10-11T10:00:00.000Z</td>');
    expect(html).toContain('<th>Analysis completion date</th><td>2026-10-11T10:00:30.000Z</td>');
    expect(html).not.toContain('Report generation date');
  });
  it('keeps URL/content redaction and escaping across every language, including unknown GEO criteria', () => {
    const batch = sampleBatch(), outcome = batch.results[0]!;
    batch.requestedUrl = 'https://example.com/?token=hidden-query';
    if (outcome.status === 'success') {
      outcome.data.requestedUrl = batch.requestedUrl;
      outcome.data.finalUrl = batch.requestedUrl;
      outcome.data.geo.criteria[0]!.id = '<script>dangerous-criterion</script>';
      outcome.data.geo.criteria[0]!.recommendationCode = '<script>dangerous-code</script>';
      outcome.data.lab.audits[0]!.affectedItems = [{ url: batch.requestedUrl, selector: 'secret-selector', snippet: 'secret-snippet', text: 'secret-content' }];
    }
    for (const language of ['tr', 'en', 'no'] as const) {
      const html = exportAnalysisHtml(batch, '<script>dangerous-version</script>', language);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;dangerous-criterion');
      expect(html).toContain('&lt;script&gt;dangerous-version');
      for (const secret of ['hidden-query', 'secret-selector', 'secret-snippet', 'secret-content', 'dangerous-code']) expect(html).not.toContain(secret);
      expect(html).toContain("default-src 'none'");
    }
    expect(exportAnalysisHtml(batch, '1.0.3', 'en')).toContain('Manually review this criterion');
  });
});
