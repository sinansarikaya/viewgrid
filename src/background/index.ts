/**
 * ViewGrid background (Firefox event page / Chromium service worker).
 * Responsibilities:
 *  - workspace-tab registry (persisted across MV3 service worker suspensions via storage.session)
 *  - framing header relaxation:
 *      * Chromium: declarativeNetRequest session rules (restricted to workspace tabIds & sub_frame)
 *      * Firefox: webRequest.onHeadersReceived blocking listener
 *  - agent frame registry (viewportId → frameId) + message routing
 *  - capture requests (tabs.captureVisibleTab / tabs.captureTab)
 *  - context menus + global command
 */
import { b } from '../platform/browser';

// —— In-Memory Cache (Hydrated from storage.session on Service Worker Wakeup) ——
const workspaceTabs = new Set<number>();
/** tabId → viewportId → frameId */
const agentFrames = new Map<number, Map<string, number>>();
/** `${tabId}:${frameId}` → userAgent */
const frameUserAgents = new Map<string, string>();
const viewportUserAgents = new Map<string, string>();

const wsUrlBase = b.runtime.getURL('workspace.html').split('?')[0]!;
const DNR_WORKSPACE_RULE_ID = 1001;

let hydrationPromise: Promise<void> | null = null;

/**
 * Ensure state is hydrated from storage.session if service worker was suspended.
 * Also prunes stale tabs that were closed while worker was asleep.
 */
async function ensureHydrated(): Promise<void> {
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    try {
      const sess = await b.storage?.session?.get(['workspaceTabs', 'agentFrames', 'frameUAs', 'viewportUAs']);
      if (sess) {
        if (Array.isArray(sess.workspaceTabs)) {
          for (const id of sess.workspaceTabs) {
            if (typeof id === 'number') workspaceTabs.add(id);
          }
        }
        if (Array.isArray(sess.agentFrames)) {
          for (const item of sess.agentFrames) {
            if (Array.isArray(item) && item.length === 3) {
              const [tabId, vpId, fId] = item;
              if (typeof tabId === 'number' && typeof fId === 'number') {
                if (!agentFrames.has(tabId)) agentFrames.set(tabId, new Map());
                agentFrames.get(tabId)!.set(String(vpId), fId);
              }
            }
          }
        }
        if (sess.frameUAs && typeof sess.frameUAs === 'object') {
          for (const [k, v] of Object.entries(sess.frameUAs)) {
            frameUserAgents.set(k, String(v));
          }
        }
        if (sess.viewportUAs && typeof sess.viewportUAs === 'object') {
          for (const [k, v] of Object.entries(sess.viewportUAs)) {
            viewportUserAgents.set(k, String(v));
          }
        }
      }
    } catch {}

    // Verify currently open browser tabs to purge stale closed tabs
    try {
      const openTabs = await b.tabs.query({});
      const openTabIds = new Set<number>(
        openTabs.map((t) => t.id).filter((id): id is number => typeof id === 'number'),
      );

      let changed = false;
      for (const id of Array.from(workspaceTabs)) {
        if (!openTabIds.has(id)) {
          workspaceTabs.delete(id);
          agentFrames.delete(id);
          changed = true;
        }
      }

      // Check all active tabs in case any is an untracked workspace
      for (const t of openTabs) {
        if (t?.id && t?.url && t.url.startsWith(wsUrlBase) && !workspaceTabs.has(t.id)) {
          workspaceTabs.add(t.id);
          changed = true;
        }
      }

      if (changed) {
        await persistState();
        await syncDnrRules();
      }
    } catch {}
  })();

  return hydrationPromise;
}

/**
 * Persist current state to storage.session for MV3 Service Worker lifecycle safety.
 */
async function persistState(): Promise<void> {
  try {
    const serializedAgentFrames: [number, string, number][] = [];
    for (const [tabId, map] of agentFrames.entries()) {
      for (const [vpId, fId] of map.entries()) {
        serializedAgentFrames.push([tabId, vpId, fId]);
      }
    }

    const frameUAsObj: Record<string, string> = {};
    for (const [k, v] of frameUserAgents.entries()) frameUAsObj[k] = v;

    const viewportUAsObj: Record<string, string> = {};
    for (const [k, v] of viewportUserAgents.entries()) viewportUAsObj[k] = v;

    await b.storage?.session?.set({
      workspaceTabs: Array.from(workspaceTabs),
      agentFrames: serializedAgentFrames,
      frameUAs: frameUAsObj,
      viewportUAs: viewportUAsObj,
    });
  } catch {}
}

