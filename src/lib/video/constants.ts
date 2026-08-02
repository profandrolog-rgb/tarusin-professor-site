// Справочники и утилиты раздела «Видео».

export const VIDEO_RUBRIC_FALLBACK: Array<{ slug: string; title: string; is_urgent?: boolean }> = [
  { slug: "ostraya-bol", title: "Острая боль и «что делать сейчас»", is_urgent: true },
  { slug: "razvitie-malchika", title: "Развитие мальчика" },
  { slug: "yaichki", title: "Яички и мошонка" },
  { slug: "gigiena", title: "Гигиена" },
  { slug: "gorshok", title: "Горшок и мочеиспускание" },
  { slug: "polovoy-chlen", title: "Половой член" },
  { slug: "erektsiya-seks", title: "Эрекция и половая жизнь" },
  { slug: "muzhskoe-zdorovie", title: "Мужское здоровье" },
  { slug: "zachatie", title: "Зачатие и фертильность" },
  { slug: "obsledovaniya", title: "Обследования" },
  { slug: "operatsiya-narkoz", title: "Операция и наркоз" },
  { slug: "professor", title: "О профессоре" },
];

export const AUDIENCE_LABELS: Record<string, string> = {
  roditelyam: "Родителям",
  podrostki: "Подросткам",
  vzroslym: "Взрослым",
  vracham: "Врачам",
  zhenshchinam: "Женщинам",
};

export const AGE_LABELS: Record<string, string> = {
  "0-3": "0–3 года",
  "4-6": "4–6 лет",
  "7-11": "7–11 лет",
  "12-17": "12–17 лет",
  "18-45": "18–45 лет",
  "45+": "45+",
};

export const FORMAT_LABELS: Record<string, string> = {
  short: "Коротко",
  explainer: "Разбор",
  interview: "Интервью",
  lecture: "Лекция",
  case: "Клинический случай",
};

export const LEVEL_LABELS: Record<string, string> = {
  patient: "Для пациента",
  pro: "Для врача",
};

export const AUDIENCE_OPTIONS = Object.keys(AUDIENCE_LABELS);
export const AGE_OPTIONS = Object.keys(AGE_LABELS);
export const FORMAT_OPTIONS = Object.keys(FORMAT_LABELS);

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
};

/** Транслитерация в slug: строчные латинские буквы, цифры и дефисы. */
export function slugifyVideo(input: string): string {
  return (input || "")
    .toLowerCase()
    .split("")
    .map((ch) => (TRANSLIT[ch] !== undefined ? TRANSLIT[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** «7:05» / «1:02:33» */
export function formatDuration(sec?: number | null): string {
  if (!sec || sec <= 0) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Транскрипт-статусы для админки. */
export const TRANSCRIPT_STATUS_LABELS: Record<string, string> = {
  pending: "Не запускалась",
  processing: "Идёт расшифровка",
  done: "Готово",
  error: "Ошибка",
  too_large: "Файл слишком большой",
};
