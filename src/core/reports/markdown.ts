import type { AnalysisBatch } from '../analysis/schema';
import { localAuditWording, localAuditDescription } from '../analysis/local-engine';
import { summarizeAnalysis } from '../analysis/summary';
import { sanitizeAnalysisBatch } from '../analysis/history';
import { escapeReportText, geoRecommendations, labels, words, type ReportLanguage } from './html';

/** Plain text only: prevent headings, links, images and HTML supplied by the page. */
export function escapeMarkdownText(value: unknown): string {
  return escapeReportText(value)
    .replace(/\\/g, '\\\\')
    .replace(/([`*_{}[\]()#+!|~])/g, '\\$1')
    .replace(/[\r\n]+/g, ' ');
}

const localWords = {
  tr: {
    title: 'Yerel sayfa gözlemi',
    duration: 'Tarama süresi (ms)',
    coverage: 'İncelenen DOM öğesi',
    truncated: 'Sınırlı kapsam',
    rules: 'Kural sürümü',
    note: 'Yerel DOM gözlemi; Lighthouse skoru, CrUX ölçümü, tam güvenlik taraması veya uygunluk sertifikası değildir. Ek kurulum veya dış analiz API çağrısı yoktur.',
  },
  en: {
    title: 'Local page observation',
    duration: 'Scan duration (ms)',
    coverage: 'Inspected DOM elements',
    truncated: 'Limited coverage',
    rules: 'Rule version',
    note: 'Local DOM observation; not a Lighthouse score, CrUX measurement, full security scan or conformance certificate. No extra installation or external audit API call.',
  },
  no: {
    title: 'Lokal sideobservasjon',
    duration: 'Analysetid (ms)',
    coverage: 'Undersøkte DOM-elementer',
    truncated: 'Begrenset dekning',
    rules: 'Regelversjon',
    note: 'Lokal DOM-observasjon; ikke en Lighthouse-poengsum, CrUX-måling, full sikkerhetsanalyse eller et samsvarssertifikat. Ingen ekstra installasjon eller ekstern analyse-API.',
  },
};

export type MarkdownReportSection = 'performance' | 'seo' | 'geo' | 'reports';

export function exportAnalysisMarkdown(
  input: AnalysisBatch,
  version: string = '1.0.3',
  language: ReportLanguage = 'tr',
  section: MarkdownReportSection = 'reports',
): string {
  const batch = sanitizeAnalysisBatch(input);
  if (!batch) throw new Error('ANALYSIS_INVALID_REPORT');
  const t = words[language],
    local = localWords[language],
    e = escapeMarkdownText;
  const label = (value: string) => labels[value]?.[language] ?? value;
  const value = (entry: unknown) =>
    entry == null ? t.unavailable : typeof entry === 'boolean' ? (entry ? t.yes : t.no) : entry;
  const rows = (entries: [string, unknown][]) =>
    entries
      .map(
        ([key, entry]) =>
          `- ${e(key)}: ${e(value(typeof entry === 'number' && /\(ms\)/.test(key) ? Math.round(entry * 10) / 10 : entry))}`,
      )
      .join('\n');
  const all = section === 'reports';
  const sectionTitle =
    section === 'performance'
      ? t.performance
      : section === 'seo'
        ? `${t.seo} / ${t.accessibility}`
        : section === 'geo'
          ? t.geo
          : t.title;
  const statusLabel = (status: string) =>
    `${status === 'pass' ? '🟢 ' : status === 'fail' ? '🔴 ' : ''}${label(status)}`;
  const summaryTitle = { tr: 'Kontrol özeti', en: 'Check summary', no: 'Kontrolloversikt' }[
    language
  ];
  const out = [
    `# ${all ? t.title : `${t.title} — ${sectionTitle}`}`,
    rows([
      [t.version, `ViewGrid ${version}`],
      [t.target, batch.requestedUrl],
      [t.requestId, batch.requestId],
      [t.started, batch.startedAt],
      [t.completed, batch.completedAt],
    ]),
    t.limitations,
  ];
  for (const outcome of batch.results) {
    out.push(`## ${t.profile}: ${label(outcome.profile)}`);
    if (outcome.status !== 'success') {
      out.push(
        `### ${t.error}`,
        rows([
          [t.status, label(outcome.status)],
          [t.messageCode, outcome.error.messageCode],
          [t.httpStatus, outcome.error.httpStatus],
          [t.retryable, outcome.error.retryable],
        ]),
      );
      continue;
    }
    const data = outcome.data;
    out.push(
      rows([
        [t.source, data.source === 'viewgrid-local' ? 'ViewGrid' : 'Google PageSpeed Insights'],
        [t.finalUrl, data.finalUrl],
        [t.measuredAt, data.analyzedAt],
        [t.engine, `${data.lab.engine.name} ${data.lab.engine.version ?? t.unavailable}`],
      ]),
    );
    if (
      /(?:^|-)fixture(?:$|-)/i.test(data.lab.engine.version ?? '') ||
      data.lab.warnings.some((warning) => /^Controlled mock response\b/i.test(warning))
    )
      out.push(t.mock);
    if (all || section === 'performance') {
      out.push(`### ${data.source === 'viewgrid-local' ? local.title : t.laboratory}`);
      if (data.source === 'viewgrid-local') {
        out.push(
          local.note,
          rows([
            [t.width, data.lab.local?.width],
            [t.height, data.lab.local?.height],
            [local.coverage, data.lab.local?.scannedElements],
            [local.duration, data.lab.local?.durationMs],
            [local.truncated, data.lab.local?.truncated],
            [local.rules, data.lab.local?.ruleVersion],
            ['TTFB (ms)', data.lab.local?.navigation?.ttfbMs],
            ['DOMContentLoaded (ms)', data.lab.local?.navigation?.domContentLoadedMs],
            ['Load (ms)', data.lab.local?.navigation?.loadMs],
            ['FCP (ms)', data.lab.metrics.fcpMs],
            ['LCP (ms)', data.lab.metrics.lcpMs],
            ['CLS', data.lab.metrics.cls],
            [t.tbt, data.lab.metrics.tbtMs],
            ['INP (ms)', null],
          ]),
        );
      } else {
        out.push(
          t.independent,
          rows(
            Object.entries(data.lab.scores)
              .filter(([key]) => all || key === 'performance')
              .map(([key, score]) => [
                t[key as 'performance' | 'seo' | 'accessibility'],
                score == null ? null : `${score}/100`,
              ]),
          ),
          rows([
            ['LCP (ms)', data.lab.metrics.lcpMs],
            ['CLS', data.lab.metrics.cls],
            ['FCP (ms)', data.lab.metrics.fcpMs],
            [t.tbt, data.lab.metrics.tbtMs],
          ]),
        );
      }
    }
    const scopedAudits = all
      ? data.lab.audits
      : section === 'seo'
        ? data.lab.audits.filter(
            (audit) => audit.category === 'seo' || audit.category === 'accessibility',
          )
        : [];
    if (section !== 'performance') {
      const summary = summarizeAnalysis({ ...batch, profileSelection: outcome.profile, results: [outcome] }).sectionStates[section];
      out.push(`### ${summaryTitle}`, (['fail', 'pass', 'manual', 'unknown'] as const).map(status => `- ${statusLabel(status)}: ${summary[status]}`).join('\n'));
    }
    if (all || section === 'seo')
      for (const status of [
        'fail',
        'pass',
        'manual',
        'unknown',
        'error',
        'not-applicable',
        'informative',
      ] as const) {
        const audits = scopedAudits.filter((audit) => audit.status === status);
        if (!audits.length) continue;
        out.push(`### ${label(status)} (${audits.length})`);
        for (const audit of audits)
          out.push(
            `#### ${e((data.source === 'viewgrid-local' ? localAuditWording(audit.id, language)?.title : null) ?? audit.title)}`,
            rows([
              [t.auditId, audit.id],
              [t.category, t[audit.category]],
              [t.importance, label(audit.importance)],
              [t.status, statusLabel(status)],
              [
                audit.status === 'pass' ? ({ tr: 'Kontrol sonucu', en: 'Check result', no: 'Kontrollresultat' }[language]) : t.recommendation,
                data.source === 'viewgrid-local' ? localAuditDescription(audit, language) : audit.recommendation,
              ],
              ...(audit.displayValue
                ? [[(audit.status === 'pass' ? { tr: 'İncelenen öğe sayısı', en: 'Inspected element count', no: 'Antall undersøkte elementer' } : { tr: 'Etkilenen öğe sayısı', en: 'Affected element count', no: 'Antall berørte elementer' })[language], audit.displayValue] as [string, unknown]]
                : []),
            ]),
            ...audit.affectedItems.map((item) => `- ${t.affected}: ${e(item.url)}`),
          );
      }
    if (all || section === 'geo') {
      out.push(`### ${t.geo}`);
      for (const mode of ['automated', 'manual'] as const) {
        const criteria = data.geo.criteria.filter(criterion => criterion.mode === mode);
        if (!criteria.length) continue;
        out.push(`#### ${mode === 'automated' && data.source === 'viewgrid-local' ? ({tr:'Sayfadaki otomatik sinyaller',en:'Automated page signals',no:'Automatiske sidesignaler'}[language]) : t[mode]}`);
        if (mode === 'manual') out.push(t.manualNote);
        for (const criterion of criteria) out.push(`- ${e(label(criterion.id))}: ${e(statusLabel(criterion.status))} — ${e(geoRecommendations[criterion.recommendationCode]?.[language] ?? t.review)} (${e(criterion.evidenceAuditIds.map(id => { const audit = data.lab.audits.find(item => item.id === id); return audit ? (data.source === 'viewgrid-local' ? localAuditWording(id, language)?.title : null) ?? audit.title : id; }).join(', ') || t.noEvidence)})`);
      }
    }

    out.push(
      ...(all ? data.lab.warnings.map((warning) => `> ${e(warning)}`) : []),
      rows([
        [
          t.redactions,
          data.redactions
            .map((item) => (item === 'url-query' ? t.urlQuery : t.affectedContent))
            .join(', ') || t.none,
        ],
      ]),
    );
  }
  return out.join('\n\n') + '\n';
}
