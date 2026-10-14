// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { BUILTIN_DEVICES } from '../../src/core/devices/builtin';
const mocks = vi.hoisted(() => ({ state: {} as any }));
vi.mock('../../src/ui/workspace/store', () => ({ useStore: () => mocks.state }));
vi.mock('../../src/ui/workspace/bridge', () => ({ preparePreview: vi.fn().mockResolvedValue(undefined), sendAgentCmd: vi.fn() }));
vi.mock('../../src/ui/workspace/DeviceFrame', () => ({ DeviceFrame: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('../../src/ui/common/useGeometryClass', () => ({ useGeometryClass: () => '' }));
import { ViewportCard } from '../../src/ui/workspace/ViewportCard';

let cleanup = () => {};
afterEach(() => cleanup());
it('keeps fitted zoom interactive in the header and dismisses settings outside or with Escape', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const profile = BUILTIN_DEVICES[0]!;
  const vp = { id: 'card', deviceId: profile.id, orientation: 'portrait', zoom: .37, url: '', minimized: false } as any;
  const setZoom = vi.fn();
  mocks.state = { language: 'en', profileOf: () => profile, fitZooms: { card: .37 }, previewGeneration: 0,
    model: { touchCursor: false, frames: false }, focus: vi.fn(), setZoom };
  const host = document.createElement('div'); document.body.appendChild(host);
  const root = createRoot(host);
  cleanup = () => { act(() => root.unmount()); host.remove(); };
  await act(async () => root.render(React.createElement(ViewportCard, { vp, index: 0, onRegister: vi.fn(), onShot: vi.fn(), onInjected: vi.fn() })));
  const trigger = host.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
  const menu = document.getElementById(trigger.getAttribute('aria-controls')!)!;
  const zoom = host.querySelector<HTMLSelectElement>('select[aria-label="Display zoom (CSS size unchanged)"]')!;
  expect(menu.contains(zoom)).toBe(false);
  expect(zoom.value).toBe('0.37');
  expect(zoom.selectedOptions[0]!.textContent).toBe('Fit 37%');
  expect(zoom.selectedOptions[0]!.disabled).toBe(true);
  act(() => { zoom.value = '0.5'; zoom.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(setZoom).toHaveBeenCalledWith('card', .5);
  vi.spyOn(menu.parentElement!, 'getBoundingClientRect').mockReturnValue({ top: window.innerHeight - 50, bottom: window.innerHeight - 22, right: 200, left: 170, width: 30, height: 28, x: 170, y: window.innerHeight - 50, toJSON: () => ({}) });
  Object.defineProperty(menu, 'scrollHeight', { value: 300 });
  act(() => trigger.click());
  expect(menu.className).toContain('menuAbove');
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
  act(() => menu.dispatchEvent(new Event('pointerdown', { bubbles: true })));
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
  act(() => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })));
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  act(() => trigger.click());
  act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  expect(menu.getAttribute('aria-hidden')).toBe('true');
  expect(document.activeElement).toBe(trigger);
});
