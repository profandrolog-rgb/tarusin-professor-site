// Расчётные индексы (мета-показатели, НЕ узлы графа).
// Формулы берут значения из lab_results (через простой матчинг по имени/коду).
// Если каких-то входов не хватает — индекс = null и не показывается.

import { rowMatchesComponent, AGGREGATE_NODES, type LabRowLite } from "./aggregateNodes";
import { METABOLIC_INDICES_V28 } from "./clinicalMatrixV28.generated";

export type IndexResult = {
  id: string;
  label: string;
  value: number | null;
  displayValue: string;
  unit: string;
  target: string;
  status: "ok" | "off" | "unknown";
  note?: string;
};

/**
 * Runtime implementation of the five registered v2.8 indices.
 *
 * These are deliberately additive to computeIndices(): the legacy indices
 * remain available, while v2.8 formulas are exact-code based, return NULL
 * semantics as `unknown`, and never create a pathway denominator row.
 */
export function computeMatrixIndicesV28(rows: LabRowLite[]): IndexResult[] {
  const byCode = new Map<string, { value: number; unit: string }>();
  for (const row of rows) {
    const code = String(row.test_code || "").trim().toUpperCase();
    const value = typeof row.value === "number"
      ? row.value
      : Number(String(row.value ?? "").replace(",", "."));
    if (code && Number.isFinite(value) && !byCode.has(code)) {
      byCode.set(code, { value, unit: String(row.unit || "").trim() });
    }
  }
  const get = (code: string) => byCode.get(code);
  const unitsCompatible = (items: Array<{ value: number; unit: string } | undefined>) => {
    const units = new Set(items.map((item) => item?.unit).filter(Boolean));
    return units.size <= 1;
  };
  const make = (id: string, value: number | null, label: string, unit = ""): IndexResult => ({
    id,
    label,
    value,
    displayValue: value == null ? "—" : fmt(value),
    unit,
    target: "по матрице v2.8; пороги не утверждены",
    status: "unknown",
    note: "Производный показатель для отображения; не добавляется в знаменатель и не повышает severity.",
  });
  const out: IndexResult[] = [];

  const quin = get("QUIN");
  const kyna = get("KYNA");
  out.push(make("quin_kyna", quin && kyna && kyna.value !== 0 && unitsCompatible([quin, kyna])
    ? quin.value / kyna.value : null, "QUIN / KYNA"));

  const mha = [get("2MHA"), get("MHA_M_U"), get("MHA_P_U")];
  out.push(make("mha_total", mha.every(Boolean) && unitsCompatible(mha)
    ? mha.reduce((sum, item) => sum + (item?.value ?? 0), 0) : null, "Сумма метилгиппуровых кислот"));

  const la = get("FA_LA");
  const aa = get("FA_AA");
  const epa = get("FA_EPA");
  const dha = get("FA_DHA");
  const ala = get("FA_ALA");
  const ratioInputs = [la, aa, epa, dha, ala];
  const denominator = (epa?.value ?? 0) + (dha?.value ?? 0) + (ala?.value ?? 0);
  out.push(make("omega_ratio", ratioInputs.every(Boolean) && denominator > 0 && unitsCompatible(ratioInputs)
    ? ((la?.value ?? 0) + (aa?.value ?? 0)) / denominator : null, "Омега-6 / Омега-3 (v2.8)"));

  out.push(make("aa_epa", aa && epa && epa.value !== 0 && unitsCompatible([aa, epa])
    ? aa.value / epa.value : null, "AA / EPA (v2.8)"));

  const mead = get("FA_MEAD");
  out.push(make("holman", mead && aa && aa.value !== 0 && unitsCompatible([mead, aa])
    ? mead.value / aa.value : null, "Индекс Холмана (Mead / AA)"));

  // Keep the registry as the source of truth for the five IDs at runtime.
  return out.filter((item) => METABOLIC_INDICES_V28.some((registered) => registered.runtimeId === item.id));
}

// Найти первое численное значение из lab_results по списку алиасов (name/code).
function findValue(rows: LabRowLite[], aliases: string[]): { value: number; unit: string } | null {
  for (const r of rows) {
    const name = String(r.test_name || "").toLowerCase();
    const code = String(r.test_code || "").toLowerCase();
    const matched = aliases.some((a) => rowMatchesComponent(r, a)) || aliases.some((a) => {
      const needle = a.toLowerCase().trim();
      return needle && (name.includes(needle) || code === needle);
    });
    if (!matched) continue;
    const n = typeof r.value === "number" ? r.value : Number(String(r.value ?? "").replace(",", "."));
    if (Number.isFinite(n)) return { value: n, unit: r.unit || "" };
  }
  return null;
}

