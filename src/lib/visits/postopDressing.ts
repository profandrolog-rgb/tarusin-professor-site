export const DRESSING_LOCAL_FIELDS = [
  ["healing", "Заживление раны", ["Первичным натяжением", "Вторичным натяжением"]],
  ["inflammation", "Признаки воспаления", ["Есть", "Нет"]],
  ["hematoma", "Признаки гематомы", ["Есть", "Нет"]],
  ["sutures", "Швы", ["Состоятельны", "Не состоятельны"]],
  ["discharge", "Отделяемое из раны", ["Нет", "Сукровичное", "Гнойное"]],
] as const;

export const DRESSING_ACTION_FIELDS = [
  ["sanitation", "Санация области швов раствором", ["Перекиси водорода 3%", "Водным раствором хлоргекседина 0,05%"]],
  ["treatment", "Область швов обработана", ["Спиртовым раствором йода 2%", "Йодопироном", "Бетадином", "Повидон-йодом", "Спиртовым раствором бриллиантового зеленого 1%"]],
  ["bandage", "Наложена асептическая повязка", ["Сухая", "Полуспиртовая", "С мазью левомеколь", "С мазью гидрокортизон 1%", "С мазью «Тарумель»"]],
  ["recommendations", "Рекомендовано", ["Повязку не снимать до следующего визита", "Смена повязки ежедневно"]],
] as const;

export const DEFAULT_POSTOP_DRESSING = {
  operation_name: "",
  dressing_number: null,
  complaints: "",
  general_status: "Общее состояние удовлетворительное, кожные покровы обычной окраски, кардио-респираторная деятельность стабильна, живот при пальпации мягкий безболезненный во всех отделах. Физиологические отправления в норме.",
  conclusion: "Этап репарации после операции.",
  dressing_local: {},
  dressing_actions: {},
};

export function parseDressingNumber(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function dressingActionText(data: Record<string, unknown>, key: string): string {
  return [data[key], data[`${key}_notes`]]
    .filter((value): value is string => typeof value === "string" && !!value.trim())
    .join(". ");
}
