import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Rocket, RefreshCw, GitCommit, ExternalLink, Activity, PlayCircle, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { s as supabase, u as useAuth, C as Card, c as CardHeader, d as CardTitle, v as CardDescription, a as CardContent, B as Button } from "../main.mjs";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
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
const probes = [
  {
    route: "/admin",
    label: "Административная панель",
    run: async () => {
      const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true }).limit(1);
      if (error) throw error;
    }
  },
  {
    route: "/admin/patients",
    label: "Пациенты",
    run: async () => {
      const { error } = await supabase.from("patients").select("id", { count: "exact", head: true }).limit(1);
      if (error) throw error;
    }
  },
  {
    route: "/admin/repertory",
    label: "Реперторий",
    run: async () => {
      const { error } = await supabase.from("repertory_rubrics").select("id", { count: "exact", head: true }).limit(1);
      if (error) throw error;
    }
  },
  {
    route: "/admin/article-orchestrator",
    label: "Оркестратор статей",
    run: async () => {
      const { error } = await supabase.from("disease_articles").select("id", { count: "exact", head: true }).limit(1);
      if (error) throw error;
    }
  },
  {
    route: "/admin/system-settings",
    label: "Настройки системы",
    run: async () => {
      const { error } = await supabase.functions.invoke("timeweb-deploy-status", { method: "GET" });
      if (error) throw error;
    }
  },
  {
    route: "/cabinet",
    label: "Кабинет",
    run: async () => {
      const { error } = await supabase.from("patient_chat_messages").select("id", { count: "exact", head: true }).limit(1);
      if (error) throw error;
    }
  },
  {
    route: "/cabinet/vault",
    label: "Vault",
    run: async () => {
      const { error } = await supabase.from("vault_notes").select("id", { count: "exact", head: true }).limit(1);
      if (error) throw error;
    }
  }
];
async function runAdminSmokeCheck(opts) {
  const results = [];
  for (const p of probes) {
    const t0 = performance.now();
    let status = "ok";
    let err;
    try {
      await p.run();
    } catch (e) {
      status = "error";
      err = (e == null ? void 0 : e.message) || String(e);
    }
    const latency_ms = Math.round(performance.now() - t0);
    results.push({ route: p.route, label: p.label, status, latency_ms, error: err });
  }
  try {
    await supabase.from("admin_smoke_checks").insert(
      results.map((r) => ({
        deploy_id: opts.deployId ?? null,
        deploy_status: opts.deployStatus ?? null,
        route: r.route,
        label: r.label,
        status: r.status,
        latency_ms: r.latency_ms,
        error: r.error ?? null,
        triggered_by: opts.userId ?? null
      }))
    );
  } catch (e) {
    console.error("smoke check log write failed", e);
  }
  return results;
}
async function fetchLatestSmokeChecks(limit = 20) {
  const { data, error } = await supabase.from("admin_smoke_checks").select("deploy_id, created_at, route, label, status, latency_ms, error").order("created_at", { ascending: false }).limit(limit * 10);
  if (error) throw error;
  const groups = /* @__PURE__ */ new Map();
  for (const row of data || []) {
    const key = `${row.deploy_id || "manual"}|${(row.created_at || "").slice(0, 19)}`;
    if (!groups.has(key)) {
      groups.set(key, { deploy_id: row.deploy_id, created_at: row.created_at, results: [] });
    }
    groups.get(key).results.push({
      route: row.route,
      label: row.label,
      status: row.status,
      latency_ms: row.latency_ms,
      error: row.error
    });
  }
  return Array.from(groups.values()).slice(0, limit);
}
const LAST_EXPORT_KEY = "admin:last_db_export_at";
function toCsv(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    if (v === null || v === void 0) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[",\n;\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return lines.join("\n");
}
function downloadCsv(filename, csv) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
const AdminSystemSettings = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [lastOkDrug, setLastOkDrug] = useState(null);
  const [lastOkLab, setLastOkLab] = useState(null);
  const [recent, setRecent] = useState([]);
  const [running, setRunning] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [lastExportAt, setLastExportAt] = useState(null);
  const [counts, setCounts] = useState({ patients: null, visits: null });
  const [deploying, setDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState(null);
  const [deployStatusLoading, setDeployStatusLoading] = useState(false);
  const [githubHead, setGithubHead] = useState(null);
  const [smokeRunning, setSmokeRunning] = useState(false);
  const [smokeResults, setSmokeResults] = useState(null);
  const [smokeHistory, setSmokeHistory] = useState([]);
  const lastAutoDeployIdRef = useRef(null);
  const OK_STATUSES = ["deployed", "success", "active", "online", "running", "ok", "ready"];
  const runSmoke = async (opts) => {
    if (smokeRunning) return;
    setSmokeRunning(true);
    try {
      if (!(opts == null ? void 0 : opts.silent)) toast.info("Проверяю разделы админки…");
      const results = await runAdminSmokeCheck({
        deployId: (opts == null ? void 0 : opts.deployId) ?? null,
        deployStatus: (opts == null ? void 0 : opts.deployStatus) ?? null,
        userId: (user == null ? void 0 : user.id) ?? null
      });
      setSmokeResults(results);
      const failed = results.filter((r) => r.status === "error");
      if (failed.length === 0) {
        if (!(opts == null ? void 0 : opts.silent)) toast.success(`Все разделы отвечают (${results.length}/${results.length})`);
      } else {
        toast.error(`Проблемы в ${failed.length} из ${results.length} разделов: ${failed.map((f) => f.label).join(", ")}`);
      }
      try {
        setSmokeHistory(await fetchLatestSmokeChecks(10));
      } catch {
      }
    } catch (e) {
      toast.error(`Не удалось выполнить проверку: ${(e == null ? void 0 : e.message) || "ошибка"}`);
    } finally {
      setSmokeRunning(false);
    }
  };
  const loadGithubHead = async () => {
    var _a, _b, _c;
    try {
      const ghRes = await fetch("https://api.github.com/repos/profandrolog-rgb/tarusin-professor-site/commits/main", {
        headers: { Accept: "application/vnd.github+json" }
      }).catch(() => null);
      if (ghRes && ghRes.ok) {
        const gh = await ghRes.json();
        setGithubHead({
          sha: gh.sha,
          message: (((_a = gh.commit) == null ? void 0 : _a.message) || "").split("\n")[0],
          date: (_c = (_b = gh.commit) == null ? void 0 : _b.author) == null ? void 0 : _c.date
        });
      }
    } catch (e) {
      console.error("github head error", e);
    }
  };
  const loadDeployStatus = async () => {
    setDeployStatusLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("timeweb-deploy-status", { method: "GET" });
      if (error) throw error;
      setDeployStatus(data);
    } catch (e) {
      console.error("deploy status error", e);
    } finally {
      setDeployStatusLoading(false);
    }
  };
  useEffect(() => {
    if (user && isAdmin) {
      loadDeployStatus();
      loadGithubHead();
      fetchLatestSmokeChecks(10).then(setSmokeHistory).catch(() => {
      });
      const t = setInterval(loadDeployStatus, 1e4);
      return () => clearInterval(t);
    }
  }, [user, isAdmin]);
  useEffect(() => {
    var _a;
    const last = (_a = deployStatus == null ? void 0 : deployStatus.deploys) == null ? void 0 : _a[0];
    if (!last) return;
    const status = String(last.status || "").toLowerCase();
    const deployId = String(last.id ?? last.deploy_id ?? last.commit_sha ?? "");
    if (!deployId) return;
    if (!OK_STATUSES.includes(status)) return;
    if (lastAutoDeployIdRef.current === deployId) return;
    if (lastAutoDeployIdRef.current === null) {
      lastAutoDeployIdRef.current = deployId;
      return;
    }
    lastAutoDeployIdRef.current = deployId;
    runSmoke({ deployId, deployStatus: status, silent: true });
  }, [deployStatus]);
  const triggerTimewebDeploy = async () => {
    setDeploying(true);
    try {
      const { data, error } = await supabase.functions.invoke("trigger-timeweb-deploy", { method: "POST" });
      if (error) throw error;
      if (data == null ? void 0 : data.error) throw new Error(data.error);
      toast.success("🚀 Деплой на Timeweb запущен");
      setTimeout(loadDeployStatus, 2e3);
    } catch (e) {
      toast.error(`Не удалось запустить деплой: ${(e == null ? void 0 : e.message) || "ошибка"}`);
    } finally {
      setDeploying(false);
    }
  };
  useEffect(() => {
    setLastExportAt(localStorage.getItem(LAST_EXPORT_KEY));
  }, []);
  useEffect(() => {
    if (!user || !isAdmin) return;
    (async () => {
      const [{ count: pCount }, { count: vCount }] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("patient_visits").select("*", { count: "exact", head: true })
      ]);
      setCounts({ patients: pCount ?? 0, visits: vCount ?? 0 });
    })();
  }, [user, isAdmin]);
  const exportData = async () => {
    setExporting(true);
    try {
      const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const { data: patients, error: pErr } = await supabase.from("patients").select("*");
      if (pErr) throw pErr;
      downloadCsv(`patients_${date}.csv`, toCsv(patients || []));
      await new Promise((r) => setTimeout(r, 500));
      const { data: visits, error: vErr } = await supabase.from("patient_visits").select("*");
      if (vErr) throw vErr;
      downloadCsv(`visits_${date}.csv`, toCsv(visits || []));
      const now = (/* @__PURE__ */ new Date()).toISOString();
      localStorage.setItem(LAST_EXPORT_KEY, now);
      setLastExportAt(now);
      toast.success("✅ Экспорт завершён. Сохраните файлы в надёжное место.");
    } catch (e) {
      toast.error(`Ошибка экспорта: ${(e == null ? void 0 : e.message) || "не удалось выгрузить данные"}`);
    } finally {
      setExporting(false);
    }
  };
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: "/admin/system-settings" } });
  }, [user, isAdmin, loading, navigate]);
  const loadStatus = async () => {
    setStatusLoading(true);
    const [{ data: drug }, { data: lab }, { data: log }] = await Promise.all([
      supabase.from("price_parse_log").select("created_at").eq("entity_type", "drug").eq("status", "ok").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("price_parse_log").select("created_at").eq("entity_type", "lab").eq("status", "ok").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("price_parse_log").select("id, entity_type, entity_name, status, sources_count, price_result, error, created_at").order("created_at", { ascending: false }).limit(20)
    ]);
    setLastOkDrug((drug == null ? void 0 : drug.created_at) ?? null);
    setLastOkLab((lab == null ? void 0 : lab.created_at) ?? null);
    setRecent(log || []);
    setStatusLoading(false);
  };
  useEffect(() => {
    if (user && isAdmin) loadStatus();
  }, [user, isAdmin]);
  const runNow = async (kind) => {
    setRunning(kind);
    try {
      const fn = kind === "drug" ? "parse-drug-prices" : "parse-lab-prices";
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { batch: true, limit: 3 }
      });
      if (error) throw error;
      const processed = (data == null ? void 0 : data.processed) ?? 0;
      toast.success(`Тестовый прогон завершён: обработано ${processed}`);
      await loadStatus();
    } catch (e) {
      toast.error(`Ошибка: ${(e == null ? void 0 : e.message) || "не удалось запустить"}`);
    } finally {
      setRunning(null);
    }
  };
  if (loading || !user || !isAdmin) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  const fmt = (d) => d ? format(new Date(d), "d MMMM yyyy, HH:mm", { locale: ru }) : "никогда";
  const isHealthyDrug = lastOkDrug && Date.now() - new Date(lastOkDrug).getTime() < 14 * 24 * 3600 * 1e3;
  const isHealthyLab = lastOkLab && Date.now() - new Date(lastOkLab).getTime() < 14 * 24 * 3600 * 1e3;
  const StatusBadge = ({ ok }) => /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ok ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`, children: [
    ok ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ jsx(AlertTriangle, { className: "w-3.5 h-3.5" }),
    ok ? "Работает" : "Требует настройки"
  ] });
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8 max-w-5xl", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      " К админ-панели"
    ] }),
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground mb-2", children: "Системные настройки" }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-8", children: "Состояние фоновых задач и интеграций" }),
    /* @__PURE__ */ jsxs(Card, { className: "mb-6", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-3", children: [
          (() => {
            var _a;
            const app = deployStatus == null ? void 0 : deployStatus.app;
            const last = (_a = deployStatus == null ? void 0 : deployStatus.deploys) == null ? void 0 : _a[0];
            const appS = String((app == null ? void 0 : app.status) || "").toLowerCase();
            const lastS = String((last == null ? void 0 : last.status) || "").toLowerCase();
            const OK = ["deployed", "success", "active", "online", "running", "ok", "ready"];
            const PROGRESS = ["deploy", "deploying", "building", "build", "pending", "queued", "in_progress", "processing"];
            const FAIL = ["failed", "failure", "stopped", "error", "cancelled", "canceled", "timeout"];
            let color = "bg-gray-400";
            let label = "нет данных";
            let pulse = "";
            let glow = "#9ca3af";
            if (!deployStatus) {
              if (deployStatusLoading) {
                label = "загрузка…";
              } else {
                label = "нет связи с Timeweb";
              }
            } else if (PROGRESS.includes(lastS) || PROGRESS.includes(appS)) {
              color = "bg-amber-400";
              glow = "#f59e0b";
              label = "деплой идёт";
              pulse = "animate-pulse";
            } else if (FAIL.includes(lastS) || FAIL.includes(appS)) {
              color = "bg-red-500";
              glow = "#ef4444";
              label = "ошибка — нужен ручной запуск";
            } else if (OK.includes(lastS) || OK.includes(appS)) {
              color = "bg-emerald-500";
              glow = "#10b981";
              label = "сайт активен";
            } else {
              color = "bg-amber-400";
              glow = "#f59e0b";
              label = `статус: ${lastS || appS || "неизвестно"}`;
            }
            const title = `app.status="${appS || "—"}", last.status="${lastS || "—"}"`;
            return /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", title, children: [
              /* @__PURE__ */ jsx("span", { className: `inline-block w-3.5 h-3.5 rounded-full ${color} ${pulse} shadow-[0_0_8px_currentColor]`, style: { color: glow } }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-muted-foreground", children: label })
            ] });
          })(),
          /* @__PURE__ */ jsx("span", { children: "Деплой на Timeweb" })
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Обычно деплой запускается автоматически после Publish из Lovable. Эта кнопка — на случай, если автодеплой не сработал." })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(Button, { onClick: triggerTimewebDeploy, disabled: deploying, className: "gap-2", children: [
          deploying ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Rocket, { className: "w-4 h-4" }),
          "🚀 Запустить деплой вручную"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border bg-muted/30 p-4 space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Текущий статус" }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: loadDeployStatus, disabled: deployStatusLoading, className: "gap-2 h-7", children: /* @__PURE__ */ jsx(RefreshCw, { className: `w-3.5 h-3.5 ${deployStatusLoading ? "animate-spin" : ""}` }) })
          ] }),
          !deployStatus ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: deployStatusLoading ? "Загрузка..." : "Нет данных" }) : /* @__PURE__ */ jsx(Fragment, { children: (() => {
            var _a, _b, _c, _d;
            const app = deployStatus.app;
            const last = (_a = deployStatus.deploys) == null ? void 0 : _a[0];
            const statusMap = {
              deployed: { label: "Развёрнуто", cls: "bg-green-100 text-green-700" },
              deploy: { label: "Деплой идёт", cls: "bg-blue-100 text-blue-700" },
              building: { label: "Сборка", cls: "bg-blue-100 text-blue-700" },
              pending: { label: "В очереди", cls: "bg-amber-100 text-amber-700" },
              stopped: { label: "Остановлен", cls: "bg-red-100 text-red-700" },
              failed: { label: "Ошибка", cls: "bg-red-100 text-red-700" }
            };
            const appS = statusMap[app == null ? void 0 : app.status] || { label: (app == null ? void 0 : app.status) || "—", cls: "bg-gray-100 text-gray-700" };
            const lastS = last ? statusMap[last.status] || { label: last.status, cls: "bg-gray-100 text-gray-700" } : null;
            return /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Приложение:" }),
                /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${appS.cls}`, children: appS.label })
              ] }),
              last && /* @__PURE__ */ jsxs("div", { className: "text-sm space-y-1.5", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Последний деплой:" }),
                  lastS && /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${lastS.cls}`, children: lastS.label }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: format(/* @__PURE__ */ new Date(last.started_at + (last.started_at.endsWith("Z") ? "" : "Z")), "d MMM HH:mm", { locale: ru }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(GitCommit, { className: "w-3.5 h-3.5 text-muted-foreground" }),
                  /* @__PURE__ */ jsx("code", { className: "text-xs bg-background px-1.5 py-0.5 rounded border", children: ((_b = last.commit_sha) == null ? void 0 : _b.slice(0, 7)) || "—" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground truncate max-w-[300px]", title: last.commit_msg, children: (last.commit_msg || "").split("\n")[0] })
                ] }),
                githubHead && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-1 border-t mt-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: "GitHub main:" }),
                  /* @__PURE__ */ jsx("code", { className: "text-xs bg-background px-1.5 py-0.5 rounded border", children: githubHead.sha.slice(0, 7) }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground truncate max-w-[260px]", title: githubHead.message, children: githubHead.message }),
                  last.commit_sha && last.commit_sha !== githubHead.sha && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700", children: "рассинхрон — нажмите «Запустить деплой»" }),
                  last.commit_sha === githubHead.sha && last.status === "deployed" && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700", children: "синхронизировано" })
                ] })
              ] }),
              ((_d = (_c = app == null ? void 0 : app.domains) == null ? void 0 : _c[0]) == null ? void 0 : _d.fqdn) && /* @__PURE__ */ jsxs(
                "a",
                {
                  href: `https://${app.domains[0].fqdn}`,
                  target: "_blank",
                  rel: "noreferrer",
                  className: "inline-flex items-center gap-1.5 text-xs text-primary hover:underline",
                  children: [
                    app.domains[0].fqdn,
                    " ",
                    /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" })
                  ]
                }
              ),
              deployStatus.deploys && deployStatus.deploys.length > 0 && /* @__PURE__ */ jsxs("div", { className: "pt-3 mt-2 border-t", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground mb-2", children: "История деплоев (как в Timeweb)" }),
                /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: deployStatus.deploys.slice(0, 5).map((d) => {
                  var _a2;
                  const s = statusMap[d.status] || { label: d.status, cls: "bg-gray-100 text-gray-700" };
                  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
                    /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full font-medium ${s.cls}`, children: s.label }),
                    /* @__PURE__ */ jsx("code", { className: "bg-background px-1.5 py-0.5 rounded border", children: ((_a2 = d.commit_sha) == null ? void 0 : _a2.slice(0, 7)) || "—" }),
                    /* @__PURE__ */ jsx("span", { className: "text-muted-foreground truncate flex-1", title: d.commit_msg, children: (d.commit_msg || "").split("\n")[0] }),
                    /* @__PURE__ */ jsx("span", { className: "text-muted-foreground whitespace-nowrap", children: d.started_at ? format(/* @__PURE__ */ new Date(d.started_at + (d.started_at.endsWith("Z") ? "" : "Z")), "d MMM HH:mm", { locale: ru }) : "" })
                  ] }, d.id);
                }) })
              ] })
            ] });
          })() })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "mb-6", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between text-base", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4" }),
            " Проверка разделов админки"
          ] }),
          /* @__PURE__ */ jsxs(Button, { onClick: () => runSmoke(), disabled: smokeRunning, size: "sm", variant: "outline", className: "gap-2", children: [
            smokeRunning ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(PlayCircle, { className: "w-3.5 h-3.5" }),
            "Проверить сейчас"
          ] })
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Автоматически запускается после каждого успешного деплоя. Проверяет доступ ко всем ключевым разделам и записывает время ответа и ошибки." })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        smokeResults && /* @__PURE__ */ jsxs("div", { className: "rounded-md border", children: [
          /* @__PURE__ */ jsx("div", { className: "px-3 py-2 text-xs font-medium bg-muted/50 border-b", children: "Последний прогон" }),
          /* @__PURE__ */ jsx("div", { className: "divide-y", children: smokeResults.map((r) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-2 text-sm", children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: `inline-block w-2 h-2 rounded-full ${r.status === "ok" ? "bg-green-500" : "bg-red-500"}`,
                "aria-hidden": true
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "font-medium min-w-[180px]", children: r.label }),
            /* @__PURE__ */ jsx("code", { className: "text-xs text-muted-foreground", children: r.route }),
            /* @__PURE__ */ jsxs("span", { className: "ml-auto text-xs tabular-nums text-muted-foreground", children: [
              r.latency_ms,
              " мс"
            ] }),
            r.error && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-600 truncate max-w-[280px]", title: r.error, children: r.error })
          ] }, r.route)) })
        ] }),
        smokeHistory.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs font-medium text-muted-foreground mb-2", children: [
            "История проверок (последние ",
            smokeHistory.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: smokeHistory.map((g, i) => {
            const ok = g.results.filter((r) => r.status === "ok").length;
            const total = g.results.length;
            const avg = Math.round(
              g.results.reduce((s, r) => s + (r.latency_ms || 0), 0) / Math.max(total, 1)
            );
            const allOk = ok === total;
            return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
              /* @__PURE__ */ jsxs(
                "span",
                {
                  className: `px-2 py-0.5 rounded-full font-medium ${allOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`,
                  children: [
                    ok,
                    "/",
                    total
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                "avg ",
                avg,
                " мс"
              ] }),
              g.deploy_id && /* @__PURE__ */ jsx("code", { className: "bg-background px-1.5 py-0.5 rounded border text-[10px]", children: String(g.deploy_id).slice(0, 10) }),
              /* @__PURE__ */ jsx("span", { className: "ml-auto text-muted-foreground", children: format(new Date(g.created_at), "d MMM HH:mm", { locale: ru }) })
            ] }, i);
          }) })
        ] }),
        !smokeResults && smokeHistory.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Проверок ещё не было. Нажмите «Проверить сейчас»." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "mb-6", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Экспорт базы данных" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Резервная выгрузка пациентов и визитов в CSV. Рекомендуется делать еженедельно." })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: counts.patients !== null && counts.visits !== null ? /* @__PURE__ */ jsxs(Fragment, { children: [
          "В базе: ",
          /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: counts.patients }),
          " пациентов / ",
          /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: counts.visits }),
          " визитов"
        ] }) : "Загрузка статистики..." }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Последний экспорт: " }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: lastExportAt ? format(new Date(lastExportAt), "d MMMM yyyy, HH:mm", { locale: ru }) : "никогда" })
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: exportData, disabled: exporting, className: "gap-2", children: [
          exporting ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
          "📥 Экспорт базы данных"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "mb-6", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "Авто-парсинг цен на препараты" }),
          /* @__PURE__ */ jsx(StatusBadge, { ok: isHealthyDrug })
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Еженедельно по воскресеньям в 04:00 МСК через cron. Источники: apteka.ru, eapteka.ru, megapteka.ru" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Последний успешный запуск: " }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: fmt(lastOkDrug) })
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: () => runNow("drug"), disabled: running !== null, size: "sm", variant: "outline", className: "gap-2", children: [
          running === "drug" ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
          "Запустить вручную (тест, 3 позиции)"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "mb-6", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "Авто-парсинг цен на анализы" }),
          /* @__PURE__ */ jsx(StatusBadge, { ok: isHealthyLab })
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Еженедельно по воскресеньям в 04:15 МСК через cron. Источник: kdlmed.ru" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Последний успешный запуск: " }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: fmt(lastOkLab) })
        ] }),
        /* @__PURE__ */ jsxs(Button, { onClick: () => runNow("lab"), disabled: running !== null, size: "sm", variant: "outline", className: "gap-2", children: [
          running === "lab" ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
          "Запустить вручную (тест, 3 позиции)"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between text-base", children: [
        /* @__PURE__ */ jsx("span", { children: "Лог парсинга цен (последние 20)" }),
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: loadStatus, disabled: statusLoading, className: "gap-2", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: `w-3.5 h-3.5 ${statusLoading ? "animate-spin" : ""}` }),
          " Обновить"
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: recent.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Записей пока нет" }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "text-left text-muted-foreground border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Дата" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Тип" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Позиция" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Статус" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Источников" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 pr-3", children: "Цена" }),
          /* @__PURE__ */ jsx("th", { className: "py-2", children: "Ошибка" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: recent.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-0", children: [
          /* @__PURE__ */ jsx("td", { className: "py-2 pr-3 whitespace-nowrap", children: format(new Date(r.created_at), "dd.MM HH:mm") }),
          /* @__PURE__ */ jsx("td", { className: "py-2 pr-3", children: r.entity_type }),
          /* @__PURE__ */ jsx("td", { className: "py-2 pr-3", children: r.entity_name || "—" }),
          /* @__PURE__ */ jsx("td", { className: "py-2 pr-3", children: /* @__PURE__ */ jsx("span", { className: `px-1.5 py-0.5 rounded text-xs ${r.status === "ok" ? "bg-green-100 text-green-700" : r.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`, children: r.status }) }),
          /* @__PURE__ */ jsx("td", { className: "py-2 pr-3", children: r.sources_count ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "py-2 pr-3", children: r.price_result ? `${r.price_result} ₽` : "—" }),
          /* @__PURE__ */ jsx("td", { className: "py-2 text-xs text-muted-foreground", children: r.error || "" })
        ] }, r.id)) })
      ] }) }) })
    ] })
  ] }) });
};
export {
  AdminSystemSettings as default
};
