import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { normalizePsiResponse } from '../../src/core/analysis/normalize';
import type { AnalysisBatch } from '../../src/core/analysis/schema';
import { exportAnalysisHtml, exportAnalysisJson } from '../../src/core/reports/html';

test('controlled mock report produces readable HTML JSON and PDF', async ({ page }) => {
  const fixture = JSON.parse(readFileSync('tests/fixtures/psi-response.json', 'utf8'));
  const batch: AnalysisBatch = { schemaVersion: 1, requestId: 'controlled-report-fixture', requestedUrl: 'https://example.com/', profileSelection: 'both', startedAt: '2026-10-11T10:00:00.000Z', completedAt: '2026-10-11T10:00:30.000Z', results: [
    { profile: 'mobile', status: 'success', data: normalizePsiResponse(fixture, 'https://example.com/', 'mobile'), error: null },
    { profile: 'desktop', status: 'error', data: null, error: { code: 'RATE_LIMITED', messageCode: 'ANALYSIS_RATE_LIMITED', retryable: true, httpStatus: 429 } },
  ] };
  const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
  const html = exportAnalysisHtml(batch, version, 'tr');
  await mkdir('output/pdf', { recursive: true });
  await writeFile('output/pdf/viewgrid-controlled-sample.html', html);
  await writeFile('output/pdf/viewgrid-controlled-sample.json', exportAnalysisJson(batch, version));
  await page.setContent(html);
  await expect(page.getByRole('heading', { name: 'ViewGrid analiz raporu' })).toBeVisible();
  await expect(page.getByText('p75 INP (ms)', { exact: true })).toHaveCount(2);
  expect(await page.evaluate(() => document.querySelectorAll('script').length)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.pdf({ path: 'output/pdf/viewgrid-controlled-sample.pdf', format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: '<div style="font:9px sans-serif;width:100%;text-align:center">ViewGrid controlled mock sample · <span class="pageNumber"></span>/<span class="totalPages"></span></div>', margin: { top: '15mm', bottom: '20mm', left: '15mm', right: '15mm' } });
});
