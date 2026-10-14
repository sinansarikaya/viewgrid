import React from 'react';
import { Icon } from '../common/Icon';
import { Checkbox } from '../common/Checkbox';
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
  const summary = st.analysisSummary?.url === st.model.url && st.analysisSummary.generation === st.previewGeneration ? st.analysisSummary : null;
  const counts = summary?.counts;
  const failureLabel = st.language === 'tr' ? 'farklı başarısız kontrol' : st.language === 'no' ? 'unike mislykkede kontroller' : 'distinct failed checks';
  const badge = (section: 'performance' | 'seo' | 'geo' | 'reports') => counts && counts[section] > 0 ? <span className={styles.failureBadge} title={`${counts[section]} ${failureLabel}`} aria-label={`${counts[section]} ${failureLabel}`}>{counts[section]}</span> : summary?.sections[section].state === 'pass' ? <span className={styles.passBadge} aria-label={section === 'performance' ? (st.language === 'tr' ? 'Ölçüm mevcut' : st.language === 'no' ? 'Måling tilgjengelig' : 'Measurement available') : (st.language === 'tr' ? 'Kontroller geçti' : st.language === 'no' ? 'Kontroller bestått' : 'Checks passed')}>✓</span> : null;
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
            st.setCompareOpen(!(st.compareOpen && st.compareMode === 'figma'), 'figma');
          }}
        >
          <Icon name="palette" /> Figma overlay / diff
        </Button>
        <Button
          variant="default"
          className={styles.actionBtn}
          aria-expanded={st.drawerOpen}
          onClick={onScan}
          title={t.issues}
        >
          <Icon name="search" /> {t.issues}
        </Button>
        <Button
          variant="default"
          className={styles.actionBtn}
          aria-expanded={st.drawerOpen}
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
                  <Checkbox
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
          data-analysis-state={summary?.sections.performance.state}
          onClick={() => onAnalysis('performance')}
          aria-label={analysis.tabPerformance}
        >
          {analysis.tabPerformance}{badge('performance')}
        </Button>
        <Button
          variant="default"
          className={styles.actionBtn}
          data-analysis-state={summary?.sections.seo.state}
          onClick={() => onAnalysis('seo')}
          aria-label={analysis.tabSeo}
        >
          {analysis.tabSeo}{badge('seo')}
        </Button>
        <Button
          variant="default"
          className={styles.actionBtn}
          data-analysis-state={summary?.sections.reports.state}
          onClick={() => onAnalysis('reports')}
          aria-label={analysis.tabReports}
        >
          {analysis.tabReports}{badge('reports')}
        </Button>
        <Button
          variant="default"
          className={styles.actionBtn}
          data-analysis-state={summary?.sections.geo.state}
          onClick={() => onAnalysis('geo')}
          aria-label={analysis.tabGeo}
          title={analysis.tabGeo}
        >
          <span>{analysis.tabGeo.replace(/\s*\(Beta\)/i, '')}</span>
          <span className={styles.betaBadge}>{analysis.geoBetaBadge || 'BETA'}</span>{badge('geo')}
        </Button>
      </div>
    </nav>
  );
}
