import type { WorkspaceModel, ViewportState, SyncFlags, LayoutMode, Orientation, DeviceProfile } from '../types';
import { DEFAULT_SYNC, MAX_VIEWPORTS } from '../types';
import { clampZoom } from './layout';

export interface ParseResult {
  ok: boolean;
  model?: WorkspaceModel;
  errors: string[];
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';

function parseViewport(v: unknown, errors: string[], i: number): ViewportState | null {
  if (!isObj(v)) {
    errors.push(`viewports[${i}] not an object`);
    return null;
  }
  if (typeof v.id !== 'string') {
    errors.push(`viewports[${i}].id missing`);
    return null;
  }
  let custom: DeviceProfile | undefined;
  if (v.custom !== undefined) {
    if (!isObj(v.custom)) {
      errors.push(`viewports[${i}].custom invalid`);
      return null;
    }
    custom = v.custom as unknown as DeviceProfile;
  }
  return {
    id: v.id,
    deviceId: typeof v.deviceId === 'string' ? v.deviceId : 'custom',
    custom,
    orientation: v.orientation === 'landscape' ? 'landscape' : 'portrait',
    zoom: clampZoom(typeof v.zoom === 'number' ? v.zoom : 1),
    minimized: !!v.minimized,
    hidden: !!v.hidden,
    url: typeof v.url === 'string' ? v.url : '',
  };
}

/** Validates + normalizes an untrusted object (import / storage). */
export function parseWorkspace(input: unknown): ParseResult {
  const errors: string[] = [];
  if (!isObj(input)) return { ok: false, errors: ['not an object'] };
  if (input.schemaVersion !== 1) errors.push(`unsupported schemaVersion: ${String(input.schemaVersion)}`);
  const viewports: ViewportState[] = [];
  if (Array.isArray(input.viewports)) {
    input.viewports.slice(0, MAX_VIEWPORTS).forEach((v, i) => {
      const vp = parseViewport(v, errors, i);
      if (vp) viewports.push(vp);
    });
  }
  const sync: SyncFlags = { ...DEFAULT_SYNC };
  const syncIn = input.sync;
  if (isObj(syncIn)) {
    (Object.keys(sync) as (keyof SyncFlags)[]).forEach((k) => {
      if (typeof syncIn[k] === 'boolean') sync[k] = syncIn[k] as boolean;
    });
  }
  const model: WorkspaceModel = {
    schemaVersion: 1,
    name: typeof input.name === 'string' ? input.name : 'Workspace',
    url: typeof input.url === 'string' ? input.url : '',
    viewports,
    layout: (['grid', 'row', 'col'] as LayoutMode[]).includes(input.layout as LayoutMode)
      ? (input.layout as LayoutMode)
      : 'grid',
    sync,
    theme: input.theme === 'light' ? 'light' : 'dark',
    frames: input.frames !== false,
  };
  return { ok: errors.length === 0, model, errors };
}

export function serializeWorkspace(model: WorkspaceModel): string {
  return JSON.stringify(model, null, 2);
}

export function deserializeWorkspace(json: string): ParseResult {
  try {
    return parseWorkspace(JSON.parse(json));
  } catch (e) {
    return { ok: false, errors: [`invalid JSON: ${(e as Error).message}`] };
  }
}

export function defaultWorkspace(url = ''): WorkspaceModel {
  return {
    schemaVersion: 1,
    name: 'Workspace',
    url,
    viewports: [],
    layout: 'grid',
    sync: { ...DEFAULT_SYNC },
    theme: 'dark',
    frames: true,
  };
}

export type { Orientation };
