# ViewGrid ikon envanteri

## Başlangıç ve karar

Erişilebilen iki önceki kullanıcı ekranı (`/tmp/codex-clipboard-HSjQRA.png`, `/tmp/codex-clipboard-vCkapT.png`) ayrıca görsel olarak incelendi: karışık emoji/simgeler, Fit etiketi aralığı, sidebar sıkışması, farklı cihazlarda ortak50%displayzoom ile alt kartların ekran dışına uzaması ortak sorunlardı. Bu dosyalarda gerçek browserzoom metadata'sı yok;80/100/125 değerleri referanslara yakıştırılmadı, yeni gerçek tarayıcı matrisiyle ölçüldü. Son mesajda yeni farklı ikili varsa bu ekler ayrıca erişilemedi; görülmüş gibi sunulmaz.

Önceki arayüz cihaz/sekme/capture/ayar/fit araçlarında emoji, Unicode metin sembolleri ve yerel SVG karıştırıyordu. Kurulu bağımlılıklarda ikon kütüphanesi yoktu. Yeni paket kurmadan ortak `Icon` bileşenine yerel 24×24 SVG çizimleri toplandı: currentColor, 2px stroke, yuvarlak uç/birleşim, varsayılan 16px ve küçülmeyen optik kutu. Feather MIT / Lucide ISC bildirimleri THIRD_PARTY_NOTICES.md üzerinden iki dağıtıma kopyalanır.

| Alan | Kontroller / ikon karşılığı |
| --- | --- |
| Üst çubuk | Geri/ileri okları, reload, cache çöp kutusu, Local masaüstü, Capture kamera, dil globe, tema güneş/ay, ayarlar dişli, menü |
| Sidebar | Devices telefon, Tools anahtar, Sync döngü okları, Workspace klasör; reorder okları, görünürlük göz, cihaz kategorileri |
| Yerleşim | Grid/Row/Column/Freeform SVG; Auto Align grid, Fit dört köşe |
| Kart | Drag tutacağı, cihaz kategorisi, yön değiştirme, capture, taşma menüsü; duplicate/copy, minimize/restore, hide, remove |
| Diğer | Compare terazi, Figma palet, Issues arama, modal kapatma, favori yıldızı; semantik durum işaretleri |

Sayılar, DPR, CSS ölçüleri ve klavye kısayolu karakterleri ikon değildir; anlamlı metin olarak korunur. SVG dekoratiftir; düğmenin görünür etiketi veya aria-label erişilebilir isim sağlar. Ortak Tooltip hover ve focus ile açılır, Escape ile kapanır, tooltip üzerine taşınabilir. Fit yalnız gösterim ölçeğini değiştirir; gerçek iframe CSS boyutları ve kaydedilmiş kullanıcı zoom'u değişmez.

## Boyut ve yükleme

Yeni npm bağımlılığı/lockfile değişikliği yok. Harici ikon fontu/asset isteği yok. Yerel switch alt kümesi bütün ikon kütüphanesi değildir; switch içindeki tek tek dalların tree-shaking ile çıkarıldığı iddia edilmez. Başlangıç HEAD d84d8f4 workspace JS:391101byte/119558gzip; güncel workspace-CLkW8qqw.js:410148byte/123843gzip. Tüm polish paketinin farkı19047byte/4285gzip (yalnız ikon maliyeti değildir). Icon.tsx kaynağı15433byte. Ölçüm Node gzipSync ile aynı koşullarda yapıldı.