/**
 * Chromium: DeclarativeNetRequest session rule synchronization.
 * Strips X-Frame-Options, Frame-Options, and Content-Security-Policy
 * for sub_frame requests initiated inside workspace tabs.
 */
async function syncDnrRules(): Promise<void> {
  if (!b.declarativeNetRequest?.updateSessionRules) return;
  try {
    const tabIds = Array.from(workspaceTabs).filter((id): id is number => typeof id === 'number');

    const rule: any = {
      id: DNR_WORKSPACE_RULE_ID,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          { header: 'x-frame-options', operation: 'remove' },
          { header: 'frame-options', operation: 'remove' },
          { header: 'content-security-policy', operation: 'remove' },
          { header: 'content-security-policy-report-only', operation: 'remove' },
          { header: 'x-content-security-policy', operation: 'remove' },
          { header: 'x-webkit-csp', operation: 'remove' },
          { header: 'cross-origin-opener-policy', operation: 'remove' },
          { header: 'cross-origin-embedder-policy', operation: 'remove' },
          { header: 'cross-origin-resource-policy', operation: 'remove' },
        ],
      },
      condition: {
        resourceTypes: ['sub_frame'],
        ...(tabIds.length > 0 ? { tabIds } : {}),
      },
    };

    await b.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [DNR_WORKSPACE_RULE_ID],
      addRules: [rule],
    });
  } catch (e) {
    console.warn('[viewgrid] failed to sync DNR session rules:', e);
  }
}

// Immediately initialize DNR rules at background startup
void syncDnrRules();

function checkAndTrackWorkspace(tab: any) {
  if (tab?.id && tab?.url && tab.url.startsWith(wsUrlBase)) {
    if (!workspaceTabs.has(tab.id)) {
      workspaceTabs.add(tab.id);
      void persistState();
      void syncDnrRules();
    }
  }
}

// —— Tab Lifecycle Event Listeners ——
try {
  b.tabs.query({}).then((tabs: any[]) => {
    tabs?.forEach(checkAndTrackWorkspace);
  });
  b.tabs.onCreated?.addListener((tab: any) => {
    checkAndTrackWorkspace(tab);
  });
  b.tabs.onUpdated?.addListener((_id: number, _info: any, tab: any) => {
    checkAndTrackWorkspace(tab);
  });
  b.tabs.onRemoved?.addListener((tabId: number) => {
    if (workspaceTabs.has(tabId) || agentFrames.has(tabId)) {
      workspaceTabs.delete(tabId);
      agentFrames.delete(tabId);
      // Clean up frame UAs for this tab
      for (const key of Array.from(frameUserAgents.keys())) {
        if (key.startsWith(`${tabId}:`)) frameUserAgents.delete(key);
      }
      void persistState();
      void syncDnrRules();
    }
  });
} catch {}

async function routeToAgents(tabId: number, msg: unknown, onlyViewports?: string[] | 'all') {
  await ensureHydrated();
  const frames = agentFrames.get(tabId);
  if (!frames) return;
  for (const [viewportId, frameId] of frames) {
    if (Array.isArray(onlyViewports) && !onlyViewports.includes(viewportId)) continue;
    try {
      await b.tabs.sendMessage(tabId, msg, { frameId });
    } catch {
      frames.delete(viewportId); // stale frame
      void persistState();
    }
  }
}

