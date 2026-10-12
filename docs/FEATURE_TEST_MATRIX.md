# ViewGrid Özellik Test Matrisi

## ICON-GRID-POLISH kabul kayıtları — 2026-10-12

Bu paket önceki1.0.4–1.6geniş kapsamın tamamlanması veya mağaza yayını değildir. Sürüm package1.0.3; mağaza sürümü doğrulanmadı. Kanıt kökü `test-results/development/`.

| Senaryo / ortam, ön koşul ve adım | Beklenen | Gerçekleşen / durum | Kanıt / yeniden test |
| --- | --- | --- | --- |
| Chromium gerçek extension, izole headed X11,1280×800/1920×1080; tabsAPI80/100/125zoom + Fit | Tüm grid kartları ve iframe uniform ölçeği canvas içinde; CSS393×852/820×1180/1280×800/1920×1080 aynı; wrapper scrollbarsız | Geçti:6ölçüm; actualzoom/physicalworkspace/innerCSS/dpr/iframegeometry ayrı kayıt. Native screenshot boyutu assert | icon-final-headed.log; icon-grid/chromium-evidence.json ve chromium-*.png |
| Fit ikon/metin aralığı ve kontrol assetleri | İkon/metin üst üste gelmez; yerel SVG yüklenir, pageerror/extensionassetfail yok | Geçti:6zoomda en az6CSSpx ikon/metin aralığı; sıfır pageerror/assetfail | icon-final-headed.log; icon-grid/toolbar-closeup.png |
| Chromium dar gerçek pencere | Kontroller reflow, yerleşimler korunur; tooltip hover/focus | Geçti;640nativewindow/actualCSS boyutu kaydedildi,Grid/Row/Column/Freeform CSS boyutları aynı | icon-grid/narrow.png; chromium-evidence.json |
| Chromium ilgili korumaE2E | CRUD/rotasyon/custom/fav/group/kalıcılık,sidebar,compare/Figma,issues,nav,scroll/click,screenshot ve kontrollü analiz korunur | Geçti:32test;1isteğe bağlı canlıworker-warmedCastPost çalıştırılmadı. İlk emoji seçici başarısızlıkları semantik rol/ad seçimine çevrildi; compare tooltip duplicate ve yeni menü erişimleri yeniden test edildi | icon-accepted-e2e.log; eski icon-regression.log/icon-final-current-e2e.log başarısız denemeleri korunur |
| Firefox gerçek ZIP addon,headed izole X11,baseline ve aynı6browserzoom | Click-sync/protectednav/reload/normal-tab/SW/version/onay; SVG,tooltip,4layout ve CSS ölçüsü korunur | Geçti.80%Firefox innerHeight852→853 fiziksel yuvarlama gözlendi; iframeclientCSS852 kesin kaldı. Motor inner ölçüsü1px tolerans gerekçesi ve gerçek değer ayrıca kaydedildi | icon-firefox-final.log; icon-firefox-final/headed-zoom-evidence.json,grid-*.png,toolbar-tooltip.png |
| Firefox kontrollü analiz ayrı legacyBiDi runner | PSI200lab/field ayrı,429tekistek/puanyok,dışistek0 | Geçti; canlıservis kanıtı değildir,headedzoom testinden ayrı headless transport regresyonudur | icon-firefox-bidi.log ve icon-firefox-bidi/evidence.json |
| Fit state ve tooltip karma pointer/keyboard | Fit model/persist'i değiştirmez; manual/loadSaved clear;hoverable/focus/Escape/blur | Geçti:3fitstate,5fitgeometry,3tooltip regresyonu; yeni daha küçük Fit floor ayrı, manualfloor0.1 değişmedi | icon-final-unit.log; tests/unit/workspace-fit-state.test.ts,tooltip.test.ts,workspace-fit.test.ts |
| Genel kalite kapısı | Lint,typecheck,unit,iki build,web-ext | Geçti:269unit/31dosya;lint/typecheck ve buildler geçti;web-ext0error/0notice/3bilinen uyarı | icon-final-lint.log,icon-final-typecheck.log,icon-final-unit.log,icon-final-build.log,icon-final-webext.log |
| Bağımsız inceleme | Yeni kritik regresyon yok; tüm ikon migration eksikleri giderilir | Geçti kaynak incelemesi; reviewer tarayıcı testi çalıştırmadı. Tooltip/Benchmark/glyph bulguları düzeltildi ve kalıcı testle doğrulandı | /root/icon_grid_review; TEAM_HANDOFF |
| Antigravity mevcut Flash | İzinli boundedtask ve bağımsız browserQA | Engelli:600s timeout ve headless RunCommand izin reddi; bu pakette yeni Antigravity browserQA yapılmadı. Lider alternatif gerçek browser testleri yukarıda | .ai-team/tasks/ui-icons-polish ve ui-icons-migrate yerel logları; icon-team-run.log,icon-migrate-run.log |
| Yeni iki referans görsel, canlıGoogle, gerçekcihaz/Safari/AT tamdenetimi | Görülmeyen/testedilmeyen kanıt başarı sayılmaz | İki yeni ek erişilemedi, önceki ekler kullanıldı. CanlıGoogle önceki429/anahtar engeli; gerçekcihaz/Safari/AT tamdenetimi çalıştırılmadı. Serbestkonumdaki tüm olası FreeformFit kombinasyonları bu grid kapısında doğrulanmadı | Önceki hazırlık/devir; ANALYSIS_SETUP.md |

