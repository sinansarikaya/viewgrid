// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from '../fixtures/psi-response.json';
import { normalizePsiResponse } from '../../src/core/analysis/normalize';
import type { AnalysisBatch } from '../../src/core/analysis/schema';
import { summarizeAnalysis } from '../../src/core/analysis/summary';
import { useStore } from '../../src/ui/workspace/store';
import { BUILTIN_DEVICES } from '../../src/core/devices/builtin';
vi.mock('../../src/platform/browser', () => ({ b: { storage: { local: { set: vi.fn().mockResolvedValue(undefined) } } } }));
function batch(): AnalysisBatch {
  const url = 'https://example.com/';
  const data = normalizePsiResponse(fixture, url, 'mobile', '2026-10-14T12:00:00Z');
  data.lab.audits = [
    { ...data.lab.audits[0]!, id: 'shared', category: 'performance', status: 'fail' },
    { ...data.lab.audits[0]!, id: 'title', category: 'seo', status: 'fail' },
    { ...data.lab.audits[0]!, id: 'label', category: 'accessibility', status: 'fail' },
    { ...data.lab.audits[0]!, id: 'review', category: 'seo', status: 'manual' },
    { ...data.lab.audits[0]!, id: 'unmeasured', category: 'performance', status: 'unknown' },
  ];
  data.geo.criteria = [
    { id: 'structured', mode: 'automated', status: 'fail', evidenceAuditIds: [], recommendationCode: 'fix' },
    { id: 'review', mode: 'manual', status: 'manual', evidenceAuditIds: [], recommendationCode: 'review' },
  ];
  return { schemaVersion: 1, requestedUrl: url, requestId: 'request', profileSelection: 'both', startedAt: '2026-10-14T12:00:00Z', completedAt: '2026-10-14T12:00:00Z', results: [{ profile: 'mobile', status: 'success', data, error: null }, { profile: 'desktop', status: 'success', data: { ...data, profile: 'desktop' }, error: null }] };
}
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });
describe('confirmed analysis summary', () => {
  it('deduplicates failed rules across profiles and includes accessibility in SEO badges', () => {
    const summary = summarizeAnalysis(batch());
    expect(summary.counts).toEqual({ performance: 1, seo: 2, geo: 1, reports: 4 });
    expect(summary.profiles).toHaveLength(2);
    expect(summary.profiles[0]!.performance).toEqual({ pass: 0, fail: 1, manual: 0, unknown: 1 });
    expect(summary.profiles[0]!.seo.manual).toBe(1);
  });
  it('counts no errors when collection fails and exposes only observed profiles', () => {
    const input = batch();
    input.results = [{ profile: 'mobile', status: 'error', data: null, error: { code: 'TIMEOUT', messageCode: 'TIMEOUT', retryable: true, httpStatus: null } }];
    const summary = summarizeAnalysis(input);
    expect(summary.counts).toEqual({ performance: 0, seo: 0, geo: 0, reports: 0 });
    expect(summary.profiles).toEqual([]);
    expect(Object.values(summary.sectionStates).every(section => section.state === 'unavailable')).toBe(true);
  });
  it('requires actual local timings and complete profile collection for a measurement success', () => {
    const input = batch();
    for (const outcome of input.results) {
      if (outcome.status !== 'success') continue;
      outcome.data.source = 'viewgrid-local';
      outcome.data.lab.audits = [];
      outcome.data.lab.metrics.fcpMs = 250;
    }
    expect(summarizeAnalysis(input).sectionStates.performance.state).toBe('pass');
    input.results.pop();
    expect(summarizeAnalysis(input).sectionStates.performance.state).toBe('review');
    input.results[0]!.data!.lab.metrics.fcpMs = null;
    expect(summarizeAnalysis(input).sectionStates.performance.state).toBe('unavailable');
  });
  it('distinguishes passed checks, manual review and untested sections without inventing failures', () => {
    const input = batch();
    for (const outcome of input.results) {
      if (outcome.status !== 'success') continue;
      outcome.data.lab.audits = [{ ...outcome.data.lab.audits[0]!, category: 'accessibility', status: 'pass' }];
      outcome.data.geo.criteria = [{ id: 'review', mode: 'manual', status: 'manual', evidenceAuditIds: [], recommendationCode: 'review' }];
    }
    const summary = summarizeAnalysis(input);
    expect(summary.sectionStates.seo.state).toBe('pass');
    expect(summary.sectionStates.geo.state).toBe('review');
    expect(summary.sectionStates.performance.state).toBe('unavailable');
    expect(summary.sectionStates.reports.state).toBe('review');
    expect(summary.counts.reports).toBe(0);
  });
  it('clears badges on reorder without changing iframe reload generation', () => {
    vi.useFakeTimers();
    const state = useStore.getState();
    state.applyUrl('https://example.com/');
    state.addDevice(BUILTIN_DEVICES[0]!);
    state.addDevice(BUILTIN_DEVICES[1]!);
    state.setAnalysisSummary(batch());
    const { previewGeneration, analysisRevision } = useStore.getState();
    state.reorder(0, 1);
    expect(useStore.getState().previewGeneration).toBe(previewGeneration);
    expect(useStore.getState().analysisRevision).toBe(analysisRevision + 1);
    expect(useStore.getState().analysisSummary).toBeNull();
    const id = useStore.getState().model.viewports[0]!.id;
    state.toggleOrientation(id);
    expect(useStore.getState().previewGeneration).toBe(previewGeneration);
  });
  it('invalidates measurements for preview changes but retains them for visual zoom', () => {
    vi.useFakeTimers();
    const state = useStore.getState();
    state.applyUrl('https://example.com/');
    state.addDevice(BUILTIN_DEVICES[0]!);
    state.setAnalysisSummary(batch());
    const summary = useStore.getState().analysisSummary;
    expect(summary).not.toBeNull();
    const id = useStore.getState().model.viewports[0]!.id;
    state.setZoom(id, .75);
    expect(useStore.getState().analysisSummary).toEqual(summary);
    state.toggleOrientation(id);
    expect(useStore.getState().analysisSummary).toBeNull();
    state.setAnalysisSummary(batch());
    state.reloadAllFrames();
    expect(useStore.getState().analysisSummary).toBeNull();
    state.applyUrl('https://example.com#section');
    state.setAnalysisSummary(batch());
    expect(useStore.getState().analysisSummary?.url).toBe('https://example.com#section');
    state.setAnalysisSummary({ ...batch(), requestedUrl: 'https://another.example/' });
    expect(useStore.getState().analysisSummary).toBeNull();
  });
});

it('counts a GEO consequence once in the overall finding total and does not count timing observations as passing audits', () => {
  const input=batch();
  for (const outcome of input.results) {
    if (outcome.status !== 'success') continue;
    outcome.data.source='viewgrid-local'; outcome.data.lab.metrics.fcpMs=200;
    outcome.data.lab.audits=[{...outcome.data.lab.audits[0]!,id:'heading-order',category:'accessibility',status:'fail'}];
    outcome.data.geo.criteria=[{id:'semantic-structure',mode:'automated',status:'fail',evidenceAuditIds:['heading-order'],recommendationCode:'REVIEW_SEMANTIC_STRUCTURE'}];
  }
  const result=summarizeAnalysis(input);
  expect(result.counts).toEqual({performance:0,seo:1,geo:1,reports:1});
  expect(result.sectionStates.performance.state).toBe('pass');expect(result.sectionStates.reports.pass).toBe(0);
});
