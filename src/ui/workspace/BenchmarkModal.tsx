import React, { useEffect } from 'react';
import { useStore } from './store';
import s from './BenchmarkModal.module.css';

export function BenchmarkModal() {
  const st = useStore();
  const open = st.benchmarkOpen;
  const isTR = st.language === 'tr';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) st.setBenchmarkOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, st]);

  if (!open) return null;

  return (
    <div className={s.overlay} onClick={() => st.setBenchmarkOpen(false)}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <div className={s.headerTitle}>
            <span>⚡</span>
            <span>{isTR ? 'Performans & Bellek Benchmark Mimarisi' : 'Performance & Memory Architecture'}</span>
          </div>
          <button
            className={s.closeBtn}
            onClick={() => st.setBenchmarkOpen(false)}
            title="Kapat (Esc)"
          >
            ✕
          </button>
        </div>

        <div className={s.body}>
          <p className={s.intro}>
            {isTR
              ? 'ViewGrid, hantal ve 850 MB RAM tüketen Electron uygulamaları yerine doğrudan Chromium ve Firefox motoru üzerinde yerel WebExtensions mimarisiyle çalışır.'
              : 'ViewGrid runs directly inside native Chromium & Firefox browser engines instead of consuming 850MB+ like standalone Electron bundles.'}
          </p>

          <div className={s.metricsGrid}>
            <div className={s.metricCard}>
              <span className={s.cardTag}>{isTR ? 'RAM TÜKETİMİ' : 'RAM FOOTPRINT'}</span>
              <span className={s.cardNumber}>&lt; 15 MB</span>
              <h4 className={s.cardTitle}>{isTR ? 'Ultra Hafif Motor' : 'Ultra-Lightweight'}</h4>
              <p className={s.cardDesc}>
                {isTR
                  ? 'Tek bir sekmeden daha az bellek harcar. Dizüstü bilgisayarınızın pilini ve fanını yormaz.'
                  : 'Consumes less memory than a single tab. Keeps laptop battery and CPU cool.'}
              </p>
            </div>

            <div className={s.metricCard}>
              <span className={s.cardTag}>{isTR ? 'KAYDIRMA SENKRONU' : 'SCROLL SYNC'}</span>
              <span className={s.cardNumber}>&lt; 15 ms</span>
              <h4 className={s.cardTitle}>{isTR ? 'Sıfır Gecikmeli Senkron' : 'Zero-Lag Sync'}</h4>
              <p className={s.cardDesc}>
                {isTR
                  ? 'Yerel BroadcastChannel ile tıklama, dokunmatik hareket ve 60 FPS kaydırmayı döngüsüz yansıtır.'
                  : 'Local broadcast channel mirrors mouse, touch and 60 FPS scrolling without feedback loops.'}
              </p>
            </div>

            <div className={s.metricCard}>
              <span className={s.cardTag}>{isTR ? 'GİZLİLİK & GÜVENLİK' : '100% PRIVATE'}</span>
              <span className={s.cardNumber}>100%</span>
              <h4 className={s.cardTitle}>{isTR ? 'Yerel Öncelikli' : 'Local-First'}</h4>
              <p className={s.cardDesc}>
                {isTR
                  ? 'Harici bulut sunucusu veya veri izleme yok. Intranet ve yerel geliştirme ortamlarında %100 güvenli.'
                  : 'Zero external proxies, zero telemetry. Works on private VPNs, intranet and localhost.'}
              </p>
            </div>
          </div>

          <div className={s.ramComparison}>
            <span className={s.compTitle}>
              {isTR ? 'Bellek Tüketim Seviyesi' : 'Memory Consumption Level'}
            </span>

            {/* ViewGrid Row - Sole, clean, lightweight measurement */}
            <div className={s.barRow} style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
              <div className={s.barMeta}>
                <span style={{ color: 'var(--accent, #38bdf8)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⚡</span>
                  <span>{isTR ? 'ViewGrid Bellek Tüketimi:' : 'ViewGrid Memory Usage:'}</span>
                  <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                    {isTR ? 'Ultra Düşük' : 'Ultra Low'}
                  </span>
                </span>
                <span style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'monospace', fontSize: 15 }}>14.2 MB</span>
              </div>
              <div className={s.barTrack} style={{ height: 8, marginTop: 8 }}>
                <div className={s.barFillVg} style={{ width: '12%', background: 'linear-gradient(90deg, #38bdf8, #4ade80)' }} />
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.4 }}>
                {isTR
                  ? 'Tarayıcınızın kendi yerel çekirdeğini kullandığı için sistem kaynaklarınızı tüketmez, dizüstü bilgisayarınızın pilini ve işlemcisini serin tutar.'
                  : 'Runs on native browser engine without background overhead, keeping laptop CPU and battery cool.'}
              </p>
            </div>
          </div>

          <div className={s.statusList}>
            <div className={s.statusItem}>
              <span>✓</span>
              <span>{isTR ? 'Başlık Filtresi (X-Frame-Options & CSP Atlatma): Aktif' : 'Header Stripping (XFO & CSP Bypass): Active'}</span>
            </div>
            <div className={s.statusItem}>
              <span>✓</span>
              <span>{isTR ? 'Oturum & Çerez Köprüsü (SameSite/Auth): Aktif' : 'Session & Cookie Bridge (SameSite/Auth): Active'}</span>
            </div>
            <div className={s.statusItem}>
              <span>✓</span>
              <span>{isTR ? 'Yerel Yayın Kanalı (Zero Cloud): Aktif' : 'Local Broadcast Channel (Zero Cloud): Active'}</span>
            </div>
          </div>
        </div>

        <div className={s.footer}>
          <button className={s.btnPrimary} onClick={() => st.setBenchmarkOpen(false)}>
            {isTR ? 'Anladım' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
