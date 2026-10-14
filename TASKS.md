# TASKS — ViewGrid Product Promotion & Distribution Plan

_Son güncelleme: 2026-10-14 | Codex_

> Bu dosya projenin ana master görev ve uygulama takip listesidir.
> Eski `TASK.md` ve `TASKS.md` birleştirilerek bu dosyada toplanmıştır.
> Kurallar:
> - `[AUTO]` etiketli görevler repo içinde yapay zeka tarafından otomatik uygulanır.
> - `[MANUAL]` etiketli görevler kullanıcı tarafından harici panellerde veya tarayıcıda bizzat icra edilir.
> - `- [ ]` → `- [x]` yalnızca görev tam olarak bittiğinde güncellenir.

---

## 🎯 Active Initiative: Product Presentation, Distribution & Ecosystem Funnel

Turn ViewGrid into a polished, high-trust developer tool across:
**Website (viewgrid.sinansarikaya.dev) + Chrome Web Store + Firefox AMO + GitHub**.

### Core Positioning
- **Primary:** "Test every breakpoint at once."
- **Supporting:** "View phone, tablet, and desktop layouts side-by-side in one browser tab, with synchronized scrolling and interaction."
- **Slogan:** "Stop resizing your browser."
- **Güncel sürüm:** `v1.0.4` — Firefox herkese açık; Chrome güncellemesi inceleme bekliyor.

---

## In Progress
- [~] WEBSITE-MEDIA-CONTACT: Beş güncel CastPost galeri görseli, güncel ana görsel, EN/TR/NO başlıklar ve contact/security adresleri; tarayıcı kontrolü geçti, PR/yayın doğrulaması bekliyor.
- [~] RELEASE-DOCS: İngilizce varsayılan ve Türkçe/Norveççe ayrı README; mağaza görsel açıklamaları ve yayın otomasyonundaki eski notların kaldırılması son PR ile birleştiriliyor.







- [~] [AUTO] INTERACTION-SCAN-FIX: altı güncel referans; tarama/PSI429/izin/state ayrımı, tooltip hit-area, gerçek checkbox tasarımı, kart reorder/drop/FLIP ve reduced motion. Başlangıç088c1df, output/ korunur; lider+uzman+Flash ortak en fazla3, test ve kaynak sahipliği ayrı.




- [~] [AUTO] ViewGrid 1.0.4–1.6.0 BETA geliştirme: yeni shell/cihaz/analiz/rapor/GEO ve kontrollü testler entegre; koruma matrisi ve katalog kaynak kapıları açık. Yerel paket1.0.4, mağaza doğrulanmadı; plan/kanıt/devir `docs/IMPLEMENTATION_PLAN.md`, `docs/FEATURE_TEST_MATRIX.md`, `docs/TEAM_HANDOFF.md`.

- [ ] [AUTO] RELEASE-GATE: güncel çalışma ağacı için gerekli yayın auditleri, Firefox13 paket uyarısının kaynak değerlendirmesi, kurulum/yükseltme ve izin/gizlilik kontrolleri; kanıt `docs/ANALYSIS_MODAL_REVIEW.md`.

- [ ] [MANUAL] Phase 5 — Manual User Tasks & Launch Checklist (Awaiting user execution)

## Done
- [x] RELEASE-PUBLISH 1.0.4: PR#2/#3 birleştirildi; GitHub release, üç dilde tanıtım sayfası ve gerçek CastPost görselleri güncellendi. Chrome üç dil açıklama, beş genel ve TR/NO yerel görsel ile gönderildi; inceleme bekliyor. Firefox 1.0.4 herkese açık indirme bağlantısıyla doğrulandı; beş yeni CastPost görseli, her görsele EN/TR/NO açıklama ve üç dil ürün/teknik metni kaydedildi. _(2026-10-14, Codex)_
- [x] RELEASE-SECURITY kapanışı: Hassas alan yakalama/uygulama ve aynı-origin sınırı; gerçek parent kimliği, direct-frame/document bağlama ve gelen mesaj kontrolü; sahte worker mesajı dışlandı. Worker restart origin/document session kaydı ve negatif testler geçti. Bağımsız kaynak incelemesi açık engel bulmadı;362 unit,Chromium veFirefox akışları geçti. _(2026-10-14, Codex)_
- [x] RELEASE-READINESS değerlendirmesi: Gemini paket/Codex güvenlik incelemesi ve lider runtime kontrolleri tamamlandı. Karar yayına hazır değil; SEC-01 hassas alan sync/SEC-02 frame bağlama kaynak eksikleri açık.358 unit,24 Chromium+canlı restart,Firefox,UI axe0 ihlal. Runner başarısız/onaylanmamış sonuçlar başarılı sayılmadı. Rapor `docs/RELEASE_READINESS_1.0.3.md`. _(2026-10-14, Codex)_
- [x] ANALYSIS-HEIGHT-NO: Dört analiz sekmesinin yüksekliği sabitlendi; Norveççe geçmiş başlık/profil/saatleri düzeltildi. Canlı Norveççe kopyalama/indirme, 800/480 px gerçek pencere, CastPost 50 kural +18 GEO karşılaştırması ve358 unit test geçti. Kanıt: `docs/ANALYSIS_MODAL_REVIEW.md`. Sürüm1.0.3. _(2026-10-14, Codex)_

