/**
 * Typed cross-browser facade supporting both Firefox (`browser`) and Chromium (`chrome`).
 * Normalizes promise-based APIs and handles differences in menus / contextMenus.
 */

const g: any = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {};
const raw = g.browser || g.chrome || {};

function promisify<T = any>(fn: (...args: any[]) => any, context: any, ...args: any[]): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      const res = fn.call(context, ...args, (result: T) => {
        const err = raw.runtime?.lastError;
        if (err) reject(new Error(err.message || String(err)));
        else resolve(result);
      });
      // If the browser API natively returned a Promise (Firefox or modern Chrome MV3)
      if (res && typeof res.then === 'function') {
        res.then(resolve, reject);
      }
    } catch (e) {
      reject(e);
    }
  });
}

export interface VgBrowser {
  runtime: {
    sendMessage(msg: unknown): Promise<unknown>;
    onMessage: {
      addListener(cb: (msg: any, sender: any) => unknown): void;
      removeListener?(cb: (msg: any, sender: any) => unknown): void;
    };
    getURL(path: string): string;
    onInstalled?: { addListener(cb: () => void): void };
    lastError?: { message?: string };
  };
  tabs: {
    create(props: { url?: string; active?: boolean; windowId?: number }): Promise<{ id?: number }>;
    captureTab?(tabId: number, opts?: unknown): Promise<string>;
    captureVisibleTab?(windowId?: number, opts?: unknown): Promise<string>;
    sendMessage(tabId: number, msg: unknown, opts?: { frameId?: number }): Promise<unknown>;
    query(q: Record<string, unknown>): Promise<Array<{ id?: number; url?: string; windowId?: number }>>;
    onCreated?: { addListener(cb: (tab: any) => void): void };
    onUpdated?: { addListener(cb: (tabId: number, changeInfo: any, tab: any) => void): void };
    onRemoved?: { addListener(cb: (tabId: number, removeInfo: any) => void): void };
  };
  windows?: {
    getCurrent?(opts?: any): Promise<{ id?: number }>;
    getLastFocused?(opts?: any): Promise<{ id?: number }>;
    getAll?(opts?: any): Promise<Array<{ id?: number }>>;
    create?(data: { url?: string; focused?: boolean }): Promise<{ id?: number }>;
  };
  permissions: {
    contains(p: { origins?: string[]; permissions?: string[] }): Promise<boolean>;
    request(p: { origins?: string[]; permissions?: string[] }): Promise<boolean>;
  };
  downloads?: {
    download(options: { url: string; filename?: string; saveAs?: boolean }): Promise<number>;
  };
  storage?: {
    local: {
      get(keys: string[] | string): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
      remove(keys: string[] | string): Promise<void>;
    };
    session?: {
      get(keys: string[] | string): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
      remove(keys: string[] | string): Promise<void>;
    };
  };
  scripting?: {
    executeScript(opts: {
      target: { tabId: number; allFrames?: boolean; frameIds?: number[] };
      files?: string[];
    }): Promise<unknown>;
  };
  cookies?: {
    getAll(details: { url?: string; domain?: string; name?: string }): Promise<any[]>;
    get(details: { url: string; name: string }): Promise<any>;
    set(details: Record<string, unknown>): Promise<any>;
    remove(details: { url: string; name: string }): Promise<any>;
  };
  webRequest?: any;
  menus?: {
    create(props: Record<string, unknown>): void;
    removeAll(): Promise<void> | void;
    onClicked: { addListener(cb: (info: any, tab: any) => void): void };
  };
  action?: {
    onClicked: { addListener(cb: (tab: any) => void): void };
  };
  commands?: {
    onCommand: { addListener(cb: (command: string) => void): void };
  };
  declarativeNetRequest?: {
    updateSessionRules(options: {
      addRules?: any[];
      removeRuleIds?: number[];
    }): Promise<void>;
    getSessionRules(): Promise<any[]>;
  };
}

const messageListeners = new WeakMap<Function, any>();

