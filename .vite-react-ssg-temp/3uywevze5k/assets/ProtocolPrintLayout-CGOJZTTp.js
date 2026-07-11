import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { P as PROTOCOL_TYPE_MAP } from "./protocolTypes-BWCSK0Md.js";
import { L as Label, I as Input, r as Checkbox } from "../main.mjs";
import { useId } from "react";
function AgeCombobox({ value, onChange, placeholder = "возраст", disabled, allowNone }) {
  const listId = useId();
  const display = value === null || value === void 0 ? "" : String(value);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        inputMode: "numeric",
        list: listId,
        value: display,
        placeholder,
        disabled,
        onChange: (e) => {
          const raw = e.target.value.trim();
          if (raw === "") return onChange(null);
          if (raw === "нет") return onChange("нет");
          const n = Number(raw.replace(",", "."));
          if (Number.isFinite(n) && String(n) === raw) return onChange(n);
          onChange(raw);
        },
        className: "h-9 w-full rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
      }
    ),
    /* @__PURE__ */ jsxs("datalist", { id: listId, children: [
      [9, 10, 11, 12, 13, 14, 15, 16, 17].map((n) => /* @__PURE__ */ jsx("option", { value: String(n) }, n)),
      allowNone ? /* @__PURE__ */ jsx("option", { value: "нет" }) : null
    ] })
  ] });
}
const DEFAULT_SEXUAL_CONSTITUTION = {
  start: null,
  pub: null,
  er: "",
  mast: "",
  ej: "",
  ejage: null,
  mast_fr: null,
  sx: "",
  sxage: null,
  part: null,
  prev: null,
  score: 0,
  no_interview: false
};
function plusScore(v) {
  if (v === "+") return 1;
  if (v === "++") return 2;
  if (v === "+++") return 3;
  return 0;
}
function computeScConstitutionScore(d) {
  return plusScore(d.er) + plusScore(d.mast) + plusScore(d.ej) + plusScore(d.sx) + (typeof d.mast_fr === "number" ? d.mast_fr : 0) + (typeof d.part === "number" ? d.part : 0);
}
function toObject(value) {
  if (!value) return { ...DEFAULT_SEXUAL_CONSTITUTION };
  if (typeof value === "string") {
    return { ...DEFAULT_SEXUAL_CONSTITUTION, legacy_text: value };
  }
  return { ...DEFAULT_SEXUAL_CONSTITUTION, ...value };
}
function Sel({
  value,
  onChange,
  options,
  disabled
}) {
  return /* @__PURE__ */ jsxs(
    "select",
    {
      value: value === null || value === void 0 ? "" : String(value),
      onChange: (e) => {
        const raw = e.target.value;
        if (raw === "") return onChange(null);
        const num = Number(raw);
        onChange(Number.isFinite(num) && String(num) === raw ? num : raw);
      },
      disabled,
      className: "h-9 w-full rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50",
      children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "—" }),
        options.map((o) => /* @__PURE__ */ jsx("option", { value: String(o.v), children: o.label }, String(o.v)))
      ]
    }
  );
}
function SexualConstitutionSection({ value, onChange }) {
  const d = toObject(value);
  const disabled = !!d.no_interview;
  const score = computeScConstitutionScore(d);
  const patch = (p) => {
    const next = { ...d, ...p };
    next.score = computeScConstitutionScore(next);
    onChange(next);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    d.legacy_text ? /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-dashed bg-muted/40 p-2 text-xs text-muted-foreground", children: [
      "Импортировано из старого протокола: ",
      /* @__PURE__ */ jsx("em", { children: d.legacy_text })
    ] }) : null,
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs(Label, { className: "text-xs", children: [
          "Start ",
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-normal", children: "(начало)" })
        ] }),
        /* @__PURE__ */ jsx(AgeCombobox, { value: d.start ?? null, onChange: (v) => patch({ start: v }), disabled })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs(Label, { className: "text-xs", children: [
          "Pub ",
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-normal", children: "(пубархе)" })
        ] }),
        /* @__PURE__ */ jsx(AgeCombobox, { value: d.pub ?? null, onChange: (v) => patch({ pub: v }), disabled })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs(Label, { className: "text-xs", children: [
          "Er ",
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-normal", children: "(эрекции)" })
        ] }),
        /* @__PURE__ */ jsx(
          Sel,
          {
            value: d.er || "",
            onChange: (v) => patch({ er: v || "" }),
            options: [{ v: "+", label: "+" }, { v: "++", label: "++" }, { v: "+++", label: "+++" }],
            disabled
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs(Label, { className: "text-xs", children: [
          "Mast ",
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-normal", children: "(мастурбация)" })
        ] }),
        /* @__PURE__ */ jsx(
          Sel,
          {
            value: d.mast || "",
            onChange: (v) => patch({ mast: v || "" }),
            options: [{ v: "+", label: "+" }, { v: "-", label: "−" }],
            disabled
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs(Label, { className: "text-xs", children: [
          "Ej ",
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-normal", children: "(эякуляции)" })
        ] }),
        /* @__PURE__ */ jsx(
          Sel,
          {
            value: d.ej || "",
            onChange: (v) => patch({ ej: v || "" }),
            options: [{ v: "+", label: "+" }, { v: "-", label: "−" }],
            disabled
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs(Label, { className: "text-xs", children: [
          "Ejage ",
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-normal", children: "(возраст эякуляций)" })
        ] }),
        /* @__PURE__ */ jsx(AgeCombobox, { value: d.ejage ?? null, onChange: (v) => patch({ ejage: v }), allowNone: true, disabled })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs(Label, { className: "text-xs", children: [
          "MastFR ",
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-normal", children: "(частота, /нед)" })
        ] }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "number",
            step: "0.1",
            min: 0,
            value: d.mast_fr ?? "",
            onChange: (e) => patch({ mast_fr: e.target.value === "" ? null : Number(e.target.value) }),
            disabled
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs(Label, { className: "text-xs", children: [
          "Sx ",
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-normal", children: "(половые контакты)" })
        ] }),
        /* @__PURE__ */ jsx(
          Sel,
          {
            value: d.sx || "",
            onChange: (v) => patch({ sx: v || "" }),
            options: [{ v: "+", label: "+" }, { v: "-", label: "−" }],
            disabled
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs(Label, { className: "text-xs", children: [
          "Sxage ",
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-normal", children: "(возраст начала)" })
        ] }),
        /* @__PURE__ */ jsx(AgeCombobox, { value: d.sxage ?? null, onChange: (v) => patch({ sxage: v }), allowNone: true, disabled })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs(Label, { className: "text-xs", children: [
          "Part ",
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-normal", children: "(партнёры, число)" })
        ] }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "number",
            step: "1",
            min: 0,
            value: d.part ?? "",
            onChange: (e) => patch({ part: e.target.value === "" ? null : Math.round(Number(e.target.value)) }),
            disabled
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs(Label, { className: "text-xs", children: [
          "Prev ",
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-normal", children: "(превенция, %)" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              step: "1",
              min: 0,
              max: 100,
              value: d.prev ?? "",
              onChange: (e) => {
                const v = e.target.value === "" ? null : Math.max(0, Math.min(100, Math.round(Number(e.target.value))));
                patch({ prev: v });
              },
              disabled
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "%" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
        "Сумма баллов: ",
        /* @__PURE__ */ jsx("span", { className: "font-semibold tabular-nums", children: score })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
        /* @__PURE__ */ jsx(
          Checkbox,
          {
            checked: !!d.no_interview,
            onCheckedChange: (c) => patch({ no_interview: !!c })
          }
        ),
        /* @__PURE__ */ jsx("span", { children: "без опроса" })
      ] })
    ] })
  ] });
}
function formatSexualConstitution(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value.no_interview) return "без опроса";
  const parts = [];
  const push = (label, v, suffix = "") => {
    if (v === null || v === void 0 || v === "") return;
    parts.push(`${label} ${v}${suffix}`);
  };
  push("Start", value.start);
  push("Pub", value.pub);
  push("Er", value.er);
  push("Mast", value.mast === "-" ? "−" : value.mast);
  push("Ej", value.ej === "-" ? "−" : value.ej);
  push("Ejage", value.ejage);
  push("MastFR", value.mast_fr, "/нед");
  push("Sx", value.sx === "-" ? "−" : value.sx);
  push("Sxage", value.sxage);
  if (typeof value.part === "number") push("Part", value.part);
  if (typeof value.prev === "number") push("Prev", value.prev, "%");
  const score = computeScConstitutionScore(value);
  if (score > 0) parts.push(`Σ ${score}`);
  return parts.join(" / ");
}
function calcAge(birth, ref) {
  const b = new Date(birth);
  let age = ref.getFullYear() - b.getFullYear();
  const m = ref.getMonth() - b.getMonth();
  if (m < 0 || m === 0 && ref.getDate() < b.getDate()) age--;
  return age;
}
function Field({ label, value }) {
  if (value === void 0 || value === null || value === "" || value === false) return null;
  const display = typeof value === "boolean" ? "Да" : String(value);
  return /* @__PURE__ */ jsxs("tr", { children: [
    /* @__PURE__ */ jsx("td", { className: "ppl-label", children: label }),
    /* @__PURE__ */ jsx("td", { className: "ppl-value", children: display })
  ] });
}
function SideField({
  label,
  right,
  left
}) {
  if (!right && !left) return null;
  return /* @__PURE__ */ jsxs("tr", { children: [
    /* @__PURE__ */ jsx("td", { className: "ppl-label", children: label }),
    /* @__PURE__ */ jsx("td", { className: "ppl-value", children: /* @__PURE__ */ jsx("table", { className: "ppl-side", children: /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsxs("td", { className: "ppl-side-cell", children: [
        /* @__PURE__ */ jsx("strong", { children: "Справа:" }),
        " ",
        right || "—"
      ] }),
      /* @__PURE__ */ jsxs("td", { className: "ppl-side-cell", children: [
        /* @__PURE__ */ jsx("strong", { children: "Слева:" }),
        " ",
        left || "—"
      ] })
    ] }) }) }) })
  ] });
}
function Section({ title, children }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 2, className: "ppl-section", children: title }) }),
    children
  ] });
}
const UZI_LABELS = {
  device: "Аппарат",
  indications: "Показания",
  conclusion: "Заключение УЗИ",
  vessels: "Сосуды",
  doppler: "ЦДК",
  free_fluid: "Свободная жидкость",
  ureters: "Мочеточники",
  residual_urine: "Остаточная моча",
  bladder_volume: "Объём мочевого пузыря, мл",
  bladder_walls: "Стенки мочевого пузыря",
  bladder_contents: "Содержимое мочевого пузыря",
  right_testis_size: "Правое яичко (размеры)",
  left_testis_size: "Левое яичко (размеры)",
  right_testis_volume: "Правое яичко, V мл",
  left_testis_volume: "Левое яичко, V мл",
  right_testis_structure: "Правое яичко (структура)",
  left_testis_structure: "Левое яичко (структура)",
  right_epididymis: "Правый придаток",
  left_epididymis: "Левый придаток",
  right_epididymis_volume: "Правый придаток, V см³",
  left_epididymis_volume: "Левый придаток, V см³",
  right_kidney_size: "Правая почка (размеры)",
  left_kidney_size: "Левая почка (размеры)",
  right_kidney_parenchyma: "Правая почка (паренхима)",
  left_kidney_parenchyma: "Левая почка (паренхима)",
  right_kidney_pelvis: "Правая почка (лоханка)",
  left_kidney_pelvis: "Левая почка (лоханка)",
  right_kidney_structure: "Правая почка (структура)",
  left_kidney_structure: "Левая почка (структура)",
  testes: "Яички",
  epididymis: "Придатки",
  kidneys: "Почки",
  bladder: "Мочевой пузырь",
  prostate: "Предстательная железа",
  scrotum: "Мошонка",
  size: "Размеры",
  volume: "Объём, мл",
  structure: "Структура",
  parenchyma: "Паренхима",
  pelvis: "Лоханка",
  penis_exam: "Исследование полового члена",
  right_cavernous_diameter: "Ø правого кавернозного тела, мм",
  left_cavernous_diameter: "Ø левого кавернозного тела, мм",
  spongious_diameter: "Ø спонгиозного тела, мм",
  tunica: "Белочная оболочка и фасции",
  dorsal_bundle: "Дорзальный пучок",
  dorsal_artery_vmax: "Дорзальная артерия, Vmax (см/с)",
  cavernous_arteries: "Кавернозные артерии",
  right_cavernous_artery: "Правая кавернозная артерия",
  left_cavernous_artery: "Левая кавернозная артерия",
  urethra: "Уретра",
  position: "Положение",
  syntopy: "Синтопия с органами таза",
  pelvic_effusion: "Выпот в углублениях таза",
  prostate_volume: "Объём предстательной железы, см³",
  middle_lobe_volume: "Средняя доля, объём, см³",
  infravesical_obstruction: "Косвенные признаки инфравезикальной обструкции",
  urethra_internal_opening: "Внутреннее отверстие уретры",
  elastography_right: "Эластография (правая доля)",
  elastography_left: "Эластография (левая доля)",
  micturition_urge: "Позыв на микцию, баллов",
  residual_urine_volume: "Остаточная моча, мл",
  residual_urine_percent: "Остаточная моча, %",
  paraprostatic_veins: "Парапростатические вены",
  diameter: "Диаметр, мм",
  reflux: "Рефлюкс",
  // Аорто-мезентериальный конфликт
  aorto_mesenteric: "Зона аорто-мезентериального конфликта",
  aorta_structure: "Структура и ход аорты",
  sma_origin: "Отхождение верхней брыжеечной артерии",
  left_renal_vein_position: "Положение левой почечной вены",
  retroaortic_component: "Ретроаортальный компонент левой почечной вены",
  diameter_premesenteric: "Премезентериальный диаметр ЛПВ, мм",
  diameter_intramesenteric: "Интрамезентериальный диаметр ЛПВ, мм",
  diameter_postmesenteric: "Постмезентериальный диаметр ЛПВ, мм",
  ratio_pre_intra: "Соотношение премезентериальный : интрамезентериальный",
  stenosis_flow_velocity: "Скорость потока в зоне сужения, см/с",
  // Илиакальный конфликт (Мей–Тернера)
  iliac_may_thurner: "Зона илиакального конфликта (Мей–Тернера)",
  may_thurner_anatomy: "Анатомия зоны Мей–Тернера",
  left_common_iliac_diameter: "Диаметр левой общей подвздошной вены, мм",
  flow_videographically: "Видеографически",
  compression_flow_velocity: "Скорость потока в зоне компрессии, см/с"
};
const humanize = (k) => UZI_LABELS[k] || k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const hasRightLeft = (v) => isPlainObject(v) && ("right" in v || "left" in v);
const renderScalar = (v) => {
  if (v === null || v === void 0 || v === "") return "";
  if (typeof v === "boolean") return v ? "Да" : "Нет";
  return String(v);
};
const ARTERIAL_LABELS = {
  vmax: "Vmax (см/с)",
  vmin: "Vmin (см/с)",
  vmed: "Vmed/T (см/с)",
  ri: "RI",
  pi: "PI",
  acc: "Acc (см/с²)"
};
const VENOUS_LABELS = {
  v_dir: "V dir (см/с)",
  v_red: "V red (см/с)",
  v_rev: "V rev / Вальсальва (см/с)",
  t_ref: "T ref (сек)",
  acc_ref: "Acc ref (см/с²)",
  diameter: "Диаметр вен (мм)"
};
function pushSideFlow(rows, data, keyPrefix, title, labels) {
  if (!isPlainObject(data)) return;
  const r = data.right || {};
  const l = data.left || {};
  const params = Object.keys(labels).filter((k) => r[k] || l[k]);
  if (params.length === 0) return;
  rows.push(
    /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 2, className: "ppl-subsection", children: title }) }, `${keyPrefix}-h`)
  );
  params.forEach((k) => {
    rows.push(
      /* @__PURE__ */ jsx(SideField, { label: labels[k], right: r[k], left: l[k] }, `${keyPrefix}-${k}`)
    );
  });
}
function pushArterialFlow(rows, af, keyPrefix) {
  pushSideFlow(rows, af, keyPrefix, "Артериальный кровоток", ARTERIAL_LABELS);
}
function pushVenousFlow(rows, vf, keyPrefix) {
  if (!isPlainObject(vf)) return;
  if (hasRightLeft(vf)) {
    pushSideFlow(rows, vf, keyPrefix, "Венозный кровоток", VENOUS_LABELS);
    return;
  }
  const params = Object.keys(VENOUS_LABELS).filter((k) => k !== "diameter" && vf[k]);
  const hasDiam = vf.diameter_right || vf.diameter_left;
  if (params.length === 0 && !hasDiam) return;
  rows.push(
    /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 2, className: "ppl-subsection", children: "Венозный кровоток" }) }, `${keyPrefix}-h`)
  );
  params.forEach((k) => {
    rows.push(/* @__PURE__ */ jsx(Field, { label: VENOUS_LABELS[k], value: vf[k] }, `${keyPrefix}-${k}`));
  });
  if (hasDiam) {
    rows.push(
      /* @__PURE__ */ jsx(SideField, { label: "Диаметр вен (мм)", right: vf.diameter_right, left: vf.diameter_left }, `${keyPrefix}-diam`)
    );
  }
}
function pushPenisExam(rows, pe, keyPrefix) {
  if (!isPlainObject(pe)) return;
  const order = [
    "structure",
    "right_cavernous_diameter",
    "left_cavernous_diameter",
    "spongious_diameter",
    "tunica",
    "dorsal_bundle",
    "dorsal_artery_vmax",
    "cavernous_arteries",
    "right_cavernous_artery",
    "left_cavernous_artery",
    "urethra",
    "conclusion"
  ];
  const visible = order.filter((k) => pe[k] !== void 0 && pe[k] !== null && pe[k] !== "");
  if (visible.length === 0) return;
  rows.push(
    /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 2, className: "ppl-subsection", children: "Исследование полового члена" }) }, `${keyPrefix}-h`)
  );
  visible.forEach((k) => {
    rows.push(/* @__PURE__ */ jsx(Field, { label: humanize(k), value: renderScalar(pe[k]) }, `${keyPrefix}-${k}`));
  });
}
const UZI_FIELD_ORDER = [
  "device",
  "indications",
  "right_testis_size",
  "right_testis_volume",
  "right_testis_structure",
  "left_testis_size",
  "left_testis_volume",
  "left_testis_structure",
  "right_epididymis",
  "right_epididymis_volume",
  "left_epididymis",
  "left_epididymis_volume",
  "arterial_flow",
  "venous_flow",
  "prostate",
  "perineum",
  "penis_exam",
  "aorto_mesenteric",
  "iliac_may_thurner",
  "vessels",
  "doppler",
  "free_fluid",
  "conclusion"
];
const UZI_HIDDEN_KEYS = /* @__PURE__ */ new Set(["show_penis_exam", "show_prostate", "enabled"]);
function orderedEntries(obj) {
  const keys = Object.keys(obj);
  const idx = (k) => {
    const i = UZI_FIELD_ORDER.indexOf(k);
    return i === -1 ? UZI_FIELD_ORDER.length : i;
  };
  return keys.slice().sort((a, b) => idx(a) - idx(b)).map((k) => [k, obj[k]]);
}
function UziRenderer({ uzi, title }) {
  const rows = [];
  const showPenis = uzi.show_penis_exam !== false;
  const showProstate = uzi.show_prostate !== false;
  const walk = (obj, prefix = "", ordered = false) => {
    const entries = ordered ? orderedEntries(obj) : Object.entries(obj);
    entries.forEach(([k, v]) => {
      if (v === null || v === void 0 || v === "") return;
      if (ordered && UZI_HIDDEN_KEYS.has(k)) return;
      if (ordered && k === "penis_exam" && !showPenis) return;
      if (ordered && k === "prostate" && !showProstate) return;
      const rk = `${prefix}${k}`;
      if (k === "arterial_flow") {
        pushArterialFlow(rows, v, rk);
        return;
      }
      if (k === "venous_flow") {
        pushVenousFlow(rows, v, rk);
        return;
      }
      if (k === "penis_exam") {
        pushPenisExam(rows, v, rk);
        return;
      }
      if (hasRightLeft(v)) {
        rows.push(/* @__PURE__ */ jsx(SideField, { label: humanize(k), right: renderScalar(v.right), left: renderScalar(v.left) }, rk));
      } else if (isPlainObject(v)) {
        rows.push(/* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 2, className: "ppl-subsection", children: humanize(k) }) }, `${rk}-h`));
        walk(v, `${rk}.`);
      } else {
        rows.push(/* @__PURE__ */ jsx(Field, { label: humanize(k), value: renderScalar(v) }, rk));
      }
    });
  };
  walk(uzi, "", true);
  if (rows.length === 0) return null;
  return /* @__PURE__ */ jsx(Section, { title, children: rows });
}
function pushPsychBlocks(rows, d) {
  if (d.psych_status_full) rows.push(/* @__PURE__ */ jsx(Field, { label: "Психиатрический статус", value: d.psych_status_full }, "psyf"));
  const projs = [
    ["proj_person", "Рисунок человека"],
    ["proj_htp", "Дом–Дерево–Человек"],
    ["proj_family", "Рисунок семьи"],
    ["proj_animal", "Несуществующее животное"],
    ["proj_free", "Свободный рисунок"]
  ];
  const projRows = projs.filter(([k]) => d[k]).map(([k, label]) => /* @__PURE__ */ jsx(Field, { label, value: d[k] }, `pr-${k}`));
  if (projRows.length > 0) {
    rows.push(/* @__PURE__ */ jsx(Section, { title: "Проективное тестирование", children: projRows }, "proj"));
  }
  if (d.psych_conclusion) rows.push(/* @__PURE__ */ jsx(Field, { label: "Итоговые характеристики", value: d.psych_conclusion }, "psyc"));
}
function pushSomatic(rows, d) {
  if (!d.somatic) return;
  const anth = [
    d.somatic.height_cm ? `рост ${d.somatic.height_cm} см` : null,
    d.somatic.weight_kg ? `вес ${d.somatic.weight_kg} кг` : null,
    d.somatic.bp ? `АД ${d.somatic.bp}` : null,
    d.somatic.pulse ? `пульс ${d.somatic.pulse}` : null
  ].filter(Boolean).join(", ");
  rows.push(
    /* @__PURE__ */ jsxs(Section, { title: "Соматический статус", children: [
      /* @__PURE__ */ jsx(Field, { label: "Антропометрия / витальные", value: anth }),
      /* @__PURE__ */ jsx(Field, { label: "Общее состояние", value: d.somatic.general }),
      /* @__PURE__ */ jsx(Field, { label: "Кожные покровы", value: d.somatic.skin }),
      /* @__PURE__ */ jsx(Field, { label: "Лимфоузлы", value: d.somatic.lymph_nodes }),
      /* @__PURE__ */ jsx(Field, { label: "Органы дыхания", value: d.somatic.respiratory }),
      /* @__PURE__ */ jsx(Field, { label: "ССС", value: d.somatic.cardiovascular }),
      /* @__PURE__ */ jsx(Field, { label: "Живот", value: d.somatic.abdomen })
    ] }, "som")
  );
}
function pushSexual(rows, d) {
  if (d.sexual_formula) {
    const f = d.sexual_formula;
    rows.push(
      /* @__PURE__ */ jsx(
        Field,
        {
          label: "Половая формула",
          value: `P${f.P ?? 0} Ax${f.Ax ?? 0} F${f.F ?? 0} L${f.L ?? 0} G${f.G ?? 0}${f.formula_note ? ` — ${f.formula_note}` : ""}`
        },
        "sf"
      )
    );
  }
  if (d.sexual_formula_text) rows.push(/* @__PURE__ */ jsx(Field, { label: "Половая формула (текст)", value: d.sexual_formula_text }, "sft"));
  const sc = formatSexualConstitution(d.sexual_constitution);
  if (sc) rows.push(/* @__PURE__ */ jsx(Field, { label: "Половая конституция", value: sc }, "sc"));
}
function pushLocalStatus(rows, d) {
  if (!d.local_status) return;
  const ls = d.local_status;
  rows.push(
    /* @__PURE__ */ jsxs(Section, { title: "Локальный статус", children: [
      /* @__PURE__ */ jsx(Field, { label: "Наружные половые органы", value: ls.external_genitalia }),
      ls.scrotum_right || ls.scrotum_left ? /* @__PURE__ */ jsx(SideField, { label: "Органы мошонки", right: ls.scrotum_right, left: ls.scrotum_left }) : null,
      ls.right || ls.left ? /* @__PURE__ */ jsx(SideField, { label: "Локальный статус", right: ls.right, left: ls.left }) : null,
      /* @__PURE__ */ jsx(Field, { label: "Половой член", value: ls.penis }),
      /* @__PURE__ */ jsx(Field, { label: "Промежность", value: ls.perineum }),
      ls.scrotum ? /* @__PURE__ */ jsx(Field, { label: "Мошонка", value: ls.scrotum }) : null,
      ls.right_testis || ls.left_testis ? /* @__PURE__ */ jsx(
        SideField,
        {
          label: "Яичко",
          right: [ls.right_testis, ls.right_testis_volume ? `объём ${ls.right_testis_volume} мл` : null].filter(Boolean).join(", "),
          left: [ls.left_testis, ls.left_testis_volume ? `объём ${ls.left_testis_volume} мл` : null].filter(Boolean).join(", ")
        }
      ) : null,
      /* @__PURE__ */ jsx(Field, { label: "Придатки", value: ls.epididymis }),
      /* @__PURE__ */ jsx(Field, { label: "Семенные канатики", value: ls.spermatic_cord }),
      /* @__PURE__ */ jsx(Field, { label: "Паховые кольца", value: ls.inguinal_rings }),
      /* @__PURE__ */ jsx(Field, { label: "Дополнительно", value: ls.notes })
    ] }, "ls")
  );
}
function pushClinical(rows, d) {
  if (d.ortho_status) rows.push(/* @__PURE__ */ jsx(Field, { label: "Ортопедический статус", value: d.ortho_status }, "ortho"));
  if (d.neuro_status) rows.push(/* @__PURE__ */ jsx(Field, { label: "Неврологический статус", value: d.neuro_status }, "neuro"));
  if (d.neuro_status_full) rows.push(/* @__PURE__ */ jsx(Field, { label: "Неврологический статус (расш.)", value: d.neuro_status_full }, "neurof"));
  if (d.psych_status) rows.push(/* @__PURE__ */ jsx(Field, { label: "Психологический статус", value: d.psych_status }, "psych"));
  pushPsychBlocks(rows, d);
}
const KNOWN_KEYS = /* @__PURE__ */ new Set([
  "complaints",
  "anamnesis",
  "dynamics",
  "conclusion",
  "indications",
  "exam_plan",
  "recommendations",
  "consultation_notes",
  "somatic",
  "sexual_formula",
  "sexual_formula_text",
  "sexual_constitution",
  "local_status",
  "ortho_status",
  "neuro_status",
  "neuro_status_full",
  "psych_status",
  "psych_status_full",
  "psych_conclusion",
  "proj_person",
  "proj_htp",
  "proj_family",
  "proj_animal",
  "proj_free",
  "uzi",
  "assignments",
  "fields",
  "cbc",
  "urinalysis",
  "biochem",
  "hormones",
  "other_labs",
  "operation_name",
  "operation_date",
  "temperature",
  "general_status",
  "wound_status",
  "dressing",
  "pain",
  "healing",
  "sutures_removed",
  // online_consult
  "reason",
  "prior_visit",
  "prior_visit_date",
  "prior_visit_note",
  "current_state",
  "external_exam_by_photo",
  "external_exam_by_video",
  "external_genitalia",
  "interpretation",
  "channel",
  "duration_min",
  "in_person_needed",
  "in_person_urgency",
  // peptide_program
  "program_title",
  "goal",
  "start_date",
  "control_date",
  "items",
  // служебные поля — никогда не печатаются
  "ai_reasoning",
  "_normalized",
  "_normalized_version",
  "_normalized_at"
]);
function pushUnknownScalars(rows, d) {
  if (!isPlainObject(d)) return;
  Object.entries(d).forEach(([k, v]) => {
    if (KNOWN_KEYS.has(k)) return;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      if (v === "" || v === null || v === void 0) return;
      rows.push(/* @__PURE__ */ jsx(Field, { label: humanize(k), value: renderScalar(v) }, `x-${k}`));
    }
  });
}
function ProtocolBody({ visit }) {
  const t = visit.protocol_type;
  const d = visit.protocol_data || {};
  const rows = [];
  if (t === "ultrashort") {
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Жалобы", value: d.complaints }, "c"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Краткий анамнез", value: d.anamnesis }, "a"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Динамика", value: d.dynamics }, "dy"));
    pushSomatic(rows, d);
    pushSexual(rows, d);
    if (d.consultation_notes) {
      rows.push(/* @__PURE__ */ jsx(Field, { label: "Сведения о консультации", value: d.consultation_notes }, "cn"));
    }
    if (typeof d.local_status === "string" && d.local_status) {
      rows.push(/* @__PURE__ */ jsx(Field, { label: "Локальный статус", value: d.local_status }, "ls-legacy"));
    } else {
      pushLocalStatus(rows, d);
    }
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Заключение", value: d.conclusion }, "z"));
  }
  if (t === "postop_day3" || t === "postop_day7") {
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Операция", value: d.operation_name }, "op"));
    rows.push(/* @__PURE__ */ jsx(
      Field,
      {
        label: "Дата операции",
        value: d.operation_date ? format(new Date(d.operation_date), "dd.MM.yyyy") : null
      },
      "opd"
    ));
    if (t === "postop_day3") rows.push(/* @__PURE__ */ jsx(Field, { label: "Температура", value: d.temperature }, "t"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Общее состояние", value: d.general_status }, "gs"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Состояние раны", value: d.wound_status }, "ws"));
    if (t === "postop_day3") {
      rows.push(/* @__PURE__ */ jsx(Field, { label: "Перевязка", value: d.dressing }, "dr"));
      rows.push(/* @__PURE__ */ jsx(Field, { label: "Болевой синдром", value: d.pain }, "p"));
    } else {
      rows.push(/* @__PURE__ */ jsx(Field, { label: "Заживление", value: d.healing }, "h"));
      rows.push(/* @__PURE__ */ jsx(Field, { label: "Швы сняты", value: d.sutures_removed }, "su"));
    }
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Жалобы", value: d.complaints }, "cm"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Анамнез", value: d.anamnesis }, "an"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Динамика", value: d.dynamics }, "dy"));
  }
  if (t === "primary_short") {
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Жалобы", value: d.complaints }, "c"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Анамнез", value: d.anamnesis }, "a"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Динамика", value: d.dynamics }, "dy"));
    pushSomatic(rows, d);
    pushSexual(rows, d);
    pushLocalStatus(rows, d);
    pushClinical(rows, d);
    rows.push(/* @__PURE__ */ jsx(Field, { label: "План обследования", value: d.exam_plan }, "ep"));
    if (d.uzi && isPlainObject(d.uzi)) {
      rows.push(/* @__PURE__ */ jsx(UziRenderer, { uzi: d.uzi, title: "УЗИ" }, "uzi"));
    }
  }
  if (t === "repeat_with_labs") {
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Жалобы", value: d.complaints }, "c"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Анамнез", value: d.anamnesis }, "a"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Динамика", value: d.dynamics }, "dy"));
    rows.push(
      /* @__PURE__ */ jsxs(Section, { title: "Лабораторные данные", children: [
        /* @__PURE__ */ jsx(Field, { label: "ОАК", value: d.cbc }),
        /* @__PURE__ */ jsx(Field, { label: "ОАМ", value: d.urinalysis }),
        /* @__PURE__ */ jsx(Field, { label: "Биохимия", value: d.biochem }),
        /* @__PURE__ */ jsx(Field, { label: "Гормоны", value: d.hormones }),
        /* @__PURE__ */ jsx(Field, { label: "Другие исследования", value: d.other_labs })
      ] }, "labs")
    );
    pushLocalStatus(rows, d);
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Заключение", value: d.conclusion }, "z"));
  }
  if (t === "uzi_reproductive" || t === "dynamic_with_uzi" || t === "repeat_with_uzi") {
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Жалобы", value: d.complaints }, "c"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Анамнез", value: d.anamnesis }, "a"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Динамика", value: d.dynamics }, "dy"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Показания", value: d.indications }, "i"));
    if (d.uzi && isPlainObject(d.uzi)) {
      rows.push(/* @__PURE__ */ jsx(
        UziRenderer,
        {
          uzi: d.uzi,
          title: t === "uzi_reproductive" ? "УЗИ органов репродуктивной системы" : "УЗИ органов мошонки"
        },
        "uzi"
      ));
    }
    if (t !== "uzi_reproductive") {
      pushSomatic(rows, d);
      pushSexual(rows, d);
      pushLocalStatus(rows, d);
      pushClinical(rows, d);
    }
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Заключение", value: d.conclusion }, "z"));
  }
  if (t === "uzi_urinary") {
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Жалобы", value: d.complaints }, "c"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Анамнез", value: d.anamnesis }, "a"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Динамика", value: d.dynamics }, "dy"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Показания", value: d.indications }, "i"));
    if (d.uzi && isPlainObject(d.uzi)) {
      rows.push(/* @__PURE__ */ jsx(UziRenderer, { uzi: d.uzi, title: "УЗИ органов мочевыделительной системы" }, "uzi"));
    }
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Заключение", value: d.conclusion }, "z"));
  }
  if (t === "uzi_bladder") {
    if (d.print_enabled === false) {
      rows.push(
        /* @__PURE__ */ jsx("div", { className: "text-xs italic text-gray-500 print:hidden", children: "Протокол УЗИ мочевого пузыря сохранён, но отключён от печати." }, "bladder-skip")
      );
    } else {
      rows.push(/* @__PURE__ */ jsx(Field, { label: "Показания", value: d.indications }, "i"));
      rows.push(/* @__PURE__ */ jsx(Field, { label: "Аппарат / датчик", value: d.device }, "dev"));
      const bladderRows = [];
      if (d.bladder_volume) bladderRows.push(/* @__PURE__ */ jsx(Field, { label: "Объём до микции", value: `${d.bladder_volume} мл` }, "bv"));
      if (d.micturition_urge) bladderRows.push(/* @__PURE__ */ jsx(Field, { label: "Позыв на микцию", value: d.micturition_urge }, "mu"));
      if (d.bladder_walls) bladderRows.push(/* @__PURE__ */ jsx(Field, { label: "Стенки", value: d.bladder_walls }, "bw"));
      if (d.bladder_contents) bladderRows.push(/* @__PURE__ */ jsx(Field, { label: "Содержимое", value: d.bladder_contents }, "bc"));
      if (d.residual_urine) bladderRows.push(/* @__PURE__ */ jsx(Field, { label: "Остаточная моча", value: d.residual_urine }, "ru"));
      if (d.residual_urine_percent) bladderRows.push(/* @__PURE__ */ jsx(Field, { label: "Остаточная моча, %", value: d.residual_urine_percent }, "rup"));
      if (bladderRows.length > 0) {
        rows.push(/* @__PURE__ */ jsx(Section, { title: "УЗИ мочевого пузыря с определением остаточной мочи", children: bladderRows }, "bl"));
      }
      rows.push(/* @__PURE__ */ jsx(Field, { label: "Заключение", value: d.conclusion }, "z"));
    }
  }
  if (t === "online_consult") {
    const infoRows = [];
    if (d.channel) infoRows.push(/* @__PURE__ */ jsx(Field, { label: "Канал связи", value: d.channel }, "ch"));
    if (d.duration_min) infoRows.push(/* @__PURE__ */ jsx(Field, { label: "Длительность, мин", value: d.duration_min }, "dur"));
    if (d.reason) infoRows.push(/* @__PURE__ */ jsx(Field, { label: "Повод обращения", value: d.reason }, "rs"));
    if (infoRows.length > 0) {
      rows.push(/* @__PURE__ */ jsx(Section, { title: "Сведения о консультации", children: infoRows }, "oc-info"));
    }
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Жалобы", value: d.complaints }, "oc-c"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Анамнез", value: d.anamnesis }, "oc-a"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Динамика", value: d.dynamics }, "oc-dy"));
    if (d.prior_visit) {
      const priorRows = [];
      priorRows.push(
        /* @__PURE__ */ jsx(Field, { label: "Был ли очный осмотр", value: d.prior_visit === "yes" ? "Да" : "Нет" }, "pv")
      );
      if (d.prior_visit === "yes") {
        if (d.prior_visit_date) {
          priorRows.push(
            /* @__PURE__ */ jsx(
              Field,
              {
                label: "Дата осмотра",
                value: format(new Date(d.prior_visit_date), "dd.MM.yyyy")
              },
              "pvd"
            )
          );
        }
        if (d.prior_visit_note) priorRows.push(/* @__PURE__ */ jsx(Field, { label: "Кратко", value: d.prior_visit_note }, "pvn"));
      }
      rows.push(/* @__PURE__ */ jsx(Section, { title: "Очный осмотр профессора ранее", children: priorRows }, "oc-prior"));
    }
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Настоящее состояние", value: d.current_state }, "oc-cs"));
    const examMethods = [];
    if (d.external_exam_by_photo) examMethods.push("по фото");
    if (d.external_exam_by_video) examMethods.push("по видеосвязи");
    if (d.external_genitalia || examMethods.length > 0) {
      const npoRows = [];
      if (examMethods.length > 0) {
        npoRows.push(/* @__PURE__ */ jsx(Field, { label: "Метод осмотра", value: examMethods.join(", ") }, "oc-em"));
      }
      if (d.external_genitalia) {
        npoRows.push(/* @__PURE__ */ jsx(Field, { label: "Описание", value: d.external_genitalia }, "oc-eg"));
      }
      rows.push(/* @__PURE__ */ jsx(Section, { title: "Состояние наружных половых органов", children: npoRows }, "oc-npo"));
    }
    if (d.interpretation) {
      rows.push(
        /* @__PURE__ */ jsx(Section, { title: "Интерпретация анализов и исследований", children: /* @__PURE__ */ jsx(Field, { label: "Интерпретация", value: d.interpretation }) }, "oc-int")
      );
    }
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Заключение", value: d.conclusion }, "oc-z"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "План дообследования", value: d.exam_plan }, "oc-ep"));
    if (d.in_person_needed) {
      const urgencyMap = {
        plan: "планово (1–3 мес)",
        soon: "в ближайшее время (1–4 нед)",
        urgent: "срочно (в течение недели)"
      };
      const text = d.in_person_needed === "yes" ? `Требуется${d.in_person_urgency ? ` — ${urgencyMap[d.in_person_urgency] || d.in_person_urgency}` : ""}` : "Не требуется";
      rows.push(/* @__PURE__ */ jsx(Field, { label: "Необходимость очного осмотра", value: text }, "oc-ip"));
    }
  }
  if (t === "peptide_program") {
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Жалобы", value: d.complaints }, "pp-c"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Анамнез", value: d.anamnesis }, "pp-an"));
    rows.push(/* @__PURE__ */ jsx(Field, { label: "Динамика", value: d.dynamics }, "pp-dy"));
    const metaRows = [];
    if (d.program_title) metaRows.push(/* @__PURE__ */ jsx(Field, { label: "Программа", value: d.program_title }, "pt"));
    if (d.goal) metaRows.push(/* @__PURE__ */ jsx(Field, { label: "Цель", value: d.goal }, "gl"));
    if (d.start_date) metaRows.push(
      /* @__PURE__ */ jsx(Field, { label: "Дата начала курса", value: format(new Date(d.start_date), "dd.MM.yyyy") }, "sd")
    );
    if (d.control_date) metaRows.push(
      /* @__PURE__ */ jsx(Field, { label: "Контрольный визит / анализы", value: format(new Date(d.control_date), "dd.MM.yyyy") }, "cd")
    );
    if (metaRows.length > 0) {
      rows.push(/* @__PURE__ */ jsx(Section, { title: "Пептидная программа", children: metaRows }, "pp-meta"));
    }
    const list = Array.isArray(d.items) ? d.items : [];
    if (list.length > 0) {
      rows.push(
        /* @__PURE__ */ jsx(Section, { title: `Состав программы (препаратов: ${list.length})`, children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 2, className: "ppl-value", style: { paddingTop: "1mm" }, children: /* @__PURE__ */ jsx("ol", { style: { margin: 0, paddingLeft: "6mm" }, children: list.map((it, i) => {
          const tags = [];
          const rf = (it.rf_status || "").toLowerCase();
          if (rf.includes("зарегистрирован")) tags.push("ЛС РФ");
          else if (rf.includes("бад")) tags.push("БАД");
          else if (rf.includes("research")) tags.push("Research");
          if (it.evidence_level) tags.push(`дока ${it.evidence_level}`);
          const onco = (it.onco_risk || "").toLowerCase();
          if (onco && !onco.includes("не описан") && !onco.includes("нет данных")) tags.push("онкориск");
          return /* @__PURE__ */ jsxs("li", { style: { marginBottom: "2mm" }, children: [
            /* @__PURE__ */ jsx("strong", { children: it.name }),
            it.group_name ? /* @__PURE__ */ jsxs("span", { style: { color: "#555" }, children: [
              " — ",
              it.group_name
            ] }) : null,
            tags.length > 0 && /* @__PURE__ */ jsxs("span", { style: { fontSize: "8pt", color: "#666" }, children: [
              " [",
              tags.join(", "),
              "]"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "Схема: ",
              it.schedule || "—"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "Длительность: ",
              it.duration || "—"
            ] }),
            it.monitoring && /* @__PURE__ */ jsxs("div", { children: [
              "Контроль: ",
              it.monitoring
            ] }),
            it.notes && /* @__PURE__ */ jsx("div", { style: { fontStyle: "italic" }, children: it.notes })
          ] }, i);
        }) }) }) }) }, "pp-items")
      );
    }
    if (d.conclusion) rows.push(/* @__PURE__ */ jsx(Field, { label: "Заключение по программе", value: d.conclusion }, "pp-z"));
  }
  if (rows.length === 0 && d.fields && typeof d.fields === "object") {
    Object.entries(d.fields).forEach(([k, v]) => {
      if (typeof v === "string" || typeof v === "number") {
        rows.push(/* @__PURE__ */ jsx(Field, { label: k, value: v }, k));
      }
    });
  }
  if (d.extra_uzi_mps && isPlainObject(d.extra_uzi_mps) && d.extra_uzi_mps.enabled === true) {
    const { enabled: _en, ...uziData } = d.extra_uzi_mps;
    rows.push(/* @__PURE__ */ jsx(UziRenderer, { uzi: uziData, title: "УЗДГ органов МПС" }, "extra-uzi-mps"));
  }
  pushUnknownScalars(rows, d);
  if (visit.diagnosis || visit.icd_code) {
    rows.push(
      /* @__PURE__ */ jsxs(Section, { title: "Диагноз", children: [
        /* @__PURE__ */ jsx(Field, { label: "Диагноз", value: visit.diagnosis }),
        /* @__PURE__ */ jsx(Field, { label: "Код МКБ-10", value: visit.icd_code })
      ] }, "dx")
    );
  }
  if (d.recommendations) {
    rows.push(
      /* @__PURE__ */ jsx(Section, { title: "Рекомендации", children: /* @__PURE__ */ jsx(Field, { label: "Рекомендации", value: d.recommendations }) }, "rec")
    );
  }
  const a = d.assignments;
  if (a && typeof a === "object") {
    const renderList = (key, title, items) => {
      if (!Array.isArray(items) || items.length === 0) return null;
      return /* @__PURE__ */ jsx(Section, { title, children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 2, className: "ppl-value", style: { paddingTop: "1mm" }, children: /* @__PURE__ */ jsx("ol", { style: { margin: 0, paddingLeft: "6mm" }, children: items.map((t2, i) => /* @__PURE__ */ jsx("li", { style: { marginBottom: "1mm" }, children: t2 }, i)) }) }) }) }, key);
    };
    rows.push(renderList("a-exam", "Обследование", a.examinations));
    rows.push(renderList("a-treat", "Лечение и режим", a.treatments));
    rows.push(renderList("a-surg", "Рекомендовано оперативное лечение", a.surgeries));
    rows.push(renderList("a-act", "Рекомендации по физической нагрузке", a.activity));
    rows.push(renderList("a-ref", "Консультации", a.referrals));
    rows.push(renderList("a-diet", "Диетические рекомендации", a.diet));
  }
  if (visit.next_visit_date) {
    rows.push(
      /* @__PURE__ */ jsx(
        Field,
        {
          label: "Контрольный осмотр",
          value: format(new Date(visit.next_visit_date), "dd MMMM yyyy", { locale: ru }) + " г."
        },
        "nv"
      )
    );
  }
  return /* @__PURE__ */ jsx("table", { className: "ppl-table", children: /* @__PURE__ */ jsx("tbody", { children: rows }) });
}
const CONSENT_INTRO = `даю своё добровольное информированное согласие на проведение медицинского осмотра, сбора анамнеза, необходимых диагностических и лечебных манипуляций в ООО «Профессиональный медицинский центр». Мне разъяснены цели, методы, возможные риски и альтернативные методы. Согласие даю добровольно, без принуждения.`;
const Blank = ({ w = "60mm" }) => /* @__PURE__ */ jsx("span", { style: { display: "inline-block", borderBottom: "0.5pt solid #000", minWidth: w, height: "4mm", verticalAlign: "bottom" } });
function ConsentBlock({ patient }) {
  const fio = (patient == null ? void 0 : patient.full_name) || "";
  const dob = (patient == null ? void 0 : patient.birth_date) ? format(new Date(patient.birth_date), "dd.MM.yyyy") : "";
  const age = (patient == null ? void 0 : patient.birth_date) ? calcAge(patient.birth_date, /* @__PURE__ */ new Date()) : null;
  const SigRow = ({ who }) => /* @__PURE__ */ jsxs("div", { className: "sig-row", children: [
    /* @__PURE__ */ jsxs("span", { children: [
      who,
      ": ",
      /* @__PURE__ */ jsx(Blank, { w: "55mm" }),
      " ",
      /* @__PURE__ */ jsx("span", { style: { fontSize: "8pt", color: "#555" }, children: "(подпись)" })
    ] }),
    /* @__PURE__ */ jsxs("span", { children: [
      "Дата: ",
      /* @__PURE__ */ jsx(Blank, { w: "35mm" })
    ] })
  ] });
  const Under15 = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("p", { style: { margin: "0 0 2mm" }, children: [
      "Я, законный представитель пациента ",
      /* @__PURE__ */ jsx(Blank, { w: "80mm" }),
      /* @__PURE__ */ jsx("span", { style: { display: "block", fontSize: "8pt", color: "#555", marginLeft: "55mm" }, children: "(ФИО законного представителя)" })
    ] }),
    /* @__PURE__ */ jsxs("p", { style: { margin: "0 0 2mm" }, children: [
      "являющийся(аяся) ",
      /* @__PURE__ */ jsx(Blank, { w: "70mm" }),
      /* @__PURE__ */ jsx("span", { style: { display: "block", fontSize: "8pt", color: "#555", marginLeft: "30mm" }, children: "(мать / отец / опекун / попечитель)" })
    ] }),
    /* @__PURE__ */ jsxs("p", { style: { margin: "0 0 2mm" }, children: [
      "пациента ",
      /* @__PURE__ */ jsx("strong", { children: fio || /* @__PURE__ */ jsx(Blank, { w: "80mm" }) }),
      ", дата рождения: ",
      /* @__PURE__ */ jsx("strong", { children: dob || /* @__PURE__ */ jsx(Blank, { w: "30mm" }) }),
      ","
    ] }),
    /* @__PURE__ */ jsx("p", { style: { margin: "0 0 3mm", textAlign: "justify" }, children: CONSENT_INTRO }),
    /* @__PURE__ */ jsx(SigRow, { who: "Законный представитель" })
  ] });
  const Between15and18 = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("p", { style: { margin: "0 0 2mm" }, children: [
      "Я, пациент ",
      /* @__PURE__ */ jsx("strong", { children: fio || /* @__PURE__ */ jsx(Blank, { w: "80mm" }) }),
      ", дата рождения: ",
      /* @__PURE__ */ jsx("strong", { children: dob || /* @__PURE__ */ jsx(Blank, { w: "30mm" }) }),
      ","
    ] }),
    /* @__PURE__ */ jsx("p", { style: { margin: "0 0 3mm", textAlign: "justify" }, children: CONSENT_INTRO }),
    /* @__PURE__ */ jsx(SigRow, { who: "Пациент" }),
    /* @__PURE__ */ jsxs("p", { style: { margin: "4mm 0 2mm" }, children: [
      "Я, законный представитель пациента ",
      /* @__PURE__ */ jsx(Blank, { w: "75mm" }),
      /* @__PURE__ */ jsx("span", { style: { display: "block", fontSize: "8pt", color: "#555", marginLeft: "55mm" }, children: "(ФИО законного представителя)" })
    ] }),
    /* @__PURE__ */ jsx("p", { style: { margin: "0 0 3mm" }, children: "своё согласие подтверждаю." }),
    /* @__PURE__ */ jsx(SigRow, { who: "Законный представитель" })
  ] });
  const Adult = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("p", { style: { margin: "0 0 2mm" }, children: [
      "Я, ",
      /* @__PURE__ */ jsx("strong", { children: fio || /* @__PURE__ */ jsx(Blank, { w: "80mm" }) }),
      ", дата рождения: ",
      /* @__PURE__ */ jsx("strong", { children: dob || /* @__PURE__ */ jsx(Blank, { w: "30mm" }) }),
      ","
    ] }),
    /* @__PURE__ */ jsx("p", { style: { margin: "0 0 3mm", textAlign: "justify" }, children: CONSENT_INTRO }),
    /* @__PURE__ */ jsx(SigRow, { who: "Пациент" })
  ] });
  let body = Adult;
  if (age !== null) {
    if (age < 15) body = Under15;
    else if (age < 18) body = Between15and18;
  }
  return /* @__PURE__ */ jsxs("div", { className: "ppl-consent", children: [
    /* @__PURE__ */ jsx("h4", { children: "Информированное добровольное согласие на медицинское вмешательство" }),
    body
  ] });
}
function ProtocolPrintLayout({ visit }) {
  var _a, _b, _c, _d;
  const def = PROTOCOL_TYPE_MAP[visit.protocol_type];
  const visitDate = new Date(visit.visit_date);
  const age = ((_a = visit.patient) == null ? void 0 : _a.birth_date) ? calcAge(visit.patient.birth_date, visitDate) : null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("style", { children: `
        .print-page {
          width: 210mm;
          min-height: 297mm;
          padding: 10mm 18mm 15mm 22mm;
          font-family: Arial, sans-serif;
          font-size: 9.5pt;
          color: #000;
          background: #fff;
          box-sizing: border-box;
          margin: 0 auto;
        }
        .ppl-header { display: flex; align-items: center; gap: 6mm; }
        .ppl-header img.logo { width: 26mm; height: 26mm; object-fit: contain; flex-shrink: 0; }
        .ppl-header .info { flex: 1; }
        .ppl-brand { color: #6db33f; font-weight: 700; font-size: 18pt; line-height: 1.1; }
        .ppl-org { font-weight: 700; font-size: 10pt; margin-top: 1.5mm; }
        .ppl-addr-row { display: flex; justify-content: space-between; font-size: 9pt; margin-top: 1mm; gap: 4mm; }
        .ppl-hr-thin { border: none; border-top: 0.4pt solid #888; margin: 3mm 0; }
        .ppl-hr-thick { border: none; border-top: 1pt solid #000; margin: 3mm 0; }
        .ppl-doctor { text-align: center; line-height: 1.35; }
        .ppl-doctor .small { font-weight: 700; font-size: 9pt; }
        .ppl-doctor .name { font-weight: 700; font-size: 16pt; margin-top: 1mm; letter-spacing: 0.5px; }
        .ppl-doctor .url { font-size: 9pt; margin-top: 0.5mm; color: #444; }
        .ppl-swash { display: block; width: 120mm; height: auto; margin: 2mm auto; }
        .ppl-patient { font-size: 10pt; line-height: 1.7; }
        .ppl-patient-row { display: flex; justify-content: space-between; gap: 6mm; }
       .ppl-title { text-align: center; margin: 8mm 0 6mm; }
       .ppl-title .sub { font-size: 9pt; color: #555; }
       .ppl-title .main { font-weight: 700; font-size: 18pt; line-height: 1.25; margin-top: 2mm; letter-spacing: 0.2pt; }
        .ppl-table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
        .ppl-table .ppl-label {
          width: 48mm; vertical-align: top; padding: 3mm 4mm 3mm 0;
          font-weight: 700; border-bottom: 0.3pt solid #ccc; line-height: 1.5;
        }
        .ppl-table .ppl-value {
          vertical-align: top; padding: 3mm 4mm; white-space: pre-wrap;
          word-break: break-word; border-bottom: 0.3pt solid #ccc; line-height: 1.5;
        }
        .ppl-section {
          padding: 3mm 0 1mm; font-weight: 700; font-size: 10pt;
          border-bottom: 0.5pt solid #000;
        }
        .ppl-subsection {
          padding: 2mm 0 1mm; font-weight: 700; font-size: 9.5pt;
          background: #f0f0f0; color: #000;
        }
        .ppl-side { width: 100%; border-collapse: collapse; }
        .ppl-side-cell { width: 50%; vertical-align: top; padding-right: 4mm; }
        .ppl-footer { margin-top: 10mm; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10pt; gap: 6mm; }
        .ppl-sign-line { border-bottom: 0.5pt solid #000; min-width: 55mm; height: 6mm; }
        .ppl-sign-caption { font-size: 8pt; color: #555; text-align: center; }
        .ppl-consent {
          margin-top: 8mm; padding-top: 4mm; border-top: 0.5pt solid #000;
          font-size: 8.5pt; line-height: 1.4;
        }
        .ppl-consent h4 { text-align: center; font-size: 9.5pt; margin: 0 0 2mm; text-transform: uppercase; }
        .ppl-consent .sig-row {
          display: flex; justify-content: space-between; margin-top: 5mm;
          gap: 6mm; font-size: 9pt;
        }
        .ppl-page-break { page-break-after: always; }

        /* Avoid breaking inside critical blocks (applies on screen + print) */
        .ppl-table tr,
        .ppl-footer,
        .ppl-consent { break-inside: avoid; page-break-inside: avoid; }

        @media print {
          .no-print { display: none !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          @page {
            size: A4;
            margin: 15mm 15mm 18mm 15mm;
            @bottom-right {
              content: "Страница " counter(page) " из " counter(pages);
              font-family: Arial, sans-serif;
              font-size: 8pt;
              color: #555;
            }
          }
          .print-page {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
          }
          .ppl-section, .ppl-subsection { page-break-after: avoid; break-after: avoid; }
          .ppl-table { width: 100% !important; table-layout: fixed; }
          .ppl-table tr { page-break-inside: avoid; break-inside: avoid; }
          .ppl-footer, .ppl-consent { page-break-inside: avoid; break-inside: avoid; break-before: avoid; }
          p, td, li { orphans: 3; widows: 3; word-wrap: break-word; overflow-wrap: break-word; }
        }

      ` }),
    /* @__PURE__ */ jsxs("div", { className: "print-page", children: [
      /* @__PURE__ */ jsxs("div", { className: "ppl-header", children: [
        /* @__PURE__ */ jsx("img", { src: "/mca-logo.png", alt: "МЦА", className: "logo" }),
        /* @__PURE__ */ jsxs("div", { className: "info", children: [
          /* @__PURE__ */ jsx("div", { className: "ppl-brand", children: "Международный центр андрологии" }),
          /* @__PURE__ */ jsx("div", { className: "ppl-org", children: "ООО «Профессиональный медицинский центр»" }),
          /* @__PURE__ */ jsxs("div", { className: "ppl-addr-row", children: [
            /* @__PURE__ */ jsx("span", { children: "127486 г. Москва, Коровинское шоссе д. 9, корп. 2" }),
            /* @__PURE__ */ jsx("span", { children: "+7 (495) 303-00-00 / +7 (926) 303-01-11" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("hr", { className: "ppl-hr-thin" }),
      /* @__PURE__ */ jsxs("div", { className: "ppl-doctor", children: [
        /* @__PURE__ */ jsx("div", { className: "small", children: "Член-корреспондент РАЕН" }),
        /* @__PURE__ */ jsx("div", { className: "small", children: "профессор, доктор медицинских наук, врач высшей категории" }),
        /* @__PURE__ */ jsx("div", { className: "name", children: "ТАРУСИН ДМИТРИЙ ИГОРЕВИЧ" }),
        /* @__PURE__ */ jsx("div", { className: "url", children: "tarusin.pro" })
      ] }),
      /* @__PURE__ */ jsx("img", { src: "/mca-swash.png", alt: "", className: "ppl-swash" }),
      /* @__PURE__ */ jsx("hr", { className: "ppl-hr-thick" }),
      /* @__PURE__ */ jsxs("div", { className: "ppl-patient", children: [
        /* @__PURE__ */ jsxs("div", { className: "ppl-patient-row", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: "№ медицинской карты:" }),
            " ",
            ((_b = visit.patient) == null ? void 0 : _b.history_number) || "—"
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Дата:" }),
            " ",
            format(visitDate, "dd MMMM yyyy", { locale: ru }),
            " г."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "ФИО:" }),
          " ",
          ((_c = visit.patient) == null ? void 0 : _c.full_name) || "—"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "ppl-patient-row", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Дата рождения:" }),
            " ",
            ((_d = visit.patient) == null ? void 0 : _d.birth_date) ? format(new Date(visit.patient.birth_date), "dd.MM.yyyy") : "—"
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Возраст:" }),
            " ",
            age !== null ? `${age} лет` : "—"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "ppl-title", children: [
        /* @__PURE__ */ jsx("div", { className: "sub", children: "Протокол медицинского осмотра" }),
        /* @__PURE__ */ jsx("div", { className: "main", children: (() => {
          var _a2;
          const base = (def == null ? void 0 : def.title) || visit.protocol_type;
          if (visit.protocol_type === "postop_day7") {
            const n = (_a2 = visit.protocol_data) == null ? void 0 : _a2.day_number;
            if (typeof n === "number" && n > 0 && n !== 7) {
              return `Контрольный осмотр на ${n} сутки после операции`;
            }
          }
          return base;
        })() })
      ] }),
      /* @__PURE__ */ jsx(ProtocolBody, { visit }),
      /* @__PURE__ */ jsxs("div", { className: "ppl-footer", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { children: "Врач — профессор, д.м.н." }),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("strong", { children: "Тарусин Дмитрий Игоревич" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "ppl-sign-line" }),
          /* @__PURE__ */ jsx("div", { className: "ppl-sign-caption", children: "подпись" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(ConsentBlock, { patient: visit.patient })
    ] })
  ] });
}
export {
  ProtocolPrintLayout as P,
  SexualConstitutionSection as S
};
