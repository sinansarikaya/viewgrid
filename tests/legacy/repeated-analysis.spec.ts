import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

let context: BrowserContext, page: Page, server: Server, profile: string, extensionId: string, base: string;
let unmatchedGoogleRequests: string[] = [];
const fixture = JSON.parse(readFileSync('tests/fixtures/psi-response.json', 'utf8'));
test.beforeAll(async () => {
  server = createServer((_, response) => { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><h1>ViewGrid local report fixture</h1><p>Local-only screenshot content.</p>'); });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  profile = await mkdtemp(path.join(tmpdir(), 'viewgrid-repeat-'));
  const extension = path.resolve('dist/chromium');
  context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: true, viewport: { width: 1280, height: 800 }, args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  extensionId = worker.url().split('/')[2]!;
  page = await context.newPage();
});
test.afterAll(async () => { await context?.close(); server?.close(); if (profile) await rm(profile, { recursive: true, force: true }); });
test.beforeEach(async () => {
  await context.unrouteAll();
  unmatchedGoogleRequests = [];
  await context.route('https://**.googleapis.com/**', async route => {
    unmatchedGoogleRequests.push(route.request().url());
    await route.abort('blockedbyclient');
  });
  if (page.url().startsWith('chrome-extension://')) await page.evaluate(() => (globalThis as any).chrome.storage.local.clear());
  await page.goto(`chrome-extension://${extensionId}/workspace.html?url=${encodeURIComponent(base)}`);
  await expect(page.locator('iframe[name^="viewgrid:"]')).toHaveCount(4);
  await page.getByRole('button', { name: 'Performance & CrUX', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Target URL', exact: true }).fill('https://example.com/');
  await dialog.getByRole('combobox', { name: 'Run Count', exact: true }).selectOption('3');
  await dialog.locator('input[type="checkbox"]').first().check();
});
test.afterEach(() => { expect(unmatchedGoogleRequests, 'Google calls must match a controlled response handler').toEqual([]); });

test('[CONTROLLED MOCK] three sequential measurements export median with samples and redacted raw runs', async () => {
  let calls = 0;
  await context.route('https://pagespeedonline.googleapis.com/pagespeedonline/**', async route => {
    const response = structuredClone(fixture);
    response.lighthouseResult.audits['largest-contentful-paint'].numericValue = [3000, 1000, 2000][calls];
    calls++;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) });
  });
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Run Analysis', exact: true }).click();
  await expect.poll(() => calls).toBe(3);
  await expect(dialog.getByRole('heading', { name: 'Multi-Run Repetition Summary (Median)', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Reports & History', exact: true }).click();
  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export JSON', exact: true }).click();
  const file = await download;
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const report = JSON.parse(Buffer.concat(chunks).toString());
  expect(report.reportKind).toBe('repeated-analysis');
  expect(report.repeatedAnalysis.completedCount).toBe(3);
  expect(report.repeatedAnalysis.runs).toHaveLength(3);
  expect(report.repeatedAnalysis.profiles[0].lab.metrics.lcpMs).toEqual({ median: 2000, sampleCount: 3 });
  expect(report.repeatedAnalysis.fieldAggregation).toBe('not-aggregated');
  expect(report.repeatedAnalysis.controlledMock).toBe(true);
  expect(report.repeatedAnalysis.profiles[0].engine.userAgent).toBeNull();
  await expect.poll(() => page.evaluate(async () => {
    const storage = await (globalThis as any).chrome.storage.local.get(null);
    return JSON.stringify(storage);
  })).toContain('https://example.com/');
});

test('[CONTROLLED MOCK] a quota response stops repetition after the first request', async () => {
  let calls = 0;
  await context.route('https://pagespeedonline.googleapis.com/pagespeedonline/**', async route => { calls++; await route.fulfill({ status: 429, contentType: 'application/json', body: '{}' }); });
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Run Analysis', exact: true }).click();
  await expect(dialog.getByText(/rate limit exceeded/i).first()).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Run Analysis', exact: true })).toBeVisible();
  expect(calls).toBe(1);
  await expect(dialog.locator('[class*="scoreValueNone"]')).toHaveText(['—', '—', '—']);
  await expect(dialog.locator('[class*="scoreValueGood"], [class*="scoreValueAverage"], [class*="scoreValuePoor"]')).toHaveCount(0);
});

test('[CONTROLLED MOCK] cancellation prevents later rounds and obsolete result display', async () => {
  let calls = 0;
  await context.route('https://pagespeedonline.googleapis.com/pagespeedonline/**', async route => {
    calls++;
    await new Promise(resolve => setTimeout(resolve, 400));
    try { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) }); } catch { /* Request legitimately aborted. */ }
  });
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Run Analysis', exact: true }).click();
  await expect.poll(() => calls).toBe(1);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Run Analysis', exact: true })).toBeVisible();
  await page.waitForTimeout(500);
  expect(calls).toBe(1);
  await expect(dialog.getByRole('heading', { name: 'Multi-Run Repetition Summary (Median)', exact: true })).toHaveCount(0);
});

test('[CONTROLLED MOCK] viewport attachment uses real local capture and stays outside history and network', async () => {
  let calls = 0;
  await context.route('https://pagespeedonline.googleapis.com/pagespeedonline/**', async route => { calls++; await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) }); });
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Run Analysis', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Multi-Run Repetition Summary (Median)', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Run Analysis', exact: true })).toBeVisible();
  await page.frameLocator('iframe[name^="viewgrid:"]').first().getByRole('heading', { name: 'ViewGrid local report fixture' }).waitFor();
  await dialog.getByRole('button', { name: 'Reports & History', exact: true }).click();
  await dialog.getByRole('button', { name: 'Attach Viewport Screenshot to Report', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Remove Screenshot', exact: true })).toBeVisible({ timeout: 15000 });
  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export JSON', exact: true }).click();
  const file = await download;
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const report = JSON.parse(Buffer.concat(chunks).toString());
  expect(report.viewportScreenshot.cssWidth).toBe(393);
  expect(report.viewportScreenshot.cssHeight).toBe(852);
  expect(report.viewportScreenshot.previewUrl).toBe(`${base}/`);
  const png = Buffer.from(report.viewportScreenshot.pngDataUrl.split(',')[1], 'base64');
  expect(png.readUInt32BE(16)).toBe(393);
  expect(png.readUInt32BE(20)).toBe(852);
  expect(calls).toBe(3);
  const storage = await page.evaluate(async () => (globalThis as any).chrome.storage.local.get(null));
  expect(JSON.stringify(storage)).not.toContain('data:image/png;base64,');
  const htmlDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Download HTML Report', exact: true }).click();
  const htmlStream = await (await htmlDownload).createReadStream();
  const htmlChunks: Buffer[] = [];
  for await (const chunk of htmlStream!) htmlChunks.push(chunk);
  const outputPage = await context.newPage();
  try {
    await outputPage.setContent(Buffer.concat(htmlChunks).toString());
    await expect.poll(() => outputPage.locator('img.viewgrid-report-screenshot').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(393);
    expect(await outputPage.evaluate(() => document.querySelectorAll('script').length)).toBe(0);
  } finally { await outputPage.close(); }
  await dialog.getByRole('button', { name: 'Remove Screenshot', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Attach Viewport Screenshot to Report', exact: true })).toBeVisible();
});
