import { useRef, useState } from "react";
import { ImageIcon, Loader2, Plus, X, Upload } from "lucide-react";
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

function detectType(caption: string): ImgType {
  const c = caption.toLowerCase();
  if (/операци|хирург|разрез|этап|интраопер/.test(c)) return "surgery";
  if (/узи|эхограм|ультразвук|допплер/.test(c)) return "ultrasound";
  if (/пациент|клиническ|внешн|вид|фото|симптом/.test(c)) return "patient";
  if (/схем|алгоритм|инфографик|классификац|таблиц/.test(c)) return "infographic";
  if (/анатоми|строени/.test(c)) return "anatomy";
  return "default";
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
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

async function processImage(file: File, type: ImgType): Promise<Blob> {
  const rule = TYPE_RULES[type];
  const img = await loadImage(file);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  // Определяем crop-область из исходника
  let sx = 0, sy = 0, sw = srcW, sh = srcH;
  if (rule.ratio !== null) {
    const srcRatio = srcW / srcH;
    if (srcRatio > rule.ratio) {
      // источник шире — режем по бокам
      sw = Math.round(srcH * rule.ratio);
      sx = Math.round((srcW - sw) / 2);
      sh = srcH;
      sy = 0;
    } else if (srcRatio < rule.ratio) {
      // источник уже — режем по высоте
      sh = Math.round(srcW / rule.ratio);
      sw = srcW;
      sx = 0;
      sy = rule.crop === "top" ? 0 : Math.round((srcH - sh) / 2);
    }
  }

  // Масштабируем под maxW
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
  blob: Blob;
  previewUrl: string;
  originalName: string;
  type: ImgType;
}

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

  const handleUpload = async () => {
    if (previews.length === 0) return;
    setUploading(true);
    try {
      // Найдём следующий порядковый номер для slug + типа
      const { data: existing } = await supabase.storage
        .from("disease-media")
        .list(ARTICLE_IMAGES_FOLDER, { limit: 1000, search: articleSlug });
      const prefix = `${articleSlug}-${detectedType}-`;
      const startIdx =
        (existing || []).filter((f) => f.name.startsWith(prefix)).length + 1;

      const uploaded: string[] = [];
      for (let i = 0; i < previews.length; i++) {
        const p = previews[i];
        const filename = `${articleSlug}-${p.type}-${startIdx + i}.jpg`;
        const path = `${ARTICLE_IMAGES_FOLDER}/${filename}`;
        const { error } = await supabase.storage
          .from("disease-media")
          .upload(path, p.blob, { upsert: true, contentType: "image/jpeg" });
        if (error) {
          console.error(error);
          toast.error(`Не удалось загрузить ${p.originalName}: ${error.message}`);
          continue;
        }
        uploaded.push(filename);
      }

      if (uploaded.length === 0) return;

      const newMarker = `[[GALLERY: caption="${caption}" | ${uploaded.join(" | ")}]]`;
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
        Тип: <span className="font-medium">{detectedType}</span> ·{" "}
        {TYPE_RULES[detectedType].ratio === null
          ? "без кадрирования"
          : `соотношение ${
              detectedType === "ultrasound"
                ? "1:1"
                : detectedType === "patient"
                ? "3:4 (от верха)"
                : "4:3"
            }`}
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
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {previews.map((p, i) => (
              <div key={i} className="relative">
                <img
                  src={p.previewUrl}
                  alt={p.originalName}
                  className="w-24 h-24 object-cover rounded border"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] truncate px-1">
                  {p.originalName}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={uploading}
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
