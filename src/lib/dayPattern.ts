// day_pattern parser/serializer.
// Supported tokens (case-insensitive, separated by ; or ,):
//   "1-10", "1,3,5,7", "5", "every_day", "every_other"/"ч/день",
//   "every_3rd_day", "weekly", "twice_weekly", "thrice_weekly",
//   "every_other_from_8" (starts every_other from day 8).
// Russian aliases: "ежедневно"=every_day, "ч/день"=every_other,
//   "1 р/нед"=weekly, "2 р/нед"=twice_weekly, "3 р/нед"=thrice_weekly.

export type DayPatternInput = string | null | undefined;

const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

function alias(token: string): string {
  const t = norm(token);
  if (["ежедневно", "every_day", "everyday", "каждый день"].includes(t)) return "every_day";
  if (["ч/день", "через день", "every_other", "every other day"].includes(t)) return "every_other";
  if (["every_3rd_day", "каждый 3-й день", "1 р/3 дня", "раз в 3 дня"].includes(t)) return "every_3rd_day";
  if (["weekly", "1 р/нед", "раз в неделю"].includes(t)) return "weekly";
  if (["twice_weekly", "2 р/нед", "2 раза в неделю"].includes(t)) return "twice_weekly";
  if (["thrice_weekly", "3 р/нед", "3 раза в неделю"].includes(t)) return "thrice_weekly";
  return t;
}

/** Expand a pattern into a sorted unique array of 1-based day numbers, clipped to [1, durationDays]. */
export function expandDays(pattern: DayPatternInput, durationDays: number): number[] {
  if (durationDays <= 0) return [];
  if (!pattern || !pattern.trim()) return [];
  const out = new Set<number>();
  const tokens = pattern.split(/[;,]/).map(t => t.trim()).filter(Boolean);

  for (const raw of tokens) {
    const t = alias(raw);
    // range a-b
    const r = t.match(/^(\d+)\s*-\s*(\d+)$/);
    if (r) {
      const a = Math.max(1, parseInt(r[1]));
      const b = Math.min(durationDays, parseInt(r[2]));
      for (let i = a; i <= b; i++) out.add(i);
      continue;
    }
    // single number
    if (/^\d+$/.test(t)) {
      const n = parseInt(t);
      if (n >= 1 && n <= durationDays) out.add(n);
      continue;
    }
    if (t === "every_day") { for (let i = 1; i <= durationDays; i++) out.add(i); continue; }
    if (t === "every_other") { for (let i = 1; i <= durationDays; i += 2) out.add(i); continue; }
    if (t === "every_3rd_day") { for (let i = 1; i <= durationDays; i += 3) out.add(i); continue; }
    if (t === "weekly") { for (let i = 1; i <= durationDays; i += 7) out.add(i); continue; }
    if (t === "twice_weekly") {
      // days 1,4,8,11,15,18 ... (Mon/Thu pattern)
      for (let w = 0; w * 7 + 1 <= durationDays; w++) {
        if (w * 7 + 1 <= durationDays) out.add(w * 7 + 1);
        if (w * 7 + 4 <= durationDays) out.add(w * 7 + 4);
      }
      continue;
    }
    if (t === "thrice_weekly") {
      // 1,3,5,8,10,12,15,17,19 (Mon/Wed/Fri pattern)
      for (let w = 0; w * 7 + 1 <= durationDays; w++) {
        if (w * 7 + 1 <= durationDays) out.add(w * 7 + 1);
        if (w * 7 + 3 <= durationDays) out.add(w * 7 + 3);
        if (w * 7 + 5 <= durationDays) out.add(w * 7 + 5);
      }
      continue;
    }
    const eof = t.match(/^every_other_from_(\d+)$/);
    if (eof) {
      const start = parseInt(eof[1]);
      for (let i = start; i <= durationDays; i += 2) out.add(i);
      continue;
    }
  }
  return [...out].sort((a, b) => a - b);
}

/** Compact a sorted array of days into "1-3;5;7-9" style. */
export function compactDays(days: number[]): string {
  if (!days.length) return "";
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0], prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) { prev = cur; continue; }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = prev = cur!;
  }
  return parts.join(",");
}

/** Toggle a single day in a pattern; returns the new compact pattern. */
export function toggleDay(pattern: DayPatternInput, durationDays: number, day: number): string {
  const set = new Set(expandDays(pattern, durationDays));
  if (set.has(day)) set.delete(day); else set.add(day);
  return compactDays([...set]);
}

/** Shift all days by offset; clipped to [1, durationDays]. */
export function shiftDays(pattern: DayPatternInput, durationDays: number, offset: number): string {
  const days = expandDays(pattern, durationDays).map(d => d + offset).filter(d => d >= 1 && d <= durationDays);
  return compactDays(days);
}

/** Pretty-print a pattern for UI. */
export function formatPattern(pattern: DayPatternInput, durationDays: number): string {
  const days = expandDays(pattern, durationDays);
  if (!days.length) return "—";
  if (days.length === durationDays) return "ежедневно";
  return compactDays(days);
}
