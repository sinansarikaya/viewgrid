export interface DevicePickerTranslations {
  title: string;
  all: string;
  phones: string;
  tablets: string;
  laptops: string;
  desktops: string;
  custom: string;
  favorites: string;
  recents: string;
  brandLabel: string;
  brandAll: string;
  brandApple: string;
  brandGoogle: string;
  brandSamsung: string;
  searchPlaceholder: string;
  addSelected: (count: number) => string;
  addDevice: string;
  direction: string;
  portrait: string;
  landscape: string;
  defaultOrientationLabel: (orientation: string) => string;
  limitReached: (max: number) => string;
  slotsRemaining: (remaining: number, max: number) => string;
  customSectionTitle: string;
  deviceName: string;
  width: string;
  height: string;
  dpr: string;
  addCustom: string;
  groupsTitle: string;
  saveGroupBtn: string;
  groupNamePlaceholder: string;
  loadGroupBtn: string;
  deleteGroupBtn: string;
  noDevicesFound: string;
  provenanceDisclaimer: string;
  // Verification labels & tooltips
  verifDescriptor: string;
  verifDescriptorTooltip: string;
  verifLayoutPreset: string;
  verifLayoutPresetTooltip: string;
  verifUnverified: string;
  verifUnverifiedTooltip: string;
  verifUserDefined: string;
  verifUserDefinedTooltip: string;
  // Accessibility labels
  ariaSelectDevice: (name: string) => string;
  ariaToggleFavorite: (name: string) => string;
  ariaAddSingle: (name: string) => string;
  ariaDeleteGroup: (name: string) => string;
  ariaFavoriteTitle: string;
  // Custom device validation errors
  errCustomNameRequired: string;
  errCustomWidthInvalid: string;
  errCustomHeightInvalid: string;
  errCustomDprInvalid: string;
}

