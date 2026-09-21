import { describe, expect, it } from 'vitest';
import {
  detectHorizontalOverflow,
  detectOutOfViewport,
  detectSmallTapTargets,
  detectTextClipping,
  runCoreDetectors,
} from '../../src/core/issues/detectors';
import type { PageMetrics } from '../../src/core/types';

const metrics = (over: Partial<PageMetrics>): PageMetrics => ({
  innerWidth: 390,
  innerHeight: 844,
  scrollWidth: 390,
  scrollHeight: 2000,
  elements: [],
  ...over,
});

describe('issue detectors', () => {
  it('detects horizontal overflow with offender hints', () => {
    const m = metrics({
      scrollWidth: 460,
      elements: [
        { selector: 'div.hero', tag: 'div', rect: { x: 0, y: 0, width: 460, height: 100 } },
        { selector: 'p.ok', tag: 'p', rect: { x: 0, y: 0, width: 100, height: 20 } },
      ],
    });
    const out = detectHorizontalOverflow(m);
    expect(out).toHaveLength(1);
    expect(out[0]!.severity).toBe('critical');
    expect((out[0]!.data as any).offenders).toEqual(['div.hero']);
  });

  it('detects clipped text only when overflow hidden + scrollWidth exceeds client', () => {
    const m = metrics({
      elements: [
        {
          selector: 'h1',
          tag: 'h1',
          rect: { x: 0, y: 0, width: 100, height: 30 },
          text: 'Very long heading',
          overflowX: 'hidden',
          scrollWidth: 300,
          clientWidth: 100,
        },
        {
          selector: 'p',
          tag: 'p',
          rect: { x: 0, y: 40, width: 100, height: 20 },
          text: 'fine',
          overflowX: 'visible',
          scrollWidth: 300,
          clientWidth: 100,
        },
      ],
    });
    const out = detectTextClipping(m);
    expect(out).toHaveLength(1);
    expect(out[0]!.selector).toBe('h1');
  });

  it('detects interactive elements outside the viewport', () => {
    const m = metrics({
      elements: [
        { selector: 'a.buy', tag: 'a', rect: { x: 370, y: 0, width: 60, height: 40 }, isInteractive: true },
        { selector: 'span', tag: 'span', rect: { x: 500, y: 0, width: 30, height: 10 }, isInteractive: false },
      ],
    });
    const out = detectOutOfViewport(m);
    expect(out).toHaveLength(1);
    expect(out[0]!.selector).toBe('a.buy');
  });

  it('flags small tap targets (<24px) as minor', () => {
    const m = metrics({
      elements: [
        { selector: 'button', tag: 'button', rect: { x: 0, y: 0, width: 16, height: 16 }, isInteractive: true },
        { selector: 'a', tag: 'a', rect: { x: 0, y: 0, width: 44, height: 44 }, isInteractive: true },
      ],
    });
    const out = detectSmallTapTargets(m);
    expect(out).toHaveLength(1);
    expect(out[0]!.severity).toBe('minor');
  });

  it('runs the full core detector pack', () => {
    const m = metrics({
      scrollWidth: 500,
      elements: [
        { selector: 'button', tag: 'button', rect: { x: 0, y: 0, width: 10, height: 10 }, isInteractive: true },
      ],
    });
    const rules = runCoreDetectors(m).map((i) => i.rule);
    expect(rules).toContain('horizontal-overflow');
    expect(rules).toContain('small-tap-target');
  });
});
