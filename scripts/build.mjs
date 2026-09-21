/**
 * ViewGrid build pipeline:
 *  1. UI pages (workspace/popup/options) via Vite — ESM + assets
 *  2. background + content agent via esbuild — IIFE bundles
 *  3. icons + per-browser manifest.json
 *
 * Usage: node scripts/build.mjs --target=firefox|chromium
 */
import { build as viteBuild } from 'vite';
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildManifest } from './manifest.mjs';
import { generateIcons } from './gen-icons.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv.includes('--target=chromium') ? 'chromium' : 'firefox';
const targetDir = path.join(root, 'dist', target);
const distRoot = path.join(root, 'dist');
fs.mkdirSync(distRoot, { recursive: true });

// Clean up any stale files or directories in dist/ that are not browser targets
for (const entry of fs.readdirSync(distRoot)) {
  if (entry !== 'firefox' && entry !== 'chromium') {
    fs.rmSync(path.join(distRoot, entry), { recursive: true, force: true });
  }
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });

// 1. UI build
await viteBuild({
  configFile: path.join(root, 'vite.ui.config.ts'),
  build: { outDir: targetDir, emptyOutDir: false },
  logLevel: 'warn',
});

// 2. background + content scripts (separate IIFE bundles)
for (const [entry, outfile] of [
  ['src/background/index.ts', 'background.js'],
  ['src/content/agent.ts', 'content/agent.js'],
  ['src/content/world-inject.ts', 'world-inject.js'],
]) {
  await esbuild.build({
    entryPoints: [path.join(root, entry)],
    bundle: true,
    format: 'iife',
    target: ['firefox128', 'chrome120'],
    outfile: path.join(targetDir, outfile),
    logLevel: 'warning',
  });
}

// 3. icons + manifest
const iconFiles = generateIcons(targetDir);
fs.writeFileSync(
  path.join(targetDir, 'manifest.json'),
  JSON.stringify(buildManifest(target, iconFiles), null, 2),
);

// NOTE: each browser build lands exclusively in dist/<target>/.
// Use --source-dir dist/firefox or dist/chromium explicitly.
// See: npm run lint:web-ext, npm run dev:firefox (already pass --source-dir dist/firefox)

console.log(`[viewgrid] build complete (${target}) → dist/${target}`);

