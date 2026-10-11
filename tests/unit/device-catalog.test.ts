import { describe, expect, it } from 'vitest';
import { BUILTIN_DEVICES } from '../../src/core/devices/builtin';
import {
  DEVICE_CATALOG,
  enhanceDeviceCatalogItem,
  filterCatalog,
  getDeviceBrand,
} from '../../src/core/devices/catalog';
import type { DeviceProfile } from '../../src/core/types';

describe('device catalog & metadata', () => {
  it('preserves all BUILTIN_DEVICES IDs and dimensions in the catalog', () => {
    expect(DEVICE_CATALOG).toHaveLength(BUILTIN_DEVICES.length);
    for (const builtin of BUILTIN_DEVICES) {
      const match = DEVICE_CATALOG.find((d) => d.id === builtin.id);
      expect(match).toBeDefined();
      expect(match?.width).toBe(builtin.width);
      expect(match?.height).toBe(builtin.height);
      expect(match?.devicePixelRatio).toBe(builtin.devicePixelRatio);
      expect(match?.category).toBe(builtin.category);
    }
  });

  it('correctly maps brands from profile metadata', () => {
    const iphone = BUILTIN_DEVICES.find((d) => d.id === 'iphone-15-pro')!;
    const pixel = BUILTIN_DEVICES.find((d) => d.id === 'pixel-8')!;
    const galaxy = BUILTIN_DEVICES.find((d) => d.id === 'galaxy-s23')!;
    const laptop = BUILTIN_DEVICES.find((d) => d.id === 'laptop-1280')!;

    expect(getDeviceBrand(iphone)).toBe('apple');
    expect(getDeviceBrand(pixel)).toBe('google');
    expect(getDeviceBrand(galaxy)).toBe('samsung');
    expect(getDeviceBrand(laptop)).toBe('generic');
  });

  it('distinguishes traced descriptor screens from unverified model presets', () => {
    for (const item of DEVICE_CATALOG) {
      expect(item.source).toBeDefined();
      expect(item.source.length).toBeGreaterThan(10);
      expect(item.provenanceNote).toBeDefined();
      expect(item.provenanceNote.toLowerCase()).toContain('css');
      expect(item.provenanceNote.toLowerCase()).not.toContain('safari emulation');
      if (item.verification === 'descriptor-screen') {
        expect(item.source).toContain('microsoft/playwright/blob/v1.58.2/');
        expect(item.verifiedAt).toBe('2026-10-11');
      } else expect(item.verifiedAt).toBeNull();
    }
    expect(DEVICE_CATALOG.find(item => item.id === 'pixel-8')?.verification).toBe('unverified');
  });

  it('includes standard desktop and laptop resolutions at the forefront', () => {
    const laptops = DEVICE_CATALOG.filter((d) => d.category === 'laptop');
    const desktops = DEVICE_CATALOG.filter((d) => d.category === 'desktop');

    const laptopWidths = laptops.map((d) => d.width);
    const desktopWidths = desktops.map((d) => d.width);

    expect(laptopWidths).toContain(1024);
    expect(laptopWidths).toContain(1280);
    expect(laptopWidths).toContain(1366);
    expect(laptopWidths).toContain(1440);
    expect(laptopWidths).toContain(1536);

    expect(desktopWidths).toContain(1920);
    expect(desktopWidths).toContain(2560);
    expect(desktopWidths).toContain(3840);
  });

  it('filters catalog accurately by category and brand', () => {
    const applePhones = filterCatalog({ category: 'phone', brand: 'apple' });
    expect(applePhones.length).toBeGreaterThan(0);
    expect(applePhones.every((d) => d.brand === 'apple' && d.category === 'phone')).toBe(true);

    const googlePhones = filterCatalog({ category: 'phone', brand: 'google' });
    expect(googlePhones.length).toBeGreaterThan(0);
    expect(googlePhones.every((d) => d.brand === 'google' && d.category === 'phone')).toBe(true);
  });

  it('filters catalog across categories using fulltext search query', () => {
    const searchPro = filterCatalog({ query: 'Pro' });
    expect(searchPro.length).toBeGreaterThan(0);
    expect(searchPro.every((d) => d.name.toLowerCase().includes('pro'))).toBe(true);

    const searchDims = filterCatalog({ query: '1920' });
    expect(searchDims.length).toBeGreaterThan(0);
    expect(searchDims.some((d) => d.id === 'desktop-1080p')).toBe(true);
  });

  it('integrates favorite and recent IDs in filtering', () => {
    const favs = filterCatalog({ category: 'favorite', favoriteIds: ['iphone-15-pro', 'laptop-1280'] });
    expect(favs.map((d) => d.id)).toEqual(['iphone-15-pro', 'laptop-1280']);

    const recents = filterCatalog({ category: 'recent', recentIds: ['pixel-8'] });
    expect(recents.map((d) => d.id)).toEqual(['pixel-8']);
    expect(filterCatalog({ category: 'recent', recentIds: ['pixel-8', 'iphone-15-pro'] }).map(d => d.id)).toEqual(['pixel-8', 'iphone-15-pro']);
  });

  it('supports custom user devices in catalog search and filtering', () => {
    const customProfile: DeviceProfile = {
      id: 'custom-foldable',
      name: 'Foldable Device',
      category: 'custom',
      width: 540,
      height: 720,
      devicePixelRatio: 2,
      userAgent: 'Mozilla/5.0 Custom',
      touchSupport: true,
      mobile: true,
      defaultOrientation: 'portrait',
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
      deviceFrame: { type: 'custom', notch: 'none', statusBar: 'none' },
      custom: true,
    };

    const enhanced = enhanceDeviceCatalogItem(customProfile);
    expect(enhanced.provenanceNote).toContain('User-defined');

    const filtered = filterCatalog({ category: 'custom', customDevices: [customProfile] });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('custom-foldable');

    const searchCustom = filterCatalog({ query: 'foldable', customDevices: [customProfile] });
    expect(searchCustom).toHaveLength(1);
    expect(searchCustom[0]?.name).toBe('Foldable Device');
  });
});
