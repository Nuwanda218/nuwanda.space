import type { ImageMetadata } from 'astro';
import { getCollection, render } from 'astro:content';
import { describeMaterial, findMaterialPhotos, sortMaterials } from './materials-core.mjs';

type Module = 'life' | 'notes' | 'guard';
const images = import.meta.glob<{ default: ImageMetadata }>('/materials/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', { eager: true });
const imagePaths = Object.keys(images);

export function getMaterialImage(path: string) {
  const image = images['/materials/' + path];
  if (!image) throw new Error(`找不到封面素材：materials/${path}`);
  return image.default;
}

/** The only bridge from author materials to presentation; no layout rules here. */
export async function getMaterials(module: Module) {
  const entries = await getCollection(module);
  const published = sortMaterials(entries.map(entry => ({ ...describeMaterial(`${module}/${entry.id}/index.md`, entry.data), entry })));
  return Promise.all(published.map(async item => {
    const entryPath = `${module}/${item.entry.id}/index.md`;
    const photos = findMaterialPhotos(entryPath, item.entry.data, imagePaths).map(photo => ({ ...photo, src: images[photo.file].default }));
    const firstParagraph = (item.entry.body || '').split(/\n\s*\n/).find(part => part.trim() && !part.startsWith('#')) || '';
    return {
      ...item,
      slug: item.id,
      summary: item.summary || firstParagraph.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140),
      photos,
      ...(await render(item.entry)),
    };
  }));
}
