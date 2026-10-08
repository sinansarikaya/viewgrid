/**
 * Workspace ↔ background ↔ content-agents bridge.
 * Note: runtime.sendMessage from content scripts reaches ALL extension contexts,
 * so the workspace receives `vg/agent-event` and `vg/scan-result` directly;
 * the background only routes workspace → agents and services capture/inject.
 */
import { b } from '../../platform/browser';
import type { SyncEnvelope, Issue } from '../../core/types';
import { cropRectInImage, imageScale, captureFileName } from '../../core/capture/crop';
import type { Rect } from '../../core/types';

let workspaceTabId: number | undefined;
export async function workspaceHello() {
  const tab = await b.tabs.getCurrent();
  workspaceTabId = tab?.id;
  if (workspaceTabId === undefined) throw new Error('Workspace tab is unavailable');
  return workspaceMessage({ type: 'vg/workspace-hello' });
}
export function workspaceMessage(message: Record<string, unknown>) {
  return b.runtime.sendMessage({ ...message, tabId: workspaceTabId });
}

export async function preparePreview(url: string) {
  const reply = await workspaceMessage({ type: 'vg/prepare-preview', url }) as { ok?: boolean; error?: string } | undefined;
  if (!reply?.ok) throw new Error(reply?.error || 'Preview preparation did not respond. Reload the extension.');
}

export async function injectAgents() {
  // Content agents are already initialized at document_start via manifest content_scripts
  return Promise.resolve();
}

export function sendSyncApply(env: SyncEnvelope) {
  return workspaceMessage({ type: 'vg/sync-apply', env, excludeViewportId: env.sourceViewportId });
}

export function sendAgentCmd(target: string[] | 'all', cmd: string, url?: string, extra?: Record<string, unknown>) {
  return workspaceMessage({ type: 'vg/agent-cmd', target, cmd, url, ...extra });
}

export function requestScan(scanId: string, target: string[], touchViewportIds: string[]) {
  return workspaceMessage({ type: 'vg/scan-run', scanId, target, touchViewportIds }) as Promise<{ ok: boolean; reached?: string[] }>;
}

export async function requestCapture(format: 'png' | 'jpeg' = 'png', quality = 92): Promise<string> {
  const res = (await workspaceMessage({ type: 'vg/capture', format, quality })) as {
    ok: boolean;
    dataUrl?: string;
    error?: string;
  };
  if (!res?.ok || !res.dataUrl) throw new Error(res?.error ?? 'capture failed');
  return res.dataUrl;
}

export function listenAgents(handlers: {
  onEvent: (env: SyncEnvelope) => void;
  onScanResult: (viewportId: string, issues: Omit<Issue, 'viewportId'>[], scanId: string, truncated: boolean, scannedElements: number) => void;
}) {
  b.runtime.onMessage.addListener((msg: any, sender: any) => {
    if (sender.tab?.id !== workspaceTabId || !(sender.frameId > 0)) return;
    if (msg?.type === 'vg/agent-event' && msg.env) handlers.onEvent(msg.env);
    if (msg?.type === 'vg/scan-result') handlers.onScanResult(String(msg.viewportId), msg.issues ?? [], msg.scanId, !!msg.truncated, Number(msg.scannedElements) || 0);
  });
}

export async function grantHostAccess(): Promise<boolean> {
  try {
    const ok = await b.permissions.request({ origins: ['<all_urls>'] }).catch(() => false);
    if (ok) return true;
    return await b.permissions.request({ origins: ['*://*/*'] }).catch(() => false);
  } catch {
    return false;
  }
}

export async function hasHostAccess(): Promise<boolean> {
  try {
    const hasUrls = await b.permissions.contains({ origins: ['<all_urls>'] }).catch(() => false);
    if (hasUrls) return true;
    return await b.permissions.contains({ origins: ['*://*/*'] }).catch(() => false);
  } catch {
    return false;
  }
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = dataUrl;
  });
}

export async function cropToBlob(dataUrl: string, cssRect: Rect, format: 'png' | 'jpeg', quality = 0.92): Promise<Blob> {
  const img = await loadImage(dataUrl);
  const scale = imageScale(img.naturalWidth, window.innerWidth);
  const crop = cropRectInImage(img.naturalWidth, img.naturalHeight, cssRect, scale);
  if (!crop) throw new Error('viewport is not in the visible capture area');
  const expectedW = Math.round(cssRect.width * scale), expectedH = Math.round(cssRect.height * scale);
  if (Math.abs(crop.width - expectedW) > 1 || Math.abs(crop.height - expectedH) > 1) throw new Error('Capture is clipped. Fit the viewport on screen and retry.');
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))),
      format === 'png' ? 'image/png' : 'image/jpeg',
      quality,
    );
  });
}

export async function fullCaptureBlob(format: 'png' | 'jpeg' = 'png'): Promise<Blob> {
  const dataUrl = await requestCapture(format);
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d')!.drawImage(img, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))),
      format === 'png' ? 'image/png' : 'image/jpeg',
      0.92,
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  triggerDomDownload(url, filename);
}

function triggerDomDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function rectOf(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

export { captureFileName };
