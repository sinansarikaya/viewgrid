import { test, expect, chromium, type BrowserContext, type Page, type Frame } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { nativeSize } from './headed-window';
let server: Server, context: BrowserContext, page: Page, profile: string, base: string, extensionId: string;
const fixture = `<!doctype html><meta name="viewport" content="width=device-width"><style>body{margin:0;font:16px sans-serif}button{width:60px;height:44px}#small{width:30px;height:30px}#clipped{width:100px;overflow:hidden;white-space:nowrap}#intentional{width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.spacer{height:1800px}</style><h1>ViewGrid fixture</h1><input id="name"><button id="action" onclick="document.querySelector('#count').textContent=Number(document.querySelector('#count').textContent)+1">Count</button><span id="count">0</span><button id="small">Tiny</button><p id="clipped">This long text is accidentally clipped</p><p id="intentional">This long text is intentionally clipped</p><a id="next" href="/next">Next</a><button id="spa" onclick="history.pushState({},'', '/spa')">SPA</button><div style="overflow:hidden"><button id="wrapped-small" style="width:25px;height:25px">S</button><p id="vertical-clip" style="height:10px;width:80px;overflow:hidden">This wrapped text has several hidden lines</p></div><div id="crowded-row" style="display:flex;gap:0;margin-top:40px"><button id="crowded-a" class="crowded" style="width:16px;height:16px"><span>A</span></button><button id="crowded-b" class="crowded" style="width:16px;height:16px" aria-label="B">B</button></div><button id="optional" style="width:160px;height:42px;margin:40px 0">Optional target</button><div class="spacer"></div><footer>End</footer>`;
const frames = () => page.frames().filter(f => f.parentFrame() === page.mainFrame());
async function measureScrollSync(label: string) {
  const previews = frames();
  expect(previews).toHaveLength(4);
  await Promise.all(previews.map(frame => frame.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    (window as any).__vgScrollLatencies = [];
    window.addEventListener('message', event => {
      if (event.data?.type === 'vg/scroll-apply') (window as any).__vgScrollLatencies.push(Date.now() - event.data.env.ts);
    });
  })));
  await previews[0]!.evaluate(async () => {
    window.dispatchEvent(new Event('wheel'));
    for (let step = 1; step <= 20; step++) {
      const max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      window.scrollTo({ top: Math.round(max * step * 0.03), behavior: 'instant' });
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  });
  await expect.poll(async () => (await Promise.all(previews.slice(1).map(frame => frame.evaluate(() => (window as any).__vgScrollLatencies.length)))).every(count => count >= 5)).toBe(true);
  const latencies = (await Promise.all(previews.slice(1).map(frame => frame.evaluate(() => (window as any).__vgScrollLatencies as number[])))).flat().sort((a, b) => a - b);
  const p95 = latencies[Math.floor((latencies.length - 1) * 0.95)]!;
  await expect.poll(async () => {
    const ratios = await Promise.all(previews.map(frame => frame.evaluate(() => scrollY / (document.documentElement.scrollHeight - document.documentElement.clientHeight))));
    return ratios.every(ratio => Math.abs(ratio - ratios[0]!) < 0.02);
  }).toBe(true);
  console.log('SCROLL SYNC TIMING', { label, samples: latencies.length, medianMs: latencies[Math.floor(latencies.length / 2)], p95Ms: p95 });
  expect(p95).toBeLessThan(80);
}

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
    res.setHeader('Content-Type','text/html');
    if (req.url === '/slow-protected') { res.setHeader('X-Frame-Options','DENY'); setTimeout(() => res.end(fixture), 1000); }
    else res.end(fixture);
  });
  await new Promise<void>(resolve => server.listen(0,'127.0.0.1',resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
  profile = await mkdtemp(path.join(tmpdir(), 'viewgrid-e2e-'));
  const extension = path.resolve('dist/chromium');
  context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: false, viewport: null, args: ['--ozone-platform=x11', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  extensionId = worker.url().split('/')[2]!;
  page = await context.newPage();
  page.setDefaultTimeout(10000);
  await nativeSize(context, page, 1280, 800);
});
test.afterAll(async () => { await context?.close(); server?.close(); if(profile) await rm(profile,{recursive:true,force:true}); });
test.beforeEach(reset);

test('custom device rejects invalid values instead of silently substituting defaults', async () => {
  await page.getByRole('button', { name: '+ Add Device', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Add Devices' });
  await picker.getByRole('button', { name: 'Add Custom Device', exact: true }).click();
  await expect(picker.getByRole('alert')).toHaveText('Device name cannot be empty.');
  await picker.getByRole('textbox', { name: 'Device Name', exact: true }).fill('QA custom');
  await picker.getByRole('spinbutton', { name: 'Width (px)', exact: true }).fill('');
  await picker.getByRole('button', { name: 'Add Custom Device', exact: true }).click();
  await expect(picker.getByRole('alert')).toHaveText('Width must be a valid number between 100 and 10000 px.');
  await expect(page.locator('[data-viewport-id]')).toHaveCount(4);
  await picker.getByRole('spinbutton', { name: 'Width (px)', exact: true }).fill('540');
  await picker.getByRole('spinbutton', { name: 'Height (px)', exact: true }).fill('720');
  await picker.getByRole('spinbutton', { name: 'DPR', exact: true }).fill('2');
  await picker.getByRole('button', { name: 'Add Custom Device', exact: true }).click();
  await expect(picker).toHaveCount(0);
  await expect(page.locator('[data-viewport-id]')).toHaveCount(5);
  await expect.poll(() => frames().at(-1)!.evaluate(() => [innerWidth, innerHeight])).toEqual([540, 720]);
});

test('viewport duplicate and removal preserve previews, and compare modes remain usable', async () => {
  const originalIds = await page.locator('[data-viewport-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-viewport-id')));
  const first = page.locator('[data-viewport-id]').first();
  await first.getByRole('button', { name: /device settings$/i }).click();
  await first.getByRole('button', { name: 'Duplicate', exact: true }).click();
  await expect(page.locator('[data-viewport-id]')).toHaveCount(5);
  const newId = (await page.locator('[data-viewport-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-viewport-id')))).find(id => !originalIds.includes(id));
  expect(newId).toBeTruthy();
  const added = page.locator(`[data-viewport-id="${newId}"]`);
  await page.getByRole('button', { name: 'Fit to screen', exact: true }).click();
  await added.scrollIntoViewIfNeeded();
  await added.getByRole('button', { name: /device settings$/i }).click();
  await added.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.locator('[data-viewport-id]')).toHaveCount(4);
  expect(await page.locator('[data-viewport-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-viewport-id')))).toEqual(originalIds);
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.getByText('Visual Comparison / Diff', { exact: true })).toBeVisible();
  await expect.poll(() => frames().length).toBe(6);
  for (const mode of ['Overlay Curtain', 'Side by Side', 'Dual Split']) {
    await page.getByRole('button', { name: mode, exact: false }).click();
    await expect.poll(() => frames().filter(f => f.url().startsWith(base)).length).toBe(6);
  }
  await page.getByRole('button', { name: 'Dual Split', exact: false }).focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-kind="modal"]')).toHaveCount(0);
  await expect.poll(() => frames().length).toBe(4);
});

