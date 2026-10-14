export interface AnalysisTranslations {
  title: string;
  tabPerformance: string;
  tabSeo: string;
  tabGeo: string;
  tabReports: string;
  urlPlaceholder: string;
  runAnalysis: string;
  cancelAnalysis: string;
  running: string;
  profileMobile: string;
  profileDesktop: string;
  profileBoth: string;
  consentCheckbox: string;
  querySensitiveWarning: string;
  invalidUrlError: string;
  errorTitle: string;
  retry: string;
  dismiss: string;
  statusSuccess: string;
  statusError: string;
  statusCancelled: string;
  analysisStatusLabel: string;
  statusIdle: string;
  statusConsentRequired: string;
  statusPartial: string;
  statusNoData: string;
  latestRunNoData: string;
  statusSaving: string;
  cancellationNotice: string;
  quotaRetryNotice: string;
  previousBatchStale: string;
  previousBatchTargetChanged: string;
  // Repetition UI keys
  runCountLabel: string;
  runCountSingle: string;
  runCountTriple: string;
  disclosureSingleProfile: string;
  disclosureSingleBoth: string;
  disclosureTripleSingleProfile: string;
  disclosureTripleBothProfiles: string;
  repetitionSummaryTitle: string;
  repetitionProgress: (completed: number, requested: number) => string;
  repetitionStopCompleted: string;
  repetitionStopRateLimited: string;
  repetitionStopCancelled: string;
  repetitionStatusAvailable: string;
  repetitionStatusPartial: string;
  repetitionStatusWithheld: string;
  repetitionStatusUnavailable: string;
  repetitionFieldNotice: string;
  medianScoresTitle: string;
  medianMetricsTitle: string;
  sampleCountLabel: (count: number, eligible: number) => string;
  withheldNoFakeZero: string;
  latestRunNotice: string;
  warn_incomplete_runs: string;
  warn_failed_runs: string;
  warn_no_successful_runs: string;
  warn_lab_warnings: string;
  warn_profile_mismatch: string;
  warn_missing_samples: string;
  // Details: Engine, Source, AnalyzedDate, Conditions
  engineDetails: string;
  engineVersionUnavailable: string;
  analyzedAtLabel: string;
  measurementContextLabel: string;
  throttlingLabel: string;
  benchmarkIndexLabel: string;
  // Performance & CrUX
  labSectionTitle: string;
  labSubtitle: string;
  metricLcp: string;
  metricCls: string;
  metricFcp: string;
  metricSi: string;
  metricTbt: string;
  tbtNote: string;
  fieldSectionTitle: string;
  fieldSubtitle: string;
  fieldScopeUrl: string;
  fieldScopeOrigin: string;
  fieldUnavailable: string;
  fieldPartial: string;
  fieldAvailable: string;
  fieldPeriodUnknown: string;
  fieldPeriod: (start: string, end: string) => string;
  fieldReasonLabel: string;
  fieldFormFactorLabel: string;
  fieldIdentifierLabel: string;
  // SEO & A11y Audits
  auditsTitle: string;
  filterAll: string;
  filterPassed: string;
  filterFailed: string;
  filterInformative: string;
  filterManual: string;
  categoryAll: string;
  categorySeo: string;
  categoryA11y: string;
  categoryPerf: string;
  severityAll: string;
  severityHigh: string;
  severityMedium: string;
  severityLow: string;
  severityInfo: string;
  auditStatusPass: string;
  auditStatusFail: string;
  auditStatusManual: string;
  auditStatusInfo: string;
  noAuditsFound: string;
  affectedElements: (count: number) => string;
  automatedNotice: string;
  // GEO
  geoTitle: string;
  geoBetaBadge: string;
  geoDisclaimer: string;
  geoCriteriaId: string;
  geoMode: string;
  geoStatus: string;
  geoEvidence: string;
  geoRecommendation: string;
  geoStatusPass: string;
  geoStatusFail: string;
  geoStatusUnknown: string;
  geoStatusManual: string;
  // Reports & History
  reportsTitle: string;
  downloadHtml: string;
  downloadJson: string;
  printPdf: string;
  attachScreenshot: string;
  removeScreenshot: string;
  capturingScreenshot: string;
  captureScreenshotError: string;
  screenshotDisclosure: string;
  screenshotAttachedBadge: string;
  screenshotMetaText: (name: string, width: number, height: number) => string;
  noActiveReport: string;
  activeBatchInfo: (date: string, url: string) => string;
  popupBlockedNotice: string;
  exportErrorNotice: string;
  historyTitle: string;
  historyEmpty: string;
  loadEntry: string;
  deleteEntry: string;
  clearHistory: string;
  clearHistoryConfirmTitle: string;
  clearHistoryConfirmBody: string;
  confirmClear: string;
  cancelClear: string;
  compareTitle: string;
  compareSelectBefore: string;
  compareSelectAfter: string;
  compareAction: string;
  // Comparison warnings
  warn_different_target: string;
  warn_different_profile: string;
  warn_different_engine: string;
  warn_different_conditions: string;
  warn_redacted_target: string;
  warn_unknown_conditions: string;
  metricBefore: string;
  metricAfter: string;
  metricDelta: string;
  scoreBetter: string;
  scoreWorse: string;
  scoreSame: string;
  // Error codes
  err_INVALID_TARGET: string;
  err_RATE_LIMITED: string;
  err_SERVICE_ERROR: string;
  err_NETWORK_ERROR: string;
  err_TIMEOUT: string;
  err_CANCELLED: string;
  err_INVALID_RESPONSE: string;
  err_MEASUREMENT_FAILED: string;
  err_STORAGE_UNAVAILABLE: string;
  err_HISTORY_LOAD_FAILED: string;
  err_HISTORY_SAVE_FAILED: string;
  err_HISTORY_DELETE_FAILED: string;
  err_HISTORY_CLEAR_FAILED: string;
  err_UNKNOWN: string;
}

