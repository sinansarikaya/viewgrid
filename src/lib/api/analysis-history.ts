import { b } from '../../platform/browser';
import {
  type AnalysisHistoryEntry,
  sanitizeAnalysisHistory,
  appendAnalysisHistory,
  removeAnalysisHistoryEntry,
} from '../../core/analysis/history';
import { comparisonWarnings, type ComparisonWarning } from '../../core/analysis/comparison';
import type { AnalysisBatch, AnalysisResult } from '../../core/analysis/schema';

export const ANALYSIS_HISTORY_KEY = 'viewgrid.analysis.history';
let historyOperations: Promise<void> = Promise.resolve();
function serializedHistory<T>(operation: () => Promise<T>): Promise<T> {
  const next = historyOperations.then(async (): Promise<T> => {
    // Web Locks also serialize separate workspace tabs where supported.
    // Without that browser capability, the queue still serializes this module.
    if (typeof navigator !== 'undefined' && navigator.locks?.request) {
      return await navigator.locks.request(ANALYSIS_HISTORY_KEY, operation);
    }
    return operation();
  });
  historyOperations = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export class AnalysisHistoryStorageError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'AnalysisHistoryStorageError';
  }
}

export interface HistoryDelta {
  metric: string;
  before: number | null;
  after: number | null;
  diff: number | null;
  improved: boolean | null; // true if after is better, false if worse, null if neutral/n/a
}

export interface HistoryComparison {
  beforeEntry: AnalysisHistoryEntry;
  afterEntry: AnalysisHistoryEntry;
  profile: 'mobile' | 'desktop';
  scoreDeltas: Record<'performance' | 'seo' | 'accessibility', HistoryDelta>;
  metricDeltas: Record<'lcpMs' | 'cls' | 'fcpMs' | 'speedIndexMs' | 'tbtMs', HistoryDelta>;
  comparisonWarnings: ComparisonWarning[];
}

/**
 * Load analysis history from browser.storage.local safely.
 * Throws AnalysisHistoryStorageError on failure instead of masking with empty array.
 */
async function readAnalysisHistory(): Promise<AnalysisHistoryEntry[]> {
  try {
    if (!b.storage?.local?.get) {
      throw new AnalysisHistoryStorageError('STORAGE_UNAVAILABLE');
    }
    const res = await b.storage.local.get(ANALYSIS_HISTORY_KEY);
    const raw = res ? (res as Record<string, unknown>)[ANALYSIS_HISTORY_KEY] : undefined;
    return sanitizeAnalysisHistory(raw);
  } catch (err) {
    if (err instanceof AnalysisHistoryStorageError) throw err;
    throw new AnalysisHistoryStorageError('HISTORY_LOAD_FAILED');
  }
}

export function loadAnalysisHistory(): Promise<AnalysisHistoryEntry[]> {
  return serializedHistory(readAnalysisHistory);
}

/**
 * Append a newly completed batch to history, maintaining 20 items / 256KB limits.
 * Throws AnalysisHistoryStorageError on failure.
 */
export async function saveAnalysisBatchToHistory(
  batch: AnalysisBatch,
): Promise<AnalysisHistoryEntry[]> {
  return serializedHistory(async () => {
    try {
      const existing = await readAnalysisHistory();
      const updated = appendAnalysisHistory(existing, batch);
      if (!b.storage?.local?.set) {
        throw new AnalysisHistoryStorageError('STORAGE_UNAVAILABLE');
      }
      await b.storage.local.set({ [ANALYSIS_HISTORY_KEY]: updated });
      return updated;
    } catch (err) {
      if (err instanceof AnalysisHistoryStorageError) throw err;
      throw new AnalysisHistoryStorageError('HISTORY_SAVE_FAILED');
    }
  });
}

/**
 * Delete a single analysis entry by ID.
 * Throws AnalysisHistoryStorageError on failure.
 */
