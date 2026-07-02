import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, RefreshCw, FlaskConical } from "lucide-react";

type Row = {
  pathway_slug: string;
  pathway_name: string;
  patients_total: number;
  patients_affected: number;
  severity_mild: number;
  severity_moderate: number;
  severity_severe: number;
};

/**
 * Когортная аналитика по метаболическим путям для научной работы.
 * Все данные обезличены (агрегаты). Экспорт CSV.
 */
export default function AdminMetabolicCohort() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [ageMin, setAgeMin] = useState<string>("");
  const [ageMax, setAgeMax] = useState<string>("");
  const [icd10, setIcd10] = useState<string>("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);

  const run = async () => {
    setBusy(true);
    try {
      const { data, error } = await (supabase as any).rpc("cohort_pathway_stats", {
        _age_min: ageMin ? Number(ageMin) : null,
        _age_max: ageMax ? Number(ageMax) : null,
        _icd10: icd10.trim() || null,
        _sex: null,
      });
      if (error) throw error;
      setRows((data as any) || []);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { if (isAdmin) run(); /* eslint-disable-next-line */ }, [isAdmin]);

  const totalPatients = rows[0]?.patients_total ?? 0;

  const csv = useMemo(() => {
    const head = ["pathway_slug", "pathway_name", "patients_total", "patients_affected", "severity_mild", "severity_moderate", "severity_severe"];
    const body = rows.map((r) =>
      head.map((k) => JSON.stringify((r as any)[k] ?? "")).join(","),
    );
    return [head.join(","), ...body].join("\n");
  }, [rows]);

  const download = () => {
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metabolic-cohort-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Когортная аналитика — метаболические пути</title><meta name="robots" content="noindex" /></Helmet>
      <div className="container mx-auto px-4 py-8 space-y-5 max-w-6xl">
        <header>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" />
            Когортная аналитика (метаболические пути)
          </h1>
          <p className="text-sm text-muted-foreground">
            Агрегаты по путям в выбранной когорте пациентов. Данные обезличены.
          </p>
        </header>

        <Card>
          <CardContent className="p-4 flex flex-wrap items-end gap-3">
            <div className="w-28"><Label className="text-xs">Возраст от</Label><Input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} /></div>
            <div className="w-28"><Label className="text-xs">до</Label><Input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} /></div>
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Диагноз (ICD-10 префикс)</Label><Input value={icd10} onChange={(e) => setIcd10(e.target.value)} placeholder="напр. E22" /></div>
            <Button onClick={run} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}Пересчитать
            </Button>
            <Button onClick={download} variant="outline" className="gap-2" disabled={rows.length === 0}>
              <Download className="w-4 h-4" />CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Результаты
              <Badge variant="secondary">пациентов в когорте: {totalPatients}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">Нет данных для выбранных фильтров.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-2">Путь</th>
                      <th className="p-2 text-right">Затронуто</th>
                      <th className="p-2 text-right">% когорты</th>
                      <th className="p-2 text-right">Лёгкое</th>
                      <th className="p-2 text-right">Умеренное</th>
                      <th className="p-2 text-right">Тяжёлое</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const pct = totalPatients ? (100 * r.patients_affected / totalPatients).toFixed(0) : "0";
                      return (
                        <tr key={r.pathway_slug} className="border-b last:border-b-0 hover:bg-muted/30">
                          <td className="p-2">{r.pathway_name} <span className="text-xs text-muted-foreground">({r.pathway_slug})</span></td>
                          <td className="p-2 text-right font-medium">{r.patients_affected}</td>
                          <td className="p-2 text-right">{pct}%</td>
                          <td className="p-2 text-right text-blue-700">{r.severity_mild}</td>
                          <td className="p-2 text-right text-amber-700">{r.severity_moderate}</td>
                          <td className="p-2 text-right text-red-700">{r.severity_severe}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
