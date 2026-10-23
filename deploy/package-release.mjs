// 打包一个新的生产版本：dist + 锁文件 + MANIFEST.sha256。
//
// 与 package-astro.mjs（首次静态站迁移专用、不可重跑）不同，本脚本用于日常增量更新：
//   - 版本号 = 日期 + dist 内容哈希，内容不变则版本不变，可安全重跑；
//   - 产物落在 .local/releases/（本地，永不上传）；
//   - 只打包 dist、package.json、package-lock.json、MANIFEST.sha256。
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve, join, relative } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
assert.ok(existsSync(join(dist, 'server/entry.mjs')), '缺少 dist/server/entry.mjs，请先执行 npm run build');
assert.ok(existsSync(join(dist, 'client/index.html')), '缺少 dist/client/index.html，请先执行 npm run build');

const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

// 内容哈希：遍历 dist 全部文件，排序后取前 10 位。
const distHashes = [];
(function walkDist(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkDist(path);
    else distHashes.push(`${sha(path)}  ${relative(dist, path).replaceAll('\\', '/')}`);
  }
})(dist);
distHashes.sort();
const contentHash = createHash('sha256').update(distHashes.join('\n')).digest('hex').slice(0, 10);

const now = new Date();
const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
const release = `${stamp}-v02-${contentHash}`;
const outRoot = join(root, '.local/releases');
const destination = join(outRoot, release);
const archive = `${destination}.tar.gz`;
const statePath = join(outRoot, 'latest.json');

function report(reused) {
  const result = {
    release,
    archive,
    sha256: sha(archive),
    files: distHashes.length,
    bytes: readFileSync(archive).length,
    reused,
  };
  mkdirSync(outRoot, { recursive: true });
  writeFileSync(statePath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

if (existsSync(archive)) {
  report(true);
  process.exit(0);
}

mkdirSync(destination, { recursive: true });
cpSync(dist, join(destination, 'dist'), { recursive: true });
for (const name of ['package.json', 'package-lock.json']) cpSync(join(root, name), join(destination, name));

// MANIFEST 覆盖版本目录内除自身以外的全部文件，路径相对版本目录根。
const manifest = [];
(function walkOut(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkOut(path);
    else manifest.push(`${sha(path)}  ${relative(destination, path).replaceAll('\\', '/')}`);
  }
})(destination);
writeFileSync(join(destination, 'MANIFEST.sha256'), manifest.sort().join('\n') + '\n');

const packed = spawnSync(
  'tar',
  ['-czf', archive, '-C', destination, 'dist', 'package.json', 'package-lock.json', 'MANIFEST.sha256'],
  { stdio: 'inherit', windowsHide: true },
);
assert.equal(packed.status, 0, 'tar 打包失败');
report(false);
