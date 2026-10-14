export interface ShellTranslations {
  workspace: string;
  devices: string;
  tools: string;
  sync: string;
  collapseSidebar: string;
  expandSidebar: string;
  savedWorkspaces: string;
  saveCurrentWorkspace: string;
  unhide: string;
  hide: string;
  moveUp: string;
  moveDown: string;
  addDevice: string;
  noDevices: string;
  touchCursor: string;
  deviceFrames: string;
  focusMode: string;
  scrollToTop: string;
  scanIssues: string;
  captureMenu: string;
  shotFocused: string;
  shotAll: string;
  shotWorkspace: string;
  canvasControls: string;
  fitToScreen: string;
  autoAlign: string;
  layoutGrid: string;
  layoutRow: string;
  layoutCol: string;
  layoutFree: string;
  alignItems: string;
  justifyContent: string;
  hiddenCount: (n: number) => string;
}

export const SHELL_TRANSLATIONS: Record<'tr' | 'en' | 'no', ShellTranslations> = {
  tr: {
    workspace: 'Çalışma Alanı',
    devices: 'Cihazlar',
    tools: 'Araçlar',
    sync: 'Eşitleme',
    collapseSidebar: 'Kenar çubuğunu daralt',
    expandSidebar: 'Kenar çubuğunu genişlet',
    savedWorkspaces: 'Kayıtlı Alanlar',
    saveCurrentWorkspace: 'Çalışma Alanını Kaydet',
    unhide: 'Görünür Yap',
    hide: 'Gizle',
    moveUp: 'Yukarı Taşı',
    moveDown: 'Aşağı Taşı',
    addDevice: '+ Cihaz Ekle',
    noDevices: 'Henüz cihaz eklenmedi',
    touchCursor: 'Dokunma İmleci',
    deviceFrames: 'Cihaz Çerçeveleri',
    focusMode: 'Odak Modu',
    scrollToTop: 'En Başa Kaydır',
    scanIssues: 'Sorunları Tara',
    captureMenu: 'Yakalama',
    shotFocused: 'Odaktaki Cihazı Yakala',
    shotAll: 'Tüm Cihazları Yakala',
    shotWorkspace: 'Tüm Tuvali Yakala',
    canvasControls: 'Tuval Yerleşimi',
    fitToScreen: 'Ekrana Sığdır',
    autoAlign: 'Otomatik Hizala',
    layoutGrid: 'Izgara',
    layoutRow: 'Yatay Sıra',
    layoutCol: 'Dikey Sıra',
    layoutFree: 'Serbest Tuval',
    alignItems: 'Dikey Hizalama',
    justifyContent: 'Yatay Dağılım',
    hiddenCount: (n: number) => `${n} gizli cihaz`,
  },
  en: {
    workspace: 'Workspace',
    devices: 'Devices',
    tools: 'Tools',
    sync: 'Sync',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',
    savedWorkspaces: 'Saved Workspaces',
    saveCurrentWorkspace: 'Save Workspace',
    unhide: 'Show',
    hide: 'Hide',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    addDevice: '+ Add Device',
    noDevices: 'No devices added yet',
    touchCursor: 'Touch Cursor',
    deviceFrames: 'Device Frames',
    focusMode: 'Focus Mode',
    scrollToTop: 'Scroll to Top',
    scanIssues: 'Scan Issues',
    captureMenu: 'Capture',
    shotFocused: 'Capture Focused',
    shotAll: 'Capture All Viewports',
    shotWorkspace: 'Capture Full Canvas',
    canvasControls: 'Canvas Controls',
    fitToScreen: 'Fit to Screen',
    autoAlign: 'Auto Align',
    layoutGrid: 'Grid',
    layoutRow: 'Row',
    layoutCol: 'Column',
    layoutFree: 'Free-form',
    alignItems: 'Align Items',
    justifyContent: 'Justify Content',
    hiddenCount: (n: number) => `${n} hidden`,
  },
  no: {
    workspace: 'Arbeidsområde',
    devices: 'Enheter',
    tools: 'Verktøy',
    sync: 'Synkronisering',
    collapseSidebar: 'Skjul sidepanel',
    expandSidebar: 'Utvid sidepanel',
    savedWorkspaces: 'Lagrede områder',
    saveCurrentWorkspace: 'Lagre arbeidsområde',
    unhide: 'Vis',
    hide: 'Skjul',
    moveUp: 'Flytt opp',
    moveDown: 'Flytt ned',
    addDevice: '+ Legg til enhet',
    noDevices: 'Ingen enheter lagt til ennå',
    touchCursor: 'Berøringsmarkør',
    deviceFrames: 'Enhetsrammer',
    focusMode: 'Fokusmodus',
    scrollToTop: 'Rull til toppen',
    scanIssues: 'Skann problemer',
    captureMenu: 'Skjermbilde',
    shotFocused: 'Fang fokusert enhet',
    shotAll: 'Fang alle visninger',
    shotWorkspace: 'Fang hele lerretet',
    canvasControls: 'Lerretkontroller',
    fitToScreen: 'Tilpass til skjerm',
    autoAlign: 'Juster automatisk',
    layoutGrid: 'Rutenett',
    layoutRow: 'Rad',
    layoutCol: 'Kolonne',
    layoutFree: 'Fritt lerret',
    alignItems: 'Vertikal justering',
    justifyContent: 'Horisontal fordeling',
    hiddenCount: (n: number) => `${n} skjulte`,
  },
};

export function getShellTranslation(lang?: string): ShellTranslations {
  if (lang === 'tr' || lang === 'no') return SHELL_TRANSLATIONS[lang];
  return SHELL_TRANSLATIONS.en;
}
