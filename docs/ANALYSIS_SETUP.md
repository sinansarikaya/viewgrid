# ViewGrid yerel analiz — 1.0.3

2026-10-14: Analiz ekranı artık ViewGrid'in eklentiye paketlenen yerel motorunu kullanır. Google PageSpeed, CrUX, ücretli servis, API anahtarı, CDN veya ayrı yardımcı uygulama gerekmez. Lighthouse ve ZAP çalıştırılmaz.

## Kullanım

1. Hedef HTTP/HTTPS sayfasını çalışma alanında açın ve yüklenmesini bekleyin. localhost ve yerel ağ adresleri desteklenir.
2. Yerel Performans veya SEO & Erişilebilirlik ekranını açın.
3. Mobil, masaüstü veya ikisini seçip analizi başlatın. Dokunmatik profil mobil grubundadır; gerçek görünüm boyutu sonuçta gösterilir. Her profil için eşleşen ilk açık görünüm incelenir; gizli veya küçültülmüş görünümler taranmaz.
4. Bulguları, GEO kontrol listesini ve yerel raporu inceleyin. HTML/JSON dışa aktarımı ve tarayıcının PDF yazdırması kullanılabilir.

Hedef başka bir adrese yönlendiyse son adresi kullanın. Açık görünüm olmayan adresler arka planda yüklenmez. Site izni, hazır olmayan görünüm, eksik profil ve yanlış hedef ayrı açıklanır. Bir profil başarısız olduğunda diğer başarılı sonuç korunur.

## Kontroller ve ölçüm sınırları

- ViewGrid kuralları: title, meta description, canonical URL sözdizimi, viewport, başlık sırası, ana içerik bölgesi, bağlantı adları/URL'leri, görsel alt öznitelikleri, robots meta, hreflang sözdizimi/self referans ve JSON-LD sözdizimi/temel yapı.
- Paketlenen axe-core 4.11.0: düğme/giriş/seçim adları, form etiketleri, ARIA öznitelikleri/rolleri, belge dili ve ARIA kimlik referanslarından oluşan sabit 12 kural. Kontrast, gölge DOM, iç içe frame'ler ve tüm WCAG kapsamı bu sınırlı taramanın garantisi değildir.
- Yerel performans: tarayıcının verdiği Navigation Timing (TTFB, DOMContentLoaded, load), gözlenen kaynak sayısı ve varsa FCP. Bunlar yüklenen önizlemenin gözlemleridir; yeni sayfa yüklemesi veya bağımsız laboratuvar testi değildir. Sayfanın mevcut önbelleği, frame bağlamı ve cihaz yükü sonucu etkiler.
- Lighthouse puanı, LCP/CLS/Speed Index/TBT ve CrUX p75 metrikleri hesaplanmaz; eksik veriler sıfır yapılmaz. GEO sonuçları sıralama veya AI görünürlüğü garantisi değildir.
- Robots.txt, sitemap, karşılıklı hreflang, HTTP güvenlik başlıkları, site genelinde crawl ve DAST çalıştırılmaz. ViewGrid'in değiştirdiği iframe başlıklarından güvenlik sonucu çıkarılmaz; bu kontroller manuel olarak belirtilir.

## Kaynak bütçesi ve gizlilik

Motor yalnız analiz başlatıldığında seçili frame'e yüklenir. Profiller sırayla çalışır; aynı frame'de aynı anda tek iş yürütülür. Normal gezintide DOM taraması veya axe işi başlamaz.

DOM yürüyüşü en fazla 2.000 öğe, 6.000 düğüm ve 100.000 karakterle sınırlıdır; 100 düğümde bir tarayıcıya işlem sırası bırakılır. JavaScript/CSS gövdeleri tarama metin bütçesine dahil edilmez. Etkilenen öğeler 20 kayıtla sınırlıdır. Kapsam aşılırsa eksik kontroller bilinmiyor olarak gösterilir ve axe taraması atlanır.

Axe beklemesi 1,5 saniye, profil beklemesi varsayılan 12 saniyeyle sınırlıdır. İptal sonuçları geçersiz kılar ve DOM yürüyüşünü durdurur; başlamış axe çalışması zorla öldürülemez, bitene kadar aynı kolektörde yeni axe işi açılmaz. Tamamlanmayan kontrol başarılı sayılmaz.

Analiz servisine hiçbir URL/HTML gönderilmez; axe kaynak ön yüklemesi kapalıdır. Siteler kendi normal ağ isteklerini yapabilir. Form değerleri, HTML parçaları, kişisel metinler veya axe hedef seçicileri analiz sonucuna eklenmez. Geçmiş 20 kayıt/256 KiB ile sınırlıdır; sorgu/fragment, kullanıcı ajanı ve öğe içeriği dışa aktarımda sansürlenir. Kullanıcının ayrıca eklediği ekran görüntüsünün pikselleri otomatik sansürlenmez.

Eski Google/Lighthouse kayıtları korunur ve harici kaynak olarak etiketlenir; yeni yerel sonuçlarla aynı motor gibi karşılaştırılmaz. Eski PSI istemci/birim testleri tarihsel uyumluluk içindir; paketlenmiş arayüz bunları çağırmaz.

## Dağıtım

Firefox ve Chromium paketleri ayrı üretilir. axe-core MPL-2.0 ve üçüncü taraf bildirimleri paketle birlikte korunur; kaynak bağlantısı ve tam lisans metni `THIRD_PARTY_NOTICES.md` ve `licenses/axe-core-MPL-2.0.txt` içinde bulunur. Kullanıcıya npm/Node/Docker kurulumu yaptırılmaz.

Bu makinede Chromium ve Firefox gerçek görünür eklenti testleri yerel fixture üzerinde çalıştırıldı. Dış servisler engellendi; analiz sırasında dış istek gözlenmedi. Bu kanıt Windows/macOS, gerçek telefon, Safari veya tüm internet siteleri için doğrulama değildir. Kanıt dizini: `test-results/local-analysis/`.
