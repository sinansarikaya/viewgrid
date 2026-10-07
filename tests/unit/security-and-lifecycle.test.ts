import { describe, expect, it } from 'vitest';
import { isWorkspaceUrl, relaxFirefoxHeaders, safeHttpUrl, workspaceRule } from '../../src/core/security/framing';
import { LoopGuard } from '../../src/core/sync/protocol';

describe('production framing policy', () => {
  it('does not install a rule without an open workspace', () => expect(workspaceRule([], 'extension')).toEqual([]));
  it('scopes direct preview rules to explicit tab IDs and extension initiator', () => {
    const rule = workspaceRule([42], 'extension')[0]!;
    expect(rule.condition).toEqual({ resourceTypes: ['sub_frame'], tabIds: [42], initiatorDomains: ['extension'] });
    expect(rule.action.responseHeaders.map(h => h.header)).not.toContain('set-cookie');
  });
  it('rejects ordinary pages that merely contain workspace.html', () => {
    const own = 'chrome-extension://ours/workspace.html';
    expect(isWorkspaceUrl('https://example.com/workspace.html', own)).toBe(false);
    expect(isWorkspaceUrl('chrome-extension://other/workspace.html', own)).toBe(false);
    expect(isWorkspaceUrl(own + '?url=https://example.com', own)).toBe(true);
  });
  it('Firefox preserves script CSP and every cookie attribute', () => {
    const cookie = { name: 'Set-Cookie', value: 'session=x; SameSite=Strict; Secure' };
    const out = relaxFirefoxHeaders([{ name: 'X-Frame-Options', value: 'DENY' }, { name: 'Content-Security-Policy', value: "default-src 'self'; frame-ancestors 'none'; script-src 'none'" }, cookie]);
    expect(out).toHaveLength(2);
    expect(out[0]!.value).toContain("script-src 'none'");
    expect(out[0]!.value).not.toContain('frame-ancestors');
    expect(out[1]).toEqual(cookie);
  });
  it('rejects executable and local-file navigation', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,x', 'file:///tmp/x', 'garbage']) expect(safeHttpUrl(url)).toBe(false);
    expect(safeHttpUrl('http://localhost:3000')).toBe(true);
  });
});
describe('document lifecycle ordering', () => {
  const env = (epoch: number, seq: number) => ({ channel: 'scroll' as const, sourceViewportId: 'phone', epoch, seq, ts: 0, payload: {} });
  it('accepts the first event after iframe reload with a newer document epoch', () => {
    const hub = new LoopGuard();
    expect(hub.accept(env(100, 900))).toBe(true);
    expect(hub.accept(env(101, 1))).toBe(true);
  });
  it('rejects in-flight events from the previous document even with a larger sequence', () => {
    const hub = new LoopGuard(); hub.accept(env(101, 1));
    expect(hub.accept(env(100, 999))).toBe(false);
    expect(hub.accept(env(101, 1))).toBe(false);
    expect(hub.accept(env(101, 2))).toBe(true);
  });
});
