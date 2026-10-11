# ViewGrid Özellik Test Matrisi

Bu matris, kod tabanındaki mevcut özellikler ve testler (`tests/unit/*`, `tests/e2e/*`) ile `test-results/tool-readiness/READINESS.md` hazırlık sonuçları temel alınarak hazırlanmıştır.

> **Kural:** Unit, gerçek eklenti ve manuel sonuçlar ayrı değerlendirilir. Bir screenshot, capture özelliğinin test edildiği anlamına gelmez. Başlangıç lint/typecheck ve 107 unit geçti; eski yerel kanıtlar Playwright çıktı temizliğiyle kayboldu. Son yeniden koşu: `test-results/development/unit-current.log`, `current-typecheck.log`. Aşağıdaki uçtan uca senaryolar ayrıca doğrulanmadıkça çalıştırılmadı kalır. Tarihsel hazırlık satırları güncel retest kaydıyla birlikte okunur.

## 2026-10-11 yeniden test kayıtları

En güncel ek kayıtlar (alttaki tarihsel “henüz” ifadelerinin ilgili alt senaryosunu günceller; kapsamın tamamına başarı atamaz):

| Özellik / ortam ve adımlar | Beklenen | Gerçekleşen / durum | Kanıt / yeniden test |
| --- | --- | --- | --- |
| Firefox gerçek addon, BiDi controlled200/429 | TBT ve sahaINP ayrı;429puan değil; dış Google isteği yok | Geçti;210ms/180ms, tek429isteği, proxy girişimi0 | firefox-analysis-bidi.log; firefox-analysis-bidi/evidence.json; canlı servis değil |
| Chromium üç tur/iptal/kota/PNG rapor | Medyan2000ms,3örnek;429veiptal sonrası durma;393×852gerçekPNG yalnız raporda |4test geçti; Google fail-closed guard ve history izolasyonu | repeated-screenshot-e2e-retest.log |
| Sidebar reorder/hide/show/named workspace | ID/sıra/reload ve yeniden görünürlük korunur | Geçti | preservation-groups-workspace.log |
| Cihaz çoklu grup/recent/duplicate | Grup reload kalıcı, iki tekrar yeniID | Geçti | preservation-groups-workspace.log |
| Figma PNG/opacity/difference/remove | Katman ayarı uygulanır, siteh1 değişmez | Geçti; yanlışdosya türü ayrı çalıştırılmadı | figma-overlay-e2e-retest.log |
| Bütün unit ve storage race |260test, concurrent save/clear sırası, redaksiyon | Geçti;29dosya | unit-report-final.log; analysis-history.test.ts |
| Son kaynak typecheck/lint/build | Hata yok, iki platform build | Geçti | typecheck-latest.log; lint-latest.log; build-latest.log |
| Entegre Chromium güncel build |30senaryo, ayrı mock/live durum |29geçti;1isteğe bağlı canlı CastPost çalıştırılmadı | chromium-latest.log |
| Final checkpoint Chromium |31senaryo, footer/layout dahil |30geçti;1isteğe bağlı canlı CastPost çalıştırılmadı | chromium-final-checkpoint.log |
| Firefox güncel baseline+BiDi | Gerçek addon8baseline ve ayrı kontrollü200/429 | Geçti; canlı Google değil | firefox-baseline-latest.log; firefox-bidi-latest.log |
| Layout/fit/align reload | Row/Column/Freeform/Grid CSS ölçüsü sabit; center/space-between kayıtlı | Geçti; ilk deneme debounce testyarışı, gerçek write assert ile yeniden geçti | layout-alignment.log; layout-alignment-retest.log |
| Dar ekran footer / shell |320×800footer≤72px;1280/1920 ve layout kalıcılığı | İki test geçti; ilk81pxcontentbox hatası border-box ile düzeltildi | footer-layout-retest.log; footer-layout-final.log; workspace-narrow.png |
| web-ext paket kontrolü | Firefox build hata yok | Geçti;0error/0notice,3uyarı ayrıca kayıtlı | web-ext-latest.log |

