"""Load the built Firefox extension, including blocked document navigation.

Requires Firefox, GeckoDriver and Selenium. No mocked WebExtension APIs.
"""
import json
import os
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import tempfile
import time
import zipfile

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

FIXTURE = '<!doctype html><h1>ViewGrid Firefox fixture</h1><button id="action" onclick="document.querySelector(\'#count\').textContent=Number(document.querySelector(\'#count\').textContent)+1">Count</button><span id="count">0</span><input id="name"><div style="height:1800px"></div>'


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        if self.path.startswith('/protected'):
            self.send_header('X-Frame-Options', 'DENY')
            self.send_header('Content-Security-Policy', "frame-ancestors 'none'; default-src 'self' 'unsafe-inline'")
        self.end_headers()
        self.wfile.write(('<iframe src="/protected"></iframe>' if self.path == '/host' else FIXTURE).encode())

    def log_message(self, *_):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
uuid = '11111111-1111-4111-8111-111111111111'
options = webdriver.FirefoxOptions()
options.add_argument('-headless')
options.set_preference('extensions.webextensions.uuids', json.dumps({'viewgrid@viewgrid.dev': uuid}))
driver = webdriver.Firefox(options=options)
driver.set_window_size(1280, 900)
wait = WebDriverWait(driver, 25)
out = Path('test-results/firefox')
out.mkdir(parents=True, exist_ok=True)


def workspace(url):
    from urllib.parse import quote
    driver.get(f'moz-extension://{uuid}/workspace.html?url={quote(url, safe="")}')
    wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, 'iframe[name^="viewgrid:"]')) == 4)


def frame_text(index=0):
    driver.switch_to.default_content()
    frames = driver.find_elements(By.CSS_SELECTOR, 'iframe[name^="viewgrid:"]')
    driver.switch_to.frame(frames[index])
    try:
        return driver.find_element(By.TAG_NAME, 'body').text
    finally:
        driver.switch_to.default_content()


def frame_script(script, index=0, *args):
    driver.switch_to.default_content()
    driver.switch_to.frame(driver.find_elements(By.CSS_SELECTOR, 'iframe[name^="viewgrid:"]')[index])
    try:
        return driver.execute_script(script, *args)
    finally:
        driver.switch_to.default_content()


try:
    with tempfile.TemporaryDirectory() as tmp:
        package = Path(tmp) / 'viewgrid-firefox.zip'
        with zipfile.ZipFile(package, 'w') as z:
            for p in Path('dist/firefox').rglob('*'):
                if p.is_file():
                    z.write(p, p.relative_to('dist/firefox'))
        addon = driver.install_addon(str(package), temporary=True)
        assert addon == 'viewgrid@viewgrid.dev'
    workspace(base + '/site')
    wait.until(lambda _: all('ViewGrid Firefox fixture' in frame_text(i) for i in range(4)))
    print('PASS Firefox: actual extension loads all four previews', flush=True)
    # Record requests after setup, before navigating to the protected fixture.
    driver.execute_script("window.__vgHeaders=[]; browser.webRequest.onHeadersReceived.addListener(d=>{window.__vgHeaders.push({tab:d.tabId,frame:d.frameId,parent:d.parentFrameId,url:d.url,origin:d.originUrl,document:d.documentUrl});}, {urls:['<all_urls>'],types:['sub_frame']});")
    bar = driver.find_elements(By.CSS_SELECTOR, 'input')[0]
    bar.clear()
    bar.send_keys(base + '/protected')
    from selenium.webdriver.common.keys import Keys
    bar.send_keys(Keys.ENTER)
    wait.until(lambda _: all('ViewGrid Firefox fixture' in frame_text(i) for i in range(4)))
    print('PASS Firefox: protected preview response loads', flush=True)
    frame_script('location.assign(arguments[0])', 0, base + '/protected-next')
    wait.until(lambda _: 'ViewGrid Firefox fixture' in frame_text())
    frame_script('location.reload()')
    wait.until(lambda _: 'ViewGrid Firefox fixture' in frame_text())
    print('PASS Firefox: protected navigation and reload', flush=True)
    print('FIREFOX HEADERS', driver.execute_script('return window.__vgHeaders'), flush=True)
    # Ensure a normal tab still cannot frame the protected page.
    main = driver.current_window_handle
    driver.switch_to.new_window('tab')
    driver.get(base + '/host')
    driver.switch_to.frame(driver.find_element(By.TAG_NAME, 'iframe'))
    assert 'ViewGrid Firefox fixture' not in driver.page_source
    driver.switch_to.default_content()
    driver.close()
    driver.switch_to.window(main)
    print('PASS Firefox: normal-tab framing protection retained', flush=True)
    if os.environ.get('VIEWGRID_LIVE_TEST_URL'):
        bar = driver.find_elements(By.CSS_SELECTOR, 'input')[0]
        bar.clear()
        bar.send_keys(os.environ['VIEWGRID_LIVE_TEST_URL'])
        bar.send_keys(Keys.ENTER)
        wait.until(lambda _: all('CastPost' in frame_text(i) for i in range(4)))
        frame_script('location.reload()')
        wait.until(lambda _: 'CastPost' in frame_text())
        print('PASS Firefox: CastPost live page and reload', flush=True)
except Exception:
    driver.switch_to.default_content()
    driver.save_screenshot(str(out / 'failure.png'))
    (out / 'page.html').write_text(driver.page_source)
    try:
        print('FIREFOX DIAGNOSTICS', driver.execute_script('return window.__vgHeaders || []'), flush=True)
    except Exception:
        pass
    raise
finally:
    driver.quit()
    server.shutdown()
