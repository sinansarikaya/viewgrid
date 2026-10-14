import {test,expect,chromium,type BrowserContext,type Page} from '@playwright/test';
import {createServer} from 'node:http';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

async function nativeSize(context:BrowserContext,page:Page,width:number,height:number){
  const cdp=await context.newCDPSession(page),browser=await context.browser()!.newBrowserCDPSession();
  const {windowId}=await cdp.send('Browser.getWindowForTarget');
  if(process.env.HYPRLAND_INSTANCE_SIGNATURE){
    const {processInfo}=await browser.send('SystemInfo.getProcessInfo'),pid=processInfo.find(process=>process.type==='browser')?.id;
    const owned=JSON.parse(execFileSync('hyprctl',['-j','clients'],{encoding:'utf8'})).filter((client:{pid:number})=>client.pid===pid);
    expect(owned).toHaveLength(1);
    if(!owned[0].floating)execFileSync('hyprctl',['eval',`local w=hl.get_window("pid:${pid}");assert(w);hl.dispatch(hl.dsp.window.fullscreen_state({internal=0,client=0,action="set",layout_aware=false,window=w}));hl.dispatch(hl.dsp.window.float({action="set",window=w}))`]);
  }
  await cdp.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'normal'}});
  await expect.poll(async()=>(await cdp.send('Browser.getWindowBounds',{windowId})).bounds.windowState).toBe('normal');
  await page.waitForTimeout(1000);
  const border=await page.evaluate(()=>({width:outerWidth-innerWidth,height:outerHeight-innerHeight}));
  await cdp.send('Browser.setWindowBounds',{windowId,bounds:{width:width+border.width,height:height+border.height}});
  await page.waitForTimeout(1000);
  for(let attempt=0;attempt<3;attempt++){
    const inner=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
    if(inner.width===width&&inner.height===height)break;
    const current=await cdp.send('Browser.getWindowBounds',{windowId});
    await cdp.send('Browser.setWindowBounds',{windowId,bounds:{width:current.bounds.width!+width-inner.width,height:current.bounds.height!+height-inner.height}});
    await page.waitForTimeout(1000);
  }
  await expect.poll(()=>page.evaluate(()=>[innerWidth,innerHeight])).toEqual([width,height]);
  await browser.detach();return cdp;
}

