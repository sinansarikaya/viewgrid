# Kararlar

## Öncelikli ürün ve barındırma kararı — 2026-10-11

- ViewGrid ücretsiz/açık kaynak (mevcut MIT) kalır. Zorunlu kullanıcı başı lisans, ücretli API/SaaS/barındırma yok. Temel responsive test, sync, capture, compare sunucusuz çalışır; analiz isteğe bağlıdır.
- PSI yalnız açık kullanıcı eylemi/onayıyla anahtarsız kamu endpointine gider. Bu ortamda 429 nedeniyle güvenilir canlı ölçüm doğrulanmadı. Kullanıcı anahtar/proxy olmadığını doğruladı ve gerçek servis testini engelli kaydetmemizi istedi.
- Dağıtılan bundle, istemci, repo, log ve screenshot'a anahtar konmaz. BYO-key ekranı uygulanmaz. Gelecekte anahtarlı ortak kullanım ancak kullanıcının güvenli sunucusunda environment secret ve yetkilendirilmiş endpoint ile olabilir; ücretli proxy/SaaS gerekmez. Anahtarın Google'a gönderilmesi gerektiği için “anahtar hiçbir ağ isteğinde gönderilmez” şartını literal karşılayan bir API-key çağrısı mümkün değildir; bu sürüm böyle seçenek sunmaz.
- CrUX resmî olarak ücretsiz, proje başına 150 sorgu/dakika; Cloud API anahtarı gerekli, ücretle kota artırımı yok. PSI'nin güncel başvuru sayfası keyless erişimi gösterir fakat garantili anahtarsız kota sayısı yayınlamaz; doğrulanmamış günlük limit/maliyet garantisi vermiyoruz. Ayrıntılar `docs/ANALYSIS_SETUP.md`.
- Açık kaynak Lighthouse (Apache-2.0) yerel/kendi sunucusunda alternatiftir; Chrome/Chromium ve Node gerekir. Bu aşamada kurulum/işletim/güvenlik profili araştırılır, public measurement server otomatik kurulmaz/yayınlanmaz. Yazılım ücretsiz olsa da CPU/RAM/ağ/disk/elektrik/bakım maliyeti sıfır değildir. Saha CrUX verisini yerel Lighthouse üretmez.
- Yeni Zod 4.6.5 MIT lisanslıdır; mevcut MIT proje ile uyumlu dağıtım bildirimi `THIRD_PARTY_NOTICES.md` içinde korunur.

- 2026-10-11: Tasarım referansı koyu lacivert/cyan shell, sol panel ve düzenli kart yönüdür. Görselin v1.5.0 etiketi erken sürüm yükseltme gerekçesi değildir; örnek içerik, yazım hataları veya ölçekleri kopyalanmaz.
- Mevcut tema/dil/ayarlar korunur; ek ayarlar geriye uyumlu varsayılanlarla yüklenir. CSS viewport ölçüsü ile görsel zoom ayrı kalır.
- Model Codex gpt-6.1-sol; normal uygulama medium, mimari/sync/ölçüm high. Lider canlı effort değiştirilemiyorsa açıkça kaydedilir. Antigravity seçili Gemini 3.8 Flash (Medium); gerçek backend kimliği doğrulanamadı.
- Lider dahil ortak üç yürütücü; Antigravity alt ajan açmaz. Her paket için dosya sahipliği açık; commit/entegrasyon liderde.
- Eski tanıtım girişiminin uygulama değişikliklerini dışlayan sınırı yalnız o tarihsel girişim içindir; yeni kullanıcı kapsamı ürün geliştirmesini yetkilendirir.
- Mağaza sürümü doğrulanmadı; paket sürümü package.json/üretilen manifest ile doğrulanır. UI sürümü runtime manifest kaynağından gelir.
- PSI laboratuvar ölçümü preview iframe yükünden bağımsızdır; CrUX saha verisi ayrı. API başarısızlığı veya eksik veri sıfır puan değildir. Otomatik SEO/a11y/GEO bulguları tam uygunluk veya görünürlük garantisi değildir.
- Resmî API kontrolü: [PSI başlangıç](https://developers.google.com/speed/docs/insights/v5/get-started), [runPagespeed sözleşmesi](https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed), [CrUX API](https://developer.chrome.com/docs/crux/api), [TBT](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time). PSI keyless çağrıyı destekler; sık kullanım için anahtar önerilir. PSI CrUX verisi kaldırılabileceğinden URL/origin/dönemi olmayan yanıt uydurulmaz; ayrı CrUX API anahtar gerektirir.
- 2026-10-11 keyless gerçek PSI denemesi (`https://example.com`, mobile/performance/seo/accessibility) HTTP429 döndü; başarılı gerçek ölçüm doğrulanmadı. İlk yanıt dosyası önceki test çıktı dizini temizliği sırasında kayboldu; bu dosya mevcut kanıt olarak gösterilmez. Gizli API anahtarı istemci paketine gömülmeyecek; erişim olmadığında UI/mock/normalizasyon/rapor geliştirmesi bağımsız devam eder.
- Güncel tekrar da HTTP429: `test-results/development/psi-keyless-current-status.txt` ve `psi-keyless-current-response.json`. Bu bir başarısız canlı erişim kanıtıdır, başarılı performans ölçümü değildir.
