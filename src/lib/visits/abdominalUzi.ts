export interface AbdominalField {
  key: string;
  label: string;
  numeric?: boolean;
  standard?: string;
}

export const ABDOMINAL_GROUPS: { title: string; fields: AbdominalField[] }[] = [
  { title: "Передняя брюшная стенка и область пупка", fields: [
    { key: "abdominal_wall", label: "Передняя брюшная стенка", standard: "Передняя брюшная стенка на исследованных участках не изменена. Грыжевых выпячиваний не выявлено." },
    { key: "umbilicus", label: "Область пупка", standard: "В области пупка грыжевых выпячиваний не выявлено." },
  ] },
  { title: "Печень", fields: [
    { key: "liver", label: "Описание печени", standard: "Визуализация удовлетворительная. Расположение обычное. Капсула на визуализируемых участках без особенностей. Внутрипечёночные структуры хорошо дифференцированы. Паренхима однородная, без признаков очаговых изменений. Визуализируемые внутрипечёночные сосуды и желчные протоки не расширены. Стенки желчных протоков не изменены." },
    { key: "liver_right", label: "Правая доля, мм", numeric: true },
    { key: "liver_left", label: "Левая доля, мм", numeric: true },
    { key: "portal_vein", label: "Диаметр воротной вены, мм", numeric: true },
  ] },
  { title: "Желчный пузырь и желчные протоки", fields: [
    { key: "gallbladder", label: "Описание желчного пузыря и протоков", standard: "Визуализация удовлетворительная. Расположение типичное. Форма обычная. Контуры ровные, чёткие. Стенки не изменены. Содержимое анэхогенное. Визуализируемые внепечёночные желчные протоки не расширены, стенки не изменены." },
    { key: "gallbladder_length", label: "Длина пузыря, мм", numeric: true },
    { key: "gallbladder_width", label: "Ширина пузыря, мм", numeric: true },
    { key: "gallbladder_wall", label: "Толщина стенки, мм", numeric: true },
    { key: "bile_duct", label: "Диаметр общего желчного протока, мм", numeric: true },
  ] },
  { title: "Поджелудочная железа", fields: [
    { key: "pancreas", label: "Описание поджелудочной железы", standard: "Визуализация удовлетворительная. Контуры ровные, чёткие. Эхоструктура однородная, без признаков очаговых изменений." },
    { key: "pancreas_head", label: "Головка, мм", numeric: true },
    { key: "pancreas_body", label: "Тело, мм", numeric: true },
    { key: "pancreas_tail", label: "Хвост, мм", numeric: true },
    { key: "pancreatic_duct", label: "Диаметр вирсунгова протока, мм", numeric: true },
  ] },
  { title: "Селезёнка", fields: [
    { key: "spleen", label: "Описание селезёнки", standard: "Визуализация удовлетворительная. Топография не изменена, физиологическая подвижность сохранена. Контуры ровные, чёткие. Структуры дифференцированы, визуализируемые участки капсулы не изменены. Паренхима однородная, без признаков очаговых и диффузных изменений. Визуализируемые сосуды без особенностей. Дополнительных образований в околоселезёночном пространстве не выявлено." },
    { key: "spleen_length", label: "Длина, мм", numeric: true },
    { key: "spleen_width", label: "Ширина, мм", numeric: true },
    { key: "spleen_thickness", label: "Толщина, мм", numeric: true },
  ] },
  { title: "Желудок и пилорический отдел", fields: [
    { key: "stomach", label: "Желудок (визуализируемые отделы)" },
    { key: "stomach_wall", label: "Толщина стенки желудка, мм", numeric: true },
    { key: "stomach_contents", label: "Содержимое желудка и перистальтика" },
    { key: "pylorus", label: "Пилорический отдел" },
    { key: "pylorus_muscle", label: "Толщина мышечного слоя привратника, мм", numeric: true },
    { key: "pylorus_length", label: "Длина пилорического канала, мм", numeric: true },
    { key: "pylorus_passage", label: "Раскрытие привратника и пассаж содержимого (если оценивались)" },
  ] },
  { title: "Лимфатические узлы и кишечник", fields: [
    { key: "lymph_nodes", label: "Лимфатические узлы брыжейки", standard: "Визуализируются единичные лимфатические узлы брыжейки." },
    { key: "lymph_max", label: "Максимальный размер лимфоузла, мм", numeric: true },
    { key: "colon", label: "Толстая кишка", standard: "В визуализируемых восходящем, поперечном, нисходящем и сигмовидном отделах изменений не выявлено." },
    { key: "rectum", label: "Прямая кишка", standard: "Визуализируемые участки без особенностей, стенки не утолщены." },
  ] },
  { title: "Брюшная аорта и нижняя полая вена", fields: [
    { key: "aorta", label: "Брюшная аорта", standard: "Брюшная аорта прослеживается в доступных отделах. Ход обычный, контуры ровные. Видимых локальных расширений не выявлено." },
    { key: "aorta_diameter", label: "Переднезадний диаметр аорты, мм", numeric: true },
    { key: "aorta_level", label: "Уровень и метод измерения аорты" },
    { key: "ivc", label: "Нижняя полая вена", standard: "Нижняя полая вена прослеживается в доступных отделах. Контуры ровные. Видимых внутрипросветных образований не выявлено." },
    { key: "ivc_diameter", label: "Переднезадний диаметр НПВ, мм", numeric: true },
    { key: "ivc_level", label: "Уровень и условия измерения НПВ" },
    { key: "ivc_respiration", label: "Изменение диаметра НПВ при дыхании (если оценивалось)" },
    { key: "vascular_doppler", label: "Кровоток при допплерографии (если выполнена)" },
  ] },
  { title: "Вены малого таза и свободная жидкость", fields: [
    { key: "pelvic_veins", label: "Вены малого таза", standard: "Визуализируемые вены малого таза не расширены." },
    { key: "abdominal_fluid", label: "Свободная жидкость в брюшной полости", standard: "Свободная жидкость в отлогих отделах брюшной полости не выявлена." },
    { key: "pelvic_fluid", label: "Жидкость в малом тазу", standard: "Свободная жидкость в естественных углублениях малого таза не выявлена." },
  ] },
];

export interface AbdominalUziData {
  enabled?: boolean;
  values?: Record<string, string>;
  conclusion?: string;
}

export const ABDOMINAL_STANDARD_CONCLUSION = "На момент исследования ультразвуковых признаков структурных изменений визуализируемых паренхиматозных органов брюшной полости не выявлено.";

/** Only a deliberate action fills empty descriptions; never measurements or existing text. */
export function fillAbdominalStandard(data: AbdominalUziData): AbdominalUziData {
  const values = { ...data.values };
  for (const group of ABDOMINAL_GROUPS) {
    for (const field of group.fields) {
      if (field.standard && !values[field.key]?.trim()) values[field.key] = field.standard;
    }
  }
  return { ...data, values, conclusion: data.conclusion?.trim() ? data.conclusion : ABDOMINAL_STANDARD_CONCLUSION };
}

export function abdominalPrintFields(data?: AbdominalUziData): { label: string; value: string }[] {
  if (data?.enabled !== true) return [];
  const fields = ABDOMINAL_GROUPS.flatMap((group) => group.fields.flatMap((field) => {
    const value = data.values?.[field.key]?.trim();
    return value ? [{ label: field.label, value }] : [];
  }));
  if (data.conclusion?.trim()) fields.push({ label: "Заключение УЗИ брюшной полости", value: data.conclusion.trim() });
  return fields;
}
