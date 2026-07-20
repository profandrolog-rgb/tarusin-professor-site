import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Database, RefreshCw, Activity, HardDrive, Plug } from "lucide-react";

type Stats = {
  db: { size: string; bytes: string };
  connections: { total: string; active: string; idle: string; max_conn: string };
  activity: { xact_rollback: string; deadlocks: string; blks_read: string; blks_hit: string };
  top_tables: Array<{ relname: string; size: string; bytes: string }>;
  idle_in_transaction_timeout_ms: string;
};

// ci_pico disk = 8 GB nominal. Adjust when upgraded.
const DISK_LIMIT_BYTES = 8 * 1024 * 1024 * 1024;

export function DbHealthWidget() {
  const { session } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    // Always pull the freshest session from the client — the one held in
    // AuthProvider state can be stale after a silent refresh or a revoke.
    let { data: { session: live } } = await supabase.auth.getSession();
    if (!live?.access_token) {
      const refreshed = await supabase.auth.refreshSession();
      live = refreshed.data.session ?? null;
    }
    const token = live?.access_token;
    if (!token) {
      setStats(null);
      setErr("Нет активной сессии администратора. Войдите заново.");
      return;
    }

    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke("db-maintenance", {
        body: { action: "stats" },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) {
        // Stale token → try one refresh + retry before surfacing the error.
        const refreshed = await supabase.auth.refreshSession();
        const newToken = refreshed.data.session?.access_token;
        if (newToken && newToken !== token) {
          const retry = await supabase.functions.invoke("db-maintenance", {
            body: { action: "stats" },
            headers: { Authorization: `Bearer ${newToken}` },
          });
          if (!retry.error) {
            setStats(retry.data as Stats);
            setUpdatedAt(new Date());
            return;
          }
        }
        setStats(null);
        setErr(error.message ?? "Не удалось получить статус базы данных.");
        return;
      }
      setStats(data as Stats);
      setUpdatedAt(new Date());
    } catch (e: any) {
      setStats(null);
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    load();
    const id = setInterval(load, 300_000);
    return () => clearInterval(id);
  }, [load]);

  const diskBytes = stats ? Number(stats.db.bytes) : 0;
  const diskPct = Math.min(100, Math.round((diskBytes / DISK_LIMIT_BYTES) * 100));
  const connTotal = stats ? Number(stats.connections.total) : 0;
  const connMax = stats ? Number(stats.connections.max_conn) : 1;
  const connPct = Math.min(100, Math.round((connTotal / connMax) * 100));
  const cacheHitNum = stats ? Number(stats.activity.blks_hit) : 0;
  const cacheReadNum = stats ? Number(stats.activity.blks_read) : 0;
  const cacheTotal = cacheHitNum + cacheReadNum;
  const cacheHitPct = cacheTotal > 0 ? ((cacheHitNum / cacheTotal) * 100).toFixed(2) : "—";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="w-4 h-4 text-primary" />
              Здоровье базы данных (Lovable Cloud)
            </CardTitle>
            <CardDescription className="text-xs">
              Обновляется каждые 5 минут
              {updatedAt && ` • последнее: ${updatedAt.toLocaleTimeString("ru-RU")}`}
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {err && <p className="text-xs text-destructive">Ошибка: {err}</p>}
        {!stats && !err && <p className="text-xs text-muted-foreground">Загрузка…</p>}
        {stats && (
          <>
            {/* Disk */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  Диск БД
                </span>
                <span className="font-mono text-xs">
                  {stats.db.size} / {(DISK_LIMIT_BYTES / 1024 / 1024 / 1024).toFixed(0)} GB ({diskPct}%)
                </span>
              </div>
              <Progress value={diskPct} className={diskPct > 80 ? "[&>div]:bg-destructive" : diskPct > 60 ? "[&>div]:bg-orange-500" : ""} />
            </div>

            {/* Connections */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1.5">
                  <Plug className="w-3.5 h-3.5" />
                  Подключения
                </span>
                <span className="font-mono text-xs">
                  {stats.connections.total} / {stats.connections.max_conn}
                  {" "}<span className="text-muted-foreground">({stats.connections.active} active, {stats.connections.idle} idle)</span>
                </span>
              </div>
              <Progress value={connPct} />
            </div>

            {/* Activity row */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              <Stat label="Cache hit" value={`${cacheHitPct}%`} hint="чем ближе к 100%, тем меньше I/O" />
              <Stat label="Откаты транзакций" value={Number(stats.activity.xact_rollback).toLocaleString("ru-RU")} hint="накопительно с рестарта" />
              <Stat label="Deadlocks" value={stats.activity.deadlocks} hint="взаимные блокировки" />
            </div>

            {/* Idle timeout */}
            <div className="flex items-center gap-2 text-xs">
              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">idle_in_transaction_timeout:</span>
              <Badge variant="secondary" className="font-mono">{stats.idle_in_transaction_timeout_ms}</Badge>
            </div>

            {/* Top tables */}
            <div className="pt-2 border-t">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Топ-5 таблиц по размеру</p>
              <div className="space-y-1">
                {stats.top_tables.slice(0, 5).map((t) => (
                  <div key={t.relname} className="flex justify-between text-xs">
                    <code className="text-muted-foreground truncate">{t.relname}</code>
                    <span className="font-mono">{t.size}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground" title={hint}>{label}</p>
      <p className="text-sm font-semibold font-mono">{value}</p>
    </div>
  );
}
