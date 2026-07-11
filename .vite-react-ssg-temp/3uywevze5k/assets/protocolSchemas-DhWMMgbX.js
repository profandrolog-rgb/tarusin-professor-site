import { jsx, jsxs } from "react/jsx-runtime";
import { B as Button, t as toast, L as Label, I as Input, T as Textarea, r as Checkbox, s as supabase, C as Card, c as CardHeader, d as CardTitle, a as CardContent, b as Badge } from "../main.mjs";
import { createContext, useState, useEffect, useContext, useMemo } from "react";
import { Wand2, Zap, X, RotateCcw, Loader2, Sparkles, FlaskConical, Plus, AlertTriangle, Trash2 } from "lucide-react";
import { u as useVisitTextTemplates, g as getFieldKeyMap, d as detectOperationMatch, r as resolveTemplate } from "./templates-B4T4fWBm.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
const SmartTemplatesContext = createContext(null);
function SmartTemplatesProvider({
  protocolType,
  data,
  onChange,
  children
}) {
  const { data: templates = [] } = useVisitTextTemplates();
  const operationName = (data == null ? void 0 : data.operation_name) || "";
  return /* @__PURE__ */ jsx(SmartTemplatesContext.Provider, { value: { protocolType, data: data || {}, onChange, templates, operationName }, children });
}
function useCtx() {
  const ctx = useContext(SmartTemplatesContext);
  return ctx;
}
function SmartFieldLabel({
  children,
  fieldKey,
  formField,
  htmlFor,
  value,
  onSet
}) {
  var _a;
  const ctx = useCtx();
  const field = formField || fieldKey;
  const currentVal = value !== void 0 ? value : ctx && field ? ((_a = ctx.data) == null ? void 0 : _a[field]) || "" : "";
  const tpl = ctx && fieldKey ? resolveTemplate(ctx.templates, ctx.protocolType, fieldKey, ctx.operationName) : null;
  const apply = () => {
    if (!tpl) return;
    if (onSet) onSet(tpl.template_text);
    else if (ctx && field) ctx.onChange({ [field]: tpl.template_text });
  };
  const reset = () => {
    if (onSet) onSet("");
    else if (ctx && field) ctx.onChange({ [field]: "" });
  };
  const hasVal = !!(currentVal && currentVal.length);
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
    /* @__PURE__ */ jsx(Label, { htmlFor, children }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          size: "sm",
          variant: "ghost",
          className: "h-7 px-2 text-xs",
          onClick: reset,
          disabled: !hasVal,
          title: "Очистить поле",
          children: [
            /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3 mr-1" }),
            " сброс"
          ]
        }
      ),
      tpl && /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          size: "sm",
          variant: "ghost",
          className: "h-7 px-2 text-xs text-primary",
          onClick: apply,
          title: tpl.label,
          children: [
            /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3 mr-1" }),
            " ",
            hasVal ? "перезаписать" : "шаблон"
          ]
        }
      )
    ] })
  ] });
}
function FillStandardButton({ overwrite = false }) {
  const ctx = useCtx();
  if (!ctx) return null;
  const fieldMap = getFieldKeyMap(ctx.protocolType);
  const handle = () => {
    var _a;
    const patch = {};
    let count = 0;
    for (const [tplKey, formField] of Object.entries(fieldMap)) {
      const tpl = resolveTemplate(ctx.templates, ctx.protocolType, tplKey, ctx.operationName);
      if (!tpl) continue;
      const existing = ((_a = ctx.data) == null ? void 0 : _a[formField]) || "";
      if (existing && !overwrite) continue;
      patch[formField] = tpl.template_text;
      count++;
    }
    if (count === 0) {
      toast({ title: "Все поля уже заполнены", description: "Нет пустых полей со стандартом." });
      return;
    }
    ctx.onChange(patch);
    toast({ title: `Заполнено полей: ${count}` });
  };
  return /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: handle, children: [
    /* @__PURE__ */ jsx(Wand2, { className: "h-4 w-4 mr-2" }),
    "Заполнить стандартные поля"
  ] });
}
function OperationTemplateBanner() {
  const ctx = useCtx();
  const [dismissed, setDismissed] = useState("");
  useEffect(() => {
    setDismissed("");
  }, [ctx == null ? void 0 : ctx.operationName]);
  if (!ctx) return null;
  const match = detectOperationMatch(ctx.templates, ctx.protocolType, ctx.operationName);
  if (!match.matched || dismissed === ctx.operationName) return null;
  const apply = () => {
    const fieldMap = getFieldKeyMap(ctx.protocolType);
    const patch = {};
    let count = 0;
    for (const tpl of match.templates) {
      const formField = fieldMap[tpl.field_key];
      if (!formField) continue;
      patch[formField] = tpl.template_text;
      count++;
    }
    if (count > 0) {
      ctx.onChange(patch);
      toast({ title: `Применён шаблон операции (${count} полей)` });
    }
    setDismissed(ctx.operationName);
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4 text-primary" }),
      /* @__PURE__ */ jsxs("span", { children: [
        "Найден шаблон для ",
        /* @__PURE__ */ jsxs("strong", { children: [
          "«",
          match.label,
          "»"
        ] }),
        " — подставить?"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", onClick: apply, children: "Да, подставить" }),
      /* @__PURE__ */ jsx(
        Button,
        {
          type: "button",
          size: "sm",
          variant: "ghost",
          onClick: () => setDismissed(ctx.operationName),
          title: "Скрыть",
          children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
        }
      )
    ] })
  ] });
}
const DEFAULT_SOMATIC = {
  general: "Самочувствие хорошее. Общее состояние удовлетворительное. В сознании, контактен, адекватен, ориентирован в месте и времени, критичен, фон настроения ровный. Двигательная активность нормативная, не ограничена. Шкала Глазго = 15 баллов.",
  skin: "Кожные покровы и видимые слизистые оболочки обычной окраски, чистые. Язык влажный, чистый.",
  lymph_nodes: "Периферические лимфатические узлы не увеличены, безболезненны.",
  respiratory: "Носовое дыхание свободное. Зев не гиперемирован. Миндалины не увеличены. Дыхание везикулярное, проводится во все отделы, хрипов нет. ЧДД 16 в минуту.",
  cardiovascular: "Тоны сердца ясные, ритмичные. ЧСС соответствует пульсу. Дополнительных сердечных шумов не выслушивается. Границы сердца не расширены.",
  abdomen: "Живот спокойный, участвует в дыхании, мягкий, безболезненный во всех отделах. Симптомы раздражения брюшины при осмотре не выявлено. Печень и селезёнка не увеличены.",
  kidneys: "Область почек не изменена. Симптом поколачивания отрицательный с обеих сторон.",
  physiological: "Мочится свободно, стул регулярный, оформленный."
};
function SomaticStatusSection({ data, onChange }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { children: "Рост, см" }),
        /* @__PURE__ */ jsx(Input, { value: data.height_cm || "", onChange: (e) => onChange({ height_cm: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { children: "Вес, кг" }),
        /* @__PURE__ */ jsx(Input, { value: data.weight_kg || "", onChange: (e) => onChange({ weight_kg: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { children: "АД" }),
        /* @__PURE__ */ jsx(Input, { value: data.bp || "", onChange: (e) => onChange({ bp: e.target.value }), placeholder: "120/80" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { children: "Пульс" }),
        /* @__PURE__ */ jsx(Input, { value: data.pulse || "", onChange: (e) => onChange({ pulse: e.target.value }) })
      ] })
    ] }),
    data.full_text ? /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "somatic_full_text", value: data.full_text || "", onSet: (v) => onChange({ full_text: v }), children: "Полный соматический статус" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 5, value: data.full_text || "", onChange: (e) => onChange({ full_text: e.target.value }) })
    ] }) : null,
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "general_status", value: data.general || "", onSet: (v) => onChange({ general: v }), children: "Общее состояние" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 3, value: data.general || "", onChange: (e) => onChange({ general: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "somatic_skin", value: data.skin || "", onSet: (v) => onChange({ skin: v }), children: "Кожные покровы и слизистые" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.skin || "", onChange: (e) => onChange({ skin: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "somatic_lymph_nodes", value: data.lymph_nodes || "", onSet: (v) => onChange({ lymph_nodes: v }), children: "Лимфатические узлы" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.lymph_nodes || "", onChange: (e) => onChange({ lymph_nodes: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "somatic_respiratory", value: data.respiratory || "", onSet: (v) => onChange({ respiratory: v }), children: "Органы дыхания" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.respiratory || "", onChange: (e) => onChange({ respiratory: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "somatic_cardiovascular", value: data.cardiovascular || "", onSet: (v) => onChange({ cardiovascular: v }), children: "Сердечно-сосудистая система" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.cardiovascular || "", onChange: (e) => onChange({ cardiovascular: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "somatic_abdomen", value: data.abdomen || "", onSet: (v) => onChange({ abdomen: v }), children: "Живот" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.abdomen || "", onChange: (e) => onChange({ abdomen: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "somatic_kidneys", value: data.kidneys || "", onSet: (v) => onChange({ kidneys: v }), children: "Область почек" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.kidneys || "", onChange: (e) => onChange({ kidneys: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "somatic_physiological", value: data.physiological || "", onSet: (v) => onChange({ physiological: v }), children: "Физиологические отправления" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.physiological || "", onChange: (e) => onChange({ physiological: e.target.value }) })
    ] })
  ] });
}
const DEFAULT_LOCAL_STATUS = {
  external_genitalia: "Наружные половые органы сформированы правильно, по мужскому типу.",
  penis: "Половой член сформирован правильно. Крайняя плоть свободно смещается, головка обнажается полностью. Наружное отверстие уретры в типичном месте.",
  scrotum: "Мошонка сформирована правильно, симметрична, кожа без изменений.",
  right_testis: "В мошонке, эластической консистенции, безболезненно при пальпации.",
  left_testis: "В мошонке, эластической консистенции, безболезненно при пальпации.",
  epididymis: "Придатки яичек не увеличены, безболезненны.",
  spermatic_cord: "Семенные канатики не утолщены, варикозного расширения вен не определяется.",
  inguinal_rings: "Наружные паховые кольца не расширены, грыжевых выпячиваний нет."
};
function LocalStatusAndrologySection({ data, onChange }) {
  const hasSplitStatus = !!(data.right || data.left);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    hasSplitStatus ? /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-md border", children: /* @__PURE__ */ jsxs("table", { className: "w-full table-fixed border-collapse text-sm", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-muted/50", children: [
        /* @__PURE__ */ jsx("th", { className: "w-1/2 border-b border-r p-2 text-left font-medium", children: /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_right", value: data.right || "", onSet: (v) => onChange({ right: v }), children: "Справа" }) }),
        /* @__PURE__ */ jsx("th", { className: "w-1/2 border-b p-2 text-left font-medium", children: /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_left", value: data.left || "", onSet: (v) => onChange({ left: v }), children: "Слева" }) })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("td", { className: "border-r p-0 align-top", children: /* @__PURE__ */ jsx(Textarea, { rows: 8, className: "min-h-[180px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0", value: data.right || "", onChange: (e) => onChange({ right: e.target.value }) }) }),
        /* @__PURE__ */ jsx("td", { className: "p-0 align-top", children: /* @__PURE__ */ jsx(Textarea, { rows: 8, className: "min-h-[180px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0", value: data.left || "", onChange: (e) => onChange({ left: e.target.value }) }) })
      ] }) })
    ] }) }) : null,
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status", value: data.external_genitalia || "", onSet: (v) => onChange({ external_genitalia: v }), children: "Наружные половые органы" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.external_genitalia || "", onChange: (e) => onChange({ external_genitalia: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_penis", value: data.penis || "", onSet: (v) => onChange({ penis: v }), children: "Половой член" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 3, value: data.penis || "", onChange: (e) => onChange({ penis: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_scrotum", value: data.scrotum || "", onSet: (v) => onChange({ scrotum: v }), children: "Мошонка" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.scrotum || "", onChange: (e) => onChange({ scrotum: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_right_testis", value: data.right_testis || "", onSet: (v) => onChange({ right_testis: v }), children: "Правое яичко" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.right_testis || "", onChange: (e) => onChange({ right_testis: e.target.value }) }),
        /* @__PURE__ */ jsx(Input, { placeholder: "Объём, мл", value: data.right_testis_volume || "", onChange: (e) => onChange({ right_testis_volume: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_left_testis", value: data.left_testis || "", onSet: (v) => onChange({ left_testis: v }), children: "Левое яичко" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.left_testis || "", onChange: (e) => onChange({ left_testis: e.target.value }) }),
        /* @__PURE__ */ jsx(Input, { placeholder: "Объём, мл", value: data.left_testis_volume || "", onChange: (e) => onChange({ left_testis_volume: e.target.value }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_epididymis", value: data.epididymis || "", onSet: (v) => onChange({ epididymis: v }), children: "Придатки" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.epididymis || "", onChange: (e) => onChange({ epididymis: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_spermatic_cord", value: data.spermatic_cord || "", onSet: (v) => onChange({ spermatic_cord: v }), children: "Семенные канатики" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.spermatic_cord || "", onChange: (e) => onChange({ spermatic_cord: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_inguinal_rings", value: data.inguinal_rings || "", onSet: (v) => onChange({ inguinal_rings: v }), children: "Паховые кольца" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.inguinal_rings || "", onChange: (e) => onChange({ inguinal_rings: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_perineum", value: data.perineum || "", onSet: (v) => onChange({ perineum: v }), children: "Промежность" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.perineum || "", onChange: (e) => onChange({ perineum: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Дополнительно" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.notes || "", onChange: (e) => onChange({ notes: e.target.value }) })
    ] })
  ] });
}
const DEFAULT_SEXUAL_FORMULA = {
  P: "0",
  Ax: "0",
  F: "0",
  L: "0",
  G: "1"
};
const STAGES = ["0", "1", "2", "3", "4", "5"];
function Field({ label, hint, value, onChange }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
    /* @__PURE__ */ jsxs(Label, { children: [
      label,
      " ",
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground font-normal", children: [
        "(",
        hint,
        ")"
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "select",
      {
        value: value || "0",
        onChange: (e) => onChange(e.target.value),
        className: "h-9 w-full rounded-md border border-input bg-background px-2 text-sm",
        children: STAGES.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s))
      }
    )
  ] });
}
function SexualFormulaSection({ data, onChange }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: "P", hint: "лобковое оволосение", value: data.P, onChange: (v) => onChange({ P: v }) }),
      /* @__PURE__ */ jsx(Field, { label: "Ax", hint: "подмышки", value: data.Ax, onChange: (v) => onChange({ Ax: v }) }),
      /* @__PURE__ */ jsx(Field, { label: "F", hint: "лицо", value: data.F, onChange: (v) => onChange({ F: v }) }),
      /* @__PURE__ */ jsx(Field, { label: "L", hint: "гортань / голос", value: data.L, onChange: (v) => onChange({ L: v }) }),
      /* @__PURE__ */ jsx(Field, { label: "G", hint: "гениталии (Tanner)", value: data.G, onChange: (v) => onChange({ G: v }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Примечание" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.formula_note || "", onChange: (e) => onChange({ formula_note: e.target.value }) })
    ] })
  ] });
}
const DEFAULT_PENIS_EXAM = {
  structure: "Не нарушена, типичная. Состоит из двух симметричных кавернозных тел и одного спонгиозного тела. Подкожные ткани подвижны под датчиком, мальформаций, адгезий, хорд не выявлено.",
  tunica: "Структура белочной оболочки непрерывная, не слоистая, бляшек, уплотнений, надрывов не выявлено. Толщина белочной оболочки --- мм.",
  dorsal_bundle: "Типичного состава, дорзальная вена компримируема, расширений, тромбозов нет. Дорзальная артерия проходима.",
  cavernous_arteries: "Кавернозные артерии проходимы.",
  urethra: "Структура не нарушена, проходима. Стенки не утолщены."
};
const DEFAULT_PROSTATE = {
  position: "нормативное",
  syntopy: "не изменена",
  pelvic_effusion: "нет",
  parenchyma: "не изменена",
  capsule: "не выражена",
  infravesical_obstruction: "нет",
  urethra_internal_opening: "симптом скобы не отмечается",
  paraprostatic_veins: { diameter: "", reflux: "нет" }
};
const DEFAULT_AORTO_MESENTERIC = {
  aorta_structure: "нормативный ход",
  sma_origin: "нормативное",
  left_renal_vein_position: "типичная интерпозиция",
  retroaortic_component: "нет",
  conclusion: "Признаков аорто-мезентериальной компрессии не выявлено."
};
const DEFAULT_ILIAC_MAY_THURNER = {
  may_thurner_anatomy: "типичная",
  flow_videographically: "поток не изменён",
  conclusion: "Данных за конфликт Мей–Тернера не получено."
};
const DEFAULT_UZI_REPRODUCTIVE = {
  device: "УЗ-сканер с линейным датчиком 7,5–12 МГц",
  right_testis_structure: "Эхоструктура однородная, эхогенность не изменена. Образований не выявлено.",
  left_testis_structure: "Эхоструктура однородная, эхогенность не изменена. Образований не выявлено.",
  right_epididymis: "Не увеличен, структура однородная.",
  left_epididymis: "Не увеличен, структура однородная.",
  show_penis_exam: true,
  penis_exam: DEFAULT_PENIS_EXAM,
  show_prostate: true,
  vessels: "Вены гроздьевидного сплетения не расширены.",
  doppler: "При ЦДК кровоток сохранён, симметричный с обеих сторон.",
  free_fluid: "Свободной жидкости в оболочках яичек не определяется.",
  conclusion: "УЗ-признаков патологии органов мошонки не выявлено."
};
const ARTERIAL_NORM = {
  right: { vmax: "4-8", vmin: "1-3", vmed: "", ri: "0.62-0.72", pi: "0.9-1.2", acc: "" },
  left: { vmax: "4-8", vmin: "1-3", vmed: "", ri: "0.62-0.72", pi: "0.9-1.2", acc: "" }
};
const VENOUS_NORM = {
  right: { v_dir: "0", v_red: "0", v_rev: "0", t_ref: "0", acc_ref: "0", diameter: "< 3" },
  left: { v_dir: "0", v_red: "0", v_rev: "0", t_ref: "0", acc_ref: "0", diameter: "< 3" }
};
const ARTERIAL_PARAMS = [
  { key: "vmax", label: "Vmax (см/с)" },
  { key: "vmin", label: "Vmin (см/с)" },
  { key: "vmed", label: "Vmed/T (см/с)" },
  { key: "ri", label: "RI" },
  { key: "pi", label: "PI" },
  { key: "acc", label: "Acc (см/с²)" }
];
const VENOUS_PARAMS = [
  { key: "v_dir", label: "V dir (см/с)" },
  { key: "v_red", label: "V red (см/с)" },
  { key: "v_rev", label: "V rev / Вальсальва (см/с)" },
  { key: "t_ref", label: "T ref (сек)" },
  { key: "acc_ref", label: "Acc ref (см/с²)" },
  { key: "diameter", label: "Диаметр вен (мм)" }
];
function UziReproductiveSection({ data, onChange }) {
  var _a, _b;
  const arterial = data.arterial_flow || {};
  const venous = data.venous_flow || {};
  const penis = data.penis_exam || {};
  const setArt = (side, key, val) => {
    onChange({
      arterial_flow: {
        ...arterial,
        [side]: { ...arterial[side] || {}, [key]: val }
      }
    });
  };
  const setVen = (side, key, val) => {
    onChange({
      venous_flow: {
        ...venous,
        [side]: { ...venous[side] || {}, [key]: val }
      }
    });
  };
  const setPenis = (key, val) => {
    onChange({ penis_exam: { ...penis, [key]: val } });
  };
  const handleFlowTab = (e) => {
    if (e.key !== "Tab") return;
    const target = e.currentTarget;
    const tbody = target.closest("tbody");
    if (!tbody) return;
    const rights = Array.from(tbody.querySelectorAll('input[data-flow-col="right"]'));
    const lefts = Array.from(tbody.querySelectorAll('input[data-flow-col="left"]'));
    const order = [...rights, ...lefts];
    const idx = order.indexOf(target);
    if (idx === -1) return;
    const nextIdx = e.shiftKey ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= order.length) return;
    e.preventDefault();
    order[nextIdx].focus();
    order[nextIdx].select();
  };
  const prostate = data.prostate || {};
  const setProstate = (key, val) => {
    const next = { ...prostate, [key]: val };
    if (key === "residual_urine_volume" || key === "bladder_volume") {
      const bladder = parseFloat((key === "bladder_volume" ? val : prostate.bladder_volume || "").replace(",", "."));
      const residual = parseFloat((key === "residual_urine_volume" ? val : prostate.residual_urine_volume || "").replace(",", "."));
      if (isFinite(bladder) && bladder > 0 && isFinite(residual) && residual >= 0) {
        next.residual_urine_percent = (residual / bladder * 100).toFixed(1);
      }
    }
    onChange({ prostate: next });
  };
  const setParaVeins = (key, val) => {
    onChange({
      prostate: {
        ...prostate,
        paraprostatic_veins: { ...prostate.paraprostatic_veins || {}, [key]: val }
      }
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Аппарат" }),
      /* @__PURE__ */ jsx(Input, { value: data.device || "", onChange: (e) => onChange({ device: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-3 border rounded-md", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: "Правое яичко" }),
        /* @__PURE__ */ jsx(Input, { placeholder: "Размеры (мм)", value: data.right_testis_size || "", onChange: (e) => onChange({ right_testis_size: e.target.value }) }),
        /* @__PURE__ */ jsx(Input, { placeholder: "Объём (мл)", value: data.right_testis_volume || "", onChange: (e) => onChange({ right_testis_volume: e.target.value }) }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, placeholder: "Структура", value: data.right_testis_structure || "", onChange: (e) => onChange({ right_testis_structure: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-3 border rounded-md", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: "Левое яичко" }),
        /* @__PURE__ */ jsx(Input, { placeholder: "Размеры (мм)", value: data.left_testis_size || "", onChange: (e) => onChange({ left_testis_size: e.target.value }) }),
        /* @__PURE__ */ jsx(Input, { placeholder: "Объём (мл)", value: data.left_testis_volume || "", onChange: (e) => onChange({ left_testis_volume: e.target.value }) }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, placeholder: "Структура", value: data.left_testis_structure || "", onChange: (e) => onChange({ left_testis_structure: e.target.value }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-3 border rounded-md", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: "Правый придаток" }),
        /* @__PURE__ */ jsx(Input, { placeholder: "Объём придатка (см³)", value: data.right_epididymis_volume || "", onChange: (e) => onChange({ right_epididymis_volume: e.target.value }) }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, placeholder: "Описание", value: data.right_epididymis || "", onChange: (e) => onChange({ right_epididymis: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-3 border rounded-md", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: "Левый придаток" }),
        /* @__PURE__ */ jsx(Input, { placeholder: "Объём придатка (см³)", value: data.left_epididymis_volume || "", onChange: (e) => onChange({ left_epididymis_volume: e.target.value }) }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, placeholder: "Описание", value: data.left_epididymis || "", onChange: (e) => onChange({ left_epididymis: e.target.value }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-3 border rounded-md space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: "Артериальный кровоток" }),
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => onChange({ arterial_flow: ARTERIAL_NORM }), children: [
          /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3 mr-1" }),
          " Норма"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
          /* @__PURE__ */ jsx("th", { className: "text-left font-medium py-1 pr-2", children: "Параметр" }),
          /* @__PURE__ */ jsx("th", { className: "text-left font-medium py-1 px-2", children: "Справа" }),
          /* @__PURE__ */ jsx("th", { className: "text-left font-medium py-1 pl-2", children: "Слева" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: ARTERIAL_PARAMS.map((p, idx) => {
          var _a2, _b2;
          return /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-b-0", children: [
            /* @__PURE__ */ jsx("td", { className: "py-1 pr-2 text-muted-foreground", children: p.label }),
            /* @__PURE__ */ jsx("td", { className: "py-1 px-2", children: /* @__PURE__ */ jsx(Input, { className: "h-8", "data-flow-col": "right", "data-flow-row": idx, onKeyDown: handleFlowTab, value: ((_a2 = arterial.right) == null ? void 0 : _a2[p.key]) || "", onChange: (e) => setArt("right", p.key, e.target.value) }) }),
            /* @__PURE__ */ jsx("td", { className: "py-1 pl-2", children: /* @__PURE__ */ jsx(Input, { className: "h-8", "data-flow-col": "left", "data-flow-row": idx, onKeyDown: handleFlowTab, value: ((_b2 = arterial.left) == null ? void 0 : _b2[p.key]) || "", onChange: (e) => setArt("left", p.key, e.target.value) }) })
          ] }, p.key);
        }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-3 border rounded-md space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: "Венозный кровоток" }),
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => onChange({ venous_flow: VENOUS_NORM }), children: [
          /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3 mr-1" }),
          " Норма"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
          /* @__PURE__ */ jsx("th", { className: "text-left font-medium py-1 pr-2", children: "Параметр" }),
          /* @__PURE__ */ jsx("th", { className: "text-left font-medium py-1 px-2", children: "Справа" }),
          /* @__PURE__ */ jsx("th", { className: "text-left font-medium py-1 pl-2", children: "Слева" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: VENOUS_PARAMS.map((p, idx) => {
          var _a2, _b2;
          return /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-b-0", children: [
            /* @__PURE__ */ jsx("td", { className: "py-1 pr-2 text-muted-foreground", children: p.label }),
            /* @__PURE__ */ jsx("td", { className: "py-1 px-2", children: /* @__PURE__ */ jsx(Input, { className: "h-8", "data-flow-col": "right", "data-flow-row": idx, onKeyDown: handleFlowTab, value: ((_a2 = venous.right) == null ? void 0 : _a2[p.key]) || "", onChange: (e) => setVen("right", p.key, e.target.value) }) }),
            /* @__PURE__ */ jsx("td", { className: "py-1 pl-2", children: /* @__PURE__ */ jsx(Input, { className: "h-8", "data-flow-col": "left", "data-flow-row": idx, onKeyDown: handleFlowTab, value: ((_b2 = venous.left) == null ? void 0 : _b2[p.key]) || "", onChange: (e) => setVen("left", p.key, e.target.value) }) })
          ] }, p.key);
        }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Сосудистый рисунок" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.vessels || "", onChange: (e) => onChange({ vessels: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "ЦДК / допплер" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.doppler || "", onChange: (e) => onChange({ doppler: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Свободная жидкость" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.free_fluid || "", onChange: (e) => onChange({ free_fluid: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-3 border rounded-md space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              id: "show-penis-exam",
              checked: data.show_penis_exam !== false,
              onCheckedChange: (v) => onChange({ show_penis_exam: v === true })
            }
          ),
          /* @__PURE__ */ jsx(Label, { htmlFor: "show-penis-exam", className: "font-medium text-sm cursor-pointer", children: "Выводить «Исследование полового члена» в протоколе" })
        ] }),
        data.show_penis_exam !== false && /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => onChange({ penis_exam: { ...penis, ...DEFAULT_PENIS_EXAM } }), children: [
          /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3 mr-1" }),
          " Стандарт"
        ] })
      ] }),
      data.show_penis_exam !== false && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Структура полового члена" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 3, value: penis.structure || "", onChange: (e) => setPenis("structure", e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Ø правого кавернозного тела (мм)" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: penis.right_cavernous_diameter || "", onChange: (e) => setPenis("right_cavernous_diameter", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Ø левого кавернозного тела (мм)" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: penis.left_cavernous_diameter || "", onChange: (e) => setPenis("left_cavernous_diameter", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Ø спонгиозного тела (мм)" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: penis.spongious_diameter || "", onChange: (e) => setPenis("spongious_diameter", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Белочная оболочка и фасции" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: penis.tunica || "", onChange: (e) => setPenis("tunica", e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Дорзальный пучок" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: penis.dorsal_bundle || "", onChange: (e) => setPenis("dorsal_bundle", e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Дорзальная артерия, Vmax (см/с)" }),
          /* @__PURE__ */ jsx(Input, { className: "h-8", value: penis.dorsal_artery_vmax || "", onChange: (e) => setPenis("dorsal_artery_vmax", e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Кавернозные артерии" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: penis.cavernous_arteries || "", onChange: (e) => setPenis("cavernous_arteries", e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Правая кавернозная артерия" }),
            /* @__PURE__ */ jsx(Textarea, { rows: 2, value: penis.right_cavernous_artery || "", onChange: (e) => setPenis("right_cavernous_artery", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Левая кавернозная артерия" }),
            /* @__PURE__ */ jsx(Textarea, { rows: 2, value: penis.left_cavernous_artery || "", onChange: (e) => setPenis("left_cavernous_artery", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Уретра" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: penis.urethra || "", onChange: (e) => setPenis("urethra", e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Заключение по половому члену" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 3, placeholder: "Если оставить пустым — не будет напечатано", value: penis.conclusion || "", onChange: (e) => setPenis("conclusion", e.target.value) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-3 border rounded-md space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              id: "show-prostate",
              checked: data.show_prostate !== false,
              onCheckedChange: (v) => onChange({ show_prostate: v === true })
            }
          ),
          /* @__PURE__ */ jsx(Label, { htmlFor: "show-prostate", className: "font-medium text-sm cursor-pointer", children: "Выводить «УЗИ предстательной железы» в протоколе" })
        ] }),
        data.show_prostate !== false && /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => onChange({ prostate: { ...prostate, ...DEFAULT_PROSTATE } }), children: [
          /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3 mr-1" }),
          " Стандарт"
        ] })
      ] }),
      data.show_prostate !== false && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Положение" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: prostate.position || "", onChange: (e) => setProstate("position", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Синтопия с органами таза" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: prostate.syntopy || "", onChange: (e) => setProstate("syntopy", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Выпот в углублениях таза" }),
          /* @__PURE__ */ jsx(Input, { className: "h-8", value: prostate.pelvic_effusion || "", onChange: (e) => setProstate("pelvic_effusion", e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Объём предстательной железы (см³)" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: prostate.prostate_volume || "", onChange: (e) => setProstate("prostate_volume", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Средняя доля, объём (см³)" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: prostate.middle_lobe_volume || "", onChange: (e) => setProstate("middle_lobe_volume", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Паренхима" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                className: "h-8",
                value: prostate.parenchyma ?? "не изменена",
                onChange: (e) => setProstate("parenchyma", e.target.value),
                placeholder: "не изменена"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Капсула" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                className: "h-8",
                value: prostate.capsule ?? "не выражена",
                onChange: (e) => setProstate("capsule", e.target.value),
                placeholder: "не выражена"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Косвенные признаки инфравезикальной обструкции" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: prostate.infravesical_obstruction || "", onChange: (e) => setProstate("infravesical_obstruction", e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Внутреннее отверстие уретры" }),
          /* @__PURE__ */ jsx(Input, { className: "h-8", value: prostate.urethra_internal_opening || "", onChange: (e) => setProstate("urethra_internal_opening", e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Эластография — правая доля" }),
            /* @__PURE__ */ jsx(Textarea, { rows: 2, value: prostate.elastography_right || "", onChange: (e) => setProstate("elastography_right", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Эластография — левая доля" }),
            /* @__PURE__ */ jsx(Textarea, { rows: 2, value: prostate.elastography_left || "", onChange: (e) => setProstate("elastography_left", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Объём мочевого пузыря при исследовании (мл)" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: prostate.bladder_volume || "", onChange: (e) => setProstate("bladder_volume", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Позыв на микцию (баллов)" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: prostate.micturition_urge || "", onChange: (e) => setProstate("micturition_urge", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Объём остаточной мочи (мл)" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: prostate.residual_urine_volume || "", onChange: (e) => setProstate("residual_urine_volume", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Остаточная моча (% от исходного объёма)" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", placeholder: "рассчитывается автоматически", value: prostate.residual_urine_percent || "", onChange: (e) => setProstate("residual_urine_percent", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-2 border rounded space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-medium", children: "Парапростатические вены" }),
          /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Диаметр (мм)" }),
              /* @__PURE__ */ jsx(Input, { className: "h-8", value: ((_a = prostate.paraprostatic_veins) == null ? void 0 : _a.diameter) || "", onChange: (e) => setParaVeins("diameter", e.target.value) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Наличие рефлюкса" }),
              /* @__PURE__ */ jsx(Input, { className: "h-8", value: ((_b = prostate.paraprostatic_veins) == null ? void 0 : _b.reflux) || "", onChange: (e) => setParaVeins("reflux", e.target.value) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Заключение по предстательной железе" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 3, placeholder: "Если оставить пустым — не будет напечатано", value: prostate.conclusion || "", onChange: (e) => setProstate("conclusion", e.target.value) })
        ] })
      ] })
    ] }),
    (() => {
      const am = data.aorto_mesenteric || {};
      const setAm = (key, val) => {
        const next = { ...am, [key]: val };
        if (key === "diameter_premesenteric" || key === "diameter_intramesenteric") {
          const pre = parseFloat(((key === "diameter_premesenteric" ? val : am.diameter_premesenteric) || "").replace(",", "."));
          const intra = parseFloat(((key === "diameter_intramesenteric" ? val : am.diameter_intramesenteric) || "").replace(",", "."));
          if (isFinite(pre) && isFinite(intra) && intra > 0) {
            next.ratio_pre_intra = (pre / intra).toFixed(2);
          }
        }
        onChange({ aorto_mesenteric: next });
      };
      return /* @__PURE__ */ jsxs("div", { className: "p-3 border rounded-md space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: "Зона аорто-мезентериального конфликта" }),
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => onChange({ aorto_mesenteric: { ...am, ...DEFAULT_AORTO_MESENTERIC } }), children: [
            /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3 mr-1" }),
            " Стандарт"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Структура и ход аорты" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: am.aorta_structure || "", onChange: (e) => setAm("aorta_structure", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Отхождение верхней брыжеечной артерии" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: am.sma_origin || "", onChange: (e) => setAm("sma_origin", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Положение левой почечной вены" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: am.left_renal_vein_position || "", onChange: (e) => setAm("left_renal_vein_position", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Ретроаортальный компонент ЛПВ (есть/нет)" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: am.retroaortic_component || "", onChange: (e) => setAm("retroaortic_component", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs font-medium pt-1", children: "Диаметры левой почечной вены (мм)" }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Премезентериальный" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: am.diameter_premesenteric || "", onChange: (e) => setAm("diameter_premesenteric", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Интрамезентериальный" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: am.diameter_intramesenteric || "", onChange: (e) => setAm("diameter_intramesenteric", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Постмезентериальный" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: am.diameter_postmesenteric || "", onChange: (e) => setAm("diameter_postmesenteric", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Соотношение премезентериальный : интрамезентериальный" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", placeholder: "рассчитывается автоматически", value: am.ratio_pre_intra || "", onChange: (e) => setAm("ratio_pre_intra", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Скорость потока в зоне сужения (см/с)" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: am.stenosis_flow_velocity || "", onChange: (e) => setAm("stenosis_flow_velocity", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Заключение" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, placeholder: "Если оставить пустым — не будет напечатано", value: am.conclusion || "", onChange: (e) => setAm("conclusion", e.target.value) })
        ] })
      ] });
    })(),
    (() => {
      const mt = data.iliac_may_thurner || {};
      const setMt = (key, val) => {
        onChange({ iliac_may_thurner: { ...mt, [key]: val } });
      };
      return /* @__PURE__ */ jsxs("div", { className: "p-3 border rounded-md space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: "Зона илиакального конфликта (Мей–Тернера)" }),
          /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => onChange({ iliac_may_thurner: { ...mt, ...DEFAULT_ILIAC_MAY_THURNER } }), children: [
            /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3 mr-1" }),
            " Стандарт"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Анатомия зоны Мей–Тернера" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: mt.may_thurner_anatomy || "", onChange: (e) => setMt("may_thurner_anatomy", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Диаметр левой общей подвздошной вены (мм)" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: mt.left_common_iliac_diameter || "", onChange: (e) => setMt("left_common_iliac_diameter", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Видеографически" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: mt.flow_videographically || "", onChange: (e) => setMt("flow_videographically", e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Скорость потока в зоне компрессии (см/с)" }),
            /* @__PURE__ */ jsx(Input, { className: "h-8", value: mt.compression_flow_velocity || "", onChange: (e) => setMt("compression_flow_velocity", e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Заключение" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, placeholder: "Если оставить пустым — не будет напечатано", value: mt.conclusion || "", onChange: (e) => setMt("conclusion", e.target.value) })
        ] })
      ] });
    })(),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Заключение УЗИ" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 3, value: data.conclusion || "", onChange: (e) => onChange({ conclusion: e.target.value }) })
    ] })
  ] });
}
const DEFAULT_UZI_URINARY = {
  device: "УЗ-сканер с конвексным датчиком 3,5–5 МГц",
  right_kidney_parenchyma: "Не истончена, эхогенность не изменена. Кортико-медуллярная дифференциация сохранена.",
  right_kidney_pelvis: "Не расширена.",
  right_kidney_structure: "Положение типичное, контуры ровные. Конкрементов не выявлено.",
  left_kidney_parenchyma: "Не истончена, эхогенность не изменена. Кортико-медуллярная дифференциация сохранена.",
  left_kidney_pelvis: "Не расширена.",
  left_kidney_structure: "Положение типичное, контуры ровные. Конкрементов не выявлено.",
  ureters: "Не визуализируются, что соответствует норме.",
  bladder_walls: "Не утолщены, контуры ровные.",
  bladder_contents: "Содержимое однородное, эхо-негативное.",
  residual_urine: "Остаточной мочи нет / клинически незначимая.",
  conclusion: "УЗ-признаков патологии органов мочевыделительной системы не выявлено."
};
function UziUrinarySection({ data, onChange }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Аппарат" }),
      /* @__PURE__ */ jsx(Input, { value: data.device || "", onChange: (e) => onChange({ device: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-3 border rounded-md", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: "Правая почка" }),
        /* @__PURE__ */ jsx(Input, { placeholder: "Размеры (мм)", value: data.right_kidney_size || "", onChange: (e) => onChange({ right_kidney_size: e.target.value }) }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, placeholder: "Паренхима", value: data.right_kidney_parenchyma || "", onChange: (e) => onChange({ right_kidney_parenchyma: e.target.value }) }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, placeholder: "Лоханка", value: data.right_kidney_pelvis || "", onChange: (e) => onChange({ right_kidney_pelvis: e.target.value }) }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, placeholder: "Структура / положение", value: data.right_kidney_structure || "", onChange: (e) => onChange({ right_kidney_structure: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-3 border rounded-md", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: "Левая почка" }),
        /* @__PURE__ */ jsx(Input, { placeholder: "Размеры (мм)", value: data.left_kidney_size || "", onChange: (e) => onChange({ left_kidney_size: e.target.value }) }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, placeholder: "Паренхима", value: data.left_kidney_parenchyma || "", onChange: (e) => onChange({ left_kidney_parenchyma: e.target.value }) }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, placeholder: "Лоханка", value: data.left_kidney_pelvis || "", onChange: (e) => onChange({ left_kidney_pelvis: e.target.value }) }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, placeholder: "Структура / положение", value: data.left_kidney_structure || "", onChange: (e) => onChange({ left_kidney_structure: e.target.value }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Мочеточники" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.ureters || "", onChange: (e) => onChange({ ureters: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { children: "Объём мочевого пузыря (мл)" }),
        /* @__PURE__ */ jsx(Input, { value: data.bladder_volume || "", onChange: (e) => onChange({ bladder_volume: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { children: "Остаточная моча" }),
        /* @__PURE__ */ jsx(Input, { value: data.residual_urine || "", onChange: (e) => onChange({ residual_urine: e.target.value }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Стенки мочевого пузыря" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.bladder_walls || "", onChange: (e) => onChange({ bladder_walls: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Содержимое" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.bladder_contents || "", onChange: (e) => onChange({ bladder_contents: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Заключение УЗИ" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 3, value: data.conclusion || "", onChange: (e) => onChange({ conclusion: e.target.value }) })
    ] })
  ] });
}
function ClinicalHistorySection({ data, onChange, show, rows = 4, patientId, currentVisitId }) {
  const s = {
    complaints: (show == null ? void 0 : show.complaints) ?? true,
    anamnesis: (show == null ? void 0 : show.anamnesis) ?? true,
    dynamics: (show == null ? void 0 : show.dynamics) ?? true
  };
  const [aiBusy, setAiBusy] = useState(false);
  const collectAnamnesis = async () => {
    var _a;
    if (!patientId) {
      toast({ title: "Не указан пациент", variant: "destructive" });
      return;
    }
    setAiBusy(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke("summarize-patient-anamnesis", {
        body: { patient_id: patientId, exclude_visit_id: currentVisitId, prior_anamnesis: data.anamnesis || "" }
      });
      if (error) throw error;
      const summary = (_a = resp == null ? void 0 : resp.summary) == null ? void 0 : _a.trim();
      if (!summary) {
        toast({ title: "Нет данных для анамнеза", description: "У пациента нет предыдущих протоколов." });
        return;
      }
      onChange({ anamnesis: summary });
      toast({ title: "Анамнез собран из истории" });
    } catch (e) {
      toast({ title: "Не удалось собрать анамнез", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setAiBusy(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    s.complaints && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "complaints", children: "Жалобы" }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          rows,
          value: data.complaints || "",
          onChange: (e) => onChange({ complaints: e.target.value })
        }
      )
    ] }),
    s.anamnesis && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "anamnesis", value: data.anamnesis || "", onSet: (v) => onChange({ anamnesis: v }), children: "Анамнез" }),
        patientId ? /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            onClick: collectAnamnesis,
            disabled: aiBusy,
            className: "h-7 gap-1 text-xs",
            title: "Собрать краткий анамнез ИИ из всех предыдущих протоколов пациента",
            children: [
              aiBusy ? /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
              "Собрать из истории"
            ]
          }
        ) : null
      ] }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          rows,
          value: data.anamnesis || "",
          onChange: (e) => onChange({ anamnesis: e.target.value })
        }
      )
    ] }),
    s.dynamics && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.dynamics || "", onSet: (v) => onChange({ dynamics: v }), children: "Динамика" }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          rows,
          value: data.dynamics || "",
          onChange: (e) => onChange({ dynamics: e.target.value }),
          placeholder: "Если первичный визит — оставьте пустым, на печать не попадёт"
        }
      )
    ] })
  ] });
}
const DEFAULT_PEPTIDE_PROGRAM = {
  program_title: "Пептидная программа",
  goal: "",
  items: [],
  conclusion: "",
  recommendations: "Контроль переносимости. Контрольный визит / анализы — в указанную дату. При появлении нежелательных реакций — отмена и связь с врачом."
};
function statusBadge(p) {
  const tags = [];
  const rf = (p.rf_status || "").toLowerCase();
  if (rf.includes("зарегистрирован")) tags.push({ label: "ЛС РФ", tone: "ok" });
  else if (rf.includes("бад")) tags.push({ label: "БАД", tone: "warn" });
  else if (rf.includes("research")) tags.push({ label: "Research", tone: "alert" });
  else if (rf) tags.push({ label: "Статус ?", tone: "muted" });
  const ev = (p.evidence_level || "").toUpperCase();
  if (ev) {
    const tone = ev.startsWith("A") || ev.startsWith("B") ? "ok" : ev.startsWith("C") ? "warn" : "alert";
    tags.push({ label: `Дока: ${ev}`, tone });
  }
  const onco = (p.onco_risk || "").toLowerCase();
  if (onco && !onco.includes("не описан") && !onco.includes("нет данных")) {
    tags.push({ label: "Онкориск", tone: "alert" });
  }
  return tags;
}
const toneClass = (t) => t === "ok" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : t === "warn" ? "bg-amber-100 text-amber-800 border-amber-300" : t === "alert" ? "bg-red-100 text-red-800 border-red-300" : "bg-muted text-muted-foreground";
function PeptideProgramForm({ data, onChange }) {
  const [peptides, setPeptides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerGroup, setPickerGroup] = useState("all");
  const [pickerId, setPickerId] = useState("");
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: rows, error } = await supabase.from("peptides").select("*").eq("is_active", true).order("group_name", { ascending: true }).order("name", { ascending: true });
      if (!alive) return;
      if (!error && rows) setPeptides(rows);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);
  const groups = useMemo(() => {
    const s = /* @__PURE__ */ new Set();
    peptides.forEach((p) => p.group_name && s.add(p.group_name));
    return Array.from(s).sort();
  }, [peptides]);
  const filtered = useMemo(
    () => peptides.filter((p) => pickerGroup === "all" || p.group_name === pickerGroup),
    [peptides, pickerGroup]
  );
  const items = data.items || [];
  const set = (k, v) => onChange({ [k]: v });
  const addItem = () => {
    const p = peptides.find((x) => x.id === pickerId);
    if (!p) return;
    if (items.some((it) => it.peptide_id === p.id)) return;
    const newItem = {
      peptide_id: p.id,
      name: p.name,
      group_name: p.group_name,
      target_organ: p.target_organ,
      schedule: p.typical_schedule || "",
      duration: p.course_duration || "",
      monitoring: p.monitoring || "",
      notes: "",
      onco_risk: p.onco_risk,
      evidence_level: p.evidence_level,
      rf_status: p.rf_status
    };
    set("items", [...items, newItem]);
    setPickerId("");
  };
  const updateItem = (idx, patch) => {
    set("items", items.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };
  const removeItem = (idx) => set("items", items.filter((_, i) => i !== idx));
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsx(ClinicalHistorySection, { data, onChange: (p) => onChange(p), rows: 2 }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FlaskConical, { className: "h-4 w-4" }),
        " Параметры пептидной программы"
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1 md:col-span-3", children: [
            /* @__PURE__ */ jsx(Label, { children: "Название программы" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: data.program_title || "",
                onChange: (e) => set("program_title", e.target.value),
                placeholder: "Например: Anti-age пептидная поддержка / Иммунокоррекция"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Дата начала курса" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: data.start_date || "",
                onChange: (e) => set("start_date", e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Дата контрольного визита / анализов" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: data.control_date || "",
                onChange: (e) => set("control_date", e.target.value)
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { children: "Цель программы" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              rows: 3,
              value: data.goal || "",
              onChange: (e) => set("goal", e.target.value),
              placeholder: "Какие задачи решает программа (нейропротекция, иммунокоррекция, anti-age и т. д.)"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Подбор препаратов" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-[200px_1fr_auto] gap-2 items-end", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Группа" }),
            /* @__PURE__ */ jsxs(Select, { value: pickerGroup, onValueChange: setPickerGroup, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Все группы" }),
                groups.map((g) => /* @__PURE__ */ jsx(SelectItem, { value: g, children: g }, g))
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Препарат" }),
            /* @__PURE__ */ jsxs(Select, { value: pickerId, onValueChange: setPickerId, disabled: loading, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: loading ? "Загрузка…" : "Выберите пептид" }) }),
              /* @__PURE__ */ jsx(SelectContent, { className: "max-h-[320px]", children: filtered.map((p) => /* @__PURE__ */ jsxs(SelectItem, { value: p.id, children: [
                p.name,
                p.group_name ? ` — ${p.group_name}` : ""
              ] }, p.id)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Button, { type: "button", onClick: addItem, disabled: !pickerId, className: "gap-1", children: [
            /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
            " Добавить"
          ] })
        ] }),
        items.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Препараты не выбраны." }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: items.map((it, idx) => {
          const tags = statusBadge({
            rf_status: it.rf_status || null,
            evidence_level: it.evidence_level || null,
            onco_risk: it.onco_risk || null
          });
          const alert = tags.some((t) => t.tone === "alert");
          return /* @__PURE__ */ jsx(Card, { className: alert ? "border-red-300" : "", children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-4 space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "font-medium text-sm flex items-center gap-2 flex-wrap", children: [
                  /* @__PURE__ */ jsxs("span", { children: [
                    idx + 1,
                    ". ",
                    it.name
                  ] }),
                  it.group_name && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                    "· ",
                    it.group_name
                  ] })
                ] }),
                it.target_organ && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  "Орган-мишень: ",
                  it.target_organ
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex gap-1 flex-wrap mt-1", children: tags.map((t, i) => /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: `text-[10px] ${toneClass(t.tone)}`, children: [
                  t.tone === "alert" && /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3 mr-1 inline" }),
                  t.label
                ] }, i)) })
              ] }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "icon",
                  onClick: () => removeItem(idx),
                  className: "h-8 w-8 text-destructive",
                  children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Схема приёма" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: it.schedule,
                    onChange: (e) => updateItem(idx, { schedule: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Длительность курса" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: it.duration,
                    onChange: (e) => updateItem(idx, { duration: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1 md:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Контроль" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: it.monitoring || "",
                    onChange: (e) => updateItem(idx, { monitoring: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1 md:col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Комментарий / индивидуальные пометки" }),
                /* @__PURE__ */ jsx(
                  Textarea,
                  {
                    rows: 2,
                    value: it.notes || "",
                    onChange: (e) => updateItem(idx, { notes: e.target.value })
                  }
                )
              ] })
            ] })
          ] }) }, `${it.peptide_id}-${idx}`);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Заключение по программе" }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          rows: 4,
          value: data.conclusion || "",
          onChange: (e) => set("conclusion", e.target.value)
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Рекомендации" }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          rows: 4,
          value: data.recommendations || "",
          onChange: (e) => set("recommendations", e.target.value)
        }
      )
    ] })
  ] });
}
const DEFAULT_PROTOCOL_DATA = {
  ultrashort: {
    complaints: "Активных жалоб не предъявляет.",
    anamnesis: "Со слов родителей: рос и развивался по возрасту. Хронические заболевания отрицают.",
    somatic: DEFAULT_SOMATIC,
    sexual_formula: DEFAULT_SEXUAL_FORMULA,
    local_status: DEFAULT_LOCAL_STATUS,
    recommendations: "Динамическое наблюдение. Контрольный осмотр через 6 месяцев."
  },
  postop_day3: {
    general_status: "Удовлетворительное. Температура тела нормальная.",
    wound_status: "Послеоперационная рана без признаков воспаления, повязка чистая, сухая.",
    dressing: "Перевязка с водным раствором хлоргексидина 0,05%.",
    pain: "Умеренный болевой синдром в зоне операции.",
    temperature: "36,6 °C",
    recommendations: "Перевязки 1 раз в день. Туалет послеоперационной раны. Ограничение физических нагрузок. Контрольный осмотр на 7-е сутки.\nКонтрольный осмотр: ____________ 2026 г.\nКонтрольное УЗИ исследование — по назначению профессора."
  },
  postop_day7: {
    day_number: 7,
    general_status: "Удовлетворительное.",
    wound_status: "Послеоперационная рана зажила первичным натяжением. Воспалительных явлений нет.",
    sutures_removed: true,
    healing: "Заживление первичным натяжением.",
    recommendations: "Ограничение физических нагрузок 1 месяц. При появлении жалоб — обращение к лечащему врачу.\nКонтрольный осмотр: ____________ 2026 г.\nКонтрольное УЗИ исследование — по назначению профессора."
  },
  primary_short: {
    complaints: "",
    anamnesis: "Со слов родителей: рос и развивался по возрасту. Хронические заболевания отрицают. Аллергоанамнез не отягощён. Травмы, операции — нет.",
    somatic: DEFAULT_SOMATIC,
    sexual_formula: DEFAULT_SEXUAL_FORMULA,
    local_status: DEFAULT_LOCAL_STATUS,
    exam_plan: "ОАК, ОАМ, УЗИ органов мошонки и почек.",
    recommendations: "Контрольный осмотр через 6 месяцев."
  },
  repeat_with_labs: {
    complaints: "Жалоб нет.",
    local_status: DEFAULT_LOCAL_STATUS,
    conclusion: "Данных за патологию не выявлено.",
    recommendations: "Динамическое наблюдение. Контрольный осмотр через 6 месяцев."
  },
  uzi_reproductive: {
    indications: "Скрининговое обследование.",
    uzi: DEFAULT_UZI_REPRODUCTIVE,
    recommendations: "Контрольное УЗИ через 6–12 месяцев."
  },
  uzi_urinary: {
    indications: "Скрининговое обследование.",
    uzi: DEFAULT_UZI_URINARY,
    recommendations: "Контрольное УЗИ через 6–12 месяцев."
  },
  uzi_bladder: {
    indications: "Оценка функции мочеиспускания, определение остаточной мочи.",
    device: "УЗ-сканер с конвексным датчиком 3,5–5 МГц",
    print_enabled: true,
    bladder_walls: "Не утолщены, контуры ровные.",
    bladder_contents: "Содержимое однородное, эхо-негативное.",
    micturition_urge: "Позыв на микцию выраженный.",
    residual_urine: "Клинически незначимая.",
    conclusion: "УЗ-признаков патологии мочевого пузыря не выявлено, остаточной мочи нет.",
    recommendations: "Контроль по показаниям."
  },
  dynamic_with_uzi: {
    complaints: "Жалоб нет.",
    local_status: DEFAULT_LOCAL_STATUS,
    uzi: DEFAULT_UZI_REPRODUCTIVE,
    conclusion: "Без отрицательной динамики.",
    recommendations: "Динамическое наблюдение. Контрольный осмотр через 6 месяцев."
  },
  repeat_with_uzi: {
    complaints: "Жалоб нет.",
    local_status: DEFAULT_LOCAL_STATUS,
    uzi: DEFAULT_UZI_REPRODUCTIVE,
    conclusion: "Без отрицательной динамики.",
    recommendations: "Динамическое наблюдение. Контрольный осмотр через 6 месяцев."
  },
  online_consult: {
    reason: "Первичная онлайн-консультация",
    prior_visit: "no",
    external_exam_by_photo: false,
    external_exam_by_video: false,
    external_genitalia: "Наружные половые органы развиты по мужскому типу, яички в мошонке, семенные канатики не изменены, область паховых колец не изменена, половой член развит по возрасту, уретра в типичном положении, меатус в типичном положении, крайняя плоть открывается, половое развитие соответствует возрасту.",
    in_person_needed: "no",
    recommendations: "Контрольный осмотр / повторная консультация по согласованию."
  },
  peptide_program: DEFAULT_PEPTIDE_PROGRAM
};
export {
  ClinicalHistorySection as C,
  DEFAULT_PROTOCOL_DATA as D,
  FillStandardButton as F,
  LocalStatusAndrologySection as L,
  OperationTemplateBanner as O,
  PeptideProgramForm as P,
  SomaticStatusSection as S,
  UziReproductiveSection as U,
  SexualFormulaSection as a,
  SmartFieldLabel as b,
  UziUrinarySection as c,
  DEFAULT_UZI_REPRODUCTIVE as d,
  SmartTemplatesProvider as e
};
