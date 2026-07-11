import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { s as supabase, B as Button, b as Badge, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle, I as Input, l as DialogFooter, u as useAuth, T as Textarea } from "../main.mjs";
import { toast } from "sonner";
import { S as ScrollArea } from "./scroll-area-DtgkI4MV.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CJYPrMmK.js";
import { Users, Plus, X, Link2, Camera, ExternalLink, Loader2, Brain, Stethoscope, Activity, FileText, FlaskConical, ArrowLeft, FolderTree, Upload, Download, Calendar, Network, Search, Sparkles, Hash, FolderPlus, Save, Trash2, Link as Link$1 } from "lucide-react";
import { C as ChatMarkdown } from "./ChatMarkdown-B1_X8k9E.js";
import ForceGraph2D from "react-force-graph-2d";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
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
import "@radix-ui/react-tabs";
import "react-markdown";
import "remark-gfm";
import "rehype-raw";
import "rehype-sanitize";
import "@radix-ui/react-select";
const LINK_RE = /\[\[([^\]\n|]+)(?:\|([^\]\n]+))?\]\]/g;
const TAG_RE = /(?:^|\s)#([\p{L}\p{N}_\-/]{2,40})/gu;
function parseWikiLinks(md) {
  var _a;
  const out = [];
  if (!md) return out;
  let m;
  const re = new RegExp(LINK_RE.source, "g");
  while ((m = re.exec(md)) !== null) {
    const fullTarget = m[1].trim();
    const target = fullTarget.split("/").pop().trim();
    const start = Math.max(0, m.index - 60);
    const end = Math.min(md.length, m.index + m[0].length + 60);
    out.push({
      raw: m[0],
      target,
      fullTarget,
      alias: ((_a = m[2]) == null ? void 0 : _a.trim()) || void 0,
      context: md.slice(start, end).replace(/\s+/g, " ").trim()
    });
  }
  return out;
}
function parseTags(md) {
  if (!md) return [];
  const set = /* @__PURE__ */ new Set();
  let m;
  const re = new RegExp(TAG_RE.source, TAG_RE.flags);
  while ((m = re.exec(md)) !== null) set.add(m[1].toLowerCase());
  return Array.from(set).sort();
}
function renderWikiLinksToAnchors(md, resolver) {
  return md.replace(LINK_RE, (_full, target, alias) => {
    const t = target.trim();
    const label = (alias || t.split("/").pop() || t).trim();
    const id = resolver(t.split("/").pop().trim());
    if (id) return `[${label}](#note:${id})`;
    return `<span class="text-orange-500 underline decoration-dotted" title="Заметка не найдена — кликните, чтобы создать">${label}</span>`;
  });
}
const KIND_META = {
  ai_run: { label: "Рассуждение ИИ", icon: Brain, color: "text-purple-600" },
  treatment_plan: { label: "Схема лечения", icon: Stethoscope, color: "text-emerald-600" },
  ultrasound: { label: "УЗИ", icon: Activity, color: "text-blue-600" },
  visit: { label: "Визит", icon: FileText, color: "text-orange-600" },
  lab: { label: "Анализы", icon: FlaskConical, color: "text-pink-600" },
  consultation: { label: "Консультация", icon: FileText, color: "text-indigo-600" },
  prescription: { label: "Рецепт", icon: FileText, color: "text-teal-600" }
};
function VaultContextPanel({ noteId }) {
  const [patients, setPatients] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [attachPicker, setAttachPicker] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: links }, { data: atts }] = await Promise.all([
      supabase.from("vault_note_patients").select("patient_id, patient:patients(id, full_name, birth_date, history_number)").eq("note_id", noteId),
      supabase.from("vault_note_attachments").select("*").eq("note_id", noteId).order("position", { ascending: true }).order("created_at", { ascending: true })
    ]);
    setPatients(links ?? []);
    setAttachments(atts ?? []);
    setLoading(false);
  }, [noteId]);
  useEffect(() => {
    if (noteId) load();
  }, [noteId, load]);
  async function attachPatient(p) {
    const { error } = await supabase.from("vault_note_patients").insert({ note_id: noteId, patient_id: p.id });
    if (error && !error.message.includes("duplicate")) {
      toast.error("Не удалось привязать: " + error.message);
      return;
    }
    toast.success(`Привязан: ${p.full_name}`);
    setPickerOpen(false);
    load();
  }
  async function detachPatient(patientId) {
    await supabase.from("vault_note_patients").delete().eq("note_id", noteId).eq("patient_id", patientId);
    load();
  }
  async function removeAttachment(id) {
    await supabase.from("vault_note_attachments").delete().eq("id", id);
    load();
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Users, { className: "w-3 h-3" }),
          "Пациенты (",
          patients.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "ghost", className: "h-6 px-2 text-xs", onClick: () => setPickerOpen(true), children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3 mr-0.5" }),
          "Привязать"
        ] })
      ] }),
      patients.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground italic", children: "Заметка не привязана" }) : /* @__PURE__ */ jsx("div", { className: "space-y-1", children: patients.map((pl) => pl.patient && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 px-2 py-1 rounded bg-muted/50 text-xs group", children: [
        /* @__PURE__ */ jsxs(Link, { to: `/admin/patients/${pl.patient_id}`, className: "flex-1 hover:underline truncate text-primary", children: [
          "👤 ",
          pl.patient.full_name
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => detachPatient(pl.patient_id),
            className: "opacity-0 group-hover:opacity-100 text-destructive",
            children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
          }
        )
      ] }, pl.patient_id)) })
    ] }),
    patients.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold text-muted-foreground uppercase mb-1.5", children: "Добавить в заметку" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-1", children: ["ai_run", "treatment_plan", "ultrasound", "visit", "lab", "prescription"].map((k) => {
        const meta = KIND_META[k];
        const Icon = meta.icon;
        return /* @__PURE__ */ jsxs(
          Button,
          {
            size: "sm",
            variant: "outline",
            className: "h-7 text-[11px] justify-start gap-1",
            onClick: () => setAttachPicker({ kind: k, patientId: patients[0].patient_id }),
            children: [
              /* @__PURE__ */ jsx(Icon, { className: `w-3 h-3 ${meta.color}` }),
              meta.label
            ]
          },
          k
        );
      }) })
    ] }),
    attachments.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold text-muted-foreground uppercase mb-1.5", children: [
        "Вложения (",
        attachments.length,
        ")"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: attachments.map((a) => {
        const meta = KIND_META[a.kind];
        const Icon = meta.icon;
        return /* @__PURE__ */ jsx("div", { className: "border rounded p-2 text-xs group bg-card", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-1.5", children: [
          /* @__PURE__ */ jsx(Icon, { className: `w-3.5 h-3.5 mt-0.5 shrink-0 ${meta.color}` }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium truncate", children: a.title }),
            a.summary && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground line-clamp-2", children: a.summary }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mt-1", children: [
              /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[9px] h-4", children: a.mode === "live" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Link2, { className: "w-2.5 h-2.5 mr-0.5" }),
                "живая"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Camera, { className: "w-2.5 h-2.5 mr-0.5" }),
                "снимок"
              ] }) }),
              a.mode === "live" && a.ref_id && /* @__PURE__ */ jsx(AttachmentLink, { kind: a.kind, refId: a.ref_id, patientId: a.patient_id })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => removeAttachment(a.id),
              className: "opacity-0 group-hover:opacity-100 text-destructive",
              children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
            }
          )
        ] }) }, a.id);
      }) })
    ] }),
    /* @__PURE__ */ jsx(
      PatientPicker,
      {
        open: pickerOpen,
        onClose: () => setPickerOpen(false),
        onPick: attachPatient,
        excludeIds: patients.map((p) => p.patient_id)
      }
    ),
    attachPicker && /* @__PURE__ */ jsx(
      AttachmentPicker,
      {
        noteId,
        kind: attachPicker.kind,
        patients: patients.map((p) => p.patient).filter(Boolean),
        initialPatientId: attachPicker.patientId,
        onClose: () => setAttachPicker(null),
        onDone: () => {
          setAttachPicker(null);
          load();
        }
      }
    )
  ] });
}
function AttachmentLink({ kind, refId, patientId }) {
  const href = kind === "treatment_plan" ? `/admin/treatment-plans/${refId}` : kind === "ai_run" ? `/cabinet/agent?run=${refId}` : kind === "visit" ? `/admin/patient-visits/${refId}` : kind === "ultrasound" ? patientId ? `/admin/patients/${patientId}` : "#" : kind === "lab" ? patientId ? `/admin/patients/${patientId}` : "#" : kind === "prescription" ? `/admin/prescriptions/${refId}` : "#";
  return /* @__PURE__ */ jsxs(Link, { to: href, className: "text-[10px] text-primary hover:underline inline-flex items-center gap-0.5", children: [
    /* @__PURE__ */ jsx(ExternalLink, { className: "w-2.5 h-2.5" }),
    "открыть"
  ] });
}
function PatientPicker({
  open,
  onClose,
  onPick,
  excludeIds
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      let query = supabase.from("patients").select("id, full_name, birth_date, history_number").order("full_name").limit(30);
      if (q.trim()) query = query.ilike("full_name", `%${q.trim()}%`);
      const { data } = await query;
      setResults((data ?? []).filter((p) => !excludeIds.includes(p.id)));
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q, open, excludeIds]);
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: (v) => !v && onClose(), children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Привязать пациента" }) }),
    /* @__PURE__ */ jsx(Input, { placeholder: "Поиск по ФИО...", value: q, onChange: (e) => setQ(e.target.value), autoFocus: true }),
    /* @__PURE__ */ jsxs("div", { className: "max-h-80 overflow-y-auto space-y-1", children: [
      loading && /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin mx-auto" }),
      results.map((p) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => onPick(p),
          className: "w-full text-left px-2 py-2 rounded hover:bg-muted text-sm border",
          children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: p.full_name }),
            /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
              p.birth_date ?? "—",
              p.history_number ? ` · ИБ ${p.history_number}` : ""
            ] })
          ]
        },
        p.id
      )),
      !loading && results.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center text-xs text-muted-foreground py-4", children: "Никого не найдено" })
    ] })
  ] }) });
}
function AttachmentPicker({
  noteId,
  kind,
  patients,
  initialPatientId,
  onClose,
  onDone
}) {
  const [patientId, setPatientId] = useState(initialPatientId);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("live");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setSelected(null);
    loadItems();
  }, [patientId, kind]);
  async function loadItems() {
    setLoading(true);
    let rows = [];
    if (kind === "ai_run") {
      const { data } = await supabase.from("agent_runs").select("id, task, final_answer, created_at").eq("patient_id", patientId).order("created_at", { ascending: false }).limit(50);
      rows = (data ?? []).map((r) => {
        var _a;
        return {
          id: r.id,
          title: (r.task ?? "Разбор ИИ").slice(0, 80),
          summary: (_a = r.final_answer) == null ? void 0 : _a.slice(0, 200),
          data: r
        };
      });
    } else if (kind === "treatment_plan") {
      const { data } = await supabase.from("treatment_plans").select("id, diagnosis_short, clinical_summary, course_number, issued_at, created_at").eq("patient_id", patientId).order("created_at", { ascending: false }).limit(50);
      rows = (data ?? []).map((r) => {
        var _a;
        return {
          id: r.id,
          title: `Курс №${r.course_number ?? "—"} от ${new Date(r.issued_at || r.created_at).toLocaleDateString("ru")}`,
          summary: r.diagnosis_short || ((_a = r.clinical_summary) == null ? void 0 : _a.slice(0, 200)),
          data: r
        };
      });
    } else if (kind === "ultrasound") {
      const { data } = await supabase.from("ultrasound_results").select("id, exam_date").eq("patient_id", patientId).order("exam_date", { ascending: false }).limit(50);
      rows = (data ?? []).map((r) => ({
        id: r.id,
        title: `УЗИ от ${r.exam_date ? new Date(r.exam_date).toLocaleDateString("ru") : "—"}`,
        summary: "",
        data: r
      }));
    } else if (kind === "visit") {
      const { data } = await supabase.from("patient_visits").select("id, visit_date, protocol_type, diagnosis").eq("patient_id", patientId).order("visit_date", { ascending: false }).limit(50);
      rows = (data ?? []).map((r) => {
        var _a;
        return {
          id: r.id,
          title: `${r.protocol_type || "Визит"} — ${r.visit_date ? new Date(r.visit_date).toLocaleDateString("ru") : ""}`,
          summary: (_a = r.diagnosis) == null ? void 0 : _a.slice(0, 200),
          data: r
        };
      });
    } else if (kind === "lab") {
      const { data } = await supabase.from("lab_results").select("id, test_name, test_date, value, unit").eq("patient_id", patientId).order("test_date", { ascending: false }).limit(50);
      rows = (data ?? []).map((r) => ({
        id: r.id,
        title: `${r.test_name} — ${r.test_date ? new Date(r.test_date).toLocaleDateString("ru") : ""}`,
        summary: r.value ? `${r.value} ${r.unit ?? ""}` : "",
        data: r
      }));
    } else if (kind === "prescription") {
      const { data } = await supabase.from("prescriptions").select("id, prescription_type, prescription_date, signa").eq("patient_id", patientId).order("prescription_date", { ascending: false }).limit(50);
      rows = (data ?? []).map((r) => ({
        id: r.id,
        title: `Рецепт (${r.prescription_type ?? "—"}) — ${r.prescription_date ? new Date(r.prescription_date).toLocaleDateString("ru") : ""}`,
        summary: r.signa,
        data: r
      }));
    }
    setItems(rows);
    setLoading(false);
  }
  async function save() {
    if (!selected) return;
    setSaving(true);
    const item = items.find((i) => i.id === selected);
    const { error } = await supabase.from("vault_note_attachments").insert({
      note_id: noteId,
      patient_id: patientId,
      kind,
      ref_id: selected,
      mode,
      title: (item == null ? void 0 : item.title) ?? "Без названия",
      summary: (item == null ? void 0 : item.summary) ?? null,
      snapshot: mode === "snapshot" ? (item == null ? void 0 : item.data) ?? null : null
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Добавлено в заметку");
    onDone();
  }
  return /* @__PURE__ */ jsx(Dialog, { open: true, onOpenChange: (v) => !v && onClose(), children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-lg", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { children: [
      "Добавить: ",
      KIND_META[kind].label
    ] }) }),
    patients.length > 1 && /* @__PURE__ */ jsxs(Select, { value: patientId, onValueChange: setPatientId, children: [
      /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
      /* @__PURE__ */ jsx(SelectContent, { children: patients.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p.id, children: p.full_name }, p.id)) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "max-h-72 overflow-y-auto space-y-1 border rounded p-1", children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin mx-auto my-4" }) : items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center text-xs text-muted-foreground py-6", children: "У пациента нет таких записей" }) : items.map((it) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setSelected(it.id),
        className: `w-full text-left px-2 py-1.5 rounded text-sm border ${selected === it.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`,
        children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium text-xs", children: it.title }),
          it.summary && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground line-clamp-1", children: it.summary })
        ]
      },
      it.id
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Режим:" }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          size: "sm",
          variant: mode === "live" ? "default" : "outline",
          className: "h-7 text-xs",
          onClick: () => setMode("live"),
          children: [
            /* @__PURE__ */ jsx(Link2, { className: "w-3 h-3 mr-1" }),
            "Живая ссылка"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Button,
        {
          size: "sm",
          variant: mode === "snapshot" ? "default" : "outline",
          className: "h-7 text-xs",
          onClick: () => setMode("snapshot"),
          children: [
            /* @__PURE__ */ jsx(Camera, { className: "w-3 h-3 mr-1" }),
            "Снимок"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: onClose, children: "Отмена" }),
      /* @__PURE__ */ jsxs(Button, { onClick: save, disabled: !selected || saving, children: [
        saving && /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-1 animate-spin" }),
        "Добавить"
      ] })
    ] })
  ] }) });
}
function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "note";
}
function CabinetVault() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(params.get("note"));
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftFolder, setDraftFolder] = useState("/");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [semantic, setSemantic] = useState(false);
  const [semResults, setSemResults] = useState([]);
  const [semLoading, setSemLoading] = useState(false);
  const [tab, setTab] = useState("editor");
  const saveTimer = useRef(null);
  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: n }, { data: l }] = await Promise.all([
      supabase.from("vault_notes").select("*").order("updated_at", { ascending: false }),
      supabase.from("vault_links").select("*")
    ]);
    setNotes(n ?? []);
    setLinks(l ?? []);
    setLoading(false);
  }, [user]);
  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);
  const active = useMemo(() => notes.find((x) => x.id === activeId) || null, [notes, activeId]);
  useEffect(() => {
    if (active) {
      setDraftTitle(active.title);
      setDraftBody(active.content_md);
      setDraftFolder(active.folder_path);
      setDirty(false);
    } else {
      setDraftTitle("");
      setDraftBody("");
      setDraftFolder("/");
      setDirty(false);
    }
  }, [active == null ? void 0 : active.id]);
  useEffect(() => {
    if (activeId) setParams({ note: activeId }, { replace: true });
    else setParams({}, { replace: true });
  }, [activeId]);
  const titleIndex = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const n of notes) m.set(n.title.toLowerCase(), n.id);
    return m;
  }, [notes]);
  const resolver = useCallback((t) => titleIndex.get(t.toLowerCase()) ?? null, [titleIndex]);
  const backlinks = useMemo(() => {
    if (!activeId) return [];
    const idsOrTitleMatches = links.filter(
      (l) => l.to_note_id === activeId || l.to_note_id === null && active && l.to_title.toLowerCase() === active.title.toLowerCase()
    );
    return idsOrTitleMatches.map((l) => ({
      link: l,
      note: notes.find((n) => n.id === l.from_note_id) || null
    })).filter((x) => x.note);
  }, [links, activeId, active, notes]);
  const outgoing = useMemo(() => {
    if (!activeId) return [];
    return links.filter((l) => l.from_note_id === activeId);
  }, [links, activeId]);
  const folderTree = useMemo(() => {
    const groups = /* @__PURE__ */ new Map();
    for (const n of notes) {
      const f = n.folder_path || "/";
      if (!groups.has(f)) groups.set(f, []);
      groups.get(f).push(n);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [notes]);
  const save = useCallback(async (opts) => {
    if (!user || !draftTitle.trim()) return;
    setSaving(true);
    try {
      const slug = slugify(draftTitle.trim());
      const tags = parseTags(draftBody);
      const folder = draftFolder.trim() || "/";
      let id = activeId;
      if (id) {
        const { error } = await supabase.from("vault_notes").update({
          title: draftTitle.trim(),
          slug,
          folder_path: folder,
          content_md: draftBody,
          tags
        }).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("vault_notes").insert({
          owner_id: user.id,
          title: draftTitle.trim(),
          slug,
          folder_path: folder,
          content_md: draftBody,
          tags
        }).select().single();
        if (error) throw error;
        id = data.id;
        setActiveId(id);
      }
      await supabase.from("vault_links").delete().eq("from_note_id", id);
      const parsed = parseWikiLinks(draftBody);
      if (parsed.length) {
        const rows = parsed.map((p) => ({
          owner_id: user.id,
          from_note_id: id,
          to_note_id: resolver(p.target),
          to_title: p.target,
          context_snippet: p.context
        }));
        await supabase.from("vault_links").insert(rows);
      }
      supabase.functions.invoke("vault-embed", { body: { noteId: id } }).catch(() => {
      });
      setDirty(false);
      await loadAll();
      if (!(opts == null ? void 0 : opts.silent)) toast.success("Сохранено");
    } catch (e) {
      toast.error(`Ошибка сохранения: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }, [user, draftTitle, draftBody, draftFolder, activeId, resolver, loadAll]);
  useEffect(() => {
    if (!dirty) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      save({ silent: true });
    }, 5e3);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [dirty, draftTitle, draftBody, draftFolder, save]);
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save]);
  const createNote = useCallback(async (preset) => {
    if (!user) return;
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const title = (preset == null ? void 0 : preset.title) || ((preset == null ? void 0 : preset.isDaily) ? `📅 ${today}` : "Без названия");
    const { data, error } = await supabase.from("vault_notes").insert({
      owner_id: user.id,
      title,
      slug: slugify(title),
      folder_path: (preset == null ? void 0 : preset.folder) || ((preset == null ? void 0 : preset.isDaily) ? "/Daily" : "/"),
      content_md: "",
      tags: [],
      is_daily: (preset == null ? void 0 : preset.isDaily) ?? false,
      daily_date: (preset == null ? void 0 : preset.isDaily) ? today : null
    }).select().single();
    if (error) return toast.error(error.message);
    await loadAll();
    setActiveId(data.id);
  }, [user, loadAll]);
  const deleteNote = useCallback(async () => {
    if (!active) return;
    if (!confirm(`Удалить «${active.title}»?`)) return;
    await supabase.from("vault_notes").delete().eq("id", active.id);
    setActiveId(null);
    await loadAll();
    toast.success("Удалено");
  }, [active, loadAll]);
  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || semantic) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content_md.toLowerCase().includes(q) || n.tags.some((t) => t.includes(q))
    );
  }, [notes, search, semantic]);
  const runSemanticSearch = useCallback(async () => {
    if (!search.trim()) return;
    setSemLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("vault-search", { body: { query: search.trim(), limit: 15 } });
      if (error) throw error;
      setSemResults((data == null ? void 0 : data.results) ?? []);
    } catch (e) {
      toast.error(`Ошибка поиска: ${e.message}`);
    } finally {
      setSemLoading(false);
    }
  }, [search]);
  const graphData = useMemo(() => {
    const nodes = notes.map((n) => ({
      id: n.id,
      name: n.title,
      folder: n.folder_path,
      val: 1 + links.filter((l) => l.to_note_id === n.id || l.from_note_id === n.id).length * 0.6
    }));
    const edges = links.filter((l) => l.to_note_id).map((l) => ({ source: l.from_note_id, target: l.to_note_id }));
    return { nodes, links: edges };
  }, [notes, links]);
  const handlePreviewClick = useCallback((e) => {
    const target = e.target;
    const a = target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#note:")) {
      e.preventDefault();
      setActiveId(href.slice(6));
    }
  }, []);
  const renderedBody = useMemo(
    () => renderWikiLinksToAnchors(draftBody, resolver),
    [draftBody, resolver]
  );
  if (authLoading) return /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin mx-auto" }) });
  if (!user || !isAdmin) {
    return /* @__PURE__ */ jsxs("div", { className: "p-8 max-w-md mx-auto text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-3", children: "Vault доступен только админу." }),
      /* @__PURE__ */ jsx(Button, { onClick: () => navigate("/cabinet"), children: "← В кабинет" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-2 sm:px-4 py-4 max-w-[1600px]", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3 flex-wrap", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/cabinet", className: "text-sm text-muted-foreground hover:text-foreground flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Кабинет"
      ] }),
      /* @__PURE__ */ jsxs("h1", { className: "text-lg font-semibold flex items-center gap-2 ml-2", children: [
        /* @__PURE__ */ jsx(FolderTree, { className: "w-5 h-5 text-primary" }),
        " Vault",
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground font-normal", children: [
          notes.length,
          " заметок · ",
          links.length,
          " связей"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: async () => {
          const t = toast.loading("Push → GitHub…");
          try {
            const { data, error } = await supabase.functions.invoke("vault-sync", { body: { action: "push" } });
            if (error) throw error;
            toast.success(`Push: создано ${data.created}, обновлено ${data.updated}, без изм. ${data.skipped}`, { id: t });
          } catch (e) {
            toast.error("Push: " + (e.message || e), { id: t });
          }
        }, children: [
          /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 mr-1" }),
          " Push"
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: async () => {
          const t = toast.loading("Pull ← GitHub…");
          try {
            const { data, error } = await supabase.functions.invoke("vault-sync", { body: { action: "pull" } });
            if (error) throw error;
            toast.success(`Pull: новых ${data.imported}, обновлено ${data.updated}, без изм. ${data.skipped}`, { id: t });
            await loadAll();
          } catch (e) {
            toast.error("Pull: " + (e.message || e), { id: t });
          }
        }, children: [
          /* @__PURE__ */ jsx(Download, { className: "w-4 h-4 mr-1" }),
          " Pull"
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => createNote({ isDaily: true }), children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 mr-1" }),
          " Дневник"
        ] }),
        /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => createNote(), children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-1" }),
          " Новая"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { value: tab, onValueChange: (v) => setTab(v), children: [
      /* @__PURE__ */ jsxs(TabsList, { children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "editor", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 mr-1" }),
          "Редактор"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "graph", children: [
          /* @__PURE__ */ jsx(Network, { className: "w-4 h-4 mr-1" }),
          "Граф"
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "editor", className: "mt-3", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-3 min-h-[calc(100vh-200px)]", children: [
        /* @__PURE__ */ jsxs("aside", { className: "col-span-12 md:col-span-3 border rounded-lg bg-card flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-2 border-b space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: search,
                  onChange: (e) => setSearch(e.target.value),
                  placeholder: semantic ? "Что искать по смыслу..." : "Поиск...",
                  className: "pl-8 h-9",
                  onKeyDown: (e) => {
                    if (e.key === "Enter" && semantic) runSemanticSearch();
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  size: "sm",
                  variant: semantic ? "default" : "outline",
                  className: "h-7 text-xs flex-1",
                  onClick: () => {
                    setSemantic(!semantic);
                    setSemResults([]);
                  },
                  children: [
                    /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3 mr-1" }),
                    "Смысл"
                  ]
                }
              ),
              semantic && /* @__PURE__ */ jsx(Button, { size: "sm", className: "h-7 text-xs", onClick: runSemanticSearch, disabled: !search.trim() || semLoading, children: semLoading ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : "Искать" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1 max-h-[calc(100vh-340px)]", children: loading ? /* @__PURE__ */ jsx("div", { className: "p-4 text-center text-sm text-muted-foreground", children: /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin mx-auto" }) }) : semantic && semResults.length ? /* @__PURE__ */ jsx("div", { className: "p-1", children: semResults.map((r) => /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setActiveId(r.note_id),
              className: "w-full text-left px-2 py-2 rounded hover:bg-muted text-sm border-b border-border/40",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium truncate", children: r.title }),
                  /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-primary shrink-0", children: [
                    Math.round(r.similarity * 100),
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground truncate", children: r.folder_path }),
                /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground line-clamp-2 mt-0.5", children: r.snippet })
              ]
            },
            r.note_id
          )) }) : /* @__PURE__ */ jsxs("div", { className: "p-1", children: [
            folderTree.map(([folder, items]) => /* @__PURE__ */ jsxs("div", { className: "mb-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(FolderTree, { className: "w-3 h-3" }),
                " ",
                folder
              ] }),
              items.filter((n) => !search || filteredNotes.includes(n)).map((n) => /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setActiveId(n.id),
                  className: `w-full text-left px-2 py-1.5 rounded hover:bg-muted text-sm flex items-center gap-2 ${activeId === n.id ? "bg-primary/10 text-primary font-medium" : ""}`,
                  children: [
                    /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5 shrink-0 opacity-60" }),
                    /* @__PURE__ */ jsx("span", { className: "truncate flex-1", children: n.title }),
                    n.tags.length > 0 && /* @__PURE__ */ jsx(Hash, { className: "w-3 h-3 opacity-50" })
                  ]
                },
                n.id
              ))
            ] }, folder)),
            !notes.length && /* @__PURE__ */ jsx("div", { className: "p-4 text-center text-xs text-muted-foreground", children: "Пусто. Нажмите «Новая», чтобы создать первую заметку." })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("main", { className: "col-span-12 md:col-span-6 border rounded-lg bg-card flex flex-col", children: !active && !dirty ? /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center text-muted-foreground text-sm", children: "Выберите заметку или создайте новую" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "p-2 border-b space-y-2", children: [
            /* @__PURE__ */ jsx(
              Input,
              {
                value: draftTitle,
                onChange: (e) => {
                  setDraftTitle(e.target.value);
                  setDirty(true);
                },
                placeholder: "Заголовок",
                className: "text-lg font-semibold border-0 focus-visible:ring-0 px-2"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-1", children: [
              /* @__PURE__ */ jsx(FolderPlus, { className: "w-3.5 h-3.5 text-muted-foreground" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: draftFolder,
                  onChange: (e) => {
                    setDraftFolder(e.target.value);
                    setDirty(true);
                  },
                  placeholder: "/Папка",
                  className: "h-7 text-xs flex-1 max-w-[200px]"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-1", children: [
                dirty && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-amber-600", children: "● несохранено" }),
                /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => save(), disabled: saving || !draftTitle.trim(), children: saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-3.5 h-3.5" }) }),
                active && /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: deleteNote, className: "text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 flex-1 divide-y lg:divide-y-0 lg:divide-x", children: [
            /* @__PURE__ */ jsx(
              Textarea,
              {
                value: draftBody,
                onChange: (e) => {
                  setDraftBody(e.target.value);
                  setDirty(true);
                },
                placeholder: "Markdown… используйте [[Название]] для ссылок и #теги",
                className: "border-0 resize-none focus-visible:ring-0 font-mono text-sm min-h-[400px] rounded-none"
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "overflow-auto p-4 min-h-[400px]", onClick: handlePreviewClick, children: /* @__PURE__ */ jsx(ChatMarkdown, { children: renderedBody || "_Превью появится здесь_" }) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("aside", { className: "col-span-12 md:col-span-3 border rounded-lg bg-card p-3 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto", children: active ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(VaultContextPanel, { noteId: active.id }),
          active.tags.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Hash, { className: "w-3 h-3" }),
              "Теги"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: active.tags.map((t) => /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-[10px]", children: [
              "#",
              t
            ] }, t)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Link$1, { className: "w-3 h-3" }),
              "Исходящие (",
              outgoing.length,
              ")"
            ] }),
            outgoing.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground italic", children: "Нет ссылок [[…]]" }) : /* @__PURE__ */ jsx("div", { className: "space-y-1", children: outgoing.map((l) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => l.to_note_id ? setActiveId(l.to_note_id) : null,
                className: `w-full text-left text-xs px-2 py-1 rounded hover:bg-muted ${!l.to_note_id ? "text-orange-500" : "text-primary"}`,
                title: !l.to_note_id ? "Заметка ещё не создана" : "",
                children: [
                  l.to_note_id ? "→" : "✗",
                  " ",
                  l.to_title
                ]
              },
              l.id
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Link$1, { className: "w-3 h-3 rotate-180" }),
              "Backlinks (",
              backlinks.length,
              ")"
            ] }),
            backlinks.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground italic", children: "Никто не ссылается" }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: backlinks.map(({ link, note }) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => note && setActiveId(note.id),
                className: "w-full text-left px-2 py-1.5 rounded hover:bg-muted border border-border/40",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "text-xs font-medium text-primary", children: [
                    "← ",
                    note.title
                  ] }),
                  link.context_snippet && /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground line-clamp-2 mt-0.5", children: [
                    "…",
                    link.context_snippet,
                    "…"
                  ] })
                ]
              },
              link.id
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t text-[10px] text-muted-foreground", children: [
            "Обновлено: ",
            new Date(active.updated_at).toLocaleString("ru")
          ] })
        ] }) : /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground italic", children: "Выберите заметку, чтобы увидеть связи" }) })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "graph", className: "mt-3", children: /* @__PURE__ */ jsx("div", { className: "border rounded-lg bg-card overflow-hidden", style: { height: "calc(100vh - 220px)" }, children: graphData.nodes.length === 0 ? /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-muted-foreground", children: "Граф появится, когда добавите заметки и [[ссылки]] между ними" }) : /* @__PURE__ */ jsx(
        ForceGraph2D,
        {
          graphData,
          nodeLabel: "name",
          nodeAutoColorBy: "folder",
          linkColor: () => "rgba(120,120,120,0.35)",
          linkDirectionalArrowLength: 4,
          linkDirectionalArrowRelPos: 1,
          onNodeClick: (node) => {
            setActiveId(node.id);
            setTab("editor");
          },
          nodeCanvasObject: (node, ctx, scale) => {
            const label = node.name;
            const fontSize = 12 / scale;
            ctx.fillStyle = node.color || "#3b82f6";
            ctx.beginPath();
            ctx.arc(node.x, node.y, Math.sqrt(node.val) * 3, 0, 2 * Math.PI);
            ctx.fill();
            if (scale > 1.2) {
              ctx.font = `${fontSize}px sans-serif`;
              ctx.textAlign = "center";
              ctx.fillStyle = "#666";
              ctx.fillText(label.slice(0, 30), node.x, node.y + Math.sqrt(node.val) * 3 + fontSize);
            }
          }
        }
      ) }) })
    ] })
  ] });
}
export {
  CabinetVault as default
};
