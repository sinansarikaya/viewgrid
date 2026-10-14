import type { DeviceCategory, DeviceProfile } from '../types';
import { BUILTIN_DEVICES } from './builtin';

export type DeviceBrand = 'apple' | 'google' | 'samsung' | 'generic';

export interface DeviceCatalogItem extends DeviceProfile {
  brand: DeviceBrand;
  source: string;
  provenanceNote: string;
  verification: 'descriptor-screen' | 'layout-preset' | 'unverified' | 'user-defined';
  verifiedAt: string | null;
}

const DESCRIPTOR_SOURCE = 'https://github.com/microsoft/playwright/blob/v1.58.2/packages/playwright-core/src/server/deviceDescriptorsSource.json';
const VERIFIED_SCREENS: Record<string, [number, number, number]> = {
  'iphone-13': [390, 844, 3],
  'iphone-15-pro': [393, 852, 3],
  'iphone-15-pro-max': [430, 932, 3],
};

const PROVENANCE = {
  phone: 'CSS logical pixel preset (CSS px) for responsive layout testing. Hardware DPR is metadata only; browser layout DPR is not emulated.',
  tablet: 'Standard CSS logical viewport dimensions. Not a hardware or Safari engine emulation.',
  laptop: 'Standard CSS web desktop breakpoint viewport. Real device rendering depends on the local browser engine.',
  desktop: 'Standard CSS widescreen display resolution for responsive desktop layout verification.',
  custom: 'User-defined custom CSS logical viewport size.',
};

export function getDeviceBrand(profile: DeviceProfile): DeviceBrand {
  const id = profile.id.toLowerCase();
  const name = profile.name.toLowerCase();
  if (id.includes('iphone') || id.includes('ipad') || id.includes('apple') || name.includes('iphone') || name.includes('ipad')) {
    return 'apple';
  }
  if (id.includes('pixel') || name.includes('pixel')) {
    return 'google';
  }
  if (id.includes('galaxy') || id.includes('samsung') || name.includes('galaxy')) {
    return 'samsung';
  }
  return 'generic';
}

export function enhanceDeviceCatalogItem(profile: DeviceProfile): DeviceCatalogItem {
  const brand = getDeviceBrand(profile);
  const descriptor = VERIFIED_SCREENS[profile.id];
  const verified = descriptor?.[0] === profile.width && descriptor[1] === profile.height && descriptor[2] === profile.devicePixelRatio;
  const layoutPreset = profile.category === 'laptop' || profile.category === 'desktop';
  const source = verified ? DESCRIPTOR_SOURCE : 'docs/DEVICE_SPEC.md — layout preset; model dimensions not independently verified';

  const provenanceNote = profile.custom ? PROVENANCE.custom : PROVENANCE[profile.category] || PROVENANCE.laptop;

  return {
    ...profile,
    brand,
    source,
    provenanceNote,
    verification: profile.custom ? 'user-defined' : verified ? 'descriptor-screen' : layoutPreset ? 'layout-preset' : 'unverified',
    verifiedAt: verified ? '2026-10-11' : null,
  };
}

export const DEVICE_CATALOG: DeviceCatalogItem[] = BUILTIN_DEVICES.map(enhanceDeviceCatalogItem);

export interface CatalogFilterOptions {
  category?: DeviceCategory | 'all' | 'favorite' | 'recent';
  brand?: DeviceBrand | 'all';
  query?: string;
  favoriteIds?: string[];
  recentIds?: string[];
  customDevices?: DeviceProfile[];
}

export function filterCatalog(options: CatalogFilterOptions): DeviceCatalogItem[] {
  const {
    category = 'all',
    brand = 'all',
    query = '',
    favoriteIds = [],
    recentIds = [],
    customDevices = [],
  } = options;

  const customItems = customDevices.map(enhanceDeviceCatalogItem);
  const allItems = [...DEVICE_CATALOG, ...customItems];

  const trimmedQuery = query.trim().toLowerCase();

  const matches = allItems.filter((item) => {
    // 1. Text Search across all fields if query is present
    if (trimmedQuery) {
      const matchName = item.name.toLowerCase().includes(trimmedQuery);
      const matchBrand = item.brand.toLowerCase().includes(trimmedQuery);
      const matchCategory = item.category.toLowerCase().includes(trimmedQuery);
      const matchDims = `${item.width}x${item.height}`.includes(trimmedQuery) ||
        `${item.width}×${item.height}`.includes(trimmedQuery) ||
        String(item.width).includes(trimmedQuery) ||
        String(item.height).includes(trimmedQuery);

      if (!matchName && !matchBrand && !matchCategory && !matchDims) {
        return false;
      }
    }

    // 2. Category filter
    if (category === 'favorite') {
      if (!favoriteIds.includes(item.id)) return false;
    } else if (category === 'recent') {
      if (!recentIds.includes(item.id)) return false;
    } else if (category === 'custom') {
      if (!item.custom) return false;
    } else if (category !== 'all') {
      if (item.category !== category) return false;
    }

    // 3. Brand filter (primarily for phone/tablet)
    if (brand !== 'all') {
      if (item.brand !== brand) return false;
    }

    return true;
  });
  return category === 'recent'
    ? matches.sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id))
    : matches;
}
