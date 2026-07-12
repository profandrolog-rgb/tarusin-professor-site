/**
 * Транслитерация русских ФИО по стандарту загранпаспортов РФ
 * (приказ МВД России, ICAO Doc 9303).
 *
 * Детерминированная побуквенная функция — без AI/API, работает офлайн.
 */

const MAP_UPPER: Record<string, string> = {
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "E", Ж: "ZH",
  З: "Z", И: "I", Й: "I", К: "K", Л: "L", М: "M", Н: "N", О: "O",
  П: "P", Р: "R", С: "S", Т: "T", У: "U", Ф: "F", Х: "KH", Ц: "TS",
  Ч: "CH", Ш: "SH", Щ: "SHCH", Ъ: "IE", Ы: "Y", Ь: "", Э: "E",
  Ю: "IU", Я: "IA",
};

function translitChar(ch: string): string {
  const upper = ch.toUpperCase();
  const mapped = MAP_UPPER[upper];
  if (mapped === undefined) return ch; // латиница, цифры, пробелы, дефисы и т.п.
  if (mapped === "") return "";
  // Сохраняем регистр: если исходная буква была строчной — приводим результат к нижнему,
  // если заглавной и следующая буква в слове тоже заглавная — оставляем в верхнем,
  // иначе — только первая буква результата заглавная (Title Case внутри слова).
  if (ch === upper) {
    // Заглавная исходная — оставляем полностью в верхнем регистре
    return mapped;
  }
  return mapped.toLowerCase();
}

/**
 * Транслитерирует ФИО, сохраняя пробелы и дефисы.
 * По итогу каждое слово приводится к «TitleCase» (Ivanov, Yuliia-Anna),
 * что соответствует виду в загранпаспорте.
 */
export function transliterateGOST(fullName: string): string {
  if (!fullName) return "";
  const translitWord = (word: string) => {
    let out = "";
    for (const ch of word) out += translitChar(ch);
    if (!out) return "";
    // TitleCase — первая заглавная, остальные строчные
    return out.charAt(0).toUpperCase() + out.slice(1).toLowerCase();
  };
  // Разбиваем по пробелам и дефисам, сохраняя разделители
  return fullName
    .split(/(\s+|-)/)
    .map((part) => (/^\s+$/.test(part) || part === "-" ? part : translitWord(part)))
    .join("");
}
