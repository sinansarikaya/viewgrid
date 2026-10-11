# ViewGrid Mevcut Özellik Envanteri (Kod Bazlı)

Bu belge, ViewGrid kod tabanının doğrudan incelenmesiyle (`codebase-memory-mcp` ve kaynak kod kanıtları) çıkarılan kesin özellik envanteridir. Eski tamamlanmamış kontrol listeleri kanıt kabul edilmemiştir; yalnızca kodda çalışan/tanımlı fonksiyon ve sınıflar listelenmiştir.

---

## 1. Viewport CRUD, Odaklama, Gizleme ve Sıralama

| Özellik | Açıklama | Kaynak Dosya & Fonksiyon / Sembol | Kanıt |
|---|---|---|---|
| Viewport Ekleme | Katalog cihazı veya özel cihaz ekleme; limit (16) ve uyarı (8) kontrolleri | `src/ui/workspace/store.ts` → `addDevice()`, `canAddViewports()` | `canAddViewports(model.viewports.length, 1)` ile limit kontrolü yapılıp yeni `ViewportState` oluşturuluyor. |
| Viewport Silme | Viewport ve ilişkili tespit edilmiş sorunları temizleme | `src/ui/workspace/store.ts` → `removeViewport()` | `model.viewports.filter(v => v.id !== id)` ve `issues.filter(i => i.viewportId !== id)`. |
| Çoğaltma (Duplicate) | Seçili viewport'un yeni tekil ID ile kopyasını yanına ekleme | `src/ui/workspace/store.ts` → `duplicate()`<br>`src/core/workspace/layout.ts` → `duplicateViewport()` | `duplicateViewport(v, uid('vp'))` ile kopyalanıp mevcut listenin hemen sonrasına ekleniyor. |
| Gizleme / Gösterme | Viewport'u tuvalde gizleme veya tekrar görünür kılma | `src/ui/workspace/store.ts` → `toggleHidden()`<br>`src/core/workspace/layout.ts` → `nextHidden()` | `hidden: !v.hidden` durumu güncellenir. |
| Küçültme (Minimize) | Viewport kartını başlık şeridine katlama/açma | `src/ui/workspace/store.ts` → `toggleMinimized()`<br>`src/core/workspace/layout.ts` → `nextMinimized()` | `minimized: !v.minimized` durumu güncellenir. |
| Odak Modu (Focus) | Tek bir viewport'a odaklanma ve diğerlerini geçici gizleme | `src/ui/workspace/store.ts` → `focus()`, `toggleFocusMode()`, `visibleViewports()` | `focusMode` açıkken yalnızca seçili `focusedId` viewport'u tuvalde render edilir. |
| Yeniden Sıralama (Reorder) | Sürükle-bırak veya ID bazlı viewport sıra değişimi | `src/ui/workspace/store.ts` → `reorder()`, `reorderById()`<br>`src/core/workspace/layout.ts` → `moveViewport()` | `moveViewport(list, from, to)` ile dizi elemanı splice edilip yeni pozisyona taşınır. |

---

## 2. Boyut, DPR, Yön, Zoom ve Cihaz Kasası (Frame)

