import React, { useEffect } from 'react';
import { useStore } from './store';
import s from './BenchmarkModal.module.css';
export function BenchmarkModal() {
  const st = useStore(), tr = st.language === 'tr';
  useEffect(() => { const close = (e: KeyboardEvent) => { if (e.key === 'Escape') st.setBenchmarkOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [st]);
  if (!st.benchmarkOpen) return null;
  return <div className={s.overlay} onClick={() => st.setBenchmarkOpen(false)}><div className={s.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
    <div className={s.header}><strong>{tr ? 'Çalışma biçimi ve sınırlar' : 'Runtime and limitations'}</strong><button onClick={() => st.setBenchmarkOpen(false)}>✕</button></div>
    <div className={s.body}>
      <p>{tr ? 'Önizlemeler yerel tarayıcıda çalışır. Bellek ve hız, sayfanın içeriğine ve açık ekran sayısına bağlıdır. Bu panel canlı performans ölçümü yapmaz.' : 'Previews run in your local browser. Memory and speed depend on page content and the number of viewports. This panel does not measure live performance.'}</p>
      <p>{tr ? 'Normal sekmeler ve iç içe üçüncü taraf iframe’ler başlık istisnalarının dışında kalır. Chromium, yalnızca doğrudan ViewGrid önizlemelerinde XFO ve CSP başlıklarını kaldırır. Firefox diğer CSP yönergelerini koruyarak yalnızca frame-ancestors kısıtlamasını kaldırır.' : 'Normal tabs and nested third-party frames are outside the framing exceptions. Chromium removes XFO and CSP headers only for direct ViewGrid previews. Firefox preserves other CSP directives while removing frame-ancestors.'}</p>
      <p>{tr ? 'Site çerezleri, localStorage ve service worker kayıtları otomatik silinmez. Tarayıcının üçüncü taraf çerez ve oturum kuralları geçerlidir; bazı giriş akışları ayrı sekme gerektirir.' : 'Site cookies, localStorage and service worker registrations are not automatically deleted. Browser third-party cookie and authentication policies still apply; some sign-in flows need a separate tab.'}</p>
      <p>{tr ? 'Cihaz profilleri CSS ekran boyutunu gösterir. Gerçek telefon donanımı, mobil tarayıcı motoru veya cihaz DPR değeri taklit edilmez.' : 'Device profiles set CSS viewport dimensions. They do not emulate phone hardware, a mobile browser engine or the device DPR.'}</p>
    </div>
  </div></div>;
}
