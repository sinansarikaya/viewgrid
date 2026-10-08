"use strict";
(() => {
  // src/content/world-inject.ts
  if (window.name.startsWith("viewgrid:") && location.ancestorOrigins?.[0]?.startsWith("chrome-extension://") && "serviceWorker" in navigator) {
    const container = navigator.serviceWorker;
    const original = container.register.bind(container);
    const verified = new Promise((resolve) => {
      const receive = (event) => {
        if (event.source !== window || event.data?.type !== "vg/preview-worker-context") return;
        window.removeEventListener("message", receive);
        resolve(event.data.verified === true);
      };
      window.addEventListener("message", receive);
      window.setTimeout(() => {
        window.removeEventListener("message", receive);
        resolve(false);
      }, 2e3);
    });
    Object.defineProperty(container, "register", { configurable: true, value: async (...args) => {
      if (await verified) throw new DOMException("Service workers are disabled in ViewGrid network previews.", "SecurityError");
      return original(...args);
    } });
    void verified.then(async (ok) => {
      if (!ok) return;
      const controlled = !!container.controller;
      const registrations = await container.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if (controlled && registrations.length) location.reload();
    }).catch(() => {
    });
  }
})();
