import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";

type Row = {
  id: number;
  created_at: string;
  model: string;
  purpose: string;
  attempt: number;
  duration_ms: number;
  ok: boolean;
  error_kind: string | null;
  error_message: string | null;
};

const WINDOWS: Record<string, number> = {
  "1ч": 1,
  "6ч": 6,
  "24ч": 24,
  "7д": 24 * 7,
  "30д": 24 * 30,
};

export default function AdminOrchestratorMetrics() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowKey, setWindowKey] = useState<string>("24ч");

  async function load() {
    setLoading(true);
    const sinceIso = new Date(Date.now() - WINDOWS[windowKey] * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from("orchestrator_call_metrics")
      .select("*")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) console.error(error);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [windowKey]);

  const agg = useMemo(() => {
    type A = {
      model: string;
      calls: number; // логические вызовы (успех или окончательный провал)
      attempts: number;
      failedAttempts: number;
      finalFailures: number;
      avgAttempts: number;
      avgDurationMs: number;
      p95DurationMs: number;
      kinds: Record<string, number>;
    };
    // Группировка по (model, purpose, минутный бакет) — эвристика "один логический вызов".
    // Как надёжный ключ используем: model + все подряд попытки одного вызова идут в течение <60s.
    // Простой вариант: агрегируем по модели без реконструкции цепочек.
    const perModel: Record<string, A> = {};
    for (const r of rows) {
      const a = (perModel[r.model] ??= {
        model: r.model, calls: 0, attempts: 0, failedAttempts: 0, finalFailures: 0,
        avgAttempts: 0, avgDurationMs: 0, p95DurationMs: 0, kinds: {},
      });
      a.attempts += 1;
      if (!r.ok) {
        a.failedAttempts += 1;
        const k = r.error_kind || "other";
        a.kinds[k] = (a.kinds[k] ?? 0) + 1;
      }
    }
    // Оценка "логических вызовов" и финальных провалов: считаем цепочки попыток по (model, purpose)
    // в пределах 90s между записями.
    const bySeries = new Map<string, Row[]>();
    for (const r of [...rows].reverse()) {
      const key = `${r.model}::${r.purpose}`;
      const arr = bySeries.get(key) ?? [];
      arr.push(r);
      bySeries.set(key, arr);
    }
    for (const [key, arr] of bySeries) {
      const model = key.split("::")[0];
      const a = perModel[model];
      if (!a) continue;
      let chain: Row[] = [];
      const finalizeChain = () => {
        if (!chain.length) return;
        a.calls += 1;
        const last = chain[chain.length - 1];
        if (!last.ok) a.finalFailures += 1;
        chain = [];
      };
      for (let i = 0; i < arr.length; i++) {
        const cur = arr[i];
        const prev = arr[i - 1];
        if (prev) {
          const gap = new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime();
          // Новая цепочка если: attempt сбросился к 1, либо прошло >120s, либо предыдущая была успешной.
          if (cur.attempt <= prev.attempt || gap > 120_000 || prev.ok) {
            finalizeChain();
          }
        }
        chain.push(cur);
        if (cur.ok || cur.attempt >= 3) finalizeChain();
      }
      finalizeChain();
    }
    const list = Object.values(perModel).map((a) => {
      const durations = rows.filter((r) => r.model === a.model).map((r) => r.duration_ms).sort((x, y) => x - y);
      a.avgDurationMs = durations.length ? Math.round(durations.reduce((s, v) => s + v, 0) / durations.length) : 0;
      a.p95DurationMs = durations.length ? durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))] : 0;
      a.avgAttempts = a.calls ? +(a.attempts / a.calls).toFixed(2) : 0;
      return a;
    });
    // Сортируем по числу финальных провалов, затем по failedAttempts.
    list.sort((a, b) => (b.finalFailures - a.finalFailures) || (b.failedAttempts - a.failedAttempts));
    return list;
  }, [rows]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Метрики оркестратора</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Каждая строка — одна попытка вызова модели. Ретрай = отдельная запись с бóльшим номером attempt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={windowKey} onValueChange={setWindowKey}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(WINDOWS).map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" /> Обновить
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Сводка по моделям</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40 w-full" /> : agg.length === 0 ? (
            <div className="text-muted-foreground text-sm">Нет данных за выбранный период.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-4">Модель</th>
                    <th className="py-2 pr-4">Вызовов</th>
                    <th className="py-2 pr-4">Fail rate</th>
                    <th className="py-2 pr-4">Попыток</th>
                    <th className="py-2 pr-4">Ø попыток</th>
                    <th className="py-2 pr-4">Ø длит.</th>
                    <th className="py-2 pr-4">p95 длит.</th>
                    <th className="py-2 pr-4">Ошибки</th>
                  </tr>
                </thead>
                <tbody>
                  {agg.map((a) => {
                    const failRate = a.calls ? Math.round((a.finalFailures / a.calls) * 100) : 0;
                    return (
                      <tr key={a.model} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs">{a.model}</td>
                        <td className="py-2 pr-4">{a.calls}</td>
                        <td className="py-2 pr-4">
                          <Badge variant={failRate > 30 ? "destructive" : failRate > 10 ? "secondary" : "outline"}>
                            {failRate}% ({a.finalFailures}/{a.calls})
                          </Badge>
                        </td>
                        <td className="py-2 pr-4">{a.attempts} ({a.failedAttempts} fail)</td>
                        <td className="py-2 pr-4">{a.avgAttempts}</td>
                        <td className="py-2 pr-4">{(a.avgDurationMs / 1000).toFixed(1)}s</td>
                        <td className="py-2 pr-4">{(a.p95DurationMs / 1000).toFixed(1)}s</td>
                        <td className="py-2 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(a.kinds).sort((x, y) => y[1] - x[1]).map(([k, n]) => (
                              <Badge key={k} variant="outline" className="text-xs">{k}: {n}</Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Последние 200 попыток</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3">Время</th>
                    <th className="py-2 pr-3">Модель</th>
                    <th className="py-2 pr-3">Задача</th>
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Длит.</th>
                    <th className="py-2 pr-3">Статус</th>
                    <th className="py-2 pr-3">Ошибка</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-1 pr-3 whitespace-nowrap text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("ru-RU")}
                      </td>
                      <td className="py-1 pr-3 font-mono">{r.model}</td>
                      <td className="py-1 pr-3">{r.purpose}</td>
                      <td className="py-1 pr-3">{r.attempt}</td>
                      <td className="py-1 pr-3">{(r.duration_ms / 1000).toFixed(1)}s</td>
                      <td className="py-1 pr-3">
                        {r.ok ? <Badge variant="outline">ok</Badge>
                              : <Badge variant="destructive">{r.error_kind || "fail"}</Badge>}
                      </td>
                      <td className="py-1 pr-3 max-w-[420px] truncate text-muted-foreground">
                        {r.error_message || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
