import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Camera } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SEVERITY_LABEL, type Severity } from "@/lib/metabolic/aggregator";

type Snapshot = {
  id: string;
  snapshot_date: string;
  visit_id: string | null;
  pathway_status: Record<string, { status: Severity; slug: string; name: string }>;
};

type DiagnosisRow = {
  id: string;
  source_date: string | null;
  diagnosis_text: string;
  icd10: string | null;
  source_document: string | null;
  source_type: string | null;
};

const SEV_ORDER: Severity[] = ["no_data", "norm", "mild", "moderate", "severe"];

const STATUS_CELL: Record<Severity, string> = {
  no_data: "bg-muted text-muted-foreground",
  norm: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  mild: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  moderate: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  severe: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
};

function trendArrow(prev: Severity | undefined, curr: Severity): string {
  if (!prev || prev === curr) return "→";
  const dp = SEV_ORDER.indexOf(prev);
  const dc = SEV_ORDER.indexOf(curr);
  if (dc > dp) return "↑";
  if (dc < dp) return "↓";
  return "→";
}

export function DynamicsPanel({
  patientId,
  currentSummary,
  currentPathways,
  canSaveSnapshot = true,
  visitId = null,
}: {
  patientId: string;
  currentSummary: Array<{ pathway_id: string; slug: string; status: Severity }>;
  currentPathways: Array<{ id: string; slug: string; name: string }>;
  canSaveSnapshot?: boolean;
  visitId?: string | null;
}) {
  const [busy, setBusy] = useState(true);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisRow[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setBusy(true);
    const [{ data: snaps }, { data: diag }] = await Promise.all([
      (supabase as any)
        .from("metabolic_map_snapshots")
        .select("id, snapshot_date, visit_id, pathway_status")
        .eq("patient_id", patientId)
        .order("snapshot_date", { ascending: true }),
      supabase
        .from("patient_diagnosis_timeline")
        .select("id, source_date, diagnosis_text, icd10, source_document, source_type")
        .eq("patient_id", patientId)
        .order("source_date", { ascending: false, nullsFirst: false }),
    ]);
    setSnapshots((snaps as any) || []);
    setDiagnoses((diag as any) || []);
    setBusy(false);
  };

  useEffect(() => { load(); }, [patientId]);

  const saveSnapshot = async () => {
    if (!currentSummary?.length) {
      toast({ title: "Нет данных для среза", description: "Сначала пересчитайте отклонения.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const pwById = new Map(currentPathways.map((p) => [p.id, p]));
      const pathway_status: Record<string, any> = {};
      for (const s of currentSummary) {
        const pw = pwById.get(s.pathway_id);
        if (!pw) continue;
        pathway_status[pw.slug] = { status: s.status, slug: pw.slug, name: pw.name };
      }
      const { error } = await (supabase as any).from("metabolic_map_snapshots").insert({
        patient_id: patientId,
        visit_id: visitId,
        pathway_status,
        findings: [],
      });
      if (error) throw error;
      toast({ title: "Срез сохранён", description: "Динамика будет обновлена." });
      await load();
    } catch (e: any) {
      toast({ title: "Ошибка сохранения среза", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const allSlugs = useMemo(() => {
    const s = new Set<string>();
    for (const snap of snapshots) Object.keys(snap.pathway_status || {}).forEach((k) => s.add(k));
    currentPathways.forEach((p) => s.add(p.slug));
    return Array.from(s).sort();
  }, [snapshots, currentPathways]);

  const slugToName = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of currentPathways) m.set(p.slug, p.name);
    for (const snap of snapshots) for (const [k, v] of Object.entries(snap.pathway_status || {})) {
      if (!m.has(k)) m.set(k, (v as any)?.name || k);
    }
    return m;
  }, [snapshots, currentPathways]);

  if (busy) {
    return <Card><CardContent className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Динамика путей по визитам
          </CardTitle>
          {canSaveSnapshot && (
            <Button size="sm" variant="secondary" className="gap-1.5" onClick={saveSnapshot} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              Сохранить срез
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {snapshots.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">
              Срезов пока нет. Нажмите «Сохранить срез» после пересчёта, чтобы зафиксировать состояние на текущую дату.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left font-medium p-2 border-b sticky left-0 bg-background">Путь</th>
                    {snapshots.map((s) => (
                      <th key={s.id} className="text-center font-medium p-2 border-b whitespace-nowrap">
                        {s.snapshot_date}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allSlugs.map((slug) => {
                    let prev: Severity | undefined;
                    return (
                      <tr key={slug} className="border-b last:border-b-0">
                        <td className="p-2 font-medium sticky left-0 bg-background">{slugToName.get(slug) || slug}</td>
                        {snapshots.map((s) => {
                          const st = (s.pathway_status?.[slug]?.status || "no_data") as Severity;
                          const trend = trendArrow(prev, st);
                          prev = st;
                          return (
                            <td key={s.id} className={`p-1.5 text-center ${STATUS_CELL[st]}`}>
                              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                <span>{SEVERITY_LABEL[st]}</span>
                                <span className="opacity-60">{trend}</span>
                              </span>
                            </td>
                          );
                        })}
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
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Хронология диагнозов</CardTitle>
        </CardHeader>
        <CardContent>
          {diagnoses.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">
              Диагнозов пока нет. Они появляются после разбора медицинских PDF.
            </div>
          ) : (
            <ol className="relative border-l pl-4 space-y-3">
              {diagnoses.map((d) => (
                <li key={d.id} className="relative">
                  <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                  <div className="text-xs text-muted-foreground">{d.source_date || "дата не указана"}</div>
                  <div className="text-sm font-medium">
                    {d.diagnosis_text}
                    {d.icd10 && <Badge variant="outline" className="ml-2 text-[10px]">{d.icd10}</Badge>}
                  </div>
                  {(d.source_document || d.source_type) && (
                    <div className="text-[11px] text-muted-foreground">
                      {[d.source_type, d.source_document].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