- [x] REPORT-FEEDBACK: rapora özel yeşil/kısa/animasyonlu kopya ve indirme geri bildirimi, gecikmiş işlem koruması, ortak profil kartları, belirsiz sonuç filtresi, insan dilinde GEO ve gerçek geçen kontrol metni; toplamda türetilmiş aynı bulgu tekrar sayılmaz.358 unit, lint/type/build; Chromium25 + Firefox görünür akış ve CastPost50+18 karşılaştırması geçti.1.0.3 korundu, tam yayın onayı verilmedi. Kanıt `docs/ANALYSIS_MODAL_REVIEW.md`. _(2026-10-14, Codex)_

- [x] ANALYSIS-PRESENTATION: tek tarama kapsamı açık, bölüm özeti/renkli sekme ve menü durumları, ayrı MD indirme/kopyalama, modalda sonuç koruma/URL geçerliliği, merkez zoom ve dış tık/Escape ile kapanan üst katman menüsü hazır.351unit/lint/type/build; görünür Chromium/Firefox cache ve UI akışları, CastPost50+18 karşılaştırması geçti. Yayın yok,1.0.3 korundu. Kanıt `docs/REPORT_UX_VALIDATION.md`. _(2026-10-14, Codex)_

- [x] REPORT-UX: 1.0.3 korundu; anlaşılır renkli/metinli rapor, Markdown indirme/kopyalama/rapor dili, iki varsayılan profil, güncel farklı kontrol rozetleri, geçerlilik kaydı ve kullanılabilir hizalama eklendi. 344 unit, lint/type/build; Chromium 25 test ve Firefox yerel akışı geçti. CastPost canlı50 kontrol+18 GEO sonucu ve ham zamanlama eşleşti, kaynak dosyaları salt okunur incelendi. Yayımlanmadı. Kanıt `docs/REPORT_UX_VALIDATION.md`. _(2026-10-14, Codex)_

- [x] LOCAL-ANALYSIS: ViewGrid 1.0.4 yerel DOM/SEO/GEO + paketlenen axe ve gerçek yükleme gözlemleri, URL/profil/izin/iptal/sınırlar, eski geçmiş/rapor ayrımı ve yumuşak modal/menü/panel geçişleri tamamlandı. 332 unit, type/lint, iki build; Chromium 24 headed test ve Firefox yerel akışı geçti, bir isteğe bağlı canlı test atlandı. Dış analiz isteği yok; bağımsız inceleme bulguları kapandı. Firefox lint 0 hata/13 axe uyarısı; yerel ZIP hazır. Kanıt: `docs/LOCAL_ANALYSIS_VALIDATION.md`, `test-results/local-analysis/`. _(2026-10-14, Codex)_

- [x] [AUTO] ICON-GRID-POLISH: ortak yerel SVG ikon/hover-focus-Escape tooltip, kompakt kart başlığı, ölçülmüş gridFit ve geçici ölçek/manualzoom ayrımı uygulandı.269unit,lint/typecheck,iki build/web-ext0error;Chromium32pass1isteğe bağlıskip ve headed6zoom;Firefoxheadedbaseline/click/6zoom/4layout geçti. Kanıt: docs/FEATURE_TEST_MATRIX.md ICON-GRID. Flash600s timeout + headless izin reddinden sonra lider devraldı, bypass yok. İki yeni referans eki görünmedi, önceki ekler ve yeni ölçümler kullanıldı; canlıGoogle/gerçekcihaz/Safari ve tüm serbestkonumFit kombinasyonları doğrulanmış sayılmaz. Sürüm1.0.3, push/yayın yok.

