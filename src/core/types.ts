/** Shared domain models (browser-agnostic). */

export type Orientation = 'portrait' | 'landscape';

export type DeviceCategory = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'custom';

export interface DeviceProfile {
  id: string;
  name: string;
  category: DeviceCategory;
  width: number; // logical CSS px (portrait)
  height: number; // logical CSS px (portrait)
  devicePixelRatio: number; // metadata only (layout DPR is NOT emulatable — see ARCHITECTURE §11)
  userAgent: string;
  touchSupport: boolean;
  mobile: boolean;
  defaultOrientation: Orientation;
  safeArea: { top: number; bottom: number; left: number; right: number };
  deviceFrame: { type: string; notch: string; statusBar: string };
  favorite?: boolean;
  custom?: true;
  createdAt?: number;
}

export interface ViewportState {
  id: string;
  deviceId: string; // builtin id or 'custom'
  custom?: DeviceProfile; // inline custom profile
  orientation: Orientation;
  zoom: number; // visual scale (0.1–3), logical viewport unchanged
  minimized: boolean;
  hidden: boolean;
  url: string;
  colorScheme?: 'auto' | 'dark' | 'light';
  frameFinish?: string;
}

export type LayoutMode = 'grid' | 'row' | 'col';

export interface SyncFlags {
  scroll: boolean;
  click: boolean;
  nav: boolean;
  reload: boolean;
  key: boolean;
  input: boolean;
  form: boolean;
}

export type SyncChannel = keyof SyncFlags;

export interface WorkspaceModel {
  schemaVersion: 1;
  name: string;
  url: string;
  viewports: ViewportState[];
  layout: LayoutMode;
  sync: SyncFlags;
  theme: 'dark' | 'light';
  frames: boolean;
  touchCursor?: boolean;
}

export interface SyncEnvelope {
  channel: SyncChannel;
  sourceViewportId: string;
  epoch: number;
  seq: number;
  ts: number;
  payload: Record<string, unknown>;
}

export type IssueSeverity = 'critical' | 'major' | 'minor';

export interface Issue {
  id: string;
  rule: string;
  severity: IssueSeverity;
  message: string;
  viewportId: string;
  selector?: string;
  data?: Record<string, unknown>;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MeasuredElement {
  selector: string;
  tag: string;
  rect: Rect;
  text?: string;
  overflowX?: string;
  scrollWidth?: number;
  clientWidth?: number;
  isInteractive?: boolean;
}

export interface PageMetrics {
  innerWidth: number;
  innerHeight: number;
  scrollWidth: number;
  scrollHeight: number;
  elements: MeasuredElement[];
}

/** Message envelope kinds used across background ↔ content ↔ workspace. */
export type VgMessage =
  | { type: 'vg/workspace-hello' }
  | { type: 'vg/inject' }
  | { type: 'vg/agent-hello'; viewportId: string }
  | { type: 'vg/agent-event'; env: SyncEnvelope }
  | { type: 'vg/sync-relay'; env: SyncEnvelope }
  | { type: 'vg/sync-apply'; env: SyncEnvelope; excludeViewportId: string }
  | { type: 'vg/agent-cmd'; target: string[] | 'all'; cmd: string; url?: string }
  | { type: 'vg/agent-apply'; env: SyncEnvelope }
  | { type: 'vg/scan-run' }
  | { type: 'vg/scan-result'; viewportId: string; issues: Omit<Issue, 'viewportId'>[] }
  | { type: 'vg/capture'; format?: 'png' | 'jpeg'; quality?: number }
  | { type: 'vg/capture-result'; dataUrl: string }
  | { type: 'vg/error'; message: string };

export const MAX_VIEWPORTS = 16;
export const VIEWPORT_WARN = 8;
export const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5];
export const DEFAULT_SYNC: SyncFlags = {
  scroll: true,
  click: true,
  nav: true,
  reload: true,
  key: false,
  input: false,
  form: false,
};
