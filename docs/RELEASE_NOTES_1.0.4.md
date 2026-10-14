# ViewGrid 1.0.4

## Türkçe

ViewGrid 1.0.4, yerel analiz motorunu, çalışma alanı iyileştirmelerini ve senkronizasyon korumalarını getirir. Aşağıdaki 1.0.4 tarayıcı paketlerini ve `SHA256SUMS` dosyasını kullanın. GitHub yayını, Chrome Web Store ve AMO incelemesinden ayrıdır; mağazalardaki mevcut 1.0.3 sürümü yeni sürümün incelemesi/yayını tamamlanana kadar kalabilir.

- Mobil ve masaüstünü varsayılan olarak birlikte çalıştıran, eklentiye paketlenmiş yerel analiz motoru: yükleme gözlemleri, DOM tabanlı SEO, axe erişilebilirlik kontrolleri ve deneysel GEO sinyalleri. Harici analiz API'si, Google/CrUX isteği, hesap veya ek kurulum gerekmez.
- Bölüme özel Markdown kopyalama ve indirme, rapor dili seçimi ve kısa işlem geri bildirimi. Başarılı, başarısız ve belirsiz kontroller ayrılır; aynı bulgu tekrar sayılmaz. Sonuçlar modal kapanınca oturumda korunur; hedef değişince eski olarak işaretlenir.
- Duyarlı tasarım bulguları cihaz kanıtı, filtreler, selector/öğe vurgulama ve kapsamı belirtilen Markdown/JSON/HTML dışa aktarımıyla incelenebilir. DOM sayıları, başarısız çerçeveler ve sınırlı taramalar görünürdür.
- Ortak profil kartları, merkezden zoom, yumuşak panel/menü geçişleri ve azaltılmış hareket desteği. Panel düğmeleri aç/kapat davranışı gösterir; menüler dış tık veya Escape ile kapanır.

Giriş/form/tuş senkronizasyonu aynı origin ile sınırlandırılır. Tür, autocomplete ve ad/ID üzerinden tanınan parola, tek kullanımlık kod ve ödeme alanlarında yakalama ve uygulama engellenir. Önizleme bağlantısı gerçek üst çalışma alanı, doğrudan iframe kimliği ve doğrulanmış frame/document kaydıyla kontrol edilir; sayfanın kendi oluşturduğu mesajlar bağlantı kanıtı sayılmaz.

Yerel ölçümler Lighthouse skoru veya gerçek kullanıcı Core Web Vitals verisi değildir. Bu motor tam site crawl, DAST veya uygunluk sertifikası sağlamaz. GEO sinyalleri sıralama ya da yapay zekâ görünürlüğü garantisi değildir. Sıfır bulgu, erişilebilirlik uygunluğu anlamına gelmez; manuel inceleme ve gerçek cihaz testi gerekir.

Chromium ve Firefox paketleri farklıdır. Chromium'da ZIP'i açıp `chrome://extensions` üzerinden paketlenmemiş yükleyin; Firefox'ta `about:debugging` ile `manifest.json` geçici yüklenir ve yeniden başlatınca kaldırılır. Kalıcı Firefox kurulumu için imzalı AMO paketi gerekir. Çerçeveleme istisnaları, seçili site service worker temizliğinin etkisi ve cookie/oturum kısıtları için [README](../README.md) içindeki güvenlik bölümünü okuyun.

## English

ViewGrid 1.0.4 introduces local analysis, workspace improvements and synchronization guards. Use the 1.0.4 browser packages below and `SHA256SUMS`. GitHub publication is separate from Chrome Web Store and AMO review; stores may retain the current 1.0.3 until the new version completes review/publication.

- Bundled local analysis runs mobile and desktop together by default: loading observations, DOM-based SEO, axe accessibility checks and experimental GEO signals. No external analysis API, Google/CrUX request, account or additional installation is required.
- Section-specific Markdown copy/download, report language selection and brief action feedback. Passed, failed and uncertain checks are distinguished; the same finding is not counted again. Results persist in the session when the modal closes and become stale when the target changes.
- Responsive findings include device evidence, filters, selector/element highlighting and scoped Markdown/JSON/HTML export. DOM counts, failed frames and bounded scans remain visible.
- Shared profile cards, centered zoom, soft panel/menu transitions and reduced-motion support. Panel buttons toggle open/closed; menus close on outside click or Escape.

