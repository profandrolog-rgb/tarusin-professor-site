import { useRef, useState } from "react";
import { ImageIcon, Loader2, Plus, X, Upload, RefreshCw, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  articleId: string;
  articleSlug: string;
  caption: string;
  marker: string;
  fullContent: string;
  onContentChange?: (newContent: string) => void;
}

const ARTICLE_IMAGES_FOLDER = "article-images";

type ImgType = "surgery" | "ultrasound" | "patient" | "infographic" | "anatomy" | "default";

interface TypeRule {
  ratio: number | null; // width / height, null = no crop
  crop: "center" | "top";
  maxW: number;
}

const TYPE_RULES: Record<ImgType, TypeRule> = {
  surgery:     { ratio: 4 / 3, crop: "center", maxW: 1600 },
  anatomy:     { ratio: 4 / 3, crop: "center", maxW: 1600 },
  ultrasound:  { ratio: 1,     crop: "center", maxW: 1200 },
  patient:     { ratio: 3 / 4, crop: "top",    maxW: 1000 },
  infographic: { ratio: null,  crop: "center", maxW: 1800 },
  default:     { ratio: 4 / 3, crop: "center", maxW: 1600 },
};

const TYPE_LABEL: Record<ImgType, string> = {
  surgery: "Операция (4:3)",
  ultrasound: "УЗИ (1:1)",
  patient: "Пациент (3:4, от верха)",
  infographic: "Инфографика (без кадра)",
  anatomy: "Анатомия (4:3)",
  default: "По умолчанию (4:3)",
};

const TYPE_OPTIONS: ImgType[] = ["surgery", "ultrasound", "patient", "infographic", "anatomy", "default"];

function detectType(caption: string): ImgType {
  const c = caption.toLowerCase();
  if (/операци|хирург|разрез|этап|интраопер/.test(c)) return "surgery";
  if (/узи|эхограм|ультразвук|допплер/.test(c)) return "ultrasound";
  if (/пациент|клиническ|внешн|вид|фото|симптом/.test(c)) return "patient";
  if (/схем|алгоритм|инфографик|классификац|таблиц/.test(c)) return "infographic";
  if (/анатоми|строени/.test(c)) return "anatomy";
  return "default";
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

async function processImage(source: Blob, type: ImgType): Promise<Blob> {
  const rule = TYPE_RULES[type];
  const img = await loadImageFromBlob(source);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  let sx = 0, sy = 0, sw = srcW, sh = srcH;
  if (rule.ratio !== null) {
    const srcRatio = srcW / srcH;
    if (srcRatio > rule.ratio) {
      sw = Math.round(srcH * rule.ratio);
      sx = Math.round((srcW - sw) / 2);
      sh = srcH;
      sy = 0;
    } else if (srcRatio < rule.ratio) {
      sh = Math.round(srcW / rule.ratio);
      sw = srcW;
      sx = 0;
      sy = rule.crop === "top" ? 0 : Math.round((srcH - sh) / 2);
    }
  }

  let dw = sw;
  let dh = sh;
  if (dw > rule.maxW) {
    const k = rule.maxW / dw;
    dw = rule.maxW;
    dh = Math.round(sh * k);
  }

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas недоступен");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, dw, dh);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.85,
    );
  });
}

interface Processed {
  id: string;
  originalFile: File;
  blob: Blob;
  previewUrl: string;
  originalName: string;
  type: ImgType;
}

interface SortableThumbProps {
  item: Processed;
  index: number;
  total: number;
  isReprocessing: boolean;
  disabled: boolean;
  onChangeType: (id: string, t: ImgType) => void;
  onReprocess: (id: string) => void;
}

const SortableThumb = ({
  item,
  index,
  isReprocessing,
  disabled,
  onChangeType,
  onReprocess,
}: SortableThumbProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    boxShadow: isDragging
      ? "0 10px 25px -5px rgba(0,0,0,0.25), 0 8px 10px -6px rgba(0,0,0,0.1)"
      : undefined,
    opacity: isDragging ? 0.95 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col items-center gap-1.5 w-32 bg-background rounded"
    >
      <div className="relative w-32 h-32">
        <img
          src={item.previewUrl}
          alt={item.originalName}
          className="w-32 h-32 object-cover rounded border bg-white pointer-events-none select-none"
          draggable={false}
        />
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 bg-black/60 text-white rounded p-0.5 cursor-grab active:cursor-grabbing touch-none"
          title="Перетащить"
          aria-label="Перетащить миниатюру"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <span className="absolute bottom-6 right-1 bg-primary text-primary-foreground text-[11px] font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow">
          {index + 1}
        </span>
        {isReprocessing && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          </div>
        )}
        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] truncate px-1 rounded-b">
          {item.originalName}
        </span>
      </div>
      <select
        className="text-xs border rounded px-1 py-0.5 bg-background w-full"
        value={item.type}
        disabled={isReprocessing || disabled}
        onChange={(e) => onChangeType(item.id, e.target.value as ImgType)}
        title={TYPE_LABEL[item.type]}
      >
        {TYPE_OPTIONS.map((t) => (
          <option key={t} value={t}>{TYPE_LABEL[t]}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onReprocess(item.id)}
        disabled={isReprocessing || disabled}
        className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
        title="Повторно применить кадрирование"
      >
        <RefreshCw className="w-3 h-3" /> перекадрировать
      </button>
    </div>
  );
};


