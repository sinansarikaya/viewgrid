import { create } from 'zustand';
import {
  DEFAULT_SYNC,
  type DeviceProfile,
  type Issue,
  type LayoutMode,
  type AlignItemsMode,
  type JustifyContentMode,
  type ViewportState,
  type WorkspaceModel,
  MAX_VIEWPORTS,
} from '../../core/types';
import { BUILTIN_DEVICES, BUILTIN_PRESETS } from '../../core/devices/builtin';
import { mergeDeviceDb } from '../../core/devices/merge';
import { makeCustomDevice } from '../../core/devices/schema';
import {
  autoAlignPositions,
  canAddViewports,
  clampZoom,
  duplicateViewport,
  effectiveSize,
  gridColumns,
  moveViewport,
  nextHidden,
  nextMinimized,
  rotated,
  swapOrientation,
} from '../../core/workspace/layout';
import { defaultWorkspace, parseWorkspace } from '../../core/workspace/serialize';
import { uid } from '../../core/util/id';
import { b } from '../../platform/browser';
import { hasHostAccess } from './bridge';

export interface StoreState {
  model: WorkspaceModel;
  customDevices: DeviceProfile[];
  savedWorkspaces: Record<string, WorkspaceModel>;
  focusedId: string | null;
  focusMode: boolean;
  issues: Issue[];
  scanning: boolean;
  pickerOpen: boolean;
  drawerOpen: boolean;
  toast: string | null;
  granted: boolean;
  urlDraft: string;
  language: 'tr' | 'en' | 'no';
  languageExplicitlySet?: boolean;

  // derived helpers
  profileOf(v: ViewportState): DeviceProfile;
  visibleViewports(): ViewportState[];

  // actions
  setLanguage(lang: 'tr' | 'en' | 'no'): void;
  fitToScreen(): void;
  setAllZoom(zoom: number): void;
  hydrate(): Promise<void>;
  persist(): Promise<void>;
  setGranted(v: boolean): void;
  setUrlDraft(u: string): void;
  applyUrl(u: string): void;
  addDevice(profile: DeviceProfile, orientation?: ViewportState['orientation']): void;
  addPreset(name: string): void;
  addCustom(input: { name: string; width: number; height: number; dpr?: number }): void;
  removeViewport(id: string): void;
  duplicate(id: string): void;
  toggleHidden(id: string): void;
  toggleMinimized(id: string): void;
  toggleOrientation(id: string): void;
  setZoom(id: string, zoom: number): void;
  setLayout(mode: LayoutMode): void;
  setAlignItems(mode: AlignItemsMode): void;
  setJustifyContent(mode: JustifyContentMode): void;
  setPosition(id: string, pos: { x: number; y: number }): void;
  autoAlignAll(): void;
  reorder(from: number, to: number): void;
  reorderById(fromId: string, toId: string): void;
  focus(id: string | null): void;
  toggleFocusMode(): void;
  setSync(channel: keyof WorkspaceModel['sync'], value: boolean): void;
  setAllSync(value: boolean): void;
  toggleTheme(): void;
  toggleFrames(): void;
  setIssues(issues: Issue[]): void;
  mergeScanResult(viewportId: string, issues: Omit<Issue, 'viewportId'>[]): void;
  clearIssues(): void;
  setScanning(v: boolean): void;
  setPickerOpen(v: boolean): void;
  setDrawerOpen(v: boolean): void;
  compareOpen: boolean;
  compareMode?: 'split' | 'curtain' | 'side-by-side' | 'figma';
  setCompareOpen(v: boolean, mode?: 'split' | 'curtain' | 'side-by-side' | 'figma'): void;
  setCompareMode(mode: 'split' | 'curtain' | 'side-by-side' | 'figma'): void;
  benchmarkOpen: boolean;
  setBenchmarkOpen(v: boolean): void;
  settingsOpen: boolean;
  setSettingsOpen(v: boolean): void;
  shortcuts: Record<string, string>;
  setShortcut(action: string, keyCombo: string): void;
  resetShortcuts(): void;
  bypassCacheOnLoad: boolean;
  setBypassCacheOnLoad(v: boolean): void;
  setColorScheme(id: string, scheme: 'auto' | 'dark' | 'light'): void;
  setFrameFinish(id: string, finish: string): void;
  toggleTouchCursor(): void;
  showToast(msg: string): void;
  saveAs(name: string): void;
  loadSaved(name: string): void;
  deleteSaved(name: string): void;
  setViewportUrl(id: string, url: string): void;
  reloadAllFrames(): void;
}

