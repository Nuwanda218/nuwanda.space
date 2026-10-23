import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { root } from './local-env.mjs';

export function checkOutput() {
  const client = join(root, 'dist/client');
  const server = join(root, 'dist/server');
  assert.ok(existsSync(join(server, 'entry.mjs')), 'Missing Node production entrypoint');
  const home = readFileSync(join(client, 'index.html'), 'utf8');
  assert.match(home, /Nuwanda/);
  assert.match(home, /进入博客/);
  assert.match(home, /id="explore"/);
  assert.ok(!/<script\b/.test(home), 'Homepage must work without client JS');
  assert.equal((home.match(/<img\b/g) || []).length, 1, 'A single priority cover image');
  assert.match(home, /srcset=/);
  for (const page of ['about', 'life', 'notes', 'guard', 'timeline', 'environment/browser']) {
    const html = readFileSync(join(client, page, 'index.html'), 'utf8');
    assert.match(html, /href="\/"/);
    if (page === 'timeline') assert.match(html, /noindex/);
    if (['notes', 'guard'].includes(page)) {
      assert.equal(/noindex/.test(html), /class="demo-label"/.test(html), `${page}: index policy follows demo content`);
    }
  }
  const life = readFileSync(join(client, 'life', 'index.html'), 'utf8');
  assert.match(life, /class="life-feed"/, 'Life page must render the entry feed');
  assert.match(life, /class="life-entry"/, 'Life page must render at least one entry');
  assert.ok((life.match(/<img\b/g) || []).length >= 1, 'Life entries must render photos');
  assert.ok(!/name="robots"/.test(life), 'Life page has real content and must stay indexable');
  assert.match(readFileSync(join(client, 'environment/ssg/index.html'), 'utf8'), /SSG_SMOKE_OK/);
  assert.ok(!existsSync(join(client, 'environment/ssr/index.html')), 'SSR must not be prerendered');
  assert.ok(!existsSync(join(client, 'api/health')), 'API must not be a static file');
  assert.equal(readFileSync(join(client, 'local-mark.svg'), 'utf8'), readFileSync(join(root, 'public/local-mark.svg'), 'utf8'));
  const files = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path); else files.push(path);
    }
  }
  walk(client);
  assert.ok(files.some((file) => file.endsWith('.css')), 'Missing bundled CSS');
  assert.ok(files.some((file) => file.endsWith('.js')), 'Missing browser JavaScript');
  assert.ok(!files.some((file) => /(?:^|[\\/])(?:\.env[^\\/]*|node_modules|\.git)(?:$|[\\/])/.test(file)), 'Sensitive file in client output');
  console.log(`PASS production output: ${files.length} client files, SSG HTML + CSS + JS + SVG; SSR/API in dist/server.`);
  return files.map((file) => relative(client, file));
}
checkOutput();
