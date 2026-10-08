import { b } from '../platform/browser';
import { isWorkspaceUrl, relaxFirefoxHeaders, safeHttpUrl, workspaceRule } from '../core/security/framing';
import { uncachedHeaders, workerRemovalOptions } from '../core/security/preview';

const workspaceUrl = b.runtime.getURL('workspace.html');
const workspaceTabs = new Set<number>();
const agents = new Map<number, Map<string, number>>();
let hydrated: Promise<void> | undefined;
let ruleQueue = Promise.resolve();
const preparing = new Map<string, Promise<void>>();

async function preparePreview(tabId: number, url: string) {
  const firefox = !!b.webRequest?.onHeadersReceived;
  const options = workerRemovalOptions(url, firefox);
  const key = `${tabId}:${new URL(url).origin}`;
  let task = preparing.get(key);
  if (!task) {
    task = (async () => {
      await syncRules();
      if (!b.browsingData) throw new Error('Reload ViewGrid and allow the browsingData permission to prepare network previews.');
      // An existing worker can block the document BEFORE its content agent runs.
      // Only remove this selected site's worker registrations, never all sites.
      await b.browsingData.removeServiceWorkers(options);
    })();
    preparing.set(key, task);
    void task.finally(() => preparing.delete(key)).catch(() => {});
  }
  await task;
}

function syncRules() {
  ruleQueue = ruleQueue.catch(() => {}).then(async () => {
    if (!b.declarativeNetRequest) return;
    // Remove the globally-scoped rule left behind by 1.0.1, even on upgrade.
    await b.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1001] });
    await b.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [1001], addRules: b.webRequest?.onHeadersReceived ? [] : workspaceRule([...workspaceTabs]),
    });
  });
  return ruleQueue;
}
async function persist() {
  await b.storage?.session?.set({ agentFrames: [...agents].flatMap(([tab, frames]) => [...frames].map(([vp, frame]) => [tab, vp, frame])) });
}
async function hydrate() {
  return hydrated ??= (async () => {
    const tabs = await b.tabs.query({});
    for (const tab of tabs) if (tab.id !== undefined && isWorkspaceUrl(tab.url, workspaceUrl)) workspaceTabs.add(tab.id);
    const saved = await b.storage?.session?.get('agentFrames');
    if (Array.isArray(saved?.agentFrames)) for (const [tab, vp, frame] of saved.agentFrames) {
      if (!workspaceTabs.has(tab) || typeof frame !== 'number') continue;
      if (!agents.has(tab)) agents.set(tab, new Map());
      agents.get(tab)!.set(vp, frame);
    }
    await syncRules();
  })();
}
void hydrate().catch(console.error);

b.tabs.onUpdated?.addListener((id, info, tab) => {
  if (!info.url) return;
  if (isWorkspaceUrl(info.url || tab.url, workspaceUrl)) workspaceTabs.add(id);
  else { workspaceTabs.delete(id); agents.delete(id); }
  void syncRules();
  void persist();
});
b.tabs.onRemoved?.addListener(id => {
  workspaceTabs.delete(id); agents.delete(id);
  void syncRules(); void persist();
});

if (b.webRequest?.onHeadersReceived) {
  b.webRequest.onHeadersReceived.addListener((details: any) => {
    if (details.type !== 'sub_frame' || details.parentFrameId !== 0 || !workspaceTabs.has(details.tabId)) return {};
    return { responseHeaders: uncachedHeaders(relaxFirefoxHeaders(details.responseHeaders ?? []), true) };
  }, { urls: ['<all_urls>'] }, ['blocking', 'responseHeaders']);
  b.webRequest.onBeforeSendHeaders.addListener((details: any) => {
    if (details.type !== 'sub_frame' || details.parentFrameId !== 0 || !workspaceTabs.has(details.tabId)) return {};
    return { requestHeaders: uncachedHeaders(details.requestHeaders ?? []) };
  }, { urls: ['<all_urls>'], types: ['sub_frame'] }, ['blocking', 'requestHeaders']);
}

async function workspaceTab(msg: any, sender: any): Promise<number | undefined> {
  if (!isWorkspaceUrl(sender.url, workspaceUrl)) return undefined;
  const id = sender.tab?.id ?? msg.tabId;
  if (typeof id !== 'number') return undefined;
  const tab = await b.tabs.get(id).catch(() => null);
  return tab && isWorkspaceUrl(tab.url, workspaceUrl) ? id : undefined;
}
async function route(tabId: number, target: string[] | 'all', message: any) {
  const entries = [...(agents.get(tabId) ?? [])].filter(([vp]) => target === 'all' || target.includes(vp));
  const results = await Promise.all(entries.map(async ([viewportId, frameId]) => {
    try { await b.tabs.sendMessage(tabId, message, { frameId }); return viewportId; }
    catch { agents.get(tabId)?.delete(viewportId); return null; }
  }));
  return results.filter((id): id is string => id !== null);
}

