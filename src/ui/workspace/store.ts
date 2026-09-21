import { create } from 'zustand';
import {
  DEFAULT_SYNC,
  type DeviceProfile,
  type Issue,
  type LayoutMode,
  type ViewportState,
  type WorkspaceModel,
  MAX_VIEWPORTS,
} from '../../core/types';
import { BUILTIN_DEVICES, BUILTIN_PRESETS } from '../../core/devices/builtin';
import { mergeDeviceDb } from '../../core/devices/merge';
import { makeCustomDevice } from '../../core/devices/schema';
import {
  canAddViewports,
  clampZoom,
  duplicateViewport,
  effectiveSize,
  moveViewport,
  nextHidden,
  nextMinimized,
  rotated,
  swapOrientation,
} from '../../core/workspace/layout';
import { defaultWorkspace, parseWorkspace } from '../../core/workspace/serialize';
import { uid } from '../../core/util/id';
import { b } from '../../platform/browser';

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

  // derived helpers
  profileOf(v: ViewportState): DeviceProfile;
  visibleViewports(): ViewportState[];

  // actions
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
  reorder(from: number, to: number): void;
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
  showToast(msg: string): void;
  saveAs(name: string): void;
  loadSaved(name: string): void;
  deleteSaved(name: string): void;
  setViewportUrl(id: string, url: string): void;
}

const KEY = 'viewgrid.store.v1';

function persistPayload(s: StoreState) {
  return {
    model: s.model,
    customDevices: s.customDevices,
    savedWorkspaces: s.savedWorkspaces,
    granted: undefined, // permission state is queried, not persisted
  };
}

let saveTimer: number | undefined;
function schedulePersist(get: () => StoreState) {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => void get().persist(), 400);
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
  toast: null,
  granted: false,
  urlDraft: '',

  profileOf(v) {
    if (v.custom) return v.custom;
    const all = [...BUILTIN_DEVICES, ...get().customDevices];
    return all.find((d) => d.id === v.deviceId) ?? BUILTIN_DEVICES[0]!;
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
    try {
      const raw = await b.storage!.local.get(KEY);
      const data = raw[KEY] as any;
      if (data) {
        const parsed = parseWorkspace(data.model);
        if (parsed.ok && parsed.model) model = parsed.model;
        if (Array.isArray(data.customDevices)) customDevices = data.customDevices;
        if (data.savedWorkspaces && typeof data.savedWorkspaces === 'object') savedWorkspaces = data.savedWorkspaces;
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
    let granted = false;
    try {
      granted = await b.permissions.contains({ origins: ['*://*/*'] });
    } catch {
      /* ignore */
    }
    set({ model, customDevices, savedWorkspaces, granted, urlDraft: model.url });
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
  setUrlDraft(u) {
    set({ urlDraft: u });
  },

  applyUrl(u) {
    const url = normalizeUrl(u);
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
    const v = get().model.viewports.find((x) => x.id === id);
    if (!v) return;
    const check = canAddViewports(get().model.viewports.length, 1);
    if (!check.ok) return get().showToast(check.reason!);
    set((s) => ({ model: { ...s.model, viewports: [...s.model.viewports, duplicateViewport(v, uid('vp'))] } }));
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

  reorder(from, to) {
    set((s) => ({ model: { ...s.model, viewports: moveViewport(s.model.viewports, from, to) } }));
    schedulePersist(get);
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

  showToast(msg) {
    set({ toast: msg });
    window.setTimeout(() => {
      if (get().toast === msg) set({ toast: null });
    }, 3500);
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