export const DEFAULT_SHORTCUTS: Record<string, string> = {
  openWorkspace: 'Alt+Shift+V',
  reloadAll: 'Shift+R',
  hardReload: 'Shift+B',
  addDevice: 'a',
  focusMode: 'f',
  toggleFrames: 'Shift+F',
  shotFocused: 'c',
  shotAll: 'Shift+C',
  compare: 'Shift+D',
};

const KEY = 'viewgrid.store.v1';

export function detectBrowserLanguage(navLang?: string, navLangs?: readonly string[]): 'tr' | 'en' | 'no' {
  const candidates: string[] = [];

  if (navLang) {
    candidates.push(navLang);
  }
  if (navLangs && Array.isArray(navLangs)) {
    candidates.push(...navLangs);
  }

  // If no arguments were provided, read from environment navigator
  if (candidates.length === 0 && typeof navigator !== 'undefined') {
    if (navigator.language) candidates.push(navigator.language);
    if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
  }

  for (const raw of candidates) {
    const l = (raw || '').toLowerCase().trim();
    if (l.startsWith('tr')) return 'tr';
    if (l.startsWith('no') || l.startsWith('nb') || l.startsWith('nn')) return 'no';
    if (l.startsWith('en')) return 'en';
  }

  // Default fallback if browser is in any other language (de, fr, es, etc.)
  return 'en';
}

function defaultLanguage(): 'tr' | 'en' | 'no' {
  return detectBrowserLanguage();
}

function persistPayload(s: StoreState) {
  return {
    model: s.model,
    customDevices: s.customDevices,
    savedWorkspaces: s.savedWorkspaces,
    language: s.language,
    languageExplicitlySet: s.languageExplicitlySet,
    shortcuts: s.shortcuts,
    bypassCacheOnLoad: s.bypassCacheOnLoad,
    granted: undefined, // permission state is queried, not persisted
  };
}

let saveTimer: number | undefined;
function schedulePersist(get: () => StoreState) {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => void get().persist(), 800);
}

