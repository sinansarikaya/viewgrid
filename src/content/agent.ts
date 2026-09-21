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
import type { MeasuredElement, PageMetrics, SyncEnvelope } from '../core/types';

// Fast early exit for non-viewport contexts (e.g. normal browser tabs):
// ViewGrid viewports ALWAYS have window.name starting with "viewgrid:"
const frameName: string = typeof window !== 'undefined' ? (window.name || '') : '';
if (frameName.startsWith('viewgrid:')) {
  const g = globalThis as any;
  if (!g.__viewgridAgentInstalled) {
    g.__viewgridAgentInstalled = true;
    initAgent(frameName.slice('viewgrid:'.length));
  }
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
  const guard = new LoopGuard();
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
      extBrowser?.runtime?.sendMessage?.({ type: 'vg/agent-event', env });
    } catch {
      /* context invalidated */
    }
  };

  // —— hello & world inject ——
  try {
    extBrowser?.runtime
      ?.sendMessage?.({ type: 'vg/agent-hello', viewportId })
      ?.then?.((res: any) => {
        if (res?.userAgent) {
          try {
            const s = document.createElement('script');
            s.src = extBrowser.runtime.getURL('world-inject.js');
            s.dataset.viewgridConfig = JSON.stringify({ userAgent: res.userAgent });
            s.async = false;
            s.onload = () => s.remove();
            (document.head || document.documentElement).prepend(s);
          } catch {}
        }
      })
      ?.catch?.(() => {});
  } catch {
    /* ignore */
  }

  // —— scroll (rAF-coalesced; only broadcast if triggered by user interaction) ——
  let scrollPending = false;
  let userInteracted = false;

  window.addEventListener('wheel', () => { userInteracted = true; }, { passive: true, capture: true });
  window.addEventListener('touchmove', () => { userInteracted = true; }, { passive: true, capture: true });
  window.addEventListener('pointerdown', () => { userInteracted = true; }, { passive: true, capture: true });
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space', 'Home', 'End'].includes(e.key)) {
      userInteracted = true;
    }
  }, { passive: true, capture: true });

  window.addEventListener(
    'scroll',
    () => {
      // Ignore automated / programmatic scroll on initial page load (e.g. anchor #hash jumps)
      if (!userInteracted || scrollPending || suppressed()) return;
      scrollPending = true;
      requestAnimationFrame(() => {
        scrollPending = false;
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
      emit('click', { selector: selectorPath(el), nx: ev.clientX / window.innerWidth, ny: ev.clientY / window.innerHeight });
      const anchor = el.closest?.('a[href]');
      if (anchor) {
        const href = (anchor as HTMLAnchorElement).href;
        if (href && !href.startsWith('javascript:')) {
          emit('nav', { url: href, viaClick: true });
        }
      }
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
    suppress(250);
    if (cmd === 'reload') location.reload();
    else if (cmd === 'hardReload') {
      try {
        sessionStorage?.clear?.();
        localStorage?.clear?.();
      } catch {}
      try {
        const u = new URL(location.href);
        u.searchParams.set('_vg_nocache', Date.now().toString());
        location.replace(u.href);
      } catch {
        location.reload();
      }
    }
    else if (cmd === 'clearStorage') {
      try {
        const cookies = document.cookie.split(';');
        for (const c of cookies) {
          const eqPos = c.indexOf('=');
          const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
        sessionStorage?.clear?.();
        localStorage?.clear?.();
      } catch {}
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
      const metrics = collectMetrics();
      const issues = runCoreDetectors(metrics).map((i) => ({ ...i }));
      extBrowser?.runtime
        ?.sendMessage?.({ type: 'vg/scan-result', viewportId, issues })
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
        suppress(120);
        applyScrollRatios(window, p);
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
        if (p.viaClick) break; // click-replay (if enabled) already navigates peers
        suppress(300);
        if (typeof p.url === 'string' && p.url !== location.href) location.assign(p.url);
        break;
      case 'reload':
        suppress(300);
        location.reload();
        break;
      case 'input':
      case 'form': {
        suppress(100);
        const target = document.querySelector(String(p.selector ?? '')) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
        if (target) {
          if (typeof p.value === 'string' && target.value !== p.value) {
            target.value = p.value;
          }
          if (typeof p.checked === 'boolean' && 'checked' in target && (target as HTMLInputElement).checked !== p.checked) {
            (target as HTMLInputElement).checked = p.checked;
          }
          target.dispatchEvent(new Event('input', { bubbles: true }));
          target.dispatchEvent(new Event('change', { bubbles: true }));
        }
        break;
      }
    }
  }

  function applyColorScheme(scheme: string) {
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
      delete docEl.dataset.colorScheme;
      delete docEl.dataset.theme;
      docEl.classList.remove('dark', 'light', 'vg-force-invert');
      if (bodyEl) bodyEl.classList.remove('dark', 'light');
    }
  }

  // —— metrics collection (bounded) ——
  function collectMetrics(): PageMetrics {
    const elements: MeasuredElement[] = [];
    const sel = 'a,button,input,select,textarea,summary,label,[role="button"],[tabindex]';
    document.querySelectorAll(sel).forEach((el, i) => {
      if (i > 400) return;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      elements.push({
        selector: selectorPath(el),
        tag: el.tagName.toLowerCase(),
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
        text: (el.textContent ?? '').trim().slice(0, 80),
        isInteractive: true,
        overflowX: cs.overflowX,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      });
    });
    // text-clip candidates: bounded walker
    const walker = document.createTreeWalker(document.body ?? document.documentElement, NodeFilter.SHOW_ELEMENT);
    let n = 0;
    let node = walker.nextNode() as Element | null;
    while (node && n < 1500) {
      n++;
      if (node.scrollWidth > node.clientWidth + 2 && node.textContent?.trim()) {
        const cs = getComputedStyle(node);
        if (['hidden', 'clip'].includes(cs.overflowX)) {
          elements.push({
            selector: selectorPath(node),
            tag: node.tagName.toLowerCase(),
            rect: rectOf(node),
            text: (node.textContent ?? '').trim().slice(0, 80),
            overflowX: cs.overflowX,
            scrollWidth: node.scrollWidth,
            clientWidth: node.clientWidth,
          });
        }
      }
      node = walker.nextNode() as Element | null;
    }
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      elements,
    };
  }

  function rectOf(el: Element) {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }
}