export const ANALYSIS_I18N: Record<'tr' | 'en' | 'no', AnalysisTranslations> = {
  tr: {
    title: 'Sayfa Analizi & Raporlama',
    tabPerformance: 'Yerel Performans',
    tabSeo: 'SEO & Erişilebilirlik',
    tabGeo: 'GEO Sinyalleri (Beta)',
    tabReports: 'Raporlar & Geçmiş',
    urlPlaceholder: 'https://example.com (Herkese açık URL)',
    runAnalysis: 'Analizi Başlat',
    cancelAnalysis: 'İptal Et',
    running: 'Analiz çalıştırılıyor...',
    profileMobile: 'Mobil',
    profileDesktop: 'Masaüstü',
    profileBoth: 'Mobil ve Masaüstü',
    consentCheckbox: 'Hedef URL’nin Google PageSpeed Insights ve Lighthouse servislerine analiz amacıyla iletilmesini onaylıyorum.',
    querySensitiveWarning: 'Uyarı: URL adresinde sorgu parametreleri (?...) tespit edildi. Gizli veya oturum bilgisi içeren parametreler göndermeyiniz.',
    invalidUrlError: 'Lütfen geçerli, herkese açık bir HTTP/HTTPS URL adresi girin (localhost, IP veya intranet adresleri desteklenmez).',
    errorTitle: 'Analiz Tamamlanamadı',
    retry: 'Yeniden Dene',
    dismiss: 'Kapat',
    statusSuccess: 'Başarılı',
    statusError: 'Hata Oluştu',
    statusCancelled: 'İptal Edildi',
    analysisStatusLabel: 'Analiz durumu',
    statusIdle: 'Analiz başlatılmadı. Hedefi ve profili seçip Analizi Başlat düğmesini kullanın.',
    statusConsentRequired: 'Analizi başlatmak için URL’nin Google’a gönderilmesine onay verin.',
    statusPartial: 'Kısmi sonuç: bazı ölçümler başarısız, eksik veya karşılaştırılamaz.',
    statusNoData: 'Başarılı ölçüm verisi yok. Skor veya bulgu sonucu üretilmedi.',
    latestRunNoData: 'Son ölçüm turunda başarılı analiz verisi yok. Bu tur için bulgu sonucu üretilmedi.',
    statusSaving: 'Ölçüm tamamlandı; geçmiş kaydediliyor…',
    cancellationNotice: 'Bekleyen analiz iptal edildi. Gecikmiş yanıtlar bu analize eklenmeyecek.',
    quotaRetryNotice: 'Otomatik yeniden deneme yapılmadı. Biraz bekledikten sonra Yeniden Dene düğmesini kullanabilirsiniz.',
    previousBatchStale: '(Önceki / Eski Analiz Sonucu)',
    previousBatchTargetChanged: 'Hedef URL veya profil değiştirildi. Gösterilen sonuç önceki analize aittir.',
    runCountLabel: 'Tekrar Sayısı',
    runCountSingle: '1 Tur (Hızlı)',
    runCountTriple: '3 Tur (Medyan / Dengeli)',
    disclosureSingleProfile: '1 profil için en fazla 1 Google PageSpeed isteği yapılır. Onay verilmeden ağ isteği yapılmaz.',
    disclosureSingleBoth: '2 profil için en fazla 2 Google PageSpeed isteği yapılır. Onay verilmeden ağ isteği yapılmaz.',
    disclosureTripleSingleProfile: '3 tur tekrarında tek profil için en fazla 3 Google PageSpeed isteği yapılır. Onay verilmeden ağ isteği yapılmaz.',
    disclosureTripleBothProfiles: '3 tur tekrarında mobil ve masaüstü için toplamda en fazla 6 Google PageSpeed isteği yapılır. Onay verilmeden ağ isteği yapılmaz.',
    repetitionSummaryTitle: 'Çoklu Ölçüm Özeti (Medyan)',
    repetitionProgress: (completed: number, requested: number) => `Tamamlanan: ${completed} / ${requested} tur`,
    repetitionStopCompleted: 'Tüm turlar tamamlandı',
    repetitionStopRateLimited: 'Kota sınırına (HTTP 429) ulaşıldığı için durduruldu',
    repetitionStopCancelled: 'Kullanıcı tarafından iptal edildi',
    repetitionStatusAvailable: 'Medyan Verisi Mevcut',
    repetitionStatusPartial: 'Kısmi Veri (Uyarılar Mevcut)',
    repetitionStatusWithheld: 'Veri Güvenilir Değil (Durduruldu / Sahte 0 Yok)',
    repetitionStatusUnavailable: 'Ölçüm Verisi Yok',
    repetitionFieldNotice: 'Not: CrUX saha verileri turlar arasında toplanmaz; her turun kendi ham saha verisi ayrı tutulur.',
    medianScoresTitle: 'Medyan Laboratuvar Skorları',
    medianMetricsTitle: 'Medyan Temel Metrikler',
    sampleCountLabel: (count: number, eligible: number) => `Örnek: ${count}/${eligible}`,
    withheldNoFakeZero: 'Koşul uyuşmazlığı veya hata nedeniyle medyan hesaplanmadı (sahte sıfır puan verilmez)',
    latestRunNotice: 'Son Ham Tur Sonuçları (Aşağıda)',
    warn_incomplete_runs: 'İstenen tur sayısından daha az tur tamamlandı.',
    warn_failed_runs: 'Bazı turlarda ölçüm hatası meydana geldi.',
    warn_no_successful_runs: 'Hiçbir turda başarılı ölçüm elde edilemedi.',
    warn_lab_warnings: 'Lighthouse laboratuvar ölçümlerinde uyarılar raporlandı.',
    warn_profile_mismatch: 'Farklı turlar arasında profil veya cihaz uyuşmazlığı tespit edildi.',
    warn_missing_samples: 'Bazı metrikler için yeterli geçerli örnek bulunamadı.',
    engineDetails: 'Motor & Koşullar',
    engineVersionUnavailable: 'Motor sürümü bilinmiyor / erişilemez',
    analyzedAtLabel: 'Ölçüm Zamanı',
    measurementContextLabel: 'Ölçüm Ortamı',
    throttlingLabel: 'Ağ/İşlemci Kısıtlama',
    benchmarkIndexLabel: 'Kıyaslama İndeksi',
    labSectionTitle: 'Lighthouse Laboratuvar Ölçümleri',
    labSubtitle: 'İzole ve bağımsız ölçüm ortamı (Remote runner)',
    metricLcp: 'Largest Contentful Paint (LCP)',
    metricCls: 'Cumulative Layout Shift (CLS)',
    metricFcp: 'First Contentful Paint (FCP)',
    metricSi: 'Speed Index (SI)',
    metricTbt: 'Total Blocking Time (TBT)',
    tbtNote: 'Laboratuvar ortamında TBT ölçülür; etkileşim (INP) gerçek kullanıcı verisindedir.',
    fieldSectionTitle: 'Chrome UX Report (CrUX) Saha Verisi',
    fieldSubtitle: 'Son 28 günlük p75 kullanıcı deneyimi',
    fieldScopeUrl: 'Sayfa Düzeyi (URL)',
    fieldScopeOrigin: 'Alan Adı Düzeyi (Origin)',
    fieldUnavailable: 'Saha verisi mevcut değil (yetersiz trafik)',
    fieldPartial: 'Kısmi saha verisi',
    fieldAvailable: 'Saha verisi mevcut',
    fieldPeriodUnknown: 'Veri dönemi bilinmiyor / raporda sağlanmadı',
    fieldPeriod: (start, end) => `Dönem: ${start} – ${end}`,
    fieldReasonLabel: 'Durum Nedeni',
    fieldFormFactorLabel: 'Cihaz Tipi',
    fieldIdentifierLabel: 'Hedef Tanımlayıcı',
    auditsTitle: 'Denetimler ve Bulgular',
    filterAll: 'Tümü',
    filterPassed: 'Başarılı',
    filterFailed: 'İyileştirme Gereken',
    filterInformative: 'Bilgilendirici',
    filterManual: 'Manuel İnceleme',
    categoryAll: 'Tüm Kategoriler',
    categorySeo: 'SEO',
    categoryA11y: 'Erişilebilirlik',
    categoryPerf: 'Performans',
    severityAll: 'Tüm Önem Dereceleri',
    severityHigh: 'Yüksek Önem',
    severityMedium: 'Orta Önem',
    severityLow: 'Düşük Önem',
    severityInfo: 'Bilgilendirme',
    auditStatusPass: 'Başarılı',
    auditStatusFail: 'Başarısız',
    auditStatusManual: 'Manuel Kontrol',
    auditStatusInfo: 'Bilgi',
    noAuditsFound: 'Seçili filtrelere uygun denetim bulunamadı.',
    affectedElements: (count) => `${count} etkilenen öğe`,
    automatedNotice: 'Otomatik kontroller tam uyumluluk garantisi vermez; insan denetimi gereklidir.',
    geoTitle: 'GEO (Generative Engine Optimization) Hazırlık Sinyalleri',
    geoBetaBadge: 'Deneysel Beta',
    geoDisclaimer: 'GEO sinyalleri yapay zekâ motorlarına teknik içerik sunumuna hazırlık düzeyini gösterir; herhangi bir sıralama, görünürlük veya dizin garantisi vermez. Sayısal puan üretilmez.',
    geoCriteriaId: 'Kriter',
    geoMode: 'Yöntem',
    geoStatus: 'Durum',
    geoEvidence: 'İlişkili Kanıtlar',
    geoRecommendation: 'Öneri',
    geoStatusPass: 'Hazır / Başarılı',
    geoStatusFail: 'Eksik / Başarısız',
    geoStatusUnknown: 'Bilinmiyor / Veri Yok',
    geoStatusManual: 'Manuel İnceleme Gerekiyor',
    reportsTitle: 'Dışa Aktarma ve Geçmiş Analizler',
    downloadHtml: 'HTML Raporu İndir',
    downloadJson: 'JSON Dışa Aktar',
    printPdf: 'Yazdır / PDF Kaydet',
    attachScreenshot: 'Görünüm Ekran Görüntüsünü Rapora Ekle',
    removeScreenshot: 'Ekran Görüntüsünü Kaldır',
    capturingScreenshot: 'Ekran görüntüsü alınıyor...',
    captureScreenshotError: 'Ekran görüntüsü alınamadı veya izin verilmedi.',
    screenshotDisclosure: 'Görüntü site içeriği veya kişisel veri içerebilir; Google’a veya yerel geçmişe kaydedilmez/iletilmez. Mevcut önizleme adresi analiz hedefinden veya yönlendirmelerden farklı olabilir (laboratuvar ölçümü değil, yerel görsel referanstır).',
    screenshotAttachedBadge: 'Ekran Görüntüsü Eklendi',
    screenshotMetaText: (name, width, height) => `${name} · ${width} × ${height} CSS px`,
    noActiveReport: 'Henüz tamamlanmış bir analiz bulunmuyor. Yeni bir analiz başlatın veya geçmişten bir kayıt yükleyin.',
    activeBatchInfo: (date, url) => `Aktif Rapor: ${url} (${new Date(date).toLocaleString('tr-TR')})`,
    popupBlockedNotice: 'Tarayıcı yazdırma penceresinin açılmasını engelledi. Lütfen pop-up engelleyicisini kapatıp tekrar deneyin.',
    exportErrorNotice: 'Rapor dışa aktarılırken bir hata oluştu.',
    historyTitle: 'Yerel Analiz Geçmişi (En Fazla 20 Kayıt)',
    historyEmpty: 'Kayıtlı analiz geçmişi bulunmuyor.',
    loadEntry: 'Görüntüle',
    deleteEntry: 'Sil',
    clearHistory: 'Tüm Geçmişi Temizle',
    clearHistoryConfirmTitle: 'Geçmişi Temizle',
    clearHistoryConfirmBody: 'Yerel analiz geçmişindeki tüm kayıtlar kalıcı olarak silinecektir. Devam etmek istiyor musunuz?',
    confirmClear: 'Evet, Temizle',
    cancelClear: 'Vazgeç',
    compareTitle: 'İki Analizi Karşılaştır (Önceki vs Sonraki)',
    compareSelectBefore: 'Önceki Analiz (Referans):',
    compareSelectAfter: 'Sonraki Analiz (Yeni):',
    compareAction: 'Karşılaştır',
    warn_different_target: 'Kayıtlar farklı hedef URL veya yönlendirme adreslerine ait.',
    warn_different_profile: 'Kayıtlar farklı cihaz profillerine (mobil/masaüstü) ait.',
    warn_different_engine: 'Farklı Lighthouse motoru veya tarayıcı user-agent sürümüyle ölçülmüş.',
    warn_different_conditions: 'Ölçüm ortamı, ağ kısıtlaması veya emülasyon parametreleri farklı.',
    warn_redacted_target: 'Kayıtlardan en az biri gizlilik nedeniyle sorgu/içerik sansürü içermektedir.',
    warn_unknown_conditions: 'Ölçüm koşulları veya motor sürümü eksik olduğu için kesin eşleşme doğrulanamıyor.',
    metricBefore: 'Önceki',
    metricAfter: 'Sonraki',
    metricDelta: 'Fark',
    scoreBetter: 'İyileşti',
    scoreWorse: 'Kötüleşti',
    scoreSame: 'Değişmedi',
    err_INVALID_TARGET: 'Geçersiz hedef URL. Herkese açık bir HTTP/HTTPS adresi girin.',
    err_RATE_LIMITED: 'Google PageSpeed API istek sınırı aşıldı (Rate limit). Lütfen biraz bekleyin.',
    err_SERVICE_ERROR: 'Google analiz servisi geçici olarak yanıt veremiyor (5xx).',
    err_NETWORK_ERROR: 'Ağ bağlantısı kurulamadı veya istek engellendi.',
    err_TIMEOUT: 'Analiz zaman aşımına uğradı.',
    err_CANCELLED: 'Analiz kullanıcı tarafından iptal edildi.',
    err_INVALID_RESPONSE: 'Analiz servisinden gelen yanıt okunamadı veya çok büyük.',
    err_MEASUREMENT_FAILED: 'Ölçüm tamamlanamadı.',
    err_STORAGE_UNAVAILABLE: 'Yerel depolama alanına erişilemiyor.',
    err_HISTORY_LOAD_FAILED: 'Analiz geçmişi yüklenirken hata oluştu.',
    err_HISTORY_SAVE_FAILED: 'Analiz geçmişe kaydedilemedi.',
    err_HISTORY_DELETE_FAILED: 'Kayıt geçmişten silinemedi.',
    err_HISTORY_CLEAR_FAILED: 'Geçmiş temizlenirken hata oluştu.',
    err_UNKNOWN: 'Bilinmeyen bir hata oluştu.',
  },
  en: {
    title: 'Page Analysis & Reports',
    tabPerformance: 'Local Performance',
    tabSeo: 'SEO & Accessibility',
    tabGeo: 'GEO Signals (Beta)',
    tabReports: 'Reports & History',
    urlPlaceholder: 'https://example.com (Public URL)',
    runAnalysis: 'Run Analysis',
    cancelAnalysis: 'Cancel',
    running: 'Analyzing page...',
    profileMobile: 'Mobile',
    profileDesktop: 'Desktop',
    profileBoth: 'Mobile & Desktop',
    consentCheckbox: 'I agree to submit the target URL to Google PageSpeed Insights and Lighthouse for external performance analysis.',
    querySensitiveWarning: 'Warning: URL contains query parameters (?...) which might disclose sensitive or session tokens. Avoid sensitive targets.',
    invalidUrlError: 'Please enter a valid, publicly reachable HTTP/HTTPS URL (localhost, IP addresses, and private intranets are not supported).',
    errorTitle: 'Analysis Failed',
    retry: 'Retry',
    dismiss: 'Dismiss',
    statusSuccess: 'Success',
    statusError: 'Error',
    statusCancelled: 'Cancelled',
    analysisStatusLabel: 'Analysis status',
    statusIdle: 'No analysis started. Select a target and profile, then use Run Analysis.',
    statusConsentRequired: 'Allow sending the URL to Google before starting analysis.',
    statusPartial: 'Partial result: some measurements failed, are incomplete or cannot be compared.',
    statusNoData: 'No successful measurement data. No score or findings result was produced.',
    latestRunNoData: 'The latest measurement round has no successful analysis data. No findings result was produced for this round.',
    statusSaving: 'Measurement complete; saving history…',
    cancellationNotice: 'The pending analysis was cancelled. Late responses will not be added to this analysis.',
    quotaRetryNotice: 'No automatic retry was made. Wait a moment before using Retry.',
    previousBatchStale: '(Previous / Stale Run Result)',
    previousBatchTargetChanged: 'Target URL or profile changed. Displayed result belongs to the earlier analysis.',
    runCountLabel: 'Run Count',
    runCountSingle: '1 Run (Fast)',
    runCountTriple: '3 Runs (Median / Robust)',
    disclosureSingleProfile: 'Up to 1 Google PageSpeed request for single profile. No network request without consent.',
    disclosureSingleBoth: 'Up to 2 Google PageSpeed requests for both profiles. No network request without consent.',
    disclosureTripleSingleProfile: 'Up to 3 Google PageSpeed requests across 3 runs for single profile. No network request without consent.',
    disclosureTripleBothProfiles: 'Up to 6 Google PageSpeed requests across 3 runs for both profiles. No network request without consent.',
    repetitionSummaryTitle: 'Multi-Run Repetition Summary (Median)',
    repetitionProgress: (completed: number, requested: number) => `Completed: ${completed} / ${requested} runs`,
    repetitionStopCompleted: 'All runs completed',
    repetitionStopRateLimited: 'Stopped early due to rate limit (HTTP 429)',
    repetitionStopCancelled: 'Cancelled by user',
    repetitionStatusAvailable: 'Median Data Available',
    repetitionStatusPartial: 'Partial Data (Warnings Present)',
    repetitionStatusWithheld: 'Data Inconsistent (Withheld / No Fake Zeroes)',
    repetitionStatusUnavailable: 'No Measurement Data',
    repetitionFieldNotice: 'Note: CrUX field datasets are not aggregated across runs; raw field datasets remain per-run.',
    medianScoresTitle: 'Median Laboratory Scores',
    medianMetricsTitle: 'Median Core Metrics',
    sampleCountLabel: (count: number, eligible: number) => `Samples: ${count}/${eligible}`,
    withheldNoFakeZero: 'Median withheld due to condition mismatch or error (no fake zero score given)',
    latestRunNotice: 'Latest Raw Run Results (Below)',
    warn_incomplete_runs: 'Fewer runs completed than requested.',
    warn_failed_runs: 'Some runs encountered errors.',
    warn_no_successful_runs: 'No runs completed successfully.',
    warn_lab_warnings: 'Lighthouse reported warnings in lab measurements.',
    warn_profile_mismatch: 'Profile or form factor mismatch observed across runs.',
    warn_missing_samples: 'Some metrics had missing samples in eligible runs.',
    engineDetails: 'Engine & Conditions',
    engineVersionUnavailable: 'Engine version unknown / unavailable',
    analyzedAtLabel: 'Analyzed At',
    measurementContextLabel: 'Context',
    throttlingLabel: 'Throttling',
    benchmarkIndexLabel: 'Benchmark Index',
    labSectionTitle: 'Lighthouse Laboratory Metrics',
    labSubtitle: 'Isolated measurement environment (Remote runner)',
    metricLcp: 'Largest Contentful Paint (LCP)',
    metricCls: 'Cumulative Layout Shift (CLS)',
    metricFcp: 'First Contentful Paint (FCP)',
    metricSi: 'Speed Index (SI)',
    metricTbt: 'Total Blocking Time (TBT)',
    tbtNote: 'Lab runs measure TBT; interactive latency (INP) requires real-user field data.',
    fieldSectionTitle: 'Chrome UX Report (CrUX) Field Data',
    fieldSubtitle: 'Previous 28-day p75 real user experiences',
    fieldScopeUrl: 'Page Level (URL)',
    fieldScopeOrigin: 'Domain Level (Origin)',
    fieldUnavailable: 'Field data unavailable (insufficient traffic)',
    fieldPartial: 'Partial field data',
    fieldAvailable: 'Field data available',
    fieldPeriodUnknown: 'Data collection period unknown / not provided',
    fieldPeriod: (start, end) => `Period: ${start} – ${end}`,
    fieldReasonLabel: 'Reason',
    fieldFormFactorLabel: 'Form Factor',
    fieldIdentifierLabel: 'Target Identifier',
    auditsTitle: 'Audits & Findings',
    filterAll: 'All',
    filterPassed: 'Passed',
    filterFailed: 'Needs Improvement',
    filterInformative: 'Informative',
    filterManual: 'Manual Check',
    categoryAll: 'All Categories',
    categorySeo: 'SEO',
    categoryA11y: 'Accessibility',
    categoryPerf: 'Performance',
    severityAll: 'All Severities',
    severityHigh: 'High Importance',
    severityMedium: 'Medium Importance',
    severityLow: 'Low Importance',
    severityInfo: 'Informational',
    auditStatusPass: 'Passed',
    auditStatusFail: 'Failed',
    auditStatusManual: 'Manual Check',
    auditStatusInfo: 'Info',
    noAuditsFound: 'No audits match the selected filters.',
    affectedElements: (count) => `${count} affected items`,
    automatedNotice: 'Automated audits do not guarantee full compliance; human testing is required.',
    geoTitle: 'GEO (Generative Engine Optimization) Readiness Signals',
    geoBetaBadge: 'Experimental Beta',
    geoDisclaimer: 'GEO readiness signals evaluate technical content structuring for AI engines; they do not guarantee AI rankings, visibility, or indexation. No synthetic numeric score is generated.',
    geoCriteriaId: 'Criterion',
    geoMode: 'Mode',
    geoStatus: 'Status',
    geoEvidence: 'Evidence Audits',
    geoRecommendation: 'Recommendation',
    geoStatusPass: 'Ready / Passed',
    geoStatusFail: 'Missing / Failed',
    geoStatusUnknown: 'Unknown / No Data',
    geoStatusManual: 'Manual Review Required',
    reportsTitle: 'Report Exports & History',
    downloadHtml: 'Download HTML Report',
    downloadJson: 'Export JSON',
    printPdf: 'Print / Save PDF',
    attachScreenshot: 'Attach Viewport Screenshot to Report',
    removeScreenshot: 'Remove Screenshot',
    capturingScreenshot: 'Capturing viewport screenshot...',
    captureScreenshotError: 'Failed to capture viewport screenshot or permission denied.',
    screenshotDisclosure: 'Image may contain page content or personal data; it is not sent to Google or saved in history. The active preview URL may differ from the analysis target or redirect destinations (local visual reference, not a lab measurement).',
    screenshotAttachedBadge: 'Screenshot Attached',
    screenshotMetaText: (name, width, height) => `${name} · ${width} × ${height} CSS px`,
    noActiveReport: 'No active analysis report found. Run an analysis or load an entry from history.',
    activeBatchInfo: (date, url) => `Active Report: ${url} (${new Date(date).toLocaleString('en-US')})`,
    popupBlockedNotice: 'Browser blocked popup window for print dialog. Please allow popups and try again.',
    exportErrorNotice: 'An error occurred while generating or downloading report.',
    historyTitle: 'Local Analysis History (Max 20 entries)',
    historyEmpty: 'No analysis history entries stored.',
    loadEntry: 'View',
    deleteEntry: 'Delete',
    clearHistory: 'Clear History',
    clearHistoryConfirmTitle: 'Clear Analysis History',
    clearHistoryConfirmBody: 'All local analysis history records will be permanently deleted. Are you sure you want to continue?',
    confirmClear: 'Yes, Clear All',
    cancelClear: 'Cancel',
    compareTitle: 'Compare Two Runs (Before vs After)',
    compareSelectBefore: 'Before (Baseline):',
    compareSelectAfter: 'After (New):',
    compareAction: 'Compare',
    warn_different_target: 'Runs target different URLs or redirect targets.',
    warn_different_profile: 'Runs evaluated different device profiles (mobile vs desktop).',
    warn_different_engine: 'Runs evaluated with different Lighthouse or browser engine versions.',
    warn_different_conditions: 'Measurement conditions, throttling, or screen emulation differ.',
    warn_redacted_target: 'One or both runs contain privacy URL or content redactions.',
    warn_unknown_conditions: 'Incomplete engine or throttling conditions prevent exact verification.',
    metricBefore: 'Before',
    metricAfter: 'After',
    metricDelta: 'Delta',
    scoreBetter: 'Improved',
    scoreWorse: 'Degraded',
    scoreSame: 'Unchanged',
    err_INVALID_TARGET: 'Invalid target URL. Please provide a public HTTP/HTTPS URL.',
    err_RATE_LIMITED: 'Google PageSpeed rate limit exceeded. Please wait a moment and try again.',
    err_SERVICE_ERROR: 'Google PageSpeed service encountered an error (5xx).',
    err_NETWORK_ERROR: 'Network request failed or was blocked.',
    err_TIMEOUT: 'Analysis timed out.',
    err_CANCELLED: 'Analysis was cancelled.',
    err_INVALID_RESPONSE: 'Invalid or oversized response received from the analysis service.',
    err_MEASUREMENT_FAILED: 'Measurement failed to complete.',
    err_STORAGE_UNAVAILABLE: 'Local storage is unavailable.',
    err_HISTORY_LOAD_FAILED: 'Failed to load analysis history.',
    err_HISTORY_SAVE_FAILED: 'Failed to save analysis result to history.',
    err_HISTORY_DELETE_FAILED: 'Failed to delete entry from history.',
    err_HISTORY_CLEAR_FAILED: 'Failed to clear analysis history.',
    err_UNKNOWN: 'An unexpected error occurred.',
  },
  no: {
    title: 'Sideanalyse & Rapporter',
    tabPerformance: 'Lokal ytelse',
    tabSeo: 'SEO & Tilgjengelighet',
    tabGeo: 'GEO-signaler (Beta)',
    tabReports: 'Rapporter & Historikk',
    urlPlaceholder: 'https://example.com (Offentlig nettadresse)',
    runAnalysis: 'Start analyse',
    cancelAnalysis: 'Avbryt',
    running: 'Analyserer side...',
    profileMobile: 'Mobil',
    profileDesktop: 'Skrivebord',
    profileBoth: 'Mobil & Skrivebord',
    consentCheckbox: 'Jeg samtykker i at nettadressen sendes til Google PageSpeed Insights og Lighthouse for ekstern analyse.',
    querySensitiveWarning: 'Advarsel: Adressen inneholder søkeparametere (?...) som kan avsløre sensitiv informasjon.',
    invalidUrlError: 'Vennligst oppgi en gyldig, offentlig tilgjengelig HTTP/HTTPS-adresse (lokale adresser støttes ikke).',
    errorTitle: 'Analyse mislyktes',
    retry: 'Prøv igjen',
    dismiss: 'Lukk',
    statusSuccess: 'Vellykket',
    statusError: 'Feil',
    statusCancelled: 'Avbrutt',
    analysisStatusLabel: 'Analysestatus',
    statusIdle: 'Ingen analyse startet. Velg mål og profil, og bruk Kjør analyse.',
    statusConsentRequired: 'Godkjenn sending av URL-en til Google før du starter analysen.',
    statusPartial: 'Delvis resultat: noen målinger mislyktes, er ufullstendige eller kan ikke sammenlignes.',
    statusNoData: 'Ingen vellykkede måledata. Ingen poengsum eller funnresultat ble produsert.',
    latestRunNoData: 'Den siste målerunden har ingen vellykkede analysedata. Ingen funnresultat ble produsert for denne runden.',
    statusSaving: 'Måling fullført; lagrer historikk…',
    cancellationNotice: 'Den ventende analysen ble avbrutt. Forsinkede svar legges ikke til denne analysen.',
    quotaRetryNotice: 'Ingen automatisk gjentakelse ble gjort. Vent litt før du bruker Prøv igjen.',
    previousBatchStale: '(Tidligere / Gammelt analyseresultat)',
    previousBatchTargetChanged: 'Måladresse eller profil ble endret. Vist resultat tilhører den tidligere analysen.',
    runCountLabel: 'Antall kjøringer',
    runCountSingle: '1 Kjøring (Rask)',
    runCountTriple: '3 Kjøringer (Median / Robust)',
    disclosureSingleProfile: 'Opptil 1 Google PageSpeed-forespørsel for én profil. Ingen nettverksforespørsel uten samtykke.',
    disclosureSingleBoth: 'Opptil 2 Google PageSpeed-forespørsler for begge profiler. Ingen nettverksforespørsel uten samtykke.',
    disclosureTripleSingleProfile: 'Opptil 3 Google PageSpeed-forespørsler over 3 kjøringer for én profil. Ingen nettverksforespørsel uten samtykke.',
    disclosureTripleBothProfiles: 'Opptil 6 Google PageSpeed-forespørsler over 3 kjøringer for begge profiler. Ingen nettverksforespørsel uten samtykke.',
    repetitionSummaryTitle: 'Gjentatt målesammendrag (Median)',
    repetitionProgress: (completed: number, requested: number) => `Fullført: ${completed} / ${requested} kjøringer`,
    repetitionStopCompleted: 'Alle kjøringer fullført',
    repetitionStopRateLimited: 'Stoppet tidlig på grunn av hastighetsgrense (HTTP 429)',
    repetitionStopCancelled: 'Avbrutt av brukeren',
    repetitionStatusAvailable: 'Mediandata tilgjengelig',
    repetitionStatusPartial: 'Delvise data (Advarsler til stede)',
    repetitionStatusWithheld: 'Data uoverensstemmende (Holdt tilbake / Ingen falske nuller)',
    repetitionStatusUnavailable: 'Ingen måledata',
    repetitionFieldNotice: 'Merk: CrUX-feltdata aggregeres ikke over kjøringer; rå feltdata forblir per kjøring.',
    medianScoresTitle: 'Median laboratorieskårer',
    medianMetricsTitle: 'Median kjernemetrikker',
    sampleCountLabel: (count: number, eligible: number) => `Utvalg: ${count}/${eligible}`,
    withheldNoFakeZero: 'Median holdt tilbake på grunn av avvik eller feil (ingen falske nullskårer)',
    latestRunNotice: 'Siste rå kjøringsresultater (Nedenfor)',
    warn_incomplete_runs: 'Færre kjøringer fullført enn forespurt.',
    warn_failed_runs: 'Noen kjøringer støtte på feil.',
    warn_no_successful_runs: 'Ingen kjøringer fullført uten feil.',
    warn_lab_warnings: 'Lighthouse rapporterte advarsler i labmålinger.',
    warn_profile_mismatch: 'Profil- eller formfaktormisforhold observert over kjøringer.',
    warn_missing_samples: 'Noen metrikker manglet utvalg i kvalifiserte kjøringer.',
    engineDetails: 'Motor & Forhold',
    engineVersionUnavailable: 'Motorversjon ukjent / utilgjengelig',
    analyzedAtLabel: 'Analysetidspunkt',
    measurementContextLabel: 'Målekontekst',
    throttlingLabel: 'Hastighetsbegrensning',
    benchmarkIndexLabel: 'Referanseindeks',
    labSectionTitle: 'Lighthouse Laboratoriemålinger',
    labSubtitle: 'Isolert målemiljø (Remote runner)',
    metricLcp: 'Largest Contentful Paint (LCP)',
    metricCls: 'Cumulative Layout Shift (CLS)',
    metricFcp: 'First Contentful Paint (FCP)',
    metricSi: 'Speed Index (SI)',
    metricTbt: 'Total Blocking Time (TBT)',
    tbtNote: 'Laboratoriemålinger måler TBT; interaktivitet (INP) krever reelle brukerdata.',
    fieldSectionTitle: 'Chrome UX Report (CrUX) Feltdata',
    fieldSubtitle: 'Siste 28 dagers p75-opplevelser fra virkelige brukere',
    fieldScopeUrl: 'Sidenavn (URL)',
    fieldScopeOrigin: 'Domenenivå (Origin)',
    fieldUnavailable: 'Feltdata utilgjengelig (utilstrekkelig trafikk)',
    fieldPartial: 'Delvise feltdata',
    fieldAvailable: 'Feltdata tilgjengelig',
    fieldPeriodUnknown: 'Datainnsamlingsperiode ukjent / ikke oppgitt',
    fieldPeriod: (start, end) => `Periode: ${start} – ${end}`,
    fieldReasonLabel: 'Årsak',
    fieldFormFactorLabel: 'Enhetstype',
    fieldIdentifierLabel: 'Målidentifikator',
    auditsTitle: 'Revisjoner og funn',
    filterAll: 'Alle',
    filterPassed: 'Bestått',
    filterFailed: 'Trenger forbedring',
    filterInformative: 'Informativ',
    filterManual: 'Manuell sjekk',
    categoryAll: 'Alle kategorier',
    categorySeo: 'SEO',
    categoryA11y: 'Tilgjengelighet',
    categoryPerf: 'Ytelse',
    severityAll: 'Alle alvorlighetsgrader',
    severityHigh: 'Høy viktighet',
    severityMedium: 'Middels viktighet',
    severityLow: 'Lav viktighet',
    severityInfo: 'Informasjon',
    auditStatusPass: 'Bestått',
    auditStatusFail: 'Mislyktes',
    auditStatusManual: 'Manuell sjekk',
    auditStatusInfo: 'Info',
    noAuditsFound: 'Ingen revisjoner matcher valgte filtre.',
    affectedElements: (count) => `${count} berørte elementer`,
    automatedNotice: 'Automatiske tester garanterer ikke full overholdelse; menneskelig testing er nødvendig.',
    geoTitle: 'GEO (Generative Engine Optimization) Klargjøringssignaler',
    geoBetaBadge: 'Eksperimentell Beta',
    geoDisclaimer: 'GEO-signaler vurderer teknisk struktur for AI-motorer; de gir ingen garanti for AI-synlighet eller rangering. Ingen oppdiktet poengsum genereres.',
    geoCriteriaId: 'Kriterium',
    geoMode: 'Modus',
    geoStatus: 'Status',
    geoEvidence: 'Bevis',
    geoRecommendation: 'Anbefaling',
    geoStatusPass: 'Klar / Bestått',
    geoStatusFail: 'Mangler / Mislyktes',
    geoStatusUnknown: 'Ukjent / Ingen data',
    geoStatusManual: 'Manuell gjennomgang påkrevd',
    reportsTitle: 'Eksporter og Historikk',
    downloadHtml: 'Last ned HTML-rapport',
    downloadJson: 'Eksporter JSON',
    printPdf: 'Skriv ut / Lagre PDF',
    attachScreenshot: 'Legg til skjermbilde av visningsområdet i rapporten',
    removeScreenshot: 'Fjern skjermbilde',
    capturingScreenshot: 'Tar skjermbilde av visningsområdet...',
    captureScreenshotError: 'Kunne ikke ta skjermbilde av visningsområdet eller tillatelse ble avvist.',
    screenshotDisclosure: 'Bildet kan inneholde sideinnhold eller personopplysninger; det sendes ikke til Google eller lagres i historikken. Aktiv forhåndsvisningsadresse kan avvike fra analysemålet eller viderekoblinger (lokal visuell referanse, ikke laboratoriemåling).',
    screenshotAttachedBadge: 'Skjermbilde vedlagt',
    screenshotMetaText: (name, width, height) => `${name} · ${width} × ${height} CSS px`,
    noActiveReport: 'Ingen aktiv analyserapport funnet. Start en analyse eller last inn fra historikk.',
    activeBatchInfo: (date, url) => `Aktiv rapport: ${url} (${new Date(date).toLocaleString('nb-NO')})`,
    popupBlockedNotice: 'Nettleseren blokkerte popup-vinduet for utskrift. Tillat popup og prøv igjen.',
    exportErrorNotice: 'Det oppstod en feil under eksport av rapporten.',
    historyTitle: 'Lokal analysehistorikk (Maks 20 oppføringer)',
    historyEmpty: 'Ingen analysehistorikk lagret.',
    loadEntry: 'Vis',
    deleteEntry: 'Slett',
    clearHistory: 'Tøm historikk',
    clearHistoryConfirmTitle: 'Tøm analysehistorikk',
    clearHistoryConfirmBody: 'Alle lagrede analyser i historikken vil bli slettet permanent. Er du sikker?',
    confirmClear: 'Ja, tøm alt',
    cancelClear: 'Avbryt',
    compareTitle: 'Sammenlign to kjøringer (Før vs Etter)',
    compareSelectBefore: 'Før (Referanse):',
    compareSelectAfter: 'Etter (Ny):',
    compareAction: 'Sammenlign',
    warn_different_target: 'Kjøringene gjelder ulike nettadresser.',
    warn_different_profile: 'Kjøringene brukte ulike enhetsprofiler (mobil vs skrivebord).',
    warn_different_engine: 'Kjøringene brukte ulike versjoner av Lighthouse eller nettlesermotoren.',
    warn_different_conditions: 'Måleforhold, båndbredde eller emuleringsinnstillinger varierer.',
    warn_redacted_target: 'Én eller begge kjøringer inneholder sladdet innhold eller URL.',
    warn_unknown_conditions: 'Ufullstendige målebetingelser forhindrer nøyaktig verifisering.',
    metricBefore: 'Før',
    metricAfter: 'Etter',
    metricDelta: 'Endring',
    scoreBetter: 'Forbedret',
    scoreWorse: 'Forverret',
    scoreSame: 'Uendret',
    err_INVALID_TARGET: 'Ugyldig nettadresse. Vennligst oppgi en offentlig HTTP/HTTPS-adresse.',
    err_RATE_LIMITED: 'Google PageSpeed hastighetsgrense overskredet. Vennligst vent litt.',
    err_SERVICE_ERROR: 'Google PageSpeed-tjenesten opplevde en feil (5xx).',
    err_NETWORK_ERROR: 'Nettverksforespørsel mislyktes.',
    err_TIMEOUT: 'Analysen ble tidsavbrutt.',
    err_CANCELLED: 'Analysen ble avbrutt av brukeren.',
    err_INVALID_RESPONSE: 'Ugyldig eller for stor respons fra analysetjenesten.',
    err_MEASUREMENT_FAILED: 'Målingen kunne ikke fullføres.',
    err_STORAGE_UNAVAILABLE: 'Lokal lagring er utilgjengelig.',
    err_HISTORY_LOAD_FAILED: 'Kunne ikke laste inn analysehistorikk.',
    err_HISTORY_SAVE_FAILED: 'Kunne ikke lagre analyseresultat til historikken.',
    err_HISTORY_DELETE_FAILED: 'Kunne ikke slette oppføring fra historikken.',
    err_HISTORY_CLEAR_FAILED: 'Kunne ikke tømme analysehistorikk.',
    err_UNKNOWN: 'En uventet feil oppstod.',
  },
};

