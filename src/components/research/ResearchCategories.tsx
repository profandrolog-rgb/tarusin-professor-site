const RESEARCH_CATEGORIES = [
  { value: "general", label: "Общее" },
  { value: "urology", label: "Урология" },
  { value: "andrology", label: "Андрология" },
  { value: "surgery", label: "Хирургия" },
  { value: "endocrinology", label: "Эндокринология" },
  { value: "reproductology", label: "Репродуктология" },
  { value: "sexology", label: "Сексология" },
  { value: "pediatrics", label: "Педиатрия" },
  { value: "diagnostics", label: "Диагностика" },
  { value: "rehabilitation", label: "Реабилитация" },
] as const;

export default RESEARCH_CATEGORIES;

export function getCategoryLabel(value: string): string {
  const cat = RESEARCH_CATEGORIES.find((c) => c.value === value);
  return cat?.label ?? value;
}
