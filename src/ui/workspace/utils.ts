/**
 * UI helper utilities for ViewGrid workspace
 */
export function getDeviceCategoryIcon(cat?: string): string {
  switch (cat) {
    case 'phone':
      return '📱';
    case 'tablet':
      return '📟';
    case 'laptop':
      return '💻';
    case 'desktop':
      return '🖥️';
    default:
      return '📐';
  }
}
