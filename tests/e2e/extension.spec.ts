import { test, expect, chromium, type BrowserContext, type Page, type Frame } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
let server: Server, context: BrowserContext, page: Page, profile: string, base: string, extensionId: string;
const fixture = `<!doctype html><meta name="viewport" content="width=device-width"><style>body{margin:0;font:16px sans-serif}button{width:60px;height:44px}#small{width:30px;height:30px}#clipped{width:100px;overflow:hidden;white-space:nowrap}#intentional{width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.spacer{height:1800px}</style><h1>ViewGrid fixture</h1><input id="name"><button id="action" onclick="document.querySelector('#count').textContent=Number(document.querySelector('#count').textContent)+1">Count</button><span id="count">0</span><button id="small">Tiny</button><p id="clipped">This long text is accidentally clipped</p><p id="intentional">This long text is intentionally clipped</p><a id="next" href="/next">Next</a><button id="spa" onclick="history.pushState({},'', '/spa')">SPA</button><div class="spacer"></div><footer>End</footer>`;
const frames = () => page.frames().filter(f => f.name().startsWith('viewgrid:'));
async function clickInPreview(frame: Frame, selector: string) {
  // CDP element quads in an OOPIF do not include the workspace's CSS scale.
  // Convert page-local coordinates to the rendered iframe before a trusted mouse click.
  const host = await frame.frameElement();
  await host.scrollIntoViewIfNeeded();
  const box = (await host.boundingBox())!;
  const target = await frame.locator(selector).evaluate(el => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, width: innerWidth, height: innerHeight };
  });
  await page.mouse.click(box.x + target.x * box.width / target.width, box.y + target.y * box.height / target.height);
}
async function reset() {
  await page.bringToFront();
  if (page.url().startsWith('chrome-extension://')) await page.evaluate(() => (globalThis as any).chrome.storage.local.clear());
  await page.goto(`chrome-extension://${extensionId}/workspace.html?url=${encodeURIComponent(base + '/site')}`);
  await expect(page.locator('iframe[name^="viewgrid:"]')).toHaveCount(4);
  await expect.poll(() => frames().filter(f => f.url().startsWith(base)).length).toBe(4);
  for (const frame of frames()) await expect(frame.locator('h1')).toHaveText('ViewGrid fixture');
}
test.beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/sw.js') { res.setHeader('Content-Type', 'application/javascript'); res.end("self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(fetch(e.request));});"); return; }
    if (req.url === '/host') { res.setHeader('Content-Type','text/html'); res.end('<iframe src="/protected"></iframe>'); return; }
    if (req.url?.startsWith('/protected')) { res.setHeader('X-Frame-Options','DENY'); res.setHeader('Content-Security-Policy',"frame-ancestors 'none'"); }
    res.setHeader('Content-Type','text/html'); res.end(fixture);
  });
  await new Promise<void>(resolve => server.listen(0,'127.0.0.1',resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
  profile = await mkdtemp(path.join(tmpdir(), 'viewgrid-e2e-'));
  const extension = path.resolve('dist/chromium');
  context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: true, viewport: { width: 1280, height: 800 }, args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  extensionId = worker.url().split('/')[2]!;
  page = await context.newPage();
});
test.afterAll(async () => { await context?.close(); server?.close(); if(profile) await rm(profile,{recursive:true,force:true}); });
test.beforeEach(reset);

