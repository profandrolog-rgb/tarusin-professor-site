import { ChecklistDefinition } from './types';
import { prematureEjaculationChecklist } from './premature-ejaculation';
import { iief5Checklist, ipssChecklist, amsChecklist } from './standardScales';

// Встроенные опросники — резерв на случай недоступности базы.
// Основной источник — визуальный конструктор (/admin/self-check).
export const allChecklists: ChecklistDefinition[] = [
  iief5Checklist,
  ipssChecklist,
  amsChecklist,
  prematureEjaculationChecklist,
];

export function getChecklistBySlug(slug: string): ChecklistDefinition | undefined {
  return allChecklists.find(c => c.slug === slug);
}
