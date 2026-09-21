/**
 * Typed facade over the WebExtension `browser` global.
 * Firefox-first (native promise API). A full webextension-polyfill is deferred
 * to the Chromium port milestone (see ARCHITECTURE §4 / TASK §30).
 */
export interface VgBrowser {
  runtime: {
    sendMessage(msg: unknown): Promise<unknown>;
    onMessage: {
      addListener(cb: (msg: any, sender: any) => unknown): void;
    };
    getURL(path: string): string;
    onInstalled?: { addListener(cb: () => void): void };
  };
  tabs: {
    create(props: { url?: string; active?: boolean }): Promise<{ id?: number }>;
    captureTab?(tabId: number, opts?: unknown): Promise<string>;
    captureVisibleTab?(windowId?: number, opts?: unknown): Promise<string>;
    sendMessage(tabId: number, msg: unknown, opts?: { frameId?: number }): Promise<unknown>;
    query(q: Record<string, unknown>): Promise<Array<{ id?: number; url?: string }>>;
  };
  permissions: {
    contains(p: { origins?: string[] }): Promise<boolean>;
    request(p: { origins?: string[] }): Promise<boolean>;
  };
  storage?: {
    local: {
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
  webRequest?: any;
  menus?: {
    create(props: Record<string, unknown>): void;
    removeAll(): Promise<void> | void;
    onClicked: { addListener(cb: (info: any, tab: any) => void): void };
  };
  commands?: {
    onCommand: { addListener(cb: (command: string) => void): void };
  };
}

export const b = (globalThis as any).browser as VgBrowser;
