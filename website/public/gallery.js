/* global document, window, clearInterval, setTimeout, MutationObserver */
const showcaseData = [
  {
    "id": "workspace",
    "src": "/screenshots/workspace.png",
    "copy": {
      "en": {
        "title": "Workspace",
        "caption": "CastPost on four device sizes in one workspace.",
        "desc": "ViewGrid 1.0.4 · Real preview of castpost.app/en. Analysis runs locally without an external analysis API."
      },
      "tr": {
        "title": "Çalışma Alanı",
        "caption": "CastPost’u dört cihaz boyutunda tek çalışma alanında görün.",
        "desc": "ViewGrid 1.0.4 · castpost.app/en gerçek önizlemesi. Analiz dış analiz API’si olmadan yerel çalışır."
      },
      "no": {
        "title": "Arbeidsområde",
        "caption": "Se CastPost i fire enhetsstørrelser i ett arbeidsområde.",
        "desc": "ViewGrid 1.0.4 · Ekte forhåndsvisning av castpost.app/en. Analysen kjører lokalt uten ekstern analyse-API."
      }
    }
  },
  {
    "id": "compare",
    "src": "/screenshots/compare.png",
    "copy": {
      "en": {
        "title": "Compare",
        "caption": "Compare the same page at mobile and desktop widths.",
        "desc": "ViewGrid 1.0.4 · Real preview of castpost.app/en. Analysis runs locally without an external analysis API."
      },
      "tr": {
        "title": "Karşılaştırma",
        "caption": "Aynı sayfayı mobil ve masaüstü genişliklerinde karşılaştırın.",
        "desc": "ViewGrid 1.0.4 · castpost.app/en gerçek önizlemesi. Analiz dış analiz API’si olmadan yerel çalışır."
      },
      "no": {
        "title": "Sammenligning",
        "caption": "Sammenlign samme side i mobil- og desktopbredde.",
        "desc": "ViewGrid 1.0.4 · Ekte forhåndsvisning av castpost.app/en. Analysen kjører lokalt uten ekstern analyse-API."
      }
    }
  },
  {
    "id": "local-analysis",
    "src": "/screenshots/local-analysis.png",
    "copy": {
      "en": {
        "title": "Local Performance",
        "caption": "Local loading observations for mobile and desktop.",
        "desc": "ViewGrid 1.0.4 · Real preview of castpost.app/en. Analysis runs locally without an external analysis API."
      },
      "tr": {
        "title": "Yerel Performans",
        "caption": "Mobil ve masaüstü için yerel yükleme gözlemleri.",
        "desc": "ViewGrid 1.0.4 · castpost.app/en gerçek önizlemesi. Analiz dış analiz API’si olmadan yerel çalışır."
      },
      "no": {
        "title": "Lokal ytelse",
        "caption": "Lokale innlastingsobservasjoner for mobil og datamaskin.",
        "desc": "ViewGrid 1.0.4 · Ekte forhåndsvisning av castpost.app/en. Analysen kjører lokalt uten ekstern analyse-API."
      }
    }
  },
  {
    "id": "seo-accessibility",
    "src": "/screenshots/seo-accessibility.png",
    "copy": {
      "en": {
        "title": "SEO & Accessibility",
        "caption": "SEO and accessibility checks with clear result states.",
        "desc": "ViewGrid 1.0.4 · Real preview of castpost.app/en. Analysis runs locally without an external analysis API."
      },
      "tr": {
        "title": "SEO ve Erişilebilirlik",
        "caption": "Durumları açıkça gösteren SEO ve erişilebilirlik kontrolleri.",
        "desc": "ViewGrid 1.0.4 · castpost.app/en gerçek önizlemesi. Analiz dış analiz API’si olmadan yerel çalışır."
      },
      "no": {
        "title": "SEO og tilgjengelighet",
        "caption": "SEO- og tilgjengelighetssjekker med tydelige resultater.",
        "desc": "ViewGrid 1.0.4 · Ekte forhåndsvisning av castpost.app/en. Analysen kjører lokalt uten ekstern analyse-API."
      }
    }
  },
  {
    "id": "reports",
    "src": "/screenshots/reports.png",
    "copy": {
      "en": {
        "title": "Reports",
        "caption": "Local history and section-specific Markdown reports.",
        "desc": "ViewGrid 1.0.4 · Real preview of castpost.app/en. Analysis runs locally without an external analysis API."
      },
      "tr": {
        "title": "Raporlar",
        "caption": "Yerel geçmiş ve bölüme özel Markdown raporları.",
        "desc": "ViewGrid 1.0.4 · castpost.app/en gerçek önizlemesi. Analiz dış analiz API’si olmadan yerel çalışır."
      },
      "no": {
        "title": "Rapporter",
        "caption": "Lokal historikk og Markdown-rapporter for hver analysedel.",
        "desc": "ViewGrid 1.0.4 · Ekte forhåndsvisning av castpost.app/en. Analysen kjører lokalt uten ekstern analyse-API."
      }
    }
  }
];
    let currentShowcaseIndex = 0;
    let showcaseAutoTimer = null;

    function selectShowcaseTab(idx) {
      currentShowcaseIndex = idx;
      renderShowcase();
    }

    function renderShowcase() {
      const entry = showcaseData[currentShowcaseIndex];
      const item = entry && { ...entry, ...entry.copy[document.documentElement.lang] || entry.copy.en };
      if (!item) return;

      // Update Tab active states
      document.querySelectorAll('.tour-tab-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', idx === currentShowcaseIndex);
        btn.setAttribute('aria-selected', String(idx === currentShowcaseIndex));
        btn.tabIndex = idx === currentShowcaseIndex ? 0 : -1;
        btn.textContent = (showcaseData[idx].copy[document.documentElement.lang] || showcaseData[idx].copy.en).title;
      });

      const img = document.getElementById('showcase-img');
      const fallback = document.getElementById('showcase-fallback');
      const caption = document.getElementById('showcase-caption');
      const desc = document.getElementById('showcase-desc');
      const urlText = document.getElementById('showcase-url-text');
      const fallbackTitle = document.getElementById('fallback-title');
      const fallbackBadge = document.getElementById('fallback-badge');

      if (caption) caption.innerText = item.caption;
      document.getElementById('showcase-panel')?.setAttribute('aria-labelledby', `tab-${item.id}`);
      if (desc) desc.innerText = item.desc;
      if (urlText) urlText.innerText = 'https://castpost.app/en';
      if (fallbackTitle) fallbackTitle.innerText = `Screenshot: ${item.title}`;
      if (fallbackBadge) fallbackBadge.innerText = item.title.toUpperCase();

      if (img) {
        img.classList.add('gallery-loading');
        setTimeout(() => {
          img.onload = () => img.classList.remove('gallery-loading');
          img.src = item.src;
          img.alt = item.title;
          img.hidden = false;
          if (fallback) { fallback.hidden = true; fallback.classList.remove('gallery-fallback-visible'); }
          img.onload = () => {
            img.classList.remove('gallery-loading');
          };
        }, 150);
      }
    }

    function onShowcaseImgError(imgEl) {
      imgEl.hidden = true;
      const fallback = document.getElementById('showcase-fallback');
      if (fallback) { fallback.hidden = false; fallback.classList.add('gallery-fallback-visible'); }
    }

    function startShowcaseTimer() { if (showcaseAutoTimer) clearInterval(showcaseAutoTimer); }

    function pauseShowcase() {}
    function resumeShowcase() {}

    function openLightbox() {
      const entry = showcaseData[currentShowcaseIndex];
      const item = entry && { ...entry, ...entry.copy[document.documentElement.lang] || entry.copy.en };
      const modal = document.getElementById('tour-lightbox');
      const lbImg = document.getElementById('lightbox-img');
      const lbCap = document.getElementById('lightbox-caption');

      if (modal && lbImg && item) {
        lbImg.src = item.src;
        lbImg.alt = item.caption;
        if (lbCap) lbCap.innerText = `${item.title} — ${item.caption}`;
        modal.classList.add('active');
      }
    }

    function closeLightbox(e) {
      if (e && e.target && e.target.tagName === 'IMG') return;
      const modal = document.getElementById('tour-lightbox');
      if (modal) modal.classList.remove('active');
    }


document.querySelectorAll('[data-showcase-index]').forEach(link => {
  link.addEventListener('keydown', event => {
    const index = Number(link.dataset.showcaseIndex);
    const next = event.key === 'ArrowRight' ? (index + 1) % showcaseData.length
      : event.key === 'ArrowLeft' ? (index + showcaseData.length - 1) % showcaseData.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? showcaseData.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    selectShowcaseTab(next);
    document.querySelector(`[data-showcase-index="${next}"]`).focus();
  });
  link.addEventListener('click', event => {
    event.preventDefault();
    selectShowcaseTab(Number(link.dataset.showcaseIndex));
  });
});
new MutationObserver(renderShowcase).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
Object.assign(window, { renderShowcase, startShowcaseTimer, pauseShowcase, resumeShowcase, openLightbox, closeLightbox, onShowcaseImgError });

document.addEventListener('DOMContentLoaded', () => {
  const hero = document.getElementById('hero-screenshot-img');
  if (!hero) return;
  const loaded = () => window.onHeroImgLoaded?.();
  hero.addEventListener('load', loaded);
  hero.addEventListener('error', () => window.onHeroImgError?.());
  if (hero.complete && hero.naturalWidth) loaded();
});
