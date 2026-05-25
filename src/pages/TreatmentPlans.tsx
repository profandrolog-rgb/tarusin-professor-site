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
import { ArrowLeft, Plus, Loader2, FileText, Printer, BookMarked, Database, CalendarIcon, X, UserPlus, Search, Download } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DuplicatePlanDialog } from "@/components/treatment/DuplicatePlanDialog";
import type { DateRange } from "react-day-picker";
import { parseSearchQuery } from "@/lib/treatment/searchParser";
import { toast } from "sonner";

interface PlanRow {
  id: string;
  issued_at: string;
  diagnosis_short: string | null;
  duration_days: number;
  status: string;
  mode: string;
  course_number: number | null;
  patient: { id: string; full_name: string } | null;
  items_count?: number;
}

interface SearchRow {
  plan_id: string;
  patient_id: string | null;
  patient_full_name: string | null;
  patient_age_years: number | null;
  issued_at: string;
  status: string;
  mode: string;
  duration_days: number;
  total_cost_estimate: number | null;
  course_number: number | null;
  diagnosis_short: string | null;
  template_name: string | null;
  template_tags: string[] | null;
  item_names: string[] | null;
  rank: number;
  snippet: string | null;
}

const fmtCost = (n: number | null) => n == null ? "—" : new Intl.NumberFormat("ru-RU").format(n) + " ₽";