- [x] [AUTO] UI-REFINE arayüz paketi: toolbar erişilebilirlik/spacing, okunaklı ve kaydırılabilirsidebar, dengeli grid/displayzoom; kayıtlı ayarlar ve gerçekCSSölçüleri korunur.262unit/Chromium32E2E/Firefox9baseline+UI veBiDi200/429/lint/types/buildboth geçti, web-ext3bilinenuyarı. Bağımsızreview tamam; kanıt `docs/FEATURE_TEST_MATRIX.md` UI-REFINE, `test-results/development/ui-refine-*`. Sürüm1.0.3; analizservisi ve yayın kapsam dışı. _(2026-10-12, Codex)_

- [x] [AUTO] Görünür Chromium/gerçek eklenti QA: CastPost dörtiframe yükleme, Row/Grid/Fit ve üst32px kontrolleri geçti;6unit/3E2E/buildboth/typecheck/lint. Kullanıcı Brave'e Firefox paketi kurduğunu açıkladı; doğru paket ayrımı ve tarayıcı tespiti güçlendirildi. `visible-live-verified.log`, `visible-workspace-qa.png`; headedtest `node scripts/visible-workspace-qa.mjs`, normalprofil kullanılmaz. _(2026-10-12, Codex)_

- [x] [AUTO] Ücretsiz/açık kaynak mimari kararı karar/plan/gizlilik/kurulum ve MIT bağımlılık bildirimine işlendi (`7086eee`). Zorunlu ücretli servis/hesap yok; temel eklenti sunucusuz. PSI canlı başarı HTTP429 nedeniyle, ayrı CrUX anahtar yokluğu nedeniyle engelli; Lighthouse yalnız araştırılmış alternatif, otomatik runner değildir. Ürün sürüm kabulü bu belge işinin tamamlanmasından ayrıdır. _(2026-10-11, Codex)_

- [x] [AUTO] Model tercihleri ve görev bazlı düşünme seviyesi devir notlarına kaydedildi; kurulu Codex model metadatasında low/medium/high desteği doğrulandı. _(2026-10-11, Codex)_

- [x] [AUTO] Araç hazırlığı tamamlandı: ayrı Playwright erişimleri ve Chromium smoke geçti; Firefox temel yükleme geçti, click-sync regresyonu açık. Kanıtlar: `test-results/tool-readiness/READINESS.md`. _(2026-10-11, Codex)_

- [x] [AUTO] Firefox click-sync zaman aşımı ortam/test kurulumuna ayrıştırıldı: aynı ZIP GeckoDriver yerel path ile geçti, Selenium base64 aktarımı yeniden başarısız oldu; ürün sync kodu değiştirilmedi. `test-results/firefox-v104/DIAGNOSIS.md`. _(2026-10-11, Codex)_

- [x] [AUTO] Firefox gerçek eklentide kontrollü PSI200/429 native BiDi ile geçti; dış Google trafiğine kapalı bağımsız test. `test-results/development/firefox-bidi-latest.log`. _(2026-10-11, Codex)_

## Todo
- [ ] RELEASE-SECURITY: SEC-01 hassas alan/origin sync koruması ve SEC-02 doğrudan frame/document kaydı; SEC-04 worker mesajı yarışı için negatif güvenlik testleri. Kaynak bulguları henüz exploit testiyle yeniden üretilmedi.


- [ ] [AUTO] Kalan koruma senaryoları ve model bazlı katalog kaynak doğrulaması; canlı PSI429/CrUXanahtar eksikliği engelleri ayrı kalır.

---

## Master Task Checklist

### Phase 0 — Audit & Baseline
- [x] [AUTO] Audit repository, docs, release assets, and existing marketing copy _(2026-09-26, Antigravity)_
- [x] [AUTO] Merge `TASK.md` and `TASKS.md` into master `TASKS.md` and remove redundant `TASK.md` _(2026-09-26, Antigravity)_
- [x] [AUTO] Verify active versions across codebase (1.0.1 confirmed on Chrome & Firefox) _(2026-09-26, Antigravity)_
- [x] [AUTO] Identify stale copy across site and docs (Chrome store review pending, Release Candidate phrasing, old 1.0.0 zip references) _(2026-09-26, Antigravity)_