| Özellik | Açıklama | Kaynak Dosya & Fonksiyon / Sembol | Kanıt |
|---|---|---|---|
| Mantıksal Ölçülendirme | Cihaz profil boyutları ve yönelimine göre mantıksal CSS piksel hesabı | `src/core/workspace/layout.ts` → `effectiveSize()`<br>`src/core/devices/schema.ts` → `makeCustomDevice()` | `o === 'landscape' ? { width: max, height: min } : { width: min, height: max }`. |
| Cihaz Piksel Oranı (DPR) | Cihaz profili metadata değeri; capture sırasında `imageScale(imageNaturalWidth, cssViewportWidth)` ile yakalanan ekran görüntüsünün doğal genişliği / CSS görünüm alanı genişliği oranı kullanılır | `src/core/types.ts` → `DeviceProfile.devicePixelRatio`<br>`src/core/capture/crop.ts` → `imageScale()` | `devicePixelRatio` cihaz profili metadatasıdır; layout DPR'ı emüle edilmez. Capture ölçekleme çarpanı `imageNaturalWidth / cssViewportWidth` formülüyle hesaplanır. |
| Yön Değişimi (Orientation) | Dikey (portrait) ve yatay (landscape) arasında geçiş | `src/ui/workspace/store.ts` → `toggleOrientation()`<br>`src/core/workspace/layout.ts` → `swapOrientation()`, `rotated()` | `swapOrientation(v.orientation)` ile genişlik/yükseklik eksenleri yer değiştirir. |
| Zoom Ölçekleme & Sığdırma | 0.1 ile 3.0 arasında görsel zoom; ekrana sığdırma (Fit to Screen) | `src/ui/workspace/store.ts` → `setZoom()`, `setAllZoom()`, `fitToScreen()`<br>`src/core/workspace/layout.ts` → `clampZoom()`, `displayedSize()` | `clampZoom` ile 0.1–3.0 arası kırpılır; `fitToScreen` pencere boyutuna göre optimum ölçek hesaplar. |
| Donanım Kasası (Device Frame) | iPhone Classic, Modern iPhone (Notch/Dynamic Island), Android Punch Hole, Tablet, Laptop | `src/ui/workspace/DeviceFrame.tsx` → `DeviceFrame()`<br>`src/ui/workspace/DeviceFrame.module.css` | Çerçeve tipi, notch, hoparlör, ana ekran butonu ve kasa kaplaması (`frameFinish`) SVG/CSS ile çizilir. |

---

## 3. Yerleşim Düzenleri (Layout Engine)

| Özellik | Açıklama | Kaynak Dosya & Fonksiyon / Sembol | Kanıt |
|---|---|---|---|
| Izgara Düzeni (Grid) | Viewport sayısına göre otomatik sütunlu ızgara yerleşimi | `src/core/workspace/layout.ts` → `gridColumns()`<br>`src/ui/workspace/store.ts` → `setLayout('grid')` | `gridColumns(count, 'grid')` = `Math.ceil(Math.sqrt(count))`. |
| Yatay ve Dikey Sıralar | Tek satır (row) veya tek sütun (col) flex yerleşimi | `src/ui/workspace/store.ts` → `setLayout('row')`, `setLayout('col')` | CSS flex row/column yapısı. |
| Serbest Tuval (Free-form) | Serbest taşıma, sürükleme, snap kılavuzları ve otomatik hizalama | `src/ui/workspace/store.ts` → `setPosition()`, `autoAlignAll()`<br>`src/core/workspace/layout.ts` → `autoAlignPositions()`, `calculateSnapGuides()` | Kart pozisyonları (`position: { x, y }`) saklanır; `calculateSnapGuides` 10px eşikle hizalama kılavuzları üretir. |
| Esnek Hizalama | Yatay ve dikey hizalama kuralları | `src/ui/workspace/store.ts` → `setAlignItems()`, `setJustifyContent()` | `alignItems` (flex-start, center, flex-end) ve `justifyContent` (space-between vb.) kontrolü. |

---

## 4. Senkronizasyon Motoru ve Döngü Koruması