| Kayıt | Ortam / adımlar | Beklenen | Gerçekleşen / durum | Kanıt / hata ve retest |
| --- | --- | --- | --- | --- |
| M-08 Firefox click-sync | Firefox146, paket ZIP yerel GeckoDriver path; korumalı sayfa reload sonrası sayaç tıklama | Dört iframe sayacı tam1 | Geçti; ürün sync kodu değişmedi | `test-results/firefox-v104-final.log`; eski base64 kurulum yolu tekrar timeout, `firefox-v104-base64-after-fix.log`; `firefox-v104/DIAGNOSIS.md` |
| M-07/M-08 Chromium ilgili sync | Gerçek eklenti; smooth scroll/reload sonrası click/scroll | Döngüsüz aynı sonuç, mevcut zaman sınırı | Üç test geçti | `test-results/firefox-v104-chromium-sync.log` |
| M-18/M-19 Firefox framing/worker | Workspace protected preview, normal tab blocked, iframe SW kayıt denemesi | İzin sınırı korunur, preview worker reddedilir | Geçti | `test-results/firefox-v104-final.log`; `test-results/firefox-v104-final/success.png` |
| K-17 tercihler ve M-04 fit saf hesap | Eski/malformed kayıt, persist/hydrate; farklı canvas/grid/row/col | Veri korunur, CSS boyut değişmez, ölçek sınırlı | Altı unit geçti; tarayıcı fit henüz çalıştırılmadı | `test-results/development/preferences-fit.log` |
| UI-SHELL bağımsız kaynak inceleme | Tema/focus/keyboard/reflow/kalıcılık/dinamikCSS/fit | Yeni kabuk erişilebilir ve kurala uygun | Başarısız; düzeltme aktif, yeniden inceleme bekliyor | `/root/independent_review` bulguları `docs/TEAM_HANDOFF.md` |

---

## 1. Mevcut Özellikler Test Matrisi (v1.0.x)

Bu bölüm ilk hazırlık anının tarihsel durumunu korur; kaybolan hazırlık logları güncel kanıt sayılmaz. Güncel sonuçlar üstteki yeniden test kayıtları ve alttaki son kontrollü doğrulama tablosundadır. Tarihsel Firefox click başarısızlığı yerel ZIP kurulumuyla giderilmiştir; güncel bir ürün hatası değildir.

