"use strict";
(() => {
  // src/core/sync/protocol.ts
  var LoopGuard = class {
    constructor(epoch = 1) {
      this.epoch = epoch;
    }
    sourceEpoch = /* @__PURE__ */ new Map();
    lastSeq = /* @__PURE__ */ new Map();
    applyingDepth = 0;
    seq = 0;
    get currentEpoch() {
      return this.epoch;
    }
    /** Source-side: mint an envelope. */
    envelope(channel, sourceViewportId, payload) {
      this.seq += 1;
      return { channel, sourceViewportId, epoch: this.epoch, seq: this.seq, ts: Date.now(), payload };
    }
    /** Hub/actuator-side: true if this event should be applied/rebroadcast. */
    accept(env, selfViewportId) {
      if (!env || typeof env.channel !== "string") return false;
      if (selfViewportId && env.sourceViewportId === selfViewportId) return false;
      if (!Number.isFinite(env.epoch) || env.epoch < 1 || !Number.isSafeInteger(env.seq) || env.seq < 1) return false;
      const lastEpoch = this.sourceEpoch.get(env.sourceViewportId) ?? 0;
      if (env.epoch < lastEpoch) return false;
      if (env.epoch > lastEpoch) {
        this.sourceEpoch.set(env.sourceViewportId, env.epoch);
        for (const key2 of this.lastSeq.keys()) {
          if (key2.startsWith(`${env.sourceViewportId}:`)) this.lastSeq.delete(key2);
        }
      }
      const key = `${env.sourceViewportId}:${env.channel}`;
      if (env.seq <= (this.lastSeq.get(key) ?? 0)) return false;
      this.lastSeq.set(key, env.seq);
      return true;
    }
    /** Actuator-side: suppress echo from programmatic applies. */
    beginApply() {
      this.applyingDepth += 1;
    }
    endApply() {
      this.applyingDepth = Math.max(0, this.applyingDepth - 1);
    }
    isApplying() {
      return this.applyingDepth > 0;
    }
    /**
     * Call when a channel is toggled / viewports replaced. Sequence numbers stay
     * monotonic (never restart) so in-flight events can't collide with new ones;
     * the epoch bump tags post-reset sessions.
     */
    reset() {
      this.epoch += 1;
    }
  };
  function scrollRatios(scrollX, scrollY, maxX, maxY) {
    return {
      xRatio: maxX > 0 ? scrollX / maxX : 0,
      yRatio: maxY > 0 ? scrollY / maxY : 0,
      maxX,
      maxY
    };
  }
  function applyScrollRatios(win, payload) {
    const doc = win.document;
    const maxX = Math.max(0, doc.documentElement.scrollWidth - doc.documentElement.clientWidth);
    const maxY = Math.max(0, doc.documentElement.scrollHeight - doc.documentElement.clientHeight);
    const xRatio = Number(payload.xRatio) || 0;
    const yRatio = Number(payload.yRatio) || 0;
    win.scrollTo({ left: Math.round(xRatio * maxX), top: Math.round(yRatio * maxY), behavior: "instant" });
  }
  function selectorPath(el) {
    if (!el) return "";
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 6) {
      if (node.id) {
        parts.unshift(`#${CSS.escape(node.id)}`);
        break;
      }
      const parent = node.parentElement;
      const tag = node.tagName.toLowerCase();
      if (!parent) {
        parts.unshift(tag);
        break;
      }
      const siblings = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
      const idx = siblings.indexOf(node) + 1;
      parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${idx})` : tag);
      node = parent;
    }
    return parts.join(">");
  }

  // src/core/issues/detectors.ts
  var issueSeq = 0;
  function mk(rule, severity, message, e, data) {
    issueSeq = (issueSeq + 1) % 1e9;
    return { id: `iss_${issueSeq}`, rule, severity, message, selector: e?.selector, data: { ...data, tag: e?.tag, rect: e?.rect, text: e?.text, heuristic: true } };
  }
  function detectHorizontalOverflow(m) {
    const out = [];
    const overflow = m.scrollWidth - m.innerWidth;
    if (overflow > 1) {
      const offenders = m.elements.filter((e) => e.rect.width > 0 && e.rect.x + e.rect.width > m.innerWidth + 1).slice(0, 5);
      out.push(
        mk("horizontal-overflow", "critical", `Horizontal overflow: ${overflow}px wider than viewport (${m.innerWidth}px)`, void 0, {
          overflow,
          offenders: offenders.map((e) => e.selector)
        })
      );
    }
    return out;
  }
  function detectTextClipping(m) {
    const out = [];
    for (const e of m.elements) {
      if (!e.intentionallyClipped && e.text && e.scrollWidth !== void 0 && e.clientWidth !== void 0 && e.scrollWidth > e.clientWidth + 2 && e.overflowX && ["hidden", "clip"].includes(e.overflowX)) {
        out.push(mk("text-clipping", "major", `Text clipped in <${e.tag}>: "${e.text.slice(0, 40)}"`, e, {
          scrollWidth: e.scrollWidth,
          clientWidth: e.clientWidth
        }));
      }
    }
    return out;
  }
  function detectVerticalTextClipping(m) {
    return m.elements.filter((e) => !e.intentionallyClipped && e.text && e.scrollHeight !== void 0 && e.clientHeight !== void 0 && e.scrollHeight > e.clientHeight + 2 && ["hidden", "clip"].includes(e.overflowY || "")).map((e) => mk(
      "vertical-text-clipping",
      "major",
      `Text exceeds the fixed height of <${e.tag}>`,
      e,
      { scrollHeight: e.scrollHeight, clientHeight: e.clientHeight }
    ));
  }
  function detectOutOfViewport(m) {
    const out = [];
    for (const e of m.elements) {
      if (!e.isInteractive || e.intentionallyClipped || e.insideHorizontalScroller || e.rect.width <= 0) continue;
      if (e.rect.x + e.rect.width > m.innerWidth + 1 || e.rect.x < -1) {
        out.push(mk("out-of-viewport", "major", `<${e.tag}> extends outside viewport`, e, { rect: e.rect }));
      }
    }
    return out;
  }
  function detectSmallTapTargets(m) {
    const out = [];
    if (m.checkTapTargets === false) return out;
    for (const e of m.elements) {
      if (!e.isInteractive || e.inlineTextLink || e.intentionallyClipped || e.rect.width <= 0 || e.rect.height <= 0) continue;
      const min = Math.min(e.rect.width, e.rect.height);
      if (min > 0 && min < 43) {
        out.push(
          mk("small-tap-target", "minor", `Tap target ${Math.round(e.rect.width)}\xD7${Math.round(e.rect.height)}px (< 44px recommendation)`, e, {
            rect: e.rect,
            recommendation: 44,
            tolerance: 1
          })
        );
      }
    }
    return out;
  }
  function runCoreDetectors(m) {
    const issues = [
      ...detectHorizontalOverflow(m),
      ...detectTextClipping(m),
      ...detectVerticalTextClipping(m),
      ...detectOutOfViewport(m),
      ...detectSmallTapTargets(m)
    ];
    const seen = /* @__PURE__ */ new Set();
    return issues.filter((i) => {
      const key = `${i.rule}:${i.selector || "document"}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // src/content/metrics.ts
  function collectMetrics(doc, win, checkTapTargets = true) {
    const elements = [];
    const all = Array.from(doc.body?.querySelectorAll("*") ?? []);
    const limit = 5e3;
    const hidden = /* @__PURE__ */ new WeakMap();
    const clip = /* @__PURE__ */ new WeakMap();
    function isHidden(el) {
      const cached = hidden.get(el);
      if (cached !== void 0) return cached;
      const style = win.getComputedStyle(el);
      const result = el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true" || style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || style.opacity === "0" || !!el.parentElement && isHidden(el.parentElement);
      hidden.set(el, result);
      return result;
    }
    function clippedAncestor(el) {
      const cached = clip.get(el);
      if (cached !== void 0) return cached;
      const parent = el.parentElement;
      if (!parent || parent === doc.body || parent === doc.documentElement) return false;
      const cs = win.getComputedStyle(parent);
      const result = ["auto", "scroll"].includes(cs.overflowX) || clippedAncestor(parent);
      clip.set(el, result);
      return result;
    }
    function fullyClipped(el, rect) {
      for (let parent = el.parentElement; parent && parent !== doc.body && parent !== doc.documentElement; parent = parent.parentElement) {
        const cs = win.getComputedStyle(parent), bounds = parent.getBoundingClientRect();
        if (["hidden", "clip"].includes(cs.overflowX) && (rect.right <= bounds.left || rect.left >= bounds.right)) return true;
        if (["hidden", "clip"].includes(cs.overflowY) && (rect.bottom <= bounds.top || rect.top >= bounds.bottom)) return true;
      }
      return false;
    }
    for (const el of all.slice(0, limit)) {
      if (el.closest("[data-viewgrid-overlay]") || isHidden(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || fullyClipped(el, rect)) continue;
      const cs = win.getComputedStyle(el);
      const intentional = cs.textOverflow === "ellipsis" || Number(cs.getPropertyValue("-webkit-line-clamp")) > 0;
      const interactive = el.matches('a[href],button,input:not([type="hidden"]),select,textarea,summary,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"])') && !el.matches(":disabled");
      const directText = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join(" ").trim();
      const clipsText = ["hidden", "clip"].includes(cs.overflowX) && el.scrollWidth > el.clientWidth + 2 || ["hidden", "clip"].includes(cs.overflowY) && el.scrollHeight > el.clientHeight + 2;
      const measuredText = directText || (clipsText && el.matches("p,h1,h2,h3,h4,h5,h6,button,a,label,span,strong,em,small,code,pre") ? el.textContent?.trim() || "" : "");
      if (!interactive && !measuredText && rect.right <= win.innerWidth + 1) continue;
      elements.push({
        selector: selectorPath(el),
        tag: el.tagName.toLowerCase(),
        // Document coordinates prevent horizontal scroll position changing diagnoses.
        rect: { x: rect.x + win.scrollX, y: rect.y + win.scrollY, width: rect.width, height: rect.height },
        text: measuredText.slice(0, 120),
        overflowX: cs.overflowX,
        overflowY: cs.overflowY,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        insideHorizontalScroller: clippedAncestor(el),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        isInteractive: interactive,
        intentionallyClipped: intentional,
        inlineTextLink: el.matches("a[href]") && cs.display === "inline" && !!el.closest("p,li,blockquote")
      });
    }
    return {
      innerWidth: win.innerWidth,
      innerHeight: win.innerHeight,
      scrollWidth: doc.documentElement.scrollWidth,
      scrollHeight: doc.documentElement.scrollHeight,
      elements,
      checkTapTargets,
      scannedElements: Math.min(limit, all.length),
      truncated: all.length > limit
    };
  }

  // src/core/security/framing.ts
  function safeHttpUrl(value) {
    if (typeof value !== "string") return false;
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }

  // src/content/agent.ts
  var frameName = typeof window !== "undefined" ? window.name || "" : "";
  if (frameName.startsWith("viewgrid:")) {
    const g = globalThis;
    if (!g.__viewgridAgentInstalled) {
      g.__viewgridAgentInstalled = true;
      initAgent(frameName.slice("viewgrid:".length));
    }
  } else if (typeof window !== "undefined" && window.top !== window && location.ancestorOrigins?.[0]?.startsWith("chrome-extension://")) {
    const extBrowser = globalThis.browser || globalThis.chrome;
    const extensionOrigin = extBrowser?.runtime?.getURL("")?.replace(/\/$/, "");
    const identify = (event) => {
      if (event.source !== window.parent || event.origin !== extensionOrigin || event.data?.type !== "vg/preview-identity") return;
      if (typeof event.data.viewportId !== "string") return;
      window.removeEventListener("message", identify);
      const g = globalThis;
      if (!g.__viewgridAgentInstalled) {
        g.__viewgridAgentInstalled = true;
        initAgent(event.data.viewportId);
      }
    };
    window.addEventListener("message", identify);
    window.parent.postMessage({ type: "vg/identify-preview" }, extensionOrigin);
  } else if (typeof window !== "undefined" && window.top === window) {
    const g = globalThis;
    if (!g.__viewgridShortcutInstalled) {
      g.__viewgridShortcutInstalled = true;
      window.addEventListener("keydown", (e) => {
        const isV = e.key === "v" || e.key === "V" || e.code === "KeyV";
        const isAltShiftV = e.altKey && e.shiftKey && isV;
        const isCtrlShiftV = e.ctrlKey && e.shiftKey && isV;
        const isAltV = e.altKey && !e.ctrlKey && !e.shiftKey && isV;
        const isMetaShiftV = e.metaKey && e.shiftKey && isV;
        if (isAltShiftV || isCtrlShiftV || isAltV || isMetaShiftV) {
          const target = e.target;
          const isEditable = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
          if (isCtrlShiftV && isEditable) return;
          e.preventDefault();
          e.stopPropagation();
          try {
            const extBrowser = g.browser || g.chrome;
            extBrowser?.runtime?.sendMessage?.({
              type: "vg/open-workspace-tab",
              url: window.location.href
            });
          } catch {
          }
        }
      }, { capture: true });
    }
  }
  function initAgent(viewportId) {
    const g = globalThis;
    const extBrowser = g.browser || g.chrome;
    const guard = new LoopGuard(Math.floor(performance.timeOrigin * 1e3));
    let suppressUntil = 0;
    const suppress = (ms = 120) => {
      suppressUntil = performance.now() + ms;
      guard.beginApply();
      window.setTimeout(() => guard.endApply(), ms);
    };
    const suppressed = () => guard.isApplying() || performance.now() < suppressUntil;
    let seq = 0;
    const emit = (channel, payload) => {
      if (suppressed()) return;
      seq += 1;
      const env = {
        channel,
        sourceViewportId: viewportId,
        epoch: guard.currentEpoch,
        seq,
        ts: Date.now(),
        payload
      };
      try {
        if (channel === "scroll") {
          window.parent.postMessage({ type: "vg/scroll-event", env }, extBrowser.runtime.getURL("").replace(/\/$/, ""));
        } else extBrowser?.runtime?.sendMessage?.({ type: "vg/agent-event", env });
      } catch {
      }
    };
    const reloadKey = `viewgrid:remote-reload:${viewportId}`;
    const hello = () => {
      const result = extBrowser?.runtime?.sendMessage?.({ type: "vg/agent-hello", viewportId });
      result?.then?.((reply) => window.postMessage({ type: "vg/preview-worker-context", verified: reply?.ok === true }, location.origin))?.catch?.(() => {
      });
    };
    void hello();
    window.addEventListener("pageshow", hello);
    let remoteReload = false;
    try {
      remoteReload = sessionStorage.getItem(reloadKey) === "1";
      sessionStorage.removeItem(reloadKey);
    } catch {
    }
    if (!remoteReload && performance.getEntriesByType("navigation")[0]?.type === "reload") {
      window.setTimeout(() => emit("reload", {}), 300);
    }
    let observedUrl = location.href;
    window.setInterval(() => {
      if (location.href === observedUrl) return;
      if (suppressed()) return;
      observedUrl = location.href;
      if (safeHttpUrl(observedUrl)) emit("nav", { url: observedUrl });
    }, 250);
    for (const kind of ["keydown", "keyup"]) document.addEventListener(kind, (e) => {
      if (!e.isTrusted || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      emit("key", { selector: selectorPath(el), kind, key: e.key, code: e.code, shiftKey: e.shiftKey });
    }, true);
    let scrollPending = false;
    let userInteracted = false;
    window.addEventListener("wheel", () => {
      userInteracted = true;
    }, { passive: true, capture: true });
    window.addEventListener("touchmove", () => {
      userInteracted = true;
    }, { passive: true, capture: true });
    window.addEventListener("pointerdown", () => {
      userInteracted = true;
    }, { passive: true, capture: true });
    window.addEventListener("keydown", (e) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(e.key)) {
        userInteracted = true;
      }
    }, { passive: true, capture: true });
    let lastScrollX = window.scrollX;
    let lastScrollY = window.scrollY;
    window.addEventListener(
      "scroll",
      () => {
        if (!userInteracted || scrollPending || suppressed()) return;
        const dx = Math.abs(window.scrollX - lastScrollX);
        const dy = Math.abs(window.scrollY - lastScrollY);
        if (dx < 2 && dy < 2) return;
        scrollPending = true;
        requestAnimationFrame(() => {
          scrollPending = false;
          lastScrollX = window.scrollX;
          lastScrollY = window.scrollY;
          emit("scroll", scrollRatios(window.scrollX, window.scrollY, maxScrollX(), maxScrollY()));
        });
      },
      { passive: true, capture: true }
    );
    const maxScrollX = () => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const maxScrollY = () => Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
    document.addEventListener(
      "click",
      (ev) => {
        if (suppressed()) return;
        const el = ev.target instanceof Element ? ev.target : null;
        if (!el) return;
        if (ev.defaultPrevented || ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey) return;
        const anchor = el.closest?.("a[href]");
        if (anchor) {
          const href = anchor.href;
          if (safeHttpUrl(href) && !anchor.download && anchor.target !== "_blank") emit("nav", { url: href });
        } else emit("click", { selector: selectorPath(el), nx: ev.clientX / window.innerWidth, ny: ev.clientY / window.innerHeight });
      },
      true
    );
    document.addEventListener(
      "input",
      (ev) => {
        if (suppressed()) return;
        const el = ev.target;
        if (!el || !el.tagName) return;
        emit("input", {
          selector: selectorPath(el),
          value: el.value,
          checked: "checked" in el ? el.checked : void 0
        });
      },
      true
    );
    document.addEventListener(
      "change",
      (ev) => {
        if (suppressed()) return;
        const el = ev.target;
        if (!el || !el.tagName) return;
        emit("form", {
          selector: selectorPath(el),
          value: el.value,
          checked: "checked" in el ? el.checked : void 0
        });
      },
      true
    );
    function handleAgentDo(msg) {
      if (!msg || typeof msg !== "object") return;
      const cmd = String(msg.cmd || "");
      if (["reload", "hardReload", "back", "forward", "goto", "scrollToTop", "highlight"].includes(cmd)) suppress(250);
      if (cmd === "reload" || cmd === "hardReload") {
        try {
          sessionStorage.setItem(reloadKey, "1");
        } catch {
        }
        if (cmd === "hardReload") location.reload(true);
        else location.reload();
      } else if (cmd === "back") history.back();
      else if (cmd === "forward") history.forward();
      else if (cmd === "goto" && typeof msg.url === "string") {
        try {
          const u = new URL(msg.url);
          if (u.protocol === "http:" || u.protocol === "https:") {
            location.assign(u.href);
          }
        } catch {
        }
      } else if (cmd === "scrollToTop") window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      else if (cmd === "setColorScheme") applyColorScheme(String(msg.scheme || "auto"));
      else if (cmd === "setTouchCursor") applyTouchCursor(!!msg.enabled);
      else if (cmd === "highlight" && typeof msg.selector === "string") {
        try {
          const el = document.querySelector(msg.selector);
          if (!el) return;
          el.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
          const before = el.style.outline, offset = el.style.outlineOffset;
          el.style.outline = "3px solid #f59e0b";
          el.style.outlineOffset = "3px";
          window.setTimeout(() => {
            el.style.outline = before;
            el.style.outlineOffset = offset;
          }, 2500);
        } catch {
        }
      }
    }
    extBrowser?.runtime?.onMessage?.addListener((msg) => {
      if (!msg || typeof msg.type !== "string") return;
      if (msg.type === "vg/agent-apply" && msg.env) {
        const env = msg.env;
        if (!guard.accept(env, viewportId)) return;
        apply(env);
        return;
      }
      if (msg.type === "vg/agent-do") {
        handleAgentDo(msg);
        return;
      }
      if (msg.type === "vg/agent-scan") {
        const metrics = collectMetrics(document, window, !Array.isArray(msg.touchViewportIds) || msg.touchViewportIds.includes(viewportId));
        const issues = runCoreDetectors(metrics).map((i) => ({ ...i, data: { ...i.data, url: location.href, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight } }));
        extBrowser?.runtime?.sendMessage?.({ type: "vg/scan-result", viewportId, scanId: msg.scanId, issues, scannedElements: metrics.scannedElements, truncated: metrics.truncated })?.catch?.(() => {
        });
      }
    });
    window.addEventListener("message", (e) => {
      if (e.source !== window.parent) return;
      const extOrigin = extBrowser?.runtime?.getURL("")?.replace(/\/$/, "");
      if (!extOrigin || e.origin !== extOrigin) return;
      if (e.data?.type === "vg/scroll-apply" && e.data.env?.channel === "scroll") {
        if (guard.accept(e.data.env, viewportId)) apply(e.data.env);
        return;
      }
      if (e.data && e.data.type === "vg/agent-do") {
        const cmd = e.data.cmd;
        if (cmd === "setColorScheme" || cmd === "setTouchCursor" || cmd === "scrollToTop") {
          handleAgentDo(e.data);
        }
      }
    });
    let touchCursorEl = null;
    let touchCursorInstalled = false;
    function applyTouchCursor(enabled) {
      if (!enabled) {
        if (touchCursorEl) touchCursorEl.style.display = "none";
        document.documentElement.classList.remove("vg-touch-mode");
        return;
      }
      document.documentElement.classList.add("vg-touch-mode");
      if (!touchCursorEl) {
        touchCursorEl = document.createElement("div");
        touchCursorEl.id = "vg-touch-cursor";
        const style = document.createElement("style");
        style.id = "vg-touch-cursor-style";
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
      touchCursorEl.style.display = "block";
      if (!touchCursorInstalled) {
        touchCursorInstalled = true;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let scrollStartX = 0;
        let scrollStartY = 0;
        let hasScrolled = false;
        window.addEventListener("mousemove", (e) => {
          if (!touchCursorEl || !document.documentElement.classList.contains("vg-touch-mode")) return;
          touchCursorEl.style.display = "block";
          touchCursorEl.style.left = `${e.clientX}px`;
          touchCursorEl.style.top = `${e.clientY}px`;
          if (isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dy) > 4 || Math.abs(dx) > 4) {
              hasScrolled = true;
              try {
                window.getSelection()?.removeAllRanges();
              } catch {
              }
              window.scrollTo({
                left: scrollStartX - dx,
                top: scrollStartY - dy,
                behavior: "instant"
              });
            }
          }
        }, { passive: false });
        window.addEventListener("mousedown", (e) => {
          if (!document.documentElement.classList.contains("vg-touch-mode")) return;
          if (touchCursorEl) touchCursorEl.classList.add("vg-touch-pressed");
          if (e.button === 0) {
            isDragging = true;
            hasScrolled = false;
            startX = e.clientX;
            startY = e.clientY;
            scrollStartX = window.scrollX;
            scrollStartY = window.scrollY;
          }
        }, { passive: true });
        window.addEventListener("mouseup", () => {
          if (touchCursorEl) touchCursorEl.classList.remove("vg-touch-pressed");
          isDragging = false;
        }, { passive: true });
        window.addEventListener("click", (e) => {
          if (document.documentElement.classList.contains("vg-touch-mode") && hasScrolled) {
            e.preventDefault();
            e.stopPropagation();
            hasScrolled = false;
          }
        }, true);
        window.addEventListener("mouseleave", () => {
          if (touchCursorEl) touchCursorEl.style.display = "none";
          isDragging = false;
        }, { passive: true });
      }
    }
    function apply(env) {
      const p = env.payload ?? {};
      switch (env.channel) {
        case "scroll":
          userInteracted = false;
          applyScrollRatios(window, p);
          lastScrollX = window.scrollX;
          lastScrollY = window.scrollY;
          break;
        case "click": {
          suppress(150);
          const target = document.querySelector(String(p.selector ?? ""));
          if (target) {
            target.click();
          } else if (typeof p.nx === "number") {
            const x = p.nx * window.innerWidth;
            const y = (Number(p.ny) || 0) * window.innerHeight;
            document.elementFromPoint(x, y)?.click();
          }
          break;
        }
        case "nav":
          suppress(300);
          if (safeHttpUrl(p.url) && p.url !== location.href) {
            observedUrl = p.url;
            location.assign(p.url);
          }
          break;
        case "reload":
          handleAgentDo({ cmd: "reload" });
          break;
        case "key": {
          suppress(100);
          const target = document.querySelector(String(p.selector || "")) || document.activeElement;
          target?.dispatchEvent(new KeyboardEvent(p.kind === "keyup" ? "keyup" : "keydown", { key: String(p.key || ""), code: String(p.code || ""), shiftKey: !!p.shiftKey, bubbles: true, cancelable: true }));
          break;
        }
        case "input":
        case "form": {
          suppress(100);
          const target = document.querySelector(String(p.selector ?? ""));
          if (target) {
            if (typeof p.value === "string" && target.value !== p.value) {
              const proto = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : target instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
              Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(target, p.value);
            }
            if (typeof p.checked === "boolean" && "checked" in target && target.checked !== p.checked) {
              Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked")?.set?.call(target, p.checked);
            }
            target.dispatchEvent(new Event("input", { bubbles: true }));
            target.dispatchEvent(new Event("change", { bubbles: true }));
          }
          break;
        }
      }
    }
    let originalAppearance = null;
    function applyColorScheme(scheme) {
      if (scheme === "auto" && !originalAppearance) return;
      if (scheme !== "auto" && !originalAppearance) originalAppearance = [document.documentElement, document.body].filter((el) => !!el).map((el) => ({ el, theme: el.getAttribute("data-theme"), color: el.getAttribute("data-color-scheme"), dark: el.classList.contains("dark"), light: el.classList.contains("light") }));
      let styleEl = document.getElementById("viewgrid-color-scheme-override");
      const docEl = document.documentElement;
      const bodyEl = document.body;
      if (scheme === "dark") {
        if (!styleEl) {
          styleEl = document.createElement("style");
          styleEl.id = "viewgrid-color-scheme-override";
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
        docEl.dataset.colorScheme = "dark";
        docEl.dataset.theme = "dark";
        docEl.classList.add("dark");
        docEl.classList.remove("light");
        if (bodyEl) {
          bodyEl.classList.add("dark");
          bodyEl.classList.remove("light");
        }
        try {
          let bg = window.getComputedStyle(bodyEl || docEl).backgroundColor;
          if (!bg || bg === "transparent" || bg.startsWith("rgba(0, 0, 0, 0)")) {
            bg = window.getComputedStyle(docEl).backgroundColor;
          }
          const isTransparent = !bg || bg === "transparent" || bg.startsWith("rgba(0, 0, 0, 0)");
          const rgb = bg.match(/\d+/g);
          const lum = isTransparent ? 1 : rgb && rgb.length >= 3 && rgb.slice(0, 3).some((c) => Number(c) > 0) ? (0.299 * Number(rgb[0]) + 0.587 * Number(rgb[1]) + 0.114 * Number(rgb[2])) / 255 : 1;
          if (lum > 0.5) {
            docEl.classList.add("vg-force-invert");
          } else {
            docEl.classList.remove("vg-force-invert");
          }
        } catch {
        }
      } else if (scheme === "light") {
        if (!styleEl) {
          styleEl = document.createElement("style");
          styleEl.id = "viewgrid-color-scheme-override";
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
        docEl.dataset.colorScheme = "light";
        docEl.dataset.theme = "light";
        docEl.classList.add("light");
        docEl.classList.remove("dark");
        if (bodyEl) {
          bodyEl.classList.add("light");
          bodyEl.classList.remove("dark");
        }
        try {
          let bg = window.getComputedStyle(bodyEl || docEl).backgroundColor;
          if (!bg || bg === "transparent" || bg.startsWith("rgba(0, 0, 0, 0)")) {
            bg = window.getComputedStyle(docEl).backgroundColor;
          }
          const rgb = bg.match(/\d+/g);
          const lum = rgb && rgb.length >= 3 && rgb.slice(0, 3).some((c) => Number(c) > 0) ? (0.299 * Number(rgb[0]) + 0.587 * Number(rgb[1]) + 0.114 * Number(rgb[2])) / 255 : 1;
          if (lum < 0.45) {
            docEl.classList.add("vg-force-invert");
          } else {
            docEl.classList.remove("vg-force-invert");
          }
        } catch {
        }
      } else {
        styleEl?.remove();
        for (const original of originalAppearance ?? []) {
          const { el, theme, color, dark, light } = original;
          if (theme === null) el.removeAttribute("data-theme");
          else el.setAttribute("data-theme", theme);
          if (color === null) el.removeAttribute("data-color-scheme");
          else el.setAttribute("data-color-scheme", color);
          el.classList.toggle("dark", dark);
          el.classList.toggle("light", light);
          el.classList.remove("vg-force-invert");
        }
        originalAppearance = null;
      }
    }
  }
})();