| Özellik | Açıklama | Kaynak Dosya & Fonksiyon / Sembol | Kanıt |
|---|---|---|---|
| Kaydırma Eşitleme (Scroll) | Farklı yükseklikteki sayfaları oranlayarak (ratio) rAF ile akıcı eşitleme | `src/content/agent.ts` → `emit('scroll')`<br>`src/core/sync/protocol.ts` → `scrollRatios()`, `applyScrollRatios()` | `xRatio = scrollX / maxX`, `yRatio = scrollY / maxY` hesaplanır; alıcıda `scrollTo` uygulanır. |
| Tıklama Eşitleme (Click) | CSS seçici yolu veya normalize koordinat fallback ile tıklama yayını | `src/content/agent.ts` → `emit('click')`<br>`src/core/sync/protocol.ts` → `selectorPath()` | `selectorPath` 6 seviyeli seçici üretir; bulunamazsa `document.elementFromPoint` kullanılır. |
| Gezinme Eşitleme (Nav) | Link tıklamaları ve SPA URL değişimlerini diğer pencerelere iletme | `src/content/agent.ts` → `emit('nav')`, URL polling | Link tıklaması ve 250ms aralıklı `location.href` kontrolü ile `location.assign` tetiklenir. |
| Form ve Girdi Eşitleme | Input ve select/checkbox değerlerini prototip setter üzerinden eşitleme | `src/content/agent.ts` → `emit('input')`, `emit('form')`, `apply()` | Framework korumalı inputlar için `Object.getOwnPropertyDescriptor` setter'ı ile değer yazılır. |
| Klavye Eşitleme (Keyboard) | Güvenli non-modifier tuş basımlarını simüle etme | `src/content/agent.ts` → `emit('key')`, `apply()` | `KeyboardEvent('keydown'/'keyup')` hedefe veya `activeElement`'e dispatch edilir. |
| Yeniden Yükleme (Reload) | Sayfa yenileme yayını ve hard-reload desteği | `src/content/agent.ts` → `emit('reload')`, `handleAgentDo()` | `sessionStorage` işaretçisi ile recursive reload engellenir. |
| Döngü Önleme (Loop Guard) | Echo döngülerini ve sonsuz tetiklenmeleri kesin durdurma | `src/core/sync/protocol.ts` → `LoopGuard`<br>`src/content/agent.ts` → `suppress()` | `epoch` fencing, `monotonic seq` kontrolü ve programatik uygulama sırasında `beginApply/endApply` ile `suppress(120ms)` devrededir. |

---

## 5. Görsel Karşılaştırma ve Figma Modu

| Özellik | Açıklama | Kaynak Dosya & Fonksiyon / Sembol | Kanıt |
|---|---|---|---|
| İkili Bölünmüş Görünüm (Dual Split) | İki viewport'u ayarlanabilir dikey bölücüyle üst üste/yan yana kıyaslama | `src/ui/workspace/CompareModal.tsx` → `mode === 'split'` | `splitPercent` slider/pointer sürükleme ile iki görünümün genişlik oranları ayarlanır. |
| Orantılı Perde Modu (Curtain) | Cihazların fiziksel genişliklerini orantılayan tam boy perde görünümü | `src/ui/workspace/CompareModal.tsx` → `mode === 'curtain'` | Cihaz genişliklerine göre otomatik oran (`naturalRatioA`) hesaplanır. |
| Yan Yana (Side-by-Side) | İki cihazı bağımsız yan yana ölçekleyerek inceleme | `src/ui/workspace/CompareModal.tsx` → `mode === 'side-by-side'` | İki cihaz bağımsız iframe konteynerinde gösterilir. |
| Figma / Tasarım Katmanı | Tasarım görseli yükleme, saydamlık slider'ı ve karışım modları | `src/ui/workspace/CompareModal.tsx` → `mode === 'figma'` | `figmaSrc` dosya yükleme, `figmaOpacity` (%0-100), `figmaBlend` (normal, difference, overlay) uygulanır. |

---

## 6. Duyarlı Tasarım Sorun Taraması, Ölçüm ve Panel

