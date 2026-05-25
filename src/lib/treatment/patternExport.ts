import type { PlanItem } from "@/components/treatment/PlanItemRow";
import { SECTIONS, SECTION_MAP, type TreatmentCategory } from "@/components/treatment/sections";

export type ExportFormat = "pdf" | "png" | "markdown";
export type AnonLevel = "full" | "profile";

export interface PatternExportInput {
  format: ExportFormat;
  anonLevel: AnonLevel;
  include: {
    items: true;
    lab: boolean;
    lifestyle: boolean;
    cost: boolean;
    duration: boolean;
  };
  clinicalSummary: string;
  durationDays: number;
  items: PlanItem[];
  totalCost: number | null;
  lab: Array<{ control_point: string | null; at_day: number | null }>;
  profile: {
    sex?: string | null;
    age?: number | null;
    diagnosisShort?: string | null;
  };
}

export function buildProfileLine(p: PatternExportInput["profile"]): string {
  const parts: string[] = [];
  if (p.sex) {
    const s = String(p.sex).toLowerCase();
    if (s.startsWith("м") || s === "male" || s === "m") parts.push("мужчина");
    else if (s.startsWith("ж") || s === "female" || s === "f") parts.push("женщина");
  }
  if (p.age != null) parts.push(`${p.age} лет`);
  let head = parts.join(", ");
  if (p.diagnosisShort) head = head ? `${head}, ${p.diagnosisShort}` : p.diagnosisShort;
  return head || "Клиническая ситуация не уточнена";
}

const LIFESTYLE_CATS: TreatmentCategory[] = ["lifestyle"];

export function filterItems(input: PatternExportInput): PlanItem[] {
  return input.items.filter(i => {
    if (LIFESTYLE_CATS.includes(i.section_category)) return input.include.lifestyle;
    return true;
  });
}

export function groupBySection(items: PlanItem[]) {
  return SECTIONS.map(s => ({
    section: s,
    list: items.filter(i => i.section_category === s.key),
  })).filter(g => g.list.length > 0);
}

function itemLine(it: PlanItem): string {
  const bits: string[] = [it.name_snapshot];
  if (it.dose != null) bits.push(`${it.dose}${it.dose_unit ? " " + it.dose_unit : ""}`);
  if (it.frequency) bits.push(it.frequency);
  if (it.duration_days != null) bits.push(`${it.duration_days} дн.`);
  if (it.day_pattern) bits.push(`дни: ${it.day_pattern}`);
  if (it.time_of_day && it.time_of_day.length) bits.push(it.time_of_day.join("/"));
  return bits.join(" · ");
}

export function buildMarkdown(input: PatternExportInput): string {
  const lines: string[] = [];
  lines.push(`# Терапевтический паттерн`);
  lines.push("");
  lines.push(`**Клиническая ситуация:** ${input.anonLevel === "profile" ? buildProfileLine(input.profile) : "—"}`);
  if (input.clinicalSummary.trim()) {
    lines.push("");
    lines.push(`## Клиническое назначение`);
    lines.push(input.clinicalSummary.trim());
  }
  if (input.include.duration) {
    lines.push("");
    lines.push(`**Длительность курса:** ${input.durationDays} дн.`);
  }
  lines.push("");
  lines.push(`## Состав терапии`);
  const groups = groupBySection(filterItems(input));
  groups.forEach(g => {
    lines.push("");
    lines.push(`### ${g.section.label}`);
    g.list.forEach(it => lines.push(`- ${itemLine(it)}`));
  });
  if (input.include.lab && input.lab.length > 0) {
    lines.push("");
    lines.push(`## Лабораторный контроль`);
    input.lab.forEach(l => {
      const d = l.at_day != null ? ` (день ${l.at_day})` : "";
      lines.push(`- ${l.control_point || "—"}${d}`);
    });
  }
  if (input.include.cost && input.totalCost != null) {
    lines.push("");
    lines.push(`**Ориентировочная стоимость курса:** ${new Intl.NumberFormat("ru-RU").format(Math.round(input.totalCost))} ₽`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("**МАЦ — Медико-академический центр.** Автор: проф. Д.И. Тарусин.");
  lines.push("");
  lines.push("> _Информация представлена в образовательных целях, не является инструкцией к применению._");
  return lines.join("\n");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
