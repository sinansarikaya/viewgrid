export type Language = 'tr' | 'en' | 'no';

export interface Translations {
  add: string;
  presets: string;
  layout: string;
  layoutGrid: string;
  layoutRow: string;
  layoutCol: string;
  sync: string;
  syncScroll: string;
  syncClick: string;
  syncNav: string;
  syncReload: string;
  syncKey: string;
  syncInput: string;
  syncForm: string;
  issues: string;
  panel: string;
  shotOne: string;
  shotAll: string;
  shotWorkspace: string;
  focusMode: string;
  toggleFrames: string;
  theme: string;
  menu: string;
  back: string;
  forward: string;
  reloadAll: string;
  hardReloadAll: string;
  clearStorage: string;
  cacheBypassedToast: string;
  urlPlaceholder: string;
  go: string;
  workspaceName: string;
  save: string;
  load: string;
  delete: string;
  viewports: string;
  zoomPresets: string;
  noViewports: string;
  emptyHint: string;
  addDeviceBtn: string;
  siteAccessLimited: string;
  siteAccessGranted: string;
  siteAccessHint: string;
  enableSiteAccess: string;
  howToEnable: string;
  searchDevices: string;
  customDevice: string;
  addCustom: string;
  deviceName: string;
  width: string;
  height: string;
  dpr: string;
  orientation: string;
  portrait: string;
  landscape: string;
  duplicate: string;
  minimize: string;
  restore: string;
  hide: string;
  remove: string;
  minimized: string;
  language: string;
  turkish: string;
  english: string;
  norwegian: string;
  all: string;
  phones: string;
  tablets: string;
  laptops: string;
  desktops: string;
  fitToScreen: string;
  screenshotSaved: string;
  screenshotFailed: string;
  allScreenshotsSaved: string;
  workspaceScreenshotSaved: string;
  accessGrantedMsg: string;
  accessDeniedMsg: string;
  noIssuesFound: string;
  runningAudit: string;
  runAudit: string;
  reScan: string;
  filterAll: string;
  clear: string;
  inspectNotice: string;
  colorSchemeAuto: string;
  colorSchemeDark: string;
  colorSchemeLight: string;
  touchCursor: string;
  compare: string;
  compareTitle: string;
  compareSelectHint: string;
  finish: string;
  scrollToTop: string;
  alignDevice: string;
  compareSplit: string;
  compareCurtain: string;
  compareSideBySide: string;
  resetSplit: string;
  dropHere: string;
  alignItemsTitle: string;
  justifyContentTitle: string;
  alignTop: string;
  alignCenterV: string;
  alignBottom: string;
  alignLeft: string;
  alignCenterH: string;
  alignRight: string;
  alignSpaceBetween: string;
  layoutFree: string;
  autoAlignGrid: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    add: '＋ Add',
    presets: '☰ Presets',
    layout: 'Layout',
    layoutGrid: 'Grid',
    layoutRow: 'Row',
    layoutCol: 'Column',
    sync: 'Sync',
    syncScroll: 'Sync scroll',
    syncClick: 'Sync click',
    syncNav: 'Sync navigation',
    syncReload: 'Sync reload',
    syncKey: 'Sync keys',
    syncInput: 'Sync inputs',
    syncForm: 'Sync forms',
    issues: 'Issues',
    panel: 'Panel',
    shotOne: 'Screenshot (C)',
    shotAll: 'Screenshot all (Shift+C)',
    shotWorkspace: 'Workspace screenshot',
    focusMode: 'Focus mode (F)',
    toggleFrames: 'Toggle device frames',
    theme: 'Theme',
    menu: 'Workspace menu',
    back: 'Back (all)',
    forward: 'Forward (all)',
    reloadAll: 'Reload all (Shift+R)',
    hardReloadAll: 'Bypass Cache & Hard Reload (Clear Cache)',
    clearStorage: 'Clear Cookies & Storage',
    cacheBypassedToast: 'Cache bypassed and pages reloaded with fresh state',
    urlPlaceholder: 'https://example.com · localhost:5173',
    go: 'Go',
    workspaceName: 'Workspace name',
    save: 'Save',
    load: 'Load',
    delete: 'Delete',
    viewports: 'viewports',
    zoomPresets: 'zoom',
    noViewports: 'No viewports yet.',
    emptyHint: 'Tested pages are framed in place — grant site access from ☰ for XFO/CSP-protected sites.',
    addDeviceBtn: '＋ Add device (A)',
    siteAccessLimited: 'Site access limited',
    siteAccessGranted: 'site access: granted',
    siteAccessHint: 'XFO/CSP-protected sites need the framing grant (☰ → Enable site access).',
    enableSiteAccess: 'Enable site access (framing + sync)',
    howToEnable: 'How to enable',
    searchDevices: 'Search devices or presets...',
    customDevice: 'Custom device',
    addCustom: 'Add custom',
    deviceName: 'Name',
    width: 'Width',
    height: 'Height',
    dpr: 'DPR',
    orientation: 'Orientation (O)',
    portrait: 'Portrait',
    landscape: 'Landscape',
    duplicate: 'Duplicate',
    minimize: 'Minimize',
    restore: 'Restore',
    hide: 'Hide',
    remove: 'Remove',
    minimized: 'minimized',
    language: 'Language',
    turkish: 'Türkçe',
    english: 'English',
    norwegian: 'Norsk',
    all: 'All',
    phones: 'Phones',
    tablets: 'Tablets',
    laptops: 'Laptops',
    desktops: 'Desktops',
    fitToScreen: 'Fit to screen',
    screenshotSaved: 'Screenshot saved',
    screenshotFailed: 'Screenshot failed',
    allScreenshotsSaved: 'screenshot(s) saved',
    workspaceScreenshotSaved: 'Workspace screenshot saved',
    accessGrantedMsg: 'Site access granted — framing & sync enabled',
    accessDeniedMsg: 'Permission denied — framing & sync stay off',
    noIssuesFound: 'No issues found on loaded pages.',
    runningAudit: 'Running audit across active frames...',
    runAudit: 'Run Audit',
    reScan: 'Re-scan',
    filterAll: 'All severities',
    clear: 'Clear',
    inspectNotice: 'Click an issue to locate it in the source viewport.',
    colorSchemeAuto: 'System color scheme',
    colorSchemeDark: 'Dark mode',
    colorSchemeLight: 'Light mode',
    touchCursor: 'Touch cursor',
    compare: 'Compare',
    compareTitle: 'Visual Comparison / Diff',
    compareSelectHint: 'Select two viewports to compare',
    finish: 'Finish',
    scrollToTop: 'Scroll to top (all devices)',
    alignDevice: 'Align to Device',
    compareSplit: 'Dual Split',
    compareCurtain: 'Overlay Curtain',
    compareSideBySide: 'Side by Side',
    resetSplit: 'Equal Split (50%)',
    dropHere: 'Drop here',
    alignItemsTitle: 'Vertical alignment',
    justifyContentTitle: 'Horizontal alignment',
    alignTop: '⬆️ Top',
    alignCenterV: '↕️ Middle',
    alignBottom: '⬇️ Bottom',
    alignLeft: '⬅️ Left',
    alignCenterH: '↔️ Center',
    alignRight: '➡️ Right',
    alignSpaceBetween: '⇥⇤ Space Between',
    layoutFree: 'Freeform',
    autoAlignGrid: '📐 Auto Align Grid',
  },
  tr: {
    add: '＋ Ekle',
    presets: '☰ Şablonlar',
    layout: 'Yerleşim',
    layoutGrid: 'Izgara (Matris)',
    layoutRow: 'Satır',
    layoutCol: 'Sütun',
    sync: 'Senk',
    syncScroll: 'Kaydırma senkronu',
    syncClick: 'Tıklama senkronu',
    syncNav: 'Gezinme senkronu',
    syncReload: 'Yenileme senkronu',
    syncKey: 'Tuş senkronu',
    syncInput: 'Girdi senkronu',
    syncForm: 'Form senkronu',
    issues: 'Sorunlar',
    panel: 'Panel',
    shotOne: 'Ekran Görüntüsü (C)',
    shotAll: 'Tümünün Ekran Görüntüsü (Shift+C)',
    shotWorkspace: 'Çalışma Alanı Görüntüsü',
    focusMode: 'Odak Modu (F)',
    toggleFrames: 'Cihaz Çerçevelerini Aç/Kapat',
    theme: 'Tema',
    menu: 'Çalışma Alanı Menüsü',
    back: 'Geri (tümü)',
    forward: 'İleri (tümü)',
    reloadAll: 'Tümünü Yenile (Shift+R)',
    hardReloadAll: 'Önbelleği Temizle & Zorla Yenile (Bypass Cache)',
    clearStorage: 'Çerezleri ve Depolamayı Temizle',
    cacheBypassedToast: 'Önbellek atlandı, sayfalar en güncel haliyle yenilendi',
    urlPlaceholder: 'https://ornek.com · localhost:5173',
    go: 'Git',
    workspaceName: 'Çalışma alanı adı',
    save: 'Kaydet',
    load: 'Yükle',
    delete: 'Sil',
    viewports: 'görünüm',
    zoomPresets: 'yakınlaştırma',
    noViewports: 'Henüz görünüm eklenmedi.',
    emptyHint: 'Test edilen sayfalar doğrudan çerçevelenir — XFO/CSP korumalı siteler için ☰ menüsünden site erişimi verin.',
    addDeviceBtn: '＋ Cihaz Ekle (A)',
    siteAccessLimited: 'Site erişimi kısıtlı',
    siteAccessGranted: 'site erişimi: etkin',
    siteAccessHint: 'XFO/CSP korumalı siteler için çerçeve izni gerekir (☰ → Site erişimini etkinleştir).',
    enableSiteAccess: 'Site erişimini etkinleştir (çerçeve + senk)',
    howToEnable: 'Nasıl etkinleştirilir?',
    searchDevices: 'Cihaz veya şablon ara...',
    customDevice: 'Özel cihaz',
    addCustom: 'Özel cihaz ekle',
    deviceName: 'İsim',
    width: 'Genişlik',
    height: 'Yükseklik',
    dpr: 'DPR',
    orientation: 'Yönlendirme (O)',
    portrait: 'Dikey',
    landscape: 'Yatay',
    duplicate: 'Çoğalt',
    minimize: 'Küçült',
    restore: 'Geri Yükle',
    hide: 'Gizle',
    remove: 'Kaldır',
    minimized: 'küçültüldü',
    language: 'Dil',
    turkish: 'Türkçe',
    english: 'English',
    norwegian: 'Norsk',
    all: 'Tümü',
    phones: 'Telefonlar',
    tablets: 'Tabletler',
    laptops: 'Dizüstü',
    desktops: 'Masaüstü',
    fitToScreen: 'Ekrana sığdır',
    screenshotSaved: 'Ekran görüntüsü kaydedildi',
    screenshotFailed: 'Ekran görüntüsü alınamadı',
    allScreenshotsSaved: 'ekran görüntüsü kaydedildi',
    workspaceScreenshotSaved: 'Çalışma alanı görüntüsü kaydedildi',
    accessGrantedMsg: 'Site erişimi verildi — çerçeveleme & senkronizasyon etkin',
    accessDeniedMsg: 'İzin reddedildi — çerçeveleme & senk kapalı kalacak',
    noIssuesFound: 'Yüklenen sayfalarda sorun tespit edilmedi.',
    runningAudit: 'Aktif çerçevelerde denetim yapılıyor...',
    runAudit: 'Denetimi Başlat',
    reScan: 'Yeniden Tara',
    filterAll: 'Tüm önem düzeyleri',
    clear: 'Temizle',
    inspectNotice: 'İlgili görünümde incelemek için bir soruna tıklayın.',
    colorSchemeAuto: 'Sistem renk teması',
    colorSchemeDark: 'Karanlık mod',
    colorSchemeLight: 'Aydınlık mod',
    touchCursor: 'Dokunmatik imleç',
    compare: 'Karşılaştır',
    compareTitle: 'Görsel Karşılaştırma / Diff',
    compareSelectHint: 'Karşılaştırmak için 2 cihaz seçin',
    finish: 'Kasa Rengi',
    scrollToTop: 'Başa dön (tüm cihazlar)',
    alignDevice: 'Cihaza Hizala',
    compareSplit: 'Bölünmüş Sürgü',
    compareCurtain: 'Örtüşen Perde',
    compareSideBySide: 'Yan Yana',
    resetSplit: 'Eşitle (%50)',
    dropHere: 'Buraya Bırak',
    alignItemsTitle: 'Dikey hizalama',
    justifyContentTitle: 'Yatay hizalama',
    alignTop: '⬆️ Üst',
    alignCenterV: '↕️ Orta (Dikey)',
    alignBottom: '⬇️ Alt',
    alignLeft: '⬅️ Sol',
    alignCenterH: '↔️ Ortala (Yatay)',
    alignRight: '➡️ Sağ',
    alignSpaceBetween: '⇥⇤ Eşit Dağıt',
    layoutFree: 'Serbest Tuval',
    autoAlignGrid: '📐 Izgaraya Düzgün Hizala',
  },
  no: {
    add: '＋ Legg til',
    presets: '☰ Maler',
    layout: 'Oppsett',
    layoutGrid: 'Rutenett (Matrise)',
    layoutRow: 'Rad',
    layoutCol: 'Kolonne',
    sync: 'Synk',
    syncScroll: 'Synkroniser rulling',
    syncClick: 'Synkroniser klikk',
    syncNav: 'Synkroniser navigasjon',
    syncReload: 'Synkroniser oppdatering',
    syncKey: 'Synkroniser tastetrykk',
    syncInput: 'Synkroniser inndata',
    syncForm: 'Synkroniser skjemaer',
    issues: 'Problemer',
    panel: 'Panel',
    shotOne: 'Skjermbilde (C)',
    shotAll: 'Skjermbilde av alle (Shift+C)',
    shotWorkspace: 'Skjermbilde av arbeidsområde',
    focusMode: 'Fokusmodus (F)',
    toggleFrames: 'Slå av/på enhetsrammer',
    theme: 'Tema',
    menu: 'Arbeidsområdemeny',
    back: 'Tilbake (alle)',
    forward: 'Fremover (alle)',
    reloadAll: 'Last inn alle på nytt (Shift+R)',
    hardReloadAll: 'Omgå hurtigbuffer og hard omlasting',
    clearStorage: 'Slett informasjonskapsler og lagring',
    cacheBypassedToast: 'Hurtigbuffer omgått og sider lastet på nytt med fersk tilstand',
    urlPlaceholder: 'https://eksempel.no · localhost:5173',
    go: 'Gå',
    workspaceName: 'Arbeidsområdenavn',
    save: 'Lagre',
    load: 'Last inn',
    delete: 'Slett',
    viewports: 'visninger',
    zoomPresets: 'zoom',
    noViewports: 'Ingen visninger ennå.',
    emptyHint: 'Testede sider rammes inn direkte — gi nettstedstilgang fra ☰ for XFO/CSP-beskyttede nettsteder.',
    addDeviceBtn: '＋ Legg til enhet (A)',
    siteAccessLimited: 'Begrenset nettstedstilgang',
    siteAccessGranted: 'nettstedstilgang: innvilget',
    siteAccessHint: 'XFO/CSP-beskyttede sider krever rammetillatelse (☰ → Aktiver nettstedstilgang).',
    enableSiteAccess: 'Aktiver nettstedstilgang (rammer + synk)',
    howToEnable: 'Hvordan aktivere',
    searchDevices: 'Søk etter enheter eller maler...',
    customDevice: 'Egendefinert enhet',
    addCustom: 'Legg til egendefinert',
    deviceName: 'Navn',
    width: 'Bredde',
    height: 'Høyde',
    dpr: 'DPR',
    orientation: 'Retning (O)',
    portrait: 'Portrett',
    landscape: 'Landskap',
    duplicate: 'Dupliser',
    minimize: 'Minimer',
    restore: 'Gjenopprett',
    hide: 'Skjul',
    remove: 'Fjern',
    minimized: 'minimert',
    language: 'Språk',
    turkish: 'Türkçe',
    english: 'English',
    norwegian: 'Norsk',
    all: 'Alle',
    phones: 'Telefoner',
    tablets: 'Nettbrett',
    laptops: 'Bærbare',
    desktops: 'Stasjonære',
    fitToScreen: 'Tilpass til skjerm',
    screenshotSaved: 'Skjermbilde lagret',
    screenshotFailed: 'Kunne ikke ta skjermbilde',
    allScreenshotsSaved: 'skjermbilde(r) lagret',
    workspaceScreenshotSaved: 'Skjermbilde av arbeidsområde lagret',
    accessGrantedMsg: 'Nettstedstilgang innvilget — rammer & synk aktivert',
    accessDeniedMsg: 'Tillatelse avslått — rammer & synk forblir av',
    noIssuesFound: 'Ingen problemer funnet på lastede sider.',
    runningAudit: 'Kjører revisjon på aktive rammer...',
    runAudit: 'Kjør revisjon',
    reScan: 'Skann på nytt',
    filterAll: 'Alle alvorlighetsgrader',
    clear: 'Tøm',
    inspectNotice: 'Klikk på et problem for å finne det i kildevisningen.',
    colorSchemeAuto: 'System fargetema',
    colorSchemeDark: 'Mørk modus',
    colorSchemeLight: 'Lys modus',
    touchCursor: 'Berøringsmarkør',
    compare: 'Sammenlign',
    compareTitle: 'Visuell sammenligning / Diff',
    compareSelectHint: 'Velg to visninger å sammenligne',
    finish: 'Finish',
    scrollToTop: 'Rull til toppen (alle visninger)',
    alignDevice: 'Juster til enhet',
    compareSplit: 'Delt skyvebryter',
    compareCurtain: 'Overlappende gardin',
    compareSideBySide: 'Side ved side',
    resetSplit: 'Lik deling (50%)',
    dropHere: 'Slipp her',
    alignItemsTitle: 'Vertikal justering',
    justifyContentTitle: 'Horisontal justering',
    alignTop: '⬆️ Topp',
    alignCenterV: '↕️ Midten',
    alignBottom: '⬇️ Bunn',
    alignLeft: '⬅️ Venstre',
    alignCenterH: '↔️ Midtstill',
    alignRight: '➡️ Høyre',
    alignSpaceBetween: '⇥⇤ Jevn avstand',
    layoutFree: 'Fritt område',
    autoAlignGrid: '📐 Juster til rutenett',
  },
};

export function getTranslation(lang: Language): Translations {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
