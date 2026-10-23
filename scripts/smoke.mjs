import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { join } from 'node:path';
import { root } from './local-env.mjs';

const development = process.argv.includes('--dev');
const reservation = createServer();
reservation.listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const base = `http://127.0.0.1:${port}`;
const args = development
  ? [join(root, 'node_modules/astro/bin/astro.mjs'), 'dev', '--host', '127.0.0.1', '--port', String(port)]
  : [join(root, 'scripts/serve.mjs')];
const child = spawn(process.execPath, args, {
  cwd: root, env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), ASTRO_TELEMETRY_DISABLED: '1' },
  stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
});
let log = '';
child.stdout.on('data', (data) => { log = (log + data).slice(-10000); });
child.stderr.on('data', (data) => { log = (log + data).slice(-10000); });
child.on('error', (error) => { log += error.message; });
async function get(path, expectedType) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(development ? 30000 : 5000) });
  assert.equal(response.status, 200, path);
  assert.ok(response.headers.get('content-type')?.includes(expectedType), `${path}: expected ${expectedType}, got ${response.headers.get('content-type')}`);
  return response;
}
try {
  let ready = false;
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited ${child.exitCode}: ${log}`);
    try {
      // Probe a static file first: repeatedly aborting the first SSR compilation
      // during Vite's cold optimization can prevent the dev server becoming ready.
      const response = await fetch(base + '/local-mark.svg', { signal: AbortSignal.timeout(2000) });
      if (response.ok) { ready = true; break; }
    } catch { /* Server is still starting; bounded retry. */ }
    await delay(300);
  }
  assert.ok(ready, `Server startup timed out: ${log}`);
  const home = await (await get('/', 'text/html')).text();
  assert.match(home, /Nuwanda/);
  assert.match(home, /进入博客/);
  assert.match(home, /id="explore"/);
  for (const page of ['about', 'life', 'notes', 'guard', 'timeline']) {
    const html = await (await get(`/${page}/`, 'text/html')).text();
    assert.match(html, /href="\/"/);
    assert.match(html, /rel="canonical"/);
  }
  assert.match(await (await get('/environment/browser/', 'text/html')).text(), /verify-browser/);
  await get('/favicon.svg', 'image/svg+xml');
  assert.match(await (await get('/sitemap.xml', 'xml')).text(), /https:\/\/nuwanda.space\//);
  const images = [...home.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)];
  assert.equal(images.length, 1);
  for (const [, path] of images) {
    const photo = await get(path, 'image/');
    assert.ok((await photo.arrayBuffer()).byteLength > 1000, 'Image is empty');
  }
  assert.match(await (await get('/environment/ssg/', 'text/html')).text(), /SSG_SMOKE_OK/);
  const dynamic = await get('/environment/ssr/', 'text/html');
  assert.equal(dynamic.headers.get('cache-control'), 'no-store');
  const first = await dynamic.text();
  const second = await (await get('/environment/ssr/', 'text/html')).text();
  assert.match(first, /SSR_SMOKE_OK/);
  const requestId = (html) => html.match(/id="request-id"[^>]*>([^<]+)</)?.[1];
  assert.ok(requestId(first));
  assert.notEqual(requestId(first), requestId(second), 'SSR must change per request');
  const apiResponse = await get('/api/health', 'application/json');
  assert.equal(apiResponse.headers.get('cache-control'), 'no-store');
  const api = await apiResponse.json();
  assert.deepEqual(Object.keys(api).sort(), ['mode', 'requestId', 'status']);
  assert.equal(api.status, 'ok');
  assert.equal(api.mode, 'server');
  assert.notEqual(api.requestId, (await (await get('/api/health', 'application/json')).json()).requestId);
  assert.equal(await (await get('/local-mark.svg', 'image/svg+xml')).text(), readFileSync(join(root, 'public/local-mark.svg'), 'utf8'));
  assert.equal((await fetch(base + '/does-not-exist')).status, 404);
  for (const sensitive of ['/.env.local', '/.git/config', '/compose.yaml', '/package.json', '/.local/baseline/files.json', '/docs/storage.md', '/deploy/deploy-site.ps1', '/27832570_nuwanda.space_nginx.zip']) {
    const response = await fetch(base + sensitive);
    assert.ok([403, 404].includes(response.status), `Sensitive path exposed: ${sensitive} (${response.status})`);
  }
  for (const match of home.matchAll(/(?:src|href)="([^"?#]+\.(?:css|js))"/g)) {
    if (!match[1].startsWith('/')) continue;
    // Vite serves CSS module imports as JS; ?direct requests the stylesheet itself.
    const path = development && match[1].endsWith('.css') ? match[1] + '?direct' : match[1];
    const resource = await get(path, match[1].endsWith('.css') ? 'text/css' : 'javascript');
    assert.ok((await resource.text()).length > 0);
  }
  if (!development) {
    assert.equal(home, readFileSync(join(root, 'dist/client/index.html'), 'utf8'), 'Production must serve the built SSG HTML');
    assert.ok([...home.matchAll(/href="([^"?#]+\.css)"/g)].length >= 1, 'Production CSS missing');
    assert.ok(!/<script\b/.test(home), 'Homepage must not need JavaScript');
  }
  console.log(`PASS ${development ? 'development' : 'built production'} HTTP: SSG, per-request SSR/API, SVG/CSS/JS, 404 and sensitive paths (${base}).`);
} catch (error) {
  console.error(error);
  console.error(log);
  process.exitCode = 1;
} finally {
  if (child.exitCode === null) {
    const exited = once(child, 'exit');
    child.kill();
    await Promise.race([exited, delay(5000)]);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
      await Promise.race([exited, delay(2000)]);
    }
  }
}
