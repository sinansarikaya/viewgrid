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

export interface ReportContext {
  version: string;
  url: string;
  scannedAt: number | null;
  devices: string[];
  failed: string[];
  truncated: string[];
  filtered: boolean;
}
export function reportDocument(groups: IssueGroup[], deviceName: (id: string) => string, context: ReportContext): string {
  const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  const status = context.failed.length || context.truncated.length ? 'Incomplete scan' : 'Completed scan';
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ViewGrid scan report</title><style>body{font:16px system-ui;max-width:960px;margin:40px auto;padding:0 20px;color:#17222c}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f2f5f7;padding:16px}h1{font-size:28px}@media print{body{margin:0;max-width:none}pre{background:none}}</style><body><h1>ViewGrid scan report</h1><p>${escape(status)} · v${escape(context.version)} · ${escape(context.scannedAt ? new Date(context.scannedAt).toISOString() : 'Not scanned')}</p><p>URL: ${escape(context.url)}</p><p>Devices: ${escape(context.devices.join(', '))}</p><p>Failed: ${escape(context.failed.join(', ') || 'None')} · Partial: ${escape(context.truncated.join(', ') || 'None')}</p><p>${context.filtered ? 'Filtered findings; filters can hide results.' : 'All findings.'} Zero findings does not prove the page is defect-free. Checks cover horizontal overflow, horizontal/vertical text clipping, offscreen controls and small touch targets. Shadow roots, nested documents, contrast and keyboard accessibility are not audited. Use your browser’s Print command to save this report as PDF.</p><pre>${escape(issueReport(groups, deviceName))}</pre></body></html>`;
}
