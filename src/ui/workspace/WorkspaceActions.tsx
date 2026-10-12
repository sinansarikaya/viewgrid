import React from 'react';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { useStore } from './store';
import { getTranslation } from './i18n';
import styles from './WorkspaceActions.module.css';
import { getAnalysisTranslation } from './analysis-i18n';

const SECTION_TITLES: Record<'tr' | 'en' | 'no', { tools: string; sync: string; analyze: string }> = {
  tr: {
    tools: 'Araçlar',
    sync: 'Senkronizasyon',
    analyze: 'Sayfa Analizi',
  },
  en: {
    tools: 'Tools',
    sync: 'Sync',
    analyze: 'Page Analysis',
  },
  no: {
    tools: 'Verktøy',
    sync: 'Synkronisering',
    analyze: 'Sideanalyse',
  },
};

interface WorkspaceActionsProps {
  onScan: () => void;
  onAnalysis: (section: 'performance' | 'seo' | 'reports' | 'geo') => void;
}

export function WorkspaceActions({ onScan, onAnalysis }: WorkspaceActionsProps) {
  const st = useStore();
  const t = getTranslation(st.language);
  const analysis = getAnalysisTranslation(st.language);
  const sectionTitles = SECTION_TITLES[st.language] || SECTION_TITLES.en;

  return (
    <nav className={styles.actions} aria-label={t.menu}>
      {/* Tools Section */}
      <div className={styles.group}>
        <div className={styles.groupTitle}>{sectionTitles.tools}</div>
        <Button
          variant="default"
          className={styles.actionBtn}
          onClick={() => {
            if (st.visibleViewports().length < 2) {
              st.showToast(t.compareSelectHint);
              return;
            }
            st.setCompareOpen(!st.compareOpen);
          }}
          title={t.compareTitle}
        >
          <Icon name="scale" /> {t.compare}
        </Button>
        <Button
          variant="default"
          className={styles.actionBtn}
          onClick={() => {
            if (!st.visibleViewports().length) {
              st.showToast(t.compareSelectHint);
              return;
            }
            st.setCompareOpen(true, 'figma');
          }}
        >
          <Icon name="palette" /> Figma overlay / diff
        </Button>
        <Button
          variant="default"
          className={styles.actionBtn}
          onClick={onScan}
          title={t.issues}
        >
          <Icon name="search" /> {t.issues}
        </Button>
        <Button
          variant="default"
          className={styles.actionBtn}
          onClick={() => st.setDrawerOpen(!st.drawerOpen)}
        >
          <Icon name="columns" /> {t.panel}
        </Button>
      </div>

      {/* Sync Section */}
      <div className={styles.group}>
        <details className={styles.syncDetails}>
          <summary className={styles.syncSummary}>
            <span>{sectionTitles.sync}</span>
            <span className={styles.syncIndicator}>
              {st.model.sync.scroll ? '●' : '○'}
            </span>
          </summary>
          <div className={styles.channels}>
            {(Object.keys(st.model.sync) as (keyof typeof st.model.sync)[]).map((channel) => {
              const label =
                channel === 'scroll'
                  ? t.syncScroll
                  : channel === 'click'
                  ? t.syncClick
                  : channel === 'nav'
                  ? t.syncNav
                  : channel === 'reload'
                  ? t.syncReload
                  : channel === 'key'
                  ? t.syncKey
                  : channel === 'input'
                  ? t.syncInput
                  : t.syncForm;

              return (
                <label key={channel} className={styles.channelLabel}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={st.model.sync[channel]}
                    onChange={(event) => st.setSync(channel, event.target.checked)}
                  />
                </label>
              );
            })}
          </div>
        </details>
      </div>

      {/* Page Analysis Section */}
      <div className={styles.group}>
        <div className={styles.groupTitle}>{sectionTitles.analyze}</div>
        <Button
          variant="default"
          className={styles.actionBtn}
          onClick={() => onAnalysis('performance')}
        >
          {analysis.tabPerformance}
        </Button>
        <Button
          variant="default"
          className={styles.actionBtn}
          onClick={() => onAnalysis('seo')}
        >
          {analysis.tabSeo}
        </Button>
        <Button
          variant="default"
          className={styles.actionBtn}
          onClick={() => onAnalysis('reports')}
        >
          {analysis.tabReports}
        </Button>
        <Button
          variant="default"
          className={styles.actionBtn}
          onClick={() => onAnalysis('geo')}
          title={analysis.tabGeo}
        >
          <span>{analysis.tabGeo.replace(/\s*\(Beta\)/i, '')}</span>
          <span className={styles.betaBadge}>{analysis.geoBetaBadge || 'BETA'}</span>
        </Button>
      </div>
    </nav>
  );
}
