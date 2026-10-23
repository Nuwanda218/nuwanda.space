export interface MaterialData {
  title?: string; date?: string; category?: string; summary?: string; draft?: boolean; demo?: boolean;
  images?: string[]; photos?: Record<string, { alt?: string; caption?: string }>;
}
export interface MaterialDescription {
  id: string; title: string; date?: string; category: string; summary: string; draft: boolean; demo: boolean;
}
export function describeMaterial(entryPath: string, data?: MaterialData): MaterialDescription;
export function resolveMaterialPath(entryPath: string, reference: string): string;
export function findMaterialPhotos(entryPath: string, data: MaterialData, availablePaths: string[]): { file: string; alt: string; caption: string }[];
export function sortMaterials<T extends { id: string; date?: string; draft: boolean }>(items: T[]): T[];
