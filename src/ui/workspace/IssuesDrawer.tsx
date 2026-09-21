import React from 'react';
import s from './styles.module.css';
import { useStore } from './store';
import { severityRank } from '../../core/issues/detectors';

export function IssuesDrawer() {
  const st = useStore();
  const issues = [...st.issues].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  const counts = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    major: issues.filter((i) => i.severity === 'major').length,
    minor: issues.filter((i) => i.severity === 'minor').length,
  };

  return (
    <div className={s.drawer}>
      <div className={s.drawerHeader}>
        <strong>Issues</strong>
        <span className={s.badge + ' ' + s.warn}>
          {counts.critical > 0 ? '🔴' : ''} {counts.critical}
          {' '}🟠 {counts.major}
          {' '}🟡 {counts.minor}
        </span>
        <button className={s.iconBtn} style={{ marginLeft: 'auto' }} onClick={() => st.setDrawerOpen(false)}>
          ✕
        </button>
      </div>
      <div className={s.drawerBody}>
        {st.scanning && <div style={{ color: 'var(--text-dim)' }}>Scanning…</div>}
        {!st.scanning && issues.length === 0 && (
          <div style={{ color: 'var(--text-dim)', padding: '8px 0' }}>
            No issues yet — hit “🔍 Issues” to scan all viewports.
          </div>
        )}
        {issues.map((i) => {
          const vp = st.model.viewports.find((v) => v.id === i.viewportId);
          const device = vp ? st.profileOf(vp).name : '?';
          return (
            <div key={i.id} className={s.issueRow}>
              <span
                className={`${s.sev} ${i.severity === 'critical' ? s.sevCritical : i.severity === 'major' ? s.sevMajor : s.sevMinor}`}
                title={i.severity}
              />
              <div style={{ minWidth: 0 }}>
                <div>{i.message}</div>
                <div className={s.sel}>
                  {i.rule} · {device}
                  {i.selector ? ` · ${i.selector}` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
