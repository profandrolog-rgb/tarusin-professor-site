var _a;
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import { s as supabase, B as Button, L as Label, I as Input, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogDescription, T as Textarea, l as DialogFooter, b as Badge, t as toast$1, n as cn, r as Checkbox, u as useAuth, C as Card, O as DropdownMenu, Q as DropdownMenuTrigger, R as DropdownMenuContent, U as DropdownMenuItem } from "../main.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { S as ScrollArea } from "./scroll-area-DtgkI4MV.js";
import { Save, Star, Trash2, RotateCcw, ChevronUp, ChevronDown, ExternalLink, FileText, Sparkles, Loader2, Quote, Copy, Search, Upload, FileArchive, Image, X, AlertCircle, CheckCircle2, Activity, RefreshCw, ChevronRight, Check, Circle, Pill, ArrowRight, Send, History, Users, ListPlus, User, UserX, Plus, FolderPlus, FolderOpen, Folder, MoreVertical, Pencil, Zap, Brain, Volume2, VolumeX, Settings, Lock, Bot, Download, FileCode2, FileType2, FileDown, ZoomIn, Copyright, Printer, BookmarkPlus, Layers, Globe, Square, Paperclip, Mic, FolderInput } from "lucide-react";
import { u as useOpenRouterModels, a as useVeniceModels, f as formatPricePerMtok, C as CURATED_MODELS, r as resolveCuratedModel, D as DEFAULT_MODEL_KEY, i as isSoundEnabled, m as modelSupportsAttachments, s as setSoundEnabled, b as buildModelTooltip, p as playCompletionChime } from "./useVeniceModels-DMUkrrnd.js";
import { toast } from "sonner";
import { A as Accordion, a as AccordionItem, b as AccordionTrigger, c as AccordionContent } from "./accordion-CN1jpepQ.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-C_8nSrct.js";
import { f as fileSaver } from "./FileSaver.min-DtJWvt7f.js";
import { marked } from "marked";
import { Paragraph, HeadingLevel, AlignmentType, TextRun, Document, Packer } from "docx";
import { S as Switch } from "./switch-D2b9t4DD.js";
import { C as ChatMarkdown, a as ChatMarkdownWith } from "./ChatMarkdown-B1_X8k9E.js";
import { P as Progress } from "./progress-Y5q1JT93.js";
import { S as SEVERITY_LABEL, r as runAggregation } from "./aggregator-U0tC1iI4.js";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { i as getActiveContext, j as getRecentContexts, k as subscribeActiveContext, m as sendFragmentToProtocol, e as pushPendingRxItems, n as sendPlanItemsToProtocol } from "./protocolBridge-4TuhSmsW.js";
import { a as SECTIONS } from "./sections-BdvyTZRY.js";
import { b as bucketForPlanItem, V as VISIT_BUCKET_LABEL, n as normalizeImportedProtocolData } from "./applyPlanItemsToAssignments-DFGkeYbc.js";
import { P as PatientConfirmationBanner, R as RxItemsPreviewDialog, a as PatientPickerPopover } from "./RxItemsPreviewDialog-DH8JlDo_.js";
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
import "@radix-ui/react-select";
import "@radix-ui/react-scroll-area";
import "@radix-ui/react-accordion";
import "@radix-ui/react-popover";
import "@radix-ui/react-switch";
import "react-markdown";
import "remark-gfm";
import "rehype-raw";
import "rehype-sanitize";
import "@radix-ui/react-progress";
import "./tabs-CJYPrMmK.js";
import "@radix-ui/react-tabs";
const { saveAs: saveAs$1 } = fileSaver;
const ts$1 = () => {
  const d = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
function messagesToMarkdown(messages, title = "Кабинет — диалог") {
  const lines = [`# ${title}`, "", `_${(/* @__PURE__ */ new Date()).toLocaleString("ru-RU")}_`, ""];
  for (const m of messages) {
    if (!m.content) continue;
    lines.push(m.role === "user" ? "## 👤 Вопрос" : `## 🤖 Ответ${m.model ? ` (${m.model})` : ""}`);
    lines.push("");
    lines.push(m.content);
    lines.push("");
  }
  return lines.join("\n");
}
function downloadMarkdown(content, filename) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  saveAs$1(blob, filename || `cabinet-${ts$1()}.md`);
}
function mdToParagraphs(md) {
  const out = [];
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) {
      out.push(new Paragraph({ children: [new TextRun("")] }));
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length;
      const level = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6
      ][lvl - 1];
      out.push(new Paragraph({ heading: level, children: [new TextRun({ text: h[2], bold: true })] }));
      continue;
    }
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    if (bullet) {
      out.push(new Paragraph({ bullet: { level: 0 }, children: parseInline(bullet[1]) }));
      continue;
    }
    const numbered = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (numbered) {
      out.push(new Paragraph({ children: [new TextRun({ text: `• ${numbered[1]}` })] }));
      continue;
    }
    out.push(new Paragraph({ children: parseInline(line) }));
  }
  return out;
}
function parseInline(text) {
  const runs = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index) }));
    const tok = m[0];
    if (tok.startsWith("**")) runs.push(new TextRun({ text: tok.slice(2, -2), bold: true }));
    else if (tok.startsWith("`")) runs.push(new TextRun({ text: tok.slice(1, -1), font: "Consolas" }));
    else runs.push(new TextRun({ text: tok.slice(1, -1), italics: true }));
    last = m.index + tok.length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last) }));
  return runs.length ? runs : [new TextRun({ text })];
}
async function downloadDocx(messages, filename, title = "Кабинет — диалог") {
  const children = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: title, bold: true, size: 32 })]
    }),
    new Paragraph({ children: [new TextRun({ text: (/* @__PURE__ */ new Date()).toLocaleString("ru-RU"), italics: true, color: "666666" })] }),
    new Paragraph({ children: [new TextRun("")] })
  ];
  for (const m of messages) {
    if (!m.content) continue;
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({
        text: m.role === "user" ? "Вопрос" : `Ответ${m.model ? ` (${m.model})` : ""}`,
        bold: true
      })]
    }));
    children.push(...mdToParagraphs(m.content));
    children.push(new Paragraph({ children: [new TextRun("")] }));
  }
  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ children }]
  });
  const blob = await Packer.toBlob(doc);
  saveAs$1(blob, filename || `cabinet-${ts$1()}.docx`);
}
function downloadPdf(messages, title = "Кабинет — диалог") {
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) {
    return false;
  }
  const body = messages.filter((m) => m.content).map((m) => {
    const head = m.role === "user" ? "<h2>👤 Вопрос</h2>" : `<h2>🤖 Ответ${m.model ? ` <span class="m">(${escapeHtml(m.model)})</span>` : ""}</h2>`;
    const html = marked.parse(m.content, { async: false });
    return `<section>${head}${html}</section>`;
  }).join("\n");
  w.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: #111; line-height: 1.5; font-size: 12pt; }
  h1 { font-size: 18pt; margin: 0 0 4pt; }
  h2 { font-size: 13pt; margin: 14pt 0 4pt; border-bottom: 1px solid #ddd; padding-bottom: 2pt; }
  h3 { font-size: 12pt; margin: 10pt 0 3pt; }
  .meta { color: #666; font-style: italic; margin-bottom: 14pt; }
  .m { color: #888; font-weight: normal; font-size: 10pt; }
  section { page-break-inside: avoid; margin-bottom: 10pt; }
  pre, code { font-family: Consolas, Menlo, monospace; font-size: 10.5pt; background: #f5f5f5; padding: 1pt 3pt; border-radius: 3px; }
  pre { padding: 8pt; overflow-x: auto; }
  table { border-collapse: collapse; margin: 6pt 0; }
  th, td { border: 1px solid #ccc; padding: 4pt 6pt; }
  ul, ol { padding-left: 20pt; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">${escapeHtml((/* @__PURE__ */ new Date()).toLocaleString("ru-RU"))}</div>
${body}
<script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 250); });<\/script>
</body></html>`);
  w.document.close();
  return true;
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
const AGE_OPTIONS = [
  { id: "infant", label: "Младенцы (0-23 мес)" },
  { id: "child", label: "Дети (2-12)" },
  { id: "adolescent", label: "Подростки (13-18)" },
  { id: "adult", label: "Взрослые (19-44)" },
  { id: "aged", label: "Пожилые (65+)" },
  { id: "male", label: "Мужской пол" },
  { id: "female", label: "Женский пол" }
];
const TYPE_OPTIONS = [
  "Review",
  "Systematic Review",
  "Meta-Analysis",
  "Randomized Controlled Trial",
  "Clinical Trial",
  "Practice Guideline",
  "Case Reports",
  "Observational Study"
];
const LANG_OPTIONS = [
  { id: "eng", label: "Английский" },
  { id: "rus", label: "Русский" },
  { id: "ger", label: "Немецкий" },
  { id: "fre", label: "Французский" }
];
const PERIOD_OPTIONS = [
  { years: null, label: "Все" },
  { years: 1, label: "1 год" },
  { years: 3, label: "3 года" },
  { years: 5, label: "5 лет" },
  { years: 10, label: "10 лет" }
];
const DEFAULT_PRESET_NAME = "Подростковая андрология";
const DEFAULT_FILTERS = {
  ages: ["adolescent", "male"],
  article_types: ["Review", "Randomized Controlled Trial"],
  period: { years_back: 5 },
  languages: ["eng"],
  humans_only: true,
  sort: "relevance",
  retmax: 10
};
const EMPTY_FILTERS = {
  ages: [],
  article_types: [],
  period: { years_back: null },
  languages: ["eng"],
  humans_only: true,
  sort: "relevance",
  retmax: 10
};
const Chip = ({ active, onClick, children, disabled }) => /* @__PURE__ */ jsx(
  "button",
  {
    type: "button",
    onClick,
    disabled,
    className: `px-2.5 py-1 rounded-full text-xs border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent border-border"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`,
    children
  }
);
function PubmedPanel({
  userId,
  filters,
  onFiltersChange,
  disabled
}) {
  var _a2;
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [expanded, setExpanded] = useState(true);
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("pubmed_search_presets").select("id, name, is_default, filters").order("is_default", { ascending: false }).order("name", { ascending: true });
      if (error) {
        toast.error("Не удалось загрузить пресеты PubMed");
        return;
      }
      let list = data || [];
      if (list.length === 0) {
        const { data: ins, error: insErr } = await supabase.from("pubmed_search_presets").insert({ user_id: userId, name: DEFAULT_PRESET_NAME, is_default: true, filters: DEFAULT_FILTERS }).select("id, name, is_default, filters").single();
        if (!insErr && ins) {
          list = [ins];
        }
      }
      setPresets(list);
      const def = list.find((p) => p.is_default) || list[0];
      if (def) {
        setSelectedPresetId(def.id);
        onFiltersChange(def.filters);
      }
    })();
  }, [userId]);
  const toggleInArray = (arr, v) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  const applyPreset = (id) => {
    setSelectedPresetId(id);
    const p = presets.find((x) => x.id === id);
    if (p) onFiltersChange(p.filters);
  };
  const saveAsNew = async () => {
    var _a3;
    const name = (_a3 = window.prompt("Название пресета:")) == null ? void 0 : _a3.trim();
    if (!name) return;
    const { data, error } = await supabase.from("pubmed_search_presets").insert({ user_id: userId, name, filters }).select("id, name, is_default, filters").single();
    if (error || !data) {
      toast.error("Не удалось сохранить пресет");
      return;
    }
    setPresets((prev) => [...prev, data]);
    setSelectedPresetId(data.id);
    toast.success("Пресет сохранён");
  };
  const saveChanges = async () => {
    if (!selectedPresetId) return;
    const { error } = await supabase.from("pubmed_search_presets").update({ filters }).eq("id", selectedPresetId);
    if (error) {
      toast.error("Не удалось обновить пресет");
      return;
    }
    setPresets((prev) => prev.map((p) => p.id === selectedPresetId ? { ...p, filters } : p));
    toast.success("Пресет обновлён");
  };
  const setAsDefault = async () => {
    if (!selectedPresetId) return;
    await supabase.from("pubmed_search_presets").update({ is_default: false }).eq("user_id", userId);
    const { error } = await supabase.from("pubmed_search_presets").update({ is_default: true }).eq("id", selectedPresetId);
    if (error) {
      toast.error("Не удалось сделать пресет по умолчанию");
      return;
    }
    setPresets((prev) => prev.map((p) => ({ ...p, is_default: p.id === selectedPresetId })));
    toast.success("Пресет по умолчанию обновлён");
  };
  const deletePreset = async () => {
    var _a3;
    if (!selectedPresetId) return;
    if (!confirm("Удалить пресет?")) return;
    const { error } = await supabase.from("pubmed_search_presets").delete().eq("id", selectedPresetId);
    if (error) {
      toast.error("Не удалось удалить");
      return;
    }
    const next = presets.filter((p) => p.id !== selectedPresetId);
    setPresets(next);
    setSelectedPresetId(((_a3 = next[0]) == null ? void 0 : _a3.id) || "");
    if (next[0]) onFiltersChange(next[0].filters);
  };
  const reset = () => onFiltersChange(EMPTY_FILTERS);
  return /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-md bg-muted/40", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-3 py-2 border-b border-border", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap flex-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide", children: "PubMed" }),
        /* @__PURE__ */ jsxs(Select, { value: selectedPresetId, onValueChange: applyPreset, disabled: disabled || presets.length === 0, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-7 w-[220px] text-xs", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Пресет фильтров" }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: presets.map((p) => /* @__PURE__ */ jsxs(SelectItem, { value: p.id, className: "text-xs", children: [
            p.is_default ? "★ " : "",
            p.name
          ] }, p.id)) })
        ] }),
        /* @__PURE__ */ jsxs(Button, { type: "button", size: "sm", variant: "ghost", className: "h-7 px-2 text-xs", onClick: saveChanges, disabled: disabled || !selectedPresetId, title: "Сохранить изменения в текущем пресете", children: [
          /* @__PURE__ */ jsx(Save, { className: "w-3.5 h-3.5 mr-1" }),
          "Обновить"
        ] }),
        /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", variant: "ghost", className: "h-7 px-2 text-xs", onClick: saveAsNew, disabled, children: "+ Новый" }),
        /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", variant: "ghost", className: "h-7 px-2 text-xs", onClick: setAsDefault, disabled: disabled || !selectedPresetId, title: "Сделать пресетом по умолчанию", children: /* @__PURE__ */ jsx(Star, { className: "w-3.5 h-3.5" }) }),
        /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", variant: "ghost", className: "h-7 px-2 text-xs text-destructive", onClick: deletePreset, disabled: disabled || !selectedPresetId, children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }) }),
        /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", variant: "ghost", className: "h-7 px-2 text-xs", onClick: reset, disabled, title: "Сбросить фильтры", children: /* @__PURE__ */ jsx(RotateCcw, { className: "w-3.5 h-3.5" }) })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setExpanded((v) => !v), className: "p-1 hover:text-primary", children: expanded ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" }) })
    ] }),
    expanded && /* @__PURE__ */ jsxs("div", { className: "p-3 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Возраст / пол" }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 mt-1", children: AGE_OPTIONS.map((a) => /* @__PURE__ */ jsx(
          Chip,
          {
            active: filters.ages.includes(a.id),
            disabled,
            onClick: () => onFiltersChange({ ...filters, ages: toggleInArray(filters.ages, a.id) }),
            children: a.label
          },
          a.id
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Тип статьи" }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 mt-1", children: TYPE_OPTIONS.map((t) => /* @__PURE__ */ jsx(
          Chip,
          {
            active: filters.article_types.includes(t),
            disabled,
            onClick: () => onFiltersChange({ ...filters, article_types: toggleInArray(filters.article_types, t) }),
            children: t
          },
          t
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Период" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: String(((_a2 = filters.period) == null ? void 0 : _a2.years_back) ?? "all"),
              onValueChange: (v) => onFiltersChange({ ...filters, period: { years_back: v === "all" ? null : Number(v) } }),
              disabled,
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8 mt-1 text-xs", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsx(SelectContent, { children: PERIOD_OPTIONS.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p.years === null ? "all" : String(p.years), className: "text-xs", children: p.label }, String(p.years))) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Сортировка" }),
          /* @__PURE__ */ jsxs(Select, { value: filters.sort, onValueChange: (v) => onFiltersChange({ ...filters, sort: v }), disabled, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8 mt-1 text-xs", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "relevance", className: "text-xs", children: "По релевантности" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "pub_date", className: "text-xs", children: "По дате публикации" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Количество" }),
          /* @__PURE__ */ jsxs(Select, { value: String(filters.retmax), onValueChange: (v) => onFiltersChange({ ...filters, retmax: Number(v) }), disabled, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8 mt-1 text-xs", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "5", className: "text-xs", children: "5" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "10", className: "text-xs", children: "10" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "15", className: "text-xs", children: "15" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Только люди" }),
          /* @__PURE__ */ jsx("div", { className: "h-8 mt-1 flex items-center", children: /* @__PURE__ */ jsx(Switch, { checked: filters.humans_only, onCheckedChange: (v) => onFiltersChange({ ...filters, humans_only: v }), disabled }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Язык" }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 mt-1", children: LANG_OPTIONS.map((l) => /* @__PURE__ */ jsx(
          Chip,
          {
            active: filters.languages.includes(l.id),
            disabled,
            onClick: () => onFiltersChange({ ...filters, languages: toggleInArray(filters.languages, l.id) }),
            children: l.label
          },
          l.id
        )) })
      ] })
    ] })
  ] });
}
const TYPE_BADGE_COLORS = {
  "Review": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  "Systematic Review": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  "Meta-Analysis": "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  "Randomized Controlled Trial": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  "Clinical Trial": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  "Practice Guideline": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  "Case Reports": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
};
function PubmedSourceCard({
  index,
  source,
  onAnalyze,
  analyzing
}) {
  const importantTypes = (source.article_types || []).filter((t) => t in TYPE_BADGE_COLORS).slice(0, 3);
  return /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-md p-3 bg-card text-sm space-y-1.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-muted-foreground shrink-0 mt-0.5", children: [
        "[",
        index,
        "]"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("a", { href: source.url, target: "_blank", rel: "noopener noreferrer", className: "font-medium text-foreground hover:text-primary leading-snug block", children: source.title || `PMID:${source.pmid}` }),
        (source.authors || source.journal || source.year) && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-0.5", children: [
          source.authors,
          source.authors && (source.journal || source.year) ? " · " : "",
          source.journal,
          source.journal && source.year ? " · " : "",
          source.year
        ] })
      ] })
    ] }),
    importantTypes.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 pl-7", children: importantTypes.map((t) => /* @__PURE__ */ jsx("span", { className: `text-[10px] px-1.5 py-0.5 rounded ${TYPE_BADGE_COLORS[t]}`, children: t }, t)) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 pl-7 pt-1", children: [
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: source.url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "inline-flex items-center gap-1 text-xs text-primary hover:underline",
          children: [
            /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }),
            "PubMed (PMID:",
            source.pmid,
            ")"
          ]
        }
      ),
      source.pmc_url && /* @__PURE__ */ jsxs(
        "a",
        {
          href: source.pmc_url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:underline",
          children: [
            /* @__PURE__ */ jsx(FileText, { className: "w-3 h-3" }),
            "PMC полный текст"
          ]
        }
      ),
      source.pmcid && onAnalyze && /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          size: "sm",
          variant: "outline",
          className: "h-6 px-2 text-xs",
          onClick: () => onAnalyze(source),
          disabled: analyzing,
          children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3 mr-1" }),
            analyzing ? "Разбираю…" : "Разобрать подробнее"
          ]
        }
      )
    ] })
  ] });
}
const { saveAs } = fileSaver;
const ts = () => {
  const d = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};
