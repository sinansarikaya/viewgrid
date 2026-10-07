import { describe, expect, it } from 'vitest';
import { groupIssues, issueReport } from '../../src/core/issues/report';
import { runCoreDetectors } from '../../src/core/issues/detectors';
import type { Issue, PageMetrics } from '../../src/core/types';
const issue = (viewportId: string): Issue => ({ id: viewportId, viewportId, rule: 'small-tap-target', selector: '#buy', severity: 'minor', message: '30×30', data: { url: 'https://example.com' } });
describe('reviewable issue counts', () => {
  it('groups the same finding across devices and deduplicates one device', () => {
    const groups = groupIssues([issue('phone'), issue('phone'), issue('tablet')]);
    expect(groups).toHaveLength(1); expect(groups[0]!.occurrences).toHaveLength(2);
    expect(issueReport(groups, id => id)).toContain('1 unique findings · 2 viewport occurrences');
    expect(issueReport(groups, id => id)).toContain('#buy');
  });
  it('does not combine different pages or selectors', () => {
    expect(groupIssues([issue('a'), { ...issue('b'), data: { url: 'https://other.test' } }, { ...issue('c'), selector: '#cancel' }])).toHaveLength(3);
  });
  it('excludes intentional clipping and inline link target advice', () => {
    const m: PageMetrics = { innerWidth: 390, innerHeight: 844, scrollWidth: 390, scrollHeight: 900, elements: [
      { selector: '#map', tag: 'a', rect: { x: 500, y: 0, width: 20, height: 20 }, isInteractive: true, intentionallyClipped: true },
      { selector: '#prose', tag: 'a', rect: { x: 0, y: 0, width: 30, height: 16 }, isInteractive: true, inlineTextLink: true },
      { selector: '#buy', tag: 'button', rect: { x: 0, y: 100, width: 30, height: 30 }, isInteractive: true },
    ] };
    expect(runCoreDetectors(m).map(i => i.selector)).toEqual(['#buy']);
    expect(runCoreDetectors({ ...m, checkTapTargets: false })).toEqual([]);
  });
});
