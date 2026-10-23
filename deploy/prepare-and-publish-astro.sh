#!/usr/bin/env bash
# Executed over SSH stdin, never uploaded as site content. First static-to-Node migration only.
set -Eeuo pipefail
release=${1:?release required}
expected=${2:?archive SHA256 required}
[[ "$release" =~ ^20261015-v01-[a-f0-9]{10}$ && "$expected" =~ ^[a-f0-9]{64}$ ]]
base=/srv/nuwanda-blog
incoming="$base/incoming/$release"
target="$base/releases/$release"
backup="$base/backups/$release"
runtime="$base/runtime"
node="$runtime/node-v24.22.0-linux-x64/bin/node"
[[ ! -e "$base/current" && ! -e /etc/systemd/system/nuwanda-space.service ]]
[[ -f "$base/web/index.html" && -f "$incoming/release.tar.gz" ]]
echo "$expected  $incoming/release.tar.gz" | sha256sum -c -
# Only the packaging script's exact allowlist may enter the production release.
tar -tzf "$incoming/release.tar.gz" | awk '
  /^dist\// || /^package(-lock)?\.json$/ || /^MANIFEST\.sha256$/ { if ($0 ~ /(^|\/)\.\.(\/|$)/) exit 1; next }
  { exit 1 }'
mkdir -p "$target" "$backup" "$runtime"
chmod 700 "$backup"
if [[ -e "$backup/nginx.conf" ]]; then
  # Allow only preparation retries, while the original production state is intact.
  cmp "$backup/nginx.conf" /etc/nginx/sites-available/nuwanda.space
  sha256sum -c "$backup/unrelated.sha256"
  sha256sum -c "$backup/legacy.sha256"
else
  cp -a /etc/nginx/sites-available/nuwanda.space "$backup/nginx.conf"
  sha256sum /etc/nginx/sites-available/weihua.art /etc/nginx/sites-available/default > "$backup/unrelated.sha256"
  sha256sum "$base/web/index.html" > "$backup/legacy.sha256"
fi
tar -xzf "$incoming/release.tar.gz" -C "$target" --no-same-owner
(cd "$target" && sha256sum -c MANIFEST.sha256 > /dev/null)
echo 'PASS archive and every packaged file SHA256'
if [[ ! -x "$node" ]]; then
  if ! echo "cc2f601cee82d9a5a233302fe307abc600727035fd7d2c3a3571755989e95008  $runtime/node-v24.22.0-linux-x64.tar.xz" | sha256sum -c - 2>/dev/null; then
    curl --fail --silent --show-error --location --max-time 180 https://nodejs.org/dist/v24.22.0/node-v24.22.0-linux-x64.tar.xz -o "$runtime/node-v24.22.0-linux-x64.tar.xz"
  fi
  echo "cc2f601cee82d9a5a233302fe307abc600727035fd7d2c3a3571755989e95008  $runtime/node-v24.22.0-linux-x64.tar.xz" | sha256sum -c -
  tar -xJf "$runtime/node-v24.22.0-linux-x64.tar.xz" -C "$runtime" --no-same-owner
fi
"$node" --version
export PATH="$runtime/node-v24.22.0-linux-x64/bin:$PATH"
export ASTRO_TELEMETRY_DISABLED=1
(cd "$target" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org/ --cache="$runtime/npm-cache")
getent passwd nuwanda-web > /dev/null || useradd --system --create-home --home-dir /var/lib/nuwanda-space --shell /usr/sbin/nologin nuwanda-web
chown -R root:root "$target"
chmod -R u=rwX,go=rX "$target"
ln -s "$target" "$base/current"
install -m 644 "$incoming/nuwanda-space.service" /etc/systemd/system/nuwanda-space.service
switched=0
rollback() {
  code=$?
  trap - ERR
  if [[ "$switched" = 1 ]]; then
    if ! install -m 644 "$backup/nginx.conf" /etc/nginx/sites-available/nuwanda.space; then
      echo 'ROLLBACK FAILED: could not restore configuration; Node retained' >&2
      exit "$code"
    fi
    if ! nginx -t || ! systemctl reload nginx; then
      echo 'ROLLBACK FAILED: configuration not reloaded; Node retained for existing workers' >&2
      exit "$code"
    fi
    restored=0
    for attempt in {1..15}; do
      if curl -fsS --max-time 5 https://nuwanda.space/ | cmp - "$base/web/index.html"; then restored=1; break; fi
      sleep 1
    done
    if [[ "$restored" != 1 ]]; then
      echo 'ROLLBACK FAILED: previous static site not verified; Node retained' >&2
      exit "$code"
    fi
  fi
  if ! systemctl disable --now nuwanda-space.service; then
    echo 'ROLLBACK: public configuration restored or unchanged, but Node could not be stopped' >&2
    exit "$code"
  fi
  echo "FAILED, public configuration unchanged or previous static site verified restored; exit=$code" >&2
  exit "$code"
}
trap rollback ERR
systemctl daemon-reload
systemctl start nuwanda-space.service
for attempt in {1..20}; do
  if curl -fsS --max-time 2 http://127.0.0.1:4323/api/health > /dev/null; then break; fi
  sleep 1
done
curl -fsS --max-time 5 http://127.0.0.1:4323/ | cmp - "$target/dist/client/index.html"
for route in about life notes timeline environment/ssg environment/ssr environment/browser; do
  curl -fsS --max-time 5 "http://127.0.0.1:4323/$route/" > /dev/null
done
first=$(curl -fsS http://127.0.0.1:4323/api/health)
second=$(curl -fsS http://127.0.0.1:4323/api/health)
[[ "$first" != "$second" && "$first" == *'"status":"ok"'* ]]
first=$(curl -fsS http://127.0.0.1:4323/environment/ssr/)
second=$(curl -fsS http://127.0.0.1:4323/environment/ssr/)
[[ "$first" != "$second" && "$first" == *'SSR_SMOKE_OK'* ]]
echo 'PASS standalone loopback: built homepage, all routes, dynamic SSR/API'
switched=1
install -m 644 "$incoming/nuwanda-astro.conf" /etc/nginx/sites-available/nuwanda.space
nginx -t
systemctl reload nginx
ready=0
for attempt in {1..15}; do
  if curl -fsS --max-time 5 https://nuwanda.space/ | cmp - "$target/dist/client/index.html"; then ready=1; break; fi
  sleep 1
done
[[ "$ready" = 1 ]]
for route in about life notes timeline environment/ssg environment/ssr environment/browser; do
  curl -fsS --max-time 10 "https://nuwanda.space/$route/" > /dev/null
done
first=$(curl -fsS https://nuwanda.space/api/health)
second=$(curl -fsS https://nuwanda.space/api/health)
[[ "$first" != "$second" && "$first" == *'"status":"ok"'* ]]
sha256sum -c "$backup/unrelated.sha256"
sha256sum -c "$backup/legacy.sha256"
[[ "$(curl -fsS https://weihua.art/ | sha256sum | cut -d ' ' -f1)" = 8740ba953739a872c64cbc440a702999313e090071e763221e023c9d74bebe5f ]]
[[ "$(curl -fsS https://weihua.art/proto/ | sha256sum | cut -d ' ' -f1)" = d9a09a46a82590533477503bd4b3a28fadbd739656f740b12564d1cb383aa58b ]]
systemctl enable nuwanda-space.service
systemctl is-active nginx nuwanda-space.service weihua-test.service
ss -lnt 'sport = :4323'
trap - ERR
echo "PUBLISHED $release; previous static site retained at $base/web; config backup $backup/nginx.conf"