b.runtime.onMessage.addListener((msg: any, sender: any) => {
  // Do not answer agent events/scan replies: the workspace listener owns them.
  if (!msg?.type || ['vg/agent-event', 'vg/scan-result'].includes(msg.type)) return;
  return (async () => {
    await hydrate();
    if (msg.type === 'vg/open-workspace-tab') {
      await openWorkspace(safeHttpUrl(msg.url) ? msg.url : undefined); return { ok: true };
    }
    if (msg.type === 'vg/agent-hello') {
      const id = sender.tab?.id, frame = sender.frameId;
      if (typeof id !== 'number' || !workspaceTabs.has(id) || typeof frame !== 'number' || frame <= 0) return { ok: false };
      if (!agents.has(id)) agents.set(id, new Map());
      agents.get(id)!.set(String(msg.viewportId), frame);
      await persist(); return { ok: true, frameId: frame };
    }
    const tabId = await workspaceTab(msg, sender);
    if (tabId === undefined) return { ok: false, error: 'Unverified workspace' };
    if (msg.type === 'vg/workspace-hello') {
      workspaceTabs.add(tabId); await syncRules(); return { ok: true, tabId };
    }
    if (msg.type === 'vg/prepare-preview') {
      if (!safeHttpUrl(msg.url)) return { ok: false, error: 'Invalid preview URL' };
      try { await preparePreview(tabId, msg.url); return { ok: true }; }
      catch (error) { return { ok: false, error: (error as Error).message }; }
    }
    if (msg.type === 'vg/sync-apply') {
      const source = String(msg.env?.sourceViewportId);
      if (!agents.get(tabId)?.has(source)) return { ok: false };
      const target = [...(agents.get(tabId)?.keys() ?? [])].filter(id => id !== source);
      await route(tabId, target, { type: 'vg/agent-apply', env: msg.env }); return { ok: true };
    }
    if (msg.type === 'vg/agent-cmd') {
      const commands = ['reload', 'hardReload', 'back', 'forward', 'goto', 'scrollToTop', 'setColorScheme', 'setTouchCursor', 'highlight'];
      if (!commands.includes(msg.cmd)) return { ok: false, error: 'Unknown command' };
      if (msg.cmd === 'goto' && !safeHttpUrl(msg.url)) return { ok: false, error: 'Invalid URL' };
      const reached = await route(tabId, Array.isArray(msg.target) ? msg.target : 'all', { ...msg, type: 'vg/agent-do' });
      return { ok: reached.length > 0, reached };
    }
    if (msg.type === 'vg/scan-run') {
      const reached = await route(tabId, Array.isArray(msg.target) ? msg.target : 'all', { type: 'vg/agent-scan', scanId: msg.scanId, touchViewportIds: msg.touchViewportIds });
      return { ok: true, reached };
    }
    if (msg.type === 'vg/hard-reload') {
      await b.tabs.reload(tabId, { bypassCache: true }); return { ok: true };
    }
    if (msg.type === 'vg/capture') {
      const tab = await b.tabs.get(tabId);
      if (!tab.active) return { ok: false, error: 'Keep the ViewGrid tab active during capture.' };
      const opts = msg.format === 'jpeg' ? { format: 'jpeg', quality: 92 } : { format: 'png' };
      try {
        const dataUrl = await b.tabs.captureVisibleTab!(tab.windowId, opts);
        return { ok: true, dataUrl };
      } catch (e) { return { ok: false, error: (e as Error).message }; }
    }
    return { ok: false, error: 'Unknown request' };
  })();
});

async function openWorkspace(url?: string) {
  const tab = await b.tabs.create({ url: workspaceUrl + (url ? `?url=${encodeURIComponent(url)}` : ''), active: true });
  if (tab.id !== undefined) { workspaceTabs.add(tab.id); await syncRules(); }
}
b.action?.onClicked.addListener(tab => { void openWorkspace(safeHttpUrl(tab.url) ? tab.url : undefined); });
b.commands?.onCommand.addListener(command => {
  if ((command === '_execute_action' || command === '_execute_browser_action')) void b.tabs.query({ active: true, currentWindow: true }).then(tabs => openWorkspace(safeHttpUrl(tabs[0]?.url) ? tabs[0]!.url : undefined));
});
if (b.menus) {
  const setup = async () => {
    await b.menus!.removeAll();
    b.menus!.create({ id: 'vg-open-page', title: 'Open page in ViewGrid', contexts: ['page'] });
    b.menus!.create({ id: 'vg-open-link', title: 'Open link in ViewGrid', contexts: ['link'] });
  };
  b.runtime.onInstalled?.addListener(() => { void setup(); });
  b.menus.onClicked.addListener((info, tab) => { void openWorkspace(safeHttpUrl(info.linkUrl) ? info.linkUrl : safeHttpUrl(tab?.url) ? tab.url : undefined); });
}