export const useStore = create<StoreState>((set, get) => ({
  model: defaultWorkspace(),
  customDevices: [],
  savedWorkspaces: {},
  focusedId: null,
  focusMode: false,
  issues: [],
  scanning: false,
  pickerOpen: false,
  drawerOpen: false,
  compareOpen: false,
  compareMode: 'split',
  benchmarkOpen: false,
  settingsOpen: false,
  shortcuts: { ...DEFAULT_SHORTCUTS },
  bypassCacheOnLoad: false,
  toast: null,
  granted: true,
  urlDraft: '',
  language: defaultLanguage(),

  setSettingsOpen(v) {
    set({ settingsOpen: v });
  },
  setShortcut(action, keyCombo) {
    set((s) => ({ shortcuts: { ...s.shortcuts, [action]: keyCombo } }));
    schedulePersist(get);
  },
  resetShortcuts() {
    set({ shortcuts: { ...DEFAULT_SHORTCUTS } });
    schedulePersist(get);
  },
  setBypassCacheOnLoad(v) {
    set({ bypassCacheOnLoad: v });
    schedulePersist(get);
  },

  profileOf(v) {
    if (v.custom) return v.custom;
    const { devices } = mergeDeviceDb(get().customDevices);
    return devices.find((d) => d.id === v.deviceId) ?? BUILTIN_DEVICES[0]!;
  },

  visibleViewports() {
    const { model, focusMode, focusedId } = get();
    if (focusMode && focusedId) return model.viewports.filter((v) => v.id === focusedId && !v.hidden);
    return model.viewports.filter((v) => !v.hidden);
  },

  async hydrate() {
    let model = defaultWorkspace();
    let customDevices: DeviceProfile[] = [];
    let savedWorkspaces: Record<string, WorkspaceModel> = {};
    let language: 'tr' | 'en' | 'no' = defaultLanguage();
    let languageExplicitlySet = false;
    let shortcuts: Record<string, string> = { ...DEFAULT_SHORTCUTS };
    let bypassCacheOnLoad = false;
    try {
      const raw = await b.storage!.local.get(KEY);
      const data = raw[KEY] as any;
      if (data) {
        const parsed = parseWorkspace(data.model);
        if (parsed.ok && parsed.model) model = parsed.model;
        if (Array.isArray(data.customDevices)) customDevices = data.customDevices;
        if (data.savedWorkspaces && typeof data.savedWorkspaces === 'object') savedWorkspaces = data.savedWorkspaces;
        if (data.languageExplicitlySet && data.language && ['tr', 'en', 'no'].includes(data.language)) {
          language = data.language;
          languageExplicitlySet = true;
        } else {
          language = defaultLanguage();
        }
        if (data.shortcuts && typeof data.shortcuts === 'object') {
          shortcuts = { ...DEFAULT_SHORTCUTS, ...data.shortcuts };
        }
        if (typeof data.bypassCacheOnLoad === 'boolean') {
          bypassCacheOnLoad = data.bypassCacheOnLoad;
        }
      }
    } catch {
      /* first run */
    }
    // URL from query string (?url=)
    const qs = new URLSearchParams(location.search);
    const urlParam = qs.get('url');
    if (urlParam) {
      model = { ...model, url: urlParam, viewports: model.viewports.map((v) => ({ ...v, url: urlParam })) };
      if (model.viewports.length === 0) {
        // seed a sensible starter set on first launch with a URL
        model.viewports = ['iphone-15-pro', 'ipad-air', 'laptop-1280', 'desktop-1080p'].map((deviceId) => ({
          id: uid('vp'),
          deviceId,
          orientation: BUILTIN_DEVICES.find((d) => d.id === deviceId)!.defaultOrientation,
          zoom: 0.5,
          minimized: false,
          hidden: false,
          url: urlParam,
        }));
      }
    }
    let granted = true;
    try {
      const check = await hasHostAccess();
      if (typeof check === 'boolean') granted = check;
    } catch {
      granted = true;
    }
    set({
      model,
      customDevices,
      savedWorkspaces,
      granted,
      urlDraft: model.url,
      language,
      languageExplicitlySet,
      shortcuts,
      bypassCacheOnLoad,
    });
    document.documentElement.dataset.theme = model.theme;
  },

  async persist() {
    try {
      await b.storage!.local.set({ [KEY]: persistPayload(get()) });
    } catch {
      /* quota */
    }
  },

  setGranted(v) {
    set({ granted: v });
    void get().persist();
  },
  setLanguage(lang) {
    set({ language: lang, languageExplicitlySet: true });
    schedulePersist(get);
  },
  setAllZoom(zoom) {
    const z = clampZoom(zoom);
    set((s) => ({
      model: {
        ...s.model,
        viewports: s.model.viewports.map((v) => ({ ...v, zoom: z })),
      },
    }));
    schedulePersist(get);
  },
  fitToScreen() {
    const { visibleViewports, profileOf } = get();
    const visible = visibleViewports();
    if (visible.length === 0) return;
    const availW = Math.max(320, window.innerWidth - 64);
    const availH = Math.max(300, window.innerHeight - 130);
    const cols = Math.max(1, Math.min(visible.length, Math.ceil(Math.sqrt(visible.length))));
    const rows = Math.ceil(visible.length / cols);
    let maxCardW = 0;
    let maxCardH = 0;
    for (const v of visible) {
      const p = profileOf(v);
      const size = effectiveSize(p, v.orientation);
      maxCardW = Math.max(maxCardW, size.width);
      maxCardH = Math.max(maxCardH, size.height);
    }
    const scaleW = availW / (cols * (maxCardW + 40));
    const scaleH = availH / (rows * (maxCardH + 80));
    let bestZoom = Math.min(scaleW, scaleH);
    bestZoom = Math.max(0.2, Math.min(1.2, Math.round(bestZoom * 20) / 20));
    get().setAllZoom(bestZoom);
  },
  setUrlDraft(u) {
    set({ urlDraft: u });
  },

  applyUrl(u) {
    const url = normalizeUrl(u);
    if (url && url !== 'about:blank') {
      b.runtime?.sendMessage?.({ type: 'vg/prepare-url', url }).catch(() => {});
    }
    set((s) => ({
      model: {
        ...s.model,
        url,
        viewports: s.model.viewports.map((v) => ({ ...v, url })),
      },
      urlDraft: url,
    }));
    schedulePersist(get);
  },

  reloadAllFrames() {
    const currentUrl = get().model.url;
    if (currentUrl) {
      get().applyUrl(currentUrl);
    }
  },

  addDevice(profile, orientation) {
    const { model } = get();
    const check = canAddViewports(model.viewports.length, 1);
    if (!check.ok) return get().showToast(check.reason!);
    const vp: ViewportState = {
      id: uid('vp'),
      deviceId: profile.custom ? profile.id : profile.id,
      custom: profile.custom ? profile : undefined,
      orientation: orientation ?? profile.defaultOrientation,
      zoom: 0.5,
      minimized: false,
      hidden: false,
      url: model.url,
    };
    set((s) => ({ model: { ...s.model, viewports: [...s.model.viewports, vp] }, focusedId: vp.id }));
    if (check.warn) get().showToast(`More than 8 viewports — performance may drop`);
    schedulePersist(get);
  },

  addPreset(name) {
    const preset = BUILTIN_PRESETS.find((p) => p.name === name);
    if (!preset) return;
    const check = canAddViewports(0, preset.deviceIds.length);
    if (!check.ok) return get().showToast(check.reason!);
    const viewports: ViewportState[] = preset.deviceIds.map((deviceId) => {
      const d = BUILTIN_DEVICES.find((x) => x.id === deviceId) ?? BUILTIN_DEVICES[0]!;
      return {
        id: uid('vp'),
        deviceId,
        orientation: d.defaultOrientation,
        zoom: 0.4,
        minimized: false,
        hidden: false,
        url: get().model.url,
      };
    });
    set((s) => ({ model: { ...s.model, viewports } }));
    schedulePersist(get);
  },

  addCustom(input) {
    const profile = makeCustomDevice(input);
    set((s) => ({ customDevices: [...s.customDevices, profile] }));
    get().addDevice(profile);
  },

  removeViewport(id) {
    set((s) => ({
      model: { ...s.model, viewports: s.model.viewports.filter((v) => v.id !== id) },
      focusedId: s.focusedId === id ? null : s.focusedId,
    }));
    schedulePersist(get);
  },

  duplicate(id) {
    const list = get().model.viewports;
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) return;
    const v = list[idx]!;
    const check = canAddViewports(list.length, 1);
    if (!check.ok) return get().showToast(check.reason!);
    const copy = duplicateViewport(v, uid('vp'));
    const nextList = [...list];
    nextList.splice(idx + 1, 0, copy);
    set((s) => ({ model: { ...s.model, viewports: nextList }, focusedId: copy.id }));
    schedulePersist(get);
  },

  toggleHidden(id) {
    set((s) => ({
      model: { ...s.model, viewports: s.model.viewports.map((v) => (v.id === id ? nextHidden(v) : v)) },
    }));
    schedulePersist(get);
  },

  toggleMinimized(id) {
    set((s) => ({
      model: { ...s.model, viewports: s.model.viewports.map((v) => (v.id === id ? nextMinimized(v) : v)) },
    }));
    schedulePersist(get);
  },

  toggleOrientation(id) {
    set((s) => ({
      model: { ...s.model, viewports: s.model.viewports.map((v) => (v.id === id ? rotated(v) : v)) },
    }));
    schedulePersist(get);
  },

  setZoom(id, zoom) {
    const z = clampZoom(zoom);
    set((s) => ({
      model: { ...s.model, viewports: s.model.viewports.map((v) => (v.id === id ? { ...v, zoom: z } : v)) },
    }));
    schedulePersist(get);
  },

  setLayout(mode) {
    set((s) => ({ model: { ...s.model, layout: mode } }));
    schedulePersist(get);
  },

  setAlignItems(mode) {
    set((s) => ({ model: { ...s.model, alignItems: mode } }));
    schedulePersist(get);
  },

  setJustifyContent(mode) {
    set((s) => ({ model: { ...s.model, justifyContent: mode } }));
    schedulePersist(get);
  },

  setPosition(id, pos) {
    set((s) => ({
      model: {
        ...s.model,
        viewports: s.model.viewports.map((v) => (v.id === id ? { ...v, position: pos } : v)),
      },
    }));
    schedulePersist(get);
  },

  autoAlignAll() {
    const sState = get();
    const visible = sState.visibleViewports();
    if (visible.length === 0) return;

    const boundsList = visible.map((v) => {
      const p = sState.profileOf(v);
      const { width, height } = effectiveSize(p, v.orientation);
      const cardW = Math.round(width * v.zoom) + 24;
      const cardH = Math.round(height * v.zoom) + 60;
      return { id: v.id, width: cardW, height: cardH };
    });

    const cols = gridColumns(visible.length, 'grid');
    const posMap = autoAlignPositions(boundsList, cols, 40, 40, 24, 24);

    set((s) => ({
      model: {
        ...s.model,
        viewports: s.model.viewports.map((v) => {
          const pos = posMap.get(v.id);
          return pos ? { ...v, position: pos } : v;
        }),
      },
    }));
    schedulePersist(get);
  },

  reorder(from, to) {
    set((s) => ({ model: { ...s.model, viewports: moveViewport(s.model.viewports, from, to) } }));
    schedulePersist(get);
  },

  reorderById(fromId, toId) {
    const list = get().model.viewports;
    const from = list.findIndex((v) => v.id === fromId);
    const to = list.findIndex((v) => v.id === toId);
    if (from !== -1 && to !== -1 && from !== to) {
      set((s) => ({ model: { ...s.model, viewports: moveViewport(s.model.viewports, from, to) } }));
      schedulePersist(get);
    }
  },

  focus(id) {
    set({ focusedId: id });
  },
  toggleFocusMode() {
    set((s) => ({ focusMode: !s.focusMode }));
  },

  setSync(channel, value) {
    set((s) => ({ model: { ...s.model, sync: { ...s.model.sync, [channel]: value } } }));
    schedulePersist(get);
  },
  setAllSync(value) {
    set((s) => ({
      model: {
        ...s.model,
        sync: Object.fromEntries(Object.keys(s.model.sync).map((k) => [k, value])) as unknown as WorkspaceModel['sync'],
      },
    }));
    schedulePersist(get);
  },

  toggleTheme() {
    set((s) => {
      const theme = s.model.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = theme;
      return { model: { ...s.model, theme } };
    });
    schedulePersist(get);
  },

  toggleFrames() {
    set((s) => ({ model: { ...s.model, frames: !s.model.frames } }));
    schedulePersist(get);
  },

  setIssues(issues) {
    set({ issues });
  },
  mergeScanResult(viewportId, issues) {
    set((s) => {
      const others = s.issues.filter((i) => i.viewportId !== viewportId);
      const added: Issue[] = issues.map((i) => ({ ...i, viewportId }));
      return { issues: [...others, ...added] };
    });
  },
  clearIssues() {
    set({ issues: [] });
  },
  setScanning(v) {
    set({ scanning: v });
  },
  setPickerOpen(v) {
    set({ pickerOpen: v });
  },
  setDrawerOpen(v) {
    set({ drawerOpen: v });
  },
  setCompareOpen(v, mode) {
    set((s) => ({ compareOpen: v, compareMode: mode || s.compareMode || 'split' }));
  },
  setCompareMode(mode) {
    set({ compareMode: mode });
  },
  setBenchmarkOpen(v) {
    set({ benchmarkOpen: v });
  },
  setColorScheme(id, scheme) {
    set((s) => ({
      model: {
        ...s.model,
        viewports: s.model.viewports.map((v) => (v.id === id ? { ...v, colorScheme: scheme } : v)),
      },
    }));
    schedulePersist(get);
  },
  setFrameFinish(id, finish) {
    set((s) => ({
      model: {
        ...s.model,
        viewports: s.model.viewports.map((v) => (v.id === id ? { ...v, frameFinish: finish } : v)),
      },
    }));
    schedulePersist(get);
  },
  toggleTouchCursor() {
    set((s) => ({
      model: { ...s.model, touchCursor: !s.model.touchCursor },
    }));
    schedulePersist(get);
  },

  showToast(msg) {
    set({ toast: msg || null });
  },

  saveAs(name) {
    const key = name.trim() || 'Workspace';
    set((s) => ({ savedWorkspaces: { ...s.savedWorkspaces, [key]: structuredClone(s.model) }, model: { ...s.model, name: key } }));
    schedulePersist(get);
    get().showToast(`Saved "${key}"`);
  },
  loadSaved(name) {
    const m = get().savedWorkspaces[name];
    if (!m) return;
    const parsed = parseWorkspace(structuredClone(m));
    if (parsed.ok && parsed.model) {
      set({ model: { ...parsed.model, name }, urlDraft: parsed.model.url });
      schedulePersist(get);
      get().showToast(`Loaded "${name}"`);
    }
  },
  deleteSaved(name) {
    set((s) => {
      const next = { ...s.savedWorkspaces };
      delete next[name];
      return { savedWorkspaces: next };
    });
    schedulePersist(get);
  },

  setViewportUrl(id, url) {
    const u = normalizeUrl(url);
    set((s) => ({
      model: { ...s.model, viewports: s.model.viewports.map((v) => (v.id === id ? { ...v, url: u } : v)) },
    }));
    schedulePersist(get);
  },
}));

export function normalizeUrl(raw: string): string {
  const u = raw.trim();
  if (!u) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) return u;
  if (/^localhost(:\d+)?/i.test(u) || /^\d{1,3}(\.\d{1,3}){3}(:\d+)?/.test(u)) return `http://${u}`;
  if (u.includes('.') && !u.includes(' ')) return `https://${u}`;
  return `https://www.google.com/search?q=${encodeURIComponent(u)}`;
}

export { effectiveSize, swapOrientation, DEFAULT_SYNC, MAX_VIEWPORTS };
