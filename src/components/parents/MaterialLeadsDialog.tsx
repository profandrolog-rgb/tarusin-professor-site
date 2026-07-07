import { useEffect, useState } from "react";
import { Users, Loader2, Mail, Phone, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  user_agent: string | null;
  referrer: string | null;
}

interface Props {
  materialId: string;
  materialTitle: string;
}

const MaterialLeadsDialog = ({ materialId, materialTitle }: Props) => {
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const loadCount = async () => {
    const { count: c } = await supabase
      .from("parents_material_leads" as any)
      .select("id", { count: "exact", head: true })
      .eq("material_id", materialId);
    setCount(c ?? 0);
  };

  useEffect(() => { void loadCount(); }, [materialId]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("parents_material_leads" as any)
        .select("id, name, email, phone, created_at, user_agent, referrer")
        .eq("material_id", materialId)
        .order("created_at", { ascending: false });
      setLeads((data as unknown as Lead[]) ?? []);
      setLoading(false);
    })();
  }, [open, materialId]);

  const exportCsv = () => {
    const rows = [
      ["Дата", "Имя", "Email", "Телефон", "Referrer"],
      ...leads.map((l) => [
        new Date(l.created_at).toLocaleString("ru-RU"),
        l.name ?? "",
        l.email ?? "",
        l.phone ?? "",
        l.referrer ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${materialId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 gap-1 px-2 text-xs">
          <Users className="w-3 h-3" />Заявок: {count ?? "…"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />Заявки на памятку
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{materialTitle}</p>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 border-b pb-2">
          <Badge variant="secondary">Всего: {leads.length}</Badge>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!leads.length} className="gap-1">
            <Download className="w-3.5 h-3.5" />Экспорт CSV
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : leads.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">Пока никто не оставлял контакты.</p>
          ) : (
            <div className="divide-y">
              {leads.map((l) => (
                <div key={l.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium">{l.name || <span className="text-muted-foreground italic">без имени</span>}</span>
                    <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("ru-RU")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm flex-wrap">
                    {l.email && (
                      <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Mail className="w-3.5 h-3.5" />{l.email}
                      </a>
                    )}
                    {l.phone && (
                      <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Phone className="w-3.5 h-3.5" />{l.phone}
                      </a>
                    )}
                  </div>
                  {l.referrer && <p className="text-xs text-muted-foreground truncate">Источник: {l.referrer}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialLeadsDialog;
