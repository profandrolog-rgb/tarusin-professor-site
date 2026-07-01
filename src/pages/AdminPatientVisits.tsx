import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Loader2, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PROTOCOL_TYPES, PROTOCOL_TYPE_MAP, ProtocolType } from "@/lib/visits/protocolTypes";

interface VisitRow {
  id: string;
  visit_date: string;
  protocol_type: ProtocolType;
  diagnosis: string | null;
  icd_code: string | null;
  patient: { id: string; full_name: string; history_number: string | null } | null;
}

export default function AdminPatientVisits() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, isSurgeon } = useAuth();
  const [rows, setRows] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateSortDir, setDateSortDir] = useState<"asc" | "desc">("desc");
  const [dateSearch, setDateSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && user && !isAdmin && !isSurgeon) navigate("/");
  }, [authLoading, user, isAdmin, isSurgeon, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let q = supabase
        .from("patient_visits")
        .select("id, visit_date, protocol_type, diagnosis, icd_code, patient:patients(id, full_name, history_number)")
        .order("visit_date", { ascending: false })
        .limit(200);
      if (typeFilter !== "all") q = q.eq("protocol_type", typeFilter);
      const { data, error } = await q;
      if (!error) setRows((data as any) || []);
      setLoading(false);
    };
    if (user && (isAdmin || isSurgeon)) load();
  }, [user, isAdmin, isSurgeon, typeFilter]);

  const displayRows = useMemo(() => {
    let data = rows.filter((r) => {
      const s = search.toLowerCase();
      const matchesSearch = !search || (
        r.patient?.full_name?.toLowerCase().includes(s) ||
        r.patient?.history_number?.toLowerCase().includes(s) ||
        r.diagnosis?.toLowerCase().includes(s) ||
        r.icd_code?.toLowerCase().includes(s)
      );
      const matchesDate = !dateSearch || format(new Date(r.visit_date), "yyyy-MM-dd") === dateSearch;
      return matchesSearch && matchesDate;
    });
    data.sort((a, b) => {
      const da = new Date(a.visit_date).getTime();
      const db = new Date(b.visit_date).getTime();
      return dateSortDir === "asc" ? da - db : db - da;
    });
    return data;
  }, [rows, search, dateSearch, dateSortDir]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> В админ-панель</Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Журнал визитов</h1>
          </div>
          <Button asChild>
            <Link to="/admin/visits/new"><Plus className="h-4 w-4 mr-1" /> Новый протокол</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Фильтры</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Input
              placeholder="Поиск по ФИО, ИБ, диагнозу, МКБ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы протоколов</SelectItem>
                {PROTOCOL_TYPES.map((p) => (
                  <SelectItem key={p.key} value={p.key}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : displayRows.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">Визитов пока нет. Создайте первый протокол.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>№ ИБ</TableHead>
                    <TableHead>Пациент</TableHead>
                    <TableHead>Тип протокола</TableHead>
                    <TableHead>МКБ</TableHead>
                    <TableHead>Диагноз</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono">{format(new Date(r.visit_date), "dd.MM.yyyy")}</TableCell>
                      <TableCell className="font-mono">{r.patient?.history_number || "—"}</TableCell>
                      <TableCell>{r.patient?.full_name || "—"}</TableCell>
                      <TableCell>{PROTOCOL_TYPE_MAP[r.protocol_type]?.title || r.protocol_type}</TableCell>
                      <TableCell className="font-mono">{r.icd_code || "—"}</TableCell>
                      <TableCell className="max-w-md truncate">{r.diagnosis || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/visits/${r.id}`}>Открыть</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
