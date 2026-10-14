import type { Issue } from '../../core/types';
import { useStore } from './store';
import { requestScan, hasHostAccess, workspaceHello } from './bridge';
let timer: ReturnType<typeof setTimeout> | undefined;
export async function startScan() {
  clearTimeout(timer);
  const st = useStore.getState();
  const viewports = st.visibleViewports().filter(v => !v.minimized && /^https?:/.test(v.url));
  const scanId = crypto.randomUUID();
  const ids = viewports.map(v => v.id);
  useStore.setState({ scanCoverage: {}, scanId, issues: [], scanning: ids.length > 0, scanPending: ids, scanFailed: [], scanFailureReasons:{}, scanNotice:ids.length?null:'no-target', scanTruncated: [], scannedAt: null, drawerOpen: true });
  if (!ids.length) return;
  timer = setTimeout(() => {
    const state = useStore.getState();
    if (state.scanId !== scanId) return;
    useStore.setState({ scanning: false, scanFailed: [...new Set([...state.scanFailed, ...state.scanPending])], scanFailureReasons:{...state.scanFailureReasons,...Object.fromEntries(state.scanPending.map(id=>[id,'timeout' as const]))}, scanPending: [], scannedAt: Date.now() });
  }, 8000);
  try {
    const permitted=await hasHostAccess();
    if(useStore.getState().scanId!==scanId)return;
    if(!permitted){clearTimeout(timer);useStore.setState({scanning:false,scanPending:[],scanNotice:'permission'});return;}
    await workspaceHello();
    if(useStore.getState().scanId!==scanId || !useStore.getState().scanning)return;
    const result = await requestScan(scanId, ids, viewports.filter(v => st.profileOf(v).touchSupport).map(v => v.id));
    if (useStore.getState().scanId !== scanId || !useStore.getState().scanning) return;
    const missing = ids.filter(id => !result.reached?.includes(id));
    useStore.setState(s => {
      const pending = s.scanPending.filter(id => !missing.includes(id));
      return { scanPending: pending, scanFailed: [...new Set([...s.scanFailed, ...missing])], scanFailureReasons:{...s.scanFailureReasons,...Object.fromEntries(missing.map(id=>[id,'unreachable' as const]))}, scanning: pending.length > 0, scannedAt: pending.length ? null : Date.now() };
    });
  } catch {
    if (useStore.getState().scanId === scanId) {clearTimeout(timer);useStore.setState({ scanning: false, scanFailed: ids, scanFailureReasons:Object.fromEntries(ids.map(id=>[id,'message' as const])), scanPending: [], scannedAt: Date.now() });}
  }
}
export function acceptScanResult(viewportId: string, issues: Omit<Issue, 'viewportId'>[], scanId: string, truncated: boolean, scannedElements = 0, errorCode?:'MEASUREMENT_FAILED') {
  const state = useStore.getState();
  if (state.scanId !== scanId || !state.scanPending.includes(viewportId)) return;
  if(errorCode){const pending=state.scanPending.filter(id=>id!==viewportId);useStore.setState({scanPending:pending,scanFailed:[...state.scanFailed,viewportId],scanFailureReasons:{...state.scanFailureReasons,[viewportId]:'measurement'},scanning:pending.length>0,scannedAt:pending.length?null:Date.now()});if(!pending.length)clearTimeout(timer);return;}
  const seen = new Set<string>();
  state.mergeScanResult(viewportId, issues.filter(i => {
    const key = `${i.rule}:${i.selector || 'document'}`;
    if (seen.has(key)) return false; seen.add(key); return true;
  }));
  const pending = state.scanPending.filter(id => id !== viewportId);
  useStore.setState({ scanCoverage: { ...state.scanCoverage, [viewportId]: scannedElements }, scanPending: pending, scanning: pending.length > 0, scannedAt: pending.length ? null : Date.now(), scanTruncated: truncated ? [...state.scanTruncated, viewportId] : state.scanTruncated });
  if (!pending.length) clearTimeout(timer);
}

export function cancelScan(){clearTimeout(timer);useStore.setState({scanId:null,scanning:false,scanPending:[],scanFailed:[],scanFailureReasons:{},scanCoverage:{},issues:[],scannedAt:null,scanNotice:'cancelled'});}
