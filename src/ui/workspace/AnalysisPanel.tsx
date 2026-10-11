import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './store';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { b } from '../../platform/browser';
import { analysisTargetWarnings } from '../../lib/api/analysis';
import { createRepeatedAnalysisRunner, type RepeatedAnalysisResult } from '../../lib/api/repeated-analysis';
import type { RepetitionCount, RepeatedProfileSummary } from '../../core/analysis/repetition';
import { publicAnalysisUrlSchema } from '../../lib/validation/analysis';
import {
  loadAnalysisHistory,
  saveAnalysisBatchToHistory,
  deleteAnalysisHistoryEntry,
  clearAnalysisHistory,
  compareAnalysisEntries,
  type HistoryComparison,
} from '../../lib/api/analysis-history';
import { exportAnalysisHtml, exportAnalysisJson } from '../../core/reports/html';
import { exportRepeatedAnalysisHtml, exportRepeatedAnalysisJson } from '../../core/reports/repeated';
import {
  attachScreenshotToHtml,
  attachScreenshotToJson,
  type ReportScreenshot,
} from '../../core/reports/screenshots';
import type { AnalysisBatch, AnalysisError, AnalysisOutcome, NormalizedAudit } from '../../core/analysis/schema';
import type { AnalysisHistoryEntry } from '../../core/analysis/history';
import { getAnalysisTranslation, getGeoRecommendationText } from './analysis-i18n';
import s from './AnalysisPanel.module.css';

export interface AnalysisPanelProps {
  section: 'performance' | 'seo' | 'reports' | 'geo';
  onClose: () => void;
  onCaptureViewport?: () => Promise<ReportScreenshot>;
}

