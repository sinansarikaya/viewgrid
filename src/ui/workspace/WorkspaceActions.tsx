import React from 'react';
import { Button } from '../common/Button';
import { useStore } from './store';
import { getTranslation } from './i18n';
import styles from './WorkspaceActions.module.css';
import { getAnalysisTranslation } from './analysis-i18n';

export function WorkspaceActions({ onScan, onAnalysis }: { onScan: () => void; onAnalysis: (section: 'performance' | 'seo' | 'reports' | 'geo') => void }) {
  const st = useStore();
  const t = getTranslation(st.language);
  const analysis = getAnalysisTranslation(st.language);
  return <nav className={styles.actions} aria-label={t.menu}>
    <Button onClick={() => {
      if (st.visibleViewports().length < 2) { st.showToast(t.compareSelectHint); return; }
      st.setCompareOpen(!st.compareOpen);
    }} title={t.compareTitle}>⚖ {t.compare}</Button>
    <Button onClick={() => {
      if (!st.visibleViewports().length) { st.showToast(t.compareSelectHint); return; }
      st.setCompareOpen(true, 'figma');
    }}>🎨 Figma overlay / diff</Button>
    <Button onClick={onScan} title={t.issues}>🔍 {t.issues}</Button>
    <Button onClick={() => st.setDrawerOpen(!st.drawerOpen)}>{t.panel}</Button>
    <details>
      <summary>{t.sync} {st.model.sync.scroll ? '●' : '○'}</summary>
      <div className={styles.channels}>
        {(Object.keys(st.model.sync) as (keyof typeof st.model.sync)[]).map(channel => <label key={channel}>
          <span>{channel === 'scroll' ? t.syncScroll : channel === 'click' ? t.syncClick : channel === 'nav' ? t.syncNav : channel === 'reload' ? t.syncReload : channel === 'key' ? t.syncKey : channel === 'input' ? t.syncInput : t.syncForm}</span>
          <input type="checkbox" checked={st.model.sync[channel]} onChange={event => st.setSync(channel, event.target.checked)} />
        </label>)}
      </div>
    </details>
    <Button onClick={() => onAnalysis('performance')}>{analysis.tabPerformance}</Button>
    <Button onClick={() => onAnalysis('seo')}>{analysis.tabSeo}</Button>
    <Button onClick={() => onAnalysis('reports')}>{analysis.tabReports}</Button>
    <Button onClick={() => onAnalysis('geo')}>{analysis.tabGeo}</Button>
  </nav>;
}
