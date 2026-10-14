import { analysisResultSchema, type AnalysisBatch, type AnalysisError, type AnalysisOutcome, type AnalysisProfile } from '../../core/analysis/schema';
import { localAnalysisRequestSchema, localAnalysisUrlSchema } from '../validation/local-analysis';
import type { RepeatedAnalysisResult } from './repeated-analysis';
import { summarizeRepeatedAnalysis } from '../../core/analysis/repetition';
import { useStore } from '../../ui/workspace/store';
import { hasHostAccess, workspaceHello, workspaceMessage } from '../../ui/workspace/bridge';

export class LocalAnalysisError extends Error {
  constructor(readonly detail: AnalysisError) { super(detail.messageCode); }
}
const failure = (code: AnalysisError['code']): AnalysisError => ({ code, messageCode: `ANALYSIS_${code}`, retryable: !['INVALID_TARGET', 'CANCELLED'].includes(code), httpStatus: null });
const outcomeError = (profile: AnalysisProfile, code: AnalysisError['code']): AnalysisOutcome => ({ profile, status: code === 'CANCELLED' ? 'cancelled' : 'error', data: null, error: failure(code) });

/** Local extension messages only; the target URL is never sent to an audit service. */
export async function runLocalAnalysis(input: unknown, options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<AnalysisBatch> {
  const parsed = localAnalysisRequestSchema.safeParse(input);
  if (!parsed.success) throw new LocalAnalysisError(failure('INVALID_TARGET'));
  const request = parsed.data;
  const startedAt = new Date().toISOString(), requestId = crypto.randomUUID();
  const profiles: AnalysisProfile[] = request.profile === 'both' ? ['mobile', 'desktop'] : [request.profile];
  const results: AnalysisOutcome[] = [];
  let available = false;
  try { available = !options.signal?.aborted && await hasHostAccess(); if (available) await workspaceHello(); } catch { /* independent outcomes below */ }
  // Sequential profiles prevent two DOM/a11y scans from competing for CPU.
  for (const profile of profiles) {
    if (options.signal?.aborted) { results.push(outcomeError(profile, 'CANCELLED')); continue; }
    if (!available) { results.push(outcomeError(profile, 'PERMISSION_REQUIRED')); continue; }
    const state = useStore.getState();
    const visible = state.visibleViewports().filter(viewport => !viewport.minimized);
    const candidates = visible.filter(viewport => state.profileOf(viewport).touchSupport === (profile === 'mobile'));
    const viewport = candidates.find(viewport => localAnalysisUrlSchema.safeParse(viewport.url).data === request.url);
    if (!viewport) { results.push(outcomeError(profile, candidates.length ? 'TARGET_MISMATCH' : 'PROFILE_UNAVAILABLE')); continue; }
    const jobId = `${requestId}:${profile}`;
    const timeoutMs = Math.max(1000, Math.min(20000, options.timeoutMs ?? 12000));
    const reply = await new Promise<unknown>(resolve => {
      let settled = false;
      const finish = (value: unknown) => {
        if (settled) return;
        settled = true; clearTimeout(timer); options.signal?.removeEventListener('abort', cancel); resolve(value);
      };
      const cancel = () => {
        void workspaceMessage({ type: 'vg/local-analysis-cancel', viewportId: viewport.id, jobId }).catch(() => {});
        finish({ ok: false, code: 'CANCELLED' });
      };
      const timer = setTimeout(() => {
        void workspaceMessage({ type: 'vg/local-analysis-cancel', viewportId: viewport.id, jobId }).catch(() => {});
        finish({ ok: false, code: 'TIMEOUT' });
      }, timeoutMs);
      options.signal?.addEventListener('abort', cancel, { once: true });
      if (options.signal?.aborted) { cancel(); return; }
      void workspaceMessage({ type: 'vg/local-analysis-run', viewportId: viewport.id, jobId, request: { ...request, profile } })
        .then(finish, () => finish({ ok: false, code: 'PREVIEW_NOT_READY' }));
    });
    if (options.signal?.aborted) { results.push(outcomeError(profile, 'CANCELLED')); continue; }
    const envelope = reply as { ok?: boolean; data?: unknown; code?: string } | undefined;
    const validated = analysisResultSchema.safeParse(envelope?.data);
    if (!envelope?.ok || !validated.success) {
      const codes: AnalysisError['code'][] = ['PREVIEW_NOT_READY', 'PROFILE_UNAVAILABLE', 'TARGET_MISMATCH', 'PERMISSION_REQUIRED', 'TIMEOUT', 'CANCELLED', 'MEASUREMENT_FAILED'];
      results.push(outcomeError(profile, codes.includes(envelope?.code as AnalysisError['code']) ? envelope!.code as AnalysisError['code'] : 'MEASUREMENT_FAILED'));
      continue;
    }
    const data = validated.data;
    const current = useStore.getState();
    const stillVisible = current.visibleViewports().find(item => item.id === viewport.id && !item.minimized);
    if (!stillVisible || current.previewGeneration !== state.previewGeneration || localAnalysisUrlSchema.safeParse(stillVisible.url).data !== request.url) {
      results.push(outcomeError(profile, 'TARGET_MISMATCH')); continue;
    }
    if (data.source !== 'viewgrid-local' || data.profile !== profile || data.requestedUrl !== request.url || localAnalysisUrlSchema.safeParse(data.finalUrl).data !== request.url) {
      results.push(outcomeError(profile, 'TARGET_MISMATCH')); continue;
    }
    if (data.lab.local) data.lab.local.viewportId = viewport.id;
    results.push({ profile, status: 'success', data, error: null });
  }
  return { schemaVersion: 1, requestId, requestedUrl: request.url, profileSelection: request.profile, startedAt, completedAt: new Date().toISOString(), results };
}

/** A snapshot is not a fresh page load or a repeated laboratory benchmark. */
export function createLocalAnalysisRunner() {
  let generation = 0;
  let active: AbortController | null = null;
  return {
    async run(input: unknown, _count: 1 | 3 = 1, options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<RepeatedAnalysisResult | null> {
      const current = ++generation;
      active?.abort();
      const controller = new AbortController(); active = controller;
      const signal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal;
      try {
        const batch = await runLocalAnalysis(input, { ...options, signal });
        if (current !== generation) return null;
        const profiles = batch.results.map(outcome => outcome.profile);
        const summaries = summarizeRepeatedAnalysis([batch], profiles, 1).map(summary => {
          const result = batch.results.find(outcome => outcome.profile === summary.profile);
          return { ...summary, status: result?.status === 'success' ? (result.data.lab.local?.truncated ? 'partial' as const : 'available' as const) : 'unavailable' as const };
        });
        return { schemaVersion: 1, requestId: batch.requestId, requestedCount: 1, completedCount: 1, startedAt: batch.startedAt, completedAt: batch.completedAt, stopReason: signal.aborted ? 'cancelled' : 'completed', runs: [batch], profiles: summaries };
      } finally { if (current === generation) active = null; }
    },
    cancel() { generation += 1; active?.abort(); active = null; },
  };
}
