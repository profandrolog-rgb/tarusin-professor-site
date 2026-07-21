import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Upload, FolderInput } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buildGalleryMarkerFromEntries } from "@/lib/markdown/galleryMarkers";
import type { Material } from "./MaterialsPanel";
import PickFromMaterialsDialog from "./PickFromMaterialsDialog";
import type { GalleryImage, GalleryImageKind } from "./GalleryPanel";

const BUCKET = "disease-media";
const FOLDER = "article-images";
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;

function publicUrl(filename: string): string {
  const safe = filename.split("/").map(encodeURIComponent).join("/");
  return `${STORAGE_BASE}/${FOLDER}/${safe}`;
}

function safeSlugPart(slug: string): string {
  return (slug || "review")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "review";
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  slug: string;
  materials: Material[];
  value: GalleryImage[];
  onChange: (imgs: GalleryImage[]) => void;
  editor?: Editor | null;
  /** Позиция курсора, запомненная перед открытием диалога. */
  savedPos: number | null;
  /** Синхронизировать content_with_markers маркером после вставки. */
  onAppendToMarkersOnly: (marker: string) => void;
  /** Fallback без редактора — добавить маркер в оба поля. */
  onAppendMarker: (marker: string) => void;
}

export default function GalleryDialog({
  open, onOpenChange, slug, materials, value, onChange,
  editor, savedPos, onAppendToMarkersOnly, onAppendMarker,
}: Props) {
  const images = value;
  const [caption, setCaption] = useState("Иллюстрации");
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!open) setDragOver(false); }, [open]);

  const filesStr = useMemo(
    () => images.map((i) => `${i.filename}${i.caption ? ` "${i.caption.replace(/"/g, "'")}"` : ""}`).join("|"),
    [images],
  );
  const marker = useMemo(
    () => buildGalleryMarkerFromEntries(caption, images.map((i) => ({ filename: i.filename, caption: i.caption }))),
    [caption, images],
  );

  async function uploadOne(file: File, kind: GalleryImageKind): Promise<GalleryImage | null> {
    const extMatch = /\.([a-z0-9]+)$/i.exec(file.name);
    const ext = (extMatch?.[1] || (file.type.includes("png") ? "png" : "jpg")).toLowerCase();
    const uuid = crypto.randomUUID().slice(0, 8);
    const filename = `${safeSlugPart(slug)}-research-${kind}-${uuid}.${ext}`;
    const path = `${FOLDER}/${filename}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || undefined, upsert: false,
    });
    if (error) { toast.error(`${file.name}: ${error.message}`); return null; }
    return { id: crypto.randomUUID(), filename, caption: "", kind };
  }

  async function handleFiles(files: FileList | File[] | null) {
    const arr = files ? Array.from(files as any) as File[] : [];
    if (!arr.length) return;
    setUploading(true);
    const added: GalleryImage[] = [];
    for (const f of arr) {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name}: не изображение`); continue; }
      const item = await uploadOne(f, "normal");
      if (item) added.push(item);
    }
    setUploading(false);
    if (added.length) { onChange([...images, ...added]); toast.success(`Добавлено: ${added.length}`); }
    if (fileInput.current) fileInput.current.value = "";
  }

  async function updateImage(id: string, patch: Partial<GalleryImage>) {
    const im = images.find((x) => x.id === id);
    if (!im) return;
    if (patch.kind && patch.kind !== im.kind) {
      const newFilename = im.filename.replace(/-(normal|infographic|patient-full)-/i, `-${patch.kind}-`);
      if (newFilename === im.filename) {
        onChange(images.map((x) => (x.id === id ? { ...x, ...patch } : x))); return;
      }
      setRenamingId(id);
      const { error } = await supabase.storage.from(BUCKET).move(`${FOLDER}/${im.filename}`, `${FOLDER}/${newFilename}`);
      setRenamingId(null);
      if (error) { toast.error(`Не удалось сменить тип: ${error.message}`); return; }
      onChange(images.map((x) => (x.id === id ? { ...x, ...patch, filename: newFilename } : x)));
      return;
    }
    onChange(images.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function removeImage(id: string) {
    const im = images.find((x) => x.id === id);
    if (!im) return;
    onChange(images.filter((x) => x.id !== id));
    try { await supabase.storage.from(BUCKET).remove([`${FOLDER}/${im.filename}`]); } catch { /* noop */ }
  }

  function insert() {
    if (!images.length) { toast.error("Добавьте хотя бы одно изображение"); return; }
    const cleanCaption = caption.trim().replace(/"/g, "'");
    if (editor && !editor.isDestroyed) {
      const chain = editor.chain().focus();
      if (typeof savedPos === "number" && savedPos >= 0) {
        chain.insertContentAt(savedPos, {
          type: "galleryPlaceholder",
          attrs: { caption: cleanCaption, files: filesStr },
        });
      } else {
        chain.insertContent({
          type: "galleryPlaceholder",
          attrs: { caption: cleanCaption, files: filesStr },
        });
      }
      chain.run();
      onAppendToMarkersOnly(marker);
      toast.success("Галерея вставлена");
    } else {
      onAppendMarker(marker);
      toast.warning("Редактор недоступен — галерея добавлена в конец текста");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Галерея изображений</DialogTitle></DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-sm">Подпись галереи</Label>
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
              Загрузить изображения
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
              <FolderInput className="w-4 h-4 mr-1" /> Взять из материалов
            </Button>
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
            className={`border-2 border-dashed rounded-lg p-6 text-center text-xs transition-colors ${
              dragOver ? "border-primary bg-primary/5 text-primary" : "border-muted-foreground/30 text-muted-foreground"
            }`}
          >
            Перетащите изображения сюда или нажмите «Загрузить»
          </div>

          {images.length > 0 && (
            <div className="space-y-2">
              {images.map((im) => {
                const renaming = renamingId === im.id;
                return (
                  <div key={im.id} className="flex items-center gap-2 border rounded p-2">
                    <img src={publicUrl(im.filename)} alt="" className="w-16 h-16 object-cover rounded shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <Input
                        value={im.caption}
                        onChange={(e) => updateImage(im.id, { caption: e.target.value })}
                        placeholder="Подпись к фото"
                        className="h-8"
                      />
                      <div className="flex items-center gap-2">
                        <Select
                          value={im.kind}
                          onValueChange={(v) => updateImage(im.id, { kind: v as GalleryImageKind })}
                          disabled={renaming}
                        >
                          <SelectTrigger className="h-8 w-40 text-xs">
                            {renaming
                              ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />переименование…</span>
                              : <SelectValue />}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">обычное</SelectItem>
                            <SelectItem value="infographic">инфографика</SelectItem>
                            <SelectItem value="patient-full">ростовое фото</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge variant="outline" className="text-[10px] font-mono truncate max-w-[240px]">{im.filename}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeImage(im.id)} disabled={renaming}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <PickFromMaterialsDialog
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            materials={materials}
            slug={slug}
            onPicked={(items) => {
              onChange([...images, ...items]);
              toast.success(`Добавлено из материалов: ${items.length}`);
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={insert} disabled={!images.length}>Вставить в текст</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
