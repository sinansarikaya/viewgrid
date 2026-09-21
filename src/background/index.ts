/**
 * ViewGrid background (Firefox event page / Chromium service worker).
 * Responsibilities (kept deliberately dumb — policy lives in the workspace):
 *  - workspace-tab registry (for tightly-scoped framing header relaxation)
 *  - agent frame registry (viewportId → frameId) + message routing
 *  - capture requests (tabs.captureTab w/ captureVisibleTab fallback)
 *  - context menus + global command
 */
import { b } from '../platform/browser';

const workspaceTabs = new Set<number>();
/** tabId → viewportId → frameId */
const agentFrames = new Map<number, Map<string, number>>();

function isWorkspaceSender(sender: any): boolean {
  const url: string | undefined = sender?.url ?? sender?.origin;
  return !!url && url.startsWith(b.runtime.getURL('workspace.html').split('?')[0]!);
}

async function routeToAgents(tabId: number, msg: unknown, onlyViewports?: string[] | 'all') {
  const frames = agentFrames.get(tabId);
  if (!frames) return;
  for (const [viewportId, frameId] of frames) {
    if (Array.isArray(onlyViewports) && !onlyViewports.includes(viewportId)) continue;
    try {
      await b.tabs.sendMessage(tabId, msg, { frameId });
    } catch {
      frames.delete(viewportId); // stale frame
    }
  }
}

// —— Framing policy: strip XFO for sub_frames OF WORKSPACE TABS only ——
// (SECURITY.md §4: never touches main_frame or non-workspace traffic.)
if (b.webRequest?.onHeadersReceived && b.webRequest?.OnHeadersReceivedOptions) {
  try {
    b.webRequest.onHeadersReceived.addListener(
      (details: any) => {
        if (details.type !== 'sub_frame') return {};
        if (!workspaceTabs.has(details.tabId)) return {};
        const headers = (details.responseHeaders ?? []).filter((h: any) => {
          const n = h.name.toLowerCase();
          return n !== 'x-frame-options' && n !== 'frame-options';
        });
        // Rewrite CSP frame-ancestors (keep other directives).
        for (const h of headers) {
          if (h.name.toLowerCase() === 'content-security-policy' && typeof h.value === 'string') {
            h.value = h.value
              .replace(/frame-ancestors[^;]*/i, "frame-ancestors 'self' moz-extension: chrome-extension:")
              .replace(/;\s*$/, '');
          }
        }
        return { responseHeaders: headers };
      },
      { urls: ['<all_urls>'], types: ['sub_frame'] },
      ['blocking', 'responseHeaders'],
    );
  } catch (e) {
    console.warn('[viewgrid] framing policy unavailable:', e);
  }
}

b.runtime.onMessage.addListener((msg: any, sender: any) => {
  if (!msg || typeof msg.type !== 'string') return undefined;

  switch (msg.type) {
    case 'vg/workspace-hello': {
      const tabId = sender?.tab?.id;
      if (typeof tabId === 'number') {
        workspaceTabs.add(tabId);
        return Promise.resolve({ ok: true, tabId });
      }
      return Promise.resolve({ ok: false });
    }

    case 'vg/inject': {
      const tabId = sender?.tab?.id;
      if (typeof tabId !== 'number' || !b.scripting) return Promise.resolve({ ok: false });
      return b.scripting
        .executeScript({ target: { tabId, allFrames: true }, files: ['content/agent.js'] })
        .then(() => ({ ok: true }))
        .catch((e: Error) => ({ ok: false, error: e.message }));
    }

    case 'vg/agent-hello': {
      const tabId = sender?.tab?.id;
      const frameId = sender?.frameId;
      if (typeof tabId !== 'number' || typeof frameId !== 'number') return Promise.resolve({ ok: false });
      if (!agentFrames.has(tabId)) agentFrames.set(tabId, new Map());
      agentFrames.get(tabId)!.set(String(msg.viewportId), frameId);
      return Promise.resolve({ ok: true, frameId });
    }

    case 'vg/sync-apply': {
      // Fan-out to every agent frame of the workspace tab EXCEPT the source viewport.
      const tabId = sender?.tab?.id;
      if (typeof tabId !== 'number') return Promise.resolve({ ok: false });
      const frames = agentFrames.get(tabId);
      if (frames) {
        for (const [viewportId, frameId] of frames) {
          if (viewportId === msg.excludeViewportId) continue;
          b.tabs.sendMessage(tabId, { type: 'vg/agent-apply', env: msg.env }, { frameId }).catch(() => {});
        }
      }
      return Promise.resolve({ ok: true });
    }

    case 'vg/agent-cmd': {
      const tabId = sender?.tab?.id;
      if (typeof tabId !== 'number') return Promise.resolve({ ok: false });
      const frames = agentFrames.get(tabId);
      if (frames) {
        for (const [viewportId, frameId] of frames) {
          if (Array.isArray(msg.target) && !msg.target.includes(viewportId)) continue;
          b.tabs
            .sendMessage(tabId, { type: 'vg/agent-do', cmd: msg.cmd, url: msg.url }, { frameId })
            .catch(() => {});
        }
      }
      return Promise.resolve({ ok: true });
    }

    case 'vg/scan-run': {
      const tabId = sender?.tab?.id;
      if (typeof tabId !== 'number') return Promise.resolve({ ok: false });
      void routeToAgents(tabId, { type: 'vg/agent-scan' });
      return Promise.resolve({ ok: true });
    }

    case 'vg/capture': {
      const tabId = sender?.tab?.id;
      if (typeof tabId !== 'number') return Promise.resolve({ ok: false, error: 'no tab' });
      const opts = { format: msg.format ?? 'png', quality: msg.quality ?? 92 };
      const p: Promise<string> =
        b.tabs.captureTab?.(tabId, opts) ?? b.tabs.captureVisibleTab?.(undefined, opts) ?? Promise.reject(new Error('capture unsupported'));
      return p.then((dataUrl) => ({ ok: true, dataUrl })).catch((e: Error) => ({ ok: false, error: e.message }));
    }

    default:
      return undefined;
  }
});

// —— Launcher helpers ——
async function openWorkspace(url?: string) {
  const target = b.runtime.getURL('workspace.html') + (url ? `?url=${encodeURIComponent(url)}` : '');
  await b.tabs.create({ url: target, active: true });
}

if (b.commands?.onCommand) {
  b.commands.onCommand.addListener((command: string) => {
    if (command === 'open-workspace') void openWorkspace();
  });
}

if (b.menus) {
  const setupMenus = () => {
    void (b.menus as any).removeAll?.();
    b.menus!.create({ id: 'vg-open-page', title: 'Open page in ViewGrid', contexts: ['page'] });
    b.menus!.create({ id: 'vg-open-link', title: 'Open link in ViewGrid', contexts: ['link'] });
  };
  setupMenus();
  b.menus.onClicked.addListener((info: any) => {
    const url = info.linkUrl ?? info.pageUrl;
    if (info.menuItemId === 'vg-open-page' || info.menuItemId === 'vg-open-link') void openWorkspace(url);
  });
}

export {};
