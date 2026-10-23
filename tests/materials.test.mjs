import assert from 'node:assert/strict';
import test from 'node:test';
import { describeMaterial, findMaterialPhotos, sortMaterials, resolveMaterialPath } from '../src/lib/materials-core.mjs';

test('a folder supplies title/date defaults, with no page registry to edit', () => {
  const material = describeMaterial('life/2026-10-18-秋日散步/index.md', {});
  assert.equal(material.title, '秋日散步');
  assert.equal(material.date, '2026-10-18');
  assert.equal(describeMaterial('life/随手记录/index.md', {}).date, undefined);
  assert.equal(describeMaterial('life/随手记录/index.md', { title: '另一种标题' }).title, '另一种标题');
});

test('new local images are discovered, naturally ordered, and can have captions', () => {
  const paths = ['/materials/life/walk/10.jpg', '/materials/life/walk/2.jpg', '/materials/life/walk/1.jpg', '/materials/life/other/no.jpg'];
  const photos = findMaterialPhotos('life/walk/index.md', {}, paths);
  assert.deepEqual(photos.map(p => p.file), paths.slice(0, 3).reverse());
  const described = findMaterialPhotos('life/walk/index.md', { photos: { '1.jpg': { alt: '树下的落叶', caption: '傍晚' } } }, paths);
  assert.equal(described[0].alt, '树下的落叶');
  assert.equal(described[0].caption, '傍晚');
});

test('cross-entry reuse does not require moving or duplicating original images', () => {
  const paths = ['/materials/life/walk/1.jpg'];
  assert.equal(findMaterialPhotos('guard/training/index.md', { images: ['../../life/walk/1.jpg'] }, paths)[0].file, paths[0]);
  assert.throws(() => findMaterialPhotos('guard/training/index.md', { images: ['missing.jpg'] }, paths), /missing.jpg/);
  assert.throws(() => resolveMaterialPath('life/walk/index.md', '../../../outside.jpg'), /素材区/);
});

test('drafts are omitted and entries sort newest first without fabricated dates', () => {
  const items = [
    { id: 'undated', date: undefined, draft: false },
    { id: 'old', date: '2026-10-01', draft: false },
    { id: 'draft', date: '2026-10-20', draft: true },
    { id: 'new', date: '2026-10-18', draft: false },
  ];
  assert.deepEqual(sortMaterials(items).map(i => i.id), ['new', 'old', 'undated']);
  assert.deepEqual(items.map(i => i.id), ['undated', 'old', 'draft', 'new']);
});

test('invalid dates and metadata produce actionable failures', () => {
  assert.throws(() => describeMaterial('life/walk/index.md', { date: '2026-02-30' }), /日期/);
  assert.throws(() => describeMaterial('life/2026-02-30-walk/index.md', {}), /日期/);
});
