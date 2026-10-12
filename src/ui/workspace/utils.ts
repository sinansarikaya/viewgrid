import type { IconName } from '../common/Icon';

/**
 * UI helper utilities for ViewGrid workspace
 */
export function getDeviceCategoryIconName(cat?: string): IconName {
  switch (cat) {
    case 'phone':
      return 'deviceMobile';
    case 'tablet':
      return 'deviceTablet';
    case 'laptop':
      return 'deviceLaptop';
    case 'desktop':
      return 'deviceDesktop';
    default:
      return 'gridAlign';
  }
}
