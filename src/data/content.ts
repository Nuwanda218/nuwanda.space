// Compatibility exports only. Author-facing records live under materials/.
import { getMaterials } from '../lib/materials';
export const notes = await getMaterials('notes');
export const guardEvents = await getMaterials('guard');
