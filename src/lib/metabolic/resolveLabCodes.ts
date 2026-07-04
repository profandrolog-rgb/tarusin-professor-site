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
  synonyms: unknown;
};

type CatEntry = { code: string; keys: string[]; tokens: string[][] };

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
    entries.push({ code, keys, tokens });
  }
  entries.sort((a, b) => Number(asciiCodeRe.test(b.code)) - Number(asciiCodeRe.test(a.code)));
  return entries;
}

export function resolveCode(testName: string | null | undefined, catalog: CatEntry[]): string | null {
  const nm = norm(testName);
  if (!nm) return null;
  const labTokens = new Set(nm.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 3));
  for (const e of catalog) {
    const hitDirect = e.keys.includes(nm);
    const hitSubstr = !hitDirect && e.keys.some((k) => k.length >= 3 && nm.includes(k));
    const hitTokens = !hitDirect && !hitSubstr && labTokens.size > 0 &&
      e.tokens.some((tt) => tt.length > 0 && tt.every((t) => labTokens.has(t)));
    if (hitDirect || hitSubstr || hitTokens) return e.code;
  }
  return null;
}
