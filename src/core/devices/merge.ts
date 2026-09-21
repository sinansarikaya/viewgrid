import type { DeviceProfile } from '../types';
import { BUILTIN_DEVICES } from './builtin';
import { validateDeviceProfile } from './schema';

/**
 * Picker list = builtins ⊕ user custom devices (storage).
 * Custom devices never shadow builtin ids; collisions are suffixed.
 */
export function mergeDeviceDb(userDevices: DeviceProfile[]): {
  devices: DeviceProfile[];
  invalid: number;
} {
  const devices = [...BUILTIN_DEVICES];
  const seen = new Set(devices.map((d) => d.id));
  let invalid = 0;
  for (const raw of userDevices) {
    if (validateDeviceProfile(raw).length > 0) {
      invalid++;
      continue;
    }
    let d = raw;
    if (seen.has(d.id)) d = { ...d, id: `${d.id}_u${seen.size}` };
    seen.add(d.id);
    devices.push(d);
  }
  devices.sort((a, b) => {
    const rank = (c: string) => ({ phone: 0, tablet: 1, laptop: 2, desktop: 3, custom: 4 } as Record<string, number>)[c] ?? 9;
    return rank(a.category) - rank(b.category) || a.name.localeCompare(b.name);
  });
  return { devices, invalid };
}

export function findDevice(devices: DeviceProfile[], id: string): DeviceProfile | undefined {
  return devices.find((d) => d.id === id);
}
