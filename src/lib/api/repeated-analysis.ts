import { z } from 'zod';
import { analysisRequestSchema } from '../validation/analysis';
import { AnalysisClientError, runAnalysis, type AnalysisClientOptions } from './analysis';
import { summarizeRepeatedAnalysis, type RepeatedProfileSummary, type RepetitionCount } from '../../core/analysis/repetition';
import type { AnalysisBatch, AnalysisProfile } from '../../core/analysis/schema';

export const repetitionCountSchema = z.union([z.literal(1), z.literal(3)]);
export class RepeatedAnalysisError extends Error {
  readonly code = 'INVALID_REPEAT_COUNT';
  constructor() { super('ANALYSIS_INVALID_REPEAT_COUNT'); }
}
export interface RepeatedAnalysisResult {
  schemaVersion: 1;
  requestId: string;
  requestedCount: RepetitionCount;
  /** Returned batches, including failed/cancelled batches; not a success count. */
  completedCount: number;
  startedAt: string;
  completedAt: string;
  stopReason: 'completed' | 'rate-limited' | 'cancelled';
  /** In-memory raw normalized batches. Sanitize each batch before persistence/export. */
  runs: AnalysisBatch[];
  profiles: RepeatedProfileSummary[];
}

/** Sequential batches; profiles within a batch follow the existing client. */
export async function runRepeatedAnalysis(input: unknown, count: RepetitionCount, options: AnalysisClientOptions = {}): Promise<RepeatedAnalysisResult> {
  const parsedCount = repetitionCountSchema.safeParse(count);
  if (!parsedCount.success) throw new RepeatedAnalysisError();
  const request = analysisRequestSchema.safeParse(input);
  if (!request.success) throw new AnalysisClientError({ code: 'INVALID_TARGET', messageCode: 'ANALYSIS_INVALID_TARGET', retryable: false, httpStatus: null });
  const startedAt = new Date().toISOString(), requestId = crypto.randomUUID();
  const profiles: AnalysisProfile[] = request.data.profile === 'both' ? ['mobile', 'desktop'] : [request.data.profile];
  const runs: AnalysisBatch[] = [];
  const maxRetries = typeof options.maxRetries === 'number' && Number.isFinite(options.maxRetries) ? Math.min(2, Math.max(0, Math.floor(options.maxRetries))) : 0;
  let stopReason: RepeatedAnalysisResult['stopReason'] = 'completed';
  for (let index = 0; index < parsedCount.data; index++) {
    if (options.signal?.aborted) { stopReason = 'cancelled'; break; }
    // Retries are opt-in for repetitions; the ordinary client's default is not
    // inherited, preventing a silent multiplication of quota requests.
    let quotaObserved = false;
    const batch = await runAnalysis(request.data, { ...options, maxRetries, fetchImpl: async (input, init) => {
      const response = await (options.fetchImpl ?? fetch)(input, init);
      if (response.status === 429) quotaObserved = true;
      return response;
    } });
    runs.push(batch);
    if (options.signal?.aborted || batch.results.some(outcome => outcome.status === 'cancelled')) { stopReason = 'cancelled'; break; }
    // Even an explicitly retried 429 followed by success closes the repetition:
    // the successful raw batch remains, but no new round amplifies quota usage.
    if (quotaObserved || batch.results.some(outcome => outcome.error?.code === 'RATE_LIMITED')) { stopReason = 'rate-limited'; break; }
  }
  return { schemaVersion: 1, requestId, requestedCount: parsedCount.data, completedCount: runs.length, startedAt, completedAt: new Date().toISOString(), stopReason, runs, profiles: summarizeRepeatedAnalysis(runs, profiles, parsedCount.data) };
}

/** Explicit stale suppression for UI callers; cancelling also invalidates output. */
export function createRepeatedAnalysisRunner(defaults: Omit<AnalysisClientOptions, 'signal'> = {}) {
  let generation = 0;
  let active: AbortController | null = null;
  return {
    async run(input: unknown, count: RepetitionCount, options: AnalysisClientOptions = {}): Promise<RepeatedAnalysisResult | null> {
      const current = ++generation;
      active?.abort();
      const controller = new AbortController();
      active = controller;
      const signal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal;
      try {
        const result = await runRepeatedAnalysis(input, count, { ...defaults, ...options, signal });
        return current === generation ? result : null;
      } catch (error) {
        if (current !== generation) return null;
        throw error;
      } finally { if (current === generation) active = null; }
    },
    cancel() { generation += 1; active?.abort(); active = null; },
  };
}