| No | Özellik / Alan | Test Senaryosu | Önkoşul | Adımlar | Beklenen Sonuç | Gerçekleşen Sonuç | Durum | Kanıt Dosyası / Test Kaynağı |
|---|---|---|---|---|---|---|---|---|
| M-01 | Viewport CRUD | Viewport ekleme, çoğaltma, gizleme ve limit kontrolü | Boş veya 4 cihazlı çalışma alanı | 1. `addDevice` ile cihaz ekle.<br>2. 16 limitini sına.<br>3. `duplicate` ve `toggleHidden` çağır. | 16'dan fazla eklenemez; çoğaltılan cihaz yeni ID alır; gizlenen görünmez olur. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/layout.test.ts`<br>`tests/unit/serialize.test.ts` |
| M-02 | Viewport Reorder | Sürükle-bırak ile kart yer değiştirme | En az 3 viewport aktif | 1. Kartı dizin 0'dan 2'ye taşı (`moveViewport`).<br>2. İskelet yerleşimi kontrol et. | Dizi elemanları doğru sıraya geçer, ID'ler korunur. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/layout.test.ts` |
| M-03 | Ölçü & Yönelim | Portre ve manzara eksen değişimi | 1 cihazlı görünüm | 1. `swapOrientation` veya `rotated` çağır.<br>2. `effectiveSize` ile boyutları doğrula. | Boyutlar en/boy takas edilir (`landscape` için min/max). | Hazırlık Chromium smoke'unda yön değişimi ve ölçü doğrulandı | Geçti | `test-results/tool-readiness/chromium-smoke.log`<br>`tests/unit/layout.test.ts` |
| M-04 | Zoom & Fit to Screen | Görsel zoom ölçekleme ve ekrana sığdırma | Çeşitli boyutlarda 4 cihaz | 1. Zoom değerini 0.05 ve 4.0 olarak ayarla.<br>2. `fitToScreen` fonksiyonunu çalıştır. | Zoom 0.1–3.0 arasına kırpılır (`clampZoom`); pencereye uygun zoom hesaplanır. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/layout.test.ts` |
| M-05 | Donanım Kasası | DeviceFrame SVG ve çerçeve render | Cihaz çerçeveleri açık | 1. iPhone, Android, Laptop profillerini render et.<br>2. Notches ve butonları doğrula. | Donanım çerçeveleri profil türüne göre doğru ölçekle çizilir. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `src/ui/workspace/DeviceFrame.tsx` |
| M-06 | Yerleşim Modları | Grid, Row, Col ve Free-form tuval | Çoklu viewport | 1. Layout modlarını değiştir.<br>2. Free modda snap ve hizalama kılavuzlarını hesapla. | Izgara sütunları doğru hesaplanır; snap kılavuzları 10px eşikle hizalar. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/layout.test.ts` |
| M-07 | Scroll Senkronizasyonu | Oran bazlı kaydırma eşitleme | 2 farklı yükseklikte viewport | 1. Viewport A'da kaydırma yap.<br>2. `scrollRatios` hesapla.<br>3. Viewport B'ye uygula. | Sayfa yükseklik farkına rağmen oransal olarak aynı yere kaydırılır. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/sync.test.ts`<br>`tests/unit/agent-integration.test.ts` |
| M-08 | Tıklama Senkronizasyonu | CSS seçici ve normalize koordinat eşitleme | 2 viewport açık | 1. Viewport A'da bir butona tıkla.<br>2. Olayı diğer viewport'a ilet. | Viewport B'deki aynı seçiciye veya koordinata tıklama tetiklenir. | Hazırlık Firefox Selenium testinde TimeoutException; Chromium click testi hazırlıkta çalıştırılmadı | Başarısız | `test-results/tool-readiness/firefox-regression.log`<br>`tests/e2e/firefox_extension.py:112` |
| M-09 | Form ve Girdi Eşitleme | Input ve Checkbox senkronizasyonu | Form içeren sayfa | 1. Metin kutusuna yazı yaz.<br>2. Checkbox işaretle. | Diğer pencerelerde input prototip setter'ı tetiklenerek değerler eşitlenir. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/sync.test.ts` |
| M-10 | Senkronizasyon Döngü Koruması | Echo fırtınalarını ve geri beslemeyi önleme | İki yönlü senkronizasyon | 1. Viewport A'dan olay üret.<br>2. B'ye uygula.<br>3. B'nin geri A'ya iletmesini sına. | `LoopGuard` monotonic seq ve epoch fencing ile olayı düşürür, döngü oluşmaz. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/sync.test.ts` |
| M-11 | Dual Split Karşılaştırma | İkili bölücü perde ile karşılaştırma | İki cihaz seçili | 1. Compare modalı aç.<br>2. Split bölücüyü %50'den %70'e çek. | Her iki görünüm tek sahnede belirtilen oranda kesilerek gösterilir. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/compare-split-layout.test.ts` |
| M-12 | Figma Mockup Katmanı | Figma görseli ve karışım modu | Figma görseli yüklenmiş | 1. PNG görsel yükle.<br>2. Opacity %50 yap.<br>3. Karışım modunu difference seç. | Tasarım iframe üzerine saydam olarak bindirilir. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `src/ui/workspace/CompareModal.tsx` |
| M-13 | Yatay Taşma Taraması | Sayfa taşması ve sorun tespiti | Yatay taşması olan sayfa | 1. Sayfa metriklerini topla.<br>2. `detectHorizontalOverflow` çalıştır. | `scrollWidth > innerWidth` durumunda kritik hata ve taşan eleman listesi üretilir. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/issues.test.ts`<br>`tests/unit/metrics.test.ts` |
| M-14 | Kırpılan Metin Taraması | `overflow:hidden` metin kesilmeleri | Dar kapsayıcıda uzun metin | 1. Metin metriklerini topla.<br>2. `detectTextClipping` çalıştır. | Görünmeyen kırpılmış metin majör hata olarak listelenir. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/issues.test.ts` |
| M-15 | Dokunma Hedefi & Aralık | Küçük butonlar ve aralık çakışması | 24px ve 44px altı butonlar | 1. Buton boyutlarını topla.<br>2. `detectSmallTapTargets` ve 24px daire çakışmasını sına. | SC 2.5.8 24px çakışmaları majör, ergonomik 44px önerileri minör işaretlenir. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/target-spacing.test.ts` |
| M-16 | Tekil Viewport Ekran Görüntüsü | Görünür alan kırpma (Kısayol: `c`) | Aktif tek sekme | 1. Ürünün capture eylemini çağır.<br>2. İndirme, çözünürlük ve içerik kontrol et. | Belirlenen viewport alanından PNG üretilir. | Hazırlık screenshot'u otomasyon kanıtıdır; ürün capture eylemi hazırlıkta çalıştırılmadı | Çalıştırılmadı | `tests/unit/capture.test.ts`, `tests/e2e/extension.spec.ts` |
| M-17 | Parçalı Tam Sayfa Yakalama | Ekrandan büyük viewport capture | 1920x3000 boyutlu sayfa | 1. `captureTiles` hesapla.<br>2. Karoları sırayla yakala ve canvas'ta birleştir. | Ekran boyutunu aşan viewport'lar parçalı alınıp 32MP altında birleştirilir. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/capture-tiles.test.ts` |
| M-18 | Framing & Başlık Temizleme | XFO ve CSP frame-ancestors kaldırma | Koruma başlığı olan site | 1. Korunan fixture'ı aç.<br>2. Workspace ve normal tab sonuçlarını karşılaştır. | Workspace preview yüklenir; normal tab korumaları sürer. | Firefox protected preview geçti; normal-tab adımı click-sync sonrası kaldığı için çalıştırılmadı. Chromium hazırlık smoke'u protected fixture değildi | Çalıştırılmadı | `test-results/tool-readiness/firefox-regression.log`, `tests/e2e/extension.spec.ts` |
| M-19 | Service Worker İzolasyonu | İframe'lerin SW önbelleğine takılmaması | SW kullanan PWA sitesi | 1. `browsingData.removeServiceWorkers` çalıştır.<br>2. `world-inject.ts` ile kaydı engelle. | Service Worker iframe isteklerine müdahale edemez. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/security-and-lifecycle.test.ts` |
| M-20 | Çoklu Dil (i18n) | tr, en, no dilleri arasında geçiş | Çalışma alanı açık | 1. Dili Türkçe, İngilizce ve Norveççe olarak seç.<br>2. Çeviri sözlüklerini doğrula. | UI metinleri eksiksiz çevrilir; tarayıcı dili doğru algılanır. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/i18n.test.ts` |
| M-21 | Çalışma Alanı Depolama | Workspace save/load ve persist | Özel cihazlar ve viewportlar | 1. Modeli `storage.local`'e yaz.<br>2. `hydrate` ile geri oku. | Bütün ayarlar ve özel cihazlar hatasız geri yüklenir. | Hazırlık kapsamında birim testi icra edilmedi | Çalıştırılmadı | `tests/unit/serialize.test.ts` |

---

## Ek koruma senaryoları

Her kayıt yerel fixture + gerçek eklenti ortamında yürütülür; hata/kalıcılık ve ilişkili akış kontrolleri aynı ID altında kanıtlanır. Henüz çalıştırılmayan senaryolar başarı sayılmaz.

| ID / özellik | Önkoşul ve adımlar | Beklenen | Gerçekleşen / durum | Kaynak / kanıt |
| --- | --- | --- | --- | --- |
| K-01 silme/minimize/restore | 4 cihaz; minimize, restore, sil | Diğer cihazlar korunur | Çalıştırılmadı | store.toggleMinimized/removeViewport |
| K-02 focus/hidden geri açma | 4 cihaz; focus mode, hide/show | Gizli cihaz yeniden erişilebilir | Çalıştırılmadı | store.visibleViewports/toggleHidden |
| K-03 frame/theme/color/finish | Açık/koyu tema, frame toggle, kasa rengi; reload | Ayrı tercihler korunur; site içeriği yeniden yazılmaz | Çalıştırılmadı | store.toggleTheme/setColorScheme/setFrameFinish |
| K-04 URL/back/forward/reload | Yerel iki sayfa, SPA ve reload | URL/history doğru, sync açık/kapalı davranışı korunur | Çalıştırılmadı | App/agent, extension.spec.ts |
| K-05 hard reload/cache | Sayfada draft storage; bypass reload | Sayfa ve workspace storage korunur | Çalıştırılmadı | extension.spec.ts hard reload |
| K-06 Local/izin reddi | İzinli/izinsiz temiz profil | Açıklama ve yeniden izin akışı; boş/süreli yükleme durumu | Çalıştırılmadı | bridge.grantHostAccess, ViewportCard |
| K-07 klavye/menu/context | A/C/Shift+C/S/G/F/O/D/Escape; input focus; browser context menu | Kısayol input yazımına karışmaz, komutlar açılır | Çalıştırılmadı | App.onKey, background.setup |
| K-08 form/key/nav/reload kanalları | Kanal kapalı/açık; checkbox/select/text/link/key/reload | Yalnız açık kanal aktarılır; browser trusted olay iddiası yok | Çalıştırılmadı | agent/apply, core sync |
| K-09 curtain/side-by-side | 2 farklı cihaz; ratio ve mode seç | CSS mantıksal ölçü korunur | Çalıştırılmadı | CompareModal |
| K-10 Figma hata/opacity/blend | PNG/JPG/SVG, yanlış dosya, opacity/blend | Güvenli hata/kapama, site DOM korunur | Çalıştırılmadı | CompareModal |
| K-11 issues filtre/evidence/export | Tarama sonrası severity/rule/device/text, copy/JSON/HTML | Filtre ve atlanan cihazlar raporda doğru | Çalıştırılmadı | IssuesDrawer, extension.spec.ts |
| K-12 scan stale/timeout | Yavaş/boş cevap, ardışık tarama | Eski sonuç reddi ve kısmi kapsam açıklaması | Unit geçti; gerçek eklenti çalıştırılmadı | baseline-unit.log, scan-lifecycle.test.ts |
| K-13 workspace/all/compare capture | Her yakalama türünü indir | Dosya/content/boyut doğru, UI restore | Çalıştırılmadı | App capture, CompareModal |
| K-14 custom/presets/save/load | Özel cihaz, named workspace, preset; reload/load/delete | Bağımsız workspace ve tercihler korunur | Çalıştırılmadı | store.addCustom/saveAs/loadSaved |
| K-15 DPR/zoom ayrımı | Zoom değiştir; iframe innerWidth/height ve DPR oku | CSS viewport sabit; metadata gerçek cihaz emülasyonu değildir | Çalıştırılmadı | ViewportCard, layout |
| K-16 touch cursor | Telefon ve masaüstünde toggle/swipe | Yalnız destekli profil pointer görseli; scroll sync korunur | Çalıştırılmadı | DeviceFrame/agent |
| K-17 yeni cihaz tercihi geçişi | Eski kayıt hydrate; favorites/recent/group save+hydrate; malformed listeler | Eski URL/dil korunur; limitler uygulanır | 3 unit geçti; gerçek eklenti UI çalıştırılmadı | device-preferences-unit.log |

## 2. Planlanan Gelecek Sürümler Matrisi (v1.1 – v1.6)

### Son kontrollü doğrulama — 2026-10-11

| Özellik / senaryo | Ortam / adım | Beklenen / gerçekleşen | Durum | Kanıt / yeniden test |
| --- | --- | --- | --- | --- |
| Analiz girdi, timeout/retry/cancel/stale, field/lab, history, report | Yerel Vitest; Google yanıtları kontrollü mock | Başarısızlık puan olmaz; TBT/INP ayrıdır; güvenli export; 2048 URL korunur | Geçti | analysis-decision-regression.log: 68 test |
| Bütün mevcut unit regresyonları | Yerel Vitest, 25 dosya | Mevcut ve yeni beklenen assertionlar; 191 test geçti | Geçti | unit-integrated-current.log |
| Güncel unit regresyonu (rapor/medyan/screenshot dahil) | Yerel Vitest,29 dosya |258 assertion geçti; gerçek servis veya tüm UI kapsamı değildir | Geçti | unit-report-current.log |
| Cihaz kaynak durumu | Unit, descriptor-screen/legacy ayrımı | Genel kurum adı doğrulama sayılmaz; 8 test geçti | Geçti | device-catalog.test.ts; tam model kaynak kapısı açık |
| PSI canlı başarı | Anahtarsız example.com mobile, performance/seo/a11y | Gerçek ölçüm beklenirdi; HTTP429 döndü, ölçüm yok | Engelli | psi-keyless-current-status.txt / response.json |
| Ayrı CrUX canlı veri | API anahtarı yok | Çağrı yapılmadı, veri uydurulmadı | Engelli | ANALYSIS_SETUP.md |
| Yeni analiz consent/eskime/quota UI | Chromium gerçek eklenti, kontrollü route | Onaysız istek yok; TBT/INP ayrı; edit eski sonucu temizler; 429 puan değil | Geçti | analysis-device-ui-retest.log |
| Cihaz brand/yön/favori kalıcılığı | Chromium gerçek eklenti | Desktop geçişi Apple filtreyi sıfırlar;1920×1080 korunur; reload favori korunur | Geçti | analysis-device-ui-retest.log |
| Analiz history storage hatası | Kontrollü unit | Okuma hatasında write yok; write hatası güvenli kod | Geçti | analysis-storage.test.ts:2 test |
| Güncel build Firefox smoke | Gerçek geçici eklenti | Dört iframe/click/korumalı nav/reload/normal-tab/SW/version | Geçti | firefox-analysis.log; analiz UI farklı kapsam, test edilmedi |
| Entegre Chromium regresyonu | Gerçek eklenti, yerel fixture | 14 test geçti; isteğe bağlı canlı CastPost koşulu yok | Geçti / canlı senaryo çalıştırılmadı | chromium-analysis-full.log |
| Antigravity MCP etkileşimi | Ayrı izole normal fixture | Navigate/read/fill/click/DOM Applied: ViewGrid QA/screenshot | Geçti | agy-browser-qa.json, agy-mcp-controls.png; eklenti kanıtı değildir |
| Antigravity gerçek eklenti CLI | Ayrı geçici persistent-context | Cihaz ve kontrollü analiz 2 test geçti | Geçti | agy-extension-tests.log; MCP eklenti yükleme iddiası yok |
| Özel cihaz hata/başarı | Chromium gerçek eklenti | Boş ad/ölçü hatası görünür, defaults ile kaydetmez; valid540×720 açılır | Geçti | device-polish-e2e.log |
| Duplicate/remove/compare modları | Chromium gerçek eklenti | Orijinal ID'ler korunur; split/curtain/side-by-side canlı iframe açılır/kapanır | Geçti | chromium-preservation-extra.log; Figma/diff ayrı kalan kapsam |
| Kontrollü rapor dosyaları/görsel | HTML/JSON/PDF E2E;8 PDF sayfası Poppler render | Güvenli escape, mock uyarısı ilk sayfada, GEO manual ayrı, taşma/orphan yok | Geçti | report-polish-pagination.log; output/pdf/viewgrid-controlled-sample.* |
| Antigravity kontrollü analiz UI geniş kapsam | Chromium gerçek eklenti,5 kalıcı E2E | Both audit profilleri kaybolmaz; filtre/history/delete/Escape/export/comparison/TR-EN-NO/light korunur | Geçti | agy-analysis-e2e.log, agy-analysis-e2e.json; canlı servis değildir |
| Firefox analiz UI onay/URL sınırı | Gerçek Firefox eklenti; onay yokken disabled, public URL onayla enabled, private URL disabled | Yeni analiz isteği göndermeden kontroller doğrulandı | Geçti | firefox-analysis-consent.log ve analysis-consent-validation.png |
| Firefox kontrollü PSI yanıtı | GeckoDriver execute_script ile2 injection denemesi | İlk yöntem gerçek429 aldı; ikinci guard önceden durdu, mock uygulanamadı | Engelli | firefox-analysis-controlled.log / firefox-analysis-controlled-retest.log; baseline8 kontrole veya Chromium mock başarısına eşit değildir |
| Tekrarlı ölçüm UA doğruluğu | Kontrollü unit; null/empty/whitespace ve null-A-B sıraları | Eksik koşul withheld, farklı bilinen UA different-engine;36 test geçti | Geçti | analysis-repetition-review.log; UI entegrasyonu henüz doğrulanmadı |
| Açık/koyu token kontrastı |4 unit; normal ve primary-hover | Seçilen renk çiftlerinde ≥4.5:1 | Geçti | theme-contrast.test.ts; bütün UI erişilebilirlik denetimi değildir |
| Rapor screenshot güvenlik sınırı |4 unit; PNG/URL/metadata/size | Query redaksiyonu, HTML escape, harici/SVG/credential reddi,32MP sınırı | Geçti | report-screenshot-unit.log; gerçek capture/export UI henüz çalıştırılmadı |

Bu satırlardaki unit/mock başarıları canlı servis veya bütün UI/platform kapsamı yerine geçmez. Log yolları aksi belirtilmedikçe test-results/development altındadır.

Aşağıdaki kapsam 2026-10-11 kullanıcı görevinden gelir; tarihsel PRD yol haritası yeni kapsam değildir.

| Sürüm | Hedef Özellik / Modül | Planlanan Test Senaryosu | Önkoşul | Beklenen Sonuç | Durum |
|---|---|---|---|---|---|
| v1.1 | Shell/kartlar | 1280×800,1920×1080, dar ekran; sidebar collapse, menü klavyesi, tema/dil, eski handlerlar | BASE kapısı | Kontroller erişilebilir, viewport CSS boyutu zoom'dan bağımsız | Çalıştırılmadı |
| v1.2 | Cihaz seçici | Marka/model, çoklu seçim, duplicate, favorite/recent/custom/preset ve reload kalıcılığı | UI | Katalog CSS piksel ölçü ve kaynakları doğru; emülasyon iddiası yok | Çalıştırılmadı |
| v1.3 | Performance | Mobile/desktop/both; HTTP429/500/timeout/cancel/stale | PSI adapter | Metrik/koşul/engine var, hata sıfır puan değil, dış gönderim açıklaması var | Çalıştırılmadı |
| v1.4 | CrUX/SEO/a11y | URL/origin/dönem, eksik veri, filtre/manual/error audit | Analiz | Lab TBT saha INP'den ayrı, eksik puan uydurulmaz | Çalıştırılmadı |
| v1.5 | Raporlar | HTML/JSON/PDF aç/render, history/delete/limit, before-after/median ve koşul farkı | Analiz/field | Doğru metadata ve atlanan kontroller, okunaklı dosyalar | Çalıştırılmadı |
| v1.6 BETA | GEO | Crawl/semantic/source/date/schema; otomatik vs manuel | Rapor | Sürümlü kriter, passed/improve/manual durumları, görünürlük garantisi yok | Çalıştırılmadı |
