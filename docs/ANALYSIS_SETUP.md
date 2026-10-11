# Analiz profilleri ve ücretsiz işletim sınırları

Doğrulama: 2026-10-11. Eklenti paket sürümü hâlâ1.0.3 geliştirme; mağazaya yayınlanmadı. Temel viewport/sync/compare/capture için sunucu veya Google hesabı gerekmez.

| Profil | Anahtar/hesap | Veri aktarımı ve koşul | Durum |
| --- | --- | --- | --- |
| Temel eklenti | Yok | Seçilen siteler doğrudan tarayıcıda | Chromium/Firefox yerel fixture testleri geçti |
| İsteğe bağlı PSI keyless | Anahtar yok | Kullanıcı onayıyla URL/profil/dil Google'a | Bu ortamda HTTP429; başarılı canlı servis engelli |
| Ayrı CrUX API | Google Cloud proje/API anahtarı | URL veya origin; aggregate p75 ve dönem | Ücretsiz150 sorgu/dakika/proje resmî belgeli, anahtar yok; çağrı yapılmadı |
| Yerel Lighthouse CLI | Google anahtarı/hesabı yok | Yerel Chrome/Chromium siteyi yükler | Alternatif araştırıldı; ViewGrid otomatik runner/server entegrasyonu henüz yok |
| Kullanıcı sunucusu | İsteğe bağlı | Sahip olunan sunucunun CPU/RAM/ağ/disk kaynakları | Tasarım profili; kurulmadı veya yayınlanmadı |

## Kamu API şartları

[PSI resmî başlangıç](https://developers.google.com/speed/docs/insights/v5/get-started) anahtarsız örnek içerir ve sık kullanımda anahtar önerir; sayfa sabit keyless günlük kota veya kesintisiz erişim garantisi vermez. Eski blog sayılarından garanti türetilmedi. Hesaba özgü kota gerekiyorsa kullanıcı kendi Cloud Console'unda kontrol eder. [Google API koşulları](https://developers.google.com/terms) ayrıca geçerlidir.

[CrUX resmî belge](https://developer.chrome.com/docs/crux/api) API anahtarını zorunlu kılar,150 sorgu/dakika/proje ücretsiz limitini ve ücretle artırılamadığını belirtir. Veri her URL için mevcut değildir. PSI CrUX alanları kaldırılabilecek olduğundan yalnız yanıtta bulunan saha verisi gösterilir; tarih/form factor yoksa bilinmiyor kaydedilir. TBT lab metrik, INP gerçek kullanıcı metrikidir; birbirinin yerine geçmez.

Bu projede keyless başarısızlığı sahte/örnek puanla doldurulmaz. Mock test fixture'ı `tests/fixtures/psi-response.json`; dosyada ve örnek raporda gerçek servis ölçümü olmadığı belirtilir. İstemciye key eklemek veya sırf key saklamak için ücretli proxy satın almak çözüm değildir.

## Lighthouse: kendi makinesi/sunucusu alternatifi

[Resmî Lighthouse deposu](https://github.com/GoogleChrome/lighthouse) Node CLI/programmatic kullanım, Chrome/Chromium gereksinimi, HTML/JSON çıktı ve Apache-2.0 lisansını belgeler. Güncel main `package.json` Node>=22.19 gerektirir; main sürümü yayımlanmış npm sürümü kabul edilmedi. Kurulumda seçilen release'in engines ve Chrome uyumluluğu kontrol edilip sürüm pinlenmelidir.

Basit manuel alternatif: Chrome DevTools Lighthouse panelini açın, mobile/desktop profiliyle rapor üretin ve HTML/JSON'u yerel kaydedin. Bu ViewGrid içinde otomatik runner desteği olarak sunulmaz. Linux headless CLI için resmî [headless Chrome kılavuzu](https://github.com/GoogleChrome/lighthouse/blob/main/docs/headless-chrome.md) izlenebilir; Node ve Chromium yüklendikten sonra seçilen pinli Lighthouse CLI `--help` ile doğrulanır. Bu aşamada global paket kurulmadı, Docker daemon veya production değiştirilmedi.

Platform: Chrome/Chromium bulunan Linux/macOS/Windows'ta CLI kullanılabilir; bu ortam yalnız Linux'tur. Firefox eklenti desteği Lighthouse motorunun Firefox ölçtüğü anlamına gelmez; Safari/gerçek cihaz sonucu değildir. Headless browser CPU ve bellek tüketir; bu projede gerçek benchmark yapılmadığından MB/çekirdek/saniye kapasite rakamı üretilmedi. İşler sıraya alınmalı, profile/engine/throttling/cihaz koşulları raporda saklanmalı; mevcut iframe yükünden bağımsız ayrı browser profile/process kullanılmalı.

Sunucu profili ileride gerekirse açık kaynak container/CLI, minimum privileges, browser sandbox korunması, timeout/queue/concurrency sınırı, Zod girdi doğrulaması, DNS+redirect boyunca SSRF/özel ağ engeli, yetkilendirme/rate limit, sansürlü log ve sınırlı retention gerektirir. Public keyless ölçüm endpointi kendiliğinden açılmaz. Browser sandbox'ını devre dışı bırakmak bu profil için kabul edilen çözüm değildir. Sunucunun elektrik/CPU/RAM/ağ/disk/backup/bakım maliyeti kullanıcınındır; ücretsiz yazılım sıfır işletim maliyeti değildir.

Yerel Lighthouse saha CrUX geçmişini üretmez. Çerezli/localhost hedefleri ölçmek ayrı yetki ve izolasyon gerektirir; mevcut public URL analizinden otomatik açılmaz. Anahtar gerekiyorsa yalnız kullanıcı sunucusunun environment secret'ı; istemci/log/rapor içinde bulunmaz. BYO-key seçeneği mevcut değil.

## Kullanım ve veri saklama

Performance alanında hedef public URL ve profil seçilir, dış gönderim onayı verilir. Kota/timeout/iptal ayrı gösterilir; eski sonuç yeni URL sonucuymuş gibi sunulmaz. Analiz geçmişi20 kayıt/256KiB sınırlıdır, silinebilir. Exportlar query ve içerik detaylarını sansürler; PDF tarayıcının yazdır/PDF kaydet akışıdır. Her raporda kaynak, engine, tarih, koşullar, lab/field ayrımı ve atlanan kontroller görünmelidir.

Yeni runtime bağımlılığı Zod4.6.5 (MIT); [bildirim](../THIRD_PARTY_NOTICES.md). Lighthouse yalnız araştırıldı, bağımlılık olarak eklenmedi.
