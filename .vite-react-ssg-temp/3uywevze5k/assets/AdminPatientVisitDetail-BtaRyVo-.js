import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Zap, RotateCcw, ChevronUp, ChevronDown, Plus, Trash2, Stethoscope, Phone, ChevronsUpDown, Loader2, Check, Brain, ChevronRight, EyeOff, FileText, ArrowLeft, Copy, Eye, Save, Pencil, Printer, FileDown, X } from "lucide-react";
import { e as exportNodeToPdf } from "./exportPdf-BAJanap8.js";
import { format } from "date-fns";
import { C as Card, c as CardHeader, d as CardTitle, a as CardContent, T as Textarea, B as Button, L as Label, I as Input, r as Checkbox, s as supabase, w as Sheet, x as SheetTrigger, y as SheetContent, z as SheetHeader, A as SheetTitle, b as Badge, G as SheetFooter, t as toast, n as cn, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogDescription, l as DialogFooter, u as useAuth, J as TooltipProvider, K as Tooltip, M as TooltipTrigger, N as TooltipContent, O as DropdownMenu, Q as DropdownMenuTrigger, R as DropdownMenuContent, U as DropdownMenuItem } from "../main.mjs";
import { P as PROTOCOL_TYPE_MAP } from "./protocolTypes-BWCSK0Md.js";
import { C as ClinicalHistorySection, S as SomaticStatusSection, a as SexualFormulaSection, b as SmartFieldLabel, L as LocalStatusAndrologySection, U as UziReproductiveSection, c as UziUrinarySection, d as DEFAULT_UZI_REPRODUCTIVE, e as SmartTemplatesProvider, F as FillStandardButton, O as OperationTemplateBanner, P as PeptideProgramForm, D as DEFAULT_PROTOCOL_DATA } from "./protocolSchemas-DhWMMgbX.js";
import { S as SexualConstitutionSection, P as ProtocolPrintLayout } from "./ProtocolPrintLayout-CGOJZTTp.js";
import { R as RadioGroup, a as RadioGroupItem } from "./radio-group-CM9YN36E.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { useQuery } from "@tanstack/react-query";
import { S as ScrollArea } from "./scroll-area-DtgkI4MV.js";
import { S as Switch } from "./switch-D2b9t4DD.js";
import { C as Command, a as CommandInput, b as CommandList, c as CommandEmpty, d as CommandGroup, e as CommandItem } from "./command-o9G8Kzt4.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-C_8nSrct.js";
import { u as useAutoSave } from "./useAutoSave-DcIiKxWj.js";
import { n as normalizeImportedProtocolData, N as NORMALIZATION_VERSION, A as AssignmentsPanel, a as normalizeAssignments, m as mergePlanItemsIntoAssignments } from "./applyPlanItemsToAssignments-DFGkeYbc.js";
import { toast as toast$1 } from "sonner";
import { e as pushPendingRxItems, f as subscribePlanItems, h as popQueuedPlanItems, s as setActiveContext, c as clearActiveContextIfMatches } from "./protocolBridge-4TuhSmsW.js";
import { u as useProtocolFragmentReceiver } from "./useProtocolFragmentReceiver-B3USCy2g.js";
import { P as PdfBatchUpload } from "./PdfBatchUpload-9wDw5BUe.js";
import "jspdf";
import "html2canvas";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
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
import "react-helmet-async";
import "./templates-B4T4fWBm.js";
import "date-fns/locale";
import "@radix-ui/react-radio-group";
import "@radix-ui/react-select";
import "@radix-ui/react-scroll-area";
import "@radix-ui/react-switch";
import "cmdk";
import "@radix-ui/react-popover";
import "./tabs-CJYPrMmK.js";
import "@radix-ui/react-tabs";
import "./progress-Y5q1JT93.js";
import "@radix-ui/react-progress";
const SCROTUM_DEFAULT$1 = "Яичко в мошонке, положение правильное, размеры по возрасту, тургор достаточный, эластичность обычная, пальпация безболезненная. Придаток яичка: положение правильное, форма типичная, подвижность обычная, пальпация безболезненная, гидатиды не пальпируются, кист головки придатка нет.";
function UltrashortForm({ data, onChange, patientId, currentVisitId }) {
  const ls = data.local_status && typeof data.local_status === "object" ? data.local_status : {};
  const legacyLsText = typeof data.local_status === "string" ? data.local_status : "";
  const patchLs = (p) => onChange({ local_status: { ...ls, ...p } });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx(
      ClinicalHistorySection,
      {
        data,
        onChange: (p) => onChange(p),
        rows: 4,
        patientId,
        currentVisitId
      }
    ),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Общий осмотр (соматический статус)" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(
        SomaticStatusSection,
        {
          data: data.somatic || {},
          onChange: (p) => onChange({ somatic: { ...data.somatic || {}, ...p } })
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Сведения о пубертате (шкала Таннера)" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(
          SexualFormulaSection,
          {
            data: data.sexual_formula || {},
            onChange: (p) => onChange({ sexual_formula: { ...data.sexual_formula || {}, ...p } })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.sexual_formula_text || "", onSet: (v) => onChange({ sexual_formula_text: v }), children: "Половая формула (текст)" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              rows: 2,
              value: data.sexual_formula_text || "",
              onChange: (e) => onChange({ sexual_formula_text: e.target.value })
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Половая жизнь / сведения о консультации" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(
          SexualConstitutionSection,
          {
            value: data.sexual_constitution,
            onChange: (v) => onChange({ sexual_constitution: v })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.consultation_notes || "", onSet: (v) => onChange({ consultation_notes: v }), children: "Сведения о консультации (активность, ход беседы)" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              rows: 3,
              value: data.consultation_notes || "",
              onChange: (e) => onChange({ consultation_notes: e.target.value })
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Локальный осмотр" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        legacyLsText && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-dashed p-2 text-xs text-muted-foreground", children: [
          "Старая запись локального статуса (текстом): «",
          legacyLsText,
          "». Перенесите вручную в нужные поля ниже."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(
            SmartFieldLabel,
            {
              fieldKey: "local_status",
              value: ls.external_genitalia || "",
              onSet: (v) => patchLs({ external_genitalia: v }),
              children: "Наружные половые органы"
            }
          ),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              rows: 2,
              value: ls.external_genitalia || "",
              onChange: (e) => patchLs({ external_genitalia: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Яички и придатки (органы мошонки)" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  size: "sm",
                  variant: "outline",
                  className: "h-7 px-2 text-xs gap-1",
                  onClick: () => patchLs({ scrotum_right: SCROTUM_DEFAULT$1, scrotum_left: SCROTUM_DEFAULT$1 }),
                  children: [
                    /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3" }),
                    " Шаблон обе"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  size: "sm",
                  variant: "ghost",
                  className: "h-7 px-2 text-xs gap-1",
                  disabled: !ls.scrotum_right && !ls.scrotum_left,
                  onClick: () => patchLs({ scrotum_right: "", scrotum_left: "" }),
                  children: [
                    /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }),
                    " Сброс"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-md border", children: /* @__PURE__ */ jsxs("table", { className: "w-full table-fixed border-collapse text-sm", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-muted/50", children: [
              /* @__PURE__ */ jsx("th", { className: "w-1/2 border-b border-r p-2 text-left font-medium", children: "Справа" }),
              /* @__PURE__ */ jsx("th", { className: "w-1/2 border-b p-2 text-left font-medium", children: "Слева" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "border-r p-0 align-top", children: /* @__PURE__ */ jsx(
                Textarea,
                {
                  rows: 5,
                  className: "min-h-[120px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
                  value: ls.scrotum_right || "",
                  onChange: (e) => patchLs({ scrotum_right: e.target.value })
                }
              ) }),
              /* @__PURE__ */ jsx("td", { className: "p-0 align-top", children: /* @__PURE__ */ jsx(
                Textarea,
                {
                  rows: 5,
                  className: "min-h-[120px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
                  value: ls.scrotum_left || "",
                  onChange: (e) => patchLs({ scrotum_left: e.target.value })
                }
              ) })
            ] }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(
            SmartFieldLabel,
            {
              fieldKey: "local_status_penis",
              value: ls.penis || "",
              onSet: (v) => patchLs({ penis: v }),
              children: "Половой член"
            }
          ),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              rows: 3,
              value: ls.penis || "",
              onChange: (e) => patchLs({ penis: e.target.value })
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "conclusion", children: "Заключение / краткое резюме консультации" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.conclusion || "", onChange: (e) => onChange({ conclusion: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "recommendations", children: "Рекомендации" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.recommendations || "", onChange: (e) => onChange({ recommendations: e.target.value }) })
    ] })
  ] });
}
function PostOpDay3Form({ data, onChange }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx(
      ClinicalHistorySection,
      {
        data,
        onChange: (p) => onChange(p),
        show: { complaints: false },
        rows: 2
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { children: "Название операции" }),
        /* @__PURE__ */ jsx(Input, { value: data.operation_name || "", onChange: (e) => onChange({ operation_name: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { children: "Дата операции" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: data.operation_date || "", onChange: (e) => onChange({ operation_date: e.target.value }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.temperature || "", onSet: (v) => onChange({ temperature: v }), children: "Температура" }),
        /* @__PURE__ */ jsx(Input, { value: data.temperature || "", onChange: (e) => onChange({ temperature: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.pain || "", onSet: (v) => onChange({ pain: v }), children: "Болевой синдром" }),
        /* @__PURE__ */ jsx(Input, { value: data.pain || "", onChange: (e) => onChange({ pain: e.target.value }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "general_status", children: "Общее состояние" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.general_status || "", onChange: (e) => onChange({ general_status: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "wound_status", children: "Состояние раны" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 3, value: data.wound_status || "", onChange: (e) => onChange({ wound_status: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.dressing || "", onSet: (v) => onChange({ dressing: v }), children: "Перевязка" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.dressing || "", onChange: (e) => onChange({ dressing: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "complaints", children: "Жалобы" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.complaints || "", onChange: (e) => onChange({ complaints: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "uzi_express", value: data.uzi_express || "", onSet: (v) => onChange({ uzi_express: v }), children: "УЗИ экспресс" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 3, value: data.uzi_express || "", onChange: (e) => onChange({ uzi_express: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "recommendations", children: "Рекомендации" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.recommendations || "", onChange: (e) => onChange({ recommendations: e.target.value }) })
    ] })
  ] });
}
function PostOpDay7Form({ data, onChange }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx(
      ClinicalHistorySection,
      {
        data,
        onChange: (p) => onChange(p),
        show: { complaints: false },
        rows: 2
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { children: "Название операции" }),
        /* @__PURE__ */ jsx(Input, { value: data.operation_name || "", onChange: (e) => onChange({ operation_name: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { children: "Дата операции" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: data.operation_date || "", onChange: (e) => onChange({ operation_date: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { children: "Срок осмотра (сутки)" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "number",
            min: 1,
            max: 365,
            value: data.day_number ?? 7,
            onChange: (e) => {
              const v = parseInt(e.target.value, 10);
              onChange({ day_number: Number.isFinite(v) && v > 0 ? v : void 0 });
            }
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "general_status", children: "Общее состояние" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.general_status || "", onChange: (e) => onChange({ general_status: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "wound_status", children: "Состояние раны" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 3, value: data.wound_status || "", onChange: (e) => onChange({ wound_status: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.healing || "", onSet: (v) => onChange({ healing: v }), children: "Заживление" }),
      /* @__PURE__ */ jsx(Input, { value: data.healing || "", onChange: (e) => onChange({ healing: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(
        Checkbox,
        {
          id: "sutures_removed",
          checked: !!data.sutures_removed,
          onCheckedChange: (v) => onChange({ sutures_removed: !!v })
        }
      ),
      /* @__PURE__ */ jsx(Label, { htmlFor: "sutures_removed", className: "cursor-pointer", children: "Швы сняты" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "complaints", children: "Жалобы" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.complaints || "", onChange: (e) => onChange({ complaints: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "uzi_express", value: data.uzi_express || "", onSet: (v) => onChange({ uzi_express: v }), children: "УЗИ экспресс" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 3, value: data.uzi_express || "", onChange: (e) => onChange({ uzi_express: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "recommendations", children: "Рекомендации" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.recommendations || "", onChange: (e) => onChange({ recommendations: e.target.value }) })
    ] })
  ] });
}
const ORTHO_STATUS_TEMPLATE = `ОРТОПЕДИЧЕСКИЙ СТАТУС

Положение головы: правильное.
Туловище: правильной формы.
Грудная клетка: правильной формы. Тип дыхания: смешанный.
Передняя брюшная стенка: правильной формы.
Соотношение туловища и конечностей: нормальное.

ОСМОТР СПЕРЕДИ
Надплечья: на одном уровне.
Плечевой сустав: движения в полном объёме в трёх плоскостях.
Локтевой сустав: движения в полном объёме в одной плоскости.
Лучезапястный сустав: движения в полном объёме в двух плоскостях.
Треугольники талии: симметричны.
Линия отвеса из incisura jugularis: проходит по пупку.
Расстояние от incisura jugularis до spina iliaca anterior superior: равное.
Перекос таза: не определяется.
Грудные железы: симметричны.
Передний рёберный горб: не определяется.
Рёберно-подвздошные промежутки: симметричны.
Рёберные дуги: не заходят за гребень подвздошной кости.
Полуокружности грудной клетки: визуально равны.

ОСМОТР СБОКУ
Шейный лордоз: выражен нормально.
Грудной кифоз: выражен нормально.
Поясничный лордоз: выражен нормально.
Положение крестца: нормальное.
Положение таза: нормальное.

ОСМОТР СЗАДИ
Лопатки: расположены на одном уровне.
Нижние углы лопаток: отстоят от линии отвеса симметрично.
Крыловидное расположение лопатки: не определяется.
Линия отвеса от C7: проходит по межъягодичной складке.
Задний рёберный горб: не определяется.
Западение грудной клетки: не определяется.
Сколиотическая деформация: не определяется.
Длинные мышцы спины: не напряжены.
Симптом «вожжей»: отрицательный.
Пальпация паравертебральных точек: безболезненна.
Симптом осевой нагрузки на позвоночник: безболезненна.

ДВИЖЕНИЯ В ПОЗВОНОЧНИКЕ
Шейный отдел: в полном объёме, безболезненны.
Грудной отдел: в полном объёме, безболезненны.
Поясничный отдел: в полном объёме, безболезненны.
Растяжимость позвоночника: нормальная.
Симптом «треноги»: отрицательный.
Проба Отта: 4 см. Проба Шобера: 5 см.

МЫШЕЧНЫЙ ТОНУС И ТРОФИКА
Мышечный тонус: нормотония.
Мышечная трофика: симметрична.
Симптом Тренделенбурга: отрицательный.
Тест Томаса: отрицательный.
Тест Ласега: отрицательный.

ОСМОТР НИЖНИХ КОНЕЧНОСТЕЙ
Укорочение: нет.
Послеоперационные рубцы: нет.

ПОДИАТРИЧЕСКИЙ СТАТУС
Длина стоп: одинаковая.
Продольный свод стопы: сформирован.
Индекс Чижина: норма. Угол Кларка: в норме.
Тест Джека (Jack test): отрицательный.
Плантарная фасция: не напряжена, безболезненна.
Hallux valgus: нет.
Установка стоп: физиологическая.
Поперечный свод стопы: сформирован.
Плантарная поверхность стопы: не изменена.
Ногтевые пластины стоп: не изменены.

ОСМОТР ВЕРХНИХ КОНЕЧНОСТЕЙ
Плечи: симметричны. Плечевая мускулатура: симметричная.
Предплечья: симметричны, деформации нет.
Локтевые суставы: симметричны, деформации нет.
Лучезапястные суставы: объём движений сохранён полностью.
Функции кисти: сохранены в полном объёме.
Ладонный апоневроз: не изменён, контрактур нет.
Ногтевые пластины кистей: не изменены.

ОСМОТР КОСТЕЙ ЧЕРЕПА
Тип черепа: нормоцефалия.
Соотношение мозгового и лицевого черепа: не нарушено.
Черепные швы: не изменены, неподвижны.
Состояние зубного ряда: нормальный прикус.
ВНЧС: движения в полном объёме, без щелчков и крепитации.

ФУНКЦИОНАЛЬНЫЕ ПРОБЫ
Положение на мысках: нормальное.
Положение на пятках: нормальное.
Сгибание с касанием пальцев к полу: полное.
Гиперэкстензия: нормальная.
Флексия вправо: нормальная. Флексия влево: нормальная.
Ротация вправо: нормальная. Ротация влево: нормальная.
Приседание на полную стопу: нормальное.
Прыжковая проба: безболезненная.
Осевая нагрузка на позвоночник: безболезненная.
Перкуссионная проба по остистым отросткам: безболезненная.

Заключение: ортопедической патологии на момент осмотра не выявлено.`;
function OrthoStatusSection({ value, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef(null);
  const hasValue = !!(value && value.trim());
  useEffect(() => {
    if (expanded && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = Math.max(300, el.scrollHeight) + "px";
    }
  }, [expanded, value]);
  const preview = hasValue ? value.split("\n").filter((l) => l.trim()).slice(0, 2).join(" / ") : "";
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-card", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 px-3 py-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Ортопедический статус" }),
        !expanded && preview && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate mt-0.5", children: preview })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [
        expanded && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              size: "sm",
              variant: "outline",
              className: "h-7 px-2 text-xs gap-1",
              onClick: () => onChange(ORTHO_STATUS_TEMPLATE),
              children: [
                /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3" }),
                " Заполнить стандарт"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              size: "sm",
              variant: "ghost",
              className: "h-7 px-2 text-xs gap-1",
              disabled: !hasValue,
              onClick: () => onChange(""),
              children: [
                /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }),
                " Сброс"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            size: "sm",
            variant: "ghost",
            className: "h-7 px-2 text-xs gap-1",
            onClick: () => setExpanded((v) => !v),
            children: expanded ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(ChevronUp, { className: "h-3 w-3" }),
              " Свернуть"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(ChevronDown, { className: "h-3 w-3" }),
              " Развернуть"
            ] })
          }
        )
      ] })
    ] }),
    expanded && /* @__PURE__ */ jsx("div", { className: "px-3 pb-3", children: /* @__PURE__ */ jsx(
      Textarea,
      {
        ref: textareaRef,
        value: value || "",
        onChange: (e) => onChange(e.target.value),
        className: "min-h-[300px] font-mono text-xs leading-relaxed",
        placeholder: "Опишите ортопедический статус или нажмите «Заполнить стандарт»"
      }
    ) })
  ] });
}
const NEURO_STATUS_TEMPLATE = `НЕВРОЛОГИЧЕСКИЙ СТАТУС

Сознание ясное. Ориентирован в месте и времени согласно возрасту, способен к контакту. Поведение адекватное. Память и интеллект сохранены, по возрасту. Обманов восприятия и бредовых идей не наблюдается.

Менингеальные симптомы.
Ригидности мышц затылка нет. Симптом Кернига отрицательный. Симптомы Брудзинского (верхний, средний, нижний) отрицательные.

Черепно-мозговые нервы.
Обонятельный нерв: обоняние сохранено, галлюцинаций нет.
Зрительный нерв: острота зрения субъективно нормальная, цветоощущение не изменено, поля зрения сохранены.
Зрачки D=S, реакции на свет живые, движение глазных яблок в полном объёме.
Глазодвигательный, блоковой, отводящий нервы: глазные щели одинаковой ширины, движения в полном объёме, косоглазия и диплопии нет, нистагм не определяется.
Тройничный нерв: болезненности точек выхода ветвей нет, чувствительность кожи лица сохранена, жевательная мускулатура достаточная, роговичный и конъюнктивальный рефлексы сохранены.
Лицевой нерв: лобные и носогубные складки симметричны, асимметрии при мимических движениях нет.
Слуховой нерв: острота слуха не изменена, шума в ушах и головокружения нет.
Языкоглоточный и блуждающий нервы: глотание не нарушено, голос звучный, мягкое нёбо подвижно, небный и глоточный рефлексы в норме.
Добавочный нерв: грудино-ключично-сосцевидные и трапециевидные мышцы не изменены, объём движений достаточный.
Подъязычный нерв: язык по средней линии, фасцикуляций нет.

Двигательная сфера.
Атрофий мышц нет. Объём активных движений в суставах конечностей достаточный. Мышечная сила не снижена. Проба Барре (верхняя и нижняя) отрицательная.
Мышечный тонус нормальный. Гипо- и гиперкинезов нет.

Рефлекторная сфера.
Сухожильные и периостальные рефлексы с верхних и нижних конечностей живые, симметричные (D=S). Патологических стопных и кистевых рефлексов нет.

Чувствительная сфера.
Поверхностная и глубокая чувствительность сохранены, симметричны. Болезненности по ходу нервных стволов нет. Симптомы натяжения (Ласега, Вассермана) отрицательные.

Координаторная сфера.
Пальценосовая и пяточно-коленная пробы выполняет уверенно. В позе Ромберга устойчив. Походка не изменена. Адиадохокинеза нет.

Вегетативная нервная система.
Дермографизм розовый, нестойкий. Потоотделение умеренное. Нарушений тазовых функций нет.

Высшие корковые функции.
Речь не нарушена. Афазии, апраксии, агнозии не выявлено.

Заключение: неврологической патологии на момент осмотра не выявлено.`;
function NeuroStatusSection({ value, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef(null);
  const hasValue = !!(value && value.trim());
  useEffect(() => {
    if (expanded && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = Math.max(300, el.scrollHeight) + "px";
    }
  }, [expanded, value]);
  const preview = hasValue ? value.split("\n").filter((l) => l.trim()).slice(0, 2).join(" / ") : "";
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-card", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 px-3 py-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Неврологический статус (расширенный)" }),
        !expanded && preview && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate mt-0.5", children: preview })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [
        expanded && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              size: "sm",
              variant: "outline",
              className: "h-7 px-2 text-xs gap-1",
              onClick: () => onChange(NEURO_STATUS_TEMPLATE),
              children: [
                /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3" }),
                " Шаблон"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              size: "sm",
              variant: "ghost",
              className: "h-7 px-2 text-xs gap-1",
              disabled: !hasValue,
              onClick: () => onChange(""),
              children: [
                /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }),
                " Сброс"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            size: "sm",
            variant: "ghost",
            className: "h-7 px-2 text-xs gap-1",
            onClick: () => setExpanded((v) => !v),
            children: expanded ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(ChevronUp, { className: "h-3 w-3" }),
              " Свернуть"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(ChevronDown, { className: "h-3 w-3" }),
              " Развернуть"
            ] })
          }
        )
      ] })
    ] }),
    expanded && /* @__PURE__ */ jsx("div", { className: "px-3 pb-3", children: /* @__PURE__ */ jsx(
      Textarea,
      {
        ref: textareaRef,
        value: value || "",
        onChange: (e) => onChange(e.target.value),
        className: "min-h-[300px] font-mono text-xs leading-relaxed",
        placeholder: "Опишите неврологический статус или нажмите «Шаблон»"
      }
    ) })
  ] });
}
const AGE_GROUP_OPTIONS = [
  { value: "А", label: "А: Дошкольник 3–6" },
  { value: "Б", label: "Б: Мл.школьник 7–10" },
  { value: "В", label: "В: Мл.подросток 11–14" },
  { value: "Г", label: "Г: Ст.подросток 15–17" },
  { value: "Д", label: "Д: Взрослый 18+" }
];
function calcAgeYears(birthDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return null;
  const now = /* @__PURE__ */ new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || m === 0 && now.getDate() < b.getDate()) age--;
  return age;
}
function ageToGroup(age) {
  if (age === null) return "Д";
  if (age <= 6) return "А";
  if (age <= 10) return "Б";
  if (age <= 14) return "В";
  if (age <= 17) return "Г";
  return "Д";
}
const PSYCH_TEMPLATES = {
  "А": `ПСИХИАТРИЧЕСКИЙ СТАТУС (дошкольник, 3–6 лет)

ВНЕШНИЙ ВИД И ПОВЕДЕНИЕ
Внешний вид соответствует возрасту и полу. Одет опрятно, уход осуществляется родителями надлежащим образом.
Двигательная активность: нормативная / повышена / снижена / хаотична.
В кабинет вошёл самостоятельно / на руках у родителя.
Отделение от родителя: спокойное / тревожное / протестное / невозможное.
Манера держаться: непосредственная / скованная / расторможенная / напряжённая.
Мимика: живая, выразительная / бедная / неадекватная.

КОНТАКТ И КОММУНИКАЦИЯ
На обращение реагирует: сразу / после задержки / не реагирует.
Взгляд: прямой, устойчивый / блуждающий / избегающий / «сквозной».
Совместное внимание (joint attention): сохранено / нарушено.
Инициирует контакт: да / нет / эпизодически.
Использует жесты: указательный / просьбы / социальные — сохранены / отсутствуют.
Тактильная коммуникация: нормативная / избегает прикосновений / ищет тактильного контакта.

РЕЧЬ И КОММУНИКАТИВНАЯ ФУНКЦИЯ
Уровень развития: безречевой / отдельные звуки / слоги / слова (~___ слов) / фразовая речь / развёрнутая фраза.
Темп: нормальный / ускорен / замедлен. Артикуляция: чёткая / смазанная.
Речь: понятная / малопонятная / эхолалии / речевые стереотипии / немотивированные вокализации.
Понимание обращённой речи: полное / частичное / на уровне простых инструкций / нарушено.
Коммуникативная функция речи: сохранена / нарушена.

ИГРОВАЯ ДЕЯТЕЛЬНОСТЬ
Интерес к игрушкам: есть / снижен / избирательный.
Характер игры: манипулятивная / функциональная / сюжетно-ролевая элементарная / развёрнутая сюжетно-ролевая / параллельная / совместная.
Символическая игра: есть / нет.
Стереотипные действия: не отмечаются / выстраивание в ряд / вращение / раскачивание / перебирание.

ВОСПРИЯТИЕ
Адекватность восприятия: сохранена / нарушена.
Иллюзии: не отмечаются / отмечаются.
Галлюцинации: не выявлены / выявлены (описать: _______).
Деперсонализация / дереализация: не отмечается / отмечается.

СОЗНАНИЕ И ОРИЕНТИРОВКА
Сознание ясное. Аллопсихическая ориентировка: сохранена / нарушена.
Аутопсихическая ориентировка (знает имя, возраст): да / частично / нет.

ЭМОЦИОНАЛЬНО-АФФЕКТИВНАЯ СФЕРА
Настроение: ровное / приподнятое / сниженное / лабильное / тревожное.
Аффективный контакт с матерью: дифференцированный / недифференцированный / нарушен.
Реакция на похвалу и порицание: адекватная / сниженная / отсутствует.
Страхи: возрастные / сверхинтенсивные / атипичные.
Реакция на новизну: адаптивная / тревожная / протестная / безразличная.
Аутоагрессия: не отмечается / отмечается (характер: _______).
Волевая активность: нормативная / снижена / импульсивная.
Инстинкты: пищевой — не нарушен / избирательность / отказ; самосохранения — сохранён / нарушен.

КОГНИТИВНЫЕ ФУНКЦИИ
Причинно-следственные связи: по возрасту / снижено.
Сортировка по цвету, форме, размеру: доступна / нет.
Рисунок: стадия каракулей / схематичный человек / предметный — соответствует / не соответствует возрасту.
Счёт: в пределах нормы / не сформирован.

ВЕГЕТАТИВНЫЕ ПРОЯВЛЕНИЯ
Сон: без особенностей / нарушен (засыпание / пробуждения / парасомнии / ночные страхи / снохождение).
Аппетит: без особенностей / избирательный / снижен.
Энурез: нет / дневной / ночной. Энкопрез: нет / есть.
Тики: не наблюдаются / моторные / вокальные / сложные.

ЗАКЛЮЧЕНИЕ:
Психиатрической симптоматики, требующей неотложного вмешательства, на момент осмотра не выявлено.
Психическое развитие соответствует возрасту.
Ведущий психопатологический синдром: не выявлен / выявлен (описать: _______).
Диагностическая рубрика МКБ-10: не требуется / F___ (___).`,
  "Б": `ПСИХИАТРИЧЕСКИЙ СТАТУС (младший школьник, 7–10 лет)

ВНЕШНИЙ ВИД И ПОВЕДЕНИЕ
Внешний вид соответствует возрасту и полу. Опрятен.
Манера держаться: непосредственная / скованная / расторможенная / негативистичная / демонстративная.
Мимика: живая, выразительная / амимия / гипомимия / неадекватна содержанию беседы.
Жестикуляция: адекватная / обеднена / избыточна.
Двигательная активность: нормативная / гиперактивность / гипоактивность.
Импульсивность: не отмечается / отмечается.

СОЗНАНИЕ И ОРИЕНТИРОВКА
Сознание ясное. Аллопсихическая ориентировка: полная / частичная / нарушена.
Аутопсихическая ориентировка: полная (знает имя, фамилию, возраст, адрес, имена родителей) / частичная / нарушена.

КОНТАКТ И КОММУНИКАЦИЯ
В контакт вступает: охотно / после уговоров / формально / отказывается.
Характер контакта: инициативный / вежливый / замкнутый / фамильярный / формальный.
Степень открытости: стремится раскрыть симптомы / скрывает / безразличен.
Витальный модус: астении нет / астения умеренная / выраженная.

РЕЧЬ
Темп: нормальный / ускорен / замедлен. Громкость: нормальная / тихая / громкая.
Артикуляция: чёткая / смазанная / заикание.
Словарный запас: богатый / соответствует возрасту / бедный.
Грамматический строй: правильный / аграмматизмы.
Ответы: по существу / уклончивые / однословные / развёрнутые / резонёрские.

ВОСПРИЯТИЕ
Адекватность: сохранена / нарушена.
Иллюзии: не отмечаются / зрительные / слуховые / аффективные.
Галлюцинации: не выявлены / выявлены (модальность: _______; содержание: _______; отношение: критическое / некритическое).
Деперсонализация / дереализация: не отмечается / отмечается.
Сенестопатии: не отмечаются / отмечаются (локализация: _______).

ВНИМАНИЕ
Концентрация: достаточная / снижена. Отвлекаемость: нет / есть.
Переключаемость: нормальная / затруднена. Устойчивость: достаточная / истощается.

ПАМЯТЬ
Кратковременная: сохранена / снижена. Долговременная: сохранена / снижена.
Парамнезии: не выявлены / выявлены (тип: _______).

МЫШЛЕНИЕ
Темп: нормальный / ускорен / замедлен.
Последовательность: логичная / разорванная / непоследовательная / вязкая / обстоятельная.
Уровень обобщений: по возрасту / снижен (ситуационные, конкретное мышление).
Понимание переносного смысла пословиц: доступно / формальное / недоступно.
Критичность: сохранена / снижена / отсутствует.
Навязчивые мысли: нет / есть (содержание: _______; ритуалы: нет / есть).
Сверхценные идеи: не выявлены / выявлены (_______).
Бредовые идеи: не выявлены / выявлены (содержание: _______; структура: _______).

ЭМОЦИОНАЛЬНО-АФФЕКТИВНАЯ СФЕРА
Настроение: ровное / приподнятое / сниженное / дисфорическое / тревожное / апатичное.
Динамика: устойчивое / лабильное / с вспышками / слабодушие.
Выразительность: нормальная / уплощена / усилена / неадекватна.
Аффекты злобы, гнева, тоски, страха: не отмечаются / отмечаются (характер: _______).
Тревога: нет / ситуационная / генерализованная / социальная.
Страхи: в норме / дезадаптирующие / специфические (_______).
Самооценка: адекватная / завышена / занижена.
Суицидальные мысли: не отмечались / пассивные / активные без плана / с планом.

ВОЛЕВАЯ СФЕРА И ВЛЕЧЕНИЯ
Волевая активность: нормативная / снижена / повышена.
Целенаправленность: сохранена / нарушена.
Инстинкты: пищевой — не нарушен / снижен / повышен; самосохранения — сохранён / нарушен.
Расстройства влечений: нет / дромомания / клептомания / пиромания / иное (_______).

ИНТЕЛЛЕКТ
Уровень: нормативный / сниженный (умственная отсталость: лёгкая / умеренная).
Запас знаний: соответствует образованию / снижен.
Самокритика: сохранена / снижена / отсутствует.

ШКОЛЬНАЯ АДАПТАЦИЯ
Успеваемость: хорошая / удовлетворительная / неудовлетворительная.
Отношения со сверстниками: нормативные / конфликтные / изоляция / жертва буллинга / агрессор.
Отношения с учителями: без особенностей / конфликтные.
Школьная тревога: нет / умеренная / выраженная (отказ от школы).

ПОВЕДЕНЧЕСКИЕ ОСОБЕННОСТИ
Оппозиционное поведение: нет / есть.
Агрессия: нет / вербальная / физическая / аутоагрессия.
Ложь, воровство: нет / есть. Побеги: нет / есть.

ВЕГЕТАТИВНЫЕ ПРОЯВЛЕНИЯ
Сон: без нарушений / инсомния / парасомнии.
Аппетит: без нарушений / снижен / повышен.
Соматические жалобы без органики: нет / головные боли / боли в животе / тошнота перед школой.
Тики: нет / моторные / вокальные / синдром Туретта.
Энурез: нет / ночной / дневной.

ЗАКЛЮЧЕНИЕ:
Психиатрической симптоматики, требующей неотложного вмешательства, на момент осмотра не выявлено.
Психическое развитие и эмоционально-поведенческий статус соответствуют возрасту.
Ведущий психопатологический синдром: не выявлен / выявлен (описать: _______).
Диагностическая рубрика МКБ-10: не требуется / F___ (___).`,
  "В": `ПСИХИАТРИЧЕСКИЙ СТАТУС (младший подросток, 11–14 лет)

ВНЕШНИЙ ВИД И ПОВЕДЕНИЕ
Внешний вид соответствует возрасту / акцентирован («взрослый» / инфантильный / субкультурный: _______).
Опрятность: соблюдена / снижена / пренебрежение гигиеной.
Одежда: соответствует ситуации / причудлива / небрежна.
Tattoo, пирсинг, следы самоповреждений: не определяются / определяются (локализация: _______, свежие / рубцовые).
Манера держаться: адекватная / напряжённая / демонстративная / скованная / негативистичная.
Мимика: живая / амимия / гипомимия / паратимия (несоответствие мимики речи).
Жестикуляция: адекватная / скудная / избыточная. Поза: свободная / защитная / демонстративная.
Особые признаки поведения: ритуализированные действия / гортанное покашливание / бормотание / иное: _______.
Отношение к осмотру: адекватное / настороженное / формальное / враждебное / открытое.

СОЗНАНИЕ И ОРИЕНТИРОВКА
Сознание ясное. Полностью ориентирован в месте, времени, собственной личности.
Аллопсихическая и аутопсихическая ориентировка сохранена.

КОНТАКТ
Речевой контакт: продуктивный / затруднён (причина: тревога / негативизм / мутизм).
Невербальный: глазной контакт поддерживает / избегает.
Открытость: достаточная / скрытность / уклончивость / откровенен при гарантии конфиденциальности.
Стремление раскрыть симптомы: есть / нет (диссимуляция).
Витальный модус: астении нет / астения присутствует.

РЕЧЬ
Темп: нормальный / ускорен (логорея) / замедлен. Громкость: нормальная / тихая / громкая.
Тональность: нормальная / монотонная / с аффективными всплесками.
Артикуляция: чёткая / смазанная / заикание.
Лексика: возрастная норма / обеднённая / жаргонная / обсценная.
Грамматический строй: правильный / аграмматизмы / неологизмы / витиеватость.
Персеверации: нет / есть.

ВОСПРИЯТИЕ
Адекватность: сохранена / нарушена.
Иллюзии: не отмечаются / зрительные / слуховые / аффективные.
Галлюцинации: не выявлены / выявлены (тип: истинные / псевдогаллюцинации; модальность: _______; отношение: критическое / некритическое).
Деперсонализация: нет / соматическая / психическая.
Дереализация: нет / есть.
Сенестопатии: нет / есть (локализация: _______, характер: _______).

МЫШЛЕНИЕ
Темп и последовательность: в норме / ускорен / замедлен / разорвано / вязко-обстоятельное.
Уровень абстракции: сформирован / в стадии формирования / не сформирован.
Склонность к рефлексии: умеренная / чрезмерная (застревание на переживаниях).
Критичность: сохранена / снижена / отсутствует.
Навязчивые мысли: нет / есть (содержание: _______); ритуалы: нет / есть.
Сверхценные идеи: нет / дисморфофобия / идеи отношения / реформаторства (_______).
Бредовые идеи: не выявлены / выявлены (содержание: _______; структура: систематизированный / фрагментарный).
Суицидальные мысли: не отмечались / пассивные / активные без плана / с планом / попытки в анамнезе.
Шкала Колумбия C-SSRS: нет риска / низкий / умеренный / высокий.

ЭМОЦИОНАЛЬНО-АФФЕКТИВНАЯ СФЕРА
Фон настроения: ровный / неустойчивый / сниженный / дисфорический / тревожный / эйфоричный.
Аффективная лабильность: не выражена / умеренная / выраженная.
Качество расстройства: тоскливость / вялость / злобность / гневливость / дурашливость.
Слабодушие: нет / есть.
Ангедония: нет / есть.
Апатия: нет / умеренная / выраженная.
Тревога: нет / социальная / экзаменационная / генерализованная / панические атаки (частота: ___).
Аутоагрессия: нет / порезы / ожоги / удары / иное (локализация: _______, давность: _______).
Дисморфофобия: нет / недовольство частями тела / убеждённость в уродстве (_______).

ВОЛЕВАЯ СФЕРА
Волевая активность: нормативная / гипобулия / гипербулия.
Целенаправленность: сохранена / нарушена.
Импульсивность: нет / умеренная / выраженная.
Инстинкты: пищевой — не нарушен / ограничение питания / переедание; самосохранения — сохранён / нарушен.

САМООЦЕНКА И ИДЕНТИЧНОСТЬ
Самооценка: адекватная / завышена / занижена / нестабильная.
Я-концепция: сформирована / в стадии формирования / диффузная.
Гендерная идентичность: соответствует биологическому полу / дисфория (длительность: ___, выраженность: ___).

СОЦИАЛЬНОЕ ФУНКЦИОНИРОВАНИЕ
Сверстники: дружеские / поверхностные / конфликты / изоляция / преимущественно онлайн.
Родители: удовлетворительные / конфликтные / симбиотические / дистанция.
Школа: без нарушений / снижение успеваемости / прогулы / отказ.
Интернет: нормативное / чрезмерное (___ ч/сут) / признаки зависимости.

РИСКОВАННОЕ ПОВЕДЕНИЕ
ПАВ: нет / алкоголь / каннабис / иные.
Делинквентное поведение: нет / кражи / вандализм / конфликты.

ВЕГЕТАТИВНЫЕ ПРОЯВЛЕНИЯ
Сон: достаточный / инсомния / гиперсомния / сдвиг фазы сна.
Аппетит: без нарушений / снижен / повышен / ограничение питания / переедание.

ЗАКЛЮЧЕНИЕ:
Психиатрической симптоматики, требующей неотложного вмешательства, на момент осмотра не выявлено.
Эмоционально-поведенческий статус в рамках пубертатной нормы.
Ведущий психопатологический синдром: не выявлен / выявлен (описать: _______).
Диагностическая рубрика МКБ-10: не требуется / F___ (___).`,
  "Г": `ПСИХИАТРИЧЕСКИЙ СТАТУС (старший подросток, 15–17 лет)

ВНЕШНИЙ ВИД И ПОВЕДЕНИЕ
Внешний вид соответствует возрасту / акцентирован. Самопрезентация: адекватная / манерная / небрежная.
Опрятность: соблюдена / снижена / пренебрежение гигиеной.
Одежда: соответствует ситуации / причудлива / небрежна.
Следы самоповреждений: не определяются / определяются (свежие / рубцовые; локализация: _______).
Мимика: живая / амимия / гипомимия / паратимия.
Жестикуляция и поза: адекватные / защитные / открытые.
Особые признаки: ритуализированные действия / скрытая тревога / скрытая депрессия / иное: _______.
Поведение: упорядоченное / напряжённое / хаотичное / импульсивное / демонстративное.

СОЗНАНИЕ И ОРИЕНТИРОВКА
Сознание ясное. Ориентировка полная.
Аллопсихическая (место, время, ситуация): сохранена.
Аутопсихическая (собственная личность): сохранена.

КОНТАКТ
Контакт: продуктивный / формальный / уклончивый / негативистичный.
Открытость: достаточная / скрытность / диссимуляция / аггравация.
Невербальное: открытое / защитные позы / избегание взгляда.
Отношение к осмотру: спокойное / тревожное / враждебное / безразличное / подозрительное.
Витальный модус: астении нет / астения умеренная / выраженная.

РЕЧЬ
Темп, ритм, громкость: в норме / нарушены (указать).
Артикуляция: чёткая / смазанная / заикание / скандированная.
Словарный запас: богатый / нормативный / бедный.
Грамматический строй: правильный / аграмматизмы / неологизмы / витиеватость.
Продуктивность: достаточная / бедная / чрезмерная.
Форма: последовательная / с соскальзываниями / разорванная / вязкая / обстоятельная / резонёрская / персеверативная.

ВОСПРИЯТИЕ
Иллюзии: не отмечаются / зрительные / слуховые / аффективные.
Галлюцинации истинные: слуховые — нет / комментирующие / императивные (команды: _______) / диалог / оклики / элементарные; зрительные — нет / простые / сценические; обонятельные / тактильные — нет / есть.
Псевдогаллюцинации (внутри): нет / есть (тип: _______).
Синдром Кандинского–Клерамбо: не выявлен / выявлен (идеаторный: вложение/изъятие/«открытость» мыслей; сенсорный: сделанные ощущения; моторный: сделанные действия; бред воздействия: _______).
Деперсонализация: нет / соматическая / психическая.
Дереализация: нет / есть.
Сенестопатии: нет / есть (локализация: _______, характер: _______).

МЫШЛЕНИЕ
Темп: нормальный / ускорен (скачка идей) / замедлен / шперрунг / ментизм.
Последовательность: сохранена / разорвана / соскальзывания / вязкость / обстоятельность.
Целенаправленность: сохранена / нарушена.
Уровень абстракции: сформирован / нарушен. Критичность: полная / частичная / отсутствует.
Патологические феномены: автоматизмы — нет / есть; раздвоение мышления — нет / есть; отчуждение мыслей («чужие») — нет / есть; персеверации — нет / есть.
Навязчивости: нет / обсессии (содержание: _______) / компульсии (тип: _______, ч/сут: ___) / ОКР.
Сверхценные идеи: нет / дисморфофобия / идеи отношения / особой миссии / ипохондрические.
Бредовые идеи: не выявлены / выявлены (содержание: _______; структура: первичный / вторичный; систематизированный / фрагментарный; критика: есть / нет).
Суицидальность: пассивные / активные без плана / с планом (_______) / намерение / попытки (дата: ___, метод: ___).
Шкала Колумбия C-SSRS: нет риска / низкий / умеренный / высокий.

ЭМОЦИОНАЛЬНО-АФФЕКТИВНАЯ СФЕРА
Фон: ровный / депрессивный (___ нед.) / дисфорический / тревожный / эйфоричный / апатичный / амбивалентный.
Выразительность: нормальная / уплощена / неадекватна / лабильна.
Слабодушие: нет / есть.
Депрессивная триада: нет / частичная / полная (настроение + ангедония + астения).
Качество: тоскливость / вялость / заторможенность / злобность / гневливость.
Аутоагрессия NSSI: нет / есть (функция: снятие напряжения / самонаказание / коммуникация / ощущение реальности).
Маниакальные симптомы: нет / повышенный аффект / снижение сна / ускоренное мышление / грандиозность / рискованное поведение.
Тревожные расстройства: нет / ГТР / социофобия / паническое расстройство / ПТСР (травма: _______, флэшбэки / гипербдительность / избегание).

ВОЛЕВАЯ СФЕРА
Волевая активность: нормативная / гипобулия / гипербулия.
Целенаправленность: сохранена / нарушена. Импульсивность: нет / умеренная / выраженная.
Расстройства влечений: нет / пищевые (анорексия / булимия / переедание) / игровая зависимость / ПАВ.

ЛИЧНОСТНЫЕ ОСОБЕННОСТИ
Акцентуация (по Личко): гармоничный / гипертимный / циклоидный / лабильный / астено-невротический / сензитивный / психастенический / шизоидный / эпилептоидный / истероидный / неустойчивый / конформный.
Признаки формирующегося расстройства личности: нет / есть (кластер A / B / C; _______).
Эмоциональная регуляция: достаточная / нарушена (импульсивность / избегание / диссоциация / NSSI).

СОЦИАЛЬНОЕ ФУНКЦИОНИРОВАНИЕ
Учёба: без нарушений / снижение / прогулы / отсев.
Отношения: устойчивые / поверхностные / изоляция / токсичные / зависимые.
Семья: поддерживающая / дисфункциональная / насилие (тип: _______).
Интернет: нормативное / проблемное (___ ч/сут) / кибербуллинг (жертва / агрессор).

КОГНИТИВНЫЕ ФУНКЦИИ
Интеллект: высокий / нормативный / сниженный.
Запас знаний: соответствует образованию / снижен.
Внимание: концентрация сохранена / снижена.
Память: не нарушена / нарушена (тип: _______).
Исполнительные функции: сохранены / нарушены (планирование / контроль импульсов / переключаемость).
Критика к окружающему: сохранена / снижена. Самокритика: сохранена / снижена / отсутствует.

ЗАКЛЮЧЕНИЕ:
Психиатрической симптоматики, требующей неотложного вмешательства, на момент осмотра не выявлено.
Личностное развитие в рамках возрастной нормы.
Ведущий психопатологический синдром: не выявлен / выявлен (описать: _______).
Диагностическая рубрика МКБ-10: не требуется / F___ (___).`,
  "Д": `ПСИХИАТРИЧЕСКИЙ СТАТУС (взрослый мужчина, 18+ лет)

ВНЕШНИЙ ВИД И ПОВЕДЕНИЕ
Внешний вид соответствует возрасту / моложе / старше лет. Ухожен / неопрятен / пренебрежение гигиеной.
Одежда: соответствует ситуации / причудлива / небрежна / украшения уместны / неуместны.
Манера держаться: адекватная / вычурная / небрежная.
Двигательная сфера: нормокинезия / гиперкинезия / гипокинезия / акатизия / стереотипии / тремор / тики / навязчивые движения.
Мимика: живая, выразительная / амимия / гипомимия / паратимия (несоответствие мимики речи).
Жестикуляция: адекватная / обеднённая / избыточная / манерная.
Особые признаки: ритуализированные действия / «симптом зеркала» / бормотание / гортанное покашливание / ритуализированная маркировка тела.
Поведение: упорядоченное / хаотичное / ритуализированное / импульсивное / напряжённое.

СОЗНАНИЕ И ОРИЕНТИРОВКА
Сознание: ясное / помрачённое (тип: оглушение / сумеречное / онейроидное / аментивное).
Аллопсихическая ориентировка (место, время, ситуация, окружающие): полная / нарушена (_______).
Аутопсихическая ориентировка (собственная личность): полная / нарушена (_______).
Мнестическая дезориентировка: нет / есть.

КОНТАКТ И КОММУНИКАЦИЯ
В контакт вступает: легко / настороженно / формально / избирательно / отказывается.
Характер: инициативный / вежливый / замкнутый / недоверчивый / скрытный / грубый / мстительный / злопамятный.
Открытость: достаточная / диссимуляция (скрывает) / аггравация (преувеличивает).
Отношение к осмотру: спокойное / тревожное / враждебное / безразличное / подозрительное.
Витальный модус: астении нет / астения умеренная / выраженная.

РЕЧЬ
Темп: нормальный / тахилалия / брадилалия. Ритм: плавный / прерывистый / заикание.
Громкость: нормальная / тихая / громкая.
Артикуляция: чёткая / смазанная / скандированная / спотыкание / афазия (тип: _______).
Продуктивность: достаточная / многословная / малопродуктивная / мутизм.
Форма: логичная / с соскальзываниями / разорванная (шизофазия) / вязкая / обстоятельная / резонёрская / символическая / инкогерентная.
Грамматический строй: правильный / аграмматизмы / неологизмы / вычурность / склонность к лишним словам.
Персеверации: нет / есть. Эхолалии: нет / есть.

ВОСПРИЯТИЕ
Адекватность: сохранена / нарушена.
Иллюзии: нет / зрительные / слуховые / аффективные.
Галлюцинации истинные (во внешнем пространстве):
— слуховые: нет / комментирующие / императивные (команды: _______) / диалог / оклики / элементарные;
— зрительные: нет / простые / сложные (сценические);
— обонятельные / вкусовые / тактильные / висцеральные: нет / есть.
Псевдогаллюцинации (внутри): нет / есть (тип: _______).
Синдром Кандинского–Клерамбо: не выявлен / выявлен (идеаторный: вложение / изъятие / «открытость» / ментизм; сенсорный: сделанные ощущения; моторный: сделанные действия; бред воздействия: _______).
Деперсонализация: нет / соматическая / психическая / аутопсихическая.
Дереализация: нет / есть. Метаморфопсии: нет / есть.
Сенестопатии: нет / есть (локализация: _______, характер: _______, мучительность: _______, связь со временем суток / позой / нагрузкой / тревогой; эффект анальгетиков: есть / нет; эффект седативных: есть / нет).
Сфера соматопсихики: сенесталгии нет / есть; соматодеперсонализация: нет / есть.

МЫШЛЕНИЕ
Темп: нормальный / ускорен (скачка идей) / замедлен / шперрунг (остановка) / ментизм (наплыв).
Последовательность: сохранена / разорвана / соскальзывания / вязкость / обстоятельность / инкогерентная.
Целенаправленность: сохранена / нарушена. Уровень обобщений: высокий / нормативный / конкретный / снижен.
Критичность: полная / частичная / отсутствует.
Патологические феномены: автоматизмы — нет / есть; раздвоение / разноплановость — нет / есть; отчуждение мыслей («чужие») — нет / есть; персеверативность — нет / есть.
Навязчивые мысли: нет / есть (содержание: агрессивные / контаминационные / сексуальные / религиозные / симметрии / иные: _______).
Компульсии: нет / есть (тип: проверки / счёт / мытьё / упорядочивание / иные; ч/сут: ___).
Сверхценные идеи: нет / ревности / ипохондрические / дисморфофобические / реформаторства / сутяжничества.
Бредовые идеи: не выявлены / выявлены:
— первичный: бредовое восприятие / осознание / воспоминание;
— вторичный: интерпретативный / аффективный / галлюцинаторный;
— содержание: преследования / воздействия / величия / ипохондрический / нигилистический (Котара) / ревности / реформаторства;
— структура: систематизированный / несистематизированный / фрагментарный;
— критика: полная / частичная / отсутствует.
Суицидальность: пассивные мысли / активные без плана / с планом (_______) / намерение / попытки (дата: ___, метод: ___, госпитализация: да/нет).
Шкала Колумбия C-SSRS: нет / низкий / умеренный / высокий риск.

ЭМОЦИОНАЛЬНО-АФФЕКТИВНАЯ СФЕРА
Преобладающее настроение: ровное / тоскливое / тревожное / напряжённое / угрюмое / весёлое / гневное / раздражительное.
Динамика: устойчивое / лабильное / с вспышками / слабодушие.
Возбудимость: нормальная / повышена (раздражительность, обидчивость, пугливость, плаксивость) / понижена (вялость, холодность, тупость).
Выразительность: нормальная / уплощена (тупость) / неадекватна / лабильна.
Аффекты злобы, гнева, тоски, страха: не отмечаются / отмечаются (характер, сила, длительность: _______).
Физиологические проявления аффекта: вазомоторные / двигательные — описать: _______.
Маниакальный вираж в анамнезе: нет / есть (_______).
Депрессивная триада: нет / частичная / полная.
Ангедония: нет / есть (_______). Аутоагрессия: нет / есть.
Маниакальные/гипоманиакальные симптомы: нет / повышенный аффект / снижение сна / ускоренная речь / грандиозность / рискованное поведение / гиперсексуальность.
Тревожные расстройства: нет / ГТР / социофобия / паническое расстройство (частота: ___, симптомы: ___) / агорафобия / ПТСР (травма: _______, флэшбэки / гипербдительность / избегание).

ВОЛЕВАЯ СФЕРА И ВЛЕЧЕНИЯ
Волевая активность: нормативная / абулия / гипобулия / гипербулия.
Целенаправленность: сохранена / нарушена. Импульсивность: нет / умеренная / выраженная.
Инстинкты и влечения:
— пищевое: не нарушено / анорексия / булимия / BED / орторексия;
— самосохранения: сохранено / нарушено (аутоагрессия / суицидальность);
— сексуальное: нормативное / гипер- / гипосексуальность.
Патологические влечения: дромомания / клептомания / пиромания / игровая зависимость — нет / есть.
ПАВ: нет / алкоголь (стаж: ___, количество: ___, последнее: ___, синдром отмены: да/нет) / опиоиды / стимуляторы / каннабис / смешанное.

ИНТЕЛЛЕКТ И КОГНИТИВНЫЕ ФУНКЦИИ
Уровень (клинически): высокий / нормативный / сниженный / умственная отсталость (лёгкая / умеренная / тяжёлая).
Запас знаний: соответствует образованию / снижен / диссоциирован.
Способность к обобщению, суждению, умозаключениям: сохранена / нарушена.
Понимание переносного смысла (пословицы): доступно / формальное / недоступно.
Абстрагирование: сохранено / нарушено.
Внимание: концентрация — сохранена / снижена; переключаемость — нормальная / затруднена; отвлекаемость — нет / есть.
Память: запоминание — нормальное / снижено; ретенция — сохранена / нарушена; репродукция — точная / неточная.
Ретроградная амнезия: нет / есть (_______). Антероградная амнезия: нет / есть.
Фиксационная амнезия: нет / есть.
Парамнезии: псевдореминисценции / конфабуляции / криптомнезии — нет / есть (тип: _______).
Исполнительные функции: сохранены / нарушены (планирование / гибкость / торможение импульсов).
Критика к окружающему: сохранена / снижена.
Самокритика: полная / неполная / формальная / отсутствует.
Такт, этика, социальные нормы: соблюдает / нарушает.
Степень осознания болезни: полная / неполная / формальная / отсутствует.

САМОСОЗНАНИЕ И ЛИЧНОСТЬ
Самооценка: адекватная / завышена / занижена / нестабильная / переоценка личности.
Стеничность: активный, решительный / пассивный, неуверенный / тревожный, с чувством неполноценности.
Общительность: общительный / избирательно / замкнутый / недоверчивый / скрытный / злобный.
Преморбидные черты личности: _______
Признаки расстройства личности: нет / есть (кластер A / B / C; предварительно: _______).
Уровень организации личности (Кернберг): нормальный / невротический / пограничный / психотический.
Защитные механизмы: зрелые (сублимация, юмор, альтруизм, интеллектуализация) / примитивные (расщепление, проекция, отрицание, диссоциация, идеализация / обесценивание).
Гендерная идентичность: соответствует полу / дисфория.
Временная перспектива: сохранена / нарушена.

СОЦИАЛЬНОЕ ФУНКЦИОНИРОВАНИЕ
Трудоспособность: сохранена / снижена / нетрудоспособен.
Социальные связи: нормативные / ограниченные / изоляция.
Партнёрские отношения: стабильные / конфликтные / нет / зависимые / токсичные.
Семья: стабильная / дисфункциональная / насилие (тип: _______).

ВЕДУЩИЙ ПСИХОПАТОЛОГИЧЕСКИЙ СИНДРОМ
Позитивные: не выявлен / галлюцинаторный / галлюцинаторно-параноидный / параноидный / парафренный / депрессивный / маниакальный / тревожно-депрессивный / ОКР / астено-невротический / психопатоподобный / делириозный / онейроидный / иной (_______).
Негативные: не выявлен / эмоционально-волевое уплощение / когнитивный дефект / социальная аутизация / иной (_______).

ЗАКЛЮЧЕНИЕ:
Психиатрической симптоматики, требующей неотложного вмешательства, на момент осмотра не выявлено.
Психическое состояние в пределах нормы.
Личностная организация нормального / невротического уровня.
Ведущий психопатологический синдром: не выявлен / выявлен (описать: _______).
Диагностическая рубрика МКБ-10: не требуется / F___ (___).`
};
const PROJ_TEMPLATES = {
  proj_person: `Рисунок человека (Гудинаф–Харрис): выполнен / отказ.
Уровень детализации: нормативный / обеднённый / избыточный.
Пропорции: соблюдены / нарушены.
Характер линий: уверенные / тревожные (штриховка) / слабые (неуверенность) / давящие (агрессия).
Особенности: акцент на голове / руках / ногах / отсутствие частей (_______) / сокрытие рук / детализация одежды.
Признаки: тревоги / агрессии / зависимости / депрессии / без признаков неблагополучия.
Интерпретация: _______`,
  proj_htp: `Тест HTP (House-Tree-Person): выполнен / отказ.
Дом: нормативный / маленький (тревога) / большой. Окна: есть / нет (закрытость). Дверь: есть / нет. Забор: есть (защита) / нет.
Дерево: корни есть (связь с реальностью) / нет. Крона: густая / редкая / сломана (травма). Ветви: вверх / вниз.
Человек: лицо прорисовано / нет. Руки: открыты / за спиной / нет. Размер: нормативный / маленький / большой.
Общее: нормативный / тревожный / агрессивный / депрессивный / регрессивный.
Интерпретация: _______`,
  proj_family: `Рисунок семьи (КРС, Бернс и Кауфман): выполнен / отказ.
Состав: совпадает с реальным / не совпадает (отсутствует: _______; добавлен: _______).
Пациент: рядом с матерью / отцом / между родителями / в стороне / вне семьи.
Размеры: отец больше / мать больше / пациент маленький / все равны.
Взаимодействие: держатся за руки / рядом / далеко / спиной / нет контакта.
Детализация: одни фигуры тщательнее (_______). Штриховка/зачёркивание: нет / есть (кого: _______).
Эмоциональная атмосфера: тёплая / нейтральная / напряжённая / тревожная / враждебная.
Признаки семейного конфликта: нет / есть.
Интерпретация: _______`,
  proj_animal: `Несуществующее животное (Дукаревич): выполнен / отказ.
Размер: нормативный / маленький (тревога, неуверенность) / большой (доминантность, агрессия).
Расположение: центр / верхний край (высокие притязания) / нижний (депрессия) / левый (интроверсия) / правый (экстраверсия).
Название: нейтральное / позитивное / агрессивное (содержит «зубы»/«удар»/«смерть») / бессмысленное (дезорганизация).
Защитные элементы (шипы, панцирь, когти): нет / есть (тревога / агрессия).
Органы питания (рот, зубы): не акцентированы / акцентированы (оральная зависимость / агрессия).
Органы чувств: детальные / схематичные / отсутствуют.
Хвост: вверх (уверенность) / вниз (депрессия) / нет.
Интерпретация: _______`,
  proj_free: `Свободный рисунок: выполнен / отказ.
Тема: самостоятельно / при подсказке / отказ.
Содержание: пейзаж / человек / животное / техника / абстракция / агрессивный / депрессивный / нейтральный / регрессивный.
Цветовая гамма: тёплая / холодная / тёмная (депрессия) / яркая / монохромная.
Характер: динамичный / статичный.
Нажим: нормальный / слабый (астения) / сильный (агрессия, напряжение).
Интерпретация: _______`
};
const PSYCH_CONCLUSION_TEMPLATE = `ИТОГОВЫЕ ХАРАКТЕРИСТИКИ

Нейропсихологический уровень декомпенсации:
нет / на уровне: кора / подкорка / ствол / промежуточный мозг (таламус) / средний мозг (четверохолмие / амигдала).

Ведущий нейропсихологический фактор:
не выявлен / кинетический / кинестетический / пространственный / энергетический / модально-специфический / регуляторный.

Нейропсихологический синдром: не выявлен / выявлен (описать: _______).

Патопсихологический симптомокомплекс:
не выявлен / астенический / неврастенический / депрессивный / аффективно-возбудимый / паранойяльный / психопатоподобный / личностно-аномальный / психотический / олигофреноподобный.

Акцентуация характера (по Личко):
не выявлена / гипертимная / циклоидная / лабильная / астено-невротическая / сензитивная / психастеническая / шизоидная / эпилептоидная / истероидная / неустойчивая / конформная / смешанная (_______).

Уровень организации личности (по Кернбергу):
нормальный / невротический / пограничный / психотический.

Защитные механизмы:
зрелые (сублимация, юмор, альтруизм, интеллектуализация) / примитивные (расщепление, проекция, отрицание, диссоциация, идеализация / обесценивание, реактивное образование).

Диагностическая рубрика МКБ-10 (предварительно):
не требуется /
F0 — органические расстройства /
F1 — вследствие ПАВ /
F2 — шизофрения, бредовые /
F3 — аффективные /
F4 — невротические, соматоформные /
F5 — поведенческие физиологические /
F6 — расстройства личности /
F7 — умственная отсталость /
F8 — нарушения развития /
F9 — детские поведенческие /
G40 — эпилепсия / пароксизмальные.

Рекомендации по результатам:
не требуются / консультация психиатра / психотерапия (КПТ / психодинамическая / семейная / ДПДГ / иная: _______) / нейропсихологическая коррекция / медикаментозная коррекция / наблюдение в динамике.`;
function CollapsibleBlock({
  title,
  filled,
  defaultOpen = false,
  children,
  preview,
  actions
}) {
  const [open, setOpen] = useState(defaultOpen);
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-card", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 px-3 py-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium flex items-center gap-2", children: [
          title,
          filled && /* @__PURE__ */ jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-green-500" })
        ] }),
        !open && preview && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate mt-0.5", children: preview })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [
        open && actions,
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            size: "sm",
            variant: "ghost",
            className: "h-7 px-2 text-xs gap-1",
            onClick: () => setOpen((v) => !v),
            children: open ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(ChevronUp, { className: "h-3 w-3" }),
              " Свернуть"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(ChevronDown, { className: "h-3 w-3" }),
              " Развернуть"
            ] })
          }
        )
      ] })
    ] }),
    open && /* @__PURE__ */ jsx("div", { className: "px-3 pb-3 space-y-3", children })
  ] });
}
function AutoTextarea({
  value,
  onChange,
  minHeight = 250,
  placeholder
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.max(minHeight, ref.current.scrollHeight) + "px";
    }
  }, [value, minHeight]);
  return /* @__PURE__ */ jsx(
    Textarea,
    {
      ref,
      value: value || "",
      onChange: (e) => onChange(e.target.value),
      placeholder,
      className: "font-mono text-xs leading-relaxed",
      style: { minHeight }
    }
  );
}
function PsychStatusSection({ value, onChange, birthDate }) {
  const detectedGroup = useMemo(() => ageToGroup(calcAgeYears(birthDate)), [birthDate]);
  const group = value.psych_age_group || detectedGroup;
  useEffect(() => {
    if (!value.psych_age_group && detectedGroup) {
      onChange({ psych_age_group: detectedGroup });
    }
  }, [detectedGroup]);
  const psychFilled = !!(value.psych_status_full && value.psych_status_full.trim());
  const projFilled = !!(value.proj_person || value.proj_htp || value.proj_family || value.proj_animal || value.proj_free);
  const conclusionFilled = !!(value.psych_conclusion && value.psych_conclusion.trim());
  const projPreview = [value.proj_person, value.proj_htp, value.proj_family, value.proj_animal, value.proj_free].filter((s) => s && s.trim()).map((s) => (s || "").split("\n")[0]).slice(0, 1).join(" / ");
  const fillAllProj = () => {
    onChange({
      proj_person: value.proj_person || PROJ_TEMPLATES.proj_person,
      proj_htp: value.proj_htp || PROJ_TEMPLATES.proj_htp,
      proj_family: value.proj_family || PROJ_TEMPLATES.proj_family,
      proj_animal: value.proj_animal || PROJ_TEMPLATES.proj_animal,
      proj_free: value.proj_free || PROJ_TEMPLATES.proj_free
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs(
      CollapsibleBlock,
      {
        title: "Психиатрический статус",
        filled: psychFilled,
        preview: psychFilled ? (value.psych_status_full || "").split("\n").filter((l) => l.trim()).slice(0, 2).join(" / ") : "",
        actions: /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              size: "sm",
              variant: "outline",
              className: "h-7 px-2 text-xs gap-1",
              onClick: () => onChange({ psych_status_full: PSYCH_TEMPLATES[group] }),
              children: [
                /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3" }),
                " Шаблон"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              size: "sm",
              variant: "ghost",
              className: "h-7 px-2 text-xs gap-1",
              disabled: !psychFilled,
              onClick: () => onChange({ psych_status_full: "" }),
              children: [
                /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }),
                " Сброс"
              ]
            }
          )
        ] }),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs(Label, { className: "text-xs", children: [
              "Возрастная группа",
              birthDate ? ` (авто: ${detectedGroup})` : ""
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: AGE_GROUP_OPTIONS.map((opt) => /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                size: "sm",
                variant: group === opt.value ? "default" : "outline",
                className: "h-7 text-xs",
                onClick: () => onChange({ psych_age_group: opt.value }),
                children: opt.label
              },
              opt.value
            )) })
          ] }),
          /* @__PURE__ */ jsx(
            AutoTextarea,
            {
              value: value.psych_status_full,
              onChange: (v) => onChange({ psych_status_full: v }),
              minHeight: 400,
              placeholder: "Опишите психиатрический статус или нажмите «Шаблон»"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      CollapsibleBlock,
      {
        title: "Проективное тестирование",
        filled: projFilled,
        preview: projPreview,
        actions: /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            size: "sm",
            variant: "outline",
            className: "h-7 px-2 text-xs gap-1",
            onClick: fillAllProj,
            children: [
              /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3" }),
              " Все тесты"
            ]
          }
        ),
        children: [
          ["proj_person", "Рисунок человека"],
          ["proj_htp", "Дом–Дерево–Человек"],
          ["proj_family", "Рисунок семьи"],
          ["proj_animal", "Несуществующее животное"],
          ["proj_free", "Свободный рисунок"]
        ].map(([key, label]) => {
          const v = value[key];
          return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs font-medium", children: label }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxs(
                  Button,
                  {
                    type: "button",
                    size: "sm",
                    variant: "ghost",
                    className: "h-6 px-2 text-xs gap-1",
                    onClick: () => onChange({ [key]: PROJ_TEMPLATES[key] }),
                    children: [
                      /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3" }),
                      " Шаблон"
                    ]
                  }
                ),
                v && /* @__PURE__ */ jsx(
                  Button,
                  {
                    type: "button",
                    size: "sm",
                    variant: "ghost",
                    className: "h-6 px-2 text-xs gap-1",
                    onClick: () => onChange({ [key]: "" }),
                    children: /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              AutoTextarea,
              {
                value: v,
                onChange: (nv) => onChange({ [key]: nv }),
                minHeight: 120,
                placeholder: `Описание (${label.toLowerCase()})`
              }
            )
          ] }, key);
        })
      }
    ),
    /* @__PURE__ */ jsx(
      CollapsibleBlock,
      {
        title: "Итоговые характеристики",
        filled: conclusionFilled,
        preview: conclusionFilled ? (value.psych_conclusion || "").split("\n").filter((l) => l.trim()).slice(0, 2).join(" / ") : "",
        actions: /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              size: "sm",
              variant: "outline",
              className: "h-7 px-2 text-xs gap-1",
              onClick: () => onChange({ psych_conclusion: PSYCH_CONCLUSION_TEMPLATE }),
              children: [
                /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3" }),
                " Шаблон"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              size: "sm",
              variant: "ghost",
              className: "h-7 px-2 text-xs gap-1",
              disabled: !conclusionFilled,
              onClick: () => onChange({ psych_conclusion: "" }),
              children: [
                /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }),
                " Сброс"
              ]
            }
          )
        ] }),
        children: /* @__PURE__ */ jsx(
          AutoTextarea,
          {
            value: value.psych_conclusion,
            onChange: (v) => onChange({ psych_conclusion: v }),
            minHeight: 250,
            placeholder: "Итоговые характеристики или нажмите «Шаблон»"
          }
        )
      }
    )
  ] });
}
function CollapsibleField({ hasValue, label, children, alwaysExpanded }) {
  const [expanded, setExpanded] = useState(false);
  const open = alwaysExpanded || hasValue || expanded;
  if (open) {
    return /* @__PURE__ */ jsx("div", { className: "space-y-1", children });
  }
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick: () => setExpanded(true),
      className: "group flex w-full items-center justify-between rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2 text-left text-sm text-muted-foreground transition hover:border-primary/50 hover:bg-muted/40 hover:text-foreground",
      children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5 opacity-60 group-hover:opacity-100" }),
          /* @__PURE__ */ jsx("span", { children: label })
        ] }),
        /* @__PURE__ */ jsx(ChevronDown, { className: "h-3.5 w-3.5 opacity-40 group-hover:opacity-80" })
      ]
    }
  );
}
const SCROTUM_DEFAULT = "Яичко в мошонке, положение правильное, размеры по возрасту, тургор достаточный, эластичность обычная, пальпация безболезненная. Придаток яичка: положение правильное, форма типичная, подвижность обычная, пальпация безболезненная, гидатиды не пальпируются, кист головки придатка нет.";
function PrimaryShortForm({ data, onChange, birthDate, patientId, currentVisitId }) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E;
  const importedFields = data.fields || {};
  if (!((_a = data.local_status) == null ? void 0 : _a.external_genitalia) && (importedFields["Локальный статус на момент осмотра"] || importedFields["Локальный статус"])) ;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx(
      ClinicalHistorySection,
      {
        data,
        onChange: (p) => onChange(p),
        rows: 4,
        patientId,
        currentVisitId
      }
    ),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Соматический статус" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(SomaticStatusSection, { data: data.somatic || {}, onChange: (p) => onChange({ somatic: { ...data.somatic || {}, ...p } }) }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Половая формула" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(SexualFormulaSection, { data: data.sexual_formula || {}, onChange: (p) => onChange({ sexual_formula: { ...data.sexual_formula || {}, ...p } }) }),
        /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.sexual_formula_text || "", onSet: (v) => onChange({ sexual_formula_text: v }), children: "Половая формула (текст)" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.sexual_formula_text || "", onChange: (e) => onChange({ sexual_formula_text: e.target.value }) })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Половая конституция" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(
        SexualConstitutionSection,
        {
          value: data.sexual_constitution,
          onChange: (v) => onChange({ sexual_constitution: v })
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Локальный статус" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(
            SmartFieldLabel,
            {
              fieldKey: "local_status",
              value: ((_b = data.local_status) == null ? void 0 : _b.external_genitalia) || "",
              onSet: (v) => onChange({ local_status: { ...data.local_status || {}, external_genitalia: v } }),
              children: "Наружные половые органы"
            }
          ),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              rows: 2,
              value: ((_c = data.local_status) == null ? void 0 : _c.external_genitalia) || "",
              onChange: (e) => onChange({ local_status: { ...data.local_status || {}, external_genitalia: e.target.value } })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Органы мошонки" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  size: "sm",
                  variant: "outline",
                  className: "h-7 px-2 text-xs gap-1",
                  onClick: () => onChange({
                    local_status: {
                      ...data.local_status || {},
                      scrotum_right: SCROTUM_DEFAULT,
                      scrotum_left: SCROTUM_DEFAULT
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3" }),
                    " Шаблон обе"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  size: "sm",
                  variant: "ghost",
                  className: "h-7 px-2 text-xs gap-1",
                  disabled: !((_d = data.local_status) == null ? void 0 : _d.scrotum_right) && !((_e = data.local_status) == null ? void 0 : _e.scrotum_left),
                  onClick: () => onChange({
                    local_status: {
                      ...data.local_status || {},
                      scrotum_right: "",
                      scrotum_left: ""
                    }
                  }),
                  children: [
                    /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }),
                    " Сброс"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-md border", children: /* @__PURE__ */ jsxs("table", { className: "w-full table-fixed border-collapse text-sm", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-muted/50", children: [
              /* @__PURE__ */ jsx("th", { className: "w-1/2 border-b border-r p-2 text-left font-medium", children: "Справа" }),
              /* @__PURE__ */ jsx("th", { className: "w-1/2 border-b p-2 text-left font-medium", children: "Слева" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "border-r p-0 align-top", children: /* @__PURE__ */ jsx(
                Textarea,
                {
                  rows: 6,
                  className: "min-h-[140px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
                  value: ((_f = data.local_status) == null ? void 0 : _f.scrotum_right) || "",
                  onChange: (e) => onChange({ local_status: { ...data.local_status || {}, scrotum_right: e.target.value } })
                }
              ) }),
              /* @__PURE__ */ jsx("td", { className: "p-0 align-top", children: /* @__PURE__ */ jsx(
                Textarea,
                {
                  rows: 6,
                  className: "min-h-[140px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
                  value: ((_g = data.local_status) == null ? void 0 : _g.scrotum_left) || "",
                  onChange: (e) => onChange({ local_status: { ...data.local_status || {}, scrotum_left: e.target.value } })
                }
              ) })
            ] }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-md border", children: /* @__PURE__ */ jsxs("table", { className: "w-full table-fixed border-collapse text-sm", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-muted/50", children: [
            /* @__PURE__ */ jsx("th", { className: "w-1/2 border-b border-r p-2 text-left font-medium", children: /* @__PURE__ */ jsx(
              SmartFieldLabel,
              {
                fieldKey: "local_status_right",
                value: ((_h = data.local_status) == null ? void 0 : _h.right) || "",
                onSet: (v) => onChange({ local_status: { ...data.local_status || {}, right: v } }),
                children: "Справа"
              }
            ) }),
            /* @__PURE__ */ jsx("th", { className: "w-1/2 border-b p-2 text-left font-medium", children: /* @__PURE__ */ jsx(
              SmartFieldLabel,
              {
                fieldKey: "local_status_left",
                value: ((_i = data.local_status) == null ? void 0 : _i.left) || "",
                onSet: (v) => onChange({ local_status: { ...data.local_status || {}, left: v } }),
                children: "Слева"
              }
            ) })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "border-r p-0 align-top", children: /* @__PURE__ */ jsx(
              Textarea,
              {
                rows: 6,
                className: "min-h-[140px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
                value: ((_j = data.local_status) == null ? void 0 : _j.right) || "",
                onChange: (e) => onChange({ local_status: { ...data.local_status || {}, right: e.target.value } })
              }
            ) }),
            /* @__PURE__ */ jsx("td", { className: "p-0 align-top", children: /* @__PURE__ */ jsx(
              Textarea,
              {
                rows: 6,
                className: "min-h-[140px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
                value: ((_k = data.local_status) == null ? void 0 : _k.left) || "",
                onChange: (e) => onChange({ local_status: { ...data.local_status || {}, left: e.target.value } })
              }
            ) })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(
              SmartFieldLabel,
              {
                fieldKey: "local_status_penis",
                value: ((_l = data.local_status) == null ? void 0 : _l.penis) || "",
                onSet: (v) => onChange({ local_status: { ...data.local_status || {}, penis: v } }),
                children: "Половой член"
              }
            ),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                rows: 3,
                value: ((_m = data.local_status) == null ? void 0 : _m.penis) || "",
                onChange: (e) => onChange({ local_status: { ...data.local_status || {}, penis: e.target.value } })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(
              SmartFieldLabel,
              {
                fieldKey: "local_status_perineum",
                value: ((_n = data.local_status) == null ? void 0 : _n.perineum) || "",
                onSet: (v) => onChange({ local_status: { ...data.local_status || {}, perineum: v } }),
                children: "Промежность"
              }
            ),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                rows: 3,
                value: ((_o = data.local_status) == null ? void 0 : _o.perineum) || "",
                onChange: (e) => onChange({ local_status: { ...data.local_status || {}, perineum: e.target.value } })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3 pt-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_scrotum", value: ((_p = data.local_status) == null ? void 0 : _p.scrotum) || "", onSet: (v) => onChange({ local_status: { ...data.local_status || {}, scrotum: v } }), children: "Мошонка" }),
            /* @__PURE__ */ jsx(Textarea, { rows: 2, value: ((_q = data.local_status) == null ? void 0 : _q.scrotum) || "", onChange: (e) => onChange({ local_status: { ...data.local_status || {}, scrotum: e.target.value } }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_epididymis", value: ((_r = data.local_status) == null ? void 0 : _r.epididymis) || "", onSet: (v) => onChange({ local_status: { ...data.local_status || {}, epididymis: v } }), children: "Придатки" }),
            /* @__PURE__ */ jsx(Textarea, { rows: 2, value: ((_s = data.local_status) == null ? void 0 : _s.epididymis) || "", onChange: (e) => onChange({ local_status: { ...data.local_status || {}, epididymis: e.target.value } }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_right_testis", value: ((_t = data.local_status) == null ? void 0 : _t.right_testis) || "", onSet: (v) => onChange({ local_status: { ...data.local_status || {}, right_testis: v } }), children: "Правое яичко" }),
            /* @__PURE__ */ jsx(Textarea, { rows: 2, value: ((_u = data.local_status) == null ? void 0 : _u.right_testis) || "", onChange: (e) => onChange({ local_status: { ...data.local_status || {}, right_testis: e.target.value } }) }),
            /* @__PURE__ */ jsx("input", { className: "mt-1 flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm", placeholder: "Объём, мл", value: ((_v = data.local_status) == null ? void 0 : _v.right_testis_volume) || "", onChange: (e) => onChange({ local_status: { ...data.local_status || {}, right_testis_volume: e.target.value } }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_left_testis", value: ((_w = data.local_status) == null ? void 0 : _w.left_testis) || "", onSet: (v) => onChange({ local_status: { ...data.local_status || {}, left_testis: v } }), children: "Левое яичко" }),
            /* @__PURE__ */ jsx(Textarea, { rows: 2, value: ((_x = data.local_status) == null ? void 0 : _x.left_testis) || "", onChange: (e) => onChange({ local_status: { ...data.local_status || {}, left_testis: e.target.value } }) }),
            /* @__PURE__ */ jsx("input", { className: "mt-1 flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm", placeholder: "Объём, мл", value: ((_y = data.local_status) == null ? void 0 : _y.left_testis_volume) || "", onChange: (e) => onChange({ local_status: { ...data.local_status || {}, left_testis_volume: e.target.value } }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_spermatic_cord", value: ((_z = data.local_status) == null ? void 0 : _z.spermatic_cord) || "", onSet: (v) => onChange({ local_status: { ...data.local_status || {}, spermatic_cord: v } }), children: "Семенные канатики" }),
            /* @__PURE__ */ jsx(Textarea, { rows: 2, value: ((_A = data.local_status) == null ? void 0 : _A.spermatic_cord) || "", onChange: (e) => onChange({ local_status: { ...data.local_status || {}, spermatic_cord: e.target.value } }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "local_status_inguinal_rings", value: ((_B = data.local_status) == null ? void 0 : _B.inguinal_rings) || "", onSet: (v) => onChange({ local_status: { ...data.local_status || {}, inguinal_rings: v } }), children: "Паховые кольца" }),
            /* @__PURE__ */ jsx(Textarea, { rows: 2, value: ((_C = data.local_status) == null ? void 0 : _C.inguinal_rings) || "", onChange: (e) => onChange({ local_status: { ...data.local_status || {}, inguinal_rings: e.target.value } }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1 md:col-span-2", children: [
            /* @__PURE__ */ jsx(SmartFieldLabel, { value: ((_D = data.local_status) == null ? void 0 : _D.notes) || "", onSet: (v) => onChange({ local_status: { ...data.local_status || {}, notes: v } }), children: "Дополнительно (локальный статус)" }),
            /* @__PURE__ */ jsx(Textarea, { rows: 2, value: ((_E = data.local_status) == null ? void 0 : _E.notes) || "", onChange: (e) => onChange({ local_status: { ...data.local_status || {}, notes: e.target.value } }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs(CollapsibleField, { hasValue: !!data.neuro_status, label: "Неврологический статус", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "neuro_status", value: data.neuro_status || "", onSet: (v) => onChange({ neuro_status: v }), children: "Неврологический статус" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.neuro_status || "", onChange: (e) => onChange({ neuro_status: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsx(OrthoStatusSection, { value: data.ortho_status, onChange: (v) => onChange({ ortho_status: v }) }) }),
      /* @__PURE__ */ jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsx(NeuroStatusSection, { value: data.neuro_status_full, onChange: (v) => onChange({ neuro_status_full: v }) }) }),
      /* @__PURE__ */ jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsx(PsychStatusSection, { value: data, onChange, birthDate }) }),
      /* @__PURE__ */ jsxs(CollapsibleField, { hasValue: !!data.psych_status, label: "Психологический статус", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "psych_status", value: data.psych_status || "", onSet: (v) => onChange({ psych_status: v }), children: "Психологический статус" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.psych_status || "", onChange: (e) => onChange({ psych_status: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs(CollapsibleField, { hasValue: !!data.working_diagnosis, label: "Рабочая формулировка диагноза", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.working_diagnosis || "", onSet: (v) => onChange({ working_diagnosis: v }), children: "Рабочая формулировка диагноза" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.working_diagnosis || "", onChange: (e) => onChange({ working_diagnosis: e.target.value }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "conclusion", children: "Заключение / Диагноз" }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          rows: 3,
          value: data.diagnosis ?? data.conclusion ?? "",
          onChange: (e) => onChange({ diagnosis: e.target.value, conclusion: e.target.value })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs(CollapsibleField, { hasValue: !!data.exam_plan, label: "План обследования", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.exam_plan || "", onSet: (v) => onChange({ exam_plan: v }), children: "План обследования" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.exam_plan || "", onChange: (e) => onChange({ exam_plan: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "recommendations", children: "Рекомендации" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.recommendations || "", onChange: (e) => onChange({ recommendations: e.target.value }) })
      ] })
    ] })
  ] });
}
function RepeatWithLabsForm({ data, onChange, patientId, currentVisitId }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx(
      ClinicalHistorySection,
      {
        data,
        onChange: (p) => onChange(p),
        rows: 4,
        patientId,
        currentVisitId
      }
    ),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Лабораторные данные" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.cbc || "", onSet: (v) => onChange({ cbc: v }), children: "Общий анализ крови" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.cbc || "", onChange: (e) => onChange({ cbc: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.urinalysis || "", onSet: (v) => onChange({ urinalysis: v }), children: "Общий анализ мочи" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.urinalysis || "", onChange: (e) => onChange({ urinalysis: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.biochem || "", onSet: (v) => onChange({ biochem: v }), children: "Биохимия крови" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.biochem || "", onChange: (e) => onChange({ biochem: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.hormones || "", onSet: (v) => onChange({ hormones: v }), children: "Гормональный профиль" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.hormones || "", onChange: (e) => onChange({ hormones: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.other_labs || "", onSet: (v) => onChange({ other_labs: v }), children: "Другие исследования" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.other_labs || "", onChange: (e) => onChange({ other_labs: e.target.value }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Локальный статус" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(LocalStatusAndrologySection, { data: data.local_status || {}, onChange: (p) => onChange({ local_status: { ...data.local_status || {}, ...p } }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "conclusion", children: "Заключение по обследованию" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.conclusion || "", onChange: (e) => onChange({ conclusion: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "recommendations", children: "Рекомендации" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.recommendations || "", onChange: (e) => onChange({ recommendations: e.target.value }) })
      ] })
    ] })
  ] });
}
function UziReproductiveForm({ data, onChange, patientId, currentVisitId }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx(ClinicalHistorySection, { data, onChange: (p) => onChange(p), rows: 3, patientId, currentVisitId }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.indications || "", onSet: (v) => onChange({ indications: v }), children: "Показания к исследованию" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.indications || "", onChange: (e) => onChange({ indications: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsx(UziReproductiveSection, { data: data.uzi || {}, onChange: (p) => onChange({ uzi: { ...data.uzi || {}, ...p } }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "recommendations", children: "Рекомендации" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 3, value: data.recommendations || "", onChange: (e) => onChange({ recommendations: e.target.value }) })
    ] })
  ] });
}
function UziUrinaryForm({ data, onChange, patientId, currentVisitId }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx(ClinicalHistorySection, { data, onChange: (p) => onChange(p), rows: 3, patientId, currentVisitId }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.indications || "", onSet: (v) => onChange({ indications: v }), children: "Показания к исследованию" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.indications || "", onChange: (e) => onChange({ indications: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsx(UziUrinarySection, { data: data.uzi || {}, onChange: (p) => onChange({ uzi: { ...data.uzi || {}, ...p } }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "recommendations", children: "Рекомендации" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 3, value: data.recommendations || "", onChange: (e) => onChange({ recommendations: e.target.value }) })
    ] })
  ] });
}
function UziBladderForm({ data, onChange }) {
  const printEnabled = data.print_enabled !== false;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsx(CardContent, { className: "pt-4 pb-3", children: /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
      /* @__PURE__ */ jsx(
        Checkbox,
        {
          checked: printEnabled,
          onCheckedChange: (v) => onChange({ print_enabled: v === true })
        }
      ),
      /* @__PURE__ */ jsxs("span", { className: "text-sm", children: [
        "Включить этот протокол в печатный бланк",
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground ml-1", children: "(можно отключить, чтобы сохранить данные без вывода на печать)" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.indications || "", onSet: (v) => onChange({ indications: v }), children: "Показания к исследованию" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 2, value: data.indications || "", onChange: (e) => onChange({ indications: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Аппарат / датчик" }),
      /* @__PURE__ */ jsx(Input, { value: data.device || "", onChange: (e) => onChange({ device: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Мочевой пузырь" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Объём до микции (мл)" }),
            /* @__PURE__ */ jsx(Input, { value: data.bladder_volume || "", onChange: (e) => onChange({ bladder_volume: e.target.value }), placeholder: "напр. 250" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Позыв на микцию" }),
            /* @__PURE__ */ jsx(Input, { value: data.micturition_urge || "", onChange: (e) => onChange({ micturition_urge: e.target.value }) })
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
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Остаточная моча (мл)" }),
            /* @__PURE__ */ jsx(Input, { value: data.residual_urine || "", onChange: (e) => onChange({ residual_urine: e.target.value }), placeholder: "напр. 15 мл" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Остаточная моча, %" }),
            /* @__PURE__ */ jsx(Input, { value: data.residual_urine_percent || "", onChange: (e) => onChange({ residual_urine_percent: e.target.value }), placeholder: "напр. 6%" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "conclusion", children: "Заключение" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.conclusion || "", onChange: (e) => onChange({ conclusion: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "recommendations", children: "Рекомендации" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.recommendations || "", onChange: (e) => onChange({ recommendations: e.target.value }) })
      ] })
    ] })
  ] });
}
function DynamicWithUziForm({ data, onChange, birthDate, patientId, currentVisitId }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx(
      ClinicalHistorySection,
      {
        data,
        onChange: (p) => onChange(p),
        rows: 4,
        patientId,
        currentVisitId
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.lab_results || "", onSet: (v) => onChange({ lab_results: v }), children: "Лабораторные данные" }),
      /* @__PURE__ */ jsx(Textarea, { rows: 3, value: data.lab_results || "", onChange: (e) => onChange({ lab_results: e.target.value }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Локальный статус" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(LocalStatusAndrologySection, { data: data.local_status || {}, onChange: (p) => onChange({ local_status: { ...data.local_status || {}, ...p } }) }) })
    ] }),
    /* @__PURE__ */ jsx(OrthoStatusSection, { value: data.ortho_status, onChange: (v) => onChange({ ortho_status: v }) }),
    /* @__PURE__ */ jsx(PsychStatusSection, { value: data, onChange, birthDate }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "УЗИ репродуктивной системы" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(UziReproductiveSection, { data: data.uzi || {}, onChange: (p) => onChange({ uzi: { ...data.uzi || {}, ...p } }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "conclusion", children: "Заключение" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.conclusion || "", onChange: (e) => onChange({ conclusion: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "recommendations", children: "Рекомендации" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.recommendations || "", onChange: (e) => onChange({ recommendations: e.target.value }) })
      ] })
    ] })
  ] });
}
function RepeatWithUziForm({ data, onChange, birthDate, patientId, currentVisitId }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx(ClinicalHistorySection, { data, onChange: (p) => onChange(p), rows: 4, patientId, currentVisitId }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Локальный статус" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(LocalStatusAndrologySection, { data: data.local_status || {}, onChange: (p) => onChange({ local_status: { ...data.local_status || {}, ...p } }) }) })
    ] }),
    /* @__PURE__ */ jsx(OrthoStatusSection, { value: data.ortho_status, onChange: (v) => onChange({ ortho_status: v }) }),
    /* @__PURE__ */ jsx(PsychStatusSection, { value: data, onChange, birthDate }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "УЗИ репродуктивной системы" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(UziReproductiveSection, { data: data.uzi || {}, onChange: (p) => onChange({ uzi: { ...data.uzi || {}, ...p } }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "conclusion", children: "Заключение / динамика" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.conclusion || "", onChange: (e) => onChange({ conclusion: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "recommendations", children: "Рекомендации" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 4, value: data.recommendations || "", onChange: (e) => onChange({ recommendations: e.target.value }) })
      ] })
    ] })
  ] });
}
function GenericFieldsForm({ data, onChange }) {
  const fields = data && typeof data.fields === "object" && data.fields || {};
  const keys = useMemo(() => Object.keys(fields), [fields]);
  const [newKey, setNewKey] = useState("");
  const setField = (k, v) => {
    onChange({ fields: { ...fields, [k]: v } });
  };
  const removeField = (k) => {
    const next = { ...fields };
    delete next[k];
    onChange({ fields: next });
  };
  const addField = () => {
    const k = newKey.trim();
    if (!k) return;
    if (fields[k] !== void 0) return;
    onChange({ fields: { ...fields, [k]: "" } });
    setNewKey("");
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    keys.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center", children: "Поля не заданы. Добавьте первое поле ниже." }),
    keys.map((k) => /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-sm", children: k }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            size: "sm",
            variant: "ghost",
            className: "h-7 px-2 text-xs text-destructive",
            onClick: () => removeField(k),
            children: [
              /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3 mr-1" }),
              " удалить"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          rows: 3,
          value: typeof fields[k] === "string" ? fields[k] : JSON.stringify(fields[k], null, 2),
          onChange: (e) => setField(k, e.target.value)
        }
      )
    ] }, k)),
    /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-2 pt-2 border-t", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Новое поле" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Например: Жалобы",
            value: newKey,
            onChange: (e) => setNewKey(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addField();
              }
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: addField, disabled: !newKey.trim(), children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
        " Добавить"
      ] })
    ] })
  ] });
}
const EXTERNAL_GENITALIA_DEFAULT = "Наружные половые органы развиты по мужскому типу, яички в мошонке, семенные канатики не изменены, область паховых колец не изменена, половой член развит по возрасту, уретра в типичном положении, меатус в типичном положении, крайняя плоть открывается, половое развитие соответствует возрасту.";
function OnlineConsultForm({ data, onChange, patientId, currentVisitId }) {
  const set = (k, v) => onChange({ [k]: v });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Сведения о консультации" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "grid md:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { children: "Канал связи" }),
          /* @__PURE__ */ jsxs(Select, { value: data.channel || "", onValueChange: (v) => set("channel", v), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Выберите канал" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "Zoom", children: "Zoom" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "WhatsApp", children: "WhatsApp (видео)" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "Telegram", children: "Telegram (видео)" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "MAX", children: "MAX" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "Чат / переписка", children: "Чат / переписка" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "Телефон", children: "Телефон" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "Другое", children: "Другое" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { children: "Длительность, мин" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              min: 0,
              value: data.duration_min ?? "",
              onChange: (e) => set("duration_min", e.target.value ? Number(e.target.value) : "")
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { children: "Повод обращения" }),
          /* @__PURE__ */ jsxs(Select, { value: data.reason || "", onValueChange: (v) => set("reason", v), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Выберите повод" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "Первичная онлайн-консультация", children: "Первичная онлайн-консультация" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "Второе мнение", children: "Второе мнение" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "Интерпретация анализов и исследований", children: "Интерпретация анализов и исследований" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "Послеоперационное наблюдение", children: "Послеоперационное наблюдение" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "Динамическое наблюдение", children: "Динамическое наблюдение" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "Другое", children: "Другое" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      ClinicalHistorySection,
      {
        data,
        onChange: (p) => onChange({ ...data, ...p }),
        rows: 4,
        patientId,
        currentVisitId
      }
    ),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Наличие очного осмотра профессора ранее" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs(
          RadioGroup,
          {
            value: data.prior_visit || "",
            onValueChange: (v) => set("prior_visit", v),
            className: "flex gap-6",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(RadioGroupItem, { value: "yes", id: "prior-yes" }),
                /* @__PURE__ */ jsx(Label, { htmlFor: "prior-yes", children: "Да" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(RadioGroupItem, { value: "no", id: "prior-no" }),
                /* @__PURE__ */ jsx(Label, { htmlFor: "prior-no", children: "Нет" })
              ] })
            ]
          }
        ),
        data.prior_visit === "yes" && /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Дата очного осмотра" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "date",
                value: data.prior_visit_date || "",
                onChange: (e) => set("prior_visit_date", e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Кратко об осмотре" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: data.prior_visit_note || "",
                onChange: (e) => set("prior_visit_note", e.target.value),
                placeholder: "Что было выполнено / выявлено"
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { value: data.current_state || "", onSet: (v) => set("current_state", v), children: "Настоящее состояние" }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          rows: 4,
          value: data.current_state || "",
          onChange: (e) => set("current_state", e.target.value)
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Состояние наружных половых органов" }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            size: "sm",
            variant: "outline",
            className: "h-7 px-2 text-xs gap-1",
            onClick: () => set("external_genitalia", EXTERNAL_GENITALIA_DEFAULT),
            children: [
              /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3" }),
              " Стандарт"
            ]
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              Checkbox,
              {
                id: "exam-photo",
                checked: !!data.external_exam_by_photo,
                onCheckedChange: (c) => set("external_exam_by_photo", c === true)
              }
            ),
            /* @__PURE__ */ jsx(Label, { htmlFor: "exam-photo", children: "Осмотр по фото" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              Checkbox,
              {
                id: "exam-video",
                checked: !!data.external_exam_by_video,
                onCheckedChange: (c) => set("external_exam_by_video", c === true)
              }
            ),
            /* @__PURE__ */ jsx(Label, { htmlFor: "exam-video", children: "Осмотр по видеосвязи" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 5,
            value: data.external_genitalia || "",
            onChange: (e) => set("external_genitalia", e.target.value),
            placeholder: "Описание состояния НПО — нажмите ⚡ Стандарт для вставки шаблона"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { children: "Интерпретация полученных анализов и исследований" }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          rows: 5,
          value: data.interpretation || "",
          onChange: (e) => set("interpretation", e.target.value)
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "conclusion", children: "Заключение" }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          rows: 4,
          value: data.conclusion || "",
          onChange: (e) => set("conclusion", e.target.value)
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { children: "План дообследования" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 4,
            value: data.exam_plan || "",
            onChange: (e) => set("exam_plan", e.target.value),
            placeholder: "Перечень исследований / анализов"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Необходимость очного осмотра" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs(
            RadioGroup,
            {
              value: data.in_person_needed || "",
              onValueChange: (v) => set("in_person_needed", v),
              className: "flex gap-6",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(RadioGroupItem, { value: "yes", id: "ip-yes" }),
                  /* @__PURE__ */ jsx(Label, { htmlFor: "ip-yes", children: "Требуется" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(RadioGroupItem, { value: "no", id: "ip-no" }),
                  /* @__PURE__ */ jsx(Label, { htmlFor: "ip-no", children: "Не требуется" })
                ] })
              ]
            }
          ),
          data.in_person_needed === "yes" && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Срочность" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: data.in_person_urgency || "",
                onValueChange: (v) => set("in_person_urgency", v),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Выберите срочность" }) }),
                  /* @__PURE__ */ jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "plan", children: "Планово (1–3 мес)" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "soon", children: "В ближайшее время (1–4 нед)" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "urgent", children: "Срочно (в течение недели)" })
                  ] })
                ]
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(SmartFieldLabel, { fieldKey: "recommendations", children: "Рекомендации" }),
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
const CATEGORY_LABELS = {
  обследование: "Обследование",
  медикамент: "Медикаменты",
  местное: "Местное лечение",
  режим: "Режим",
  контроль: "Контроль",
  направление: "Направления"
};
const CATEGORY_ORDER = ["обследование", "медикамент", "местное", "режим", "направление", "контроль"];
function DiagnosisRecommendationsPicker({ value, onApply }) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState("");
  const [subtype, setSubtype] = useState("");
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  const [referrals, setReferrals] = useState(/* @__PURE__ */ new Set());
  const { data: items = [] } = useQuery({
    queryKey: ["diagnosis_recommendations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("diagnosis_recommendations").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1e3
  });
  const { data: specialists = [] } = useQuery({
    queryKey: ["referral_specialists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("referral_specialists").select("*").eq("is_active", true).order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1e3
  });
  const groups = useMemo(
    () => Array.from(new Set(items.map((i) => i.diagnosis_group))).sort(),
    [items]
  );
  const subtypes = useMemo(
    () => Array.from(
      new Set(items.filter((i) => i.diagnosis_group === group).map((i) => i.subtype))
    ),
    [items, group]
  );
  const filtered = useMemo(
    () => items.filter((i) => i.diagnosis_group === group && i.subtype === subtype),
    [items, group, subtype]
  );
  const grouped = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const i of filtered) {
      if (!map.has(i.category)) map.set(i.category, []);
      map.get(i.category).push(i);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map.get(c)
    }));
  }, [filtered]);
  useEffect(() => {
    if (!subtype) return;
    const base = new Set(filtered.filter((i) => i.is_base).map((i) => i.id));
    setSelected(base);
    setReferrals(/* @__PURE__ */ new Set());
  }, [group, subtype, items.length]);
  useEffect(() => {
    setSubtype("");
    setSelected(/* @__PURE__ */ new Set());
  }, [group]);
  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleRef = (id) => {
    setReferrals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const totalChecked = selected.size + referrals.size;
  const apply = () => {
    if (totalChecked === 0) {
      toast({ title: "Ничего не выбрано" });
      return;
    }
    const lines = [];
    const header = `${group} (${subtype}):`;
    lines.push(header);
    for (const block2 of grouped) {
      const picked = block2.items.filter((i) => selected.has(i.id));
      if (picked.length === 0) continue;
      lines.push(`
${CATEGORY_LABELS[block2.category] || block2.category}:`);
      for (const it of picked) lines.push(`• ${it.item_text}`);
    }
    if (referrals.size > 0) {
      lines.push(`
Направления к специалистам:`);
      for (const s of specialists) {
        if (!referrals.has(s.id)) continue;
        const parts = [s.specialty, "—", s.doctor_name];
        if (s.phone) parts.push(`(${s.phone})`);
        lines.push(`• ${parts.join(" ")}`);
        if (s.contact_note) lines.push(`  ${s.contact_note}`);
      }
    }
    const block = lines.join("\n");
    const next = value && value.trim() ? `${value.trim()}

${block}` : block;
    onApply(next);
    toast({ title: `Добавлено пунктов: ${totalChecked}` });
    setOpen(false);
  };
  return /* @__PURE__ */ jsxs(Sheet, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", children: [
      /* @__PURE__ */ jsx(Stethoscope, { className: "h-4 w-4 mr-2" }),
      "Шаблоны по диагнозу"
    ] }) }),
    /* @__PURE__ */ jsxs(SheetContent, { side: "right", className: "w-full sm:max-w-xl flex flex-col", children: [
      /* @__PURE__ */ jsx(SheetHeader, { children: /* @__PURE__ */ jsx(SheetTitle, { children: "Рекомендации по диагнозу" }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 py-3", children: [
        /* @__PURE__ */ jsxs(Select, { value: group, onValueChange: setGroup, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Диагноз" }) }),
          /* @__PURE__ */ jsx(SelectContent, { className: "max-h-80", children: groups.map((g) => /* @__PURE__ */ jsx(SelectItem, { value: g, children: g }, g)) })
        ] }),
        /* @__PURE__ */ jsxs(Select, { value: subtype, onValueChange: setSubtype, disabled: !group, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Этап / подтип" }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: subtypes.map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, children: s }, s)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(ScrollArea, { className: "flex-1 pr-3 -mr-3", children: [
        !subtype && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground py-8 text-center", children: "Выберите диагноз и подтип" }),
        subtype && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          grouped.map((block) => /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase text-muted-foreground tracking-wide", children: CATEGORY_LABELS[block.category] || block.category }),
            block.items.map((it) => /* @__PURE__ */ jsxs(
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
                    it.item_text,
                    it.is_base && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-2 text-[10px] py-0 px-1.5 align-middle", children: "базовое" })
                  ] })
                ]
              },
              it.id
            ))
          ] }, block.category)),
          specialists.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 pt-2 border-t", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase text-muted-foreground tracking-wide", children: "Направления к специалистам" }),
            specialists.map((s) => /* @__PURE__ */ jsxs(
              "label",
              {
                className: "flex gap-2 items-start text-sm cursor-pointer rounded px-2 py-1.5 hover:bg-muted/50",
                children: [
                  /* @__PURE__ */ jsx(
                    Checkbox,
                    {
                      checked: referrals.has(s.id),
                      onCheckedChange: () => toggleRef(s.id),
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
            ))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(SheetFooter, { className: "pt-3 border-t", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full gap-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "Выбрано: ",
          totalChecked
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setOpen(false), children: "Отмена" }),
          /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", onClick: apply, disabled: totalChecked === 0, children: "Добавить в рекомендации" })
        ] })
      ] }) })
    ] })
  ] });
}
function ExtraUziMpsSection({ data, onChange }) {
  const enabled = (data == null ? void 0 : data.enabled) === true;
  const handleToggle = (v) => {
    if (v && !(data == null ? void 0 : data.device)) {
      onChange({ enabled: true, ...DEFAULT_UZI_REPRODUCTIVE });
    } else {
      onChange({ enabled: v });
    }
  };
  return /* @__PURE__ */ jsxs(Card, { className: "border-dashed border-2", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-2 cursor-pointer", children: [
      /* @__PURE__ */ jsx(
        Checkbox,
        {
          checked: enabled,
          onCheckedChange: (v) => handleToggle(v === true),
          className: "mt-1"
        }
      ),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "+ УЗДГ органов МПС (опционально к этому протоколу)" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Добавляет в текущий протокол полный блок ультразвукового исследования с доплерографией органов мочеполовой системы. Включается в печатный бланк только при установленной галочке." })
      ] })
    ] }) }),
    enabled ? /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(
      UziReproductiveSection,
      {
        data: data || {},
        onChange: (p) => onChange(p)
      }
    ) }) : null
  ] });
}
const REPRO = [
  { v: "", label: "не указан" },
  { v: "prepubertal", label: "препубертат" },
  { v: "pubertal", label: "пубертат" },
  { v: "reproductive", label: "репродуктивный" },
  { v: "pregnant", label: "беременность" },
  { v: "postmenopause", label: "постменопауза" }
];
const PHASES = [
  { v: "", label: "не выбрано", range: "" },
  { v: "follicular", label: "фолликулярная", range: "1–13 дн" },
  { v: "ovulatory", label: "овуляторная", range: "≈14 дн" },
  { v: "luteal", label: "лютеиновая", range: "15–28 дн" },
  { v: "postmenopause", label: "постменопауза", range: "" }
];
function phaseFromDay(day, cycleLen) {
  if (!Number.isFinite(day) || day < 1) return "";
  const ovulation = Math.max(11, cycleLen - 14);
  if (day <= ovulation - 2) return "follicular";
  if (day <= ovulation + 1) return "ovulatory";
  return "luteal";
}
function CycleContextSection({
  data,
  onChange
}) {
  var _a;
  const d = data || {};
  const mode = d.cycle_mode === "full" ? "full" : "simple";
  const derived = useMemo(() => {
    if (mode !== "full" || !d.last_period_date) return null;
    const start = new Date(d.last_period_date);
    if (isNaN(start.getTime())) return null;
    const cycleLen = Number(d.cycle_length) || 28;
    const dayNo = Math.floor((Date.now() - start.getTime()) / (24 * 3600 * 1e3)) + 1;
    const phase = phaseFromDay(dayNo, cycleLen);
    return { dayNo, phase };
  }, [mode, d.last_period_date, d.cycle_length]);
  const isPostmeno = d.repro_status === "postmenopause" || d.repro_status === "prepubertal" || d.repro_status === "pregnant";
  return /* @__PURE__ */ jsxs(Card, { className: "border-primary/30", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Контекст цикла" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: mode === "simple" ? "font-medium" : "text-muted-foreground", children: "упрощённый" }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              checked: mode === "full",
              onCheckedChange: (v) => onChange({ cycle_mode: v ? "full" : "simple" })
            }
          ),
          /* @__PURE__ */ jsx("span", { className: mode === "full" ? "font-medium" : "text-muted-foreground", children: "полный" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Женские фазозависимые показатели (E2, Прогестерон, ЛГ, ФСГ) интерпретируются только при указанной фазе — иначе показатель пропускается." })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Репродуктивный статус" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: d.repro_status || "__none__",
              onValueChange: (v) => {
                const val = v === "__none__" ? "" : v;
                onChange({ repro_status: val, ...val === "postmenopause" ? { cycle_phase: "postmenopause" } : {} });
              },
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "не указан" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: REPRO.map((r) => /* @__PURE__ */ jsx(SelectItem, { value: r.v || "__none__", children: r.label }, r.v || "none")) })
              ]
            }
          )
        ] }),
        !isPostmeno && mode === "simple" ? /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Фаза цикла (врач выбирает)" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: d.cycle_phase || "__none__",
              onValueChange: (v) => onChange({ cycle_phase: v === "__none__" ? "" : v }),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "не выбрано" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: PHASES.map((p) => /* @__PURE__ */ jsxs(SelectItem, { value: p.v || "__none__", children: [
                  p.label,
                  p.range ? ` · ${p.range}` : ""
                ] }, p.v || "none")) })
              ]
            }
          )
        ] }) : null
      ] }),
      !isPostmeno && mode === "full" ? /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Первый день последних mens" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "date",
              value: d.last_period_date || "",
              onChange: (e) => onChange({ last_period_date: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Длина цикла, дн" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              min: 20,
              max: 45,
              placeholder: "28",
              value: d.cycle_length ?? "",
              onChange: (e) => onChange({ cycle_length: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "День цикла (можно вручную)" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              min: 1,
              max: 45,
              placeholder: derived ? String(derived.dayNo) : "",
              value: d.cycle_day ?? "",
              onChange: (e) => onChange({ cycle_day: e.target.value })
            }
          )
        ] }),
        derived ? /* @__PURE__ */ jsxs("div", { className: "md:col-span-3 text-xs text-muted-foreground", children: [
          "Расчёт: день ",
          /* @__PURE__ */ jsx("b", { children: derived.dayNo }),
          " · фаза ",
          /* @__PURE__ */ jsx("b", { children: ((_a = PHASES.find((p) => p.v === derived.phase)) == null ? void 0 : _a.label) || "—" }),
          ".",
          " ",
          "Значение перекрывается ручным «Днём цикла» / «Фазой», если заданы."
        ] }) : null
      ] }) : null,
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Примечание" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: d.cycle_note || "",
            onChange: (e) => onChange({ cycle_note: e.target.value }),
            placeholder: "Напр.: ановуляторный цикл; КОК; ЗГТ и т.п."
          }
        )
      ] })
    ] })
  ] });
}
function AdditionalNotesField({ value, onChange }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
    /* @__PURE__ */ jsx(Label, { className: "text-sm font-medium", children: "Дополнительно" }),
    /* @__PURE__ */ jsx(
      Textarea,
      {
        rows: 4,
        value: value || "",
        onChange: (e) => onChange(e.target.value),
        placeholder: "Любые сведения, не подходящие под остальные поля протокола (нюансы визита, комментарии, договорённости и т. п.)"
      }
    )
  ] });
}
function ProtocolForm({ type, data, onChange, birthDate, patientSex, patientId, currentVisitId }) {
  const patch = (p) => onChange({ ...data || {}, ...p });
  const patchCycle = (p) => patch(p);
  const includeConsent = (data == null ? void 0 : data.include_consent) === true;
  const historyProps = { patientId, currentVisitId };
  const renderForm = () => {
    switch (type) {
      case "ultrashort":
        return /* @__PURE__ */ jsx(UltrashortForm, { data: data || {}, onChange: patch, ...historyProps });
      case "postop_day3":
        return /* @__PURE__ */ jsx(PostOpDay3Form, { data: data || {}, onChange: patch, ...historyProps });
      case "postop_day7":
        return /* @__PURE__ */ jsx(PostOpDay7Form, { data: data || {}, onChange: patch, ...historyProps });
      case "primary_short":
        return /* @__PURE__ */ jsx(PrimaryShortForm, { data: data || {}, onChange: patch, birthDate, ...historyProps });
      case "repeat_with_labs":
        return /* @__PURE__ */ jsx(RepeatWithLabsForm, { data: data || {}, onChange: patch, ...historyProps });
      case "uzi_reproductive":
        return /* @__PURE__ */ jsx(UziReproductiveForm, { data: data || {}, onChange: patch, ...historyProps });
      case "uzi_urinary":
        return /* @__PURE__ */ jsx(UziUrinaryForm, { data: data || {}, onChange: patch, ...historyProps });
      case "uzi_bladder":
        return /* @__PURE__ */ jsx(UziBladderForm, { data: data || {}, onChange: patch });
      case "dynamic_with_uzi":
        return /* @__PURE__ */ jsx(DynamicWithUziForm, { data: data || {}, onChange: patch, birthDate, ...historyProps });
      case "repeat_with_uzi":
        return /* @__PURE__ */ jsx(RepeatWithUziForm, { data: data || {}, onChange: patch, birthDate, ...historyProps });
      case "online_consult":
        return /* @__PURE__ */ jsx(OnlineConsultForm, { data: data || {}, onChange: patch, ...historyProps });
      case "peptide_program":
        return /* @__PURE__ */ jsx(PeptideProgramForm, { data: data || {}, onChange: patch, ...historyProps });
      default:
        return /* @__PURE__ */ jsx(GenericFieldsForm, { data: data || {}, onChange: patch });
    }
  };
  return /* @__PURE__ */ jsx(SmartTemplatesProvider, { protocolType: type, data, onChange: patch, children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "⚡ — вставить стандартный текст в поле. Все шаблоны редактируемы." }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsx(
          DiagnosisRecommendationsPicker,
          {
            value: (data == null ? void 0 : data.recommendations) || "",
            onApply: (next) => patch({ recommendations: next })
          }
        ),
        /* @__PURE__ */ jsx(FillStandardButton, {})
      ] })
    ] }),
    /* @__PURE__ */ jsx(OperationTemplateBanner, {}),
    patientSex === "F" ? /* @__PURE__ */ jsx(
      CycleContextSection,
      {
        data: {
          cycle_mode: data == null ? void 0 : data.cycle_mode,
          repro_status: data == null ? void 0 : data.repro_status,
          cycle_phase: data == null ? void 0 : data.cycle_phase,
          cycle_day: data == null ? void 0 : data.cycle_day,
          last_period_date: data == null ? void 0 : data.last_period_date,
          cycle_length: data == null ? void 0 : data.cycle_length,
          cycle_note: data == null ? void 0 : data.cycle_note
        },
        onChange: patchCycle
      }
    ) : null,
    renderForm(),
    !["uzi_reproductive", "uzi_urinary", "uzi_bladder", "dynamic_with_uzi", "repeat_with_uzi"].includes(type) ? /* @__PURE__ */ jsx(
      ExtraUziMpsSection,
      {
        data: data == null ? void 0 : data.extra_uzi_mps,
        onChange: (p) => patch({ extra_uzi_mps: { ...(data == null ? void 0 : data.extra_uzi_mps) || {}, ...p } })
      }
    ) : null,
    /* @__PURE__ */ jsx(
      AdditionalNotesField,
      {
        value: (data == null ? void 0 : data.additional_notes) || "",
        onChange: (v) => patch({ additional_notes: v })
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "rounded-md border border-dashed bg-muted/20 px-3 py-2", children: /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-2 cursor-pointer text-sm", children: [
      /* @__PURE__ */ jsx(
        Checkbox,
        {
          checked: includeConsent,
          onCheckedChange: (v) => patch({ include_consent: v === true }),
          className: "mt-0.5"
        }
      ),
      /* @__PURE__ */ jsxs("span", { children: [
        "Печатать блок «Информированное добровольное согласие» в конце бланка",
        /* @__PURE__ */ jsx("span", { className: "block text-xs text-muted-foreground mt-0.5", children: "По умолчанию не печатается. Включите, если для этого визита нужно приложить согласие к протоколу." })
      ] })
    ] }) })
  ] }) });
}
function IcdAutocomplete({ value, onChange, placeholder = "Найдите код МКБ-10..." }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      let q = supabase.from("icd10_codes").select("code, name_ru, category").order("code").limit(50);
      if (query.trim()) {
        const term = `%${query.trim()}%`;
        q = q.or(`code.ilike.${term},name_ru.ilike.${term}`);
      }
      const { data } = await q;
      if (!cancelled) {
        setItems(data || []);
        setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", role: "combobox", "aria-expanded": open, className: "w-full justify-between font-normal", children: [
      /* @__PURE__ */ jsx("span", { className: cn("truncate", !value && "text-muted-foreground"), children: value || placeholder }),
      /* @__PURE__ */ jsx(ChevronsUpDown, { className: "h-4 w-4 opacity-50 ml-2 flex-shrink-0" })
    ] }) }),
    /* @__PURE__ */ jsx(PopoverContent, { className: "w-[--radix-popover-trigger-width] p-0", align: "start", children: /* @__PURE__ */ jsxs(Command, { shouldFilter: false, children: [
      /* @__PURE__ */ jsx(CommandInput, { placeholder: "Код или название...", value: query, onValueChange: setQuery }),
      /* @__PURE__ */ jsxs(CommandList, { children: [
        loading && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center p-4", children: /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) }),
        !loading && items.length === 0 && /* @__PURE__ */ jsx(CommandEmpty, { children: "Ничего не найдено" }),
        /* @__PURE__ */ jsx(CommandGroup, { children: items.map((it) => /* @__PURE__ */ jsxs(
          CommandItem,
          {
            value: it.code,
            onSelect: () => {
              onChange(it.code, it.name_ru);
              setOpen(false);
            },
            children: [
              /* @__PURE__ */ jsx(Check, { className: cn("mr-2 h-4 w-4", value === it.code ? "opacity-100" : "opacity-0") }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("div", { className: "font-mono text-xs font-semibold", children: it.code }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate", children: it.name_ru })
              ] })
            ]
          },
          it.code
        )) })
      ] })
    ] }) })
  ] });
}
function AiReasoningField({ value, onChange }) {
  const [open, setOpen] = useState(!!value);
  return /* @__PURE__ */ jsxs(Card, { className: "border-dashed border-amber-300/60 dark:border-amber-700/40 bg-amber-50/30 dark:bg-amber-950/10", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Brain, { className: "h-4 w-4 text-amber-600" }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setOpen((p) => !p),
          className: "flex items-center gap-1 hover:underline",
          children: [
            open ? /* @__PURE__ */ jsx(ChevronDown, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "h-3 w-3" }),
            "Рассуждения ИИ (служебное поле)"
          ]
        }
      ),
      /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-normal text-muted-foreground inline-flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(EyeOff, { className: "h-3 w-3" }),
        " не печатается"
      ] }),
      value && !open && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-amber-700 dark:text-amber-400", children: [
        "· ",
        value.length,
        " симв."
      ] })
    ] }) }),
    open && /* @__PURE__ */ jsxs(CardContent, { className: "pt-0", children: [
      /* @__PURE__ */ jsx(
        Textarea,
        {
          value: value || "",
          onChange: (e) => onChange(e.target.value),
          rows: 5,
          placeholder: "Сюда можно вставлять фрагменты рассуждений ИИ — они сохранятся в протоколе, но никогда не выйдут на печать.",
          className: "text-sm font-mono bg-background/60"
        }
      ),
      value && /* @__PURE__ */ jsx("div", { className: "flex justify-end mt-2", children: /* @__PURE__ */ jsx(
        Button,
        {
          type: "button",
          size: "sm",
          variant: "ghost",
          className: "text-xs h-7 text-destructive",
          onClick: () => {
            if (confirm("Очистить служебное поле?")) onChange("");
          },
          children: "Очистить"
        }
      ) })
    ] })
  ] });
}
const NON_RX_PATTERNS = [
  /бад\b/i,
  /добавк/i,
  /пептид/i,
  /процедур/i,
  /физиотерап/i,
  /массаж/i,
  /магнит/i,
  /узт\b/i,
  /электрофорез/i,
  /дарсонвал/i,
  /лазер/i,
  /ванн/i,
  /душ\b/i,
  /грязе/i,
  /диет/i,
  /режим/i,
  /пища/i,
  /гомеопат/i,
  /консультац/i,
  /осмотр/i,
  /контроль/i
];
function isRxLine(s) {
  const txt = s.trim();
  if (!txt) return false;
  return !NON_RX_PATTERNS.some((re) => re.test(txt));
}
function parseLineToRx(line) {
  const t = line.trim().replace(/^[•\-\d.\)\s]+/, "");
  const m = t.match(/^([A-Za-zА-Яа-яЁё\-\s]+?)(?:\s+(\d|\(|по\s)|,|$)/);
  const name = ((m == null ? void 0 : m[1]) || t).trim();
  return {
    medication_ru_name: name,
    medication_latin_name: name,
    dosage_form: "",
    dose: "",
    quantity: 1,
    frequency: "",
    duration: "",
    signa: t.length > name.length ? t.slice(name.length).trim().replace(/^,?\s*/, "") : null
  };
}
function WriteRxFromAssignments({ treatments, patientId, patientName }) {
  const [open, setOpen] = useState(false);
  const candidates = useMemo(() => treatments.filter(isRxLine), [treatments]);
  const [selected, setSelected] = useState({});
  const openDialog = () => {
    if (candidates.length === 0) {
      toast$1.info("В назначениях нет препаратов в аптечной форме", {
        description: "БАДы, пептиды, физиотерапия и режим выписке на бланке не подлежат."
      });
      return;
    }
    const init = {};
    candidates.forEach((_, i) => init[i] = true);
    setSelected(init);
    setOpen(true);
  };
  const confirm2 = () => {
    const picked = candidates.filter((_, i) => selected[i]);
    if (picked.length === 0) {
      toast$1.error("Не выбрано ни одного препарата");
      return;
    }
    const items = picked.map(parseLineToRx);
    pushPendingRxItems(items, patientId ?? void 0);
    setOpen(false);
    const url = `/admin/prescriptions${patientId ? `?patientId=${patientId}` : ""}`;
    window.open(url, "_blank", "noopener");
    toast$1.success(
      `${items.length} бланк(ов) отправлено в выписку${patientName ? ` — ${patientName}` : ""}`,
      { description: "Откройте вкладку «Рецепты», уточните дозы и печатайте." }
    );
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: openDialog, children: [
      /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4 mr-2" }),
      "Выписать рецепты",
      candidates.length > 0 ? ` (${candidates.length})` : ""
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Выписать рецепты на препараты" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Отметьте препараты, на которые нужно сформировать бланки 107-1/у. Дозу, кратность и длительность можно будет уточнить в форме рецепта." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "max-h-[50vh] overflow-y-auto border rounded p-3 space-y-2", children: candidates.map((t, i) => /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded", children: [
        /* @__PURE__ */ jsx(
          Checkbox,
          {
            checked: !!selected[i],
            onCheckedChange: (v) => setSelected((p) => ({ ...p, [i]: v === true })),
            className: "mt-0.5"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-sm", children: t })
      ] }, i)) }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setOpen(false), children: "Отмена" }),
        /* @__PURE__ */ jsxs(Button, { onClick: confirm2, children: [
          /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4 mr-2" }),
          "Отправить в выписку"
        ] })
      ] })
    ] }) })
  ] });
}
const isProtocolRecord = (data) => {
  return !!data && typeof data === "object" && !Array.isArray(data);
};
const serializeVisit = (v) => JSON.stringify({
  visit_date: v.visit_date,
  diagnosis: v.diagnosis,
  icd_code: v.icd_code,
  next_visit_date: v.next_visit_date,
  protocol_data: v.protocol_data
});
function AdminPatientVisitDetail() {
  var _a, _b, _c, _d, _e, _f, _g;
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, isSurgeon } = useAuth();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState("");
  const [siblings, setSiblings] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && user && !isAdmin && !isSurgeon) navigate("/");
  }, [authLoading, user, isAdmin, isSurgeon, navigate]);
  useProtocolFragmentReceiver({ patientId: visit == null ? void 0 : visit.patient_id, kind: "visit" });
  useEffect(() => {
    if (!(visit == null ? void 0 : visit.patient_id)) return;
    const ingest = (items) => {
      if (!(items == null ? void 0 : items.length)) return;
      setVisit((v) => {
        if (!v) return v;
        const base = isProtocolRecord(v.protocol_data) ? { ...v.protocol_data } : {};
        const cur = normalizeAssignments(base.assignments);
        base.assignments = mergePlanItemsIntoAssignments(cur, items);
        return { ...v, protocol_data: base };
      });
      toast({ title: `Добавлено в назначения: ${items.length}` });
    };
    const unsub = subscribePlanItems((msg) => ingest(msg.items), { patientId: visit.patient_id });
    const queued = popQueuedPlanItems({ patientId: visit.patient_id });
    if (queued.length) ingest(queued.flatMap((q) => q.items));
    return unsub;
  }, [visit == null ? void 0 : visit.patient_id]);
  useEffect(() => {
    var _a2;
    if (!((_a2 = visit == null ? void 0 : visit.patient) == null ? void 0 : _a2.full_name)) return;
    setActiveContext({
      patientId: visit.patient.id,
      patientName: visit.patient.full_name,
      targetId: visit.id,
      kind: "visit",
      url: window.location.pathname + window.location.search
    });
    return () => clearActiveContextIfMatches(visit.id);
  }, [visit == null ? void 0 : visit.id, (_a = visit == null ? void 0 : visit.patient) == null ? void 0 : _a.id, (_b = visit == null ? void 0 : visit.patient) == null ? void 0 : _b.full_name]);
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setBaseline("");
    supabase.from("patient_visits").select("*, patient:patients(id, full_name, history_number, birth_date, sex)").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error) toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
      if (data) {
        const v = data;
        const original = v.protocol_data;
        const normalized = normalizeImportedProtocolData(v.protocol_type, original);
        v.protocol_data = normalized;
        setVisit(v);
        setBaseline(serializeVisit(v));
        const prevVersion = isProtocolRecord(original) ? original._normalized_version : void 0;
        const newVersion = isProtocolRecord(normalized) ? normalized._normalized_version : void 0;
        if (newVersion === NORMALIZATION_VERSION && prevVersion !== NORMALIZATION_VERSION) {
          supabase.from("patient_visits").update({ protocol_data: normalized }).eq("id", v.id).then(({ error: upErr }) => {
            if (upErr) console.warn("[normalize] auto-persist failed:", upErr.message);
          });
        }
      }
      setLoading(false);
    });
  }, [id]);
  useEffect(() => {
    if (!(visit == null ? void 0 : visit.patient_id)) return;
    supabase.from("patient_visits").select("id, visit_date, protocol_type, diagnosis").eq("patient_id", visit.patient_id).neq("id", visit.id).order("visit_date", { ascending: false }).limit(50).then(({ data }) => setSiblings(data || []));
  }, [visit == null ? void 0 : visit.patient_id, visit == null ? void 0 : visit.id]);
  const isDirty = useMemo(() => {
    if (!visit || !baseline) return false;
    return serializeVisit(visit) !== baseline;
  }, [visit, baseline]);
  const isDirtyRef = useRef(isDirty);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);
  const update = (patch) => setVisit((v) => v ? { ...v, ...patch } : v);
  const handleSave = async () => {
    if (!visit) return;
    setSaving(true);
    const { error } = await supabase.from("patient_visits").update({
      visit_date: visit.visit_date,
      diagnosis: visit.diagnosis,
      icd_code: visit.icd_code,
      next_visit_date: visit.next_visit_date,
      protocol_data: visit.protocol_data
    }).eq("id", visit.id);
    setSaving(false);
    if (error) toast({ title: "Не удалось сохранить", description: error.message, variant: "destructive" });
    else {
      clearDraft();
      setBaseline(serializeVisit(visit));
      toast({ title: "Сохранено" });
    }
  };
  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  });
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        if (isDirtyRef.current) handleSaveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);
  const confirmIfDirty = (cb) => {
    if (isDirty && !window.confirm("Есть несохранённые изменения. Уйти без сохранения?")) return;
    cb();
  };
  const { loadDraft, clearDraft, hasDraft } = useAutoSave({
    key: id ? `visit_${id}` : "visit_new",
    data: visit ? {
      visit_date: visit.visit_date,
      diagnosis: visit.diagnosis,
      icd_code: visit.icd_code,
      next_visit_date: visit.next_visit_date,
      protocol_data: visit.protocol_data
    } : {},
    enabled: !!visit
  });
  const restoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setVisit((v) => v ? { ...v, ...draft } : v);
      toast({ title: "Черновик восстановлен" });
    }
  };
  const handleDelete = async () => {
    if (!visit) return;
    if (!confirm("Удалить этот визит безвозвратно?")) return;
    const { error } = await supabase.from("patient_visits").delete().eq("id", visit.id);
    if (error) toast({ title: "Не удалось удалить", description: error.message, variant: "destructive" });
    else navigate("/admin/visits");
  };
  const handleDuplicate = async () => {
    if (!visit) return;
    if (isDirty && !window.confirm("Есть несохранённые изменения. Дублировать без сохранения?")) return;
    const today = format(/* @__PURE__ */ new Date(), "yyyy-MM-dd");
    const { data, error } = await supabase.from("patient_visits").insert({
      patient_id: visit.patient_id,
      visit_date: today,
      protocol_type: visit.protocol_type,
      protocol_data: visit.protocol_data,
      diagnosis: visit.diagnosis,
      icd_code: visit.icd_code,
      next_visit_date: null
    }).select("id").single();
    if (error || !data) {
      toast({ title: "Не удалось дублировать", description: error == null ? void 0 : error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Протокол продублирован", description: "Измените динамические поля." });
    navigate(`/admin/visits/${data.id}`);
  };
  const handleAddUziUrinary = async () => {
    if (!visit) return;
    if (isDirty && !window.confirm("Есть несохранённые изменения в текущем протоколе. Продолжить?")) return;
    const today = format(/* @__PURE__ */ new Date(), "yyyy-MM-dd");
    const existing = siblings.find((s) => s.protocol_type === "uzi_reproductive" && s.visit_date === today);
    if (existing) {
      toast({ title: "Открываю существующий УЗДГ МПС", description: "Протокол за сегодня уже создан." });
      navigate(`/admin/visits/${existing.id}`);
      return;
    }
    const { data, error } = await supabase.from("patient_visits").insert({
      patient_id: visit.patient_id,
      visit_date: today,
      protocol_type: "uzi_reproductive",
      protocol_data: DEFAULT_PROTOCOL_DATA["uzi_reproductive"] || {},
      diagnosis: visit.diagnosis,
      icd_code: visit.icd_code
    }).select("id").single();
    if (error || !data) {
      toast({ title: "Не удалось создать УЗДГ МПС", description: error == null ? void 0 : error.message, variant: "destructive" });
      return;
    }
    toast({ title: "УЗДГ органов МПС создан", description: "Заполните параметры исследования." });
    navigate(`/admin/visits/${data.id}`);
  };
  if (authLoading || loading) return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin" }) });
  if (!visit) return /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: "Визит не найден" });
  const def = PROTOCOL_TYPE_MAP[visit.protocol_type];
  return /* @__PURE__ */ jsx(TooltipProvider, { delayDuration: 200, children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "sticky top-0 z-50 bg-background border-b shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto flex items-center gap-2 px-4 h-12", children: [
        /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => confirmIfDirty(() => navigate("/admin/visits")),
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4 md:mr-1" }),
                /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: "К журналу" })
              ]
            }
          ) }),
          /* @__PURE__ */ jsx(TooltipContent, { children: "К журналу визитов" })
        ] }),
        /* @__PURE__ */ jsxs(DropdownMenu, { children: [
          /* @__PURE__ */ jsxs(Tooltip, { children: [
            /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", children: [
              /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: "Открыть протокол" }),
              /* @__PURE__ */ jsx("span", { className: "md:hidden", children: "Протокол" }),
              /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 ml-1" })
            ] }) }) }),
            /* @__PURE__ */ jsx(TooltipContent, { children: "Другие протоколы пациента" })
          ] }),
          /* @__PURE__ */ jsx(DropdownMenuContent, { align: "start", className: "max-h-[60vh] overflow-y-auto w-80", children: siblings.length === 0 ? /* @__PURE__ */ jsx(DropdownMenuItem, { disabled: true, children: "Нет других протоколов" }) : siblings.map((s) => {
            var _a2;
            const title = ((_a2 = PROTOCOL_TYPE_MAP[s.protocol_type]) == null ? void 0 : _a2.title) || s.protocol_type;
            const dx = s.diagnosis ? ` — ${s.diagnosis.slice(0, 40)}${s.diagnosis.length > 40 ? "…" : ""}` : "";
            return /* @__PURE__ */ jsx(
              DropdownMenuItem,
              {
                onSelect: () => confirmIfDirty(() => navigate(`/admin/visits/${s.id}`)),
                children: /* @__PURE__ */ jsxs("span", { className: "text-xs", children: [
                  /* @__PURE__ */ jsx("strong", { children: format(new Date(s.visit_date), "dd.MM.yyyy") }),
                  " — ",
                  title,
                  dx
                ] })
              },
              s.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: `/admin/visits/new?patient_id=${visit.patient_id}`, onClick: (e) => {
            if (isDirty && !window.confirm("Есть несохранённые изменения. Уйти без сохранения?")) {
              e.preventDefault();
            }
          }, children: [
            /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 md:mr-1" }),
            /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: "Новый протокол" })
          ] }) }) }),
          /* @__PURE__ */ jsx(TooltipContent, { children: "Создать новый протокол для этого пациента" })
        ] }),
        /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: handleDuplicate, children: [
            /* @__PURE__ */ jsx(Copy, { className: "h-4 w-4 md:mr-1" }),
            /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: "Дублировать" })
          ] }) }),
          /* @__PURE__ */ jsx(TooltipContent, { children: "Создать копию этого протокола (сегодняшняя дата)" })
        ] }),
        visit.protocol_type === "primary_short" && /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: handleAddUziUrinary,
              className: "gap-1 border-primary/40 text-primary hover:bg-primary/5",
              children: [
                /* @__PURE__ */ jsx(Stethoscope, { className: "h-4 w-4 md:mr-1" }),
                /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: "+ УЗДГ органов МПС" }),
                /* @__PURE__ */ jsx("span", { className: "md:hidden", children: "+ УЗДГ" })
              ]
            }
          ) }),
          /* @__PURE__ */ jsx(TooltipContent, { children: "Создать протокол УЗИ органов мочевыделительной системы для того же пациента" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
          hasDraft() && /* @__PURE__ */ jsxs(Tooltip, { children: [
            /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: restoreDraft, children: [
              /* @__PURE__ */ jsx(RotateCcw, { className: "h-4 w-4 md:mr-1" }),
              /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: "Черновик" })
            ] }) }),
            /* @__PURE__ */ jsx(TooltipContent, { children: "Восстановить автосохранённый черновик" })
          ] }),
          /* @__PURE__ */ jsxs(Tooltip, { children: [
            /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => setPreviewOpen(true), children: [
              /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4 md:mr-1" }),
              /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: "Предпросмотр" })
            ] }) }),
            /* @__PURE__ */ jsx(TooltipContent, { children: "Полный предпросмотр бланка" })
          ] }),
          /* @__PURE__ */ jsxs(Tooltip, { children: [
            /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: handleDelete, className: "text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) }) }),
            /* @__PURE__ */ jsx(TooltipContent, { children: "Удалить визит" })
          ] }),
          /* @__PURE__ */ jsxs(Tooltip, { children: [
            /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                onClick: handleSave,
                disabled: saving || !isDirty,
                className: isDirty ? "bg-green-600 hover:bg-green-700 text-white" : "",
                children: [
                  saving ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 md:mr-1 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "h-4 w-4 md:mr-1" }),
                  /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: "Сохранить" }),
                  isDirty && /* @__PURE__ */ jsx("span", { className: "ml-1 inline-block w-2 h-2 rounded-full bg-yellow-300" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsx(TooltipContent, { children: isDirty ? "Есть несохранённые изменения (Ctrl+S)" : "Всё сохранено" })
          ] })
        ] })
      ] }),
      isDirty && /* @__PURE__ */ jsx("div", { className: "bg-yellow-50 border-t border-b border-yellow-300 text-yellow-900 text-xs px-4 py-1.5 text-center", children: "⚠ Есть несохранённые изменения — не забудьте сохранить (Ctrl+S)" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto space-y-6 p-4 md:p-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: (def == null ? void 0 : def.title) || visit.protocol_type }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Пациент" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "text-sm space-y-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "ФИО:" }),
            " ",
            (_c = visit.patient) == null ? void 0 : _c.full_name,
            visit.patient_id && /* @__PURE__ */ jsx(
              Link,
              {
                to: `/admin/patients/${visit.patient_id}/edit`,
                title: "Редактировать карточку пациента",
                className: "inline-flex items-center justify-center w-6 h-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground",
                children: /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "№ ИБ:" }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-mono", children: ((_d = visit.patient) == null ? void 0 : _d.history_number) || "—" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Дата рождения:" }),
            ((_e = visit.patient) == null ? void 0 : _e.birth_date) ? format(new Date(visit.patient.birth_date), "dd.MM.yyyy") : "—",
            visit.patient_id && /* @__PURE__ */ jsx(
              Link,
              {
                to: `/admin/patients/${visit.patient_id}/edit`,
                title: "Исправить дату рождения в карточке",
                className: "inline-flex items-center justify-center w-6 h-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground",
                children: /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5" })
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Метаданные визита" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "grid md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Дата визита" }),
            /* @__PURE__ */ jsx(Input, { type: "date", value: visit.visit_date, onChange: (e) => update({ visit_date: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Контрольный осмотр" }),
            /* @__PURE__ */ jsx(Input, { type: "date", value: visit.next_visit_date || "", onChange: (e) => update({ next_visit_date: e.target.value || null }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { children: "Код МКБ-10" }),
            /* @__PURE__ */ jsx(
              IcdAutocomplete,
              {
                value: visit.icd_code || "",
                onChange: (code, name) => update({ icd_code: code, diagnosis: visit.diagnosis || name || null })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1 md:col-span-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Диагноз" }),
            /* @__PURE__ */ jsx(Textarea, { value: visit.diagnosis || "", onChange: (e) => update({ diagnosis: e.target.value }), rows: 3 })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Содержание протокола" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(
          ProtocolForm,
          {
            type: visit.protocol_type,
            data: visit.protocol_data,
            onChange: (d) => update({ protocol_data: d }),
            birthDate: (_f = visit.patient) == null ? void 0 : _f.birth_date,
            patientSex: ((_g = visit.patient) == null ? void 0 : _g.sex) ?? null
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx(PdfBatchUpload, { patientId: visit.patient_id }),
      /* @__PURE__ */ jsx(
        AssignmentsPanel,
        {
          value: isProtocolRecord(visit.protocol_data) ? normalizeAssignments(visit.protocol_data.assignments) : void 0,
          onChange: (next) => {
            const base = isProtocolRecord(visit.protocol_data) ? { ...visit.protocol_data } : {};
            base.assignments = next;
            update({ protocol_data: base });
          }
        }
      ),
      (() => {
        var _a2;
        const a = isProtocolRecord(visit.protocol_data) ? normalizeAssignments(visit.protocol_data.assignments) : null;
        if (!a || a.treatments.length === 0) return null;
        return /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(
          WriteRxFromAssignments,
          {
            treatments: a.treatments,
            patientId: visit.patient_id,
            patientName: (_a2 = visit.patient) == null ? void 0 : _a2.full_name
          }
        ) });
      })(),
      /* @__PURE__ */ jsx(
        AiReasoningField,
        {
          value: isProtocolRecord(visit.protocol_data) ? visit.protocol_data.ai_reasoning || "" : "",
          onChange: (v) => {
            const base = isProtocolRecord(visit.protocol_data) ? { ...visit.protocol_data } : {};
            base.ai_reasoning = v;
            update({ protocol_data: base });
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: previewOpen, onOpenChange: setPreviewOpen, children: /* @__PURE__ */ jsxs(
      DialogContent,
      {
        className: "max-w-none w-screen h-screen p-0 gap-0 rounded-none border-0 sm:rounded-none overflow-hidden flex flex-col [&>button]:hidden",
        children: [
          /* @__PURE__ */ jsx("style", { children: `
              .preview-container {
                background: #e0e0e0;
                padding: 20px 0;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                min-height: 0;
              }
              .preview-wrapper {
                transform: scale(0.85);
                transform-origin: top center;
                width: 117.65%;
                margin-left: -8.82%;
              }
              @media (max-width: 1280px) {
                .preview-wrapper { transform: scale(0.75); width: 133.33%; margin-left: -16.66%; }
              }
              @media (max-width: 1024px) {
                .preview-wrapper { transform: scale(0.55); width: 181.82%; margin-left: -40.91%; }
              }
              .preview-container .print-page {
                margin: 0 auto 20px auto;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              }
              @media print {
                body > *:not(.modal-print-root) { display: none !important; }
                .modal-print-root { position: absolute; inset: 0; box-shadow: none !important; }
                .modal-print-root .preview-toolbar { display: none !important; }
                .modal-print-root .preview-container { overflow: visible !important; height: auto !important; padding: 0 !important; background: #fff !important; }
                .modal-print-root .preview-wrapper { transform: none !important; width: auto !important; margin: 0 !important; }
                .modal-print-root .preview-container .print-page { box-shadow: none !important; margin: 0 !important; }
              }
            ` }),
          /* @__PURE__ */ jsxs("div", { className: "modal-print-root flex flex-col h-full min-h-0 bg-muted/30", children: [
            /* @__PURE__ */ jsxs("div", { className: "preview-toolbar flex items-center justify-between border-b bg-background px-4 h-12 shrink-0", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Предпросмотр протокола" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxs(
                  Button,
                  {
                    size: "sm",
                    onClick: () => {
                      const src = document.getElementById("protocol-print-content");
                      if (!src) return;
                      const w = window.open("", "_blank");
                      if (!w) return;
                      const headCss = `
                        html,body{margin:0!important;padding:0!important;background:#fff}
                        @page { size: A4; margin: 15mm 15mm 18mm 15mm; }
                        @media print {
                          html,body{margin:0!important;padding:0!important;background:#fff!important}
                          .print-page{padding:0!important;margin:0!important;width:100%!important;max-width:100%!important;min-height:0!important;box-shadow:none!important;box-sizing:border-box!important}
                        }
                      `;
                      w.document.write(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Протокол — Тарусин Д.И.</title><base href="${window.location.origin}/"><style>${headCss}</style></head><body>${src.innerHTML}</body></html>`);
                      w.document.close();
                      w.focus();
                      const doPrint = async () => {
                        var _a2;
                        try {
                          const imgs = Array.from(w.document.images || []);
                          await Promise.all(imgs.map((img) => {
                            if (img.complete && img.naturalWidth > 0) return Promise.resolve();
                            return new Promise((resolve) => {
                              img.addEventListener("load", () => resolve(), { once: true });
                              img.addEventListener("error", () => resolve(), { once: true });
                            });
                          }));
                          if ((_a2 = w.document.fonts) == null ? void 0 : _a2.ready) {
                            try {
                              await w.document.fonts.ready;
                            } catch {
                            }
                          }
                          w.focus();
                          w.print();
                        } finally {
                          setTimeout(() => {
                            try {
                              w.close();
                            } catch {
                            }
                          }, 300);
                        }
                      };
                      if (w.document.readyState === "complete") doPrint();
                      else w.addEventListener("load", () => doPrint(), { once: true });
                    },
                    children: [
                      /* @__PURE__ */ jsx(Printer, { className: "h-4 w-4 mr-1" }),
                      " Печать"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  Button,
                  {
                    size: "sm",
                    variant: "outline",
                    onClick: async () => {
                      var _a2, _b2;
                      const src = document.getElementById("protocol-print-content");
                      if (!src) return;
                      try {
                        const name = ((_b2 = (_a2 = visit == null ? void 0 : visit.patient) == null ? void 0 : _a2.full_name) == null ? void 0 : _b2.replace(/\s+/g, "_")) || "protocol";
                        const date = (visit == null ? void 0 : visit.visit_date) ? String(visit.visit_date).slice(0, 10) : "";
                        await exportNodeToPdf(src, `${name}_${date}.pdf`);
                      } catch (e) {
                        toast({ title: "Не удалось создать PDF", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
                      }
                    },
                    children: [
                      /* @__PURE__ */ jsx(FileDown, { className: "h-4 w-4 mr-1" }),
                      " PDF"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "ghost", onClick: () => setPreviewOpen(false), children: [
                  /* @__PURE__ */ jsx(X, { className: "h-4 w-4 mr-1" }),
                  " Закрыть"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "preview-container flex-1 min-h-0", children: /* @__PURE__ */ jsx("div", { id: "protocol-print-content", className: "preview-wrapper", children: /* @__PURE__ */ jsx(ProtocolPrintLayout, { visit }) }) })
          ] })
        ]
      }
    ) })
  ] }) });
}
export {
  AdminPatientVisitDetail as default
};
