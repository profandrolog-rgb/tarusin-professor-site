import { useMemo, useRef, useState } from "react";
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
  /** Вставляет готовый маркер [[GALLERY: ...]] в текст обзора. */
  onInsertMarker: (marker: string) => void;
}

function publicUrl(filename: string): string {
  const safe = filename.split("/").map(encodeURIComponent).join("/");
  return `${STORAGE_BASE}/${FOLDER}/${safe}`;
}

function detectKind(filename: string): GalleryImageKind {
  if (/-infographic-/i.test(filename)) return "infographic";
  if (/-patient-full-/i.test(filename)) return "patient-full";
  return "normal";
}

function safeSlugPart(slug: string): string {
  return (slug || "review")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "review";
}

export default function GalleryPanel({ slug, materials, onInsertMarker }: Props) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [caption, setCaption] = useState("Иллюстрации");
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
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
      setImages((prev) => [...prev, ...added]);
      toast.success(`Добавлено: ${added.length}`);
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  function updateImage(id: string, patch: Partial<GalleryImage>) {
    setImages((prev) =>
      prev.map((im) => {
        if (im.id !== id) return im;
        // Смена типа переименовывает файл через маркеры в имени.
        if (patch.kind && patch.kind !== im.kind) {
          const renamed = im.filename
            .replace(/-(normal|infographic|patient-full)-/i, `-${patch.kind}-`);
          return { ...im, ...patch, filename: renamed };
        }
        return { ...im, ...patch };
      }),
    );
  }

  async function removeImage(id: string) {
    const im = images.find((x) => x.id === id);
    if (!im) return;
    setImages((prev) => prev.filter((x) => x.id !== id));
    try {
      await supabase.storage.from(BUCKET).remove([`${FOLDER}/${im.filename}`]);
    } catch (e: any) {
      console.warn("remove failed:", e?.message);
    }
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
            {images.map((im) => (
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
                    <Select value={im.kind} onValueChange={(v) => updateImage(im.id, { kind: v as GalleryImageKind })}>
                      <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue />
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
                <Button variant="ghost" size="sm" onClick={() => removeImage(im.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
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
            setImages((prev) => [...prev, ...items]);
            toast.success(`Добавлено из материалов: ${items.length}`);
          }}
        />
      </CardContent>
    </Card>
  );
}
