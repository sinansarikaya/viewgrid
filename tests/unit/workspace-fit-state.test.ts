// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const storage = vi.hoisted(() => ({set:vi.fn().mockResolvedValue(undefined)}));
vi.mock('../../src/platform/browser', () => ({b:{storage:{local:storage}}}));
import { useStore } from '../../src/ui/workspace/store';
import { BUILTIN_DEVICES } from '../../src/core/devices/builtin';
import { defaultWorkspace } from '../../src/core/workspace/serialize';
import { displayedSize } from '../../src/core/workspace/layout';

beforeEach(() => {
  vi.useFakeTimers(); vi.stubGlobal('CSS', {escape:(value:string)=>value});
  useStore.setState({model:defaultWorkspace(),fitZooms:{},savedWorkspaces:{},focusMode:false});
  useStore.getState().addDevice(BUILTIN_DEVICES[0]!);
  vi.clearAllTimers(); storage.set.mockClear();
  const canvas=document.createElement('main');
  Object.defineProperties(canvas,{clientWidth:{value:1000},clientHeight:{value:700}});
  document.body.appendChild(canvas);
});
afterEach(() => { document.body.replaceChildren(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('fit is separate from saved manual zoom', () => {
  it('keeps the model and persisted payload unchanged', async () => {
    const before=structuredClone(useStore.getState().model);
    useStore.getState().fitToScreen(false);
    expect(Object.keys(useStore.getState().fitZooms)).toHaveLength(1);
    expect(useStore.getState().model).toEqual(before);
    await useStore.getState().persist();
    const payload=storage.set.mock.calls[0]![0]['viewgrid.store.v1'];
    expect(payload.model).toEqual(before);
    expect(payload.fitZooms).toBeUndefined();
  });
  it('cancels fit on explicit zoom and on loading a saved workspace', () => {
    const id=useStore.getState().model.viewports[0]!.id;
    useStore.getState().fitToScreen(false);
    useStore.getState().setZoom(id,.5);
    expect(useStore.getState().fitZooms).toEqual({});
    expect(useStore.getState().model.viewports[0]!.zoom).toBe(.5);
    useStore.setState({savedWorkspaces:{saved:structuredClone(useStore.getState().model)}});
    useStore.getState().fitToScreen(false);
    useStore.getState().loadSaved('saved');
    expect(useStore.getState().fitZooms).toEqual({});
    expect(useStore.getState().model.viewports[0]!.zoom).toBe(.5);
  });
  it('supports a smaller fitted display without changing the manual zoom floor', () => {
    expect(displayedSize({width:400,height:800},.05,true)).toEqual({width:20,height:40});
    expect(displayedSize({width:400,height:800},.05)).toEqual({width:40,height:80});
  });
});