test('device picker resets brand, preserves default desktop orientation and favorite after reload', async () => {
  await page.getByRole('button', { name: '+ Add Device', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Add Devices' });
  await picker.getByRole('button', { name: 'Apple', exact: true }).click();
  await picker.getByRole('button', { name: 'Desktops', exact: true }).click();
  await picker.getByRole('checkbox', { name: 'Select Desktop 1080p', exact: true }).check();
  await picker.getByRole('button', { name: 'Toggle favorite for Desktop 1080p', exact: true }).click();
  await picker.getByRole('button', { name: 'Add 1 Selected Device', exact: true }).click();
  await expect(page.locator('iframe[name^="viewgrid:"]')).toHaveCount(5);
  await expect.poll(() => frames().at(-1)!.evaluate(() => [innerWidth, innerHeight])).toEqual([1920, 1080]);
  await page.waitForTimeout(800);
  await page.reload();
  await page.getByRole('button', { name: '+ Add Device', exact: true }).click();
  await picker.getByRole('button', { name: 'Favorites', exact: true }).click();
  await expect(picker.getByRole('checkbox', { name: 'Select Desktop 1080p', exact: true })).toBeVisible();
});

test('design overlay image opacity blend and removal do not modify preview content', async () => {
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await page.getByRole('button', { name: 'Design Overlay', exact: true }).click();
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'controlled-overlay.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64') });
  const overlay = page.getByAltText('Figma Spec Overlay', { exact: true });
  await expect(overlay).toBeVisible();
  const range = page.locator('input[type="range"]').last();
  await range.fill('35');
  await expect(overlay).toHaveCSS('opacity', '0.35');
  await page.locator('select').filter({ has: page.locator('option[value="difference"]') }).selectOption('difference');
  await expect(overlay).toHaveCSS('mix-blend-mode', 'difference');
  for (const frame of frames().filter(frame => frame.url().startsWith(base))) await expect(frame.locator('h1')).toHaveText('ViewGrid fixture');
  await page.getByRole('button', { name: "Mockup'ı Kaldır", exact: true }).click();
  await expect(overlay).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByText('Visual Comparison / Diff', { exact: true })).toHaveCount(0);
});

