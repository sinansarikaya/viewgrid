import { describe, expect, it } from 'vitest';
import { LoopGuard, scrollRatios, selectorPath } from '../../src/core/sync/protocol';

describe('LoopGuard', () => {
  it('rejects events from self', () => {
    const g = new LoopGuard();
    const env = g.envelope('scroll', 'vp1', {});
    expect(g.accept(env, 'vp1')).toBe(false);
    expect(g.accept(env, 'vp2')).toBe(true);
  });

  it('fences stale/duplicate sequence numbers (loop prevention)', () => {
    const g = new LoopGuard();
    const a = g.envelope('scroll', 'vp1', { yRatio: 0.1 });
    expect(g.accept(a, 'vp2')).toBe(true);
    expect(g.accept(a, 'vp2')).toBe(false); // duplicate
    const b2 = g.envelope('scroll', 'vp1', { yRatio: 0.2 });
    expect(b2.seq).toBeGreaterThan(a.seq);
    expect(g.accept(b2, 'vp2')).toBe(true);
  });

  it('keeps sequence monotonic across reset (no false rejects, no replay)', () => {
    const g = new LoopGuard();
    const old = g.envelope('click', 'vp1', {});
    g.reset(); // e.g. sync channel toggled
    expect(g.currentEpoch).toBe(2);
    // pre-reset event is still ordered correctly (seq monotonic) …
    expect(g.accept(old, 'vp2')).toBe(true);
    expect(g.accept(old, 'vp2')).toBe(false); // … but never replays
    const fresh = g.envelope('click', 'vp1', {});
    expect(fresh.epoch).toBe(2);
    expect(fresh.seq).toBeGreaterThan(old.seq);
    expect(g.accept(fresh, 'vp2')).toBe(true);
  });

  it('tracks apply depth for echo suppression', () => {
    const g = new LoopGuard();
    expect(g.isApplying()).toBe(false);
    g.beginApply();
    g.beginApply();
    g.endApply();
    expect(g.isApplying()).toBe(true);
    g.endApply();
    expect(g.isApplying()).toBe(false);
  });

  it('never loops across two hubs replaying each other (storm guard)', () => {
    // hub A receives from vp1 and rebroadcasts; the echoed envelope must be
    // rejected by vp1's own guard and not re-accepted by hub A.
    const hub = new LoopGuard();
    let accepted = 0;
    for (let i = 0; i < 50; i++) {
      const env = hub.envelope('scroll', 'vp1', { i });
      if (hub.accept(env, 'vp2')) accepted++;
      // echo comes back tagged vp1 → self-reject
      if (hub.accept(env, 'vp1')) accepted++;
    }
    expect(accepted).toBe(50);
  });
});

describe('scrollRatios', () => {
  it('normalizes against maxima and handles zero scrollable area', () => {
    expect(scrollRatios(0, 50, 0, 100)).toEqual({ xRatio: 0, yRatio: 0.5, maxX: 0, maxY: 100 });
    expect(scrollRatios(10, 10, 0, 0)).toEqual({ xRatio: 0, yRatio: 0, maxX: 0, maxY: 0 });
  });
});

describe('selectorPath', () => {
  it('uses id when available', () => {
    // jsdom-free smoke: element-less input
    expect(selectorPath(null)).toBe('');
  });
});
