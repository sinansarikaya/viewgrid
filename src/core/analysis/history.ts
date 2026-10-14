import { z } from 'zod';
import { localAnalysisUrlSchema } from '../../lib/validation/local-analysis';
import { publicAnalysisUrlSchema } from '../../lib/validation/analysis';
import { analysisBatchSchema, type AnalysisBatch } from './schema';

export const MAX_ANALYSIS_HISTORY_ENTRIES = 20;
export const MAX_ANALYSIS_HISTORY_BYTES = 256 * 1024;
const historyEntrySchema = z.object({ schemaVersion: z.literal(1), id: z.string().max(200), createdAt: z.iso.datetime({ offset: true }), batch: analysisBatchSchema });
export type AnalysisHistoryEntry = z.infer<typeof historyEntrySchema>;

/** Queries/fragments are always removed, not just parameters with familiar names. */
export function redactAnalysisUrl(value: string): string | null {
  const parsed = localAnalysisUrlSchema.safeParse(value);
  if (!parsed.success) return null;
  const url = new URL(parsed.data);
  url.search = '';
  url.hash = '';
  return url.href;
}

function redactText(value: string | null): string | null {
  if (value === null) return null;
  return value.replace(/https?:\/\/[^\s<>"')\]]+/gi, url => redactAnalysisUrl(url) ?? '[redacted-url]')
    .replace(/\b(?:authorization|cookie|set-cookie)\s*[=:]\s*[^\r\n]+/gi, '[redacted]')
    .replace(/\b(?:api[_-]?key|token|password|secret|session)\s*[=:]\s*(?:"[^"]*"|'[^']*'|[^\s,;&]+)/gi, '[redacted]');
}

/** Rebuild only normalized fields; raw response, snippets and content are omitted. */
export function sanitizeAnalysisBatch(value: unknown): AnalysisBatch | null {
  const parsed = analysisBatchSchema.safeParse(value);
  if (!parsed.success) return null;
  const batch = parsed.data, requestedUrl = redactAnalysisUrl(batch.requestedUrl);
  if (!requestedUrl || (batch.results.some(outcome => outcome.status === 'success' && outcome.data.source === 'google-psi') && !publicAnalysisUrlSchema.safeParse(batch.requestedUrl).success)) return null;
  return {
    ...batch, requestedUrl,
    results: batch.results.map(outcome => {
      if (outcome.status !== 'success') return { ...outcome, error: { ...outcome.error, messageCode: `ANALYSIS_${outcome.error.code}` } };
      const data = outcome.data;
      return { ...outcome, data: {
        ...data, requestedUrl: redactAnalysisUrl(data.requestedUrl) ?? requestedUrl, finalUrl: data.finalUrl ? redactAnalysisUrl(data.finalUrl) : null,
        lab: { ...data.lab,
          engine: { ...data.lab.engine, userAgent: null },
          warnings: data.lab.warnings.map(warning => redactText(warning)!),
          audits: data.lab.audits.map(audit => ({ ...audit, title: redactText(audit.title)!, recommendation: redactText(audit.recommendation)!, displayValue: redactText(audit.displayValue),
            affectedItems: audit.affectedItems.map(item => ({ selector: null, snippet: null, text: null, url: item.url ? redactAnalysisUrl(item.url) : null })).filter(item => item.url !== null) })),
        },
        field: Object.fromEntries((['url', 'origin'] as const).map(scope => {
          const field = data.field[scope];
          let identifier = field.identifier ? redactAnalysisUrl(field.identifier) : null;
          if (identifier && scope === 'origin') identifier = new URL(identifier).origin;
          return [scope, identifier || field.identifier === null ? { ...field, identifier } : { ...field, identifier: null, status: 'unavailable', reason: 'missing-scope', metrics: { p75LcpMs: null, p75InpMs: null, p75Cls: null } }];
        })) as typeof data.field,
        redactions: ['url-query', 'affected-content'],
      } };
    }),
  };
}

export function sanitizeAnalysisHistory(value: unknown): AnalysisHistoryEntry[] {
  let input = value;
  if (typeof input === 'string') {
    if (new TextEncoder().encode(input).byteLength > MAX_ANALYSIS_HISTORY_BYTES) return [];
    try { input = JSON.parse(input); } catch { return []; }
  }
  if (!Array.isArray(input)) return [];
  const entries = input.slice(0, MAX_ANALYSIS_HISTORY_ENTRIES * 2).flatMap(value => {
    const entry = historyEntrySchema.safeParse(value);
    if (!entry.success) return [];
    const batch = sanitizeAnalysisBatch(entry.data.batch);
    return batch ? [{ ...entry.data, batch }] : [];
  }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const selected: AnalysisHistoryEntry[] = [], ids = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id) || selected.length >= MAX_ANALYSIS_HISTORY_ENTRIES) continue;
    if (new TextEncoder().encode(JSON.stringify([...selected, entry])).byteLength > MAX_ANALYSIS_HISTORY_BYTES) continue;
    selected.push(entry); ids.add(entry.id);
  }
  return selected;
}

export function appendAnalysisHistory(value: unknown, batch: AnalysisBatch): AnalysisHistoryEntry[] {
  const safe = sanitizeAnalysisBatch(batch);
  if (!safe) return sanitizeAnalysisHistory(value);
  return sanitizeAnalysisHistory([{ schemaVersion: 1, id: safe.requestId, createdAt: safe.completedAt, batch: safe }, ...sanitizeAnalysisHistory(value)]);
}

export function removeAnalysisHistoryEntry(value: unknown, id: string): AnalysisHistoryEntry[] {
  return sanitizeAnalysisHistory(value).filter(entry => entry.id !== id);
}

export function exportAnalysisJson(batch: AnalysisBatch): string {
  const safe = sanitizeAnalysisBatch(batch);
  if (!safe) throw new Error('ANALYSIS_INVALID_REPORT');
  return JSON.stringify(safe, null, 2);
}
