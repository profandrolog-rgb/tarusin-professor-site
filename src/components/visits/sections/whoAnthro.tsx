import { createContext, useContext } from "react";
import { calculateAnthropometry } from "@/utils/anthropometry/who-reference";

export interface AnthroPatient { birthDate?: string | null; sex?: "M" | "F" | null; visitDate?: string | null }
export const AnthroPatientContext = createContext<AnthroPatient>({});
export const useAnthroPatient = () => useContext(AnthroPatientContext);

export interface WhoItem { label: string; p: number | null; z: number | null }
export interface WhoCalc { ok: boolean; reason?: string; items: WhoItem[]; line: string }

const num = (v?: string) => { const n = parseFloat(String(v || "").replace(",", ".")); return isFinite(n) && n > 0 ? n : undefined; };
const fmtZ = (z: number) => (z > 0 ? "+" : z < 0 ? "−" : "") + Math.abs(z).toFixed(2).replace(".", ",");
const fmtP = (p: number) => String(Math.round(p));

export function computeWho(pt: AnthroPatient, height?: string, weight?: string): WhoCalc {
  if (!pt.birthDate || !pt.sex) return { ok: false, reason: "нет даты рождения или пола — нет норм ВОЗ", items: [], line: "" };
  const bd = new Date(pt.birthDate); const md = pt.visitDate ? new Date(pt.visitDate) : new Date();
  if (isNaN(+bd) || isNaN(+md)) return { ok: false, reason: "некорректная дата", items: [], line: "" };
  const h = num(height), w = num(weight);
  if (!h && !w) return { ok: false, reason: "введите рост и/или вес", items: [], line: "" };
  const r = calculateAnthropometry({ birthDate: bd, measurementDate: md, sex: pt.sex === "M" ? "male" : "female", height: h, weight: w });
  if (r.ageYears >= 19) return { ok: false, reason: "возраст ≥ 19 лет — нет норм ВОЗ", items: [], line: "" };
  const items: WhoItem[] = [];
  if (h) items.push({ label: "Рост", p: r.heightPercentile, z: r.heightZScore });
  if (w) items.push({ label: "масса", p: r.weightPercentile, z: r.weightZScore });
  if (h && w) items.push({ label: "ИМТ", p: r.bmiPercentile, z: r.bmiZScore });
  const parts = items.filter((i) => i.p != null && i.z != null).map((i) => `${i.label} P${fmtP(i.p!)} (SDS ${fmtZ(i.z!)})`);
  if (!parts.length) return { ok: false, reason: "нет норм ВОЗ для этого возраста", items, line: "" };
  return { ok: true, items, line: parts.join("; ") };
}

export function whoTone(p: number | null) {
  if (p == null) return "text-muted-foreground";
  if (p < 3 || p > 97) return "text-destructive font-semibold";
  if (p < 15 || p > 85) return "text-accent-foreground font-medium";
  return "";
}
export { fmtP, fmtZ };
