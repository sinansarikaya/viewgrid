import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './store';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { b } from '../../platform/browser';
import type { RepeatedAnalysisResult } from '../../lib/api/repeated-analysis';
import { createLocalAnalysisRunner } from '../../lib/api/local-analysis';
import type { RepetitionCount, RepeatedProfileSummary } from '../../core/analysis/repetition';
import { localAnalysisUrlSchema } from '../../lib/validation/local-analysis';
import {
  loadAnalysisHistory,
  saveAnalysisBatchToHistory,
  deleteAnalysisHistoryEntry,
  clearAnalysisHistory,
  compareAnalysisEntries,
  type HistoryComparison,
} from '../../lib/api/analysis-history';
import { exportAnalysisHtml, exportAnalysisJson, labels as reportLabels } from '../../core/reports/html';
import { ReportExportActions } from './ReportExportActions';
import { exportRepeatedAnalysisHtml, exportRepeatedAnalysisJson } from '../../core/reports/repeated';
import {
  attachScreenshotToHtml,
  attachScreenshotToJson,
  type ReportScreenshot,
} from '../../core/reports/screenshots';
import type { AnalysisBatch, AnalysisError, AnalysisOutcome, NormalizedAudit } from '../../core/analysis/schema';
import type { AnalysisHistoryEntry } from '../../core/analysis/history';
import { getAnalysisTranslation, getGeoRecommendationText, LOCAL_ANALYSIS_COPY } from './analysis-i18n';
import { localAuditDescription, localAuditWording } from '../../core/analysis/local-engine';
import { summarizeAnalysis } from '../../core/analysis/summary';
import s from './AnalysisPanel.module.css';

export interface AnalysisPanelProps {
  section: 'performance' | 'seo' | 'reports' | 'geo';
  onClose: () => void;
  isOpen?: boolean;
  onCaptureViewport?: () => Promise<ReportScreenshot>;
}

