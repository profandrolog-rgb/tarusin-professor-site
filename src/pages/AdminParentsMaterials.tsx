import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, GripVertical, ExternalLink, Loader2, Save, Upload, Eye, EyeOff, Languages, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  type ParentsMaterial,
  resolveMaterialPreview,
  uploadParentsMedia,
  deleteParentsMedia,
} from "@/lib/parentsMaterialsBucket";

type Kind = "article" | "video" | "podcast";

const KIND_LABELS: Record<Kind, string> = {
  article: "Статьи",
  video: "Видео",
  podcast: "Подкасты",
};

const KIND_HINTS: Record<Kind, string> = {
  article: "Внешние статьи и публикации со ссылкой. Превью — картинка или Unsplash-URL.",
  video: "YouTube-ролики. Превью можно указать URL вида https://img.youtube.com/vi/<id>/maxresdefault.jpg",
  podcast: "Аудио-подкасты и интервью. Обычно без превью — используется иконка наушников.",
};

function emptyDraft(kind: Kind): Omit<ParentsMaterial, "id" | "created_at" | "updated_at"> {
  return {
    kind,
    title: "",
    description: "",
    title_en: null,
    description_en: null,
    url: "",
    source: "",
    image_path: null,
    image_url: null,
    emoji: null,
    sort_order: 0,
    is_published: true,
  };
}

