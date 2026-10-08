import type { Issue, MeasuredElement, PageMetrics, IssueSeverity } from '../types';

/**
 * Heuristic detectors over collected page metrics (core — no DOM access here,
 * so they are unit-testable). The content agent collects `PageMetrics`.
 */
export type OmitViewport = Omit<Issue, 'viewportId'>;

let issueSeq = 0;
function mk(rule: string, severity: IssueSeverity, message: string, e?: MeasuredElement, data?: Record<string, unknown>): OmitViewport {
  issueSeq = (issueSeq + 1) % 1e9;
  return { id: `iss_${issueSeq}`, rule, severity, message, selector: e?.selector, data: { category: 'review', ...data, label: e?.label, tag: e?.tag, rect: e?.rect, text: e?.text, heuristic: true } };
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
      !e.intentionallyClipped &&
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
  return out;
}

export function detectVerticalTextClipping(m: PageMetrics): OmitViewport[] {
  return m.elements.filter(e => !e.intentionallyClipped && e.text &&
    e.scrollHeight !== undefined && e.clientHeight !== undefined &&
    e.scrollHeight > e.clientHeight + 2 && ['hidden', 'clip'].includes(e.overflowY || ''))
    .map(e => mk('vertical-text-clipping', 'major', `Text exceeds the fixed height of <${e.tag}>`, e,
      { scrollHeight: e.scrollHeight, clientHeight: e.clientHeight }));
}

export function detectOutOfViewport(m: PageMetrics): OmitViewport[] {
  const out: OmitViewport[] = [];
  for (const e of m.elements) {
    if (!e.isInteractive || e.insideHorizontalScroller || e.rect.width <= 0) continue;
    if (e.rect.x + e.rect.width > m.innerWidth + 1 || e.rect.x < -1) {
      out.push(mk('out-of-viewport', 'major', `<${e.tag}> extends outside viewport`, e, { rect: e.rect }));
    }
  }
  return out;
}

/** 24px-circle spacing check from SC 2.5.8; this identifies review candidates, not compliance. */
export function targetSpacingConflicts(target: MeasuredElement, elements: MeasuredElement[]): MeasuredElement[] {
  const r = target.rect, cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  return elements.filter(other => {
    if (other === target || other.selector === target.selector || !other.isInteractive || other.rect.width <= 0 || other.rect.height <= 0) return false;
    // Native labels and their associated inputs activate the same control.
    if (target.actionKey?.startsWith('control:') && target.actionKey === other.actionKey) return false;
    const o = other.rect;
    const dx = Math.max(o.x - cx, 0, cx - (o.x + o.width));
    const dy = Math.max(o.y - cy, 0, cy - (o.y + o.height));
    const intersectsTarget = Math.hypot(dx, dy) < 12 - 0.001;
    const undersized = Math.min(o.width, o.height) < 24;
    const intersectsCircle = undersized && Math.hypot(cx - (o.x + o.width / 2), cy - (o.y + o.height / 2)) < 24 - 0.001;
    return intersectsTarget || intersectsCircle;
  });
}

export function detectSmallTapTargets(m: PageMetrics): OmitViewport[] {
  const ergonomicChecks = m.checkTapTargets !== false;
  const targets = m.elements.filter(e => e.isInteractive && e.rect.width > 0 && e.rect.height > 0);
  const out: OmitViewport[] = [];
  for (const e of targets) {
    if (e.inlineTextLink) continue;
    const min = Math.min(e.rect.width, e.rect.height);
    if (min >= 43) continue; // 1 CSS px tolerance for the ergonomic 44px recommendation only.
    const alternative = e.actionKey ? targets.find(other => other !== e && other.actionKey === e.actionKey && Math.min(other.rect.width, other.rect.height) >= 44) : undefined;
    // A large associated native label genuinely enlarges an input's activation area.
    if (alternative && e.actionKey?.startsWith('control:')) continue;
    const conflicts = min < 24 ? targetSpacingConflicts(e, targets) : [];
    const crowded = conflicts.length > 0;
    if (!crowded && !ergonomicChecks) continue;
    const category = crowded ? 'review' : min >= 36 ? 'optional' : 'improvement';
    const size = `${Number(e.rect.width.toFixed(1))}×${Number(e.rect.height.toFixed(1))} CSS px`;
    out.push(mk(crowded ? 'target-spacing' : 'small-tap-target', crowded ? 'major' : 'minor',
      crowded ? `${e.label || e.tag}: ${size}; 24px spacing circle intersects nearby controls` :
        `${e.label || e.tag}: ${size}; ${category === 'optional' ? 'optional' : 'ergonomic'} 44px touch-target recommendation`, e, {
        category, componentKey: e.componentKey, recommendation: 44, tolerance: 1,
        minimumReference: 24, spacingStatus: crowded ? 'conflict' : m.truncated ? 'incomplete' : 'clear-among-measured-targets',
        alternativeCandidate: alternative?.selector,
        conflicts: conflicts.slice(0, 8).map(other => ({ selector: other.selector, label: other.label, rect: other.rect })),
        conflictCount: conflicts.length,
        assessment: crowded ? 'Potential SC 2.5.8 concern; check inline, equivalent, essential and user-agent exceptions. Bounding rectangles do not prove actual hit areas.' :
          'Ergonomic suggestion, not an accessibility failure. Spacing and exception checks do not constitute a full WCAG audit.',
      }));
  }
  return out;
}

export function runCoreDetectors(m: PageMetrics): OmitViewport[] {
  const issues = [
    ...detectHorizontalOverflow(m),
    ...detectTextClipping(m),
    ...detectVerticalTextClipping(m),
    ...detectOutOfViewport(m),
    ...detectSmallTapTargets(m),
  ];
  const seen = new Set<string>();
  return issues.filter(i => {
    const key = `${i.rule}:${i.selector || 'document'}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function severityRank(s: IssueSeverity): number {
  return s === 'critical' ? 0 : s === 'major' ? 1 : 2;
}
