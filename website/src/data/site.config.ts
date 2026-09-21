/**
 * ViewGrid Official Website Configuration.
 * Centralized data store for URLs, metadata, navigation, features, and FAQs.
 */

export interface StoreLinks {
  chrome: string;
  firefox: string;
}

export interface ScreenshotItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  file?: string;
  badge: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  highlight?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const siteConfig = {
  product: {
    name: 'ViewGrid',
    tagline: 'Multi-Viewport Responsive Testing Workspace',
    subheading: 'Stop constantly resizing your browser. Test phone, tablet, laptop, and desktop viewports side-by-side with synchronized interactions, pixel-level diffing, and zero telemetry.',
    description: 'ViewGrid is a professional browser extension for Chrome and Firefox that provides a multi-viewport testing workspace. Render multiple real-time responsive viewports simultaneously, synchronize scroll and click interactions, compare breakpoints with split and curtain diff sliders, and automatically unblock X-Frame-Options and CSP headers for sub_frames.',
    version: '0.1.0',
    canonicalUrl: 'https://viewgrid.sinansarikaya.dev',
    repositoryUrl: 'https://github.com/sinansarikaya/viewgrid',
    issuesUrl: 'https://github.com/sinansarikaya/viewgrid/issues',
    releasesUrl: 'https://github.com/sinansarikaya/viewgrid/releases',
    license: 'MIT',
    author: 'Sinan Sarıkaya',
    copyrightYear: 2026,
  },

  /**
   * Official Extension Store links.
   * When empty (""), the UI displays an elegant "Coming Soon" badge.
   * Update these values once public store URLs are assigned by Google and Mozilla.
   */
  storeLinks: {
    chrome: '',   // Example: 'https://chromewebstore.google.com/detail/...'
    firefox: '',  // Example: 'https://addons.mozilla.org/firefox/addon/viewgrid/'
  } as StoreLinks,

  navigation: [
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Compare Engine', href: '/#compare' },
    { label: 'Screenshots', href: '/#screenshots' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Docs', href: '/docs/' },
    { label: 'Support', href: '/support/' },
  ],

  features: [
    {
      id: 'multi-viewport',
      title: 'Simultaneous Viewports',
      tagline: 'Mobile, Tablet, Laptop & Desktop side-by-side',
      description: 'Render and interact with multiple responsive breakpoints at the same time in one browser tab. Select from built-in device presets or configure custom pixel widths, heights, and DPRs.',
      icon: '▦',
      highlight: 'Up to 16 viewports',
    },
    {
      id: 'framing-engine',
      title: 'Smart Header Relaxer',
      tagline: 'Test sites blocked by X-Frame-Options & CSP',
      description: 'Built-in DeclarativeNetRequest (Chromium) and webRequest (Firefox) engine strips XFO and rewrites frame-ancestors solely for workspace sub_frames. Your normal browsing tabs stay 100% protected.',
      icon: '🛡️',
      highlight: 'Chromium DNR & Firefox webRequest',
    },
    {
      id: 'sync-hub',
      title: 'Zero-Echo Interaction Sync',
      tagline: 'Scroll, click, navigate, and type once',
      description: 'Proprietary epoch-fenced synchronization mirrors user interactions across all visible viewports without infinite echo loops. Scroll in one phone; watch tablet and desktop follow in real time.',
      icon: '⚡',
      highlight: 'Loop-proof protocol',
    },
    {
      id: 'compare-modes',
      title: 'Visual Comparison Engine',
      tagline: 'Split Slider, Overlay Curtain, Side-by-Side',
      description: 'Pixel-level layout diffing between any two devices. Drag the interactive divider bar, toggle curtain overlay to reveal breakpoint shifts, or inspect layout discrepancies directly.',
      icon: '⚖',
      highlight: '3 Diff Modes',
    },
    {
      id: 'device-shells',
      title: 'Realistic Hardware Frames',
      tagline: 'Device bezels & orientation switching',
      description: 'Toggle authentic device shells with realistic bezels, speakers, and camera cutouts. Rotate any phone or tablet between portrait and landscape mode with instant layout recalculation.',
      icon: '📱',
      highlight: 'Portrait & Landscape',
    },
    {
      id: 'ua-spoofing',
      title: 'Per-Viewport User-Agent',
      tagline: 'Simulate mobile safari, chrome, and android',
      description: 'Injects custom client user-agent strings and headers per viewport frame. Test responsive server-side rendering (SSR) and mobile-specific redirects without changing browser settings.',
      icon: '🎭',
      highlight: 'Client & Request spoofing',
    },
    {
      id: 'touch-simulation',
      title: 'Native Touch Cursor',
      tagline: 'Finger press & drag-to-scroll simulation',
      description: 'Replaces desktop mouse cursor with an authentic touch circle, enabling touch drag scrolling, mobile hover suppression, and realistic gesture testing.',
      icon: '👆',
      highlight: 'Realistic touch mechanics',
    },
    {
      id: 'screenshot-capture',
      title: 'High-Resolution Capture',
      tagline: 'Pixel-perfect PNG exports with auto naming',
      description: 'Export clean, high-resolution PNG captures of individual viewport devices or the entire workspace canvas in one click. Automatically tagged with device name and dimensions.',
      icon: '📷',
      highlight: 'Single & Full canvas',
    },
    {
      id: 'audit-scanner',
      title: 'Automated Responsive Audit',
      tagline: 'Detect horizontal overflows and small touch targets',
      description: 'Integrated DOM inspector scans each viewport for horizontal page overflow (elements wider than viewport), truncated content, and touch targets smaller than 44x44px.',
      icon: '🔍',
      highlight: 'Zero-config diagnostics',
    },
    {
      id: 'local-privacy',
      title: '100% Local & Zero Telemetry',
      tagline: 'No analytics, no cloud, no tracking',
      description: 'ViewGrid executes entirely within your browser. No external API calls, no third-party CDNs, and zero data collection. Ideal for confidential client work and internal staging environments.',
      icon: '🔒',
      highlight: 'Completely private',
    },
  ] as FeatureItem[],

  screenshots: [
    {
      id: 'workspace',
      title: 'Multi-Viewport Workspace',
      tagline: 'Simultaneous responsive canvas',
      description: 'Live testing across iPhone 15 Pro, iPad Air, and MacBook Pro viewports with real-time synchronized scroll and interaction.',
      badge: 'WORKSPACE',
      file: '',
    },
    {
      id: 'compare',
      title: 'Dual-Split Comparison Engine',
      tagline: 'Draggable breakpoint divider',
      description: 'Inspect breakpoint differences with interactive split slider and overlay curtain mode. Easily spot layout regressions.',
      badge: 'COMPARE DIFF',
      file: '',
    },
    {
      id: 'frames',
      title: 'Realistic Hardware Bezels',
      tagline: 'Authentic device presentation',
      description: 'Present client demos with hardware shells or switch to borderless mode for maximum workspace density.',
      badge: 'DEVICE FRAMES',
      file: '',
    },
    {
      id: 'audit',
      title: 'Responsive Issue Scanner',
      tagline: 'Automatic overflow detection',
      description: 'Inspect layout warnings, horizontal scrolling elements, and small touch targets directly inside the workspace.',
      badge: 'INSPECTOR',
      file: '',
    },
  ] as ScreenshotItem[],

  faqs: [
    {
      question: 'What is ViewGrid?',
      answer: 'ViewGrid is a modern browser extension for Chromium (Chrome, Edge, Brave) and Mozilla Firefox that creates a multi-viewport testing workspace. Instead of manually resizing DevTools, ViewGrid renders your website inside multiple device viewports simultaneously with synchronized scrolling, clicks, and layout diffing.',
    },
    {
      question: 'Which browsers does ViewGrid support?',
      answer: 'ViewGrid provides first-class support for both Chromium (Manifest V3 Service Worker + DeclarativeNetRequest) and Mozilla Firefox (Manifest V3 Event Page + webRequest). Each browser receives a dedicated build package optimized for its extension runtime architecture.',
    },
    {
      question: 'Can ViewGrid test websites with X-Frame-Options or strict CSP?',
      answer: 'Yes! Unlike simple iframe tools that break when testing sites that send X-Frame-Options: DENY or Content-Security-Policy: frame-ancestors, ViewGrid dynamically strips these embedding headers for sub_frames scoped strictly to active ViewGrid workspace tabs. Normal browser tabs remain completely protected.',
    },
    {
      question: 'Can I test local development servers (e.g. localhost:3000)?',
      answer: 'Yes. ViewGrid works seamlessly with localhost, internal staging IP addresses, and live production URLs. Because all code executes locally on your machine, there are no CORS proxy servers or external middleman services.',
    },
    {
      question: 'Does ViewGrid collect any personal data or send telemetry?',
      answer: 'No. ViewGrid collects zero personal data, maintains zero analytics beacons, and makes zero remote API requests. Everything runs client-side in your local browser sandbox.',
    },
    {
      question: 'How does interaction synchronization work without getting stuck in loops?',
      answer: 'ViewGrid uses an epoch-fenced, sequence-numbered synchronization hub. When an interaction originates in one viewport, it receives a monotonic timestamp and epoch ID. Other viewports apply the change within a suppression window, preventing echo feedback loops.',
    },
    {
      question: 'How do I install ViewGrid right now?',
      answer: 'ViewGrid is currently at the Release Candidate stage. You can download the zip release from our GitHub Releases page and load it as an unpacked extension in Chrome (chrome://extensions) or temporary add-on in Firefox (about:debugging), or install it directly once approved on the Chrome Web Store and Firefox Add-ons.',
    },
  ] as FaqItem[],
};
