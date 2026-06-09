import { useMemo, useRef, useState } from "react";
import { ImageIcon, Loader2, Plus, X, Upload, RefreshCw, GripVertical, Trash2, Check, ChevronLeft, ChevronRight, RotateCcw, Save } from "lucide-react";
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
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  buildGalleryMarkerFromEntries,
  parseGalleryFileEntries,
  readGalleryEntriesFromContent,
  upsertGalleryEntriesInContent,
  type GalleryFileEntry,
} from "@/lib/markdown/galleryMarkers";

interface Props {
  articleId: string;
  articleSlug: string;
  caption: string;
  marker: string;
  fullContent: string;
  existingFiles?: string[];
  onContentChange?: (newContent: string) => void;
}

const ARTICLE_IMAGES_FOLDER = "article-images";
const ARTICLE_IMAGES_BUCKET = "disease-media";
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${ARTICLE_IMAGES_BUCKET}`;

function publicArticleImageUrl(filename: string) {
  const safe = filename
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${STORAGE_BASE}/${ARTICLE_IMAGES_FOLDER}/${safe}`;
}

type ImgType = "surgery" | "ultrasound" | "patient" | "patient-full" | "urology" | "urology-closeup" | "infographic" | "anatomy" | "default";

interface TypeRule {
  ratio: number | null; // width / height, null = no crop
  crop: "center" | "top";
  maxW: number;
}

const TYPE_RULES: Record<ImgType, TypeRule> = {
  surgery:           { ratio: 4 / 3, crop: "center", maxW: 1600 },
  anatomy:           { ratio: 4 / 3, crop: "center", maxW: 1600 },
  ultrasound:        { ratio: 1,     crop: "center", maxW: 1200 },
  patient:           { ratio: 3 / 4, crop: "top",    maxW: 1000 },
  "patient-full":    { ratio: 9 / 16, crop: "center", maxW: 800 },
  urology:           { ratio: 3 / 4, crop: "center", maxW: 1000 },
  "urology-closeup": { ratio: 1,     crop: "center", maxW: 1200 },
  infographic:       { ratio: null,  crop: "center", maxW: 1800 },
  default:           { ratio: 4 / 3, crop: "center", maxW: 1600 },
};

const TYPE_LABEL: Record<ImgType, string> = {
  surgery: "Операция (4:3)",
  ultrasound: "УЗИ (1:1)",
  patient: "Пациент (3:4, от верха)",
  "patient-full": "Рост (9:16, центр)",
  urology: "Урология (3:4, центр)",
  "urology-closeup": "Урология крупный план (1:1, центр)",
  infographic: "Инфографика (без кадра)",
  anatomy: "Анатомия (4:3)",
  default: "По умолчанию (4:3)",
};

const TYPE_OPTIONS: ImgType[] = ["surgery", "ultrasound", "patient", "patient-full", "urology", "urology-closeup", "infographic", "anatomy", "default"];

function detectType(caption: string): ImgType {
  const c = caption.toLowerCase();
  if (/операци|хирург|разрез|этап|интраопер/.test(c)) return "surgery";
  if (/узи|эхограм|ультразвук|допплер/.test(c)) return "ultrasound";
  if (/рост|целиком|полный|синдром|кариотип|фенотип/.test(c)) return "patient-full";
  if (/мошонк|яичк|половой|препуци|головк|фимоз|крипторхизм|гидроцеле|варикоцеле/.test(c)) return "urology";
  if (/пациент|клиническ|внешн|вид|фото|симптом/.test(c)) return "patient";
  if (/схем|алгоритм|инфографик|классификац|таблиц|эпидемиолог|распростран|график|диаграм/.test(c)) return "infographic";
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

function buildDefaultCrop(imgW: number, imgH: number, ratio: number | null): Crop {
  if (ratio === null) {
    // Инфографика — берём всё изображение целиком, без обрезки краёв
    return { unit: "%", x: 0, y: 0, width: 100, height: 100 };
  }
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, ratio, imgW, imgH),
    imgW,
    imgH,
  );
}

