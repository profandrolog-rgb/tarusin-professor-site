import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Loader2, Search, Archive, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Protocol {
  id: string;
  name: string;
  description: string | null;
  indications: string | null;
  session_count: number | null;
  session_duration_min: number | null;
  frequency: string | null;
  tags: string[] | null;
  is_archived: boolean;
  updated_at: string;
}

export default function AdminAcupunctureProtocols() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(true);
  const [list, setList] = useState<Protocol[]>([]);
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/acupuncture-protocols" } });
    }
  }, [user, isAdmin, loading, navigate]);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("acupuncture_protocols" as any)
      .select("id,name,description,indications,session_count,session_duration_min,frequency,tags,is_archived,updated_at")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setList(((data as any[]) || []) as Protocol[]);
    setBusy(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const createNew = async () => {
    const { data, error } = await supabase
      .from("acupuncture_protocols" as any)
      .insert({ name: "Новый протокол ИРТ", session_count: 10, session_duration_min: 30 } as any)
      .select("id").maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (data) navigate(`/admin/acupuncture-protocols/${(data as any).id}`);
  };

  const filtered = list.filter(p => {
    if (!showArchived && p.is_archived) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return p.name.toLowerCase().includes(s)
      || (p.indications || "").toLowerCase().includes(s)
      || (p.tags || []).some(t => t.toLowerCase().includes(s));
  });

  if (loading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/treatment-plans"><ArrowLeft className="w-4 h-4 mr-2"/>Назад</Link>
            </Button>
            <h1 className="text-2xl font-bold">Протоколы ИРТ</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/acupoints"><MapPin className="w-4 h-4 mr-2"/>Точки ИРТ</Link>
            </Button>
            <Button onClick={createNew}><Plus className="w-4 h-4 mr-2"/>Новый протокол</Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию, показаниям, тегам…" className="pl-9"/>
              </div>
              <Button variant={showArchived ? "default" : "outline"} size="sm" onClick={() => setShowArchived(!showArchived)}>
                <Archive className="w-4 h-4 mr-2"/>Архив
              </Button>
            </div>
          </CardContent>
        </Card>

        {busy ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Протоколов пока нет. Нажмите «Новый протокол».</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map(p => (
              <Card key={p.id} className="hover:border-primary/40 transition-colors">
                <Link to={`/admin/acupuncture-protocols/${p.id}`} className="block">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base truncate">{p.name}</h3>
                          {p.is_archived && <Badge variant="outline" className="text-xs">Архив</Badge>}
                        </div>
                        {p.indications && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{p.indications}</p>}
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {(p.tags || []).map(t => <Badge key={t} variant="secondary" className="font-normal">{t}</Badge>)}
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground shrink-0">
                        <div>{p.session_count ?? "—"} сеансов</div>
                        <div>{p.session_duration_min ?? "—"} мин</div>
                        {p.frequency && <div className="mt-1">{p.frequency}</div>}
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
