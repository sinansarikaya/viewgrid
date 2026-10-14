import React, { useEffect, useRef } from 'react';
import { usePresence } from './usePresence';
import s from './AnimatedPresence.module.css';

export function AnimatedPresence({ open, kind = 'modal', children }: { open: boolean; kind?: 'modal' | 'drawer' | 'menu'; children: React.ReactNode }) {
  const present = usePresence(open);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) trigger.current = document.activeElement as HTMLElement;
    else if (root.current?.contains(document.activeElement) && trigger.current?.isConnected) trigger.current.focus();
  }, [open]);
  if (!present) return null;
  return <div ref={root} className={s.presence} data-kind={kind} data-state={open ? 'open' : 'closing'} aria-hidden={!open || undefined} {...(!open ? { inert: '' } : {})}>{children}</div>;
}
