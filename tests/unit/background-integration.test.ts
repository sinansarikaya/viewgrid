import { describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => {
  const rules = vi.fn(async (..._args: any[]) => {}), dynamic = vi.fn(async (..._args: any[]) => {});
  const listeners: { message?: (msg: any, sender: any) => any; updated?: (...args: any[]) => any; removed?: (id: number) => any } = {};
  const tabs = [{ id: 42, url: 'chrome-extension://ours/workspace.html', active: true, windowId: 1 }, { id: 99, url: 'https://ordinary.test/workspace.html', active: true, windowId: 1 }];
  return { rules, dynamic, listeners, tabs, reload: vi.fn(async (..._args: any[]) => {}) };
});
vi.mock('../../src/platform/browser', () => ({ b: {
  runtime: { getURL: (p: string) => `chrome-extension://ours/${p}`, onMessage: { addListener: (fn: any) => { mock.listeners.message = fn; } } },
  tabs: { query: async () => mock.tabs, get: async (id: number) => mock.tabs.find(t => t.id === id), reload: mock.reload, onUpdated: { addListener: (fn: any) => { mock.listeners.updated = fn; } }, onRemoved: { addListener: (fn: any) => { mock.listeners.removed = fn; } } },
  storage: { session: { get: async () => ({}), set: async () => {} } },
  declarativeNetRequest: { updateDynamicRules: mock.dynamic, updateSessionRules: mock.rules },
} }));
describe('actual background entrypoint', () => {
  it('removes legacy global rules and installs only verified workspace rules', async () => {
    await import('../../src/background/index');
    const result = await mock.listeners.message!({ type: 'vg/workspace-hello', tabId: 42 }, { url: mock.tabs[0]!.url });
    expect(result.ok).toBe(true);
    expect(mock.dynamic).toHaveBeenCalledWith({ removeRuleIds: [1001] });
    expect(mock.rules.mock.calls.at(-1)?.[0]).toMatchObject({ addRules: [{ condition: { tabIds: [42], initiatorDomains: ['ours'] } }] });
    expect(await mock.listeners.message!({ type: 'vg/workspace-hello', tabId: 99 }, { url: mock.tabs[1]!.url })).toMatchObject({ ok: false });
  });
  it('uses browser bypass-cache reload without a site data clearing API', async () => {
    const result = await mock.listeners.message!({ type: 'vg/hard-reload', tabId: 42 }, { url: mock.tabs[0]!.url });
    expect(result.ok).toBe(true); expect(mock.reload).toHaveBeenCalledWith(42, { bypassCache: true });
  });
  it('rejects content-script attempts at privileged workspace commands', async () => {
    expect(await mock.listeners.message!({ type: 'vg/hard-reload', tabId: 42 }, { url: 'https://fixture.test', tab: { id: 42 }, frameId: 3 })).toMatchObject({ ok: false });
  });
});
