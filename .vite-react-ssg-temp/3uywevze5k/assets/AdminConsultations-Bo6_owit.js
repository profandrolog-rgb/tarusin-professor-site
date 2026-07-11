import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { u as useAuth, e as useToast, s as supabase, C as Card, a as CardContent, b as Badge, B as Button, c as CardHeader, d as CardTitle, L as Label, T as Textarea } from "../main.mjs";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, CheckCircle2, FileText, Download, Brain, Eye } from "lucide-react";
import { s as setActiveContext, c as clearActiveContextIfMatches } from "./protocolBridge-4TuhSmsW.js";
import { u as useProtocolFragmentReceiver } from "./useProtocolFragmentReceiver-B3USCy2g.js";
import { P as PdfBatchUpload } from "./PdfBatchUpload-9wDw5BUe.js";
import "vite-react-ssg";
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
import "./progress-Y5q1JT93.js";
import "@radix-ui/react-progress";
const statusLabels = {
  draft: { label: "Черновик", color: "bg-muted text-muted-foreground" },
  submitted: { label: "Новая", color: "bg-yellow-500/10 text-yellow-700" },
  paid: { label: "Оплачена", color: "bg-blue-500/10 text-blue-700" },
  in_review: { label: "На рассмотрении", color: "bg-purple-500/10 text-purple-700" },
  completed: { label: "Завершена", color: "bg-green-500/10 text-green-700" },
  acknowledged: { label: "Ознакомлен", color: "bg-green-600/10 text-green-800" },
  closed: { label: "Закрыта", color: "bg-muted text-muted-foreground" }
};
const AdminConsultations = () => {
  var _a, _b;
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["admin-consultations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("consultation_cases").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });
  const selectedCase = cases.find((c) => c.id === selectedId);
  useProtocolFragmentReceiver({ kind: "consultation" });
  useEffect(() => {
    if (!selectedCase) return;
    const name = selectedCase.patient_name || selectedCase.full_name || "Консультация";
    setActiveContext({
      patientId: selectedCase.patient_id,
      patientName: name,
      targetId: selectedCase.id,
      kind: "consultation",
      url: window.location.pathname + window.location.search
    });
    return () => clearActiveContextIfMatches(selectedCase.id);
  }, [selectedCase == null ? void 0 : selectedCase.id]);
  const { data: rounds = [] } = useQuery({
    queryKey: ["admin-rounds", selectedId],
    queryFn: async () => {
      if (!selectedId) return [];
      const { data, error } = await supabase.from("consultation_rounds").select("*").eq("case_id", selectedId).order("round_number");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedId
  });
  const { data: allDocs = [] } = useQuery({
    queryKey: ["admin-docs", selectedId],
    queryFn: async () => {
      const roundIds = rounds.map((r) => r.id);
      if (!roundIds.length) return [];
      const { data, error } = await supabase.from("consultation_documents").select("*").in("round_id", roundIds);
      if (error) throw error;
      return data;
    },
    enabled: rounds.length > 0
  });
  const getDocUrl = async (path) => {
    const { data } = await supabase.storage.from("patient-documents").createSignedUrl(path, 3600);
    return data == null ? void 0 : data.signedUrl;
  };
  const runAiAnalysis = async (roundId) => {
    setAiLoading(true);
    try {
      const round = rounds.find((r) => r.id === roundId);
      if (!round) return;
      const { data, error } = await supabase.functions.invoke("analyze-consultation", {
        body: {
          complaints: round.complaints,
          medical_history: round.medical_history,
          patient_name: selectedCase == null ? void 0 : selectedCase.patient_full_name
        }
      });
      if (error) throw error;
      await supabase.from("consultation_rounds").update({
        ai_assessment: data.assessment,
        ai_assessment_date: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", roundId);
      qc.invalidateQueries({ queryKey: ["admin-rounds"] });
      toast({ title: "ИИ-анализ завершён" });
    } catch (err) {
      toast({ title: "Ошибка ИИ", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };
  const updateRound = async (roundId, fields) => {
    await supabase.from("consultation_rounds").update(fields).eq("id", roundId);
    qc.invalidateQueries({ queryKey: ["admin-rounds"] });
  };
  const updateCaseStatus = async (status) => {
    var _a2;
    if (!selectedId) return;
    await supabase.from("consultation_cases").update({ status }).eq("id", selectedId);
    qc.invalidateQueries({ queryKey: ["admin-consultations"] });
    toast({ title: `Статус: ${((_a2 = statusLabels[status]) == null ? void 0 : _a2.label) || status}` });
  };
  if (loading) return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin" }) });
  if (!isAdmin) return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center text-destructive", children: "Доступ запрещён" });
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-6", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-2", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        "К панели управления"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Онлайн-консультации" })
    ] }) }),
    /* @__PURE__ */ jsx("main", { className: "container mx-auto px-4 py-8", children: !selectedId ? (
      /* Case list */
      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: isLoading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin" }) }) : cases.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center py-12", children: "Нет консультаций" }) : cases.map((c) => {
        const s = statusLabels[c.status] || statusLabels.submitted;
        return /* @__PURE__ */ jsx(Card, { className: "cursor-pointer hover:border-primary", onClick: () => setSelectedId(c.id), children: /* @__PURE__ */ jsxs(CardContent, { className: "py-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium", children: c.patient_full_name || "Без имени" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
              c.parent_name && `Родитель: ${c.parent_name} · `,
              new Date(c.created_at).toLocaleDateString("ru-RU"),
              c.patient_next_step && ` · Выбор: ${c.patient_next_step === "appointment" ? "Очный приём" : "Планирование"}`
            ] })
          ] }),
          /* @__PURE__ */ jsx(Badge, { className: s.color, children: s.label })
        ] }) }, c.id);
      }) })
    ) : (
      /* Case detail */
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", onClick: () => setSelectedId(null), children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
          "Назад к списку"
        ] }),
        selectedCase && /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { children: [
            "Пациент: ",
            selectedCase.patient_full_name
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "grid sm:grid-cols-2 gap-3 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Родитель:" }),
              " ",
              selectedCase.parent_name || "—"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Телефон:" }),
              " ",
              selectedCase.parent_phone || "—"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "WhatsApp род.:" }),
              " ",
              selectedCase.parent_whatsapp || "—"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Telegram род.:" }),
              " ",
              selectedCase.parent_telegram || "—"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "WhatsApp пац.:" }),
              " ",
              selectedCase.patient_whatsapp || "—"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Telegram пац.:" }),
              " ",
              selectedCase.patient_telegram || "—"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "ОМС:" }),
              " ",
              selectedCase.has_insurance ? "Да" : "Нет"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Статус:" }),
              " ",
              /* @__PURE__ */ jsx(Badge, { className: (_a = statusLabels[selectedCase.status]) == null ? void 0 : _a.color, children: (_b = statusLabels[selectedCase.status]) == null ? void 0 : _b.label })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => updateCaseStatus("in_review"), children: "На рассмотрение" }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => updateCaseStatus("completed"), className: "text-green-700", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 mr-1" }),
            "Завершить"
          ] }),
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => updateCaseStatus("closed"), children: "Закрыть" })
        ] }),
        rounds.map((round) => {
          const docs = allDocs.filter((d) => d.round_id === round.id);
          return /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm", children: round.round_number }),
              "Обращение ",
              round.round_number,
              /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground font-normal ml-auto", children: new Date(round.created_at).toLocaleDateString("ru-RU") })
            ] }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
              round.complaints && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Label, { className: "text-muted-foreground", children: "Жалобы" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm whitespace-pre-wrap", children: round.complaints })
              ] }),
              round.medical_history && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Label, { className: "text-muted-foreground", children: "Анамнез" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm whitespace-pre-wrap", children: round.medical_history })
              ] }),
              docs.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Label, { className: "text-muted-foreground", children: "Документы" }),
                /* @__PURE__ */ jsx("div", { className: "space-y-1 mt-1", children: docs.map((d) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2 bg-muted rounded", children: [
                  /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-primary shrink-0" }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm truncate flex-1", children: d.file_name }),
                  /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: async () => {
                    const url = await getDocUrl(d.file_path);
                    if (url) window.open(url, "_blank");
                  }, children: /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }) })
                ] }, d.id)) })
              ] }),
              /* @__PURE__ */ jsx(PdfBatchUpload, { consultationCaseId: selectedCase.id }),
              /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-4 space-y-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs(Label, { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(Brain, { className: "w-4 h-4" }),
                    "Оценка ИИ"
                  ] }),
                  /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => runAiAnalysis(round.id), disabled: aiLoading, children: [
                    aiLoading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin mr-1" }) : /* @__PURE__ */ jsx(Brain, { className: "w-4 h-4 mr-1" }),
                    "Запустить ИИ"
                  ] })
                ] }),
                round.ai_assessment ? /* @__PURE__ */ jsxs("div", { className: "bg-primary/5 p-3 rounded text-sm whitespace-pre-wrap", children: [
                  round.ai_assessment_date && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-1", children: new Date(round.ai_assessment_date).toLocaleString("ru-RU") }),
                  round.ai_assessment
                ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground italic", children: "Ещё не проводился" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Заключение врача" }),
                /* @__PURE__ */ jsx(
                  Textarea,
                  {
                    defaultValue: round.doctor_conclusion || "",
                    rows: 4,
                    onBlur: (e) => {
                      if (e.target.value !== (round.doctor_conclusion || "")) {
                        updateRound(round.id, {
                          doctor_conclusion: e.target.value,
                          doctor_conclusion_date: (/* @__PURE__ */ new Date()).toISOString()
                        });
                      }
                    },
                    placeholder: "Введите заключение..."
                  }
                )
              ] }),
              !round.is_complete && /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => updateRound(round.id, { is_complete: true }),
                  children: [
                    /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4 mr-1" }),
                    "Показать пациенту (завершить раунд)"
                  ]
                }
              ),
              round.is_complete && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "bg-green-100 text-green-800", children: "✓ Виден пациенту" })
            ] })
          ] }, round.id);
        })
      ] })
    ) })
  ] });
};
export {
  AdminConsultations as default
};
