import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  saveAnalysisBatchToHistory,
  clearAnalysisHistory,
  loadAnalysisHistory,
  ANALYSIS_HISTORY_KEY,
} from '../../src/lib/api/analysis-history';
import type { AnalysisBatch } from '../../src/core/analysis/schema';

const storage = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), remove: vi.fn() }));
vi.mock('../../src/platform/browser', () => ({ b: { storage: { local: storage } } }));
beforeEach(() => {
  storage.get.mockReset();
  storage.set.mockReset();
  storage.remove.mockReset();
});
const batch: AnalysisBatch = {
  schemaVersion: 1,
  requestId: 'controlled-storage-test',
  requestedUrl: 'https://example.com/',
  profileSelection: 'mobile',
  startedAt: '2026-10-11T10:00:00.000Z',
  completedAt: '2026-10-11T10:00:30.000Z',
  results: [
    {
      profile: 'mobile',
      status: 'error',
      data: null,
      error: {
        code: 'RATE_LIMITED',
        messageCode: 'ANALYSIS_RATE_LIMITED',
        retryable: true,
        httpStatus: 429,
      },
    },
  ],
};
describe('analysis history storage failures', () => {
  it('serializes concurrent read-modify-write saves without losing either run', async () => {
    let records: unknown = [];
    storage.get.mockImplementation(async () => ({
      [ANALYSIS_HISTORY_KEY]: structuredClone(records),
    }));
    storage.set.mockImplementation(async (value) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      records = value[ANALYSIS_HISTORY_KEY];
    });
    await Promise.all([
      saveAnalysisBatchToHistory({ ...batch, requestId: 'first' }),
      saveAnalysisBatchToHistory({ ...batch, requestId: 'second' }),
    ]);
    expect((await loadAnalysisHistory()).map((entry) => entry.id).sort()).toEqual([
      'first',
      'second',
    ]);
  });
  it('queues clear after an outstanding save and does not resurrect removed history', async () => {
    let records: unknown = [];
    storage.get.mockImplementation(async () => ({ [ANALYSIS_HISTORY_KEY]: records }));
    storage.set.mockImplementation(async (value) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      records = value[ANALYSIS_HISTORY_KEY];
    });
    storage.remove.mockImplementation(async () => {
      records = [];
    });
    await Promise.all([saveAnalysisBatchToHistory(batch), clearAnalysisHistory()]);
    expect(await loadAnalysisHistory()).toEqual([]);
  });
  it('does not overwrite existing history when reading fails', async () => {
    storage.get.mockRejectedValue(new Error('private storage failure'));
    await expect(saveAnalysisBatchToHistory(batch)).rejects.toMatchObject({
      code: 'HISTORY_LOAD_FAILED',
    });
    expect(storage.set).not.toHaveBeenCalled();
  });
  it('reports write failures with a safe code', async () => {
    storage.get.mockResolvedValue({});
    storage.set.mockRejectedValue(new Error('private write failure'));
    await expect(saveAnalysisBatchToHistory(batch)).rejects.toMatchObject({
      code: 'HISTORY_SAVE_FAILED',
    });
  });
});
