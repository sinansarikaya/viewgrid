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

export interface Bounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GuideLine {
  type: 'v' | 'h';
  pos: number;
}

export function autoAlignPositions(
  boundsList: Array<{ id: string; width: number; height: number }>,
  columns: number,
  gapX = 40,
  gapY = 40,
  paddingX = 24,
  paddingY = 24,
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  if (boundsList.length === 0) return result;

  const cols = Math.max(1, columns);
  const rows = Math.ceil(boundsList.length / cols);

  const colWidths = new Array(cols).fill(0);
  const rowHeights = new Array(rows).fill(0);

  boundsList.forEach((b, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    colWidths[col] = Math.max(colWidths[col]!, b.width);
    rowHeights[row] = Math.max(rowHeights[row]!, b.height);
  });

  const colX = new Array(cols).fill(0);
  let curX = paddingX;
  for (let c = 0; c < cols; c++) {
    colX[c] = curX;
    curX += colWidths[c]! + gapX;
  }

  const rowY = new Array(rows).fill(0);
  let curY = paddingY;
  for (let r = 0; r < rows; r++) {
    rowY[r] = curY;
    curY += rowHeights[r]! + gapY;
  }

  boundsList.forEach((b, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    result.set(b.id, { x: colX[col]!, y: rowY[row]! });
  });

  return result;
}

export function calculateSnapGuides(
  target: { x: number; y: number; width: number; height: number },
  others: Bounds[],
  threshold = 10,
): { x: number; y: number; guides: GuideLine[] } {
  let snappedX = target.x;
  let snappedY = target.y;
  const guides: GuideLine[] = [];

  const tL = target.x;
  const tR = target.x + target.width;
  const tCX = target.x + target.width / 2;

  const tT = target.y;
  const tB = target.y + target.height;
  const tCY = target.y + target.height / 2;

  let bestDiffX = threshold + 1;
  let bestDiffY = threshold + 1;

  for (const o of others) {
    const oL = o.x;
    const oR = o.x + o.width;
    const oCX = o.x + o.width / 2;

    const oT = o.y;
    const oB = o.y + o.height;
    const oCY = o.y + o.height / 2;

    // X axis checks
    const xPairs = [
      { diff: Math.abs(tL - oL), snap: oL, guide: oL },
      { diff: Math.abs(tR - oR), snap: oR - target.width, guide: oR },
      { diff: Math.abs(tL - oR), snap: oR, guide: oR },
      { diff: Math.abs(tR - oL), snap: oL - target.width, guide: oL },
      { diff: Math.abs(tCX - oCX), snap: oCX - target.width / 2, guide: oCX },
    ];

    for (const p of xPairs) {
      if (p.diff <= threshold && p.diff < bestDiffX) {
        bestDiffX = p.diff;
        snappedX = p.snap;
        guides.push({ type: 'v', pos: p.guide });
      }
    }

    // Y axis checks
    const yPairs = [
      { diff: Math.abs(tT - oT), snap: oT, guide: oT },
      { diff: Math.abs(tB - oB), snap: oB - target.height, guide: oB },
      { diff: Math.abs(tT - oB), snap: oB, guide: oB },
      { diff: Math.abs(tB - oT), snap: oT - target.height, guide: oT },
      { diff: Math.abs(tCY - oCY), snap: oCY - target.height / 2, guide: oCY },
    ];

    for (const p of yPairs) {
      if (p.diff <= threshold && p.diff < bestDiffY) {
        bestDiffY = p.diff;
        snappedY = p.snap;
        guides.push({ type: 'h', pos: p.guide });
      }
    }
  }

  const uniqueGuides: GuideLine[] = [];
  const seen = new Set<string>();
  for (const g of guides) {
    const key = `${g.type}:${Math.round(g.pos)}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueGuides.push(g);
    }
  }

  return { x: Math.round(snappedX), y: Math.round(snappedY), guides: uniqueGuides };
}