function escapeCsv(v: any): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function searchToCsv(rows: SearchRow[]): string {
  const headers = ["Дата","№ курса","Пациент","Возраст","Диагноз","Шаблон","Теги","Препараты","Длит. (дн)","Статус","Стоимость, ₽"];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.issued_at,
      r.course_number ?? "",
      r.patient_full_name ?? "",
      r.patient_age_years ?? "",
      r.diagnosis_short ?? "",
      r.template_name ?? "",
      (r.template_tags || []).join("; "),
      (r.item_names || []).join("; "),
      r.duration_days,
      r.status,
      r.total_cost_estimate ?? "",
    ].map(escapeCsv).join(","));
  }
  return "\uFEFF" + lines.join("\n");
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

  // Advanced search state
  const [searchResults, setSearchResults] = useState<SearchRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<string>("");

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
        .select("id, issued_at, diagnosis_short, duration_days, status, mode, course_number, patient:patients(id, full_name), items:treatment_plan_items(count)")
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

  const runAdvancedSearch = async (input: string) => {
    if (!input.trim()) { setSearchResults(null); setParsedInfo(""); return; }
    setSearching(true);
    try {
      const parsed = parseSearchQuery(input);
      const info: string[] = [];
      if (parsed.from || parsed.to) info.push(`📅 ${parsed.from ?? "…"} → ${parsed.to ?? "…"}`);
      if (parsed.costMin != null) info.push(`≥ ${parsed.costMin} ₽`);
      if (parsed.costMax != null) info.push(`≤ ${parsed.costMax} ₽`);
      if (parsed.ageMin != null || parsed.ageMax != null) info.push(`возраст ${parsed.ageMin ?? "…"}–${parsed.ageMax ?? "…"}`);
      if (parsed.text) info.push(`🔤 "${parsed.text}"`);
      setParsedInfo(info.join(" · "));

      const { data, error } = await supabase.rpc("search_treatment_plans", {
        _q: parsed.text || null,
        _from: parsed.from || null,
        _to: parsed.to || null,
        _cost_min: parsed.costMin ?? null,
        _cost_max: parsed.costMax ?? null,
        _age_min: parsed.ageMin ?? null,
        _age_max: parsed.ageMax ?? null,
        _limit: 500,
      });
      if (error) throw error;
      setSearchResults((data as unknown as SearchRow[]) || []);
    } catch (e: any) {
      toast.error("Ошибка поиска: " + (e?.message || e));
    } finally {
      setSearching(false);
    }
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAdvancedSearch(q);
  };

  const exportCsv = () => {
    if (!searchResults?.length) return;
    const blob = new Blob([searchToCsv(searchResults)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `treatment-plans-search-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => rows.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (modeFilter !== "all" && r.mode !== modeFilter) return false;
    if (dateRange?.from) {
      const d = new Date(r.issued_at);
      if (d < dateRange.from) return false;
      if (dateRange.to && d > new Date(dateRange.to.getTime() + 86400000 - 1)) return false;
    }
    return true;
  }), [rows, statusFilter, modeFilter, dateRange]);

  const hasFilters = statusFilter !== "all" || modeFilter !== "all" || !!dateRange?.from;
  const clearFilters = () => { setStatusFilter("all"); setModeFilter("all"); setDateRange(undefined); };
  const clearSearch = () => { setQ(""); setSearchResults(null); setParsedInfo(""); };

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
            <Link to="/admin/lab-tests-catalog">
              <Button variant="outline" className="gap-2"><Database className="w-4 h-4"/>Анализы</Button>
            </Link>
            <Link to="/admin/treatment-templates">
              <Button variant="outline" className="gap-2"><BookMarked className="w-4 h-4"/>Шаблоны</Button>
            </Link>
            <Link to="/admin/treatment-plans/new">
              <Button className="gap-2"><Plus className="w-4 h-4"/>Новый лист</Button>
            </Link>
          </div>
        </div>

        {/* Advanced search */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <form onSubmit={onSearchSubmit} className="flex gap-2 flex-wrap items-center">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="🔍 Найти курсы — по препарату, диагнозу, тегу, дате…"
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={searching} className="gap-2">
                {searching ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
                Найти
              </Button>
              {searchResults && (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={exportCsv} className="gap-2">
                    <Download className="w-4 h-4"/>CSV
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={clearSearch} className="gap-1">
                    <X className="w-3.5 h-3.5"/>Очистить
                  </Button>
                </>
              )}
            </form>
            {parsedInfo && (
              <div className="mt-2 text-xs text-muted-foreground">Распознано: {parsedInfo}</div>
            )}
            <div className="mt-2 text-xs text-muted-foreground">
              Примеры: <code>Берлитион 2025</code> · <code>диабет последний месяц</code> · <code>март &gt;50000</code> · <code>40-50 лет дорогие</code>
            </div>
          </CardContent>
        </Card>

        {!searchResults && (
          <div className="mb-4 flex gap-2 flex-wrap items-center">
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
        )}

        {searchResults ? (
          searchResults.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-50"/>
              Ничего не найдено по запросу.
            </CardContent></Card>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-3">Найдено {searchResults.length} курсов</div>
              <div className="grid gap-3">
                {searchResults.map((r) => (
                  <Card key={r.plan_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {r.course_number != null && <Badge variant="default" className="font-mono">№ {r.course_number}</Badge>}
                          {r.patient_id ? (
                            <Link to={`/admin/patients/${r.patient_id}`} className="font-medium hover:text-primary">{r.patient_full_name}</Link>
                          ) : (
                            <span className="font-medium">{r.patient_full_name || "Без пациента"}</span>
                          )}
                          {r.patient_age_years != null && <Badge variant="outline">{r.patient_age_years} лет</Badge>}
                          <Badge variant={r.status === "issued" ? "default" : r.status === "archived" ? "secondary" : "outline"}>{r.status}</Badge>
                          {r.template_name && <Badge variant="outline" className="gap-1"><BookMarked className="w-3 h-3"/>{r.template_name}</Badge>}
                          {(r.template_tags || []).slice(0, 4).map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                          <Badge variant="outline">{fmtCost(r.total_cost_estimate)}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {format(new Date(r.issued_at), "d MMMM yyyy", { locale: ru })} · {r.duration_days} дн.
                          {r.diagnosis_short ? ` · ${r.diagnosis_short}` : ""}
                        </div>
                        {r.snippet && (
                          <div
                            className="text-sm mt-2 text-muted-foreground [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-800/60 [&_mark]:text-foreground [&_mark]:rounded [&_mark]:px-0.5"
                            dangerouslySetInnerHTML={{ __html: r.snippet }}
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/admin/treatment-plans/${r.plan_id}`}><Button size="sm" variant="outline">Открыть</Button></Link>
                        <Link to={`/admin/treatment-plans/${r.plan_id}/print`} target="_blank">
                          <Button size="sm" variant="outline" className="gap-1"><Printer className="w-3.5 h-3.5"/>Печать</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )
        ) : busy ? (
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
                      {r.course_number != null && (
                        <Badge variant="default" className="font-mono">№ {r.course_number}</Badge>
                      )}
                      {r.patient?.id ? (
                        <Link to={`/admin/patients/${r.patient.id}`} className="font-medium text-foreground hover:text-primary" title="Курсы пациента">
                          {r.patient.full_name}
                        </Link>
                      ) : (
                        <Link to={`/admin/treatment-plans/${r.id}`} className="font-medium text-foreground hover:text-primary">
                          Без пациента
                        </Link>
                      )}
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
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setDupTarget(r)} title="Дублировать на другого пациента">
                      <UserPlus className="w-3.5 h-3.5"/>
                    </Button>
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

      {dupTarget && user && (
        <DuplicatePlanDialog
          open={!!dupTarget}
          onOpenChange={(v) => { if (!v) setDupTarget(null); }}
          sourcePlanId={dupTarget.id}
          sourcePatientName={dupTarget.patient?.full_name}
          userId={user.id}
        />
      )}
    </div>
  );
}
