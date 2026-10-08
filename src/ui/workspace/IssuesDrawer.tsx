import React, { useMemo, useState } from 'react';
import s from './IssuesDrawer.module.css';
import { useStore } from './store';
import { groupIssues, issueReport, reportDocument } from '../../core/issues/report';
import { issuesText } from './issues-i18n';
import { downloadBlob, sendAgentCmd } from './bridge';
import { b } from '../../platform/browser';
import { startScan } from './scan';

export function IssuesDrawer() {
  const st = useStore(), t = issuesText(st.language);
  const [query, setQuery] = useState(''), [device, setDevice] = useState('all');
  const [includeOptional, setIncludeOptional] = useState(false);
  const [rule, setRule] = useState('all'), [severity, setSeverity] = useState('all');
  const name = (id: string) => { const v = st.model.viewports.find(v => v.id === id); if (!v) return id; const p = st.profileOf(v); return `${p.name} (${v.orientation === 'landscape' ? `${p.height}×${p.width}` : `${p.width}×${p.height}`})`; };
  const groups = useMemo(() => groupIssues(st.issues), [st.issues]);
  const filtered = groupIssues(st.issues.filter(i =>
    (includeOptional || i.data?.category !== 'optional') && (device === 'all' || i.viewportId === device) && (rule === 'all' || i.rule === rule) &&
    (severity === 'all' || i.severity === severity) && `${i.data?.label || ''} ${i.message} ${i.selector || ''} ${i.rule}`.toLowerCase().includes(query.toLowerCase())
  ));
  const optionalCount = groups.filter(g => g.issue.data?.category === 'optional').length;
  const context = {
    version: b.runtime.getManifest().version || 'unknown', url: st.model.url, scannedAt: st.scannedAt,
    devices: Object.keys(st.scanCoverage).map(id => `${name(id)}: ${st.scanCoverage[id]} elements`),
    failed: st.scanFailed.map(name), truncated: st.scanTruncated.map(name),
    filtered: !includeOptional && optionalCount > 0 || query !== '' || device !== 'all' || rule !== 'all' || severity !== 'all',
    excludedOptionalGroups: includeOptional ? 0 : optionalCount,
  };
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); st.showToast(t.copied); }
    catch { st.showToast(t.copyFailed); }
  };
  return <aside className={s.drawer} aria-label={t.title}>
    <header className={s.header}><strong>{t.title}</strong><button aria-label="Close issues" onClick={() => st.setDrawerOpen(false)}>✕</button></header>
    <div className={s.summary}><b>{filtered.length}</b> {t.unique} <span>· {filtered.reduce((n, g) => n + g.occurrences.length, 0)} {t.occurrences}</span></div>
    <p className={s.note}>{t.note}</p>
    <label className={s.note}><input type="checkbox" checked={includeOptional} onChange={event => setIncludeOptional(event.target.checked)} /> {t.optionalToggle} ({optionalCount})</label>
    {st.scannedAt && <p className={s.note}>{t.scanned}: <time dateTime={new Date(st.scannedAt).toISOString()}>{new Date(st.scannedAt).toLocaleString(st.language === 'no' ? 'nb-NO' : st.language)}</time></p>}
    {st.scannedAt && <p className={s.note}>{t.coverage}: {Object.entries(st.scanCoverage).map(([id, count]) => `${name(id)}: ${count}`).join(" · ")}</p>}
    <div className={s.actions}>
      <button onClick={() => void startScan()} disabled={st.scanning}>{t.rescan}</button>
      <button disabled={!st.scannedAt || st.scanning} onClick={() => void copy(issueReport(filtered, name, context))}>{t.copy}</button>
      <button disabled={!st.scannedAt || st.scanning} onClick={() => downloadBlob(new Blob([JSON.stringify({ schemaVersion: 3, extensionVersion: context.version, ...context, coverage: st.scanCoverage, heuristic: true, failedViewports: context.failed, truncatedViewports: context.truncated, findings: filtered }, null, 2)], { type: 'application/json' }), 'viewgrid-issues.json')}>{t.json}</button>
    </div>
    <div className={s.actions}><button disabled={!st.scannedAt || st.scanning} onClick={() => downloadBlob(new Blob([reportDocument(filtered, name, context)], { type: 'text/html;charset=utf-8' }), 'viewgrid-scan-report.html')}>{t.html}</button></div>
    <div className={s.filters}>
      <input aria-label={t.search} placeholder={t.search} value={query} onChange={e => setQuery(e.target.value)} />
      <select aria-label={t.allDevices} value={device} onChange={e => setDevice(e.target.value)}><option value="all">{t.allDevices}</option>{st.model.viewports.map(v => <option key={v.id} value={v.id}>{name(v.id)}</option>)}</select>
      <select aria-label={t.allRules} value={rule} onChange={e => setRule(e.target.value)}><option value="all">{t.allRules}</option>{['horizontal-overflow', 'text-clipping', 'vertical-text-clipping', 'out-of-viewport', 'target-spacing', 'small-tap-target'].map(r => <option key={r}>{r}</option>)}</select>
      <select aria-label={t.allSeverities} value={severity} onChange={e => setSeverity(e.target.value)}><option value="all">{t.allSeverities}</option>{['critical', 'major', 'minor'].map(r => <option key={r}>{r}</option>)}</select>
    </div>
    <div className={s.body} aria-live="polite">
      {st.scanning && <p role="status">{t.pending}: {st.scanPending.length}</p>}
      {!!st.scanFailed.length && <p className={s.warning}>{t.failed}: {st.scanFailed.map(name).join(', ')}</p>}
      {!!st.scanTruncated.length && <p className={s.warning}>{t.partial}: {st.scanTruncated.map(name).join(', ')}</p>}
      {!st.scanning && !groups.length && <p>{st.scannedAt ? (st.scanFailed.length ? '' : t.none) : t.notScanned}</p>}
      {!!groups.length && !filtered.length && <p>{!includeOptional && optionalCount === groups.length && !query && device === 'all' && rule === 'all' && severity === 'all' ? t.onlyOptional : t.empty}</p>}
      {filtered.map(g => <article key={g.key} className={s.card}>
        <div className={s.rule}><span data-severity={g.issue.severity}>{g.issue.severity}</span><code>{g.issue.rule}</code></div>
        <p><b>{t.categories[String(g.issue.data?.category || 'review')]}</b></p>
        <p>{g.issue.message}</p>
        {g.occurrences.length > g.viewportIds.length && <p>{new Set(g.occurrences.map(i => i.selector)).size} {t.componentElements}</p>}
        <code className={s.selector}>{g.issue.selector || 'document'}</code>
        <div className={s.devices}>{t.devices}: {g.viewportIds.map(id => <button key={id} title={t.show} disabled={!g.occurrences.find(i => i.viewportId === id)?.selector} onClick={() => {
          st.focus(id); st.setDrawerOpen(true);
          document.querySelector(`[data-viewport-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'center', inline: 'center' });
          void sendAgentCmd([id], 'highlight', undefined, { selector: g.occurrences.find(i => i.viewportId === id)?.selector });
        }}>{name(id)}</button>)}</div>
        <p className={s.advice}><b>{t.suggestion}:</b> {t.advice[g.issue.rule]}</p>
        <details><summary>{t.evidence}</summary>{g.occurrences.map(i => <div key={`${i.viewportId}:${i.selector}`}><b>{name(i.viewportId)} · {String(i.data?.label || i.selector || "document")}</b><button disabled={!i.selector} onClick={() => void sendAgentCmd([i.viewportId], "highlight", undefined, { selector: i.selector })}>{t.show}</button><button disabled={!i.selector} onClick={() => void copy(i.selector || "document")}>{t.selector}</button><code className={s.selector}>{i.selector}</code><pre>{JSON.stringify(i.data, null, 2)}</pre></div>)}</details>
        <div className={s.actions}><button onClick={() => void copy(issueReport([g], name))}>{t.item}</button>{g.issue.selector && <button onClick={() => void copy(g.issue.selector!)}>{t.selector}</button>}</div>
      </article>)}
    </div>
  </aside>;
}