export function AnalysisPanel({ section: initialSection, onClose, onCaptureViewport }: AnalysisPanelProps) {
  const st = useStore();
  const lang = st.language;
  const t = getAnalysisTranslation(lang);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'performance' | 'seo' | 'geo' | 'reports'>(initialSection);

  // Analysis target inputs
  const [targetUrl, setTargetUrl] = useState(() => st.model.url || '');
  const [profileSelection, setProfileSelection] = useState<'mobile' | 'desktop' | 'both'>('mobile');
  const [runCount, setRunCount] = useState<RepetitionCount>(1);
  const [consentGranted, setConsentGranted] = useState(false);

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
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
  const runnerRef = useRef(createRepeatedAnalysisRunner());
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

  // Sync initial tab if parent changes section prop
  useEffect(() => {
    setActiveTab(initialSection);
  }, [initialSection]);

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
      setActiveBatch(null);
      setActiveRepetition(null);
      setScreenshot(null);
      setIsStaleBatch(false);
    }
  }, [lang]);

  // Validation warnings
  const warnings = useMemo(() => {
    return analysisTargetWarnings({ url: targetUrl, profile: profileSelection, locale: lang });
  }, [targetUrl, profileSelection, lang]);

  const isUrlValid = useMemo(() => {
    return publicAnalysisUrlSchema.safeParse(targetUrl).success;
  }, [targetUrl]);

  // If user edits targetUrl or changes profileSelection after a batch was loaded,
  // clearly flag that the displayed batch belongs to the earlier target/profile.
  const isTargetChanged = useMemo(() => {
    if (!activeBatch) return false;
    const parsedTarget = publicAnalysisUrlSchema.safeParse(targetUrl);
    const urlDiffers = !parsedTarget.success || activeBatch.requestedUrl !== parsedTarget.data;
    const profileDiffers = activeBatch.profileSelection !== profileSelection;
    return urlDiffers || profileDiffers;
  }, [activeBatch, targetUrl, profileSelection]);

  // Run analysis handler
  const handleStartAnalysis = async () => {
    if (!isUrlValid || !consentGranted || isRunning || isCapturing) return;

    const currentGen = ++runGenerationRef.current;
    setIsRunning(true);
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
            code: 'NETWORK_ERROR',
            messageCode: 'ANALYSIS_NETWORK_ERROR',
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
    setActiveBatch(entry.batch);
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

  // Filtered audits for SEO & A11y Tab (preserves mobile/desktop context)
  interface AuditWithProfile extends NormalizedAudit {
    profile: string;
  }

  const allAuditsWithProfile: AuditWithProfile[] = useMemo(() => {
    if (!activeBatch) return [];
    return activeBatch.results
      .filter((o) => o.status === 'success' && o.data)
      .flatMap((o) =>
        o.data!.lab.audits.map((a) => ({
          ...a,
          profile: o.profile,
        })),
      );
  }, [activeBatch]);

  const filteredAudits = useMemo(() => {
    return allAuditsWithProfile.filter((audit) => {
      if (auditFilterCategory !== 'all' && audit.category !== auditFilterCategory) {
        return false;
      }
      if (auditFilterStatus === 'passed' && audit.status !== 'pass') return false;
      if (auditFilterStatus === 'failed' && audit.status !== 'fail') return false;
      if (auditFilterStatus === 'informative' && audit.status !== 'informative') return false;
      if (auditFilterStatus === 'manual' && audit.status !== 'manual') return false;

      if (auditFilterSeverity !== 'all' && audit.importance !== auditFilterSeverity) {
        return false;
      }
      return true;
    });
  }, [allAuditsWithProfile, auditFilterCategory, auditFilterStatus, auditFilterSeverity]);

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
      <Modal isOpen={!confirmClearOpen} onClose={onClose} title={t.title}>
        <div className={s.container}>
          {/* Navigation tabs */}
          <nav className={s.tabNav} aria-label="Analysis Tabs">
            <Button
              variant={activeTab === 'performance' ? 'primary' : 'default'}
              onClick={() => setActiveTab('performance')}
              className={`${s.tabButton} ${activeTab === 'performance' ? s.tabButtonActive : ''}`}
            >
              {t.tabPerformance}
            </Button>
            <Button
              variant={activeTab === 'seo' ? 'primary' : 'default'}
              onClick={() => setActiveTab('seo')}
              className={`${s.tabButton} ${activeTab === 'seo' ? s.tabButtonActive : ''}`}
            >
              {t.tabSeo}
            </Button>
            <Button
              variant={activeTab === 'geo' ? 'primary' : 'default'}
              onClick={() => setActiveTab('geo')}
              className={`${s.tabButton} ${activeTab === 'geo' ? s.tabButtonActive : ''}`}
            >
              {t.tabGeo}
            </Button>
            <Button
              variant={activeTab === 'reports' ? 'primary' : 'default'}
              onClick={() => setActiveTab('reports')}
              className={`${s.tabButton} ${activeTab === 'reports' ? s.tabButtonActive : ''}`}
            >
              {t.tabReports}
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
              <select
                className={s.runCountSelect}
                value={runCount}
                onChange={(e) => {
                  setRunCount(Number(e.target.value) as RepetitionCount);
                  setActiveBatch(null);
                  setActiveRepetition(null);
                  setScreenshot(null);
                }}
                disabled={isRunning || isCapturing}
                aria-label={t.runCountLabel}
              >
                <option value={1}>{t.runCountSingle}</option>
                <option value={3}>{t.runCountTriple}</option>
              </select>
              {isRunning ? (
                <Button variant="danger" onClick={handleCancelAnalysis} disabled={isSavingHistory}>
                  {t.cancelAnalysis}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleStartAnalysis}
                  disabled={!isUrlValid || !consentGranted || isCapturing}
                >
                  {t.runAnalysis}
                </Button>
              )}
            </div>

            <label className={s.checkboxLabel}>
              <input
                type="checkbox"
                className={s.checkboxInput}
                checked={consentGranted}
                onChange={(e) => setConsentGranted(e.target.checked)}
                disabled={isRunning}
              />
              <span>{t.consentCheckbox}</span>
            </label>

            <div className={s.disclosureText}>
              {runCount === 3
                ? profileSelection === 'both'
                  ? t.disclosureTripleBothProfiles
                  : t.disclosureTripleSingleProfile
                : profileSelection === 'both'
                  ? t.disclosureSingleBoth
                  : t.disclosureSingleProfile}
            </div>

            {warnings.length > 0 && <div className={s.warningBox}>{t.querySensitiveWarning}</div>}
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
                <Button variant="default" onClick={handleStartAnalysis}>
                  {t.retry}
                </Button>
              )}
            </div>
          )}

          {/* Content body based on active tab */}
          <div className={s.scrollArea}>
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

                              {profSummary.status === 'withheld' ? (
                                <div className={s.withheldNotice}>
                                  {t.withheldNoFakeZero}
                                </div>
                              ) : (
                                <>
                                  <div className={s.scoresGrid}>
                                    <div className={s.scoreBadge}>
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
                                    <div className={s.scoreBadge}>
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
                                    <div className={s.scoreBadge}>
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
                                    <div className={s.metricCard}>
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
                                    <div className={s.metricCard}>
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
                                    <div className={s.metricCard}>
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
                                    <div className={s.metricCard}>
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
                                    <div className={s.metricCard}>
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

                    {activeBatch.results.map((outcome: AnalysisOutcome) => (
                      <div key={outcome.profile} className={s.profileCard}>
                        <div className={s.profileCardHeader}>
                          <h3 className={s.profileTitle}>
                            {outcome.profile === 'mobile' ? t.profileMobile : t.profileDesktop}
                          </h3>
                          <span className={s.profileMeta}>
                            {outcome.status === 'success'
                              ? t.statusSuccess
                              : outcome.status === 'cancelled'
                              ? t.statusCancelled
                              : t.statusError}
                          </span>
                        </div>

                        {/* If outcome failed or cancelled: show error card and HTTP retry, NEVER synthetic 0 score */}
                        {outcome.status !== 'success' && (
                          <div className={s.errorBox} role="alert">
                            <div>
                              <strong>{outcome.status === 'cancelled' ? t.statusCancelled : t.errorTitle}: </strong>
                              <span>{getErrorMessage(outcome.error)}</span>
                              {outcome.error.httpStatus && <span> (HTTP {outcome.error.httpStatus})</span>}
                            </div>
                            {outcome.error.retryable && (
                              <Button variant="default" onClick={handleStartAnalysis}>
                                {t.retry}
                              </Button>
                            )}
                          </div>
                        )}

                        {outcome.status === 'success' && outcome.data && (
                          <>
                            {/* Engine & measurement conditions info */}
                            <div className={s.conditionsBox}>
                              <div className={s.conditionsRow}>
                                <span>
                                  <strong>Engine: </strong>
                                  {outcome.data.lab.engine.name}{' '}
                                  {outcome.data.lab.engine.version ?? t.engineVersionUnavailable}
                                </span>
                                <span>
                                  <strong>{t.analyzedAtLabel}: </strong>
                                  {outcome.data.analyzedAt
                                    ? new Date(outcome.data.analyzedAt).toLocaleString()
                                    : '—'}
                                </span>
                              </div>
                              <div className={s.conditionsRow}>
                                <span>
                                  <strong>{t.measurementContextLabel}: </strong>
                                  {outcome.data.lab.conditions.measurementContext}
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

                            {/* Scores */}
                            <div className={s.scoresGrid}>
                              {renderScore(outcome.data.lab.scores.performance, 'Performance')}
                              {renderScore(outcome.data.lab.scores.seo, 'SEO')}
                              {renderScore(outcome.data.lab.scores.accessibility, 'Accessibility')}
                            </div>

                            {/* Lab Metrics */}
                            <div>
                              <h4 className={s.fieldTitle}>{t.labSectionTitle}</h4>
                              <span className={s.profileMeta}>{t.labSubtitle}</span>
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
                              <p className={s.profileMetaSpaced}>
                                {t.tbtNote}
                              </p>
                            </div>

                            {/* CrUX Field Data */}
                            <div className={s.fieldContainer}>
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
                        <option value="performance">{t.categoryPerf}</option>
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

                    {filteredAudits.length === 0 ? (
                      <p className={s.profileMeta}>{t.noAuditsFound}</p>
                    ) : (
                      <div className={s.auditList}>
                        {filteredAudits.map((audit) => {
                          let badgeClass = s.badgeInfo;
                          if (audit.status === 'pass') badgeClass = s.badgePass;
                          else if (audit.status === 'fail') badgeClass = s.badgeFail;
                          else if (audit.status === 'manual') badgeClass = s.badgeManual;

                          let importanceClass = s.badgeImportanceLow;
                          if (audit.importance === 'high') importanceClass = s.badgeImportanceHigh;
                          else if (audit.importance === 'medium') importanceClass = s.badgeImportanceMed;

                          return (
                            <div key={`${audit.profile}-${audit.id}`} className={s.auditCard}>
                              <div className={s.auditHeader}>
                                <h5 className={s.auditTitle}>{audit.title}</h5>
                                <div className={s.auditBadgesGroup}>
                                  <span className={`${s.auditBadge} ${s.badgeProfile}`}>
                                    {audit.profile.toUpperCase()}
                                  </span>
                                  <span className={`${s.auditBadge} ${importanceClass}`}>
                                    {audit.importance.toUpperCase()}
                                  </span>
                                  <span className={`${s.auditBadge} ${badgeClass}`}>
                                    {getAuditStatusLabel(audit.status)}
                                  </span>
                                </div>
                              </div>
                              <p className={s.auditDesc}>{audit.recommendation}</p>
                              {audit.displayValue && (
                                <div className={s.profileMetaInline}>
                                  <strong>Value: </strong>
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
                                  <td>{crit.id}</td>
                                  <td>{crit.mode}</td>
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
                                  <td>{crit.evidenceAuditIds.join(', ') || '—'}</td>
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
                          <th>Profile</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyList.map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.batch.requestedUrl}</td>
                            <td>{entry.batch.profileSelection}</td>
                            <td>{new Date(entry.createdAt).toLocaleTimeString()}</td>
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
                              {entry.batch.requestedUrl} ({new Date(entry.createdAt).toLocaleTimeString()})
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
                              {entry.batch.requestedUrl} ({new Date(entry.createdAt).toLocaleTimeString()})
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