export function AnalysisPanel({ section: initialSection, onClose, onCaptureViewport, isOpen = true }: AnalysisPanelProps) {
  const st = useStore();
  const lang = st.language;
  const local = LOCAL_ANALYSIS_COPY[lang];
  const t = { ...getAnalysisTranslation(lang), ...local, runAnalysis: lang === 'tr' ? 'Tüm Analizleri Başlat' : lang === 'no' ? 'Kjør alle analyser' : 'Run All Analyses', tabPerformance: local.tab, invalidUrlError: local.invalidUrl };

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'performance' | 'seo' | 'geo' | 'reports'>(initialSection);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'auto' }); }, [activeTab]);

  // Analysis target inputs
  const [targetUrl, setTargetUrl] = useState(() => st.model.url || '');
  const [profileSelection, setProfileSelection] = useState<'mobile' | 'desktop' | 'both'>('both');
  const runCount: RepetitionCount = 1;
  const workspaceUrlRef = useRef(st.model.url);
  useEffect(() => {
    if (workspaceUrlRef.current === st.model.url) return;
    workspaceUrlRef.current = st.model.url;
    setTargetUrl(st.model.url || '');
  }, [st.model.url]);

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [analysisCancelled, setAnalysisCancelled] = useState(false);
  const [runnerError, setRunnerError] = useState<AnalysisError | null>(null);
  const [activeBatch, setActiveBatch] = useState<AnalysisBatch | null>(null);
  const [activeRepetition, setActiveRepetition] = useState<RepeatedAnalysisResult | null>(null);
  const [isStaleBatch, setIsStaleBatch] = useState(false);

  // Viewport screenshot state (memory only, never persisted to history or sent externally)
  const [screenshot, setScreenshot] = useState<ReportScreenshot | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Status & toast alerts
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  // History states
  const [historyList, setHistoryList] = useState<AnalysisHistoryEntry[]>([]);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Compare states
  const [beforeId, setBeforeId] = useState<string>('');
  const [afterId, setAfterId] = useState<string>('');
  const [compareResult, setCompareResult] = useState<HistoryComparison | null>(null);

  // Filter states for Audits tab
  const [auditFilterStatus, setAuditFilterStatus] = useState<string>('all');
  const [auditFilterCategory, setAuditFilterCategory] = useState<string>('all');
  const [auditFilterSeverity, setAuditFilterSeverity] = useState<string>('all');

  // Stale-safe runner ref and execution generation counter
  const runnerRef = useRef(createLocalAnalysisRunner());
  const runGenerationRef = useRef(0);
  const captureGenerationRef = useRef(0);
  const isMountedRef = useRef(true);

  // Load history on mount
  useEffect(() => {
    isMountedRef.current = true;
    loadAnalysisHistory()
      .then((entries) => {
        if (!isMountedRef.current) return;
        setHistoryList(entries);
        if (entries.length > 0 && !activeBatch) {
          if (entries.length >= 2 && entries[0] && entries[1]) {
            setBeforeId(entries[1].id);
            setAfterId(entries[0].id);
          } else if (entries.length === 1 && entries[0]) {
            setBeforeId(entries[0].id);
            setAfterId(entries[0].id);
          }
        }
      })
      .catch((err: any) => {
        if (!isMountedRef.current) return;
        const errKey = `err_${err?.code || 'HISTORY_LOAD_FAILED'}` as keyof typeof t;
        setAlertNotice((t[errKey] as string) || t.err_UNKNOWN);
      });

    return () => {
      isMountedRef.current = false;
      runnerRef.current.cancel();
    };
  }, []);

  useEffect(() => { if (!isOpen) { runGenerationRef.current++; runnerRef.current.cancel(); setIsRunning(false); setIsSavingHistory(false); } }, [isOpen]);

  // Sync initial tab if parent changes section prop
  useEffect(() => {
    if (isOpen) setActiveTab(initialSection);
  }, [initialSection, isOpen]);

  // Reset active state when language changes so stale language result is not displayed as current
  const prevLangRef = useRef(lang);
  useEffect(() => {
    if (prevLangRef.current !== lang) {
      prevLangRef.current = lang;
      runGenerationRef.current++;
      captureGenerationRef.current++;
      runnerRef.current.cancel();
      setIsRunning(false);
      setIsSavingHistory(false);
      setAnalysisCancelled(false);
      setRunnerError(null);
      setActiveBatch(null);
      setActiveRepetition(null);
      setScreenshot(null);
      setIsStaleBatch(false);
    }
  }, [lang]);

  const previewRevision = `${st.previewGeneration}:${st.analysisRevision}`;
  const previousPreviewRef = useRef(previewRevision);
  useEffect(() => {
    if (previousPreviewRef.current === previewRevision) return;
    previousPreviewRef.current = previewRevision;
    captureGenerationRef.current++;
    setScreenshot(null);
    setIsCapturing(false);
    runGenerationRef.current++;
    runnerRef.current.cancel();
    setIsRunning(false);
    setIsSavingHistory(false);
    setIsStaleBatch(true);
    if (isRunning) setAnalysisCancelled(true);
  }, [previewRevision]);

  const isUrlValid = useMemo(() => {
    return localAnalysisUrlSchema.safeParse(targetUrl).success;
  }, [targetUrl]);

  // If user edits targetUrl or changes profileSelection after a batch was loaded,
  // clearly flag that the displayed batch belongs to the earlier target/profile.
  const isTargetChanged = useMemo(() => {
    if (!activeBatch) return false;
    const parsedTarget = localAnalysisUrlSchema.safeParse(targetUrl);
    const urlDiffers = !parsedTarget.success || activeBatch.requestedUrl !== parsedTarget.data;
    const profileDiffers = activeBatch.profileSelection !== profileSelection;
    return urlDiffers || profileDiffers;
  }, [activeBatch, targetUrl, profileSelection]);

  // Run analysis handler
  const handleStartAnalysis = async () => {
    if (!isUrlValid || isRunning || isCapturing) return;

    st.setAnalysisSummary(null);
    const previewGeneration = st.previewGeneration;
    const analysisRevision = st.analysisRevision;
    const currentGen = ++runGenerationRef.current;
    setIsRunning(true);
    setAnalysisCancelled(false);
    setRunnerError(null);
    setAlertNotice(null);
    // Mark any existing batch as stale while new analysis executes
    if (activeBatch) {
      setIsStaleBatch(true);
    }

    try {
      const result = await runnerRef.current.run(
        {
          url: targetUrl,
          profile: profileSelection,
          locale: lang,
        },
        runCount,
      );

      if (isMountedRef.current && currentGen === runGenerationRef.current && result) {
        setActiveRepetition(result);
        const latestBatch = result.runs.at(-1) ?? null;
        setActiveBatch(latestBatch);
        if (useStore.getState().previewGeneration === previewGeneration && useStore.getState().analysisRevision === analysisRevision) st.setAnalysisSummary(latestBatch);
        setIsStaleBatch(false);

        // Await history save chain within the same execution generation
        // Ensures isRunning does not release prematurely causing rapid-run or delete/clear races
        setIsSavingHistory(true);
        try {
          let latestHistory = historyList;
          for (const run of result.runs) {
            if (!isMountedRef.current || currentGen !== runGenerationRef.current) break;
            latestHistory = await saveAnalysisBatchToHistory(run);
          }
          if (isMountedRef.current && currentGen === runGenerationRef.current) {
            setHistoryList(latestHistory);
            if (latestHistory.length >= 2 && latestHistory[0] && latestHistory[1]) {
              setBeforeId(latestHistory[1].id);
              setAfterId(latestHistory[0].id);
            }
          }
        } catch (saveErr: any) {
          // Preserve analysis results even if storage fails; warn user safely
          if (isMountedRef.current && currentGen === runGenerationRef.current) {
            const errKey = `err_${saveErr?.code || 'HISTORY_SAVE_FAILED'}` as keyof typeof t;
            setAlertNotice((t[errKey] as string) || t.err_UNKNOWN);
          }
        }
      }
    } catch (err: any) {
      if (isMountedRef.current && currentGen === runGenerationRef.current) {
        if (err?.detail) {
          setRunnerError(err.detail);
        } else {
          setRunnerError({
            code: 'MEASUREMENT_FAILED',
            messageCode: 'ANALYSIS_MEASUREMENT_FAILED',
            retryable: true,
            httpStatus: null,
          });
        }
      }
    } finally {
      if (isMountedRef.current && currentGen === runGenerationRef.current) {
        setIsSavingHistory(false);
        setIsRunning(false);
      }
    }
  };

  const handleCancelAnalysis = () => {
    if (isSavingHistory) return;
    runGenerationRef.current++;
    runnerRef.current.cancel();
    if (isMountedRef.current) {
      setIsRunning(false);
      setAnalysisCancelled(true);
    }
  };

  // Capture viewport screenshot via prop callback
  const handleCaptureScreenshot = async () => {
    if (!onCaptureViewport || isRunning || isCapturing) return;
    const currentCapture = ++captureGenerationRef.current;
    setIsCapturing(true);
    setAlertNotice(null);
    try {
      const shot = await onCaptureViewport();
      if (!isMountedRef.current || currentCapture !== captureGenerationRef.current) return;
      setScreenshot(shot);
    } catch {
      if (!isMountedRef.current) return;
      setAlertNotice(t.captureScreenshotError);
    } finally {
      if (isMountedRef.current) {
        setIsCapturing(false);
      }
    }
  };

  // Safe manifest version helper (no invented versions)
  const getManifestVersion = (): string | null => {
    try {
      const manifest = b.runtime.getManifest();
      return (manifest as any)?.version || null;
    } catch {
      return null;
    }
  };

  const triggerDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const reportCopy = {
    tr: { fail: 'Düzeltilmesi gereken', pass: 'Geçen kontrol', manual: 'Manuel inceleme', unknown: 'Sonuç belirsiz', note: 'Bulgu sayısı aynı sorunu iki profilde tekrar saymaz. Geçen, manuel ve belirsiz sonuçlar profil başınadır. GEO’da tekrarlanan aynı bulgu toplamda bir kez sayılır.' },
    en: { fail: 'Needs attention', pass: 'Passed checks', manual: 'Manual review', unknown: 'Unknown result', note: 'Findings are not counted twice across profiles. Passed, manual and unknown results are per profile. The same finding repeated in GEO is counted once in the total.' },
    no: { fail: 'Må utbedres', pass: 'Beståtte kontroller', manual: 'Manuell vurdering', unknown: 'Ukjent resultat', note: 'Funn telles ikke dobbelt på tvers av profiler. Beståtte, manuelle og ukjente resultater telles per profil. Samme funn i GEO telles én gang i totalen.' },
  }[lang];
  const handleDownloadHtml = () => {
    if (!activeBatch && !activeRepetition) return;
    try {
      const version = getManifestVersion() || t.engineVersionUnavailable;
      let html = '';
      if (activeRepetition && activeRepetition.requestedCount > 1) {
        html = exportRepeatedAnalysisHtml(activeRepetition, version, lang);
      } else if (activeBatch) {
        html = exportAnalysisHtml(activeBatch, version, lang);
      }
      if (html) {
        const finalHtml = attachScreenshotToHtml(html, screenshot, lang);
        triggerDownload(finalHtml, `viewgrid-analysis-${Date.now()}.html`, 'text/html;charset=utf-8');
      }
    } catch {
      setAlertNotice(t.exportErrorNotice);
    }
  };

  const handleDownloadJson = () => {
    if (!activeBatch && !activeRepetition) return;
    try {
      const version = getManifestVersion() || t.engineVersionUnavailable;
      let json = '';
      if (activeRepetition && activeRepetition.requestedCount > 1) {
        json = exportRepeatedAnalysisJson(activeRepetition, version);
      } else if (activeBatch) {
        json = exportAnalysisJson(activeBatch, version);
      }
      if (json) {
        const finalJson = attachScreenshotToJson(json, screenshot);
        triggerDownload(finalJson, `viewgrid-analysis-${Date.now()}.json`, 'application/json;charset=utf-8');
      }
    } catch {
      setAlertNotice(t.exportErrorNotice);
    }
  };

  const handlePrintPdf = () => {
    if (!activeBatch && !activeRepetition) return;
    try {
      const version = getManifestVersion() || t.engineVersionUnavailable;
      let html = '';
      if (activeRepetition && activeRepetition.requestedCount > 1) {
        html = exportRepeatedAnalysisHtml(activeRepetition, version, lang);
      } else if (activeBatch) {
        html = exportAnalysisHtml(activeBatch, version, lang);
      }
      if (!html) return;
      const finalHtml = attachScreenshotToHtml(html, screenshot, lang);
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setAlertNotice(t.popupBlockedNotice);
        return;
      }
      printWindow.document.write(finalHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    } catch {
      setAlertNotice(t.exportErrorNotice);
    }
  };

  // History entry actions with race protection
  const handleLoadEntry = (entry: AnalysisHistoryEntry) => {
    if (isRunning || isCapturing) return;
    setAnalysisCancelled(false);
    setRunnerError(null);
    st.setAnalysisSummary(null);
    setActiveBatch(entry.batch);
    setProfileSelection(entry.batch.profileSelection);
    setActiveRepetition(null);
    setScreenshot(null);
    setIsStaleBatch(false);
    setTargetUrl(entry.batch.requestedUrl);
  };

  const handleDeleteEntry = async (id: string) => {
    if (isRunning || isCapturing) return;
    try {
      const updated = await deleteAnalysisHistoryEntry(id);
      if (!isMountedRef.current) return;
      setHistoryList(updated);
      if (activeBatch?.requestId === id) {
        setActiveBatch(null);
        setActiveRepetition(null);
        setScreenshot(null);
        setIsStaleBatch(false);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      const errKey = `err_${err?.code || 'HISTORY_DELETE_FAILED'}` as keyof typeof t;
      setAlertNotice((t[errKey] as string) || t.err_UNKNOWN);
    }
  };

  const handleClearAllHistory = async () => {
    if (isRunning || isCapturing) return;
    try {
      await clearAnalysisHistory();
      if (!isMountedRef.current) return;
      setHistoryList([]);
      setScreenshot(null);
      setConfirmClearOpen(false);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      const errKey = `err_${err?.code || 'HISTORY_CLEAR_FAILED'}` as keyof typeof t;
      setAlertNotice((t[errKey] as string) || t.err_UNKNOWN);
      setConfirmClearOpen(false);
    }
  };

  const handleCompare = () => {
    if (isRunning || isCapturing) return;
    const bEntry = historyList.find((e) => e.id === beforeId);
    const aEntry = historyList.find((e) => e.id === afterId);
    if (!bEntry || !aEntry) return;

    const comp = compareAnalysisEntries(bEntry, aEntry, 'mobile') || compareAnalysisEntries(bEntry, aEntry, 'desktop');
    setCompareResult(comp);
  };

  // Helper for error code translation
  const getErrorMessage = (error: AnalysisError | null) => {
    if (!error) return '';
    const key = `err_${error.code}` as keyof typeof t;
    return (t[key] as string) || t.err_UNKNOWN;
  };

  const sectionSummaries = activeBatch ? summarizeAnalysis(activeBatch).sectionStates : null;
  const currentSummary = sectionSummaries?.[activeTab];
  const scopeCopy = {
    tr: { all: 'Tek tarama; yerel performans, SEO/erişilebilirlik ve GEO sonuçlarını birlikte toplar. Her sekme yalnız kendi sonuçlarını gösterir.', observed: 'Ölçümler alındı', needs: 'Bulgu var', review: 'İnceleme gerekli', noData: 'Veri yok', perfNote: 'Bu bölüm yalnız yükleme gözlemleridir. SEO ve erişilebilirlik bulguları kendi sekmesindedir. Süreler performansın iyi veya kötü olduğuna dair bir skor değildir.', saved: 'Son analiz sonucu korunuyor; tekrar tarama gerekmez.' },
    en: { all: 'One scan collects local performance, SEO/accessibility and GEO together. Each tab shows only its own results.', observed: 'Measurements captured', needs: 'Findings present', review: 'Review needed', noData: 'No data', perfNote: 'This section contains load observations only. SEO and accessibility findings are in their own tab. Timings are not a performance quality score.', saved: 'The last analysis is retained; no new scan is needed.' },
    no: { all: 'Én skanning samler lokal ytelse, SEO/tilgjengelighet og GEO. Hver fane viser bare sine egne resultater.', observed: 'Målinger registrert', needs: 'Funn', review: 'Vurdering nødvendig', noData: 'Ingen data', perfNote: 'Denne delen viser kun lasteobservasjoner. SEO- og tilgjengelighetsfunn vises i egen fane. Tidene er ikke en kvalitetsvurdering av ytelsen.', saved: 'Siste analyse er beholdt; ny skanning er ikke nødvendig.' },
  }[lang];
  const findingStatus = (count: number) => lang === 'tr' ? `İncelenen sayfada ${count} bulgu` : lang === 'no' ? `Funn på undersøkt side: ${count}` : `${count} ${count === 1 ? 'finding' : 'findings'} on the inspected page`;
  const sectionTitle = { performance: t.tabPerformance, seo: t.tabSeo, geo: t.tabGeo, reports: t.tabReports }[activeTab];
  const tabState = (section: 'performance'|'seo'|'geo'|'reports') => !isStaleBatch && !isTargetChanged && !isRunning ? sectionSummaries?.[section]?.state : undefined;
  const tabBadge = (section: 'performance'|'seo'|'geo'|'reports') => {
    const summary = sectionSummaries?.[section], state = tabState(section);
    if (!state || !summary) return null;
    return state === 'fail' ? <span id={`analysis-tab-${section}-status`} className={s.tabFailure} aria-label={`${summary.fail} ${reportCopy.fail}`}>{summary.fail}</span> : state === 'pass' ? <span id={`analysis-tab-${section}-status`} className={s.tabPass} aria-label={section === 'performance' ? scopeCopy.observed : reportCopy.pass}>✓</span> : <span id={`analysis-tab-${section}-status`} className={s.tabReview} aria-label={state === 'unavailable' ? scopeCopy.noData : scopeCopy.review}>{state === 'unavailable' ? '—' : '!'}</span>;
  };

  const successfulOutcomes = activeBatch?.results.filter(outcome => outcome.status === 'success') ?? [];
  const allOutcomes = activeRepetition ? activeRepetition.runs.flatMap(run => run.results) : activeBatch?.results ?? [];
  const failedOutcomes = allOutcomes.filter(outcome => outcome.status !== 'success');
  const displayedFailures = failedOutcomes.filter((outcome, index) => !failedOutcomes.slice(0, index).some(previous => previous.profile === outcome.profile && previous.error.code === outcome.error.code && previous.error.httpStatus === outcome.error.httpStatus));
  const hasSuccessfulData = successfulOutcomes.length > 0;
  const hasAnySuccessfulData = allOutcomes.some(outcome => outcome.status === 'success');
  const hasPartialData = hasAnySuccessfulData && (failedOutcomes.length > 0 || !!activeRepetition?.profiles.some(profile => profile.status !== 'available'));
  const statusText = (() => {
    if (isRunning) return isSavingHistory ? t.statusSaving : t.running;
    if (analysisCancelled) return t.statusCancelled;
    if (runnerError) return t.statusError;
    if (isTargetChanged) return t.previousBatchTargetChanged;
    if (isStaleBatch) return t.previousBatchStale;
    if (activeBatch) {
      if (hasPartialData) return t.statusPartial;
      if (hasAnySuccessfulData) return t.statusSuccess;
      if (failedOutcomes.length > 0 && failedOutcomes.every(outcome => outcome.status === 'cancelled')) return t.statusCancelled;
      return t.statusNoData;
    }
    if (!isUrlValid) return targetUrl ? t.invalidUrlError : t.statusIdle;
    return t.statusIdle;
  })();

  // Filtered audits for SEO & A11y Tab (preserves mobile/desktop context)
  interface AuditWithProfile extends NormalizedAudit {
    profile: string;
    local: boolean;
  }

  const allAuditsWithProfile: AuditWithProfile[] = useMemo(() => {
    if (!activeBatch) return [];
    return activeBatch.results
      .filter((o) => o.status === 'success' && o.data)
      .flatMap((o) =>
        o.data!.lab.audits.map((a) => ({
          ...a,
          title: o.data!.source === 'viewgrid-local' ? localAuditWording(a.id, lang)?.title ?? a.title : a.title,
          profile: o.profile,
          local: o.data!.source === 'viewgrid-local',
        })),
      );
  }, [activeBatch, lang]);

  const filteredAudits = useMemo(() => {
    return allAuditsWithProfile.filter((audit) => {
      if (audit.category === 'performance') return false;
      if (auditFilterCategory !== 'all' && audit.category !== auditFilterCategory) {
        return false;
      }
      if (auditFilterStatus === 'passed' && audit.status !== 'pass') return false;
      if (auditFilterStatus === 'failed' && audit.status !== 'fail') return false;
      if (auditFilterStatus === 'informative' && audit.status !== 'informative') return false;
      if (auditFilterStatus === 'manual' && audit.status !== 'manual') return false;
      if (auditFilterStatus === 'unknown' && !['unknown', 'error'].includes(audit.status)) return false;

      if (auditFilterSeverity !== 'all' && audit.importance !== auditFilterSeverity) {
        return false;
      }
      return true;
    }).sort((a, b) => (a.status === 'fail' ? 0 : a.status === 'manual' ? 1 : 2) - (b.status === 'fail' ? 0 : b.status === 'manual' ? 1 : 2));
  }, [allAuditsWithProfile, auditFilterCategory, auditFilterStatus, auditFilterSeverity]);

  const profilePerformanceState = (outcome: AnalysisOutcome) => activeBatch
    ? summarizeAnalysis({ ...activeBatch, profileSelection: outcome.profile, results: [outcome] }).sectionStates.performance.state
    : 'unavailable';

  const groupedAudits = useMemo(() => {
    const groups = new Map<string, AuditWithProfile & { profiles: string[] }>();
    for (const audit of filteredAudits) {
      const key = JSON.stringify([audit.id, audit.category, audit.status, audit.title, audit.recommendation, audit.importance, audit.displayValue, audit.affectedItems, audit.local]);
      const existing = groups.get(key);
      if (existing) { if (!existing.profiles.includes(audit.profile)) existing.profiles.push(audit.profile); }
      else groups.set(key, { ...audit, profiles: [audit.profile] });
    }
    return [...groups.values()];
  }, [filteredAudits]);
  useEffect(() => {
    if (!activeBatch) return;
    const audits = activeBatch.results.flatMap(outcome => outcome.status === 'success' ? outcome.data.lab.audits.filter(audit => audit.category !== 'performance') : []);
    setAuditFilterStatus(audits.some(audit => audit.status === 'fail') ? 'failed' : audits.some(audit => audit.status === 'pass') ? 'passed' : audits.some(audit => ['unknown', 'error'].includes(audit.status)) ? 'unknown' : audits.some(audit => audit.status === 'manual') ? 'manual' : 'all');
  }, [activeBatch?.requestId]);

  // Score display helper
  const renderScore = (score: number | null, label: string) => {
    let scoreClass = s.scoreValueNone;
    if (score !== null) {
      if (score >= 90) scoreClass = s.scoreValueGood;
      else if (score >= 50) scoreClass = s.scoreValueAverage;
      else scoreClass = s.scoreValuePoor;
    }
    return (
      <div className={s.scoreBadge}>
        <span className={`${s.scoreValue} ${scoreClass}`}>{score !== null ? score : '—'}</span>
        <span className={s.scoreLabel}>{label}</span>
      </div>
    );
  };

  // Status mapping helper for audit badges
  const getAuditStatusLabel = (status: string) => {
    switch (status) {
      case 'pass':
        return t.auditStatusPass;
      case 'fail':
        return t.auditStatusFail;
      case 'manual':
        return t.auditStatusManual;
      case 'informative':
        return t.auditStatusInfo;
      case 'unknown':
      case 'error': return reportCopy.unknown;
      case 'not-applicable': return lang === 'tr' ? 'Uygulanamaz' : lang === 'no' ? 'Ikke relevant' : 'Not applicable';
      default:
        return status;
    }
  };

  // GEO status label
  const getGeoStatusLabel = (status: string) => {
    switch (status) {
      case 'pass':
        return t.geoStatusPass;
      case 'fail':
        return t.geoStatusFail;
      case 'manual':
        return t.geoStatusManual;
      case 'unknown':
      default:
        return t.geoStatusUnknown;
    }
  };

  return (
    <>
      <Modal isOpen={isOpen && !confirmClearOpen} onClose={onClose} title={t.title} size="wide" fixedHeight>
        <div className={s.container}>
          {/* Navigation tabs */}
          <nav className={s.tabNav} aria-label="Analysis Tabs">
            <Button
              variant={activeTab === 'performance' ? 'primary' : 'default'}
              onClick={() => setActiveTab('performance')}
              data-analysis-state={tabState('performance')}
              aria-label={t.tabPerformance}
              aria-describedby={tabState('performance') ? 'analysis-tab-performance-status' : undefined}
              className={`${s.tabButton} ${activeTab === 'performance' ? s.tabButtonActive : ''}`}
            >
              {t.tabPerformance}{tabBadge('performance')}
            </Button>
            <Button
              variant={activeTab === 'seo' ? 'primary' : 'default'}
              onClick={() => setActiveTab('seo')}
              data-analysis-state={tabState('seo')}
              aria-label={t.tabSeo}
              aria-describedby={tabState('seo') ? 'analysis-tab-seo-status' : undefined}
              className={`${s.tabButton} ${activeTab === 'seo' ? s.tabButtonActive : ''}`}
            >
              {t.tabSeo}{tabBadge('seo')}
            </Button>
            <Button
              variant={activeTab === 'geo' ? 'primary' : 'default'}
              onClick={() => setActiveTab('geo')}
              data-analysis-state={tabState('geo')}
              aria-label={t.tabGeo}
              aria-describedby={tabState('geo') ? 'analysis-tab-geo-status' : undefined}
              className={`${s.tabButton} ${activeTab === 'geo' ? s.tabButtonActive : ''}`}
            >
              {t.tabGeo}{tabBadge('geo')}
            </Button>
            <Button
              variant={activeTab === 'reports' ? 'primary' : 'default'}
              onClick={() => setActiveTab('reports')}
              data-analysis-state={tabState('reports')}
              aria-label={t.tabReports}
              aria-describedby={tabState('reports') ? 'analysis-tab-reports-status' : undefined}
              className={`${s.tabButton} ${activeTab === 'reports' ? s.tabButtonActive : ''}`}
            >
              {t.tabReports}{tabBadge('reports')}
            </Button>
          </nav>

          {/* Input & Runner form */}
          <div className={s.formBar}>
            <div className={s.inputRow}>
              <input
                type="url"
                className={s.urlInput}
                value={targetUrl}
                onChange={(e) => {
                  setTargetUrl(e.target.value);
                  setAnalysisCancelled(false);
                  setRunnerError(null);
                  setActiveBatch(null);
                  setActiveRepetition(null);
                  setScreenshot(null);
                }}
                placeholder={t.urlPlaceholder}
                disabled={isRunning || isCapturing}
                aria-label="Target URL"
              />
              <select
                className={s.profileSelect}
                value={profileSelection}
                onChange={(e) => {
                  setProfileSelection(e.target.value as 'mobile' | 'desktop' | 'both');
                  setAnalysisCancelled(false);
                  setRunnerError(null);
                  setActiveBatch(null);
                  setActiveRepetition(null);
                  setScreenshot(null);
                }}
                disabled={isRunning || isCapturing}
                aria-label="Target Profile"
              >
                <option value="mobile">{t.profileMobile}</option>
                <option value="desktop">{t.profileDesktop}</option>
                <option value="both">{t.profileBoth}</option>
              </select>
              {isRunning ? (
                <Button variant="danger" onClick={handleCancelAnalysis} disabled={isSavingHistory}>
                  {t.cancelAnalysis}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleStartAnalysis}
                  disabled={!isUrlValid || isCapturing}
                >
                  {t.runAnalysis}
                </Button>
              )}
            </div>

            <p className={s.disclosureText}>{scopeCopy.all}</p>
            <p className={s.disclosureText}>{local.disclosure}</p>

            {!isUrlValid && targetUrl.length > 0 && <div className={s.warningBox}>{t.invalidUrlError}</div>}
          </div>

          {/* Alert Notice for popups/errors */}
          {alertNotice && (
            <div className={s.errorBox} role="alert">
              <div>{alertNotice}</div>
              <Button variant="default" onClick={() => setAlertNotice(null)}>
                {t.dismiss}
              </Button>
            </div>
          )}

          {/* Global runner error */}
          {runnerError && (
            <div className={s.errorBox} role="alert">
              <div>
                <strong>{t.errorTitle}: </strong>
                <span>{getErrorMessage(runnerError)}</span>
                {runnerError.httpStatus && <span> (HTTP {runnerError.httpStatus})</span>}
              </div>
              {runnerError.retryable && (
                <Button variant="default" onClick={handleStartAnalysis} disabled={isRunning || isCapturing || !isUrlValid}>
                  {t.retry}
                </Button>
              )}
            </div>
          )}

          {/* Content body based on active tab */}
          <div className={s.scrollArea} ref={scrollAreaRef}>
            <section className={s.analysisStatus} aria-label={t.analysisStatusLabel}>
              <div className={s.sectionHeader}>
                <div className={s.reportHeading}>
                  <h3>{sectionTitle}</h3>
                  {activeBatch && <p title={activeBatch.requestedUrl}>{activeBatch.profileSelection === 'both' ? t.profileBoth : activeBatch.profileSelection === 'mobile' ? t.profileMobile : t.profileDesktop} · {new Date(activeBatch.completedAt).toLocaleString(lang === 'tr' ? 'tr-TR' : lang === 'no' ? 'nb-NO' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}</p>}
                </div>
                {activeBatch && <ReportExportActions key={activeBatch.requestId + ':' + activeTab + ':' + lang + ':' + previewRevision} batch={activeBatch} version={getManifestVersion() || t.engineVersionUnavailable} language={lang} section={activeTab} disabled={!isOpen || isRunning || isCapturing} />}
              </div>
              <p role="status" data-analysis-status="" aria-live="polite" className={s.sectionStatus} data-status={isStaleBatch || isTargetChanged || hasPartialData ? 'review' : currentSummary?.state}>
                {isRunning || analysisCancelled || runnerError || isStaleBatch || isTargetChanged || !activeBatch || hasPartialData ? statusText : activeTab === 'performance' && currentSummary?.state === 'pass' ? scopeCopy.observed : currentSummary?.state === 'fail' ? findingStatus(currentSummary.fail) : currentSummary?.state === 'review' ? scopeCopy.review : currentSummary?.state === 'unavailable' ? scopeCopy.noData : t.statusSuccess}
              </p>
              {activeBatch && hasAnySuccessfulData && !hasPartialData && !isRunning && !isStaleBatch && !isTargetChanged && <p className={s.profileMeta}>{scopeCopy.saved}</p>}
              {activeTab === 'performance' && activeBatch && <p className={s.profileMeta}>{scopeCopy.perfNote}</p>}
              {hasSuccessfulData && !isRunning && activeTab !== 'performance' && (
                <div className={s.resultOverview} aria-label={lang === 'tr' ? 'Kontrol özeti' : lang === 'no' ? 'Kontrolloversikt' : 'Check summary'}>
                  {(['fail', 'pass', 'manual', 'unknown'] as const).map(status => {
                    const count = currentSummary?.[status] ?? 0;
                    return <div key={status} data-status={status} data-count={count}><strong>{count}</strong><span>{reportCopy[status]}</span></div>;
                  })}
                  <p>{reportCopy.note}</p>
                </div>
              )}
              {analysisCancelled && <p>{t.cancellationNotice}</p>}
              {!isRunning && !analysisCancelled && displayedFailures.map(outcome => (
                <div key={`${outcome.profile}-${outcome.error.code}-${outcome.error.httpStatus}`} className={s.errorBox} role="alert">
                  <div>
                    <strong>{outcome.profile === 'mobile' ? t.profileMobile : t.profileDesktop}: </strong>
                    <span>{getErrorMessage(outcome.error)}</span>
                    {outcome.error.httpStatus && <span> (HTTP {outcome.error.httpStatus})</span>}
                    {outcome.error.code === 'RATE_LIMITED' && <p>{t.quotaRetryNotice}</p>}
                  </div>
                  {outcome.error.retryable && (
                    <Button variant="default" onClick={handleStartAnalysis} disabled={isCapturing || !isUrlValid}>
                      {t.retry}
                    </Button>
                  )}
                </div>
              ))}
            </section>
            {/* TAB 1: PERFORMANCE & CRUX */}
            {activeTab === 'performance' && (
              <>
                {!activeBatch ? (
                  <p className={s.profileMeta}>{t.noActiveReport}</p>
                ) : (
                  <>
                    {isTargetChanged && (
                      <div className={s.staleNotice}>{t.previousBatchTargetChanged}</div>
                    )}
                    {isStaleBatch && !isTargetChanged && (
                      <div className={s.staleNotice}>{t.previousBatchStale}</div>
                    )}

                    {activeRepetition && activeRepetition.requestedCount > 1 && (
                      <div className={s.repetitionCard}>
                        <div className={s.repetitionHeader}>
                          <h3 className={s.repetitionTitle}>{t.repetitionSummaryTitle}</h3>
                          <div className={s.repetitionMetaRow}>
                            <span>
                              {t.repetitionProgress(
                                activeRepetition.completedCount,
                                activeRepetition.requestedCount,
                              )}
                            </span>
                            <span
                              className={`${s.repetitionStopBadge} ${
                                activeRepetition.stopReason === 'completed'
                                  ? s.repetitionStopBadgeSuccess
                                  : activeRepetition.stopReason === 'rate-limited'
                                  ? s.repetitionStopBadgeQuota
                                  : s.repetitionStopBadgeCancelled
                              }`}
                            >
                              {activeRepetition.stopReason === 'completed'
                                ? t.repetitionStopCompleted
                                : activeRepetition.stopReason === 'rate-limited'
                                ? t.repetitionStopRateLimited
                                : t.repetitionStopCancelled}
                            </span>
                          </div>
                        </div>

                        {activeRepetition.profiles.map((profSummary: RepeatedProfileSummary) => {
                          const statusClass =
                            profSummary.status === 'available'
                              ? s.statusBadgeAvailable
                              : profSummary.status === 'partial'
                              ? s.statusBadgePartial
                              : profSummary.status === 'withheld'
                              ? s.statusBadgeWithheld
                              : s.statusBadgeUnavailable;

                          const statusText =
                            profSummary.status === 'available'
                              ? t.repetitionStatusAvailable
                              : profSummary.status === 'partial'
                              ? t.repetitionStatusPartial
                              : profSummary.status === 'withheld'
                              ? t.repetitionStatusWithheld
                              : t.repetitionStatusUnavailable;

                          return (
                            <div key={profSummary.profile} className={s.profileRepetitionBox}>
                              <div className={s.profileRepetitionHeader}>
                                <h4 className={s.repetitionProfileTitle}>
                                  {profSummary.profile === 'mobile' ? t.profileMobile : t.profileDesktop}
                                </h4>
                                <span className={`${s.repetitionStopBadge} ${statusClass}`}>
                                  {statusText}
                                </span>
                              </div>

                              {profSummary.eligibleRuns === 0 ? (
                                <div className={s.withheldNotice}>
                                  {profSummary.status === 'withheld' ? t.withheldNoFakeZero : t.statusNoData}
                                </div>
                              ) : (
                                <>
                                  <div className={s.scoresGrid}>
                                    <div className={s.scoreBadge} hidden={profSummary.lab.scores.performance.sampleCount === 0}>
                                      <span
                                        className={`${s.scoreValue} ${
                                          profSummary.lab.scores.performance.median !== null
                                            ? profSummary.lab.scores.performance.median >= 90
                                              ? s.scoreValueGood
                                              : profSummary.lab.scores.performance.median >= 50
                                              ? s.scoreValueAverage
                                              : s.scoreValuePoor
                                            : s.scoreValueNone
                                        }`}
                                      >
                                        {profSummary.lab.scores.performance.median !== null
                                          ? profSummary.lab.scores.performance.median
                                          : '—'}
                                      </span>
                                      <span className={s.scoreLabel}>Performance</span>
                                      <span className={s.sampleMeta}>
                                        {t.sampleCountLabel(
                                          profSummary.lab.scores.performance.sampleCount,
                                          profSummary.eligibleRuns,
                                        )}
                                      </span>
                                    </div>
                                    <div className={s.scoreBadge} hidden={profSummary.lab.scores.seo.sampleCount === 0}>
                                      <span
                                        className={`${s.scoreValue} ${
                                          profSummary.lab.scores.seo.median !== null
                                            ? profSummary.lab.scores.seo.median >= 90
                                              ? s.scoreValueGood
                                              : profSummary.lab.scores.seo.median >= 50
                                              ? s.scoreValueAverage
                                              : s.scoreValuePoor
                                            : s.scoreValueNone
                                        }`}
                                      >
                                        {profSummary.lab.scores.seo.median !== null
                                          ? profSummary.lab.scores.seo.median
                                          : '—'}
                                      </span>
                                      <span className={s.scoreLabel}>SEO</span>
                                      <span className={s.sampleMeta}>
                                        {t.sampleCountLabel(
                                          profSummary.lab.scores.seo.sampleCount,
                                          profSummary.eligibleRuns,
                                        )}
                                      </span>
                                    </div>
                                    <div className={s.scoreBadge} hidden={profSummary.lab.scores.accessibility.sampleCount === 0}>
                                      <span
                                        className={`${s.scoreValue} ${
                                          profSummary.lab.scores.accessibility.median !== null
                                            ? profSummary.lab.scores.accessibility.median >= 90
                                              ? s.scoreValueGood
                                              : profSummary.lab.scores.accessibility.median >= 50
                                              ? s.scoreValueAverage
                                              : s.scoreValuePoor
                                            : s.scoreValueNone
                                        }`}
                                      >
                                        {profSummary.lab.scores.accessibility.median !== null
                                          ? profSummary.lab.scores.accessibility.median
                                          : '—'}
                                      </span>
                                      <span className={s.scoreLabel}>Accessibility</span>
                                      <span className={s.sampleMeta}>
                                        {t.sampleCountLabel(
                                          profSummary.lab.scores.accessibility.sampleCount,
                                          profSummary.eligibleRuns,
                                        )}
                                      </span>
                                    </div>
                                  </div>

                                  <div className={s.metricsGrid}>
                                    <div className={s.metricCard} hidden={profSummary.lab.metrics.lcpMs.sampleCount === 0}>
                                      <span className={s.metricName}>{t.metricLcp}</span>
                                      <span className={s.metricVal}>
                                        {profSummary.lab.metrics.lcpMs.median !== null
                                          ? `${Math.round(profSummary.lab.metrics.lcpMs.median)} ms`
                                          : '—'}
                                      </span>
                                      <span className={s.sampleMeta}>
                                        {t.sampleCountLabel(
                                          profSummary.lab.metrics.lcpMs.sampleCount,
                                          profSummary.eligibleRuns,
                                        )}
                                      </span>
                                    </div>
                                    <div className={s.metricCard} hidden={profSummary.lab.metrics.cls.sampleCount === 0}>
                                      <span className={s.metricName}>{t.metricCls}</span>
                                      <span className={s.metricVal}>
                                        {profSummary.lab.metrics.cls.median !== null
                                          ? profSummary.lab.metrics.cls.median.toFixed(3)
                                          : '—'}
                                      </span>
                                      <span className={s.sampleMeta}>
                                        {t.sampleCountLabel(
                                          profSummary.lab.metrics.cls.sampleCount,
                                          profSummary.eligibleRuns,
                                        )}
                                      </span>
                                    </div>
                                    <div className={s.metricCard} hidden={profSummary.lab.metrics.fcpMs.sampleCount === 0}>
                                      <span className={s.metricName}>{t.metricFcp}</span>
                                      <span className={s.metricVal}>
                                        {profSummary.lab.metrics.fcpMs.median !== null
                                          ? `${Math.round(profSummary.lab.metrics.fcpMs.median)} ms`
                                          : '—'}
                                      </span>
                                      <span className={s.sampleMeta}>
                                        {t.sampleCountLabel(
                                          profSummary.lab.metrics.fcpMs.sampleCount,
                                          profSummary.eligibleRuns,
                                        )}
                                      </span>
                                    </div>
                                    <div className={s.metricCard} hidden={profSummary.lab.metrics.speedIndexMs.sampleCount === 0}>
                                      <span className={s.metricName}>{t.metricSi}</span>
                                      <span className={s.metricVal}>
                                        {profSummary.lab.metrics.speedIndexMs.median !== null
                                          ? `${Math.round(profSummary.lab.metrics.speedIndexMs.median)} ms`
                                          : '—'}
                                      </span>
                                      <span className={s.sampleMeta}>
                                        {t.sampleCountLabel(
                                          profSummary.lab.metrics.speedIndexMs.sampleCount,
                                          profSummary.eligibleRuns,
                                        )}
                                      </span>
                                    </div>
                                    <div className={s.metricCard} hidden={profSummary.lab.metrics.tbtMs.sampleCount === 0}>
                                      <span className={s.metricName}>{t.metricTbt}</span>
                                      <span className={s.metricVal}>
                                        {profSummary.lab.metrics.tbtMs.median !== null
                                          ? `${Math.round(profSummary.lab.metrics.tbtMs.median)} ms`
                                          : '—'}
                                      </span>
                                      <span className={s.sampleMeta}>
                                        {t.sampleCountLabel(
                                          profSummary.lab.metrics.tbtMs.sampleCount,
                                          profSummary.eligibleRuns,
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </>
                              )}

                              {profSummary.warnings.length > 0 && (
                                <div className={s.warningBoxSpaced}>
                                  <ul className={s.warningList}>
                                    {profSummary.warnings.map((w) => {
                                      const warningKey = `warn_${w.replace(/-/g, '_')}` as keyof typeof t;
                                      return <li key={w}>{(t[warningKey] as string) || w}</li>;
                                    })}
                                  </ul>
                                </div>
                              )}

                              <div className={s.conditionsBox}>
                                <div className={s.conditionsRow}>
                                  <span>
                                    <strong>{t.engineDetails}: </strong>
                                    {profSummary.engine
                                      ? `${profSummary.engine.name} ${profSummary.engine.version ?? t.engineVersionUnavailable}`
                                      : t.engineVersionUnavailable}
                                  </span>
                                </div>
                                {profSummary.conditions && (
                                  <div className={s.conditionsRow}>
                                    <span>
                                      <strong>{t.measurementContextLabel}: </strong>
                                      {profSummary.conditions.locale || '—'}
                                    </span>
                                    <span>
                                      <strong>{t.throttlingLabel}: </strong>
                                      {profSummary.conditions.throttlingMethod || '—'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className={s.fieldNotice}>{t.repetitionFieldNotice}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {activeRepetition && activeRepetition.requestedCount > 1 && (
                      <div className={s.latestNoticeHeader}>{t.latestRunNotice}</div>
                    )}

                    {successfulOutcomes.map((outcome: AnalysisOutcome) => (
                      <div key={outcome.profile} className={s.profileCard} data-analysis-state={profilePerformanceState(outcome)}>
                        <div className={s.profileCardHeader}>
                          <h3 className={s.profileTitle}>
                            {outcome.profile === 'mobile' ? t.profileMobile : t.profileDesktop}
                          </h3>
                          <span className={s.sectionStatus} data-status={profilePerformanceState(outcome)}>
                            {outcome.status === 'success'
                              ? profilePerformanceState(outcome) === 'pass' ? scopeCopy.observed : profilePerformanceState(outcome) === 'fail' ? scopeCopy.needs : profilePerformanceState(outcome) === 'review' ? scopeCopy.review : scopeCopy.noData
                              : outcome.status === 'cancelled'
                              ? t.statusCancelled
                              : t.statusError}
                          </span>
                        </div>

                        {outcome.status === 'success' && outcome.data && (
                          <>
                            {/* Engine & measurement conditions info */}
                            <div className={s.conditionsBox}>
                              <div className={s.conditionsRow}>
                                <span>
                                  <strong>{lang === 'tr' ? 'Analiz motoru: ' : lang === 'no' ? 'Analysemotor: ' : 'Engine: '}</strong>
                                  {outcome.data.lab.engine.name}{' '}
                                  {outcome.data.lab.engine.version ?? t.engineVersionUnavailable}
                                </span>
                                <span>
                                  <strong>{t.analyzedAtLabel}: </strong>
                                  {outcome.data.analyzedAt
                                    ? new Date(outcome.data.analyzedAt).toLocaleString(lang === 'tr' ? 'tr-TR' : lang === 'no' ? 'nb-NO' : 'en-US')
                                    : '—'}
                                </span>
                              </div>
                              <div className={s.conditionsRow}>
                                <span>
                                  <strong>{t.measurementContextLabel}: </strong>
                                  {outcome.data.source === 'viewgrid-local' ? local.snapshot : local.legacy}
                                </span>
                                {outcome.data.lab.conditions.throttlingMethod && (
                                  <span>
                                    <strong>{t.throttlingLabel}: </strong>
                                    {outcome.data.lab.conditions.throttlingMethod}
                                  </span>
                                )}
                                {outcome.data.lab.conditions.benchmarkIndex != null && (
                                  <span>
                                    <strong>{t.benchmarkIndexLabel}: </strong>
                                    {outcome.data.lab.conditions.benchmarkIndex}
                                  </span>
                                )}
                              </div>
                            </div>

                            {outcome.data.source === 'viewgrid-local' ? (
                              <div className={s.conditionsBox}>
                                <strong>{local.scope}</strong>
                                {outcome.data.lab.local && <>
                                  <p>{local.scope}: {outcome.data.lab.local.width} × {outcome.data.lab.local.height} CSS px</p>
                                  <p>{local.coverage}: {outcome.data.lab.local.scannedElements} · {local.duration}: {Math.round(outcome.data.lab.local.durationMs)} ms</p>
                                  {outcome.data.lab.local.truncated && <p className={s.warningBox}>{local.truncated}</p>}
                                </>}
                              </div>
                            ) : <div className={s.scoresGrid}>
                              {renderScore(outcome.data.lab.scores.performance, t.categoryPerf)}


                            </div>}

                            {/* Lab Metrics */}
                            <div>
                              <h4 className={s.fieldTitle}>{outcome.data.source === 'viewgrid-local' ? local.snapshot : t.labSectionTitle}</h4>
                              <span className={s.profileMeta}>{outcome.data.source === 'viewgrid-local' ? local.metricsNote : t.labSubtitle}</span>
                              {outcome.data.source === 'viewgrid-local' ? <div className={s.metricsGridSpaced}>
                                {([
                                  [local.ttfb, outcome.data.lab.local?.navigation?.ttfbMs],
                                  [local.domReady, outcome.data.lab.local?.navigation?.domContentLoadedMs],
                                  [local.loaded, outcome.data.lab.local?.navigation?.loadMs],
                                  [t.metricFcp, outcome.data.lab.metrics.fcpMs],
                                ] as const).map(([label, value]) => <div className={s.metricCard} key={label}><span className={s.metricName}>{label}</span><div className={s.metricVal}>{value != null ? `${Math.round(value)} ms` : '—'}</div></div>)}
                                {outcome.data.lab.local?.navigation && <div className={s.metricCard}><span className={s.metricName}>{local.resources}</span><div className={s.metricVal}>{outcome.data.lab.local.navigation.observedResources}</div></div>}
                              </div> : <>
                              <div className={s.metricsGridSpaced}>
                                <div className={s.metricCard}>
                                  <span className={s.metricName}>{t.metricLcp}</span>
                                  <div className={s.metricVal}>
                                    {outcome.data.lab.metrics.lcpMs != null
                                      ? `${outcome.data.lab.metrics.lcpMs} ms`
                                      : '—'}
                                  </div>
                                </div>
                                <div className={s.metricCard}>
                                  <span className={s.metricName}>{t.metricCls}</span>
                                  <div className={s.metricVal}>
                                    {outcome.data.lab.metrics.cls != null ? outcome.data.lab.metrics.cls : '—'}
                                  </div>
                                </div>
                                <div className={s.metricCard}>
                                  <span className={s.metricName}>{t.metricFcp}</span>
                                  <div className={s.metricVal}>
                                    {outcome.data.lab.metrics.fcpMs != null
                                      ? `${outcome.data.lab.metrics.fcpMs} ms`
                                      : '—'}
                                  </div>
                                </div>
                                <div className={s.metricCard}>
                                  <span className={s.metricName}>{t.metricSi}</span>
                                  <div className={s.metricVal}>
                                    {outcome.data.lab.metrics.speedIndexMs != null
                                      ? `${outcome.data.lab.metrics.speedIndexMs} ms`
                                      : '—'}
                                  </div>
                                </div>
                                <div className={s.metricCard}>
                                  <span className={s.metricName}>{t.metricTbt}</span>
                                  <div className={s.metricVal}>
                                    {outcome.data.lab.metrics.tbtMs != null
                                      ? `${outcome.data.lab.metrics.tbtMs} ms`
                                      : '—'}
                                  </div>
                                </div>
                              </div>
                              </>}
                              {outcome.data.source !== 'viewgrid-local' && <p className={s.profileMetaSpaced}>{t.tbtNote}</p>}
                            </div>

                            {/* CrUX Field Data */}
                            <div className={s.fieldContainer}>
                              {outcome.data.source === 'viewgrid-local' ? <p className={s.profileMeta}>{local.fieldNote}</p> : <>
                              <h4 className={s.fieldTitle}>{t.fieldSectionTitle}</h4>
                              <span className={s.profileMeta}>{t.fieldSubtitle}</span>
                              {(['url', 'origin'] as const).map((scope) => {
                                const f = outcome.data!.field[scope];
                                return (
                                  <div key={scope} className={s.fieldItem}>
                                    <div className={s.fieldItemHeader}>
                                      <strong>
                                        {scope === 'url' ? t.fieldScopeUrl : t.fieldScopeOrigin}
                                      </strong>
                                      <span className={s.profileMeta}>
                                        {f.status === 'available'
                                          ? t.fieldAvailable
                                          : f.status === 'partial'
                                          ? t.fieldPartial
                                          : t.fieldUnavailable}
                                      </span>
                                    </div>
                                    <span className={s.profileMeta}>
                                      {f.period
                                        ? t.fieldPeriod(f.period.firstDate, f.period.lastDate)
                                        : t.fieldPeriodUnknown}
                                    </span>
                                    <div className={s.fieldMetricsRow}>
                                      <span>
                                        p75 LCP: {f.metrics.p75LcpMs != null ? `${f.metrics.p75LcpMs} ms` : '—'}
                                      </span>
                                      <span>
                                        p75 INP: {f.metrics.p75InpMs != null ? `${f.metrics.p75InpMs} ms` : '—'}
                                      </span>
                                      <span>p75 CLS: {f.metrics.p75Cls != null ? f.metrics.p75Cls : '—'}</span>
                                    </div>
                                    <div className={s.fieldMetadataRow}>
                                      {f.reason && (
                                        <span>
                                          <strong>{t.fieldReasonLabel}: </strong>
                                          {f.reason}
                                        </span>
                                      )}
                                      {f.formFactor && (
                                        <span>
                                          <strong>{t.fieldFormFactorLabel}: </strong>
                                          {f.formFactor}
                                        </span>
                                      )}
                                      {f.identifier && (
                                        <span>
                                          <strong>{t.fieldIdentifierLabel}: </strong>
                                          {f.identifier}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              </>}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {/* TAB 2: SEO & ACCESSIBILITY AUDITS */}
            {activeTab === 'seo' && (
              <>
                {!activeBatch ? (
                  <p className={s.profileMeta}>{t.noActiveReport}</p>
                ) : (
                  <div>
                    {isTargetChanged && (
                      <div className={s.staleNotice}>
                        {t.previousBatchTargetChanged}
                      </div>
                    )}
                    {isStaleBatch && !isTargetChanged && (
                      <div className={s.staleNotice}>
                        {t.previousBatchStale}
                      </div>
                    )}
                    <div className={s.filterBar}>
                      <select
                        className={s.filterSelect}
                        value={auditFilterCategory}
                        onChange={(e) => setAuditFilterCategory(e.target.value)}
                        aria-label="Audit Category"
                      >
                        <option value="all">{t.categoryAll}</option>
                        <option value="seo">{t.categorySeo}</option>
                        <option value="accessibility">{t.categoryA11y}</option>

                      </select>

                      <select
                        className={s.filterSelect}
                        value={auditFilterStatus}
                        onChange={(e) => setAuditFilterStatus(e.target.value)}
                        aria-label="Audit Status"
                      >
                        <option value="all">{t.filterAll}</option>
                        <option value="passed">{t.filterPassed}</option>
                        <option value="failed">{t.filterFailed}</option>
                        <option value="informative">{t.filterInformative}</option>
                        <option value="manual">{t.filterManual}</option>
                        <option value="unknown">{reportCopy.unknown}</option>
                      </select>

                      <select
                        className={s.filterSelect}
                        value={auditFilterSeverity}
                        onChange={(e) => setAuditFilterSeverity(e.target.value)}
                        aria-label="Audit Severity"
                      >
                        <option value="all">{t.severityAll}</option>
                        <option value="high">{t.severityHigh}</option>
                        <option value="medium">{t.severityMedium}</option>
                        <option value="low">{t.severityLow}</option>
                        <option value="informational">{t.severityInfo}</option>
                      </select>
                    </div>

                    <p className={s.profileMetaBlock}>
                      {t.automatedNotice}
                    </p>

                    {!hasSuccessfulData ? (
                      <p className={s.profileMeta}>{t.latestRunNoData}</p>
                    ) : filteredAudits.length === 0 ? (
                      <p className={s.profileMeta}>{t.noAuditsFound}</p>
                    ) : (
                      <div className={s.auditList}>
                        {groupedAudits.map((audit, index) => {
                          let badgeClass = s.badgeInfo;
                          if (audit.status === 'pass') badgeClass = s.badgePass;
                          else if (audit.status === 'fail') badgeClass = s.badgeFail;
                          else if (audit.status === 'manual') badgeClass = s.badgeManual;

                          let importanceClass = s.badgeImportanceLow;
                          if (audit.importance === 'high') importanceClass = s.badgeImportanceHigh;
                          else if (audit.importance === 'medium') importanceClass = s.badgeImportanceMed;

                          return (
                            <div key={`${audit.profiles.join('-')}-${audit.id}-${index}`} className={s.auditCard} data-status={audit.status}>
                              <div className={s.auditHeader}>
                                <h5 className={s.auditTitle}>{audit.title}</h5>
                                <div className={s.auditBadgesGroup}>
                                  <span className={`${s.auditBadge} ${s.badgeProfile}`}>
                                    {audit.profiles.map(profile => profile === 'mobile' ? t.profileMobile : t.profileDesktop).join(' + ')}
                                  </span>
                                  <span className={`${s.auditBadge} ${importanceClass}`}>
                                    {lang === 'tr' ? ({high:'Yüksek',medium:'Orta',low:'Düşük',informational:'Bilgi'}[audit.importance]) : lang === 'no' ? ({high:'Høy',medium:'Middels',low:'Lav',informational:'Informasjon'}[audit.importance]) : audit.importance}
                                  </span>
                                  <span className={`${s.auditBadge} ${badgeClass}`}>
                                    {getAuditStatusLabel(audit.status)}
                                  </span>
                                </div>
                              </div>
                              <p className={s.auditDesc}>{audit.local ? localAuditDescription(audit, lang) : audit.recommendation}</p>
                              {audit.displayValue && (
                                <div className={s.profileMetaInline}>
                                  <strong>{lang === 'tr' ? 'Öğe sayısı: ' : lang === 'no' ? 'Antall elementer: ' : 'Element count: '}</strong>
                                  {audit.displayValue}
                                </div>
                              )}
                              {audit.affectedItems.length > 0 && (
                                <div className={s.affectedList}>
                                  <div>{t.affectedElements(audit.affectedItems.length)}:</div>
                                  {audit.affectedItems.slice(0, 5).map((item, i) => (
                                    <div key={i}>
                                      {item.selector || item.url || item.snippet || item.text || '—'}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* TAB 3: GEO SIGNALS (BETA) */}
            {activeTab === 'geo' && (
              <>
                {!activeBatch ? (
                  <p className={s.profileMeta}>{t.noActiveReport}</p>
                ) : (
                  <div className={s.geoCard}>
                    {isTargetChanged && (
                      <div className={s.staleNotice}>{t.previousBatchTargetChanged}</div>
                    )}
                    {isStaleBatch && !isTargetChanged && (
                      <div className={s.staleNotice}>{t.previousBatchStale}</div>
                    )}
                    <div className={s.geoHeader}>
                      <h3 className={s.profileTitle}>{t.geoTitle}</h3>
                      <span className={`${s.auditBadge} ${s.badgeBeta}`}>
                        {t.geoBetaBadge}
                      </span>
                    </div>
                    <div className={s.warningBox}>{t.geoDisclaimer}</div>
                    {!hasSuccessfulData && <p className={s.profileMeta}>{t.latestRunNoData}</p>}

                    {activeBatch.results
                      .filter((o) => o.status === 'success' && o.data)
                      .map((o) => (
                        <div key={o.profile} className={s.geoProfileGroup}>
                          <h4 className={s.fieldTitle}>
                            {o.profile === 'mobile' ? t.profileMobile : t.profileDesktop} (v
                            {o.data?.geo.criteriaVersion})
                          </h4>
                          <table className={s.geoTable}>
                            <thead>
                              <tr>
                                <th>{t.geoCriteriaId}</th>
                                <th>{t.geoMode}</th>
                                <th>{t.geoStatus}</th>
                                <th>{t.geoRecommendation}</th>
                                <th>{t.geoEvidence}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {o.data?.geo.criteria.map((crit) => (
                                <tr key={crit.id}>
                                  <td>{reportLabels[crit.id]?.[lang] ?? crit.id}</td>
                                  <td>{crit.mode === 'automated' ? (lang === 'tr' ? 'Otomatik' : lang === 'no' ? 'Automatisk' : 'Automated') : (lang === 'tr' ? 'Manuel' : lang === 'no' ? 'Manuell' : 'Manual')}</td>
                                  <td>
                                    <span
                                      className={`${s.auditBadge} ${
                                        crit.status === 'pass'
                                          ? s.badgePass
                                          : crit.status === 'fail'
                                          ? s.badgeFail
                                          : s.badgeManual
                                      }`}
                                    >
                                      {getGeoStatusLabel(crit.status)}
                                    </span>
                                  </td>
                                  <td>{getGeoRecommendationText(crit.recommendationCode, lang)}</td>
                                  <td>{crit.evidenceAuditIds.map(id => (o.data?.source === 'viewgrid-local' ? localAuditWording(id, lang)?.title : null) ?? o.data?.lab.audits.find(audit => audit.id === id)?.title ?? id).join(', ') || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}

            {/* TAB 4: REPORTS & HISTORY */}
            {activeTab === 'reports' && (
              <div className={s.reportsWrapper}>
                {/* Active Export actions */}
                <div className={s.profileCard}>
                  <h4 className={s.profileTitle}>{t.reportsTitle}</h4>
                  {activeBatch ? (
                    <>
                      {isTargetChanged && (
                        <div className={s.staleNotice}>{t.previousBatchTargetChanged}</div>
                      )}
                      {isStaleBatch && !isTargetChanged && (
                        <div className={s.staleNotice}>{t.previousBatchStale}</div>
                      )}
                      <p className={s.profileMeta}>
                        {t.activeBatchInfo(activeBatch.completedAt, activeBatch.requestedUrl)}
                      </p>
                      <div className={s.actionsRow}>

                        <Button
                          variant="primary"
                          onClick={handleDownloadHtml}
                          disabled={isRunning || isCapturing}
                        >
                          {t.downloadHtml}
                        </Button>
                        <Button
                          variant="default"
                          onClick={handleDownloadJson}
                          disabled={isRunning || isCapturing}
                        >
                          {t.downloadJson}
                        </Button>
                        <Button
                          variant="default"
                          onClick={handlePrintPdf}
                          disabled={isRunning || isCapturing}
                        >
                          {t.printPdf}
                        </Button>
                      </div>

                      {/* Viewport screenshot attachment section */}
                      {onCaptureViewport && (
                        <div className={s.screenshotSection}>
                          <div className={s.screenshotActionsRow}>
                            {screenshot ? (
                              <>
                                <span className={s.screenshotBadge}>{t.screenshotAttachedBadge}</span>
                                <Button
                                  variant="danger"
                                  onClick={() => setScreenshot(null)}
                                  disabled={isRunning || isCapturing}
                                >
                                  {t.removeScreenshot}
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="default"
                                onClick={handleCaptureScreenshot}
                                disabled={isRunning || isCapturing}
                              >
                                {isCapturing ? t.capturingScreenshot : t.attachScreenshot}
                              </Button>
                            )}
                          </div>

                          <div className={s.screenshotDisclosureBox}>
                            {t.screenshotDisclosure}
                          </div>

                          {screenshot && (
                            <div className={s.screenshotPreviewCard}>
                              <img
                                src={screenshot.pngDataUrl}
                                alt={screenshot.viewportName}
                                className={s.screenshotThumbnail}
                              />
                              <div className={s.screenshotMeta}>
                                <span className={s.screenshotMetaTitle}>
                                  {t.screenshotMetaText(screenshot.viewportName, screenshot.cssWidth, screenshot.cssHeight)}
                                </span>
                                <span className={s.screenshotMetaUrl}>
                                  {screenshot.previewUrl}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className={s.profileMeta}>{t.noActiveReport}</p>
                  )}
                </div>

                {/* History list */}
                <div className={s.profileCard}>
                  <div className={s.reportsHeader}>
                    <h4 className={s.profileTitle}>{t.historyTitle}</h4>
                    {historyList.length > 0 && (
                      <Button
                        variant="danger"
                        onClick={() => setConfirmClearOpen(true)}
                        disabled={isRunning || isCapturing}
                      >
                        {t.clearHistory}
                      </Button>
                    )}
                  </div>

                  {historyList.length === 0 ? (
                    <p className={s.profileMeta}>{t.historyEmpty}</p>
                  ) : (
                    <table className={s.historyTable}>
                      <thead>
                        <tr>
                          <th>URL</th>
                          <th>{lang === 'tr' ? 'Profil' : lang === 'no' ? 'Profil' : 'Profile'}</th>
                          <th>{lang === 'tr' ? 'Tarih' : lang === 'no' ? 'Dato' : 'Date'}</th>
                          <th>{lang === 'tr' ? 'İşlemler' : lang === 'no' ? 'Handlinger' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyList.map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.batch.requestedUrl}</td>
                            <td>{entry.batch.profileSelection === 'both' ? t.profileBoth : entry.batch.profileSelection === 'mobile' ? t.profileMobile : t.profileDesktop}</td>
                            <td>{new Date(entry.createdAt).toLocaleTimeString(lang === 'no' ? 'nb-NO' : lang === 'tr' ? 'tr-TR' : 'en-US')}</td>
                            <td>
                              <div className={s.actionsCell}>
                                <Button
                                  variant="default"
                                  onClick={() => handleLoadEntry(entry)}
                                  disabled={isRunning || isCapturing}
                                >
                                  {t.loadEntry}
                                </Button>
                                <Button
                                  variant="danger"
                                  onClick={() => handleDeleteEntry(entry.id)}
                                  disabled={isRunning || isCapturing}
                                >
                                  {t.deleteEntry}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Compare section */}
                {historyList.length >= 2 && (
                  <div className={s.compareSection}>
                    <h4 className={s.profileTitle}>{t.compareTitle}</h4>
                    <div className={s.inputRowSpaced}>
                      <label className={s.profileMeta}>
                        {t.compareSelectBefore}
                        <select
                          className={s.filterSelectIndented}
                          value={beforeId}
                          onChange={(e) => setBeforeId(e.target.value)}
                        >
                          {historyList.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.batch.requestedUrl} ({new Date(entry.createdAt).toLocaleTimeString(lang === 'no' ? 'nb-NO' : lang === 'tr' ? 'tr-TR' : 'en-US')})
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className={s.profileMeta}>
                        {t.compareSelectAfter}
                        <select
                          className={s.filterSelectIndented}
                          value={afterId}
                          onChange={(e) => setAfterId(e.target.value)}
                        >
                          {historyList.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.batch.requestedUrl} ({new Date(entry.createdAt).toLocaleTimeString(lang === 'no' ? 'nb-NO' : lang === 'tr' ? 'tr-TR' : 'en-US')})
                            </option>
                          ))}
                        </select>
                      </label>

                      <Button
                        variant="default"
                        onClick={handleCompare}
                        disabled={isRunning || isCapturing}
                      >
                        {t.compareAction}
                      </Button>
                    </div>

                    {compareResult && (
                      <div className={s.compareResultsWrapper}>
                        {compareResult.comparisonWarnings.map((warn) => {
                          const warnKey = `warn_${warn.replaceAll('-', '_')}` as keyof typeof t;
                          const message = (t[warnKey] as string) || warn;
                          return (
                            <div key={warn} className={s.warningBoxSpaced}>
                              {message}
                            </div>
                          );
                        })}

                        <table className={s.deltaTable}>
                          <thead>
                            <tr>
                              <th>Metric</th>
                              <th>{t.metricBefore}</th>
                              <th>{t.metricAfter}</th>
                              <th>{t.metricDelta}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(['performance', 'seo', 'accessibility'] as const).map((key) => {
                              const d = compareResult.scoreDeltas[key];
                              const deltaClass =
                                d.improved === true
                                  ? s.deltaGood
                                  : d.improved === false
                                  ? s.deltaBad
                                  : s.deltaNeutral;
                              return (
                                <tr key={key}>
                                  <td>{key.toUpperCase()} Score</td>
                                  <td>{d.before != null ? d.before : '—'}</td>
                                  <td>{d.after != null ? d.after : '—'}</td>
                                  <td className={deltaClass}>
                                    {d.diff != null ? (d.diff > 0 ? `+${d.diff}` : d.diff) : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                            {(['lcpMs', 'cls', 'fcpMs', 'speedIndexMs', 'tbtMs'] as const).map(
                              (key) => {
                                const d = compareResult.metricDeltas[key];
                                const deltaClass =
                                  d.improved === true
                                    ? s.deltaGood
                                    : d.improved === false
                                    ? s.deltaBad
                                    : s.deltaNeutral;
                                return (
                                  <tr key={key}>
                                    <td>{key}</td>
                                    <td>{d.before != null ? d.before : '—'}</td>
                                    <td>{d.after != null ? d.after : '—'}</td>
                                    <td className={deltaClass}>
                                      {d.diff != null ? (d.diff > 0 ? `+${d.diff}` : d.diff) : '—'}
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Clear Confirmation Modal (opens exclusively so Escape closes only child) */}
      {confirmClearOpen && (
        <Modal
          isOpen={confirmClearOpen}
          onClose={() => setConfirmClearOpen(false)}
          title={t.clearHistoryConfirmTitle}
        >
          <p>{t.clearHistoryConfirmBody}</p>
          <div className={s.modalFooterActions}>
            <Button variant="default" onClick={() => setConfirmClearOpen(false)}>
              {t.cancelClear}
            </Button>
            <Button variant="danger" onClick={handleClearAllHistory}>
              {t.confirmClear}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
