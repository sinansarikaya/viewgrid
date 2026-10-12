import { useEffect } from 'react';
import { useStore } from './store';
import { isCapturing } from './capture';

/** Keep an explicitly fitted display in its canvas; manual zoom cancels fit. */
export function useFitTracking() {
  const configuration = useStore(state => `${state.model.layout}:${state.model.frames}:${state.focusMode}:${state.focusedId}:${state.model.viewports.map(viewport => `${viewport.id}/${viewport.orientation}/${viewport.hidden}/${viewport.minimized}`).join(',')}`);
  useEffect(() => {
    const canvas = document.querySelector('main');
    if (!canvas) return;
    let pending = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        if (!isCapturing() && Object.keys(useStore.getState().fitZooms).length) useStore.getState().fitToScreen(false);
      });
    });
    observer.observe(canvas);
    return () => { observer.disconnect(); cancelAnimationFrame(pending); };
  }, [configuration]);
}