### Phase 1 — GitHub / README
- [x] [AUTO] Restructure `README.md` hero: immediate value prop, positioning, and direct install badges (Chrome + Firefox + Website) _(2026-09-26, Antigravity)_
- [x] [AUTO] Group features into clean product stories: Responsive Testing, Visual Comparison (Dual Split & Figma Diff), Developer Workflow, Privacy & Performance _(2026-09-26, Antigravity)_
- [x] [AUTO] Embed existing visual showcase screenshots cleanly in `README.md` _(2026-09-26, Antigravity)_
- [x] [AUTO] Contextualize performance claims (~14 MB RAM) with clear benchmark scenario qualifications _(2026-09-26, Antigravity)_
- [x] [AUTO] Update version references in `README.md` and release command examples to `v1.0.1` _(2026-09-26, Antigravity)_
- [x] [AUTO] Create GitHub metadata specification (`docs/GITHUB_METADATA.md`) with About description, Website URL, and recommended topics _(2026-09-26, Antigravity)_
- [x] [AUTO] Tag `v1.0.1` locally in git to ensure git tag matches release and package.json _(2026-09-26, Antigravity)_

### Phase 2 — Landing Page
- [x] [AUTO] Update `website/src/data/site.config.ts`: version to 1.0.1, remove stale RC FAQ, qualify benchmark claims _(2026-09-26, Antigravity)_
- [x] [AUTO] Update `website/index.html` Hero: align positioning ("Test every breakpoint at once.", "View phone, tablet, and desktop layouts side-by-side...") _(2026-09-26, Antigravity)_
- [x] [AUTO] Remove all stale "Chrome store review in progress" and "pending review" notes across `website/index.html` and components _(2026-09-26, Antigravity)_
- [x] [AUTO] Set `STORES_PENDING = false` in `website/index.html` and update store CTA badges to live install state _(2026-09-26, Antigravity)_
- [x] [AUTO] Ensure prominent, direct CTAs for both Chrome Web Store and Firefox Add-ons (AMO) _(2026-09-26, Antigravity)_
- [x] [AUTO] Highlight Figma comparison and proportional curtain diff in landing page feature hierarchy _(2026-09-26, Antigravity)_
- [x] [AUTO] Update manual install snippets in `website/index.html` to reference `viewgrid-1.0.1-chromium.zip` _(2026-09-26, Antigravity)_
- [x] [AUTO] Qualify performance claims (<15 MB RAM / 60 FPS) with benchmark scenario context _(2026-09-26, Antigravity)_
- [x] [AUTO] Re-verify website build with `pnpm run build:website` and `pnpm run typecheck:website` _(2026-09-26, Antigravity)_

### Phase 3 — Chrome & Firefox Store Preparation
- [x] [AUTO] Create comprehensive store listings document (`docs/STORE_LISTINGS.md`) with unified copy for Chrome Web Store and Firefox AMO _(2026-09-26, Antigravity)_
- [x] [AUTO] Structure store listing copy: 1-line outcome, short explanation, core capabilities, developer workflow, technical trust & privacy, support links _(2026-09-26, Antigravity)_
- [x] [AUTO] Formulate clear, accurate permission explanations (why host permissions & declarativeNetRequest/webRequest are required for sub-frames) _(2026-09-26, Antigravity)_
- [x] [AUTO] Create store screenshot plan (`docs/STORE_SCREENSHOT_PLAN.md`) with captions, order, and exact dimensions (1280x800 for Chrome / Firefox) _(2026-09-26, Antigravity)_
- [x] [AUTO] Document promo tiles specifications and existing assets in `release/chrome-promos/` _(2026-09-26, Antigravity)_

### Phase 4 — Cross-Platform Consistency, Trust & SEO
- [x] [AUTO] Align metadata in `website/index.html`: title, description, Open Graph, Twitter Cards, canonical URL _(2026-09-26, Antigravity)_
- [x] [AUTO] Add missing Norwegian (`no`) alternate hreflang tag in `website/index.html` `<head>` _(2026-09-26, Antigravity)_
- [x] [AUTO] Verify JSON-LD Schema.org metadata consistency across all pages _(2026-09-26, Antigravity)_
- [x] [AUTO] Check `website/src/components/MetaTags.tsx` and all subpages (`/docs/`, `/privacy/`, `/support/`) for consistent messaging and version 1.0.1 _(2026-09-26, Antigravity)_
- [x] [AUTO] Update `docs/PRIVACY.md` and `docs/SECURITY.md` alignment with live 1.0.1 features _(2026-09-26, Antigravity)_

