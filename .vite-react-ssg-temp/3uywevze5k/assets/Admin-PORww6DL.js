import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { s as supabase, C as Card, c as CardHeader, d as CardTitle, B as Button, a as CardContent, u as useAuth, v as CardDescription, b as Badge } from "../main.mjs";
import { ClipboardList, Plus, Database, RefreshCw, HardDrive, Plug, Activity, Loader2, ArrowLeft, BarChart3, ExternalLink, Eye, TrendingUp, MousePointer, Clock, Stethoscope, Settings, Users, Pill, BookOpen, FileText, Baby, Headphones, Camera, Award, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { P as PROTOCOL_TYPE_MAP } from "./protocolTypes-BWCSK0Md.js";
import { P as Progress } from "./progress-Y5q1JT93.js";
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
import "@radix-ui/react-progress";
function RecentVisitsWidget() {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const [{ data }, { count: total }] = await Promise.all([
        supabase.from("patient_visits").select("id, visit_date, created_at, protocol_type, diagnosis, patient:patients(full_name)").order("created_at", { ascending: false }).limit(5),
        supabase.from("patient_visits").select("*", { count: "exact", head: true })
      ]);
      setItems(data || []);
      setCount(total || 0);
      setLoading(false);
    })();
  }, []);
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ClipboardList, { className: "h-5 w-5 text-primary" }),
        /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Последние протоколы визитов" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "всего: ",
          count
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", variant: "outline", children: /* @__PURE__ */ jsx(Link, { to: "/admin/visits", children: "Журнал" }) }),
        /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", children: /* @__PURE__ */ jsxs(Link, { to: "/admin/visits/new", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
          "Новый"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: loading ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Загрузка…" }) : items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Пока нет протоколов" }) : /* @__PURE__ */ jsx("div", { className: "divide-y", children: items.map((v) => {
      var _a, _b;
      return /* @__PURE__ */ jsxs(Link, { to: `/admin/visits/${v.id}`, className: "flex items-center justify-between py-2 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium truncate", children: ((_a = v.patient) == null ? void 0 : _a.full_name) || "—" }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
            ((_b = PROTOCOL_TYPE_MAP[v.protocol_type]) == null ? void 0 : _b.title) || v.protocol_type,
            v.diagnosis ? ` • ${v.diagnosis}` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground font-mono ml-3 flex-shrink-0", children: format(new Date(v.visit_date), "dd.MM.yyyy") })
      ] }, v.id);
    }) }) })
  ] });
}
const DISK_LIMIT_BYTES = 8 * 1024 * 1024 * 1024;
function DbHealthWidget() {
  const { session } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const load = useCallback(async () => {
    const token = session == null ? void 0 : session.access_token;
    if (!token) {
      setStats(null);
      setErr("Нет активной сессии администратора.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke("db-maintenance", {
        body: { action: "stats" },
        headers: { Authorization: `Bearer ${token}` }
      });
      if (error) {
        setStats(null);
        setErr(error.message ?? "Не удалось получить статус базы данных.");
        return;
      }
      setStats(data);
      setUpdatedAt(/* @__PURE__ */ new Date());
    } catch (e) {
      setStats(null);
      setErr((e == null ? void 0 : e.message) ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [session == null ? void 0 : session.access_token]);
  useEffect(() => {
    load();
    const id = setInterval(load, 3e5);
    return () => clearInterval(id);
  }, [load]);
  const diskBytes = stats ? Number(stats.db.bytes) : 0;
  const diskPct = Math.min(100, Math.round(diskBytes / DISK_LIMIT_BYTES * 100));
  const connTotal = stats ? Number(stats.connections.total) : 0;
  const connMax = stats ? Number(stats.connections.max_conn) : 1;
  const connPct = Math.min(100, Math.round(connTotal / connMax * 100));
  const cacheHitNum = stats ? Number(stats.activity.blks_hit) : 0;
  const cacheReadNum = stats ? Number(stats.activity.blks_read) : 0;
  const cacheTotal = cacheHitNum + cacheReadNum;
  const cacheHitPct = cacheTotal > 0 ? (cacheHitNum / cacheTotal * 100).toFixed(2) : "—";
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [
          /* @__PURE__ */ jsx(Database, { className: "w-4 h-4 text-primary" }),
          "Здоровье базы данных (Lovable Cloud)"
        ] }),
        /* @__PURE__ */ jsxs(CardDescription, { className: "text-xs", children: [
          "Обновляется каждые 5 минут",
          updatedAt && ` • последнее: ${updatedAt.toLocaleTimeString("ru-RU")}`
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: load, disabled: loading, children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: `w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}` }),
        "Обновить"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      err && /* @__PURE__ */ jsxs("p", { className: "text-xs text-destructive", children: [
        "Ошибка: ",
        err
      ] }),
      !stats && !err && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Загрузка…" }),
      stats && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm mb-1", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(HardDrive, { className: "w-3.5 h-3.5" }),
              "Диск БД"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs", children: [
              stats.db.size,
              " / ",
              (DISK_LIMIT_BYTES / 1024 / 1024 / 1024).toFixed(0),
              " GB (",
              diskPct,
              "%)"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: diskPct, className: diskPct > 80 ? "[&>div]:bg-destructive" : diskPct > 60 ? "[&>div]:bg-orange-500" : "" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm mb-1", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Plug, { className: "w-3.5 h-3.5" }),
              "Подключения"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs", children: [
              stats.connections.total,
              " / ",
              stats.connections.max_conn,
              " ",
              /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                "(",
                stats.connections.active,
                " active, ",
                stats.connections.idle,
                " idle)"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: connPct })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 pt-2 border-t", children: [
          /* @__PURE__ */ jsx(Stat, { label: "Cache hit", value: `${cacheHitPct}%`, hint: "чем ближе к 100%, тем меньше I/O" }),
          /* @__PURE__ */ jsx(Stat, { label: "Откаты транзакций", value: Number(stats.activity.xact_rollback).toLocaleString("ru-RU"), hint: "накопительно с рестарта" }),
          /* @__PURE__ */ jsx(Stat, { label: "Deadlocks", value: stats.activity.deadlocks, hint: "взаимные блокировки" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
          /* @__PURE__ */ jsx(Activity, { className: "w-3.5 h-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "idle_in_transaction_timeout:" }),
          /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "font-mono", children: stats.idle_in_transaction_timeout_ms })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium mb-2 text-muted-foreground", children: "Топ-5 таблиц по размеру" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-1", children: stats.top_tables.slice(0, 5).map((t) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
            /* @__PURE__ */ jsx("code", { className: "text-muted-foreground truncate", children: t.relname }),
            /* @__PURE__ */ jsx("span", { className: "font-mono", children: t.size })
          ] }, t.relname)) })
        ] })
      ] })
    ] })
  ] });
}
function Stat({ label, value, hint }) {
  return /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", title: hint, children: label }),
    /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold font-mono", children: value })
  ] });
}
const loaders = [
  () => import("./AdminPatients-Cbrtxjpy.js"),
  () => import("./AdminPatientCards-CmdQOGHv.js"),
  () => import("./AdminPatientVisits-DjG0PoJH.js"),
  () => import("./AdminPatientVisitDetail-BtaRyVo-.js"),
  () => import("./AdminPrescriptions-CgYoTGHV.js"),
  () => import("./AdminConsultations-Bo6_owit.js")
];
let warmed = false;
function shouldSkipWarmup() {
  if (typeof window === "undefined") return true;
  try {
    if (new URLSearchParams(window.location.search).get("noprefetch") === "1") return true;
    const conn = navigator.connection;
    if (conn == null ? void 0 : conn.saveData) return true;
    if ((conn == null ? void 0 : conn.effectiveType) && /(^|-)2g$|3g/.test(conn.effectiveType)) return true;
  } catch {
  }
  return false;
}
function warmAdminChunks() {
  if (warmed) return;
  if (shouldSkipWarmup()) return;
  warmed = true;
  const idle = window.requestIdleCallback ? (cb) => window.requestIdleCallback(cb, { timeout: 6e3 }) : (cb) => window.setTimeout(cb, 800);
  const runNext = (i) => {
    if (i >= loaders.length) return;
    idle(() => {
      loaders[i]().catch(() => {
      }).finally(() => {
        window.setTimeout(() => runNext(i + 1), 600);
      });
    });
  };
  window.setTimeout(() => runNext(0), 4e3);
}
const clinicalSections = [
  {
    title: "Карточки пациентов",
    description: "Портал пациентов: карточки, документы, чат",
    icon: Users,
    href: "/admin/patient-cards",
    color: "text-violet-500"
  },
  {
    title: "Журнал визитов и протоколы",
    description: "9 типов клинических протоколов: первичный осмотр, динамика, УЗИ, послеоп",
    icon: ClipboardList,
    href: "/admin/visits",
    color: "text-cyan-600"
  },
  {
    title: "Онлайн-консультации",
    description: "Кейсы консультаций, ИИ-анализ, заключения",
    icon: Stethoscope,
    href: "/admin/consultations",
    color: "text-sky-500"
  },
  {
    title: "Выписка рецептов",
    description: "Форма 107/у — рецепт на лекарственные препараты",
    icon: Pill,
    href: "/admin/prescriptions",
    color: "text-red-500"
  },
  {
    title: "Листы назначений",
    description: "Комплексная терапия: в/в, в/м, БАД, пептиды, процедуры",
    icon: ClipboardList,
    href: "/admin/treatment-plans",
    color: "text-fuchsia-500"
  },
  {
    title: "Обследования",
    description: "УЗИ, анализы, антропометрия",
    icon: Stethoscope,
    href: "/admin/prescriptions?section=examinations",
    color: "text-indigo-500"
  },
  {
    title: "Операционный журнал",
    description: "Учёт проведённых операций",
    icon: BookOpen,
    href: "/admin/operations-journal",
    color: "text-rose-500"
  },
  {
    title: "🤖 Кабинет (ИИ-чат)",
    description: "Приватный чат с моделями Claude, GPT, Gemini, Grok через OpenRouter",
    icon: Settings,
    href: "/cabinet",
    color: "text-fuchsia-600"
  },
  {
    title: "Шаблоны текстов протоколов",
    description: "Универсальные и операционные шаблоны для полей форм визитов",
    icon: ClipboardList,
    href: "/admin/visit-templates",
    color: "text-teal-600"
  },
  {
    title: "📚 Медицинские справочники",
    description: "Препараты, операции, программы физ. нагрузки, диеты — для назначений в протоколах",
    icon: BookOpen,
    href: "/admin/medical-references",
    color: "text-emerald-600"
  }
];
const siteSections = [
  {
    title: "Заявки на приём",
    description: "Просмотр и обработка заявок от посетителей",
    icon: ClipboardList,
    href: "/admin/requests",
    color: "text-orange-500"
  },
  {
    title: "Вопросы пациентов",
    description: "Ответы на вопросы, публикация Q&A",
    icon: ClipboardList,
    href: "/admin/questions",
    color: "text-cyan-500"
  },
  {
    title: "Команда профессора",
    description: "Управление специалистами команды",
    icon: Users,
    href: "/team",
    color: "text-blue-500"
  },
  {
    title: "Клинические случаи",
    description: "Добавление и редактирование кейсов",
    icon: FileText,
    href: "/clinical-cases",
    color: "text-green-500"
  },
  {
    title: "Материалы о заболеваниях",
    description: "Статьи-лонгриды про болезни (детские и взрослые)",
    icon: Baby,
    href: "/admin/disease-articles",
    color: "text-pink-500"
  },
  {
    title: "«Полезные материалы» для родителей",
    description: "Карточки статей, YouTube-видео и подкастов на /for-parents",
    icon: BookOpen,
    href: "/admin/parents-materials",
    color: "text-fuchsia-500"
  },
  {
    title: "Наши исследования",
    description: "Публикации и научные статьи",
    icon: FileText,
    href: "/research",
    color: "text-emerald-500"
  },
  {
    title: "Размышлизмы",
    description: "Блог профессора — публикация заметок",
    icon: FileText,
    href: "/blog",
    color: "text-teal-500"
  },
  {
    title: "🎙️ Исходники для подкастов",
    description: "Скачать тексты блога, статей, исследований и кейсов для NotebookLM",
    icon: Headphones,
    href: "/admin/podcast-sources",
    color: "text-fuchsia-600"
  },
  {
    title: "📤 ИИ-загрузка статьи",
    description: "Загрузить .docx → авто-открытие в Оркестраторе для ревью",
    icon: FileText,
    href: "/admin/article-upload",
    color: "text-emerald-600"
  },
  {
    title: "✨ Оркестратор статей",
    description: "Параллельное ревью текста несколькими ИИ, голосование, арбитраж и переписывание",
    icon: FileText,
    href: "/admin/article-orchestrator",
    color: "text-amber-600"
  },
  {
    title: "📥 Финальный импорт (SEO)",
    description: "Финальная форма: заголовок, slug, ключевые слова, аннотация, сохранение",
    icon: FileText,
    href: "/admin/article-import",
    color: "text-cyan-600"
  },
  {
    title: "Путевые заметки",
    description: "Управление фотогалереей путешествий",
    icon: Camera,
    href: "/travel-notes",
    color: "text-purple-500"
  },
  {
    title: "Сертификаты и дипломы",
    description: "Управление галереей сертификатов",
    icon: Award,
    href: "/admin/certificates",
    color: "text-amber-500"
  },
  {
    title: "Самодиагностика",
    description: "Статистика прохождений тестов самодиагностики",
    icon: ClipboardCheck,
    href: "/admin/self-check",
    color: "text-lime-500"
  },
  {
    title: "📊 Аналитика",
    description: "Статистика использования каталога, шаблонов, секций и динамика по месяцам",
    icon: BarChart3,
    href: "/admin/analytics",
    color: "text-indigo-500"
  },
  {
    title: "Системные настройки",
    description: "Статус cron-задач, авто-парсинг цен, лог запусков",
    icon: Settings,
    href: "/admin/system-settings",
    color: "text-slate-500"
  },
  {
    title: "📦 Резервное копирование",
    description: "Бэкап и восстановление данных treatment-plans, история снапшотов",
    icon: Settings,
    href: "/admin/system-backup",
    color: "text-amber-600"
  }
];
const analyticsServices = [
  {
    name: "Яндекс.Метрика",
    id: "107724120",
    icon: "📊",
    dashboardUrl: "https://metrika.yandex.ru/dashboard?id=107724120",
    features: ["Вебвизор", "Карта кликов", "Источники трафика", "Показатель отказов"],
    color: "border-yellow-500/50 bg-yellow-500/5"
  },
  {
    name: "Google Analytics 4",
    id: "G-5M2VCL4QN5",
    icon: "📈",
    dashboardUrl: "https://analytics.google.com/analytics/web/",
    features: ["Воронки конверсий", "Когортный анализ", "Демография", "Поведение"],
    color: "border-blue-500/50 bg-blue-500/5"
  }
];
const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin" } });
    }
  }, [user, isAdmin, loading, navigate]);
  useEffect(() => {
    if (user && isAdmin) warmAdminChunks();
  }, [user, isAdmin]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (!user || !isAdmin) {
    return null;
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/",
        className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors",
        children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
          "На главную"
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground mb-2", children: "Административная панель" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Управление контентом сайта" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mb-10", children: /* @__PURE__ */ jsx(DbHealthWidget, {}) }),
    /* @__PURE__ */ jsxs("div", { className: "mb-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ jsx(BarChart3, { className: "w-5 h-5 text-primary" }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: "Аналитика и счётчики" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2", children: analyticsServices.map((service) => /* @__PURE__ */ jsxs(Card, { className: `border ${service.color}`, children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xl", children: service.icon }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: service.name }),
              /* @__PURE__ */ jsx(CardDescription, { className: "text-xs font-mono", children: service.id })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium", children: [
            /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-green-500" }),
            "Активен"
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: service.features.map((feature) => /* @__PURE__ */ jsx("span", { className: "text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground", children: feature }, feature)) }),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: service.dashboardUrl,
              target: "_blank",
              rel: "noopener noreferrer",
              children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "w-full gap-2 mt-1", children: [
                /* @__PURE__ */ jsx(ExternalLink, { className: "w-3.5 h-3.5" }),
                "Открыть личный кабинет"
              ] })
            }
          )
        ] })
      ] }, service.id)) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-3 rounded-lg bg-muted/50", children: [
          /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4 text-primary flex-shrink-0" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Просмотры" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground", children: "Метрика → Сводка" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-3 rounded-lg bg-muted/50", children: [
          /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4 text-primary flex-shrink-0" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Источники" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground", children: "GA4 → Источники" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-3 rounded-lg bg-muted/50", children: [
          /* @__PURE__ */ jsx(MousePointer, { className: "w-4 h-4 text-primary flex-shrink-0" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Карта кликов" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground", children: "Метрика → Карты" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-3 rounded-lg bg-muted/50", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-primary flex-shrink-0" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Время на сайте" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground", children: "GA4 → Вовлечённость" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsx(RecentVisitsWidget, {}) }),
    /* @__PURE__ */ jsxs("section", { className: "mb-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
        /* @__PURE__ */ jsx(Stethoscope, { className: "w-5 h-5 text-primary" }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: "Клиническая работа" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Пациенты, протоколы, ИИ-ассистент, назначения и рецепты" }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: clinicalSections.map((section) => /* @__PURE__ */ jsx(Link, { to: section.href, children: /* @__PURE__ */ jsx(Card, { className: "h-full hover:shadow-lg transition-shadow cursor-pointer border-primary/20 hover:border-primary/60 bg-primary/[0.02]", children: /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg bg-secondary ${section.color}`, children: /* @__PURE__ */ jsx(section.icon, { className: "w-6 h-6" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: section.title }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-xs", children: section.description })
        ] })
      ] }) }) }) }, section.href)) })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
        /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5 text-muted-foreground" }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: "Сайт и администрирование" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Контент, заявки, аналитика, инфраструктура" }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: siteSections.map((section) => /* @__PURE__ */ jsx(Link, { to: section.href, children: /* @__PURE__ */ jsx(Card, { className: "h-full hover:shadow-md transition-shadow cursor-pointer hover:border-primary/40", children: /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg bg-secondary ${section.color}`, children: /* @__PURE__ */ jsx(section.icon, { className: "w-6 h-6" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: section.title }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-xs", children: section.description })
        ] })
      ] }) }) }) }, section.href)) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-8 p-4 bg-secondary/50 rounded-lg", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
      "Вы вошли как: ",
      /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: user.email })
    ] }) })
  ] }) });
};
export {
  Admin as default
};
