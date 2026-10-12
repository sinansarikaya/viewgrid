import React, { useEffect, useState } from 'react';
import { Icon } from '../common/Icon';
import { useStore } from './store';
import { getTranslation } from './i18n';
import { getShellTranslation } from './shell-i18n';
import { effectiveSize } from '../../core/workspace/layout';
import { BUILTIN_PRESETS } from '../../core/devices/builtin';
import { b } from '../../platform/browser';
import { Button } from '../common/Button';
import s from './WorkspaceSidebar.module.css';

const COLLAPSE_KEY = 'viewgrid.sidebar.collapsed';

interface Props {
  onScan: () => void;
  onScrollToTop: () => void;
  children?: React.ReactNode;
}

type TabType = 'devices' | 'tools' | 'sync' | 'workspace';

export function WorkspaceSidebar({ onScan, onScrollToTop, children }: Props) {
  const st = useStore();
  const t = getTranslation(st.language);
  const stText = getShellTranslation(st.language);

  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('devices');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  // Hydrate collapsed state from separate storage key (without touching store.ts)
  useEffect(() => {
    let mounted = true;
    b.storage?.local?.get(COLLAPSE_KEY).then((res) => {
      if (mounted && res && typeof res[COLLAPSE_KEY] === 'boolean') {
        setCollapsed(res[COLLAPSE_KEY]);
      }
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    void b.storage?.local?.set({ [COLLAPSE_KEY]: next }).catch(() => {});
  };

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    if (collapsed) {
      setCollapsed(false);
      void b.storage?.local?.set({ [COLLAPSE_KEY]: false }).catch(() => {});
    }
  };

  const allViewports = st.model.viewports;
  const hiddenCount = allViewports.filter((v) => v.hidden).length;

  return (
    <aside
      className={[
        s.sidebar,
        collapsed ? s.sidebarCollapsed : s.sidebarExpanded,
      ].join(' ')}
      aria-label="Workspace tools and devices"
    >
      <div className={s.header}>
        {!collapsed && <span className={s.headerTitle}>{stText.workspace}</span>}
        <Button
          variant="default"
          iconOnly
          className={s.toggleBtn}
          onClick={toggleCollapse}
          title={collapsed ? stText.expandSidebar : stText.collapseSidebar}
          aria-label={collapsed ? stText.expandSidebar : stText.collapseSidebar}
        >
          <Icon name={collapsed ? "chevronRight" : "chevronLeft"} />
        </Button>
      </div>

      <nav className={s.navTabs} aria-label="Sidebar sections">
        <Button
          variant="default"
          className={[s.navTab, activeTab === 'devices' ? s.navTabActive : ''].join(' ')}
          onClick={() => handleTabClick('devices')}
          title={stText.devices}
          aria-label={stText.devices}
        >
          <span className={s.tabIcon}><Icon name="deviceMobile" /></span>
          {!collapsed && <span>{stText.devices}</span>}
        </Button>

        <Button
          variant="default"
          className={[s.navTab, activeTab === 'tools' ? s.navTabActive : ''].join(' ')}
          onClick={() => handleTabClick('tools')}
          title={stText.tools}
          aria-label={stText.tools}
        >
          <span className={s.tabIcon}><Icon name="tools" /></span>
          {!collapsed && <span>{stText.tools}</span>}
        </Button>

        <Button
          variant="default"
          className={[s.navTab, activeTab === 'sync' ? s.navTabActive : ''].join(' ')}
          onClick={() => handleTabClick('sync')}
          title={stText.sync}
          aria-label={stText.sync}
        >
          <span className={s.tabIcon}><Icon name="refresh" /></span>
          {!collapsed && <span>{stText.sync}</span>}
        </Button>

        <Button
          variant="default"
          className={[s.navTab, activeTab === 'workspace' ? s.navTabActive : ''].join(' ')}
          onClick={() => handleTabClick('workspace')}
          title={stText.workspace}
          aria-label={stText.workspace}
        >
          <span className={s.tabIcon}><Icon name="folder" /></span>
          {!collapsed && <span>{stText.workspace}</span>}
        </Button>
      </nav>

      {!collapsed && (
        <div className={s.content}>
          {/* —— DEVICES TAB —— */}
          {activeTab === 'devices' && (
            <div className={s.section}>
              <div className={s.sectionTitle}>
                <span>{stText.devices}</span>
                {hiddenCount > 0 && (
                  <span className={s.badge}>{stText.hiddenCount(hiddenCount)}</span>
                )}
              </div>

              <div className={s.deviceList}>
                {allViewports.length === 0 ? (
                  <div className={s.emptyHint}>{stText.noDevices}</div>
                ) : (
                  allViewports.map((v, idx) => {
                    const profile = st.profileOf(v);
                    const size = effectiveSize(profile, v.orientation);
                    const isFocused = st.focusedId === v.id;

                    return (
                      <div
                        key={v.id}
                        className={[
                          s.deviceItem,
                          isFocused ? s.deviceFocused : '',
                          v.hidden ? s.deviceHidden : '',
                        ].join(' ')}
                      >
                        <Button
                          variant="default"
                          className={s.deviceSelectBtn}
                          onClick={() => st.focus(v.id)}
                          title={`${profile.name} (${size.width}×${size.height})`}
                          aria-label={`${profile.name} ${size.width}x${size.height}`}
                        >
                          <span className={s.deviceName}>{profile.name}</span>
                          <span className={s.deviceMeta}>
                            {size.width}×{size.height} • {v.orientation === 'portrait' ? 'P' : 'L'}
                          </span>
                        </Button>

                        <div className={s.deviceActions}>
                          {/* Keyboard/Button Reorder: Move Up */}
                          <Button
                            variant="default"
                            iconOnly
                            className={s.actionBtn}
                            disabled={idx === 0}
                            onClick={() => st.reorder(idx, idx - 1)}
                            title={stText.moveUp}
                            aria-label={`${stText.moveUp} ${profile.name}`}
                          >
                            <Icon name="arrowUp" />
                          </Button>

                          {/* Keyboard/Button Reorder: Move Down */}
                          <Button
                            variant="default"
                            iconOnly
                            className={s.actionBtn}
                            disabled={idx === allViewports.length - 1}
                            onClick={() => st.reorder(idx, idx + 1)}
                            title={stText.moveDown}
                            aria-label={`${stText.moveDown} ${profile.name}`}
                          >
                            <Icon name="arrowDown" />
                          </Button>

                          {/* Unhide / Hide toggle (enables opening hidden devices back) */}
                          <Button
                            variant="default"
                            iconOnly
                            className={s.actionBtn}
                            onClick={() => st.toggleHidden(v.id)}
                            title={v.hidden ? stText.unhide : stText.hide}
                            aria-label={`${v.hidden ? stText.unhide : stText.hide} ${profile.name}`}
                          >
                            <Icon name={v.hidden ? "eyeOff" : "eye"} />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <Button
                variant="primary"
                onClick={() => st.setPickerOpen(true)}
              >
                {stText.addDevice}
              </Button>
            </div>
          )}

          {/* —— TOOLS TAB —— */}
          {activeTab === 'tools' && (
            <div className={s.section}>
              <div className={s.sectionTitle}>
                <span>{stText.tools}</span>
              </div>

              <div className={s.toolGrid}>
                <Button
                  variant="default"
                  className={[s.toolBtn, st.model.touchCursor ? s.toolActive : ''].join(' ')}
                  onClick={st.toggleTouchCursor}
                  title={stText.touchCursor}
                >
                  <span className={s.toolIcon}><Icon name="touchCursor" /></span>
                  <span>{stText.touchCursor}</span>
                </Button>

                <Button
                  variant="default"
                  className={[s.toolBtn, st.model.frames ? s.toolActive : ''].join(' ')}
                  onClick={st.toggleFrames}
                  title={stText.deviceFrames}
                >
                  <span className={s.toolIcon}><Icon name={st.model.frames ? 'frameChecked' : 'frame'} /></span>
                  <span>{stText.deviceFrames}</span>
                </Button>

                <Button
                  variant="default"
                  className={[s.toolBtn, st.focusMode ? s.toolActive : ''].join(' ')}
                  onClick={st.toggleFocusMode}
                  title={stText.focusMode}
                >
                  <span className={s.toolIcon}><Icon name="focus" /></span>
                  <span>{stText.focusMode}</span>
                </Button>

                <Button
                  variant="default"
                  className={s.toolBtn}
                  onClick={() => st.fitToScreen()}
                  title={stText.fitToScreen}
                >
                  <span className={s.toolIcon}><Icon name="cornerExpand" /></span>
                  <span>{stText.fitToScreen}</span>
                </Button>

                <Button
                  variant="default"
                  className={s.toolBtn}
                  onClick={onScrollToTop}
                  title={stText.scrollToTop}
                >
                  <span className={s.toolIcon}><Icon name="scrollToTop" /></span>
                  <span>{stText.scrollToTop}</span>
                </Button>

                <Button
                  variant="default"
                  className={s.toolBtn}
                  onClick={onScan}
                  title={stText.scanIssues}
                >
                  <span className={s.toolIcon}><Icon name="search" /></span>
                  <span>{stText.scanIssues}</span>
                </Button>
              </div>
            </div>
          )}

          {/* —— SYNC TAB —— */}
          {activeTab === 'sync' && (
            <div className={s.section}>
              <div className={s.sectionTitle}>
                <span>{stText.sync}</span>
              </div>

              <div className={s.syncList}>
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
                    <label key={channel} className={s.syncRow}>
                      <span>{label}</span>
                      <input
                        type="checkbox"
                        checked={st.model.sync[channel]}
                        onChange={(e) => st.setSync(channel, e.target.checked)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* —— WORKSPACE TAB —— */}
          {activeTab === 'workspace' && (
            <div className={s.section}>
              <div className={s.sectionTitle}>
                <span>{stText.saveCurrentWorkspace}</span>
              </div>

              <div className={s.saveRow}>
                <input
                  className={s.saveInput}
                  placeholder={t.workspaceName}
                  value={newWorkspaceName || st.model.name}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                />
                <Button
                  variant="primary"
                  onClick={() => {
                    st.saveAs(newWorkspaceName || st.model.name);
                    setNewWorkspaceName('');
                  }}
                >
                  {t.save}
                </Button>
              </div>

              <div className={s.sectionTitle}>
                <span>{stText.savedWorkspaces}</span>
              </div>

              <div className={s.deviceList}>
                {Object.keys(st.savedWorkspaces).length === 0 ? (
                  <div className={s.emptyHint}>{t.noViewports}</div>
                ) : (
                  Object.keys(st.savedWorkspaces).map((name) => (
                    <div key={name} className={s.workspaceItem}>
                      <span>{name}</span>
                      <div className={s.deviceActions}>
                        <Button
                          variant="default"
                          className={s.actionBtn}
                          onClick={() => st.loadSaved(name)}
                        >
                          {t.load}
                        </Button>
                        <Button
                          variant="danger"
                          iconOnly
                          className={s.actionBtn}
                          onClick={() => st.deleteSaved(name)}
                          aria-label={`${st.language === 'tr' ? 'Çalışma alanını sil' : st.language === 'no' ? 'Slett arbeidsområde' : 'Delete workspace'}: ${name}`}
                        >
                          <Icon name="close" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={s.sectionTitle}>
                <span>{t.presets}</span>
              </div>

              <div className={s.deviceList}>
                {BUILTIN_PRESETS.map((p) => (
                  <div key={p.name} className={s.workspaceItem}>
                    <span>{p.name}</span>
                    <Button
                      variant="default"
                      className={s.actionBtn}
                      onClick={() => st.addPreset(p.name)}
                    >
                      {t.add}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {!collapsed && children}
    </aside>
  );
}
