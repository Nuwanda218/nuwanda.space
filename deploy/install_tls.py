"""First-time TLS installation. Sends an explicit file allowlist over SSH.

No certificate or private-key bytes are printed or placed in the web root.
Existing sites are left untouched. Re-running against an installed site aborts.
"""
import argparse
import io
from pathlib import Path
import subprocess
import tarfile
import zipfile


REMOTE_SCRIPT = r"""set -euo pipefail
stage="$1"
resume="$2"
backup="$stage/backup"
test ! -e /etc/nginx/sites-available/nuwanda.space
test ! -e /etc/nginx/sites-enabled/nuwanda.space
if [ "$resume" = 1 ]; then
    # Resume only the exact files retained by this installation's rollback.
    cmp -s "$stage/nuwanda.space.pem" /etc/ssl/nuwanda.space/nuwanda.space.pem
    cmp -s "$stage/nuwanda.space.key" /etc/ssl/nuwanda.space/nuwanda.space.key
    cmp -s "$stage/index.html" /srv/nuwanda-blog/web/index.html
    test -f "$backup/weihua.sha256"
    sha256sum -c "$backup/weihua.sha256"
else
    test ! -e /etc/ssl/nuwanda.space
    test ! -e /srv/nuwanda-blog
fi
test ! -e /etc/systemd/system/nuwanda-cert-check.service
test ! -e /etc/systemd/system/nuwanda-cert-check.timer
nginx -t
openssl x509 -in "$stage/nuwanda.space.pem" -noout -checkhost nuwanda.space
openssl x509 -in "$stage/nuwanda.space.pem" -noout -checkend 2592000
openssl pkey -in "$stage/nuwanda.space.key" -check -noout
certpub=$(openssl x509 -in "$stage/nuwanda.space.pem" -pubkey -noout | sha256sum | cut -d' ' -f1)
keypub=$(openssl pkey -in "$stage/nuwanda.space.key" -pubout | sha256sum | cut -d' ' -f1)
test "$certpub" = "$keypub"
install -d -m 700 "$backup"
if [ "$resume" = 0 ]; then
    cp -a /etc/nginx "$backup/nginx"
    sha256sum /etc/nginx/sites-available/weihua.art /srv/weihua/index.html /srv/weihua/proto/index.html > "$backup/weihua.sha256"
fi

rollback() {
    status=$?
    trap - EXIT
    if [ "$status" -ne 0 ]; then
        echo 'Installation failed; restoring previous Nginx routing.' >&2
        systemctl disable --now nuwanda-cert-check.timer >/dev/null 2>&1 || true
        for target in /etc/nginx/sites-enabled/nuwanda.space /etc/nginx/sites-available/nuwanda.space /etc/systemd/system/nuwanda-cert-check.service /etc/systemd/system/nuwanda-cert-check.timer; do
            if [ -e "$target" ] || [ -L "$target" ]; then
                safe_name=$(echo "$target" | tr '/' '_')
                mv "$target" "$backup/$safe_name.$(date +%s)"
            fi
        done
        systemctl daemon-reload
        if nginx -t; then systemctl reload nginx; fi
        echo "New certificate and page retained outside enabled routing; backup: $backup" >&2
    fi
    exit "$status"
}
trap rollback EXIT

install -d -m 700 /etc/ssl/nuwanda.space
install -m 600 "$stage/nuwanda.space.pem" /etc/ssl/nuwanda.space/nuwanda.space.pem
install -m 600 "$stage/nuwanda.space.key" /etc/ssl/nuwanda.space/nuwanda.space.key
install -d -m 755 /srv/nuwanda-blog /srv/nuwanda-blog/web
install -m 644 "$stage/index.html" /srv/nuwanda-blog/web/index.html
install -m 644 "$stage/nuwanda.space.conf" /etc/nginx/sites-available/nuwanda.space
ln -s /etc/nginx/sites-available/nuwanda.space /etc/nginx/sites-enabled/nuwanda.space
nginx -t
systemctl reload nginx
# Reload signals the master; wait for the new workers to actually serve TLS.
ready=0
for attempt in $(seq 1 20); do
    if curl --noproxy '*' --resolve nuwanda.space:443:127.0.0.1 --fail --silent --show-error --max-time 3 https://nuwanda.space/ -o /dev/null 2>"$stage/readiness-error.txt"; then
        ready=1
        echo "HTTPS_READY attempt=$attempt"
        break
    fi
    sleep 0.25
done
if [ "$ready" -ne 1 ]; then cat "$stage/readiness-error.txt" >&2; exit 1; fi
curl --noproxy '*' --resolve weihua.art:443:127.0.0.1 --fail --silent --show-error --max-time 10 https://weihua.art/ -o /dev/null
sha256sum -c "$backup/weihua.sha256"
install -m 644 "$stage/nuwanda-cert-check.service" /etc/systemd/system/nuwanda-cert-check.service
install -m 644 "$stage/nuwanda-cert-check.timer" /etc/systemd/system/nuwanda-cert-check.timer
systemctl daemon-reload
systemctl start nuwanda-cert-check.service
systemctl enable --now nuwanda-cert-check.timer
systemctl is-active nginx weihua-test.service nuwanda-cert-check.timer
systemctl is-enabled nuwanda-cert-check.timer
echo "TLS_INSTALL_OK backup=$backup"
"""


def run_ssh(ssh, command, content=None):
    subprocess.run(
        [ssh, '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=12', 'weihua', command],
        input=content, check=True, timeout=90,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--certificate-zip', required=True, type=Path)
    parser.add_argument('--deploy', action='store_true')
    parser.add_argument('--resume', action='store_true', help='Resume this exact installation after automatic rollback')
    args = parser.parse_args()
    deploy = Path(__file__).resolve().parent
    files = {
        'nuwanda.space.conf': (deploy / 'nginx/nuwanda.space.conf').read_bytes(),
        'index.html': (deploy / 'site-ready/index.html').read_bytes(),
        'nuwanda-cert-check.service': (deploy / 'systemd/nuwanda-cert-check.service').read_bytes(),
        'nuwanda-cert-check.timer': (deploy / 'systemd/nuwanda-cert-check.timer').read_bytes(),
    }
    with zipfile.ZipFile(args.certificate_zip) as archive:
        assert archive.testzip() is None, 'Certificate archive CRC failed'
        assert set(archive.namelist()) == {'nuwanda.space.pem', 'nuwanda.space.key'}
        for name in archive.namelist():
            files[name] = archive.read(name)
    assert all(files.values()), 'Empty deployment file'
    assert 'HTTPS'.encode() in files['index.html']
    assert b'PRIVATE KEY' not in files['index.html']
    print('Preflight: CRC, explicit file list and nonempty files passed.', flush=True)
    if not args.deploy:
        print('No server changes. Add --deploy to install.')
        return
    ssh = r'C:\Windows\System32\OpenSSH\ssh.exe'
    stage = '/root/nuwanda-backup/20261014-ssl'
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode='w') as archive:
        for name, data in files.items():
            info = tarfile.TarInfo(name)
            info.size = len(data)
            info.mode = 0o600
            archive.addfile(info, io.BytesIO(data))
    # Fixed destination and filenames; no user content enters shell commands.
    run_ssh(ssh, f'set -eu; umask 077; mkdir -p {stage}; chmod 700 {stage}; tar -xf - -C {stage}', buffer.getvalue())
    run_ssh(ssh, f'bash -s -- {stage} {int(args.resume)}', REMOTE_SCRIPT.encode('utf-8'))


if __name__ == '__main__':
    main()
