import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const schema = z.object({
  title: z.string().min(1).optional(),
  date: z.preprocess(value => value instanceof Date ? value.toISOString().slice(0, 10) : value, z.string().optional()),
  category: z.string().optional(),
  summary: z.string().optional(),
  draft: z.boolean().default(false),
  demo: z.boolean().default(false),
  // Optional: explicit order or reuse an image from another entry.
  images: z.array(z.string()).optional(),
  photos: z.record(z.string(), z.object({ alt: z.string().optional(), caption: z.string().optional() })).optional(),
});

function collection(module: string) {
  return defineCollection({
    loader: glob({
      base: `./materials/${module}`,
      pattern: '**/index.md',
      generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
    }),
    schema,
  });
}

export const collections = {
  life: collection('life'),
  notes: collection('notes'),
  guard: collection('guard'),
};
