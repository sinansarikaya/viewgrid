import { z } from 'zod';
import type { RepeatedAnalysisResult } from '../../lib/api/repeated-analysis';
import { analysisBatchSchema, analysisProfileSchema, type AnalysisBatch } from '../analysis/schema';
import { redactAnalysisUrl, sanitizeAnalysisBatch } from '../analysis/history';
import { summarizeRepeatedAnalysis, type RepeatedProfileSummary, type RepetitionWarning } from '../analysis/repetition';
import { escapeReportText, exportAnalysisHtml } from './html';

type Language = 'tr' | 'en' | 'no';
const inputSchema = z.object({
  schemaVersion: z.literal(1), requestId: z.string().max(200), requestedCount: z.union([z.literal(1), z.literal(3)]),
  completedCount: z.number().int().min(0).max(3), startedAt: z.iso.datetime({ offset: true }), completedAt: z.iso.datetime({ offset: true }),
  stopReason: z.enum(['completed', 'rate-limited', 'cancelled']), runs: z.array(analysisBatchSchema).max(3),
  // Only profile selection is read from supplied summaries. Medians and other
  // carried summary values are never trusted or copied into the report.
  profiles: z.array(z.object({ profile: analysisProfileSchema })).min(1).max(2),
});

function redactText(value: string): string {
  return value.replace(/https?:\/\/[^\s<>"')\]]+/gi, url => {
    const safe = redactAnalysisUrl(url);
    if (!safe) return '[redacted-url]';
    const parsed = new URL(url);
    return parsed.search || parsed.hash ? safe : url;
  })
    .replace(/\b(?:authorization|cookie)\s*[=:]\s*[^\r\n]+/gi, '[redacted]')
    .replace(/\b(?:api[_-]?key|token|password|secret|session)\s*[=:]\s*(?:"[^"]*"|'[^']*'|[^\s,;&]+)/gi, '[redacted]');
}
/** Additional metadata minimization, including foreign engine/condition text. */
function redactStrings<T>(value: T): T {
  if (typeof value === 'string') return redactText(value) as T;
  if (Array.isArray(value)) return value.map(item => redactStrings(item)) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [redactText(key), redactStrings(item)])) as T;
  return value;
}

function report(input: RepeatedAnalysisResult, version: string) {
  const parsed = inputSchema.safeParse(input), parsedVersion = z.string().min(1).max(200).safeParse(version);
  if (!parsed.success || !parsedVersion.success) throw new Error('ANALYSIS_INVALID_REPORT');
  const result = parsed.data;
  const profiles = result.profiles.map(summary => summary.profile);
  if (result.completedCount !== result.runs.length || result.runs.length > result.requestedCount ||
    (result.stopReason === 'completed' && result.completedCount !== result.requestedCount) || new Set(profiles).size !== profiles.length) throw new Error('ANALYSIS_INVALID_REPORT');
  const expectedSelection = profiles.length === 2 ? 'both' : profiles[0];
  if (new Set(result.runs.map(run => run.requestId)).size !== result.runs.length || result.runs.some(run =>
    run.profileSelection !== expectedSelection || run.results.length !== profiles.length ||
    profiles.some(profile => run.results.filter(outcome => outcome.profile === profile).length !== 1))) throw new Error('ANALYSIS_INVALID_REPORT');
  const terminalBatch = (run: AnalysisBatch) => run.results.some(outcome => outcome.status === 'cancelled' || outcome.error?.code === 'RATE_LIMITED');
  if (result.runs.slice(0, -1).some(terminalBatch) || (result.stopReason === 'completed' && result.runs.some(terminalBatch))) throw new Error('ANALYSIS_INVALID_REPORT');

  // Compute while raw engine/conditions are still present. Sanitizing first
  // would erase UA evidence; persisted redacted runs correctly stay withheld.
  const summaries = summarizeRepeatedAnalysis(result.runs, profiles, result.requestedCount).map(summary => ({
    ...summary, engine: summary.engine ? { ...summary.engine, userAgent: null } : null,
  }));
  const runs = result.runs.map(run => {
    // Remove multi-word header values before the common sanitizer masks their
    // labels; otherwise a trailing bearer credential could lose its context.
    const safe = sanitizeAnalysisBatch(redactStrings(run));
    if (!safe) throw new Error('ANALYSIS_INVALID_REPORT');
    return safe;
  });
  const controlledMock = result.runs.some(run => run.results.some(outcome => outcome.status === 'success' &&
    (/(?:^|-)fixture(?:$|-)/i.test(outcome.data.lab.engine.version ?? '') || outcome.data.lab.warnings.some(warning => /^Controlled mock response\b/i.test(warning)))));
  return redactStrings({
    reportSchemaVersion: 1 as const, reportKind: 'repeated-analysis' as const, extensionVersion: parsedVersion.data,
    repeatedAnalysis: { ...result, profiles: summaries, runs, controlledMock, summarySource: 'recomputed-from-input-runs-before-redaction' as const, fieldAggregation: 'not-aggregated' as const },
  });
}

