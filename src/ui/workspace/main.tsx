import React from 'react';
import { createRoot } from 'react-dom/client';
import '../global.css';
import { App } from './App';
import { useStore } from './store';
import { listenAgents, workspaceHello, injectAgents, sendSyncApply } from './bridge';
import { acceptScanResult } from './scan';
import type { SyncEnvelope } from '../../core/types';
import { LoopGuard } from '../../core/sync/protocol';

const hub = new LoopGuard();
let navigationFence = 0;

async function boot() {
  await useStore.getState().hydrate();
  try {
    await workspaceHello();
  } catch (err) {
    console.warn('[viewgrid] workspaceHello deferred:', err);
  }
  listenAgents({
    onEvent: (env: SyncEnvelope) => {
      const s = useStore.getState();
      if (!s.model.sync[env.channel] || !s.model.viewports.some(v => v.id === env.sourceViewportId)) return;
      if (env.epoch < navigationFence) return;
      // hub-side accept (epoch/seq fencing) — also updates lastSeq
      if (!hub.accept(env)) return;
      void sendSyncApply(env);
    },
    onScanResult: acceptScanResult,
  });
  // sync toggles reset the epoch to fence stale echoes
  useStore.subscribe((s, prev) => {
    if (s.previewGeneration !== prev.previewGeneration) {
      // Agent epochs use performance.timeOrigin in microseconds. Old documents
      // may still emit a delayed reload while the replacement URL is loading.
      navigationFence = Date.now() * 1000;
      hub.reset();
    } else if (s.model.sync !== prev.model.sync) hub.reset();
  });
  window.addEventListener('message', event => {
    if (!['vg/identify-preview', 'vg/scroll-event'].includes(event.data?.type)) return;
    const frame = [...document.querySelectorAll<HTMLIFrameElement>('iframe[name^="viewgrid:"]')].find(frame => frame.contentWindow === event.source);
    if (!frame || !useStore.getState().model.viewports.some(v => frame.name === `viewgrid:${v.id}`)) return;
    if (event.data.type === 'vg/identify-preview') {
      frame.contentWindow?.postMessage({ type: 'vg/preview-identity', viewportId: frame.name.slice('viewgrid:'.length) }, event.origin);
      return;
    }
    const env = event.data.env as SyncEnvelope;
    const state = useStore.getState();
    if (!state.model.sync.scroll || env?.channel !== 'scroll' || env.sourceViewportId !== frame.name.slice('viewgrid:'.length) || env.epoch < navigationFence || !hub.accept(env)) return;
    for (const target of document.querySelectorAll<HTMLIFrameElement>('iframe[name^="viewgrid:"]')) {
      if (target === frame || !state.model.viewports.some(v => target.name === `viewgrid:${v.id}`)) continue;
      target.contentWindow?.postMessage({ type: 'vg/scroll-apply', env }, '*');
    }
  });
  createRoot(document.getElementById('root')!).render(<App hub={hub} />);
  // inject agents into current + future frames
  void injectAgents();
  document.addEventListener('load', (e) => {
    if ((e.target as HTMLElement)?.tagName === 'IFRAME') void injectAgents();
  }, true);
}

void boot();
