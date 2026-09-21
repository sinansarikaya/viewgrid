# Deployment & Operasyonel Erişilebilirlik Audit Raporu

**Proje:** ViewGrid (WebExtension & Landing/Docs Site)  
**Tarih:** 21 Eylül 2026  
**Karar:** KOŞULLU HAZIR

---

## 1. Dağıtım ve Mimari Özet

- **Yazılım Tipi:** %100 İstemci Taraflı WebEklentisi (Browser Extension - Chromium/Firefox) + Statik Dokümantasyon/Tanıtım Sitesi.
- **Veritabanı / Backend:** Sunucu tarafı veritabanı, microservice, Docker konteyneri veya veritabanı migration gereksinimi **yoktur**. Tüm veriler tarayıcı içi `chrome.storage.local` / `browser.storage.local` üzerinde tutulur.
- **CI/CD Pipeline'ları:**
  1. `.github/workflows/ci.yml`: Tip kontrolü (`tsc`), birim testler (`vitest`) ve eklenti paket derlemelerini (`dist/firefox`, `dist/chromium`) doğrular.
  2. `.github/workflows/deploy-website.yml`: GitHub Pages ortamına statik web sitesini otomatik dağıtır.

---

## 2. Dağıtım Bulgu Listesi

### DEP-01
- **Önem:** Medium (Orta)
- **Kanıt:** [`.github/workflows/deploy-website.yml:L39-L42`](file:///home/sinan/Downloads/workspace-01a0c2fe-b528-755f-81b6-e879ba6de225/.github/workflows/deploy-website.yml#L39-L42)
- **Olası Kesinti / Veri Kaybı Etkisi:** Deploy pipeline'ında `setup-node` adımı `cache: 'npm'` olarak yapılandırılmış ve `npm ci` komutu kullanılmaktadır. Ancak ana projede paket yöneticisi `pnpm` (`pnpm-lock.yaml`) olduğundan CI üzerinde paket bağımlılık uyumsuzlukları veya derleme hataları oluşabilir.
- **Düzeltme:** `deploy-website.yml` dosyası `ci.yml` dosyasındaki gibi `pnpm/action-setup@v3` ve `pnpm install --frozen-lockfile` adımları ile güncellenmelidir.
- **Rollback Adımı:** Workflow dosyasında yapılan değişikliğin `git revert` ile geri alınması.
- **Doğrulama Adımı:** GitHub Actions sekmesinde `Deploy ViewGrid Website` iş akışının tetiklenerek 0 hata ile yeşil tamamlanması.

---

### DEP-02
- **Önem:** Low (Düşük)
- **Kanıt:** `.github/workflows/` dizininde otomatik release yükleme iş akışının olmaması.
- **Olası Kesinti / Veri Kaybı Etkisi:** Etiket (`v*`) basıldığında Firefox ve Chromium eklenti zip paketlerinin GitHub Releases sekmesine otomatik yüklenmemesi, manuel sürüm yayınlama sırasında insan hatası riskine yol açabilir.
- **Düzeltme:** Etiket oluşturulduğunda (`on: push: tags: ['v*']`) `pnpm build:all` çalıştırıp `dist/firefox` ve `dist/chromium` paketlerini otomatik ZIP haline getirip GitHub Release etiketine ekleyen bir `.github/workflows/release.yml` workflow'u eklenmelidir.
- **Rollback Adımı:** Oluşturulan release etiketinin GitHub UI üzerinden silinmesi.
- **Doğrulama Adımı:** Yeni bir sürüm etiketi (`git tag v0.1.1 && git push origin v0.1.1`) ile GitHub Releases sekmesinde varlıkların otomatik oluştuğunun teyit edilmesi.

---

### DEP-03
- **Önem:** Low (Düşük)
- **Kanıt:** [`website/index.html`](file:///home/sinan/Downloads/workspace-01a0c2fe-b528-755f-81b6-e879ba6de225/website/index.html) ve [`website/docs/index.html`](file:///home/sinan/Downloads/workspace-01a0c2fe-b528-755f-81b6-e879ba6de225/website/docs/index.html)
- **Olası Kesinti / Veri Kaybı Etkisi:** Statik GitHub Pages dağıtımında sunucu seviyesi özel HTTP yanıt başlıkları tanımlanamadığından istemci tarafı Content Security Policy (CSP) katmanının olmaması güvenlik standartları açısından eksikliktir.
- **Düzeltme:** Statik HTML dosyalarının `<head>` etiketlerine varsayılan güvenlik ilkelerini tanımlayan `<meta http-equiv="Content-Security-Policy" content="...">` başlığı eklenmelidir.
- **Rollback Adımı:** İlgili meta etiket satırının kaldırılması.
- **Doğrulama Adımı:** Tarayıcı geliştirici konsolunda CSP ihlal uyarısı vermeden sitenin sorunsuz yüklendiğinin doğrulanması.
