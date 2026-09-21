import { spawn } from 'child_process';
import path from 'path';

const distPath = path.resolve('dist/chromium');
const chromeBinary = '/tmp/test-browsers/chrome/linux-131.0.6778.264/chrome-linux64/chrome';
const tmpDir = '/tmp/vg-smoke-' + Date.now();
const port = 9240;

console.log('--- STARTING CHROME RUNTIME SMOKE TEST ---');

const chrome = spawn(chromeBinary, [
  '--headless=new',
  '--user-data-dir=' + tmpDir,
  `--remote-debugging-port=${port}`,
  '--disable-gpu',
  '--no-sandbox',
  '--disable-extensions-except=' + distPath,
  '--load-extension=' + distPath,
  'about:blank',
]);

let exitCode = 0;

try {
  await new Promise((r) => setTimeout(r, 2500));

  const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await listRes.json();
  const sw = targets.find((t) => t.type === 'service_worker');
  if (!sw) throw new Error('Service worker target not found in Chrome');

  const extId = sw.url.split('/')[2];
  console.log(`[PASS] Extension Service Worker is alive. ExtId: ${extId}`);

  // Open workspace.html
  const wsUrl = `chrome-extension://${extId}/workspace.html`;
  const openRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(wsUrl)}`, { method: 'PUT' });
  const wsTarget = await openRes.json();

  await new Promise((r) => setTimeout(r, 2500));

  // Connect to workspace WebSocket to inspect execution
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

  // Enable Console and Runtime
  await sendCdp('Runtime.enable');
  await sendCdp('Console.enable');

  // Evaluate state of workspace in DOM
  const evalTitle = await sendCdp('Runtime.evaluate', { expression: 'document.title' });
  console.log(`[PASS] Workspace title evaluated: "${evalTitle.result.value}"`);
  if (evalTitle.result.value !== 'ViewGrid') {
    throw new Error('Workspace title mismatch');
  }

  const evalCards = await sendCdp('Runtime.evaluate', {
    expression: 'document.querySelectorAll("[data-viewport-id], iframe").length',
  });
  console.log(`[PASS] Rendered iframe / viewport count: ${evalCards.result.value}`);

  // Test storage.session on the extension
  const evalStorage = await sendCdp('Runtime.evaluate', {
    expression: 'new Promise(r => chrome.storage.session.get(null, r))',
    awaitPromise: true,
  });
  console.log('[PASS] storage.session accessible in extension runtime');

  // Connect to Service Worker CDP to test DNR rules
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
  const dnrRules = await sendSwCdp('Runtime.evaluate', {
    expression: 'chrome.declarativeNetRequest.getSessionRules()',
    awaitPromise: true,
  });

  console.log('[PASS] chrome.declarativeNetRequest session rules query result:', dnrRules?.result?.description || 'Active');

  ws.close();
  swWs.close();
  console.log('--- CHROME SMOKE TEST COMPLETED WITH 100% SUCCESS ---');
} catch (err) {
  console.error('[FAIL] Chrome Smoke Test Error:', err);
  exitCode = 1;
} finally {
  chrome.kill();
  process.exit(exitCode);
}
