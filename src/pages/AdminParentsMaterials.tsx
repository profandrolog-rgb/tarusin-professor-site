import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, GripVertical, ExternalLink, Loader2, Save, Upload, Eye, EyeOff, Languages, ImageIcon, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFileDrop } from "@/hooks/useFileDrop";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  type ParentsMaterial, type ParentsMaterialKind, type ParentsMaterialAudience,
  resolveMaterialPreview, uploadParentsMedia, uploadParentsOgImage, uploadParentsHandoutPdf,
  deleteParentsMedia, parentsMediaPublicUrl, slugify, formatBytes,
} from "@/lib/parentsMaterialsBucket";
import EmojiPickerButton from "@/components/parents/EmojiPickerButton";
import MaterialLeadsDialog from "@/components/parents/MaterialLeadsDialog";

import AutoSaveIndicator from "@/components/parents/AutoSaveIndicator";
import { useDebouncedAutoSave } from "@/hooks/useDebouncedAutoSave";

const KIND_LABELS: Record<ParentsMaterialKind, string> = {
  article: "Статьи",
  video: "Видео",
  podcast: "Подкасты",
  handout: "Материалы для скачивания",
};

const KIND_HINTS: Record<ParentsMaterialKind, string> = {
  article: "Внешние статьи и публикации со ссылкой. Превью — картинка или Unsplash-URL.",
  video: "YouTube-ролики. Превью можно указать URL вида https://img.youtube.com/vi/<id>/maxresdefault.jpg",
  podcast: "Аудио-подкасты и интервью. Обычно без превью — используется иконка наушников.",
  handout: "PDF-памятки и чек-листы со своим лендингом /for-parents/materials/{slug}.",
};

const AUDIENCE_OPTIONS: { value: ParentsMaterialAudience; label: string }[] = [
  { value: "parent", label: "Родители" },
  { value: "adult_man", label: "Взрослый пациент" },
  { value: "pediatric_patient", label: "Юный пациент" },
  { value: "professional", label: "Врач-профессионал" },
];

function emptyDraft(kind: ParentsMaterialKind): Omit<ParentsMaterial, "id" | "created_at" | "updated_at"> {
  return {
    kind,
    title: "",
    description: null,
    title_en: null,
    description_en: null,
    url: kind === "handout" ? null : "",
    source: null,
    image_path: null,
    image_url: null,
    emoji: null,
    sort_order: 0,
    is_published: false,
    slug: null,
    file_path: null,
    file_size_bytes: null,
    pages_count: null,
    long_description: null,
    long_description_en: null,
    seo_title: null,
    seo_title_en: null,
    seo_description: null,
    seo_description_en: null,
    og_image_path: null,
    audience: kind === "handout" ? "parent" : null,
    download_count: 0,
    gated: false,
  };
}

