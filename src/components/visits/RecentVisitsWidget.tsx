import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ClipboardList, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PROTOCOL_TYPE_MAP, ProtocolType } from "@/lib/visits/protocolTypes";

interface Row {
  id: string;
  visit_date: string;
  protocol_type: ProtocolType;
  diagnosis: string | null;
  patient: { full_name: string } | null;
}

export function RecentVisitsWidget() {
  const [items, setItems] = useState<Row[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data }, { count: total }] = await Promise.all([
        supabase
          .from("patient_visits")
          .select("id, visit_date, created_at, protocol_type, diagnosis, patient:patients(full_name)")
          .order("created_at", { ascending: false })
          .limit(5),

        supabase.from("patient_visits").select("*", { count: "exact", head: true }),
      ]);
      setItems((data || []) as any);
      setCount(total || 0);
      setLoading(false);
    })();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Последние протоколы визитов</CardTitle>
          <span className="text-xs text-muted-foreground">всего: {count}</span>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/visits">Журнал</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/visits/new"><Plus className="h-4 w-4 mr-1" />Новый</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Пока нет протоколов</div>
        ) : (
          <div className="divide-y">
            {items.map((v) => (
              <Link key={v.id} to={`/admin/visits/${v.id}`} className="flex items-center justify-between py-2 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{v.patient?.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {PROTOCOL_TYPE_MAP[v.protocol_type]?.title || v.protocol_type}
                    {v.diagnosis ? ` • ${v.diagnosis}` : ""}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-mono ml-3 flex-shrink-0">
                  {format(new Date(v.visit_date), "dd.MM.yyyy")}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
