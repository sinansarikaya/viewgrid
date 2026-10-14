import type { AnalysisBatch, AnalysisProfile } from './schema';

export interface AuditStatusCounts { pass: number; fail: number; manual: number; unknown: number }
export interface ProfileAnalysisSummary {
  profile: AnalysisProfile;
  performance: AuditStatusCounts;
  seo: AuditStatusCounts;
  accessibility: AuditStatusCounts;
  geo: AuditStatusCounts;
}
export interface AnalysisFailureCounts { performance: number; seo: number; geo: number; reports: number }
export type AnalysisSection = keyof AnalysisFailureCounts;
export interface AnalysisSectionState extends AuditStatusCounts { state: 'fail' | 'pass' | 'review' | 'unavailable' }
export type AnalysisSectionStates = Record<AnalysisSection, AnalysisSectionState>;
const emptyCounts = (): AuditStatusCounts => ({ pass: 0, fail: 0, manual: 0, unknown: 0 });

/** Profile overviews count observed checks; navigation badges count distinct confirmed failures. */
export function summarizeAnalysis(batch: AnalysisBatch): { counts: AnalysisFailureCounts; profiles: ProfileAnalysisSummary[]; sectionStates: AnalysisSectionStates } {
  const failed = { performance: new Set<string>(), seo: new Set<string>(), geo: new Set<string>() };
  const profiles: ProfileAnalysisSummary[] = [];
  const independentGeoFailures = new Set<string>();
  let observedPerformances = 0;
  const totals = { performance: emptyCounts(), seo: emptyCounts(), geo: emptyCounts() };
  const requested = batch.profileSelection === 'both' ? ['mobile', 'desktop'] : [batch.profileSelection];
  const missing = requested.filter(profile => !batch.results.some(outcome => outcome.profile === profile && outcome.status === 'success')).length;
  for (const outcome of batch.results) {
    if (outcome.status !== 'success') continue;
    const summary: ProfileAnalysisSummary = { profile: outcome.profile, performance: emptyCounts(), seo: emptyCounts(), accessibility: emptyCounts(), geo: emptyCounts() };
    for (const audit of outcome.data.lab.audits) {
      if (audit.status === 'pass' || audit.status === 'fail' || audit.status === 'manual' || audit.status === 'unknown') summary[audit.category][audit.status]++;
      if (audit.status === 'fail') failed[audit.category === 'performance' ? 'performance' : 'seo'].add(`${audit.category}:${audit.id}`);
    }
    for (const criterion of outcome.data.geo.criteria) {
      summary.geo[criterion.status]++;
      if (criterion.status === 'fail' && criterion.mode === 'automated') {
        failed.geo.add(criterion.id);
        if (!criterion.evidenceAuditIds.some(id => outcome.data.lab.audits.some(audit => audit.id === id && audit.status === 'fail'))) independentGeoFailures.add(criterion.id);
      }
    }
    for (const category of ['performance', 'seo', 'accessibility'] as const) {
      const section = category === 'performance' ? 'performance' : 'seo';
      for (const status of ['pass', 'fail', 'manual', 'unknown'] as const) totals[section][status] += summary[category][status];
      totals[section].unknown += outcome.data.lab.audits.filter(audit => audit.category === category && audit.status === 'error').length;
    }
    for (const criterion of outcome.data.geo.criteria) {
      const status = criterion.mode === 'manual' && criterion.status === 'fail' ? 'manual' : criterion.status;
      totals.geo[status]++;
    }
    if (!outcome.data.lab.audits.some(audit => audit.category === 'performance') && outcome.data.source === 'viewgrid-local') {
      const navigation = outcome.data.lab.local?.navigation;
      const measurements = [outcome.data.lab.metrics.fcpMs, navigation?.ttfbMs, navigation?.domContentLoadedMs, navigation?.loadMs];
      if (measurements.some(value => typeof value === 'number' && Number.isFinite(value) && value >= 0)) { totals.performance.pass++; observedPerformances++; }
      else totals.performance.unknown++;
    }
    profiles.push(summary);
  }
  const counts = { performance: failed.performance.size, seo: failed.seo.size, geo: failed.geo.size, reports: failed.performance.size + failed.seo.size + independentGeoFailures.size };
  const stateFor = (value: AuditStatusCounts): AnalysisSectionState => ({ ...value, state: value.fail > 0 ? 'fail' : value.manual > 0 ? 'review' : value.unknown > 0 ? (value.pass > 0 ? 'review' : 'unavailable') : value.pass > 0 ? 'pass' : 'unavailable' });
  const sectionStates = {} as AnalysisSectionStates;
  for (const section of ['performance', 'seo', 'geo'] as const) {
    sectionStates[section] = stateFor({ ...totals[section], fail: counts[section], unknown: totals[section].unknown + missing });
  }
  sectionStates.reports = stateFor({
    pass: totals.performance.pass - observedPerformances + totals.seo.pass + totals.geo.pass,
    fail: counts.reports,
    manual: totals.performance.manual + totals.seo.manual + totals.geo.manual,
    unknown: sectionStates.performance.unknown + sectionStates.seo.unknown + sectionStates.geo.unknown,
  });
  // An empty section is not evidence of success for the combined report.
  if (sectionStates.reports.state === 'pass' && ['performance', 'seo', 'geo'].some(section => sectionStates[section as keyof typeof totals].state !== 'pass')) sectionStates.reports.state = 'review';
  return { counts, profiles, sectionStates };
}