const PlaceholderGallery = ({
  articleId,
  articleSlug,
  caption,
  marker,
  fullContent,
  onContentChange,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [previews, setPreviews] = useState<Processed[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reprocessingIdx, setReprocessingIdx] = useState<number | null>(null);

  const detectedType = detectType(caption);

  const clearPreviews = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPreviews([]);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    clearPreviews();
    setProcessing(true);
    const results: Processed[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setProgressText(`Обрабатывается: ${f.name} (${i + 1}/${files.length})`);
        try {
          const blob = await processImage(f, detectedType);
          results.push({
            originalFile: f,
            blob,
            previewUrl: URL.createObjectURL(blob),
            originalName: f.name,
            type: detectedType,
          });
        } catch (e: any) {
          toast.error(`Ошибка обработки ${f.name}: ${e?.message || e}`);
        }
      }
      setPreviews(results);
    } finally {
      setProcessing(false);
      setProgressText("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const changeType = async (idx: number, newType: ImgType) => {
    const p = previews[idx];
    if (!p) return;
    setReprocessingIdx(idx);
    try {
      const blob = await processImage(p.originalFile, newType);
      const previewUrl = URL.createObjectURL(blob);
      setPreviews((prev) => {
        const copy = [...prev];
        URL.revokeObjectURL(copy[idx].previewUrl);
        copy[idx] = { ...copy[idx], blob, previewUrl, type: newType };
        return copy;
      });
    } catch (e: any) {
      toast.error("Не удалось перекадрировать: " + (e?.message || e));
    } finally {
      setReprocessingIdx(null);
    }
  };

  const reprocessAll = async (newType: ImgType) => {
    setProcessing(true);
    try {
      for (let i = 0; i < previews.length; i++) {
        await changeType(i, newType);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (previews.length === 0) return;
    setUploading(true);
    try {
      const uploaded: { filename: string }[] = [];
      // Подсчёт индексов по каждому типу отдельно
      const typeCounters: Record<string, number> = {};
      for (let i = 0; i < previews.length; i++) {
        const p = previews[i];
        if (typeCounters[p.type] === undefined) {
          const { data: existing } = await supabase.storage
            .from("disease-media")
            .list(ARTICLE_IMAGES_FOLDER, { limit: 1000, search: articleSlug });
          const prefix = `${articleSlug}-${p.type}-`;
          typeCounters[p.type] =
            (existing || []).filter((f) => f.name.startsWith(prefix)).length + 1;
        }
        const idx = typeCounters[p.type]++;
        const filename = `${articleSlug}-${p.type}-${idx}.jpg`;
        const path = `${ARTICLE_IMAGES_FOLDER}/${filename}`;
        const { error } = await supabase.storage
          .from("disease-media")
          .upload(path, p.blob, { upsert: true, contentType: "image/jpeg" });
        if (error) {
          console.error(error);
          toast.error(`Не удалось загрузить ${p.originalName}: ${error.message}`);
          continue;
        }
        uploaded.push({ filename });
      }

      if (uploaded.length === 0) return;

      const newMarker = `[[GALLERY: caption="${caption}" | ${uploaded.map((u) => u.filename).join(" | ")}]]`;
      const newContent = fullContent.replace(marker, newMarker);

      const { error: updErr } = await supabase
        .from("disease_articles")
        .update({ article_content: newContent })
        .eq("id", articleId);

      if (updErr) {
        toast.error("Не удалось сохранить галерею: " + updErr.message);
      } else {
        toast.success(`Загружено фото: ${uploaded.length}`);
        onContentChange?.(newContent);
        clearPreviews();
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="my-8 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center px-4 py-8 not-prose"
      style={{ borderColor: "#E2EBF5", minHeight: 200 }}
    >
      <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
      {caption && <p className="text-muted-foreground mb-2 max-w-xl">{caption}</p>}
      <p className="text-xs text-muted-foreground mb-4">
        Авто-тип: <span className="font-medium">{detectedType}</span>
      </p>

      {processing && (
        <div className="w-full max-w-md mb-4">
          <div className="h-2 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary animate-pulse w-2/3" />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">{progressText}</p>
        </div>
      )}

      {previews.length > 0 && (
        <div className="w-full mb-4">
          <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Применить ко всем:</span>
            {TYPE_OPTIONS.map((t) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={processing || uploading}
                onClick={() => reprocessAll(t)}
              >
                {t}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-center mb-3">
            {previews.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 w-32">
                <div className="relative">
                  <img
                    src={p.previewUrl}
                    alt={p.originalName}
                    className="w-32 h-32 object-cover rounded border bg-white"
                  />
                  {reprocessingIdx === i && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </div>
                  )}
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] truncate px-1 rounded-b">
                    {p.originalName}
                  </span>
                </div>
                <select
                  className="text-xs border rounded px-1 py-0.5 bg-background w-full"
                  value={p.type}
                  disabled={reprocessingIdx === i || uploading}
                  onChange={(e) => changeType(i, e.target.value as ImgType)}
                  title={TYPE_LABEL[p.type]}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => changeType(i, p.type)}
                  disabled={reprocessingIdx === i || uploading}
                  className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
                  title="Повторно применить кадрирование"
                >
                  <RefreshCw className="w-3 h-3" /> перекадрировать
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-center">
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={uploading || reprocessingIdx !== null}
              className="gap-1.5"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Загрузить ({previews.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearPreviews}
              disabled={uploading}
              className="gap-1.5"
            >
              <X className="w-4 h-4" /> Отмена
            </Button>
          </div>
        </div>
      )}

      {previews.length === 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Обработка...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Добавить фотографии
            </>
          )}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};

export default PlaceholderGallery;
