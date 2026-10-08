/**
 * ViewGrid per-frame content agent (IIFE, idempotent).
 * Top-level workspace frames (window.name = "viewgrid:<viewportId>") run full agents;
 * nested frames exit early (MVP scope — nested sync is a later task).
 *
 * Reports: scroll / click / nav  ·  Applies: same + commands (reload/back/forward/goto)
 * Scans: page metrics → core detectors → results to workspace.
 */
import { LoopGuard, applyScrollRatios, scrollRatios, selectorPath } from '../core/sync/protocol';
import { runCoreDetectors } from '../core/issues/detectors';
import { collectMetrics } from './metrics';
import { safeHttpUrl } from '../core/security/framing';
import type { SyncEnvelope } from '../core/types';

// Fast early exit for non-viewport contexts (e.g. normal browser tabs):
// ViewGrid viewports ALWAYS have window.name starting with "viewgrid:"
const frameName: string = typeof window !== 'undefined' ? (window.name || '') : '';
if (frameName.startsWith('viewgrid:')) {
  const g = globalThis as any;
  if (!g.__viewgridAgentInstalled) {
    g.__viewgridAgentInstalled = true;
    initAgent(frameName.slice('viewgrid:'.length));
  }
} else if (typeof window !== 'undefined' && window.top !== window && location.ancestorOrigins?.[0]?.startsWith('chrome-extension://')) {
  // Chromium can clear window.name on cross-site document replacement. Recover
  // the identity only from our extension parent, matched to its actual iframe.
  const extBrowser = (globalThis as any).browser || (globalThis as any).chrome;
  const extensionOrigin = extBrowser?.runtime?.getURL('')?.replace(/\/$/, '');
  const identify = (event: MessageEvent) => {
    if (event.source !== window.parent || event.origin !== extensionOrigin || event.data?.type !== 'vg/preview-identity') return;
    if (typeof event.data.viewportId !== 'string') return;
    window.removeEventListener('message', identify);
    const g = globalThis as any;
    if (!g.__viewgridAgentInstalled) { g.__viewgridAgentInstalled = true; initAgent(event.data.viewportId); }
  };
  window.addEventListener('message', identify);
  window.parent.postMessage({ type: 'vg/identify-preview' }, extensionOrigin);
} else if (typeof window !== 'undefined' && window.top === window) {
  // In normal browser tabs, listen for keyboard shortcut to reliably open ViewGrid workspace
  const g = globalThis as any;
  if (!g.__viewgridShortcutInstalled) {
    g.__viewgridShortcutInstalled = true;
    window.addEventListener('keydown', (e) => {
      const isV = e.key === 'v' || e.key === 'V' || e.code === 'KeyV';
      const isAltShiftV = e.altKey && e.shiftKey && isV;
      const isCtrlShiftV = e.ctrlKey && e.shiftKey && isV;
      const isAltV = e.altKey && !e.ctrlKey && !e.shiftKey && isV;
      const isMetaShiftV = e.metaKey && e.shiftKey && isV;

      if (isAltShiftV || isCtrlShiftV || isAltV || isMetaShiftV) {
        // If user is inside an editable input field (typing/pasting text), do not hijack paste
        const target = e.target as HTMLElement | null;
        const isEditable = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
        if (isCtrlShiftV && isEditable) return;

        e.preventDefault();
        e.stopPropagation();
        try {
          const extBrowser = g.browser || g.chrome;
          extBrowser?.runtime?.sendMessage?.({
            type: 'vg/open-workspace-tab',
            url: window.location.href,
          });
        } catch {}
      }
    }, { capture: true });
  }
}

