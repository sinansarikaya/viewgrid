import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/e2e', outputDir: './test-results/playwright', timeout: 60000, workers: 1, retries: 0, reporter: [['list'], ['html', { open: 'never' }]], use: { trace: 'retain-on-failure' } });
