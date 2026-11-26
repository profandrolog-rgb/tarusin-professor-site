import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Camera, Film, GripVertical, Image as ImageIcon, Loader2, Play, Trash2, Upload,
} from "lucide-react";
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { captureVideoFrame } from "@/lib/video/posters";
import {
  VIDEO_CLOUDS, deleteArticleVideo, isPlayableVideo, resolveVideoSrc,
  uploadArticleVideo, uploadVideoPoster, type VideoCloud,
} from "@/lib/video/videoStorage";
import {
  DEFAULT_VIDEO_OPTIONS, VIDEO_MODE_META, VIDEO_MODE_OPTIONS, VIDEO_RATIO_META,
  VIDEO_RATIO_OPTIONS, type VideoGalleryEntry, type VideoGalleryOptions,
  type VideoMode, type VideoRatio,
} from "@/lib/markdown/videoGalleryMarkers";

export interface VideoGalleryItem {
  id: string;
  cloud: VideoCloud;
  key: string;
  caption: string;
  /** Публичный адрес обложки (пусто — обложки нет). */
  poster: string;
  /** Имя исходного файла — только для показа в списке. */
  name: string;
  size: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ownerSlug: string;
  initialCaption: string;
  initialEntries: VideoGalleryItem[];
  initialOptions?: VideoGalleryOptions;
  onSave: (data: {
    caption: string;
    entries: VideoGalleryEntry[];
    options: VideoGalleryOptions;
  }) => void;
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : "неизвестная ошибка";
}

