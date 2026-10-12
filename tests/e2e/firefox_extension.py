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
import subprocess

from selenium import webdriver
from selenium.common.exceptions import StaleElementReferenceException, NoSuchFrameException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

FIXTURE = '<!doctype html><h1>ViewGrid Firefox fixture</h1><button id="action" onclick="document.querySelector(\'#count\').textContent=Number(document.querySelector(\'#count\').textContent)+1">Count</button><span id="count">0</span><input id="name"><div style="height:1800px"></div>'


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        if self.path == '/sw.js':
            self.send_header('Content-Type', 'application/javascript')
            self.end_headers()
            self.wfile.write(b"self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(fetch(e.request));});")
            return
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
os.environ['MOZ_REMOTE_ALLOW_SYSTEM_ACCESS'] = '1'
options = webdriver.FirefoxOptions()
if os.environ.get('VIEWGRID_FIREFOX_BINARY'):
    options.binary_location = os.environ['VIEWGRID_FIREFOX_BINARY']
headed = os.environ.get('VIEWGRID_FIREFOX_HEADED') == '1'
if headed:
    assert os.environ.get('DISPLAY'), 'Headed Firefox requires the real desktop DISPLAY'
    os.environ['MOZ_ENABLE_WAYLAND'] = '0'
else:
    options.add_argument('-headless')
options.set_preference('extensions.webextensions.uuids', json.dumps({'viewgrid@viewgrid.dev': uuid}))
driver = webdriver.Firefox(options=options)
if headed and os.environ.get('HYPRLAND_INSTANCE_SIGNATURE'):
    pid = driver.capabilities['moz:processID']
    clients = json.loads(subprocess.check_output(['hyprctl', '-j', 'clients'], text=True))
    owned = [client for client in clients if client['pid'] == pid]
    assert len(owned) == 1, 'Cannot verify ownership of Firefox test window'
    subprocess.check_output(['hyprctl', 'eval', f'local w=hl.get_window("pid:{pid}"); assert(w); hl.dispatch(hl.dsp.window.fullscreen_state({{internal=0,client=0,action="set",layout_aware=false,window=w}})); hl.dispatch(hl.dsp.window.float({{action="set",window=w}}))'], text=True)
    print('OWNED HEADED FIREFOX', {'pid': pid, 'address': owned[0]['address']}, flush=True)
