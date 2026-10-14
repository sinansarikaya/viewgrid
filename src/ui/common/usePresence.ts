import { useEffect, useState } from 'react';
export const PRESENCE_DURATION_MS = 180;

/** Keep exit content mounted without keeping it interactive. */
export function usePresence(open: boolean, duration = PRESENCE_DURATION_MS): boolean {
  const [present, setPresent] = useState(open);
  useEffect(() => {
    if (open) { setPresent(true); return; }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setPresent(false); return; }
    const timer = window.setTimeout(() => setPresent(false), duration);
    return () => window.clearTimeout(timer);
  }, [open, duration]);
  return open || present;
}
