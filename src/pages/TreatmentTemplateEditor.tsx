import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Save, X, CalendarDays, List } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SECTIONS, TreatmentCategory } from "@/components/treatment/sections";
import { CatalogPicker, CatalogItem } from "@/components/treatment/CatalogPicker";
import { PlanItemRow, PlanItem } from "@/components/treatment/PlanItemRow";
import { GanttHeader } from "@/components/treatment/GanttStrip";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto) ? crypto.randomUUID() : Math.random().toString(36).slice(2);

function fromCatalog(c: CatalogItem, section: TreatmentCategory, mode: "flat" | "scheduled", duration: number | null): PlanItem {
  const it: PlanItem = {
    client_id: newId(), catalog_id: c.id, section_category: section,
    name_snapshot: c.name, inn_snapshot: c.inn, form_snapshot: c.form,
    dose: c.default_dose, dose_unit: c.dose_unit,
    dilution_volume: c.default_dilution_volume, dilution_solvent: c.default_dilution_solvent,
    frequency: c.default_frequency, duration_days: c.default_duration_days,
    time_of_day: c.time_of_day_default || [], infusion_rate: c.infusion_rate,
    notes: c.notes, is_off_label: c.is_off_label, light_sensitive: c.light_sensitive,
    glucose_only: c.glucose_only, dose_range_min: c.dose_range_min, dose_range_max: c.dose_range_max,
  };
  if (mode === "scheduled" && duration) it.day_pattern = `1-${duration}`;
  return it;
}

