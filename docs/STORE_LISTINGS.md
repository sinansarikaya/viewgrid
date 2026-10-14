# Store submission copy · 1.0.4

Use the matching localized text for Chrome Web Store and Firefox AMO. These descriptions are prepared copy; this file does not publish a store update.

## Short descriptions

- **Türkçe:** Duyarlı tasarımları yan yana test edin: senkron etkileşim, tasarım karşılaştırma, ekran görüntüsü ve yerel analiz.
- **English:** Test responsive layouts side by side with synced interactions, design overlays, screenshots and local analysis.
- **Norsk bokmål:** Test responsive oppsett side om side med synkronisert samhandling, designlag, skjermbilder og lokal analyse.

## Türkçe — tam açıklama

Telefon, tablet ve masaüstü düzenlerini tek sekmede yan yana test edin. ViewGrid, tarayıcıyı sürekli yeniden boyutlandırmadan kırılma noktalarını karşılaştırmanıza yardımcı olan ücretsiz, açık kaynaklı bir Chromium ve Firefox eklentisidir.

Arayüz ve raporlar İngilizce, Türkçe ve Norveççe Bokmål destekler.

Duyarlı tasarım testi
- 21 cihaz profili, 5 hazır set, özel boyutlar ve 16'ya kadar görünüm.
- Grid, satır, sütun veya serbest yerleşim; yön değiştirme, zoom, hizalama ve odak modu.
- Kaydırma, tıklama, gezinme, yenileme ve isteğe bağlı giriş/form/tuş senkronizasyonu; kanallar ayrı yönetilir.

Karşılaştırma ve raporlama
- Bölünmüş, perde ve yan yana karşılaştırma; dışa aktarılan PNG/SVG tasarımları için katman.
- Tek görünüm veya tüm genişletilmiş görünümler için PNG ekran görüntüsü; büyük görünümlerde parçalı yakalama ve 32 megapiksel sınırı.
- Taşma, kırpılan metin ve küçük hedefler için gruplu bulgular; cihaz ölçümleri, filtreler ve öğe vurgulama. Markdown kopyalama, JSON ve yazdırılabilir HTML raporları.

Yerel analiz
- Mobil, masaüstü veya varsayılan olarak ikisi: yükleme gözlemleri, DOM tabanlı SEO, axe erişilebilirlik kontrolleri ve deneysel GEO sinyalleri.
- Her analiz bölümü kendi Markdown raporunu kopyalar veya indirir. Kapsam, başarısız ve belirsiz kontroller görünür; hedef değişince sonuçlar eski olarak işaretlenir.
- Harici analiz API'si, Google/CrUX isteği, hesap veya ek motor kurulumu gerekmez.

Gizlilik ve sınırlar
Telemetri ve bulut proxy yoktur. Ayarlar tarayıcıda yerel saklanır; önizlediğiniz siteler olağan ağ isteklerini yapar. Yerel gözlemler Lighthouse skoru veya gerçek kullanıcı Core Web Vitals verisi değildir. Bulgular manuel inceleme gerektirir; uygunluk sertifikası, tam site crawl veya DAST sunulmaz. GEO, arama sıralaması veya yapay zekâ görünürlüğü garantisi değildir.

Profiller CSS boyutlarını gösterir; gerçek mobil donanımı veya tarayıcı motorunu emüle etmez. Tasarım katmanı Figma API entegrasyonu değildir. Ekran görüntüleri görünümü yakalar, tüm uzun sayfa belgesini değil. Oturum açma, üçüncü taraf cookie ve sandbox kısıtları bazı önizlemeleri engelleyebilir.

Giriş/form/tuş senkronizasyonu aynı origin ile sınırlandırılır. Tür, autocomplete ve ad/ID üzerinden tanınan parola, tek kullanımlık kod ve ödeme alanlarında yakalama ve uygulama engellenir. Önizleme bağlantısı gerçek üst çalışma alanı, doğrudan iframe kimliği ve doğrulanmış frame/document kaydıyla kontrol edilir; sayfanın kendi oluşturduğu mesajlar bağlantı kanıtı sayılmaz.

Çerçeveleme istisnaları doğrulanmış çalışma alanı sekmeleriyle sınırlıdır. Firefox doğrudan önizlemelerde XFO ve CSP frame-ancestors kaldırır; Chromium çalışma alanı alt çerçevelerinde, iç içe çerçeveler dahil, XFO ve tüm CSP yanıt başlıklarını kaldırır. Normal sekmelerin çerçeveleme korumaları korunur. Seçili sitenin service worker kayıtlarını kaldırmak aynı sitenin normal sekmelerini de etkileyebilir; cookie veya site depolaması silinmesi istenmez.

## English — full description

Test phone, tablet and desktop layouts side by side in one tab. ViewGrid is a free, open-source Chromium and Firefox extension that helps you compare breakpoints without continually resizing your browser.

The interface and reports support English, Turkish and Norwegian Bokmål.

Responsive testing
- 21 device profiles, 5 preset sets, custom sizes and up to 16 viewports.
- Grid, row, column or free layouts; rotation, zoom, alignment and focus mode.
- Scroll, click, navigation, reload and optional input/form/key synchronization, with independent channel controls.

Comparison and reporting
- Split, curtain and side-by-side comparisons; overlays for exported PNG/SVG designs.
- PNG screenshots for one or all expanded viewports, with tiled large captures and a 32-megapixel limit.
- Grouped findings for overflow, clipped text and small targets, with device measurements, filters and element highlighting. Markdown copy, JSON and printable HTML reports.

