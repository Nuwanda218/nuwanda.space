import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const materials = resolve(root, 'materials');
const logDirectory = resolve(root, '.local/materials');
mkdirSync(logDirectory, { recursive: true });
const token = `verify-${randomUUID()}`;
const created = [];
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB9kAAAAASUVORK5CYII=', 'base64');
function snapshot(directory) {
  const result = {};
  function walk(path) {
    for (const file of readdirSync(path, { withFileTypes: true })) {
      const full = join(path, file.name);
      if (file.isDirectory()) walk(full);
      else result[relative(directory, full)] = createHash('sha256').update(readFileSync(full)).digest('hex');
    }
  }
  walk(directory);
  return result;
}
const before = snapshot(materials);
const adapterBefore = snapshot(resolve(root, 'src/data'));
function build(label) {
  const result = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], {
    cwd: root, encoding: 'utf8', windowsHide: true,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, maxBuffer: 5 * 1024 * 1024,
  });
  writeFileSync(join(logDirectory, `${label}.log`), (result.stdout || '') + (result.stderr || ''));
  assert.equal(result.status, 0, `${label} build failed; inspect .local/materials/${label}.log`);
}
function add(module, folder, text, withPhoto = true) {
  const target = resolve(materials, module, folder);
  // Only fresh directories from this invocation may be created or removed.
  assert.ok(target.startsWith(materials + sep) && target.includes(token));
  mkdirSync(target); // Fails if already present.
  created.push(target);
  writeFileSync(join(target, 'index.md'), text);
  if (withPhoto) writeFileSync(join(target, '自动发现的照片.png'), pixel);
}
let failure;
try {
  for (const module of ['life', 'notes', 'guard']) {
    add(module, `2026-10-18-${token}-${module}`, `---\nsummary: 素材自动接入验收\n---\n${token}-${module} 正文，不需要修改页面。\n\n**Markdown 加粗验证**\n`);
  }
  add('notes', `${token}-draft`, `---\ndraft: true\n---\n${token}-PRIVATE-DRAFT\n`, false);
  build('roundtrip-injected');
  for (const module of ['life', 'notes', 'guard']) {
    const html = readFileSync(join(root, 'dist/client', module, 'index.html'), 'utf8');
    assert.ok(html.includes(`${token}-${module}`), `${module}: folder-only additions must appear`);
    assert.ok(html.includes('<strong>Markdown 加粗验证</strong>'), `${module}: Markdown rendering`);
    const article = html.match(new RegExp(`<article[^>]*id="[^"]*${token}-${module}"[^>]*>([\\s\\S]*?)</article>`))?.[1];
    assert.ok(article, `${module}: automatic entry discovery`);
    assert.match(article, /<img\b/, `${module}: automatic photo discovery`);
    assert.ok(!article.includes('demo-label'), `${module}: real material must not be labelled demo`);
    assert.ok(!html.includes(`${token}-PRIVATE-DRAFT`), 'Draft text must never reach public HTML');
  }
  assert.deepEqual(snapshot(resolve(root, 'src/data')), adapterBefore, 'No registry or presentation adapter edits needed');
} catch (error) { failure = error; }
finally {
  for (const target of created) {
    assert.ok(target.startsWith(materials + sep) && target.includes(token));
    rmSync(target, { recursive: true });
  }
  assert.deepEqual(snapshot(materials), before, 'Original materials must remain byte-identical');
  build('roundtrip-restored');
}
if (failure) throw failure;
writeFileSync(join(logDirectory, 'roundtrip.json'), JSON.stringify({ status: 'PASS', addedModules: ['life', 'notes', 'guard'], automaticImages: true, markdown: true, draftHidden: true, noRegistryEdits: true, originalMaterialsUnchanged: true, fixturesRemoved: true, finalBuildRestored: true }, null, 2));
console.log('PASS folder-only roundtrip: 3 modules, auto images, Markdown, hidden draft, unchanged adapters/materials, final build restored.');
