import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Plus, Loader2, Printer, BookMarked, FileText, GitCompare, Activity } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { PatientVaultNotes } from "@/components/vault/PatientVaultNotes";

interface Patient { id: string; full_name: string; birth_date: string; phone: string | null; history_number: string | null }
interface Plan {
  id: string; course_number: number | null; issued_at: string;
  duration_days: number; status: "draft"|"issued"|"archived"; mode: string;
  diagnosis_short: string | null; based_on_template: string | null;
  total_cost_estimate: number | null;
  template?: { name: string } | null;
  items_count?: number;
}
interface ItemAgg { name: string; section: string; count: number }

const STATUS_LABEL: Record<string,string> = { draft: "черновик", issued: "выписан", archived: "архив" };
const STATUS_VAR: Record<string, "default"|"secondary"|"outline"> = { issued: "default", archived: "secondary", draft: "outline" };

export default function AdminPatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [topItems, setTopItems] = useState<ItemAgg[]>([]);
  const [busy, setBusy] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [reps, setReps] = useState<{ id: string; title: string | null; complaint: string; created_at: string; selected_remedies: any[] }[]>([]);


  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setBusy(true);
      const [{ data: p }, { data: pl }, { data: itemsAgg }] = await Promise.all([
        supabase.from("patients").select("id, full_name, birth_date, phone, history_number").eq("id", id).maybeSingle(),
        supabase.from("treatment_plans")
          .select("id, course_number, issued_at, duration_days, status, mode, diagnosis_short, based_on_template, total_cost_estimate, template:protocol_templates(name), items:treatment_plan_items(count)")
          .eq("patient_id", id)
          .order("course_number", { ascending: true }),
        supabase.from("treatment_plan_items")
          .select("name_snapshot, section_category, plan:treatment_plans!inner(patient_id)")
          .eq("plan.patient_id", id),
      ]);
      setPatient(p as any);
      setPlans(((pl as any[]) || []).map(r => ({ ...r, items_count: r.items?.[0]?.count ?? 0 })));

      // Aggregate top items
      const map = new Map<string, ItemAgg>();
      for (const it of (itemsAgg as any[] || [])) {
        const name = it.name_snapshot || "—";
        const key = `${name}|${it.section_category}`;
        const e = map.get(key);
        if (e) e.count++;
        else map.set(key, { name, section: it.section_category, count: 1 });
      }
      setTopItems([...map.values()].sort((a, b) => b.count - a.count).slice(0, 5));

      const { data: repsData } = await supabase
        .from("complaint_repertorizations")
        .select("id, title, complaint, created_at, selected_remedies")
        .eq("patient_id", id)
        .order("created_at", { ascending: false })
        .limit(10);
      setReps(((repsData as any[]) || []).map((r) => ({
        ...r,
        selected_remedies: Array.isArray(r.selected_remedies) ? r.selected_remedies : [],
      })));

      setBusy(false);
    })();
  }, [id]);

  const stats = useMemo(() => {
    const issued = plans.filter(p => p.status === "issued");
    const totalCost = issued.reduce((s, p) => s + Number(p.total_cost_estimate || 0), 0);
    let avgInterval: number | null = null;
    if (issued.length >= 2) {
      const dates = issued.map(p => parseISO(p.issued_at)).sort((a,b) => a.getTime() - b.getTime());
      let sum = 0;
      for (let i = 1; i < dates.length; i++) sum += differenceInDays(dates[i], dates[i-1]);
      avgInterval = Math.round(sum / (dates.length - 1));
    }
    return { total: plans.length, totalCost, avgInterval, issuedCount: issued.length };
  }, [plans]);

  const toggleSel = (planId: string, checked: boolean) => {
    setSelected(prev => {
      if (checked) return prev.length >= 2 ? [prev[1], planId] : [...prev, planId];
      return prev.filter(x => x !== planId);
    });
  };

  const handleCompare = () => {
    if (selected.length !== 2) {
      toast.info("Выберите ровно 2 курса для сравнения");
      return;
    }
    navigate(`/admin/treatment-plans/compare?a=${selected[0]}&b=${selected[1]}`);
  };

  if (loading || busy) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }
  if (!patient) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Пациент не найден</div>;
  }

  // Timeline scale
  const issuedPlans = plans.filter(p => p.status !== "draft" || true);
  const allDates = issuedPlans.map(p => parseISO(p.issued_at).getTime());
  const minD = Math.min(...allDates);
  const maxD = Math.max(...allDates);
  const span = Math.max(1, maxD - minD);

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>{`Назначения — ${patient.full_name}`}</title><meta name="robots" content="noindex" /></Helmet>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <Link to="/admin/treatment-plans" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4"/>К листам назначений
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-1">📋 Курсы лечения: {patient.full_name}</h1>
            <p className="text-muted-foreground text-sm">
              ДР: {patient.birth_date ? format(parseISO(patient.birth_date), "d MMMM yyyy", { locale: ru }) : "—"}
              {" · "}Телефон: {patient.phone || "—"}
              {" · "}№ ИБ: {patient.history_number || "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={`/admin/patients/${patient.id}/edit`}>
              <Button variant="outline" className="gap-2">Редактировать</Button>
            </Link>
            <Link to={`/admin/treatment-plans/new?patientId=${patient.id}`}>
              <Button className="gap-2"><Plus className="w-4 h-4"/>Новый лист назначений</Button>
            </Link>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Всего курсов</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Выписано</div>
            <div className="text-2xl font-bold">{stats.issuedCount}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Сумма выписанных, ₽</div>
            <div className="text-2xl font-bold">{stats.totalCost ? Math.round(stats.totalCost).toLocaleString("ru-RU") : "—"}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Ср. интервал, дн</div>
            <div className="text-2xl font-bold">{stats.avgInterval ?? "—"}</div>
          </CardContent></Card>
        </div>

        <PatientVaultNotes patientId={patient.id} patientName={patient.full_name} />

        {/* Timeline */}
        {plans.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Хронология курсов</CardTitle></CardHeader>
            <CardContent>
              <div className="relative h-16 mx-4">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border" />
                <TooltipProvider>
                  {plans.map(p => {
                    const t = parseISO(p.issued_at).getTime();
                    const left = plans.length === 1 ? 50 : ((t - minD) / span) * 100;
                    const color = p.status === "issued" ? "bg-primary" : p.status === "archived" ? "bg-muted-foreground" : "bg-orange-400";
                    return (
                      <Tooltip key={p.id}>
                        <TooltipTrigger asChild>
                          <Link
                            to={`/admin/treatment-plans/${p.id}`}
                            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full ring-2 ring-background ${color} hover:scale-125 transition-transform`}
                            style={{ left: `${left}%` }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-0.5">
                            <div className="font-medium">№{p.course_number ?? "?"} · {format(parseISO(p.issued_at), "d MMM yyyy", { locale: ru })}</div>
                            <div>Длительность: {p.duration_days} дн.</div>
                            <div>Статус: {STATUS_LABEL[p.status]}</div>
                            <div>Стоимость: {p.total_cost_estimate ? `${Math.round(Number(p.total_cost_estimate)).toLocaleString("ru-RU")} ₽` : "—"}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Все курсы ({plans.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={handleCompare} disabled={selected.length !== 2} className="gap-2">
              <GitCompare className="w-4 h-4"/>Сравнить выбранные ({selected.length}/2)
            </Button>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Курсов ещё нет</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-14">№</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Длит., дн</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Шаблон</TableHead>
                    <TableHead className="text-right">Позиций</TableHead>
                    <TableHead className="text-right">Стоимость, ₽</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Checkbox checked={selected.includes(p.id)} onCheckedChange={(v) => toggleSel(p.id, !!v)} />
                      </TableCell>
                      <TableCell className="font-mono">{p.course_number ?? "—"}</TableCell>
                      <TableCell>{format(parseISO(p.issued_at), "d MMM yyyy", { locale: ru })}</TableCell>
                      <TableCell>{p.duration_days}</TableCell>
                      <TableCell><Badge variant={STATUS_VAR[p.status]}>{STATUS_LABEL[p.status]}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.template?.name ?? "—"}</TableCell>
                      <TableCell className="text-right">{p.items_count}</TableCell>
                      <TableCell className="text-right">{p.total_cost_estimate ? Math.round(Number(p.total_cost_estimate)).toLocaleString("ru-RU") : "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Link to={`/admin/treatment-plans/${p.id}`}><Button size="sm" variant="ghost" title="Открыть"><FileText className="w-3.5 h-3.5"/></Button></Link>
                          <Link to={`/admin/treatment-plans/${p.id}/print`} target="_blank"><Button size="sm" variant="ghost" title="Печать"><Printer className="w-3.5 h-3.5"/></Button></Link>
                          <Link to={`/admin/treatment-plans/${p.id}/memo`} target="_blank"><Button size="sm" variant="ghost" title="Памятка"><BookMarked className="w-3.5 h-3.5"/></Button></Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top 5 items */}
        {topItems.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">ТОП-5 назначаемых позиций этому пациенту</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead className="w-10">#</TableHead><TableHead>Название</TableHead><TableHead>Секция</TableHead><TableHead className="text-right">Раз</TableHead></TableRow></TableHeader>
                <TableBody>
                  {topItems.map((it, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{it.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{it.section}</TableCell>
                      <TableCell className="text-right">{it.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Гомеопатические подборы */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Гомеопатические подборы ({reps.length})</CardTitle>
            <Link to="/admin/repertory/by-complaint">
              <Button size="sm" variant="outline" className="gap-2"><Plus className="w-3.5 h-3.5" />Новый подбор</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {reps.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">Подборов по жалобам ещё нет</div>
            ) : (
              <div className="divide-y">
                {reps.map((r) => {
                  const prescribed = r.selected_remedies.filter((s: any) => s.prescribe);
                  return (
                    <div key={r.id} className="py-2 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {r.title || r.complaint.slice(0, 90) + (r.complaint.length > 90 ? "…" : "")}
                          </span>
                          <span className="text-xs text-muted-foreground">{format(parseISO(r.created_at), "d MMM yyyy", { locale: ru })}</span>
                        </div>
                        {prescribed.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prescribed.slice(0, 8).map((s: any, i: number) => (
                              <Badge key={i} variant="secondary" className="text-[10px] font-normal">{s.name_latin} {s.potency}</Badge>
                            ))}
                            {prescribed.length > 8 && <Badge variant="outline" className="text-[10px]">+{prescribed.length - 8}</Badge>}
                          </div>
                        )}
                      </div>
                      <Link to="/admin/repertory/by-complaint">
                        <Button size="sm" variant="ghost">Открыть</Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
