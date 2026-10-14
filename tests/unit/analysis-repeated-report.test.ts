import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/psi-response.json';
import type { RepeatedAnalysisResult } from '../../src/lib/api/repeated-analysis';
import type { AnalysisBatch } from '../../src/core/analysis/schema';
import { normalizePsiResponse } from '../../src/core/analysis/normalize';
import { summarizeRepeatedAnalysis } from '../../src/core/analysis/repetition';
import { sanitizeAnalysisBatch } from '../../src/core/analysis/history';
import { exportRepeatedAnalysisHtml, exportRepeatedAnalysisJson } from '../../src/core/reports/repeated';

function run(index: number): AnalysisBatch {
  return { schemaVersion: 1, requestId: `run-${index}`, requestedUrl: 'https://example.com/', profileSelection: 'mobile', startedAt: '2026-10-11T10:00:00.000Z', completedAt: '2026-10-11T10:00:30.000Z', results: [{ profile: 'mobile', status: 'success', data: normalizePsiResponse(fixture, 'https://example.com/', 'mobile', `2026-10-11T10:0${index}:00.000Z`), error: null }] };
}
function input(): RepeatedAnalysisResult {
  const runs = [run(0), run(1), run(2)];
  return { schemaVersion: 1, requestId: 'controlled-repeated-report', requestedCount: 3, completedCount: 3, startedAt: '2026-10-11T10:00:00.000Z', completedAt: '2026-10-11T10:02:00.000Z', stopReason: 'completed', runs, profiles: summarizeRepeatedAnalysis(runs, ['mobile'], 3) };
}
function data(batch: AnalysisBatch) {
  const outcome = batch.results[0]!;
  if (outcome.status !== 'success') throw new Error('Expected successful test data');
  return outcome.data;
}
const exported = (result: RepeatedAnalysisResult) => JSON.parse(exportRepeatedAnalysisJson(result, '1.0.3'));