const AdminParentsMaterials = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<ParentsMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKind, setActiveKind] = useState<Kind>("article");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/parents-materials" } });
    }
  }, [user, isAdmin, authLoading, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("parents_materials" as any)
      .select("*")
      .order("kind", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) {
      toast.error("Не удалось загрузить материалы: " + error.message);
    } else {
      setItems((data ?? []) as unknown as ParentsMaterial[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && isAdmin) load();
  }, [user, isAdmin]);

  const addNew = async () => {
    const draft = emptyDraft(activeKind);
    const maxSort = items.filter((i) => i.kind === activeKind).reduce((m, i) => Math.max(m, i.sort_order), 0);
    draft.sort_order = maxSort + 10;
    draft.title = "Новая карточка";
    draft.url = "https://";
    const { data, error } = await supabase
      .from("parents_materials" as any)
      .insert(draft as any)
      .select()
      .single();
    if (error) {
      toast.error("Ошибка создания: " + error.message);
      return;
    }
    setItems((prev) => [...prev, data as unknown as ParentsMaterial]);
    toast.success("Карточка создана");
  };

  const updateItem = async (id: string, patch: Partial<ParentsMaterial>) => {
    setSavingId(id);
    const { error } = await supabase
      .from("parents_materials" as any)
      .update(patch as any)
      .eq("id", id);
    setSavingId(null);
    if (error) {
      toast.error("Ошибка сохранения: " + error.message);
      return false;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    return true;
  };

  const removeItem = async (item: ParentsMaterial) => {
    if (!confirm(`Удалить «${item.title}»? Это действие нельзя отменить.`)) return;
    if (item.image_path) {
      await deleteParentsMedia(item.image_path).catch(() => {});
    }
    const { error } = await supabase.from("parents_materials" as any).delete().eq("id", item.id);
    if (error) {
      toast.error("Ошибка удаления: " + error.message);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast.success("Удалено");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const kindItems = items.filter((i) => i.kind === activeKind).sort((a, b) => a.sort_order - b.sort_order);

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = kindItems.findIndex((i) => i.id === active.id);
    const newIdx = kindItems.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(kindItems, oldIdx, newIdx);
    // Пересчитываем sort_order с шагом 10
    const updates = reordered.map((it, idx) => ({ id: it.id, sort_order: (idx + 1) * 10 }));
    // Оптимистично обновляем стейт
    setItems((prev) => {
      const map = new Map(updates.map((u) => [u.id, u.sort_order]));
      return prev.map((it) => (map.has(it.id) ? { ...it, sort_order: map.get(it.id)! } : it));
    });
    // Пишем в БД пачкой
    await Promise.all(
      updates.map((u) =>
        supabase.from("parents_materials" as any).update({ sort_order: u.sort_order }).eq("id", u.id),
      ),
    );
  };

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />В админ-панель
        </Link>

        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Полезные материалы (для родителей)</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Управление карточками во вкладке <span className="font-medium">«Полезные материалы»</span> на странице{" "}
              <Link to="/for-parents" target="_blank" className="text-primary hover:underline inline-flex items-center gap-1">
                /for-parents <ExternalLink className="w-3 h-3" />
              </Link>
              . Порядок карточек редактируется перетаскиванием.
            </p>
          </div>
          <Button onClick={addNew}>
            <Plus className="w-4 h-4 mr-2" />Добавить в «{KIND_LABELS[activeKind]}»
          </Button>
        </div>

        <Tabs value={activeKind} onValueChange={(v) => setActiveKind(v as Kind)}>
          <TabsList className="mb-4">
            {(Object.keys(KIND_LABELS) as Kind[]).map((k) => {
              const count = items.filter((i) => i.kind === k).length;
              return (
                <TabsTrigger key={k} value={k}>
                  {KIND_LABELS[k]} <Badge variant="secondary" className="ml-2">{count}</Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
            <TabsContent key={k} value={k}>
              <p className="text-xs text-muted-foreground mb-4">{KIND_HINTS[k]}</p>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : kindItems.length === 0 ? (
                <Card><CardContent className="py-10 text-center text-muted-foreground">Карточек пока нет. Нажмите «Добавить».</CardContent></Card>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={kindItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {kindItems.map((it) => (
                        <MaterialRow
                          key={it.id}
                          item={it}
                          saving={savingId === it.id}
                          onSave={(patch) => updateItem(it.id, patch)}
                          onDelete={() => removeItem(it)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

interface RowProps {
  item: ParentsMaterial;
  saving: boolean;
  onSave: (patch: Partial<ParentsMaterial>) => Promise<boolean>;
  onDelete: () => void;
}

const MaterialRow = ({ item, saving, onSave, onDelete }: RowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const [draft, setDraft] = useState(item);
  const [uploading, setUploading] = useState(false);
  const [showEn, setShowEn] = useState(false);
  const dirty =
    draft.title !== item.title ||
    (draft.description ?? "") !== (item.description ?? "") ||
    (draft.title_en ?? "") !== (item.title_en ?? "") ||
    (draft.description_en ?? "") !== (item.description_en ?? "") ||
    draft.url !== item.url ||
    (draft.source ?? "") !== (item.source ?? "") ||
    (draft.image_url ?? "") !== (item.image_url ?? "") ||
    (draft.emoji ?? "") !== (item.emoji ?? "");

  useEffect(() => { setDraft(item); }, [item.id, item.image_path]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      // Удаляем старый файл, если был
      if (item.image_path) {
        await deleteParentsMedia(item.image_path).catch(() => {});
      }
      const path = await uploadParentsMedia(file);
      await onSave({ image_path: path });
      toast.success("Картинка загружена");
    } catch (e: any) {
      toast.error("Ошибка загрузки: " + (e?.message || e));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    if (item.image_path) await deleteParentsMedia(item.image_path).catch(() => {});
    await onSave({ image_path: null });
    toast.success("Картинка убрана");
  };

  const preview = resolveMaterialPreview(draft);

  return (
    <Card ref={setNodeRef} style={style} className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-3 items-start">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            aria-label="Перетащить"
            type="button"
          >
            <GripVertical className="w-5 h-5" />
          </button>

          <div className="w-24 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center border">
            {preview ? (
              <img src={preview} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-2">
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Заголовок"
              />
              <Input
                value={draft.source ?? ""}
                onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                placeholder="Источник (Uroweb.ru, YouTube, Mel.fm…)"
              />
            </div>

            <Textarea
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Краткое описание"
              rows={2}
            />

            <div className="grid grid-cols-1 md:grid-cols-[1fr_100px] gap-2">
              <Input
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                placeholder="https://…"
              />
              <Input
                value={draft.emoji ?? ""}
                onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
                placeholder="Эмодзи"
                maxLength={4}
              />
            </div>

            {/* Картинка */}
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-xs text-muted-foreground">Превью:</Label>
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.currentTarget.value = "";
                  }}
                />
                <Button asChild variant="outline" size="sm" disabled={uploading}>
                  <span>{uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}Загрузить файл</span>
                </Button>
              </label>
              <span className="text-xs text-muted-foreground">или</span>
              <Input
                value={draft.image_url ?? ""}
                onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                placeholder="URL картинки (Unsplash, YouTube thumb)"
                className="flex-1 min-w-[220px]"
              />
              {item.image_path && (
                <Button variant="ghost" size="sm" onClick={removeImage} className="text-destructive">
                  <Trash2 className="w-3.5 h-3.5 mr-1" />Убрать файл
                </Button>
              )}
            </div>

            {/* EN перевод */}
            <Collapsible open={showEn} onOpenChange={setShowEn}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  <Languages className="w-3.5 h-3.5 mr-1" />
                  {showEn ? "Скрыть EN перевод" : "Английский перевод (EN)"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <Input
                  value={draft.title_en ?? ""}
                  onChange={(e) => setDraft({ ...draft, title_en: e.target.value })}
                  placeholder="Title (EN)"
                />
                <Textarea
                  value={draft.description_en ?? ""}
                  onChange={(e) => setDraft({ ...draft, description_en: e.target.value })}
                  placeholder="Description (EN)"
                  rows={2}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Actions row */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft.is_published}
                  onCheckedChange={(v) => {
                    setDraft({ ...draft, is_published: v });
                    onSave({ is_published: v });
                  }}
                />
                <Label className="text-xs cursor-pointer flex items-center gap-1">
                  {draft.is_published ? <><Eye className="w-3.5 h-3.5" />Опубликовано</> : <><EyeOff className="w-3.5 h-3.5" />Черновик</>}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5 mr-1" />Удалить
                </Button>
                <Button
                  size="sm"
                  disabled={!dirty || saving}
                  onClick={async () => {
                    const ok = await onSave({
                      title: draft.title.trim(),
                      description: draft.description?.trim() || null,
                      title_en: draft.title_en?.trim() || null,
                      description_en: draft.description_en?.trim() || null,
                      url: draft.url.trim(),
                      source: draft.source?.trim() || null,
                      image_url: draft.image_url?.trim() || null,
                      emoji: draft.emoji?.trim() || null,
                    });
                    if (ok) toast.success("Сохранено");
                  }}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                  Сохранить
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminParentsMaterials;
