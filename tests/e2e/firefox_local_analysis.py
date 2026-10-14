"""Real headed Firefox extension test with a fail-closed local proxy; no audit service."""
import json
import os
import subprocess
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
from urllib.parse import quote, urlsplit
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.proxy import Proxy
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import Select, WebDriverWait

OUT = Path('test-results/local-analysis/firefox')
UUID = '33333333-3333-4333-8333-333333333333'


def main():
    assert os.environ.get('DISPLAY'), 'Real desktop DISPLAY required; no headless fallback'
    OUT.mkdir(parents=True, exist_ok=True)
    evidence = {'headed': True, 'proxyDenied': [], 'checks': [], 'scanExternalRequests': []}

    class Fixture(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<!doctype html><html lang="en"><head><title></title><meta name="viewport" content="width=device-width"><link rel="canonical" href="/"><script type="application/ld+json">{invalid</script></head><body><main><h1>Local Firefox fixture</h1><h3>Skipped heading</h3><input><button></button><img></main></body></html>')
        def log_message(self, *_):
            pass

    class Deny(BaseHTTPRequestHandler):
        def deny(self):
            evidence['proxyDenied'].append(urlsplit(self.path).hostname or self.path.split(':')[0])
            self.send_response(403)
            self.end_headers()
        do_CONNECT = deny
        do_GET = deny
        do_POST = deny
        def log_message(self, *_):
            pass

    local = ThreadingHTTPServer(('127.0.0.1', 0), Fixture)
    proxy_server = ThreadingHTTPServer(('127.0.0.1', 0), Deny)
    for server in (local, proxy_server):
        Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{local.server_port}'
    options = webdriver.FirefoxOptions()
    options.binary_location = '/home/sinan/.cache/ms-playwright/firefox-1509/firefox/firefox'
    options.set_preference('extensions.webextensions.uuids', json.dumps({'viewgrid@viewgrid.dev': UUID}))
    options.set_preference('intl.accept_languages', 'en-US,en')
    options.set_preference('ui.prefersReducedMotion', 1)
    proxy = Proxy()
    proxy.http_proxy = proxy.ssl_proxy = f'127.0.0.1:{proxy_server.server_port}'
    proxy.no_proxy = ['localhost', '127.0.0.1']
    options.proxy = proxy
    os.environ['MOZ_ENABLE_WAYLAND'] = '0'
    driver = webdriver.Firefox(options=options, service=Service('/home/sinan/.cache/selenium/geckodriver/linux64/0.37.1/geckodriver'))
    wait = WebDriverWait(driver, 20)
    try:
        if os.environ.get('HYPRLAND_INSTANCE_SIGNATURE'):
            pid = driver.capabilities['moz:processID']
            clients = json.loads(subprocess.check_output(['hyprctl', '-j', 'clients'], text=True))
            assert any(c['pid'] == pid and not c.get('hidden', False) for c in clients), 'No real owned Firefox window'
            evidence['compositorPid'] = pid
        driver.set_window_size(1280, 900)
        with TemporaryDirectory() as package_dir:
            package = Path(package_dir) / 'viewgrid-local-firefox.zip'
            with zipfile.ZipFile(package, 'w') as archive:
                for source in Path('dist/firefox').rglob('*'):
                    if source.is_file():
                        archive.write(source, source.relative_to('dist/firefox'))
            assert driver.execute('INSTALL_ADDON', {'path': str(package), 'temporary': True})['value'] == 'viewgrid@viewgrid.dev'
            driver.get(f'moz-extension://{UUID}/workspace.html?url={quote(base + "/broken", safe="")}')
            wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, '[data-viewport-id] iframe')) == 4)
            for index in range(4):
                driver.switch_to.frame(driver.find_elements(By.CSS_SELECTOR, '[data-viewport-id] iframe')[index])
                wait.until(lambda d: d.find_element(By.TAG_NAME, 'h1').text == 'Local Firefox fixture')
                driver.switch_to.default_content()
            driver.find_element(By.XPATH, "//button[normalize-space(.)='Local Performance']").click()
            dialog = wait.until(lambda d: d.find_element(By.CSS_SELECTOR, '[role="dialog"]'))
            assert not dialog.find_elements(By.CSS_SELECTOR, 'input[type="checkbox"]')
            assert Select(dialog.find_element(By.CSS_SELECTOR, 'select[aria-label="Target Profile"]')).first_selected_option.get_attribute('value') == 'both'
            before = len(evidence['proxyDenied'])
            dialog.find_element(By.XPATH, ".//button[normalize-space(.)='Run All Analyses']").click()
            wait.until(lambda d: d.find_element(By.CSS_SELECTOR, '[aria-label="Analysis status"] [data-analysis-status]').text == 'Measurements captured')
            evidence['scanExternalRequests'] = evidence['proxyDenied'][before:]
            assert not evidence['scanExternalRequests'], evidence['scanExternalRequests']
            assert len(dialog.find_elements(By.XPATH, ".//*[contains(text(), 'Inspected DOM elements')]") ) >= 2
            dialog.find_element(By.XPATH, ".//button[@aria-label='SEO & Accessibility']").click()
            wait.until(lambda _: len(dialog.find_elements(By.XPATH, ".//*[normalize-space(.)='Document title']")) == 1)
            assert len(dialog.find_elements(By.XPATH, ".//*[normalize-space(.)='Accessible button names']")) == 1
            assert len(dialog.find_elements(By.XPATH, ".//*[normalize-space(.)='JSON-LD syntax and basic shape']")) == 1
            driver.save_screenshot(str(OUT / 'local-findings.png'))
            evidence['checks'].append('Both real profiles, DOM findings and bundled axe passed')
            driver.execute_async_script("const done=arguments[0]; browser.storage.local.get('viewgrid.analysis.history').then(v=>done(v));")
            stored = driver.execute_async_script("const done=arguments[0]; browser.storage.local.get('viewgrid.analysis.history').then(v=>done(v['viewgrid.analysis.history']));")
            assert stored and len(stored[0]['batch']['results']) == 2
            assert all(item['data']['source'] == 'viewgrid-local' for item in stored[0]['batch']['results'])
            assert all(item['data']['lab']['scores']['performance'] is None for item in stored[0]['batch']['results'])
            evidence['checks'].append('Local history preserves source and no fabricated score')
            dialog.find_element(By.CSS_SELECTOR, 'button[aria-label="Close dialog"]').click()
            wait.until(lambda d: not d.find_elements(By.CSS_SELECTOR, '[role="dialog"]'))
            driver.find_element(By.CSS_SELECTOR, 'button[aria-label="Local Performance"]').click()
            dialog = wait.until(lambda d: d.find_element(By.CSS_SELECTOR, '[role="dialog"]'))
            wait.until(lambda d: d.find_element(By.CSS_SELECTOR, '[aria-label="Analysis status"] [data-analysis-status]').text == 'Measurements captured')
            cached = driver.execute_async_script("const done=arguments[0]; browser.storage.local.get('viewgrid.analysis.history').then(v=>done(v['viewgrid.analysis.history']));")
            assert cached == stored
            dialog.find_element(By.XPATH, ".//button[normalize-space(.)='Copy Report']").click()
            wait.until(lambda _: dialog.find_elements(By.XPATH, ".//*[normalize-space(.)='Local Performance report copied to the clipboard.']"))
            evidence['checks'].append('Modal reopen retains results without rescan; section Markdown copy succeeds')
            dialog.find_element(By.CSS_SELECTOR, 'button[aria-label="Close dialog"]').click()
            wait.until(lambda d: not d.find_elements(By.CSS_SELECTOR, '[role="dialog"]'))
            panel = driver.find_element(By.XPATH, "//button[normalize-space(.)='Panel']")
            panel.click()
            drawer = wait.until(lambda d: d.find_element(By.CSS_SELECTOR, 'aside[aria-label="Responsive issues"]'))
            assert driver.execute_script('return getComputedStyle(arguments[0]).animationName', drawer) == 'none'
            panel.click()
            wait.until(lambda d: not d.find_elements(By.CSS_SELECTOR, 'aside[aria-label="Responsive issues"]'))
            evidence['checks'].append('Panel toggle and reduced motion passed')
            print('PASS headed Firefox local analysis, axe, profiles, history, toggle and external-service isolation', flush=True)
    except Exception:
        driver.save_screenshot(str(OUT / 'failure.png'))
        (OUT / 'failure.html').write_text(driver.page_source)
        raise
    finally:
        (OUT / 'evidence.json').write_text(json.dumps(evidence, indent=2))
        driver.quit()
        local.shutdown()
        proxy_server.shutdown()


if __name__ == '__main__':
    main()
