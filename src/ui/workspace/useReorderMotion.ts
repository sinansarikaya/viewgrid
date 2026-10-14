import { useLayoutEffect, useRef } from 'react';
import { BEFORE_REORDER } from './reorder-events';

/** FLIP keyed cards only; free canvas keeps its independent position contract. */
export function useReorderMotion(order: string, layout: string) {
  const previous=useRef(new Map<string,DOMRect>());
  const lastOrder=useRef(order);
  useLayoutEffect(()=>{
    const elements=[...document.querySelectorAll<HTMLElement>('main [data-viewport-id]')];
    const next=new Map(elements.map(element=>[element.dataset.viewportId!,element.getBoundingClientRect()]));
    if (layout!=='free' && lastOrder.current!==order && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for(const element of elements){
        const before=previous.current.get(element.dataset.viewportId!),after=next.get(element.dataset.viewportId!);
        if(!before || !after)continue;
        const x=before.left-after.left,y=before.top-after.top;
        if(Math.abs(x)+Math.abs(y)<1)continue;
        element.animate([{transform:`translate(${x}px,${y}px)`},{transform:'translate(0,0)'}],{duration:180,easing:'cubic-bezier(.2,.8,.2,1)'});
      }
    }
    previous.current=next;lastOrder.current=order;
    const capture=()=>{
      previous.current=new Map(elements.map(element=>[element.dataset.viewportId!,element.getBoundingClientRect()]));
      for(const element of elements)for(const animation of element.getAnimations())animation.cancel();
    };
    document.addEventListener(BEFORE_REORDER,capture);
    const canvas=document.querySelector('main');
    const observer=new ResizeObserver(()=>{previous.current=new Map(elements.map(element=>[element.dataset.viewportId!,element.getBoundingClientRect()]));});
    if(canvas)observer.observe(canvas);
    return()=>{observer.disconnect();document.removeEventListener(BEFORE_REORDER,capture);};
  },[order,layout]);
}
