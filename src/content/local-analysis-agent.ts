import { b } from '../platform/browser';
import { collectLocalAnalysis } from './local-analysis';
import { localAnalysisRequestSchema, localAnalysisUrlSchema } from '../lib/validation/local-analysis';

const installed = globalThis as typeof globalThis & { __viewgridLocalAnalysis?: boolean; __viewgridAgentInstalled?: boolean };
// Only a registered ViewGrid preview receives this on-demand packaged bundle.
if (installed.__viewgridAgentInstalled && !installed.__viewgridLocalAnalysis && window.parent !== window) {
  installed.__viewgridLocalAnalysis = true;
  let active: { jobId: string; controller: AbortController } | null = null;
  b.runtime.onMessage.addListener((message, sender) => {
    const runtime = (globalThis as any).browser?.runtime ?? (globalThis as any).chrome?.runtime;
    if (sender.id !== runtime?.id) return;
    if (message?.type === 'vg/local-analysis-ping') return Promise.resolve({ ok: true });
    if (typeof message?.jobId !== 'string' || message.jobId.length > 200) return;
    if (message.type === 'vg/local-analysis-abort') {
      if (active && active.jobId === message.jobId) active.controller.abort();
      return;
    }
    if (message.type !== 'vg/local-analysis-collect') return;
    const parsed = localAnalysisRequestSchema.safeParse(message.request);
    if (!parsed.success || parsed.data.profile === 'both') return Promise.resolve({ ok: false, code: 'INVALID_TARGET' });
    if (document.readyState === 'loading' || !document.body) return Promise.resolve({ ok: false, code: 'PREVIEW_NOT_READY' });
    if (localAnalysisUrlSchema.safeParse(location.href).data !== parsed.data.url) return Promise.resolve({ ok: false, code: 'TARGET_MISMATCH' });
    if (active) return Promise.resolve({ ok: false, code: 'PREVIEW_NOT_READY' });
    const controller = new AbortController(); active = { jobId: message.jobId, controller };
    const { url: requestedUrl, profile, locale } = parsed.data;
    return collectLocalAnalysis(document, window, { requestedUrl, profile, locale, signal: controller.signal })
      .then(data => {
        if (controller.signal.aborted) return { ok: false, code: 'CANCELLED' };
        if (localAnalysisUrlSchema.safeParse(location.href).data !== requestedUrl) return { ok: false, code: 'TARGET_MISMATCH' };
        return { ok: true, data };
      }, () => ({ ok: false, code: controller.signal.aborted ? 'CANCELLED' : 'MEASUREMENT_FAILED' }))
      .finally(() => { if (active?.jobId === message.jobId) active = null; });
  });
}
