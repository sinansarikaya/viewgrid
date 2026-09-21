# SEO Audit Raporu (Teknik SEO, On-Page SEO, i18n & Structured Data)

**Proje:** ViewGrid Landing Page & Documentation Site (`website/`)  
**Tarih:** 21 Eylül 2026  
**Genel Karar:** Fair (Geliştirilebilir)

---

## 1. Route ve Indekslenebilirlik Matrisi

| Route | Canonical | Hreflang | JSON-LD | Meta Title / Description | Status / Index |
|---|---|---|---|---|---|
| `/` | `https://viewgrid.sinansarikaya.dev/` | ❌ Eksik | ❌ Eksik | ✅ Mevcut | 200 OK / Indexable |
| `/docs/` | `https://viewgrid.sinansarikaya.dev/docs/` | ❌ Eksik | ❌ Eksik | ✅ Mevcut (OG mevcut) | 200 OK / Indexable |
| `/privacy/` | `https://viewgrid.sinansarikaya.dev/privacy/` | ❌ Eksik | ❌ Eksik | ✅ Mevcut (OG mevcut) | 200 OK / Indexable |
| `/support/` | `https://viewgrid.sinansarikaya.dev/support/` | ❌ Eksik | ❌ Eksik | ✅ Mevcut (OG mevcut) | 200 OK / Indexable |

---

## 2. SEO Bulgu Detayları

### SEO-01
- **Önem:** High (Yüksek)
- **Etkilenen Route / Sayfa:** `/` (`website/index.html`)
- **Kanıt Türü:** Kaynak (`website/index.html:L1-L20`)
- **Etki:** Ana sayfada Open Graph (`og:title`, `og:image`, `og:description`, `og:url`) ve Twitter Card etiketleri bulunmadığından sosyal medya ve mesajlaşma platformlarında paylaşım kartı görsel ve özet içermez. Tıklama oranını olumsuz etkiler.
- **Önerilen Düzeltme:** `<head>` içerisine Open Graph ve Twitter Card meta etiketleri eklenmelidir.
- **Doğrulama Adımı:** Render edilen `index.html` head etiketi veya metatags.io kontrol edilmelidir.

---

### SEO-02
- **Önem:** High (Yüksek)
- **Etkilenen Route / Sayfa:** Tümü (`/`, `/docs/`, `/privacy/`, `/support/`)
- **Kanıt Türü:** Kaynak (`website/index.html`, `website/docs/index.html`)
- **Etki:** Arama motorlarının ViewGrid'i bir tarayıcı eklentisi/yazılım ürünü olarak algılamasını sağlayan `SoftwareApplication` şeması eksiktir. Google Zengin Sonuçlar'da (Rich Snippets) kategori ve fiyat bilgisi görüntülenemez.
- **Önerilen Düzeltme:** Ana sayfaya `<script type="application/ld+json">` formatında `SoftwareApplication` / `WebApplication` JSON-LD tanımı eklenmelidir.
- **Doğrulama Adımı:** Google Rich Results Test aracı ile şema doğrulanmalıdır.

---

### SEO-03
- **Önem:** Medium (Orta)
- **Etkilenen Route / Sayfa:** Tümü (`/`, `/docs/`, `/privacy/`, `/support/`)
- **Kanıt Türü:** Kaynak (`website/public/sitemap.xml`, `website/src/App.tsx`)
- **Etki:** Uygulamada Türkçe ve İngilizce dil seçenekleri sunulmasına karşın, HTML head ve sitemap içerisinde `hreflang="en"`, `hreflang="tr"` ve `hreflang="x-default"` alternatif bağlantıları bulunmamaktadır.
- **Önerilen Düzeltme:** `sitemap.xml` veya `<head>` etiketlerine dil alternatifleri tanımlanmalıdır.
- **Doğrulama Adımı:** Google Search Console veya sitemap doğrulayıcısı ile `hreflang` grubunun kontrolü.

---

### SEO-04
- **Önem:** Medium (Orta)
- **Etkilenen Route / Sayfa:** `/` (`website/index.html`)
- **Kanıt Türü:** Kaynak (`website/index.html`)
- **Etki:** Görsel elemanlarında açık `width` ve `height` niteliklerinin eksikliği nedeniyle tarayıcı yükleme aşamasında düzen kaymaları (CLS - Cumulative Layout Shift) oluşabilir.
- **Önerilen Düzeltme:** Tüm `<img>` etiketlerine genişlik/yükseklik verilmeli, ekran altı görsellere `loading="lazy"` eklenmelidir.
- **Doğrulama Adımı:** Lighthouse Web Vitals ölçümü ile CLS < 0.1 olduğu teyit edilmelidir.

---

### SEO-05
- **Önem:** Low (Düşük)
- **Etkilenen Route / Sayfa:** Alt Sayfalar (`/docs/`, `/privacy/`, `/support/`)
- **Kanıt Türü:** Kaynak (`website/public/sitemap.xml`)
- **Etki:** Sitemap URL'leri taksim işaretiyle sonlanırken (`/docs/`), taksimsiz URI isteklerinin 301 yönlendirmesiyle eşleştirildiğinden emin olunmalıdır (çift içerik önleme).
- **Önerilen Düzeltme:** Sunucu seviyesinde URL normalizasyonu (trailing slash redirect) 301 kuralı ile sabitlenmelidir.
- **Doğrulama Adımı:** HTTP 301 response header ve canonical URL uyuşmasının test edilmesi.

---

## 3. Core Web Vitals Notu
*Mevcut ortamda canlı Lighthouse performans sunucusu çalıştırılmadığından CWV değerleri (LCP, CLS, INP) tahmin edilmemiş, **"Ölçülmedi"** olarak işaretlenmiştir.*
