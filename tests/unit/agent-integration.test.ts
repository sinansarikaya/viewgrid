// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

let receiver: (message: any) => void;
let send: ReturnType<typeof vi.fn>;
beforeEach(async () => {
  vi.resetModules(); vi.useFakeTimers();
  window.name = 'viewgrid:phone';
  document.body.innerHTML = '<input id="name"><button id="action">Go</button>';
  (globalThis as any).__viewgridAgentInstalled = false;
  (globalThis as any).CSS = { escape: (s: string) => s };
  send = vi.fn().mockResolvedValue({ ok: true });
  (globalThis as any).chrome = { runtime: { getURL: (p: string) => `chrome-extension://test/${p}`, sendMessage: send, onMessage: { addListener: (fn: typeof receiver) => { receiver = fn; } } } };
  Object.defineProperty(performance, 'getEntriesByType', { configurable: true, value: () => [] });
  (await import('../../src/content/agent')).initAgent('phone');
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const apply = (channel: string, seq: number, payload: any) => receiver({ type: 'vg/agent-apply', env: { channel, seq, epoch: 100, sourceViewportId: 'tablet', ts: 0, payload: {origin: location.origin, ...payload} } });
describe('real content agent', () => {
  it('returns a safe measurement failure instead of silently dropping a scan',async()=>{
    const metrics=await import('../../src/content/metrics');
    vi.spyOn(metrics,'collectMetrics').mockImplementation(()=>{throw new Error('controlled measurement failure');});
    receiver({type:'vg/agent-scan',scanId:'fixture-scan',touchViewportIds:['phone']});
    expect(send).toHaveBeenCalledWith(expect.objectContaining({type:'vg/scan-result',scanId:'fixture-scan',issues:[],errorCode:'MEASUREMENT_FAILED'}));
  });
  it('does not suppress the first user click after appearance initialization', () => {
    receiver({ type: 'vg/agent-do', cmd: 'setColorScheme', scheme: 'auto' });
    document.querySelector('button')!.click();
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'vg/agent-event', env: expect.objectContaining({ channel: 'click' }) }));
  });
  it('retries SPA URL changes after replay suppression expires', () => {
    vi.advanceTimersByTime(200);
    apply('input', 1, { selector: '#name', value: 'test' });
    history.pushState({}, '', '/spa-regression');
    vi.advanceTimersByTime(50);
    expect(send.mock.calls.some(([m]) => m.env?.channel === 'nav')).toBe(false);
    vi.advanceTimersByTime(250);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'vg/agent-event', env: expect.objectContaining({ channel: 'nav', payload: { url: location.href } }) }));
    history.replaceState({}, '', '/');
  });
  it('applies input through the native setter and dispatches events without rebroadcasting', () => {
    const input = document.querySelector('input')!;
    let observed = '';
    input.addEventListener('input', () => { observed = input.value; });
    apply('input', 1, { selector: '#name', value: 'ViewGrid' });
    expect(input.value).toBe('ViewGrid'); expect(observed).toBe('ViewGrid');
    expect(send.mock.calls.some(([m]) => m.type === 'vg/agent-event')).toBe(false);
  });
  it('replays keys to application event listeners', () => {
    const handler = vi.fn(); document.querySelector('button')!.addEventListener('keydown', handler);
    apply('key', 1, { selector: '#action', key: 'Enter', code: 'Enter', kind: 'keydown' });
    expect(handler).toHaveBeenCalledOnce();
  });
  it('does not execute javascript navigation envelopes', () => {
    apply('nav', 1, { url: 'javascript:window.hacked=true' });
    expect((window as any).hacked).toBeUndefined();
  });
  it('scan results include the request identifier and page context', () => {
    receiver({ type: 'vg/agent-scan', scanId: 'scan-123', touchViewportIds: [] });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'vg/scan-result', scanId: 'scan-123', viewportId: 'phone' }));
  });
});

describe('sensitive synchronization boundaries', () => {
  it('never captures password, card or one-time code values', () => {
    for (const attrs of ['type="password"', 'autocomplete="cc-number"', 'autocomplete="one-time-code"']) {
      const input = document.createElement('input'); input.setAttribute('id', 'secret');
      if (attrs.startsWith('type')) input.type='password'; else input.autocomplete=attrs.includes('cc-number')?'cc-number':'one-time-code';
      document.body.append(input);input.value='private';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));input.remove();
    }
    expect(send.mock.calls.some(([m]) => ['input','form','key'].includes(m.env?.channel))).toBe(false);
  });
  it('rejects cross-origin replay and sensitive targets', () => {
    const input=document.querySelector('input')!;
    apply('input',1,{selector:'#name',value:'secret',origin:'https://other.test'});expect(input.value).toBe('');
    input.type='password';apply('input',2,{selector:'#name',value:'secret'});expect(input.value).toBe('');
  });
});
