#!/usr/bin/env bash
# First static-to-Node migration rollback. Supply the release ID from package.json.
set -euo pipefail
release=${1:?release required}
[[ "$release" =~ ^20261015-v01-[a-f0-9]{10}$ ]]
backup="/srv/nuwanda-blog/backups/$release"
test -f "$backup/nginx.conf"
sha256sum -c "$backup/legacy.sha256"
install -m 644 "$backup/nginx.conf" /etc/nginx/sites-available/nuwanda.space
nginx -t
systemctl reload nginx
restored=0
for attempt in {1..15}; do
  if curl -fsS --max-time 5 https://nuwanda.space/ | cmp - /srv/nuwanda-blog/web/index.html; then restored=1; break; fi
  sleep 1
done
[[ "$restored" = 1 ]] || { echo 'ROLLBACK FAILED: static site not verified; Node retained' >&2; exit 1; }
systemctl disable --now nuwanda-space.service
sha256sum -c "$backup/unrelated.sha256"
curl -fsS --max-time 10 https://nuwanda.space/ | cmp - /srv/nuwanda-blog/web/index.html
echo 'ROLLED BACK to retained static homepage'