async function cropToBlob(
  imgEl: HTMLImageElement,
  pixelCrop: PixelCrop,
  maxW: number,
): Promise<Blob> {
  const scaleX = imgEl.naturalWidth / imgEl.width;
  const scaleY = imgEl.naturalHeight / imgEl.height;
  const sx = pixelCrop.x * scaleX;
  const sy = pixelCrop.y * scaleY;
  const sw = pixelCrop.width * scaleX;
  const sh = pixelCrop.height * scaleY;
  let dw = sw;
  let dh = sh;
  if (dw > maxW) {
    const k = maxW / dw;
    dw = maxW;
    dh = sh * k;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(dw);
  canvas.height = Math.round(dh);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas недоступен");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.9,
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
  caption: string;
}

interface SortableThumbProps {
  item: Processed;
  index: number;
  total: number;
  isReprocessing: boolean;
  disabled: boolean;
  onChangeType: (id: string, t: ImgType) => void;
  onChangeCaption: (id: string, caption: string) => void;
  onReprocess: (id: string) => void;
}

const SortableThumb = ({
  item,
  index,
  isReprocessing,
  disabled,
  onChangeType,
  onChangeCaption,
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
      <input
        type="text"
        value={item.caption}
        onChange={(e) => onChangeCaption(item.id, e.target.value)}
        disabled={disabled}
        placeholder="Подпись к фото (необязательно)"
        className="text-[11px] border rounded px-1.5 py-1 bg-background w-full"
      />
    </div>
  );
};


type ExistingItem = GalleryFileEntry;

const PlaceholderGallery = ({
  articleId,
  articleSlug,
  caption,
  marker,
  fullContent,
  existingFiles,
  onContentChange,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [previews, setPreviews] = useState<Processed[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [overrideType, setOverrideType] = useState<ImgType | "auto">("auto");
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // --- Интерактивное кадрирование ---
  interface CropQueueItem {
    id: string;
    file: File;
    previewUrl: string;
    type: ImgType;
    applied?: Blob; // финальная обрезанная версия (для предпросмотра/возврата)
  }
  const [cropQueue, setCropQueue] = useState<CropQueueItem[]>([]);
  const [cropIndex, setCropIndex] = useState(0);
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);

  const existing = useMemo<ExistingItem[]>(
    () => parseGalleryFileEntries((existingFiles ?? []).join("|")),
    [existingFiles],
  );
  const hasExisting = existing.length > 0;

  const buildMarker = (entries: ExistingItem[]) => {
    return buildGalleryMarkerFromEntries(caption, entries);
  };

  // Парсит файлы из ТЕКУЩЕГО маркера в свежем article_content (по подписи).
  // Защита от перезаписи: даже если prop `existing` устарел, мы видим
  // реальный список файлов из БД.
  const parseMarkerFilesFromContent = (content: string): ExistingItem[] => {
    return readGalleryEntriesFromContent(content, caption);
  };

  // writer получает реально сохранённый сейчас список файлов (из БД)
  // и возвращает следующий — это исключает гонки и затирания.
  const persistEntries = async (
    writer: ExistingItem[] | ((current: ExistingItem[]) => ExistingItem[]),
  ): Promise<boolean> => {
    const { data: fresh, error: fetchErr } = await supabase
      .from("disease_articles")
      .select("article_content")
      .eq("id", articleId)
      .maybeSingle();
    if (fetchErr || !fresh) {
      toast.error("Не удалось прочитать статью: " + (fetchErr?.message || "нет данных"));
      return false;
    }
    const baseContent = (fresh as any).article_content || fullContent;
    const currentFiles = parseMarkerFilesFromContent(baseContent);
    const nextEntries =
      typeof writer === "function" ? writer(currentFiles) : writer;

    const result = upsertGalleryEntriesInContent(baseContent, caption, nextEntries, marker);
    const newContent = result.content;
    if (!result.found) {
      toast.warning("Маркер галереи не найден в статье — добавил в конец, чтобы фото не потерялись");
    }
    const { error, data: updated } = await supabase
      .from("disease_articles")
      .update({ article_content: newContent })
      .eq("id", articleId)
      .select("id");
    if (error) {
      console.error("[PlaceholderGallery] DB update error", error);
      toast.error("Не удалось сохранить галерею: " + error.message);
      return false;
    }
    if (!updated || updated.length === 0) {
      console.error("[PlaceholderGallery] update returned 0 rows. Possibly RLS or stale session.");
      toast.error("Сохранение не прошло (нет прав или сессия истекла). Войдите заново.");
      return false;
    }
    onContentChange?.(newContent);
    return true;
  };

  const deleteExisting = async (filename: string) => {
    if (deletingFile) return;
    if (!confirm("Удалить это фото из галереи?")) return;
    setDeletingFile(filename);
    try {
      // best-effort удаление файла из storage
      await supabase.storage
        .from("disease-media")
        .remove([`${ARTICLE_IMAGES_FOLDER}/${filename}`]);
      // Удаляем по актуальному списку из БД, а не по prop-снимку
      const ok = await persistEntries((current) =>
        current.filter((e) => e.filename !== filename),
      );
      if (ok) toast.success("Фото удалено");
    } finally {
      setDeletingFile(null);
    }
  };



  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const autoType = detectType(caption);
  const detectedType: ImgType = overrideType === "auto" ? autoType : overrideType;

  const makeId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const clearPreviews = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPreviews([]);
  };

  const processFilesToItems = async (
    files: File[],
    opts: { keepExisting: boolean },
  ): Promise<Processed[]> => {
    if (files.length === 0) return [];
    setProcessing(true);
    const results: Processed[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setProgressText(`Обрабатывается: ${f.name} (${i + 1}/${files.length})`);
        try {
          const blob = await processImage(f, detectedType);
          results.push({
            id: makeId(),
            originalFile: f,
            blob,
            previewUrl: URL.createObjectURL(blob),
            originalName: f.name,
            type: detectedType,
            caption: "",
          });
        } catch (e: any) {
          toast.error(`Ошибка обработки ${f.name}: ${e?.message || e}`);
        }
      }
      if (opts.keepExisting) {
        setPreviews((prev) => [...prev, ...results]);
      } else {
        setPreviews(results);
      }
      return results;
    } finally {
      setProcessing(false);
      setProgressText("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const startCropFlow = (files: File[]) => {
    const items: CropQueueItem[] = files.map((f) => ({
      id: makeId(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      type: detectedType,
    }));
    setCropQueue(items);
    setCropIndex(0);
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    startCropFlow(Array.from(files));
    if (inputRef.current) inputRef.current.value = "";
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (uploading) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === "file" && it.type.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) {
          const ext = (f.type.split("/")[1] || "png").split("+")[0];
          const named = f.name && f.name !== "image.png"
            ? f
            : new File([f], `pasted-${Date.now()}.${ext}`, { type: f.type });
          imageFiles.push(named);
        }
      }
    }
    if (imageFiles.length === 0) return;
    e.preventDefault();
    startCropFlow(imageFiles);
  };

  const closeCropFlow = () => {
    cropQueue.forEach((q) => URL.revokeObjectURL(q.previewUrl));
    setCropQueue([]);
    setCropIndex(0);
    setCrop(undefined);
    setCompletedCrop(null);
    cropImgRef.current = null;
  };

  const onCropImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const imgEl = e.currentTarget;
    cropImgRef.current = imgEl;
    const ratio = TYPE_RULES[cropQueue[cropIndex]?.type ?? "default"].ratio;
    const c = buildDefaultCrop(imgEl.width, imgEl.height, ratio);
    setCrop(c);
    const pixel: PixelCrop = {
      unit: "px",
      x: (imgEl.width * (c.x as number)) / 100,
      y: (imgEl.height * (c.y as number)) / 100,
      width: (imgEl.width * (c.width as number)) / 100,
      height: (imgEl.height * (c.height as number)) / 100,
    };
    setCompletedCrop(pixel);
  };

  const resetCurrentCrop = () => {
    const imgEl = cropImgRef.current;
    if (!imgEl) return;
    const ratio = TYPE_RULES[cropQueue[cropIndex].type].ratio;
    const c = buildDefaultCrop(imgEl.width, imgEl.height, ratio);
    setCrop(c);
    setCompletedCrop({
      unit: "px",
      x: (imgEl.width * (c.x as number)) / 100,
      y: (imgEl.height * (c.y as number)) / 100,
      width: (imgEl.width * (c.width as number)) / 100,
      height: (imgEl.height * (c.height as number)) / 100,
    });
  };

  const applyCurrentCrop = async (): Promise<Blob | null> => {
    const imgEl = cropImgRef.current;
    const cur = cropQueue[cropIndex];
    if (!imgEl || !completedCrop || !cur) return null;
    try {
      const maxW = TYPE_RULES[cur.type].maxW;
      const blob = await cropToBlob(imgEl, completedCrop, maxW);
      setCropQueue((prev) =>
        prev.map((q, i) => (i === cropIndex ? { ...q, applied: blob } : q)),
      );
      return blob;
    } catch (e: any) {
      toast.error("Не удалось обрезать: " + (e?.message || e));
      return null;
    }
  };

  const goCropPrev = () => {
    if (cropIndex > 0) {
      setCropIndex((i) => i - 1);
      setCrop(undefined);
      setCompletedCrop(null);
    }
  };

  const goCropNext = async () => {
    const cur = cropQueue[cropIndex];
    if (!cur) return;
    let blob = cur.applied;
    if (!blob) {
      const b = await applyCurrentCrop();
      if (!b) return;
      blob = b;
    }
    if (cropIndex < cropQueue.length - 1) {
      setCropIndex((i) => i + 1);
      setCrop(undefined);
      setCompletedCrop(null);
    } else {
      const updated = cropQueue.map((q, i) =>
        i === cropIndex ? { ...q, applied: blob } : q,
      );
      const results: Processed[] = [];
      for (const q of updated) {
        const b = q.applied;
        if (!b) continue;
        const name = q.file.name.replace(/\.[^.]+$/, "") + ".jpg";
        results.push({
          id: makeId(),
          originalFile: q.file,
          blob: b,
          previewUrl: URL.createObjectURL(b),
          originalName: name,
          type: q.type,
          caption: "",
        });
      }
      const keepExisting = previews.length > 0;
      closeCropFlow();
      setPreviews((prev) => (keepExisting ? [...prev, ...results] : results));
    }
  };

  const changeCropType = (newType: ImgType) => {
    setCropQueue((prev) =>
      prev.map((q, i) => (i === cropIndex ? { ...q, type: newType, applied: undefined } : q)),
    );
    const imgEl = cropImgRef.current;
    if (imgEl) {
      const ratio = TYPE_RULES[newType].ratio;
      const c = buildDefaultCrop(imgEl.width, imgEl.height, ratio);
      setCrop(c);
      setCompletedCrop({
        unit: "px",
        x: (imgEl.width * (c.x as number)) / 100,
        y: (imgEl.height * (c.y as number)) / 100,
        width: (imgEl.width * (c.width as number)) / 100,
        height: (imgEl.height * (c.height as number)) / 100,
      });
    }
  };

  const changeType = async (id: string, newType: ImgType) => {
    const current = previews.find((p) => p.id === id);
    if (!current) return;
    setReprocessingId(id);
    try {
      const blob = await processImage(current.originalFile, newType);
      const previewUrl = URL.createObjectURL(blob);
      setPreviews((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          URL.revokeObjectURL(p.previewUrl);
          return { ...p, blob, previewUrl, type: newType };
        }),
      );
    } catch (e: any) {
      toast.error("Не удалось перекадрировать: " + (e?.message || e));
    } finally {
      setReprocessingId(null);
    }
  };

  const reprocessAll = async (newType: ImgType) => {
    setProcessing(true);
    try {
      const ids = previews.map((p) => p.id);
      for (const id of ids) {
        await changeType(id, newType);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPreviews((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };


  const handleUpload = async () => {
    if (previews.length === 0) return;
    setUploading(true);
    try {
      const uploaded: { filename: string; caption: string }[] = [];
      const savedIds = new Set<string>();
      // Подсчёт индексов по каждому типу отдельно
      const typeCounters: Record<string, number> = {};
      for (let i = 0; i < previews.length; i++) {
        const p = previews[i];
        setProgressText(`Загружается ${i + 1}/${previews.length}: ${p.originalName}`);
        if (typeCounters[p.type] === undefined) {
          const { data: existingInStorage } = await supabase.storage
            .from("disease-media")
            .list(ARTICLE_IMAGES_FOLDER, { limit: 1000, search: articleSlug });
          const prefix = `${articleSlug}-${p.type}-`;
          typeCounters[p.type] =
            (existingInStorage || []).filter((f) => f.name.startsWith(prefix)).length + 1;
        }
        const idx = typeCounters[p.type]++;
        const filename = `${articleSlug}-${p.type}-${idx}.jpg`;
        const path = `${ARTICLE_IMAGES_FOLDER}/${filename}`;
        const { error: upErr } = await supabase.storage
          .from("disease-media")
          .upload(path, p.blob, { upsert: true, contentType: "image/jpeg" });
        if (upErr) {
          console.error("[PlaceholderGallery] upload error", upErr);
          toast.error(`Не удалось загрузить ${p.originalName}: ${upErr.message}`);
          continue;
        }
        uploaded.push({ filename, caption: (p.caption || "").trim() });

        // АВТОСОХРАНЕНИЕ: добавляем только что загруженный файл к АКТУАЛЬНОМУ
        // списку из БД (а не к stale-снимку), чтобы исключить затирание.
        const ok = await persistEntries((current) => {
          // дедуп по filename — на случай если upsert повторил запись
          const seen = new Set(current.map((e) => e.filename));
          const additions = uploaded
            .filter((u) => !seen.has(u.filename))
            .map((u) => ({ filename: u.filename, caption: u.caption }));
          return [...current, ...additions];
        });
        if (ok) {
          savedIds.add(p.id);
        } else {
          console.error("[PlaceholderGallery] persistEntries failed for", filename);
          toast.error(`Файл загружен, но не записан в статью: ${filename}. Не закрывайте страницу.`);
        }
      }

      setProgressText("");

      if (savedIds.size === previews.length) {
        toast.success(`Загружено и сохранено: ${savedIds.size}`);
        clearPreviews();
      } else if (savedIds.size > 0) {
        toast.success(`Сохранено: ${savedIds.size} из ${previews.length}. Остальные оставлены в очереди.`);
        // оставляем в превью только то, что НЕ сохранилось — чтобы можно было повторить
        setPreviews((prev) => {
          const remaining = prev.filter((p) => !savedIds.has(p.id));
          prev.forEach((p) => {
            if (savedIds.has(p.id)) URL.revokeObjectURL(p.previewUrl);
          });
          return remaining;
        });
      }
    } finally {
      setUploading(false);
      setProgressText("");
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onPaste={handlePaste}
      className={
        hasExisting
          ? "mt-2 mb-8 rounded-lg border border-dashed flex flex-col items-center text-center px-4 py-4 not-prose outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 bg-slate-50/50"
          : "my-8 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center px-4 py-8 not-prose outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
      }
      style={{ borderColor: "#E2EBF5", minHeight: hasExisting ? undefined : 200 }}
    >
      {hasExisting ? (
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">
          Управление галереей (admin)
        </p>
      ) : (
        <>
          <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
          {caption && <p className="text-muted-foreground mb-2 max-w-xl">{caption}</p>}
        </>
      )}

      {hasExisting && (
        <div className="w-full mb-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {existing.map((it) => (
              <div
                key={it.filename}
                className="relative w-24 h-24 rounded border bg-white overflow-hidden group"
                title={it.caption || it.filename}
              >
                <img
                  src={publicArticleImageUrl(it.filename)}
                  alt={it.caption || it.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => deleteExisting(it.filename)}
                  disabled={deletingFile !== null || uploading}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 disabled:opacity-50"
                  title="Удалить фото"
                  aria-label="Удалить фото"
                >
                  {deletingFile === it.filename ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
                {it.caption && (
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] truncate px-1">
                    {it.caption}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={uploading || deletingFile !== null}
              className="gap-1.5"
              onClick={async () => {
                const ok = await persistEntries((current) => {
                  const seen = new Set(current.map((e) => e.filename));
                  const additions = existing.filter((e) => !seen.has(e.filename));
                  return [...current, ...additions];
                });
                if (ok) toast.success(`Галерея сохранена (${existing.length} фото)`);
              }}
            >
              <Save className="w-4 h-4" />
              Сохранить галерею ({existing.length})
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
        <label className="text-xs text-muted-foreground">Формат фото:</label>
        <select
          className="text-xs border rounded px-2 py-1 bg-background"
          value={overrideType}
          disabled={processing || uploading}
          onChange={(e) => {
            const v = e.target.value as ImgType | "auto";
            setOverrideType(v);
            if (previews.length > 0) {
              const t: ImgType = v === "auto" ? autoType : v;
              reprocessAll(t);
            }
          }}
        >
          <option value="auto">Авто ({TYPE_LABEL[autoType]})</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{TYPE_LABEL[t]}</option>
          ))}
        </select>
      </div>

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

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={previews.map((p) => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className="flex flex-wrap gap-3 justify-center mb-2">
                {previews.map((p, i) => (
                  <SortableThumb
                    key={p.id}
                    item={p}
                    index={i}
                    total={previews.length}
                    isReprocessing={reprocessingId === p.id}
                    disabled={uploading}
                    onChangeType={changeType}
                    onChangeCaption={(id, caption) =>
                      setPreviews((prev) =>
                        prev.map((x) => (x.id === id ? { ...x, caption } : x)),
                      )
                    }
                    onReprocess={(id) => {
                      const cur = previews.find((x) => x.id === id);
                      if (cur) changeType(id, cur.type);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <p className="text-xs text-muted-foreground mb-3">
            Перетащите фото чтобы изменить порядок
          </p>


          <div className="flex gap-2 justify-center">
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={uploading || reprocessingId !== null}
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
        <div className="flex flex-col items-center gap-1.5">
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
                <Plus className="w-4 h-4" />{" "}
                {hasExisting ? "Добавить ещё фото" : "Добавить фотографии"}
              </>
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            или вставьте скриншот (Ctrl+V)
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {cropQueue.length > 0 && (() => {
        const cur = cropQueue[cropIndex];
        const ratio = TYPE_RULES[cur.type].ratio;
        const isLast = cropIndex === cropQueue.length - 1;
        return (
          <div
            className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="text-sm font-medium">
                  Кадрирование — Фото {cropIndex + 1} из {cropQueue.length}
                </div>
                <button
                  type="button"
                  onClick={closeCropFlow}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 border-b flex-wrap">
                <span className="text-xs text-muted-foreground">Формат:</span>
                <select
                  className="text-xs border rounded px-2 py-1 bg-background"
                  value={cur.type}
                  onChange={(e) => changeCropType(e.target.value as ImgType)}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                  ))}
                </select>
                {cur.applied && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> применено
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-4">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percent) => setCrop(percent)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={ratio ?? undefined}
                  keepSelection
                >
                  <img
                    src={cur.previewUrl}
                    alt={cur.file.name}
                    onLoad={onCropImageLoad}
                    style={{ maxHeight: "60vh", maxWidth: "100%" }}
                  />
                </ReactCrop>
              </div>

              <div className="flex items-center justify-between gap-2 px-4 py-3 border-t flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={goCropPrev}
                    disabled={cropIndex === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Назад
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {cropIndex + 1} / {cropQueue.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={resetCurrentCrop}
                    className="gap-1"
                  >
                    <RotateCcw className="w-4 h-4" /> Сбросить
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={applyCurrentCrop}
                    className="gap-1"
                  >
                    <Check className="w-4 h-4" /> Применить
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={goCropNext}
                    className="gap-1"
                  >
                    {isLast ? (
                      <>Готово <Check className="w-4 h-4" /></>
                    ) : (
                      <>Далее <ChevronRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PlaceholderGallery;
