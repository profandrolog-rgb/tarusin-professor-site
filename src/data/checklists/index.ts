import { ChecklistDefinition } from './types';
import { prematureEjaculationChecklist } from './premature-ejaculation';

// Register all checklists here. To add a new one:
// 1. Create a data file in this folder (see premature-ejaculation.ts as template)
// 2. Import and add to the array below
export const allChecklists: ChecklistDefinition[] = [
  prematureEjaculationChecklist,
];

export function getChecklistBySlug(slug: string): ChecklistDefinition | undefined {
  return allChecklists.find(c => c.slug === slug);
}
