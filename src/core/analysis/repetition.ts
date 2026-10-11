import { comparisonWarnings, median, type ComparisonWarning } from './comparison';
import type { AnalysisBatch, AnalysisProfile, AnalysisResult } from './schema';

export type RepetitionCount = 1 | 3;
export type RepetitionWarning = ComparisonWarning | 'no-successful-runs' | 'failed-runs' | 'incomplete-runs' | 'profile-mismatch' | 'missing-samples' | 'lab-warnings';
export interface MedianSample { median: number | null; sampleCount: number }
export interface RepeatedProfileSummary {
  profile: AnalysisProfile;
  status: 'available' | 'partial' | 'withheld' | 'unavailable';
  attemptedRuns: number;
  successfulRuns: number;
  eligibleRuns: number;
  sourceRunIds: string[];
  excludedRunIds: string[];
  warnings: RepetitionWarning[];
  engine: AnalysisResult['lab']['engine'] | null;
  conditions: AnalysisResult['lab']['conditions'] | null;
  period: {
    firstAnalyzedAt: string | null;
    lastAnalyzedAt: string | null;
    firstRetrievedAt: string | null;
    lastRetrievedAt: string | null;
    reason: 'missing-analysis-date' | 'no-successful-data' | null;
  };
  lab: {
    scores: Record<keyof AnalysisResult['lab']['scores'], MedianSample>;
    metrics: Record<keyof AnalysisResult['lab']['metrics'], MedianSample>;
  };
  /** Field datasets remain in their raw runs; no CrUX median is calculated. */
  fieldAggregation: 'not-aggregated';
}

function knownConditions(result: AnalysisResult): boolean {
  const conditions = result.lab.conditions;
  const screen = conditions.screenEmulation;
  return !!result.lab.engine.version && !!result.lab.engine.userAgent?.trim() && !!conditions.locale && !!conditions.throttlingMethod &&
    conditions.reportedFormFactor !== null && conditions.requestedProfile === result.profile &&
    conditions.reportedFormFactor === result.profile && conditions.throttling !== null &&
    Object.keys(conditions.throttling).length > 0 && Object.values(conditions.throttling).every(value => Number.isFinite(value) && value >= 0) && screen !== null &&
    screen.width !== null && screen.width > 0 && screen.height !== null && screen.height > 0 &&
    screen.deviceScaleFactor !== null && screen.deviceScaleFactor > 0 && screen.mobile === (result.profile === 'mobile');
}

function dateRange(values: (string | null)[]): [string | null, string | null] {
  const dates = values.filter((value): value is string => value !== null).sort((a, b) => Date.parse(a) - Date.parse(b));
  return [dates[0] ?? null, dates.at(-1) ?? null];
}
function sample(values: (number | null)[]): MedianSample {
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value) && value >= 0);
  return { median: median(valid), sampleCount: valid.length };
}

/**
 * All successful runs must be comparable; never select an arbitrary favourable
 * subgroup. Raw outcomes stay separate so withheld values remain auditable.
 */
export function summarizeRepeatedAnalysis(runs: readonly AnalysisBatch[], profiles: readonly AnalysisProfile[], requestedCount: RepetitionCount): RepeatedProfileSummary[] {
  return profiles.map(profile => {
    const outcomes = runs.flatMap(batch => batch.results.filter(outcome => outcome.profile === profile).map(outcome => ({ batch, outcome })));
    const successful = outcomes.flatMap(({ batch, outcome }) => outcome.status === 'success' ? [{ batch, data: outcome.data }] : []);
    const warnings = new Set<RepetitionWarning>();
    if (outcomes.length < requestedCount) warnings.add('incomplete-runs');
    if (outcomes.length > successful.length) warnings.add('failed-runs');
    if (!successful.length) warnings.add('no-successful-runs');
    if (successful.some(({ data }) => data.lab.warnings.length > 0)) warnings.add('lab-warnings');
    if (successful.some(({ data }) => data.profile !== profile || data.lab.conditions.requestedProfile !== profile || data.lab.conditions.reportedFormFactor !== profile)) warnings.add('profile-mismatch');
    if (successful.some(({ data }) => !knownConditions(data))) warnings.add('unknown-conditions');
    // A missing first user-agent must not hide distinct known engines later in
    // the sequence. Missing metadata and observed differences are independent.
    const knownUserAgents = new Set(successful.flatMap(({ data }) => data.lab.engine.userAgent?.trim() ? [data.lab.engine.userAgent] : []));
    if (knownUserAgents.size > 1) warnings.add('different-engine');
    const reference = successful[0]?.data;
    if (reference) for (const { data } of successful.slice(1)) for (const warning of comparisonWarnings(reference, data)) warnings.add(warning);
    const blockers: RepetitionWarning[] = ['different-target', 'different-profile', 'different-engine', 'different-conditions', 'redacted-target', 'unknown-conditions', 'profile-mismatch'];
    const withheld = successful.length > 0 && blockers.some(warning => warnings.has(warning));
    const eligible = withheld ? [] : successful;
    const scores = Object.fromEntries((['performance', 'seo', 'accessibility'] as const).map(key => [key, sample(eligible.map(({ data }) => data.lab.scores[key]))])) as RepeatedProfileSummary['lab']['scores'];
    const metrics = Object.fromEntries((['lcpMs', 'cls', 'fcpMs', 'speedIndexMs', 'tbtMs'] as const).map(key => [key, sample(eligible.map(({ data }) => data.lab.metrics[key]))])) as RepeatedProfileSummary['lab']['metrics'];
    const missingSamples = eligible.length > 0 && [...Object.values(scores), ...Object.values(metrics)].some(value => value.sampleCount < eligible.length);
    if (missingSamples) warnings.add('missing-samples');
    const [firstAnalyzedAt, lastAnalyzedAt] = dateRange(successful.map(({ data }) => data.analyzedAt));
    const [firstRetrievedAt, lastRetrievedAt] = dateRange(successful.map(({ data }) => data.retrievedAt));
    return {
      profile, status: withheld ? 'withheld' : !eligible.length ? 'unavailable' : warnings.size ? 'partial' : 'available',
      attemptedRuns: outcomes.length, successfulRuns: successful.length, eligibleRuns: eligible.length,
      sourceRunIds: eligible.map(({ batch }) => batch.requestId), excludedRunIds: outcomes.filter(({ batch }) => !eligible.some(candidate => candidate.batch === batch)).map(({ batch }) => batch.requestId),
      warnings: [...warnings], engine: eligible[0] ? { ...eligible[0].data.lab.engine } : null, conditions: eligible[0] ? structuredClone(eligible[0].data.lab.conditions) : null,
      period: { firstAnalyzedAt, lastAnalyzedAt, firstRetrievedAt, lastRetrievedAt, reason: !successful.length ? 'no-successful-data' : successful.some(({ data }) => data.analyzedAt === null) ? 'missing-analysis-date' : null },
      lab: { scores, metrics }, fieldAggregation: 'not-aggregated',
    };
  });
}