Yeni ikonfontu/asset indirme yok, package/lockfile değişmedi. Lisans THIRD_PARTY_NOTICES.md ile iki dağıtıma kopyalandı. Güncel JS gzip farkı4285byte bütün polish paketidir, yalnız ikon boyutu iddiası değildir. Dar900altında sidebar'ın mevcut overlay davranışı korunur; ana canvas etkileşimi öncesi gerçek Collapse kontrolü ile drawer kapanır ve hitTarget doğrulanır. İlk dar testler açık drawer arkasını tıklamaya çalıştığı için başarısızdı; DOMRect/elementFromPoint/ancestor-scroll ve bağımsız review ile neden kanıtlandı, forceclick/işlev kapatma yapılmadı. modeGroup satır sarması dar rail kullanımını destekler.

## UI-REFINE kabul kayıtları — 2026-10-12

Bu tablo yalnız güncel arayüz paketinin kapısıdır; önceki geniş1.0.4–1.6kapsamının tamamlandığı anlamına gelmez. Loglar `test-results/development/` altındadır.

| Senaryo / ortam ve adımlar | Beklenen | Gerçekleşen / durum | Kanıt |
| --- | --- | --- | --- |
| Chromium gerçek eklenti, tam mevcut E2E | CRUD/custom/group/recent/fav, compare/Figma/issues/capture/sync/nav, analizmock ve kalıcılık |32geçti;1isteğe bağlı canlıworker-warmedCastPost çalıştırılmadı | ui-refine-regression-complete.log |
| Grid display / CSS / kayıt |1920fit, x/yuniformscale, manual50%storagewrite+reload | Dengeli yükseklik (<1.4oran), CSSölçüsü aynı, manualzoom korunur: Geçti | extension.spec.ts balancedgrid; workspace-fit4unit ve724/725boundary |
| Kısa pencere panel/klavye |640×480GEOscrollIntoView+click+Escape; collapsefocus+Enter,Devicesexpand | Tüm eylemler kaydırmayla erişilebilir: Geçti | extension.spec.ts shortwindows; ui-refine-regression-complete.log |
| Chromium1280/1920/320, lightTR | Fit/menü/minimize/restore/sidebarkalıcılığı/tema/dil | Geçti; screenshotlar görsel incelendi | ui-refine-evidence/chromium-1280.png, chromium-1920.png, chromium-320.png, light-tr-analysis.png |
| Firefox gerçek geçici addon | YerelZIP;4frame/click/protectednav/reload/normal-tab/SW/version/onay | Geçti; click-sync eski kurulum sorunu tekrar teşhis edilmedi | ui-refine-firefox-retest.log |
| Firefox UI gerçek CSS1280×800/1920×1080 | windowchrome offset düzeltilir;Row/Grid/Fit,logicaldimsassert,screenshot | Geçti; ilk anlık geometri assertion başarısızdı, aynı kesin ölçü için explicitsettlewait ile geçti; ürün beklentisi gevşetilmedi | ui-refine-firefox-complete.log (başarısız), ui-refine-firefox-retest.log; ui-refine-firefox-retest/workspace-1280.png ve workspace-1920.png |
| Firefox kontrollü analiz | NativeBiDi200/429,denyproxy | Geçti; labTBT210/sahap75INP180 ayrı,429tekistek/puanyok; canlıGoogle değil | ui-refine-firefox-analysis.log |
| Görünür Chromium canlıCastPost | Ayrıprofile,headlessfalse,sandboxaçık,4iframeh1,Row/Grid/Fit,32px ölçüm | Geçti; site içeriğine müdahale edilmedi | ui-refine-visible-complete.log; ui-refine-evidence/castpost-chromium.png |
| Unit/lint/type/build/web-ext | Mevcut tümunit ve iki target |262unit/29dosya,lint/typecheck/buildgeçti;web-ext0error/0notice/3bilinenuyarı | ui-refine-unit-complete.log, ui-refine-lint-delivery.log, ui-refine-types-verified.log, ui-refine-build-verified.log, ui-refine-web-ext-complete.log |
| Canlı PSI/CrUX ve gerçek cihaz | BuUIpaketinde servis geliştirme/test yok | Engelli: öncekiGoogle429/CrUXanahtar yok; gerçekcihaz/Safari/screenreader tamdenetim çalıştırılmadı | ANALYSIS_SETUP.md; önceki kanıtlar korunur |

