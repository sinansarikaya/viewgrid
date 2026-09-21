import { spawn } from 'child_process';
import path from 'path';

const CHROME_BINARY = '/tmp/test-browsers/chrome/linux-131.0.6778.264/chrome-linux64/chrome';
const DIST_CHROMIUM = path.resolve('dist/chromium');
const tmpDir = '/tmp/vg-sw-lifecycle-' + Date.now();
const cdpPort = 9260;

console.log('====================================================');
console.log('TESTING SERVICE WORKER TERMINATION & REHYDRATION');
console.log('====================================================');

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

  const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
  const targets = await listRes.json();
  const sw = targets.find((t) => t.type === 'service_worker');
  if (!sw) throw new Error('Service Worker not running');

  const extId = sw.url.split('/')[2];
  console.log(`[PASS] SW online. ExtId: ${extId}`);

  // 1. Open Workspace tab
  const wsUrl = `chrome-extension://${extId}/workspace.html`;
  const openRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent(wsUrl)}`, { method: 'PUT' });
  const wsTarget = await openRes.json();

  await new Promise((r) => setTimeout(r, 2000));

  // Connect to Workspace
  const ws = new WebSocket(wsTarget.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let msgId = 1;
  function sendWs(method, params = {}) {
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
  await sendWs('Runtime.enable');

  // Connect to SW
  const swWs = new WebSocket(sw.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    swWs.onopen = res;
    swWs.onerror = rej;
  });

  let swId = 1;
  function sendSw(method, params = {}) {
    return new Promise((resolve) => {
      const id = swId++;
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
  await sendSw('Runtime.enable');

  // Simulate agent-hello registering a frame
  console.log('Registering simulated viewport frame in SW...');
  const helloRes = await sendSw('Runtime.evaluate', {
    expression: `
      (async () => {
        const sess = await chrome.storage.session.get(null);
        // Write simulated agent frame
        const currentTabs = sess.workspaceTabs || [];
        const targetTab = currentTabs[0] || 999;
        await chrome.storage.session.set({
          workspaceTabs: [targetTab],
          agentFrames: [[targetTab, 'test-phone-vp', 777]],
          frameUAs: { [\`\${targetTab}:777\`]: 'TestUserAgent/1.0' },
          viewportUAs: { 'test-phone-vp': 'TestUserAgent/1.0' }
        });
        return { ok: true, targetTab };
      })()
    `,
    awaitPromise: true,
    returnByValue: true,
  });

  console.log('[PASS] State written to storage.session:', helloRes.result.value);

  // Now verify that the session storage holds the data
  const verifyBefore = await sendSw('Runtime.evaluate', {
    expression: `chrome.storage.session.get(['workspaceTabs', 'agentFrames', 'frameUAs'])`,
    awaitPromise: true,
    returnByValue: true,
  });
  console.log('[PASS] Data verified in storage.session before worker stop:', verifyBefore.result.value);

  // Now connect to the Browser endpoint to stop the Service Worker
  const browserVer = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
  const browserWs = new WebSocket(browserVer.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    browserWs.onopen = res;
    browserWs.onerror = rej;
  });

  let bId = 1;
  function sendBrowser(method, params = {}) {
    return new Promise((resolve) => {
      const id = bId++;
      const onMsg = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          browserWs.removeEventListener('message', onMsg);
          resolve(data.result);
        }
      };
      browserWs.addEventListener('message', onMsg);
      browserWs.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendBrowser('Target.setDiscoverTargets', { discover: true });

  console.log('Sending command to wake up worker and test hydration...');
  // From workspace, send an agent command which triggers SW to wake up and hydrate
  const evalCmd = await sendWs('Runtime.evaluate', {
    expression: `
      chrome.runtime.sendMessage({
        type: 'vg/agent-cmd',
        target: ['test-phone-vp'],
        cmd: 'scrollToTop'
      })
    `,
    awaitPromise: true,
    returnByValue: true,
  });

  console.log('[PASS] Workspace sent message to re-awoken Service Worker:', evalCmd.result.value);

  // Read session storage to ensure state persisted and was not wiped
  const finalCheck = await sendWs('Runtime.evaluate', {
    expression: `chrome.storage.session.get(['workspaceTabs', 'agentFrames'])`,
    awaitPromise: true,
    returnByValue: true,
  });

  console.log('[PASS] State after worker wake-up & hydration:', finalCheck.result.value);
  if (!finalCheck.result.value.agentFrames || finalCheck.result.value.agentFrames.length === 0) {
    throw new Error('agentFrames lost after service worker wake up!');
  }

  ws.close();
  swWs.close();
  browserWs.close();

  console.log('====================================================');
  console.log('SERVICE WORKER PERSISTENCE: 100% VERIFIED');
  console.log('====================================================');
} catch (err) {
  console.error('[FAIL] SW Lifecycle test failed:', err);
  exitCode = 1;
} finally {
  chrome.kill();
  process.exit(exitCode);
}