const AdminParentsMaterials = () => {
  const { user, isAdmin, isEditor, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const canEdit = isAdmin || isEditor;

  const [items, setItems] = useState<ParentsMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKind, setActiveKind] = useState<ParentsMaterialKind>("article");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !canEdit)) {
      navigate("/auth", { state: { from: "/admin/parents-materials" } });
    }
  }, [user, canEdit, authLoading, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("parents_materials" as any)
      .select("*")
      .order("kind", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) toast.error("Не удалось загрузить материалы: " + error.message);
    else setItems((data ?? []) as unknown as ParentsMaterial[]);
    setLoading(false);
  };

  useEffect(() => { if (user && canEdit) load(); }, [user, canEdit]);

  const addNew = async () => {
    const draft = emptyDraft(activeKind);
    const maxSort = items.filter((i) => i.kind === activeKind).reduce((m, i) => Math.max(m, i.sort_order), 0);
    draft.sort_order = maxSort + 10;
    draft.title = activeKind === "handout" ? "Новая памятка" : "Новая карточка";
    if (activeKind === "handout") {
      draft.slug = `handout-${Date.now()}`;
    }
    const { data, error } = await supabase.from("parents_materials" as any).insert(draft as any).select().single();
    if (error) { toast.error("Ошибка создания: " + error.message); return; }
    setItems((prev) => [...prev, data as unknown as ParentsMaterial]);
    toast.success("Карточка создана");
  };

  const updateItem = async (id: string, patch: Partial<ParentsMaterial>): Promise<boolean> => {
    setSavingId(id);
    const { error } = await supabase.from("parents_materials" as any).update(patch as any).eq("id", id);
    setSavingId(null);
    if (error) { toast.error("Ошибка сохранения: " + error.message); return false; }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    return true;
  };

  const removeItem = async (item: ParentsMaterial) => {
    if (!confirm(`Удалить «${item.title}»? Это действие нельзя отменить.`)) return;
    if (item.image_path) await deleteParentsMedia(item.image_path).catch(() => {});
    if (item.file_path) await deleteParentsMedia(item.file_path).catch(() => {});
    if (item.og_image_path) await deleteParentsMedia(item.og_image_path).catch(() => {});
    const { error } = await supabase.from("parents_materials" as any).delete().eq("id", item.id);
    if (error) { toast.error("Ошибка удаления: " + error.message); return; }
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
    const updates = reordered.map((it, idx) => ({ id: it.id, sort_order: (idx + 1) * 10 }));
    setItems((prev) => {
      const map = new Map(updates.map((u) => [u.id, u.sort_order]));
      return prev.map((it) => (map.has(it.id) ? { ...it, sort_order: map.get(it.id)! } : it));
    });
    await Promise.all(updates.map((u) => supabase.from("parents_materials" as any).update({ sort_order: u.sort_order }).eq("id", u.id)));
  };

  if (authLoading || !user || !canEdit) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
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
              </Link>. Порядок карточек редактируется перетаскиванием.
            </p>
          </div>
          <Button onClick={addNew}>
            <Plus className="w-4 h-4 mr-2" />Добавить в «{KIND_LABELS[activeKind]}»
          </Button>
        </div>

        <Tabs value={activeKind} onValueChange={(v) => setActiveKind(v as ParentsMaterialKind)}>
          <TabsList className="mb-4 flex-wrap h-auto">
            {(Object.keys(KIND_LABELS) as ParentsMaterialKind[]).map((k) => {
              const count = items.filter((i) => i.kind === k).length;
              return (
                <TabsTrigger key={k} value={k}>
                  {KIND_LABELS[k]} <Badge variant="secondary" className="ml-2">{count}</Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(KIND_LABELS) as ParentsMaterialKind[]).map((k) => (
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
                        it.kind === "handout" ? (
                          <HandoutRow key={it.id} item={it} saving={savingId === it.id} onSave={(p) => updateItem(it.id, p)} onDelete={() => removeItem(it)} allSlugs={items.filter((x) => x.id !== it.id).map((x) => x.slug).filter(Boolean) as string[]} />
                        ) : (
                          <MaterialRow key={it.id} item={it} saving={savingId === it.id} onSave={(p) => updateItem(it.id, p)} onDelete={() => removeItem(it)} />
                        )
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

/* ------------------- Regular row (article / video / podcast) ------------------- */

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

  useEffect(() => { setDraft(item); }, [item.id, item.image_path]);

  // Fields covered by autosave (everything editable that isn't file_path/image_path handled separately)
  const patch = {
    title: draft.title.trim(),
    description: draft.description?.trim() || null,
    title_en: draft.title_en?.trim() || null,
    description_en: draft.description_en?.trim() || null,
    url: draft.url?.trim() || null,
    source: draft.source?.trim() || null,
    image_url: draft.image_url?.trim() || null,
    emoji: draft.emoji || null,
  };
  const serverPatch = {
    title: item.title,
    description: item.description ?? null,
    title_en: item.title_en ?? null,
    description_en: item.description_en ?? null,
    url: item.url ?? null,
    source: item.source ?? null,
    image_url: item.image_url ?? null,
    emoji: item.emoji ?? null,
  };
  const { status } = useDebouncedAutoSave({
    value: patch,
    serverValue: serverPatch,
    onSave: async (v) => onSave(v as Partial<ParentsMaterial>),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      if (item.image_path) await deleteParentsMedia(item.image_path).catch(() => {});
      const path = await uploadParentsMedia(file);
      await onSave({ image_path: path });
      toast.success("Картинка загружена");
    } catch (e: any) { toast.error("Ошибка загрузки: " + (e?.message || e)); }
    finally { setUploading(false); }
  };

  const preview = resolveMaterialPreview(draft);

  const { dragOver, handlers: dropHandlers } = useFileDrop({
    onFiles: (files) => { void handleUpload(files[0]); },
    accept: "image/",
    disabled: uploading,
  });

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden transition ${dragOver ? "ring-2 ring-primary bg-primary/5" : ""}`}
      {...dropHandlers}
    >
      <CardContent className="p-4">
        <div className="flex gap-3 items-start">
          <button {...attributes} {...listeners} className="mt-1 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing" aria-label="Перетащить" type="button">
            <GripVertical className="w-5 h-5" />
          </button>
          <div className="w-24 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center border">
            {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-2">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Заголовок" />
              <Input value={draft.source ?? ""} onChange={(e) => setDraft({ ...draft, source: e.target.value })} placeholder="Источник" />
            </div>
            <Textarea value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Краткое описание" rows={2} />
            <div className="flex items-start gap-2 flex-wrap">
              <Input value={draft.url ?? ""} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://…" className="flex-1 min-w-[220px]" />
              <EmojiPickerButton value={draft.emoji} onChange={(v) => setDraft({ ...draft, emoji: v })} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-xs text-muted-foreground">Превью:</Label>
              <label className="inline-flex">
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.currentTarget.value = ""; }} />
                <Button asChild variant="outline" size="sm" disabled={uploading}>
                  <span>{uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}Загрузить</span>
                </Button>
              </label>
              <span className="text-xs text-muted-foreground">или</span>
              <Input value={draft.image_url ?? ""} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} placeholder="URL картинки" className="flex-1 min-w-[220px]" />
              {item.image_path && (
                <Button variant="ghost" size="sm" onClick={async () => { await deleteParentsMedia(item.image_path!); await onSave({ image_path: null }); }} className="text-destructive">
                  <Trash2 className="w-3.5 h-3.5 mr-1" />Убрать файл
                </Button>
              )}
            </div>
            <Collapsible open={showEn} onOpenChange={setShowEn}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  <Languages className="w-3.5 h-3.5 mr-1" />{showEn ? "Скрыть EN" : "Английский (EN)"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <Input value={draft.title_en ?? ""} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} placeholder="Title (EN)" />
                <Textarea value={draft.description_en ?? ""} onChange={(e) => setDraft({ ...draft, description_en: e.target.value })} placeholder="Description (EN)" rows={2} />
              </CollapsibleContent>
            </Collapsible>
            <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch checked={draft.is_published} onCheckedChange={(v) => { setDraft({ ...draft, is_published: v }); onSave({ is_published: v }); }} />
                  <Label className="text-xs cursor-pointer flex items-center gap-1">
                    {draft.is_published ? <><Eye className="w-3.5 h-3.5" />Опубликовано</> : <><EyeOff className="w-3.5 h-3.5" />Черновик</>}
                  </Label>
                </div>
                <AutoSaveIndicator status={saving ? "saving" : status} />
              </div>
              <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-1" />Удалить
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/* ------------------- Handout row (PDF landing) ------------------- */

interface HandoutProps extends RowProps { allSlugs: string[]; }

const HandoutRow = ({ item, saving, onSave, onDelete, allSlugs }: HandoutProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const [draft, setDraft] = useState(item);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [showEn, setShowEn] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [showLong, setShowLong] = useState(false);

  useEffect(() => { setDraft(item); }, [item.id, item.image_path, item.file_path, item.og_image_path]);

  const slugConflict = draft.slug && allSlugs.includes(draft.slug);

  // Autosave payload — all editable text/meta fields (files handled by explicit upload handlers)
  const patch = {
    title: draft.title.trim(),
    slug: draft.slug?.trim() || null,
    description: draft.description?.trim() || null,
    long_description: draft.long_description || null,
    title_en: draft.title_en?.trim() || null,
    description_en: draft.description_en?.trim() || null,
    long_description_en: draft.long_description_en || null,
    seo_title: draft.seo_title?.trim() || null,
    seo_title_en: draft.seo_title_en?.trim() || null,
    seo_description: draft.seo_description?.trim() || null,
    seo_description_en: draft.seo_description_en?.trim() || null,
    audience: draft.audience,
    pages_count: draft.pages_count,
    image_url: draft.image_url?.trim() || null,
    emoji: draft.emoji || null,
  };
  const serverPatch = {
    title: item.title,
    slug: item.slug ?? null,
    description: item.description ?? null,
    long_description: item.long_description ?? null,
    title_en: item.title_en ?? null,
    description_en: item.description_en ?? null,
    long_description_en: item.long_description_en ?? null,
    seo_title: item.seo_title ?? null,
    seo_title_en: item.seo_title_en ?? null,
    seo_description: item.seo_description ?? null,
    seo_description_en: item.seo_description_en ?? null,
    audience: item.audience,
    pages_count: item.pages_count,
    image_url: item.image_url ?? null,
    emoji: item.emoji ?? null,
  };
  const { status } = useDebouncedAutoSave({
    value: patch,
    serverValue: serverPatch,
    enabled: !slugConflict, // don't save while slug conflicts
    onSave: async (v) => onSave(v as Partial<ParentsMaterial>),
  });

  const preview = resolveMaterialPreview(draft);

  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    try {
      if (item.image_path) await deleteParentsMedia(item.image_path).catch(() => {});
      const path = await uploadParentsMedia(file);
      await onSave({ image_path: path });
      toast.success("Обложка загружена");
    } catch (e: any) { toast.error("Ошибка: " + (e?.message || e)); }
    finally { setUploadingImg(false); }
  };

  const handleOgUpload = async (file: File) => {
    setUploadingOg(true);
    try {
      if (item.og_image_path) await deleteParentsMedia(item.og_image_path).catch(() => {});
      const path = await uploadParentsOgImage(file);
      await onSave({ og_image_path: path });
      toast.success("OG-картинка загружена");
    } catch (e: any) { toast.error("Ошибка: " + (e?.message || e)); }
    finally { setUploadingOg(false); }
  };

  const handlePdfUpload = async (file: File) => {
    setUploadingPdf(true);
    try {
      if (item.file_path) await deleteParentsMedia(item.file_path).catch(() => {});
      const { path, size } = await uploadParentsHandoutPdf(file, draft.slug || undefined);
      await onSave({ file_path: path, file_size_bytes: size });
      toast.success("PDF загружен");
    } catch (e: any) { toast.error("Ошибка: " + (e?.message || e)); }
    finally { setUploadingPdf(false); }
  };

  const seoTitleLen = (draft.seo_title || "").length;
  const seoDescLen = (draft.seo_description || "").length;

  const { dragOver, handlers: dropHandlers } = useFileDrop({
    onFiles: (files) => {
      for (const f of files) {
        if (f.type === "application/pdf") void handlePdfUpload(f);
        else if (f.type.startsWith("image/")) void handleImageUpload(f);
      }
    },
    accept: ["image/", "application/pdf"],
    disabled: uploadingPdf || uploadingImg || uploadingOg,
  });

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden border-primary/20 transition ${dragOver ? "ring-2 ring-primary bg-primary/5" : ""}`}
      {...dropHandlers}
    >
      <CardContent className="p-4">
        <div className="flex gap-3 items-start">
          <button {...attributes} {...listeners} className="mt-1 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing" aria-label="Перетащить" type="button">
            <GripVertical className="w-5 h-5" />
          </button>
          <div className="w-24 h-32 rounded-md bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center border">
            {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <FileText className="w-8 h-8 text-muted-foreground" />}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1"><FileText className="w-3 h-3" />PDF</Badge>
              {item.file_size_bytes ? <Badge variant="outline">{formatBytes(item.file_size_bytes)}</Badge> : <Badge variant="outline" className="text-amber-600">PDF не загружен</Badge>}
              <Badge variant="outline" className="gap-1"><Download className="w-3 h-3" />{item.download_count} скачив.</Badge>
              <MaterialLeadsDialog materialId={item.id} materialTitle={item.title} />
              {draft.slug && (
                <Link to={`/for-parents/materials/${draft.slug}`} target="_blank" className="text-primary hover:underline inline-flex items-center gap-1">
                  /for-parents/materials/{draft.slug} <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>


            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Заголовок памятки" className="text-base font-medium" />

            <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_120px] gap-2">
              <div>
                <Input
                  value={draft.slug ?? ""}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  placeholder="url-slug"
                  className={slugConflict ? "border-destructive" : ""}
                />
                {slugConflict && <p className="text-xs text-destructive mt-1">Slug уже занят</p>}
              </div>
              <Select value={draft.audience ?? "parent"} onValueChange={(v) => setDraft({ ...draft, audience: v as ParentsMaterialAudience })}>
                <SelectTrigger><SelectValue placeholder="Аудитория" /></SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" min={1} value={draft.pages_count ?? ""} onChange={(e) => setDraft({ ...draft, pages_count: e.target.value ? Number(e.target.value) : null })} placeholder="Стр." />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDraft({ ...draft, slug: slugify(draft.title) })}>
                Сгенерировать slug из заголовка
              </Button>
            </div>

            <Textarea value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Краткое описание (для карточки на /for-parents)" rows={2} />

            {/* PDF upload */}
            <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="text-xs font-medium">PDF-файл памятки:</Label>
                {item.file_path && (
                  <a href={parentsMediaPublicUrl(item.file_path)!} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    <Download className="w-3 h-3" />Скачать текущий
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="inline-flex">
                  <input type="file" accept="application/pdf" className="hidden" disabled={uploadingPdf} onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); e.currentTarget.value = ""; }} />
                  <Button asChild variant="outline" size="sm" disabled={uploadingPdf}>
                    <span>{uploadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}{item.file_path ? "Заменить PDF" : "Загрузить PDF"}</span>
                  </Button>
                </label>
                {item.file_path && (
                  <Button variant="ghost" size="sm" onClick={async () => { await deleteParentsMedia(item.file_path!); await onSave({ file_path: null, file_size_bytes: null }); }} className="text-destructive">
                    <Trash2 className="w-3.5 h-3.5 mr-1" />Удалить PDF
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">Макс 20 МБ, только PDF</span>
              </div>
            </div>

            {/* Cover image */}
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-xs text-muted-foreground">Обложка карточки:</Label>
              <label className="inline-flex">
                <input type="file" accept="image/*" className="hidden" disabled={uploadingImg} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.currentTarget.value = ""; }} />
                <Button asChild variant="outline" size="sm" disabled={uploadingImg}>
                  <span>{uploadingImg ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}Загрузить</span>
                </Button>
              </label>
              <span className="text-xs text-muted-foreground">или</span>
              <Input value={draft.image_url ?? ""} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} placeholder="URL картинки" className="flex-1 min-w-[220px]" />
              {item.image_path && (
                <Button variant="ghost" size="sm" onClick={async () => { await deleteParentsMedia(item.image_path!); await onSave({ image_path: null }); }} className="text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {/* Emoji */}
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-xs text-muted-foreground">Эмодзи (для карточки):</Label>
              <EmojiPickerButton value={draft.emoji} onChange={(v) => setDraft({ ...draft, emoji: v })} />
              <span className="text-xs text-muted-foreground">выводится в углу превью</span>
            </div>


            {/* OG image */}
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-xs text-muted-foreground">OG-картинка (1200×630, соцсети):</Label>
              <label className="inline-flex">
                <input type="file" accept="image/*" className="hidden" disabled={uploadingOg} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOgUpload(f); e.currentTarget.value = ""; }} />
                <Button asChild variant="outline" size="sm" disabled={uploadingOg}>
                  <span>{uploadingOg ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}Загрузить OG</span>
                </Button>
              </label>
              {item.og_image_path && (
                <>
                  <a href={parentsMediaPublicUrl(item.og_image_path)!} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Открыть</a>
                  <Button variant="ghost" size="sm" onClick={async () => { await deleteParentsMedia(item.og_image_path!); await onSave({ og_image_path: null }); }} className="text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>

            {/* Long description (Markdown) */}
            <Collapsible open={showLong} onOpenChange={setShowLong}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  <FileText className="w-3.5 h-3.5 mr-1" />{showLong ? "Скрыть длинное описание" : "Длинное описание (Markdown)"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <Textarea value={draft.long_description ?? ""} onChange={(e) => setDraft({ ...draft, long_description: e.target.value })} placeholder="## Что внутри&#10;- пункт 1&#10;- пункт 2&#10;&#10;## Как использовать" rows={10} className="font-mono text-xs" />
                <p className="text-xs text-muted-foreground">Поддерживаются H2/H3, списки, цитаты, ссылки, таблицы (GFM).</p>
              </CollapsibleContent>
            </Collapsible>

            {/* SEO */}
            <Collapsible open={showSeo} onOpenChange={setShowSeo}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />{showSeo ? "Скрыть SEO" : "SEO мета-теги"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div>
                  <Input value={draft.seo_title ?? ""} onChange={(e) => setDraft({ ...draft, seo_title: e.target.value })} placeholder="SEO title (fallback — заголовок)" maxLength={80} />
                  <p className={`text-xs mt-0.5 ${seoTitleLen > 60 ? "text-amber-600" : "text-muted-foreground"}`}>{seoTitleLen}/60</p>
                </div>
                <div>
                  <Textarea value={draft.seo_description ?? ""} onChange={(e) => setDraft({ ...draft, seo_description: e.target.value })} placeholder="SEO description" rows={2} maxLength={200} />
                  <p className={`text-xs mt-0.5 ${seoDescLen > 160 ? "text-amber-600" : "text-muted-foreground"}`}>{seoDescLen}/160</p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* EN */}
            <Collapsible open={showEn} onOpenChange={setShowEn}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  <Languages className="w-3.5 h-3.5 mr-1" />{showEn ? "Скрыть EN" : "Английский перевод (EN)"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <Input value={draft.title_en ?? ""} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} placeholder="Title (EN)" />
                <Textarea value={draft.description_en ?? ""} onChange={(e) => setDraft({ ...draft, description_en: e.target.value })} placeholder="Short description (EN)" rows={2} />
                <Textarea value={draft.long_description_en ?? ""} onChange={(e) => setDraft({ ...draft, long_description_en: e.target.value })} placeholder="Long description (EN, Markdown)" rows={6} className="font-mono text-xs" />
                <Input value={draft.seo_title_en ?? ""} onChange={(e) => setDraft({ ...draft, seo_title_en: e.target.value })} placeholder="SEO title (EN)" maxLength={80} />
                <Textarea value={draft.seo_description_en ?? ""} onChange={(e) => setDraft({ ...draft, seo_description_en: e.target.value })} placeholder="SEO description (EN)" rows={2} maxLength={200} />
              </CollapsibleContent>
            </Collapsible>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t mt-2">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch checked={draft.is_published} onCheckedChange={(v) => { setDraft({ ...draft, is_published: v }); onSave({ is_published: v }); }} />
                  <Label className="text-xs cursor-pointer flex items-center gap-1">
                    {draft.is_published ? <><Eye className="w-3.5 h-3.5" />Опубликовано</> : <><EyeOff className="w-3.5 h-3.5" />Черновик</>}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={draft.gated} onCheckedChange={(v) => { setDraft({ ...draft, gated: v }); onSave({ gated: v }); }} />
                  <Label className="text-xs cursor-pointer text-muted-foreground">Гейт (форма перед скачиванием)</Label>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AutoSaveIndicator status={saving ? "saving" : (slugConflict ? "error" : status)} />
                <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5 mr-1" />Удалить
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
