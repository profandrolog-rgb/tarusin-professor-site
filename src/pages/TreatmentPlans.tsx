import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Plus, Loader2, FileText, Printer, BookMarked, Database, CalendarIcon, X, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DuplicatePlanDialog } from "@/components/treatment/DuplicatePlanDialog";
import type { DateRange } from "react-day-picker";

interface PlanRow {
  id: string;
  issued_at: string;
  diagnosis_short: string | null;
  duration_days: number;
  status: string;
  mode: string;
  course_number: number | null;
  patient: { full_name: string } | null;
  items_count?: number;
}

export default function TreatmentPlans() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "issued" | "archived">("all");
  const [modeFilter, setModeFilter] = useState<"all" | "flat" | "scheduled">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dupTarget, setDupTarget] = useState<PlanRow | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/treatment-plans" } });
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    (async () => {
      setBusy(true);
      const { data } = await supabase
        .from("treatment_plans")
        .select("id, issued_at, diagnosis_short, duration_days, status, mode, course_number, patient:patients(full_name), items:treatment_plan_items(count)")
        .order("issued_at", { ascending: false })
        .limit(200);
      const mapped = (data || []).map((r: any) => ({
        ...r,
        items_count: r.items?.[0]?.count ?? 0,
      }));
      setRows(mapped);
      setBusy(false);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (modeFilter !== "all" && r.mode !== modeFilter) return false;
    if (dateRange?.from) {
      const d = new Date(r.issued_at);
      if (d < dateRange.from) return false;
      if (dateRange.to && d > new Date(dateRange.to.getTime() + 86400000 - 1)) return false;
    }
    if (q) {
      const s = q.toLowerCase();
      if (!(r.patient?.full_name || "").toLowerCase().includes(s) &&
          !(r.diagnosis_short || "").toLowerCase().includes(s)) return false;
    }
    return true;
  }), [rows, q, statusFilter, modeFilter, dateRange]);

  const hasFilters = statusFilter !== "all" || modeFilter !== "all" || !!dateRange?.from || !!q;
  const clearFilters = () => { setStatusFilter("all"); setModeFilter("all"); setDateRange(undefined); setQ(""); };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4"/>Назад к панели администратора
        </Link>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-1">Листы назначений</h1>
            <p className="text-muted-foreground">Комплексная метаболическая, антиоксидантная, гормональная и пептидная терапия</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/admin/treatment-catalog">
              <Button variant="outline" className="gap-2"><Database className="w-4 h-4"/>Каталог</Button>
            </Link>
            <Link to="/admin/treatment-templates">
              <Button variant="outline" className="gap-2"><BookMarked className="w-4 h-4"/>Шаблоны</Button>
            </Link>
            <Link to="/admin/treatment-plans/new">
              <Button className="gap-2"><Plus className="w-4 h-4"/>Новый лист</Button>
            </Link>
          </div>
        </div>

        <div className="mb-4 flex gap-2 flex-wrap items-center">
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Поиск по пациенту или диагнозу..." className="max-w-xs"/>
          <Select value={statusFilter} onValueChange={(v: any)=>setStatusFilter(v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Статус"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="draft">Черновик</SelectItem>
              <SelectItem value="issued">Выписан</SelectItem>
              <SelectItem value="archived">Архив</SelectItem>
            </SelectContent>
          </Select>
          <Select value={modeFilter} onValueChange={(v: any)=>setModeFilter(v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Режим"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любой режим</SelectItem>
              <SelectItem value="flat">Плоский</SelectItem>
              <SelectItem value="scheduled">По дням</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("gap-2", !dateRange?.from && "text-muted-foreground")}>
                <CalendarIcon className="w-4 h-4"/>
                {dateRange?.from ? (
                  dateRange.to
                    ? `${format(dateRange.from, "d MMM", { locale: ru })} — ${format(dateRange.to, "d MMM yyyy", { locale: ru })}`
                    : format(dateRange.from, "d MMM yyyy", { locale: ru })
                ) : "Период"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} className="p-3 pointer-events-auto" locale={ru}/>
            </PopoverContent>
          </Popover>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1"><X className="w-3.5 h-3.5"/>Сбросить</Button>
          )}
          <div className="text-sm text-muted-foreground ml-auto">{filtered.length} из {rows.length}</div>
        </div>

        {busy ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50"/>
            Пока нет ни одного листа. Нажмите «Новый лист», чтобы создать первый.
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map(r => (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/admin/treatment-plans/${r.id}`} className="font-medium text-foreground hover:text-primary">
                        {r.patient?.full_name || "Без пациента"}
                      </Link>
                      <Badge variant={r.status === "issued" ? "default" : r.status === "archived" ? "secondary" : "outline"}>
                        {r.status === "draft" ? "черновик" : r.status === "issued" ? "выписан" : "архив"}
                      </Badge>
                      <Badge variant="outline">{r.mode === "flat" ? "плоский" : "по дням"}</Badge>
                      <Badge variant="outline">{r.items_count} позиций</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(r.issued_at), "d MMMM yyyy", { locale: ru })} · курс {r.duration_days} дн.
                      {r.diagnosis_short ? ` · ${r.diagnosis_short}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/admin/treatment-plans/${r.id}`}><Button size="sm" variant="outline">Открыть</Button></Link>
                    <Link to={`/admin/treatment-plans/${r.id}/print`} target="_blank">
                      <Button size="sm" variant="outline" className="gap-1"><Printer className="w-3.5 h-3.5"/>Печать</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
