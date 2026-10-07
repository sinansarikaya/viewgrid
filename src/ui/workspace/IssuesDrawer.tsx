import React, { useMemo, useState } from 'react';
import s from './IssuesDrawer.module.css';
import { useStore } from './store';
import { groupIssues, issueReport } from '../../core/issues/report';
import { issuesText } from './issues-i18n';
import { downloadBlob, sendAgentCmd } from './bridge';
import { startScan } from './scan';

export function IssuesDrawer() {
  const st = useStore(), t = issuesText(st.language);
  const [query, setQuery] = useState(''), [device, setDevice] = useState('all');
  const [rule, setRule] = useState('all'), [severity, setSeverity] = useState('all');
  const name = (id: string) => { const v = st.model.viewports.find(v => v.id === id); if (!v) return id; const p = st.profileOf(v); return `${p.name} (${v.orientation === 'landscape' ? `${p.height}×${p.width}` : `${p.width}×${p.height}`})`; };
  const groups = useMemo(() => groupIssues(st.issues), [st.issues]);
  const filtered = groupIssues(st.issues.filter(i =>
    (device === 'all' || i.viewportId === device) && (rule === 'all' || i.rule === rule) &&
    (severity === 'all' || i.severity === severity) && `${i.message} ${i.selector || ''} ${i.rule}`.toLowerCase().includes(query.toLowerCase())
  ));
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); st.showToast(t.copied); }
    catch { st.showToast(t.copyFailed); }
  };
  return <aside className={s.drawer} aria-label={t.title}>
    <header className={s.header}><strong>{t.title}</strong><button aria-label="Close issues" onClick={() => st.setDrawerOpen(false)}>✕</button></header>
    <div className={s.summary}><b>{groups.length}</b> {t.unique} <span>· {groups.reduce((n, g) => n + g.occurrences.length, 0)} {t.occurrences}</span></div>
    <p className={s.note}>{t.note}</p>
    {st.scannedAt && <p className={s.note}>{t.scanned}: <time dateTime={new Date(st.scannedAt).toISOString()}>{new Date(st.scannedAt).toLocaleString(st.language === 'no' ? 'nb-NO' : st.language)}</time></p>}
    <div className={s.actions}>
      <button onClick={() => void startScan()} disabled={st.scanning}>{t.rescan}</button>
      <button disabled={!filtered.length} onClick={() => void copy(issueReport(filtered, name))}>{t.copy}</button>
      <button disabled={!filtered.length} onClick={() => downloadBlob(new Blob([JSON.stringify({ version: 1, scannedAt: st.scannedAt, heuristic: true, failedViewports: st.scanFailed.map(name), truncatedViewports: st.scanTruncated.map(name), findings: filtered }, null, 2)], { type: 'application/json' }), 'viewgrid-issues.json')}>{t.json}</button>
    </div>
    <div className={s.filters}>
      <input aria-label={t.search} placeholder={t.search} value={query} onChange={e => setQuery(e.target.value)} />
      <select aria-label={t.allDevices} value={device} onChange={e => setDevice(e.target.value)}><option value="all">{t.allDevices}</option>{st.model.viewports.map(v => <option key={v.id} value={v.id}>{name(v.id)}</option>)}</select>
      <select aria-label={t.allRules} value={rule} onChange={e => setRule(e.target.value)}><option value="all">{t.allRules}</option>{['horizontal-overflow', 'text-clipping', 'out-of-viewport', 'small-tap-target'].map(r => <option key={r}>{r}</option>)}</select>
      <select aria-label={t.allSeverities} value={severity} onChange={e => setSeverity(e.target.value)}><option value="all">{t.allSeverities}</option>{['critical', 'major', 'minor'].map(r => <option key={r}>{r}</option>)}</select>
    </div>
    <div className={s.body} aria-live="polite">
      {st.scanning && <p role="status">{t.pending}: {st.scanPending.length}</p>}
      {!!st.scanFailed.length && <p className={s.warning}>{t.failed}: {st.scanFailed.map(name).join(', ')}</p>}
      {!!st.scanTruncated.length && <p className={s.warning}>{t.partial}: {st.scanTruncated.map(name).join(', ')}</p>}
      {!st.scanning && !groups.length && <p>{st.scannedAt ? (st.scanFailed.length ? '' : t.none) : t.notScanned}</p>}
      {!!groups.length && !filtered.length && <p>{t.empty}</p>}
      {filtered.map(g => <article key={g.key} className={s.card}>
        <div className={s.rule}><span data-severity={g.issue.severity}>{g.issue.severity}</span><code>{g.issue.rule}</code></div>
        <p>{g.issue.message}</p>
        <code className={s.selector}>{g.issue.selector || 'document'}</code>
        <div className={s.devices}>{t.devices}: {g.viewportIds.map(id => <button key={id} title={t.show} disabled={!g.issue.selector} onClick={() => {
          st.focus(id); st.setDrawerOpen(true);
          document.querySelector(`[data-viewport-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'center', inline: 'center' });
          void sendAgentCmd([id], 'highlight', undefined, { selector: g.issue.selector });
        }}>{name(id)}</button>)}</div>
        <p className={s.advice}><b>{t.suggestion}:</b> {t.advice[g.issue.rule]}</p>
        <details><summary>{t.evidence}</summary>{g.occurrences.map(i => <div key={i.viewportId}><b>{name(i.viewportId)}</b><pre>{JSON.stringify(i.data, null, 2)}</pre></div>)}</details>
        <div className={s.actions}><button onClick={() => void copy(issueReport([g], name))}>{t.item}</button>{g.issue.selector && <button onClick={() => void copy(g.issue.selector!)}>{t.selector}</button>}</div>
      </article>)}
    </div>
  </aside>;
}
