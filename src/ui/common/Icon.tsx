import React from 'react';
import s from './Icon.module.css';

export type IconName =
  | 'settings'
  | 'menu'
  | 'close'
  | 'shield'
  | 'alertTriangle'
  | 'zap'
  | 'inbox'
  | 'camera'
  | 'moon'
  | 'sun'
  | 'halfMoon'
  | 'square'
  | 'minus'
  | 'eye'
  | 'eyeOff'
  | 'chevronRight'
  | 'chevronLeft'
  | 'chevronUp'
  | 'chevronDown'
  | 'deviceMobile'
  | 'deviceTablet'
  | 'deviceLaptop'
  | 'deviceDesktop'
  | 'tools'
  | 'refresh'
  | 'orientation'
  | 'folder'
  | 'arrowUp'
  | 'arrowDown'
  | 'arrowLeft'
  | 'arrowRight'
  | 'arrowLeftRight'
  | 'touchCursor'
  | 'frame'
  | 'frameChecked'
  | 'focus'
  | 'cornerExpand'
  | 'scrollToTop'
  | 'search'
  | 'scale'
  | 'palette'
  | 'star'
  | 'starFilled'
  | 'plus'
  | 'splitHorizontal'
  | 'curtain'
  | 'columns'
  | 'target'
  | 'keyboard'
  | 'trash'
  | 'layoutGrid'
  | 'layoutRow'
  | 'layoutCol'
  | 'layoutFree'
  | 'gridAlign'
  | 'globe'
  | 'check'
  | 'copy'
  | 'grip'
  | 'moreHorizontal'
  | 'radio'
  | 'radioActive';

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  name: IconName;
  size?: number | string;
  className?: string;
  title?: string;
}

