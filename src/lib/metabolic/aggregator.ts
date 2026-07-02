/**
 * Метаболическая карта — детерминированный автоагрегатор отклонений.
 *
 * Никакой эвристики/ИИ: сравниваем измеренные значения с референсными границами
 * (reference_min / reference_max из lab_results) и по правилам путей
 * (pathways.rules) выставляем severity:
 *   norm | mild | moderate | severe | no_data
 *
 * Значения не выдумываются: если по пути нет ни одного матча, статус = "no_data".
 */

import { supabase } from "@/integrations/supabase/client";

export type Severity = "norm" | "mild" | "moderate" | "severe" | "no_data";

export const SEVERITY_ORDER: Severity[] = ["no_data", "norm", "mild", "moderate", "severe"];
export const SEVERITY_LABEL: Record<Severity, string> = {
  no_data: "нет данных",
  norm: "норма",
  mild: "лёгкое",
  moderate: "умеренное",
  severe: "тяжёлое",
};

export interface PathwayRule {
  id: string;
  node_id: string;
  label: string;
  /** below = value < ref_min; above = value > ref_max; outside = любое отклонение */
  direction: "below" | "above" | "outside";
  match: { codes?: string[]; names?: string[] };
  /**
   * Пороги как множитель референса.
   *   below : ratio = value / ref_min  → срабатывает если ratio <= threshold
   *   above : ratio = value / ref_max  → срабатывает если ratio >= threshold
   *   outside: используем max(abs(value-ref_min)/ref_min, abs(value-ref_max)/ref_max)
   *           → срабатывает если >= threshold (доля отклонения)
   */
  thresholds: { mild: number; moderate: number; severe: number };
}

export interface Pathway {
  id: string;
  slug: string;
  name: string;
  rules: PathwayRule[];
}

export interface LabRow {
  id: string;
  test_date: string;
  test_code: string | null;
  test_name: string;
  value: number;
  unit: string;
  reference_min: number | null;
  reference_max: number | null;
}

export interface AggregatedFinding {
  pathway_id: string;
  node_id: string;
  severity: Exclude<Severity, "no_data" | "norm">;
  label: string;
  detail: string;
  source_ref: Record<string, unknown>;
}

export interface PathwaySummary {
  pathway_id: string;
  slug: string;
  name: string;
  status: Severity;
  matched_markers: number;
  affected_nodes: string[];
}

export interface AggregationResult {
  findings: AggregatedFinding[];
  summary: PathwaySummary[];
  visit_id: string | null;
  visit_date: string | null;
  computed_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────

function norm(s: string) {
  return s.toLowerCase().trim();
}

function findLatestMatch(labs: LabRow[], rule: PathwayRule): LabRow | null {
  const codes = (rule.match.codes || []).map(norm);
  const names = (rule.match.names || []).map(norm);
  const hits = labs.filter((l) => {
    const c = norm(l.test_code || "");
    const n = norm(l.test_name || "");
    if (codes.length && c && codes.includes(c)) return true;
    if (names.length && names.some((needle) => n.includes(needle))) return true;
    return false;
  });
  if (!hits.length) return null;
  // latest by test_date
  hits.sort((a, b) => (a.test_date < b.test_date ? 1 : -1));
  return hits[0];
}

function severityFor(rule: PathwayRule, lab: LabRow): Exclude<Severity, "no_data"> | null {
  const { value, reference_min, reference_max } = lab;
  const { thresholds, direction } = rule;

  if (direction === "below") {
    if (reference_min == null || reference_min <= 0) return null;
    const ratio = value / reference_min;
    if (ratio <= thresholds.severe) return "severe";
    if (ratio <= thresholds.moderate) return "moderate";
    if (ratio <= thresholds.mild) return "mild";
    return "norm";
  }
  if (direction === "above") {
    if (reference_max == null || reference_max <= 0) return null;
    const ratio = value / reference_max;
    if (ratio >= thresholds.severe) return "severe";
    if (ratio >= thresholds.moderate) return "moderate";
    if (ratio >= thresholds.mild) return "mild";
    return "norm";
  }
  // outside
  if (reference_min == null && reference_max == null) return null;
  let dev = 0;
  if (reference_min != null && value < reference_min && reference_min > 0) {
    dev = Math.max(dev, (reference_min - value) / reference_min);
  }
  if (reference_max != null && value > reference_max && reference_max > 0) {
    dev = Math.max(dev, (value - reference_max) / reference_max);
  }
  if (dev >= thresholds.severe) return "severe";
  if (dev >= thresholds.moderate) return "moderate";
  if (dev >= thresholds.mild) return "mild";
  return "norm";
}

function worst(a: Severity, b: Severity): Severity {
  return SEVERITY_ORDER.indexOf(a) >= SEVERITY_ORDER.indexOf(b) ? a : b;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface RunOptions {
  patientId: string;
  /** если задан — используем только lab_results с test_date <= visit_date */
  visitId?: string | null;
}

/**
 * Прогон агрегатора: читает лабы пациента, применяет правила, сохраняет
 * metabolic_maps + map_findings (полная замена findings по map_id).
 */
export async function runAggregation(opts: RunOptions): Promise<AggregationResult> {
  const { patientId, visitId } = opts;

  // 1. загружаем пути с правилами
  const { data: pwRows, error: pwErr } = await (supabase as any)
    .from("pathways")
    .select("id, slug, name, rules")
    .eq("is_active", true);
  if (pwErr) throw pwErr;
  const pathways: Pathway[] = ((pwRows as any[]) || []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    rules: Array.isArray(p.rules) ? (p.rules as PathwayRule[]) : [],
  }));

