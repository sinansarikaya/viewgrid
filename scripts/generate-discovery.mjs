import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import ts from 'typescript';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
const version = JSON.parse(readFileSync(path.join(root,'package.json'),'utf8')).version;
const base = 'https://viewgrid.sinansarikaya.dev';
const languages = ['en', 'tr', 'no'];
const copy = JSON.parse(readFileSync(path.join(root, 'website/src/data/discovery.json'), 'utf8'));
const change = JSON.parse(readFileSync(path.join(root, 'website/src/data/changelog.json'), 'utf8'));
const metadata = {
  en: { title: 'ViewGrid — Responsive Testing and Local SEO Checks', description: 'Compare phone, tablet and desktop layouts in Chrome and Firefox. Synchronized previews, local SEO and accessibility checks, and Markdown reports.' },
  tr: { title: 'ViewGrid — Duyarlı Tasarım Testi ve Yerel SEO Analizi', description: 'Chrome ve Firefox’ta mobil, tablet ve masaüstü düzenlerini karşılaştırın. Senkron önizlemeler, yerel SEO ve erişilebilirlik kontrolleri, Markdown raporları.' },
  no: { title: 'ViewGrid — Responsiv testing og lokal SEO-analyse', description: 'Sammenlign mobil, nettbrett og desktop i Chrome og Firefox. Synkroniserte visninger, lokale SEO- og tilgjengelighetssjekker og Markdown-rapporter.' }
};
function dictionary() {
  const dom = new JSDOM(readFileSync(path.join(root, 'website/index.html'), 'utf8'));
  const code = [...dom.window.document.scripts].find(script => script.textContent.includes('const translations = {')).textContent;
  const source = ts.createSourceFile('translations.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const result = { en: {}, tr: {}, no: {} };
  const value = node => ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node.text : undefined;
  const properties = node => Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map(property => [property.name.text, value(property.initializer)]).filter(([, val]) => val !== undefined));
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'translations' && ts.isObjectLiteralExpression(node.initializer)) {
      for (const property of node.initializer.properties) if (ts.isPropertyAssignment(property) && ts.isObjectLiteralExpression(property.initializer)) result[property.name.text] = properties(property.initializer);
    }
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'Object.assign' && node.arguments.length === 2 && ts.isObjectLiteralExpression(node.arguments[1])) {
      const locale = node.arguments[0].getText(source).match(/^translations\.(en|tr|no)$/)?.[1];
      if (locale) Object.assign(result[locale], properties(node.arguments[1]));
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  for (const locale of languages) {
    Object.assign(result[locale], copy[locale]);
    for (const [key, val] of Object.entries(change.labels[locale])) result[locale]['change' + key] = val;
    change.entries.forEach((entry, index) => {
      result[locale][`change${index}Title`] = entry[locale].title;
      entry[locale].points.forEach((point, i) => { result[locale][`change${index}Point${i}`] = point; });
    });
  }
  return result;
}
function localePath(section, locale) { return `/${section ? section + '/' : ''}${locale === 'en' ? '' : locale + '/'}`; }
function enrich(html, urlPath, locale, section, dictionaries) {
  const dom = new JSDOM(html); const doc = dom.window.document;
  doc.documentElement.lang = locale;
  for (const el of doc.querySelectorAll('[data-i18n]')) {
    const text = dictionaries[locale][el.dataset.i18n]; if (text) el.innerHTML = text;
  }
  for (const el of doc.querySelectorAll('[data-i18n-aria]')) { const text=dictionaries[locale][el.dataset.i18nAria]; if (text) el.setAttribute('aria-label',text); }
  const videoLocale = locale === 'tr' ? 'tr' : 'en';
  const source = doc.querySelector('#promo-source'); if (source) source.src = `/videos/viewgrid-promo-${videoLocale}.mp4`;
  const download = doc.querySelector('#promo-download'); if (download) download.href = `/videos/viewgrid-promo-${videoLocale}.mp4`;
  const video = doc.querySelector('#promo-video'); if (video) video.poster = `/videos/poster-${videoLocale}.jpg`;
  for (const track of doc.querySelectorAll('#promo-video track')) { if (track.srclang === locale) track.setAttribute('default', ''); else track.removeAttribute('default'); }
  const meta = metadata[locale];
  const title = section === 'changelog' ? `${change.labels[locale].title || 'Changelog'} — ViewGrid` : section ? `${section[0].toUpperCase() + section.slice(1)} — ViewGrid` : meta.title;
  const description = section ? doc.querySelector('meta[name="description"]')?.content || meta.description : meta.description;
  doc.title = title;
  const setMeta = (attr, name, value) => {
    let node = doc.querySelector(`meta[${attr}="${name}"]`); if (!node) { node = doc.createElement('meta'); node.setAttribute(attr, name); doc.head.append(node); } node.content = value;
  };
  setMeta('name','description',description); setMeta('name','robots','index,follow,max-image-preview:large');
  setMeta('property','og:title',title); setMeta('property','og:description',description); setMeta('property','og:url',base+urlPath);
  setMeta('property','og:image',base+'/screenshots/workspace.png'); setMeta('name','twitter:image',base+'/screenshots/workspace.png');
  setMeta('name','twitter:title',title); setMeta('name','twitter:description',description);
  let canonical = doc.querySelector('link[rel="canonical"]'); if (!canonical) { canonical=doc.createElement('link');canonical.rel='canonical';doc.head.append(canonical); } canonical.href=base+urlPath;
  doc.querySelectorAll('link[hreflang]').forEach(node=>node.remove());
  if (!section || section==='changelog') for (const language of [...languages,'x-default']) {
    const link=doc.createElement('link');link.rel='alternate';link.hreflang=language;link.href=base+localePath(section,language==='x-default'?'en':language);doc.head.append(link);
  }
  for (const link of doc.querySelectorAll('.lang-btn')) { link.href=localePath(section==='changelog'?'changelog':'',link.dataset.lang); if(link.dataset.lang===locale)link.setAttribute('aria-current','page'); }
  if (locale!=='en') for(const link of doc.querySelectorAll('a[href="/"]:not(.lang-btn),a[href^="/#"]')) link.href=localePath('',locale)+(link.getAttribute('href').slice(1));
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(node=>node.remove());
  const data={ '@context':'https://schema.org', '@graph':[
    { '@type':'WebSite','@id':base+'/#website',name:'ViewGrid',url:base+'/',inLanguage:languages },
    { '@type':'Person','@id':base+'/#creator',name:'Sinan Sarıkaya',url:'https://sinansarikaya.dev',sameAs:['https://github.com/sinansarikaya'] },
    { '@type':'SoftwareApplication','@id':base+'/#software',name:'ViewGrid',softwareVersion:version,url:base+'/',applicationCategory:'DeveloperApplication',operatingSystem:'Chromium and Firefox browser extensions',description:meta.description,inLanguage:languages,author:{'@id':base+'/#creator'},license:'https://github.com/sinansarikaya/viewgrid/blob/main/LICENSE',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'} },
    { '@type':section==='docs'?'TechArticle':'WebPage','@id':base+urlPath+'#page',url:base+urlPath,name:title,description,inLanguage:locale,isPartOf:{'@id':base+'/#website'},about:{'@id':base+'/#software'},author:{'@id':base+'/#creator'} }
  ]};
  const script=doc.createElement('script');script.type='application/ld+json';script.textContent=JSON.stringify(data).replace(/</g,'\\u003c');doc.head.append(script);
  for(const file of ['site-copy.js','accessibility.js']) if (!doc.querySelector(`script[src="/${file}"]`)) { const script=doc.createElement('script');script.src='/'+file;doc.head.append(script); }
  if (!doc.querySelector('link[href="/accessibility.css"]')) { const link=doc.createElement('link');link.rel='stylesheet';link.href='/accessibility.css';doc.head.append(link); }
  return dom.serialize();
}
export async function generateDiscovery(outDir) {
  const dictionaries=dictionary(); const routes=[];
  for(const section of ['', 'changelog']) {
    const template=readFileSync(path.join(outDir,section,'index.html'),'utf8');
    for(const locale of languages) {
      const route=localePath(section,locale); const dir=path.join(outDir,route);mkdirSync(dir,{recursive:true});
      writeFileSync(path.join(dir,'index.html'),enrich(template,route,locale,section,dictionaries));routes.push(route);
    }
  }
  const server=await createServer({configFile:false,root:path.join(root,'website'),plugins:[react()],server:{middlewareMode:true,hmr:false},appType:'custom'});
  try {
    for(const section of ['docs','privacy','support']) {
      const name=section[0].toUpperCase()+section.slice(1);
      const module=await server.ssrLoadModule(`/src/pages/${name}.tsx`);
      const file=path.join(outDir,section,'index.html');const dom=new JSDOM(readFileSync(file,'utf8'));
      dom.window.document.getElementById('root').innerHTML=renderToStaticMarkup(React.createElement(module[name]));
      writeFileSync(file,enrich(dom.serialize(),`/${section}/`,'en',section,dictionaries));routes.push(`/${section}/`);
    }
  } finally { await server.close(); }
  const escape=value=>value.replace(/&/g,'&amp;');
  const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+routes.map(route=>{
    const section=route.startsWith('/changelog/')?'changelog':'';
    const alternates=route==='/docs/'||route==='/privacy/'||route==='/support/'?'':languages.map(language=>`<xhtml:link rel="alternate" hreflang="${language}" href="${base+localePath(section,language)}"/>`).join('');
    return `<url><loc>${escape(base+route)}</loc>${alternates}</url>`;
  }).join('\n')+'\n</urlset>\n';
  writeFileSync(path.join(outDir,'sitemap.xml'),sitemap);
  writeFileSync(path.join(root,'website/public/sitemap.xml'),sitemap);
  writeFileSync(path.join(outDir,'robots.txt'),'User-agent: *\nAllow: /\n\nSitemap: '+base+'/sitemap.xml\n');
}
