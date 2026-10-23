import { posix } from 'node:path';

/** Pure content rules, shared by the Astro adapter and the regression tests. */
export function describeMaterial(entryPath, data = {}) {
  const folder = posix.basename(posix.dirname(entryPath));
  const match = folder.match(/^(\d{4}-\d{2}-\d{2})(?:[-_ ]+(.+))?$/);
  const date = data.date || match?.[1];
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) {
    throw new Error(`${entryPath}：日期必须是真实的 YYYY-MM-DD 日期，收到 ${date}`);
  }
  return {
    id: posix.dirname(entryPath).replaceAll('/', '--'),
    title: data.title || match?.[2] || folder,
    date,
    category: data.category || '',
    summary: data.summary || '',
    draft: data.draft ?? false,
    demo: data.demo ?? false,
  };
}

export function resolveMaterialPath(entryPath, reference) {
  if (typeof reference !== 'string' || reference.includes('\\') || reference.includes('\0')) throw new Error(`${entryPath}：图片路径请使用 / 分隔`);
  const path = reference.startsWith('/materials/')
    ? posix.normalize(reference.slice('/materials/'.length))
    : posix.normalize(posix.join(posix.dirname(entryPath), reference));
  if (path === '..' || path.startsWith('../') || path.startsWith('/') || /^[a-zA-Z]:/.test(path)) throw new Error(`${entryPath}：图片引用不可离开素材区`);
  return '/materials/' + path;
}

export function findMaterialPhotos(entryPath, data, availablePaths) {
  const directory = '/materials/' + posix.dirname(entryPath);
  const files = data.images === undefined
    ? availablePaths.filter(file => posix.dirname(file) === directory).sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }))
    : data.images.map(reference => resolveMaterialPath(entryPath, reference));
  const description = describeMaterial(entryPath, data);
  return files.map(file => {
    if (!availablePaths.includes(file)) throw new Error(`${entryPath}：找不到图片 ${file}`);
    const name = posix.basename(file);
    const meta = data.photos?.[name] || data.photos?.[file] || {};
    const readableName = name.replace(/\.[^.]+$/, '').replace(/^\d+[-_ ]*/, '').replaceAll('-', ' ');
    return { file, alt: meta.alt || `${description.title}：${readableName || '照片'}`, caption: meta.caption || '' };
  });
}

export function sortMaterials(items) {
  return items.filter(item => !item.draft).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.id.localeCompare(b.id, 'zh-CN'));
}
