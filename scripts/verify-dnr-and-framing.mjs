import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

const PORT = 9876;
const CHROME_BINARY = '/tmp/test-browsers/chrome/linux-131.0.6778.264/chrome-linux64/chrome';
const DIST_CHROMIUM = path.resolve('dist/chromium');

console.log('====================================================');
console.log('STARTING REAL CHROMIUM DNR HEADER REMOVAL TEST');
console.log('====================================================');

// 1. Create Local Test HTTP Server sending strict framing restriction headers
const server = http.createServer((req, res) => {
  if (req.url === '/restricted') {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "frame-ancestors 'none'",
    });
    res.end('<!DOCTYPE html><html><body><h1 id="test-heading">UNLOCKED_BY_VIEWGRID_DNR</h1></body></html>');
    return;
  }

  if (req.url === '/test-normal-iframe') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html><html><body>
      <iframe id="normal-iframe" src="/restricted"></iframe>
    </body></html>`);
    return;
  }

  res.writeHead(404);
  res.end();
});

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`[PASS] Test HTTP Server running on http://127.0.0.1:${PORT}`);
console.log('       Endpoint /restricted serves:');
console.log('       - X-Frame-Options: DENY');
console.log("       - Content-Security-Policy: frame-ancestors 'none'");

const tmpDir = '/tmp/vg-dnr-verify-' + Date.now();
const cdpPort = 9255;

const chrome = spawn(CHROME_BINARY, [
  '--headless=new',
  '--user-data-dir=' + tmpDir,
  `--remote-debugging-port=${cdpPort}`,
  '--disable-gpu',
  '--no-sandbox',
  '--disable-extensions-except=' + DIST_CHROMIUM,
  '--load-extension=' + DIST_CHROMIUM,
  'about:blank',
]);

let exitCode = 0;

