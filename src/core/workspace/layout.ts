import type { DeviceProfile, Orientation, ViewportState, LayoutMode } from '../types';
import { MAX_VIEWPORTS, VIEWPORT_WARN } from '../types';

/** Logical (CSS px) size for a device in a given orientation. */
export function effectiveSize(p: DeviceProfile, o: Orientation): { width: number; height: number } {
  const min = Math.min(p.width, p.height);
  const max = Math.max(p.width, p.height);
  return o === 'landscape' ? { width: max, height: min } : { width: min, height: max };
}

export function swapOrientation(o: Orientation): Orientation {
  return o === 'portrait' ? 'landscape' : 'portrait';
}

export function clampZoom(z: number): number {
  if (!Number.isFinite(z)) return 1;
  return Math.min(3, Math.max(0.1, z));
}

/** Displayed size after visual zoom (frame/box size, NOT logical viewport). */
export function displayedSize(
  logical: { width: number; height: number },
  zoom: number,
): { width: number; height: number } {
  const z = clampZoom(zoom);
  return { width: Math.round(logical.width * z), height: Math.round(logical.height * z) };
}

export function canAddViewports(currentCount: number, add = 1): { ok: boolean; warn: boolean; reason?: string } {
  if (currentCount + add > MAX_VIEWPORTS) {
    return { ok: false, warn: false, reason: `Viewport limit is ${MAX_VIEWPORTS} (performance)` };
  }
  return { ok: true, warn: currentCount + add > VIEWPORT_WARN };
}

export function moveViewport<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length) return list;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

export function nextHidden(v: ViewportState): ViewportState {
  return { ...v, hidden: !v.hidden };
}

export function nextMinimized(v: ViewportState): ViewportState {
  return { ...v, minimized: !v.minimized };
}

export function duplicateViewport(v: ViewportState, newId: string): ViewportState {
  return { ...v, id: newId };
}

export function rotated(v: ViewportState): ViewportState {
  return { ...v, orientation: swapOrientation(v.orientation) };
}

/** Simple layout helper for the grid mode column count. */
export function gridColumns(count: number, mode: LayoutMode): number {
  if (mode === 'row') return count;
  if (mode === 'col') return 1;
  return Math.max(1, Math.ceil(Math.sqrt(count)));
}