test('loads four actual frames, applies device dimensions and rotates', async () => {
  const first = page.locator('[data-viewport-id]').first();
  const frame = frames()[0]!;
  const before = await frame.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  await first.locator('button[title*="Rotate"],button[title*="orientation" i]').first().click();
  await expect.poll(() => frame.evaluate(() => innerWidth)).toBe(before.height);
});
test('normal tabs retain framing protections while a direct workspace preview loads', async () => {
  const ordinary = await context.newPage();
  await ordinary.goto(base + '/host');
  // Chromium's blocked-frame error document has its own h1; verify the protected content never rendered.
  await expect(ordinary.frameLocator('iframe').locator('body')).not.toContainText('ViewGrid fixture');
  expect(ordinary.frames().some(f => f.url() === base + '/protected')).toBe(false);
  await ordinary.close(); await page.bringToFront();
  const input = page.locator('input').first(); await input.fill(base + '/protected'); await input.press('Enter');
  await expect.poll(() => frames().filter(f=>f.url()===base+'/protected').length).toBe(4);
  for(const frame of frames()) await expect(frame.locator('h1')).toHaveText('ViewGrid fixture');
  const rules = await page.evaluate(() => (globalThis as any).chrome.declarativeNetRequest.getSessionRules());
  expect(rules[0].condition.tabIds).toHaveLength(1);
  expect(rules[0].condition.initiatorDomains).toBeUndefined();
});
test('click and scroll sync continue immediately after source reload', async () => {
  let source = frames()[0]!;
  await clickInPreview(source, '#action');
  await expect.poll(async () => Promise.all(frames().map(f=>f.locator('#count').textContent()))).toEqual(['1','1','1','1']);
  await source.evaluate(() => location.reload());
  await expect(source.locator('h1')).toBeVisible();
  await page.waitForTimeout(1000);
  source = frames()[0]!;
  await clickInPreview(source, '#action');
  await expect.poll(async () => Promise.all(frames().map(f=>f.locator('#count').textContent()))).toEqual(['1','1','1','1']);
  await source.evaluate(() => { window.dispatchEvent(new Event('wheel')); window.scrollTo(0,600); });
  await expect.poll(async () => (await Promise.all(frames().map(f=>f.evaluate(()=>scrollY)))).every(y=>y>0)).toBe(true);
});
test('navigation works with click sync disabled; SPA navigation follows', async () => {
  // Sync controls are real workspace checkboxes, ordered by the channel labels.
  await page.locator('summary').filter({ hasText: 'Sync' }).click();
  const checkboxes = page.locator('input[type="checkbox"]');
  await checkboxes.nth(1).uncheck();
  await page.locator('summary').filter({ hasText: 'Sync' }).click();
  await clickInPreview(frames()[0]!, '#next');
  await expect.poll(() => frames().every(f=>f.url()===base+'/next')).toBe(true);
  await clickInPreview(frames()[0]!, '#spa');
  await expect.poll(() => frames().every(f=>f.url()===base+'/spa')).toBe(true);
});
test('scan groups repeated findings, shows evidence and exports a structured report', async () => {
  await page.locator('button').filter({ hasText: '🔍' }).click();
  const drawer = page.getByRole('complementary');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('viewport occurrences', { exact: false })).toBeVisible();
  await expect(drawer.locator('article')).not.toHaveCount(0);
  await expect(drawer.locator('code').filter({ hasText: '#intentional' })).toHaveCount(0);
  await drawer.getByRole('button', { name: 'Copy report', exact: true }).click();
  await expect(page.getByText('Copied', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await drawer.getByRole('button', { name: 'Export JSON' }).click();
  const file = await download; expect(file.suggestedFilename()).toBe('viewgrid-issues.json');
  const stream = await file.createReadStream();
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(chunk);
  const report = JSON.parse(Buffer.concat(chunks).toString());
  expect(report.heuristic).toBe(true);
  expect(report.failedViewports).toEqual([]);
  expect(report.findings.some((g: any) => g.issue.selector === '#small')).toBe(true);
  expect(report.findings.some((g: any) => g.occurrences.length > 1)).toBe(true);
});
test('hard reload preserves application storage and URL', async () => {
  await frames()[0]!.evaluate(() => { localStorage.setItem('draft','keep-me'); sessionStorage.setItem('session-draft','keep-me'); });
  await page.locator('button').filter({ hasText:'🧹' }).click();
  await expect(page.locator('iframe[name^="viewgrid:"]')).toHaveCount(4);
  await expect.poll(()=>frames().filter(f=>f.url()===base+'/site').length).toBe(4);
  expect(await frames()[0]!.evaluate(()=>localStorage.getItem('draft'))).toBe('keep-me');
  expect(await frames()[0]!.evaluate(()=>sessionStorage.getItem('session-draft'))).toBe('keep-me');
});
test('captures the full logical device viewport and restores the workspace', async () => {
  const card = page.locator('[data-viewport-id]').first();
  const frame = frames()[0]!;
  const size = await frame.evaluate(()=>({width:innerWidth,height:innerHeight}));
  const download = page.waitForEvent('download');
  await card.locator('button').filter({hasText:'📷'}).click();
  const file = await download; const stream = await file.createReadStream();
  const chunks: Buffer[]=[]; for await(const chunk of stream!) chunks.push(chunk);
  const png = Buffer.concat(chunks);
  expect(png.subarray(1,4).toString()).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(size.width); expect(png.readUInt32BE(20)).toBe(size.height);
  await expect(page.locator('body')).not.toHaveAttribute('data-viewgrid-capture','true');
  await expect(frame.locator('h1')).toHaveText('ViewGrid fixture');
});


test('protected previews retain framing exceptions after their own navigation and reload', async () => {
  const input = page.locator('input').first();
  await input.fill(base + '/protected'); await input.press('Enter');
  await expect.poll(() => frames().filter(f => f.url() === base + '/protected').length).toBe(4);
  for (const frame of frames()) await expect(frame.locator('h1')).toHaveText('ViewGrid fixture');
  await frames()[0]!.evaluate(url => location.assign(url), base + '/protected-next');
  await expect.poll(() => frames().filter(f => f.url() === base + '/protected-next').length).toBeGreaterThan(0);
  await expect(frames()[0]!.locator('h1')).toHaveText('ViewGrid fixture');
  const source = frames()[0]!;
  await Promise.all([page.waitForEvent('framenavigated', { predicate: f => f === source }), source.evaluate(() => location.reload())]);
  await expect(source.locator('h1')).toHaveText('ViewGrid fixture');
});

test('a service-worker controlled preview can navigate to a protected network document', async () => {
  const source = frames()[0]!;
  await source.evaluate(async () => { await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready; });
  await expect.poll(() => source.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await source.evaluate(url => location.assign(url), base + '/protected-worker');
  await expect.poll(() => source.url()).toBe(base + '/protected-worker');
  await expect(source.locator('h1')).toHaveText('ViewGrid fixture');
});

test('reported CastPost URL loads and survives reload in actual Chrome', async () => {
  test.skip(!process.env.VIEWGRID_LIVE_TEST_URL, 'Live regression is opt-in');
  const diagnostics: string[] = [];
  page.on('console', m => diagnostics.push(`${m.type()}: ${m.text()}`));
  page.on('requestfailed', r => diagnostics.push(`request failed: ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', r => { if (r.request().isNavigationRequest()) diagnostics.push(`navigation: ${r.status()} ${r.url()} SW=${r.fromServiceWorker()}`); });
  const input = page.locator('input').first();
  await input.fill(process.env.VIEWGRID_LIVE_TEST_URL!); await input.press('Enter');
  try {
    for (const frame of frames()) await expect(frame.locator('h1')).toContainText('Cast once.', { timeout: 20000 });
    const source = frames()[0]!;
    await page.waitForTimeout(1500); // Allow the site's worker activation before testing reload.
    await Promise.all([
      page.waitForEvent('framenavigated', { predicate: f => f === source }),
      source.evaluate(() => location.reload()),
    ]);
    await expect(source.locator('h1')).toContainText('Cast once.', { timeout: 20000 });
  } finally { console.log('CASTPOST DIAGNOSTICS', JSON.stringify(diagnostics)); }
});
