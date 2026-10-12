# Uygulama planı — 2026-10-11

## UI-REFINE — 2026-10-12 güncel ekran referansı

Bu paket yalnız arayüz iyileştirmesidir; analiz servisi/anahtar/telemetri ve sürüm yükseltme kapsam dışıdır. Mevcut analiz panelleri kodda çalışır; canlı Google kota engeli farklıdır, özellikler gizlenmez. Firefox click-sync kurulum sorunu çözüldü, teşhis tekrarlanmaz.

| Paket / sahip | Dosya alanı | Bağımlılık | Kabul / doğrulama |
| --- | --- | --- | --- |
| UI-R1 lider | App/styles, ViewportCard, core/workspace/fit, store ve unit/E2E | Mevcut envanter/devir | Üst kontrol isim/spacing/reflow, grid eşit kart hücresi ve bağımsız uniform display zoom; kaydedilmiş ayarlar ve CSS boyut korunur;1280/1920/320 screenshot ve E2E |
| UI-R2 Antigravity | WorkspaceSidebar.module.css, WorkspaceActions.tsx/css | Mevcut Sidebar/Analysis davranışı | Okunaklı2x2panel sekmeleri, collapsed rail, Tools/Sync/Analyze grupları; EN/TR/NO, tüm handlerlar korunur; lint/typecheck/source review |
| UI-R3 lider + bağımsız reviewer | Test/docs; reviewer salt okunur | R1/R2 | Chromium gerçekextension+görünür canlısmoke, Firefox ayrıbaseline, mevcutunit/E2E/lint/typecheck/build/web-ext; diff incelemesi, kanıt ve commit. Normal profiller kullanılmaz. |

Başlangıç paket sürümü 1.0.3. Mağaza sürümleri doğrulanmadı; yerel geliştirme sürümü yayınlanmış sayılmaz. Hedef sırası 1.0.4 → 1.1.0 → 1.2.0 → 1.3.0 → 1.4.0 → 1.5.0 → 1.6.0 BETA. Sürüm yalnız ilgili kabul kapıları geçtiğinde yükseltilir.

Öncelikli güncelleme: ücretsiz/açık kaynak, zorunlu ücretli servis/hesap/barındırma yok; temel eklenti sunucusuz. ANALYSIS-CORE/UI, FIELD ve REPORTS kamu kotasına bağımlılığı açıkça gösterir; keyless429 ve ayrı CrUX anahtar eksikliği gerçek servis testlerinde engelli. Mock çıktılar gerçek ölçüm değildir. LOCAL-RESEARCH paketi liderde: `docs/ANALYSIS_SETUP.md`, gizlilik ve lisans bildirimleri; resmî PSI/CrUX şartları ve açık kaynak Lighthouse kurulum/platform/kaynak/bakım araştırması. Sunucu kurma/yayınlama veya istemciye anahtar ekleme kapsam dışı; gelecekte isteğe bağlı kullanıcı sunucusu güvenli profil olabilir.

Her teslim değişen dosyaları, gerekçeyi, çalıştırılan kontrolleri/kanıtları, açık sorunları ve entegrasyon notlarını içerir. Lider diff ve sonuçları inceler; ajan beyanı kabul kanıtı değildir. İki başarısız düzeltmede teşhis yeniden değerlendirilir. Ortak en fazla üç yürütücü; aynı dosyaya eşzamanlı yazılmaz. Push/merge/deploy/mağaza yayını kapsam dışı.