driver.set_window_size(1280, 900)
wait = WebDriverWait(driver, 25, ignored_exceptions=(StaleElementReferenceException, NoSuchFrameException))
out = Path(os.environ.get('VIEWGRID_FIREFOX_TEST_OUT', 'test-results/firefox'))
out.mkdir(parents=True, exist_ok=True)
package_dir = tempfile.TemporaryDirectory()


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
    # Use GeckoDriver's local path installation. Its base64 archive transfer can
    # fail to load content-script files in the cached Firefox test environment.
    # The local package must remain available until the browser closes.
    package = Path(package_dir.name) / 'viewgrid-firefox.zip'
    with zipfile.ZipFile(package, 'w') as z:
        for p in Path('dist/firefox').rglob('*'):
            if p.is_file():
                z.write(p, p.relative_to('dist/firefox'))
    addon = driver.execute('INSTALL_ADDON', {'path': str(package), 'temporary': True})['value']
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
    wait.until(lambda _: all(frame_script('return location.href', i) == base + '/protected' for i in range(4)))
    wait.until(lambda _: all('ViewGrid Firefox fixture' in frame_text(i) for i in range(4)))
    print('PASS Firefox: protected preview response loads', flush=True)
    frame_script('location.assign(arguments[0])', 0, base + '/protected-next')
    wait.until(lambda _: frame_script('return location.href') == base + '/protected-next')
    wait.until(lambda _: 'ViewGrid Firefox fixture' in frame_text())
    before = frame_script('return performance.timeOrigin')
    frame_script('location.reload()')
    wait.until(lambda _: frame_script('return performance.timeOrigin') != before)
    wait.until(lambda _: 'ViewGrid Firefox fixture' in frame_text())
    print('PASS Firefox: protected navigation and reload', flush=True)
    driver.execute_script("window.__vgSyncEvents=[]; browser.runtime.onMessage.addListener(m=>{if(m.type==='vg/agent-event')window.__vgSyncEvents.push(m.env);});")
    frame_script("document.querySelector('#action').click()")
    wait.until(lambda _: all(frame_script("return document.querySelector('#count').textContent", i) == '1' for i in range(4)))
    print('PASS Firefox: actual content agents synchronize clicks', flush=True)
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
    driver.switch_to.frame(driver.find_elements(By.CSS_SELECTOR, 'iframe[name^="viewgrid:"]')[0])
    result = driver.execute_async_script("const done=arguments[arguments.length-1]; navigator.serviceWorker.register('/sw.js').then(()=>done('registered')).catch(e=>done(e.name));")
    driver.switch_to.default_content()
    assert result == 'SecurityError', result
    print('PASS Firefox: preview worker registration is blocked', flush=True)
    expected_version = json.loads(Path('package.json').read_text())['version']
    wait.until(lambda d: d.find_element(By.CSS_SELECTOR, '[data-testid="extension-version"]').text == f'v{expected_version}')
    driver.save_screenshot(str(out / 'success.png'))
    print(f'PASS Firefox: extension version v{expected_version}', flush=True)
    logical = [frame_script('return [innerWidth,innerHeight]', i) for i in range(4)]
    for width, height in [(1280, 800), (1920, 1080)]:
        driver.set_window_size(width, height)
        actual = driver.execute_script('return [innerWidth, innerHeight]')
        driver.set_window_size(width + width - actual[0], height + height - actual[1])
        wait.until(lambda d: d.execute_script('return [innerWidth, innerHeight]') == [width, height])
        driver.find_element(By.XPATH, "//button[@title='Row']").click()
        driver.find_element(By.XPATH, "//button[@title='Grid']").click()
        driver.find_element(By.XPATH, "//button[@title='Fit to screen']").click()
        print('FIREFOX UI CSS GEOMETRY', {'expected': logical, 'observed': [frame_script('return [innerWidth,innerHeight]', i) for i in range(4)]}, flush=True)
        wait.until(lambda _: [frame_script('return [innerWidth,innerHeight]', i) for i in range(4)] == logical)
        assert driver.execute_script('return document.documentElement.scrollWidth <= innerWidth')
        driver.save_screenshot(str(out / f'workspace-{width}.png'))
    print('PASS Firefox: UI 1280/1920, Row/Grid/Fit preserve CSS dimensions and document reflow', flush=True)
    if headed:
        evidence = []
        for width, height in [(1280, 800), (1920, 1080)]:
            driver.execute_async_script('const done=arguments[arguments.length-1]; browser.tabs.getCurrent().then(t=>browser.tabs.setZoom(t.id,1)).then(()=>done(true));')
            driver.set_window_size(width, height)
            time.sleep(1)
            actual = driver.execute_script('return [innerWidth, innerHeight]')
            driver.set_window_size(width + width - actual[0], height + height - actual[1])
            wait.until(lambda d: d.execute_script('return [innerWidth,innerHeight]') == [width,height])
            time.sleep(.5)
            for factor in [.8, 1, 1.25]:
                actual_zoom = driver.execute_async_script('const factor=arguments[0], done=arguments[arguments.length-1]; browser.tabs.getCurrent().then(async t=>{await browser.tabs.setZoom(t.id,factor); done(await browser.tabs.getZoom(t.id));});', factor)
                assert actual_zoom == factor
                time.sleep(.5)
                measured = driver.execute_script('return {width:innerWidth,height:innerHeight,dpr:devicePixelRatio}')
                assert abs(measured['width']*factor-width) <= 1
                assert abs(measured['height']*factor-height) <= 1
                driver.find_element(By.XPATH, "//button[@title='Fit to screen']").click()
                print('FIREFOX BROWSER ZOOM GEOMETRY', {'factor':factor,'measured':measured,'frameInner': [frame_script('return [innerWidth,innerHeight]', i) for i in range(4)], 'iframeCSS':driver.execute_script("return [...document.querySelectorAll('iframe[name^=\"viewgrid:\"]')].map(f=>[f.clientWidth,f.clientHeight])")}, flush=True)
                # Firefox rounds frame inner dimensions through fractional physical
                # pixels at browser zoom (e.g. 852 CSS px becomes 853 at 80%).
                # The actual iframe CSS contract remains exact, not relaxed.
                assert driver.execute_script("return [...document.querySelectorAll('iframe[name^=\"viewgrid:\"]')].map(f=>[f.clientWidth,f.clientHeight])") == logical
                observed = [frame_script('return [innerWidth,innerHeight]', i) for i in range(4)]
                assert all(abs(actual-wanted) <= 1 for pair, expected in zip(observed, logical) for actual, wanted in zip(pair, expected)), observed
                assert driver.execute_script('return document.documentElement.scrollWidth<=innerWidth')
                assert len(driver.find_elements(By.CSS_SELECTOR, 'header svg')) > 0
                wait.until(lambda d: d.execute_script("return [...document.querySelectorAll('[data-viewport-id]')].every(card=>{const b=card.getBoundingClientRect(),m=card.closest('main').getBoundingClientRect();return b.left>=m.left-1&&b.right<=m.right+1&&b.top>=m.top-1&&b.bottom<=m.bottom+1;})"))
                png = driver.get_screenshot_as_png()
                (out / f'grid-{width}x{height}-browser-{round(factor*100)}.png').write_bytes(png)
                evidence.append({'workspaceAt100': [width,height], 'browserZoom':actual_zoom, 'viewport':measured, 'imagePixels':[int.from_bytes(png[16:20],'big'),int.from_bytes(png[20:24],'big')], 'logical':logical, 'frameInner':observed})
        (out / 'headed-zoom-evidence.json').write_text(json.dumps(evidence, indent=2))
        driver.execute_async_script('const done=arguments[arguments.length-1]; browser.tabs.getCurrent().then(t=>browser.tabs.setZoom(t.id,1)).then(()=>done(true));')
        from selenium.webdriver import ActionChains
        fit = driver.find_element(By.XPATH, "//button[@title='Fit to screen']")
        ActionChains(driver).move_to_element(fit).perform()
        wait.until(lambda d: d.find_element(By.CSS_SELECTOR,'[role="tooltip"]').is_displayed())
        ActionChains(driver).move_by_offset(-100,0).perform()
        driver.execute_script('arguments[0].focus()', fit)
        wait.until(lambda d: d.find_element(By.CSS_SELECTOR,'[role="tooltip"]').is_displayed())
        driver.save_screenshot(str(out / 'toolbar-tooltip.png'))
        for label in ['Row', 'Column', 'Freeform', 'Grid']:
            driver.find_element(By.XPATH, f"//button[@title='{label}']").click()
            expected = {'Row':'row','Column':'col','Freeform':'free','Grid':'grid'}[label]
            wait.until(lambda d: d.find_element(By.CSS_SELECTOR,'main [data-layout]').get_attribute('data-layout') == expected)
        print('PASS Firefox: headed SVG/tooltip, four layouts and six actual browser zoom cases', flush=True)
    # Network-free consent check. Controlled transport/results are verified
    # separately by firefox_analysis_bidi.py, not by this baseline runner.
    print('INFO Firefox: controlled PSI 200/429 has a separate BiDi runner', flush=True)
    driver.find_element(By.XPATH, "//button[contains(., 'Performance & CrUX')]").click()
    dialog = wait.until(lambda d: d.find_element(By.CSS_SELECTOR, '[role="dialog"]'))
    target = dialog.find_element(By.CSS_SELECTOR, 'input[aria-label="Target URL"]')
    target.clear()
    target.send_keys('https://example.com/')
    run_button = dialog.find_element(By.XPATH, ".//button[contains(., 'Run Analysis')]")
    assert not run_button.is_enabled()
    dialog.find_element(By.CSS_SELECTOR, 'input[type="checkbox"]').click()
    wait.until(lambda _: run_button.is_enabled())
    target.clear()
    target.send_keys('http://127.0.0.1/')
    wait.until(lambda _: not run_button.is_enabled())
    assert not dialog.find_elements(By.CSS_SELECTOR, '[class*="scoreBadge"]')
    driver.save_screenshot(str(out / 'analysis-consent-validation.png'))
    print('PASS Firefox: analysis consent/public URL validation UI; no analysis request sent', flush=True)
    driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
    wait.until(lambda d: not d.find_elements(By.CSS_SELECTOR, '[role="dialog"]'))
    if os.environ.get('VIEWGRID_LIVE_TEST_URL'):
        url = os.environ['VIEWGRID_LIVE_TEST_URL']
        main = driver.current_window_handle
        driver.switch_to.new_window('tab')
        driver.get(url)
        wait.until(lambda d: 'Cast once.' in d.find_element(By.TAG_NAME, 'body').text)
        driver.set_script_timeout(30)
        warmed = driver.execute_async_script("const done=arguments[arguments.length-1]; navigator.serviceWorker.register('/sw.js').then(()=>navigator.serviceWorker.ready).then(()=>done(true)).catch(e=>done(String(e)));")
        assert warmed is True, warmed
        wait.until(lambda d: d.execute_script('return !!navigator.serviceWorker.controller'))
        print('CASTPOST FIREFOX WARM PROFILE', driver.execute_script('return navigator.serviceWorker.controller.scriptURL'), flush=True)
        normal = driver.current_window_handle
        driver.execute_script("localStorage.setItem('__viewgrid_preserve','keep');document.cookie='__viewgrid_preserve=keep; SameSite=Lax; path=/';")
        driver.switch_to.window(main)
        driver.close()
        for phase in ['first warm open', 'reopen', 'second reopen']:
            driver.switch_to.window(normal)
            driver.switch_to.new_window('tab')
            workspace(url)
            wait.until(lambda _: all('Cast once.' in frame_text(i) for i in range(4)))
            driver.save_screenshot(str(out / ('castpost-' + phase.replace(' ', '-') + '.png')))
            if phase == 'first warm open':
                preview_handle = driver.current_window_handle
                driver.switch_to.window(normal)
                preserved = driver.execute_script("return {storage:localStorage.getItem('__viewgrid_preserve'),cookie:document.cookie.includes('__viewgrid_preserve=keep')};")
                assert preserved == {'storage':'keep','cookie':True}, preserved
                driver.switch_to.window(preview_handle)
                print('PASS FIREFOX DATA PRESERVATION', preserved, flush=True)

                for index in range(4):
                    frame_script("document.documentElement.style.scrollBehavior='smooth'; window.__vgScrollLatencies=[]; window.addEventListener('message',e=>{if(e.data?.type==='vg/scroll-apply')window.__vgScrollLatencies.push(Date.now()-e.data.env.ts);});", index)
                driver.switch_to.frame(driver.find_elements(By.CSS_SELECTOR, 'iframe[name^="viewgrid:"]')[0])
                driver.execute_async_script("const done=arguments[arguments.length-1]; window.dispatchEvent(new Event('wheel')); (async()=>{for(let step=1;step<=20;step++){const max=document.documentElement.scrollHeight-document.documentElement.clientHeight; window.scrollTo({top:Math.round(max*step*.03),behavior:'instant'}); await new Promise(r=>setTimeout(r,50));} done(true);})();")
                driver.switch_to.default_content()
                wait.until(lambda _: all(frame_script('return window.__vgScrollLatencies.length', i) >= 5 for i in range(1, 4)))
                latencies = sorted(sum([frame_script('return window.__vgScrollLatencies', i) for i in range(1, 4)], []))
                p95 = latencies[int((len(latencies)-1)*.95)]
                print('FIREFOX SCROLL TIMING', {'samples':len(latencies),'p95Ms':p95}, flush=True)
                assert p95 < 100, latencies
                wait.until(lambda _: max(frame_script('return scrollY/(document.documentElement.scrollHeight-document.documentElement.clientHeight)', i) for i in range(4)) - min(frame_script('return scrollY/(document.documentElement.scrollHeight-document.documentElement.clientHeight)', i) for i in range(4)) < .02)
            time.sleep(1.5)
            before = frame_script('return performance.timeOrigin')
            frame_script('location.reload()')
            wait.until(lambda _: frame_script('return performance.timeOrigin') != before)
            wait.until(lambda _: 'Cast once.' in frame_text())
            print(f'PASS Firefox: CastPost {phase}, four healthy previews and reload', flush=True)
            driver.close()
        driver.switch_to.window(normal)
except Exception:
    driver.switch_to.default_content()
    driver.save_screenshot(str(out / 'failure.png'))
    (out / 'page.html').write_text(driver.page_source)
    try:
        print('FIREFOX DIAGNOSTICS', driver.execute_script('return window.__vgHeaders || []'), flush=True)
        print('FIREFOX SYNC EVENTS', driver.execute_script('return window.__vgSyncEvents || []'), flush=True)
        print('FIREFOX FRAME STATE', [frame_script("return {url:location.href,name:window.name,count:document.querySelector('#count')?.textContent,timeOrigin:performance.timeOrigin}", i) for i in range(4)], flush=True)
    except Exception:
        pass
    raise
finally:
    try:
        driver.quit()
    finally:
        package_dir.cleanup()
        server.shutdown()
