import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, GitCompare, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { SECTIONS, SECTION_MAP, type TreatmentCategory } from "@/components/treatment/sections";
import { buildDiff, summarize, type DiffEntry, type DiffItem, type IrtSnap, itemKey } from "@/lib/treatment/diff";
import { fetchIrtForCatalogIds } from "@/lib/treatment/acupunctureExpand";

interface LoadedPlan {
  id: string;
  label: string;
  patient_name: string | null;
  issued_at: string | null;
  course_number: number | null;
  diagnosis_short: string | null;
  clinical_summary: string | null;
  duration_days: number | null;
  status: string | null;
  total_cost_estimate: number | null;
  items: DiffItem[];
  lab: Array<{ control_point: string | null; at_day: number | null }>;
}

const FIELD_LABEL: Record<string, string> = {
  dose: "доза",
  dose_unit: "ед.",
  frequency: "кратность",
  duration_days: "дни",
  day_pattern: "паттерн дней",
  dilution_volume: "объём",
  dilution_solvent: "растворитель",
  notes: "примечания",
  time_of_day: "время суток",
  irt: "точки ИРТ",
};

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₽";
}

function fmtSigned(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "±";
  return `${sign}${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.abs(n))} ₽`;
}

async function loadPlan(idOrVersionRef: string): Promise<LoadedPlan | null> {
  // Format: "version:{versionId}" or plain plan id
  if (idOrVersionRef.startsWith("version:")) {
    const versionId = idOrVersionRef.slice("version:".length);
    const { data } = await supabase
      .from("treatment_plan_versions")
      .select("*")
      .eq("id", versionId)
      .maybeSingle();
    if (!data) return null;
    const snap: any = (data as any).snapshot || {};
    const plan = snap.plan || {};
    let patientName: string | null = null;
    if (plan.patient_id) {
      const { data: p } = await supabase.from("patients").select("full_name").eq("id", plan.patient_id).maybeSingle();
      patientName = (p as any)?.full_name || null;
    }
    return {
      id: idOrVersionRef,
      label: `Версия №${(data as any).version_no} · ${format(new Date((data as any).created_at), "d MMM yyyy, HH:mm", { locale: ru })}`,
      patient_name: patientName,
      issued_at: plan.issued_at || null,
      course_number: plan.course_number ?? null,
      diagnosis_short: plan.diagnosis_short || null,
      clinical_summary: plan.clinical_summary || null,
      duration_days: plan.duration_days ?? null,
      status: plan.status || null,
      total_cost_estimate: plan.total_cost_estimate ?? null,
      items: (snap.items || []) as DiffItem[],
      lab: (snap.lab || []) as any,
    };
  }
  const { data: plan } = await supabase
    .from("treatment_plans")
    .select("*, patient:patients(full_name)")
    .eq("id", idOrVersionRef)
    .maybeSingle();
  if (!plan) return null;
  const { data: items } = await supabase
    .from("treatment_plan_items")
    .select("*")
    .eq("plan_id", idOrVersionRef)
    .order("order_index", { ascending: true });
  const { data: lab } = await supabase
    .from("treatment_plan_lab_control")
    .select("control_point, at_day")
    .eq("plan_id", idOrVersionRef)
    .order("at_day", { ascending: true });

  // Attach live IRT expansion per catalog_id
  const catIds = Array.from(new Set(((items as any[]) || []).map(i => i.catalog_id).filter(Boolean)));
  const irtMap = await fetchIrtForCatalogIds(catIds as string[]);
  const enriched = ((items as any[]) || []).map(i => {
    const v = i.catalog_id ? irtMap.get(i.catalog_id) : null;
    if (!v) return i;
    return { ...i, _irt: {
      protocol_id: v.protocol_id,
      name: v.name,
      session_count: v.session_count,
      session_duration_min: v.session_duration_min,
      frequency: v.frequency,
      points: v.points,
    } as IrtSnap };
  });

  return {
    id: idOrVersionRef,
    label: `Лист №${(plan as any).course_number ?? "—"} · ${(plan as any).issued_at ? format(new Date((plan as any).issued_at), "d MMM yyyy", { locale: ru }) : ""}`,
    patient_name: (plan as any).patient?.full_name || null,
    issued_at: (plan as any).issued_at,
    course_number: (plan as any).course_number,
    diagnosis_short: (plan as any).diagnosis_short,
    clinical_summary: (plan as any).clinical_summary,
    duration_days: (plan as any).duration_days,
    status: (plan as any).status,
    total_cost_estimate: (plan as any).total_cost_estimate,
    items: enriched as DiffItem[],
    lab: (lab || []) as any,
  };
}

