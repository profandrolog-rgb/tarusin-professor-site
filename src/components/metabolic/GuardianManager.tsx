import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Guardian = { id: string; user_id: string; relation: string | null; created_at: string };

/**
 * Управление привязкой родителей к пациенту + доктор-контролируемый флаг
 * `share_simple_only` (родитель видит только упрощённый текст без цифр).
 */
export function GuardianManager({
  patientId,
  shareSimpleOnly,
  onShareChange,
}: {
  patientId: string;
  shareSimpleOnly: boolean;
  onShareChange: (v: boolean) => void;
}) {
  const [busy, setBusy] = useState(true);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState("родитель");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setBusy(true);
    const { data } = await (supabase as any)
      .from("patient_guardians")
      .select("id, user_id, relation, created_at")
      .eq("patient_id", patientId);
    setGuardians((data as any) || []);
    setBusy(false);
  };
  useEffect(() => { load(); }, [patientId]);

  const emails = useMemo(() => new Map<string, string>(), []);
  // (email lookup by user_id — best-effort; requires admin RPC we skip for MVP)

  const addGuardian = async () => {
    if (!email.trim()) return;
    setSaving(true);
    try {
      // Ищем пользователя по email через профили (если такое есть)
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("id, email")
        .eq("email", email.trim())
        .maybeSingle();
      if (!profile?.id) {
        toast({
          title: "Пользователь не найден",
          description: "Родитель должен сначала зарегистрироваться в кабинете под этим email.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      const { error } = await (supabase as any).from("patient_guardians").insert({
        patient_id: patientId,
        user_id: profile.id,
        relation: relation || null,
      });
      if (error) throw error;
      toast({ title: "Родитель привязан" });
      setEmail("");
      await load();
    } catch (e: any) {
      toast({ title: "Не удалось привязать", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from("patient_guardians").delete().eq("id", id);
    if (error) {
      toast({ title: "Не удалось удалить", description: error.message, variant: "destructive" });
      return;
    }
    await load();
  };

  const toggleShare = async (v: boolean) => {
    onShareChange(v);
    const { error } = await (supabase as any)
      .from("patients")
      .update({ share_simple_only: v })
      .eq("id", patientId);
    if (error) toast({ title: "Не сохранено", description: error.message, variant: "destructive" });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          Доступ родителя
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="flex items-start gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={shareSimpleOnly}
            onChange={(e) => toggleShare(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Показывать родителю <b>только упрощённую карту без цифр</b>. Снимите галочку, чтобы
            родитель видел и профессиональный текст.
          </span>
        </label>

        <div className="flex flex-wrap items-end gap-2 pt-2 border-t">
          <div className="flex-1 min-w-[220px]">
            <Label className="text-xs">Email родителя</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="parent@example.com" />
          </div>
          <div className="w-40">
            <Label className="text-xs">Кем приходится</Label>
            <Input value={relation} onChange={(e) => setRelation(e.target.value)} />
          </div>
          <Button size="sm" onClick={addGuardian} disabled={saving || !email.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Привязать"}
          </Button>
        </div>

        {busy ? (
          <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
        ) : guardians.length === 0 ? (
          <div className="text-xs italic text-muted-foreground">Родители не привязаны.</div>
        ) : (
          <ul className="space-y-1 text-xs">
            {guardians.map((g) => (
              <li key={g.id} className="flex items-center justify-between rounded border px-2 py-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{g.relation || "родитель"}</Badge>
                  <span className="font-mono text-[11px] text-muted-foreground">{g.user_id.slice(0, 8)}…</span>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => remove(g.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
