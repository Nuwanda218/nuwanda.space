// Send exact LF bytes: PowerShell's text pipeline can append a standalone CR.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..');
const mode = process.argv[2];
assert.ok(['--check', '--publish', '--rollback', '--status'].includes(mode), 'Choose --check, --publish, --rollback or --status');
const pkg = JSON.parse(readFileSync(join(root, '.local/homepage-v01/package.json'), 'utf8').replace(/^\uFEFF/, ''));
assert.match(pkg.release, /^20261015-v01-[a-f0-9]{10}$/);
assert.match(pkg.sha256, /^[a-f0-9]{64}$/);
const shell = mode === '--status' ? `set -eu
nginx -t
test "$(readlink -f /srv/nuwanda-blog/current)" = "/srv/nuwanda-blog/releases/${pkg.release}"
systemctl is-active nginx nuwanda-space.service weihua-test.service
systemctl is-enabled nuwanda-space.service
sha256sum -c /srv/nuwanda-blog/backups/${pkg.release}/unrelated.sha256
sha256sum -c /srv/nuwanda-blog/backups/${pkg.release}/legacy.sha256
curl -fsS --max-time 10 https://nuwanda.space/ | cmp - /srv/nuwanda-blog/current/dist/client/index.html
ss -lnt 'sport = :4323'
echo PASS_DEPLOYED_STATE
` : readFileSync(join(root, 'deploy', mode === '--rollback' ? 'rollback-astro.sh' : 'prepare-and-publish-astro.sh'), 'utf8');
const args = ['-o', 'BatchMode=yes', '-o', 'ServerAliveInterval=15', 'weihua', mode === '--check' ? 'bash -n' : `bash -s -- ${pkg.release} ${pkg.sha256}`];
const result = spawnSync('ssh', args, { input: Buffer.from(shell.replaceAll('\r\n', '\n').trimEnd() + '\n'), stdio: ['pipe', 'inherit', 'inherit'], windowsHide: true });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
