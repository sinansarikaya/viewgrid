import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizePsiResponse } from '../../src/core/analysis/normalize';
import fixture from '../fixtures/psi-response.json';
const mocks = vi.hoisted(() => ({ message: vi.fn(), permission: vi.fn(), hello: vi.fn(), state: { current: null as any } }));
vi.mock('../../src/ui/workspace/store', () => ({ useStore: { getState: () => mocks.state.current } }));
vi.mock('../../src/ui/workspace/bridge', () => ({ workspaceMessage: mocks.message, hasHostAccess: mocks.permission, workspaceHello: mocks.hello }));
import { createLocalAnalysisRunner, runLocalAnalysis } from '../../src/lib/api/local-analysis';
const url = 'http://localhost:3000/';
function localResult(profile: 'mobile' | 'desktop' = 'mobile') {
  const data: any = normalizePsiResponse(fixture, 'https://example.com/', profile);
  data.source = 'viewgrid-local'; data.requestedUrl = url; data.finalUrl = url;
  data.lab.engine.name = 'ViewGrid'; data.lab.conditions.measurementContext = 'local-preview';
  data.lab.scores = { performance: null, seo: null, accessibility: null };
  data.lab.local = { width: 393, height: 852, scannedElements: 12, truncated: false, durationMs: 20, ruleVersion: '1.0.0' };
  return data;
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.permission.mockResolvedValue(true); mocks.hello.mockResolvedValue({ ok: true });
  const viewports = [{ id: 'phone', url, minimized: false }, { id: 'desktop', url, minimized: false }];
  mocks.state.current = { previewGeneration: 1, visibleViewports: () => viewports, profileOf: (v: any) => ({ touchSupport: v.id === 'phone' }) };
  mocks.message.mockImplementation(async message => message.type === 'vg/local-analysis-run' ? { ok: true, data: localResult(message.request.profile) } : { ok: true });
});
describe('local transport', () => {
  it('supports localhost with one sequential scan per actual profile and no fetch', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('No network allowed'));
    try {
      const batch = await runLocalAnalysis({ url, profile: 'both', locale: 'tr' });
      expect(batch.results.map(o => o.status)).toEqual(['success', 'success']);
      expect(mocks.message.mock.calls.filter(([m]) => m.type === 'vg/local-analysis-run').map(([m]) => m.viewportId)).toEqual(['phone', 'desktop']);
      expect(spy).not.toHaveBeenCalled();
    } finally { spy.mockRestore(); }
  });
  it('preserves successful profile when the second actual profile is missing', async () => {
    mocks.state.current.visibleViewports = () => [{ id: 'phone', url }];
    const batch = await runLocalAnalysis({ url, profile: 'both' });
    expect(batch.results[0]?.status).toBe('success'); expect(batch.results[1]?.error?.code).toBe('PROFILE_UNAVAILABLE');
  });
  it('never scans a different target', async () => {
    const batch = await runLocalAnalysis({ url: 'http://localhost:3000/other', profile: 'mobile' });
    expect(batch.results[0]?.error?.code).toBe('TARGET_MISMATCH'); expect(mocks.message).not.toHaveBeenCalled();
  });
  it('reports missing permission without dispatch', async () => {
    mocks.permission.mockResolvedValue(false);
    expect((await runLocalAnalysis({ url })).results[0]?.error?.code).toBe('PERMISSION_REQUIRED'); expect(mocks.message).not.toHaveBeenCalled();
  });
  it('rejects foreign measurements and wrong profile', async () => {
    mocks.message.mockResolvedValue({ ok: true, data: { ...localResult(), source: 'google-psi' } });
    expect((await runLocalAnalysis({ url })).results[0]?.error?.code).toBe('TARGET_MISMATCH');
    mocks.message.mockResolvedValue({ ok: true, data: localResult('desktop') });
    expect((await runLocalAnalysis({ url })).results[0]?.error?.code).toBe('TARGET_MISMATCH');
  });
  it('discards a result if navigation changed during collection', async () => {
    mocks.message.mockImplementation(async () => { mocks.state.current = { ...mocks.state.current, previewGeneration: 2 }; return { ok: true, data: localResult() }; });
    expect((await runLocalAnalysis({ url })).results[0]?.error?.code).toBe('TARGET_MISMATCH');
  });
  it('cancel suppresses late output and sends explicit abort', async () => {
    let resolve!: (value: unknown) => void;
    mocks.message.mockImplementation(message => message.type === 'vg/local-analysis-run' ? new Promise(r => { resolve = r; }) : Promise.resolve({ ok: true }));
    const runner = createLocalAnalysisRunner(); const pending = runner.run({ url }, 1);
    await vi.waitFor(() => expect(resolve).toBeTypeOf('function'));
    runner.cancel(); expect(await pending).toBeNull();
    resolve({ ok: true, data: localResult() });
    expect(mocks.message).toHaveBeenCalledWith(expect.objectContaining({ type: 'vg/local-analysis-cancel' }));
  });
  it('does not repeat snapshots even when the legacy count is 3', async () => {
    const result = await createLocalAnalysisRunner().run({ url }, 3);
    expect(result?.requestedCount).toBe(1); expect(mocks.message).toHaveBeenCalledTimes(1);
  });
});
