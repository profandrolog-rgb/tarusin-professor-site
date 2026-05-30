import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PROTOCOL_TYPES } from "@/lib/visits/protocolTypes";

interface Tpl {
  id: string;
  protocol_type: string | null;
  operation_keywords: string[] | null;
  day_range: string;
  field_key: string;
  template_text: string;
  label: string;
  sort_order: number;
}

const FIELD_KEYS = [
  { key: "general_status", label: "Соматический / общее состояние" },
  { key: "local_status", label: "Локальный статус" },
  { key: "wound_status", label: "Состояние раны" },
  { key: "uzi_express", label: "Экспресс-УЗИ" },
  { key: "conclusion", label: "Заключение" },
  { key: "recommendations", label: "Рекомендации" },
  { key: "neuro_status", label: "Неврологический статус" },
  { key: "psych_status", label: "Психологический статус" },
  { key: "sport_limit", label: "Ограничения по спорту" },
];

const DAY_RANGES = ["any", "3", "7", "10", "5-7", "7-10"];

export default function AdminVisitTemplates() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [list, setList] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!authLoading && user && !isAdmin) navigate("/");
  }, [authLoading, user, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("visit_text_templates" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setList(((data as any) || []) as Tpl[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const update = (id: string, patch: Partial<Tpl>) =>
    setList((l) => l.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const save = async (t: Tpl) => {
    setSavingId(t.id);
    const { error } = await (supabase as any)
      .from("visit_text_templates")
      .update({
        protocol_type: t.protocol_type || null,
        operation_keywords: t.operation_keywords && t.operation_keywords.length ? t.operation_keywords : null,
        day_range: t.day_range || "any",
        field_key: t.field_key,
        template_text: t.template_text,
        label: t.label,
        sort_order: t.sort_order,
      })
      .eq("id", t.id);
    setSavingId(null);
    if (error) toast({ title: "Не удалось сохранить", description: error.message, variant: "destructive" });
    else toast({ title: "Сохранено" });
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить шаблон?")) return;
    const { error } = await (supabase as any).from("visit_text_templates").delete().eq("id", id);
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    else { setList((l) => l.filter((t) => t.id !== id)); toast({ title: "Удалено" }); }
  };

  const add = async () => {
    const { data, error } = await (supabase as any)
      .from("visit_text_templates")
      .insert({
        protocol_type: null,
        operation_keywords: null,
        day_range: "any",
        field_key: "recommendations",
        template_text: "",
        label: "Новый шаблон",
        sort_order: 999,
      })
      .select()
      .single();
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    else if (data) setList((l) => [...l, data as Tpl]);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> В админку</Link>
            </Button>
            <h1 className="text-2xl font-bold">Шаблоны текстов протоколов</h1>
          </div>
          <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Добавить шаблон</Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Шаблоны вставляются по кнопке ⚡ в формах визитов. Приоритет: операционный (по ключевому слову и сутке) → универсальный по типу → универсальный для всех.
        </p>

        <div className="space-y-3">
          {list.map((t) => (
            <Card key={t.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Input
                    className="text-base font-semibold flex-1 min-w-[240px]"
                    value={t.label}
                    onChange={(e) => update(t.id, { label: e.target.value })}
                  />
                  <div className="flex items-center gap-1">
                    <Button size="sm" onClick={() => save(t)} disabled={savingId === t.id}>
                      {savingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label>Тип протокола</Label>
                    <Select
                      value={t.protocol_type || "__all__"}
                      onValueChange={(v) => update(t.id, { protocol_type: v === "__all__" ? null : v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Все типы</SelectItem>
                        {PROTOCOL_TYPES.map((p) => (
                          <SelectItem key={p.key} value={p.key}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Сутки</Label>
                    <Select value={t.day_range} onValueChange={(v) => update(t.id, { day_range: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DAY_RANGES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Поле</Label>
                    <Select value={t.field_key} onValueChange={(v) => update(t.id, { field_key: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIELD_KEYS.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Порядок</Label>
                    <Input
                      type="number"
                      value={t.sort_order}
                      onChange={(e) => update(t.id, { sort_order: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Ключевые слова операции (через запятую, пусто = универсальный)</Label>
                  <Input
                    value={(t.operation_keywords || []).join(", ")}
                    placeholder="пластика крайней плоти, обрезание"
                    onChange={(e) => {
                      const kw = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                      update(t.id, { operation_keywords: kw.length ? kw : null });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Текст шаблона</Label>
                  <Textarea
                    rows={5}
                    value={t.template_text}
                    onChange={(e) => update(t.id, { template_text: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          {list.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">Нет шаблонов</div>
          )}
        </div>
      </div>
    </div>
  );
}
