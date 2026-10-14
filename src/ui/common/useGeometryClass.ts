import { useId, useLayoutEffect } from 'react';

/** Only numeric custom properties enter the stylesheet; no user CSS is accepted. */
export function useGeometryClass(values: Record<string, number>): string {
  const id = `vg-geometry-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const declarations = Object.entries(values)
    .filter(([key, value]) => /^--vg-[a-z-]+$/.test(key) && Number.isFinite(value))
    .map(([key, value]) => `${key}:${value}`).join(';');
  useLayoutEffect(() => {
    const sheet = document.createElement('style');
    document.head.appendChild(sheet);
    sheet.sheet?.insertRule(`.${id}{${declarations}}`, 0);
    return () => sheet.remove();
  }, [id, declarations]);
  return id;
}
