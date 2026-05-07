import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeft, Loader2, Trash2, Users, CalendarDays, BarChart3, Hash } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { format, subDays, startOfDay, isAfter } from "date-fns";
import { ru } from "date-fns/locale";

const LEVEL_COLORS: Record<string, string> = { low: "#22c55e", medium: "#eab308", high: "#ef4444" };
const LEVEL_LABELS: Record<string, string> = { low: "Низкий", medium: "Умеренный", high: "Высокий" };

type Response = {
  id: string;
  checklist_slug: string;
  answers: Record<string, string>;
  result_level: string;
  result_score: number | null;
  duration_sec: number | null;
  anonymous_id: string | null;
  user_agent: string | null;
  created_at: string;
};

const AdminSelfCheck = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("30d");
  const [slugFilter, setSlugFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedRow, setSelectedRow] = useState<Response | null>(null);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/auth", { state: { from: "/admin/self-check" } });
  }, [user, isAdmin, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("checklist_responses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (!error && rows) setData(rows as unknown as Response[]);
    setLoading(false);
  };

  useEffect(() => { if (user && isAdmin) fetchData(); }, [user, isAdmin]);

  const filterDate = useMemo(() => {
    if (periodFilter === "today") return startOfDay(new Date());
    if (periodFilter === "7d") return subDays(new Date(), 7);
    if (periodFilter === "30d") return subDays(new Date(), 30);
    return null;
  }, [periodFilter]);

  const filtered = useMemo(() => {
    return data.filter(r => {
      if (filterDate && !isAfter(new Date(r.created_at), filterDate)) return false;
      if (slugFilter !== "all" && r.checklist_slug !== slugFilter) return false;
      if (levelFilter !== "all" && r.result_level !== levelFilter) return false;
      return true;
    });
  }, [data, filterDate, slugFilter, levelFilter]);

  const uniqueSlugs = useMemo(() => [...new Set(data.map(r => r.checklist_slug))], [data]);

  // Metrics
  const total = filtered.length;
  const last7 = data.filter(r => isAfter(new Date(r.created_at), subDays(new Date(), 7))).length;
  const last30 = data.filter(r => isAfter(new Date(r.created_at), subDays(new Date(), 30))).length;
  const uniqueUsers = new Set(data.filter(r => r.anonymous_id).map(r => r.anonymous_id)).size;

  // Pie data
  const pieData = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0 };
    filtered.forEach(r => { if (counts[r.result_level] !== undefined) counts[r.result_level]++; });
    return Object.entries(counts).map(([k, v]) => ({ name: LEVEL_LABELS[k], value: v, fill: LEVEL_COLORS[k] }));
  }, [filtered]);

  // Line chart - last 30 days
  const lineData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "dd.MM");
      days[d] = 0;
    }
    filtered.forEach(r => {
      const d = format(new Date(r.created_at), "dd.MM");
      if (days[d] !== undefined) days[d]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [filtered]);

  // Bar chart by slug
  const barData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(r => { counts[r.checklist_slug] = (counts[r.checklist_slug] || 0) + 1; });
    return Object.entries(counts).map(([slug, count]) => ({ slug, count }));
  }, [filtered]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleDelete = async (id: string) => {
    await supabase.from("checklist_responses").delete().eq("id", id);
    setData(prev => prev.filter(r => r.id !== id));
    setSelectedRow(null);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Админ-панель
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2">Самодиагностика — Статистика</h1>
        <p className="text-muted-foreground mb-8">Результаты прохождений тестов</p>

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Всего прохождений", value: data.length, icon: Hash },
            { label: "За 7 дней", value: last7, icon: CalendarDays },
            { label: "За 30 дней", value: last30, icon: BarChart3 },
            { label: "Уникальных пользователей", value: uniqueUsers, icon: Users },
          ].map(m => (
            <Card key={m.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><m.icon className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={periodFilter} onValueChange={v => { setPeriodFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Сегодня</SelectItem>
              <SelectItem value="7d">7 дней</SelectItem>
              <SelectItem value="30d">30 дней</SelectItem>
              <SelectItem value="all">Всё время</SelectItem>
            </SelectContent>
          </Select>
          <Select value={slugFilter} onValueChange={v => { setSlugFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все чек-листы</SelectItem>
              {uniqueSlugs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={v => { setLevelFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все уровни</SelectItem>
              <SelectItem value="low">Низкий</SelectItem>
              <SelectItem value="medium">Умеренный</SelectItem>
              <SelectItem value="high">Высокий</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Распределение по уровню</CardTitle></CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Прохождения по дням</CardTitle></CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">По чек-листам</CardTitle></CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="slug" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Последние прохождения ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Чек-лист</TableHead>
                    <TableHead>Уровень</TableHead>
                    <TableHead>Баллы</TableHead>
                    <TableHead>Длительность</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(r => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRow(r)}>
                      <TableCell className="text-sm">{format(new Date(r.created_at), "dd.MM.yyyy HH:mm", { locale: ru })}</TableCell>
                      <TableCell className="text-sm">{r.checklist_slug}</TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ borderColor: LEVEL_COLORS[r.result_level], color: LEVEL_COLORS[r.result_level] }}>
                          {LEVEL_LABELS[r.result_level] || r.result_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.result_score ?? "—"}</TableCell>
                      <TableCell className="text-sm">{r.duration_sec ? `${r.duration_sec}с` : "—"}</TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{r.anonymous_id?.slice(0, 8) || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {paged.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Нет данных</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Назад</Button>
                <span className="text-sm text-muted-foreground">Страница {page + 1} из {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Вперёд</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail sheet */}
        <Sheet open={!!selectedRow} onOpenChange={() => setSelectedRow(null)}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Детали прохождения</SheetTitle>
            </SheetHeader>
            {selectedRow && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Дата:</span> {format(new Date(selectedRow.created_at), "dd.MM.yyyy HH:mm:ss")}</p>
                  <p><span className="text-muted-foreground">Чек-лист:</span> {selectedRow.checklist_slug}</p>
                  <p><span className="text-muted-foreground">Уровень:</span> <Badge variant="outline" style={{ borderColor: LEVEL_COLORS[selectedRow.result_level], color: LEVEL_COLORS[selectedRow.result_level] }}>{LEVEL_LABELS[selectedRow.result_level]}</Badge></p>
                  <p><span className="text-muted-foreground">Баллы:</span> {selectedRow.result_score ?? "—"}</p>
                  <p><span className="text-muted-foreground">Длительность:</span> {selectedRow.duration_sec ? `${selectedRow.duration_sec}с` : "—"}</p>
                  <p><span className="text-muted-foreground">Anonymous ID:</span> <span className="font-mono text-xs">{selectedRow.anonymous_id || "—"}</span></p>
                  <p><span className="text-muted-foreground">User Agent:</span> <span className="text-xs break-all">{selectedRow.user_agent || "—"}</span></p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Ответы</h4>
                  <div className="space-y-1">
                    {Object.entries(selectedRow.answers || {}).map(([q, a]) => (
                      <div key={q} className="text-sm p-2 rounded bg-muted/50">
                        <span className="text-muted-foreground">{q}:</span> <span className="font-medium">{String(a)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedRow.id)} className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" /> Удалить запись
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default AdminSelfCheck;
