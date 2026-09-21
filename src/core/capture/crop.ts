import type { Rect } from '../types';

/** Scale of captured image vs CSS viewport (HiDPI aware). */
export function imageScale(imageNaturalWidth: number, cssViewportWidth: number): number {
  return cssViewportWidth > 0 ? imageNaturalWidth / cssViewportWidth : 1;
}

/**
 * Converts a CSS-px rect (relative to the visible viewport top-left)
 * into capture-image pixel rect, clamped to image bounds.
 * Returns null if the rect is fully outside the image.
 */
export function cropRectInImage(
  imageW: number,
  imageH: number,
  cssRect: Rect,
  scale: number,
): Rect | null {
  const x = Math.max(0, Math.round(cssRect.x * scale));
  const y = Math.max(0, Math.round(cssRect.y * scale));
  const right = Math.min(imageW, Math.round((cssRect.x + cssRect.width) * scale));
  const bottom = Math.min(imageH, Math.round((cssRect.y + cssRect.height) * scale));
  const width = right - x;
  const height = bottom - y;
  if (width <= 1 || height <= 1) return null;
  return { x, y, width, height };
}

export function captureFileName(parts: {
  device: string;
  w: number;
  h: number;
  ext: 'png' | 'jpg';
  ts?: number;
}): string {
  const safe = parts.device.replace(/[^\w.-]+/g, '_').slice(0, 40);
  const d = new Date(parts.ts ?? Date.now());
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
  return `viewgrid_${safe}_${parts.w}x${parts.h}_${stamp}.${parts.ext}`;
}
