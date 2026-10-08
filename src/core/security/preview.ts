import { safeHttpUrl } from './framing';

/** Never fall back to an unfiltered browsingData operation. */
export function workerRemovalOptions(url: string, firefox: boolean) {
  if (!safeHttpUrl(url)) throw new Error('Preview URL must use HTTP or HTTPS');
  const parsed = new URL(url);
  return firefox ? { hostnames: [parsed.hostname] } : { origins: [parsed.origin] };
}

export function uncachedHeaders(headers: Array<{ name: string; value?: string }>, response = false) {
  return [
    ...headers.filter(h => !['cache-control', 'pragma'].includes(h.name.toLowerCase())),
    { name: 'Cache-Control', value: response ? 'no-store' : 'no-cache' },
    ...response ? [] : [{ name: 'Pragma', value: 'no-cache' }],
  ];
}
