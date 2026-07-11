import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { s as supabase, C as Card, c as CardHeader, d as CardTitle, B as Button, a as CardContent, u as useAuth, J as TooltipProvider, K as Tooltip, M as TooltipTrigger, N as TooltipContent, r as Checkbox, b as Badge } from "../main.mjs";
import { Helmet } from "react-helmet-async";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-0irROHuF.js";
import { Notebook, Loader2, Plus, ExternalLink, ArrowLeft, Activity, GitCompare, FileText, Printer, BookMarked } from "lucide-react";
import { parseISO, differenceInDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
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
function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "note";
}
function PatientVaultNotes({ patientId, patientName }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("vault_note_patients").select("note_id, note:vault_notes(id, title, folder_path, updated_at)").eq("patient_id", patientId);
      setRows((data ?? []).filter((r) => r.note));
      setLoading(false);
    })();
  }, [patientId]);
  async function createNote() {
    setCreating(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      toast.error("Нужна авторизация");
      setCreating(false);
      return;
    }
    const title = `Заметка по ${patientName}`;
    const { data: note, error } = await supabase.from("vault_notes").insert({
      owner_id: u.user.id,
      title,
      slug: slugify(title) + "-" + Date.now().toString(36),
      folder_path: "/Пациенты",
      content_md: `# ${title}

`,
      tags: [],
      patient_id: patientId
    }).select("id").single();
    if (error || !note) {
      toast.error((error == null ? void 0 : error.message) ?? "Ошибка");
      setCreating(false);
      return;
    }
    await supabase.from("vault_note_patients").insert({ note_id: note.id, patient_id: patientId });
    navigate(`/cabinet/vault?note=${note.id}`);
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-3", children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Notebook, { className: "w-4 h-4" }),
        "Заметки Vault (",
        rows.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: createNote, disabled: creating, className: "gap-1", children: [
        creating ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" }),
        "Создать заметку"
      ] })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin mx-auto" }) : rows.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground italic", children: "Заметок пока нет" }) : /* @__PURE__ */ jsx("div", { className: "space-y-1", children: rows.map((r) => r.note && /* @__PURE__ */ jsxs(
      Link,
      {
        to: `/cabinet/vault?note=${r.note_id}`,
        className: "flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm",
        children: [
          /* @__PURE__ */ jsxs("span", { className: "flex-1 truncate", children: [
            "📓 ",
            r.note.title
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: r.note.folder_path }),
          /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3 opacity-50" })
        ]
      },
      r.note_id
    )) }) })
  ] });
}
const STATUS_LABEL = { draft: "черновик", issued: "выписан", archived: "архив" };
const STATUS_VAR = { issued: "default", archived: "secondary", draft: "outline" };
function AdminPatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [patient, setPatient] = useState(null);
  const [plans, setPlans] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [selected, setSelected] = useState([]);
  const [reps, setReps] = useState([]);
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);
  useEffect(() => {
    if (!id) return;
    (async () => {
      setBusy(true);
      const [{ data: p }, { data: pl }, { data: itemsAgg }] = await Promise.all([
        supabase.from("patients").select("id, full_name, birth_date, phone, history_number").eq("id", id).maybeSingle(),
        supabase.from("treatment_plans").select("id, course_number, issued_at, duration_days, status, mode, diagnosis_short, based_on_template, total_cost_estimate, template:protocol_templates(name), items:treatment_plan_items(count)").eq("patient_id", id).order("course_number", { ascending: true }),
        supabase.from("treatment_plan_items").select("name_snapshot, section_category, plan:treatment_plans!inner(patient_id)").eq("plan.patient_id", id)
      ]);
      setPatient(p);
      setPlans((pl || []).map((r) => {
        var _a, _b;
        return { ...r, items_count: ((_b = (_a = r.items) == null ? void 0 : _a[0]) == null ? void 0 : _b.count) ?? 0 };
      }));
      const map = /* @__PURE__ */ new Map();
      for (const it of itemsAgg || []) {
        const name = it.name_snapshot || "—";
        const key = `${name}|${it.section_category}`;
        const e = map.get(key);
        if (e) e.count++;
        else map.set(key, { name, section: it.section_category, count: 1 });
      }
      setTopItems([...map.values()].sort((a, b) => b.count - a.count).slice(0, 5));
      const { data: repsData } = await supabase.from("complaint_repertorizations").select("id, title, complaint, created_at, selected_remedies").eq("patient_id", id).order("created_at", { ascending: false }).limit(10);
      setReps((repsData || []).map((r) => ({
        ...r,
        selected_remedies: Array.isArray(r.selected_remedies) ? r.selected_remedies : []
      })));
      setBusy(false);
    })();
  }, [id]);
  const stats = useMemo(() => {
    const issued = plans.filter((p) => p.status === "issued");
    const totalCost = issued.reduce((s, p) => s + Number(p.total_cost_estimate || 0), 0);
    let avgInterval = null;
    if (issued.length >= 2) {
      const dates = issued.map((p) => parseISO(p.issued_at)).sort((a, b) => a.getTime() - b.getTime());
      let sum = 0;
      for (let i = 1; i < dates.length; i++) sum += differenceInDays(dates[i], dates[i - 1]);
      avgInterval = Math.round(sum / (dates.length - 1));
    }
    return { total: plans.length, totalCost, avgInterval, issuedCount: issued.length };
  }, [plans]);
  const toggleSel = (planId, checked) => {
    setSelected((prev) => {
      if (checked) return prev.length >= 2 ? [prev[1], planId] : [...prev, planId];
      return prev.filter((x) => x !== planId);
    });
  };
  const handleCompare = () => {
    if (selected.length !== 2) {
      toast.info("Выберите ровно 2 курса для сравнения");
      return;
    }
    navigate(`/admin/treatment-plans/compare?a=${selected[0]}&b=${selected[1]}`);
  };
  if (loading || busy) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (!patient) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center text-muted-foreground", children: "Пациент не найден" });
  }
  const issuedPlans = plans.filter((p) => p.status !== "draft" || true);
  const allDates = issuedPlans.map((p) => parseISO(p.issued_at).getTime());
  const minD = Math.min(...allDates);
  const maxD = Math.max(...allDates);
  const span = Math.max(1, maxD - minD);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxs(Helmet, { children: [
      /* @__PURE__ */ jsx("title", { children: `Назначения — ${patient.full_name}` }),
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/admin/treatment-plans", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        "К листам назначений"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold mb-1", children: [
            "📋 Курсы лечения: ",
            patient.full_name
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-sm", children: [
            "ДР: ",
            patient.birth_date ? format(parseISO(patient.birth_date), "d MMMM yyyy", { locale: ru }) : "—",
            " · ",
            "Телефон: ",
            patient.phone || "—",
            " · ",
            "№ ИБ: ",
            patient.history_number || "—"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx(Link, { to: `/admin/patients/${patient.id}/metabolic-map`, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4" }),
            "Метаболическая карта"
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: `/admin/patients/${patient.id}/edit`, children: /* @__PURE__ */ jsx(Button, { variant: "outline", className: "gap-2", children: "Редактировать" }) }),
          /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-plans/new?patientId=${patient.id}`, children: /* @__PURE__ */ jsxs(Button, { className: "gap-2", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            "Новый лист назначений"
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Всего курсов" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: stats.total })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Выписано" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: stats.issuedCount })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Сумма выписанных, ₽" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: stats.totalCost ? Math.round(stats.totalCost).toLocaleString("ru-RU") : "—" })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Ср. интервал, дн" }),
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: stats.avgInterval ?? "—" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx(PatientVaultNotes, { patientId: patient.id, patientName: patient.full_name }),
      plans.length > 0 && /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Хронология курсов" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "relative h-16 mx-4", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-0 right-0 h-0.5 bg-border" }),
          /* @__PURE__ */ jsx(TooltipProvider, { children: plans.map((p) => {
            const t = parseISO(p.issued_at).getTime();
            const left = plans.length === 1 ? 50 : (t - minD) / span * 100;
            const color = p.status === "issued" ? "bg-primary" : p.status === "archived" ? "bg-muted-foreground" : "bg-orange-400";
            return /* @__PURE__ */ jsxs(Tooltip, { children: [
              /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
                Link,
                {
                  to: `/admin/treatment-plans/${p.id}`,
                  className: `absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full ring-2 ring-background ${color} hover:scale-125 transition-transform`,
                  style: { left: `${left}%` }
                }
              ) }),
              /* @__PURE__ */ jsx(TooltipContent, { children: /* @__PURE__ */ jsxs("div", { className: "text-xs space-y-0.5", children: [
                /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                  "№",
                  p.course_number ?? "?",
                  " · ",
                  format(parseISO(p.issued_at), "d MMM yyyy", { locale: ru })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  "Длительность: ",
                  p.duration_days,
                  " дн."
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  "Статус: ",
                  STATUS_LABEL[p.status]
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  "Стоимость: ",
                  p.total_cost_estimate ? `${Math.round(Number(p.total_cost_estimate)).toLocaleString("ru-RU")} ₽` : "—"
                ] })
              ] }) })
            ] }, p.id);
          }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-base", children: [
            "Все курсы (",
            plans.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: handleCompare, disabled: selected.length !== 2, className: "gap-2", children: [
            /* @__PURE__ */ jsx(GitCompare, { className: "w-4 h-4" }),
            "Сравнить выбранные (",
            selected.length,
            "/2)"
          ] })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: plans.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center text-muted-foreground py-8", children: "Курсов ещё нет" }) : /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { className: "w-10" }),
            /* @__PURE__ */ jsx(TableHead, { className: "w-14", children: "№" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Дата" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Длит., дн" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Статус" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Шаблон" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Позиций" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Стоимость, ₽" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Действия" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: plans.map((p) => {
            var _a;
            return /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Checkbox, { checked: selected.includes(p.id), onCheckedChange: (v) => toggleSel(p.id, !!v) }) }),
              /* @__PURE__ */ jsx(TableCell, { className: "font-mono", children: p.course_number ?? "—" }),
              /* @__PURE__ */ jsx(TableCell, { children: format(parseISO(p.issued_at), "d MMM yyyy", { locale: ru }) }),
              /* @__PURE__ */ jsx(TableCell, { children: p.duration_days }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: STATUS_VAR[p.status], children: STATUS_LABEL[p.status] }) }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: ((_a = p.template) == null ? void 0 : _a.name) ?? "—" }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: p.items_count }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: p.total_cost_estimate ? Math.round(Number(p.total_cost_estimate)).toLocaleString("ru-RU") : "—" }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-1 justify-end", children: [
                /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-plans/${p.id}`, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", title: "Открыть", children: /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5" }) }) }),
                /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-plans/${p.id}/print`, target: "_blank", children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", title: "Печать", children: /* @__PURE__ */ jsx(Printer, { className: "w-3.5 h-3.5" }) }) }),
                /* @__PURE__ */ jsx(Link, { to: `/admin/treatment-plans/${p.id}/memo`, target: "_blank", children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", title: "Памятка", children: /* @__PURE__ */ jsx(BookMarked, { className: "w-3.5 h-3.5" }) }) })
              ] }) })
            ] }, p.id);
          }) })
        ] }) })
      ] }),
      topItems.length > 0 && /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "ТОП-5 назначаемых позиций этому пациенту" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { className: "w-10", children: "#" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Название" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Секция" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Раз" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: topItems.map((it, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { children: i + 1 }),
            /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: it.name }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: it.section }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: it.count })
          ] }, i)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "text-base", children: [
            "Гомеопатические подборы (",
            reps.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx(Link, { to: "/admin/repertory/by-complaint", children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "gap-2", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5" }),
            "Новый подбор"
          ] }) })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: reps.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground text-center py-6", children: "Подборов по жалобам ещё нет" }) : /* @__PURE__ */ jsx("div", { className: "divide-y", children: reps.map((r) => {
          const prescribed = r.selected_remedies.filter((s) => s.prescribe);
          return /* @__PURE__ */ jsxs("div", { className: "py-2 flex items-start gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: r.title || r.complaint.slice(0, 90) + (r.complaint.length > 90 ? "…" : "") }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: format(parseISO(r.created_at), "d MMM yyyy", { locale: ru }) })
              ] }),
              prescribed.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1 mt-1", children: [
                prescribed.slice(0, 8).map((s, i) => /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-[10px] font-normal", children: [
                  s.name_latin,
                  " ",
                  s.potency
                ] }, i)),
                prescribed.length > 8 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [
                  "+",
                  prescribed.length - 8
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Link, { to: "/admin/repertory/by-complaint", children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", children: "Открыть" }) })
          ] }, r.id);
        }) }) })
      ] })
    ] })
  ] });
}
export {
  AdminPatientDetail as default
};
