import React, { useEffect, useId, useRef, useState } from 'react';
import type { AnalysisBatch } from '../../core/analysis/schema';
import { exportAnalysisMarkdown, type MarkdownReportSection } from '../../core/reports/markdown';
import { Button } from '../common/Button';
import { Icon } from '../common/Icon';
import { AnimatedPresence } from '../common/AnimatedPresence';
import s from './ReportExportActions.module.css';

export const REPORT_FEEDBACK_MS = 3500;
export const REPORT_SECTION_LABELS = {
  tr: { performance: 'Yerel Performans', seo: 'SEO ve Erişilebilirlik', geo: 'GEO', reports: 'Tüm Analizler' },
  en: { performance: 'Local Performance', seo: 'SEO & Accessibility', geo: 'GEO', reports: 'All Analyses' },
  no: { performance: 'Lokal ytelse', seo: 'SEO og tilgjengelighet', geo: 'GEO', reports: 'Alle analyser' },
};
const copy = {
  tr: { download: 'Markdown İndir', copy: 'Raporu Kopyala', busy: 'Kopyalanıyor…', copied: 'Kopyalandı', downloaded: 'İndirme başlatıldı', copyMessage: 'raporu panoya kopyalandı.', downloadMessage: 'raporu için indirme başlatıldı.', failed: 'Rapor kopyalanamadı. Markdown dosyasını indirebilirsiniz.', exportFailed: 'Rapor hazırlanamadı. Yeniden deneyin.' },
  en: { download: 'Download Markdown', copy: 'Copy Report', busy: 'Copying…', copied: 'Copied', downloaded: 'Download started', copyMessage: 'report copied to the clipboard.', downloadMessage: 'report download started.', failed: 'Copy failed. You can download the Markdown file.', exportFailed: 'Could not prepare the report. Try again.' },
  no: { download: 'Last ned Markdown', copy: 'Kopier rapport', busy: 'Kopierer…', copied: 'Kopiert', downloaded: 'Nedlasting startet', copyMessage: 'rapport kopiert til utklippstavlen.', downloadMessage: 'rapportnedlasting startet.', failed: 'Kopiering mislyktes. Du kan laste ned Markdown-filen.', exportFailed: 'Kunne ikke klargjøre rapporten. Prøv igjen.' },
};
interface Props { batch: AnalysisBatch; version: string; language: 'tr' | 'en' | 'no'; section: MarkdownReportSection; disabled: boolean }
interface Feedback { action: 'copy' | 'download'; kind: 'success' | 'error'; message: string }

/** Parent keys this component by report, section and preview so late actions cannot notify a different report. */
export function ReportExportActions({ batch, version, language, section, disabled }: Props) {
  const t = copy[language], scope = REPORT_SECTION_LABELS[language][section], scopeId = useId();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true), sequence = useRef(0), blocked = useRef(disabled);
  blocked.current = disabled;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; sequence.current++; }; }, []);
  useEffect(() => { if (disabled) { sequence.current++; setVisible(false); setBusy(false); } }, [disabled]);
  useEffect(() => {
    if (!visible || feedback?.kind !== 'success') return;
    const timer = window.setTimeout(() => setVisible(false), REPORT_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [visible, feedback]);
  const notify = (value: Feedback) => { setFeedback(value); setVisible(true); };
  const filename = section === 'reports' ? 'viewgrid-report.md' : 'viewgrid-' + section + '-report.md';
  const download = () => {
    if (disabled || busy) return;
    let url: string | undefined;
    const anchor = document.createElement('a');
    try {
      const report = exportAnalysisMarkdown(batch, version, language, section);
      url = URL.createObjectURL(new Blob([report], { type: 'text/markdown;charset=utf-8' }));
      anchor.href = url; anchor.download = filename;
      document.body.appendChild(anchor); anchor.click();
      notify({ action: 'download', kind: 'success', message: scope + ' ' + t.downloadMessage });
    } catch { notify({ action: 'download', kind: 'error', message: t.exportFailed }); }
    finally {
      anchor.remove();
      // Keep the object URL alive until the browser has started consuming the download.
      if (url) { const objectUrl = url; window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000); }
    }
  };
  const copyReport = async () => {
    if (disabled || busy) return;
    const action = ++sequence.current;
    setBusy(true); setVisible(false);
    try {
      await navigator.clipboard.writeText(exportAnalysisMarkdown(batch, version, language, section));
      if (mounted.current && action === sequence.current && !blocked.current) notify({ action: 'copy', kind: 'success', message: scope + ' ' + t.copyMessage });
    } catch {
      if (mounted.current && action === sequence.current && !blocked.current) notify({ action: 'copy', kind: 'error', message: t.failed });
    } finally { if (mounted.current && action === sequence.current) setBusy(false); }
  };
  const confirmed = (action: Feedback['action']) => visible && feedback?.kind === 'success' && feedback.action === action;
  return <div className={s.actions} data-report-actions={section}>
    <span id={scopeId} className={s.srOnly}>{scope}</span>
    <div className={s.buttons}>
      <Button aria-label={t.download} aria-describedby={scopeId} title={filename} data-confirmed={confirmed('download') || undefined} disabled={disabled || busy} onClick={download}><Icon name={confirmed('download') ? 'check' : 'arrowDown'} />{confirmed('download') ? t.downloaded : t.download}</Button>
      <Button aria-label={t.copy} aria-describedby={scopeId} data-confirmed={confirmed('copy') || undefined} disabled={disabled || busy} aria-busy={busy} onClick={() => void copyReport()}><Icon name={confirmed('copy') ? 'check' : 'copy'} />{busy ? t.busy : confirmed('copy') ? t.copied : t.copy}</Button>
    </div>
    <div className={s.feedbackSlot} role={feedback?.kind === 'error' ? 'alert' : 'status'} aria-live={feedback?.kind === 'error' ? 'assertive' : 'polite'} aria-atomic="true" aria-label={scope}>
      <AnimatedPresence open={visible} kind="menu"><p className={s.feedback} data-kind={feedback?.kind}>{feedback?.kind === 'success' && <Icon name="check" />}{feedback?.message}</p></AnimatedPresence>
    </div>
  </div>;
}
