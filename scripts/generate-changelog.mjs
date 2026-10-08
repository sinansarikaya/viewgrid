import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
export function generateChangelog() {
  const home = readFileSync(new URL('website/index.html', root), 'utf8');
  const data = JSON.parse(readFileSync(new URL('website/src/data/changelog.json', root), 'utf8'));
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  let head = home.slice(0, home.indexOf('<body>'))
    .replace(/<title>.*?<\/title>/, '<title>Changelog — ViewGrid</title>')
    .replace(/https:\/\/viewgrid\.sinansarikaya\.dev\/(\?lang=(?:tr|no))?(?=["'])/g, 'https://viewgrid.sinansarikaya.dev/changelog/$1')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
  head = head.replace('  </style>', `
    .change-hero { padding:72px 0 48px; display:grid; grid-template-columns:minmax(0,1fr) 280px; gap:48px; align-items:end; }
    .change-hero h1 { font-family:var(--font-display); font-size:clamp(40px,5vw,76px); line-height:1.06; letter-spacing:-.045em; max-width:760px; margin:20px 0; }
    .change-hero p { color:var(--text-muted); line-height:1.7; max-width:680px; }
    .change-eyebrow { font:12px var(--font-mono); letter-spacing:.12em; color:var(--accent); }
    .current-release { border:1px solid var(--border); background:var(--bg-surface); padding:24px; border-radius:16px; }
    .current-release strong { display:block; font:36px var(--font-display); margin:12px 0; }
    .current-release p { font-size:13px; }
    .change-links { display:flex; flex-wrap:wrap; gap:12px 24px; margin-top:24px; }
    .change-links a { color:var(--accent); font-size:14px; }
    .change-history { padding-bottom:80px; }
    .change-history > h2 { font:13px var(--font-mono); color:var(--text-muted); text-transform:uppercase; letter-spacing:.1em; margin-bottom:28px; }
    .change-entry { display:grid; grid-template-columns:150px minmax(0,1fr); gap:36px; border-top:1px solid var(--border); padding:32px 0; }
    .change-entry time { display:block; color:var(--text-muted); font:12px var(--font-mono); margin-top:12px; }
    .change-version { font:24px var(--font-display); }
    .change-entry h3 { font:clamp(24px,3vw,32px) var(--font-display); line-height:1.3; margin-bottom:16px; }
    .change-entry ul { padding-left:20px; color:var(--text-muted); line-height:1.8; }
    .change-entry li { padding-left:4px; margin:10px 0; }
    .change-latest { display:inline-block; color:var(--accent); font:10px var(--font-mono); margin-bottom:12px; letter-spacing:.05em; }
    @media(max-width:760px) { .change-hero { grid-template-columns:1fr; gap:24px; padding-top:40px; } .change-entry { grid-template-columns:1fr; gap:16px; } .change-entry time { display:inline-block; margin-left:16px; } }
  </style>`);
  const header = home.slice(home.indexOf('  <header class="site-nav">'), home.indexOf('  </header>') + '  </header>'.length).replace(/href="#/g, 'href="/#').replace('href="/changelog/"', 'href="/changelog/" aria-current="page"');
  const footer = home.slice(home.indexOf('  <footer'), home.indexOf('  </footer>') + '  </footer>'.length).replace(/href="#/g, 'href="/#');
  const modal = home.slice(home.indexOf('  <div class="shortcuts-modal"'), home.indexOf('  <!-- Central JavaScript Engine -->'));
  let sharedScript = home.slice(home.indexOf('    const translations = {'), home.indexOf('    /* -------------------------------------------------------------\n       5. INTERACTION'));
  const dictionary = {};
  for (const language of ['en','tr','no']) {
    const labels = data.labels[language];
    dictionary[language] = Object.fromEntries(Object.entries(labels).map(([key,value]) => ['change' + key, value]));
    data.entries.forEach((entry,index) => {
      dictionary[language][`change${index}Title`] = entry[language].title;
      entry[language].points.forEach((point,pointIndex) => { dictionary[language][`change${index}Point${pointIndex}`] = point; });
    });
  }
  const assignments = Object.entries(dictionary).map(([language,labels]) => `Object.assign(translations.${language}, ${JSON.stringify(labels)});`).join('\n');
  sharedScript = sharedScript.replace('    let currentLang = detectLanguage();', assignments + '\n    let currentLang = detectLanguage();');
  sharedScript = sharedScript.replace('      document.documentElement.lang = lang;', `      document.documentElement.lang = lang;
      document.title = (lang === 'tr' ? 'Değişiklikler' : lang === 'no' ? 'Endringslogg' : 'Changelog') + ' — ViewGrid';
      document.querySelectorAll('.change-entry time').forEach(time => { time.textContent = new Date(time.getAttribute('datetime') + 'T12:00:00Z').toLocaleDateString(lang === 'no' ? 'nb-NO' : lang, {year:'numeric',month:'long',day:'numeric'}); });`);
  const label = key => `<span data-i18n="change${key}">${escape(data.labels.en[key])}</span>`;
  const entries = data.entries.map((entry,index) => `<article class="change-entry"><div>${index === 0 ? `<span class="change-latest">${label('latest')}</span><br>` : ''}<span class="change-version">${escape(entry.version)}</span><time datetime="${entry.date}">${entry.date}</time></div><div><h3 data-i18n="change${index}Title">${escape(entry.en.title)}</h3><ul>${entry.en.points.map((point,pointIndex) => `<li data-i18n="change${index}Point${pointIndex}">${escape(point)}</li>`).join('')}</ul></div></article>`).join('\n');
  const main = `<main id="main-content" class="container"><section class="change-hero"><div><span class="change-eyebrow">${label('eyebrow')}</span><h1>${label('title')}</h1><p>${label('intro')}</p><div class="change-links"><a href="https://github.com/sinansarikaya/viewgrid/releases/tag/v1.0.3">${label('download')} ↗</a><a href="https://github.com/sinansarikaya/viewgrid/blob/main/CHANGELOG.md">${label('source')} ↗</a></div></div><aside class="current-release">${label('current')}<strong>1.0.3</strong><p>${label('same')}</p><p>${label('build')}</p></aside></section><section class="change-history"><h2>${label('history')}</h2>${entries}<a href="/">← ${label('back')}</a></section></main>`;
  const script = `${sharedScript}\nfunction openShortcutsModal(){document.getElementById('shortcuts-modal').classList.add('active');}\nfunction closeShortcutsModal(event){if(!event || event.target.id === 'shortcuts-modal' || event.target.closest('.lightbox-close-btn'))document.getElementById('shortcuts-modal').classList.remove('active');}\ndocument.addEventListener('keydown',event=>{if(event.key==='Escape')closeShortcutsModal();});\nsetLang(currentLang); applyTheme(currentTheme);`;
  const target = new URL('website/changelog/index.html', root);
  writeFileSync(fileURLToPath(target), `${head}<body><a href="#main-content" class="skip-link">Skip to main content</a>${header}${main}${footer}${modal}<script>${script}</script></body></html>\n`);
}
