import React from 'react';
import s from './styles.module.css';
import { useStore } from './store';
import { severityRank } from '../../core/issues/detectors';
import { getTranslation } from './i18n';

export function IssuesDrawer() {
  const st = useStore();
  const t = getTranslation(st.language);
  const issues = [...st.issues].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  const counts = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    major: issues.filter((i) => i.severity === 'major').length,
    minor: issues.filter((i) => i.severity === 'minor').length,
  };

  return (
    <div className={s.drawer}>
      <div className={s.drawerHeader}>
        <strong>{t.issues}</strong>
        <span className={s.badge + ' ' + s.warn}>
          {counts.critical > 0 ? '🔴' : ''} {counts.critical}
          {' '}🟠 {counts.major}
          {' '}🟡 {counts.minor}
        </span>
        <button className={`${s.iconBtn} ${s.pushRight}`} onClick={() => st.setDrawerOpen(false)}>
          ✕
        </button>
      </div>
      <div className={s.drawerBody}>
        {st.scanning && <div className={s.dimText}>{t.runningAudit}</div>}
        {!st.scanning && issues.length === 0 && (
          <div className={s.dimText}>
            {t.noIssuesFound}
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
              <div className={s.issueContent}>
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