function initAgent(viewportId: string) {
  const g = globalThis as any;
  const extBrowser = g.browser || g.chrome;
  const guard = new LoopGuard(Math.floor(performance.timeOrigin * 1000));
  let suppressUntil = 0;
  const suppress = (ms = 120) => {
    suppressUntil = performance.now() + ms;
    guard.beginApply();
    window.setTimeout(() => guard.endApply(), ms);
  };
  const suppressed = () => guard.isApplying() || performance.now() < suppressUntil;

  let seq = 0;
  const emit = (channel: SyncEnvelope['channel'], payload: Record<string, unknown>) => {
    if (suppressed()) return;
    seq += 1;
    const env: SyncEnvelope = {
      channel,
      sourceViewportId: viewportId,
      epoch: guard.currentEpoch,
      seq,
      ts: Date.now(),
      payload,
    };
    try {
      if (channel === 'scroll') {
        // One parent/child hop instead of two runtime hops through the worker.
        window.parent.postMessage({ type: 'vg/scroll-event', env }, extBrowser.runtime.getURL('').replace(/\/$/, ''));
      } else extBrowser?.runtime?.sendMessage?.({ type: 'vg/agent-event', env });
    } catch {
      /* context invalidated */
    }
  };

  // Re-register after document replacement; the document epoch changes after reload.
  const reloadKey = `viewgrid:remote-reload:${viewportId}`;
  const hello = () => {
    const result = extBrowser?.runtime?.sendMessage?.({ type: 'vg/agent-hello', viewportId });
    result?.then?.((reply: any) => window.postMessage({ type: 'vg/preview-worker-context', verified: reply?.ok === true }, location.origin))?.catch?.(() => {});
  };
  void hello();
  window.addEventListener('pageshow', hello);
  let remoteReload = false;
  try { remoteReload = sessionStorage.getItem(reloadKey) === '1'; sessionStorage.removeItem(reloadKey); } catch {}
  if (!remoteReload && (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'reload') {
    window.setTimeout(() => emit('reload', {}), 300);
  }
  let observedUrl = location.href;
  window.setInterval(() => {
    if (location.href === observedUrl) return;
    // Do not consume a SPA transition while replay suppression is active.
    // It must still be broadcast on the next tick.
    if (suppressed()) return;
    observedUrl = location.href;
    if (safeHttpUrl(observedUrl)) emit('nav', { url: observedUrl });
  }, 250);
  for (const kind of ['keydown', 'keyup'] as const) document.addEventListener(kind, e => {
    if (!e.isTrusted || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = e.target instanceof Element ? e.target : null;
    if (!el) return;
    emit('key', { selector: selectorPath(el), kind, key: e.key, code: e.code, shiftKey: e.shiftKey });
  }, true);

  // —— scroll (rAF-coalesced; only broadcast if triggered by user interaction) ——
  let scrollPending = false;
  let userInteracted = false;

  window.addEventListener('wheel', () => { userInteracted = true; }, { passive: true, capture: true });
  window.addEventListener('touchmove', () => { userInteracted = true; }, { passive: true, capture: true });
  window.addEventListener('pointerdown', () => { userInteracted = true; }, { passive: true, capture: true });
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) {
      userInteracted = true;
    }
  }, { passive: true, capture: true });

  let lastScrollX = window.scrollX;
  let lastScrollY = window.scrollY;

  window.addEventListener(
    'scroll',
    () => {
      // Ignore automated / programmatic scroll on initial page load (e.g. anchor #hash jumps)
      if (!userInteracted || scrollPending || suppressed()) return;
      const dx = Math.abs(window.scrollX - lastScrollX);
      const dy = Math.abs(window.scrollY - lastScrollY);
      if (dx < 2 && dy < 2) return;

      scrollPending = true;
      requestAnimationFrame(() => {
        scrollPending = false;
        lastScrollX = window.scrollX;
        lastScrollY = window.scrollY;
        emit('scroll', scrollRatios(window.scrollX, window.scrollY, maxScrollX(), maxScrollY()));
      });
    },
    { passive: true, capture: true },
  );
  const maxScrollX = () => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const maxScrollY = () => Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);

  // —— click + nav capture (never preventDefault; source behaves normally) ——
  document.addEventListener(
    'click',
    (ev) => {
      if (suppressed()) return;
      const el = ev.target instanceof Element ? ev.target : null;
      if (!el) return;
      if (ev.defaultPrevented || ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey) return;
      const anchor = el.closest?.('a[href]');
      if (anchor) {
        const href = (anchor as HTMLAnchorElement).href;
        if (safeHttpUrl(href) && !(anchor as HTMLAnchorElement).download && (anchor as HTMLAnchorElement).target !== '_blank') emit('nav', { url: href });
      } else emit('click', { selector: selectorPath(el), nx: ev.clientX / window.innerWidth, ny: ev.clientY / window.innerHeight });
    },
    true,
  );

  // —— input & form mirroring ——
  document.addEventListener(
    'input',
    (ev) => {
      if (suppressed()) return;
      const el = ev.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (!el || !el.tagName) return;
      emit('input', {
        selector: selectorPath(el),
        value: el.value,
        checked: 'checked' in el ? (el as HTMLInputElement).checked : undefined,
      });
    },
    true,
  );

  document.addEventListener(
    'change',
    (ev) => {
      if (suppressed()) return;
      const el = ev.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (!el || !el.tagName) return;
      emit('form', {
        selector: selectorPath(el),
        value: el.value,
        checked: 'checked' in el ? (el as HTMLInputElement).checked : undefined,
      });
    },
    true,
  );

  function handleAgentDo(msg: any) {
    if (!msg || typeof msg !== 'object') return;
    const cmd = String(msg.cmd || '');
    // Appearance/configuration messages on iframe load must not discard the
    // user's first click or SPA transition. Only commands that move the page
    // need the replay suppression window.
    if (['reload', 'hardReload', 'back', 'forward', 'goto', 'scrollToTop', 'highlight'].includes(cmd)) suppress(250);
    if (cmd === 'reload' || cmd === 'hardReload') {
      try { sessionStorage.setItem(reloadKey, '1'); } catch {}
      // Reload without clearing site data or altering the application URL.
      if (cmd === 'hardReload') (location.reload as (force?: boolean) => void)(true);
      else location.reload();
    }
    else if (cmd === 'back') history.back();
    else if (cmd === 'forward') history.forward();
    else if (cmd === 'goto' && typeof msg.url === 'string') {
      try {
        const u = new URL(msg.url);
        // Only allow valid http/https schemes to prevent javascript: or data: injection
        if (u.protocol === 'http:' || u.protocol === 'https:') {
          location.assign(u.href);
        }
      } catch {}
    }
    else if (cmd === 'scrollToTop') window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    else if (cmd === 'setColorScheme') applyColorScheme(String(msg.scheme || 'auto'));
    else if (cmd === 'setTouchCursor') applyTouchCursor(!!msg.enabled);
    else if (cmd === 'highlight' && typeof msg.selector === 'string') {
      try {
        const el = document.querySelector(msg.selector) as HTMLElement | null;
        if (!el) return;
        el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
        const before = el.style.outline, offset = el.style.outlineOffset;
        el.style.outline = '3px solid #f59e0b'; el.style.outlineOffset = '3px';
        window.setTimeout(() => { el.style.outline = before; el.style.outlineOffset = offset; }, 2500);
      } catch { /* element may have disappeared since scan */ }
    }
  }

  // —— apply from hub & direct window messages ——
  // Privileged channel: extension background message hub (only extension scripts can send)
  extBrowser?.runtime?.onMessage?.addListener((msg: any) => {
    if (!msg || typeof msg.type !== 'string') return;

    if (msg.type === 'vg/agent-apply' && msg.env) {
      const env = msg.env as SyncEnvelope;
      if (!guard.accept(env, viewportId)) return;
      apply(env);
      return;
    }

    if (msg.type === 'vg/agent-do') {
      handleAgentDo(msg);
      return;
    }

    if (msg.type === 'vg/agent-scan') {
      const metrics = collectMetrics(document, window, !Array.isArray(msg.touchViewportIds) || msg.touchViewportIds.includes(viewportId));
      const issues = runCoreDetectors(metrics).map(i => ({ ...i, data: { ...i.data, url: location.href, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight } }));
      extBrowser?.runtime
        ?.sendMessage?.({ type: 'vg/scan-result', viewportId, scanId: msg.scanId, issues, scannedElements: metrics.scannedElements, truncated: metrics.truncated })
        ?.catch?.(() => {});
    }
  });

  // Unprivileged channel: postMessage from enclosing workspace parent window
  // Enforces: 1) source must be parent, 2) origin must be extension origin, 3) strict allowlist (no goto/reload)
  window.addEventListener('message', (e) => {
    if (e.source !== window.parent) return;

    // Verify origin is ViewGrid extension page (chrome-extension://... or moz-extension://...)
    const extOrigin = extBrowser?.runtime?.getURL('')?.replace(/\/$/, '');
    if (!extOrigin || e.origin !== extOrigin) return;

    if (e.data?.type === 'vg/scroll-apply' && e.data.env?.channel === 'scroll') {
      if (guard.accept(e.data.env, viewportId)) apply(e.data.env);
      return;
    }
    if (e.data && e.data.type === 'vg/agent-do') {
      const cmd = e.data.cmd;
      // Privileged navigation actions (goto, reload, back, forward) CANNOT be triggered via postMessage!
      if (cmd === 'setColorScheme' || cmd === 'setTouchCursor' || cmd === 'scrollToTop') {
        handleAgentDo(e.data);
      }
    }
  });

  // —— Native Touch Cursor Simulation ——
  let touchCursorEl: HTMLElement | null = null;
  let touchCursorInstalled = false;

  function applyTouchCursor(enabled: boolean) {
    if (!enabled) {
      if (touchCursorEl) touchCursorEl.style.display = 'none';
      document.documentElement.classList.remove('vg-touch-mode');
      return;
    }

    document.documentElement.classList.add('vg-touch-mode');
    if (!touchCursorEl) {
      touchCursorEl = document.createElement('div');
      touchCursorEl.id = 'vg-touch-cursor';
      const style = document.createElement('style');
      style.id = 'vg-touch-cursor-style';
      style.textContent = `
        html.vg-touch-mode, html.vg-touch-mode * {
          cursor: none !important;
        }
        #vg-touch-cursor {
          position: fixed;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(148, 163, 184, 0.45);
          border: 2px solid rgba(255, 255, 255, 0.85);
          box-shadow: 0 0 12px rgba(0, 0, 0, 0.4);
          pointer-events: none;
          z-index: 2147483647;
          transform: translate(-50%, -50%);
          transition: width 0.12s ease, height 0.12s ease, background 0.12s ease, border-color 0.12s ease;
          display: none;
        }
        #vg-touch-cursor.vg-touch-pressed {
          width: 32px;
          height: 32px;
          background: rgba(59, 130, 246, 0.6);
          border-color: #93c5fd;
          box-shadow: 0 0 18px rgba(59, 130, 246, 0.7);
        }
      `;
      (document.head || document.documentElement).appendChild(style);
      (document.body || document.documentElement).appendChild(touchCursorEl);
    }

    touchCursorEl.style.display = 'block';

    if (!touchCursorInstalled) {
      touchCursorInstalled = true;
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let scrollStartX = 0;
      let scrollStartY = 0;
      let hasScrolled = false;

      window.addEventListener('mousemove', (e) => {
        if (!touchCursorEl || !document.documentElement.classList.contains('vg-touch-mode')) return;
        touchCursorEl.style.display = 'block';
        touchCursorEl.style.left = `${e.clientX}px`;
        touchCursorEl.style.top = `${e.clientY}px`;

        if (isDragging) {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          if (Math.abs(dy) > 4 || Math.abs(dx) > 4) {
            hasScrolled = true;
            try {
              window.getSelection()?.removeAllRanges();
            } catch {}
            window.scrollTo({
              left: scrollStartX - dx,
              top: scrollStartY - dy,
              behavior: 'instant' as ScrollBehavior,
            });
          }
        }
      }, { passive: false });

      window.addEventListener('mousedown', (e) => {
        if (!document.documentElement.classList.contains('vg-touch-mode')) return;
        if (touchCursorEl) touchCursorEl.classList.add('vg-touch-pressed');
        if (e.button === 0) {
          isDragging = true;
          hasScrolled = false;
          startX = e.clientX;
          startY = e.clientY;
          scrollStartX = window.scrollX;
          scrollStartY = window.scrollY;
        }
      }, { passive: true });

      window.addEventListener('mouseup', () => {
        if (touchCursorEl) touchCursorEl.classList.remove('vg-touch-pressed');
        isDragging = false;
      }, { passive: true });

      // If user performed a touch swipe-scroll, prevent accidental click activation
      window.addEventListener('click', (e) => {
        if (document.documentElement.classList.contains('vg-touch-mode') && hasScrolled) {
          e.preventDefault();
          e.stopPropagation();
          hasScrolled = false;
        }
      }, true);

      window.addEventListener('mouseleave', () => {
        if (touchCursorEl) touchCursorEl.style.display = 'none';
        isDragging = false;
      }, { passive: true });
    }
  }

  function apply(env: SyncEnvelope) {
    const p = env.payload ?? {};
    switch (env.channel) {
      case 'scroll':
        // Suppress the replay echo, but do not lock a user's new gesture for 120ms.
        userInteracted = false;
        applyScrollRatios(window, p);
        lastScrollX = window.scrollX; lastScrollY = window.scrollY;
        break;
      case 'click': {
        suppress(150);
        const target = document.querySelector(String(p.selector ?? ''));
        if (target) {
          (target as HTMLElement).click();
        } else if (typeof p.nx === 'number') {
          const x = p.nx * window.innerWidth;
          const y = (Number(p.ny) || 0) * window.innerHeight;
          (document.elementFromPoint(x, y) as HTMLElement | null)?.click();
        }
        break;
      }
      case 'nav':
        suppress(300);
        if (safeHttpUrl(p.url) && p.url !== location.href) { observedUrl = p.url; location.assign(p.url); }
        break;
      case 'reload':
        handleAgentDo({ cmd: 'reload' });
        break;
      case 'key': {
        suppress(100);
        const target = document.querySelector(String(p.selector || '')) || document.activeElement;
        target?.dispatchEvent(new KeyboardEvent(p.kind === 'keyup' ? 'keyup' : 'keydown', { key: String(p.key || ''), code: String(p.code || ''), shiftKey: !!p.shiftKey, bubbles: true, cancelable: true }));
        break;
      }
      case 'input':
      case 'form': {
        suppress(100);
        const target = document.querySelector(String(p.selector ?? '')) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
        if (target) {
          if (typeof p.value === 'string' && target.value !== p.value) {
            const proto = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : target instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
            Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(target, p.value);
          }
          if (typeof p.checked === 'boolean' && 'checked' in target && (target as HTMLInputElement).checked !== p.checked) {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked')?.set?.call(target, p.checked);
          }
          target.dispatchEvent(new Event('input', { bubbles: true }));
          target.dispatchEvent(new Event('change', { bubbles: true }));
        }
        break;
      }
    }
  }

  let originalAppearance: Array<{ el: HTMLElement; theme: string | null; color: string | null; dark: boolean; light: boolean }> | null = null;
  function applyColorScheme(scheme: string) {
    if (scheme === 'auto' && !originalAppearance) return;
    if (scheme !== 'auto' && !originalAppearance) originalAppearance = [document.documentElement, document.body].filter((el): el is HTMLElement => !!el).map(el => ({ el, theme: el.getAttribute('data-theme'), color: el.getAttribute('data-color-scheme'), dark: el.classList.contains('dark'), light: el.classList.contains('light') }));
    let styleEl = document.getElementById('viewgrid-color-scheme-override') as HTMLStyleElement | null;
    const docEl = document.documentElement;
    const bodyEl = document.body;

    if (scheme === 'dark') {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'viewgrid-color-scheme-override';
        (document.head || docEl).appendChild(styleEl);
      }
      styleEl.textContent = `
        :root, html, body {
          color-scheme: dark !important;
        }
        html.vg-force-invert {
          filter: invert(1) hue-rotate(180deg) !important;
        }
        html.vg-force-invert img,
        html.vg-force-invert video,
        html.vg-force-invert canvas,
        html.vg-force-invert svg,
        html.vg-force-invert iframe {
          filter: invert(1) hue-rotate(180deg) !important;
        }
      `;
      docEl.dataset.colorScheme = 'dark';
      docEl.dataset.theme = 'dark';
      docEl.classList.add('dark');
      docEl.classList.remove('light');
      if (bodyEl) {
        bodyEl.classList.add('dark');
        bodyEl.classList.remove('light');
      }

      // If site has naturally white background, check luminance and invert if necessary
      try {
        let bg = window.getComputedStyle(bodyEl || docEl).backgroundColor;
        if (!bg || bg === 'transparent' || bg.startsWith('rgba(0, 0, 0, 0)')) {
          bg = window.getComputedStyle(docEl).backgroundColor;
        }
        const isTransparent = !bg || bg === 'transparent' || bg.startsWith('rgba(0, 0, 0, 0)');
        const rgb = bg.match(/\d+/g);
        const lum = isTransparent
          ? 1.0
          : rgb && rgb.length >= 3 && rgb.slice(0, 3).some((c) => Number(c) > 0)
            ? (0.299 * Number(rgb[0]) + 0.587 * Number(rgb[1]) + 0.114 * Number(rgb[2])) / 255
            : 1.0;
        if (lum > 0.5) {
          docEl.classList.add('vg-force-invert');
        } else {
          docEl.classList.remove('vg-force-invert');
        }
      } catch {}
    } else if (scheme === 'light') {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'viewgrid-color-scheme-override';
        (document.head || docEl).appendChild(styleEl);
      }
      styleEl.textContent = `
        :root, html, body {
          color-scheme: light !important;
        }
        html.vg-force-invert {
          filter: invert(1) hue-rotate(180deg) !important;
        }
        html.vg-force-invert img,
        html.vg-force-invert video,
        html.vg-force-invert canvas,
        html.vg-force-invert svg,
        html.vg-force-invert iframe {
          filter: invert(1) hue-rotate(180deg) !important;
        }
      `;
      docEl.dataset.colorScheme = 'light';
      docEl.dataset.theme = 'light';
      docEl.classList.add('light');
      docEl.classList.remove('dark');
      if (bodyEl) {
        bodyEl.classList.add('light');
        bodyEl.classList.remove('dark');
      }

      // If site has hardcoded dark background, invert to light mode
      try {
        let bg = window.getComputedStyle(bodyEl || docEl).backgroundColor;
        if (!bg || bg === 'transparent' || bg.startsWith('rgba(0, 0, 0, 0)')) {
          bg = window.getComputedStyle(docEl).backgroundColor;
        }
        const rgb = bg.match(/\d+/g);
        const lum =
          rgb && rgb.length >= 3 && rgb.slice(0, 3).some((c) => Number(c) > 0)
            ? (0.299 * Number(rgb[0]) + 0.587 * Number(rgb[1]) + 0.114 * Number(rgb[2])) / 255
            : 1.0;
        if (lum < 0.45) {
          docEl.classList.add('vg-force-invert');
        } else {
          docEl.classList.remove('vg-force-invert');
        }
      } catch {}
    } else {
      styleEl?.remove();
      for (const original of originalAppearance ?? []) {
        const { el, theme, color, dark, light } = original;
        if (theme === null) el.removeAttribute('data-theme'); else el.setAttribute('data-theme', theme);
        if (color === null) el.removeAttribute('data-color-scheme'); else el.setAttribute('data-color-scheme', color);
        el.classList.toggle('dark', dark); el.classList.toggle('light', light); el.classList.remove('vg-force-invert');
      }
      originalAppearance = null;
    }
  }

}
