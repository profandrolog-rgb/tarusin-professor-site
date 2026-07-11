import { s as supabase } from "../main.mjs";
const PHASE_DEPENDENT_CODES = /* @__PURE__ */ new Set(["E2", "PROG", "LH", "FSH"]);
function up(s) {
  return String(s ?? "").toUpperCase().trim();
}
function ageMatches(ageYears, row) {
  if (ageYears == null) return true;
  return ageYears >= Number(row.age_min_years) && ageYears < Number(row.age_max_years);
}
function resolveReference(args) {
  const { labReferenceMin, labReferenceMax, ctx, refIndex, rulePhase } = args;
  const code = up(args.analyteCode);
  if (labReferenceMin != null || labReferenceMax != null) {
    return { ref_low: labReferenceMin, ref_high: labReferenceMax, source: "blank" };
  }
  if (!code) return null;
  const isPhaseDepFemale = ctx.sex === "F" && PHASE_DEPENDENT_CODES.has(code);
  if (isPhaseDepFemale) {
    const phase = ctx.cyclePhase && ctx.cyclePhase !== "unknown" ? ctx.cyclePhase : null;
    const status = ctx.reproStatus && ctx.reproStatus !== "unknown" ? ctx.reproStatus : null;
    if (rulePhase && phase && rulePhase !== phase) return null;
    if (!phase && !status) return { needsPhase: true };
    const targetPhase = rulePhase || phase;
    const row2 = refIndex.find(
      (r) => up(r.analyte_code) === code && (r.sex === "F" || r.sex === "A") && (targetPhase && r.phase === targetPhase || status && r.status === status) && ageMatches(ctx.ageYears, r)
    );
    if (row2) return { ref_low: row2.ref_low, ref_high: row2.ref_high, source: "reference_ranges" };
    return null;
  }
  const sexCandidates = ctx.sex ? [ctx.sex, "A"] : ["A"];
  const row = refIndex.find(
    (r) => up(r.analyte_code) === code && sexCandidates.includes(r.sex) && !r.phase && // общая строка без фазы
    ageMatches(ctx.ageYears, r)
  );
  if (row) return { ref_low: row.ref_low, ref_high: row.ref_high, source: "reference_ranges" };
  return null;
}
async function loadReferenceRanges(codes) {
  const clean = Array.from(new Set(codes.map(up).filter(Boolean)));
  if (!clean.length) return [];
  const { data, error } = await supabase.from("reference_ranges").select("analyte_code, sex, phase, status, age_min_years, age_max_years, ref_low, ref_high, unit").in("analyte_code", clean);
  if (error) {
    console.warn("[metabolic] loadReferenceRanges failed:", error.message);
    return [];
  }
  return data || [];
}
function filterPathwaysBySex(pathways, patientSex) {
  if (!patientSex) return pathways.filter((p) => !p.sex);
  return pathways.filter((p) => !p.sex || p.sex === patientSex);
}
function deriveCycleContext(protocolData) {
  if (!protocolData || typeof protocolData !== "object") {
    return { cyclePhase: null, cycleDay: null, reproStatus: null };
  }
  const rawPhase = String(protocolData.cycle_phase || "").toLowerCase();
  const knownPhases = /* @__PURE__ */ new Set(["follicular", "ovulatory", "luteal", "postmenopause", "unknown"]);
  const rawStatus = String(protocolData.repro_status || "").toLowerCase();
  const knownStatus = /* @__PURE__ */ new Set([
    "prepubertal",
    "pubertal",
    "reproductive",
    "pregnant",
    "postmenopause",
    "pediatric",
    "unknown"
  ]);
  let phase = knownPhases.has(rawPhase) ? rawPhase : null;
  const day = Number(protocolData.cycle_day);
  const cycleDay = Number.isFinite(day) && day > 0 ? Math.round(day) : null;
  if (!phase && protocolData.last_period_date) {
    const start = new Date(protocolData.last_period_date);
    const cycleLen = Number(protocolData.cycle_length) || 28;
    if (!Number.isNaN(start.getTime())) {
      const diffDays = Math.floor((Date.now() - start.getTime()) / 864e5);
      const inCycle = (diffDays % cycleLen + cycleLen) % cycleLen + 1;
      const ovulation = cycleLen - 14;
      if (inCycle < ovulation - 1) phase = "follicular";
      else if (inCycle <= ovulation + 1) phase = "ovulatory";
      else phase = "luteal";
    }
  }
  const status = knownStatus.has(rawStatus) ? rawStatus : null;
  return { cyclePhase: phase, cycleDay, reproStatus: status };
}
function calcAgeYears(birthDate) {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const ms = Date.now() - d.getTime();
  return ms / (365.25 * 24 * 3600 * 1e3);
}
const SEVERITY_ORDER = ["no_data", "norm", "mild", "moderate", "severe"];
const SEVERITY_LABEL = {
  no_data: "нет данных",
  norm: "норма",
  mild: "лёгкое",
  moderate: "умеренное",
  severe: "тяжёлое"
};
function norm(s) {
  return String(s ?? "").toLowerCase().trim();
}
function ruleMatchCodes(r) {
  var _a, _b;
  const arr = [];
  if ((_a = r.when) == null ? void 0 : _a.test_code) arr.push(r.when.test_code);
  if (Array.isArray((_b = r.match) == null ? void 0 : _b.codes)) arr.push(...r.match.codes);
  return arr.map(norm).filter(Boolean);
}
function ruleMatchNames(r) {
  var _a, _b;
  const arr = [];
  if ((_a = r.when) == null ? void 0 : _a.test_name) arr.push(r.when.test_name);
  if (Array.isArray((_b = r.match) == null ? void 0 : _b.names)) arr.push(...r.match.names);
  return arr.map(norm).filter(Boolean);
}
function findLatestMatch(labs, rule) {
  const codes = ruleMatchCodes(rule);
  const names = ruleMatchNames(rule);
  const hits = labs.filter((l) => {
    const c = norm(l.test_code || "");
    const n = norm(l.test_name || "");
    if (codes.length && c && codes.includes(c)) return true;
    if (names.length && names.some((needle) => n.includes(needle))) return true;
    return false;
  });
  if (!hits.length) return null;
  hits.sort((a, b) => a.test_date < b.test_date ? 1 : -1);
  return hits[0];
}
function evaluateRule(rule, lab, refLow, refHigh) {
  var _a, _b, _c;
  const labValue = Number(lab.value);
  if (!Number.isFinite(labValue)) return null;
  if (rule.when || rule.raises_to) {
    const op = ((_a = rule.when) == null ? void 0 : _a.op) || ">";
    const vfr = (_b = rule.when) == null ? void 0 : _b.value_from_ref;
    const cmpValue = typeof ((_c = rule.when) == null ? void 0 : _c.value) === "number" ? rule.when.value : vfr === "high" ? refHigh : vfr === "low" ? refLow : null;
    if (cmpValue == null || !Number.isFinite(Number(cmpValue))) return null;
    const v = labValue;
    const cmp = Number(cmpValue);
    let hit = false;
    switch (op) {
      case ">":
        hit = v > cmp;
        break;
      case ">=":
        hit = v >= cmp;
        break;
      case "<":
        hit = v < cmp;
        break;
      case "<=":
        hit = v <= cmp;
        break;
      case "=":
        hit = v === cmp;
        break;
      case "!=":
        hit = v !== cmp;
        break;
      default:
        return null;
    }
    if (!hit) return "norm";
    return rule.raises_to || "mild";
  }
  const value = labValue;
  const reference_min = refLow;
  const reference_max = refHigh;
  const thresholds = rule.thresholds;
  const direction = rule.direction;
  if (!thresholds || !direction) return null;
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
  if (reference_min == null && reference_max == null) return null;
  let dev = 0;
  if (reference_min != null && value < reference_min && reference_min > 0) dev = Math.max(dev, (reference_min - value) / reference_min);
  if (reference_max != null && value > reference_max && reference_max > 0) dev = Math.max(dev, (value - reference_max) / reference_max);
  if (dev >= thresholds.severe) return "severe";
  if (dev >= thresholds.moderate) return "moderate";
  if (dev >= thresholds.mild) return "mild";
  return "norm";
}
function ruleLabel(rule) {
  var _a, _b;
  return norm(rule.label || rule.code || ((_a = rule.when) == null ? void 0 : _a.test_code) || ((_b = rule.when) == null ? void 0 : _b.test_name) || "правило") || "правило";
}
function ruleNodes(rule) {
  if (Array.isArray(rule.highlight_nodes) && rule.highlight_nodes.length) return rule.highlight_nodes.map(String).filter(Boolean);
  if (rule.node_id) return [String(rule.node_id)];
  return [];
}
function worst(a, b) {
  return SEVERITY_ORDER.indexOf(a) >= SEVERITY_ORDER.indexOf(b) ? a : b;
}
async function runAggregation(opts) {
  var _a, _b, _c;
  const { patientId, visitId } = opts;
  try {
    void supabase.functions.invoke("extract-visit-labs", {
      body: { patient_id: patientId, only_new: true }
    }).catch((e) => {
      console.warn("[metabolic] extract-visit-labs bg failed:", (e == null ? void 0 : e.message) || e);
    });
  } catch (e) {
    console.warn("[metabolic] extract-visit-labs skipped:", (e == null ? void 0 : e.message) || e);
  }
  const [{ data: pwRows, error: pwErr }, { data: patientRow }] = await Promise.all([
    supabase.from("pathways").select("id, slug, name, sex, rules").eq("is_active", true),
    supabase.from("patients").select("sex, birth_date").eq("id", patientId).maybeSingle()
  ]);
  if (pwErr) throw pwErr;
  const patientSex = (patientRow == null ? void 0 : patientRow.sex) === "M" || (patientRow == null ? void 0 : patientRow.sex) === "F" ? patientRow.sex : null;
  const ageYears = calcAgeYears((patientRow == null ? void 0 : patientRow.birth_date) || null);
  const allPathways = (pwRows || []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    sex: p.sex ?? null,
    rules: Array.isArray(p.rules) ? p.rules : []
  }));
  const pathways = filterPathwaysBySex(allPathways, patientSex);
  let visitDate = null;
  let cyclePhase = null;
  let reproStatus = null;
  if (visitId) {
    const { data: v } = await supabase.from("patient_visits").select("visit_date, protocol_data").eq("id", visitId).maybeSingle();
    visitDate = (v == null ? void 0 : v.visit_date) || null;
    const ctx = deriveCycleContext(v == null ? void 0 : v.protocol_data);
    cyclePhase = ctx.cyclePhase;
    reproStatus = ctx.reproStatus;
  } else if (patientSex === "F") {
    const { data: vLatest } = await supabase.from("patient_visits").select("visit_date, protocol_data").eq("patient_id", patientId).order("visit_date", { ascending: false }).limit(1).maybeSingle();
    const ctx = deriveCycleContext(vLatest == null ? void 0 : vLatest.protocol_data);
    cyclePhase = ctx.cyclePhase;
    reproStatus = ctx.reproStatus;
  }
  const patientCtx = { sex: patientSex, ageYears, cyclePhase, reproStatus };
  let labsQuery = supabase.from("lab_results").select("id, test_date, test_code, test_name, value, unit, reference_min, reference_max").eq("patient_id", patientId).order("test_date", { ascending: false });
  if (visitDate) labsQuery = labsQuery.lte("test_date", visitDate);
  const { data: labData, error: labErr } = await labsQuery;
  if (labErr) throw labErr;
  const labs = labData || [];
  const { data: catRows } = await supabase.from("lab_tests_catalog").select("short_name, name, synonyms").eq("is_active", true);
  const asciiCodeRe = /^[A-Z0-9_]{2,12}$/;
  const catEntries = [];
  for (const row of catRows || []) {
    const aliases = [];
    if (row.short_name) aliases.push(String(row.short_name));
    if (row.name) aliases.push(String(row.name));
    if (Array.isArray(row.synonyms)) {
      for (const s of row.synonyms) if (s) aliases.push(String(s));
    }
    if (!aliases.length) continue;
    const asciiHit = aliases.map((a) => String(a).trim().toUpperCase()).find((a) => asciiCodeRe.test(a));
    const code = (asciiHit || String(row.short_name || row.name || aliases[0])).trim().toUpperCase();
    if (!code) continue;
    const keys = aliases.map((a) => norm(a)).filter(Boolean);
    const tokens = keys.map((k) => k.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 3));
    catEntries.push({ code, keys, tokens });
  }
  catEntries.sort((a, b) => Number(asciiCodeRe.test(b.code)) - Number(asciiCodeRe.test(a.code)));
  for (const l of labs) {
    if (l.test_code && String(l.test_code).trim()) continue;
    const nm = norm(l.test_name);
    if (!nm) continue;
    const labTokens = new Set(nm.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 3));
    let resolved;
    for (const e of catEntries) {
      const hitDirect = e.keys.includes(nm);
      const hitSubstr = !hitDirect && e.keys.some((k) => k.length >= 3 && nm.includes(k));
      const hitTokens = !hitDirect && !hitSubstr && labTokens.size > 0 && e.tokens.some((tt) => tt.length > 0 && tt.every((t) => labTokens.has(t)));
      if (hitDirect || hitSubstr || hitTokens) {
        resolved = e.code;
        break;
      }
    }
    if (resolved) l.test_code = resolved;
  }
  const codeSet = /* @__PURE__ */ new Set();
  for (const pw of pathways) {
    for (const r of pw.rules) {
      const c = (_a = r == null ? void 0 : r.when) == null ? void 0 : _a.test_code;
      if (c) codeSet.add(String(c).toUpperCase());
    }
  }
  for (const l of labs) {
    if (l.test_code) codeSet.add(String(l.test_code).toUpperCase());
  }
  const refIndex = await loadReferenceRanges([...codeSet]);
  const findings = [];
  const summary = [];
  for (const pw of pathways) {
    let matched = 0;
    const affected = /* @__PURE__ */ new Set();
    const needsPhaseCodes = /* @__PURE__ */ new Set();
    let status = "no_data";
    for (const rawRule of pw.rules) {
      try {
        const rule = rawRule && typeof rawRule === "object" ? rawRule : {};
        const lab = findLatestMatch(labs, rule);
        if (!lab) continue;
        const analyteCode = (((_b = rule.when) == null ? void 0 : _b.test_code) || lab.test_code || "").toString();
        const resolved = resolveReference({
          analyteCode,
          labReferenceMin: lab.reference_min == null ? null : Number(lab.reference_min),
          labReferenceMax: lab.reference_max == null ? null : Number(lab.reference_max),
          ctx: patientCtx,
          refIndex,
          rulePhase: ((_c = rule.when) == null ? void 0 : _c.phase) || null
        });
        if (resolved && "needsPhase" in resolved) {
          matched += 1;
          const codeForHint = String(analyteCode || lab.test_code || "").toUpperCase().trim();
          if (codeForHint) needsPhaseCodes.add(codeForHint);
          continue;
        }
        if (!resolved) continue;
        const bounds = resolved;
        matched += 1;
        const sev = evaluateRule(rule, lab, bounds.ref_low, bounds.ref_high);
        if (!sev) continue;
        if (sev === "norm") {
          status = worst(status, "norm");
          continue;
        }
        status = worst(status, sev);
        const nodes = ruleNodes(rule);
        for (const nid of nodes) affected.add(nid);
        const primaryNode = nodes[0] || "";
        const label = ruleLabel(rule);
        findings.push({
          pathway_id: pw.id,
          node_id: primaryNode,
          severity: sev,
          label: `${label}: ${lab.value} ${lab.unit}`.trim(),
          detail: [
            bounds.ref_low != null ? `реф. ≥ ${bounds.ref_low}` : null,
            bounds.ref_high != null ? `реф. ≤ ${bounds.ref_high}` : null,
            bounds.source === "reference_ranges" ? "(по возрасту/фазе)" : null,
            `забор ${lab.test_date}`
          ].filter(Boolean).join(" · "),
          source_ref: {
            rule_code: rule.code || null,
            highlight_nodes: nodes,
            lab_result_id: lab.id,
            test_code: lab.test_code,
            test_name: lab.test_name,
            value: lab.value,
            ref_source: bounds.source
          }
        });
      } catch (ruleError) {
        console.warn("[metabolic] bad rule skipped", {
          pathway: pw.slug,
          rule: rawRule,
          error: ruleError instanceof Error ? ruleError.message : String(ruleError)
        });
        continue;
      }
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
      needs_phase_codes: needsPhaseCodes.size ? [...needsPhaseCodes] : []
    });
  }
  const computedAt = (/* @__PURE__ */ new Date()).toISOString();
  const { data: mapUpsert, error: upErr } = await supabase.from("metabolic_maps").upsert(
    {
      patient_id: patientId,
      source_visit_id: visitId || null,
      last_aggregated_at: computedAt,
      aggregate_summary: {
        computed_at: computedAt,
        visit_id: visitId || null,
        visit_date: visitDate,
        pathways: summary
      }
    },
    { onConflict: "patient_id" }
  ).select("id").maybeSingle();
  if (upErr) throw upErr;
  const mapId = mapUpsert.id;
  const { error: delErr } = await supabase.from("map_findings").delete().eq("map_id", mapId).not("source_ref->lab_result_id", "is", null);
  if (delErr) throw delErr;
  if (findings.length) {
    const sevToStored = {
      mild: "info",
      moderate: "warn",
      severe: "critical"
    };
    const rows = findings.map((f) => ({
      map_id: mapId,
      pathway_id: f.pathway_id,
      node_id: f.node_id,
      severity: sevToStored[f.severity] || "info",
      label: f.label,
      detail: f.detail,
      source_ref: { ...f.source_ref, agg_severity: f.severity }
    }));
    const { error: insErr } = await supabase.from("map_findings").insert(rows);
    if (insErr) throw insErr;
  }
  return {
    findings,
    summary,
    visit_id: visitId || null,
    visit_date: visitDate,
    computed_at: computedAt
  };
}
export {
  SEVERITY_LABEL as S,
  runAggregation as r
};
