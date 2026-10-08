import type { Issue } from '../types';
import { severityRank } from './detectors';

export interface IssueGroup { key: string; issue: Issue; occurrences: Issue[]; viewportIds: string[] }
export function primaryIssues(issues: Issue[]): Issue[] { return issues.filter(issue => issue.data?.category !== 'optional'); }
export function groupIssues(issues: Issue[]): IssueGroup[] {
  const groups = new Map<string, IssueGroup>();
  const seen = new Set<string>();
  for (const issue of issues) {
    const key = JSON.stringify([issue.rule, issue.data?.componentKey || issue.selector || 'document', issue.data?.url || '', issue.data?.category || 'review']);
    const occurrence = JSON.stringify([key, issue.viewportId, issue.selector || 'document']);
    if (seen.has(occurrence)) continue;
    seen.add(occurrence);
    const group = groups.get(key) ?? { key, issue, occurrences: [], viewportIds: [] };
    group.occurrences.push(issue);
    if (!group.viewportIds.includes(issue.viewportId)) group.viewportIds.push(issue.viewportId);
    if (severityRank(issue.severity) < severityRank(group.issue.severity)) group.issue = issue;
    groups.set(key, group);
  }
  const priority = (group: IssueGroup) => group.issue.data?.category === 'optional' ? 2 : group.issue.data?.category === 'improvement' ? 1 : 0;
  return [...groups.values()].sort((a, b) => priority(a) - priority(b) || severityRank(a.issue.severity) - severityRank(b.issue.severity) || a.issue.rule.localeCompare(b.issue.rule));
}
export interface ReportContext {
  version: string;
  url: string;
  scannedAt: number | null;
  devices: string[];
  failed: string[];
  truncated: string[];
  filtered: boolean;
  excludedOptionalGroups?: number;
}
export function issueReport(groups: IssueGroup[], deviceName: (id: string) => string, context?: ReportContext): string {
  return [
    '# ViewGrid responsive scan',
    `${groups.length} finding groups · ${groups.reduce((n, g) => n + g.occurrences.length, 0)} element/viewport observations`,
    'Review candidates, ergonomic improvements and optional advice are separate. No finding proves a WCAG failure.',
    '24px spacing circles identify potential minimum-target concerns; 44px is enhanced ergonomic guidance. Inline, equivalent, essential and user-agent exceptions need review. Bounding boxes are not a complete hit-area or accessibility audit.',
    ...(context ? [
      `Version: ${context.version} · URL: ${context.url} · Scan: ${context.scannedAt ? new Date(context.scannedAt).toISOString() : 'Not scanned'}`,
      `Devices/coverage: ${context.devices.join(', ')}`,
      `Failed: ${context.failed.join(', ') || 'None'} · Partial: ${context.truncated.join(', ') || 'None'}`,
      `${context.filtered ? 'Filtered export' : 'All findings'} · Optional groups excluded: ${context.excludedOptionalGroups || 0}`,
    ] : []),
    ...groups.map(g => [
      `\n## ${g.issue.rule} (${g.issue.severity}; ${String(g.issue.data?.category || 'review')})`,
      g.issue.message,
      `URL: ${String(g.issue.data?.url || '')}`,
      `Component/selector: ${String(g.issue.data?.componentKey || g.issue.selector || 'document')}`,
      ...g.occurrences.map(i => `- ${deviceName(i.viewportId)} · ${String(i.data?.label || i.selector || 'document')}: ${i.message}\n  Selector: ${i.selector || 'document'}\n  Evidence: ${JSON.stringify(i.data ?? {})}`),
    ].join('\n')),
  ].join('\n');
}
export function reportDocument(groups: IssueGroup[], deviceName: (id: string) => string, context: ReportContext): string {
  const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  const status = context.failed.length || context.truncated.length ? 'Incomplete scan' : 'Completed scan';
  const cards = groups.map(group => `<article><h2>${escape(group.issue.rule)} · ${escape(group.issue.data?.category || 'review')}</h2><p>${escape(group.issue.message)}</p><table><thead><tr><th>Device</th><th>Element / selector</th><th>Observation</th></tr></thead><tbody>${group.occurrences.map(issue => `<tr><td>${escape(deviceName(issue.viewportId))}</td><td>${escape(issue.data?.label || issue.selector)}<br><code>${escape(issue.selector || 'document')}</code></td><td>${escape(issue.message)}</td></tr>`).join('')}</tbody></table><details><summary>Full measurements and spacing evidence</summary><pre>${escape(JSON.stringify(group.occurrences.map(issue => ({ device: deviceName(issue.viewportId), selector: issue.selector, ...issue.data })), null, 2))}</pre></details></article>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ViewGrid scan report</title><style>body{font:15px system-ui;max-width:1060px;margin:40px auto;padding:0 20px;color:#17222c;line-height:1.6}pre,code{white-space:pre-wrap;overflow-wrap:anywhere}pre{background:#f2f5f7;padding:16px}h1{font-size:28px}h2{font-size:20px}article{border-top:1px solid #ccd5dc;margin-top:28px;padding-top:16px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{text-align:left;vertical-align:top;border-bottom:1px solid #dde4ea;padding:10px;overflow-wrap:anywhere}th:first-child{width:20%}details{margin-top:16px}@media print{body{margin:0;max-width:none}thead{display:table-header-group}tr{break-inside:avoid}pre{background:none}}</style><body><h1>ViewGrid scan report</h1><p>${escape(status)} · v${escape(context.version)} · ${escape(context.scannedAt ? new Date(context.scannedAt).toISOString() : 'Not scanned')}</p><p>URL: ${escape(context.url)}</p><p>Devices: ${escape(context.devices.join(', '))}</p><p>Failed: ${escape(context.failed.join(', ') || 'None')} · Partial: ${escape(context.truncated.join(', ') || 'None')}</p><p>${groups.length} finding groups · ${groups.reduce((n, group) => n + group.occurrences.length, 0)} element/viewport observations. ${context.filtered ? 'Filtered export.' : 'All findings.'} Optional groups excluded: ${context.excludedOptionalGroups || 0}.</p><p>Zero findings does not prove the page is defect-free. Checks cover horizontal overflow, text clipping, offscreen controls and touch target size/spacing. Potential 24px spacing concerns are separate from ergonomic 44px advice. Exceptions and actual hit areas need manual review. Shadow roots, nested documents, contrast and keyboard accessibility are not audited. Print this file to save as PDF.</p>${cards || '<p>No findings in this export.</p>'}</body></html>`;
}
