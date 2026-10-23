"""Validate real public TLS, exact built bytes, navigation, resources and isolation."""
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent
CURL = r'C:\Windows\System32\curl.exe'
BASE = 'https://nuwanda.space'
checks = []


def request(path, expected=200, *, url=None, digest=None, location=None):
    url = url or BASE + path
    result = subprocess.run([
        CURL, '--noproxy', '*', '--connect-timeout', '10', '--max-time', '25',
        '-sS', '-D', '-', '-w', '\nVERIFY:%{http_code};%{ssl_verify_result}', url,
    ], capture_output=True, check=True)
    headers, tail = result.stdout.split(b'\r\n\r\n', 1)
    body, trailer = tail.rsplit(b'\nVERIFY:', 1)
    status, tls = trailer.decode('ascii').split(';')
    assert int(status) == expected, (url, status, expected)
    assert tls == '0', (url, 'TLS invalid', tls)
    if digest:
        assert hashlib.sha256(body).hexdigest() == digest, (url, 'Unexpected content')
    if location:
        actual = next((line.split(b':', 1)[1].strip().decode('ascii') for line in headers.split(b'\r\n') if line.lower().startswith(b'location:')), None)
        assert actual == location, (url, actual, location)
    checks.append({'url': url, 'status': int(status), 'tlsVerify': int(tls), 'result': 'PASS'})
    print(f'PASS {status} {url}', flush=True)
    return body, headers


def file_request(path, local):
    return request(path, digest=hashlib.sha256(local.read_bytes()).hexdigest())


def main():
    client = ROOT / 'dist/client'
    home, headers = file_request('/', client / 'index.html')
    html = home.decode('utf-8')
    assert '<script' not in html
    assert html.count('<img ') == 2
    for route in ['about', 'life', 'notes', 'timeline', 'environment/ssg', 'environment/browser']:
        file_request(f'/{route}/', client / route / 'index.html')
    paths = set(re.findall(r'(?:src|href)="(/[^"?#]+\.(?:css|js|svg|webp|jpeg|jpg))"', html))
    paths.update(re.findall(r'(/_astro/[^\s,"<>]+\.(?:webp|jpeg|jpg))', html))
    for path in sorted(paths):
        _, resource_headers = file_request(path, client / path.lstrip('/'))
        if path.startswith('/_astro/'):
            assert b'immutable' in resource_headers
    file_request('/robots.txt', client / 'robots.txt')
    file_request('/sitemap.xml', client / 'sitemap.xml')
    first, headers = request('/api/health')
    second, _ = request('/api/health')
    a, b = json.loads(first), json.loads(second)
    assert a['status'] == 'ok' and a['mode'] == 'server' and a['requestId'] != b['requestId']
    assert b'no-store' in headers.lower()
    first, headers = request('/environment/ssr/')
    second, _ = request('/environment/ssr/')
    assert b'SSR_SMOKE_OK' in first and first != second
    assert b'no-store' in headers.lower()
    request('', 301, url='http://nuwanda.space/', location=BASE + '/')
    request('', 301, url='https://www.nuwanda.space/', location=BASE + '/')
    request('', 301, url='http://www.nuwanda.space/notes/?check=1', location=BASE + '/notes/?check=1')
    for path, code in [('/does-not-exist', 404), ('/proto/', 404), ('/.env.local', 403), ('/.git/config', 403), ('/nuwanda.space.key', 403), ('/27832570_nuwanda.space_nginx.zip', 403), ('/package.json', 404), ('/docs/storage.md', 404)]:
        request(path, code)
    request('', url='https://weihua.art/', digest='8740ba953739a872c64cbc440a702999313e090071e763221e023c9d74bebe5f')
    request('', url='https://weihua.art/proto/', digest='d9a09a46a82590533477503bd4b3a28fadbd739656f740b12564d1cb383aa58b')
    result = ROOT / '.local/homepage-v01/public-http.json'
    result.write_text(json.dumps({'date': '2026-10-15', 'timezone': 'Asia/Shanghai', 'checks': checks}, indent=2) + '\n', encoding='utf-8')
    print(f'All {len(checks)} public checks passed; {result}')


if __name__ == '__main__':
    main()
