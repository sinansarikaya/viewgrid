import type { LayoutMode } from '../types';

/** Equal grid cells, independent uniform scales; CSS viewport sizes stay intact. */
export function fitGridZooms(sizes: { width: number; height: number }[], area: { width: number; height: number }, chrome?: { fixedWidth: number; fixedHeight: number; scaledWidth: number; scaledHeight: number }[]): number[] {
  if (!sizes.length) return [];
  // clientWidth includes the canvas's 12 px padding on each side; the CSS
  // container query uses its content box.
  const columns = area.width - 24 <= 700 ? 1 : Math.ceil(Math.sqrt(sizes.length));
  const rows = Math.ceil(sizes.length / columns);
  const width = Math.max(1, (area.width - 24 - (columns - 1) * 16) / columns);
  const height = Math.max(1, (area.height - 24 - (rows - 1) * 16) / rows);
  return sizes.map((size, index) => {
    const frame = chrome?.[index] ?? { fixedWidth: 32, fixedHeight: 80, scaledWidth: 0, scaledHeight: 0 };
    return Math.max(0.01, Math.min(3, Math.floor(Math.min(Math.max(1, width - frame.fixedWidth) / (size.width + frame.scaledWidth), Math.max(1, height - frame.fixedHeight) / (size.height + frame.scaledHeight)) * 100) / 100));
  });
}

/** Display scale only: never alters the logical CSS viewport. */
export function fitWorkspaceZoom(
  sizes: { width: number; height: number }[],
  area: { width: number; height: number },
  layout: LayoutMode,
): number {
  if (!sizes.length) return 1;
  const columns = layout === 'row' ? sizes.length : layout === 'col' ? 1 : Math.ceil(Math.sqrt(sizes.length));
  const rows = Math.ceil(sizes.length / columns);
  const gap = layout === 'grid' ? 24 : 20;
  const width = layout === 'row' ? sizes.reduce((sum,size) => sum + size.width, 0) / columns : Math.max(...sizes.map((size) => size.width));
  const height = layout === 'col' ? sizes.reduce((sum,size) => sum + size.height, 0) / rows : Math.max(...sizes.map((size) => size.height));
  const usableWidth = Math.max(1, area.width - 24 - (columns - 1) * gap - columns * 40);
  const usableHeight = Math.max(1, area.height - 24 - (rows - 1) * gap - rows * 80);
  return Math.max(0.01, Math.min(3, Math.floor(Math.min(usableWidth / (columns * width), usableHeight / (rows * height)) * 100) / 100));
}