export const DEVICE_PICKER_I18N: Record<'tr' | 'en' | 'no', DevicePickerTranslations> = {
  tr: {
    title: 'Cihaz Ekle',
    all: 'Tümü',
    phones: 'Telefonlar',
    tablets: 'Tabletler',
    laptops: 'Dizüstü',
    desktops: 'Masaüstü',
    custom: 'Özel Cihaz',
    favorites: '★ Favoriler',
    recents: 'Son Eklenenler',
    brandLabel: 'Marka',
    brandAll: 'Tüm Markalar',
    brandApple: 'Apple',
    brandGoogle: 'Google',
    brandSamsung: 'Samsung',
    searchPlaceholder: 'Model, boyut veya marka ara...',
    addSelected: (count: number) => `Seçilen ${count} Cihazı Ekle`,
    addDevice: 'Cihazı Ekle',
    direction: 'Yönelim',
    portrait: 'Dikey (Portrait)',
    landscape: 'Yatay (Landscape)',
    defaultOrientationLabel: (orientation: string) => `Varsayılan: ${orientation === 'portrait' ? 'Dikey' : 'Yatay'}`,
    limitReached: (max: number) => `Maksimum viewport sınırına (${max}) ulaşıldı.`,
    slotsRemaining: (remaining: number, max: number) => `${remaining} / ${max} boş yuva kaldı`,
    customSectionTitle: 'Yeni Özel Cihaz Oluştur',
    deviceName: 'Cihaz Adı',
    width: 'Genişlik (px)',
    height: 'Yükseklik (px)',
    dpr: 'DPR',
    addCustom: 'Özel Cihaz Ekle',
    groupsTitle: 'Kayıtlı Cihaz Grupları',
    saveGroupBtn: 'Seçilenleri Grup Olarak Kaydet',
    groupNamePlaceholder: 'Grup adı (örn. Mobil & Tablet)',
    loadGroupBtn: 'Grubu Seç',
    deleteGroupBtn: 'Grubu Sil',
    noDevicesFound: 'Eşleşen cihaz bulunamadı',
    provenanceDisclaimer: 'CSS mantıksal piksel çözünürlükleri kullanılır. Donanım veya tarayıcı motoru (örn. Safari) emülasyonu yapılmaz.',
    verifDescriptor: 'Doğrulanmış Ekran',
    verifDescriptorTooltip: 'Playwright aygıt tanımlayıcısı kaynaklı doğrulanmış CSS çözünürlüğü.',
    verifLayoutPreset: 'Düzen Önayarı',
    verifLayoutPresetTooltip: 'Standart masaüstü / dizüstü web düzeni CSS kırılma noktası.',
    verifUnverified: 'Model Önayarı',
    verifUnverifiedTooltip: 'CSS referans boyutu; fiziksel donanım ekranı bağımsız doğrulanmamıştır.',
    verifUserDefined: 'Kullanıcı Tanımlı',
    verifUserDefinedTooltip: 'Kullanıcı tarafından oluşturulan özel CSS görünüm boyutu.',
    ariaSelectDevice: (name: string) => `${name} cihazını seç`,
    ariaToggleFavorite: (name: string) => `${name} favori durumunu değiştir`,
    ariaAddSingle: (name: string) => `${name} cihazını doğrudan ekle`,
    ariaDeleteGroup: (name: string) => `${name} grubunu sil`,
    ariaFavoriteTitle: 'Favorilere ekle/çıkar',
    errCustomNameRequired: 'Cihaz adı boş bırakılamaz.',
    errCustomWidthInvalid: 'Genişlik 100 ile 10000 px arasında geçerli bir sayı olmalıdır.',
    errCustomHeightInvalid: 'Yükseklik 100 ile 10000 px arasında geçerli bir sayı olmalıdır.',
    errCustomDprInvalid: 'DPR (Cihaz piksel oranı) 0.5 ile 6 arasında geçerli bir sayı olmalıdır.',
  },
  en: {
    title: 'Add Devices',
    all: 'All',
    phones: 'Phones',
    tablets: 'Tablets',
    laptops: 'Laptops',
    desktops: 'Desktops',
    custom: 'Custom',
    favorites: '★ Favorites',
    recents: 'Recent',
    brandLabel: 'Brand',
    brandAll: 'All Brands',
    brandApple: 'Apple',
    brandGoogle: 'Google',
    brandSamsung: 'Samsung',
    searchPlaceholder: 'Search model, dimension or brand...',
    addSelected: (count: number) => `Add ${count} Selected Device${count > 1 ? 's' : ''}`,
    addDevice: 'Add Device',
    direction: 'Orientation',
    portrait: 'Portrait',
    landscape: 'Landscape',
    defaultOrientationLabel: (orientation: string) => `Default: ${orientation === 'portrait' ? 'Portrait' : 'Landscape'}`,
    limitReached: (max: number) => `Maximum viewport limit (${max}) reached.`,
    slotsRemaining: (remaining: number, max: number) => `${remaining} / ${max} slots remaining`,
    customSectionTitle: 'Create Custom Device',
    deviceName: 'Device Name',
    width: 'Width (px)',
    height: 'Height (px)',
    dpr: 'DPR',
    addCustom: 'Add Custom Device',
    groupsTitle: 'Device Groups',
    saveGroupBtn: 'Save Selected as Group',
    groupNamePlaceholder: 'Group name (e.g. Mobile + Tablet)',
    loadGroupBtn: 'Select Group',
    deleteGroupBtn: 'Delete Group',
    noDevicesFound: 'No matching devices found',
    provenanceDisclaimer: 'Uses CSS logical viewport pixels. This is not a hardware or browser engine emulation (e.g. Safari).',
    verifDescriptor: 'Verified Screen',
    verifDescriptorTooltip: 'Verified CSS dimensions sourced from Playwright device descriptors.',
    verifLayoutPreset: 'Layout Preset',
    verifLayoutPresetTooltip: 'Standard responsive desktop / laptop CSS breakpoint viewport.',
    verifUnverified: 'Model Preset',
    verifUnverifiedTooltip: 'CSS reference size; physical hardware screen not independently verified.',
    verifUserDefined: 'User Defined',
    verifUserDefinedTooltip: 'Custom user-specified CSS viewport size.',
    ariaSelectDevice: (name: string) => `Select ${name}`,
    ariaToggleFavorite: (name: string) => `Toggle favorite for ${name}`,
    ariaAddSingle: (name: string) => `Add ${name} immediately`,
    ariaDeleteGroup: (name: string) => `Delete group ${name}`,
    ariaFavoriteTitle: 'Add/remove from favorites',
    errCustomNameRequired: 'Device name cannot be empty.',
    errCustomWidthInvalid: 'Width must be a valid number between 100 and 10000 px.',
    errCustomHeightInvalid: 'Height must be a valid number between 100 and 10000 px.',
    errCustomDprInvalid: 'DPR must be a valid number between 0.5 and 6.',
  },
  no: {
    title: 'Legg til enheter',
    all: 'Alle',
    phones: 'Telefoner',
    tablets: 'Nettbrett',
    laptops: 'Bærbare',
    desktops: 'Stasjonære',
    custom: 'Tilpasset',
    favorites: '★ Favoritter',
    recents: 'Nylige',
    brandLabel: 'Merke',
    brandAll: 'Alle merker',
    brandApple: 'Apple',
    brandGoogle: 'Google',
    brandSamsung: 'Samsung',
    searchPlaceholder: 'Søk etter modell, størrelse eller merke...',
    addSelected: (count: number) => `Legg til ${count} valgte enhet${count > 1 ? 'er' : ''}`,
    addDevice: 'Legg til enhet',
    direction: 'Retning',
    portrait: 'Stående (Portrait)',
    landscape: 'Liggende (Landscape)',
    defaultOrientationLabel: (orientation: string) => `Standard: ${orientation === 'portrait' ? 'Stående' : 'Liggende'}`,
    limitReached: (max: number) => `Maksimal grense for visningsområder (${max}) er nådd.`,
    slotsRemaining: (remaining: number, max: number) => `${remaining} / ${max} ledige plasser`,
    customSectionTitle: 'Opprett tilpasset enhet',
    deviceName: 'Enhetsnavn',
    width: 'Bredde (px)',
    height: 'Høyde (px)',
    dpr: 'DPR',
    addCustom: 'Legg til tilpasset',
    groupsTitle: 'Enhetsgrupper',
    saveGroupBtn: 'Lagre valgte som gruppe',
    groupNamePlaceholder: 'Gruppenavn (f.eks. Mobil + Nettbrett)',
    loadGroupBtn: 'Velg gruppe',
    deleteGroupBtn: 'Slett gruppe',
    noDevicesFound: 'Ingen samsvarende enheter funnet',
    provenanceDisclaimer: 'Bruker CSS logiske piksler. Dette er ikke en maskinvare- eller nettleseremulering (f.eks. Safari).',
    verifDescriptor: 'Verifisert skjerm',
    verifDescriptorTooltip: 'Verifiserte CSS-dimensjoner hentet fra Playwright enhetsbeskrivelser.',
    verifLayoutPreset: 'Oppsettforhåndsinnstilling',
    verifLayoutPresetTooltip: 'Standard responsivt CSS-brytningspunkt for skrivebord/bærbar.',
    verifUnverified: 'Modellforhåndsinnstilling',
    verifUnverifiedTooltip: 'CSS-referansestørrelse; fysisk maskinvareskjerm er ikke uavhengig verifisert.',
    verifUserDefined: 'Brukertilpasset',
    verifUserDefinedTooltip: 'Tilpasset visningsområde oppgitt av brukeren.',
    ariaSelectDevice: (name: string) => `Velg ${name}`,
    ariaToggleFavorite: (name: string) => `Veksle favoritt for ${name}`,
    ariaAddSingle: (name: string) => `Legg til ${name} umiddelbart`,
    ariaDeleteGroup: (name: string) => `Slett gruppe ${name}`,
    ariaFavoriteTitle: 'Legg til eller fjern fra favoritter',
    errCustomNameRequired: 'Enhetsnavn kan ikke være tomt.',
    errCustomWidthInvalid: 'Bredde må være et gyldig tall mellom 100 og 10000 px.',
    errCustomHeightInvalid: 'Høyde må være et gyldig tall mellom 100 og 10000 px.',
    errCustomDprInvalid: 'DPR må være et gyldig tall mellom 0.5 og 6.',
  },
};

export function getDevicePickerTranslation(lang?: string): DevicePickerTranslations {
  if (lang === 'tr' || lang === 'no') return DEVICE_PICKER_I18N[lang];
  return DEVICE_PICKER_I18N.en;
}
