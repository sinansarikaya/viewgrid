import type { Issue, MeasuredElement, PageMetrics, IssueSeverity } from '../types';

/**
 * Heuristic detectors over collected page metrics (core — no DOM access here,
 * so they are unit-testable). The content agent collects `PageMetrics`.
 */
export type OmitViewport = Omit<Issue, 'viewportId'>;

let issueSeq = 0;
function mk(rule: string, severity: IssueSeverity, message: string, e?: MeasuredElement, data?: Record<string, unknown>): OmitViewport {
  issueSeq = (issueSeq + 1) % 1e9;
  return { id: `iss_${issueSeq}`, rule, severity, message, selector: e?.selector, data: { ...data, tag: e?.tag } };
}

export function detectHorizontalOverflow(m: PageMetrics): OmitViewport[] {
  const out: OmitViewport[] = [];
  const overflow = m.scrollWidth - m.innerWidth;
  if (overflow > 1) {
    const offenders = m.elements
      .filter((e) => e.rect.width > 0 && e.rect.x + e.rect.width > m.innerWidth + 1)
      .slice(0, 5);
    out.push(
      mk('horizontal-overflow', 'critical', `Horizontal overflow: ${overflow}px wider than viewport (${m.innerWidth}px)`, undefined, {
        overflow,
        offenders: offenders.map((e) => e.selector),
      }),
    );
  }
  return out;
}

export function detectTextClipping(m: PageMetrics): OmitViewport[] {
  const out: OmitViewport[] = [];
  for (const e of m.elements) {
    if (
      e.text &&
      e.scrollWidth !== undefined &&
      e.clientWidth !== undefined &&
      e.scrollWidth > e.clientWidth + 2 &&
      e.overflowX &&
      ['hidden', 'clip'].includes(e.overflowX)
    ) {
      out.push(mk('text-clipping', 'major', `Text clipped in <${e.tag}>: "${e.text.slice(0, 40)}"`, e, {
        scrollWidth: e.scrollWidth,
        clientWidth: e.clientWidth,
      }));
    }
  }
  return out.slice(0, 12);
}

export function detectOutOfViewport(m: PageMetrics): OmitViewport[] {
  const out: OmitViewport[] = [];
  for (const e of m.elements) {
    if (!e.isInteractive || e.rect.width <= 0) continue;
    if (e.rect.x + e.rect.width > m.innerWidth + 1 || e.rect.x < -1) {
      out.push(mk('out-of-viewport', 'major', `<${e.tag}> extends outside viewport`, e, { rect: e.rect }));
    }
  }
  return out.slice(0, 12);
}

export function detectSmallTapTargets(m: PageMetrics): OmitViewport[] {
  const out: OmitViewport[] = [];
  for (const e of m.elements) {
    if (!e.isInteractive || e.rect.width <= 0 || e.rect.height <= 0) continue;
    const min = Math.min(e.rect.width, e.rect.height);
    if (min > 0 && min < 24) {
      out.push(
        mk('small-tap-target', 'minor', `Tap target ${Math.round(e.rect.width)}×${Math.round(e.rect.height)}px (< 24px)`, e, {
          rect: e.rect,
        }),
      );
    }
  }
  return out.slice(0, 12);
}

export function runCoreDetectors(m: PageMetrics): OmitViewport[] {
  return [
    ...detectHorizontalOverflow(m),
    ...detectTextClipping(m),
    ...detectOutOfViewport(m),
    ...detectSmallTapTargets(m),
  ];
}

export function severityRank(s: IssueSeverity): number {
  return s === 'critical' ? 0 : s === 'major' ? 1 : 2;
}
