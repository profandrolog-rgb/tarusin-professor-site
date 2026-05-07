export interface ChecklistOption {
  label: string;
  value: string;
  score: number;
}

export interface ChecklistQuestion {
  id: string;
  text: string;
  description?: string;
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