const copy = {
  tr: {
    title: 'ViewGrid tekrarlı analiz raporu', summary: 'Laboratuvar medyan özeti', raw: 'Tekil ölçüm kayıtları', run: 'Ölçüm', version: 'Eklenti sürümü', id: 'İstek kimliği', requested: 'İstenen ölçüm sayısı', completed: 'Kayıtlı ölçüm sayısı (başarı sayısı değildir)', stop: 'Durdurma nedeni', started: 'Başlangıç tarihi', ended: 'Tamamlanma tarihi', profile: 'Profil', status: 'Özet durumu', attempted: 'Denenen', successful: 'Başarılı', failed: 'Başarısız', cancelled: 'İptal edilen', eligible: 'Medyan için uygun', withheld: 'Medyanı hesaplanmayan başarılı ölçümler', metric: 'Laboratuvar metriği / puanı', median: 'Medyan', samples: 'Geçerli örnek sayısı', unavailable: 'Veri yok / medyan hesaplanmadı', warnings: 'Uyarılar', noWarnings: 'Uyarı yok', engine: 'Ölçüm motoru', conditions: 'Ölçüm koşulları', period: 'Ölçüm tarih aralığı', measured: 'Bilinen ölçüm tarihleri', retrieved: 'Yanıt alınma tarihleri', missingDate: 'Bazı ölçüm tarihleri sunulmadı; yanıt alınma tarihi ölçüm tarihi yerine kullanılmaz.', noDate: 'Başarılı ölçüm tarihi yok.', sources: 'Medyanın kaynak ölçüm kimlikleri', excluded: 'Dışlanan ölçüm kimlikleri', field: 'CrUX saha metrikleri ortalanmadı. URL/origin verileri, dönemleri ve eksik veri nedenleri tekil kayıtlarda ayrı korunur.', rule: 'Medyan yalnız başarılı ve karşılaştırılabilir laboratuvar örneklerinden hesaplanır. Eksik veya başarısız örnekler sıfır değildir; koşullar bilinmiyor veya farklıysa medyan hesaplanmaz.', privacy: 'URL sorguları, ham öğe içeriği ve user-agent rapordan çıkarılmıştır. Bu redakte edilmiş rapordan yeni medyan üretilemez; ham kanıt yoksa hesaplama engellenir.', mock: 'Kontrollü mock / örnek veri: Bu rapor canlı PageSpeed ölçümü değildir; örnek değerler gerçek site performansını kanıtlamaz.', mobile: 'Mobil', desktop: 'Masaüstü', performance: 'Performans', seo: 'SEO', accessibility: 'Erişilebilirlik', tbt: 'TBT (ms) — INP değildir', completedReason: 'İstenen ölçümler tamamlandı', quotaReason: 'Kota sınırı (429); yeni tur gönderilmedi', cancelReason: 'İptal edildi; yeni tur gönderilmedi', available: 'Medyan mevcut', partial: 'Kısmi sonuç / uyarılı', withheldStatus: 'Medyan hesaplanmadı: uyumluluk doğrulanamadı', unavailableStatus: 'Başarılı örnek yok', locale: 'Ölçüm dili', method: 'Yavaşlatma yöntemi', throttling: 'Yavaşlatma ayarları', screen: 'Ekran emülasyonu (CSS px / DPR / mobil)', context: 'Uzak ölçüm; önizleme iframe’inden bağımsız',
  },
  en: {
    title: 'ViewGrid repeated analysis report', summary: 'Laboratory median summary', raw: 'Individual measurement records', run: 'Measurement', version: 'Extension version', id: 'Request ID', requested: 'Requested measurements', completed: 'Recorded measurements (not a success count)', stop: 'Stop reason', started: 'Start date', ended: 'Completion date', profile: 'Profile', status: 'Summary status', attempted: 'Attempted', successful: 'Successful', failed: 'Failed', cancelled: 'Cancelled', eligible: 'Eligible for median', withheld: 'Successful measurements withheld from median', metric: 'Laboratory metric / score', median: 'Median', samples: 'Valid sample count', unavailable: 'Unavailable / median not calculated', warnings: 'Warnings', noWarnings: 'No warnings', engine: 'Measurement engine', conditions: 'Measurement conditions', period: 'Measurement date range', measured: 'Known measurement dates', retrieved: 'Response retrieval dates', missingDate: 'Some measurement dates were not provided; retrieval dates are not substituted for measurement dates.', noDate: 'No successful measurement dates.', sources: 'Source measurement IDs for median', excluded: 'Excluded measurement IDs', field: 'CrUX field metrics are not aggregated. URL/origin data, periods and missing-data reasons remain separate in individual records.', rule: 'Medians use only successful, comparable laboratory samples. Missing or failed samples are not zero; medians are withheld when conditions are unknown or differ.', privacy: 'URL queries, raw item content and user-agent are removed from the report. A new median cannot be derived from this redacted report; missing raw evidence withholds aggregation.', mock: 'Controlled mock / sample data: This report is not a live PageSpeed measurement; sample values do not establish real site performance.', mobile: 'Mobile', desktop: 'Desktop', performance: 'Performance', seo: 'SEO', accessibility: 'Accessibility', tbt: 'TBT (ms) — not INP', completedReason: 'Requested measurements completed', quotaReason: 'Quota limit (429); no new round sent', cancelReason: 'Cancelled; no new round sent', available: 'Median available', partial: 'Partial result / warnings', withheldStatus: 'Median withheld: comparability not verified', unavailableStatus: 'No successful samples', locale: 'Measurement language', method: 'Throttling method', throttling: 'Throttling settings', screen: 'Screen emulation (CSS px / DPR / mobile)', context: 'Remote measurement; independent of the preview iframe',
  },
  no: {
    title: 'ViewGrid rapport for gjentatte analyser', summary: 'Medianoppsummering for laboratoriemålinger', raw: 'Enkeltmålinger', run: 'Måling', version: 'Utvidelsesversjon', id: 'Forespørsels-ID', requested: 'Forespurte målinger', completed: 'Registrerte målinger (ikke antall vellykkede)', stop: 'Årsak til stopp', started: 'Startdato', ended: 'Sluttdato', profile: 'Profil', status: 'Oppsummeringsstatus', attempted: 'Forsøkt', successful: 'Vellykkede', failed: 'Mislykkede', cancelled: 'Avbrutte', eligible: 'Egnet for median', withheld: 'Vellykkede målinger utelatt fra median', metric: 'Laboratoriemåleverdi / poengsum', median: 'Median', samples: 'Antall gyldige prøver', unavailable: 'Ikke tilgjengelig / median ikke beregnet', warnings: 'Advarsler', noWarnings: 'Ingen advarsler', engine: 'Målemotor', conditions: 'Måleforhold', period: 'Måledatointervall', measured: 'Kjente måledatoer', retrieved: 'Datoer for mottatte svar', missingDate: 'Noen måledatoer ble ikke oppgitt; datoer for mottatte svar erstatter ikke måledatoer.', noDate: 'Ingen datoer for vellykkede målinger.', sources: 'Kildemålingenes ID-er for median', excluded: 'Utelatte målingers ID-er', field: 'CrUX-feltverdier aggregeres ikke. URL/origin-data, perioder og årsaker til manglende data beholdes separat i enkeltmålingene.', rule: 'Medianer bruker kun vellykkede og sammenlignbare laboratorieprøver. Manglende eller mislykkede prøver er ikke null; medianen utelates ved ukjente eller ulike måleforhold.', privacy: 'URL-spørringer, rått elementinnhold og user-agent fjernes fra rapporten. En ny median kan ikke utledes fra denne sladdede rapporten; uten rå belegg utelates beregningen.', mock: 'Kontrollerte testdata / eksempeldata: Denne rapporten er ikke en direkte PageSpeed-måling; eksempelverdier dokumenterer ikke nettstedets faktiske ytelse.', mobile: 'Mobil', desktop: 'Skrivebord', performance: 'Ytelse', seo: 'SEO', accessibility: 'Tilgjengelighet', tbt: 'TBT (ms) — ikke INP', completedReason: 'Forespurte målinger fullført', quotaReason: 'Kvotegrense (429); ingen ny runde sendt', cancelReason: 'Avbrutt; ingen ny runde sendt', available: 'Median tilgjengelig', partial: 'Delvis resultat / advarsler', withheldStatus: 'Median utelatt: sammenlignbarhet ikke verifisert', unavailableStatus: 'Ingen vellykkede prøver', locale: 'Målespråk', method: 'Metode for struping', throttling: 'Innstillinger for struping', screen: 'Skjermemulering (CSS px / DPR / mobil)', context: 'Ekstern måling; uavhengig av forhåndsvisningens iframe',
  },
};

