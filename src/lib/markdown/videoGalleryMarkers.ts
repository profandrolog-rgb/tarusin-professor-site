// Маркер видеогалереи для статей. Разбор полностью отделён от фотогалерей
// (src/lib/markdown/galleryMarkers.ts) и не меняет их формат.
//
// Формат маркера:
//   [[VIDEO_GALLERY: caption="Название" | ratio=16:9 | mode=popup | clinical=restricted | key "подпись"]]
//
// Служебные записи стоят первыми в списке и не являются видео:
//   ratio=1:1|3:4|9:16|16:9  — пропорции плитки;
//   mode=popup|overlay       — способ просмотра;
//   clinical=restricted      — медицинская шторка 18+ (отсутствие = шторки нет).
// Запись видео: `ключ@poster=ключ_обложки "подпись"`, где ключ — objectKey
// облака или полный https-URL файла.

import { htmlToMarkdown, markdownToHtml } from "./galleryMarkers";

export type VideoRatio = "1:1" | "3:4" | "9:16" | "16:9";
export type VideoMode = "popup" | "overlay";

export interface VideoGalleryEntry {
  /** objectKey облака или полный https-URL видеофайла. */
  key: string;
  caption: string;
  /** Ключ/URL обложки (пусто — обложка не задана). */
  poster: string;
}

export interface VideoGalleryOptions {
  ratio: VideoRatio;
  mode: VideoMode;
  restricted: boolean;
}

