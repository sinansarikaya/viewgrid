import { analysisRequestSchema, type AnalysisRequest } from '../validation/analysis';
import { ZodError } from 'zod';
import { AnalysisNormalizationError, normalizePsiResponse } from '../../core/analysis/normalize';
import type { AnalysisBatch, AnalysisError, AnalysisOutcome, AnalysisProfile } from '../../core/analysis/schema';

export const PSI_ENDPOINT = 'https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed';
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
export interface AnalysisClientOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Maximum retries per profile: 0–2; both therefore makes at most 6 requests. */
  maxRetries?: number;
  /** Dependency injection for deterministic tests, never a caller-controlled endpoint. */
  fetchImpl?: typeof fetch;
}

export class AnalysisClientError extends Error {
  constructor(readonly detail: AnalysisError, readonly retryAfterMs = 0) { super(detail.messageCode); }
}
const failure = (code: AnalysisError['code'], retryable = false, httpStatus: number | null = null) =>
  new AnalysisClientError({ code, messageCode: `ANALYSIS_${code}`, retryable, httpStatus });
const bounded = (value: number | undefined, fallback: number, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.floor(value))) : fallback;

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(failure('CANCELLED')); return; }
    const finish = () => { signal?.removeEventListener('abort', cancel); resolve(); };
    const timer = setTimeout(finish, ms);
    const cancel = () => { clearTimeout(timer); signal?.removeEventListener('abort', cancel); reject(failure('CANCELLED')); };
    signal?.addEventListener('abort', cancel, { once: true });
  });
}

function retryAfter(value: string | null): number {
  if (!value) return 0;
  const seconds = Number(value);
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - Date.now();
  return Number.isFinite(ms) ? Math.max(0, Math.min(5000, ms)) : 0;
}

async function responseJson(response: Response): Promise<unknown> {
  const declared = Number(response.headers.get('content-length'));
  if (declared > MAX_RESPONSE_BYTES) throw failure('INVALID_RESPONSE');
  if (!response.body) throw failure('INVALID_RESPONSE');
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_RESPONSE_BYTES) { void reader.cancel().catch(() => {}); throw failure('INVALID_RESPONSE'); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw failure('INVALID_RESPONSE'); }
}

async function requestProfile(request: AnalysisRequest, profile: AnalysisProfile, options: AnalysisClientOptions): Promise<AnalysisOutcome> {
  const timeoutMs = bounded(options.timeoutMs, 45000, 1000, 120000), retries = bounded(options.maxRetries, 1, 0, 2);
  const endpoint = new URL(PSI_ENDPOINT);
  endpoint.searchParams.set('url', request.url);
  endpoint.searchParams.set('strategy', profile);
  endpoint.searchParams.set('locale', request.locale);
  for (const category of ['performance', 'seo', 'accessibility']) endpoint.searchParams.append('category', category);
  let last = failure('NETWORK_ERROR');
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    options.signal?.addEventListener('abort', cancel, { once: true });
    if (options.signal?.aborted) cancel();
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    try {
      if (controller.signal.aborted) throw failure('CANCELLED');
      const response = await (options.fetchImpl ?? fetch)(endpoint.href, { method: 'GET', signal: controller.signal, credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', headers: { Accept: 'application/json' } });
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        void response.body?.cancel().catch(() => {});
        throw new AnalysisClientError({ code: response.status === 429 ? 'RATE_LIMITED' : 'SERVICE_ERROR', messageCode: response.status === 429 ? 'ANALYSIS_RATE_LIMITED' : 'ANALYSIS_SERVICE_ERROR', retryable, httpStatus: response.status }, retryAfter(response.headers.get('retry-after')));
      }
      const payload = await responseJson(response);
      if (controller.signal.aborted) throw failure(options.signal?.aborted ? 'CANCELLED' : 'TIMEOUT');
      const data = normalizePsiResponse(payload, request.url, profile);
      return { profile, status: 'success', data, error: null };
    } catch (error) {
      last = options.signal?.aborted ? failure('CANCELLED') : timedOut ? failure('TIMEOUT') :
        error instanceof AnalysisClientError ? error : error instanceof AnalysisNormalizationError ? failure(error.code) : error instanceof ZodError ? failure('INVALID_RESPONSE') : failure('NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', cancel);
    }
    // Only explicit HTTP 429/5xx are retried; aborted, malformed, network and
    // measurement failures remain their own states, never synthetic zero scores.
    if (!last.detail.retryable || attempt === retries) break;
    try { await delay(Math.max(last.retryAfterMs, 500 * (2 ** attempt)), options.signal); }
    catch { last = failure('CANCELLED'); break; }
  }
  return { profile, status: last.detail.code === 'CANCELLED' ? 'cancelled' : 'error', data: null, error: last.detail };
}

/** The Google response is foreign JSON; this returns the local versioned model. */
export async function runAnalysis(input: unknown, options: AnalysisClientOptions = {}): Promise<AnalysisBatch> {
  const request = analysisRequestSchema.safeParse(input);
  if (!request.success) throw failure('INVALID_TARGET');
  const startedAt = new Date().toISOString(), requestId = crypto.randomUUID();
  const profiles: AnalysisProfile[] = request.data.profile === 'both' ? ['mobile', 'desktop'] : [request.data.profile];
  const results = await Promise.all(profiles.map(profile => requestProfile(request.data, profile, options)));
  return { schemaVersion: 1, requestId, requestedUrl: request.data.url, profileSelection: request.data.profile, startedAt, completedAt: new Date().toISOString(), results };
}

export function analysisTargetWarnings(input: unknown): ('TARGET_QUERY_MAY_CONTAIN_SENSITIVE_DATA')[] {
  const parsed = analysisRequestSchema.safeParse(input);
  return parsed.success && new URL(parsed.data.url).search ? ['TARGET_QUERY_MAY_CONTAIN_SENSITIVE_DATA'] : [];
}

/** UI adapters can discard stale responses without leaking an earlier target. */
export function createAnalysisRunner(defaults: Omit<AnalysisClientOptions, 'signal'> = {}) {
  let generation = 0;
  let active: AbortController | null = null;
  return {
    async run(input: unknown, options: AnalysisClientOptions = {}): Promise<AnalysisBatch | null> {
      const current = ++generation;
      active?.abort();
      const controller = new AbortController();
      active = controller;
      const signal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal;
      try {
        const batch = await runAnalysis(input, { ...defaults, ...options, signal });
        return current === generation ? batch : null;
      } catch (error) {
        if (current !== generation) return null;
        throw error;
      } finally { if (current === generation) active = null; }
    },
    cancel() { generation += 1; active?.abort(); active = null; },
  };
}