Bağımsız kaynak incelemesi `/root/independent_review`: container cascade/content-box ve pre-render starterfit düzeltildi; silme/schemeisimleri ve tek sidebar scroll doğrulandı, somut açık blocker yok. Reviewer tarayıcı çalıştırmadı; tarayıcı sonuçları liderin ayrı kanıtlarıdır.

Bu matris, kod tabanındaki mevcut özellikler ve testler (`tests/unit/*`, `tests/e2e/*`) ile `test-results/tool-readiness/READINESS.md` hazırlık sonuçları temel alınarak hazırlanmıştır.

> **Kural:** Unit, gerçek eklenti ve manuel sonuçlar ayrı değerlendirilir. Bir screenshot, capture özelliğinin test edildiği anlamına gelmez. Başlangıç lint/typecheck ve 107 unit geçti; eski yerel kanıtlar Playwright çıktı temizliğiyle kayboldu. Son yeniden koşu: `test-results/development/unit-current.log`, `current-typecheck.log`. Aşağıdaki uçtan uca senaryolar ayrıca doğrulanmadıkça çalıştırılmadı kalır. Tarihsel hazırlık satırları güncel retest kaydıyla birlikte okunur.

## 2026-10-11 yeniden test kayıtları

2026-10-12 görünür yeniden test: Chromium headed, sandbox açık, doğru dist/chromium ve ayrı profil ile canlı CastPost dört iframe içeriği/h1, Row/Grid/Fit, toolbar/canvas32px kontrolleri geçti. Kanıt `visible-live-verified.log`, `visible-workspace-qa.png`; ilgili framing/normal-tab/shell3E2E ve preview6unit geçti. Bu Brave'e Firefox paketi yükleme senaryosunun desteklendiği veya Brave/Firefox headed test edildiği anlamına gelmez. Kullanıcı yanlış paket yüklediğini doğruladı; ilk hata screenshot'u doğru paket regresyonu olarak sayılmaz.

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