test('sidebar reorder hide restore and named workspace survive reload', async () => {
  const sidebar = page.getByRole('complementary', { name: 'Workspace tools and devices' });
  const ids = await page.locator('[data-viewport-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-viewport-id')));
  await sidebar.getByRole('button', { name: 'Move Down iPhone 15 Pro', exact: true }).click();
  await expect.poll(() => page.locator('[data-viewport-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-viewport-id')))).toEqual([ids[1], ids[0], ids[2], ids[3]]);
  await sidebar.getByRole('button', { name: /^Hide / }).first().click();
  await expect(page.locator('[data-viewport-id]')).toHaveCount(3);
  await sidebar.getByRole('button', { name: /^Show / }).click();
  await expect(page.locator('[data-viewport-id]')).toHaveCount(4);
  await sidebar.getByRole('button', { name: 'Workspace', exact: true }).click();
  await sidebar.getByPlaceholder('Workspace name').fill('QA preserved workspace');
  await sidebar.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(sidebar.getByText('QA preserved workspace', { exact: true })).toBeVisible();
  await page.waitForTimeout(800);
  await page.reload();
  await sidebar.getByRole('button', { name: 'Workspace', exact: true }).click();
  await expect(sidebar.getByText('QA preserved workspace', { exact: true })).toBeVisible();
  await sidebar.getByRole('button', { name: 'Load', exact: true }).click();
  await expect.poll(() => page.locator('[data-viewport-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-viewport-id')))).toEqual([ids[1], ids[0], ids[2], ids[3]]);
});

test('multi-selection group and recent devices persist without deduplicating independent viewports', async () => {
  await page.getByRole('button', { name: '+ Add Device', exact: true }).click();
  const picker = page.getByRole('dialog', { name: 'Add Devices' });
  await picker.getByRole('checkbox', { name: 'Select iPhone SE', exact: true }).check();
  await picker.getByRole('checkbox', { name: 'Select iPhone 15 Pro', exact: true }).check();
  await picker.getByRole('textbox', { name: 'Group name (e.g. Mobile + Tablet)', exact: true }).fill('QA phone group');
  await picker.getByRole('button', { name: 'Save Selected as Group', exact: true }).click();
  await picker.getByRole('button', { name: 'Add 2 Selected Devices', exact: true }).click();
  await expect(page.locator('[data-viewport-id]')).toHaveCount(6);
  await page.waitForTimeout(800);
  await page.reload();
  await page.getByRole('button', { name: '+ Add Device', exact: true }).click();
  await expect(picker.getByText('QA phone group', { exact: true })).toBeVisible();
  await picker.getByRole('button', { name: 'Select Group', exact: true }).click();
  await expect(picker.getByRole('checkbox', { name: 'Select iPhone SE', exact: true })).toBeChecked();
  await expect(picker.getByRole('checkbox', { name: 'Select iPhone 15 Pro', exact: true })).toBeChecked();
  await picker.getByRole('button', { name: 'Recent', exact: false }).click();
  await expect(picker.getByRole('checkbox', { name: 'Select iPhone SE', exact: true })).toBeVisible();
  await picker.getByRole('button', { name: 'Add 2 Selected Devices', exact: true }).click();
  await expect(page.locator('[data-viewport-id]')).toHaveCount(8);
  expect(new Set(await page.locator('[data-viewport-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-viewport-id')))).size).toBe(8);
});