const warningText: Record<RepetitionWarning, Record<Language, string>> = {
  'different-target': { tr: 'Ölçümler farklı hedef adreslere ait.', en: 'Measurements have different target URLs.', no: 'Målingene har forskjellige mål-URL-er.' },
  'different-profile': { tr: 'Cihaz profilleri farklı.', en: 'Device profiles differ.', no: 'Enhetsprofilene er forskjellige.' },
  'different-engine': { tr: 'Motor sürümü veya bilinen user-agent bilgileri farklı.', en: 'Engine versions or known user-agents differ.', no: 'Motorversjoner eller kjente user-agenter er forskjellige.' },
  'different-conditions': { tr: 'Ölçüm koşulları farklı.', en: 'Measurement conditions differ.', no: 'Måleforholdene er forskjellige.' },
  'redacted-target': { tr: 'Hedef/kanıt daha önce redakte edilmiş; karşılaştırılabilirlik doğrulanamaz.', en: 'Target/evidence was previously redacted; comparability cannot be verified.', no: 'Mål/belegg er tidligere sladdet; sammenlignbarhet kan ikke verifiseres.' },
  'unknown-conditions': { tr: 'Motor, user-agent veya ölçüm koşulları eksik/bilinmiyor.', en: 'Engine, user-agent or measurement conditions are missing/unknown.', no: 'Motor, user-agent eller måleforhold mangler/er ukjente.' },
  'no-successful-runs': { tr: 'Başarılı ölçüm yok.', en: 'No successful measurements.', no: 'Ingen vellykkede målinger.' },
  'failed-runs': { tr: 'Bazı ölçümler başarısız veya iptal edildi; medyana katılmadı.', en: 'Some measurements failed or were cancelled and were excluded from the median.', no: 'Noen målinger mislyktes eller ble avbrutt og er utelatt fra medianen.' },
  'incomplete-runs': { tr: 'İstenen tüm ölçüm turları tamamlanmadı.', en: 'Not all requested rounds were completed.', no: 'Ikke alle forespurte runder ble fullført.' },
  'profile-mismatch': { tr: 'Bildirilen profil istenen profille eşleşmiyor.', en: 'Reported profile does not match the requested profile.', no: 'Rapportert profil samsvarer ikke med forespurt profil.' },
  'missing-samples': { tr: 'Bazı metrik/puan örnekleri eksik; her satırın örnek sayısı ayrıdır.', en: 'Some metric/score samples are missing; each row has its own sample count.', no: 'Noen måleverdier/poengsummer mangler; hver rad har eget prøveantall.' },
  'lab-warnings': { tr: 'Laboratuvar uyarıları var; tekil ölçüm kayıtlarını inceleyin.', en: 'Laboratory warnings exist; review the individual records.', no: 'Laboratorieadvarsler finnes; se enkeltmålingene.' },
};