// —— User-Agent spoofing & cookie preservation for workspace requests (Firefox webRequest) ——
if (b.webRequest?.onBeforeSendHeaders) {
  try {
    b.webRequest.onBeforeSendHeaders.addListener(
      async (details: any) => {
        const isSubFrame = details.type === 'sub_frame';
        const isFromWorkspace =
          (typeof details.tabId === 'number' && workspaceTabs.has(details.tabId)) ||
          (details.documentUrl && wsUrlBase && details.documentUrl.startsWith(wsUrlBase)) ||
          (details.originUrl && wsUrlBase && details.originUrl.startsWith(wsUrlBase)) ||
          (details.documentUrl && details.documentUrl.startsWith('moz-extension://') && details.documentUrl.includes('/workspace.html')) ||
          (details.originUrl && details.originUrl.startsWith('moz-extension://') && details.originUrl.includes('/workspace.html')) ||
          details.frameAncestors?.some(
            (a: any) =>
              (wsUrlBase && a.url?.startsWith(wsUrlBase)) ||
              (a.url?.startsWith('moz-extension://') && a.url?.includes('/workspace.html')),
          );

        const shouldHandle = isSubFrame && isFromWorkspace;
        if (!shouldHandle) return {};

        // Auto-register workspace tab if request is identified as coming from workspace
        if (isFromWorkspace && typeof details.tabId === 'number' && details.tabId > 0 && !workspaceTabs.has(details.tabId)) {
          workspaceTabs.add(details.tabId);
          void persistState();
          void syncDnrRules();
        }

        let headers = details.requestHeaders ?? [];

        // 1. UA spoofing per viewport
        const key = `${details.tabId ?? -1}:${details.frameId ?? -1}`;
        const ua = frameUserAgents.get(key);
        if (ua) {
          headers = headers.filter((h: any) => h.name.toLowerCase() !== 'user-agent');
          headers.push({ name: 'User-Agent', value: ua });
        }

        // 2. Bypass Sec-Fetch cross-site restrictions that cause CSRF / auth rejections
        headers = headers.filter((h: any) => {
          const n = h.name.toLowerCase();
          return n !== 'sec-fetch-site' && n !== 'sec-fetch-dest' && n !== 'sec-fetch-mode';
        });
        headers.push({ name: 'Sec-Fetch-Site', value: 'same-origin' });
        headers.push({ name: 'Sec-Fetch-Dest', value: details.type === 'sub_frame' ? 'document' : 'empty' });
        headers.push({ name: 'Sec-Fetch-Mode', value: 'navigate' });

        // 3. Cookie preservation: Merge user cookies from browser store so login sessions persist
        try {
          if (b.cookies?.getAll && details.url) {
            const cookies = await b.cookies.getAll({ url: details.url });
            if (cookies && cookies.length > 0) {
              const existingCookieHeader = headers.find((h: any) => h.name.toLowerCase() === 'cookie');
              const cookieMap = new Map<string, string>();
              if (existingCookieHeader?.value) {
                existingCookieHeader.value.split(';').forEach((p: string) => {
                  const idx = p.indexOf('=');
                  if (idx > 0) {
                    cookieMap.set(p.slice(0, idx).trim(), p.slice(idx + 1).trim());
                  }
                });
              }
              for (const c of cookies) {
                if (!cookieMap.has(c.name)) {
                  cookieMap.set(c.name, c.value);
                }
              }
              const merged = Array.from(cookieMap.entries())
                .map(([k, v]) => `${k}=${v}`)
                .join('; ');
              headers = headers.filter((h: any) => h.name.toLowerCase() !== 'cookie');
              headers.push({ name: 'Cookie', value: merged });
            }
          }
        } catch (err) {
          console.warn('[viewgrid] cookie bridge error:', err);
        }

        return { requestHeaders: headers };
      },
      { urls: ['<all_urls>'] },
      ['blocking', 'requestHeaders'],
    );
  } catch (e) {
    console.warn('[viewgrid] webRequest onBeforeSendHeaders unavailable:', e);
  }
}

