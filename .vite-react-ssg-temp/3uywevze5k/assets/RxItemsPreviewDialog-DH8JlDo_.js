import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { s as supabase, I as Input, B as Button, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogDescription, r as Checkbox, L as Label, l as DialogFooter } from "../main.mjs";
import { S as ScrollArea } from "./scroll-area-DtgkI4MV.js";
import { User, X, UserX, Tv, Link2, History, Search, CheckCircle2, AlertTriangle, Pill, Loader2, FileText, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-C_8nSrct.js";
import { i as getActiveContext, j as getRecentContexts, k as subscribeActiveContext } from "./protocolBridge-4TuhSmsW.js";
function rowName(p) {
  if (p.full_name && p.full_name.trim()) return p.full_name.trim();
  return [p.last_name, p.first_name].filter(Boolean).join(" ").trim() || "Без имени";
}
function PatientPickerPopover({
  value,
  onChange,
  children,
  align = "start"
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => getActiveContext());
  const [recent, setRecent] = useState(() => getRecentContexts());
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    if (!open) return;
    setActive(getActiveContext());
    setRecent(getRecentContexts());
    const unsub = subscribeActiveContext((ctx) => {
      setActive(ctx);
      setRecent(getRecentContexts());
    });
    return unsub;
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase.from("patients").select("id, full_name, last_name, first_name, birth_date").or(
          `full_name.ilike.%${term}%,last_name.ilike.%${term}%,first_name.ilike.%${term}%,history_number.ilike.%${term}%`
        ).order("updated_at", { ascending: false }).limit(15);
        setResults(data ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, open]);
  const pick = (sel) => {
    onChange(sel);
    setOpen(false);
    setQ("");
  };
  const recentClean = recent.filter(
    (r) => r.patientId && r.patientId !== value.id && r.patientId !== (active == null ? void 0 : active.patientId)
  );
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children }),
    /* @__PURE__ */ jsxs(PopoverContent, { align, className: "w-80 p-3 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-wide text-muted-foreground", children: "Привязка чата" }),
        value.id ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-primary/10", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-sm inline-flex items-center gap-1.5 min-w-0", children: [
            /* @__PURE__ */ jsx(User, { className: "w-3.5 h-3.5 text-primary shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: value.name })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => pick({ id: null, name: null }),
              className: "text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-0.5",
              title: "Отвязать пациента от чата",
              children: [
                /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }),
                " отвязать"
              ]
            }
          )
        ] }) : /* @__PURE__ */ jsxs("div", { className: "px-2 py-1.5 rounded-md border border-dashed text-xs text-muted-foreground inline-flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(UserX, { className: "w-3.5 h-3.5" }),
          " Без привязки к пациенту"
        ] })
      ] }),
      (active == null ? void 0 : active.patientId) && active.patientId !== value.id && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-[11px] uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Tv, { className: "w-3 h-3" }),
          " Открыто в соседней вкладке"
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => pick({ id: active.patientId, name: active.patientName }),
            className: "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-accent text-left",
            children: [
              /* @__PURE__ */ jsx(Link2, { className: "w-3.5 h-3.5 text-primary shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm truncate flex-1", children: active.patientName }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: "привязать" })
            ]
          }
        )
      ] }),
      recentClean.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-[11px] uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(History, { className: "w-3 h-3" }),
          " Недавние"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "max-h-32 overflow-y-auto", children: recentClean.slice(0, 6).map((r, i) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => pick({ id: r.patientId, name: r.patientName }),
            className: "w-full text-left px-2 py-1 rounded-md hover:bg-accent text-sm truncate",
            children: r.patientName
          },
          i
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-wide text-muted-foreground", children: "Поиск пациента" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: q,
              onChange: (e) => setQ(e.target.value),
              placeholder: "Фамилия, имя или № истории",
              className: "pl-7 h-8 text-sm",
              autoFocus: true
            }
          )
        ] }),
        q.trim().length >= 2 && /* @__PURE__ */ jsxs("div", { className: "max-h-48 overflow-y-auto border rounded-md divide-y", children: [
          searching && /* @__PURE__ */ jsx("div", { className: "px-2 py-2 text-xs text-muted-foreground", children: "Поиск…" }),
          !searching && results.length === 0 && /* @__PURE__ */ jsx("div", { className: "px-2 py-2 text-xs text-muted-foreground", children: "Не найдено" }),
          results.map((p) => /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => pick({ id: p.id, name: rowName(p) }),
              className: "w-full text-left px-2 py-1.5 hover:bg-accent text-sm",
              children: [
                /* @__PURE__ */ jsx("div", { className: "truncate", children: rowName(p) }),
                p.birth_date && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: new Date(p.birth_date).toLocaleDateString("ru-RU") })
              ]
            },
            p.id
          ))
        ] })
      ] }),
      !value.id && /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: "w-full text-xs text-muted-foreground",
          onClick: () => setOpen(false),
          children: "Закрыть — работать без пациента"
        }
      )
    ] })
  ] });
}
function PatientConfirmationBanner({
  boundPatient,
  activeContext,
  onPatientChange
}) {
  const tabId = (activeContext == null ? void 0 : activeContext.patientId) ?? null;
  const tabName = (activeContext == null ? void 0 : activeContext.patientName) ?? null;
  const mismatch = !!boundPatient.id && !!tabId && boundPatient.id !== tabId;
  const noBinding = !boundPatient.id;
  const tone = noBinding ? "warn" : mismatch ? "warn" : "ok";
  const toneClasses = tone === "ok" ? "bg-green-500/10 border-green-500/30 text-green-900 dark:text-green-100" : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100";
  const Trigger = /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "h-7 text-xs", children: boundPatient.id ? "Сменить" : "Выбрать пациента" });
  return /* @__PURE__ */ jsxs("div", { className: `border rounded-md p-2.5 flex items-center gap-2 text-sm ${toneClasses}`, children: [
    tone === "ok" ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 shrink-0" }) : /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 shrink-0" }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: boundPatient.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
      "Назначения уйдут пациенту:",
      " ",
      /* @__PURE__ */ jsx("span", { className: "font-semibold", children: boundPatient.name }),
      mismatch && /* @__PURE__ */ jsxs("div", { className: "text-xs mt-0.5 opacity-80", children: [
        "В соседней вкладке открыт другой пациент: ",
        /* @__PURE__ */ jsx("b", { children: tabName }),
        "."
      ] })
    ] }) : tabId ? /* @__PURE__ */ jsxs(Fragment, { children: [
      "Чат без привязки. В соседней вкладке открыт:",
      " ",
      /* @__PURE__ */ jsx("span", { className: "font-semibold", children: tabName }),
      " — назначения уйдут ему."
    ] }) : /* @__PURE__ */ jsx(Fragment, { children: "Чат без привязки к пациенту. Назначения будут в общей очереди." }) }),
    onPatientChange && /* @__PURE__ */ jsxs("div", { className: "flex gap-1 shrink-0", children: [
      mismatch && tabId && /* @__PURE__ */ jsx(
        Button,
        {
          variant: "outline",
          size: "sm",
          className: "h-7 text-xs",
          onClick: () => onPatientChange({ id: tabId, name: tabName }),
          title: "Привязать к пациенту из соседней вкладки",
          children: "Взять из вкладки"
        }
      ),
      /* @__PURE__ */ jsx(PatientPickerPopover, { value: boundPatient, onChange: onPatientChange, align: "end", children: Trigger })
    ] })
  ] });
}
function RxItemsPreviewDialog({
  open,
  onOpenChange,
  items,
  onItemsChange,
  loading,
  patientName,
  boundPatient,
  activeContext,
  onPatientChange,
  onConfirm
}) {
  const update = (id, patch) => {
    onItemsChange(items.map((it) => it._id === id ? { ...it, ...patch } : it));
  };
  const remove = (id) => onItemsChange(items.filter((it) => it._id !== id));
  const toggleAll = (checked) => onItemsChange(items.map((it) => ({ ...it, _selected: checked })));
  const selectedCount = items.filter((i) => i._selected).length;
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-3xl max-h-[85vh] flex flex-col", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Pill, { className: "w-5 h-5" }),
        "Формирование рецептов (форма 107-1/у)"
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: patientName ? /* @__PURE__ */ jsxs(Fragment, { children: [
        "Пациент: ",
        /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: patientName }),
        ". Каждый отмеченный препарат → отдельный бланк."
      ] }) : "Каждый отмеченный препарат будет выписан на отдельном бланке." })
    ] }),
    boundPatient && /* @__PURE__ */ jsx(
      PatientConfirmationBanner,
      {
        boundPatient,
        activeContext,
        onPatientChange
      }
    ),
    loading ? /* @__PURE__ */ jsxs("div", { className: "flex-1 flex items-center justify-center py-16 text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin mr-2" }),
      "Извлекаю препараты из фрагмента…"
    ] }) : items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm", children: "Препараты не распознаны в выделенном фрагменте." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b pb-2", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              checked: selectedCount === items.length,
              onCheckedChange: (v) => toggleAll(v === true)
            }
          ),
          "Выбрать все (",
          selectedCount,
          "/",
          items.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "Будет создано бланков: ",
          selectedCount
        ] })
      ] }),
      /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1 pr-3 -mr-3", children: /* @__PURE__ */ jsx("div", { className: "space-y-3 py-2", children: items.map((it, idx) => /* @__PURE__ */ jsx("div", { className: "border rounded-md p-3 bg-card space-y-2 text-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsx(
          Checkbox,
          {
            checked: it._selected,
            onCheckedChange: (v) => update(it._id, { _selected: v === true }),
            className: "mt-1"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "shrink-0 mt-0.5 text-xs text-muted-foreground flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5" }),
          " №",
          idx + 1
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-[11px] text-muted-foreground", children: "Rp: (латинское наименование)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: it.medication_latin_name,
                onChange: (e) => update(it._id, { medication_latin_name: e.target.value }),
                className: "h-8 font-medium"
              }
            )
          ] }),
          it.medication_ru_name && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground pl-1", children: it.medication_ru_name }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-[11px] text-muted-foreground", children: "Форма" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: it.dosage_form,
                  onChange: (e) => update(it._id, { dosage_form: e.target.value }),
                  placeholder: "tabulettae",
                  className: "h-8"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-[11px] text-muted-foreground", children: "Доза" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: it.dose,
                  onChange: (e) => update(it._id, { dose: e.target.value }),
                  placeholder: "500 мг",
                  className: "h-8"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-[11px] text-muted-foreground", children: "D.t.d. N" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "number",
                  min: 1,
                  value: it.quantity,
                  onChange: (e) => update(it._id, { quantity: parseInt(e.target.value) || 1 }),
                  className: "h-8"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-[11px] text-muted-foreground", children: "Кратность (S.)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: it.frequency,
                  onChange: (e) => update(it._id, { frequency: e.target.value }),
                  placeholder: "по 1 табл. 3 р/день",
                  className: "h-8"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-[11px] text-muted-foreground", children: "Длительность" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: it.duration,
                  onChange: (e) => update(it._id, { duration: e.target.value }),
                  placeholder: "7 дней",
                  className: "h-8"
                }
              )
            ] })
          ] }),
          it.signa && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground italic", children: [
            "S.: ",
            it.signa
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 shrink-0", onClick: () => remove(it._id), children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
      ] }) }, it._id)) }) })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { className: "border-t pt-3", children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Отмена" }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: () => {
            const selected = items.filter((i) => i._selected).map(({ _id, _selected, ...rest }) => rest);
            onConfirm(selected);
          },
          disabled: loading || selectedCount === 0,
          children: [
            "Открыть форму рецептов (",
            selectedCount,
            ")"
          ]
        }
      )
    ] })
  ] }) });
}
export {
  PatientConfirmationBanner as P,
  RxItemsPreviewDialog as R,
  PatientPickerPopover as a
};
