import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useRef, useMemo, useEffect, lazy, useState, Suspense, Fragment as Fragment$1, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, l as DialogFooter, B as Button, t as toast, s as supabase, n as cn, C as Card, a as CardContent, c as CardHeader, d as CardTitle, b as Badge, L as Label, I as Input, e as useToast, u as useAuth, r as Checkbox } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { Loader2, RotateCcw, Save, TrendingUp, Camera, UserPlus, Trash2, ChevronRight, ChevronDown, ScaleIcon, Download, Beaker, Sparkles, AlertTriangle, ShieldQuestion, CheckCircle2, ArrowUpRight, ArrowDownRight, Database, ChevronUp, ClipboardList, AlertCircle, ArrowLeft, Activity, RefreshCw, Printer, Pencil, Pill, ShieldAlert, Info } from "lucide-react";
import { S as SEVERITY_LABEL, r as runAggregation } from "./aggregator-U0tC1iI4.js";
import { f as fetchPathwayTexts, a as fetchPathwaySeverityTexts, R as REGISTER_LABEL, p as pickSeverityText, b as pickText } from "./texts-CVx3FMtc.js";
import { P as PathwaySceneSVG, S as SEVERITY_COLORS, a as SEVERITY_ORDER, g as getTemplate, t as templateToScene, b as buildAutoScene, R as RxBlock } from "./autoLayout-ewZEOAZ4.js";
import "vite-react-ssg";
import "@tanstack/react-query";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@supabase/supabase-js";
import "i18next";
import "@radix-ui/react-dropdown-menu";
import "react-i18next";
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "@radix-ui/react-select";
const CODE_NODE_MAP = {
  lipids: {
    CHOL: "total_chol",
    LDL: "ldl",
    HDL: "hdl",
    VLDL: "vldl",
    TG: "tg"
  },
  methylation: {
    HCY: "homocysteine",
    B12: "b12",
    FOLATE: "folate",
    B6: "b6",
    // OA-панель: метилмалоновая кислота — маркер функционального дефицита B12
    MMA_U: "b12"
  },
  iron: {
    FERR: "ferritin_store",
    IRON: "serum_iron",
    TRF: "transferrin",
    TSAT: "tsat",
    TIBC: "tibc",
    HGB: "hemoglobin",
    MCV: "mcv"
  },
  thyroid: {
    TSH: "pituitary_tsh",
    FT4: "ft4",
    FT3: "ft3",
    TPOAB: "tpo_ab"
  },
  insulin_glucose: {
    GLU: "glucose",
    INS: "insulin",
    HOMA: "homa",
    HBA1C: "hba1c",
    CPEP: "c_peptide"
  },
  bone_mineral: {
    VITD: "vitamin_d",
    PTH: "pth",
    CA: "calcium",
    PHOS: "phosphorus",
    ALP: "alp",
    // OA-панель: оксалатный обмен
    OXAL: "oxalate",
    GLYCOL: "glycolate",
    GLYCER: "glycerate"
  },
  inflammation: {
    CRP: "crp",
    ESR: "esr",
    ALB: "albumin",
    FERR: "ferritin_react"
  },
  oxidative_stress: {
    UA: "uric_acid",
    SE: "selenium_ox",
    VITE: "vit_e"
  },
  electrolytes_abr: {
    K: "potassium",
    NA: "sodium",
    CL: "chloride",
    HCO3: "bicarbonate"
  },
  energy_tca: {
    LAC: "lactate",
    LDH: "ldh",
    MG: "magnesium",
    GLU: "glucose",
    CK: "ck",
    // OA-панель: ЦТК + кетоны
    LACT_U: "lactate_u",
    PYR_U: "pyruvate_u",
    CITR_U: "citrate_u",
    ACON: "cis_aconitate",
    ISOCIT: "isocitrate",
    AKG: "akg",
    SUCC: "succinate",
    FUM: "fumarate",
    MAL: "malate",
    "3HB": "hydroxybutyrate3",
    ACAC: "acetoacetate"
  },
  amino_urea: {
    NH3: "ammonia",
    CITR: "citrulline",
    UREA: "urea",
    ARG: "arginine",
    ORN: "ornithine"
  },
  micronutrients_steroid: {
    ZN: "zinc",
    CU: "copper",
    SE: "selenium"
  },
  detox_p12: {
    ALT: "alt",
    AST: "ast",
    GGT: "ggt",
    TBIL: "bilirubin",
    // OA-панель: маркеры детокса и глутатионового цикла
    PYROGLU: "pyroglutamate",
    OROT: "orotate",
    "2MHA": "mha2",
    PGA: "pga",
    MANDEL: "mandelate",
    "2HB": "hb2",
    NAA: "naa"
  },
  gut_permeability: {
    CALPRO: "calprotectin",
    ZONULIN: "zonulin",
    SIGA: "siga",
    // OA-панель: дисбиоз/бактериальные метаболиты
    BENZ: "benzoate",
    PHPAA: "hpaa_p",
    PHBA: "hba_p",
    HIPP: "hippurate",
    TCBA: "tcba",
    IAA: "iaa",
    CAFF: "caffeate",
    TART: "tartarate",
    ARAB: "arabinose",
    OHPAA: "hpaa_o"
  },
  hpg_axis: {
    TESTO: "testosterone",
    FTESTO: "free_t",
    LH: "lh",
    FSH: "fsh",
    INHB: "inhibin_b",
    PRL: "prolactin",
    E2: "estradiol",
    SHBG: "shbg",
    AMH: "amh"
  },
  hpo_axis: {
    FSH: "fsh",
    LH: "lh",
    E2: "estradiol",
    PROG: "progesterone",
    AMH: "amh",
    INHB: "inhibin_b",
    PRL: "prolactin"
  },
  androgens_pcos: {
    TESTO: "testosterone",
    DHEAS: "dhea_s",
    OHP17: "ohp17",
    SHBG: "shbg",
    FAI: "fai"
  },
  prolactin_reg: {
    PRL: "prolactin",
    MACROPRL: "macroprl"
  },
  hpa: {
    CORT: "cortisol",
    DHEAS: "dhea_s"
  },
  growth_igf1: {
    IGF1: "igf1",
    IGFBP3: "igfbp3"
  },
  steroidogenesis: {
    CHOL: "cholesterol",
    PREGNENOLONE: "pregnenolone",
    "17OH_PREGNENOLONE": "17oh_pregnenolone",
    PROG: "progesterone",
    OHP17: "ohp17",
    "11_DEOXYCORTISOL": "11_deoxycortisol",
    CORT: "cortisol",
    DOC: "doc",
    CORTICOSTERONE: "corticosterone",
    ALDOSTERONE: "aldosterone",
    DHEAS: "dhea_s",
    ANDROSTENEDIONE: "androstenedione",
    TESTO: "testosterone",
    DHT: "dht",
    E2: "estradiol"
  },
  endocrine_disruptors: {
    BPA: "bpa",
    BPS: "bps",
    BPF: "bpf",
    MEHP: "mehp",
    MEP: "mep",
    MBP: "mbp",
    MBZP: "mbzp",
    PARABENS: "parabens"
  },
  vit_d_bone: {
    VITD: "vitamin_d",
    "25OHD": "vitamin_d",
    "1_25OHD": "vitamin_d_active",
    CALCITRIOL: "vitamin_d_active",
    PTH: "pth",
    CA: "calcium",
    PHOS: "phosphate",
    ALP: "alp"
  }
};
const asciiCodeRe = /^[A-Z0-9_]{2,12}$/;
function norm$2(s) {
  return String(s ?? "").toLowerCase().trim();
}
function buildCatalogIndex(rows) {
  const entries = [];
  for (const row of rows || []) {
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
    const keys = aliases.map((a) => norm$2(a)).filter(Boolean);
    const tokens = keys.map((k) => k.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 3));
    entries.push({ code, keys, tokens });
  }
  entries.sort((a, b) => Number(asciiCodeRe.test(b.code)) - Number(asciiCodeRe.test(a.code)));
  return entries;
}
function resolveCode(testName, catalog) {
  const nm = norm$2(testName);
  if (!nm) return null;
  const labTokens = new Set(nm.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 3));
  for (const e of catalog) {
    const hitDirect = e.keys.includes(nm);
    const hitSubstr = !hitDirect && e.keys.some((k) => k.length >= 3 && nm.includes(k));
    const hitTokens = !hitDirect && !hitSubstr && labTokens.size > 0 && e.tokens.some((tt) => tt.length > 0 && tt.every((t) => labTokens.has(t)));
    if (hitDirect || hitSubstr || hitTokens) return e.code;
  }
  return null;
}
const AGGREGATE_NODES = [
  {
    node_id: "omega3",
    label: "Омега-3 (сумма)",
    op: "sum",
    components: [
      "Альфа-линоленовая",
      "ALA",
      "Эйкозапентаеновая",
      "EPA",
      "Докозапентаеновая",
      "DPA",
      "Докозагексаеновая",
      "DHA",
      "C18:3n3",
      "C20:5n3",
      "C22:5n3",
      "C22:6n3"
    ]
  },
  {
    node_id: "omega6",
    label: "Омега-6 (сумма)",
    op: "sum",
    components: [
      "Линолевая",
      "LA",
      "Гамма-линоленовая",
      "GLA",
      "Дигомо-гамма-линоленовая",
      "DGLA",
      "Арахидоновая",
      "AA",
      "C18:2n6",
      "C18:3n6",
      "C20:3n6",
      "C20:4n6"
    ]
  },
  {
    node_id: "omega9",
    label: "Омега-9 (сумма)",
    op: "sum",
    components: ["Олеиновая", "Мидовая", "Mead", "Нервоновая", "Эруковая", "C18:1n9", "C20:3n9", "C24:1n9"]
  },
  {
    node_id: "sfa_mufa",
    label: "Насыщенные + МНЖК",
    op: "sum",
    components: ["Пальмитиновая", "Стеариновая", "Миристиновая", "Лауриновая", "Пальмитолеиновая", "C14:0", "C16:0", "C18:0", "C16:1"]
  },
  {
    node_id: "trans_fa",
    label: "Транс-ЖК",
    op: "sum",
    components: ["Элаидиновая", "Линоэлаидиновая", "транс", "trans", "C18:1n9t", "C18:2n6t"]
  },
  {
    node_id: "beta_ox_short",
    label: "Бета-окисление: короткие цепи",
    op: "sum",
    components: ["C2", "C3", "C4", "C5", "Ацетилкарнитин", "Пропионилкарнитин", "Бутирилкарнитин", "Изовалерилкарнитин"]
  },
  {
    node_id: "beta_ox_medium",
    label: "Бета-окисление: средние цепи",
    op: "sum",
    components: ["C6", "C8", "C10", "C12", "Гексаноилкарнитин", "Октаноилкарнитин", "Деканоилкарнитин"]
  },
  {
    node_id: "beta_ox_long",
    label: "Бета-окисление: длинные цепи",
    op: "sum",
    components: ["C14", "C16", "C18", "Пальмитоилкарнитин", "Стеароилкарнитин", "Олеоилкарнитин", "C14:1", "C16:1", "C18:1", "C18:2"]
  }
];
const norm$1 = (s) => String(s ?? "").toLowerCase().trim();
function rowMatchesComponent(row, component) {
  const c = component.trim();
  if (!c) return false;
  const cLow = c.toLowerCase();
  const code = (row.test_code || "").trim().toLowerCase();
  if (code && code === cLow) return true;
  const name = norm$1(row.test_name);
  if (!name) return false;
  const escaped = cLow.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "u");
  return re.test(name);
}
function computeAggregate(cfg, rows) {
  const seen = /* @__PURE__ */ new Set();
  const matched = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    if (cfg.components.some((c) => rowMatchesComponent(r, c))) {
      seen.add(r.id);
      matched.push(r);
    }
  }
  if (!matched.length) return null;
  const units = new Set(matched.map((m) => (m.unit || "").trim()).filter(Boolean));
  if (units.size > 1) {
    return { value: null, unit: Array.from(units).join(" / "), error: "разные единицы" };
  }
  const unit = units.size === 1 ? Array.from(units)[0] : "";
  let sum = 0;
  let anyNum = false;
  for (const r of matched) {
    const n = typeof r.value === "number" ? r.value : Number(String(r.value ?? "").replace(",", "."));
    if (Number.isFinite(n)) {
      sum += n;
      anyNum = true;
    }
  }
  if (!anyNum) return null;
  return { value: Number(sum.toFixed(4)), unit };
}
function computeAllAggregates(rows) {
  const out = /* @__PURE__ */ new Map();
  for (const cfg of AGGREGATE_NODES) {
    const v = computeAggregate(cfg, rows);
    if (!v) continue;
    if ("error" in v) {
      out.set(cfg.node_id, { text: "нет данных", error: v.error });
    } else {
      const u = v.unit ? ` ${v.unit}` : "";
      out.set(cfg.node_id, { text: `${v.value}${u}`.trim() });
    }
  }
  return out;
}
new Set(AGGREGATE_NODES.map((a) => a.node_id));
function findValue(rows, aliases) {
  for (const r of rows) {
    if (!aliases.some((a) => rowMatchesComponent(r, a))) continue;
    const n = typeof r.value === "number" ? r.value : Number(String(r.value ?? "").replace(",", "."));
    if (Number.isFinite(n)) return { value: n, unit: r.unit || "" };
  }
  return null;
}
function sumValues(rows, aliases) {
  const seen = /* @__PURE__ */ new Set();
  const matched = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    if (aliases.some((a) => rowMatchesComponent(r, a))) {
      seen.add(r.id);
      matched.push(r);
    }
  }
  if (!matched.length) return null;
  const units = new Set(matched.map((m) => (m.unit || "").trim()).filter(Boolean));
  if (units.size > 1) return null;
  let s = 0, any = false;
  for (const r of matched) {
    const n = typeof r.value === "number" ? r.value : Number(String(r.value ?? "").replace(",", "."));
    if (Number.isFinite(n)) {
      s += n;
      any = true;
    }
  }
  if (!any) return null;
  return { value: s, unit: units.size === 1 ? Array.from(units)[0] : "" };
}
function evalTarget(value, target) {
  const t = target.trim();
  const m = t.match(/^([<>]=?)\s*([\d.,]+)/);
  if (!m) return "unknown";
  const op = m[1];
  const num = Number(m[2].replace(",", "."));
  if (!Number.isFinite(num)) return "unknown";
  switch (op) {
    case ">":
      return value > num ? "ok" : "off";
    case ">=":
      return value >= num ? "ok" : "off";
    case "<":
      return value < num ? "ok" : "off";
    case "<=":
      return value <= num ? "ok" : "off";
  }
  return "unknown";
}
function fmt(n) {
  if (Math.abs(n) >= 100) return n.toFixed(1);
  if (Math.abs(n) >= 10) return n.toFixed(2);
  return n.toFixed(3).replace(/\.?0+$/, "");
}
function computeIndices(rows) {
  const out = [];
  const allFaAliases = Array.from(new Set(
    AGGREGATE_NODES.filter((a) => ["omega3", "omega6", "omega9", "sfa_mufa", "trans_fa"].includes(a.node_id)).flatMap((a) => a.components)
  ));
  {
    const epa = findValue(rows, ["Эйкозапентаеновая", "EPA", "C20:5n3"]);
    const dha = findValue(rows, ["Докозагексаеновая", "DHA", "C22:6n3"]);
    const total = sumValues(rows, allFaAliases);
    if (epa && dha && total && total.value > 0) {
      const v = (epa.value + dha.value) / total.value * 100;
      out.push({
        id: "omega3_index",
        label: "Омега-3 индекс",
        value: v,
        displayValue: fmt(v),
        unit: "%",
        target: ">8%",
        status: evalTarget(v, ">8"),
        note: "EPA=C20:5n3, DHA=C22:6n3. Считается от суммы спектра ЖК."
      });
    }
  }
  {
    const o6 = sumValues(rows, AGGREGATE_NODES.find((a) => a.node_id === "omega6").components);
    const o3 = sumValues(rows, AGGREGATE_NODES.find((a) => a.node_id === "omega3").components);
    if (o6 && o3 && o3.value > 0) {
      const v = o6.value / o3.value;
      out.push({
        id: "omega_ratio",
        label: "Омега-6 / Омега-3",
        value: v,
        displayValue: fmt(v),
        unit: "",
        target: "<4:1",
        status: evalTarget(v, "<4")
      });
    }
  }
  {
    const aa = findValue(rows, ["Арахидоновая", "AA", "C20:4n6"]);
    const epa = findValue(rows, ["Эйкозапентаеновая", "EPA", "C20:5n3"]);
    if (aa && epa && epa.value > 0) {
      const v = aa.value / epa.value;
      out.push({ id: "aa_epa", label: "AA / EPA", value: v, displayValue: fmt(v), unit: "", target: "<3", status: evalTarget(v, "<3") });
    }
  }
  {
    const mead = findValue(rows, ["Мидовая", "Mead", "C20:3n9"]);
    const aa = findValue(rows, ["Арахидоновая", "AA", "C20:4n6"]);
    if (mead && aa && aa.value > 0) {
      const v = mead.value / aa.value;
      out.push({ id: "holman", label: "Индекс Холмана (триен/тетраен)", value: v, displayValue: fmt(v), unit: "", target: "<0.2", status: evalTarget(v, "<0.2") });
    }
  }
  {
    const acyls = sumValues(rows, [
      "C2",
      "C3",
      "C4",
      "C5",
      "C6",
      "C8",
      "C10",
      "C12",
      "C14",
      "C16",
      "C18",
      "Ацетилкарнитин",
      "Пропионилкарнитин",
      "Бутирилкарнитин",
      "Изовалерилкарнитин",
      "Гексаноилкарнитин",
      "Октаноилкарнитин",
      "Деканоилкарнитин",
      "Пальмитоилкарнитин",
      "Стеароилкарнитин",
      "Олеоилкарнитин"
    ]);
    const c0 = findValue(rows, ["C0", "Свободный карнитин", "Карнитин свободный", "Free carnitine"]);
    if (acyls && c0 && c0.value > 0) {
      const v = acyls.value / c0.value;
      out.push({ id: "carnitine_ester_ratio", label: "Этерифиц./свободный карнитин", value: v, displayValue: fmt(v), unit: "", target: "<0.4", status: evalTarget(v, "<0.4") });
    }
  }
  {
    const c3 = findValue(rows, ["C3", "Пропионилкарнитин"]);
    const c2 = findValue(rows, ["C2", "Ацетилкарнитин"]);
    if (c3 && c2 && c2.value > 0) {
      const v = c3.value / c2.value;
      out.push({ id: "c3_c2", label: "C3 / C2", value: v, displayValue: fmt(v), unit: "", target: "по бланку", status: "unknown", note: "Скрининг B12/пропионовой ацидемии." });
    }
  }
  {
    const t = findValue(rows, ["Тестостерон общий", "Тестостерон", "Testosterone", "TESTO"]);
    const dht = findValue(rows, ["Дигидротестостерон", "DHT"]);
    if (t && dht && dht.value > 0) {
      const v = t.value / dht.value;
      out.push({ id: "t_dht", label: "T / DHT", value: v, displayValue: fmt(v), unit: "", target: "по возрасту", status: "unknown", note: "Активность 5α-редуктазы." });
    }
  }
  {
    const t = findValue(rows, ["Тестостерон общий", "Тестостерон", "Testosterone", "TESTO"]);
    const e2 = findValue(rows, ["Эстрадиол", "Estradiol", "E2"]);
    if (t && e2 && e2.value > 0) {
      const v = t.value / e2.value;
      out.push({ id: "t_e2", label: "T / E2", value: v, displayValue: fmt(v), unit: "", target: "по возрасту/полу", status: "unknown", note: "Активность ароматазы." });
    }
  }
  {
    const t = findValue(rows, ["Тестостерон общий", "Тестостерон", "Testosterone", "TESTO"]);
    const shbg = findValue(rows, ["ГСПГ", "SHBG", "Глобулин, связывающий половые гормоны"]);
    if (t && shbg && shbg.value > 0) {
      const v = t.value / shbg.value * 100;
      out.push({ id: "fai", label: "Свободный андрогенный индекс (FAI)", value: v, displayValue: fmt(v), unit: "", target: "по возрасту/полу", status: "unknown" });
    }
  }
  return out;
}
const COLORS = {
  green: "#3f7d4f",
  yellow: "#E0A800",
  red: "#C0392B"
};
const AXIS = "#20303f";
const GREY = "#9AA6B2";
const VERDICT = {
  green: "в норме",
  yellow: "пограничное",
  red: "вне цели"
};
function cfgFor(id, sex) {
  switch (id) {
    case "omega3_index":
      return {
        kind: "higher_better",
        domain: [0, 12],
        unit: "%",
        subLabel: "EPA+DHA",
        zones: [{ from: 0, to: 4, color: "red" }, { from: 4, to: 8, color: "yellow" }, { from: 8, to: 12, color: "green" }]
      };
    case "omega_ratio":
      return {
        kind: "lower_better",
        domain: [0, 12],
        zones: [{ from: 0, to: 4, color: "green" }, { from: 4, to: 7, color: "yellow" }, { from: 7, to: 12, color: "red" }]
      };
    case "aa_epa":
      return {
        kind: "lower_better",
        domain: [0, 15],
        zones: [{ from: 0, to: 3, color: "green" }, { from: 3, to: 6, color: "yellow" }, { from: 6, to: 15, color: "red" }]
      };
    case "holman":
      return {
        kind: "lower_better",
        domain: [0, 1],
        zones: [{ from: 0, to: 0.2, color: "green" }, { from: 0.2, to: 0.4, color: "yellow" }, { from: 0.4, to: 1, color: "red" }]
      };
    case "carnitine_ester_ratio":
      return {
        kind: "lower_better",
        domain: [0, 1.2],
        zones: [{ from: 0, to: 0.4, color: "green" }, { from: 0.4, to: 0.6, color: "yellow" }, { from: 0.6, to: 1.2, color: "red" }]
      };
    case "fai":
      if (sex === "F") return {
        kind: "band",
        domain: [0, 8],
        zones: [{ from: 0, to: 0.3, color: "red" }, { from: 0.3, to: 5.4, color: "green" }, { from: 5.4, to: 8, color: "red" }]
      };
      return {
        kind: "band",
        domain: [0, 120],
        zones: [{ from: 0, to: 35, color: "red" }, { from: 35, to: 100, color: "green" }, { from: 100, to: 120, color: "red" }]
      };
    case "t_dht":
      return {
        kind: "band",
        domain: [0, 30],
        zones: [{ from: 0, to: 8, color: "red" }, { from: 8, to: 16, color: "green" }, { from: 16, to: 30, color: "red" }]
      };
    case "t_e2":
      return null;
    default:
      return null;
  }
}
const CX = 135, CY = 150, R = 95;
function valueToAngleDeg(v, [dMin, dMax]) {
  const clamped = Math.max(dMin, Math.min(dMax, v));
  const t = (clamped - dMin) / (dMax - dMin || 1);
  return 180 - t * 180;
}
function polar(angleDeg, radius = R) {
  const rad = angleDeg * Math.PI / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}
