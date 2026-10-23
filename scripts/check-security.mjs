import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root, loadLocalEnv } from './local-env.mjs';

function git(...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, `git ${args[0]} failed`);
  return result.stdout;
}
const env = loadLocalEnv();
const samples = ['.env.local', '.env.production', '.local/pgdata/test', 'node_modules/test', 'dist/test', '.astro/test', 'pgdata/test', 'debug.log', 'private.key'];
for (const sample of samples) assert.ok(git('check-ignore', '--', sample).trim(), `${sample} must be ignored`);
assert.equal(spawnSync('git', ['check-ignore', '--', '.env.example'], { cwd: root, windowsHide: true, stdio: 'ignore' }).status, 1, '.env.example must be shareable');
const tracked = git('ls-files', '-z').split('\0').filter(Boolean);
assert.ok(!tracked.some((path) => /(^|\/)(\.env(?:\..+)?|node_modules|pgdata|\.local)(\/|$)/.test(path) && !path.endsWith('.env.example')), 'Sensitive path already tracked');
// Include staged files, working tree modifications and new source files. Do not print matching secret content.
const candidates = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean);
let scanned = 0;
for (const path of candidates) {
  if (!/\.(?:mjs|cjs|js|ts|astro|json|ya?ml|md|ps1|sh|html|css|example)$/.test(path) && path !== '.npmrc') continue;
  let contents;
  try { contents = readFileSync(join(root, path), 'utf8'); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  for (const key of ['DB_PASSWORD', 'POSTGRES_ADMIN_PASSWORD', 'SESSION_SECRET']) assert.ok(!contents.includes(env[key]), `Local secret leaked into ${path}`);
  assert.ok(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(contents), `Private key in ${path}`);
  assert.ok(!/\bLTAI[A-Za-z0-9]{12,}\b/.test(contents), `Possible OSS AccessKey in ${path}`);
  scanned++;
}
function scanBuild(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) scanBuild(path);
    else {
      const contents = readFileSync(path).toString('utf8');
      for (const key of ['DB_PASSWORD', 'POSTGRES_ADMIN_PASSWORD', 'SESSION_SECRET']) assert.ok(!contents.includes(env[key]), 'Local secret found in build output');
    }
  }
}
scanBuild(join(root, 'dist'));
console.log(`PASS Git ignores, tracked sensitive paths, ${scanned} source files and production output secret scan. Scope: current working tree, not full Git history.`);
console.log(git('status', '--short'));
