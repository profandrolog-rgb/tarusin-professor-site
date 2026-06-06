import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, ExternalLink, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

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
