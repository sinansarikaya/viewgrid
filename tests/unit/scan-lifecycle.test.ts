// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '../../src/ui/workspace/store';
import { acceptScanResult, startScan, cancelScan } from '../../src/ui/workspace/scan';
import { requestScan, hasHostAccess } from '../../src/ui/workspace/bridge';
import { BUILTIN_DEVICES } from '../../src/core/devices/builtin';
import { defaultWorkspace } from '../../src/core/workspace/serialize';
vi.mock('../../src/ui/workspace/bridge', () => ({ requestScan: vi.fn(async (_id, ids) => ({ ok: true, reached: ids })), hasHostAccess: vi.fn(async () => true),workspaceHello:vi.fn(async()=>{}) }));
beforeEach(() => {
  vi.useFakeTimers();vi.clearAllMocks();
  vi.mocked(hasHostAccess).mockResolvedValue(true);
  vi.mocked(requestScan).mockImplementation(async (_id,ids)=>({ok:true,reached:ids}));
  useStore.setState({ model: defaultWorkspace('https://fixture.test'), issues: [], scanPending: [], scanFailed: [], scanTruncated: [], scanId: null });
  useStore.getState().addDevice(BUILTIN_DEVICES[0]!);
  useStore.getState().addDevice(BUILTIN_DEVICES[1]!);
});
afterEach(()=>{cancelScan();vi.clearAllTimers();vi.useRealTimers();});
describe('scan completion', () => {
  it('clears old failure, coverage and cancellation state on URL navigation',async()=>{
    await startScan();vi.advanceTimersByTime(8000);
    useStore.setState({scanCoverage:{old:10},scanNotice:'cancelled'});
    useStore.getState().applyUrl('https://next.test/');
    const state=useStore.getState();
    expect(state.scanNotice).toBeNull();expect(state.scanFailed).toEqual([]);expect(state.scanFailureReasons).toEqual({});expect(state.scanCoverage).toEqual({});expect(state.scanPending).toEqual([]);
  });
  it('distinguishes permission denial from a successful empty scan',async()=>{
    vi.mocked(hasHostAccess).mockResolvedValue(false);await startScan();
    expect(useStore.getState().scanNotice).toBe('permission');expect(useStore.getState().scannedAt).toBeNull();expect(requestScan).not.toHaveBeenCalled();
  });
  it('explains when no expanded visible HTTP viewport can be scanned',async()=>{
    useStore.setState(state=>({model:{...state.model,viewports:state.model.viewports.map(viewport=>({...viewport,minimized:true}))}}));await startScan();
    expect(useStore.getState().scanNotice).toBe('no-target');expect(requestScan).not.toHaveBeenCalled();
  });
  it('records a timeout instead of a false empty success',async()=>{
    await startScan();vi.advanceTimersByTime(8000);
    expect(Object.values(useStore.getState().scanFailureReasons)).toEqual(['timeout','timeout']);expect(useStore.getState().scanCoverage).toEqual({});expect(useStore.getState().scanning).toBe(false);
  });
  it('records an unreachable agent independently of remaining results',async()=>{
    vi.mocked(requestScan).mockImplementation(async(_id,ids)=>({ok:true,reached:ids.slice(0,1)}));await startScan();
    const state=useStore.getState();expect(Object.values(state.scanFailureReasons)).toEqual(['unreachable']);expect(state.scanPending).toHaveLength(1);
    acceptScanResult(state.scanPending[0]!,[],state.scanId!,false,10);expect(useStore.getState().scanCoverage).toEqual({[state.scanPending[0]!]:10});expect(useStore.getState().scanFailed).toHaveLength(1);
  });
  it('records transport and measurement errors without manufacturing coverage',async()=>{
    vi.mocked(requestScan).mockRejectedValueOnce(new Error('fixture transport failure'));await startScan();expect(Object.values(useStore.getState().scanFailureReasons)).toEqual(['message','message']);
    await startScan();const state=useStore.getState();acceptScanResult(state.scanPending[0]!,[],state.scanId!,false,0,'MEASUREMENT_FAILED');expect(Object.values(useStore.getState().scanFailureReasons)).toEqual(['measurement']);expect(useStore.getState().scanCoverage).toEqual({});
  });
  it('cancels and ignores late results from the cancelled scan',async()=>{
    await startScan();const state=useStore.getState();cancelScan();acceptScanResult(state.scanPending[0]!,[],state.scanId!,false,99);
    expect(useStore.getState().scanNotice).toBe('cancelled');expect(useStore.getState().scanCoverage).toEqual({});expect(useStore.getState().scannedAt).toBeNull();
  });
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
