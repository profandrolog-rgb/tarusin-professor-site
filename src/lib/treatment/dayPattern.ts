// Day-pattern parsing for treatment plans (scheduled mode).
// Supports: "1-10", "1,3,5,7", "через 1", "через 2", "5", combinations.

export function expandPattern(
  pattern: string | null | undefined,
  courseDays: number,
  itemDays?: number | null,
): Set<number> {
  const total = itemDays ?? courseDays;
  const set = new Set<number>();
  if (!pattern || pattern.trim() === "") {
    for (let i = 1; i <= total; i++) set.add(i);
    return set;
  }
  pattern.split(",").map(s => s.trim()).filter(Boolean).forEach(part => {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const a = +range[1], b = +range[2];
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
        if (i >= 1 && i <= courseDays) set.add(i);
      }
      return;
    }
    const every = part.match(/^через\s+(\d+)$/i);
    if (every) {
      const step = +every[1] + 1;
      for (let i = 1; i <= courseDays; i += step) set.add(i);
      return;
    }
    const n = Number(part);
    if (!Number.isNaN(n) && n >= 1 && n <= courseDays) set.add(n);
  });
  return set;
}

export function countActiveDays(
  pattern: string | null | undefined,
  courseDays: number,
  itemDays?: number | null,
): number {
  return expandPattern(pattern, courseDays, itemDays).size;
}
