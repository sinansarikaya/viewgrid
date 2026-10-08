import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve('website/dist');
const server = createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    const data = await readFile(file);
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' })[path.extname(file)] || 'application/octet-stream');
    response.end(data);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.goto(base);
  assert.match(await page.locator('.brand-title').innerText(), /1\.0\.3/);
  for (const [language, expected] of [['tr', 'tr'], ['en', 'en'], ['no', 'en']]) {
    await page.locator(`.lang-btn[data-lang="${language}"]`).click();
    assert.equal(await page.locator('#promo-source').getAttribute('src'), `/videos/viewgrid-promo-${expected}.mp4`);
    assert.equal(await page.locator('#promo-video').evaluate(video => video.paused), true);
    const response = await page.request.get(base + `/videos/viewgrid-promo-${expected}.mp4`);
    assert.equal(response.status(), 200); assert.equal(response.headers()['content-type'], 'video/mp4');
  }
  await page.locator('#walkthrough').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/website-video.png' });
  await page.goto(base + '/changelog/');
  await page.getByRole('heading', { name: 'Changelog', exact: true }).waitFor();
  assert.match(await page.locator('main').innerText(), /1\.0\.3/);
  await page.screenshot({ path: 'test-results/website-changelog.png', fullPage: true });
  console.log('PASS website: 1.0.3, TR/EN/NO video sources, playable MP4 assets, no autoplay and changelog page');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
