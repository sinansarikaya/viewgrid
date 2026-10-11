import { describe, expect, it } from 'vitest';
import { appendAnalysisHistory, exportAnalysisJson, MAX_ANALYSIS_HISTORY_BYTES, removeAnalysisHistoryEntry, sanitizeAnalysisBatch, sanitizeAnalysisHistory } from '../../src/core/analysis/history';
import { comparisonWarnings, median } from '../../src/core/analysis/comparison';
import { normalizePsiResponse } from '../../src/core/analysis/normalize';
import { analysisBatchSchema, type AnalysisBatch } from '../../src/core/analysis/schema';

function batch(id = 'test-run'): AnalysisBatch {
  const data = normalizePsiResponse({ lighthouseResult: {
    lighthouseVersion: '13.4.0', configSettings: { formFactor: 'mobile', locale: 'tr', throttlingMethod: 'simulate', throttling: { rttMs: 150, throughputKbps: 1600 } },
    categories: { performance: { score: .8, auditRefs: [] }, seo: { score: .9, auditRefs: [{ id: 'canonical', weight: 1 }] } },
    audits: { canonical: { score: 0, title: 'Check https://example.com/page?token=private', description: 'secret=hidden Review canonical', details: { items: [{ url: 'https://example.com/a?api_key=private#fragment', node: { selector: '[value="private"]', snippet: '<span>private content</span>', nodeLabel: 'private content' } }] } } },
    runWarnings: ['See https://example.com/page?token=private', 'cookie=private'], finalUrl: 'https://example.com/page?token=private',
  } }, 'https://example.com/page?token=private', 'mobile', '2026-10-11T10:00:00Z');
  return { schemaVersion: 1, requestId: id, requestedUrl: data.requestedUrl, profileSelection: 'mobile', startedAt: '2026-10-11T10:00:00Z', completedAt: '2026-10-11T10:00:02Z', results: [{ profile: 'mobile', status: 'success', data, error: null }] };
}

describe('safe analysis history/export', () => {
  it('removes complete bearer/basic credentials and cookie headers from diagnostic text', () => {
    const input = batch();
    const data = input.results[0]!.data!;
    data.lab.warnings = ['Authorization: Bearer bearer-private', 'Authorization: Basic basic-private', 'Cookie: first=cookie-private; second=another-private', 'Authorization=Bearer equals-private', 'Authorization=Basic equals-basic-private', 'Cookie=first=equals-cookie-private; second=equals-other-private', 'secret="multi word private-value"'];
    data.lab.audits[0]!.recommendation = 'Authorization: Bearer advice-private';
    const json = exportAnalysisJson(input);
    for (const secret of ['bearer-private', 'basic-private', 'cookie-private', 'another-private', 'advice-private', 'equals-private', 'equals-basic-private', 'equals-cookie-private', 'equals-other-private', 'private-value']) expect(json).not.toContain(secret);
    expect(json).toContain('[redacted]');
  });
  it('strips arbitrary query data and affected content while retaining bounded evidence summaries', () => {
    const report = sanitizeAnalysisBatch(batch())!;
    const exported = exportAnalysisJson(report);
    expect(exported).not.toContain('private'); expect(exported).not.toContain('hidden'); expect(exported).not.toContain('api_key');
    expect(report.requestedUrl).toBe('https://example.com/page');
    expect(report.results[0]?.data?.lab.audits[0]?.affectedItems).toEqual([{ selector: null, snippet: null, text: null, url: 'https://example.com/a' }]);
    expect(report.results[0]?.data?.redactions).toEqual(['url-query', 'affected-content']);
    expect(analysisBatchSchema.safeParse(JSON.parse(exported)).success).toBe(true);
  });
  it('rebuilds known normalized fields and discards unknown/prototype payload fields', () => {
    const malicious: any = batch(); malicious.rawResponse = { apiKey: 'private' };
    malicious.results[0].data.lab.audits[0].details = { snippet: 'private' };
    const safe = sanitizeAnalysisBatch(malicious)!;
    expect(safe).not.toHaveProperty('rawResponse');
    expect(safe.results[0]?.data?.lab.audits[0]).not.toHaveProperty('details');
    expect(sanitizeAnalysisBatch({ ...batch(), requestedUrl: 'http://127.0.0.1' })).toBeNull();
  });
  it('retains failed checks in exports but only safe fixed messages', () => {
    const failed: AnalysisBatch = { ...batch(), results: [{ profile: 'mobile', status: 'error', data: null, error: { code: 'SERVICE_ERROR', messageCode: 'private backend stack', retryable: true, httpStatus: 503 } }] };
    const safe = sanitizeAnalysisBatch(failed)!;
    expect(safe.results[0]).toMatchObject({ status: 'error', data: null, error: { messageCode: 'ANALYSIS_SERVICE_ERROR' } });
    expect(exportAnalysisJson(failed)).not.toContain('private backend');
  });
  it('limits size/entry count, deduplicates ids, and supports clear-by-id', () => {
    let history: unknown = [];
    for (let i = 0; i < 30; i++) history = appendAnalysisHistory(history, batch(`run-${i}`));
    const safe = sanitizeAnalysisHistory(history);
    expect(safe).toHaveLength(20);
    expect(new TextEncoder().encode(JSON.stringify(safe)).byteLength).toBeLessThanOrEqual(MAX_ANALYSIS_HISTORY_BYTES);
    expect(appendAnalysisHistory(safe, batch('run-29'))).toHaveLength(20);
    expect(removeAnalysisHistoryEntry(safe, 'run-29')).toHaveLength(19);
    expect(sanitizeAnalysisHistory('x'.repeat(MAX_ANALYSIS_HISTORY_BYTES + 1))).toEqual([]);
    expect(sanitizeAnalysisHistory('{not-json')).toEqual([]);
    expect(sanitizeAnalysisHistory([{ schemaVersion: 99, batch: batch() }])).toEqual([]);
  });
  it('omits oversized normalized records instead of exceeding the storage bound', () => {
    const large = batch();
    const data = large.results[0]!.data!;
    const item = data.lab.audits[0]!;
    data.lab.audits = Array.from({ length: 300 }, (_, i) => ({ ...item, id: `audit-${i}`, title: 'x'.repeat(2000), recommendation: 'x'.repeat(2000) }));
    expect(appendAnalysisHistory([], large)).toEqual([]);
  });
});

describe('comparison and measured medians', () => {
  it('warns on changed conditions, profile and unknown provenance', () => {
    const a = batch().results[0]!.data!, b = structuredClone(a);
    b.profile = 'desktop'; b.lab.engine.version = '14'; b.lab.conditions.locale = 'en';
    expect(comparisonWarnings(a, b)).toEqual(expect.arrayContaining(['different-profile', 'different-engine', 'different-conditions']));
    expect(comparisonWarnings(a, sanitizeAnalysisBatch(batch())!.results[0]!.data!)).toContain('redacted-target');
    a.lab.conditions.throttlingMethod = null;
    expect(comparisonWarnings(a, b)).toContain('unknown-conditions');
  });
  it('does not report a change caused only by object key ordering', () => {
    const a = batch().results[0]!.data!, b = structuredClone(a);
    b.lab.conditions.throttling = { throughputKbps: 1600, rttMs: 150 };
    expect(comparisonWarnings(a, b)).toEqual([]);
  });
  it('computes medians from actual numbers only, preserving legitimate zero', () => {
    expect(median([null, 4, 0, 8, Number.NaN])).toBe(4);
    expect(median([null, 3, 7])).toBe(5);
    expect(median([null, Number.POSITIVE_INFINITY])).toBeNull();
  });
});