| Özellik | Açıklama | Kaynak Dosya & Fonksiyon / Sembol | Kanıt |
|---|---|---|---|
| Yatay Taşma Dedektörü | Sayfanın viewport genişliğinden taşmasını ve taşan elemanları tespit | `src/core/issues/detectors.ts` → `detectHorizontalOverflow()` | `scrollWidth - innerWidth > 1` kontrolü ve taşan elemanların seçicileri. |
| Metin Kırpılma Dedektörü | Yatay ve dikey `overflow: hidden/clip` ile kesilen metinleri bulma | `src/core/issues/detectors.ts` → `detectTextClipping()`, `detectVerticalTextClipping()` | `scrollWidth > clientWidth + 2` ve `scrollHeight > clientHeight + 2` kontrolleri. |
| Viewport Dışı Elemanlar | Görünüm alanı dışına taşmış etkileşimli elemanları tespit etme | `src/core/issues/detectors.ts` → `detectOutOfViewport()` | `rect.x + rect.width > innerWidth + 1` veya `rect.x < -1` denetimi. |
| Dokunma Hedefi Boyutu | WCAG 2.5.8 (24px hedef aralığı) ve ergonomik 44px mobil öneri denetimi | `src/core/issues/detectors.ts` → `detectSmallTapTargets()`, `targetSpacingConflicts()` | 24px daire çakışması (`targetSpacingConflicts`) ve 44px eşik incelemesi. |
| Sorunlar Çekmecesi (Drawer) | Tespit edilen sorunları ciddiyetine göre listeleme ve elemanı vurgulama | `src/ui/workspace/IssuesDrawer.tsx`<br>`src/content/agent.ts` → `cmd === 'highlight'` | Soruna tıklandığında viewport içine `highlight` komutu ile 3px sarı anahat çizilir ve `scrollIntoView` yapılır. |
| Rapor Dışa Aktarımı | Sorunları JSON verisi, metin/Markdown (`issueReport`) veya yazdırılabilir HTML rapor belgesi (`reportDocument`) olarak dışa aktarma (CSV yoktur) | `src/ui/workspace/IssuesDrawer.tsx`<br>`src/core/issues/report.ts` → `issueReport()`, `reportDocument()` | `groupIssues` ile gruplanan bulgular metin özeti (`issueReport`) veya HTML rapor (`reportDocument`) olarak sunulur. |

---

## 7. Ekran Görüntüsü (Capture) Çeşitleri

| Özellik | Açıklama | Kaynak Dosya & Fonksiyon / Sembol | Kanıt |
|---|---|---|---|
| Odaktaki Viewport Kırpma | Yalnızca odaktaki cihaz ekranını DPR uyumlu kırparak indirme (Kısayol: `c`) | `src/ui/workspace/bridge.ts` → `cropToBlob()`<br>`src/core/capture/crop.ts` → `cropRectInImage()` | `tabs.captureVisibleTab` çıktısından bounding rect kırpılarak PNG üretilir. |
| Tam Boyutlu Parçalı Yakalama | Ekrandan büyük sayfaları kaydırarak parçalar (tile) halinde birleştirme | `src/ui/workspace/capture.ts` → `captureViewport()`<br>`src/core/capture/tiles.ts` → `captureTiles()` | CSS translate ile karo karo kaydırılarak canvas üzerinde 32MP limitine kadar birleştirilir. |
| Tüm Viewportları Yakalama | Tuvaldeki tüm cihazları sırayla tek tıkla kaydetme (Kısayol: `Shift+C`) | `src/ui/workspace/App.tsx` capture akışı | Tüm görünür viewport'lar taranarak art arda indirme tetiklenir. |
| Tam Tuval / Çalışma Alanı | Tüm tarayıcı penceresinin ve cihazların toplu ekran görüntüsü | `src/ui/workspace/bridge.ts` → `fullCaptureBlob()` | Görünür tab'ın tamamı `captureVisibleTab` ile yakalanıp blob yapılır. |
| Karşılaştırma Modu Yakalama | Compare modalındaki split/curtain durumunun ekran görüntüsü | `src/ui/workspace/CompareModal.tsx` → `handleCapture()` | Karşılaştırma sahnesinin rect'i kırpılarak kaydedilir. |

---

## 8. URL, Yerel Ağ ve Güvenlik İzinleri

