// Upload only production output and the locked runtime dependency manifest.
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve, join, relative } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
assert.ok(existsSync(join(dist, 'server/entry.mjs')));
assert.match(readFileSync(join(dist, 'client/index.html'), 'utf8'), /Somewhere between/);
const release = `20261015-v01-${createHash('sha256').update(readFileSync(join(dist, 'client/index.html'))).digest('hex').slice(0, 10)}`;
const destination = join(root, '.local/homepage-v01', release);
assert.ok(!existsSync(destination), 'Existing package must not be overwritten. Reuse it or choose another version.');
mkdirSync(destination, { recursive: true });
cpSync(dist, join(destination, 'dist'), { recursive: true });
for (const name of ['package.json', 'package-lock.json']) cpSync(join(root, name), join(destination, name));
const hashes = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else hashes.push(`${createHash('sha256').update(readFileSync(path)).digest('hex')}  ${relative(destination, path).replaceAll('\\', '/')}`);
  }
}
walk(destination);
writeFileSync(join(destination, 'MANIFEST.sha256'), hashes.sort().join('\n') + '\n');
const archive = `${destination}.tar.gz`;
const packed = spawnSync('tar', ['-czf', archive, '-C', destination, 'dist', 'package.json', 'package-lock.json', 'MANIFEST.sha256'], { stdio: 'inherit', windowsHide: true });
assert.equal(packed.status, 0);
const sha256 = createHash('sha256').update(readFileSync(archive)).digest('hex');
const result = { release, archive, sha256, files: hashes.length, bytes: readFileSync(archive).length };
writeFileSync(join(root, '.local/homepage-v01/package.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
