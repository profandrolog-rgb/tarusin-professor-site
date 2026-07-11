import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Download, AlertTriangle, Upload, RefreshCw, Trash2 } from "lucide-react";
import { n as cn, u as useAuth, B as Button, C as Card, c as CardHeader, d as CardTitle, v as CardDescription, a as CardContent, L as Label, r as Checkbox, s as supabase } from "../main.mjs";
import { R as RadioGroup, a as RadioGroupItem } from "./radio-group-CM9YN36E.js";
import { cva } from "class-variance-authority";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import "vite-react-ssg";
import "@tanstack/react-query";
import "@radix-ui/react-toast";
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
import "@radix-ui/react-radio-group";
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const Alert = React.forwardRef(({ className, variant, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, role: "alert", className: cn(alertVariants({ variant }), className), ...props }));
Alert.displayName = "Alert";
const AlertTitle = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("h5", { ref, className: cn("mb-1 font-medium leading-none tracking-tight", className), ...props })
);
AlertTitle.displayName = "AlertTitle";
const AlertDescription = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("text-sm [&_p]:leading-relaxed", className), ...props })
);
AlertDescription.displayName = "AlertDescription";
const TABLE_LABELS = {
  treatment_catalog: "позиций каталога",
  protocol_templates: "шаблонов протоколов",
  protocol_template_items: "позиций в шаблонах",
  treatment_plans: "листов назначений",
  treatment_plan_items: "позиций в листах",
  treatment_plan_versions: "версий листов",
  treatment_plan_lab_control: "точек лаб. контроля",
  lab_tests_catalog: "тестов в лаб. каталоге"
};
const AdminSystemBackup = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [strategy, setStrategy] = useState("merge");
  const [confirmed, setConfirmed] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(true);
  const [snapshotRunning, setSnapshotRunning] = useState(false);
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: "/admin/system-backup" } });
  }, [user, isAdmin, loading, navigate]);
  const loadSnapshots = async () => {
    setSnapshotsLoading(true);
    const { data, error } = await supabase.storage.from("backups").list("", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" }
    });
    if (error) toast.error("Не удалось загрузить историю: " + error.message);
    setSnapshots(data || []);
    setSnapshotsLoading(false);
  };
  useEffect(() => {
    if (user && isAdmin) loadSnapshots();
  }, [user, isAdmin]);
  const downloadBackup = async () => {
    var _a;
    setDownloading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = (_a = session.session) == null ? void 0 : _a.access_token;
      const res = await fetch(
        `${"https://bpbwkizvvythqotcyfii.supabase.co"}/functions/v1/backup-treatment-data?action=download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tarusin-treatment-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Бэкап скачан");
    } catch (e) {
      toast.error("Ошибка: " + e.message);
    } finally {
      setDownloading(false);
    }
  };
  const onPickFile = async (f) => {
    setFile(f);
    setParsed(null);
    setConfirmed(false);
    if (!f) return;
    try {
      const text = await f.text();
      const json = JSON.parse(text);
      if (!json.tables || typeof json.tables !== "object") {
        throw new Error("Неверная структура: ожидается поле tables");
      }
      setParsed(json);
    } catch (e) {
      toast.error("Ошибка чтения файла: " + e.message);
    }
  };
  const preview = useMemo(() => {
    if (!parsed) return null;
    return Object.entries(TABLE_LABELS).map(([key, label]) => ({
      key,
      label,
      count: Array.isArray(parsed.tables[key]) ? parsed.tables[key].length : 0
    }));
  }, [parsed]);
  const doRestore = async () => {
    var _a;
    if (!parsed || !confirmed) return;
    if (strategy === "replace" && !window.confirm("Стратегия «Заменить всё» удалит существующие данные. Продолжить?")) return;
    setRestoring(true);
    try {
      const { data, error } = await supabase.functions.invoke("backup-treatment-data", {
        body: { strategy, payload: parsed },
        method: "POST"
      });
      if (error || data && data.error) {
        const { data: sess } = await supabase.auth.getSession();
        const res = await fetch(
          `${"https://bpbwkizvvythqotcyfii.supabase.co"}/functions/v1/backup-treatment-data?action=restore`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(_a = sess.session) == null ? void 0 : _a.access_token}`
            },
            body: JSON.stringify({ strategy, payload: parsed })
          }
        );
        const j = await res.json();
        if (!res.ok || j.error) throw new Error(j.error || `HTTP ${res.status}`);
        toast.success("Восстановление завершено");
        console.log("restore stats", j.stats);
      } else {
        toast.success("Восстановление завершено");
      }
      setFile(null);
      setParsed(null);
      setConfirmed(false);
    } catch (e) {
      toast.error("Ошибка восстановления: " + e.message);
    } finally {
      setRestoring(false);
    }
  };
  const runSnapshotNow = async () => {
    var _a;
    setSnapshotRunning(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch(
        `${"https://bpbwkizvvythqotcyfii.supabase.co"}/functions/v1/backup-treatment-data?action=snapshot`,
        { method: "POST", headers: { Authorization: `Bearer ${(_a = sess.session) == null ? void 0 : _a.access_token}` } }
      );
      const j = await res.json();
      if (!res.ok || j.error) throw new Error(j.error || `HTTP ${res.status}`);
      toast.success(`Снапшот создан: ${j.filename}`);
      await loadSnapshots();
    } catch (e) {
      toast.error("Ошибка: " + e.message);
    } finally {
      setSnapshotRunning(false);
    }
  };
  const downloadSnapshot = async (name) => {
    const { data, error } = await supabase.storage.from("backups").createSignedUrl(name, 60);
    if (error || !data) {
      toast.error((error == null ? void 0 : error.message) || "Ошибка");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };
  const deleteSnapshot = async (name) => {
    if (!window.confirm(`Удалить ${name}?`)) return;
    const { error } = await supabase.storage.from("backups").remove([name]);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Удалено");
    loadSnapshots();
  };
  if (loading || !user || !isAdmin) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin" }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background py-8", children: /* @__PURE__ */ jsxs("div", { className: "container max-w-5xl space-y-6", children: [
    /* @__PURE__ */ jsx(Button, { asChild: true, variant: "ghost", size: "sm", children: /* @__PURE__ */ jsxs(Link, { to: "/admin", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
      "Назад"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Резервное копирование" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Бэкап и восстановление данных модуля treatment-plans (без PII пациентов)." })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "📦 Полный бэкап" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Скачать JSON-дамп всех таблиц: каталог, шаблоны, листы назначений, версии, лаб. контроль, лаб. тесты. Не включает: patients (PII), price_parse_log." })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Button, { onClick: downloadBackup, disabled: downloading, children: [
        downloading ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Download, { className: "mr-2 h-4 w-4" }),
        "Скачать полный бэкап"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "📥 Восстановление из бэкапа" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Загрузите ранее скачанный JSON-файл бэкапа" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "file",
            accept: "application/json,.json",
            onChange: (e) => {
              var _a;
              return onPickFile(((_a = e.target.files) == null ? void 0 : _a[0]) ?? null);
            },
            className: "block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground"
          }
        ),
        preview && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-4 bg-muted/30", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium mb-2", children: "Будет восстановлено:" }),
            /* @__PURE__ */ jsx("ul", { className: "text-sm space-y-1", children: preview.map((p) => /* @__PURE__ */ jsxs("li", { children: [
              "• ",
              /* @__PURE__ */ jsx("strong", { children: p.count }),
              " ",
              p.label
            ] }, p.key)) }),
            (parsed == null ? void 0 : parsed.generated_at) && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-2", children: [
              "Создан: ",
              format(new Date(parsed.generated_at), "dd MMM yyyy HH:mm", { locale: ru })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "mb-2 block", children: "Стратегия восстановления" }),
            /* @__PURE__ */ jsxs(RadioGroup, { value: strategy, onValueChange: (v) => setStrategy(v), children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsx(RadioGroupItem, { value: "merge", id: "s-merge", className: "mt-1" }),
                /* @__PURE__ */ jsxs(Label, { htmlFor: "s-merge", className: "font-normal cursor-pointer", children: [
                  /* @__PURE__ */ jsx("strong", { children: "Слить (UPSERT по id)" }),
                  " — обновить существующие, добавить новые. Безопасно."
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsx(RadioGroupItem, { value: "new", id: "s-new", className: "mt-1" }),
                /* @__PURE__ */ jsxs(Label, { htmlFor: "s-new", className: "font-normal cursor-pointer", children: [
                  /* @__PURE__ */ jsx("strong", { children: "Только новые" }),
                  " — пропускать существующие id."
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsx(RadioGroupItem, { value: "replace", id: "s-replace", className: "mt-1" }),
                /* @__PURE__ */ jsxs(Label, { htmlFor: "s-replace", className: "font-normal cursor-pointer text-destructive", children: [
                  /* @__PURE__ */ jsx("strong", { children: "Заменить всё" }),
                  " — TRUNCATE+INSERT. Удалит существующие данные модуля!"
                ] })
              ] })
            ] })
          ] }),
          strategy === "replace" && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx(AlertTitle, { children: "Опасная операция" }),
            /* @__PURE__ */ jsx(AlertDescription, { children: "Все текущие данные перечисленных таблиц будут удалены и заменены содержимым бэкапа." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Checkbox, { id: "confirm", checked: confirmed, onCheckedChange: (v) => setConfirmed(!!v) }),
            /* @__PURE__ */ jsx(Label, { htmlFor: "confirm", className: "cursor-pointer", children: "Я понимаю риски и подтверждаю восстановление" })
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: doRestore, disabled: !confirmed || restoring, variant: strategy === "replace" ? "destructive" : "default", children: [
            restoring ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Upload, { className: "mr-2 h-4 w-4" }),
            "Восстановить"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "История бэкапов" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Автоматический еженедельный снапшот, хранение 30 дней. Bucket «backups»." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: loadSnapshots, disabled: snapshotsLoading, children: /* @__PURE__ */ jsx(RefreshCw, { className: `h-4 w-4 ${snapshotsLoading ? "animate-spin" : ""}` }) }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: runSnapshotNow, disabled: snapshotRunning, children: [
            snapshotRunning ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null,
            "Создать снапшот сейчас"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: snapshotsLoading ? /* @__PURE__ */ jsx(Loader2, { className: "h-5 w-5 animate-spin" }) : snapshots.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Снапшотов пока нет." }) : /* @__PURE__ */ jsx("div", { className: "divide-y", children: snapshots.map((s) => {
        var _a;
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-mono text-sm", children: s.name }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
              s.created_at ? format(new Date(s.created_at), "dd MMM yyyy HH:mm", { locale: ru }) : "—",
              ((_a = s.metadata) == null ? void 0 : _a.size) ? ` · ${(s.metadata.size / 1024).toFixed(1)} КБ` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => downloadSnapshot(s.name), children: /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => deleteSnapshot(s.name), children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })
          ] })
        ] }, s.name);
      }) }) })
    ] })
  ] }) });
};
export {
  AdminSystemBackup as default
};