test('local analysis needs no consent or audit service and rejects unopened targets', async () => {
  let requests = 0;
  await context.route('https://pagespeedonline.googleapis.com/**', route => { requests++; return route.abort(); });
  try {
    await page.getByRole('button', { name: 'Local Performance', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('checkbox')).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Run All Analyses', exact: true }).click();
    await expect(dialog.getByRole('region', { name: 'Analysis status' }).locator('[data-analysis-status]')).toHaveText('Measurements captured');
    await expect(dialog.locator('[class*="scoreBadge"]')).toHaveCount(0);
    await dialog.getByRole('textbox', { name: 'Target URL' }).fill(base + '/unopened');
    await dialog.getByRole('button', { name: 'Run All Analyses', exact: true }).click();
    await expect(dialog.getByRole('alert')).toHaveCount(2);
    await expect(dialog.getByRole('alert').first()).toContainText('does not match an open preview');
    expect(requests).toBe(0);
  } finally { await context.unroute('https://pagespeedonline.googleapis.com/**'); }
});

test('loads four actual frames, applies device dimensions and rotates', async () => {
  const first = page.locator('[data-viewport-id]').first();
  const frame = frames()[0]!;
  const before = await frame.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  await first.getByRole('button', { name: /device settings$/i }).click();
  await first.locator('button[title*="Rotate"],button[title*="orientation" i]').first().click();
  await expect.poll(() => frame.evaluate(() => innerWidth)).toBe(before.height);
});
test('workspace shell preserves logical viewports, collapse state and card actions', async () => {
  const sidebar = page.getByRole('complementary', { name: 'Workspace tools and devices' });
  const original = await frames()[0]!.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  for (const size of [{ width: 1280, height: 800 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(size);
    await page.getByRole('button', { name: /Fit to Screen/i }).click();
    expect(await frames()[0]!.evaluate(() => ({ width: innerWidth, height: innerHeight }))).toEqual(original);
    expect(await page.locator('main').evaluate(el => el.clientWidth)).toBeGreaterThan(500);
    await page.screenshot({ path: `test-results/development/workspace-${size.width}.png` });
  }
  await sidebar.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect(sidebar.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  await expect.poll(() => page.evaluate(async () => (await (globalThis as any).chrome.storage.local.get('viewgrid.sidebar.collapsed'))['viewgrid.sidebar.collapsed'])).toBe(true);
  await page.reload();
  await expect(sidebar.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  await sidebar.getByRole('button', { name: 'Devices', exact: true }).click();
  await expect(sidebar.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
  await expect.poll(() => page.evaluate(async () => (await (globalThis as any).chrome.storage.local.get('viewgrid.sidebar.collapsed'))['viewgrid.sidebar.collapsed'])).toBe(false);
  const first = page.locator('[data-viewport-id]').first();
  await first.getByRole('button', { name: /device settings$/i }).click();
  await first.getByRole('button', { name: /Minimize/i }).click();
  await expect(first.locator('iframe')).toHaveCount(0);
  await first.getByRole('button', { name: /Restore/i }).click();
  await expect(first.locator('iframe')).toHaveCount(1);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.locator('footer').evaluate(element => element.getBoundingClientRect().height)).toBeLessThanOrEqual(72);
  await page.screenshot({ path: 'test-results/development/workspace-narrow.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1280, height: 800 });
});
test('scroll mirrors promptly even when the target site requests smooth scrolling', async () => {
  await measureScrollSync('local fixture with CSS smooth scrolling');
});

test('balanced grid uses independent display scales and preserves saved manual zoom', async () => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const cssSizes = await Promise.all(frames().map(frame => frame.evaluate(() => [innerWidth, innerHeight])));
  await page.getByRole('button', { name: /Fit to Screen/i }).click();
  const scales = await page.locator('[data-viewport-id] iframe').evaluateAll(nodes => nodes.map(node => {
    const frame = node as HTMLIFrameElement;
    const rect = frame.getBoundingClientRect();
    return { height: rect.height, x: rect.width / frame.clientWidth, y: rect.height / frame.clientHeight };
  }));
  expect(Math.max(...scales.map(scale => scale.height)) / Math.min(...scales.map(scale => scale.height))).toBeLessThan(1.4);
  for (const scale of scales) expect(Math.abs(scale.x - scale.y)).toBeLessThan(0.001);
  expect(await Promise.all(frames().map(frame => frame.evaluate(() => [innerWidth, innerHeight])))).toEqual(cssSizes);
  await page.locator('[data-viewport-id]').first().getByRole('button', { name: /device settings$/i }).click();
  const zoom = page.locator('[data-viewport-id]').first().getByRole('combobox', { name: 'Display zoom (CSS size unchanged)' });
  await zoom.selectOption('0.5');
  await expect.poll(() => page.evaluate(async () => (await (globalThis as any).chrome.storage.local.get('viewgrid.store.v1'))['viewgrid.store.v1']?.model?.viewports?.[0]?.zoom)).toBe(0.5);
  await page.reload();
  await page.locator('[data-viewport-id]').first().getByRole('button', { name: /device settings$/i }).click();
  await expect(zoom).toHaveValue('0.5');
  await page.setViewportSize({ width: 1280, height: 800 });
});

test('short windows retain sidebar analysis actions and keyboard collapse controls', async () => {
  await page.setViewportSize({ width: 640, height: 480 });
  const sidebar = page.getByRole('complementary', { name: 'Workspace tools and devices' });
  const geo = sidebar.getByRole('button', { name: /GEO Signals/ });
  await geo.scrollIntoViewIfNeeded();
  await expect(geo).toBeVisible();
  const buttonBounds = await geo.boundingBox();
  const sidebarBounds = await sidebar.boundingBox();
  expect(buttonBounds!.y + buttonBounds!.height).toBeLessThanOrEqual(sidebarBounds!.y + sidebarBounds!.height + 1);
  await geo.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  const collapse = sidebar.getByRole('button', { name: 'Collapse sidebar' });
  await collapse.scrollIntoViewIfNeeded();
  await collapse.focus();
  await page.keyboard.press('Enter');
  await expect(sidebar.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  await sidebar.getByRole('button', { name: 'Devices', exact: true }).click();
  await expect(sidebar.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
});

test('layout, fit and alignment preserve the real CSS viewport and persist', async () => {
  const before = await Promise.all(frames().map(frame => frame.evaluate(() => [innerWidth, innerHeight])));
  for (const title of ['Row', 'Column', 'Freeform', 'Grid']) {
    await page.getByRole('button', { name: title, exact: false }).filter({ hasText: title }).first().click();
    await page.getByRole('button', { name: /Fit to Screen/i }).click();
    expect(await Promise.all(frames().map(frame => frame.evaluate(() => [innerWidth, innerHeight])))).toEqual(before);
  }
  await page.locator('select[title="Vertical alignment"]').selectOption('center');
  await page.locator('select[title="Horizontal alignment"]').selectOption('space-between');
  // Settings are intentionally persisted with an 800 ms debounce. Assert the
  // actual storage write before reload rather than racing the scheduled save.
  await expect.poll(() => page.evaluate(async () => {
    const saved = (await (globalThis as any).chrome.storage.local.get('viewgrid.store.v1'))['viewgrid.store.v1'];
    return [saved?.model?.alignItems, saved?.model?.justifyContent];
  })).toEqual(['center', 'space-between']);
  await page.reload();
  await expect(page.locator('select[title="Vertical alignment"]')).toHaveValue('center');
  await expect(page.locator('select[title="Horizontal alignment"]')).toHaveValue('space-between');
  await expect.poll(() => frames().filter(frame => frame.url().startsWith(base)).length).toBe(4);
  expect(await Promise.all(frames().map(frame => frame.evaluate(() => [innerWidth, innerHeight])))).toEqual(before);
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
  await page.getByRole('button', { name: 'Issues', exact: true }).click();
  const drawer = page.getByRole('complementary', { name: 'Responsive issues' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('element/viewport observations', { exact: false })).toBeVisible();
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
  expect(report.findings.some((g: any) => g.issue.selector === '#wrapped-small')).toBe(true);
  expect(report.findings.some((g: any) => g.issue.rule === 'target-spacing')).toBe(true);
  expect(report.findings.some((g: any) => g.occurrences.some((i: any) => i.selector === '#crowded-a') && g.occurrences.some((i: any) => i.selector === '#crowded-b'))).toBe(true);
  expect(report.findings.some((g: any) => g.issue.data.category === 'optional')).toBe(false);
  expect(report.excludedOptionalGroups).toBeGreaterThan(0);
  await drawer.getByRole('checkbox', { name: 'Include optional ergonomic advice', exact: false }).check();
  await expect(drawer.getByText('Optional target: 160×42 CSS px; optional 44px touch-target recommendation', { exact: true })).toBeVisible();

  expect(report.findings.some((g: any) => g.issue.rule === 'vertical-text-clipping')).toBe(true);
  expect(Object.values(report.coverage).every(count => Number(count) > 0)).toBe(true);
  const htmlDownload = page.waitForEvent('download');
  await drawer.getByRole('button', { name: 'Download report (HTML / print to PDF)', exact: true }).click();
  const htmlFile = await htmlDownload;
  expect(htmlFile.suggestedFilename()).toBe('viewgrid-scan-report.html');
  const htmlStream = await htmlFile.createReadStream();
  const htmlChunks: Buffer[] = []; for await (const chunk of htmlStream!) htmlChunks.push(chunk);
  const html = Buffer.concat(htmlChunks).toString();
  expect(html).toContain('Completed scan'); expect(html).toContain('vertical-text-clipping');

});
test('hard reload preserves application storage and URL', async () => {
  await frames()[0]!.evaluate(() => { localStorage.setItem('draft','keep-me'); sessionStorage.setItem('session-draft','keep-me'); });
  await page.getByRole('button', { name: /Hard reload/i }).click();
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
  await card.getByRole('button', { name: 'Screenshot (C)', exact: true }).click();
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

test('preview worker registration is blocked without changing ordinary-tab workers', async () => {
  const source = frames()[0]!;
  const result = await source.evaluate(async () => { try { await navigator.serviceWorker.register('/sw.js'); return 'registered'; } catch (e) { return (e as Error).name; } });
  expect(result).toBe('SecurityError');
  await source.evaluate(url => location.assign(url), base + '/protected-worker');
  await expect.poll(() => source.url()).toBe(base + '/protected-worker');
  await expect(source.locator('h1')).toHaveText('ViewGrid fixture');
  const ordinary = await context.newPage();
  await ordinary.goto(base + '/site');
  await ordinary.evaluate(async () => { await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready; });
  await expect.poll(() => ordinary.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await ordinary.close();
});

test('a delayed old-document reload cannot cancel a slow workspace URL change', async () => {
  const source = frames()[0]!;
  await Promise.all([page.waitForEvent('framenavigated', { predicate: f => f === source }), source.evaluate(() => location.reload())]);
  const input = page.locator('input').first();
  await input.fill(base + '/slow-protected'); await input.press('Enter');
  await expect.poll(() => frames().filter(f => f.url() === base + '/slow-protected').length).toBe(4);
  for (const frame of frames()) await expect(frame.locator('h1')).toHaveText('ViewGrid fixture');
});

test('CastPost loads from a worker-warmed profile, reopens and survives a browser restart', async () => {
  test.skip(!process.env.VIEWGRID_LIVE_TEST_URL, 'Live regression is opt-in');
  const url = process.env.VIEWGRID_LIVE_TEST_URL!;
  const normal = await context.newPage();
  await normal.goto(url);
  await expect(normal.locator('h1')).toContainText('Cast once.');
  await normal.evaluate(async () => { await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready; });
  await expect.poll(() => normal.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 20000 }).toBe(true);
  await normal.evaluate(async () => {
    localStorage.setItem('__viewgrid_preserve', 'keep');
    document.cookie = '__viewgrid_preserve=keep; SameSite=Lax; path=/';
    await (await caches.open('__viewgrid_preserve')).put('/__viewgrid_preserve', new Response('keep'));
  });
  console.log('CASTPOST WARM PROFILE', await normal.evaluate(() => ({ url: location.href, worker: navigator.serviceWorker.controller?.scriptURL })));
  for (const phase of ['first warm open', 'reopen', 'browser restart']) {
    if (phase === 'browser restart') {
      await context.close();
      const extension = path.resolve('dist/chromium');
      context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: false, viewport: null, args: ['--ozone-platform=x11', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
    } else await page.close();
    page = await context.newPage();
  page.setDefaultTimeout(10000);
  await nativeSize(context, page, 1280, 800);
    const diagnostics: string[] = [];
    page.on('console', m => diagnostics.push(`${m.type()}: ${m.text()}`));
    page.on('requestfailed', r => diagnostics.push(`failed: ${r.url()} ${r.failure()?.errorText}`));
    page.on('response', r => { if (r.request().isNavigationRequest()) diagnostics.push(`${r.status()} ${r.url()} SW=${r.fromServiceWorker()}`); });
    await page.goto(`chrome-extension://${extensionId}/workspace.html?url=${encodeURIComponent(url)}`);
    try {
      await expect(page.locator('iframe[name^="viewgrid:"]')).toHaveCount(4);
      await expect.poll(() => frames().filter(f => f.url().startsWith(url)).length, { timeout: 20000 }).toBe(4);
      for (const frame of frames()) await expect(frame.locator('h1')).toContainText('Cast once.', { timeout: 20000 });
      if (phase === 'first warm open') {
        const preserved = await normal.evaluate(async () => ({ storage: localStorage.getItem('__viewgrid_preserve'), cookie: document.cookie.includes('__viewgrid_preserve=keep'), cache: await (await (await caches.open('__viewgrid_preserve')).match('/__viewgrid_preserve'))?.text() }));
        expect(preserved).toEqual({ storage: 'keep', cookie: true, cache: 'keep' });
        console.log('PASS CASTPOST DATA PRESERVATION', preserved);
      }
      await page.screenshot({ path: `test-results/castpost-chromium-${phase.replace(/ /g, '-')}.png` });
      if (phase === 'first warm open') await measureScrollSync('castpost.app warm profile');
      if (phase === 'first warm open') {
        await page.getByRole('button', { name: 'Issues', exact: true }).click();
        const drawer = page.getByRole('complementary', { name: 'Responsive issues' });
        await expect(drawer.getByText('Last scan', { exact: false })).toBeVisible();
        await expect(drawer.getByText('Inspected DOM elements', { exact: false })).toBeVisible();

        const download = page.waitForEvent('download');
        await drawer.getByRole('button', { name: 'Export JSON' }).click();
        const file = await download;
        const stream = await file.createReadStream();
        const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(chunk);
        const scan = JSON.parse(Buffer.concat(chunks).toString());
        await writeFile('test-results/castpost-reviewed-report.json', JSON.stringify(scan, null, 2));
        expect(scan.failedViewports).toEqual([]);
        expect(scan.findings.every((g: any) => g.issue.data.category !== 'optional')).toBe(true);
        expect(scan.findings.every((g: any) => g.occurrences.every((i: any) => String(i.data.label || '').trim().length > 0))).toBe(true);
        expect(scan.findings.some((g: any) => new Set(g.occurrences.map((i: any) => i.selector)).size > 1)).toBe(true);
        console.log('CASTPOST ASSESSED SCAN', JSON.stringify({ groups: scan.findings.length, optionalExcluded: scan.excludedOptionalGroups, findings: scan.findings.map((g: any) => ({ rule: g.issue.rule, category: g.issue.data.category, elements: [...new Set(g.occurrences.map((i: any) => i.selector))], labels: [...new Set(g.occurrences.map((i: any) => i.data.label))] })) }));
        await page.screenshot({ path: 'test-results/castpost-reviewed-scan.png' });
        console.log('CASTPOST SCAN', await drawer.innerText());
        await drawer.getByRole('button', { name: 'Close issues' }).click();
      }

      await expect(page.getByTestId('extension-version')).toHaveText('v1.0.3');
      const source = frames()[0]!;
      expect(await source.evaluate(async () => { try { await navigator.serviceWorker.register('/sw.js'); return 'registered'; } catch (e) { return (e as Error).name; } })).toBe('SecurityError');
      await source.evaluate(() => history.replaceState({}, '', location.href + '#vg-sync-regression'));
      await expect.poll(() => frames().every(f => f.url().endsWith('#vg-sync-regression'))).toBe(true);
      await page.waitForTimeout(1500);
      await Promise.all([page.waitForEvent('framenavigated', { predicate: f => f === source }), source.evaluate(() => location.reload())]);
      await expect(source.locator('h1')).toContainText('Cast once.', { timeout: 20000 });
      console.log(`PASS CASTPOST CHROME: ${phase}, four healthy previews and reload`);
    } finally { console.log('CASTPOST DIAGNOSTICS', phase, JSON.stringify(diagnostics)); }
  }
});