// —— Framing policy & cookie persistence (Firefox webRequest) ——
if (b.webRequest?.onHeadersReceived) {
  try {
    b.webRequest.onHeadersReceived.addListener(
      (details: any) => {
        const isSubFrame = details.type === 'sub_frame';
        const isFromWorkspace =
          (typeof details.tabId === 'number' && workspaceTabs.has(details.tabId)) ||
          (details.documentUrl && wsUrlBase && details.documentUrl.startsWith(wsUrlBase)) ||
          (details.originUrl && wsUrlBase && details.originUrl.startsWith(wsUrlBase)) ||
          (details.documentUrl && details.documentUrl.startsWith('moz-extension://') && details.documentUrl.includes('/workspace.html')) ||
          (details.originUrl && details.originUrl.startsWith('moz-extension://') && details.originUrl.includes('/workspace.html')) ||
          details.frameAncestors?.some(
            (a: any) =>
              (wsUrlBase && a.url?.startsWith(wsUrlBase)) ||
              (a.url?.startsWith('moz-extension://') && a.url?.includes('/workspace.html')),
          );

        const shouldUnblock = isSubFrame && isFromWorkspace;
        if (!shouldUnblock) return {};

        // Auto-learn tabId for subsequent sub_frame redirects
        if (isFromWorkspace && typeof details.tabId === 'number' && details.tabId > 0 && !workspaceTabs.has(details.tabId)) {
          workspaceTabs.add(details.tabId);
          void persistState();
          void syncDnrRules();
        }

        // Headers that prevent framing or cross-origin embedding inside ViewGrid
        const blockedHeaders = new Set([
          'x-frame-options',
          'frame-options',
          'content-security-policy',
          'content-security-policy-report-only',
          'x-content-security-policy',
          'x-webkit-csp',
          'cross-origin-opener-policy',
          'cross-origin-embedder-policy',
          'cross-origin-resource-policy',
        ]);

        const headers = (details.responseHeaders ?? [])
          .filter((h: any) => !blockedHeaders.has(h.name.toLowerCase()))
          .map((h: any) => {
            // Rewrite SameSite=Lax/Strict in Set-Cookie to SameSite=None; Secure; Partitioned
            if (h.name.toLowerCase() === 'set-cookie' && typeof h.value === 'string') {
              let cookieVal = h.value;
              if (/samesite=(lax|strict)/i.test(cookieVal)) {
                cookieVal = cookieVal.replace(/samesite=(lax|strict)/gi, 'SameSite=None; Partitioned');
              } else if (!/samesite=/i.test(cookieVal)) {
                cookieVal += '; SameSite=None; Partitioned';
              }
              if (!/secure/i.test(cookieVal)) {
                cookieVal += '; Secure';
              }
              return { name: h.name, value: cookieVal };
            }
            return h;
          });

        return { responseHeaders: headers };
      },
      { urls: ['<all_urls>'] },
      ['blocking', 'responseHeaders'],
    );
  } catch (e) {
    console.warn('[viewgrid] Firefox framing policy unavailable:', e);
  }
}

async function resolveTabId(sender: any): Promise<number | undefined> {
  if (typeof sender?.tab?.id === 'number') return sender.tab.id;
  await ensureHydrated();
  if (workspaceTabs.size > 0) {
    const first = Array.from(workspaceTabs)[0];
    if (typeof first === 'number') return first;
  }
  try {
    const tabs = await b.tabs.query({ active: true, currentWindow: true });
    if (tabs?.[0]?.id) return tabs[0].id;
  } catch {}
  return undefined;
}

