import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, ExternalLink, CheckCircle2, AlertTriangle, Download, Rocket, GitCommit, Activity, PlayCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { runAdminSmokeCheck, fetchLatestSmokeChecks, type SmokeResult } from "@/lib/adminSmokeCheck";

const LAST_EXPORT_KEY = "admin:last_db_export_at";

function toCsv(rows: any[]): string {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[",\n;\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return lines.join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type ParseLogRow = {
  id: string;
  entity_type: string;
  entity_name: string | null;
  status: string;
  sources_count: number | null;
  price_result: number | null;
  error: string | null;
  created_at: string;
};

const AdminSystemSettings = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [lastOkDrug, setLastOkDrug] = useState<string | null>(null);
  const [lastOkLab, setLastOkLab] = useState<string | null>(null);
  const [recent, setRecent] = useState<ParseLogRow[]>([]);
  const [running, setRunning] = useState<"drug" | "lab" | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [lastExportAt, setLastExportAt] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ patients: number | null; visits: number | null }>({ patients: null, visits: null });
  const [deploying, setDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<{ app: any; deploys: any[] } | null>(null);
  const [deployStatusLoading, setDeployStatusLoading] = useState(false);
  const [githubHead, setGithubHead] = useState<{ sha: string; message: string; date: string } | null>(null);

  const loadDeployStatus = async () => {
    setDeployStatusLoading(true);
    try {
      const [{ data, error }, ghRes] = await Promise.all([
        supabase.functions.invoke("timeweb-deploy-status", { method: "GET" }),
        fetch("https://api.github.com/repos/profandrolog-rgb/tarusin-professor-site/commits/main", {
          headers: { Accept: "application/vnd.github+json" },
        }).catch(() => null),
      ]);
      if (error) throw error;
      setDeployStatus(data as any);
      if (ghRes && ghRes.ok) {
        const gh = await ghRes.json();
        setGithubHead({
          sha: gh.sha,
          message: (gh.commit?.message || "").split("\n")[0],
          date: gh.commit?.author?.date,
        });
      }
    } catch (e: any) {
      console.error("deploy status error", e);
    } finally {
      setDeployStatusLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      loadDeployStatus();
      const t = setInterval(loadDeployStatus, 10000);
      return () => clearInterval(t);
    }
  }, [user, isAdmin]);

  const triggerTimewebDeploy = async () => {
    setDeploying(true);
    try {
      const { data, error } = await supabase.functions.invoke("trigger-timeweb-deploy", { method: "POST" });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("🚀 Деплой на Timeweb запущен");
      setTimeout(loadDeployStatus, 2000);
    } catch (e: any) {
      toast.error(`Не удалось запустить деплой: ${e?.message || "ошибка"}`);
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
        supabase.from("patient_visits").select("*", { count: "exact", head: true }),
      ]);
      setCounts({ patients: pCount ?? 0, visits: vCount ?? 0 });
    })();
  }, [user, isAdmin]);

  const exportData = async () => {
    setExporting(true);
    try {
      const date = new Date().toISOString().split("T")[0];

      const { data: patients, error: pErr } = await supabase.from("patients").select("*");
      if (pErr) throw pErr;
      downloadCsv(`patients_${date}.csv`, toCsv(patients || []));

      await new Promise((r) => setTimeout(r, 500));

      const { data: visits, error: vErr } = await supabase.from("patient_visits").select("*");
      if (vErr) throw vErr;
      downloadCsv(`visits_${date}.csv`, toCsv(visits || []));

      const now = new Date().toISOString();
      localStorage.setItem(LAST_EXPORT_KEY, now);
      setLastExportAt(now);
      toast.success("✅ Экспорт завершён. Сохраните файлы в надёжное место.");
    } catch (e: any) {
      toast.error(`Ошибка экспорта: ${e?.message || "не удалось выгрузить данные"}`);
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
      supabase.from("price_parse_log").select("created_at")
        .eq("entity_type", "drug").eq("status", "ok")
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("price_parse_log").select("created_at")
        .eq("entity_type", "lab").eq("status", "ok")
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("price_parse_log")
        .select("id, entity_type, entity_name, status, sources_count, price_result, error, created_at")
        .order("created_at", { ascending: false }).limit(20),
    ]);
    setLastOkDrug(drug?.created_at ?? null);
    setLastOkLab(lab?.created_at ?? null);
    setRecent((log as ParseLogRow[]) || []);
    setStatusLoading(false);
  };

  useEffect(() => {
    if (user && isAdmin) loadStatus();
  }, [user, isAdmin]);

  const runNow = async (kind: "drug" | "lab") => {
    setRunning(kind);
    try {
      const fn = kind === "drug" ? "parse-drug-prices" : "parse-lab-prices";
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { batch: true, limit: 3 },
      });
      if (error) throw error;
      const processed = (data as any)?.processed ?? 0;
      toast.success(`Тестовый прогон завершён: обработано ${processed}`);
      await loadStatus();
    } catch (e: any) {
      toast.error(`Ошибка: ${e?.message || "не удалось запустить"}`);
    } finally {
      setRunning(null);
    }
  };

  if (loading || !user || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const fmt = (d: string | null) => d ? format(new Date(d), "d MMMM yyyy, HH:mm", { locale: ru }) : "никогда";
  const isHealthyDrug = lastOkDrug && (Date.now() - new Date(lastOkDrug).getTime()) < 14 * 24 * 3600 * 1000;
  const isHealthyLab = lastOkLab && (Date.now() - new Date(lastOkLab).getTime()) < 14 * 24 * 3600 * 1000;

  const StatusBadge = ({ ok }: { ok: boolean | null }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ok ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
      {ok ? "Работает" : "Требует настройки"}
    </span>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> К админ-панели
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Системные настройки</h1>
        <p className="text-muted-foreground mb-8">Состояние фоновых задач и интеграций</p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {(() => {
                const app = deployStatus?.app;
                const last = deployStatus?.deploys?.[0];
                const appS = String(app?.status || "").toLowerCase();
                const lastS = String(last?.status || "").toLowerCase();
                const OK = ["deployed", "success", "active", "online", "running", "ok", "ready"];
                const PROGRESS = ["deploy", "deploying", "building", "build", "pending", "queued", "in_progress", "processing"];
                const FAIL = ["failed", "failure", "stopped", "error", "cancelled", "canceled", "timeout"];

                let color = "bg-gray-400";
                let label = "нет данных";
                let pulse = "";
                let glow = "#9ca3af";

                if (!deployStatus) {
                  if (deployStatusLoading) { label = "загрузка…"; }
                  else { label = "нет связи с Timeweb"; }
                } else if (PROGRESS.includes(lastS) || PROGRESS.includes(appS)) {
                  color = "bg-amber-400"; glow = "#f59e0b"; label = "деплой идёт"; pulse = "animate-pulse";
                } else if (FAIL.includes(lastS) || FAIL.includes(appS)) {
                  color = "bg-red-500"; glow = "#ef4444"; label = "ошибка — нужен ручной запуск";
                } else if (OK.includes(lastS) || OK.includes(appS)) {
                  color = "bg-emerald-500"; glow = "#10b981"; label = "сайт активен";
                } else {
                  // данные пришли, но статус неизвестен — показываем сырое значение
                  color = "bg-amber-400"; glow = "#f59e0b";
                  label = `статус: ${lastS || appS || "неизвестно"}`;
                }

                const title = `app.status="${appS || "—"}", last.status="${lastS || "—"}"`;
                return (
                  <span className="flex items-center gap-2" title={title}>
                    <span className={`inline-block w-3.5 h-3.5 rounded-full ${color} ${pulse} shadow-[0_0_8px_currentColor]`} style={{ color: glow }} />
                    <span className="text-xs font-normal text-muted-foreground">{label}</span>
                  </span>
                );
              })()}

              <span>Деплой на Timeweb</span>
            </CardTitle>
            <CardDescription>
              Обычно деплой запускается автоматически после Publish из Lovable. Эта кнопка — на случай,
              если автодеплой не сработал.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            <Button onClick={triggerTimewebDeploy} disabled={deploying} className="gap-2">
              {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              🚀 Запустить деплой вручную
            </Button>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Текущий статус</div>
                <Button variant="ghost" size="sm" onClick={loadDeployStatus} disabled={deployStatusLoading} className="gap-2 h-7">
                  <RefreshCw className={`w-3.5 h-3.5 ${deployStatusLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {!deployStatus ? (
                <div className="text-sm text-muted-foreground">{deployStatusLoading ? "Загрузка..." : "Нет данных"}</div>
              ) : (
                <>
                  {(() => {
                    const app = deployStatus.app;
                    const last = deployStatus.deploys?.[0];
                    const statusMap: Record<string, { label: string; cls: string }> = {
                      deployed: { label: "Развёрнуто", cls: "bg-green-100 text-green-700" },
                      deploy: { label: "Деплой идёт", cls: "bg-blue-100 text-blue-700" },
                      building: { label: "Сборка", cls: "bg-blue-100 text-blue-700" },
                      pending: { label: "В очереди", cls: "bg-amber-100 text-amber-700" },
                      stopped: { label: "Остановлен", cls: "bg-red-100 text-red-700" },
                      failed: { label: "Ошибка", cls: "bg-red-100 text-red-700" },
                    };
                    const appS = statusMap[app?.status] || { label: app?.status || "—", cls: "bg-gray-100 text-gray-700" };
                    const lastS = last ? (statusMap[last.status] || { label: last.status, cls: "bg-gray-100 text-gray-700" }) : null;
                    return (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Приложение:</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${appS.cls}`}>{appS.label}</span>
                        </div>
                        {last && (
                          <div className="text-sm space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Последний деплой:</span>
                              {lastS && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lastS.cls}`}>{lastS.label}</span>}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(last.started_at + (last.started_at.endsWith("Z") ? "" : "Z")), "d MMM HH:mm", { locale: ru })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <GitCommit className="w-3.5 h-3.5 text-muted-foreground" />
                              <code className="text-xs bg-background px-1.5 py-0.5 rounded border">{last.commit_sha?.slice(0, 7) || "—"}</code>
                              <span className="text-xs text-muted-foreground truncate max-w-[300px]" title={last.commit_msg}>
                                {(last.commit_msg || "").split("\n")[0]}
                              </span>
                          </div>
                          {githubHead && (
                            <div className="flex items-center gap-2 pt-1 border-t mt-1.5">
                              <span className="text-muted-foreground text-xs">GitHub main:</span>
                              <code className="text-xs bg-background px-1.5 py-0.5 rounded border">{githubHead.sha.slice(0, 7)}</code>
                              <span className="text-xs text-muted-foreground truncate max-w-[260px]" title={githubHead.message}>
                                {githubHead.message}
                              </span>
                              {last.commit_sha && last.commit_sha !== githubHead.sha && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                                  рассинхрон — нажмите «Запустить деплой»
                                </span>
                              )}
                              {last.commit_sha === githubHead.sha && last.status === "deployed" && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                                  синхронизировано
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                        {app?.domains?.[0]?.fqdn && (
                          <a
                            href={`https://${app.domains[0].fqdn}`}
                            target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                          >
                            {app.domains[0].fqdn} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {deployStatus.deploys && deployStatus.deploys.length > 0 && (
                          <div className="pt-3 mt-2 border-t">
                            <div className="text-xs font-medium text-muted-foreground mb-2">
                              История деплоев (как в Timeweb)
                            </div>
                            <div className="space-y-1.5">
                              {deployStatus.deploys.slice(0, 5).map((d: any) => {
                                const s = statusMap[d.status] || { label: d.status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                  <div key={d.id} className="flex items-center gap-2 text-xs">
                                    <span className={`px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                                    <code className="bg-background px-1.5 py-0.5 rounded border">{d.commit_sha?.slice(0, 7) || "—"}</code>
                                    <span className="text-muted-foreground truncate flex-1" title={d.commit_msg}>
                                      {(d.commit_msg || "").split("\n")[0]}
                                    </span>
                                    <span className="text-muted-foreground whitespace-nowrap">
                                      {d.started_at ? format(new Date(d.started_at + (d.started_at.endsWith("Z") ? "" : "Z")), "d MMM HH:mm", { locale: ru }) : ""}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Экспорт базы данных</CardTitle>
            <CardDescription>Резервная выгрузка пациентов и визитов в CSV. Рекомендуется делать еженедельно.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {counts.patients !== null && counts.visits !== null
                ? <>В базе: <span className="font-medium text-foreground">{counts.patients}</span> пациентов / <span className="font-medium text-foreground">{counts.visits}</span> визитов</>
                : "Загрузка статистики..."}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Последний экспорт: </span>
              <span className="font-medium">{lastExportAt ? format(new Date(lastExportAt), "d MMMM yyyy, HH:mm", { locale: ru }) : "никогда"}</span>
            </div>
            <Button onClick={exportData} disabled={exporting} className="gap-2">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              📥 Экспорт базы данных
            </Button>
          </CardContent>
        </Card>


        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Авто-парсинг цен на препараты</span>
              <StatusBadge ok={isHealthyDrug} />
            </CardTitle>
            <CardDescription>Еженедельно по воскресеньям в 04:00 МСК через cron. Источники: apteka.ru, eapteka.ru, megapteka.ru</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Последний успешный запуск: </span>
              <span className="font-medium">{fmt(lastOkDrug)}</span>
            </div>
            <Button onClick={() => runNow("drug")} disabled={running !== null} size="sm" variant="outline" className="gap-2">
              {running === "drug" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Запустить вручную (тест, 3 позиции)
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Авто-парсинг цен на анализы</span>
              <StatusBadge ok={isHealthyLab} />
            </CardTitle>
            <CardDescription>Еженедельно по воскресеньям в 04:15 МСК через cron. Источник: kdlmed.ru</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Последний успешный запуск: </span>
              <span className="font-medium">{fmt(lastOkLab)}</span>
            </div>
            <Button onClick={() => runNow("lab")} disabled={running !== null} size="sm" variant="outline" className="gap-2">
              {running === "lab" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Запустить вручную (тест, 3 позиции)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Лог парсинга цен (последние 20)</span>
              <Button variant="ghost" size="sm" onClick={loadStatus} disabled={statusLoading} className="gap-2">
                <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? "animate-spin" : ""}`} /> Обновить
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Записей пока нет</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr>
                      <th className="py-2 pr-3">Дата</th>
                      <th className="py-2 pr-3">Тип</th>
                      <th className="py-2 pr-3">Позиция</th>
                      <th className="py-2 pr-3">Статус</th>
                      <th className="py-2 pr-3">Источников</th>
                      <th className="py-2 pr-3">Цена</th>
                      <th className="py-2">Ошибка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(r => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 pr-3 whitespace-nowrap">{format(new Date(r.created_at), "dd.MM HH:mm")}</td>
                        <td className="py-2 pr-3">{r.entity_type}</td>
                        <td className="py-2 pr-3">{r.entity_name || "—"}</td>
                        <td className="py-2 pr-3">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${r.status === "ok" ? "bg-green-100 text-green-700" : r.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2 pr-3">{r.sources_count ?? "—"}</td>
                        <td className="py-2 pr-3">{r.price_result ? `${r.price_result} ₽` : "—"}</td>
                        <td className="py-2 text-xs text-muted-foreground">{r.error || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSystemSettings;
