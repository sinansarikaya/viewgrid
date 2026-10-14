import { expect, type BrowserContext, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';

export async function nativeSize(context:BrowserContext,page:Page,width:number,height:number){
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
