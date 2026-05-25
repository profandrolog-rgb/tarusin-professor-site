// Parses a free-form Russian search query into structured filters + remainder text.
// Supports: years ("2025"), months ("март", "январь 2024"), relative ranges
// ("последний месяц", "прошлый год", "за неделю"), cost (">50000", "< 10000",
// "дешёвые", "дорогие"), age ranges ("40-50 лет", "от 30 до 40").

export type ParsedQuery = {
  text: string;          // remainder for fts/trgm
  from?: string;         // YYYY-MM-DD
  to?: string;
  costMin?: number;
  costMax?: number;
  ageMin?: number;
  ageMax?: number;
};

const MONTHS: Record<string, number> = {
  "январ": 0, "феврал": 1, "март": 2, "апрел": 3, "ма": 4, "июн": 5,
  "июл": 6, "август": 7, "сентябр": 8, "октябр": 9, "ноябр": 10, "декабр": 11,
};
const MONTHS_FULL = ["январ","феврал","март","апрел","ма","июн","июл","август","сентябр","октябр","ноябр","декабр"];

function ymd(d: Date) { return d.toISOString().slice(0, 10); }

export function parseSearchQuery(input: string): ParsedQuery {
  let text = " " + input.toLowerCase() + " ";
  const out: ParsedQuery = { text: "" };
  const now = new Date();

  // Relative: "последн(ий|яя|юю) (месяц|неделя|год)", "за (последние )?N дн(ей|я)?"
  const relMap: Array<[RegExp, () => void]> = [
    [/(?:^|\s)(последн\w+|прошл\w+)\s+(месяц\w*)\b/g, () => {
      const f = new Date(now); f.setMonth(now.getMonth() - 1);
      out.from = ymd(f); out.to = ymd(now);
    }],
    [/(?:^|\s)(последн\w+|прошл\w+)\s+(недел\w*)\b/g, () => {
      const f = new Date(now); f.setDate(now.getDate() - 7);
      out.from = ymd(f); out.to = ymd(now);
    }],
    [/(?:^|\s)(последн\w+|прошл\w+)\s+(год|года)\b/g, () => {
      const f = new Date(now); f.setFullYear(now.getFullYear() - 1);
      out.from = ymd(f); out.to = ymd(now);
    }],
    [/(?:^|\s)за\s+(?:последн\w+\s+)?(\d{1,3})\s+дн\w*/g, (m?: any) => {
      // handled below with capture
    }],
  ];
  for (const [re, fn] of relMap) {
    if (re.test(text)) { fn(); text = text.replace(re, " "); }
  }
  text = text.replace(/(?:^|\s)за\s+(?:последн\w+\s+)?(\d{1,3})\s+дн\w*/g, (_m, n) => {
    const days = Math.max(1, parseInt(n, 10));
    const f = new Date(now); f.setDate(now.getDate() - days);
    out.from = ymd(f); out.to = ymd(now);
    return " ";
  });

  // Month + optional year: "март 2025", "в марте"
  text = text.replace(/(?:^|\s)(?:в\s+)?([а-яё]{3,9})(?:\s+(\d{4}))?\b/g, (m, word, year) => {
    const lc = word.toLowerCase();
    let monthIdx = -1;
    for (const [stem, idx] of Object.entries(MONTHS)) {
      if (lc.startsWith(stem)) { monthIdx = idx; break; }
    }
    if (monthIdx < 0) return m;
    const y = year ? parseInt(year, 10) : now.getFullYear();
    const f = new Date(Date.UTC(y, monthIdx, 1));
    const t = new Date(Date.UTC(y, monthIdx + 1, 0));
    out.from = ymd(f); out.to = ymd(t);
    return " ";
  });

  // Year alone: "2025"
  text = text.replace(/(?:^|\s)(20\d{2})\b/g, (_m, y) => {
    if (!out.from) {
      out.from = `${y}-01-01`;
      out.to = `${y}-12-31`;
    }
    return " ";
  });

  // Age: "40-50 лет", "от 30 до 40 лет", "30 лет"
  text = text.replace(/(?:от\s+)?(\d{1,3})\s*(?:-|—|до)\s*(\d{1,3})\s*лет\b/g, (_m, a, b) => {
    out.ageMin = +a; out.ageMax = +b; return " ";
  });
  text = text.replace(/(?:^|\s)(\d{1,3})\s*лет\b/g, (_m, a) => {
    const n = +a; out.ageMin = n; out.ageMax = n; return " ";
  });

  // Cost: ">50000", "< 10000", "от 10000", "до 5000"
  text = text.replace(/>\s*(\d[\d\s]*)/g, (_m, n) => { out.costMin = +n.replace(/\s/g, ""); return " "; });
  text = text.replace(/<\s*(\d[\d\s]*)/g, (_m, n) => { out.costMax = +n.replace(/\s/g, ""); return " "; });
  text = text.replace(/(?:^|\s)от\s+(\d[\d\s]*)\s*(?:руб|₽)?\b/g, (_m, n) => { out.costMin = +n.replace(/\s/g, ""); return " "; });
  text = text.replace(/(?:^|\s)до\s+(\d[\d\s]*)\s*(?:руб|₽)?\b/g, (_m, n) => { out.costMax = +n.replace(/\s/g, ""); return " "; });

  // Categorical cost
  if (/\bдешёв\w*|\bдешев\w*|\bнедорог\w*/.test(text)) { out.costMax = Math.min(out.costMax ?? 20000, 20000); text = text.replace(/\bдешёв\w*|\bдешев\w*|\bнедорог\w*/g, " "); }
  if (/\bдорог\w*/.test(text)) { out.costMin = Math.max(out.costMin ?? 50000, 50000); text = text.replace(/\bдорог\w*/g, " "); }

  out.text = text.replace(/\s+/g, " ").trim();
  return out;
}
