// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../../src/ui/common/Button';

let root: Root, host: HTMLDivElement;
function event(element: Element, type: string) {
  act(() => { element.dispatchEvent(new MouseEvent(type, { bubbles: true, relatedTarget: null })); });
}
function tick() { act(() => { vi.advanceTimersByTime(200); }); }
beforeEach(() => {
  vi.useFakeTimers();
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root.render(React.createElement(Button, {title:'Fit to screen', 'aria-describedby':'existing'}, 'Fit')); });
});
afterEach(() => { act(() => { root.unmount(); }); host.remove(); vi.useRealTimers(); });
describe('shared tooltip interaction', () => {
  it('opens on keyboard focus, preserves description and dismisses with Escape', () => {
    const button = host.querySelector('button')!;
    act(() => { button.focus(); });
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('Fit to screen');
    expect(button.getAttribute('aria-describedby')).toContain('existing');
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape' })); });
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });
  it('stays hoverable when focus leaves, then dismisses after pointer departure', () => {
    const button = host.querySelector('button')!;
    act(() => { button.focus(); });
    event(button, 'mouseover'); event(button, 'mouseout');
    const tooltip = document.querySelector('[role="tooltip"]')!;
    event(tooltip, 'mouseover');
    act(() => { button.blur(); }); tick();
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    event(tooltip, 'mouseout'); tick();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });
  it('clears tooltip hover state after Escape and preserves trigger hover on blur', () => {
    const button = host.querySelector('button')!;
    event(button, 'mouseover'); event(button, 'mouseout');
    event(document.querySelector('[role="tooltip"]')!, 'mouseover');
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'})); });
    event(button, 'mouseover'); act(() => { button.focus(); button.blur(); }); tick();
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    event(button, 'mouseout'); tick();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });
});
