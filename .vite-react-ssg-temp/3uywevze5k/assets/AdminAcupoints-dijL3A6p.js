import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useRef, useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogDescription, B as Button, b as Badge, L as Label, l as DialogFooter, t as toast, s as supabase, u as useAuth, I as Input, C as Card, a as CardContent, r as Checkbox, w as Sheet, y as SheetContent, z as SheetHeader, A as SheetTitle, V as SheetDescription } from "../main.mjs";
import { S as ScrollArea } from "./scroll-area-DtgkI4MV.js";
import { FileSpreadsheet, Upload, AlertTriangle, CheckCircle2, Loader2, Search, Check, ArrowLeft, MapPin, Plus, Zap, Flame, ExternalLink } from "lucide-react";
import { R as RadioGroup, a as RadioGroupItem } from "./radio-group-CM9YN36E.js";
import { p as parseCsv } from "./treatmentCsv-ieIKlxXA.js";
import { toast as toast$1 } from "sonner";
import "vite-react-ssg";
import "@tanstack/react-query";
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
import "@radix-ui/react-scroll-area";
import "@radix-ui/react-radio-group";
const KNOWN = /* @__PURE__ */ new Set([
  "who_code",
  "meridian_code",
  "pinyin",
  "chinese",
  "name_ru",
  "location_description",
  "depth_mm",
  "indications",
  "contraindications",
  "is_caution",
  "manipulation_default",
  "svg_marker_x",
  "svg_marker_y",
  "svg_view"
]);
const NUMERIC = /* @__PURE__ */ new Set(["svg_marker_x", "svg_marker_y"]);
const BOOL = /* @__PURE__ */ new Set(["is_caution"]);
const TRUE_VALS = /* @__PURE__ */ new Set(["1", "true", "да", "yes", "y", "+", "x", "✓"]);
const FALSE_VALS = /* @__PURE__ */ new Set(["", "0", "false", "нет", "no", "n", "-"]);
function AcupointsCsvImportDialog({ open, onOpenChange, onComplete }) {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [dup, setDup] = useState("update");
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
    let matrix = parseCsv(txt, ";");
    if (matrix.length && matrix[0].length < 2) matrix = parseCsv(txt, ",");
    if (matrix.length < 2) {
      toast({ title: "CSV пуст", variant: "destructive" });
      return;
    }
    const hdr = matrix[0].map((h) => h.trim());
    setHeaders(hdr);
    const parsed = matrix.slice(1).map((r, i) => {
      const errors = [];
      const warnings = [];
      const payload = {};
      let meridian_code;
      hdr.forEach((h, idx) => {
        const raw = (r[idx] ?? "").trim();
        if (!h) return;
        if (!KNOWN.has(h)) {
          if (raw) warnings.push(`unknown col ${h}`);
          return;
        }
        if (raw === "") return;
        if (h === "meridian_code") {
          meridian_code = raw;
          return;
        }
        if (NUMERIC.has(h)) {
          const v = Number(raw.replace(",", "."));
          if (!Number.isFinite(v)) {
            errors.push(`${h}: not number «${raw}»`);
            return;
          }
          payload[h] = v;
        } else if (BOOL.has(h)) {
          const lv = raw.toLowerCase();
          if (TRUE_VALS.has(lv)) payload[h] = true;
          else if (FALSE_VALS.has(lv)) payload[h] = false;
          else errors.push(`${h}: not bool «${raw}»`);
        } else {
          payload[h] = raw;
        }
      });
      if (!payload.who_code) errors.push("missing who_code");
      return { index: i + 2, payload, meridian_code, errors, warnings };
    });
    setRows(parsed);
  };
  const valid = useMemo(() => rows.filter((r) => r.errors.length === 0), [rows]);
  const invalid = useMemo(() => rows.filter((r) => r.errors.length > 0), [rows]);
  const preview = rows.slice(0, 10);
  const run = async () => {
    setRunning(true);
    const log = [];
    let created = 0, updated = 0, skipped = 0;
    try {
      const codes = Array.from(new Set(valid.map((r) => r.meridian_code).filter(Boolean)));
      const meridianMap = /* @__PURE__ */ new Map();
      if (codes.length) {
        const { data: mers } = await supabase.from("acupoint_meridians").select("id, code").in("code", codes);
        (mers || []).forEach((m) => meridianMap.set(m.code, m.id));
      }
      const allCodes = valid.map((r) => r.payload.who_code);
      const existing = /* @__PURE__ */ new Set();
      if (allCodes.length) {
        const { data: ex } = await supabase.from("acupoints").select("who_code").in("who_code", allCodes);
        (ex || []).forEach((e) => existing.add(e.who_code));
      }
      for (const r of valid) {
        try {
          const p = { ...r.payload };
          if (r.meridian_code) {
            const mid = meridianMap.get(r.meridian_code);
            if (mid) p.meridian_id = mid;
            else log.push({ row: r.index, msg: `unknown meridian_code ${r.meridian_code}` });
          }
          const exists = existing.has(p.who_code);
          if (exists) {
            if (dup === "skip") {
              skipped++;
              continue;
            }
            const { error } = await supabase.from("acupoints").update(p).eq("who_code", p.who_code);
            if (error) log.push({ row: r.index, msg: error.message });
            else updated++;
          } else {
            const { error } = await supabase.from("acupoints").insert(p);
            if (error) log.push({ row: r.index, msg: error.message });
            else created++;
          }
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
        "Импорт CSV акупунктурных точек"
      ] }),
      /* @__PURE__ */ jsxs(DialogDescription, { children: [
        "UTF-8, разделитель «;» или «,». Ключ: ",
        /* @__PURE__ */ jsx("b", { children: "who_code" }),
        ". Колонки: meridian_code, pinyin, chinese, name_ru, location_description, depth_mm, indications, contraindications, is_caution, manipulation_default, svg_marker_x, svg_marker_y, svg_view."
      ] })
    ] }),
    !rows.length && !result && /* @__PURE__ */ jsxs("div", { className: "border-2 border-dashed rounded-lg p-8 text-center space-y-3", children: [
      /* @__PURE__ */ jsx(Upload, { className: "w-10 h-10 mx-auto text-muted-foreground" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Выберите CSV-файл точек (v9)" }),
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
          "всего: ",
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
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { className: "text-sm font-semibold", children: "При совпадении по who_code:" }),
        /* @__PURE__ */ jsx(RadioGroup, { value: dup, onValueChange: (v) => setDup(v), className: "mt-2 grid grid-cols-2 gap-2", children: [
          { v: "update", l: "Обновить", d: "перезаписать поля (рекомендуется)" },
          { v: "skip", l: "Пропустить", d: "не трогать существующие" }
        ].map((o) => /* @__PURE__ */ jsxs("label", { className: `border rounded-md p-2 cursor-pointer flex items-start gap-2 text-sm ${dup === o.v ? "border-primary bg-primary/5" : ""}`, children: [
          /* @__PURE__ */ jsx(RadioGroupItem, { value: o.v, className: "mt-0.5" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: o.l }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: o.d })
          ] })
        ] }, o.v)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold mb-2", children: "Превью (первые 10):" }),
        /* @__PURE__ */ jsx("div", { className: "border rounded overflow-x-auto max-h-64", children: /* @__PURE__ */ jsxs("table", { className: "text-xs w-full", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-muted sticky top-0", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "№" }),
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "who_code" }),
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "мерид." }),
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "pinyin" }),
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "name_ru" }),
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "SVG" }),
            /* @__PURE__ */ jsx("th", { className: "px-2 py-1 text-left", children: "статус" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: preview.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.index }),
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1 font-mono", children: r.payload.who_code || "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.meridian_code || "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.payload.pinyin || "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.payload.name_ru || "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.payload.svg_marker_x != null ? `${r.payload.svg_marker_x},${r.payload.svg_marker_y ?? "?"}` : "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-2 py-1", children: r.errors.length ? /* @__PURE__ */ jsx("span", { className: "text-destructive", children: r.errors[0] }) : /* @__PURE__ */ jsx("span", { className: "text-green-600 dark:text-green-400", children: "OK" }) })
          ] }, r.index)) })
        ] }) })
      ] }),
      invalid.length > 0 && /* @__PURE__ */ jsxs("details", { className: "text-xs", children: [
        /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-destructive font-medium", children: [
          "Строки с ошибками (",
          invalid.length,
          ")"
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-0.5 max-h-40 overflow-y-auto", children: invalid.slice(0, 50).map((r) => /* @__PURE__ */ jsxs("li", { children: [
          "стр. ",
          r.index,
          ": ",
          r.errors.join("; ")
        ] }, r.index)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsx("div", { children: "Импорт выполняется построчно. Для 300+ точек может занять до минуты." })
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
          valid.length
        ] })
      ] }),
      result && /* @__PURE__ */ jsx(Button, { onClick: () => {
        onOpenChange(false);
        reset();
      }, children: "Закрыть" })
    ] })
  ] }) });
}
function AddPointToProtocolDialog({
  open,
  onOpenChange,
  pointId,
  pointWhoCode,
  defaultManipulation,
  onAdded
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [savingId, setSavingId] = useState(null);
  useEffect(() => {
    if (!open || !user) return;
    setBusy(true);
    (async () => {
      const { data } = await supabase.from("acupuncture_protocols").select("id,name,is_template,created_by").eq("is_archived", false).eq("is_template", false).eq("created_by", user.id).order("name");
      setList(data || []);
      setBusy(false);
    })();
  }, [open, user]);
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return qq ? list.filter((p) => p.name.toLowerCase().includes(qq)) : list;
  }, [list, q]);
  const addToProtocol = async (protocolId) => {
    setSavingId(protocolId);
    try {
      const { data: maxRow } = await supabase.from("acupuncture_protocol_points").select("order_index").eq("protocol_id", protocolId).order("order_index", { ascending: false }).limit(1).maybeSingle();
      const nextIdx = ((maxRow == null ? void 0 : maxRow.order_index) ?? -1) + 1;
      const { error } = await supabase.from("acupuncture_protocol_points").insert({
        protocol_id: protocolId,
        acupoint_id: pointId,
        order_index: nextIdx,
        manipulation: defaultManipulation || null,
        side: "bilateral"
      });
      if (error) throw error;
      toast$1.success(`Точка ${pointWhoCode} добавлена в протокол`);
      onAdded == null ? void 0 : onAdded();
      onOpenChange(false);
    } catch (e) {
      toast$1.error("Не удалось добавить", { description: e == null ? void 0 : e.message });
    } finally {
      setSavingId(null);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { children: [
        "Добавить точку ",
        pointWhoCode,
        " в протокол"
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Только ваши пользовательские протоколы. Манипуляция предзаполнится из «по умолчанию» точки." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          autoFocus: true,
          placeholder: "Поиск по названию...",
          value: q,
          onChange: (e) => setQ(e.target.value),
          className: "pl-9 h-9"
        }
      )
    ] }),
    /* @__PURE__ */ jsx(ScrollArea, { className: "h-[320px]", children: busy ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-10", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin text-muted-foreground" }) }) : filtered.length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-10 text-center text-sm text-muted-foreground", children: list.length === 0 ? "У вас пока нет пользовательских протоколов" : "Ничего не найдено" }) : /* @__PURE__ */ jsx("ul", { className: "divide-y", children: filtered.map((p) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between gap-2 py-2 px-1", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm", children: p.name }),
      /* @__PURE__ */ jsx(
        Button,
        {
          size: "sm",
          variant: "outline",
          disabled: savingId === p.id,
          onClick: () => addToProtocol(p.id),
          children: savingId === p.id ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Check, { className: "w-3 h-3 mr-1" }),
            "Добавить"
          ] })
        }
      )
    ] }, p.id)) }) })
  ] }) });
}
function AdminAcupoints() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { who_code } = useParams();
  const [busy, setBusy] = useState(true);
  const [meridians, setMeridians] = useState([]);
  const [points, setPoints] = useState([]);
  const [q, setQ] = useState("");
  const [selectedMeridian, setSelectedMeridian] = useState(null);
  const [onlyCaution, setOnlyCaution] = useState(false);
  const [openPoint, setOpenPoint] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [usage, setUsage] = useState([]);
  const [usageBusy, setUsageBusy] = useState(false);
  const [addToProtoOpen, setAddToProtoOpen] = useState(false);
  const reloadPoints = async () => {
    const { data } = await supabase.from("acupoints").select("*").order("who_code");
    setPoints(data || []);
  };
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/acupoints" } });
    }
  }, [user, isAdmin, loading, navigate]);
  useEffect(() => {
    (async () => {
      setBusy(true);
      const [m, p] = await Promise.all([
        supabase.from("acupoint_meridians").select("*").order("code"),
        supabase.from("acupoints").select("*").order("who_code")
      ]);
      setMeridians(m.data || []);
      setPoints(p.data || []);
      setBusy(false);
    })();
  }, []);
  const loadUsageForPoint = async (acupointId) => {
    setUsageBusy(true);
    setUsage([]);
    try {
      const { data, error } = await supabase.from("acupuncture_protocol_points").select(`
          manipulation, ea_freq_hz, ea_duration_min, moxa, ea_pair_with,
          protocol:acupuncture_protocols!inner(id, name, is_template, is_archived),
          pair:acupoints!acupuncture_protocol_points_ea_pair_with_fkey(who_code)
        `).eq("acupoint_id", acupointId);
      if (error) throw error;
      const rows = (data || []).filter((r) => {
        var _a;
        return !((_a = r.protocol) == null ? void 0 : _a.is_archived);
      }).map((r) => {
        var _a;
        return {
          protocol_id: r.protocol.id,
          protocol_name: r.protocol.name,
          is_template: !!r.protocol.is_template,
          point_manipulation: r.manipulation,
          ea_freq_hz: r.ea_freq_hz,
          ea_duration_min: r.ea_duration_min,
          moxa: !!r.moxa,
          ea_pair_who_code: ((_a = r.pair) == null ? void 0 : _a.who_code) || null
        };
      }).sort((a, b) => {
        if (a.is_template !== b.is_template) return a.is_template ? -1 : 1;
        return a.protocol_name.localeCompare(b.protocol_name, "ru");
      });
      setUsage(rows);
    } finally {
      setUsageBusy(false);
    }
  };
  useEffect(() => {
    if (openPoint) loadUsageForPoint(openPoint.id);
    else setUsage([]);
  }, [openPoint]);
  useEffect(() => {
    if (who_code && points.length) {
      const found = points.find((pt) => pt.who_code === who_code);
      if (found) setOpenPoint(found);
    }
  }, [who_code, points]);
  const meridianById = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    meridians.forEach((x) => m.set(x.id, x));
    return m;
  }, [meridians]);
  const meridianCounts = useMemo(() => {
    const c = /* @__PURE__ */ new Map();
    points.forEach((p) => {
      if (p.meridian_id) c.set(p.meridian_id, (c.get(p.meridian_id) || 0) + 1);
    });
    return c;
  }, [points]);
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return points.filter((p) => {
      if (selectedMeridian && p.meridian_id !== selectedMeridian) return false;
      if (onlyCaution && !p.is_caution) return false;
      if (!qq) return true;
      const hay = [
        p.who_code,
        p.pinyin || "",
        p.name_ru || "",
        p.chinese || "",
        p.indications || "",
        p.location_description || ""
      ].join(" ").toLowerCase();
      return hay.includes(qq);
    });
  }, [points, q, selectedMeridian, onlyCaution]);
  const usageBuiltin = useMemo(() => usage.filter((u) => u.is_template), [usage]);
  const usageCustom = useMemo(() => usage.filter((u) => !u.is_template), [usage]);
  const formatParams = (u) => {
    const parts = [];
    if (u.ea_freq_hz != null && u.ea_duration_min != null) {
      parts.push(`ЭАП ${u.ea_freq_hz} Гц × ${u.ea_duration_min} мин`);
    } else if (u.ea_freq_hz != null) {
      parts.push(`ЭАП ${u.ea_freq_hz} Гц`);
    }
    if (u.ea_pair_who_code) parts.push(`↔ ${u.ea_pair_who_code}`);
    if (u.moxa) parts.push("🔥 мокса");
    return parts.join(" · ");
  };
  if (loading || busy) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-muted-foreground" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto p-4 md:p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4 gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Link, { to: "/admin/treatment-plans", children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "gap-2", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
            " К листам назначений"
          ] }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-semibold flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-6 h-6 text-primary" }),
              " Каталог акупунктурных точек"
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
              meridians.length,
              " меридианов · ",
              points.length,
              " точек · WHO 2008 + Deadman"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", onClick: () => setImportOpen(true), children: [
            /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
            "Импорт CSV"
          ] }),
          /* @__PURE__ */ jsx(Link, { to: "/admin/acupoints/atlas", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4" }),
            "Атлас"
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: "/admin/acupuncture-protocols", children: /* @__PURE__ */ jsxs(Button, { size: "sm", className: "gap-2", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4" }),
            "Протоколы"
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(AcupointsCsvImportDialog, { open: importOpen, onOpenChange: setImportOpen, onComplete: reloadPoints }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-[280px_1fr] gap-4", children: [
        /* @__PURE__ */ jsx(Card, { className: "md:sticky md:top-4 md:self-start", children: /* @__PURE__ */ jsx(CardContent, { className: "p-2", children: /* @__PURE__ */ jsxs(ScrollArea, { className: "md:h-[calc(100vh-160px)]", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setSelectedMeridian(null),
              className: `w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!selectedMeridian ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`,
              children: [
                "Все меридианы (",
                points.length,
                ")"
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "mt-1 space-y-0.5", children: meridians.map((m) => {
            const cnt = meridianCounts.get(m.id) || 0;
            const isSel = selectedMeridian === m.id;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setSelectedMeridian(m.id),
                className: `w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${isSel ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`,
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                    /* @__PURE__ */ jsxs("span", { children: [
                      /* @__PURE__ */ jsx("span", { className: "font-mono font-semibold", children: m.code }),
                      /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs opacity-80", children: m.name_ru })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs opacity-70", children: cnt })
                  ] }),
                  m.channel_type && /* @__PURE__ */ jsx("div", { className: "text-[10px] opacity-60 mt-0.5", children: m.channel_type })
                ]
              },
              m.id
            );
          }) })
        ] }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  autoFocus: true,
                  placeholder: "Поиск: WHO-код, пиньинь, RU, показания...",
                  value: q,
                  onChange: (e) => setQ(e.target.value),
                  className: "pl-9 h-9"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
              /* @__PURE__ */ jsx(Checkbox, { checked: onlyCaution, onCheckedChange: (v) => setOnlyCaution(!!v) }),
              "Только caution"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
              filtered.length,
              " точек"
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "text-left p-2 font-semibold", children: "WHO" }),
              /* @__PURE__ */ jsx("th", { className: "text-left p-2 font-semibold", children: "Пиньинь" }),
              /* @__PURE__ */ jsx("th", { className: "text-left p-2 font-semibold", children: "RU" }),
              /* @__PURE__ */ jsx("th", { className: "text-left p-2 font-semibold hidden md:table-cell", children: "Меридиан" }),
              /* @__PURE__ */ jsx("th", { className: "text-left p-2 font-semibold hidden lg:table-cell", children: "Локализация" }),
              /* @__PURE__ */ jsx("th", { className: "text-left p-2 font-semibold w-12" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: filtered.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-6 text-center text-muted-foreground", children: "Ничего не найдено" }) }) : filtered.map((p) => {
              const m = p.meridian_id ? meridianById.get(p.meridian_id) : null;
              return /* @__PURE__ */ jsxs(
                "tr",
                {
                  onClick: () => setOpenPoint(p),
                  className: "border-t hover:bg-muted/40 cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx("td", { className: "p-2 font-mono font-semibold text-primary", children: p.who_code }),
                    /* @__PURE__ */ jsxs("td", { className: "p-2", children: [
                      p.pinyin,
                      p.chinese && /* @__PURE__ */ jsx("span", { className: "ml-1 text-muted-foreground", children: p.chinese })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "p-2", children: p.name_ru }),
                    /* @__PURE__ */ jsx("td", { className: "p-2 hidden md:table-cell text-xs text-muted-foreground", children: m ? `${m.code} · ${m.name_ru}` : "—" }),
                    /* @__PURE__ */ jsx("td", { className: "p-2 hidden lg:table-cell text-xs text-muted-foreground max-w-[300px] truncate", children: p.location_description }),
                    /* @__PURE__ */ jsx("td", { className: "p-2", children: p.is_caution && /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-amber-500" }) })
                  ]
                },
                p.id
              );
            }) })
          ] }) }) }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Sheet, { open: !!openPoint, onOpenChange: (o) => !o && setOpenPoint(null), children: /* @__PURE__ */ jsx(SheetContent, { side: "right", className: "w-full sm:max-w-xl overflow-y-auto", children: openPoint && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(SheetHeader, { children: [
        /* @__PURE__ */ jsxs(SheetTitle, { className: "text-2xl", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono text-primary", children: openPoint.who_code }),
          openPoint.name_ru && /* @__PURE__ */ jsxs("span", { className: "ml-2", children: [
            "— ",
            openPoint.name_ru
          ] })
        ] }),
        /* @__PURE__ */ jsxs(SheetDescription, { children: [
          openPoint.pinyin,
          " ",
          openPoint.chinese && `· ${openPoint.chinese}`
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-4", children: [
        openPoint.meridian_id && (() => {
          const m = meridianById.get(openPoint.meridian_id);
          if (!m) return null;
          return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
              m.code,
              " · ",
              m.name_ru
            ] }),
            m.channel_type && /* @__PURE__ */ jsx(Badge, { variant: "outline", children: m.channel_type }),
            m.polarity && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: m.polarity === "yin" ? "border-blue-500/50 text-blue-600 dark:text-blue-400" : m.polarity === "yang" ? "border-orange-500/50 text-orange-600 dark:text-orange-400" : "", children: m.polarity })
          ] });
        })(),
        (openPoint.is_caution || openPoint.contraindications) && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-semibold text-destructive mb-1", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4" }),
            " Внимание / противопоказания"
          ] }),
          openPoint.is_caution && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mb-1", children: "Caution-точка: интимная зона / требует особого внимания" }),
          openPoint.contraindications && /* @__PURE__ */ jsx("div", { className: "whitespace-pre-wrap", children: openPoint.contraindications })
        ] }),
        openPoint.location_description && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase text-muted-foreground mb-1", children: "Локализация" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm whitespace-pre-wrap", children: openPoint.location_description })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          openPoint.depth_mm && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase text-muted-foreground mb-1", children: "Глубина введения" }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
              openPoint.depth_mm,
              " мм"
            ] })
          ] }),
          openPoint.manipulation_default && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase text-muted-foreground mb-1", children: "Манипуляция" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm", children: openPoint.manipulation_default })
          ] })
        ] }),
        openPoint.indications && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase text-muted-foreground mb-1", children: "Показания" }),
          /* @__PURE__ */ jsx("div", { className: "text-sm whitespace-pre-wrap", children: openPoint.indications })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold uppercase text-muted-foreground", children: [
              "Упоминается в протоколах (",
              usage.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "h-7 gap-1", onClick: () => setAddToProtoOpen(true), children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" }),
              "Добавить в протокол"
            ] })
          ] }),
          usageBusy ? /* @__PURE__ */ jsx("div", { className: "py-4 flex justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin text-muted-foreground" }) }) : usage.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Точка пока не входит ни в один протокол" }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: [
            { label: "Встроенные", rows: usageBuiltin },
            { label: "Пользовательские", rows: usageCustom }
          ].filter((g) => g.rows.length > 0).map((g) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "text-[11px] font-semibold uppercase text-muted-foreground mb-1", children: [
              g.label,
              " (",
              g.rows.length,
              ")"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "rounded-md border overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-muted/50", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "text-left p-2 font-semibold", children: "Протокол" }),
                /* @__PURE__ */ jsx("th", { className: "text-left p-2 font-semibold", children: "Манипуляция" }),
                /* @__PURE__ */ jsx("th", { className: "text-left p-2 font-semibold", children: "Параметры" }),
                /* @__PURE__ */ jsx("th", { className: "p-2 w-10" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: g.rows.map((r, i) => {
                const params = formatParams(r);
                return /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
                  /* @__PURE__ */ jsx("td", { className: "p-2", children: r.protocol_name }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-muted-foreground", children: r.point_manipulation || "—" }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-muted-foreground", children: params ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
                    r.ea_freq_hz != null && /* @__PURE__ */ jsx(Zap, { className: "w-3 h-3 text-amber-500" }),
                    r.moxa && /* @__PURE__ */ jsx(Flame, { className: "w-3 h-3 text-orange-500" }),
                    params
                  ] }) : "—" }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-right", children: /* @__PURE__ */ jsx(Link, { to: `/admin/acupuncture-protocols/${r.protocol_id}#point-${openPoint.id}`, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-7 px-2", children: /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }) }) }) })
                ] }, r.protocol_id + i);
              }) })
            ] }) })
          ] }, g.label)) })
        ] }),
        openPoint && /* @__PURE__ */ jsx(
          AddPointToProtocolDialog,
          {
            open: addToProtoOpen,
            onOpenChange: setAddToProtoOpen,
            pointId: openPoint.id,
            pointWhoCode: openPoint.who_code,
            defaultManipulation: openPoint.manipulation_default,
            onAdded: () => loadUsageForPoint(openPoint.id)
          }
        )
      ] })
    ] }) }) })
  ] });
}
export {
  AdminAcupoints as default
};
