import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, s as supabase, J as TooltipProvider, C as Card, c as CardHeader, d as CardTitle, a as CardContent, T as Textarea, B as Button, b as Badge, r as Checkbox, K as Tooltip, M as TooltipTrigger, N as TooltipContent, L as Label, I as Input, t as toast } from "../main.mjs";
import { S as ScrollArea } from "./scroll-area-DtgkI4MV.js";
import { P as Progress } from "./progress-Y5q1JT93.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
import { Loader2, ArrowLeft, Sparkles, Search, CheckCircle2, Circle, X, Calculator, Info, FileText, Save, History, User, Trash2 } from "lucide-react";
import { P as PatientSelect } from "./PatientSelect-GQWx7tp3.js";
import { l as pushRxBatch } from "./protocolBridge-4TuhSmsW.js";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
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
import "@radix-ui/react-scroll-area";
import "@radix-ui/react-progress";
import "@radix-ui/react-select";
const POTENCY_OPTIONS = ["6C", "12C", "30C", "200C", "1M", "10M", "50M", "CM", "LM1", "LM2", "LM3", "LM6"];
const DEFAULT_PRESCRIBE = { prescribe: false, potency: "30C", frequency: "1 раз в день", duration: "14 дней", quantity: 10 };
function AdminRepertoryByComplaint() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState("");
  const [statements, setStatements] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [remedies, setRemedies] = useState([]);
  const [links, setLinks] = useState([]);
  const [computed, setComputed] = useState(false);
  const [computing, setComputing] = useState(false);
  const [mmSections, setMmSections] = useState({});
  const [stage, setStage] = useState("idle");
  const [stageMessage, setStageMessage] = useState("");
  const stageProgress = {
    idle: 0,
    extract: 25,
    select: 60,
    compute: 90,
    done: 100,
    error: 0
  };
  const pipelineRunning = stage === "extract" || stage === "select" || stage === "compute";
  const [patient, setPatient] = useState(null);
  const [prescribeMap, setPrescribeMap] = useState({});
  const [savedId, setSavedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [repTitle, setRepTitle] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilterPatient, setHistoryFilterPatient] = useState(null);
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: "/admin/repertory/by-complaint" } });
  }, [user, isAdmin, loading, navigate]);
  const remedyById = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    remedies.forEach((r) => m.set(r.id, r));
    return m;
  }, [remedies]);
  const selectedIds = useMemo(() => new Set(candidates.filter((c) => c.selected).map((c) => c.rubric_id)), [candidates]);
  const ranking = useMemo(() => {
    if (!computed || selectedIds.size === 0) return [];
    const stats = /* @__PURE__ */ new Map();
    links.forEach((l) => {
      if (!selectedIds.has(l.rubric_id)) return;
      const s = stats.get(l.remedy_id) || { sum: 0, count: 0, perRubric: /* @__PURE__ */ new Map() };
      s.sum += l.grade;
      s.count += 1;
      s.perRubric.set(l.rubric_id, l.grade);
      stats.set(l.remedy_id, s);
    });
    return Array.from(stats.entries()).map(([rid, s]) => ({ remedy: remedyById.get(rid), ...s })).filter((x) => x.remedy).sort((a, b) => b.count - a.count || b.sum - a.sum).slice(0, 10);
  }, [computed, selectedIds, links, remedyById]);
  useEffect(() => {
    setPrescribeMap((prev) => {
      const next = {};
      ranking.forEach((r, i) => {
        next[r.remedy.id] = prev[r.remedy.id] ?? { ...DEFAULT_PRESCRIBE, prescribe: i === 0 };
      });
      return next;
    });
    setSavedId(null);
  }, [ranking]);
  const updatePrescribe = (rid, patch) => {
    setPrescribeMap((p) => ({ ...p, [rid]: { ...p[rid] ?? DEFAULT_PRESCRIBE, ...patch } }));
  };
  const selectedToPrescribe = useMemo(
    () => ranking.filter((r) => {
      var _a;
      return (_a = prescribeMap[r.remedy.id]) == null ? void 0 : _a.prescribe;
    }),
    [ranking, prescribeMap]
  );
  const buildSelectedRemediesPayload = () => ranking.map((r) => {
    const p = prescribeMap[r.remedy.id] ?? DEFAULT_PRESCRIBE;
    return {
      remedy_id: r.remedy.id,
      name_latin: r.remedy.name_latin,
      name_ru: r.remedy.name_ru,
      prescribe: !!p.prescribe,
      potency: p.potency,
      frequency: p.frequency,
      duration: p.duration,
      quantity: p.quantity,
      count: r.count,
      sum: r.sum
    };
  });
  async function saveRepertorization(silent = false) {
    if (!user) return null;
    if (ranking.length === 0) {
      if (!silent) toast({ title: "Нечего сохранять", description: "Сначала запустите ранжирование", variant: "destructive" });
      return null;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        patient_id: (patient == null ? void 0 : patient.id) ?? null,
        title: repTitle.trim() || null,
        complaint,
        statements,
        selected_rubrics: candidates.filter((c) => c.selected).map((c) => ({ rubric_id: c.rubric_id, name: c.name, name_ru: c.name_ru, reason: c.reason ?? null })),
        ranking: ranking.map((r) => ({
          remedy_id: r.remedy.id,
          name_latin: r.remedy.name_latin,
          name_ru: r.remedy.name_ru,
          count: r.count,
          sum: r.sum
        })),
        selected_remedies: buildSelectedRemediesPayload()
      };
      let id = savedId;
      if (id) {
        const { error } = await supabase.from("complaint_repertorizations").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("complaint_repertorizations").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
        setSavedId(id);
      }
      if (!silent) toast({ title: "Подбор сохранён", description: patient ? `Привязан к ${patient.full_name}` : "Сохранён как черновик" });
      loadHistory();
      return id;
    } catch (e) {
      toast({ title: "Не удалось сохранить", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
      return null;
    } finally {
      setSaving(false);
    }
  }
  async function sendToPrescription() {
    if (selectedToPrescribe.length === 0) {
      toast({ title: "Выберите препараты", description: "Поставьте галочку «Выписать» хотя бы у одного", variant: "destructive" });
      return;
    }
    await saveRepertorization(true);
    const items = selectedToPrescribe.map((r) => {
      const p = prescribeMap[r.remedy.id];
      const ruPart = r.remedy.name_ru ? ` (${r.remedy.name_ru})` : "";
      return {
        medication_ru_name: r.remedy.name_ru,
        medication_latin_name: `${r.remedy.name_latin} ${p.potency}${ruPart}`,
        dosage_form: "крупка",
        dose: p.potency,
        quantity: p.quantity,
        frequency: p.frequency,
        duration: p.duration
      };
    });
    pushRxBatch(items, patient == null ? void 0 : patient.id);
    toast({ title: "Отправлено в рецепт", description: `${items.length} препарат(ов). Откройте «Рецепты».` });
    const url = (patient == null ? void 0 : patient.id) ? `/admin/prescriptions?patientId=${patient.id}` : `/admin/prescriptions`;
    window.open(url, "_blank", "noopener");
  }
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      let q = supabase.from("complaint_repertorizations").select("id, title, complaint, patient_id, created_at, selected_remedies, patients(full_name)").order("created_at", { ascending: false }).limit(20);
      if (historyFilterPatient) q = q.eq("patient_id", historyFilterPatient.id);
      const { data, error } = await q;
      if (error) throw error;
      setHistory(
        (data || []).map((r) => {
          var _a;
          return {
            id: r.id,
            title: r.title,
            complaint: r.complaint,
            patient_id: r.patient_id,
            patient_name: ((_a = r.patients) == null ? void 0 : _a.full_name) ?? null,
            created_at: r.created_at,
            selected_remedies: Array.isArray(r.selected_remedies) ? r.selected_remedies : []
          };
        })
      );
    } catch (e) {
      console.error("[history]", e);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyFilterPatient]);
  useEffect(() => {
    if (user && isAdmin) loadHistory();
  }, [user, isAdmin, loadHistory]);
  async function loadFromHistory(row) {
    const { data, error } = await supabase.from("complaint_repertorizations").select("*").eq("id", row.id).single();
    if (error) {
      toast({ title: "Не удалось загрузить", description: error.message, variant: "destructive" });
      return;
    }
    setComplaint(data.complaint || "");
    setStatements(Array.isArray(data.statements) ? data.statements : []);
    const rubrics = Array.isArray(data.selected_rubrics) ? data.selected_rubrics : [];
    setCandidates(rubrics.map((r) => ({
      rubric_id: r.rubric_id,
      name: r.name,
      name_ru: r.name_ru,
      chapter_id: null,
      similarity: 1,
      matched_statements: [],
      reason: r.reason ?? void 0,
      selected: true
    })));
    setRepTitle(data.title || "");
    setSavedId(data.id);
    if (data.patient_id) {
      const { data: p } = await supabase.from("patients").select("id, full_name, birth_date").eq("id", data.patient_id).maybeSingle();
      if (p) setPatient(p);
    } else {
      setPatient(null);
    }
    if (rubrics.length > 0) {
      await runCompute(rubrics.map((r) => r.rubric_id));
    }
    const sel = Array.isArray(data.selected_remedies) ? data.selected_remedies : [];
    const map = {};
    sel.forEach((s) => {
      map[s.remedy_id] = {
        prescribe: !!s.prescribe,
        potency: s.potency || "30C",
        frequency: s.frequency || "1 раз в день",
        duration: s.duration || "14 дней",
        quantity: s.quantity || 10
      };
    });
    setPrescribeMap((prev) => ({ ...prev, ...map }));
    toast({ title: "Подбор загружен" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function deleteHistory(id) {
    if (!confirm("Удалить этот подбор?")) return;
    const { error } = await supabase.from("complaint_repertorizations").delete().eq("id", id);
    if (error) {
      toast({ title: "Не удалось удалить", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено" });
    loadHistory();
  }
  async function runExtract() {
    if (!complaint.trim()) return null;
    setExtracting(true);
    setComputed(false);
    setStatements([]);
    setCandidates([]);
    try {
      const { data, error } = await supabase.functions.invoke("repertorize-from-complaint", {
        body: { mode: "extract", complaint }
      });
      if (error) throw error;
      const stmts = data.statements || [];
      const cands = data.candidates || [];
      setStatements(stmts);
      setCandidates(cands.map((c) => ({ ...c, selected: true })));
      return { stmts, cands };
    } catch (e) {
      toast({ title: "Ошибка извлечения", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
      return null;
    } finally {
      setExtracting(false);
    }
  }
  async function runAiSelect(initialCandidates) {
    const source = initialCandidates ?? candidates;
    if (source.length === 0) return null;
    setSelecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("repertorize-from-complaint", {
        body: {
          mode: "select",
          complaint,
          candidates: source.map((c) => ({ rubric_id: c.rubric_id, name: c.name, name_ru: c.name_ru }))
        }
      });
      if (error) throw error;
      const picks = data.selected || [];
      const picked = new Map(picks.map((p) => [p.rubric_id, p.reason]));
      setCandidates(
        (prev) => prev.map((c) => ({ ...c, selected: picked.has(c.rubric_id), reason: picked.get(c.rubric_id) || c.reason }))
      );
      return picks.map((p) => p.rubric_id);
    } catch (e) {
      toast({ title: "Ошибка выбора", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
      return null;
    } finally {
      setSelecting(false);
    }
  }
  async function runCompute(ids) {
    const useIds = ids && ids.length > 0 ? ids : Array.from(selectedIds);
    if (useIds.length === 0) return false;
    setComputing(true);
    try {
      const [linksRes, remediesRes] = await Promise.all([
        supabase.from("repertory_rubric_remedies").select("rubric_id,remedy_id,grade").in("rubric_id", useIds),
        supabase.from("repertory_remedies").select("id,name_latin,name_ru,abbrev")
      ]);
      if (linksRes.error) throw linksRes.error;
      if (remediesRes.error) throw remediesRes.error;
      setLinks(linksRes.data || []);
      setRemedies(remediesRes.data || []);
      setComputed(true);
      return true;
    } catch (e) {
      toast({ title: "Ошибка подсчёта", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
      return false;
    } finally {
      setComputing(false);
    }
  }
  async function runFullPipeline() {
    if (!complaint.trim()) return;
    setStage("extract");
    setStageMessage("Разбираем жалобы и ищем рубрики по смыслу…");
    const ex = await runExtract();
    if (!ex) {
      setStage("error");
      setStageMessage("Не удалось извлечь утверждения");
      return;
    }
    if (ex.cands.length === 0) {
      setStage("error");
      setStageMessage("Поиск рубрик не дал результатов. Проверьте, что эмбеддинги рубрик загружены.");
      return;
    }
    setStage("select");
    setStageMessage(`Найдено ${ex.cands.length} кандидатов из ${ex.stmts.length} утверждений. ИИ выбирает клинически уместные…`);
    const picked = await runAiSelect(ex.cands);
    if (!picked || picked.length === 0) {
      setStage("error");
      setStageMessage("ИИ не выбрал ни одной рубрики");
      return;
    }
    setStage("compute");
    setStageMessage(`ИИ выбрал ${picked.length} рубрик. Считаем ранжирование средств…`);
    const ok = await runCompute(picked);
    if (!ok) {
      setStage("error");
      setStageMessage("Ошибка подсчёта ранжирования");
      return;
    }
    setStage("done");
    setStageMessage(`Готово: ${picked.length} рубрик, ${ex.stmts.length} утверждений`);
    toast({ title: "Подбор завершён", description: `${picked.length} рубрик · ${ex.stmts.length} утверждений` });
  }
  useEffect(() => {
    if (!computed) {
      setMmSections({});
      return;
    }
    const top5 = ranking.slice(0, 5).map((r) => r.remedy.id);
    if (top5.length === 0) {
      setMmSections({});
      return;
    }
    let cancelled = false;
    (async () => {
      const fetchRows = async () => {
        const { data } = await supabase.from("materia_medica_sections").select("remedy_id, heading, body, body_ru, source_url").in("remedy_id", top5).eq("source", "boericke");
        const grouped = {};
        (data || []).forEach((row) => {
          var _a;
          (grouped[_a = row.remedy_id] || (grouped[_a] = [])).push({ heading: row.heading, body: row.body, body_ru: row.body_ru, source_url: row.source_url });
        });
        return { data: data || [], grouped };
      };
      const first = await fetchRows();
      if (cancelled) return;
      setMmSections(first.grouped);
      const needsTranslation = first.data.some((r) => !r.body_ru);
      if (needsTranslation) {
        try {
          await supabase.functions.invoke("translate-mm-sections", { body: { remedy_ids: top5 } });
          if (cancelled) return;
          const second = await fetchRows();
          if (!cancelled) setMmSections(second.grouped);
        } catch (e) {
          console.error("[mm-translate]", e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [computed, ranking]);
  function removeStatement(s) {
    setStatements((prev) => prev.filter((x) => x !== s));
    setCandidates((prev) => prev.map((c) => ({ ...c, matched_statements: c.matched_statements.filter((x) => x !== s) })));
  }
  function toggleCandidate(id) {
    setCandidates((prev) => prev.map((c) => c.rubric_id === id ? { ...c, selected: !c.selected } : c));
    setComputed(false);
  }
  function removeCandidate(id) {
    setCandidates((prev) => prev.filter((c) => c.rubric_id !== id));
  }
  if (loading || !user) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 max-w-[1400px]", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/admin/repertory", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      "Назад к реперторию"
    ] }),
    /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold mb-1 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "w-7 h-7 text-primary" }),
      " Поиск по жалобам"
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6", children: "Свободный текст → разбор на симптомы → семантический поиск рубрик → AI-выбор клинически уместных → ранжирование средств." }),
    /* @__PURE__ */ jsxs(Card, { className: "mb-4", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "1. Жалобы пациента" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(
          Textarea,
          {
            value: complaint,
            onChange: (e) => setComplaint(e.target.value),
            placeholder: "Опишите жалобы пациента свободным текстом — локализация, характер, модальности (что улучшает/ухудшает), время суток, психические особенности…",
            rows: 6,
            maxLength: 8e3
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { onClick: runFullPipeline, disabled: pipelineRunning || !complaint.trim(), className: "gap-2", children: [
            pipelineRunning ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
            "Подобрать препараты"
          ] }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => runExtract(), disabled: extracting || !complaint.trim(), className: "gap-2", children: [
            extracting ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Search, { className: "w-4 h-4" }),
            "Только найти кандидатов"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            complaint.length,
            " / 8000"
          ] })
        ] }),
        stage !== "idle" && /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2", children: [
          /* @__PURE__ */ jsx(Progress, { value: stageProgress[stage], className: stage === "error" ? "[&>div]:bg-destructive" : "" }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2 text-xs", children: [
            { key: "extract", label: "Поиск рубрик" },
            { key: "select", label: "ИИ-отбор" },
            { key: "compute", label: "Ранжирование" }
          ].map((s) => {
            const order = ["extract", "select", "compute", "done"];
            const idx = order.indexOf(s.key);
            const curIdx = order.indexOf(stage);
            const isDone = stage === "done" || curIdx > idx;
            const isCurrent = stage === s.key;
            return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              isCurrent ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin text-primary" }) : isDone ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5 text-primary" }) : /* @__PURE__ */ jsx(Circle, { className: "w-3.5 h-3.5 text-muted-foreground" }),
              /* @__PURE__ */ jsx("span", { className: isCurrent ? "font-medium" : isDone ? "" : "text-muted-foreground", children: s.label })
            ] }, s.key);
          }) }),
          stageMessage && /* @__PURE__ */ jsx("p", { className: `text-xs ${stage === "error" ? "text-destructive" : "text-muted-foreground"}`, children: stageMessage })
        ] })
      ] })
    ] }),
    statements.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "mb-4", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base", children: [
        "2. Извлечённые утверждения (",
        statements.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: statements.map((s) => /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1 cursor-pointer", onClick: () => removeStatement(s), children: [
        s,
        /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
      ] }, s)) }) })
    ] }),
    candidates.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "mb-4", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center justify-between flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "3. Рубрики-кандидаты (",
          candidates.length,
          ", отмечено ",
          selectedIds.size,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => runAiSelect(), disabled: selecting, className: "gap-2", children: [
            selecting ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
            "ИИ-подсказка выбора"
          ] }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => runCompute(), disabled: computing || selectedIds.size === 0, className: "gap-2", children: [
            computing ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Calculator, { className: "w-4 h-4" }),
            "Посчитать ранжирование"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(ScrollArea, { className: "max-h-[480px] pr-3", children: /* @__PURE__ */ jsx("div", { className: "space-y-1", children: candidates.map((c) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 px-2 py-2 rounded hover:bg-muted/50 group", children: [
        /* @__PURE__ */ jsx(Checkbox, { checked: c.selected, onCheckedChange: () => toggleCandidate(c.rubric_id), className: "mt-1" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: c.name_ru || c.name }),
          c.reason && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-0.5 italic", children: [
            "↳ ",
            c.reason
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1 mt-1", children: [
            /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] font-mono", children: [
              "sim ",
              (c.similarity * 100).toFixed(0),
              "%"
            ] }),
            c.matched_statements.slice(0, 3).map((s, i) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px] font-normal", children: s }, i)),
            c.matched_statements.length > 3 && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-[10px]", children: [
              "+",
              c.matched_statements.length - 3
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => removeCandidate(c.rubric_id), className: "opacity-0 group-hover:opacity-100", children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }) })
      ] }, c.rubric_id)) }) }) })
    ] }),
    computed && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "4. Топ-10 средств" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Сортировка: совпадения рубрик ↓, затем сумма грейдов ↓" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        ranking.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center text-muted-foreground py-8 text-sm", children: "Для выбранных рубрик нет связанных средств в реперторие." }) : /* @__PURE__ */ jsx("div", { className: "space-y-1", children: ranking.map((row, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground w-6 text-right", children: [
            i + 1,
            "."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium text-sm truncate", children: row.remedy.name_latin }),
            row.remedy.name_ru && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate", children: row.remedy.name_ru })
          ] }),
          /* @__PURE__ */ jsxs(Tooltip, { children: [
            /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 cursor-help", children: [
              /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "font-mono text-xs", children: [
                row.count,
                "/",
                selectedIds.size
              ] }),
              /* @__PURE__ */ jsxs(Badge, { className: "font-mono text-xs", children: [
                "Σ ",
                row.sum
              ] })
            ] }) }),
            /* @__PURE__ */ jsx(TooltipContent, { side: "left", className: "max-w-xs", children: /* @__PURE__ */ jsx("div", { className: "space-y-1", children: Array.from(row.perRubric.entries()).map(([rid, g]) => {
              const c = candidates.find((x) => x.rubric_id === rid);
              return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 text-xs", children: [
                /* @__PURE__ */ jsx("span", { className: "truncate", children: (c == null ? void 0 : c.name_ru) || (c == null ? void 0 : c.name) || "—" }),
                /* @__PURE__ */ jsxs("span", { className: "font-mono font-semibold", children: [
                  "grade ",
                  g
                ] })
              ] }, rid);
            }) }) })
          ] })
        ] }, row.remedy.id)) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-4 border-t", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium mb-3", children: [
            /* @__PURE__ */ jsx(Info, { className: "w-4 h-4 text-muted-foreground" }),
            "Сочетания и сравнения (Materia Medica Бёрике) — топ-5"
          ] }),
          (() => {
            const top5 = ranking.slice(0, 5);
            const anyData = top5.some((r) => (mmSections[r.remedy.id] || []).length > 0);
            if (!anyData) {
              return /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground bg-muted/40 rounded p-3", children: [
                "Для топ-5 средств не найдено разделов Materia Medica. Запустите импорт Бёрике на странице",
                " ",
                /* @__PURE__ */ jsx(Link, { to: "/admin/repertory", className: "underline", children: "репертория" }),
                "."
              ] });
            }
            return /* @__PURE__ */ jsx("div", { className: "space-y-3", children: top5.map((row) => {
              var _a;
              const sections = mmSections[row.remedy.id] || [];
              if (sections.length === 0) return null;
              return /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-muted/30 p-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between gap-2 mb-1.5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "font-medium text-sm", children: [
                    row.remedy.name_latin,
                    row.remedy.name_ru && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground font-normal", children: [
                      " · ",
                      row.remedy.name_ru
                    ] })
                  ] }),
                  ((_a = sections[0]) == null ? void 0 : _a.source_url) && /* @__PURE__ */ jsx("a", { href: sections[0].source_url, target: "_blank", rel: "noreferrer", className: "text-[11px] text-muted-foreground hover:text-foreground underline", children: "источник" })
                ] }),
                sections.map((s, i) => /* @__PURE__ */ jsxs("div", { className: "text-xs leading-relaxed", children: [
                  /* @__PURE__ */ jsxs("span", { className: "font-semibold text-foreground/80", children: [
                    s.heading,
                    ". "
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-foreground/90 whitespace-pre-wrap", children: s.body_ru || s.body }),
                  !s.body_ru && /* @__PURE__ */ jsx("span", { className: "ml-1 text-[10px] text-muted-foreground italic", children: "(перевод…)" })
                ] }, i))
              ] }, row.remedy.id);
            }) });
          })()
        ] })
      ] })
    ] }),
    computed && ranking.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "mt-4", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-primary" }),
          " 5. Назначение и сохранение"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Отметьте препараты для выписки, задайте потенцию, кратность и длительность. Затем сохраните подбор и/или отправьте в именной рецепт." })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Пациент" }),
            /* @__PURE__ */ jsx(PatientSelect, { selectedPatient: patient, onSelect: setPatient })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Название подбора (необязательно)" }),
            /* @__PURE__ */ jsx(Input, { value: repTitle, onChange: (e) => setRepTitle(e.target.value), placeholder: "напр. Зимний насморк, 30C", maxLength: 200 })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border rounded-md overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[28px_1fr_110px_180px_120px_70px] gap-2 px-3 py-2 bg-muted/40 text-[11px] font-medium text-muted-foreground uppercase tracking-wide", children: [
            /* @__PURE__ */ jsx("div", { children: "✓" }),
            /* @__PURE__ */ jsx("div", { children: "Препарат" }),
            /* @__PURE__ */ jsx("div", { children: "Потенция" }),
            /* @__PURE__ */ jsx("div", { children: "Кратность" }),
            /* @__PURE__ */ jsx("div", { children: "Длительность" }),
            /* @__PURE__ */ jsx("div", { className: "text-right", children: "Кол-во" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "divide-y", children: ranking.map((row) => {
            const p = prescribeMap[row.remedy.id] ?? DEFAULT_PRESCRIBE;
            return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[28px_1fr_110px_180px_120px_70px] gap-2 px-3 py-2 items-center hover:bg-muted/30", children: [
              /* @__PURE__ */ jsx(Checkbox, { checked: p.prescribe, onCheckedChange: (v) => updatePrescribe(row.remedy.id, { prescribe: !!v }) }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium truncate", children: row.remedy.name_latin }),
                row.remedy.name_ru && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate", children: row.remedy.name_ru })
              ] }),
              /* @__PURE__ */ jsxs(Select, { value: p.potency, onValueChange: (v) => updatePrescribe(row.remedy.id, { potency: v }), children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8 text-xs", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsx(SelectContent, { children: POTENCY_OPTIONS.map((opt) => /* @__PURE__ */ jsx(SelectItem, { value: opt, className: "text-xs", children: opt }, opt)) })
              ] }),
              /* @__PURE__ */ jsx(Input, { value: p.frequency, onChange: (e) => updatePrescribe(row.remedy.id, { frequency: e.target.value }), className: "h-8 text-xs", placeholder: "1 раз в день" }),
              /* @__PURE__ */ jsx(Input, { value: p.duration, onChange: (e) => updatePrescribe(row.remedy.id, { duration: e.target.value }), className: "h-8 text-xs", placeholder: "14 дней" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "number",
                  min: 1,
                  value: p.quantity,
                  onChange: (e) => updatePrescribe(row.remedy.id, { quantity: parseInt(e.target.value) || 1 }),
                  className: "h-8 text-xs text-right"
                }
              )
            ] }, row.remedy.id);
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 pt-1", children: [
          /* @__PURE__ */ jsxs(Button, { onClick: () => saveRepertorization(false), disabled: saving, variant: "outline", className: "gap-2", children: [
            saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
            savedId ? "Обновить подбор" : "Сохранить подбор"
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: sendToPrescription, disabled: selectedToPrescribe.length === 0, className: "gap-2", children: [
            /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
            "Отправить в рецепт (",
            selectedToPrescribe.length,
            ")"
          ] }),
          savedId && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-auto", children: "Сохранён" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "«Отправить в рецепт» откроет страницу ",
          /* @__PURE__ */ jsx(Link, { to: "/admin/prescriptions", className: "underline", children: "Рецепты" }),
          " в новой вкладке и автозаполнит форму 107-1/у выбранными препаратами в столбик."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "mt-4", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center justify-between gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(History, { className: "w-4 h-4 text-muted-foreground" }),
          " История подборов"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          historyFilterPatient ? /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1", children: [
            /* @__PURE__ */ jsx(User, { className: "w-3 h-3" }),
            " ",
            historyFilterPatient.full_name,
            /* @__PURE__ */ jsx("button", { onClick: () => setHistoryFilterPatient(null), className: "ml-1 hover:text-destructive", children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }) })
          ] }) : /* @__PURE__ */ jsx("div", { className: "w-64", children: /* @__PURE__ */ jsx(PatientSelect, { selectedPatient: null, onSelect: (p) => setHistoryFilterPatient(p) }) }),
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: loadHistory, disabled: historyLoading, children: historyLoading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : "Обновить" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: history.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground text-center py-6", children: "Пока нет сохранённых подборов" }) : /* @__PURE__ */ jsx("div", { className: "divide-y", children: history.map((h) => {
        const prescribed = (h.selected_remedies || []).filter((s) => s.prescribe);
        return /* @__PURE__ */ jsxs("div", { className: "py-2 flex items-start gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: h.title || h.complaint.slice(0, 80) + (h.complaint.length > 80 ? "…" : "") }),
              h.patient_name && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [
                /* @__PURE__ */ jsx(User, { className: "w-3 h-3 mr-1" }),
                h.patient_name
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: format(parseISO(h.created_at), "d MMM yyyy, HH:mm", { locale: ru }) })
            ] }),
            prescribed.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1 mt-1", children: [
              prescribed.slice(0, 6).map((s, i) => /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-[10px] font-normal", children: [
                s.name_latin,
                " ",
                s.potency
              ] }, i)),
              prescribed.length > 6 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [
                "+",
                prescribed.length - 6
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => loadFromHistory(h), children: "Открыть" }),
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => deleteHistory(h.id), className: "text-destructive hover:text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }) })
        ] }, h.id);
      }) }) })
    ] })
  ] }) }) });
}
export {
  AdminRepertoryByComplaint as default
};
