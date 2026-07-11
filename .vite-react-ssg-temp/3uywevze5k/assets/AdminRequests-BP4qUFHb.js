import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { u as useAuth, e as useToast, s as supabase, C as Card, a as CardContent, c as CardHeader, b as Badge, B as Button, T as Textarea } from "../main.mjs";
import { Loader2, ArrowLeft, Trash2, User, Baby, Phone, Mail, MessageSquare, Clock, CheckCircle2, XCircle } from "lucide-react";
import { A as AlertDialog, a as AlertDialogTrigger, b as AlertDialogContent, c as AlertDialogHeader, d as AlertDialogTitle, e as AlertDialogDescription, f as AlertDialogFooter, g as AlertDialogCancel, h as AlertDialogAction } from "./alert-dialog-B9yOFgqE.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BFDaalEn.js";
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
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-select";
const statusConfig = {
  pending: { label: "Ожидает", icon: Clock, variant: "secondary" },
  reviewed: { label: "Рассмотрено", icon: CheckCircle2, variant: "default" },
  rejected: { label: "Отклонено", icon: XCircle, variant: "destructive" }
};
const AdminRequests = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/requests" } });
    }
  }, [user, isAdmin, authLoading, navigate]);
  useEffect(() => {
    if (user && isAdmin) {
      fetchRequests();
    }
  }, [user, isAdmin]);
  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("appointment_requests").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заявки",
        variant: "destructive"
      });
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };
  const updateStatus = async (id, status) => {
    const { error } = await supabase.from("appointment_requests").update({ status }).eq("id", id);
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive"
      });
    } else {
      setRequests(requests.map((r) => r.id === id ? { ...r, status } : r));
      toast({
        title: "Статус обновлён"
      });
    }
  };
  const updateNotes = async (id, notes) => {
    const { error } = await supabase.from("appointment_requests").update({ notes }).eq("id", id);
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить заметку",
        variant: "destructive"
      });
    } else {
      setRequests(requests.map((r) => r.id === id ? { ...r, notes } : r));
      toast({
        title: "Заметка сохранена"
      });
    }
  };
  const deleteRequest = async (id) => {
    const { error } = await supabase.from("appointment_requests").delete().eq("id", id);
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заявку",
        variant: "destructive"
      });
    } else {
      setRequests(requests.filter((r) => r.id !== id));
      toast({
        title: "Заявка удалена"
      });
    }
  };
  const filteredRequests = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  if (authLoading || loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (!user || !isAdmin) {
    return null;
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/admin",
        className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors",
        children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
          "К панели администратора"
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground mb-2", children: "Заявки на приём" }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
          "Всего заявок: ",
          requests.length,
          " | Показано: ",
          filteredRequests.length
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: filter, onValueChange: setFilter, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[180px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Фильтр" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Все заявки" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "pending", children: "Ожидают" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "reviewed", children: "Рассмотрены" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "rejected", children: "Отклонены" })
        ] })
      ] })
    ] }),
    filteredRequests.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Заявок пока нет" }) }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: filteredRequests.map((request) => {
      const statusInfo = statusConfig[request.status] || statusConfig.pending;
      const StatusIcon = statusInfo.icon;
      return /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs(Badge, { variant: statusInfo.variant, className: "gap-1", children: [
              /* @__PURE__ */ jsx(StatusIcon, { className: "w-3 h-3" }),
              statusInfo.label
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: new Date(request.created_at).toLocaleString("ru-RU") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: request.status,
                onValueChange: (value) => updateStatus(request.id, value),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[150px] h-8", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "pending", children: "Ожидает" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "reviewed", children: "Рассмотрено" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "rejected", children: "Отклонено" })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(AlertDialog, { children: [
              /* @__PURE__ */ jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) }) }),
              /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
                /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
                  /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Удалить заявку?" }),
                  /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Это действие нельзя отменить." })
                ] }),
                /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
                  /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Отмена" }),
                  /* @__PURE__ */ jsx(AlertDialogAction, { onClick: () => deleteRequest(request.id), children: "Удалить" })
                ] })
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
            request.parent_name && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
              /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx("span", { children: request.parent_name })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
              /* @__PURE__ */ jsx(Baby, { className: "w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "Возраст: ",
                request.child_age
              ] })
            ] }),
            request.contact_phone && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
              /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx("a", { href: `tel:${request.contact_phone}`, className: "text-primary hover:underline", children: request.contact_phone })
            ] }),
            request.contact_email && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
              /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx("a", { href: `mailto:${request.contact_email}`, className: "text-primary hover:underline", children: request.contact_email })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-secondary/50 rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4 text-muted-foreground mt-0.5" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm", children: request.problem_description })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Заметки администратора:" }),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                value: request.notes || "",
                onChange: (e) => {
                  setRequests(requests.map(
                    (r) => r.id === request.id ? { ...r, notes: e.target.value } : r
                  ));
                },
                onBlur: (e) => updateNotes(request.id, e.target.value),
                placeholder: "Добавьте заметку...",
                className: "min-h-[60px]"
              }
            )
          ] })
        ] })
      ] }, request.id);
    }) })
  ] }) });
};
export {
  AdminRequests as default
};
