# ViewGrid · 1.0.4

**Türkçe · English · Norsk bokmål**

[Website](https://viewgrid.sinansarikaya.dev/) · [Chrome Web Store](https://chromewebstore.google.com/detail/viewgrid-%E2%80%94-responsive-vie/hmlhooeamfmhdeichnghcklahfgimgef) · [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/viewgrid-responsive-viewer/) · [Releases](https://github.com/sinansarikaya/viewgrid/releases)

![ViewGrid workspace — CastPost](website/public/screenshots/workspace.png)

**Yerel analiz · Local analysis · Lokal analyse**

![ViewGrid local analysis — CastPost](website/public/screenshots/local-analysis.png)

**Görünümleri karşılaştırın · Compare layouts · Sammenlign visninger**

![ViewGrid comparison — CastPost](website/public/screenshots/compare.png)

## Türkçe

**Telefon, tablet ve masaüstü düzenlerini tek sekmede yan yana test edin.** ViewGrid, Chromium ve Firefox için ücretsiz, açık kaynaklı bir tarayıcı eklentisidir. Arayüz ve raporlar Türkçe, İngilizce ve Norveççe Bokmål sunulur.

- 21 cihaz profili, 5 hazır set, özel boyutlar ve 16'ya kadar görünüm; grid, satır, sütun ve serbest yerleşim, sıralama, hizalama, odak, yön değiştirme ve merkezden zoom.
- Ayrı ayrı açılıp kapatılabilen kaydırma, tıklama, gezinme, yenileme, giriş/form ve tuş senkronizasyonu; yerel kayıtlı çalışma alanları ve ayarlar.
- Bölünmüş, perde ve yan yana karşılaştırma; dışa aktarılan PNG/SVG tasarım katmanı. Figma API entegrasyonu veya otomatik piksel farkı skoru değildir.
- Tek görünüm veya tüm genişletilmiş görünümler için PNG; büyük görünümlerde parçalı yakalama, 32 megapiksel sınırı ve Escape ile iptal. Çalışma alanı görüntüsü görünür alanı yakalar; tam sayfa belgesi değildir.
- Duyarlı tasarım sorunlarında gruplu bulgular, cihaz/ölçüm/selector kanıtı, filtre ve öğe vurgulama; Markdown kopyalama, JSON ve yazdırılabilir HTML raporları. Benzersiz bulgu ve cihaz tekrarları ayrı gösterilir; isteğe bağlı ergonomi önerileri ayrı tutulur.
- **Eklentiye paketlenen yerel analiz:** mobil, masaüstü veya varsayılan olarak ikisi; yükleme gözlemleri, DOM tabanlı SEO, axe erişilebilirlik kontrolleri ve deneysel GEO sinyalleri. Her bölüm kendi Markdown kopyalama/indirmesini sunar. Sonuçlar oturumda korunur, hedef değişince eski olarak işaretlenir; kapsam ve başarısız kontroller görünürdür.
- Yumuşak panel/menü geçişleri, azaltılmış hareket desteği ve dış tık/Escape ile kapanan menüler.

**Kurulum:** Güncel Chromium/Firefox ZIP'ini ve `SHA256SUMS` dosyasını Releases'ten alın. Chromium'da ZIP'i açın, `chrome://extensions` → Geliştirici modu → Paketlenmemiş öğe yükle. Firefox'ta `about:debugging#/runtime/this-firefox` → Geçici eklenti yükle → `manifest.json`; yeniden başlatınca kaldırılır. Kalıcı Firefox kurulumu için imzalı AMO paketini kullanın. Kaynak pakette doğru klasörler `dist/chromium` ve `dist/firefox` olur. GitHub paketleri ile mağaza incelemesi ayrıdır; mağazalardaki mevcut 1.0.3 sürümü yeni 1.0.4 incelemesi/yayını tamamlanana kadar kalabilir.

**Sınırlar ve güvenlik:** Analiz için harici API, Google/CrUX isteği, hesap veya ek motor kurulumu gerekmez. Yerel gözlemler Lighthouse skoru veya gerçek kullanıcı Core Web Vitals verisi değildir; tam site crawl, DAST ve uygunluk sertifikası sunulmaz. GEO sinyalleri sıralama veya yapay zekâ görünürlüğü garantisi değildir. Sıfır bulgu uygunluğu kanıtlamaz; tarama limitleri, gölge DOM ve iç içe çapraz origin çerçeveler kapsama engeli olabilir.

Giriş/form/tuş senkronizasyonu aynı origin ile sınırlandırılır. Tür, autocomplete ve ad/ID üzerinden tanınan parola, tek kullanımlık kod ve ödeme alanlarında yakalama ve uygulama engellenir. Önizleme bağlantısı gerçek üst çalışma alanı, doğrudan iframe kimliği ve doğrulanmış frame/document kaydıyla kontrol edilir; sayfanın kendi oluşturduğu mesajlar bağlantı kanıtı sayılmaz.

Eklentide telemetri ve bulut proxy yoktur; seçtiğiniz siteler olağan ağ isteklerini yapar. Çerçeveleme istisnaları doğrulanmış çalışma alanı sekmeleriyle sınırlıdır: Firefox doğrudan önizlemede XFO ve CSP `frame-ancestors` kaldırır; Chromium çalışma alanının iç içe çerçeveleri dahil alt çerçevelerinde XFO ve tüm CSP yanıt başlıklarını kaldırır. Normal sekmelerin çerçeveleme korumaları korunur. Önizleme yüklenmeden seçili sitenin service worker kayıtları origin (Chromium) veya hostname (Firefox) kapsamıyla kaldırılır; bu aynı sitenin normal sekmelerdeki worker'larını da etkileyebilir. Cookie, localStorage, sessionStorage, IndexedDB ve CacheStorage silinmesi istenmez. İzin, oturum açma, üçüncü taraf cookie ve sandbox kısıtları önizlemeyi engelleyebilir. Profiller CSS görünüm boyutu sağlar; gerçek mobil donanım, DPR veya tarayıcı motoru emülasyonu değildir. Sabit RAM/FPS/gecikme garantisi yoktur.

## English

**Test phone, tablet and desktop layouts side by side in one tab.** ViewGrid is a free, open-source extension for Chromium and Firefox. The interface and reports support Turkish, English and Norwegian Bokmål.

- 21 device profiles, 5 preset sets, custom dimensions and up to 16 viewports; grid, row, column and free layouts, ordering, alignment, focus, rotation and centered zoom.
- Independently switchable scroll, click, navigation, reload, input/form and key synchronization; locally saved workspaces and preferences.
- Split, curtain and side-by-side comparison with exported PNG/SVG design overlays. No Figma API integration or automatic pixel-diff score.
- PNGs for one or all expanded viewports, tiled large captures, a 32-megapixel limit and Escape cancellation. Workspace capture covers its visible area, not a full page document.
- Grouped responsive findings with device/measurement/selector evidence, filters and element highlighting; Markdown copy, JSON and printable HTML reports. Unique findings and device occurrences are separate; optional ergonomic advice stays separate.
- **Bundled local analysis:** mobile, desktop or both by default; loading observations, DOM-based SEO, axe accessibility checks and experimental GEO signals. Each section offers scoped Markdown copy/download. Session results persist and become stale when the target changes; coverage and failed checks remain visible.
- Soft panel/menu transitions, reduced-motion support and menus that close on outside click or Escape.

**Install:** Download current browser ZIPs and `SHA256SUMS` from Releases. Chromium: unzip, open `chrome://extensions`, enable Developer mode and choose Load unpacked. Firefox: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → `manifest.json`; it disappears after restart. Use signed AMO packages for permanent Firefox installation. Source packages use `dist/chromium` or `dist/firefox`. GitHub packages and store reviews are separate; stores may retain the current 1.0.3 until 1.0.4 review/publication is complete.

**Limits and security:** Analysis needs no external API, Google/CrUX request, account or additional engine installation. Local observations are not Lighthouse scores or real-user Core Web Vitals data; there is no whole-site crawl, DAST or compliance certification. GEO signals do not guarantee ranking or AI visibility. Zero findings do not establish compliance; scan limits, shadow DOM and nested cross-origin frames can limit coverage.

Input/form/key synchronization is restricted to the same origin. Capture and replay are blocked for password, one-time-code and payment fields recognized by type, autocomplete and name/ID guards. Preview binding checks the actual parent workspace, direct iframe identity and verified frame/document registration; page-created messages are not accepted as binding evidence.

There is no extension telemetry or cloud proxy; selected sites make their usual network requests. Framing exceptions require verified workspace tabs: Firefox removes XFO and CSP `frame-ancestors` on direct previews; Chromium removes XFO and all CSP response headers on workspace subframes, including nested frames. Normal tabs retain their framing protections. Before loading previews, selected-site service-worker registrations are removed by origin (Chromium) or hostname (Firefox), which may also affect workers used by normal tabs of that site. Removal of cookies, localStorage, sessionStorage, IndexedDB and CacheStorage is not requested. Permissions, login, third-party cookies and sandbox policies can block previews. Profiles set CSS viewport dimensions, without real mobile hardware, DPR or browser-engine emulation. No fixed RAM/FPS/latency guarantee is made.

## Norsk bokmål

**Test oppsett for mobil, nettbrett og datamaskin side om side i én fane.** ViewGrid er en gratis utvidelse med åpen kildekode for Chromium og Firefox. Grensesnittet og rapportene støtter tyrkisk, engelsk og norsk bokmål.

- 21 enhetsprofiler, 5 forhåndsdefinerte sett, egne størrelser og opptil 16 visninger; rutenett, rad, kolonne og fri plassering, sortering, justering, fokus, rotasjon og zoom rundt midten.
- Synkronisering av rulling, klikk, navigasjon, oppdatering, inndata/skjemaer og tastetrykk kan slås av og på hver for seg; arbeidsområder og innstillinger lagres lokalt.
- Delt visning, gardin og sammenligning side om side med eksporterte PNG/SVG-designlag. Ingen Figma API-integrasjon eller automatisk poengsum for pikselforskjeller.
- PNG for én eller alle utvidede visninger, oppdelt opptak av store visninger, grense på 32 megapiksler og avbryt med Escape. Arbeidsområdebildet viser det synlige området, ikke hele nettsidedokumentet.
- Grupperte funn med enhet, målinger og selektorer, filtre og fremheving av elementer; kopiering av Markdown, JSON og utskriftsvennlige HTML-rapporter. Unike funn og forekomster på enheter vises separat; valgfrie ergonomiske råd holdes adskilt.
- **Innebygd lokal analyse:** mobil, datamaskin eller begge som standard; observasjoner av innlasting, DOM-basert SEO, tilgjengelighetssjekker med axe og eksperimentelle GEO-signaler. Hver del tilbyr kopiering/nedlasting av sin egen Markdown-rapport. Resultater beholdes i økten og merkes som utdaterte når målet endres; dekning og mislykkede sjekker vises.
- Myke overganger for paneler/menyer, støtte for redusert bevegelse og menyer som lukkes med klikk utenfor eller Escape.

**Installasjon:** Last ned gjeldende nettleser-ZIP og `SHA256SUMS` fra Releases. Chromium: pakk ut, åpne `chrome://extensions`, aktiver utviklermodus og velg Last inn upakket. Firefox: `about:debugging#/runtime/this-firefox` → Last inn midlertidig tillegg → `manifest.json`; tillegget fjernes ved omstart. Bruk signerte AMO-pakker for permanent Firefox-installasjon. Kildepakker bruker `dist/chromium` eller `dist/firefox`. GitHub-pakker og butikkgodkjenning er separate; butikkene kan beholde gjeldende 1.0.3 til vurdering/publisering av 1.0.4 er fullført.

**Begrensninger og sikkerhet:** Analysen krever ingen ekstern API, Google/CrUX-forespørsel, konto eller ekstra analyseverktøy. Lokale observasjoner er ikke Lighthouse-poeng eller Core Web Vitals fra virkelige brukere; full nettstedsgjennomgang, DAST og samsvarssertifisering tilbys ikke. GEO-signaler garanterer ikke rangering eller synlighet i KI-tjenester. Ingen funn beviser ikke samsvar; skannegrenser, shadow DOM og nestede rammer fra andre opprinnelser kan begrense dekningen.

Synkronisering av inndata/skjemaer/tastetrykk begrenses til samme origin. Innsamling og gjengivelse blokkeres for passord, engangskoder og betalingsfelt som gjenkjennes gjennom type, autocomplete og navn/ID. Forhåndsvisningen kontrolleres mot det faktiske overordnede arbeidsområdet, direkte iframe-identitet og bekreftet frame/document-registrering; meldinger opprettet av siden godtas ikke som bevis på tilknytning.

Utvidelsen har ingen telemetri eller skyproxy; valgte nettsteder gjør sine vanlige nettverksforespørsler. Unntak for innramming krever bekreftede arbeidsområdefaner: Firefox fjerner XFO og CSP `frame-ancestors` i direkte forhåndsvisninger; Chromium fjerner XFO og alle CSP-svarhoder i arbeidsområdets underrammer, også nestede rammer. Vanlige faner beholder innrammingsvernet. Før forhåndsvisning fjernes nettstedets service worker-registreringer etter origin (Chromium) eller vertsnavn (Firefox); dette kan også påvirke workerne i vanlige faner for samme nettsted. Sletting av cookies, localStorage, sessionStorage, IndexedDB og CacheStorage forespørres ikke. Tillatelser, innlogging, tredjepartscookies og sandbox-regler kan hindre forhåndsvisning. Profilene angir CSS-visningsstørrelser uten å emulere mobilmaskinvare, DPR eller nettlesermotorer. Ingen fast garanti for RAM, FPS eller forsinkelse gis.

## Development

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run typecheck
pnpm run typecheck:website
pnpm test
pnpm run build:all
pnpm run lint:web-ext
pnpm exec playwright install --with-deps chromium
pnpm run test:e2e
pnpm run build:website
pnpm run package:release
```

[Release notes / Sürüm notları / Utgivelsesnotater](docs/RELEASE_NOTES_1.0.4.md) · [Changelog](CHANGELOG.md) · [Privacy](docs/PRIVACY.md) · [Security](SECURITY.md) · [Testing](docs/TESTING.md) · [MIT License](LICENSE)

[Sinan Sarıkaya](https://github.com/sinansarikaya) · [Sponsor](https://github.com/sponsors/sinansarikaya)