export const VIDEO_GALLERY_RE =
  /\[\[VIDEO_GALLERY:\s*caption\s*=\s*["'“”]([^\]]*?)["'“”]\s*((?:\|[^\]]*)?)\]\]/g;

export const VIDEO_GALLERY_DIV_RE =
  /<div\b(?=[^>]*\bdata-video-gallery-placeholder)([^>]*)>[\s\S]*?<\/div>/gi;

const VIDEO_RATIO_ENTRY_RE = /^ratio\s*=\s*(1:1|3:4|9:16|16:9)$/i;
const VIDEO_MODE_ENTRY_RE = /^mode\s*=\s*(popup|overlay)$/i;
const VIDEO_RESTRICTED_ENTRY_RE =
  /^(?:clinical\s*=\s*restricted|nsfw\s*=\s*(?:1|true|yes))$/i;

/** Пропорции плитки: подпись для интерфейса, CSS aspect-ratio и число плиток в ряд. */
export const VIDEO_RATIO_META: Record<
  VideoRatio,
  { label: string; css: string; cols: number; maxTile: number }
> = {
  "16:9": { label: "16:9 — широкое", css: "16 / 9", cols: 2, maxTile: 860 },
  "1:1": { label: "1:1 — квадрат", css: "1 / 1", cols: 3, maxTile: 420 },
  "3:4": { label: "3:4 — вертикальное", css: "3 / 4", cols: 3, maxTile: 360 },
  "9:16": { label: "9:16 — рост", css: "9 / 16", cols: 4, maxTile: 260 },
};

export const VIDEO_RATIO_OPTIONS: VideoRatio[] = ["16:9", "1:1", "3:4", "9:16"];

export const VIDEO_MODE_META: Record<VideoMode, { label: string; hint: string }> = {
  popup: {
    label: "Во всплывающем контейнере",
    hint: "Видео открывается в окне поверх страницы и остаётся открытым, пока его не закроют.",
  },
  overlay: {
    label: "Плеер поверх страницы",
    hint: "Плеер разворачивается на всю страницу и сам закрывается, когда видео заканчивается.",
  },
};

export const VIDEO_MODE_OPTIONS: VideoMode[] = ["popup", "overlay"];

export const DEFAULT_VIDEO_OPTIONS: VideoGalleryOptions = {
  ratio: "16:9",
  mode: "popup",
  restricted: false,
};

/** Снимает markdown-экранирование с маркеров видеогалерей (Turndown может их «заэкранировать»). */
export function unescapeVideoGalleryMarkers(content: string): string {
  if (!content || !content.includes("VIDEO_GALLERY")) return content;
  return content.replace(
    /\\?\[\\?\[VIDEO_GALLERY:[\s\S]*?\\?\]\\?\]/g,
    (m) => m.replace(/\\(?=[[\]"'|*_`~])/g, ""),
  );
}

function splitPoster(token: string): { key: string; poster: string } {
  const i = token.toLowerCase().indexOf("@poster=");
  if (i < 0) return { key: token.trim(), poster: "" };
  return { key: token.slice(0, i).trim(), poster: token.slice(i + 8).trim() };
}

function parseVideoEntry(raw: string): VideoGalleryEntry {
  const s = raw.trim();
  const quoted = s.match(/^(\S+)\s+["'“”]([\s\S]*)["'“”]\s*$/);
  if (quoted) {
    const { key, poster } = splitPoster(quoted[1]);
    return { key, poster, caption: quoted[2].replace(/["'“”]/g, "").trim() };
  }
  const sp = s.indexOf(" ");
  if (sp > 0) {
    const { key, poster } = splitPoster(s.slice(0, sp));
    return { key, poster, caption: s.slice(sp + 1).replace(/["'“”]/g, "").trim() };
  }
  const { key, poster } = splitPoster(s);
  return { key, poster, caption: "" };
}

/** Разбирает «хвост» маркера в записи, отбрасывая служебные и повторяющиеся. */
export function parseVideoGalleryEntries(raw: string): VideoGalleryEntry[] {
  const seen = new Set<string>();
  const out: VideoGalleryEntry[] = [];
  for (const part of (raw || "").split("|")) {
    const token = part.trim();
    if (!token) continue;
    const e = parseVideoEntry(token);
    if (!e.key) continue;
    const k = e.key.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

/** Отделяет служебные записи (пропорции, режим, шторка) от списка видео. */
export function extractVideoGalleryOptions(entries: VideoGalleryEntry[]): {
  options: VideoGalleryOptions;
  entries: VideoGalleryEntry[];
} {
  const options: VideoGalleryOptions = { ...DEFAULT_VIDEO_OPTIONS };
  const rest: VideoGalleryEntry[] = [];
  for (const e of entries) {
    const r = e.key.match(VIDEO_RATIO_ENTRY_RE);
    if (r) {
      options.ratio = r[1].replace(/^(\d+)$/, "$1") as VideoRatio;
      continue;
    }
    const m = e.key.match(VIDEO_MODE_ENTRY_RE);
    if (m) {
      options.mode = m[1].toLowerCase() as VideoMode;
      continue;
    }
    if (VIDEO_RESTRICTED_ENTRY_RE.test(e.key)) {
      options.restricted = true;
      continue;
    }
    rest.push(e);
  }
  return { options, entries: rest };
}

/** Возвращает записи со служебными записями в начале (пропорции, режим, шторка). */
export function withVideoGalleryOptions(
  entries: VideoGalleryEntry[],
  options: VideoGalleryOptions,
): VideoGalleryEntry[] {
  const clean = extractVideoGalleryOptions(entries).entries;
  const service: VideoGalleryEntry[] = [
    { key: `ratio=${options.ratio}`, caption: "", poster: "" },
    { key: `mode=${options.mode}`, caption: "", poster: "" },
  ];
  if (options.restricted) {
    service.push({ key: "clinical=restricted", caption: "", poster: "" });
  }
  return [...service, ...clean];
}

function formatVideoEntry(e: VideoGalleryEntry): string {
  const safeCaption = (e.caption || "").replace(/["'“”]/g, "").replace(/\|/g, "／").trim();
  const token = e.poster ? `${e.key}@poster=${e.poster}` : e.key;
  return safeCaption ? `${token} "${safeCaption}"` : token;
}

/** Собирает строку маркера из подписи, записей и параметров показа. */
export function buildVideoGalleryMarker(
  caption: string,
  entries: VideoGalleryEntry[],
  options?: VideoGalleryOptions,
): string {
  const safeCaption = (caption || "").replace(/["'“”]/g, "'");
  const list = options ? withVideoGalleryOptions(entries, options) : entries;
  const seen = new Set<string>();
  const unique = list.filter((e) => {
    if (!e.key) return false;
    const k = e.key.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const body = unique.map(formatVideoEntry);
  return `[[VIDEO_GALLERY: caption="${safeCaption}"${body.length ? ` | ${body.join(" | ")}` : ""}]]`;
}

/* ------------------------------------------------------------------ *
 * Чтение и замена маркеров в контенте статьи.
 * ------------------------------------------------------------------ */

function readHtmlAttr(attrs: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = attrs.match(re);
  return decodeHtml(m?.[1] || m?.[2] || m?.[3] || "");
}

function decodeHtml(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface VideoGalleryHit {
  marker: string;
  caption: string;
  raw: string;
}

/** Находит все маркеры видеогалерей: и текстовые, и HTML-плашки редактора. */
export function findVideoGalleries(content: string): VideoGalleryHit[] {
  const src = unescapeVideoGalleryMarkers(content || "");
  if (!src) return [];
  const hits: VideoGalleryHit[] = [];

  const re = new RegExp(VIDEO_GALLERY_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    hits.push({ marker: m[0], caption: m[1] || "", raw: m[2] || "" });
  }

  const divRe = new RegExp(VIDEO_GALLERY_DIV_RE.source, "gi");
  let d: RegExpExecArray | null;
  while ((d = divRe.exec(src)) !== null) {
    const attrs = d[1] || "";
    hits.push({
      marker: d[0],
      caption: readHtmlAttr(attrs, "data-caption"),
      raw: readHtmlAttr(attrs, "data-files"),
    });
  }
  return hits;
}

export interface VideoGallerySegment {
  type: "video-gallery";
  marker: string;
  caption: string;
  entries: VideoGalleryEntry[];
  options: VideoGalleryOptions;
}

/** Разбирает контент статьи на видеогалереи (для рендера читателю). */
export function parseVideoGalleries(content: string): VideoGallerySegment[] {
  return findVideoGalleries(content).map((h) => {
    const parsed = extractVideoGalleryOptions(parseVideoGalleryEntries(h.raw));
    return {
      type: "video-gallery" as const,
      marker: h.marker,
      caption: h.caption,
      entries: parsed.entries,
      options: parsed.options,
    };
  });
}

/** Заменяет маркер той же подписи (или добавляет в конец), возвращает найден ли он. */
export function upsertVideoGalleryMarker(
  content: string,
  caption: string,
  entries: VideoGalleryEntry[],
  options: VideoGalleryOptions,
  exactMarker?: string,
): { content: string; found: boolean } {
  const next = buildVideoGalleryMarker(caption, entries, options);
  if (exactMarker && content.includes(exactMarker)) {
    return { content: content.split(exactMarker).join(next), found: true };
  }
  const re = new RegExp(VIDEO_GALLERY_RE.source, "g");
  let found = false;
  let out = content.replace(re, (match, markerCaption: string) => {
    if ((markerCaption || "") !== caption) return match;
    found = true;
    return next;
  });
  const divRe = new RegExp(VIDEO_GALLERY_DIV_RE.source, "gi");
  out = out.replace(divRe, (match, attrs: string) => {
    if (readHtmlAttr(attrs || "", "data-caption") !== caption) return match;
    found = true;
    return next;
  });
  if (found) return { content: out, found };
  return { content: `${content}\n\n${next}`, found: false };
}

/** Удаляет маркер видеогалереи из контента (файлы в хранилище не трогаем). */
export function removeVideoGalleryMarker(
  content: string,
  exactMarker: string | undefined,
  caption: string,
): { content: string; found: boolean } {
  let range: { start: number; end: number } | null = null;
  if (exactMarker) {
    const i = content.indexOf(exactMarker);
    if (i >= 0) range = { start: i, end: i + exactMarker.length };
  }
  if (!range) {
    const re = new RegExp(VIDEO_GALLERY_RE.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      if ((m[1] || "") === caption) {
        range = { start: m.index, end: m.index + m[0].length };
        break;
      }
    }
  }
  if (!range) return { content, found: false };
  const next = `${content.slice(0, range.start)}\n\n${content.slice(range.end)}`;
  return { content: next.replace(/\n{3,}/g, "\n\n").trim(), found: true };
}

/* ------------------------------------------------------------------ *
 * Двусторонняя конвертация для редактора (Tiptap).
 * Фотогалерейные правила не трогаем: видеоплашки защищаем токенами.
 * ------------------------------------------------------------------ */

const VIDEO_TOKEN_OPEN = "\uE060VIDGAL\uE061";
const VIDEO_TOKEN_CLOSE = "\uE062";
const VIDEO_TOKEN_RE = /\uE060VIDGAL\uE061([0-9a-f]*)\uE062/g;

function toHex(s: string): string {
  return Array.from(s)
    .map((ch) => ch.codePointAt(0)!.toString(16).padStart(6, "0"))
    .join("");
}

function fromHex(hex: string): string {
  let out = "";
  for (let i = 0; i + 6 <= hex.length; i += 6) {
    out += String.fromCodePoint(parseInt(hex.slice(i, i + 6), 16));
  }
  return out;
}

/** markdown → HTML для Tiptap: маркер видеогалереи становится плашкой редактора. */
export function videoMarkdownToHtml(md: string): string {
  if (!md) return "";
  const withDivs = unescapeVideoGalleryMarkers(md).replace(
    new RegExp(VIDEO_GALLERY_RE.source, "g"),
    (_m, caption: string, raw: string) =>
      `\n\n<div data-video-gallery-placeholder data-caption="${escapeHtml(caption || "")}" data-files="${escapeHtml(
        (raw || "").replace(/^\|/, "").trim(),
      )}">Видеогалерея</div>\n\n`,
  );
  return markdownToHtml(withDivs);
}

/** HTML → markdown: плашка редактора возвращается в маркер без экранирования. */
export function videoHtmlToMarkdown(html: string): string {
  if (!html) return "";
  const tokens = new Map<string, string>();
  const protectedHtml = html.replace(
    new RegExp(VIDEO_GALLERY_DIV_RE.source, "gi"),
    (_m, attrs: string) => {
      const caption = readHtmlAttr(attrs || "", "data-caption");
      const raw = readHtmlAttr(attrs || "", "data-files");
      const parsed = extractVideoGalleryOptions(parseVideoGalleryEntries(raw));
      const marker = buildVideoGalleryMarker(caption, parsed.entries, parsed.options);
      const token = `${VIDEO_TOKEN_OPEN}${toHex(marker)}${VIDEO_TOKEN_CLOSE}`;
      tokens.set(token, marker);
      return `\n\n<p>${token}</p>\n\n`;
    },
  );
  const md = htmlToMarkdown(protectedHtml);
  return md.replace(new RegExp(VIDEO_TOKEN_RE.source, "g"), (t) => tokens.get(t) ?? t);
}
