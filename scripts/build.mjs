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
import crypto from 'node:crypto';
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

// A stable source fingerprint distinguishes same-version corrected packages.
const hash = crypto.createHash('sha256');
function fingerprint(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) fingerprint(full);
    else { hash.update(path.relative(root, full)); hash.update(fs.readFileSync(full)); }
  }
}
fingerprint(path.join(root, 'src'));
for (const file of ['scripts/manifest.mjs', 'scripts/build.mjs', 'scripts/gen-icons.mjs', 'vite.ui.config.ts']) hash.update(fs.readFileSync(path.join(root, file)));
hash.update(fs.readFileSync(path.join(root, 'package.json')));
fs.writeFileSync(path.join(targetDir, 'build-info.json'), JSON.stringify({ version: buildManifest(target, iconFiles).version, build: hash.digest('hex').slice(0, 12) }, null, 2) + '\n');

// NOTE: each browser build lands exclusively in dist/<target>/.
// Use --source-dir dist/firefox or dist/chromium explicitly.
// See: npm run lint:web-ext, npm run dev:firefox (already pass --source-dir dist/firefox)

console.log(`[viewgrid] build complete (${target}) → dist/${target}`);
fs.writeFileSync(path.join(distRoot, 'README.md'), `# ViewGrid installable builds\n\nChrome/Chromium: load the chromium folder using chrome://extensions > Load unpacked.\nFirefox: about:debugging#/runtime/this-firefox > Load Temporary Add-on > firefox/manifest.json.\n\nDo not select this parent folder. Each browser folder has its own manifest.\nManifest versions are generated from package.json; rebuild both targets with npm run build:all.\n`);

