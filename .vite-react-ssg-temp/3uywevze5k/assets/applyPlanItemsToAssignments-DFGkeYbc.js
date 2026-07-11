import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { C as Card, c as CardHeader, d as CardTitle, a as CardContent, s as supabase, w as Sheet, x as SheetTrigger, B as Button, y as SheetContent, z as SheetHeader, A as SheetTitle, I as Input, r as Checkbox, G as SheetFooter, b as Badge, T as Textarea, t as toast } from "../main.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CJYPrMmK.js";
import { S as ScrollArea } from "./scroll-area-DtgkI4MV.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { ClipboardList, Scissors, Activity, Plus, Phone, Salad, X } from "lucide-react";
const FIELD_ALIASES = {
  complaints: [
    "Жалобы",
    "Жалобы на момент осмотра",
    "Жалобы пациента"
  ],
  anamnesis: [
    "Анамнез",
    "Анамнез заболевания",
    "Анамнез болезни",
    "Динамика течения болезни со слов пациента"
  ],
  operation_name: [
    "Выполнена операция",
    "Название операции"
  ],
  operation_date: [
    "Дата операции"
  ],
  general_status: [
    "Соматический статус",
    "Соматический статус на момент осмотра",
    "Общее состояние"
  ],
  wound_status: [
    "Состояние раны"
  ],
  healing: [
    "Заживление"
  ],
  dressing: [
    "Перевязка",
    "Местное лечение"
  ],
  pain: [
    "Болевой синдром"
  ],
  temperature: [
    "Температура",
    "Температура тела"
  ],
  conclusion: [
    "Заключение",
    "Заключение/Диагноз",
    "Клиническое заключение",
    "Предварительное заключение"
  ],
  // Алиас для форм, где диагноз отдельным полем
  diagnosis: [
    "Заключение",
    "Клиническое заключение",
    "Диагноз",
    "Заключение/Диагноз",
    "Предварительное заключение"
  ],
  working_diagnosis: [
    "Рабочая формулировка диагноза"
  ],
  exam_plan: [
    "План обследования",
    "Рекомендации по обследованию"
  ],
  // Дополнительные статусы первичного осмотра
  ortho_status: [
    "Ортопедический статус",
    "Ортопедический статус на момент осмотра"
  ],
  dynamics: [
    "Динамика течения болезни со слов пациента",
    "Динамика",
    "Динамика заболевания"
  ],
  uzi_express: [
    "УЗИ экспресс",
    "Экспресс УЗИ",
    "Экспресс – УЗИ – исследование",
    "УЗИ – исследование мягких тканей",
    "УЗИ"
  ],
  neuro_status: [
    "Неврологический статус",
    "Оценка неврологического статуса экспресс"
  ],
  psych_status: [
    "Психологический статус",
    "Оценка общего психологического статуса"
  ],
  // Половая формула — свободный текст
  sexual_formula_text: ["Половая формула"],
  // Половая конституция — отдельное поле
  sexual_constitution: ["Половая конституция"],
  indications: [
    "Показания"
  ],
  cbc: ["КАК", "Общий анализ крови"],
  urinalysis: ["Общий анализ мочи", "ОАМ"],
  biochem: ["Биохимия", "Биохимический анализ крови"],
  hormones: ["Гормоны"],
  other_labs: ["Прочие анализы", "Результаты обследований", "Результаты обследования"]
};
const RECOMMENDATIONS_SOURCES = [
  "Рекомендации",
  "Рекомендовано следующее лечение",
  "Рекомендации по лечению",
  "Медикаментозная терапия",
  "Рекомендации по режиму",
  "Рекомендации по обследованию",
  "Ограничения по спорту",
  "Контрольный осмотр через",
  "Контрольный осмотр"
];
const NESTED_ALIASES = {
  local_status: {
    right: ["Справа", "Правая сторона"],
    left: ["Слева", "Левая сторона"],
    penis: ["Половой член"],
    perineum: ["Промежность"],
    external_genitalia: [
      "Локальный статус на момент осмотра",
      "Локальный статус",
      "Состояние раны",
      "Наружные половые органы"
    ],
    scrotum: ["Мошонка"],
    right_testis: ["Правое яичко"],
    left_testis: ["Левое яичко"],
    epididymis: ["Придатки", "Придатки яичек"],
    spermatic_cord: ["Семенные канатики"],
    inguinal_rings: ["Паховые кольца", "Наружные паховые кольца"]
  },
  somatic: {
    general: [
      "Соматический статус на момент осмотра",
      "Соматический статус",
      "Общее состояние"
    ],
    lymph_nodes: ["Лимфатические узлы", "Периферические лимфатические узлы"]
  }
};
function pickFirst(fields, keys) {
  for (const k of keys) {
    const v = fields == null ? void 0 : fields[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return void 0;
}
function pickJoined(fields, keys) {
  const parts = [];
  const seen = /* @__PURE__ */ new Set();
  for (const k of keys) {
    const v = fields == null ? void 0 : fields[k];
    const s = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
    if (s && !seen.has(s)) {
      parts.push(s);
      seen.add(s);
    }
  }
  return parts.length ? parts.join("\n\n") : void 0;
}
function isEmpty(v) {
  return v === void 0 || v === null || v === "";
}
const NORMALIZATION_VERSION = 10;
function normalizeImportedProtocolData(_type, data) {
  if (!data || typeof data !== "object") return data || {};
  if (data._normalized && data._normalized_version === NORMALIZATION_VERSION) return data;
  const fields = data.fields;
  if (!fields || typeof fields !== "object") {
    return { ...data, _normalized: true, _normalized_version: NORMALIZATION_VERSION };
  }
  const derived = {};
  for (const [structKey, ruKeys] of Object.entries(FIELD_ALIASES)) {
    if (!isEmpty(data[structKey])) continue;
    const v = pickFirst(fields, ruKeys);
    if (v !== void 0) derived[structKey] = v;
  }
  if (isEmpty(data.recommendations)) {
    const rec = pickJoined(fields, RECOMMENDATIONS_SOURCES);
    if (rec) derived.recommendations = rec;
  }
  const nestedPatch = {};
  for (const [sectionKey, subMap] of Object.entries(NESTED_ALIASES)) {
    const current = data[sectionKey] && typeof data[sectionKey] === "object" ? data[sectionKey] : {};
    const subDerived = {};
    for (const [subKey, ruKeys] of Object.entries(subMap)) {
      if (!isEmpty(current[subKey])) continue;
      const v = pickFirst(fields, ruKeys);
      if (v !== void 0) subDerived[subKey] = v;
    }
    if (Object.keys(subDerived).length) {
      nestedPatch[sectionKey] = { ...current, ...subDerived };
    }
  }
  {
    const currentLs = data.local_status && typeof data.local_status === "object" ? data.local_status : {};
    const patchedLs = { ...currentLs, ...nestedPatch.local_status || {} };
    if (isEmpty(patchedLs.right) && isEmpty(patchedLs.left)) {
      const raw = fields["Локальный статус на момент осмотра"] || fields["Локальный статус"] || "";
      if (typeof raw === "string" && raw.trim()) {
        const idx = raw.indexOf("Слева");
        if (idx > -1) {
          patchedLs.right = raw.slice(0, idx).replace(/^Справа\s*/i, "").trim();
          patchedLs.left = raw.slice(idx).replace(/^Слева\s*/i, "").trim();
        } else if (isEmpty(patchedLs.external_genitalia)) {
          patchedLs.external_genitalia = raw.trim();
        }
      }
    }
    if (isEmpty(patchedLs.penis) || isEmpty(patchedLs.perineum)) {
      for (const key of Object.keys(fields)) {
        const k = key.trim();
        if (isEmpty(patchedLs.penis) && k.includes("Половой член") && k.length > 20) {
          patchedLs.penis = k;
        }
        if (isEmpty(patchedLs.perineum) && k.includes("промежности") && k.length > 20) {
          patchedLs.perineum = k;
        }
      }
    }
    const changed = Object.keys(patchedLs).some(
      (k) => currentLs[k] !== patchedLs[k]
    );
    if (changed) nestedPatch.local_status = patchedLs;
  }
  {
    const currentSomatic = data.somatic && typeof data.somatic === "object" ? data.somatic : {};
    const patchedSomatic = { ...currentSomatic, ...nestedPatch.somatic || {} };
    if (isEmpty(patchedSomatic.full_text)) {
      for (const key of Object.keys(fields)) {
        const k = key.trim();
        if (k.startsWith("Общее состояние удовлетворительное") && k.length > 50) {
          patchedSomatic.full_text = k;
          break;
        }
      }
    }
    const changed = Object.keys(patchedSomatic).some(
      (k) => currentSomatic[k] !== patchedSomatic[k]
    );
    if (changed) nestedPatch.somatic = patchedSomatic;
  }
  const typeStr = String(_type);
  if (isEmpty(data.wound_status) && isEmpty(derived.wound_status) && typeStr.startsWith("postop_")) {
    const ls = nestedPatch.local_status || data.local_status || {};
    const parts = [];
    const seen = /* @__PURE__ */ new Set();
    const push = (s) => {
      if (typeof s !== "string") return;
      const t = s.trim();
      if (!t || seen.has(t)) return;
      seen.add(t);
      parts.push(t);
    };
    push(fields["Локальный статус на момент осмотра"]);
    push(fields["Локальный статус"]);
    push(fields["Состояние раны"]);
    push(fields["Экспресс – УЗИ – исследование"]);
    push(fields["УЗИ – исследование мягких тканей"]);
    push(fields["Местное лечение"]);
    push(ls.notes);
    push(ls.external_genitalia);
    push(ls.penis);
    push(ls.perineum);
    if (parts.length) {
      derived.wound_status = parts.join("\n\n");
    }
  }
  return {
    ...data,
    ...derived,
    ...nestedPatch,
    _normalized: true,
    _normalized_version: NORMALIZATION_VERSION
  };
}
function AutoTextarea({ value, onChange, onRemove }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 group", children: [
    /* @__PURE__ */ jsx(
      Textarea,
      {
        ref,
        value,
        onChange: (e) => onChange(e.target.value),
        rows: 1,
        className: "flex-1 text-sm leading-snug min-h-0 py-1.5 resize-none overflow-hidden"
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: onRemove,
        className: "opacity-60 hover:opacity-100 text-destructive shrink-0 mt-1.5",
        title: "Удалить",
        children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
      }
    )
  ] });
}
const EMPTY_ASSIGNMENTS = {
  examinations: [],
  treatments: [],
  referrals: [],
  diet: [],
  surgeries: [],
  activity: []
};
function formatMedication(m) {
  var _a;
  const head = ((_a = m.trade_name) == null ? void 0 : _a.trim()) || m.latin_name;
  const extras = [m.dosage_form, m.dosage].filter(Boolean).join(" ");
  return extras ? `${head} — ${extras}` : head;
}
function normalizeAssignments(raw) {
  if (!raw || typeof raw !== "object") return { ...EMPTY_ASSIGNMENTS };
  return {
    examinations: Array.isArray(raw.examinations) ? raw.examinations.filter(Boolean) : [],
    treatments: Array.isArray(raw.treatments) ? raw.treatments.filter(Boolean) : [],
    referrals: Array.isArray(raw.referrals) ? raw.referrals.filter(Boolean) : [],
    diet: Array.isArray(raw.diet) ? raw.diet.filter(Boolean) : [],
    surgeries: Array.isArray(raw.surgeries) ? raw.surgeries.filter(Boolean) : [],
    activity: Array.isArray(raw.activity) ? raw.activity.filter(Boolean) : []
  };
}
function formatReferral(s) {
  const parts = [`Консультация ${s.specialty.toLowerCase()} — ${s.doctor_name}`];
  if (s.phone) parts.push(`тел. ${s.phone}`);
  if (s.contact_note) parts.push(s.contact_note);
  return parts.join(", ");
}
function ItemPicker({ title, categories, onAdd }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("all");
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const { data: items = [] } = useQuery({
    queryKey: ["diagnosis_recommendations", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("diagnosis_recommendations").select("id, diagnosis_group, subtype, category, item_text").order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1e3
  });
  const includesMeds = categories.includes("медикамент");
  const { data: meds = [] } = useQuery({
    queryKey: ["medications", "all-alpha"],
    enabled: includesMeds,
    queryFn: async () => {
      const all = [];
      const pageSize = 1e3;
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase.from("medications").select("id, latin_name, trade_name, dosage_form, dosage").order("trade_name", { ascending: true, nullsFirst: false }).order("latin_name", { ascending: true }).range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < pageSize) break;
      }
      return all;
    },
    staleTime: 10 * 60 * 1e3
  });
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const dr = items.filter((i) => categories.includes(i.category)).filter((i) => group === "all" ? true : i.diagnosis_group === group).map((i) => ({ id: `dr:${i.id}`, text: i.item_text, meta: `${i.diagnosis_group} / ${i.subtype}` }));
    const medItems = includesMeds && group === "all" ? meds.map((m) => ({ id: `med:${m.id}`, text: formatMedication(m), meta: "Справочник препаратов" })) : [];
    const merged = [...dr, ...medItems];
    merged.sort((a, b) => a.text.localeCompare(b.text, "ru"));
    return ql ? merged.filter((i) => i.text.toLowerCase().includes(ql)) : merged;
  }, [items, meds, categories, q, group, includesMeds]);
  const groups = useMemo(
    () => Array.from(
      new Set(items.filter((i) => categories.includes(i.category)).map((i) => i.diagnosis_group))
    ).sort(),
    [items, categories]
  );
  const toggle = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const apply = () => {
    if (selected.size === 0) {
      toast({ title: "Ничего не выбрано" });
      return;
    }
    const texts = filtered.filter((i) => selected.has(i.id)).map((i) => i.text);
    onAdd(texts);
    setSelected(/* @__PURE__ */ new Set());
    setOpen(false);
  };
  return /* @__PURE__ */ jsxs(Sheet, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
      "Добавить из списка"
    ] }) }),
    /* @__PURE__ */ jsxs(SheetContent, { side: "right", className: "w-full sm:max-w-xl flex flex-col", children: [
      /* @__PURE__ */ jsx(SheetHeader, { children: /* @__PURE__ */ jsx(SheetTitle, { children: title }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 py-3", children: [
        /* @__PURE__ */ jsx(Input, { placeholder: "Поиск по тексту…", value: q, onChange: (e) => setQ(e.target.value) }),
        /* @__PURE__ */ jsxs(Select, { value: group, onValueChange: setGroup, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxs(SelectContent, { className: "max-h-72", children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Все диагнозы" }),
            groups.map((g) => /* @__PURE__ */ jsx(SelectItem, { value: g, children: g }, g))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1 pr-3 -mr-3", children: filtered.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground py-8 text-center", children: "Ничего не найдено" }) : /* @__PURE__ */ jsx("div", { className: "space-y-1", children: filtered.map((it) => /* @__PURE__ */ jsxs(
        "label",
        {
          className: "flex gap-2 items-start text-sm cursor-pointer rounded px-2 py-1.5 hover:bg-muted/50",
          children: [
            /* @__PURE__ */ jsx(
              Checkbox,
              {
                checked: selected.has(it.id),
                onCheckedChange: () => toggle(it.id),
                className: "mt-0.5"
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "leading-snug flex-1", children: [
              it.text,
              it.meta && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground ml-2", children: it.meta })
            ] })
          ]
        },
        it.id
      )) }) }),
      /* @__PURE__ */ jsx(SheetFooter, { className: "pt-3 border-t", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full gap-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "Выбрано: ",
          selected.size
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setOpen(false), children: "Отмена" }),
          /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", onClick: apply, disabled: selected.size === 0, children: "Добавить выбранные" })
        ] })
      ] }) })
    ] })
  ] });
}
function ReferralsPicker({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const { data: specialists = [] } = useQuery({
    queryKey: ["referral_specialists", "active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("referral_specialists").select("id, specialty, doctor_name, phone, contact_note").eq("is_active", true).order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1e3
  });
  const toggle = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const apply = () => {
    if (selected.size === 0) {
      toast({ title: "Ничего не выбрано" });
      return;
    }
    const texts = specialists.filter((s) => selected.has(s.id)).map(formatReferral);
    onAdd(texts);
    setSelected(/* @__PURE__ */ new Set());
    setOpen(false);
  };
  return /* @__PURE__ */ jsxs(Sheet, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
      "Выбрать специалистов"
    ] }) }),
    /* @__PURE__ */ jsxs(SheetContent, { side: "right", className: "w-full sm:max-w-xl flex flex-col", children: [
      /* @__PURE__ */ jsx(SheetHeader, { children: /* @__PURE__ */ jsx(SheetTitle, { children: "Консультации специалистов" }) }),
      /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1 pr-3 -mr-3 mt-3", children: /* @__PURE__ */ jsx("div", { className: "space-y-1", children: specialists.map((s) => /* @__PURE__ */ jsxs(
        "label",
        {
          className: "flex gap-2 items-start text-sm cursor-pointer rounded px-2 py-1.5 hover:bg-muted/50",
          children: [
            /* @__PURE__ */ jsx(
              Checkbox,
              {
                checked: selected.has(s.id),
                onCheckedChange: () => toggle(s.id),
                className: "mt-0.5"
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "leading-snug flex-1", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: s.specialty }),
              " — ",
              s.doctor_name,
              s.phone && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 ml-2 text-muted-foreground", children: [
                /* @__PURE__ */ jsx(Phone, { className: "h-3 w-3" }),
                s.phone
              ] }),
              s.contact_note && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: s.contact_note })
            ] })
          ]
        },
        s.id
      )) }) }),
      /* @__PURE__ */ jsx(SheetFooter, { className: "pt-3 border-t", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full gap-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "Выбрано: ",
          selected.size
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setOpen(false), children: "Отмена" }),
          /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", onClick: apply, disabled: selected.size === 0, children: "Добавить" })
        ] })
      ] }) })
    ] })
  ] });
}
const CATEGORY_META = {
  "рекомендуется": { icon: "✅", label: "Рекомендуется", order: 1 },
  "ограничить": { icon: "⚠️", label: "Ограничить", order: 2 },
  "исключить": { icon: "❌", label: "Исключить", order: 3 },
  "режим": { icon: "📋", label: "Режим", order: 4 }
};
function DietPicker({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [selectedDiets, setSelectedDiets] = useState(/* @__PURE__ */ new Set());
  const [selectedItems, setSelectedItems] = useState(/* @__PURE__ */ new Set());
  const { data: rows = [] } = useQuery({
    queryKey: ["diet_recommendations", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("diet_recommendations").select("id, diet_type, diet_label, category, item_text, is_recommended, sort_order").order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1e3
  });
  const dietsList = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    rows.forEach((r) => map.set(r.diet_type, r.diet_label));
    return Array.from(map.entries()).map(([type, label]) => ({ type, label }));
  }, [rows]);
  const toggleDiet = (t) => {
    setSelectedDiets((prev) => {
      const n = new Set(prev);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  };
  const toggleItem = (id) => {
    setSelectedItems((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const grouped = useMemo(() => {
    const visible = rows.filter((r) => selectedDiets.has(r.diet_type));
    const byDiet = /* @__PURE__ */ new Map();
    visible.forEach((r) => {
      if (!byDiet.has(r.diet_type)) byDiet.set(r.diet_type, { label: r.diet_label, cats: /* @__PURE__ */ new Map() });
      const entry = byDiet.get(r.diet_type);
      if (!entry.cats.has(r.category)) entry.cats.set(r.category, []);
      entry.cats.get(r.category).push(r);
    });
    return Array.from(byDiet.entries()).map(([type, e]) => ({
      type,
      label: e.label,
      categories: Array.from(e.cats.entries()).sort((a, b) => {
        var _a, _b;
        return (((_a = CATEGORY_META[a[0]]) == null ? void 0 : _a.order) ?? 99) - (((_b = CATEGORY_META[b[0]]) == null ? void 0 : _b.order) ?? 99);
      }).map(([cat, items]) => ({ cat, items }))
    }));
  }, [rows, selectedDiets]);
  const apply = () => {
    if (selectedItems.size === 0) {
      toast({ title: "Ничего не выбрано" });
      return;
    }
    const out = [];
    grouped.forEach((d) => {
      const dietItems = [];
      d.categories.forEach(({ cat, items }) => {
        items.forEach((it) => {
          if (selectedItems.has(it.id)) {
            const prefix = cat === "рекомендуется" ? "✓ " : cat === "ограничить" ? "⚠ Ограничить: " : cat === "исключить" ? "✗ Исключить: " : "• ";
            dietItems.push(`${prefix}${it.item_text}`);
          }
        });
      });
      if (dietItems.length > 0) {
        out.push(`Диета — ${d.label}:`);
        out.push(...dietItems);
      }
    });
    onAdd(out);
    setSelectedItems(/* @__PURE__ */ new Set());
    setSelectedDiets(/* @__PURE__ */ new Set());
    setOpen(false);
  };
  return /* @__PURE__ */ jsxs(Sheet, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", children: [
      /* @__PURE__ */ jsx(Salad, { className: "h-4 w-4 mr-1" }),
      "Выбрать диету"
    ] }) }),
    /* @__PURE__ */ jsxs(SheetContent, { side: "right", className: "w-full sm:max-w-xl flex flex-col", children: [
      /* @__PURE__ */ jsx(SheetHeader, { children: /* @__PURE__ */ jsx(SheetTitle, { children: "Диетические рекомендации" }) }),
      /* @__PURE__ */ jsxs("div", { className: "py-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-2", children: "Выберите одну или несколько диет:" }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: dietsList.map((d) => /* @__PURE__ */ jsx(
          Badge,
          {
            variant: selectedDiets.has(d.type) ? "default" : "outline",
            className: "cursor-pointer text-xs py-1",
            onClick: () => toggleDiet(d.type),
            children: d.label
          },
          d.type
        )) })
      ] }),
      /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1 pr-3 -mr-3", children: grouped.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground py-8 text-center", children: "Выберите диету выше, чтобы увидеть пункты" }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: grouped.map((d) => /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold border-b pb-1", children: d.label }),
        d.categories.map(({ cat, items }) => {
          var _a, _b;
          return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs font-medium text-muted-foreground", children: [
              (_a = CATEGORY_META[cat]) == null ? void 0 : _a.icon,
              " ",
              ((_b = CATEGORY_META[cat]) == null ? void 0 : _b.label) ?? cat
            ] }),
            items.map((it) => /* @__PURE__ */ jsxs(
              "label",
              {
                className: "flex gap-2 items-start text-sm cursor-pointer rounded px-2 py-1 hover:bg-muted/50",
                children: [
                  /* @__PURE__ */ jsx(
                    Checkbox,
                    {
                      checked: selectedItems.has(it.id),
                      onCheckedChange: () => toggleItem(it.id),
                      className: "mt-0.5"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "leading-snug flex-1", children: it.item_text })
                ]
              },
              it.id
            ))
          ] }, cat);
        })
      ] }, d.type)) }) }),
      /* @__PURE__ */ jsx(SheetFooter, { className: "pt-3 border-t", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full gap-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "Выбрано: ",
          selectedItems.size
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setOpen(false), children: "Отмена" }),
          /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", onClick: apply, disabled: selectedItems.size === 0, children: "Вставить выбранное" })
        ] })
      ] }) })
    ] })
  ] });
}
function ListEditor({ items, onChange, addPlaceholder, picker }) {
  const [draft, setDraft] = useState("");
  const removeAt = (idx) => onChange(items.filter((_, i) => i !== idx));
  const addDraft = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2", children: picker }),
    items.length > 0 && /* @__PURE__ */ jsx("ol", { className: "space-y-1.5 list-decimal pl-5", children: items.map((t, i) => /* @__PURE__ */ jsx("li", { className: "text-sm leading-snug", children: /* @__PURE__ */ jsx(
      AutoTextarea,
      {
        value: t,
        onChange: (v) => onChange(items.map((x, j) => j === i ? v : x)),
        onRemove: () => removeAt(i)
      }
    ) }, i)) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-2", children: [
      /* @__PURE__ */ jsx(
        Input,
        {
          value: draft,
          onChange: (e) => setDraft(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          },
          onBlur: () => {
            if (draft.trim()) addDraft();
          },
          placeholder: addPlaceholder
        }
      ),
      /* @__PURE__ */ jsxs(Button, { type: "button", size: "sm", variant: "secondary", onClick: addDraft, disabled: !draft.trim(), children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
        "Своё"
      ] })
    ] }),
    draft.trim() && /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-600 dark:text-amber-400", children: "Не забудьте нажать «Своё» или Enter, иначе текст не сохранится." })
  ] });
}
function CatalogPicker({
  title,
  triggerLabel,
  triggerIcon,
  queryKey,
  table,
  select,
  format,
  onAdd
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const { data: rows = [] } = useQuery({
    queryKey: [queryKey, "active"],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select(select).eq("is_active", true).order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1e3
  });
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const mapped = rows.map((r) => ({ id: r.id, ...format(r) }));
    return ql ? mapped.filter((i) => i.text.toLowerCase().includes(ql)) : mapped;
  }, [rows, q, format]);
  const toggle = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const apply = () => {
    if (selected.size === 0) {
      toast({ title: "Ничего не выбрано" });
      return;
    }
    onAdd(filtered.filter((i) => selected.has(i.id)).map((i) => i.text));
    setSelected(/* @__PURE__ */ new Set());
    setOpen(false);
  };
  return /* @__PURE__ */ jsxs(Sheet, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", children: [
      triggerIcon,
      /* @__PURE__ */ jsx("span", { className: "ml-1", children: triggerLabel })
    ] }) }),
    /* @__PURE__ */ jsxs(SheetContent, { side: "right", className: "w-full sm:max-w-xl flex flex-col", children: [
      /* @__PURE__ */ jsx(SheetHeader, { children: /* @__PURE__ */ jsx(SheetTitle, { children: title }) }),
      /* @__PURE__ */ jsx("div", { className: "py-3", children: /* @__PURE__ */ jsx(Input, { placeholder: "Поиск…", value: q, onChange: (e) => setQ(e.target.value) }) }),
      /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1 pr-3 -mr-3", children: filtered.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground py-8 text-center", children: "Ничего не найдено. Добавьте записи в справочнике: Админка → Медицинские справочники." }) : /* @__PURE__ */ jsx("div", { className: "space-y-1", children: filtered.map((it) => /* @__PURE__ */ jsxs("label", { className: "flex gap-2 items-start text-sm cursor-pointer rounded px-2 py-1.5 hover:bg-muted/50", children: [
        /* @__PURE__ */ jsx(Checkbox, { checked: selected.has(it.id), onCheckedChange: () => toggle(it.id), className: "mt-0.5" }),
        /* @__PURE__ */ jsxs("span", { className: "leading-snug flex-1", children: [
          it.text,
          it.meta && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground ml-2", children: it.meta })
        ] })
      ] }, it.id)) }) }),
      /* @__PURE__ */ jsx(SheetFooter, { className: "pt-3 border-t", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full gap-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "Выбрано: ",
          selected.size
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setOpen(false), children: "Отмена" }),
          /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", onClick: apply, disabled: selected.size === 0, children: "Добавить" })
        ] })
      ] }) })
    ] })
  ] });
}
function AssignmentsPanel({ value, onChange }) {
  const data = normalizeAssignments(value);
  const patch = (p) => onChange({ ...data, ...p });
  const totalCount = data.examinations.length + data.treatments.length + data.referrals.length + data.diet.length + data.surgeries.length + data.activity.length;
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(ClipboardList, { className: "h-4 w-4 text-primary" }),
      "Назначения и консультации",
      totalCount > 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs font-normal text-muted-foreground", children: [
        "(",
        totalCount,
        ")"
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Tabs, { defaultValue: "exam", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "mb-3 flex-wrap h-auto", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "exam", children: [
          "Обследование ",
          data.examinations.length > 0 && `(${data.examinations.length})`
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "treat", children: [
          "Медикаменты и лечение ",
          data.treatments.length > 0 && `(${data.treatments.length})`
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "surg", children: [
          "✂️ Оперативное лечение ",
          data.surgeries.length > 0 && `(${data.surgeries.length})`
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "act", children: [
          "🏃 Физ. нагрузка ",
          data.activity.length > 0 && `(${data.activity.length})`
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "ref", children: [
          "Консультации ",
          data.referrals.length > 0 && `(${data.referrals.length})`
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "diet", children: [
          "🥗 Диета ",
          data.diet.length > 0 && `(${data.diet.length})`
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "exam", children: /* @__PURE__ */ jsx(
        ListEditor,
        {
          items: data.examinations,
          onChange: (next) => patch({ examinations: next }),
          addPlaceholder: "Добавить своё обследование…",
          picker: /* @__PURE__ */ jsx(
            ItemPicker,
            {
              title: "Обследования",
              categories: ["обследование"],
              onAdd: (texts) => patch({ examinations: [...data.examinations, ...texts] })
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "treat", children: /* @__PURE__ */ jsx(
        ListEditor,
        {
          items: data.treatments,
          onChange: (next) => patch({ treatments: next }),
          addPlaceholder: "Добавить медикамент / режим…",
          picker: /* @__PURE__ */ jsx(
            ItemPicker,
            {
              title: "Медикаменты, местное лечение, режим",
              categories: ["медикамент", "местное", "режим"],
              onAdd: (texts) => patch({ treatments: [...data.treatments, ...texts] })
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "surg", children: /* @__PURE__ */ jsx(
        ListEditor,
        {
          items: data.surgeries,
          onChange: (next) => patch({ surgeries: next }),
          addPlaceholder: "Добавить название операции…",
          picker: /* @__PURE__ */ jsx(
            CatalogPicker,
            {
              title: "Каталог операций",
              triggerLabel: "Выбрать из каталога",
              triggerIcon: /* @__PURE__ */ jsx(Scissors, { className: "h-4 w-4" }),
              queryKey: "surgery_catalog",
              table: "surgery_catalog",
              select: "id, name, short_code, indications",
              format: (r) => ({
                text: r.short_code ? `${r.name} (${r.short_code})` : r.name,
                meta: r.indications || void 0
              }),
              onAdd: (texts) => patch({ surgeries: [...data.surgeries, ...texts] })
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "act", children: /* @__PURE__ */ jsx(
        ListEditor,
        {
          items: data.activity,
          onChange: (next) => patch({ activity: next }),
          addPlaceholder: "Добавить рекомендацию по нагрузке…",
          picker: /* @__PURE__ */ jsx(
            CatalogPicker,
            {
              title: "Программы физической нагрузки",
              triggerLabel: "Выбрать программу",
              triggerIcon: /* @__PURE__ */ jsx(Activity, { className: "h-4 w-4" }),
              queryKey: "physical_activity_programs",
              table: "physical_activity_programs",
              select: "id, name, category, age_range, description",
              format: (r) => ({
                text: r.description ? `${r.name} — ${r.description}` : r.name,
                meta: [r.category, r.age_range].filter(Boolean).join(" · ") || void 0
              }),
              onAdd: (texts) => patch({ activity: [...data.activity, ...texts] })
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "ref", children: /* @__PURE__ */ jsx(
        ListEditor,
        {
          items: data.referrals,
          onChange: (next) => patch({ referrals: next }),
          addPlaceholder: "Добавить консультацию вручную…",
          picker: /* @__PURE__ */ jsx(ReferralsPicker, { onAdd: (texts) => patch({ referrals: [...data.referrals, ...texts] }) })
        }
      ) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "diet", children: /* @__PURE__ */ jsx(
        ListEditor,
        {
          items: data.diet,
          onChange: (next) => patch({ diet: next }),
          addPlaceholder: "Добавить свой пункт диеты…",
          picker: /* @__PURE__ */ jsx(DietPicker, { onAdd: (texts) => patch({ diet: [...data.diet, ...texts] }) })
        }
      ) })
    ] }) })
  ] });
}
const VISIT_BUCKET_LABEL = {
  examinations: "Обследования",
  treatments: "Медикаменты",
  referrals: "Консультации",
  diet: "Диета и режим",
  surgeries: "Оперативное лечение",
  activity: "Физ. нагрузка"
};
function bucketForPlanItem(it) {
  const c = (it.section_category || "").toLowerCase().trim();
  const LATIN_MAP = {
    examination: "examinations",
    exam: "examinations",
    lab: "examinations",
    labs: "examinations",
    imaging: "examinations",
    diagnostic: "examinations",
    referral: "referrals",
    consultation: "referrals",
    consult: "referrals",
    lifestyle: "diet",
    diet: "diet",
    nutrition: "diet",
    iv_drip: "treatments",
    iv_bolus: "treatments",
    im: "treatments",
    sc: "treatments",
    oral_rx: "treatments",
    oral_supplement: "treatments",
    rectal: "treatments",
    topical: "treatments",
    nasal: "treatments",
    sublingual: "treatments",
    peptide: "treatments",
    procedure: "treatments",
    homeopathy: "treatments",
    physiotherapy: "treatments"
  };
  if (LATIN_MAP[c]) return LATIN_MAP[c];
  if (/обслед|анализ|узи|кт|мрт|рентг|диагност|допплер|эхо|лаб/.test(c)) return "examinations";
  if (/консульт|направ|специалист/.test(c)) return "referrals";
  if (/диет|питан|режим|образ жизни/.test(c)) return "diet";
  if (/мед|лекар|препар|табл|капс|раств|инъек|мазь|свеч|сироп|капл|бад|пептид|гомеоп|процедур|физио/.test(c))
    return "treatments";
  return "treatments";
}
const bucketFor = bucketForPlanItem;
function formatItem(it) {
  const parts = [];
  parts.push(it.name.trim());
  if (it.dose != null) {
    const u = (it.dose_unit || "").trim();
    parts.push(`— ${it.dose}${u ? " " + u : ""}`);
  } else if (it.dose_unit) {
    parts.push(`— ${it.dose_unit}`);
  }
  if (it.frequency) parts.push(it.frequency);
  if (it.duration_days) parts.push(`${it.duration_days} дн.`);
  if (it.time_of_day && it.time_of_day.length) parts.push(`(${it.time_of_day.join(", ")})`);
  if (it.route_hint) parts.push(it.route_hint);
  if (it.notes) parts.push(`— ${it.notes}`);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
function mergePlanItemsIntoAssignments(current, items) {
  const base = {
    examinations: [...(current == null ? void 0 : current.examinations) ?? EMPTY_ASSIGNMENTS.examinations],
    treatments: [...(current == null ? void 0 : current.treatments) ?? EMPTY_ASSIGNMENTS.treatments],
    referrals: [...(current == null ? void 0 : current.referrals) ?? EMPTY_ASSIGNMENTS.referrals],
    diet: [...(current == null ? void 0 : current.diet) ?? EMPTY_ASSIGNMENTS.diet],
    surgeries: [...(current == null ? void 0 : current.surgeries) ?? EMPTY_ASSIGNMENTS.surgeries],
    activity: [...(current == null ? void 0 : current.activity) ?? EMPTY_ASSIGNMENTS.activity]
  };
  for (const it of items) {
    if (!(it == null ? void 0 : it.name)) continue;
    const b = bucketFor(it);
    const line = formatItem(it);
    if (!line) continue;
    if (!base[b].some((x) => x.trim().toLowerCase() === line.toLowerCase())) {
      base[b].push(line);
    }
  }
  return base;
}
export {
  AssignmentsPanel as A,
  NORMALIZATION_VERSION as N,
  VISIT_BUCKET_LABEL as V,
  normalizeAssignments as a,
  bucketForPlanItem as b,
  mergePlanItemsIntoAssignments as m,
  normalizeImportedProtocolData as n
};