Local analysis
- Mobile, desktop or both by default: loading observations, DOM-based SEO, axe accessibility checks and experimental GEO signals.
- Each analysis section copies or downloads its own Markdown report. Coverage, failed and uncertain checks remain visible; results become stale when the target changes.
- No external analysis API, Google/CrUX request, account or additional engine installation is required.

Privacy and limits
No telemetry or cloud proxy. Settings stay in local browser storage; previewed sites make their usual network requests. Local observations are not Lighthouse scores or real-user Core Web Vitals data. Findings need human review; there is no compliance certification, whole-site crawl or DAST. GEO does not guarantee search ranking or AI visibility.

Profiles provide CSS dimensions, without emulating mobile hardware or browser engines. Design overlays are not a Figma API integration. Screenshots capture viewports, not an entire long page document. Login, third-party cookies and sandbox restrictions can block some previews.

Input/form/key synchronization is restricted to the same origin. Capture and replay are blocked for password, one-time-code and payment fields recognized by type, autocomplete and name/ID guards. Preview binding checks the actual parent workspace, direct iframe identity and verified frame/document registration; page-created messages are not accepted as binding evidence.

Framing exceptions require verified workspace tabs. Firefox removes XFO and CSP frame-ancestors on direct previews; Chromium removes XFO and all CSP response headers on workspace subframes, including nested frames. Normal tabs retain their framing protections. Removing selected-site service-worker registrations may also affect normal tabs for that site; removal of cookies or site storage is not requested.

## Norsk bokmål — full beskrivelse

Test oppsett for mobil, nettbrett og datamaskin side om side i én fane. ViewGrid er en gratis Chromium- og Firefox-utvidelse med åpen kildekode som hjelper deg å sammenligne brytepunkter uten stadig å endre nettleserstørrelsen.

Grensesnittet og rapportene støtter engelsk, tyrkisk og norsk bokmål.

Testing av responsivt design
- 21 enhetsprofiler, 5 forhåndsdefinerte sett, egne størrelser og opptil 16 visninger.
- Rutenett, rad, kolonne eller fri plassering; rotasjon, zoom, justering og fokusmodus.
- Synkronisering av rulling, klikk, navigasjon, oppdatering og valgfrie inndata/skjemaer/tastetrykk, med separate kanalvalg.

Sammenligning og rapporter
- Delt visning, gardin og sammenligning side om side; lag for eksporterte PNG/SVG-design.
- PNG-skjermbilder for én eller alle utvidede visninger, med oppdelt opptak av store visninger og en grense på 32 megapiksler.
- Grupperte funn for innhold utenfor visningen, avkuttet tekst og små klikkmål, med enhetsmålinger, filtre og fremheving av elementer. Kopiering av Markdown, JSON og utskriftsvennlige HTML-rapporter.

Lokal analyse
- Mobil, datamaskin eller begge som standard: observasjoner av innlasting, DOM-basert SEO, tilgjengelighetssjekker med axe og eksperimentelle GEO-signaler.
- Hver analysedel kopierer eller laster ned sin egen Markdown-rapport. Dekning, mislykkede og usikre sjekker vises; resultater merkes som utdaterte når målet endres.
- Ingen ekstern analyse-API, Google/CrUX-forespørsel, konto eller ekstra installasjon av analysemotor kreves.

Personvern og begrensninger
Ingen telemetri eller skyproxy. Innstillinger lagres lokalt i nettleseren; nettstedene du forhåndsviser, gjør sine vanlige nettverksforespørsler. Lokale observasjoner er ikke Lighthouse-poeng eller Core Web Vitals fra virkelige brukere. Funn krever manuell vurdering; ingen samsvarssertifisering, gjennomgang av hele nettstedet eller DAST tilbys. GEO garanterer ikke søkerangering eller synlighet i KI-tjenester.

Profilene gir CSS-størrelser uten å emulere mobilmaskinvare eller nettlesermotorer. Designlag er ikke en Figma API-integrasjon. Skjermbilder fanger visninger, ikke hele lange nettsidedokumenter. Innlogging, tredjepartscookies og sandbox-regler kan hindre enkelte forhåndsvisninger.

Synkronisering av inndata/skjemaer/tastetrykk begrenses til samme origin. Innsamling og gjengivelse blokkeres for passord, engangskoder og betalingsfelt som gjenkjennes gjennom type, autocomplete og navn/ID. Forhåndsvisningen kontrolleres mot det faktiske overordnede arbeidsområdet, direkte iframe-identitet og bekreftet frame/document-registrering; meldinger opprettet av siden godtas ikke som bevis på tilknytning.

Unntak for innramming krever bekreftede arbeidsområdefaner. Firefox fjerner XFO og CSP frame-ancestors i direkte forhåndsvisninger; Chromium fjerner XFO og alle CSP-svarhoder i arbeidsområdets underrammer, også nestede rammer. Vanlige faner beholder innrammingsvernet. Fjerning av nettstedets service worker-registreringer kan også påvirke vanlige faner for nettstedet; sletting av cookies eller nettstedslagring forespørres ikke.

## Submission checklist

- Use each short description in its matching locale (all are within 132 characters).
- Upload the matching Chromium or Firefox package; provide the source ZIP for AMO review.
- Verify manifest version 1.0.4 and SHA256SUMS; retain historical release assets.
- Link the privacy policy and retain Firefox/ESR and OS smoke-test evidence.
- Store review/publication is independent of GitHub release publication.

[Website](https://viewgrid.sinansarikaya.dev/) · [Privacy](https://viewgrid.sinansarikaya.dev/privacy/) · [Support](https://viewgrid.sinansarikaya.dev/support/) · [Source](https://github.com/sinansarikaya/viewgrid)