function statusClass(s: DiffEntry["status"], side: "a" | "b"): string {
  if (s === "added" && side === "b") return "bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500";
  if (s === "added" && side === "a") return "opacity-30 border-l-4 border-transparent";
  if (s === "removed" && side === "a") return "bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500";
  if (s === "removed" && side === "b") return "opacity-30 border-l-4 border-transparent";
  if (s === "changed") return "bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500";
  return "border-l-4 border-transparent";
}

function ItemCard({
  item, status, side, changedFields,
}: { item?: DiffItem; status: DiffEntry["status"]; side: "a" | "b"; changedFields: string[] }) {
  if (!item) {
    return (
      <div className={`rounded-md p-2 text-xs italic text-muted-foreground min-h-[3.5rem] ${statusClass(status, side)}`}>
        {status === "added" && side === "a" && "— (нет в этом курсе)"}
        {status === "removed" && side === "b" && "— (нет в этом курсе)"}
      </div>
    );
  }
  const isChanged = (f: string) => changedFields.includes(f);
  const hl = (f: string, val: any) =>
    isChanged(f) ? <mark className="bg-amber-200 dark:bg-amber-700/60 px-0.5 rounded-sm">{val}</mark> : val;
  return (
    <div className={`rounded-md p-2 text-sm space-y-0.5 ${statusClass(status, side)}`}>
      <div className="font-medium">{item.name_snapshot}</div>
      {(item.dose != null || item.frequency || item.duration_days != null) && (
        <div className="text-xs">
          {item.dose != null && <>{hl("dose", `${item.dose} ${item.dose_unit ?? ""}`.trim())}</>}
          {item.frequency && <> · {hl("frequency", item.frequency)}</>}
          {item.duration_days != null && <> · {hl("duration_days", `${item.duration_days} дн`)}</>}
        </div>
      )}
      {item.day_pattern && <div className="text-xs text-muted-foreground">дни: {hl("day_pattern", item.day_pattern)}</div>}
      {item.time_of_day && item.time_of_day.length > 0 && (
        <div className="text-xs text-muted-foreground">{hl("time_of_day", item.time_of_day.join(", "))}</div>
      )}
      {(item.dilution_volume != null || item.dilution_solvent) && (
        <div className="text-xs text-muted-foreground">
          {item.dilution_volume != null && <>{hl("dilution_volume", `${item.dilution_volume} мл`)} </>}
          {item.dilution_solvent && <>{hl("dilution_solvent", item.dilution_solvent)}</>}
        </div>
      )}
      {item.notes && <div className="text-xs text-muted-foreground italic">{hl("notes", item.notes)}</div>}
    </div>
  );
}

