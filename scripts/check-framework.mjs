import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const client = join(process.cwd(), 'dist/client');
const read = (route) => readFileSync(join(client, route, 'index.html'), 'utf8');
const home = read('');
assert.match(home, /进入博客/);
assert.match(home, /class="hero-cover"/);
assert.match(home, /fetchpriority="high"/);
for (const route of ['life', 'notes', 'guard']) {
  assert.match(home, new RegExp(`href="/${route}/"`));
  const html = read(route);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${route}: one primary heading`);
  assert.equal((html.match(/aria-current="page"/g) || []).length, 1, `${route}: one active module`);
  assert.match(html, new RegExp(`href="/${route}/" aria-current="page"`));
  assert.match(html, new RegExp(`rel="canonical" href="https://nuwanda.space/${route}/"`));
  assert.match(html, /name="description"/);
  assert.ok(!/<script\b/.test(html), `${route} must work without JavaScript`);
  for (const [, src, alt] of html.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/g)) {
    assert.ok(alt.trim(), `${route}: meaningful alternative text`);
    assert.ok(existsSync(join(client, src)), `${route}: real image ${src}`);
  }
}
assert.match(read('notes'), /<details/);
// Demo badges are supplied by material metadata, not forced onto real content.
for (const route of ['notes', 'guard']) {
  const html = read(route);
  assert.equal(/noindex/.test(html), /class="demo-label"/.test(html));
}
assert.match(read('guard'), /<ol class="event-timeline"/);
assert.match(read('timeline'), /href="\/guard\/"/);
console.log('PASS framework: static routes, module navigation, metadata, local images, sample labels, native interaction, legacy entry.');