const TYPE_MAP = {
  "Journal Article": "JOUR",
  "Review": "JOUR",
  "Systematic Review": "JOUR",
  "Meta-Analysis": "JOUR",
  "Randomized Controlled Trial": "JOUR",
  "Clinical Trial": "JOUR",
  "Practice Guideline": "JOUR",
  "Case Reports": "CASE",
  "Book": "BOOK"
};
function sourcesToRis(sources) {
  const blocks = [];
  for (const s of sources) {
    const ty = TYPE_MAP[(s.article_types || [])[0] || ""] || "JOUR";
    const lines = [`TY  - ${ty}`];
    if (s.title) lines.push(`TI  - ${s.title}`);
    if (s.authors) {
      for (const a of s.authors.split(/,\s*/).filter(Boolean)) {
        if (a === "et al.") continue;
        lines.push(`AU  - ${a}`);
      }
    }
    if (s.journal) lines.push(`JO  - ${s.journal}`);
    if (s.year) lines.push(`PY  - ${s.year}`);
    if (s.doi) lines.push(`DO  - ${s.doi}`);
    if (s.pmid) lines.push(`AN  - ${s.pmid}`);
    if (s.url) lines.push(`UR  - ${s.url}`);
    if (s.pmc_url) lines.push(`L1  - ${s.pmc_url}`);
    if (s.abstract) lines.push(`AB  - ${s.abstract.replace(/\s+/g, " ").slice(0, 4e3)}`);
    lines.push("ER  - ");
    blocks.push(lines.join("\n"));
  }
  return blocks.join("\n\n");
}
function downloadRis(sources, baseName = "pubmed") {
  const ris = sourcesToRis(sources);
  const blob = new Blob([ris], { type: "application/x-research-info-systems;charset=utf-8" });
  saveAs(blob, `${baseName}-${ts()}.ris`);
}
async function downloadSourcesDocx(sources, title = "Список литературы (PubMed)", baseName = "pubmed") {
  const children = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(title)] }),
    new Paragraph({ children: [new TextRun({ text: (/* @__PURE__ */ new Date()).toLocaleString("ru-RU"), italics: true })] }),
    new Paragraph({ children: [new TextRun(" ")] })
  ];
  sources.forEach((s, i) => {
    const refLine = [
      `${i + 1}. `,
      s.authors ? `${s.authors}. ` : "",
      s.title ? `${s.title} ` : "",
      s.journal ? `// ${s.journal}. ` : "",
      s.year ? `${s.year}. ` : "",
      s.doi ? `DOI: ${s.doi}. ` : "",
      `PMID: ${s.pmid}.`,
      s.pmcid ? ` ${s.pmcid}.` : ""
    ].join("");
    children.push(new Paragraph({ children: [new TextRun(refLine)] }));
    if (s.url) {
      children.push(new Paragraph({ children: [new TextRun({ text: s.url, color: "1A56DB" })] }));
    }
    if (s.abstract) {
      children.push(new Paragraph({ children: [new TextRun({ text: s.abstract, italics: true, size: 20 })] }));
    }
    children.push(new Paragraph({ children: [new TextRun(" ")] }));
  });
  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${baseName}-${ts()}.docx`);
}
function parseFulltextItems(raw) {
  if (!raw) return null;
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const first = s.indexOf("[");
  const last = s.lastIndexOf("]");
  if (first === -1 || last === -1 || last < first) return null;
  const slice = s.slice(first, last + 1);
  let parsed;
  try {
    parsed = JSON.parse(slice);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const items = [];
  for (const it of parsed) {
    if (!it || typeof it !== "object") continue;
    const claim = typeof it.claim === "string" ? it.claim.trim() : "";
    if (!claim) continue;
    const quote = typeof it.quote === "string" ? it.quote : "";
    const location = typeof it.location === "string" ? it.location : "";
    const type = it.type === "direct" ? "direct" : "inferred";
    items.push({ claim, quote, location, type });
  }
  return items.length ? items : null;
}
function SourceBadge({ item, meta }) {
  const isInferred = item.type === "inferred" || !item.quote.trim();
  const handleCopy = async () => {
    const parts = [];
    if (item.quote) parts.push(`«${item.quote}»`);
    const ref = [];
    if (meta.pmid) ref.push(`PMID:${meta.pmid}`);
    if (meta.pmcid) ref.push(meta.pmcid);
    if (meta.doi) ref.push(`DOI:${meta.doi}`);
    if (item.location) ref.push(item.location);
    if (ref.length) parts.push(`— ${ref.join("; ")}`);
    const ok = await copyToClipboard(parts.join(" "));
    toast[ok ? "success" : "error"](ok ? "Цитата скопирована" : "Не удалось скопировать");
  };
  return /* @__PURE__ */ jsxs(Popover, { children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ml-1 align-middle font-normal " + (isInferred ? "bg-muted text-muted-foreground hover:bg-muted/80" : "bg-primary/10 text-primary hover:bg-primary/20"),
        title: isInferred ? "Вывод модели — прямой цитаты нет" : "Показать дословную цитату из статьи",
        children: [
          /* @__PURE__ */ jsx(Quote, { className: "w-2.5 h-2.5" }),
          isInferred ? "вывод" : "источник"
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(PopoverContent, { align: "start", className: "w-96 max-w-[90vw] text-sm", children: isInferred ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Вывод модели — прямой подтверждающей цитаты в тексте нет." }),
      item.location && /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
        "Раздел: ",
        item.location
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      item.location && /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-wide text-muted-foreground", children: item.location }),
      /* @__PURE__ */ jsx("blockquote", { className: "border-l-2 border-primary/40 pl-2 italic text-foreground whitespace-pre-wrap break-words", children: item.quote }),
      /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
        "PMID:",
        meta.pmid,
        meta.pmcid ? ` · ${meta.pmcid}` : "",
        meta.doi ? ` · DOI:${meta.doi}` : ""
      ] }),
      /* @__PURE__ */ jsxs(Button, { type: "button", size: "sm", variant: "outline", className: "h-7 text-xs w-full", onClick: handleCopy, children: [
        /* @__PURE__ */ jsx(Copy, { className: "w-3 h-3 mr-1" }),
        " Копировать цитату"
      ] })
    ] }) })
  ] });
}
function PubmedFulltextAnalysis({
  raw,
  meta,
  onFollowup,
  followupLoading
}) {
  const items = useMemo(() => parseFulltextItems(raw), [raw]);
  const [q, setQ] = useState("");
  if (!items) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx(ChatMarkdown, { children: raw }),
      onFollowup && /* @__PURE__ */ jsx(FollowupRow, { q, setQ, loading: !!followupLoading, onSend: () => {
        if (q.trim()) {
          onFollowup(q.trim());
          setQ("");
        }
      } })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3" }),
      "Разбор полного текста",
      meta.title ? ` — ${meta.title}` : ""
    ] }),
    /* @__PURE__ */ jsx("ul", { className: "space-y-1.5 text-sm list-disc pl-5 marker:text-muted-foreground", children: items.map((it, i) => /* @__PURE__ */ jsxs("li", { className: it.type === "inferred" ? "text-foreground/90" : "text-foreground", children: [
      /* @__PURE__ */ jsx("span", { className: "whitespace-pre-wrap", children: it.claim }),
      /* @__PURE__ */ jsx(SourceBadge, { item: it, meta })
    ] }, i)) }),
    onFollowup && /* @__PURE__ */ jsx(FollowupRow, { q, setQ, loading: !!followupLoading, onSend: () => {
      if (q.trim()) {
        onFollowup(q.trim());
        setQ("");
      }
    } })
  ] });
}
function FollowupRow({ q, setQ, loading, onSend }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-2 border-t border-border/50", children: [
    /* @__PURE__ */ jsx(
      Input,
      {
        value: q,
        onChange: (e) => setQ(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        },
        placeholder: "Спросить ещё об этой статье…",
        className: "h-8 text-xs",
        disabled: loading
      }
    ),
    /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", className: "h-8 text-xs", onClick: onSend, disabled: loading || !q.trim(), children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : "Спросить" })
  ] });
}
function ExtendedModelPicker({
  open,
  onOpenChange,
  onPick,
  currentId
}) {
  const { list, loading, error } = useOpenRouterModels();
  const { list: veniceList, loading: veniceLoading } = useVeniceModels();
  const [q, setQ] = useState("");
  const combined = useMemo(() => {
    return [...veniceList, ...list];
  }, [list, veniceList]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = needle ? combined.filter(
      (m) => m.id.toLowerCase().includes(needle) || (m.name || "").toLowerCase().includes(needle)
    ) : combined;
    return base.slice(0, 400);
  }, [combined, q]);
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Расширенный выбор модели" }),
      /* @__PURE__ */ jsxs(DialogDescription, { children: [
        "OpenRouter: ",
        list.length || "—",
        " · Venice (без цензуры): ",
        veniceList.length || "—",
        ". Выбранная модель применится только к этому диалогу."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          autoFocus: true,
          value: q,
          onChange: (e) => setQ(e.target.value),
          placeholder: "например, claude, qwen3, gemini-3, deepseek…",
          className: "pl-8"
        }
      )
    ] }),
    loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
      " Загружаем список моделей…"
    ] }) : error ? /* @__PURE__ */ jsxs("div", { className: "text-sm text-destructive py-3", children: [
      "Не удалось загрузить список: ",
      error
    ] }) : /* @__PURE__ */ jsx(ScrollArea, { className: "h-[420px] rounded-md border border-border", children: /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-border", children: [
      filtered.map((m) => {
        var _a2, _b;
        const inP = formatPricePerMtok((_a2 = m.pricing) == null ? void 0 : _a2.prompt);
        const outP = formatPricePerMtok((_b = m.pricing) == null ? void 0 : _b.completion);
        const isCurrent = m.id === currentId;
        return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              onPick(m.id);
              onOpenChange(false);
            },
            className: `w-full text-left px-3 py-2 hover:bg-accent transition-colors ${isCurrent ? "bg-accent/50" : ""}`,
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium truncate flex items-center gap-1.5", children: [
                  m.id.startsWith("venice/") && /* @__PURE__ */ jsx("span", { className: "text-[9px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30", children: "Venice · 🌶" }),
                  /* @__PURE__ */ jsx("span", { className: "truncate", children: m.name || m.id })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-[11px] font-mono text-muted-foreground truncate", children: m.id })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground text-right shrink-0", children: [
                m.context_length ? `${m.context_length.toLocaleString("ru-RU")} ctx` : "",
                (inP || outP) && /* @__PURE__ */ jsxs("div", { children: [
                  inP ?? "—",
                  " / ",
                  outP ?? "—"
                ] })
              ] })
            ] })
          }
        ) }, m.id);
      }),
      filtered.length === 0 && /* @__PURE__ */ jsx("li", { className: "px-3 py-6 text-center text-sm text-muted-foreground", children: "Ничего не найдено" })
    ] }) })
  ] }) });
}
const BUCKET = "chat-attachments";
const MAX_FILES = 50;
const MAX_TOTAL_MB = 300;
const MAX_FILE_MB = 30;
const friendlyError = (e) => {
  if (!e) return "";
  if (/context_length/i.test(e)) return "Контекст модели переполнен — уменьшите размер подпакета или количество файлов в нём.";
  if (/429|rate limit/i.test(e)) return "Превышен лимит запросов к модели (429). Подождите немного.";
  if (/402|credits|insufficient/i.test(e)) return "Закончились кредиты у провайдера модели (402).";
  if (/unsupported.*(image|file|modality)/i.test(e)) return "Модель не поддерживает один из типов вложений.";
  return e;
};
function BatchAnalysisDialog({ open, onOpenChange, userId, conversationId, onResult }) {
  const [pending, setPending] = useState([]);
  const [task, setTask] = useState("Извлеки и сведи все показатели лабораторных анализов, отметь отклонения от референсных диапазонов, укажи динамику по датам.");
  const [subbatchSize, setSubbatchSize] = useState(7);
  const [uploading, setUploading] = useState(false);
  const [activeBatch, setActiveBatch] = useState(null);
  const [phase, setPhase] = useState("select");
  const fileInputRef = useRef(null);
  const resultDeliveredRef = useRef(false);
  const reset = () => {
    setPending([]);
    setActiveBatch(null);
    setPhase("select");
    resultDeliveredRef.current = false;
  };
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);
  useEffect(() => {
    if (!(activeBatch == null ? void 0 : activeBatch.id)) return;
    const channel = supabase.channel(`batch-${activeBatch.id}`).on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "analysis_batches", filter: `id=eq.${activeBatch.id}` },
      (payload) => {
        const row = payload.new;
        if (activeBatch.user_id && row.user_id && row.user_id !== activeBatch.user_id) return;
        setActiveBatch(row);
        if (row.status === "done") setPhase("done");
        else if (row.status === "error") setPhase("error");
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBatch == null ? void 0 : activeBatch.id]);
  useEffect(() => {
    if (phase === "done" && (activeBatch == null ? void 0 : activeBatch.final_result) && !resultDeliveredRef.current) {
      resultDeliveredRef.current = true;
      onResult({ final: activeBatch.final_result, partial: activeBatch.partial_results || [], task });
    }
  }, [phase, activeBatch, onResult, task]);
  const addFiles = (files) => {
    if (!files) return;
    const incoming = [];
    let totalMb = pending.reduce((s, p) => s + p.file.size / (1024 * 1024), 0);
    for (const f of Array.from(files)) {
      if (pending.length + incoming.length >= MAX_FILES) {
        toast.error(`Максимум ${MAX_FILES} файлов`);
        break;
      }
      const mb = f.size / (1024 * 1024);
      if (mb > MAX_FILE_MB) {
        toast.error(`${f.name}: больше ${MAX_FILE_MB} МБ`);
        continue;
      }
      if (totalMb + mb > MAX_TOTAL_MB) {
        toast.error(`Превышен суммарный лимит ${MAX_TOTAL_MB} МБ`);
        break;
      }
      totalMb += mb;
      const isZip = /\.zip$/i.test(f.name);
      const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
      const isImg = f.type.startsWith("image/");
      if (!isZip && !isPdf && !isImg) {
        toast.error(`${f.name}: поддерживаются PDF, изображения и ZIP`);
        continue;
      }
      incoming.push({ file: f, localId: `${Date.now()}-${Math.random()}`, progress: 0 });
    }
    setPending((prev) => [...prev, ...incoming]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removePending = (id) => setPending((prev) => prev.filter((p) => p.localId !== id));
  const startBatch = useCallback(async () => {
    var _a2, _b;
    if (!pending.length) {
      toast.error("Не выбраны файлы");
      return;
    }
    if (!task.trim()) {
      toast.error("Опишите задачу для анализа");
      return;
    }
    setUploading(true);
    setPhase("uploading");
    const { data: batchRow, error: bErr } = await supabase.from("analysis_batches").insert({
      user_id: userId,
      conversation_id: conversationId,
      task: task.trim(),
      subbatch_size: subbatchSize,
      file_paths: [],
      total_files: 0
    }).select("*").single();
    if (bErr || !batchRow) {
      toast.error("Не удалось создать пакет: " + ((bErr == null ? void 0 : bErr.message) || ""));
      setUploading(false);
      setPhase("select");
      return;
    }
    const batchId = batchRow.id;
    setActiveBatch(batchRow);
    const uploadedPaths = [];
    const zipPaths = [];
    for (const p of pending) {
      const safe = p.file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${userId}/${batchId}/${safe}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, p.file, { upsert: true, contentType: p.file.type || "application/octet-stream" });
      if (error) {
        setPending((prev) => prev.map((x) => x.localId === p.localId ? { ...x, error: error.message } : x));
        continue;
      }
      setPending((prev) => prev.map((x) => x.localId === p.localId ? { ...x, progress: 100, uploadedPath: path } : x));
      if (/\.zip$/i.test(p.file.name)) zipPaths.push(path);
      else uploadedPaths.push(path);
    }
    for (const zp of zipPaths) {
      try {
        const { data: sess2 } = await supabase.auth.getSession();
        const resp = await fetch(`${"https://bpbwkizvvythqotcyfii.supabase.co"}/functions/v1/unzip-chat-archive`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${((_a2 = sess2.session) == null ? void 0 : _a2.access_token) ?? ""}` },
          body: JSON.stringify({ zipPath: zp })
        });
        if (!resp.ok) {
          const err = await resp.text();
          toast.error(`Архив ${zp.split("/").pop()}: ${err.slice(0, 200)}`);
          continue;
        }
        const json = await resp.json();
        uploadedPaths.push(...json.paths || []);
        if (Array.isArray(json.skipped) && json.skipped.length) {
          toast.warning(`Пропущено в архиве: ${json.skipped.slice(0, 5).map((s) => s.name).join(", ")}${json.skipped.length > 5 ? "…" : ""}`);
        }
      } catch (e) {
        toast.error(`Распаковка архива: ${e.message}`);
      }
    }
    if (!uploadedPaths.length) {
      toast.error("Не загружено ни одного файла");
      await supabase.from("analysis_batches").update({ status: "error", error: "Нет загруженных файлов" }).eq("id", batchId);
      setUploading(false);
      setPhase("error");
      return;
    }
    await supabase.from("analysis_batches").update({
      file_paths: uploadedPaths,
      total_files: uploadedPaths.length
    }).eq("id", batchId);
    setPhase("analyzing");
    setUploading(false);
    const { data: sess } = await supabase.auth.getSession();
    fetch(`${"https://bpbwkizvvythqotcyfii.supabase.co"}/functions/v1/analyze-documents-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${((_b = sess.session) == null ? void 0 : _b.access_token) ?? ""}` },
      body: JSON.stringify({ batchId })
    }).catch((e) => toast.error("Не удалось запустить анализ: " + e.message));
  }, [pending, task, subbatchSize, userId, conversationId]);
  const progressPct = activeBatch ? activeBatch.status === "done" ? 100 : activeBatch.total_files ? Math.round(activeBatch.processed_files / activeBatch.total_files * 100) : 5 : 0;
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: (v) => {
    if (!uploading) onOpenChange(v);
  }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Пакетный анализ документов" }),
      /* @__PURE__ */ jsxs(DialogDescription, { children: [
        "Загрузите PDF / изображения / ZIP с медицинскими документами (макс. ",
        MAX_FILES,
        " файлов, до ",
        MAX_TOTAL_MB,
        " МБ суммарно). Файлы анализирует Claude Sonnet 4.5 подпакетами по ",
        subbatchSize,
        " штук с финальной сводкой."
      ] })
    ] }),
    phase === "select" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Задача для модели" }),
        /* @__PURE__ */ jsx(Textarea, { value: task, onChange: (e) => setTask(e.target.value), className: "min-h-[80px] mt-1" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm", children: "Размер подпакета:" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "number",
            min: 1,
            max: 15,
            value: subbatchSize,
            onChange: (e) => setSubbatchSize(Math.max(1, Math.min(15, Number(e.target.value) || 7))),
            className: "w-20"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "файлов за один запрос к модели" })
      ] }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: "border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors",
          onClick: () => {
            var _a2;
            return (_a2 = fileInputRef.current) == null ? void 0 : _a2.click();
          },
          onDragOver: (e) => {
            e.preventDefault();
          },
          onDrop: (e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          },
          children: [
            /* @__PURE__ */ jsx(Upload, { className: "w-8 h-8 mx-auto text-muted-foreground" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm mt-2", children: "Нажмите или перетащите файлы. PDF, изображения, ZIP." }),
            /* @__PURE__ */ jsx(
              "input",
              {
                ref: fileInputRef,
                type: "file",
                multiple: true,
                className: "hidden",
                accept: "application/pdf,image/*,.zip,application/zip",
                onChange: (e) => addFiles(e.target.files)
              }
            )
          ]
        }
      ),
      pending.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-1 max-h-64 overflow-y-auto", children: [
        pending.map((p) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-muted/50 rounded px-2 py-1 text-sm", children: [
          /\.zip$/i.test(p.file.name) ? /* @__PURE__ */ jsx(FileArchive, { className: "w-4 h-4" }) : p.file.type.startsWith("image/") ? /* @__PURE__ */ jsx(Image, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", children: p.file.name }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            (p.file.size / (1024 * 1024)).toFixed(1),
            " МБ"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => removePending(p.localId), className: "hover:text-destructive", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
        ] }, p.localId)),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          pending.length,
          " / ",
          MAX_FILES,
          " файлов"
        ] })
      ] })
    ] }),
    (phase === "uploading" || phase === "analyzing" || phase === "done" || phase === "error") && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      (() => {
        const uploadedCount = pending.filter((p) => p.uploadedPath).length;
        const uploadPct = pending.length ? Math.round(uploadedCount / pending.length * 100) : 0;
        const displayPct = phase === "uploading" ? uploadPct : progressPct;
        return /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm mb-1", children: [
            /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              phase === "uploading" && `Загрузка файлов: ${uploadedCount} из ${pending.length}`,
              phase === "analyzing" && `Анализ: ${(activeBatch == null ? void 0 : activeBatch.processed_files) || 0} из ${(activeBatch == null ? void 0 : activeBatch.total_files) || pending.length} файлов`,
              phase === "done" && "Готово",
              phase === "error" && "Ошибка"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              displayPct,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: displayPct })
        ] });
      })(),
      phase === "error" && (activeBatch == null ? void 0 : activeBatch.error) && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 bg-destructive/10 text-destructive rounded p-3 text-sm", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsx("div", { children: friendlyError(activeBatch.error) })
      ] }),
      (activeBatch == null ? void 0 : activeBatch.partial_results) && activeBatch.partial_results.length > 0 && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground space-y-1 max-h-40 overflow-y-auto", children: activeBatch.partial_results.map((p, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        p.error ? /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3 text-destructive" }) : /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 text-green-600" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "Подпакет ",
          i + 1,
          " (",
          p.files.length,
          " файлов): ",
          p.error ? friendlyError(p.error) : "готово"
        ] })
      ] }, i)) }),
      (activeBatch == null ? void 0 : activeBatch.chain_log) && activeBatch.chain_log.length > 0 && /* @__PURE__ */ jsxs("details", { className: "text-xs border border-border rounded", children: [
        /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer px-3 py-2 font-medium select-none", children: [
          "Журнал цепочки (",
          activeBatch.chain_log.length,
          ")"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "max-h-56 overflow-y-auto px-3 py-2 space-y-1 font-mono", children: [...activeBatch.chain_log].slice(-200).map((e, i) => {
          const stage = String(e.stage ?? "");
          const danger = /error/i.test(stage);
          const recovery = stage === "recovery_trigger";
          return /* @__PURE__ */ jsxs("div", { className: `flex gap-2 ${danger ? "text-destructive" : recovery ? "text-orange-600" : ""}`, children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground shrink-0", children: e.ts ? new Date(e.ts).toLocaleTimeString("ru-RU", { hour12: false }) : "--:--:--" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium shrink-0", children: stage }),
            /* @__PURE__ */ jsx("span", { className: "truncate", children: Object.entries(e).filter(([k]) => k !== "ts" && k !== "stage").map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`).join(" ") })
          ] }, i);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      phase === "select" && /* @__PURE__ */ jsxs(Button, { onClick: startBatch, disabled: !pending.length || !task.trim(), children: [
        /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 mr-1" }),
        " Запустить анализ (",
        pending.length,
        ")"
      ] }),
      (phase === "uploading" || phase === "analyzing") && /* @__PURE__ */ jsxs(Button, { disabled: true, children: [
        /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-1 animate-spin" }),
        " Обработка…"
      ] }),
      (phase === "done" || phase === "error") && /* @__PURE__ */ jsx(Button, { onClick: () => onOpenChange(false), children: "Закрыть" })
    ] })
  ] }) });
}
const STATUS_CLS = {
  no_data: "bg-muted text-muted-foreground border-border",
  norm: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
  mild: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
  moderate: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
  severe: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300"
};
function MetabolicMapMiniCard({ patientId, patientName }) {
  const [summary, setSummary] = useState([]);
  const [lastAt, setLastAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [shown, setShown] = useState(false);
  const load = async () => {
    var _a2;
    setLoading(true);
    try {
      const { data } = await supabase.from("metabolic_maps").select("aggregate_summary, last_aggregated_at").eq("patient_id", patientId).maybeSingle();
      setSummary(((_a2 = data == null ? void 0 : data.aggregate_summary) == null ? void 0 : _a2.pathways) || []);
      setLastAt((data == null ? void 0 : data.last_aggregated_at) || null);
    } finally {
      setLoading(false);
    }
  };
  const show = async () => {
    setShown(true);
    await load();
  };
  const recalc = async () => {
    setRunning(true);
    try {
      await runAggregation({ patientId, visitId: null });
      await load();
      toast$1({ title: "Карта пересчитана" });
    } catch (e) {
      toast$1({ title: "Ошибка пересчёта", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };
  if (!shown) {
    return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card px-3 py-2 flex items-center gap-2 text-sm", children: [
      /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4 text-primary" }),
      /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Метаболическая карта" }),
      patientName && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground text-xs truncate", children: [
        "· ",
        patientName
      ] }),
      /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", className: "ml-auto h-7 text-xs", onClick: show, children: "Показать" }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: `/admin/patients/${patientId}/metabolic-map`,
          className: "inline-flex items-center gap-1 text-xs text-primary hover:underline",
          children: [
            "Открыть ",
            /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" })
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-card px-3 py-2 space-y-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
      /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4 text-primary" }),
      /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Метаболическая карта" }),
      patientName && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground text-xs truncate", children: [
        "· ",
        patientName
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setShown(false),
          className: "ml-auto text-xs text-muted-foreground hover:text-foreground",
          title: "Свернуть",
          children: "Скрыть"
        }
      ),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: `/admin/patients/${patientId}/metabolic-map`,
          className: "inline-flex items-center gap-1 text-xs text-primary hover:underline",
          children: [
            "Открыть ",
            /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" })
          ]
        }
      )
    ] }),
    loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }),
      "Загрузка…"
    ] }) : summary.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground italic", children: "Ещё не рассчитано. Нажмите «Пересчитать»." }) : /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: summary.map((s) => /* @__PURE__ */ jsxs(
      Badge,
      {
        variant: "outline",
        className: `text-[11px] ${STATUS_CLS[s.status]}`,
        title: s.needs_phase_codes && s.needs_phase_codes.length ? `Нужна фаза цикла: ${s.needs_phase_codes.join(", ")}` : void 0,
        children: [
          s.name,
          ": ",
          SEVERITY_LABEL[s.status],
          s.matched_markers > 0 && ` (${s.matched_markers})`,
          s.needs_phase_codes && s.needs_phase_codes.length > 0 && /* @__PURE__ */ jsx("span", { className: "ml-1 text-blue-600", children: "🔵" })
        ]
      },
      s.pathway_id
    )) }),
    summary.some((s) => s.needs_phase_codes && s.needs_phase_codes.length > 0) && /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-blue-700 dark:text-blue-300", children: [
      "🔵 нужна фаза цикла:",
      " ",
      Array.from(
        new Set(summary.flatMap((s) => s.needs_phase_codes || []))
      ).join(", ")
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "h-7 text-xs", onClick: recalc, disabled: running, children: [
        running ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin mr-1" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3 mr-1" }),
        "Пересчитать"
      ] }),
      lastAt && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: new Date(lastAt).toLocaleString("ru-RU") })
    ] })
  ] });
}
const ContextMenu = ContextMenuPrimitive.Root;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
const ContextMenuSub = ContextMenuPrimitive.Sub;
const ContextMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  ContextMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[state=open]:bg-accent data-[state=open]:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronRight, { className: "ml-auto h-4 w-4" })
    ]
  }
));
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;
const ContextMenuSubContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ContextMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;
const ContextMenuContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(ContextMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  ContextMenuPrimitive.Content,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;
const ContextMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  ContextMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;
const ContextMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs(
  ContextMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(ContextMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;
const ContextMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  ContextMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(ContextMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;
const ContextMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  ContextMenuPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold text-foreground", inset && "pl-8", className),
    ...props
  }
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;
const ContextMenuSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(ContextMenuPrimitive.Separator, { ref, className: cn("-mx-1 my-1 h-px bg-border", className), ...props }));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;
const SECTION_OPTIONS = SECTIONS.map((s) => ({ value: s.key, label: s.label }));
function PlanItemsPreviewDialog({
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
  const grouped = SECTIONS.map((s) => ({
    section: s,
    rows: items.filter((it) => it.section_category === s.key)
  })).filter((g) => g.rows.length > 0);
  const selectedCount = items.filter((i) => i._selected).length;
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-3xl max-h-[85vh] flex flex-col", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Pill, { className: "w-5 h-5" }),
        "Распределение назначений по плану лечения"
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: patientName ? /* @__PURE__ */ jsxs(Fragment, { children: [
        "Будут добавлены в активный план: ",
        /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: patientName })
      ] }) : "Откройте план лечения пациента в соседней вкладке" })
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
      "Анализирую фрагмент…"
    ] }) : items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm", children: "Не удалось распознать назначения в выделенном фрагменте." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      (() => {
        const selectedItems = items.filter((i) => i._selected);
        const counts = {
          examinations: 0,
          treatments: 0,
          referrals: 0,
          diet: 0,
          surgeries: 0,
          activity: 0
        };
        for (const it of selectedItems) counts[bucketForPlanItem(it)]++;
        const kind = activeContext == null ? void 0 : activeContext.kind;
        const targetLabel = kind === "visit" ? "в визит" : kind === "ultrasound" ? "в УЗИ" : kind === "consultation" ? "в консультацию" : "в план лечения";
        return /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-muted-foreground", children: [
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3" }),
            " Предпросмотр распределения ",
            /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: targetLabel }),
            ":"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: Object.keys(counts).map((b) => /* @__PURE__ */ jsxs(
            Badge,
            {
              variant: counts[b] > 0 ? "default" : "outline",
              className: "text-[10px] h-5 px-1.5 font-normal",
              children: [
                VISIT_BUCKET_LABEL[b],
                ": ",
                counts[b]
              ]
            },
            b
          )) })
        ] });
      })(),
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between border-b pb-2", children: /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
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
      ] }) }),
      /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1 pr-3 -mr-3", children: /* @__PURE__ */ jsx("div", { className: "space-y-4", children: grouped.map(({ section, rows }) => {
        const Icon = section.icon;
        return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-muted-foreground", children: [
            /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }),
            " ",
            section.label,
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] h-4 px-1", children: rows.length })
          ] }),
          rows.map((it) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "border rounded-md p-3 bg-card space-y-2 text-sm",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
                  /* @__PURE__ */ jsx(
                    Checkbox,
                    {
                      checked: it._selected,
                      onCheckedChange: (v) => update(it._id, { _selected: v === true }),
                      className: "mt-1"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      value: it.name,
                      onChange: (e) => update(it._id, { name: e.target.value }),
                      className: "flex-1 h-8 font-medium"
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    Select,
                    {
                      value: it.section_category,
                      onValueChange: (v) => update(it._id, { section_category: v }),
                      children: [
                        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-40 h-8", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                        /* @__PURE__ */ jsx(SelectContent, { children: SECTION_OPTIONS.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value)) })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "h-8 px-2 text-[10px] font-normal whitespace-nowrap shrink-0", children: [
                    "→ ",
                    VISIT_BUCKET_LABEL[bucketForPlanItem(it)]
                  ] }),
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 shrink-0", onClick: () => remove(it._id), children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2 pl-7", children: [
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      placeholder: "Доза",
                      value: it.dose ?? "",
                      onChange: (e) => {
                        const v = e.target.value.replace(",", ".");
                        update(it._id, { dose: v === "" ? null : parseFloat(v) || null });
                      },
                      className: "h-8"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      placeholder: "ед.",
                      value: it.dose_unit ?? "",
                      onChange: (e) => update(it._id, { dose_unit: e.target.value || null }),
                      className: "h-8"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      placeholder: "Частота",
                      value: it.frequency ?? "",
                      onChange: (e) => update(it._id, { frequency: e.target.value || null }),
                      className: "h-8"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      placeholder: "Дней",
                      type: "number",
                      value: it.duration_days ?? "",
                      onChange: (e) => update(it._id, { duration_days: e.target.value ? parseInt(e.target.value) : null }),
                      className: "h-8"
                    }
                  )
                ] }),
                it.notes && /* @__PURE__ */ jsx("div", { className: "pl-7 text-xs text-muted-foreground italic", children: it.notes })
              ]
            },
            it._id
          ))
        ] }, section.key);
      }) }) })
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
            "Отправить в план (",
            selectedCount,
            ")"
          ]
        }
      )
    ] })
  ] }) });
}
const KIND_LABEL = {
  visit: "осмотр",
  ultrasound: "УЗИ",
  consultation: "консультация",
  treatment_plan: "план лечения"
};
function getSelectedText() {
  var _a2;
  const sel = (_a2 = window.getSelection) == null ? void 0 : _a2.call(window);
  return sel ? sel.toString().trim() : "";
}
function SelectionContextMenu({
  children,
  fullText,
  boundPatient,
  onBoundPatientChange
}) {
  const [active, setActive] = useState(() => getActiveContext());
  const [recent, setRecent] = useState(() => getRecentContexts());
  useEffect(() => {
    const unsub = subscribeActiveContext((ctx) => {
      setActive(ctx);
      setRecent(getRecentContexts());
    });
    const refresh = () => {
      setActive(getActiveContext());
      setRecent(getRecentContexts());
    };
    window.addEventListener("focus", refresh);
    return () => {
      unsub();
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const getFragment = () => getSelectedText() || fullText || "";
  const copyFragment = async () => {
    const text = getFragment();
    if (!text) return toast.error("Сначала выделите фрагмент");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Скопировано в буфер обмена");
    } catch {
      toast.error("Не удалось скопировать");
    }
  };
  const sendTo = (target) => {
    const text = getFragment();
    if (!text) return toast.error("Сначала выделите фрагмент");
    const result = sendFragmentToProtocol(text, target ?? void 0);
    if (target) {
      if (result === "delivered") {
        toast.success(`Отправлено: ${target.patientName} (${KIND_LABEL[target.kind] || target.kind})`);
      } else {
        toast.info("Вкладка протокола не открыта — фрагмент будет вставлен при её открытии");
      }
    } else if (result === "delivered") {
      toast.success("Отправлено в открытую вкладку протокола");
    } else {
      toast.info("Открытых вкладок протокола не найдено — фрагмент в очереди");
    }
  };
  const [rxOpen, setRxOpen] = useState(false);
  const [rxParsing, setRxParsing] = useState(false);
  const [rxItems, setRxItems] = useState([]);
  const formPrescription = async () => {
    const text = getFragment();
    if (!text) return toast.error("Сначала выделите фрагмент");
    setRxItems([]);
    setRxOpen(true);
    setRxParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-prescription-items", {
        body: { text }
      });
      if (error) throw error;
      const items = (data == null ? void 0 : data.items) || [];
      setRxItems(
        items.map((it, idx) => ({
          ...it,
          _id: `${Date.now()}-${idx}`,
          _selected: true
        }))
      );
    } catch (e) {
      toast.error("Не удалось разобрать препараты", { description: e == null ? void 0 : e.message });
      setRxOpen(false);
    } finally {
      setRxParsing(false);
    }
  };
  const effectivePatientId = (boundPatient == null ? void 0 : boundPatient.id) ?? (active == null ? void 0 : active.patientId) ?? null;
  const effectivePatientName = (boundPatient == null ? void 0 : boundPatient.name) ?? (active == null ? void 0 : active.patientName) ?? null;
  const confirmSendRxItems = (selected) => {
    if (selected.length === 0) return;
    pushPendingRxItems(selected, effectivePatientId ?? void 0);
    setRxOpen(false);
    const url = `/admin/prescriptions${effectivePatientId ? `?patientId=${effectivePatientId}` : ""}`;
    window.open(url, "_blank", "noopener");
    toast.success(
      effectivePatientName ? `${selected.length} бланк(ов) для: ${effectivePatientName}` : `${selected.length} бланк(ов) — без привязки к пациенту`
    );
  };
  const [dialogOpen, setDialogOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [previewItems, setPreviewItems] = useState([]);
  const distributeToPlan = async () => {
    const text = getFragment();
    if (!text) return toast.error("Сначала выделите фрагмент");
    setPreviewItems([]);
    setDialogOpen(true);
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-treatment-recommendations", {
        body: { text }
      });
      if (error) throw error;
      const items = (data == null ? void 0 : data.items) || [];
      setPreviewItems(
        items.map((it, idx) => ({
          ...it,
          _id: `${Date.now()}-${idx}`,
          _selected: true
        }))
      );
    } catch (e) {
      toast.error("Не удалось разобрать фрагмент", { description: e == null ? void 0 : e.message });
      setDialogOpen(false);
    } finally {
      setParsing(false);
    }
  };
  const [noProtocolPrompt, setNoProtocolPrompt] = useState(null);
  async function findLatestVisitId(patientId) {
    const { data } = await supabase.from("patient_visits").select("id").eq("patient_id", patientId).order("visit_date", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle();
    return (data == null ? void 0 : data.id) ?? null;
  }
  async function createDraftVisit(patientId, protocolType) {
    const { data, error } = await supabase.from("patient_visits").insert({
      patient_id: patientId,
      protocol_type: protocolType,
      protocol_data: {}
    }).select("id").single();
    if (error || !data) {
      toast.error("Не удалось создать протокол", { description: error == null ? void 0 : error.message });
      return null;
    }
    return data.id;
  }
  const openVisitWithItems = (visitId, items, patientId) => {
    sendPlanItemsToProtocol(items, {
      patientId,
      patientName: effectivePatientName ?? "",
      kind: "visit",
      url: "",
      updatedAt: Date.now()
    });
    window.open(`/admin/visits/${visitId}`, "_blank", "noopener");
  };
  const confirmSendPlanItems = async (selected) => {
    if (selected.length === 0) return;
    setDialogOpen(false);
    if (active && (!effectivePatientId || !active.patientId || active.patientId === effectivePatientId)) {
      sendPlanItemsToProtocol(selected, active);
      const where = active.kind === "visit" ? "в назначения визита" : active.kind === "consultation" ? "в назначения консультации" : active.kind === "ultrasound" ? "в назначения УЗИ" : "в план лечения";
      toast.success(
        `${selected.length} позиций ${where}${effectivePatientName ? ": " + effectivePatientName : ""}`
      );
      return;
    }
    if (effectivePatientId) {
      const latestId = await findLatestVisitId(effectivePatientId);
      if (latestId) {
        openVisitWithItems(latestId, selected, effectivePatientId);
        toast.success(
          `${selected.length} позиций отправлены в последний протокол пациента${effectivePatientName ? ": " + effectivePatientName : ""}`
        );
        return;
      }
      setNoProtocolPrompt({ items: selected });
      return;
    }
    sendPlanItemsToProtocol(selected);
    toast.info(
      `${selected.length} позиций в очереди — привяжите пациента к диалогу, чтобы отправить в протокол`
    );
  };
  const createAndOpen = async (protocolType) => {
    if (!noProtocolPrompt || !effectivePatientId) return;
    const items = noProtocolPrompt.items;
    setNoProtocolPrompt(null);
    const id = await createDraftVisit(effectivePatientId, protocolType);
    if (id) {
      openVisitWithItems(id, items, effectivePatientId);
      toast.success(`Создан новый протокол, ${items.length} позиций отправлены`);
    }
  };
  const bindingLabel = (boundPatient == null ? void 0 : boundPatient.id) ? boundPatient.name : (active == null ? void 0 : active.patientName) ? `${active.patientName} (из вкладки)` : null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(ContextMenu, { children: [
      /* @__PURE__ */ jsx(ContextMenuTrigger, { asChild: true, children }),
      /* @__PURE__ */ jsxs(ContextMenuContent, { className: "w-72", children: [
        /* @__PURE__ */ jsx(ContextMenuLabel, { className: "text-xs text-muted-foreground font-normal", children: bindingLabel ? /* @__PURE__ */ jsxs(Fragment, { children: [
          "Пациент: ",
          /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: bindingLabel })
        ] }) : "Без привязки к пациенту" }),
        /* @__PURE__ */ jsx(ContextMenuSeparator, {}),
        /* @__PURE__ */ jsxs(ContextMenuItem, { onSelect: copyFragment, children: [
          /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4 mr-2" }),
          " Копировать фрагмент"
        ] }),
        active ? /* @__PURE__ */ jsxs(ContextMenuItem, { onSelect: () => sendTo(active), children: [
          /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 mr-2" }),
          "Вставить в активный протокол"
        ] }) : recent.length > 0 ? /* @__PURE__ */ jsxs(ContextMenuSub, { children: [
          /* @__PURE__ */ jsxs(ContextMenuSubTrigger, { children: [
            /* @__PURE__ */ jsx(History, { className: "w-4 h-4 mr-2" }),
            " Вставить в недавний протокол"
          ] }),
          /* @__PURE__ */ jsx(ContextMenuSubContent, { className: "w-72", children: recent.map((r, i) => /* @__PURE__ */ jsxs(ContextMenuItem, { onSelect: () => sendTo(r), children: [
            /* @__PURE__ */ jsx(Users, { className: "w-3.5 h-3.5 mr-2 text-muted-foreground" }),
            /* @__PURE__ */ jsxs("span", { className: "truncate", children: [
              r.patientName,
              " ",
              /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                "· ",
                KIND_LABEL[r.kind] || r.kind
              ] })
            ] })
          ] }, i)) })
        ] }) : /* @__PURE__ */ jsxs(ContextMenuItem, { disabled: true, children: [
          /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 mr-2" }),
          " Откройте протокол в соседней вкладке"
        ] }),
        /* @__PURE__ */ jsx(ContextMenuSeparator, {}),
        /* @__PURE__ */ jsxs(ContextMenuItem, { onSelect: distributeToPlan, children: [
          /* @__PURE__ */ jsx(ListPlus, { className: "w-4 h-4 mr-2" }),
          " Распределить по плану лечения"
        ] }),
        /* @__PURE__ */ jsxs(ContextMenuItem, { onSelect: formPrescription, children: [
          /* @__PURE__ */ jsx(Pill, { className: "w-4 h-4 mr-2" }),
          " Сформировать рецепт"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      PlanItemsPreviewDialog,
      {
        open: dialogOpen,
        onOpenChange: setDialogOpen,
        items: previewItems,
        onItemsChange: setPreviewItems,
        loading: parsing,
        patientName: effectivePatientName,
        boundPatient: boundPatient ?? { id: null, name: null },
        activeContext: active,
        onPatientChange: onBoundPatientChange,
        onConfirm: confirmSendPlanItems
      }
    ),
    /* @__PURE__ */ jsx(Dialog, { open: !!noProtocolPrompt, onOpenChange: (o) => !o && setNoProtocolPrompt(null), children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Нет открытого протокола" }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          "У пациента ",
          effectivePatientName ? /* @__PURE__ */ jsx("b", { children: effectivePatientName }) : "без имени",
          " нет ни одного протокола. Создать новый и отправить туда ",
          (noProtocolPrompt == null ? void 0 : noProtocolPrompt.items.length) ?? 0,
          " назначений?"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-2", children: [
        /* @__PURE__ */ jsx(Button, { onClick: () => createAndOpen("primary_short"), children: "Новый визит (первичная)" }),
        /* @__PURE__ */ jsx(Button, { variant: "secondary", onClick: () => createAndOpen("online_consult"), children: "ONLINE консультация" }),
        /* @__PURE__ */ jsx(Button, { variant: "secondary", onClick: () => createAndOpen("uzi_reproductive"), children: "УЗИ (репродуктивная)" }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setNoProtocolPrompt(null), children: "Отмена" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(
      RxItemsPreviewDialog,
      {
        open: rxOpen,
        onOpenChange: setRxOpen,
        items: rxItems,
        onItemsChange: setRxItems,
        loading: rxParsing,
        patientName: effectivePatientName,
        boundPatient: boundPatient ?? { id: null, name: null },
        activeContext: active,
        onPatientChange: onBoundPatientChange,
        onConfirm: confirmSendRxItems
      }
    )
  ] });
}
function ThreadPatientBadge({
  value,
  onChange,
  variant = "header"
}) {
  if (variant === "inline") {
    return /* @__PURE__ */ jsx(PatientPickerPopover, { value, onChange, children: /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: "inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors",
        title: "Привязать чат к пациенту",
        children: [
          value.id ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(User, { className: "w-3 h-3 text-primary" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Контекст: ",
              /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: value.name })
            ] })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(UserX, { className: "w-3 h-3" }),
            /* @__PURE__ */ jsx("span", { children: "Без привязки к пациенту" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "underline underline-offset-2", children: "сменить" })
        ]
      }
    ) });
  }
  return /* @__PURE__ */ jsx(PatientPickerPopover, { value, onChange, children: /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      className: value.id ? "text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors" : "text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed text-muted-foreground hover:bg-accent",
      title: "Привязка чата к пациенту",
      children: [
        value.id ? /* @__PURE__ */ jsx(User, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(UserX, { className: "w-3 h-3" }),
        /* @__PURE__ */ jsx("span", { className: "font-medium truncate max-w-[180px]", children: value.id ? value.name : "Без пациента" }),
        /* @__PURE__ */ jsx(ChevronDown, { className: "w-3 h-3 opacity-60" })
      ]
    }
  ) });
}
const LABELS = {
  complaints: "Жалобы",
  anamnesis: "Анамнез",
  dynamics: "Динамика",
  general_status: "Общий/соматический статус",
  ortho_status: "Ортопедический статус",
  neuro_status: "Неврологический статус",
  psych_status: "Психологический статус",
  wound_status: "Состояние раны",
  operation_name: "Операция",
  operation_date: "Дата операции",
  pain: "Болевой синдром",
  temperature: "Температура",
  working_diagnosis: "Рабочий диагноз",
  diagnosis: "Диагноз",
  conclusion: "Заключение",
  exam_plan: "План обследования",
  recommendations: "Рекомендации",
  cbc: "ОАК",
  urinalysis: "ОАМ",
  biochem: "Биохимия",
  hormones: "Гормоны",
  other_labs: "Прочие анализы",
  uzi_express: "УЗИ (экспресс)",
  sexual_formula_text: "Половая формула",
  sexual_constitution: "Половая конституция",
  indications: "Показания"
};
const LS_FIELDS = {
  external_genitalia: "Наружные половые органы",
  penis: "Половой член",
  perineum: "Промежность",
  scrotum: "Мошонка",
  right_testis: "Правое яичко",
  left_testis: "Левое яичко",
  right: "Справа",
  left: "Слева",
  epididymis: "Придатки",
  spermatic_cord: "Семенные канатики",
  inguinal_rings: "Паховые кольца",
  notes: "Примечания"
};
function block(title, body) {
  return `### ${title}
${body.trim()}`;
}
function formatVisit(data) {
  if (!data || typeof data !== "object") return "";
  const norm = normalizeImportedProtocolData(data.type || "primary_short", data);
  const parts = [];
  for (const [key, label] of Object.entries(LABELS)) {
    const v = norm[key];
    if (typeof v === "string" && v.trim()) parts.push(block(label, v));
  }
  const ls = norm.local_status;
  if (ls && typeof ls === "object") {
    const lsParts = [];
    for (const [k, ru] of Object.entries(LS_FIELDS)) {
      const v = ls[k];
      if (typeof v === "string" && v.trim()) lsParts.push(`- ${ru}: ${v.trim()}`);
    }
    if (lsParts.length) parts.push(block("Локальный статус", lsParts.join("\n")));
  }
  const somatic = norm.somatic;
  if (somatic && typeof somatic === "object") {
    const t = somatic.full_text || somatic.general;
    if (typeof t === "string" && t.trim()) parts.push(block("Соматический статус", t));
  }
  if (!parts.length && norm.fields && typeof norm.fields === "object") {
    const raw = [];
    for (const [k, v] of Object.entries(norm.fields)) {
      if (typeof v === "string" && v.trim()) raw.push(`- ${k}: ${v.trim()}`);
    }
    if (raw.length) parts.push(block("Поля протокола", raw.slice(0, 40).join("\n")));
  }
  return parts.join("\n\n");
}
function truncate(s, max = 12e3) {
  if (s.length <= max) return s;
  return s.slice(0, max) + `

[…обрезано ${s.length - max} симв.]`;
}
async function fetchActiveProtocolText(ctx) {
  try {
    if (ctx.kind === "visit" && ctx.targetId) {
      const { data } = await supabase.from("patient_visits").select("id, visit_date, protocol_type, protocol_data, patient:patients(full_name, birth_date, history_number)").eq("id", ctx.targetId).maybeSingle();
      if (!data) return null;
      const patient = data.patient;
      const head = [
        `Пациент: ${(patient == null ? void 0 : patient.full_name) || ctx.patientName}`,
        (patient == null ? void 0 : patient.birth_date) ? `Дата рождения: ${patient.birth_date}` : null,
        (patient == null ? void 0 : patient.history_number) ? `№ истории: ${patient.history_number}` : null,
        data.visit_date ? `Дата визита: ${data.visit_date}` : null,
        data.protocol_type ? `Тип протокола: ${data.protocol_type}` : null
      ].filter(Boolean).join("\n");
      const body = formatVisit(data.protocol_data);
      return truncate([head, body].filter(Boolean).join("\n\n"));
    }
    if (ctx.kind === "ultrasound" && ctx.targetId) {
      const { data } = await supabase.from("ultrasound_results").select("*").eq("id", ctx.targetId).maybeSingle();
      if (!data) return null;
      const d = data;
      const lines = [`Пациент: ${ctx.patientName}`];
      const skip = /* @__PURE__ */ new Set(["id", "patient_id", "created_at", "updated_at", "user_id"]);
      for (const [k, v] of Object.entries(d)) {
        if (skip.has(k)) continue;
        if (v === null || v === void 0 || v === "" || v === false) continue;
        if (typeof v === "object") {
          try {
            lines.push(`- ${k}: ${JSON.stringify(v)}`);
          } catch {
          }
        } else {
          lines.push(`- ${k}: ${v}`);
        }
      }
      return truncate(lines.join("\n"));
    }
    if (ctx.kind === "treatment_plan" && ctx.targetId) {
      const [{ data: plan }, { data: items }] = await Promise.all([
        supabase.from("treatment_plans").select("*").eq("id", ctx.targetId).maybeSingle(),
        supabase.from("treatment_plan_items").select("*").eq("plan_id", ctx.targetId)
      ]);
      if (!plan) return null;
      const p = plan;
      const parts = [`Пациент: ${ctx.patientName}`];
      if (p.diagnosis) parts.push(block("Диагноз", String(p.diagnosis)));
      if (p.complaints) parts.push(block("Жалобы", String(p.complaints)));
      if (p.anamnesis) parts.push(block("Анамнез", String(p.anamnesis)));
      if (p.notes) parts.push(block("Примечания", String(p.notes)));
      if (Array.isArray(items) && items.length) {
        const rows = items.map((it) => {
          const bits = [it.name, it.dose ? `${it.dose} ${it.dose_unit || ""}` : "", it.frequency, it.duration_days ? `${it.duration_days} дн` : ""].filter(Boolean).join(" · ");
          return `- ${bits}`;
        });
        parts.push(block("Назначения плана", rows.join("\n")));
      }
      return truncate(parts.join("\n\n"));
    }
    if (ctx.kind === "consultation" && ctx.targetId) {
      const { data } = await supabase.from("consultation_rounds").select("*").eq("id", ctx.targetId).maybeSingle();
      if (!data) return null;
      const d = data;
      const parts = [`Пациент: ${ctx.patientName}`];
      for (const k of ["complaints", "anamnesis", "status", "findings", "conclusion", "recommendations", "notes"]) {
        if (d[k]) parts.push(block(k, String(d[k])));
      }
      return truncate(parts.join("\n\n"));
    }
  } catch (e) {
    console.error("[protocolContextFetcher]", e);
    return null;
  }
  return null;
}
const MAX = 2e5;
function fmtDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toISOString().slice(0, 10);
  } catch {
    return String(v);
  }
}
function stringifyValue(v) {
  if (v == null || v === "" || v === false) return "";
  if (typeof v === "object") {
    try {
      const s = JSON.stringify(v);
      return s.length > 800 ? s.slice(0, 800) + "…" : s;
    } catch {
      return "";
    }
  }
  return String(v);
}
function flattenRow(row, skip) {
  const out = [];
  for (const [k, v] of Object.entries(row)) {
    if (skip.has(k)) continue;
    const s = stringifyValue(v);
    if (s) out.push(`- ${k}: ${s}`);
  }
  return out;
}
const SKIP_META = /* @__PURE__ */ new Set(["id", "patient_id", "user_id", "created_at", "updated_at", "created_by"]);
const ANTHRO_METRICS = [
  ["height_cm", "Рост, см"],
  ["weight_kg", "Вес, кг"],
  ["bmi", "ИМТ"],
  ["bsa", "BSA, м²"],
  ["head_circumference_cm", "Окр. головы, см"],
  ["waist_circumference_cm", "Окр. талии, см"],
  ["tanner_stage", "Tanner"],
  ["penile_length_cm", "L полового члена"]
];
function buildDynamicsTable(title, rows, dateField, metrics) {
  if (!rows.length) return "";
  const sorted = [...rows].sort((a, b) => {
    const da = new Date(a[dateField] ?? a.created_at ?? 0).getTime();
    const db = new Date(b[dateField] ?? b.created_at ?? 0).getTime();
    return da - db;
  });
  const usedMetrics = metrics.filter(([k]) => sorted.some((r) => r[k] != null && r[k] !== ""));
  if (!usedMetrics.length) return "";
  const header = "| Дата | " + usedMetrics.map(([, ru]) => ru).join(" | ") + " |";
  const sep = "|" + "---|".repeat(usedMetrics.length + 1);
  const body = sorted.map((r) => {
    const cells = usedMetrics.map(([k]) => {
      const v = r[k];
      return v == null || v === "" ? "—" : String(v);
    });
    return `| ${fmtDate(r[dateField] ?? r.created_at)} | ${cells.join(" | ")} |`;
  });
  return `### ${title}
${header}
${sep}
${body.join("\n")}`;
}
async function fetchPatientHistory(patientId, patientName) {
  const counts = {
    visits: 0,
    ultrasound: 0,
    labs: 0,
    anthropometry: 0,
    plans: 0,
    rounds: 0,
    documents: 0,
    diagnoses: 0,
    metabolic: 0
  };
  const sb = supabase;
  const fetchAll = (table, orderCol) => sb.from(table).select("*").eq("patient_id", patientId).order(orderCol, { ascending: true });
  const results = await Promise.all([
    fetchAll("patient_visits", "visit_date"),
    fetchAll("ultrasound_results", "created_at"),
    fetchAll("lab_results", "created_at"),
    fetchAll("anthropometry_measurements", "measurement_date"),
    fetchAll("treatment_plans", "created_at"),
    fetchAll("patient_diagnosis_timeline", "created_at"),
    // patient_documents привязан к patient_cards (card_id), а не к patients.id —
    // прямого FK на patient_id нет, поэтому в общей ретроспективе пропускаем.
    Promise.resolve({ data: [] }),
    fetchAll("metabolic_map_snapshots", "created_at"),
    // В таблице patients нет колонки sex — не запрашиваем.
    sb.from("patients").select("full_name, birth_date, history_number, notes").eq("id", patientId).maybeSingle()
  ]);
  const [visitsRes, uzRes, labsRes, anthroRes, plansRes, diagRes, docsRes, mapRes, patientRes] = results;
  const visits = visitsRes.data || [];
  const uz = uzRes.data || [];
  const labs = labsRes.data || [];
  const anthro = anthroRes.data || [];
  const plans = plansRes.data || [];
  const diagnoses = diagRes.data || [];
  const docs = docsRes.data || [];
  const maps = mapRes.data || [];
  const patient = patientRes.data;
  let rounds = [];
  const pname = (patient == null ? void 0 : patient.full_name) || patientName;
  if (pname) {
    const { data: cases } = await supabase.from("consultation_cases").select("id").eq("patient_full_name", pname);
    const caseIds = (cases || []).map((c) => c.id);
    if (caseIds.length) {
      const { data: rr } = await supabase.from("consultation_rounds").select("*").in("case_id", caseIds).order("created_at", { ascending: true });
      rounds = rr || [];
    }
  }
  counts.visits = visits.length;
  counts.ultrasound = uz.length;
  counts.labs = labs.length;
  counts.anthropometry = anthro.length;
  counts.plans = plans.length;
  counts.rounds = rounds.length;
  counts.documents = docs.length;
  counts.diagnoses = diagnoses.length;
  counts.metabolic = maps.length;
  const parts = [];
  const head = [];
  head.push(`# Ретроспектива пациента: ${(patient == null ? void 0 : patient.full_name) || patientName || patientId}`);
  if (patient == null ? void 0 : patient.birth_date) head.push(`Дата рождения: ${patient.birth_date}`);
  if (patient == null ? void 0 : patient.history_number) head.push(`№ истории: ${patient.history_number}`);
  parts.push(head.join("\n"));
  const anthroTable = buildDynamicsTable("Динамика антропометрии", anthro, "measurement_date", ANTHRO_METRICS);
  if (anthroTable) parts.push(anthroTable);
  if (uz.length) {
    const numericKeys = /* @__PURE__ */ new Map();
    for (const r of uz) {
      for (const [k, v] of Object.entries(r)) {
        if (SKIP_META.has(k)) continue;
        if (typeof v === "number" || typeof v === "string" && v !== "" && !isNaN(Number(v))) {
          numericKeys.set(k, (numericKeys.get(k) || 0) + 1);
        }
      }
    }
    const keys = [...numericKeys.entries()].filter(([, c]) => c >= 2).map(([k]) => [k, k]);
    const uzTable = buildDynamicsTable("Динамика УЗИ (числовые показатели)", uz, "created_at", keys);
    if (uzTable) parts.push(uzTable);
  }
  if (diagnoses.length) {
    const rows = diagnoses.map((d) => `- ${fmtDate(d.diagnosis_date ?? d.created_at)}: ${d.icd10 || ""} ${d.diagnosis_text || d.notes || ""}`.trim());
    parts.push(`### Диагнозы (хронология)
${rows.join("\n")}`);
  }
  if (visits.length) {
    const blocks = visits.map((v) => {
      const inner = flattenRow(v.protocol_data || {}, /* @__PURE__ */ new Set(["type"]));
      return `#### Визит ${fmtDate(v.visit_date)} (${v.protocol_type || "?"})
${inner.join("\n") || "(без структурированных данных)"}`;
    });
    parts.push(`### Осмотры / визиты
${blocks.join("\n\n")}`);
  }
  if (uz.length) {
    const blocks = uz.map((r) => {
      const lines = flattenRow(r, SKIP_META);
      return `#### УЗИ ${fmtDate(r.created_at)}
${lines.join("\n")}`;
    });
    parts.push(`### УЗИ (полные записи)
${blocks.join("\n\n")}`);
  }
  if (labs.length) {
    const blocks = labs.map((r) => {
      const lines = flattenRow(r, SKIP_META);
      return `- ${fmtDate(r.test_date ?? r.created_at)}: ${lines.join("; ")}`;
    });
    parts.push(`### Лабораторные результаты
${blocks.join("\n")}`);
  }
  if (plans.length) {
    const blocks = plans.map((p) => {
      const bits = [
        p.diagnosis_short && `Диагноз: ${p.diagnosis_short}`,
        p.mode && `Режим: ${p.mode}`,
        p.duration_days && `Курс: ${p.duration_days} дн`,
        p.status && `Статус: ${p.status}`
      ].filter(Boolean).join(" · ");
      return `- ${fmtDate(p.issued_at ?? p.created_at)}: ${bits}`;
    });
    parts.push(`### Планы лечения
${blocks.join("\n")}`);
  }
  if (rounds.length) {
    const blocks = rounds.map((r) => {
      const body = [
        r.complaints && `Жалобы: ${r.complaints}`,
        r.medical_history && `Анамнез: ${r.medical_history}`,
        r.ai_assessment && `AI-заключение: ${r.ai_assessment}`,
        r.doctor_conclusion && `Заключение врача: ${r.doctor_conclusion}`
      ].filter(Boolean).join("\n");
      return `#### Раунд #${r.round_number ?? "?"} — ${fmtDate(r.created_at)}
${body}`;
    });
    parts.push(`### Онлайн-консультации (раунды)
${blocks.join("\n\n")}`);
  }
  if (docs.length) {
    const rows = docs.map((d) => `- ${fmtDate(d.created_at)}: ${d.title || d.file_name || "документ"} ${d.description ? "— " + d.description : ""}`);
    parts.push(`### Документы
${rows.join("\n")}`);
  }
  if (maps.length) {
    const rows = maps.map((m) => `- ${fmtDate(m.created_at)}: снимок метаболической карты (${m.summary || m.notes || "без комментария"})`);
    parts.push(`### Метаболическая карта — снимки
${rows.join("\n")}`);
  }
  parts.push(
    `---
### Инструкция моделям
Проанализируй ретроспективу пациента в хронологическом порядке. Обязательно укажи: (1) что изменилось между визитами/УЗИ/анализами; (2) положительная или отрицательная динамика; (3) какие показатели вышли за референсные значения и когда; (4) связь между предыдущими заключениями и текущим состоянием; (5) рекомендации с учётом всей истории, а не только последнего эпизода.`
  );
  let text = parts.join("\n\n");
  if (text.length > MAX) text = text.slice(0, MAX) + `

[…ретроспектива обрезана: ${text.length - MAX} симв.]`;
  return { text, counts };
}
function summarizeCounts(c) {
  const bits = [];
  if (c.visits) bits.push(`визитов: ${c.visits}`);
  if (c.ultrasound) bits.push(`УЗИ: ${c.ultrasound}`);
  if (c.labs) bits.push(`анализов: ${c.labs}`);
  if (c.anthropometry) bits.push(`антропо: ${c.anthropometry}`);
  if (c.plans) bits.push(`планов: ${c.plans}`);
  if (c.rounds) bits.push(`раундов: ${c.rounds}`);
  if (c.diagnoses) bits.push(`диагнозов: ${c.diagnoses}`);
  if (c.documents) bits.push(`документов: ${c.documents}`);
  if (c.metabolic) bits.push(`карт: ${c.metabolic}`);
  return bits.join(" · ") || "записей не найдено";
}
const CHAT_URL = `${"https://bpbwkizvvythqotcyfii.supabase.co"}/functions/v1/ai-chat`;
const COUNCIL_URL = `${"https://bpbwkizvvythqotcyfii.supabase.co"}/functions/v1/ai-council`;
const PUBMED_URL = `${"https://bpbwkizvvythqotcyfii.supabase.co"}/functions/v1/ai-pubmed`;
const PUBMED_FULLTEXT_URL = `${"https://bpbwkizvvythqotcyfii.supabase.co"}/functions/v1/ai-pubmed-fulltext`;
const GENERATE_IMAGE_URL = `${"https://bpbwkizvvythqotcyfii.supabase.co"}/functions/v1/generate-image`;
const DEFAULT_MODEL = ((_a = CURATED_MODELS.find((m) => m.key === DEFAULT_MODEL_KEY)) == null ? void 0 : _a.candidates[0]) ?? "google/gemini-2.5-flash";
const COUNCIL_MODEL_KEYS_DEFAULT = [
  "gemini-flash",
  "claude-sonnet",
  "gpt5-mini",
  "grok-fast",
  "qwen-flash",
  "glm-5"
];
const COUNCIL_MODEL_CANDIDATES = [
  "gemini-flash",
  "gemini-pro",
  "claude-sonnet",
  "claude-opus",
  "gpt5-mini",
  "gpt5",
  "grok-fast",
  "qwen-flash",
  "qwen-max",
  "glm-5",
  "deepseek-v4-pro",
  "kimi-k2",
  "kimi-k2-thinking",
  "mimo-v25-pro",
  "mistral-large"
];
const DEFAULT_SYSTEM_PROMPT = "Ты — ассистент профессора Д. И. Тарусина: профессор, д.м.н., 40 лет клинического стажа, основатель детской урологии-андрологии в России, руководитель Городского центра репродуктивного здоровья детей и подростков. Его квалификация охватывает несколько специальностей — всё подтверждено дипломами и сертификатами: детский и взрослый уролог-андролог, оперирующий хирург (оперативная андрология); психиатрия в объёме сексологии — вправе вести и фармакологически корректировать психические аспекты сексуальных и пубертатных расстройств, включая назначение психотропных препаратов в этом объёме; детский эндокринолог — в зоне щитовидной железы, половой системы и надпочечников (сахарным диабетом не занимается); травматолог-ортопед; педиатр; второе высшее юридическое образование (гражданское право) — компетентен в медицинском праве, защите персональных данных, договорном и авторском праве, не нуждается в отсылках «обратитесь к юристу». Это закрытый профессиональный клинико-научный инструмент для специалиста; его практика — дети, подростки и взрослые. Отвечай как коллега-эксперт: сразу давай прямой, конкретный, доказательный ответ — дозы, диапазоны, схемы, протоколы, диф. диагноз, мониторинг; по правовым вопросам — так же предметно (нормы, статьи, формулировки, риски). Категорически НЕ делай: не пиши «я не врач / не юрист», «не могу дать рекомендацию», «это вне компетенции уролога», «недопустимо самолечение»; не направляй собеседника «к психиатру / эндокринологу / ортопеду / юристу / специалисту» как к единственно верной тактике — это его собственные специальности; не отказывайся и не предостерегай из-за того, что речь о ребёнке или подростке — это его профильная работа; не начинай ответ с предупреждений. Противопоказания, мониторинг, взаимодействия, правовые нюансы давай по существу — как коллега коллеге.";
const DEFAULT_SUMMARIZER_PROMPT = "Ты — суммаризатор консилиума для профессора-клинициста (д.м.н., детский и взрослый уролог-андролог, оперирующий хирург; также владеет психиатрией в объёме сексологии, детской эндокринологией в зоне щитовидной железы/половой системы/надпочечников, травматологией-ортопедией, педиатрией; имеет второе высшее юридическое образование — компетентен в медицинском праве, защите персональных данных, договорном и авторском праве). Тебе даны ответы нескольких моделей на вопрос (клинический или правовой). Собери из них единый ПРЕДМЕТНЫЙ ответ для специалиста. (1) Сразу выдавай суть — дозы, диапазоны, схемы, противопоказания, мониторинг; для правовых вопросов — нормы, статьи, формулировки, риски; если модели привели цифры/нормы, сведи их в консолидированный консенсус и поставь в начало. (2) НЕ добавляй собственных дисклеймеров, не начинай с «важное предупреждение», не пиши «обратитесь к специалисту». (3) Отказы моделей игнорируй — не тащи их в сводку (можешь одной строкой отметить «модель X воздержалась»). (4) В разделе расхождений указывай только РЕАЛЬНЫЕ разногласия по существу (разные дозы, разные показания, разная тактика, разная правовая квалификация). НЕ считай расхождением рекомендацию модели «передать случай психиатру / эндокринологу / ортопеду / юристу / другому специалисту» — собеседник сам владеет этими специальностями. Такие оговорки игнорируй и в раздел расхождений не выноси.";
const SYSTEM_PROMPT_LS_KEY = "cabinet.systemPrompt.v3";
const SUMMARIZER_PROMPT_LS_KEY = "cabinet.summarizerPrompt.v3";
const FOLDERS_OPEN_LS_KEY = "cabinet.foldersOpen.v1";
const isPrivateConv = (id) => !!id && id.startsWith("private:");
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return "";
  const units = ["Б", "КБ", "МБ", "ГБ"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
};
const buildMultimodalContent = (text, atts) => {
  if (!atts.length) return text;
  const parts = [];
  if (text.trim()) parts.push({ type: "text", text });
  for (const a of atts) {
    const url = a.dataUrl;
    if (!url) continue;
    if (a.type.startsWith("image/")) {
      parts.push({ type: "image_url", image_url: { url } });
    } else if (a.type === "application/pdf") {
      parts.push({ type: "file", file: { filename: a.name, file_data: url, fileData: url } });
    }
  }
  return parts;
};
const friendlyChatError = (raw) => {
  var _a2;
  const s = (raw || "").toLowerCase();
  if (/context[_ ]?length|maximum context|token.*exceed/i.test(s))
    return "Контекст модели переполнен — удалите часть истории/вложений или выберите модель с большим контекстом.";
  if (/\b429\b|rate ?limit|too many requests/i.test(s))
    return "Превышен лимит запросов к модели (429). Подождите несколько секунд и повторите.";
  if (/\b402\b|insufficient.*credit|payment required|out of credit/i.test(s))
    return "Закончились кредиты у провайдера модели (402). Попробуйте другую модель или пополните баланс.";
  if (/\b401\b|invalid api key|unauthorized/i.test(s))
    return "Провайдер отклонил ключ (401). Сообщите администратору.";
  if (/\b404\b|model.*not.*found|no endpoints? found/i.test(s))
    return "Эта модель сейчас недоступна у провайдера (404). Выберите другую из списка.";
  if (/unsupported.*(image|file|modality|pdf)|does not support (images?|files?|pdf|vision)/i.test(s))
    return "Выбранная модель не поддерживает вложения (картинки/PDF). Снимите файл или выберите модель с поддержкой vision/PDF.";
  if (/\b5\d\d\b|internal server|bad gateway|service unavailable|timeout|timed out/i.test(s))
    return "Провайдер модели временно недоступен. Попробуйте ещё раз или выберите другую модель.";
  try {
    const j = JSON.parse(raw);
    const m = ((_a2 = j == null ? void 0 : j.error) == null ? void 0 : _a2.message) || (j == null ? void 0 : j.details) || (j == null ? void 0 : j.message);
    if (typeof m === "string" && m.length < 300) return m;
  } catch {
  }
  return raw && raw.length < 240 ? raw : "Не удалось получить ответ от модели.";
};
function linkifyPubmedCitations(content, sources, msgIndex) {
  if (!(sources == null ? void 0 : sources.length)) return content;
  let text = content.replace(/\[PMID[:\s]*\d+\]/gi, "").replace(/\s{2,}/g, " ");
  text = text.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (_m, group) => {
    const nums = group.split(",").map((s) => s.trim()).filter(Boolean);
    return nums.map((n) => {
      const idx = Number(n);
      const src = sources[idx - 1];
      if (!src) return `[${n}]`;
      return `[\\[${n}\\]](#pubmed-src-${msgIndex}-${src.pmid})`;
    }).join(" ");
  });
  return text;
}
function ConvRow({
  conv,
  active,
  folders,
  onOpen,
  onDelete,
  onMove,
  onRename
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      draggable: true,
      onDragStart: (e) => {
        e.dataTransfer.setData("application/x-conv-id", conv.id);
        e.dataTransfer.effectAllowed = "move";
      },
      className: `group flex items-start gap-1 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent ${active ? "bg-accent" : ""}`,
      onClick: onOpen,
      onDoubleClick: (e) => {
        e.stopPropagation();
        onRename();
      },
      title: conv.title,
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary opacity-100 hover:bg-primary/20 hover:text-primary",
            onClick: (e) => {
              e.stopPropagation();
              onRename();
            },
            "aria-label": "Переименовать",
            title: "Переименовать (фамилия пациента, пометка)",
            children: /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5" })
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 text-sm break-words whitespace-normal leading-snug", children: conv.title }),
        /* @__PURE__ */ jsxs(DropdownMenu, { children: [
          /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
            "button",
            {
              className: "inline-flex h-7 w-7 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground opacity-70 group-hover:opacity-100",
              onClick: (e) => e.stopPropagation(),
              "aria-label": "В папку",
              title: "В папку",
              children: /* @__PURE__ */ jsx(FolderInput, { className: "w-3.5 h-3.5" })
            }
          ) }),
          /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", onClick: (e) => e.stopPropagation(), children: [
            folders.length === 0 && /* @__PURE__ */ jsx(DropdownMenuItem, { disabled: true, children: "Нет папок" }),
            folders.map((f) => /* @__PURE__ */ jsxs(
              DropdownMenuItem,
              {
                disabled: conv.folder_id === f.id,
                onClick: (e) => {
                  e.stopPropagation();
                  onMove(f.id);
                },
                children: [
                  /* @__PURE__ */ jsx(Folder, { className: "w-3.5 h-3.5 mr-2" }),
                  f.name
                ]
              },
              f.id
            )),
            conv.folder_id && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: (e) => {
              e.stopPropagation();
              onMove(null);
            }, children: [
              /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5 mr-2" }),
              "Убрать из папки"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "inline-flex h-7 w-7 shrink-0 items-center justify-center text-muted-foreground hover:text-destructive opacity-70 group-hover:opacity-100",
            onClick: (e) => {
              e.stopPropagation();
              onDelete();
            },
            "aria-label": "Удалить",
            children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" })
          }
        )
      ]
    }
  );
}
function Cabinet() {
  const { user, loading, isAdmin } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [folders, setFolders] = useState([]);
  const [openFolders, setOpenFolders] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(window.localStorage.getItem(FOLDERS_OPEN_LS_KEY) || "{}");
    } catch {
      return {};
    }
  });
  const [unfiledOpen, setUnfiledOpen] = useState(true);
  const [pendingFolderId, setPendingFolderId] = useState(null);
  const [pendingPatient, setPendingPatient] = useState(() => {
    const a = typeof window !== "undefined" ? getActiveContext() : null;
    return { id: (a == null ? void 0 : a.patientId) ?? null, name: (a == null ? void 0 : a.patientName) ?? null };
  });
  const userTouchedPendingRef = useRef(false);
  useEffect(() => {
    const unsub = subscribeActiveContext((ctx) => {
      if (userTouchedPendingRef.current) return;
      setPendingPatient({ id: (ctx == null ? void 0 : ctx.patientId) ?? null, name: (ctx == null ? void 0 : ctx.patientName) ?? null });
    });
    return unsub;
  }, []);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return 288;
    const saved = parseInt(window.localStorage.getItem("cabinet_sidebar_width") || "");
    return Number.isFinite(saved) && saved >= 200 && saved <= 600 ? saved : 288;
  });
  const sidebarResizingRef = useRef(false);
  useEffect(() => {
    const onMove = (e) => {
      if (!sidebarResizingRef.current) return;
      const w = Math.min(600, Math.max(200, e.clientX));
      setSidebarWidth(w);
    };
    const onUp = () => {
      if (sidebarResizingRef.current) {
        sidebarResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        try {
          window.localStorage.setItem("cabinet_sidebar_width", String(sidebarWidth));
        } catch {
        }
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [sidebarWidth]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [extendedPickerOpen, setExtendedPickerOpen] = useState(false);
  const { byId: liveModelsById, loading: liveModelsLoading } = useOpenRouterModels();
  const { byId: veniceModelsById } = useVeniceModels();
  const resolvedModels = CURATED_MODELS.map((c) => resolveCuratedModel(c, liveModelsById, veniceModelsById));
  const fastModels = resolvedModels.filter((m) => m.tier === "fast");
  const deepModels = resolvedModels.filter((m) => m.tier === "deep");
  const imageModels = resolvedModels.filter((m) => m.kind === "image");
  useEffect(() => {
    if (liveModelsLoading || !resolvedModels.length) return;
    const isCurated = resolvedModels.some((r) => r.id === model);
    const isLive = liveModelsById.has(model);
    if (!isCurated && !isLive) {
      const fallback = resolvedModels.find((r) => r.key === DEFAULT_MODEL_KEY && r.available) ?? resolvedModels.find((r) => r.available);
      if (fallback) setModel(fallback.id);
    }
  }, [liveModelsLoading]);
  const currentResolved = resolvedModels.find((r) => r.id === model);
  const currentLive = liveModelsById.get(model) ?? veniceModelsById.get(model);
  const modelKnown = !!currentLive || !!(currentResolved == null ? void 0 : currentResolved.available);
  const isImageModel = (currentResolved == null ? void 0 : currentResolved.kind) === "image";
  const [imageRefs, setImageRefs] = useState([]);
  const [imageUploads, setImageUploads] = useState([]);
  const [publishingMsgIdx, setPublishingMsgIdx] = useState(null);
  const [illustratingMsgIdx, setIllustratingMsgIdx] = useState(null);
  const [illustrateModel, setIllustrateModel] = useState("google/gemini-3.1-flash-image");
  const [zoomImage, setZoomImage] = useState(null);
  const [publishDialog, setPublishDialog] = useState({ open: false, msgIdx: null, img: null, title: "", description: "", tags: "" });
  const [printPreview, setPrintPreview] = useState({ open: false, dataUrl: null });
  const imageRefFileInputRef = useRef(null);
  const [speed, setSpeed] = useState("fast");
  const [attachments, setAttachments] = useState([]);
  const [attachmentUpload, setAttachmentUpload] = useState({
    phase: "idle",
    done: 0,
    total: 0,
    detail: ""
  });
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [council, setCouncil] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [privateMode, setPrivateMode] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [searchSource, setSearchSource] = useState("pubmed");
  const [pubmedFilters, setPubmedFilters] = useState(DEFAULT_FILTERS);
  const curatedAttachmentCapable = !!(currentResolved == null ? void 0 : currentResolved.available) && (modelSupportsAttachments(currentResolved.liveInfo) || /gemini|claude|gpt-5|gpt-4o|vision|image|file|pdf/i.test(currentResolved.id));
  const attachmentsSupported = council ? true : modelSupportsAttachments(currentLive) || curatedAttachmentCapable;
  const visionCapableLabels = resolvedModels.filter((r) => r.available && modelSupportsAttachments(r.liveInfo)).map((r) => r.label);
  const [pubmedLoadingMore, setPubmedLoadingMore] = useState(null);
  const [pubmedAnalyzing, setPubmedAnalyzing] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [streamStartedAt, setStreamStartedAt] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [streamPhase, setStreamPhase] = useState("idle");
  const [streamBytes, setStreamBytes] = useState(0);
  const [streamChunks, setStreamChunks] = useState(0);
  const [ttftMs, setTtftMs] = useState(null);
  const [streamStatusLine, setStreamStatusLine] = useState("");
  const activeStreamAbortRef = useRef(null);
  useEffect(() => {
    if (!streaming || !streamStartedAt) {
      setElapsedSec(0);
      return;
    }
    setElapsedSec(Math.floor((Date.now() - streamStartedAt) / 1e3));
    const t = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - streamStartedAt) / 1e3));
    }, 1e3);
    return () => clearInterval(t);
  }, [streaming, streamStartedAt]);
  const [councilProgress, setCouncilProgress] = useState(null);
  const [councilStatuses, setCouncilStatuses] = useState([]);
  const [genericProgress, setGenericProgress] = useState(0);
  useEffect(() => {
    if (!streaming) {
      setGenericProgress(0);
      return;
    }
    setGenericProgress(15);
    const t = setInterval(() => {
      setGenericProgress((p) => p < 92 ? p + Math.max(1, Math.round((95 - p) * 0.08)) : p);
    }, 800);
    return () => clearInterval(t);
  }, [streaming]);
  const cancelActiveStream = useCallback(() => {
    var _a2;
    (_a2 = activeStreamAbortRef.current) == null ? void 0 : _a2.abort("user_cancelled");
    setStreamStatusLine("Запрос отменён пользователем");
    setStreaming(false);
    setStreamPhase("idle");
  }, []);
  const [attachProtocol, setAttachProtocol] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("cabinet.attachProtocol") !== "0";
  });
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("cabinet.attachProtocol", attachProtocol ? "1" : "0");
  }, [attachProtocol]);
  const [attachHistory, setAttachHistory] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("cabinet.attachHistory") !== "0";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cabinet.attachHistory", attachHistory ? "1" : "0");
    }
  }, [attachHistory]);
  const [councilSelectedKeys, setCouncilSelectedKeys] = useState(() => {
    if (typeof window === "undefined") return COUNCIL_MODEL_KEYS_DEFAULT;
    try {
      const saved = window.localStorage.getItem("cabinet.councilKeys");
      if (saved) return JSON.parse(saved);
    } catch {
    }
    return COUNCIL_MODEL_KEYS_DEFAULT;
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("cabinet.councilKeys", JSON.stringify(councilSelectedKeys));
      } catch {
      }
    }
  }, [councilSelectedKeys]);
  const [councilKeysOpen, setCouncilKeysOpen] = useState(false);
  const councilPanel = councilSelectedKeys.map((key) => {
    var _a2;
    return (_a2 = resolvedModels.find((m) => m.key === key && m.available)) == null ? void 0 : _a2.id;
  }).filter((id) => Boolean(id)).filter((id, index, arr) => arr.indexOf(id) === index).slice(0, 8);
  const [historyCountsHint, setHistoryCountsHint] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SYSTEM_PROMPT;
    return window.localStorage.getItem(SYSTEM_PROMPT_LS_KEY) || DEFAULT_SYSTEM_PROMPT;
  });
  const [summarizerPrompt, setSummarizerPrompt] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SUMMARIZER_PROMPT;
    return window.localStorage.getItem(SUMMARIZER_PROMPT_LS_KEY) || DEFAULT_SUMMARIZER_PROMPT;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [systemDraft, setSystemDraft] = useState(systemPrompt);
  const [summarizerDraft, setSummarizerDraft] = useState(summarizerPrompt);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const startRecording = useCallback(async () => {
    if (recording || transcribing) return;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Нет доступа к микрофону");
      return;
    }
    const mimeType = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
    if (!mimeType) {
      stream.getTracks().forEach((t) => t.stop());
      toast.error("Браузер не поддерживает запись");
      return;
    }
    const rec = new MediaRecorder(stream, { mimeType });
    recordedChunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    rec.onstop = async () => {
      var _a2;
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(recordedChunksRef.current, { type: rec.mimeType });
      recordedChunksRef.current = [];
      if (blob.size < 1024) {
        toast.error("Слишком короткая запись");
        return;
      }
      setTranscribing(true);
      try {
        const { data: sess } = await supabase.auth.getSession();
        const fd = new FormData();
        const ext = rec.mimeType.includes("mp4") ? "mp4" : "webm";
        fd.append("file", blob, `recording.${ext}`);
        const url = `${"https://bpbwkizvvythqotcyfii.supabase.co"}/functions/v1/ai-transcribe`;
        const r = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${((_a2 = sess.session) == null ? void 0 : _a2.access_token) || ""}` },
          body: fd
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error((j == null ? void 0 : j.error) || `HTTP ${r.status}`);
        }
        const { text } = await r.json();
        if (text) {
          setInput((prev) => prev ? `${prev} ${text}`.trim() : text);
        } else {
          toast.error("Ничего не распознано");
        }
      } catch (e) {
        toast.error((e == null ? void 0 : e.message) || "Ошибка распознавания");
      } finally {
        setTranscribing(false);
      }
    };
    recorderRef.current = rec;
    rec.start();
    setRecording(true);
  }, [recording, transcribing]);
  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("ai_conversations").select("id, title, model, updated_at, folder_id, patient_id, patient_name").order("updated_at", { ascending: false });
    if (error) {
      toast.error("Не удалось загрузить историю");
      return;
    }
    setConversations(data || []);
  }, [user]);
  const loadFolders = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from("ai_conversation_folders").select("id, name").order("name", { ascending: true });
    if (error) return;
    setFolders(data || []);
  }, [user]);
  useEffect(() => {
    loadConversations();
    loadFolders();
  }, [loadConversations, loadFolders]);
  const toggleFolder = (id) => {
    setOpenFolders((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        window.localStorage.setItem(FOLDERS_OPEN_LS_KEY, JSON.stringify(next));
      } catch {
      }
      return next;
    });
  };
  const createFolder = async () => {
    var _a2;
    if (!user) return;
    const name = (_a2 = window.prompt("Название папки (пациент или тема):")) == null ? void 0 : _a2.trim();
    if (!name) return;
    const { data, error } = await supabase.from("ai_conversation_folders").insert({ user_id: user.id, name }).select("id, name").single();
    if (error || !data) {
      toast.error("Не удалось создать папку");
      return;
    }
    setFolders((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "ru")));
    setOpenFolders((prev) => ({ ...prev, [data.id]: true }));
  };
  const renameFolder = async (f) => {
    var _a2;
    const name = (_a2 = window.prompt("Новое название:", f.name)) == null ? void 0 : _a2.trim();
    if (!name || name === f.name) return;
    const { error } = await supabase.from("ai_conversation_folders").update({ name }).eq("id", f.id);
    if (error) {
      toast.error("Не удалось переименовать");
      return;
    }
    setFolders((prev) => prev.map((x) => x.id === f.id ? { ...x, name } : x).sort((a, b) => a.name.localeCompare(b.name, "ru")));
  };
  const deleteFolder = async (f) => {
    if (!confirm(`Удалить папку «${f.name}»? Диалоги внутри сохранятся (вне папок).`)) return;
    const { error } = await supabase.from("ai_conversation_folders").delete().eq("id", f.id);
    if (error) {
      toast.error("Не удалось удалить папку");
      return;
    }
    setFolders((prev) => prev.filter((x) => x.id !== f.id));
    setConversations((prev) => prev.map((c) => c.folder_id === f.id ? { ...c, folder_id: null } : c));
  };
  const moveConversation = async (convId, folderId) => {
    const { error } = await supabase.from("ai_conversations").update({ folder_id: folderId }).eq("id", convId);
    if (error) {
      toast.error("Не удалось переместить");
      return;
    }
    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, folder_id: folderId } : c));
    toast.success(folderId ? "Перемещено в папку" : "Убрано из папки");
  };
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    if (isPrivateConv(activeId)) {
      return;
    }
    (async () => {
      const { data, error } = await supabase.from("ai_messages").select("id, role, content, attachments, model, image_path, image_model, image_cost, image_refs").eq("conversation_id", activeId).order("created_at", { ascending: true });
      if (error) {
        toast.error("Не удалось загрузить сообщения");
        return;
      }
      const loadedMessages = (data || []).map((m) => {
        const atts = Array.isArray(m.attachments) ? m.attachments : [];
        const councilAtt = atts.find((a) => (a == null ? void 0 : a.name) === "__council__");
        const sourcesAtt = atts.find((a) => (a == null ? void 0 : a.name) === "__sources__");
        const pubmedAtt = atts.find((a) => (a == null ? void 0 : a.name) === "__pubmed__");
        const fulltextAtt = atts.find((a) => (a == null ? void 0 : a.name) === "__fulltext__");
        const batchAtt = atts.find((a) => (a == null ? void 0 : a.name) === "__batch__");
        let councilAnswers;
        if (councilAtt == null ? void 0 : councilAtt.dataUrl) {
          try {
            const b64 = councilAtt.dataUrl.split(",")[1] || "";
            councilAnswers = JSON.parse(decodeURIComponent(escape(atob(b64))));
          } catch {
          }
        }
        let sources;
        if (sourcesAtt == null ? void 0 : sourcesAtt.dataUrl) {
          try {
            const b64 = sourcesAtt.dataUrl.split(",")[1] || "";
            sources = JSON.parse(decodeURIComponent(escape(atob(b64))));
          } catch {
          }
        }
        let pubmed;
        if (pubmedAtt == null ? void 0 : pubmedAtt.dataUrl) {
          try {
            const b64 = pubmedAtt.dataUrl.split(",")[1] || "";
            pubmed = JSON.parse(decodeURIComponent(escape(atob(b64))));
          } catch {
          }
        }
        let fulltext;
        if (fulltextAtt == null ? void 0 : fulltextAtt.dataUrl) {
          try {
            const b64 = fulltextAtt.dataUrl.split(",")[1] || "";
            fulltext = JSON.parse(decodeURIComponent(escape(atob(b64))));
          } catch {
          }
        }
        let batch;
        if (batchAtt == null ? void 0 : batchAtt.dataUrl) {
          try {
            const b64 = batchAtt.dataUrl.split(",")[1] || "";
            batch = JSON.parse(decodeURIComponent(escape(atob(b64))));
          } catch {
          }
        }
        const image = m.image_path ? {
          path: m.image_path,
          model: m.image_model || m.model || "",
          cost: typeof m.image_cost === "number" ? m.image_cost : m.image_cost ? Number(m.image_cost) : null,
          refs: Array.isArray(m.image_refs) ? m.image_refs.map((s) => {
            const slash = s.indexOf("/");
            return slash > 0 ? { bucket: s.slice(0, slash), path: s.slice(slash + 1) } : { bucket: "generated-images", path: s };
          }) : void 0
        } : void 0;
        return {
          id: m.id,
          role: m.role,
          content: m.content,
          attachments: atts.filter((a) => !["__council__", "__sources__", "__pubmed__", "__fulltext__", "__batch__"].includes(a == null ? void 0 : a.name)),
          model: m.model,
          council: councilAnswers,
          sources,
          pubmed,
          fulltext,
          batch,
          image
        };
      });
      const pathsToSign = Array.from(new Set(
        loadedMessages.flatMap((m) => (m.attachments || []).filter((a) => a.path && !a.dataUrl).map((a) => a.path))
      ));
      if (pathsToSign.length) {
        const { data: signed } = await supabase.storage.from("chat-attachments").createSignedUrls(pathsToSign, 60 * 60);
        const map = /* @__PURE__ */ new Map();
        (signed || []).forEach((s, i) => {
          if (s == null ? void 0 : s.signedUrl) map.set(pathsToSign[i], s.signedUrl);
        });
        for (const m of loadedMessages) {
          if (!m.attachments) continue;
          m.attachments = m.attachments.map((a) => a.path && map.has(a.path) ? { ...a, dataUrl: map.get(a.path) } : a);
        }
      }
      const imgPaths = loadedMessages.filter((m) => {
        var _a2;
        return (_a2 = m.image) == null ? void 0 : _a2.path;
      }).map((m) => m.image.path);
      if (imgPaths.length) {
        const { data: signed } = await supabase.storage.from("generated-images").createSignedUrls(imgPaths, 60 * 60);
        const map = /* @__PURE__ */ new Map();
        (signed || []).forEach((s, i) => {
          if (s == null ? void 0 : s.signedUrl) map.set(imgPaths[i], s.signedUrl);
        });
        for (const m of loadedMessages) {
          if (m.image && map.has(m.image.path)) m.image.signedUrl = map.get(m.image.path);
        }
      }
      setMessages(loadedMessages);
      const conv = conversations.find((c) => c.id === activeId);
      if ((conv == null ? void 0 : conv.model) === "council") {
        setCouncil(true);
      } else if (conv == null ? void 0 : conv.model) {
        setCouncil(false);
        setModel(conv.model);
      }
    })();
  }, [activeId]);
  useEffect(() => {
    var _a2;
    (_a2 = scrollRef.current) == null ? void 0 : _a2.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);
  const newConversation = async (folderId = null) => {
    setActiveId(null);
    setMessages([]);
    setAttachments([]);
    setInput("");
    setPendingFolderId(folderId);
    const a = getActiveContext();
    userTouchedPendingRef.current = false;
    setPendingPatient({ id: (a == null ? void 0 : a.patientId) ?? null, name: (a == null ? void 0 : a.patientName) ?? null });
    if (folderId) setOpenFolders((prev) => ({ ...prev, [folderId]: true }));
  };
  const currentConv = conversations.find((c) => c.id === activeId) ?? null;
  const threadPatient = activeId && currentConv ? { id: currentConv.patient_id, name: currentConv.patient_name } : pendingPatient;
  const updateThreadPatient = async (sel) => {
    if (!activeId) {
      userTouchedPendingRef.current = true;
      setPendingPatient(sel);
      toast.success(sel.id ? `Чат привяжется к пациенту: ${sel.name}` : "Чат без привязки");
      return;
    }
    const { error } = await supabase.from("ai_conversations").update({ patient_id: sel.id, patient_name: sel.name }).eq("id", activeId);
    if (error) {
      toast.error("Не удалось обновить привязку");
      return;
    }
    setConversations((prev) => prev.map(
      (c) => c.id === activeId ? { ...c, patient_id: sel.id, patient_name: sel.name } : c
    ));
    toast.success(sel.id ? `Чат привязан: ${sel.name}` : "Чат отвязан от пациента");
  };
  const renameConversation = async (conv) => {
    var _a2;
    const name = (_a2 = window.prompt("Название диалога (фамилия пациента, пометка):", conv.title)) == null ? void 0 : _a2.trim();
    if (!name || name === conv.title) return;
    const trimmed = name.slice(0, 120);
    const { error } = await supabase.from("ai_conversations").update({ title: trimmed }).eq("id", conv.id);
    if (error) {
      toast.error("Не удалось переименовать");
      return;
    }
    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, title: trimmed } : c));
    toast.success("Переименовано");
  };
  const deleteConversation = async (id) => {
    const priv = isPrivateConv(id);
    if (!confirm(priv ? "Удалить приватный диалог без следа?" : "Удалить диалог?")) return;
    if (priv) {
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      return;
    }
    const { error } = await supabase.from("ai_conversations").delete().eq("id", id);
    if (error) {
      toast.error("Не удалось удалить");
      return;
    }
    if (activeId === id) setActiveId(null);
    loadConversations();
  };
  const handleFiles = async (files) => {
    if (!files || !user) return;
    if (!attachmentsSupported) {
      toast.error("Выбранная модель не принимает вложения. Выберите модель с поддержкой картинок/PDF (например, Claude Sonnet, Gemini, GPT-5).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const MAX_FILES2 = 2;
    const MAX_SIZE = 20 * 1024 * 1024;
    const LOCAL_FALLBACK_MAX = 4 * 1024 * 1024;
    const list = Array.from(files);
    const out = [];
    const errors = [];
    setAttachmentUpload({ phase: "uploading", done: 0, total: list.length, detail: "Проверяю выбранные файлы…" });
    for (const f of list) {
      if (attachments.length + out.length >= MAX_FILES2) {
        const msg = `В обычный чат можно прикрепить максимум ${MAX_FILES2} файла. Для больших объёмов используйте «Пакетный анализ».`;
        errors.push(msg);
        toast.error(msg);
        break;
      }
      if (f.size > MAX_SIZE) {
        const msg = `${f.name}: больше 20 МБ`;
        errors.push(msg);
        toast.error(msg);
        continue;
      }
      const lowerName = (f.name || "").toLowerCase();
      const isPdfByExt = /\.pdf$/i.test(lowerName);
      const isImgByExt = /\.(png|jpe?g|webp|gif|heic|bmp|tiff?)$/i.test(lowerName);
      const rawType = (f.type || "").toLowerCase();
      const isImage = rawType.startsWith("image/") || isImgByExt;
      const isPdf = rawType === "application/pdf" || isPdfByExt;
      if (!isImage && !isPdf) {
        const msg = `${f.name}: только PDF и изображения (получено «${rawType || "неизвестный тип"}»)`;
        errors.push(msg);
        toast.error(msg);
        continue;
      }
      const effectiveType = isPdf ? "application/pdf" : rawType.startsWith("image/") ? rawType : "image/jpeg";
      const safeName = (f.name || (isPdf ? "document.pdf" : "image.jpg")).replace(/[^\w.\-]+/g, "_");
      const path = `${user.id}/chat/${crypto.randomUUID()}/${safeName}`;
      setAttachmentUpload({
        phase: "uploading",
        done: out.length,
        total: list.length,
        detail: `Загружаю ${safeName} (${formatBytes(f.size)}) в защищённое хранилище…`
      });
      let up;
      try {
        up = await supabase.storage.from("chat-attachments").upload(path, f, {
          contentType: effectiveType,
          upsert: false
        });
      } catch (e) {
        console.error("[cabinet] storage upload threw", e);
        up = { error: e };
      }
      if (up == null ? void 0 : up.error) {
        console.error("[cabinet] storage upload error", up.error);
        if (f.size <= LOCAL_FALLBACK_MAX) {
          try {
            setAttachmentUpload({
              phase: "uploading",
              done: out.length,
              total: list.length,
              detail: `Хранилище не ответило — готовлю ${safeName} локально для текущего запроса…`
            });
            const localDataUrl = await fileToDataUrl(f);
            out.push({ name: safeName, type: effectiveType, size: f.size, dataUrl: localDataUrl });
            toast.warning(`${f.name}: прикреплено только к текущему запросу (история без файла)`);
            continue;
          } catch (e) {
            const msg2 = `${f.name}: не удалось подготовить локально (${(e == null ? void 0 : e.message) || "FileReader"})`;
            errors.push(msg2);
            toast.error(msg2);
            continue;
          }
        }
        const msg = `${f.name}: не удалось загрузить в хранилище (${up.error.message || "network"})`;
        errors.push(msg);
        toast.error(msg);
        continue;
      }
      let dataUrl = "";
      try {
        setAttachmentUpload({
          phase: "uploading",
          done: out.length,
          total: list.length,
          detail: isPdf && f.size <= LOCAL_FALLBACK_MAX ? `Кодирую PDF для модели: ${safeName}…` : `Создаю временную ссылку для модели: ${safeName}…`
        });
        if (isPdf && f.size <= LOCAL_FALLBACK_MAX) {
          dataUrl = await fileToDataUrl(f);
        } else {
          const { data: signed, error: signError } = await supabase.storage.from("chat-attachments").createSignedUrl(path, 60 * 60);
          if (signError || !(signed == null ? void 0 : signed.signedUrl)) throw signError || new Error("signed URL missing");
          dataUrl = signed.signedUrl;
        }
      } catch (e) {
        console.error("[cabinet] signed URL failed, falling back to base64", e);
        if (f.size > LOCAL_FALLBACK_MAX) {
          const msg = `${f.name}: файл загружен, но не удалось создать временную ссылку для модели`;
          errors.push(msg);
          toast.error(msg);
          continue;
        }
        try {
          dataUrl = await fileToDataUrl(f);
        } catch (readErr) {
          console.error("[cabinet] fileToDataUrl failed", readErr);
          const msg = `${f.name}: файл загружен, но не удалось подготовить его для модели`;
          errors.push(msg);
          toast.error(msg);
          continue;
        }
      }
      out.push({ name: safeName, type: effectiveType, size: f.size, path, dataUrl });
    }
    if (out.length) {
      const detail = `Готово к отправке: ${out.map((a) => `${a.name}${a.size ? ` · ${formatBytes(a.size)}` : ""}`).join(", ")}`;
      setAttachmentUpload({ phase: "ready", done: out.length, total: list.length, detail });
      toast.success(`Прикреплено: ${out.map((a) => a.name).join(", ")}`);
      setTimeout(() => setAttachmentUpload((s) => s.phase === "ready" ? { phase: "idle", done: 0, total: 0, detail: "" } : s), 8e3);
    } else {
      const detail = errors[0] || "Файлы не прикреплены";
      setAttachmentUpload({ phase: "error", done: 0, total: list.length, detail, error: detail });
    }
    setAttachments((prev) => [...prev, ...out]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const pubmedMode = webSearch && searchSource === "pubmed" && !council;
  const ensureConversation = async (titleSeed, modelTag) => {
    if (!user) return null;
    if (activeId) return activeId;
    if (privateMode) {
      const pid = `private:${crypto.randomUUID()}`;
      setActiveId(pid);
      return pid;
    }
    const title = titleSeed.slice(0, 60) || "Новый диалог";
    const { data, error } = await supabase.from("ai_conversations").insert({ user_id: user.id, title, model: modelTag, folder_id: pendingFolderId, patient_id: pendingPatient.id, patient_name: pendingPatient.name }).select("id, title, model, updated_at, folder_id, patient_id, patient_name").single();
    if (error || !data) {
      toast.error("Не удалось создать диалог");
      return null;
    }
    setActiveId(data.id);
    setConversations((prev) => [data, ...prev]);
    setPendingFolderId(null);
    return data.id;
  };
  const handleBatchResult = useCallback(async ({ final, partial, task }) => {
    if (!user) return;
    const convId = await ensureConversation(`📚 ${task.slice(0, 50)}`, "anthropic/claude-sonnet-4.6");
    if (!convId) return;
    const userContent = `📚 Пакетный анализ документов: ${task}`;
    const priv = isPrivateConv(convId);
    if (!priv) {
      await supabase.from("ai_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "user",
        content: userContent,
        model: "batch-input"
      });
      const batchJson = JSON.stringify({ task, partial });
      const b64 = btoa(unescape(encodeURIComponent(batchJson)));
      await supabase.from("ai_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "assistant",
        content: final,
        model: "anthropic/claude-sonnet-4.6 (batch)",
        attachments: [{ name: "__batch__", type: "application/json", dataUrl: `data:application/json;base64,${b64}` }]
      });
      await supabase.from("ai_conversations").update({ updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", convId);
    }
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userContent },
      { role: "assistant", content: final, model: "anthropic/claude-sonnet-4.6 (batch)", batch: { task, partial } }
    ]);
    if (!priv) loadConversations();
    toast.success("Анализ готов");
  }, [user, activeId, pendingFolderId, privateMode]);
  const persistPubmedAssistant = async (convId, content, payload) => {
    if (!user || isPrivateConv(convId)) return;
    const pubmedB64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    await supabase.from("ai_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "assistant",
      content,
      model: `pubmed:${model}`,
      attachments: [{ name: "__pubmed__", type: "application/json", dataUrl: `data:application/json;base64,${pubmedB64}` }]
    });
    await supabase.from("ai_conversations").update({ updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", convId);
    loadConversations();
  };
  const sendPubmedMessage = async () => {
    var _a2;
    if (!user || streaming) return;
    const text = input.trim();
    if (!text) {
      toast.error("Введите клинический вопрос");
      return;
    }
    setStreaming(true);
    setStreamStartedAt(Date.now());
    const userMsg = { role: "user", content: text };
    const convId = await ensureConversation(text, `pubmed:${model}`);
    if (!convId) {
      setStreaming(false);
      return;
    }
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    if (!isPrivateConv(convId)) {
      await supabase.from("ai_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "user",
        content: text,
        model
      });
    }
    try {
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch(PUBMED_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${((_a2 = sess.session) == null ? void 0 : _a2.access_token) ?? ""}` },
        body: JSON.stringify({ question: text, filters: pubmedFilters, model, system: systemPrompt })
      });
      if (!resp.ok) {
        const err = await resp.text().catch(() => "");
        throw new Error(err || `HTTP ${resp.status}`);
      }
      const json = await resp.json();
      const answerText = String(json.answer || "").trim();
      const payload = {
        used_query: json.used_query || "",
        english_query: json.english_query || "",
        total_count: Number(json.total_count) || 0,
        retstart: Number(json.retstart) || 0,
        sources: json.sources || []
      };
      if (!answerText) {
        throw new Error(
          payload.sources.length === 0 ? `PubMed по запросу «${payload.english_query || text}» не нашёл источников — модель нечего было анализировать.` : `PubMed вернул ${payload.sources.length} источников, но модель не сформировала текст ответа. Смените модель или повторите.`
        );
      }
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: answerText, model: `pubmed:${model}`, pubmed: payload };
        return next;
      });
      await persistPubmedAssistant(convId, answerText, payload);
    } catch (e) {
      toast.error("PubMed-поиск не удался: " + ((e == null ? void 0 : e.message) || ""));
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "⚠️ Ошибка PubMed-поиска." };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };
  const loadMorePubmed = async (msgIndex) => {
    var _a2;
    const msg = messages[msgIndex];
    if (!(msg == null ? void 0 : msg.pubmed) || pubmedLoadingMore !== null) return;
    setPubmedLoadingMore(msgIndex);
    try {
      const nextStart = msg.pubmed.retstart + msg.pubmed.sources.length;
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch(PUBMED_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${((_a2 = sess.session) == null ? void 0 : _a2.access_token) ?? ""}` },
        body: JSON.stringify({
          question: msg.pubmed.english_query,
          english_query: msg.pubmed.english_query,
          filters: pubmedFilters,
          model,
          retstart: nextStart,
          skip_answer: true
        })
      });
      if (!resp.ok) throw new Error(await resp.text());
      const json = await resp.json();
      const newSources = json.sources || [];
      const merged = [...msg.pubmed.sources];
      for (const s of newSources) {
        if (!merged.some((x) => x.pmid === s.pmid)) merged.push(s);
      }
      const updated = { ...msg.pubmed, sources: merged, total_count: Number(json.total_count) || msg.pubmed.total_count };
      setMessages((prev) => prev.map((m, i) => i === msgIndex ? { ...m, pubmed: updated } : m));
      if (msg.id && !isPrivateConv(activeId)) {
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(updated))));
        await supabase.from("ai_messages").update({
          attachments: [{ name: "__pubmed__", type: "application/json", dataUrl: `data:application/json;base64,${b64}` }]
        }).eq("id", msg.id);
      }
    } catch (e) {
      toast.error("Не удалось дозагрузить: " + ((e == null ? void 0 : e.message) || ""));
    } finally {
      setPubmedLoadingMore(null);
    }
  };
  const callFulltext = async (args) => {
    var _a2;
    const { data: sess } = await supabase.auth.getSession();
    const resp = await fetch(PUBMED_FULLTEXT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${((_a2 = sess.session) == null ? void 0 : _a2.access_token) ?? ""}` },
      body: JSON.stringify({
        pmid: args.pmid,
        pmcid: args.pmcid,
        question: args.question,
        model,
        system: systemPrompt
      })
    });
    const json = await resp.json();
    return { ok: resp.ok, json };
  };
  const persistFulltextMessage = async (content, meta) => {
    const convId = activeId;
    if (!convId || !user || isPrivateConv(convId)) return;
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(meta))));
    const att = { name: "__fulltext__", type: "application/json", dataUrl: `data:application/json;base64,${b64}` };
    await supabase.from("ai_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "assistant",
      content,
      model: `pubmed-fulltext:${model}`,
      attachments: [att]
    });
    await supabase.from("ai_conversations").update({ updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", convId);
    loadConversations();
  };
  const analyzePubmedArticle = async (source, originalQuestion) => {
    if (!user || pubmedAnalyzing) return;
    setPubmedAnalyzing(source.pmid);
    try {
      const { ok, json } = await callFulltext({
        pmid: source.pmid,
        pmcid: source.pmcid,
        title: source.title,
        question: originalQuestion
      });
      if (!ok) {
        toast.error((json == null ? void 0 : json.error) || "Не удалось получить полный текст");
        return;
      }
      const meta = {
        pmid: source.pmid,
        pmcid: json.pmcid || source.pmcid,
        title: source.title,
        pmc_url: json.pmc_url
      };
      const content = json.analysis || "";
      const assistantMsg = { role: "assistant", content, model: `pubmed-fulltext:${model}`, fulltext: meta };
      setMessages((prev) => [...prev, assistantMsg]);
      await persistFulltextMessage(content, meta);
    } catch (e) {
      toast.error("Ошибка разбора: " + ((e == null ? void 0 : e.message) || ""));
    } finally {
      setPubmedAnalyzing(null);
    }
  };
  const [fulltextFollowupLoading, setFulltextFollowupLoading] = useState(null);
  const askFulltextFollowup = async (meta, userQuestion) => {
    if (!user || fulltextFollowupLoading) return;
    setFulltextFollowupLoading(meta.pmid);
    const userMsg = { role: "user", content: userQuestion };
    setMessages((prev) => [...prev, userMsg]);
    if (activeId && !isPrivateConv(activeId)) {
      await supabase.from("ai_messages").insert({
        conversation_id: activeId,
        user_id: user.id,
        role: "user",
        content: userQuestion,
        model
      });
    }
    try {
      const { ok, json } = await callFulltext({
        pmid: meta.pmid,
        pmcid: meta.pmcid,
        title: meta.title,
        question: userQuestion
      });
      if (!ok) {
        toast.error((json == null ? void 0 : json.error) || "Не удалось получить ответ");
        return;
      }
      const assistantMsg = {
        role: "assistant",
        content: json.analysis || "",
        model: `pubmed-fulltext:${model}`,
        fulltext: meta
      };
      setMessages((prev) => [...prev, assistantMsg]);
      await persistFulltextMessage(assistantMsg.content, meta);
    } catch (e) {
      toast.error("Ошибка: " + ((e == null ? void 0 : e.message) || ""));
    } finally {
      setFulltextFollowupLoading(null);
    }
  };
  const addImageRefFromStorage = async (bucket, path, name) => {
    try {
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
      setImageRefs((prev) => [...prev, { bucket, path, signedUrl: signed == null ? void 0 : signed.signedUrl, name }]);
    } catch {
      setImageRefs((prev) => [...prev, { bucket, path, name }]);
    }
  };
  const handleImageRefFiles = async (files) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 4);
    for (const f of arr) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name}: не картинка`);
        continue;
      }
      if (f.size > 8 * 1024 * 1024) {
        toast.error(`${f.name}: больше 8 МБ`);
        continue;
      }
      const dataUrl = await fileToDataUrl(f);
      const b64 = dataUrl.split(",")[1] || "";
      const preview = URL.createObjectURL(f);
      setImageUploads((prev) => [...prev, { name: f.name, dataBase64: b64, mime: f.type, previewUrl: preview }]);
    }
  };
  const generateImage = async (opts) => {
    var _a2;
    if (!user || streaming) return;
    const prompt = input.trim();
    if (!prompt) {
      toast.error("Опишите изображение");
      return;
    }
    setStreaming(true);
    setStreamStartedAt(Date.now());
    let convId = activeId;
    if (!convId) {
      if (privateMode) {
        convId = `private:${crypto.randomUUID()}`;
        setActiveId(convId);
      } else {
        const title = prompt.slice(0, 60) || "Иллюстрация";
        const { data, error } = await supabase.from("ai_conversations").insert({ user_id: user.id, title, model, folder_id: pendingFolderId, patient_id: pendingPatient.id, patient_name: pendingPatient.name }).select("id, title, model, updated_at, folder_id, patient_id, patient_name").single();
        if (error || !data) {
          toast.error("Не удалось создать диалог");
          setStreaming(false);
          return;
        }
        convId = data.id;
        setActiveId(convId);
        setConversations((prev) => [data, ...prev]);
        setPendingFolderId(null);
      }
    }
    const priv = isPrivateConv(convId);
    const refAttachments = imageRefs.map((r) => ({
      name: r.name || r.path.split("/").pop() || "ref",
      type: "image/png",
      dataUrl: r.signedUrl,
      path: r.path
    }));
    const uploadAttachments = imageUploads.map((u) => ({
      name: u.name,
      type: u.mime,
      dataUrl: u.previewUrl
    }));
    const userMsg = { role: "user", content: prompt, attachments: [...refAttachments, ...uploadAttachments] };
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "", model }]);
    setInput("");
    const refsForCall = imageRefs.map((r) => ({ bucket: r.bucket, path: r.path }));
    if (!priv) {
      await supabase.from("ai_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "user",
        content: prompt,
        attachments: refAttachments.map((a) => ({ name: a.name, type: a.type, path: a.path })),
        model
      });
    }
    try {
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch(GENERATE_IMAGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${((_a2 = sess.session) == null ? void 0 : _a2.access_token) ?? ""}` },
        body: JSON.stringify({
          prompt,
          model,
          conversationId: convId,
          references: refsForCall,
          uploadedRefs: imageUploads.map((u) => ({ name: u.name, dataBase64: u.dataBase64, mime: u.mime }))
        })
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error((j == null ? void 0 : j.error) || `HTTP ${resp.status}`);
      }
      const allRefs = [...refsForCall, ...j.savedRefs || []];
      const imageMeta = {
        path: j.imagePath,
        signedUrl: j.signedUrl,
        model: j.model || model,
        cost: typeof j.cost === "number" ? j.cost : null,
        refs: allRefs
      };
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "", model, image: imageMeta };
        return next;
      });
      if (!priv) {
        await supabase.from("ai_messages").insert({
          conversation_id: convId,
          user_id: user.id,
          role: "assistant",
          content: "",
          model,
          image_path: j.imagePath,
          image_model: j.model || model,
          image_cost: typeof j.cost === "number" ? j.cost : null,
          image_refs: allRefs.map((r) => `${r.bucket}/${r.path}`)
        });
        await supabase.from("ai_conversations").update({ model, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", convId);
        loadConversations();
      }
      setImageRefs([]);
      imageUploads.forEach((u) => URL.revokeObjectURL(u.previewUrl));
      setImageUploads([]);
      if (typeof j.cost === "number" && j.cost > 0) {
        toast.success(`Готово · $${j.cost.toFixed(4)}`);
      } else {
        toast.success("Изображение готово");
      }
    } catch (e) {
      toast.error((e == null ? void 0 : e.message) || "Не удалось сгенерировать");
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "⚠️ Ошибка генерации изображения." };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };
  const illustrateMessage = async (msgIdx, text) => {
    var _a2, _b, _c;
    if (!user || streaming || illustratingMsgIdx !== null) return;
    const clean = (text || "").trim();
    if (!clean) {
      toast.error("Нечего иллюстрировать");
      return;
    }
    const imgModel = illustrateModel || ((_a2 = imageModels.find((m) => m.key === "img-gemini-flash" && m.available)) == null ? void 0 : _a2.id) || ((_b = imageModels.find((m) => m.available)) == null ? void 0 : _b.id) || "google/gemini-3.1-flash-image";
    let convId = activeId;
    if (!convId) {
      toast.error("Откройте диалог");
      return;
    }
    const priv = isPrivateConv(convId);
    const prompt = "Создай образовательную клиническую медицинскую иллюстрацию в стиле анатомического атласа/учебника (как Netter, Sobotta): схематично, без фотореализма, без обнажённых людей — только анатомические структуры (органы, сосуды, ткани в разрезе), educational medical textbook diagram, non-explicit, clinical, anatomical chart. Минимум текста, подписи на русском.\n\nВАЖНО про стороны: используй анатомическую ориентацию пациента — правая сторона ПАЦИЕНТА находится СЛЕВА от зрителя, левая сторона ПАЦИЕНТА — СПРАВА от зрителя (как при осмотре врачом лицом к лицу). Подписи 'правый/правая' и 'левый/левая' обязательно соотноси со стороной пациента, а не зрителя. Если в тексте указана сторона (например 'левостороннее варикоцеле'), помести изображение этой патологии справа на картинке.\n\nОтвет:\n" + clean.slice(0, 1800);
    setIllustratingMsgIdx(msgIdx);
    setMessages((prev) => [...prev, { role: "assistant", content: "", model: imgModel }]);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const resp = await fetch(GENERATE_IMAGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${((_c = sess.session) == null ? void 0 : _c.access_token) ?? ""}` },
        body: JSON.stringify({ prompt, model: imgModel, conversationId: convId, references: [], uploadedRefs: [] })
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error((j == null ? void 0 : j.error) || `HTTP ${resp.status}`);
      const imageMeta = {
        path: j.imagePath,
        signedUrl: j.signedUrl,
        model: j.model || imgModel,
        cost: typeof j.cost === "number" ? j.cost : null,
        refs: []
      };
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "", model: imgModel, image: imageMeta };
        return next;
      });
      if (!priv) {
        await supabase.from("ai_messages").insert({
          conversation_id: convId,
          user_id: user.id,
          role: "assistant",
          content: "",
          model: imgModel,
          image_path: j.imagePath,
          image_model: j.model || imgModel,
          image_cost: typeof j.cost === "number" ? j.cost : null,
          image_refs: []
        });
        await supabase.from("ai_conversations").update({ updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", convId);
      }
      if (typeof j.cost === "number" && j.cost > 0) {
        toast.success(`Иллюстрация готова · $${j.cost.toFixed(4)}`);
      } else {
        toast.success("Иллюстрация готова");
      }
    } catch (e) {
      const raw = (e == null ? void 0 : e.message) || "Не удалось проиллюстрировать";
      const isModeration = /moderation_blocked|safety_violations|safety system|content_policy/i.test(raw);
      const isOpenAI = imgModel.startsWith("openai/");
      const friendly = isModeration ? isOpenAI ? "OpenAI заблокировал медицинский запрос (фильтр безопасности). Переключитесь на Gemini-модель — она обычно пропускает клиническую анатомию." : "Модель отклонила запрос по фильтру безопасности. Попробуйте другую модель или переформулируйте." : raw;
      toast.error(friendly, { duration: 8e3 });
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: `⚠️ ${friendly}` };
        return next;
      });
    } finally {
      setIllustratingMsgIdx(null);
    }
  };
  const downloadImage = async (signedUrl, filename) => {
    try {
      const r = await fetch(signedUrl);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1e3);
    } catch {
      window.open(signedUrl, "_blank");
    }
  };
  const printImage = async (signedUrl) => {
    try {
      const r = await fetch(signedUrl);
      const blob = await r.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });
      setPrintPreview({ open: true, dataUrl });
    } catch {
      toast.error("Не удалось загрузить изображение для предпросмотра");
    }
  };
  const confirmPrint = () => {
    const dataUrl = printPreview.dataUrl;
    if (!dataUrl) return;
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) {
      toast.error("Браузер заблокировал окно печати. Разрешите всплывающие окна.");
      return;
    }
    w.document.write(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<title>Печать изображения</title>
<style>
  @page { size: A4; margin: 10mm; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .sheet {
    width: 190mm; height: 277mm;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto;
  }
  .sheet img {
    max-width: 100%; max-height: 100%;
    object-fit: contain;
    image-rendering: -webkit-optimize-contrast;
  }
  @media screen {
    body { background: #2a2a2a; padding: 20px 0; }
    .sheet { background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,.4); }
  }
</style>
</head>
<body>
  <div class="sheet"><img id="i" src="${dataUrl}" alt="" /></div>
  <script>
    const img = document.getElementById('i');
    function go(){ setTimeout(() => { window.focus(); window.print(); }, 150); }
    if (img.complete) go(); else img.addEventListener('load', go);
  <\/script>
</body>
</html>`);
    w.document.close();
    setPrintPreview({ open: false, dataUrl: null });
  };
  const useGeneratedAsRef = async (img) => {
    await addImageRefFromStorage("generated-images", img.path, "Предыдущая генерация");
    toast.success("Добавлено как референс — отредактируйте промпт и нажмите «Сгенерировать»");
  };
  const publishToLibrary = (msgIdx, img) => {
    setPublishDialog({ open: true, msgIdx, img, title: "", description: "", tags: "" });
  };
  const confirmPublishToLibrary = async () => {
    if (!user) return;
    const { msgIdx, img, title, description, tags: tagsRaw } = publishDialog;
    if (msgIdx === null || !img) return;
    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    setPublishingMsgIdx(msgIdx);
    setPublishDialog((d) => ({ ...d, open: false }));
    try {
      const { data: blob, error: dlErr } = await supabase.storage.from("generated-images").download(img.path);
      if (dlErr || !blob) throw new Error((dlErr == null ? void 0 : dlErr.message) || "download failed");
      const refId = crypto.randomUUID();
      const refPath = `${user.id}/${refId}.png`;
      const up = await supabase.storage.from("reference-library").upload(refPath, blob, { contentType: "image/png", upsert: false });
      if (up.error) throw up.error;
      const { error: insErr } = await supabase.from("image_references").insert({
        user_id: user.id,
        path: refPath,
        title: title.trim() || null,
        description: description.trim() || null,
        tags
      });
      if (insErr) throw insErr;
      toast.success("Опубликовано в библиотеке референсов");
    } catch (e) {
      toast.error((e == null ? void 0 : e.message) || "Не удалось опубликовать");
    } finally {
      setPublishingMsgIdx(null);
    }
  };
  const sendMessage = async () => {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i;
    if (isImageModel) return generateImage();
    if (pubmedMode) return sendPubmedMessage();
    if (!user || streaming) return;
    let text = input.trim();
    if (!text && !attachments.length) return;
    setStreaming(true);
    setStreamStartedAt(Date.now());
    setCouncilProgress(null);
    if (attachProtocol) {
      const ctx = getActiveContext();
      if (ctx) {
        try {
          const body = await fetchActiveProtocolText(ctx);
          if (body && body.trim()) {
            text = `[Контекст пациента из активного протокола (${ctx.kind}) — ${ctx.patientName}]

${body}

---

${text || "(без дополнительного вопроса — оцените и предложите тактику)"}`;
            toast.success(`Прикреплён протокол: ${ctx.patientName}`, { duration: 2e3 });
          }
        } catch (e) {
          console.warn("attach protocol failed", e);
        }
      }
    }
    if (attachHistory && pendingPatient.id) {
      try {
        toast.info("Собираю всю историю пациента…", { duration: 2e3 });
        const { text: historyText, counts } = await fetchPatientHistory(pendingPatient.id, pendingPatient.name || void 0);
        const summary = summarizeCounts(counts);
        setHistoryCountsHint(summary);
        if (historyText && historyText.trim()) {
          text = `[Полная ретроспектива пациента — ${pendingPatient.name || pendingPatient.id}]
${summary}

${historyText}

---

${text || "(без дополнительного вопроса — проанализируйте динамику и предложите тактику)"}`;
          toast.success(`История подтянута: ${summary}`, { duration: 3e3 });
        } else {
          toast.warning("По пациенту не найдено исторических записей");
        }
      } catch (e) {
        console.warn("attach history failed", e);
        toast.error(`Не удалось собрать историю: ${(e == null ? void 0 : e.message) || e}`);
      }
    }
    const attachmentsForSend = await Promise.all(attachments.map(async (a) => {
      if (a.dataUrl || !a.path) return a;
      const { data: signed } = await supabase.storage.from("chat-attachments").createSignedUrl(a.path, 60 * 60);
      return (signed == null ? void 0 : signed.signedUrl) ? { ...a, dataUrl: signed.signedUrl } : a;
    }));
    const unavailable = attachmentsForSend.filter((a) => !a.dataUrl);
    if (unavailable.length) {
      toast.error(`Не могу передать модели файл: ${unavailable.map((a) => a.name).join(", ")}`);
      setStreaming(false);
      return;
    }
    const userMsg = { role: "user", content: text, attachments: attachmentsForSend };
    let convId = activeId;
    if (!convId) {
      if (privateMode) {
        convId = `private:${crypto.randomUUID()}`;
        setActiveId(convId);
      } else {
        const title = text.slice(0, 60) || "Новый диалог";
        const { data, error } = await supabase.from("ai_conversations").insert({ user_id: user.id, title, model, folder_id: pendingFolderId, patient_id: pendingPatient.id, patient_name: pendingPatient.name }).select("id, title, model, updated_at, folder_id, patient_id, patient_name").single();
        if (error || !data) {
          toast.error("Не удалось создать диалог");
          setStreaming(false);
          return;
        }
        convId = data.id;
        setActiveId(convId);
        setConversations((prev) => [data, ...prev]);
        setPendingFolderId(null);
      }
    }
    const priv = isPrivateConv(convId);
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setAttachments([]);
    const persistedAtts = (userMsg.attachments || []).map(
      (a) => a.path ? { name: a.name, type: a.type, size: a.size, path: a.path } : { name: a.name, type: a.type, size: a.size }
    );
    if (!priv) {
      await supabase.from("ai_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "user",
        content: text,
        attachments: persistedAtts,
        model
      });
    }
    const historyForApi = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: buildMultimodalContent(m.content, m.attachments || [])
    }));
    let assistantSoFar = "";
    let councilAnswers;
    let collectedSources = [];
    const usedWebSearch = webSearch && !council;
    if (council) {
      setCouncilStatuses(councilPanel.map((m) => ({ model: m, state: "pending" })));
      setCouncilProgress({ done: 0, total: councilPanel.length, stage: "fanout" });
    } else {
      setCouncilStatuses([]);
    }
    try {
      const { data: sess } = await supabase.auth.getSession();
      const url = council ? COUNCIL_URL : CHAT_URL;
      const payload = council ? { messages: historyForApi, system: systemPrompt, system_summarizer: summarizerPrompt, models: councilPanel } : { model, messages: historyForApi, reasoning_effort: speed === "fast" ? "low" : "high", system: systemPrompt, web_search: usedWebSearch, search_source: searchSource };
      setStreamPhase("connecting");
      setStreamBytes(0);
      setStreamChunks(0);
      setTtftMs(null);
      setStreamStatusLine("Открываю защищённый канал к модели…");
      const controller = new AbortController();
      activeStreamAbortRef.current = controller;
      const reqStartedAt = Date.now();
      const STALL_LIMIT_MS = 9e4;
      const HARD_LIMIT_MS = 3e5;
      let stallTimer = null;
      const armStall = () => {
        if (stallTimer) clearTimeout(stallTimer);
        stallTimer = setTimeout(() => controller.abort("stream_stalled"), STALL_LIMIT_MS);
      };
      const hardTimer = setTimeout(() => controller.abort("stream_hard_limit"), HARD_LIMIT_MS);
      armStall();
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${((_a2 = sess.session) == null ? void 0 : _a2.access_token) ?? ""}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!resp.ok || !resp.body) {
        const errTxt = await resp.text().catch(() => "");
        if (stallTimer) clearTimeout(stallTimer);
        clearTimeout(hardTimer);
        setStreamPhase("idle");
        throw new Error(errTxt || `HTTP ${resp.status}`);
      }
      setStreamPhase("waiting");
      const usedModelHeader = resp.headers.get("x-used-model");
      const usedGatewayHeader = resp.headers.get("x-used-gateway");
      if (usedModelHeader) {
        setStreamStatusLine(`HTTP ${resp.status} · модель приняла запрос: ${usedModelHeader}${usedGatewayHeader ? ` · ${usedGatewayHeader}` : ""}`);
      } else {
        setStreamStatusLine(`HTTP ${resp.status} · соединение установлено, жду первый токен`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let pendingEvent = null;
      let firstTokenSeen = false;
      let reasoningChars = 0;
      let progressEvents = 0;
      let fatalStreamError = null;
      const mergeAnnotations = (anns) => {
        if (!Array.isArray(anns)) return;
        for (const a of anns) {
          const cit = (a == null ? void 0 : a.url_citation) || ((a == null ? void 0 : a.type) === "url_citation" ? a : null);
          const url2 = (cit == null ? void 0 : cit.url) || (a == null ? void 0 : a.url);
          if (!url2) continue;
          if (collectedSources.some((s) => s.url === url2)) continue;
          collectedSources.push({ url: url2, title: (cit == null ? void 0 : cit.title) || (a == null ? void 0 : a.title), content: (cit == null ? void 0 : cit.content) || (a == null ? void 0 : a.content) });
        }
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          armStall();
          setStreamBytes((b) => b + value.byteLength);
          setStreamChunks((c) => c + 1);
        }
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith("event: ")) {
            pendingEvent = line.slice(7).trim();
            continue;
          }
          if (!line.startsWith("data: ")) {
            if (line === "") pendingEvent = null;
            continue;
          }
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            pendingEvent = null;
            continue;
          }
          try {
            const parsed = JSON.parse(json);
            if (pendingEvent === "status") {
              progressEvents++;
              const usedModel = (parsed == null ? void 0 : parsed.model) ? String(parsed.model) : model;
              const gateway = (parsed == null ? void 0 : parsed.gateway) ? String(parsed.gateway) : "gateway";
              setStreamPhase("waiting");
              setStreamStatusLine(`Канал открыт · ${usedModel} · ${gateway} · жду токены`);
              pendingEvent = null;
              continue;
            }
            if (pendingEvent === "heartbeat") {
              progressEvents++;
              const elapsed = Number(parsed == null ? void 0 : parsed.elapsed_sec) || elapsedSec;
              setStreamStatusLine(
                reasoningChars > 0 ? `Модель размышляет · ${reasoningChars} симв. reasoning · ${elapsed}s` : `Канал жив · ожидание токенов ${elapsed}s · ${(streamBytes / 1024).toFixed(1)} KB`
              );
              pendingEvent = null;
              continue;
            }
            if (pendingEvent === "error") {
              fatalStreamError = new Error((parsed == null ? void 0 : parsed.message) || (parsed == null ? void 0 : parsed.error) || "Модель оборвала поток без ответа");
              pendingEvent = null;
              break;
            }
            if (council) {
              if (pendingEvent === "progress") {
                progressEvents++;
                setCouncilProgress({
                  done: Number(parsed.done) || 0,
                  total: Number(parsed.total) || 0,
                  stage: String(parsed.stage || "fanout")
                });
                if (parsed.model && parsed.stage === "fanout") {
                  setCouncilStatuses((prev) => prev.map(
                    (s) => s.model === parsed.model ? { ...s, state: parsed.ok ? "ok" : "fail" } : s
                  ));
                }
              } else if (pendingEvent === "answers") {
                councilAnswers = parsed;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantSoFar, model: "council", council: councilAnswers };
                  return next;
                });
              } else if (typeof parsed.delta === "string") {
                assistantSoFar += parsed.delta;
                if (!firstTokenSeen && parsed.delta.trim()) {
                  firstTokenSeen = true;
                  setTtftMs(Date.now() - reqStartedAt);
                  setStreamPhase("streaming");
                }
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantSoFar, model: "council", council: councilAnswers };
                  return next;
                });
              }
            } else {
              const choice = (_b = parsed.choices) == null ? void 0 : _b[0];
              const delta = (_c = choice == null ? void 0 : choice.delta) == null ? void 0 : _c.content;
              const reasoning = ((_d = choice == null ? void 0 : choice.delta) == null ? void 0 : _d.reasoning) ?? ((_e = choice == null ? void 0 : choice.delta) == null ? void 0 : _e.reasoning_content) ?? ((_f = choice == null ? void 0 : choice.delta) == null ? void 0 : _f.thinking) ?? (typeof ((_g = choice == null ? void 0 : choice.delta) == null ? void 0 : _g.reasoning_delta) === "string" ? choice.delta.reasoning_delta : void 0);
              if (typeof reasoning === "string" && reasoning.length) {
                reasoningChars += reasoning.length;
                setStreamPhase("waiting");
                setStreamStatusLine(`Модель размышляет · ${reasoningChars} симв. reasoning`);
              }
              mergeAnnotations((_h = choice == null ? void 0 : choice.delta) == null ? void 0 : _h.annotations);
              mergeAnnotations((_i = choice == null ? void 0 : choice.message) == null ? void 0 : _i.annotations);
              if (delta) {
                assistantSoFar += delta;
                if (!firstTokenSeen) {
                  firstTokenSeen = true;
                  setTtftMs(Date.now() - reqStartedAt);
                  setStreamPhase("streaming");
                  setStreamStatusLine("Получаю текст ответа…");
                }
              }
              if (delta || collectedSources.length) {
                const sourcesSnapshot = collectedSources.slice();
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantSoFar, model, sources: sourcesSnapshot.length ? sourcesSnapshot : void 0 };
                  return next;
                });
              }
            }
          } catch {
          }
          pendingEvent = null;
        }
        if (fatalStreamError) break;
      }
      if (stallTimer) clearTimeout(stallTimer);
      clearTimeout(hardTimer);
      if (fatalStreamError) throw fatalStreamError;
      if (!assistantSoFar.trim()) {
        if (council) {
          const okCount = (councilAnswers || []).filter((a) => (a == null ? void 0 : a.content) && !a.error).length;
          throw new Error(
            okCount === 0 ? "Консилиум завершился без единого ответа: все модели вернули пусто/ошибку. Смените состав панели." : `Суммаризатор консилиума не выдал текст (ответили ${okCount} модели). Повторите запрос или смените модель суммаризатора.`
          );
        }
        if (reasoningChars > 0) {
          throw new Error(
            `Модель ушла в reasoning (${reasoningChars} симв.), но не выдала ни одного токена ответа. Обычно это исчерпание бюджета reasoning'а. Переключитесь на «быстрый» режим или другую модель.`
          );
        }
        throw new Error(
          progressEvents > 0 ? "Канал был открыт, backend слал heartbeat'ы, но модель не прислала ни одного токена контента. Смените модель или повторите запрос." : "Соединение открылось, но не пришло ни одного байта данных. Проверьте сеть/провайдера модели."
        );
      }
      setStreamPhase("done");
      setStreamStatusLine(
        reasoningChars > 0 ? `Ответ получен · reasoning ${reasoningChars} симв. · ${(streamBytes / 1024).toFixed(1)} KB` : "Ответ получен полностью"
      );
      if (council) playCompletionChime();
      if (assistantSoFar && !priv) {
        const persistModel = council ? "council" : model;
        const persistAtts = [];
        if (councilAnswers) {
          persistAtts.push({ name: "__council__", type: "application/json", dataUrl: `data:application/json;base64,${btoa(unescape(encodeURIComponent(JSON.stringify(councilAnswers))))}` });
        }
        if (collectedSources.length) {
          persistAtts.push({ name: "__sources__", type: "application/json", dataUrl: `data:application/json;base64,${btoa(unescape(encodeURIComponent(JSON.stringify(collectedSources))))}` });
        }
        await supabase.from("ai_messages").insert({
          conversation_id: convId,
          user_id: user.id,
          role: "assistant",
          content: assistantSoFar,
          model: persistModel,
          attachments: persistAtts
        });
        await supabase.from("ai_conversations").update({ model: persistModel, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", convId);
        loadConversations();
      }
    } catch (e) {
      const abortReason = String((e == null ? void 0 : e.reason) || (e == null ? void 0 : e.message) || "");
      const rawMessage = (e == null ? void 0 : e.name) === "AbortError" && /stall/i.test(abortReason) ? "Стрим завис: 90 секунд не пришло ни одного байта. Соединение автоматически разорвано, чтобы не висело вечное колесо. Смените модель или повторите." : (e == null ? void 0 : e.name) === "AbortError" && /hard_limit/i.test(abortReason) ? "Достигнут общий потолок стрима (5 мин). Соединение разорвано." : (e == null ? void 0 : e.name) === "AbortError" ? "Запрос отменён." : (e == null ? void 0 : e.message) || "";
      toast.error(friendlyChatError(rawMessage));
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: `⚠️ Ошибка получения ответа.

${rawMessage}` };
        return next;
      });
    } finally {
      if (activeStreamAbortRef.current) activeStreamAbortRef.current = null;
      setStreaming(false);
      setStreamPhase("idle");
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin" }) });
  }
  if (!user) return /* @__PURE__ */ jsx(Navigate, { to: "/auth", replace: true });
  if (!isAdmin) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center p-6", children: /* @__PURE__ */ jsxs(Card, { className: "p-6 max-w-md text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold mb-2", children: "Доступ ограничен" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "Этот раздел доступен только владельцу сайта." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col md:flex-row bg-background", children: [
    /* @__PURE__ */ jsxs(
      "aside",
      {
        className: "border-r border-border md:h-screen flex flex-col bg-muted/30 w-full md:w-auto md:shrink-0 relative",
        style: { width: typeof window !== "undefined" && window.innerWidth >= 768 ? `${sidebarWidth}px` : void 0 },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "p-3 border-b border-border space-y-2", children: [
            /* @__PURE__ */ jsxs(Button, { onClick: () => newConversation(null), className: "w-full", size: "sm", children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
              "Новый диалог"
            ] }),
            /* @__PURE__ */ jsxs(Button, { onClick: createFolder, className: "w-full", size: "sm", variant: "outline", children: [
              /* @__PURE__ */ jsx(FolderPlus, { className: "w-4 h-4 mr-2" }),
              "Новая папка"
            ] })
          ] }),
          /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxs("div", { className: "p-2 space-y-1", children: [
            conversations.length === 0 && folders.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground p-3 text-center", children: "История пуста" }),
            folders.map((f) => {
              const items = conversations.filter((c) => c.folder_id === f.id);
              const isOpen = openFolders[f.id] ?? true;
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  className: `space-y-0.5 rounded-md ${dragOverFolder === f.id ? "bg-primary/10 ring-1 ring-primary/40" : ""}`,
                  onDragOver: (e) => {
                    if (e.dataTransfer.types.includes("application/x-conv-id")) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverFolder(f.id);
                    }
                  },
                  onDragLeave: () => setDragOverFolder((cur) => cur === f.id ? null : cur),
                  onDrop: (e) => {
                    const id = e.dataTransfer.getData("application/x-conv-id");
                    setDragOverFolder(null);
                    if (id) moveConversation(id, f.id);
                  },
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "group flex items-center gap-1 rounded-md px-1 py-1.5 hover:bg-accent", children: [
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => toggleFolder(f.id),
                          className: "flex items-center gap-1 flex-1 min-w-0 text-left",
                          children: [
                            isOpen ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-3.5 h-3.5 shrink-0" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5 shrink-0" }),
                            isOpen ? /* @__PURE__ */ jsx(FolderOpen, { className: "w-3.5 h-3.5 shrink-0 text-primary" }) : /* @__PURE__ */ jsx(Folder, { className: "w-3.5 h-3.5 shrink-0 text-primary" }),
                            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium truncate", children: f.name }),
                            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: items.length })
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: (e) => {
                            e.stopPropagation();
                            newConversation(f.id);
                          },
                          className: "opacity-0 group-hover:opacity-100 p-1 hover:text-primary",
                          "aria-label": "Новый чат в папке",
                          title: "Новый чат в папке",
                          children: /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5" })
                        }
                      ),
                      /* @__PURE__ */ jsxs(DropdownMenu, { children: [
                        /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx("button", { className: "opacity-0 group-hover:opacity-100 p-1", "aria-label": "Действия", children: /* @__PURE__ */ jsx(MoreVertical, { className: "w-3.5 h-3.5" }) }) }),
                        /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
                          /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => renameFolder(f), children: [
                            /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5 mr-2" }),
                            "Переименовать"
                          ] }),
                          /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => deleteFolder(f), className: "text-destructive", children: [
                            /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5 mr-2" }),
                            "Удалить папку"
                          ] })
                        ] })
                      ] })
                    ] }),
                    isOpen && /* @__PURE__ */ jsxs("div", { className: "pl-5 space-y-0.5", children: [
                      items.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground px-2 py-1", children: "Пусто" }),
                      items.map((c) => /* @__PURE__ */ jsx(
                        ConvRow,
                        {
                          conv: c,
                          active: activeId === c.id,
                          folders,
                          onOpen: () => setActiveId(c.id),
                          onDelete: () => deleteConversation(c.id),
                          onMove: (fid) => moveConversation(c.id, fid),
                          onRename: () => renameConversation(c)
                        },
                        c.id
                      ))
                    ] })
                  ]
                },
                f.id
              );
            }),
            (() => {
              const unfiled = conversations.filter((c) => !c.folder_id);
              if (!folders.length) {
                return unfiled.map((c) => /* @__PURE__ */ jsx(
                  ConvRow,
                  {
                    conv: c,
                    active: activeId === c.id,
                    folders,
                    onOpen: () => setActiveId(c.id),
                    onDelete: () => deleteConversation(c.id),
                    onMove: (fid) => moveConversation(c.id, fid),
                    onRename: () => renameConversation(c)
                  },
                  c.id
                ));
              }
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  className: `space-y-0.5 pt-1 rounded-md ${dragOverFolder === "unfiled" ? "bg-primary/10 ring-1 ring-primary/40" : ""}`,
                  onDragOver: (e) => {
                    if (e.dataTransfer.types.includes("application/x-conv-id")) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverFolder("unfiled");
                    }
                  },
                  onDragLeave: () => setDragOverFolder((cur) => cur === "unfiled" ? null : cur),
                  onDrop: (e) => {
                    const id = e.dataTransfer.getData("application/x-conv-id");
                    setDragOverFolder(null);
                    if (id) moveConversation(id, null);
                  },
                  children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => setUnfiledOpen((v) => !v),
                        className: "flex items-center gap-1 w-full text-left rounded-md px-1 py-1.5 hover:bg-accent",
                        children: [
                          unfiledOpen ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" }),
                          /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: "Без папки" }),
                          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: unfiled.length })
                        ]
                      }
                    ),
                    unfiledOpen && /* @__PURE__ */ jsx("div", { className: "pl-5 space-y-0.5", children: unfiled.map((c) => /* @__PURE__ */ jsx(
                      ConvRow,
                      {
                        conv: c,
                        active: activeId === c.id,
                        folders,
                        onOpen: () => setActiveId(c.id),
                        onDelete: () => deleteConversation(c.id),
                        onMove: (fid) => moveConversation(c.id, fid),
                        onRename: () => renameConversation(c)
                      },
                      c.id
                    )) })
                  ]
                }
              );
            })()
          ] }) }),
          /* @__PURE__ */ jsx(
            "div",
            {
              onMouseDown: (e) => {
                e.preventDefault();
                sidebarResizingRef.current = true;
                document.body.style.cursor = "col-resize";
                document.body.style.userSelect = "none";
              },
              onDoubleClick: () => setSidebarWidth(288),
              className: "hidden md:block absolute top-0 right-0 h-full w-1.5 -mr-0.5 cursor-col-resize hover:bg-primary/40 active:bg-primary/60 transition-colors z-10",
              title: "Потяните, чтобы изменить ширину (двойной клик — сбросить)",
              "aria-label": "Изменить ширину панели",
              role: "separator"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 flex flex-col md:h-screen", children: [
      /* @__PURE__ */ jsxs("header", { className: "border-b border-border px-4 pt-3 pb-3 flex flex-col gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-semibold truncate", children: "Мультимодальный ассистент профессора" }),
          /* @__PURE__ */ jsx(ThreadPatientBadge, { value: threadPatient, onChange: updateThreadPatient, variant: "header" }),
          (threadPatient == null ? void 0 : threadPatient.id) && /* @__PURE__ */ jsxs(
            "a",
            {
              href: `/admin/patients/${threadPatient.id}/metabolic-map`,
              className: "inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-accent transition-colors",
              title: "Метаболическая карта пациента",
              children: [
                /* @__PURE__ */ jsx(Activity, { className: "w-3.5 h-3.5" }),
                "Метаб. карта"
              ]
            }
          )
        ] }),
        (threadPatient == null ? void 0 : threadPatient.id) && /* @__PURE__ */ jsx(MetabolicMapMiniCard, { patientId: threadPatient.id, patientName: threadPatient.name }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex rounded-md border border-border overflow-hidden", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setSpeed("fast"),
                disabled: streaming,
                className: `px-3 py-1.5 text-xs flex items-center gap-1 transition-colors ${speed === "fast" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`,
                title: "Минимальное обдумывание — быстрый ответ",
                children: [
                  /* @__PURE__ */ jsx(Zap, { className: "w-3.5 h-3.5" }),
                  "Быстро"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setSpeed("deep"),
                disabled: streaming,
                className: `px-3 py-1.5 text-xs flex items-center gap-1 transition-colors border-l border-border ${speed === "deep" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`,
                title: "Расширенное обдумывание — медленнее, но глубже",
                children: [
                  /* @__PURE__ */ jsx(Brain, { className: "w-3.5 h-3.5" }),
                  "Вдумчиво"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setCouncil((v) => !v),
                disabled: streaming,
                className: `px-3 py-1.5 text-xs rounded-md border flex items-center gap-1 transition-colors ${council ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent border-border"}`,
                title: "Параллельный опрос Claude, GPT, Gemini, Grok + сводный ответ",
                children: [
                  /* @__PURE__ */ jsx(Users, { className: "w-3.5 h-3.5" }),
                  "Консилиум"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  const next = !soundOn;
                  setSoundOn(next);
                  setSoundEnabled(next);
                },
                className: "px-2 py-1.5 text-xs rounded-md border bg-background hover:bg-accent border-border flex items-center",
                title: "Звук по завершении Консилиума",
                children: soundOn ? /* @__PURE__ */ jsx(Volume2, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ jsx(VolumeX, { className: "w-3.5 h-3.5" })
              }
            ),
            /* @__PURE__ */ jsxs(Popover, { open: councilKeysOpen, onOpenChange: setCouncilKeysOpen, children: [
              /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  disabled: streaming,
                  className: "px-2 py-1.5 text-xs rounded-md border bg-background hover:bg-accent border-border flex items-center",
                  title: "Выбрать модели консилиума",
                  children: /* @__PURE__ */ jsx(Settings, { className: "w-3.5 h-3.5" })
                }
              ) }),
              /* @__PURE__ */ jsx(PopoverContent, { className: "w-64 p-3", align: "end", children: /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-72 overflow-y-auto", children: COUNCIL_MODEL_CANDIDATES.map((key) => {
                var _a2;
                const label = ((_a2 = resolvedModels.find((m) => m.key === key)) == null ? void 0 : _a2.label) ?? key;
                const checked = councilSelectedKeys.includes(key);
                const isFugu = key === "sakana-fugu";
                return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
                  /* @__PURE__ */ jsx(
                    Checkbox,
                    {
                      id: `council-key-${key}`,
                      checked,
                      onCheckedChange: () => setCouncilSelectedKeys(
                        (prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "label",
                    {
                      htmlFor: `council-key-${key}`,
                      className: "text-sm leading-tight cursor-pointer",
                      title: isFugu ? "Fugu Ultra дороже остальных моделей ($5/$30 за 1М токенов)" : void 0,
                      children: [
                        label,
                        isFugu && /* @__PURE__ */ jsx("span", { className: "block text-xs text-muted-foreground mt-0.5", children: "Fugu Ultra дороже остальных моделей ($5/$30 за 1М токенов)" })
                      ]
                    }
                  )
                ] }, key);
              }) }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                const next = !privateMode;
                setPrivateMode(next);
                if (next && activeId && !isPrivateConv(activeId)) {
                  newConversation(null);
                }
                if (!next && isPrivateConv(activeId)) {
                  setActiveId(null);
                  setMessages([]);
                }
                toast.success(next ? "🔒 Приватный режим включён — переписка не сохраняется" : "Приватный режим выключен");
              },
              disabled: streaming,
              className: `px-3 py-1.5 text-xs rounded-md border flex items-center gap-1 transition-colors ${privateMode || isPrivateConv(activeId) ? "bg-destructive text-destructive-foreground border-destructive" : "bg-background hover:bg-accent border-border"}`,
              title: "Приватный режим: переписка не сохраняется ни в истории, ни в базе. Удаляется бесследно при закрытии.",
              children: [
                /* @__PURE__ */ jsx(Lock, { className: "w-3.5 h-3.5" }),
                "Приватно"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/cabinet/agent",
              className: "px-3 py-1.5 text-xs rounded-md border bg-gradient-to-r from-primary/90 to-purple-600 text-primary-foreground border-primary hover:opacity-90 flex items-center gap-1 transition-opacity",
              title: "Агентный режим: ИИ автономно ищет, анализирует, готовит назначения",
              children: [
                /* @__PURE__ */ jsx(Bot, { className: "w-3.5 h-3.5" }),
                "🤖 Агент"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/cabinet/vault",
              className: "px-3 py-1.5 text-xs rounded-md border bg-card hover:bg-muted flex items-center gap-1",
              title: "Vault — заметки, [[wiki-ссылки]], граф связей (как Obsidian)",
              children: "🗂 Vault"
            }
          ),
          /* @__PURE__ */ jsxs(Select, { value: model, onValueChange: setModel, disabled: streaming || council, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[300px]", children: /* @__PURE__ */ jsx(SelectValue, { children: (() => {
              const r = currentResolved;
              if (r) return `${r.emoji} ${r.label}${!r.available ? " · недоступно" : ""}`;
              if (currentLive) return `🧪 ${currentLive.name || currentLive.id}`;
              return `⚠ ${model}`;
            })() }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx("div", { className: "px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground", children: "Быстрые" }),
              fastModels.map((m) => /* @__PURE__ */ jsx(SelectItem, { value: m.id, disabled: !m.available, title: buildModelTooltip(m), children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx("span", { children: m.emoji }),
                /* @__PURE__ */ jsx("span", { children: m.label }),
                !m.available && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-destructive ml-1", children: "недоступно" })
              ] }) }, m.key)),
              /* @__PURE__ */ jsx("div", { className: "px-2 py-1 mt-1 text-[10px] uppercase tracking-wide text-muted-foreground", children: "Глубокие" }),
              deepModels.map((m) => /* @__PURE__ */ jsx(SelectItem, { value: m.id, disabled: !m.available, title: buildModelTooltip(m), children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx("span", { children: m.emoji }),
                /* @__PURE__ */ jsx("span", { children: m.label }),
                !m.available && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-destructive ml-1", children: "недоступно" })
              ] }) }, m.key)),
              imageModels.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("div", { className: "px-2 py-1 mt-1 text-[10px] uppercase tracking-wide text-muted-foreground border-t border-border/50 pt-2", children: "🎨 Иллюстрации" }),
                imageModels.map((m) => /* @__PURE__ */ jsx(SelectItem, { value: m.id, title: m.hint || m.id, children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx("span", { children: m.emoji }),
                  /* @__PURE__ */ jsx("span", { children: m.label }),
                  m.hint && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground ml-1", children: [
                    "· ",
                    m.hint
                  ] })
                ] }) }, m.key))
              ] }),
              currentResolved == null && currentLive && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("div", { className: "px-2 py-1 mt-1 text-[10px] uppercase tracking-wide text-muted-foreground", children: "Расширенный выбор" }),
                /* @__PURE__ */ jsxs(SelectItem, { value: model, children: [
                  "🧪 ",
                  currentLive.name || currentLive.id
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setExtendedPickerOpen(true),
              disabled: streaming || council,
              className: "px-2.5 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-accent flex items-center gap-1 disabled:opacity-40",
              title: modelKnown ? `Выбрать любую модель из живого списка OpenRouter

Текущая: ${buildModelTooltip(currentResolved ?? { key: "live", label: (currentLive == null ? void 0 : currentLive.name) || model, tier: "fast", emoji: "🧪", id: model, available: true, liveInfo: currentLive, source: model.startsWith("venice/") ? "venice" : "openrouter", kind: "text" })}` : `⚠ Слаг ${model} не найден в OpenRouter — может вернуть 404`,
              children: [
                /* @__PURE__ */ jsx(Search, { className: "w-3.5 h-3.5" }),
                "Ещё"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                disabled: messages.length === 0,
                className: "px-2.5 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-accent flex items-center gap-1 disabled:opacity-40",
                title: "Экспорт всего диалога",
                children: [
                  /* @__PURE__ */ jsx(Download, { className: "w-3.5 h-3.5" }),
                  "Экспорт"
                ]
              }
            ) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  onClick: async () => {
                    const ok = await copyToClipboard(messagesToMarkdown(messages));
                    ok ? toast.success("Скопировано") : toast.error("Не удалось скопировать");
                  },
                  children: [
                    /* @__PURE__ */ jsx(Copy, { className: "w-3.5 h-3.5 mr-2" }),
                    " Копировать (Markdown)"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => downloadMarkdown(messagesToMarkdown(messages)), children: [
                /* @__PURE__ */ jsx(FileCode2, { className: "w-3.5 h-3.5 mr-2" }),
                " Скачать .md"
              ] }),
              /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: async () => {
                await downloadDocx(messages);
                toast.success("DOCX сохранён");
              }, children: [
                /* @__PURE__ */ jsx(FileType2, { className: "w-3.5 h-3.5 mr-2" }),
                " Скачать .docx"
              ] }),
              /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => {
                const ok = downloadPdf(messages);
                if (!ok) toast.error("Браузер заблокировал окно печати");
              }, children: [
                /* @__PURE__ */ jsx(FileDown, { className: "w-3.5 h-3.5 mr-2" }),
                " Скачать .pdf (через печать)"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setSystemDraft(systemPrompt);
                setSummarizerDraft(summarizerPrompt);
                setSettingsOpen(true);
              },
              className: "px-2.5 py-1.5 text-xs rounded-md border border-border bg-background hover:bg-accent flex items-center gap-1",
              title: "Системные промпты",
              children: /* @__PURE__ */ jsx(Settings, { className: "w-3.5 h-3.5" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        ExtendedModelPicker,
        {
          open: extendedPickerOpen,
          onOpenChange: setExtendedPickerOpen,
          onPick: (id) => setModel(id),
          currentId: model
        }
      ),
      /* @__PURE__ */ jsx(Dialog, { open: settingsOpen, onOpenChange: setSettingsOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
        /* @__PURE__ */ jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsx(DialogTitle, { children: "Системные промпты" }),
          /* @__PURE__ */ jsx(DialogDescription, { children: "Сохраняются локально в этом браузере." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground", children: "Основной промпт (обычный чат и модели-участники консилиума)" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: systemDraft,
              onChange: (e) => setSystemDraft(e.target.value),
              rows: 12,
              className: "font-mono text-xs"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => setSystemDraft(DEFAULT_SYSTEM_PROMPT), children: "Вернуть по умолчанию" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground", children: "Промпт суммаризатора консилиума" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: summarizerDraft,
              onChange: (e) => setSummarizerDraft(e.target.value),
              rows: 10,
              className: "font-mono text-xs"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => setSummarizerDraft(DEFAULT_SUMMARIZER_PROMPT), children: "Вернуть по умолчанию" }) })
        ] }),
        /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 sm:gap-2", children: [
          /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: () => setSettingsOpen(false), children: "Отмена" }),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => {
                const sys = systemDraft.trim() || DEFAULT_SYSTEM_PROMPT;
                const sum = summarizerDraft.trim() || DEFAULT_SUMMARIZER_PROMPT;
                setSystemPrompt(sys);
                setSummarizerPrompt(sum);
                try {
                  window.localStorage.setItem(SYSTEM_PROMPT_LS_KEY, sys);
                  window.localStorage.setItem(SUMMARIZER_PROMPT_LS_KEY, sum);
                } catch {
                }
                setSettingsOpen(false);
                toast.success("Промпты сохранены");
              },
              children: "Сохранить"
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { ref: scrollRef, className: "flex-1 overflow-y-auto px-4 py-4 space-y-4", children: [
        (isPrivateConv(activeId) || privateMode && !activeId) && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2 text-xs flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Lock, { className: "w-3.5 h-3.5" }),
          "Приватный режим: переписка не сохраняется в истории и в базе. После закрытия вкладки или удаления — исчезает бесследно."
        ] }),
        messages.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center text-muted-foreground text-sm pt-16", children: "Задайте вопрос. Можно прикрепить изображения или PDF." }),
        messages.map((m, i) => /* @__PURE__ */ jsxs("div", { className: `flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`, children: [
          /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-accent/15" : "bg-primary/15"}`, children: m.role === "user" ? /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Bot, { className: "w-4 h-4 text-primary" }) }),
          (() => {
            var _a2;
            const bubble = /* @__PURE__ */ jsxs("div", { className: `rounded-2xl px-4 py-2.5 max-w-[80%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`, children: [
              m.attachments && m.attachments.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mb-2", children: m.attachments.map((a, j) => /* @__PURE__ */ jsx("div", { className: "text-xs flex items-center gap-1 bg-background/40 rounded px-2 py-1", children: a.type.startsWith("image/") ? /* @__PURE__ */ jsx("img", { src: a.dataUrl, alt: a.name, className: "w-16 h-16 object-cover rounded" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(FileText, { className: "w-3 h-3" }),
                a.name
              ] }) }, j)) }),
              m.role === "assistant" ? m.content || m.council || m.image ? /* @__PURE__ */ jsxs(Fragment, { children: [
                m.council && m.council.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-[11px] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Users, { className: "w-3 h-3" }),
                  " Сводный ответ консилиума"
                ] }),
                m.content && m.fulltext ? /* @__PURE__ */ jsx(
                  PubmedFulltextAnalysis,
                  {
                    raw: m.content,
                    meta: m.fulltext,
                    onFollowup: (q) => askFulltextFollowup(m.fulltext, q),
                    followupLoading: fulltextFollowupLoading === m.fulltext.pmid
                  }
                ) : m.content ? /* @__PURE__ */ jsx(
                  ChatMarkdownWith,
                  {
                    extraComponents: m.pubmed ? {
                      a: ({ href, children, ...props }) => {
                        if (typeof href === "string" && href.startsWith("#pubmed-src-")) {
                          return /* @__PURE__ */ jsx(
                            "a",
                            {
                              href,
                              onClick: (e) => {
                                e.preventDefault();
                                const el = document.getElementById(href.slice(1));
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                                  el.classList.add("ring-2", "ring-primary");
                                  setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 1400);
                                }
                              },
                              className: "inline-flex items-center px-1 rounded bg-primary/10 text-primary no-underline hover:bg-primary/20 font-medium text-[0.85em] mx-0.5",
                              ...props,
                              children
                            }
                          );
                        }
                        return /* @__PURE__ */ jsx("a", { href, ...props, children });
                      }
                    } : void 0,
                    children: m.pubmed ? linkifyPubmedCitations(m.content, m.pubmed.sources, i) : m.content
                  }
                ) : m.image ? null : /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }),
                  " Сводим ответы…"
                ] }),
                m.image && /* @__PURE__ */ jsxs("div", { className: "mt-1 space-y-2", children: [
                  m.image.signedUrl ? /* @__PURE__ */ jsxs("div", { className: "relative inline-block group", children: [
                    /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: m.image.signedUrl,
                        alt: "Сгенерированное изображение",
                        className: "rounded-lg border border-border max-w-full max-h-[600px] object-contain bg-background cursor-zoom-in",
                        loading: "lazy",
                        onClick: () => setZoomImage({ url: m.image.signedUrl, model: m.image.model })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: (e) => {
                          e.stopPropagation();
                          setZoomImage({ url: m.image.signedUrl, model: m.image.model });
                        },
                        className: "absolute top-2 right-2 p-1.5 rounded-md bg-background/80 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background",
                        title: "Увеличить",
                        "aria-label": "Увеличить изображение",
                        children: /* @__PURE__ */ jsx(ZoomIn, { className: "w-4 h-4" })
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-dashed border-border h-64 flex items-center justify-center text-xs text-muted-foreground", children: [
                    /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" }),
                    " Подписываем ссылку…"
                  ] }),
                  m.image.signedUrl && /* @__PURE__ */ jsxs("div", { className: "text-[10px] leading-snug text-muted-foreground italic max-w-[600px] flex items-start gap-1.5", children: [
                    /* @__PURE__ */ jsx(Copyright, { className: "w-3 h-3 mt-0.5 flex-shrink-0" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "Разработано интеллектуальным ассистентом профессора Тарусина Дмитрия Игоревича для пациента ",
                      pendingPatient.name || "(ФИО)",
                      " и существует в единственном экземпляре. tarusin.pro"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-mono", children: m.image.model }),
                    typeof m.image.cost === "number" && m.image.cost > 0 && /* @__PURE__ */ jsxs("span", { children: [
                      "· $",
                      m.image.cost.toFixed(4)
                    ] }),
                    m.image.refs && m.image.refs.length > 0 && /* @__PURE__ */ jsxs("span", { children: [
                      "· референсов: ",
                      m.image.refs.length
                    ] })
                  ] }),
                  m.image.signedUrl && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
                    /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => downloadImage(m.image.signedUrl, `image-${Date.now()}.png`), children: [
                      /* @__PURE__ */ jsx(Download, { className: "w-3.5 h-3.5 mr-1" }),
                      " Скачать"
                    ] }),
                    /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => printImage(m.image.signedUrl), children: [
                      /* @__PURE__ */ jsx(Printer, { className: "w-3.5 h-3.5 mr-1" }),
                      " Печать A4"
                    ] }),
                    /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => useGeneratedAsRef(m.image), children: [
                      /* @__PURE__ */ jsx(Image, { className: "w-3.5 h-3.5 mr-1" }),
                      " Как референс"
                    ] }),
                    /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => publishToLibrary(i, m.image), disabled: publishingMsgIdx === i, children: [
                      publishingMsgIdx === i ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 mr-1 animate-spin" }) : /* @__PURE__ */ jsx(BookmarkPlus, { className: "w-3.5 h-3.5 mr-1" }),
                      "В библиотеку"
                    ] })
                  ] })
                ] }),
                m.council && m.council.length > 0 && /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "mt-3 border-t border-border/50 pt-2", children: /* @__PURE__ */ jsxs(AccordionItem, { value: "answers", className: "border-0", children: [
                  /* @__PURE__ */ jsxs(AccordionTrigger, { className: "text-xs py-1 hover:no-underline", children: [
                    "Ответы моделей по отдельности (",
                    m.council.length,
                    ")"
                  ] }),
                  /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: m.council.map((a, k) => /* @__PURE__ */ jsxs("div", { className: "rounded-md bg-background/60 p-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "text-[11px] font-mono text-muted-foreground mb-1", children: a.model }),
                    a.error ? /* @__PURE__ */ jsxs("div", { className: "text-xs text-destructive", children: [
                      "⚠️ ",
                      a.error
                    ] }) : /* @__PURE__ */ jsx(ChatMarkdown, { className: "prose prose-xs dark:prose-invert max-w-none text-xs", children: a.content })
                  ] }, k)) }) })
                ] }) }),
                m.batch && m.batch.partial.length > 0 && /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "mt-3 border-t border-border/50 pt-2", children: /* @__PURE__ */ jsxs(AccordionItem, { value: "batch", className: "border-0", children: [
                  /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-xs py-1 hover:no-underline", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(Layers, { className: "w-3 h-3" }),
                    " Разбор по подпакетам (",
                    m.batch.partial.length,
                    ")"
                  ] }) }),
                  /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: m.batch.partial.map((p, k) => /* @__PURE__ */ jsxs("div", { className: "rounded-md bg-background/60 p-2", children: [
                    /* @__PURE__ */ jsxs("div", { className: "text-[11px] font-mono text-muted-foreground mb-1", children: [
                      "Подпакет ",
                      p.subbatch_index + 1,
                      " · ",
                      p.files.length,
                      " файлов: ",
                      p.files.join(", ")
                    ] }),
                    p.error ? /* @__PURE__ */ jsxs("div", { className: "text-xs text-destructive", children: [
                      "⚠️ ",
                      p.error
                    ] }) : /* @__PURE__ */ jsx(ChatMarkdown, { className: "prose prose-xs dark:prose-invert max-w-none text-xs", children: p.content || "" }),
                    p.per_file_errors && p.per_file_errors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-1 text-[11px] text-amber-600", children: [
                      "Не прочитано: ",
                      p.per_file_errors.map((f) => f.file).join(", ")
                    ] })
                  ] }, k)) }) })
                ] }) }),
                m.sources && m.sources.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 border-t border-border/50 pt-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(Globe, { className: "w-3 h-3" }),
                    " Источники (",
                    m.sources.length,
                    ")"
                  ] }),
                  /* @__PURE__ */ jsx("ol", { className: "space-y-1 text-xs list-decimal pl-4", children: m.sources.map((s, k) => /* @__PURE__ */ jsxs("li", { className: "leading-snug", children: [
                    /* @__PURE__ */ jsxs(
                      "a",
                      {
                        href: s.url,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-primary hover:underline inline-flex items-start gap-1 break-all",
                        title: s.url,
                        children: [
                          /* @__PURE__ */ jsx("span", { children: s.title || s.url }),
                          /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3 flex-shrink-0 mt-0.5" })
                        ]
                      }
                    ),
                    s.title && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground break-all", children: s.url })
                  ] }, k)) })
                ] }),
                m.pubmed && /* @__PURE__ */ jsxs("div", { className: "mt-3 border-t border-border/50 pt-2 space-y-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground", children: [
                    /* @__PURE__ */ jsx("span", { className: "uppercase tracking-wide font-semibold", children: "PubMed" }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "· Найдено: ",
                      m.pubmed.total_count
                    ] }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "· Показано: ",
                      m.pubmed.sources.length
                    ] }),
                    /* @__PURE__ */ jsxs(
                      "a",
                      {
                        href: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(m.pubmed.used_query)}`,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "inline-flex items-center gap-1 text-primary hover:underline ml-auto",
                        children: [
                          /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }),
                          " Открыть в PubMed"
                        ]
                      }
                    )
                  ] }),
                  m.pubmed.used_query && /* @__PURE__ */ jsxs("details", { className: "text-[11px] text-muted-foreground", children: [
                    /* @__PURE__ */ jsx("summary", { className: "cursor-pointer", children: "Использованный запрос" }),
                    /* @__PURE__ */ jsx("code", { className: "block mt-1 p-2 bg-background/50 rounded text-[10px] whitespace-pre-wrap break-all", children: m.pubmed.used_query })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "space-y-2", children: m.pubmed.sources.map((s, k) => /* @__PURE__ */ jsx(
                    "div",
                    {
                      id: `pubmed-src-${i}-${s.pmid}`,
                      className: "rounded-md transition-shadow scroll-mt-24",
                      children: /* @__PURE__ */ jsx(
                        PubmedSourceCard,
                        {
                          index: k + 1,
                          source: s,
                          onAnalyze: (src) => {
                            const userQ = (() => {
                              var _a3;
                              for (let x = i - 1; x >= 0; x--) {
                                if (((_a3 = messages[x]) == null ? void 0 : _a3.role) === "user") return messages[x].content;
                              }
                              return "";
                            })();
                            analyzePubmedArticle(src, userQ);
                          },
                          analyzing: pubmedAnalyzing === s.pmid
                        }
                      )
                    },
                    s.pmid
                  )) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 pt-1", children: [
                    m.pubmed.sources.length < m.pubmed.total_count && /* @__PURE__ */ jsxs(
                      Button,
                      {
                        type: "button",
                        size: "sm",
                        variant: "outline",
                        onClick: () => loadMorePubmed(i),
                        disabled: pubmedLoadingMore !== null,
                        children: [
                          pubmedLoadingMore === i ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 mr-1 animate-spin" }) : null,
                          "Показать ещё"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      Button,
                      {
                        type: "button",
                        size: "sm",
                        variant: "ghost",
                        onClick: () => downloadSourcesDocx(m.pubmed.sources),
                        children: [
                          /* @__PURE__ */ jsx(FileType2, { className: "w-3 h-3 mr-1" }),
                          "Экспорт .docx"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      Button,
                      {
                        type: "button",
                        size: "sm",
                        variant: "ghost",
                        onClick: () => downloadRis(m.pubmed.sources),
                        children: [
                          /* @__PURE__ */ jsx(FileDown, { className: "w-3 h-3 mr-1" }),
                          "Экспорт .ris"
                        ]
                      }
                    )
                  ] })
                ] })
              ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "tabular-nums flex-1", children: councilProgress ? councilProgress.stage === "summarizing" ? `Сборка сводного ответа консилиума… ${elapsedSec}s` : `Опрос моделей консилиума: ${councilProgress.done}/${councilProgress.total} · ${elapsedSec}s` : /* @__PURE__ */ jsxs(Fragment, { children: [
                    streamPhase === "connecting" && /* @__PURE__ */ jsxs(Fragment, { children: [
                      "🔌 Соединяюсь с моделью ",
                      /* @__PURE__ */ jsxs("span", { className: "opacity-70", children: [
                        "(",
                        model,
                        ")"
                      ] }),
                      "… ",
                      elapsedSec,
                      "s"
                    ] }),
                    streamPhase === "waiting" && /* @__PURE__ */ jsxs(Fragment, { children: [
                      "✅ Соединение установлено · ⏳ Жду первый токен… ",
                      elapsedSec,
                      "s"
                    ] }),
                    streamPhase === "streaming" && /* @__PURE__ */ jsxs(Fragment, { children: [
                      "📡 Стрим идёт · ",
                      elapsedSec,
                      "s · ",
                      (streamBytes / 1024).toFixed(1),
                      " KB · ",
                      streamChunks,
                      " чанков",
                      ttftMs !== null && /* @__PURE__ */ jsxs(Fragment, { children: [
                        " · TTFT ",
                        (ttftMs / 1e3).toFixed(1),
                        "s"
                      ] })
                    ] }),
                    streamPhase === "done" && /* @__PURE__ */ jsxs(Fragment, { children: [
                      "✅ Ответ получен · ",
                      elapsedSec,
                      "s"
                    ] }),
                    streamPhase === "idle" && /* @__PURE__ */ jsxs(Fragment, { children: [
                      "Думаю… ",
                      elapsedSec,
                      "s"
                    ] }),
                    elapsedSec >= 60 && elapsedSec < 240 && streamPhase !== "streaming" && /* @__PURE__ */ jsx("span", { className: "text-xs opacity-70", children: " · модель размышляет, ответ скоро пойдёт" }),
                    elapsedSec >= 240 && /* @__PURE__ */ jsx("span", { className: "text-xs text-amber-600 dark:text-amber-400", children: " · долго, риск обрыва — можно отменить и сменить модель" })
                  ] }) }),
                  !councilProgress && /* @__PURE__ */ jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      onClick: cancelActiveStream,
                      className: "h-7 px-2 text-xs",
                      title: "Остановить текущий запрос",
                      children: [
                        /* @__PURE__ */ jsx(Square, { className: "w-3 h-3 mr-1" }),
                        " Стоп"
                      ]
                    }
                  )
                ] }),
                !councilProgress && streamStatusLine && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-background/60 px-2 py-1 text-[11px] text-muted-foreground", children: [
                  /* @__PURE__ */ jsx("div", { className: "font-mono break-all", children: streamStatusLine }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-0.5 tabular-nums", children: [
                    "байты: ",
                    streamBytes,
                    " · чанки: ",
                    streamChunks,
                    " · таймаут первого токена: 180s"
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  Progress,
                  {
                    value: councilProgress && councilProgress.total > 0 ? councilProgress.stage === "summarizing" ? Math.max(90, Math.min(99, 90 + Math.floor(elapsedSec / 6))) : Math.round(councilProgress.done / councilProgress.total * 85) : (((_a2 = m.content) == null ? void 0 : _a2.length) ?? 0) > 0 ? Math.max(genericProgress, 60) : genericProgress,
                    className: "h-1.5"
                  }
                ),
                council && councilStatuses.length > 0 && /* @__PURE__ */ jsx("ul", { className: "mt-1 space-y-0.5 text-[11px] font-mono", children: councilStatuses.map((s) => {
                  const short = s.model.split("/").pop();
                  const icon = s.state === "ok" ? "✓" : s.state === "fail" ? "✗" : "…";
                  const color = s.state === "ok" ? "text-emerald-600 dark:text-emerald-400" : s.state === "fail" ? "text-destructive" : "text-muted-foreground";
                  return /* @__PURE__ */ jsxs("li", { className: `flex items-center gap-2 ${color}`, children: [
                    /* @__PURE__ */ jsx("span", { className: "w-3 tabular-nums", children: icon }),
                    /* @__PURE__ */ jsx("span", { className: "truncate", children: short })
                  ] }, s.model);
                }) })
              ] }) : /* @__PURE__ */ jsx("div", { className: "whitespace-pre-wrap text-sm", children: m.content }),
              m.role === "assistant" && m.content && !streaming && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mt-2 -mb-1 opacity-70 hover:opacity-100 transition-opacity", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: async () => {
                      const ok = await copyToClipboard(m.content);
                      ok ? toast.success("Скопировано") : toast.error("Ошибка");
                    },
                    className: "p-1 rounded hover:bg-background/60",
                    title: "Копировать",
                    children: /* @__PURE__ */ jsx(Copy, { className: "w-3 h-3" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => downloadMarkdown(m.content, `answer-${i + 1}.md`),
                    className: "p-1 rounded hover:bg-background/60",
                    title: "Скачать .md",
                    children: /* @__PURE__ */ jsx(FileCode2, { className: "w-3 h-3" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: async () => {
                      await downloadDocx([{ role: "assistant", content: m.content, model: m.model }], `answer-${i + 1}.docx`, "Ответ");
                      toast.success("DOCX сохранён");
                    },
                    className: "p-1 rounded hover:bg-background/60",
                    title: "Скачать .docx",
                    children: /* @__PURE__ */ jsx(FileType2, { className: "w-3 h-3" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      const ok = downloadPdf([{ role: "assistant", content: m.content, model: m.model }], "Ответ");
                      if (!ok) toast.error("Браузер заблокировал окно печати");
                    },
                    className: "p-1 rounded hover:bg-background/60",
                    title: "Скачать .pdf",
                    children: /* @__PURE__ */ jsx(FileDown, { className: "w-3 h-3" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => illustrateMessage(i, m.content),
                    disabled: illustratingMsgIdx !== null || streaming,
                    className: "p-1 rounded hover:bg-background/60 disabled:opacity-40",
                    title: "Иллюстрировать схемой (генерация изображения по этому ответу)",
                    children: illustratingMsgIdx === i ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(Image, { className: "w-3 h-3" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "select",
                  {
                    value: illustrateModel,
                    onChange: (e) => setIllustrateModel(e.target.value),
                    disabled: illustratingMsgIdx !== null || streaming,
                    className: "text-[10px] bg-transparent border border-border/60 rounded px-1 py-0.5 hover:bg-background/60 disabled:opacity-40 max-w-[140px]",
                    title: "Модель для иллюстрации",
                    onClick: (e) => e.stopPropagation(),
                    children: imageModels.length > 0 ? imageModels.map((im) => /* @__PURE__ */ jsxs("option", { value: im.id, disabled: !im.available, children: [
                      im.emoji,
                      " ",
                      im.label,
                      !im.available ? " (нет)" : ""
                    ] }, im.key)) : /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx("option", { value: "google/gemini-3.1-flash-image", children: "⚡ Gemini Flash Image" }),
                      /* @__PURE__ */ jsx("option", { value: "google/gemini-3-pro-image", children: "💎 Gemini Pro Image" }),
                      /* @__PURE__ */ jsx("option", { value: "openai/gpt-image-2", children: "🎨 GPT Image 2" })
                    ] })
                  }
                ),
                m.model && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground ml-auto", children: m.model })
              ] }),
              m.model && m.role === "assistant" && (!m.content || streaming) && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground mt-1 opacity-60", children: m.model })
            ] });
            return m.role === "assistant" ? /* @__PURE__ */ jsx(SelectionContextMenu, { fullText: m.content, boundPatient: threadPatient, onBoundPatientChange: updateThreadPatient, children: bubble }) : bubble;
          })()
        ] }, i))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "border-t border-border p-3 space-y-2", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between gap-2", children: /* @__PURE__ */ jsx(ThreadPatientBadge, { value: threadPatient, onChange: updateThreadPatient, variant: "inline" }) }),
        pubmedMode && user && /* @__PURE__ */ jsx(
          PubmedPanel,
          {
            userId: user.id,
            filters: pubmedFilters,
            onFiltersChange: setPubmedFilters,
            disabled: streaming
          }
        ),
        !isImageModel && (attachmentUpload.phase !== "idle" || attachments.length > 0) && /* @__PURE__ */ jsxs("div", { className: "space-y-2 rounded-md border border-border bg-muted/30 px-3 py-2", children: [
          attachmentUpload.phase !== "idle" && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
              attachmentUpload.phase === "uploading" ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin text-primary" }) : attachmentUpload.phase === "error" ? /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5 text-destructive" }) : /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5 text-primary" }),
              /* @__PURE__ */ jsx("span", { className: attachmentUpload.phase === "error" ? "text-destructive" : "text-foreground", children: attachmentUpload.detail })
            ] }),
            attachmentUpload.total > 0 && /* @__PURE__ */ jsx(Progress, { value: Math.min(100, Math.max(8, Math.round(attachmentUpload.done / attachmentUpload.total * 100))), className: "h-1" })
          ] }),
          attachments.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: attachments.map((a, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-background rounded px-2 py-1 text-xs border border-border", children: [
            a.type.startsWith("image/") ? /* @__PURE__ */ jsx(Image, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(FileText, { className: "w-3 h-3" }),
            /* @__PURE__ */ jsx("span", { className: "max-w-[160px] truncate", children: a.name }),
            a.size ? /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              "· ",
              formatBytes(a.size)
            ] }) : null,
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: "· готов" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setAttachments((p) => p.filter((_, j) => j !== i)),
                className: "hover:text-destructive",
                "aria-label": "Убрать",
                children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
              }
            )
          ] }, i)) })
        ] }),
        isImageModel && (imageRefs.length > 0 || imageUploads.length > 0) && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          imageRefs.map((r, i) => /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
            r.signedUrl ? /* @__PURE__ */ jsx("img", { src: r.signedUrl, alt: r.name || r.path, className: "w-16 h-16 object-cover rounded border border-border" }) : /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground", children: r.bucket }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setImageRefs((p) => p.filter((_, j) => j !== i)),
                className: "absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity",
                "aria-label": "Убрать",
                children: "×"
              }
            )
          ] }, `r-${i}`)),
          imageUploads.map((u, i) => /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
            /* @__PURE__ */ jsx("img", { src: u.previewUrl, alt: u.name, className: "w-16 h-16 object-cover rounded border border-border" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  URL.revokeObjectURL(u.previewUrl);
                  setImageUploads((p) => p.filter((_, j) => j !== i));
                },
                className: "absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity",
                "aria-label": "Убрать",
                children: "×"
              }
            )
          ] }, `u-${i}`))
        ] }),
        isImageModel ? /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: imageRefFileInputRef,
              type: "file",
              accept: "image/*",
              multiple: true,
              className: "hidden",
              onChange: (e) => {
                handleImageRefFiles(e.target.files);
                e.target.value = "";
              }
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "icon",
              onClick: () => {
                var _a2;
                return (_a2 = imageRefFileInputRef.current) == null ? void 0 : _a2.click();
              },
              disabled: streaming,
              "aria-label": "Приложить референс",
              title: "Приложить референс с компьютера (до 4 картинок)",
              children: /* @__PURE__ */ jsx(Paperclip, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: input,
              onChange: (e) => setInput(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              },
              placeholder: `Опишите изображение — ${(currentResolved == null ? void 0 : currentResolved.label) || "image-модель"} (Enter — сгенерировать)`,
              className: "flex-1 min-h-[44px] max-h-40 resize-none",
              disabled: streaming
            }
          ),
          /* @__PURE__ */ jsx(Button, { onClick: () => generateImage(), disabled: streaming || !input.trim(), size: "icon", title: "Сгенерировать", children: streaming ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }) })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: "image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.webp,.gif,.heic",
              multiple: true,
              className: "hidden",
              onChange: (e) => handleFiles(e.target.files)
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "icon",
              onClick: () => {
                var _a2;
                return (_a2 = fileInputRef.current) == null ? void 0 : _a2.click();
              },
              disabled: streaming || attachmentUpload.phase === "uploading" || !attachmentsSupported,
              "aria-label": "Прикрепить файл",
              title: attachmentsSupported ? "Прикрепить PDF/изображение (до 2 файлов, 20 МБ)" : `Модель «${(currentLive == null ? void 0 : currentLive.name) || model}» не принимает картинки/PDF.
Подходят: ${visionCapableLabels.length ? visionCapableLabels.join(", ") : "Claude Sonnet, Gemini, GPT-5"}.`,
              children: /* @__PURE__ */ jsx(Paperclip, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "icon",
              onClick: () => setBatchDialogOpen(true),
              disabled: streaming || !user,
              "aria-label": "Пакетный анализ документов",
              title: "Пакетный анализ документов (много PDF/изображений сразу, через Claude)",
              children: /* @__PURE__ */ jsx(Layers, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: recording ? "destructive" : "outline",
              size: "icon",
              onClick: recording ? stopRecording : startRecording,
              disabled: streaming || transcribing,
              "aria-label": recording ? "Остановить запись" : "Голосовой ввод",
              title: recording ? "Остановить запись" : "Голосовой ввод (микрофон)",
              className: recording ? "animate-pulse" : "",
              children: transcribing ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : recording ? /* @__PURE__ */ jsx(Square, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Mic, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: attachProtocol ? "default" : "outline",
              size: "icon",
              onClick: () => setAttachProtocol((v) => !v),
              disabled: streaming,
              "aria-label": "Прикреплять активный протокол",
              title: attachProtocol ? "К вопросу прикрепляется активный протокол пациента (жалобы, анамнез, статус). Кликните, чтобы выключить." : "Включить автоматическую передачу содержимого активного протокола пациента в вопрос",
              children: /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              variant: attachHistory ? "default" : "outline",
              size: "sm",
              onClick: () => setAttachHistory((v) => !v),
              disabled: streaming || !pendingPatient.id,
              "aria-label": "Включить полную историю пациента",
              title: !pendingPatient.id ? "Сначала привяжите пациента к диалогу" : attachHistory ? `Будет отправлена вся ретроспектива пациента (визиты, УЗИ, анализы, планы, заключения) с таблицей динамики. ${historyCountsHint ? "Последний сбор: " + historyCountsHint : ""}` : "📚 Включить всю историю пациента (все УЗИ, визиты, анализы, прошлые заключения) с хронологией и динамикой",
              className: "gap-1 px-2",
              children: [
                "📚 ",
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline text-xs", children: "История" }),
                historyCountsHint && attachHistory && /* @__PURE__ */ jsxs("span", { className: "hidden md:inline text-[10px] opacity-75", children: [
                  "(",
                  historyCountsHint.split(" · ").length,
                  ")"
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: webSearch ? "default" : "outline",
              size: "icon",
              onClick: () => setWebSearch((v) => !v),
              disabled: streaming || council,
              "aria-label": "Поиск источников",
              title: council ? "Поиск недоступен в режиме Консилиум" : webSearch ? `Поиск включён (${searchSource === "pubmed" ? "PubMed" : "Веб"}) — модель опирается на источники` : "Включить поиск источников для этого сообщения",
              children: /* @__PURE__ */ jsx(Globe, { className: "w-4 h-4" })
            }
          ),
          webSearch && !council && /* @__PURE__ */ jsxs("div", { className: "flex rounded-md border overflow-hidden text-xs", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setSearchSource("web"),
                disabled: streaming,
                className: `px-2 py-1 ${searchSource === "web" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`,
                title: "Поиск в открытом вебе",
                children: "Веб"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setSearchSource("pubmed"),
                disabled: streaming,
                className: `px-2 py-1 border-l ${searchSource === "pubmed" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`,
                title: "Поиск в PubMed (англоязычная медицинская литература)",
                children: "PubMed"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: input,
              onChange: (e) => setInput(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              },
              placeholder: pubmedMode ? "Клинический вопрос для поиска в PubMed (Enter — искать)" : "Сообщение (Enter — отправить, Shift+Enter — перенос)",
              className: "flex-1 min-h-[44px] max-h-40 resize-none",
              disabled: streaming
            }
          ),
          /* @__PURE__ */ jsx(Button, { onClick: sendMessage, disabled: streaming || attachmentUpload.phase === "uploading" || !input.trim() && !attachments.length, size: "icon", "aria-label": "Отправить", children: streaming ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }) })
        ] })
      ] })
    ] }),
    user && /* @__PURE__ */ jsx(
      BatchAnalysisDialog,
      {
        open: batchDialogOpen,
        onOpenChange: setBatchDialogOpen,
        userId: user.id,
        conversationId: activeId,
        onResult: handleBatchResult
      }
    ),
    /* @__PURE__ */ jsx(Dialog, { open: publishDialog.open, onOpenChange: (open) => setPublishDialog((d) => ({ ...d, open })), children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Опубликовать в библиотеку референсов" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Изображение будет сохранено в вашу личную библиотеку — его можно будет выбирать как референс в новых генерациях." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 py-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Название" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: publishDialog.title,
              onChange: (e) => setPublishDialog((d) => ({ ...d, title: e.target.value })),
              placeholder: "Например: лапароскопическая укладка",
              autoFocus: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Описание" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: publishDialog.description,
              onChange: (e) => setPublishDialog((d) => ({ ...d, description: e.target.value })),
              placeholder: "Контекст использования, детали композиции...",
              rows: 3
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Необязательно. Поможет вспомнить, зачем сохраняли." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Теги" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: publishDialog.tags,
              onChange: (e) => setPublishDialog((d) => ({ ...d, tags: e.target.value })),
              placeholder: "через запятую: операционная, дети, схема"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Необязательно. Помогут искать в библиотеке." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setPublishDialog((d) => ({ ...d, open: false })), children: "Отмена" }),
        /* @__PURE__ */ jsx(Button, { onClick: confirmPublishToLibrary, children: "Опубликовать" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: printPreview.open, onOpenChange: (open) => setPrintPreview((d) => ({ ...d, open })), children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-2xl max-sm:inset-0 max-sm:left-0 max-sm:top-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:h-[100dvh] max-sm:max-w-none max-sm:rounded-none", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Предпросмотр печати A4" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Проверьте компоновку перед отправкой на принтер." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-center py-2", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: "bg-white shadow-md border",
          style: { width: "190mm", maxWidth: "100%", aspectRatio: "210/297" },
          children: printPreview.dataUrl && /* @__PURE__ */ jsx(
            "img",
            {
              src: printPreview.dataUrl,
              alt: "Предпросмотр A4",
              className: "w-full h-full object-contain"
            }
          )
        }
      ) }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setPrintPreview({ open: false, dataUrl: null }), children: "Отмена" }),
        /* @__PURE__ */ jsxs(Button, { onClick: confirmPrint, children: [
          /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4 mr-2" }),
          " Печать"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: !!zoomImage, onOpenChange: (open) => {
      if (!open) setZoomImage(null);
    }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-[98vw] sm:max-w-[95vw] w-[98vw] sm:w-[95vw] h-[95vh] p-2 sm:p-3 bg-background flex flex-col gap-2", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { className: "sr-only", children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Просмотр изображения" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: (zoomImage == null ? void 0 : zoomImage.model) || "Сгенерированное изображение" })
      ] }),
      zoomImage && /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 overflow-auto flex items-center justify-center bg-muted/30 rounded", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: zoomImage.url,
          alt: "Увеличенное изображение",
          className: "max-w-full max-h-full object-contain"
        }
      ) }),
      (zoomImage == null ? void 0 : zoomImage.model) && /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground font-mono text-center flex-shrink-0", children: zoomImage.model })
    ] }) })
  ] });
}
export {
  Cabinet as default
};