function formatSize(bytes: number): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`;
}

/** Выбор обложки: любой кадр видео либо свой файл. */
function PosterPicker({
  item, ownerSlug, onOpenChange, onPick,
}: {
  item: VideoGalleryItem;
  ownerSlug: string;
  onOpenChange: (v: boolean) => void;
  onPick: (url: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setSrc("");
    setError("");
    (item.key.startsWith("http")
      ? Promise.resolve(item.key)
      : resolveVideoSrc({ cloud: item.cloud, key: item.key })
    )
      .then((url) => { if (alive) setSrc(url); })
      .catch((e: unknown) => { if (alive) setError(messageOf(e)); });
    return () => { alive = false; };
  }, [item.cloud, item.key]);

  async function captureFrame() {
    const video = videoRef.current;
    if (!video) return;
    setBusy(true);
    setError("");
    try {
      const frame = await captureVideoFrame(video, `${ownerSlug || "video"}-poster`);
      const url = await uploadVideoPoster(frame, ownerSlug);
      onPick(url);
      toast.success("Обложка установлена");
      onOpenChange(false);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  async function pickFile(file: File) {
    setBusy(true);
    setError("");
    try {
      const url = await uploadVideoPoster(file, ownerSlug);
      onPick(url);
      toast.success("Обложка установлена");
      onOpenChange(false);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Обложка видео</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {src ? (
            <video
              ref={videoRef}
              src={src}
              controls
              playsInline
              crossOrigin="anonymous"
              className="w-full max-h-[50vh] bg-black rounded"
            />
          ) : (
            <div className="w-full h-48 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
              {error || "Загружаем видео…"}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={captureFrame} disabled={busy || !src}>
              <Camera className="w-4 h-4 mr-1" />
              Сделать текущий кадр обложкой
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              Свой файл обложки
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pickFile(f);
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Перемотайте видео к нужному моменту и нажмите «Сделать текущий кадр обложкой».
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SortableVideo({
  item, progress, onCaption, onPoster, onRemove,
}: {
  item: VideoGalleryItem;
  progress: number | null;
  onCaption: (v: string) => void;
  onPoster: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
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
      <div className="w-16 h-16 rounded shrink-0 bg-muted overflow-hidden flex items-center justify-center">
        {item.poster ? (
          <img
            src={item.poster}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
          />
        ) : (
          <Film className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <Input
          value={item.caption}
          onChange={(e) => onCaption(e.target.value)}
          placeholder="Подпись к видео"
          className="h-8"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant={item.poster ? "secondary" : "outline"} className="h-8 text-xs" onClick={onPoster}>
            <Camera className="w-3.5 h-3.5 mr-1" />
            {item.poster ? "Обложка есть" : "Выбрать кадр"}
          </Button>
          <Badge variant="outline" className="text-[10px] font-mono truncate max-w-[220px]">
            {item.name}
          </Badge>
          {item.size > 0 && (
            <span className="text-[10px] text-muted-foreground">{formatSize(item.size)}</span>
          )}
          {progress !== null && (
            <span className="text-[10px] text-muted-foreground">загрузка {progress}%</span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove} disabled={progress !== null}>
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  );
}

export default function VideoGalleryEditorDialog({
  open, onOpenChange, ownerSlug, initialCaption, initialEntries,
  initialOptions = DEFAULT_VIDEO_OPTIONS, onSave,
}: Props) {
  const [caption, setCaption] = useState(initialCaption);
  const [items, setItems] = useState<VideoGalleryItem[]>(initialEntries);
  const [ratio, setRatio] = useState<VideoRatio>(initialOptions.ratio);
  const [mode, setMode] = useState<VideoMode>(initialOptions.mode);
  const [restricted, setRestricted] = useState<boolean>(initialOptions.restricted);
  const [cloud, setCloud] = useState<VideoCloud>("yandex");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [posterFor, setPosterFor] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  // Файлы, убранные из галереи: удаляем из облака только после сохранения.
  const [pendingRemovals, setPendingRemovals] = useState<VideoGalleryItem[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCaption(initialCaption);
      setItems(initialEntries);
      setRatio(initialOptions.ratio);
      setMode(initialOptions.mode);
      setRestricted(initialOptions.restricted);
      setUploading(false);
      setProgress({});
      setPosterFor(null);
      setDragOver(false);
      setPendingRemovals([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialCaption, initialEntries, initialOptions.ratio, initialOptions.mode, initialOptions.restricted]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const cloudOptions = useMemo(() => VIDEO_CLOUDS, []);
  const activeCloud = cloudOptions.find((c) => c.id === cloud) || cloudOptions[0];

  async function handleFiles(files: FileList | File[] | null) {
    const arr = files ? (Array.from(files as any) as File[]) : [];
    if (!arr.length) return;
    if (!activeCloud.ready) {
      toast.error(`${activeCloud.label}: ${activeCloud.hint}`);
      return;
    }
    setUploading(true);
    for (const f of arr) {
      if (!isPlayableVideo(f)) {
        toast.error(`${f.name}: браузер не воспроизведёт этот формат`);
        continue;
      }
      const name = f.name;
      try {
        setProgress((p) => ({ ...p, [name]: 0 }));
        const ref = await uploadArticleVideo({
          file: f,
          cloud: activeCloud.id,
          onProgress: (pct) => setProgress((p) => ({ ...p, [name]: pct })),
        });
        setItems((prev) => [...prev, {
          id: crypto.randomUUID(),
          cloud: ref.cloud,
          key: ref.key,
          caption: "",
          poster: "",
          name,
          size: f.size,
        }]);
        toast.success(`Загружено: ${name}`);
      } catch (e) {
        toast.error(`${name}: ${messageOf(e)}`);
      } finally {
        setProgress((p) => {
          const next = { ...p };
          delete next[name];
          return next;
        });
      }
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((x) => x.id === active.id);
      const newIndex = prev.findIndex((x) => x.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function removeItem(id: string) {
    const im = items.find((x) => x.id === id);
    if (!im) return;
    setItems((prev) => prev.filter((x) => x.id !== id));
    setPendingRemovals((prev) => [...prev, im]);
  }

  function submit() {
    if (!items.length && !caption.trim()) {
      toast.error("Укажите подпись или добавьте видео");
      return;
    }
    const entries: VideoGalleryEntry[] = items.map((i) => ({
      key: i.key,
      caption: i.caption,
      poster: i.poster,
      cloud: i.cloud,
    }));
    onSave({
      caption: caption.trim(),
      entries,
      options: { ratio, mode, restricted },
    });
    // Удаляем файлы из облака только после сохранённого списка.
    const drop = pendingRemovals.filter((r) => !items.some((i) => i.key === r.key));
    setPendingRemovals([]);
    for (const r of drop) {
      void deleteArticleVideo({ cloud: r.cloud, key: r.key }).catch((e: unknown) => {
        console.warn("не удалось удалить видео:", messageOf(e));
      });
    }
    onOpenChange(false);
  }

  const ids = useMemo(() => items.map((x) => x.id), [items]);
  const posterItem = items.find((x) => x.id === posterFor) || null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Видеогалерея</DialogTitle></DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-sm">Подпись галереи</Label>
              <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs shrink-0">Пропорции:</Label>
                <Select value={ratio} onValueChange={(v) => setRatio(v as VideoRatio)}>
                  <SelectTrigger className="h-8 w-52 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VIDEO_RATIO_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>{VIDEO_RATIO_META[r].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs shrink-0">Просмотр:</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as VideoMode)}>
                  <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VIDEO_MODE_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>{VIDEO_MODE_META[m].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">{VIDEO_MODE_META[mode].hint}</p>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={restricted}
                onChange={(e) => setRestricted(e.target.checked)}
              />
              Медицинская шторка 18+
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-xs shrink-0">Облако:</Label>
              <Select value={cloud} onValueChange={(v) => setCloud(v as VideoCloud)}>
                <SelectTrigger className="h-8 w-64 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cloudOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id} disabled={!c.ready}>
                      {c.label}{c.ready ? "" : " — недоступно"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[11px] text-muted-foreground max-w-[320px]">{activeCloud.hint}</span>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void handleFiles(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded p-4 text-center ${
                dragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <input
                ref={fileInput}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={(e) => void handleFiles(e.target.files)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInput.current?.click()}
                disabled={uploading || !activeCloud.ready}
              >
                <Upload className="w-4 h-4 mr-1" />
                Выбрать видео
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                mp4, mov, webm. Файл можно перетащить в это окно.
              </p>
            </div>

            {items.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {items.map((im) => (
                      <SortableVideo
                        key={im.id}
                        item={im}
                        progress={progress[im.name] ?? null}
                        onCaption={(v) => setItems((prev) => prev.map((x) => (x.id === im.id ? { ...x, caption: v } : x)))}
                        onPoster={() => setPosterFor(im.id)}
                        onRemove={() => removeItem(im.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {items.length === 0 && !uploading && (
              <p className="text-xs text-muted-foreground italic">
                Видео ещё не добавлены. Пустую галерею можно сохранить, чтобы заполнить её позже.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
              Отмена
            </Button>
            <Button onClick={submit} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {posterItem && (
        <PosterPicker
          item={posterItem}
          ownerSlug={ownerSlug}
          onOpenChange={(v) => { if (!v) setPosterFor(null); }}
          onPick={(url) => setItems((prev) => prev.map((x) => (x.id === posterItem.id ? { ...x, poster: url } : x)))}
        />
      )}
    </>
  );
}
