import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

const root = process.cwd();
const marker = `live-${randomUUID()}`;
const baseDirectory = resolve(root, 'materials');
const target = resolve(baseDirectory, 'notes', marker);
assert.ok(target.startsWith(baseDirectory + sep) && target.includes(marker));
const reservation = createServer().listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'dev', '--host', '127.0.0.1', '--port', String(port)], {
  cwd: root, windowsHide: true, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
child.stdout.on('data', data => { log = (log + data).slice(-30000); });
child.stderr.on('data', data => { log = (log + data).slice(-30000); });
child.on('error', error => { log += error.message; });
async function until(path, predicate, message) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Dev server exited: ${log}`);
    try {
      const response = await fetch(base + path, { signal: AbortSignal.timeout(10000) });
      if (response.ok && predicate(await response.text())) return;
    } catch { /* Bounded startup/content synchronization retry. */ }
    await delay(600);
  }
  throw new Error(message);
}
let created = false;
try {
  await until('/local-mark.svg', html => html.includes('<svg'), 'Dev server unavailable');
  await until('/notes/', html => html.includes('笔记目录'), 'Initial notes page unavailable');
  mkdirSync(target);
  created = true;
  writeFileSync(join(target, 'index.md'), `这是 ${marker} 的新正文。\n`);
  await until('/notes/', html => html.includes(marker), 'New folder did not appear without restarting');
  writeFileSync(join(target, '新增照片.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB9kAAAAASUVORK5CYII=', 'base64'));
  await until('/notes/', html => html.includes(`${marker}：新增照片`), 'New image did not appear without restarting');
  writeFileSync(join(target, 'index.md'), `---\ndraft: true\n---\n${marker}\n`);
  await until('/notes/', html => !html.includes(marker), 'Draft change did not hide entry');
  writeFileSync(join(target, 'index.md'), `保存后的 ${marker} 正文。\n`);
  await until('/notes/', html => html.includes(`保存后的 ${marker}`), 'Saved changes did not appear');
  rmSync(target, { recursive: true });
  created = false;
  await until('/notes/', html => !html.includes(marker), 'Deleted record did not leave page');
  writeFileSync(join(root, '.local/materials/live.json'), JSON.stringify({ status: 'PASS', newFolder: true, newImage: true, editedText: true, draftToggle: true, deletion: true, noServerRestart: true, fixturesRemoved: true }, null, 2));
  console.log('PASS live materials: new folder/image, text edit, draft toggle and removal; no server restart.');
} finally {
  if (created) rmSync(target, { recursive: true });
  child.kill();
  mkdirSync(join(root, '.local/materials'), { recursive: true });
  writeFileSync(join(root, '.local/materials/live.log'), log);
}
