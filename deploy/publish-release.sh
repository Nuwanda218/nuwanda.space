#!/usr/bin/env bash
# 增量发布一个新版本。通过 SSH stdin 执行，永不作为站点内容上传。
#
# 与 prepare-and-publish-astro.sh（首次静态站迁移专用）不同，本脚本可重复运行：
#   - 不修改 Nginx 配置，不 reload nginx（同机还有 weihua.art）；
#   - 新版本目录 + 原子切换 current 符号链接 + 重启 nuwanda-space 服务；
#   - 依赖锁文件未变时复用上一版本 node_modules，免联网安装；
#   - 任一步失败即回切上一版本并重启服务。
set -Eeuo pipefail

release=${1:?release required}
expected=${2:?archive SHA256 required}
[[ "$release" =~ ^[0-9]{8}-v[0-9]{2}-[a-f0-9]{10}$ ]]
[[ "$expected" =~ ^[a-f0-9]{64}$ ]]

base=/srv/nuwanda-blog
incoming="$base/incoming/$release"
target="$base/releases/$release"
runtime="$base/runtime"
node="$runtime/node-v24.22.0-linux-x64/bin/node"
service=nuwanda-space.service

[[ -f "$incoming/release.tar.gz" ]]
echo "$expected  $incoming/release.tar.gz" | sha256sum -c -

# 只允许 dist/ 与锁文件进入生产版本目录。
tar -tzf "$incoming/release.tar.gz" | awk '
  /^dist\// || /^package(-lock)?\.json$/ || /^MANIFEST\.sha256$/ { if ($0 ~ /(^|\/)\.\.(\/|$)/) exit 1; next }
  { exit 1 }'

previous=$(readlink -f "$base/current")
[[ -n "$previous" && -d "$previous" ]]
echo "previous release: $previous"

if [[ -e "$target" ]]; then
  echo "target already exists: $target" >&2
  exit 1
fi

mkdir -p "$target"
tar -xzf "$incoming/release.tar.gz" -C "$target" --no-same-owner
(cd "$target" && sha256sum -c MANIFEST.sha256 > /dev/null)
echo 'PASS archive and every packaged file SHA256'

if [[ -f "$previous/node_modules/.package-lock.json" ]] && cmp -s "$target/package-lock.json" "$previous/package-lock.json"; then
  cp -a "$previous/node_modules" "$target/node_modules"
  echo 'PASS reused node_modules from previous release (lockfile unchanged)'
else
  export PATH="$runtime/node-v24.22.0-linux-x64/bin:$PATH"
  export ASTRO_TELEMETRY_DISABLED=1
  (cd "$target" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org/ --cache="$runtime/npm-cache")
  echo 'PASS npm ci (lockfile changed)'
fi

chown -R root:root "$target"
chmod -R u=rwX,go=rX "$target"
echo "$previous" > "$base/releases/$release.previous"

switched=0
rollback() {
  code=$?
  trap - ERR
  if [[ "$switched" = 1 ]]; then
    echo "ROLLBACK: restoring $previous" >&2
    rm -f "$base/current.new"
    ln -sfn "$previous" "$base/current.new"
    mv -Tf "$base/current.new" "$base/current"
    systemctl restart "$service" || true
    for attempt in {1..15}; do
      if curl -fsS --max-time 5 https://nuwanda.space/ | cmp -s - "$previous/dist/client/index.html"; then
        echo 'ROLLBACK OK: previous release serving' >&2
        exit "$code"
      fi
      sleep 1
    done
    echo 'ROLLBACK FAILED: previous release not verified' >&2
  fi
  exit "$code"
}
trap rollback ERR

rm -f "$base/current.new"
ln -sfn "$target" "$base/current.new"
mv -Tf "$base/current.new" "$base/current"
switched=1
systemctl restart "$service"

for attempt in {1..20}; do
  if curl -fsS --max-time 2 http://127.0.0.1:4323/api/health > /dev/null; then break; fi
  sleep 1
done
curl -fsS --max-time 5 http://127.0.0.1:4323/ | cmp - "$target/dist/client/index.html"
for route in about life notes timeline environment/ssg environment/ssr environment/browser; do
  curl -fsS --max-time 5 "http://127.0.0.1:4323/$route/" > /dev/null
done
curl -fsS --max-time 5 http://127.0.0.1:4323/life/ | grep -q 'life-feed'
echo 'PASS standalone loopback: homepage, all routes, life feed, SSR/API'

ready=0
for attempt in {1..15}; do
  if curl -fsS --max-time 5 https://nuwanda.space/ | cmp -s - "$target/dist/client/index.html"; then ready=1; break; fi
  sleep 1
done
[[ "$ready" = 1 ]]
curl -fsS --max-time 10 https://nuwanda.space/life/ | grep -q 'life-feed'
for route in about notes timeline; do
  curl -fsS --max-time 10 "https://nuwanda.space/$route/" > /dev/null
done
echo 'PASS public HTTPS: homepage hash, life feed, all sections'

systemctl is-active nginx "$service"
# 同机 weihua.art 必须完全不受影响。
[[ "$(curl -fsS https://weihua.art/ | sha256sum | cut -d ' ' -f1)" = 8740ba953739a872c64cbc440a702999313e090071e763221e023c9d74bebe5f ]]
[[ "$(curl -fsS https://weihua.art/proto/ | sha256sum | cut -d ' ' -f1)" = d9a09a46a82590533477503bd4b3a28fadbd739656f740b12564d1cb383aa58b ]]
echo 'PASS neighbor site weihua.art unchanged'

trap - ERR
echo "PUBLISHED $release; previous release retained at $previous"
