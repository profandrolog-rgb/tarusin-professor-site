// Резолвер каталожного кода по test_name лабораторного результата.
// Зеркалирует логику из aggregator.ts (шаг 3.0), но применяется в UI:
// нужен, чтобы сопоставить нормальные (не отклонённые) значения с узлами SVG
// без изменения БД. Правила/данные не трогает.

const asciiCodeRe = /^[A-Z0-9_]{2,12}$/;

function norm(s: unknown): string {
  return String(s ?? "").toLowerCase().trim();
}

export type CatalogRow = {
  short_name: string | null;
  name: string | null;
  unit?: string | null;
  synonyms: unknown;
};

type CatEntry = { code: string; keys: string[]; tokens: string[][]; unit?: string | null };

export function buildCatalogIndex(rows: CatalogRow[]): CatEntry[] {
  const entries: CatEntry[] = [];
  for (const row of rows || []) {
    const aliases: string[] = [];
    if (row.short_name) aliases.push(String(row.short_name));
    if (row.name) aliases.push(String(row.name));
    if (Array.isArray(row.synonyms)) for (const s of row.synonyms) if (s) aliases.push(String(s));
    if (!aliases.length) continue;
    const asciiHit = aliases.map((a) => String(a).trim().toUpperCase()).find((a) => asciiCodeRe.test(a));
    const code = (asciiHit || String(row.short_name || row.name || aliases[0])).trim().toUpperCase();
    if (!code) continue;
    const keys = aliases.map((a) => norm(a)).filter(Boolean);
    // Токены для многословных алиасов. Если фильтр коротких токенов (<3) обрезал алиас
    // (например «ХС общий» → «общий»), token-match для такого алиаса отключаем, иначе
    // одиночный оставшийся токен даёт ложные срабатывания (Общий белок → CHOL).
    const tokens = keys.map((k) => {
      const parts = k.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
      const kept = parts.filter((t) => t.length >= 3);
      return kept.length === parts.length && kept.length >= 2 ? kept : [];
    });
    entries.push({ code, keys, tokens, unit: row.unit || null });
  }
  entries.sort((a, b) => Number(asciiCodeRe.test(b.code)) - Number(asciiCodeRe.test(a.code)));
  return entries;
}

function normalizeUnit(value: string | null | undefined): string {
  return String(value || "").toLowerCase().replace(/[\s.]+/g, "").replace("ед/л", "u/l").replace("ме/л", "u/l");
}

export function resolveCode(testName: string | null | undefined, catalog: CatEntry[], resultUnit?: string | null): string | null {
  const nm = norm(testName);
  if (!nm) return null;
  const labTokens = new Set(nm.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 3));
  const candidates: Array<{ entry: CatEntry; score: number }> = [];
  for (const e of catalog) {
    const hitDirect = e.keys.includes(nm);
    // Наибольшая длина алиаса, входящего в имя теста — характеризует «плотность» совпадения.
    // Пример: имя «Гаммаглутаминтрансфераза (GGT)» содержит короткий алиас «глутамин»
    // (AA_GLN_PL, длина 8), но это лишь фрагмент слова — реальный тест это GGT.
    let matchedKeyLen = 0;
    if (!hitDirect) {
      for (const k of e.keys) {
        if (k.length < 3 || !nm.includes(k)) continue;
        // Требуем границы слова: алиас должен быть окружён не-буквой/цифрой
        // (или краем строки). Иначе «глутамин» ⊂ «гаммаглутаминтрансфераза»
        // даёт ложное совпадение AA_GLN_PL для реального GGT.
        const idx = nm.indexOf(k);
        const before = idx === 0 ? "" : nm[idx - 1];
        const after = idx + k.length >= nm.length ? "" : nm[idx + k.length];
        const isBoundary = (ch: string) => ch === "" || !/[\p{L}\p{N}]/u.test(ch);
        if (!isBoundary(before) || !isBoundary(after)) continue;
        if (k.length > matchedKeyLen) matchedKeyLen = k.length;
      }
    }
    const hitSubstr = !hitDirect && matchedKeyLen > 0;
    const hitTokens = !hitDirect && !hitSubstr && labTokens.size > 0 &&
      e.tokens.some((tt) => tt.length > 0 && tt.every((t) => labTokens.has(t)));
    if (hitDirect || hitSubstr || hitTokens) {
      const catalogUnit = normalizeUnit(e.unit);
      const measuredUnit = normalizeUnit(resultUnit);
      if (catalogUnit && measuredUnit && catalogUnit !== measuredUnit) continue;
      // Один русский analyte может иметь legacy-код и канонический код
      // AminoMetrix (например ORNITHINE и AA_ORN_PL). Для плазменной
      // аминокислоты выбираем канонический AA_*_PL, иначе значение не
      // попадает в узел SVG, хотя в каталоге оно есть.
      let score = hitDirect ? 30 : hitSubstr ? 20 : 10;
      // Бонус за канонический плазменный AA-код даём только при полном совпадении
      // имени (hitDirect) — иначе короткий алиас «глутамин» перекрывает GGT.
      if (hitDirect && e.code.startsWith("AA_") && e.code.endsWith("_PL")) score += 20;
      // Небольшой бонус за длину совпавшего алиаса (0..8): чем полнее покрытие имени,
      // тем выше уверенность. Исключает ложные подстроки вроде «глут» ⊂ «Гаммаглутамин…».
      if (hitSubstr) {
        const nmLen = Math.max(1, nm.length);
        score += Math.round(8 * (matchedKeyLen / nmLen));
      }
      candidates.push({ entry: e, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.entry.code || null;
}
