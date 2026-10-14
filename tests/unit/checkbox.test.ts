// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import {Checkbox} from '../../src/ui/common/Checkbox';
it('uses an actual labelled controlled checkbox and preserves disabled semantics',()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const host=document.createElement('div');document.body.appendChild(host);const root=createRoot(host),change=vi.fn();
  act(()=>root.render(React.createElement(Checkbox,{checked:false,onChange:change},'Scroll sync')));
  const input=host.querySelector('input')!;expect(input.type).toBe('checkbox');expect(input.checked).toBe(false);
  act(()=>host.querySelector('label')!.click());expect(change).toHaveBeenCalledTimes(1);expect(input.checked).toBe(false);
  act(()=>root.render(React.createElement(Checkbox,{checked:true,disabled:true,onChange:change},'Scroll sync')));
  expect(input.checked).toBe(true);expect(input.disabled).toBe(true);act(()=>host.querySelector('label')!.click());expect(change).toHaveBeenCalledTimes(1);
  act(()=>root.unmount());host.remove();
});
