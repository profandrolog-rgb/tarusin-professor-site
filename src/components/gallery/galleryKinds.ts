// Единый набор типов изображений галереи (пропорции + автокадрирование).
// Используется как в статьях (PlaceholderGallery на публичной странице),
// так и в научных обзорах (GalleryEditorDialog в редакторе).

export type GalleryKind =
  | "normal"           // legacy для обзоров — трактуем как default 4:3
  | "surgery"          // 4:3, центр
  | "ultrasound"       // 1:1, центр
  | "patient"          // 3:4, от верха
  | "patient-full"     // 9:16, центр (рост)
  | "urology"          // 3:4, центр
  | "urology-closeup"  // 1:1, центр
  | "infographic"      // без обрезки
  | "anatomy"          // 4:3, центр
  | "default";         // 4:3, центр

export interface KindRule {
  ratio: number | null; // width / height; null = без обрезки
  crop: "center" | "top";
  maxW: number;
  label: string;
}

export const GALLERY_KINDS: Record<GalleryKind, KindRule> = {
  normal:            { ratio: 4 / 3,  crop: "center", maxW: 1600, label: "Обычное (4:3)" },
  surgery:           { ratio: 4 / 3,  crop: "center", maxW: 1600, label: "Операция (4:3)" },
  anatomy:           { ratio: 4 / 3,  crop: "center", maxW: 1600, label: "Анатомия (4:3)" },
  ultrasound:        { ratio: 1,      crop: "center", maxW: 1200, label: "УЗИ (1:1)" },
  patient:           { ratio: 3 / 4,  crop: "top",    maxW: 1000, label: "Пациент (3:4, от верха)" },
  "patient-full":    { ratio: 9 / 16, crop: "center", maxW: 800,  label: "Рост (9:16, центр)" },
  urology:           { ratio: 3 / 4,  crop: "center", maxW: 1000, label: "Урология (3:4, центр)" },
  "urology-closeup": { ratio: 1,      crop: "center", maxW: 1200, label: "Урология крупно (1:1)" },
  infographic:       { ratio: null,   crop: "center", maxW: 1800, label: "Инфографика (без кадра)" },
  default:           { ratio: 4 / 3,  crop: "center", maxW: 1600, label: "По умолчанию (4:3)" },
};

export const GALLERY_KIND_OPTIONS: GalleryKind[] = [
  "default",
  "surgery",
  "ultrasound",
  "patient",
  "patient-full",
  "urology",
  "urology-closeup",
  "infographic",
  "anatomy",
];

// Регулярное выражение для замены сегмента типа в имени файла.
export const KIND_SEGMENT_RE =
  /-(normal|surgery|ultrasound|patient-full|patient|urology-closeup|urology|infographic|anatomy|default)-/i;

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

/** Автокадрирование по правилу типа. Возвращает JPEG-blob. */
export async function processImageByKind(source: Blob, kind: GalleryKind): Promise<Blob> {
  const rule = GALLERY_KINDS[kind] || GALLERY_KINDS.default;
  const img = await loadImageFromBlob(source);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  let sx = 0, sy = 0, sw = srcW, sh = srcH;
  if (rule.ratio !== null) {
    const srcRatio = srcW / srcH;
    if (srcRatio > rule.ratio) {
      sw = Math.round(srcH * rule.ratio);
      sx = Math.round((srcW - sw) / 2);
      sh = srcH; sy = 0;
    } else if (srcRatio < rule.ratio) {
      sh = Math.round(srcW / rule.ratio);
      sw = srcW; sx = 0;
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