Input/form/key synchronization is restricted to the same origin. Capture and replay are blocked for password, one-time-code and payment fields recognized by type, autocomplete and name/ID guards. Preview binding checks the actual parent workspace, direct iframe identity and verified frame/document registration; page-created messages are not accepted as binding evidence.

Local observations are not Lighthouse scores or real-user Core Web Vitals data. This engine does not provide whole-site crawling, DAST or compliance certification. GEO signals do not guarantee ranking or AI visibility. Zero findings do not establish accessibility compliance; manual review and real-device testing remain necessary.

Chromium and Firefox packages are different. Chromium: unzip and load unpacked through `chrome://extensions`; Firefox: load `manifest.json` temporarily through `about:debugging`, which removes it after restart. Permanent Firefox installation needs a signed AMO package. Read the security section in [README](../README.md) for framing exceptions, the effect of selected-site service-worker cleanup and cookie/login restrictions.

## Norsk bokmål

ViewGrid 1.0.4 innfører lokal analyse, forbedringer av arbeidsområdet og vern for synkronisering. Bruk nettleserpakkene for 1.0.4 nedenfor og `SHA256SUMS`. Publisering på GitHub er separat fra vurderingen i Chrome Web Store og AMO; butikkene kan beholde gjeldende 1.0.3 til den nye versjonen er vurdert/publisert.

- Innebygd lokal analyse kjører mobil og datamaskin sammen som standard: observasjoner av innlasting, DOM-basert SEO, tilgjengelighetssjekker med axe og eksperimentelle GEO-signaler. Ingen ekstern analyse-API, Google/CrUX-forespørsel, konto eller ekstra installasjon kreves.
- Kopiering/nedlasting av Markdown for hver del, valg av rapportspråk og kort tilbakemelding på handlinger. Beståtte, mislykkede og usikre sjekker skilles; samme funn telles ikke på nytt. Resultater beholdes i økten når dialogen lukkes og merkes som utdaterte når målet endres.
- Funn for responsivt design har enhetsdata, filtre, fremheving av selektorer/elementer og Markdown/JSON/HTML-eksport med angitt omfang. DOM-antall, mislykkede rammer og begrensede skanninger vises.
- Felles profilkort, zoom rundt midten, myke panel-/menyoverganger og støtte for redusert bevegelse. Panelknapper åpner/lukker; menyer lukkes ved klikk utenfor eller Escape.

Synkronisering av inndata/skjemaer/tastetrykk begrenses til samme origin. Innsamling og gjengivelse blokkeres for passord, engangskoder og betalingsfelt som gjenkjennes gjennom type, autocomplete og navn/ID. Forhåndsvisningen kontrolleres mot det faktiske overordnede arbeidsområdet, direkte iframe-identitet og bekreftet frame/document-registrering; meldinger opprettet av siden godtas ikke som bevis på tilknytning.

Lokale observasjoner er ikke Lighthouse-poeng eller Core Web Vitals fra virkelige brukere. Motoren gir ikke gjennomgang av hele nettstedet, DAST eller samsvarssertifisering. GEO-signaler garanterer ikke rangering eller synlighet i KI-tjenester. Ingen funn beviser ikke tilgjengelighetssamsvar; manuell vurdering og testing på ekte enheter er fortsatt nødvendig.

Chromium- og Firefox-pakkene er forskjellige. Chromium: pakk ut og last inn upakket via `chrome://extensions`; Firefox: last inn `manifest.json` midlertidig via `about:debugging`, som fjerner tillegget ved omstart. Permanent Firefox-installasjon krever en signert AMO-pakke. Les sikkerhetsdelen i [README](../README.md) om unntak for innramming, virkningen av service worker-opprydding for valgt nettsted og cookie-/innloggingsbegrensninger.
