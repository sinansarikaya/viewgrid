/** Framing exceptions are confined to verified workspace tabs. */
export function isWorkspaceUrl(url: string | undefined, workspaceUrl: string): boolean {
  if (!url) return false;
  try {
    const a = new URL(url), b = new URL(workspaceUrl);
    return a.protocol === b.protocol && a.host === b.host && a.pathname === b.pathname;
  } catch { return false; }
}

export function workspaceRule(tabIds: number[]) {
  if (!tabIds.length) return [];
  return [{
    id: 1001, priority: 1,
    action: { type: 'modifyHeaders', requestHeaders: [
      { header: 'cache-control', operation: 'set', value: 'no-cache' },
      { header: 'pragma', operation: 'set', value: 'no-cache' },
    ], responseHeaders: [
      { header: 'x-frame-options', operation: 'remove' },
      // DNR cannot edit one CSP directive or select parentFrameId. A tab-scoped
      // subframe rule also covers page-initiated navigation and reload. Ordinary
      // tabs retain their protections; nested frames in a workspace are included.
      { header: 'content-security-policy', operation: 'remove' },
      { header: 'content-security-policy-report-only', operation: 'remove' },
      { header: 'cache-control', operation: 'set', value: 'no-store' },
    ] },
    condition: { resourceTypes: ['sub_frame'], tabIds },
  }];
}

export function relaxFirefoxHeaders(headers: Array<{ name: string; value?: string }>) {
  return headers.filter(h => h.name.toLowerCase() !== 'x-frame-options').map(h => {
    if (!['content-security-policy', 'content-security-policy-report-only'].includes(h.name.toLowerCase()) || !h.value) return h;
    return { ...h, value: h.value.split(';').filter(d => !/^\s*frame-ancestors(?:\s|$)/i.test(d)).join(';') };
  });
}

export function safeHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}
