import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PlanItem } from "./PlanItemRow";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: PlanItem[];
  mode: "flat" | "scheduled";
  durationDays: number;
  userId: string;
  onSaved?: () => void;
}

export function SaveAsTemplateDialog({ open, onOpenChange, items, mode, durationDays, userId, onSaved }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const reset = () => { setName(""); setDescription(""); setTarget(""); setTags([]); setTagInput(""); };

  const save = async () => {
    if (!name.trim()) { toast({ title: "Введите название шаблона", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const { data: tpl, error: e1 } = await supabase.from("protocol_templates").insert({
        name: name.trim(),
        description: description.trim() || null,
        target_patient: target.trim() || null,
        tags: tags.length ? tags : null,
        mode,
        duration_days: durationDays,
        created_by: userId,
      } as any).select("id").single();
      if (e1 || !tpl) throw e1 || new Error("save failed");

      if (items.length) {
        const rows = items.map((it, idx) => ({
          template_id: tpl.id,
          catalog_id: it.catalog_id || null,
          section_category: it.section_category,
          order_index: idx,
          name_snapshot: it.name_snapshot,
          dose: it.dose,
          dose_unit: it.dose_unit,
          dilution_volume: it.dilution_volume,
          dilution_solvent: it.dilution_solvent,
          frequency: it.frequency,
          duration_days: it.duration_days,
          day_pattern: it.day_pattern || null,
          time_of_day: it.time_of_day,
          infusion_rate: it.infusion_rate,
          route_override: it.route_override,
          notes: it.notes,
        }));
        const { error: e2 } = await supabase.from("protocol_template_items").insert(rows as any);
        if (e2) throw e2;
      }
      toast({ title: "Шаблон создан" });
      reset();
      onOpenChange(false);
      onSaved?.();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || String(e), variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Сохранить как шаблон</DialogTitle>
          <DialogDescription>
            {items.length} позиций будут сохранены в библиотеке шаблонов (режим: {mode === "flat" ? "плоский" : "по дням"}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Название *</Label>
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Например: Базовая метаболическая поддержка"/>
          </div>
          <div>
            <Label>Целевой профиль пациента</Label>
            <Input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Мужчина 37–50, гипогонадизм, метаболический синдром"/>
          </div>
          <div>
            <Label>Описание</Label>
            <Textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2}/>
          </div>
          <div>
            <Label>Теги</Label>
            <div className="flex gap-1">
              <Input value={tagInput} onChange={e=>setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="введите тег и Enter"/>
              <Button type="button" variant="outline" onClick={addTag}>+</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded px-2 py-0.5 text-xs">
                    {t}
                    <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setTags(tags.filter(x => x !== t))}/>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Отмена</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
            Сохранить шаблон
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
