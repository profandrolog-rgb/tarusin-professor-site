import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, e as useToast, s as supabase, b as Badge, B as Button, C as Card, c as CardHeader, d as CardTitle, a as CardContent, T as Textarea } from "../main.mjs";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Clock, CheckCircle, Send, EyeOff, Eye, Trash2, MessageCircle } from "lucide-react";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-B9yOFgqE.js";
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
import "@radix-ui/react-alert-dialog";
const AdminQuestions = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [answerDrafts, setAnswerDrafts] = useState({});
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["admin-questions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin
  });
  const answerMutation = useMutation({
    mutationFn: async ({ id, answer }) => {
      const { error } = await supabase.from("questions").update({
        answer_text: answer,
        status: "answered",
        answered_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: "Ответ сохранён" });
    }
  });
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }) => {
      const { error } = await supabase.from("questions").update({ is_published: published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: "Статус обновлён" });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: "Вопрос удалён" });
    }
  });
  const filtered = questions.filter((q) => {
    if (filter === "pending") return q.status === "pending";
    if (filter === "answered") return q.status === "answered";
    return true;
  });
  const pendingCount = questions.filter((q) => q.status === "pending").length;
  if (loading || isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (!user || !isAdmin) return null;
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      "Панель управления"
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-8", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground mb-2", children: "Вопросы пациентов" }),
      pendingCount > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "destructive", children: [
        pendingCount,
        " без ответа"
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-2 mb-6", children: [
      ["all", "Все", questions.length],
      ["pending", "Без ответа", pendingCount],
      ["answered", "С ответом", questions.length - pendingCount]
    ].map(([key, label, count]) => /* @__PURE__ */ jsxs(
      Button,
      {
        variant: filter === key ? "default" : "outline",
        size: "sm",
        onClick: () => setFilter(key),
        children: [
          label,
          " (",
          count,
          ")"
        ]
      },
      key
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      filtered.map((q) => /* @__PURE__ */ jsxs(Card, { className: q.status === "pending" ? "border-accent/50" : "", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: q.question_text }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
              q.author_name,
              " • ",
              q.author_email,
              " • ",
              new Date(q.created_at).toLocaleDateString("ru-RU")
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            q.status === "pending" ? /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-orange-600 border-orange-300", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 mr-1" }),
              " Ожидает"
            ] }) : /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-green-600 border-green-300", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
              " Отвечен"
            ] }),
            q.is_published && /* @__PURE__ */ jsx(Badge, { className: "bg-primary/10 text-primary", children: "Опубликован" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
          q.status === "answered" && q.answer_text ? /* @__PURE__ */ jsxs("div", { className: "pl-4 border-l-2 border-primary/30 bg-secondary/30 rounded-r-lg p-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground whitespace-pre-line", children: q.answer_text }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-2", children: [
              "Ответ дан ",
              q.answered_at && new Date(q.answered_at).toLocaleDateString("ru-RU")
            ] })
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(
              Textarea,
              {
                placeholder: "Введите ответ...",
                value: answerDrafts[q.id] ?? q.answer_text ?? "",
                onChange: (e) => setAnswerDrafts((p) => ({ ...p, [q.id]: e.target.value })),
                rows: 3
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  size: "sm",
                  onClick: () => {
                    var _a;
                    const answer = (_a = answerDrafts[q.id]) == null ? void 0 : _a.trim();
                    if (!answer) return;
                    answerMutation.mutate({ id: q.id, answer });
                    setAnswerDrafts((p) => {
                      const next = { ...p };
                      delete next[q.id];
                      return next;
                    });
                  },
                  disabled: answerMutation.isPending,
                  className: "gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Send, { className: "w-3 h-3" }),
                    q.status === "answered" ? "Обновить ответ" : "Ответить"
                  ]
                }
              ),
              q.status === "answered" && /* @__PURE__ */ jsx(
                Button,
                {
                  size: "sm",
                  variant: "outline",
                  onClick: () => togglePublishMutation.mutate({ id: q.id, published: !q.is_published }),
                  children: q.is_published ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(EyeOff, { className: "w-3 h-3 mr-1" }),
                    " Скрыть"
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Eye, { className: "w-3 h-3 mr-1" }),
                    " Опубликовать"
                  ] })
                }
              ),
              /* @__PURE__ */ jsxs(AlertDialog, { children: [
                /* @__PURE__ */ jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3" }) }) }),
                /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
                  /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
                    /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Удалить вопрос?" }),
                    /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Это действие нельзя отменить." })
                  ] }),
                  /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
                    /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Отмена" }),
                    /* @__PURE__ */ jsx(AlertDialogAction, { onClick: () => deleteMutation.mutate(q.id), children: "Удалить" })
                  ] })
                ] })
              ] })
            ] })
          ] })
        ] })
      ] }, q.id)),
      filtered.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-16", children: [
        /* @__PURE__ */ jsx(MessageCircle, { className: "w-12 h-12 text-muted-foreground/30 mx-auto mb-4" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Нет вопросов" })
      ] })
    ] })
  ] }) });
};
export {
  AdminQuestions as default
};
