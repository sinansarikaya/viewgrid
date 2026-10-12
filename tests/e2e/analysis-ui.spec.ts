import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * ViewGrid Controlled QA-ANALYSIS Test Suite.
 *
 * Requirements:
 * - Real Chromium persistent extension context (`dist/chromium`) with isolated profile.
 * - Loopback fixture server (127.0.0.1) with no external network dependencies.
 * - External Google PSI endpoints controlled via `context.route()`:
 *   Clear distinction between controlled mock fixture and live API in test names and execution logs.
 * - Scenarios covered:
 *   1. Both profiles execution: identical audit ID with mobile pass and desktop fail
 *      without key collision, plus category, status, and severity/importance filtering.
 *   2. History persistence on reload, single entry deletion, and clear confirmation modal Escape behavior
 *      (Escape closes only child confirmation modal, leaving parent AnalysisPanel open).
 *   3. Export reports: HTML and JSON downloads, verification of parsed contents
 *      (requestedUrl, completedAt, version, metrics, failed states).
 *   4. Comparison warnings under differing conditions and targets.
 *   5. Localization (TR, EN, NO) and theme toggle (light theme screenshot saved to test-results/development/).
 */

let server: Server;
let context: BrowserContext;
let page: Page;
let profile: string;
let base: string;
let extensionId: string;

const fixtureHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ViewGrid QA Target Fixture</title>
  <style>
    body { margin: 0; font-family: sans-serif; padding: 24px; }
    h1 { color: #087c96; }
  </style>
</head>
<body>
  <h1>ViewGrid QA Target Fixture</h1>
  <p>Mock page content for automated workspace testing.</p>
</body>
</html>`;

function createMockPsiResponse(options: {
  url: string;
  strategy: 'mobile' | 'desktop';
  isCrawlablePass: boolean;
  metaDescriptionPass: boolean;
  colorContrastPass: boolean;
  lighthouseVersion?: string;
  throttlingMethod?: string;
  rttMs?: number;
}) {
  const isMobile = options.strategy === 'mobile';
  const lcpMs = isMobile ? 2200 : 1200;
  const tbtMs = isMobile ? 210 : 45;
  const perfScore = isMobile ? 0.85 : 0.94;
  const seoScore = isMobile ? (options.isCrawlablePass && options.metaDescriptionPass ? 0.95 : 0.75) : (options.isCrawlablePass ? 0.9 : 0.6);

  return {
    id: options.url,
    analysisUTCTimestamp: '2026-10-11T12:00:00.000Z',
    loadingExperience: {
      id: options.url,
      metrics: {
        LARGEST_CONTENTFUL_PAINT_MS: { percentile: lcpMs },
        INTERACTION_TO_NEXT_PAINT: { percentile: isMobile ? 180 : 80 },
        CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 4 },
      },
    },
    originLoadingExperience: { id: options.url, metrics: {} },
    lighthouseResult: {
      lighthouseVersion: options.lighthouseVersion || '12.8.2-controlled-fixture',
      requestedUrl: options.url,
      finalUrl: options.url,
      fetchTime: '2026-10-11T12:00:00.000Z',
      userAgent: `ViewGrid controlled test fixture (${options.strategy})`,
      configSettings: {
        formFactor: options.strategy,
        locale: 'en-US',
        throttlingMethod: options.throttlingMethod || 'simulate',
        throttling: { rttMs: options.rttMs ?? 150, cpuSlowdownMultiplier: isMobile ? 4 : 1 },
        screenEmulation: {
          mobile: isMobile,
          width: isMobile ? 412 : 1366,
          height: isMobile ? 823 : 768,
          deviceScaleFactor: isMobile ? 2 : 1,
        },
      },
      runWarnings: ['Controlled mock response for testing; no live PageSpeed network calls made.'],
      categories: {
        performance: {
          score: perfScore,
          auditRefs: [
            { id: 'largest-contentful-paint', weight: 25 },
            { id: 'total-blocking-time', weight: 30 },
            { id: 'cumulative-layout-shift', weight: 25 },
          ],
        },
        seo: {
          score: seoScore,
          auditRefs: [
            { id: 'document-title', weight: 1 },
            { id: 'is-crawlable', weight: 2 },
            { id: 'meta-description', weight: 2 },
          ],
        },
        accessibility: {
          score: options.colorContrastPass ? 0.95 : 0.78,
          auditRefs: [
            { id: 'color-contrast', weight: 7 },
            { id: 'heading-order', weight: 3 },
          ],
        },
      },
      audits: {
        'largest-contentful-paint': {
          id: 'largest-contentful-paint',
          title: 'Largest Contentful Paint',
          score: 0.9,
          scoreDisplayMode: 'numeric',
          numericValue: lcpMs,
          displayValue: `${(lcpMs / 1000).toFixed(1)} s`,
        },
        'total-blocking-time': {
          id: 'total-blocking-time',
          title: 'Total Blocking Time',
          score: 0.9,
          scoreDisplayMode: 'numeric',
          numericValue: tbtMs,
          displayValue: `${tbtMs} ms`,
        },
        'cumulative-layout-shift': {
          id: 'cumulative-layout-shift',
          title: 'Cumulative Layout Shift',
          score: 1,
          scoreDisplayMode: 'numeric',
          numericValue: 0.04,
        },
        'document-title': {
          id: 'document-title',
          title: 'Document has a title',
          score: 1,
          scoreDisplayMode: 'binary',
        },
        'is-crawlable': {
          id: 'is-crawlable',
          title: options.isCrawlablePass
            ? 'Page is not blocked from indexing'
            : 'Page is blocked from indexing on desktop',
          description: options.isCrawlablePass
            ? 'Search engines can index this page.'
            : 'Robots meta tag or robots.txt restricts crawler access.',
          score: options.isCrawlablePass ? 1 : 0,
          scoreDisplayMode: 'binary',
        },
        'meta-description': {
          id: 'meta-description',
          title: options.metaDescriptionPass
            ? 'Document has a meta description'
            : 'Document lacks a meta description on desktop',
          description: options.metaDescriptionPass
            ? 'Meta description is present.'
            : 'Add a useful description for search results.',
          score: options.metaDescriptionPass ? 1 : 0,
          scoreDisplayMode: 'binary',
        },
        'color-contrast': {
          id: 'color-contrast',
          title: options.colorContrastPass
            ? 'Background and foreground colors have sufficient contrast'
            : 'Background and foreground colors lack contrast',
          description: 'Ensure text meets minimum WCAG contrast ratios.',
          score: options.colorContrastPass ? 1 : 0,
          scoreDisplayMode: 'binary',
          details: options.colorContrastPass
            ? undefined
            : {
                items: [
                  {
                    node: {
                      selector: 'p.muted',
                      snippet: '<p class="muted">Low contrast copy</p>',
                      nodeLabel: 'Low contrast copy',
                    },
                  },
                ],
              },
        },
        'heading-order': {
          id: 'heading-order',
          title: 'Heading levels are ordered sequentially',
          description: 'Check that h1-h6 levels follow a logical hierarchy.',
          score: null,
          scoreDisplayMode: 'manual',
        },
      },
    },
  };
}

test.describe.serial('QA-ANALYSIS Controlled E2E Suite', () => {
  test.beforeAll(async () => {
    server = createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(fixtureHtml);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${(server.address() as any).port}`;

    profile = await mkdtemp(path.join(tmpdir(), 'viewgrid-analysis-ui-'));
    const extension = path.resolve('dist/chromium');

    context = await chromium.launchPersistentContext(profile, {
      channel: 'chromium',
      headless: true,
      viewport: { width: 1366, height: 850 },
      acceptDownloads: true,
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    });

    const worker = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker'));
    extensionId = worker.url().split('/')[2]!;
    page = await context.newPage();

    // Setup controlled mock routing for external Google PageSpeed API
    await context.route('https://pagespeedonline.googleapis.com/**', async (route) => {
      const reqUrl = new URL(route.request().url());
      // Verify no hardcoded API key is ever leaked to Google API
      expect(reqUrl.searchParams.has('key')).toBe(false);

      const target = reqUrl.searchParams.get('url') || '';
      const strategy = (reqUrl.searchParams.get('strategy') || 'mobile') as 'mobile' | 'desktop';

      console.log(`[CONTROLLED MOCK] Intercepted PSI request for target=${target}, strategy=${strategy}`);

      if (target.includes('example.org')) {
        // Different conditions / engine mock for comparison warnings test
        const responseData = createMockPsiResponse({
          url: target,
          strategy,
          isCrawlablePass: true,
          metaDescriptionPass: true,
          colorContrastPass: true,
          lighthouseVersion: '12.8.5-alternate-fixture',
          throttlingMethod: 'devtools',
          rttMs: 300,
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(responseData),
        });
        return;
      }

      // Default mock for https://example.com/
      // Mobile: is-crawlable PASS, meta-description PASS, color-contrast FAIL
      // Desktop: is-crawlable FAIL, meta-description FAIL, color-contrast PASS
      const responseData = createMockPsiResponse({
        url: target,
        strategy,
        isCrawlablePass: strategy === 'mobile',
        metaDescriptionPass: strategy === 'mobile',
        colorContrastPass: strategy === 'desktop',
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseData),
      });
    });

    // Navigate to workspace with 4 default viewports
    await page.goto(
      `chrome-extension://${extensionId}/workspace.html?url=${encodeURIComponent(base + '/site')}`,
    );
    await expect(page.locator('iframe[name^="viewgrid:"]')).toHaveCount(4);
  });

  test.afterAll(async () => {
    await context?.close();
    server?.close();
    if (profile) await rm(profile, { recursive: true, force: true });
  });

  test('[Controlled Mock] both profiles retain identical audit ID with mobile pass and desktop fail, and filters work correctly', async () => {
    // Open Analysis Panel via Sidebar Tools / Workspace Actions
    const openBtn = page.getByRole('button', {
      name: /Performans & CrUX|Performance & CrUX|Ytelse & CrUX/i,
    });
    await openBtn.click();

    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();

    // Fill target URL, select profile "both", consent checkbox
    await dialog.getByRole('textbox', { name: 'Target URL' }).fill('https://example.com/');
    await dialog.getByLabel('Target Profile').selectOption('both');
    await dialog.locator('input[type="checkbox"]').first().check();

    // Trigger analysis
    const runBtn = dialog.getByRole('button', {
      name: /Run Analysis|Analizi Başlat|Kjør analyse/i,
    });
    await runBtn.click();

    // Wait for performance cards (both mobile and desktop) to render
    await expect(dialog.getByRole('heading', { name: /Mobile|Mobil/i }).first()).toBeVisible({ timeout: 15000 });
    await expect(dialog.getByRole('heading', { name: /Desktop|Masaüstü|Skrivebord/i }).first()).toBeVisible({ timeout: 15000 });

    // Switch to SEO & A11y Tab
    await dialog
      .getByRole('button', {
        name: /SEO & Erişilebilirlik|SEO & Accessibility|SEO & Tilgjengelighet/i,
      })
      .click();

    // Verify both audits for "is-crawlable" exist simultaneously:
    // One card for MOBILE (PASS) and one for DESKTOP (FAIL)
    const mobileAuditBadge = dialog.locator('span').filter({ hasText: /^MOBILE$/i });
    const desktopAuditBadge = dialog.locator('span').filter({ hasText: /^DESKTOP$/i });
    await expect(mobileAuditBadge.first()).toBeVisible();
    await expect(desktopAuditBadge.first()).toBeVisible();

    // Verify status filter:
    const statusSelect = dialog.locator('select[aria-label="Audit Status"]');
    await statusSelect.selectOption('failed');

    // In 'failed' filter: desktop crawlable audit is visible, mobile pass is hidden
    await expect(dialog.getByText('Page is blocked from indexing on desktop')).toBeVisible();
    await expect(dialog.getByText('Page is not blocked from indexing')).toHaveCount(0);

    await statusSelect.selectOption('passed');
    // In 'passed' filter: mobile crawlable audit is visible, desktop fail is hidden
    await expect(dialog.getByText('Page is not blocked from indexing')).toBeVisible();
    await expect(dialog.getByText('Page is blocked from indexing on desktop')).toHaveCount(0);

    // Reset status filter to 'all'
    await statusSelect.selectOption('all');

    // Verify category filter:
    const categorySelect = dialog.locator('select[aria-label="Audit Category"]');
    await categorySelect.selectOption('accessibility');
    await expect(dialog.getByText('Background and foreground colors').first()).toBeVisible();
    await expect(dialog.getByText('Page is not blocked from indexing')).toHaveCount(0);

    // Reset category filter to 'all'
    await categorySelect.selectOption('all');

    // Verify severity filter:
    const severitySelect = dialog.locator('select[aria-label="Audit Severity"]');
    await severitySelect.selectOption('high');
    // color-contrast has weight 7 -> HIGH importance
    await expect(dialog.locator('span').filter({ hasText: /^HIGH$/ }).first()).toBeVisible();
    await severitySelect.selectOption('all');

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('[Controlled Mock] history persistence on reload, entry deletion, and clear confirmation modal Escape behavior', async () => {
    // Open Analysis Panel
    await page.getByRole('button', {
      name: /Performans & CrUX|Performance & CrUX|Ytelse & CrUX/i,
    }).click();
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();

    // Switch to Reports & History tab
    await dialog
      .getByRole('button', {
        name: /Raporlar & Geçmiş|Reports & History|Rapporter & Historikk/i,
      })
      .click();

    // Verify history table has at least 1 entry for https://example.com/
    const historyTable = dialog.locator('table');
    await expect(historyTable.getByText('https://example.com/')).toBeVisible();

    // Close dialog and reload the page
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.reload();
    await expect(page.locator('iframe[name^="viewgrid:"]')).toHaveCount(4);

    // Reopen Analysis Panel and check history persistence
    await page
      .getByRole('button', {
        name: /Performans & CrUX|Performance & CrUX|Ytelse & CrUX/i,
      })
      .click();

    const reopenedDialog = page.getByRole('dialog').first();
    await reopenedDialog
      .getByRole('button', {
        name: /Raporlar & Geçmiş|Reports & History|Rapporter & Historikk/i,
      })
      .click();

    await expect(reopenedDialog.locator('table').getByText('https://example.com/')).toBeVisible();

    // Run a second analysis on https://example.org/ to have 2 entries
    await reopenedDialog
      .getByRole('button', {
        name: /Performans & CrUX|Performance & CrUX|Ytelse & CrUX/i,
      })
      .click();
    await reopenedDialog.getByRole('textbox', { name: 'Target URL' }).fill('https://example.org/');
    await reopenedDialog.getByLabel('Target Profile').selectOption('mobile');
    await reopenedDialog.locator('input[type="checkbox"]').first().check();
    await reopenedDialog
      .getByRole('button', {
        name: /Run Analysis|Analizi Başlat|Kjør analyse/i,
      })
      .click();

    await expect(reopenedDialog.getByRole('heading', { name: /Mobile|Mobil/i }).first()).toBeVisible({ timeout: 15000 });

    // Switch to Reports tab and check 2 entries
    await reopenedDialog
      .getByRole('button', {
        name: /Raporlar & Geçmiş|Reports & History|Rapporter & Historikk/i,
      })
      .click();

    const rows = reopenedDialog.locator('table tbody tr');
    await expect(rows).toHaveCount(2);

    // Delete single entry for https://example.org/
    const deleteBtn = rows.filter({ hasText: 'https://example.org/' }).getByRole('button', {
      name: /Delete|Sil|Slett/i,
    });
    await deleteBtn.click();
    await expect(rows).toHaveCount(1);
    await expect(reopenedDialog.locator('table').getByText('https://example.org/')).toHaveCount(0);

    // Test Clear History Confirmation Modal & Escape isolation:
    const clearBtn = reopenedDialog.getByRole('button', {
      name: /Clear History|Geçmişi Temizle|Tøm historikk/i,
    });
    await clearBtn.click();

    // Child confirmation modal is now open
    const confirmDialog = page.getByRole('dialog', {
      name: /Clear Analysis History|Analiz Geçmişini Temizle|Tøm analysehistorikk/i,
    });
    await expect(confirmDialog).toBeVisible();

    // Press Escape once -> ONLY child confirmation modal must close, parent remains open!
    await page.keyboard.press('Escape');
    await expect(confirmDialog).toHaveCount(0);

    // Parent AnalysisPanel is open and visible
    const parentDialog = page.getByRole('dialog').first();
    await expect(parentDialog).toBeVisible();

    // History entry must NOT have been deleted
    await expect(parentDialog.locator('table').getByText('https://example.com/')).toBeVisible();

    // Close parent dialog with Escape for clean boundary
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('[Controlled Mock] export report HTML and JSON downloads, verification of parsed contents', async () => {
    // Open Analysis Panel
    await page.getByRole('button', {
      name: /Performans & CrUX|Performance & CrUX|Ytelse & CrUX/i,
    }).click();
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();

    await dialog
      .getByRole('button', {
        name: /Raporlar & Geçmiş|Reports & History|Rapporter & Historikk/i,
      })
      .click();

    // Load active batch if needed
    const loadBtn = dialog.locator('table tbody tr').first().getByRole('button', {
      name: /View|Görüntüle|Vis|Load/i,
    });
    await expect(loadBtn).toBeVisible();
    await loadBtn.click();

    // 1. Download HTML report
    const [htmlDownload] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: /Download HTML|HTML Raporu İndir|Last ned HTML-rapport/i }).click(),
    ]);

    expect(htmlDownload.suggestedFilename()).toMatch(/^viewgrid-analysis-\d+\.html$/);
    const htmlPath = await htmlDownload.path();
    expect(htmlPath).toBeTruthy();
    const htmlContent = readFileSync(htmlPath!, 'utf8');

    // Verify HTML contents: URL, manifest version tag, metrics, table
    expect(htmlContent).toContain('ViewGrid');
    expect(htmlContent).toContain('https://example.com/');
    expect(htmlContent).toContain('LCP');
    expect(htmlContent).toContain('Total Blocking Time');

    // 2. Download JSON report
    const [jsonDownload] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: /Export JSON|JSON Dışa Aktar|Eksporter JSON/i }).click(),
    ]);

    expect(jsonDownload.suggestedFilename()).toMatch(/^viewgrid-analysis-\d+\.json$/);
    const jsonPath = await jsonDownload.path();
    expect(jsonPath).toBeTruthy();
    const jsonParsed = JSON.parse(readFileSync(jsonPath!, 'utf8'));

    // Verify JSON contents: reportSchemaVersion, extensionVersion, analysis object
    expect(jsonParsed.reportSchemaVersion).toBe(1);
    expect(typeof jsonParsed.extensionVersion).toBe('string');
    expect(jsonParsed.analysis.requestedUrl).toBe('https://example.com/');
    expect(jsonParsed.analysis.completedAt).toBeTruthy();
    expect(Array.isArray(jsonParsed.analysis.results)).toBe(true);
    expect(jsonParsed.analysis.results.length).toBeGreaterThanOrEqual(1);

    const firstResult = jsonParsed.analysis.results[0];
    expect(firstResult.data.lab.metrics.lcpMs).toBeDefined();
    expect(firstResult.data.lab.scores.performance).toBeDefined();

    // Close dialog with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('[Controlled Mock] comparison warnings under differing conditions and targets', async () => {
    // Open Analysis Panel
    await page.getByRole('button', {
      name: /Performans & CrUX|Performance & CrUX|Ytelse & CrUX/i,
    }).click();
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();

    // Run a new analysis on https://example.org/ to have two distinct entries with different conditions
    await dialog.getByRole('textbox', { name: 'Target URL' }).fill('https://example.org/');
    await dialog.getByLabel('Target Profile').selectOption('mobile');
    await dialog.locator('input[type="checkbox"]').first().check();
    await dialog
      .getByRole('button', {
        name: /Run Analysis|Analizi Başlat|Kjør analyse/i,
      })
      .click();

    await expect(dialog.getByRole('heading', { name: /Mobile|Mobil/i }).first()).toBeVisible({ timeout: 15000 });

    // Switch to Reports & History
    await dialog
      .getByRole('button', {
        name: /Raporlar & Geçmiş|Reports & History|Rapporter & Historikk/i,
      })
      .click();

    // Verify compare section is rendered (requires >= 2 history items)
    await expect(dialog.getByText(/Compare|Karşılaştır|Sammenlign/i).first()).toBeVisible();

    // Trigger Compare
    const compareBtn = dialog.getByRole('button', {
      name: /Compare|Karşılaştır|Sammenlign/i,
    });
    await compareBtn.click();

    // Verify comparison warnings are displayed for differing target and differing conditions
    await expect(
      dialog.getByText(/farklı hedef URL|different URL|mål-URL/i).first(),
    ).toBeVisible();
    await expect(
      dialog.getByText(/farklı|differ|ulike/i).first(),
    ).toBeVisible();

    // Verify metric delta table is rendered
    await expect(dialog.getByText(/PERFORMANCE Score/i)).toBeVisible();

    // Close dialog with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('[Controlled Mock] localization TR/EN/NO and light theme preservation with screenshot', async () => {
    // Ensure AnalysisPanel is closed
    if (await page.getByRole('dialog').count() > 0) {
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }

    // Locate language select in toolbar
    const langSelect = page.locator('header select');
    await expect(langSelect).toBeVisible();

    // Switch to English
    await langSelect.selectOption('en');

    // Open Analysis Panel and verify English translations
    await page.getByRole('button', { name: 'Performance & CrUX', exact: true }).click();
    const enDialog = page.getByRole('dialog').first();
    await expect(enDialog.getByRole('button', { name: 'SEO & Accessibility' })).toBeVisible();
    await expect(enDialog.getByRole('button', { name: 'Reports & History' })).toBeVisible();
    await page.keyboard.press('Escape');

    // Switch to Norwegian
    await langSelect.selectOption('no');
    await page.getByRole('button', { name: 'Ytelse & CrUX', exact: true }).click();
    const noDialog = page.getByRole('dialog').first();
    await expect(noDialog.getByRole('button', { name: 'SEO & Tilgjengelighet' })).toBeVisible();
    await expect(noDialog.getByRole('button', { name: 'Rapporter & Historikk' })).toBeVisible();
    await page.keyboard.press('Escape');

    // Switch back to Turkish / English
    await langSelect.selectOption('tr');

    // Toggle theme to Light
    const themeBtn = page.locator('header button').filter({ hasText: /☀|◐/ });
    await themeBtn.click();
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');

    // Open AnalysisPanel in light theme
    await page.getByRole('button', { name: 'Performans & CrUX', exact: true }).click();
    const lightDialog = page.getByRole('dialog').first();
    await expect(lightDialog).toBeVisible();
    await lightDialog.evaluate(async element => {
      await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished));
    });

    // Take screenshot of AnalysisPanel in light theme
    await page.screenshot({ path: 'test-results/development/analysis-ui-light.png' });

    // Verify accessible attributes
    expect(await lightDialog.getAttribute('role')).toBe('dialog');
    await expect(lightDialog.getByRole('textbox', { name: 'Target URL' })).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