| Kimlik / sürüm | Sorumlu / dosya alanı | Amaç ve kapsam dışı | Bağımlılık | Kabul / doğrulama / teslim |
| --- | --- | --- | --- | --- |
| BASE-DOC / 1.0.4 | Lider: TASKS, ROADMAP, IMPLEMENTATION_PLAN, DECISIONS, TEAM_HANDOFF; Antigravity: FEATURE_INVENTORY, FEATURE_TEST_MATRIX | Koddan koruma envanteri ve görev/test kayıtları; tarihsel checklist kanıt değildir | Yok | Her gerçek özellik kaynak ve test durumuyla kayıtlı; doküman diff incelemesi |
| BASE-FF / 1.0.4 | Codex Sync high: content agent, core/sync, Firefox E2E ve ilgili unit testler | Click-sync timeout nedenini kanıtla, gerekli fix; UI değişimi yok | Hazırlık kanıtı | Yerel fixture Firefox yeniden testi, Chromium ilişkili regresyon, nedeni açıklayan teslim |
| UI-SHELL / 1.1.0 | Antigravity UI: workspace App/styles, ortak UI ve workspace çevirileri; lider incelemesi | Üst navigasyon, collapsible sidebar, ayrı sync, layout/fit/align, sürüm/status; site içeriğine müdahale yok | BASE | 1280×800/1920×1080/dar ekran, klavye, tema/dil/persist ve eski özellikler; gerçek eklenti E2E + screenshot |
| UI-CARDS / 1.1.0 | Codex Frontend medium: ViewportCard/DeviceFrame ve CSS | Kısa başlık, erişilebilir ikincil menü; CSS viewport ile display zoom ayrımı | UI-SHELL API anlaşması | CRUD/rotate/zoom/frame/capture regresyonu; DOM ve boyut kontrolleri |
| DEVICES / 1.2.0 | Antigravity: DevicePicker ve CSS, core/devices; Codex: store/types geçişi | Kategoriler, marka/model, multi-select/favorite/recent/custom/group; gerçek donanım emülasyonu yok | UI | CSS ölçü kaynakları, duplicate açıklaması, reload kalıcılığı; unit ve eklenti E2E |
| ANALYSIS-CORE / 1.3.0 | Codex Measurement high: lib/api, lib/validation, core/analysis | PSI adapter, profil/timeout/retry/cancel/stale; secret paket içine konmaz | BASE + resmî API doğrulaması | Kontrollü ağ testleri ve mümkünse gerçek servis; hatalar sıfır puan değildir |
| ANALYSIS-UI / 1.3.0 | Antigravity: analysis UI/CSS/i18n | Performance alanı, dış servise gönderim açıklaması, engine/conditions/diagnostics | ANALYSIS-CORE, UI | Mobil/masaüstü/ikisi; error/abort/stale akışları; API mock ve gerçek sonuç ayrımı |
| FIELD-SEO-A11Y / 1.4.0 | Codex high: analysis normalizasyonu; Antigravity: kategori/önem filtre UI | CrUX URL/origin/dönem, LCP/INP/CLS; Lighthouse SEO/a11y; manuel garanti yok | ANALYSIS | TBT ≠ INP, eksik veri puan değildir; fixture/unit/E2E |
| REPORTS / 1.5.0 | Codex high: report schema/history/comparison; Antigravity: report UI/templates | HTML/JSON/print PDF, koşullar/geçmiş/silme/limit/median/screenshots | ANALYSIS + FIELD | Örnek gerçek dosyalar açılıp render incelenir; farklı koşullar uyarısı ve başarısız kontroller kayıtlı |
| REPEAT-CORE / 1.5.0 | Codex Measurement high: yeni lib/api/repeated-analysis.ts, core/analysis/repetition.ts ve unit testleri | İsteğe bağlı 1/3 sıralı ölçüm, yalnız başarılı/karşılaştırılabilir lab sonuçlarında ortanca; saha verisini ortalamaz, 429 sonrası yeni tur göndermez | ANALYSIS-CORE | İptal/kısmi hata/kota/koşul farkı mock testleri; UI, mevcut history şeması ve canlı Google doğrulaması bu paketin dışında |
| GEO / 1.6.0 BETA | Codex Architect high: versioned criteria; Antigravity: UI/doküman | Yerel deneysel crawl/semantic/source/date/schema erişim sinyalleri ve manuel öneriler; AI servis/sıralama garantisi yok | REPORTS | Kanıtlı durumlar, sürümlü checklist; unit/E2E ve açıklama |
| RELEASE-GATES / her aşama | Bağımsız Codex Reviewer high + lider | İnceleme ve özellik matrisi, yayın yapılmaz | İlgili işler | lint/typecheck/unit/build/web-ext/Chromium+Firefox; kritik açık hata veya zorunlu çalıştırılmamış kontrol varsa aşama bitmez |

Ölçüm anahtarı/kota erişimi gerçek engelse yerel normalizasyon, mock hata senaryoları, UI ve rapor işleri devam eder; gerçek servis testi engelli kaydedilir. Local/private hedefler dış API'ye gönderilmez. Çok sayfalı tarama, hesap/bulut, gerçek cihaz/Safari, AI fix ve yerel Lighthouse çalıştırıcı kapsam dışı.

### Rapor tamamlama alt paketleri

| Kimlik | Sorumlu ve dosya sahipliği | Bağımlılık | Kabul ve doğrulama |
| --- | --- | --- | --- |
| REPEAT-REPORT | Codex Measurement high: yeni core/reports/repeated.ts ve unit testi | REPEAT-CORE | Ortanca/sample count, ham turlar, koşul ve durma nedeni; query/içerik redaksiyonu, HTML kaçış/CSP, TR/EN/NO; mock unit/typecheck/lint. Sunucu/anahtar/canlı servis kapsam dışı. |
| REPEAT-UI | Antigravity: AnalysisPanel.tsx/css, analysis-i18n.ts | REPEAT-CORE + REPEAT-REPORT | İsteğe bağlı 1/3 tur, kota talep sayısı açık, sıralı çalışma/iptal/429 durma; medyan ve saha ayrımı, ham tur geçmişi, HTML/JSON/PDF; gerçek eklentide kontrollü E2E. |
| UI-CONTRAST | Lider: global.css, ortak Button ve picker/panel CSS, theme-contrast unit | UI-SHELL | Açık/koyu normal metin ve primary/hover ≥4.5:1; unit ve güncel build ekran doğrulaması. Tam erişilebilirlik garantisi değildir. |
| UI-NARROW-FOOTER | Antigravity: yalnız styles.module.css; lider extension.spec.ts | UI-SHELL |320×800 durum çubuğu en fazla72px, sürüm/durum metinleri korunur, kontroller erişilebilir;1280/1920 regresyon E2E ve screenshot görsel inceleme. Yeni ürün özelliği veya bilgi silme kapsam dışı. |
| REPORT-SCREENSHOT | Lider: App.tsx, yeni core/reports/screenshots.ts + unit; REPEAT-UI sonrası Antigravity panel | REPORTS | Kullanıcı seçerse yalnız yerel odaklı viewport PNG,6MiB/32MP sınırı, URL query redaksiyonu; görüntü içerik/PII uyarısı, silme, kalıcı history/ağ aktarımı yok; HTML/JSON/PDF gerçek capture E2E. Analiz motoru sonucu veya gerçek cihaz testi değildir. |
