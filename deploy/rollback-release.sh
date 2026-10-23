#!/usr/bin/env bash
# 回滚到某个已发布版本的上一个版本。通过 SSH stdin 执行。
set -Eeuo pipefail
release=${1:?release required}
[[ "$release" =~ ^[0-9]{8}-v[0-9]{2}-[a-f0-9]{10}$ ]]
base=/srv/nuwanda-blog
service=nuwanda-space.service
state="$base/releases/$release.previous"
[[ -f "$state" ]]
previous=$(cat "$state")
[[ -d "$previous" ]]
echo "rolling back $release -> $previous"
rm -f "$base/current.new"
ln -sfn "$previous" "$base/current.new"
mv -Tf "$base/current.new" "$base/current"
systemctl restart "$service"
for attempt in {1..15}; do
  if curl -fsS --max-time 5 https://nuwanda.space/ | cmp -s - "$previous/dist/client/index.html"; then
    echo "ROLLED BACK to $previous"
    exit 0
  fi
  sleep 1
done
echo 'ROLLBACK FAILED: previous release not verified' >&2
exit 1