describe('safe repeated analysis reports', () => {
  it('recomputes median/sample counts from raw runs before minimizing user-agent', () => {
    const result = input();
    [0, 100, null].forEach((value, index) => { data(result.runs[index]!).lab.metrics.tbtMs = value; });
    result.profiles[0]!.lab.metrics.tbtMs = { median: 9999, sampleCount: 999 };
    const report = exported(result);
    expect(report).toMatchObject({ reportSchemaVersion: 1, reportKind: 'repeated-analysis', extensionVersion: '1.0.3' });
    expect(report.repeatedAnalysis.profiles[0].lab.metrics.tbtMs).toEqual({ median: 50, sampleCount: 2 });
    expect(report.repeatedAnalysis.profiles[0].eligibleRuns).toBe(3);
    expect(report.repeatedAnalysis.profiles[0].engine.userAgent).toBeNull();
    expect(report.repeatedAnalysis.runs.every((run: AnalysisBatch) => data(run).lab.engine.userAgent === null)).toBe(true);
    expect(report.repeatedAnalysis.summarySource).toBe('recomputed-from-input-runs-before-redaction');
    expect(data(result.runs[0]!).lab.engine.userAgent).not.toBeNull();
    const html = exportRepeatedAnalysisHtml(result, '1.0.3', 'en');
    expect(html).toContain('<th>TBT (ms) — not INP</th><td>50</td><td>2</td>');
    expect(html).toContain('Source measurement IDs for median');
  });
  it('does not invent medians from persisted redacted runs or trust carried summary numbers', () => {
    const result = input();
    result.runs = result.runs.map(run => sanitizeAnalysisBatch(run)!);
    result.profiles[0]!.eligibleRuns = 3;
    result.profiles[0]!.lab.metrics.tbtMs = { median: 210, sampleCount: 3 };
    const summary = exported(result).repeatedAnalysis.profiles[0];
    expect(summary).toMatchObject({ status: 'withheld', successfulRuns: 3, eligibleRuns: 0, engine: null });
    expect(summary.lab.metrics.tbtMs).toEqual({ median: null, sampleCount: 0 });
    expect(summary.warnings).toEqual(expect.arrayContaining(['unknown-conditions', 'redacted-target']));
  });
  it('exports missing values as null and a 429 as a failed raw outcome, not a score', () => {
    const result = input();
    result.runs = [run(0)];
    result.runs[0]!.results = [{ profile: 'mobile', status: 'error', data: null, error: { code: 'RATE_LIMITED', messageCode: 'private detail', httpStatus: 429, retryable: true } }];
    result.completedCount = 1; result.stopReason = 'rate-limited';
    const report = exported(result).repeatedAnalysis;
    expect(report.profiles[0]).toMatchObject({ status: 'unavailable', attemptedRuns: 1, successfulRuns: 0, eligibleRuns: 0 });
    expect(report.profiles[0].lab.scores.performance).toEqual({ median: null, sampleCount: 0 });
    expect(report.runs[0].results[0]).toMatchObject({ status: 'error', data: null, error: { httpStatus: 429, messageCode: 'ANALYSIS_RATE_LIMITED' } });
    const html = exportRepeatedAnalysisHtml(result, '1.0.3', 'en');
    expect(html).toContain('Quota limit (429); no new round sent');
    expect(html).toContain('<th>Performance (0–100)</th><td>Unavailable / median not calculated</td><td>0</td>');
    expect(html).toContain('RATE_LIMITED');
    expect(html).not.toContain('private detail');
  });
  it('keeps CrUX values/period reasons per run without creating field medians', () => {
    const result = input();
    result.runs.forEach((run, index) => { data(run).field.url.metrics.p75InpMs = (index + 1) * 100; });
    const report = exported(result).repeatedAnalysis;
    expect(report.fieldAggregation).toBe('not-aggregated');
    expect(report.profiles[0].fieldAggregation).toBe('not-aggregated');
    expect(report.profiles[0]).not.toHaveProperty('field');
    expect(report.runs.map((run: AnalysisBatch) => data(run).field.url.metrics.p75InpMs)).toEqual([100, 200, 300]);
    expect(report.runs[0].results[0].data.field.url.period).toBeNull();
    expect(report.runs[0].results[0].data.field.url.periodReason).toBe('not-provided');
    expect(exportRepeatedAnalysisHtml(result, '1.0.3', 'en')).toContain('CrUX field metrics are not aggregated');
  });
  it('keeps both profile summaries independent and lists failed/cancelled raw outcomes separately', () => {
    const result = input();
    result.runs.forEach((run, index) => {
      run.profileSelection = 'both';
      const desktop = structuredClone(data(run));
      desktop.profile = 'desktop'; desktop.lab.conditions.requestedProfile = 'desktop'; desktop.lab.conditions.reportedFormFactor = 'desktop'; desktop.lab.conditions.screenEmulation!.mobile = false;
      run.results.push(index === 0 ? { profile: 'desktop', status: 'error', data: null, error: { code: 'TIMEOUT', messageCode: 'ANALYSIS_TIMEOUT', httpStatus: null, retryable: false } } : index === 2 ? { profile: 'desktop', status: 'cancelled', data: null, error: { code: 'CANCELLED', messageCode: 'ANALYSIS_CANCELLED', httpStatus: null, retryable: false } } : { profile: 'desktop', status: 'success', data: desktop, error: null });
    });
    result.profiles = summarizeRepeatedAnalysis(result.runs, ['mobile', 'desktop'], 3);
    result.stopReason = 'cancelled';
    const report = exported(result).repeatedAnalysis;
    expect(report.profiles.map((summary: { eligibleRuns: number }) => summary.eligibleRuns)).toEqual([3, 1]);
    expect(report.profiles[1].lab.metrics.tbtMs).toEqual({ median: 210, sampleCount: 1 });
    const html = exportRepeatedAnalysisHtml(result, '1.0.3', 'en');
    expect(html).toContain('Laboratory median summary: Desktop');
    expect(html).toContain('<th>Failed</th><td>1</td>');
    expect(html).toContain('<th>Cancelled</th><td>1</td>');
    expect(html).toContain('ANALYSIS_TIMEOUT');
    expect(html).toContain('ANALYSIS_CANCELLED');
    expect(html).toContain('<th>HTTP status</th><td>Unavailable / not run</td>');
  });
  it('redacts every query, credentials/content and foreign metadata secret pattern in both formats', () => {
    const result = input();
    const target = 'https://example.com/?any=hidden-target-query#fragment';
    result.runs.forEach(run => {
      run.requestedUrl = target;
      const measured = data(run);
      measured.requestedUrl = target; measured.finalUrl = target;
      measured.field.url.identifier = target;
      measured.lab.engine.version = '12.8.2-fixture token=hidden-engine-token';
      measured.lab.conditions.locale = 'https://example.com/?x=hidden-locale-query';
      measured.lab.conditions.throttlingMethod = 'simulate secret=hidden-method-secret';
      measured.lab.warnings = ['Controlled mock response; Authorization: Bearer hidden-authorization'];
      measured.lab.audits[0]!.affectedItems = [{ url: 'https://example.com/resource?unusual=hidden-resource-query', selector: 'hidden-selector', snippet: 'hidden-snippet', text: 'hidden-node-text' }];
      measured.lab.audits[0]!.recommendation = 'See https://example.com/help?x=hidden-help-query';
      (measured as unknown as Record<string, unknown>).rawSecretContent = 'hidden-unknown-field';
    });
    const json = exportRepeatedAnalysisJson(result, '1.0.3');
    const html = exportRepeatedAnalysisHtml(result, '1.0.3');
    for (const secret of ['hidden-target-query', 'hidden-engine-token', 'hidden-locale-query', 'hidden-method-secret', 'hidden-authorization', 'hidden-resource-query', 'hidden-selector', 'hidden-snippet', 'hidden-node-text', 'hidden-help-query', 'hidden-unknown-field']) {
      expect(json).not.toContain(secret); expect(html).not.toContain(secret);
    }
    expect(json).toContain('https://example.com/resource');
    expect(exported(result).repeatedAnalysis.profiles[0].engine.userAgent).toBeNull();
    expect(exported(result).repeatedAnalysis.runs[0].results[0].data.field.origin.identifier).toBe('https://example.com');
  });
  it('does not add a controlled mock claim to an unmarked result', () => {
    const result = input();
    result.runs.forEach(run => { data(run).lab.engine.version = '12.8.2'; data(run).lab.warnings = []; });
    expect(exported(result).repeatedAnalysis.controlledMock).toBe(false);
    expect(exportRepeatedAnalysisHtml(result, '1.0.3', 'en')).not.toContain('Controlled mock / sample data:');
  });
  it.each(['tr', 'en', 'no'] as const)('escapes untrusted HTML and builds exactly one strict document in %s', language => {
    const result = input();
    result.requestId = '<svg onload="dangerous-request">';
    data(result.runs[0]!).lab.audits[0]!.title = '</body><script>dangerous-title</script><body>';
    data(result.runs[0]!).geo.criteria[0]!.id = '<img src=x onerror="dangerous-geo">';
    const html = exportRepeatedAnalysisHtml(result, '</style><script>dangerous-version</script>', language);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<svg ');
    expect(html).not.toContain('<img ');
    expect(html).toContain('&lt;script&gt;dangerous-title');
    expect(html).toContain('&lt;svg');
    expect(html.match(/<!doctype html>/g)).toHaveLength(1);
    expect(html.match(/<html /g)).toHaveLength(1);
    expect(html.match(/<head>/g)).toHaveLength(1);
    expect(html.match(/<body>/g)).toHaveLength(1);
    expect(html.match(/<style>/g)).toHaveLength(1);
    expect(html).toContain("script-src 'none'");
    expect(html).toContain("base-uri 'none'");
    expect(html).toContain('<section class="raw-run">');
  });
  it.each([
    ['tr', 'Bu rapor canlı PageSpeed ölçümü değildir', 'İstenen ölçüm sayısı', 'Laboratuvar medyan özeti'],
    ['en', 'This report is not a live PageSpeed measurement', 'Requested measurements', 'Laboratory median summary'],
    ['no', 'Denne rapporten er ikke en direkte PageSpeed-måling', 'Forespurte målinger', 'Medianoppsummering for laboratoriemålinger'],
  ] as const)('labels controlled mock data in the first header with localized metadata in %s', (language, mock, requested, summary) => {
    const html = exportRepeatedAnalysisHtml(input(), '1.0.3', language);
    expect(html.slice(html.indexOf('<header>'), html.indexOf('</header>'))).toContain(mock);
    expect(html.indexOf(mock)).toBeLessThan(html.indexOf('<section class="summary">'));
    expect(html).toContain(requested); expect(html).toContain(summary);
  });
  it('preserves known/unknown dates and withheld engine differences without fabricating a summary', () => {
    const result = input();
    data(result.runs[0]!).analyzedAt = null;
    data(result.runs[1]!).lab.engine.userAgent = 'Chrome/124';
    data(result.runs[2]!).lab.engine.userAgent = 'Chrome/126';
    const summary = exported(result).repeatedAnalysis.profiles[0];
    expect(summary.status).toBe('withheld');
    expect(summary.lab.metrics.tbtMs).toEqual({ median: null, sampleCount: 0 });
    expect(summary.period.reason).toBe('missing-analysis-date');
    expect(summary.period.firstAnalyzedAt).toBe('2026-10-11T10:00:00.000Z');
    expect(summary.engine).toBeNull();
    const html = exportRepeatedAnalysisHtml(result, '1.0.3', 'en');
    expect(html).toContain('Engine versions or known user-agents differ');
    expect(html).toContain('Some measurement dates were not provided');
    expect(html).toContain('Median withheld: comparability not verified');
  });
  it('supports cancellation before any batch without inventing raw records', () => {
    const result = input(); result.runs = []; result.completedCount = 0; result.stopReason = 'cancelled';
    const report = exported(result).repeatedAnalysis;
    expect(report.profiles[0].lab.metrics.lcpMs).toEqual({ median: null, sampleCount: 0 });
    expect(report.runs).toEqual([]);
    expect(exportRepeatedAnalysisHtml(result, '1.0.3', 'en')).toContain('Cancelled; no new round sent');
  });
  it('rejects invalid count, inconsistent batch count/profile selection and unsafe targets', () => {
    const invalidCount = input(); (invalidCount as unknown as { requestedCount: number }).requestedCount = 2;
    const invalidCompleted = input(); invalidCompleted.completedCount = 1;
    const invalidSelection = input(); invalidSelection.runs[0]!.profileSelection = 'desktop';
    const privateTarget = input(); privateTarget.runs[0]!.requestedUrl = 'https://user:pass@localhost/';
    const quotaContinuation = input(); quotaContinuation.runs[0]!.results = [{ profile: 'mobile', status: 'error', data: null, error: { code: 'RATE_LIMITED', messageCode: 'ANALYSIS_RATE_LIMITED', retryable: true, httpStatus: 429 } }]; quotaContinuation.stopReason = 'rate-limited';
    for (const result of [invalidCount, invalidCompleted, invalidSelection, privateTarget, quotaContinuation]) {
      expect(() => exportRepeatedAnalysisJson(result, '1.0.3')).toThrow('ANALYSIS_INVALID_REPORT');
      expect(() => exportRepeatedAnalysisHtml(result, '1.0.3')).toThrow('ANALYSIS_INVALID_REPORT');
    }
  });
});
