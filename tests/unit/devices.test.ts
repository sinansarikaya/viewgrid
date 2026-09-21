import { describe, expect, it } from 'vitest';
import { BUILTIN_DEVICES, BUILTIN_PRESETS } from '../../src/core/devices/builtin';
import { mergeDeviceDb, findDevice } from '../../src/core/devices/merge';
import { makeCustomDevice, validateDeviceProfile } from '../../src/core/devices/schema';

describe('device database', () => {
  it('builtin profiles are schema-valid', () => {
    for (const d of BUILTIN_DEVICES) {
      expect(validateDeviceProfile(d), d.id).toEqual([]);
    }
  });

  it('covers required categories & the mandated laptop widths', () => {
    const cats = new Set(BUILTIN_DEVICES.map((d) => d.category));
    for (const c of ['phone', 'tablet', 'laptop', 'desktop']) expect(cats.has(c as any)).toBe(true);
    for (const w of [1024, 1280, 1366, 1440, 1536]) {
      expect(BUILTIN_DEVICES.some((d) => d.category === 'laptop' && d.width === w)).toBe(true);
    }
    expect(BUILTIN_DEVICES.some((d) => d.category === 'desktop' && d.width === 1920)).toBe(true);
    expect(BUILTIN_DEVICES.some((d) => d.category === 'desktop' && d.width === 2560)).toBe(true);
    expect(BUILTIN_DEVICES.some((d) => d.category === 'desktop' && d.width === 3840)).toBe(true);
  });

  it('builtin presets reference real devices', () => {
    for (const p of BUILTIN_PRESETS) {
      for (const id of p.deviceIds) {
        expect(findDevice(BUILTIN_DEVICES, id), `${p.name} → ${id}`).toBeTruthy();
      }
    }
  });

  it('merges user devices, rejects invalid, avoids id collisions', () => {
    const good = makeCustomDevice({ name: 'App 390', width: 390, height: 844, dpr: 3 });
    const bad: any = { id: '', name: '', width: -5 };
    const { devices, invalid } = mergeDeviceDb([good, bad, { ...good, id: 'iphone-13' }]);
    expect(invalid).toBe(1);
    expect(devices.some((d) => d.name === 'App 390')).toBe(true);
    expect(devices.filter((d) => d.id === 'iphone-13').length).toBe(1); // builtin kept
    expect(devices.length).toBe(BUILTIN_DEVICES.length + 2);
  });

  it('creates custom devices with sane clamps', () => {
    const d = makeCustomDevice({ name: '  ', width: 5, height: 99999, dpr: 0 });
    expect(d.width).toBe(100);
    expect(d.height).toBe(10000);
    expect(d.devicePixelRatio).toBe(1);
    expect(d.name).toBe('100×10000');
    expect(d.custom).toBe(true);
  });
});