export function getAnalysisTranslation(lang: 'tr' | 'en' | 'no'): AnalysisTranslations {
  return ANALYSIS_I18N[lang] || ANALYSIS_I18N.tr;
}

/** Human-readable recommendation mapping for core geo recommendation codes */
export const GEO_RECOMMENDATIONS_MAP: Record<string, Record<'tr' | 'en' | 'no', string>> = {
  REVIEW_CRAWL_ACCESS: {
    tr: 'Arama ve AI tarayıcılarının robots.txt / meta tagler ile engellenmediğini doğrulayın.',
    en: 'Ensure search and AI crawlers are not blocked via robots.txt or meta tags.',
    no: 'Sørg for at søke- og AI-roboter ikke er blokkert via robots.txt eller metakoder.',
  },
  REVIEW_PAGE_METADATA: {
    tr: 'Başlık (document title) ve meta açıklama etiketlerinin eksiksiz ve bilgilendirici olduğunu kontrol edin.',
    en: 'Verify title and meta description tags are informative and present.',
    no: 'Kontroller at tittel og metabeskrivelse er informative og til stede.',
  },
  REVIEW_CANONICAL: {
    tr: 'Standart (canonical) bağlantı etiketinin sayfanın doğru adresine işaret ettiğini denetleyin.',
    en: 'Check that the canonical link properly points to the authoritative page URL.',
    no: 'Kontroller at den kanoniske lenken peker riktig til autoritativ side-URL.',
  },
  REVIEW_SEMANTIC_STRUCTURE: {
    tr: 'Başlık hiyerarşisi (h1-h6) ve ana içerik landmark alanlarının semantik sırasını inceleyin.',
    en: 'Inspect heading order and main semantic content landmarks.',
    no: 'Inspiser overskriftsrekkefølge og semantiske landemerker for hovedinnhold.',
  },
  REVIEW_DESCRIPTIVE_LINKS: {
    tr: 'Bağlantı metinlerinin genel ifadeler ("tıklayın") yerine açıklayıcı metin içerdiğini kontrol edin.',
    en: 'Ensure link anchors use descriptive text rather than generic labels.',
    no: 'Sørg for at lenketekster bruker beskrivende tekst i stedet for generiske etiketter.',
  },
  MANUALLY_REVIEW_AUTHOR_AND_SOURCES: {
    tr: 'İçerik yazarının, uzmanlığının ve birincil kaynak referanslarının açıkça belirtildiğini doğrulayın.',
    en: 'Verify author credentials and clear citations of primary sources.',
    no: 'Verifiser forfatteropplysninger og tydelige siteringer av primærkilder.',
  },
  MANUALLY_REVIEW_PUBLICATION_AND_UPDATE_DATES: {
    tr: 'Yayın ve son güncelleme tarihlerinin hem kullanıcıya hem yapılandırılmış veriye sunulduğunu kontrol edin.',
    en: 'Check that publication and last modified dates are visible and structured.',
    no: 'Sjekk at publiserings- og oppdateringsdatoer er synlige og strukturerte.',
  },
  MANUALLY_REVIEW_STRUCTURED_DATA_VALIDITY: {
    tr: 'Schema.org JSON-LD / Microdata yapılandırılmış veri işaretlemelerinin doğruluğunu test edin.',
    en: 'Test the validity of Schema.org JSON-LD or Microdata markup.',
    no: 'Test gyldigheten til Schema.org JSON-LD eller Microdata-oppmerking.',
  },
  MANUALLY_REVIEW_CRAWLER_POLICY: {
    tr: 'Yapay zekâ veri toplama botlarına (GPTBot, ClaudeBot vb.) yönelik site erişim politikanızı gözden geçirin.',
    en: 'Review website access policy for AI data collectors (GPTBot, ClaudeBot, etc.).',
    no: 'Gjennomgå retningslinjer for nettstedstilgang for AI-roboter (GPTBot, ClaudeBot osv.).',
  },
};

