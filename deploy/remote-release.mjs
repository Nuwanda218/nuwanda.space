// 增量发布的 SSH 驱动：上传归档 + 通过 stdin 执行服务器脚本。
//
// 用 stdin 传脚本字节，避免 PowerShell 文本管道追加孤立 CR 的问题。
// 用法：
//   node deploy/package-release.mjs      # 本地打包，产出 .local/releases/latest.json
//   node deploy/remote-release.mjs --check     # 服务器端脚本语法检查
//   node deploy/remote-release.mjs --publish   # 上传并发布
//   node deploy/remote-release.mjs --status    # 核对线上已部署状态
//   node deploy/remote-release.mjs --rollback  # 回滚到上一版本
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const mode = process.argv[2];
assert.ok(['--check', '--publish', '--status', '--rollback'].includes(mode), '用法：node deploy/remote-release.mjs --check|--publish|--status|--rollback');

const statePath = join(root, '.local/releases/latest.json');
assert.ok(existsSync(statePath), '缺少 .local/releases/latest.json，请先执行 node deploy/package-release.mjs');
const pkg = JSON.parse(readFileSync(statePath, 'utf8').replace(/^\uFEFF/, ''));
assert.match(pkg.release, /^[0-9]{8}-v[0-9]{2}-[a-f0-9]{10}$/);
assert.match(pkg.sha256, /^[a-f0-9]{64}$/);

const sshArgs = ['-o', 'BatchMode=yes', '-o', 'ServerAliveInterval=15', 'weihua'];
const lf = (text) => text.replaceAll('\r\n', '\n').trimEnd() + '\n';

function ssh(remoteArgs, input) {
  const result = spawnSync('ssh', [...sshArgs, ...remoteArgs], {
    input: input === undefined ? '' : Buffer.from(lf(input)),
    stdio: ['pipe', 'inherit', 'inherit'],
    windowsHide: true,
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function scp(local, remote) {
  const result = spawnSync('scp', ['-o', 'BatchMode=yes', local, `weihua:${remote}`], { stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

const statusScript = `set -eu
nginx -t
systemctl is-active nginx nuwanda-space.service weihua-test.service
echo "current -> $(readlink -f /srv/nuwanda-blog/current)"
curl -fsS --max-time 10 https://nuwanda.space/ | cmp - /srv/nuwanda-blog/current/dist/client/index.html
curl -fsS --max-time 10 https://nuwanda.space/life/ | grep -q life-feed
ss -lnt 'sport = :4323'
echo PASS_DEPLOYED_STATE
`;

let code;
if (mode === '--status') {
  code = ssh([statusScript]);
} else if (mode === '--check') {
  const script = readFileSync(join(root, 'deploy', mode === '--check' ? 'publish-release.sh' : 'rollback-release.sh'), 'utf8');
  code = ssh(['bash -n'], script);
} else {
  const scriptName = mode === '--publish' ? 'publish-release.sh' : 'rollback-release.sh';
  const script = readFileSync(join(root, 'deploy', scriptName), 'utf8');
  if (mode === '--publish') {
    assert.ok(existsSync(pkg.archive), `缺少归档 ${pkg.archive}`);
    const incoming = `/srv/nuwanda-blog/incoming/${pkg.release}`;
    code = ssh([`mkdir -p '${incoming}'`]);
    if (code !== 0) process.exit(code);
    code = scp(pkg.archive, `${incoming}/release.tar.gz`);
    if (code !== 0) process.exit(code);
    console.log(`uploaded ${pkg.release} -> ${incoming}/release.tar.gz`);
  }
  code = ssh(['bash -s -- ' + pkg.release + ' ' + pkg.sha256], script);
}
process.exit(code ?? 1);
