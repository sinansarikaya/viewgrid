import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from '../fixtures/psi-response.json';
import { normalizePsiResponse } from '../../src/core/analysis/normalize';
import { summarizeRepeatedAnalysis, type RepetitionCount } from '../../src/core/analysis/repetition';
import type { AnalysisBatch, AnalysisProfile } from '../../src/core/analysis/schema';
import { createRepeatedAnalysisRunner, RepeatedAnalysisError, runRepeatedAnalysis } from '../../src/lib/api/repeated-analysis';

const request = { url: 'https://example.com/', profile: 'mobile' };
function payload(profile: AnalysisProfile = 'mobile') {
  const data = structuredClone(fixture);
  data.lighthouseResult.configSettings.formFactor = profile;
  data.lighthouseResult.configSettings.screenEmulation.mobile = profile === 'mobile';
  return data;
}
const response = (profile: AnalysisProfile = 'mobile') => new Response(JSON.stringify(payload(profile)));
function batch(index: number): AnalysisBatch {
  return { schemaVersion: 1, requestId: `run-${index}`, requestedUrl: request.url, profileSelection: 'mobile', startedAt: '2026-10-11T10:00:00.000Z', completedAt: '2026-10-11T10:00:30.000Z', results: [{ profile: 'mobile', status: 'success', data: normalizePsiResponse(payload(), request.url, 'mobile', `2026-10-11T10:0${index}:00.000Z`), error: null }] };
}
function successData(input: AnalysisBatch) {
  const outcome = input.results[0]!;
  if (outcome.status !== 'success') throw new Error('Expected a successful test fixture');
  return outcome.data;
}
const abortingFetch = (_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_, reject) => {
  if (init?.signal?.aborted) { reject(new DOMException('aborted', 'AbortError')); return; }
  init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe('sequential repeated analysis client', () => {
  it.each([0, 2, 4, '3', null, NaN])('validates repeat count %s before making a request', async count => {
    const fetchImpl = vi.fn(async () => response());
    await expect(runRepeatedAnalysis(request, count as RepetitionCount, { fetchImpl })).rejects.toBeInstanceOf(RepeatedAnalysisError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('validates targets before fetching and accepts a single explicit measurement', async () => {
    const fetchImpl = vi.fn(async () => response());
    await expect(runRepeatedAnalysis({ url: 'http://localhost' }, 3, { fetchImpl })).rejects.toMatchObject({ detail: { code: 'INVALID_TARGET' } });
    expect(fetchImpl).not.toHaveBeenCalled();
    const result = await runRepeatedAnalysis(request, 1, { fetchImpl });
    expect(result).toMatchObject({ requestedCount: 1, completedCount: 1, stopReason: 'completed' });
    expect(result.profiles[0]?.lab.metrics.tbtMs).toEqual({ median: 210, sampleCount: 1 });
  });
  it('finishes each batch before starting the next and keeps profiles independent within it', async () => {
    let active = 0, maximum = 0;
    const events: string[] = [];
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const profile = new URL(String(input)).searchParams.get('strategy') as AnalysisProfile;
      const round = Math.floor(events.filter(event => event.startsWith('start:')).length / 2);
      active++; maximum = Math.max(maximum, active); events.push(`start:${round}:${profile}`);
      await Promise.resolve();
      active--; events.push(`finish:${round}:${profile}`);
      return response(profile);
    });
    const result = await runRepeatedAnalysis({ ...request, profile: 'both' }, 3, { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(6);
    expect(maximum).toBe(2);
    expect(events.slice(0, 4)).toEqual(['start:0:mobile', 'start:0:desktop', 'finish:0:mobile', 'finish:0:desktop']);
    expect(new Set(result.runs.map(run => run.requestId)).size).toBe(3);
    expect(result.profiles.map(profile => profile.eligibleRuns)).toEqual([3, 3]);
  });
  it('does not retry by default and stops new rounds after the first quota error', async () => {
    const fetchImpl = vi.fn(async () => new Response('private quota detail', { status: 429 }));
    const result = await runRepeatedAnalysis(request, 3, { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ completedCount: 1, stopReason: 'rate-limited' });
    expect(result.runs[0]?.results[0]?.error?.code).toBe('RATE_LIMITED');
    expect(result.profiles[0]).toMatchObject({ status: 'unavailable', attemptedRuns: 1, successfulRuns: 0, eligibleRuns: 0 });
    expect(result.profiles[0]?.warnings).toEqual(expect.arrayContaining(['failed-runs', 'incomplete-runs', 'no-successful-runs']));
    expect(JSON.stringify(result)).not.toContain('private quota');
  });
  it('retains the successful profile of a quota-limited batch without running another batch', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => new URL(String(input)).searchParams.get('strategy') === 'mobile' ? response() : new Response('', { status: 429 }));
    const result = await runRepeatedAnalysis({ ...request, profile: 'both' }, 3, { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.stopReason).toBe('rate-limited');
    expect(result.profiles[0]).toMatchObject({ status: 'partial', successfulRuns: 1, eligibleRuns: 1 });
    expect(result.profiles[1]).toMatchObject({ status: 'unavailable', successfulRuns: 0 });
  });
  it('allows bounded explicit retries but still stops later rounds after exhausted quota', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(async () => new Response('', { status: 429 }));
    const pending = runRepeatedAnalysis(request, 3, { fetchImpl, maxRetries: 1 });
    await vi.runAllTimersAsync();
    expect((await pending).stopReason).toBe('rate-limited');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it('does not start another round after a quota error even if an explicit retry succeeds', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response('', { status: 429 })).mockResolvedValueOnce(response());
    const pending = runRepeatedAnalysis(request, 3, { fetchImpl, maxRetries: 1 });
    await vi.runAllTimersAsync();
    const result = await pending;
    expect(result).toMatchObject({ completedCount: 1, stopReason: 'rate-limited' });
    expect(result.runs[0]?.results[0]?.status).toBe('success');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it.each([NaN, Infinity])('does not silently enable retries for invalid retry configuration %s', async maxRetries => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 429 }));
    expect((await runRepeatedAnalysis(request, 3, { fetchImpl, maxRetries })).stopReason).toBe('rate-limited');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('preserves partial non-quota failures while attempting the requested independent rounds', async () => {
    let call = 0;
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const profile = new URL(String(input)).searchParams.get('strategy') as AnalysisProfile;
      return ++call === 2 ? new Response('', { status: 503 }) : response(profile);
    });
    const result = await runRepeatedAnalysis({ ...request, profile: 'both' }, 3, { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(6);
    expect(result.profiles[0]).toMatchObject({ attemptedRuns: 3, eligibleRuns: 3 });
    expect(result.profiles[1]).toMatchObject({ status: 'partial', attemptedRuns: 3, successfulRuns: 2, eligibleRuns: 2, excludedRunIds: [result.runs[0]!.requestId] });
  });
  it('does not fetch when pre-aborted and records cancellation of an active batch without a new round', async () => {
    const controller = new AbortController(); controller.abort();
    const fetchImpl = vi.fn(abortingFetch);
    const before = await runRepeatedAnalysis(request, 3, { fetchImpl, signal: controller.signal });
    expect(before).toMatchObject({ completedCount: 0, stopReason: 'cancelled', runs: [] });
    expect(fetchImpl).not.toHaveBeenCalled();
    const next = new AbortController();
    const pending = runRepeatedAnalysis(request, 3, { fetchImpl, signal: next.signal });
    next.abort();
    const cancelled = await pending;
    expect(cancelled.stopReason).toBe('cancelled');
    expect(cancelled.runs[0]?.results[0]?.status).toBe('cancelled');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('stops between batches when the caller aborts after receiving an earlier response', async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn(async () => { controller.abort(); return response(); });
    const result = await runRepeatedAnalysis(request, 3, { fetchImpl, signal: controller.signal });
    expect(result).toMatchObject({ completedCount: 1, stopReason: 'cancelled' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('suppresses superseded/cancelled generations explicitly', async () => {
    const runner = createRepeatedAnalysisRunner({ fetchImpl: abortingFetch });
    const first = runner.run(request, 3);
    const latest = runner.run(request, 1, { fetchImpl: async () => response() });
    expect(await first).toBeNull(); expect((await latest)?.completedCount).toBe(1);
    const cancelled = runner.run(request, 3); runner.cancel(); expect(await cancelled).toBeNull();
    await expect(runner.run(request, 2 as RepetitionCount)).rejects.toBeInstanceOf(RepeatedAnalysisError);
  });
});

describe('auditable lab-only repetition summaries', () => {
  it('calculates each median/sample count from actual values including zero, never missing samples', () => {
    const runs = [batch(0), batch(1), batch(2)];
    const values = [3000, 1000, null], scores = [0, 50, null], tbt = [0, 100, 20];
    runs.forEach((run, index) => { const data = successData(run); data.lab.metrics.lcpMs = values[index]!; data.lab.scores.performance = scores[index]!; data.lab.metrics.tbtMs = tbt[index]!; data.field.url.metrics.p75InpMs = (index + 1) * 100; });
    const result = summarizeRepeatedAnalysis(runs, ['mobile'], 3)[0]!;
    expect(result.lab.metrics.lcpMs).toEqual({ median: 2000, sampleCount: 2 });
    expect(result.lab.scores.performance).toEqual({ median: 25, sampleCount: 2 });
    expect(result.lab.metrics.tbtMs).toEqual({ median: 20, sampleCount: 3 });
    expect(result).toMatchObject({ eligibleRuns: 3, status: 'partial', fieldAggregation: 'not-aggregated', sourceRunIds: ['run-0', 'run-1', 'run-2'] });
    expect(result.warnings).toContain('lab-warnings');
    expect(result).not.toHaveProperty('field');
    expect(runs.map(run => successData(run).field.url.metrics.p75InpMs)).toEqual([100, 200, 300]);
  });
  it.each(['engine', 'conditions', 'target', 'profile', 'unknown', 'redacted'] as const)('withholds aggregation for incompatible %s evidence without selecting a subgroup', mismatch => {
    const runs = [batch(0), batch(1), batch(2)], changed = successData(runs[1]!);
    if (mismatch === 'engine') changed.lab.engine.version = 'another-version';
    if (mismatch === 'conditions') changed.lab.conditions.throttling!.rttMs = 999;
    if (mismatch === 'target') changed.finalUrl = 'https://example.com/other';
    if (mismatch === 'profile') changed.profile = 'desktop';
    if (mismatch === 'unknown') changed.lab.conditions.screenEmulation = null;
    if (mismatch === 'redacted') changed.redactions = ['url-query'];
    const result = summarizeRepeatedAnalysis(runs, ['mobile'], 3)[0]!;
    expect(result).toMatchObject({ status: 'withheld', successfulRuns: 3, eligibleRuns: 0, sourceRunIds: [], excludedRunIds: ['run-0', 'run-1', 'run-2'] });
    expect(result.lab.metrics.tbtMs).toEqual({ median: null, sampleCount: 0 });
    expect(result.warnings).not.toHaveLength(0);
  });
  it('preserves unknown measurement dates instead of substituting retrieval dates', () => {
    const runs = [batch(0), batch(1), batch(2)];
    successData(runs[0]!).analyzedAt = null;
    successData(runs[1]!).analyzedAt = '2026-10-11T11:00:00.000Z';
    successData(runs[2]!).analyzedAt = '2026-10-11T12:00:00.000Z';
    expect(summarizeRepeatedAnalysis(runs, ['mobile'], 3)[0]?.period).toEqual({ firstAnalyzedAt: '2026-10-11T11:00:00.000Z', lastAnalyzedAt: '2026-10-11T12:00:00.000Z', firstRetrievedAt: '2026-10-11T10:00:00.000Z', lastRetrievedAt: '2026-10-11T10:02:00.000Z', reason: 'missing-analysis-date' });
  });
  it.each([null, '', '   '])('withholds a single run with missing user-agent %s', userAgent => {
    const input = batch(0);
    successData(input).lab.engine.userAgent = userAgent;
    const result = summarizeRepeatedAnalysis([input], ['mobile'], 1)[0]!;
    expect(result).toMatchObject({ status: 'withheld', successfulRuns: 1, eligibleRuns: 0, sourceRunIds: [], excludedRunIds: ['run-0'], engine: null });
    expect(result.warnings).toContain('unknown-conditions');
    expect(result.warnings).not.toContain('different-engine');
    expect(result.lab.metrics.tbtMs).toEqual({ median: null, sampleCount: 0 });
  });
  it.each([
    [null, 'Chrome/124', 'Chrome/126'],
    ['Chrome/124', null, 'Chrome/126'],
    ['Chrome/124', 'Chrome/126', null],
  ])('detects distinct known user-agents independently of a missing reference (%s, %s, %s)', (first, second, third) => {
    const runs = [batch(0), batch(1), batch(2)];
    [first, second, third].forEach((userAgent, index) => { successData(runs[index]!).lab.engine.userAgent = userAgent; });
    const result = summarizeRepeatedAnalysis(runs, ['mobile'], 3)[0]!;
    expect(result).toMatchObject({ status: 'withheld', successfulRuns: 3, eligibleRuns: 0, sourceRunIds: [], excludedRunIds: ['run-0', 'run-1', 'run-2'] });
    expect(result.warnings).toEqual(expect.arrayContaining(['unknown-conditions', 'different-engine']));
    expect(result.lab.scores.performance).toEqual({ median: null, sampleCount: 0 });
  });
  it.each(['zero-size', 'wrong-screen', 'negative-throttling'] as const)('withholds invalid %s measurement conditions', invalid => {
    const input = batch(0), conditions = successData(input).lab.conditions;
    if (invalid === 'zero-size') conditions.screenEmulation!.width = 0;
    if (invalid === 'wrong-screen') conditions.screenEmulation!.mobile = false;
    if (invalid === 'negative-throttling') conditions.throttling!.rttMs = -1;
    const result = summarizeRepeatedAnalysis([input], ['mobile'], 1)[0]!;
    expect(result.status).toBe('withheld');
    expect(result.warnings).toContain('unknown-conditions');
  });
  it('does not mutate raw batches and ignores conditions object property order', () => {
    const runs = [batch(0), batch(1), batch(2)];
    successData(runs[1]!).lab.conditions.throttling = { cpuSlowdownMultiplier: 4, rttMs: 150 };
    const original = JSON.stringify(runs);
    const result = summarizeRepeatedAnalysis(runs, ['mobile'], 3)[0]!;
    expect(result.eligibleRuns).toBe(3);
    expect(JSON.stringify(runs)).toBe(original);
    result.conditions!.throttling!.rttMs = 999;
    result.engine!.version = 'changed-by-consumer';
    expect(JSON.stringify(runs)).toBe(original);
  });
});
