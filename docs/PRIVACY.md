# ViewGrid privacy — version 1.0.3

ViewGrid does not send analytics, crash reports, screenshots, issue results or workspace settings to a ViewGrid server. There is no cloud proxy, account service or AI provider integration in this release.

## 2026-10-11 geliştirme profili: isteğe bağlı analiz

Temel responsive çalışma alanı sunucusuz çalışır. Yeni Performance eylemi yalnız kullanıcının açık onayıyla hedef herkese açık URL'yi, seçilen mobile/desktop profilini ve dili Google PageSpeed Insights'a gönderir. Google ayrıca isteğin IP/ağ metadatasını görebilir; kullanıcı sitesi kendi ağ isteklerini üretir. Workspace çerezleri, oturum credential'ları veya API anahtarı gönderilmez. Local/private hedefler desteklenmez; hostname denetimi DNS çözümlemesi yapmaz ve internet domaininin özel IP'ye çözülmesini garantiyle tespit edemez. Hassas query parametrelerini göndermeden önce URL'yi temizleyin.

Hiçbir zorunlu ücretli servis, ViewGrid proxy/SaaS, telemetri veya dış AI sağlayıcısı eklenmez. Anahtar girme/saklama ekranı yok; anahtar paket, istemci, Git, log veya görsele yazılmaz. İsteğe bağlı gelecekteki kullanıcı sunucusu profilinin anahtarı yalnız sunucu environment'ında tutulmalıdır.

Analiz geçmişi cihazdaki extension storage içinde en fazla20 kayıt ve256KiB sınırıyla saklanır. Geçmiş/analiz dışa aktarımında query/fragment, kullanıcı ajanı ve etkilenen öğenin metin/selector/snippet içeriği çıkarılır; raporda redaction bilgisi tutulur. Başarısız/iptal sonuçlar sıfır puan yapılmaz. Geçmiş silme ile bu kayıtlar kaldırılır; indirilen HTML/JSON/PDF dosyaları ayrıca kullanıcı tarafından silinmelidir. Eski Issues raporu ve viewport capture çıktıları farklıdır; paylaşmadan içerik/URL kontrolü gerektirir.

Gerçek Google ölçümü bu ortamda kota/anahtar engellidir. Kontrollü test örnekleri mock olarak etiketlidir. Kurulum/servis seçenekleri ve maliyet sınırları: [Analiz kurulumu](ANALYSIS_SETUP.md).

## Data on your device

- `storage.local`: workspace URLs, saved workspaces, custom devices, language, theme and shortcut preferences.
- `storage.session`: active frame routing needed when the extension background restarts.
- Workspace memory: scan results, element text snippets/selectors, page URLs and measured dimensions. Results are cleared when viewport configuration changes.
- Downloads/clipboard: screenshots and issue reports only when you request export/copy. A report can contain page URLs, visible text and selectors; review it before sharing.

Previews load your selected websites directly. Those sites make ordinary browsing requests and apply their own privacy policies. Zero extension telemetry does not mean the websites themselves make no network requests.

## Permissions and isolation

Host access allows the content agent to synchronize and inspect preview frames. Storage saves preferences; tabs identifies workspaces; downloads exports files; context menus opens a selected page/link. Framing permissions are used within verified workspace tabs.

Firefox removes XFO and CSP frame-ancestors while retaining other response policy directives. Chromium cannot edit an individual CSP directive using DNR, so CSP response headers are removed on subframes in workspace tabs, including nested frames and page-initiated navigations. Normal tabs are outside the exception. Firefox scopes its exceptions to direct previews.

Before loading a preview, ViewGrid waits for tab-scoped framing rules and removes service-worker registrations only for the selected site's origin (Chromium) or hostname (Firefox). This can also remove that site's worker registrations used by normal tabs; a normal visit can register them again. Cookies, localStorage, sessionStorage, IndexedDB and CacheStorage are not requested for removal, and no browser-wide cache cleanup is used. Preview agents prevent worker re-registration after workspace verification. Preview documents bypass stale HTTP cache headers. Browser third-party cookie and authentication policies still apply.

Delete saved workspaces through the workspace menu; uninstalling the extension clears its browser-managed extension storage. Exported downloads and clipboard contents are under your control and are not removed by uninstalling.

Questions: [GitHub issues](https://github.com/sinansarikaya/viewgrid/issues).