| Özellik | Açıklama | Kaynak Dosya & Fonksiyon / Sembol | Kanıt |
|---|---|---|---|
| URL Doğrulama ve Normalizasyon | Şemasız URL'lere http/https ekleme, localhost ve arama sorgusu yönlendirme | `src/ui/workspace/store.ts` → `normalizeUrl()`<br>`src/core/security/framing.ts` → `safeHttpUrl()` | `localhost` ve IP adresleri `http://`, normal alan adları `https://` yapılır. |
| Host İzin Yönetimi | İstek üzerine `<all_urls>` host izni sorgulama ve isteme | `src/ui/workspace/bridge.ts` → `hasHostAccess()`, `grantHostAccess()` | `browser.permissions.contains/request` ile runtime izin yönetimi. |
| Framing Koruma Temizleme | X-Frame-Options başlığını soyma ve CSP frame-ancestors direktifini kaldırma | `src/background/index.ts` → `syncRules()`<br>`src/core/security/framing.ts` → `workspaceRule()`, `relaxFirefoxHeaders()` | Chromium'da DNR session kuralları (Rule 1001), Firefox'ta `webRequest.onHeadersReceived` blocking filtreleri. |
| Service Worker İzolasyonu | İframe'lerin Service Worker önbelleğine takılmasını engelleme | `src/background/index.ts` → `preparePreview()`<br>`src/content/world-inject.ts` | Hedef origin için `browsingData.removeServiceWorkers` çağrılır ve sayfa içine SW unregister kodu enjekte edilir. |

---

## 9. Tema, Dil, Kısayollar, Ön Tanımlar ve Depolama

| Özellik | Açıklama | Kaynak Dosya & Fonksiyon / Sembol | Kanıt |
|---|---|---|---|
| Tema (Koyu / Açık) | Koyu ve açık mod değişimi; HTML `data-theme` özniteliği | `src/ui/workspace/store.ts` → `toggleTheme()` | `document.documentElement.dataset.theme` güncellenir ve depolanır. |
| Çok Dilli Destek (i18n) | Türkçe (tr), İngilizce (en) ve Norveççe (no) dil desteği | `src/ui/workspace/i18n.ts`<br>`src/ui/workspace/store.ts` → `detectBrowserLanguage()` | Tarayıcı dilini otomatik algılama ve kullanıcı tercihi saklama. |
| Klavye Kısayolları | Ayarlanabilir klavye kısayolları ve varsayılan tuş atamaları | `src/ui/workspace/store.ts` → `DEFAULT_SHORTCUTS`, `setShortcut()` | `Alt+Shift+V`, `Shift+R`, `Shift+B`, `a`, `f`, `Shift+F`, `c`, `Shift+C`, `Shift+D`. |
| Cihaz Ön Tanımları (Presets) | Hazır cihaz setleri: Mobile Test, Standard Responsive, iOS+Android, Tablet Check, Full House | `src/core/devices/builtin.ts` → `BUILTIN_PRESETS`<br>`src/ui/workspace/store.ts` → `addPreset()` | Tek tıkla önceden belirlenmiş cihaz kümelerini yükleme. |
| Yerel Depolama (Storage) | Çalışma alanı modelini `storage.local` üzerinde 800ms debounce ile saklama | `src/ui/workspace/store.ts` → `hydrate()`, `persist()`, `saveAs()`, `loadSaved()` | `viewgrid.store.v1` anahtarı altında `storage.local` persistence; isimlendirilmiş çalışma alanları. |
| Dokunma İmleci Simülasyonu | Mobil cihazlarda masaüstü fare yerine dokunmatik parmak simülasyonu | `src/content/agent.ts` → `applyTouchCursor()`<br>`src/ui/workspace/store.ts` → `toggleTouchCursor()` | 24px/32px yuvarlak dokunma imleci ve kaydırma (swipe-scroll) desteği. |
