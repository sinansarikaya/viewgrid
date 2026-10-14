import { test, expect, chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('headed actual browser zoom keeps SVG controls and fitted grid usable', async () => {
  test.setTimeout(120000);
  if (!process.env.DISPLAY) throw new Error('Headed QA requires the user desktop DISPLAY; no headless fallback.');
  const output = 'test-results/development/icon-grid';
  await mkdir(output, { recursive: true });
  const server = createServer((_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><meta name="viewport" content="width=device-width"><h1>ViewGrid layout fixture</h1><input aria-label="Name"><p>Local fixture, no outside service.</p>');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as {port:number}).port}`;
  const profile = await mkdtemp(path.join(tmpdir(), 'viewgrid-icon-qa-'));
  const extension = path.resolve('dist/chromium');
  const context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: false, chromiumSandbox: true, viewport: null, slowMo: 150, args: ['--ozone-platform=x11', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  const records: unknown[] = [];
  const pageErrors: string[] = [], failedExtensionAssets: string[] = [];
  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const id = worker.url().split('/')[2];
    const page = await context.newPage();
    page.on('pageerror', error=>pageErrors.push(error.message));
    page.on('requestfailed', request=>{ if (request.url().startsWith('chrome-extension://') && /\.(js|css|svg)(\?|$)/.test(request.url())) failedExtensionAssets.push(request.url()); });
    await page.goto(`chrome-extension://${id}/workspace.html?url=${encodeURIComponent(base)}`);
    await expect.poll(() => page.frames().filter(frame => frame.parentFrame() === page.mainFrame() && frame.url() === base + '/').length).toBe(4);
    const session = await context.newCDPSession(page);
    const { windowId } = await session.send('Browser.getWindowForTarget');
    if (process.env.HYPRLAND_INSTANCE_SIGNATURE) {
      const browserSession = await context.browser()!.newBrowserCDPSession();
      const processes = await browserSession.send('SystemInfo.getProcessInfo');
      const pid = processes.processInfo.find(item => item.type === 'browser')?.id;
      if (!pid) throw new Error('Cannot verify ownership of the headed browser process.');
      const clients = JSON.parse(execFileSync('hyprctl',['-j','clients'],{encoding:'utf8'}));
      const owned = clients.filter((client:{pid:number})=>client.pid === pid);
      if (owned.length !== 1) throw new Error('Expected one compositor window owned by this isolated browser.');
      console.log('OWNED HEADED WINDOW',{pid,address:owned[0].address,floating:owned[0].floating});
      if (!owned[0].floating) {
        const reply = execFileSync('hyprctl',['eval',`local w=hl.get_window("pid:${pid}"); assert(w,"Own test window missing"); hl.dispatch(hl.dsp.window.fullscreen_state({internal=0,client=0,action="set",layout_aware=false,window=w})); hl.dispatch(hl.dsp.window.float({action="set",window=w}))`],{encoding:'utf8'});
        if (!reply.trim().includes('ok')) throw new Error(`Own-window floating dispatch rejected: ${reply}`);
        await expect.poll(() => JSON.parse(execFileSync('hyprctl',['-j','clients'],{encoding:'utf8'})).find((client:{pid:number})=>client.pid===pid)?.floating).toBe(true);
      }
      await browserSession.detach();
    }
    await session.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'normal'}});
    await expect.poll(async () => (await session.send('Browser.getWindowBounds',{windowId})).bounds.windowState).toBe('normal');
    for (const size of [{width:1280,height:800},{width:1920,height:1080}]) {
      await page.evaluate(async () => { const api = (globalThis as any).chrome; const tab = await api.tabs.getCurrent(); await api.tabs.setZoom(tab.id, 1); });
      const border = await page.evaluate(() => ({ width: outerWidth - innerWidth, height: outerHeight - innerHeight }));
      await session.send('Browser.setWindowBounds', { windowId, bounds: { width: size.width + border.width, height: size.height + border.height } });
      await page.waitForTimeout(1000); // Native compositor resize/animation must settle before calibration.
      for (let attempt=0; attempt<3; attempt++) {
        const inner=await page.evaluate(() => ({width:innerWidth,height:innerHeight}));
        if (inner.width===size.width && inner.height===size.height) break;
        const current=await session.send('Browser.getWindowBounds',{windowId});
        console.log('HEADED WINDOW CALIBRATION',{attempt,target:size,inner,bounds:current.bounds});
        await session.send('Browser.setWindowBounds',{windowId,bounds:{width:current.bounds.width!+size.width-inner.width,height:current.bounds.height!+size.height-inner.height}});
        await page.waitForTimeout(1000);
        await expect.poll(() => page.evaluate(() => [innerWidth,innerHeight])).not.toEqual([inner.width,inner.height]);
      }
      await expect.poll(() => page.evaluate(() => [innerWidth,innerHeight])).toEqual([size.width,size.height]);
      for (const factor of [0.8,1,1.25]) {
        const actual = await page.evaluate(async factor => { const api = (globalThis as any).chrome; const tab = await api.tabs.getCurrent(); await api.tabs.setZoom(tab.id, factor); return api.tabs.getZoom(tab.id); }, factor);
        expect(actual).toBe(factor);
        await page.waitForTimeout(500);
        const physical = await page.evaluate(factor => ({width:Math.round(innerWidth*factor),height:Math.round(innerHeight*factor)}),factor);
        expect(Math.abs(physical.width-size.width)).toBeLessThanOrEqual(1);
        expect(Math.abs(physical.height-size.height)).toBeLessThanOrEqual(1);
        await page.getByRole('button', {name:/Fit to screen/i}).click();
        const fitSpacing = await page.getByRole('button',{name:/Fit to screen/i}).evaluate(button=>{
          const icon=button.querySelector('svg')!.getBoundingClientRect();
          const text=[...button.childNodes].find(node=>node.nodeType===Node.TEXT_NODE && node.textContent?.trim());
          if (!text) throw new Error('Fit label missing');
          const range=document.createRange();range.selectNodeContents(text);
          return {iconRight:icon.right,textLeft:range.getBoundingClientRect().left};
        });
        expect(fitSpacing.textLeft-fitSpacing.iconRight).toBeGreaterThanOrEqual(6);
        await expect.poll(() => page.locator('[data-viewport-id]').evaluateAll(cards => cards.every(card => {
          const canvas = card.closest('main')!.getBoundingClientRect(), box = card.getBoundingClientRect();
          return box.top >= canvas.top - 1 && box.bottom <= canvas.bottom + 1 && box.left>=canvas.left-1 && box.right<=canvas.right+1;
        }))).toBe(true);
        console.log('FIT WRAPPER GEOMETRY', await page.locator('[data-viewport-id] iframe').evaluateAll(frames => frames.map(frame => {
          const wrapper=frame.closest('[class*="deviceFrameWrapper"]')!, device=frame.closest('[class*="frameContainer"]');
          return {wrapper:[wrapper.clientWidth,wrapper.clientHeight,wrapper.scrollWidth,wrapper.scrollHeight],device:device?.getBoundingClientRect().toJSON(),card:frame.closest('[data-viewport-id]')!.getBoundingClientRect().toJSON()};
        })));
        await expect.poll(() => page.locator('[data-viewport-id] iframe').evaluateAll(frames => frames.every(frame => {
          const area=frame.parentElement!.parentElement!.getBoundingClientRect(), box=frame.getBoundingClientRect();
          return box.top>=area.top-1 && box.bottom<=area.bottom+1 && box.left>=area.left-1 && box.right<=area.right+1;
        }))).toBe(true);
        await expect.poll(() => page.locator('[data-viewport-id] iframe').evaluateAll(frames => frames.every(frame => {
          const wrapper=frame.closest('[class*="deviceFrameWrapper"]')!;
          return wrapper.scrollWidth<=wrapper.clientWidth+1 && wrapper.scrollHeight<=wrapper.clientHeight+1;
        }))).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const geometry = await page.locator('[data-viewport-id] iframe').evaluateAll(frames => frames.map(element => {
          const iframe = element as HTMLIFrameElement, box = iframe.getBoundingClientRect();
          return { cssWidth:iframe.clientWidth, cssHeight:iframe.clientHeight, x:box.width/iframe.clientWidth, y:box.height/iframe.clientHeight };
        }));
        for (const item of geometry) expect(Math.abs(item.x-item.y)).toBeLessThan(0.001);
        expect(geometry.map(item => [item.cssWidth,item.cssHeight])).toEqual([[393,852],[820,1180],[1280,800],[1920,1080]]);
        const viewport = await page.evaluate(() => ({ cssWidth:innerWidth,cssHeight:innerHeight,dpr:devicePixelRatio,outerWidth,outerHeight }));
        records.push({ physicalWorkspace:size, actualBrowserZoom:actual, viewport, geometry, fitSpacing });
        // Playwright's CSS clip can crop native pixels under actual tabs zoom.
        // Capture the un-clipped native surface and assert its physical size.
        const shot = await session.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
        const png = Buffer.from(shot.data,'base64');
        expect(png.readUInt32BE(16)).toBe(size.width);
        expect(png.readUInt32BE(20)).toBe(size.height);
        await writeFile(`${output}/chromium-${size.width}x${size.height}-browser-${Math.round(factor*100)}.png`,png);
      }
    }
    await page.evaluate(async () => { const api=(globalThis as any).chrome; const tab=await api.tabs.getCurrent(); await api.tabs.setZoom(tab.id,1); });
    for (const layout of ['Grid','Row','Column','Freeform']) {
      await page.getByRole('button', {name:layout,exact:false}).filter({hasText:layout}).first().click();
      await expect(page.locator('main [data-layout]')).toHaveAttribute('data-layout', {Grid:'grid',Row:'row',Column:'col',Freeform:'free'}[layout]!);
      expect(await page.locator('[data-viewport-id] iframe').evaluateAll(frames=>frames.map(frame=>[(frame as HTMLElement).clientWidth,(frame as HTMLElement).clientHeight]))).toEqual([[393,852],[820,1180],[1280,800],[1920,1080]]);
    }
    const fit = page.getByRole('button', {name:/Fit to screen/i});
    await fit.hover();
    await expect(page.getByRole('tooltip').filter({hasText:/Fit to screen/i})).toBeVisible();
    await page.mouse.move(0,0);
    await fit.focus();
    await expect(page.getByRole('tooltip').filter({hasText:/Fit to screen/i})).toBeVisible();
    await page.locator('header').screenshot({path:`${output}/toolbar-closeup.png`});
    await expect(page.locator('header svg')).not.toHaveCount(0);
    await session.send('Browser.setWindowBounds', {windowId,bounds:{width:640,height:640,windowState:'normal'}});
    await page.waitForTimeout(1000);
    await expect.poll(()=>page.evaluate(()=>innerWidth)).toBe(640);
    // Below 900px the existing sidebar is an intentional overlay drawer.
    // Dismiss it through its real control before interacting with the canvas.
    await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
    await expect(page.getByRole('button',{name:'Expand sidebar',exact:true})).toBeVisible();
    await expect.poll(()=>page.getByRole('complementary',{name:'Workspace tools and devices'}).evaluate(sidebar=>sidebar.getBoundingClientRect().width)).toBeLessThanOrEqual(49);
    const canvasLeft=await page.locator('main').evaluate(main=>main.getBoundingClientRect().left);
    for (const layout of ['Grid','Row','Column','Freeform']) {
      const control=page.getByRole('button',{name:layout,exact:false}).filter({hasText:layout}).first();
      const box=await control.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(canvasLeft);
      expect(box!.x+box!.width).toBeLessThanOrEqual(640);
      expect(await control.evaluate(button=>{
        const b=button.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);
        return hit===button || (hit!==null && button.contains(hit));
      })).toBe(true);
    }
    const narrowGrid=page.getByRole('button',{name:'Grid',exact:true});
    await narrowGrid.click({timeout:3000});
    records.push({kind:'narrow',actualBrowserZoom:1,viewport:await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})),nativeBounds:(await session.send('Browser.getWindowBounds',{windowId})).bounds});
    await page.screenshot({path:`${output}/narrow.png`});
    expect(pageErrors).toEqual([]);
    expect(failedExtensionAssets).toEqual([]);
    records.push({pageErrors,failedExtensionAssets});
  } finally {
    await writeFile(`${output}/chromium-evidence.json`,JSON.stringify(records,null,2));
    await context.close(); server.close(); await rm(profile,{recursive:true,force:true});
  }
});