export default function TreatmentTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState<"flat" | "scheduled">("flat");
  const [durationDays, setDurationDays] = useState<number>(10);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [items, setItems] = useState<PlanItem[]>([]);
  const [tplId, setTplId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: `/admin/treatment-templates/${id || "new"}` } });
  }, [user, isAdmin, loading, navigate, id]);

  useEffect(() => {
    (async () => {
      setBusy(true);
      if (isNew) { setBusy(false); return; }
      setTplId(id!);
      const { data: t } = await supabase.from("protocol_templates").select("*").eq("id", id!).maybeSingle();
      if (t) {
        setName(t.name); setDescription(t.description || ""); setTarget(t.target_patient || "");
        setMode((t.mode as any) || "flat"); setDurationDays(t.duration_days || 10);
        setTags(t.tags || []);
      }
      const { data: rows } = await supabase.from("protocol_template_items").select("*").eq("template_id", id!).order("section_category").order("order_index");
      // hydrate inn/form/flags from catalog where possible
      const catIds = (rows || []).map((r: any) => r.catalog_id).filter(Boolean) as string[];
      let catMap = new Map<string, any>();
      if (catIds.length) {
        const { data: cat } = await supabase.from("treatment_catalog").select("*").in("id", catIds);
        catMap = new Map((cat || []).map((c: any) => [c.id, c]));
      }
      setItems((rows || []).map((r: any): PlanItem => {
        const c = r.catalog_id ? catMap.get(r.catalog_id) : null;
        return {
          client_id: newId(), catalog_id: r.catalog_id, section_category: r.section_category,
          name_snapshot: r.name_snapshot || c?.name || "—",
          inn_snapshot: c?.inn ?? null, form_snapshot: c?.form ?? null,
          dose: r.dose, dose_unit: r.dose_unit, dilution_volume: r.dilution_volume, dilution_solvent: r.dilution_solvent,
          frequency: r.frequency, duration_days: r.duration_days, day_pattern: r.day_pattern,
          time_of_day: r.time_of_day || [], infusion_rate: r.infusion_rate, route_override: r.route_override,
          notes: r.notes, is_off_label: !!c?.is_off_label,
          light_sensitive: !!c?.light_sensitive, glucose_only: !!c?.glucose_only,
          dose_range_min: c?.dose_range_min ?? null, dose_range_max: c?.dose_range_max ?? null,
        };
      }));
      setBusy(false);
    })();
  }, [id, isNew]);

  const addItem = (section: TreatmentCategory, c: CatalogItem) => setItems(p => [...p, fromCatalog(c, section, mode, durationDays)]);
  const updateItem = (cid: string, patch: Partial<PlanItem>) => setItems(p => p.map(i => i.client_id === cid ? { ...i, ...patch } : i));
  const removeItem = (cid: string) => setItems(p => p.filter(i => i.client_id !== cid));
  const addTag = () => { const t = tagInput.trim(); if (t && !tags.includes(t)) setTags([...tags, t]); setTagInput(""); };

  const toggleMode = () => {
    if (mode === "flat") {
      setItems(prev => prev.map(it => ({ ...it, day_pattern: it.day_pattern || `1-${durationDays}` })));
      setMode("scheduled");
    } else setMode("flat");
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems(prev => {
      const a = prev.find(i => i.client_id === active.id);
      const b = prev.find(i => i.client_id === over.id);
      if (!a || !b || a.section_category !== b.section_category) return prev;
      return arrayMove(prev, prev.findIndex(i => i.client_id === active.id), prev.findIndex(i => i.client_id === over.id));
    });
  };

  const save = async () => {
    if (!user) return;
    if (!name.trim()) { toast({ title: "Введите название", variant: "destructive" }); return; }
    setSaving(true);
    try {
      let useId = tplId;
      const payload = {
        name: name.trim(), description: description || null, target_patient: target || null,
        mode, duration_days: durationDays, tags: tags.length ? tags : null,
      };
      if (isNew && !useId) {
        const { data, error } = await supabase.from("protocol_templates").insert({ ...payload, created_by: user.id } as any).select("id").single();
        if (error || !data) throw error || new Error("insert");
        useId = data.id;
        setTplId(data.id);
      } else {
        const { error } = await supabase.from("protocol_templates").update(payload as any).eq("id", useId!);
        if (error) throw error;
        await supabase.from("protocol_template_items").delete().eq("template_id", useId!);
      }
      if (items.length) {
        const rows = items.map((it, idx) => ({
          template_id: useId!, catalog_id: it.catalog_id || null, section_category: it.section_category,
          order_index: idx, name_snapshot: it.name_snapshot, dose: it.dose, dose_unit: it.dose_unit,
          dilution_volume: it.dilution_volume, dilution_solvent: it.dilution_solvent,
          frequency: it.frequency, duration_days: it.duration_days, day_pattern: it.day_pattern || null,
          time_of_day: it.time_of_day, infusion_rate: it.infusion_rate, route_override: it.route_override,
          notes: it.notes,
        }));
        const { error } = await supabase.from("protocol_template_items").insert(rows as any);
        if (error) throw error;
      }
      toast({ title: "Шаблон сохранён" });
      if (isNew && useId) navigate(`/admin/treatment-templates/${useId}`, { replace: true });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading || busy) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  if (!user) return null;

  const grouped = SECTIONS.map(s => ({ section: s, list: items.filter(i => i.section_category === s.key) }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Link to="/admin/treatment-templates" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="w-4 h-4"/>К списку шаблонов</Link>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h1 className="text-2xl font-bold">{isNew ? "Новый шаблон" : "Редактирование шаблона"}</h1>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}Сохранить
          </Button>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <div><Label>Название *</Label><Input value={name} onChange={e=>setName(e.target.value)}/></div>
            <div><Label>Целевой профиль пациента</Label><Textarea value={target} onChange={e=>setTarget(e.target.value)} rows={2} placeholder="Мужчина 37–50 лет, городской житель..."/></div>
            <div><Label>Описание</Label><Textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2}/></div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>Режим</Label>
                <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={toggleMode}>
                  {mode === "flat" ? <><List className="w-4 h-4"/>Плоский</> : <><CalendarDays className="w-4 h-4"/>По дням</>}
                </Button>
              </div>
              <div>
                <Label>Длительность курса (дней)</Label>
                <Input type="number" min={1} max={180} value={durationDays} onChange={e=>setDurationDays(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}/>
              </div>
              <div>
                <Label>Теги</Label>
                <div className="flex gap-1">
                  <Input value={tagInput} onChange={e=>setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="тег + Enter"/>
                  <Button type="button" variant="outline" onClick={addTag}>+</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded px-2 py-0.5 text-xs">
                        {t}<X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setTags(tags.filter(x => x !== t))}/>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {mode === "scheduled" && <Card className="mb-3"><GanttHeader duration={durationDays}/></Card>}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="space-y-3">
            {grouped.map(({ section, list }) => {
              const Icon = section.icon; const empty = list.length === 0;
              return (
                <Card key={section.key} className={empty ? "opacity-70" : ""}>
                  <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${empty ? "text-muted-foreground" : "text-primary"}`}/>
                      {section.label}
                      {!empty && <Badge variant="secondary" className="text-xs">{list.length}</Badge>}
                    </CardTitle>
                    <CatalogPicker section={section.key} allowAllCategories={section.key === "peptide"} onPick={(c) => addItem(section.key, c)}/>
                  </CardHeader>
                  {!empty && (
                    <CardContent className="pt-0 pb-3 px-4 space-y-2">
                      <SortableContext items={list.map(i => i.client_id)} strategy={verticalListSortingStrategy}>
                        {list.map(it => (
                          <PlanItemRow key={it.client_id} item={it} mode={mode} courseDuration={durationDays} sortable
                            update={(p) => updateItem(it.client_id, p)} remove={() => removeItem(it.client_id)}/>
                        ))}
                      </SortableContext>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