  // 2. визит-источник (для отсечения по дате)
  let visitDate: string | null = null;
  if (visitId) {
    const { data: v } = await supabase
      .from("patient_visits")
      .select("visit_date")
      .eq("id", visitId)
      .maybeSingle();
    visitDate = (v?.visit_date as string | undefined) || null;
  }

  // 3. лабораторные
  let labsQuery = supabase
    .from("lab_results")
    .select("id, test_date, test_code, test_name, value, unit, reference_min, reference_max")
    .eq("patient_id", patientId)
    .order("test_date", { ascending: false });
  if (visitDate) labsQuery = labsQuery.lte("test_date", visitDate);
  const { data: labData, error: labErr } = await labsQuery;
  if (labErr) throw labErr;
  const labs = ((labData as any[]) || []) as LabRow[];

  // 4. применяем правила
  const findings: AggregatedFinding[] = [];
  const summary: PathwaySummary[] = [];

  for (const pw of pathways) {
    let matched = 0;
    const affected = new Set<string>();
    let status: Severity = "no_data";
    for (const rule of pw.rules) {
      const lab = findLatestMatch(labs, rule);
      if (!lab) continue;
      matched += 1;
      const sev = severityFor(rule, lab);
      if (!sev) continue;
      if (sev === "norm") {
        status = worst(status, "norm");
        continue;
      }
      status = worst(status, sev);
      affected.add(rule.node_id);
      findings.push({
        pathway_id: pw.id,
        node_id: rule.node_id,
        severity: sev,
        label: `${rule.label}: ${lab.value} ${lab.unit}`.trim(),
        detail: [
          lab.reference_min != null ? `реф. ≥ ${lab.reference_min}` : null,
          lab.reference_max != null ? `реф. ≤ ${lab.reference_max}` : null,
          `забор ${lab.test_date}`,
        ]
          .filter(Boolean)
          .join(" · "),
        source_ref: {
          rule_id: rule.id,
          lab_result_id: lab.id,
          test_code: lab.test_code,
          test_name: lab.test_name,
          value: lab.value,
        },
      });
    }
    if (matched === 0) status = "no_data";
    else if (status === "no_data") status = "norm";
    summary.push({
      pathway_id: pw.id,
      slug: pw.slug,
      name: pw.name,
      status,
      matched_markers: matched,
      affected_nodes: [...affected],
    });
  }

  // 5. апсерт карты + замена findings
  const computedAt = new Date().toISOString();
  const { data: mapUpsert, error: upErr } = await (supabase as any)
    .from("metabolic_maps")
    .upsert(
      {
        patient_id: patientId,
        source_visit_id: visitId || null,
        last_aggregated_at: computedAt,
        aggregate_summary: {
          computed_at: computedAt,
          visit_id: visitId || null,
          visit_date: visitDate,
          pathways: summary,
        },
      },
      { onConflict: "patient_id" }
    )
    .select("id")
    .maybeSingle();
  if (upErr) throw upErr;
  const mapId: string = mapUpsert!.id;

  // удаляем только автоматические findings (source_ref->>'rule_id' задан)
  await (supabase as any)
    .from("map_findings")
    .delete()
    .eq("map_id", mapId)
    .not("source_ref->rule_id", "is", null);

  if (findings.length) {
    const sevToStored: Record<string, string> = {
      mild: "info",
      moderate: "warn",
      severe: "critical",
    };
    const rows = findings.map((f) => ({
      map_id: mapId,
      pathway_id: f.pathway_id,
      node_id: f.node_id,
      severity: sevToStored[f.severity] || "info",
      label: f.label,
      detail: f.detail,
      source_ref: { ...f.source_ref, agg_severity: f.severity },
    }));
    const { error: insErr } = await (supabase as any).from("map_findings").insert(rows);
    if (insErr) throw insErr;
  }

  return {
    findings,
    summary,
    visit_id: visitId || null,
    visit_date: visitDate,
    computed_at: computedAt,
  };
}