### Phase 5 — Manual User Tasks & Launch Checklist
- [ ] [MANUAL] Record 10–20s demo video / GIF of synchronized multi-viewport scrolling (`website/public/screenshots/viewgrid-demo.gif`)
  - **Location:** Browser with ViewGrid active
  - **Duration:** 10–20 seconds
  - **Action:** Open 3 viewports (Phone, Tablet, Desktop) on any test site; scroll one viewport and show synchronized scrolling
  - **Target:** Save to `website/public/screenshots/viewgrid-demo.gif`
- [ ] [MANUAL] Capture Figma Diff & Responsive Issue Scanner recordings
  - **Location:** ViewGrid Compare Modal & Issues Drawer
  - **Target:** Screenshots or mini-GIFs for documentation and social launch
- [ ] [MANUAL] Update Chrome Web Store listing description and metadata via Google Chrome Web Store Developer Dashboard
  - **Location:** https://chrome.google.com/webstore/devconsole
  - **Source:** Use prepared text from `docs/STORE_LISTINGS.md` § Chrome Web Store
- [ ] [MANUAL] Update Firefox Add-ons (AMO) description and metadata via Mozilla Add-on Developer Hub
  - **Location:** https://addons.mozilla.org/developers/
  - **Source:** Use prepared text from `docs/STORE_LISTINGS.md` § Firefox Add-ons
- [ ] [MANUAL] Upload official captioned screenshot set to Chrome Web Store and Firefox AMO
  - **Source:** Assets from `release/chrome-screenshots/` and captions from `docs/STORE_SCREENSHOT_PLAN.md`
- [ ] [MANUAL] Update GitHub repository "About" section with description, website, and recommended topics
  - **Location:** https://github.com/sinansarikaya/viewgrid (About cog icon on right sidebar)
  - **Source:** Use content from `docs/GITHUB_METADATA.md`
- [ ] [MANUAL] Push git tags to remote
  - **Command:** `git push origin v1.0.1`
- [ ] [MANUAL] Launch distribution & community outreach
  - Product Hunt submission
  - Reddit post (r/webdev, r/frontend)
  - Hacker News Show HN
  - X / Twitter announcement thread

### Out of Scope / Future Roadmap Items
> Aşağıdaki uygulama değişikliği sınırı yalnız tarihsel tanıtım girişimine aittir; 2026-10-11 onaylı ürün geliştirme kapsamını kısıtlamaz. Eski 1.0.1 mağaza beyanları tarihsel kayıttır; güncel mağaza sürümü doğrulanmadı.
- [ ] Extension functional/application code modifications (Preserve 1.0.1 stability)
- [ ] Adding new browser extension features or modifying manifest permissions
- [ ] Paid advertising campaigns or commercial endorsements

---

## 🏛️ Extension Technical Implementation Backlog (Preserved from TASK.md)

### 0. Planning (M0) — DONE
- [x] Inspect existing project state (empty repo confirmed)
- [x] Research competitor products (Responsive Viewer, Mobile View, Hoverify, Toolkit, Firefox RDM)
- [x] Research Firefox/Chromium WebExtension API capabilities & limits
- [x] Documentation package (PRD, ARCHITECTURE, SECURITY, PRIVACY, UX, TESTING, DEVICE_SPEC, COMPETITIVE_ANALYSIS, ROADMAP)
- [x] Decide app name → **ViewGrid**

### 1. Foundation
- [x] Git repository initialized + skeleton commit
- [x] Scaffold package.json (build scripts, dev loop)
- [x] Configure TypeScript (strict, multi-entry build)
- [x] Configure Vite UI build + esbuild IIFE bundles
- [x] Configure React + CSS Modules + design tokens
- [x] Typed `browser.*` facade (`src/platform/browser.ts`)
- [x] Configure ESLint + Prettier + editorconfig
- [ ] Configure commitlint + Husky + lint-staged
- [x] Configure Vitest (unit suite green)
- [ ] Coverage thresholds (from v0.2)
- [x] Manifest generation per browser (firefox MV3 / chromium MV3)
- [x] Build pipeline verified (build:firefox + build:chromium)
- [ ] CI pipeline (GitHub Actions)

### 2. Platform / Browser Abstraction Layer
- [x] Typed `browser.*` facade (platform/browser.ts)
- [x] Messaging module (typed message kinds `VgMessage`, router)
- [x] Storage adapter (storage.local get/set + debounced persistence)
- [x] Capture adapter: firefox `tabs.captureTab`
- [x] Capture adapter: chromium `captureVisibleTab`
- [ ] Capability detection module
- [x] Permissions service (query/request flow)
- [x] Header-rewrite service: firefox `webRequest` blocking adapter
- [x] Header-rewrite service: chromium `declarativeNetRequest` adapter
- [x] Context-menu service
- [x] Commands service (open workspace: Alt+Shift+V)
- [ ] Sidebar integration (firefox sidebar_action; chromium sidePanel)

