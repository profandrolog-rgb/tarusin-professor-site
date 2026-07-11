import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { u as useAuth, s as supabase, B as Button, b as Badge, C as Card, T as Textarea } from "../main.mjs";
import { S as ScrollArea } from "./scroll-area-DtgkI4MV.js";
import { A as Accordion, a as AccordionItem, b as AccordionTrigger, c as AccordionContent } from "./accordion-CN1jpepQ.js";
import { Loader2, ArrowLeft, Bot, Sparkles, Send, AlertTriangle, CheckCircle2, XCircle, History, Search, FlaskConical, BookOpen, Pill, User, FileText } from "lucide-react";
import { toast } from "sonner";
import { C as ChatMarkdown } from "./ChatMarkdown-B1_X8k9E.js";
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
import "@radix-ui/react-accordion";
import "react-markdown";
import "remark-gfm";
import "rehype-raw";
import "rehype-sanitize";
const AGENT_URL = `${"https://bpbwkizvvythqotcyfii.supabase.co"}/functions/v1/ai-agent`;
const TOOL_ICONS = {
  perplexity_search: Search,
  pubmed_search: FlaskConical,
  repertory_lookup: BookOpen,
  materia_medica: BookOpen,
  treatment_catalog_search: Pill,
  patient_lookup: User,
  patient_protocols: FileText,
  draft_assignment: AlertTriangle,
  draft_prescription: AlertTriangle
};
const TOOL_LABELS = {
  perplexity_search: "Поиск в интернете",
  pubmed_search: "PubMed",
  repertory_lookup: "Реперториум Кента",
  materia_medica: "Materia Medica",
  treatment_catalog_search: "Каталог препаратов",
  patient_lookup: "Поиск пациента",
  patient_protocols: "Протоколы пациента",
  draft_assignment: "Черновик назначения",
  draft_prescription: "Черновик рецепта"
};
function CabinetAgent() {
  const { user, isAdmin, loading } = useAuth();
  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState([]);
  const [runId, setRunId] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [history, setHistory] = useState([]);
  const scrollRef = useRef(null);
  const abortRef = useRef(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("agent_runs").select("id, task, status, created_at, final_answer").order("created_at", { ascending: false }).limit(20).then(({ data }) => setHistory(data ?? []));
  }, [user, running]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);
  if (loading) return /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: /* @__PURE__ */ jsx(Loader2, { className: "animate-spin inline" }) });
  if (!user || !isAdmin) return /* @__PURE__ */ jsx(Navigate, { to: "/auth", replace: true });
  const startRun = async (resumeRunId, approval) => {
    var _a, _b;
    if (!resumeRunId && !task.trim()) return;
    setRunning(true);
    if (!resumeRunId) {
      setEvents([]);
      setRunId(null);
    }
    setPendingApproval(null);
    const { data: { session } } = await supabase.auth.getSession();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const resp = await fetch(AGENT_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session == null ? void 0 : session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(resumeRunId ? { runId: resumeRunId, approval } : { task }),
        signal: ac.signal
      });
      if (!resp.body) throw new Error("Нет потока");
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const lines = chunk.split("\n");
          const ev = (_a = lines.find((l) => l.startsWith("event: "))) == null ? void 0 : _a.slice(7);
          const dt = (_b = lines.find((l) => l.startsWith("data: "))) == null ? void 0 : _b.slice(6);
          if (!ev || !dt) continue;
          const data = JSON.parse(dt);
          if (ev === "run_started") setRunId(data.runId);
          else if (ev === "awaiting_approval") setPendingApproval({ tool_call_id: data.tool_call_id, name: data.name, args: data.args });
          else setEvents((prev) => [...prev, { type: ev, ...data }]);
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };
  const handleApproval = async (approved) => {
    if (!pendingApproval || !runId) return;
    setEvents((prev) => [...prev, { type: "tool_result", id: pendingApproval.tool_call_id, name: pendingApproval.name, result: { status: approved ? "approved" : "rejected" } }]);
    setPendingApproval(null);
    await startRun(runId, { approved });
  };
  const stop = () => {
    var _a;
    (_a = abortRef.current) == null ? void 0 : _a.abort();
    setRunning(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-6xl mx-auto py-6 px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
      /* @__PURE__ */ jsx(Link, { to: "/cabinet", children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-1" }),
        " Кабинет"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Bot, { className: "w-6 h-6 text-primary" }),
          "Агентный режим",
          /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3 mr-1" }),
            "GPT-5.4"
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Автономный ИИ — сам ищет, читает, считает, готовит назначения. Подтверждение врача обязательно перед записью в карту." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
          /* @__PURE__ */ jsx(
            Textarea,
            {
              placeholder: "Опишите задачу. Пример: «Разбери случай пациента Иванов И.И.: ХП + ДГПЖ 42 мл, ПСА 6.1. Найди исследования по фитотерапии 2024-2025, подбери средства из каталога, подготовь назначения и рецепты.»",
              value: task,
              onChange: (e) => setTask(e.target.value),
              disabled: running,
              rows: 4,
              className: "mb-3"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(Button, { onClick: () => startRun(), disabled: running || !task.trim(), className: "flex-1", children: running ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
              "Агент работает…"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 mr-2" }),
              "Запустить агента"
            ] }) }),
            running && /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: stop, children: "Остановить" })
          ] })
        ] }),
        events.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "p-4", children: [
          /* @__PURE__ */ jsxs("h2", { className: "font-semibold mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Bot, { className: "w-4 h-4" }),
            "Ход рассуждений"
          ] }),
          /* @__PURE__ */ jsx(ScrollArea, { className: "max-h-[500px]", ref: scrollRef, children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            events.map((ev, i) => /* @__PURE__ */ jsx(EventCard, { ev }, i)),
            running && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground p-2", children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }),
              " думаю…"
            ] })
          ] }) })
        ] }),
        pendingApproval && /* @__PURE__ */ jsx(Card, { className: "p-4 border-orange-500 bg-orange-50 dark:bg-orange-950/30", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-orange-600 mt-1 shrink-0" }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-1", children: "Требуется ваше подтверждение" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm mb-2", children: [
              "Агент хочет выполнить: ",
              /* @__PURE__ */ jsx("strong", { children: TOOL_LABELS[pendingApproval.name] })
            ] }),
            /* @__PURE__ */ jsx("pre", { className: "text-xs bg-background p-2 rounded overflow-auto max-h-60", children: JSON.stringify(pendingApproval.args, null, 2) }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-3", children: [
              /* @__PURE__ */ jsxs(Button, { onClick: () => handleApproval(true), className: "bg-green-600 hover:bg-green-700", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 mr-1" }),
                "Подтвердить"
              ] }),
              /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => handleApproval(false), children: [
                /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 mr-1" }),
                "Отклонить"
              ] })
            ] })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "p-3 h-fit", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-semibold mb-2 flex items-center gap-1 text-sm", children: [
          /* @__PURE__ */ jsx(History, { className: "w-4 h-4" }),
          "История"
        ] }),
        /* @__PURE__ */ jsx(ScrollArea, { className: "max-h-[600px]", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          history.map((h) => /* @__PURE__ */ jsxs(
            "button",
            {
              className: "w-full text-left p-2 rounded hover:bg-muted text-xs",
              onClick: () => {
                setTask(h.task);
                toast.info("Задача загружена — нажмите «Запустить»");
              },
              children: [
                /* @__PURE__ */ jsx("div", { className: "line-clamp-2", children: h.task }),
                /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground mt-0.5 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Badge, { variant: h.status === "completed" ? "default" : h.status === "awaiting_approval" ? "secondary" : "outline", className: "text-[10px] py-0", children: h.status }),
                  new Date(h.created_at).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })
                ] })
              ]
            },
            h.id
          )),
          !history.length && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground p-2", children: "Пока пусто" })
        ] }) })
      ] })
    ] })
  ] });
}
function EventCard({ ev }) {
  if (ev.type === "step") return null;
  if (ev.type === "final") {
    return /* @__PURE__ */ jsxs("div", { className: "border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 p-3 rounded", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2 text-sm font-semibold text-green-700 dark:text-green-400", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4" }),
        "Итоговый ответ"
      ] }),
      /* @__PURE__ */ jsx(ChatMarkdown, { children: ev.content })
    ] });
  }
  if (ev.type === "error") {
    return /* @__PURE__ */ jsxs("div", { className: "border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded text-sm text-red-700", children: [
      /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 inline mr-1" }),
      ev.message
    ] });
  }
  if (ev.type === "tool_call") {
    const Icon = TOOL_ICONS[ev.name] ?? Search;
    return /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, children: /* @__PURE__ */ jsxs(AccordionItem, { value: "x", className: "border rounded", children: [
      /* @__PURE__ */ jsx(AccordionTrigger, { className: "px-3 py-2 text-sm hover:no-underline", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }),
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: TOOL_LABELS[ev.name] ?? ev.name })
      ] }) }),
      /* @__PURE__ */ jsx(AccordionContent, { className: "px-3 pb-2", children: /* @__PURE__ */ jsx("pre", { className: "text-xs bg-muted p-2 rounded overflow-auto", children: JSON.stringify(ev.args, null, 2) }) })
    ] }) });
  }
  if (ev.type === "tool_result") {
    return /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, children: /* @__PURE__ */ jsxs(AccordionItem, { value: "x", className: "border rounded border-blue-200", children: [
      /* @__PURE__ */ jsxs(AccordionTrigger, { className: "px-3 py-2 text-xs text-muted-foreground hover:no-underline", children: [
        "✓ Результат: ",
        TOOL_LABELS[ev.name] ?? ev.name
      ] }),
      /* @__PURE__ */ jsx(AccordionContent, { className: "px-3 pb-2", children: /* @__PURE__ */ jsx("pre", { className: "text-xs bg-muted p-2 rounded overflow-auto max-h-80", children: JSON.stringify(ev.result, null, 2) }) })
    ] }) });
  }
  return null;
}
export {
  CabinetAgent as default
};
