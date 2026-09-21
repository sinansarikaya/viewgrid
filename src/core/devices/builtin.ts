import type { DeviceProfile } from '../types';

/**
 * Built-in preset catalog. Values are common public CSS-viewport sizes;
 * provenance/verification tracked in docs/DEVICE_SPEC.md §5 (data-only updates).
 */
const ios = (v: string) =>
  `Mozilla/5.0 (iPhone; CPU iPhone OS ${v} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${v.split('_')[0]}.0 Mobile/15E148 Safari/604.1`;
const android = (model: string) =>
  `Mozilla/5.0 (Linux; Android 14; ${model}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36`;
const androidTablet = (model: string) =>
  `Mozilla/5.0 (Linux; Android 14; ${model}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36`;
const macSafari =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const win =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const phone = (
  id: string,
  name: string,
  width: number,
  height: number,
  dpr: number,
  ua: string,
  frame: string,
  notch: string,
  safeTop = 47,
  safeBottom = 34,
): DeviceProfile => ({
  id,
  name,
  category: 'phone',
  width,
  height,
  devicePixelRatio: dpr,
  userAgent: ua,
  touchSupport: true,
  mobile: true,
  defaultOrientation: 'portrait',
  safeArea: { top: safeTop, bottom: safeBottom, left: 0, right: 0 },
  deviceFrame: { type: frame, notch, statusBar: 'ios' },
});

const tablet = (
  id: string,
  name: string,
  width: number,
  height: number,
  dpr: number,
  ua: string,
): DeviceProfile => ({
  id,
  name,
  category: 'tablet',
  width,
  height,
  devicePixelRatio: dpr,
  userAgent: ua,
  touchSupport: true,
  mobile: true,
  defaultOrientation: 'portrait',
  safeArea: { top: 24, bottom: 20, left: 0, right: 0 },
  deviceFrame: { type: 'ipad', notch: 'none', statusBar: 'ios' },
});

const desktopLike = (
  id: string,
  name: string,
  category: 'laptop' | 'desktop',
  width: number,
  height: number,
  ua: string,
): DeviceProfile => ({
  id,
  name,
  category,
  width,
  height,
  devicePixelRatio: 1,
  userAgent: ua,
  touchSupport: false,
  mobile: false,
  defaultOrientation: 'landscape',
  safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
  deviceFrame: { type: category === 'laptop' ? 'laptop' : 'desktop', notch: 'none', statusBar: 'none' },
});

export const BUILTIN_DEVICES: DeviceProfile[] = [
  // — Phones —
  phone('iphone-se', 'iPhone SE', 375, 667, 2, ios('17_0'), 'iphone-classic', 'none', 0, 0),
  phone('iphone-13', 'iPhone 13 / 14', 390, 844, 3, ios('17_0'), 'iphone-notch', 'notch'),
  phone('iphone-15-pro', 'iPhone 15 Pro', 393, 852, 3, ios('17_0'), 'iphone-15', 'dynamic-island', 59, 34),
  phone('iphone-15-pro-max', 'iPhone 15 Pro Max', 430, 932, 3, ios('17_0'), 'iphone-15', 'dynamic-island', 59, 34),
  phone('pixel-8', 'Pixel 8', 412, 915, 2.625, android('Pixel 8'), 'android', 'punch-hole', 24, 0),
  phone('galaxy-s23', 'Galaxy S23', 360, 780, 3, android('SM-S911B'), 'android', 'punch-hole', 24, 0),
  phone('galaxy-a54', 'Galaxy A54', 360, 800, 2.8125, android('SM-A546B'), 'android', 'punch-hole', 24, 0),

  // — Tablets —
  tablet('ipad-mini', 'iPad mini', 744, 1133, 2, ios('17_0')),
  tablet('ipad-10', 'iPad (10th gen)', 820, 1180, 2, ios('17_0')),
  tablet('ipad-air', 'iPad Air', 820, 1180, 2, ios('17_0')),
  tablet('ipad-pro-11', 'iPad Pro 11"', 834, 1194, 2, ios('17_0')),
  tablet('ipad-pro-129', 'iPad Pro 12.9"', 1024, 1366, 2, ios('17_0')),
  tablet('galaxy-tab-s9', 'Galaxy Tab S9', 800, 1280, 2, androidTablet('SM-X710')),

  // — Laptops (widths per product spec) —
  desktopLike('laptop-1024', 'Laptop 1024', 'laptop', 1024, 768, macSafari),
  desktopLike('laptop-1280', 'Laptop 1280', 'laptop', 1280, 800, win),
  desktopLike('laptop-1366', 'Laptop 1366', 'laptop', 1366, 768, win),
  desktopLike('laptop-1440', 'Laptop 1440', 'laptop', 1440, 900, win),
  desktopLike('laptop-1536', 'Laptop 1536', 'laptop', 1536, 864, win),

  // — Desktops —
  desktopLike('desktop-1080p', 'Desktop 1080p', 'desktop', 1920, 1080, win),
  desktopLike('desktop-1440p', 'Desktop 1440p', 'desktop', 2560, 1440, win),
  desktopLike('desktop-4k', 'Desktop 4K', 'desktop', 3840, 2160, win),
];

/** Named one-click presets (PRD F-088 MVP subset). */
export const BUILTIN_PRESETS: { name: string; deviceIds: string[] }[] = [
  { name: 'Mobile Test', deviceIds: ['iphone-13', 'iphone-se', 'pixel-8'] },
  { name: 'Standard Responsive', deviceIds: ['iphone-se', 'ipad-10', 'laptop-1024', 'laptop-1280', 'laptop-1440', 'desktop-1080p'] },
  { name: 'iOS + Android', deviceIds: ['iphone-15-pro', 'pixel-8'] },
  { name: 'Tablet Check', deviceIds: ['ipad-air', 'galaxy-tab-s9'] },
  { name: 'Full House', deviceIds: ['iphone-15-pro', 'ipad-air', 'laptop-1280', 'desktop-1080p'] },
];
