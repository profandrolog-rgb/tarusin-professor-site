import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pointId: string;
  pointWhoCode: string;
  defaultManipulation: string | null;
  onAdded?: () => void;
}

interface ProtocolRow {
  id: string;
  name: string;
  is_template: boolean;
  created_by: string | null;
}

export default function AddPointToProtocolDialog({
  open, onOpenChange, pointId, pointWhoCode, defaultManipulation, onAdded,
}: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<ProtocolRow[]>([]);
  const [q, setQ] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setBusy(true);
    (async () => {
      const { data } = await supabase
        .from("acupuncture_protocols")
        .select("id,name,is_template,created_by")
        .eq("is_archived", false)
        .eq("is_template", false)
        .eq("created_by", user.id)
        .order("name");
      setList((data as any) || []);
      setBusy(false);
    })();
  }, [open, user]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return qq ? list.filter((p) => p.name.toLowerCase().includes(qq)) : list;
  }, [list, q]);

  const addToProtocol = async (protocolId: string) => {
    setSavingId(protocolId);
    try {
      const { data: maxRow } = await supabase
        .from("acupuncture_protocol_points")
        .select("order_index")
        .eq("protocol_id", protocolId)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextIdx = ((maxRow as any)?.order_index ?? -1) + 1;

      const { error } = await supabase.from("acupuncture_protocol_points").insert({
        protocol_id: protocolId,
        acupoint_id: pointId,
        order_index: nextIdx,
        manipulation: defaultManipulation || null,
        side: "bilateral",
      });
      if (error) throw error;
      toast.success(`Точка ${pointWhoCode} добавлена в протокол`);
      onAdded?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Не удалось добавить", { description: e?.message });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить точку {pointWhoCode} в протокол</DialogTitle>
          <DialogDescription>
            Только ваши пользовательские протоколы. Манипуляция предзаполнится из «по умолчанию» точки.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Поиск по названию..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <ScrollArea className="h-[320px]">
          {busy ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {list.length === 0 ? "У вас пока нет пользовательских протоколов" : "Ничего не найдено"}
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2 px-1">
                  <span className="text-sm">{p.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={savingId === p.id}
                    onClick={() => addToProtocol(p.id)}
                  >
                    {savingId === p.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <><Check className="w-3 h-3 mr-1" />Добавить</>
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
