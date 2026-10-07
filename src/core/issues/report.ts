import type { Issue } from '../types';
import { severityRank } from './detectors';

export interface IssueGroup { key: string; issue: Issue; occurrences: Issue[]; viewportIds: string[] }
export function groupIssues(issues: Issue[]): IssueGroup[] {
  const groups = new Map<string, IssueGroup>();
  const seen = new Set<string>();
  for (const issue of issues) {
    const key = JSON.stringify([issue.rule, issue.selector || 'document', issue.data?.url || '']);
    const occurrence = `${key}:${issue.viewportId}`;
    if (seen.has(occurrence)) continue;
    seen.add(occurrence);
    const group = groups.get(key) ?? { key, issue, occurrences: [], viewportIds: [] };
    group.occurrences.push(issue); group.viewportIds.push(issue.viewportId); groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => severityRank(a.issue.severity) - severityRank(b.issue.severity) || a.issue.rule.localeCompare(b.issue.rule));
}
export function issueReport(groups: IssueGroup[], deviceName: (id: string) => string): string {
  return [
    '# ViewGrid responsive scan',
    `${groups.length} unique findings · ${groups.reduce((n, g) => n + g.occurrences.length, 0)} viewport occurrences`,
    'Heuristic review suggestions, not confirmed defects or a WCAG compliance audit.',
    ...groups.map(g => [
      `\n## ${g.issue.rule} (${g.issue.severity})`,
      g.issue.message,
      `URL: ${String(g.issue.data?.url || '')}`,
      `Selector: ${g.issue.selector || 'document'}`,
      ...g.occurrences.map(i => `- ${deviceName(i.viewportId)}: ${i.message}\n  Evidence: ${JSON.stringify(i.data ?? {})}`),
    ].join('\n')),
  ].join('\n');
}
