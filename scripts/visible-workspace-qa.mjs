#!/usr/bin/env node

/**
 * visible-workspace-qa.mjs
 *
 * Interactive visible QA script for desktop inspection on DISPLAY=:1 (or active DISPLAY).
 * Launches Chromium persistent context with fresh isolated profile, loads ViewGrid extension,
 * tests real CastPost URL in workspace, measures standardized 32px controls, exercises
 * Grid/Row/Fit layout modes, saves screenshot, and preserves the open browser window
 * with a 10-minute bounded timer or terminal stdin trigger.
 */

import { chromium, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

async function main() {
  const display = process.env.DISPLAY;
  console.log(`[VISIBLE-QA] Target DISPLAY: ${display}`);

  // Never fall back to headless silently; enforce visible display
  if (!display) {
    throw new Error('[VISIBLE-QA] DISPLAY environment variable is missing. Visible execution requires a valid X11 display.');
  }

  const extensionPath = path.resolve('dist/chromium');
  if (!fs.existsSync(extensionPath)) {
    throw new Error(`[VISIBLE-QA] Extension build directory does not exist at "${extensionPath}". Please ensure leader build is produced first.`);
  }

  // Fresh temporary profile to protect user profile
  const tempProfile = await mkdtemp(path.join(tmpdir(), 'viewgrid-visible-qa-'));
  console.log(`[VISIBLE-QA] Isolated temporary profile: ${tempProfile}`);

  let context;
  try {
    context = await chromium.launchPersistentContext(tempProfile, {
      channel: 'chromium',
      headless: false, // Strictly visible, NO headless fallback
      chromiumSandbox: true,
      slowMo: 700,
      viewport: { width: 1440, height: 900 },
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
      env: {
        ...process.env,
        DISPLAY: display,
      },
    });
  } catch (launchError) {
    console.error('[VISIBLE-QA] Fatal: Failed to launch Chromium on visible display:', launchError);
    throw launchError;
  }

  try {
    console.log('[VISIBLE-QA] Resolving extension background service worker...');
    let worker = context.serviceWorkers()[0];
    if (!worker) {
      worker = await context.waitForEvent('serviceworker', { timeout: 15000 });
    }
    const extensionId = worker.url().split('/')[2];
    console.log(`[VISIBLE-QA] Resolved Extension ID: ${extensionId}`);

    const page = await context.newPage();
    const targetUrl = 'https://castpost.app/en';
    const workspaceUrl = `chrome-extension://${extensionId}/workspace.html?url=${encodeURIComponent(targetUrl)}`;
    console.log(`[VISIBLE-QA] Opening workspace: ${workspaceUrl}`);

    await page.goto(workspaceUrl, { waitUntil: 'domcontentloaded' });
    await page.bringToFront();

    // Verify URL bar and apply target URL if not already populated
    const urlInput = page.locator('header input').first();
    await urlInput.waitFor({ state: 'visible', timeout: 10000 });
    const currentInputVal = await urlInput.inputValue();
    if (currentInputVal !== targetUrl) {
      console.log(`[VISIBLE-QA] Applying target URL: ${targetUrl}`);
      await urlInput.fill(targetUrl);
      await urlInput.press('Enter');
    }

    // Verify viewport iframes and unexpected hostname errors
    console.log('[VISIBLE-QA] Checking viewport frames and unexpected hostname issues...');
    const iframeLocator = page.locator('iframe[name^="viewgrid:"]');
    await iframeLocator.first().waitFor({ state: 'attached', timeout: 20000 });

    const attachedCount = await iframeLocator.count();
    console.log(`[VISIBLE-QA] Detected ${attachedCount} attached viewport iframes.`);
    if (attachedCount < 2) {
      throw new Error(`[VISIBLE-QA] Expected at least 2 viewport frames for workspace, found ${attachedCount}.`);
    }

    // Ensure no unexpected hostname alert/error banner
    const alertLocator = page.locator('[role="alert"]:has-text("hostname")');
    if (await alertLocator.count() > 0 && await alertLocator.first().isVisible()) {
      const alertMsg = await alertLocator.first().textContent();
      throw new Error(`[VISIBLE-QA] Unexpected hostname error detected: ${alertMsg}`);
    }

    console.log('[VISIBLE-QA] Allowing frame content to load live CastPost...');
    const previews = () => page.frames().filter(frame => frame.parentFrame() === page.mainFrame());
    await expect.poll(async () => (await Promise.all(previews().map(async frame =>
      /castpost\.app/.test(frame.url()) && await frame.locator('h1').count() > 0
    ))).filter(Boolean).length, { timeout: 45000 }).toBe(4);
    for (const frame of previews()) await expect(frame.locator('body')).not.toContainText('refused to connect');
    await expect(page.locator('body')).not.toContainText("Unexpected property: 'hostnames'");

    // Measure standardized 32px button, input, select, and summary controls
    console.log('[VISIBLE-QA] Measuring toolbar and canvasHeader control dimensions...');
    const measurements = await page.evaluate(() => {
      const analyze = (selector, groupName) => {
        const els = Array.from(document.querySelectorAll(selector));
        return els.map(el => {
          const rect = el.getBoundingClientRect();
          const cs = window.getComputedStyle(el);
          return {
            group: groupName,
            tag: el.tagName.toLowerCase(),
            label: (el.textContent || el.getAttribute('title') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 25),
            heightPx: Math.round(rect.height),
            widthPx: Math.round(rect.width),
            boxSizing: cs.boxSizing,
            fontSize: cs.fontSize,
          };
        });
      };

      return [
        ...analyze('header button, header .iconBtn', 'Toolbar Buttons'),
        ...analyze('header input', 'Toolbar Inputs'),
        ...analyze('header select', 'Toolbar Selects'),
        ...analyze('header details:not([open]) > summary', 'Toolbar Summary'),
        ...analyze('[class*="canvasHeader_"] button', 'CanvasHeader Buttons'),
        ...analyze('[class*="canvasHeader_"] select', 'CanvasHeader Selects'),
      ];
    });

    console.log('\n================================ STANDARDIZED 32PX CONTROLS MEASUREMENT ================================');
    console.table(measurements);

    const nonStandard = measurements.filter(m => m.heightPx > 0 && m.heightPx !== 32);
    if (nonStandard.length > 0) {
      throw new Error(`[VISIBLE-QA] Nonstandard visible control heights: ${JSON.stringify(nonStandard)}`);
    } else {
      console.log('[VISIBLE-QA] VERIFIED: All toolbar & canvasHeader interactive controls strictly match 32px height!');
    }

    // Exercise Grid, Row, and Fit to Screen layout modes
    console.log('[VISIBLE-QA] Testing Row layout mode...');
    const rowBtn = page.locator('button:has-text("Satır"), button:has-text("Row")').first();
    if (await rowBtn.isVisible()) {
      await rowBtn.click();
      await page.waitForTimeout(600);
      const rowLayout = await page.locator('[data-layout]').first().getAttribute('data-layout');
      console.log(`[VISIBLE-QA] Active layout mode: ${rowLayout}`);
      if (rowLayout !== 'row') throw new Error('Row layout failed');
    }

    console.log('[VISIBLE-QA] Testing Grid layout mode...');
    const gridBtn = page.locator('button:has-text("Izgara"), button:has-text("Grid")').first();
    if (await gridBtn.isVisible()) {
      await gridBtn.click();
      await page.waitForTimeout(600);
      const gridLayout = await page.locator('[data-layout]').first().getAttribute('data-layout');
      console.log(`[VISIBLE-QA] Active layout mode: ${gridLayout}`);
      if (gridLayout !== 'grid') throw new Error('Grid layout failed');
    }

    console.log('[VISIBLE-QA] Testing Fit to Screen...');
    const fitBtn = page.locator('button:has-text("Ekrana Sığdır"), button:has-text("Fit to Screen")').first();
    if (await fitBtn.isVisible()) {
      await fitBtn.click();
      await page.waitForTimeout(600);
      console.log('[VISIBLE-QA] Fit to screen exercised successfully.');
    }

    // Capture proof screenshot
    const screenshotDir = path.resolve('test-results/development');
    fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotPath = path.join(screenshotDir, 'visible-workspace-qa.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`[VISIBLE-QA] Screenshot captured: ${screenshotPath}`);

    // Print handles and inspection proofs
    console.log('\n================================ INSPECTION HANDLES & ARTIFACTS ================================');
    console.log(`Extension ID: ${extensionId}`);
    console.log(`Workspace Page URL: ${page.url()}`);
    console.log(`Isolated Profile Directory: ${tempProfile}`);
    console.log(`DISPLAY: ${display}`);
    console.log(`Screenshot: ${screenshotPath}`);
    console.log('=================================================================================================\n');

    console.log('[VISIBLE-QA] TEST EXECUTION COMPLETE. Browser window remains OPEN for your inspection.');
    console.log('[VISIBLE-QA] Bounded timer: 10 minutes (or press Enter in terminal to close)...');

    // Keep window open; do NOT call context.close() immediately
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        console.log('[VISIBLE-QA] 10-minute inspection timer expired.');
        resolve();
      }, 10 * 60 * 1000);

      process.stdin.resume();
      process.stdin.once('data', () => {
        clearTimeout(timer);
        console.log('[VISIBLE-QA] Terminal trigger received. Closing session...');
        resolve();
      });
    });

  } finally {
    process.stdin.pause();
    // Only cleanup after user triggers exit or 10-min bounded timer expires
    console.log('[VISIBLE-QA] Cleaning up context and temp profile...');
    if (context) {
      await context.close().catch(() => {});
    }
  }
}

main().catch(err => {
  console.error('[VISIBLE-QA] Fatal Error:', err);
  process.exit(1);
});