export async function deleteAnalysisHistoryEntry(id: string): Promise<AnalysisHistoryEntry[]> {
  return serializedHistory(async () => {
    try {
      const existing = await readAnalysisHistory();
      const updated = removeAnalysisHistoryEntry(existing, id);
      if (!b.storage?.local?.set) {
        throw new AnalysisHistoryStorageError('STORAGE_UNAVAILABLE');
      }
      await b.storage.local.set({ [ANALYSIS_HISTORY_KEY]: updated });
      return updated;
    } catch (err) {
      if (err instanceof AnalysisHistoryStorageError) throw err;
      throw new AnalysisHistoryStorageError('HISTORY_DELETE_FAILED');
    }
  });
}

/**
 * Clear all analysis history from storage.
 * Throws AnalysisHistoryStorageError on failure.
 */
export async function clearAnalysisHistory(): Promise<void> {
  return serializedHistory(async () => {
    try {
      if (!b.storage?.local?.remove) {
        throw new AnalysisHistoryStorageError('STORAGE_UNAVAILABLE');
      }
      await b.storage.local.remove(ANALYSIS_HISTORY_KEY);
    } catch (err) {
      if (err instanceof AnalysisHistoryStorageError) throw err;
      throw new AnalysisHistoryStorageError('HISTORY_CLEAR_FAILED');
    }
  });
}

/**
 * Helper to compute before-and-after comparison between two history runs for a given profile.
 * Uses core `comparisonWarnings` for comprehensive target/profile/engine/conditions/redaction/unknown warnings.
 */
export function compareAnalysisEntries(
  beforeEntry: AnalysisHistoryEntry,
  afterEntry: AnalysisHistoryEntry,
  profile: 'mobile' | 'desktop',
): HistoryComparison | null {
  const findResult = (entry: AnalysisHistoryEntry): AnalysisResult | null => {
    const outcome = entry.batch.results.find(
      (r) => r.profile === profile && r.status === 'success',
    );
    return outcome && outcome.status === 'success' ? outcome.data : null;
  };

  const beforeResult = findResult(beforeEntry);
  const afterResult = findResult(afterEntry);

  if (!beforeResult || !afterResult) {
    return null;
  }

  // Use core comparisonWarnings
  const warnings = comparisonWarnings(beforeResult, afterResult);

  // Scores (higher is better)
  const calcScoreDelta = (key: 'performance' | 'seo' | 'accessibility'): HistoryDelta => {
    const before = beforeResult.lab.scores[key];
    const after = afterResult.lab.scores[key];
    if (before === null || after === null) {
      return { metric: key, before, after, diff: null, improved: null };
    }
    const diff = Math.round((after - before) * 10) / 10;
    return {
      metric: key,
      before,
      after,
      diff,
      improved: diff > 0 ? true : diff < 0 ? false : null,
    };
  };

  // Metrics (lower is better)
  const calcMetricDelta = (
    key: 'lcpMs' | 'cls' | 'fcpMs' | 'speedIndexMs' | 'tbtMs',
  ): HistoryDelta => {
    const before = beforeResult.lab.metrics[key];
    const after = afterResult.lab.metrics[key];
    if (before === null || after === null) {
      return { metric: key, before, after, diff: null, improved: null };
    }
    const diff = Math.round((after - before) * 100) / 100;
    return {
      metric: key,
      before,
      after,
      diff,
      improved: diff < 0 ? true : diff > 0 ? false : null,
    };
  };

  return {
    beforeEntry,
    afterEntry,
    profile,
    scoreDeltas: {
      performance: calcScoreDelta('performance'),
      seo: calcScoreDelta('seo'),
      accessibility: calcScoreDelta('accessibility'),
    },
    metricDeltas: {
      lcpMs: calcMetricDelta('lcpMs'),
      cls: calcMetricDelta('cls'),
      fcpMs: calcMetricDelta('fcpMs'),
      speedIndexMs: calcMetricDelta('speedIndexMs'),
      tbtMs: calcMetricDelta('tbtMs'),
    },
    comparisonWarnings: warnings,
  };
}
