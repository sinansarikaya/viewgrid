"""Controlled Firefox PSI UI test; no live measurement or forwarded network.

Run with the isolated Selenium environment after building dist/firefox. Selenium
4.36 lacks a provide_response wrapper, so use its command_builder for the BiDi
command implemented by Firefox. A denying HTTP/HTTPS proxy is an independent
fail-closed guard: intercepted requests must not even reach that proxy.
"""
import hashlib
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Lock, Thread
from urllib.parse import quote, urlsplit
import zipfile

import selenium
from selenium import webdriver
from selenium.webdriver.common.bidi.common import command_builder
from selenium.webdriver.common.bidi.network import NetworkEvent
from selenium.webdriver.common.by import By
from selenium.webdriver.common.proxy import Proxy
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import Select, WebDriverWait

PSI_HOST = 'pagespeedonline.googleapis.com'
PSI_PATH = '/pagespeedonline/v5/runPagespeed'
UUID = '22222222-2222-4222-8222-222222222222'
OUT = Path(os.environ.get('VIEWGRID_FIREFOX_BIDI_OUT', 'test-results/development/firefox-analysis-bidi'))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    evidence = {'controlledMock': True, 'outboundForwarded': 0, 'proxyDenied': [],
                'provided': [], 'blockedUnexpected': [], 'callbackErrors': [], 'probeServerHits': 0}
    mode = {'status': 200}
    command_lock = Lock()
    evidence_lock = Lock()
    fixture = json.loads(Path('tests/fixtures/psi-response.json').read_text())

    class FixtureHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/bidi-response-probe':
                evidence['probeServerHits'] += 1
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(b'<!doctype html><html lang="en"><title>Controlled fixture</title><h1>ViewGrid isolated BiDi fixture</h1></html>')

        def log_message(self, *_):
            pass

    class DenyProxyHandler(BaseHTTPRequestHandler):
        def deny(self):
            # Never connect to or forward the requested destination; no URL query logs.
            host = self.path.split(':', 1)[0] if self.command == 'CONNECT' else urlsplit(self.path).hostname
            with evidence_lock:
                evidence['proxyDenied'].append({'method': self.command, 'host': host})
            self.send_response(403)
            self.send_header('Content-Length', '0')
            self.end_headers()

        do_CONNECT = deny
        do_GET = deny
        do_POST = deny

        def log_message(self, *_):
            pass

    local = ThreadingHTTPServer(('127.0.0.1', 0), FixtureHandler)
    guard = ThreadingHTTPServer(('127.0.0.1', 0), DenyProxyHandler)
    for server in (local, guard):
        Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{local.server_port}'
    proxy_address = f'127.0.0.1:{guard.server_port}'
    options = webdriver.FirefoxOptions()
    options.binary_location = os.environ.get('VIEWGRID_FIREFOX_BINARY', '/home/sinan/.cache/ms-playwright/firefox-1509/firefox/firefox')
    options.add_argument('-headless')
    options.accept_insecure_certs = False
    options.set_capability('webSocketUrl', True)
    options.set_preference('extensions.webextensions.uuids', json.dumps({'viewgrid@viewgrid.dev': UUID}))
    proxy = Proxy()
    proxy.http_proxy = proxy_address
    proxy.ssl_proxy = proxy_address
    proxy.no_proxy = ['127.0.0.1', 'localhost']
    options.proxy = proxy
    driver = None
    package_dir = TemporaryDirectory(prefix='viewgrid-bidi-addon-')
    try:
        driver_path = os.environ.get('VIEWGRID_GECKODRIVER', '/home/sinan/.cache/selenium/geckodriver/linux64/0.37.1/geckodriver')
        driver = webdriver.Firefox(options=options, service=Service(executable_path=driver_path, log_output=str(OUT / 'geckodriver.log')))
        driver.set_window_size(1280, 1000)
        driver.set_script_timeout(15)
        wait = WebDriverWait(driver, 20)
        capabilities = driver.capabilities
        configured = capabilities['proxy']
        assert configured['httpProxy'] == proxy_address and configured['sslProxy'] == proxy_address, configured
        assert capabilities['acceptInsecureCerts'] is False
        evidence.update({'seleniumVersion': selenium.__version__, 'firefoxVersion': capabilities['browserVersion'],
                         'geckodriverVersion': capabilities.get('moz:geckodriverVersion'), 'proxyGuardVerified': True,
                         'buildSha256': hashlib.sha256(b''.join(source.read_bytes() for source in
                             sorted([Path('dist/firefox/manifest.json'), Path('dist/firefox/workspace.html'),
                                     *Path('dist/firefox/assets').glob('workspace-*.js')]))).hexdigest()})
        network = driver.network
        connection = network.conn

        def command(method, params):
            with command_lock:
                return connection.execute(command_builder(method, params))

        def on_request(event):
            params = event.params
            if not params.get('isBlocked'):
                return
            request = params['request']
            request_id = request['request']
            parsed = urlsplit(request['url'])
            try:
                if parsed.hostname == '127.0.0.1' and parsed.port == local.server_port:
                    if parsed.path != '/bidi-response-probe':
                        command('network.continueRequest', {'request': request_id})
                        return
                    status, content, content_type = 200, 'ViewGrid BiDi provided local response', 'text/plain'
                    kind = 'local-preflight'
                elif parsed.hostname == PSI_HOST and parsed.path == PSI_PATH:
                    status = mode['status']
                    content = json.dumps(fixture if status == 200 else {'error': {'code': 429, 'message': 'Controlled quota fixture'}})
                    content_type, kind = 'application/json', 'psi'
                else:
                    with evidence_lock:
                        evidence['blockedUnexpected'].append({'host': parsed.hostname, 'path': parsed.path})
                    command('network.failRequest', {'request': request_id})
                    return
                command('network.provideResponse', {
                    'request': request_id, 'statusCode': status,
                    'reasonPhrase': 'OK' if status == 200 else 'Too Many Requests',
                    'headers': [{'name': 'Content-Type', 'value': {'type': 'string', 'value': content_type}},
                                {'name': 'Access-Control-Allow-Origin', 'value': {'type': 'string', 'value': '*'}}],
                    'body': {'type': 'string', 'value': content},
                })
                with evidence_lock:
                    evidence['provided'].append({'kind': kind, 'status': status, 'host': parsed.hostname,
                                                 'path': parsed.path, 'isBlocked': True})
            except Exception as error:
                with evidence_lock:
                    evidence['callbackErrors'].append({'type': type(error).__name__, 'message': str(error)[:1000]})
                # Do not release a failed interception into the network.
                try:
                    command('network.failRequest', {'request': request_id})
                except Exception:
                    pass

        connection.add_callback(NetworkEvent('network.beforeRequestSent'), on_request)
        command('session.subscribe', {'events': ['network.beforeRequestSent']})
        network._add_intercept(phases=['beforeRequestSent'])
        driver.get(base + '/site')
        probe = driver.execute_async_script("const done=arguments[arguments.length-1]; fetch(arguments[0]).then(r=>r.text()).then(done).catch(e=>done({error:e.name}));", base + '/bidi-response-probe')
        assert probe == 'ViewGrid BiDi provided local response', (probe, evidence['callbackErrors'])
        assert evidence['probeServerHits'] == 0
        wait.until(lambda _: len([item for item in evidence['provided'] if item['kind'] == 'local-preflight']) == 1)
        print('PASS BiDi: native provideResponse local preflight; original server received zero probe requests', flush=True)

        package = Path(package_dir.name) / 'viewgrid-firefox.zip'
        with zipfile.ZipFile(package, 'w') as archive:
            for source in Path('dist/firefox').rglob('*'):
                if source.is_file():
                    archive.write(source, source.relative_to('dist/firefox'))
        assert driver.execute('INSTALL_ADDON', {'path': str(package), 'temporary': True})['value'] == 'viewgrid@viewgrid.dev'
        workspace_url = f'moz-extension://{UUID}/workspace.html?url={quote(base + "/site", safe="")}'

        def open_analysis():
            driver.get(workspace_url)
            wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, 'iframe[name^="viewgrid:"]')) == 4)
            driver.find_element(By.XPATH, "//button[contains(., 'Performance & CrUX')]").click()
            dialog = wait.until(lambda d: d.find_element(By.CSS_SELECTOR, '[role="dialog"]'))
            target = dialog.find_element(By.CSS_SELECTOR, 'input[aria-label="Target URL"]')
            target.clear()
            target.send_keys('https://example.com/')
            counts = dialog.find_elements(By.CSS_SELECTOR, 'select[aria-label="Run Count"]')
            if counts:
                Select(counts[0]).select_by_value('1')
            dialog.find_element(By.CSS_SELECTOR, 'input[type="checkbox"]').click()
            button = dialog.find_element(By.XPATH, ".//button[contains(., 'Run Analysis')]")
            wait.until(lambda _: button.is_enabled())
            button.click()
            return dialog

        def analysis_status(dialog):
            return dialog.find_element(By.CSS_SELECTOR, '[aria-label="Analysis status"]')

        def psi_count(status):
            with evidence_lock:
                return len([item for item in evidence['provided'] if item['kind'] == 'psi' and item['status'] == status])

        analysis_tabs = ['Performance & CrUX', 'SEO & Accessibility', 'GEO Signals (Beta)']

        dialog = open_analysis()
        tbt = wait.until(lambda _: dialog.find_element(By.XPATH, ".//span[normalize-space(.)='Total Blocking Time (TBT)']/.."))
        wait.until(lambda _: '210 ms' in tbt.text)
        wait.until(lambda _: 'p75 INP: 180 ms' in dialog.text)
        assert dialog.find_elements(By.CSS_SELECTOR, '[class*="scoreBadge"]')
        assert fixture['lighthouseResult']['lighthouseVersion'] in dialog.text
        # The controlled fixture has a Lighthouse runWarning. Measurements are
        # successful, but their shared UI summary must acknowledge partial data.
        expected_success_status = 'Partial result: some measurements failed, are incomplete or cannot be compared.' if fixture['lighthouseResult'].get('runWarnings') else 'Success'
        evidence['successTabStates'] = []
        for tab in analysis_tabs:
            dialog.find_element(By.XPATH, f".//button[normalize-space(.)='{tab}']").click()
            wait.until(lambda _: analysis_status(dialog).find_element(By.CSS_SELECTOR, '[role="status"]').text == expected_success_status)
            assert not analysis_status(dialog).find_elements(By.CSS_SELECTOR, '[role="alert"]')
            if tab == 'SEO & Accessibility':
                assert dialog.find_elements(By.CSS_SELECTOR, '[class*="auditCard"]')
            if tab == 'GEO Signals (Beta)':
                assert dialog.find_elements(By.CSS_SELECTOR, '[class*="geoTable"] tbody tr')
            evidence['successTabStates'].append({'tab': tab, 'status': expected_success_status})
        dialog.find_element(By.XPATH, ".//button[normalize-space(.)='Performance & CrUX']").click()
        driver.save_screenshot(str(OUT / 'controlled-200.png'))
        wait.until(lambda _: len([item for item in evidence['provided'] if item['kind'] == 'psi' and item['status'] == 200]) == 1)
        print('PASS Firefox actual addon: controlled 200 laboratory TBT 210 ms / separate field p75 INP 180 ms', flush=True)

        mode['status'] = 429
        dialog = open_analysis()
        wait.until(lambda _: 'Google PageSpeed rate limit exceeded' in dialog.text)
        assert not dialog.find_elements(By.CSS_SELECTOR, '[class*="scoreBadge"]')
        driver.save_screenshot(str(OUT / 'controlled-429.png'))
        wait.until(lambda _: len([item for item in evidence['provided'] if item['kind'] == 'psi' and item['status'] == 429]) >= 1)
        quota_count = len([item for item in evidence['provided'] if item['kind'] == 'psi' and item['status'] == 429])
        assert quota_count == 1, quota_count
        evidence['quotaTabStates'] = []
        for tab in analysis_tabs:
            dialog.find_element(By.XPATH, f".//button[normalize-space(.)='{tab}']").click()
            region = analysis_status(dialog)
            assert region.is_displayed()
            wait.until(lambda _: region.find_element(By.CSS_SELECTOR, '[role="alert"]').is_displayed())
            assert 'Google PageSpeed rate limit exceeded' in region.text and 'HTTP 429' in region.text
            assert 'No automatic retry was made.' in region.text
            assert region.find_element(By.CSS_SELECTOR, '[role="status"]').text == 'No successful measurement data. No score or findings result was produced.'
            assert not dialog.find_elements(By.CSS_SELECTOR, '[class*="scoreBadge"]')
            assert 'No audits match the selected filters.' not in dialog.text
            assert not dialog.find_elements(By.CSS_SELECTOR, '[class*="auditCard"], [class*="geoTable"] tbody tr')
            assert psi_count(429) == 1
            evidence['quotaTabStates'].append({'tab': tab, 'alert': 'HTTP 429', 'fakeScores': 0})
        # Wait beyond the ordinary client's retry backoff; tab changes and time
        # alone must not make another request in the UI's explicit-retry runner.
        driver.execute_async_script('const done=arguments[arguments.length-1]; setTimeout(()=>done(true),1200);')
        assert psi_count(429) == 1
        region = analysis_status(dialog)
        region.find_element(By.XPATH, ".//button[normalize-space(.)='Retry']").click()
        wait.until(lambda _: psi_count(429) == 2)
        wait.until(lambda _: analysis_status(dialog).find_element(By.CSS_SELECTOR, '[role="alert"]').is_displayed())
        driver.execute_async_script('const done=arguments[arguments.length-1]; setTimeout(()=>done(true),1200);')
        assert psi_count(429) == 2
        assert not dialog.find_elements(By.CSS_SELECTOR, '[class*="scoreBadge"]')
        evidence['quotaRetry'] = {'initialRequests': 1, 'automaticRetries': 0, 'manualRetries': 1, 'totalRequests': 2}
        driver.save_screenshot(str(OUT / 'controlled-429-all-tabs-manual-retry.png'))
        assert not evidence['callbackErrors'], evidence['callbackErrors']
        assert not [item for item in evidence['proxyDenied'] if 'google' in (item['host'] or '')], evidence['proxyDenied']
        assert not [item for item in evidence['blockedUnexpected'] if 'google' in (item['host'] or '')], evidence['blockedUnexpected']
        evidence['outcome'] = 'passed'
        print('PASS Firefox actual addon: controlled 200/429 status across Performance/SEO/GEO, no fabricated scores, one initial request and one explicit manual retry; zero Google proxy attempts / zero outbound forwarding', flush=True)
    except Exception as error:
        evidence['outcome'] = 'failed-or-unsupported'
        evidence['failure'] = {'type': type(error).__name__, 'message': str(error)[:2000]}
        raise
    finally:
        # Keep interceptions and the denying proxy active until Firefox has quit.
        if driver is not None:
            driver.quit()
        (OUT / 'evidence.json').write_text(json.dumps(evidence, indent=2) + '\n')
        package_dir.cleanup()
        for server in (local, guard):
            server.shutdown()
            server.server_close()


if __name__ == '__main__':
    main()
