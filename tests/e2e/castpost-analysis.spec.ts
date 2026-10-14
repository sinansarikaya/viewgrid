import { test, expect, chromium } from '@playwright/test';
import { mkdir, writeFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { nativeSize } from './headed-window';
import { tmpdir } from 'node:os';
test('CastPost live: independently verify each reported rule', async () => {
 test.skip(process.env.VIEWGRID_LIVE_CASTPOST !== '1', 'Explicit live CastPost validation');
 test.setTimeout(180000);
 const out='test-results/castpost-analysis'; await mkdir(out,{recursive:true});
 const profile=await mkdtemp(path.join(tmpdir(),'viewgrid-castpost-'));
 const extension=path.resolve('dist/chromium');
 const context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:false,viewport:null,args:['--ozone-platform=x11',`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
 try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const id = worker.url().split('/')[2], page = await context.newPage();
    page.setDefaultTimeout(10000);

    await page.goto(`chrome-extension://${id}/workspace.html?url=${encodeURIComponent('https://castpost.app/en')}`);

 await expect.poll(()=>page.frames().filter(f=>f.url().startsWith('https://castpost.app/en')).length,{timeout:60000}).toBe(4);
 await page.getByRole('button',{name:'Fit to screen',exact:true}).click();
 await page.getByRole('button',{name:'Local Performance',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await expect(dialog.getByRole('combobox',{name:'Target Profile'})).toHaveValue('both');
 await dialog.getByRole('button',{name:'Run All Analyses',exact:true}).click();
 await expect(dialog.getByRole('region',{name:'Analysis status'}).locator('[data-analysis-status]')).toHaveText('Measurements captured',{timeout:30000});
 await dialog.getByRole('button',{name:'Reports & History',exact:true}).click();
 for(const [button,file] of [['Export JSON','report.json'],['Download Markdown','report.md'],['Download HTML Report','report.html']]) {
 const event=page.waitForEvent('download'); await dialog.getByRole('button',{name:button,exact:true}).click(); await (await event).saveAs(`${out}/${file}`);
 }
 const evidence=[];
 for(const frame of page.frames().filter(f=>f.url().startsWith('https://castpost.app/en'))) evidence.push(await frame.evaluate(()=>({width:innerWidth,height:innerHeight,title:document.title,description:document.querySelector('meta[name="description"]')?.getAttribute('content'),canonical:document.querySelector('link[rel="canonical"]')?.getAttribute('href'),heads:[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(x=>({tag:x.tagName,text:x.textContent?.slice(0,120)})),main:document.querySelectorAll('main,[role="main"]').length,images:[...document.images].map(x=>({alt:x.getAttribute('alt'),src:x.getAttribute('src')})),links:[...document.links].map(x=>({text:x.textContent?.trim().slice(0,100),label:x.getAttribute('aria-label'),href:x.getAttribute('href')})),hreflang:[...document.querySelectorAll('link[hreflang]')].map(x=>({lang:x.getAttribute('hreflang'),href:x.getAttribute('href')})),jsonld:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>x.textContent),robots:document.querySelector('meta[name="robots"]')?.getAttribute('content'),nav:performance.getEntriesByType('navigation').map(x=>x.toJSON()),paint:performance.getEntriesByType('paint').map(x=>x.toJSON())})));
 await writeFile(`${out}/dom-evidence.json`,JSON.stringify(evidence,null,2));
 const report=JSON.parse(await readFile(`${out}/report.json`, 'utf8')).analysis;
 const axeSource=await readFile('node_modules/axe-core/axe.min.js', 'utf8');
 const checks=[];
 for(const outcome of report.results) {
   const data=outcome.data;
   const matching=await Promise.all(page.frames().filter(f=>f.url().startsWith('https://castpost.app/en')).map(async f=>({f,width:await f.evaluate(()=>innerWidth)})));
   const actual=matching.find(x=>x.width===data.lab.local.width)!.f;
   const dom=evidence.find(e=>e.width===data.lab.local.width)!;
   const expected:Record<string,string>={
    'document-title':dom.title?.trim()?'pass':'fail', 'meta-description':dom.description?.trim()?'pass':'fail',
    'canonical':dom.canonical && new URL(dom.canonical,'https://castpost.app/en').protocol==='https:'?'pass':'fail',
    'landmark-one-main':dom.main===1?'pass':'fail', 'image-alt':dom.images.every(x=>x.alt!==null)?'pass':'fail',
    'is-crawlable':/\b(noindex|none)\b/i.test(dom.robots??'')?'fail':'unknown', 'crawler-policy':'manual',
    'hreflang':dom.hreflang.some(x=>x.href==='https://castpost.app/en')?'pass':'fail',
    'structured-data':dom.jsonld.every(x=>{try{const v=JSON.parse(x!);return v && typeof v==='object';}catch{return false;}})?'pass':'fail',
   };
   let prev=0;expected['heading-order']=dom.heads.some(x=>{const level=Number(x.tag[1]),skipped=level>prev+1;prev=level;return skipped;})?'fail':'pass';
   const additional=await actual.evaluate(()=>({
    viewport: [...document.querySelectorAll('meta[name="viewport"]')].map(x=>x.getAttribute('content')),
    linkNames:[...document.querySelectorAll('a[href]')].map(x=>{const refs=x.getAttribute('aria-labelledby')?.split(/\s+/).map(id=>document.getElementById(id)?.textContent??'').join(' ');return refs||x.getAttribute('aria-label')||[...x.querySelectorAll('img[alt]')].map(i=>i.getAttribute('alt')).join('')||x.textContent||'';})
   }));
   expected['viewport']=additional.viewport.length===1 && /width\s*=\s*device-width/i.test(additional.viewport[0]!)?'pass':'fail';
   expected['link-text']=additional.linkNames.every(x=>x.trim()&&!/^(click here|here|read more|learn more|buraya tıkla|tıklayın|devamı|les mer|klikk her)$/i.test(x.trim()))?'pass':'fail';
   expected['crawlable-anchors']=dom.links.every(x=>{try{return ['http:','https:','mailto:','tel:'].includes(new URL(x.href!,'https://castpost.app/en').protocol);}catch{return false;}})?'pass':'fail';
   await actual.addScriptTag({content:axeSource});
   const independently=await actual.evaluate(async()=>{const result=await (window as any).axe.run(document,{runOnly:{type:'rule',values:['button-name','input-button-name','label','select-name','aria-allowed-attr','aria-valid-attr','aria-valid-attr-value','aria-required-attr','aria-roles','html-has-lang','html-lang-valid','duplicate-id-aria']},preload:false,iframes:false});return Object.fromEntries(['violations','incomplete','passes','inapplicable'].flatMap((key,i)=>result[key].map((r:any)=>['axe-'+r.id,{status:['fail','unknown','pass','not-applicable'][i],nodes:r.nodes.length}])));});
   for(const audit of data.lab.audits){ const status=expected[audit.id]??independently[audit.id]?.status;expect(status,`${outcome.profile} ${audit.id}`).toBe(audit.status);if(independently[audit.id])expect(String(independently[audit.id].nodes)).toBe(audit.displayValue);checks.push({profile:outcome.profile,id:audit.id,status,verified:true}); }
   const nav=dom.nav[0];expect(data.lab.local.navigation.ttfbMs).toBeCloseTo(nav.responseStart-nav.requestStart,4);expect(data.lab.local.navigation.domContentLoadedMs).toBe(nav.domContentLoadedEventEnd);expect(data.lab.local.navigation.loadMs).toBe(nav.loadEventEnd);
   expect(data.lab.metrics.fcpMs).toBe(dom.paint.find(x=>x.name==='first-contentful-paint')?.startTime??null);
   const map:Record<string,string[]>={'crawl-access':['is-crawlable'],'page-metadata':['document-title','meta-description'],canonical:['canonical'],'semantic-structure':['heading-order','landmark-one-main'],'descriptive-links':['link-text','crawlable-anchors']};
   for(const criterion of data.geo.criteria) {
     const statuses=(map[criterion.id]??[]).map(id=>expected[id]);
     const status=criterion.mode==='manual'?'manual':statuses.includes('fail')?'fail':statuses.every(s=>s==='pass')?'pass':'unknown';
     expect(criterion.status,`GEO ${outcome.profile} ${criterion.id}`).toBe(status);checks.push({profile:outcome.profile,id:criterion.id,status,verified:true});
   }
 }
 await writeFile(`${out}/checks.json`,JSON.stringify(checks,null,2));
 await page.screenshot({animations:'disabled',path:`${out}/reports.png`});
 await dialog.getByRole('button',{name:'SEO & Accessibility',exact:true}).click();await page.screenshot({animations:'disabled',path:`${out}/seo.png`});
 await dialog.getByRole('button',{name:'Copy Report',exact:true}).click();
 await expect(dialog.getByText('SEO & Accessibility report copied to the clipboard.',{exact:true})).toBeVisible();
 await expect(dialog.getByRole('button',{name:'Copy Report',exact:true})).toHaveAttribute('data-confirmed','true');
 await page.screenshot({animations:'disabled',path:`${out}/copy-success.png`});
 const seoDownload=page.waitForEvent('download'); await dialog.getByRole('button',{name:'Download Markdown',exact:true}).click();await (await seoDownload).saveAs(`${out}/seo.md`);
 await dialog.getByRole('button',{name:'GEO Signals (Beta)',exact:true}).click();
 await expect(dialog.getByText('SEO & Accessibility report copied to the clipboard.',{exact:true})).toHaveCount(0);
 await expect(dialog.getByRole('button',{name:'Copy Report',exact:true})).not.toHaveAttribute('data-confirmed','true');
 await dialog.getByRole('button',{name:'Copy Report',exact:true}).click();
 await expect(dialog.getByText('GEO report copied to the clipboard.',{exact:true})).toBeVisible();
 await expect(dialog.getByText('GEO report copied to the clipboard.',{exact:true})).toHaveCount(0,{timeout:6000});await page.screenshot({animations:'disabled',path:`${out}/geo.png`});
 const geoDownload=page.waitForEvent('download'); await dialog.getByRole('button',{name:'Download Markdown',exact:true}).click();await (await geoDownload).saveAs(`${out}/geo.md`);
 await dialog.getByRole('button',{name:'Local Performance',exact:true}).click();await page.screenshot({animations:'disabled',path:`${out}/performance.png`});
 const performanceDownload=page.waitForEvent('download'); await dialog.getByRole('button',{name:'Download Markdown',exact:true}).click();await (await performanceDownload).saveAs(`${out}/performance.md`);
 await dialog.getByRole('button',{name:'Close dialog',exact:true}).click(); await expect(dialog).toBeHidden();
 await page.getByRole('combobox',{name:'Language',exact:true}).selectOption('tr');
 await page.getByRole('button',{name:'SEO & Erişilebilirlik',exact:true}).click();
 await dialog.getByRole('button',{name:'Tüm Analizleri Başlat',exact:true}).click();
 await expect(dialog.locator('[data-analysis-status]')).toHaveText('İncelenen sayfada 1 bulgu',{timeout:20000});
 await expect(dialog.getByText('Başlık sırası',{exact:true})).toHaveCount(1);
 await dialog.getByRole('button',{name:'Raporu Kopyala',exact:true}).click();
 await expect(dialog.getByText('SEO ve Erişilebilirlik raporu panoya kopyalandı.',{exact:true})).toBeVisible();
 await page.screenshot({animations:'disabled',path:`${out}/copy-success-tr.png`});
 await dialog.getByRole('button',{name:'GEO Sinyalleri (Beta)',exact:true}).click();
 await expect(dialog.getByText('SEO ve Erişilebilirlik raporu panoya kopyalandı.',{exact:true})).toHaveCount(0);
 await expect(dialog.getByText('Anlamsal içerik yapısı',{exact:true})).not.toHaveCount(0);
 await page.screenshot({animations:'disabled',path:`${out}/geo-tr.png`});
 await dialog.getByRole('button',{name:'Close dialog',exact:true}).click(); await expect(dialog).toBeHidden();
 await page.getByRole('combobox',{name:'Dil',exact:true}).selectOption('no');
 await page.getByRole('button',{name:'SEO & Tilgjengelighet',exact:true}).click();
 await dialog.getByRole('button',{name:'Kjør alle analyser',exact:true}).click();
 await expect(dialog.locator('[data-analysis-status]')).toHaveText('Funn på undersøkt side: 1',{timeout:20000});
 await dialog.getByRole('button',{name:'Kopier rapport',exact:true}).click();
 await expect(dialog.getByText('SEO og tilgjengelighet rapport kopiert til utklippstavlen.',{exact:true})).toBeVisible();
 const noDownload=page.waitForEvent('download');await dialog.getByRole('button',{name:'Last ned Markdown',exact:true}).click();await (await noDownload).saveAs(`${out}/seo-no.md`);
 const geometry=[];
 for(const tab of ['Lokal ytelse','SEO & Tilgjengelighet','GEO-signaler (Beta)','Rapporter & Historikk']) {
   await dialog.getByRole('button',{name:tab,exact:true}).click();
   const box=await dialog.boundingBox();expect(box).not.toBeNull();geometry.push({tab,...box});
 }
 for(const box of geometry) {expect(Math.abs(box.height!-geometry[0].height!)).toBeLessThan(1);expect(Math.abs(box.y!-geometry[0].y!)).toBeLessThan(1);}
 await expect(dialog.getByRole('columnheader',{name:'Handlinger',exact:true})).toBeVisible();
 await writeFile(`${out}/norwegian-modal-geometry.json`,JSON.stringify(geometry,null,2));
 await page.screenshot({animations:'disabled',path:`${out}/reports-no.png`});
 for(const height of [800,480]) {
   await nativeSize(context,page,1280,height);
   const boxes=[];
   for(const tab of ['Lokal ytelse','SEO & Tilgjengelighet','GEO-signaler (Beta)','Rapporter & Historikk']) {
     await dialog.getByRole('button',{name:tab,exact:true}).click();
     const box=(await dialog.boundingBox())!;boxes.push(box);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(height);
   }
   for(const box of boxes)expect(Math.abs(box.height-boxes[0].height)).toBeLessThan(1);
   await dialog.getByRole('button',{name:'Eksporter JSON',exact:true}).scrollIntoViewIfNeeded();
   await expect(dialog.getByRole('button',{name:'Eksporter JSON',exact:true})).toBeInViewport();
   await page.screenshot({animations:'disabled',path:`${out}/reports-no-${height}.png`});
 }

 } finally {await context.close();await rm(profile,{recursive:true,force:true});}
});