export function exportRepeatedAnalysisJson(result: RepeatedAnalysisResult, version: string): string {
  return JSON.stringify(report(result, version), null, 2);
}

export function exportRepeatedAnalysisHtml(result: RepeatedAnalysisResult, version: string, language: Language = 'tr'): string {
  if (!['tr', 'en', 'no'].includes(language)) throw new Error('ANALYSIS_INVALID_REPORT');
  const exported = report(result, version), analysis = exported.repeatedAnalysis, t = copy[language], e = escapeReportText;
  const value = (input: unknown) => input === null || input === undefined ? e(t.unavailable) : e(input);
  const table = (rows: [string, unknown][]) => `<table><tbody>${rows.map(([label, item]) => `<tr><th>${e(label)}</th><td>${value(item)}</td></tr>`).join('')}</tbody></table>`;
  const range = (first: string | null, last: string | null) => first && last ? `${first} / ${last}` : null;
  const summary = (profile: RepeatedProfileSummary) => {
    const outcomes = analysis.runs.flatMap(run => run.results.filter(outcome => outcome.profile === profile.profile));
    const config = profile.conditions;
    const status = profile.status === 'withheld' ? t.withheldStatus : profile.status === 'unavailable' ? t.unavailableStatus : t[profile.status];
    const rows: [string, number | null, number][] = [
      ...(['performance', 'seo', 'accessibility'] as const).map(key => [`${t[key]} (0–100)`, profile.lab.scores[key].median, profile.lab.scores[key].sampleCount] as [string, number | null, number]),
      ...(['lcpMs', 'cls', 'fcpMs', 'speedIndexMs', 'tbtMs'] as const).map(key => [{ lcpMs: 'LCP (ms)', cls: 'CLS', fcpMs: 'FCP (ms)', speedIndexMs: 'Speed Index (ms)', tbtMs: t.tbt }[key], profile.lab.metrics[key].median, profile.lab.metrics[key].sampleCount] as [string, number | null, number]),
    ];
    return `<section class="summary"><h2>${e(t.summary)}: ${e(t[profile.profile])}</h2>${table([[t.status, status], [t.attempted, profile.attemptedRuns], [t.successful, profile.successfulRuns], [t.failed, outcomes.filter(outcome => outcome.status === 'error').length], [t.cancelled, outcomes.filter(outcome => outcome.status === 'cancelled').length], [t.eligible, profile.eligibleRuns], [t.withheld, profile.status === 'withheld' ? profile.successfulRuns : 0]])}
      <table><thead><tr><th>${e(t.metric)}</th><th>${e(t.median)}</th><th>${e(t.samples)}</th></tr></thead><tbody>${rows.map(([label, median, count]) => `<tr><th>${e(label)}</th><td>${value(median)}</td><td>${e(count)}</td></tr>`).join('')}</tbody></table>
      <h3>${e(t.warnings)}</h3>${profile.warnings.length ? `<ul>${profile.warnings.map(warning => `<li>${e(warningText[warning][language])}</li>`).join('')}</ul>` : `<p>${e(t.noWarnings)}</p>`}
      <h3>${e(t.engine)}</h3><p>${value(profile.engine ? `${profile.engine.name} ${profile.engine.version ?? t.unavailable}` : null)}</p>
      <h3>${e(t.conditions)}</h3>${config ? table([[t.profile, t[config.requestedProfile]], [t.locale, config.locale], [t.method, config.throttlingMethod], [t.throttling, config.throttling ? JSON.stringify(config.throttling) : null], [t.screen, config.screenEmulation ? JSON.stringify(config.screenEmulation) : null], [t.conditions, t.context]]) : `<p>${e(t.unavailable)}</p>`}
      <h3>${e(t.period)}</h3>${table([[t.measured, range(profile.period.firstAnalyzedAt, profile.period.lastAnalyzedAt)], [t.retrieved, range(profile.period.firstRetrievedAt, profile.period.lastRetrievedAt)]])}${profile.period.reason ? `<p>${e(profile.period.reason === 'missing-analysis-date' ? t.missingDate : t.noDate)}</p>` : ''}
      ${table([[t.sources, profile.sourceRunIds.join(', ') || null], [t.excluded, profile.excludedRunIds.join(', ') || null]])}<p class="notice">${e(t.field)}</p></section>`;
  };
  const raw = (run: AnalysisBatch, index: number) => {
    const html = exportAnalysisHtml(run, exported.extensionVersion, language);
    const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1];
    if (body === undefined) throw new Error('ANALYSIS_INVALID_REPORT');
    // Only a body produced by our escaped static exporter is inserted, never
    // user-supplied HTML. No nested document/head/style/script is copied.
    return `<section class="raw-run"><h2>${e(t.run)} ${index + 1}</h2>${body.replaceAll('<h1>', '<h3>').replaceAll('</h1>', '</h3>')}</section>`;
  };
  const stop = analysis.stopReason === 'completed' ? t.completedReason : analysis.stopReason === 'rate-limited' ? t.quotaReason : t.cancelReason;
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'none'; base-uri 'none'; form-action 'none'"><title>${e(t.title)}</title><style>
  :root{color-scheme:light}*{box-sizing:border-box}body{font:14px/1.55 system-ui,sans-serif;color:#172735;background:#fff;max-width:1000px;margin:auto;padding:32px}header{border-bottom:3px solid #087c96;padding-bottom:16px}h1{font-size:28px}h2{font-size:22px;color:#07576b}h3{font-size:17px;margin-top:26px}h4,h5{font-size:14px}table{border-collapse:collapse;width:100%;margin:12px 0;table-layout:fixed}th,td{text-align:left;vertical-align:top;padding:8px;border:1px solid #cad4dc;overflow-wrap:anywhere}th{background:#eef5f8}pre{font:11px/1.5 ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f7f9;padding:12px}article{border-left:3px solid #087c96;padding:0 14px}.notice{background:#fff4d9;padding:12px}section{margin-top:32px}footer{margin-top:32px;border-top:1px solid #cad4dc;padding-top:12px}@page{size:A4;margin:15mm}@media print{body{padding:0;font-size:11px}h2,h3,h4,h5{break-after:avoid}tr{break-inside:avoid}.raw-run{break-before:page}article{break-inside:avoid}pre{font-size:9px}}
  </style></head><body><header><h1>${e(t.title)}</h1>${analysis.controlledMock ? `<p class="notice" role="note">${e(t.mock)}</p>` : ''}${table([[t.version, exported.extensionVersion], [t.id, analysis.requestId], [t.requested, analysis.requestedCount], [t.completed, analysis.completedCount], [t.stop, stop], [t.started, analysis.startedAt], [t.ended, analysis.completedAt]])}<p>${e(t.rule)}</p><p>${e(t.privacy)}</p></header>
  ${analysis.profiles.map(summary).join('')}<h2>${e(t.raw)}</h2>${analysis.runs.map(raw).join('')}<footer>${e(t.field)}</footer></body></html>`;
}