function renderPath(name: IconName): React.ReactNode {
  switch (name) {
    case 'alertTriangle':
      return <><path d="m10.3 3.9-8.5 14.2A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>;
    case 'settings':
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </>
      );
    case 'orientation':
      return <><rect x="8" y="5" width="8" height="14" rx="2" /><path d="M3 8a9 9 0 0 1 16-2m0-3v3h-3M21 16a9 9 0 0 1-16 2m0 3v-3h3" /></>;
    case 'menu':
      return (
        <>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </>
      );
    case 'close':
      return (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      );
    case 'shield':
      return <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
    case 'zap':
      return <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />;
    case 'inbox':
      return (
        <>
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </>
      );
    case 'camera':
      return (
        <>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </>
      );
    case 'moon':
      return <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />;
    case 'sun':
      return (
        <>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </>
      );
    case 'halfMoon':
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" />
        </>
      );
    case 'square':
      return <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />;
    case 'minus':
      return <line x1="5" y1="12" x2="19" y2="12" />;
    case 'eye':
      return (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      );
    case 'eyeOff':
      return (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="23" x2="23" y2="1" />
        </>
      );
    case 'chevronRight':
      return <polyline points="9 18 15 12 9 6" />;
    case 'chevronLeft':
      return <polyline points="15 18 9 12 15 6" />;
    case 'chevronUp':
      return <polyline points="18 15 12 9 6 15" />;
    case 'chevronDown':
      return <polyline points="6 9 12 15 18 9" />;
    case 'deviceMobile':
      return (
        <>
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </>
      );
    case 'deviceTablet':
      return (
        <>
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </>
      );
    case 'deviceLaptop':
      return (
        <>
          <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55A1 1 0 0 1 20.38 20H3.62a1 1 0 0 1-.9-1.45L4 16" />
        </>
      );
    case 'deviceDesktop':
      return (
        <>
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </>
      );
    case 'tools':
      return (
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      );
    case 'refresh':
      return (
        <>
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </>
      );
    case 'folder':
      return <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />;
    case 'arrowUp':
      return (
        <>
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </>
      );
    case 'arrowDown':
      return (
        <>
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </>
      );
    case 'arrowLeft':
      return (
        <>
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </>
      );
    case 'arrowRight':
      return (
        <>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </>
      );
    case 'arrowLeftRight':
      return (
        <>
          <polyline points="16 3 21 8 16 13" />
          <line x1="21" y1="8" x2="9" y2="8" />
          <polyline points="8 21 3 16 8 11" />
          <line x1="3" y1="16" x2="15" y2="16" />
        </>
      );
    case 'touchCursor':
      return (
        <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v4M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-3a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
      );
    case 'frame':
      return (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <rect x="7" y="7" width="10" height="10" rx="1" />
        </>
      );
    case 'frameChecked':
      return (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" />
        </>
      );
    case 'focus':
      return <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />;
    case 'cornerExpand':
      return <path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6" />;
    case 'scrollToTop':
      return (
        <>
          <line x1="4" y1="4" x2="20" y2="4" />
          <polyline points="16 12 12 8 8 12" />
          <line x1="12" y1="8" x2="12" y2="20" />
        </>
      );
    case 'search':
      return (
        <>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </>
      );
    case 'scale':
      return (
        <>
          <path d="m16 16 3-8 3 8a3 3 0 0 1-6 0v0ZM2 16l3-8 3 8a3 3 0 0 1-6 0v0Z" />
          <path d="M12 3v18M7 21h10M4 8l8-5 8 5" />
        </>
      );
    case 'palette':
      return (
        <>
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.5-.75 1.5-1.5 0-.42-.17-.83-.42-1.17-.25-.33-.42-.75-.42-1.17 0-.92.75-1.66 1.66-1.66H16c3.31 0 6-2.69 6-6 0-5.5-4.5-10-10-10z" />
        </>
      );
    case 'star':
      return (
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      );
    case 'starFilled':
      return (
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          fill="currentColor"
        />
      );
    case 'plus':
      return (
        <>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </>
      );
    case 'splitHorizontal':
      return (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="3" x2="12" y2="21" strokeDasharray="2 2" />
        </>
      );
    case 'curtain':
      return (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="6" y1="3" x2="6" y2="21" strokeOpacity="0.5" />
        </>
      );
    case 'columns':
      return (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </>
      );
    case 'target':
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </>
      );
    case 'keyboard':
      return (
        <>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="6" y1="8" x2="6.01" y2="8" />
          <line x1="10" y1="8" x2="10.01" y2="8" />
          <line x1="14" y1="8" x2="14.01" y2="8" />
          <line x1="18" y1="8" x2="18.01" y2="8" />
          <line x1="6" y1="12" x2="6.01" y2="12" />
          <line x1="10" y1="12" x2="10.01" y2="12" />
          <line x1="14" y1="12" x2="14.01" y2="12" />
          <line x1="18" y1="12" x2="18.01" y2="12" />
          <line x1="7" y1="16" x2="17" y2="16" />
        </>
      );
    case 'trash':
      return (
        <>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </>
      );
    case 'layoutGrid':
      return (
        <>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </>
      );
    case 'layoutRow':
      return (
        <>
          <rect x="3" y="4" width="18" height="6" rx="1" />
          <rect x="3" y="14" width="18" height="6" rx="1" />
        </>
      );
    case 'layoutCol':
      return (
        <>
          <rect x="4" y="3" width="6" height="18" rx="1" />
          <rect x="14" y="3" width="6" height="18" rx="1" />
        </>
      );
    case 'layoutFree':
      return (
        <>
          <polyline points="5 9 2 12 5 15" />
          <polyline points="9 5 12 2 15 5" />
          <polyline points="15 19 12 22 9 19" />
          <polyline points="19 9 22 12 19 15" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="12" y1="2" x2="12" y2="22" />
        </>
      );
    case 'gridAlign':
      return (
        <>
          <rect x="3" y="3" width="18" height="18" rx="1" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </>
      );
    case 'globe':
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </>
      );
    case 'check':
      return <polyline points="20 6 9 17 4 12" />;
    case 'copy':
      return (
        <>
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </>
      );
    case 'grip':
      return (
        <>
          <circle cx="9" cy="5" r="1" fill="currentColor" />
          <circle cx="9" cy="12" r="1" fill="currentColor" />
          <circle cx="9" cy="19" r="1" fill="currentColor" />
          <circle cx="15" cy="5" r="1" fill="currentColor" />
          <circle cx="15" cy="12" r="1" fill="currentColor" />
          <circle cx="15" cy="19" r="1" fill="currentColor" />
        </>
      );
    case 'moreHorizontal':
      return (
        <>
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="19" cy="12" r="1.5" fill="currentColor" />
          <circle cx="5" cy="12" r="1.5" fill="currentColor" />
        </>
      );
    case 'radio':
      return <circle cx="12" cy="12" r="8" />;
    case 'radioActive':
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </>
      );
    default:
      return null;
  }
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 16,
  className = '',
  title,
  'aria-hidden': ariaHidden,
  ...props
}) => {
  const isAriaHidden =
    ariaHidden !== undefined
      ? ariaHidden
      : props['aria-label'] || title
      ? undefined
      : 'true';

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={[s.icon, className].filter(Boolean).join(' ')}
      aria-hidden={isAriaHidden}
      {...props}
    >
      {title && <title>{title}</title>}
      {renderPath(name)}
    </svg>
  );
};