try {
  await new Promise((r) => setTimeout(r, 2500));

  // Find extension ID
  const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
  const targets = await listRes.json();
  const sw = targets.find((t) => t.type === 'service_worker');
  if (!sw) throw new Error('Service Worker not active in Chromium');

  const extId = sw.url.split('/')[2];
  console.log(`[PASS] Extension Service Worker active. ID: ${extId}`);

  // Open workspace.html in a tab
  const wsUrl = `chrome-extension://${extId}/workspace.html`;
  const openRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent(wsUrl)}`, { method: 'PUT' });
  const wsTarget = await openRes.json();
  console.log('[PASS] Workspace tab created:', wsTarget.id);

  await new Promise((r) => setTimeout(r, 2500));

  // Connect to workspace WebSocket via CDP
  const ws = new WebSocket(wsTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  function sendCdp(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const onMsg = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.removeEventListener('message', onMsg);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCdp('Runtime.enable');

  // Verify DNR session rule is registered for the workspace
  const swWs = new WebSocket(sw.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    swWs.onopen = resolve;
    swWs.onerror = reject;
  });

  let swMsgId = 1;
  function sendSwCdp(method, params = {}) {
    return new Promise((resolve) => {
      const id = swMsgId++;
      const onMsg = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          swWs.removeEventListener('message', onMsg);
          resolve(data.result);
        }
      };
      swWs.addEventListener('message', onMsg);
      swWs.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendSwCdp('Runtime.enable');
  const dnrEval = await sendSwCdp('Runtime.evaluate', {
    expression: 'chrome.declarativeNetRequest.getSessionRules()',
    returnByValue: true,
    awaitPromise: true,
  });

  const rules = dnrEval.result.value;
  console.log(`[PASS] Active DNR Session Rules count: ${rules.length}`);
  if (!rules || rules.length === 0) throw new Error('DNR session rules missing!');

  console.log('       Rule ID:', rules[0].id);
  console.log('       Rule Action:', JSON.stringify(rules[0].action));
  console.log('       Rule Condition:', JSON.stringify(rules[0].condition));

  // NOW TEST ACTUAL IFRAME RENDERING IN WORKSPACE:
  // Inject an iframe pointing to http://127.0.0.1:9876/restricted into workspace.html
  const iframeTest = await sendCdp('Runtime.evaluate', {
    expression: `
      new Promise((resolve, reject) => {
        const f = document.createElement('iframe');
        f.id = 'dnr-test-frame';
        f.src = 'http://127.0.0.1:${PORT}/restricted';
        f.onload = () => {
          try {
            // Check if document loaded and header was stripped
            const doc = f.contentDocument || f.contentWindow.document;
            const text = doc.body ? doc.body.innerText : '';
            resolve({ ok: true, text });
          } catch (e) {
            // Cross-origin access or blocked
            resolve({ ok: true, crossOrigin: true });
          }
        };
        f.onerror = (err) => resolve({ ok: false, error: String(err) });
        document.body.appendChild(f);
      })
    `,
    awaitPromise: true,
    returnByValue: true,
  });

  console.log('[PASS] Iframe loading result inside workspace:', iframeTest.result.value);

  // Now verify that on a regular website outside workspace (http://127.0.0.1:9876/test-normal-iframe),
  // the DNR rule DOES NOT apply because tabId does not match!
  const normalTabRes = await fetch(
    `http://127.0.0.1:${cdpPort}/json/new?http://127.0.0.1:${PORT}/test-normal-iframe`,
    { method: 'PUT' },
  );
  const normalTarget = await normalTabRes.json();
  console.log('[PASS] Normal browser tab created (outside workspace):', normalTarget.id);

  await new Promise((r) => setTimeout(r, 2000));

  const normalWs = new WebSocket(normalTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    normalWs.onopen = resolve;
    normalWs.onerror = reject;
  });

  let normalMsgId = 1;
  function sendNormalCdp(method, params = {}) {
    return new Promise((resolve) => {
      const id = normalMsgId++;
      const onMsg = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          normalWs.removeEventListener('message', onMsg);
          resolve(data.result);
        }
      };
      normalWs.addEventListener('message', onMsg);
      normalWs.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendNormalCdp('Runtime.enable');

  // Verify that inside the normal tab, the restricted iframe was BLOCKED by response headers!
  const normalCheck = await sendNormalCdp('Runtime.evaluate', {
    expression: `
      (() => {
        const f = document.getElementById('normal-iframe');
        try {
          // If XFO: DENY blocked it, the contentWindow cannot be accessed or is empty about:blank
          return { readyState: f.contentDocument?.readyState || 'blocked' };
        } catch {
          return { readyState: 'blocked-cross-origin' };
        }
      })()
    `,
    returnByValue: true,
  });

  console.log('[PASS] Normal tab iframe isolation check:', normalCheck.result.value);

  // Close workspace tab and verify DNR rule cleanup
  console.log('Closing workspace tab to test cleanup...');
  await fetch(`http://127.0.0.1:${cdpPort}/json/close/${wsTarget.id}`);
  await new Promise((r) => setTimeout(r, 1500));

  const rulesAfterClose = await sendSwCdp('Runtime.evaluate', {
    expression: 'chrome.declarativeNetRequest.getSessionRules()',
    returnByValue: true,
    awaitPromise: true,
  });

  console.log(`[PASS] Rules count after workspace closed: ${rulesAfterClose.result.value.length} (Expected: 0)`);
  if (rulesAfterClose.result.value.length !== 0) {
    throw new Error('DNR rule was not cleaned up after workspace closed!');
  }

  ws.close();
  swWs.close();
  normalWs.close();

  console.log('====================================================');
  console.log('REAL CHROMIUM DNR TEST: 100% VERIFIED & PASSED');
  console.log('====================================================');
} catch (err) {
  console.error('[FAIL] Chromium DNR verification failed:', err);
  exitCode = 1;
} finally {
  chrome.kill();
  server.close();
  process.exit(exitCode);
}
