/**
 * Кадрирование фото в галереях без перезаписи файла в хранилище.
 *
 * Спецификация хранится в маркере галереи рядом с именем файла:
 *   `photo.jpg@crop=50,30,1.2,cover,4x3 "подпись"`
 * где значения — точка фокуса в процентах (x, y), масштаб (zoom),
 * режим (`cover` — заполнить кадр, `contain` — вписать целиком)
 * и пропорции кадра (`4x3`, `1x1`, `16x9`, `orig` — по картинке).
 *
 * Такой формат не меняет структуру `[[GALLERY: ...]]`: имя файла остаётся
 * первым токеном записи, а всё после `@` — служебные параметры показа.
 */

export type CropFit = "cover" | "contain";

export interface CropSpec {
  /** Точка фокуса по горизонтали, % (0–100). */
  x: number;
  /** Точка фокуса по вертикали, % (0–100). */
  y: number;
  /** Масштаб (1 — без увеличения). */
  zoom: number;
  /** Режим вписывания. */
  fit: CropFit;
  /** Пропорции кадра: `4x3`, `1x1`, `3x4`, `16x9`, `3x2` или `orig`. */
  ratio: string;
}

export const DEFAULT_CROP: CropSpec = {
  x: 50,
  y: 50,
  zoom: 1,
  fit: "cover",
  ratio: "4x3",
};

export const CROP_RATIO_OPTIONS: { value: string; label: string; css: string | null }[] = [
  { value: "4x3", label: "4:3 (по умолчанию)", css: "4 / 3" },
  { value: "3x2", label: "3:2", css: "3 / 2" },
  { value: "1x1", label: "1:1 квадрат", css: "1 / 1" },
  { value: "3x4", label: "3:4 вертикальное", css: "3 / 4" },
  { value: "9x16", label: "9:16 в рост", css: "9 / 16" },
  { value: "16x9", label: "16:9 широкое", css: "16 / 9" },
  { value: "orig", label: "Оригинал (без обрезки)", css: null },
];

/** CSS-значение aspect-ratio для пропорций кадра (null — по картинке). */
export function ratioToCss(ratio: string): string | null {
  const found = CROP_RATIO_OPTIONS.find((o) => o.value === ratio);
  if (found) return found.css;
  const m = ratio.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/i);
  return m ? `${m[1]} / ${m[2]}` : null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** Разбирает токен `crop=50,30,1.2,cover,4x3`. Возвращает null, если токен не наш. */
export function parseCropToken(token: string | undefined | null): CropSpec | null {
  if (!token) return null;
  const m = token.trim().match(/^crop\s*=\s*(.+)$/i);
  if (!m) return null;
  const parts = m[1].split(",").map((s) => s.trim());
  const x = Number(parts[0]);
  const y = Number(parts[1]);
  const zoom = Number(parts[2]);
  const fit = (parts[3] || "").toLowerCase() === "contain" ? "contain" : "cover";
  const ratio = parts[4] || DEFAULT_CROP.ratio;
  return {
    x: Number.isFinite(x) ? clamp(x, 0, 100) : 50,
    y: Number.isFinite(y) ? clamp(y, 0, 100) : 50,
    zoom: Number.isFinite(zoom) ? clamp(zoom, 1, 4) : 1,
    fit,
    ratio,
  };
}

/** Собирает токен `crop=...`; для дефолтных значений возвращает пустую строку. */
export function formatCropToken(spec: CropSpec | null | undefined): string {
  if (!spec) return "";
  if (isDefaultCrop(spec)) return "";
  return `crop=${round(spec.x, 1)},${round(spec.y, 1)},${round(spec.zoom, 2)},${spec.fit},${spec.ratio}`;
}

export function isDefaultCrop(spec: CropSpec): boolean {
  return (
    Math.abs(spec.x - DEFAULT_CROP.x) < 0.5 &&
    Math.abs(spec.y - DEFAULT_CROP.y) < 0.5 &&
    Math.abs(spec.zoom - DEFAULT_CROP.zoom) < 0.01 &&
    spec.fit === DEFAULT_CROP.fit &&
    spec.ratio === DEFAULT_CROP.ratio
  );
}

/**
 * Отделяет имя файла от служебного токена кадрирования:
 * `photo.jpg@crop=...` → `{ filename: "photo.jpg", crop: "crop=..." }`.
 */
export function splitFilenameCrop(token: string): { filename: string; crop: string } {
  const at = token.lastIndexOf("@");
  if (at <= 0) return { filename: token, crop: "" };
  const tail = token.slice(at + 1);
  if (!/^crop\s*=/i.test(tail)) return { filename: token, crop: "" };
  return { filename: token.slice(0, at), crop: tail };
}

/** Склеивает имя файла и токен кадрирования обратно в один токен записи. */
export function joinFilenameCrop(filename: string, crop: string | null | undefined): string {
  return crop ? `${filename}@${crop}` : filename;
}

/** Стили кадра и картинки для заданной спецификации. */
export function cropStyles(spec: CropSpec | null): {
  frame: React.CSSProperties;
  image: React.CSSProperties;
} {
  const s = spec || DEFAULT_CROP;
  const ratioCss = ratioToCss(s.ratio);
  if (s.fit === "contain" || !ratioCss) {
    return {
      frame: ratioCss && s.fit === "contain" ? { aspectRatio: ratioCss } : {},
      image: {
        width: "100%",
        height: ratioCss && s.fit === "contain" ? "100%" : "auto",
        objectFit: "contain",
        display: "block",
      },
    };
  }
  return {
    frame: { aspectRatio: ratioCss },
    image: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: `${s.x}% ${s.y}%`,
      transform: s.zoom !== 1 ? `scale(${s.zoom})` : undefined,
      transformOrigin: `${s.x}% ${s.y}%`,
      display: "block",
    },
  };
}
