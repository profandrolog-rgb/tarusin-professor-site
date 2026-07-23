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
    const tokens = keys.map((k) => k.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 3));
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
    const hitSubstr = !hitDirect && e.keys.some((k) => k.length >= 3 && nm.includes(k));
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
      if (e.code.startsWith("AA_") && e.code.endsWith("_PL")) score += 20;
      candidates.push({ entry: e, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.entry.code || null;
}
