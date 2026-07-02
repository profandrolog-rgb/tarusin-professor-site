/**
 * Подбор точек приложения терапии из каталога лечения (treatment_catalog)
 * для метаболической карты.
 *
 * Никаких выдумок и генерации ИИ: только строки каталога, где targets
 * пересекается с кодами затронутых путей/узлов текущей карты. Возраст и
 * противопоказания учитываются, но при совпадении по противопоказанию мы
 * НЕ скрываем — пишем предупреждение в contra_warning. Ранжирование:
 *   1) catalog_priority DESC
 *   2) evidence_level  DESC
 */

import { supabase } from "@/integrations/supabase/client";

export interface CatalogRow {
  id: string;
  name: string;
  subcategory: string | null;
  category: string | null;
  targets: string[] | null;
  contraindications: string | null;
  age_min_years: number | null;
  age_max_years: number | null;
  evidence_level: number;
  catalog_priority: number;
  default_dose: number | null;
  dose_unit: string | null;
  default_route_label: string | null;
  default_frequency: string | null;
  application_point: string | null;
  is_active: boolean;
}

export interface FindingRow {
  id: string;
  pathway_id: string | null;
  node_id: string | null;
  severity: string;
  label: string;
  source_ref: any;
}

export interface PathwayLite {
  id: string;
  slug: string;
  name: string;
}

export interface RecPreview {
  catalog_id: string;
  catalog: CatalogRow;
  pathway_id: string;
  target_node_id: string | null;
  application_point: string | null;
  rationale: string;
  priority: number;
  evidence_level: number;
  age_warning: string | null;
  contra_warning: string | null;
  finding_ids: string[];
}

const norm = (s: string) => s.toLowerCase().trim();

function yearsBetween(birth: string | null, ref: Date = new Date()): number | null {
  if (!birth) return null;
  const d = new Date(birth);
  if (Number.isNaN(d.getTime())) return null;
  const ms = ref.getTime() - d.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.2425);
}

/**
 * Возвращает список кодов, «пригодных» для сопоставления с catalog.targets
 * из одного finding + его пути.
 */
export function codesForFinding(f: FindingRow, pw: PathwayLite | undefined): string[] {
  const out = new Set<string>();
  if (pw) {
    out.add(norm(pw.slug));
    if (f.node_id) out.add(norm(`${pw.slug}:${f.node_id}`));
  }
  if (f.node_id) out.add(norm(f.node_id));
  const code = f.source_ref?.test_code;
  if (typeof code === "string" && code) out.add(norm(code));
  const name = f.source_ref?.test_name;
  if (typeof name === "string" && name) out.add(norm(name));
  return [...out];
}

/** Пересекаются ли targets каталога с кодами finding'а. */
export function catalogMatchesCodes(targets: string[] | null, codes: string[]): boolean {
  if (!targets || !targets.length || !codes.length) return false;
  const t = new Set(targets.map(norm));
  return codes.some((c) => t.has(c));
}

export function checkAge(row: CatalogRow, ageYears: number | null): string | null {
  if (ageYears == null) return null;
  if (row.age_min_years != null && ageYears < Number(row.age_min_years)) {
    return `Каталог: ≥ ${row.age_min_years} лет (сейчас ${ageYears.toFixed(1)}).`;
  }
  if (row.age_max_years != null && ageYears > Number(row.age_max_years)) {
    return `Каталог: ≤ ${row.age_max_years} лет (сейчас ${ageYears.toFixed(1)}).`;
  }
  return null;
}

/** Контр-предупреждение: если в контрах есть code/имя из findings — вернуть текст. */
export function checkContra(row: CatalogRow, findings: FindingRow[]): string | null {
  const contra = (row.contraindications || "").trim();
  if (!contra) return null;
  const contraLc = contra.toLowerCase();
  const hits = new Set<string>();
  for (const f of findings) {
    const name = String(f.source_ref?.test_name || "").toLowerCase();
    const code = String(f.source_ref?.test_code || "").toLowerCase();
    const nodeId = String(f.node_id || "").toLowerCase();
    for (const needle of [name, code, nodeId].filter(Boolean)) {
      if (contraLc.includes(needle)) hits.add(f.label);
    }
  }
  if (hits.size === 0) return null;
  return `Указано в противопоказаниях каталога — проверьте: ${[...hits].join("; ")}.`;
}

export interface BuildOptions {
  mapId: string;
  patientId: string;
}

/**
 * Читает findings + пациента + каталог, вычисляет предложения, полностью
 * заменяет автоматические строки в map_recommendations (is_manual = false)
 * для этой карты. Ручные строки не трогаем.
 */
