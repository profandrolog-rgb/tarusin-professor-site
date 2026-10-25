import type { ChecklistResultRule } from './types';

export type ChecklistLevel = ChecklistResultRule['level'];

/** 5 градаций тяжести: от зелёного (всё отлично) к красному (тяжёлое состояние). */
export const CHECKLIST_LEVELS: { v: ChecklistLevel; label: string; color: string; severity: number }[] = [
  { v: 'low', label: 'Норма', color: '#22c55e', severity: 0 },
  { v: 'mild', label: 'Минимальные отклонения', color: '#84cc16', severity: 1 },
  { v: 'medium', label: 'Умеренные нарушения', color: '#eab308', severity: 2 },
  { v: 'marked', label: 'Выраженные нарушения', color: '#f97316', severity: 3 },
  { v: 'high', label: 'Тяжёлое состояние', color: '#ef4444', severity: 4 },
];

export const levelInfo = (l: string) => CHECKLIST_LEVELS.find(x => x.v === l) ?? CHECKLIST_LEVELS[2];