export const b: VgBrowser = {
  runtime: {
    sendMessage(msg: unknown): Promise<unknown> {
      if (!raw.runtime?.sendMessage) return Promise.resolve(undefined);
      return promisify(raw.runtime.sendMessage, raw.runtime, msg);
    },
    onMessage: {
      addListener(cb: (msg: any, sender: any, sendResponse?: (res?: any) => void) => unknown) {
        if (!raw.runtime?.onMessage?.addListener) return;
        const wrapped = (msg: any, sender: any, sendResponse: (res?: any) => void) => {
          try {
            const res = cb(msg, sender, sendResponse);
            if (res && typeof (res as any).then === 'function') {
              (res as Promise<any>)
                .then((val) => {
                  try {
                    sendResponse?.(val);
                  } catch {}
                })
                .catch((err) => {
                  try {
                    sendResponse?.({ ok: false, error: err?.message || String(err) });
                  } catch {}
                });
              return true; // Keep message channel open for asynchronous sendResponse in Chromium
            }
            return res;
          } catch (e) {
            try {
              sendResponse?.({ ok: false, error: (e as any)?.message || String(e) });
            } catch {}
          }
        };
        messageListeners.set(cb, wrapped);
        raw.runtime.onMessage.addListener(wrapped);
      },
      removeListener(cb: (msg: any, sender: any) => unknown) {
        const wrapped = messageListeners.get(cb);
        if (wrapped && raw.runtime?.onMessage?.removeListener) {
          raw.runtime.onMessage.removeListener(wrapped);
        } else if (raw.runtime?.onMessage?.removeListener) {
          raw.runtime.onMessage.removeListener(cb);
        }
      },
    },
    getURL(path: string): string {
      return raw.runtime?.getURL?.(path) || path;
    },
    onInstalled: raw.runtime?.onInstalled,
    get lastError() {
      return raw.runtime?.lastError;
    },
  },
  tabs: {
    create(props: { url?: string; active?: boolean; windowId?: number }): Promise<{ id?: number }> {
      if (!raw.tabs?.create) return Promise.resolve({});
      return promisify(raw.tabs.create, raw.tabs, props);
    },
    captureTab(tabId: number, opts?: unknown): Promise<string> {
      if (!raw.tabs?.captureTab) return Promise.reject(new Error('captureTab unavailable'));
      return promisify(raw.tabs.captureTab, raw.tabs, tabId, opts);
    },
    captureVisibleTab(windowId?: number, opts?: unknown): Promise<string> {
      if (!raw.tabs?.captureVisibleTab) return Promise.reject(new Error('captureVisibleTab unavailable'));
      if (typeof windowId === 'number') {
        return promisify(raw.tabs.captureVisibleTab, raw.tabs, windowId, opts);
      }
      return promisify(raw.tabs.captureVisibleTab, raw.tabs, opts);
    },
    sendMessage(tabId: number, msg: unknown, opts?: { frameId?: number }): Promise<unknown> {
      if (!raw.tabs?.sendMessage) return Promise.resolve(undefined);
      if (opts !== undefined) {
        return promisify(raw.tabs.sendMessage, raw.tabs, tabId, msg, opts);
      }
      return promisify(raw.tabs.sendMessage, raw.tabs, tabId, msg);
    },
    query(q: Record<string, unknown>): Promise<Array<{ id?: number; url?: string; windowId?: number }>> {
      if (!raw.tabs?.query) return Promise.resolve([]);
      return promisify(raw.tabs.query, raw.tabs, q);
    },
    onUpdated: raw.tabs?.onUpdated,
    onRemoved: raw.tabs?.onRemoved,
  },
  windows: {
    getCurrent(opts?: any): Promise<{ id?: number }> {
      if (!raw.windows?.getCurrent) return Promise.resolve({});
      return promisify(raw.windows.getCurrent, raw.windows, opts || {});
    },
    getLastFocused(opts?: any): Promise<{ id?: number }> {
      if (!raw.windows?.getLastFocused) return Promise.resolve({});
      return promisify(raw.windows.getLastFocused, raw.windows, opts || {});
    },
    getAll(opts?: any): Promise<Array<{ id?: number }>> {
      if (!raw.windows?.getAll) return Promise.resolve([]);
      return promisify(raw.windows.getAll, raw.windows, opts || {});
    },
    create(data: { url?: string; focused?: boolean }): Promise<{ id?: number }> {
      if (!raw.windows?.create) return Promise.resolve({});
      return promisify(raw.windows.create, raw.windows, data);
    },
  },
  permissions: {
    contains(p: { origins?: string[]; permissions?: string[] }): Promise<boolean> {
      if (!raw.permissions?.contains) return Promise.resolve(false);
      return promisify(raw.permissions.contains, raw.permissions, p);
    },
    request(p: { origins?: string[]; permissions?: string[] }): Promise<boolean> {
      if (!raw.permissions?.request) return Promise.resolve(false);
      return promisify(raw.permissions.request, raw.permissions, p);
    },
  },
  storage: {
    local: {
      get(keys: string[] | string): Promise<Record<string, unknown>> {
        if (!raw.storage?.local?.get) return Promise.resolve({});
        return promisify(raw.storage.local.get, raw.storage.local, keys);
      },
      set(items: Record<string, unknown>): Promise<void> {
        if (!raw.storage?.local?.set) return Promise.resolve();
        return promisify(raw.storage.local.set, raw.storage.local, items);
      },
      remove(keys: string[] | string): Promise<void> {
        if (!raw.storage?.local?.remove) return Promise.resolve();
        return promisify(raw.storage.local.remove, raw.storage.local, keys);
      },
    },
    session: raw.storage?.session
      ? {
          get(keys: string[] | string): Promise<Record<string, unknown>> {
            return promisify(raw.storage.session.get, raw.storage.session, keys);
          },
          set(items: Record<string, unknown>): Promise<void> {
            return promisify(raw.storage.session.set, raw.storage.session, items);
          },
          remove(keys: string[] | string): Promise<void> {
            return promisify(raw.storage.session.remove, raw.storage.session, keys);
          },
        }
      : undefined,
  },
  menus: (raw.menus || raw.contextMenus)
    ? {
        create(props: Record<string, unknown>): void {
          const m = raw.menus || raw.contextMenus;
          m?.create?.(props);
        },
        removeAll(): Promise<void> | void {
          const m = raw.menus || raw.contextMenus;
          if (m?.removeAll) return promisify(m.removeAll, m);
        },
        onClicked: (raw.menus || raw.contextMenus).onClicked,
      }
    : undefined,
  action: (raw.action || raw.browserAction)
    ? {
        onClicked: (raw.action || raw.browserAction).onClicked,
      }
    : undefined,
  scripting: raw.scripting
    ? {
        executeScript(opts: {
          target: { tabId: number; allFrames?: boolean; frameIds?: number[] };
          files?: string[];
        }): Promise<unknown> {
          if (!raw.scripting?.executeScript) return Promise.resolve();
          return promisify(raw.scripting.executeScript, raw.scripting, opts);
        },
      }
    : undefined,
  commands: raw.commands
    ? {
        onCommand: raw.commands.onCommand,
      }
    : undefined,
  cookies: raw.cookies
    ? {
        getAll(details: { url?: string; domain?: string; name?: string }): Promise<any[]> {
          if (!raw.cookies?.getAll) return Promise.resolve([]);
          return promisify(raw.cookies.getAll, raw.cookies, details);
        },
        get(details: { url: string; name: string }): Promise<any> {
          if (!raw.cookies?.get) return Promise.resolve(null);
          return promisify(raw.cookies.get, raw.cookies, details);
        },
        set(details: Record<string, unknown>): Promise<any> {
          if (!raw.cookies?.set) return Promise.resolve(null);
          return promisify(raw.cookies.set, raw.cookies, details);
        },
        remove(details: { url: string; name: string }): Promise<any> {
          if (!raw.cookies?.remove) return Promise.resolve(null);
          return promisify(raw.cookies.remove, raw.cookies, details);
        },
      }
    : undefined,
  webRequest: raw.webRequest,
  downloads: raw.downloads
    ? {
        download(options: { url: string; filename?: string; saveAs?: boolean }): Promise<number> {
          if (!raw.downloads?.download) return Promise.reject(new Error('downloads API unavailable'));
          return promisify(raw.downloads.download, raw.downloads, options);
        },
      }
    : undefined,
  declarativeNetRequest: raw.declarativeNetRequest
    ? {
        updateSessionRules(options: { addRules?: any[]; removeRuleIds?: number[] }): Promise<void> {
          if (!raw.declarativeNetRequest?.updateSessionRules) return Promise.resolve();
          return promisify(raw.declarativeNetRequest.updateSessionRules, raw.declarativeNetRequest, options);
        },
        getSessionRules(): Promise<any[]> {
          if (!raw.declarativeNetRequest?.getSessionRules) return Promise.resolve([]);
          return promisify(raw.declarativeNetRequest.getSessionRules, raw.declarativeNetRequest);
        },
      }
    : undefined,
};
