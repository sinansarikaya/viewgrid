import type { DeviceProfile } from '../types';

export interface ValidationIssue {
  path: string;
  message: string;
}

const NUM = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Validates a device profile; returns issues (empty = valid). */
export function validateDeviceProfile(p: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!p || typeof p !== 'object') return [{ path: '', message: 'not an object' }];
  const d = p as Record<string, unknown>;
  const reqNum = (key: string, min = 1) => {
    if (!NUM(d[key]) || (d[key] as number) < min) issues.push({ path: key, message: `must be number ≥ ${min}` });
  };
  if (typeof d.id !== 'string' || !d.id) issues.push({ path: 'id', message: 'required string' });
  if (typeof d.name !== 'string' || !d.name) issues.push({ path: 'name', message: 'required string' });
  reqNum('width');
  reqNum('height');
  reqNum('devicePixelRatio', 0.5);
  if (typeof d.userAgent !== 'string') issues.push({ path: 'userAgent', message: 'required string' });
  return issues;
}

/** Normalizes a user-submitted custom device draft into a DeviceProfile. */
export function makeCustomDevice(input: {
  name: string;
  width: number;
  height: number;
  dpr?: number;
}): DeviceProfile {
  const w = Math.round(Math.min(10000, Math.max(100, input.width)));
  const h = Math.round(Math.min(10000, Math.max(100, input.height)));
  return {
    id: `custom_${Date.now().toString(36)}`,
    name: input.name.trim() || `${w}×${h}`,
    category: 'custom',
    width: w,
    height: h,
    devicePixelRatio: input.dpr && input.dpr > 0 ? input.dpr : 1,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'viewgrid-custom',
    touchSupport: false,
    mobile: w < 768,
    defaultOrientation: h >= w ? 'portrait' : 'landscape',
    safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
    deviceFrame: { type: 'none', notch: 'none', statusBar: 'none' },
    favorite: false,
    custom: true,
    createdAt: Date.now(),
  };
}
