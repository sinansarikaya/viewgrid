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
  await import('../../src/content/agent');
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const apply = (channel: string, seq: number, payload: any) => receiver({ type: 'vg/agent-apply', env: { channel, seq, epoch: 100, sourceViewportId: 'tablet', ts: 0, payload } });
describe('real content agent', () => {
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
