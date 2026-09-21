# Pre-Production QA & Güvenilirlik Audit Raporu

**Proje:** ViewGrid (WebExtension Workspace & Static Site)  
**Tarih:** 21 Eylül 2026  
**HEAD Code Readiness:** CONDITIONALLY READY

---

## 1. QA Bulgu Listesi

### QA-01
- **Önem:** High (Yüksek)
- **Kod Kanıtı:** [`src/ui/workspace/store.ts:L140-L165`](file:///home/sinan/Downloads/workspace-01a0c2fe-b528-755f-81b6-e879ba6de225/src/ui/workspace/store.ts#L140-L165)
- **Üretim Etkisi:** `chrome.storage.local.set` çağrısı yerel depolama kotası dolduğunda veya yetki hatası oluştuğunda sessizce kalır. Kullanıcı cihaz ayarlarını kaydettiğini düşünür ancak tarayıcı yeniden başlatıldığında durum sıfırlanır.
- **Önce Reproduce:** Depolama kotası doluyken yeni preset eklendiğinde arayüz güncellenir ancak storage persistence başarısız olur ve hata uyarısı verilmez.
- **Sonra Reproduce:** Hata durumunda Toast uyarısı gösterilir (`"Depolama alanı dolu, ayarlar kaydedilemedi"`).
- **Düzeltme:** `saveToStorage` fonksiyonunda `chrome.runtime.lastError` yakalanmalı ve `st.showToast(...)` ile kullanıcı bilgilendirilmelidir.
- **Doğrulama Testi:** Storage set işleminin reddedildiği durumda Toast tetiklenmesini doğrulayan Vitest birim testi.

---

### QA-02
- **Önem:** Medium (Orta)
- **Kod Kanıtı:** [`src/ui/workspace/bridge.ts:L40-L75`](file:///home/sinan/Downloads/workspace-01a0c2fe-b528-755f-81b6-e879ba6de225/src/ui/workspace/bridge.ts#L40-L75) ve [`src/ui/workspace/CompareModal.tsx:L167-L189`](file:///home/sinan/Downloads/workspace-01a0c2fe-b528-755f-81b6-e879ba6de225/src/ui/workspace/CompareModal.tsx#L167-L189)
- **Üretim Etkisi:** Kısıtlayıcı COOP/XFO başlıklarına sahip sitelerde `cropToBlob` kırpma işlemi tainte olmuş canvas veya 0-byte blob üreterek ekran görüntüsü indirmesini sessizce bozabilir.
- **Önce Reproduce:** Geçersiz canvas alanından görüntü alındığında boş PNG dosyası inmektedir.
- **Sonra Reproduce:** Kırpma öncesi boyut doğrulaması yapılarak yetersiz veya boş görsellerde kullanıcıya anlaşılır hata mesajı verilir.
- **Düzeltme:** `cropToBlob` util'ine canvas genislik/yukseklik ve null blob kontrolü eklenmelidir.
- **Doğrulama Testi:** 0 genişlikli rect ile `cropToBlob` çağrıldığında Hata fırlatıldığını teyit eden birim testi.

---

### QA-03
- **Önem:** Medium (Orta)
- **Kod Kanıtı:** [`src/ui/workspace/App.tsx:L80-L120`](file:///home/sinan/Downloads/workspace-01a0c2fe-b528-755f-81b6-e879ba6de225/src/ui/workspace/App.tsx#L80-L120)
- **Üretim Etkisi:** Kullanıcı URL input kutusuna odaklanmışken veya cihaz arama çubuğunda metin yazarken klavye kısayolları (`D`, `R`, `1-9`) tetiklenebilir ve yazma deneyimini bozabilir.
- **Önce Reproduce:** URL kutusunda "domain" yazarken 'd' harfi dark theme toggle modunu açıp kapatır.
- **Sonra Reproduce:** Odaklanan eleman bir `input`, `textarea` veya `select` ise klavye kısayolu çalıştırılmaz.
- **Düzeltme:** Event listener handler'ına `if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;` engeli konulmalıdır.
- **Doğrulama Testi:** Input elemanında keydown tetiklendiğinde state değişiminin olmadığını gösteren Vitest testi.

---

### QA-04
- **Önem:** Low (Düşük)
- **Kod Kanıtı:** [`src/ui/workspace/store.ts:L85-L105`](file:///home/sinan/Downloads/workspace-01a0c2fe-b528-755f-81b6-e879ba6de225/src/ui/workspace/store.ts#L85-L105)
- **Üretim Etkisi:** Sadece tek bir görünür viewport varken kart sürükle-bırak işlemi yapıldığında dizi indeksi sınır dışına çıkabilir.
- **Önce Reproduce:** Tek elemanlı listede sürükleme yapıldığında listede undefined eleman kayması oluşur.
- **Sonra Reproduce:** Hedef indeks `Math.max(0, Math.min(idx, len - 1))` ile sınırlandırılır.
- **Düzeltme:** `reorderViewports` metoduna dizin sınır denetimi eklenmelidir.
- **Doğrulama Testi:** `layout.test.ts` içine tek elemanlı reorder sınır testi eklenmesi.
