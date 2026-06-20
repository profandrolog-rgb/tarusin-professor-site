import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";

interface Batch {
  id: string;
  chapter_id: string | null;
  status: string;
  model: string | null;
  total_rubrics: number | null;
  processed_rubrics: number | null;
  subbatch_size: number | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

interface Chapter { id: string; name_en: string; name_ru: string }
interface ChapterStat { id: string; name_en: string; name_ru: string; total: number; translated: number }

export default function AdminTranslationQueue() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [chapters, setChapters] = useState<Record<string, Chapter>>({});
  const [stats, setStats] = useState<ChapterStat[]>([]);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, loading, navigate]);

  const load = async () => {
    setRefreshing(true);
    const [bRes, cRes, rRes] = await Promise.all([
      supabase.from("translation_batches").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("repertory_chapters").select("id,name_en,name_ru").order("ord"),
      supabase.from("repertory_rubrics").select("chapter_id,name_ru"),
    ]);
    const ch: Record<string, Chapter> = {};
    (cRes.data || []).forEach((c: any) => { ch[c.id] = c; });
    setChapters(ch);
    setBatches((bRes.data || []) as Batch[]);

    const totals: Record<string, { total: number; translated: number }> = {};
    (rRes.data || []).forEach((r: any) => {
      const k = r.chapter_id;
      if (!totals[k]) totals[k] = { total: 0, translated: 0 };
      totals[k].total += 1;
      if (r.name_ru && r.name_ru.trim()) totals[k].translated += 1;
    });
    const s: ChapterStat[] = (cRes.data || []).map((c: any) => ({
      id: c.id, name_en: c.name_en, name_ru: c.name_ru,
      total: totals[c.id]?.total || 0,
      translated: totals[c.id]?.translated || 0,
    })).filter(x => x.total > 0);
    setStats(s);
    setBusy(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!user || !isAdmin) return;
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [user, isAdmin]);

  if (loading || busy) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  const active = batches.find(b => b.status === "processing" || b.status === "queued");
  const activeChapter = active?.chapter_id ? chapters[active.chapter_id] : null;

  const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
    if (s === "all_done" || s === "completed") return "default";
    if (s === "processing" || s === "queued") return "secondary";
    if (s === "failed" || s === "error") return "destructive";
    return "outline";
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild><Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" />Админка</Link></Button>
          <h1 className="text-2xl font-bold">Очередь переводов реперториума</h1>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />Обновить
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Текущая глава</CardTitle></CardHeader>
        <CardContent>
          {active ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={statusVariant(active.status)}>{active.status}</Badge>
                <span className="font-medium">{activeChapter?.name_ru || activeChapter?.name_en || "—"}</span>
                {active.model && <Badge variant="outline">{active.model}</Badge>}
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{active.processed_rubrics || 0} / {active.total_rubrics || 0} рубрик</span>
                  <span>{active.total_rubrics ? Math.round(100 * (active.processed_rubrics || 0) / active.total_rubrics) : 0}%</span>
                </div>
                <Progress value={active.total_rubrics ? 100 * (active.processed_rubrics || 0) / active.total_rubrics : 0} />
              </div>
              <div className="text-xs text-muted-foreground">Обновлено: {new Date(active.updated_at).toLocaleString("ru-RU")}</div>
            </div>
          ) : (
            <div className="text-muted-foreground">Нет активных батчей. Cron запустит следующий в течение 10 минут.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Главы — прогресс перевода</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Глава</TableHead>
                <TableHead className="w-32 text-right">Переведено</TableHead>
                <TableHead className="w-32 text-right">Всего</TableHead>
                <TableHead className="w-48">Прогресс</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map(s => {
                const pct = s.total ? Math.round(100 * s.translated / s.total) : 0;
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium">{s.name_en}</div>
                      {s.name_ru && <div className="text-xs text-muted-foreground">{s.name_ru}</div>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{s.translated}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.total}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="flex-1" />
                        <span className="text-xs w-10 text-right">{pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>История батчей (последние 50)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Создан</TableHead>
                <TableHead>Глава</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Модель</TableHead>
                <TableHead className="text-right">Рубрики</TableHead>
                <TableHead>Ошибка</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map(b => {
                const c = b.chapter_id ? chapters[b.chapter_id] : null;
                return (
                  <TableRow key={b.id}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(b.created_at).toLocaleString("ru-RU")}</TableCell>
                    <TableCell className="text-sm">{c?.name_ru || c?.name_en || "—"}</TableCell>
                    <TableCell><Badge variant={statusVariant(b.status)}>{b.status}</Badge></TableCell>
                    <TableCell className="text-xs">{b.model || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{b.processed_rubrics || 0} / {b.total_rubrics || 0}</TableCell>
                    <TableCell className="text-xs text-destructive max-w-xs truncate" title={b.error || ""}>{b.error || ""}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
