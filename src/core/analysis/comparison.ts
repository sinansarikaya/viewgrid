import type { AnalysisResult } from './schema';

export type ComparisonWarning = 'different-target' | 'different-profile' | 'different-engine' | 'different-conditions' | 'redacted-target' | 'unknown-conditions';
function canonical(value: unknown): string {
  if (!value || typeof value !== 'object') return JSON.stringify(value);
  return JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])));
}
export function comparisonWarnings(a: AnalysisResult, b: AnalysisResult): ComparisonWarning[] {
  const warnings: ComparisonWarning[] = [];
  if (a.requestedUrl !== b.requestedUrl || a.finalUrl !== b.finalUrl) warnings.push('different-target');
  if (a.profile !== b.profile) warnings.push('different-profile');
  if (a.lab.engine.version !== b.lab.engine.version || (a.lab.engine.userAgent && b.lab.engine.userAgent && a.lab.engine.userAgent !== b.lab.engine.userAgent)) warnings.push('different-engine');
  if (a.redactions.length || b.redactions.length) warnings.push('redacted-target');
  if (!a.lab.conditions.throttlingMethod || !b.lab.conditions.throttlingMethod || !a.lab.engine.version || !b.lab.engine.version) warnings.push('unknown-conditions');
  if (canonical(a.lab.conditions) !== canonical(b.lab.conditions)) warnings.push('different-conditions');
  return warnings;
}

/** Missing/failed runs are omitted, never replaced with synthetic zeroes. */
export function median(values: readonly (number | null)[]): number | null {
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value) && value >= 0).sort((a, b) => a - b);
  const middle = Math.floor(valid.length / 2);
  return !valid.length ? null : valid.length % 2 ? valid[middle]! : (valid[middle - 1]! + valid[middle]!) / 2;
}
