"""Public HTTPS, redirect, host-routing and secret-path smoke checks."""
import hashlib
import json
from pathlib import Path
import subprocess


CURL = r'C:\Windows\System32\curl.exe'
RESULT = Path(__file__).with_name('verification-20261014.json')
checks = []


def request(name, url, expected, *, marker=None, digest=None, location=None, resolve=None):
    command = [CURL, '--noproxy', '*', '--connect-timeout', '8', '--max-time', '15', '-sS', '-D', '-', '-w', '\nCURL_STATUS:%{http_code};TLS:%{ssl_verify_result}', url]
    if resolve:
        command.extend(['--resolve', resolve])
    response = subprocess.run(command, capture_output=True, check=True)
    headers, rest = response.stdout.split(b'\r\n\r\n', 1)
    body, status = rest.rsplit(b'\nCURL_STATUS:', 1)
    code, tls = status.decode('ascii').split(';TLS:')
    assert int(code) == expected, (name, code, expected)
    assert tls == '0', (name, 'TLS validation failed', tls)
    if marker:
        assert marker.encode('utf-8') in body, (name, 'Missing page marker')
    if digest:
        assert hashlib.sha256(body).hexdigest() == digest, (name, 'Content changed')
    if location:
        actual = next((line.split(b':', 1)[1].strip().decode('ascii') for line in headers.split(b'\r\n') if line.lower().startswith(b'location:')), None)
        assert actual == location, (name, actual, location)
    checks.append({'name': name, 'url': url, 'status': int(code), 'tls_verify': tls, 'result': 'PASS', 'forced_resolution': resolve})
    print(f'PASS {name}: HTTP {code}', flush=True)


def main():
    request('blog_https', 'https://nuwanda.space/', 200, marker='个人博客准备中', digest=hashlib.sha256(Path(__file__).with_name('site-ready').joinpath('index.html').read_bytes()).hexdigest())
    request('http_redirect', 'http://nuwanda.space/', 301, location='https://nuwanda.space/')
    request('redirect_preserves_query', 'http://nuwanda.space/post.html?lang=zh&item=%E5%B9%B4%E7%94%BB', 301, location='https://nuwanda.space/post.html?lang=zh&item=%E5%B9%B4%E7%94%BB')
    request('www_https_config', 'https://www.nuwanda.space/', 301, location='https://nuwanda.space/', resolve='www.nuwanda.space:443:39.98.83.105')
    request('weihua_unchanged', 'https://weihua.art/', 200, digest='8740ba953739a872c64cbc440a702999313e090071e763221e023c9d74bebe5f')
    request('weihua_proto_unchanged', 'https://weihua.art/proto/', 200, digest='d9a09a46a82590533477503bd4b3a28fadbd739656f740b12564d1cb383aa58b')
    request('no_project_proto_in_blog', 'https://nuwanda.space/proto/', 404)
    request('deny_git', 'https://nuwanda.space/.git/config', 403)
    request('deny_private_key', 'https://nuwanda.space/nuwanda.space.key', 403)
    request('deny_certificate_archive', 'https://nuwanda.space/27832570_nuwanda.space_nginx.zip', 403)
    RESULT.write_text(json.dumps({'date': '2026-10-14', 'timezone': 'Asia/Shanghai', 'checks': checks}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'All {len(checks)} public checks passed; result: {RESULT}')


if __name__ == '__main__':
    main()
