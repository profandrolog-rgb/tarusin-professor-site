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

export const AGE_GROUPS = [
  { value: "all", label: "Все возрасты", emoji: "👥" },
  { value: "children", label: "Дети", emoji: "👶" },
  { value: "adults", label: "Взрослые", emoji: "🧑" },
] as const;

export function getAgeGroupLabel(value: string): string {
  const ag = AGE_GROUPS.find((a) => a.value === value);
  return ag?.label ?? value;
}
