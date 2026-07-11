import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useRef, useState, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ImageIcon, Loader2, Trash2, Save, Upload, X, Plus, Check, ChevronLeft, RotateCcw, ChevronRight, GripVertical, RefreshCw } from "lucide-react";
import { useSensors, useSensor, PointerSensor, TouchSensor, KeyboardSensor, DndContext, closestCenter } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { B as Button, s as supabase } from "../main.mjs";
import { toast } from "sonner";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import { p as parseGalleryFileEntries, u as upsertGalleryEntriesInContent, r as readGalleryEntriesFromContent } from "./galleryMarkers-BtRCpzSB.js";
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function galleryImageIndex(filenameOrPath, articleSlug, type) {
  const filename = filenameOrPath.split("/").pop() || filenameOrPath;
  const re = new RegExp(`^${escapeRegExp(articleSlug)}-${escapeRegExp(type)}-(\\d+)\\.jpg$`, "i");
  const match = filename.match(re);
  if (!match) return null;
  const index = Number.parseInt(match[1], 10);
  return Number.isFinite(index) ? index : null;
}
function nextGalleryImageIndex(existingNames, articleSlug, type) {
  const maxIndex = existingNames.reduce((max, name) => {
    const index = galleryImageIndex(name, articleSlug, type);
    return index === null ? max : Math.max(max, index);
  }, 0);
  return maxIndex + 1;
}
function isStorageCollisionError(error) {
  const value = error;
  const text = `${(value == null ? void 0 : value.message) || ""} ${(value == null ? void 0 : value.error) || ""}`.toLowerCase();
  return (value == null ? void 0 : value.statusCode) === 409 || (value == null ? void 0 : value.statusCode) === "409" || /already exists|duplicate|conflict/.test(text);
}
const ARTICLE_IMAGES_FOLDER = "article-images";
const ARTICLE_IMAGES_BUCKET = "disease-media";
const STORAGE_BASE$1 = `${"https://bpbwkizvvythqotcyfii.supabase.co"}/storage/v1/object/public/${ARTICLE_IMAGES_BUCKET}`;
function publicArticleImageUrl(filename) {
  const safe = filename.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `${STORAGE_BASE$1}/${ARTICLE_IMAGES_FOLDER}/${safe}`;
}
const TYPE_RULES = {
  surgery: { ratio: 4 / 3, crop: "center", maxW: 1600 },
  anatomy: { ratio: 4 / 3, crop: "center", maxW: 1600 },
  ultrasound: { ratio: 1, crop: "center", maxW: 1200 },
  patient: { ratio: 3 / 4, crop: "top", maxW: 1e3 },
  "patient-full": { ratio: 9 / 16, crop: "center", maxW: 800 },
  urology: { ratio: 3 / 4, crop: "center", maxW: 1e3 },
  "urology-closeup": { ratio: 1, crop: "center", maxW: 1200 },
  infographic: { ratio: null, crop: "center", maxW: 1800 },
  default: { ratio: 4 / 3, crop: "center", maxW: 1600 }
};
const TYPE_LABEL = {
  surgery: "Операция (4:3)",
  ultrasound: "УЗИ (1:1)",
  patient: "Пациент (3:4, от верха)",
  "patient-full": "Рост (9:16, центр)",
  urology: "Урология (3:4, центр)",
  "urology-closeup": "Урология крупный план (1:1, центр)",
  infographic: "Инфографика (без кадра)",
  anatomy: "Анатомия (4:3)",
  default: "По умолчанию (4:3)"
};
const TYPE_OPTIONS = ["surgery", "ultrasound", "patient", "patient-full", "urology", "urology-closeup", "infographic", "anatomy", "default"];
function detectType(caption) {
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
function loadImageFromBlob(blob) {
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
async function processImage(source, type) {
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
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => b ? resolve(b) : reject(new Error("toBlob failed")),
      "image/jpeg",
      0.85
    );
  });
}
function buildDefaultCrop(imgW, imgH, ratio) {
  if (ratio === null) {
    return { unit: "%", x: 0, y: 0, width: 100, height: 100 };
  }
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, ratio, imgW, imgH),
    imgW,
    imgH
  );
}
async function cropToBlob(imgEl, pixelCrop, maxW) {
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
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => b ? resolve(b) : reject(new Error("toBlob failed")),
      "image/jpeg",
      0.9
    );
  });
}
const SortableThumb = ({
  item,
  index,
  isReprocessing,
  disabled,
  onChangeType,
  onChangeCaption,
  onReprocess
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : void 0,
    boxShadow: isDragging ? "0 10px 25px -5px rgba(0,0,0,0.25), 0 8px 10px -6px rgba(0,0,0,0.1)" : void 0,
    opacity: isDragging ? 0.95 : 1
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: setNodeRef,
      style,
      className: "flex flex-col items-center gap-1.5 w-32 bg-background rounded",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "relative w-32 h-32", children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: item.previewUrl,
              alt: item.originalName,
              className: "w-32 h-32 object-cover rounded border bg-white pointer-events-none select-none",
              draggable: false
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              ...attributes,
              ...listeners,
              className: "absolute top-1 left-1 bg-black/60 text-white rounded p-0.5 cursor-grab active:cursor-grabbing touch-none",
              title: "Перетащить",
              "aria-label": "Перетащить миниатюру",
              children: /* @__PURE__ */ jsx(GripVertical, { className: "w-3.5 h-3.5" })
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "absolute bottom-6 right-1 bg-primary text-primary-foreground text-[11px] font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow", children: index + 1 }),
          isReprocessing && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 flex items-center justify-center rounded", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin text-white" }) }),
          /* @__PURE__ */ jsx("span", { className: "absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] truncate px-1 rounded-b", children: item.originalName })
        ] }),
        /* @__PURE__ */ jsx(
          "select",
          {
            className: "text-xs border rounded px-1 py-0.5 bg-background w-full",
            value: item.type,
            disabled: isReprocessing || disabled,
            onChange: (e) => onChangeType(item.id, e.target.value),
            title: TYPE_LABEL[item.type],
            children: TYPE_OPTIONS.map((t) => /* @__PURE__ */ jsx("option", { value: t, children: TYPE_LABEL[t] }, t))
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => onReprocess(item.id),
            disabled: isReprocessing || disabled,
            className: "text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5",
            title: "Повторно применить кадрирование",
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3" }),
              " перекадрировать"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: item.caption,
            onChange: (e) => onChangeCaption(item.id, e.target.value),
            disabled,
            placeholder: "Подпись к фото (необязательно)",
            className: "text-[11px] border rounded px-1.5 py-1 bg-background w-full"
          }
        )
      ]
    }
  );
};
const PlaceholderGallery = ({
  articleId,
  articleSlug,
  caption,
  marker,
  fullContent,
  existingFiles,
  onContentChange
}) => {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [reprocessingId, setReprocessingId] = useState(null);
  const [overrideType, setOverrideType] = useState("auto");
  const [deletingFile, setDeletingFile] = useState(null);
  const [cropQueue, setCropQueue] = useState([]);
  const [cropIndex, setCropIndex] = useState(0);
  const [crop, setCrop] = useState(void 0);
  const [completedCrop, setCompletedCrop] = useState(null);
  const cropImgRef = useRef(null);
  const existing = useMemo(
    () => parseGalleryFileEntries((existingFiles ?? []).join("|")),
    [existingFiles]
  );
  const hasExisting = existing.length > 0;
  const parseMarkerFilesFromContent = (content) => {
    return readGalleryEntriesFromContent(content, caption);
  };
  const persistEntries = async (writer) => {
    const { data: fresh, error: fetchErr } = await supabase.from("disease_articles").select("article_content").eq("id", articleId).maybeSingle();
    if (fetchErr || !fresh) {
      toast.error("Не удалось прочитать статью: " + ((fetchErr == null ? void 0 : fetchErr.message) || "нет данных"));
      return false;
    }
    const baseContent = fresh.article_content || fullContent;
    const currentFiles = parseMarkerFilesFromContent(baseContent);
    const nextEntries = typeof writer === "function" ? writer(currentFiles) : writer;
    const result = upsertGalleryEntriesInContent(baseContent, caption, nextEntries, marker);
    const newContent = result.content;
    if (!result.found) {
      toast.warning("Маркер галереи не найден в статье — добавил в конец, чтобы фото не потерялись");
    }
    const { error, data: updated } = await supabase.from("disease_articles").update({ article_content: newContent }).eq("id", articleId).select("id");
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
    onContentChange == null ? void 0 : onContentChange(newContent);
    return true;
  };
  const deleteExisting = async (filename) => {
    if (deletingFile) return;
    if (!confirm("Удалить это фото из галереи?")) return;
    setDeletingFile(filename);
    try {
      await supabase.storage.from("disease-media").remove([`${ARTICLE_IMAGES_FOLDER}/${filename}`]);
      const ok = await persistEntries(
        (current) => current.filter((e) => e.filename !== filename)
      );
      if (ok) toast.success("Фото удалено");
    } finally {
      setDeletingFile(null);
    }
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const autoType = detectType(caption);
  const detectedType = overrideType === "auto" ? autoType : overrideType;
  const makeId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const clearPreviews = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPreviews([]);
  };
  const startCropFlow = (files) => {
    const items = files.map((f) => ({
      id: makeId(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      type: detectedType
    }));
    setCropQueue(items);
    setCropIndex(0);
    setCrop(void 0);
    setCompletedCrop(null);
  };
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    startCropFlow(Array.from(files));
    if (inputRef.current) inputRef.current.value = "";
  };
  const handlePaste = async (e) => {
    var _a;
    if (uploading) return;
    const items = (_a = e.clipboardData) == null ? void 0 : _a.items;
    if (!items) return;
    const imageFiles = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === "file" && it.type.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) {
          const ext = (f.type.split("/")[1] || "png").split("+")[0];
          const named = f.name && f.name !== "image.png" ? f : new File([f], `pasted-${Date.now()}.${ext}`, { type: f.type });
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
    setCrop(void 0);
    setCompletedCrop(null);
    cropImgRef.current = null;
  };
  const onCropImageLoad = (e) => {
    var _a;
    const imgEl = e.currentTarget;
    cropImgRef.current = imgEl;
    const ratio = TYPE_RULES[((_a = cropQueue[cropIndex]) == null ? void 0 : _a.type) ?? "default"].ratio;
    const c = buildDefaultCrop(imgEl.width, imgEl.height, ratio);
    setCrop(c);
    const pixel = {
      unit: "px",
      x: imgEl.width * c.x / 100,
      y: imgEl.height * c.y / 100,
      width: imgEl.width * c.width / 100,
      height: imgEl.height * c.height / 100
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
      x: imgEl.width * c.x / 100,
      y: imgEl.height * c.y / 100,
      width: imgEl.width * c.width / 100,
      height: imgEl.height * c.height / 100
    });
  };
  const applyCurrentCrop = async () => {
    const imgEl = cropImgRef.current;
    const cur = cropQueue[cropIndex];
    if (!imgEl || !completedCrop || !cur) return null;
    try {
      const maxW = TYPE_RULES[cur.type].maxW;
      const blob = await cropToBlob(imgEl, completedCrop, maxW);
      setCropQueue(
        (prev) => prev.map((q, i) => i === cropIndex ? { ...q, applied: blob } : q)
      );
      return blob;
    } catch (e) {
      toast.error("Не удалось обрезать: " + ((e == null ? void 0 : e.message) || e));
      return null;
    }
  };
  const goCropPrev = () => {
    if (cropIndex > 0) {
      setCropIndex((i) => i - 1);
      setCrop(void 0);
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
      setCrop(void 0);
      setCompletedCrop(null);
    } else {
      const updated = cropQueue.map(
        (q, i) => i === cropIndex ? { ...q, applied: blob } : q
      );
      const results = [];
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
          caption: ""
        });
      }
      const keepExisting = previews.length > 0;
      closeCropFlow();
      setPreviews((prev) => keepExisting ? [...prev, ...results] : results);
    }
  };
  const changeCropType = (newType) => {
    setCropQueue(
      (prev) => prev.map((q, i) => i === cropIndex ? { ...q, type: newType, applied: void 0 } : q)
    );
    const imgEl = cropImgRef.current;
    if (imgEl) {
      const ratio = TYPE_RULES[newType].ratio;
      const c = buildDefaultCrop(imgEl.width, imgEl.height, ratio);
      setCrop(c);
      setCompletedCrop({
        unit: "px",
        x: imgEl.width * c.x / 100,
        y: imgEl.height * c.y / 100,
        width: imgEl.width * c.width / 100,
        height: imgEl.height * c.height / 100
      });
    }
  };
  const changeType = async (id, newType) => {
    const current = previews.find((p) => p.id === id);
    if (!current) return;
    setReprocessingId(id);
    try {
      const blob = await processImage(current.originalFile, newType);
      const previewUrl = URL.createObjectURL(blob);
      setPreviews(
        (prev) => prev.map((p) => {
          if (p.id !== id) return p;
          URL.revokeObjectURL(p.previewUrl);
          return { ...p, blob, previewUrl, type: newType };
        })
      );
    } catch (e) {
      toast.error("Не удалось перекадрировать: " + ((e == null ? void 0 : e.message) || e));
    } finally {
      setReprocessingId(null);
    }
  };
  const reprocessAll = async (newType) => {
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
  const handleDragEnd = (event) => {
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
      const uploaded = [];
      const savedIds = /* @__PURE__ */ new Set();
      const typeCounters = {};
      for (let i = 0; i < previews.length; i++) {
        const p = previews[i];
        setProgressText(`Загружается ${i + 1}/${previews.length}: ${p.originalName}`);
        if (typeCounters[p.type] === void 0) {
          const { data: existingInStorage, error: listErr } = await supabase.storage.from("disease-media").list(ARTICLE_IMAGES_FOLDER, { limit: 1e3, search: `${articleSlug}-${p.type}-` });
          if (listErr) {
            console.error("[PlaceholderGallery] storage list error", listErr);
            toast.error(`Не удалось проверить номера файлов: ${listErr.message}`);
            continue;
          }
          typeCounters[p.type] = nextGalleryImageIndex(
            (existingInStorage || []).map((f) => f.name),
            articleSlug,
            p.type
          );
        }
        let filename = "";
        let upErr = null;
        for (let attempt = 0; attempt < 20; attempt++) {
          const idx = typeCounters[p.type]++;
          filename = `${articleSlug}-${p.type}-${idx}.jpg`;
          const path = `${ARTICLE_IMAGES_FOLDER}/${filename}`;
          const { error } = await supabase.storage.from("disease-media").upload(path, p.blob, { upsert: false, contentType: "image/jpeg" });
          if (!error) {
            upErr = null;
            break;
          }
          upErr = error;
          if (!isStorageCollisionError(error)) break;
        }
        if (upErr || !filename) {
          console.error("[PlaceholderGallery] upload error", upErr);
          toast.error(`Не удалось загрузить ${p.originalName}: ${(upErr == null ? void 0 : upErr.message) || "не удалось подобрать имя файла"}`);
          continue;
        }
        uploaded.push({ filename, caption: (p.caption || "").trim() });
        const ok = await persistEntries((current) => {
          const seen = new Set(current.map((e) => e.filename));
          const additions = uploaded.filter((u) => !seen.has(u.filename)).map((u) => ({ filename: u.filename, caption: u.caption }));
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
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: containerRef,
      tabIndex: 0,
      onPaste: handlePaste,
      className: hasExisting ? "mt-2 mb-8 rounded-lg border border-dashed flex flex-col items-center text-center px-4 py-4 not-prose outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 bg-slate-50/50" : "my-8 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center px-4 py-8 not-prose outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
      style: { borderColor: "#E2EBF5", minHeight: hasExisting ? void 0 : 200 },
      children: [
        hasExisting ? /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold", children: "Управление галереей (admin)" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(ImageIcon, { className: "w-10 h-10 text-muted-foreground mb-3" }),
          caption && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-2 max-w-xl", children: caption })
        ] }),
        hasExisting && /* @__PURE__ */ jsxs("div", { className: "w-full mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 justify-center", children: existing.map((it) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "relative w-24 h-24 rounded border bg-white overflow-hidden group",
              title: it.caption || it.filename,
              children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: publicArticleImageUrl(it.filename),
                    alt: it.caption || it.filename,
                    className: "w-full h-full object-cover",
                    loading: "lazy"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => deleteExisting(it.filename),
                    disabled: deletingFile !== null || uploading,
                    className: "absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 disabled:opacity-50",
                    title: "Удалить фото",
                    "aria-label": "Удалить фото",
                    children: deletingFile === it.filename ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" })
                  }
                ),
                it.caption && /* @__PURE__ */ jsx("span", { className: "absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] truncate px-1", children: it.caption })
              ]
            },
            it.filename
          )) }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-3", children: /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              size: "sm",
              variant: "secondary",
              disabled: uploading || deletingFile !== null,
              className: "gap-1.5",
              onClick: async () => {
                const ok = await persistEntries((current) => {
                  const seen = new Set(current.map((e) => e.filename));
                  const additions = existing.filter((e) => !seen.has(e.filename));
                  return [...current, ...additions];
                });
                if (ok) toast.success(`Галерея сохранена (${existing.length} фото)`);
              },
              children: [
                /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
                "Сохранить галерею (",
                existing.length,
                ")"
              ]
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4 flex-wrap justify-center", children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground", children: "Формат фото:" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              className: "text-xs border rounded px-2 py-1 bg-background",
              value: overrideType,
              disabled: processing || uploading,
              onChange: (e) => {
                const v = e.target.value;
                setOverrideType(v);
                if (previews.length > 0) {
                  const t = v === "auto" ? autoType : v;
                  reprocessAll(t);
                }
              },
              children: [
                /* @__PURE__ */ jsxs("option", { value: "auto", children: [
                  "Авто (",
                  TYPE_LABEL[autoType],
                  ")"
                ] }),
                TYPE_OPTIONS.map((t) => /* @__PURE__ */ jsx("option", { value: t, children: TYPE_LABEL[t] }, t))
              ]
            }
          )
        ] }),
        processing && /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "h-2 bg-muted rounded overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-primary animate-pulse w-2/3" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1.5", children: progressText })
        ] }),
        previews.length > 0 && /* @__PURE__ */ jsxs("div", { className: "w-full mb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 mb-3 flex-wrap", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Применить ко всем:" }),
            TYPE_OPTIONS.map((t) => /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                size: "sm",
                variant: "outline",
                className: "h-7 text-xs",
                disabled: processing || uploading,
                onClick: () => reprocessAll(t),
                children: t
              },
              t
            ))
          ] }),
          /* @__PURE__ */ jsx(
            DndContext,
            {
              sensors,
              collisionDetection: closestCenter,
              onDragEnd: handleDragEnd,
              children: /* @__PURE__ */ jsx(
                SortableContext,
                {
                  items: previews.map((p) => p.id),
                  strategy: rectSortingStrategy,
                  children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-3 justify-center mb-2", children: previews.map((p, i) => /* @__PURE__ */ jsx(
                    SortableThumb,
                    {
                      item: p,
                      index: i,
                      total: previews.length,
                      isReprocessing: reprocessingId === p.id,
                      disabled: uploading,
                      onChangeType: changeType,
                      onChangeCaption: (id, caption2) => setPreviews(
                        (prev) => prev.map((x) => x.id === id ? { ...x, caption: caption2 } : x)
                      ),
                      onReprocess: (id) => {
                        const cur = previews.find((x) => x.id === id);
                        if (cur) changeType(id, cur.type);
                      }
                    },
                    p.id
                  )) })
                }
              )
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-3", children: "Перетащите фото чтобы изменить порядок" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-center", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                size: "sm",
                onClick: handleUpload,
                disabled: uploading || reprocessingId !== null,
                className: "gap-1.5",
                children: [
                  uploading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
                  "Загрузить (",
                  previews.length,
                  ")"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                size: "sm",
                variant: "outline",
                onClick: clearPreviews,
                disabled: uploading,
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }),
                  " Отмена"
                ]
              }
            )
          ] })
        ] }),
        previews.length === 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => {
                var _a;
                return (_a = inputRef.current) == null ? void 0 : _a.click();
              },
              disabled: processing,
              className: "gap-2",
              children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
                " Обработка..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                " ",
                hasExisting ? "Добавить ещё фото" : "Добавить фотографии"
              ] })
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "или вставьте скриншот (Ctrl+V)" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: inputRef,
            type: "file",
            accept: "image/*",
            multiple: true,
            className: "hidden",
            onChange: (e) => handleFiles(e.target.files)
          }
        ),
        cropQueue.length > 0 && (() => {
          const cur = cropQueue[cropIndex];
          const ratio = TYPE_RULES[cur.type].ratio;
          const isLast = cropIndex === cropQueue.length - 1;
          return /* @__PURE__ */ jsx(
            "div",
            {
              className: "fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4",
              onClick: (e) => e.stopPropagation(),
              children: /* @__PURE__ */ jsxs("div", { className: "bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[92vh] flex flex-col", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b", children: [
                  /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium", children: [
                    "Кадрирование — Фото ",
                    cropIndex + 1,
                    " из ",
                    cropQueue.length
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: closeCropFlow,
                      className: "text-muted-foreground hover:text-foreground",
                      "aria-label": "Закрыть",
                      children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-4 py-2 border-b flex-wrap", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Формат:" }),
                  /* @__PURE__ */ jsx(
                    "select",
                    {
                      className: "text-xs border rounded px-2 py-1 bg-background",
                      value: cur.type,
                      onChange: (e) => changeCropType(e.target.value),
                      children: TYPE_OPTIONS.map((t) => /* @__PURE__ */ jsx("option", { value: t, children: TYPE_LABEL[t] }, t))
                    }
                  ),
                  cur.applied && /* @__PURE__ */ jsxs("span", { className: "text-xs text-green-600 flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(Check, { className: "w-3 h-3" }),
                    " применено"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-4", children: /* @__PURE__ */ jsx(
                  ReactCrop,
                  {
                    crop,
                    onChange: (_, percent) => setCrop(percent),
                    onComplete: (c) => setCompletedCrop(c),
                    aspect: ratio ?? void 0,
                    keepSelection: true,
                    children: /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: cur.previewUrl,
                        alt: cur.file.name,
                        onLoad: onCropImageLoad,
                        style: { maxHeight: "60vh", maxWidth: "100%" }
                      }
                    )
                  }
                ) }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 px-4 py-3 border-t flex-wrap", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxs(
                      Button,
                      {
                        type: "button",
                        size: "sm",
                        variant: "outline",
                        onClick: goCropPrev,
                        disabled: cropIndex === 0,
                        className: "gap-1",
                        children: [
                          /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" }),
                          " Назад"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                      cropIndex + 1,
                      " / ",
                      cropQueue.length
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                    /* @__PURE__ */ jsxs(
                      Button,
                      {
                        type: "button",
                        size: "sm",
                        variant: "ghost",
                        onClick: resetCurrentCrop,
                        className: "gap-1",
                        children: [
                          /* @__PURE__ */ jsx(RotateCcw, { className: "w-4 h-4" }),
                          " Сбросить"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      Button,
                      {
                        type: "button",
                        size: "sm",
                        variant: "outline",
                        onClick: applyCurrentCrop,
                        className: "gap-1",
                        children: [
                          /* @__PURE__ */ jsx(Check, { className: "w-4 h-4" }),
                          " Применить"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Button,
                      {
                        type: "button",
                        size: "sm",
                        onClick: goCropNext,
                        className: "gap-1",
                        children: isLast ? /* @__PURE__ */ jsxs(Fragment, { children: [
                          "Готово ",
                          /* @__PURE__ */ jsx(Check, { className: "w-4 h-4" })
                        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                          "Далее ",
                          /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" })
                        ] })
                      }
                    )
                  ] })
                ] })
              ] })
            }
          );
        })()
      ]
    }
  );
};
const FOLDER = "article-images";
const BUCKET = "disease-media";
const STORAGE_BASE = `${"https://bpbwkizvvythqotcyfii.supabase.co"}/storage/v1/object/public/${BUCKET}`;
function publicUrl(filename) {
  const safe = filename.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `${STORAGE_BASE}/${FOLDER}/${safe}`;
}
function parseEntry(raw) {
  const s = raw.trim();
  const m = s.match(/^(\S+)\s+["'“”]([^"'“”]*)["'“”]\s*$/);
  if (m) return { filename: m[1], caption: m[2].trim() };
  return { filename: s, caption: "" };
}
const ImageGallery = ({ caption, files }) => {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const items = useMemo(() => files.map(parseEntry), [files]);
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowLeft") setLightboxIdx((i) => i === null ? null : Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setLightboxIdx((i) => i === null ? null : Math.min(items.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, items.length]);
  const isSingle = items.length === 1;
  const photoCaptionStyle = {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 6
  };
  const watermarkStyle = {
    position: "absolute",
    right: 12,
    bottom: 12,
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.7)",
    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
    pointerEvents: "none",
    userSelect: "none",
    letterSpacing: 0.2
  };
  const noContextMenu = (e) => e.preventDefault();
  const noDragStart = (e) => e.preventDefault();
  const isInfographic = (filename) => /-infographic-/i.test(filename);
  const isPatientFull = (filename) => /-patient-full-/i.test(filename);
  const PATIENT_FULL_H = 500;
  const PATIENT_FULL_W = Math.round(PATIENT_FULL_H * 9 / 16);
  return /* @__PURE__ */ jsxs(
    "figure",
    {
      className: "my-8 not-prose select-none max-w-full overflow-x-visible",
      style: { userSelect: "none" },
      children: [
        caption && /* @__PURE__ */ jsx("h4", { className: "text-base md:text-lg font-semibold mb-3", style: { color: "#1B4F8A" }, children: caption }),
        isSingle ? (() => {
          const single = items[0];
          const single_patientFull = isPatientFull(single.filename);
          const wrapperClass = single_patientFull ? "mx-auto" : "max-w-[860px] mx-auto w-full";
          const wrapperStyle = single_patientFull ? { width: PATIENT_FULL_W, maxWidth: "100%" } : {};
          const imgStyle = single_patientFull ? {
            maxWidth: "100%",
            width: "auto",
            height: PATIENT_FULL_H,
            maxHeight: "70vh",
            objectFit: "contain",
            display: "block",
            margin: "0 auto"
          } : {
            maxWidth: "100%",
            width: "100%",
            height: "auto",
            objectFit: "contain",
            display: "block"
          };
          return /* @__PURE__ */ jsxs("div", { className: wrapperClass, style: wrapperStyle, children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setLightboxIdx(0),
                className: "relative block w-full rounded-lg border border-border hover:opacity-95 transition bg-background",
                children: [
                  /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: publicUrl(single.filename),
                      alt: single.caption || caption || "Фото 1",
                      loading: "lazy",
                      style: imgStyle,
                      draggable: false,
                      onDragStart: noDragStart,
                      onContextMenu: noContextMenu
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { style: watermarkStyle, children: "tarusin.pro" })
                ]
              }
            ),
            single.caption && /* @__PURE__ */ jsx("figcaption", { style: photoCaptionStyle, children: single.caption })
          ] });
        })() : /* @__PURE__ */ jsx("div", { className: "flex flex-wrap justify-center gap-3", children: items.map((it, i) => {
          const patientFull = isPatientFull(it.filename);
          const itemClass = patientFull ? "shrink-0" : "basis-full sm:basis-[calc(50%-0.375rem)] sm:max-w-[calc(50%-0.375rem)] md:basis-[calc(33.333%-0.5rem)] md:max-w-[calc(33.333%-0.5rem)]";
          const itemStyle = patientFull ? { width: PATIENT_FULL_W, maxWidth: "100%" } : {};
          return /* @__PURE__ */ jsxs("div", { className: itemClass, style: itemStyle, children: [
            isInfographic(it.filename) ? /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setLightboxIdx(i),
                className: "relative block w-full rounded-lg border border-border hover:opacity-95 transition bg-background",
                children: [
                  /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: publicUrl(it.filename),
                      alt: it.caption || caption || `Фото ${i + 1}`,
                      loading: "lazy",
                      style: {
                        maxWidth: "100%",
                        width: "100%",
                        height: "auto",
                        objectFit: "contain",
                        display: "block"
                      },
                      draggable: false,
                      onDragStart: noDragStart,
                      onContextMenu: noContextMenu
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { style: watermarkStyle, children: "tarusin.pro" })
                ]
              }
            ) : /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setLightboxIdx(i),
                className: "relative block w-full overflow-hidden rounded-lg border border-border hover:opacity-95 transition",
                style: { aspectRatio: patientFull ? "9 / 16" : "4 / 3", height: patientFull ? PATIENT_FULL_H : void 0 },
                children: [
                  /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: publicUrl(it.filename),
                      alt: it.caption || caption || `Фото ${i + 1}`,
                      loading: "lazy",
                      className: "w-full h-full object-cover",
                      style: { maxWidth: "100%", height: "100%" },
                      draggable: false,
                      onDragStart: noDragStart,
                      onContextMenu: noContextMenu
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { style: watermarkStyle, children: "tarusin.pro" })
                ]
              }
            ),
            it.caption && /* @__PURE__ */ jsx("figcaption", { style: photoCaptionStyle, children: it.caption })
          ] }, it.filename + i);
        }) }),
        lightboxIdx !== null && /* @__PURE__ */ jsxs(
          "div",
          {
            className: "fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 select-none",
            style: { userSelect: "none" },
            onClick: () => setLightboxIdx(null),
            onContextMenu: noContextMenu,
            children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full",
                  onClick: (e) => {
                    e.stopPropagation();
                    setLightboxIdx(null);
                  },
                  "aria-label": "Закрыть",
                  children: /* @__PURE__ */ jsx(X, { className: "w-7 h-7" })
                }
              ),
              items.length > 1 && lightboxIdx > 0 && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "absolute left-4 text-white p-2 hover:bg-white/10 rounded-full",
                  onClick: (e) => {
                    e.stopPropagation();
                    setLightboxIdx((i) => i === null ? null : Math.max(0, i - 1));
                  },
                  "aria-label": "Назад",
                  children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-8 h-8" })
                }
              ),
              items.length > 1 && lightboxIdx < items.length - 1 && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "absolute right-4 text-white p-2 hover:bg-white/10 rounded-full",
                  onClick: (e) => {
                    e.stopPropagation();
                    setLightboxIdx((i) => i === null ? null : Math.min(items.length - 1, i + 1));
                  },
                  "aria-label": "Вперёд",
                  children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-8 h-8" })
                }
              ),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "relative max-w-full max-h-full flex items-center justify-center",
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: publicUrl(items[lightboxIdx].filename),
                        alt: items[lightboxIdx].caption || caption || `Фото ${lightboxIdx + 1}`,
                        className: "max-w-full max-h-[90vh] object-contain",
                        draggable: false,
                        onDragStart: noDragStart,
                        onContextMenu: noContextMenu
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { style: watermarkStyle, children: "tarusin.pro" })
                  ]
                }
              ),
              items[lightboxIdx].caption && /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute bottom-0 left-0 right-0 px-6 py-4 text-center pointer-events-none",
                  style: {
                    background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))",
                    color: "#fff",
                    fontSize: 14
                  },
                  children: items[lightboxIdx].caption
                }
              )
            ]
          }
        )
      ]
    }
  );
};
const GALLERY_RE = /\[\[GALLERY:\s*caption\s*=\s*["'“”]([^"'“”]*)["'“”]\s*((?:\|[^\]]*)?)\]\]/g;
function parseGalleryFiles(rest) {
  if (!rest) return [];
  return rest.split("|").map((s) => s.trim()).filter(Boolean);
}
function parseArticleContent(content) {
  const segments = [];
  let lastIndex = 0;
  const re = new RegExp(GALLERY_RE.source, "g");
  let m;
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: "md", content: content.slice(lastIndex, m.index) });
    }
    segments.push({
      type: "gallery",
      content: m[0],
      gallery: {
        marker: m[0],
        caption: m[1] || "",
        files: parseGalleryFiles(m[2] || "")
      }
    });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ type: "md", content: content.slice(lastIndex) });
  }
  return segments;
}
function normalizeHorizontalRules(md) {
  let out = md;
  out = out.replace(
    /^[ \t]*[*_~]{1,3}\s*(?:\\?-){3,}\s*[*_~]{1,3}[ \t]*$/gm,
    "---"
  );
  out = out.replace(/^[ \t]*(?:\\-){3,}[ \t]*$/gm, "---");
  out = out.replace(
    /[*_~]{1,3}\s*(\[\[GALLERY:[^\]]*\]\])\s*[*_~]{1,3}/g,
    "$1"
  );
  return out.replace(/([^\n])\n(-{3,})\s*\n/g, "$1\n\n$2\n\n").replace(/\n(-{3,})\s*\n([^\n])/g, "\n\n$1\n\n$2");
}
function stripDuplicateTitle(md, title) {
  if (!title) return md;
  const normalize = (s) => s.trim().toLowerCase().replace(/[*_`#]/g, "").replace(/\s+/g, " ").trim();
  const target = normalize(title);
  const lines = md.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i >= lines.length) return md;
  const first = lines[i];
  const headingMatch = first.match(/^#{1,3}\s+(.+?)\s*#*\s*$/);
  if (headingMatch && normalize(headingMatch[1]) === target) {
    lines.splice(i, 1);
    return lines.join("\n");
  }
  if (i + 1 < lines.length && /^(=+|-+)\s*$/.test(lines[i + 1]) && normalize(first) === target) {
    lines.splice(i, 2);
    return lines.join("\n");
  }
  if (/^\*\*(.+)\*\*\s*$/.test(first.trim()) && normalize(first) === target) {
    lines.splice(i, 1);
    return lines.join("\n");
  }
  if (normalize(first) === target) {
    lines.splice(i, 1);
    return lines.join("\n");
  }
  return md;
}
const MarkdownArticle = ({ content, articleId, articleSlug, isAdmin, title, onContentChange }) => {
  const segments = useMemo(
    () => parseArticleContent(normalizeHorizontalRules(stripDuplicateTitle(content, title))),
    [content, title]
  );
  return /* @__PURE__ */ jsx("div", { className: "article-markdown prose prose-base max-w-none overflow-x-visible text-foreground prose-strong:text-foreground prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic [&_p]:mb-7 [&_p]:leading-[1.85] [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-2 [&_li]:pl-1 [&_li]:marker:text-foreground", children: segments.map((seg, i) => {
    if (seg.type === "md") {
      return /* @__PURE__ */ jsx(
        ReactMarkdown,
        {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeRaw],
          components: {
            hr: () => /* @__PURE__ */ jsx(
              "hr",
              {
                style: {
                  border: "none",
                  borderTop: "2px solid #E2EBF5",
                  margin: "32px 0"
                }
              }
            ),
            h1: ({ children }) => /* @__PURE__ */ jsx("h2", { style: { fontSize: "26px", fontWeight: 700, color: "#1B4F8A", marginTop: "40px", marginBottom: "16px", lineHeight: 1.3 }, children }),
            h2: ({ children }) => /* @__PURE__ */ jsx("h2", { style: { fontSize: "26px", fontWeight: 700, color: "#1B4F8A", marginTop: "40px", marginBottom: "16px", lineHeight: 1.3 }, children }),
            h3: ({ children }) => /* @__PURE__ */ jsx("h3", { style: { fontSize: "20px", fontWeight: 600, color: "#1A1A1A", marginTop: "28px", marginBottom: "12px", lineHeight: 1.35 }, children })
          },
          children: seg.content
        },
        i
      );
    }
    const g = seg.gallery;
    if (g.files.length === 0) {
      if (!isAdmin) {
        return null;
      }
      return /* @__PURE__ */ jsx(
        PlaceholderGallery,
        {
          articleId,
          articleSlug,
          caption: g.caption,
          marker: g.marker,
          fullContent: content,
          onContentChange
        },
        i
      );
    }
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(ImageGallery, { caption: g.caption, files: g.files }),
      isAdmin && /* @__PURE__ */ jsx(
        PlaceholderGallery,
        {
          articleId,
          articleSlug,
          caption: g.caption,
          marker: g.marker,
          fullContent: content,
          existingFiles: g.files,
          onContentChange
        }
      )
    ] }, i);
  }) });
};
export {
  ImageGallery as I,
  MarkdownArticle as M,
  PlaceholderGallery as P
};
