import { psiResponseSchema, publicAnalysisUrlSchema } from '../../lib/validation/analysis';
import { evaluateGeo } from './geo';
import { analysisResultSchema, type AnalysisProfile, type AnalysisResult, type FieldDataset, type NormalizedAudit } from './schema';

type JsonObject = Record<string, unknown>;
const object = (value: unknown): JsonObject => value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};
const text = (value: unknown, max = 2000): string | null => typeof value === 'string' && value.length > 0 ? value.slice(0, max) : null;
const number = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
const decimal = (value: unknown): number | null => typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value) ? number(Number(value)) : number(value);
const score = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1 ? Math.round(value * 100) : null;
const isoTime = (value: unknown): string | null => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const publicUrl = (value: unknown): string | null => {
  const parsed = publicAnalysisUrlSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

export class AnalysisNormalizationError extends Error {
  constructor(public readonly code: 'INVALID_RESPONSE' | 'MEASUREMENT_FAILED') { super(code); }
}

function dateParts(value: unknown): string | null {
  if (typeof value === 'string') return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().startsWith(value) ? value : null;
  const parts = object(value);
  if (![parts.year, parts.month, parts.day].every(value => typeof value === 'number' && Number.isInteger(value))) return null;
  const result = `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  const time = Date.parse(result);
  return Number.isFinite(time) && new Date(time).toISOString().startsWith(result) ? result : null;
}

function collectionPeriod(value: unknown): Pick<FieldDataset, 'period' | 'periodReason'> {
  if (!value) return { period: null, periodReason: 'not-provided' };
  const period = object(value);
  const firstDate = dateParts(period.firstDate), lastDate = dateParts(period.lastDate ?? period.endDate);
  return firstDate && lastDate && firstDate <= lastDate ? { period: { firstDate, lastDate }, periodReason: null } : { period: null, periodReason: 'invalid-period' };
}

function fieldData(value: unknown, scope: 'url' | 'origin', source: 'psi-crux' | 'crux'): FieldDataset {
  const data = object(value), key = object(data.key), metrics = object(data.metrics);
  let identifier = publicUrl(source === 'crux' ? key[scope] : data.id);
  if (identifier && scope === 'origin') {
    const url = new URL(identifier);
    if (url.pathname !== '/' || url.search) identifier = null;
    else identifier = url.origin;
  }
  // An explicit origin fallback is not silently presented as page-level data.
  if (scope === 'url' && data.origin_fallback === true) identifier = null;
  const p75 = (id: string, legacyId: string) => source === 'crux' ? decimal(object(object(metrics[id]).percentiles).p75) : number(object(metrics[legacyId]).percentile);
  const cls = p75('cumulative_layout_shift', 'CUMULATIVE_LAYOUT_SHIFT_SCORE');
  const values = {
    p75LcpMs: p75('largest_contentful_paint', 'LARGEST_CONTENTFUL_PAINT_MS'),
    p75InpMs: p75('interaction_to_next_paint', 'INTERACTION_TO_NEXT_PAINT'),
    // PSI's legacy CLS percentile is an integer hundredths score; CrUX API is decimal.
    p75Cls: cls === null ? null : source === 'psi-crux' ? cls / 100 : cls,
  };
  const count = Object.values(values).filter(value => value !== null).length;
  const formFactor = key.formFactor;
  return {
    source, scope, identifier, status: !identifier || count === 0 ? 'unavailable' : count === 3 ? 'available' : 'partial',
    reason: !Object.keys(data).length ? 'missing-field-data' : !identifier ? 'missing-scope' : count === 0 ? 'missing-metrics' : count < 3 ? 'partial-metrics' : null,
    formFactor: ['PHONE', 'TABLET', 'DESKTOP'].includes(String(formFactor)) ? formFactor as 'PHONE' | 'TABLET' | 'DESKTOP' : source === 'crux' && !formFactor ? 'ALL' : null,
    ...collectionPeriod(data.collectionPeriod),
    metrics: identifier ? values : { p75LcpMs: null, p75InpMs: null, p75Cls: null },
  };
}

/** Optional separate CrUX payload normalization; this function makes no API call. */
export function normalizeCruxRecord(payload: unknown, scope: 'url' | 'origin'): FieldDataset {
  return fieldData(object(payload).record, scope, 'crux');
}

function statusFor(audit: JsonObject): NormalizedAudit['status'] {
  const mode = audit.scoreDisplayMode;
  if (mode === 'manual') return 'manual';
  if (mode === 'notApplicable') return 'not-applicable';
  if (mode === 'informative') return 'informative';
  if (mode === 'error' || audit.errorMessage) return 'error';
  const value = score(audit.score);
  return value === null ? 'unknown' : value === 100 ? 'pass' : 'fail';
}

function affectedItems(audit: JsonObject): NormalizedAudit['affectedItems'] {
  const items = object(audit.details).items;
  if (!Array.isArray(items)) return [];
  return items.slice(0, 20).map(item => {
    const row = object(item), node = object(row.node);
    return { selector: text(node.selector ?? row.selector), snippet: text(node.snippet), url: publicUrl(row.url), text: text(node.nodeLabel ?? row.label ?? row.text) };
  }).filter(item => Object.values(item).some(value => value !== null));
}

function auditsFor(lighthouse: JsonObject): NormalizedAudit[] {
  const categories = object(lighthouse.categories), raw = object(lighthouse.audits);
  const audits: NormalizedAudit[] = [];
  for (const category of ['performance', 'seo', 'accessibility'] as const) {
    const refs = object(categories[category]).auditRefs;
    if (!Array.isArray(refs)) continue;
    for (const ref of refs.slice(0, 100)) {
      const reference = object(ref), id = text(reference.id, 200);
      if (!id || !Object.hasOwn(raw, id)) continue;
      const audit = object(raw[id]), status = statusFor(audit), weight = number(reference.weight) ?? 0;
      audits.push({ id, category, title: text(audit.title) ?? id, recommendation: text(audit.description) ?? '',
        status, score: score(audit.score), weight, importance: status !== 'fail' ? 'informational' : weight >= 5 ? 'high' : weight > 0 ? 'medium' : 'low',
        displayValue: text(audit.displayValue), affectedItems: affectedItems(audit) });
    }
  }
  return audits;
}

export function normalizePsiResponse(payload: unknown, requestedUrl: string, profile: AnalysisProfile, retrievedAt = new Date().toISOString()): AnalysisResult {
  const parsed = psiResponseSchema.safeParse(payload);
  if (!parsed.success) throw new AnalysisNormalizationError('INVALID_RESPONSE');
  const root = parsed.data, lighthouse = object(root.lighthouseResult);
  if (Object.keys(object(lighthouse.runtimeError)).length) throw new AnalysisNormalizationError('MEASUREMENT_FAILED');
  if (!text(lighthouse.lighthouseVersion, 200) || !Object.keys(object(lighthouse.categories)).length) throw new AnalysisNormalizationError('INVALID_RESPONSE');
  const rawAudits = object(lighthouse.audits), categories = object(lighthouse.categories), config = object(lighthouse.configSettings);
  const measured = (id: string) => {
    const audit = object(rawAudits[id]);
    return audit.scoreDisplayMode === 'error' || audit.errorMessage ? null : number(audit.numericValue);
  };
  const throttling = Object.fromEntries(Object.entries(object(config.throttling)).slice(0, 20).filter(([key, value]) => key.length <= 80 && typeof value === 'number' && Number.isFinite(value))) as Record<string, number>;
  const screen = object(config.screenEmulation), audits = auditsFor(lighthouse);
  const warnings = Array.isArray(lighthouse.runWarnings) ? lighthouse.runWarnings.slice(0, 25).flatMap(value => text(value) ? [text(value)!] : []) : [];
  if (config.formFactor && config.formFactor !== profile) warnings.push('REPORTED_PROFILE_DIFFERS_FROM_REQUEST');
  return analysisResultSchema.parse({
    schemaVersion: 1, source: 'google-psi', requestedUrl: publicAnalysisUrlSchema.parse(requestedUrl), finalUrl: publicUrl(lighthouse.finalUrl ?? root.id), profile,
    analyzedAt: isoTime(root.analysisUTCTimestamp) ?? isoTime(lighthouse.fetchTime), retrievedAt,
    lab: {
      engine: { name: 'Lighthouse', version: text(lighthouse.lighthouseVersion, 200), userAgent: text(lighthouse.userAgent) },
      conditions: { requestedProfile: profile, reportedFormFactor: ['mobile', 'desktop'].includes(String(config.formFactor)) ? config.formFactor : null,
        locale: text(config.locale, 200), throttlingMethod: text(config.throttlingMethod, 200), throttling: Object.keys(throttling).length ? throttling : null,
        screenEmulation: Object.keys(screen).length ? { width: number(screen.width), height: number(screen.height), deviceScaleFactor: number(screen.deviceScaleFactor), mobile: typeof screen.mobile === 'boolean' ? screen.mobile : null } : null,
        benchmarkIndex: number(object(lighthouse.environment).benchmarkIndex), measurementContext: 'remote-independent-of-preview' },
      scores: { performance: score(object(categories.performance).score), seo: score(object(categories.seo).score), accessibility: score(object(categories.accessibility).score) },
      metrics: { lcpMs: measured('largest-contentful-paint'), cls: measured('cumulative-layout-shift'), fcpMs: measured('first-contentful-paint'), speedIndexMs: measured('speed-index'), tbtMs: measured('total-blocking-time') },
      audits, warnings,
    },
    field: { url: fieldData(root.loadingExperience, 'url', 'psi-crux'), origin: fieldData(root.originLoadingExperience, 'origin', 'psi-crux') },
    geo: evaluateGeo(audits), redactions: [],
  });
}
