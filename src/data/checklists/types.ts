export interface ChecklistOption {
  label: string;
  value: string;
  score: number;
}

export interface ChecklistQuestion {
  id: string;
  text: string;
  description?: string;
  /** false = ответ сохраняется, но не входит в сумму баллов (например, QoL в IPSS) */
  scored?: boolean;
  options: ChecklistOption[];
}

export interface ChecklistResultRule {
  level: 'low' | 'medium' | 'high';
  minScore: number;
  maxScore: number;
  title: string;
  text: string;
}

export interface ChecklistDefinition {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string; // lucide icon name for card
  intro: string;
  consentLabel: string;
  questions: ChecklistQuestion[];
  results: ChecklistResultRule[];
}

export function scoreAnswers(questions: ChecklistQuestion[], answers: Record<string, { score: number }>): number {
  return questions.reduce((s, q) => (q.scored === false ? s : s + (answers[q.id]?.score ?? 0)), 0);
}