// Сумма значений всех строк, матчащих любой алиас (в одинаковых единицах).
function sumValues(rows: LabRowLite[], aliases: string[]): { value: number; unit: string } | null {
  const seen = new Set<string>();
  const matched: LabRowLite[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    if (aliases.some((a) => rowMatchesComponent(r, a))) { seen.add(r.id); matched.push(r); }
  }
  if (!matched.length) return null;
  const units = new Set(matched.map((m) => (m.unit || "").trim()).filter(Boolean));
  if (units.size > 1) return null;
  let s = 0, any = false;
  for (const r of matched) {
    const n = typeof r.value === "number" ? r.value : Number(String(r.value ?? "").replace(",", "."));
    if (Number.isFinite(n)) { s += n; any = true; }
  }
  if (!any) return null;
  return { value: s, unit: units.size === 1 ? Array.from(units)[0] : "" };
}

// Оценка статуса по строке target вида ">8%", "<4:1", "<3", "<0.2".
function evalTarget(value: number, target: string): "ok" | "off" | "unknown" {
  const t = target.trim();
  const m = t.match(/^([<>]=?)\s*([\d.,]+)/);
  if (!m) return "unknown";
  const op = m[1];
  const num = Number(m[2].replace(",", "."));
  if (!Number.isFinite(num)) return "unknown";
  switch (op) {
    case ">": return value > num ? "ok" : "off";
    case ">=": return value >= num ? "ok" : "off";
    case "<": return value < num ? "ok" : "off";
    case "<=": return value <= num ? "ok" : "off";
  }
  return "unknown";
}

function fmt(n: number): string {
  if (Math.abs(n) >= 100) return n.toFixed(1);
  if (Math.abs(n) >= 10) return n.toFixed(2);
  return n.toFixed(3).replace(/\.?0+$/, "");
}

