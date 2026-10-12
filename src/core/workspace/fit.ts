import type { LayoutMode } from '../types';

/** Equal grid cells, independent uniform scales; CSS viewport sizes stay intact. */
export function fitGridZooms(sizes: { width: number; height: number }[], area: { width: number; height: number }): number[] {
  if (!sizes.length) return [];
  // clientWidth includes the canvas's 12 px padding on each side; the CSS
  // container query uses its content box.
  const columns = area.width - 24 <= 700 ? 1 : Math.ceil(Math.sqrt(sizes.length));
  const rows = Math.ceil(sizes.length / columns);
  const width = Math.max(1, (area.width - 24 - (columns - 1) * 24) / columns - 40);
  const height = Math.max(1, (area.height - 24 - (rows - 1) * 24) / rows - 80);
  return sizes.map(size => Math.max(0.2, Math.min(1.2, Math.floor(Math.min(width / size.width, height / size.height) * 20) / 20)));
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
  const width = Math.max(...sizes.map((size) => size.width));
  const height = Math.max(...sizes.map((size) => size.height));
  const usableWidth = Math.max(1, area.width - 24 - (columns - 1) * gap - columns * 40);
  const usableHeight = Math.max(1, area.height - 24 - (rows - 1) * gap - rows * 80);
  return Math.max(0.2, Math.min(1.2, Math.floor(Math.min(usableWidth / (columns * width), usableHeight / (rows * height)) * 20) / 20));
}
