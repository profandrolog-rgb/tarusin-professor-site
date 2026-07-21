import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2, Upload, FolderInput, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, verticalListSortingStrategy,
  sortableKeyboardCoordinates, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GalleryKind, GALLERY_KINDS, GALLERY_KIND_OPTIONS, KIND_SEGMENT_RE,
  processImageByKind,
} from "./galleryKinds";

export interface GalleryImage {
  id: string;
  filename: string;
  caption: string;
  kind: GalleryKind;
}

export interface PickMaterialItem {
  filename: string;
  caption?: string;
  kind?: GalleryKind;
}

export interface GalleryEditorDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Бакет Supabase Storage. */
  bucket: string;
  /** Папка внутри бакета. */
  folder: string;
  /** Slug статьи/обзора — используется в имени файла. */
  ownerSlug: string;
  /** Начальная подпись галереи. */
  initialCaption: string;
  /** Начальный список изображений. */
  initialImages: GalleryImage[];
  /** Вызывается при нажатии «Сохранить». */
  onSave: (data: { caption: string; images: GalleryImage[] }) => void;
  /** Заголовок диалога (по умолчанию «Галерея изображений»). */
  title?: string;
  /** Текст кнопки подтверждения (по умолчанию «Сохранить»). */
  submitLabel?: string;
  /** Опциональная секция «Взять из материалов» для обзоров. */
  onOpenPicker?: () => void;
}

function safeSlugPart(slug: string): string {
  return (slug || "gallery")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "gallery";
}