### 3. Storage & State Management
- [x] Persisted schemas v1: workspace model, custom devices
- [x] Zustand stores: workspace/UI state
- [x] Storage persistence middleware (debounced 400 ms write)
- [ ] IndexedDB layer for binary artifacts
- [ ] Schema migration runner (v1→v2)
- [ ] Export sanitizer

### 4. Embedding & Permissions (Framing)
- [x] Framing policy: scoped XFO strip + CSP `frame-ancestors` rewrite (Firefox webRequest + Chromium DNR)
- [x] Optional-host-permission onboarding flow + HostPermissionBanner
- [x] Limited-mode guidance card
- [x] localhost / 127.0.0.1 / LAN patterns in optional_host_permissions
- [x] Service Worker & PWA isolation via world-inject.js and browsingData removal

### 5. Core Workspace UI
- [x] Workspace tab page shell (toolbar, canvas, status bar)
- [x] Popup launcher (current tab URL → workspace)
- [x] URL bar: navigate all viewports
- [x] Back / Forward / Reload-all controls
- [x] Layout engine: grid, vertical, horizontal
- [x] Viewport card chrome, add/remove/duplicate/hide/focus
- [x] Viewport reorder via drag & drop
- [x] Dark / light theme toggle (persisted)

### 6. Viewport Engine
- [x] Viewport sizing model (logical size vs displayed zoom scale)
- [x] Orientation toggle per viewport (portrait / landscape)
- [x] Viewport zoom presets (25/50/75/100/125/150%)
- [x] Zoom transform pipeline
- [x] Minimize (collapse) + restore

### 7. Device System
- [x] Device profile schema v1
- [x] Phone, tablet, laptop, desktop preset catalogs
- [x] Built-in named presets (Mobile Test, Standard Responsive, iOS+Android, Tablet Check, Full House)
- [x] Custom device create (width, height, DPR, name)
- [x] Device picker UI (search, category tabs, custom form)

### 8. Synchronization Engine
- [x] Content-script agent (per-frame, window.name binding)
- [x] Sync event model + envelope
- [x] SyncHub in workspace
- [x] Sync Scroll: ratio-normalized apply, rAF-coalesced emit
- [x] Sync Click: selector-path capture + normalized-coord fallback
- [x] Sync Navigation: link-click broadcast
- [x] Loop prevention: monotonic seq fencing + apply-suppression guards
- [x] Per-channel toggles UI

### 9. Visual Comparison & Diffing
- [x] Dual Split slider view
- [x] Proportional Overlay Curtain view
- [x] Figma design mockup overlay with opacity control

### 10. Screenshots
- [x] Capture pipeline core (tabs.captureTab / captureVisibleTab → canvas crop)
- [x] DPR-correct region crop
- [x] Current / single viewport screenshot (C, Shift+C)
- [x] Workspace full canvas screenshot
- [x] PNG output saved via anchor download

### 11. Responsive Issue Detection
- [x] Scanner framework (agent metrics → pure core detectors)
- [x] Horizontal overflow detection + offender hints
- [x] Clipped / ellipsized text detection
- [x] Elements outside viewport bounds
- [x] Tap target size audit (<44px / <24px)
- [x] Issue panel UI with severities (🔴 🟠 🟡)

### 12. Keyboard Shortcuts & Context Menu
- [x] Global command: open workspace (Alt+Shift+V / Alt+V / ⌘+Shift+V)
- [x] In-app shortcuts: A, C, Shift+C, S, G, F, O, I, D, Shift+R, ?, Esc
- [x] Context menu: “Open page in ViewGrid”, “Open link in ViewGrid”

---

## 📝 Historical Notes & Decisions (Preserved from TASKS.md)

- Analiz UX: tek DOM taraması tüm bölümleri toplar; her sekme yalnız kendi kapsamını ve MD aktarımını sunar. Sonuçlar modal kapanışında çalışma alanı oturumunda korunur; sayfa/görünüm değişiminde eski olarak işaretlenir. Performans yeşili ölçüm mevcut demektir, kalite skoru değildir.

