import { requestCapture } from './bridge';
import { captureTiles } from '../../core/capture/tiles';
let busy = false;
export function isCapturing() { return busy; }
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = src; });
}
/** Capture the full logical iframe viewport without moving/reloading its DOM node. */
export async function captureViewport(content: HTMLElement): Promise<Blob> {
  if (busy) throw new Error('A capture is already running');
  const frame = content.querySelector('iframe');
  if (!frame) throw new Error('Viewport is not loaded');
  const width = parseFloat(frame.style.width), height = parseFloat(frame.style.height);
  const screenW = window.innerWidth, screenH = window.innerHeight;
  const tiles = captureTiles(width, height, screenW, screenH);
  const restored = new Map<HTMLElement, string | null>();
  let ancestor: HTMLElement | null = frame;
  while (ancestor) { restored.set(ancestor, ancestor.getAttribute('style')); ancestor = ancestor.parentElement; }
  const sheet = document.createElement('style');
  sheet.textContent = 'body[data-viewgrid-capture] * { visibility:hidden !important; } body[data-viewgrid-capture] iframe[data-viewgrid-capture-frame] { visibility:visible !important; }';
  document.head.appendChild(sheet);
  busy = true;
  const cancel = { value: false };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel.value = true; };
  window.addEventListener('keydown', onKey, true);
  try {
    document.body.dataset.viewgridCapture = 'true';
    for (const el of restored.keys()) {
      for (const [k, v] of Object.entries({ overflow: 'visible', transform: 'none', filter: 'none', 'backdrop-filter': 'none', perspective: 'none', contain: 'none', 'clip-path': 'none', 'border-radius': '0' })) el.style.setProperty(k, v, 'important');
    }
    frame.dataset.viewgridCaptureFrame = 'true';
    for (const [k, v] of Object.entries({ position: 'fixed', left: '0', top: '0', margin: '0', border: '0', 'z-index': '2147483647', 'transform-origin': 'top left' })) frame.style.setProperty(k, v, 'important');
    const canvas = document.createElement('canvas');
    let scale = 1;
    for (const tile of tiles) {
      if (cancel.value) throw new Error('Capture cancelled');
      if (window.innerWidth !== screenW || window.innerHeight !== screenH) throw new Error('Window resized during capture. Please retry.');
      frame.style.setProperty('transform', `translate(${-tile.x}px, ${-tile.y}px)`, 'important');
      await wait(550); // Chrome captureVisibleTab permits at most two captures/second.
      const img = await loadImage(await requestCapture());
      if (tile.x === 0 && tile.y === 0) {
        scale = img.naturalWidth / screenW;
        if (width * height * scale * scale > 32_000_000) throw new Error('Capture exceeds the 32 megapixel limit');
        canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
      }
      const x = Math.round(tile.x * scale), y = Math.round(tile.y * scale);
      const w = Math.round((tile.x + tile.width) * scale) - x, h = Math.round((tile.y + tile.height) * scale) - y;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h, x, y, w, h);
    }
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed')), 'image/png'));
  } finally {
    for (const [el, style] of restored) { if (style === null) el.removeAttribute('style'); else el.setAttribute('style', style); }
    delete frame.dataset.viewgridCaptureFrame; delete document.body.dataset.viewgridCapture;
    sheet.remove(); window.removeEventListener('keydown', onKey, true); busy = false;
  }
}
