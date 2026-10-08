"use strict";
(() => {
  // src/platform/browser.ts
  var g = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : {};
  var raw = g.browser || g.chrome || {};
  function promisify(fn, context, ...args) {
    return new Promise((resolve, reject) => {
      try {
        let settled = false;
        if (g.browser) {
          Promise.resolve(fn.call(context, ...args)).then(resolve, reject);
          return;
        }
        const res = fn.call(context, ...args, (result) => {
          if (settled) return;
          settled = true;
          const err = raw.runtime?.lastError;
          if (err) reject(new Error(err.message || String(err)));
          else resolve(result);
        });
        if (res && typeof res.then === "function") {
          res.then(
            (val) => {
              if (!settled) {
                settled = true;
                resolve(val);
              }
            },
            (err) => {
              if (!settled) {
                settled = true;
                reject(err);
              }
            }
          );
        }
      } catch (e) {
        reject(e);
      }
    });
  }
  var messageListeners = /* @__PURE__ */ new WeakMap();
  var b = {
    runtime: {
      sendMessage(msg) {
        if (!raw.runtime?.sendMessage) return Promise.resolve(void 0);
        return promisify(raw.runtime.sendMessage, raw.runtime, msg);
      },
      onMessage: {
        addListener(cb) {
          if (!raw.runtime?.onMessage?.addListener) return;
          const wrapped = (msg, sender, sendResponse) => {
            try {
              const res = cb(msg, sender, sendResponse);
              if (res && typeof res.then === "function") {
                res.then((val) => {
                  try {
                    sendResponse?.(val);
                  } catch {
                  }
                }).catch((err) => {
                  try {
                    sendResponse?.({ ok: false, error: err?.message || String(err) });
                  } catch {
                  }
                });
                return true;
              }
              return res;
            } catch (e) {
              try {
                sendResponse?.({ ok: false, error: e?.message || String(e) });
              } catch {
              }
            }
          };
          messageListeners.set(cb, wrapped);
          raw.runtime.onMessage.addListener(wrapped);
        },
        removeListener(cb) {
          const wrapped = messageListeners.get(cb);
          if (wrapped && raw.runtime?.onMessage?.removeListener) {
            raw.runtime.onMessage.removeListener(wrapped);
          } else if (raw.runtime?.onMessage?.removeListener) {
            raw.runtime.onMessage.removeListener(cb);
          }
        }
      },
      getURL(path) {
        return raw.runtime?.getURL?.(path) || path;
      },
      onInstalled: raw.runtime?.onInstalled,
      get lastError() {
        return raw.runtime?.lastError;
      }
    },
    tabs: {
      reload(tabId, options) {
        return promisify(raw.tabs.reload, raw.tabs, tabId, options);
      },
      getCurrent() {
        return promisify(raw.tabs.getCurrent, raw.tabs);
      },
      get(tabId) {
        return promisify(raw.tabs.get, raw.tabs, tabId);
      },
      create(props) {
        if (!raw.tabs?.create) return Promise.resolve({});
        return promisify(raw.tabs.create, raw.tabs, props);
      },
      captureTab(tabId, opts) {
        if (!raw.tabs?.captureTab) return Promise.reject(new Error("captureTab unavailable"));
        return promisify(raw.tabs.captureTab, raw.tabs, tabId, opts);
      },
      captureVisibleTab(windowId, opts) {
        if (!raw.tabs?.captureVisibleTab) return Promise.reject(new Error("captureVisibleTab unavailable"));
        if (typeof windowId === "number") {
          return promisify(raw.tabs.captureVisibleTab, raw.tabs, windowId, opts);
        }
        return promisify(raw.tabs.captureVisibleTab, raw.tabs, opts);
      },
      sendMessage(tabId, msg, opts) {
        if (!raw.tabs?.sendMessage) return Promise.resolve(void 0);
        if (opts !== void 0) {
          return promisify(raw.tabs.sendMessage, raw.tabs, tabId, msg, opts);
        }
        return promisify(raw.tabs.sendMessage, raw.tabs, tabId, msg);
      },
      query(q) {
        if (!raw.tabs?.query) return Promise.resolve([]);
        return promisify(raw.tabs.query, raw.tabs, q);
      },
      onCreated: raw.tabs?.onCreated,
      onUpdated: raw.tabs?.onUpdated,
      onRemoved: raw.tabs?.onRemoved
    },
    windows: {
      getCurrent(opts) {
        if (!raw.windows?.getCurrent) return Promise.resolve({});
        return promisify(raw.windows.getCurrent, raw.windows, opts || {});
      },
      getLastFocused(opts) {
        if (!raw.windows?.getLastFocused) return Promise.resolve({});
        return promisify(raw.windows.getLastFocused, raw.windows, opts || {});
      },
      getAll(opts) {
        if (!raw.windows?.getAll) return Promise.resolve([]);
        return promisify(raw.windows.getAll, raw.windows, opts || {});
      },
      create(data) {
        if (!raw.windows?.create) return Promise.resolve({});
        return promisify(raw.windows.create, raw.windows, data);
      }
    },
    permissions: {
      contains(p) {
        if (!raw.permissions?.contains) return Promise.resolve(false);
        return promisify(raw.permissions.contains, raw.permissions, p);
      },
      request(p) {
        if (!raw.permissions?.request) return Promise.resolve(false);
        return promisify(raw.permissions.request, raw.permissions, p);
      }
    },
    storage: {
      local: {
        get(keys) {
          if (!raw.storage?.local?.get) return Promise.resolve({});
          return promisify(raw.storage.local.get, raw.storage.local, keys);
        },
        set(items) {
          if (!raw.storage?.local?.set) return Promise.resolve();
          return promisify(raw.storage.local.set, raw.storage.local, items);
        },
        remove(keys) {
          if (!raw.storage?.local?.remove) return Promise.resolve();
          return promisify(raw.storage.local.remove, raw.storage.local, keys);
        }
      },
      session: raw.storage?.session ? {
        get(keys) {
          return promisify(raw.storage.session.get, raw.storage.session, keys);
        },
        set(items) {
          return promisify(raw.storage.session.set, raw.storage.session, items);
        },
        remove(keys) {
          return promisify(raw.storage.session.remove, raw.storage.session, keys);
        }
      } : void 0
    },
    menus: raw.menus || raw.contextMenus ? {
      create(props) {
        const m = raw.menus || raw.contextMenus;
        m?.create?.(props);
      },
      removeAll() {
        const m = raw.menus || raw.contextMenus;
        if (m?.removeAll) return promisify(m.removeAll, m);
      },
      onClicked: (raw.menus || raw.contextMenus).onClicked
    } : void 0,
    action: raw.action || raw.browserAction ? {
      onClicked: (raw.action || raw.browserAction).onClicked
    } : void 0,
    scripting: raw.scripting ? {
      executeScript(opts) {
        if (!raw.scripting?.executeScript) return Promise.resolve();
        return promisify(raw.scripting.executeScript, raw.scripting, opts);
      }
    } : void 0,
    commands: raw.commands ? {
      onCommand: raw.commands.onCommand
    } : void 0,
    cookies: raw.cookies ? {
      getAll(details) {
        if (!raw.cookies?.getAll) return Promise.resolve([]);
        return promisify(raw.cookies.getAll, raw.cookies, details);
      },
      get(details) {
        if (!raw.cookies?.get) return Promise.resolve(null);
        return promisify(raw.cookies.get, raw.cookies, details);
      },
      set(details) {
        if (!raw.cookies?.set) return Promise.resolve(null);
        return promisify(raw.cookies.set, raw.cookies, details);
      },
      remove(details) {
        if (!raw.cookies?.remove) return Promise.resolve(null);
        return promisify(raw.cookies.remove, raw.cookies, details);
      }
    } : void 0,
    webRequest: raw.webRequest,
    downloads: raw.downloads ? {
      download(options) {
        if (!raw.downloads?.download) return Promise.reject(new Error("downloads API unavailable"));
        return promisify(raw.downloads.download, raw.downloads, options);
      }
    } : void 0,
    browsingData: raw.browsingData ? {
      remove(options, dataToRemove) {
        if (!raw.browsingData?.remove) return Promise.resolve();
        return promisify(raw.browsingData.remove, raw.browsingData, options, dataToRemove);
      },
      removeCache(options) {
        if (!raw.browsingData?.removeCache) return Promise.resolve();
        return promisify(raw.browsingData.removeCache, raw.browsingData, options);
      },
      removeServiceWorkers(options) {
        if (raw.browsingData?.removeServiceWorkers) {
          return promisify(raw.browsingData.removeServiceWorkers, raw.browsingData, options);
        }
        if (raw.browsingData?.remove) {
          return promisify(raw.browsingData.remove, raw.browsingData, options, { serviceWorkers: true });
        }
        return Promise.resolve();
      }
    } : void 0,
    declarativeNetRequest: raw.declarativeNetRequest ? {
      updateDynamicRules(options) {
        if (!raw.declarativeNetRequest?.updateDynamicRules) return Promise.resolve();
        return promisify(raw.declarativeNetRequest.updateDynamicRules, raw.declarativeNetRequest, options);
      },
      getDynamicRules() {
        if (!raw.declarativeNetRequest?.getDynamicRules) return Promise.resolve([]);
        return promisify(raw.declarativeNetRequest.getDynamicRules, raw.declarativeNetRequest);
      },
      updateSessionRules(options) {
        if (!raw.declarativeNetRequest?.updateSessionRules) return Promise.resolve();
        return promisify(raw.declarativeNetRequest.updateSessionRules, raw.declarativeNetRequest, options);
      },
      getSessionRules() {
        if (!raw.declarativeNetRequest?.getSessionRules) return Promise.resolve([]);
        return promisify(raw.declarativeNetRequest.getSessionRules, raw.declarativeNetRequest);
      }
    } : void 0
  };

  // src/core/security/framing.ts
  function isWorkspaceUrl(url, workspaceUrl2) {
    if (!url) return false;
    try {
      const a = new URL(url), b2 = new URL(workspaceUrl2);
      return a.protocol === b2.protocol && a.host === b2.host && a.pathname === b2.pathname;
    } catch {
      return false;
    }
  }
  function workspaceRule(tabIds) {
    if (!tabIds.length) return [];
    return [{
      id: 1001,
      priority: 1,
      action: { type: "modifyHeaders", responseHeaders: [
        { header: "x-frame-options", operation: "remove" },
        // DNR cannot edit one CSP directive or select parentFrameId. A tab-scoped
        // subframe rule also covers page-initiated navigation and reload. Ordinary
        // tabs retain their protections; nested frames in a workspace are included.
        { header: "content-security-policy", operation: "remove" },
        { header: "content-security-policy-report-only", operation: "remove" }
      ] },
      condition: { resourceTypes: ["sub_frame"], tabIds }
    }];
  }
  function relaxFirefoxHeaders(headers) {
    return headers.filter((h) => h.name.toLowerCase() !== "x-frame-options").map((h) => {
      if (!["content-security-policy", "content-security-policy-report-only"].includes(h.name.toLowerCase()) || !h.value) return h;
      return { ...h, value: h.value.split(";").filter((d) => !/^\s*frame-ancestors(?:\s|$)/i.test(d)).join(";") };
    });
  }
  function safeHttpUrl(value) {
    if (typeof value !== "string") return false;
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }

  // src/background/index.ts
  var workspaceUrl = b.runtime.getURL("workspace.html");
  var workspaceTabs = /* @__PURE__ */ new Set();
  var agents = /* @__PURE__ */ new Map();
  var hydrated;
  var ruleQueue = Promise.resolve();
  function syncRules() {
    ruleQueue = ruleQueue.catch(() => {
    }).then(async () => {
      if (!b.declarativeNetRequest) return;
      await b.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [1001] });
      await b.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [1001],
        addRules: b.webRequest?.onHeadersReceived ? [] : workspaceRule([...workspaceTabs])
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
      for (const tab of tabs) if (tab.id !== void 0 && isWorkspaceUrl(tab.url, workspaceUrl)) workspaceTabs.add(tab.id);
      const saved = await b.storage?.session?.get("agentFrames");
      if (Array.isArray(saved?.agentFrames)) for (const [tab, vp, frame] of saved.agentFrames) {
        if (!workspaceTabs.has(tab) || typeof frame !== "number") continue;
        if (!agents.has(tab)) agents.set(tab, /* @__PURE__ */ new Map());
        agents.get(tab).set(vp, frame);
      }
      await syncRules();
    })();
  }
  void hydrate().catch(console.error);
  b.tabs.onUpdated?.addListener((id, info, tab) => {
    if (!info.url) return;
    if (isWorkspaceUrl(info.url || tab.url, workspaceUrl)) workspaceTabs.add(id);
    else {
      workspaceTabs.delete(id);
      agents.delete(id);
    }
    void syncRules();
    void persist();
  });
  b.tabs.onRemoved?.addListener((id) => {
    workspaceTabs.delete(id);
    agents.delete(id);
    void syncRules();
    void persist();
  });
  if (b.webRequest?.onHeadersReceived) {
    b.webRequest.onHeadersReceived.addListener((details) => {
      if (details.type !== "sub_frame" || details.parentFrameId !== 0 || !workspaceTabs.has(details.tabId)) return {};
      return { responseHeaders: relaxFirefoxHeaders(details.responseHeaders ?? []) };
    }, { urls: ["<all_urls>"] }, ["blocking", "responseHeaders"]);
  }
  async function workspaceTab(msg, sender) {
    if (!isWorkspaceUrl(sender.url, workspaceUrl)) return void 0;
    const id = sender.tab?.id ?? msg.tabId;
    if (typeof id !== "number") return void 0;
    const tab = await b.tabs.get(id).catch(() => null);
    return tab && isWorkspaceUrl(tab.url, workspaceUrl) ? id : void 0;
  }
  async function route(tabId, target, message) {
    const entries = [...agents.get(tabId) ?? []].filter(([vp]) => target === "all" || target.includes(vp));
    const results = await Promise.all(entries.map(async ([viewportId, frameId]) => {
      try {
        await b.tabs.sendMessage(tabId, message, { frameId });
        return viewportId;
      } catch {
        agents.get(tabId)?.delete(viewportId);
        return null;
      }
    }));
    return results.filter((id) => id !== null);
  }
  b.runtime.onMessage.addListener((msg, sender) => {
    if (!msg?.type || ["vg/agent-event", "vg/scan-result"].includes(msg.type)) return;
    return (async () => {
      await hydrate();
      if (msg.type === "vg/open-workspace-tab") {
        await openWorkspace(safeHttpUrl(msg.url) ? msg.url : void 0);
        return { ok: true };
      }
      if (msg.type === "vg/agent-hello") {
        const id = sender.tab?.id, frame = sender.frameId;
        if (typeof id !== "number" || !workspaceTabs.has(id) || typeof frame !== "number" || frame <= 0) return { ok: false };
        if (!agents.has(id)) agents.set(id, /* @__PURE__ */ new Map());
        agents.get(id).set(String(msg.viewportId), frame);
        await persist();
        return { ok: true, frameId: frame };
      }
      const tabId = await workspaceTab(msg, sender);
      if (tabId === void 0) return { ok: false, error: "Unverified workspace" };
      if (msg.type === "vg/workspace-hello") {
        workspaceTabs.add(tabId);
        await syncRules();
        return { ok: true, tabId };
      }
      if (msg.type === "vg/sync-apply") {
        const source = String(msg.env?.sourceViewportId);
        if (!agents.get(tabId)?.has(source)) return { ok: false };
        const target = [...agents.get(tabId)?.keys() ?? []].filter((id) => id !== source);
        await route(tabId, target, { type: "vg/agent-apply", env: msg.env });
        return { ok: true };
      }
      if (msg.type === "vg/agent-cmd") {
        const commands = ["reload", "hardReload", "back", "forward", "goto", "scrollToTop", "setColorScheme", "setTouchCursor", "highlight"];
        if (!commands.includes(msg.cmd)) return { ok: false, error: "Unknown command" };
        if (msg.cmd === "goto" && !safeHttpUrl(msg.url)) return { ok: false, error: "Invalid URL" };
        const reached = await route(tabId, Array.isArray(msg.target) ? msg.target : "all", { ...msg, type: "vg/agent-do" });
        return { ok: reached.length > 0, reached };
      }
      if (msg.type === "vg/scan-run") {
        const reached = await route(tabId, Array.isArray(msg.target) ? msg.target : "all", { type: "vg/agent-scan", scanId: msg.scanId, touchViewportIds: msg.touchViewportIds });
        return { ok: true, reached };
      }
      if (msg.type === "vg/hard-reload") {
        await b.tabs.reload(tabId, { bypassCache: true });
        return { ok: true };
      }
      if (msg.type === "vg/capture") {
        const tab = await b.tabs.get(tabId);
        if (!tab.active) return { ok: false, error: "Keep the ViewGrid tab active during capture." };
        const opts = msg.format === "jpeg" ? { format: "jpeg", quality: 92 } : { format: "png" };
        try {
          const dataUrl = await b.tabs.captureVisibleTab(tab.windowId, opts);
          return { ok: true, dataUrl };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      }
      return { ok: false, error: "Unknown request" };
    })();
  });
  async function openWorkspace(url) {
    const tab = await b.tabs.create({ url: workspaceUrl + (url ? `?url=${encodeURIComponent(url)}` : ""), active: true });
    if (tab.id !== void 0) {
      workspaceTabs.add(tab.id);
      await syncRules();
    }
  }
  b.action?.onClicked.addListener((tab) => {
    void openWorkspace(safeHttpUrl(tab.url) ? tab.url : void 0);
  });
  b.commands?.onCommand.addListener((command) => {
    if (command === "_execute_action" || command === "_execute_browser_action") void b.tabs.query({ active: true, currentWindow: true }).then((tabs) => openWorkspace(safeHttpUrl(tabs[0]?.url) ? tabs[0].url : void 0));
  });
  if (b.menus) {
    const setup = async () => {
      await b.menus.removeAll();
      b.menus.create({ id: "vg-open-page", title: "Open page in ViewGrid", contexts: ["page"] });
      b.menus.create({ id: "vg-open-link", title: "Open link in ViewGrid", contexts: ["link"] });
    };
    b.runtime.onInstalled?.addListener(() => {
      void setup();
    });
    b.menus.onClicked.addListener((info, tab) => {
      void openWorkspace(safeHttpUrl(info.linkUrl) ? info.linkUrl : safeHttpUrl(tab?.url) ? tab.url : void 0);
    });
  }
})();
