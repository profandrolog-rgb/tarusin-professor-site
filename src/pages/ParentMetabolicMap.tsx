import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Printer, Info } from "lucide-react";
import { fetchPathwayTexts, pickText, type PathwayText } from "@/lib/metabolic/texts";
import { SEVERITY_LABEL, type Severity, type PathwaySummary } from "@/lib/metabolic/aggregator";

const STATUS_BADGE: Record<Severity, string> = {
  no_data: "bg-muted text-muted-foreground",
  norm: "bg-emerald-100 text-emerald-800",
  mild: "bg-blue-100 text-blue-800",
  moderate: "bg-amber-100 text-amber-800",
  severe: "bg-red-100 text-red-800",
};

/**
 * Страница для родителя. Показывает упрощённую метаболическую карту его ребёнка.
 * RLS гарантирует, что видит только своего пациента. Если share_simple_only=true —
 * не показываем сырые цифры и профессиональный текст.
 */
export default function ParentMetabolicMap() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(true);
  const [patient, setPatient] = useState<{ id: string; full_name: string; share_simple_only: boolean; sex?: "M" | "F" | null } | null>(null);
  const [pathways, setPathways] = useState<Array<{ id: string; slug: string; name: string; description: string | null; sex?: "M" | "F" | null }>>([]);
  const [summary, setSummary] = useState<PathwaySummary[]>([]);
  const [texts, setTexts] = useState<PathwayText[]>([]);
  const [recs, setRecs] = useState<Array<{ id: string; pathway_id: string | null; application_point: string | null; catalog: any }>>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setBusy(true);
      const [{ data: p }, { data: pw }, { data: m }, ts] = await Promise.all([
        (supabase as any).from("patients").select("id, full_name, share_simple_only, sex").eq("id", id).maybeSingle(),
        (supabase as any).from("pathways").select("id, slug, name, description, sex").eq("is_active", true).order("name"),
        (supabase as any)
          .from("metabolic_maps")
          .select("id, aggregate_summary")
          .eq("patient_id", id)
          .maybeSingle(),
        fetchPathwayTexts(),
      ]);
      setPatient(p as any);
      // Фильтр по полу: если пол не указан — только общие пути (sex IS NULL).
      const patientSex = ((p as any)?.sex === "M" || (p as any)?.sex === "F") ? (p as any).sex : null;
      const allPw = ((pw as any[]) || []) as Array<{ id: string; slug: string; name: string; description: string | null; sex?: "M" | "F" | null }>;
      const visiblePw = patientSex
        ? allPw.filter((x) => !x.sex || x.sex === patientSex)
        : allPw.filter((x) => !x.sex);
      setPathways(visiblePw);
      setSummary(((m as any)?.aggregate_summary?.pathways as PathwaySummary[]) || []);
      setTexts(ts as any);
      if (m?.id) {
        const { data: r } = await (supabase as any)
          .from("map_recommendations")
          .select("id, pathway_id, application_point, catalog:treatment_catalog(name, subcategory, default_dose, dose_unit, default_frequency)")
          .eq("map_id", m.id)
          .eq("include_in_print", true);
        setRecs((r as any) || []);
      }
      setBusy(false);
    })();
  }, [id]);

  const summaryByPathway = useMemo(() => {
    const m = new Map<string, PathwaySummary>();
    for (const s of summary) m.set(s.pathway_id, s);
    return m;
  }, [summary]);

  const recsByPathway = useMemo(() => {
    const m = new Map<string, typeof recs>();
    for (const r of recs) {
      const k = r.pathway_id || "_";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return m;
  }, [recs]);

  if (loading || busy) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Требуется вход.</div>;
  }
  if (!patient) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Карта недоступна.</div>;
  }

  const affected = pathways
    .map((pw) => ({ pw, sum: summaryByPathway.get(pw.id) }))
    .filter(({ sum }) => sum && (sum.status === "mild" || sum.status === "moderate" || sum.status === "severe"));

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>{`Метаболическая карта — ${patient.full_name}`}</title><meta name="robots" content="noindex" /></Helmet>
      <div className="container mx-auto px-4 py-8 space-y-5 max-w-3xl">
        <Link to="/cabinet" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />В кабинет
        </Link>
        <header>
          <h1 className="text-2xl font-bold">Метаболическая карта</h1>
          <p className="text-sm text-muted-foreground">{patient.full_name}</p>
        </header>

        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="p-4 text-sm flex items-start gap-2">
            <Info className="w-4 h-4 text-primary mt-0.5" />
            <div>
              Это упрощённая карта для родителя. Она объясняет простыми словами, какие системы
              обмена веществ у ребёнка сейчас требуют внимания. За подробностями и назначениями
              обращайтесь к лечащему врачу.
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />Распечатать
          </Button>
        </div>

        {(() => {
          const needsPhaseAll = Array.from(
            new Set(summary.flatMap((s) => s.needs_phase_codes || []))
          );
          if (!needsPhaseAll.length) return null;
          return (
            <Card className="border-blue-300/50 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="p-4 text-sm flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  Для некоторых показателей ({needsPhaseAll.join(", ")}) нужна фаза
                  менструального цикла — без неё врач не сможет их правильно
                  оценить. Уточните дату последних mens на приёме.
                </div>
              </CardContent>
            </Card>
          );
        })()}


        {affected.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground italic">
            По имеющимся данным путей, требующих внимания, не выявлено.
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {affected.map(({ pw, sum }) => {
              const text = pickText(texts, pw.id, "simple");
              const pwRecs = recsByPathway.get(pw.id) || [];
              return (
                <Card key={pw.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{pw.name}</span>
                      <Badge className={STATUS_BADGE[sum!.status]}>{SEVERITY_LABEL[sum!.status]}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {text?.summary && <p>{text.summary}</p>}
                    {text?.what_broken && <p><b>Что нарушено:</b> {text.what_broken}</p>}
                    {text?.risks && <p><b>Почему это важно:</b> {text.risks}</p>}
                    {text?.actions && <p><b>Что делать:</b> {text.actions}</p>}
                    {!patient.share_simple_only && text?.evidence && (
                      <p className="text-xs text-muted-foreground"><b>Показатели:</b> {text.evidence}</p>
                    )}
                    {pwRecs.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="text-xs font-medium mb-1">Что назначил врач:</div>
                        <ul className="text-xs space-y-0.5">
                          {pwRecs.map((r) => (
                            <li key={r.id}>
                              • {r.catalog?.name || r.application_point}
                              {r.catalog?.default_dose ? ` — ${r.catalog.default_dose}${r.catalog.dose_unit || ""}` : ""}
                              {r.catalog?.default_frequency ? `, ${r.catalog.default_frequency}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="pt-6 text-xs text-muted-foreground border-t">
          Карта сформирована по данным обследований, введённых лечащим врачом. Она не является
          медицинским заключением сама по себе — только материалом для обсуждения с врачом.
        </div>
      </div>
    </div>
  );
}