export function getGeoRecommendationText(code: string, lang: 'tr' | 'en' | 'no'): string {
  const item = GEO_RECOMMENDATIONS_MAP[code];
  if (item && item[lang]) return item[lang];
  return code;
}

export const LOCAL_ANALYSIS_COPY = {
  tr: {
    navigation: 'Sayfa yükleme gözlemleri', ttfb: 'Sunucu yanıtı (TTFB)', domReady: 'DOM hazır', loaded: 'Yükleme tamamlandı', resources: 'Gözlenen kaynak isteği', tab: 'Yerel Performans', disclosure: 'Analiz bu bilgisayardaki hazır ViewGrid görünümünde çalışır. URL ve sayfa içeriği analiz servisine gönderilmez; ek kurulum gerekmez. Önce hedef sayfayı çalışma alanında açın.',
    snapshot: 'Yerel sayfa gözlemi', scope: 'Gerçek görünüm ve tarama kapsamı', legacy: 'Geçmiş harici servis raporu',
    metricsNote: 'Bu bir Lighthouse testi değildir. Skor üretilmez; yalnız tarayıcının sunduğu gözlemler gösterilir. Yeniden yükleme, CPU/ağ yavaşlatma ve gerçek telefon emülasyonu yapılmaz.',
    fieldNote: 'CrUX gerçek kullanıcı verisi yerel taramada alınmaz. Google veya başka bir analiz API’sine bağlanılmaz.',
    coverage: 'İncelenen DOM öğesi', duration: 'Tarama süresi', truncated: 'Kapsam sınırlı; tüm sayfa incelenmedi.',
    checks: 'Kontrol sonuçları', passed: 'geçti', failed: 'bulgu', review: 'manuel / bilinmiyor',
    err_PREVIEW_NOT_READY: 'Hedef görünüm henüz hazır değil. Sayfanın yüklenmesini bekleyin; görünüm açılmıyorsa site erişimini kontrol edin.',
    err_PROFILE_UNAVAILABLE: 'Seçilen profil için açık görünüm yok. Çalışma alanına uygun mobil veya masaüstü görünümü ekleyin.',
    err_TARGET_MISMATCH: 'Analiz adresi açık görünümle eşleşmiyor. Hedef adresi önce çalışma alanında açın; yönlendirme varsa son adresi kullanın.',
    err_PERMISSION_REQUIRED: 'Yerel analiz için site erişimi gerekiyor. Çalışma alanındaki site erişim iznini verin.',
    invalidUrl: 'Geçerli bir HTTP/HTTPS adresi girin. localhost ve yerel ağ desteklenir; kullanıcı adı veya parola içeren adresler kabul edilmez.',
  },
  en: {
    navigation: 'Page load observations', ttfb: 'Server response (TTFB)', domReady: 'DOM ready', loaded: 'Load completed', resources: 'Observed resource requests', tab: 'Local Performance', disclosure: 'Analysis runs in a ready ViewGrid preview on this computer. No URL or page content is sent to an audit service; no extra installation is required. Open the target in the workspace first.',
    snapshot: 'Local page observation', scope: 'Actual preview and scan coverage', legacy: 'Historical external-service report',
    metricsNote: 'This is not a Lighthouse test. No scores are generated; only browser-provided observations are shown. No reload, CPU/network throttling or real phone emulation is performed.',
    fieldNote: 'CrUX real-user data is not retrieved in local scans. No Google or other audit API is contacted.',
    coverage: 'Inspected DOM elements', duration: 'Scan duration', truncated: 'Limited coverage; not all page content was inspected.',
    checks: 'Check results', passed: 'passed', failed: 'findings', review: 'manual / unknown',
    err_PREVIEW_NOT_READY: 'The target preview is not ready. Wait for it to load; if it cannot open, check site access.',
    err_PROFILE_UNAVAILABLE: 'There is no open preview for the selected profile. Add a matching mobile or desktop preview to the workspace.',
    err_TARGET_MISMATCH: 'The analysis URL does not match an open preview. Open the target in the workspace first; use the final URL after a redirect.',
    err_PERMISSION_REQUIRED: 'Site access is required for local analysis. Grant site access in the workspace.',
    invalidUrl: 'Enter a valid HTTP/HTTPS URL. localhost and LAN are supported; URLs containing a username or password are not accepted.',
  },
  no: {
    navigation: 'Observasjoner av sidelasting', ttfb: 'Serversvar (TTFB)', domReady: 'DOM klar', loaded: 'Lasting fullført', resources: 'Observerte ressursforespørsler', tab: 'Lokal ytelse', disclosure: 'Analysen kjøres i en klar ViewGrid-forhåndsvisning på denne maskinen. Ingen nettadresse eller sideinnhold sendes til en analysetjeneste; ekstra installasjon er ikke nødvendig. Åpne målsiden i arbeidsområdet først.',
    snapshot: 'Lokal sideobservasjon', scope: 'Faktisk forhåndsvisning og analysedekning', legacy: 'Historisk rapport fra ekstern tjeneste',
    metricsNote: 'Dette er ikke en Lighthouse-test. Ingen poengsum beregnes; bare nettleserens observasjoner vises. Ingen ny lasting, CPU-/nettverksbegrensning eller ekte telefonemulering utføres.',
    fieldNote: 'CrUX-data fra virkelige brukere hentes ikke i lokale analyser. Ingen Google- eller annen analyse-API kontaktes.',
    coverage: 'Undersøkte DOM-elementer', duration: 'Analysetid', truncated: 'Begrenset dekning; ikke alt sideinnhold ble undersøkt.',
    checks: 'Kontrollresultater', passed: 'bestått', failed: 'funn', review: 'manuelt / ukjent',
    err_PREVIEW_NOT_READY: 'Forhåndsvisningen er ikke klar. Vent til siden er lastet; kontroller nettstedstilgangen hvis den ikke åpnes.',
    err_PROFILE_UNAVAILABLE: 'Ingen åpen forhåndsvisning for valgt profil. Legg til en passende mobil- eller skrivebordsvisning.',
    err_TARGET_MISMATCH: 'Analyseadressen samsvarer ikke med en åpen forhåndsvisning. Åpne målsiden i arbeidsområdet først; bruk sluttadressen etter omdirigering.',
    err_PERMISSION_REQUIRED: 'Nettstedstilgang er nødvendig for lokal analyse. Gi tilgang i arbeidsområdet.',
    invalidUrl: 'Skriv inn en gyldig HTTP/HTTPS-adresse. localhost og lokalnett støttes; adresser med brukernavn eller passord godtas ikke.',
  },
} as const;