function arcPath(fromAngle, toAngle) {
  const p1 = polar(fromAngle);
  const p2 = polar(toAngle);
  const largeArc = Math.abs(fromAngle - toAngle) > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${R} ${R} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
}
function zoneOfValue(v, zones) {
  for (const z of zones) {
    if (v >= z.from && v <= z.to) return z;
  }
  if (v < zones[0].from) return zones[0];
  return zones[zones.length - 1];
}
function Gauge({ label, ix, cfg }) {
  const hasData = !!(ix && ix.value != null && cfg);
  const zones = (cfg == null ? void 0 : cfg.zones) ?? [];
  const zone = hasData ? zoneOfValue(ix.value, zones) : null;
  const valColor = hasData && zone ? COLORS[zone.color] : GREY;
  return /* @__PURE__ */ jsx("div", { className: "rounded-xl border bg-[#FBFCFD] border-[#DCE3EA] p-2", children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 270 230", className: "w-full h-auto", role: "img", "aria-label": label, children: [
    /* @__PURE__ */ jsx("text", { x: "135", y: "26", textAnchor: "middle", fontSize: "14", fontWeight: "700", fill: "#20303f", children: label }),
    cfg ? zones.map((z, i) => {
      const a1 = valueToAngleDeg(z.from, cfg.domain);
      const a2 = valueToAngleDeg(z.to, cfg.domain);
      return /* @__PURE__ */ jsx("path", { d: arcPath(a1, a2), fill: "none", stroke: COLORS[z.color], strokeWidth: "16", strokeLinecap: "butt" }, i);
    }) : /* @__PURE__ */ jsx("path", { d: arcPath(180, 0), fill: "none", stroke: "#E1E6EB", strokeWidth: "16" }),
    hasData && cfg && (() => {
      const ang = valueToAngleDeg(ix.value, cfg.domain);
      const tip = polar(ang, R - 15);
      return /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("line", { x1: CX, y1: CY, x2: tip.x, y2: tip.y, stroke: AXIS, strokeWidth: "3", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("circle", { cx: CX, cy: CY, r: "6", fill: AXIS })
      ] });
    })(),
    !hasData && /* @__PURE__ */ jsx("circle", { cx: CX, cy: CY, r: "6", fill: GREY }),
    /* @__PURE__ */ jsx("text", { x: "135", y: "182", textAnchor: "middle", fontSize: "30", fontWeight: "700", fill: valColor, children: hasData ? ix.displayValue : "—" }),
    /* @__PURE__ */ jsx("text", { x: "135", y: "200", textAnchor: "middle", fontSize: "11", fill: "#6a7886", children: hasData ? `${ix.unit || ""}${(cfg == null ? void 0 : cfg.subLabel) ? (ix.unit ? " · " : "") + cfg.subLabel : ""}` : "нет данных" }),
    /* @__PURE__ */ jsxs("text", { x: "135", y: "218", textAnchor: "middle", fontSize: "11", fill: "#8a97a4", children: [
      (ix == null ? void 0 : ix.target) ? `цель ${ix.target}` : "",
      zone ? `  ·  ${VERDICT[zone.color]}` : ""
    ] })
  ] }) });
}
const ORDER = [
  { id: "omega3_index", label: "Омега-3 индекс" },
  { id: "omega_ratio", label: "Омега-6 / Омега-3" },
  { id: "aa_epa", label: "AA / EPA" },
  { id: "holman", label: "Индекс Холмана" },
  { id: "carnitine_ester_ratio", label: "Этерифиц./своб. карнитин" },
  { id: "c3_c2", label: "C3 / C2" },
  { id: "fai", label: "FAI" },
  { id: "t_dht", label: "T / DHT" },
  { id: "t_e2", label: "T / E2" }
];
function IndicesGauges({ indices, patientSex }) {
  const byId = new Map(indices.map((i) => [i.id, i]));
  return /* @__PURE__ */ jsx("div", { className: "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", children: ORDER.map((o) => {
    const ix = byId.get(o.id) || null;
    const cfg = cfgFor(o.id, patientSex);
    if (!ix && !cfg) return null;
    return /* @__PURE__ */ jsx(Gauge, { label: o.label, ix, cfg }, o.id);
  }) });
}
const methylationSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 330" role="img" data-pathway="methylation">\n<title>Метилирование / одноуглеродный обмен</title>\n<desc>Метионин, SAM, SAH, гомоцистеин; ветви реметилирования (B12, фолат) и транссульфурации (B6).</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n\n<line x1="150" y1="65" x2="188" y2="65" class="edge" marker-end="url(#arrow)"/>\n<line x1="290" y1="65" x2="328" y2="65" class="edge" marker-end="url(#arrow)"/>\n<line x1="430" y1="65" x2="468" y2="65" class="edge" marker-end="url(#arrow)"/>\n<path d="M545 90 L545 125 L205 125 L205 148" class="edge" marker-end="url(#arrow)"/>\n<path d="M545 90 L545 125 L485 125 L485 148" class="edge" marker-end="url(#arrow)"/>\n<path d="M110 175 L25 175 L25 65 L38 65" class="edge" marker-end="url(#arrow)"/>\n<line x1="140" y1="248" x2="140" y2="202" class="edge" marker-end="url(#arrow)"/>\n<line x1="255" y1="248" x2="255" y2="202" class="edge" marker-end="url(#arrow)"/>\n<line x1="485" y1="248" x2="485" y2="202" class="edge" marker-end="url(#arrow)"/>\n\n<g class="node" data-node-id="methionine" data-node-type="metabolite"><rect class="node-shape" x="40" y="40" width="110" height="50" rx="8"/><text class="lbl lbl-t" x="95" y="65" text-anchor="middle" dominant-baseline="central">Метионин</text></g>\n<g class="node" data-node-id="sam" data-node-type="metabolite"><rect class="node-shape" x="190" y="40" width="100" height="50" rx="8"/><text class="lbl lbl-t" x="240" y="58" text-anchor="middle" dominant-baseline="central">SAM</text><text class="lbl lbl-s" x="240" y="76" text-anchor="middle" dominant-baseline="central">донор CH3</text></g>\n<g class="node" data-node-id="sah" data-node-type="metabolite"><rect class="node-shape" x="330" y="40" width="100" height="50" rx="8"/><text class="lbl lbl-t" x="380" y="58" text-anchor="middle" dominant-baseline="central">SAH</text><text class="lbl lbl-s" x="380" y="76" text-anchor="middle" dominant-baseline="central">продукт</text></g>\n<g class="node" data-node-id="homocysteine" data-node-type="metabolite"><rect class="node-shape" x="470" y="40" width="150" height="50" rx="8"/><text class="lbl lbl-t" x="545" y="65" text-anchor="middle" dominant-baseline="central">Гомоцистеин</text></g>\n\n<g class="node" data-node-id="remethylation" data-node-type="process"><rect class="node-shape" x="110" y="150" width="190" height="50" rx="8"/><text class="lbl lbl-t" x="205" y="175" text-anchor="middle" dominant-baseline="central">Реметилирование</text></g>\n<g class="node" data-node-id="transsulfuration" data-node-type="process"><rect class="node-shape" x="390" y="150" width="190" height="50" rx="8"/><text class="lbl lbl-t" x="485" y="175" text-anchor="middle" dominant-baseline="central">Транссульфурация</text></g>\n\n<g class="node" data-node-id="b12" data-node-type="cofactor"><rect class="node-shape" x="95" y="250" width="90" height="40" rx="8"/><text class="lbl lbl-t" x="140" y="270" text-anchor="middle" dominant-baseline="central">B12</text></g>\n<g class="node" data-node-id="folate" data-node-type="cofactor"><rect class="node-shape" x="200" y="250" width="110" height="40" rx="8"/><text class="lbl lbl-t" x="255" y="270" text-anchor="middle" dominant-baseline="central">Фолат (B9)</text></g>\n<g class="node" data-node-id="b6" data-node-type="cofactor"><rect class="node-shape" x="430" y="250" width="110" height="40" rx="8"/><text class="lbl lbl-t" x="485" y="270" text-anchor="middle" dominant-baseline="central">Витамин B6</text></g>\n</svg>\n';
const ironSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 320" role="img" data-pathway="iron">\n<title>Обмен железа</title>\n<desc>Депо (ферритин), транспорт (трансферрин, насыщение, ОЖСС), сывороточное железо, эритрон (гемоглобин, MCV).</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n\n<line x1="190" y1="70" x2="263" y2="70" class="edge" marker-end="url(#arrow)"/>\n<line x1="425" y1="70" x2="498" y2="70" class="edge" marker-end="url(#arrow)"/>\n<line x1="345" y1="96" x2="345" y2="128" class="edge" marker-end="url(#arrow)"/>\n<line x1="115" y1="96" x2="115" y2="198" class="edge" marker-end="url(#arrow)"/>\n<line x1="190" y1="220" x2="263" y2="150" class="edge" marker-end="url(#arrow)"/>\n\n<g class="node" data-node-id="ferritin_store" data-node-type="store"><rect class="node-shape" x="40" y="44" width="150" height="52" rx="8"/><text class="lbl lbl-t" x="115" y="63" text-anchor="middle" dominant-baseline="central">Депо железа</text><text class="lbl lbl-s" x="115" y="81" text-anchor="middle" dominant-baseline="central">ферритин</text></g>\n\n<g class="node" data-node-id="tsat" data-node-type="marker"><rect class="node-shape" x="265" y="44" width="160" height="52" rx="8"/><text class="lbl lbl-t" x="345" y="63" text-anchor="middle" dominant-baseline="central">Насыщение</text><text class="lbl lbl-s" x="345" y="81" text-anchor="middle" dominant-baseline="central">трансферрина</text></g>\n<g class="node" data-node-id="transferrin" data-node-type="transport"><rect class="node-shape" x="265" y="128" width="160" height="46" rx="8"/><text class="lbl lbl-t" x="345" y="151" text-anchor="middle" dominant-baseline="central">Трансферрин</text></g>\n<g class="node" data-node-id="tibc" data-node-type="marker"><rect class="node-shape" x="445" y="128" width="120" height="46" rx="8"/><text class="lbl lbl-t" x="505" y="151" text-anchor="middle" dominant-baseline="central">ОЖСС</text></g>\n\n<g class="node" data-node-id="erythron" data-node-type="target"><rect class="node-shape" x="500" y="44" width="150" height="52" rx="8"/><text class="lbl lbl-t" x="575" y="63" text-anchor="middle" dominant-baseline="central">Эритрон</text><text class="lbl lbl-s" x="575" y="81" text-anchor="middle" dominant-baseline="central">Hb · MCV</text></g>\n<g class="node" data-node-id="hemoglobin" data-node-type="marker"><rect class="node-shape" x="510" y="200" width="130" height="44" rx="8"/><text class="lbl lbl-t" x="575" y="222" text-anchor="middle" dominant-baseline="central">Гемоглобин</text></g>\n<g class="node" data-node-id="mcv" data-node-type="marker"><rect class="node-shape" x="510" y="256" width="130" height="44" rx="8"/><text class="lbl lbl-t" x="575" y="278" text-anchor="middle" dominant-baseline="central">MCV</text></g>\n<line x1="575" y1="96" x2="575" y2="198" class="edge" marker-end="url(#arrow)"/>\n<line x1="575" y1="244" x2="575" y2="254" class="edge"/>\n\n<g class="node" data-node-id="serum_iron" data-node-type="marker"><rect class="node-shape" x="40" y="200" width="150" height="52" rx="8"/><text class="lbl lbl-t" x="115" y="219" text-anchor="middle" dominant-baseline="central">Сыв. железо</text><text class="lbl lbl-s" x="115" y="237" text-anchor="middle" dominant-baseline="central">транспортное</text></g>\n</svg>\n';
const thyroidSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 300" role="img" data-pathway="thyroid">\n<title>Щитовидная ось</title>\n<desc>ТРГ — ТТГ (гипофиз) — щитовидная железа — Т4 свободный — Т3 свободный — ткани; АТ-ТПО.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n\n<line x1="150" y1="70" x2="188" y2="70" class="edge" marker-end="url(#arrow)"/>\n<line x1="300" y1="70" x2="338" y2="70" class="edge" marker-end="url(#arrow)"/>\n<line x1="450" y1="70" x2="488" y2="70" class="edge" marker-end="url(#arrow)"/>\n<line x1="565" y1="96" x2="565" y2="148" class="edge" marker-end="url(#arrow)"/>\n<path d="M545 174 L400 220 L260 220 L260 96" class="edge" marker-end="url(#arrow)" stroke-dasharray="4 3"/>\n<line x1="415" y1="112" x2="415" y2="70" class="edge" marker-end="url(#arrow)"/>\n\n<g class="node" data-node-id="trh" data-node-type="signal"><rect class="node-shape" x="40" y="44" width="110" height="52" rx="8"/><text class="lbl lbl-t" x="95" y="63" text-anchor="middle" dominant-baseline="central">ТРГ</text><text class="lbl lbl-s" x="95" y="81" text-anchor="middle" dominant-baseline="central">гипоталамус</text></g>\n<g class="node" data-node-id="pituitary_tsh" data-node-type="signal"><rect class="node-shape" x="190" y="44" width="110" height="52" rx="8"/><text class="lbl lbl-t" x="245" y="63" text-anchor="middle" dominant-baseline="central">ТТГ</text><text class="lbl lbl-s" x="245" y="81" text-anchor="middle" dominant-baseline="central">гипофиз</text></g>\n<g class="node" data-node-id="thyroid" data-node-type="organ"><rect class="node-shape" x="340" y="44" width="110" height="52" rx="8"/><text class="lbl lbl-t" x="395" y="63" text-anchor="middle" dominant-baseline="central">Щитовидная</text><text class="lbl lbl-s" x="395" y="81" text-anchor="middle" dominant-baseline="central">железа</text></g>\n<g class="node" data-node-id="ft4" data-node-type="marker"><rect class="node-shape" x="490" y="44" width="150" height="52" rx="8"/><text class="lbl lbl-t" x="565" y="70" text-anchor="middle" dominant-baseline="central">Т4 свободный</text></g>\n\n<g class="node" data-node-id="ft3" data-node-type="marker"><rect class="node-shape" x="490" y="150" width="150" height="46" rx="8"/><text class="lbl lbl-t" x="565" y="173" text-anchor="middle" dominant-baseline="central">Т3 свободный</text></g>\n<g class="node" data-node-id="tissues" data-node-type="target"><rect class="node-shape" x="300" y="150" width="150" height="46" rx="8"/><text class="lbl lbl-t" x="375" y="173" text-anchor="middle" dominant-baseline="central">Ткани-мишени</text></g>\n<line x1="490" y1="173" x2="452" y2="173" class="edge" marker-end="url(#arrow)"/>\n\n<g class="node" data-node-id="tpo_ab" data-node-type="antibody"><rect class="node-shape" x="345" y="220" width="140" height="46" rx="8"/><text class="lbl lbl-t" x="415" y="243" text-anchor="middle" dominant-baseline="central">АТ-ТПО</text></g>\n</svg>\n';
const insulinGlucoseSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 320" role="img" data-pathway="insulin_glucose">\n<title>Инсулин-глюкоза / инсулинорезистентность</title>\n<desc>Поджелудочная — инсулин — рецептор — мышцы/жир; глюкоза, HOMA-IR, HbA1c, C-пептид.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n\n<line x1="190" y1="70" x2="228" y2="70" class="edge" marker-end="url(#arrow)"/>\n<line x1="380" y1="70" x2="418" y2="70" class="edge" marker-end="url(#arrow)"/>\n<line x1="570" y1="70" x2="608" y2="70" class="edge" marker-end="url(#arrow)"/>\n<path d="M115 96 L115 130 L300 130 L300 44" class="edge" marker-end="url(#arrow)" stroke-dasharray="4 3"/>\n<line x1="305" y1="200" x2="305" y2="96" class="edge" marker-end="url(#arrow)"/>\n<line x1="130" y1="222" x2="130" y2="96" class="edge" marker-end="url(#arrow)"/>\n<line x1="480" y1="222" x2="480" y2="96" class="edge" marker-end="url(#arrow)"/>\n\n<g class="node" data-node-id="pancreas" data-node-type="organ"><rect class="node-shape" x="40" y="44" width="150" height="52" rx="8"/><text class="lbl lbl-t" x="115" y="63" text-anchor="middle" dominant-baseline="central">Поджелудочная</text><text class="lbl lbl-s" x="115" y="81" text-anchor="middle" dominant-baseline="central">β-клетки</text></g>\n<g class="node" data-node-id="insulin" data-node-type="hormone"><rect class="node-shape" x="230" y="44" width="150" height="52" rx="8"/><text class="lbl lbl-t" x="305" y="70" text-anchor="middle" dominant-baseline="central">Инсулин</text></g>\n<g class="node" data-node-id="insulin_receptor" data-node-type="receptor"><rect class="node-shape" x="420" y="44" width="150" height="52" rx="8"/><text class="lbl lbl-t" x="495" y="63" text-anchor="middle" dominant-baseline="central">Рецептор</text><text class="lbl lbl-s" x="495" y="81" text-anchor="middle" dominant-baseline="central">инсулина</text></g>\n<g class="node" data-node-id="muscle" data-node-type="target"><rect class="node-shape" x="610" y="44" width="60" height="52" rx="8"/><text class="lbl lbl-t" x="640" y="70" text-anchor="middle" dominant-baseline="central">Ткани</text></g>\n\n<g class="node" data-node-id="glucose" data-node-type="marker"><rect class="node-shape" x="230" y="200" width="150" height="46" rx="8"/><text class="lbl lbl-t" x="305" y="223" text-anchor="middle" dominant-baseline="central">Глюкоза</text></g>\n<g class="node" data-node-id="homa" data-node-type="index"><rect class="node-shape" x="55" y="222" width="150" height="46" rx="8"/><text class="lbl lbl-t" x="130" y="245" text-anchor="middle" dominant-baseline="central">HOMA-IR</text></g>\n<g class="node" data-node-id="hba1c" data-node-type="marker"><rect class="node-shape" x="405" y="222" width="150" height="46" rx="8"/><text class="lbl lbl-t" x="480" y="245" text-anchor="middle" dominant-baseline="central">HbA1c</text></g>\n<g class="node" data-node-id="c_peptide" data-node-type="marker"><rect class="node-shape" x="490" y="150" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="565" y="172" text-anchor="middle" dominant-baseline="central">C-пептид</text></g>\n<line x1="490" y1="172" x2="452" y2="172" class="edge"/>\n</svg>\n';
const boneMineralSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 320" role="img" data-pathway="bone_mineral">\n<title>Костно-минеральный обмен</title>\n<desc>Витамин D — кишечник — кальций; ПТГ регулирует кость, почки, фосфор; щелочная фосфатаза как маркер костного ремоделирования.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n\n<line x1="190" y1="70" x2="248" y2="70" class="edge" marker-end="url(#arrow)"/>\n<line x1="390" y1="70" x2="448" y2="70" class="edge" marker-end="url(#arrow)"/>\n<path d="M525 96 L525 125 L320 125 L320 148" class="edge" marker-end="url(#arrow)" stroke-dasharray="4 3"/>\n<line x1="390" y1="175" x2="448" y2="175" class="edge" marker-end="url(#arrow)"/>\n<line x1="320" y1="200" x2="320" y2="248" class="edge" marker-end="url(#arrow)"/>\n<path d="M250 175 L110 175 L110 248" class="edge" marker-end="url(#arrow)"/>\n<path d="M70 96 L70 248" class="edge" marker-end="url(#arrow)"/>\n<path d="M180 250 L180 232 L535 232 L535 248" class="edge" marker-end="url(#arrow)"/>\n\n<g class="node" data-node-id="vitamin_d" data-node-type="hormone"><rect class="node-shape" x="40" y="44" width="150" height="52" rx="8"/><text class="lbl lbl-t" x="115" y="63" text-anchor="middle" dominant-baseline="central">Витамин D</text><text class="lbl lbl-s" x="115" y="81" text-anchor="middle" dominant-baseline="central">25-OH</text></g>\n<g class="node" data-node-id="gut" data-node-type="organ"><rect class="node-shape" x="250" y="44" width="140" height="52" rx="8"/><text class="lbl lbl-t" x="320" y="63" text-anchor="middle" dominant-baseline="central">Кишечник</text><text class="lbl lbl-s" x="320" y="81" text-anchor="middle" dominant-baseline="central">всасывание</text></g>\n<g class="node" data-node-id="calcium" data-node-type="marker"><rect class="node-shape" x="450" y="44" width="150" height="52" rx="8"/><text class="lbl lbl-t" x="525" y="70" text-anchor="middle" dominant-baseline="central">Кальций</text></g>\n\n<g class="node" data-node-id="pth" data-node-type="hormone"><rect class="node-shape" x="250" y="150" width="140" height="50" rx="8"/><text class="lbl lbl-t" x="320" y="175" text-anchor="middle" dominant-baseline="central">ПТГ</text></g>\n<g class="node" data-node-id="phosphorus" data-node-type="marker"><rect class="node-shape" x="450" y="150" width="150" height="50" rx="8"/><text class="lbl lbl-t" x="525" y="175" text-anchor="middle" dominant-baseline="central">Фосфор</text></g>\n\n<g class="node" data-node-id="bone" data-node-type="target"><rect class="node-shape" x="40" y="250" width="140" height="48" rx="8"/><text class="lbl lbl-t" x="110" y="274" text-anchor="middle" dominant-baseline="central">Кость</text></g>\n<g class="node" data-node-id="kidney" data-node-type="organ"><rect class="node-shape" x="250" y="250" width="140" height="48" rx="8"/><text class="lbl lbl-t" x="320" y="274" text-anchor="middle" dominant-baseline="central">Почки</text></g>\n<g class="node" data-node-id="alp" data-node-type="marker"><rect class="node-shape" x="450" y="250" width="150" height="48" rx="8"/><text class="lbl lbl-t" x="525" y="274" text-anchor="middle" dominant-baseline="central">Щ. фосфатаза</text></g>\n</svg>\n';
const growthIgf1Svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 330" role="img" data-pathway="growth_igf1">\n<title>Ось роста (СТГ/ИФР-1)</title><desc>Соматолиберин и соматостатин регулируют СТГ; печень производит ИФР-1; зоны роста, линейный рост.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="192" y1="84" x2="248" y2="98" class="edge" marker-end="url(#arrow)"/>\n<line x1="192" y1="153" x2="248" y2="137" class="edge" stroke-dasharray="4 3" marker-end="url(#arrow)"/>\n<line x1="392" y1="116" x2="428" y2="117" class="edge" marker-end="url(#arrow)"/>\n<line x1="522" y1="117" x2="558" y2="117" class="edge" marker-end="url(#arrow)"/>\n<line x1="574" y1="141" x2="532" y2="173" class="edge" marker-end="url(#arrow)"/>\n<line x1="500" y1="223" x2="500" y2="243" class="edge" marker-end="url(#arrow)"/>\n<line x1="428" y1="198" x2="402" y2="198" class="edge" marker-end="url(#arrow)"/>\n<line x1="325" y1="223" x2="325" y2="243" class="edge" marker-end="url(#arrow)"/>\n<line x1="445" y1="173" x2="381" y2="144" class="edge" stroke-dasharray="4 3" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="ghrh" data-node-type="signal"><rect class="node-shape" x="40" y="40" width="150" height="50" rx="8"/><text class="lbl lbl-t" x="115.0" y="56.0" text-anchor="middle" dominant-baseline="central">Соматолиберин</text><text class="lbl lbl-s" x="115.0" y="74.0" text-anchor="middle" dominant-baseline="central">GHRH</text></g>\n<g class="node" data-node-id="somatostatin" data-node-type="signal"><rect class="node-shape" x="40" y="150" width="150" height="50" rx="8"/><text class="lbl lbl-t" x="115.0" y="166.0" text-anchor="middle" dominant-baseline="central">Соматостатин</text><text class="lbl lbl-s" x="115.0" y="184.0" text-anchor="middle" dominant-baseline="central">(−)</text></g>\n<g class="node" data-node-id="pituitary_gh" data-node-type="organ"><rect class="node-shape" x="250" y="90" width="140" height="52" rx="8"/><text class="lbl lbl-t" x="320.0" y="107.0" text-anchor="middle" dominant-baseline="central">Гипофиз</text><text class="lbl lbl-s" x="320.0" y="125.0" text-anchor="middle" dominant-baseline="central">СТГ</text></g>\n<g class="node" data-node-id="gh" data-node-type="hormone"><rect class="node-shape" x="430" y="95" width="90" height="44" rx="8"/><text class="lbl lbl-t" x="475.0" y="117.0" text-anchor="middle" dominant-baseline="central">СТГ</text></g>\n<g class="node" data-node-id="liver" data-node-type="organ"><rect class="node-shape" x="560" y="95" width="90" height="44" rx="8"/><text class="lbl lbl-t" x="605.0" y="117.0" text-anchor="middle" dominant-baseline="central">Печень</text></g>\n<g class="node" data-node-id="igf1" data-node-type="marker"><rect class="node-shape" x="430" y="175" width="140" height="46" rx="8"/><text class="lbl lbl-t" x="500.0" y="198.0" text-anchor="middle" dominant-baseline="central">ИФР-1</text></g>\n<g class="node" data-node-id="igfbp3" data-node-type="marker"><rect class="node-shape" x="430" y="245" width="140" height="44" rx="8"/><text class="lbl lbl-t" x="500.0" y="267.0" text-anchor="middle" dominant-baseline="central">ИФРСБ-3</text></g>\n<g class="node" data-node-id="growth_plate" data-node-type="target"><rect class="node-shape" x="250" y="175" width="150" height="46" rx="8"/><text class="lbl lbl-t" x="325.0" y="189.0" text-anchor="middle" dominant-baseline="central">Зоны роста</text><text class="lbl lbl-s" x="325.0" y="207.0" text-anchor="middle" dominant-baseline="central"></text></g>\n<g class="node" data-node-id="bone_growth" data-node-type="target"><rect class="node-shape" x="250" y="245" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="325.0" y="267.0" text-anchor="middle" dominant-baseline="central">Линейный рост</text></g>\n</svg>\n';
const hpaSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 300" role="img" data-pathway="hpa">\n<title>Надпочечники / ось стресса (HPA)</title><desc>КРГ — АКТГ — надпочечники — кортизол и ДГЭА-С; стресс активирует ось.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="162" y1="123" x2="198" y2="111" class="edge" marker-end="url(#arrow)"/>\n<line x1="352" y1="86" x2="388" y2="86" class="edge" marker-end="url(#arrow)"/>\n<line x1="465" y1="114" x2="465" y2="158" class="edge" marker-end="url(#arrow)"/>\n<line x1="388" y1="208" x2="352" y2="219" class="edge" marker-end="url(#arrow)"/>\n<line x1="465" y1="210" x2="465" y2="218" class="edge" marker-end="url(#arrow)"/>\n<line x1="275" y1="218" x2="275" y2="114" class="edge" stroke-dasharray="4 3" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="stress" data-node-type="signal"><rect class="node-shape" x="40" y="120" width="120" height="46" rx="8"/><text class="lbl lbl-t" x="100.0" y="143.0" text-anchor="middle" dominant-baseline="central">Стресс</text></g>\n<g class="node" data-node-id="crh" data-node-type="signal"><rect class="node-shape" x="200" y="60" width="150" height="52" rx="8"/><text class="lbl lbl-t" x="275.0" y="77.0" text-anchor="middle" dominant-baseline="central">КРГ</text><text class="lbl lbl-s" x="275.0" y="95.0" text-anchor="middle" dominant-baseline="central">гипоталамус</text></g>\n<g class="node" data-node-id="acth" data-node-type="signal"><rect class="node-shape" x="390" y="60" width="150" height="52" rx="8"/><text class="lbl lbl-t" x="465.0" y="77.0" text-anchor="middle" dominant-baseline="central">АКТГ</text><text class="lbl lbl-s" x="465.0" y="95.0" text-anchor="middle" dominant-baseline="central">гипофиз</text></g>\n<g class="node" data-node-id="adrenal" data-node-type="organ"><rect class="node-shape" x="390" y="160" width="150" height="48" rx="8"/><text class="lbl lbl-t" x="465.0" y="184.0" text-anchor="middle" dominant-baseline="central">Надпочечники</text></g>\n<g class="node" data-node-id="cortisol" data-node-type="hormone"><rect class="node-shape" x="200" y="220" width="150" height="46" rx="8"/><text class="lbl lbl-t" x="275.0" y="243.0" text-anchor="middle" dominant-baseline="central">Кортизол</text></g>\n<g class="node" data-node-id="dhea_s" data-node-type="hormone"><rect class="node-shape" x="390" y="220" width="150" height="46" rx="8"/><text class="lbl lbl-t" x="465.0" y="243.0" text-anchor="middle" dominant-baseline="central">ДГЭА-С</text></g>\n</svg>\n';
const lipidsSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 300" role="img" data-pathway="lipids">\n<title>Липидный обмен</title><desc>Печень синтезирует ЛПНП/ЛПОНП; ЛПВП — обратный транспорт; индекс атерогенности, сосудистая стенка.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="162" y1="122" x2="208" y2="106" class="edge" marker-end="url(#arrow)"/>\n<line x1="162" y1="154" x2="208" y2="161" class="edge" marker-end="url(#arrow)"/>\n<line x1="342" y1="82" x2="368" y2="82" class="edge" marker-end="url(#arrow)"/>\n<line x1="342" y1="173" x2="368" y2="174" class="edge" marker-end="url(#arrow)"/>\n<line x1="532" y1="175" x2="548" y2="175" class="edge" marker-end="url(#arrow)"/>\n<line x1="236" y1="228" x2="142" y2="170" class="edge" stroke-dasharray="4 3" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="liver" data-node-type="organ"><rect class="node-shape" x="40" y="120" width="120" height="48" rx="8"/><text class="lbl lbl-t" x="100.0" y="144.0" text-anchor="middle" dominant-baseline="central">Печень</text></g>\n<g class="node" data-node-id="vldl" data-node-type="marker"><rect class="node-shape" x="210" y="60" width="130" height="44" rx="8"/><text class="lbl lbl-t" x="275.0" y="82.0" text-anchor="middle" dominant-baseline="central">ЛПОНП</text></g>\n<g class="node" data-node-id="ldl" data-node-type="marker"><rect class="node-shape" x="210" y="150" width="130" height="44" rx="8"/><text class="lbl lbl-t" x="275.0" y="172.0" text-anchor="middle" dominant-baseline="central">ЛПНП</text></g>\n<g class="node" data-node-id="tg" data-node-type="marker"><rect class="node-shape" x="370" y="60" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="445.0" y="82.0" text-anchor="middle" dominant-baseline="central">Триглицериды</text></g>\n<g class="node" data-node-id="hdl" data-node-type="marker"><rect class="node-shape" x="210" y="230" width="130" height="44" rx="8"/><text class="lbl lbl-t" x="275.0" y="252.0" text-anchor="middle" dominant-baseline="central">ЛПВП</text></g>\n<g class="node" data-node-id="total_chol" data-node-type="marker"><rect class="node-shape" x="40" y="230" width="140" height="44" rx="8"/><text class="lbl lbl-t" x="110.0" y="252.0" text-anchor="middle" dominant-baseline="central">Общий ХС</text></g>\n<g class="node" data-node-id="athero" data-node-type="index"><rect class="node-shape" x="370" y="150" width="160" height="50" rx="8"/><text class="lbl lbl-t" x="450.0" y="166.0" text-anchor="middle" dominant-baseline="central">Индекс</text><text class="lbl lbl-s" x="450.0" y="184.0" text-anchor="middle" dominant-baseline="central">атерогенности</text></g>\n<g class="node" data-node-id="vessel" data-node-type="target"><rect class="node-shape" x="550" y="150" width="110" height="50" rx="8"/><text class="lbl lbl-t" x="605.0" y="166.0" text-anchor="middle" dominant-baseline="central">Сосудистая</text><text class="lbl lbl-s" x="605.0" y="184.0" text-anchor="middle" dominant-baseline="central">стенка</text></g>\n</svg>\n';
const inflammationSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 280" role="img" data-pathway="inflammation">\n<title>Воспаление / протеинограмма</title><desc>СРБ, СОЭ, ферритин-реактант; протеинограмма — общий белок, альбумин, глобулины.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="340" y1="88" x2="340" y2="118" class="edge" marker-end="url(#arrow)"/>\n<line x1="340" y1="166" x2="340" y2="198" class="edge" marker-end="url(#arrow)"/>\n<line x1="192" y1="136" x2="478" y2="109" class="edge" marker-end="url(#arrow)"/>\n<line x1="192" y1="150" x2="478" y2="175" class="edge" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="crp" data-node-type="marker"><rect class="node-shape" x="270" y="40" width="140" height="46" rx="8"/><text class="lbl lbl-t" x="340.0" y="63.0" text-anchor="middle" dominant-baseline="central">СРБ</text></g>\n<g class="node" data-node-id="esr" data-node-type="marker"><rect class="node-shape" x="270" y="120" width="140" height="44" rx="8"/><text class="lbl lbl-t" x="340.0" y="142.0" text-anchor="middle" dominant-baseline="central">СОЭ</text></g>\n<g class="node" data-node-id="ferritin_react" data-node-type="marker"><rect class="node-shape" x="270" y="200" width="140" height="50" rx="8"/><text class="lbl lbl-t" x="340.0" y="216.0" text-anchor="middle" dominant-baseline="central">Ферритин</text><text class="lbl lbl-s" x="340.0" y="234.0" text-anchor="middle" dominant-baseline="central">реактант</text></g>\n<g class="node" data-node-id="total_protein" data-node-type="marker"><rect class="node-shape" x="40" y="120" width="150" height="46" rx="8"/><text class="lbl lbl-t" x="115.0" y="143.0" text-anchor="middle" dominant-baseline="central">Общий белок</text></g>\n<g class="node" data-node-id="albumin" data-node-type="marker"><rect class="node-shape" x="480" y="80" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="555.0" y="102.0" text-anchor="middle" dominant-baseline="central">Альбумин</text></g>\n<g class="node" data-node-id="globulins" data-node-type="marker"><rect class="node-shape" x="480" y="160" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="555.0" y="182.0" text-anchor="middle" dominant-baseline="central">Глобулины</text></g>\n</svg>\n';
const oxidativeStressSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 310" role="img" data-pathway="oxidative_stress">\n<title>Оксидативный стресс</title><desc>АФК против антиоксидантной защиты: глутатион, селен, витамины E и C, мочевая кислота.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="162" y1="145" x2="438" y2="145" class="edge" marker-end="url(#arrow)"/>\n<line x1="356" y1="86" x2="450" y2="118" class="edge" marker-end="url(#arrow)"/>\n<line x1="362" y1="136" x2="438" y2="140" class="edge" marker-end="url(#arrow)"/>\n<line x1="362" y1="184" x2="438" y2="166" class="edge" marker-end="url(#arrow)"/>\n<line x1="331" y1="248" x2="478" y2="172" class="edge" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="ros" data-node-type="signal"><rect class="node-shape" x="40" y="120" width="120" height="50" rx="8"/><text class="lbl lbl-t" x="100.0" y="136.0" text-anchor="middle" dominant-baseline="central">АФК</text><text class="lbl lbl-s" x="100.0" y="154.0" text-anchor="middle" dominant-baseline="central">ROS</text></g>\n<g class="node" data-node-id="antiox" data-node-type="process"><rect class="node-shape" x="440" y="120" width="180" height="50" rx="8"/><text class="lbl lbl-t" x="530.0" y="136.0" text-anchor="middle" dominant-baseline="central">Антиоксидантная</text><text class="lbl lbl-s" x="530.0" y="154.0" text-anchor="middle" dominant-baseline="central">защита</text></g>\n<g class="node" data-node-id="glutathione" data-node-type="cofactor"><rect class="node-shape" x="210" y="40" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="285.0" y="62.0" text-anchor="middle" dominant-baseline="central">Глутатион</text></g>\n<g class="node" data-node-id="selenium_ox" data-node-type="cofactor"><rect class="node-shape" x="210" y="110" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="285.0" y="132.0" text-anchor="middle" dominant-baseline="central">Селен</text></g>\n<g class="node" data-node-id="vit_e" data-node-type="cofactor"><rect class="node-shape" x="210" y="180" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="285.0" y="202.0" text-anchor="middle" dominant-baseline="central">Витамин E</text></g>\n<g class="node" data-node-id="vit_c" data-node-type="cofactor"><rect class="node-shape" x="210" y="250" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="285.0" y="272.0" text-anchor="middle" dominant-baseline="central">Витамин C</text></g>\n<g class="node" data-node-id="uric_acid" data-node-type="marker"><rect class="node-shape" x="440" y="220" width="180" height="50" rx="8"/><text class="lbl lbl-t" x="530.0" y="236.0" text-anchor="middle" dominant-baseline="central">Мочевая</text><text class="lbl lbl-s" x="530.0" y="254.0" text-anchor="middle" dominant-baseline="central">кислота</text></g>\n</svg>\n';
const electrolytesAbrSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 300" role="img" data-pathway="electrolytes_abr">\n<title>Электролиты / КЩБ</title><desc>Почки регулируют натрий, калий, хлор; бикарбонат и анионный разрыв — кислотно-щелочной баланс.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="157" y1="118" x2="224" y2="86" class="edge" marker-end="url(#arrow)"/>\n<line x1="162" y1="140" x2="208" y2="137" class="edge" marker-end="url(#arrow)"/>\n<line x1="162" y1="165" x2="208" y2="180" class="edge" marker-end="url(#arrow)"/>\n<line x1="522" y1="150" x2="548" y2="156" class="edge" marker-end="url(#arrow)"/>\n<line x1="522" y1="188" x2="548" y2="182" class="edge" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="kidney" data-node-type="organ"><rect class="node-shape" x="40" y="120" width="120" height="50" rx="8"/><text class="lbl lbl-t" x="100.0" y="145.0" text-anchor="middle" dominant-baseline="central">Почки</text></g>\n<g class="node" data-node-id="sodium" data-node-type="marker"><rect class="node-shape" x="210" y="40" width="130" height="44" rx="8"/><text class="lbl lbl-t" x="275.0" y="62.0" text-anchor="middle" dominant-baseline="central">Натрий</text></g>\n<g class="node" data-node-id="potassium" data-node-type="marker"><rect class="node-shape" x="210" y="110" width="130" height="44" rx="8"/><text class="lbl lbl-t" x="275.0" y="132.0" text-anchor="middle" dominant-baseline="central">Калий</text></g>\n<g class="node" data-node-id="chloride" data-node-type="marker"><rect class="node-shape" x="210" y="180" width="130" height="44" rx="8"/><text class="lbl lbl-t" x="275.0" y="202.0" text-anchor="middle" dominant-baseline="central">Хлор</text></g>\n<g class="node" data-node-id="bicarbonate" data-node-type="marker"><rect class="node-shape" x="370" y="110" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="445.0" y="132.0" text-anchor="middle" dominant-baseline="central">Бикарбонат</text></g>\n<g class="node" data-node-id="anion_gap" data-node-type="index"><rect class="node-shape" x="370" y="180" width="150" height="50" rx="8"/><text class="lbl lbl-t" x="445.0" y="196.0" text-anchor="middle" dominant-baseline="central">Анионный</text><text class="lbl lbl-s" x="445.0" y="214.0" text-anchor="middle" dominant-baseline="central">разрыв</text></g>\n<g class="node" data-node-id="acid_base" data-node-type="target"><rect class="node-shape" x="550" y="145" width="110" height="50" rx="8"/><text class="lbl lbl-t" x="605.0" y="170.0" text-anchor="middle" dominant-baseline="central">КЩБ</text></g>\n</svg>\n';
const energyTcaSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 300" role="img" data-pathway="energy_tca">\n<title>Энергетика / цикл Кребса</title><desc>Глюкоза — пируват — цикл Кребса — дыхательная цепь; лактат, кофакторы (B-витамины, магний), ЛДГ, КФК.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="172" y1="133" x2="198" y2="133" class="edge" marker-end="url(#arrow)"/>\n<line x1="332" y1="130" x2="358" y2="129" class="edge" marker-end="url(#arrow)"/>\n<line x1="265" y1="158" x2="265" y2="208" class="edge" marker-end="url(#arrow)"/>\n<line x1="502" y1="126" x2="528" y2="126" class="edge" marker-end="url(#arrow)"/>\n<line x1="430" y1="208" x2="430" y2="154" class="edge" marker-end="url(#arrow)"/>\n<line x1="558" y1="208" x2="474" y2="154" class="edge" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="glucose" data-node-type="marker"><rect class="node-shape" x="40" y="110" width="130" height="46" rx="8"/><text class="lbl lbl-t" x="105.0" y="133.0" text-anchor="middle" dominant-baseline="central">Глюкоза</text></g>\n<g class="node" data-node-id="pyruvate" data-node-type="metabolite"><rect class="node-shape" x="200" y="110" width="130" height="46" rx="8"/><text class="lbl lbl-t" x="265.0" y="133.0" text-anchor="middle" dominant-baseline="central">Пируват</text></g>\n<g class="node" data-node-id="lactate" data-node-type="marker"><rect class="node-shape" x="200" y="210" width="130" height="44" rx="8"/><text class="lbl lbl-t" x="265.0" y="232.0" text-anchor="middle" dominant-baseline="central">Лактат</text></g>\n<g class="node" data-node-id="tca" data-node-type="process"><rect class="node-shape" x="360" y="100" width="140" height="52" rx="8"/><text class="lbl lbl-t" x="430.0" y="117.0" text-anchor="middle" dominant-baseline="central">Цикл</text><text class="lbl lbl-s" x="430.0" y="135.0" text-anchor="middle" dominant-baseline="central">Кребса</text></g>\n<g class="node" data-node-id="resp_chain" data-node-type="process"><rect class="node-shape" x="530" y="100" width="130" height="52" rx="8"/><text class="lbl lbl-t" x="595.0" y="117.0" text-anchor="middle" dominant-baseline="central">Дыхательная</text><text class="lbl lbl-s" x="595.0" y="135.0" text-anchor="middle" dominant-baseline="central">цепь</text></g>\n<g class="node" data-node-id="b_vit" data-node-type="cofactor"><rect class="node-shape" x="360" y="210" width="140" height="44" rx="8"/><text class="lbl lbl-t" x="430.0" y="232.0" text-anchor="middle" dominant-baseline="central">B1/B2/B3/B5</text></g>\n<g class="node" data-node-id="magnesium" data-node-type="cofactor"><rect class="node-shape" x="530" y="210" width="130" height="44" rx="8"/><text class="lbl lbl-t" x="595.0" y="232.0" text-anchor="middle" dominant-baseline="central">Магний</text></g>\n<g class="node" data-node-id="ldh" data-node-type="marker"><rect class="node-shape" x="40" y="210" width="60" height="44" rx="8"/><text class="lbl lbl-t" x="70.0" y="232.0" text-anchor="middle" dominant-baseline="central">ЛДГ</text></g>\n<g class="node" data-node-id="ck" data-node-type="marker"><rect class="node-shape" x="110" y="210" width="60" height="44" rx="8"/><text class="lbl lbl-t" x="140.0" y="232.0" text-anchor="middle" dominant-baseline="central">КФК</text></g>\n</svg>\n';
const aminoUreaSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 320" role="img" data-pathway="amino_urea">\n<title>Аминокислоты и цикл мочевины</title><desc>Белок пищи — пул аминокислот — аммиак — цикл мочевины (орнитин, цитруллин, аргинин) — мочевина.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="110" y1="88" x2="110" y2="118" class="edge" marker-end="url(#arrow)"/>\n<line x1="182" y1="144" x2="218" y2="144" class="edge" marker-end="url(#arrow)"/>\n<line x1="343" y1="118" x2="403" y2="92" class="edge" marker-end="url(#arrow)"/>\n<line x1="465" y1="92" x2="465" y2="118" class="edge" marker-end="url(#arrow)"/>\n<line x1="465" y1="166" x2="465" y2="188" class="edge" marker-end="url(#arrow)"/>\n<line x1="465" y1="236" x2="465" y2="258" class="edge" marker-end="url(#arrow)"/>\n<line x1="490" y1="258" x2="585" y2="166" class="edge" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="protein" data-node-type="marker"><rect class="node-shape" x="40" y="40" width="140" height="46" rx="8"/><text class="lbl lbl-t" x="110.0" y="63.0" text-anchor="middle" dominant-baseline="central">Белок пищи</text></g>\n<g class="node" data-node-id="aa_pool" data-node-type="metabolite"><rect class="node-shape" x="40" y="120" width="140" height="50" rx="8"/><text class="lbl lbl-t" x="110.0" y="136.0" text-anchor="middle" dominant-baseline="central">Пул</text><text class="lbl lbl-s" x="110.0" y="154.0" text-anchor="middle" dominant-baseline="central">аминокислот</text></g>\n<g class="node" data-node-id="bcaa" data-node-type="marker"><rect class="node-shape" x="40" y="210" width="140" height="44" rx="8"/><text class="lbl lbl-t" x="110.0" y="232.0" text-anchor="middle" dominant-baseline="central">BCAA</text></g>\n<g class="node" data-node-id="ammonia" data-node-type="marker"><rect class="node-shape" x="220" y="120" width="130" height="46" rx="8"/><text class="lbl lbl-t" x="285.0" y="143.0" text-anchor="middle" dominant-baseline="central">Аммиак</text></g>\n<g class="node" data-node-id="urea_cycle" data-node-type="process"><rect class="node-shape" x="390" y="40" width="150" height="50" rx="8"/><text class="lbl lbl-t" x="465.0" y="56.0" text-anchor="middle" dominant-baseline="central">Цикл</text><text class="lbl lbl-s" x="465.0" y="74.0" text-anchor="middle" dominant-baseline="central">мочевины</text></g>\n<g class="node" data-node-id="ornithine" data-node-type="metabolite"><rect class="node-shape" x="390" y="120" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="465.0" y="142.0" text-anchor="middle" dominant-baseline="central">Орнитин</text></g>\n<g class="node" data-node-id="citrulline" data-node-type="marker"><rect class="node-shape" x="390" y="190" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="465.0" y="212.0" text-anchor="middle" dominant-baseline="central">Цитруллин</text></g>\n<g class="node" data-node-id="arginine" data-node-type="metabolite"><rect class="node-shape" x="390" y="260" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="465.0" y="282.0" text-anchor="middle" dominant-baseline="central">Аргинин</text></g>\n<g class="node" data-node-id="urea" data-node-type="marker"><rect class="node-shape" x="560" y="120" width="100" height="44" rx="8"/><text class="lbl lbl-t" x="610.0" y="142.0" text-anchor="middle" dominant-baseline="central">Мочевина</text></g>\n</svg>\n';
const micronutrientsSteroidSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 300" role="img" data-pathway="micronutrients_steroid">\n<title>Микроэлементы — кофакторы стероидогенеза</title><desc>Цинк, медь, селен; отношение Zn/Cu; стероидогенез, сперматогенез, антиоксидантная защита.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="162" y1="83" x2="358" y2="83" class="edge" marker-end="url(#arrow)"/>\n<line x1="162" y1="98" x2="358" y2="144" class="edge" marker-end="url(#arrow)"/>\n<line x1="162" y1="242" x2="358" y2="241" class="edge" marker-end="url(#arrow)"/>\n<line x1="162" y1="228" x2="358" y2="182" class="edge" marker-end="url(#arrow)"/>\n<line x1="162" y1="148" x2="208" y2="138" class="edge" marker-end="url(#arrow)"/>\n<line x1="162" y1="98" x2="208" y2="108" class="edge" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="zinc" data-node-type="cofactor"><rect class="node-shape" x="40" y="60" width="120" height="46" rx="8"/><text class="lbl lbl-t" x="100.0" y="83.0" text-anchor="middle" dominant-baseline="central">Цинк</text></g>\n<g class="node" data-node-id="copper" data-node-type="cofactor"><rect class="node-shape" x="40" y="140" width="120" height="46" rx="8"/><text class="lbl lbl-t" x="100.0" y="163.0" text-anchor="middle" dominant-baseline="central">Медь</text></g>\n<g class="node" data-node-id="selenium" data-node-type="cofactor"><rect class="node-shape" x="40" y="220" width="120" height="46" rx="8"/><text class="lbl lbl-t" x="100.0" y="243.0" text-anchor="middle" dominant-baseline="central">Селен</text></g>\n<g class="node" data-node-id="zn_cu" data-node-type="index"><rect class="node-shape" x="210" y="100" width="120" height="46" rx="8"/><text class="lbl lbl-t" x="270.0" y="123.0" text-anchor="middle" dominant-baseline="central">Zn/Cu</text></g>\n<g class="node" data-node-id="steroidogenesis" data-node-type="process"><rect class="node-shape" x="360" y="60" width="160" height="46" rx="8"/><text class="lbl lbl-t" x="440.0" y="83.0" text-anchor="middle" dominant-baseline="central">Стероидогенез</text></g>\n<g class="node" data-node-id="spermatogenesis" data-node-type="target"><rect class="node-shape" x="360" y="140" width="160" height="46" rx="8"/><text class="lbl lbl-t" x="440.0" y="163.0" text-anchor="middle" dominant-baseline="central">Сперматогенез</text></g>\n<g class="node" data-node-id="antiox" data-node-type="process"><rect class="node-shape" x="360" y="215" width="160" height="50" rx="8"/><text class="lbl lbl-t" x="440.0" y="231.0" text-anchor="middle" dominant-baseline="central">Антиоксидантная</text><text class="lbl lbl-s" x="440.0" y="249.0" text-anchor="middle" dominant-baseline="central">защита</text></g>\n</svg>\n';
const detoxP12Svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 300" role="img" data-pathway="detox_p12">\n<title>Детоксикация I–II фазы (печень)</title><desc>I фаза (CYP) — II фаза (конъюгация, глутатион); печёночные маркеры АЛТ, АСТ, ГГТ, билирубин.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="182" y1="136" x2="228" y2="136" class="edge" marker-end="url(#arrow)"/>\n<line x1="305" y1="218" x2="305" y2="164" class="edge" marker-end="url(#arrow)"/>\n<line x1="382" y1="136" x2="428" y2="136" class="edge" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="phase1" data-node-type="process"><rect class="node-shape" x="40" y="110" width="140" height="52" rx="8"/><text class="lbl lbl-t" x="110.0" y="127.0" text-anchor="middle" dominant-baseline="central">I фаза</text><text class="lbl lbl-s" x="110.0" y="145.0" text-anchor="middle" dominant-baseline="central">CYP</text></g>\n<g class="node" data-node-id="phase2" data-node-type="process"><rect class="node-shape" x="230" y="110" width="150" height="52" rx="8"/><text class="lbl lbl-t" x="305.0" y="127.0" text-anchor="middle" dominant-baseline="central">II фаза</text><text class="lbl lbl-s" x="305.0" y="145.0" text-anchor="middle" dominant-baseline="central">конъюгация</text></g>\n<g class="node" data-node-id="glutathione2" data-node-type="cofactor"><rect class="node-shape" x="230" y="220" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="305.0" y="242.0" text-anchor="middle" dominant-baseline="central">Глутатион</text></g>\n<g class="node" data-node-id="liver2" data-node-type="organ"><rect class="node-shape" x="430" y="110" width="120" height="52" rx="8"/><text class="lbl lbl-t" x="490.0" y="136.0" text-anchor="middle" dominant-baseline="central">Печень</text></g>\n<g class="node" data-node-id="alt" data-node-type="marker"><rect class="node-shape" x="40" y="220" width="80" height="44" rx="8"/><text class="lbl lbl-t" x="80.0" y="242.0" text-anchor="middle" dominant-baseline="central">АЛТ</text></g>\n<g class="node" data-node-id="ast" data-node-type="marker"><rect class="node-shape" x="130" y="220" width="80" height="44" rx="8"/><text class="lbl lbl-t" x="170.0" y="242.0" text-anchor="middle" dominant-baseline="central">АСТ</text></g>\n<g class="node" data-node-id="ggt" data-node-type="marker"><rect class="node-shape" x="430" y="220" width="80" height="44" rx="8"/><text class="lbl lbl-t" x="470.0" y="242.0" text-anchor="middle" dominant-baseline="central">ГГТ</text></g>\n<g class="node" data-node-id="bilirubin" data-node-type="marker"><rect class="node-shape" x="530" y="220" width="120" height="44" rx="8"/><text class="lbl lbl-t" x="590.0" y="242.0" text-anchor="middle" dominant-baseline="central">Билирубин</text></g>\n</svg>\n';
const gutPermeabilitySvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 280" role="img" data-pathway="gut_permeability">\n<title>Кишечная проницаемость</title><desc>Кишечный барьер: зонулин, кальпротектин, секреторный IgA; микробиота.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="182" y1="133" x2="228" y2="132" class="edge" marker-end="url(#arrow)"/>\n<line x1="382" y1="104" x2="435" y2="86" class="edge" marker-end="url(#arrow)"/>\n<line x1="382" y1="131" x2="428" y2="132" class="edge" marker-end="url(#arrow)"/>\n<line x1="381" y1="159" x2="432" y2="178" class="edge" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="microbiota" data-node-type="signal"><rect class="node-shape" x="40" y="110" width="140" height="48" rx="8"/><text class="lbl lbl-t" x="110.0" y="134.0" text-anchor="middle" dominant-baseline="central">Микробиота</text></g>\n<g class="node" data-node-id="barrier" data-node-type="process"><rect class="node-shape" x="230" y="105" width="150" height="52" rx="8"/><text class="lbl lbl-t" x="305.0" y="122.0" text-anchor="middle" dominant-baseline="central">Кишечный</text><text class="lbl lbl-s" x="305.0" y="140.0" text-anchor="middle" dominant-baseline="central">барьер</text></g>\n<g class="node" data-node-id="zonulin" data-node-type="marker"><rect class="node-shape" x="430" y="40" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="505.0" y="62.0" text-anchor="middle" dominant-baseline="central">Зонулин</text></g>\n<g class="node" data-node-id="calprotectin" data-node-type="marker"><rect class="node-shape" x="430" y="110" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="505.0" y="132.0" text-anchor="middle" dominant-baseline="central">Кальпротектин</text></g>\n<g class="node" data-node-id="siga" data-node-type="marker"><rect class="node-shape" x="430" y="180" width="150" height="50" rx="8"/><text class="lbl lbl-t" x="505.0" y="196.0" text-anchor="middle" dominant-baseline="central">Секреторный</text><text class="lbl lbl-s" x="505.0" y="214.0" text-anchor="middle" dominant-baseline="central">IgA</text></g>\n</svg>\n';
const hpgAxisSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 430" role="img" data-pathway="hpg_axis">\n<title>Гипоталамо-гипофизарно-гонадная ось (мужская)</title><desc>Гипоталамус — гипофиз (ЛГ, ФСГ) — Лейдиг и Сертоли — тестостерон, ингибин B, сперматогенез; ГСПГ, эстрадиол, АМГ, пролактин.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="340" y1="82" x2="340" y2="98" class="edge" marker-end="url(#arrow)"/>\n<line x1="278" y1="148" x2="240" y2="163" class="edge" marker-end="url(#arrow)"/>\n<line x1="402" y1="148" x2="440" y2="163" class="edge" marker-end="url(#arrow)"/>\n<line x1="176" y1="211" x2="174" y2="228" class="edge" marker-end="url(#arrow)"/>\n<line x1="502" y1="211" x2="503" y2="228" class="edge" marker-end="url(#arrow)"/>\n<line x1="148" y1="282" x2="130" y2="303" class="edge" marker-end="url(#arrow)"/>\n<line x1="490" y1="282" x2="478" y2="303" class="edge" marker-end="url(#arrow)"/>\n<line x1="542" y1="282" x2="563" y2="298" class="edge" marker-end="url(#arrow)"/>\n<line x1="167" y1="363" x2="195" y2="352" class="edge" marker-end="url(#arrow)"/>\n<line x1="174" y1="351" x2="206" y2="363" class="edge" marker-end="url(#arrow)"/>\n<line x1="458" y1="57" x2="417" y2="56" class="edge" stroke-dasharray="4 3" marker-end="url(#arrow)"/>\n<line x1="130" y1="303" x2="317" y2="82" class="edge" stroke-dasharray="4 3" marker-end="url(#arrow)"/>\n<line x1="471" y1="303" x2="494" y2="211" class="edge" stroke-dasharray="4 3" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="hypothalamus" data-node-type="signal"><rect class="node-shape" x="265" y="30" width="150" height="50" rx="8"/><text class="lbl lbl-t" x="340.0" y="46.0" text-anchor="middle" dominant-baseline="central">Гипоталамус</text><text class="lbl lbl-s" x="340.0" y="64.0" text-anchor="middle" dominant-baseline="central">ГнРГ</text></g>\n<g class="node" data-node-id="prolactin" data-node-type="hormone"><rect class="node-shape" x="460" y="36" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="535.0" y="58.0" text-anchor="middle" dominant-baseline="central">Пролактин</text></g>\n<g class="node" data-node-id="pituitary" data-node-type="organ"><rect class="node-shape" x="265" y="100" width="150" height="46" rx="8"/><text class="lbl lbl-t" x="340.0" y="123.0" text-anchor="middle" dominant-baseline="central">Гипофиз</text></g>\n<g class="node" data-node-id="lh" data-node-type="hormone"><rect class="node-shape" x="120" y="165" width="120" height="44" rx="8"/><text class="lbl lbl-t" x="180.0" y="187.0" text-anchor="middle" dominant-baseline="central">ЛГ</text></g>\n<g class="node" data-node-id="fsh" data-node-type="hormone"><rect class="node-shape" x="440" y="165" width="120" height="44" rx="8"/><text class="lbl lbl-t" x="500.0" y="187.0" text-anchor="middle" dominant-baseline="central">ФСГ</text></g>\n<g class="node" data-node-id="leydig" data-node-type="organ"><rect class="node-shape" x="95" y="230" width="150" height="50" rx="8"/><text class="lbl lbl-t" x="170.0" y="246.0" text-anchor="middle" dominant-baseline="central">Клетки</text><text class="lbl lbl-s" x="170.0" y="264.0" text-anchor="middle" dominant-baseline="central">Лейдига</text></g>\n<g class="node" data-node-id="sertoli" data-node-type="organ"><rect class="node-shape" x="430" y="230" width="150" height="50" rx="8"/><text class="lbl lbl-t" x="505.0" y="246.0" text-anchor="middle" dominant-baseline="central">Клетки</text><text class="lbl lbl-s" x="505.0" y="264.0" text-anchor="middle" dominant-baseline="central">Сертоли</text></g>\n<g class="node" data-node-id="testosterone" data-node-type="hormone"><rect class="node-shape" x="40" y="305" width="140" height="44" rx="8"/><text class="lbl lbl-t" x="110.0" y="327.0" text-anchor="middle" dominant-baseline="central">Тестостерон</text></g>\n<g class="node" data-node-id="free_t" data-node-type="marker"><rect class="node-shape" x="195" y="300" width="140" height="50" rx="8"/><text class="lbl lbl-t" x="265.0" y="316.0" text-anchor="middle" dominant-baseline="central">Свободный</text><text class="lbl lbl-s" x="265.0" y="334.0" text-anchor="middle" dominant-baseline="central">тестостерон</text></g>\n<g class="node" data-node-id="shbg" data-node-type="marker"><rect class="node-shape" x="40" y="365" width="140" height="40" rx="8"/><text class="lbl lbl-t" x="110.0" y="385.0" text-anchor="middle" dominant-baseline="central">ГСПГ</text></g>\n<g class="node" data-node-id="estradiol" data-node-type="hormone"><rect class="node-shape" x="195" y="365" width="140" height="40" rx="8"/><text class="lbl lbl-t" x="265.0" y="385.0" text-anchor="middle" dominant-baseline="central">Эстрадиол</text></g>\n<g class="node" data-node-id="inhibin_b" data-node-type="marker"><rect class="node-shape" x="400" y="305" width="130" height="44" rx="8"/><text class="lbl lbl-t" x="465.0" y="327.0" text-anchor="middle" dominant-baseline="central">Ингибин B</text></g>\n<g class="node" data-node-id="amh" data-node-type="marker"><rect class="node-shape" x="400" y="365" width="130" height="40" rx="8"/><text class="lbl lbl-t" x="465.0" y="385.0" text-anchor="middle" dominant-baseline="central">АМГ</text></g>\n<g class="node" data-node-id="spermatogenesis" data-node-type="target"><rect class="node-shape" x="550" y="300" width="105" height="54" rx="8"/><text class="lbl lbl-t" x="602.5" y="318.0" text-anchor="middle" dominant-baseline="central">Сперма-</text><text class="lbl lbl-s" x="602.5" y="336.0" text-anchor="middle" dominant-baseline="central">тогенез</text></g>\n</svg>\n';
const hpoAxisSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 430" role="img" data-pathway="hpo_axis">\n<title>Гипоталамо-гипофизарно-яичниковая ось</title><desc>Гипоталамус — гипофиз (ЛГ, ФСГ) — яичник (фолликул, жёлтое тело) — эстрадиол, прогестерон; АМГ, ингибин B, пролактин, эндометрий.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="340" y1="82" x2="340" y2="98" class="edge" marker-end="url(#arrow)"/>\n<line x1="278" y1="148" x2="240" y2="163" class="edge" marker-end="url(#arrow)"/>\n<line x1="402" y1="148" x2="440" y2="163" class="edge" marker-end="url(#arrow)"/>\n<line x1="438" y1="200" x2="237" y2="242" class="edge" marker-end="url(#arrow)"/>\n<line x1="242" y1="200" x2="443" y2="240" class="edge" marker-end="url(#arrow)"/>\n<line x1="165" y1="281" x2="165" y2="313" class="edge" marker-end="url(#arrow)"/>\n<line x1="515" y1="282" x2="515" y2="313" class="edge" marker-end="url(#arrow)"/>\n<line x1="237" y1="256" x2="268" y2="255" class="edge" marker-end="url(#arrow)"/>\n<line x1="231" y1="361" x2="277" y2="378" class="edge" marker-end="url(#arrow)"/>\n<line x1="458" y1="57" x2="417" y2="56" class="edge" stroke-dasharray="4 3" marker-end="url(#arrow)"/>\n<line x1="366" y1="313" x2="474" y2="211" class="edge" stroke-dasharray="4 3" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="hypothalamus" data-node-type="signal"><rect class="node-shape" x="265" y="30" width="150" height="50" rx="8"/><text class="lbl lbl-t" x="340.0" y="46.0" text-anchor="middle" dominant-baseline="central">Гипоталамус</text><text class="lbl lbl-s" x="340.0" y="64.0" text-anchor="middle" dominant-baseline="central">ГнРГ</text></g>\n<g class="node" data-node-id="prolactin" data-node-type="hormone"><rect class="node-shape" x="460" y="36" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="535.0" y="58.0" text-anchor="middle" dominant-baseline="central">Пролактин</text></g>\n<g class="node" data-node-id="pituitary" data-node-type="organ"><rect class="node-shape" x="265" y="100" width="150" height="46" rx="8"/><text class="lbl lbl-t" x="340.0" y="123.0" text-anchor="middle" dominant-baseline="central">Гипофиз</text></g>\n<g class="node" data-node-id="lh" data-node-type="hormone"><rect class="node-shape" x="120" y="165" width="120" height="44" rx="8"/><text class="lbl lbl-t" x="180.0" y="187.0" text-anchor="middle" dominant-baseline="central">ЛГ</text></g>\n<g class="node" data-node-id="fsh" data-node-type="hormone"><rect class="node-shape" x="440" y="165" width="120" height="44" rx="8"/><text class="lbl lbl-t" x="500.0" y="187.0" text-anchor="middle" dominant-baseline="central">ФСГ</text></g>\n<g class="node" data-node-id="ovary" data-node-type="organ"><rect class="node-shape" x="270" y="230" width="140" height="48" rx="8"/><text class="lbl lbl-t" x="340.0" y="254.0" text-anchor="middle" dominant-baseline="central">Яичник</text></g>\n<g class="node" data-node-id="follicle" data-node-type="organ"><rect class="node-shape" x="95" y="235" width="140" height="44" rx="8"/><text class="lbl lbl-t" x="165.0" y="257.0" text-anchor="middle" dominant-baseline="central">Фолликул</text></g>\n<g class="node" data-node-id="corpus_luteum" data-node-type="organ"><rect class="node-shape" x="445" y="230" width="140" height="50" rx="8"/><text class="lbl lbl-t" x="515.0" y="246.0" text-anchor="middle" dominant-baseline="central">Жёлтое</text><text class="lbl lbl-s" x="515.0" y="264.0" text-anchor="middle" dominant-baseline="central">тело</text></g>\n<g class="node" data-node-id="estradiol" data-node-type="hormone"><rect class="node-shape" x="95" y="315" width="140" height="44" rx="8"/><text class="lbl lbl-t" x="165.0" y="337.0" text-anchor="middle" dominant-baseline="central">Эстрадиол</text></g>\n<g class="node" data-node-id="progesterone" data-node-type="hormone"><rect class="node-shape" x="445" y="315" width="140" height="44" rx="8"/><text class="lbl lbl-t" x="515.0" y="337.0" text-anchor="middle" dominant-baseline="central">Прогестерон</text></g>\n<g class="node" data-node-id="amh" data-node-type="marker"><rect class="node-shape" x="40" y="235" width="50" height="44" rx="8"/><text class="lbl lbl-t" x="65.0" y="248.0" text-anchor="middle" dominant-baseline="central">АМГ</text><text class="lbl lbl-s" x="65.0" y="266.0" text-anchor="middle" dominant-baseline="central">резерв</text></g>\n<g class="node" data-node-id="inhibin_b" data-node-type="marker"><rect class="node-shape" x="270" y="315" width="140" height="44" rx="8"/><text class="lbl lbl-t" x="340.0" y="337.0" text-anchor="middle" dominant-baseline="central">Ингибин B</text></g>\n<g class="node" data-node-id="endometrium" data-node-type="target"><rect class="node-shape" x="255" y="380" width="170" height="42" rx="8"/><text class="lbl lbl-t" x="340.0" y="401.0" text-anchor="middle" dominant-baseline="central">Эндометрий</text></g>\n</svg>\n';
const androgensPcosSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 320" role="img" data-pathway="androgens_pcos">\n<title>Андрогены / СПКЯ</title><desc>ЛГ и инсулин стимулируют тека-клетки; надпочечники дают ДГЭА-С и 17-ОНП; ГСПГ и свободный андрогенный индекс.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="162" y1="96" x2="208" y2="107" class="edge" marker-end="url(#arrow)"/>\n<line x1="162" y1="159" x2="208" y2="147" class="edge" marker-end="url(#arrow)"/>\n<line x1="372" y1="125" x2="408" y2="124" class="edge" marker-end="url(#arrow)"/>\n<line x1="372" y1="224" x2="408" y2="215" class="edge" marker-end="url(#arrow)"/>\n<line x1="372" y1="254" x2="408" y2="259" class="edge" marker-end="url(#arrow)"/>\n<line x1="615" y1="148" x2="615" y2="173" class="edge" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="lh" data-node-type="hormone"><rect class="node-shape" x="40" y="60" width="120" height="44" rx="8"/><text class="lbl lbl-t" x="100.0" y="82.0" text-anchor="middle" dominant-baseline="central">ЛГ</text></g>\n<g class="node" data-node-id="insulin_link" data-node-type="signal"><rect class="node-shape" x="40" y="150" width="120" height="50" rx="8"/><text class="lbl lbl-t" x="100.0" y="166.0" text-anchor="middle" dominant-baseline="central">Инсулин</text><text class="lbl lbl-s" x="100.0" y="184.0" text-anchor="middle" dominant-baseline="central">усиление</text></g>\n<g class="node" data-node-id="theca" data-node-type="organ"><rect class="node-shape" x="210" y="100" width="160" height="52" rx="8"/><text class="lbl lbl-t" x="290.0" y="117.0" text-anchor="middle" dominant-baseline="central">Тека-клетки</text><text class="lbl lbl-s" x="290.0" y="135.0" text-anchor="middle" dominant-baseline="central">яичника</text></g>\n<g class="node" data-node-id="adrenal" data-node-type="organ"><rect class="node-shape" x="210" y="220" width="160" height="46" rx="8"/><text class="lbl lbl-t" x="290.0" y="243.0" text-anchor="middle" dominant-baseline="central">Надпочечники</text></g>\n<g class="node" data-node-id="testosterone" data-node-type="hormone"><rect class="node-shape" x="410" y="100" width="150" height="46" rx="8"/><text class="lbl lbl-t" x="485.0" y="123.0" text-anchor="middle" dominant-baseline="central">Тестостерон</text></g>\n<g class="node" data-node-id="dhea_s" data-node-type="hormone"><rect class="node-shape" x="410" y="175" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="485.0" y="197.0" text-anchor="middle" dominant-baseline="central">ДГЭА-С</text></g>\n<g class="node" data-node-id="ohp17" data-node-type="marker"><rect class="node-shape" x="410" y="245" width="150" height="50" rx="8"/><text class="lbl lbl-t" x="485.0" y="261.0" text-anchor="middle" dominant-baseline="central">17-ОН-</text><text class="lbl lbl-s" x="485.0" y="279.0" text-anchor="middle" dominant-baseline="central">прогестерон</text></g>\n<g class="node" data-node-id="shbg" data-node-type="marker"><rect class="node-shape" x="570" y="100" width="90" height="46" rx="8"/><text class="lbl lbl-t" x="615.0" y="123.0" text-anchor="middle" dominant-baseline="central">ГСПГ</text></g>\n<g class="node" data-node-id="fai" data-node-type="index"><rect class="node-shape" x="560" y="175" width="110" height="50" rx="8"/><text class="lbl lbl-t" x="615.0" y="191.0" text-anchor="middle" dominant-baseline="central">Свободный</text><text class="lbl lbl-s" x="615.0" y="209.0" text-anchor="middle" dominant-baseline="central">андр. индекс</text></g>\n</svg>\n';
const prolactinRegSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 680 300" role="img" data-pathway="prolactin_reg">\n<title>Пролактин / гипоталамическая регуляция</title><desc>Дофамин тормозит лактотрофы; пролактин подавляет гонадную ось; макропролактин, связь с ТТГ и стрессом.</desc>\n<style>\n.node-shape{fill:#EEF0F2;stroke:#8A8F98;stroke-width:1;}\n.lbl{font-family:Arial,Helvetica,sans-serif;fill:#22303C;}\n.lbl-t{font-weight:600;font-size:14px;}\n.lbl-s{font-size:12px;fill:#5A6672;}\n.edge{stroke:#9AA3AD;stroke-width:1.2;fill:none;}\n[data-sev="norm"] .node-shape{fill:#E6F4EA;stroke:#3B8E5A;}\n[data-sev="mild"] .node-shape{fill:#FBF3D6;stroke:#C9A227;}\n[data-sev="moderate"] .node-shape{fill:#FBE7D2;stroke:#D97B29;}\n[data-sev="severe"] .node-shape{fill:#F7D9D9;stroke:#C0392B;}\n[data-sev="nodata"] .node-shape{fill:#F1EFE8;stroke:#B4B2A9;}\n</style>\n<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>\n<line x1="172" y1="134" x2="218" y2="133" class="edge" stroke-dasharray="4 3" marker-end="url(#arrow)"/>\n<line x1="382" y1="132" x2="428" y2="132" class="edge" marker-end="url(#arrow)"/>\n<line x1="507" y1="108" x2="508" y2="92" class="edge" marker-end="url(#arrow)"/>\n<line x1="505" y1="158" x2="505" y2="188" class="edge" marker-end="url(#arrow)"/>\n<line x1="202" y1="79" x2="428" y2="119" class="edge" marker-end="url(#arrow)"/>\n<line x1="172" y1="208" x2="428" y2="150" class="edge" marker-end="url(#arrow)"/>\n<g class="node" data-node-id="dopamine" data-node-type="signal"><rect class="node-shape" x="40" y="110" width="130" height="50" rx="8"/><text class="lbl lbl-t" x="105.0" y="126.0" text-anchor="middle" dominant-baseline="central">Дофамин</text><text class="lbl lbl-s" x="105.0" y="144.0" text-anchor="middle" dominant-baseline="central">(−)</text></g>\n<g class="node" data-node-id="lactotroph" data-node-type="organ"><rect class="node-shape" x="220" y="105" width="160" height="52" rx="8"/><text class="lbl lbl-t" x="300.0" y="122.0" text-anchor="middle" dominant-baseline="central">Лактотрофы</text><text class="lbl lbl-s" x="300.0" y="140.0" text-anchor="middle" dominant-baseline="central">гипофиза</text></g>\n<g class="node" data-node-id="prolactin" data-node-type="hormone"><rect class="node-shape" x="430" y="110" width="150" height="46" rx="8"/><text class="lbl lbl-t" x="505.0" y="133.0" text-anchor="middle" dominant-baseline="central">Пролактин</text></g>\n<g class="node" data-node-id="macroprl" data-node-type="marker"><rect class="node-shape" x="430" y="190" width="150" height="44" rx="8"/><text class="lbl lbl-t" x="505.0" y="212.0" text-anchor="middle" dominant-baseline="central">Макропролактин</text></g>\n<g class="node" data-node-id="tsh_link" data-node-type="signal"><rect class="node-shape" x="40" y="40" width="160" height="50" rx="8"/><text class="lbl lbl-t" x="120.0" y="56.0" text-anchor="middle" dominant-baseline="central">ТТГ</text><text class="lbl lbl-s" x="120.0" y="74.0" text-anchor="middle" dominant-baseline="central">↑ при гипотиреозе</text></g>\n<g class="node" data-node-id="stress" data-node-type="signal"><rect class="node-shape" x="40" y="200" width="130" height="46" rx="8"/><text class="lbl lbl-t" x="105.0" y="223.0" text-anchor="middle" dominant-baseline="central">Стресс</text></g>\n<g class="node" data-node-id="gonadal" data-node-type="target"><rect class="node-shape" x="430" y="40" width="160" height="50" rx="8"/><text class="lbl lbl-t" x="510.0" y="56.0" text-anchor="middle" dominant-baseline="central">Подавление</text><text class="lbl lbl-s" x="510.0" y="74.0" text-anchor="middle" dominant-baseline="central">гонадной оси</text></g>\n</svg>\n';
const PATHWAY_SVG_TEMPLATES = {
  methylation: methylationSvg,
  iron: ironSvg,
  thyroid: thyroidSvg,
  insulin_glucose: insulinGlucoseSvg,
  bone_mineral: boneMineralSvg,
  growth_igf1: growthIgf1Svg,
  hpa: hpaSvg,
  lipids: lipidsSvg,
  inflammation: inflammationSvg,
  oxidative_stress: oxidativeStressSvg,
  electrolytes_abr: electrolytesAbrSvg,
  energy_tca: energyTcaSvg,
  amino_urea: aminoUreaSvg,
  micronutrients_steroid: micronutrientsSteroidSvg,
  detox_p12: detoxP12Svg,
  gut_permeability: gutPermeabilitySvg,
  hpg_axis: hpgAxisSvg,
  hpo_axis: hpoAxisSvg,
  androgens_pcos: androgensPcosSvg,
  prolactin_reg: prolactinRegSvg
};
function hasPathwaySvgTemplate(slug) {
  return !!PATHWAY_SVG_TEMPLATES[slug];
}
function sevAttr(s) {
  if (s === "no_data") return "nodata";
  return s;
}
function PathwayTemplateSVG({
  slug,
  highlights,
  rxNodes,
  rxLabelByNode,
  nodeValues,
  overlayScene,
  maxHeight = 320
}) {
  const hostRef = useRef(null);
  const raw = PATHWAY_SVG_TEMPLATES[slug];
  const processed = useMemo(() => {
    if (!raw) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "image/svg+xml");
    const svg = doc.documentElement;
    const svgNS = "http://www.w3.org/2000/svg";
    if (highlights && highlights.size) {
      highlights.forEach((sev, nodeId) => {
        const g = svg.querySelector(`[data-node-id="${cssEscape(nodeId)}"]`);
        if (g) g.setAttribute("data-sev", sevAttr(sev));
      });
    }
    if (nodeValues && nodeValues.size) {
      nodeValues.forEach((val, nodeId) => {
        const g = svg.querySelector(`[data-node-id="${cssEscape(nodeId)}"]`);
        if (!g) return;
        if (val.sev && !g.getAttribute("data-sev")) g.setAttribute("data-sev", sevAttr(val.sev));
        const shape = g.querySelector(".node-shape");
        if (!shape) return;
        const geom = readShapeGeom(shape);
        if (!geom) return;
        g.querySelectorAll(".lbl-v").forEach((n) => n.remove());
        const t = doc.createElementNS(svgNS, "text");
        t.setAttribute("class", "lbl lbl-v");
        t.setAttribute("x", String(geom.x + geom.w / 2));
        t.setAttribute("y", String(geom.y + geom.h + 11));
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("dominant-baseline", "central");
        t.setAttribute("font-size", "11");
        t.setAttribute("font-weight", "700");
        t.setAttribute("fill", "#22303C");
        t.textContent = val.text;
        g.appendChild(t);
      });
    }
    if (rxNodes && rxNodes.size) {
      rxNodes.forEach((nodeId) => {
        const g = svg.querySelector(`[data-node-id="${cssEscape(nodeId)}"]`);
        if (!g) return;
        const shape = g.querySelector(".node-shape");
        if (!shape) return;
        const geom = readShapeGeom(shape);
        if (!geom) return;
        const marker = doc.createElementNS(svgNS, "g");
        marker.setAttribute("transform", `translate(${geom.x + geom.w - 6}, ${geom.y + 6})`);
        marker.setAttribute("pointer-events", "none");
        const c = doc.createElementNS(svgNS, "circle");
        c.setAttribute("r", "9");
        c.setAttribute("fill", "#10b981");
        c.setAttribute("stroke", "#065f46");
        c.setAttribute("stroke-width", "1.2");
        const t = doc.createElementNS(svgNS, "text");
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("dominant-baseline", "central");
        t.setAttribute("font-size", "10");
        t.setAttribute("font-weight", "700");
        t.setAttribute("fill", "white");
        t.textContent = "℞";
        marker.appendChild(c);
        marker.appendChild(t);
        const label = rxLabelByNode == null ? void 0 : rxLabelByNode.get(nodeId);
        if (label) {
          const lt = doc.createElementNS(svgNS, "text");
          lt.setAttribute("x", "12");
          lt.setAttribute("y", "3");
          lt.setAttribute("font-size", "9");
          lt.setAttribute("fill", "#065f46");
          lt.textContent = label.length > 32 ? label.slice(0, 32) + "…" : label;
          marker.appendChild(lt);
        }
        g.appendChild(marker);
      });
    }
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    return new XMLSerializer().serializeToString(svg);
  }, [raw, highlights, rxNodes, rxLabelByNode, nodeValues]);
  useEffect(() => {
    const host = hostRef.current;
    if (host && processed) host.innerHTML = processed;
  }, [processed]);
  if (!raw) return null;
  return /* @__PURE__ */ jsxs("div", { className: "relative w-full rounded bg-muted/20 overflow-hidden", style: { maxHeight }, children: [
    /* @__PURE__ */ jsx("div", { ref: hostRef, className: "w-full", style: { maxHeight } }),
    overlayScene && Array.isArray(overlayScene.elements) && overlayScene.elements.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pointer-events-none", children: /* @__PURE__ */ jsx(PathwaySceneSVG, { scene: overlayScene, maxHeight }) })
  ] });
}
function cssEscape(s) {
  return s.replace(/([^\w-])/g, "\\$1");
}
function readShapeGeom(el) {
  const tag = el.tagName.toLowerCase();
  const num = (a) => a == null ? NaN : Number(a);
  if (tag === "rect") {
    const x = num(el.getAttribute("x"));
    const y = num(el.getAttribute("y"));
    const w = num(el.getAttribute("width"));
    const h = num(el.getAttribute("height"));
    if ([x, y, w, h].every((n) => !isNaN(n))) return { x, y, w, h };
  }
  if (tag === "circle") {
    const cx = num(el.getAttribute("cx"));
    const cy = num(el.getAttribute("cy"));
    const r = num(el.getAttribute("r"));
    if ([cx, cy, r].every((n) => !isNaN(n))) return { x: cx - r, y: cy - r, w: r * 2, h: r * 2 };
  }
  if (tag === "ellipse") {
    const cx = num(el.getAttribute("cx"));
    const cy = num(el.getAttribute("cy"));
    const rx = num(el.getAttribute("rx"));
    const ry = num(el.getAttribute("ry"));
    if ([cx, cy, rx, ry].every((n) => !isNaN(n))) return { x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2 };
  }
  return null;
}
const ExcalidrawLazy = lazy(async () => {
  const mod = await import("@excalidraw/excalidraw");
  try {
    await Promise.resolve({          });
  } catch {
  }
  return { default: mod.Excalidraw };
});
function EditorInner({
  initialScene,
  onApi
}) {
  var _a;
  const initialData = {
    elements: Array.isArray(initialScene == null ? void 0 : initialScene.elements) ? initialScene.elements : [],
    appState: {
      ...(initialScene == null ? void 0 : initialScene.appState) || {},
      viewBackgroundColor: ((_a = initialScene == null ? void 0 : initialScene.appState) == null ? void 0 : _a.viewBackgroundColor) ?? "#ffffff"
    },
    files: (initialScene == null ? void 0 : initialScene.files) || null,
    scrollToContent: true
  };
  return /* @__PURE__ */ jsx(
    ExcalidrawLazy,
    {
      initialData,
      excalidrawAPI: onApi,
      UIOptions: {
        canvasActions: {
          loadScene: false,
          saveToActiveFile: false,
          export: false
        }
      }
    }
  );
}
function PathwayEditor({
  open,
  onOpenChange,
  mapId,
  pathwayCode,
  pathwayName,
  patientScene,
  templateScene,
  backgroundNode,
  onSaved
}) {
  const apiRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [ready, setReady] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);
  const initialScene = useMemo(
    () => patientScene ?? templateScene ?? null,
    // При каждом открытии редактора берём актуальную сцену пациента.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, instanceKey]
  );
  useEffect(() => {
    if (!open) {
      apiRef.current = null;
      setReady(false);
    }
  }, [open]);
  const collectScene = () => {
    const elements = apiRef.current.getSceneElements();
    const appState = apiRef.current.getAppState();
    const files = apiRef.current.getFiles();
    return {
      elements: JSON.parse(JSON.stringify(elements)),
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize
      },
      files: files || {}
    };
  };
  const handleSave = async () => {
    if (!apiRef.current) return;
    if (!mapId) {
      toast({
        title: "Нет карты пациента",
        description: "Сначала нажмите «Пересчитать отклонения», чтобы создать карту.",
        variant: "destructive"
      });
      return;
    }
    setSaving(true);
    try {
      const scene = collectScene();
      const { error } = await supabase.from("map_schemas").upsert(
        { map_id: mapId, pathway_code: pathwayCode, scene, updated_at: (/* @__PURE__ */ new Date()).toISOString() },
        { onConflict: "map_id,pathway_code" }
      );
      if (error) throw error;
      toast({ title: "Схема сохранена", description: `${pathwayName} — только для этого пациента` });
      onSaved == null ? void 0 : onSaved(scene);
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Ошибка сохранения", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  const handleReset = async () => {
    if (!mapId) return;
    if (!confirm("Сбросить дорисовки этого пациента и вернуть шаблон схемы?")) return;
    setResetting(true);
    try {
      const { error } = await supabase.from("map_schemas").delete().eq("map_id", mapId).eq("pathway_code", pathwayCode);
      if (error) throw error;
      toast({ title: "Сброшено к шаблону", description: pathwayName });
      onSaved == null ? void 0 : onSaved(null);
      setInstanceKey((k) => k + 1);
    } catch (e) {
      toast({ title: "Ошибка сброса", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0 gap-0", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { className: "p-4 pb-2 border-b", children: [
      /* @__PURE__ */ jsxs(DialogTitle, { children: [
        "Схема пациента: ",
        pathwayName
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
        "Правки сохраняются только для этого пациента и попадают в его протокол. У ключевых узлов задавайте ",
        /* @__PURE__ */ jsx("code", { children: "customData.nodeId" }),
        ", у стрелок — ",
        /* @__PURE__ */ jsx("code", { children: "customData.edge" }),
        ", чтобы работала подсветка по тяжести. Ручные пометки без nodeId не перекрашиваются."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 relative", children: [
      backgroundNode && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pointer-events-none z-0 flex items-center justify-center bg-white", children: backgroundNode }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-10", children: /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-muted-foreground" }) }), children: open && /* @__PURE__ */ jsx(
        EditorInner,
        {
          initialScene,
          onApi: (api) => {
            apiRef.current = api;
            setReady(true);
          }
        },
        instanceKey
      ) }) })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { className: "p-3 border-t gap-2", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          onClick: handleReset,
          disabled: resetting || saving || !mapId || !patientScene,
          className: "gap-2 mr-auto",
          title: patientScene ? "Удалить рабочую копию пациента" : "У пациента ещё нет ручных правок",
          children: [
            resetting ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(RotateCcw, { className: "w-4 h-4" }),
            "Сбросить к шаблону"
          ]
        }
      ),
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), disabled: saving, children: "Отмена" }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleSave, disabled: saving || !ready || !mapId, className: "gap-2", children: [
        saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
        "Сохранить у пациента"
      ] })
    ] })
  ] }) });
}
const GROUPS = [
  { key: "energy_substrates", title: "Энергия и субстраты" },
  { key: "hormonal_axes", title: "Гормональные оси" },
  { key: "blood_iron_inflammation", title: "Кровь, железо, воспаление" },
  { key: "micronutrients_methylation", title: "Микронутриенты и метилирование" },
  { key: "amino_defense", title: "Аминокислоты и защита" },
  { key: "water_electrolytes", title: "Водно-электролитный баланс" },
  { key: "other", title: "Прочее" }
];
const STATUS_RANK = {
  severe: 0,
  moderate: 1,
  mild: 2,
  norm: 3,
  no_data: 4
};
function PathwayTilesGrid({
  pathways,
  onSelect
}) {
  if (!pathways.length) {
    return /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground italic px-3 py-6", children: "Пути не заданы" });
  }
  const byGroup = /* @__PURE__ */ new Map();
  for (const p of pathways) {
    const g = p.group || "other";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(p);
  }
  const orderedGroups = GROUPS.filter((g) => byGroup.has(g.key)).concat(
    [...byGroup.keys()].filter((k) => !GROUPS.find((g) => g.key === k)).map((k) => ({ key: k, title: k }))
  );
  return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: orderedGroups.map((g) => {
    const items = (byGroup.get(g.key) || []).sort(
      (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.name.localeCompare(b.name, "ru")
    );
    return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-widest font-semibold text-muted-foreground px-1", children: g.title }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]", children: items.map((p) => {
        const c = SEVERITY_COLORS[p.status];
        const clickable = !!onSelect;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => onSelect == null ? void 0 : onSelect(p.slug),
            className: cn(
              "group text-left rounded-md border bg-card overflow-hidden transition-all flex",
              clickable && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            ),
            style: { borderColor: c.stroke + "55" },
            title: `${p.name} — ${c.label}`,
            children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: "w-1.5 shrink-0",
                  style: { background: c.stroke },
                  "aria-hidden": true
                }
              ),
              /* @__PURE__ */ jsxs("span", { className: "flex-1 min-w-0 px-3 py-2", children: [
                /* @__PURE__ */ jsx("span", { className: "block text-sm font-medium leading-tight text-foreground line-clamp-2", children: p.name }),
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: "mt-1 inline-block text-[10px] uppercase tracking-wide font-semibold",
                    style: { color: c.stroke },
                    children: c.label
                  }
                ),
                p.evidence && (p.status === "mild" || p.status === "moderate" || p.status === "severe") && /* @__PURE__ */ jsx("span", { className: "block mt-1 text-[11px] text-muted-foreground line-clamp-2", children: p.evidence })
              ] })
            ]
          },
          p.id
        );
      }) })
    ] }, g.key);
  }) });
}
function ProblemChainSVG({ causes }) {
  const affected = causes.filter(
    (c) => c.status === "mild" || c.status === "moderate" || c.status === "severe"
  );
  if (!affected.length) {
    return /* @__PURE__ */ jsx("div", { className: "text-xs italic text-muted-foreground px-3 py-6 text-center", children: "Затронутых путей не выявлено — цепочка проблем пуста." });
  }
  const effectKey = (e) => e.to_slug ? `slug:${e.to_slug}` : `lbl:${e.to_label || ""}`;
  const effectsMap = /* @__PURE__ */ new Map();
  const causeToEffects = /* @__PURE__ */ new Map();
  for (const c of affected) {
    const list = [];
    for (const eff of c.consequences || []) {
      const k = effectKey(eff);
      const label = (eff.to_label || eff.to_slug || "").trim();
      if (!label) continue;
      if (!effectsMap.has(k)) effectsMap.set(k, { key: k, label, slug: eff.to_slug });
      list.push(k);
    }
    if (list.length) causeToEffects.set(c.id, list);
  }
  const drawableCauses = affected.filter((c) => causeToEffects.has(c.id));
  const effects = [...effectsMap.values()];
  if (!drawableCauses.length || !effects.length) {
    return /* @__PURE__ */ jsx("div", { className: "text-xs italic text-muted-foreground px-3 py-6 text-center", children: "Для затронутых путей ещё не заданы следствия — заполните `consequences` в справочнике путей." });
  }
  const W = 900;
  const boxW = 220;
  const boxH = 48;
  const gapY = 16;
  const leftX = 20;
  const rightX = W - boxW - 20;
  const topPad = 24;
  const leftH = drawableCauses.length * (boxH + gapY) - gapY;
  const rightH = effects.length * (boxH + gapY) - gapY;
  const H = Math.max(leftH, rightH) + topPad * 2;
  const leftY = (i) => topPad + (H - topPad * 2 - leftH) / 2 + i * (boxH + gapY);
  const rightY = (i) => topPad + (H - topPad * 2 - rightH) / 2 + i * (boxH + gapY);
  return /* @__PURE__ */ jsxs("div", { className: "w-full overflow-x-auto", children: [
    /* @__PURE__ */ jsxs(
      "svg",
      {
        viewBox: `0 0 ${W} ${H}`,
        className: "w-full h-auto",
        preserveAspectRatio: "xMidYMid meet",
        role: "img",
        "aria-label": "Цепочка проблем: причины и следствия",
        children: [
          drawableCauses.map((c, i) => {
            const y1 = leftY(i) + boxH / 2;
            const x1 = leftX + boxW;
            const stroke = SEVERITY_COLORS[c.status].stroke;
            const width = c.status === "severe" ? 2.5 : c.status === "moderate" ? 2 : 1.5;
            return (causeToEffects.get(c.id) || []).map((effKey) => {
              const j = effects.findIndex((e) => e.key === effKey);
              if (j < 0) return null;
              const y2 = rightY(j) + boxH / 2;
              const x2 = rightX;
              const midX = (x1 + x2) / 2;
              const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
              return /* @__PURE__ */ jsx(
                "path",
                {
                  d,
                  fill: "none",
                  stroke,
                  strokeWidth: width,
                  strokeOpacity: 0.75
                },
                `${c.id}-${effKey}`
              );
            });
          }),
          drawableCauses.map((c, i) => {
            const y = leftY(i);
            const col = SEVERITY_COLORS[c.status];
            return /* @__PURE__ */ jsxs("g", { children: [
              /* @__PURE__ */ jsx(
                "rect",
                {
                  x: leftX,
                  y,
                  width: boxW,
                  height: boxH,
                  rx: 8,
                  ry: 8,
                  fill: col.fill,
                  stroke: col.stroke,
                  strokeWidth: 1.5
                }
              ),
              /* @__PURE__ */ jsx(
                "text",
                {
                  x: leftX + 12,
                  y: y + 20,
                  fontSize: 12,
                  fontWeight: 600,
                  fill: col.text,
                  children: truncate(c.name, 30)
                }
              ),
              /* @__PURE__ */ jsxs(
                "text",
                {
                  x: leftX + 12,
                  y: y + 36,
                  fontSize: 10,
                  fill: col.text,
                  opacity: 0.75,
                  children: [
                    "причина · ",
                    col.label.toLowerCase()
                  ]
                }
              )
            ] }, `cause-${c.id}`);
          }),
          effects.map((e, j) => {
            const y = rightY(j);
            return /* @__PURE__ */ jsxs("g", { children: [
              /* @__PURE__ */ jsx(
                "rect",
                {
                  x: rightX,
                  y,
                  width: boxW,
                  height: boxH,
                  rx: 8,
                  ry: 8,
                  fill: "hsl(var(--muted))",
                  stroke: "hsl(var(--border))",
                  strokeWidth: 1
                }
              ),
              /* @__PURE__ */ jsx(
                "text",
                {
                  x: rightX + 12,
                  y: y + 20,
                  fontSize: 12,
                  fontWeight: 600,
                  fill: "hsl(var(--foreground))",
                  children: truncate(e.label, 30)
                }
              ),
              /* @__PURE__ */ jsx(
                "text",
                {
                  x: rightX + 12,
                  y: y + 36,
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                  children: "следствие"
                }
              )
            ] }, `eff-${e.key}`);
          })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground italic mt-1 px-1", children: "Цвет линии соответствует тяжести причины. Пути «норма» и «нет данных» скрыты." })
  ] });
}
function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
const STATUS_STROKE$2 = {
  norm: "#3f7d4f",
  mild: "#E0A800",
  moderate: "#E8730C",
  severe: "#C0392B",
  nodata: "#94a3b8"
};
function Node$2({
  id,
  x,
  y,
  width,
  height,
  fill,
  stroke,
  strokeDasharray,
  values,
  onNodeClick
}) {
  const v = values == null ? void 0 : values[id];
  const finalStroke = v ? STATUS_STROKE$2[v.status] : stroke;
  const finalDash = v ? v.status === "nodata" ? "5,3" : void 0 : strokeDasharray;
  return /* @__PURE__ */ jsx(
    "rect",
    {
      "data-node-id": id,
      x,
      y,
      width,
      height,
      rx: 8,
      fill,
      stroke: finalStroke,
      strokeDasharray: finalDash,
      className: "node",
      style: { cursor: onNodeClick ? "pointer" : void 0 },
      onClick: onNodeClick ? () => onNodeClick(id) : void 0
    }
  );
}
function ValText$2({
  id,
  cx,
  bottomY,
  values
}) {
  const v = values == null ? void 0 : values[id];
  if (!v || v.value === "" || v.value === null || v.value === void 0) return null;
  return /* @__PURE__ */ jsx("text", { x: cx, y: bottomY - 4, className: "val", fontSize: 10, textAnchor: "middle", fill: "#20303f", children: String(v.value) });
}
function SteroidHubSVG({ values, onNodeClick }) {
  const v = useMemo(() => values, [values]);
  return /* @__PURE__ */ jsx("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsxs(
    "svg",
    {
      width: "100%",
      height: "auto",
      viewBox: "0 0 1240 960",
      xmlns: "http://www.w3.org/2000/svg",
      fontFamily: "Arial, sans-serif",
      style: { minWidth: 720 },
      children: [
        /* @__PURE__ */ jsxs("defs", { children: [
          /* @__PURE__ */ jsx("marker", { id: "sh-arrow", markerWidth: "9", markerHeight: "9", refX: "7", refY: "4.5", orient: "auto", children: /* @__PURE__ */ jsx("path", { d: "M0,0 L9,4.5 L0,9 Z", fill: "#5A6B7B" }) }),
          /* @__PURE__ */ jsx("marker", { id: "sh-arrowEnz", markerWidth: "8", markerHeight: "8", refX: "6", refY: "4", orient: "auto", children: /* @__PURE__ */ jsx("path", { d: "M0,0 L8,4 L0,8 Z", fill: "#B0752A" }) }),
          /* @__PURE__ */ jsx("marker", { id: "sh-arrowV", markerWidth: "8", markerHeight: "8", refX: "6", refY: "4", orient: "auto", children: /* @__PURE__ */ jsx("path", { d: "M0,0 L8,4 L0,8 Z", fill: "#8a3d84" }) }),
          /* @__PURE__ */ jsx("style", { children: `
            .node{stroke-width:2;rx:8;}
            .lbl{font-size:13px;font-weight:bold;fill:#20303f;text-anchor:middle;}
            .sub{font-size:10px;fill:#516070;text-anchor:middle;}
            .enz{font-size:10px;fill:#B0752A;font-style:italic;text-anchor:middle;}
            .branch{font-size:14px;font-weight:bold;text-anchor:middle;}
            .cons{font-size:11px;fill:#2f6f4f;font-weight:bold;text-anchor:middle;}
            .title{font-size:22px;font-weight:bold;fill:#20303f;}
            .stitle{font-size:12px;fill:#6a7886;}
          ` })
        ] }),
        /* @__PURE__ */ jsx("text", { x: 40, y: 42, className: "title", children: "Стероидогенез — хаб (steroidogenesis)" }),
        /* @__PURE__ */ jsx("text", { x: 40, y: 64, className: "stitle", children: "Холестерин → прегненолон → 3 ветви. Оранжевым — ферменты (точки блока / ВДКН). Фиолетовым — Т→ДГТ. Зелёным — consequences." }),
        /* @__PURE__ */ jsx(Node$2, { id: "cholesterol", x: 520, y: 86, width: 200, height: 46, fill: "#EAF0F6", stroke: "#5A6B7B", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 620, y: 105, className: "lbl", children: "Холестерин" }),
        /* @__PURE__ */ jsx("text", { x: 620, y: 122, className: "sub", children: "субстрат (из lipids)" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "cholesterol", cx: 620, bottomY: 132, values: v }),
        /* @__PURE__ */ jsx("text", { x: 790, y: 152, className: "enz", children: "StAR / CYP11A1 (десмолаза)" }),
        /* @__PURE__ */ jsx("line", { x1: 620, y1: 132, x2: 620, y2: 170, stroke: "#5A6B7B", strokeWidth: 2, markerEnd: "url(#sh-arrow)" }),
        /* @__PURE__ */ jsx(Node$2, { id: "pregnenolone", x: 520, y: 172, width: 200, height: 46, fill: "#F0EBE2", stroke: "#9a8a72", strokeDasharray: "5,3", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 620, y: 191, className: "lbl", children: "Прегненолон" }),
        /* @__PURE__ */ jsx("text", { x: 620, y: 208, className: "sub", children: "inferred · общий предшественник" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "pregnenolone", cx: 620, bottomY: 218, values: v }),
        /* @__PURE__ */ jsx("text", { x: 450, y: 250, className: "enz", children: "3β-HSD" }),
        /* @__PURE__ */ jsx("text", { x: 900, y: 238, className: "enz", children: "CYP17 (17α-гидроксилаза)" }),
        /* @__PURE__ */ jsx("line", { x1: 585, y1: 220, x2: 490, y2: 260, stroke: "#5A6B7B", strokeWidth: 2, markerEnd: "url(#sh-arrow)" }),
        /* @__PURE__ */ jsx("line", { x1: 700, y1: 220, x2: 880, y2: 260, stroke: "#B0752A", strokeWidth: 2, markerEnd: "url(#sh-arrowEnz)" }),
        /* @__PURE__ */ jsx(Node$2, { id: "17oh_pregnenolone", x: 820, y: 264, width: 200, height: 44, fill: "#F0EBE2", stroke: "#9a8a72", strokeDasharray: "5,3", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 920, y: 282, className: "lbl", children: "17-ОН-прегненолон" }),
        /* @__PURE__ */ jsx("text", { x: 920, y: 298, className: "sub", children: "inferred · развилка к андрогенам" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "17oh_pregnenolone", cx: 920, bottomY: 308, values: v }),
        /* @__PURE__ */ jsx(Node$2, { id: "progesterone", x: 370, y: 264, width: 200, height: 44, fill: "#EAF0F6", stroke: "#5A6B7B", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 470, y: 282, className: "lbl", children: "Прогестерон" }),
        /* @__PURE__ */ jsx("text", { x: 470, y: 298, className: "sub", children: "17-OHP путь ниже" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "progesterone", cx: 470, bottomY: 308, values: v }),
        /* @__PURE__ */ jsx("text", { x: 290, y: 322, className: "enz", children: "21-гидроксилаза" }),
        /* @__PURE__ */ jsx("line", { x1: 430, y1: 308, x2: 270, y2: 356, stroke: "#B0752A", strokeWidth: 2, markerEnd: "url(#sh-arrowEnz)" }),
        /* @__PURE__ */ jsx("text", { x: 558, y: 322, className: "enz", children: "CYP17" }),
        /* @__PURE__ */ jsx("line", { x1: 490, y1: 308, x2: 530, y2: 356, stroke: "#B0752A", strokeWidth: 2, markerEnd: "url(#sh-arrowEnz)" }),
        /* @__PURE__ */ jsx("text", { x: 150, y: 386, className: "branch", fill: "#2b6ca3", children: "Минералокортикоиды" }),
        /* @__PURE__ */ jsx(Node$2, { id: "doc", x: 60, y: 398, width: 200, height: 42, fill: "#DCE9F5", stroke: "#2b6ca3", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 160, y: 415, className: "lbl", children: "Дезоксикортикостерон" }),
        /* @__PURE__ */ jsx("text", { x: 160, y: 431, className: "sub", children: "ДОК" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "doc", cx: 160, bottomY: 440, values: v }),
        /* @__PURE__ */ jsx("line", { x1: 160, y1: 440, x2: 160, y2: 470, stroke: "#5A6B7B", strokeWidth: 2, markerEnd: "url(#sh-arrow)" }),
        /* @__PURE__ */ jsx("text", { x: 290, y: 459, className: "enz", children: "11β-гидроксилаза" }),
        /* @__PURE__ */ jsx(Node$2, { id: "corticosterone", x: 60, y: 472, width: 200, height: 42, fill: "#DCE9F5", stroke: "#2b6ca3", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 160, y: 489, className: "lbl", children: "Кортикостерон" }),
        /* @__PURE__ */ jsx("text", { x: 160, y: 505, className: "sub", children: "B" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "corticosterone", cx: 160, bottomY: 514, values: v }),
        /* @__PURE__ */ jsx("line", { x1: 160, y1: 514, x2: 160, y2: 544, stroke: "#5A6B7B", strokeWidth: 2, markerEnd: "url(#sh-arrow)" }),
        /* @__PURE__ */ jsx("text", { x: 290, y: 533, className: "enz", children: "альдостерон-синтаза" }),
        /* @__PURE__ */ jsx(Node$2, { id: "aldosterone", x: 60, y: 546, width: 200, height: 42, fill: "#C9DEF0", stroke: "#2b6ca3", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 160, y: 563, className: "lbl", children: "Альдостерон" }),
        /* @__PURE__ */ jsx("text", { x: 160, y: 579, className: "sub", children: "конечный минералокортикоид" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "aldosterone", cx: 160, bottomY: 588, values: v }),
        /* @__PURE__ */ jsx("line", { x1: 160, y1: 588, x2: 160, y2: 624, stroke: "#2f6f4f", strokeWidth: 2, strokeDasharray: "5,3", markerEnd: "url(#sh-arrow)" }),
        /* @__PURE__ */ jsx("rect", { x: 55, y: 626, width: 210, height: 40, rx: 8, fill: "#E4F2E9", stroke: "#2f6f4f", className: "node" }),
        /* @__PURE__ */ jsx("text", { x: 160, y: 651, className: "cons", children: "→ electrolytes_abr (Na⁺/K⁺)" }),
        /* @__PURE__ */ jsx("text", { x: 470, y: 386, className: "branch", fill: "#3f7d4f", children: "Глюкокортикоиды" }),
        /* @__PURE__ */ jsx(Node$2, { id: "ohp17", x: 370, y: 398, width: 200, height: 42, fill: "#E4F2E9", stroke: "#3f7d4f", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 470, y: 415, className: "lbl", children: "17-ОН-прогестерон" }),
        /* @__PURE__ */ jsx("text", { x: 470, y: 431, className: "sub", children: "17-OHP · маркер ВДКН" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "ohp17", cx: 470, bottomY: 440, values: v }),
        /* @__PURE__ */ jsx("line", { x1: 470, y1: 440, x2: 470, y2: 470, stroke: "#5A6B7B", strokeWidth: 2, markerEnd: "url(#sh-arrow)" }),
        /* @__PURE__ */ jsx("text", { x: 600, y: 459, className: "enz", children: "21-гидроксилаза" }),
        /* @__PURE__ */ jsx(Node$2, { id: "11_deoxycortisol", x: 370, y: 472, width: 200, height: 42, fill: "#E4F2E9", stroke: "#3f7d4f", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 470, y: 489, className: "lbl", children: "11-дезоксикортизол" }),
        /* @__PURE__ */ jsx("text", { x: 470, y: 505, className: "sub", children: "S · (21-дезоксикортизол — шунт)" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "11_deoxycortisol", cx: 470, bottomY: 514, values: v }),
        /* @__PURE__ */ jsx("line", { x1: 470, y1: 514, x2: 470, y2: 544, stroke: "#5A6B7B", strokeWidth: 2, markerEnd: "url(#sh-arrow)" }),
        /* @__PURE__ */ jsx("text", { x: 600, y: 533, className: "enz", children: "11β-гидроксилаза" }),
        /* @__PURE__ */ jsx(Node$2, { id: "cortisol", x: 370, y: 546, width: 200, height: 42, fill: "#CFE8D8", stroke: "#3f7d4f", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 470, y: 563, className: "lbl", children: "Кортизол ⇄ Кортизон" }),
        /* @__PURE__ */ jsx("text", { x: 470, y: 579, className: "sub", children: "11β-HSD · конечный глюкокортикоид" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "cortisol", cx: 470, bottomY: 588, values: v }),
        /* @__PURE__ */ jsx("line", { x1: 470, y1: 588, x2: 470, y2: 624, stroke: "#2f6f4f", strokeWidth: 2, strokeDasharray: "5,3", markerEnd: "url(#sh-arrow)" }),
        /* @__PURE__ */ jsx("rect", { x: 365, y: 626, width: 210, height: 40, rx: 8, fill: "#E4F2E9", stroke: "#2f6f4f", className: "node" }),
        /* @__PURE__ */ jsx("text", { x: 470, y: 651, className: "cons", children: "→ hpa (стресс-ось)" }),
        /* @__PURE__ */ jsx("text", { x: 920, y: 386, className: "branch", fill: "#a15a9e", children: "Андрогены → Эстрогены" }),
        /* @__PURE__ */ jsx(Node$2, { id: "dhea_s", x: 820, y: 398, width: 200, height: 42, fill: "#F3E3F1", stroke: "#a15a9e", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 920, y: 415, className: "lbl", children: "ДГЭА-С / ДГЭА" }),
        /* @__PURE__ */ jsx("text", { x: 920, y: 431, className: "sub", children: "измеряемый · 17,20-лиаза" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "dhea_s", cx: 920, bottomY: 440, values: v }),
        /* @__PURE__ */ jsx("line", { x1: 920, y1: 440, x2: 920, y2: 470, stroke: "#5A6B7B", strokeWidth: 2, markerEnd: "url(#sh-arrow)" }),
        /* @__PURE__ */ jsx("text", { x: 1050, y: 459, className: "enz", children: "3β-HSD" }),
        /* @__PURE__ */ jsx(Node$2, { id: "androstenedione", x: 820, y: 472, width: 200, height: 42, fill: "#F3E3F1", stroke: "#a15a9e", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 920, y: 489, className: "lbl", children: "Андростендион" }),
        /* @__PURE__ */ jsx("text", { x: 920, y: 505, className: "sub", children: "A4" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "androstenedione", cx: 920, bottomY: 514, values: v }),
        /* @__PURE__ */ jsx("line", { x1: 920, y1: 514, x2: 920, y2: 544, stroke: "#5A6B7B", strokeWidth: 2, markerEnd: "url(#sh-arrow)" }),
        /* @__PURE__ */ jsx("text", { x: 1050, y: 533, className: "enz", children: "17β-HSD" }),
        /* @__PURE__ */ jsx(Node$2, { id: "testosterone", x: 820, y: 546, width: 200, height: 42, fill: "#EBD3E8", stroke: "#a15a9e", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 920, y: 563, className: "lbl", children: "Тестостерон" }),
        /* @__PURE__ */ jsx("text", { x: 920, y: 579, className: "sub", children: "центральный андроген" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "testosterone", cx: 920, bottomY: 588, values: v }),
        /* @__PURE__ */ jsx("line", { x1: 880, y1: 588, x2: 800, y2: 624, stroke: "#8a3d84", strokeWidth: 2, markerEnd: "url(#sh-arrowV)" }),
        /* @__PURE__ */ jsx("text", { x: 700, y: 606, className: "enz", children: "5α-редуктаза" }),
        /* @__PURE__ */ jsx(Node$2, { id: "dht", x: 670, y: 626, width: 180, height: 42, fill: "#E4C9E0", stroke: "#8a3d84", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 760, y: 643, className: "lbl", children: "ДГТ" }),
        /* @__PURE__ */ jsx("text", { x: 760, y: 659, className: "sub", children: "5ARD · микропенис · T/DHT" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "dht", cx: 760, bottomY: 668, values: v }),
        /* @__PURE__ */ jsx("line", { x1: 760, y1: 668, x2: 760, y2: 700, stroke: "#2f6f4f", strokeWidth: 2, strokeDasharray: "5,3", markerEnd: "url(#sh-arrow)" }),
        /* @__PURE__ */ jsx("line", { x1: 960, y1: 588, x2: 1030, y2: 624, stroke: "#5A6B7B", strokeWidth: 2, markerEnd: "url(#sh-arrow)" }),
        /* @__PURE__ */ jsx("text", { x: 1080, y: 606, className: "enz", children: "ароматаза" }),
        /* @__PURE__ */ jsx(Node$2, { id: "estradiol", x: 940, y: 626, width: 200, height: 42, fill: "#EBD3E8", stroke: "#a15a9e", values: v, onNodeClick }),
        /* @__PURE__ */ jsx("text", { x: 1040, y: 643, className: "lbl", children: "Эстрадиол / Эстрон" }),
        /* @__PURE__ */ jsx("text", { x: 1040, y: 659, className: "sub", children: "E2 / E1" }),
        /* @__PURE__ */ jsx(ValText$2, { id: "estradiol", cx: 1040, bottomY: 668, values: v }),
        /* @__PURE__ */ jsx("line", { x1: 1040, y1: 668, x2: 1040, y2: 700, stroke: "#2f6f4f", strokeWidth: 2, strokeDasharray: "5,3", markerEnd: "url(#sh-arrow)" }),
        /* @__PURE__ */ jsx("rect", { x: 935, y: 702, width: 210, height: 40, rx: 8, fill: "#E4F2E9", stroke: "#2f6f4f", className: "node" }),
        /* @__PURE__ */ jsx("text", { x: 1040, y: 727, className: "cons", children: "→ hpg / hpo / androgens_pcos" }),
        /* @__PURE__ */ jsx("rect", { x: 665, y: 702, width: 190, height: 40, rx: 8, fill: "#E4F2E9", stroke: "#2f6f4f", className: "node" }),
        /* @__PURE__ */ jsx("text", { x: 760, y: 727, className: "cons", children: "→ hpg_axis (вирилизация)" }),
        /* @__PURE__ */ jsx("rect", { x: 60, y: 756, width: 960, height: 176, rx: 10, fill: "#FBFBF7", stroke: "#C9B79A" }),
        /* @__PURE__ */ jsx("text", { x: 80, y: 780, style: { fontSize: 13, fontWeight: "bold", fill: "#8a6d3b" }, children: "Клинические точки блока (для инспектора и текстов):" }),
        /* @__PURE__ */ jsx("text", { x: 80, y: 804, style: { fontSize: 12, fill: "#3d3d3d" }, children: "• Дефицит 21-гидроксилазы (класс. ВДКН) → ↑17-OHP, ↑21-дезоксикортизол, ↓кортизол, ↓альдостерон, ↑андрогены" }),
        /* @__PURE__ */ jsx("text", { x: 80, y: 826, style: { fontSize: 12, fill: "#3d3d3d" }, children: "• Дефицит 11β-гидроксилазы → ↑11-дезоксикортизол, ↑ДОК (гипертензия), ↑андрогены" }),
        /* @__PURE__ */ jsx("text", { x: 80, y: 848, style: { fontSize: 12, fill: "#3d3d3d" }, children: "• Дефицит 3β-HSD → ↑прегненолон/17-ОН-прегненолон, ↑ДГЭА, ↓кортизол" }),
        /* @__PURE__ */ jsx("text", { x: 80, y: 870, style: { fontSize: 12, fill: "#3d3d3d" }, children: "• Дефицит CYP17A1 (17α-гидроксилаза/17,20-лиаза) → гипертензия + гипокалиемия + задержка пубертата / первичная аменорея" }),
        /* @__PURE__ */ jsx("text", { x: 80, y: 892, style: { fontSize: 12, fill: "#3d3d3d" }, children: "• Дефицит 5α-редуктазы → нарушение вирилизации гениталий; избыток ароматазы → ↑эстрогены (гинекомастия)" }),
        /* @__PURE__ */ jsx("text", { x: 80, y: 914, style: { fontSize: 12, fill: "#3d3d3d" }, children: "• Adrenarche vs gonadarche: до ~8–9 лет андрогены преимущественно надпочечниковые (ДГЭА/ДГЭА-С, A4) — учитывать при ↑17-OHP/ДГЭА-С у детей" }),
        /* @__PURE__ */ jsx("text", { x: 60, y: 952, style: { fontSize: 11, fill: "#8a6d3b", fontStyle: "italic" }, children: "Пунктирные зелёные стрелки = consequences в другие пути карты. Серые/пунктирные узлы (прегненолоны) — inferred, не в базовой панели КДЛ-12." })
      ]
    }
  ) });
}
const STATUS_STROKE$1 = {
  norm: "#3f7d4f",
  mild: "#E0A800",
  moderate: "#E8730C",
  severe: "#C0392B",
  nodata: "#94a3b8"
};
function Node$1({
  id,
  x,
  y,
  width,
  height,
  fill,
  stroke,
  values,
  onNodeClick
}) {
  const v = values == null ? void 0 : values[id];
  const finalStroke = v ? STATUS_STROKE$1[v.status] : stroke;
  const finalDash = v && v.status === "nodata" ? "5,3" : void 0;
  return /* @__PURE__ */ jsx(
    "rect",
    {
      "data-node-id": id,
      x,
      y,
      width,
      height,
      rx: 8,
      fill,
      stroke: finalStroke,
      strokeWidth: 2,
      strokeDasharray: finalDash,
      style: { cursor: onNodeClick ? "pointer" : void 0 },
      onClick: onNodeClick ? () => onNodeClick(id) : void 0
    }
  );
}
function ValText$1({ id, cx, bottomY, values }) {
  const v = values == null ? void 0 : values[id];
  if (!v || v.value === "" || v.value == null) return null;
  return /* @__PURE__ */ jsx("text", { x: cx, y: bottomY - 4, fontSize: 10, textAnchor: "middle", fill: "#20303f", children: String(v.value) });
}
function VitDSchemeSVG({ values, onNodeClick }) {
  const v = useMemo(() => values, [values]);
  return /* @__PURE__ */ jsx("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsxs("svg", { width: "100%", height: "auto", viewBox: "0 0 900 420", xmlns: "http://www.w3.org/2000/svg", fontFamily: "Arial, sans-serif", style: { minWidth: 640 }, children: [
    /* @__PURE__ */ jsxs("defs", { children: [
      /* @__PURE__ */ jsx("marker", { id: "vd-arrow", markerWidth: "9", markerHeight: "9", refX: "7", refY: "4.5", orient: "auto", children: /* @__PURE__ */ jsx("path", { d: "M0,0 L9,4.5 L0,9 Z", fill: "#5A6B7B" }) }),
      /* @__PURE__ */ jsx("marker", { id: "vd-arrowB", markerWidth: "9", markerHeight: "9", refX: "7", refY: "4.5", orient: "auto", children: /* @__PURE__ */ jsx("path", { d: "M0,0 L9,4.5 L0,9 Z", fill: "#B0752A" }) }),
      /* @__PURE__ */ jsx("marker", { id: "vd-arrG", markerWidth: "8", markerHeight: "8", refX: "6", refY: "4", orient: "auto", children: /* @__PURE__ */ jsx("path", { d: "M0,0 L8,4 L0,8 Z", fill: "#2f6f4f" }) }),
      /* @__PURE__ */ jsx("style", { children: `
            .lbl{font-size:13px;font-weight:bold;fill:#20303f;text-anchor:middle;}
            .sub{font-size:10px;fill:#516070;text-anchor:middle;}
            .cons{font-size:11px;fill:#2f6f4f;font-weight:bold;text-anchor:middle;}
            .ttl{font-size:20px;font-weight:bold;fill:#20303f;}
            .st{font-size:11px;fill:#6a7886;}
          ` })
    ] }),
    /* @__PURE__ */ jsx("text", { x: 30, y: 34, className: "ttl", children: "Витамин D и минеральный обмен (vit_d_bone)" }),
    /* @__PURE__ */ jsx("text", { x: 30, y: 54, className: "st", children: "Витамин D → регуляция кальций-фосфорного обмена и минерализации кости. Зелёным — consequences." }),
    /* @__PURE__ */ jsx(Node$1, { id: "vitamin_d", x: 60, y: 90, width: 180, height: 52, fill: "#EAF0F6", stroke: "#2b6ca3", values: v, onNodeClick }),
    /* @__PURE__ */ jsx("text", { x: 150, y: 112, className: "lbl", children: "25-ОН витамин D" }),
    /* @__PURE__ */ jsx("text", { x: 150, y: 130, className: "sub", children: "депо-форма (маркер статуса)" }),
    /* @__PURE__ */ jsx(ValText$1, { id: "vitamin_d", cx: 150, bottomY: 142, values: v }),
    /* @__PURE__ */ jsx("line", { x1: 240, y1: 116, x2: 320, y2: 116, stroke: "#5A6B7B", strokeWidth: 2, markerEnd: "url(#vd-arrow)" }),
    /* @__PURE__ */ jsx(Node$1, { id: "vitamin_d_active", x: 320, y: 90, width: 180, height: 52, fill: "#DCE9F5", stroke: "#2b6ca3", values: v, onNodeClick }),
    /* @__PURE__ */ jsx("text", { x: 410, y: 112, className: "lbl", children: "1,25-ОН витамин D" }),
    /* @__PURE__ */ jsx("text", { x: 410, y: 130, className: "sub", children: "активная форма (кальцитриол)" }),
    /* @__PURE__ */ jsx(ValText$1, { id: "vitamin_d_active", cx: 410, bottomY: 142, values: v }),
    /* @__PURE__ */ jsx(Node$1, { id: "pth", x: 600, y: 90, width: 180, height: 52, fill: "#F3E8DC", stroke: "#B0752A", values: v, onNodeClick }),
    /* @__PURE__ */ jsx("text", { x: 690, y: 112, className: "lbl", children: "Паратгормон (ПТГ)" }),
    /* @__PURE__ */ jsx("text", { x: 690, y: 130, className: "sub", children: "регулятор Ca/P" }),
    /* @__PURE__ */ jsx(ValText$1, { id: "pth", cx: 690, bottomY: 142, values: v }),
    /* @__PURE__ */ jsx("line", { x1: 600, y1: 116, x2: 500, y2: 116, stroke: "#B0752A", strokeWidth: 2, strokeDasharray: "4,3", markerEnd: "url(#vd-arrowB)" }),
    /* @__PURE__ */ jsx("line", { x1: 410, y1: 142, x2: 410, y2: 180, stroke: "#5A6B7B", strokeWidth: 2, markerEnd: "url(#vd-arrow)" }),
    /* @__PURE__ */ jsx(Node$1, { id: "calcium", x: 230, y: 182, width: 160, height: 48, fill: "#E4F2E9", stroke: "#3f7d4f", values: v, onNodeClick }),
    /* @__PURE__ */ jsx("text", { x: 310, y: 203, className: "lbl", children: "Кальций" }),
    /* @__PURE__ */ jsx("text", { x: 310, y: 220, className: "sub", children: "общий / ионизированный" }),
    /* @__PURE__ */ jsx(ValText$1, { id: "calcium", cx: 310, bottomY: 230, values: v }),
    /* @__PURE__ */ jsx(Node$1, { id: "phosphate", x: 430, y: 182, width: 160, height: 48, fill: "#E4F2E9", stroke: "#3f7d4f", values: v, onNodeClick }),
    /* @__PURE__ */ jsx("text", { x: 510, y: 203, className: "lbl", children: "Фосфор" }),
    /* @__PURE__ */ jsx("text", { x: 510, y: 220, className: "sub", children: "неорганический" }),
    /* @__PURE__ */ jsx(ValText$1, { id: "phosphate", cx: 510, bottomY: 230, values: v }),
    /* @__PURE__ */ jsx("line", { x1: 380, y1: 160, x2: 320, y2: 182, stroke: "#5A6B7B", strokeWidth: 1.5, markerEnd: "url(#vd-arrow)" }),
    /* @__PURE__ */ jsx("line", { x1: 440, y1: 160, x2: 500, y2: 182, stroke: "#5A6B7B", strokeWidth: 1.5, markerEnd: "url(#vd-arrow)" }),
    /* @__PURE__ */ jsx(Node$1, { id: "alp", x: 620, y: 182, width: 180, height: 48, fill: "#F0EBE2", stroke: "#9a8a72", values: v, onNodeClick }),
    /* @__PURE__ */ jsx("text", { x: 710, y: 203, className: "lbl", children: "Щелочная фосфатаза" }),
    /* @__PURE__ */ jsx("text", { x: 710, y: 220, className: "sub", children: "маркер активности остеобластов" }),
    /* @__PURE__ */ jsx(ValText$1, { id: "alp", cx: 710, bottomY: 230, values: v }),
    /* @__PURE__ */ jsx("line", { x1: 310, y1: 230, x2: 310, y2: 280, stroke: "#2f6f4f", strokeWidth: 2, strokeDasharray: "5,3", markerEnd: "url(#vd-arrG)" }),
    /* @__PURE__ */ jsx("rect", { x: 180, y: 282, width: 260, height: 44, rx: 8, fill: "#E4F2E9", stroke: "#2f6f4f", strokeWidth: 1.5 }),
    /* @__PURE__ */ jsx("text", { x: 310, y: 308, className: "cons", children: "→ bone_mineral (минерализация)" }),
    /* @__PURE__ */ jsx("line", { x1: 510, y1: 230, x2: 510, y2: 280, stroke: "#2f6f4f", strokeWidth: 2, strokeDasharray: "5,3", markerEnd: "url(#vd-arrG)" }),
    /* @__PURE__ */ jsx("rect", { x: 460, y: 282, width: 240, height: 44, rx: 8, fill: "#E4F2E9", stroke: "#2f6f4f", strokeWidth: 1.5 }),
    /* @__PURE__ */ jsx("text", { x: 580, y: 308, className: "cons", children: "→ growth_igf1 (рост)" }),
    /* @__PURE__ */ jsx("rect", { x: 180, y: 344, width: 520, height: 52, rx: 8, fill: "#FBFBF7", stroke: "#C9B79A" }),
    /* @__PURE__ */ jsx("text", { x: 200, y: 366, style: { fontSize: 11, fill: "#3d3d3d" }, children: "Дефицит 25-ОН D <20 нг/мл → ↓ минерализация, рахит/остеомаляция, задержка роста," }),
    /* @__PURE__ */ jsx("text", { x: 200, y: 384, style: { fontSize: 11, fill: "#3d3d3d" }, children: "вторичный гиперпаратиреоз (↑ПТГ), у мальчиков — задержка пубертата, ↓ тестостерона." })
  ] }) });
}
const STATUS_STROKE = {
  norm: "#3f7d4f",
  mild: "#E0A800",
  moderate: "#E8730C",
  severe: "#C0392B",
  nodata: "#94a3b8"
};
function Node({
  id,
  x,
  y,
  width,
  height,
  fill,
  stroke,
  values,
  onNodeClick
}) {
  const v = values == null ? void 0 : values[id];
  const finalStroke = v ? STATUS_STROKE[v.status] : stroke;
  const finalDash = v && v.status === "nodata" ? "5,3" : void 0;
  return /* @__PURE__ */ jsx(
    "rect",
    {
      "data-node-id": id,
      x,
      y,
      width,
      height,
      rx: 7,
      fill,
      stroke: finalStroke,
      strokeWidth: 2,
      strokeDasharray: finalDash,
      style: { cursor: onNodeClick ? "pointer" : void 0 },
      onClick: onNodeClick ? () => onNodeClick(id) : void 0
    }
  );
}
function ValText({ id, cx, y, values }) {
  const v = values == null ? void 0 : values[id];
  if (!v || v.value === "" || v.value == null) return null;
  return /* @__PURE__ */ jsx("text", { x: cx, y, fontSize: 9.5, fontWeight: 700, textAnchor: "middle", fill: "#20303f", children: String(v.value) });
}
function EndoDisruptorsSchemeSVG({ values, onNodeClick }) {
  const v = useMemo(() => values, [values]);
  return /* @__PURE__ */ jsx("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ jsxs("svg", { width: "100%", height: "auto", viewBox: "0 0 900 480", xmlns: "http://www.w3.org/2000/svg", fontFamily: "Arial, sans-serif", style: { minWidth: 700 }, children: [
    /* @__PURE__ */ jsxs("defs", { children: [
      /* @__PURE__ */ jsx("marker", { id: "ed-arrow", markerWidth: "9", markerHeight: "9", refX: "7", refY: "4.5", orient: "auto", children: /* @__PURE__ */ jsx("path", { d: "M0,0 L9,4.5 L0,9 Z", fill: "#5A6B7B" }) }),
      /* @__PURE__ */ jsx("marker", { id: "ed-arrG", markerWidth: "8", markerHeight: "8", refX: "6", refY: "4", orient: "auto", children: /* @__PURE__ */ jsx("path", { d: "M0,0 L8,4 L0,8 Z", fill: "#2f6f4f" }) }),
      /* @__PURE__ */ jsx("style", { children: `
            .lbl{font-size:12px;font-weight:bold;fill:#20303f;text-anchor:middle;}
            .sub{font-size:9.5px;fill:#516070;text-anchor:middle;}
            .cons{font-size:11px;fill:#2f6f4f;font-weight:bold;text-anchor:middle;}
            .ttl{font-size:20px;font-weight:bold;fill:#20303f;}
            .st{font-size:11px;fill:#6a7886;}
            .grp{font-size:12px;font-weight:bold;text-anchor:middle;}
          ` })
    ] }),
    /* @__PURE__ */ jsx("text", { x: 30, y: 34, className: "ttl", children: "Эндокринные дизрапторы (endocrine_disruptors)" }),
    /* @__PURE__ */ jsx("text", { x: 30, y: 54, className: "st", children: "Маркеры экспозиции (моча, ВЭЖХ-МС/МС, на креатинин). Высокий уровень → влияние на мишени. Зелёным — consequences." }),
    /* @__PURE__ */ jsx("text", { x: 180, y: 88, className: "grp", fill: "#a15a9e", children: "Бисфенолы" }),
    /* @__PURE__ */ jsx(Node, { id: "bpa", x: 60, y: 98, width: 110, height: 42, fill: "#F3E3F1", stroke: "#a15a9e", values: v, onNodeClick }),
    /* @__PURE__ */ jsx("text", { x: 115, y: 115, className: "lbl", children: "Бисфенол A" }),
    /* @__PURE__ */ jsx("text", { x: 115, y: 131, className: "sub", children: "BPA" }),
    /* @__PURE__ */ jsx(ValText, { id: "bpa", cx: 115, y: 155, values: v }),
    /* @__PURE__ */ jsx(Node, { id: "bps", x: 180, y: 98, width: 90, height: 42, fill: "#F3E3F1", stroke: "#a15a9e", values: v, onNodeClick }),
    /* @__PURE__ */ jsx("text", { x: 225, y: 115, className: "lbl", children: "BPS / BPF" }),
    /* @__PURE__ */ jsx("text", { x: 225, y: 131, className: "sub", children: "заменители" }),
    /* @__PURE__ */ jsx(ValText, { id: "bps", cx: 225, y: 155, values: v }),
    /* @__PURE__ */ jsx("text", { x: 520, y: 88, className: "grp", fill: "#2b6ca3", children: "Фталаты (метаболиты)" }),
    /* @__PURE__ */ jsx(Node, { id: "mehp", x: 330, y: 98, width: 100, height: 42, fill: "#DCE9F5", stroke: "#2b6ca3", values: v, onNodeClick }),
    /* @__PURE__ */ jsx("text", { x: 380, y: 115, className: "lbl", children: "MEHP" }),
    /* @__PURE__ */ jsx("text", { x: 380, y: 131, className: "sub", children: "из DEHP" }),
    /* @__PURE__ */ jsx(ValText, { id: "mehp", cx: 380, y: 155, values: v }),
    /* @__PURE__ */ jsx(Node, { id: "mep", x: 440, y: 98, width: 90, height: 42, fill: "#DCE9F5", stroke: "#2b6ca3", values: v, onNodeClick }),
    /* @__PURE__ */ jsx("text", { x: 485, y: 115, className: "lbl", children: "MEP / MBP" }),
    /* @__PURE__ */ jsx(ValText, { id: "mep", cx: 485, y: 155, values: v }),
    /* @__PURE__ */ jsx(Node, { id: "mbzp", x: 540, y: 98, width: 90, height: 42, fill: "#DCE9F5", stroke: "#2b6ca3", values: v, onNodeClick }),
    /* @__PURE__ */ jsx("text", { x: 585, y: 115, className: "lbl", children: "MBzP" }),
    /* @__PURE__ */ jsx(ValText, { id: "mbzp", cx: 585, y: 155, values: v }),
    /* @__PURE__ */ jsx(Node, { id: "parabens", x: 640, y: 98, width: 110, height: 42, fill: "#F3E8DC", stroke: "#B0752A", values: v, onNodeClick }),
    /* @__PURE__ */ jsx("text", { x: 695, y: 115, className: "lbl", children: "Парабены" }),
    /* @__PURE__ */ jsx("text", { x: 695, y: 131, className: "sub", children: "сумма" }),
    /* @__PURE__ */ jsx(ValText, { id: "parabens", cx: 695, y: 155, values: v }),
    /* @__PURE__ */ jsx("line", { x1: 200, y1: 168, x2: 380, y2: 182, stroke: "#5A6B7B", strokeWidth: 1.5, markerEnd: "url(#ed-arrow)" }),
    /* @__PURE__ */ jsx("line", { x1: 450, y1: 168, x2: 420, y2: 182, stroke: "#5A6B7B", strokeWidth: 1.5, markerEnd: "url(#ed-arrow)" }),
    /* @__PURE__ */ jsx("line", { x1: 600, y1: 168, x2: 460, y2: 182, stroke: "#5A6B7B", strokeWidth: 1.5, markerEnd: "url(#ed-arrow)" }),
    /* @__PURE__ */ jsx("rect", { x: 310, y: 188, width: 260, height: 50, rx: 8, fill: "#FCE9CF", stroke: "#B0752A", strokeWidth: 2 }),
    /* @__PURE__ */ jsx("text", { x: 440, y: 209, className: "lbl", children: "Суммарная нагрузка дизрапторами" }),
    /* @__PURE__ */ jsx("text", { x: 440, y: 227, className: "sub", children: "интегральный фактор-модификатор" }),
    /* @__PURE__ */ jsx("line", { x1: 380, y1: 238, x2: 180, y2: 288, stroke: "#2f6f4f", strokeWidth: 2, strokeDasharray: "5,3", markerEnd: "url(#ed-arrG)" }),
    /* @__PURE__ */ jsx("line", { x1: 410, y1: 238, x2: 360, y2: 288, stroke: "#2f6f4f", strokeWidth: 2, strokeDasharray: "5,3", markerEnd: "url(#ed-arrG)" }),
    /* @__PURE__ */ jsx("line", { x1: 470, y1: 238, x2: 540, y2: 288, stroke: "#2f6f4f", strokeWidth: 2, strokeDasharray: "5,3", markerEnd: "url(#ed-arrG)" }),
    /* @__PURE__ */ jsx("line", { x1: 500, y1: 238, x2: 710, y2: 288, stroke: "#2f6f4f", strokeWidth: 2, strokeDasharray: "5,3", markerEnd: "url(#ed-arrG)" }),
    /* @__PURE__ */ jsx("rect", { x: 70, y: 290, width: 210, height: 44, rx: 8, fill: "#E4F2E9", stroke: "#2f6f4f", strokeWidth: 1.5 }),
    /* @__PURE__ */ jsx("text", { x: 175, y: 316, className: "cons", children: "→ hpg_axis (сперматогенез)" }),
    /* @__PURE__ */ jsx("rect", { x: 290, y: 290, width: 200, height: 44, rx: 8, fill: "#E4F2E9", stroke: "#2f6f4f", strokeWidth: 1.5 }),
    /* @__PURE__ */ jsx("text", { x: 390, y: 316, className: "cons", children: "→ steroidogenesis" }),
    /* @__PURE__ */ jsx("rect", { x: 500, y: 290, width: 180, height: 44, rx: 8, fill: "#E4F2E9", stroke: "#2f6f4f", strokeWidth: 1.5 }),
    /* @__PURE__ */ jsx("text", { x: 590, y: 316, className: "cons", children: "→ detox_p12" }),
    /* @__PURE__ */ jsx("rect", { x: 690, y: 290, width: 150, height: 44, rx: 8, fill: "#E4F2E9", stroke: "#2f6f4f", strokeWidth: 1.5 }),
    /* @__PURE__ */ jsx("text", { x: 765, y: 316, className: "cons", children: "→ hpo_axis" }),
    /* @__PURE__ */ jsx("rect", { x: 70, y: 352, width: 770, height: 100, rx: 8, fill: "#FBFBF7", stroke: "#C9B79A" }),
    /* @__PURE__ */ jsx("text", { x: 90, y: 374, style: { fontSize: 12, fontWeight: "bold", fill: "#8a6d3b" }, children: "Клиническое значение для андрологии:" }),
    /* @__PURE__ */ jsx("text", { x: 90, y: 396, style: { fontSize: 11, fill: "#3d3d3d" }, children: "• BPA ассоциирован с PCOS, ожирением, инсулинорезистентностью; ↑ у пациентов с нарушением фертильности." }),
    /* @__PURE__ */ jsx("text", { x: 90, y: 416, style: { fontSize: 11, fill: "#3d3d3d" }, children: "• Фталаты (MEHP и др.) — антиандрогенный эффект: связь с крипторхизмом, гипоспадией, снижением аногенитального расстояния." }),
    /* @__PURE__ */ jsx("text", { x: 90, y: 436, style: { fontSize: 11, fill: "#3d3d3d" }, children: "• Пренатальная/детская экспозиция особенно значима. Маркеры — моча на ВЭЖХ-МС/МС, не рутинный, но измеримый скрининг." })
  ] }) });
}
function SeverityLegend({ className = "" }) {
  return /* @__PURE__ */ jsxs("div", { className: `flex flex-wrap items-center gap-3 text-xs ${className}`, children: [
    /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Легенда:" }),
    SEVERITY_ORDER.map((s) => {
      const c = SEVERITY_COLORS[s];
      return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "inline-block w-3.5 h-3.5 rounded-sm border",
            style: { background: c.fill, borderColor: c.stroke }
          }
        ),
        c.label
      ] }, s);
    })
  ] });
}
const norm = (s) => s.toLowerCase().trim();
function yearsBetween(birth, ref = /* @__PURE__ */ new Date()) {
  if (!birth) return null;
  const d = new Date(birth);
  if (Number.isNaN(d.getTime())) return null;
  const ms = ref.getTime() - d.getTime();
  return ms / (1e3 * 60 * 60 * 24 * 365.2425);
}
function codesForFinding(f, pw) {
  var _a, _b;
  const out = /* @__PURE__ */ new Set();
  if (pw) {
    out.add(norm(pw.slug));
    if (f.node_id) out.add(norm(`${pw.slug}:${f.node_id}`));
  }
  if (f.node_id) out.add(norm(f.node_id));
  const code = (_a = f.source_ref) == null ? void 0 : _a.test_code;
  if (typeof code === "string" && code) out.add(norm(code));
  const name = (_b = f.source_ref) == null ? void 0 : _b.test_name;
  if (typeof name === "string" && name) out.add(norm(name));
  return [...out];
}
function catalogMatchesCodes(targets, codes) {
  if (!targets || !targets.length || !codes.length) return false;
  const t = new Set(targets.map(norm));
  return codes.some((c) => t.has(c));
}
function checkAge(row, ageYears) {
  if (ageYears == null) return null;
  if (row.age_min_years != null && ageYears < Number(row.age_min_years)) {
    return `Каталог: ≥ ${row.age_min_years} лет (сейчас ${ageYears.toFixed(1)}).`;
  }
  if (row.age_max_years != null && ageYears > Number(row.age_max_years)) {
    return `Каталог: ≤ ${row.age_max_years} лет (сейчас ${ageYears.toFixed(1)}).`;
  }
  return null;
}
function checkContra(row, findings) {
  var _a, _b;
  const contra = (row.contraindications || "").trim();
  if (!contra) return null;
  const contraLc = contra.toLowerCase();
  const hits = /* @__PURE__ */ new Set();
  for (const f of findings) {
    const name = String(((_a = f.source_ref) == null ? void 0 : _a.test_name) || "").toLowerCase();
    const code = String(((_b = f.source_ref) == null ? void 0 : _b.test_code) || "").toLowerCase();
    const nodeId = String(f.node_id || "").toLowerCase();
    for (const needle of [name, code, nodeId].filter(Boolean)) {
      if (contraLc.includes(needle)) hits.add(f.label);
    }
  }
  if (hits.size === 0) return null;
  return `Указано в противопоказаниях каталога — проверьте: ${[...hits].join("; ")}.`;
}
async function rebuildMapRecommendations({ mapId, patientId }) {
  const { data: findings, error: fErr } = await supabase.from("map_findings").select("id, pathway_id, node_id, severity, label, source_ref").eq("map_id", mapId);
  if (fErr) throw fErr;
  const affected = (findings || []).filter(
    (f) => {
      var _a;
      return f.severity !== "info" || ((_a = f.source_ref) == null ? void 0 : _a.agg_severity) && f.source_ref.agg_severity !== "norm";
    }
  );
  const { data: pw } = await supabase.from("pathways").select("id, slug, name").eq("is_active", true);
  const pathways = pw || [];
  const pwById = new Map(pathways.map((p) => [p.id, p]));
  const { data: patient } = await supabase.from("patients").select("id, birth_date").eq("id", patientId).maybeSingle();
  const ageYears = yearsBetween((patient == null ? void 0 : patient.birth_date) || null);
  const { data: cat } = await supabase.from("treatment_catalog").select(
    "id, name, subcategory, category, targets, contraindications, age_min_years, age_max_years, evidence_level, catalog_priority, default_dose, dose_unit, default_route_label, default_frequency, application_point, is_active, mm_targets, mm_application_point, mm_evidence_level, mm_priority, mm_contraindications"
  ).eq("is_active", true);
  const evidenceLetterToNum = (v) => v ? { A: 4, B: 3, C: 2, D: 1 }[v.toUpperCase()] ?? 0 : 0;
  const catalog = (cat || []).map((r) => {
    const merged = { ...r };
    if (Array.isArray(r.mm_targets) && r.mm_targets.length > 0) {
      merged.targets = r.mm_targets;
    }
    if (r.mm_application_point) merged.application_point = r.mm_application_point;
    if (r.mm_priority != null) merged.catalog_priority = r.mm_priority;
    const mmEv = evidenceLetterToNum(r.mm_evidence_level);
    if (mmEv > 0) merged.evidence_level = mmEv;
    return merged;
  }).filter((r) => Array.isArray(r.targets) && r.targets.length > 0);
  const previews = [];
  const affectedByNode = /* @__PURE__ */ new Map();
  for (const f of affected) {
    const key = `${f.pathway_id || "_"}::${f.node_id || "_"}`;
    if (!affectedByNode.has(key)) affectedByNode.set(key, []);
    affectedByNode.get(key).push(f);
  }
  const nodesWithMatch = /* @__PURE__ */ new Set();
  for (const [key, group] of affectedByNode.entries()) {
    const first = group[0];
    if (!first.pathway_id) continue;
    const pw2 = pwById.get(first.pathway_id);
    const codesUnion = /* @__PURE__ */ new Set();
    for (const g of group) for (const c of codesForFinding(g, pw2)) codesUnion.add(c);
    const codes = [...codesUnion];
    for (const row of catalog) {
      if (!catalogMatchesCodes(row.targets, codes)) continue;
      const age_warning = checkAge(row, ageYears);
      const contra_warning = checkContra(row, group);
      previews.push({
        catalog_id: row.id,
        catalog: row,
        pathway_id: first.pathway_id,
        target_node_id: first.node_id,
        application_point: row.application_point || [pw2 == null ? void 0 : pw2.name, first.node_id].filter(Boolean).join(" · ") || null,
        rationale: `Сработавшие показатели: ${group.map((g) => g.label).slice(0, 4).join("; ")}`,
        priority: row.catalog_priority || 0,
        evidence_level: row.evidence_level || 0,
        age_warning,
        contra_warning,
        finding_ids: group.map((g) => g.id)
      });
      nodesWithMatch.add(key);
    }
  }
  previews.sort(
    (a, b) => b.priority - a.priority || b.evidence_level - a.evidence_level || a.catalog.name.localeCompare(b.catalog.name, "ru")
  );
  const { error: delErr } = await supabase.from("map_recommendations").delete().eq("map_id", mapId).eq("is_manual", false);
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
      include_in_print: false
    }));
    const { error: insErr } = await supabase.from("map_recommendations").insert(rows);
    if (insErr) throw insErr;
  }
  const perNode = {};
  for (const p of previews) {
    const k = `${p.pathway_id}::${p.target_node_id || "_"}`;
    perNode[k] = (perNode[k] || 0) + 1;
  }
  const affectedNodesWithoutMatch = [];
  for (const key of affectedByNode.keys()) {
    if (nodesWithMatch.has(key)) continue;
    const [pathway_id, node_id] = key.split("::");
    if (pathway_id && pathway_id !== "_" && node_id && node_id !== "_") {
      affectedNodesWithoutMatch.push({ pathway_id, node_id });
    }
  }
  return { inserted: previews.length, perNode, affectedNodesWithoutMatch };
}
const SEV_ORDER = ["no_data", "norm", "mild", "moderate", "severe"];
const STATUS_CELL = {
  no_data: "bg-muted text-muted-foreground",
  norm: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  mild: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  moderate: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  severe: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
};
function trendArrow(prev, curr) {
  if (!prev || prev === curr) return "→";
  const dp = SEV_ORDER.indexOf(prev);
  const dc = SEV_ORDER.indexOf(curr);
  if (dc > dp) return "↑";
  if (dc < dp) return "↓";
  return "→";
}
function DynamicsPanel({
  patientId,
  currentSummary,
  currentPathways,
  canSaveSnapshot = true,
  visitId = null
}) {
  const [busy, setBusy] = useState(true);
  const [snapshots, setSnapshots] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setBusy(true);
    const [{ data: snaps }, { data: diag }] = await Promise.all([
      supabase.from("metabolic_map_snapshots").select("id, snapshot_date, visit_id, pathway_status").eq("patient_id", patientId).order("snapshot_date", { ascending: true }),
      supabase.from("patient_diagnosis_timeline").select("id, source_date, diagnosis_text, icd10, source_document, source_type").eq("patient_id", patientId).order("source_date", { ascending: false, nullsFirst: false })
    ]);
    setSnapshots(snaps || []);
    setDiagnoses(diag || []);
    setBusy(false);
  };
  useEffect(() => {
    load();
  }, [patientId]);
  const saveSnapshot = async () => {
    if (!(currentSummary == null ? void 0 : currentSummary.length)) {
      toast({ title: "Нет данных для среза", description: "Сначала пересчитайте отклонения.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const pwById = new Map(currentPathways.map((p) => [p.id, p]));
      const pathway_status = {};
      for (const s of currentSummary) {
        const pw = pwById.get(s.pathway_id);
        if (!pw) continue;
        pathway_status[pw.slug] = { status: s.status, slug: pw.slug, name: pw.name };
      }
      const { error } = await supabase.from("metabolic_map_snapshots").insert({
        patient_id: patientId,
        visit_id: visitId,
        pathway_status,
        findings: []
      });
      if (error) throw error;
      toast({ title: "Срез сохранён", description: "Динамика будет обновлена." });
      await load();
    } catch (e) {
      toast({ title: "Ошибка сохранения среза", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  const allSlugs = useMemo(() => {
    const s = /* @__PURE__ */ new Set();
    for (const snap of snapshots) Object.keys(snap.pathway_status || {}).forEach((k) => s.add(k));
    currentPathways.forEach((p) => s.add(p.slug));
    return Array.from(s).sort();
  }, [snapshots, currentPathways]);
  const slugToName = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const p of currentPathways) m.set(p.slug, p.name);
    for (const snap of snapshots) for (const [k, v] of Object.entries(snap.pathway_status || {})) {
      if (!m.has(k)) m.set(k, (v == null ? void 0 : v.name) || k);
    }
    return m;
  }, [snapshots, currentPathways]);
  if (busy) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-6 flex justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin text-muted-foreground" }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2 flex flex-row items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4 text-primary" }),
          "Динамика путей по визитам"
        ] }),
        canSaveSnapshot && /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "secondary", className: "gap-1.5", onClick: saveSnapshot, disabled: saving, children: [
          saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Camera, { className: "w-3.5 h-3.5" }),
          "Сохранить срез"
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: snapshots.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground italic", children: "Срезов пока нет. Нажмите «Сохранить срез» после пересчёта, чтобы зафиксировать состояние на текущую дату." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-left font-medium p-2 border-b sticky left-0 bg-background", children: "Путь" }),
          snapshots.map((s) => /* @__PURE__ */ jsx("th", { className: "text-center font-medium p-2 border-b whitespace-nowrap", children: s.snapshot_date }, s.id))
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: allSlugs.map((slug) => {
          let prev;
          return /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-b-0", children: [
            /* @__PURE__ */ jsx("td", { className: "p-2 font-medium sticky left-0 bg-background", children: slugToName.get(slug) || slug }),
            snapshots.map((s) => {
              var _a, _b;
              const st = ((_b = (_a = s.pathway_status) == null ? void 0 : _a[slug]) == null ? void 0 : _b.status) || "no_data";
              const trend = trendArrow(prev, st);
              prev = st;
              return /* @__PURE__ */ jsx("td", { className: `p-1.5 text-center ${STATUS_CELL[st]}`, children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 whitespace-nowrap", children: [
                /* @__PURE__ */ jsx("span", { children: SEVERITY_LABEL[st] }),
                /* @__PURE__ */ jsx("span", { className: "opacity-60", children: trend })
              ] }) }, s.id);
            })
          ] }, slug);
        }) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Хронология диагнозов" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: diagnoses.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground italic", children: "Диагнозов пока нет. Они появляются после разбора медицинских PDF." }) : /* @__PURE__ */ jsx("ol", { className: "relative border-l pl-4 space-y-3", children: diagnoses.map((d) => /* @__PURE__ */ jsxs("li", { className: "relative", children: [
        /* @__PURE__ */ jsx("span", { className: "absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-primary" }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: d.source_date || "дата не указана" }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium", children: [
          d.diagnosis_text,
          d.icd10 && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "ml-2 text-[10px]", children: d.icd10 })
        ] }),
        (d.source_document || d.source_type) && /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: [d.source_type, d.source_document].filter(Boolean).join(" · ") })
      ] }, d.id)) }) })
    ] })
  ] });
}
function GuardianManager({
  patientId,
  shareSimpleOnly,
  onShareChange
}) {
  const [busy, setBusy] = useState(true);
  const [guardians, setGuardians] = useState([]);
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState("родитель");
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setBusy(true);
    const { data } = await supabase.from("patient_guardians").select("id, user_id, relation, created_at").eq("patient_id", patientId);
    setGuardians(data || []);
    setBusy(false);
  };
  useEffect(() => {
    load();
  }, [patientId]);
  useMemo(() => /* @__PURE__ */ new Map(), []);
  const addGuardian = async () => {
    if (!email.trim()) return;
    setSaving(true);
    try {
      const { data: profile } = await supabase.from("profiles").select("id, email").eq("email", email.trim()).maybeSingle();
      if (!(profile == null ? void 0 : profile.id)) {
        toast({
          title: "Пользователь не найден",
          description: "Родитель должен сначала зарегистрироваться в кабинете под этим email.",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }
      const { error } = await supabase.from("patient_guardians").insert({
        patient_id: patientId,
        user_id: profile.id,
        relation: relation || null
      });
      if (error) throw error;
      toast({ title: "Родитель привязан" });
      setEmail("");
      await load();
    } catch (e) {
      toast({ title: "Не удалось привязать", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id) => {
    const { error } = await supabase.from("patient_guardians").delete().eq("id", id);
    if (error) {
      toast({ title: "Не удалось удалить", description: error.message, variant: "destructive" });
      return;
    }
    await load();
  };
  const toggleShare = async (v) => {
    onShareChange(v);
    const { error } = await supabase.from("patients").update({ share_simple_only: v }).eq("id", patientId);
    if (error) toast({ title: "Не сохранено", description: error.message, variant: "destructive" });
  };
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(UserPlus, { className: "w-4 h-4 text-primary" }),
      "Доступ родителя"
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-2 text-xs cursor-pointer", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: shareSimpleOnly,
            onChange: (e) => toggleShare(e.target.checked),
            className: "mt-0.5"
          }
        ),
        /* @__PURE__ */ jsxs("span", { children: [
          "Показывать родителю ",
          /* @__PURE__ */ jsx("b", { children: "только упрощённую карту без цифр" }),
          ". Снимите галочку, чтобы родитель видел и профессиональный текст."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-2 pt-2 border-t", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-[220px]", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Email родителя" }),
          /* @__PURE__ */ jsx(Input, { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "parent@example.com" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "w-40", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Кем приходится" }),
          /* @__PURE__ */ jsx(Input, { value: relation, onChange: (e) => setRelation(e.target.value) })
        ] }),
        /* @__PURE__ */ jsx(Button, { size: "sm", onClick: addGuardian, disabled: saving || !email.trim(), children: saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : "Привязать" })
      ] }),
      busy ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-3", children: /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin text-muted-foreground" }) }) : guardians.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-xs italic text-muted-foreground", children: "Родители не привязаны." }) : /* @__PURE__ */ jsx("ul", { className: "space-y-1 text-xs", children: guardians.map((g) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between rounded border px-2 py-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "outline", children: g.relation || "родитель" }),
          /* @__PURE__ */ jsxs("span", { className: "font-mono text-[11px] text-muted-foreground", children: [
            g.user_id.slice(0, 8),
            "…"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { size: "icon", variant: "ghost", className: "h-6 w-6", onClick: () => remove(g.id), children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }) })
      ] }, g.id)) })
    ] })
  ] });
}
const STATUS_ORDER = {
  no_data: 0,
  norm: 1,
  mild: 2,
  moderate: 3,
  severe: 4
};
const STATUS_CLS = {
  no_data: "bg-muted text-muted-foreground",
  norm: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  mild: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  moderate: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  severe: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
};
function classify(rulesStatus, aiStatus) {
  const rulesActive = ["mild", "moderate", "severe"].includes(rulesStatus);
  const aiActive = aiStatus ? ["mild", "moderate", "severe"].includes(aiStatus) : false;
  if (!aiStatus || aiStatus === "no_data") return rulesActive ? "rules_only" : "agree";
  if (rulesStatus === aiStatus) return "agree";
  const r = STATUS_ORDER[rulesStatus] ?? -1;
  const a = STATUS_ORDER[aiStatus] ?? -1;
  if (!rulesActive && aiActive) return "ai_only";
  if (rulesActive && !aiActive) return "rules_only";
  if (a > r) return "escalation";
  if (a < r) return "deescalation";
  return "agree";
}
const DIV_META = {
  agree: { label: "согласие", cls: "bg-emerald-100 text-emerald-800 border-emerald-300", Icon: CheckCircle2 },
  escalation: { label: "эскалация ИИ", cls: "bg-amber-100 text-amber-800 border-amber-300", Icon: ArrowUpRight },
  deescalation: { label: "деэскалация", cls: "bg-red-100 text-red-800 border-red-300", Icon: ArrowDownRight, rowCls: "bg-red-50/60 dark:bg-red-950/20" },
  ai_only: { label: "только ИИ", cls: "bg-purple-100 text-purple-800 border-purple-300", Icon: ShieldQuestion, rowCls: "bg-purple-50/50 dark:bg-purple-950/20" },
  rules_only: { label: "только правила", cls: "bg-blue-100 text-blue-800 border-blue-300", Icon: Beaker }
};
function checkMarkerSupport(aiP, ruleFindings) {
  var _a, _b;
  const aiCodes = new Set(
    ((aiP == null ? void 0 : aiP.markers) || []).map((m) => String(m.code || m.name || "").toUpperCase().trim()).filter(Boolean)
  );
  const ruleCodes = /* @__PURE__ */ new Set();
  for (const f of ruleFindings) {
    const c = ((_a = f.source_ref) == null ? void 0 : _a.test_code) || ((_b = f.source_ref) == null ? void 0 : _b.rule_code) || "";
    const s = String(c).toUpperCase().trim();
    if (s) ruleCodes.add(s);
  }
  const supported = [...aiCodes].some((c) => ruleCodes.has(c));
  return { supported, aiCodes: [...aiCodes], ruleCodes: [...ruleCodes] };
}
function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function AuditPanel({ mapId, pathways, summary, findings, ai }) {
  const [openId, setOpenId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState("all");
  const [reviews, setReviews] = useState(/* @__PURE__ */ new Map());
  const [savingPw, setSavingPw] = useState(null);
  const { toast: toast2 } = useToast();
  useEffect(() => {
    if (!mapId) {
      setReviews(/* @__PURE__ */ new Map());
      return;
    }
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from("map_pathway_reviews").select("id, map_id, pathway_id, kept, note, updated_at").eq("map_id", mapId);
      if (!alive) return;
      if (error) {
        console.warn("[audit] reviews load failed:", error.message);
        return;
      }
      const m = /* @__PURE__ */ new Map();
      for (const r of data || []) m.set(r.pathway_id, r);
      setReviews(m);
    })();
    return () => {
      alive = false;
    };
  }, [mapId]);
  async function saveReview(pathwayId, kept, context) {
    var _a;
    if (!mapId) {
      toast2({ title: "Нет карты", description: "Сначала выполните пересчёт.", variant: "destructive" });
      return;
    }
    setSavingPw(pathwayId);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const reviewer_id = ((_a = userData == null ? void 0 : userData.user) == null ? void 0 : _a.id) || null;
      const payload = {
        map_id: mapId,
        pathway_id: pathwayId,
        kept,
        rules_status: context.rules_status,
        ai_status: context.ai_status || null,
        divergence: context.divergence,
        reviewer_id,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { data, error } = await supabase.from("map_pathway_reviews").upsert(payload, { onConflict: "map_id,pathway_id" }).select("id, map_id, pathway_id, kept, note, updated_at").maybeSingle();
      if (error) throw error;
      if (data) {
        setReviews((prev) => {
          const next = new Map(prev);
          next.set(pathwayId, data);
          return next;
        });
      }
      toast2({ title: "Решение сохранено", description: kept === "ai" ? "Оставили вывод ИИ." : "Оставили результат правил." });
    } catch (e) {
      toast2({ title: "Не удалось сохранить", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setSavingPw(null);
    }
  }
  const sumById = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const s of summary) m.set(s.pathway_id, s);
    return m;
  }, [summary]);
  const aiBySlug = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const p of (ai == null ? void 0 : ai.pathways) || []) m.set(p.pathway_code, p);
    return m;
  }, [ai]);
  const findingsByPw = useMemo(() => {
    var _a;
    const m = /* @__PURE__ */ new Map();
    for (const f of findings) {
      const key = f.pathway_id || "_";
      if (!m.has(key)) m.set(key, { rules: [], aiOnly: [] });
      const bucket = m.get(key);
      if ((_a = f.source_ref) == null ? void 0 : _a.ai) bucket.aiOnly.push(f);
      else bucket.rules.push(f);
    }
    return m;
  }, [findings]);
  const rows = pathways.map((pw) => {
    const s = sumById.get(pw.id);
    const rulesStatus = (s == null ? void 0 : s.status) || "no_data";
    const aiP = aiBySlug.get(pw.slug);
    const aiStatus = (aiP == null ? void 0 : aiP.status) || void 0;
    const div = classify(rulesStatus, aiStatus);
    const bucket = findingsByPw.get(pw.id) || { rules: [], aiOnly: [] };
    const support = checkMarkerSupport(aiP, bucket.rules);
    const review = reviews.get(pw.id);
    return { pw, s, rulesStatus, aiP, aiStatus, div, bucket, support, review };
  });
  const filtered = rows.filter((r) => {
    if (filter === "diverge") return r.div !== "agree";
    if (filter === "affected")
      return ["mild", "moderate", "severe"].includes(r.rulesStatus) || r.aiStatus && ["mild", "moderate", "severe"].includes(r.aiStatus);
    return true;
  });
  const totals = rows.reduce(
    (acc, r) => {
      acc[r.div] = (acc[r.div] || 0) + 1;
      return acc;
    },
    {}
  );
  function exportCsv() {
    var _a, _b, _c, _d, _e;
    const header = [
      "pathway_slug",
      "pathway_name",
      "rules_status",
      "ai_status",
      "divergence",
      "ai_confidence",
      "matched_markers",
      "rules_findings",
      "ai_markers",
      "marker_supported",
      "kept"
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push([
        r.pw.slug,
        r.pw.name,
        r.rulesStatus,
        r.aiStatus || "",
        r.div,
        typeof ((_a = r.aiP) == null ? void 0 : _a.confidence) === "number" ? r.aiP.confidence : "",
        ((_b = r.s) == null ? void 0 : _b.matched_markers) ?? 0,
        r.bucket.rules.length,
        ((_d = (_c = r.aiP) == null ? void 0 : _c.markers) == null ? void 0 : _d.length) ?? 0,
        r.support.aiCodes.length ? r.support.supported ? "yes" : "no" : "n/a",
        ((_e = r.review) == null ? void 0 : _e.kept) || ""
      ].map(csvEscape).join(","));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_rules_vs_ai_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  return /* @__PURE__ */ jsxs(Card, { className: "border-primary/30", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setCollapsed((v) => !v),
            className: "inline-flex items-center gap-1 hover:opacity-80",
            "aria-label": collapsed ? "Развернуть" : "Свернуть",
            children: [
              collapsed ? /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx(ScaleIcon, { className: "w-4 h-4 text-primary" }),
              "Аудит: правила ↔ ИИ"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "ml-2", children: [
          "путей: ",
          rows.length
        ] }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: DIV_META.agree.cls, children: [
          "согласие: ",
          totals.agree || 0
        ] }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: DIV_META.escalation.cls, children: [
          "эскалация: ",
          totals.escalation || 0
        ] }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: DIV_META.deescalation.cls, children: [
          "деэскалация: ",
          totals.deescalation || 0
        ] }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: DIV_META.ai_only.cls, children: [
          "только ИИ: ",
          totals.ai_only || 0
        ] }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: DIV_META.rules_only.cls, children: [
          "только правила: ",
          totals.rules_only || 0
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "h-7 gap-1 text-xs ml-auto", onClick: exportCsv, children: [
          /* @__PURE__ */ jsx(Download, { className: "w-3 h-3" }),
          "CSV"
        ] })
      ] }),
      !collapsed && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-1 flex-wrap", children: [
        ["all", "affected", "diverge"].map((f) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setFilter(f),
            className: `text-xs px-2 py-1 rounded border transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"}`,
            children: f === "all" ? "Все" : f === "affected" ? "Только с отклонениями" : "Только расхождения"
          },
          f
        )),
        (ai == null ? void 0 : ai.model) && /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-muted-foreground ml-auto", children: [
          "ИИ: ",
          ai.model,
          ai.computed_at ? ` · ${new Date(ai.computed_at).toLocaleString("ru-RU")}` : ""
        ] })
      ] })
    ] }),
    !collapsed && /* @__PURE__ */ jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b text-muted-foreground text-left", children: [
        /* @__PURE__ */ jsx("th", { className: "py-2 pr-2 font-medium w-6" }),
        /* @__PURE__ */ jsx("th", { className: "py-2 pr-2 font-medium", children: "Путь" }),
        /* @__PURE__ */ jsx("th", { className: "py-2 pr-2 font-medium", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Beaker, { className: "w-3 h-3" }),
          "Правила"
        ] }) }),
        /* @__PURE__ */ jsx("th", { className: "py-2 pr-2 font-medium", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3" }),
          "ИИ"
        ] }) }),
        /* @__PURE__ */ jsx("th", { className: "py-2 pr-2 font-medium", children: "Расхождение" }),
        /* @__PURE__ */ jsx("th", { className: "py-2 pr-2 font-medium", children: "Уверенность" }),
        /* @__PURE__ */ jsx("th", { className: "py-2 pr-2 font-medium", children: "Маркеры ИИ" }),
        /* @__PURE__ */ jsx("th", { className: "py-2 pr-2 font-medium", children: "Решение" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        filtered.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "py-4 text-center text-muted-foreground italic", children: "Нет строк по выбранному фильтру." }) }),
        filtered.map((r) => {
          var _a, _b, _c, _d;
          const open = openId === r.pw.id;
          const M = DIV_META[r.div];
          const rowHi = M.rowCls || "";
          return /* @__PURE__ */ jsxs(Fragment$1, { children: [
            /* @__PURE__ */ jsxs("tr", { className: `border-b last:border-0 hover:bg-muted/40 ${rowHi}`, children: [
              /* @__PURE__ */ jsx("td", { className: "py-2 pr-1 align-top", children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-6 w-6 p-0", onClick: () => setOpenId(open ? null : r.pw.id), children: open ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" }) }) }),
              /* @__PURE__ */ jsxs("td", { className: "py-2 pr-2 font-medium align-top", children: [
                r.pw.name,
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground font-normal", children: r.pw.slug })
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "py-2 pr-2 align-top", children: [
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: STATUS_CLS[r.rulesStatus] || "", children: SEVERITY_LABEL[r.rulesStatus] || r.rulesStatus }),
                /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground mt-0.5", children: [
                  "сопоставлено: ",
                  ((_a = r.s) == null ? void 0 : _a.matched_markers) ?? 0,
                  " · отклонений: ",
                  r.bucket.rules.length
                ] })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "py-2 pr-2 align-top", children: r.aiStatus ? /* @__PURE__ */ jsx(Badge, { variant: "outline", className: STATUS_CLS[r.aiStatus] || "", children: SEVERITY_LABEL[r.aiStatus] || r.aiStatus }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground italic", children: "—" }) }),
              /* @__PURE__ */ jsx("td", { className: "py-2 pr-2 align-top", children: /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: `gap-1 ${M.cls}`, children: [
                /* @__PURE__ */ jsx(M.Icon, { className: "w-3 h-3" }),
                M.label
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "py-2 pr-2 align-top tabular-nums", children: typeof ((_b = r.aiP) == null ? void 0 : _b.confidence) === "number" ? `${(r.aiP.confidence * 100).toFixed(0)}%` : "—" }),
              /* @__PURE__ */ jsx("td", { className: "py-2 pr-2 align-top", children: ((_d = (_c = r.aiP) == null ? void 0 : _c.markers) == null ? void 0 : _d.length) ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
                /* @__PURE__ */ jsx("span", { children: r.aiP.markers.length }),
                /* @__PURE__ */ jsx("span", { className: `text-[10px] ${r.support.supported ? "text-emerald-700" : "text-red-700"}`, children: r.support.supported ? "подтв. маркером" : "нет опоры" })
              ] }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground italic", children: "—" }) }),
              /* @__PURE__ */ jsx("td", { className: "py-2 pr-2 align-top", children: r.review ? /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: r.review.kept === "ai" ? DIV_META.escalation.cls : DIV_META.rules_only.cls, children: [
                "оставлено: ",
                r.review.kept === "ai" ? "ИИ" : "правила"
              ] }) : r.div === "agree" ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-[10px] italic", children: "не требуется" }) : /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    size: "sm",
                    variant: "outline",
                    className: "h-6 px-2 text-[10px]",
                    disabled: savingPw === r.pw.id,
                    onClick: () => saveReview(r.pw.id, "rules", { rules_status: r.rulesStatus, ai_status: r.aiStatus, divergence: r.div }),
                    children: "Правила"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    size: "sm",
                    variant: "outline",
                    className: "h-6 px-2 text-[10px]",
                    disabled: savingPw === r.pw.id || !r.aiStatus,
                    onClick: () => saveReview(r.pw.id, "ai", { rules_status: r.rulesStatus, ai_status: r.aiStatus, divergence: r.div }),
                    children: "ИИ"
                  }
                )
              ] }) })
            ] }),
            open && /* @__PURE__ */ jsxs("tr", { className: `bg-muted/20 border-b ${rowHi}`, children: [
              /* @__PURE__ */ jsx("td", {}),
              /* @__PURE__ */ jsxs("td", { colSpan: 7, className: "py-3 pr-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsxs("div", { className: "text-[11px] font-semibold mb-1 flex items-center gap-1", children: [
                      /* @__PURE__ */ jsx(Beaker, { className: "w-3 h-3" }),
                      "Правила · findings (",
                      r.bucket.rules.length,
                      ")"
                    ] }),
                    r.bucket.rules.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground italic", children: "Ни одно правило не сработало." }) : /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: r.bucket.rules.map((f) => {
                      var _a2;
                      return /* @__PURE__ */ jsxs("li", { className: "border rounded px-2 py-1", children: [
                        /* @__PURE__ */ jsx("div", { className: "font-medium", children: f.label }),
                        f.detail && /* @__PURE__ */ jsx("div", { className: "text-muted-foreground text-[10px]", children: f.detail }),
                        ((_a2 = f.source_ref) == null ? void 0 : _a2.rule_code) && /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
                          "rule: ",
                          f.source_ref.rule_code
                        ] })
                      ] }, f.id);
                    }) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsxs("div", { className: "text-[11px] font-semibold mb-1 flex items-center gap-1", children: [
                      /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3" }),
                      "ИИ · интерпретация"
                    ] }),
                    !r.aiP ? /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground italic", children: "ИИ ещё не прогонялся по этому пути." }) : /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      r.aiP.text_pro && /* @__PURE__ */ jsxs("p", { className: "text-[11px]", children: [
                        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Про:" }),
                        " ",
                        r.aiP.text_pro
                      ] }),
                      r.aiP.text_plain && /* @__PURE__ */ jsxs("p", { className: "text-[11px]", children: [
                        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Просто:" }),
                        " ",
                        r.aiP.text_plain
                      ] }),
                      Array.isArray(r.aiP.markers) && r.aiP.markers.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-[11px]", children: [
                        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Маркеры:" }),
                        " ",
                        r.aiP.markers.slice(0, 8).map((m, i) => /* @__PURE__ */ jsxs("span", { className: "mr-2", children: [
                          m.code || m.name,
                          ": ",
                          String(m.value),
                          m.unit ? ` ${m.unit}` : "",
                          m.flag && m.flag !== "normal" && /* @__PURE__ */ jsxs("span", { className: "text-amber-700", children: [
                            " [",
                            m.flag,
                            "]"
                          ] })
                        ] }, i))
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: `text-[11px] mt-1 ${r.support.supported ? "text-emerald-700" : r.support.aiCodes.length ? "text-red-700" : "text-muted-foreground"}`, children: r.support.aiCodes.length === 0 ? "ИИ не сослался на конкретные показатели." : r.support.supported ? `Вывод подтверждён показателями пациента: ${r.support.aiCodes.filter((c) => r.support.ruleCodes.includes(c)).join(", ")}` : `⚠ Вывод без опоры на реальные отклонения. ИИ упомянул: ${r.support.aiCodes.join(", ")} — но правила по этим кодам не сработали. Проверить на галлюцинацию.` }),
                      r.bucket.aiOnly.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
                        "Дополнительно ИИ-подсветок: ",
                        r.bucket.aiOnly.length
                      ] })
                    ] })
                  ] })
                ] }),
                r.div === "deescalation" && /* @__PURE__ */ jsxs("div", { className: "mt-2 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-1", children: [
                  /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3 h-3 mt-0.5 shrink-0" }),
                  "ИИ понизил тяжесть по сравнению с правилами — модель «успокоила» реальное отклонение. Проверьте лабы, единицы измерения и контекст цикла."
                ] }),
                r.div === "ai_only" && /* @__PURE__ */ jsxs("div", { className: "mt-2 text-[11px] text-purple-700 dark:text-purple-300 flex items-start gap-1", children: [
                  /* @__PURE__ */ jsx(ShieldQuestion, { className: "w-3 h-3 mt-0.5 shrink-0" }),
                  "Правила по этому пути молчат, но ИИ выставил статус — контекстная находка либо галлюцинация. Сверьте с маркерами выше."
                ] }),
                r.review && /* @__PURE__ */ jsxs("div", { className: "mt-2 text-[11px] text-muted-foreground", children: [
                  "Решение врача: ",
                  r.review.kept === "ai" ? "оставлен вывод ИИ" : "оставлен результат правил",
                  " · ",
                  new Date(r.review.updated_at).toLocaleString("ru-RU")
                ] })
              ] })
            ] })
          ] }, r.pw.id);
        })
      ] })
    ] }) }) })
  ] });
}
function DataContextPanel({ patientId, visitId }) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [c, setC] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let cutoff = null;
      if (visitId) {
        const { data: v } = await supabase.from("patient_visits").select("visit_date").eq("id", visitId).maybeSingle();
        cutoff = (v == null ? void 0 : v.visit_date) || null;
      }
      let labsQ = supabase.from("lab_results").select("id, test_date, test_name, value, unit, reference_min, reference_max", { count: "exact" }).eq("patient_id", patientId).order("test_date", { ascending: false });
      if (cutoff) labsQ = labsQ.lte("test_date", cutoff);
      const { data: labs, count: labsCount } = await labsQ.limit(5);
      let visQ = supabase.from("patient_visits").select("id, protocol_data", { count: "exact" }).eq("patient_id", patientId);
      if (cutoff) visQ = visQ.lte("visit_date", cutoff);
      const { data: visits, count: visitsCount } = await visQ;
      const visitsWithProtocol = (visits || []).filter((v) => v.protocol_data && Object.keys(v.protocol_data).length).length;
      const { count: anthroCount } = await supabase.from("anthropometry_measurements").select("id", { count: "exact", head: true }).eq("patient_id", patientId);
      let dxCount = 0;
      try {
        const { count } = await supabase.from("patient_diagnosis_timeline").select("id", { count: "exact", head: true }).eq("patient_id", patientId);
        dxCount = count || 0;
      } catch {
      }
      const { count: rxCount } = await supabase.from("prescriptions").select("id", { count: "exact", head: true }).eq("patient_id", patientId);
      if (cancelled) return;
      setC({
        labs: labsCount || 0,
        labsRecent: labs || [],
        visits: visitsCount || 0,
        visitsWithProtocol,
        anthropometry: anthroCount || 0,
        diagnoses: dxCount,
        prescriptions: rxCount || 0,
        cutoffDate: cutoff
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, visitId]);
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Database, { className: "w-4 h-4 text-primary" }),
        "Что учитывается в расчёте",
        (c == null ? void 0 : c.cutoffDate) && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [
          "до ",
          c.cutoffDate
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "h-7 px-2", onClick: () => setOpen((v) => !v), children: open ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" }) })
    ] }) }),
    open && /* @__PURE__ */ jsx(CardContent, { className: "pt-0 space-y-3", children: loading || !c ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground py-3", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }),
      "Считаем данные…"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs", children: [
        /* @__PURE__ */ jsx(Metric, { label: "Лабораторные", value: c.labs, accent: c.labs > 0 }),
        /* @__PURE__ */ jsx(Metric, { label: "Визиты", value: c.visits, sub: `с протоколом: ${c.visitsWithProtocol}`, accent: c.visits > 0 }),
        /* @__PURE__ */ jsx(Metric, { label: "Антропометрия", value: c.anthropometry, accent: c.anthropometry > 0 }),
        /* @__PURE__ */ jsx(Metric, { label: "Диагнозы", value: c.diagnoses, accent: c.diagnoses > 0 }),
        /* @__PURE__ */ jsx(Metric, { label: "Рецепты", value: c.prescriptions, accent: c.prescriptions > 0 })
      ] }),
      c.labs === 0 ? /* @__PURE__ */ jsx("div", { className: "text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded px-2 py-1.5", children: "Лабораторных данных нет — все пути покажут «нет данных». Загрузите лабы или запустите извлечение из AI-протоколов визитов." }) : /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-[11px] font-medium text-muted-foreground mb-1", children: "Последние 5 маркеров:" }),
        /* @__PURE__ */ jsx("ul", { className: "text-xs space-y-0.5", children: c.labsRecent.map((l, i) => {
          const v = Number(l.value);
          const lo = l.reference_min == null ? null : Number(l.reference_min);
          const hi = l.reference_max == null ? null : Number(l.reference_max);
          const flag = Number.isFinite(v) && lo != null && v < lo ? "↓" : Number.isFinite(v) && hi != null && v > hi ? "↑" : "";
          const flagCls = flag === "↑" ? "text-red-600" : flag === "↓" ? "text-blue-600" : "text-muted-foreground";
          return /* @__PURE__ */ jsxs("li", { className: "flex items-baseline gap-2 font-mono", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground w-20 shrink-0", children: l.test_date }),
            /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", children: l.test_name }),
            /* @__PURE__ */ jsxs("span", { className: "tabular-nums", children: [
              l.value,
              l.unit ? ` ${l.unit}` : ""
            ] }),
            /* @__PURE__ */ jsx("span", { className: `w-4 ${flagCls}`, children: flag })
          ] }, i);
        }) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: "Правила автоагрегатора сравнивают значения с референсами по коду/названию теста. ИИ-интерпретация получает эти же данные + антропометрию, диагнозы, жалобы и рецепты." })
    ] }) })
  ] });
}
function Metric({ label, value, sub, accent }) {
  return /* @__PURE__ */ jsxs("div", { className: `rounded border px-2 py-1.5 ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"}`, children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "text-lg font-semibold tabular-nums leading-tight", children: value }),
    sub && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: sub })
  ] });
}
function normCode(s) {
  return String(s ?? "").toUpperCase().trim();
}
function CompletenessInspector({ patientId, pathways, summary, visitDate }) {
  const [codeLabels, setCodeLabels] = useState({});
  const [labs, setLabs] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      let q = supabase.from("lab_results").select("test_code, test_name").eq("patient_id", patientId);
      if (visitDate) q = q.lte("test_date", visitDate);
      const { data } = await q;
      if (!alive) return;
      setLabs(data || []);
    })();
    return () => {
      alive = false;
    };
  }, [patientId, visitDate]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from("lab_tests_catalog").select("short_name, name, synonyms").eq("is_active", true);
      if (!alive) return;
      const map = {};
      for (const row of data || []) {
        const label = row.short_name || row.name;
        if (!label) continue;
        map[normCode(row.short_name)] = label;
        map[normCode(row.name)] = label;
        for (const s of row.synonyms || []) {
          const k = normCode(s);
          if (k && !map[k]) map[k] = label;
        }
      }
      setCodeLabels(map);
    })();
    return () => {
      alive = false;
    };
  }, []);
  const patientCodes = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    for (const l of labs) {
      const c = normCode(l.test_code);
      if (c) set.add(c);
      if (!c && l.test_name) {
        const n = normCode(l.test_name);
        if (codeLabels[n]) set.add(n);
      }
    }
    return set;
  }, [labs, codeLabels]);
  const rows = useMemo(() => {
    return pathways.map((pw) => {
      var _a;
      const expected = /* @__PURE__ */ new Set();
      for (const r of pw.rules || []) {
        const tc = normCode((_a = r == null ? void 0 : r.when) == null ? void 0 : _a.test_code);
        if (tc) expected.add(tc);
      }
      const expectedArr = [...expected];
      const covered = expectedArr.filter((c) => patientCodes.has(c));
      const missing = expectedArr.filter((c) => !patientCodes.has(c));
      const sum = summary.find((s) => s.pathway_id === pw.id);
      const matched = (sum == null ? void 0 : sum.matched_markers) ?? 0;
      const needsPhase = (sum == null ? void 0 : sum.needs_phase_codes) || [];
      return {
        id: pw.id,
        slug: pw.slug,
        name: pw.name,
        expected: expectedArr.length,
        covered: covered.length,
        matched,
        missing,
        needsPhase,
        isEmpty: matched === 0
      };
    });
  }, [pathways, summary, patientCodes]);
  const labelFor = (code) => codeLabels[code] || code;
  const totals = useMemo(() => {
    const total = rows.length;
    const evaluated = rows.filter((r) => !r.isEmpty).length;
    const skipped = total - evaluated;
    return { total, evaluated, skipped };
  }, [rows]);
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ClipboardList, { className: "w-5 h-5" }),
        "Инспектор полноты данных"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Показывает, какие показатели каждого пути покрыты анализами пациента, а какие стоит досдать. Пути без единого измерения не считаются ошибкой — они помечаются «не оценивается»." })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 text-xs", children: [
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "gap-1", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-emerald-600" }),
          "Оценивается: ",
          totals.evaluated
        ] }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "gap-1", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3 text-muted-foreground" }),
          "Не оценивается: ",
          totals.skipped
        ] }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
          "Всего путей: ",
          totals.total
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "divide-y border rounded-md", children: [
        rows.map((r) => /* @__PURE__ */ jsxs("div", { className: "p-3 flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium text-sm truncate", children: r.name }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] text-muted-foreground shrink-0", children: r.slug })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[11px]", children: [
              r.isEmpty ? /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "border-muted text-muted-foreground", children: "не оценивается" }) : /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "border-emerald-300 text-emerald-700 dark:text-emerald-300", children: [
                "покрыто ",
                r.covered,
                "/",
                r.expected
              ] }),
              r.needsPhase.length > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "border-blue-300 text-blue-700 dark:text-blue-300", children: [
                "🔵 фаза: ",
                r.needsPhase.join(", ")
              ] })
            ] })
          ] }),
          r.missing.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-[12px] text-muted-foreground", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Досдать:" }),
            " ",
            r.missing.map(labelFor).join(", ")
          ] })
        ] }, r.id)),
        rows.length === 0 && /* @__PURE__ */ jsx("div", { className: "p-4 text-sm text-muted-foreground", children: "Нет активных путей для отображения." })
      ] })
    ] })
  ] });
}
const SEVERITY_META = {
  critical: { label: "Критично", icon: ShieldAlert, cls: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300" },
  warn: { label: "Внимание", icon: AlertTriangle, cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300" },
  info: { label: "Инфо", icon: Info, cls: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300" }
};
const STATUS_BADGE = {
  no_data: "bg-muted text-muted-foreground border-border",
  norm: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300",
  mild: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300",
  moderate: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300",
  severe: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300"
};
function AdminPatientMetabolicMap() {
  var _a, _b;
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [busy, setBusy] = useState(true);
  const [aggregating, setAggregating] = useState(false);
  const [patient, setPatient] = useState(null);
  const [pathways, setPathways] = useState([]);
  const [mapId, setMapId] = useState(null);
  const [mapNotes, setMapNotes] = useState(null);
  const [findings, setFindings] = useState([]);
  const [recs, setRecs] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState("all");
  const [summary, setSummary] = useState([]);
  const [lastAggregatedAt, setLastAggregatedAt] = useState(null);
  const [texts, setTexts] = useState([]);
  const [severityTexts, setSeverityTexts] = useState([]);
  const [labRows, setLabRows] = useState([]);
  const [catalogRows, setCatalogRows] = useState([]);
  const [register, setRegister] = useState("simple");
  const [selectedSlugs, setSelectedSlugs] = useState(/* @__PURE__ */ new Set());
  const [editorPathway, setEditorPathway] = useState(null);
  const [schemas, setSchemas] = useState(/* @__PURE__ */ new Map());
  const [aiBusy, setAiBusy] = useState(false);
  const [aiElapsed, setAiElapsed] = useState(0);
  const [deidentified, setDeidentified] = useState(true);
  const [ai, setAi] = useState(null);
  const [rxBusy, setRxBusy] = useState(false);
  useEffect(() => {
    if (!aiBusy) {
      setAiElapsed(0);
      return;
    }
    const t0 = Date.now();
    const id2 = setInterval(() => setAiElapsed(Math.round((Date.now() - t0) / 1e3)), 1e3);
    return () => clearInterval(id2);
  }, [aiBusy]);
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);
  useEffect(() => {
    fetchPathwayTexts().then(setTexts);
  }, []);
  useEffect(() => {
    fetchPathwaySeverityTexts().then(setSeverityTexts);
  }, []);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("lab_tests_catalog").select("short_name, name, synonyms").eq("is_active", true);
      setCatalogRows(data || []);
    })();
  }, []);
  useEffect(() => {
    const affected = summary.filter((s) => s.status === "mild" || s.status === "moderate" || s.status === "severe").map((s) => s.slug);
    if (affected.length) setSelectedSlugs(new Set(affected));
  }, [summary]);
  const reload = useCallback(async () => {
    var _a2, _b2;
    if (!id) return;
    setBusy(true);
    const [{ data: p }, { data: pw }, { data: m }, { data: vs }] = await Promise.all([
      supabase.from("patients").select("id, full_name, birth_date, history_number, share_simple_only, sex").eq("id", id).maybeSingle(),
      supabase.from("pathways").select("id, slug, name, description, nodes, edges, svg_scene, group, group_order, consequences, sex, rules").eq("is_active", true).order("group_order").order("name"),
      supabase.from("metabolic_maps").select("id, notes, source_visit_id, last_aggregated_at, aggregate_summary, meta").eq("patient_id", id).maybeSingle(),
      supabase.from("patient_visits").select("id, visit_date, protocol_type, diagnosis").eq("patient_id", id).order("visit_date", { ascending: false })
    ]);
    setPatient(p);
    const patientSex = (p == null ? void 0 : p.sex) === "M" || (p == null ? void 0 : p.sex) === "F" ? p.sex : null;
    const allPw = pw || [];
    const visiblePw = patientSex ? allPw.filter((x) => !x.sex || x.sex === patientSex) : allPw.filter((x) => !x.sex);
    setPathways(visiblePw);
    setMapId((m == null ? void 0 : m.id) || null);
    setMapNotes((m == null ? void 0 : m.notes) || null);
    setVisits(vs || []);
    setSelectedVisit((m == null ? void 0 : m.source_visit_id) || "all");
    setLastAggregatedAt((m == null ? void 0 : m.last_aggregated_at) || null);
    const savedSummary = ((_a2 = m == null ? void 0 : m.aggregate_summary) == null ? void 0 : _a2.pathways) || [];
    setSummary(savedSummary);
    setAi(((_b2 = m == null ? void 0 : m.meta) == null ? void 0 : _b2.ai) || null);
    if (m == null ? void 0 : m.id) {
      const { data: sch } = await supabase.from("map_schemas").select("pathway_code, scene").eq("map_id", m.id);
      const map = /* @__PURE__ */ new Map();
      for (const row of sch || []) {
        if ((row == null ? void 0 : row.pathway_code) && (row == null ? void 0 : row.scene)) map.set(row.pathway_code, row.scene);
      }
      setSchemas(map);
    } else {
      setSchemas(/* @__PURE__ */ new Map());
    }
    if (m == null ? void 0 : m.id) {
      const [{ data: f }, { data: r }] = await Promise.all([
        supabase.from("map_findings").select("id, pathway_id, node_id, severity, label, detail, source_ref, created_at").eq("map_id", m.id).order("created_at", { ascending: false }),
        supabase.from("map_recommendations").select(
          "id, catalog_id, pathway_id, target_node_id, application_point, rationale, priority, evidence_level, age_warning, contra_warning, include_in_print, is_manual, finding_ids, catalog:treatment_catalog(name, subcategory, category, default_dose, dose_unit, default_route_label, default_frequency)"
        ).eq("map_id", m.id).order("priority", { ascending: false }).order("evidence_level", { ascending: false })
      ]);
      setFindings(f || []);
      setRecs(r || []);
    } else {
      setFindings([]);
      setRecs([]);
    }
    const { data: lr } = await supabase.from("lab_results").select("id, test_name, test_code, value, unit").eq("patient_id", id).order("test_date", { ascending: false });
    setLabRows((lr || []).map((r) => ({ id: r.id, test_name: r.test_name, test_code: r.test_code, value: r.value, unit: r.unit })));
    setBusy(false);
  }, [id]);
  useEffect(() => {
    reload();
  }, [reload]);
  const handleAggregate = async () => {
    if (!id) return;
    setAggregating(true);
    try {
      const result = await runAggregation({
        patientId: id,
        visitId: selectedVisit === "all" ? null : selectedVisit
      });
      toast({
        title: "Пересчёт выполнен",
        description: `Отклонений: ${result.findings.length}. Путей проанализировано: ${result.summary.length}.`
      });
      await reload();
    } catch (e) {
      toast({ title: "Ошибка агрегации", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setAggregating(false);
    }
  };
  const handleAiBuild = async () => {
    var _a2, _b2;
    if (!id) return;
    if (!mapId) {
      toast({ title: "Сначала пересчитайте отклонения", description: "ИИ работает поверх детерминированного слоя.", variant: "destructive" });
      return;
    }
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("metabolic-map-build", {
        body: {
          patient_id: id,
          visit_id: selectedVisit === "all" ? null : selectedVisit,
          deidentified
        }
      });
      if (error) throw error;
      if (data == null ? void 0 : data.error) throw new Error(data.error);
      toast({
        title: "ИИ-интерпретация готова",
        description: `Путей: ${((_b2 = (_a2 = data == null ? void 0 : data.ai) == null ? void 0 : _a2.pathways) == null ? void 0 : _b2.length) ?? 0} · подсветок: ${(data == null ? void 0 : data.findings_inserted) ?? 0}`
      });
      await reload();
    } catch (e) {
      toast({ title: "Ошибка ИИ-интерпретации", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setAiBusy(false);
    }
  };
  const handleRebuildRx = async () => {
    if (!id || !mapId) {
      toast({ title: "Сначала пересчитайте отклонения", description: "Точки приложения строятся поверх findings.", variant: "destructive" });
      return;
    }
    setRxBusy(true);
    try {
      const res = await rebuildMapRecommendations({ mapId, patientId: id });
      toast({
        title: "Точки приложения подобраны",
        description: `Строк из каталога: ${res.inserted}. Узлов без средства: ${res.affectedNodesWithoutMatch.length}.`
      });
      await reload();
    } catch (e) {
      toast({ title: "Ошибка подбора", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setRxBusy(false);
    }
  };
  const togglePrint = async (recId, v) => {
    setRecs((prev) => prev.map((r) => r.id === recId ? { ...r, include_in_print: v } : r));
    const { error } = await supabase.from("map_recommendations").update({ include_in_print: v }).eq("id", recId);
    if (error) {
      toast({ title: "Не удалось сохранить", description: error.message, variant: "destructive" });
      await reload();
    }
  };
  const openEditor = async (pw) => {
    if (!id) return;
    if (!mapId) {
      const { data, error } = await supabase.from("metabolic_maps").insert({ patient_id: id }).select("id").single();
      if (error) {
        toast({ title: "Не удалось создать карту", description: error.message, variant: "destructive" });
        return;
      }
      setMapId(data.id);
    }
    setEditorPathway(pw);
  };
  const recsByPathway = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const r of recs) {
      const k = r.pathway_id || "_";
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    }
    return m;
  }, [recs]);
  const findingsByPathway = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const f of findings) {
      const key = f.pathway_id || "_unbound";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(f);
    }
    return map;
  }, [findings]);
  const summaryByPathway = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const s of summary) m.set(s.pathway_id, s);
    return m;
  }, [summary]);
  const labCodesById = useMemo(() => {
    const catalog = buildCatalogIndex(catalogRows);
    const m = /* @__PURE__ */ new Map();
    for (const l of labRows) {
      const code = l.test_code && String(l.test_code).trim() ? String(l.test_code).toUpperCase().trim() : resolveCode(l.test_name, catalog);
      if (code) m.set(l.id, code);
    }
    return m;
  }, [labRows, catalogRows]);
  const nodeValuesByPathway = useMemo(() => {
    const out = /* @__PURE__ */ new Map();
    for (const [slug, codeMap] of Object.entries(CODE_NODE_MAP)) {
      const perNode = /* @__PURE__ */ new Map();
      for (const l of labRows) {
        const code = labCodesById.get(l.id);
        if (!code) continue;
        const nodeId = codeMap[code];
        if (!nodeId) continue;
        if (perNode.has(nodeId)) continue;
        const v = l.value == null ? "" : String(l.value);
        const u = l.unit ? ` ${l.unit}` : "";
        perNode.set(nodeId, { text: `${v}${u}`.trim() });
      }
      if (perNode.size) out.set(slug, perNode);
    }
    const aggregates = computeAllAggregates(labRows);
    if (aggregates.size) {
      for (const pw of pathways) {
        const nodeIds = new Set((pw.nodes || []).map((n) => n == null ? void 0 : n.id).filter(Boolean));
        let perNode = out.get(pw.slug);
        for (const [aggNodeId, entry] of aggregates.entries()) {
          if (!nodeIds.has(aggNodeId)) continue;
          if (!perNode) {
            perNode = /* @__PURE__ */ new Map();
            out.set(pw.slug, perNode);
          }
          perNode.set(aggNodeId, { text: entry.text });
        }
      }
    }
    for (const f of findings) {
      if (!f.node_id) continue;
      const ref = f.source_ref || {};
      const ruleCode = String(ref.rule_code || "").toLowerCase();
      const val = ref.value;
      const pw = pathways.find((p) => p.id === f.pathway_id);
      if (!pw) continue;
      const arrow = ruleCode.endsWith("_high") ? "↑ " : ruleCode.endsWith("_low") ? "↓ " : "";
      const labelStr = String(f.label || "");
      const mUnit = labelStr.match(/:\s*[\d.,-]+\s*(.+)$/);
      const unit = mUnit ? ` ${mUnit[1].trim()}` : "";
      const text = val == null || val === "" ? labelStr : `${arrow}${val}${unit}`.trim();
      const sev = f.severity || "moderate";
      let perNode = out.get(pw.slug);
      if (!perNode) {
        perNode = /* @__PURE__ */ new Map();
        out.set(pw.slug, perNode);
      }
      perNode.set(f.node_id, { text, sev });
    }
    return out;
  }, [labRows, labCodesById, findings, pathways]);
  const metaIndices = useMemo(() => computeIndices(labRows), [labRows]);
  if (loading || busy) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (!patient) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center text-muted-foreground", children: "Пациент не найден" });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxs(Helmet, { children: [
      /* @__PURE__ */ jsx("title", { children: `Метаболическая карта — ${patient.full_name}` }),
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 space-y-6 max-w-6xl", children: [
      /* @__PURE__ */ jsxs(Link, { to: `/admin/patients/${patient.id}`, className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        "К пациенту"
      ] }),
      /* @__PURE__ */ jsxs("header", { className: "flex items-start justify-between flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold mb-1 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Activity, { className: "w-7 h-7 text-primary" }),
            "Метаболическая карта"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-sm", children: [
            patient.full_name,
            patient.history_number ? ` · № ИБ ${patient.history_number}` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3" }),
          "Автоагрегатор"
        ] })
      ] }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex flex-wrap items-end gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-[240px] flex-1", children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Источник данных (визит)" }),
          /* @__PURE__ */ jsxs(Select, { value: selectedVisit, onValueChange: setSelectedVisit, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Все данные" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Все данные пациента" }),
              visits.map((v) => /* @__PURE__ */ jsxs(SelectItem, { value: v.id, children: [
                v.visit_date,
                " · ",
                v.protocol_type,
                v.diagnosis ? ` · ${v.diagnosis}` : ""
              ] }, v.id))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: handleAggregate, disabled: aggregating, className: "gap-2", children: [
          aggregating ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
          "Пересчитать отклонения"
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: handleAiBuild, disabled: aiBusy || !mapId, variant: "secondary", className: "gap-2", children: [
          aiBusy ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
          "ИИ-интерпретация",
          aiBusy ? ` · ${aiElapsed}с` : ""
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: handleRebuildRx, disabled: rxBusy || !mapId, variant: "secondary", className: "gap-2", children: [
          rxBusy ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Beaker, { className: "w-4 h-4" }),
          "Подобрать ℞ из каталога"
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer", children: [
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              checked: deidentified,
              onCheckedChange: (v) => setDeidentified(!!v),
              "aria-label": "Отправлять деперсонализированно"
            }
          ),
          "Отправлять деперсонализированно"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "inline-flex rounded-md border border-border overflow-hidden text-xs", children: ["simple", "pro"].map((r) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setRegister(r),
            className: `px-3 py-1.5 transition-colors ${register === r ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`,
            children: REGISTER_LABEL[r]
          },
          r
        )) }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            className: "gap-2",
            disabled: selectedSlugs.size === 0,
            onClick: () => {
              const slugs = [...selectedSlugs].join(",");
              window.open(`/admin/patients/${patient.id}/metabolic-map/print?paths=${encodeURIComponent(slugs)}&register=${register}${selectedVisit !== "all" ? `&visit=${selectedVisit}` : ""}`, "_blank");
            },
            children: [
              /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" }),
              "Печать выбранных (",
              selectedSlugs.size,
              ")"
            ]
          }
        ),
        lastAggregatedAt && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "Последний пересчёт: ",
          new Date(lastAggregatedAt).toLocaleString("ru-RU")
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(DataContextPanel, { patientId: patient.id, visitId: selectedVisit === "all" ? null : selectedVisit }),
      mapNotes && /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Заметки" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("p", { className: "whitespace-pre-wrap text-sm", children: mapNotes }) })
      ] }),
      ai && /* @__PURE__ */ jsxs(Card, { className: "border-primary/40", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 text-primary" }),
            "ИИ-интерпретация",
            typeof ai.overall_confidence === "number" && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "ml-2", children: [
              "confidence ",
              (ai.overall_confidence * 100).toFixed(0),
              "%"
            ] }),
            ai.deidentified && /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: "деперсонализированно" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground", children: [
            "Модель: ",
            ai.model,
            " · ",
            ai.computed_at ? new Date(ai.computed_at).toLocaleString("ru-RU") : ""
          ] })
        ] }),
        Array.isArray(ai.cross_links) && ai.cross_links.length > 0 && /* @__PURE__ */ jsxs(CardContent, { className: "pt-0", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-medium mb-1", children: "Связи между путями:" }),
          /* @__PURE__ */ jsx("ul", { className: "text-xs space-y-1", children: ai.cross_links.map((l, i) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "mr-1", children: l.from }),
            "→",
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "mx-1", children: l.to }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: l.why })
          ] }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Обзорная карта путей" }),
          /* @__PURE__ */ jsx(SeverityLegend, {})
        ] }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsx(
          PathwayTilesGrid,
          {
            pathways: pathways.map((pw) => {
              var _a2;
              const status = ((_a2 = summaryByPathway.get(pw.id)) == null ? void 0 : _a2.status) || ((findingsByPathway.get(pw.id) || []).length ? "moderate" : "no_data");
              const fList = findingsByPathway.get(pw.id) || [];
              const evidence = fList.slice(0, 2).map((f) => f.label).join(" · ");
              return {
                id: pw.id,
                slug: pw.slug,
                name: pw.name,
                status,
                group: pw.group ?? null,
                group_order: pw.group_order ?? null,
                evidence
              };
            }),
            onSelect: (slug) => {
              const el = document.getElementById(`pw-${slug}`);
              el == null ? void 0 : el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        ) }) }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Цепочка проблем: что тянет за собой" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-3 pt-0", children: /* @__PURE__ */ jsx(
            ProblemChainSVG,
            {
              causes: pathways.map((pw) => {
                var _a2;
                return {
                  id: pw.id,
                  slug: pw.slug,
                  name: pw.name,
                  status: ((_a2 = summaryByPathway.get(pw.id)) == null ? void 0 : _a2.status) || ((findingsByPathway.get(pw.id) || []).length ? "moderate" : "no_data"),
                  consequences: pw.consequences || []
                };
              })
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Стероидогенез" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-3 pt-0", children: /* @__PURE__ */ jsx(
            SteroidHubSVG,
            {
              values: (() => {
                const map = nodeValuesByPathway.get("steroidogenesis");
                if (!map || !map.size) return void 0;
                const out = {};
                for (const [nodeId, entry] of map.entries()) {
                  if (!(entry == null ? void 0 : entry.text)) continue;
                  const sev = entry.sev;
                  const status = sev === "norm" || sev === "mild" || sev === "moderate" || sev === "severe" ? sev : "nodata";
                  out[nodeId] = { value: entry.text, status };
                }
                return Object.keys(out).length ? out : void 0;
              })()
            }
          ) })
        ] })
      ] }),
      metaIndices.length > 0 && /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Интегральные индексы" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground -mt-2", children: "Расчётные показатели из спектра. Зелёная зона — цель, жёлтая — пограничная, красная — вне нормы. Стрелка — значение пациента." }),
        /* @__PURE__ */ jsx(IndicesGauges, { indices: metaIndices, patientSex: (patient == null ? void 0 : patient.sex) ?? null })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Метаболические пути" }),
        pathways.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-6 text-sm text-muted-foreground", children: "Справочник путей ещё пуст." }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-2", children: pathways.map((pw) => {
          var _a2, _b2;
          const pwFindings = findingsByPathway.get(pw.id) || [];
          const savedSummary = summaryByPathway.get(pw.id);
          const affectedNodes = /* @__PURE__ */ new Set([
            ...pwFindings.map((f) => f.node_id).filter(Boolean),
            ...(savedSummary == null ? void 0 : savedSummary.affected_nodes) || []
          ]);
          const status = (savedSummary == null ? void 0 : savedSummary.status) || (pwFindings.length ? "moderate" : "no_data");
          const severityText = pickSeverityText(severityTexts, pw.id, status, register);
          const legacyText = pickText(texts, pw.id, register);
          const pwNodeValues = nodeValuesByPathway.get(pw.slug);
          const aiForPath = ((_b2 = (_a2 = ai == null ? void 0 : ai.pathways) == null ? void 0 : _a2.find) == null ? void 0 : _b2.call(_a2, (p) => p.pathway_code === pw.slug)) || null;
          const isSelected = selectedSlugs.has(pw.slug);
          const isAffected = status === "mild" || status === "moderate" || status === "severe";
          return /* @__PURE__ */ jsxs(Card, { id: `pw-${pw.slug}`, className: `overflow-hidden ${isAffected ? "border-primary/40" : ""}`, children: [
            /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
              /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(
                    Checkbox,
                    {
                      checked: isSelected,
                      onCheckedChange: (v) => {
                        setSelectedSlugs((prev) => {
                          const next = new Set(prev);
                          if (v) next.add(pw.slug);
                          else next.delete(pw.slug);
                          return next;
                        });
                      },
                      "aria-label": `Выбрать «${pw.name}» для печати`
                    }
                  ),
                  pw.name
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Badge, { variant: "outline", className: STATUS_BADGE[status], children: SEVERITY_LABEL[status] }),
                  /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 px-2 gap-1 text-xs", onClick: () => openEditor(pw), children: [
                    /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5" }),
                    "Схема"
                  ] })
                ] })
              ] }),
              pw.description && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: pw.description }),
              savedSummary && /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground", children: [
                "Маркеров сопоставлено: ",
                savedSummary.matched_markers,
                pwFindings.length > 0 && ` · отклонений: ${pwFindings.length}`
              ] }),
              savedSummary && savedSummary.needs_phase_codes && savedSummary.needs_phase_codes.length > 0 && /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-blue-700 dark:text-blue-300", children: [
                "🔵 Нужна фаза цикла: ",
                savedSummary.needs_phase_codes.join(", "),
                " — укажите фазу в контексте визита, показатели пропущены."
              ] })
            ] }),
            /* @__PURE__ */ jsxs(CardContent, { className: "pt-0 space-y-3", children: [
              (() => {
                var _a3;
                const pwRecs = recsByPathway.get(pw.id) || [];
                const rxNodes = new Set(pwRecs.map((r) => r.target_node_id || "").filter(Boolean));
                const rxLabelByNode = /* @__PURE__ */ new Map();
                for (const r of pwRecs) {
                  if (!r.target_node_id) continue;
                  const prev = rxLabelByNode.get(r.target_node_id);
                  const name = ((_a3 = r.catalog) == null ? void 0 : _a3.name) || "";
                  rxLabelByNode.set(r.target_node_id, prev ? `${prev} · ${name}` : name);
                }
                const highlightsMap = new Map(Array.from(affectedNodes).map((n) => [n, status]));
                const CUSTOM_SCHEMES = {
                  steroidogenesis: SteroidHubSVG,
                  vit_d_bone: VitDSchemeSVG,
                  endocrine_disruptors: EndoDisruptorsSchemeSVG
                };
                const CustomScheme = CUSTOM_SCHEMES[pw.slug];
                if (CustomScheme) {
                  const vals = {};
                  if (pwNodeValues) {
                    for (const [nodeId, entry] of pwNodeValues.entries()) {
                      if (!(entry == null ? void 0 : entry.text)) continue;
                      const sev = entry.sev;
                      const st = sev === "norm" || sev === "mild" || sev === "moderate" || sev === "severe" ? sev : "nodata";
                      vals[nodeId] = { value: entry.text, status: st };
                    }
                  }
                  return /* @__PURE__ */ jsx(CustomScheme, { values: Object.keys(vals).length ? vals : void 0 });
                }
                if (hasPathwaySvgTemplate(pw.slug)) {
                  return /* @__PURE__ */ jsx(
                    PathwayTemplateSVG,
                    {
                      slug: pw.slug,
                      highlights: highlightsMap,
                      rxNodes,
                      rxLabelByNode,
                      nodeValues: pwNodeValues,
                      overlayScene: schemas.get(pw.slug) || null,
                      maxHeight: 320
                    }
                  );
                }
                const tpl = getTemplate(pw.slug);
                const sceneToRender = schemas.get(pw.slug) || (tpl ? templateToScene(tpl) : null) || (pw.svg_scene && Array.isArray(pw.svg_scene.elements) && pw.svg_scene.elements.length > 0 ? pw.svg_scene : buildAutoScene(pw.nodes || [], pw.edges || []));
                return /* @__PURE__ */ jsx(
                  PathwaySceneSVG,
                  {
                    scene: sceneToRender,
                    highlights: highlightsMap,
                    rxNodes,
                    rxLabelByNode,
                    maxHeight: 280
                  }
                );
              })(),
              pwFindings.length > 0 && /* @__PURE__ */ jsx("ul", { className: "space-y-1 text-xs", children: pwFindings.map((f) => {
                const meta = SEVERITY_META[f.severity] || SEVERITY_META.info;
                const Icon = meta.icon;
                return /* @__PURE__ */ jsxs("li", { className: `flex items-start gap-2 rounded border px-2 py-1 ${meta.cls}`, children: [
                  /* @__PURE__ */ jsx(Icon, { className: "w-3.5 h-3.5 shrink-0 mt-0.5" }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("div", { className: "font-medium", children: f.label }),
                    f.detail && /* @__PURE__ */ jsx("div", { className: "opacity-80", children: f.detail })
                  ] })
                ] }, f.id);
              }) }),
              savedSummary && savedSummary.matched_markers === 0 && /* @__PURE__ */ jsx("div", { className: "text-[11px] italic text-muted-foreground px-2 py-1", children: "Нет лабораторных данных для оценки этого пути." }),
              severityText ? /* @__PURE__ */ jsx("div", { className: "text-xs space-y-1.5 pt-2 border-t", children: /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                  REGISTER_LABEL[register],
                  ":"
                ] }),
                " ",
                severityText
              ] }) }) : status === "norm" ? /* @__PURE__ */ jsx("div", { className: "text-xs italic text-muted-foreground pt-2 border-t", children: "Отклонений не выявлено." }) : legacyText && (legacyText.summary || legacyText.what_broken || legacyText.actions) ? /* @__PURE__ */ jsxs("div", { className: "text-xs space-y-1.5 pt-2 border-t", children: [
                legacyText.summary && /* @__PURE__ */ jsxs("p", { children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Кратко:" }),
                  " ",
                  legacyText.summary
                ] }),
                legacyText.what_broken && /* @__PURE__ */ jsxs("p", { children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Что нарушено:" }),
                  " ",
                  legacyText.what_broken
                ] }),
                legacyText.evidence && /* @__PURE__ */ jsxs("p", { children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "По каким показателям:" }),
                  " ",
                  legacyText.evidence
                ] }),
                legacyText.risks && /* @__PURE__ */ jsxs("p", { children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Чем грозит:" }),
                  " ",
                  legacyText.risks
                ] }),
                legacyText.connections && /* @__PURE__ */ jsxs("p", { children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Связи:" }),
                  " ",
                  legacyText.connections
                ] }),
                legacyText.actions && /* @__PURE__ */ jsxs("p", { children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Что делать:" }),
                  " ",
                  legacyText.actions
                ] })
              ] }) : null,
              aiForPath && /* @__PURE__ */ jsxs("div", { className: "text-xs space-y-1.5 pt-2 border-t border-primary/30", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5 text-primary" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                    "ИИ · ",
                    aiForPath.status
                  ] }),
                  typeof aiForPath.confidence === "number" && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] px-1 py-0", children: [
                    (aiForPath.confidence * 100).toFixed(0),
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("p", { children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                    REGISTER_LABEL[register],
                    ":"
                  ] }),
                  " ",
                  register === "simple" ? aiForPath.text_plain : aiForPath.text_pro
                ] }),
                Array.isArray(aiForPath.markers) && aiForPath.markers.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "font-medium", children: "Маркеры:" }),
                  /* @__PURE__ */ jsx("ul", { className: "ml-3 list-disc", children: aiForPath.markers.slice(0, 8).map((m, i) => /* @__PURE__ */ jsxs("li", { children: [
                    m.code || m.name,
                    ": ",
                    String(m.value),
                    m.unit ? ` ${m.unit}` : "",
                    m.flag && m.flag !== "normal" && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "ml-1 text-[10px] px-1 py-0", children: m.flag })
                  ] }, i)) })
                ] }),
                Array.isArray(aiForPath.recommendations) && aiForPath.recommendations.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "font-medium", children: "Рекомендации ИИ:" }),
                  /* @__PURE__ */ jsx("ul", { className: "ml-3 list-disc", children: aiForPath.recommendations.map((r, i) => /* @__PURE__ */ jsxs("li", { children: [
                    /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px] px-1 py-0 mr-1", children: r.kind }),
                    r.text
                  ] }, i)) })
                ] }),
                Array.isArray(aiForPath.links) && aiForPath.links.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
                  "Связи: ",
                  aiForPath.links.join(", ")
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                RxBlock,
                {
                  recs: recsByPathway.get(pw.id) || [],
                  affectedNodes: [...affectedNodes],
                  onTogglePrint: togglePrint,
                  compact: true,
                  showEmpty: isAffected
                }
              )
            ] })
          ] }, pw.id);
        }) })
      ] }),
      ((_a = findingsByPathway.get("_unbound")) == null ? void 0 : _a.length) ? /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Отклонения вне путей" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("ul", { className: "space-y-1 text-sm", children: findingsByPathway.get("_unbound").map((f) => {
          const meta = SEVERITY_META[f.severity] || SEVERITY_META.info;
          const Icon = meta.icon;
          return /* @__PURE__ */ jsxs("li", { className: `flex items-start gap-2 rounded border px-2 py-1 ${meta.cls}`, children: [
            /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4 shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium", children: f.label }),
              f.detail && /* @__PURE__ */ jsx("div", { className: "text-xs opacity-80", children: f.detail })
            ] })
          ] }, f.id);
        }) }) })
      ] }) : null,
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsx(
          DynamicsPanel,
          {
            patientId: patient.id,
            currentSummary: summary.map((s) => ({ pathway_id: s.pathway_id, slug: s.slug, status: s.status })),
            currentPathways: pathways.map((p) => ({ id: p.id, slug: p.slug, name: p.name })),
            visitId: selectedVisit === "all" ? null : selectedVisit
          }
        ),
        /* @__PURE__ */ jsx(
          GuardianManager,
          {
            patientId: patient.id,
            shareSimpleOnly: patient.share_simple_only ?? true,
            onShareChange: (v) => setPatient((prev) => prev ? { ...prev, share_simple_only: v } : prev)
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        CompletenessInspector,
        {
          patientId: patient.id,
          pathways: pathways.map((p) => ({ id: p.id, slug: p.slug, name: p.name, rules: p.rules })),
          summary,
          visitDate: selectedVisit && selectedVisit !== "all" ? ((_b = visits.find((v) => v.id === selectedVisit)) == null ? void 0 : _b.visit_date) || null : null
        }
      ),
      /* @__PURE__ */ jsx(
        AuditPanel,
        {
          mapId,
          pathways: pathways.map((p) => ({ id: p.id, slug: p.slug, name: p.name })),
          summary,
          findings,
          ai
        }
      ),
      /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Pill, { className: "w-5 h-5" }),
            "℞ Точки приложения терапии (из каталога)"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            "Отмечены на печать: ",
            recs.filter((r) => r.include_in_print).length,
            " из ",
            recs.length
          ] })
        ] }),
        recs.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-6 text-sm text-muted-foreground", children: "Нажмите «Подобрать из каталога», чтобы связать сработавшие показатели со средствами каталога лечения. Ничего вне каталога предложено не будет." }) }) : /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsx(RxBlock, { recs, onTogglePrint: togglePrint }) }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "pt-6 text-xs text-muted-foreground border-t", children: "Автоагрегатор сравнивает измеренные значения с референсами по полу и возрасту (из lab_results) и детерминированно выставляет статус: норма / лёгкое / умеренное / тяжёлое. Значения не выдумываются: если по пути нет данных — статус «нет данных»." })
    ] }),
    editorPathway && (() => {
      const svgTpl = hasPathwaySvgTemplate(editorPathway.slug);
      const tpl = svgTpl ? null : getTemplate(editorPathway.slug);
      const templateScene = svgTpl ? { elements: [], appState: { viewBackgroundColor: "transparent" }, files: {} } : (tpl ? templateToScene(tpl) : null) || (editorPathway.svg_scene && Array.isArray(editorPathway.svg_scene.elements) && editorPathway.svg_scene.elements.length > 0 ? editorPathway.svg_scene : buildAutoScene(editorPathway.nodes || [], editorPathway.edges || []));
      const patientScene = schemas.get(editorPathway.slug) || null;
      return /* @__PURE__ */ jsx(
        PathwayEditor,
        {
          open: !!editorPathway,
          onOpenChange: (v) => {
            if (!v) setEditorPathway(null);
          },
          mapId,
          pathwayCode: editorPathway.slug,
          pathwayName: editorPathway.name,
          patientScene,
          templateScene,
          backgroundNode: svgTpl ? /* @__PURE__ */ jsx(
            PathwayTemplateSVG,
            {
              slug: editorPathway.slug,
              maxHeight: 9999
            }
          ) : void 0,
          onSaved: (scene) => {
            setSchemas((prev) => {
              const next = new Map(prev);
              if (scene) next.set(editorPathway.slug, scene);
              else next.delete(editorPathway.slug);
              return next;
            });
          }
        }
      );
    })()
  ] });
}
export {
  AdminPatientMetabolicMap as default
};
