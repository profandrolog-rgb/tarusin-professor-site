import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { X as useIsMobile, s as supabase, I as Input, b as Badge, B as Button, w as Sheet, y as SheetContent, z as SheetHeader, A as SheetTitle, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogDescription, r as Checkbox, l as DialogFooter } from "../main.mjs";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-C_8nSrct.js";
import { Search, AlertTriangle, Sun, Beaker, X, ChevronDown, Calendar, MoreVertical, ChevronRight, Loader2, GripVertical, Database } from "lucide-react";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { T as TIME_OF_DAY, D as DILUTION_VOLUMES, b as SOLVENTS, F as FREQUENCY_PRESETS } from "./sections-BdvyTZRY.js";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
function CatalogPicker({ section, onPick, allowAllCategories }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [scope, setScope] = useState("section");
  const isMobile = useIsMobile();
  useEffect(() => {
    if (!open) return;
    (async () => {
      let req = supabase.from("treatment_catalog").select("*").eq("is_active", true).order("name").limit(40);
      if (scope === "section") req = req.eq("category", section);
      if (q.trim().length >= 1) req = req.or(`name.ilike.%${q}%,inn.ilike.%${q}%,subcategory.ilike.%${q}%`);
      const { data } = await req;
      setItems(data || []);
    })();
  }, [open, q, scope, section]);
  const handlePick = (it) => {
    onPick(it);
    setOpen(false);
    setQ("");
  };
  const body = /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-2 border-b flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          autoFocus: true,
          value: q,
          onChange: (e) => setQ(e.target.value),
          placeholder: "Поиск по названию или МНН...",
          className: "h-8 border-0 focus-visible:ring-0 bg-transparent"
        }
      )
    ] }),
    allowAllCategories && /* @__PURE__ */ jsxs("div", { className: "px-2 py-1 border-b flex gap-1 text-xs", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => setScope("section"), className: `px-2 py-0.5 rounded ${scope === "section" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`, children: "Только эта секция" }),
      /* @__PURE__ */ jsx("button", { onClick: () => setScope("all"), className: `px-2 py-0.5 rounded ${scope === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`, children: "Все категории" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: isMobile ? "flex-1 overflow-y-auto" : "max-h-80 overflow-y-auto", children: items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-4 text-sm text-center text-muted-foreground", children: "Ничего не найдено" }) : items.map((it) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => handlePick(it),
        className: "w-full text-left px-3 py-2 hover:bg-muted/60 border-b last:border-b-0",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: it.name }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              it.is_off_label && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] h-4 px-1", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { className: "w-2.5 h-2.5 mr-0.5" }),
                "off-label"
              ] }),
              it.light_sensitive && /* @__PURE__ */ jsx(Sun, { className: "w-3 h-3 text-amber-500" }),
              it.glucose_only && /* @__PURE__ */ jsx(Beaker, { className: "w-3 h-3 text-blue-500" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            it.inn ? `${it.inn} · ` : "",
            it.form || "",
            it.default_dose ? ` · ${it.default_dose} ${it.dose_unit || ""}` : "",
            it.default_frequency ? ` · ${it.default_frequency}` : ""
          ] })
        ]
      },
      it.id
    )) })
  ] });
  if (isMobile) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => setOpen(true), children: "+ Добавить" }),
      /* @__PURE__ */ jsx(Sheet, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxs(SheetContent, { side: "bottom", className: "h-[85vh] p-0 flex flex-col", children: [
        /* @__PURE__ */ jsx(SheetHeader, { className: "p-3 border-b", children: /* @__PURE__ */ jsx(SheetTitle, { className: "text-base", children: "Добавить позицию" }) }),
        body
      ] }) })
    ] });
  }
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", children: "+ Добавить" }) }),
    /* @__PURE__ */ jsx(
      PopoverContent,
      {
        align: "start",
        sideOffset: 4,
        className: "w-[420px] max-w-[90vw] p-0 bg-popover text-popover-foreground",
        onOpenAutoFocus: (e) => e.preventDefault(),
        children: body
      }
    )
  ] });
}
function TimeOfDayMultiSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const toggle = (v) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: "w-full min-h-8 border rounded-md px-2 py-1 text-left text-sm bg-background hover:bg-muted/50 flex items-center justify-between gap-1",
        children: [
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 items-center flex-1 min-w-0", children: value.length === 0 ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "—" }) : value.map((v) => /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-[10px]", children: [
            v,
            /* @__PURE__ */ jsx(
              X,
              {
                className: "w-2.5 h-2.5 cursor-pointer hover:text-destructive",
                onClick: (e) => {
                  e.stopPropagation();
                  toggle(v);
                }
              }
            )
          ] }, v)) }),
          /* @__PURE__ */ jsx(ChevronDown, { className: "w-3 h-3 text-muted-foreground shrink-0" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(PopoverContent, { align: "start", sideOffset: 4, className: "w-[200px] p-1 bg-popover", children: TIME_OF_DAY.map((t) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 px-2 py-1 text-sm hover:bg-muted cursor-pointer rounded", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "checkbox",
          checked: value.includes(t),
          onChange: () => toggle(t),
          className: "w-3.5 h-3.5"
        }
      ),
      t
    ] }, t)) })
  ] });
}
const norm = (s) => s.toLowerCase().trim().replace(/\s+/g, " ");
function alias(token) {
  const t = norm(token);
  if (["ежедневно", "every_day", "everyday", "каждый день"].includes(t)) return "every_day";
  if (["ч/день", "через день", "every_other", "every other day"].includes(t)) return "every_other";
  if (["every_3rd_day", "каждый 3-й день", "1 р/3 дня", "раз в 3 дня"].includes(t)) return "every_3rd_day";
  if (["weekly", "1 р/нед", "раз в неделю"].includes(t)) return "weekly";
  if (["twice_weekly", "2 р/нед", "2 раза в неделю"].includes(t)) return "twice_weekly";
  if (["thrice_weekly", "3 р/нед", "3 раза в неделю"].includes(t)) return "thrice_weekly";
  return t;
}
function expandDays(pattern, durationDays) {
  if (durationDays <= 0) return [];
  if (!pattern || !pattern.trim()) return [];
  const out = /* @__PURE__ */ new Set();
  const tokens = pattern.split(/[;,]/).map((t) => t.trim()).filter(Boolean);
  for (const raw of tokens) {
    const t = alias(raw);
    const r = t.match(/^(\d+)\s*-\s*(\d+)$/);
    if (r) {
      const a = Math.max(1, parseInt(r[1]));
      const b = Math.min(durationDays, parseInt(r[2]));
      for (let i = a; i <= b; i++) out.add(i);
      continue;
    }
    if (/^\d+$/.test(t)) {
      const n = parseInt(t);
      if (n >= 1 && n <= durationDays) out.add(n);
      continue;
    }
    if (t === "every_day") {
      for (let i = 1; i <= durationDays; i++) out.add(i);
      continue;
    }
    if (t === "every_other") {
      for (let i = 1; i <= durationDays; i += 2) out.add(i);
      continue;
    }
    if (t === "every_3rd_day") {
      for (let i = 1; i <= durationDays; i += 3) out.add(i);
      continue;
    }
    if (t === "weekly") {
      for (let i = 1; i <= durationDays; i += 7) out.add(i);
      continue;
    }
    if (t === "twice_weekly") {
      for (let w = 0; w * 7 + 1 <= durationDays; w++) {
        if (w * 7 + 1 <= durationDays) out.add(w * 7 + 1);
        if (w * 7 + 4 <= durationDays) out.add(w * 7 + 4);
      }
      continue;
    }
    if (t === "thrice_weekly") {
      for (let w = 0; w * 7 + 1 <= durationDays; w++) {
        if (w * 7 + 1 <= durationDays) out.add(w * 7 + 1);
        if (w * 7 + 3 <= durationDays) out.add(w * 7 + 3);
        if (w * 7 + 5 <= durationDays) out.add(w * 7 + 5);
      }
      continue;
    }
    const eof = t.match(/^every_other_from_(\d+)$/);
    if (eof) {
      const start = parseInt(eof[1]);
      for (let i = start; i <= durationDays; i += 2) out.add(i);
      continue;
    }
  }
  return [...out].sort((a, b) => a - b);
}
function compactDays(days) {
  if (!days.length) return "";
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const parts = [];
  let start = sorted[0], prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = prev = cur;
  }
  return parts.join(",");
}
function toggleDay(pattern, durationDays, day) {
  const set = new Set(expandDays(pattern, durationDays));
  if (set.has(day)) set.delete(day);
  else set.add(day);
  return compactDays([...set]);
}
function shiftDays(pattern, durationDays, offset) {
  const days = expandDays(pattern, durationDays).map((d) => d + offset).filter((d) => d >= 1 && d <= durationDays);
  return compactDays(days);
}
function formatPattern(pattern, durationDays) {
  const days = expandDays(pattern, durationDays);
  if (!days.length) return "—";
  if (days.length === durationDays) return "ежедневно";
  return compactDays(days);
}
function DayPatternPopover({ value, duration, onChange }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const apply = (v) => {
    onChange(v);
    setOpen(false);
    setCustom(false);
  };
  const selected = new Set(expandDays(value, duration));
  const presets = [
    { label: "Весь курс", v: `1-${duration}` },
    { label: "Через день", v: "every_other" },
    { label: "Дни 1–5", v: "1-5" },
    { label: "Дни 6–10", v: `6-${Math.min(10, duration)}` },
    { label: "1 раз в неделю", v: "weekly" },
    { label: "2 раза в неделю", v: "twice_weekly" },
    { label: "3 раза в неделю", v: "thrice_weekly" }
  ];
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: (o) => {
    setOpen(o);
    if (!o) setCustom(false);
  }, children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { type: "button", size: "sm", variant: "outline", className: "h-7 gap-1", children: [
      /* @__PURE__ */ jsx(Calendar, { className: "w-3 h-3" }),
      /* @__PURE__ */ jsx("span", { className: "text-[11px]", children: formatPattern(value, duration) })
    ] }) }),
    /* @__PURE__ */ jsx(PopoverContent, { align: "end", sideOffset: 4, className: "w-80 p-2 bg-popover", children: !custom ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-1 mb-2", children: presets.map((p) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => apply(p.v),
          className: "text-xs px-2 py-1.5 rounded border hover:bg-muted text-left",
          children: p.label
        },
        p.label
      )) }),
      /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "w-full h-7 text-xs", onClick: () => setCustom(true), children: "Произвольно (выбрать дни)" })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mb-1", children: "Отметьте дни курса:" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1 max-h-56 overflow-y-auto", children: Array.from({ length: duration }, (_, i) => i + 1).map((d) => {
        const sel = selected.has(d);
        return /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              const next = new Set(selected);
              if (sel) next.delete(d);
              else next.add(d);
              onChange(compactDays([...next]));
            },
            className: `text-xs h-7 rounded border ${sel ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`,
            children: d
          },
          d
        );
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-2", children: [
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-7 text-xs", onClick: () => setCustom(false), children: "Назад" }),
        /* @__PURE__ */ jsx(Button, { size: "sm", className: "h-7 text-xs", onClick: () => setOpen(false), children: "Готово" })
      ] })
    ] }) })
  ] });
}
function DayContextMenu({ day, duration, items, onBulkUpdate }) {
  const [open, setOpen] = useState(false);
  const [copySubOpen, setCopySubOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [shiftN, setShiftN] = useState(1);
  const close = () => {
    setOpen(false);
    setCopySubOpen(false);
    setShiftOpen(false);
  };
  const copyDayTo = (target) => {
    onBulkUpdate((it) => {
      const days = new Set(expandDays(it.day_pattern, duration));
      if (!days.has(day)) return null;
      days.add(target);
      return { day_pattern: compactDays([...days]) };
    });
    close();
  };
  const clearDay = () => {
    onBulkUpdate((it) => {
      const days = new Set(expandDays(it.day_pattern, duration));
      if (!days.has(day)) return null;
      days.delete(day);
      return { day_pattern: compactDays([...days]) };
    });
    close();
  };
  const setAllEveryDay = () => {
    onBulkUpdate(() => ({ day_pattern: `1-${duration}` }));
    close();
  };
  const overflowCount = items.filter((it) => {
    const days = expandDays(it.day_pattern, duration);
    if (!days.length) return false;
    return Math.max(...days) + shiftN > duration;
  }).length;
  const doShift = () => {
    if (!Number.isFinite(shiftN) || shiftN === 0) return;
    onBulkUpdate((it) => ({ day_pattern: shiftDays(it.day_pattern, duration, shiftN) }));
    close();
  };
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: (v) => {
    setOpen(v);
    if (!v) {
      setCopySubOpen(false);
      setShiftOpen(false);
    }
  }, children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "opacity-30 hover:opacity-100 transition-opacity",
        title: `Действия для дня ${day}`,
        onClick: (e) => e.stopPropagation(),
        children: /* @__PURE__ */ jsx(MoreVertical, { className: "w-3 h-3" })
      }
    ) }),
    /* @__PURE__ */ jsxs(PopoverContent, { className: "w-64 p-1", align: "start", children: [
      !copySubOpen && !shiftOpen && /* @__PURE__ */ jsxs("div", { className: "flex flex-col text-sm", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            className: "px-2 py-1.5 rounded hover:bg-accent text-left flex items-center justify-between",
            onClick: () => setCopySubOpen(true),
            children: [
              "Скопировать день ",
              day,
              " в… ",
              /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("button", { className: "px-2 py-1.5 rounded hover:bg-accent text-left", onClick: clearDay, children: [
          "Очистить день ",
          day
        ] }),
        /* @__PURE__ */ jsx("button", { className: "px-2 py-1.5 rounded hover:bg-accent text-left", onClick: setAllEveryDay, children: "Назначить всё на каждый день" }),
        /* @__PURE__ */ jsx("button", { className: "px-2 py-1.5 rounded hover:bg-accent text-left", onClick: () => setShiftOpen(true), children: "Сдвинуть курс на N дней…" })
      ] }),
      copySubOpen && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "px-2 py-1 text-xs text-muted-foreground", children: "Целевой день:" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1 max-h-56 overflow-y-auto p-1", children: Array.from({ length: duration }, (_, i) => i + 1).filter((d) => d !== day).map((d) => /* @__PURE__ */ jsx(
          "button",
          {
            className: "text-xs h-7 rounded border hover:bg-accent",
            onClick: () => copyDayTo(d),
            children: d
          },
          d
        )) }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "w-full mt-1", onClick: () => setCopySubOpen(false), children: "Назад" })
      ] }),
      shiftOpen && /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-2", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Сдвиг (+вперёд, −назад):" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "number",
            value: shiftN,
            onChange: (e) => setShiftN(parseInt(e.target.value) || 0),
            className: "h-8"
          }
        ),
        overflowCount > 0 && shiftN > 0 && /* @__PURE__ */ jsxs("div", { className: "text-xs text-amber-600 dark:text-amber-400", children: [
          "⚠ ",
          overflowCount,
          " ",
          overflowCount === 1 ? "позиция выйдет" : "позиций выйдут",
          " за пределы курса (будут обрезаны)"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "flex-1", onClick: () => setShiftOpen(false), children: "Отмена" }),
          /* @__PURE__ */ jsx(Button, { size: "sm", className: "flex-1", onClick: doShift, children: "Сдвинуть" })
        ] })
      ] })
    ] })
  ] });
}
function GanttStrip({ pattern, duration, color = "hsl(var(--primary))", onChange }) {
  const set = new Set(expandDays(pattern, duration));
  return /* @__PURE__ */ jsx("div", { className: "flex gap-[2px] items-center overflow-x-auto py-0.5", children: Array.from({ length: duration }, (_, i) => i + 1).map((d) => {
    const sel = set.has(d);
    return /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        title: `День ${d}${sel ? " (отменить)" : ""}`,
        disabled: !onChange,
        onClick: () => onChange == null ? void 0 : onChange(toggleDay(pattern, duration, d)),
        className: `shrink-0 w-4 h-5 rounded-sm border transition-colors ${sel ? "" : "bg-muted/40 hover:bg-muted"}`,
        style: sel ? { backgroundColor: color, borderColor: color } : void 0
      },
      d
    );
  }) });
}
function GanttHeader({ duration, items, onBulkUpdate }) {
  const showMenu = !!items && !!onBulkUpdate;
  return /* @__PURE__ */ jsx("div", { className: "sticky top-0 z-10 bg-card border-b py-1 pl-2 overflow-x-auto", children: /* @__PURE__ */ jsx("div", { className: "flex gap-[2px]", children: Array.from({ length: duration }, (_, i) => i + 1).map((d) => /* @__PURE__ */ jsxs("div", { className: "shrink-0 w-4 h-5 text-[9px] text-center text-muted-foreground leading-5 font-mono relative group", children: [
    /* @__PURE__ */ jsx("span", { children: d }),
    showMenu && /* @__PURE__ */ jsx("div", { className: "absolute -top-0.5 left-1/2 -translate-x-1/2", children: /* @__PURE__ */ jsx(DayContextMenu, { day: d, duration, items, onBulkUpdate }) })
  ] }, d)) }) });
}
function parseDosage(s) {
  if (!s) return { dose: null, unit: null };
  const m = s.trim().match(/^(\d+(?:[.,]\d+)?)\s*([^\s\d].*)?$/);
  if (!m) return { dose: null, unit: null };
  return { dose: Number(m[1].replace(",", ".")), unit: (m[2] || "").trim() || null };
}
const FIELD_LABELS = {
  name: "Название",
  inn: "МНН",
  form: "Форма",
  default_dose: "Доза",
  dose_unit: "Ед. дозы"
};
function MedicationImportDialog({ open, onOpenChange, current, onApply }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState(null);
  const [checks, setChecks] = useState({});
  const [proposed, setProposed] = useState({});
  useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
      setPicked(null);
      setChecks({});
      setProposed({});
    }
  }, [open]);
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setBusy(true);
      const { data } = await supabase.from("medications").select("id, latin_name, trade_name, dosage_form, dosage").or(`latin_name.ilike.%${q}%,trade_name.ilike.%${q}%`).limit(15);
      setResults(data || []);
      setBusy(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);
  const pick = (m) => {
    setPicked(m);
    const parsed = parseDosage(m.dosage);
    const p = {
      name: m.trade_name || m.latin_name,
      inn: m.latin_name,
      form: m.dosage_form,
      default_dose: parsed.dose,
      dose_unit: parsed.unit
    };
    setProposed(p);
    const c = {};
    Object.keys(p).forEach((k) => {
      const cur = current[k];
      const isEmpty = cur === null || cur === void 0 || cur === "" || typeof cur === "number" && Number.isNaN(cur);
      c[k] = isEmpty && p[k] !== null && p[k] !== void 0 && p[k] !== "";
    });
    setChecks(c);
  };
  const apply = () => {
    if (!picked) return;
    const patch = {};
    Object.keys(proposed).forEach((k) => {
      if (checks[k]) patch[k] = proposed[k];
    });
    onApply(patch);
    onOpenChange(false);
  };
  const fmt = (v) => v === null || v === void 0 || v === "" ? "—" : String(v);
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Импорт из справочника рецептов" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Поиск по латинскому или торговому названию." })
    ] }),
    !picked && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: q,
            onChange: (e) => setQ(e.target.value),
            placeholder: "Минимум 2 символа...",
            className: "pl-9",
            autoFocus: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "border rounded max-h-72 overflow-y-auto", children: [
        busy && /* @__PURE__ */ jsx("div", { className: "p-4 text-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin inline" }) }),
        !busy && q.trim().length >= 2 && results.length === 0 && /* @__PURE__ */ jsx("div", { className: "p-4 text-sm text-muted-foreground text-center", children: "Ничего не найдено" }),
        results.map((m) => /* @__PURE__ */ jsxs(
          "button",
          {
            className: "w-full text-left px-3 py-2 hover:bg-accent border-b last:border-0",
            onClick: () => pick(m),
            children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium", children: m.trade_name || m.latin_name }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                m.latin_name,
                m.dosage_form ? ` · ${m.dosage_form}` : "",
                m.dosage ? ` · ${m.dosage}` : ""
              ] })
            ]
          },
          m.id
        ))
      ] })
    ] }),
    picked && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
        "Выбрано: ",
        /* @__PURE__ */ jsx("b", { children: picked.trade_name || picked.latin_name })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Снимите галочки с полей, которые НЕ нужно перезаписывать. По умолчанию защищены уже заполненные поля." }),
      /* @__PURE__ */ jsx("div", { className: "border rounded divide-y", children: Object.keys(proposed).map((k) => {
        const cur = current[k];
        const next = proposed[k];
        const same = String(cur ?? "") === String(next ?? "");
        if (next === null || next === void 0 || next === "") return null;
        return /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-3 p-2 cursor-pointer", children: [
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              checked: !!checks[k],
              onCheckedChange: (v) => setChecks((c) => ({ ...c, [k]: !!v })),
              className: "mt-0.5"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 text-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: FIELD_LABELS[k] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: fmt(cur) }),
              " → ",
              /* @__PURE__ */ jsx("span", { className: same ? "text-muted-foreground" : "text-primary font-medium", children: fmt(next) }),
              same && /* @__PURE__ */ jsx("span", { className: "ml-1 text-muted-foreground", children: "(без изменений)" })
            ] })
          ] })
        ] }, k);
      }) }),
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: () => setPicked(null), children: "← Выбрать другой" })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Отмена" }),
      picked && /* @__PURE__ */ jsx(Button, { onClick: apply, children: "Применить" })
    ] })
  ] }) });
}
const showInfusion = (c) => c === "iv_drip";
function PlanItemRow({ item, update, remove, duplicateInn, mode = "flat", courseDuration = 10, sortable = false }) {
  var _a;
  const [importOpen, setImportOpen] = useState(false);
  const sort = useSortable({ id: item.client_id, disabled: !sortable });
  const style = sortable ? {
    transform: CSS.Transform.toString(sort.transform),
    transition: sort.transition,
    opacity: sort.isDragging ? 0.5 : 1
  } : void 0;
  const outOfRange = item.dose !== null && (item.dose_range_min !== void 0 && item.dose_range_min !== null && item.dose < item.dose_range_min || item.dose_range_max !== void 0 && item.dose_range_max !== null && item.dose > item.dose_range_max);
  const incompat = item.glucose_only && item.dilution_solvent && !item.dilution_solvent.toLowerCase().includes("глюк");
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: sortable ? sort.setNodeRef : void 0,
      style,
      className: "border rounded-md p-3 bg-card space-y-2",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-1 flex-1", children: [
            sortable && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                ...sort.attributes,
                ...sort.listeners,
                className: "cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5 mt-0.5",
                "aria-label": "Перетащить",
                children: /* @__PURE__ */ jsx(GripVertical, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: item.name_snapshot }),
              item.inn_snapshot && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "(",
                item.inn_snapshot,
                ")"
              ] }),
              item.form_snapshot && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "· ",
                item.form_snapshot
              ] }),
              item.is_off_label && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] h-5 gap-1", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3 h-3" }),
                "off-label"
              ] }),
              item.light_sensitive && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] h-5 gap-1 border-amber-500/50 text-amber-600 dark:text-amber-400", children: [
                /* @__PURE__ */ jsx(Sun, { className: "w-3 h-3" }),
                "защищать от света"
              ] }),
              duplicateInn && /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "text-[10px] h-5", children: "дубль по МНН" }),
              incompat && /* @__PURE__ */ jsxs(Badge, { variant: "destructive", className: "text-[10px] h-5 gap-1", children: [
                /* @__PURE__ */ jsx(Beaker, { className: "w-3 h-3" }),
                "не смешивать — нужна 5% глюкоза"
              ] }),
              outOfRange && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] h-5 border-amber-500/50 text-amber-600 dark:text-amber-400", children: "вне диапазона дозы" })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
            item.section_category === "oral_rx" && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => setImportOpen(true), title: "Импорт из справочника", children: /* @__PURE__ */ jsx(Database, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: remove, children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-6 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[11px] text-muted-foreground", children: "Доза" }),
            /* @__PURE__ */ jsx(Input, { type: "number", step: "any", value: item.dose ?? "", onChange: (e) => update({ dose: e.target.value === "" ? null : Number(e.target.value) }), className: "h-8" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[11px] text-muted-foreground", children: "Ед." }),
            /* @__PURE__ */ jsx(Input, { value: item.dose_unit ?? "", onChange: (e) => update({ dose_unit: e.target.value }), className: "h-8" })
          ] }),
          showInfusion(item.section_category) && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[11px] text-muted-foreground", children: "Объём" }),
              /* @__PURE__ */ jsxs(Select, { value: ((_a = item.dilution_volume) == null ? void 0 : _a.toString()) ?? "", onValueChange: (v) => update({ dilution_volume: v ? Number(v) : null }), children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "—" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: DILUTION_VOLUMES.map((v) => /* @__PURE__ */ jsxs(SelectItem, { value: v.toString(), children: [
                  v,
                  " мл"
                ] }, v)) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[11px] text-muted-foreground", children: "Растворитель" }),
              /* @__PURE__ */ jsxs(Select, { value: item.dilution_solvent ?? "", onValueChange: (v) => update({ dilution_solvent: v }), children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "—" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: SOLVENTS.map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, children: s }, s)) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[11px] text-muted-foreground", children: "Кратность" }),
            /* @__PURE__ */ jsx(Input, { list: `freq-presets`, value: item.frequency ?? "", onChange: (e) => update({ frequency: e.target.value }), className: "h-8" }),
            /* @__PURE__ */ jsx("datalist", { id: "freq-presets", children: FREQUENCY_PRESETS.map((f) => /* @__PURE__ */ jsx("option", { value: f }, f)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[11px] text-muted-foreground", children: "Дней" }),
            /* @__PURE__ */ jsx(Input, { type: "number", min: 1, value: item.duration_days ?? "", onChange: (e) => update({ duration_days: e.target.value === "" ? null : Number(e.target.value) }), className: "h-8" })
          ] }),
          showInfusion(item.section_category) && /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-[11px] text-muted-foreground", children: "Скорость инфузии" }),
            /* @__PURE__ */ jsx(Input, { value: item.infusion_rate ?? "", onChange: (e) => update({ infusion_rate: e.target.value }), className: "h-8", placeholder: "40–60 кап/мин" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-[11px] text-muted-foreground", children: "Время приёма" }),
            /* @__PURE__ */ jsx(TimeOfDayMultiSelect, { value: item.time_of_day || [], onChange: (v) => update({ time_of_day: v }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-2 md:col-span-3", children: [
            /* @__PURE__ */ jsx("label", { className: "text-[11px] text-muted-foreground", children: "Заметка" }),
            /* @__PURE__ */ jsx(Input, { value: item.notes ?? "", onChange: (e) => update({ notes: e.target.value }), className: "h-8", placeholder: "контроль АД, утром, до еды..." })
          ] }),
          (item.frequency || "").toLowerCase().includes("по требованию") && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[11px] text-muted-foreground", children: "Расчётный запас, приёмов" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                min: 1,
                value: item.prn_estimated_doses ?? "",
                placeholder: "10",
                onChange: (e) => update({ prn_estimated_doses: e.target.value === "" ? null : Number(e.target.value) }),
                className: "h-8"
              }
            )
          ] }),
          item.section_category === "homeopathy" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[11px] text-muted-foreground", children: "Потенция" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  list: "potency-presets",
                  value: item.potency ?? "",
                  placeholder: "30C, 200C, 1M...",
                  onChange: (e) => update({ potency: e.target.value || null }),
                  className: "h-8"
                }
              ),
              /* @__PURE__ */ jsx("datalist", { id: "potency-presets", children: ["6C", "12C", "30C", "200C", "1M", "10M", "50M", "CM", "6X", "12X", "30X"].map((p) => /* @__PURE__ */ jsx("option", { value: p }, p)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[11px] text-muted-foreground", children: "Режим приёма" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  list: "dosing-schedule-presets",
                  value: item.dosing_schedule ?? "",
                  placeholder: "стандартный курс",
                  onChange: (e) => update({ dosing_schedule: e.target.value || null }),
                  className: "h-8"
                }
              ),
              /* @__PURE__ */ jsxs("datalist", { id: "dosing-schedule-presets", children: [
                /* @__PURE__ */ jsx("option", { value: "разовый приём" }),
                /* @__PURE__ */ jsx("option", { value: "плюсующиеся дозы Q-потенций" }),
                /* @__PURE__ */ jsx("option", { value: "стандартный курс" })
              ] })
            ] })
          ] })
        ] }),
        mode === "scheduled" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-1 border-t", children: [
          /* @__PURE__ */ jsx(DayPatternPopover, { value: item.day_pattern, duration: courseDuration, onChange: (v) => update({ day_pattern: v }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsx(GanttStrip, { pattern: item.day_pattern, duration: courseDuration, onChange: (v) => update({ day_pattern: v }) }) })
        ] }),
        item.section_category === "oral_rx" && /* @__PURE__ */ jsx(
          MedicationImportDialog,
          {
            open: importOpen,
            onOpenChange: setImportOpen,
            current: {
              name: item.name_snapshot,
              inn: item.inn_snapshot,
              form: item.form_snapshot,
              default_dose: item.dose,
              dose_unit: item.dose_unit
            },
            onApply: (patch) => update({
              ...patch.name !== void 0 ? { name_snapshot: patch.name } : {},
              ...patch.inn !== void 0 ? { inn_snapshot: patch.inn } : {},
              ...patch.form !== void 0 ? { form_snapshot: patch.form } : {},
              ...patch.default_dose !== void 0 ? { dose: patch.default_dose } : {},
              ...patch.dose_unit !== void 0 ? { dose_unit: patch.dose_unit } : {}
            })
          }
        )
      ]
    }
  );
}
export {
  CatalogPicker as C,
  GanttHeader as G,
  PlanItemRow as P,
  expandDays as e
};
