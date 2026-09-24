"use strict";
(() => {
  function getConfig() {
    const s = document.currentScript;
    if (!s) return {};
    try {
      return JSON.parse((s as HTMLElement).dataset.viewgridConfig || '{}');
    } catch {
      return {};
    }
  }
  const cfg = getConfig();
  function defineProp(obj: any, prop: string, val: any) {
    try {
      Object.defineProperty(obj, prop, { get: () => val, configurable: true });
    } catch {}
  }
  if (cfg.dpr !== undefined) {
    defineProp(window, 'devicePixelRatio', cfg.dpr);
  }
  if (cfg.screenWidth !== undefined || cfg.screenHeight !== undefined) {
    if (cfg.screenWidth) defineProp(window.screen, 'width', cfg.screenWidth);
    if (cfg.screenHeight) defineProp(window.screen, 'height', cfg.screenHeight);
  }
  if (cfg.userAgent) {
    defineProp(navigator, 'userAgent', cfg.userAgent);
    defineProp(navigator, 'appVersion', cfg.userAgent.replace(/^Mozilla\//, ''));
  }

  // Inside ViewGrid viewport frames (window.name starts with "viewgrid:"):
  // Disable ServiceWorker registration so framed pages cannot hijack iframe network requests,
  // store stale cache, or enforce framing restrictions.
  const isViewGridFrame = typeof window !== 'undefined' && window.name && window.name.startsWith('viewgrid:');
  if (isViewGridFrame && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      if (navigator.serviceWorker.getRegistrations) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          for (const reg of regs) {
            reg.unregister().catch(() => {});
          }
        }).catch(() => {});
      }
      navigator.serviceWorker.register = () => {
        return Promise.reject(new Error('[viewgrid] Service workers are disabled in responsive preview frames.'));
      };
    } catch {}
  }
})();

