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

const g = globalThis as any;
if (!g.__viewgridAgentInstalled) {
  g.__viewgridAgentInstalled = true;
  initAgent();
}

function initAgent() {
  const name: string = (window as any).name ?? '';
  if (!name.startsWith('viewgrid:')) return; // nested / unrelated frame
  const viewportId = name.slice('viewgrid:'.length);
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
      (globalThis as any).browser.runtime.sendMessage({ type: 'vg/agent-event', env });
    } catch {
      /* context invalidated */
    }
  };

  // —— hello ——
  try {
    (globalThis as any).browser.runtime.sendMessage({ type: 'vg/agent-hello', viewportId });
  } catch {
    /* ignore */
  }

  // —— scroll (rAF-coalesced) ——
  let scrollPending = false;
  window.addEventListener(
    'scroll',
    () => {
      if (scrollPending || suppressed()) return;
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

  // —— apply from hub ——
  (globalThis as any).browser.runtime.onMessage.addListener((msg: any) => {
    if (!msg || typeof msg.type !== 'string') return;

    if (msg.type === 'vg/agent-apply' && msg.env) {
      const env = msg.env as SyncEnvelope;
      if (!guard.accept(env, viewportId)) return;
      apply(env);
      return;
    }

    if (msg.type === 'vg/agent-do') {
      const cmd = msg.cmd as string;
      suppress(200);
      if (cmd === 'reload') location.reload();
      else if (cmd === 'back') history.back();
      else if (cmd === 'forward') history.forward();
      else if (cmd === 'goto' && typeof msg.url === 'string') location.assign(msg.url);
      return;
    }

    if (msg.type === 'vg/agent-scan') {
      const metrics = collectMetrics();
      const issues = runCoreDetectors(metrics).map((i) => ({ ...i }));
      (globalThis as any).browser.runtime
        .sendMessage({ type: 'vg/scan-result', viewportId, issues })
        .catch(() => {});
    }
  });

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