export async function rebuildMapRecommendations({ mapId, patientId }: BuildOptions): Promise<{
  inserted: number;
  perNode: Record<string, number>;
  affectedNodesWithoutMatch: Array<{ pathway_id: string; node_id: string }>;
}> {
  // 1) findings текущей карты
  const { data: findings, error: fErr } = await (supabase as any)
    .from("map_findings")
    .select("id, pathway_id, node_id, severity, label, source_ref")
    .eq("map_id", mapId);
  if (fErr) throw fErr;
  const affected = ((findings as FindingRow[]) || []).filter(
    (f) => f.severity !== "info" || (f.source_ref?.agg_severity && f.source_ref.agg_severity !== "norm"),
  );

  // 2) пути (нужны slug'и)
  const { data: pw } = await (supabase as any)
    .from("pathways")
    .select("id, slug, name")
    .eq("is_active", true);
  const pathways = ((pw as PathwayLite[]) || []);
  const pwById = new Map(pathways.map((p) => [p.id, p]));

  // 3) пациент — возраст
  const { data: patient } = await supabase
    .from("patients")
    .select("id, birth_date")
    .eq("id", patientId)
    .maybeSingle();
  const ageYears = yearsBetween((patient as any)?.birth_date || null);

  // 4) каталог (только активные с непустыми targets)
  const { data: cat } = await (supabase as any)
    .from("treatment_catalog")
    .select(
      "id, name, subcategory, category, targets, contraindications, age_min_years, age_max_years, evidence_level, catalog_priority, default_dose, dose_unit, default_route_label, default_frequency, application_point, is_active",
    )
    .eq("is_active", true)
    .not("targets", "is", null);
  const catalog = (((cat as CatalogRow[]) || []).filter(
    (r) => Array.isArray(r.targets) && r.targets.length > 0,
  )) as CatalogRow[];

  // 5) собираем предложения
  const previews: RecPreview[] = [];
  const affectedByNode = new Map<string, FindingRow[]>();
  for (const f of affected) {
    const key = `${f.pathway_id || "_"}::${f.node_id || "_"}`;
    if (!affectedByNode.has(key)) affectedByNode.set(key, []);
    affectedByNode.get(key)!.push(f);
  }

  const nodesWithMatch = new Set<string>();

  for (const [key, group] of affectedByNode.entries()) {
    const first = group[0];
    if (!first.pathway_id) continue;
    const pw = pwById.get(first.pathway_id);
    const codesUnion = new Set<string>();
    for (const g of group) for (const c of codesForFinding(g, pw)) codesUnion.add(c);
    const codes = [...codesUnion];

    for (const row of catalog) {
      if (!catalogMatchesCodes(row.targets, codes)) continue;
      const age_warning = checkAge(row, ageYears);
      const contra_warning = checkContra(row, group);
      // Не скрываем при противопоказании — только помечаем.
      previews.push({
        catalog_id: row.id,
        catalog: row,
        pathway_id: first.pathway_id,
        target_node_id: first.node_id,
        application_point:
          row.application_point ||
          [pw?.name, first.node_id].filter(Boolean).join(" · ") ||
          null,
        rationale: `Сработавшие показатели: ${group.map((g) => g.label).slice(0, 4).join("; ")}`,
        priority: row.catalog_priority || 0,
        evidence_level: row.evidence_level || 0,
        age_warning,
        contra_warning,
        finding_ids: group.map((g) => g.id),
      });
      nodesWithMatch.add(key);
    }
  }

  // сортировка: priority DESC, evidence DESC, name ASC
  previews.sort(
    (a, b) =>
      b.priority - a.priority ||
      b.evidence_level - a.evidence_level ||
      a.catalog.name.localeCompare(b.catalog.name, "ru"),
  );

  // 6) убираем прошлые авто-строки и вставляем новые
  const { error: delErr } = await (supabase as any)
    .from("map_recommendations")
    .delete()
    .eq("map_id", mapId)
    .eq("is_manual", false);
  if (delErr) throw delErr;

  if (previews.length) {
    const rows = previews.map((p) => ({
      map_id: mapId,
      catalog_id: p.catalog_id,
      pathway_id: p.pathway_id,
      target_node_id: p.target_node_id,
      application_point: p.application_point,
      rationale: p.rationale,
      priority: p.priority,
      evidence_level: p.evidence_level,
      age_warning: p.age_warning,
      contra_warning: p.contra_warning,
      finding_ids: p.finding_ids,
      is_manual: false,
      include_in_print: false,
    }));
    const { error: insErr } = await (supabase as any).from("map_recommendations").insert(rows);
    if (insErr) throw insErr;
  }

  const perNode: Record<string, number> = {};
  for (const p of previews) {
    const k = `${p.pathway_id}::${p.target_node_id || "_"}`;
    perNode[k] = (perNode[k] || 0) + 1;
  }
  const affectedNodesWithoutMatch: Array<{ pathway_id: string; node_id: string }> = [];
  for (const key of affectedByNode.keys()) {
    if (nodesWithMatch.has(key)) continue;
    const [pathway_id, node_id] = key.split("::");
    if (pathway_id && pathway_id !== "_" && node_id && node_id !== "_") {
      affectedNodesWithoutMatch.push({ pathway_id, node_id });
    }
  }

  return { inserted: previews.length, perNode, affectedNodesWithoutMatch };
}
