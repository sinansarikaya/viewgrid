// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '../../src/ui/workspace/store';
import { acceptScanResult, startScan } from '../../src/ui/workspace/scan';
import { BUILTIN_DEVICES } from '../../src/core/devices/builtin';
import { defaultWorkspace } from '../../src/core/workspace/serialize';
vi.mock('../../src/ui/workspace/bridge', () => ({ requestScan: vi.fn(async (_id, ids) => ({ ok: true, reached: ids })), hasHostAccess: vi.fn(async () => true) }));
beforeEach(() => {
  useStore.setState({ model: defaultWorkspace('https://fixture.test'), issues: [], scanPending: [], scanFailed: [], scanTruncated: [], scanId: null });
  useStore.getState().addDevice(BUILTIN_DEVICES[0]!);
  useStore.getState().addDevice(BUILTIN_DEVICES[1]!);
});
describe('scan completion', () => {
  it('waits for every requested viewport, ignores old scans and accepts empty successful results', async () => {
    await startScan();
    const state = useStore.getState(), [a, b] = state.scanPending;
    acceptScanResult(a!, [], 'old-scan', false);
    expect(useStore.getState().scanPending).toHaveLength(2);
    acceptScanResult(a!, [], state.scanId!, false);
    expect(useStore.getState().scanning).toBe(true);
    acceptScanResult(b!, [], state.scanId!, true);
    expect(useStore.getState().scanning).toBe(false);
    expect(useStore.getState().scanTruncated).toEqual([b]);
    expect(useStore.getState().scannedAt).not.toBeNull();
  });
});