- **2026-10-14 tamamlanma:** Yeni analiz arayüzünde Google/CrUX isteği, ek kurulum veya tekrar ölçüm onayı yoktur. Lighthouse/DAST/crawl bulunmaz; yerel gözlemler ve sınırlı kurallar açıkça etiketlenir. Eski iki uzak UI E2E paketi `tests/legacy/` içinde saklandı, eski PSI normalizasyon/rapor unit testleri aktiftir. `output/` ve önceki kirli kaynak değişiklikleri korundu.
- **2026-10-14 ekip doğrulaması:** Gemini izin engeli ve işçi pnpm salt-okunur hatası eski görev kayıtlarında korunur; lider UI/entegrasyon ve gerçek kontrolleri tamamladı. Codex bağımsız incelemesindeki dört bulgu kapandı ve `local-review-closure` kabul edildi. Çalıştırıcıda yalnız kaynak dizini okuma ve sözleşmede açıkça izinli kural kanıtı kapsamı düzeltildi; sandbox/başka kaynak kanıtı sınırı korunur.

- **2026-10-14 geliştirme onayı:** Önceki görev başlatmama sınırı kullanıcı tarafından kaldırıldı. Eklenti içine paketlenen yerel motor seçildi; Google/CrUX servisi kullanılmayacak, ek kurulum zorunlu olmayacak. Tam Lighthouse/DAST ve site geneli crawl bu ilk motorun parçası değildir; yerel ölçümler ve sınırlı otomatik kontroller açıkça etiketlenecek.

- **2026-10-14 hazırlık ve çalışma sınırı:** Kullanıcı yalnız ekip hazırlığı ve ürün görüşmesi istedi; yeni görev sözleşmesi/ajan/tarama/geliştirme/yayın başlatılmayacak. Mevcut kirli çalışma ağacı korunacak.
- **2026-10-14 geçici ekip:** Claude kotası dolu; rutin roller Gemini `gemini-3.8-flash-medium`, güvenlik/bağımsız inceleme/zor mimari rolleri geçici Codex `gpt-6.1-sol`. Global routing.json içindeki Opus rol/escalation yönlendirmeleri Codex'e çevrildi; geri dönüş yedeği `/home/sinan/.local/share/ai-team/config/routing.pre-claude-pause-2026-10-14.json`. Claude sağlayıcı tanımı gelecekte geri dönmek için korunur; eski açık sözleşmeler otomatik yeniden yazılmaz/çalıştırılmaz.
- **2026-10-14 ürün görüşmesi:** Analiz servis bağımsızlığı ve uygulama genelinde yumuşak geçişler isteniyor. Aynı Panel/Sorunlar düğmesi aç/kapat davranışı göstermeli. Yerel laboratuvar ölçümü CrUX gerçek kullanıcı verisi olarak sunulmayacak; mimari kararı kullanıcıyla görüşülecek.

- **2026-10-11 ekip/model tercihi:** Codex `gpt-6.1-sol`, Antigravity seçimi `Gemini 3.8 Flash (Medium)` korunur. Antigravity'nin gerçek backend model kimliği doğrulanamadı; seçili etiket kullanım kanıtı değildir ve geliştirmeyi engellemez. Codex görev seviyeleri: rutin koordinasyon low/medium, normal geliştirme medium, mimari ve karmaşık hata teşhisi high. Kurulu CLI `-c model_reasoning_effort=...` override mekanizmasını, yerel model metadatası low/medium/high değerlerini destekliyor. Mevcut lider oturumunun seviyesini buradan değiştiren araç yok; varsayılan low korunuyor. Yeni uzman alt ajanlarda desteklenen reasoning_effort seçimi görev başında uygulanır; değiştirme veya gerçek kullanım doğrulanamazsa açıkça raporlanır. Lider + çalışan Codex alt ajanları + çalışan Antigravity yürütücüleri (varsa onun alt ajanları da) toplam en fazla 3; tamamlanan/kapanan oturumlar sayılmaz. Tam geliştirme görevi, sürüm planı ve referans görseli bekleniyor.

- **2026-10-11 araç hazırlığı:** Antigravity Playwright `--isolated` kullanır; Codex kendi MCP oturumunu, E2E ayrı geçici profili yönetir. Aynı tarayıcıyı iki yürütücü yönetmez. Graph binary `/usr/bin/codebase-memory-mcp`; Codex canlı oturumunda araçlar yeniden yüklenene kadar yerel graph CLI kullanılabilir. Tam rapor `test-results/tool-readiness/READINESS.md`. Ürün kapsamı/sürüm/tasarım bekleniyor; kod veya lockfile değiştirilmedi.