// —— Extension Messaging Hub ——
b.runtime.onMessage.addListener(async (msg: any, sender: any) => {
  if (!msg || typeof msg.type !== 'string') return undefined;

  await ensureHydrated();

  switch (msg.type) {
    case 'vg/open-workspace-tab': {
      const url = typeof msg.url === 'string' && !msg.url.startsWith('chrome://') && !msg.url.startsWith('about:') && !msg.url.startsWith('chrome-extension://') && !msg.url.startsWith('moz-extension://')
        ? msg.url
        : undefined;
      void openWorkspace(url);
      return { ok: true };
    }

    case 'vg/workspace-hello': {
      const explicitTabId = typeof msg.tabId === 'number' && msg.tabId > 0 ? msg.tabId : undefined;
      const tabId = explicitTabId ?? (await resolveTabId(sender));
      if (typeof tabId === 'number') {
        workspaceTabs.add(tabId);
        await persistState();
        await syncDnrRules();
        return { ok: true, tabId };
      }
      return { ok: true };
    }

    case 'vg/clear-browser-cache': {
      try {
        if ((b as any).browsingData?.removeCache) {
          await (b as any).browsingData.removeCache({ since: 0 });
        }
      } catch {}
      return { ok: true };
    }

    case 'vg/set-device-config': {
      if (msg.viewportId && msg.userAgent) {
        viewportUserAgents.set(String(msg.viewportId), String(msg.userAgent));
        const tabId = await resolveTabId(sender);
        if (typeof tabId === 'number') {
          const frameId = agentFrames.get(tabId)?.get(String(msg.viewportId));
          if (typeof frameId === 'number') {
            frameUserAgents.set(`${tabId}:${frameId}`, String(msg.userAgent));
          }
        }
        await persistState();
      }
      return Promise.resolve({ ok: true });
    }

    case 'vg/agent-hello': {
      const tabId = sender?.tab?.id;
      const frameId = sender?.frameId;
      if (typeof tabId !== 'number' || typeof frameId !== 'number') return Promise.resolve({ ok: false });
      if (!agentFrames.has(tabId)) agentFrames.set(tabId, new Map());
      agentFrames.get(tabId)!.set(String(msg.viewportId), frameId);

      const ua = viewportUserAgents.get(String(msg.viewportId));
      if (ua) {
        frameUserAgents.set(`${tabId}:${frameId}`, ua);
      }
      await persistState();
      return Promise.resolve({ ok: true, frameId, userAgent: ua });
    }

    case 'vg/sync-apply': {
      // Fan-out to every agent frame of the workspace tab EXCEPT the source viewport.
      const tabId = await resolveTabId(sender);
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
      const tabId = await resolveTabId(sender);
      if (typeof tabId !== 'number') return Promise.resolve({ ok: false });
      const frames = agentFrames.get(tabId);
      if (frames) {
        for (const [viewportId, frameId] of frames) {
          if (Array.isArray(msg.target) && !msg.target.includes(viewportId)) continue;
          b.tabs
            .sendMessage(tabId, { ...msg, type: 'vg/agent-do' }, { frameId })
            .catch(() => {});
        }
      }
      return Promise.resolve({ ok: true });
    }

    case 'vg/scan-run': {
      const tabId = await resolveTabId(sender);
      if (typeof tabId !== 'number') return Promise.resolve({ ok: false });
      void routeToAgents(tabId, { type: 'vg/agent-scan' });
      return Promise.resolve({ ok: true });
    }

    case 'vg/capture': {
      let tabId = sender?.tab?.id;
      let windowId = sender?.tab?.windowId;

      if (typeof tabId !== 'number' || typeof windowId !== 'number') {
        try {
          const tabs = await (b.tabs as any).query({ active: true, currentWindow: true });
          if (tabs?.[0]) {
            if (typeof tabId !== 'number') tabId = tabs[0].id;
            if (typeof windowId !== 'number') windowId = tabs[0].windowId;
          }
        } catch {}
      }

      if (typeof windowId !== 'number') {
        try {
          const currentWin = await (b as any).windows?.getCurrent?.();
          if (typeof currentWin?.id === 'number') windowId = currentWin.id;
        } catch {}
      }

      const format = msg.format === 'jpeg' ? 'jpeg' : 'png';
      const opts: any = { format };
      if (format === 'jpeg') {
        opts.quality = msg.quality ?? 92;
      }

      let dataUrl: string | undefined;
      let lastErr = '';

      // 1. Try captureVisibleTab with valid windowId (if integer)
      if (typeof windowId === 'number') {
        try {
          dataUrl = await (b.tabs as any).captureVisibleTab(windowId, opts);
        } catch (e1: any) {
          lastErr = e1?.message || String(e1);
        }
      }

      // 2. Try captureVisibleTab with ONLY options
      if (!dataUrl && (b.tabs as any).captureVisibleTab) {
        try {
          dataUrl = await (b.tabs as any).captureVisibleTab(opts);
        } catch (e2: any) {
          lastErr = e2?.message || String(e2);
        }
      }

      // 3. Try captureVisibleTab with NO arguments
      if (!dataUrl && (b.tabs as any).captureVisibleTab) {
        try {
          dataUrl = await (b.tabs as any).captureVisibleTab();
        } catch (e3: any) {
          lastErr = e3?.message || String(e3);
        }
      }

      // 4. Try captureTab if tabId is known
      if (!dataUrl && typeof tabId === 'number' && (b.tabs as any).captureTab) {
        try {
          dataUrl = await (b.tabs as any).captureTab(tabId, opts);
        } catch (e4: any) {
          lastErr = e4?.message || String(e4);
        }
      }

      if (dataUrl) return { ok: true, dataUrl };
      return { ok: false, error: lastErr || 'Capture returned empty image' };
    }

    default:
      return undefined;
  }
});

