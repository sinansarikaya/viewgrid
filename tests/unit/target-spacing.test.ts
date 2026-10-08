import { describe, expect, it } from 'vitest';
import { detectSmallTapTargets, targetSpacingConflicts } from '../../src/core/issues/detectors';
import { groupIssues, primaryIssues, issueReport } from '../../src/core/issues/report';
import type { MeasuredElement, PageMetrics, Issue } from '../../src/core/types';
const target = (selector: string, x: number, y: number, width: number, height: number, extra: Partial<MeasuredElement> = {}): MeasuredElement => ({ selector, tag: 'button', label: selector, isInteractive: true, rect: { x, y, width, height }, ...extra });
const metrics = (elements: MeasuredElement[], extra: Partial<PageMetrics> = {}): PageMetrics => ({ innerWidth: 393, innerHeight: 852, scrollWidth: 393, scrollHeight: 2000, elements, ...extra });
describe('target size and spacing assessment', () => {
  it.each([
    [16, 0, true], [20, 4, false], [20, 3, true], [24, 0, false],
  ])('handles %ipx targets separated by %ipx', (size, gap, expected) => {
    const a = target('#a', 0, 0, size, size), b = target('#b', size + gap, 0, size, size);
    const findings = detectSmallTapTargets(metrics([a, b]));
    expect(findings.some(f => f.rule === 'target-spacing')).toBe(expected);
  });
  it('tests circles against large neighboring rectangles, not just their centers', () => {
    const a = target('#small', 0, 0, 16, 16), b = target('#large', 18, -100, 80, 200);
    expect(targetSpacingConflicts(a, [a, b]).map(e => e.selector)).toEqual(['#large']);
    expect(detectSmallTapTargets(metrics([a, b]))[0]?.data?.conflicts).toEqual([{ selector: '#large', label: '#large', rect: b.rect }]);
  });
  it('keeps generously spaced 23.5px footer links out of accessibility concerns', () => {
    const a = target('#footer-a', 0, 0, 346, 23.5), b = target('#footer-b', 0, 33.5, 346, 23.5);
    const findings = detectSmallTapTargets(metrics([a, b]));
    expect(findings.map(f => f.rule)).toEqual(['small-tap-target', 'small-tap-target']);
    expect(findings.every(f => f.data?.category === 'improvement')).toBe(true);
  });
  it('flags tightly stacked wide and short links', () => {
    const a = target('#a', 0, 0, 100, 16), b = target('#b', 0, 17, 100, 16);
    expect(detectSmallTapTargets(metrics([a, b])).every(f => f.rule === 'target-spacing' && f.severity === 'major')).toBe(true);
  });
  it('puts 42px advice in an optional category without treating it as a 24px failure', () => {
    const findings = detectSmallTapTargets(metrics([target('#tab', 0, 0, 160, 42)]));
    expect(findings[0]?.data?.category).toBe('optional');
    expect(primaryIssues(findings.map(f => ({ ...f, viewportId: 'phone' })))).toEqual([]);
  });
  it('does not treat a tiny native input as small when its large associated label activates it', () => {
    const input = target('#checkbox', 0, 0, 16, 16, { actionKey: 'control:#checkbox' });
    const label = target('#label', 0, 0, 200, 44, { actionKey: 'control:#checkbox' });
    expect(detectSmallTapTargets(metrics([input, label]))).toEqual([]);
  });
  it('does not infer identical scripted actions just from identical hrefs', () => {
    const a = target('#a', 0, 0, 16, 16, { actionKey: 'url:https://example.com/' });
    const b = target('#b', 16, 0, 44, 44, { actionKey: a.actionKey });
    expect(detectSmallTapTargets(metrics([a, b]))[0]?.rule).toBe('target-spacing');
  });
  it('counts inline links as possible neighbors without reporting their own size', () => {
    const a = target('#button', 0, 0, 16, 16), link = target('#inline', 16, 0, 20, 16, { inlineTextLink: true });
    const result = detectSmallTapTargets(metrics([a, link]));
    expect(result).toHaveLength(1); expect(result[0]?.rule).toBe('target-spacing');
  });
  it('does not claim clear spacing when collection was truncated', () => {
    const result = detectSmallTapTargets(metrics([target('#a', 0, 0, 16, 16)], { truncated: true }));
    expect(result[0]?.data?.spacingStatus).toBe('incomplete');
  });
  it('retains one observation per element/device in a shared component group', () => {
    const make = (selector: string, viewportId: string): Issue => ({ id: selector, selector, viewportId, severity: 'minor', rule: 'small-tap-target', message: selector, data: { componentKey: '#footer>nav>a', category: 'improvement', url: 'https://example.com', label: selector } });
    const groups = groupIssues([make('#one', 'phone'), make('#two', 'phone'), make('#one', 'phone'), make('#one', 'tablet')]);
    expect(groups).toHaveLength(1); expect(groups[0]?.occurrences).toHaveLength(3); expect(groups[0]?.viewportIds).toEqual(['phone', 'tablet']);
    expect(issueReport(groups, id => id)).toContain('#two');
  });
  it('does not merge optional advice, different pages or different component roots', () => {
    const base: Issue = { id: 'a', viewportId: 'phone', selector: '#a', rule: 'small-tap-target', severity: 'minor', message: 'a', data: { componentKey: '#footer>a', category: 'improvement', url: 'https://example.com' } };
    expect(groupIssues([base, { ...base, selector: '#b', data: { ...base.data, category: 'optional' } }, { ...base, selector: '#c', data: { ...base.data, componentKey: '#header>a' } }, { ...base, selector: '#d', data: { ...base.data, url: 'https://other.test' } }])).toHaveLength(4);
  });
});

it('does not suppress small interactive targets merely because their text uses ellipsis', () => {
  const result = detectSmallTapTargets(metrics([target('#truncated-button', 0, 0, 80, 20, { intentionallyClipped: true })]));
  expect(result).toHaveLength(1); expect(result[0]?.data?.category).toBe('improvement');
});

it('reviews minimum spacing on desktop too, while touch comfort advice stays touch-only', () => {
  const a = target('#a', 0, 0, 16, 16), b = target('#b', 16, 0, 16, 16), comfort = target('#comfort', 200, 100, 30, 30);
  const result = detectSmallTapTargets(metrics([a, b, comfort], { checkTapTargets: false }));
  expect(result.map(i => i.rule)).toEqual(['target-spacing', 'target-spacing']);
});