export function computeIndices(rows: LabRowLite[]): IndexResult[] {
  const out: IndexResult[] = [];

  // Компоненты полного спектра ЖК (для omega3_index): все омега-3/6/9 + SFA/MUFA + транс
  const allFaAliases = Array.from(new Set(
    AGGREGATE_NODES
      .filter((a) => ["omega3", "omega6", "omega9", "sfa_mufa", "trans_fa"].includes(a.node_id))
      .flatMap((a) => a.components)
  ));

  // 1) omega3_index = (EPA + DHA) / сумма всех ЖК × 100 (только если все в %)
  {
    const epa = findValue(rows, ["Эйкозапентаеновая", "EPA", "C20:5n3"]);
    const dha = findValue(rows, ["Докозагексаеновая", "DHA", "C22:6n3"]);
    const total = sumValues(rows, allFaAliases);
    if (epa && dha && total && total.value > 0) {
      // Единицы: если не все %, всё равно считаем как долю от суммы (пересчёт допускается)
      const v = ((epa.value + dha.value) / total.value) * 100;
      out.push({
        id: "omega3_index", label: "Омега-3 индекс",
        value: v, displayValue: fmt(v), unit: "%", target: ">8%",
        status: evalTarget(v, ">8"),
        note: "EPA=C20:5n3, DHA=C22:6n3. Считается от суммы спектра ЖК.",
      });
    }
  }

  // 2) omega_ratio = omega6 / omega3
  {
    const o6 = sumValues(rows, AGGREGATE_NODES.find((a) => a.node_id === "omega6")!.components);
    const o3 = sumValues(rows, AGGREGATE_NODES.find((a) => a.node_id === "omega3")!.components);
    if (o6 && o3 && o3.value > 0) {
      const v = o6.value / o3.value;
      out.push({
        id: "omega_ratio", label: "Омега-6 / Омега-3",
        value: v, displayValue: fmt(v), unit: "", target: "<4:1",
        status: evalTarget(v, "<4"),
      });
    }
  }

  // 3) AA / EPA
  {
    const aa = findValue(rows, ["Арахидоновая", "AA", "C20:4n6"]);
    const epa = findValue(rows, ["Эйкозапентаеновая", "EPA", "C20:5n3"]);
    if (aa && epa && epa.value > 0) {
      const v = aa.value / epa.value;
      out.push({ id: "aa_epa", label: "AA / EPA", value: v, displayValue: fmt(v), unit: "", target: "<3", status: evalTarget(v, "<3") });
    }
  }

  // 4) Индекс Холмана = Mead (C20:3n9) / AA (C20:4n6)
  {
    const mead = findValue(rows, ["Мидовая", "Mead", "C20:3n9"]);
    const aa = findValue(rows, ["Арахидоновая", "AA", "C20:4n6"]);
    if (mead && aa && aa.value > 0) {
      const v = mead.value / aa.value;
      out.push({ id: "holman", label: "Индекс Холмана (триен/тетраен)", value: v, displayValue: fmt(v), unit: "", target: "<0.2", status: evalTarget(v, "<0.2") });
    }
  }

  // 5) Этерифиц./свободный карнитин = сумма(C2..C18 ацилкарнитинов) / C0
  {
    const acyls = sumValues(rows, [
      "C2", "C3", "C4", "C5", "C6", "C8", "C10", "C12", "C14", "C16", "C18",
      "Ацетилкарнитин", "Пропионилкарнитин", "Бутирилкарнитин", "Изовалерилкарнитин",
      "Гексаноилкарнитин", "Октаноилкарнитин", "Деканоилкарнитин",
      "Пальмитоилкарнитин", "Стеароилкарнитин", "Олеоилкарнитин",
    ]);
    const c0 = findValue(rows, ["C0", "Свободный карнитин", "Карнитин свободный", "Free carnitine"]);
    if (acyls && c0 && c0.value > 0) {
      const v = acyls.value / c0.value;
      out.push({ id: "carnitine_ester_ratio", label: "Этерифиц./свободный карнитин", value: v, displayValue: fmt(v), unit: "", target: "<0.4", status: evalTarget(v, "<0.4") });
    }
  }

  // 6) C3/C2
  {
    const c3 = findValue(rows, ["C3", "Пропионилкарнитин"]);
    const c2 = findValue(rows, ["C2", "Ацетилкарнитин"]);
    if (c3 && c2 && c2.value > 0) {
      const v = c3.value / c2.value;
      out.push({ id: "c3_c2", label: "C3 / C2", value: v, displayValue: fmt(v), unit: "", target: "по бланку", status: "unknown", note: "Скрининг B12/пропионовой ацидемии." });
    }
  }

  // 7) T / DHT
  {
    const t = findValue(rows, ["Тестостерон общий", "Тестостерон", "Testosterone", "TESTO"]);
    const dht = findValue(rows, ["Дигидротестостерон", "DHT"]);
    if (t && dht && dht.value > 0) {
      const v = t.value / dht.value;
      out.push({ id: "t_dht", label: "T / DHT", value: v, displayValue: fmt(v), unit: "", target: "по возрасту", status: "unknown", note: "Активность 5α-редуктазы." });
    }
  }

  // 8) T / E2 — приводим единицы к общей шкале (нмоль/л)
  {
    const t = findValue(rows, ["Тестостерон общий", "Тестостерон", "Testosterone", "TESTO"]);
    const e2 = findValue(rows, ["Эстрадиол", "Estradiol", "E2"]) || rows
      .filter((r) => /эстрадиол|estradiol/i.test(String(r.test_name || "")))
      .map((r) => ({ value: Number(String(r.value ?? "").replace(",", ".")), unit: r.unit || "" }))
      .find((r) => Number.isFinite(r.value)) || null;
    if (t && e2 && e2.value > 0) {
      const uT = (t.unit || "").toLowerCase().replace(/\s+/g, "");
      const uE = (e2.unit || "").toLowerCase().replace(/\s+/g, "");
      // T: пмоль/л → нмоль/л (÷1000); нг/мл → нмоль/л (×3.467); нмоль/л как есть.
      let tNmol = t.value;
      if (uT.includes("пмоль") || uT.includes("pmol")) tNmol = t.value / 1000;
      else if (uT.includes("нг/мл") || uT.includes("ng/ml")) tNmol = t.value * 3.467;
      // E2: пмоль/л → нмоль/л (÷1000); пг/мл → нмоль/л (×3.671/1000); нмоль/л как есть.
      let e2Nmol = e2.value;
      if (uE.includes("пмоль") || uE.includes("pmol")) e2Nmol = e2.value / 1000;
      else if (uE.includes("пг/мл") || uE.includes("pg/ml")) e2Nmol = (e2.value * 3.671) / 1000;
      const v = e2Nmol > 0 ? tNmol / e2Nmol : null;
      if (v != null && Number.isFinite(v)) {
        out.push({
          id: "t_e2", label: "T / E2", value: v, displayValue: fmt(v),
          unit: "", target: "по возрасту/полу", status: "unknown",
          note: `Активность ароматазы. Единицы приведены к нмоль/л (T: ${t.unit || "?"}, E2: ${e2.unit || "?"}).`,
        });
      }
    }
  }

  // 9) FAI = T / SHBG × 100
  {
    const t = findValue(rows, ["Тестостерон общий", "Тестостерон", "Testosterone", "TESTO"]);
    const shbg = findValue(rows, ["ГСПГ", "SHBG", "Глобулин, связывающий половые гормоны"]);
    if (t && shbg && shbg.value > 0) {
      const v = (t.value / shbg.value) * 100;
      out.push({ id: "fai", label: "Свободный андрогенный индекс (FAI)", value: v, displayValue: fmt(v), unit: "", target: "по возрасту/полу", status: "unknown" });
    }
  }

  return out;
}