// —— Launcher helpers ——
async function openWorkspace(url?: string) {
  const target = b.runtime.getURL('workspace.html') + (url ? `?url=${encodeURIComponent(url)}` : '');

  const trackCreatedTab = (tab: any) => {
    if (tab?.id && typeof tab.id === 'number') {
      workspaceTabs.add(tab.id);
      void persistState();
      void syncDnrRules();
    }
  };

  try {
    const lastWindow = await (b.windows as any)?.getLastFocused?.({ populate: false }).catch(() => null);
    if (lastWindow?.id) {
      const tab = await b.tabs.create({ windowId: lastWindow.id, url: target, active: true });
      trackCreatedTab(tab);
      return;
    }
  } catch {}

  try {
    const allWindows = await (b.windows as any)?.getAll?.().catch(() => []);
    if (allWindows && allWindows.length > 0 && allWindows[0]?.id) {
      const tab = await b.tabs.create({ windowId: allWindows[0].id, url: target, active: true });
      trackCreatedTab(tab);
      return;
    }
  } catch {}

  try {
    const tab = await b.tabs.create({ url: target, active: true });
    trackCreatedTab(tab);
  } catch {
    try {
      const win = await (b.windows as any)?.create?.({ url: target, focused: true });
      const tab = win?.tabs?.[0];
      trackCreatedTab(tab);
    } catch {}
  }
}

// —— Toolbar Icon Click: Open Workspace Immediately (No Popup) ——
if (b.action?.onClicked) {
  b.action.onClicked.addListener(async (tab: any) => {
    try {
      const hasHost = await b.permissions.contains({ origins: ['*://*/*'] }).catch(() => true);
      if (!hasHost) {
        await b.permissions.request({ origins: ['*://*/*'] }).catch(() => {});
      }
    } catch {}

    const url = tab?.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:') && !tab.url.startsWith('chrome-extension://') && !tab.url.startsWith('moz-extension://')
      ? tab.url
      : undefined;
    await openWorkspace(url);
  });
}

if (b.commands?.onCommand) {
  b.commands.onCommand.addListener((command: string) => {
    if (command === 'open-workspace' || command === '_execute_action') {
      void (async () => {
        try {
          let activeTab: any = null;
          try {
            const tabs = await b.tabs.query({ active: true, lastFocusedWindow: true });
            activeTab = tabs[0];
          } catch {}
          if (!activeTab) {
            try {
              const tabs = await b.tabs.query({ active: true });
              activeTab = tabs[0];
            } catch {}
          }
          const url = activeTab?.url && !activeTab.url.startsWith('chrome://') && !activeTab.url.startsWith('about:') && !activeTab.url.startsWith('chrome-extension://') && !activeTab.url.startsWith('moz-extension://')
            ? activeTab.url
            : undefined;
          await openWorkspace(url);
        } catch {
          await openWorkspace();
        }
      })();
    }
  });
}

// —— Auto-inject agent into existing tabs so newly installed extension works immediately ——
async function injectIntoExistingTabs() {
  try {
    const tabs = await b.tabs.query({}).catch(() => []);
    for (const tab of tabs) {
      if (typeof tab.id === 'number' && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        try {
          if (b.scripting?.executeScript) {
            await b.scripting.executeScript({
              target: { tabId: tab.id, allFrames: true },
              files: ['content/agent.js'],
            });
          }
        } catch {}
      }
    }
  } catch {}
}

void injectIntoExistingTabs();
if (b.runtime.onInstalled) {
  b.runtime.onInstalled.addListener(() => {
    void injectIntoExistingTabs();
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
