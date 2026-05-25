import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Save, Trash2, Plus, GripVertical, X, Search, Archive } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Protocol {
  id: string;
  name: string;
  description: string | null;
  indications: string | null;
  contraindications: string | null;
  session_count: number | null;
  session_duration_min: number | null;
  frequency: string | null;
  tags: string[] | null;
  is_archived: boolean;
}
interface PointRow {
  id: string;
  protocol_id?: string;
  acupoint_id: string;
  order_index: number;
  manipulation: string | null;
  depth_mm: string | null;
  retention_min: number | null;
  side: string | null;
  notes: string | null;
  // joined
  who_code?: string;
  point_name_ru?: string;
  point_pinyin?: string;
}
interface AcupointLite {
  id: string;
  who_code: string;
  pinyin: string | null;
  name_ru: string | null;
  manipulation_default: string | null;
  depth_mm: string | null;
  meridian_code?: string | null;
}

function SortablePointRow({ row, onChange, onRemove }: { row: PointRow; onChange: (p: Partial<PointRow>) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-3 bg-card">
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground cursor-grab pt-1.5" type="button">
          <GripVertical className="w-4 h-4"/>
        </button>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono">{row.who_code}</Badge>
            <span className="font-medium">{row.point_name_ru || row.point_pinyin}</span>
            {row.point_pinyin && row.point_name_ru && <span className="text-xs text-muted-foreground">{row.point_pinyin}</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <Label className="text-xs">Сторона</Label>
              <Select value={row.side || "bilateral"} onValueChange={(v) => onChange({ side: v })}>
                <SelectTrigger className="h-8"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bilateral">Билатерально</SelectItem>
                  <SelectItem value="left">Слева</SelectItem>
                  <SelectItem value="right">Справа</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Манипуляция</Label>
              <Input className="h-8" value={row.manipulation || ""} onChange={(e) => onChange({ manipulation: e.target.value })} placeholder="торм./возб./нейтр."/>
            </div>
            <div>
              <Label className="text-xs">Глубина (мм)</Label>
              <Input className="h-8" value={row.depth_mm || ""} onChange={(e) => onChange({ depth_mm: e.target.value })}/>
            </div>
            <div>
              <Label className="text-xs">Экспозиция (мин)</Label>
              <Input className="h-8" type="number" value={row.retention_min ?? ""} onChange={(e) => onChange({ retention_min: e.target.value ? +e.target.value : null })}/>
            </div>
          </div>
          <Textarea className="text-xs" rows={1} value={row.notes || ""} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Заметка"/>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive"><Trash2 className="w-4 h-4"/></Button>
      </div>
    </div>
  );
}

export default function AdminAcupunctureProtocolEditor() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [rows, setRows] = useState<PointRow[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [allPoints, setAllPoints] = useState<AcupointLite[]>([]);
  const [pickerQ, setPickerQ] = useState("");

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth", { state: { from: `/admin/acupuncture-protocols/${id}` } });
  }, [user, isAdmin, loading, navigate, id]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setBusy(true);
      const { data: p } = await supabase.from("acupuncture_protocols" as any).select("*").eq("id", id).maybeSingle();
      const { data: pts } = await supabase
        .from("acupuncture_protocol_points" as any)
        .select("*, acupoints(who_code, pinyin, name_ru)")
        .eq("protocol_id", id).order("order_index");
      setProtocol(p as any);
      setRows(((pts as any[]) || []).map(r => ({
        id: r.id, protocol_id: r.protocol_id, acupoint_id: r.acupoint_id, order_index: r.order_index,
        manipulation: r.manipulation, depth_mm: r.depth_mm, retention_min: r.retention_min,
        side: r.side, notes: r.notes,
        who_code: r.acupoints?.who_code, point_name_ru: r.acupoints?.name_ru, point_pinyin: r.acupoints?.pinyin,
      })));
      setBusy(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!pickerOpen || allPoints.length) return;
    (async () => {
      const { data } = await supabase.from("acupoints").select("id,who_code,pinyin,name_ru,manipulation_default,depth_mm").order("who_code");
      setAllPoints((data as any) || []);
    })();
  }, [pickerOpen, allPoints.length]);

  const filteredPicker = useMemo(() => {
    const s = pickerQ.trim().toLowerCase();
    if (!s) return allPoints;
    return allPoints.filter(a =>
      a.who_code.toLowerCase().includes(s)
      || (a.pinyin || "").toLowerCase().includes(s)
      || (a.name_ru || "").toLowerCase().includes(s)
    );
  }, [allPoints, pickerQ]);

  const addPoint = (a: AcupointLite) => {
    setRows(prev => [...prev, {
      id: crypto.randomUUID(),
      acupoint_id: a.id,
      order_index: prev.length,
      manipulation: a.manipulation_default,
      depth_mm: a.depth_mm,
      retention_min: protocol?.session_duration_min ?? 20,
      side: "bilateral",
      notes: null,
      who_code: a.who_code, point_name_ru: a.name_ru, point_pinyin: a.pinyin,
    }]);
  };

  const removeRow = (rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
    setRemovedIds(prev => [...prev, rowId]);
  };
  const updateRow = (rowId: string, patch: Partial<PointRow>) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, ...patch } : r));
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setRows(prev => {
      const oldIdx = prev.findIndex(r => r.id === active.id);
      const newIdx = prev.findIndex(r => r.id === over.id);
      return arrayMove(prev, oldIdx, newIdx).map((r, i) => ({ ...r, order_index: i }));
    });
  };

  const save = async () => {
    if (!protocol || !id) return;
    setSaving(true);
    const { error: pe } = await supabase.from("acupuncture_protocols" as any).update({
      name: protocol.name,
      description: protocol.description,
      indications: protocol.indications,
      contraindications: protocol.contraindications,
      session_count: protocol.session_count,
      session_duration_min: protocol.session_duration_min,
      frequency: protocol.frequency,
      tags: protocol.tags,
      is_archived: protocol.is_archived,
    } as any).eq("id", id);
    if (pe) { toast.error(pe.message); setSaving(false); return; }

    // Wipe & re-insert points (simpler than diffing)
    await supabase.from("acupuncture_protocol_points" as any).delete().eq("protocol_id", id);
    if (rows.length) {
      const payload = rows.map((r, i) => ({
        protocol_id: id, acupoint_id: r.acupoint_id, order_index: i,
        manipulation: r.manipulation, depth_mm: r.depth_mm, retention_min: r.retention_min,
        side: r.side, notes: r.notes,
      }));
      const { error: ie } = await supabase.from("acupuncture_protocol_points" as any).insert(payload as any);
      if (ie) { toast.error(ie.message); setSaving(false); return; }
    }
    toast.success("Сохранено");
    setRemovedIds([]);
    setSaving(false);
  };

  const deleteProtocol = async () => {
    if (!id || !confirm("Удалить протокол целиком?")) return;
    const { error } = await supabase.from("acupuncture_protocols" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    navigate("/admin/acupuncture-protocols");
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || !protocol) return;
    setProtocol({ ...protocol, tags: Array.from(new Set([...(protocol.tags || []), t])) });
    setTagInput("");
  };
  const removeTag = (t: string) => {
    if (!protocol) return;
    setProtocol({ ...protocol, tags: (protocol.tags || []).filter(x => x !== t) });
  };

  if (busy || !protocol) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/admin/acupuncture-protocols"><ArrowLeft className="w-4 h-4 mr-2"/>К списку</Link></Button>
            <h1 className="text-xl font-bold">Редактирование протокола ИРТ</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setProtocol({ ...protocol, is_archived: !protocol.is_archived })}>
              <Archive className="w-4 h-4 mr-2"/>{protocol.is_archived ? "Разархивировать" : "В архив"}
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteProtocol}><Trash2 className="w-4 h-4 mr-2"/>Удалить</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}Сохранить</Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Название</Label>
              <Input value={protocol.name} onChange={(e) => setProtocol({ ...protocol, name: e.target.value })}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Сеансов</Label>
                <Input type="number" value={protocol.session_count ?? ""} onChange={(e) => setProtocol({ ...protocol, session_count: e.target.value ? +e.target.value : null })}/>
              </div>
              <div><Label>Длительность сеанса (мин)</Label>
                <Input type="number" value={protocol.session_duration_min ?? ""} onChange={(e) => setProtocol({ ...protocol, session_duration_min: e.target.value ? +e.target.value : null })}/>
              </div>
              <div><Label>Кратность</Label>
                <Input value={protocol.frequency || ""} onChange={(e) => setProtocol({ ...protocol, frequency: e.target.value })} placeholder="напр., 2–3 раза в неделю"/>
              </div>
            </div>
            <div><Label>Показания</Label>
              <Textarea rows={2} value={protocol.indications || ""} onChange={(e) => setProtocol({ ...protocol, indications: e.target.value })}/>
            </div>
            <div><Label>Противопоказания</Label>
              <Textarea rows={2} value={protocol.contraindications || ""} onChange={(e) => setProtocol({ ...protocol, contraindications: e.target.value })}/>
            </div>
            <div><Label>Описание / методика</Label>
              <Textarea rows={3} value={protocol.description || ""} onChange={(e) => setProtocol({ ...protocol, description: e.target.value })}/>
            </div>
            <div>
              <Label>Теги</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(protocol.tags || []).map(t => (
                  <Badge key={t} variant="secondary" className="gap-1">{t}
                    <button onClick={() => removeTag(t)} type="button" className="ml-1 hover:text-destructive"><X className="w-3 h-3"/></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Добавить тег…"/>
                <Button variant="outline" onClick={addTag}>Добавить</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Точки протокола ({rows.length})</h2>
              <Button onClick={() => setPickerOpen(true)}><Plus className="w-4 h-4 mr-2"/>Добавить точку</Button>
            </div>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Нет точек. Нажмите «Добавить точку».</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {rows.map(r => (
                      <SortablePointRow key={r.id} row={r}
                        onChange={(p) => updateRow(r.id, p)}
                        onRemove={() => removeRow(r.id)}/>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Выбрать точку</DialogTitle></DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
            <Input value={pickerQ} onChange={(e) => setPickerQ(e.target.value)} placeholder="Поиск: WHO-код, пиньинь, название…" className="pl-9" autoFocus/>
          </div>
          <div className="max-h-[60vh] overflow-y-auto space-y-1">
            {filteredPicker.map(a => (
              <button key={a.id} onClick={() => { addPoint(a); }} type="button"
                className="w-full text-left px-3 py-2 rounded-md hover:bg-muted flex items-center gap-3">
                <Badge variant="outline" className="font-mono shrink-0">{a.who_code}</Badge>
                <span className="font-medium truncate">{a.name_ru || a.pinyin}</span>
                {a.pinyin && a.name_ru && <span className="text-xs text-muted-foreground truncate">{a.pinyin}</span>}
              </button>
            ))}
            {filteredPicker.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Ничего не найдено</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
