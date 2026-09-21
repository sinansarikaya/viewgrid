import React from 'react';
import { createRoot } from 'react-dom/client';
import '../global.css';
import { App } from './App';
import { useStore } from './store';
import { listenAgents, workspaceHello, injectAgents, sendSyncApply } from './bridge';
import type { SyncEnvelope } from '../../core/types';
import { LoopGuard } from '../../core/sync/protocol';

const hub = new LoopGuard();

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
      if (!s.model.sync[env.channel]) return;
      // hub-side accept (epoch/seq fencing) — also updates lastSeq
      if (!hub.accept(env)) return;
      void sendSyncApply(env);
    },
    onScanResult: (viewportId, issues) => {
      useStore.getState().mergeScanResult(viewportId, issues);
      useStore.getState().setScanning(false);
    },
  });
  // sync toggles reset the epoch to fence stale echoes
  useStore.subscribe((s, prev) => {
    if (s.model.sync !== prev.model.sync) hub.reset();
  });
  createRoot(document.getElementById('root')!).render(<App hub={hub} />);
  // inject agents into current + future frames
  void injectAgents();
  document.addEventListener('load', (e) => {
    if ((e.target as HTMLElement)?.tagName === 'IFRAME') void injectAgents();
  }, true);
}

void boot();
