import { useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Upload, ImagePlus, FolderInput } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buildGalleryMarkerFromEntries } from "@/lib/markdown/galleryMarkers";
import type { Material } from "./MaterialsPanel";
import PickFromMaterialsDialog from "./PickFromMaterialsDialog";

const BUCKET = "disease-media";
const FOLDER = "article-images";
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;

export type GalleryImageKind = "normal" | "infographic" | "patient-full";

export interface GalleryImage {
  id: string;
  filename: string;   // имя в бакете disease-media/article-images
  caption: string;
  kind: GalleryImageKind;
}

interface Props {
  slug: string;
  materials: Material[];
  /** Сохранённый список галерей (row.gallery_images). */
  value: GalleryImage[];
  /** Патчит row.gallery_images и сохраняет строку. */
  onChange: (images: GalleryImage[]) => void;
  /** Текст обзора без маркеров провенанса — для проверки использования файла. */
  content: string;
  /** Текст с маркерами [M#] — для проверки использования файла. */
  contentWithMarkers: string;
  /** Экземпляр TipTap-редактора обзора для вставки блока-заполнителя в позицию курсора. */
  editor?: Editor | null;
  /** Fallback: если редактор недоступен — добавить готовый маркер [[GALLERY: ...]] в конец текста. */
  onAppendMarker: (marker: string) => void;
}

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

export default function GalleryPanel({
  slug, materials, value, onChange, content, contentWithMarkers, onInsertMarker,
}: Props) {
  const images = value;
  const [caption, setCaption] = useState("Иллюстрации");
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const marker = useMemo(
    () =>
      buildGalleryMarkerFromEntries(
        caption,
        images.map((i) => ({ filename: i.filename, caption: i.caption })),
      ),
    [caption, images],
  );

  async function uploadOne(file: File, kind: GalleryImageKind): Promise<GalleryImage | null> {
    const extMatch = /\.([a-z0-9]+)$/i.exec(file.name);
    const ext = (extMatch?.[1] || (file.type.includes("png") ? "png" : "jpg")).toLowerCase();
    const uuid = crypto.randomUUID().slice(0, 8);
    const kindPart = kind === "normal" ? "normal" : kind;
    const filename = `${safeSlugPart(slug)}-research-${kindPart}-${uuid}.${ext}`;
    const path = `${FOLDER}/${filename}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (error) {
      toast.error(`${file.name}: ${error.message}`);
      return null;
    }
    return { id: crypto.randomUUID(), filename, caption: "", kind };
  }

  async function handleFiles(files: FileList | null, kind: GalleryImageKind = "normal") {
    if (!files || !files.length) return;
    setUploading(true);
    const added: GalleryImage[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name}: не изображение`);
        continue;
      }
      const item = await uploadOne(f, kind);
      if (item) added.push(item);
    }
    setUploading(false);
    if (added.length) {
      onChange([...images, ...added]);
      toast.success(`Добавлено: ${added.length}`);
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  /** Меняет подпись мгновенно; смену kind сопровождает реальным move в бакете. */
  async function updateImage(id: string, patch: Partial<GalleryImage>) {
    const im = images.find((x) => x.id === id);
    if (!im) return;

    if (patch.kind && patch.kind !== im.kind) {
      const newFilename = im.filename.replace(
        /-(normal|infographic|patient-full)-/i,
        `-${patch.kind}-`,
      );
      if (newFilename === im.filename) {
        onChange(images.map((x) => (x.id === id ? { ...x, ...patch } : x)));
        return;
      }
      const oldPath = `${FOLDER}/${im.filename}`;
      const newPath = `${FOLDER}/${newFilename}`;
      setRenamingId(id);
      const { error } = await supabase.storage.from(BUCKET).move(oldPath, newPath);
      setRenamingId(null);
      if (error) {
        toast.error(`Не удалось сменить тип: ${error.message}`);
        return;
      }
      onChange(images.map((x) => (x.id === id ? { ...x, ...patch, filename: newFilename } : x)));
      return;
    }

    onChange(images.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function isUsedInContent(filename: string): boolean {
    return (content || "").includes(filename) || (contentWithMarkers || "").includes(filename);
  }

  async function performDelete(id: string) {
    const im = images.find((x) => x.id === id);
    if (!im) return;
    onChange(images.filter((x) => x.id !== id));
    try {
      await supabase.storage.from(BUCKET).remove([`${FOLDER}/${im.filename}`]);
    } catch (e: any) {
      console.warn("remove failed:", e?.message);
    }
  }

  function removeImage(id: string) {
    const im = images.find((x) => x.id === id);
    if (!im) return;
    if (isUsedInContent(im.filename)) {
      toast.warning("Изображение используется в тексте обзора", {
        description: "После удаления в опубликованной галерее останется пустое место.",
        duration: 10000,
        action: {
          label: "Всё равно удалить",
          onClick: () => { void performDelete(id); },
        },
      });
      return;
    }
    void performDelete(id);
  }

  function insert() {
    if (!images.length) { toast.error("Добавьте хотя бы одно изображение"); return; }
    onInsertMarker(marker);
    toast.success("Маркер галереи вставлен в конец текста");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImagePlus className="w-4 h-4" /> Галереи изображений
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
            onChange={(e) => handleFiles(e.target.files, "normal")}
          />
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault(); e.stopPropagation();
            if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files, "normal");
          }}
          className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-xs text-muted-foreground"
        >
          Или перетащите изображения сюда
        </div>

        {images.length > 0 && (
          <div className="space-y-2">
            {images.map((im) => {
              const renaming = renamingId === im.id;
              const used = isUsedInContent(im.filename);
              return (
                <div key={im.id} className="flex items-center gap-2 border rounded p-2">
                  <img
                    src={publicUrl(im.filename)}
                    alt=""
                    className="w-16 h-16 object-cover rounded shrink-0"
                  />
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
                      {used && (
                        <Badge variant="secondary" className="text-[10px]">в тексте</Badge>
                      )}
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

        {images.length > 0 && (
          <>
            <div className="text-xs font-mono bg-muted/40 p-2 rounded break-all">{marker}</div>
            <Button size="sm" onClick={insert}>Вставить галерею в текст</Button>
          </>
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
      </CardContent>
    </Card>
  );
}
