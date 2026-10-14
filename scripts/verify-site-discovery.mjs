import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const root = new URL('../website/dist/', import.meta.url);
const base = 'https://viewgrid.sinansarikaya.dev';
const version = JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
const xml = new JSDOM(readFileSync(new URL('sitemap.xml',root),'utf8'),{contentType:'text/xml'}).window.document;
const urls=[...xml.querySelectorAll('loc')].map(node=>node.textContent);
assert.equal(urls.length,9,'All nine public routes must be included in the sitemap');
assert.equal(new Set(urls).size,urls.length,'Sitemap URLs must be unique');
for(const url of urls) {
  assert.equal(new URL(url).origin,base);
  const route=new URL(url).pathname;
  const doc=new JSDOM(readFileSync(new URL(route.slice(1)+'index.html',root),'utf8')).window.document;
  assert.equal(doc.querySelectorAll('link[rel="canonical"]').length,1,url);
  assert.equal(doc.querySelector('link[rel="canonical"]').href,url,url+' self canonical');
  assert.equal(doc.querySelectorAll('h1').length,1,url+' single main heading');
  assert.ok(doc.querySelector('main').textContent.trim().length>200,url+' content in initial HTML');
  assert.ok(doc.querySelector('meta[name="description"]').content.length>30);
  assert.ok(doc.querySelector('meta[name="robots"]').content.includes('index,follow'));
  assert.equal(doc.querySelector('meta[property="og:url"]').content,url);
  const graph=JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
  assert.equal(graph.find(item=>item['@type']==='SoftwareApplication').softwareVersion,version);
  const page=graph.find(item=>item['@type']==='WebPage'||item['@type']==='TechArticle');
  assert.equal(page.url,url);assert.equal(page.inLanguage,doc.documentElement.lang);
  if(route==='/'||route.startsWith('/tr/')||route.startsWith('/no/')||route.startsWith('/changelog/')) {
    const alternatives=[...doc.querySelectorAll('link[hreflang]')];assert.equal(alternatives.length,4,url+' all language counterparts');
    for(const link of alternatives){assert.ok(urls.includes(link.href));const peer=new JSDOM(readFileSync(new URL(new URL(link.href).pathname.slice(1)+'index.html',root),'utf8')).window.document;assert.ok([...peer.querySelectorAll('link[hreflang]')].some(alternate=>alternate.href===url),url+' reciprocal hreflang');}
  }
}
assert.ok(readFileSync(new URL('robots.txt',root),'utf8').includes(base+'/sitemap.xml'));
assert.ok(readFileSync(new URL('llms.txt',root),'utf8').includes(base+'/docs/'));
console.log('9 routes: initial HTML, canonical, reciprocal language links, metadata, structured data and crawl files verified.');
