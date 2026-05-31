import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Loader2, Pencil, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

interface Patient {
  id: string;
  full_name: string;
  birth_date: string | null;
  phone: string | null;
  history_number: string | null;
}

export default function AdminPatients() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState<Patient[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      let q = supabase
        .from("patients")
        .select("id, full_name, birth_date, phone, history_number")
        .order("full_name", { ascending: true })
        .limit(50);
      if (debounced) {
        const esc = debounced.replace(/[%,]/g, " ");
        q = q.or(`full_name.ilike.%${esc}%,history_number.ilike.%${esc}%`);
      }
      const { data } = await q;
      if (!cancelled) {
        setRows((data as any[]) || []);
        setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debounced]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Пациенты</title><meta name="robots" content="noindex" /></Helmet>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4"/>В админ-панель
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-3xl font-bold">База пациентов</h1>
          <Link to="/admin/patients/new">
            <Button className="gap-2"><Plus className="w-4 h-4"/>Новый пациент</Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Поиск по ФИО или № ИБ…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <div className="text-xs text-muted-foreground">
              {busy ? "Поиск…" : `Найдено: ${rows.length}${rows.length === 50 ? " (лимит)" : ""}`}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Дата рождения</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>№ ИБ</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && !busy ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Ничего не найдено</TableCell></TableRow>
                ) : rows.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell>{p.birth_date ? format(parseISO(p.birth_date), "d MMM yyyy", { locale: ru }) : "—"}</TableCell>
                    <TableCell>{p.phone || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{p.history_number || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Link to={`/admin/patients/${p.id}`}><Button size="sm" variant="ghost" title="Открыть"><FileText className="w-3.5 h-3.5"/></Button></Link>
                        <Link to={`/admin/patients/${p.id}/edit`}><Button size="sm" variant="ghost" title="Редактировать"><Pencil className="w-3.5 h-3.5"/></Button></Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
