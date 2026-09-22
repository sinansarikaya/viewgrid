/**
 * ViewGrid release packaging script.
 * Produces:
 *   release/viewgrid-<version>-chromium.zip
 *   release/viewgrid-<version>-firefox.zip
 *
 * Usage: node scripts/package-release.mjs
 * Prerequisites: npm run build:all must run first (or this script runs it).
 */
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;

const releaseDir = path.join(root, 'release');
fs.mkdirSync(releaseDir, { recursive: true });

// Pre-flight: build if dist dirs are missing
for (const browser of ['chromium', 'firefox']) {
  const d = path.join(root, 'dist', browser);
  if (!fs.existsSync(path.join(d, 'manifest.json'))) {
    console.log(`[viewgrid] dist/${browser} missing — running build:all...`);
    execSync('npm run build:all', { cwd: root, stdio: 'inherit' });
    break;
  }
}

// Validation: reject forbidden files
function validatePackage(dir, browser) {
  const forbidden = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      const rel = path.relative(dir, full);
      if (entry.name.endsWith('.map'))                             forbidden.push(`source-map: ${rel}`);
      if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) forbidden.push(`ts source: ${rel}`);
      if (entry.name.endsWith('.tsx'))                            forbidden.push(`tsx source: ${rel}`);
      if (entry.name === '.env')                                  forbidden.push(`.env: ${rel}`);
      if (entry.name.includes('.test.'))                          forbidden.push(`test file: ${rel}`);
    }
  };
  walk(dir);
  if (forbidden.length > 0) {
    console.error(`[viewgrid] BLOCKED: ${browser} package contains forbidden files:`);
    for (const f of forbidden) console.error(`  x ${f}`);
    process.exit(1);
  }
}

// Validate manifest fields per browser
function validateManifest(dir, browser) {
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  if (browser === 'chromium') {
    if (!m.background?.service_worker) {
      console.error('[viewgrid] BLOCKED: Chromium manifest missing background.service_worker'); process.exit(1);
    }
    if (m.background?.scripts) {
      console.error('[viewgrid] BLOCKED: Chromium manifest has background.scripts (Firefox only)'); process.exit(1);
    }
  }
  if (browser === 'firefox') {
    if (!m.background?.scripts) {
      console.error('[viewgrid] BLOCKED: Firefox manifest missing background.scripts'); process.exit(1);
    }
    if (m.background?.service_worker) {
      console.error('[viewgrid] BLOCKED: Firefox manifest has service_worker (Chrome only)'); process.exit(1);
    }
    if (!m.browser_specific_settings?.gecko?.id) {
      console.error('[viewgrid] BLOCKED: Firefox manifest missing browser_specific_settings.gecko.id'); process.exit(1);
    }
  }
  console.log(`[viewgrid] ${browser} manifest OK — background: ${JSON.stringify(m.background)}`);
}

for (const browser of ['chromium', 'firefox']) {
  const distDir = path.join(root, 'dist', browser);
  const zipFile = path.join(releaseDir, `viewgrid-${version}-${browser}.zip`);

  console.log(`\n[viewgrid] Packaging ${browser}...`);
  validatePackage(distDir, browser);
  validateManifest(distDir, browser);

  if (fs.existsSync(zipFile)) fs.rmSync(zipFile);

  try {
    // Try zip command first, fallback to python3 zipfile
    try {
      execSync(`zip -r "${zipFile}" .`, { cwd: distDir, stdio: 'pipe' });
    } catch {
      const pyScript = `import zipfile, os
with zipfile.ZipFile("${zipFile.replace(/\\/g, '/')}", "w", zipfile.ZIP_DEFLATED) as z:
  for root, dirs, files in os.walk("${distDir.replace(/\\/g, '/')}"):
    for file in files:
      full = os.path.join(root, file)
      rel = os.path.relpath(full, "${distDir.replace(/\\/g, '/')}")
      z.write(full, rel)`;
      execSync(`python3 -c '${pyScript.replace(/'/g, "'\\''")}'`, { stdio: 'pipe' });
    }
    const stat = fs.statSync(zipFile);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(zipFile)).digest('hex');
    console.log(`[viewgrid] OK ${path.basename(zipFile)} (${Math.round(stat.size / 1024)} KB) - sha256: ${hash}`);
  } catch (e) {
    console.error('[viewgrid] zip failed:', e.message);
    process.exit(1);
  }
}

// Generate canonical SHA256SUMS file
const checksumLines = [];
for (const browser of ['chromium', 'firefox']) {
  const zipName = `viewgrid-${version}-${browser}.zip`;
  const zipFile = path.join(releaseDir, zipName);
  if (fs.existsSync(zipFile)) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(zipFile)).digest('hex');
    checksumLines.push(`${hash}  ${zipName}`);
  }
}
const sumsFile = path.join(releaseDir, 'SHA256SUMS');
fs.writeFileSync(sumsFile, checksumLines.join('\n') + '\n', 'utf8');
console.log(`[viewgrid] Generated ${path.basename(sumsFile)}:`);
checksumLines.forEach((l) => console.log(`  ${l}`));

console.log(`\n[viewgrid] Release packages ready in release/`);
console.log(`  Chrome Web Store: release/viewgrid-${version}-chromium.zip`);
console.log(`  Firefox AMO:      release/viewgrid-${version}-firefox.zip`);
console.log(`  Checksums:        release/SHA256SUMS`);
console.log('\nWARNING: Run manual smoke tests before uploading to stores.');
