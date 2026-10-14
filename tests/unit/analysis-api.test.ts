import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalysisClientError, analysisTargetWarnings, createAnalysisRunner, PSI_ENDPOINT, runAnalysis } from '../../src/lib/api/analysis';

const request = { url: 'https://example.com/page', profile: 'mobile' };
const good = () => new Response(JSON.stringify({ lighthouseResult: { lighthouseVersion: '13.4.0', categories: { performance: { score: .9 } }, audits: {} } }), { status: 200 });
const rejectsOnAbort = (_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_, reject) => {
  if (init?.signal?.aborted) { reject(new DOMException('aborted', 'AbortError')); return; }
  init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('remote analysis client', () => {
  it('retains accepted 2048-character targets in normalized results', async () => {
    const url = 'https://example.com/' + 'a'.repeat(2048 - 'https://example.com/'.length);
    const batch = await runAnalysis({ ...request, url }, { fetchImpl: async () => good() });
    expect(batch.results[0]).toMatchObject({ status: 'success', data: { requestedUrl: url } });
    await expect(runAnalysis({ ...request, url: url + 'a' })).rejects.toMatchObject({ detail: { code: 'INVALID_TARGET' } });
    await expect(runAnalysis({ ...request, url: 'https://example.com/' + 'ğ'.repeat(500) })).rejects.toMatchObject({ detail: { code: 'INVALID_TARGET' } });
  });
  it('classifies invalid normalized fields as response errors, not network failures', async () => {
    const response = { lighthouseResult: { lighthouseVersion: 'x'.repeat(201), categories: {}, audits: {} } };
    const batch = await runAnalysis(request, { fetchImpl: async () => new Response(JSON.stringify(response)) });
    expect(batch.results[0]).toMatchObject({ status: 'error', error: { code: 'INVALID_RESPONSE' } });
  });
  it('uses a fixed Google endpoint, isolated profiles and no credentials/key', async () => {
    const mocked = vi.fn(async () => good());
    const batch = await runAnalysis({ ...request, profile: 'both' }, { fetchImpl: mocked });
    expect(batch.results.map(result => result.status)).toEqual(['success', 'success']);
    expect(mocked).toHaveBeenCalledTimes(2);
    for (const [url, init] of mocked.mock.calls as unknown as [string, RequestInit][]) {
      const target = new URL(url);
      expect(target.origin + target.pathname).toBe(PSI_ENDPOINT);
      expect(target.searchParams.getAll('category')).toEqual(['performance', 'seo', 'accessibility']);
      expect(target.searchParams.has('key')).toBe(false);
      expect(init).toMatchObject({ credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' });
    }
  });
  it('rejects invalid targets before sending any request and warns about query disclosure', async () => {
    const mocked = vi.fn(async () => good());
    await expect(runAnalysis({ url: 'http://127.1', profile: 'both' }, { fetchImpl: mocked })).rejects.toMatchObject({ detail: { code: 'INVALID_TARGET' } });
    expect(mocked).not.toHaveBeenCalled();
    expect(analysisTargetWarnings({ ...request, url: 'https://example.com?anything=sensitive' })).toEqual(['TARGET_QUERY_MAY_CONTAIN_SENSITIVE_DATA']);
  });
  it('returns safe rate-limit errors after at most six requests across both profiles', async () => {
    vi.useFakeTimers();
    const mocked = vi.fn(async () => new Response('secret internal quota response', { status: 429, headers: { 'retry-after': '99999' } }));
    const pending = runAnalysis({ ...request, profile: 'both' }, { fetchImpl: mocked, maxRetries: 99 });
    await vi.runAllTimersAsync();
    const batch = await pending;
    expect(mocked).toHaveBeenCalledTimes(6);
    expect(batch.results.every(result => result.status === 'error' && result.error?.code === 'RATE_LIMITED')).toBe(true);
    expect(JSON.stringify(batch)).not.toContain('secret internal');
    expect(batch.results.every(result => result.data === null)).toBe(true);
  });
  it('retries 5xx but never retries 4xx, network errors or malformed JSON', async () => {
    vi.useFakeTimers();
    const retry = vi.fn().mockResolvedValueOnce(new Response('', { status: 503 })).mockResolvedValueOnce(good());
    const pending = runAnalysis(request, { fetchImpl: retry }); await vi.runAllTimersAsync();
    expect((await pending).results[0]?.status).toBe('success'); expect(retry).toHaveBeenCalledTimes(2);
    for (const response of [new Response('', { status: 403 }), new Response('not json', { status: 200 })]) {
      const mocked = vi.fn(async () => response);
      expect((await runAnalysis(request, { fetchImpl: mocked })).results[0]?.status).toBe('error');
      expect(mocked).toHaveBeenCalledTimes(1);
    }
    const network = vi.fn(async () => { throw new Error('sensitive network info'); });
    expect((await runAnalysis(request, { fetchImpl: network })).results[0]?.error?.code).toBe('NETWORK_ERROR');
    expect(network).toHaveBeenCalledTimes(1);
  });
  it('retains partial profile success independently from a failed profile', async () => {
    const mocked = vi.fn(async (input: RequestInfo | URL) => new URL(String(input)).searchParams.get('strategy') === 'mobile' ? good() : new Response('', { status: 403 }));
    const batch = await runAnalysis({ ...request, profile: 'both' }, { fetchImpl: mocked });
    expect(batch.results.map(result => result.status)).toEqual(['success', 'error']);
    expect(batch.results[1]?.data).toBeNull();
  });
  it('cancels active requests and preserves timeout as a different state', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const pending = runAnalysis({ ...request, profile: 'both' }, { fetchImpl: rejectsOnAbort, signal: controller.signal });
    controller.abort();
    expect((await pending).results.every(result => result.status === 'cancelled' && result.error?.code === 'CANCELLED')).toBe(true);
    const timeout = runAnalysis(request, { fetchImpl: rejectsOnAbort, timeoutMs: 1000 });
    await vi.advanceTimersByTimeAsync(1000);
    expect((await timeout).results[0]).toMatchObject({ status: 'error', data: null, error: { code: 'TIMEOUT' } });
  });
  it('cancels retry backoff without making another request', async () => {
    vi.useFakeTimers();
    const controller = new AbortController(), mocked = vi.fn(async () => new Response('', { status: 429 }));
    const pending = runAnalysis(request, { fetchImpl: mocked, signal: controller.signal });
    await vi.advanceTimersByTimeAsync(1); controller.abort();
    expect((await pending).results[0]?.status).toBe('cancelled'); expect(mocked).toHaveBeenCalledTimes(1);
  });
  it('does not send an already-aborted request', async () => {
    const controller = new AbortController(); controller.abort(); const mocked = vi.fn(async () => good());
    expect((await runAnalysis(request, { fetchImpl: mocked, signal: controller.signal })).results[0]?.status).toBe('cancelled');
    expect(mocked).not.toHaveBeenCalled();
  });
  it('discards stale response generations and exposes typed validation failures', async () => {
    const runner = createAnalysisRunner({ fetchImpl: rejectsOnAbort });
    const old = runner.run(request);
    const next = runner.run(request, { fetchImpl: async () => good() });
    expect(await old).toBeNull(); expect((await next)?.results[0]?.status).toBe('success');
    await expect(runner.run({ url: 'localhost' })).rejects.toBeInstanceOf(AnalysisClientError);
    const cancelled = runner.run(request); runner.cancel(); expect(await cancelled).toBeNull();
  });
  it('rejects oversized or runtime-error responses without converting them to scores', async () => {
    const responses = [new Response('{}', { headers: { 'content-length': '999999999' } }), new Response(JSON.stringify({ lighthouseResult: { runtimeError: { code: 'NO_FCP', message: 'secret detail' } } }))];
    for (const response of responses) expect((await runAnalysis(request, { fetchImpl: async () => response })).results[0]?.data).toBeNull();
  });
});
