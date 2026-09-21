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
const outDir = path.join(root, 'dist');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// 1. UI
await viteBuild({ configFile: path.join(root, 'vite.ui.config.ts'), logLevel: 'warn' });

// 2. background + content scripts (separate IIFE bundles)
for (const [entry, outfile] of [
  ['src/background/index.ts', 'background.js'],
  ['src/content/agent.ts', 'content/agent.js'],
]) {
  await esbuild.build({
    entryPoints: [path.join(root, entry)],
    bundle: true,
    format: 'iife',
    target: ['firefox128', 'chrome120'],
    outfile: path.join(outDir, outfile),
    logLevel: 'warning',
  });
}

// 3. icons + manifest
const iconFiles = generateIcons(outDir);
fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  JSON.stringify(buildManifest(target, iconFiles), null, 2),
);

console.log(`[viewgrid] build complete (${target}) → dist/`);
