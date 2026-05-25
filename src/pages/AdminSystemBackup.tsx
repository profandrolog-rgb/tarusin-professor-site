import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Upload, Loader2, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Strategy = "replace" | "merge" | "new";

type SnapshotFile = { name: string; created_at?: string; metadata?: { size?: number } };

const TABLE_LABELS: Record<string, string> = {
  treatment_catalog: "позиций каталога",
  protocol_templates: "шаблонов протоколов",
  protocol_template_items: "позиций в шаблонах",
  treatment_plans: "листов назначений",
  treatment_plan_items: "позиций в листах",
  treatment_plan_versions: "версий листов",
  treatment_plan_lab_control: "точек лаб. контроля",
  lab_tests_catalog: "тестов в лаб. каталоге",
};

const AdminSystemBackup = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [downloading, setDownloading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<any | null>(null);
  const [strategy, setStrategy] = useState<Strategy>("merge");
  const [confirmed, setConfirmed] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [snapshots, setSnapshots] = useState<SnapshotFile[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(true);
  const [snapshotRunning, setSnapshotRunning] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: "/admin/system-backup" } });
  }, [user, isAdmin, loading, navigate]);

  const loadSnapshots = async () => {
    setSnapshotsLoading(true);
    const { data, error } = await supabase.storage.from("backups").list("", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) toast.error("Не удалось загрузить историю: " + error.message);
    setSnapshots((data as SnapshotFile[]) || []);
    setSnapshotsLoading(false);
  };

  useEffect(() => {
    if (user && isAdmin) loadSnapshots();
  }, [user, isAdmin]);

  const downloadBackup = async () => {
    setDownloading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/backup-treatment-data?action=download`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tarusin-treatment-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Бэкап скачан");
    } catch (e: any) {
      toast.error("Ошибка: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const onPickFile = async (f: File | null) => {
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
    } catch (e: any) {
      toast.error("Ошибка чтения файла: " + e.message);
    }
  };

  const preview = useMemo(() => {
    if (!parsed) return null;
    return Object.entries(TABLE_LABELS).map(([key, label]) => ({
      key,
      label,
      count: Array.isArray(parsed.tables[key]) ? parsed.tables[key].length : 0,
    }));
  }, [parsed]);

  const doRestore = async () => {
    if (!parsed || !confirmed) return;
    if (strategy === "replace" && !window.confirm("Стратегия «Заменить всё» удалит существующие данные. Продолжить?")) return;
    setRestoring(true);
    try {
      const { data, error } = await supabase.functions.invoke("backup-treatment-data", {
        body: { strategy, payload: parsed },
        method: "POST" as any,
      });
      // supabase-js doesn't pass query string; we need to call with action=restore — use fetch fallback
      if (error || (data && (data as any).error)) {
        // fallback: direct fetch with ?action=restore
        const { data: sess } = await supabase.auth.getSession();
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/backup-treatment-data?action=restore`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sess.session?.access_token}`,
            },
            body: JSON.stringify({ strategy, payload: parsed }),
          },
        );
        const j = await res.json();
        if (!res.ok || j.error) throw new Error(j.error || `HTTP ${res.status}`);
        toast.success("Восстановление завершено");
        console.log("restore stats", j.stats);
      } else {
        toast.success("Восстановление завершено");
      }
      setFile(null); setParsed(null); setConfirmed(false);
    } catch (e: any) {
      toast.error("Ошибка восстановления: " + e.message);
    } finally {
      setRestoring(false);
    }
  };

  const runSnapshotNow = async () => {
    setSnapshotRunning(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/backup-treatment-data?action=snapshot`,
        { method: "POST", headers: { Authorization: `Bearer ${sess.session?.access_token}` } },
      );
      const j = await res.json();
      if (!res.ok || j.error) throw new Error(j.error || `HTTP ${res.status}`);
      toast.success(`Снапшот создан: ${j.filename}`);
      await loadSnapshots();
    } catch (e: any) {
      toast.error("Ошибка: " + e.message);
    } finally {
      setSnapshotRunning(false);
    }
  };

  const downloadSnapshot = async (name: string) => {
    const { data, error } = await supabase.storage.from("backups").createSignedUrl(name, 60);
    if (error || !data) { toast.error(error?.message || "Ошибка"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const deleteSnapshot = async (name: string) => {
    if (!window.confirm(`Удалить ${name}?`)) return;
    const { error } = await supabase.storage.from("backups").remove([name]);
    if (error) { toast.error(error.message); return; }
    toast.success("Удалено");
    loadSnapshots();
  };

  if (loading || !user || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-5xl space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Назад</Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold">Резервное копирование</h1>
          <p className="text-muted-foreground mt-1">Бэкап и восстановление данных модуля treatment-plans (без PII пациентов).</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>📦 Полный бэкап</CardTitle>
            <CardDescription>
              Скачать JSON-дамп всех таблиц: каталог, шаблоны, листы назначений, версии, лаб. контроль, лаб. тесты. Не включает: patients (PII), price_parse_log.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadBackup} disabled={downloading}>
              {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Скачать полный бэкап
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📥 Восстановление из бэкапа</CardTitle>
            <CardDescription>Загрузите ранее скачанный JSON-файл бэкапа</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground"
            />

            {preview && (
              <>
                <div className="rounded-md border p-4 bg-muted/30">
                  <div className="text-sm font-medium mb-2">Будет восстановлено:</div>
                  <ul className="text-sm space-y-1">
                    {preview.map((p) => (
                      <li key={p.key}>• <strong>{p.count}</strong> {p.label}</li>
                    ))}
                  </ul>
                  {parsed?.generated_at && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Создан: {format(new Date(parsed.generated_at), "dd MMM yyyy HH:mm", { locale: ru })}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="mb-2 block">Стратегия восстановления</Label>
                  <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as Strategy)}>
                    <div className="flex items-start gap-2">
                      <RadioGroupItem value="merge" id="s-merge" className="mt-1" />
                      <Label htmlFor="s-merge" className="font-normal cursor-pointer">
                        <strong>Слить (UPSERT по id)</strong> — обновить существующие, добавить новые. Безопасно.
                      </Label>
                    </div>
                    <div className="flex items-start gap-2">
                      <RadioGroupItem value="new" id="s-new" className="mt-1" />
                      <Label htmlFor="s-new" className="font-normal cursor-pointer">
                        <strong>Только новые</strong> — пропускать существующие id.
                      </Label>
                    </div>
                    <div className="flex items-start gap-2">
                      <RadioGroupItem value="replace" id="s-replace" className="mt-1" />
                      <Label htmlFor="s-replace" className="font-normal cursor-pointer text-destructive">
                        <strong>Заменить всё</strong> — TRUNCATE+INSERT. Удалит существующие данные модуля!
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {strategy === "replace" && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Опасная операция</AlertTitle>
                    <AlertDescription>Все текущие данные перечисленных таблиц будут удалены и заменены содержимым бэкапа.</AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox id="confirm" checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} />
                  <Label htmlFor="confirm" className="cursor-pointer">Я понимаю риски и подтверждаю восстановление</Label>
                </div>

                <Button onClick={doRestore} disabled={!confirmed || restoring} variant={strategy === "replace" ? "destructive" : "default"}>
                  {restoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Восстановить
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>История бэкапов</CardTitle>
              <CardDescription>Автоматический еженедельный снапшот, хранение 30 дней. Bucket «backups».</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadSnapshots} disabled={snapshotsLoading}>
                <RefreshCw className={`h-4 w-4 ${snapshotsLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button size="sm" onClick={runSnapshotNow} disabled={snapshotRunning}>
                {snapshotRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Создать снапшот сейчас
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {snapshotsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : snapshots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Снапшотов пока нет.</p>
            ) : (
              <div className="divide-y">
                {snapshots.map((s) => (
                  <div key={s.name} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-mono text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.created_at ? format(new Date(s.created_at), "dd MMM yyyy HH:mm", { locale: ru }) : "—"}
                        {s.metadata?.size ? ` · ${(s.metadata.size / 1024).toFixed(1)} КБ` : ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => downloadSnapshot(s.name)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteSnapshot(s.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSystemBackup;