- **Service Worker & PWA Framing Fix:** CastPost ve PWA sitelerinde daha önce tarayıcıda ziyaret edilen sitenin Service Worker'ı (`sw.js`) kayıtlı kaldığı için, ViewGrid içindeki iframe istekleri ağ yerine Service Worker'ın `fetch` / `event.respondWith` mekanizmasına takılıyordu. Firefox'ta SW hata veriyor (`sw.js:78`), Chrome'da ise `declarativeNetRequest` Service Worker yanıtlarına müdahale edemediği için önbellekteki `X-Frame-Options: DENY` başlığı silinemiyordu. Hedef URL açılırken ve URL değişiminde background aracılığıyla ilgili origin/hostname'e ait Service Worker ve cacheStorage verileri temizlendi; `world-inject.js` ile ViewGrid iframe'leri içinde Service Worker kaydı izole edilerek devre dışı bırakıldı; Chromium için DNR oturum kurallarına ek olarak 9999 öncelikli kalıcı dinamik kurallar devreye alındı.
- **HTTP 307 Redirect & Host Permission Banner:** CastPost ve korumalı sitelerdeki HTTP 307 redirect durumunda sub_frame origin değişiminden kaynaklı X-Frame-Options soyulmama sorunu çözüldü. Firefox MV3'te kullanıcı henüz host permission vermediyse canvasın üzerinde otomatik beliren tek tıkla izin isteme barı (HostPermissionBanner) eklendi; izin sonrasında tüm iframeler otomatik yeniden yükleniyor. v1.0.1 release paketleri release/ dizinine derlendi.
- **Overlay Curtain:** Overlay Curtain artık metinleri bölen yapay clip-path yerine; cihazların fiziksel genişliklerini orantılayan (örneğin telefon ~%24 dar, laptop ~%76 geniş ve laptop hissi veren), dikeyde %100 tam boyutta çalışan ve cihaz başlıkları, boyut rozetleri, yön değiştirme butonları ve tek tıkla doğal orana dönme desteği sunan orantılı bir sahneye dönüştürüldü.
- **Benchmark Modal Barı:** Benchmark modalındaki 850 MB kırmızı rakip tüketim barı kaldırıldı; yanlış anlaşılmalar önlendi ve yalnızca ViewGrid'in 14.2 MB ultra hafif tüketimi vurgulandı.
- **Sürükle-Bırak Reorder:** Workspace kart sürükle-bırak reorder işleminde slot/offset matematiksel çakışması kaldırıldı; hedef kartın sol/sağ durumuna göre yönlü (`idx < fromIdx` önce, `idx > fromIdx` sonra) iskelet yerleşimi ve doğrudan indeks taşıma sağlandı.
- **Gecko Header Stripping:** Firefox ve Gecko tabanlı Zen Browser'da subframe başlıklarında XFO tamamen ve CSP başlıklarından `frame-ancestors` direktifi temizlendi. Yeni açılan workspace sekmeleri `tabs.create` dönüşünde senkron olarak kaydedilerek race condition çözüldü.
- **Önbellek Temizleme:** Kullanıcıların eski önbellek görmesini engellemek için toolbara "Önbelleği Temizle & Zorla Yenile (Bypass Cache)" butonu (🧹) eklendi; iframe'lere timestamp buster eklendi ve content agent'lara storage/cookie temizleme komutu tanımlandı.
- **Tanıtım Sitesi Scroll & Drag:** Tanıtım sitesindeki SYNCHRONIZED SCROLL ENGINE bölümündeki Phone/Tablet/Desktop kartlarına canlı sürükle-bırak (drag-and-drop) ve kesik çizgili iskelet önizlemesi entegre edildi.
- **Canonical & Erişilebilirlik:** Self-referencing canonical metadata, Lighthouse footer kontrast güncellemesi (`#a0a0a0`), mobil lazy-loading ve COOP güvenlik başlığı uygulandı.

<!-- AI-TEAM-TASKS-START -->
## AI Team Tasks

### Görev: local-review-closure — Bağımsız bulgu kapanışı
- Durum: Tamamlandı, lider kabul etti.
- Sağlayıcı: Codex `gpt-6.1-sol`; salt okunur inceleme.
- Sonuç: Dört somut bulgu kapalı, açık bulgu yok.
- Kanıt: `.ai-team/tasks/local-review-closure/result.json`, `leader-review.json`, `test-results/local-analysis/`.
<!-- AI-TEAM-TASKS-END -->