test('headed real extension: scan states, tooltip neighbour, checkbox, reorder and local analysis',async()=>{
  test.setTimeout(180000);
  if(!process.env.DISPLAY)throw new Error('Real desktop DISPLAY required; no headless fallback');
  const out='test-results/development/interaction';await mkdir(out,{recursive:true});
  const server=createServer((request,response)=>{response.setHeader('Content-Type','text/html');response.end(`<!doctype html><meta name="viewport" content="width=device-width"><style>body{margin:8px;font:16px sans-serif}input{height:44px;width:250px;max-width:90%}</style><h1>${request.url==='/issues'?'Issues':'Clean'} fixture</h1><input aria-label="Name">${request.url==='/issues'?'<p id="clipped" style="width:80px;overflow:hidden;white-space:nowrap">This text is accidentally clipped and must be detected</p>':''}`);});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${(server.address() as {port:number}).port}`,profile=await mkdtemp(path.join(tmpdir(),'viewgrid-interaction-'));
  const extension=path.resolve('dist/chromium');
  const context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:false,chromiumSandbox:true,viewport:null,locale:'en-US',slowMo:75,args:['--ozone-platform=x11',`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
  const evidence:unknown[]=[];
  try{
    const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker'),id=worker.url().split('/')[2],page=await context.newPage();
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`chrome-extension://${id}/workspace.html?url=${encodeURIComponent(base+'/issues')}`);
    await nativeSize(context,page,1280,800);
    const frames=()=>page.frames().filter(frame=>frame.parentFrame()===page.mainFrame());
    await expect.poll(()=>frames().filter(frame=>frame.url()===base+'/issues').length).toBe(4);
    const sidebar=page.getByRole('complementary',{name:'Workspace tools and devices'});
    await sidebar.getByRole('button',{name:'Sync',exact:true}).hover();
    await expect(page.getByRole('tooltip',{name:'Sync',exact:true})).toBeVisible();
    expect(await page.getByRole('tooltip',{name:'Sync',exact:true}).evaluate(element=>getComputedStyle(element).pointerEvents)).toBe('none');
    await sidebar.getByRole('button',{name:'Devices',exact:true}).click();
    await expect(sidebar.getByRole('button',{name:'+ Add Device',exact:true})).toBeVisible();
    await sidebar.getByRole('button',{name:'Sync',exact:true}).click();
    const scroll=sidebar.getByRole('checkbox',{name:'Sync scroll',exact:true});
    await expect(scroll).toBeChecked();await scroll.focus();await page.keyboard.press('Space');await expect(scroll).not.toBeChecked();
    await scroll.locator('xpath=ancestor::label').click();await expect(scroll).toBeChecked();
    await sidebar.getByRole('button',{name:'Tools',exact:true}).click();
    await sidebar.getByRole('button',{name:'Scan Issues',exact:true}).click();
    const drawer=page.getByRole('complementary',{name:'Responsive issues'});
    await expect(drawer.locator('article')).not.toHaveCount(0);
    await expect(drawer.getByText('Inspected DOM elements',{exact:false})).toBeVisible();
    await page.screenshot({path:`${out}/issues-found.png`});evidence.push({scan:'responsive-findings',status:'passed'});
    await drawer.getByRole('button',{name:'Close issues'}).click();
    await page.locator('header input').fill(base+'/clean');await page.locator('header input').press('Enter');
    await expect.poll(()=>frames().filter(frame=>frame.url()===base+'/clean').length).toBe(4);
    for(const frame of frames())await expect(frame.locator('h1')).toHaveText('Clean fixture');
    await sidebar.getByRole('button',{name:'Scan Issues',exact:true}).click();
    await expect(drawer.getByText('No findings in the scanned content.',{exact:false})).toBeVisible();
    await expect(drawer.locator('article')).toHaveCount(0);evidence.push({scan:'responsive-empty',status:'passed'});
    await drawer.getByRole('button',{name:'Close issues'}).click();
    await page.getByRole('button',{name:'Fit to screen',exact:true}).click();
    const ids=()=>page.locator('[data-viewport-id]').evaluateAll(cards=>cards.map(card=>card.getAttribute('data-viewport-id')));
    const original=await ids(),cards=page.locator('[data-viewport-id]');
    await cards.last().locator('iframe').contentFrame().getByRole('textbox',{name:'Name'}).fill('keep me');
    const handle=cards.last().getByRole('button',{name:/Drag to reorder:/});
    await page.evaluate(()=>{(window as any).__dragEvents=[];for(const type of ['pointerdown','pointerup','pointercancel','dragstart','dragover','drop','dragend'])document.addEventListener(type,event=>{(window as any).__dragEvents.push({type,pointerId:(event as PointerEvent).pointerId,target:(event.target as HTMLElement).closest?.('[data-viewport-id]')?.getAttribute('data-viewport-id')});},true);});
    const from=await handle.boundingBox(),to=await cards.first().getByRole('button',{name:/Drag to reorder:/}).boundingBox();
    await page.mouse.move(from!.x+from!.width/2,from!.y+from!.height/2);await page.mouse.down();
    await page.mouse.move(to!.x+to!.width/2,to!.y+to!.height/2,{steps:12});
    await expect(page.locator('[data-reordering="true"]')).toBeVisible();
    await expect(cards.first().getByText('Drop here',{exact:true})).toBeVisible();
    await page.mouse.up();
    console.log('DRAG EVENTS',await page.evaluate(()=>(window as any).__dragEvents),'ERRORS',errors,'HIT',await page.evaluate(({x,y})=>({tag:document.elementFromPoint(x,y)?.tagName,iframe:[...document.querySelectorAll('iframe')].map(frame=>getComputedStyle(frame).pointerEvents)}),{x:to!.x+to!.width/2,y:to!.y+to!.height/2}));
    const reordered=[original[3],original[0],original[1],original[2]];
    await expect.poll(ids).toEqual(reordered);
    await expect(cards.first().locator('iframe').contentFrame().getByRole('textbox',{name:'Name'})).toHaveValue('keep me');
    await expect.poll(()=>page.evaluate(async()=> (await (globalThis as any).chrome.storage.local.get('viewgrid.store.v1'))['viewgrid.store.v1'].model.viewports.map((viewport:{id:string})=>viewport.id))).toEqual(reordered);
    await page.reload();await expect.poll(ids).toEqual(reordered);evidence.push({reorder:'last-to-first-and-persist',status:'passed'});
    await page.emulateMedia({reducedMotion:'reduce'});
    await cards.first().getByRole('button',{name:/Drag to reorder:/}).focus();await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(ids).toEqual([reordered[1],reordered[0],reordered[2],reordered[3]]);
    expect(await cards.evaluateAll(elements=>elements.flatMap(element=>element.getAnimations()).length)).toBe(0);
    for(const layout of ['Row','Column','Freeform','Grid']){
      await page.getByRole('button',{name:layout,exact:true}).click();
      await expect(page.locator('[data-layout]')).toHaveAttribute('data-layout',{Row:'row',Column:'col',Freeform:'free',Grid:'grid'}[layout]!);
      const align=page.getByRole('button',{name:'Auto Align Grid',exact:true});
      if(layout!=='Freeform') await expect(align).toBeDisabled();
      if(layout==='Freeform'){
        await expect(align).toBeDisabled();
        const before=await ids();await cards.first().getByRole('button',{name:/Drag to reorder:/}).focus();await page.keyboard.press('Alt+ArrowRight');await expect.poll(ids).toEqual(before);
        await expect(align).toBeEnabled(); await align.click(); await expect(align).toBeDisabled();
      }
    }
    await page.getByRole('button',{name:'Fit to screen',exact:true}).click();
    await page.getByRole('button',{name:'Fit to screen',exact:true}).hover();
    expect(await page.getByRole('button',{name:'Fit to screen',exact:true}).evaluate(button=>getComputedStyle(button).transform)).toBe('none');
    await page.screenshot({path:`${out}/grid-1280.png`});await nativeSize(context,page,1920,1080);await page.getByRole('button',{name:'Fit to screen',exact:true}).click();await page.screenshot({path:`${out}/grid-1920.png`});
    let auditRequests=0;
    await context.route('https://**.googleapis.com/**',route=>{auditRequests++;return route.abort();});
    await page.getByRole('button',{name:'Local Performance',exact:true}).click();
    const dialog=page.getByRole('dialog'),region=dialog.getByRole('region',{name:'Analysis status'});
    await expect(dialog.getByRole('checkbox')).toHaveCount(0);
    await dialog.getByRole('button',{name:'Run All Analyses',exact:true}).click();
    await expect(region.locator('[data-analysis-status]')).toHaveText('Measurements captured');
    await dialog.getByRole('button',{name:'SEO & Accessibility',exact:true}).click();
    await expect(dialog.getByText('Document title',{exact:true})).toHaveCount(1);
    await page.screenshot({path:`${out}/analysis-local.png`});
    expect(auditRequests).toBe(0);expect(errors).toEqual([]);
    evidence.push({analysis:'local-no-service',auditRequests,pageErrors:errors,status:'passed'});
    await dialog.getByRole('button',{name:'Close dialog',exact:true}).click();
    if(process.env.VIEWGRID_LIVE_CASTPOST==='1'){
    await page.locator('header input').fill('https://castpost.app/en');await page.locator('header input').press('Enter');
    await expect.poll(()=>frames().filter(frame=>frame.url().startsWith('https://castpost.app/en')).length,{timeout:30000}).toBe(4);
    for(const frame of frames())await expect(frame.locator('body')).toContainText(/Cast\s*once/i,{timeout:30000});
    await sidebar.getByRole('button',{name:'Tools',exact:true}).click();await sidebar.getByRole('button',{name:'Scan Issues',exact:true}).click();
    await expect(drawer.getByText('Inspected DOM elements',{exact:false})).toBeVisible({timeout:15000});
    await page.screenshot({path:`${out}/castpost-live-scan.png`});
    evidence.push({target:'https://castpost.app/en',controlledMock:false,scope:'four real previews and local responsive scan; no Google measurement',status:'passed'});
    }
  }finally{await writeFile(`${out}/chromium-evidence.json`,JSON.stringify(evidence,null,2));await context.close();server.close();await rm(profile,{recursive:true,force:true});}
});
