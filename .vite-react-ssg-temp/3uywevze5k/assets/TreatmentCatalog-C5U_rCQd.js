import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useRef, useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogDescription, B as Button, b as Badge, L as Label, l as DialogFooter, t as toast, s as supabase, u as useAuth, I as Input, C as Card, a as CardContent, w as Sheet, y as SheetContent, z as SheetHeader, A as SheetTitle, T as Textarea, G as SheetFooter } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { S as Switch } from "./switch-D2b9t4DD.js";
import { FileSpreadsheet, Upload, AlertTriangle, CheckCircle2, Loader2, ArrowLeft, RefreshCw, Download, Plus, Search, X, Wallet, Sun, Beaker, Bot, Hand, Pencil } from "lucide-react";
import { a as SECTIONS } from "./sections-BdvyTZRY.js";
import { R as RadioGroup, a as RadioGroupItem } from "./radio-group-CM9YN36E.js";
import { p as parseCsv, r as rowToPayload, C as CATALOG_KNOWN_COLUMNS, s as serializeCsv } from "./treatmentCsv-ieIKlxXA.js";
import { e as effectivePrice, p as priceFreshness, f as formatRub } from "./cost-B-oW-Erb.js";
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
import "react-helmet-async";
import "@radix-ui/react-select";
import "@radix-ui/react-switch";
import "@radix-ui/react-radio-group";
function CsvImportDialog({ open, onOpenChange, onComplete }) {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [dup, setDup] = useState("skip");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const reset = () => {
    setHeaders([]);
    setRows([]);
    setFileName("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };
  const onFile = async (f) => {
    setResult(null);
    setFileName(f.name);
    const txt = await f.text();
    const matrix = parseCsv(txt, ";");
    if (matrix.length < 2) {
      toast({ title: "CSV пуст или нет строк данных", variant: "destructive" });
      return;
    }
    const hdr = matrix[0].map((h) => h.trim());
    setHeaders(hdr);
    const parsed = matrix.slice(1).map((r, i) => {
      const { payload, errors, warnings } = rowToPayload(hdr, r);
      return { index: i + 2, payload, errors, warnings };
    });
    setRows(parsed);
  };
  const valid = useMemo(() => rows.filter((r) => r.errors.length === 0), [rows]);
  const invalid = useMemo(() => rows.filter((r) => r.errors.length > 0), [rows]);
  const preview = rows.slice(0, 10);
  const unknownCols = useMemo(() => {
    const known = /* @__PURE__ */ new Set([...CATALOG_KNOWN_COLUMNS]);
    return headers.filter((h) => h && !known.has(h) && !h.startsWith("patient_"));
  }, [headers]);
  const run = async () => {
    setRunning(true);
    const log = [];
    let created = 0, updated = 0, skipped = 0;
    try {
      for (const r of valid) {
        try {
          const p = r.payload;
          let q = supabase.from("treatment_catalog").select("id").eq("name", p.name);
          q = p.inn ? q.eq("inn", p.inn) : q.is("inn", null);
          q = p.default_dose != null ? q.eq("default_dose", p.default_dose) : q.is("default_dose", null);
          q = p.dose_unit ? q.eq("dose_unit", p.dose_unit) : q.is("dose_unit", null);
          const { data: dupes } = await q.limit(1);
          const exists = dupes && dupes.length > 0;
          if (exists) {
            if (dup === "skip") {
              skipped++;
              continue;
            }
            if (dup === "update") {
              const { error: error2 } = await supabase.from("treatment_catalog").update(p).eq("id", dupes[0].id);
              if (error2) {
                log.push({ row: r.index, msg: error2.message });
              } else updated++;
              continue;
            }
          }
          const { error } = await supabase.from("treatment_catalog").insert(p);
          if (error) log.push({ row: r.index, msg: error.message });
          else created++;
        } catch (e) {
          log.push({ row: r.index, msg: (e == null ? void 0 : e.message) || String(e) });
        }
      }
      for (const r of invalid) log.push({ row: r.index, msg: r.errors.join("; ") });
      setResult({ created, updated, skipped, errors: log });
      onComplete();
    } finally {
      setRunning(false);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: (v) => {
    if (!running) {
      onOpenChange(v);
      if (!v) reset();
    }
  }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileSpreadsheet, { className: "w-5 h-5" }),
        "Импорт CSV"
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "UTF-8, разделитель «;», CRLF. Мэппинг по заголовкам. Поля patient_* собираются в JSON." })
    ] }),
    !rows.length && !result && /* @__PURE__ */ jsxs("div", { className: "border-2 border-dashed rounded-lg p-8 text-center space-y-3", children: [
      /* @__PURE__ */ jsx(Upload, { className: "w-10 h-10 mx-auto text-muted-foreground" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Выберите CSV-файл каталога" }),
      /* @__PURE__ */ jsx("input", { ref: fileRef, type: "file", accept: ".csv,text/csv", className: "hidden", onChange: (e) => {
        var _a;
        const f = (_a = e.target.files) == null ? void 0 : _a[0];
        if (f) onFile(f);
      } }),
      /* @__PURE__ */ jsxs(Button, { onClick: () => {
        var _a;
        return (_a = fileRef.current) == null ? void 0 : _a.click();
      }, className: "gap-2", children: [
        /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
        "Выбрать файл"
      ] })
    ] }),
    rows.length > 0 && !result && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx(Badge, { variant: "outline", children: fileName }),
        /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
          "всего строк: ",
          rows.length
        ] }),
        /* @__PURE__ */ jsxs(Badge, { className: "bg-green-600 hover:bg-green-600 text-white", children: [
          "валидных: ",
          valid.length
        ] }),
        invalid.length > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "destructive", children: [
          "с ошибками: ",
          invalid.length
        ] })
      ] }),
      unknownCols.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Неизвестные столбцы (будут проигнорированы): ",
          unknownCols.join(", ")
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { className: "text-sm font-semibold", children: "При совпадении (name + inn + default_dose + dose_unit):" }),
        /* @__PURE__ */ jsx(RadioGroup, { value: dup, onValueChange: (v) => setDup(v), className: "mt-2 grid grid-cols-3 gap-2", children: [
          { v: "skip", l: "Пропустить", d: "по умолчанию" },
          { v: "update", l: "Обновить", d: "перезаписать поля" },
          { v: "create", l: "Создать новое", d: "добавить дубль" }
        ].map((o) => /* @__PURE__ */ jsxs("label", { className: `border rounded-md p-2 cursor-pointer flex items-start gap-2 text-sm ${dup === o.v ? "border-primary bg-primary/5" : ""}`, children: [
          /* @__PURE__ */ jsx(RadioGroupItem, { value: o.v, className: "mt-0.5" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: o.l }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: o.d })
          ] })
        ] }, o.v)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold mb-2", children: "Превью первых 10 строк:" }),
        /* @__PURE__ */ jsx("div", { className: "border rounded overflow-x-auto max-h-64", children: /* @__PURE__ */ jsxs("table", { className: "text-xs w-full", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-muted sticky top-0", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "№" }),
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "category" }),
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "name" }),
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "inn" }),
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "доза" }),
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "статус" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: preview.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.index }),
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.payload.category || "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.payload.name || "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.payload.inn || "—" }),
            /* @__PURE__ */ jsxs("td", { className: "px-2 py-1", children: [
              r.payload.default_dose ?? "",
              " ",
              r.payload.dose_unit ?? ""
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.errors.length ? /* @__PURE__ */ jsx("span", { className: "text-destructive", children: r.errors[0] }) : /* @__PURE__ */ jsx("span", { className: "text-green-600 dark:text-green-400", children: "OK" }) })
          ] }, r.index)) })
        ] }) })
      ] }),
      invalid.length > 0 && /* @__PURE__ */ jsxs("details", { className: "text-xs", children: [
        /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-destructive font-medium", children: [
          "Показать строки с ошибками (",
          invalid.length,
          ")"
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-0.5 max-h-40 overflow-y-auto", children: invalid.slice(0, 50).map((r) => /* @__PURE__ */ jsxs("li", { children: [
          "стр. ",
          r.index,
          ": ",
          r.errors.join("; ")
        ] }, r.index)) })
      ] })
    ] }),
    result && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5 text-green-600 dark:text-green-400" }),
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Импорт завершён" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-2 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "border rounded p-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Создано" }),
          /* @__PURE__ */ jsx("div", { className: "text-xl font-bold text-green-600 dark:text-green-400", children: result.created })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border rounded p-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Обновлено" }),
          /* @__PURE__ */ jsx("div", { className: "text-xl font-bold text-blue-600 dark:text-blue-400", children: result.updated })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border rounded p-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Пропущено" }),
          /* @__PURE__ */ jsx("div", { className: "text-xl font-bold", children: result.skipped })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border rounded p-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Ошибок" }),
          /* @__PURE__ */ jsx("div", { className: "text-xl font-bold text-destructive", children: result.errors.length })
        ] })
      ] }),
      result.errors.length > 0 && /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { className: "cursor-pointer text-sm text-destructive", children: "Показать ошибки" }),
        /* @__PURE__ */ jsx("ul", { className: "text-xs mt-2 space-y-0.5 max-h-60 overflow-y-auto", children: result.errors.map((e, i) => /* @__PURE__ */ jsxs("li", { children: [
          "стр. ",
          e.row,
          ": ",
          e.msg
        ] }, i)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      rows.length > 0 && !result && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: reset, disabled: running, children: "Сбросить" }),
        /* @__PURE__ */ jsxs(Button, { onClick: run, disabled: running || valid.length === 0, className: "gap-2", children: [
          running ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
          "Импортировать ",
          valid.length,
          " ",
          valid.length === 1 ? "позицию" : "позиций"
        ] })
      ] }),
      result && /* @__PURE__ */ jsx(Button, { onClick: () => {
        onOpenChange(false);
        reset();
      }, children: "Закрыть" })
    ] })
  ] }) });
}
const empty = { category: "iv_drip", is_active: true, is_rx: false, is_off_label: false, light_sensitive: false, glucose_only: false, price_currency: "RUB", price_source_preference: "auto" };
const FRESHNESS_STYLES = {
  fresh: { dot: "bg-emerald-500", label: "цена свежая (≤30 дн.)" },
  stale: { dot: "bg-amber-500", label: "цена устарела (30–90 дн.)" },
  old: { dot: "bg-red-500", label: "цена давно не обновлялась (>90 дн.)" },
  missing: { dot: "bg-muted-foreground/30", label: "цена не задана" }
};
function TreatmentCatalog() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [matchIds, setMatchIds] = useState(null);
  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState([]);
  const [acOpen, setAcOpen] = useState(false);
  const acRef = useRef(null);
  const [onlyMissingPrice, setOnlyMissingPrice] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(empty);
  const [importOpen, setImportOpen] = useState(false);
  const [refreshingId, setRefreshingId] = useState(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [acuProtocols, setAcuProtocols] = useState([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("acupuncture_protocols").select("id, name").order("name");
      setAcuProtocols(data || []);
    })();
  }, []);
  const refreshPrice = async (id) => {
    var _a, _b;
    setRefreshingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("parse-drug-prices", { body: { catalog_id: id } });
      if (error) throw error;
      const r = (_a = data == null ? void 0 : data.results) == null ? void 0 : _a[0];
      if (r == null ? void 0 : r.ok) {
        toast({ title: "Цена обновлена", description: `${formatRub(r.price)} · источников: ${((_b = r.sources) == null ? void 0 : _b.length) || 0}` });
        await load();
        const fresh = await supabase.from("treatment_catalog").select("*").eq("id", id).single();
        if (fresh.data && draft.id === id) setDraft(fresh.data);
      } else {
        toast({ title: "Не удалось получить цену", description: (r == null ? void 0 : r.error) || "источники не вернули цены", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Ошибка обновления", description: e.message, variant: "destructive" });
    } finally {
      setRefreshingId(null);
    }
  };
  const refreshAllPrices = async () => {
    setBatchBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-drug-prices", { body: { batch: true, limit: 20 } });
      if (error) throw error;
      const ok = ((data == null ? void 0 : data.results) || []).filter((r) => r.ok).length;
      toast({ title: `Обновлено: ${ok} из ${(data == null ? void 0 : data.processed) || 0}` });
      load();
    } catch (e) {
      toast({ title: "Ошибка batch", description: e.message, variant: "destructive" });
    } finally {
      setBatchBusy(false);
    }
  };
  const exportCsv = async () => {
    const { data, error } = await supabase.from("treatment_catalog").select("*").order("category").order("name");
    if (error) {
      toast({ title: "Ошибка экспорта", description: error.message, variant: "destructive" });
      return;
    }
    const headers = [...CATALOG_KNOWN_COLUMNS];
    const patientKeys = /* @__PURE__ */ new Set();
    (data || []).forEach((r) => {
      if (r.patient_info && typeof r.patient_info === "object") Object.keys(r.patient_info).forEach((k) => patientKeys.add(k));
    });
    const allHeaders = [...headers, ...Array.from(patientKeys).sort()];
    const flat = (data || []).map((r) => {
      const out = { ...r };
      if (r.patient_info && typeof r.patient_info === "object") Object.entries(r.patient_info).forEach(([k, v]) => {
        out[k] = v;
      });
      return out;
    });
    const csv = serializeCsv(flat, allHeaders, ";");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `treatment_catalog_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Экспортировано: ${flat.length}` });
  };
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/treatment-catalog" } });
    }
  }, [user, isAdmin, loading, navigate]);
  const load = async () => {
    setBusy(true);
    const { data } = await supabase.from("treatment_catalog").select("*").order("category").order("name");
    setRows(data || []);
    setBusy(false);
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("treatment_catalog_search_history");
      if (raw) setHistory(JSON.parse(raw).slice(0, 10));
    } catch {
    }
  }, []);
  const pushHistory = (term) => {
    const t = term.trim();
    if (!t) return;
    setHistory((prev) => {
      const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 10);
      try {
        localStorage.setItem("treatment_catalog_search_history", JSON.stringify(next));
      } catch {
      }
      return next;
    });
  };
  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("treatment_catalog_search_history");
    } catch {
    }
  };
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setMatchIds(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const fts = term.split(/\s+/).filter(Boolean).map((t) => t.replace(/[&|!():*]/g, "") + ":*").join(" & ");
        let { data, error } = await supabase.from("treatment_catalog").select("id").textSearch("search_vector", fts, { config: "russian" });
        if (error) {
          setMatchIds(null);
        } else {
          setMatchIds(new Set((data || []).map((r) => r.id)));
        }
      } catch {
        setMatchIds(null);
      } finally {
        setSearching(false);
      }
    }, 180);
    return () => clearTimeout(handle);
  }, [q]);
  useEffect(() => {
    const onClick = (e) => {
      if (acRef.current && !acRef.current.contains(e.target)) setAcOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const save = async () => {
    if (!draft.name || !draft.category) {
      toast({ title: "Название и категория обязательны", variant: "destructive" });
      return;
    }
    const payload = { ...draft };
    if (draft.price_override != null && draft.price_override !== "") {
      payload.price_updated_at = (/* @__PURE__ */ new Date()).toISOString();
      if (!payload.price_currency) payload.price_currency = "RUB";
    }
    if (draft.id) {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("treatment_catalog").update(rest).eq("id", id);
      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase.from("treatment_catalog").insert(payload);
      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        return;
      }
    }
    setEditOpen(false);
    setDraft(empty);
    toast({ title: "Сохранено" });
    load();
  };
  const startEdit = (r) => {
    setDraft(r);
    setEditOpen(true);
  };
  const startNew = () => {
    setDraft(empty);
    setEditOpen(true);
  };
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && rows.length) {
      const r = rows.find((x) => x.id === editId);
      if (r) {
        startEdit(r);
        searchParams.delete("edit");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [rows, searchParams, setSearchParams]);
  const qLower = q.trim().toLowerCase();
  const matchesSubstring = (r) => {
    if (!qLower) return true;
    const hay = [r.name, r.inn, r.notes, r.subcategory].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(qLower);
  };
  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.category !== filter) return false;
    if (onlyMissingPrice && effectivePrice(r) != null) return false;
    if (qLower) {
      if (matchIds) {
        if (!matchIds.has(r.id) && !matchesSubstring(r)) return false;
      } else if (!matchesSubstring(r)) {
        return false;
      }
    }
    return true;
  });
  const suggestions = qLower ? filtered.slice(0, 5) : [];
  const renderHighlighted = (text) => {
    const s = text || "";
    if (!qLower) return s;
    const tokens = qLower.split(/\s+/).filter((t) => t.length >= 2);
    if (!tokens.length) return s;
    const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const splitter = new RegExp(`(${escaped})`, "gi");
    const tester = new RegExp(`^(?:${escaped})$`, "i");
    const parts = s.split(splitter);
    return parts.map(
      (p, i) => tester.test(p) ? /* @__PURE__ */ jsx("mark", { className: "bg-amber-200/70 dark:bg-amber-500/30 text-inherit rounded px-0.5", children: p }, i) : /* @__PURE__ */ jsx("span", { children: p }, i)
    );
  };
  if (loading || !user) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-6", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/admin/treatment-plans", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        "К листам назначений"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4 flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Каталог вмешательств" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            rows.length,
            " позиций · 12 категорий"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs(Button, { onClick: refreshAllPrices, disabled: batchBusy, variant: "outline", className: "gap-2", children: [
            batchBusy ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
            "Обновить цены (20)"
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: () => setImportOpen(true), variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
            "Импорт CSV"
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: exportCsv, variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
            "Экспорт CSV"
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: startNew, className: "gap-2", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            "Новая позиция"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 mb-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap items-center", children: [
          /* @__PURE__ */ jsxs("div", { ref: acRef, className: "relative w-full max-w-md", children: [
            /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: q,
                onChange: (e) => {
                  setQ(e.target.value);
                  setAcOpen(true);
                },
                onFocus: () => setAcOpen(true),
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    pushHistory(q);
                    setAcOpen(false);
                  } else if (e.key === "Escape") {
                    setAcOpen(false);
                  }
                },
                placeholder: "Поиск: название, МНН, заметки, теги…",
                className: "pl-8 pr-8"
              }
            ),
            q && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  setQ("");
                  setAcOpen(false);
                },
                className: "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
                "aria-label": "Очистить",
                children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
              }
            ),
            searching && /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground" }),
            acOpen && qLower && suggestions.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute z-20 left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden", children: suggestions.map((s) => {
              const section = SECTIONS.find((x) => x.key === s.category);
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "block w-full text-left px-3 py-2 hover:bg-accent text-sm",
                  onClick: () => {
                    setQ(s.name);
                    pushHistory(s.name);
                    setAcOpen(false);
                  },
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "font-medium truncate", children: renderHighlighted(s.name) }),
                    /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
                      section == null ? void 0 : section.short,
                      s.inn ? ` · ${s.inn}` : ""
                    ] })
                  ]
                },
                s.id
              );
            }) })
          ] }),
          /* @__PURE__ */ jsxs(Select, { value: filter, onValueChange: (v) => setFilter(v), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "max-w-xs", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Все категории" }),
              SECTIONS.map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s.key, children: s.label }, s.key))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(Switch, { checked: onlyMissingPrice, onCheckedChange: setOnlyMissingPrice }),
            /* @__PURE__ */ jsx(Wallet, { className: "w-3.5 h-3.5" }),
            "Только без цены"
          ] }),
          qLower && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            "Найдено: ",
            filtered.length
          ] })
        ] }),
        history.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5 flex-wrap items-center text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Недавние:" }),
          history.map((h) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setQ(h);
                setAcOpen(false);
              },
              className: "px-2 py-0.5 rounded-full border border-border bg-muted/40 hover:bg-accent transition-colors",
              children: h
            },
            h
          )),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: clearHistory,
              className: "text-muted-foreground hover:text-foreground ml-1",
              title: "Очистить историю",
              children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
            }
          )
        ] })
      ] }),
      busy ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-10", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-primary" }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: filtered.map((r) => {
        const section = SECTIONS.find((s) => s.key === r.category);
        const Icon = section == null ? void 0 : section.icon;
        const pref = r.price_source_preference || "auto";
        const eff = effectivePrice(r);
        const usingAuto = pref !== "manual" && r.price_auto != null;
        const freshSrc = usingAuto ? r.price_auto_updated_at : r.price_updated_at;
        const fr = priceFreshness(freshSrc);
        const frInfo = FRESHNESS_STYLES[fr];
        return /* @__PURE__ */ jsx(Card, { className: r.is_active ? "" : "opacity-60", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 flex items-center justify-between gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              Icon && /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4 text-primary" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: renderHighlighted(r.name) }),
              r.inn && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "(",
                renderHighlighted(r.inn),
                ")"
              ] }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: section == null ? void 0 : section.short }),
              r.is_rx && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: "Rx" }),
              r.is_off_label && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] gap-1", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { className: "w-2.5 h-2.5" }),
                "off-label"
              ] }),
              r.light_sensitive && /* @__PURE__ */ jsx(Sun, { className: "w-3.5 h-3.5 text-amber-500" }),
              r.glucose_only && /* @__PURE__ */ jsx(Beaker, { className: "w-3.5 h-3.5 text-blue-500" }),
              !r.is_active && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px]", children: "не активна" }),
              eff != null ? /* @__PURE__ */ jsxs("span", { title: `${usingAuto ? "Авто" : "Ручная"} · ${frInfo.label}`, className: "inline-flex items-center gap-1 text-xs", children: [
                /* @__PURE__ */ jsx("span", { className: `inline-block w-2 h-2 rounded-full ${frInfo.dot}` }),
                usingAuto ? /* @__PURE__ */ jsx(Bot, { className: "w-3 h-3 text-muted-foreground" }) : /* @__PURE__ */ jsx(Hand, { className: "w-3 h-3 text-muted-foreground" }),
                formatRub(eff)
              ] }) : /* @__PURE__ */ jsxs("span", { title: "цена не задана", className: "inline-flex items-center gap-1 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { className: `inline-block w-2 h-2 rounded-full ${frInfo.dot}` }),
                "без цены"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
              r.form ? `${r.form} · ` : "",
              r.default_dose ? `${r.default_dose} ${r.dose_unit || ""} · ` : "",
              r.default_frequency ? `${r.default_frequency} · ` : "",
              r.default_duration_days ? `${r.default_duration_days} дн.` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => startEdit(r), children: /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4" }) })
        ] }) }, r.id);
      }) })
    ] }),
    /* @__PURE__ */ jsx(Sheet, { open: editOpen, onOpenChange: setEditOpen, children: /* @__PURE__ */ jsxs(SheetContent, { className: "w-full sm:max-w-xl overflow-y-auto", children: [
      /* @__PURE__ */ jsx(SheetHeader, { children: /* @__PURE__ */ jsx(SheetTitle, { children: draft.id ? "Редактировать позицию" : "Новая позиция" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 py-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Категория *" }),
          /* @__PURE__ */ jsxs(Select, { value: draft.category, onValueChange: (v) => setDraft((d) => ({ ...d, category: v })), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: SECTIONS.map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s.key, children: s.label }, s.key)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Название *" }),
            /* @__PURE__ */ jsx(Input, { value: draft.name ?? "", onChange: (e) => setDraft((d) => ({ ...d, name: e.target.value })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "МНН" }),
            /* @__PURE__ */ jsx(Input, { value: draft.inn ?? "", onChange: (e) => setDraft((d) => ({ ...d, inn: e.target.value })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Подкатегория" }),
            /* @__PURE__ */ jsx(Input, { value: draft.subcategory ?? "", onChange: (e) => setDraft((d) => ({ ...d, subcategory: e.target.value })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Форма" }),
            /* @__PURE__ */ jsx(Input, { value: draft.form ?? "", onChange: (e) => setDraft((d) => ({ ...d, form: e.target.value })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Доза" }),
            /* @__PURE__ */ jsx(Input, { type: "number", step: "any", value: draft.default_dose ?? "", onChange: (e) => setDraft((d) => ({ ...d, default_dose: e.target.value === "" ? null : Number(e.target.value) })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Ед." }),
            /* @__PURE__ */ jsx(Input, { value: draft.dose_unit ?? "", onChange: (e) => setDraft((d) => ({ ...d, dose_unit: e.target.value })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Разведение, мл" }),
            /* @__PURE__ */ jsx(Input, { type: "number", value: draft.default_dilution_volume ?? "", onChange: (e) => setDraft((d) => ({ ...d, default_dilution_volume: e.target.value === "" ? null : Number(e.target.value) })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Растворитель" }),
            /* @__PURE__ */ jsx(Input, { value: draft.default_dilution_solvent ?? "", onChange: (e) => setDraft((d) => ({ ...d, default_dilution_solvent: e.target.value })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Кратность" }),
            /* @__PURE__ */ jsx(Input, { value: draft.default_frequency ?? "", onChange: (e) => setDraft((d) => ({ ...d, default_frequency: e.target.value })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Дней" }),
            /* @__PURE__ */ jsx(Input, { type: "number", value: draft.default_duration_days ?? "", onChange: (e) => setDraft((d) => ({ ...d, default_duration_days: e.target.value === "" ? null : Number(e.target.value) })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Скорость инфузии" }),
            /* @__PURE__ */ jsx(Input, { value: draft.infusion_rate ?? "", onChange: (e) => setDraft((d) => ({ ...d, infusion_rate: e.target.value })) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Заметка / инструкция" }),
          /* @__PURE__ */ jsx(Textarea, { value: draft.notes ?? "", onChange: (e) => setDraft((d) => ({ ...d, notes: e.target.value })), rows: 2 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border/60 bg-muted/30 p-3 space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-semibold text-sm", children: [
            /* @__PURE__ */ jsx(Wallet, { className: "w-4 h-4 text-primary" }),
            "💰 Стоимость",
            draft.price_updated_at && /* @__PURE__ */ jsxs("span", { className: "ml-auto inline-flex items-center gap-1 text-[11px] font-normal text-muted-foreground", children: [
              /* @__PURE__ */ jsx("span", { className: `inline-block w-2 h-2 rounded-full ${FRESHNESS_STYLES[priceFreshness(draft.price_updated_at)].dot}` }),
              "обновлено ",
              new Date(draft.price_updated_at).toLocaleDateString("ru-RU")
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Цена за упаковку, ₽" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "number",
                  step: "any",
                  value: draft.price_override ?? "",
                  onChange: (e) => setDraft((d) => ({ ...d, price_override: e.target.value === "" ? null : Number(e.target.value) }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Единиц в упаковке" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "number",
                  step: "any",
                  placeholder: "напр. 30 (таб.)",
                  value: draft.pack_size_num ?? "",
                  onChange: (e) => setDraft((d) => ({ ...d, pack_size_num: e.target.value === "" ? null : Number(e.target.value) }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Единиц на приём" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "number",
                  step: "any",
                  placeholder: "обычно 1",
                  value: draft.units_per_dose_num ?? "",
                  onChange: (e) => setDraft((d) => ({ ...d, units_per_dose_num: e.target.value === "" ? null : Number(e.target.value) }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "col-span-3", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Источник цены (примечание)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  placeholder: "напр. apteka.ru, средняя по Москве",
                  value: draft.price_source_note ?? "",
                  onChange: (e) => setDraft((d) => ({ ...d, price_source_note: e.target.value }))
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Цена используется в расчёте ориентировочной стоимости курса. Поле «единиц на приём» помогает корректно посчитать число упаковок при делении/удвоении доз." }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border/60 bg-background p-2 space-y-2 mt-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold", children: [
              /* @__PURE__ */ jsx(Bot, { className: "w-3.5 h-3.5 text-primary" }),
              "Источник цены"
            ] }),
            /* @__PURE__ */ jsxs(
              RadioGroup,
              {
                value: draft.price_source_preference || "auto",
                onValueChange: (v) => setDraft((d) => ({ ...d, price_source_preference: v })),
                className: "flex gap-4",
                children: [
                  /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 text-xs cursor-pointer", children: [
                    /* @__PURE__ */ jsx(RadioGroupItem, { value: "auto", id: "src-auto" }),
                    /* @__PURE__ */ jsx("span", { children: "🤖 Авто (парсинг)" })
                  ] }),
                  /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 text-xs cursor-pointer", children: [
                    /* @__PURE__ */ jsx(RadioGroupItem, { value: "manual", id: "src-manual" }),
                    /* @__PURE__ */ jsx("span", { children: "✋ Ручная цена" })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Поисковый запрос (по умолчанию — название)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  placeholder: draft.name || "напр. Виагра 50 мг 4 таб.",
                  value: draft.parse_query ?? "",
                  onChange: (e) => setDraft((d) => ({ ...d, parse_query: e.target.value || null }))
                }
              )
            ] }),
            draft.price_auto != null && /* @__PURE__ */ jsxs("div", { className: "text-xs space-y-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Автоцена:" }),
                /* @__PURE__ */ jsx("span", { children: formatRub(draft.price_auto) }),
                draft.price_auto_updated_at && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                  "· ",
                  new Date(draft.price_auto_updated_at).toLocaleDateString("ru-RU")
                ] })
              ] }),
              Array.isArray(draft.price_auto_sources) && draft.price_auto_sources.length > 0 && /* @__PURE__ */ jsxs("details", { className: "text-[11px] text-muted-foreground", children: [
                /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer", children: [
                  "Источники (",
                  draft.price_auto_sources.length,
                  ")"
                ] }),
                /* @__PURE__ */ jsx("ul", { className: "pl-3 mt-1 space-y-0.5", children: draft.price_auto_sources.map((s, i) => /* @__PURE__ */ jsxs("li", { children: [
                  s.source,
                  ": ",
                  formatRub(s.price),
                  s.url && /* @__PURE__ */ jsx("a", { href: s.url, target: "_blank", rel: "noreferrer", className: "ml-1 underline", children: "↗" })
                ] }, i)) })
              ] })
            ] }),
            draft.id && /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "outline",
                type: "button",
                onClick: () => refreshPrice(draft.id),
                disabled: refreshingId === draft.id,
                className: "gap-1.5 text-xs h-7",
                children: [
                  refreshingId === draft.id ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3" }),
                  "Обновить автоцену сейчас"
                ]
              }
            )
          ] })
        ] }),
        draft.category === "procedure" && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border/60 bg-muted/30 p-3 space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm", children: "🪡 Протокол иглорефлексотерапии" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: draft.acupuncture_protocol_id || "none",
              onValueChange: (v) => setDraft((d) => ({ ...d, acupuncture_protocol_id: v === "none" ? null : v })),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Не привязан" }) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "none", children: "— Не привязан —" }),
                  acuProtocols.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p.id, children: p.name }, p.id))
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "При выборе протокола в листе назначений и памятке автоматически развернётся список точек, манипуляций и параметров сеансов." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4 pt-2", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(Switch, { checked: draft.is_rx ?? false, onCheckedChange: (v) => setDraft((d) => ({ ...d, is_rx: v })) }),
            "Rx (рецептурное)"
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(Switch, { checked: draft.is_off_label ?? false, onCheckedChange: (v) => setDraft((d) => ({ ...d, is_off_label: v })) }),
            "Off-label"
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(Switch, { checked: draft.light_sensitive ?? false, onCheckedChange: (v) => setDraft((d) => ({ ...d, light_sensitive: v })) }),
            "Защищать от света"
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(Switch, { checked: draft.glucose_only ?? false, onCheckedChange: (v) => setDraft((d) => ({ ...d, glucose_only: v })) }),
            "Только на глюкозе"
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(Switch, { checked: draft.is_active ?? true, onCheckedChange: (v) => setDraft((d) => ({ ...d, is_active: v })) }),
            "Активна"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(SheetFooter, { children: /* @__PURE__ */ jsx(Button, { onClick: save, children: "Сохранить" }) })
    ] }) }),
    /* @__PURE__ */ jsx(CsvImportDialog, { open: importOpen, onOpenChange: setImportOpen, onComplete: load })
  ] });
}
export {
  TreatmentCatalog as default
};