function SortableRow({
  im, renaming, onKind, onCaption, onRemove, publicUrl,
}: {
  im: GalleryImage;
  renaming: boolean;
  onKind: (v: GalleryKind) => void;
  onCaption: (v: string) => void;
  onRemove: () => void;
  publicUrl: (name: string) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: im.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 border rounded p-2 bg-background">
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground shrink-0"
        title="Перетащить"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <img
        src={publicUrl(im.filename)}
        alt=""
        className="w-16 h-16 object-cover rounded shrink-0 bg-muted"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <Input
          value={im.caption}
          onChange={(e) => onCaption(e.target.value)}
          placeholder="Подпись к фото"
          className="h-8"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={im.kind}
            onValueChange={(v) => onKind(v as GalleryKind)}
            disabled={renaming}
          >
            <SelectTrigger className="h-8 w-56 text-xs">
              {renaming
                ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />переименование…</span>
                : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
              {GALLERY_KIND_OPTIONS.map((k) => (
                <SelectItem key={k} value={k}>{GALLERY_KINDS[k].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px] font-mono truncate max-w-[240px]">
            {im.filename}
          </Badge>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove} disabled={renaming}>
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  );
}

export default function GalleryEditorDialog({
  open, onOpenChange, bucket, folder, ownerSlug,
  initialCaption, initialImages, onSave,
  title = "Галерея изображений",
  submitLabel = "Сохранить",
  onOpenPicker,
}: GalleryEditorDialogProps) {
  const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}`;
  const publicUrl = (filename: string) => {
    const safe = filename.split("/").map(encodeURIComponent).join("/");
    return `${STORAGE_BASE}/${folder}/${safe}`;
  };

  const [caption, setCaption] = useState(initialCaption);
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [defaultKind, setDefaultKind] = useState<GalleryKind>("default");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCaption(initialCaption);
      setImages(initialImages);
      setDragOver(false);
    }
  }, [open, initialCaption, initialImages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function uploadOne(file: File, kind: GalleryKind): Promise<GalleryImage | null> {
    let blob: Blob = file;
    try { blob = await processImageByKind(file, kind); } catch { /* fallback: raw file */ }
    const uuid = crypto.randomUUID().slice(0, 8);
    const filename = `${safeSlugPart(ownerSlug)}-${kind}-${uuid}.jpg`;
    const path = `${folder}/${filename}`;
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: "image/jpeg", upsert: false,
    });
    if (error) { toast.error(`${file.name}: ${error.message}`); return null; }
    return { id: crypto.randomUUID(), filename, caption: "", kind };
  }

  async function handleFiles(files: FileList | File[] | null) {
    const arr = files ? (Array.from(files as any) as File[]) : [];
    if (!arr.length) return;
    setUploading(true);
    const added: GalleryImage[] = [];
    for (const f of arr) {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name}: не изображение`); continue; }
      const item = await uploadOne(f, defaultKind);
      if (item) added.push(item);
    }
    setUploading(false);
    if (added.length) {
      setImages((prev) => [...prev, ...added]);
      toast.success(`Добавлено: ${added.length}`);
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  async function updateImage(id: string, patch: Partial<GalleryImage>) {
    const im = images.find((x) => x.id === id);
    if (!im) return;
    if (patch.kind && patch.kind !== im.kind) {
      const newFilename = KIND_SEGMENT_RE.test(im.filename)
        ? im.filename.replace(KIND_SEGMENT_RE, `-${patch.kind}-`)
        : im.filename;
      if (newFilename === im.filename) {
        setImages((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
        return;
      }
      setRenamingId(id);
      const { error } = await supabase.storage.from(bucket)
        .move(`${folder}/${im.filename}`, `${folder}/${newFilename}`);
      setRenamingId(null);
      if (error) { toast.error(`Не удалось сменить тип: ${error.message}`); return; }
      setImages((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch, filename: newFilename } : x)));
      return;
    }
    setImages((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function removeImage(id: string) {
    const im = images.find((x) => x.id === id);
    if (!im) return;
    setImages((prev) => prev.filter((x) => x.id !== id));
    try { await supabase.storage.from(bucket).remove([`${folder}/${im.filename}`]); } catch { /* noop */ }
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setImages((prev) => {
      const oldIndex = prev.findIndex((x) => x.id === active.id);
      const newIndex = prev.findIndex((x) => x.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function submit() {
    if (!images.length) { toast.error("Добавьте хотя бы одно изображение"); return; }
    onSave({ caption: caption.trim(), images });
    onOpenChange(false);
  }

  const ids = useMemo(() => images.map((x) => x.id), [images]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-sm">Подпись галереи</Label>
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs shrink-0">Пропорции новых:</Label>
              <Select value={defaultKind} onValueChange={(v) => setDefaultKind(v as GalleryKind)}>
                <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GALLERY_KIND_OPTIONS.map((k) => (
                    <SelectItem key={k} value={k}>{GALLERY_KINDS[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
              Загрузить изображения
            </Button>
            {onOpenPicker && (
              <Button size="sm" variant="outline" onClick={onOpenPicker}>
                <FolderInput className="w-4 h-4 mr-1" /> Взять из материалов
              </Button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
            onDrop={(e) => {
              e.preventDefault(); e.stopPropagation(); setDragOver(false);
              if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-lg p-4 text-center text-xs transition-colors ${
              dragOver ? "border-primary bg-primary/5 text-primary" : "border-muted-foreground/30 text-muted-foreground"
            }`}
          >
            Перетащите изображения сюда или нажмите «Загрузить». Новые фото кадрируются по выбранной пропорции.
          </div>

          {images.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {images.map((im) => (
                    <SortableRow
                      key={im.id}
                      im={im}
                      renaming={renamingId === im.id}
                      onKind={(v) => updateImage(im.id, { kind: v })}
                      onCaption={(v) => updateImage(im.id, { caption: v })}
                      onRemove={() => removeImage(im.id)}
                      publicUrl={publicUrl}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={submit} disabled={!images.length}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Публичный API для внешних добавлений (например, из «Взять из материалов»). */
export function appendImagesToDialog<T extends GalleryImage>(
  current: T[], added: PickMaterialItem[],
): T[] {
  const now = crypto.randomUUID;
  return [
    ...current,
    ...added.map((i) => ({
      id: (typeof now === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
      filename: i.filename,
      caption: i.caption || "",
      kind: (i.kind || "default") as GalleryKind,
    })) as unknown as T[],
  ];
}
