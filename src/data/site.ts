import profile from '../../materials/site/profile.json';
import { presentation } from './presentation';
import { getMaterialImage } from '../lib/materials';

/** Presentation adapter. Author-facing text lives in materials/site/profile.json. */
export const site = {
  ...profile,
  cover: { src: getMaterialImage(presentation.cover), alt: profile.coverAlt, caption: profile.coverCaption, position: presentation.coverPosition },
};
export const sections = [
  { number: '01', slug: 'life', name: 'Life', title: '生活与摄影', description: '日常、风景，以及途中遇见的人和事。' },
  { number: '02', slug: 'notes', name: 'Notes', title: '学习与思考', description: '技术笔记、个人探索，以及正在形成的想法。' },
  { number: '03', slug: 'guard', name: 'Guard', title: '国旗护卫队', description: '把共同的岁月，留成一份可以翻阅的记录。' },
] as const;
export type SectionSlug = typeof sections[number]['slug'];