function PlanHeader({ plan }: { plan: LoadedPlan }) {
  const isVersion = plan.id.startsWith("version:");
  return (
    <div className="space-y-1 border-b pb-3">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">{plan.label}</h2>
        {plan.status && <Badge variant={plan.status === "issued" ? "default" : "secondary"}>{plan.status}</Badge>}
        {!isVersion && (
          <Link to={`/admin/treatment-plans/${plan.id}`}>
            <Button size="sm" variant="ghost" className="h-7 gap-1">
              <ExternalLink className="w-3 h-3"/>Открыть
            </Button>
          </Link>
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        {plan.patient_name && <>Пациент: <span className="text-foreground">{plan.patient_name}</span> · </>}
        {plan.duration_days != null && <>длительность: {plan.duration_days} дн.</>}
      </div>
      {plan.diagnosis_short && <div className="text-sm"><b>Диагноз:</b> {plan.diagnosis_short}</div>}
      {plan.clinical_summary && <div className="text-xs text-muted-foreground line-clamp-2">{plan.clinical_summary}</div>}
      <div className="text-sm pt-1"><b>Стоимость:</b> {fmtMoney(plan.total_cost_estimate)}</div>
    </div>
  );
}

export default function TreatmentPlanCompare() {
  const [params] = useSearchParams();
  const a = params.get("a");
  const b = params.get("b");
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [busy, setBusy] = useState(true);
  const [planA, setPlanA] = useState<LoadedPlan | null>(null);
  const [planB, setPlanB] = useState<LoadedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const syncing = useRef(false);

  useEffect(() => {
    if (!a || !b) { setError("Не указаны идентификаторы курсов (a, b)"); setBusy(false); return; }
    (async () => {
      setBusy(true);
      try {
        const [pa, pb] = await Promise.all([loadPlan(a), loadPlan(b)]);
        if (!pa || !pb) { setError("Один из курсов не найден"); return; }
        setPlanA(pa); setPlanB(pb);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setBusy(false);
      }
    })();
  }, [a, b]);

  useEffect(() => {
    const l = leftRef.current, r = rightRef.current;
    if (!l || !r) return;
    const onScroll = (src: HTMLDivElement, dst: HTMLDivElement) => () => {
      if (syncing.current) return;
      syncing.current = true;
      dst.scrollTop = src.scrollTop;
      requestAnimationFrame(() => { syncing.current = false; });
    };
    const lh = onScroll(l, r);
    const rh = onScroll(r, l);
    l.addEventListener("scroll", lh, { passive: true });
    r.addEventListener("scroll", rh, { passive: true });
    return () => { l.removeEventListener("scroll", lh); r.removeEventListener("scroll", rh); };
  }, [busy, planA, planB]);

  const diff = useMemo(() => {
    if (!planA || !planB) return [];
    return buildDiff(planA.items, planB.items);
  }, [planA, planB]);

  const grouped = useMemo(() => {
    return SECTIONS.map(s => ({
      section: s,
      entries: diff.filter(d => d.section === s.key),
    })).filter(g => g.entries.length > 0);
  }, [diff]);

  const sum = useMemo(() => {
    if (!planA || !planB) return null;
    return summarize(diff, planA.total_cost_estimate || 0, planB.total_cost_estimate || 0);
  }, [diff, planA, planB]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>;
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center">Доступ запрещён</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b sticky top-0 z-20 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <Link to="/admin/treatment-plans">
            <Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="w-4 h-4"/>К листам</Button>
          </Link>
          <Separator orientation="vertical" className="h-6"/>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary"/>
            <h1 className="text-lg font-semibold">Сравнение курсов</h1>
          </div>
          {sum && (
            <div className="ml-auto flex items-center gap-2 text-sm flex-wrap">
              {sum.added > 0 && <Badge className="bg-emerald-500 hover:bg-emerald-500">+{sum.added} добавлено</Badge>}
              {sum.removed > 0 && <Badge className="bg-rose-500 hover:bg-rose-500">−{sum.removed} убрано</Badge>}
              {sum.changed > 0 && <Badge className="bg-amber-500 hover:bg-amber-500 text-amber-950">{sum.changed} изменено</Badge>}
              <Badge variant="outline">
                Стоимость: {fmtSigned(sum.costDelta)}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {busy && (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
        )}
        {error && !busy && (
          <Card><CardContent className="p-6 text-center text-destructive">{error}</CardContent></Card>
        )}

        {!busy && !error && planA && planB && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="flex flex-col max-h-[calc(100vh-7rem)]">
              <CardHeader className="pb-2 shrink-0">
                <PlanHeader plan={planA}/>
              </CardHeader>
              <CardContent ref={leftRef as any} className="overflow-y-auto flex-1 space-y-4 pt-3">
                {grouped.map(({ section, entries }) => (
                  <div key={`a-${section.key}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <section.icon className="w-4 h-4 text-muted-foreground"/>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.label}</h3>
                    </div>
                    <div className="space-y-1.5">
                      {entries.map(e => (
                        <div key={`a-${e.key}`}>
                          <ItemCard item={e.a} status={e.status} side="a" changedFields={e.changedFields}/>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {grouped.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">Нет позиций</div>}

                {planA.lab.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Лабконтроль</h3>
                    <ul className="text-sm space-y-0.5">
                      {planA.lab.map((l, i) => (
                        <li key={i} className="border rounded-md p-1.5">
                          {l.control_point} {l.at_day != null && <span className="text-xs text-muted-foreground">· день {l.at_day}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col max-h-[calc(100vh-7rem)]">
              <CardHeader className="pb-2 shrink-0">
                <PlanHeader plan={planB}/>
              </CardHeader>
              <CardContent ref={rightRef as any} className="overflow-y-auto flex-1 space-y-4 pt-3">
                {grouped.map(({ section, entries }) => (
                  <div key={`b-${section.key}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <section.icon className="w-4 h-4 text-muted-foreground"/>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.label}</h3>
                    </div>
                    <div className="space-y-1.5">
                      {entries.map(e => (
                        <div key={`b-${e.key}`}>
                          <ItemCard item={e.b} status={e.status} side="b" changedFields={e.changedFields}/>
                          {e.status === "changed" && e.changedFields.length > 0 && (
                            <div className="text-[10px] text-amber-700 dark:text-amber-300 px-2 mt-0.5">
                              изменено: {e.changedFields.map(f => FIELD_LABEL[f] || f).join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {grouped.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">Нет позиций</div>}

                {planB.lab.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Лабконтроль</h3>
                    <ul className="text-sm space-y-0.5">
                      {planB.lab.map((l, i) => (
                        <li key={i} className="border rounded-md p-1.5">
                          {l.control_point} {l.at_day != null && <span className="text-xs text-muted-foreground">· день {l.at_day}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!busy && !error && sum && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            🟢 добавлено в правом · 🔴 убрано из левого · 🟡 изменилось (доза/кратность/дни/прочее)
          </div>
        )}
      </div>
    </div>
  );
}
