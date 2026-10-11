import { z } from 'zod';
import { ANALYSIS_URL_MAX_LENGTH } from './limits';

export const analysisProfileSchema = z.enum(['mobile', 'desktop']);
export type AnalysisProfile = z.infer<typeof analysisProfileSchema>;
const text = z.string().max(2000);
const urlText = z.string().max(ANALYSIS_URL_MAX_LENGTH);
const shortText = z.string().max(200);
const timestamp = z.iso.datetime({ offset: true });
const metric = z.number().finite().nonnegative().nullable();
const score = z.number().finite().min(0).max(100).nullable();
export const auditStatusSchema = z.enum(['pass', 'fail', 'manual', 'not-applicable', 'informative', 'error', 'unknown']);
export const normalizedAuditSchema = z.object({
  id: shortText,
  category: z.enum(['performance', 'seo', 'accessibility']),
  title: text,
  recommendation: text,
  status: auditStatusSchema,
  score,
  importance: z.enum(['high', 'medium', 'low', 'informational']),
  weight: z.number().finite().nonnegative(),
  displayValue: text.nullable(),
  affectedItems: z.array(z.object({ selector: text.nullable(), snippet: text.nullable(), url: text.nullable(), text: text.nullable() })).max(20),
});
export type NormalizedAudit = z.infer<typeof normalizedAuditSchema>;

export const fieldDatasetSchema = z.object({
  source: z.enum(['psi-crux', 'crux']),
  scope: z.enum(['url', 'origin']),
  status: z.enum(['available', 'partial', 'unavailable']),
  reason: z.enum(['missing-field-data', 'missing-metrics', 'missing-scope', 'partial-metrics']).nullable(),
  identifier: urlText.nullable(),
  formFactor: z.enum(['PHONE', 'TABLET', 'DESKTOP', 'ALL']).nullable(),
  period: z.object({ firstDate: z.iso.date(), lastDate: z.iso.date() }).nullable(),
  periodReason: z.enum(['not-provided', 'invalid-period']).nullable(),
  metrics: z.object({ p75LcpMs: metric, p75InpMs: metric, p75Cls: metric }),
});
export type FieldDataset = z.infer<typeof fieldDatasetSchema>;

export const geoResultSchema = z.object({
  criteriaVersion: z.literal('1.0.0-beta'),
  experimental: z.literal(true),
  disclaimerCode: z.literal('GEO_SIGNALS_NOT_VISIBILITY_GUARANTEE'),
  criteria: z.array(z.object({
    id: shortText,
    mode: z.enum(['automated', 'manual']),
    status: z.enum(['pass', 'fail', 'unknown', 'manual']),
    evidenceAuditIds: z.array(shortText).max(10),
    recommendationCode: shortText,
  })).max(20),
});
export type GeoResult = z.infer<typeof geoResultSchema>;

export const analysisResultSchema = z.object({
  schemaVersion: z.literal(1),
  source: z.literal('google-psi'),
  requestedUrl: urlText,
  finalUrl: urlText.nullable(),
  profile: analysisProfileSchema,
  analyzedAt: timestamp.nullable(),
  retrievedAt: timestamp,
  lab: z.object({
    engine: z.object({ name: z.literal('Lighthouse'), version: shortText.nullable(), userAgent: text.nullable() }),
    conditions: z.object({
      requestedProfile: analysisProfileSchema,
      reportedFormFactor: z.enum(['mobile', 'desktop']).nullable(),
      locale: shortText.nullable(),
      throttlingMethod: shortText.nullable(),
      throttling: z.record(z.string().max(80), z.number().finite()).nullable(),
      screenEmulation: z.object({ width: metric, height: metric, deviceScaleFactor: metric, mobile: z.boolean().nullable() }).nullable(),
      benchmarkIndex: metric,
      measurementContext: z.literal('remote-independent-of-preview'),
    }),
    scores: z.object({ performance: score, seo: score, accessibility: score }),
    metrics: z.object({ lcpMs: metric, cls: metric, fcpMs: metric, speedIndexMs: metric, tbtMs: metric }),
    audits: z.array(normalizedAuditSchema).max(300),
    warnings: z.array(text).max(30),
  }),
  field: z.object({ url: fieldDatasetSchema, origin: fieldDatasetSchema }),
  geo: geoResultSchema,
  redactions: z.array(z.enum(['url-query', 'affected-content'])).max(2),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export const analysisErrorSchema = z.object({
  code: z.enum(['INVALID_TARGET', 'RATE_LIMITED', 'SERVICE_ERROR', 'NETWORK_ERROR', 'TIMEOUT', 'CANCELLED', 'INVALID_RESPONSE', 'MEASUREMENT_FAILED']),
  messageCode: shortText,
  retryable: z.boolean(),
  httpStatus: z.number().int().min(100).max(599).nullable(),
});
export type AnalysisError = z.infer<typeof analysisErrorSchema>;
export const analysisOutcomeSchema = z.discriminatedUnion('status', [
  z.object({ profile: analysisProfileSchema, status: z.literal('success'), data: analysisResultSchema, error: z.null() }),
  z.object({ profile: analysisProfileSchema, status: z.enum(['error', 'cancelled']), data: z.null(), error: analysisErrorSchema }),
]);
export type AnalysisOutcome = z.infer<typeof analysisOutcomeSchema>;
export const analysisBatchSchema = z.object({
  schemaVersion: z.literal(1),
  requestId: shortText,
  requestedUrl: urlText,
  profileSelection: z.enum(['mobile', 'desktop', 'both']),
  startedAt: timestamp,
  completedAt: timestamp,
  results: z.array(analysisOutcomeSchema).min(1).max(2),
});
export type AnalysisBatch = z.infer<typeof analysisBatchSchema>;
